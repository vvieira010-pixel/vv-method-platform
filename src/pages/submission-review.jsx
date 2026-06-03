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
  getStudent, sendMessage,
} from '../lib/workflow.js';

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

  useEffect(() => { load(); }, [submissionId]);

  async function load() {
    const allSubs = await getAllSubmissions();
    const sub = allSubs.find(s => s.id === submissionId);
    if (!sub) return;
    setSubmission(sub);

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
        corrections: rev.corrections || [{ original: '', improved: '', note: '' }],
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
    }

    const s = await getStudent(sub.studentId) || students.find(x => x.id === sub.studentId);
    setStudent(s);
    const eb = await getErrorBank(sub.studentId);
    setErrors(eb || []);
  }

  async function runAiComparison() {
    if (!submission || !homework || !diagnosis) { window.toast?.('Need submission, homework, and diagnosis to compare.', 'warn'); return; }
    setAiComparing(true);
    const prompt = `You are reviewing a student's homework submission against the original diagnosis.

DIAGNOSIS PRIORITIES:
${JSON.stringify(diagnosis.sections?.priorityDiagnosis?.content || [], null, 2)}

HOMEWORK OBJECTIVE: ${homework.objective || homework.title}

STUDENT SUBMISSION:
${submission.content || '(no text content)'}

Compare the submission to the diagnosis. Return JSON:
{
  "didStudentImprove": "brief assessment",
  "correctedErrors": ["errors the student fixed"],
  "activeErrors": ["errors still present"],
  "newErrors": ["new errors not in the diagnosis"],
  "redoRequired": false,
  "continuationFocus": "what to focus on next class",
  "teacherFeedback": "feedback paragraph to send to student"
}`;

    try {
      const data = await callAI(prompt, { max_tokens: 2000 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      setAiComparison(parsed);
      setForm(f => ({
        ...f,
        whatImproved: parsed.didStudentImprove || '',
        activeErrors: (parsed.activeErrors || []).join('\n'),
        newErrors: (parsed.newErrors || []).join('\n'),
        overallNote: parsed.teacherFeedback || '',
        redoRequired: parsed.redoRequired || false,
      }));
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

          {/* Diagnosis priorities */}
          {diagnosis?.sections?.priorityDiagnosis?.content && (
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
                  <div key={err.id} style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{err.error}</span>
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <span style={{ color: 'var(--success)' }}>{err.correct}</span>
                    <Button variant="ghost" size="sm" style={{ marginLeft: 'auto', fontSize: 10 }} onClick={async () => { await markErrorSolved(submission.studentId, err.id); load(); }}>Solved</Button>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <Field label="Score (0–10)">
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

const EMPTY_FORM = { whatImproved: '', activeErrors: '', newErrors: '', corrections: [{ original: '', improved: '', note: '' }], overallNote: '', score: '', redoRequired: false, sendFeedback: true };
const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const S = { headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' }, sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)' } };
