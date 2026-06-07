import bankData from '../data/met-b2-skills-bank.json';

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
    level: mod.levelRange || 'B2',
    exercises,
  };
}

const _modules = bankData.modules.map(buildModule);

export const b2BankMeta = {
  id: 'met_b2_skills',
  title: bankData.title,
  subtitle: bankData.subtitle,
  level: bankData.level,
  moduleCount: _modules.length,
  exerciseCount: _modules.reduce((n, m) => n + m.exercises.length, 0),
};

export function getB2Modules() {
  return _modules;
}

export function getB2ModuleExercises(moduleId) {
  const mod = _modules.find(m => m.id === moduleId);
  return mod ? mod.exercises : [];
}
