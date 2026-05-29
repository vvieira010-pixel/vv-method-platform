/**
 * tool-homework.jsx — Assign homework from diagnosis + review student submissions
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, PillNav, Avatar } from '../components/shared.jsx';
import { getHomework, saveHomework, deleteHomework, getSubmissions, getDiagnoses, getReviews, saveReview, updateDiagnosisCycleStage, getStudentCycleState } from '../lib/workflow.js';

const TYPES = [
  { id: 'grammar',    label: 'Grammar'    },
  { id: 'speaking',   label: 'Speaking'   },
  { id: 'reading',    label: 'Reading'    },
  { id: 'writing',    label: 'Writing'    },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'mixed',      label: 'Mixed'      },
];

const STATUS_TONE = {
  'not-started': 'muted', 'in-progress': 'info', 'submitted': 'warning',
  'corrected': 'success', 'reviewed': 'success', 'completed': 'success',
};

export default function ToolHomework({ student, students = [], onSelectStudent, preloadedDiagnosis, onDiagnosisConsumed }) {
  const [tab, setTab] = useState('assign');
  const [hw, setHw] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'grammar', dueDate: '', exercises: 5 });
  const [saving, setSaving] = useState(false);
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState('');
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({ corrections: [{ original: '', improved: '', note: '' }], overallNote: '', score: '' });

  const load = async () => {
    const [hwData, subData, revData] = await Promise.all([
      getHomework(student?.id),
      getSubmissions(student?.id),
      getReviews(student?.id),
    ]);
    setHw(hwData || []);
    setSubmissions(subData || []);
    setReviews(revData || []);
  };

  useEffect(() => {
    (async () => {
      await load();
      const diags = await getDiagnoses(student?.id);
      setDiagnoses(diags || []);
      setSelectedDiagnosisId(prev => prev && diags?.some(d => d.id === prev) ? prev : (diags?.[0]?.id || ''));
    })();
  }, [student?.id]);

  // Auto-populate from preloaded diagnosis (coming from Diagnose tool)
  useEffect(() => {
    if (preloadedDiagnosis?.content) {
      const c = preloadedDiagnosis.content;
      const d = c.homework_directions || {};
      const directionLines = [
        d.grammar && `Grammar: ${d.grammar}`,
        d.vocabulary && `Vocabulary: ${d.vocabulary}`,
        d.met_speaking && `MET speaking: ${d.met_speaking}`,
        d.writing_or_sentence_building && `Writing: ${d.writing_or_sentence_building}`,
        d.review_or_repetition && `Review: ${d.review_or_repetition}`,
      ].filter(Boolean);
      const description = c.homework
        ? (directionLines.length ? `${c.homework}\n\nDirections:\n${directionLines.join('\n')}` : c.homework)
        : directionLines.join('\n');
      const inferType = () => {
        if (d.met_speaking?.length > 20) return 'speaking';
        if (d.writing_or_sentence_building?.length > 20) return 'writing';
        if (d.vocabulary?.length > 20) return 'vocabulary';
        return 'grammar';
      };
      setForm({
        title: `${student?.firstName || 'Student'} — ${c.priorities?.[0]?.area || 'Homework from diagnosis'}`,
        description,
        type: inferType(),
        dueDate: '',
        exercises: Math.max(5, (c.priorities || []).length * 2 || 5),
      });
      setSelectedDiagnosisId(preloadedDiagnosis.id || '');
      setTab('assign');
      window.toast?.('Homework pre-filled from diagnosis.', 'ok');
      onDiagnosisConsumed?.();
    }
  }, [preloadedDiagnosis]);

  const selectedDiagnosis = diagnoses.find(d => d.id === selectedDiagnosisId) || diagnoses[0] || null;

  const handleAssign = async () => {
    if (!form.title.trim()) return;
    const diagId = selectedDiagnosis?.id || preloadedDiagnosis?.id;
    if (!diagId) {
      window.toast?.('Create a diagnosis first.', 'warn');
      return;
    }
    setSaving(true);
    await saveHomework({
      ...form,
      studentId: student?.id,
      studentName: student?.name,
      diagnosisId: diagId,
      activities: [{
        instruction: form.description || form.title,
        type: form.type,
        exercises: form.exercises,
      }],
    });
    if (diagId) {
      await updateDiagnosisCycleStage(diagId, 'homework-assigned');
    }
    setForm({ title: '', description: '', type: 'grammar', dueDate: '', exercises: 5 });
    await load();
    setSaving(false);
    window.toast?.('Homework assigned!', 'ok');
  };

  const generateFromDiagnosis = () => {
    if (!selectedDiagnosis) return;
    const c = selectedDiagnosis.content || {};
    if (c.homework || c.homework_directions) {
      const d = c.homework_directions || {};
      const directionLines = [
        d.grammar && `Grammar: ${d.grammar}`,
        d.vocabulary && `Vocabulary: ${d.vocabulary}`,
        d.met_speaking && `MET speaking: ${d.met_speaking}`,
        d.writing_or_sentence_building && `Writing: ${d.writing_or_sentence_building}`,
        d.review_or_repetition && `Review: ${d.review_or_repetition}`,
      ].filter(Boolean);
      const description = c.homework
        ? (directionLines.length ? `${c.homework}\n\nDirections:\n${directionLines.join('\n')}` : c.homework)
        : directionLines.join('\n');
      setForm({
        title: `${student?.firstName || 'Student'} — ${selectedDiagnosis.priorityFocus || 'Homework'}`,
        description,
        type: 'grammar',
        dueDate: form.dueDate,
        exercises: 5,
      });
      window.toast?.('Homework loaded from diagnosis.', 'ok');
      return;
    }
    const nextStep = selectedDiagnosis.nextSteps?.[0] || 'MET practice';
    setForm({
      title: `${student?.firstName || 'Student'} — Homework`,
      description: `Focus: ${nextStep}\nPractice the corrections from your last class.`,
      type: 'grammar', dueDate: form.dueDate, exercises: 5,
    });
    window.toast?.('Homework draft created.', 'ok');
  };

  /* ── Review submission ── */
  const handleSaveReview = async () => {
    if (!reviewingSubmission) return;
    const validCorrections = reviewForm.corrections.filter(c => c.original.trim() || c.improved.trim());
    await saveReview({
      submissionId: reviewingSubmission.id,
      homeworkId: reviewingSubmission.homeworkId,
      diagnosisId: selectedDiagnosis?.id || null,
      studentId: student?.id,
      corrections: validCorrections,
      overallNote: reviewForm.overallNote,
      score: reviewForm.score ? Number(reviewForm.score) : null,
    });
    if (selectedDiagnosis?.id) {
      await updateDiagnosisCycleStage(selectedDiagnosis.id, 'reviewed');
    }
    setReviewingSubmission(null);
    setReviewForm({ corrections: [{ original: '', improved: '', note: '' }], overallNote: '', score: '' });
    await load();
    window.toast?.('Review saved!', 'ok');
  };

  const addCorrectionRow = () => {
    setReviewForm(f => ({ ...f, corrections: [...f.corrections, { original: '', improved: '', note: '' }] }));
  };

  const updateCorrection = (i, field, value) => {
    setReviewForm(f => ({
      ...f,
      corrections: f.corrections.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
    }));
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted' && !reviews.some(r => r.submissionId === s.id));
  const reviewedSubmissions = submissions.filter(s => reviews.some(r => r.submissionId === s.id));

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <SectionHeader title="Homework" sub={student?.name ? `for ${student.firstName}` : 'All students'} />

        {/* Student + diagnosis selector */}
        <Card style={{ marginTop: 16, marginBottom: 16, padding: "12px 16px" }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <label style={fieldLabel}>Student
              <select className="input" value={student?.id || ''} onChange={e => onSelectStudent?.(e.target.value)} style={{ marginTop: 4 }}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={fieldLabel}>Diagnosis
              <select className="input" value={selectedDiagnosisId} onChange={e => setSelectedDiagnosisId(e.target.value)} style={{ marginTop: 4 }} disabled={!diagnoses.length}>
                {diagnoses.length === 0 && <option>No diagnoses yet</option>}
                {diagnoses.map(d => <option key={d.id} value={d.id}>{formatDiagnosisLabel(d)}</option>)}
              </select>
            </label>
            <Button variant="ghost" size="sm" onClick={generateFromDiagnosis} disabled={!selectedDiagnosis}>
              Load from diagnosis
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <Button variant={tab === 'assign' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('assign')}>
            Assign
          </Button>
          <Button variant={tab === 'review' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('review')}>
            Review ({pendingSubmissions.length})
          </Button>
          <Button variant={tab === 'history' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('history')}>
            History ({hw.length})
          </Button>
        </div>

        {/* ─── ASSIGN TAB ─── */}
        {tab === 'assign' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>New Homework Set</div>

              <label style={smallLabel}>Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Grammar — Past Perfect Review" style={{ marginBottom: 12 }} />

              <label style={smallLabel}>Description / Instructions</label>
              <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Instructions for the student..." rows={6} style={{ marginBottom: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={smallLabel}>Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={smallLabel}>Due date</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>

              <Button variant="primary" onClick={handleAssign} disabled={saving || !form.title.trim()} style={{ width: "100%" }}>
                {saving ? 'Assigning...' : 'Assign Homework'}
              </Button>
            </Card>

            <div>
              <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: 10, color: 'var(--muted)' }}>
                Recent for {student?.firstName || 'student'}
              </div>
              {hw.length === 0 && <div style={{ color: 'var(--muted)', fontSize: "var(--text-sm)" }}>No homework yet.</div>}
              {hw.slice(0, 6).map(h => (
                <div key={h.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: "var(--radius-sm)", marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{h.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: 'var(--muted)', marginTop: 2 }}>{h.type} · {new Date(h.assignedAt || h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <Pill tone={STATUS_TONE[h.status] || 'muted'}>{h.status}</Pill>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── REVIEW TAB ─── */}
        {tab === 'review' && !reviewingSubmission && (
          <div>
            {pendingSubmissions.length === 0 && (
              <Card><p style={{ color: 'var(--muted)', padding: 16 }}>No submissions waiting for review.</p></Card>
            )}
            {pendingSubmissions.map(sub => {
              const hwItem = hw.find(h => h.id === sub.homeworkId);
              return (
                <Card key={sub.id} style={{ marginBottom: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{hwItem?.title || 'Homework submission'}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: 'var(--muted)' }}>
                        Submitted {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <Pill tone="warning">Needs review</Pill>
                  </div>
                  {sub.content && (
                    <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-2)', lineHeight: 1.6, borderTop: '1px solid var(--divider)', paddingTop: 10, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                      {sub.content}
                    </div>
                  )}
                  <Button variant="primary" size="sm" onClick={() => {
                    setReviewingSubmission(sub);
                    setReviewForm({ corrections: [{ original: '', improved: '', note: '' }], overallNote: '', score: '' });
                  }}>
                    Write Review
                  </Button>
                </Card>
              );
            })}

            {reviewedSubmissions.length > 0 && (
              <>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--muted)", marginTop: 24, marginBottom: 8 }}>Reviewed</div>
                {reviewedSubmissions.map(sub => {
                  const rev = reviews.find(r => r.submissionId === sub.id);
                  return (
                    <Card key={sub.id} style={{ marginBottom: 8, padding: 12, opacity: 0.8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                          {hw.find(h => h.id === sub.homeworkId)?.title || 'Submission'}
                        </span>
                        <Pill tone="success">Reviewed{rev?.score != null ? ` · ${rev.score}/5` : ''}</Pill>
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ─── REVIEW EDITOR ─── */}
        {tab === 'review' && reviewingSubmission && (
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Button variant="ghost" size="sm" onClick={() => setReviewingSubmission(null)}>← Back</Button>
              <span style={{ fontWeight: 700 }}>Review Submission</span>
            </div>

            {/* Student's answer */}
            <div style={{ padding: 12, background: "var(--bg)", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: "var(--text-sm)", lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {reviewingSubmission.content || 'No text content.'}
            </div>

            {/* Corrections */}
            <label style={smallLabel}>Corrections</label>
            {reviewForm.corrections.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <input className="input" placeholder="Original" value={c.original} onChange={e => updateCorrection(i, 'original', e.target.value)} />
                <input className="input" placeholder="Improved" value={c.improved} onChange={e => updateCorrection(i, 'improved', e.target.value)} />
                <input className="input" placeholder="Note" value={c.note} onChange={e => updateCorrection(i, 'note', e.target.value)} />
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addCorrectionRow} style={{ marginBottom: 14 }}>+ Add correction</Button>

            {/* Overall */}
            <label style={smallLabel}>Overall note</label>
            <textarea className="input" value={reviewForm.overallNote} onChange={e => setReviewForm(f => ({ ...f, overallNote: e.target.value }))} rows={3} placeholder="General feedback about this submission..." style={{ marginBottom: 12 }} />

            <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={smallLabel}>Score (0–5)</label>
                <input className="input" type="number" min="0" max="5" step="0.5" value={reviewForm.score} onChange={e => setReviewForm(f => ({ ...f, score: e.target.value }))} style={{ width: 80 }} />
              </div>
              <Button variant="primary" onClick={handleSaveReview}>Save Review</Button>
            </div>
          </Card>
        )}

        {/* ─── HISTORY TAB ─── */}
        {tab === 'history' && (
          <div>
            {hw.length === 0 && <Card><p style={{ color: 'var(--muted)', padding: 16 }}>No homework history.</p></Card>}
            {hw.map(h => (
              <div key={h.id} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: "var(--radius-sm)", marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{h.title}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: 'var(--muted)', marginTop: 2 }}>
                    {h.type} · assigned {new Date(h.assignedAt || h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {h.dueDate && ` · due ${new Date(h.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Pill tone={STATUS_TONE[h.status] || 'muted'}>{h.status}</Pill>
                  <Button variant="ghost" size="sm" onClick={() => deleteHomework(h.id).then(load)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const fieldLabel = { display: 'block', fontSize: "var(--text-xs)", fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const smallLabel = { display: 'block', fontSize: "var(--text-xs)", fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 };

function formatDiagnosisLabel(diagnosis) {
  const date = diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Saved';
  const focus = diagnosis?.priorityFocus || diagnosis?.nextSteps?.[0] || diagnosis?.weaknesses?.[0] || 'MET focus';
  return `${date} — ${String(focus).slice(0, 48)}`;
}
