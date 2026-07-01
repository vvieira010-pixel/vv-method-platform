import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Icon, SkeletonCard, EmptyState } from '../components/shared.jsx';
import { getHomework, getDiagnoses, getClassEvents, getReviews, getSubmissions, getStudentSeedsStage, getStudentGoal, saveStudentGoal } from '../lib/workflow.js';
import { getDueCount, getDueItems, toMCQ, getAllEntries } from '../lib/spaced-repetition.js';

import { SEEDS_STAGES, SEEDS_STAGE_ORDER } from '../domain/seeds/constants.js';

const PracticeSession = lazy(() => import('../components/PracticeSession.jsx'));
const ReviewSession   = lazy(() => import('../components/ReviewSession.jsx'));
import { asArray, getSkillTrend, hasVisibleApprovedStudentFeedback, SkillRow } from './student-helpers.jsx';
import { getTeacherSetting } from '../lib/supabase-db.js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function daysUntilExam() {
  try {
    const ds = localStorage.getItem('vv:met_exam_date');
    if (!ds) return null;
    const exam = new Date(ds + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / 86400000);
  } catch { return null; }
}

function MetricCard({ icon, label, value, sub, tone, textValue, compact, onClick }) {
  const cls = `student-metric student-metric--${tone}${textValue ? ' student-metric--text' : ''}${compact ? ' student-metric--compact' : ''}${onClick ? ' student-metric--clickable' : ''}`;
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        <div className="student-metric-copy">
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{sub}</small>
        </div>
        <div className="student-metric-icon">{icon}</div>
      </button>
    );
  }
  return (
    <article className={cls}>
      <div className="student-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
      <div className="student-metric-icon">{icon}</div>
    </article>
  );
}

const MEMO_CLAMP = 4;

function MemoCard({ kicker, title, text }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split(/\n+/).filter(Boolean);
  const needsClamp = lines.length > MEMO_CLAMP || text.length > 320;
  return (
    <article className="student-panel student-panel--primary student-panel-mb">
      <span className="student-panel-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p className={`student-memo-text${expanded ? ' student-memo-text--expanded' : ''}`}>
        {text}
      </p>
      {needsClamp && (
        <button className="student-memo-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
      )}
    </article>
  );
}

function TodoRow({ done, label, meta }) {
  return (
    <div className={'student-todo-row' + (done ? ' done' : '')}>
      <span className="student-todo-check">{done ? <Icon.check size={16} /> : ''}</span>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
    </div>
  );
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
  const [seedsStage, setSeedsStage] = useState(null);
  const [generalMemoText, setGeneralMemoText] = useState(() => localStorage.getItem('vv:student_general_memo') || '');
  const [goal, setGoal] = useState('');
  const [goalDraft, setGoalDraft] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    getStudentSeedsStage(student.id).then(setSeedsStage);
    getStudentGoal(student.id).then(existingGoal => {
      if (existingGoal) { setGoal(existingGoal); setGoalDraft(existingGoal); }
    });
    getTeacherSetting('general_memo').then(val => {
      if (val !== null) {
        setGeneralMemoText(val);
        if (val) localStorage.setItem('vv:student_general_memo', val);
        else localStorage.removeItem('vv:student_general_memo');
      }
    });
    window.addEventListener('vv:seeds-updated', () => getStudentSeedsStage(student.id).then(setSeedsStage));
    function syncMemo() {
      getTeacherSetting('general_memo').then(val => {
        setGeneralMemoText(val ?? localStorage.getItem('vv:student_general_memo') ?? '');
      });
    }
    window.addEventListener('vv:student-memo-changed', syncMemo);
    window.addEventListener('storage', syncMemo);
    return () => {
      window.removeEventListener('vv:student-memo-changed', syncMemo);
      window.removeEventListener('storage', syncMemo);
    };
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

      // Skill snapshot uses all approved diagnoses — feedback visibility is separate
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
  // Include transcript-only evaluated skills (evaluated:true, score may be null)
  // so the Readiness Snapshot stays honest, and fall back to approved history
  // when the latest snapshot has nothing evaluated yet.
  const snapshotEvaluatedSkills = snapshot.filter(s => s.evaluated || Number(s.score_0_80) > 0);
  const evaluatedSkills = snapshotEvaluatedSkills.length > 0
    ? snapshotEvaluatedSkills
    : approvedHistory
        .flatMap(dx => asArray(dx?.content?.section_snapshot))
        .filter(s => s.evaluated || Number(s.score_0_80) > 0)
        .filter((skill, index, list) => index === list.findIndex(item => item.section === skill.section));
  const fallbackFocus = nextClass?.metSkillFocus || nextClass?.classFocus || student.focusSkill || 'MET speaking organization';
  const focusSkill = snapshotEvaluatedSkills[0]?.section || fallbackFocus;
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

      {(() => {
        const daysLeft = daysUntilExam();
        const examDateStr = (() => { try { return localStorage.getItem('vv:met_exam_date') || ''; } catch { return ''; } })();
        return (
          <section className="student-metrics fade-up" aria-label="Status at a glance" style={{ '--delay': '0.1s' }}>
            {reviewCount > 0 && (
              <button className="student-metric student-metric--urgent student-metric-btn" onClick={handleOpenReview} aria-label="Review due items">
                <div className="student-metric-copy">
                  <span>Review Due</span>
                  <strong>{reviewCount} item{reviewCount !== 1 ? 's' : ''}</strong>
                  <small>Spaced repetition ready</small>
                </div>
                <div className="student-metric-icon student-metric-icon-bg">
                  <Icon.refresh size={19} />
                </div>
              </button>
            )}
            <MetricCard icon={<Icon.homework size={19} />} label="Homework" value={pendingHw.length} sub={pendingHw.length === 1 ? 'task pending' : 'tasks pending'} tone="teal" onClick={() => onTab('homework')} />
            <MetricCard compact icon={<Icon.calendar size={19} />} label="Next class" value={nextDate} sub={nextTime} tone="teal" onClick={() => onTab('schedule')} />
            <MetricCard compact icon={<Icon.progress size={19} />} label="Current focus" value={focusSkill} sub={focusTrend.dir !== 'none' ? `Progress: ${focusTrend.label}` : 'next useful practice'} tone="navy" textValue onClick={() => onTab('progress')} />
            <MetricCard compact icon={<Icon.inbox size={19} />} label="Feedback" value={latestFeedback ? 'Ready' : 'Waiting'} sub={latestFeedback ? 'teacher approved' : 'after diagnosis'} tone="teal" onClick={() => latestFeedback && onTab('feedback')} />
            {daysLeft !== null && (
              <MetricCard
                icon={<Icon.calendar size={19} />}
                label="MET exam"
                value={daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? 'Today!' : 'Done'}
                sub={daysLeft > 0
                  ? new Date(examDateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : daysLeft === 0 ? 'Good luck!' : 'Exam has passed'}
                tone={daysLeft <= 30 ? 'urgent' : 'exam'}
              />
            )}
          </section>
        );
      })()}

      <p className="student-practice-caption mb-2">
        Explore the Practice Studio — a bank of exercises to keep you sharp, renewed every week.
      </p>
      <div className="student-practice-row fade-up" style={{ '--delay': '0.2s' }}>
        <button className="student-practice-btn" onClick={() => setPracticeMode('speaking')}><Icon.mic size={15} /> Speaking</button>
        <button className="student-practice-btn" onClick={() => setPracticeMode('grammar')}><Icon.edit size={15} /> Grammar</button>
        <button className="student-practice-btn" onClick={() => setPracticeMode('vocab')}><Icon.star size={15} /> Vocab</button>
        {reviewCount > 0 && (
          <button className="student-practice-btn student-practice-btn--urgent" onClick={handleOpenReview}><Icon.refresh size={15} /> Review</button>
        )}
      </div>
      <Suspense fallback={null}>
        {practiceMode && (
          <PracticeSession mode={practiceMode} onClose={() => setPracticeMode(null)} />
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
        <section className="student-grid fade-up" style={{ '--delay': '0.3s' }} aria-busy="true" aria-label="Loading dashboard">
          <div className="student-home-main">
            <SkeletonCard height={160} lines={4} />
            <div className="student-home-columns">
              <SkeletonCard height={140} lines={3} />
              <SkeletonCard height={140} lines={3} />
            </div>
          </div>
          <aside className="student-home-side">
            <SkeletonCard height={200} lines={6} />
            <SkeletonCard height={100} lines={3} />
            <SkeletonCard height={200} lines={5} />
          </aside>
        </section>
      ) : (
      <section className="student-grid fade-up" style={{ '--delay': '0.3s' }}>
          <div className="student-home-main">

            <section className="student-panel student-panel--primary mb-3">
            <div className="student-panel-head">
              <h2 className="text-lg" style={{ margin: 0 }}>Learning Insights</h2>
            </div>
            <div className="sh-chart-wrap">
              {developmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={developmentData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      cursor={{ fill: 'var(--accent-soft-10)' }}
                      formatter={(value, name) => [value + '%', name]}
                    />
                    <Bar dataKey="development" name="Development" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="confidence" name="Confidence" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="sh-chart-empty">
                  Complete homework or get a diagnosis to see your development trend.
                </div>
              )}
            </div>
            </section>

            <article className="student-panel student-panel--primary">
            <div className="student-panel-head">
              <div>
                <h2>{nextClass?.title || 'Your next MET class'}</h2>
              </div>
              <span className="student-pill">{nextDate}</span>
            </div>
            <div className="student-next-layout">
              <div>
                <p className="student-focus-line">{nextClass?.classFocus || nextClass?.metSkillFocus || 'Your teacher will confirm the class focus.'}</p>
                <div className="student-detail-list">
                  <span><Icon.calendar size={14} /> {nextTime}</span>
                  <span><Icon.progress size={14} /> {nextClass?.metSkillFocus || focusSkill}</span>
                </div>
              </div>
              <div className="student-prep-box">
                <strong>Bring to your next class</strong>
                <p>{nextClass?.metSkillFocus || focusSkill || 'One question about your latest feedback.'}</p>
              </div>
            </div>
            {upcomingClasses.length > 1 && (
              <div className="student-upcoming-section">
                <div className="student-upcoming-header">Upcoming schedule</div>
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
            </article>

            <article className="student-panel student-panel--todo">
              <div className="student-panel-head">
                <div>
                  <h2>Your next steps</h2>
                </div>
              </div>
              <div className="student-todo-list">
                {latestReview && <TodoRow done={false} label="Teacher review ready" meta={latestReview.homeworkTitle} />}
                <TodoRow done={!!latestFeedback} label="Review latest feedback" meta={latestFeedback ? 'Available in the Feedback tab' : 'Waiting for teacher approval'} />
                <TodoRow done={pendingHw.length === 0} label={pendingTitle} meta={pendingHw[0]?.dueDate ? `Due ${new Date(pendingHw[0].dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Homework area'} />
              </div>
              <button className="student-wide-action" onClick={() => onTab('homework')}>Go to homework <Icon.arrowR size={14} /></button>
            </article>
          </div>

          <aside className="student-home-side">

            <article className="student-panel mb-3">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">Weekly Goal</span>
                  <h2>{goal ? 'Your focus this week' : 'Set a weekly goal'}</h2>
                </div>
                {!editingGoal && (
                  <button type="button" className="student-text-action" onClick={() => setEditingGoal(true)}>
                    {goal ? 'Edit' : 'Set goal'} <Icon.edit size={13} />
                  </button>
                )}
              </div>
              {editingGoal ? (
                <div>
                  <textarea
                    className="student-goal-input resize-y"
                    value={goalDraft}
                    onChange={e => setGoalDraft(e.target.value)}
                    placeholder="e.g. I want to improve my speaking fluency and expand my healthcare vocabulary."
                    rows={3}
                    aria-label="Your weekly goal"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="student-wide-action"
                      disabled={savingGoal || !goalDraft.trim()}
                      onClick={async () => {
                        setSavingGoal(true);
                        await saveStudentGoal(student.id, goalDraft.trim());
                        setGoal(goalDraft.trim());
                        setEditingGoal(false);
                        setSavingGoal(false);
                      }}
                    >
                      {savingGoal ? 'Saving…' : 'Save goal'}
                    </button>
                    <button
                      type="button"
                      className="student-text-action self-center"
                      onClick={() => { setGoalDraft(goal); setEditingGoal(false); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : goal ? (
                <p className="text-sm text-text-2" style={{ margin: 0 }}>{goal}</p>
              ) : (
                <p className="text-sm text-muted" style={{ margin: 0 }}>
                  Tell your teacher what you'd like to work on. Your goal will appear in your next diagnosis.
                </p>
              )}
            </article>

          <article className="student-panel sh-panel-flush">
            <div className="student-panel-head">
              <div>
                <h2>Evaluated skills</h2>
              </div>
            </div>
            {evaluatedSkills.length > 0 ? (
              <div className="student-skill-list">
                {evaluatedSkills.slice(0, 5).map(s => <SkillRow key={s.section} skill={s} trend={getSkillTrend(s.section, approvedHistory)} onClick={() => onTab('progress')} />)}
              </div>
            ) : (
              <EmptyState title="No skills evaluated yet" text="Your first skill result will appear after your next class diagnosis." />
            )}
            {latestFeedback && typeof latestFeedback === 'object' && (
              <div className="student-teacher-note">
                <span className="student-teacher-note-kicker student-panel-kicker">Teacher note</span>
                <p className="student-teacher-note-text">{latestFeedback.classFocus || latestFeedback.finalNote || 'Your teacher has approved new feedback for you.'}</p>
                <button className="student-text-action text-xs" onClick={() => onTab('feedback')}>Read full feedback →</button>
              </div>
            )}
          </article>

          {/* Focus area callout */}
          {evaluatedSkills.length > 1 && (() => {
            const lowest = [...evaluatedSkills].sort((a, b) => (Number(a.score_0_80) || 80) - (Number(b.score_0_80) || 80))[0];
            if (!lowest || !Number(lowest.score_0_80)) return null;
            return (
              <button type="button" className="student-focus-callout student-panel student-panel--clickable" onClick={() => onTab('progress')}>
                <div className="student-panel-head">
                  <div>
                    <span className="student-panel-kicker">Focus Area</span>
                    <h2>{lowest.section.replace(/_/g, ' ')}</h2>
                  </div>
                </div>
                <p>
                  This skill needs the most attention ({Number(lowest.score_0_80) || 0}/80). Focus on it in your next class or practice session.
                </p>
                {lowest.next_step && (
                  <p>
                    <strong>Next step:</strong> {lowest.next_step}
                  </p>
                )}
              </button>
            );
          })()}

          {(() => {
            const s = seedsStage && SEEDS_STAGES[seedsStage.stage];
            if (!s) return null;
            return (
              <button type="button" className="student-seeds-panel student-panel student-panel--clickable" style={{ borderColor: s.color }} onClick={() => onTab('progress')}>
                <div className="student-panel-head">
                  <div>
                    <span className="student-panel-kicker">Your SEEDS Cycle</span>
                    <h2 style={{ color: s.color }}>{s.label}: {s.subtitle}</h2>
                  </div>
                </div>
                <p>{s.studentDescription}</p>
                <div className="student-seeds-progress">
                  {SEEDS_STAGE_ORDER.map(stageId => {
                    const st = SEEDS_STAGES[stageId];
                    const isActive = stageId === seedsStage.stage;
                    const isPast = SEEDS_STAGE_ORDER.indexOf(stageId) < SEEDS_STAGE_ORDER.indexOf(seedsStage.stage);
                    return (
                      <span key={stageId} className="student-seeds-dot" style={{
                        background: isActive ? st.color : isPast ? st.color : 'var(--border)',
                        opacity: isActive ? 1 : isPast ? 0.5 : 0.3,
                      }} title={`${st.label}: ${st.subtitle}`} />
                    );
                  })}
                </div>
              </button>
            );
            })()}


          </aside>
      </section>
      )}

    </div>
  );
}
