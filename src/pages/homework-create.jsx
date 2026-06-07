/**
 * homework-create.jsx — Interactive homework builder with 7 exercise types.
 * Teacher picks exercise types, fills type-specific fields, previews as student.
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Button, Pill } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import { buildHomeworkGeneratorPrompt, buildExerciseListPrompt, buildHomeworkGroupPrompt } from '../lib/prompts.js';
import { getDiagnoses, getStudent, saveHomework, updateClassEventStatus } from '../lib/workflow.js';
import { EX_TYPES, createExercise, exercisePreview, getExType } from '../lib/exercise-types.js';
import { ExerciseEditor, ExerciseTypePicker, ExTypeBadge } from '../components/exercise-editor.jsx';
import { getExerciseModules, getModuleExercises, bankMeta } from '../lib/exercise-bank.js';
import { getLibraryExercises, saveExerciseToLibrary, deleteLibraryExercise, incrementUsage } from '../lib/exercise-library.js';

const SKILL_TYPES = ['writing', 'speaking', 'grammar', 'vocabulary', 'reading', 'listening', 'mixed'];

// Skill groups available for per-group generation
const SKILL_GROUPS = [
  { key: 'speaking',   label: 'Speaking',   icon: '🎙' },
  { key: 'writing',    label: 'Writing',    icon: '✍️' },
  { key: 'grammar',    label: 'Grammar',    icon: '📐' },
  { key: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { key: 'reading',    label: 'Reading',    icon: '📖' },
  { key: 'listening',  label: 'Listening',  icon: '🎧' },
];

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
  const [selectedLevel, setSelectedLevel] = useState('B1'); // New state for level
  const [expandedEx, setExpandedEx] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  // Per-skill-group generation config: { speaking: 5, grammar: 4, ... }
  const [groupGenConfig, setGroupGenConfig] = useState({});
  const [showGroupGen, setShowGroupGen] = useState(false);
  const [groupGenStatus, setGroupGenStatus] = useState('');
  // Saved-exercise library (Supabase or localStorage). Reloaded when libVersion bumps.
  const [libVersion, setLibVersion] = useState(0);
  const [libraryExercises, setLibraryExercises] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getLibraryExercises().then(list => { if (!cancelled) setLibraryExercises(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [libVersion]);

  useEffect(() => { load(); }, [diagnosisId, studentId]);

  async function load() {
    let sid = studentId || '';
    if (sid) {
      const s = await getStudent(sid) || students.find(x => x.id === sid);
      setStudent(s);
    }
    if (diagnosisId) {
      const allDx = await getDiagnoses(sid);
      const dx = allDx.find(d => d.id === diagnosisId);
      setDiagnosis(dx);
      if (dx && !sid && dx.studentId) sid = dx.studentId;
      if (sid) {
        const s = await getStudent(sid) || students.find(x => x.id === sid);
        setStudent(s || null);
      }
      if (dx) populateFromDiagnosis(dx, students.find(x => x.id === sid));
    }
  }

  function populateFromDiagnosis(dx, s) {
    const hwRec = dx.sections?.homeworkRecommendation?.content;
    const priority = getPriorityItems(dx)[0];
    const title = hwRec?.title || (priority ? `${s?.firstName || 'Student'} — ${priority.area}` : 'Homework from Diagnosis');
    const description = hwRec?.instructions || '';
    const type = hwRec?.expectedSubmissionType?.split('|')[0] || inferSkillType(getPriorityItems(dx));

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
  const areas = (Array.isArray(priorities) ? priorities : []).map(p => (p.area || '').toLowerCase());
  if (areas.some(a => /speak/.test(a))) return 'speaking';
  if (areas.some(a => /writ/.test(a))) return 'writing';
  if (areas.some(a => /vocab/.test(a))) return 'vocabulary';
  return 'grammar';
}

function getPriorityItems(dx) {
  return Array.isArray(dx?.priorityDiagnosis)
    ? dx.priorityDiagnosis
    : Array.isArray(dx?.sections?.priorityDiagnosis?.content)
      ? dx.sections.priorityDiagnosis.content
      : [];
}

  /* ── Exercise management ── */
  function addExercise(type, count = 1, level = 'B1') {
    const n = Math.max(1, Math.min(20, Number(count) || 1));
    const created = Array.from({ length: n }, () => createExercise(type, level));
    setForm(f => ({ ...f, exercises: [...f.exercises, ...created] }));
    setExpandedEx(created[0].id); // expand the first of the batch for editing
    setShowTypePicker(false);
    if (n > 1) window.toast?.(`Added ${n} ${level} ${type} exercises.`, 'ok');
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

  /* ── Per-skill-group generation ── */
  async function handleGenerateByGroups() {
    const selectedGroups = Object.entries(groupGenConfig).filter(([, count]) => count > 0);
    if (selectedGroups.length === 0) {
      window.toast?.('Select at least one skill group.', 'warn');
      return;
    }
    setGenerating(true);
    setGroupGenStatus('');
    const allGenerated = [];
    for (const [group, count] of selectedGroups) {
      setGroupGenStatus(`Generating ${group} exercises (${selectedGroups.indexOf(selectedGroups.find(([g]) => g === group)) + 1}/${selectedGroups.length})…`);
      try {
        const prompt = buildHomeworkGroupPrompt({ student, diagnosis, group, count: Number(count) });
        const data = await callAI(prompt, { max_tokens: 2500, temperature: 0.8, preferredProvider: 'gemini' });
        const raw = data?.content?.map(b => b.text || '').join('') || '';
        const parsed = parseAiJson(raw);
        const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.exercises) ? parsed.exercises : []);
        const exercises = items.map(ex => {
          const newEx = createExercise(mapAiType(ex.type));
          newEx.skillGroup = group;
          if (newEx.type === 'mcq') {
            newEx.question = ex.content || ex.question || '';
            newEx.options = Array.isArray(ex.options) ? normalizeMcqOptions(ex.options) : ['', '', '', ''];
            newEx.correct = normalizeCorrectIndex(ex.correct, 4);
          } else if (newEx.type === 'blank') {
            newEx.template = ex.content || '';
            newEx.blanks = normalizeBlankAnswers(ex.blanks, ex.content);
          } else if (newEx.type === 'order') {
            newEx.sentences = normalizeSentences(ex.sentences, ex.content);
          } else if (newEx.type === 'fix') {
            newEx.errorText = ex.content || ex.errorText || '';
            newEx.correctedText = ex.correctedText || '';
            newEx.hint = ex.hint || '';
          } else if (newEx.type === 'flash') {
            newEx.pairs = normalizeFlashPairs(ex.pairs);
          } else if (newEx.type === 'speak') {
            newEx.prompt = ex.content || ex.question || '';
            newEx.targetSeconds = normalizeTargetSeconds(ex.targetSeconds, null);
          } else if (newEx.type === 'listen') {
            newEx.audioText = ex.audioText || ex.content || '';
            newEx.question = ex.question || '';
            newEx.options = normalizeMcqOptions(ex.options);
            newEx.correct = normalizeCorrectIndex(ex.correct, 4);
            newEx.explanation = ex.explanation || '';
          } else {
            newEx.prompt = ex.content || ex.question || '';
          }
          return newEx;
        });
        allGenerated.push(...exercises);
        window.toast?.(`${group.charAt(0).toUpperCase() + group.slice(1)}: ${exercises.length} exercises generated.`, 'ok');
      } catch (e) {
        window.toast?.(`${group} exercises failed: ${e.message}`, 'warn');
      }
    }
    if (allGenerated.length > 0) {
      setForm(f => ({ ...f, exercises: [...f.exercises, ...allGenerated] }));
    }
    setGroupGenStatus('');
    setShowGroupGen(false);
    setGenerating(false);
    window.toast?.(`${allGenerated.length} exercises added across ${selectedGroups.length} skill groups.`, 'ok');
  }

  /* ── AI generation ── */
  async function handleAiGenerate() {
    const hasSelectedExercises = form.exercises.length > 0;
    if (!diagnosis && !hasSelectedExercises) {
      window.toast?.('Link a diagnosis or add exercises first.', 'warn');
      return;
    }
    setGenerating(true);
    try {
      const prompt = hasSelectedExercises
        ? buildSelectedExerciseFillPrompt({ student, diagnosis, selectedExercises: form.exercises })
        : buildHomeworkGeneratorPrompt({ student, diagnosis });
      // Budget per exercise ~250 tokens output; cap at 4000 to avoid cascade failures on smaller providers.
      const fillTokens = hasSelectedExercises
        ? Math.min(4000, Math.max(2000, form.exercises.length * 250))
        : 2500;
      // Higher temperature → more natural, varied wording (less "AI-template" feel).
      const data = await callAI(prompt, { max_tokens: fillTokens, temperature: 0.8, preferredProvider: 'gemini' });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);

      const aiTasks = Array.isArray(parsed)
        ? parsed
        : (Array.isArray(parsed.tasks) ? parsed.tasks : []);

      setForm(f => ({
        ...f,
        title: parsed.title || f.title,
        objective: parsed.objective || f.objective,
        description: parsed.instructions || f.description,
        exercises: hasSelectedExercises
          ? fillSelectedExercisesWithAi(f.exercises, aiTasks)
          : buildExercisesFromAiTasks(aiTasks, f.exercises),
        selfCheck: Array.isArray(parsed.selfCheck) ? parsed.selfCheck : f.selfCheck,
        skillType: inferSkillType(getPriorityItems(diagnosis)),
        teacherNotes: parsed.teacherNotes || parsed.teacherReviewNotes || f.teacherNotes,
      }));
      window.toast?.(hasSelectedExercises ? 'Selected exercises filled with AI.' : 'Homework regenerated from diagnosis.', 'ok');
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
      const prompt = buildExerciseListPrompt({ student, diagnosis });
      const data = await callAI(prompt, { max_tokens: 4000, temperature: 0.8 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      const list = Array.isArray(parsed) ? parsed : parsed.exercises || [];
      setExerciseOptions(list);
      if (list.length === 0) window.toast?.('No exercises returned. Try again.', 'warn');
    } catch (e) {
      window.toast?.(`Exercise generation failed: ${e.message}`, 'warn');
    }
    setLoadingOptions(false);
  }

  function addAiExerciseToList(ex) {
    // Try to map AI exercise to a structured type, fallback to short answer
    const newEx = createExercise(mapAiType(ex.type));
    // Populate with AI content
    if (newEx.type === 'mcq' && ex.options) {
      newEx.question = ex.content || ex.title || '';
      newEx.options = Array.isArray(ex.options) ? ex.options : ['', '', '', ''];
      newEx.correct = typeof ex.correct === 'number' ? ex.correct : null;
    } else if (newEx.type === 'blank') {
      newEx.template = ex.content || '';
      newEx.blanks = Array.isArray(ex.blanks) ? ex.blanks : [];
    } else if (newEx.type === 'order') {
      newEx.sentences = Array.isArray(ex.sentences) ? ex.sentences : (ex.content || '').split('\n').filter(Boolean);
    } else if (newEx.type === 'fix') {
      newEx.errorText = ex.content || ex.errorText || '';
      newEx.correctedText = ex.correctedText || '';
      newEx.hint = ex.hint || '';
    } else if (newEx.type === 'flash') {
      newEx.pairs = Array.isArray(ex.pairs) ? ex.pairs : [{ term: '', def: '' }];
    } else if (newEx.type === 'speak') {
      newEx.prompt = ex.content || ex.title || '';
      newEx.targetSeconds = ex.targetSeconds || 60;
    } else {
      // short answer fallback
      newEx.prompt = ex.content || ex.title || '';
    }

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

  /* ── Custom exercise library (teacher's saved bank) ── */
  async function saveToLibrary(ex) {
    try {
      const rec = await saveExerciseToLibrary(ex);
      setLibVersion(v => v + 1);
      window.toast?.(rec ? `Saved "${rec.title}" to your library.` : 'Could not save exercise.', rec ? 'ok' : 'warn');
    } catch (e) {
      window.toast?.(`Save failed: ${e.message}`, 'warn');
    }
  }

  async function addFromLibrary(libEx) {
    // Drop the lib id so it becomes a fresh per-homework exercise.
    const { id, title, tags, level, createdAt, usageCount, ...fields } = libEx;
    const fresh = { ...fields, id: 'ex_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    setForm(f => ({ ...f, exercises: [...f.exercises, fresh] }));
    setShowLibrary(false);
    window.toast?.(`"${title}" added.`, 'ok');
    try { await incrementUsage(id); } catch { /* non-critical */ }
  }

  async function removeFromLibrary(libId) {
    try {
      await deleteLibraryExercise(libId);
      setLibVersion(v => v + 1);
      window.toast?.('Removed from your library.', 'info');
    } catch (e) {
      window.toast?.(`Remove failed: ${e.message}`, 'warn');
    }
  }

  /* ── Assign ── */
  async function handleAssign() {
    if (!form.title.trim()) { window.toast?.('Title is required.', 'warn'); return; }
    if (form.exercises.length === 0) { window.toast?.('Add at least one exercise.', 'warn'); return; }
    const resolvedStudentId = studentId || student?.id || diagnosis?.studentId || '';
    if (!resolvedStudentId) { window.toast?.('Select or link a student before assigning homework.', 'warn'); return; }
    const resolvedStudent = student || students.find(s => s.id === resolvedStudentId);
    setSaving(true);
    await saveHomework({
      studentId: resolvedStudentId,
      studentName: resolvedStudent?.name || '',
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

  const exerciseCount = form.exercises.length;
  const typeCounts = {};
  form.exercises.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  return (
    <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '22px 24px 14px' }}>
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

      {/* Diagnosis summary */}
      {getPriorityItems(diagnosis)[0] && (
        <div style={{ marginTop: 16, marginBottom: 20, padding: 14, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-soft)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)', marginBottom: 4 }}>
            Diagnosis Priority:
          </div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            {getPriorityItems(diagnosis)[0].area} — {getPriorityItems(diagnosis)[0].whatToImprove}
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerateOptions}
          disabled={!diagnosis || loadingOptions || generating}
          title={!diagnosis ? 'Open Homework from a diagnosis to generate options.' : ''}
        >
          <Icon.refresh size={12} /> {loadingOptions ? 'Loading…' : 'Generate Exercise Options'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGroupGen(g => !g)}
          disabled={generating}
          title="Generate exercises per skill group — each group runs a separate AI call"
          style={showGroupGen ? { background: 'var(--accent-subtle)', color: 'var(--accent-deep)', borderColor: 'var(--accent-soft)' } : {}}
        >
          <Icon.bolt size={12} /> Generate by Skill Group
        </Button>
      </div>

      {/* ── Per-skill-group generator panel ── */}
      {showGroupGen && (
        <div style={{ marginBottom: 16, padding: 16, border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)', marginBottom: 10 }}>
            Select skill groups — each gets its own AI generation call
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {SKILL_GROUPS.map(({ key, label, icon }) => {
              const isOn = (groupGenConfig[key] || 0) > 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: `1px solid ${isOn ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: isOn ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer' }}
                  onClick={() => setGroupGenConfig(c => ({ ...c, [key]: isOn ? 0 : 5 }))}>
                  <span>{icon}</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: isOn ? 700 : 400, color: isOn ? 'var(--accent-deep)' : 'var(--text)' }}>{label}</span>
                  {isOn && (
                    <input
                      type="number"
                      min={1} max={10}
                      value={groupGenConfig[key] || 5}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setGroupGenConfig(c => ({ ...c, [key]: Math.max(1, Math.min(10, Number(e.target.value) || 5)) }))}
                      style={{ width: 38, fontSize: 'var(--text-sm)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 4px', background: 'var(--surface)', textAlign: 'center' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {groupGenStatus && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-deep)', marginBottom: 10 }}>{groupGenStatus}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleGenerateByGroups} disabled={generating || Object.values(groupGenConfig).every(v => !v)}>
              {generating ? 'Generating…' : `Generate ${Object.values(groupGenConfig).filter(Boolean).reduce((a, b) => a + b, 0)} exercises`}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowGroupGen(false); setGroupGenConfig({}); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ── Exercise Library Picker ── */}
      {showLibrary && (
        <div
          onClick={() => setShowLibrary(false)}
          onKeyDown={e => e.key === 'Escape' && setShowLibrary(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="library-title" onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)', maxWidth: 680, width: '100%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div id="library-title" style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{bankMeta.title}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{bankMeta.moduleCount} modules · {bankMeta.exerciseCount} exercise sets</div>
              </div>
              <button onClick={() => setShowLibrary(false)} aria-label="Close library" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* My Exercises — teacher's saved bank */}
              {libraryExercises.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    My Exercises ({libraryExercises.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {libraryExercises.map(libEx => (
                      <div key={libEx.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <ExTypeBadge typeId={libEx.type} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {libEx.title}
                        </span>
                        <Button variant="primary" size="sm" onClick={() => addFromLibrary(libEx)} style={{ flexShrink: 0 }}>
                          <Icon.plus size={12} /> Add
                        </Button>
                        <button
                          onClick={() => removeFromLibrary(libEx.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4, flexShrink: 0 }}
                          title="Remove from library"
                        >
                          <Icon.trash size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 1, background: 'var(--divider)', margin: '14px 0 4px' }} />
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Ready-made modules
                  </div>
                </div>
              )}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
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
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>
                  Choose the exercise types first, then use <strong>Fill Selected with AI</strong> to auto-fill only those cards.
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="ghost" size="sm" onClick={handleAiGenerate} disabled={generating || loadingOptions}>
                  <Icon.refresh size={12} /> {generating ? 'Generating…' : (form.exercises.length > 0 ? 'Fill Selected with AI' : 'Regenerate All with AI')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowTypePicker(!showTypePicker)}>
                  <Icon.plus size={12} /> Add Exercise
                </Button>
              </div>
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
                    onSaveToLibrary={() => saveToLibrary(ex)}
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
      <div style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
        display: 'flex',
        gap: 10,
        marginTop: 14,
        padding: '12px 0 4px',
        background: 'linear-gradient(180deg, rgba(240,246,246,0.78) 0%, var(--bg) 42%)',
        borderTop: '1px solid rgba(194,217,217,0.65)',
      }}>
        <Button variant="primary" onClick={handleAssign} disabled={saving}>
          <Icon.send size={13} /> {saving ? 'Assigning…' : 'Approve & Assign to Student'}
        </Button>
        <Button variant="ghost" onClick={() => onNavigate('homework')}>Cancel</Button>
      </div>
    </div>
  );
}

/* ─── EXERCISE CARD (collapsible) ───────────────────────────── */
function ExerciseCard({ exercise, index, total, isExpanded, onToggle, onChange, onRemove, onMove, onSaveToLibrary }) {
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
          {/* Save to reusable library */}
          {onSaveToLibrary && (
            <button
              onClick={e => { e.stopPropagation(); onSaveToLibrary(); }}
              style={{ ...arrowBtnStyle(false), color: 'var(--accent)' }}
              title="Save to my exercise library"
            >
              <Icon.star size={12} />
            </button>
          )}
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
          <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
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

    case 'listen':
      return (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(14,95,107,.08)', border: '1px solid rgba(14,95,107,.25)',
          }}>
            <span style={{ fontSize: 20 }}>▶</span>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#0E5F6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Listen ({exercise.plays ?? 2}× allowed)
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{(exercise.audioText || '').slice(0, 60) || 'Audio text not set…'}</div>
            </div>
          </div>
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

function buildExercisesFromAiTasks(tasks, fallback) {
  const built = (tasks || []).map(t => createExerciseFromAiTask(t)).filter(Boolean);
  return built.length > 0 ? built : fallback;
}

function fillSelectedExercisesWithAi(exercises, tasks) {
  if (!Array.isArray(exercises) || exercises.length === 0) return exercises;
  const pool = Array.isArray(tasks) ? [...tasks] : [];
  return exercises.map(ex => {
    const aiTask = pullBestTaskForType(pool, ex.type);
    if (!aiTask) return ex;
    return applyAiTaskToExercise(ex, aiTask);
  });
}

function pullBestTaskForType(pool, type) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  let idx = pool.findIndex(t => mapAiType(t?.type) === type);
  if (idx < 0) idx = 0;
  return idx >= 0 ? pool.splice(idx, 1)[0] : null;
}

function createExerciseFromAiTask(task) {
  if (!task || typeof task !== 'object') return null;
  const ex = createExercise(mapAiType(task.type));
  return applyAiTaskToExercise(ex, task);
}

function applyAiTaskToExercise(exercise, aiTask) {
  const ex = { ...exercise };
  const content = aiTask?.content || aiTask?.description || aiTask?.title || '';

  if (ex.type === 'mcq') {
    const options = normalizeMcqOptions(aiTask?.options);
    ex.question = aiTask?.question || content;
    ex.options = options;
    ex.correct = normalizeCorrectIndex(aiTask?.correct, options.length);
    return ex;
  }

  if (ex.type === 'blank') {
    ex.template = aiTask?.template || content;
    ex.blanks = normalizeBlankAnswers(aiTask?.blanks, ex.template);
    return ex;
  }

  if (ex.type === 'order') {
    ex.sentences = normalizeSentences(aiTask?.sentences, content);
    return ex;
  }

  if (ex.type === 'fix') {
    ex.errorText = aiTask?.errorText || content;
    ex.correctedText = aiTask?.correctedText || aiTask?.example || ex.correctedText || '';
    ex.hint = aiTask?.hint || '';
    return ex;
  }

  if (ex.type === 'flash') {
    ex.pairs = normalizeFlashPairs(aiTask?.pairs);
    return ex;
  }

  if (ex.type === 'speak') {
    ex.prompt = aiTask?.prompt || content;
    ex.targetSeconds = normalizeTargetSeconds(aiTask?.targetSeconds, aiTask?.duration);
    return ex;
  }

  ex.prompt = aiTask?.prompt || content;
  if (aiTask?.rubric) ex.rubric = aiTask.rubric;
  if (Number.isFinite(Number(aiTask?.targetWords))) ex.targetWords = Number(aiTask.targetWords);
  return ex;
}

function normalizeMcqOptions(options) {
  if (!Array.isArray(options) || options.length === 0) return ['', '', '', ''];
  const clean = options
    .map(opt => (typeof opt === 'string' ? opt : opt?.text || opt?.label || ''))
    .filter(Boolean)
    .slice(0, 4);
  while (clean.length < 4) clean.push('');
  return clean;
}

function normalizeCorrectIndex(correct, optionCount) {
  const n = Number(correct);
  if (Number.isInteger(n) && n >= 0 && n < optionCount) return n;
  return null;
}

function normalizeBlankAnswers(blanks, template) {
  if (Array.isArray(blanks) && blanks.length > 0) return blanks.map(v => String(v));
  const count = (String(template || '').match(/_{3,}/g) || []).length;
  return Array.from({ length: count }, () => '');
}

function normalizeSentences(sentences, content) {
  if (Array.isArray(sentences) && sentences.length > 0) return sentences.map(s => String(s));
  return String(content || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function normalizeFlashPairs(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) return [{ term: '', def: '' }];
  const clean = pairs
    .map(p => ({ term: p?.term || '', def: p?.def || p?.definition || '' }))
    .filter(p => p.term || p.def);
  return clean.length > 0 ? clean : [{ term: '', def: '' }];
}

function normalizeTargetSeconds(targetSeconds, duration) {
  const parsed = Number(targetSeconds);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const durMatch = String(duration || '').match(/\d+/);
  if (durMatch) return Math.max(30, Number(durMatch[0]) * 60);
  return 60;
}

function buildSelectedExerciseFillPrompt({ student, diagnosis, selectedExercises = [] }) {
  const priorities = getPriorityItems(diagnosis);
  const errors = Array.isArray(diagnosis?.errorBank)
    ? diagnosis.errorBank
    : Array.isArray(diagnosis?.sections?.errorBankSuggestions?.content)
      ? diagnosis.sections.errorBankSuggestions.content
      : [];
  const vocab = Array.isArray(diagnosis?.vocabTargets?.vocabularyTargets)
    ? diagnosis.vocabTargets.vocabularyTargets
    : Array.isArray(diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets)
      ? diagnosis.sections.vocabGrammarTargets.content.vocabularyTargets
      : [];
  const grammar = Array.isArray(diagnosis?.vocabTargets?.grammarTargets)
    ? diagnosis.vocabTargets.grammarTargets
    : Array.isArray(diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets)
      ? diagnosis.sections.vocabGrammarTargets.content.grammarTargets
      : [];

  const selected = selectedExercises.map((ex, idx) => {
    const meta = getExType(ex.type);
    return `${idx + 1}. type="${ex.type}" (${meta?.label || ex.type}) — ${exercisePreview(ex) || 'empty'}`;
  }).join('\n');

  return `You are a MET English homework assistant. Fill these ${selectedExercises.length} exercise cards with student-ready content.

Student: ${student?.name || 'Unknown'} | ${student?.currentLevel || 'B1'} → ${student?.targetLevel || 'B2'} | ${student?.professionalContext || ''}

Priorities: ${priorities.slice(0, 2).map(p => `${p.area}: ${p.whatToImprove}`).join(' | ') || 'none'}
Errors: ${errors.slice(0, 4).map(e => `"${e.error}" → "${e.correct}"`).join(' | ') || 'none'}
Vocab: ${vocab.slice(0, 3).map(v => v.wordOrPhrase).join(', ') || 'none'}
Grammar: ${grammar.slice(0, 2).map(g => `${g.area}: ${g.issue}`).join(' | ') || 'none'}

━━━ EXERCISES TO FILL ━━━
${selected}

Rules: keep exact count (${selectedExercises.length}), order, and type. Ground in actual errors above. MCQ distractors must reflect this student's real mistakes. Use ${student?.professionalContext || 'specific, real'} contexts. Vary topics across items. B1–B2 level.

Return ONLY valid JSON:
{
  "tasks": [
    { "taskNumber": 1, "type": "exact type", "title": "short title",
      "content": "full exercise", "options": ["mcq"], "correct": 0,
      "template": "blank", "blanks": ["blank"], "prompt": "short/speak",
      "rubric": "short", "targetWords": 120, "targetSeconds": 60,
      "sentences": ["order"], "errorText": "fix", "correctedText": "fix",
      "hint": "fix", "pairs": [{"term":"x","def":"y"}] }
  ],
  "selfCheck": ["specific checks"],
  "teacherNotes": "review focus"
}`;
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
