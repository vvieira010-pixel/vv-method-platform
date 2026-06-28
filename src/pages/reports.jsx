/**
 * reports.jsx — Progress and performance repository
 */
import { useState, useEffect, useMemo } from 'react';
import { Icon, SectionHeader, Avatar, Pill, S_DARK } from '../components/shared.jsx';
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
    <div className="page-container" style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Progress Repository</div>
          <h1 style={S.headline}>Reports Workspace</h1>
          <p style={S.sub}>Teacher-facing performance view: evidence coverage, exercise pipeline, and progress story before sharing feedback.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => selectedStudent && generateReport(selectedStudent)} disabled={!selectedStudent || loading}>
            <Icon.progress size={14} /> {loading ? 'Refreshing…' : 'Refresh Report'}
          </Button>
          {report && <Button variant="ghost" onClick={() => window.print()}>Print</Button>}
        </div>
      </section>

      <Card small style={{ marginBottom: 16 }}>
        <div style={S.filterGrid}>
          <label style={S.field}>
            <span style={S.fieldLabel}>Student</span>
            <select className="input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
              {roster.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label style={S.field}>
            <span style={S.fieldLabel}>Exercise view</span>
            <select className="input" value={exerciseTypeFilter} onChange={(e) => setExerciseTypeFilter(e.target.value)}>
              <option value="all">All exercise types</option>
              {(report?.exerciseMix || []).map((row) => <option key={row.type} value={row.type}>{row.type}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {!report ? (
        <Card small style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>{loading ? 'Generating report…' : 'Select a student to generate report data.'}</p>
        </Card>
      ) : (
        <>
          <Card small style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Avatar name={report.student?.name || '?'} size={48} />
              <div style={{ minWidth: 220 }}>
                <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xl)', margin: 0 }}>{report.student?.name || 'Unknown student'}</h2>
                <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 'var(--text-sm)' }}>
                  {report.student?.currentLevel || '--'} to {report.student?.targetLevel || '--'} · {report.student?.examGoal || 'MET goal not set'}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill tone="info">Diagnoses: {report.diagnoses.length}</Pill>
                <Pill tone="success">Approved: {report.approved.length}</Pill>
                <Pill tone="warning">Homework: {report.homework.length}</Pill>
              </div>
            </div>
          </Card>

          <div style={S.kpiGrid}>
            <StatCard label="Homework completed" value={`${report.completedHw.length}/${report.homework.length}`} tone="success" />
            <StatCard label="Submissions" value={report.submissions.length} tone="info" />
            <StatCard label="Active errors" value={report.activeErrors.length} tone="danger" />
            <StatCard label="Solved errors" value={report.solvedErrors.length} tone="success" />
          </div>

          {report.approved.length > 0 && (
            <Card small style={{ marginTop: 14 }}>
              <SectionHeader title="Which MET skills have enough evidence?" icon={<Icon.diagnose size={14} />} />
              <p style={S.caption}>Approved diagnoses only. Missing evidence stays visible instead of becoming a score.</p>
              <div style={{ width: '100%', height: 320, marginTop: 12 }}>
                <ResponsiveContainer>
                  <BarChart data={report.skillCoverageChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="skill" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={{ stroke: 'var(--divider)' }} tickLine={{ stroke: 'var(--divider)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={{ stroke: 'var(--divider)' }} tickLine={{ stroke: 'var(--divider)' }} />
                    <Tooltip contentStyle={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }} cursor={{ fill: 'rgba(20,136,145,0.08)' }} />
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
            <Card small style={{ marginTop: 14 }}>
              <SectionHeader title="Inquiry — Baseline vs Latest" icon={<Icon.progress size={14} />} />
              <p style={S.caption}>
                Skill score deltas between first{report.baseline?.isBaseline ? ' (baseline)' : ''} and most recent diagnosis.
                {report.baseline?.interventionNote ? <span style={{ display: 'block', marginTop: 4 }}>Intervention: <strong>{report.baseline.interventionNote}</strong></span> : ''}
              </p>
              <div style={{ display: 'grid', gap: 8, marginTop: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {report.inquiryComparison.map(({ skill, baseline, latest, delta }) => (
                  <div key={skill} style={{ border: '1px solid var(--divider)', padding: '11px 12px', background: delta > 0 ? 'var(--success-bg)' : delta < 0 ? 'var(--danger-bg)' : 'var(--surface)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{skill}</div>
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>{baseline} → {latest}</span>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={S.splitGrid}>
            <Card small>
              <SectionHeader title="Exercise Status by Format" icon={<Icon.homework size={14} />} />
              <p style={S.caption}>Submitted and reviewed are separate so teacher backlog does not hide student effort.</p>
              {visibleExerciseRows.length === 0 ? (
                <p style={S.empty}>No exercise data for this student yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {visibleExerciseRows.map((row) => (
                    <div key={row.type} style={S.exerciseRow}>
                      <div style={{ minWidth: 0 }}>
                        <div style={S.rowTitle}>{row.type}</div>
                        <div style={S.rowSub}>{row.count} assignments · {row.submitted} submitted · {row.reviewed} reviewed</div>
                      </div>
                      <ExerciseStatusBars row={row} />
                      <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', textAlign: 'right' }}>{row.reviewedRate}% reviewed</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card small>
              <SectionHeader title="Diagnosis Timeline" icon={<Icon.calendar size={14} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics')}>Open Hub</Button>} />
              {report.approved.length === 0 ? (
                <p style={S.empty}>No approved diagnoses yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {report.approved.slice(0, 6).map((dx, i) => (
                    <div key={dx.id} style={S.timelineRow}>
                      <div style={S.timelineIdx}>{i + 1}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={S.rowTitle}>{new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div style={S.rowSub}>{(dx.classSummary || dx.content?.overall_result || 'No summary').slice(0, 140)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card small style={{ marginTop: 12 }}>
            <SectionHeader title="Progress Notes" icon={<Icon.doc size={14} />} />
            {report.notes.length === 0 ? (
              <p style={S.empty}>No notes recorded.</p>
            ) : (
              <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                {report.notes.slice(0, 6).map((n) => (
                  <div key={n.id} style={S.noteRow}>
                    <span style={S.noteDate}>{new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span style={{ fontSize: 'var(--text-sm)' }}>{n.note}</span>
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
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--primary)' }}>{value}</div>
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
    <div style={S.statusBars}>
      <div style={S.statusLine}>
        <span>Submitted</span>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFillSubmitted, width: `${row.submittedRate}%` }} />
        </div>
        <strong>{row.submittedRate}%</strong>
      </div>
      <div style={S.statusLine}>
        <span>Reviewed</span>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFillReviewed, width: `${row.reviewedRate}%` }} />
        </div>
        <strong>{row.reviewedRate}%</strong>
      </div>
    </div>
  );
}

const S = {
  shell: { padding: '28px 20px 40px' },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
    padding: '22px 24px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(20,136,145,0.18)',
    background: 'linear-gradient(135deg, var(--primary) 0%, #172537 50%, var(--accent) 100%)',
    boxShadow: '0 18px 44px -30px rgba(16, 26, 40, 0.8)',
    color: 'var(--on-dark)',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-soft)', fontWeight: 700, marginBottom: 6 },
  ...S_DARK,
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginTop: 14 },
  splitGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginTop: 12 },
  caption: { fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '4px 0 0' },
  rowTitle: { fontSize: 'var(--text-sm)', fontWeight: 700 },
  rowSub: { fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 },
  exerciseRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(150px, 1.1fr) minmax(74px, auto)',
    alignItems: 'center',
    gap: 10,
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 12px',
    background: 'var(--surface)',
  },
  statusBars: { display: 'grid', gap: 5, minWidth: 0 },
  statusLine: { display: 'grid', gridTemplateColumns: '62px minmax(60px, 1fr) 34px', alignItems: 'center', gap: 7, fontSize: 'var(--text-xs)', color: 'var(--muted)' },
  progressTrack: { height: 8, borderRadius: 'var(--radius-sm)', background: 'var(--bg-deep)', overflow: 'hidden' },
  progressFillSubmitted: { height: '100%', borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)' },
  progressFillReviewed: { height: '100%', borderRadius: 'var(--radius-sm)', background: 'var(--accent)' },
  timelineRow: {
    display: 'grid',
    gridTemplateColumns: '28px minmax(0, 1fr)',
    gap: 10,
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    background: 'var(--surface)',
  },
  timelineIdx: {
    width: 24,
    height: 24,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-subtle)',
    color: 'var(--primary)',
    display: 'grid',
    placeItems: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
  },
  noteRow: { display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 8, alignItems: 'start', padding: '9px 11px', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' },
  noteDate: { color: 'var(--muted)', fontSize: 'var(--text-xs)' },
  empty: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 0' },
};

