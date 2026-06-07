/**
 * tool-reports.jsx — Progress reports and MET readiness overview
 */
import { useEffect, useState } from 'react';
import { Card, SectionHeader, Kpi, Avatar, Pill, Button } from '../components/shared.jsx';
import { getDiagnoses, getFeedback, getHomework, getReports, getPracticeAssignments, saveReport } from '../lib/workflow.js';

const SKILLS = ['Grammar','Reading','Writing','Listening','Speaking','Vocabulary'];

function SkillBar({ label, value, status, max = 10 }) {
  if (value == null) {
    const tone = status === 'Not enough evidence' ? 'var(--warning)' : 'var(--muted)';
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4, gap: 12 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
          <span style={{ fontWeight: 700, color: tone }}>{status || 'Not evaluated yet'}</span>
        </div>
        <div style={{ height: 7, background: 'var(--bg-deep)', borderRadius: 999, overflow: 'hidden' }} />
      </div>
    );
  }
  const pct = Math.round(Math.min(100, (value / max) * 100));
  const tone = pct >= 70 ? 'var(--success)' : pct >= 45 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{value}/{max}</span>
      </div>
      <div style={{ height: 7, background: 'var(--bg-deep)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '100%', background: tone, borderRadius: 999, transform: `scaleX(${pct / 100})`, transformOrigin: 'left', transition: 'transform 0.4s' }} />
      </div>
    </div>
  );
}

export default function ToolReports({ students = [] }) {
  const [selected, setSelected] = useState(students[0]?.id || null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [homework, setHomework] = useState([]);
  const [practice, setPractice] = useState([]);
  const [reports, setReports] = useState([]);
  const student = students.find(s => s.id === selected) || students[0];

  const load = async () => {
    if (!student?.id) return;
    const [diags, fb, hw, practiceItems, reps] = await Promise.all([
      getDiagnoses(student.id),
      getFeedback(student.id),
      getHomework(student.id),
      getPracticeAssignments(student.id),
      getReports(student.id),
    ]);
    setDiagnoses(diags || []);
    setSelectedDiagnosisId((current) => current && (diags || []).some(d => d.id === current) ? current : (diags?.[0]?.id || ''));
    setFeedback(fb || []);
    setHomework(hw || []);
    setPractice(practiceItems || []);
    setReports(reps || []);
  };

  useEffect(() => {
    load();
  }, [student?.id]);

  // Diagnosis-informed snapshot only. Do not estimate missing skill scores.
  const latestDiagnosis = diagnoses.find(d => d.id === selectedDiagnosisId) || diagnoses[0] || null;
  const diagSnapshot = latestDiagnosis?.content?.section_snapshot || [];
  const skills = SKILLS.map(name => {
    const found = diagSnapshot.find(s => String(s.section || '').toLowerCase() === name.toLowerCase());
    const score4 = Number(found?.score_0_4);
    const score80 = Number(found?.score_0_80);
    const hasScore = Number.isFinite(score4) && score4 > 0;
    const hasEvidence = Number(found?.evidenceCount || found?.turnsEvaluated || 0) > 0 || score80 > 0;
    return {
      name,
      score: hasScore ? Math.round((score4 / 4) * 10 * 10) / 10 : null,
      status: hasScore ? 'Evaluated' : hasEvidence ? 'Not enough evidence' : 'Not evaluated yet',
    };
  });
  const evaluatedSkills = skills.filter(s => s.score != null);
  const avg = evaluatedSkills.length
    ? evaluatedSkills.reduce((sum, s) => sum + s.score, 0) / evaluatedSkills.length
    : null;
  const readiness = avg != null ? Math.round((avg / 10) * 100) : null;
  const linkedFeedback = feedback.filter(f => f.diagnosisId === latestDiagnosis?.id);
  const linkedHomework = homework.filter(h => h.diagnosisId === latestDiagnosis?.id);
  const linkedPractice = practice.filter(p => p.diagnosisId === latestDiagnosis?.id);

  const generateReport = async () => {
    if (!student || !latestDiagnosis) return;
    await saveReport({
      studentId: student.id,
      studentName: student.name,
      diagnosisIds: [latestDiagnosis.id],
      feedbackIds: linkedFeedback.map(f => f.id),
      homeworkIds: linkedHomework.map(h => h.id),
      practiceAssignmentIds: linkedPractice.map(p => p.id),
      content: {
        summary: latestDiagnosis.content?.overall_result || latestDiagnosis.classSummary || 'Progress report generated from saved platform history.',
        nextSteps: latestDiagnosis.nextSteps || [],
        readiness,
        evaluatedSkills: evaluatedSkills.length,
      },
    });
    await load();
    window.toast?.('Progress report saved from student history.', 'ok');
  };

  return (
    <div className="page-shell">
      <div className="page-inner">
        <SectionHeader title="Reports" sub="MET readiness and skill progress by student" />
        {!latestDiagnosis && (
          <Card style={{ margin: '12px 0 18px' }}>
            <SectionHeader title="Reports" sub="Diagnosis required first" />
            <p className="text-sm text-muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
              This feature is not active yet. Start by creating a diagnosis.
            </p>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {students.map(s => (
            <button key={s.id}
              onClick={() => setSelected(s.id)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: '1px solid var(--border)',
                background: selected === s.id ? 'var(--accent)' : 'var(--surface)',
                color: selected === s.id ? '#fff' : 'var(--text-2)',
                font: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'all 0.12s',
              }}>
              {s.firstName}
            </button>
          ))}
        </div>

        {latestDiagnosis && (
          <Card style={{ marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <label style={fieldLabel}>Diagnosis history
                <select className="input" value={selectedDiagnosisId} onChange={e => setSelectedDiagnosisId(e.target.value)} style={{ marginTop: 6 }}>
                  {diagnoses.map(d => <option key={d.id} value={d.id}>{formatDiagnosisLabel(d)}</option>)}
                </select>
              </label>
              <Button variant="primary" size="sm" onClick={generateReport}>Generate report from history</Button>
            </div>
          </Card>
        )}

        {student && latestDiagnosis && (
          <>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <Kpi label="MET Readiness" value={readiness == null ? 'Not enough' : `${readiness}%`} sub={`Target: ${student.targetBand || student.bandTarget}`} />
              <Kpi label="Current Band" value={student.currentBand || student.band} sub="Assessed" />
              <Kpi label="Session" value={`${student.session}/${student.totalSessions}`} sub="Completed" />
              <Kpi label="Evaluated Skills" value={`${evaluatedSkills.length}/${SKILLS.length}`} sub="Evidence only" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <Pill tone="info">Diagnoses: {diagnoses.length}</Pill>
              <Pill tone="accent">Feedback linked: {linkedFeedback.length}</Pill>
              <Pill tone="warning">Homework linked: {linkedHomework.length}</Pill>
              <Pill tone="success">Practice linked: {linkedPractice.length}</Pill>
              <Pill tone="success">Reports: {reports.length}</Pill>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Skill breakdown */}
              <Card>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>Skill Breakdown</div>
                {skills.map(sk => <SkillBar key={sk.name} label={sk.name} value={sk.score} status={sk.status} />)}
              </Card>

              {/* Profile summary */}
              <div>
                <Card style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                    <Avatar name={student.name} size={44} tone="auto" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{student.track} · {student.code}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>
                    <strong>Goal:</strong> {student.goal}
                  </div>
                  {student.goalNote && (
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>{student.goalNote}</div>
                  )}
                </Card>

                <Card>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Readiness Gauge</div>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 52, fontWeight: 800, color: readiness == null ? 'var(--muted)' : readiness >= 70 ? 'var(--success)' : readiness >= 45 ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>
                      {readiness == null ? '—' : `${readiness}%`}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
                      {readiness == null ? 'Not enough evaluated evidence' : 'MET Readiness'}
                    </div>
                  </div>
                  <div style={{ height: 12, background: 'var(--bg-deep)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{
                      height: '100%', borderRadius: 999, transition: 'transform 0.4s',
                      width: '100%', transform: `scaleX(${(readiness || 0) / 100})`, transformOrigin: 'left',
                      background: readiness == null ? 'var(--muted)' : readiness >= 70 ? 'var(--success)' : readiness >= 45 ? 'var(--warning)' : 'var(--danger)',
                    }} />
                  </div>
                  <Pill tone={readiness == null ? 'muted' : readiness >= 70 ? 'success' : readiness >= 45 ? 'warning' : 'danger'}>
                    {readiness == null ? 'Needs more samples' : readiness >= 70 ? 'On track for target' : readiness >= 45 ? 'Progressing' : 'Needs acceleration'}
                  </Pill>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const fieldLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

function formatDiagnosisLabel(diagnosis) {
  const date = diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Saved diagnosis';
  const focus = diagnosis?.priorityFocus || diagnosis?.nextSteps?.[0] || diagnosis?.weaknesses?.[0] || 'MET focus';
  return `${date} - ${String(focus).slice(0, 48)}`;
}
