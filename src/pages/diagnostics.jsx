import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { getDiagnoses, getStudents, deleteDiagnosis } from '../lib/workflow.js';

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
            const evidence = getEvidenceSummary(dx);
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
                    {evidence.total > 0 && (
                      <div style={S.evidenceRow} aria-label="Diagnosis evidence coverage">
                        <span style={S.evidenceChip}>{evidence.evaluated} evaluated</span>
                        <span style={S.evidenceChip}>{evidence.limited} not enough evidence</span>
                        <span style={S.evidenceChip}>{evidence.notEvaluated} not evaluated</span>
                      </div>
                    )}
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
                  <Button
                    variant="ghost" size="sm" style={{ color: 'var(--danger)' }}
                    aria-label="Delete diagnosis"
                    onClick={async () => {
                      if (!confirm(`Delete this diagnosis for ${student?.name || 'this student'}? This cannot be undone.`)) return;
                      await deleteDiagnosis(dx.id);
                      load();
                    }}
                  >
                    <Icon.trash size={13} />
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

function getEvidenceSummary(dx) {
  const skillDiagnosis = dx?.sections?.skillDiagnosis?.content;
  if (!skillDiagnosis || typeof skillDiagnosis !== 'object') {
    const snapshot = Array.isArray(dx?.content?.section_snapshot) ? dx.content.section_snapshot : [];
    return snapshot.reduce((acc, item) => {
      acc.total += 1;
      if (Number(item?.score_0_80) > 0) acc.evaluated += 1;
      else acc.notEvaluated += 1;
      return acc;
    }, { total: 0, evaluated: 0, limited: 0, notEvaluated: 0 });
  }
  return Object.values(skillDiagnosis).reduce((acc, item) => {
    acc.total += 1;
    const evidenceCount = Number(item?.evidenceCount || 0);
    if (item?.evaluated && evidenceCount > 0 && item?.score0to80 != null) acc.evaluated += 1;
    else if (item?.evaluated || evidenceCount > 0) acc.limited += 1;
    else acc.notEvaluated += 1;
    return acc;
  }, { total: 0, evaluated: 0, limited: 0, notEvaluated: 0 });
}

const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
  evidenceRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  evidenceChip: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    background: 'var(--bg)',
  },
};

