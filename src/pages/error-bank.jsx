import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getErrorBank, markErrorSolved, markErrorPracticed } from '../lib/workflow.js';

const STATUS_TONE = { active: 'danger', practicing: 'info', solved: 'success' };

export default function ErrorBankPage({ students, onNavigate }) {
  const [errors, setErrors] = useState([]);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('');

  useEffect(() => { load(); }, [students]);

  async function load() {
    const all = [];
    for (const s of students) {
      const eb = await getErrorBank(s.id);
      (eb || []).forEach(e => all.push({ ...e, studentName: s.name, studentId: s.id }));
    }
    setErrors(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }

  const filtered = errors.filter(e => {
    if (filterStudent && e.studentId !== filterStudent) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  const activeCount = errors.filter(e => e.status === 'active').length;
  const solvedCount = errors.filter(e => e.status === 'solved').length;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.headline}>Error Bank</h1>
        <p style={S.sub}>{activeCount} active · {errors.filter(e => e.status === 'practicing').length} practicing · {solvedCount} solved</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="input" style={{ maxWidth: 200 }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="practicing">Practicing</option>
          <option value="solved">Solved</option>
        </select>
        <select className="input" style={{ maxWidth: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {['grammar', 'vocabulary', 'pronunciation', 'register', 'strategy', 'cohesion'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>No errors found. Errors are added to the bank when you approve a diagnosis.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(err => {
            const student = students.find(s => s.id === err.studentId);
            return (
              <Card key={err.id} style={{ padding: '12px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Avatar name={student?.name || '?'} size={28} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{err.error}</span>
                      <span style={{ color: 'var(--muted)' }}>→</span>
                      <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>{err.correct}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3 }}>
                      {student?.firstName} · {err.explanation}
                    </div>
                  </div>
                  <Pill tone="muted">{err.type}</Pill>
                  <Pill tone={STATUS_TONE[err.status] || 'muted'}>{err.status}</Pill>
                  {err.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={async () => { await markErrorPracticed(err.studentId, err.id); load(); }}>
                      Mark practicing
                    </Button>
                  )}
                  {err.status !== 'solved' && (
                    <Button variant="ghost" size="sm" onClick={async () => { await markErrorSolved(err.studentId, err.id); load(); }} style={{ color: 'var(--success)' }}>
                      ✓ Solved
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

const S = {
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
};
