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

export default function TeacherDashboard({ students, onNavigate }) {
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
    const [events, submissions, reviews] = await Promise.all([
      getClassEvents(), getAllSubmissions(), Promise.resolve([]),
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
  const primaryAction = data.pendingSubmissions.length > 0
    ? { label: 'Review submissions', view: 'submissions', icon: <Icon.doc size={15} /> }
    : data.needsDiagnosis.length > 0
      ? { label: 'Run diagnosis', view: 'diagnostics', icon: <Icon.diagnose size={15} /> }
      : { label: 'Schedule class', view: 'calendar', icon: <Icon.calendar size={15} /> };
  const queueItems = buildActionQueue(data, students);

  return (
    <div style={styles.shell}>
      <section style={styles.hero}>
        <div style={styles.heroCopy}>
          <div style={styles.eyebrow}>Teacher Workspace</div>
          <h1 style={styles.heroTitle}>Good {timeOfDay()}, Vini.</h1>
          <p style={styles.heroSub}>
            Organize teaching operations in one place: classes, diagnosis queue, homework pipeline, and reviews.
          </p>
          <div style={styles.heroActions}>
            <Button variant="primary" onClick={() => onNavigate(primaryAction.view)} style={styles.heroButton}>
              {primaryAction.icon} {primaryAction.label}
            </Button>
            <Button variant="ghost" onClick={() => onNavigate('students')} style={styles.heroGhost}>
              <Icon.student size={15} /> Students
            </Button>
          </div>
        </div>
        <div style={styles.heroPanel}>
          <span style={styles.heroDate}>{today}</span>
          <div style={styles.heroMetric}>
            <strong>{data.stats.pendingReview + data.stats.needsDiagnosis}</strong>
            <span>priority tasks</span>
          </div>
          <div style={styles.heroStrip}>
            <span>Main flow</span>
            <strong>Class • Diagnosis • Feedback • Homework • Review</strong>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
        <KpiCard label="Students" value={data.stats.students} icon={<Icon.student size={16} />} />
        <KpiCard label="Classes today" value={data.stats.classesToday} icon={<Icon.calendar size={16} />} tone={data.stats.classesToday > 0 ? 'info' : ''} />
        <KpiCard label="Need diagnosis" value={data.stats.needsDiagnosis} icon={<Icon.diagnose size={16} />} tone={data.stats.needsDiagnosis > 0 ? 'warning' : ''} onClick={() => onNavigate('diagnostics')} />
        <KpiCard label="Pending review" value={data.stats.pendingReview} icon={<Icon.doc size={16} />} tone={data.stats.pendingReview > 0 ? 'danger' : ''} onClick={() => onNavigate('submissions')} />
      </div>

      <div style={styles.repoGrid}>
        <Card style={{ padding: 18 }}>
          <SectionHeader title="Action Queue" icon={<Icon.spark size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('submissions')}>Open queue</Button>} />
          {queueItems.length === 0 ? (
            <p style={styles.empty}>Everything is up to date.</p>
          ) : (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queueItems.slice(0, 8).map(item => (
                <div key={item.id} style={styles.queueRow}>
                  <div style={styles.queueColMain}>
                    <div style={styles.rowTitle}>{item.title}</div>
                    <div style={styles.rowSub}>{item.sub}</div>
                  </div>
                  <Pill tone={item.tone}>{item.tag}</Pill>
                  <Button variant={item.ctaVariant} size="sm" onClick={item.onClick}>{item.cta}</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: 18 }}>
          <SectionHeader title="Workspace Boards" icon={<Icon.home size={15} />} />
          <div style={styles.folderGrid}>
            <FolderTile icon={<Icon.student size={16} />} title="Students" subtitle={`${data.stats.students} active`} onClick={() => onNavigate('students')} />
            <FolderTile icon={<Icon.calendar size={16} />} title="Calendar" subtitle={`${data.stats.classesToday} today`} onClick={() => onNavigate('calendar')} />
            <FolderTile icon={<Icon.diagnose size={16} />} title="Diagnostics" subtitle={`${data.stats.needsDiagnosis} pending`} onClick={() => onNavigate('diagnostics')} />
            <FolderTile icon={<Icon.homework size={16} />} title="Homework" subtitle="Create and assign" onClick={() => onNavigate('homework')} />
            <FolderTile icon={<Icon.doc size={16} />} title="Submissions" subtitle={`${data.stats.pendingReview} pending`} onClick={() => onNavigate('submissions')} />
            <FolderTile icon={<Icon.warning size={16} />} title="Error Bank" subtitle="Track patterns" onClick={() => onNavigate('error-bank')} />
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
        <Card style={{ padding: 18 }}>
          <SectionHeader title="Today's Classes" icon={<Icon.calendar size={15} />} action={<Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>View calendar</Button>} />
          {data.todayClasses.length === 0 ? (
            <p style={styles.empty}>No classes scheduled today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
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

        <Card style={{ padding: 18 }}>
          <SectionHeader title="Priority Shortcuts" icon={<Icon.spark size={15} />} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            <QuickAction icon={<Icon.diagnose size={16} />} label="Run diagnosis from class record" onClick={() => onNavigate('diagnostics')} />
            <QuickAction icon={<Icon.homework size={16} />} label="Assign homework from diagnosis" onClick={() => onNavigate('homework')} />
            <QuickAction icon={<Icon.doc size={16} />} label="Review student submissions" onClick={() => onNavigate('submissions')} />
            <QuickAction icon={<Icon.progress size={16} />} label="Open student reports" onClick={() => onNavigate('reports')} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildActionQueue(data, students) {
  const diagnosisQueue = (data.needsDiagnosis || []).map(ev => {
    const student = students.find(s => s.id === ev.studentId);
    return {
      id: `dx-${ev.id}`,
      priority: 1,
      title: `${student?.firstName || 'Student'} needs diagnosis`,
      sub: `${new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${ev.title}`,
      tag: 'Diagnosis',
      tone: 'warning',
      cta: 'Diagnose',
      ctaVariant: 'primary',
      onClick: () => window.vvGo?.('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id }),
    };
  });

  const submissionQueue = (data.pendingSubmissions || []).map(sub => {
    const student = students.find(s => s.id === sub.studentId);
    return {
      id: `sub-${sub.id}`,
      priority: 0,
      title: `${student?.firstName || 'Student'} submitted homework`,
      sub: `Submitted ${new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      tag: 'Review',
      tone: 'danger',
      cta: 'Review',
      ctaVariant: 'primary',
      onClick: () => window.vvGo?.('submissions:review', { submissionId: sub.id }),
    };
  });

  const classQueue = (data.todayClasses || []).map(ev => {
    const student = students.find(s => s.id === ev.studentId);
    return {
      id: `class-${ev.id}`,
      priority: 2,
      title: `Class: ${student?.firstName || 'Student'}`,
      sub: `${ev.startTime || 'Time not set'} · ${ev.classFocus || 'No focus set'}`,
      tag: 'Class',
      tone: 'info',
      cta: 'Open',
      ctaVariant: 'ghost',
      onClick: () => window.vvGo?.('calendar:class', { classEventId: ev.id }),
    };
  });

  return [...submissionQueue, ...diagnosisQueue, ...classQueue]
    .sort((a, b) => a.priority - b.priority);
}

function KpiCard({ label, value, icon, tone, onClick }) {
  const bg = tone === 'warning' ? 'var(--warning-light)' : tone === 'danger' ? 'var(--error-light)' : tone === 'info' ? 'var(--info-light)' : 'var(--surface)';
  const fg = tone === 'warning' ? 'var(--warning)' : tone === 'danger' ? 'var(--error)' : tone === 'info' ? 'var(--info)' : 'var(--primary)';
  return (
    <button
      type="button"
      style={{
        ...styles.kpiButton,
        background: bg,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick || undefined}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ color: fg }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flex: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: fg, marginTop: 'var(--space-1)' }}>{value}</div>
    </button>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--text)',
        textAlign: 'left',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg)';
        e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      {label}
      <Icon.arrowR size={13} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
    </button>
  );
}

function FolderTile({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        background: '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</span>
      </span>
      <Icon.arrowR size={12} style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

const styles = {
  shell: { maxWidth: 1080, margin: '0 auto', padding: 'var(--space-8) var(--space-5)' },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .8fr)',
    gap: 'var(--space-5)',
    alignItems: 'stretch',
    marginBottom: 'var(--space-6)',
    padding: 'var(--space-6)',
    borderRadius: 'var(--radius-lg)',
    color: '#F8FAFC',
    background: 'linear-gradient(135deg, var(--primary) 0%, oklch(28% 0.07 210) 62%, oklch(26% 0.08 215) 100%)',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid rgba(255,255,255,.12)',
  },
  heroCopy: { minWidth: 0 },
  eyebrow: {
    marginBottom: 'var(--space-2)',
    color: 'var(--accent)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-bold)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  heroTitle: {
    margin: 0,
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--weight-bold)',
    lineHeight: 1.1,
    color: '#FFFFFF',
  },
  heroSub: {
    maxWidth: 620,
    margin: 'var(--space-3) 0 0',
    color: 'rgba(248,250,252,.8)',
    fontSize: 'var(--text-base)',
    lineHeight: 1.65,
  },
  heroActions: { display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-5)' },
  heroButton: { background: 'var(--accent)', color: 'var(--text)', boxShadow: 'var(--shadow-md)', fontWeight: 'var(--weight-bold)' },
  heroGhost: { color: '#F8FAFC', borderColor: 'rgba(255,255,255,.3)', background: 'transparent' },
  heroPanel: {
    border: '1px solid rgba(255,255,255,.14)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    background: 'rgba(255,255,255,.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
  },
  heroDate: { color: 'rgba(248,250,252,.8)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' },
  heroMetric: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
  heroStrip: {
    display: 'grid',
    gap: 'var(--space-1)',
    paddingTop: 'var(--space-3)',
    borderTop: '1px solid rgba(255,255,255,.15)',
    color: 'rgba(248,250,252,.75)',
    fontSize: 'var(--text-xs)',
  },
  repoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 20,
  },
  queueRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
    gap: 10,
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: '#fff',
    padding: '10px 12px',
  },
  queueColMain: { minWidth: 0 },
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    marginTop: 10,
  },
  kpiButton: {
    width: '100%',
    textAlign: 'left',
    padding: 'var(--space-4)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--transition-fast)',
  },
  headline: { fontFamily: 'var(--font-sans)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--primary)', margin: 0 },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 'var(--space-1) 0 0' },
  empty: { color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-4)', fontStyle: 'italic' },
  listRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' },
  rowTitle: { fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' },
  rowSub: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' },
};
