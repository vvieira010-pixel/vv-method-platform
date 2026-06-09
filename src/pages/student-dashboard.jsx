/**
 * student-dashboard.jsx — Student portal showing only teacher-approved content
 *
 * Rules:
 * - Student feedback visible only if sections.studentFeedback.approved === true and not hidden
 * - Homework visible only after teacher assigns it
 * - Scores/diagnosis only from approved diagnoses
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, Avatar, Button, StudentFeedbackView } from '../components/shared.jsx';
import { getHomework, submitHomework, getDiagnoses, getProgressNotes, getReviews, getClassEvents, getSubmissions, getDraft, saveDraft, getInbox, sendMessage } from '../lib/workflow.js';
import { isStructuredExercise, autoGrade } from '../lib/exercise-types.js';
import { recordPractice } from '../lib/spaced-repetition.js';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import PracticeSession from '../components/PracticeSession.jsx';
import { ExTypeBadge } from '../components/exercise-editor.jsx';
import { MessageTeacherDock, StudentInbox } from '../components/message-center.jsx';
import { printHomework } from '../lib/print-homework.js';
import '../styles/sanctuary.css';

const TABS = [
  { id: 'home',     label: 'Home',     icon: <Icon.home size={16} /> },
  { id: 'homework', label: 'Homework', icon: <Icon.homework size={16} /> },
  { id: 'feedback', label: 'Feedback', icon: <Icon.inbox size={16} /> },
  { id: 'progress', label: 'Progress', icon: <Icon.progress size={16} /> },
  { id: 'messages', label: 'Messages', icon: <Icon.feedback size={16} /> },
];

// Plain-language definitions for MET rubric terms that appear in teacher feedback.
// Keys are lowercase substrings to match against feedback text.
const MET_CONCEPT_GLOSSARY = {
  'task completion':   'Answering the actual task — all required parts, with enough supporting detail.',
  'register':          'The level of formality — formal for authority figures (Q5), neutral for pros/cons (Q4).',
  'cohesion':          'How well your ideas connect using linking words (however, therefore, as a result).',
  'intelligibility':   'How clearly a listener can understand you — independent of grammar or vocabulary.',
  'fluency':           'Smooth delivery without long pauses or frequent restarts.',
  'task relevance':    'Staying on topic throughout — not drifting from what the task asked for.',
  'supporting detail': 'The specific example or reason that backs up your main point.',
  'distractor':        'An answer choice that sounds right because of familiar words but is actually wrong.',
  'inference':         'Reading or listening for meaning that is implied but not directly stated.',
  'speaker purpose':   'Why the speaker said something — their intent, not just the topic.',
  'collocations':      'Words that naturally go together in English (e.g. "make a decision", not "do a decision").',
  'connector':         'A word or phrase that links ideas (e.g. although, therefore, in contrast).',
};

function getRelevantGlossaryTerms(feedbackText) {
  if (!feedbackText) return [];
  const lower = feedbackText.toLowerCase();
  return Object.entries(MET_CONCEPT_GLOSSARY)
    .filter(([term]) => lower.includes(term))
    .map(([term, definition]) => ({ term, definition }));
}

const PROGRESS_STAGES = [
  { label: 'Starting', order: 1, min: 1 },
  { label: 'Building', order: 2, min: 17 },
  { label: 'Developing', order: 3, min: 33 },
  { label: 'Improving', order: 4, min: 49 },
  { label: 'Ready for Mock Practice', order: 5, min: 65 },
];

const STAGE_DESCRIPTIONS = {
  'Starting':   'You are building familiarity with the MET task types. Focus on understanding what each section asks.',
  'Building':   'You can attempt tasks with guidance. Your answers show basic structure and relevant content.',
  'Developing': 'You complete tasks more consistently. Your control over grammar and vocabulary is growing.',
  'Improving':  'You perform well in most conditions. You are close to B2 level in this skill area.',
  'Ready for Mock Practice': 'You handle this skill under timed conditions — you are at B2 level and ready to practise the full MET format.',
};

function getProgressStage(score) {
  const value = Number(score) || 0;
  if (value <= 0) return { label: 'Not evaluated enough', order: 0, min: 0 };
  return [...PROGRESS_STAGES].reverse().find(stage => value >= stage.min) || PROGRESS_STAGES[0];
}

// Progress is the CHANGE in an evaluated skill across classes — a distinct concept
// from the latest stage (which is a single point-in-time evaluation, not a trend).
// Pass the full list of approved diagnoses; this reads each one's snapshot for `section`.
function getSkillTrend(section, diagnoses) {
  const scores = asArray(diagnoses)
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map(d => asArray(d.content?.section_snapshot).find(s => s.section === section))
    .map(s => Number(s?.score_0_80) || 0)
    .filter(v => v > 0);
  if (scores.length === 0) return { dir: 'none', label: 'Not evaluated yet', evaluations: 0 };
  if (scores.length === 1) return { dir: 'new', label: 'Evaluated once', evaluations: 1 };
  const delta = scores[0] - scores[1];
  const nowStage = getProgressStage(scores[0]).order;
  const prevStage = getProgressStage(scores[1]).order;
  if (nowStage > prevStage) return { dir: 'up', label: 'Moved up a stage', evaluations: scores.length };
  if (nowStage < prevStage) return { dir: 'down', label: 'Practice focus', evaluations: scores.length };
  if (delta > 3) return { dir: 'up', label: 'Moving up', evaluations: scores.length };
  if (delta < -3) return { dir: 'down', label: 'Needs attention', evaluations: scores.length };
  return { dir: 'steady', label: 'Holding steady', evaluations: scores.length };
}

function TrendChip({ trend }) {
  if (!trend || trend.dir === 'none') return null;
  const glyph = { up: '↑', down: '↓', steady: '→', new: '•' }[trend.dir] || '•';
  return (
    <span className={`student-trend-chip student-trend-chip--${trend.dir}`}>
      <span aria-hidden="true">{glyph}</span> {trend.label}
    </span>
  );
}

function hasVisibleApprovedStudentFeedback(dx) {
  const feedback = dx?.sections?.studentFeedback;
  return dx?.status === 'approved' && feedback?.approved === true && feedback.hidden !== true;
}

// AI section content is sometimes an object, not an array — coerce before any array op.
const asArray = (v) => (Array.isArray(v) ? v : []);

// Searchable text of one structured exercise, used to attach a teacher correction inline.
function exerciseSearchText(ex) {
  return [ex.question, ex.template, ex.prompt, ex.content, ex.errorText, ex.correctedText,
    ...asArray(ex.options), ...asArray(ex.sentences)]
    .filter(Boolean).join(' ').toLowerCase();
}

// One teacher correction shown inline (original → improved (note)).
function CorrectionNote({ c }) {
  return (
    <div style={{ fontSize: 'var(--text-sm)', padding: 8, marginTop: 8, background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--success)' }}>
      {c.original && <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{c.original}</span>}
      {c.original && c.improved && ' → '}
      {c.improved && <span style={{ color: 'var(--success)', fontWeight: 600 }}>{c.improved}</span>}
      {c.note && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>({c.note})</span>}
    </div>
  );
}

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

      const approvedDx = (diagnoses || [])
        .filter(hasVisibleApprovedStudentFeedback)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (approvedDx.length > 0) {
        const newestAt = new Date(approvedDx[0].createdAt || 0);
        const seenAt = lv.feedback ? new Date(lv.feedback) : new Date(0);
        if (newestAt > seenAt) next.feedback = true;
      }

      const newestReview = (reviews || [])
        .sort((a, b) => new Date(b.reviewedAt || b.createdAt || 0) - new Date(a.reviewedAt || a.createdAt || 0))[0];
      if (newestReview) {
        const reviewedAt = new Date(newestReview.reviewedAt || newestReview.createdAt || 0);
        const seenAt = lv.homework ? new Date(lv.homework) : new Date(0);
        if (reviewedAt > seenAt) next.homework = true;
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
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
      <p>Loading your dashboard…</p>
    </div>;
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
          <button onClick={onSignOut} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dash-body">
        {tab === 'home' && <HomeView student={student} onTab={setTab} />}
        {tab === 'homework' && <HomeworkView student={student} />}
        {tab === 'feedback' && <FeedbackView student={student} onTab={setTab} />}
        {tab === 'progress' && <ProgressView student={student} />}
        {tab === 'messages' && <StudentInbox student={student} />}
      </div>
      <MessageTeacherDock student={student} onSent={() => setTab('messages')} />
    </div>
  );
}

/* ─── HOME ─── */
function daysUntilExam() {
  try {
    const ds = localStorage.getItem('vv:met_exam_date');
    if (!ds) return null;
    const exam = new Date(ds + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / 86400000);
  } catch { return null; }
}

function HomeView({ student, onTab }) {
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [pendingHw, setPendingHw] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [snapshot, setSnapshot] = useState([]);
  const [practiceMode, setPracticeMode] = useState(null);
  const [approvedHistory, setApprovedHistory] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [generalMemoText, setGeneralMemoText] = useState(() => localStorage.getItem('vv:student_general_memo') || '');

  useEffect(() => {
    (async () => {
      const [hw, diagnoses, classEvents, reviews] = await Promise.all([
        getHomework(student.id),
        getDiagnoses(student.id),
        getClassEvents(student.id),
        getReviews(student.id),
      ]);
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
        const dx = approvedDx[0];
        setLatestFeedback(dx.sections.studentFeedback.content);
        setSnapshot(asArray(dx.content?.section_snapshot));
        setApprovedHistory(approvedDx);
      }
    })();
  }, [student.id]);

  function timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  const pendingTitle = pendingHw[0]?.title || 'No homework pending';
  const evaluatedSkills = snapshot.filter(s => Number(s.score_0_80) > 0);
  const fallbackFocus = nextClass?.metSkillFocus || nextClass?.classFocus || student.focusSkill || 'MET speaking organization';
  const focusSkill = evaluatedSkills[0]?.section || fallbackFocus;
  const focusTrend = evaluatedSkills[0] ? getSkillTrend(focusSkill, approvedHistory) : { dir: 'none' };
  const feedbackFocus = latestFeedback && typeof latestFeedback === 'object'
    ? latestFeedback.nextStep || latestFeedback.focusArea?.area || latestFeedback.focusArea?.explanation || latestFeedback.finalNote
    : '';

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
      <section className="student-hero">
        <div>
          <p className="student-hero-kicker">MET preparation dashboard</p>
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
          <section className="student-metrics" aria-label="Student summary">
            <MetricCard icon={<Icon.calendar size={19} />} label="Next class" value={nextDate} sub={nextTime} tone="blue" />
            <MetricCard icon={<Icon.homework size={19} />} label="Homework" value={pendingHw.length} sub={pendingHw.length === 1 ? 'task pending' : 'tasks pending'} tone="teal" />
            <MetricCard icon={<Icon.progress size={19} />} label="Current focus" value={focusSkill} sub={focusTrend.dir !== 'none' ? `Progress: ${focusTrend.label}` : 'next useful practice'} tone="navy" />
            <MetricCard icon={<Icon.inbox size={19} />} label="Feedback" value={latestFeedback ? 'Ready' : 'Waiting'} sub={latestFeedback ? 'teacher approved' : 'after diagnosis'} tone="orange" />
            {daysLeft !== null && (
              <MetricCard
                icon={<Icon.calendar size={19} />}
                label="MET exam"
                value={daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? 'Today!' : 'Done'}
                sub={daysLeft > 0
                  ? new Date(examDateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : daysLeft === 0 ? 'Good luck!' : 'Exam has passed'}
                tone={daysLeft <= 30 ? 'exam-urgent' : 'exam'}
              />
            )}
          </section>
        );
      })()}

      {pendingHw.length === 0 && (
        <div className="student-practice-studio">
          <div>
            <h2>The Practice Studio</h2>
            <p>Your mind is ready. While your teacher prepares your next assignment, sharpen your skills with a self-paced session.</p>
            <div className="studio-orbs">
              <button className="studio-orb" onClick={() => setPracticeMode('grammar')} aria-label="Grammar Sprint">
                <span className="studio-orb-icon" aria-hidden="true">✏️</span>
                <span className="studio-orb-label">Grammar Sprint</span>
              </button>
              <button className="studio-orb" onClick={() => setPracticeMode('vocab')} aria-label="Vocab Deep-Dive">
                <span className="studio-orb-icon" aria-hidden="true">📚</span>
                <span className="studio-orb-label">Vocab Deep-Dive</span>
              </button>
              <button className="studio-orb" onClick={() => setPracticeMode('speaking')} aria-label="Speaking Mirror">
                <span className="studio-orb-icon" aria-hidden="true">🎙</span>
                <span className="studio-orb-label">Speaking Mirror</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {practiceMode && (
        <PracticeSession mode={practiceMode} onClose={() => setPracticeMode(null)} />
      )}

      <section className="student-grid">
        <div className="student-home-main">
          <article className="student-panel student-panel--primary">
            <div className="student-panel-head">
              <div>
                <span className="student-panel-kicker">Upcoming</span>
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
                <strong>What's Next</strong>
                <p>{latestReview ? latestReview.homeworkTitle : pendingHw[0]?.title || 'Prepare your MET speaking samples'}</p>
                <button type="button" onClick={() => onTab('homework')}>Enter Study Area</button>
              </div>
            </div>
            {upcomingClasses.length > 1 && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Upcoming schedule</div>
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

          <div
            className="student-home-columns"
            style={{ display: 'grid', gap: '24px', marginTop: '32px' }}
          >
            <article className="student-panel student-panel--todo">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">Daily Agenda</span>
                  <h2>What to do now</h2>
                </div>
              </div>
              <div className="student-todo-list">
                {latestReview && <TodoRow done={false} label="Teacher review ready" meta={latestReview.homeworkTitle} />}
                <TodoRow done={!!latestFeedback} label="Review latest feedback" meta={latestFeedback ? 'Available in the Feedback tab' : 'Waiting for teacher approval'} />
                <TodoRow done={pendingHw.length === 0} label={pendingTitle} meta={pendingHw[0]?.dueDate ? `Due ${new Date(pendingHw[0].dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Homework area'} />
              </div>
              <button className="student-wide-action" onClick={() => onTab('homework')}>Go to homework <Icon.arrowR size={14} /></button>
            </article>

            <article className="student-panel">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">Teacher Insights</span>
                  <h2>Latest approved note</h2>
                </div>
                <button className="student-text-action" onClick={() => onTab('feedback')}>Open feedback</button>
              </div>
              {latestFeedback && typeof latestFeedback === 'object' ? (
                <div className="student-feedback-summary">
                  <p>{latestFeedback.classFocus || latestFeedback.finalNote || 'Your teacher has approved new feedback for you.'}</p>
                  <button className="student-wide-action" onClick={() => onTab('feedback')}>Read feedback <Icon.arrowR size={14} /></button>
                </div>
              ) : (
                <div className="student-empty-card">
                  Your teacher will add feedback after there is enough class evidence.
                </div>
              )}
            </article>
          </div>
        </div>

        <aside className="student-home-side">
          <article className="student-panel">
            <div className="student-panel-head">
              <div>
                <span className="student-panel-kicker">Readiness Snapshot</span>
                <h2>Evaluated skills</h2>
              </div>
            </div>
            {evaluatedSkills.length > 0 ? (
              <div className="student-skill-list">
                {evaluatedSkills.slice(0, 5).map(s => <SkillRow key={s.section} skill={s} trend={getSkillTrend(s.section, approvedHistory)} />)}
              </div>
            ) : (
              <div className="student-empty-card">
                No evaluated skills yet. Your next class will create the evidence.
              </div>
            )}
          </article>

          <section
            className="student-memo-board"
            style={{ marginTop: '24px' }}
          >
            <MemoCard kicker="General memo" title="Memo Board" text={generalMemoText || 'No general memo posted yet.'} />
            <MemoCard kicker="Personal note" title={`${student.firstName}'s note`} text={student.notes || student.goalNote || 'Your goal is MET preparation.'} />
          </section>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, tone }) {
  return (
    <article className={`student-metric student-metric--${tone}`}>
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
    <article className="student-panel" style={{ marginBottom: '16px' }}>
      <span className="student-panel-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p style={{
        margin: '8px 0 0',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.6,
        color: 'var(--sanctuary-text)',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: expanded ? 'unset' : MEMO_CLAMP,
        WebkitBoxOrient: 'vertical',
      }}>
        {text}
      </p>
      {needsClamp && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: 'none', padding: '6px 0 0',
            cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 700,
            color: 'var(--sanctuary-teal-deep)', letterSpacing: '0.03em',
          }}>
          {expanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
      )}
    </article>
  );
}

function TodoRow({ done, label, meta }) {
  return (
    <div className={'student-todo-row' + (done ? ' done' : '')}>
      <span className="student-todo-check">{done ? '✓' : ''}</span>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
    </div>
  );
}

function SkillRow({ skill, trend }) {
  const score = Number(skill.score_0_80) || 0;
  if (score <= 0) return null;
  const stage = getProgressStage(score);
  return (
    <div className="student-skill-row">
      <div className="student-skill-top">
        <strong>{skill.section}</strong>
        <span className="student-skill-stage">Last assessed: {stage.label}</span>
      </div>
    </div>
  );
}

function FeedbackView({ student, onTab }) {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [selfAssessment, setSelfAssessment] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [feedbackReplies, setFeedbackReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [showReply, setShowReply] = useState({});
  const [understood, setUnderstood] = useState({});

  useEffect(() => {
    (async () => {
      const [diagnoses, submissions, reviews, inbox] = await Promise.all([
        getDiagnoses(student.id),
        getSubmissions(student.id),
        getReviews(student.id),
        getInbox({ role: 'student', studentId: student.id }),
      ]);
      const approved = (diagnoses || [])
        .filter(hasVisibleApprovedStudentFeedback)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map(dx => ({
          id: dx.id,
          createdAt: dx.createdAt,
          feedback: dx.sections.studentFeedback.content,
          snapshot: asArray(dx.content?.section_snapshot),
        }));
      setFeedbackItems(approved);
      if (approved[0]?.id) {
        const stored = localStorage.getItem(`vv:feedback_selfassess:${approved[0].id}`);
        if (stored) setSelfAssessment(stored);
      }
      // Find latest reviewed submission with confidence data
      const reviewedSub = (submissions || [])
        .filter(s => s.confidence != null)
        .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0];
      if (reviewedSub) {
        const review = (reviews || []).find(r => r.homeworkId === reviewedSub.homeworkId);
        setConfidenceScore({
          confidence: reviewedSub.confidence,
          score: review?.score ?? null,
        });
      }
      // Load feedback replies from inbox
      const replies = {};
      const und = {};
      (inbox || []).forEach(msg => {
        if (msg.diagnosisId) {
          if (msg.type === 'feedback-reply' && msg.fromStudentId === student.id) {
            replies[msg.diagnosisId] = replies[msg.diagnosisId] || [];
            replies[msg.diagnosisId].push(msg);
          }
          if (msg.type === 'feedback-understood' && msg.fromStudentId === student.id) {
            und[msg.diagnosisId] = true;
          }
        }
      });
      setFeedbackReplies(replies);
      setUnderstood(und);
    })();
  }, [student.id]);

  async function handleFeedbackReply(diagnosisId) {
    const body = (replyText[diagnosisId] || '').trim();
    if (!body) return;
    await sendMessage({
      fromStudentId: student.id,
      fromName: student.firstName || student.name || 'Student',
      fromRole: 'student',
      toRole: 'teacher',
      diagnosisId,
      type: 'feedback-reply',
      body,
    });
    setReplyText(prev => ({ ...prev, [diagnosisId]: '' }));
    setFeedbackReplies(prev => ({
      ...prev,
      [diagnosisId]: [...(prev[diagnosisId] || []), { id: Date.now(), body, diagnosisId, type: 'feedback-reply', createdAt: new Date().toISOString() }],
    }));
    window.toast?.('Question sent to your teacher.', 'ok');
  }

  async function handleMarkUnderstood(diagnosisId) {
    await sendMessage({
      fromStudentId: student.id,
      fromName: student.firstName || student.name || 'Student',
      fromRole: 'student',
      toRole: 'teacher',
      diagnosisId,
      type: 'feedback-understood',
      body: 'Student marked this feedback as understood.',
    });
    setUnderstood(prev => ({ ...prev, [diagnosisId]: true }));
    window.toast?.('Marked as understood.', 'ok');
  }

  function handleSelfAssessment(value, diagnosisId) {
    setSelfAssessment(value);
    if (diagnosisId) localStorage.setItem(`vv:feedback_selfassess:${diagnosisId}`, value);
  }

  const latest = feedbackItems[0];
  const feedback = latest?.feedback;
  const primarySkill = latest?.snapshot?.find(s => Number(s.score_0_80) > 0) || null;
  const stage = primarySkill ? getProgressStage(Number(primarySkill.score_0_80) || 0) : null;
  const highlights = Array.isArray(feedback?.highlights)
    ? feedback.highlights
    : (Array.isArray(feedback?.whatYouDidWell) ? feedback.whatYouDidWell : []);
  const rawFocusArea = feedback?.focusArea || (Array.isArray(feedback?.whatToImprove) ? feedback.whatToImprove[0] : null);
  const focusArea = typeof rawFocusArea === 'string'
    ? { area: rawFocusArea, explanation: rawFocusArea }
    : rawFocusArea;
  const firstWin = highlights[0];
  const nextStep = feedback?.nextStep || focusArea?.howToImprove || primarySkill?.next_step || 'Practice one clear next step before your next class.';

  return (
    <div className="student-feedback-page">
      <section className="student-hero">
        <div>
          <p className="student-hero-kicker">Feedback</p>
          <h1>Your teacher's latest notes</h1>
          <p>Simple, approved feedback you can use before the next class.</p>
        </div>
        <button className="student-hero-action" onClick={() => onTab('homework')}>
          <Icon.homework size={15} />
          Practice next
        </button>
      </section>

      {!feedback ? (
        <div className="student-empty-card">
          No approved feedback yet. After your teacher reviews your diagnosis, your feedback will appear here.
        </div>
      ) : (
        <>
          <section className="student-progress-profile">
            <div>
              <span className="student-panel-kicker">Today's progress</span>
              <h2>{primarySkill ? `${primarySkill.section} progress` : 'MET progress'}</h2>
              <p>{feedback.classFocus || 'Your teacher has shared a short summary of your latest class.'}</p>
            </div>
            {stage && <span className="student-stage-badge">{stage.label}</span>}
          </section>

          <section className="student-feedback-grid">
            <article className="student-panel">
              <span className="student-panel-kicker">What improved</span>
              <h2>{firstWin?.strength || 'You made progress'}</h2>
              <p className="student-readable-copy">{firstWin?.explanation || feedback.finalNote || 'Your teacher noticed improvement in your latest class.'}</p>
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Current focus</span>
              <h2>{focusArea?.area || primarySkill?.section || 'Next MET skill'}</h2>
              <p className="student-readable-copy">{focusArea?.explanation || focusArea?.howToImprove || focusArea?.metImportance || nextStep}</p>
            </article>

            {confidenceScore && (
              <article className="student-panel">
                <span className="student-panel-kicker">Your confidence vs result</span>
                <h2>How your confidence matched your score</h2>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  {[
                    { label: 'Your confidence', value: confidenceScore.confidence != null ? `${confidenceScore.confidence + 1}/4` : '—', color: 'var(--accent)' },
                    { label: 'Teacher score', value: confidenceScore.score != null ? `${confidenceScore.score}/100` : 'Pending', color: confidenceScore.score != null ? 'var(--success)' : 'var(--text-2)' },
                  ].map(m => (
                    <div key={m.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                {confidenceScore.confidence != null && confidenceScore.score != null && (
                  <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {(() => {
                      const diff = confidenceScore.score / 25 - (confidenceScore.confidence + 1);
                      if (Math.abs(diff) <= 0.5) return 'Your confidence matched your result — great self-assessment!';
                      if (diff > 0.5) return 'You did better than expected — keep believing in yourself!';
                      return 'You were more confident than your score — review the feedback and try again.';
                    })()}
                  </div>
                )}
              </article>
            )}

            {(() => {
              const allFeedbackText = [
                focusArea?.area, focusArea?.explanation, focusArea?.howToImprove,
                ...(highlights || []).map(h => `${h.strength} ${h.explanation}`),
                nextStep,
              ].filter(Boolean).join(' ');
              const terms = getRelevantGlossaryTerms(allFeedbackText);
              if (terms.length === 0) return null;
              return (
                <article className="student-panel">
                  <span className="student-panel-kicker">Concepts in your feedback</span>
                  <h2>What these terms mean</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {terms.map(({ term, definition }) => (
                      <div key={term} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)', flexShrink: 0, textTransform: 'capitalize' }}>{term}:</span>
                        <span style={{ color: 'var(--text-2)' }}>{definition}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })()}

            <article className="student-panel student-panel--primary">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">Full feedback</span>
                  <h2>Teacher-approved feedback</h2>
                </div>
                {latest.createdAt && (
                  <span className="student-muted-pill">
                    {new Date(latest.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              <StudentFeedbackView feedback={feedback} />
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Confidence check</span>
              <h2>Before the next class</h2>
              <div className="student-confidence-list">
                <TodoRow done={false} label="I understand my teacher's main feedback" meta="Review the full note above" />
                <TodoRow done={!!firstWin} label="I can name one thing I did better" meta={firstWin?.strength || 'Use your feedback note'} />
                <TodoRow done={false} label="I can practice the next focus" meta={feedback?.nextStep || focusArea?.area || 'Complete the homework task'} />
                <TodoRow done={false} label="I can bring one question to class" meta="Ask your teacher for help where needed" />
              </div>
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Your view</span>
              <h2>Does this feedback match your experience?</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.6 }}>
                Your answer helps your teacher prepare the next class. There is no wrong response.
              </p>
              {selfAssessment ? (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✓</span>
                  <span>You said: <strong>{selfAssessment}</strong> — your teacher will see this.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Yes, it matches', 'Partly', 'Not sure'].map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelfAssessment(option, latest?.id)}
                      style={{
                        padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
                        fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', fontWeight: 500,
                        transition: 'border-color .15s, background .15s',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </article>

            {/* ── FEEDBACK REPLY: ask a question or mark understood ── */}
            <article className="student-panel">
              <span className="student-panel-kicker">Discuss this feedback</span>
              <h2>Ask your teacher or confirm you understand</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {understood[latest?.id] ? (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✓</span> Marked as understood
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkUnderstood(latest?.id)} disabled={!latest?.id}>
                    <Icon.check size={12} /> Mark as understood
                  </Button>
                )}
                <div>
                  {(feedbackReplies[latest?.id] || []).length > 0 && (
                    <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(feedbackReplies[latest?.id] || []).map(msg => (
                        <div key={msg.id} style={{
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)',
                          fontSize: 'var(--text-sm)', lineHeight: 1.5,
                        }}>
                          <div style={{ color: 'var(--text-2)', marginBottom: 2 }}>{msg.body}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                            {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showReply[latest?.id] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        className="input"
                        rows={3}
                        value={replyText[latest?.id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [latest?.id]: e.target.value }))}
                        placeholder="Type your question about this feedback…"
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="primary" size="sm" onClick={() => handleFeedbackReply(latest?.id)} disabled={!replyText[latest?.id]?.trim()}>
                          Send question
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowReply(prev => ({ ...prev, [latest?.id]: false })); setReplyText(prev => ({ ...prev, [latest?.id]: '' })); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setShowReply(prev => ({ ...prev, [latest?.id]: true }))}>
                      <Icon.feedback size={12} /> Ask a question
                    </Button>
                  )}
                </div>
              </div>
            </article>
          </section>

          {feedbackItems.length > 1 && (
            <section className="student-panel student-feedback-history">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">History</span>
                  <h2>Past feedback</h2>
                </div>
                <span className="student-muted-pill">{feedbackItems.length - 1} older</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbackItems.slice(1).map(item => (
                  <details key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', padding: '10px 12px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Previous feedback'}
                    </summary>
                    <div style={{ marginTop: 12 }}>
                      <StudentFeedbackView feedback={item.feedback} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ─── HOMEWORK ─── */
function HomeworkView({ student }) {
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [answers, setAnswers] = useState({});
  const [responses, setResponses] = useState({}); // { exerciseId: responseObj }
  const [draftMeta, setDraftMeta] = useState({}); // { homeworkId: { updatedAt, currentExerciseId } }
  const [homeworkFilter, setHomeworkFilter] = useState('todo');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [hw, revs] = await Promise.all([getHomework(student.id), getReviews(student.id)]);
      setHomework(hw || []);
      setReviews(revs || []);
    })();
  }, [student.id]);

  // Check if homework has structured exercises
  function hasStructuredExercises(h) {
    return (h.activities || []).some(a => isStructuredExercise(a));
  }

  function homeworkDraftKey(hwId) {
    return `student-homework:${student.id}:${hwId}`;
  }

  async function toggleHomework(h) {
    const willOpen = expanded !== h.id;
    setExpanded(willOpen ? h.id : null);
    if (!willOpen || h.status === 'submitted') return;

    const draft = await getDraft(homeworkDraftKey(h.id));
    if (draft?.responses && typeof draft.responses === 'object') {
      setResponses(prev => ({ ...prev, ...draft.responses }));
      setDraftMeta(prev => ({
        ...prev,
        [h.id]: {
          updatedAt: draft.updatedAt,
          currentExerciseId: draft.currentExerciseId,
        },
      }));
    }
  }

  // Handle legacy text submission
  async function handleLegacySubmit(hwId) {
    if (!answers[hwId]?.trim()) { window.toast?.('Please write your answer.', 'warn'); return; }
    setSubmitting(true);
    await submitHomework(hwId, student.id, answers[hwId]);
    const hw = await getHomework(student.id);
    setHomework(hw || []);
    setAnswers(prev => { const n = { ...prev }; delete n[hwId]; return n; });
    setExpanded(null);
    setSubmitting(false);
    window.toast?.('Submitted! Your teacher will review soon.', 'ok');
  }

  // Handle structured exercise submission
  async function handleStructuredSubmit(hwId, confidence) {
    setSubmitting(true);
    // Build a summary text from structured responses for backward compatibility
    const hw = homework.find(h => h.id === hwId);
    const exercises = (hw?.activities || []).filter(a => isStructuredExercise(a));
    const summaryParts = exercises.map(ex => {
      const res = responses[ex.id];
      if (!res) return `[${ex.type}] — no response`;
      switch (ex.type) {
        case 'mcq':   return `[MCQ] ${ex.question}\nAnswer: ${ex.options?.[res.selected] || 'none'}`;
        case 'blank': return `[BLANK] ${ex.template}\nAnswers: ${(res.blanks || []).join(', ')}`;
        case 'short': return `[SHORT] ${ex.prompt}\n${res.text || ''}`;
        case 'speak': return `[SPEAK] ${ex.prompt}\nTranscript: ${res.transcript || '(audio submitted)'}`;
        case 'order': return `[ORDER] Order: ${(res.order || []).map(i => i + 1).join(' → ')}`;
        case 'fix':   return `[FIX] ${res.text || ''}`;
        case 'flash': return `[FLASH] ${res.learned || 0} cards learned`;
        default:      return `[${ex.type}] response submitted`;
      }
    });
    const content = summaryParts.join('\n\n---\n\n');
    const exerciseResponses = Object.fromEntries(exercises.map(ex => [ex.id, responses[ex.id] || {}]));
    await submitHomework(hwId, student.id, content, exerciseResponses, confidence);
    // Record spaced repetition practice for review items
    const reviewItems = exercises.filter(ex => ex.isReviewItem && ex.reviewItemId);
    reviewItems.forEach(ex => {
      const grade = autoGrade(ex, exerciseResponses[ex.id]);
      if (grade) {
        recordPractice(student.id, ex.reviewItemId, grade.correct);
      }
    });
    await saveDraft(homeworkDraftKey(hwId), null);
    const hwList = await getHomework(student.id);
    setHomework(hwList || []);
    setResponses({});
    setDraftMeta(prev => ({ ...prev, [hwId]: null }));
    setExpanded(null);
    setSubmitting(false);
    window.toast?.('Submitted! Your teacher will review soon.', 'ok');
  }

  // Update a single exercise response
  function updateResponse(exerciseId, updatedRes) {
    setResponses(prev => ({ ...prev, [exerciseId]: updatedRes }));
  }

  async function saveStructuredProgress(hwId, currentExerciseId) {
    const hw = homework.find(h => h.id === hwId);
    const exerciseIds = new Set((hw?.activities || []).filter(a => isStructuredExercise(a)).map(ex => ex.id));
    const exerciseResponses = Object.fromEntries(
      Object.entries(responses).filter(([exerciseId]) => exerciseIds.has(exerciseId))
    );
    const draft = {
      responses: exerciseResponses,
      currentExerciseId,
      updatedAt: new Date().toISOString(),
    };
    await saveDraft(homeworkDraftKey(hwId), draft);
    setDraftMeta(prev => ({ ...prev, [hwId]: draft }));
    window.toast?.('Progress saved. You can continue later.', 'ok');
  }

  const reviewedIds = new Set(reviews.map(r => r.homeworkId));
  const sortedHomework = [...homework].sort((a, b) => new Date(b.reviewedAt || b.assignedAt || b.createdAt || 0) - new Date(a.reviewedAt || a.assignedAt || a.createdAt || 0));
  const visibleHomework = sortedHomework.filter(h => {
    const reviewed = reviewedIds.has(h.id) || h.status === 'reviewed' || h.status === 'corrected' || h.status === 'completed';
    if (homeworkFilter === 'todo') return !reviewed && h.status !== 'submitted';
    if (homeworkFilter === 'submitted') return h.status === 'submitted' && !reviewed;
    if (homeworkFilter === 'reviewed') return reviewed;
    return true;
  });
  const reviewedCount = sortedHomework.filter(h => reviewedIds.has(h.id) || h.status === 'reviewed' || h.status === 'corrected' || h.status === 'completed').length;

  return (
    <div className="student-homework-page">
      <section className="student-hero">
        <div>
          <p className="student-hero-kicker">Homework</p>
          <h1>Assigned practice</h1>
          <p>Complete the tasks your teacher assigned, then submit them for review.</p>
        </div>
        <span className="student-stage-badge">{homework.length} assigned</span>
      </section>

      {homework.length === 0 && (
        <div className="student-empty-card">
          No homework assigned yet. Your teacher will assign practice after your next class.
        </div>
      )}

      {homework.length > 0 && (
        <div className="student-homework-filters" aria-label="Homework filters">
          {[
            ['todo', 'To do'],
            ['submitted', 'Submitted'],
            ['reviewed', `Reviewed (${reviewedCount})`],
            ['all', 'All'],
          ].map(([id, label]) => (
            <button key={id} type="button" className={`hw-filter-btn${homeworkFilter === id ? ' active' : ''}`} onClick={() => setHomeworkFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      <section className="student-homework-list">
      {homework.length > 0 && visibleHomework.length === 0 && (
        <div className="student-empty-card">
          No homework in this view.
        </div>
      )}
      {visibleHomework.map(h => {
        const review = reviews.find(r => r.homeworkId === h.id);
        const isExpanded = expanded === h.id;
        const submitted = h.status === 'submitted';
        const statusTone = review ? 'success' : submitted ? 'warning' : 'muted';
        const statusLabel = review ? 'Reviewed' : submitted ? 'Submitted' : (h.status || 'Not started');
        const isStructured = hasStructuredExercises(h);
        const structuredExercises = isStructured ? (h.activities || []).filter(a => isStructuredExercise(a)) : [];

        // Exercise type badges for structured homework
        const typeSummary = {};
        structuredExercises.forEach(e => { typeSummary[e.type] = (typeSummary[e.type] || 0) + 1; });

        return (
          <article key={h.id} className={'student-homework-card' + (isExpanded ? ' is-expanded' : '')}>
            {/* Header */}
            <button
              className="student-homework-card-head"
              onClick={() => toggleHomework(h)}
            >
              <div className="student-homework-title">
                <span className="student-panel-kicker">Assigned homework</span>
                <h2>{h.title || 'Homework task'}</h2>
                <div className="student-homework-meta">
                  {isStructured ? (
                    <>
                      <span>{structuredExercises.length} exercise{structuredExercises.length !== 1 ? 's' : ''}</span>
                      {Object.keys(typeSummary).map(type => (
                        <ExTypeBadge key={type} typeId={type} />
                      ))}
                    </>
                  ) : (
                    <span>{h.type}</span>
                  )}
                  {h.dueDate && <span>Due {new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                  {draftMeta[h.id]?.updatedAt && !submitted && !review && (
                    <span>Saved {new Date(draftMeta[h.id].updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>
              <span className={`student-homework-status student-homework-status--${statusTone}`}>{statusLabel}</span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="student-homework-content">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <Button variant="ghost" size="sm" onClick={() => printHomework(h, { studentName: student?.name })}>
                    <Icon.print size={13} /> Print
                  </Button>
                </div>

                {/* Teacher review summary — header at top; per-exercise corrections shown inline below */}
                {review && (
                  <div style={{ marginBottom: 12, padding: 12, background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-soft)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>Teacher Review</span>
                      {review.redoRequired && (
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '2px 8px', borderRadius: 0, background: 'var(--warning-bg)', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redo requested</span>
                      )}
                    </div>
                    {review.whatImproved && (
                      <div style={{ marginBottom: 8, fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--success)' }}>What improved: </strong>{review.whatImproved}
                      </div>
                    )}
                    {review.overallNote && <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, margin: 0 }}>{review.overallNote}</p>}
                  </div>
                )}

                {(h.objective || h.description || h.estimatedTime || h.metSkillConnection) && (
                  <div className="student-homework-brief">
                    {h.objective && (
                      <div>
                        <strong>Goal</strong>
                        <p>{h.objective}</p>
                      </div>
                    )}
                    {h.estimatedTime && (
                      <div>
                        <strong>Time</strong>
                        <p>{h.estimatedTime}</p>
                      </div>
                    )}
                    {h.metSkillConnection && (
                      <div>
                        <strong>MET skill</strong>
                        <p>{h.metSkillConnection}</p>
                      </div>
                    )}
                    {h.description && (
                      <div className="student-homework-brief-wide">
                        <strong>Instructions</strong>
                        <p>{h.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STRUCTURED EXERCISES: step-through ── */}
                {isStructured && !submitted && !review && (
                  <HomeworkStepThrough
                    exercises={structuredExercises}
                    responses={responses}
                    onResponse={updateResponse}
                    onSave={(exerciseId) => saveStructuredProgress(h.id, exerciseId)}
                    onSubmit={(confidence) => handleStructuredSubmit(h.id, confidence)}
                    initialExerciseId={draftMeta[h.id]?.currentExerciseId}
                    readOnly={false}
                  />
                )}

                {/* ── STRUCTURED EXERCISES: submitted — each exercise + its teacher correction inline ── */}
                {isStructured && (submitted || review) && (() => {
                  const corrections = asArray(review?.corrections);
                  const matchedByEx = structuredExercises.map(ex => {
                    const t = exerciseSearchText(ex);
                    return corrections.filter(c => c.original && t.includes(String(c.original).toLowerCase()));
                  });
                  const matched = new Set(matchedByEx.flat());
                  const unmatched = corrections.filter(c => !matched.has(c));
                  return (
                    <div>
                      {structuredExercises.map((ex, i) => (
                        <div key={ex.id} style={{ borderTop: i > 0 ? '1px solid var(--divider)' : 'none', paddingTop: i > 0 ? 14 : 0, marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>{i + 1}.</span>
                            <ExTypeBadge typeId={ex.type} />
                          </div>
                          <ExercisePlayer exercise={ex} response={{}} onResponse={() => {}} readOnly={true} />
                          {matchedByEx[i].map((c, ci) => <CorrectionNote key={ci} c={c} />)}
                        </div>
                      ))}
                      {unmatched.length > 0 && (
                        <div style={{ marginTop: 4, marginBottom: 6 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>More corrections</div>
                          {unmatched.map((c, ci) => <CorrectionNote key={ci} c={c} />)}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── LEGACY: plain text activities ── */}
                {!isStructured && (
                  <>
                    {(h.activities || []).map((a, i) => (
                      <div key={i} className="student-homework-activity">{a.instruction}</div>
                    ))}
                  </>
                )}

                {/* Self-check */}
                {h.selfCheck?.filter(Boolean).length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 8 }}>Self-check:</div>
                    {h.selfCheck.filter(Boolean).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" style={{ marginTop: 3, flexShrink: 0 }} aria-label={c} />
                          <span style={{ fontSize: 'var(--text-sm)' }}>{c}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Legacy submit form */}
                {!isStructured && !submitted && !review && (
                  <div className="student-homework-submit">
                    <textarea value={answers[h.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [h.id]: e.target.value }))} rows={5} placeholder="Write your answer here…" />
                    <Button variant="primary" size="sm" onClick={() => handleLegacySubmit(h.id)} disabled={submitting || !answers[h.id]?.trim()} style={{ marginTop: 8 }}>
                      {submitting ? 'Submitting…' : 'Submit Homework'}
                    </Button>
                  </div>
                )}

                {/* Submitted status */}
                {submitted && !review && (
                  <div className="student-homework-waiting">
                    Submitted ✓ — Waiting for your teacher to review.
                  </div>
                )}

                {/* Teacher review — remaining items (score/notes at top, corrections inline above) */}
                {review && ((Array.isArray(review.activeErrors) && review.activeErrors.length > 0) || (Array.isArray(review.newErrors) && review.newErrors.length > 0)) && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    {Array.isArray(review.activeErrors) && review.activeErrors.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Still working on</div>
                        {review.activeErrors.map((e, i) => (
                          <div key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginLeft: 8 }}>• {e}</div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(review.newErrors) && review.newErrors.length > 0 && (
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>New to work on</div>
                        {review.newErrors.map((e, i) => (
                          <div key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginLeft: 8 }}>• {e}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
      </section>
    </div>
  );
}

/* ─── SUBSKILL RADAR ────────────────────────────────────────── */
function SubskillRadar({ sectionData, targetScore = 65 }) {
  const [RechartsComponents, setRechartsComponents] = useState(null);
  useEffect(() => {
    import('recharts').then(mod => setRechartsComponents(mod));
  }, []);
  if (!RechartsComponents) return null;
  const { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } = RechartsComponents;

  return (
    <div style={{ width: '100%', height: 380, marginBottom: 24 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={sectionData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--divider)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-ui)' }} />
          <PolarRadiusAxis domain={[0, 80]} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickCount={5} />
          {sectionData.some(d => d.previous != null) && (
            <Radar name="Previous" dataKey="previous" stroke="var(--muted)" strokeWidth={1} strokeDasharray="5 5" fill="var(--muted)" fillOpacity={0.15} isAnimationActive={true} animationDuration={900} />
          )}
          <Radar name="Current" dataKey="current" stroke="var(--accent)" strokeWidth={2} fill="var(--accent)" fillOpacity={0.25} isAnimationActive={true} animationDuration={1200} />
          <Radar name="Target" dataKey="target" stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" isAnimationActive={true} animationDuration={1000} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-2)' }} />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 0, fontSize: 12, fontFamily: 'var(--font-ui)' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function sectionToLabel(section) {
  if (!section) return '';
  return section
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Speaking/g, 'Sp.')
    .replace(/Writing/g, 'Wr.')
    .replace(/Grammar/g, 'Gr.')
    .replace(/Vocabulary/g, 'Voc.')
    .replace(/Listening/g, 'Lis.')
    .replace(/Reading/g, 'Read.')
    .slice(0, 18);
}

/* ─── PROGRESS ─── */
function ProgressView({ student }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [legendOpen, setLegendOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [dx, pn] = await Promise.all([getDiagnoses(student.id), getProgressNotes(student.id)]);
      setDiagnoses((dx || []).filter(d => d.status === 'approved'));
      setNotes(pn || []);
    })();
  }, [student.id]);

  const latest = diagnoses[0];
  const skills = asArray(latest?.content?.section_snapshot).filter(skill => Number(skill.score_0_80) > 0);

  return (
    <div className="student-progress-page">
      <section className="student-hero">
        <div>
          <p className="student-hero-kicker">MET progress profile</p>
          <h1>Your MET progress path</h1>
          <p>Progress stages show direction without turning your learning into a grade.</p>
        </div>
      </section>

      <div className="student-stage-legend">
        <button className="student-stage-legend-toggle" onClick={() => setLegendOpen(v => !v)} aria-expanded={legendOpen}>
          <span>What do the stages mean?</span>
          <span aria-hidden="true" style={{ fontSize: 10 }}>{legendOpen ? '▲' : '▼'}</span>
        </button>
        {legendOpen && (
          <div className="student-stage-legend-body">
            {PROGRESS_STAGES.map(s => (
              <div key={s.label} className="student-stage-legend-row">
                <span className="student-stage-legend-name">{s.label}</span>
                <span className="student-stage-legend-desc">{STAGE_DESCRIPTIONS[s.label]}</span>
              </div>
            ))}
            <div className="student-stage-legend-row student-stage-legend-row--goal">
              <span className="student-stage-legend-name">Your goal</span>
              <span className="student-stage-legend-desc">Stage 5 = Ready for Mock Practice = B2 performance on the MET. The actual exam requires 65/80 or higher across all sections.</span>
            </div>
          </div>
        )}
      </div>

      {diagnoses.length === 0 ? (
        <section className="student-panel student-panel--readiness">
          <div className="student-panel-head">
            <div>
              <span className="student-panel-kicker">Starting point</span>
              <h2>Your first progress steps</h2>
            </div>
          </div>
          <div className="student-progress-starter">
            <p>No approved diagnosis is ready yet. You can still start building useful evidence for your teacher.</p>
            <TodoRow done={false} label="Complete the next assigned homework" meta="Homework gives your teacher review evidence" />
            <TodoRow done={false} label="Prepare one speaking sample" meta="45 seconds with one clear example" />
            <TodoRow done={false} label="Ask one MET question in class" meta="Use the Messages tab if you need help before class" />
          </div>
        </section>
      ) : (
        <>
          {/* Radar chart */}
          {skills.length > 1 && (() => {
            const previousDx = diagnoses[1];
            const prevSnapshot = asArray(previousDx?.content?.section_snapshot);
            const radarData = skills.map(skill => {
              const prevSkill = prevSnapshot.find(s => s.section === skill.section);
              return {
                skill: sectionToLabel(skill.section),
                current: Number(skill.score_0_80) || 0,
                previous: prevSkill ? (Number(prevSkill.score_0_80) || 0) : null,
                target: 65,
              };
            });
            return <SubskillRadar sectionData={radarData} targetScore={65} />;
          })()}

          {skills.length > 0 ? (
            <section className="student-readiness-grid">
              {skills.map(skill => (
                <ProgressProfileCard key={skill.section} skill={skill} trend={getSkillTrend(skill.section, diagnoses)} />
              ))}
            </section>
          ) : (
            <div className="student-empty-card" style={{ marginBottom: 18 }}>
              No evaluated skills are ready to show yet. When a class evaluates speaking only, only speaking progress will appear here.
            </div>
          )}

          <section className="student-panel">
            <div className="student-panel-head">
              <div>
                <span className="student-panel-kicker">Progress history</span>
                <h2>Recent approved diagnoses</h2>
              </div>
            </div>
            <div className="student-history-list">
              {diagnoses.map((dx, i) => (
                <div key={dx.id} className="student-history-item">
                  <div>
                    <strong>Class #{diagnoses.length - i}</strong>
                    {dx.sections?.profileUpdateSuggestions?.content?.progressNote && (
                      <p>{dx.sections.profileUpdateSuggestions.content.progressNote}</p>
                    )}
                  </div>
                  <span>{new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {notes.length > 0 && (
        <section className="student-panel">
          <div className="student-panel-head">
            <div>
              <span className="student-panel-kicker">Teacher notes</span>
              <h2>Extra notes</h2>
            </div>
          </div>
          <div className="student-history-list">
            {notes.map(n => (
              <div key={n.id} className="student-history-item">
                <div>
                  <strong>{new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</strong>
                  <p>{n.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProgressProfileCard({ skill, trend }) {
  const score = Number(skill.score_0_80) || 0;
  if (score <= 0) return null;
  const stage = getProgressStage(score);
  const trendNote = trend?.dir === 'new'
    ? 'Evaluated once — your progress trend appears after the next class.'
    : trend?.dir === 'up'
      ? 'You are moving in the right direction since your last class.'
      : trend?.dir === 'down'
        ? 'Practice focus for next class.'
        : 'Holding steady — keep practising to reach the next stage.';

  return (
    <article className="student-progress-card">
      <div className="student-panel-head">
        <div>
          <span className="student-panel-kicker">Skill progress</span>
          <h2>{skill.section}</h2>
        </div>
        <span className="student-stage-badge">{stage.label}</span>
      </div>

      <div className="student-stage-track student-stage-track--wide" aria-label={`${skill.section} stage: ${stage.label}`}>
        {PROGRESS_STAGES.map(item => (
          <span key={item.label} className={item.order <= stage.order ? 'active' : ''} title={item.label} />
        ))}
      </div>

      <div className="student-progress-trend">
        <TrendChip trend={trend} />
        <span className="student-progress-trend-note">{trendNote}</span>
      </div>

      <div className="student-progress-copy-grid">
        <div>
          <strong>Current focus</strong>
          <p>{skill.next_step || `Keep building more control in ${skill.section}.`}</p>
        </div>
        <div>
          <strong>Last assessed</strong>
          <p>{stage.label} stage · {trend?.evaluations > 1 ? `based on ${trend.evaluations} classes` : 'based on your latest class'}.</p>
        </div>
      </div>

      <div className="student-confidence-list">
        <TodoRow done={stage.order >= 2} label={`I understand the ${skill.section} task`} meta="Foundation step" />
        <TodoRow done={stage.order >= 3} label="I can complete it with support" meta="Building control" />
        <TodoRow done={stage.order >= 4} label="I can do it more independently" meta="Consistency step" />
        <TodoRow done={stage.order >= 5} label="I can try timed mock practice" meta="Ready for mock practice" />
      </div>
    </article>
  );
}

