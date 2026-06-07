/**
 * students.jsx — Student roster with add/edit/profile navigation
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getStudents, saveStudent, deleteStudent, getActiveTargetProfile, getLatestDiagnosis, getErrorBank } from '../lib/workflow.js';

export default function StudentsPage({ students: propStudents, onNavigate }) {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const s = await getStudents();
    setStudents(s);
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

  async function handleDelete(student) {
    if (!confirm(`Delete ${student.name} and all related classes, diagnoses, homework, submissions, feedback, messages, notes, and drafts? This cannot be undone. Export a backup first if needed.`)) return;
    await deleteStudent(student.id);
    await load();
    window.dispatchEvent(new CustomEvent('vv:students-updated'));
    window.toast?.('Student deleted.', 'info');
  }

  const filtered = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={S.shell}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.headline}>Students</h1>
          <p style={S.sub}>{students.length} student{students.length !== 1 ? 's' : ''} in your roster</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={openAdd}><Icon.plus size={14} /> Add Student</Button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card style={{ marginBottom: 20, padding: 20, border: '2px solid var(--accent)' }}>
          <SectionHeader title={editStudent ? 'Edit Student' : 'New Student'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
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
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : (editStudent ? 'Save Changes' : 'Add Student')}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…" style={{ maxWidth: 320 }} />
      </div>

      {/* Student table */}
      {filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>{search ? 'No students match your search.' : 'No students yet. Add your first student above.'}</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(student => (
            <StudentRow key={student.id} student={student} onProfile={() => onNavigate('students:profile', { studentId: student.id })} onEdit={() => openEdit(student)} onDelete={() => handleDelete(student)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRow({ student, onProfile, onEdit, onDelete }) {
  return (
    <Card style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Avatar name={student.name} size={36} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{student.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
            {student.currentLevel} → {student.targetLevel} · {student.examGoal}
            {student.email && ` · ${student.email}`}
          </div>
        </div>
        <Pill tone="muted">{student.currentLevel}</Pill>
        <Pill tone={student.email ? 'success' : 'warning'}>{student.email ? 'Invite ready' : 'Email needed'}</Pill>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Session {student.session || 1}/{student.totalSessions || 24}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="primary" size="sm" onClick={onProfile}>View Profile</Button>
          <Button variant="ghost" size="sm" onClick={onEdit}><Icon.edit size={13} /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete} style={{ color: 'var(--danger)' }}><Icon.trash size={13} /></Button>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

const LEVELS = ['A2', 'B1', 'B1+', 'B2', 'B2+', 'C1'];
const EMPTY_FORM = { name: '', email: '', currentLevel: 'B1', targetLevel: 'B2', examGoal: 'Pass MET B2', professionalContext: '', notes: '', totalSessions: 24 };
const S = {
  shell: { maxWidth: 960, margin: '0 auto', padding: '28px 20px' },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
};
