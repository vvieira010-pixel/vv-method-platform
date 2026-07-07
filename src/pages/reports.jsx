/**
 * reports.jsx — Progress and performance repository
 */
import { useState, useEffect, useMemo } from 'react';
import { Icon, SectionHeader, Avatar, Pill } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { getDiagnoses, getHomework, getErrorBank, getAllSubmissions, getProgressNotes } from '../lib/workflow.js';
import { buildExerciseMix } from '../lib/report-metrics.js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ReportsPage({ students, onNavigate, workspaceQuery = '' }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState('all');

  const query = (workspaceQuery || '').trim().toLowerCase();

  const roster = useMemo(() => {
    if (!query) return students;
    const filtered = students.filter((s) => String(s.name || '').toLowerCase().includes(query));
    return filtered.length ? filtered : students;
  }, [students, query]);

  useEffect(() => {
    if (!roster.length) return;
    if (!selectedStudent || !roster.some((s) => s.id === selectedStudent)) {
      setSelectedStudent(roster[0].id);
    }
  }, [roster, selectedStudent]);

  useEffect(() => {
    if (selectedStudent) {
      generateReport(selectedStudent);
    }
  }, [selectedStudent]);

  async function generateReport(studentId) {
    if (!studentId) return;
    setLoading(true);

    const student = students.find((s) => s.id === studentId);
    const [diagnoses, homework, errors, submissions, notes] = await Promise.all([
      getDiagnoses(studentId),
      getHomework(studentId),
      getErrorBank(studentId),
      getAllSubmissions().then((all) => (all || []).filter((s) => s.studentId === studentId)),
      getProgressNotes(studentId),
    ]);

    const approved = (diagnoses || []).filter((d) => d.status === 'approved');
    const completedHw = (homework || []).filter((h) => ['completed', 'corrected', 'reviewed'].includes(h.status));
    const activeErrors = (errors || []).filter((e) => e.status === 'active');
    const solvedErrors = (errors || []).filter((e) => e.status === 'solved');
    const skillCoverageChart = buildSkillCoverageChart(approved);
    const exerciseMix = buildExerciseMix(homework || []);

    const baseline = approved.find(d => d.isBaseline) || approved[approved.length - 1] || null;
    const latest = approved[0] || null;
    const inquiryComparison = baseline && latest ? buildInquiryComparison(baseline, latest) : null;

    setReport({
      student,
      diagnoses: diagnoses || [],
      approved,
      baseline,
      latest,
      inquiryComparison,
      homework: homework || [],
      completedHw,
      errors: errors || [],
      activeErrors,
      solvedErrors,
      submissions: submissions || [],
      notes: notes || [],
      skillCoverageChart,
      exerciseMix,
    });

    setLoading(false);
  }

  const visibleExerciseRows = report?.exerciseMix.filter((row) => exerciseTypeFilter === 'all' || row.type === exerciseTypeFilter) || [];

  return (
    <div className="page-container">
      <section className="hero-section hero-section--reports hero-section--rounded">
        <div>
          <div className="hero-tag">Progress Repository</div>
          <h1 className="page-headline" style={{ color: '#fff' }}>Reports Workspace</h1>
          <p className="page-sub" style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620 }}>Teacher-facing performance view: evidence coverage, exercise pipeline, and progress story before sharing feedback.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" onClick={() => selectedStudent && generateReport(selectedStudent)} disabled={!selectedStudent || loading}>
            <Icon.progress size={14} /> {loading ? 'Refreshing…' : 'Refresh Report'}
          </Button>
          {report && <Button variant="ghost" onClick={() => window.print()}>Print</Button>}
        </div>
      </section>

      <Card small className="mb-3">
        <div className="filter-grid">
          <label className="field-stack">
            <span className="field-label">Student</span>
            <select className="input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
              {roster.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field-stack">
            <span className="field-label">Exercise view</span>
            <select className="input" value={exerciseTypeFilter} onChange={(e) => setExerciseTypeFilter(e.target.value)}>
              <option value="all">All exercise types</option>
              {(report?.exerciseMix || []).map((row) => <option key={row.type} value={row.type}>{row.type}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {!report ? (
        <Card small className="text-center">
          <p style={{ color: 'var(--muted)', margin: 0 }}>{loading ? 'Generating report…' : 'Select a student to generate report data.'}</p>
        </Card>
      ) : (
        <>
          <Card small className="mb-2">
            <div className="flex items-center gap-4 flex-wrap">
              <Avatar name={report.student?.name || '?'} size={48} />
              <div style={{ minWidth: 220 }}>
                <h2 className="text-xl font-ui" style={{ margin: 0 }}>{report.student?.name || 'Unknown student'}</h2>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>
                  {report.student?.currentLevel || '--'} to {report.student?.targetLevel || '--'} · {report.student?.examGoal || 'MET goal not set'}
                </p>
              </div>
              <div className="ml-auto flex gap-1 flex-wrap">
                <Pill tone="info">Diagnoses: {report.diagnoses.length}</Pill>
                <Pill tone="success">Approved: {report.approved.length}</Pill>
                <Pill tone="warning">Homework: {report.homework.length}</Pill>
              </div>
            </div>
          </Card>

          <div className="kpi-grid" style={{ marginTop: 14 }}>
            <StatCard label="Homework completed" value={`${report.completedHw.length}/${report.homework.length}`} tone="success" />
            <StatCard label="Submissions" value={report.submissions.length} tone="info" />
            <StatCard label="Active errors" value={report.activeErrors.length} tone="danger" />
            <StatCard label="Solved errors" value={report.solvedErrors.length} tone="success" />
          </div>

          {report.approved.length > 0 && (
            <Card small className="mt-2">
              <SectionHeader title="Which MET skills have enough evidence?" icon={<Icon.diagnose size={14} />} />
              <p className="text-caption">Approved diagnoses only. Missing evidence stays visible instead of becoming a score.</p>
              <div className="chart-wrap-320 mt-2">
                <ResponsiveContainer>
                  <BarChart data={report.skillCoverageChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="skill" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={{ stroke: 'var(--divider)' }} tickLine={{ stroke: 'var(--divider)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={{ stroke: 'var(--divider)' }} tickLine={{ stroke: 'var(--divider)' }} />
                    <Tooltip cursor={{ fill: 'rgba(20,136,145,0.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="enoughEvidence" name="Evaluated with evidence" stackId="coverage" fill="var(--accent)" isAnimationActive animationDuration={900} />
                    <Bar dataKey="lowEvidence" name="Not evaluated enough" stackId="coverage" fill="var(--warning)" isAnimationActive animationDuration={1100} />
                    <Bar dataKey="notEvaluated" name="Not evaluated" stackId="coverage" fill="var(--muted)" isAnimationActive animationDuration={1300} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {report.inquiryComparison && (
            <Card small className="mt-2">
              <SectionHeader title="Inquiry — Baseline vs Latest" icon={<Icon.progress size={14} />} />
              <p className="text-caption">
                Skill score deltas between first{report.baseline?.isBaseline ? ' (baseline)' : ''} and most recent diagnosis.
                {report.baseline?.interventionNote ? <span className="block mt-1">Intervention: <strong>{report.baseline.interventionNote}</strong></span> : ''}
              </p>
              <div className="grid-auto-fill-200 mt-2">
                {report.inquiryComparison.map(({ skill, baseline, latest, delta }) => (
                  <div key={skill} className="inquiry-card" style={{ background: delta > 0 ? 'var(--success-bg)' : delta < 0 ? 'var(--danger-bg)' : 'var(--surface)' }}>
                    <div className="text-2xs text-muted text-uppercase letter-spacing-01">{skill}</div>
                    <div className="flex-between mt-1 gap-2" style={{ alignItems: 'baseline' }}>
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{baseline} → {latest}</span>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="split-grid">
            <Card small>
              <SectionHeader title="Exercise Status by Format" icon={<Icon.homework size={14} />} />
              <p className="text-caption">Submitted and reviewed are separate so teacher backlog does not hide student effort.</p>
              {visibleExerciseRows.length === 0 ? (
                <p className="empty-panel" style={{ padding: '8px 0' }}>No exercise data for this student yet.</p>
              ) : (
                <div className="flex-col-gap2 mt-2">
                  {visibleExerciseRows.map((row) => (
                    <div key={row.type} className="exercise-row">
                      <div className="min-w-0">
                        <div className="row-title">{row.type}</div>
                        <div className="row-sub">{row.count} assignments · {row.submitted} submitted · {row.reviewed} reviewed</div>
                      </div>
                      <ExerciseStatusBars row={row} />
                      <strong className="text-xs text-right" style={{ color: 'var(--primary)' }}>{row.reviewedRate}% reviewed</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card small>
              <SectionHeader title="Diagnosis Timeline" icon={<Icon.calendar size={14} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics')}>Open Hub</Button>} />
              {report.approved.length === 0 ? (
                <p className="empty-panel" style={{ padding: '8px 0' }}>No approved diagnoses yet.</p>
              ) : (
                <div className="flex-col-gap2 mt-2">
                  {report.approved.slice(0, 6).map((dx, i) => (
                    <div key={dx.id} className="timeline-row">
                      <div className="timeline-idx">{i + 1}</div>
                      <div className="min-w-0">
                        <div className="row-title">{new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="row-sub">{(dx.classSummary || dx.content?.overall_result || 'No summary').slice(0, 140)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card small className="mt-2">
            <SectionHeader title="Progress Notes" icon={<Icon.doc size={14} />} />
            {report.notes.length === 0 ? (
              <p className="empty-panel" style={{ padding: '8px 0' }}>No notes recorded.</p>
            ) : (
              <div className="flex-col-gap1 mt-2">
                {report.notes.slice(0, 6).map((n) => (
                  <div key={n.id} className="note-row">
                    <span className="note-date">{new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-sm">{n.note}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const bg = tone === 'success'
    ? 'var(--success-bg)'
    : tone === 'danger'
      ? 'var(--danger-bg)'
      : 'var(--surface)';

  return (
    <Card small style={{ background: bg }}>
      <div className="text-2xs text-muted text-uppercase letter-spacing-01">{label}</div>
      <div className="td-kpi-value" style={{ marginTop: 8 }}>{value}</div>
    </Card>
  );
}

const SKILL_CHART_CONFIG = [
  { skill: 'Speaking', key: 'speaking', countKey: 'speaking' },
  { skill: 'Writing', key: 'writing', countKey: 'writing' },
  { skill: 'Reading', key: 'reading', countKey: 'reading' },
  { skill: 'Listening', key: 'listening', countKey: 'listening' },
  { skill: 'Grammar', key: 'grammar', countKey: 'grammar' },
  { skill: 'Vocabulary', key: 'vocabulary', countKey: 'vocabulary' },
  { skill: 'Test Strategy', key: 'testStrategy', countKey: 'testStrategy' },
];

function buildSkillCoverageChart(approvedDiagnoses) {
  return SKILL_CHART_CONFIG.map(({ skill, key, countKey }) => {
    let enoughEvidence = 0;
    let lowEvidence = 0;
    let notEvaluated = 0;

    approvedDiagnoses.forEach((dx) => {
      const evaluated = Boolean(dx?.evaluatedSkills?.[key]);
      const count = getEvidenceCount(dx, countKey);
      if (!evaluated) {
        notEvaluated += 1;
        return;
      }
      if (count > 0) enoughEvidence += 1;
      else lowEvidence += 1;
    });

    return { skill, enoughEvidence, lowEvidence, notEvaluated };
  });
}

function buildInquiryComparison(baseline, latest) {
  const SKILLS = ['Speaking', 'Writing', 'Reading', 'Listening', 'Grammar', 'Vocabulary', 'TestStrategy'];
  const bSnap = {};
  (baseline.content?.section_snapshot || []).forEach(s => { bSnap[s.section] = s.score_0_80; });
  const lSnap = {};
  (latest.content?.section_snapshot || []).forEach(s => { lSnap[s.section] = s.score_0_80; });
  return SKILLS.map(skill => {
    const b = bSnap[skill];
    const l = lSnap[skill];
    if (!b || !l) return null;
    return { skill, baseline: b, latest: l, delta: l - b };
  }).filter(Boolean);
}

function getEvidenceCount(dx, countKey) {
  const counts = dx?.evidenceCounts || {};
  if (typeof counts[countKey] === 'number') return counts[countKey];
  if (countKey === 'testStrategy' && typeof dx?.testStrategyEvidenceCount === 'number') return dx.testStrategyEvidenceCount;
  return 0;
}

function ExerciseStatusBars({ row }) {
  return (
    <div className="status-bars">
      <div className="status-line">
        <span>Submitted</span>
        <div className="progress-track">
           <div className="progress-fill-submitted" style={{ transform: `scaleX(${row.submittedRate / 100})` }} />
        </div>
        <strong>{row.submittedRate}%</strong>
      </div>
      <div className="status-line">
        <span>Reviewed</span>
        <div className="progress-track">
           <div className="progress-fill-reviewed" style={{ transform: `scaleX(${row.reviewedRate / 100})` }} />
        </div>
        <strong>{row.reviewedRate}%</strong>
      </div>
    </div>
  );
}

