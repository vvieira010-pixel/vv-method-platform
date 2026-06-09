/**
 * teacher-home.jsx — Educator View: student cycle board
 * Shows where every student is in the teaching loop right now.
 */
import { useEffect, useState } from 'react';
import { Icon, SectionHeader, Card, Pill, Avatar, Button } from '../components/shared.jsx';
import { getStudentCycleState, getClassEvents, clearWorkflowData } from '../lib/workflow.js';

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const STAGE_CONFIG = {
  'needs-diagnosis':   { label: 'Needs Diagnosis', tone: 'danger',  action: 'Run Diagnosis',     getNav: (s) => ['diagnostics:create', { studentId: s.id }] },
  'diagnosed':         { label: 'Diagnosed',        tone: 'info',    action: 'Send Feedback',     getNav: (s) => ['diagnostics:create', { diagnosisId: s.cycle.latestDiagnosis?.id, studentId: s.id }] },
  'feedback-sent':     { label: 'Feedback Sent',    tone: 'info',    action: 'Assign Homework',   getNav: (s) => ['homework:create', { studentId: s.id, diagnosisId: s.cycle.latestDiagnosis?.id }] },
  'homework-assigned': { label: 'HW Assigned',      tone: 'warning', action: 'View Homework',     getNav: ()  => ['homework', {}] },
  'submitted':         { label: 'Submitted',        tone: 'success', action: 'Review Submission', getNav: (s) => ['submissions:review', { submissionId: s.cycle.pendingSubmissions[0]?.id }] },
  'reviewed':          { label: 'Reviewed',         tone: 'success', action: 'New Diagnosis',     getNav: (s) => ['diagnostics:create', { studentId: s.id }] },
};

const URGENCY_ORDER = ['submitted', 'needs-diagnosis', 'diagnosed', 'feedback-sent', 'homework-assigned', 'reviewed'];

export default function EducatorView({ students, onNavigate }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const [cycleStates, setCycleStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');
  const [classesToday, setClassesToday] = useState(0);

  useEffect(() => {
    let live = true;
    async function load() {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [entries, events] = await Promise.all([
        Promise.all(students.map(async (s) => [s.id, await getStudentCycleState(s.id)])),
        getClassEvents(),
      ]);
      if (!live) return;
      setCycleStates(Object.fromEntries(entries));
      setClassesToday((events || []).filter(e => e.date === todayStr && e.status !== 'canceled').length);
      setLoading(false);
    }
    void load();
    window.addEventListener('focus', load);
    window.addEventListener('vv:students-updated', load);
    return () => {
      live = false;
      window.removeEventListener('focus', load);
      window.removeEventListener('vv:students-updated', load);
    };
  }, [students]);

  const studentsWithCycle = students.map(s => ({
    ...s,
    cycle: cycleStates[s.id] || {
      cycleStage: 'needs-diagnosis',
      latestDiagnosis: null,
      pendingHomework: [],
      pendingSubmissions: [],
      daysSinceLastDiagnosis: null,
      totalDiagnoses: 0,
    },
  }));

  const stageCounts = {};
  studentsWithCycle.forEach(s => {
    stageCounts[s.cycle.cycleStage] = (stageCounts[s.cycle.cycleStage] || 0) + 1;
  });

  const filtered = stageFilter === 'all'
    ? studentsWithCycle
    : studentsWithCycle.filter(s => s.cycle.cycleStage === stageFilter);

  const urgencySorted = [...filtered].sort(
    (a, b) => URGENCY_ORDER.indexOf(a.cycle.cycleStage) - URGENCY_ORDER.indexOf(b.cycle.cycleStage)
  );

  const needsAttention = studentsWithCycle.filter(s =>
    s.cycle.cycleStage === 'submitted' ||
    s.cycle.cycleStage === 'needs-diagnosis' ||
    (s.cycle.daysSinceLastDiagnosis !== null && s.cycle.daysSinceLastDiagnosis > 14)
  );

  const totalDiagnoses = Object.values(cycleStates).reduce((sum, c) => sum + (c.totalDiagnoses || 0), 0);
  const pendingReviews = studentsWithCycle.filter(s => s.cycle.cycleStage === 'submitted').length;

  const handleAction = (student) => {
    const config = STAGE_CONFIG[student.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
    const [target, params] = config.getNav(student);
    onNavigate(target, params);
  };

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 }}>
            Good {timeOfDay()}.
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' }}>
            {today} — Teaching cycle at a glance.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          <StatCard label="Students"       value={students.length}  icon={<Icon.student size={16} />} />
          <StatCard label="Classes Today"  value={classesToday}     icon={<Icon.calendar size={16} />} tone={classesToday > 0 ? 'info' : ''} />
          <StatCard label="Total Diagnoses" value={totalDiagnoses}  icon={<Icon.diagnose size={16} />} />
          <StatCard label="Pending Review" value={pendingReviews}   icon={<Icon.doc size={16} />} tone={pendingReviews > 0 ? 'danger' : ''} />
          <StatCard label="Need Attention" value={needsAttention.length} icon={<Icon.spark size={16} />} tone={needsAttention.length > 0 ? 'warning' : ''} />
        </div>

        {/* Attention queue */}
        {needsAttention.length > 0 && (
          <Card style={{ marginBottom: 20, border: '1.5px solid rgba(245,158,11,0.3)', background: 'rgba(255,251,235,0.7)' }}>
            <SectionHeader title="Needs Your Attention" icon={<Icon.spark size={15} />} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 10 }}>
              {needsAttention.slice(0, 5).map((s, i) => {
                const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
                const staleNote = s.cycle.daysSinceLastDiagnosis > 14
                  ? ` — ${s.cycle.daysSinceLastDiagnosis}d since last dx`
                  : '';
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                    borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  }}>
                    <Avatar name={s.name} size={28} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, flex: 1 }}>{s.firstName}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                      {config.label}{staleNote}
                    </span>
                    <Button variant="primary" size="sm" onClick={() => handleAction(s)}>
                      {config.action}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Stage filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <SectionHeader title="Student Cycle Board" icon={<Icon.student size={15} />} />
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <FilterChip label="All" count={students.length} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
            {Object.entries(STAGE_CONFIG)
              .filter(([key]) => stageCounts[key] > 0)
              .map(([key, cfg]) => (
                <FilterChip key={key} label={cfg.label} count={stageCounts[key]} active={stageFilter === key} onClick={() => setStageFilter(key)} />
              ))}
          </div>
        </div>

        {/* Roster */}
        {loading ? (
          <Card><p style={{ color: 'var(--muted)', padding: 20 }}>Loading student data…</p></Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgencySorted.length === 0 && (
              <Card><p style={{ color: 'var(--muted)', padding: 16 }}>No students match this filter.</p></Card>
            )}
            {urgencySorted.map(s => (
              <StudentRow key={s.id} student={s} onNavigate={onNavigate} onAction={handleAction} />
            ))}
          </div>
        )}

        {/* Danger zone */}
        <details style={{ marginTop: 40 }}>
          <summary style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', cursor: 'pointer', userSelect: 'none' }}>
            Danger zone
          </summary>
          <div style={{ marginTop: 10 }}>
            <Button variant="danger" size="sm" onClick={async () => {
              if (confirm('Clear ALL workflow data? This cannot be undone.')) {
                await clearWorkflowData();
                window.location.reload();
              }
            }}>
              Clear all workflow data
            </Button>
          </div>
        </details>
      </div>
    </div>
  );
}

function StudentRow({ student: s, onNavigate, onAction }) {
  const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
  const diag = s.cycle.latestDiagnosis;
  const focusArea = diag?.content?.priorities?.[0]?.area || '';
  const diagDate = diag
    ? new Date(diag.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—';
  const days = s.cycle.daysSinceLastDiagnosis;
  const isStale21 = days !== null && days > 21;
  const isStale14 = days !== null && days > 14;
  const currentBand = s.currentBand || s.band || 'B1';
  const targetBand = s.targetBand || s.bandTarget || 'B2';
  const isPrimary = s.cycle.cycleStage === 'submitted';

  return (
    <Card style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Student identity — clickable to profile */}
        <button
          type="button"
          onClick={() => onNavigate('students:profile', { studentId: s.id })}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            flex: 1, minWidth: 160, textAlign: 'left', fontFamily: 'var(--font-ui)',
          }}
        >
          <Avatar name={s.name} size={34} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--text-1)' }}>{s.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
              {currentBand} → {targetBand} · Session {s.session}/{s.totalSessions} · Last dx: {diagDate}
            </div>
            {focusArea && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2, fontStyle: 'italic' }}>
                Focus: {focusArea.length > 65 ? focusArea.slice(0, 65) + '…' : focusArea}
              </div>
            )}
          </div>
        </button>

        {/* Staleness */}
        {isStale21 && <Pill tone="danger">{days}d overdue</Pill>}
        {!isStale21 && isStale14 && <Pill tone="warning">{days}d stale</Pill>}

        {/* Pending counts */}
        {s.cycle.pendingHomework.length > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', fontWeight: 600 }}>
            {s.cycle.pendingHomework.length} HW pending
          </span>
        )}
        {s.cycle.pendingSubmissions.length > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success, #16a34a)', fontWeight: 600 }}>
            {s.cycle.pendingSubmissions.length} to review
          </span>
        )}

        <Pill tone={config.tone}>{config.label}</Pill>
        <Button variant={isPrimary ? 'primary' : 'ghost'} size="sm" onClick={() => onAction(s)}>
          {config.action}
        </Button>
      </div>
    </Card>
  );
}

function StatCard({ label, value, icon, tone }) {
  const bg = tone === 'warning' ? 'rgba(245,158,11,0.08)' : tone === 'danger' ? 'rgba(239,68,68,0.08)' : tone === 'info' ? 'rgba(45,139,139,0.08)' : 'var(--surface)';
  const fg = tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : tone === 'info' ? 'var(--accent)' : 'var(--accent-deep)';
  return (
    <Card style={{ padding: '14px 16px', background: bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: fg }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', flex: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: fg, marginTop: 4 }}>{value}</div>
    </Card>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 'var(--radius-pill)',
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft, rgba(45,139,139,0.1))' : 'var(--surface)',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {label}
      {count > 0 && <span style={{ opacity: 0.65 }}>({count})</span>}
    </button>
  );
}
