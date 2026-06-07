/**
 * tool-homework.jsx — Assign homework from diagnosis + review student submissions
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, PillNav, Avatar } from '../components/shared.jsx';
import { getHomework, saveHomework, deleteHomework, getSubmissions, getDiagnoses, getReviews, saveReview, updateDiagnosisCycleStage, getStudentCycleState } from '../lib/workflow.js';
import { isStructuredExercise, autoGrade, exercisePreview } from '../lib/exercise-types.js';
import { ExTypeBadge } from '../components/exercise-editor.jsx';
import { ExercisePlayer } from '../components/exercise-player.jsx';
import { createSignedAudioUrl } from '../lib/supabase-db.js';

/** Plays a recorded speaking response — base64 inline, a stored URL, or a signed Storage path. */
function SpeakResponseAudio({ response }) {
  const [url, setUrl] = useState(response?.audioB64 || response?.audioUrl || null);
  useEffect(() => {
    if (response?.audioB64) { setUrl(response.audioB64); return; }
    if (response?.audioUrl) { setUrl(response.audioUrl); return; }
    if (response?.audioPath) { createSignedAudioUrl(response.audioPath).then(u => { if (u) setUrl(u); }); }
  }, [response?.audioB64, response?.audioUrl, response?.audioPath]);
  if (!url) return null;
  return <audio controls src={url} style={{ width: '100%', height: 36, marginTop: 6 }} />;
}

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
              const hasStructured = sub.responses && hwItem?.activities?.some(a => isStructuredExercise(a));
              const structuredExercises = hasStructured ? (hwItem?.activities || []).filter(a => isStructuredExercise(a)) : [];

              return (
                <Card key={sub.id} style={{ marginBottom: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{hwItem?.title || 'Homework submission'}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                        <span>Submitted {new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        {hasStructured && <span>· {structuredExercises.length} exercises</span>}
                      </div>
                    </div>
                    <Pill tone="warning">Needs review</Pill>
                  </div>

                  {/* Structured exercises — per-exercise review */}
                  {hasStructured ? (
                    <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 10, marginBottom: 10 }}>
                      {structuredExercises.map((ex, i) => {
                        const res = sub.responses?.[ex.id] || {};
                        const grade = autoGrade(ex, res);
                        return (
                          <div key={ex.id} style={{ marginBottom: 12, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>{i + 1}.</span>
                              <ExTypeBadge typeId={ex.type} />
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {exercisePreview(ex)}
                              </span>
                              {grade && (
                                <Pill tone={grade.correct ? 'success' : 'warning'}>
                                  {grade.correct ? '✓ Correct' : grade.feedback}
                                </Pill>
                              )}
                            </div>
                            <StructuredResponsePreview exercise={ex} response={res} />
                          </div>
                        );
                      })}
                    </div>
                  ) : sub.content ? (
                    <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-2)', lineHeight: 1.6, borderTop: '1px solid var(--divider)', paddingTop: 10, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                      {sub.content}
                    </div>
                  ) : null}

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
                        <Pill tone="success">Reviewed</Pill>
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
            {(() => {
              const hwItem = hw.find(h => h.id === reviewingSubmission.homeworkId);
              const hasStructured = reviewingSubmission.responses && hwItem?.activities?.some(a => isStructuredExercise(a));
              const structuredExercises = hasStructured ? (hwItem?.activities || []).filter(a => isStructuredExercise(a)) : [];

              if (hasStructured) {
                return (
                  <div style={{ marginBottom: 16 }}>
                    {structuredExercises.map((ex, i) => {
                      const res = reviewingSubmission.responses?.[ex.id] || {};
                      const grade = autoGrade(ex, res);
                      return (
                        <div key={ex.id} style={{ padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>{i + 1}.</span>
                            <ExTypeBadge typeId={ex.type} />
                            {grade && (
                              <Pill tone={grade.correct ? 'success' : 'warning'}>
                                {grade.correct ? '✓' : `${Math.round(grade.score * 100)}%`}
                              </Pill>
                            )}
                          </div>
                          <StructuredResponsePreview exercise={ex} response={res} />
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div style={{ padding: 12, background: "var(--bg)", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: "var(--text-sm)", lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {reviewingSubmission.content || 'No text content.'}
                </div>
              );
            })()}

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
                <label style={smallLabel}>Teacher-only level note</label>
                <input className="input" type="number" min="0" max="4" step="0.25" value={reviewForm.score} onChange={e => setReviewForm(f => ({ ...f, score: e.target.value }))} style={{ width: 80 }} />
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

/* ─── STRUCTURED RESPONSE PREVIEW (for teacher review) ──── */
function StructuredResponsePreview({ exercise, response }) {
  if (!exercise || !response) return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>No response</span>;
  const rs = { fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.6 };

  switch (exercise.type) {
    case 'mcq': {
      const selected = response.selected;
      const opt = exercise.options?.[selected];
      const isCorrect = selected === exercise.correct;
      return (
        <div style={rs}>
          <strong>Q:</strong> {exercise.question}<br />
          <strong>Answer:</strong>{' '}
          <span style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {opt != null ? `${String.fromCharCode(65 + selected)}. ${opt}` : 'No answer'}
          </span>
          {!isCorrect && exercise.correct != null && (
            <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
              (correct: {String.fromCharCode(65 + exercise.correct)})
            </span>
          )}
        </div>
      );
    }
    case 'blank':
      return (
        <div style={rs}>
          <strong>Template:</strong> {exercise.template}<br />
          <strong>Answers:</strong> {(response.blanks || []).map((b, i) => {
            const accepted = (exercise.blanks?.[i] || '').split('|').map(a => a.trim().toLowerCase());
            const isRight = accepted.includes((b || '').trim().toLowerCase());
            return (
              <span key={i} style={{ color: isRight ? 'var(--success)' : 'var(--danger)', fontWeight: 600, marginRight: 8 }}>
                [{b || '—'}]
              </span>
            );
          })}
        </div>
      );
    case 'short':
      return (
        <div style={rs}>
          <strong>Prompt:</strong> {exercise.prompt}<br />
          <div style={{ marginTop: 6, padding: 8, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
            {response.text || 'No text submitted.'}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            {(response.text || '').split(/\s+/).filter(Boolean).length} words (target: {exercise.targetWords || 120})
          </span>
        </div>
      );
    case 'speak':
      return (
        <div style={rs}>
          <strong>Prompt:</strong> {exercise.prompt} ({exercise.targetSeconds}s target)<br />
          <SpeakResponseAudio response={response} />
          {response.transcript && (
            <div style={{ marginTop: 6, padding: 8, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontStyle: 'italic' }}>
              {response.transcript}
            </div>
          )}
          {!response.audioB64 && !response.audioPath && !response.transcript && <span style={{ color: 'var(--faint)' }}>No audio or transcript</span>}
        </div>
      );
    case 'order': {
      const order = response.order || [];
      const sentences = exercise.sentences || [];
      return (
        <div style={rs}>
          <strong>Student order:</strong>
          <ol style={{ paddingLeft: 18, margin: '4px 0 0' }}>
            {order.map((idx, i) => {
              const isRight = idx === i;
              return (
                <li key={i} style={{ color: isRight ? 'var(--success)' : 'var(--danger)', fontWeight: isRight ? 400 : 600 }}>
                  {sentences[idx] || `[${idx}]`}
                </li>
              );
            })}
          </ol>
        </div>
      );
    }
    case 'fix': {
      const original = exercise.errorText || '';
      const student = response.text || '';
      const target = exercise.correctedText || '';
      const isFixed = student.trim().toLowerCase().replace(/\s+/g, ' ') === target.trim().toLowerCase().replace(/\s+/g, ' ');
      return (
        <div style={rs}>
          <strong>Original (with errors):</strong>
          <div style={{ padding: 6, background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', margin: '4px 0', textDecoration: 'line-through', color: 'var(--danger)' }}>
            {original}
          </div>
          <strong>Student correction:</strong>
          <div style={{ padding: 6, background: isFixed ? 'var(--success-bg)' : 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', margin: '4px 0' }}>
            {student || 'No correction submitted.'}
          </div>
          {!isFixed && target && (
            <>
              <strong>Expected:</strong>
              <div style={{ padding: 6, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', margin: '4px 0', color: 'var(--success)' }}>
                {target}
              </div>
            </>
          )}
        </div>
      );
    }
    case 'flash':
      return (
        <div style={rs}>
          <strong>Flashcards:</strong> {response.learned || 0} of {(exercise.pairs || []).length} marked as learned
        </div>
      );
    default:
      return <div style={rs}>{JSON.stringify(response)}</div>;
  }
}
