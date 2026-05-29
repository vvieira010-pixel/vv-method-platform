import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getDiagnoses, getStudents } from '../lib/workflow.js';

export default function DiagnosticsPage({ students, onNavigate }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const dx = await getDiagnoses();
    setDiagnoses(dx || []);
  }

  const filtered = diagnoses.filter(dx => {
    if (filterStudent && dx.studentId !== filterStudent) return false;
    if (filterStatus && (dx.status || 'draft') !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={S.headline}>Diagnostics</h1>
          <p style={S.sub}>{diagnoses.length} total · {diagnoses.filter(d => d.status === 'approved').length} approved</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('diagnostics:create', {})}>
          <Icon.plus size={14} /> New Diagnosis
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select className="input" style={{ maxWidth: 200 }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
          <option value="">All students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>No diagnoses yet. Run your first diagnosis after a class.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(dx => {
            const student = students.find(s => s.id === dx.studentId);
            const approvedCount = dx.sections ? Object.values(dx.sections).filter(s => s.approved).length : 0;
            const totalCount = dx.sections ? Object.keys(dx.sections).length : 0;
            return (
              <Card key={dx.id} style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Avatar name={student?.name || '?'} size={34} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700 }}>{student?.name || 'Unknown student'}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(dx.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {dx.classSummary ? ` · ${dx.classSummary.slice(0, 60)}…` : ''}
                    </div>
                  </div>
                  {totalCount > 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{approvedCount}/{totalCount} approved</span>}
                  <Pill tone={dx.status === 'approved' ? 'success' : 'warning'}>{dx.status || 'draft'}</Pill>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: dx.studentId, diagnosisId: dx.id })}>
                    {dx.status === 'approved' ? 'View' : 'Review'}
                  </Button>
                  {dx.status === 'approved' && (
                    <Button variant="primary" size="sm" onClick={() => onNavigate('homework:create', { diagnosisId: dx.id, studentId: dx.studentId })}>
                      Generate HW
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
