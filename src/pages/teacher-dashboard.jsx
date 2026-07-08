/**
 * teacher-dashboard.jsx — "Today": the single teacher command center.
 * Merges the old Dashboard (priority banner + KPIs + today's classes + quick actions)
 * with the old Class Prep cycle board (per-student stage + next action).
 */
import { useState, useEffect, useMemo } from 'react';
import { Icon, SectionHeader, Pill, Avatar, SkeletonCard, EmptyState } from '../components/shared.jsx';
import { IlloNoClasses } from '../components/ui/empty-illustrations.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import {
  getClassEvents, getAllSubmissions, getReviews,
  getStudentCycleState, requestInboxNotificationPermission,
  getSeedsStages, setStudentSeedsStage,
} from '../lib/workflow.js';
import { SEEDS_STAGES, SEEDS_STAGE_ORDER } from '../domain/seeds/constants.js';

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
  const [seedsStages, setSeedsStages] = useState({});

  useEffect(() => {
    let live = true;
    async function load() {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const results = await Promise.allSettled([
          getClassEvents(),
          getAllSubmissions(),
          getReviews(),
          Promise.allSettled(students.map(s =>
            getStudentCycleState(s.id).then(state => [s.id, state]).catch(() => [s.id, null])
          )),
        ]);
        if (!live) return;
        const events = results[0].status === 'fulfilled' ? results[0].value : [];
        const entries = results[3].status === 'fulfilled'
          ? results[3].value.filter(r => r.status === 'fulfilled' && r.value[1]).map(r => r.value)
          : [];
        const todays = (events || []).filter(e => e.date === todayStr && e.status !== 'canceled');
        setTodayClasses(todays);
        setClassesToday(todays.length);
        setCycleStates(Object.fromEntries(entries));
        const seedsArray = await getSeedsStages();
        setSeedsStages(Object.fromEntries(seedsArray.map(s => [s.studentId, s])));
      } catch (error) {
        console.error('Failed to load teacher dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    void load();
    window.addEventListener('vv:seeds-updated', async () => {
      const arr = await getSeedsStages();
      setSeedsStages(Object.fromEntries(arr.map(s => [s.studentId, s])));
    });
    requestInboxNotificationPermission();
    window.addEventListener('focus', load);
    window.addEventListener('vv:students-updated', load);
    return () => {
      live = false;
      window.removeEventListener('focus', load);
      window.removeEventListener('vv:students-updated', load);
    };
  }, [students]);

  const { stageCounts, needsAttention, pendingReview, needDiagnosis, urgencySorted } = useMemo(() => {
    if (!students || !Array.isArray(students)) return { studentsWithCycle: [], stageCounts: {}, needsAttention: [], pendingReview: 0, needDiagnosis: 0, urgencySorted: [] };
    
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

    return { studentsWithCycle, stageCounts, needsAttention, pendingReview, needDiagnosis, urgencySorted };
  }, [students, cycleStates, stageFilter]);

  const handleAction = (student) => {
    const config = STAGE_CONFIG[student.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
    const [target, params] = config.getNav(student);
    onNavigate(target, params);
  };

  const handleSetSeedsStage = (studentId, stage) => {
    setStudentSeedsStage(studentId, stage);
    setSeedsStages(prev => ({ ...prev, [studentId]: { stage, startedAt: new Date().toISOString(), note: '' } }));
  };

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const priority = getTodayPriority({ needsAttention, todayClasses });

  return (
    <div className="td-shell bg-grain">
      {/* Header */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'fixed', left: '-9999px' }}>
        {loading ? 'Loading dashboard' : `${students.length} students, ${classesToday} classes today`}
      </div>
      <div className="mb-4">
        <h1 className="td-headline">Good {timeOfDay()}, {teacherName}.</h1>
        <p className="td-sub">{today}, your teaching cycle at a glance.</p>
      </div>

        {/* Today's priority */}
        <Card className="td-priority-card td-priority-card-premium td-anim td-anim-up" bezel>
          <div className="td-priority-icon">{priority.icon}</div>
          <div className="teacher-priority-copy">
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
            { label: 'Students', value: students.length, icon: <Icon.student size={16} />, tone: 'navy', dir: 'left' },
            { label: 'Classes today', value: classesToday, icon: <Icon.calendar size={16} />, tone: classesToday > 0 ? 'info' : 'teal', dir: 'right' },
            { label: 'Need diagnosis', value: needDiagnosis, icon: <Icon.diagnose size={16} />, tone: needDiagnosis > 0 ? 'warning' : 'teal', dir: 'left', onClick: () => setStageFilter('needs-diagnosis') },
            { label: 'Pending review', value: pendingReview, icon: <Icon.doc size={16} />, tone: pendingReview > 0 ? 'danger' : 'teal', dir: 'right', onClick: () => onNavigate('submissions') },
          ].map((kpi, i) => (
            <div key={kpi.label} className={`td-anim td-anim-${kpi.dir}`} style={{ animationDelay: `${i * 100}ms` }}>
              <KpiCard {...kpi} />
            </div>
          ))}
        </div>

       <div className="teacher-dashboard-stack">
          {/* Quick actions — top of stack for immediate access */}
          <Card className="td-card-section td-card-accent td-anim td-anim-up" bezel>
            <SectionHeader title="Quick Actions" icon={<Icon.spark size={15} />} />

            <div className="grid-square">
              <QuickAction icon={<Icon.student size={24} />} label="Add new student" onClick={() => onNavigate('students')} />
              <QuickAction icon={<Icon.calendar size={24} />} label="Schedule a class" onClick={() => onNavigate('calendar')} />
              <QuickAction icon={<Icon.diagnose size={24} />} label="Run a diagnosis" onClick={() => onNavigate('diagnostics')} />
              <QuickAction icon={<Icon.homework size={24} />} label="Create homework" onClick={() => onNavigate('homework')} />
              <QuickAction icon={<Icon.warning size={24} />} label="View error bank" onClick={() => onNavigate('diagnostics:errors')} />
            </div>
         </Card>

          {/* Today's classes */}
          <Card className="td-card-section td-card-accent td-anim td-anim-up" bezel>
            <SectionHeader title="Today's Classes" icon={<Icon.calendar size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>View calendar</Button>} />

           {todayClasses.length === 0 ? (
             <EmptyState
               icon={<IlloNoClasses />}
               title="No classes today"
               text="Use this time to catch up on diagnoses, review homework, or plan ahead."
               action="Schedule a class"
               onAction={() => onNavigate('calendar')}
             />
            ) : (
              <div className="grid-square">
                {todayClasses.map(ev => {
                  const student = students.find(s => s.id === ev.studentId);
                  return (
                    <Card key={ev.id} className="square-card" style={{ padding: '12px', justifyContent: 'center', gap: 12 }}>
                      <Avatar name={student?.name || '?'} size={40} />
                      <div style={{ textAlign: 'center', overflow: 'hidden' }}>
                        <div className="td-row-title" style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{student?.firstName || 'Unknown'}</div>
                        <div className="td-row-sub" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ev.title}</div>
                        <div className="td-row-sub" style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ev.startTime || '—'}</div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Open</Button>
                    </Card>
                  );
                })}
              </div>
            )}
         </Card>

         {needsAttention.length > 0 && (
           <div className="td-alert-banner">
             <Icon.spark size={14} />
             <span>{needsAttention.length} student{needsAttention.length > 1 ? 's' : ''} need{needsAttention.length === 1 ? 's' : ''} attention</span>
             <button className="td-alert-link" onClick={() => setStageFilter('submitted')}>
               Review now <Icon.arrowR size={12} />
             </button>
           </div>
         )}

          {/* Student cycle board */}
          <Card className="td-card-section td-card-accent td-anim td-anim-up" bezel>
            <div className="flex-wrap-row-3 items-center mb-2">

             <SectionHeader title="Student Cycle Board" icon={<Icon.student size={15} />} />
             <div className="td-filter-bar">
               <FilterChip label="All" count={students.length} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
               {Object.entries(STAGE_CONFIG)
                 .filter(([key]) => stageCounts[key] > 0)
                 .map(([key, cfg]) => (
                   <FilterChip key={key} label={cfg.label} count={stageCounts[key]} active={stageFilter === key} onClick={() => setStageFilter(key)} />
                 ))}
             </div>
           </div>
           {loading ? (
             <div aria-busy="true" aria-label="Loading student data" className="td-skeleton-area">
               <SkeletonCard height={60} lines={1} />
               <SkeletonCard height={60} lines={1} />
               <SkeletonCard height={60} lines={1} />
             </div>
           ) : urgencySorted.length === 0 ? (
             <EmptyState icon={<Icon.student size={20} />} title="No students match this filter" text="Try selecting a different filter above or check the Students page." action="View all students" onAction={() => setStageFilter('all')} />
            ) : (
              <div className="cycle-board-scroll">
                {urgencySorted.map(s => (
                  <StudentRow key={s.id} student={s} onNavigate={onNavigate} onAction={handleAction} seedsStages={seedsStages} onSetSeedsStage={handleSetSeedsStage} />
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
  const cls = ['td-kpi-card', 'td-card-accent', tone ? `td-card-accent--${tone}` : '', tone ? `td-kpi-card--${tone}` : ''].filter(Boolean).join(' ');
  return (
    <Card className={cls} onClick={onClick} aria-label={`${label}: ${value}`}>
      <div className="td-kpi-card-inner">
        <span className="td-kpi-icon">{icon}</span>
        <span className="td-kpi-label">{label}</span>
      </div>
      <div className="td-kpi-value">{value}</div>
    </Card>
  );
}

function StudentRow({ student: s, onNavigate, onAction, seedsStages, onSetSeedsStage }) {
  const config = STAGE_CONFIG[s.cycle.cycleStage] || STAGE_CONFIG['needs-diagnosis'];
  const diag = s.cycle.latestDiagnosis;
  const focusArea = diag?.content?.priorities?.[0]?.area || '';
  const diagDate = diag ? new Date(diag.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
  const days = s.cycle.daysSinceLastDiagnosis;
  const isStale21 = days !== null && days > 21;
  const isStale14 = days !== null && days > 14;
  const currentBand = s.currentBand || s.band || 'B1';
  const targetBand = s.targetBand || s.bandTarget || 'B2';
  const seedsEntry = seedsStages[s.id];
  const currentSeeds = seedsEntry ? SEEDS_STAGES[seedsEntry.stage] : null;

  return (
    <Card
      className="square-card"
      bezel
      onClick={() => onNavigate('students:profile', { studentId: s.id })}
    >
      <Avatar name={s.name} size={48} />
      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textAlign: 'center' }}>
        {currentBand} → {targetBand}
      </div>
      
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {isStale21 ? <Pill tone="danger">{days}d overdue</Pill> : isStale14 ? <Pill tone="warning">{days}d stale</Pill> : null}
        <Pill tone={config.tone}>{config.label}</Pill>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 12, width: '100%', textAlign: 'center' }}>
        <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={(e) => { e.stopPropagation(); onAction(s); }}>
          {config.action} <Icon.arrowR size={12} />
        </Button>
      </div>
    </Card>
  );
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`td-filter-chip${active ? ' td-filter-chip--active' : ''}`}
    >
      {label}{count > 0 && <span>({count})</span>}
    </button>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="square-card td-quick-action" aria-label={label} style={{ border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.2s' }}>
      <span className="td-quick-action-icon" style={{ marginBottom: 8, color: 'var(--accent)' }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>{label}</span>
    </button>
  );
}
