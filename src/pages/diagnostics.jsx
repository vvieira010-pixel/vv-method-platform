import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getDiagnoses } from '../lib/workflow.js';

export default function DiagnosticsPage({ students, onNavigate, workspaceQuery = '' }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const dx = await getDiagnoses();
    setDiagnoses(dx || []);
    setLoading(false);
  }

  const effectiveQuery = (search || workspaceQuery || '').trim().toLowerCase();

  const filtered = diagnoses.filter((dx) => {
    const student = students.find(s => s.id === dx.studentId);
    const studentName = String(student?.name || '').toLowerCase();
    if (filterStudent && dx.studentId !== filterStudent) return false;
    if (filterStatus && (dx.status || 'draft') !== filterStatus) return false;
    if (effectiveQuery && !studentName.includes(effectiveQuery)) return false;
    return true;
  });

  const approved = diagnoses.filter(d => d.status === 'approved');
  const drafts = diagnoses.filter(d => (d.status || 'draft') !== 'approved');
  const readyForHomework = approved.length;

  return (
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Diagnosis Pipeline</div>
          <h1 style={S.headline}>Diagnostics Hub</h1>
          <p style={S.sub}>Track every class diagnosis from draft to approved handoff for homework creation.</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('diagnostics:create', {})}>
          <Icon.plus size={14} /> New Diagnosis
        </Button>
      </section>

      <div style={S.kpiGrid}>
        <Kpi label="Total diagnoses" value={diagnoses.length} tone="info" icon={<Icon.diagnose size={15} />} />
        <Kpi label="Draft queue" value={drafts.length} tone="warning" icon={<Icon.spark size={15} />} />
        <Kpi label="Approved" value={approved.length} tone="success" icon={<Icon.check size={15} />} />
        <Kpi label="Ready for homework" value={readyForHomework} tone="accent" icon={<Icon.homework size={15} />} />
      </div>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={S.filters}>
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name…" />
          <select className="input" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
            <option value="">All students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Loading diagnoses...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>No diagnosis matches current filters.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map(dx => {
            const student = students.find(s => s.id === dx.studentId);
            const approvedCount = dx.sections ? Object.values(dx.sections).filter(s => s.approved).length : 0;
            const totalCount = dx.sections ? Object.keys(dx.sections).length : 0;
            const progressPct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
            const isApproved = dx.status === 'approved';

            return (
              <Card key={dx.id} style={{ padding: 16 }}>
                <div style={S.rowTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar name={student?.name || '?'} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{student?.name || 'Unknown student'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(dx.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Pill tone={isApproved ? 'success' : 'warning'}>{dx.status || 'draft'}</Pill>
                    {totalCount > 0 && <Pill tone="muted">{approvedCount}/{totalCount} sections</Pill>}
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>
                  {dx.classSummary?.slice(0, 180) || 'No summary available yet.'}
                </div>

                {totalCount > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      <span>Approval progress</span>
                      <strong style={{ color: 'var(--accent-deep)' }}>{progressPct}%</strong>
                    </div>
                    <div style={S.progressTrack}>
                      <div style={{ ...S.progressFill, width: `${progressPct}%` }} />
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: dx.studentId, diagnosisId: dx.id })}>
                    {isApproved ? 'View Diagnosis' : 'Review Draft'}
                  </Button>
                  {isApproved && (
                    <Button variant="primary" size="sm" onClick={() => onNavigate('homework:create', { diagnosisId: dx.id, studentId: dx.studentId })}>
                      Generate Homework
                    </Button>
                  )}
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
  const bg = tone === 'success' ? 'var(--success-bg)' : tone === 'warning' ? 'var(--warning-bg)' : tone === 'accent' ? 'var(--accent-subtle)' : 'var(--surface)';
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
    background: 'linear-gradient(130deg, #102131 0%, #1a2f45 45%, #245173 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  progressTrack: { marginTop: 6, height: 8, borderRadius: 999, background: 'var(--bg-deep)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2d8b8b 0%, #7cc9c9 100%)' },
};
