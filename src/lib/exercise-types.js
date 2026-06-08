/**
 * exercise-types.js — Central registry for the 8 interactive exercise types.
 * Provides metadata, factory functions, and auto-grading logic.
 */

/* ─── TYPE REGISTRY ─────────────────────────────────────────── */
export const EX_TYPES = [
  { id: 'mcq',    label: 'Multiple Choice',  iconKey: 'check',    color: '#0A2C56', bg: 'rgba(11,79,74,.12)',   hint: 'Single best answer',          grading: 'auto'  },
  { id: 'blank',  label: 'Fill the Blank',   iconKey: 'spark',    color: '#25557A', bg: 'rgba(37,85,122,.12)',  hint: '1–3 blanks per item',         grading: 'auto'  },
  { id: 'short',  label: 'Short Answer',     iconKey: 'doc',      color: '#B8761A', bg: 'rgba(184,118,26,.12)', hint: 'Teacher-reviewed response',   grading: 'ai'    },
  { id: 'speak',  label: 'Speaking Prompt',  iconKey: 'mic',      color: '#8A2B26', bg: 'rgba(138,43,38,.12)',  hint: 'Audio + optional transcript', grading: 'ai'    },
  { id: 'order',  label: 'Order Sentences',  iconKey: 'bolt',     color: '#5A2C5C', bg: 'rgba(90,44,92,.12)',   hint: 'Sequence the steps',          grading: 'auto'  },
  { id: 'fix',    label: 'Error Correction', iconKey: 'search',   color: '#2E6A3F', bg: 'rgba(46,106,63,.12)',  hint: 'Find & fix in a passage',     grading: 'auto'  },
  { id: 'flash',  label: 'Flashcards',       iconKey: 'homework', color: '#1A1F1E', bg: 'rgba(26,31,30,.08)',   hint: 'Term/definition pairs',       grading: 'track' },
  { id: 'listen',   label: 'Listening',          iconKey: 'inbox',    color: '#0E5F6B', bg: 'rgba(14,95,107,.12)',  hint: 'Hear audio, answer question',   grading: 'auto'  },
  { id: 'dialogue', label: 'Dialogue Practice',  iconKey: 'mic',      color: '#0E5F6B', bg: 'rgba(14,95,107,.10)',  hint: 'Role-play conversation',        grading: 'track' },
  { id: 'swap',     label: 'Synonym Swapper',    iconKey: 'spark',    color: '#5A2C5C', bg: 'rgba(90,44,92,.12)',   hint: 'Click to upgrade B1 words to B2', grading: 'auto' },
  { id: 'levelup',  label: 'Sentence Level-Up',  iconKey: 'bolt',     color: '#1A5C2A', bg: 'rgba(26,92,42,.12)',   hint: 'B1 → B2 → C1 upgrade challenge', grading: 'auto' },
];

/** Look up a type by id */
export function getExType(id) {
  return EX_TYPES.find(t => t.id === id) || null;
}

/** Check if an activity object is a structured exercise (has a recognized type) */
export function isStructuredExercise(activity) {
  return activity && EX_TYPES.some(t => t.id === activity.type);
}

/* ─── EXERCISE FACTORIES ────────────────────────────────────── */

let _exCounter = 0;
function exId() {
  return 'ex_' + Date.now().toString(36) + '_' + (++_exCounter).toString(36);
}

const FACTORIES = {
  mcq:    () => ({ id: exId(), type: 'mcq',    question: '', options: ['', '', '', ''], correct: null }),
  blank:  () => ({ id: exId(), type: 'blank',  template: '', blanks: [] }),
  short:  () => ({ id: exId(), type: 'short',  prompt: '', rubric: '', targetWords: 120, scaffolding: { vocabulary: [], structure: [] } }),
  speak:  () => ({ id: exId(), type: 'speak',  prompt: '', targetSeconds: 60, scaffolding: { vocabulary: [], structure: [] } }),
  order:  () => ({ id: exId(), type: 'order',  sentences: [''] }),
  fix:    () => ({ id: exId(), type: 'fix',    errorText: '', correctedText: '', hint: '' }),
  flash:  () => ({ id: exId(), type: 'flash',  pairs: [{ term: '', def: '' }] }),
  listen:   () => ({ id: exId(), type: 'listen',   audioText: '', plays: 0, question: '', options: ['', '', '', ''], correct: null, explanation: '', pictureHint: '' }),
  dialogue: () => ({ id: exId(), type: 'dialogue', speakerA: 'Speaker A', speakerB: 'Speaker B', instruction: '', lines: [{ id: exId(), speaker: 'A', text: '' }, { id: exId(), speaker: 'B', text: '' }] }),
  swap:     () => ({ id: exId(), type: 'swap',     instruction: '', sentence: '', swaps: [] }),
  levelup:  () => ({ id: exId(), type: 'levelup',  b1: '', b2: '', c1: '', options: ['', '', ''], correct: 0, keywords: [], explanation: '' }),
};

/**
 * Create a new empty exercise of the given type.
 * @param {'mcq'|'blank'|'short'|'speak'|'order'|'fix'|'flash'|'listen'} type
 * @param {string} [level='B1'] Proficiency level (e.g., 'A2', 'B1', 'B2')
 * @returns {object} exercise object with default fields
 */
export function createExercise(type, level = 'B1') {
  const factory = FACTORIES[type];
  if (!factory) throw new Error(`Unknown exercise type: ${type}`);
  return { ...factory(), level };
}

/* ─── AUTO-GRADING ──────────────────────────────────────────── */

/**
 * Auto-grade a student response against the exercise answer key.
 * Only works for auto-gradable types (mcq, blank, order, fix).
 * @param {object} exercise — the exercise definition
 * @param {object} response — the student's response
 * @returns {{ correct: boolean, score: number, feedback: string } | null}
 */
export function autoGrade(exercise, response) {
  if (!exercise || !response) return null;

  switch (exercise.type) {
    case 'mcq': {
      const isCorrect = response.selected === exercise.correct;
      return {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? 'Correct!'
          : `The correct answer was option ${String.fromCharCode(65 + exercise.correct)}.`,
      };
    }

    case 'blank': {
      const studentBlanks = response.blanks || [];
      const correctBlanks = exercise.blanks || [];
      let hits = 0;
      correctBlanks.forEach((answer, i) => {
        const student = (studentBlanks[i] || '').trim().toLowerCase();
        // answer can be pipe-separated alternatives: "have been working|have worked"
        const accepted = answer.split('|').map(a => a.trim().toLowerCase());
        if (accepted.includes(student)) hits++;
      });
      const total = correctBlanks.length || 1;
      return {
        correct: hits === total,
        score: hits / total,
        feedback: hits === total
          ? 'All blanks correct!'
          : `${hits}/${total} blanks correct.`,
      };
    }

    case 'order': {
      const studentOrder = response.order || [];
      const correctOrder = (exercise.sentences || []).map((_, i) => i);
      const isCorrect = studentOrder.length === correctOrder.length
        && studentOrder.every((idx, i) => idx === correctOrder[i]);
      let inPlace = 0;
      studentOrder.forEach((idx, i) => { if (idx === i) inPlace++; });
      const total = correctOrder.length || 1;
      return {
        correct: isCorrect,
        score: inPlace / total,
        feedback: isCorrect
          ? 'Perfect order!'
          : `${inPlace}/${total} sentences in the right position.`,
      };
    }

    case 'fix': {
      // Normalize so a correct fix isn't marked wrong over cosmetic differences
      // (curly vs straight quotes, trailing punctuation, double spaces).
      const norm = (s) => (s || '')
        .trim().toLowerCase()
        .replace(/[‘’]/g, "'")      // curly → straight apostrophes
        .replace(/[“”]/g, '"')      // curly → straight quotes
        .replace(/\s+/g, ' ')                  // collapse whitespace
        .replace(/\s*([.,;:!?])/g, '$1')       // no space before punctuation
        .replace(/[.!?]+$/g, '');              // ignore trailing sentence punctuation
      const isCorrect = norm(response.text) === norm(exercise.correctedText);
      return {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? 'All errors fixed!'
          : 'Some errors remain — keep checking.',
      };
    }

    case 'listen': {
      const isCorrect = response.selected === exercise.correct;
      return {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? 'Correct!'
          : `The correct answer was option ${String.fromCharCode(65 + exercise.correct)}.`,
      };
    }

    default:
      return null; // Teacher-reviewed or tracked types
  }
}

/* ─── RESPONSE SHAPE HELPERS ────────────────────────────────── */

/**
 * Create an empty response object for the given exercise type.
 * Useful for initializing student state.
 */
export function createEmptyResponse(type) {
  switch (type) {
    case 'mcq':   return { selected: null };
    case 'blank': return { blanks: [] };
    case 'short': return { text: '' };
    case 'speak':  return { audioB64: null, transcript: '' };
    case 'order':  return { order: [] };
    case 'fix':    return { text: '' };
    case 'flash':  return { idx: 0, learned: 0 };
    case 'listen':   return { selected: null };
    case 'dialogue': return { mode: 'read', linesRevealed: [] };
    case 'swap':     return { swaps: {} };
    case 'levelup':  return { selected: null, sandbox: '' };
    default:         return {};
  }
}

/* ─── PREVIEW HELPERS ───────────────────────────────────────── */

/**
 * Get a short preview string for an exercise (for collapsed card view).
 */
export function exercisePreview(exercise) {
  if (!exercise) return '';
  switch (exercise.type) {
    case 'mcq':   return exercise.question || 'Multiple choice question…';
    case 'blank': return exercise.template || 'Fill-in-the-blank sentence…';
    case 'short': return exercise.prompt || 'Short answer prompt…';
    case 'speak': return exercise.prompt || 'Speaking prompt…';
    case 'order': return (exercise.sentences || []).filter(Boolean)[0] || 'Order sentences…';
    case 'fix':   return (exercise.errorText || '').slice(0, 80) || 'Error correction passage…';
    case 'flash': {
      const count = (exercise.pairs || []).filter(p => p.term || p.def).length;
      return `${count} flashcard${count !== 1 ? 's' : ''}`;
    }
    case 'listen':   return exercise.question || 'Listening question…';
    case 'dialogue': {
      const count = (exercise.lines || []).filter(l => l.text).length;
      return `${count} line${count !== 1 ? 's' : ''} — ${exercise.speakerA || 'A'} & ${exercise.speakerB || 'B'}`;
    }
    case 'swap':    return exercise.sentence || 'Synonym swap sentence…';
    case 'levelup': return exercise.b1 || 'B1 → B2 sentence upgrade…';
    default: return exercise.instruction || '';
  }
}

/**
 * Parse blanks from a template string. Blanks are marked with ___ (3+ underscores).
 * Returns array of segments: { type: 'text'|'blank', value, index }
 */
export function parseBlankTemplate(template) {
  if (!template) return [{ type: 'text', value: '' }];
  const parts = template.split(/(_{3,})/);
  let blankIdx = 0;
  return parts.map(part => {
    if (/^_{3,}$/.test(part)) {
      return { type: 'blank', index: blankIdx++, value: part };
    }
    return { type: 'text', value: part };
  });
}

/**
 * Shuffle an array (Fisher-Yates). Returns a new array.
 * Optionally accepts a seed string for deterministic shuffling.
 */
export function shuffleArray(arr, seed) {
  const result = [...arr];
  let rand = Math.random;
  if (seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    }
    rand = () => {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      return h / 0x7fffffff;
    };
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
