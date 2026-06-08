/**
 * teacher-dashboard.jsx — Command center showing today's priorities
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar, Kpi } from '../components/shared.jsx';
import {
  getClassEvents, getDiagnoses, getHomework, getAllSubmissions,
  getReviews, getStudents,
} from '../lib/workflow.js';

function timeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export default function TeacherDashboard({ students, onNavigate, teacherName = 'Vini' }) {
  const [data, setData] = useState({
    todayClasses: [], needsDiagnosis: [], pendingSubmissions: [],
    recentActivity: [], stats: { students: 0, classesToday: 0, pendingReview: 0, activeErrors: 0 },
  });

  useEffect(() => {
    loadDashboard();
    window.addEventListener('focus', loadDashboard);
    return () => window.removeEventListener('focus', loadDashboard);
  }, [students]);

  async function loadDashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const [events, submissions] = await Promise.all([
      getClassEvents(), getAllSubmissions(),
    ]);

    const todayClasses = events.filter(e => e.date === today && e.status !== 'canceled');
    const needsDiagnosis = events.filter(e => e.status === 'completed' && e.diagnosticStatus === 'not-started');
    const allSubs = submissions || [];
    const reviewedIds = new Set((await getReviews())?.map(r => r.submissionId) || []);
    const pendingSubmissions = allSubs.filter(s => s.status === 'submitted' && !reviewedIds.has(s.id));

    setData({
      todayClasses,
      needsDiagnosis,
      pendingSubmissions,
      stats: {
        students: students.length,
        classesToday: todayClasses.length,
        pendingReview: pendingSubmissions.length,
        needsDiagnosis: needsDiagnosis.length,
      },
    });
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const priority = getTodayPriority(data);

  return (
    <div style={styles.shell}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={styles.headline}>Good {timeOfDay()}, {teacherName}.</h1>
        <p style={styles.sub}>{today}</p>
      </div>

      <Card className="teacher-priority-card" style={styles.priorityCard}>
        <div style={styles.priorityIcon}>{priority.icon}</div>
        <div className="teacher-priority-copy">
          <div style={styles.priorityKicker}>Today priority</div>
          <h2 style={styles.priorityTitle}>{priority.title}</h2>
          <p style={styles.priorityText}>{priority.text}</p>
        </div>
        <Button variant="primary" onClick={() => onNavigate(priority.target, priority.params || {})}>
          {priority.action} <Icon.arrowR size={14} />
        </Button>
      </Card>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, marginBottom: 14 }}>
        <KpiCard label="Students" value={data.stats.students} icon={<Icon.student size={16} />} />
        <KpiCard label="Classes today" value={data.stats.classesToday} icon={<Icon.calendar size={16} />} tone={data.stats.classesToday > 0 ? 'info' : ''} />
        <KpiCard label="Need diagnosis" value={data.stats.needsDiagnosis} icon={<Icon.diagnose size={16} />} tone={data.stats.needsDiagnosis > 0 ? 'warning' : ''} onClick={() => onNavigate('diagnostics')} />
        <KpiCard label="Pending review" value={data.stats.pendingReview} icon={<Icon.doc size={16} />} tone={data.stats.pendingReview > 0 ? 'danger' : ''} onClick={() => onNavigate('submissions')} />
      </div>

      <div className="teacher-dashboard-stack">
        {/* Today's classes */}
        <Card style={{ padding: 14 }}>
          <SectionHeader title="Today's Classes" icon={<Icon.calendar size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>View calendar</Button>} />
          {data.todayClasses.length === 0 ? (
            <p style={styles.empty}>No classes scheduled today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {data.todayClasses.map(ev => {
                const student = students.find(s => s.id === ev.studentId);
                return (
                  <div key={ev.id} style={styles.listRow}>
                    <Avatar name={student?.name || '?'} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.rowTitle}>{student?.firstName || 'Unknown'} — {ev.title}</div>
                      <div style={styles.rowSub}>{ev.startTime || '—'} · {ev.classFocus || 'No focus set'}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar:class', { classEventId: ev.id })}>Open</Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Needs diagnosis */}
        <Card style={{ padding: 14 }}>
          <SectionHeader title="Classes Needing Diagnosis" icon={<Icon.diagnose size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics')}>All diagnostics</Button>} />
          {data.needsDiagnosis.length === 0 ? (
            <p style={styles.empty}>All caught up! No classes awaiting diagnosis.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {data.needsDiagnosis.slice(0, 5).map(ev => {
                const student = students.find(s => s.id === ev.studentId);
                return (
                  <div key={ev.id} style={styles.listRow}>
                    <Avatar name={student?.name || '?'} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.rowTitle}>{student?.firstName || 'Unknown'}</div>
                      <div style={styles.rowSub}>{new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {ev.title}</div>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id })}>
                      Diagnose
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pending submissions */}
        <Card style={{ padding: 14 }}>
          <SectionHeader title="Submissions Awaiting Review" icon={<Icon.doc size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('submissions')}>All submissions</Button>} />
          {data.pendingSubmissions.length === 0 ? (
            <p style={styles.empty}>No submissions waiting for review.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {data.pendingSubmissions.slice(0, 5).map(sub => {
                const student = students.find(s => s.id === sub.studentId);
                return (
                  <div key={sub.id} style={styles.listRow}>
                    <Avatar name={student?.name || '?'} size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={styles.rowTitle}>{student?.firstName || 'Unknown'}</div>
                      <div style={styles.rowSub}>Submitted {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => onNavigate('submissions:review', { submissionId: sub.id })}>Review</Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick actions */}
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
      </div>
    </div>
  );
}

function getTodayPriority(data) {
  const firstSubmission = data.pendingSubmissions[0];
  if (firstSubmission) {
    return {
      icon: <Icon.doc size={20} />,
      title: 'Review the newest submission',
      text: 'Give the student clear feedback while the homework attempt is still fresh.',
      action: 'Open review',
      target: 'submissions:review',
      params: { submissionId: firstSubmission.id },
    };
  }
  const firstDiagnosis = data.needsDiagnosis[0];
  if (firstDiagnosis) {
    return {
      icon: <Icon.diagnose size={20} />,
      title: 'Finish the next diagnosis',
      text: 'Turn the completed class evidence into teacher notes, student feedback, and homework.',
      action: 'Diagnose class',
      target: 'diagnostics:create',
      params: { studentId: firstDiagnosis.studentId, classEventId: firstDiagnosis.id },
    };
  }
  const firstClass = data.todayClasses[0];
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
  const bg = tone === 'warning' ? 'var(--warning-bg)' : tone === 'danger' ? 'var(--danger-bg)' : tone === 'info' ? 'var(--info-bg)' : 'var(--surface)';
  const fg = tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--danger)' : tone === 'info' ? 'var(--info)' : 'var(--accent-deep)';
  return (
    <Card style={{ padding: '12px 14px', background: bg, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: fg }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', flex: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: fg, marginTop: 2 }}>{value}</div>
    </Card>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text)', textAlign: 'left', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
      onFocus={e => e.currentTarget.style.background = 'var(--bg)'}
      onBlur={e => e.currentTarget.style.background = 'var(--surface)'}>
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      {label}
      <Icon.arrowR size={13} style={{ marginLeft: 'auto', color: 'var(--muted)' }} />
    </button>
  );
}

const styles = {
  shell: { maxWidth: 1000, margin: '0 auto', padding: '18px 16px' },
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '4px 0 0' },
  priorityCard: {
    marginBottom: 12,
    padding: 14,
    border: '1.5px solid rgba(45,139,139,0.32)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f8f8 100%)',
  },
  priorityIcon: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--accent-subtle)',
    color: 'var(--accent-text)',
    flexShrink: 0,
  },
  priorityKicker: { fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-text)' },
  priorityTitle: { margin: '1px 0 2px', fontSize: 'var(--text-lg)', color: 'var(--accent-deep)', fontWeight: 800 },
  priorityText: { margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.5 },
  empty: { color: 'var(--muted)', fontSize: 'var(--text-sm)', marginTop: 8, fontStyle: 'italic' },
  listRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--divider)' },
  rowTitle: { fontWeight: 600, fontSize: 'var(--text-sm)' },
  rowSub: { fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 },
};
