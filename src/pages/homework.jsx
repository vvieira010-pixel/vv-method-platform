import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getHomework, deleteHomework } from '../lib/workflow.js';

const STATUS_TONE = {
  'not-started': 'muted',
  'in-progress': 'info',
  submitted: 'warning',
  corrected: 'success',
  reviewed: 'success',
  completed: 'success',
};

export default function HomeworkPage({ students, onNavigate, workspaceQuery = '' }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    setHomework((await getHomework()) || []);
    setLoading(false);
  }

  const now = Date.now();
  const overdueCount = homework.filter((h) => h.dueDate && !['reviewed', 'completed', 'corrected'].includes(h.status) && new Date(h.dueDate).getTime() < now).length;
  const submittedCount = homework.filter((h) => h.status === 'submitted').length;
  const reviewedCount = homework.filter((h) => ['reviewed', 'corrected', 'completed'].includes(h.status)).length;

  const effectiveQuery = (search || workspaceQuery || '').trim().toLowerCase();

  const filtered = homework.filter((h) => {
    const student = students.find((s) => s.id === h.studentId);
    const studentName = String(student?.name || '').toLowerCase();
    const title = String(h.title || '').toLowerCase();
    if (filterStudent && h.studentId !== filterStudent) return false;
    if (filterStatus && h.status !== filterStatus) return false;
    if (effectiveQuery && !studentName.includes(effectiveQuery) && !title.includes(effectiveQuery)) return false;
    return true;
  });

  return (
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Homework Operations</div>
          <h1 style={S.headline}>Homework Repository</h1>
          <p style={S.sub}>Assign, monitor, and review homework aligned to diagnosis priorities.</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('homework:create', {})}><Icon.plus size={14} /> Create Homework</Button>
      </section>

      <div style={S.kpiGrid}>
        <Kpi label="Total assigned" value={homework.length} tone="info" icon={<Icon.homework size={15} />} />
        <Kpi label="Submitted" value={submittedCount} tone="warning" icon={<Icon.doc size={15} />} />
        <Kpi label="Reviewed" value={reviewedCount} tone="success" icon={<Icon.check size={15} />} />
        <Kpi label="Overdue" value={overdueCount} tone="danger" icon={<Icon.warning size={15} />} />
      </div>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={S.filters}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or homework title…" />
          <select className="input" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
            <option value="">All students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['not-started', 'in-progress', 'submitted', 'reviewed', 'corrected', 'completed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Loading homework...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No homework matches current filters.</p>
        </Card>
      ) : (
        <div style={S.repoGrid}>
          {filtered.map(h => {
            const student = students.find(s => s.id === h.studentId);
            const isOverdue = h.dueDate && !['reviewed', 'completed', 'corrected'].includes(h.status) && new Date(h.dueDate).getTime() < now;
            const dueLabel = h.dueDate ? new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No due date';
            const assignedLabel = new Date(h.assignedAt || h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

            return (
              <Card key={h.id} style={{ padding: 16 }}>
                <div style={S.rowTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar name={student?.name || '?'} size={38} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{h.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                        {student?.name || 'Unknown student'} · {h.type || h.skillType || 'mixed'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Pill tone={isOverdue ? 'danger' : (STATUS_TONE[h.status] || 'muted')}>{isOverdue ? 'overdue' : h.status}</Pill>
                    {h.status === 'submitted' && (
                      <Button variant="primary" size="sm" onClick={() => onNavigate('submissions', {})}>Review</Button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'grid', gap: 7 }}>
                  <div style={S.metaLine}><Icon.calendar size={12} /> Assigned {assignedLabel}</div>
                  <div style={S.metaLine}><Icon.calendar size={12} /> Due {dueLabel}</div>
                  {h.objective && <div style={S.metaLine}><Icon.spark size={12} /> {String(h.objective).slice(0, 120)}</div>}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('homework:create', { studentId: h.studentId, diagnosisId: h.diagnosisId })}>Create Similar</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={async () => { if (confirm('Delete this homework?')) { await deleteHomework(h.id); load(); } }}
                  >
                    <Icon.trash size={12} /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon, tone }) {
  const bg = tone === 'success' ? 'var(--success-bg)' : tone === 'warning' ? 'var(--warning-bg)' : tone === 'danger' ? 'var(--danger-bg)' : 'var(--surface)';
  return (
    <Card style={{ padding: 14, background: bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-deep)' }}>{value}</div>
    </Card>
  );
}

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
    background: 'linear-gradient(130deg, #102131 0%, #1c344a 45%, #20597e 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 },
  repoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaLine: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-2)' },
};
