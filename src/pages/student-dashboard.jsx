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
import { printHomework } from '../lib/print-homework.js';
import { getHomework, submitHomework, getDiagnoses, getProgressNotes, getReviews, getAllSubmissions } from '../lib/workflow.js';
import { isStructuredExercise, createEmptyResponse } from '../lib/exercise-types.js';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import { ExTypeBadge } from '../components/exercise-editor.jsx';
import { MessageTeacherDock, StudentInbox } from '../components/message-center.jsx';
import '../styles/logbook.css';

const DONE_MESSAGES = [
  "Solid work. Your teacher will take a look soon.",
  "That's the habit. Consistent practice is how it sticks.",
  "Done. One session closer to your target.",
  "Good. The work adds up — every set counts.",
  "Submitted. You showed up and did it.",
  "Nice. Progress is built one assignment at a time.",
  "That's it. Keep the streak going.",
  "Consistent. This is exactly what MET prep looks like.",
  "Handed in. Your teacher will have feedback soon.",
  "Done for today. Rest well — you earned it.",
  "Every exercise you complete closes the gap.",
  "One more done. That's how you get there.",
];

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
          <span className="dash-brand-name">MET Preparation</span>
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
      <MessageTeacherDock student={student} onSent={() => setTab('messages')} />
    </div>
  );
}

/* ─── HOME ─── */
function HomeView({ student, onTab }) {
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [pendingHw, setPendingHw] = useState([]);
  const [snapshot, setSnapshot] = useState([]);

  useEffect(() => {
    (async () => {
      const [hw, diagnoses] = await Promise.all([
        getHomework(student.id),
        getDiagnoses(student.id),
      ]);
      setPendingHw((hw || []).filter(h => h.status === 'not-started' || h.status === 'in-progress'));

      // Only show feedback from approved diagnoses
      const approvedDx = (diagnoses || []).filter(dx => dx.status === 'approved' && dx.sections?.studentFeedback?.approved);
      if (approvedDx.length > 0) {
        const dx = approvedDx[0];
        setLatestFeedback(dx.sections.studentFeedback.content);
        setSnapshot(dx.content?.section_snapshot || []);
      }
    })();
  }, [student.id]);

  function timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 680, margin: '0 auto' }}>
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
          <StudentFeedbackView feedback={latestFeedback} />
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: 0 }}>No feedback available yet. Your teacher will send feedback after your next diagnosis.</p>
        </div>
      )}

      {/* Pending homework */}
      {pendingHw.length > 0 && (
        <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)', marginBottom: 16, cursor: 'pointer' }} onClick={() => onTab('homework')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-deep)' }}>
                {pendingHw.length === 1 ? 'Homework assigned' : `${pendingHw.length} homework sets`}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                {pendingHw[0]?.title}
                {pendingHw[0]?.dueDate ? ` · Due ${new Date(pendingHw[0].dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
              </div>
            </div>
            <Icon.arrowR size={16} />
          </div>
        </div>
      )}

      {/* Skill snapshot (from approved diagnosis) */}
      {snapshot.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 10, color: 'var(--text-2)' }}>Your Current Skills</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {snapshot.map(s => (
              <div key={s.section} style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{s.section}</span>
                  {s.score_0_80 > 0 && <span style={{ color: 'var(--muted)' }}>{s.score_0_80}/80</span>}
                </div>
                {s.score_0_80 > 0 && (
                  <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'var(--bg-deep)', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 99, background: 'var(--accent)', transform: `scaleX(${Math.min(1, s.score_0_80 / 80)})`, transformOrigin: 'left', transition: 'transform 0.4s' }} />
                  </div>
                )}
                {s.score_0_80 === 0 && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>Not evaluated yet</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <MiniStat label="Session" value={`${student.session || 1}/${student.totalSessions || 24}`} />
        <MiniStat label="Pending HW" value={pendingHw.length} />
        <MiniStat label="Level" value={student.currentLevel || student.band || 'B1'} />
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
  const [answer, setAnswer] = useState('');
  const [responses, setResponses] = useState({}); // { exerciseId: responseObj }
  const [submitting, setSubmitting] = useState(false);
  const [doneState, setDoneState] = useState(null); // { hwId, msg } | null

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

  // Handle legacy text submission
  async function handleLegacySubmit(hwId) {
    if (!answer.trim()) { window.toast?.('Please write your answer.', 'warn'); return; }
    setSubmitting(true);
    await submitHomework(hwId, student.id, answer);
    const hw = await getHomework(student.id);
    setHomework(hw || []);
    setAnswer('');
    setSubmitting(false);
    const msg = DONE_MESSAGES[Math.floor(Math.random() * DONE_MESSAGES.length)];
    setDoneState({ hwId, msg });
    setTimeout(() => { setDoneState(null); setExpanded(null); }, 2800);
  }

  // Handle structured exercise submission
  async function handleStructuredSubmit(hwId) {
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
    await submitHomework(hwId, student.id, content, responses);
    const hwList = await getHomework(student.id);
    setHomework(hwList || []);
    setResponses({});
    setSubmitting(false);
    const msg = DONE_MESSAGES[Math.floor(Math.random() * DONE_MESSAGES.length)];
    setDoneState({ hwId, msg });
    setTimeout(() => { setDoneState(null); setExpanded(null); }, 2800);
  }

  // Update a single exercise response
  function updateResponse(exerciseId, updatedRes) {
    setResponses(prev => ({ ...prev, [exerciseId]: updatedRes }));
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 16px' }}>My Homework</h2>
      {homework.length === 0 && <p style={{ color: 'var(--muted)', padding: '16px 0' }}>No homework assigned yet. Your teacher will assign homework after your next class.</p>}
      {homework.map(h => {
        const review = reviews.find(r => r.homeworkId === h.id);
        const isExpanded = expanded === h.id;
        const submitted = h.status === 'submitted';
        const statusTone = review ? 'success' : submitted ? 'warning' : 'muted';
        const statusLabel = review ? 'Reviewed' : submitted ? 'Submitted' : h.status;
        const isStructured = hasStructuredExercises(h);
        const structuredExercises = isStructured ? (h.activities || []).filter(a => isStructuredExercise(a)) : [];

        // Exercise type badges for structured homework
        const typeSummary = {};
        structuredExercises.forEach(e => { typeSummary[e.type] = (typeSummary[e.type] || 0) + 1; });

        return (
          <div key={h.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 10, overflow: 'hidden' }}>
            {/* Header */}
            <div
              style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'var(--bg)' : 'var(--surface)' }}
              onClick={() => setExpanded(isExpanded ? null : h.id)}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{h.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
                  {h.dueDate && <span>· Due {new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 'var(--text-xs)', fontWeight: 600,
                background: statusTone === 'success' ? 'var(--success-bg)' : statusTone === 'warning' ? 'var(--warning-bg)' : 'var(--bg-deep)',
                color: statusTone === 'success' ? 'var(--success)' : statusTone === 'warning' ? 'var(--warning)' : 'var(--muted)',
              }}>{statusLabel}</span>
            </div>

            {/* Expanded content */}
            {isExpanded && doneState?.hwId === h.id && (
              <DoneCard msg={doneState.msg} onDismiss={() => { setDoneState(null); setExpanded(null); }} />
            )}
            {isExpanded && doneState?.hwId !== h.id && (
              <div style={{ padding: 16, borderTop: '1px solid var(--divider)' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <Button variant="ghost" size="sm" onClick={() => printHomework(h, { studentName: student?.name })}>
                    <Icon.print size={13} /> Print
                  </Button>
                </div>
                {h.objective && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 10 }}><strong>Goal:</strong> {h.objective}</p>}
                {h.description && <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{h.description}</div>}

                {/* ── STRUCTURED EXERCISES: step-through ── */}
                {isStructured && !submitted && !review && (
                  <HomeworkStepThrough
                    exercises={structuredExercises}
                    responses={responses}
                    onResponse={updateResponse}
                    onSubmit={() => handleStructuredSubmit(h.id)}
                    readOnly={false}
                  />
                )}

                {/* ── STRUCTURED EXERCISES: submitted (read-only) ── */}
                {isStructured && (submitted || review) && (
                  <div>
                    {structuredExercises.map((ex, i) => (
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

                {/* ── LEGACY: plain text activities ── */}
                {!isStructured && (
                  <>
                    {(h.activities || []).map((a, i) => (
                      <div key={i} style={{ fontSize: 'var(--text-sm)', marginBottom: 8, padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', lineHeight: 1.6 }}>{a.instruction}</div>
                    ))}
                  </>
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

                {/* Legacy submit form */}
                {!isStructured && !submitted && !review && (
                  <div style={{ marginTop: 14 }}>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={5} placeholder="Write your answer here…" style={{ width: '100%', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 'var(--text-sm)', resize: 'vertical' }} />
                    <Button variant="primary" size="sm" onClick={() => handleLegacySubmit(h.id)} disabled={submitting || !answer.trim()} style={{ marginTop: 8 }}>
                      {submitting ? 'Submitting…' : 'Submit Homework'}
                    </Button>
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
                      <div style={{ marginBottom: 10, padding: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-sm)' }}>
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
  );
}

function DoneCard({ msg, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      onClick={onDismiss}
      style={{
        padding: '28px 20px',
        borderTop: '1px solid var(--divider)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.35s var(--ease), transform 0.35s var(--ease)',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--success-bg)', border: '2px solid var(--success)',
        display: 'grid', placeItems: 'center',
        fontSize: 22, color: 'var(--success)',
      }}>✓</div>
      <p style={{
        margin: 0,
        fontSize: 'var(--text-md)', fontWeight: 500,
        color: 'var(--text-2)', textAlign: 'center',
        lineHeight: 1.55, maxWidth: 320,
      }}>{msg}</p>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Tap to dismiss</span>
    </div>
  );
}

/* ─── PROGRESS ─── */
function ProgressView({ student }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    (async () => {
      const [dx, pn] = await Promise.all([getDiagnoses(student.id), getProgressNotes(student.id)]);
      setDiagnoses((dx || []).filter(d => d.status === 'approved'));
      setNotes(pn || []);
    })();
  }, [student.id]);

  return (
    <div style={{ padding: '20px 16px', maxWidth: 680, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 16px' }}>My Progress</h2>

      {diagnoses.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No diagnoses yet. After your first class, your progress will appear here.</p>
      ) : (
        <>
          {/* Current skills from latest diagnosis */}
          {diagnoses[0]?.content?.section_snapshot?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 10 }}>Current Skills</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {diagnoses[0].content.section_snapshot.map(s => (
                  <div key={s.section} style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{s.section}</span>
                      {s.score_0_80 > 0 && <span style={{ color: 'var(--accent)' }}>{s.score_0_80}/80</span>}
                    </div>
                    {s.score_0_80 > 0 && (
                      <div style={{ width: '100%', height: 6, borderRadius: 99, background: 'var(--bg-deep)', overflow: 'hidden' }}>
                        <div style={{ width: `${(s.score_0_80 / 80) * 100}%`, height: '100%', borderRadius: 99, background: s.trend === 'improving' ? 'var(--success)' : 'var(--accent)' }} />
                      </div>
                    )}
                    {s.next_step && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Next: {s.next_step}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnosis timeline */}
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 10 }}>Diagnosis History</div>
          {diagnoses.map((dx, i) => (
            <div key={dx.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 10, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Class #{diagnoses.length - i}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{new Date(dx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {dx.sections?.profileUpdateSuggestions?.content?.progressNote && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontStyle: 'italic' }}>{dx.sections.profileUpdateSuggestions.content.progressNote}</p>
              )}
              {dx.content?.section_snapshot?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {dx.content.section_snapshot.filter(s => s.score_0_80 > 0).map(s => (
                    <div key={s.section} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.section}</div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-deep)' }}>{s.score_0_80}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
    </div>
  );
}
