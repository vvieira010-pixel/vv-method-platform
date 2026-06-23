/**
 * submission-review.jsx — Teacher reviews student submission vs. diagnosis
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import { withSkills } from '../education-skills/active-skills.js';
import {
  getAllSubmissions, getHomework, getReviews, saveReview, deleteReview,
  getDiagnoses, getErrorBank, promoteErrorToLongTerm, markErrorSolved, saveProgressNote,
  incrementErrorAppearance, getStudent, getInbox, sendMessage,
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
  const [audioUrls, setAudioUrls] = useState({});
  const [feedbackReplies, setFeedbackReplies] = useState([]);
  const [feedbackUnderstood, setFeedbackUnderstood] = useState(false);
  const [replyToStudent, setReplyToStudent] = useState('');
  const [questionEvals, setQuestionEvals] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { load(); }, [submissionId]);

  async function load() {
    const allSubs = await getAllSubmissions();
    const sub = allSubs.find(s => s.id === submissionId);
    if (!sub) return;
    setSubmission(sub);

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
      if (rev.questionEvals) setQuestionEvals(rev.questionEvals);
    }

    if (hwItem?.diagnosisId) {
      const dx = await getDiagnoses(sub.studentId);
      const d = (dx || []).find(d => d.id === hwItem.diagnosisId);
      setDiagnosis(d);
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
      const data = await callAI(prompt, withSkills('feedback', { max_tokens: 2500, temperature: 0.7 }));
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      setAiComparison(parsed);

      if (parsed) {
        setForm(f => {
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

  async function evaluateQuestion(exId) {
    const entry = submissionEvidence.entries.find(e => e.id === exId);
    if (!entry) return;
    const activity = activityById[exId] || {};
    const skill = TYPE_SKILL[activity.type] || 'Language';
    const hasAudio = Boolean(audioUrls[exId] || entry.hasAudio);
    const studentResponse = entry.transcript
      ? `Transcript: ${entry.transcript}`
      : entry.answer
      ? `Written response: ${entry.answer}`
      : hasAudio
      ? 'Student submitted audio. No transcript available — evaluate that the task was attempted and note what to listen for.'
      : '(no response recorded)';

    setQuestionEvals(q => ({ ...q, [exId]: { ...(q[exId] || {}), aiRunning: true } }));
    const prompt = `Evaluate this single homework question response.

Skill: ${skill}
Prompt/Question: ${entry.prompt || activity.prompt || activity.question || '(no prompt)'}
Objective: ${activity.objective || homework?.objective || ''}
Student response: ${studentResponse}

Return JSON:
{
  "assessment": "1-2 sentence evaluation of this specific response",
  "corrections": [{ "original": "error text", "improved": "corrected text", "note": "brief explanation" }],
  "questionNote": "short, specific feedback note for the student about this question"
}`;

    try {
      const data = await callAI(prompt, withSkills('feedback', { max_tokens: 900, temperature: 0.65 }));
      const raw = data.content?.map(b => b.text || '').join('') || '';
      setQuestionEvals(q => ({
        ...q,
        [exId]: {
          ...(q[exId] || {}),
          aiRunning: false,
          aiResult: parsed,
          corrections: (parsed?.corrections || []).map(c => ({ ...c, id: Math.random().toString(36).slice(2, 9) })),
        },
      }));
    } catch (e) {
      setQuestionEvals(q => ({ ...q, [exId]: { ...(q[exId] || {}), aiRunning: false } }));
      window.toast?.(`Question evaluation failed: ${e.message}`, 'warn');
    }
  }

  async function doSave() {
    setShowPreview(false);
    setSaving(true);
    const normalizedActiveErrors = form.activeErrors
      .split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
    const previousActiveErrors = (existingReview?.activeErrors || []).map(s => String(s || '').trim().toLowerCase()).filter(Boolean);
    const allCorrections = [
      ...form.corrections.filter(c => c.original || c.improved),
      ...Object.values(questionEvals).flatMap(qe => (qe.corrections || []).filter(c => c.original || c.improved)),
    ];
    const rev = await saveReview({
      id: existingReview?.id,
      submissionId,
      homeworkId: homework?.id,
      diagnosisId: diagnosis?.id,
      studentId: submission?.studentId,
      whatImproved: form.whatImproved,
      activeErrors: form.activeErrors.split('\n').filter(Boolean),
      newErrors: form.newErrors.split('\n').filter(Boolean),
      corrections: allCorrections,
      overallNote: form.overallNote,
      score: form.score !== '' ? Number(form.score) : null,
      redoRequired: form.redoRequired,
      feedbackSentToStudent: form.sendFeedback,
      questionEvals,
    });

    if (form.whatImproved) {
      await saveProgressNote({ studentId: submission?.studentId, sourceType: 'review', sourceId: rev.id, note: form.whatImproved });
    }

    if (submission?.studentId && normalizedActiveErrors.length > 0) {
      for (const err of errors) {
        if (err.status !== 'active') continue;
        const errText = (err.error || '').toLowerCase();
        const isCurrentMatch = normalizedActiveErrors.some(line => line.includes(errText) || errText.includes(line.slice(0, 20)));
        const wasAlreadyCounted = previousActiveErrors.some(line => line.includes(errText) || errText.includes(line.slice(0, 20)));
        if (isCurrentMatch && !wasAlreadyCounted) {
          incrementErrorAppearance(submission.studentId, err.id).catch(() => {});
        }
      }
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

  function handleSave() {
    if (form.sendFeedback) { setShowPreview(true); return; }
    doSave();
  }

  if (!submission) return <div style={{ padding: 'var(--space-10)', color: 'var(--muted)' }}>Submission not found.</div>;

  const activeErrorBank = errors.filter(e => e.status === 'active');
  const activityById = Object.fromEntries((homework?.activities || []).map(a => [a.id, a]));
  const submissionEvidence = buildSubmissionEvidence(submission, homework);

  function addErrorToCorrections(err) {
    setForm(f => ({
      ...f,
      corrections: [
        ...f.corrections,
        { id: Math.random().toString(36).slice(2, 9), original: err.error, improved: err.correct, note: 'Error Bank suggestion' }
      ],
    }));
  }

  function addCorrectionRow() {
    setForm(f => ({ ...f, corrections: [...f.corrections, { id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }] }));
  }

  function updateCorrection(i, field, value) {
    setForm(f => ({ ...f, corrections: f.corrections.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  }

  function removeCorrection(i) {
    setForm(f => {
      const next = f.corrections.filter((_, idx) => idx !== i);
      return { ...f, corrections: next.length ? next : [{ id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }] };
    });
  }

  const formativeRec = getFormativeRecommendation(form.score !== '' ? Number(form.score) : null);

  const previewCorrections = [
    ...form.corrections.filter(c => c.original || c.improved),
    ...Object.values(questionEvals).flatMap(qe => (qe.corrections || []).filter(c => c.original || c.improved)),
  ];
  const previewQuestions = submissionEvidence.entries
    .map(e => ({ entry: e, qe: questionEvals[e.id] || {}, activity: activityById[e.id] || {} }))
    .filter(({ qe }) => qe.note || (qe.corrections || []).some(c => c.original || c.improved));

  return (
    <div>
      {/* ── Preview modal ─────────────────────────────────────── */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.28)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-deep)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Preview — student will see</div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text)' }}>Homework Review: {homework?.title || 'Homework'}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕ Edit</Button>
            </div>

            {form.overallNote && (
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                {form.overallNote}
              </div>
            )}
            {form.whatImproved && (
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(46,106,63,.06)', border: '1px solid var(--success-soft, var(--border))', fontSize: 'var(--text-sm)', color: 'var(--text-2)', marginBottom: 14 }}>
                <strong style={{ color: 'var(--success, var(--accent))' }}>What improved: </strong>{form.whatImproved}
              </div>
            )}

            {previewQuestions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Per-question feedback</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {previewQuestions.map(({ entry, qe, activity }, i) => (
                    <div key={entry.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                        {entry.prompt || activity.prompt || `Question ${i + 1}`}
                      </div>
                      {qe.note && <p style={{ margin: '0 0 6px', fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.5 }}>{qe.note}</p>}
                      {(qe.corrections || []).filter(c => c.original || c.improved).map((c, ci) => (
                        <div key={ci} style={{ fontSize: 'var(--text-xs)', display: 'flex', gap: 6, marginTop: 4, alignItems: 'baseline' }}>
                          <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{c.original}</span>
                          <span style={{ color: 'var(--muted)' }}>→</span>
                          <span style={{ color: 'var(--success, var(--accent))' }}>{c.improved}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewCorrections.length > 0 && previewQuestions.length === 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Corrections</div>
                {previewCorrections.map((c, i) => (
                  <div key={i} style={{ fontSize: 'var(--text-sm)', display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{c.original}</span>
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <span style={{ color: 'var(--success, var(--accent))' }}>{c.improved}</span>
                  </div>
                ))}
              </div>
            )}

            {form.redoRequired && (
              <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)', border: '1px solid var(--warning-soft)', fontSize: 'var(--text-sm)', color: 'var(--warning-text)', fontWeight: 600, marginBottom: 14 }}>
                Redo required — your teacher will ask you to resubmit this homework.
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowPreview(false)}>Edit first</Button>
              <Button variant="primary" disabled={saving} onClick={() => doSave()}>
                {saving ? 'Sending…' : 'Confirm & Send to Student'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky context + action bar ──────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-link" style={{ marginBottom: 0, fontSize: 'var(--text-xs)', fontWeight: 600, flexShrink: 0 }} onClick={() => onNavigate('submissions')}>
            <Icon.arrowL size={13} /> Submissions
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          {student && (
            <>
              <Avatar name={student.name} size={26} />
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)', whiteSpace: 'nowrap' }}>{student.name}</span>
            </>
          )}
          {homework && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {homework.title}
            </span>
          )}
          {!homework && <span style={{ flex: 1 }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {existingReview && <Pill tone="success"><Icon.check size={11} /> Reviewed</Pill>}
            <Button variant="ghost" size="sm" onClick={runAiComparison} disabled={aiComparing || !diagnosis}>
              <Icon.spark size={13} /> {aiComparing ? 'Analyzing…' : 'AI Compare'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : form.sendFeedback ? 'Preview & Notify' : existingReview ? 'Update' : 'Save Review'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────── */}
      <div className="page-shell-lg" style={{ paddingBottom: 'var(--space-12)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

          {/* ── Left: submission + context ───────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Student submission */}
            <Card style={{ padding: 'var(--space-5)' }}>
              <SectionHeader title="Student Submission" right={
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  {new Date(submission.submittedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              } />
              <div style={{ marginTop: 10, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.7, minHeight: 80, whiteSpace: 'pre-wrap' }}>
                {submission.content || <em style={{ color: 'var(--muted)' }}>No text content submitted.</em>}
              </div>

            </Card>

            {/* ── Per-question evaluation ── */}
            {submissionEvidence.entries.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-deep)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon.check size={12} /> Per-question review
                </div>
                {submissionEvidence.entries.map((entry, idx) => {
                  const activity = activityById[entry.id] || {};
                  const skill = TYPE_SKILL[activity.type || entry.type] || 'Response';
                  const qe = questionEvals[entry.id] || {};
                  const audioUrl = audioUrls[entry.id];
                  return (
                    <Card key={entry.id} style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Q{idx + 1}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: 'var(--accent-subtle)', color: 'var(--accent-deep)', letterSpacing: '0.04em' }}>
                          {skill}
                        </span>
                        {activity.objective && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', flex: 1 }}>{activity.objective}</span>
                        )}
                        <Button variant="ghost" size="sm" disabled={qe.aiRunning}
                          onClick={() => evaluateQuestion(entry.id)}
                          style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          <Icon.spark size={12} /> {qe.aiRunning ? 'Evaluating…' : 'AI Evaluate'}
                        </Button>
                      </div>

                      {entry.prompt && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 8, padding: '6px 8px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                          {entry.prompt}
                        </div>
                      )}

                      {/* Student response */}
                      {entry.transcript ? (
                        <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                          <strong style={{ color: 'var(--accent-deep)', display: 'block', fontSize: 'var(--text-xs)', marginBottom: 3 }}>Transcript</strong>
                          {entry.transcript}
                        </div>
                      ) : entry.answer ? (
                        <div style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', whiteSpace: 'pre-wrap', marginBottom: 8 }}>{entry.answer}</div>
                      ) : null}

                      {audioUrl && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                            <Icon.mic size={12} /> Audio
                            {!entry.transcript && <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— no transcript · AI will still evaluate</span>}
                          </div>
                          <audio controls src={audioUrl} style={{ width: '100%', height: 36 }} />
                        </div>
                      )}

                      {!entry.transcript && !entry.answer && !audioUrl && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>No response recorded.</div>
                      )}

                      {/* AI result */}
                      {qe.aiResult && (
                        <div style={{ padding: '10px 12px', background: 'rgba(var(--accent-rgb, 56,111,249), 0.06)', border: '1px solid var(--accent-light)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-deep)', marginBottom: 4 }}>AI assessment</div>
                          <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)' }}>{qe.aiResult.assessment}</p>
                          {qe.aiResult.questionNote && (
                            <p style={{ margin: '6px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-2)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                              Suggested note: {qe.aiResult.questionNote}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Per-question teacher note */}
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Note for this question (optional)…"
                        value={qe.note || ''}
                        style={{ fontSize: 'var(--text-sm)', marginBottom: 6 }}
                        onChange={e => setQuestionEvals(q => ({ ...q, [entry.id]: { ...(q[entry.id] || {}), note: e.target.value } }))}
                      />

                      {/* Per-question corrections */}
                      {((qe.corrections || []).length > 0) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corrections</span>
                          {(qe.corrections || []).map((c, ci) => (
                            <div key={c.id || ci} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <input className="input" value={c.original} placeholder="Original" style={{ flex: 1, fontSize: 'var(--text-xs)' }}
                                onChange={e => setQuestionEvals(q => {
                                  const cs = [...(q[entry.id]?.corrections || [])];
                                  cs[ci] = { ...cs[ci], original: e.target.value };
                                  return { ...q, [entry.id]: { ...(q[entry.id] || {}), corrections: cs } };
                                })} />
                              <span style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', flexShrink: 0 }}>→</span>
                              <input className="input" value={c.improved} placeholder="Correction" style={{ flex: 1, fontSize: 'var(--text-xs)' }}
                                onChange={e => setQuestionEvals(q => {
                                  const cs = [...(q[entry.id]?.corrections || [])];
                                  cs[ci] = { ...cs[ci], improved: e.target.value };
                                  return { ...q, [entry.id]: { ...(q[entry.id] || {}), corrections: cs } };
                                })} />
                              <Button variant="ghost" size="sm" style={{ padding: '2px 6px', flexShrink: 0 }}
                                onClick={() => setQuestionEvals(q => {
                                  const cs = (q[entry.id]?.corrections || []).filter((_, i) => i !== ci);
                                  return { ...q, [entry.id]: { ...(q[entry.id] || {}), corrections: cs } };
                                })}>
                                <Icon.trash size={11} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" style={{ marginTop: 4, fontSize: 11 }}
                        onClick={() => setQuestionEvals(q => {
                          const cs = [...(q[entry.id]?.corrections || []), { id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }];
                          return { ...q, [entry.id]: { ...(q[entry.id] || {}), corrections: cs } };
                        })}>
                        <Icon.plus size={11} /> Add correction
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Homework instructions */}
            {homework && (
              <Card style={{ padding: 'var(--space-5)' }}>
                <SectionHeader title="Homework Instructions" />
                <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                  <strong>Objective:</strong> {homework.objective || '—'}
                  <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{homework.description}</div>
                </div>
              </Card>
            )}

            {/* Diagnosis priorities */}
            {Array.isArray(diagnosis?.sections?.priorityDiagnosis?.content) && diagnosis.sections.priorityDiagnosis.content.length > 0 && (
              <Card style={{ padding: 'var(--space-5)' }}>
                <SectionHeader title="Diagnosis Priorities" right={<Icon.diagnose size={15} color="var(--muted)" />} />
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {diagnosis.sections.priorityDiagnosis.content.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--text-xs)', flexShrink: 0, marginTop: 2 }}>#{p.rank}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{p.area}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 2, lineHeight: 1.5 }}>{p.whatToImprove}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Active error bank */}
            {activeErrorBank.length > 0 && (
              <Card style={{ padding: 'var(--space-5)' }}>
                <SectionHeader title="Active Error Bank" right={<span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Click to add to corrections</span>} />
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeErrorBank.slice(0, 5).map(err => {
                    const appearances = err.submissionAppearances || 0;
                    const isPersistent = appearances >= 3;
                    return (
                      <div key={err.id}
                        style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: isPersistent ? 'var(--warning-bg)' : 'var(--bg)', border: `1px solid ${isPersistent ? 'var(--warning-soft)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                        onClick={() => addErrorToCorrections(err)}
                        title="Click to add to corrections"
                      >
                        <span style={{ color: 'var(--danger)', fontWeight: 600, flex: 1 }}>{err.error}</span>
                        <span style={{ color: 'var(--muted)' }}>→</span>
                        <span style={{ color: 'var(--success)', flex: 1 }}>{err.correct}</span>
                        {isPersistent && (
                          <span style={{ padding: '1px 6px', borderRadius: 'var(--radius-pill)', background: 'var(--warning-soft)', color: 'var(--warning-text)', fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap' }}>
                            ×{appearances} persistent
                          </span>
                        )}
                        <Button variant="ghost" size="sm" style={{ marginLeft: 4, fontSize: 10, padding: '2px 8px' }} onClick={async (e) => { e.stopPropagation(); await markErrorSolved(submission.studentId, err.id); load(); }}>
                          Solved
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* ── Right: review form ───────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* AI comparison result */}
            {aiComparison && (
              <Card style={{ padding: 'var(--space-5)', borderLeft: '3px solid var(--accent)' }}>
                <SectionHeader title="AI Assessment" right={<Icon.spark size={15} color="var(--accent)" />} />
                <p style={{ marginTop: 8, fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', marginBottom: 0 }}>
                  {aiComparison.didStudentImprove}
                </p>
                {aiComparison.correctedErrors?.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600 }}>
                    <Icon.check size={12} /> Corrected: {aiComparison.correctedErrors.join(', ')}
                  </div>
                )}
              </Card>
            )}

            {/* Teacher review form */}
            <Card style={{ padding: 'var(--space-5)' }}>
              <SectionHeader title="Teacher Review" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>

                <Field label="What improved">
                  <textarea className="input" rows={3} value={form.whatImproved}
                    onChange={e => setForm(f => ({ ...f, whatImproved: e.target.value }))}
                    placeholder="Evidence of improvement from this submission…" />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Errors still active">
                    <textarea className="input" rows={4} value={form.activeErrors}
                      onChange={e => setForm(f => ({ ...f, activeErrors: e.target.value }))}
                      placeholder={"one per line"} />
                  </Field>
                  <Field label="New errors observed">
                    <textarea className="input" rows={4} value={form.newErrors}
                      onChange={e => setForm(f => ({ ...f, newErrors: e.target.value }))}
                      placeholder={"one per line"} />
                  </Field>
                </div>

                <Field label="Feedback to student">
                  <textarea className="input" rows={5} value={form.overallNote}
                    onChange={e => setForm(f => ({ ...f, overallNote: e.target.value }))}
                    placeholder="This note will be sent to the student…" />
                </Field>

                {/* Corrections */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="field-label">Corrections</span>
                    <Button variant="ghost" size="sm" onClick={addCorrectionRow}>
                      <Icon.plus size={12} /> Add
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.corrections.map((c, i) => (
                      <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input className="input" placeholder="Original error" value={c.original} style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                            onChange={e => updateCorrection(i, 'original', e.target.value)} />
                          <span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>→</span>
                          <input className="input" placeholder="Correction" value={c.improved} style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                            onChange={e => updateCorrection(i, 'improved', e.target.value)} />
                          <Button variant="ghost" size="sm" style={{ padding: '4px 8px', flexShrink: 0 }} onClick={() => removeCorrection(i)}>
                            <Icon.trash size={12} />
                          </Button>
                        </div>
                        <input className="input" placeholder="Explanation (optional)" value={c.note} style={{ fontSize: 'var(--text-xs)' }}
                          onChange={e => updateCorrection(i, 'note', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score */}
                <Field label="Score (0–10, optional)">
                  <input className="input" type="number" min={0} max={10} step={0.5}
                    value={form.score} placeholder="—"
                    onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
                </Field>

                {/* Toggle: redo required */}
                <ToggleRow
                  checked={form.redoRequired}
                  onChange={v => setForm(f => ({ ...f, redoRequired: v }))}
                  label="Require redo"
                  description="Student will be asked to resubmit this homework"
                  toneActive="warning"
                />

                {/* Toggle: notify student */}
                <ToggleRow
                  checked={form.sendFeedback}
                  onChange={v => setForm(f => ({ ...f, sendFeedback: v }))}
                  label="Notify student"
                  description="Send the feedback note to the student's inbox"
                  toneActive="accent"
                />
              </div>
            </Card>

            {/* Next Teaching Action */}
            {formativeRec && (() => {
              const toneColors = {
                strong: { bg: '#F0FDFA', border: '#6EE7B7', label: '#065F46' },
                partial: { bg: '#FFFBEB', border: '#FDE68A', label: '#92400E' },
                weak:    { bg: '#FEF2F2', border: '#FECACA', label: '#991B1B' },
              };
              const c = toneColors[formativeRec.band];
              return (
                <Card style={{ padding: 'var(--space-5)', borderLeft: `3px solid ${c.border}` }}>
                  <SectionHeader title="Next Teaching Action" right={<Icon.diagnose size={15} color="var(--muted)" />} />
                  <div style={{ marginTop: 10 }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: c.bg, color: c.label, border: `1px solid ${c.border}`, marginBottom: 10 }}>
                      {formativeRec.label}
                    </span>
                    <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-2)', marginBottom: 8 }}>{formativeRec.action}</p>
                    <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {formativeRec.techniques.map((t, i) => (
                        <li key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5 }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })()}

            {/* Student feedback replies */}
            {(feedbackReplies.length > 0 || feedbackUnderstood) && (
              <Card style={{ padding: 'var(--space-5)', borderLeft: '3px solid var(--accent)' }}>
                <SectionHeader title={feedbackUnderstood ? 'Student feedback status' : 'Student replies'} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {feedbackUnderstood && (
                    <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(46,106,63,.08)', border: '1px solid var(--success)', fontSize: 'var(--text-sm)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon.check size={14} /> Student marked this feedback as understood.
                    </div>
                  )}
                  {feedbackReplies.map(msg => (
                    <div key={msg.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-soft)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
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
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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

            {/* Delete review */}
            {existingReview && (
              <div style={{ paddingTop: 4 }}>
                <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={async () => {
                  if (confirm('Delete this teacher review?')) {
                    await deleteReview(existingReview.id);
                    window.toast?.('Review deleted.', 'info');
                    onNavigate('submissions');
                  }
                }}>
                  <Icon.trash size={12} /> Delete review
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({ checked, onChange, label, description, toneActive = 'accent' }) {
  const activeBg   = toneActive === 'warning' ? 'var(--warning-bg)'    : 'var(--accent-subtle)';
  const activeBorder = toneActive === 'warning' ? 'var(--warning-soft)' : 'var(--accent-light)';
  const activeColor  = toneActive === 'warning' ? 'var(--warning-text)' : 'var(--accent-text)';
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      background: checked ? activeBg : 'var(--bg)',
      border: `1.5px solid ${checked ? activeBorder : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer', gap: 16,
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: checked ? activeColor : 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{description}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function getFormativeRecommendation(score) {
  if (score === null || score === undefined || isNaN(score)) return null;
  const pct = score * 10;
  if (pct >= 80) {
    return {
      band: 'strong',
      label: 'Strong mastery (8+/10)',
      action: 'Student is ready to move to the next topic or an extension challenge.',
      techniques: [
        'Introduce a related, slightly harder concept or skill in the next session.',
        'Ask the student to self-explain what they did well — metacognitive reflection consolidates learning.',
        'Schedule a spaced retrieval check in 1 week to confirm long-term retention.',
      ],
    };
  }
  if (pct >= 50) {
    return {
      band: 'partial',
      label: 'Partial mastery (5–7.9/10)',
      action: 'A brief review is recommended before introducing new content.',
      techniques: [
        'Assign 2–3 targeted exercises focusing specifically on the areas that were incorrect.',
        'Show a worked example of a correct response, then ask the student to attempt again.',
        'Go through each error together in the next session — error analysis is high-leverage.',
      ],
    };
  }
  return {
    band: 'weak',
    label: 'Significant gap (below 5/10)',
    action: 'Re-teaching is needed before moving on — this topic needs more foundation work.',
    techniques: [
      'Return to the core concept with a new, simpler worked example.',
      'Break the skill into smaller sub-steps and practise each one before combining.',
      'Increase practice frequency: shorter daily sessions are more effective than one long session.',
    ],
  };
}

function buildSubmissionEvidence(submission, homework) {
  const activityById = Object.fromEntries((homework?.activities || []).map(a => [a.id, a]));
  const entries = Object.entries(submission?.responses || {})
    .map(([exId, res], index) => {
      const ex = activityById[exId] || {};
      const transcript = cleanText(res?.transcript);
      const answer = cleanText(res?.text ?? res?.answer ?? res?.value ?? res?.response ?? res?.shortAnswer);
      const prompt = cleanText(ex.prompt || ex.question || ex.instruction || ex.audioText || ex.title);
      const type = ex.type || (res?.audioB64 || res?.audioPath || res?.audioUrl || transcript ? 'speak' : 'response');
      const hasAudio = Boolean(res?.audioB64 || res?.audioPath || res?.audioUrl);
      if (!transcript && !answer && !hasAudio) return null;
      return { id: exId, type, title: `${type === 'speak' ? 'Speaking' : 'Response'} ${index + 1}`, prompt, transcript, answer, hasAudio };
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

/* ── Constants ───────────────────────────────────────────────────── */

const TYPE_SKILL = {
  speak: 'Speaking', listen: 'Listening', read: 'Reading',
  short: 'Writing', fix: 'Grammar', blank: 'Grammar',
  mcq: 'Reading / Listening', flash: 'Vocabulary', order: 'Grammar',
};

const EMPTY_FORM = {
  whatImproved: '',
  activeErrors: '',
  newErrors: '',
  corrections: [{ id: Math.random().toString(36).slice(2, 9), original: '', improved: '', note: '' }],
  overallNote: '',
  score: '',
  redoRequired: false,
  sendFeedback: true,
};

