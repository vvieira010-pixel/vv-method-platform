/**
 * reports.jsx — Progress and performance repository
 */
import { useState, useEffect, useMemo } from 'react';
import { Icon, Card, SectionHeader, Button, Avatar, Pill } from '../components/shared.jsx';
import { getDiagnoses, getHomework, getErrorBank, getAllSubmissions, getProgressNotes } from '../lib/workflow.js';
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

    setReport({
      student,
      diagnoses: diagnoses || [],
      approved,
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
    <div style={S.shell}>
      <section style={S.hero}>
        <div>
          <div style={S.heroTag}>Progress Repository</div>
          <h1 style={S.headline}>Reports Workspace</h1>
          <p style={S.sub}>Teacher-facing performance view: evidence coverage, exercise pipeline, and progress story before sharing feedback.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => selectedStudent && generateReport(selectedStudent)} disabled={!selectedStudent || loading}>
            <Icon.progress size={14} /> {loading ? 'Refreshing...' : 'Refresh Report'}
          </Button>
          {report && <Button variant="ghost" onClick={() => window.print()}>Print</Button>}
        </div>
      </section>

      <Card style={{ padding: 16, marginBottom: 16 }}>
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
        <Card style={{ padding: 30, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>{loading ? 'Generating report...' : 'Select a student to generate report data.'}</p>
        </Card>
      ) : (
        <>
          <Card style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Avatar name={report.student?.name || '?'} size={48} />
              <div style={{ minWidth: 220 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>{report.student?.name || 'Unknown student'}</h2>
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
            <Card style={{ padding: 18, marginTop: 14 }}>
              <SectionHeader title="Skill Evidence Coverage (Animated)" icon={<Icon.diagnose size={14} />} />
              <p style={S.caption}>Approved diagnoses only. Skills with zero evidence count as not evaluated enough.</p>
              <div style={{ width: '100%', height: 320, marginTop: 12 }}>
                <ResponsiveContainer>
                  <BarChart data={report.skillCoverageChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="skill" tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={{ stroke: 'var(--divider)' }} tickLine={{ stroke: 'var(--divider)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-2)' }} axisLine={{ stroke: 'var(--divider)' }} tickLine={{ stroke: 'var(--divider)' }} />
                    <Tooltip contentStyle={{ borderRadius: 3, border: '1px solid var(--border)', background: '#fff' }} cursor={{ fill: 'rgba(20, 80, 120, 0.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="enoughEvidence" name="Evaluated with evidence" stackId="coverage" fill="#0f766e" isAnimationActive animationDuration={900} />
                    <Bar dataKey="lowEvidence" name="Not evaluated enough" stackId="coverage" fill="#f59e0b" isAnimationActive animationDuration={1100} />
                    <Bar dataKey="notEvaluated" name="Not evaluated" stackId="coverage" fill="#94a3b8" isAnimationActive animationDuration={1300} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div style={S.splitGrid}>
            <Card style={{ padding: 16 }}>
              <SectionHeader title="Exercise Mix (Interactive)" icon={<Icon.homework size={14} />} />
              <p style={S.caption}>Use the exercise filter above to inspect one exercise format at a time.</p>
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
                      <div style={S.progressTrack}>
                        <div style={{ ...S.progressFill, width: `${row.completionRate}%` }} />
                      </div>
                      <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-deep)' }}>{row.completionRate}%</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ padding: 16 }}>
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

          <Card style={{ padding: 16, marginTop: 12 }}>
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
    <Card style={{ padding: 14, background: bg }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-deep)' }}>{value}</div>
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

function getEvidenceCount(dx, countKey) {
  const counts = dx?.evidenceCounts || {};
  if (typeof counts[countKey] === 'number') return counts[countKey];
  if (countKey === 'testStrategy' && typeof dx?.testStrategyEvidenceCount === 'number') return dx.testStrategyEvidenceCount;
  return 0;
}

function buildExerciseMix(homework) {
  const map = new Map();

  homework.forEach((h) => {
    const type = h.type || h.skillType || 'General';
    if (!map.has(type)) {
      map.set(type, { type, count: 0, submitted: 0, reviewed: 0 });
    }
    const row = map.get(type);
    row.count += 1;
    if (h.status === 'submitted') row.submitted += 1;
    if (['reviewed', 'corrected', 'completed'].includes(h.status)) row.reviewed += 1;
  });

  return Array.from(map.values())
    .map((row) => ({ ...row, completionRate: row.count > 0 ? Math.round((row.reviewed / row.count) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
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
    background: 'linear-gradient(130deg, #0f2438 0%, #193249 45%, #25627f 100%)',
    color: '#fff',
  },
  heroTag: { fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9fd6d6', fontWeight: 700, marginBottom: 6 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.78)', margin: '4px 0 0', maxWidth: 620 },
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
    gridTemplateColumns: 'minmax(0, 1fr) minmax(100px, 1fr) auto',
    alignItems: 'center',
    gap: 10,
    border: '1px solid var(--divider)',
    borderRadius: 3,
    padding: '9px 10px',
    background: '#fff',
  },
  progressTrack: { height: 8, borderRadius: 999, background: 'var(--bg-deep)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2d8b8b 0%, #7cc9c9 100%)' },
  timelineRow: {
    display: 'grid',
    gridTemplateColumns: '28px minmax(0, 1fr)',
    gap: 10,
    border: '1px solid var(--divider)',
    borderRadius: 3,
    padding: '9px 10px',
    background: '#fff',
  },
  timelineIdx: {
    width: 24,
    height: 24,
    borderRadius: 999,
    background: 'var(--accent-subtle)',
    color: 'var(--accent-deep)',
    display: 'grid',
    placeItems: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
  },
  noteRow: { display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 8, alignItems: 'start', padding: '7px 9px', borderRadius: 3, background: 'var(--bg)' },
  noteDate: { color: 'var(--muted)', fontSize: 'var(--text-xs)' },
  empty: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '8px 0 0' },
};
