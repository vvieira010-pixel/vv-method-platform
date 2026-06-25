/**
 * students.jsx — Student roster with add/edit/profile navigation
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getStudents, saveStudent, deleteStudent, getDiagnoses, getHomework, getAllSubmissions, getClassEvents } from '../lib/workflow.js';
import { sendMagicLink } from '../lib/supabase-storage.js';
import { getDbContext } from '../lib/supabase-db.js';

export default function StudentsPage({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [studentActions, setStudentActions] = useState({});
  const [inviteStatus, setInviteStatus] = useState({});
  const [setup, setSetup] = useState(null); // { id, pwd, busy, result }

  useEffect(() => { load(); }, []);

  async function load() {
    const [s, diagnoses, homework, submissions, classEvents] = await Promise.all([
      getStudents(),
      getDiagnoses(),
      getHomework(),
      getAllSubmissions(),
      getClassEvents(),
    ]);
    setStudents(s);
    setStudentActions(buildStudentActions(s, { diagnoses, homework, submissions, classEvents }));
  }

  function openAdd() {
    setEditStudent(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(student) {
    setEditStudent(student);
    setForm({
      name: student.name || '',
      email: student.email || '',
      currentLevel: student.currentLevel || 'B1',
      targetLevel: student.targetLevel || 'B2',
      examGoal: student.examGoal || 'Pass MET B2',
      professionalContext: student.professionalContext || '',
      notes: student.notes || '',
      totalSessions: student.totalSessions || 24,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { window.toast?.('Name is required.', 'warn'); return; }
    if (!form.email.trim()) { window.toast?.('Student email is required for login.', 'warn'); return; }
    setSaving(true);
    await saveStudent({ ...form, id: editStudent?.id, session: editStudent?.session || 1 });
    await load();
    window.dispatchEvent(new CustomEvent('vv:students-updated'));
    setSaving(false);
    setShowForm(false);
    window.toast?.(editStudent ? 'Student updated. Invite email is ready.' : 'Student added. Invite email is ready.', 'ok');
  }

  async function handleInvite(student) {
    if (!student.email) { window.toast?.('Add the student\'s email first.', 'warn'); return; }
    setInviteStatus(s => ({ ...s, [student.id]: 'sending' }));
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      await sendMagicLink(student.email.trim(), redirectTo, { createUser: true });
      setInviteStatus(s => ({ ...s, [student.id]: 'sent' }));
      window.toast?.(`Login link sent to ${student.email}`, 'ok');
      setTimeout(() => setInviteStatus(s => ({ ...s, [student.id]: null })), 8000);
    } catch (err) {
      setInviteStatus(s => ({ ...s, [student.id]: 'error' }));
      window.toast?.(`Could not send invite: ${err.message}`, 'error');
      setTimeout(() => setInviteStatus(s => ({ ...s, [student.id]: null })), 5000);
    }
  }

  function openSetup(student) {
    setSetup({ id: student.id, pwd: genPassword(), busy: false, result: null });
  }

  async function handleCreateAccount(student) {
    if (!setup) return;
    setSetup(s => ({ ...s, busy: true, result: null }));
    try {
      const ctx = getDbContext();
      if (!ctx) throw new Error('Sign in as teacher first.');
      const res = await fetch(`${ctx.url}/functions/v1/invite-student`, {
        method: 'POST',
        headers: {
          apikey: ctx.anonKey,
          Authorization: `Bearer ${ctx.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: student.email.trim(), name: student.name, firstName: student.firstName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Error ${res.status}`);
      setSetup(s => ({ ...s, busy: false, result: { ok: true, email: student.email, password: data.password, emailSent: data.emailSent } }));
      window.toast?.(`Account created for ${student.name}${data.emailSent ? ' — email sent!' : ''}`, 'ok');
    } catch (err) {
      setSetup(s => ({ ...s, busy: false, result: { ok: false, error: err.message } }));
    }
  }

  async function handleDelete(student) {
    if (!confirm(`Delete ${student.name} and all related classes, diagnoses, homework, submissions, feedback, messages, notes, and drafts? This cannot be undone. Export a backup first if needed.`)) return;
    await deleteStudent(student.id);
    await load();
    window.dispatchEvent(new CustomEvent('vv:students-updated'));
    window.toast?.('Student deleted.', 'info');
  }

  const filtered = students.filter(s =>
    !search || (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-shell">
      <SectionHeader
        title="Students"
        sub={`${students.length} student${students.length !== 1 ? 's' : ''} in your roster`}
        action={<Button variant="primary" onClick={openAdd}><Icon.plus size={14} /> Add Student</Button>}
      />

      {/* Add/Edit form */}
      {showForm && (
        <Card className="card-form">
          <SectionHeader title={editStudent ? 'Edit Student' : 'New Student'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Field label="Full name *">
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, firstName: e.target.value.split(' ')[0] }))} placeholder="e.g. Ana Paula" autoFocus />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@email.com" />
            </Field>
            <Field label="Current level">
              <select className="input" value={form.currentLevel} onChange={e => setForm(f => ({ ...f, currentLevel: e.target.value }))}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Target level">
              <select className="input" value={form.targetLevel} onChange={e => setForm(f => ({ ...f, targetLevel: e.target.value }))}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Exam goal">
              <input className="input" value={form.examGoal} onChange={e => setForm(f => ({ ...f, examGoal: e.target.value }))} placeholder="Pass MET B2" />
            </Field>
            <Field label="Total sessions">
              <input className="input" type="number" min={1} max={100} value={form.totalSessions} onChange={e => setForm(f => ({ ...f, totalSessions: Number(e.target.value) }))} />
            </Field>
            <Field label="Professional context" style={{ gridColumn: '1 / -1' }}>
              <input className="input" value={form.professionalContext} onChange={e => setForm(f => ({ ...f, professionalContext: e.target.value }))} placeholder="e.g. Nurse, engineer, student..." />
            </Field>
            <Field label="Notes" style={{ gridColumn: '1 / -1' }}>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : (editStudent ? 'Save Changes' : 'Add Student')}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="page-filters">
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…" style={{ maxWidth: 320 }} />
      </div>

      {/* Student table */}
      {filtered.length === 0 ? (
        <Card className="page-empty-state">
          <p style={{ color: 'var(--muted)' }}>{search ? 'No students match your search.' : 'No students yet. Add your first student above.'}</p>
        </Card>
      ) : (
        <div className="page-list">
          {filtered.map(student => (
            <StudentRow
              key={student.id}
              student={student}
              nextAction={studentActions[student.id]}
              inviteStatus={inviteStatus[student.id]}
              setupState={setup?.id === student.id ? setup : null}
              onProfile={() => onNavigate('students:profile', { studentId: student.id })}
              onEdit={() => openEdit(student)}
              onDelete={() => handleDelete(student)}
              onInvite={() => handleInvite(student)}
              onOpenSetup={() => openSetup(student)}
              onCloseSetup={() => setSetup(null)}
              onSetupPwd={pwd => setSetup(s => ({ ...s, pwd, result: null }))}
              onCreateAccount={() => handleCreateAccount(student)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let p = 'Met-';
  for (let i = 0; i < 6; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

function copyText(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function StudentRow({ student, nextAction, inviteStatus, setupState, onProfile, onEdit, onDelete, onInvite, onOpenSetup, onCloseSetup, onSetupPwd, onCreateAccount }) {
  const action = nextAction || { label: 'Ready for next class', tone: 'success' };
  const isSending = inviteStatus === 'sending';
  const isSent = inviteStatus === 'sent';
  const isSetupOpen = Boolean(setupState);
  const result = setupState?.result;

  return (
    <Card>
      <div className="card-row">
        <Avatar name={student.name} size={36} />
        <div className="card-row-body">
          <div className="card-row-title">{student.name}</div>
          <div className="card-row-meta">
            {student.currentLevel} → {student.targetLevel} · {student.examGoal}
            {student.email && ` · ${student.email}`}
          </div>
        </div>
        <Pill tone="muted">{student.currentLevel}</Pill>
        <Pill tone={action.tone}>{action.label}</Pill>
        <span className="card-row-meta">Session {student.session || 1}/{student.totalSessions || 24}</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={onProfile}>View Profile</Button>
          {student.email && (
            <Button variant="ghost" size="sm" onClick={isSetupOpen ? onCloseSetup : onOpenSetup}
              style={isSetupOpen ? { color: 'var(--accent)' } : {}}>
              {isSetupOpen ? 'Cancel setup' : 'Set up account'}
            </Button>
          )}
          {student.email && (
            <Button variant="ghost" size="sm" onClick={onInvite} disabled={isSending || isSent}
              title={`Send login link to ${student.email}`}
              style={isSent ? { color: 'var(--success)' } : {}}>
              {isSending ? 'Sending…' : isSent ? '✓ Link sent' : 'Send login link'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}><Icon.edit size={13} /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete} style={{ color: 'var(--danger)' }}><Icon.trash size={13} /></Button>
        </div>
      </div>

      {/* Account setup panel */}
      {isSetupOpen && (
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          {result?.ok ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--success)', margin: 0 }}>
                ✓ Account created for {student.name}
                {result.emailSent && ' — login email sent to their inbox!'}
              </p>
              <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', lineHeight: 2 }}>
                <div><strong>Login (email):</strong> {result.email}</div>
                <div><strong>Password:</strong> {result.password}</div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" onClick={() => {
                  copyText(`Login: ${result.email}\nPassword: ${result.password}`);
                  window.toast?.('Credentials copied!', 'ok');
                }}>
                  Copy credentials
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  const msg = `Hi ${student.firstName || student.name.split(' ')[0]}! Here are your login credentials for the MET Proficiency Mastery platform:\n\nWebsite: https://met-mastery.vercel.app\nEmail: ${result.email}\nPassword: ${result.password}\n\nAfter logging in, go to Settings to change your password if you'd like.`;
                  copyText(msg);
                  window.toast?.('WhatsApp message copied!', 'ok');
                }}>
                  Copy WhatsApp message
                </Button>
                <Button variant="ghost" size="sm" onClick={onCloseSetup}>Done</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: 0 }}>
                Create a login for <strong>{student.name}</strong> ({student.email}). You can use the generated password or type your own.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="input"
                  style={{ maxWidth: 240 }}
                  value={setupState.pwd}
                  onChange={e => onSetupPwd(e.target.value)}
                  placeholder="Password (min. 6 chars)"
                  disabled={setupState.busy}
                />
                <Button variant="ghost" size="sm" onClick={() => onSetupPwd(genPassword())} disabled={setupState.busy}>
                  Regenerate
                </Button>
              </div>
              {result?.error && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)', margin: 0 }}>
                  {result.error.includes('email confirmation') ? (
                    <>Email confirmation is ON in Supabase. Go to <strong>Supabase → Auth → Providers → Email</strong> and turn off "Confirm email", then try again.</>
                  ) : result.error}
                </p>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" size="sm" onClick={onCreateAccount} disabled={setupState.busy || !setupState.pwd}>
                  {setupState.busy ? 'Creating…' : 'Create account'}
                </Button>
                <Button variant="ghost" size="sm" onClick={onCloseSetup} disabled={setupState.busy}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function buildStudentActions(students, { diagnoses = [], homework = [], submissions = [], classEvents = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const doneHomeworkStatuses = new Set(['submitted', 'reviewed', 'completed', 'corrected']);
  return Object.fromEntries(students.map(student => {
    const studentId = student.id;
    const hasPendingSubmission = submissions.some(s => s.studentId === studentId && s.status === 'submitted');
    if (hasPendingSubmission) return [studentId, { label: 'Review submission', tone: 'danger' }];

    const hasApprovedDiagnosis = diagnoses.some(dx => dx.studentId === studentId && dx.status === 'approved');
    const hasDraftDiagnosis = diagnoses.some(dx => dx.studentId === studentId && (dx.status || 'draft') !== 'approved');
    if (!hasApprovedDiagnosis && hasDraftDiagnosis) return [studentId, { label: 'Finish diagnosis', tone: 'warning' }];
    if (!hasApprovedDiagnosis) return [studentId, { label: 'Needs diagnosis', tone: 'warning' }];

    const pendingHomework = homework.some(h => h.studentId === studentId && !doneHomeworkStatuses.has(h.status));
    if (pendingHomework) return [studentId, { label: 'Homework pending', tone: 'info' }];

    const nextClass = classEvents
      .filter(e => e.studentId === studentId && e.status !== 'canceled')
      .map(e => ({ ...e, startAt: new Date(`${e.date || new Date().toISOString().slice(0, 10)}T${e.startTime || '00:00'}`) }))
      .filter(e => e.startAt >= today)
      .sort((a, b) => a.startAt - b.startAt)[0];
    if (nextClass) return [studentId, { label: 'Next class set', tone: 'success' }];

    return [studentId, { label: 'Plan next class', tone: 'muted' }];
  }));
}

function Field({ label, children, style }) {
  return (
    <label className="field" style={style}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

const LEVELS = ['A2', 'B1', 'B1+', 'B2', 'B2+', 'C1'];
const EMPTY_FORM = { name: '', email: '', currentLevel: 'B1', targetLevel: 'B2', examGoal: 'Pass MET B2', professionalContext: '', notes: '', totalSessions: 24 };

