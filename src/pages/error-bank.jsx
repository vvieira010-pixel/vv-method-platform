import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getErrorBank, markErrorSolved, markErrorPracticed } from '../lib/workflow.js';

const STATUS_TONE = { active: 'danger', practicing: 'info', solved: 'success' };

export default function ErrorBankPage({ students, workspaceQuery = '' }) {
  const [errors, setErrors] = useState([]);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [students]);

  async function load() {
    setLoading(true);
    const all = [];
    for (const s of students) {
      const bank = await getErrorBank(s.id);
      (bank || []).forEach((e) => all.push({ ...e, studentName: s.name, studentId: s.id }));
    }
    setErrors(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setLoading(false);
  }

  async function handlePractice(err) {
    await markErrorPracticed(err.studentId, err.id);
    await load();
    window.toast?.('Error moved to practicing.', 'ok');
  }

  async function handleSolved(err) {
    await markErrorSolved(err.studentId, err.id);
    await load();
    window.toast?.('Error marked as solved.', 'ok');
  }

  const query = (localSearch || workspaceQuery || '').trim().toLowerCase();
  const filtered = errors.filter((e) => {
    if (filterStudent && e.studentId !== filterStudent) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterType && e.type !== filterType) return false;
    if (query) {
      const haystack = `${e.studentName || ''} ${e.error || ''} ${e.correct || ''} ${e.explanation || ''} ${e.type || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const activeCount = errors.filter((e) => e.status === 'active').length;
  const practicingCount = errors.filter((e) => e.status === 'practicing').length;
  const solvedCount = errors.filter((e) => e.status === 'solved').length;

  return (
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Quality Repository</div>
          <h1 style={S.headline}>Error Bank Workspace</h1>
          <p style={S.sub}>Track recurring mistakes, move them through practice, and close solved patterns with clear teacher control.</p>
        </div>
      </section>

      <div style={S.kpiGrid}>
        <RepoKpi label="Active patterns" value={activeCount} icon={<Icon.warning size={15} />} tone="danger" />
        <RepoKpi label="Practicing" value={practicingCount} icon={<Icon.spark size={15} />} tone="info" />
        <RepoKpi label="Solved" value={solvedCount} icon={<Icon.check size={15} />} tone="success" />
        <RepoKpi label="Total records" value={errors.length} icon={<Icon.doc size={15} />} tone="neutral" />
      </div>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={S.filterGrid}>
          <input className="input" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search student, error, correction..." />
          <select className="input" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
            <option value="">All students</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="practicing">Practicing</option>
            <option value="solved">Solved</option>
          </select>
          <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {['grammar', 'vocabulary', 'pronunciation', 'register', 'strategy', 'cohesion'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Loading error bank...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>No errors match current filters. Errors are added when diagnosis is approved.</p>
        </Card>
      ) : (
        <div style={S.repoGrid}>
          {filtered.map((err) => {
            const student = students.find((s) => s.id === err.studentId);
            return (
              <Card key={err.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar name={student?.name || '?'} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.rowTitle}>{student?.name || 'Unknown student'}</div>
                    <div style={S.rowSub}>{new Date(err.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <Pill tone="muted">{err.type}</Pill>
                  <Pill tone={STATUS_TONE[err.status] || 'muted'}>{err.status}</Pill>
                </div>

                <div style={S.patternCard}>
                  <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{err.error}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>to</div>
                  <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{err.correct}</div>
                </div>

                <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-xs)', lineHeight: 1.5, margin: '10px 0 0' }}>
                  {err.explanation || 'No explanation saved.'}
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {err.status === 'active' && <Button variant="ghost" size="sm" onClick={() => handlePractice(err)}>Mark Practicing</Button>}
                  {err.status !== 'solved' && <Button variant="primary" size="sm" onClick={() => handleSolved(err)}>Mark Solved</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RepoKpi({ label, value, icon, tone }) {
  const bg = tone === 'success'
    ? 'var(--success-bg)'
    : tone === 'danger'
      ? 'var(--danger-bg)'
      : tone === 'info'
        ? 'var(--accent-subtle)'
        : 'var(--surface)';

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
    background: 'linear-gradient(130deg, #102131 0%, #1a3148 45%, #2e5f75 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0', maxWidth: 620 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 },
  repoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 },
  rowTitle: { fontWeight: 700, fontSize: 'var(--text-md)' },
  rowSub: { fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 },
  patternCard: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 3,
    border: '1px solid var(--divider)',
    background: '#fff',
    display: 'grid',
    gap: 4,
  },
};
