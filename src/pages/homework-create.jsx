/**
 * homework-create.jsx — Interactive homework builder with 7 exercise types.
 * Teacher picks exercise types, fills type-specific fields, previews as student.
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Icon, SectionHeader, Pill, Modal, callAI, Breadcrumb } from '../components/shared.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import { withSkills } from '../education-skills/active-skills.js';
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
import { forgeHomework } from '../lib/swarm-homework-forge.js';
import { getDiagnoses, getStudent, saveHomework, updateClassEventStatus } from '../lib/workflow.js';
import { createExercise, getExType, isStructuredExercise, exercisePreview, EX_TYPES } from '../lib/exercise-types.js';
import { getDueItems, toMCQ, getAllEntries } from '../lib/spaced-repetition.js';
import { ExerciseTypePicker, ExTypeBadge } from '../components/exercise-editor.jsx';
import ExerciseCard from '../components/exercises/ExerciseCard.jsx';
import { ExercisePlayer, HomeworkStepThrough } from '../components/exercise-player.jsx';
import {
  normalizeTaskTypes, buildCompleteExercises, createCompleteExercise,
  isStructuredAiExerciseComplete, getHomeworkCognitiveSufficiencyWarning,
  buildExercisesFromAiTasks,
} from '../lib/exercise-ai-helpers.js';
import { getModuleExercises } from '../lib/exercise-bank.js';
import { getB2Modules, getB2ModuleExercises } from '../lib/met-b2-bank.js';
import { getLifestyleModules, getLifestyleModuleExercises, lifestylePackMeta } from '../lib/lifestyle-pack.js';
import { getDeepResearchModules, getDeepResearchModuleExercises } from '../lib/met-b2-exercises.js';
import { getGrammarModules, getGrammarModuleExercises } from '../lib/met-grammar-bank.js';
import { getLibraryExercises, saveExerciseToLibrary, deleteLibraryExercise, incrementUsage } from '../lib/exercise-library.js';
import { generateExerciseImage } from '../lib/image-generation.js';
import { generateId, generateShortId } from '../lib/utils.js';
import HomeworkSetWizard from '../components/homework-set-wizard.jsx';
import { getUnitsByLevel, getSkillExercises, SUBJECT_OPTIONS } from '../lib/unit-bank.js';
import { TopicExplanationsEditor } from '../components/topic-explanations.jsx';
import ResourcePicker from '../components/resource-picker.jsx';

const EMPTY_FORM = {
  title: '', objective: '', description: '',
  exercises: [],
  attachments: [],
  selfCheck: [''],
  skillType: 'grammar', dueDate: '', teacherNotes: '',
};

const HOMEWORK_AI_BASE_OPTIONS = {};

// Skill groups available for per-group generation
const SKILL_GROUPS = [
  { key: 'speaking',   label: 'Speaking (Comp IV)',   icon: <Icon.mic size={16} /> },
  { key: 'writing',    label: 'Writing (Comp III)',    icon: <Icon.edit size={16} /> },
  { key: 'grammar',    label: 'Grammar (Comp II)',    icon: <Icon.diagnose size={16} /> },
  { key: 'vocabulary', label: 'Vocabulary (Comp II)', icon: <Icon.book size={16} /> },
  { key: 'reading',    label: 'Reading (Comp II)',    icon: <Icon.eye size={16} /> },
  { key: 'listening',  label: 'Listening (Comp I)',  icon: <Icon.headphones size={16} /> },
];

export default function HomeworkCreate({ diagnosisId, studentId, students, onNavigate, initialStep = 1 }) {
  const exerciseListRef = useRef(null);
  const assignRef = useRef(null);
  const [availableDiagnoses, setAvailableDiagnoses] = useState([]);
  const [diagnosis, setDiagnosis] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingListening, setGeneratingListening] = useState(false);
  const [generatingReading, setGeneratingReading] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('B1');
  const [wizardDone, setWizardDone] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [packFilter, setPackFilter] = useState('all'); // skill filter for prebuilt browser
  const [showUnitBank, setShowUnitBank] = useState(false);
  const [unitBankExercises, setUnitBankExercises] = useState([]);
  const [expandedEx, setExpandedEx] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libSearchQuery, setLibSearchQuery] = useState('');
  const [libLevelFilter, setLibLevelFilter] = useState('');
  const [libTypeFilter, setLibTypeFilter] = useState('');
  const [libSkillFilter, setLibSkillFilter] = useState('');
  const [libPreviewEx, setLibPreviewEx] = useState(null);
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
  const [currentStep, setCurrentStep] = useState(initialStep); // 1: Prebuilt, 2: Retrieval, 3: Build
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
  const [topicExplanations, setTopicExplanations] = useState([]);
  const [showResourcePicker, setShowResourcePicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLibraryExercises().then(list => { if (!cancelled) setLibraryExercises(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, [libVersion]);

  useEffect(() => {
    if (!selectedStudentId) {
      setAvailableDiagnoses([]);
      return;
    }
    getDiagnoses(selectedStudentId).then(list => {
      setAvailableDiagnoses(list || []);
    }).catch(() => {});
  }, [selectedStudentId]);

  useEffect(() => {
    let sid = studentId || '';
    if (sid) setSelectedStudentId(sid);
    if (diagnosisId) {
      getDiagnoses(sid).then(allDx => {
        const dx = allDx.find(d => d.id === diagnosisId);
        if (!dx) return;
        setDiagnosis(dx);
        const resolvedSid = sid || dx.studentId || '';
        if (!sid && dx.studentId) setSelectedStudentId(dx.studentId);
        getStudent(resolvedSid).then(s => {
          setStudent(s || null);
          populateFromDiagnosis(dx, s || null);
        });
      });
    } else if (sid) {
      getStudent(sid).then(s => { if (s) setStudent(s); });
    }
  }, [diagnosisId, studentId]);

  function populateFromDiagnosis(dx, s) {
    const hwRec = dx.sections?.homeworkRecommendation?.content;
    const priority = getPriorityItems(dx)[0];
    const title = hwRec?.title || (priority ? `${s?.firstName || 'Student'}, ${priority.area}` : 'Homework from Diagnosis');
    const description = hwRec?.instructions || '';
    const type = hwRec?.expectedSubmissionType?.split('|')[0] || inferSkillType(getPriorityItems(dx));

    const exercises = buildExercisesFromAiTasks(hwRec?.tasks, []);

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
        const data = await callAI(prompt, await withSkills('exercise', { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 3500, temperature: 0.8 }));
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
      for (const ex of allGenerated) {
        try { await saveExerciseToLibrary(ex); } catch {}
      }
      setLibVersion(v => v + 1);
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
      const data = await callAI(prompt, await withSkills('exercise', { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2500, temperature: 0.8 }));
      const parsed = parseAiJson(data.content?.map(b => b.text || '').join('') || '');
      
      if (!parsed || parsed.type !== 'listen') throw new Error('AI returned invalid listening task.');
      
      const fresh = createExercise('listen');
      const listeningId = generateId('ex_');
      const listeningEx = { 
        ...fresh, 
        ...parsed,
        id: listeningId
      };

      setForm(f => ({ ...f, exercises: [...f.exercises, listeningEx] }));
      setExpandedEx(listeningEx.id);
      try { await saveExerciseToLibrary(listeningEx); setLibVersion(v => v + 1); } catch {}
      setTimeout(() => scrollToExercises(), 100);
      window.toast?.(`Listening task generated successfully!`, 'ok');

      if (listeningEx.pictureHint) {
        window.toast?.('Generating image for listening task…', 'info');
        generateExerciseImage(listeningEx.pictureHint).then(url => {
          if (url) {
            setForm(f => ({
              ...f,
              exercises: f.exercises.map(ex =>
                ex.id === listeningEx.id ? { ...ex, pictureHint: url } : ex
              )
            }));
          }
        });
      }
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
      const data = await callAI(prompt, await withSkills('exercise', { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2500, temperature: 0.8 }));
      const parsed = parseAiJson(data.content?.map(b => b.text || '').join('') || '');
      if (!parsed || parsed.type !== 'read') throw new Error('AI returned invalid reading task.');
      const fresh = createExercise('read');
      const readId = generateId('ex_');
      const readEx = {
        ...fresh,
        ...parsed,
        questions: (parsed.questions || []).map(q => ({
          id: generateShortId('rq_'),
          question: q.question || '',
          options: (q.options || ['', '', '', '']).slice(0, 4),
          correct: typeof q.correct === 'number' ? q.correct : null,
          explanation: q.explanation || '',
        })),
        id: readId,
      };
      setForm(f => ({ ...f, exercises: [...f.exercises, readEx] }));
      setExpandedEx(readEx.id);
      try { await saveExerciseToLibrary(readEx); setLibVersion(v => v + 1); } catch {}
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
    try {
      const result = await forgeHomework({
        student,
        diagnosis,
        onProgress: (msg) => setGroupGenStatus(msg)
      });
      
      setForm(f => ({
        ...f,
        title: result.title,
        objective: result.objective,
        description: result.description,
        exercises: result.exercises,
        selfCheck: result.selfCheck,
        teacherNotes: result.teacherNotes,
        skillType: result.taskTypes?.[0] || f.skillType,
      }));
      
      setExpandedEx(result.exercises[0]?.id);
      for (const ex of result.exercises) {
        try { await saveExerciseToLibrary(ex); } catch {}
      }
      setLibVersion(v => v + 1);
      setTimeout(() => scrollToExercises(), 100);
      window.toast?.(`MET Homework forged: ${result.exercises.length} validated exercises.`, 'ok');
    } catch (e) {
      window.toast?.(`Forge failed: ${e.message}`, 'error');
    } finally {
      setGroupGenStatus('');
      setGenerating(false);
    }
  }


  async function handleGenerateOptions() {
    if (!diagnosis) { window.toast?.('No diagnosis linked. Cannot generate exercises.', 'warn'); return; }
    setLoadingOptions(true);
    setExerciseOptions([]);
    try {
      const prompt = buildExerciseListPrompt({ student, diagnosis, level: selectedLevel, skill: selectedSkill });
      const data = await callAI(prompt, await withSkills('exercise', { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 5000, temperature: 0.8 }));
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
      const data = await callAI(prompt, await withSkills('exercise', { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 2000 }));
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
      for (const ex of exercises) {
        try { await saveExerciseToLibrary(ex); } catch {}
      }
      setLibVersion(v => v + 1);
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

  async function addAiExerciseToList(ex) {
    const newEx = createCompleteExercise(ex);
    if (!newEx) {
      window.toast?.('That suggestion is incomplete, so it was not added.', 'warn');
      return;
    }
    newEx.aiGenerated = true;
    setForm(f => ({ ...f, exercises: [...f.exercises, newEx] }));
    setExpandedEx(newEx.id);
    try { await saveExerciseToLibrary(newEx); setLibVersion(v => v + 1); } catch {}
    window.toast?.(`"${newEx.title || 'Exercise'}" added.`, 'ok');
  }

  function addModuleFromLibrary(mod) {
    const exercises = getModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} exercises from "${mod.title}".`, 'ok');
    setShowLibrary(false);
  }

  async function addModuleFromB2Bank(mod) {
    const exercises = await getB2ModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} MET B2 exercises from "${mod.label}".`, 'ok');
    setActivePanel(null);
  }

  function addModuleFromLifestylePack(mod) {
    const exercises = getLifestyleModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this section.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} Everyday English exercises from "${mod.label}".`, 'ok');
    setActivePanel(null);
  }

  function addModuleFromDeepResearch(mod) {
    const exercises = getDeepResearchModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} exercises from "${mod.label}".`, 'ok');
    setActivePanel(null);
  }

  function addModuleFromGrammarBank(mod) {
    const exercises = getGrammarModuleExercises(mod.id);
    if (!exercises.length) { window.toast?.('No exercises in this module.', 'warn'); return; }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} grammar exercises from "${mod.label}".`, 'ok');
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

  async function addB2Pack() {
    const exercises = (await Promise.all(getB2Modules().map(mod => getB2ModuleExercises(mod.id)))).flat();
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
      window.toast?.('No Everyday English exercises found.', 'warn');
      return;
    }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} Everyday English exercises.`, 'ok');
  }

  function addDeepResearchPack() {
    const exercises = getDeepResearchModules().flatMap(mod => getDeepResearchModuleExercises(mod.id));
    if (!exercises.length) {
      window.toast?.('No Extended Practice exercises found.', 'warn');
      return;
    }
    setForm(f => ({ ...f, exercises: [...f.exercises, ...exercises] }));
    window.toast?.(`Added ${exercises.length} Extended Practice exercises.`, 'ok');
  }

  function addUnitBankPack() {
    if (!unitBankExercises.length) {
      window.toast?.('No unit bank exercises available yet.', 'warn');
      return;
    }
    const exercises = unitBankExercises.map(ex => ({
      ...ex,
      id: generateId('ub_')
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
    const fresh = { ...fields, id: generateId('ex_') };
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

  /* ── Auto-save all current exercises to the teacher's library ── */
  async function autoSaveExercises() {
    const saved = [];
    for (const ex of form.exercises) {
      if (!ex.type) continue;
      try {
        const rec = await saveExerciseToLibrary(ex);
        if (rec) saved.push(rec.title);
      } catch (e) {
        console.warn('[HomeworkCreate] auto-save exercise failed:', e.message);
      }
    }
    if (saved.length) {
      setLibVersion(v => v + 1);
      window.toast?.(`${saved.length} exercise${saved.length === 1 ? '' : 's'} saved to your library.`, 'ok');
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
    try {
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
        topicExplanations,
        selfCheck: form.selfCheck.filter(Boolean),
        skillType: form.skillType,
        type: form.skillType,
        dueDate: form.dueDate,
        teacherNotes: form.teacherNotes,
        status: 'not-started',
      });
      if (diagnosis?.classEventId) {
        await updateClassEventStatus(diagnosis.classEventId, { homeworkStatus: 'assigned' }).catch(e =>
          console.warn('[HomeworkCreate] updateClassEventStatus failed:', e)
        );
      }
      await autoSaveExercises();
    } catch (e) {
      console.error('[HomeworkCreate] Save failed:', e);
      window.toast?.(`Save failed: ${e.message}`, 'error');
      setSaving(false);
      return;
    }
    setSaving(false);
    window.toast?.('Homework assigned to student!', 'ok');
    onNavigate('homework');
  }

  function addUnitBankExercise(ex) {
    const newId = generateId('ub_');
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...ex, id: newId }] }));
  }
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

  async function handleTopicAiGenerate(topic) {
    if (!topic?.title) { window.toast?.('Add a title first.', 'warn'); return; }
    const level = selectedLevel || 'B1';
    const defaultPrompt = `You are a qualified English teacher creating a topic explanation for a MET student at ${level}.

Topic: "${topic.title}"

Requirements:
- Include at least one common error or misconception students make with this topic, and how to avoid it
- Include a usage note about when NOT to use this form, or a common exception to the rule
- Keep vocabulary at ${level} or below; define any new terms in simpler language
- Average max 18 words per sentence
- Language must be natural and teacher-like, not textbook

Format:
- 2-4 short paragraphs with **bold** for key terms
- Use - for bullet points where helpful`;
    const prompt = topic.aiPrompt?.trim() || defaultPrompt;
    try {
      const data = await callAI(prompt, { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 800 });
      const text = data?.content?.map(b => b.text || '').join('') || '';
      const content = text.replace(/^["']|["']$/g, '').trim();
      setTopicExplanations(prev => prev.map(t => t.id === topic.id ? { ...t, content } : t));
      window.toast?.('Topic explanation generated.', 'ok');
    } catch (e) {
      window.toast?.(`Generation failed: ${e.message}`, 'warn');
    }
  }

  const AI_EXERCISE_PROMPTS = {
    mcq: `Create one B1-level multiple choice question for an MET student.
Requirements:
- Use only B1-level vocabulary. Max 15 words per sentence in the question
- For healthcare/medical content, verify collocations are natural English
- The correct answer must be definitively correct — no ambiguous options where another could also work
- Distractors must be plausible but clearly wrong
- Match the MET exam style: inference, purpose, or attitude questions preferred over surface detail
Return JSON only with fields: type "mcq", question, options (array of 4 strings), correct (0-3 index), explanation.`,
    blank: `Create one B1-level fill-the-blank exercise for an MET student.
Requirements:
- Use only B1-level vocabulary. Max 15 words per sentence in the template
- The blank must have exactly one clearly correct answer (or acceptable alternatives separated by |)
- Avoid blanks that could accept multiple different correct answers
Return JSON only with fields: type "blank", template (use ___ for each blank), blanks (array of correct answers in order, use | to separate alternatives).`,
    short: `Create one B1-level short answer question for an MET student.
Requirements:
- The prompt should be specific enough that two students would produce similar content
- Use only B1-level vocabulary in the prompt
- Align with the MET writing task format (opinion, explanation, or experience-based prompt)
Return JSON only with fields: type "short", prompt, rubric, targetWords (number).`,
    speak: `Create one B1-level speaking prompt for an MET student.
Requirements:
- Use only B1-level vocabulary in the prompt
- For healthcare/medical scenarios, use natural, idiomatic medical English
- The imageDescription should describe a realistic everyday or healthcare scene
- Align with the MET speaking task format (describe, explain, or give opinion)
Return JSON only with fields: type "speak", prompt, imageDescription, targetSeconds (number 30-90).`,
    order: `Create one B1-level sentence-ordering exercise for an MET student.
Requirements:
- Each sentence must be a complete, grammatically correct English sentence at B1 level
- The ordered sequence should tell a clear, logical story or procedure
- Avoid ambiguous orderings where two sequences could both make sense
Return JSON only with fields: type "order", sentences (array of 4-6 strings in correct order).`,
    fix: `Create one B1-level error correction exercise for an MET student.
Requirements:
- The error must be a genuine, unambiguous grammar mistake at B1 level
- The correctedText must be the only natural correction
- Use common B1 learner errors (e.g., tense, preposition, subject-verb agreement, word order)
- For healthcare sentences, ensure the correction produces natural medical English
Return JSON only with fields: type "fix", errorText, correctedText, hint.`,
    flash: `Create a set of 6 B1-level flashcards for an MET student.
Requirements:
- All terms must be genuinely useful at B1 level, not obscure
- Definitions must be in simpler English than the term itself
- Group by a common topic (e.g., healthcare, education, travel, work)
Return JSON only with fields: type "flash", pairs (array of {term, def} objects).`,
    listen: `Create one B1-level listening exercise for an MET student.
Requirements:
- Write the audioText as a realistic short conversation using natural B1-level English
- The question should test inference, speaker attitude, or purpose — NOT surface detail
- All options must use B1-level vocabulary
- For healthcare conversations, use natural, accurate medical language
- Average max 15 words per turn in the dialogue
Return JSON only with fields: type "listen", audioText, question, options (array of 4 strings), correct (0-3 index), explanation, plays (2).`,
    dialogue: `Create one B1-level dialogue exercise for an MET student.
Requirements:
- Write natural conversational English at B1 level
- For healthcare scenarios, use accurate and natural medical communication
- Each line should be a complete utterance — avoid fragments
- The dialogue should feel like a realistic interaction, not a scripted textbook example
Return JSON only with fields: type "dialogue", speakerA "Nurse", speakerB "Patient", lines (array of {id: random string, speaker: "A" or "B", text} objects, 4-6 lines).`,
    swap: `Create one B1-to-B2 synonym swap exercise.
Requirements:
- The B1 words in brackets must be genuinely replaceable with a B2 equivalent
- The B2 options must be real synonyms that fit the same context
- One correct synonym per word; distractors should be wrong part of speech or wrong register
Return JSON only with fields: type "swap", sentence (with [bracketed] B1 words), swaps (array of {word: "bracketed word", options: ["B2 option","B2 option","B2 option","B2 option"], correct: 0-3 index}).`,
    levelup: `Create one B1-to-B2-to-C1 sentence upgrade exercise.
Requirements:
- The B1 sentence must be natural, not artificially simple
- The B2 upgrade must be a genuine improvement in formality and vocabulary range
- The C1 upgrade should show sophisticated structure without being unnatural
- All three options at the end must be clearly different levels, not subtly different
Return JSON only with fields: type "levelup", b1 (B1 sentence), b2 (B2 version), c1 (C1 version), options (array of 3 strings, index 0 is B1, 1 is B2, 2 is C1), correct (1), keywords (array of target vocab), explanation.`,
    read: `Create one B1-level reading exercise for an MET student.
Requirements:
- Write the passage using B1-level vocabulary. Average max 18 words per sentence
- The passage should cover an MET-relevant topic (healthcare, education, work, technology, community)
- Questions should test main idea, inference, and purpose — NOT surface detail
- Each correct answer must be unambiguously supported by the passage text
- Source is optional but if provided, must be plausible
Return JSON only with fields: type "read", passage (2-3 paragraphs), source, questions (array of {question, options: [4 strings], correct: 0-3 index}).`,
  };

  async function handleAiGenerateByType(typeId, level) {
    const prompt = AI_EXERCISE_PROMPTS[typeId];
    if (!prompt) { window.toast?.('No AI prompt for this type.', 'warn'); return; }
    const context = form.objective ? ` The student's homework goal is: ${form.objective}.` : '';
    const fullPrompt = prompt + context + ` Level: ${level || selectedLevel || 'B1'}.`;
    try {
      const data = await callAI(fullPrompt, await withSkills('exercise', { ...HOMEWORK_AI_BASE_OPTIONS, max_tokens: 1500, temperature: 0.7 }));
      const raw = data?.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      if (!parsed || !parsed.type) throw new Error('AI returned invalid exercise');
      const exercise = createCompleteExercise(parsed, { defaultSkillGroup: typeId });
      if (!exercise) throw new Error('AI output was incomplete');
      exercise.aiGenerated = true;
      setForm(f => ({ ...f, exercises: [...f.exercises, exercise] }));
      setExpandedEx(exercise.id);
      window.toast?.(`${getExType(typeId)?.label || typeId} generated.`, 'ok');
    } catch (e) {
      window.toast?.(`AI generate failed: ${e.message}`, 'warn');
    }
  }

  function handleResourceSelect(url) {
    if (expandedEx) {
      setForm(f => {
        const nextExercises = f.exercises.map(ex => {
          if (ex.id === expandedEx) {
            if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
              return { ...ex, audioSrc: url };
            } else if (url.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
              if (ex.type === 'speak') return { ...ex, imageUrl: url };
              if (ex.type === 'listen') return { ...ex, pictureHint: url };
              return { ...ex, imageUrl: url };
            }
          }
          return ex;
        });
        return { ...f, exercises: nextExercises };
      });
      window.toast?.('Resource added to exercise!', 'ok');
    } else {
      setForm(f => ({
        ...f,
        attachments: [...(f.attachments || []), url]
      }));
      window.toast?.('Resource added to homework!', 'ok');
    }
  }

  if (!wizardDone) return <HomeworkSetWizard onComplete={handleWizardComplete} onSkip={() => setWizardDone(true)} />;
  const subjectLabel = SUBJECT_OPTIONS.find(s => s.id === selectedSkill)?.label;

  const exerciseCount = form.exercises.length;
  const retrievalCount = form.exercises.filter(ex => ex.focus === 'retrieval').length;
  const typeCounts = {};
  form.exercises.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  return (
    <div className="homework-create-page">
      <Breadcrumb crumbs={[{ label: 'Homework', onClick: () => onNavigate('homework') }, { label: 'Create' }]} />

      {/* Wizard Header */}
      <SectionHeader title="Create Homework" />
      {(selectedLevel || subjectLabel) && (
        <div className="homework-wizard-info">
          {selectedLevel && <Pill tone="info">{selectedLevel}</Pill>}
          {subjectLabel && <Pill tone="info">{subjectLabel}</Pill>}
          <button className="homework-wizard-change" onClick={() => setWizardDone(false)}>Change</button>
        </div>
      )}
      <div className="homework-step-tabs">
        {['Prebuilt', 'Retrieval', 'Build'].map((step, i) => (
          <button type="button" key={step}
            className={`homework-step-tab${currentStep === i + 1 ? ' homework-step-tab--active' : ''}`}
            onClick={() => setCurrentStep(i + 1)}>
            {i + 1}. {step}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="homework-create-grid">
        <div>
          {currentStep === 1 && (
            <Card style={{ padding: 'var(--space-5)' }}>
              <SectionHeader title="Step 1: Prebuilt Homework" />
              <div style={{ marginTop: 16 }}>
                {studentId || diagnosis?.studentId ? (
                  <p style={{ fontSize: 'var(--text-base)', marginBottom: 8 }}>Student: <strong>{student?.name || 'Loading…'}</strong></p>
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
                 <Field label="Link Diagnosis" style={{ marginTop: 16 }}>
                   <select
                     className="input"
                     value={diagnosis?.id || ''}
                     onChange={e => {
                       const dxId = e.target.value;
                       const dx = availableDiagnoses.find(d => d.id === dxId);
                       if (dx) {
                         setDiagnosis(dx);
                         populateFromDiagnosis(dx, student);
                       } else {
                         setDiagnosis(null);
                       }
                     }}
                   >
                     <option value="">None, create from scratch</option>
                     {availableDiagnoses.map(dx => (
                       <option key={dx.id} value={dx.id}>
                         {dx.date} — {dx.sections?.priorityDiagnosis?.content?.[0]?.area || 'General Diagnosis'}
                       </option>
                     ))}
                   </select>
                 </Field>
                 {diagnosis && (

                  <div className="homework-diagnosis-box">
                    <div className="homework-diagnosis-label">Diagnostic Focus:</div>
                    <div className="homework-diagnosis-text">
                      {getPriorityItems(diagnosis)[0]?.area}: {getPriorityItems(diagnosis)[0]?.whatToImprove}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('diagnostics')}>View Full Diagnosis</Button>
                  </div>
                )}
                <Field label="Homework Goal" style={{ marginTop: 16 }}>
                  <input className="input" value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="What this homework targets..." />
                </Field>
                {errorBankItems.filter(e => e.status !== 'solved').length > 0 && (
                  <div className="info-panel" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="section-label" style={{ marginBottom: 8 }}>
Error Bank: Active Patterns
                    </div>
                    {errorBankItems.filter(e => e.status !== 'solved').slice(0, 3).map(entry => (
                      <div key={entry.id} className="homework-error-item">
                        <div className="homework-error-body">
                          <span className="homework-error-text">{entry.error}</span>
                          <span className="homework-error-arrow">→</span>
                          <span className="homework-error-correct">{entry.correct}</span>
                          {entry.type && <span className="homework-error-type">{entry.type}</span>}
                        </div>
                        <button
                          className="homework-error-btn"
                          onClick={() => setForm(f => ({ ...f, objective: f.objective ? f.objective : `Fix error: ${entry.error} → ${entry.correct}` }))}
                          title="Use as homework goal"
                        >
                          Use as goal
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <TopicExplanationsEditor topics={topicExplanations} onChange={setTopicExplanations} onAiGenerate={handleTopicAiGenerate} />
                <div className="homework-gen-toolbar">
                  <Button variant="ghost" size="sm" onClick={() => setShowResourcePicker(true)}>
                    <Icon.image size={12} /> Media Library
                  </Button>
                </div>
                {showResourcePicker && (
                  <ResourcePicker open={true} onClose={() => setShowResourcePicker(false)} onSelect={handleResourceSelect} tab="images" />
                )}
                {(() => {
                  const SKILLS = ['all','reading','listening','grammar','vocabulary','writing','speaking'];
                  const SKILL_LABELS = { all:'All', reading:'Reading (Comp II)', listening:'Listening (Comp I)', grammar:'Grammar (Comp II)', vocabulary:'Vocabulary (Comp II)', writing:'Writing (Comp III)', speaking:'Speaking (Comp IV)' };
                  const b2Mods = getB2Modules().map(m => ({ ...m, pack:'MET B2', packLevel:'B2', level:'B2' }));
                  const lifeMods = getLifestyleModules().map(m => ({ ...m, pack:'Everyday English', packLevel:'B1-B2', level:'B1-B2' }));
                  const drMods = getDeepResearchModules().map(m => ({ ...m, pack:'Extended Practice', packLevel:'B2', level:'B2' }));
                  const grMods = getGrammarModules().map(m => ({ ...m, pack:'Grammar Drill Bank', packLevel:'B2', level:'B2' }));
                  const allPrebuilt = [...b2Mods, ...lifeMods, ...drMods, ...grMods];
                  const filtered = packFilter === 'all' ? allPrebuilt : allPrebuilt.filter(m => m.skill === packFilter);
                  return (
                    <div className="homework-packs-section">
                      <div className="homework-packs-header">MET-Aligned Exercise Packs</div>
                      <div className="homework-packs-desc">
                        Browse MET-aligned packs by skill. Click <strong>Add</strong> on any module to add its exercises to this homework.
                      </div>
                      <div className="homework-pack-filters">
                        {SKILLS.map(s => (
                          <button key={s}
                            className={`homework-pack-filter-btn${packFilter === s ? ' homework-pack-filter-btn--active' : ''}`}
                            onClick={() => setPackFilter(s)}>
                            {SKILL_LABELS[s]}
                          </button>
                        ))}
                      </div>
                      <div className="homework-pack-list">
                        {filtered.length === 0 && (
                          <div className="homework-pack-empty">No prebuilt packs match this skill.</div>
                        )}
                        {filtered.map(mod => (
                          <div key={mod.id} className="homework-pack-module">
                            <div className="homework-pack-module-info">
                              <div className="homework-pack-module-title">{mod.label}</div>
                              <div className="homework-pack-module-meta">
                                <span>{mod.pack}</span>
                                <span className="homework-pack-module-dot">·</span>
                                <span className="homework-pack-module-skill">{mod.skill}</span>
                                <span className="homework-pack-module-dot">·</span>
                                <span>{mod.exercises?.length || mod.exerciseCount || 0} exercises</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                              if (mod.pack === 'Everyday English') addModuleFromLifestylePack(mod);
                              else if (mod.pack === 'Extended Practice') addModuleFromDeepResearch(mod);
                              else if (mod.pack === 'Grammar Drill Bank') addModuleFromGrammarBank(mod);
                              else addModuleFromB2Bank(mod);
                            }}>Add</Button>
                          </div>
                        ))}
                      </div>
                      {unitBankExercises.length > 0 && (
                        <div className="homework-unit-bank-row">
                          <div className="homework-unit-bank-inner">
                            <div>
                              <div className="homework-pack-module-title">Unit Bank: {subjectLabel}</div>
                              <div className="homework-pack-module-meta">{selectedLevel} · {unitBankExercises.length} exercises available</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={addUnitBankPack}>Add all</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="homework-create-actions" style={{ marginTop: 'var(--space-6)' }}>
                  <Button variant="primary" onClick={() => setCurrentStep(2)}>
                    Next: Retrieval
                  </Button>
                </div>
              </div>
            </Card>
          )}
          {currentStep === 2 && (
            <Card style={{ padding: 'var(--space-5)' }}>
              <SectionHeader title="Step 2: Retrieval & MET Focus" />
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* ── Retrieval Practice ── */}
                  <div className="homework-panel-section">
                  <div className="homework-panel-title">Retrieval Practice</div>
                  <div className="homework-panel-desc">
                    Generate recall questions from the homework objective so the student practices remembering the target language.
                  </div>
                  <div className="homework-gen-toolbar" style={{ marginBottom: 0, marginTop: 0 }}>
                    <span className="homework-retrieval-badge">
                      {retrievalCount} retrieval exercise{retrievalCount === 1 ? '' : 's'} added
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleGenerateRetrieval} disabled={generatingRetrieval || generating}>
                    <Icon.spark size={12} /> {generatingRetrieval ? 'Generating…' : 'Generate Retrieval Practice'}
                  </Button>
                </div>

                {/* ── MET Focus: AI generation per skill ── */}
                <div className="homework-panel-section">
                  <div className="homework-panel-title">MET Focus: Generate by Exam Skill</div>
                  <div className="homework-panel-desc" style={{ fontSize: 'var(--text-xs)' }}>
                    Choose the MET exam skills this homework should target. Each generated item is checked for complete student-ready fields before being added.
                  </div>
                  <div className="homework-skill-grid">
                    {SKILL_GROUPS.map(group => (
                      <label key={group.key} className="homework-skill-group">
                        <span aria-hidden="true">{group.icon}</span>
                        <span className="homework-skill-group-label">{group.label}</span>
                        <input
                          className="homework-skill-count"
                          type="number" min="0" max="6"
                          value={groupGenConfig[group.key] || 0}
                          onChange={e => setGroupGenConfig(cfg => ({ ...cfg, [group.key]: Math.max(0, Math.min(6, Number(e.target.value) || 0)) }))}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="homework-gen-toolbar">
                    <span className="homework-gen-label">Generate:</span>
                    <Button variant="primary" size="sm" onClick={handleGenerateByGroups} disabled={generating}>
                      <Icon.spark size={12} /> Selected Skills
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleAiGenerate} disabled={!diagnosis || generating}>
                      <Icon.spark size={12} /> From Diagnosis
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleGenerateListening} disabled={!diagnosis || generatingListening}>
                      <Icon.headphones size={12} /> Listening
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleGenerateReading} disabled={generatingReading}>
                      <Icon.doc size={12} /> Reading
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleGenerateOptions} disabled={!diagnosis || loadingOptions}>
                      <Icon.refresh size={12} /> {loadingOptions ? 'Generating…' : 'Suggestions'}
                    </Button>
                  </div>
                  {groupGenStatus && (
                    <div className="homework-gen-status">
                      <span className="homework-gen-spinner" />
                      {groupGenStatus}
                    </div>
                  )}
                </div>

                <div className="homework-create-actions">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)}>Back</Button>
                  <Button variant="primary" onClick={() => setCurrentStep(3)}>Next: Build</Button>
                </div>
              </div>
            </Card>
          )}
          {currentStep === 3 && (
            <Card style={{ padding: 'var(--space-5)' }}>
              <SectionHeader title="Step 3: Build" />
              <div style={{ marginTop: 16 }}>
                {/* ── Toolbar ── */}
                <div className="homework-create-toolbar">
                  <Button variant="primary" size="sm" onClick={() => togglePanel('type-picker')}>
                    <Icon.plus size={12} /> Add Exercise
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setShowLibrary(true); setLibSearchQuery(''); setLibLevelFilter(''); setLibTypeFilter(''); setLibSkillFilter(''); setLibPreviewEx(null); }} disabled={libraryExercises.length === 0}>
                    <Icon.book size={12} /> From Library
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setPreviewResponses({}); setStudentPreview(true); }} disabled={!form.exercises.some(isStructuredExercise)} title="Step through the whole homework exactly as the student will receive it">
                    <Icon.play size={12} /> Preview as student
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleAnalyzeLanguageDemand} disabled={generatingLangDemand || !form.exercises.length} title="Check vocabulary load and get pre-teaching suggestions">
                    <Icon.search size={12} /> {generatingLangDemand ? 'Analysing…' : 'Check Language Demands'}
                  </Button>
                </div>

                {activePanel === 'type-picker' && (
                  <ExerciseTypePicker
                    onSelect={addExercise}
                    onClose={() => setActivePanel(null)}
                    onAiGenerate={handleAiGenerateByType}
                    exerciseOptions={exerciseOptions}
                    onAddAiSuggestion={(ex) => { addAiExerciseToList(ex); setExerciseOptions(prev => prev.filter(e => e.id !== ex.id)); }}
                  />
                )}

                {/* ── Library browser ── */}
                {showLibrary && (() => {
                  const priorityItems = diagnosis ? getPriorityItems(diagnosis) : [];
                  const priorityAreas = [...new Set(priorityItems.map(p => (p.area || '').toLowerCase()))];
                  const allMetSkills = [...new Set(EX_TYPES.flatMap(t => t.metSkill.split(',').map(s => s.trim()).filter(Boolean)))];
                  const allLevels = [...new Set(libraryExercises.map(ex => ex.level).filter(Boolean))].sort();
                  const typeOrder = EX_TYPES.map(t => t.id);
                  const lowerQuery = libSearchQuery.toLowerCase();
                  const groupBy = (items, keyFn) => {
                    const map = new Map();
                    for (const item of items) {
                      const k = keyFn(item); if (!map.has(k)) map.set(k, []);
                      map.get(k).push(item);
                    } return map;
                  };
                  const filtered = libraryExercises.filter(ex => {
                    const typeMeta = getExType(ex.type);
                    if (!typeMeta) return false;
                    if (libTypeFilter && ex.type !== libTypeFilter) return false;
                    if (libLevelFilter && ex.level !== libLevelFilter) return false;
                    if (libSkillFilter) {
                      const exSkills = typeMeta.metSkill.split(',').map(s => s.trim());
                      if (!exSkills.includes(libSkillFilter)) return false;
                    }
                    if (!lowerQuery) return true;
                    const typeLabel = typeMeta.label.toLowerCase();
                    const tags = Array.isArray(ex.tags) ? ex.tags.join(' ').toLowerCase() : '';
                    return (ex.title || '').toLowerCase().includes(lowerQuery)
                      || typeLabel.includes(lowerQuery)
                      || tags.includes(lowerQuery)
                      || (ex.level || '').toLowerCase().includes(lowerQuery)
                      || (exercisePreview(ex) || '').toLowerCase().includes(lowerQuery);
                  });
                  const grouped = groupBy(filtered, ex => ex.type);
                  const sortedKeys = [...grouped.keys()].sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
                  return (
                    <div className="homework-library-panel">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Your Exercise Library</span>
                        <Button variant="ghost" size="sm" onClick={() => setShowLibrary(false)}>× Close</Button>
                      </div>

                      {/* ── Filter bar: Level, Type, Skill ── */}
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <select className="homework-lib-select" value={libLevelFilter} onChange={e => setLibLevelFilter(e.target.value)}>
                          <option value="">All Levels</option>
                          {allLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select className="homework-lib-select" value={libTypeFilter} onChange={e => setLibTypeFilter(e.target.value)}>
                          <option value="">All Types</option>
                          {EX_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        <select className="homework-lib-select" value={libSkillFilter} onChange={e => setLibSkillFilter(e.target.value)}>
                          <option value="">All Skills</option>
                          {allMetSkills.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>

                      {/* ── Search ── */}
                      <div className="search-input-wrap" style={{ marginBottom: 'var(--space-3)' }}>
                        <Icon.search size={15} />
                        <input type="text" className="search-input" placeholder="Search by title, type, tags, or level…"
                          value={libSearchQuery} onChange={e => setLibSearchQuery(e.target.value)} />
                        {libSearchQuery && (
                          <button className="search-clear" onClick={() => setLibSearchQuery('')}>
                            <Icon.close size={15} />
                          </button>
                        )}
                      </div>

                      {filtered.length === 0 ? (
                        <p className="card-row-meta" style={{ padding: 'var(--space-2) 0' }}>
                          {libraryExercises.length === 0
                            ? 'No saved exercises. In the homework builder, tap ☆ on any exercise to save it here.'
                            : 'No exercises match the current filters.'}
                        </p>
                      ) : (
                        <div>
                          {sortedKeys.map(typeId => {
                            const exType = EX_TYPES.find(t => t.id === typeId);
                            const items = grouped.get(typeId);
                            return (
                              <div key={typeId} style={{ marginBottom: 'var(--space-3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', padding: 'var(--space-1) 0' }}>
                                  <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>
                                    {exType?.label || typeId}
                                  </span>
                                  <span className="card-row-meta">{items.length}</span>
                                </div>
                                {items.map(ex => {
                                  const typeMeta = getExType(ex.type);
                                  const isRecommended = typeMeta && priorityAreas.some(area => area && typeMeta.metSkill.split(',').includes(area));
                                  return (
                                    <div key={ex.id} className="exercise-item" style={{ padding: 'var(--space-1) 0' }}>
                                      <ExTypeBadge typeId={ex.type} />
                                      {ex.title && (
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                                          {ex.title}
                                        </span>
                                      )}
                                      <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {exercisePreview(ex)}
                                      </span>
                                      {ex.level && <span className="card-row-meta">{ex.level}</span>}
                                      {ex.usageCount > 0 && <span className="card-row-meta">Used {ex.usageCount}×</span>}
                                      {isRecommended && (
                                        <span className="dx-match-badge" title="Matches a diagnosis priority area">Diagnosis</span>
                                      )}
                                      <div className="homework-lib-actions">
                                        <button className="homework-lib-preview-btn" onClick={() => setLibPreviewEx(ex)} title="Preview full exercise">
                                          <Icon.eye size={13} />
                                        </button>
                                        <Button variant="ghost" size="sm" onClick={() => addFromLibrary(ex)} style={{ flexShrink: 0 }}>Add</Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Library exercise preview modal ── */}
                <Modal open={!!libPreviewEx} onClose={() => setLibPreviewEx(null)} title="Exercise Preview" maxWidth={680}>
                  {libPreviewEx && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--divider)' }}>
                        <ExTypeBadge typeId={libPreviewEx.type} />
                        {libPreviewEx.level && <span className="card-row-meta" style={{ fontSize: 'var(--text-xs)' }}>{libPreviewEx.level}</span>}
                        {libPreviewEx.title && (
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>{libPreviewEx.title}</span>
                        )}
                      </div>
                      
                      <div style={{ 
                        padding: 'var(--space-4)', 
                        background: 'var(--surface)', 
                        borderRadius: 'var(--radius-2)', 
                        border: '1px solid var(--divider)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        minHeight: '200px'
                      }}>
                        <ExercisePlayer exercise={libPreviewEx} readOnly={true} />
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
                        <Button variant="ghost" size="sm" onClick={() => setLibPreviewEx(null)}>Close</Button>
                        <Button variant="primary" size="sm" onClick={() => { addFromLibrary(libPreviewEx); setLibPreviewEx(null); }}>
                          <Icon.plus size={13} /> Add to Homework
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </Modal>

                {/* ── SPACED REPETITION REVIEW ITEMS ── */}
                {reviewDueCount > 0 && (
                  <div className={`homework-review-block${includeReview ? ' homework-review-block--active' : ''}`}>
                    <div className="homework-review-row">
                      <div>
                        <div className="homework-review-title">
                          <span>Error Review ({reviewDueCount} item{reviewDueCount !== 1 ? 's' : ''} due)</span>
                          <span className="homework-review-pill">Spaced repetition</span>
                        </div>
                        <div className="homework-review-desc">
                          Past errors due for review. Each item becomes an <strong>MCQ</strong> exercise.
                        </div>
                      </div>
                      <label className="homework-review-toggle">
                        <input type="checkbox" className="homework-review-checkbox" checked={includeReview}
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
                          }} />
                        {includeReview ? 'Added' : `Add ${reviewDueCount} review item${reviewDueCount !== 1 ? 's' : ''}`}
                      </label>
                    </div>
                  </div>
                )}
                  
                {/* ── Exercise list ── */}
                <div ref={exerciseListRef} className="homework-exercise-list">
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

                {/* ── Cognitive sufficiency ── */}
                {(() => {
                  const warn = getHomeworkCognitiveSufficiencyWarning(form.exercises, diagnosis);
                  return warn ? (
                    <div className="homework-warning-note">
                      <Icon.spark size={13} className="homework-warning-icon" />
                      <span><strong>Cognitive sufficiency note:</strong> {warn}</span>
                    </div>
                  ) : null;
                })()}

                {/* ── Language Demand ── */}
                {languageDemand && (
                  <div className="homework-lang-demand">
                    <div className="homework-lang-demand-header">
                      <span className="homework-lang-demand-title">Language Demand Analysis</span>
                      <span className={`homework-demand-badge homework-demand-badge--${languageDemand.overall_demand === 'high' ? 'high' : languageDemand.overall_demand === 'medium' ? 'medium' : 'low'}`}>{languageDemand.overall_demand} demand</span>
                      <button className="homework-lang-demand-dismiss" onClick={() => setLanguageDemand(null)}>×</button>
                    </div>
                    {languageDemand.teacher_note && (
                      <p className="homework-lang-demand-note">{languageDemand.teacher_note}</p>
                    )}
                    <div className="homework-demand-actions">
                      {(languageDemand.priority_actions || []).map((action, i) => (
                        <div key={i} className="homework-demand-action-card">
                          <div className="homework-demand-action-type">{action.demand_type}</div>
                          <div className="homework-demand-action-desc">{action.description}</div>
                          <div className="homework-demand-action-rec">Recommend: {action.recommendation}</div>
                        </div>
                      ))}
                    </div>
                    {(languageDemand.tier2_vocabulary?.length > 0 || languageDemand.tier3_vocabulary?.length > 0) && (
                      <div className="homework-demand-vocab">
                        {languageDemand.tier2_vocabulary?.length > 0 && (
                          <div>
                            <div className="section-label" style={{ marginBottom: 4 }}>Tier 2 to pre-teach</div>
                            <div className="homework-demand-vocab-group">{languageDemand.tier2_vocabulary.join(' · ')}</div>
                          </div>
                        )}
                        {languageDemand.tier3_vocabulary?.length > 0 && (
                          <div>
                            <div className="section-label" style={{ marginBottom: 4 }}>Tier 3 to pre-teach</div>
                            <div className="homework-demand-vocab-group">{languageDemand.tier3_vocabulary.join(' · ')}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Assign ── */}
                <div ref={assignRef} className="homework-assign-section">
                  <div className="homework-assign-title">Assign homework</div>
                  <div className="homework-assign-fields">
                    {studentId || diagnosis?.studentId ? null : (
                      <Field label="Student">
                        <select className="input" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                          <option value="">Choose student</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </Field>
                    )}
                    <div className="homework-assign-grid">
                      <Field label="Homework Title">
                        <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                      </Field>
                      <Field label="Due Date">
                        <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                      </Field>
                    </div>
                  </div>
                  <div className="homework-assign-actions">
                    <Button variant="primary" onClick={handleAssign} disabled={saving}>
                      {saving ? 'Assigning…' : 'Assign Homework'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {currentStep === 4 && null}

        </div>

        {/* Persistent Summary Side Panel */}
        <Card className="homework-create-summary">
          <SectionHeader title="Homework Summary" />
          <div className="homework-create-summary-stats">
            <p>Exercises: <strong style={exerciseCount > 10 ? { color: 'var(--danger)' } : {}}>{exerciseCount} / 10</strong></p>
            <p>Est. time: <strong>~{Math.max(5, exerciseCount * 4)} min</strong></p>
          </div>
        </Card>
      </div>

      <Modal open={studentPreview} onClose={() => setStudentPreview(false)} title="Preview: student view" variant="fullscreen">
        <HomeworkStepThrough
          exercises={form.exercises.filter(isStructuredExercise)}
          responses={previewResponses}
          onResponse={(id, updated) => setPreviewResponses(prev => ({ ...prev, [id]: updated }))}
          onSubmit={() => setStudentPreview(false)}
          onSave={() => {}}
          readOnly={true}
        />
      </Modal>
    </div>
  );
}


function Field({ label, children, style }) {
  return (
    <label className="field" style={style}>
      <span className="section-label">{label}</span>
      {children}
    </label>
  );
}


