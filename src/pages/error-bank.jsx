import { useState, useEffect } from 'react';
import { Icon, Pill, Avatar } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
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
    <div className="page-container">
      <section className="hero-section hero-section--errors">
        <div>
          <div className="hero-tag">Quality Repository</div>
          <h1 className="page-headline" style={{ color: '#fff' }}>Error Bank Workspace</h1>
          <p className="page-sub" style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620 }}>Track recurring mistakes, move them through practice, and close solved patterns with clear teacher control.</p>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--wide">
        <RepoKpi label="Active patterns" value={activeCount} icon={<Icon.warning size={15} />} tone="danger" />
        <RepoKpi label="Practicing" value={practicingCount} icon={<Icon.spark size={15} />} tone="info" />
        <RepoKpi label="Solved" value={solvedCount} icon={<Icon.check size={15} />} tone="success" />
        <RepoKpi label="Total records" value={errors.length} icon={<Icon.doc size={15} />} tone="neutral" />
      </div>

      <Card className="card-p-3 mb-3">
        <div className="filter-grid">
          <input className="input" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search student, error, correction…" />
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
        <Card className="empty-panel">
          <p style={{ color: 'var(--muted)', margin: 0 }}>Loading error bank…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="empty-panel">
          <p style={{ color: 'var(--muted)', margin: 0 }}>No errors match current filters. Errors are added when diagnosis is approved.</p>
        </Card>
      ) : (
        <div className="grid-square">
          {filtered.map((err) => {
            const student = students.find((s) => s.id === err.studentId);
            return (
              <Card key={err.id} className="square-card">
                <Avatar name={student?.name || '?'} size={40} />
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center', marginTop: 8 }}>{student?.name || 'Unknown student'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>
                  {new Date(err.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 'var(--text-xs)' }}>{err.error}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>to</div>
                  <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: 'var(--text-xs)' }}>{err.correct}</div>
                </div>
                <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {err.status === 'active' && <Button variant="ghost" size="sm" onClick={() => handlePractice(err)}>Practice</Button>}
                  {err.status !== 'solved' && <Button variant="primary" size="sm" onClick={() => handleSolved(err)}>Solved</Button>}
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
      <div className="flex gap-1 items-center">
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <span className="text-2xs text-muted text-uppercase letter-spacing-01">{label}</span>
      </div>
      <div className="td-kpi-value" style={{ marginTop: 8 }}>{value}</div>
    </Card>
  );
}

