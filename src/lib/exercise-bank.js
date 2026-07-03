/**
 * exercise-bank.js — Ready-made MET vocabulary exercise library.
 * Loads the bundled bank and converts its 9 source formats into the
 * platform's 7 interactive exercise types (see exercise-types.js).
 */
import bank from '../data/exercises/vocabulary/met-vocab-bank.json';

let _seq = 0;
function exId() {
  return 'bank_' + Date.now().toString(36) + '_' + (++_seq).toString(36);
}

/** Public: list of modules with light metadata for the picker UI. */
export function getExerciseModules() {
  return (bank.modules || []).map(m => ({
    id: m.id,
    title: m.title,
    levelRange: m.levelRange,
    targetVocabulary: m.targetVocabulary || [],
    objectives: m.learningObjectives || [],
    exerciseCount: Array.isArray(m.exercises) ? m.exercises.length : 0,
  }));
}

export const bankMeta = {
  title: bank.title,
  subtitle: bank.subtitle,
  moduleCount: (bank.modules || []).length,
  exerciseCount: (bank.modules || []).reduce((n, m) => n + (m.exercises?.length || 0), 0),
};

const optText = (options, id) => (options.find(o => o.id === id) || {}).text || '';

/** Convert one bank exercise (which may hold several `items`) into platform exercises. */
function convertExercise(ex) {
  const out = [];
  const items = Array.isArray(ex.items) ? ex.items : null;

  switch (ex.type) {
    case 'speak': {
      out.push({
        id: exId(),
        type: 'speak',
        title: ex.title || '',
        prompt: ex.prompt || ex.instructions || '',
        targetSeconds: ex.targetSeconds || 60,
        metTask: ex.metTask || '',
        scaffolding: ex.scaffolding || { vocabulary: [], structure: [] },
        imageUrl: ex.imageUrl || '',
        imageAlt: ex.imageAlt || '',
      });
      break;
    }

    case 'multiple_choice_single':
    case 'multiple_choice_multiple': {
      (items || []).forEach(it => {
        const options = (it.options || []).map(o => o.text);
        const firstCorrect = (it.correctOptionIds || [])[0];
        const correct = (it.options || []).findIndex(o => o.id === firstCorrect);
        out.push({
          id: exId(), type: 'mcq',
          question: it.prompt,
          options: options.length ? options : ['', '', '', ''],
          correct: correct >= 0 ? correct : null,
          explanation: it.explanation || '',
        });
      });
      break;
    }

    case 'true_false_with_explanation': {
      (items || []).forEach(it => {
        out.push({
          id: exId(), type: 'mcq',
          question: it.statement,
          options: ['True', 'False'],
          correct: it.correctAnswer === true ? 0 : 1,
          explanation: it.explanation || it.modelExplanation || '',
        });
      });
      break;
    }

    case 'fill_in_the_blank': {
      (items || []).forEach(it => {
        // Bank sentences already contain "______"; platform splits on 3+ underscores.
        out.push({
          id: exId(), type: 'blank',
          template: it.sentence,
          blanks: [it.correctAnswer || ''],
          explanation: it.explanation || '',
        });
      });
      break;
    }

    case 'timed_quick_fire': {
      (items || []).forEach(it => {
        const answers = (it.acceptedAnswers && it.acceptedAnswers.length ? it.acceptedAnswers : [it.correctAnswer]).filter(Boolean);
        out.push({
          id: exId(), type: 'blank',
          template: `${it.prompt} ______`,
          blanks: [answers.join('|')],
          explanation: it.explanation || '',
        });
      });
      break;
    }

    case 'ordering_sequencing': {
      (items || []).forEach(it => {
        const byId = Object.fromEntries((it.sentences || []).map(s => [s.id, s.text]));
        const ordered = (it.correctOrder || []).map(id => byId[id]).filter(Boolean);
        if (ordered.length >= 2) {
          out.push({ id: exId(), type: 'order', sentences: ordered });
        }
      });
      break;
    }

    case 'drag_and_drop_matching': {
      const pairs = (ex.pairs || []).map(p => ({ term: p.word, def: p.definition })).filter(p => p.term || p.def);
      if (pairs.length) out.push({ id: exId(), type: 'flash', pairs });
      break;
    }

    case 'short_answer_reflection': {
      out.push({
        id: exId(), type: 'short',
        prompt: ex.prompt || ex.instructions || '',
        rubric: ex.instructions || 'Answer in 3–5 sentences using the target vocabulary.',
        targetWords: 80,
        modelResponse: ex.modelResponse || '',
      });
      break;
    }

    case 'interactive_scenario_case_study': {
      const body = [ex.scenario, ex.task].filter(Boolean).join('\n\n');
      out.push({
        id: exId(), type: 'short',
        prompt: body || ex.instructions || '',
        rubric: ex.instructions || 'Read the situation and write a clear, polite B2-level response.',
        targetWords: 90,
        modelResponse: ex.modelResponse || '',
      });
      break;
    }

    default:
      break;
  }

  return out;
}

/** Convert every exercise in a module into a flat list of platform exercises. */
export function getModuleExercises(moduleId) {
  const m = (bank.modules || []).find(x => x.id === moduleId);
  if (!m) return [];
  return (m.exercises || []).flatMap(convertExercise);
}
