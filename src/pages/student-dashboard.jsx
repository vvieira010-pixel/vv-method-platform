/**
 * student-dashboard.jsx — Student portal showing only teacher-approved content
 *
 * Rules:
 * - Student feedback visible only if sections.studentFeedback.approved === true
 * - Homework visible only after teacher assigns it
 * - Scores/diagnosis only from approved diagnoses
 */
import { useState, useEffect } from 'react';
import { Icon, Avatar, Button, Card, StudentFeedbackView } from '../components/shared.jsx';
import { getHomework, submitHomework, getDiagnoses, getProgressNotes, getReviews, getAllSubmissions, getClassEvents, getClassEvidence, getProgress } from '../lib/workflow.js';
import { isStructuredExercise } from '../lib/exercise-types.js';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import { ExTypeBadge } from '../components/exercise-editor.jsx';
import { StudentInbox } from '../components/message-center.jsx';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import '../styles/logbook.css';

const TABS = [
  { id: 'home',     label: 'Home',     icon: <Icon.home size={16} /> },
  { id: 'homework', label: 'Homework', icon: <Icon.homework size={16} /> },
  { id: 'progress', label: 'Progress', icon: <Icon.progress size={16} /> },
  { id: 'messages', label: 'Messages', icon: <Icon.inbox size={16} /> },
];

export default function StudentDashboard({ student, onSignOut }) {
  const [tab, setTab] = useState('home');

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
        {tab === 'progress' && <ProgressView student={student} />}
        {tab === 'messages' && <StudentInbox student={student} />}
      </div>

      <nav className="dash-bottom-nav">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={'dash-nav-btn' + (tab === t.id ? ' active' : '')}>
            <span className="dash-nav-icon">{t.icon}</span>
            <span className="dash-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ─── HOME ─── */
function HomeView({ student, onTab }) {
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [nextClassFocus, setNextClassFocus] = useState(null);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [pendingHw, setPendingHw] = useState([]);

  useEffect(() => {
    (async () => {
      const [hw, diagnoses, classEvents] = await Promise.all([
        getHomework(student.id),
        getDiagnoses(student.id),
        getClassEvents(student.id),
      ]);
      setPendingHw((hw || []).filter(h => h.status === 'not-started' || h.status === 'in-progress'));

      // Only show feedback from approved diagnoses
      const approvedDx = (diagnoses || []).filter(dx => dx.status === 'approved' && dx.sections?.studentFeedback?.approved);
      if (approvedDx.length > 0) {
        const dx = approvedDx[0];
        setLatestFeedback(dx.sections.studentFeedback.content);
        setNextClassFocus(dx.sections?.nextClassFocus?.content || null);
      }

      setUpcomingClass(buildUpcomingClassInfo(classEvents || [], approvedDx[0]?.sections?.nextClassFocus?.content || null));
    })();
  }, [student.id]);

  function timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' }}>
        Good {timeOfDay()}, {student.firstName}.
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '0 0 20px' }}>
        {student.currentLevel || student.band} → {student.targetLevel || student.bandTarget} · Session {student.session || 1}/{student.totalSessions || 24}
      </p>

      {/* Latest approved feedback */}
      {latestFeedback && typeof latestFeedback === 'object' ? (
        <div style={{ padding: 18, borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--accent-deep)', marginBottom: 12 }}>
            Latest Feedback from Teacher
          </div>
          <StudentFeedbackView
            feedback={latestFeedback}
            nextClassFocus={nextClassFocus}
            upcomingClass={upcomingClass}
            homeworkAssigned={buildHomeworkAssignedSummary(pendingHw)}
            onOpenHomework={() => onTab('homework')}
          />
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: 0 }}>No feedback available yet. Your teacher will send feedback after your next diagnosis.</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MiniStat label="Session" value={`${student.session || 1}/${student.totalSessions || 24}`} />
        <MiniStat label="Pending HW" value={pendingHw.length} />
        <MiniStat label="Level" value={student.currentLevel || student.band || 'B1'} />
      </div>

      <div style={{ marginTop: 14, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)' }}>Need help between classes?</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>Send a quick message to your teacher.</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => onTab('messages')}>
          <Icon.inbox size={13} /> Message Teacher
        </Button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-deep)' }}>{value}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

/* ─── HOMEWORK ─── */
function HomeworkView({ student }) {
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [responses, setResponses] = useState({}); // { exerciseId: responseObj }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [hw, revs] = await Promise.all([getHomework(student.id), getReviews(student.id)]);
      setHomework(hw || []);
      setReviews(revs || []);
    })();
  }, [student.id]);

  // Handle interactive exercise submission
  async function handleStructuredSubmit(hwId, exercisesInput = null) {
    setSubmitting(true);
    // Build a summary text from exercise responses for backward compatibility
    const hw = homework.find(h => h.id === hwId);
    const exercises = Array.isArray(exercisesInput) && exercisesInput.length > 0
      ? exercisesInput
      : getInteractiveExercises(hw);
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
    await submitHomework(hwId, student.id, content, responses);
    const hwList = await getHomework(student.id);
    setHomework(hwList || []);
    setResponses({});
    setExpanded(null);
      setSubmitting(false);
    window.toast?.('Submitted! Your teacher will review soon.', 'ok');
  }

  // Update a single exercise response
  function updateResponse(exerciseId, updatedRes) {
    setResponses(prev => ({ ...prev, [exerciseId]: updatedRes }));
  }

  const pendingCount = homework.filter(h => h.status !== 'submitted' && h.status !== 'reviewed' && h.status !== 'corrected').length;

  return (
    <div className="student-hw-page">
      <section className="student-hw-hero">
        <div>
          <div className="student-hw-kicker">Student Workspace</div>
          <h2 className="student-hw-title">My Homework</h2>
          <p className="student-hw-subtitle">
            Complete each task clearly, submit it, and your teacher will review it before feedback appears here.
          </p>
        </div>
        <div className="student-hw-meter">
          <div className="student-hw-meter-value">{pendingCount}</div>
          <div className="student-hw-meter-label">task{pendingCount === 1 ? '' : 's'} waiting</div>
        </div>
      </section>

      {homework.length === 0 && <p style={{ color: 'var(--muted)', padding: '16px 0' }}>No homework assigned yet. Your teacher will assign homework after your next class.</p>}
      <div className="student-hw-list">
      {homework.map(h => {
        const review = reviews.find(r => r.homeworkId === h.id);
        const isExpanded = expanded === h.id;
        const submitted = h.status === 'submitted';
        const statusTone = review ? 'success' : submitted ? 'warning' : 'muted';
        const statusLabel = review ? 'Reviewed' : submitted ? 'Submitted' : h.status;
        const interactiveExercises = getInteractiveExercises(h);

        // Exercise type badges for interactive homework
        const typeSummary = {};
        interactiveExercises.forEach(e => { typeSummary[e.type] = (typeSummary[e.type] || 0) + 1; });

        return (
          <div key={h.id} className="hw-assignment-card">
            {/* Header */}
            <button
              type="button"
              className={'hw-assignment-head' + (isExpanded ? ' is-open' : '')}
              onClick={() => setExpanded(isExpanded ? null : h.id)}
            >
              <div>
                <div className="hw-assignment-title">{h.title}</div>
                <div className="hw-assignment-meta">
                  {interactiveExercises.length > 0 ? (
                    <>
                      <span>{interactiveExercises.length} exercise{interactiveExercises.length !== 1 ? 's' : ''}</span>
                      {Object.keys(typeSummary).map(type => (
                        <ExTypeBadge key={type} typeId={type} />
                      ))}
                    </>
                  ) : (
                    <span>{h.type}</span>
                  )}
                  {h.dueDate && <span>· Due {new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
              <span className={'hw-status-pill' + (statusTone === 'success' ? ' is-success' : statusTone === 'warning' ? ' is-warning' : '')}>{statusLabel}</span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="hw-expanded">
                {(h.objective || h.description) && (
                  <div className="hw-context-grid">
                    {h.objective && (
                      <div className="hw-context-box">
                        <div className="hw-context-label">Goal</div>
                        {h.objective}
                      </div>
                    )}
                    {h.description && (
                      <div className="hw-context-box">
                        <div className="hw-context-label">Instructions</div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{h.description}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── INTERACTIVE EXERCISES: step-through ── */}
                {interactiveExercises.length > 0 && !submitted && !review && (
                  <HomeworkStepThrough
                    exercises={interactiveExercises}
                    responses={responses}
                    onResponse={updateResponse}
                    onSubmit={() => handleStructuredSubmit(h.id, interactiveExercises)}
                    readOnly={false}
                    homework={h}
                  />
                )}

                {/* ── INTERACTIVE EXERCISES: submitted (read-only) ── */}
                {interactiveExercises.length > 0 && (submitted || review) && (
                  <div>
                    {interactiveExercises.map((ex, i) => (
                      <div key={ex.id} style={{ borderTop: i > 0 ? '1px solid var(--divider)' : 'none', paddingTop: i > 0 ? 14 : 0, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>{i + 1}.</span>
                          <ExTypeBadge typeId={ex.type} />
                        </div>
                        <ExercisePlayer exercise={ex} response={{}} onResponse={() => {}} readOnly={true} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Self-check */}
                {h.selfCheck?.filter(Boolean).length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 8 }}>Self-check:</div>
                    {h.selfCheck.filter(Boolean).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <input type="checkbox" style={{ marginTop: 3 }} />
                        <span style={{ fontSize: 'var(--text-sm)' }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submitted status */}
                {submitted && !review && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', color: 'var(--warning)', fontWeight: 500 }}>
                    Submitted ✓ — Waiting for your teacher to review.
                  </div>
                )}

                {/* Teacher review */}
                {review && (
                  <div style={{ marginTop: 14, padding: 14, background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-soft)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>Teacher Review {review.score != null ? `· ${review.score}/10` : ''}</span>
                      {review.redoRequired && (
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--warning-bg)', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redo requested</span>
                      )}
                    </div>
                    {review.whatImproved && (
                      <div style={{ marginBottom: 10, padding: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--success)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>What improved</div>
                        <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{review.whatImproved}</div>
                      </div>
                    )}
                    {review.overallNote && <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, marginBottom: 10 }}>{review.overallNote}</p>}
                    {review.corrections?.length > 0 && (
                      <div style={{ marginTop: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Corrections</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {review.corrections.map((c, i) => (
                            <div key={i} style={{ fontSize: 'var(--text-sm)', padding: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-sm)' }}>
                              <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{c.original}</span>
                              {' → '}
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{c.improved}</span>
                              {c.note && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>({c.note})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(review.activeErrors) && review.activeErrors.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Still working on</div>
                        {review.activeErrors.map((e, i) => (
                          <div key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginLeft: 8 }}>• {e}</div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(review.newErrors) && review.newErrors.length > 0 && (
                      <div style={{ marginTop: 8 }}>
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
          </div>
        );
      })}
      </div>
    </div>
  );
}

function getInteractiveExercises(homeworkItem) {
  const activities = Array.isArray(homeworkItem?.activities) ? homeworkItem.activities : [];

  const normalized = activities
    .map((activity, idx) => {
      if (isStructuredExercise(activity)) {
        if (activity.id) return activity;
        return { ...activity, id: `${homeworkItem?.id || 'hw'}_ex_${idx}` };
      }

      const prompt = legacyActivityToPrompt(activity);
      if (!prompt) return null;

      return {
        id: `${homeworkItem?.id || 'hw'}_legacy_${idx}`,
        type: 'short',
        prompt,
        rubric: 'Write a complete MET-style answer with one reason and one example.',
        targetWords: 80,
      };
    })
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  const fallbackPrompt = buildHomeworkFallbackPrompt(homeworkItem);
  if (!fallbackPrompt) return [];

  return [{
    id: `${homeworkItem?.id || 'hw'}_fallback_0`,
    type: 'short',
    prompt: fallbackPrompt,
    rubric: 'Write a complete MET-style answer with one reason and one example.',
    targetWords: 80,
  }];
}

function legacyActivityToPrompt(activity) {
  if (typeof activity === 'string') return activity.trim();
  if (!activity || typeof activity !== 'object') return '';
  return String(
    activity.prompt ||
    activity.instruction ||
    activity.description ||
    activity.content ||
    activity.task ||
    ''
  ).trim();
}

function buildHomeworkFallbackPrompt(homeworkItem) {
  const parts = [
    homeworkItem?.description,
    homeworkItem?.objective,
    homeworkItem?.title,
  ]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  if (parts.length === 0) return '';
  return `Based on your homework instructions, write one complete MET-style response:\n\n${parts.join('\n\n')}`;
}

function buildUpcomingClassInfo(classEvents, nextClassFocus) {
  if (!Array.isArray(classEvents) || classEvents.length === 0) return null;
  const now = new Date();

  const upcoming = classEvents
    .filter((ev) => ev?.date)
    .map((ev) => ({ ...ev, startsAt: parseEventStart(ev) }))
    .filter((ev) => ev.startsAt && ev.startsAt >= now)
    .sort((a, b) => a.startsAt - b.startsAt);

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const dayName = next.startsAt.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel = next.startsAt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeLabel = formatClassTime(next.startTime, next.endTime);
  const scheduleBySlot = summarizeWeeklySchedule(upcoming);

  return {
    available: true,
    dateLabel,
    timeLabel,
    weeklySchedule: scheduleBySlot || `${dayName}${next.startTime ? ` at ${next.startTime}` : ''}`,
    nextClassFocus: next.classFocus || next.metSkillFocus || nextClassFocus?.primaryFocus || '',
  };
}

function parseEventStart(ev) {
  if (!ev?.date) return null;
  const start = ev.startTime ? `${ev.date}T${ev.startTime}:00` : `${ev.date}T09:00:00`;
  const d = new Date(start);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatClassTime(startTime, endTime) {
  if (startTime && endTime) return `${startTime}–${endTime}`;
  if (startTime) return startTime;
  return 'Time to be confirmed';
}

function summarizeWeeklySchedule(upcoming) {
  const slots = {};
  for (const ev of upcoming.slice(0, 8)) {
    const day = ev.startsAt.toLocaleDateString('en-US', { weekday: 'long' });
    const slot = `${day}${ev.startTime ? ` at ${ev.startTime}` : ''}`;
    slots[slot] = (slots[slot] || 0) + 1;
  }
  const ordered = Object.entries(slots).sort((a, b) => b[1] - a[1]).map(([label]) => label);
  return ordered.slice(0, 2).join(' · ');
}

function buildHomeworkAssignedSummary(pendingHw) {
  if (!Array.isArray(pendingHw) || pendingHw.length === 0) return { count: 0 };
  const first = pendingHw[0];
  return {
    count: pendingHw.length,
    title: first?.title || '',
    dueDateLabel: first?.dueDate
      ? new Date(first.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : '',
  };
}

/* ─── PROGRESS ─── */
function ProgressView({ student }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [classSessions, setClassSessions] = useState([]);
  const [storedProgress, setStoredProgress] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    (async () => {
      const [dx, pn, events, progressRaw] = await Promise.all([
        getDiagnoses(student.id),
        getProgressNotes(student.id),
        getClassEvents(student.id),
        getProgress(student.id),
      ]);
      setDiagnoses((dx || []).filter(d => d.status === 'approved'));
      setNotes(pn || []);
      setStoredProgress(progressRaw || null);

      const completedEvents = (events || []).filter((ev) =>
        ev?.status === 'completed' || ev?.diagnosticStatus === 'draft' || ev?.diagnosticStatus === 'approved'
      );
      if (!completedEvents.length) {
        setClassSessions([]);
        return;
      }
      const evidenceList = await Promise.all(completedEvents.map((ev) => getClassEvidence(ev.id)));
      setClassSessions(buildClassEvidenceSessions(completedEvents, evidenceList));
    })();
  }, [student.id]);

  const sessionSeries = buildSessionSeries(diagnoses, classSessions, storedProgress);
  const latestSession = sessionSeries[sessionSeries.length - 1] || null;
  const cards = buildTrajectoryCards(sessionSeries);
  const quadrantData = buildQuadrantData(latestSession);
  const radarData = buildRadarProfile(sessionSeries);

  return (
    <div style={{ padding: '20px 16px', maxWidth: 1120, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 16px' }}>My Progress</h2>

      {diagnoses.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No diagnoses yet. After your first class, your progress will appear here.</p>
      ) : (
        <>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>
            Speaking Score Trajectory — tap a card to see details
          </div>

          <div className="progress-session-grid" style={{ marginBottom: 20 }}>
            {cards.map((card, idx) => (
              <button
                key={card.key}
                type="button"
                onClick={() => card.session ? setSelectedSession({ ...card.session, idx: card.session.idx }) : null}
                style={{
                  textAlign: 'left',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 11,
                  padding: 16,
                  borderLeft: `4px solid ${card.color}`,
                  cursor: card.session ? 'pointer' : 'default',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--accent-deep)', lineHeight: 1.05, marginBottom: 6 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 6 }}>{card.subtitle}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: card.footerTone || 'var(--muted)', fontWeight: 600 }}>{card.footer}</div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>
            Progress Analysis
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, marginBottom: 18 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: 14 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                Sub-skill Quadrant
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 10 }}>
                X = current score · Y = MET importance
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 20, bottom: 20, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[1, 4]}
                      ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4]}
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      label={{ value: 'Current score (0-4 raw)', position: 'insideBottom', offset: -8, fill: 'var(--muted)', fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[1.5, 4]}
                      ticks={[2, 2.5, 3, 3.5, 4]}
                      tick={{ fontSize: 11, fill: 'var(--muted)' }}
                      label={{ value: 'MET importance', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 11 }}
                    />
                    <ReferenceArea x1={1} x2={2.8} y1={2.8} y2={4} fill="#f3e8e8" fillOpacity={0.55} />
                    <ReferenceArea x1={2.8} x2={4} y1={2.8} y2={4} fill="#e9f4ef" fillOpacity={0.6} />
                    <ReferenceLine x={2.8} stroke="#90a4ae" strokeDasharray="4 4" />
                    <ReferenceLine y={2.8} stroke="#90a4ae" strokeDasharray="4 4" />
                    <Tooltip content={<QuadrantTooltip />} />
                    <Scatter name="Exceeding" data={quadrantData.filter((d) => d.level === 'exceeding')} fill="#1a7f5a" />
                    <Scatter name="Achieving" data={quadrantData.filter((d) => d.level === 'achieving')} fill="#1a5f9e" />
                    <Scatter name="Developing" data={quadrantData.filter((d) => d.level === 'developing')} fill="#b05a00" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 8, borderTop: '1px solid var(--divider)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                <span style={{ color: '#1a7f5a' }}>Exceeding (3.5)</span>
                <span style={{ color: '#1a5f9e' }}>Achieving (2.7)</span>
                <span style={{ color: '#b05a00' }}>Developing (1.8)</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: 14 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                Speaking Profile — MET 3 Criteria
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 10 }}>
                Pentagon = 5 sub-skills
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text)', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v}/10`} />
                    <Legend verticalAlign="bottom" iconType="line" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Radar name="S1 current" dataKey="baseline" stroke="#1a5f9e" fill="#1a5f9e" fillOpacity={0.08} />
                    <Radar name="S2 actual" dataKey="actual" stroke="#b05a00" fill="#b05a00" fillOpacity={0.08} />
                    <Radar name="S3 projected" dataKey="projected" stroke="#2d8b8b" fill="#2d8b8b" fillOpacity={0.08} />
                    <Radar name="Goal 8.0" dataKey="goal" stroke="#1a7f5a" strokeDasharray="4 4" fill="none" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>
            Session Timeline
          </div>
          <div className="progress-session-grid">
            {sessionSeries.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setSelectedSession({ ...s, idx })}
                style={{ textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: 16, borderLeft: `4px solid ${sessionBorderColor(s.score10)}`, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>Session {idx + 1}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-deep)' }}>{s.score10 ? `${s.score10}/10` : '—'}</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 7 }}>{s.dateLabel}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.55 }}>
                  {s.note || 'Session evaluation recorded from diagnosis evidence.'}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Progress notes */}
      {notes.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 10 }}>Notes from Teacher</div>
          {notes.map(n => (
            <div key={n.id} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8, fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginRight: 8 }}>
                {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              {n.note}
            </div>
          ))}
        </div>
      )}

      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}

function SessionDetailModal({ session, onClose }) {
  if (!session) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--accent-deep)' }}>Session {session.idx + 1}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{session.dateLabel}</div>
          </div>
          <button onClick={onClose} style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 10, fontSize: 'var(--text-sm)' }}><strong>Session score:</strong> {session.score10 != null ? `${session.score10}/10` : 'Not set'}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
            {session.note || 'No teacher note recorded for this session.'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>
            Skill Breakdown (1–10)
          </div>
          <SkillBars scores={session.skillScores || []} />
        </div>
      </div>
    </div>
  );
}

function SkillBars({ scores }) {
  if (!scores?.length) return <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: 0 }}>No evaluated skills yet.</p>;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {scores.slice(0, 6).map((s) => (
        <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 40px', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{s.name}</span>
          <div style={{ width: '100%', height: 8, background: 'var(--bg-deep)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (s.score10 / 10) * 100)}%`, height: '100%', background: '#1a5f9e' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent-deep)', fontWeight: 700 }}>{s.score10}</span>
        </div>
      ))}
    </div>
  );
}

function QuadrantTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{p.skill}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Current: {p.raw.toFixed(1)} / 4</div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Importance: {p.y.toFixed(1)} / 4</div>
    </div>
  );
}

function buildTrajectoryCards(sessionSeries) {
  const first = sessionSeries[0] || null;
  const latest = sessionSeries[sessionSeries.length - 1] || null;
  const prev = sessionSeries.length > 1 ? sessionSeries[sessionSeries.length - 2] : null;
  const trend = latest?.score10 != null && prev?.score10 != null ? round1(latest.score10 - prev.score10) : 0;
  const projectedScore = latest?.score10 != null ? clamp10(round1(latest.score10 + Math.max(0.3, trend || 0.6))) : null;
  const targetMet = projectedScore != null && projectedScore >= 8;

  return [
    {
      key: 'baseline',
      title: `S1 — Baseline`,
      value: first?.score10 != null ? `${first.score10}` : '—',
      subtitle: first ? `Session 1 baseline` : 'No baseline yet',
      footer: first ? `Overall: ${first.score10}` : '',
      color: '#1a5f9e',
      session: first ? { ...first, idx: 0 } : null,
    },
    {
      key: 'actual',
      title: `S${latest?.idx != null ? latest.idx + 1 : sessionSeries.length} — Actual`,
      value: latest?.score10 != null ? `${latest.score10}` : '—',
      subtitle: latest ? `Session ${latest.idx + 1} performance` : 'No recent session',
      footer: latest ? `Δ ${trend >= 0 ? '+' : ''}${trend.toFixed(1)}` : '',
      color: '#b05a00',
      session: latest ? { ...latest, idx: latest.idx } : null,
    },
    {
      key: 'projected',
      title: `S${(latest?.idx ?? sessionSeries.length) + 2} — Projected`,
      value: projectedScore != null ? `${projectedScore}` : '—',
      subtitle: 'Two sessions out',
      footer: targetMet ? '✓ Target met' : 'On track',
      footerTone: targetMet ? '#1a7f5a' : 'var(--muted)',
      color: '#1a7f5a',
      session: null,
    },
  ];
}

function buildQuadrantData(latestSession) {
  const items = Array.isArray(latestSession?.skillScores) ? latestSession.skillScores : [];
  const fallback = latestSession?.score10 != null ? latestSession.score10 : 6;

  const source = items.length
    ? items
    : [
      { name: 'Task completion', score10: fallback },
      { name: 'Vocabulary', score10: fallback },
      { name: 'Grammar', score10: fallback },
      { name: 'Fluency & coherence', score10: fallback },
      { name: 'Pronunciation', score10: fallback },
    ];

  return source.slice(0, 7).map((s) => {
    const score10 = clamp10(s.score10) ?? fallback;
    const raw = round1(score10 / 2.5);
    const importance = round1(skillImportance(s.name, score10));
    return {
      skill: toMetricLabel(s.name),
      raw,
      x: raw,
      y: importance,
      level: raw >= 3.2 ? 'exceeding' : raw >= 2.4 ? 'achieving' : 'developing',
    };
  });
}

function buildRadarProfile(sessionSeries) {
  const first = sessionSeries[0] || null;
  const latest = sessionSeries[sessionSeries.length - 1] || null;
  const prev = sessionSeries.length > 1 ? sessionSeries[sessionSeries.length - 2] : null;
  const trend = latest?.score10 != null && prev?.score10 != null ? round1(latest.score10 - prev.score10) : 0;
  const boost = Math.max(0.3, trend || 0.6);

  const preferredOrder = ['Task completion', 'Vocabulary', 'Grammar', 'Fluency & coherence', 'Pronunciation'];
  const latestMap = mapSkillScores(latest?.skillScores);
  const baselineMap = mapSkillScores(first?.skillScores);

  const categories = preferredOrder.map((name) => {
    const actual = latestMap.get(name) ?? latest?.score10 ?? 6;
    const baseline = baselineMap.get(name) ?? first?.score10 ?? actual;
    const projected = clamp10(round1(actual + boost));
    return {
      skill: name,
      baseline: clamp10(baseline) ?? 6,
      actual: clamp10(actual) ?? 6,
      projected: projected ?? 6,
      goal: 8,
    };
  });

  return categories;
}

function mapSkillScores(scores) {
  const m = new Map();
  (Array.isArray(scores) ? scores : []).forEach((s) => {
    const score = clamp10(s?.score10);
    if (score == null) return;
    const key = toMetricLabel(s.name);
    if (!m.has(key)) m.set(key, score);
  });
  return m;
}

function toMetricLabel(name) {
  const text = String(name || '').toLowerCase();
  if (text.includes('task')) return 'Task completion';
  if (text.includes('vocab')) return 'Vocabulary';
  if (text.includes('gram')) return 'Grammar';
  if (text.includes('fluency') || text.includes('coherence') || text.includes('speak') || text.includes('reading') || text.includes('writing') || text.includes('listening')) {
    return 'Fluency & coherence';
  }
  if (text.includes('pronunciation') || text.includes('pronunc')) return 'Pronunciation';
  if (text.includes('test')) return 'Task completion';
  return 'Vocabulary';
}

function skillImportance(name, score10) {
  const text = String(name || '').toLowerCase();
  if (text.includes('speaking') || text.includes('pronunciation')) return 3.5;
  if (text.includes('reading') || text.includes('writing') || text.includes('listening')) return 3.2;
  if (text.includes('grammar')) return 3.0;
  if (text.includes('vocab')) return 2.8;
  return score10 < 6 ? 3.1 : 2.7;
}

function buildSessionSeries(diagnoses, classSessions, storedProgress) {
  const fromDx = buildDiagnosisSessions(diagnoses || []);
  const fromClass = Array.isArray(classSessions) ? classSessions : [];
  const fromStore = buildProgressStoreSessions(storedProgress);

  // Priority by source: store (low) < class record (mid) < approved diagnosis (high)
  const priority = { store: 1, class: 2, diagnosis: 3 };
  const byDate = new Map();
  [...fromStore, ...fromClass, ...fromDx].forEach((s) => {
    const k = dateKey(s.rawDate);
    const prev = byDate.get(k);
    if (!prev || (priority[s.source] || 0) >= (priority[prev.source] || 0)) {
      byDate.set(k, s);
    }
  });

  return Array.from(byDate.values())
    .sort((a, b) => a.rawDateTs - b.rawDateTs)
    .map((s, idx) => ({ ...s, idx }));
}

function buildDiagnosisSessions(diagnoses) {
  const ordered = [...diagnoses].reverse();
  return ordered.map((dx) => {
    const snapshot = Array.isArray(dx?.content?.section_snapshot) ? dx.content.section_snapshot : [];
    const valid = snapshot.filter((s) => Number(s?.score_0_80) > 0);
    const avg80 = valid.length ? valid.reduce((sum, s) => sum + Number(s.score_0_80), 0) / valid.length : null;
    const derived10 = avg80 != null ? round1(avg80 / 8) : null;
    const manual10 = numberOrNull(dx?.sessionScore10 ?? dx?.sections?.progressScale?.score10 ?? dx?.sections?.progress?.score10);
    const score10 = clamp10(manual10 != null ? manual10 : derived10);
    const skillScores = valid
      .map((s) => ({ name: s.section, score10: clamp10(round1(Number(s.score_0_80) / 8)) }))
      .filter((s) => s.score10 != null);
    const rawDate = dx.createdAt || dx.date || new Date().toISOString();
    return {
      id: dx.id,
      source: 'diagnosis',
      score10,
      skillScores,
      rawDate,
      rawDateTs: toDateTs(rawDate),
      dateLabel: formatDate(rawDate),
      note: dx.sections?.profileUpdateSuggestions?.content?.progressNote || '',
    };
  });
}

function buildClassEvidenceSessions(events, evidenceList) {
  const out = [];
  (events || []).forEach((ev, i) => {
    const evidence = evidenceList?.[i];
    if (!evidence) return;
    const skillScores = skillScoresFromEvidence(evidence);
    const avg = skillScores.length
      ? round1(skillScores.reduce((sum, s) => sum + (s.score10 || 0), 0) / skillScores.length)
      : null;
    const manual10 = numberOrNull(
      evidence.sessionScore10 ??
      evidence.progressScore10 ??
      evidence.score10 ??
      evidence.overallScore10
    );
    const score10 = clamp10(manual10 != null ? manual10 : avg);
    if (score10 == null && !skillScores.length) return;
    const rawDate = ev?.date ? `${ev.date}T12:00:00` : ev?.createdAt || new Date().toISOString();
    out.push({
      id: evidence.id || ev.id,
      source: 'class',
      score10,
      skillScores,
      rawDate,
      rawDateTs: toDateTs(rawDate),
      dateLabel: formatDate(rawDate),
      note: evidence.teacherNotes || evidence.studentPerformance || evidence.additionalNotes || 'Session evaluation recorded from class evidence.',
    });
  });
  return out;
}

function skillScoresFromEvidence(evidence) {
  if (!evidence) return [];
  const defs = [
    { name: 'Speaking', evalKey: 'evaluatedSpeaking', countKey: 'speakingEvidenceCount' },
    { name: 'Writing', evalKey: 'evaluatedWriting', countKey: 'writingEvidenceCount' },
    { name: 'Reading', evalKey: 'evaluatedReading', countKey: 'readingEvidenceCount' },
    { name: 'Listening', evalKey: 'evaluatedListening', countKey: 'listeningEvidenceCount' },
    { name: 'Grammar', evalKey: 'evaluatedGrammar', countKey: 'grammarEvidenceCount' },
    { name: 'Vocabulary', evalKey: 'evaluatedVocabulary', countKey: 'vocabularyEvidenceCount' },
    { name: 'Task completion', evalKey: 'evaluatedTestStrategy', countKey: 'testStrategyEvidenceCount' },
  ];
  return defs
    .filter((d) => Boolean(evidence[d.evalKey]))
    .map((d) => {
      const count = Number(evidence[d.countKey] || 0);
      const base = d.name === 'Task completion' ? 6.5 : 5.5;
      return { name: d.name, score10: clamp10(round1(base + Math.min(4, count))) };
    })
    .filter((s) => s.score10 != null);
}

function buildProgressStoreSessions(progressObj) {
  if (!progressObj || typeof progressObj !== 'object') return [];
  const candidates = [
    progressObj.sessionSeries,
    progressObj.sessions,
    progressObj.timeline,
    progressObj.history,
    progressObj.progress,
    progressObj.speakingTrajectory,
    progressObj.scores,
  ];
  const list = candidates.find((arr) => Array.isArray(arr) && arr.length) || [];
  if (!list.length) return [];

  return list
    .map((item, idx) => {
      const isNumber = typeof item === 'number' || typeof item === 'string';
      const rawScore = isNumber
        ? item
        : (item.score10 ?? item.score ?? item.overall ?? item.overallScore ?? item.metScore ?? item.value);
      const score10 = toScore10(rawScore);
      if (score10 == null) return null;
      const rawDate = isNumber
        ? new Date(Date.now() - (list.length - idx - 1) * 86400000).toISOString()
        : (item.date || item.createdAt || item.timestamp || new Date().toISOString());
      return {
        id: isNumber ? `store-${idx}` : (item.id || `store-${idx}`),
        source: 'store',
        score10,
        skillScores: [],
        rawDate,
        rawDateTs: toDateTs(rawDate),
        dateLabel: formatDate(rawDate),
        note: isNumber ? 'Imported from saved progress history.' : (item.note || item.label || 'Imported from saved progress history.'),
      };
    })
    .filter(Boolean);
}

function toScore10(rawScore) {
  const n = numberOrNull(rawScore);
  if (n == null) return null;
  if (n <= 10) return clamp10(n);
  if (n <= 80) return clamp10(round1(n / 8));
  if (n <= 100) return clamp10(round1(n / 10));
  return null;
}

function dateKey(rawDate) {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return String(rawDate || '');
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function toDateTs(rawDate) {
  const d = new Date(rawDate);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatDate(rawDate) {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return 'Date not set';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function numberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp10(v) {
  if (v == null) return null;
  return round1(Math.max(0, Math.min(10, Number(v))));
}

function sessionBorderColor(score10) {
  if (score10 == null) return '#9ca3af';
  if (score10 >= 8) return '#1a7f5a';
  if (score10 >= 6) return '#b05a00';
  return '#1a5f9e';
}
