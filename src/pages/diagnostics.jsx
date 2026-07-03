import { useState, useEffect } from 'react';
import { Icon, SectionHeader, Pill, Avatar } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getDiagnoses, getStudents, deleteDiagnosis } from '../lib/workflow.js';

export default function DiagnosticsPage({ students, onNavigate }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    (async () => {
      const dx = await getDiagnoses();
      setDiagnoses(dx || []);
    })();
  }, []);

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
        <div className="grid-square">
          {filtered.map(dx => {
            const student = students.find(s => s.id === dx.studentId);
            const approvedCount = dx.sections ? Object.values(dx.sections).filter(s => s.approved).length : 0;
            const totalCount = dx.sections ? Object.keys(dx.sections).length : 0;
            const evidence = getEvidenceSummary(dx);
            return (
              <Card key={dx.id} className="square-card">
                <Avatar name={student?.name || '?'} size={40} />
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center', marginTop: 8 }}>{student?.name || 'Unknown student'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>
                  {new Date(dx.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <Pill tone={dx.status === 'approved' ? 'success' : 'warning'}>{dx.status || 'draft'}</Pill>
                  {totalCount > 0 && <span className="card-row-meta" style={{ fontSize: 'var(--text-xs)' }}>{approvedCount}/{totalCount} approved</span>}
                </div>
                <div style={{ marginTop: 'auto', width: '100%', display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: dx.studentId, diagnosisId: dx.id })}>
                    {dx.status === 'approved' ? 'View' : 'Review'}
                  </Button>
                  {dx.status === 'approved' && (
                    <Button variant="primary" size="sm" onClick={() => onNavigate('homework:create', { diagnosisId: dx.id, studentId: dx.studentId })}>
                      HW
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={async () => {
                    if (!confirm(`Delete ${student?.name || 'this student'}'s diagnosis? This removes their session record and cannot be undone.`)) return;
                    await deleteDiagnosis(dx.id);
                    load();
                  }}>
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

