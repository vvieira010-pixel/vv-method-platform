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
    <div className="page-shell">
      <SectionHeader
        title="Diagnostics"
        sub={`${diagnoses.length} total · ${diagnoses.filter(d => d.status === 'approved').length} approved`}
        action={<Button variant="primary" onClick={() => onNavigate('diagnostics:create', {})}><Icon.plus size={14} /> New Diagnosis</Button>}
      />

      {/* Filters */}
      <div className="page-filters">
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
        <Card className="page-empty-state">
          <p className="card-row-meta">No diagnoses yet. Diagnoses appear here after you run one following a class.</p>
        </Card>
      ) : (
        <div className="page-list">
          {filtered.map(dx => {
            const student = students.find(s => s.id === dx.studentId);
            const approvedCount = dx.sections ? Object.values(dx.sections).filter(s => s.approved).length : 0;
            const totalCount = dx.sections ? Object.keys(dx.sections).length : 0;
            const evidence = getEvidenceSummary(dx);
            return (
              <Card key={dx.id}>
                <div className="card-row">
                  <Avatar name={student?.name || '?'} size={34} />
                  <div className="card-row-body">
                    <div className="card-row-title">{student?.name || 'Unknown student'}</div>
                    <div className="card-row-meta">
                      {new Date(dx.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {dx.classSummary ? ` · ${dx.classSummary.slice(0, 60)}…` : ''}
                    </div>
                    {evidence.total > 0 && (
                      <div className="evidence-row" aria-label="Diagnosis evidence coverage">
                        <span className="evidence-chip">{evidence.evaluated} evaluated</span>
                        <span className="evidence-chip">{evidence.limited} not enough evidence</span>
                        <span className="evidence-chip">{evidence.notEvaluated} not evaluated</span>
                      </div>
                    )}
                  </div>
                  {totalCount > 0 && <span className="card-row-meta">{approvedCount}/{totalCount} approved</span>}
                  <Pill tone={dx.status === 'approved' ? 'success' : 'warning'}>{dx.status || 'draft'}</Pill>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: dx.studentId, diagnosisId: dx.id })}>
                    {dx.status === 'approved' ? 'View' : 'Review'}
                  </Button>
                  {dx.status === 'approved' && (
                    <Button variant="primary" size="sm" onClick={() => onNavigate('homework:create', { diagnosisId: dx.id, studentId: dx.studentId })}>
                      Generate homework
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="sm" style={{ color: 'var(--danger)' }}
                    aria-label="Delete diagnosis"
                    onClick={async () => {
                      if (!confirm(`Delete ${student?.name || 'this student'}'s diagnosis? This removes their session record and cannot be undone.`)) return;
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

