/**
 * homework-create.jsx — Interactive homework builder with 7 exercise types.
 * Teacher picks exercise types, fills type-specific fields, previews as student.
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button, Pill } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import { buildHomeworkGeneratorPrompt, buildExerciseListPrompt } from '../lib/prompts.js';
import { getDiagnoses, getStudent, saveHomework, updateClassEventStatus } from '../lib/workflow.js';
import { EX_TYPES, createExercise, exercisePreview, getExType } from '../lib/exercise-types.js';
import { ExerciseEditor, ExerciseTypePicker, ExTypeBadge } from '../components/exercise-editor.jsx';
import { getExerciseModules, getModuleExercises, bankMeta } from '../lib/exercise-bank.js';
import HomeworkSetWizard from '../components/homework-set-wizard.jsx';
import { getUnitsByLevel, getSkillExercises, SUBJECT_OPTIONS } from '../lib/unit-bank.js';

const SKILL_TYPES = ['writing', 'speaking', 'grammar', 'vocabulary', 'reading', 'listening', 'mixed'];

export default function HomeworkCreate({ diagnosisId, studentId, students, onNavigate }) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [expandedEx, setExpandedEx] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showUnitBank, setShowUnitBank] = useState(false);
  const [unitBankExercises, setUnitBankExercises] = useState([]);

  useEffect(() => { load(); }, [diagnosisId, studentId]);

  async function load() {
    const sid = studentId;
    if (sid) {
      const s = await getStudent(sid) || students.find(x => x.id === sid);
      setStudent(s);
    }
    if (diagnosisId) {
      const allDx = await getDiagnoses(sid);
      const dx = allDx.find(d => d.id === diagnosisId);
      setDiagnosis(dx);
      if (dx) populateFromDiagnosis(dx, students.find(x => x.id === sid));
    }
  }

  function populateFromDiagnosis(dx, s) {
    const hwRec = dx.sections?.homeworkRecommendation?.content;
    const priority = dx.sections?.priorityDiagnosis?.content?.[0];
    const title = hwRec?.title || (priority ? `${s?.firstName || 'Student'} — ${priority.area}` : 'Homework from Diagnosis');
    const description = hwRec?.instructions || '';
    const type = hwRec?.expectedSubmissionType?.split('|')[0] || inferSkillType(dx.sections?.priorityDiagnosis?.content);

    // Convert legacy tasks to structured exercises where possible
    const legacyTasks = Array.isArray(hwRec?.tasks) ? hwRec.tasks : [];
    const exercises = legacyTasks.length > 0
      ? legacyTasks.map(t => {
          const text = typeof t === 'string' ? t : t.description || '';
          return { ...createExercise('short'), prompt: text };
        })
      : [];

    setForm({
      title,
      objective: hwRec?.objective || (priority ? priority.whatToImprove : ''),
      description,
      exercises,
      selfCheck: Array.isArray(hwRec?.selfCheck) ? hwRec.selfCheck : [''],
      skillType: type,
      dueDate: '',
      teacherNotes: '',
    });
  }

  function inferSkillType(priorities) {
    const areas = (priorities || []).map(p => (p.area || '').toLowerCase());
    if (areas.some(a => /speak/.test(a))) return 'speaking';
    if (areas.some(a => /writ/.test(a))) return 'writing';
    if (areas.some(a => /vocab/.test(a))) return 'vocabulary';
    return 'grammar';
  }

  /* ── Exercise management ── */
  function addExercise(type) {
    const ex = createExercise(type);
    setForm(f => ({ ...f, exercises: [...f.exercises, ex] }));
    setExpandedEx(ex.id);
    setShowTypePicker(false);
  }

  function updateExercise(id, updated) {
    setForm(f => ({
      ...f,
      exercises: f.exercises.map(e => e.id === id ? updated : e),
    }));
  }

  function removeExercise(id) {
    setForm(f => ({
      ...f,
      exercises: f.exercises.filter(e => e.id !== id),
    }));
    if (expandedEx === id) setExpandedEx(null);
  }

  function moveExercise(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= form.exercises.length) return;
    setForm(f => {
      const next = [...f.exercises];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...f, exercises: next };
    });
  }

  /* ── Self-check management ── */
  function addCheck() { setForm(f => ({ ...f, selfCheck: [...f.selfCheck, ''] })); }
  function updateCheck(i, v) { setForm(f => ({ ...f, selfCheck: f.selfCheck.map((t, idx) => idx === i ? v : t) })); }
  function removeCheck(i) { setForm(f => ({ ...f, selfCheck: f.selfCheck.filter((_, idx) => idx !== i) })); }

  async function parseAiJsonWithRepair(raw, expectedShape) {
    try {
      return parseAiJson(raw);
    } catch {
      // Quick structural salvage before paying for a second AI call.
      const text = String(raw || '').replace(/```json|```/gi, '').trim();
      const arrStart = text.indexOf('[');
      const arrEnd = text.lastIndexOf(']');
      if (arrStart >= 0 && arrEnd > arrStart) {
        try { return JSON.parse(text.slice(arrStart, arrEnd + 1)); } catch {}
      }
      const objStart = text.indexOf('{');
      const objEnd = text.lastIndexOf('}');
      if (objStart >= 0 && objEnd > objStart) {
        try { return JSON.parse(text.slice(objStart, objEnd + 1)); } catch {}
      }

      // One repair pass: ask AI to output strict JSON only.
      const repairPrompt = `You are a JSON repair tool.
Return ONLY valid JSON. No markdown. No explanation.
Expected shape: ${expectedShape}

Original text:
${text.slice(0, 14000)}`;

      const repaired = await callAI(repairPrompt, { max_tokens: 4000, system: 'You repair malformed JSON into strict valid JSON.' });
      const repairedRaw = repaired.content?.map(b => b.text || '').join('') || '';
      return parseAiJson(repairedRaw);
    }
  }

  /* ── AI generation ── */
  async function handleAiGenerate() {
    if (!diagnosis) { window.toast?.('No diagnosis linked — cannot generate.', 'warn'); return; }
    setGenerating(true);
    try {
      const selectedTypes = form.exercises.map(ex => ex.type);

      // If teacher already selected exercise types/cards, generate for those choices first.
      if (selectedTypes.length > 0) {
        const basePrompt = buildExerciseListPrompt({ student, diagnosis, level: selectedLevel, skill: selectedSkill });
        const typeSummary = summarizeTypes(selectedTypes);
        const flashRequired = selectedTypes.includes('flash');
        const typedPrompt = `${basePrompt}

IMPORTANT OVERRIDE:
- The teacher already selected this exact structure: ${typeSummary}.
- Return exactly ${selectedTypes.length} exercises.
- Keep the same order as this selected structure: ${selectedTypes.join(', ')}.
- Prioritize diagnosis priority #1 first, then #2.
- Use the same JSON format as requested above.
${flashRequired ? `- For every "flash" exercise, include a "pairs" array with at least 10 objects: {"term":"...", "def":"..."}.` : ''}`;

        const data = await callAI(typedPrompt, { max_tokens: 4000 });
        const raw = data.content?.map(b => b.text || '').join('') || '';
        const parsed = await parseAiJsonWithRepair(raw, `Array of ${selectedTypes.length} exercise objects using keys like title, type, content, and type-specific fields.`);
        const list = extractAiExerciseList(parsed);
        if (list.length === 0) {
          throw new Error('AI returned no exercises for the selected structure. Try again.');
        }
        const picked = pickExercisesBySelection(list, selectedTypes);
        const generated = picked.map((item, i) => exerciseFromAiOption(item, selectedTypes[i]));
        if (generated.length === 0) {
          throw new Error('AI response could not be converted into exercises. Try again.');
        }

        setForm(f => {
          // Fill the exact cards the teacher already added (same order, same count).
          // Do not append extra cards, and keep each existing card id stable.
          const nextExercises = f.exercises.map((ex, idx) => {
            const gen = generated[idx];
            if (!gen) return ex;
            return { ...gen, id: ex.id, type: ex.type || gen.type };
          });

          return {
            ...f,
            exercises: nextExercises,
            skillType: inferSkillType(diagnosis?.sections?.priorityDiagnosis?.content),
          };
        });
        window.toast?.('AI filled the exercises you selected.', 'ok');
      } else {
        // Legacy fallback when nothing is selected yet.
        const prompt = buildHomeworkGeneratorPrompt({ student, diagnosis });
        const data = await callAI(prompt, { max_tokens: 3000 });
        const raw = data.content?.map(b => b.text || '').join('') || '';
        const parsed = await parseAiJsonWithRepair(raw, 'Object with tasks array for homework generation.');
        const aiTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        const exercises = aiTasks.map(t => {
          const text = typeof t === 'string' ? t : t.description || '';
          return { ...createExercise('short'), prompt: text };
        });

        setForm(f => ({
          ...f,
          title: parsed.title || f.title,
          objective: parsed.objective || f.objective,
          description: parsed.instructions || f.description,
          exercises: exercises.length > 0 ? [...f.exercises, ...exercises] : f.exercises,
          selfCheck: Array.isArray(parsed.selfCheck) ? parsed.selfCheck : f.selfCheck,
          skillType: inferSkillType(diagnosis?.sections?.priorityDiagnosis?.content),
          teacherNotes: parsed.teacherReviewNotes || f.teacherNotes,
        }));
        window.toast?.('AI generated exercises from diagnosis and kept your current list.', 'ok');
      }
    } catch (e) {
      window.toast?.(`AI generation failed: ${e.message}`, 'warn');
    }
    setGenerating(false);
  }

  async function handleGenerateOptions() {
    if (!diagnosis) { window.toast?.('No diagnosis linked — cannot generate exercises.', 'warn'); return; }
    setLoadingOptions(true);
    setExerciseOptions([]);
    try {
      const prompt = buildExerciseListPrompt({ student, diagnosis, level: selectedLevel, skill: selectedSkill });
      const data = await callAI(prompt, { max_tokens: 4000 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = await parseAiJsonWithRepair(raw, 'Array of exercise objects or object with exercises array.');
      const list = extractAiExerciseList(parsed);
      setExerciseOptions(list);
      if (list.length === 0) window.toast?.('No exercises returned. Try again.', 'warn');
    } catch (e) {
      window.toast?.(`Exercise generation failed: ${e.message}`, 'warn');
    }
    setLoadingOptions(false);
  }

  function addAiExerciseToList(ex) {
    const newEx = exerciseFromAiOption(ex);

    setForm(f => ({ ...f, exercises: [...f.exercises, newEx] }));
    setExpandedEx(newEx.id);
    window.toast?.(`"${ex.title || 'Exercise'}" added.`, 'ok');
  }

  function addModuleFromLibrary(mod) {
    const exercises = getModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} exercises from "${mod.title}".`, 'ok');
    setShowLibrary(false);
  }

  /* ── Assign ── */
  async function handleAssign() {
    if (!form.title.trim()) { window.toast?.('Title is required.', 'warn'); return; }
    if (form.exercises.length === 0) { window.toast?.('Add at least one exercise.', 'warn'); return; }
    setSaving(true);
    await saveHomework({
      studentId,
      studentName: student?.name,
      diagnosisId,
      title: form.title,
      objective: form.objective,
      description: form.description,
      activities: form.exercises,
      selfCheck: form.selfCheck.filter(Boolean),
      skillType: form.skillType,
      type: form.skillType,
      dueDate: form.dueDate,
      teacherNotes: form.teacherNotes,
      status: 'not-started',
    });
    if (diagnosis?.classEventId) {
      await updateClassEventStatus(diagnosis.classEventId, { homeworkStatus: 'assigned' });
    }
    setSaving(false);
    window.toast?.('Homework assigned to student!', 'ok');
    onNavigate('homework');
  }

  function addUnitBankExercise(ex) {
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...ex }] }));
    window.toast?.('Exercise added from Unit Bank.', 'ok');
  }

  function handleWizardComplete({ level, skill }) {
    setSelectedLevel(level);
    setSelectedSkill(skill);
    const units = getUnitsByLevel(level);
    setUnitBankExercises(getSkillExercises(units, skill, 12));
    setWizardDone(true);
  }

  if (!wizardDone) {
    return (
      <HomeworkSetWizard
        onComplete={handleWizardComplete}
        onSkip={() => setWizardDone(true)}
      />
    );
  }

  const exerciseCount = form.exercises.length;
  const typeCounts = {};
  form.exercises.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
  const subjectLabel = SUBJECT_OPTIONS.find(s => s.id === selectedSkill)?.label;

  return (
    <div style={{ width: '100%', maxWidth: 'none', margin: 0, padding: '28px 24px' }}>
      <button onClick={() => onNavigate('homework')} style={backStyle}>
        <Icon.arrowL size={13} /> Back
      </button>

      <h1 style={S.headline}>Create Homework</h1>
      {student && (
        <p style={S.sub}>
          {student.name} · from diagnosis{' '}
          {diagnosis ? new Date(diagnosis.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
        </p>
      )}
      {(selectedLevel || subjectLabel) && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          {selectedLevel && <Pill tone="info">{selectedLevel}</Pill>}
          {subjectLabel && <Pill tone="info">{subjectLabel}</Pill>}
          <button
            onClick={() => setWizardDone(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', padding: 0 }}
          >
            Change
          </button>
        </div>
      )}

      {/* Diagnosis summary */}
      {diagnosis?.sections?.priorityDiagnosis?.content?.[0] && (
        <div style={{ marginTop: 16, marginBottom: 20, padding: 14, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-soft)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)', marginBottom: 4 }}>
            Diagnosis Priority:
          </div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            {diagnosis.sections.priorityDiagnosis.content[0].area} — {diagnosis.sections.priorityDiagnosis.content[0].whatToImprove}
          </div>
        </div>
      )}

      {/* Mode tabs + actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant={!preview ? 'primary' : 'ghost'} size="sm" onClick={() => setPreview(false)}>
          <Icon.edit size={12} /> Edit
        </Button>
        <Button variant={preview ? 'primary' : 'ghost'} size="sm" onClick={() => setPreview(true)}>
          <Icon.eye size={12} /> Preview as Student
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowLibrary(true)}>
          <Icon.doc size={12} /> Add from Library
        </Button>
        {diagnosis && (
          <>
            <Button variant="ghost" size="sm" onClick={handleGenerateOptions} disabled={loadingOptions || generating}>
              <Icon.refresh size={12} /> {loadingOptions ? 'Loading…' : 'Generate Exercise Options'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAiGenerate} disabled={generating || loadingOptions} style={{ marginLeft: 'auto' }}>
              <Icon.refresh size={12} /> {generating ? 'Generating…' : 'Generate for Selected Exercises'}
            </Button>
          </>
        )}
      </div>

      {/* ── Exercise Library Picker ── */}
      {showLibrary && (
        <div
          onClick={() => setShowLibrary(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)', maxWidth: 680, width: '100%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{bankMeta.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{bankMeta.moduleCount} modules · {bankMeta.exerciseCount} exercise sets</div>
              </div>
              <button onClick={() => setShowLibrary(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {getExerciseModules().map(mod => (
                <div key={mod.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{mod.title}</span>
                      {mod.levelRange && <Pill tone="muted">{mod.levelRange}</Pill>}
                    </div>
                    {mod.targetVocabulary?.length > 0 && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5 }}>
                        {mod.targetVocabulary.slice(0, 8).join(' · ')}{mod.targetVocabulary.length > 8 ? ' …' : ''}
                      </div>
                    )}
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>{mod.exerciseCount} exercise sets</div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => addModuleFromLibrary(mod)} style={{ flexShrink: 0 }}>
                    <Icon.plus size={12} /> Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI Exercise Options Panel ── */}
      {(loadingOptions || exerciseOptions.length > 0) && (
        <Card style={{ padding: 18, marginBottom: 16, border: '1px solid var(--accent-soft)', background: 'var(--accent-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)' }}>
              AI Exercise Options — click + to add
            </span>
            {exerciseOptions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setExerciseOptions([])} style={{ color: 'var(--muted)' }}>Clear</Button>
            )}
          </div>
          {loadingOptions ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>Generating exercises…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exerciseOptions.map((ex, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{ex.title}</span>
                      <ExTypeBadge typeId={mapAiType(ex.type)} />
                      {ex.duration && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ex.duration}</span>}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {(ex.content || '').slice(0, 220)}{(ex.content || '').length > 220 ? '…' : ''}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => addAiExerciseToList(ex)} style={{ flexShrink: 0 }}>
                    <Icon.plus size={12} /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Unit Bank Panel ── */}
      {unitBankExercises.length > 0 && (
        <Card style={{ padding: 18, marginBottom: 16, border: '1px solid var(--border-strong, var(--border))' }}>
          <button
            onClick={() => setShowUnitBank(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0 }}
          >
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📚 Unit Bank
              {selectedLevel && subjectLabel && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                  — {subjectLabel} exercises from {selectedLevel} units ({unitBankExercises.length})
                </span>
              )}
            </span>
            <span style={{ display: 'inline-flex', transform: showUnitBank ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--muted)' }}>
              <Icon.chevronDown size={14} />
            </span>
          </button>

          {showUnitBank && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unitBankExercises.map((ex, i) => {
                const preview = ex.question || ex.prompt || (ex.pairs ? `${ex.pairs.length} flashcard pairs` : ex.errorText || '');
                return (
                  <div key={ex.id || i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <ExTypeBadge typeId={ex.type} />
                        {ex._sourceLabel && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{ex._sourceLabel}</span>}
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {String(preview).slice(0, 200)}{String(preview).length > 200 ? '…' : ''}
                      </p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => addUnitBankExercise(ex)} style={{ flexShrink: 0 }}>
                      <Icon.plus size={12} /> Add
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {preview ? (
        /* ── PREVIEW MODE ── */
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 4 }}>{form.title || 'Untitled Homework'}</div>
          {form.description && <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>{form.description}</p>}
          {form.dueDate && (
            <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
              Due: {new Date(form.dueDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}

          {/* Exercise preview cards */}
          {form.exercises.map((ex, i) => {
            const meta = getExType(ex.type);
            return (
              <div key={ex.id} style={{ borderTop: i > 0 ? '1px solid var(--divider)' : 'none', paddingTop: i > 0 ? 18 : 0, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent)', width: 24 }}>
                    {i + 1}.
                  </span>
                  <ExTypeBadge typeId={ex.type} />
                </div>
                <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                  <PreviewExercise exercise={ex} />
                </div>
              </div>
            );
          })}

          {form.selfCheck.filter(Boolean).length > 0 && (
            <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Self-check:</div>
              {form.selfCheck.filter(Boolean).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <input type="checkbox" disabled style={{ marginTop: 3 }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{c}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* ── EDIT MODE ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Homework details card */}
          <Card style={{ padding: 18 }}>
            <SectionHeader title="Homework Details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <Field label="Title">
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </Field>
              <Field label="Objective (internal — not shown to student)">
                <input className="input" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="What this homework targets..." />
              </Field>
              <Field label="Instructions for student (optional)">
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional context or instructions before the exercises..." />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Skill focus">
                  <select className="input" value={form.skillType} onChange={e => setForm(f => ({ ...f, skillType: e.target.value }))}>
                    {SKILL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Due date">
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </Field>
              </div>
            </div>
          </Card>

          {/* Exercises card */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text)' }}>
                  Exercises
                  <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--muted)', marginLeft: 8 }}>
                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                  </span>
                </div>
                {/* Type badges summary */}
                {exerciseCount > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <ExTypeBadge key={type} typeId={type} />
                    ))}
                  </div>
                )}
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowTypePicker(!showTypePicker)}>
                <Icon.plus size={12} /> Add Exercise
              </Button>
            </div>

            {/* Type picker */}
            {showTypePicker && (
              <div style={{ marginBottom: 14 }}>
                <ExerciseTypePicker onSelect={addExercise} onClose={() => setShowTypePicker(false)} />
              </div>
            )}

            {/* Exercise list */}
            {form.exercises.length === 0 && !showTypePicker && (
              <div style={{ textAlign: 'center', padding: '28px 16px', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent' }}>
                <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', margin: '0 0 10px' }}>
                  No exercises yet — add your first one
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowTypePicker(true)}>
                  <Icon.plus size={12} /> Choose exercise type
                </Button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.exercises.map((ex, i) => {
                const isExpanded = expandedEx === ex.id;
                return (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    index={i}
                    total={form.exercises.length}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedEx(isExpanded ? null : ex.id)}
                    onChange={(updated) => updateExercise(ex.id, updated)}
                    onRemove={() => removeExercise(ex.id)}
                    onMove={(dir) => moveExercise(i, dir)}
                  />
                );
              })}
            </div>
          </Card>

          {/* Self-check card */}
          <Card style={{ padding: 18 }}>
            <SectionHeader
              title="Self-check Checklist"
              action={
                <Button variant="ghost" size="sm" onClick={addCheck}>
                  <Icon.plus size={12} /> Add item
                </Button>
              }
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {form.selfCheck.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input" value={c}
                    onChange={e => updateCheck(i, e.target.value)}
                    placeholder="e.g. I used past simple correctly"
                    style={{ flex: 1 }}
                  />
                  {form.selfCheck.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeCheck(i)} style={{ color: 'var(--danger)' }}>
                      <Icon.trash size={12} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Teacher notes */}
          <Field label="Teacher notes (not shown to student)">
            <textarea className="input" rows={2} value={form.teacherNotes} onChange={e => setForm(f => ({ ...f, teacherNotes: e.target.value }))} placeholder="Internal notes…" />
          </Field>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Button variant="primary" onClick={handleAssign} disabled={saving}>
          <Icon.send size={13} /> {saving ? 'Assigning…' : 'Approve & Assign to Student'}
        </Button>
        <Button variant="ghost" onClick={() => onNavigate('homework')}>Cancel</Button>
      </div>
    </div>
  );
}

/* ─── EXERCISE CARD (collapsible) ───────────────────────────── */
function ExerciseCard({ exercise, index, total, isExpanded, onToggle, onChange, onRemove, onMove }) {
  const meta = getExType(exercise.type);
  const previewText = exercisePreview(exercise);

  return (
    <div style={{
      border: isExpanded ? '1.5px solid var(--accent-soft)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: isExpanded ? 'var(--accent-subtle)' : 'var(--surface)',
      overflow: 'hidden',
      transition: 'all 0.15s var(--ease)',
    }}>
      {/* Header — always visible */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 'var(--text-sm)', color: 'var(--accent)',
          width: 22, textAlign: 'center', flexShrink: 0,
        }}>
          {index + 1}
        </span>
        <ExTypeBadge typeId={exercise.type} />
        <span style={{
          flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-2)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {previewText}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {/* Move arrows */}
          <button
            onClick={e => { e.stopPropagation(); onMove(-1); }}
            disabled={index === 0}
            style={arrowBtnStyle(index === 0)}
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={e => { e.stopPropagation(); onMove(1); }}
            disabled={index === total - 1}
            style={arrowBtnStyle(index === total - 1)}
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ ...arrowBtnStyle(false), color: 'var(--danger)' }}
            title="Remove exercise"
          >
            <Icon.trash size={12} />
          </button>
          <span style={{ display: 'inline-flex', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--muted)' }}>
            <Icon.chevronDown size={14} />
          </span>
        </div>
      </div>

      {/* Body — expanded */}
      {isExpanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--divider)' }}>
          <div style={{ paddingTop: 14 }}>
            <ExerciseEditor exercise={exercise} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PREVIEW EXERCISE (read-only student view) ─────────────── */
function PreviewExercise({ exercise }) {
  if (!exercise) return null;
  switch (exercise.type) {
    case 'mcq':
      return (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 10 }}>{exercise.question || 'Question…'}</p>
          {(exercise.options || []).map((opt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', marginBottom: 4,
              borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)',
            }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
              <span>{opt || `Option ${String.fromCharCode(65 + i)}`}</span>
            </div>
          ))}
        </div>
      );

    case 'blank':
      return (
        <div>
          <p style={{ fontSize: 'var(--text-md)', lineHeight: 2 }}>
            {(exercise.template || 'Sentence with ___ blanks…').split(/(_{3,})/).map((part, i) =>
              /^_{3,}$/.test(part)
                ? <span key={i} style={{ display: 'inline-block', width: 100, borderBottom: '2px solid var(--primary)', textAlign: 'center', margin: '0 4px', color: 'var(--muted)' }}>______</span>
                : <span key={i}>{part}</span>
            )}
          </p>
        </div>
      );

    case 'short':
      return (
        <div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>{exercise.prompt || 'Prompt…'}</p>
          {exercise.rubric && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>{exercise.rubric}</p>}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--surface)', minHeight: 60, color: 'var(--faint)', fontSize: 'var(--text-sm)' }}>
            Student writes here… (target: {exercise.targetWords || 120} words)
          </div>
        </div>
      );

    case 'speak':
      return (
        <div>
          <div style={{ background: 'var(--surface)', borderLeft: '3px solid var(--accent)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
            <p style={{ fontWeight: 500, margin: 0 }}>{exercise.prompt || 'Speaking prompt…'}</p>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Target: {exercise.targetSeconds || 60} seconds</span>
          </div>
          <Button variant="primary" size="sm" disabled><Icon.mic size={12} /> Start recording</Button>
        </div>
      );

    case 'order':
      return (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>Put the sentences in the correct order:</p>
          {(exercise.sentences || []).filter(Boolean).map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginBottom: 4,
              borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', width: 20, textAlign: 'center' }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{s}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)' }}>↑↓</span>
            </div>
          ))}
        </div>
      );

    case 'fix':
      return (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 6 }}>Find and correct the errors:</p>
          {exercise.hint && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 999, fontSize: 'var(--text-xs)', marginBottom: 8 }}>
              <Icon.spark size={11} /> {exercise.hint}
            </div>
          )}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--surface)', lineHeight: 1.7 }}>
            {exercise.errorText || 'Text with errors…'}
          </div>
        </div>
      );

    case 'flash': {
      const filledPairs = (exercise.pairs || []).filter(p => p.term || p.def);
      return (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>{filledPairs.length} flashcards · click to flip</p>
          <div style={{
            background: 'var(--surface)', border: '2px solid var(--border)',
            borderRadius: 12, padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Term</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-xl)' }}>
              {filledPairs[0]?.term || 'Term'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--faint)', marginTop: 10 }}>Click to flip</div>
          </div>
        </div>
      );
    }

    default:
      return <p>{exercise.instruction || exercisePreview(exercise)}</p>;
  }
}

/* ─── HELPERS ───────────────────────────────────────────────── */

function mapAiType(aiType) {
  const t = (aiType || '').toLowerCase();
  if (/multiple.?choice|mcq/.test(t)) return 'mcq';
  if (/fill|blank/.test(t)) return 'blank';
  if (/speak|audio|record/.test(t)) return 'speak';
  if (/order|sequen/.test(t)) return 'order';
  if (/error|correct|fix/.test(t)) return 'fix';
  if (/flash|card|vocab/.test(t)) return 'flash';
  return 'short'; // fallback
}

function extractAiExerciseList(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.exercises)) return parsed.exercises;
  if (Array.isArray(parsed.tasks)) {
    return parsed.tasks.map((t, idx) => {
      if (typeof t === 'string') return { title: `Exercise ${idx + 1}`, type: 'short', content: t };
      return {
        title: t.title || t.description || `Exercise ${idx + 1}`,
        type: t.type || 'short',
        content: t.content || t.description || '',
        ...t,
      };
    });
  }
  return [];
}

function summarizeTypes(types) {
  const counts = {};
  (types || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  return Object.entries(counts).map(([t, c]) => `${c}x ${t}`).join(', ');
}

function pickExercisesBySelection(list, selectedTypes) {
  const pool = Array.isArray(list) ? list : [];
  const used = new Set();
  const picked = [];

  selectedTypes.forEach((wantedType) => {
    const idx = pool.findIndex((item, i) => !used.has(i) && mapAiType(item?.type) === wantedType);
    if (idx >= 0) {
      used.add(idx);
      picked.push(pool[idx]);
      return;
    }
    const fallbackIdx = pool.findIndex((_, i) => !used.has(i));
    if (fallbackIdx >= 0) {
      used.add(fallbackIdx);
      picked.push(pool[fallbackIdx]);
    }
  });

  return picked;
}

function exerciseFromAiOption(ex, forcedType = null) {
  const targetType = forcedType || mapAiType(ex?.type);
  const newEx = createExercise(targetType);

  if (newEx.type === 'mcq') {
    newEx.question = ex?.content || ex?.title || '';
    newEx.options = Array.isArray(ex?.options) ? ex.options.slice(0, 4) : ['', '', '', ''];
    while (newEx.options.length < 4) newEx.options.push('');
    newEx.correct = typeof ex?.correct === 'number' ? ex.correct : null;
  } else if (newEx.type === 'blank') {
    newEx.template = ex?.content || '';
    newEx.blanks = Array.isArray(ex?.blanks) ? ex.blanks : [];
  } else if (newEx.type === 'order') {
    newEx.sentences = Array.isArray(ex?.sentences) ? ex.sentences : (ex?.content || '').split('\n').filter(Boolean);
    if (newEx.sentences.length === 0) newEx.sentences = [''];
  } else if (newEx.type === 'fix') {
    newEx.errorText = ex?.content || ex?.errorText || '';
    newEx.correctedText = ex?.correctedText || '';
    newEx.hint = ex?.hint || '';
  } else if (newEx.type === 'flash') {
    const parsedPairs = normalizeFlashPairs(ex);
    newEx.pairs = ensureMinFlashPairs(parsedPairs, ex?.title || ex?.content || 'Flashcard');
  } else if (newEx.type === 'speak') {
    newEx.prompt = ex?.content || ex?.title || '';
    newEx.targetSeconds = ex?.targetSeconds || 60;
  } else {
    newEx.prompt = ex?.content || ex?.title || '';
    if (ex?.targetWords) newEx.targetWords = ex.targetWords;
    if (ex?.rubric) newEx.rubric = ex.rubric;
  }

  return newEx;
}

function normalizeFlashPairs(ex) {
  const asPair = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
      const p = splitFlashLine(item);
      return p ? { term: p.term, def: p.def } : null;
    }
    const term = String(
      item.term ?? item.front ?? item.word ?? item.question ?? item.prompt ?? item.key ?? ''
    ).trim();
    const def = String(
      item.def ?? item.definition ?? item.back ?? item.meaning ?? item.answer ?? item.value ?? ''
    ).trim();
    if (!term && !def) return null;
    return { term, def };
  };

  const arrays = [
    ex?.pairs,
    ex?.flashcards,
    ex?.cards,
    ex?.items,
  ];

  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    const parsed = arr.map(asPair).filter((p) => p && (p.term || p.def));
    if (parsed.length > 0) return parsed;
  }

  // Fallback: parse content lines such as "term: definition".
  const text = String(ex?.content || ex?.title || '').trim();
  if (!text) return [];
  const lines = text
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^[\-\*\d\.\)\s]+/, '').trim())
    .filter(Boolean);
  const parsedFromLines = lines.map(splitFlashLine).filter(Boolean);
  if (parsedFromLines.length > 0) return parsedFromLines;

  // Last resort: convert one compact content into a single card.
  if (ex?.title && ex?.content) {
    return [{ term: String(ex.title).trim(), def: String(ex.content).trim() }];
  }
  return [];
}

function splitFlashLine(line) {
  if (!line) return null;
  const cleaned = String(line).trim();
  const separators = [' - ', ' — ', ': ', ' = ', ' => ', ' -> ', '|'];
  for (const sep of separators) {
    const idx = cleaned.indexOf(sep);
    if (idx <= 0) continue;
    const left = cleaned.slice(0, idx).trim();
    const right = cleaned.slice(idx + sep.length).trim();
    if (left && right) return { term: left, def: right };
  }
  return null;
}

function ensureMinFlashPairs(pairs, seedText) {
  const clean = [];
  const seen = new Set();
  (Array.isArray(pairs) ? pairs : []).forEach((p) => {
    const term = String(p?.term || '').trim();
    const def = String(p?.def || '').trim();
    if (!term && !def) return;
    const k = `${term.toLowerCase()}|${def.toLowerCase()}`;
    if (seen.has(k)) return;
    seen.add(k);
    clean.push({ term, def });
  });

  const topic = String(seedText || 'Flashcard').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Flashcard';
  let i = clean.length + 1;
  while (clean.length < 10) {
    clean.push({
      term: `${topic} ${i}`,
      def: `Definition ${i}`,
    });
    i += 1;
  }

  return clean.slice(0, 20);
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

function arrowBtnStyle(disabled) {
  return {
    width: 24, height: 24, padding: 0, fontFamily: 'var(--font-ui)',
    fontSize: 12, border: '1px solid var(--border)', borderRadius: 6,
    background: 'var(--surface)', color: disabled ? 'var(--faint)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
  };
}

const EMPTY_FORM = {
  title: '', objective: '', description: '',
  exercises: [],
  selfCheck: [''],
  skillType: 'grammar', dueDate: '', teacherNotes: '',
};

const backStyle = {
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
  fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4,
  marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)',
};

const S = {
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)' },
};
