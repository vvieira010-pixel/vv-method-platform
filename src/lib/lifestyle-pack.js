/**
 * lifestyle-pack.js — Adapter for the bundled Lifestyle B1-B2 JSON/Markdown pack.
 * Converts the source teaching pack into the platform homework exercise shape.
 */
import pack from '../components/exercises/lifestyle_b1_b2_platform_pack.json';
import printableMarkdown from '../components/exercises/lifestyle_b1_b2_printable_pack.md?raw';

let _seq = 0;
function packId(prefix = 'life') {
  return `${prefix}_${Date.now().toString(36)}_${(++_seq).toString(36)}`;
}

const titleCase = (s) => String(s || '').replace(/(^|\s)\w/g, c => c.toUpperCase());

function answerToIndex(answer, options = []) {
  if (typeof answer === 'number') return answer;
  const raw = String(answer || '').trim();
  if (/^[A-D]$/i.test(raw)) return raw.toUpperCase().charCodeAt(0) - 65;
  const idx = options.findIndex(opt => String(opt).trim().toLowerCase() === raw.toLowerCase());
  return idx >= 0 ? idx : 0;
}

function countBlanks(text) {
  return (String(text || '').match(/_{3,}/g) || []).length;
}

function normalizeAnswerForBlanks(answer, blanksInLine) {
  const raw = String(answer || '').trim();
  if (blanksInLine > 1 && raw.includes('/')) {
    return raw.split('/').map(part => part.trim()).filter(Boolean).slice(0, blanksInLine);
  }
  return [raw.replace(/\s+\/\s+/g, '|')];
}

function extractBlanks(task, answerKey) {
  const lines = Array.isArray(task) ? task : String(task || '').split(/\n+/).filter(Boolean);
  const blanks = [];
  lines.forEach(line => {
    const match = String(line).match(/^\s*(\d+)[).]/);
    const key = match?.[1];
    if (!key || answerKey?.[key] == null) return;
    blanks.push(...normalizeAnswerForBlanks(answerKey[key], countBlanks(line)));
  });
  return blanks;
}

function makeMcq({ title, skill, level, context, question, options, answer, explanation, sourceId }) {
  const normalizedOptions = (options || []).filter(Boolean);
  if (!question || normalizedOptions.length < 2) return null;
  return {
    id: packId(sourceId || 'life_mcq'),
    type: 'mcq',
    title,
    skill,
    level,
    context,
    question,
    options: normalizedOptions,
    correct: answerToIndex(answer, normalizedOptions),
    explanation: explanation || '',
  };
}

function convertReading(item) {
  return (item.questions || []).map((q, idx) => {
    const options = q.type === 'true_false' ? ['True', 'False'] : (q.options || []);
    return makeMcq({
      title: `${item.title} — Question ${idx + 1}`,
      skill: 'Reading',
      level: item.difficulty,
      context: item.passage,
      question: q.question,
      options,
      answer: q.type === 'true_false' ? q.answer : q.answer,
      explanation: q.explanation || item.teaching_note || '',
      sourceId: item.id,
    });
  }).filter(Boolean);
}

function buildListeningOptions(question, allQuestions) {
  const answer = String(question.answer || '').trim();
  const distractors = (allQuestions || [])
    .map(q => String(q.answer || '').trim())
    .filter(a => a && a.toLowerCase() !== answer.toLowerCase())
    .slice(0, 3);
  const fallback = ['Not mentioned in the conversation', 'Before the conversation started', 'At the end of the week'];
  const options = [answer || 'Not mentioned', ...distractors, ...fallback]
    .filter(Boolean)
    .filter((value, index, arr) => arr.findIndex(v => v.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 4);
  while (options.length < 4) options.push(`Option ${options.length + 1}`);
  return options;
}

function convertListening(item) {
  return (item.while_listening || []).map((q, idx) => {
    const options = buildListeningOptions(q, item.while_listening);
    return {
      id: packId(item.id),
      type: 'listen',
      title: `${item.title} — Listening ${idx + 1}`,
      skill: 'Listening',
      level: item.difficulty,
      audioText: item.script || '',
      plays: 2,
      question: q.question,
      options,
      correct: 0,
      explanation: `Correct answer: ${q.answer}`,
      pictureHint: item.pre_listening || '',
    };
  }).filter(ex => ex.audioText && ex.question && ex.options.length >= 2);
}

function targetSeconds(timing) {
  const match = String(timing || '').match(/Speaking:\s*(\d+)\s*seconds?/i) || String(timing || '').match(/(\d+)\s*seconds?/i);
  return match ? Number(match[1]) : 60;
}

function convertSpeaking(item) {
  const followUps = item.follow_up_questions || item.discussion_questions || [];
  const vocabulary = item.target_language || [];
  return [{
    id: packId(item.id),
    type: 'speak',
    title: item.title,
    skill: 'Speaking',
    level: item.difficulty,
    prompt: [item.setup, item.instructions, followUps.length ? `Follow-up: ${followUps.join(' ')}` : ''].filter(Boolean).join('\n\n'),
    targetSeconds: targetSeconds(item.timing),
    scaffolding: { vocabulary, structure: vocabulary },
  }];
}

function convertWriting(item) {
  return [{
    id: packId(item.id),
    type: 'short',
    title: item.title,
    skill: 'Writing',
    level: item.difficulty,
    prompt: item.prompt,
    rubric: (item.success_criteria || []).join(' | ') || item.genre || 'Write a clear, organized response.',
    targetWords: Number(String(item.word_count || '').match(/\d+/)?.[0]) || 120,
  }];
}

function convertVocabulary(item) {
  const pairs = Object.entries(item.target_words || {}).map(([term, def]) => ({ term, def }));
  if (item.exercise_type === 'matching') {
    return [{
      id: packId(item.id),
      type: 'flash',
      title: item.title,
      skill: 'Vocabulary',
      level: item.difficulty,
      pairs,
    }];
  }
  const blanks = extractBlanks(item.task, item.answer_key);
  return [{
    id: packId(item.id),
    type: 'blank',
    title: item.title,
    skill: 'Vocabulary',
    level: item.difficulty,
    template: String(item.task || '').replace(/___/g, '______'),
    blanks,
    explanation: pairs.map(p => `${p.term}: ${p.def}`).join('\n'),
  }];
}

function convertGrammar(item) {
  const template = (Array.isArray(item.task) ? item.task.join('\n') : String(item.task || '')).replace(/___/g, '______');
  return [{
    id: packId(item.id),
    type: 'blank',
    title: item.title,
    skill: 'Grammar',
    level: item.difficulty,
    template,
    blanks: extractBlanks(item.task, item.answer_key),
    explanation: [item.focus, ...(item.examples || [])].filter(Boolean).join('\n'),
  }];
}

const CONVERTERS = {
  reading: convertReading,
  listening: convertListening,
  speaking: convertSpeaking,
  writing: convertWriting,
  vocabulary: convertVocabulary,
  grammar: convertGrammar,
};

export function getLifestyleModules() {
  return Object.entries(pack.sections || {}).map(([key, section]) => {
    const exercises = (section.exercises || []).flatMap(item => CONVERTERS[key]?.(item) || []);
    return {
      id: key,
      label: `${titleCase(key)} practice`,
      skill: key,
      note: section.section_note || '',
      sourceCount: section.exercises?.length || 0,
      exerciseCount: exercises.length,
    };
  });
}

export function getLifestyleModuleExercises(moduleId) {
  const section = pack.sections?.[moduleId];
  const converter = CONVERTERS[moduleId];
  if (!section || !converter) return [];
  return (section.exercises || []).flatMap(item => converter(item));
}

export const lifestylePackMeta = {
  title: pack.title || 'Lifestyle English Practice Pack',
  subtitle: pack.theme || '',
  level: pack.level || 'B1-B2',
  note: pack.platform_note || '',
  printableMarkdown,
};
