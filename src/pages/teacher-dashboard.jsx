/**
 * teacher-dashboard.jsx — Mastery Command Center.
 * Exception-focused dashboard for high-precision teaching.
 */
import { useState, useEffect } from 'react';
import { 
  Icon, Card, SectionHeader, Pill, Button, Avatar, Kpi 
} from '../components/shared.jsx';
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
    stats: { students: 0, classesToday: 0, pendingReview: 0, needsDiagnosis: 0 },
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
      todayClasses, needsDiagnosis, pendingSubmissions,
      stats: {
        students: students.length,
        classesToday: todayClasses.length,
        pendingReview: pendingSubmissions.length,
        needsDiagnosis: needsDiagnosis.length,
      },
    });
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page-shell">
      <div className="page-inner">
        {/* ═══════ Mastery Pulse ═══════ */}
        <header style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
            Good {timeOfDay()}, Vini.
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--text-lg)' }}>{today}</div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <Kpi label="Active Students" value={data.stats.students} />
          <Kpi label="Classes Today" value={data.stats.classesToday} />
          <Kpi label="Needs Diagnosis" value={data.stats.needsDiagnosis} trend={data.stats.needsDiagnosis > 0 ? "Action Required" : null} trendDir="down" />
          <Kpi label="Pending Review" value={data.stats.pendingReview} trend={data.stats.pendingReview > 0 ? "Action Required" : null} trendDir="down" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Needs Diagnosis */}
          <Card>
            <SectionHeader 
              title="Needs Diagnosis" 
              action={data.needsDiagnosis.length > 0 && <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics')}>View all</Button>}
            />
            {data.needsDiagnosis.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '16px 0' }}>All caught up — no classes awaiting diagnosis.</div>
            ) : (
              <div style={{ marginTop: 16 }}>
                {data.needsDiagnosis.slice(0, 5).map(ev => {
                  const student = students.find(s => s.id === ev.studentId);
                  return (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
                      <Avatar name={student?.name || '?'} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{student?.firstName || 'Unknown'}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ev.title}</div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: ev.studentId, classEventId: ev.id })}>Diagnose</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pending Review */}
          <Card>
            <SectionHeader 
              title="Pending Review" 
              action={data.pendingSubmissions.length > 0 && <Button variant="ghost" size="sm" onClick={() => onNavigate('submissions')}>View all</Button>}
            />
            {data.pendingSubmissions.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '16px 0' }}>No submissions waiting for review.</div>
            ) : (
              <div style={{ marginTop: 16 }}>
                {data.pendingSubmissions.slice(0, 5).map(sub => {
                  const student = students.find(s => s.id === sub.studentId);
                  return (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
                      <Avatar name={student?.name || '?'} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{student?.firstName || 'Unknown'}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => onNavigate('submissions:review', { submissionId: sub.id })}>Review</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ═══════ Quick Actions ═══════ */}
        <div style={{ marginTop: 48 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
            <ActionTile icon={<Icon.student size={20} />} label="Add Student" onClick={() => onNavigate('students')} />
            <ActionTile icon={<Icon.calendar size={20} />} label="Schedule Class" onClick={() => onNavigate('calendar')} />
            <ActionTile icon={<Icon.diagnose size={20} />} label="Run Diagnosis" onClick={() => onNavigate('diagnostics')} />
            <ActionTile icon={<Icon.homework size={20} />} label="Create Homework" onClick={() => onNavigate('homework')} />
            <ActionTile icon={<Icon.warning size={20} />} label="Error Bank" onClick={() => onNavigate('error-bank')} />
            <ActionTile icon={<Icon.doc size={20} />} label="Reports" onClick={() => onNavigate('reports')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionTile({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      padding: '20px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
      transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--info-bg)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text)' }}>{label}</div>
    </button>
  );
}
