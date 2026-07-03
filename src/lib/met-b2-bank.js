import listeningData from '../data/exercises/listening/b2-listening.json';
import readingData from '../data/exercises/reading/b2-reading.json';
import writingData from '../data/exercises/writing/b2-writing.json';
import speakingData from '../data/exercises/speaking/b2-speaking.json';
import grammarData from '../data/exercises/grammar/b2-grammar.json';
import { listeningModules, getSupabaseListeningModules } from './met-listening-bank.js';

let _counter = 0;
function bankId() {
  return 'b2_' + Date.now().toString(36) + '_' + (++_counter).toString(36);
}

function convertItem(moduleType, item) {
  switch (moduleType) {
    case 'listening_set':
      return (item.questions || []).map(q => ({
        id: bankId(),
        type: 'listen',
        level: 'B2',
        audioText: item.script,
        plays: 2,
        question: q.stem,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        pictureHint: '',
      }));

    case 'reading_set':
      return (item.questions || []).map(q => ({
        id: bankId(),
        type: 'mcq',
        level: 'B2',
        context: item.passage,
        question: q.stem,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      }));

    case 'tfng_set':
      return (item.statements || []).map(s => ({
        id: bankId(),
        type: 'mcq',
        level: 'B2',
        context: item.passage,
        question: s.text,
        options: ['True', 'False', 'Not Given'],
        correct: s.correct,
        explanation: s.explanation,
      }));

    case 'mcq_set':
      return [{
        id: bankId(),
        type: 'mcq',
        level: 'B2',
        question: item.stem,
        options: item.options,
        correct: item.correct,
        explanation: item.explanation,
      }];

    case 'exercise_list':
      return (item.exercises || []).map(ex => ({ ...ex, id: bankId() }));

    default:
      return [];
  }
}

function buildModule(mod) {
  let exercises;
  if (mod.moduleType === 'exercise_list') {
    exercises = (mod.exercises || []).map(ex => ({ ...ex, id: bankId() }));
  } else {
    exercises = (mod.items || []).flatMap(item => convertItem(mod.moduleType, item));
  }
  return {
    id: mod.id,
    label: mod.title,
    skill: mod.skill,
    topic: mod.topic || mod.title.split(':')[0].trim() || mod.title,
    level: mod.levelRange || 'B2',
    exercises,
  };
}

const _allModules = [
  ...listeningData.modules.map(buildModule),
  ...readingData.modules.map(buildModule),
  ...writingData.modules.map(buildModule),
  ...speakingData.modules.map(buildModule),
  ...grammarData.modules.map(buildModule),
  ...listeningModules,
];

export const b2BankMeta = {
  id: 'met_b2_skills',
  title: 'MET B2 Skills Exercise Pack',
  subtitle: 'Authentic B2 exercises across Listening, Reading, Writing, Speaking, and Grammar',
  level: 'B2',
  moduleCount: _allModules.length,
  exerciseCount: _allModules.reduce((n, m) => n + m.exercises.length, 0),
};

export function getB2Modules() {
  return _allModules;
}

export function getB2ModuleExercises(moduleId) {
  const mod = _allModules.find(m => m.id === moduleId);
  return mod ? mod.exercises : [];
}

export async function getB2ModulesWithSupabase() {
  const supabaseMods = await getSupabaseListeningModules();
  return [..._allModules, ...supabaseMods];
}

export async function getB2ModuleExercisesWithSupabase(moduleId) {
  const local = getB2ModuleExercises(moduleId);
  if (local.length > 0) return local;
  const all = await getB2ModulesWithSupabase();
  const mod = all.find(m => m.id === moduleId);
  return mod ? mod.exercises : [];
}
