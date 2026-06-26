import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/shared.jsx';
import { getHomework, submitHomework, getReviews, getDraft, saveDraft } from '../lib/workflow.js';
import { isStructuredExercise, autoGrade } from '../lib/exercise-types.js';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import { ExTypeBadge } from '../components/exercise-badge.jsx';
import { recordPractice } from '../lib/spaced-repetition.js';
import { printHomework } from '../lib/print-homework.js';
import { asArray, exerciseSearchText } from './student-helpers.js';
import { TopicContentRenderer } from '../components/topic-explanations.jsx';

function CorrectionNote({ c }) {
  return (
    <div className="hw-correction-note">
      {c.original && <span className="hw-correction-original">{c.original}</span>}
      {c.original && c.improved && ' → '}
      {c.improved && <span className="hw-correction-improved">{c.improved}</span>}
      {c.note && <span className="hw-correction-note-text">({c.note})</span>}
    </div>
  );
}

export default function StudentHomework({ student }) {
  const [homework, setHomework] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [answers, setAnswers] = useState({});
  const [responses, setResponses] = useState({});
  const [draftMeta, setDraftMeta] = useState({});
  const [homeworkFilter, setHomeworkFilter] = useState('todo');
  const [submitting, setSubmitting] = useState(false);
  const [selfChecks, setSelfChecks] = useState({});

  function selfCheckKey(hwId) { return `vv:hw_selfcheck:${student.id}:${hwId}`; }
  function getSelfChecks(hwId) {
    if (selfChecks[hwId]) return selfChecks[hwId];
    try { return JSON.parse(localStorage.getItem(selfCheckKey(hwId)) || '{}'); } catch { return {}; }
  }
  function toggleSelfCheck(hwId, idx) {
    const next = { ...getSelfChecks(hwId), [idx]: !getSelfChecks(hwId)[idx] };
    setSelfChecks(prev => ({ ...prev, [hwId]: next }));
    try { localStorage.setItem(selfCheckKey(hwId), JSON.stringify(next)); } catch { /* storage unavailable */ }
  }

  useEffect(() => {
    (async () => {
      const [hw, revs] = await Promise.all([getHomework(student.id), getReviews(student.id)]);
      setHomework(hw || []);
      setReviews(revs || []);
    })();
  }, [student.id]);

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
        [h.id]: { updatedAt: draft.updatedAt, currentExerciseId: draft.currentExerciseId },
      }));
    }
  }

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

  async function handleStructuredSubmit(hwId, confidence) {
    setSubmitting(true);
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
    const reviewItems = exercises.filter(ex => ex.isReviewItem && ex.reviewItemId);
    reviewItems.forEach(ex => {
      const grade = autoGrade(ex, exerciseResponses[ex.id]);
      if (grade) recordPractice(student.id, ex.reviewItemId, grade.correct);
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

  function updateResponse(exerciseId, updatedRes) {
    setResponses(prev => ({ ...prev, [exerciseId]: updatedRes }));
  }

  async function saveStructuredProgress(hwId, currentExerciseId) {
    const hw = homework.find(h => h.id === hwId);
    const exerciseIds = new Set((hw?.activities || []).filter(a => isStructuredExercise(a)).map(ex => ex.id));
    const exerciseResponses = Object.fromEntries(
      Object.entries(responses).filter(([exerciseId]) => exerciseIds.has(exerciseId))
    );
    const draft = { responses: exerciseResponses, currentExerciseId, updatedAt: new Date().toISOString() };
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
      <section className="student-homework-hero">
        <div className="student-homework-hero-copy">
          <span className="student-homework-hero-kicker">Homework</span>
          <h1>Assigned practice</h1>
          <p>Complete the tasks your teacher assigned, then submit them for review.</p>
        </div>
        <span className="student-homework-hero-badge">{homework.length} assigned</span>
      </section>

      {homework.length === 0 && (
        <div className="student-empty-card">
          Nothing assigned yet — your teacher will send you tasks after class.
        </div>
      )}

      {homework.length > 0 && (
        <div className="student-homework-filters" aria-label="Homework filters">
          {[['todo', 'To do'], ['submitted', 'Submitted'], ['reviewed', `Reviewed (${reviewedCount})`], ['all', 'All']].map(([id, label]) => (
            <button key={id} type="button" className={`hw-filter-btn${homeworkFilter === id ? ' active' : ''}`} onClick={() => setHomeworkFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      <section className="student-homework-list">
      {homework.length > 0 && visibleHomework.length === 0 && (
        <div className="student-empty-card">No homework in this view.</div>
      )}
      {visibleHomework.map(h => {
        const review = reviews.find(r => r.homeworkId === h.id);
        const isExpanded = expanded === h.id;
        const submitted = h.status === 'submitted';
        const statusTone = review ? 'success' : submitted ? 'warning' : 'muted';
        const statusLabel = review ? 'Reviewed' : submitted ? 'Submitted' : (h.status || 'Not started');
        const isStructured = hasStructuredExercises(h);
        const structuredExercises = isStructured ? (h.activities || []).filter(a => isStructuredExercise(a)) : [];
        const typeSummary = {};
        structuredExercises.forEach(e => { typeSummary[e.type] = (typeSummary[e.type] || 0) + 1; });

        return (
          <article key={h.id} className={`student-homework-card student-homework-card--${statusTone}${isExpanded ? ' is-expanded' : ''}`}>
            <button className="student-homework-card-head" onClick={() => toggleHomework(h)}>
              <div className="student-homework-card-orb">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="student-homework-title">
                <h2>{h.title || 'Homework task'}</h2>
                <div className="student-homework-meta">
                  {isStructured ? (
                    <>
                      <span>{structuredExercises.length} exercise{structuredExercises.length !== 1 ? 's' : ''}</span>
                      {Object.keys(typeSummary).map(type => (<ExTypeBadge key={type} typeId={type} />))}
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

            {isExpanded && (
              <div className="student-homework-content">
                <div className="hw-print-row">
                  <Button variant="ghost" size="sm" onClick={() => printHomework(h, { studentName: student?.name })}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon_print /> Print</span>
                  </Button>
                </div>

                {review && (
                  <div className="hw-teacher-review">
                    <div className="hw-teacher-review-title">
                      <span>Teacher Review</span>
                      {review.redoRequired && (
                        <span className="hw-redo-badge">Redo requested</span>
                      )}
                    </div>
                    {review.whatImproved && (
                      <div className="hw-teacher-review-detail">
                        <strong>What improved: </strong>{review.whatImproved}
                      </div>
                    )}
                    {review.overallNote && <p className="hw-teacher-review-note">{review.overallNote}</p>}
                  </div>
                )}

                {(h.objective || h.description || h.estimatedTime || h.metSkillConnection) && (
                  <div className="student-homework-brief">
                    {h.objective && (<div><strong>Goal</strong><p>{h.objective}</p></div>)}
                    {h.estimatedTime && (<div><strong>Time</strong><p>{h.estimatedTime}</p></div>)}
                    {h.metSkillConnection && (<div><strong>MET skill</strong><p>{h.metSkillConnection}</p></div>)}
                    {h.description && (<div className="student-homework-brief-wide"><strong>Instructions</strong><p>{h.description}</p></div>)}
                  </div>
                )}

                {Array.isArray(h.topicExplanations) && h.topicExplanations.length > 0 && (
                  <div style={{ marginBottom: 18, padding: 14, background: 'var(--surface)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Topic Background
                    </div>
                    {h.topicExplanations.map(topic => (
                      <div key={topic.id} style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 6, color: 'var(--accent-deep)' }}>{topic.title}</div>
                        <TopicContentRenderer content={topic.content} />
                      </div>
                    ))}
                  </div>
                )}
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
                        <div key={ex.id} className="hw-exercise-row">
                          <div className="hw-exercise-row-head">
                            <span className="hw-exercise-num">{i + 1}.</span>
                            <ExTypeBadge typeId={ex.type} />
                          </div>
                          <ExercisePlayer exercise={ex} response={{}} onResponse={() => {}} readOnly={true} />
                          {matchedByEx[i].map((c, ci) => <CorrectionNote key={ci} c={c} />)}
                        </div>
                      ))}
                      {unmatched.length > 0 && (
                        <div className="hw-unmatched-corrections">
                          <div className="hw-section-kicker hw-section-kicker--muted">More corrections</div>
                          {unmatched.map((c, ci) => <CorrectionNote key={ci} c={c} />)}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {!isStructured && (
                  <>
                    {(h.activities || []).map((a, i) => (
                      <div key={i} className="student-homework-activity">{a.instruction}</div>
                    ))}
                  </>
                )}

                {h.selfCheck?.filter(Boolean).length > 0 && (
                  <div className="hw-self-check">
                    <div className="hw-self-check-title">Self-check:</div>
                    {h.selfCheck.filter(Boolean).map((c, i) => (
                      <label key={i} className="hw-self-check-item">
                        <input type="checkbox" aria-label={c}
                          checked={!!getSelfChecks(h.id)[i]} onChange={() => toggleSelfCheck(h.id, i)} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                )}

                {!isStructured && !submitted && !review && (
                  <div className="student-homework-submit">
                    <textarea value={answers[h.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [h.id]: e.target.value }))} rows={5} placeholder="Write your answer here…" />
                    <Button variant="primary" size="sm" onClick={() => handleLegacySubmit(h.id)} disabled={submitting || !answers[h.id]?.trim()} style={{ marginTop: 8 }}>
                      {submitting ? 'Submitting…' : 'Submit Homework'}
                    </Button>
                  </div>
                )}

                {submitted && !review && (
                  <motion.div className="student-homework-waiting" animate={{ opacity: [1, 0.55, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
                    Submitted — your teacher will review this soon.
                  </motion.div>
                )}

                {review && ((Array.isArray(review.activeErrors) && review.activeErrors.length > 0) || (Array.isArray(review.newErrors) && review.newErrors.length > 0)) && (
                  <div className="hw-error-panel">
                    {Array.isArray(review.activeErrors) && review.activeErrors.length > 0 && (
                      <div className="hw-error-section">
                        <div className="hw-section-kicker hw-section-kicker--warning">Still working on</div>
                        {review.activeErrors.map((e, i) => (<div key={i} className="hw-error-item">• {e}</div>))}
                      </div>
                    )}
                    {Array.isArray(review.newErrors) && review.newErrors.length > 0 && (
                      <div className="hw-error-section">
                        <div className="hw-section-kicker hw-section-kicker--danger">New to work on</div>
                        {review.newErrors.map((e, i) => (<div key={i} className="hw-error-item">• {e}</div>))}
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

function Icon_print() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
