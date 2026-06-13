import { useState, useEffect } from 'react';
import { Icon, Button, StudentFeedbackView } from '../components/shared.jsx';
import { getDiagnoses, getSubmissions, getReviews, getInbox, sendMessage } from '../lib/workflow.js';
import { asArray, getProgressStage, getRelevantGlossaryTerms, hasVisibleApprovedStudentFeedback } from './student-helpers.js';

export default function StudentFeedback({ student, onTab }) {
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
        getDiagnoses(student.id), getSubmissions(student.id), getReviews(student.id),
        getInbox({ role: 'student', studentId: student.id }),
      ]);
      const approved = (diagnoses || [])
        .filter(hasVisibleApprovedStudentFeedback)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map(dx => ({ id: dx.id, createdAt: dx.createdAt, feedback: dx.sections.studentFeedback.content, snapshot: asArray(dx.content?.section_snapshot) }));
      setFeedbackItems(approved);
      if (approved[0]?.id) {
        const stored = localStorage.getItem(`vv:feedback_selfassess:${approved[0].id}`);
        if (stored) setSelfAssessment(stored);
      }
      const reviewedSub = (submissions || []).filter(s => s.confidence != null).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0];
      if (reviewedSub) {
        const review = (reviews || []).find(r => r.homeworkId === reviewedSub.homeworkId);
        setConfidenceScore({ confidence: reviewedSub.confidence, score: review?.score ?? null });
      }
      const replies = {}; const und = {};
      (inbox || []).forEach(msg => {
        if (msg.diagnosisId) {
          if (msg.type === 'feedback-reply' && msg.fromStudentId === student.id) { replies[msg.diagnosisId] = replies[msg.diagnosisId] || []; replies[msg.diagnosisId].push(msg); }
          if (msg.type === 'feedback-understood' && msg.fromStudentId === student.id) und[msg.diagnosisId] = true;
        }
      });
      setFeedbackReplies(replies);
      setUnderstood(und);
    })();
  }, [student.id]);

  async function handleFeedbackReply(diagnosisId) {
    const body = (replyText[diagnosisId] || '').trim();
    if (!body) return;
    await sendMessage({ fromStudentId: student.id, fromName: student.firstName || student.name || 'Student', fromRole: 'student', toRole: 'teacher', diagnosisId, type: 'feedback-reply', body });
    setReplyText(prev => ({ ...prev, [diagnosisId]: '' }));
    setFeedbackReplies(prev => ({ ...prev, [diagnosisId]: [...(prev[diagnosisId] || []), { id: Date.now(), body, diagnosisId, type: 'feedback-reply', createdAt: new Date().toISOString() }] }));
    window.toast?.('Question sent to your teacher.', 'ok');
  }

  async function handleMarkUnderstood(diagnosisId) {
    await sendMessage({ fromStudentId: student.id, fromName: student.firstName || student.name || 'Student', fromRole: 'student', toRole: 'teacher', diagnosisId, type: 'feedback-understood', body: 'Student marked this feedback as understood.' });
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
  const highlights = Array.isArray(feedback?.highlights) ? feedback.highlights : (Array.isArray(feedback?.whatYouDidWell) ? feedback.whatYouDidWell : []);
  const rawFocusArea = feedback?.focusArea || (Array.isArray(feedback?.whatToImprove) ? feedback.whatToImprove[0] : null);
  const focusArea = typeof rawFocusArea === 'string' ? { area: rawFocusArea, explanation: rawFocusArea } : rawFocusArea;
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
        <button className="student-hero-action" onClick={() => onTab('homework')}><Icon.homework size={15} /> Practice next</button>
      </section>

      {!feedback ? (
        <div className="student-empty-card">No approved feedback yet. After your teacher reviews your diagnosis, your feedback will appear here.</div>
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
                  {[{ label: 'Your confidence', value: confidenceScore.confidence != null ? `${confidenceScore.confidence + 1}/4` : '—', color: 'var(--accent)' },
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
                    {(() => { const diff = confidenceScore.score / 25 - (confidenceScore.confidence + 1); if (Math.abs(diff) <= 0.5) return 'Your confidence matched your result — great self-assessment!'; if (diff > 0.5) return 'You did better than expected — keep believing in yourself!'; return 'You were more confident than your score — review the feedback and try again.'; })()}
                  </div>
                )}
              </article>
            )}

            {(() => {
              const allFeedbackText = [focusArea?.area, focusArea?.explanation, focusArea?.howToImprove, ...(highlights || []).map(h => `${h.strength} ${h.explanation}`), nextStep].filter(Boolean).join(' ');
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
                {latest.createdAt && <span className="student-muted-pill">{new Date(latest.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
              </div>
              <StudentFeedbackView feedback={feedback} />
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Confidence check</span>
              <h2>Before the next class</h2>
              <div className="student-confidence-list">
                <div className="student-todo-row"><span className="student-todo-check" /><span><strong>I understand my teacher's main feedback</strong><small>Review the full note above</small></span></div>
                <div className="student-todo-row"><span className="student-todo-check" /><span><strong>I can name one thing I did better</strong><small>{firstWin?.strength || 'Use your feedback note'}</small></span></div>
                <div className="student-todo-row"><span className="student-todo-check" /><span><strong>I can practice the next focus</strong><small>{feedback?.nextStep || focusArea?.area || 'Complete the homework task'}</small></span></div>
                <div className="student-todo-row"><span className="student-todo-check" /><span><strong>I can bring one question to class</strong><small>Ask your teacher for help where needed</small></span></div>
              </div>
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Your view</span>
              <h2>Does this feedback match your experience?</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.6 }}>Your answer helps your teacher prepare the next class. There is no wrong response.</p>
              {selfAssessment ? (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon.check size={14} /> <span>You said: <strong>{selfAssessment}</strong> — your teacher will see this.</span></div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Yes, it matches', 'Partly', 'Not sure'].map(option => (
                    <button key={option} type="button" onClick={() => handleSelfAssessment(option, latest?.id)}
                      style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Discuss this feedback</span>
              <h2>Ask your teacher or confirm you understand</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {understood[latest?.id] ? (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon.check size={14} /> Marked as understood</div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkUnderstood(latest?.id)} disabled={!latest?.id}><Icon.check size={12} /> Mark as understood</Button>
                )}
                <div>
                  {(feedbackReplies[latest?.id] || []).length > 0 && (
                    <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(feedbackReplies[latest?.id] || []).map(msg => (
                        <div key={msg.id} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                          <div style={{ color: 'var(--text-2)', marginBottom: 2 }}>{msg.body}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showReply[latest?.id] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea className="input" rows={3} value={replyText[latest?.id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [latest?.id]: e.target.value }))} placeholder="Type your question about this feedback…" />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="primary" size="sm" onClick={() => handleFeedbackReply(latest?.id)} disabled={!replyText[latest?.id]?.trim()}>Send question</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setShowReply(prev => ({ ...prev, [latest?.id]: false })); setReplyText(prev => ({ ...prev, [latest?.id]: '' })); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setShowReply(prev => ({ ...prev, [latest?.id]: true }))}><Icon.feedback size={12} /> Ask a question</Button>
                  )}
                </div>
              </div>
            </article>
          </section>

          {feedbackItems.length > 1 && (
            <section className="student-panel student-feedback-history">
              <div className="student-panel-head">
                <div><span className="student-panel-kicker">History</span><h2>Past feedback</h2></div>
                <span className="student-muted-pill">{feedbackItems.length - 1} older</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbackItems.slice(1).map(item => (
                  <details key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', padding: '10px 12px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Previous feedback'}
                    </summary>
                    <div style={{ marginTop: 12 }}><StudentFeedbackView feedback={item.feedback} /></div>
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
