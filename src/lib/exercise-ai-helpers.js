import { createExercise, exId } from './exercise-types.js';

const MET_BALANCED_TYPES = ['speak', 'short', 'listen', 'mcq', 'blank', 'flash', 'fix'];

export function mapAiType(aiType) {
  const t = (aiType || '').toLowerCase();
  if (/multiple.?choice|mcq/.test(t)) return 'mcq';
  if (/fill|blank/.test(t)) return 'blank';
  if (/writ|essay|paragraph|response/.test(t)) return 'short';
  if (/speak|audio|record/.test(t)) return 'speak';
  if (/order|sequen/.test(t)) return 'order';
  if (/error|correct|fix/.test(t)) return 'fix';
  if (/flash|card|vocab/.test(t)) return 'flash';
  if (/listen/.test(t)) return 'listen';
  if (/read|strategy|test/.test(t)) return 'read';
  return 'short';
}

export function normalizeTaskTypes(taskTypes) {
  const fromAi = Array.isArray(taskTypes) ? taskTypes.map(mapAiType) : [];
  const merged = [...fromAi, ...MET_BALANCED_TYPES].filter((type, idx, arr) => arr.indexOf(type) === idx);
  return merged.slice(0, 7);
}

export function buildCompleteExercises(items, options = {}) {
  const exercises = [];
  let skipped = 0;
  for (const item of Array.isArray(items) ? items : []) {
    const exercise = createCompleteExercise(item, options);
    if (exercise) exercises.push(exercise);
    else skipped += 1;
  }
  return { exercises, skipped };
}

export function createCompleteExercise(aiTask, { defaultSkillGroup } = {}) {
  if (!aiTask || typeof aiTask !== 'object') return null;
  let type = mapAiType(aiTask.type || defaultSkillGroup);
  if (defaultSkillGroup === 'listening' && type !== 'listen') type = 'listen';
  if (defaultSkillGroup === 'reading' && type !== 'read') type = 'read';
  const ex = applyAiTaskToExercise(createExercise(type, aiTask.level || 'B1'), { ...aiTask, skillGroup: aiTask.skillGroup || defaultSkillGroup });
  return isStructuredAiExerciseComplete(ex) ? ex : null;
}

export function isStructuredAiExerciseComplete(ex) {
  if (!ex || !ex.type) return false;
  if (ex.type === 'mcq') {
    return Boolean(ex.question)
      && (ex.options || []).filter(Boolean).length === 4
      && ex.correct !== null
      && ex.correct !== undefined
      && Boolean(ex.explanation);
  }
  if (ex.type === 'blank') {
    const blankCount = (String(ex.template || '').match(/_{3,}/g) || []).length;
    return Boolean(ex.template) && blankCount > 0 && (ex.blanks || []).filter(Boolean).length >= blankCount;
  }
  if (ex.type === 'short') return Boolean(ex.prompt) && Boolean(ex.rubric) && Number(ex.targetWords) > 0;
  if (ex.type === 'speak') return Boolean(ex.prompt) && Number(ex.targetSeconds) > 0;
  if (ex.type === 'order') return (ex.sentences || []).filter(Boolean).length >= 3;
  if (ex.type === 'fix') return Boolean(ex.errorText) && Boolean(ex.correctedText) && Boolean(ex.hint);
  if (ex.type === 'flash') return (ex.pairs || []).filter(p => p.term && p.def).length >= 10;
  if (ex.type === 'listen') {
    return Boolean(ex.audioText)
      && Boolean(ex.question)
      && (ex.options || []).filter(Boolean).length === 4
      && ex.correct !== null
      && ex.correct !== undefined
      && Boolean(ex.explanation);
  }
  if (ex.type === 'read') {
    return Boolean(ex.passage)
      && (ex.questions || []).filter(q => q.question && (q.options || []).filter(Boolean).length === 4 && q.correct !== null).length >= 1;
  }
  if (ex.type === 'dialogue') return (ex.lines || []).filter(l => l.text?.trim()).length >= 2;
  if (ex.type === 'swap') return ex.sentence?.includes('[') && (ex.swaps || []).length > 0 && ex.swaps.every(s => s.options?.filter(Boolean).length >= 2);
  if (ex.type === 'levelup') return !!(ex.b1 && ex.b2 && (ex.options || []).filter(Boolean).length >= 2 && ex.correct !== null);
  return false;
}

export function getHomeworkCognitiveSufficiencyWarning(exercises, diagnosis) {
  const priorities = Array.isArray(diagnosis?.priorityDiagnosis)
    ? diagnosis.priorityDiagnosis
    : Array.isArray(diagnosis?.sections?.priorityDiagnosis?.content)
      ? diagnosis.sections.priorityDiagnosis.content
      : [];
  const topPriority = (priorities[0]?.area || '').toLowerCase();
  const isProductionPriority = /speak|writ|produc/.test(topPriority);
  if (!isProductionPriority) return null;
  const hasProductionExercise = exercises.some(e => e.type === 'speak' || e.type === 'short');
  if (!hasProductionExercise) {
    return `Diagnosis priority is "${priorities[0]?.area}" but no speaking or writing exercise is included. Consider adding at least one.`;
  }
  return null;
}

export function applyAiTaskToExercise(exercise, aiTask) {
  const ex = { ...exercise };
  const content = aiTask?.content || aiTask?.description || aiTask?.question || aiTask?.prompt || aiTask?.title || '';
  if (aiTask?.title) ex.title = aiTask.title;
  if (aiTask?.skillGroup) ex.skillGroup = aiTask.skillGroup;
  if (aiTask?.teacherNote) ex.teacherNote = aiTask.teacherNote;

  if (ex.type === 'mcq') {
    const options = normalizeMcqOptions(aiTask?.options);
    ex.question = aiTask?.question || content;
    ex.options = options;
    ex.correct = normalizeCorrectIndex(aiTask?.correct, options.length);
    ex.explanation = aiTask?.explanation || aiTask?.rationale || aiTask?.teacherNote || 'The correct answer best matches the MET skill focus in this item.';
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
    ex.hint = aiTask?.hint || aiTask?.teacherNote || '';
    return ex;
  }

  if (ex.type === 'flash') {
    ex.pairs = normalizeFlashPairs(aiTask?.pairs || aiTask?.cards || aiTask?.items || aiTask?.terms);
    return ex;
  }

  if (ex.type === 'speak') {
    ex.prompt = aiTask?.prompt || content;
    ex.targetSeconds = normalizeTargetSeconds(aiTask?.targetSeconds, aiTask?.duration);
    if (aiTask?.imageUrl) ex.imageUrl = aiTask.imageUrl;
    if (aiTask?.imageAlt) ex.imageAlt = aiTask.imageAlt;
    if (aiTask?.imageDescription) ex.imageDescription = aiTask.imageDescription;
    return ex;
  }

  if (ex.type === 'read') {
    ex.passage = aiTask?.passage || aiTask?.text || content;
    ex.source = aiTask?.source || '';
    const aiQs = Array.isArray(aiTask?.questions) ? aiTask.questions : [];
    ex.questions = aiQs.length
      ? aiQs.map(q => ({
          id: exId(),
          question: q.question || '',
          options: normalizeMcqOptions(q.options),
          correct: normalizeCorrectIndex(q.correct, 4),
          explanation: q.explanation || '',
        }))
      : ex.questions;
    return ex;
  }

  if (ex.type === 'listen') {
    const options = normalizeMcqOptions(aiTask?.options);
    ex.audioText = aiTask?.audioText || aiTask?.script || content;
    ex.question = aiTask?.question || 'What is the speaker mainly trying to do?';
    ex.options = options;
    ex.correct = normalizeCorrectIndex(aiTask?.correct, options.length);
    ex.explanation = aiTask?.explanation || aiTask?.rationale || aiTask?.teacherNote || 'The correct answer follows from the speaker purpose and key details in the audio.';
    ex.plays = Number.isFinite(Number(aiTask?.plays)) ? Number(aiTask.plays) : 2;
    if (aiTask?.pictureHint) ex.pictureHint = aiTask.pictureHint;
    return ex;
  }

  ex.prompt = aiTask?.prompt || content;
  ex.rubric = aiTask?.rubric || aiTask?.teacherNote || 'Answer the question clearly, support your idea with one example, and check grammar before submitting.';
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
  if (typeof correct === 'string') {
    const trimmed = correct.trim().toUpperCase();
    if (/^[A-D]$/.test(trimmed)) return trimmed.charCodeAt(0) - 65;
  }
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
    .map(p => {
      if (typeof p === 'string') {
        const [term, ...rest] = p.split(/[:–-]/);
        return { term: term?.trim() || '', def: rest.join('-').trim() };
      }
      return { term: p?.term || p?.word || p?.phrase || '', def: p?.def || p?.definition || p?.meaning || '' };
    })
    .filter(p => p.term || p.def);
  const filled = clean.filter(p => p.term && p.def);
  if (filled.length === 0) return [{ term: '', def: '' }];
  const fallback = [
    { term: 'main idea', def: 'the central point of a passage or conversation' },
    { term: 'specific detail', def: 'a fact or piece of information stated in the text' },
    { term: 'inference', def: 'a conclusion based on evidence, not directly stated' },
    { term: 'speaker purpose', def: 'the reason a speaker says something' },
    { term: 'supporting example', def: 'a detail that makes an answer stronger' },
    { term: 'transition', def: 'a word or phrase that connects ideas clearly' },
    { term: 'collocation', def: 'words that naturally go together' },
    { term: 'distractor', def: 'an answer choice that sounds possible but is not correct' },
    { term: 'task completion', def: 'answering all parts of the question' },
    { term: 'clarify', def: 'to make something easier to understand' },
  ];
  const seen = new Set(filled.map(p => p.term.toLowerCase()));
  for (const pair of fallback) {
    if (filled.length >= 10) break;
    if (!seen.has(pair.term.toLowerCase())) filled.push(pair);
  }
  return filled;
}

function normalizeTargetSeconds(targetSeconds, duration) {
  const parsed = Number(targetSeconds);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const durMatch = String(duration || '').match(/\d+/);
  if (durMatch) return Math.max(30, Number(durMatch[0]) * 60);
  return 60;
}

export function buildExercisesFromAiTasks(tasks, fallback) {
  const built = (tasks || []).map(t => createExerciseFromAiTask(t)).filter(Boolean);
  return built.length > 0 ? built : fallback;
}

export function fillSelectedExercisesWithAi(exercises, tasks) {
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
