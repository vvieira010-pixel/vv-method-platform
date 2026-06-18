import { useState, useEffect, lazy, Suspense } from 'react';
import { Icon, Avatar } from '../components/shared.jsx';
import { getDiagnoses, getReviews } from '../lib/workflow.js';
import { hasVisibleApprovedStudentFeedback, asArray } from './student-helpers.js';
import StudentHome from './student-home.jsx';
import { StudentInbox, MessageTeacherDock } from '../components/message-center.jsx';

const StudentHomework = lazy(() => import('./student-homework.jsx'));
const StudentFeedback = lazy(() => import('./student-feedback.jsx'));
const StudentProgress = lazy(() => import('./student-progress.jsx'));
import '../styles/system.css';

const TABS = [
  { id: 'home',     label: 'Home',     icon: <Icon.home size={16} /> },
  { id: 'homework', label: 'Homework', icon: <Icon.homework size={16} /> },
  { id: 'feedback', label: 'Feedback', icon: <Icon.inbox size={16} /> },
  { id: 'progress', label: 'Progress', icon: <Icon.progress size={16} /> },
  { id: 'messages', label: 'Messages', icon: <Icon.feedback size={16} /> },
];

export default function StudentDashboard({ student, onSignOut }) {
  const [tab, setTab] = useState('home');
  const [dots, setDots] = useState({});

  const lvKey = student?.id ? `vv:student_last_visited:${student.id}` : null;

  function getLastVisited() {
    if (!lvKey) return {};
    try { return JSON.parse(localStorage.getItem(lvKey) || '{}'); } catch { return {}; }
  }

  useEffect(() => {
    if (!student?.id) return;
    (async () => {
      const lv = getLastVisited();
      const [diagnoses, reviews] = await Promise.all([getDiagnoses(student.id), getReviews(student.id)]);
      const next = {};

      const approvedDx = (diagnoses || []).filter(hasVisibleApprovedStudentFeedback)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (approvedDx.length > 0) {
        const newestAt = new Date(approvedDx[0].createdAt || 0);
        const seenAt = lv.feedback ? new Date(lv.feedback) : new Date(0);
        if (newestAt > seenAt) next.feedback = true;
      }

      const newestReview = (reviews || []).sort((a, b) => new Date(b.reviewedAt || b.createdAt || 0) - new Date(a.reviewedAt || a.createdAt || 0))[0];
      if (newestReview) {
        const reviewedAt = new Date(newestReview.reviewedAt || newestReview.createdAt || 0);
        const seenAt = lv.homework ? new Date(lv.homework) : new Date(0);
        if (reviewedAt > seenAt) next.homework = true;
      }

      const progressDx = (diagnoses || [])
        .filter(d => d.status === 'approved')
        .filter(d => asArray(d.content?.section_snapshot).some(s => Number(s.score_0_80) > 0))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (progressDx.length > 0) {
        const newestAt = new Date(progressDx[0].createdAt || 0);
        const seenAt = lv.progress ? new Date(lv.progress) : new Date(0);
        if (newestAt > seenAt) next.progress = true;
      }

      setDots(next);
    })();
  }, [student?.id]);

  function handleTabChange(tabId) {
    setTab(tabId);
    setDots(prev => prev[tabId] ? { ...prev, [tabId]: false } : prev);
    if (lvKey) {
      const lv = getLastVisited();
      lv[tabId] = new Date().toISOString();
      localStorage.setItem(lvKey, JSON.stringify(lv));
    }
  }

  if (!student) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}><p>Loading your dashboard…</p></div>;
  }

  return (
    <div className="dash">
      <header className="dash-topbar">
        <div className="dash-brand">
          <span className="dash-brand-name">MET Proficiency Mastery</span>
        </div>
        <nav className="dash-top-nav" aria-label="Student sections" role="tablist">
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => handleTabChange(t.id)} className={'dash-nav-btn' + (tab === t.id ? ' active' : '')}>
              <span className="dash-nav-icon" aria-hidden="true">{t.icon}</span>
              <span className="dash-nav-label">{t.label}</span>
              {dots[t.id] && <span className="dash-nav-dot" aria-label="New content available" />}
            </button>
          ))}
        </nav>
        <div className="dash-topbar-right">
          <span className="dash-topbar-name">{student.firstName}</span>
          <Avatar name={student.name} size={30} tone="auto" />
          <button onClick={onSignOut} style={{ background: 'none', border: '1px solid var(--dark-accent-border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: 11.5, fontWeight: 500, color: 'var(--on-dark-muted)', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dash-body">
        {tab === 'home' && <StudentHome student={student} onTab={setTab} />}
        <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>}>
          {tab === 'homework' && <StudentHomework student={student} />}
          {tab === 'feedback' && <StudentFeedback student={student} onTab={setTab} />}
          {tab === 'progress' && <StudentProgress student={student} />}
          {tab === 'messages' && <StudentInbox student={student} />}
        </Suspense>
      </div>
      <MessageTeacherDock student={student} onSent={() => setTab('messages')} />
    </div>
  );
}
