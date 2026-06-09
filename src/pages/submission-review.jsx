/**
 * submission-review.jsx — Teacher reviews student submission vs. diagnosis
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import {
  getAllSubmissions, getHomework, getReviews, saveReview, deleteReview,
  getDiagnoses, getErrorBank, promoteErrorToLongTerm, markErrorSolved, saveProgressNote,
  getStudent, getInbox, sendMessage,
} from '../lib/workflow.js';
import { createSignedAudioUrl } from '../lib/supabase-db.js';

export default function SubmissionReview({ submissionId, students, onNavigate }) {
  const [submission, setSubmission] = useState(null);
  const [homework, setHomework] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [student, setStudent] = useState(null);
  const [errors, setErrors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiComparing, setAiComparing] = useState(false);
  const [aiComparison, setAiComparison] = useState(null);
  const [saving, setSaving] = useState(false);
  const [audioUrls, setAudioUrls] = useState({}); // exId → playable URL (signed for Storage paths)
  const [feedbackReplies, setFeedbackReplies] = useState([]);
  const [feedbackUnderstood, setFeedbackUnderstood] = useState(false);
  const [replyToStudent, setReplyToStudent] = useState('');

  useEffect(() => { load(); }, [submissionId]);

  async function load() {
    const allSubs = await getAllSubmissions();
    const sub = allSubs.find(s => s.id === submissionId);
    if (!sub) return;
    setSubmission(sub);

    // Resolve a playable URL for each recorded response: base64 inline plays as-is,
    // a Storage path needs a short-lived signed URL, a stored URL is used directly.
    const urls = {};
    for (const [exId, r] of Object.entries(sub.responses || {})) {
      if (r?.audioB64) urls[exId] = r.audioB64;
      else if (r?.audioUrl) urls[exId] = r.audioUrl;
      else if (r?.audioPath) { const u = await createSignedAudioUrl(r.audioPath); if (u) urls[exId] = u; }
    }
    setAudioUrls(urls);

    const [hw, revs] = await Promise.all([
      getHomework(sub.studentId),
      getReviews(sub.studentId),
    ]);
    const hwItem = (hw || []).find(h => h.id === sub.homeworkId);
    setHomework(hwItem);

    const rev = (revs || []).find(r => r.submissionId === submissionId);
    setExistingReview(rev);
    if (rev) {
      setForm({
        whatImproved: rev.whatImproved || '',
        activeErrors: rev.activeErrors?.join('\n') || '',
        newErrors: rev.newErrors?.join('\n') || '',
        corrections: (rev.corrections || []).map(c => ({ ...c, id: c.id || Math.random().toString(36).slice(2, 9) })),
        overallNote: rev.overallNote || '',
        score: rev.score ?? '',
        redoRequired: rev.redoRequired || false,
        sendFeedback: true,
      });
    }

    if (hwItem?.diagnosisId) {
      const dx = await getDiagnoses(sub.studentId);
      const d = (dx || []).find(d => d.id === hwItem.diagnosisId);
      setDiagnosis(d);
      // Load student feedback replies linked to this diagnosis
      if (d) {
        const inbox = await getInbox({ role: 'teacher' });
        const replies = (inbox || []).filter(
          m => m.diagnosisId === d.id && m.type === 'feedback-reply' && m.fromStudentId === sub.studentId
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setFeedbackReplies(replies);
        setFeedbackUnderstood(!!(inbox || []).find(
          m => m.diagnosisId === d.id && m.type === 'feedback-understood' && m.fromStudentId === sub.studentId
        ));
      }
    }

    const s = await getStudent(sub.studentId) || students.find(x => x.id === sub.studentId);
    setStudent(s);
    const eb = await getErrorBank(sub.studentId);
    setErrors(eb || []);
  }

  async function runAiComparison() {
    if (!submission || !homework || !diagnosis) { window.toast?.('Need submission, homework, and diagnosis to compare.', 'warn'); return; }
    setAiComparing(true);
    const submissionEvidence = buildSubmissionEvidence(submission, homework);
    const prompt = `You are reviewing a student's homework submission against the original diagnosis.

DIAGNOSIS PRIORITIES:
${JSON.stringify(diagnosis.sections?.priorityDiagnosis?.content || [], null, 2)}

HOMEWORK OBJECTIVE: ${homework.objective || homework.title}

STUDENT SUBMISSION:
${submission.content || '(no text content)'}

SUBMISSION EVIDENCE FROM STRUCTURED RESPONSES:
${submissionEvidence.promptText}

Compare the structured response evidence to the diagnosis. For speaking tasks, evaluate
what the student actually said in the transcript. Use submission.content only as a
fallback summary when no structured response transcript is available.

Write "teacherFeedback" as a warm, specific note spoken directly to ${student?.name || 'the student'}:
reference what they ACTUALLY wrote or said, name one concrete strength and the
single most important fix, and end with a clear next step.

Extract up to 5 key errors and suggest corrections.

Return JSON:
{
  "didStudentImprove": "brief assessment",
  "activeErrors": ["errors still present"],
  "newErrors": ["new errors not in the diagnosis"],
  "redoRequired": false,
  "continuationFocus": "what to focus on next class",
  "teacherFeedback": "feedback paragraph to send to student",
  "corrections": [
    { "original": "error text", "improved": "corrected text", "note": "brief explanation" }
  ]
}`;

    try {
      // Warmer temperature → more human teacher voice in the feedback.
      const data = await callAI(prompt, { max_tokens: 2500, temperature: 0.7 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      setAiComparison(parsed);
      
      if (parsed) {
        setForm(f => {
          // Merge corrections: If an AI correction matches an existing 'original' text, update it. Otherwise, add it.
          const newAiCorrections = (parsed.corrections || []).map(ac => ({
            ...ac,
            id: ac.id || Math.random().toString(36).slice(2, 9)
          }));

          const mergedCorrections = [...f.corrections];
          newAiCorrections.forEach(ac => {
            const existingIdx = mergedCorrections.findIndex(c => 
              c.original?.trim().toLowerCase() === ac.original?.trim().toLowerCase()
            );
            if (existingIdx >= 0) {
              mergedCorrections[existingIdx] = { ...mergedCorrections[existingIdx], ...ac };
            } else {
              mergedCorrections.push(ac);
            }
          });

          return {
            ...f,
            whatImproved: parsed.didStudentImprove || f.whatImproved,
            activeErrors: (parsed.activeErrors || []).join('\n'),
            newErrors: (parsed.newErrors || []).join('\n'),
            overallNote: parsed.teacherFeedback || f.overallNote,
            redoRequired: parsed.redoRequired ?? f.redoRequired,
            corrections: mergedCorrections,
          };
        });
      }
    } catch (e) {
      window.toast?.(`AI comparison failed: ${e.message}`, 'warn');
    }
    setAiComparing(false);
  }

  async function handleSave() {
    setSaving(true);
    const rev = await saveReview({
      id: existingReview?.id,
      submissionId,
      homeworkId: homework?.id,
      diagnosisId: diagnosis?.id,
      studentId: submission?.studentId,
      whatImproved: form.whatImproved,
      activeErrors: form.activeErrors.split('\n').filter(Boolean),
      newErrors: form.newErrors.split('\n').filter(Boolean),
      corrections: form.corrections.filter(c => c.original || c.improved),
      overallNote: form.overallNote,
      score: form.score !== '' ? Number(form.score) : null,
      redoRequired: form.redoRequired,
      feedbackSentToStudent: form.sendFeedback,
    });

    // Save progress note
    if (form.whatImproved) {
      await saveProgressNote({ studentId: submission?.studentId, sourceType: 'review', sourceId: rev.id, note: form.whatImproved });
    }

    if (form.sendFeedback && submission?.studentId) {
      await sendMessage({
        fromRole: 'teacher',
        fromName: 'Teacher',
        toRole: 'student',
        toStudentId: submission.studentId,
        type: 'homework-review',
        homeworkId: homework?.id,
        reviewId: rev.id,
        body: `Your homework review is ready: ${homework?.title || 'Homework'}.\n\n${form.overallNote || form.whatImproved || 'Open Homework to read your teacher review.'}`,
      });
    }

    setSaving(false);
    window.toast?.(form.sendFeedback ? 'Review saved and student notified.' : 'Review saved.', 'ok');
    setExistingReview(rev);
  }

  if (!submission) return <div style={{ padding: 40, color: 'var(--muted)' }}>Submission not found.</div>;

  const activeErrorBank = errors.filter(e => e.status === 'active');

  // Speaking recordings live in submission.responses keyed by exercise id.
  // Map each one to its prompt from the homework activities for a readable label.
  const activityById = Object.fromEntries(
    (homework?.activities || []).map(a => [a.id, a])
  );
  const submissionEvidence = buildSubmissionEvidence(submission, homework);
  const audioResponses = Object.entries(submission.responses || {})
    .filter(([exId, res]) => res && (audioUrls[exId] || res.audioB64))
    .map(([exId, res], i) => {
      const ex = activityById[exId];
      const label = ex?.prompt || ex?.question || ex?.title || `Speaking response ${i + 1}`;
      return { exId, res, label, url: audioUrls[exId] || res.audioB64 };
    });

  function addErrorToCorrections(err) {
    setForm(f => ({
      ...f,
      corrections: [
        ...f.corrections, 
        { id: Math.random().toString(36).slice(2, 9), original: err.error, improved: err.correct, note: 'Error Bank suggestion' }
      ],
    }));
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>
      <button onClick={() => onNavigate('submissions')} style={backStyle}><Icon.arrowL size={13} /> Back to submissions</button>
      <h1 style={S.headline}>Submission Review</h1>
      {student && <p style={S.sub}>{student.name} · {homework?.title}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
        {/* Left: submission + diagnosis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Student submission */}
          <Card style={{ padding: 18 }}>
            <SectionHeader title="Student Submission" icon={<Icon.doc size={15} />} />
            <div style={{ marginTop: 10, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.7, minHeight: 100, whiteSpace: 'pre-wrap' }}>
              {submission.content || <em style={{ color: 'var(--muted)' }}>No text content submitted.</em>}
            </div>

            {submissionEvidence.entries.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-deep)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  <Icon.check size={13} /> Teacher review evidence
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {submissionEvidence.entries.map((entry) => (
                    <div key={entry.id} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)', marginBottom: 5 }}>
                        {entry.title}
                      </div>
                      {entry.prompt && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>
                          Prompt: {entry.prompt}
                        </div>
                      )}
                      {entry.transcript ? (
                        <div style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                          <strong style={{ color: 'var(--accent-deep)' }}>Transcript used for review: </strong>{entry.transcript}
                        </div>
                      ) : entry.answer ? (
                        <div style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                          {entry.answer}
                        </div>
                      ) : (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                          Audio submitted. Add a transcript when available so AI can review the exact words.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speaking recordings — one audio player per recorded response */}
            {audioResponses.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {audioResponses.map(({ exId, res, label, url }) => (
                  <div key={exId}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                      <Icon.mic size={13} /> {label}
                    </div>
                    <audio controls src={url} style={{ width: '100%', height: 38 }} />
                    {res.transcript && (
                      <div style={{ marginTop: 6, padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                        <strong style={{ color: 'var(--accent-deep)', fontStyle: 'normal' }}>Transcript used for review: </strong>{res.transcript}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 8 }}>
              Submitted: {new Date(submission.submittedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </Card>

          {/* Original homework */}
          {homework && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Homework Instructions" />
              <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                <strong>Objective:</strong> {homework.objective || '—'}
                <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{homework.description}</div>
              </div>
            </Card>
          )}

          {/* Diagnosis priorities (content is sometimes an object, not an array — guard before .map) */}
          {Array.isArray(diagnosis?.sections?.priorityDiagnosis?.content) && diagnosis.sections.priorityDiagnosis.content.length > 0 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Original Diagnosis Priorities" icon={<Icon.diagnose size={15} />} />
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {diagnosis.sections.priorityDiagnosis.content.map((p, i) => (
                  <div key={i} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>#{p.rank} {p.area}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2 }}>{p.whatToImprove}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active errors in error bank */}
          {activeErrorBank.length > 0 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Active Error Bank" icon={<Icon.warning size={15} />} />
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeErrorBank.slice(0, 5).map(err => (
                  <div key={err.id} style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    onClick={() => addErrorToCorrections(err)}
                    title="Click to add to corrections"
                  >
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{err.error}</span>
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <span style={{ color: 'var(--success)' }}>{err.correct}</span>
                    <Button variant="ghost" size="sm" style={{ marginLeft: 'auto', fontSize: 10 }} onClick={async (e) => { e.stopPropagation(); await markErrorSolved(submission.studentId, err.id); load(); }}>
                      Solved
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: review form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* AI comparison */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SectionHeader title="AI Comparison" style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={runAiComparison} disabled={aiComparing}>
                <Icon.spark size={13} /> {aiComparing ? 'Analyzing…' : 'Compare with AI'}
              </Button>
            </div>
            {aiComparison && (
              <div style={{ marginTop: 10, padding: 12, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                <strong>AI Assessment:</strong> {aiComparison.didStudentImprove}
                {aiComparison.correctedErrors?.length > 0 && (
                  <div style={{ marginTop: 6, color: 'var(--success)' }}>✓ Corrected: {aiComparison.correctedErrors.join(', ')}</div>
                )}
              </div>
            )}
          </Card>

          {/* Review form */}
          <Card style={{ padding: 18 }}>
            <SectionHeader title="Teacher Review" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <Field label="What improved">
                <textarea className="input" rows={3} value={form.whatImproved} onChange={e => setForm(f => ({ ...f, whatImproved: e.target.value }))} placeholder="Evidence of improvement…" />
              </Field>
              <Field label="Errors still active (one per line)">
                <textarea className="input" rows={3} value={form.activeErrors} onChange={e => setForm(f => ({ ...f, activeErrors: e.target.value }))} placeholder="error still present&#10;another recurring issue" />
              </Field>
              <Field label="New errors observed (one per line)">
                <textarea className="input" rows={2} value={form.newErrors} onChange={e => setForm(f => ({ ...f, newErrors: e.target.value }))} placeholder="new issue observed" />
              </Field>
              <Field label="Overall feedback to student">
                <textarea className="input" rows={4} value={form.overallNote} onChange={e => setForm(f => ({ ...f, overallNote: e.target.value }))} placeholder="Feedback the student will see…" />
              </Field>

              {/* Interactive Corrections UI */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={fieldLabel}>Corrections</label>
                  <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, corrections: [...f.corrections, { id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }] }))}>
                    <Icon.plus size={12} /> Add
                  </Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.corrections.map((c, i) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                      <input className="input" placeholder="Original" value={c.original} onChange={e => {
                        const next = form.corrections.map((corr, idx) => idx === i ? { ...corr, original: e.target.value } : corr);
                        setForm(f => ({ ...f, corrections: next }));
                      }} />
                      <input className="input" placeholder="Improved" value={c.improved} onChange={e => {
                        const next = form.corrections.map((corr, idx) => idx === i ? { ...corr, improved: e.target.value } : corr);
                        setForm(f => ({ ...f, corrections: next }));
                      }} />
                      <Button variant="ghost" size="sm" onClick={() => {
                        const next = form.corrections.filter((_, idx) => idx !== i);
                        setForm(f => ({ ...f, corrections: next.length ? next : [{ id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }] }));
                      }}>
                        <Icon.trash size={12} />
                      </Button>
                      <input className="input" placeholder="Note" value={c.note} onChange={e => {
                        const next = form.corrections.map((corr, idx) => idx === i ? { ...corr, note: e.target.value } : corr);
                        setForm(f => ({ ...f, corrections: next }));
                      }} style={{ gridColumn: 'span 3' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Field label="Teacher-only score (optional)">
                  <input className="input" type="number" min={0} max={10} step={0.5} value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
                </Field>
                <Field label="Redo required?">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.redoRequired} onChange={e => setForm(f => ({ ...f, redoRequired: e.target.checked }))} />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Ask student to redo</span>
                  </label>
                </Field>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.sendFeedback} onChange={e => setForm(f => ({ ...f, sendFeedback: e.target.checked }))} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Send feedback to student</span>
              </label>
            </div>
          </Card>

          {/* Student feedback replies */}
          {(feedbackReplies.length > 0 || feedbackUnderstood) && (
            <Card style={{ padding: 18, borderLeft: '3px solid var(--accent)' }}>
              <SectionHeader title={feedbackUnderstood ? 'Student feedback status' : 'Student replies'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {feedbackUnderstood && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(46,106,63,.08)', border: '1px solid var(--success)',
                    fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>✓</span> Student marked this feedback as understood.
                  </div>
                )}
                {feedbackReplies.map(msg => (
                  <div key={msg.id} style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)',
                    fontSize: 'var(--text-sm)', lineHeight: 1.5,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-deep)' }}>{msg.fromName || 'Student'}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                        {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-2)' }}>{msg.body}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input className="input" style={{ flex: 1 }} value={replyToStudent}
                  onChange={e => setReplyToStudent(e.target.value)}
                  placeholder="Reply to student…" />
                <Button variant="primary" size="sm" disabled={!replyToStudent.trim()}
                  onClick={async () => {
                    const body = replyToStudent.trim();
                    if (!body || !submission || !diagnosis) return;
                    await sendMessage({
                      fromRole: 'teacher', toStudentId: submission.studentId,
                      diagnosisId: diagnosis.id, type: 'feedback-reply',
                      body, toRole: 'student',
                    });
                    setReplyToStudent('');
                    window.toast?.('Reply sent to student.', 'ok');
                  }}>
                  Send
                </Button>
              </div>
            </Card>
          )}

          <Button variant="primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Saving…' : 'Save Review' + (form.sendFeedback ? ' & Send Feedback' : '')}
          </Button>
          {existingReview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Pill tone="success">✓ Review saved</Pill>
              <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={async () => { if (confirm('Delete this teacher review?')) { await deleteReview(existingReview.id); window.toast?.('Review deleted.', 'info'); onNavigate('submissions'); } }}>
                <Icon.trash size={12} /> Delete review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

function buildSubmissionEvidence(submission, homework) {
  const activityById = Object.fromEntries((homework?.activities || []).map(a => [a.id, a]));
  const entries = Object.entries(submission?.responses || {})
    .map(([exId, res], index) => {
      const ex = activityById[exId] || {};
      const transcript = cleanText(res?.transcript);
      const answer = cleanText(
        res?.text ?? res?.answer ?? res?.value ?? res?.response ?? res?.shortAnswer
      );
      const prompt = cleanText(ex.prompt || ex.question || ex.instruction || ex.audioText || ex.title);
      const type = ex.type || (res?.audioB64 || res?.audioPath || res?.audioUrl || transcript ? 'speak' : 'response');
      const hasAudio = Boolean(res?.audioB64 || res?.audioPath || res?.audioUrl);

      if (!transcript && !answer && !hasAudio) return null;

      return {
        id: exId,
        type,
        title: `${type === 'speak' ? 'Speaking' : 'Response'} ${index + 1}`,
        prompt,
        transcript,
        answer,
        hasAudio,
      };
    })
    .filter(Boolean);

  const promptText = entries.length
    ? entries.map((entry, index) => {
      const lines = [
        `Response ${index + 1} (${entry.type})`,
        entry.prompt ? `Prompt: ${entry.prompt}` : null,
        entry.transcript ? `Transcript: ${entry.transcript}` : null,
        entry.answer ? `Written response: ${entry.answer}` : null,
        !entry.transcript && entry.hasAudio ? 'Audio submitted but no transcript is available.' : null,
      ].filter(Boolean);
      return lines.join('\n');
    }).join('\n\n')
    : '(no structured response evidence available)';

  return { entries, promptText };
}

function cleanText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join('\n');
  if (typeof value === 'object') return cleanText(JSON.stringify(value));
  return String(value).trim();
}

const EMPTY_FORM = { whatImproved: '', activeErrors: '', newErrors: '', corrections: [{ id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }], overallNote: '', score: '', redoRequired: false, sendFeedback: true };
const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const fieldLabel = { fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const S = { headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' }, sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)' } };
