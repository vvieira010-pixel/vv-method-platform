import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Icon, SkeletonCard, EmptyState, Card } from '../components/shared.jsx';
import { getHomework, getDiagnoses, getClassEvents, getReviews, getSubmissions, getStudentSeedsStage } from '../lib/workflow.js';
import { getDueCount, getDueItems, toMCQ, getAllEntries } from '../lib/spaced-repetition.js';
import { getTeacherSetting } from '../lib/supabase-db.js';
import { asArray, getSkillTrend, hasVisibleApprovedStudentFeedback } from './student-helpers.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('[StudentHome] Chunk load failed, forcing reload...', error);
      window.location.reload();
      throw error;
    }
  });
}

const PracticeSession = lazyWithRetry(() => import('../components/PracticeSession.jsx'));
const ReviewSession   = lazyWithRetry(() => import('../components/ReviewSession.jsx'));

function daysUntilExam() {
  try {
    const ds = localStorage.getItem('vv:met_exam_date');
    if (!ds) return null;
    const exam = new Date(ds + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / 86400000);
  } catch { return null; }
}

function TodoRow({ done, label, meta }) {
  return (
    <div className={`todo-row${done ? ' todo-row--done' : ''}`}>
      <span className={`todo-row-icon${done ? ' todo-row-icon--done' : ''}`}>
        {done ? <Icon.check size={16} /> : <Icon.circle size={16} />}
      </span>
      <div className="todo-row-content">
        <div className={`todo-row-label${done ? ' todo-row-label--done' : ''}`}>{label}</div>
        <div className="todo-row-meta">{meta}</div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, sub, tone, onClick }) {
  const cls = `stat-chip${tone ? ` stat-chip--${tone}` : ''}${onClick ? ' stat-chip--clickable' : ''}`;
  const content = (
    <>
      <span className="stat-chip-icon">{icon}</span>
      <div className="stat-chip-copy">
        <strong className="stat-chip-value">{value}</strong>
        <span className="stat-chip-label">{sub || label}</span>
      </div>
    </>
  );
  if (onClick) {
    return <button type="button" className={cls} onClick={onClick}>{content}</button>;
  }
  return <div className={cls}>{content}</div>;
}

export default function StudentHome({ student, onTab }) {
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [pendingHw, setPendingHw] = useState([]);
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [snapshot, setSnapshot] = useState([]);
  const [practiceMode, setPracticeMode] = useState(null);
  const [approvedHistory, setApprovedHistory] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [reviewExercises, setReviewExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    getStudentSeedsStage(student.id).then(() => {});
    const stored = localStorage.getItem('vv:student_general_memo');
    if (stored) setMemo(stored);
    getTeacherSetting('general_memo').then(text => {
      if (text) { setMemo(text); localStorage.setItem('vv:student_general_memo', text); }
    }).catch(() => {});
    const handler = () => {
      const updated = localStorage.getItem('vv:student_general_memo');
      setMemo(updated || '');
    };
    window.addEventListener('vv:student-memo-changed', handler);
    return () => window.removeEventListener('vv:student-memo-changed', handler);
  }, []);

  useEffect(() => {
    (async () => {
      try {
      const [hw, diagnoses, classEvents, reviews, subs] = await Promise.all([
        getHomework(student.id),
        getDiagnoses(student.id),
        getClassEvents(student.id),
        getReviews(student.id),
        getSubmissions(student.id),
      ]);
      setHomework(hw || []);
      setReviews(reviews || []);
      setSubmissions(subs || []);
      setReviewCount(getDueCount(student.id));
      const doneStatuses = new Set(['submitted', 'reviewed', 'completed', 'corrected']);
      setPendingHw((hw || []).filter(h => !doneStatuses.has(h.status)));

      const newestReview = (reviews || [])
        .sort((a, b) => new Date(b.reviewedAt || b.createdAt || 0) - new Date(a.reviewedAt || a.createdAt || 0))[0];
      if (newestReview) {
        const reviewedHw = (hw || []).find(item => item.id === newestReview.homeworkId);
        setLatestReview({ ...newestReview, homeworkTitle: reviewedHw?.title || 'Homework review' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = (classEvents || [])
        .filter(e => e.status !== 'cancelled')
        .map(e => ({ ...e, startAt: new Date(`${e.date || new Date().toISOString().slice(0, 10)}T${e.startTime || '00:00'}`) }))
        .filter(e => e.startAt >= today)
        .sort((a, b) => a.startAt - b.startAt);
      setNextClass(upcoming[0] || null);
      setUpcomingClasses(upcoming.slice(0, 4));

      const approvedDx = (diagnoses || [])
        .filter(hasVisibleApprovedStudentFeedback)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (approvedDx.length > 0) {
        setLatestFeedback(approvedDx[0].sections.studentFeedback.content);
      }

      const allApprovedDx = (diagnoses || [])
        .filter(d => d.status === 'approved')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (allApprovedDx.length > 0) {
        setSnapshot(asArray(allApprovedDx[0].content?.section_snapshot));
        setApprovedHistory(allApprovedDx);
      }
      } catch (e) {
        console.error('[StudentHome] failed to load:', e);
        setLoadError(e.message);
      }
      setLoading(false);
    })();
  }, [student.id]);

  const developmentData = useMemo(() => {
    const points = [];
    homework.forEach(h => {
      const rev = reviews.find(r => r.homeworkId === h.id);
      const sub = submissions.find(s => s.homeworkId === h.id);
      if (rev && rev.score !== null) {
        points.push({
          name: h.title.length > 10 ? h.title.substring(0, 10) + '..' : h.title,
          development: rev.score,
          confidence: sub?.confidence !== null ? (sub.confidence / 3) * 100 : null,
          date: new Date(rev.reviewedAt || h.assignedAt),
          type: 'Homework'
        });
      }
    });
    approvedHistory.forEach(d => {
      const snap = asArray(d.content?.section_snapshot);
      const evaluated = snap.filter(s => s.evaluated && Number(s.score_0_80) > 0);
      if (evaluated.length > 0) {
        const avg = evaluated.reduce((sum, s) => sum + Number(s.score_0_80), 0) / evaluated.length;
        const date = new Date(d.createdAt || 0);
        points.push({
          name: 'Diagnosis ' + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          development: Math.round((avg / 80) * 100),
          confidence: null,
          date,
          type: 'Diagnosis'
        });
      }
    });
    return points.sort((a, b) => a.date - b.date);
  }, [homework, reviews, submissions, approvedHistory]);

  function timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  const pendingTitle = pendingHw[0]?.title || 'No homework pending';
  const snapshotEvaluatedSkills = snapshot.filter(s => s.evaluated || Number(s.score_0_80) > 0);
  const evaluatedSkills = snapshotEvaluatedSkills.length > 0
    ? snapshotEvaluatedSkills
    : approvedHistory
        .flatMap(dx => asArray(dx?.content?.section_snapshot))
        .filter(s => s.evaluated || Number(s.score_0_80) > 0)
        .filter((skill, index, list) => index === list.findIndex(item => item.section === skill.section));
  const fallbackFocus = nextClass?.metSkillFocus || nextClass?.classFocus || student.focusSkill || 'MET speaking organization';
  const focusSkill = String(snapshotEvaluatedSkills[0]?.section || fallbackFocus);
  const focusTrend = snapshotEvaluatedSkills[0] ? getSkillTrend(focusSkill, approvedHistory) : { dir: 'none' };

  function handleOpenReview() {
    const due = getDueItems(student.id);
    if (due.length === 0) { window.toast?.('No items due for review.', 'warn'); return; }
    const all = getAllEntries(student.id);
    const exercises = due.map(e => toMCQ(e, all));
    setReviewExercises(exercises);
    setReviewMode(true);
  }

  if (loadError) {
    return (
      <div className="student-home">
        <section className="student-hero bg-grain fade-up" style={{ '--delay': '0s' }}>
          <div>
            <h1>Could not load dashboard</h1>
            <p>Something went wrong. Please try refreshing the page.</p>
          </div>
        </section>
        <EmptyState
          title="Loading error"
          text={loadError}
          action="Reload page"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const heroAction = pendingHw.length > 0
    ? { label: 'Open homework', tab: 'homework', icon: <Icon.homework size={15} /> }
    : { label: 'View progress', tab: 'progress', icon: <Icon.progress size={15} /> };

  const nextDate = nextClass?.startAt
    ? nextClass.startAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Not scheduled';
  const nextTime = nextClass?.startAt
    ? nextClass.startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Teacher will confirm';

  const daysLeft = daysUntilExam();
  const examDateStr = (() => { try { return localStorage.getItem('vv:met_exam_date') || ''; } catch { return ''; } })();

  const lowestSkill = evaluatedSkills.length > 1
    ? [...evaluatedSkills].sort((a, b) => (Number(a.score_0_80) || 80) - (Number(b.score_0_80) || 80))[0]
    : null;

  return (
    <div className="student-home">
      <section className="student-hero bg-grain fade-up" style={{ '--delay': '0s' }}>
        <div>
          <h1>Good {timeOfDay()}, {student.firstName}.</h1>
          <p>{student.currentLevel || student.band || 'Current level'} to {student.targetLevel || student.bandTarget || 'target level'} · Session {student.session || 1}/{student.totalSessions || 24}</p>
        </div>
         <button className="student-hero-action" onClick={() => onTab(heroAction.tab)}>
           {heroAction.icon}
           {heroAction.label}
         </button>
        </section>

      <Card bezel className="memo-board fade-up" style={{ '--delay': '0.1s' }}>
        <div className="memo-board-text">
          <span className="memo-board-kicker">General Memo</span>
          {memo ? (
            <p>{memo}</p>
          ) : (
            <p className="memo-board-empty">No announcements. Stay focused on your MET goals.</p>
          )}
        </div>
        <div className="memo-board-chips">
          {reviewCount > 0 && (
            <StatChip icon={<Icon.refresh size={15} />} label="Due" value={`${reviewCount}`} sub="spaced repetition" tone="urgent" onClick={handleOpenReview} />
          )}
          <StatChip icon={<Icon.homework size={15} />} label="Homework" value={String(pendingHw.length)} sub={pendingHw.length === 1 ? 'task pending' : 'tasks pending'} tone="teal" onClick={() => onTab('homework')} />
          <StatChip icon={<Icon.calendar size={15} />} label="Next class" value={nextDate} sub={nextTime} tone="teal" onClick={() => onTab('schedule')} />
          <StatChip icon={<Icon.progress size={15} />} label="Focus" value={focusSkill.length > 18 ? focusSkill.slice(0, 18) + '…' : focusSkill} sub={focusTrend.dir !== 'none' ? focusTrend.label : 'next practice'} tone="navy" onClick={() => onTab('progress')} />
          <StatChip icon={<Icon.inbox size={15} />} label="Feedback" value={latestFeedback ? 'Ready' : 'Waiting'} sub={latestFeedback ? 'teacher approved' : 'after diagnosis'} tone="teal" onClick={() => latestFeedback && onTab('feedback')} />
          {daysLeft !== null && (
            <StatChip icon={<Icon.calendar size={15} />} label="MET exam" value={daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? 'Today!' : 'Done'} sub={daysLeft > 0 ? new Date(examDateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : daysLeft === 0 ? 'Good luck!' : 'Passed'} tone={daysLeft <= 30 ? 'urgent' : 'exam'} />
          )}
        </div>
      </Card>

      <Suspense fallback={null}>
        {practiceMode && (
          <PracticeSession 
            mode={practiceMode} 
            onClose={() => setPracticeMode(null)} 
            onSessionComplete={(summary) => {
              window.toast?.(`Session complete! Score: ${summary.score ?? 'N/A'}%`, 'ok');
              setPracticeMode(null);
            }}
          />
        )}
        {reviewMode && (
          <ReviewSession
            exercises={reviewExercises}
            studentId={student.id}
            onClose={() => { setReviewMode(false); setReviewExercises([]); setReviewCount(getDueCount(student.id)); }}
          />
        )}
      </Suspense>

      <div aria-live="polite" aria-atomic="true" style={{ position: 'fixed', left: '-9999px' }}>
        {loading ? 'Loading dashboard data' : 'Dashboard loaded'}
      </div>

      {loading ? (
        <section className="home-loading fade-up" style={{ '--delay': '0.2s' }} aria-busy="true" aria-label="Loading dashboard">
          <SkeletonCard height={120} lines={3} />
        </section>
      ) : (
        <>
          <div className="home-two-col fade-up" style={{ '--delay': '0.2s' }}>
            <Card bezel className="home-next-steps">
              <div className="student-panel-head">
                <div>
                  <h2>Your next steps</h2>
                </div>
              </div>
              <div className="stack-list">
                {latestReview && <TodoRow done={false} label="Teacher review ready" meta={latestReview.homeworkTitle} />}
                <TodoRow done={!!latestFeedback} label="Review latest feedback" meta={latestFeedback ? 'Available in the Feedback tab' : 'Waiting for teacher approval'} />
                <TodoRow done={pendingHw.length === 0} label={pendingTitle} meta={pendingHw[0]?.dueDate ? `Due ${new Date(pendingHw[0].dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Homework area'} />
              </div>
              <button className="student-wide-action" onClick={() => onTab('homework')}>Go to homework <Icon.arrowR size={14} /></button>
            </Card>

            <div className="practice-pills-grid">
              <p className="practice-pills-caption">Quick practice</p>
              <button className="practice-pill" onClick={() => setPracticeMode('speaking')}>
                <Icon.mic size={15} /> Speaking
              </button>
              <button className="practice-pill" onClick={() => setPracticeMode('grammar')}>
                <Icon.edit size={15} /> Grammar
              </button>
              <button className="practice-pill" onClick={() => setPracticeMode('vocab')}>
                <Icon.star size={15} /> Vocab
              </button>
              <button className="practice-pill" onClick={() => setPracticeMode('writing')}>
                <Icon.edit size={15} /> Writing
              </button>
              <button className="practice-pill" onClick={() => setPracticeMode('listening')}>
                <Icon.headset size={15} /> Listening
              </button>
              {reviewCount > 0 && (
                <button className="practice-pill practice-pill--danger" onClick={handleOpenReview}>
                  <Icon.refresh size={15} /> Review
                </button>
              )}
            </div>
          </div>

          <div className="home-bento fade-up" style={{ '--delay': '0.3s' }}>
            <Card bezel className="home-bento-cell">
              <div className="student-panel-head">
                <h2 className="text-sm" style={{ margin: 0 }}>Learning Insights</h2>
              </div>
              <div className="student-chart-wrap">
                {developmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={developmentData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
                      <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        cursor={{ fill: 'var(--accent-soft)' }}
                        formatter={(value, name) => [value + '%', name]}
                      />
                      <Bar dataKey="development" name="Development" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="confidence" name="Confidence" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="student-chart-empty">
                    Complete homework or get a diagnosis to see your development trend.
                  </div>
                )}
              </div>
            </Card>

            {lowestSkill && Number(lowestSkill.score_0_80) > 0 && (
              <Card bezel className="home-bento-cell student-focus-callout" onClick={() => onTab('progress')}>
                <div className="student-panel-head">
                  <div>
                    <span className="student-panel-kicker">Focus Area</span>
                    <h2>{lowestSkill.section.replace(/_/g, ' ')}</h2>
                  </div>
                </div>
                <p>
                  This skill needs the most attention ({Number(lowestSkill.score_0_80) || 0}/80). Focus on it in your next class or practice session.
                </p>
                {lowestSkill.next_step && (
                  <p><strong>Next step:</strong> {lowestSkill.next_step}</p>
                )}
              </Card>
            )}

            <Card bezel className="home-bento-cell">
              <div className="student-panel-head">
                <div>
                  <h2>{nextClass?.title || 'Your next MET class'}</h2>
                </div>
                <span className="student-pill">{nextDate}</span>
              </div>
              <p className="student-focus-line" style={{ fontSize: 'var(--text-sm)' }}>{nextClass?.classFocus || nextClass?.metSkillFocus || 'Your teacher will confirm the class focus.'}</p>
              <div className="student-detail-list">
                <span><Icon.calendar size={13} /> {nextTime}</span>
                <span><Icon.progress size={13} /> {nextClass?.metSkillFocus || focusSkill}</span>
              </div>
              {upcomingClasses.length > 0 && (
                <div className="student-upcoming-section" style={{ marginTop: 10 }}>
                  {upcomingClasses.map((cls, i) => (
                    <div key={cls.id || i} className="student-upcoming-row">
                      <span className="student-upcoming-date">
                        {cls.startAt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="student-upcoming-focus">{cls.classFocus || cls.metSkillFocus || cls.title || 'Class'}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
