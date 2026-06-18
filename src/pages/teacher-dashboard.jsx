/**
 * teacher-dashboard.jsx — "Today": the single teacher command center.
 * Merges the old Dashboard (priority banner + KPIs + today's classes + quick actions)
 * with the old Class Prep cycle board (per-student stage + next action).
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import {
  getClassEvents, getAllSubmissions, getReviews,
  getStudentCycleState, requestInboxNotificationPermission,
} from '../lib/workflow.js';

function timeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

/* ─── Cycle stage config (from the former Class Prep view) ─────── */
const STAGE_CONFIG = {
  'needs-diagnosis':   { label: 'Needs diagnosis',   tone: 'danger',  action: 'Run diagnosis',     getNav: (s) => ['diagnostics:create', { studentId: s.id }] },
  'diagnosed':         { label: 'Diagnosed',         tone: 'info',    action: 'Send feedback',     getNav: (s) => ['diagnostics:create', { diagnosisId: s.cycle.latestDiagnosis?.id, studentId: s.id }] },
  'feedback-sent':     { label: 'Feedback sent',     tone: 'info',    action: 'Assign homework',   getNav: (s) => ['homework:create', { studentId: s.id, diagnosisId: s.cycle.latestDiagnosis?.id }] },
  'homework-assigned': { label: 'Homework assigned', tone: 'warning', action: 'View homework',     getNav: ()  => ['homework', {}] },
  'submitted':         { label: 'Submitted',         tone: 'success', action: 'Review submission', getNav: (s) => ['submissions:review', { submissionId: s.cycle.pendingSubmissions[0]?.id }] },
  'reviewed':          { label: 'Reviewed',          tone: 'success', action: 'New diagnosis',     getNav: (s) => ['diagnostics:create', { studentId: s.id }] },
};
const URGENCY_ORDER = ['submitted', 'needs-diagnosis', 'diagnosed', 'feedback-sent', 'homework-assigned', 'reviewed'];

export default function TeacherDashboard({ students, onNavigate, teacherName = 'Vini' }) {
  const [todayClasses, setTodayClasses] = useState([]);
  const [cycleStates, setCycleStates] = useState({});
  const [classesToday, setClassesToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('all');

  useEffect(() => {
    let live = true;
    async function load() {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [events, , , entries] = await Promise.all([
        getClassEvents(),
        getAllSubmissions(),
        getReviews(),
        Promise.all(students.map(async (s) => [s.id, await getStudentCycleState(s.id)])),
      ]);
      if (!live) return;
      const todays = (events || []).filter(e => e.date === todayStr && e.status !== 'canceled');
      setTodayClasses(todays);
      setClassesToday(todays.length);
      setCycleStates(Object.fromEntries(entries));
      setLoading(false);
    }
    void load();
    requestInboxNotificationPermission();
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
      cycleStage: 'needs-diagnosis', latestDiagnosis: null,
      pendingHomework: [], pendingSubmissions: [], daysSinceLastDiagnosis: null, totalDiagnoses: 0,
    },
  }));

  const stageCounts = {};
  studentsWithCycle.forEach(s => { stageCounts[s.cycle.cycleStage] = (stageCounts[s.cycle.cycleStage] || 0) + 1; });

  const needsAttention = studentsWithCycle.filter(s =>
    s.cycle.cycleStage === 'submitted' ||
    s.cycle.cycleStage === 'needs-diagnosis' ||
    (s.cycle.daysSinceLastDiagnosis !== null && s.cycle.daysSinceLastDiagnosis > 14)
  );
  const pendingReview = studentsWithCycle.filter(s => s.cycle.cycleStage === 'submitted').length;
  const needDiagnosis = stageCounts['needs-diagnosis'] || 0;

  const filtered = stageFilter === 'all'
    ? studentsWithCycle
    : studentsWithCycle.filter(s => s.cycle.cycleStage === stageFilter);
  const urgencySorted = [...filtered].sort(
    (a, b) => URGENCY_ORDER.indexOf(a.cycle.cycleStage) - URGENCY_ORDER.indexOf(b.cycle.cycleStage)
  );

  const handleAction = (student) => {
    const config = STAGE_CONFIG[student.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
    const [target, params] = config.getNav(student);
    onNavigate(target, params);
  };

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const priority = getTodayPriority({ needsAttention, todayClasses });

  return (
    <div className="td-shell">
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="td-headline">Good {timeOfDay()}, {teacherName}.</h1>
        <p className="td-sub">{today} — your teaching cycle at a glance.</p>
      </div>

      {/* Today's priority */}
      <Card className="td-priority-card" style={{ animation: 'fadeUp 0.3s var(--ease) both' }}>
        <div className="td-priority-icon">{priority.icon}</div>
        <div className="teacher-priority-copy">
          <div className="td-priority-kicker">Today priority</div>
          <h2 className="td-priority-title">{priority.title}</h2>
          <p className="td-priority-text">{priority.text}</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate(priority.target, priority.params || {})}>
          {priority.action} <Icon.arrowR size={14} />
        </Button>
      </Card>

      {/* KPIs */}
      <div className="td-kpi-grid">
        {[
          { label: 'Students', value: students.length, icon: <Icon.student size={16} /> },
          { label: 'Classes today', value: classesToday, icon: <Icon.calendar size={16} />, tone: classesToday > 0 ? 'info' : '' },
          { label: 'Need diagnosis', value: needDiagnosis, icon: <Icon.diagnose size={16} />, tone: needDiagnosis > 0 ? 'warning' : '', onClick: () => setStageFilter('needs-diagnosis') },
          { label: 'Pending review', value: pendingReview, icon: <Icon.doc size={16} />, tone: pendingReview > 0 ? 'danger' : '', onClick: () => onNavigate('submissions') },
        ].map((kpi, i) => (
          <div key={kpi.label} className="td-anim" style={{ animationDelay: `${i * 60}ms` }}>
            <KpiCard {...kpi} />
          </div>
        ))}
      </div>

      <div className="teacher-dashboard-stack">
        {/* Quick actions — top of stack for immediate access */}
        <Card style={{ padding: 14 }}>
          <SectionHeader title="Quick Actions" icon={<Icon.spark size={15} />} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <QuickAction icon={<Icon.student size={16} />} label="Add new student" onClick={() => onNavigate('students')} />
            <QuickAction icon={<Icon.calendar size={16} />} label="Schedule a class" onClick={() => onNavigate('calendar')} />
            <QuickAction icon={<Icon.diagnose size={16} />} label="Run a diagnosis" onClick={() => onNavigate('diagnostics')} />
            <QuickAction icon={<Icon.homework size={16} />} label="Create homework" onClick={() => onNavigate('homework')} />
            <QuickAction icon={<Icon.warning size={16} />} label="View error bank" onClick={() => onNavigate('error-bank')} />
          </div>
        </Card>

        {/* Today's classes */}
        <Card style={{ padding: 14 }}>
          <SectionHeader title="Today's Classes" icon={<Icon.calendar size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>View calendar</Button>} />
          {todayClasses.length === 0 ? (
            <div className="td-empty-state">
              <p className="td-empty">No classes scheduled today.</p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>Schedule a class →</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {todayClasses.map(ev => {
                const student = students.find(s => s.id === ev.studentId);
                return (
                  <div key={ev.id} className="td-list-row">
                    <Avatar name={student?.name || '?'} size={28} />
                    <div style={{ flex: 1 }}>
                      <div className="td-row-title">{student?.firstName || 'Unknown'} — {ev.title}</div>
                      <div className="td-row-sub">{ev.startTime || '—'} · {ev.classFocus || 'No focus set'}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Open</Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Needs your attention */}
        {needsAttention.length > 0 && (
          <Card style={{ padding: 14, border: '1.5px solid var(--warning-soft)', background: 'var(--warning-bg)' }}>
            <SectionHeader title="Needs Your Attention" icon={<Icon.spark size={15} />} />
            <div style={{ marginTop: 8 }}>
              {needsAttention.slice(0, 5).map((s, i) => {
                const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
                const staleNote = s.cycle.daysSinceLastDiagnosis > 14 ? ` — ${s.cycle.daysSinceLastDiagnosis}d since last diagnosis` : '';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? '1px solid var(--divider)' : 'none' }}>
                    <Avatar name={s.name} size={28} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', flex: 1 }}>{s.firstName}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{config.label}{staleNote}</span>
                    <Button variant="primary" size="sm" onClick={() => handleAction(s)}>{config.action}</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Student cycle board */}
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
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
          {loading ? (
            <p style={{ color: 'var(--muted)', padding: 16 }}>Loading student data…</p>
          ) : urgencySorted.length === 0 ? (
            <p style={{ color: 'var(--muted)', padding: 16 }}>No students match this filter.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {urgencySorted.map(s => (
                <StudentRow key={s.id} student={s} onNavigate={onNavigate} onAction={handleAction} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function getTodayPriority({ needsAttention, todayClasses }) {
  const submitted = needsAttention.find(s => s.cycle.cycleStage === 'submitted');
  if (submitted) {
    return {
      icon: <Icon.doc size={20} />,
      title: 'Review the newest submission',
      text: 'Give the student clear feedback while the homework attempt is still fresh.',
      action: 'Review submission',
      target: 'submissions:review',
      params: { submissionId: submitted.cycle.pendingSubmissions[0]?.id },
    };
  }
  const needsDx = needsAttention.find(s => s.cycle.cycleStage === 'needs-diagnosis');
  if (needsDx) {
    return {
      icon: <Icon.diagnose size={20} />,
      title: 'Finish the next diagnosis',
      text: 'Turn the completed class evidence into teacher notes, student feedback, and homework.',
      action: 'Run diagnosis',
      target: 'diagnostics:create',
      params: { studentId: needsDx.id },
    };
  }
  const firstClass = todayClasses[0];
  if (firstClass) {
    return {
      icon: <Icon.calendar size={20} />,
      title: 'Prepare today’s MET class',
      text: firstClass.classFocus || firstClass.metSkillFocus || 'Check the class plan and confirm the student focus before class.',
      action: 'Open class',
      target: 'calendar:class',
      params: { classEventId: firstClass.id },
    };
  }
  return {
    icon: <Icon.homework size={20} />,
    title: 'Plan the next useful practice',
    text: 'Review the roster and choose the student who needs the next class, diagnosis, or homework step.',
    action: 'View students',
    target: 'students',
  };
}

function KpiCard({ label, value, icon, tone, onClick }) {
  const cls = ['td-kpi-card', tone ? `td-kpi-card--${tone}` : ''].filter(Boolean).join(' ');
  const fg = tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : tone === 'info' ? 'var(--info)' : 'var(--accent-deep)';
  return (
    <Card className={cls} onClick={onClick}>
      <div className="td-kpi-card-inner">
        <span style={{ color: fg }}>{icon}</span>
        <span className="td-kpi-icon">{label}</span>
      </div>
      <div className="td-kpi-value" style={{ color: fg }}>{value}</div>
    </Card>
  );
}

function StudentRow({ student: s, onNavigate, onAction }) {
  const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
  const diag = s.cycle.latestDiagnosis;
  const focusArea = diag?.content?.priorities?.[0]?.area || '';
  const diagDate = diag ? new Date(diag.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
  const days = s.cycle.daysSinceLastDiagnosis;
  const isStale21 = days !== null && days > 21;
  const isStale14 = days !== null && days > 14;
  const currentBand = s.currentBand || s.band || 'B1';
  const targetBand = s.targetBand || s.bandTarget || 'B2';
  const isPrimary = s.cycle.cycleStage === 'submitted';

  return (
    <Card style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onNavigate('students:profile', { studentId: s.id })}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 160, textAlign: 'left', fontFamily: 'var(--font-ui)' }}
        >
          <Avatar name={s.name} size={34} />
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-md)', color: 'var(--text-1)' }}>{s.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
              {currentBand} → {targetBand} · Session {s.session}/{s.totalSessions} · Last diagnosis: {diagDate}
            </div>
            {focusArea && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2, fontStyle: 'italic' }}>
                Focus: {focusArea.length > 65 ? focusArea.slice(0, 65) + '…' : focusArea}
              </div>
            )}
          </div>
        </button>

        {isStale21 && <Pill tone="danger">{days}d overdue</Pill>}
        {!isStale21 && isStale14 && <Pill tone="warning">{days}d stale</Pill>}

        {s.cycle.pendingHomework.length > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', fontWeight: 'var(--weight-semibold)' }}>{s.cycle.pendingHomework.length} homework pending</span>
        )}
        {s.cycle.pendingSubmissions.length > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 'var(--weight-semibold)' }}>{s.cycle.pendingSubmissions.length} to review</span>
        )}

        <Pill tone={config.tone}>{config.label}</Pill>
        <Button variant={isPrimary ? 'primary' : 'ghost'} size="sm" onClick={() => onAction(s)}>{config.action}</Button>
      </div>
    </Card>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
        borderRadius: 'var(--radius-pill)', border: active ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft, rgba(37,99,235,0.1))' : 'var(--surface)',
        color: active ? 'var(--accent)' : 'var(--muted)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
        cursor: 'pointer', fontFamily: 'var(--font-ui)',
      }}
    >
      {label}{count > 0 && <span style={{ opacity: 0.65 }}>({count})</span>}
    </button>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="td-quick-action">
      <span className="td-quick-action-icon">{icon}</span>
      {label}
      <Icon.arrowR size={13} className="td-quick-action-arrow" />
    </button>
  );
}
