/**
 * students.jsx — Student repository workspace
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getStudents, saveStudent, deleteStudent } from '../lib/workflow.js';

export default function StudentsPage({ onNavigate, workspaceQuery = '' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const list = await getStudents();
    setStudents(list || []);
    setLoading(false);
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
    setSaving(true);
    await saveStudent({ ...form, id: editStudent?.id, session: editStudent?.session || 1 });
    await load();
    window.dispatchEvent(new CustomEvent('vv:students-updated'));
    setSaving(false);
    setShowForm(false);
    window.toast?.(editStudent ? 'Student updated.' : 'Student added.', 'ok');
  }

  async function handleDelete(student) {
    if (!confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    await deleteStudent(student.id);
    await load();
    window.dispatchEvent(new CustomEvent('vv:students-updated'));
    window.toast?.('Student deleted.', 'info');
  }

  const effectiveQuery = (search || workspaceQuery || '').trim().toLowerCase();

  const filtered = students.filter((s) => {
    const matchSearch = !effectiveQuery || s.name.toLowerCase().includes(effectiveQuery) || String(s.email || '').toLowerCase().includes(effectiveQuery);
    const matchLevel = !levelFilter || s.currentLevel === levelFilter;
    return matchSearch && matchLevel;
  });

  const avgProgress = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + ((Number(s.session || 1) / Math.max(1, Number(s.totalSessions || 24))) * 100), 0) / students.length)
    : 0;
  const nearTarget = students.filter((s) => Number(s.currentLevel?.replace('+', '.5').replace('A2', '2').replace('B1', '3').replace('B2', '4').replace('C1', '5')) >= Number(s.targetLevel?.replace('+', '.5').replace('A2', '2').replace('B1', '3').replace('B2', '4').replace('C1', '5'))).length;

  return (
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Student Repository</div>
          <h1 style={S.headline}>Students Workspace</h1>
          <p style={S.sub}>Manage records, track session progress, and jump into profile workflows quickly.</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Icon.plus size={14} /> Add Student</Button>
      </section>

      <div style={S.kpiGrid}>
        <RepoKpi label="Total students" value={students.length} icon={<Icon.student size={15} />} />
        <RepoKpi label="Near target level" value={nearTarget} icon={<Icon.progress size={15} />} />
        <RepoKpi label="Average cycle progress" value={`${avgProgress}%`} icon={<Icon.spark size={15} />} />
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20, padding: 20, border: '2px solid var(--accent)' }}>
          <SectionHeader title={editStudent ? 'Edit Student Record' : 'Create Student Record'} />
          <div style={S.formGrid}>
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

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={S.filterGrid}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" />
          <select className="input" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
            <option value="">All current levels</option>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Loading students...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>{effectiveQuery || levelFilter ? 'No students match the current filters.' : 'No students yet. Add your first student above.'}</p>
        </Card>
      ) : (
        <div style={S.repoGrid}>
          {filtered.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onProfile={() => onNavigate('students:profile', { studentId: student.id })}
              onEdit={() => openEdit(student)}
              onDelete={() => handleDelete(student)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RepoKpi({ label, value, icon }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-deep)' }}>{value}</div>
    </Card>
  );
}

function StudentCard({ student, onProfile, onEdit, onDelete }) {
  const session = Number(student.session || 1);
  const total = Math.max(1, Number(student.totalSessions || 24));
  const pct = Math.min(100, Math.round((session / total) * 100));

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={student.name} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{student.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
            {student.currentLevel} → {student.targetLevel} · {student.examGoal}
          </div>
        </div>
        <Pill tone="info">{student.currentLevel}</Pill>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {student.email && <div style={S.metaLine}><Icon.inbox size={12} /> {student.email}</div>}
        {student.professionalContext && <div style={S.metaLine}><Icon.doc size={12} /> {student.professionalContext}</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          <span>Session progress</span>
          <strong style={{ color: 'var(--accent-deep)' }}>{session}/{total}</strong>
        </div>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="primary" size="sm" onClick={onProfile}>Open Profile</Button>
        <Button variant="ghost" size="sm" onClick={onEdit}><Icon.edit size={13} /></Button>
        <Button variant="ghost" size="sm" onClick={onDelete} style={{ color: 'var(--danger)' }}><Icon.trash size={13} /></Button>
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
  shell: { maxWidth: 1120, margin: '0 auto', padding: '28px 20px' },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
    padding: 18,
    borderRadius: 4,
    background: 'linear-gradient(130deg, #0f2438 0%, #17344b 50%, #1f4f66 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
  repoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 10 },
  metaLine: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-2)' },
  progressTrack: { marginTop: 6, height: 8, borderRadius: 999, background: 'var(--bg-deep)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2d8b8b 0%, #7cc9c9 100%)' },
};
