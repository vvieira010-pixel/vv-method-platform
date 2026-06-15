import { useState, useEffect, lazy, Suspense } from 'react';
import { Icon, Avatar, Button } from '../components/shared.jsx';
import { getHomework, getDiagnoses, getClassEvents, getReviews } from '../lib/workflow.js';
import { recordPractice, getDueCount, getDueItems, toMCQ, getAllEntries } from '../lib/spaced-repetition.js';
import { readStoredSupabaseSession, updateUserPassword } from '../lib/supabase-storage.js';

const PracticeSession = lazy(() => import('../components/PracticeSession.jsx'));
const ReviewSession   = lazy(() => import('../components/ReviewSession.jsx'));
import { asArray, getProgressStage, getSkillTrend, hasVisibleApprovedStudentFeedback, PROGRESS_STAGES } from './student-helpers.js';
import { getTeacherSetting } from '../lib/supabase-db.js';

function daysUntilExam() {
  try {
    const ds = localStorage.getItem('vv:met_exam_date');
    if (!ds) return null;
    const exam = new Date(ds + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / 86400000);
  } catch { return null; }
}

function MetricCard({ icon, label, value, sub, tone, textValue }) {
  return (
    <article className={`student-metric student-metric--${tone}${textValue ? ' student-metric--text' : ''}`}>
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
    <article className="student-panel student-panel-mb">
      <span className="student-panel-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p style={{
        margin: '8px 0 0',
        fontSize: 'var(--text-sm)',
        lineHeight: 1.6,
        color: 'var(--text)',
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
            color: 'var(--primary)', letterSpacing: '0.03em',
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
      <span className="student-todo-check">{done ? <Icon.check size={16} /> : ''}</span>
      <span>
        <strong>{label}</strong>
        <small>{meta}</small>
      </span>
    </div>
  );
}

function SkillRow({ skill, trend }) {
  const score = Number(skill.score_0_80) || 0;
  const stage = score > 0 ? getProgressStage(score) : PROGRESS_STAGES[0];
  return (
    <div className="student-skill-row">
      <div className="student-skill-top">
        <strong style={{ textTransform: 'capitalize' }}>{skill.section}</strong>
        <span className="student-skill-stage">{stage.label}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, margin: '6px 0' }} aria-label={`${skill.section}: ${stage.label}`}>
        {PROGRESS_STAGES.map(st => (
          <span key={st.label} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: st.order <= stage.order ? 'var(--accent)' : 'var(--border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <TrendChip trend={trend} />
    </div>
  );
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

export default function StudentHome({ student, onTab }) {
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [pendingHw, setPendingHw] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [snapshot, setSnapshot] = useState([]);
  const [practiceMode, setPracticeMode] = useState(null);
  const [approvedHistory, setApprovedHistory] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewExercises, setReviewExercises] = useState([]);
  const [generalMemoText, setGeneralMemoText] = useState(() => localStorage.getItem('vv:student_general_memo') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const activeSession = readStoredSupabaseSession();

  useEffect(() => {
    getTeacherSetting('general_memo').then(val => {
      if (val !== null) {
        setGeneralMemoText(val);
        if (val) localStorage.setItem('vv:student_general_memo', val);
        else localStorage.removeItem('vv:student_general_memo');
      }
    });
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
      const [hw, diagnoses, classEvents, reviews] = await Promise.all([
        getHomework(student.id),
        getDiagnoses(student.id),
        getClassEvents(student.id),
        getReviews(student.id),
      ]);
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
    })();
  }, [student.id]);

  function timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  const pendingTitle = pendingHw[0]?.title || 'No homework pending';
  const evaluatedSkills = snapshot.filter(s => s.evaluated || Number(s.score_0_80) > 0);
  const fallbackFocus = nextClass?.metSkillFocus || nextClass?.classFocus || student.focusSkill || 'MET speaking organization';
  const focusSkill = evaluatedSkills[0]?.section || fallbackFocus;
  const focusTrend = evaluatedSkills[0] ? getSkillTrend(focusSkill, approvedHistory) : { dir: 'none' };
  const feedbackFocus = latestFeedback && typeof latestFeedback === 'object'
    ? latestFeedback.nextStep || latestFeedback.focusArea?.area || latestFeedback.focusArea?.explanation || latestFeedback.finalNote
    : '';

  function handleOpenReview() {
    const due = getDueItems(student.id);
    if (due.length === 0) { window.toast?.('No items due for review.', 'warn'); return; }
    const all = getAllEntries(student.id);
    const exercises = due.map(e => toMCQ(e, all));
    setReviewExercises(exercises);
    setReviewMode(true);
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if (!activeSession?.access_token) {
      setPasswordMsg({ ok: false, text: 'Sign in with your email link first, then set a password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'Passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await updateUserPassword(newPassword, activeSession.access_token);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ ok: true, text: 'Password updated. You can now use email and password next time.' });
      window.toast?.('Password updated.', 'ok');
    } catch (err) {
      setPasswordMsg({ ok: false, text: err.message });
    }
    setPasswordSaving(false);
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
          <section className="student-metrics fade-up" aria-label="Student summary" style={{ '--delay': '0.1s' }}>
            <MetricCard icon={<Icon.calendar size={19} />} label="Next class" value={nextDate} sub={nextTime} tone="teal" />
            <MetricCard icon={<Icon.homework size={19} />} label="Homework" value={pendingHw.length} sub={pendingHw.length === 1 ? 'task pending' : 'tasks pending'} tone="teal" />
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
            <MetricCard icon={<Icon.progress size={19} />} label="Current focus" value={focusSkill} sub={focusTrend.dir !== 'none' ? `Progress: ${focusTrend.label}` : 'next useful practice'} tone="navy" textValue />
            <MetricCard icon={<Icon.inbox size={19} />} label="Feedback" value={latestFeedback ? 'Ready' : 'Waiting'} sub={latestFeedback ? 'teacher approved' : 'after diagnosis'} tone="teal" />
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

      <section className="student-practice-studio fade-up" style={{ '--delay': '0.2s' }}>
        <div className="student-practice-studio-copy">
          <span className="student-practice-studio-kicker">Independent MET practice</span>
          <h2>Practice Studio</h2>
          <p>Choose one focused skill and build exam confidence between classes.</p>
          <div className="student-practice-studio-actions">
            {reviewCount > 0 && (
              <button className="student-wide-action student-wide-action-mb" onClick={handleOpenReview} aria-label={`Review ${reviewCount} spaced repetition item${reviewCount !== 1 ? 's' : ''}`}>
                <Icon.refresh size={14} /> Review {reviewCount} item{reviewCount !== 1 ? 's' : ''} due
              </button>
            )}
            <button className="student-practice-primary" onClick={() => setPracticeMode('speaking')}>
              <Icon.mic size={15} /> Start speaking practice
            </button>
          </div>
        </div>
        <div className="studio-orbs">
          <button className="studio-orb" onClick={() => setPracticeMode('grammar')} aria-label="Grammar Sprint">
            <span className="studio-orb-icon" aria-hidden="true"><Icon.edit size={24} /></span>
            <span className="studio-orb-label">Grammar Sprint</span>
          </button>
          <button className="studio-orb" onClick={() => setPracticeMode('vocab')} aria-label="Vocab Deep-Dive">
            <span className="studio-orb-icon" aria-hidden="true"><Icon.star size={24} /></span>
            <span className="studio-orb-label">Vocab Deep-Dive</span>
          </button>
          <button className="studio-orb" onClick={() => setPracticeMode('speaking')} aria-label="Speaking Mirror">
            <span className="studio-orb-icon" aria-hidden="true"><Icon.mic size={24} /></span>
            <span className="studio-orb-label">Speaking Mirror</span>
          </button>
        </div>
      </section>
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

      <section className="student-grid fade-up" style={{ '--delay': '0.3s' }}>
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

          <div className="student-home-columns">
            <article className="student-panel student-panel--todo">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">Up next</span>
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
                  Your teacher will add notes here after reviewing your next class.
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
                No skills evaluated yet — your first result appears after your next class.
              </div>
            )}
          </article>

          <section className="student-memo-board">
            <MemoCard kicker="General memo" title="Memo Board" text={generalMemoText || 'No general memo posted yet.'} />
          </section>

          <article className="student-panel">
            <div className="student-panel-head">
              <div>
                <span className="student-panel-kicker">Account</span>
                <h2>Change password</h2>
              </div>
              <span className="student-pill">{activeSession?.access_token ? 'Signed in' : 'Needs sign in link'}</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
              Keep your account secure by choosing a password you can use next time instead of the login link.
            </p>
            {activeSession?.access_token ? (
              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Choose a password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    disabled={passwordSaving}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm password</span>
                  <input
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat the password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={passwordSaving}
                  />
                </label>
                {passwordMsg && (
                  <p style={{ fontSize: 'var(--text-sm)', color: passwordMsg.ok ? 'var(--success)' : 'var(--danger)', margin: 0, lineHeight: 1.5 }}>
                    {passwordMsg.text}
                  </p>
                )}
                <Button type="submit" variant="primary" disabled={passwordSaving || !newPassword || !confirmPassword}>
                  {passwordSaving ? 'Saving…' : 'Set password'}
                </Button>
              </form>
            ) : (
              <div className="student-empty-card" style={{ marginTop: 8 }}>
                Sign in with your email link first, then you can set a password here.
              </div>
            )}
          </article>
        </aside>
      </section>

    </div>
  );
}
