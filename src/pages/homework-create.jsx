/**
 * homework-create.jsx — Interactive homework builder with 7 exercise types.
 * Teacher picks exercise types, fills type-specific fields, previews as student.
 */
import { useState, useEffect, useRef } from 'react';
import { Icon, Card, SectionHeader, Button, Pill, Modal } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import {
  buildExerciseListPrompt,
  buildFinalRefinementPrompt,
  buildHomeworkBlueprintPrompt,
  buildHomeworkGroupPrompt,
  buildTaskGeneratorPrompt,
  buildListeningGeneratorPrompt,
  buildReadingGeneratorPrompt,
  buildRetrievalPracticePrompt,
  buildLanguageDemandPrompt,
} from '../lib/prompts.js';
import { getDiagnoses, getStudent, saveHomework, updateClassEventStatus, getErrorBank } from '../lib/workflow.js';
import { EX_TYPES, createExercise, exercisePreview, getExType, isStructuredExercise } from '../lib/exercise-types.js';
import { getDueItems, getDueCount, toMCQ, getAllEntries } from '../lib/spaced-repetition.js';
import { ExerciseEditor, ExerciseTypePicker, ExTypeBadge } from '../components/exercise-editor.jsx';
import ExerciseCard from '../components/exercises/ExerciseCard.jsx';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import {
  normalizeTaskTypes, buildCompleteExercises, createCompleteExercise,
  isStructuredAiExerciseComplete, getHomeworkCognitiveSufficiencyWarning,
} from '../lib/exercise-ai-helpers.js';
import { getExerciseModules, getModuleExercises, bankMeta } from '../lib/exercise-bank.js';
import { getB2Modules, getB2ModuleExercises, b2BankMeta } from '../lib/met-b2-bank.js';
import { getLifestyleModules, getLifestyleModuleExercises, lifestylePackMeta } from '../lib/lifestyle-pack.js';
import { getDeepResearchModules, getDeepResearchModuleExercises, deepResearchMeta } from '../lib/met-b2-exercises.js';
import { getLibraryExercises, saveExerciseToLibrary, deleteLibraryExercise, incrementUsage } from '../lib/exercise-library.js';
import HomeworkSetWizard from '../components/homework-set-wizard.jsx';
import { getUnitsByLevel, getSkillExercises, SUBJECT_OPTIONS } from '../lib/unit-bank.js';

const EMPTY_FORM = {
  title: '', objective: '', description: '',
  exercises: [],
  selfCheck: [''],
  skillType: 'grammar', dueDate: '', teacherNotes: '',
};

const SKILL_TYPES = ['writing', 'speaking', 'grammar', 'vocabulary', 'reading', 'listening', 'mixed'];
const HOMEWORK_AI_BASE_OPTIONS = { preferredProvider: 'gemini' };

// Skill groups available for per-group generation
const SKILL_GROUPS = [
  { key: 'speaking',   label: 'Speaking',   icon: <Icon.mic size={16} /> },
  { key: 'writing',    label: 'Writing',    icon: <Icon.edit size={16} /> },
  { key: 'grammar',    label: 'Grammar',    icon: <Icon.diagnose size={16} /> },
  { key: 'vocabulary', label: 'Vocabulary', icon: <Icon.book size={16} /> },
  { key: 'reading',    label: 'Reading',    icon: <Icon.eye size={16} /> },
  { key: 'listening',  label: 'Listening',  icon: <Icon.headphones size={16} /> },
];

export default function HomeworkCreate({ diagnosisId, studentId, students, onNavigate, initialStep = 1 }) {
  const exerciseListRef = useRef(null);
  const revisionRef = useRef(null);
  const assignRef = useRef(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingListening, setGeneratingListening] = useState(false);
  const [generatingReading, setGeneratingReading] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('B1');
  const [wizardDone, setWizardDone] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showUnitBank, setShowUnitBank] = useState(false);
  const [unitBankExercises, setUnitBankExercises] = useState([]);
  const [expandedEx, setExpandedEx] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  // activePanel replaces 5 separate booleans: type-picker/b2-bank/lifestyle/deep-research/group-gen
  const [activePanel, setActivePanel] = useState(null);
  const togglePanel = key => {
    setActivePanel(p => p === key ? null : key);
    if (key !== null) setTimeout(() => {
      const toolbar = document.querySelector('.homework-create-toolbar');
      if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };
  // Per-skill-group generation config: { speaking: 5, grammar: 4, ... }
  const [groupGenConfig, setGroupGenConfig] = useState({});
  const [groupGenStatus, setGroupGenStatus] = useState('');
  // Saved-exercise library (Supabase or localStorage). Reloaded when libVersion bumps.
  const [libVersion, setLibVersion] = useState(0);
  const [libraryExercises, setLibraryExercises] = useState([]);
  const [currentStep, setCurrentStep] = useState(initialStep); // 1: Prebuilt, 2: Retrieval, 3: Build & Revision
  // Spaced repetition review items
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const [includeReview, setIncludeReview] = useState(false);
  const [generatingRetrieval, setGeneratingRetrieval] = useState(false);
  const [languageDemand, setLanguageDemand] = useState(null);
  const [generatingLangDemand, setGeneratingLangDemand] = useState(false);
  const [errorBankItems, setErrorBankItems] = useState([]);
  // "Preview as student" — ephemeral walkthrough of the full set; nothing persisted.
  const [studentPreview, setStudentPreview] = useState(false);
  const [previewResponses, setPreviewResponses] = useState({});

  useEffect(() => {
    let cancelled = false;
    getLibraryExercises().then(list => { if (!cancelled) setLibraryExercises(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [libVersion]);

  useEffect(() => { load(); }, [diagnosisId, studentId]);

  useEffect(() => {
    if (!selectedStudentId) {
      if (!studentId) setStudent(null);
      setErrorBankItems([]);
      return;
    }
    const rosterStudent = students.find(s => s.id === selectedStudentId);
    if (rosterStudent) setStudent(rosterStudent);
    else getStudent(selectedStudentId).then(s => { if (s) setStudent(s); }).catch(() => {});
    getErrorBank(selectedStudentId).then(items => setErrorBankItems(items || [])).catch(() => {});
  }, [selectedStudentId, studentId, students]);

  // Load spaced repetition due count when a student is known
  useEffect(() => {
    const sid = studentId || selectedStudentId || student?.id || diagnosis?.studentId;
    if (sid) {
      setReviewDueCount(getDueCount(sid));
    } else {
      setReviewDueCount(0);
    }
  }, [studentId, selectedStudentId, student?.id, diagnosis?.studentId]);

  async function load() {
    let sid = studentId || '';
    if (sid) {
      setSelectedStudentId(sid);
      const s = await getStudent(sid) || students.find(x => x.id === sid);
      setStudent(s);
    }
    if (diagnosisId) {
      const allDx = await getDiagnoses(sid);
      const dx = allDx.find(d => d.id === diagnosisId);
      setDiagnosis(dx);
      if (dx && !sid && dx.studentId) sid = dx.studentId;
      if (sid) {
        setSelectedStudentId(sid);
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
    setExpandedEx(created[0].id);
    setActivePanel(null);
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
    for (const [index, [group, count]] of selectedGroups.entries()) {
      setGroupGenStatus(`Generating ${group} exercises (${index + 1}/${selectedGroups.length})…`);
      try {
        const prompt = buildHomeworkGroupPrompt({ student, diagnosis, group, count: Number(count) });
        const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 3500, temperature: 0.8 });
        const raw = data?.content?.map(b => b.text || '').join('') || '';
        const parsed = parseAiJson(raw);
        const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.exercises) ? parsed.exercises : []);
        const { exercises, skipped } = buildCompleteExercises(items, { defaultSkillGroup: group });
        allGenerated.push(...exercises);
        window.toast?.(`${group.charAt(0).toUpperCase() + group.slice(1)}: ${exercises.length} complete exercises generated${skipped ? `, ${skipped} skipped` : ''}.`, exercises.length ? 'ok' : 'warn');
      } catch (e) {
        window.toast?.(`${group} exercises failed: ${e.message}`, 'warn');
      }
    }
    if (allGenerated.length > 0) {
      setForm(f => ({ ...f, exercises: [...f.exercises, ...allGenerated] }));
      setExpandedEx(allGenerated[0].id);
      setTimeout(() => scrollToExercises(), 100);
    }
    setGroupGenStatus('');
    setActivePanel(null);
    setGenerating(false);
    window.toast?.(`${allGenerated.length} complete exercises added across ${selectedGroups.length} skill groups.`, allGenerated.length ? 'ok' : 'warn');
  }

  /* ── AI generation ── */
  async function handleGenerateListening() {
    if (!diagnosis) {
      window.toast?.('Link a diagnosis first.', 'warn');
      return;
    }
    
    setGeneratingListening(true);
    setGroupGenStatus('Creating listening script…');
    
    try {
      const prompt = buildListeningGeneratorPrompt({ student, diagnosis });
      const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2500, temperature: 0.8 });
      const parsed = parseAiJson(data.content?.map(b => b.text || '').join('') || '');
      
      if (!parsed || parsed.type !== 'listen') throw new Error('AI returned invalid listening task.');
      
      const fresh = createExercise('listen');
      const listeningEx = { 
        ...fresh, 
        ...parsed,
        id: 'ex_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      };

      setForm(f => ({ ...f, exercises: [...f.exercises, listeningEx] }));
      setExpandedEx(listeningEx.id);
      setTimeout(() => scrollToExercises(), 100);
      window.toast?.(`Listening task generated successfully!`, 'ok');
    } catch (e) {
      window.toast?.(`Listening generation failed: ${e.message}`, 'warn');
    }
    
    setGroupGenStatus('');
    setGeneratingListening(false);
  }

  async function handleGenerateReading() {
    setGeneratingReading(true);
    setGroupGenStatus('Creating reading passage…');
    try {
      const prompt = buildReadingGeneratorPrompt({ student, diagnosis, questionCount: 3 });
      const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2500, temperature: 0.8 });
      const parsed = parseAiJson(data.content?.map(b => b.text || '').join('') || '');
      if (!parsed || parsed.type !== 'read') throw new Error('AI returned invalid reading task.');
      const fresh = createExercise('read');
      const readEx = {
        ...fresh,
        ...parsed,
        questions: (parsed.questions || []).map(q => ({
          id: 'rq_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
          question: q.question || '',
          options: (q.options || ['', '', '', '']).slice(0, 4),
          correct: typeof q.correct === 'number' ? q.correct : null,
          explanation: q.explanation || '',
        })),
        id: 'ex_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      };
      setForm(f => ({ ...f, exercises: [...f.exercises, readEx] }));
      setExpandedEx(readEx.id);
      setTimeout(() => scrollToExercises(), 100);
      window.toast?.('Reading exercise generated!', 'ok');
    } catch (e) {
      window.toast?.(`Reading generation failed: ${e.message}`, 'warn');
    }
    setGroupGenStatus('');
    setGeneratingReading(false);
  }

  async function handleAiGenerate() {
    if (!diagnosis) {
      window.toast?.('Link a diagnosis first.', 'warn');
      return;
    }
    
    setGenerating(true);
    setGroupGenStatus('Creating blueprint…');
    
    try {
      // 1. Generate Blueprint
      const bpData = await callAI(buildHomeworkBlueprintPrompt({ student, diagnosis }), { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 1200, temperature: 0.7 });
      const blueprint = parseAiJson(bpData.content?.map(b => b.text || '').join('') || '');
      const taskTypes = normalizeTaskTypes(blueprint?.taskTypes);
      
      setGroupGenStatus('Generating tasks…');
      // 2. Generate Tasks
      const tasks = [];
      for (const taskType of taskTypes) {
        const tData = await callAI(buildTaskGeneratorPrompt({ student, diagnosis, taskBlueprint: blueprint, taskType }), { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2500, temperature: 0.8 });
        tasks.push(parseAiJson(tData.content?.map(b => b.text || '').join('') || ''));
      }
      const { exercises, skipped } = buildCompleteExercises(tasks);
      if (!exercises.length) throw new Error('AI returned tasks, but none were complete enough to add.');
      
      setGroupGenStatus('Refining and finalising…');
      // 3. Final Refinement
      const refData = await callAI(buildFinalRefinementPrompt({ student, blueprint, tasks }), { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 1800, temperature: 0.7 });
      const refinement = parseAiJson(refData.content?.map(b => b.text || '').join('') || '');

      setForm(f => ({
        ...f,
        title: blueprint?.title || 'MET Practice Homework',
        objective: blueprint?.objective || f.objective || 'Build MET readiness through targeted practice.',
        description: refinement?.instructions || 'Complete each exercise carefully. Bring questions to the next class.',
        exercises,
        selfCheck: Array.isArray(refinement?.selfCheck) && refinement.selfCheck.length ? refinement.selfCheck : ['I checked my answers before submitting.'],
        teacherNotes: skipped ? `${refinement?.teacherNotes || ''}\n\n${skipped} incomplete AI exercise(s) were skipped.`.trim() : (refinement?.teacherNotes || ''),
        skillType: inferSkillType(getPriorityItems(diagnosis)),
      }));
      setExpandedEx(exercises[0]?.id);
      setTimeout(() => scrollToExercises(), 100);
      window.toast?.(`Homework generated successfully: ${exercises.length} complete exercises${skipped ? `, ${skipped} skipped` : ''}.`, 'ok');
    } catch (e) {
      window.toast?.(`Cascade generation failed: ${e.message}`, 'warn');
    }
    
    setGroupGenStatus('');
    setGenerating(false);
  }

  async function handleGenerateOptions() {
    if (!diagnosis) { window.toast?.('No diagnosis linked — cannot generate exercises.', 'warn'); return; }
    setLoadingOptions(true);
    setExerciseOptions([]);
    try {
      const prompt = buildExerciseListPrompt({ student, diagnosis, level: selectedLevel, skill: selectedSkill });
      const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 5000, temperature: 0.8 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      const list = Array.isArray(parsed) ? parsed : parsed.exercises || [];
      const { exercises, skipped } = buildCompleteExercises(list);
      setExerciseOptions(exercises);
      setTimeout(() => {
        document.querySelector('.homework-create-ai-suggestions')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      if (exercises.length === 0) window.toast?.('No complete exercises returned. Try again.', 'warn');
      else window.toast?.(`${exercises.length} complete suggestions ready${skipped ? `, ${skipped} skipped` : ''}.`, 'ok');
    } catch (e) {
      window.toast?.(`Exercise generation failed: ${e.message}`, 'warn');
    }
    setLoadingOptions(false);
  }

  async function handleGenerateRetrieval() {
    const topic = form.objective || getPriorityItems(diagnosis)[0]?.whatToImprove || '';
    if (!topic) {
      window.toast?.('Add an objective or link a diagnosis first.', 'warn');
      return;
    }
    setGeneratingRetrieval(true);
    const level = selectedLevel || student?.currentLevel || 'B1';
    const prompt = buildRetrievalPracticePrompt({ topic, studentLevel: level, questionCount: 5 });
    try {
      const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2000 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      if (!parsed?.questions?.length) throw new Error('No questions returned');

      const exercises = parsed.questions.map(q => {
        const base = { id: Math.random().toString(36).slice(2, 9), focus: q.focus || 'retrieval' };
        if (q.type === 'mcq') {
          return { ...base, type: 'mcq', question: q.question || '', options: (q.options || []).slice(0, 4), correct: typeof q.correct === 'number' ? q.correct : 0, explanation: q.explanation || '' };
        }
        if (q.type === 'blank') {
          return { ...base, type: 'blank', template: q.template || '', blanks: Array.isArray(q.blanks) ? q.blanks : [] };
        }
        return { ...base, type: 'short', prompt: q.prompt || '', rubric: q.rubric || 'Recall the key points accurately.', targetWords: q.targetWords || 40 };
      }).filter(ex => isStructuredAiExerciseComplete(ex));

      const spacingNote = parsed.spacing_recommendation ? `\nRetrieval spacing: ${parsed.spacing_recommendation}` : '';
      setForm(f => ({
        ...f,
        exercises: [...f.exercises, ...exercises],
        teacherNotes: (f.teacherNotes || '') + spacingNote,
      }));
      window.toast?.(`Added ${exercises.length} retrieval practice question${exercises.length !== 1 ? 's' : ''}.`, 'ok');
    } catch (e) {
      window.toast?.(`Retrieval generation failed: ${e.message}`, 'warn');
    }
    setGeneratingRetrieval(false);
  }

  async function handleAnalyzeLanguageDemand() {
    if (!form.exercises.length) {
      window.toast?.('Add some exercises first.', 'warn');
      return;
    }
    setGeneratingLangDemand(true);
    const level = selectedLevel || student?.currentLevel || 'B1';
    const prompt = buildLanguageDemandPrompt({ exercises: form.exercises, studentLevel: level, objective: form.objective });
    try {
      const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 1200 });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      if (!parsed?.priority_actions) throw new Error('Invalid response');
      setLanguageDemand(parsed);
      window.toast?.('Language demand analysis complete.', 'ok');
    } catch (e) {
      window.toast?.(`Language demand analysis failed: ${e.message}`, 'warn');
    }
    setGeneratingLangDemand(false);
  }

  function addAiExerciseToList(ex) {
    const newEx = createCompleteExercise(ex);
    if (!newEx) {
      window.toast?.('That suggestion is incomplete, so it was not added.', 'warn');
      return;
    }
    setForm(f => ({ ...f, exercises: [...f.exercises, newEx] }));
    setExpandedEx(newEx.id);
    window.toast?.(`"${newEx.title || 'Exercise'}" added.`, 'ok');
  }

  function addModuleFromLibrary(mod) {
    const exercises = getModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} exercises from "${mod.title}".`, 'ok');
    setShowLibrary(false);
  }

  function addModuleFromB2Bank(mod) {
    const exercises = getB2ModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} MET B2 exercises from "${mod.label}".`, 'ok');
    setActivePanel(null);
  }

  function addModuleFromLifestylePack(mod) {
    const exercises = getLifestyleModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this section.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} lifestyle exercises from "${mod.label}".`, 'ok');
    setActivePanel(null);
  }

  function addModuleFromDeepResearch(mod) {
    const exercises = getDeepResearchModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} exercises from "${mod.label}".`, 'ok');
    setActivePanel(null);
  }

  async function copyLifestylePrintablePack() {
    try {
      await navigator.clipboard.writeText(lifestylePackMeta.printableMarkdown || '');
      window.toast?.('Printable Markdown copied.', 'ok');
    } catch {
      window.toast?.('Could not copy printable Markdown from this browser.', 'warn');
    }
  }

  function addB2Pack() {
    const exercises = getB2Modules().flatMap(mod => getB2ModuleExercises(mod.id));
    if (!exercises.length) {
      window.toast?.('No MET B2 pack exercises found.', 'warn');
      return;
    }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} MET B2 pack exercises.`, 'ok');
  }

  function addLifestylePack() {
    const exercises = getLifestyleModules().flatMap(mod => getLifestyleModuleExercises(mod.id));
    if (!exercises.length) {
      window.toast?.('No lifestyle pack exercises found.', 'warn');
      return;
    }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} lifestyle pack exercises.`, 'ok');
  }

  function addDeepResearchPack() {
    const exercises = getDeepResearchModules().flatMap(mod => getDeepResearchModuleExercises(mod.id));
    if (!exercises.length) {
      window.toast?.('No deep research exercises found.', 'warn');
      return;
    }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} deep research exercises.`, 'ok');
  }

  function addUnitBankPack() {
    if (!unitBankExercises.length) {
      window.toast?.('No unit bank exercises available yet.', 'warn');
      return;
    }
    const exercises = unitBankExercises.map(ex => ({
      ...ex,
      id: 'ub_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    }));
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} unit bank exercises.`, 'ok');
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
    const resolvedStudentId = studentId || selectedStudentId || student?.id || diagnosis?.studentId || '';
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
      workflowTemplate: 'prebuilt-retrieval-build-revision',
      workflowStages: ['prebuilt', 'retrieval', 'build_revision'],
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

  function addUnitBankExercise(ex) { setForm(f => ({ ...f, exercises: [...f.exercises, { ...ex, id: 'ub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2) }] })); }
  function handleWizardComplete({ level, skill }) {
    setSelectedLevel(level);
    setSelectedSkill(skill);
    const units = getUnitsByLevel(level);
    setUnitBankExercises(getSkillExercises(units, skill, 12));
    setWizardDone(true);
  }
  function scrollToExercises() {
    if (exerciseListRef.current) {
      const el = exerciseListRef.current;
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  if (!wizardDone) return <HomeworkSetWizard onComplete={handleWizardComplete} onSkip={() => setWizardDone(true)} />;
  const subjectLabel = SUBJECT_OPTIONS.find(s => s.id === selectedSkill)?.label;

  const exerciseCount = form.exercises.length;
  const retrievalCount = form.exercises.filter(ex => ex.focus === 'retrieval').length;
  const typeCounts = {};
  form.exercises.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  return (
    <div className="homework-create-page" style={{ maxWidth: 1120, width: '100%', margin: '0 auto', padding: '22px 24px 14px' }}>
      <button onClick={() => onNavigate('homework')} style={backStyle}>
        <Icon.arrowL size={13} /> Back
      </button>

      {/* Wizard Header */}
      <h1 style={S.headline}>Create Homework</h1>
      {(selectedLevel || subjectLabel) && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          {selectedLevel && <Pill tone="info">{selectedLevel}</Pill>}
          {subjectLabel && <Pill tone="info">{subjectLabel}</Pill>}
          <button onClick={() => setWizardDone(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Change</button>
        </div>
      )}
      <div className="homework-create-steps" style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {['Prebuilt', 'Retrieval', 'Build', 'Revision & Assign'].map((step, i) => (
          <div key={step} style={{
            fontSize: 'var(--text-xs)', fontWeight: 600,
            color: currentStep === i + 1 ? 'var(--accent)' : 'var(--muted)',
            paddingBottom: 4, borderBottom: currentStep === i + 1 ? '2px solid var(--accent)' : 'none'
          }}>
            {i + 1}. {step}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="homework-create-grid" style={{ display: 'grid', gap: 24, alignItems: 'start' }}>
        <div>
          {currentStep === 1 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Step 1: Prebuilt Homework" />
              <div style={{ marginTop: 16 }}>
                {studentId || diagnosis?.studentId ? (
                  <p style={{ fontSize: 'var(--text-md)', marginBottom: 8 }}>Student: <strong>{student?.name || 'Loading…'}</strong></p>
                ) : (
                  <Field label="Student">
                    <select
                      className="input"
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                    >
                      <option value="">Choose student before assigning</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                )}
                {diagnosis && (
                  <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-soft)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-deep)', marginBottom: 4 }}>
                      Diagnostic Focus:
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', marginBottom: 8 }}>
                      {getPriorityItems(diagnosis)[0]?.area} — {getPriorityItems(diagnosis)[0]?.whatToImprove}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics')}>View Full Diagnosis</Button>
                  </div>
                )}
                <Field label="Homework Goal" style={{ marginTop: 16 }}>
                  <input className="input" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="What this homework targets..." />
                </Field>
                {errorBankItems.filter(e => e.status !== 'solved').length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Error Bank — Active Patterns
                    </div>
                    {errorBankItems.filter(e => e.status !== 'solved').slice(0, 3).map(entry => (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--divider)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', fontWeight: 600 }}>{entry.error}</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '0 4px' }}>→</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>{entry.correct}</span>
                          {entry.type && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--faint)', textTransform: 'capitalize' }}>{entry.type}</span>}
                        </div>
                        <button
                          onClick={() => setForm(f => ({ ...f, objective: f.objective ? f.objective : `Fix error: ${entry.error} → ${entry.correct}` }))}
                          style={{ fontSize: 'var(--text-xs)', padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--accent)', fontFamily: 'var(--font-ui)' }}
                          title="Use as homework goal"
                        >
                          Use as goal
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 18, padding: 14, background: 'var(--surface)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Step 1. Prebuilt homework
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>
                    Start with a ready-made pack. You can add a full prebuilt set now, then move into retrieval and your own selected exercises.
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <button className="student-text-action" onClick={addB2Pack} style={{ justifyContent: 'space-between' }}>
                      <span>MET B2 Pack</span>
                      <span>{getB2Modules().length} modules</span>
                    </button>
                    <button className="student-text-action" onClick={addLifestylePack} style={{ justifyContent: 'space-between' }}>
                      <span>Lifestyle Pack</span>
                      <span>{getLifestyleModules().length} modules</span>
                    </button>
                    <button className="student-text-action" onClick={addDeepResearchPack} style={{ justifyContent: 'space-between' }}>
                      <span>Deep Research Pack</span>
                      <span>{getDeepResearchModules().length} modules</span>
                    </button>
                    <button className="student-text-action" onClick={addUnitBankPack} style={{ justifyContent: 'space-between' }}>
                      <span>Unit Bank</span>
                      <span>{unitBankExercises.length} exercises</span>
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <Button variant="primary" onClick={() => setCurrentStep(2)}>
                    Next: Retrieval
                  </Button>
                </div>
              </div>
            </Card>
          )}
          {currentStep === 2 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Step 2: MET Retrieval" />
              <div style={{ marginTop: 16 }}>
                <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 6 }}>Add recall before the build stage</div>
                  <div style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: 12 }}>
                    Generate retrieval questions from the homework objective so the student practices remembering the target language before the rest of the homework is built.
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
                      {retrievalCount} retrieval exercise{retrievalCount === 1 ? '' : 's'} added
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
                      {exerciseCount} total exercise{exerciseCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleGenerateRetrieval} disabled={generatingRetrieval || generating}>
                    <Icon.spark size={12} /> {generatingRetrieval ? 'Generating…' : 'Generate Retrieval Practice'}
                  </Button>
                </div>

                <div className="homework-create-actions" style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <Button variant="ghost" onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button variant="primary" onClick={() => setCurrentStep(3)}>Next: Build & Revision</Button>
                </div>
              </div>
            </Card>
          )}
          {currentStep === 3 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Step 3: Build & Revision" />
              <div style={{ marginTop: 16 }}>
                {/* ── Toolbar: two rows — Generate | Browse & Add ── */}
                <div className="homework-create-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {/* Row 1: MET-Aligned generation */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="primary" size="sm" onClick={() => togglePanel('group-gen')} disabled={!diagnosis || generating}
                      style={activePanel === 'group-gen' ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}>
                      <Icon.spark size={12} /> Generate MET Tasks by Skill
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleGenerateListening} disabled={!diagnosis || generatingListening}>
                      <Icon.headphones size={12} /> Listening Task
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleGenerateReading} disabled={generatingReading}>
                      <Icon.doc size={12} /> Reading Task
                    </Button>
                  </div>
                  {/* Row 2: Manual/Bank Additions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="ghost" size="sm" onClick={() => togglePanel('type-picker')}>
                      <Icon.plus size={12} /> Add Manual Exercise
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => togglePanel('b2-bank')}>
                      <Icon.book size={12} /> MET B2 Bank
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => togglePanel('lifestyle')}>
                      <Icon.book size={12} /> Lifestyle Pack
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => togglePanel('deep-research')}>
                      <Icon.book size={12} /> Deep Research
                    </Button>
                  </div>
                </div>

                {groupGenStatus && (
                  <div style={{ marginBottom: 12, padding: '12px 14px', border: '1.5px solid var(--accent-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--accent-deep)', fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
                    {groupGenStatus}
                  </div>
                )}

                {activePanel === 'group-gen' && (
                  <div style={{ marginBottom: 16, padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 4 }}>Generate by MET skill</div>
                    <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', lineHeight: 1.5, marginBottom: 12 }}>
                      Choose the skills this homework should cover. Each generated item is checked for complete student-ready fields before it is added.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                      {SKILL_GROUPS.map(group => (
                        <label key={group.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                          <span aria-hidden="true">{group.icon}</span>
                          <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600 }}>{group.label}</span>
                          <input
                            type="number"
                            min="0"
                            max="6"
                            value={groupGenConfig[group.key] || 0}
                            onChange={e => setGroupGenConfig(cfg => ({ ...cfg, [group.key]: Math.max(0, Math.min(6, Number(e.target.value) || 0)) }))}
                            style={{ width: 48, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}
                          />
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Button variant="primary" size="sm" onClick={handleGenerateByGroups} disabled={generating}>
                        <Icon.spark size={12} /> Generate Selected Skills
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)} disabled={generating}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}

                {activePanel === 'type-picker' && <ExerciseTypePicker onSelect={addExercise} onClose={() => setActivePanel(null)} />}

                {activePanel === 'b2-bank' && (
                  <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{b2BankMeta.title}</span>
                      <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Icon.close size={16} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 340, overflowY: 'auto' }}>
                      {getB2Modules().map(mod => (
                        <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--divider)', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>{mod.skill} · {mod.exercises.length} exercises</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => addModuleFromB2Bank(mod)}>Add</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePanel === 'lifestyle' && (
                  <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{lifestylePackMeta.title}</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{lifestylePackMeta.level} · {lifestylePackMeta.subtitle}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button variant="ghost" size="sm" onClick={copyLifestylePrintablePack}>Copy printable</Button>
                        <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Icon.close size={16} /></button>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--divider)', background: 'var(--surface)', fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
                      Converted from the bundled JSON pack in <strong>src/components/exercises</strong>. Use the Markdown file as the printable teacher copy.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 360, overflowY: 'auto' }}>
                      {getLifestyleModules().map(mod => (
                        <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--divider)', gap: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>
                              {mod.skill} · {mod.sourceCount} source tasks · {mod.exerciseCount} platform exercises
                            </div>
                            {mod.note && (
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 560 }}>
                                {mod.note}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => addModuleFromLifestylePack(mod)}>Add</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePanel === 'deep-research' && (
                  <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{deepResearchMeta.title}</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{deepResearchMeta.level} · {deepResearchMeta.exerciseCount} exercises across {deepResearchMeta.moduleCount} skills</div>
                      </div>
                      <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Icon.close size={16} /></button>
                    </div>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--divider)', background: 'var(--surface)', fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.5 }}>
                      Sourced from the Deep Research Report spec. Covers all 5 MET skills with auto-graded and open-response formats.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 360, overflowY: 'auto' }}>
                      {getDeepResearchModules().map(mod => (
                        <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--divider)', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{mod.label}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'capitalize' }}>{mod.skill} · {mod.exercises.length} exercises</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => addModuleFromDeepResearch(mod)}>Add</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {unitBankExercises.length > 0 && (
                  <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button
                      onClick={() => setShowUnitBank(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'var(--surface)', border: 'none', cursor: 'pointer', borderBottom: showUnitBank ? '1px solid var(--border)' : 'none' }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        <Icon.book size={14} /> Unit Bank — {subjectLabel || 'exercises'} from {selectedLevel} units ({unitBankExercises.length})
                      </span>
                      <Icon.chevronDown size={14} style={{ transform: showUnitBank ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {showUnitBank && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 360, overflowY: 'auto' }}>
                        {unitBankExercises.map((ex, i) => (
                          <div key={ex.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--divider)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                              <ExTypeBadge typeId={ex.type} />
                              <span style={{ fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                                {ex.question || ex.prompt || ex.errorText || (ex.pairs?.[0] ? `${ex.pairs[0].term} — ${ex.pairs[0].def}` : '')}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" style={{ flexShrink: 0 }} onClick={() => addUnitBankExercise(ex)}>Add</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {exerciseOptions.length > 0 && (
                  <div className="homework-create-ai-suggestions" style={{ marginBottom: 16, padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>AI exercise suggestions</div>
                        <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>Reviewed for complete fields. Click <strong>Add</strong> to include one in your homework.</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setExerciseOptions([])}>Clear</Button>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {exerciseOptions.map((ex, i) => {
                        const preview = exercisePreview(ex);
                        const title = ex.title || getExType(ex.type)?.label || ex.type;
                        const subtitle = preview.length > 90 ? preview.slice(0, 87) + '…' : preview;
                        return (
                          <div key={ex.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--divider)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', overflow: 'hidden' }}>
                            <ExTypeBadge typeId={ex.type} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => addAiExerciseToList(ex)}>Add</Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── SPACED REPETITION REVIEW ITEMS ── */}
                {reviewDueCount > 0 && (
                  <div style={{
                    marginBottom: 16, padding: '12px 14px',
                    border: `1px solid ${includeReview ? 'var(--border-strong)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    transition: 'border-color .15s, background .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Review ({reviewDueCount} item{reviewDueCount !== 1 ? 's' : ''} due)</span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '1px 8px', borderRadius: 'var(--radius-pill)',
                            background: 'var(--warning-bg)', color: 'var(--warning)',
                            fontSize: 'var(--text-xs)', fontWeight: 600,
                          }}>
                            Spaced repetition
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5, marginTop: 2 }}>
                          Past errors due for review. Each item becomes an <strong>MCQ</strong> exercise.
                        </div>
                      </div>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        fontSize: 'var(--text-sm)', fontWeight: 600, userSelect: 'none',
                      }}>
                        <input type="checkbox" checked={includeReview}
                          onChange={e => {
                            setIncludeReview(e.target.checked);
                            if (e.target.checked) {
                              const sid = studentId || selectedStudentId || student?.id || diagnosis?.studentId;
                              if (!sid) return;
                              const due = getDueItems(sid);
                              const all = getAllEntries(sid);
                              const reviewExercises = due.map(item => toMCQ(item, all));
                              setForm(f => ({ ...f, exercises: [...f.exercises, ...reviewExercises] }));
                            } else {
                              setForm(f => ({ ...f, exercises: f.exercises.filter(ex => !ex.isReviewItem) }));
                            }
                          }}
                          style={{ accentColor: 'var(--accent)', width: 18, height: 18 }} />
                        {includeReview ? 'Added' : `Add ${reviewDueCount} review item${reviewDueCount !== 1 ? 's' : ''}`}
                      </label>
                    </div>
                  </div>
                )}
                  
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.exercises.map((ex, i) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      index={i}
                      total={form.exercises.length}
                      isExpanded={expandedEx === ex.id}
                      onToggle={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                      onChange={(updated) => updateExercise(ex.id, updated)}
                      onRemove={() => removeExercise(ex.id)}
                      onMove={(dir) => moveExercise(i, dir)}
                      onSaveToLibrary={() => saveToLibrary(ex)}
                    />
                  ))}
                </div>

                <div className="homework-create-actions" style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <Button variant="ghost" onClick={() => setCurrentStep(2)}>Back</Button>
                  <Button variant="primary" onClick={() => setCurrentStep(4)}>Go to Revision & Assign</Button>
                </div>
              </div>
            </Card>
          )}
          {currentStep === 4 && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Revision & Assign" />
              <div ref={revisionRef} style={{ marginTop: 16 }}>
                {(() => {
                  const warn = getHomeworkCognitiveSufficiencyWarning(form.exercises, diagnosis);
                  return warn ? (
                    <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--warning)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Icon.spark size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span><strong>Cognitive sufficiency note:</strong> {warn}</span>
                    </div>
                  ) : null;
                })()}
                <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 4 }}>{form.title || 'Untitled Homework'}</div>
                  {form.description && <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>{form.description}</p>}
                  
                  {form.exercises.map((ex, i) => (
                    <div key={ex.id} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{i + 1}.</span>
                        <ExTypeBadge typeId={ex.type} />
                      </div>
                      <ExercisePlayer exercise={ex} readOnly />
                    </div>
                  ))}
                </div>

                <div className="homework-create-actions" style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button variant="ghost" onClick={() => setCurrentStep(3)}>Back to Build</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setPreviewResponses({}); setStudentPreview(true); }} disabled={!form.exercises.some(isStructuredExercise)} title="Step through the whole homework exactly as the student will receive it">
                    <Icon.play size={12} /> Preview as student
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleAnalyzeLanguageDemand} disabled={generatingLangDemand || !form.exercises.length} title="Check vocabulary load and get pre-teaching suggestions">
                    <Icon.search size={12} /> {generatingLangDemand ? 'Analysing…' : 'Check Language Demands'}
                  </Button>
                </div>

                <Modal
                  open={studentPreview}
                  onClose={() => setStudentPreview(false)}
                  kicker="Student view"
                  title="Preview as student"
                  subtitle="Exactly what your student receives. Nothing here is saved or sent."
                  maxWidth={760}
                >
                  {(() => {
                    const previewExercises = form.exercises.filter(isStructuredExercise);
                    if (!previewExercises.length) {
                      return <p style={{ color: 'var(--muted)' }}>No previewable exercises yet. Add structured exercises to preview the student experience.</p>;
                    }
                    return (
                      <HomeworkStepThrough
                        exercises={previewExercises}
                        responses={previewResponses}
                        onResponse={(id, updated) => setPreviewResponses(r => ({ ...r, [id]: updated }))}
                        onSave={() => {}}
                        onSubmit={() => { window.toast?.('Preview only — nothing was sent to the student.', 'ok'); setStudentPreview(false); }}
                        readOnly={false}
                      />
                    );
                  })()}
                </Modal>

                {languageDemand && (
                  <div style={{ marginTop: 16, padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Language Demand Analysis</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        background: languageDemand.overall_demand === 'high' ? '#FEF2F2' : languageDemand.overall_demand === 'medium' ? '#FFFBEB' : '#F0FDFA',
                        color: languageDemand.overall_demand === 'high' ? '#991B1B' : languageDemand.overall_demand === 'medium' ? '#92400E' : '#065F46',
                      }}>{languageDemand.overall_demand} demand</span>
                      <button onClick={() => setLanguageDemand(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>×</button>
                    </div>
                    {languageDemand.teacher_note && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>{languageDemand.teacher_note}</p>
                    )}
                <div ref={exerciseListRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(languageDemand.priority_actions || []).map((action, i) => (
                        <div key={i} style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>{action.demand_type}</div>
                          <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{action.description}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 4 }}>Recommend: {action.recommendation}</div>
                        </div>
                      ))}
                    </div>
                    {(languageDemand.tier2_vocabulary?.length > 0 || languageDemand.tier3_vocabulary?.length > 0) && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {languageDemand.tier2_vocabulary?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Tier 2 to pre-teach</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{languageDemand.tier2_vocabulary.join(' · ')}</div>
                          </div>
                        )}
                        {languageDemand.tier3_vocabulary?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Tier 3 to pre-teach</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>{languageDemand.tier3_vocabulary.join(' · ')}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div ref={assignRef} style={{ marginTop: 16, padding: 16, border: '1px solid var(--accent-soft)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 12 }}>Assign homework</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {studentId || diagnosis?.studentId ? null : (
                      <Field label="Student">
                        <select
                          className="input"
                          value={selectedStudentId}
                          onChange={e => setSelectedStudentId(e.target.value)}
                        >
                          <option value="">Choose student</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </Field>
                    )}
                    <Field label="Homework Title">
                      <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </Field>
                    <Field label="Due Date">
                      <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="homework-create-actions" style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Button variant="ghost" onClick={() => setCurrentStep(3)}>Back to Build</Button>
                    <Button variant="primary" onClick={handleAssign} disabled={saving}>
                      {saving ? 'Assigning…' : 'Assign Homework'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {false && (
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Step 4: Assign Homework" />
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {studentId || diagnosis?.studentId ? null : (
                    <Field label="Student">
                      <select
                        className="input"
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                      >
                        <option value="">Choose student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="Homework Title">
                      <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </Field>
                  <Field label="Due Date">
                      <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </Field>
                </div>
                
                <div className="homework-create-actions" style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                  <Button variant="ghost" onClick={() => setCurrentStep(3)}>Back</Button>
                  <Button variant="primary" onClick={handleAssign} disabled={saving}>
                    {saving ? 'Assigning…' : 'Assign Homework'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Persistent Summary Side Panel */}
        <Card className="homework-create-summary" style={{ padding: 18, position: 'sticky', top: 20 }}>
          <SectionHeader title="Homework Summary" />
          <div style={{ marginTop: 12, fontSize: 'var(--text-sm)' }}>
            <p>Exercises: <strong style={exerciseCount > 10 ? { color: 'var(--danger)' } : {}}>{exerciseCount} / 10</strong></p>
            <p>Est. time: <strong>~{Math.max(5, exerciseCount * 4)} min</strong></p>
          </div>
        </Card>
      </div>
    </div>
  );
}


function Field({ label, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  );
}

const backStyle = {
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
  fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4,
  marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)',
};

const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)' },
};

