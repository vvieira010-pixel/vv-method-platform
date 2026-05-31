/**
 * student-dashboard.jsx — Student portal showing only teacher-approved content
 *
 * Rules:
 * - Student feedback visible only if sections.studentFeedback.approved === true
 * - Homework visible only after teacher assigns it
 * - Scores/diagnosis only from approved diagnoses
 */
import { useState, useEffect } from 'react';
import { Icon, Avatar, Button, Card, SectionHeader, StudentFeedbackView, Shell } from '../components/shared.jsx';
import { getHomework, submitHomework, getDiagnoses, getProgressNotes, getReviews, getAllSubmissions, getClassEvents } from '../lib/workflow.js';
import { isStructuredExercise } from '../lib/exercise-types.js';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import { ExTypeBadge } from '../components/exercise-editor.jsx';
import { MessageTeacherDock, StudentInbox } from '../components/message-center.jsx';
import '../styles/logbook.css';

export default function StudentDashboard({ student, onSignOut }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!student) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
      <p>Loading your dashboard…</p>
    </div>;
  }

  const tabs = [
    { id: 'dashboard', label: 'Journey', icon: <Icon.home /> },
    { id: 'feedback',  label: 'Feedback', icon: <Icon.doc /> },
    { id: 'homework',  label: 'Practice', icon: <Icon.homework /> },
    { id: 'progress',  label: 'Mastery', icon: <Icon.progress /> },
    { id: 'messages',  label: 'Messages', icon: <Icon.inbox /> },
  ];

  return (
    <Shell
      active={activeTab}
      onTab={setActiveTab}
      tabs={tabs}
      rightSlot={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{student.firstName}</span>
          <Avatar name={student.name} size={32} />
          <Button variant="ghost" size="sm" onClick={onSignOut}>Sign out</Button>
        </div>
      }
    >
      <div className="page-shell">
        <div className="page-inner">
          {activeTab === 'dashboard' && <HomeView student={student} onTab={setActiveTab} />}
          {activeTab === 'feedback'  && <FeedbackView student={student} />}
          {activeTab === 'homework'  && <HomeworkView student={student} />}
          {activeTab === 'progress'  && <ProgressView student={student} />}
          {activeTab === 'messages'  && <StudentInbox student={student} />}
        </div>
      </div>
      <MessageTeacherDock student={student} onSent={() => setActiveTab('messages')} />
    </Shell>
  );
}

/* ─── HOME ─── */
function HomeView({ student, onTab }) {
  const [pendingHw, setPendingHw] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [hasFeedback, setHasFeedback] = useState(false);
  const session = student.session || 1;
  const totalSessions = student.totalSessions || 24;
  const progress = Math.round((session / totalSessions) * 100);

  useEffect(() => {
    (async () => {
      const [hw, diagnoses, events] = await Promise.all([
        getHomework(student.id),
        getDiagnoses(student.id),
        getClassEvents(student.id),
      ]);
      setPendingHw((hw || []).filter(h => h.status === 'not-started' || h.status === 'in-progress'));

      const approvedDx = (diagnoses || []).filter(dx => dx.status === 'approved' && dx.sections?.studentFeedback?.approved);
      setHasFeedback(approvedDx.length > 0);

      const today = new Date().toISOString().slice(0, 10);
      const upcoming = (events || [])
        .filter(e => e.status === 'scheduled' && e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''));
      setNextClass(upcoming[0] || null);
    })();
  }, [student.id]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Journey Map */}
      <Card style={{ marginBottom: 24, background: 'var(--accent)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>Your Mastery Journey</div>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--mastery-gold)' }}>
            Session {session} <span style={{ color: 'var(--accent-soft)' }}>/ {totalSessions}</span>
          </div>
        </div>
        <div style={{ width: '100%', height: 12, borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progress}%`, height: '100%', borderRadius: 'var(--radius-pill)', 
            background: 'var(--mastery-gold)', transition: 'width 1s var(--ease)' 
          }} />
        </div>
        <div style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--accent-soft)' }}>
          {progress < 25 ? 'Just getting started—mastering the foundations.' :
           progress < 50 ? 'Building momentum in intermediate skills.' :
           progress < 75 ? 'Advancing toward sophisticated expression.' :
           'Final stretch: honing mastery for the exam.'}
        </div>
      </Card>

      {/* Next Class */}
      {nextClass && (
        <Card style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--info-bg)', display: 'grid', placeItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
            <Icon.calendar size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Next Class</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', marginTop: 2 }}>
              {new Date(nextClass.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              {nextClass.startTime && ` · ${nextClass.startTime}`}
            </div>
            {nextClass.classFocus && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 4 }}>Focus: {nextClass.classFocus}</div>
            )}
          </div>
        </Card>
      )}

      {/* Primary Call to Action */}
      {pendingHw.length > 0 && (
        <Card style={{ borderLeft: '4px solid var(--mastery-gold)', marginBottom: 24 }}>
          <SectionHeader 
            title="Practice Focus" 
            sub={pendingHw[0].title}
            action={<Button variant="primary" onClick={() => onTab('homework')}>Continue Practice</Button>}
          />
        </Card>
      )}

      {/* Feedback nudge */}
      {hasFeedback && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => onTab('feedback')}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', display: 'grid', placeItems: 'center', color: 'var(--success)', flexShrink: 0 }}>
            <Icon.doc size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Teacher Feedback</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>New feedback from your teacher is available.</div>
          </div>
          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>View →</span>
        </Card>
      )}
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
    setExpanded(null);
    setSubmitting(false);
    window.toast?.('Submitted! Your teacher will review soon.', 'ok');
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
    setExpanded(null);
    setSubmitting(false);
    window.toast?.('Submitted! Your teacher will review soon.', 'ok');
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
            {isExpanded && (
              <div style={{ padding: 16, borderTop: '1px solid var(--divider)' }}>
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

/* ─── FEEDBACK ─── */
function FeedbackView({ student }) {
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    (async () => {
      const diagnoses = await getDiagnoses(student.id);
      const approved = (diagnoses || [])
        .filter(dx => dx.status === 'approved' && dx.sections?.studentFeedback?.approved)
        .map(dx => ({
          id: dx.id,
          date: dx.createdAt,
          feedback: dx.sections.studentFeedback.content,
        }));
      setFeedbackList(approved);
    })();
  }, [student.id]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <SectionHeader title="Teacher Feedback" sub="Personalized notes from your teacher after each session." />

      {feedbackList.length === 0 ? (
        <Card>
          <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
            No feedback yet. After your next class and diagnosis, your teacher will share personalized notes here.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {feedbackList.map(item => (
            <Card key={item.id}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 12 }}>
                {new Date(item.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <StudentFeedbackView feedback={item.feedback} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PROGRESS ─── */
function ProgressView({ student }) {
  const [diagnoses, setDiagnoses] = useState([]);

  useEffect(() => {
    (async () => {
      const dx = await getDiagnoses(student.id);
      setDiagnoses((dx || []).filter(d => d.status === 'approved'));
    })();
  }, [student.id]);

  const latestDx = diagnoses[0];
  const snapshot = latestDx?.content?.section_snapshot || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <SectionHeader title="Mastery Skill Tree" sub="Your progression across core MET competencies." />
      
      {snapshot.length === 0 ? (
        <Card>
          <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
            No mastery data yet. Complete your first diagnostic session to begin mapping your skills.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {snapshot.map(s => (
            <Card key={s.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--accent)' }}>{s.section}</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--mastery-gold)' }}>
                  {s.score_0_80 || 0}/80
                </div>
              </div>
              
              {/* Mastery Progress Bar */}
              <div style={{ width: '100%', height: 10, borderRadius: 'var(--radius-pill)', background: 'var(--divider)', marginBottom: 8 }}>
                <div style={{ 
                  width: `${((s.score_0_80 || 0) / 80) * 100}%`, 
                  height: '100%', 
                  borderRadius: 'var(--radius-pill)', 
                  background: 'linear-gradient(90deg, var(--primary), var(--mastery-gold))',
                  transition: 'width 0.8s var(--ease)' 
                }} />
              </div>
              
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--steel)' }}>
                {s.next_step ? `Next focus: ${s.next_step}` : 'Mastery attained'}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Diagnosis History remains for context */}
      <div style={{ marginTop: 40 }}>
        <SectionHeader title="History" sub="Your journey through diagnostic sessions." />
        {diagnoses.map((dx, i) => (
          <Card key={dx.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>Class Session #{diagnoses.length - i}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                {new Date(dx.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
