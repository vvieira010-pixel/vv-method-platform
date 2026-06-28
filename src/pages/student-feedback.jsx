import { useState, useEffect } from 'react';
import { Icon } from '../components/shared.jsx';
import { Button } from '../components/ui/Button.jsx';
import { StudentFeedbackView } from '../components/domain-ui.jsx';
import { getDiagnoses, getSubmissions, getReviews, getInbox, sendMessage } from '../lib/workflow.js';
import { asArray, getRelevantGlossaryTerms, hasVisibleApprovedStudentFeedback } from './student-helpers.jsx';

export default function StudentFeedback({ student, onTab }) {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackReplies, setFeedbackReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [showReply, setShowReply] = useState({});
  const [understood, setUnderstood] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [diagnoses, submissions, reviews, inbox] = await Promise.all([
          getDiagnoses(student.id), getSubmissions(student.id), getReviews(student.id),
          getInbox({ role: 'student', studentId: student.id }),
        ]);
        if (cancelled) return;
        const approved = (diagnoses || [])
          .filter(hasVisibleApprovedStudentFeedback)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .map(dx => ({ id: dx.id, createdAt: dx.createdAt, feedback: dx.sections.studentFeedback.content, snapshot: asArray(dx.content?.section_snapshot) }));
        setFeedbackItems(approved);
        const replies = {}; const und = {};
        (inbox || []).forEach(msg => {
          if (msg.diagnosisId) {
            if (msg.type === 'feedback-reply' && msg.fromStudentId === student.id) { replies[msg.diagnosisId] = replies[msg.diagnosisId] || []; replies[msg.diagnosisId].push(msg); }
            if (msg.type === 'feedback-understood' && msg.fromStudentId === student.id) und[msg.diagnosisId] = true;
          }
        });
        setFeedbackReplies(replies);
        setUnderstood(und);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Failed to load feedback');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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

  if (loading) return (
    <div className="student-feedback-page">
      <section className="student-hero bg-grain fade-up" style={{ '--delay': '0s' }}>
        <div>
          <p className="student-hero-kicker">Feedback</p>
          <h1>Your teacher's latest notes</h1>
        </div>
      </section>
      <div className="skeleton-card" style={{ height: 120 }} />
    </div>
  );

  if (loadError) return (
    <div className="student-feedback-page">
      <section className="student-hero bg-grain fade-up" style={{ '--delay': '0s' }}>
        <div>
          <p className="student-hero-kicker">Feedback</p>
          <h1>Your teacher's latest notes</h1>
        </div>
      </section>
      <div className="student-empty-card">
        <p>Could not load feedback: {loadError}</p>
        <button className="student-wide-action" onClick={() => window.location.reload()} style={{ marginTop: 12 }}>Retry</button>
      </div>
    </div>
  );

  const latest = feedbackItems[0];
  const feedback = latest?.feedback;
  const primarySkill = latest?.snapshot?.find(s => Number(s.score_0_80) > 0) || null;
  const highlights = Array.isArray(feedback?.highlights) ? feedback.highlights : (Array.isArray(feedback?.whatYouDidWell) ? feedback.whatYouDidWell : []);
  const rawFocusArea = feedback?.focusArea || (Array.isArray(feedback?.whatToImprove) ? feedback.whatToImprove[0] : null);
  const focusArea = typeof rawFocusArea === 'string' ? { area: rawFocusArea, explanation: rawFocusArea } : rawFocusArea;
  const firstWin = highlights[0];
  const nextStep = feedback?.nextStep || focusArea?.howToImprove || primarySkill?.next_step || 'Practice one clear next step before your next class.';

  return (
    <div className="student-feedback-page">
      <section className="student-hero bg-grain fade-up" style={{ '--delay': '0s' }}>
        <div>
          <p className="student-hero-kicker">Feedback</p>
          <h1>Your teacher's latest notes</h1>
        </div>
        <button className="student-hero-action" onClick={() => onTab('homework')}><Icon.homework size={15} /> Practice next</button>
      </section>

      {!feedback ? (
        <div className="student-empty-card">No approved feedback yet. After your teacher reviews your diagnosis, your feedback will appear here.</div>
      ) : (
        <>
          <section className="student-feedback-grid" style={{ marginTop: 16 }}>
            <article className="student-panel student-panel--primary">
              <div className="student-panel-head">
                <div>
                  <span className="student-panel-kicker">Your feedback</span>
                  <h2>Teacher-approved notes</h2>
                </div>
                {latest.createdAt && <span className="student-muted-pill">{new Date(latest.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
              </div>
              <StudentFeedbackView feedback={feedback} />
            </article>

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

            <article className="student-panel">
              <span className="student-panel-kicker">Before next class</span>
              <h2>Can you name your focus and one win?</h2>
              <p className="student-readable-copy">
                Your focus: <strong>{focusArea?.area || feedback?.nextStep || primarySkill?.section || 'your next MET skill'}</strong>.
                {' '}One win: <strong>{firstWin?.strength || 'something you did better this class'}</strong>.
              </p>
            </article>

            <article className="student-panel">
              <span className="student-panel-kicker">Discuss this feedback</span>
              <h2>Ask your teacher about these notes</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {!understood[latest?.id] && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkUnderstood(latest?.id)} disabled={!latest?.id}><Icon.check size={12} /> I understand this feedback</Button>
                )}
                {understood[latest?.id] && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon.check size={14} /> Marked as understood</div>
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
            <section className="student-panel student-feedback-history" style={{ marginTop: 16 }}>
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
