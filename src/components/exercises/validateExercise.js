/**
 * Validates a single exercise object before rendering.
 * Returns { valid: true } or { valid: false, reason: string }
 */
export function validateExercise(ex) {
  if (!ex || typeof ex !== 'object') return { valid: false, reason: 'Exercise is not a valid object.' };
  if (!ex.type || typeof ex.type !== 'string') return { valid: false, reason: 'Exercise is missing the "type" field.' };

  switch (ex.type) {
    // v1 type ids (legacy)
    case 'multiple_choice':
      if (!ex.question) return { valid: false, reason: 'Multiple choice is missing "question".' };
      if (!Array.isArray(ex.options) || ex.options.length < 2) return { valid: false, reason: 'Multiple choice needs at least 2 options.' };
      if (ex.correct == null || ex.correct < 0 || ex.correct >= ex.options.length) return { valid: false, reason: 'Multiple choice "correct" must be a valid option index.' };
      return { valid: true };

    case 'fill_blank':
      if (!ex.template || typeof ex.template !== 'string') return { valid: false, reason: 'Fill-blank is missing "template".' };
      if (!Array.isArray(ex.blanks) || ex.blanks.length === 0) return { valid: false, reason: 'Fill-blank is missing "blanks" array.' };
      if (!ex.template.includes('___')) return { valid: false, reason: 'Fill-blank template must include "___" for each blank.' };
      return { valid: true };

    case 'short_answer':
      if (!ex.prompt) return { valid: false, reason: 'Short answer is missing "prompt".' };
      if (!ex.rubric) return { valid: false, reason: 'Short answer is missing "rubric".' };
      return { valid: true };

    case 'order_sentences':
      if (!Array.isArray(ex.sentences) || ex.sentences.length < 2) return { valid: false, reason: 'Order-sentences needs at least 2 sentences.' };
      return { valid: true };

    case 'error_correction':
      if (!ex.errorText) return { valid: false, reason: 'Error correction is missing "errorText".' };
      if (!ex.correctedText) return { valid: false, reason: 'Error correction is missing "correctedText".' };
      return { valid: true };

    // v2 type ids
    case 'mcq':
      if (!ex.question) return { valid: false, reason: 'MCQ is missing "question".' };
      if (!Array.isArray(ex.options) || ex.options.length < 2) return { valid: false, reason: 'MCQ needs at least 2 options.' };
      if (ex.correct == null || ex.correct < 0 || ex.correct >= ex.options.length) return { valid: false, reason: 'MCQ "correct" must be a valid option index.' };
      return { valid: true };

    case 'blank':
      if (!ex.template || typeof ex.template !== 'string') return { valid: false, reason: 'Blank is missing "template".' };
      if (!Array.isArray(ex.blanks) || ex.blanks.length === 0) return { valid: false, reason: 'Blank is missing "blanks" array.' };
      if (!ex.template.includes('___')) return { valid: false, reason: 'Blank template must include "___" for each blank.' };
      return { valid: true };

    case 'short':
      if (!ex.prompt) return { valid: false, reason: 'Short answer is missing "prompt".' };
      return { valid: true };

    case 'speak':
      if (!ex.prompt) return { valid: false, reason: 'Speaking prompt is missing "prompt".' };
      return { valid: true };

    case 'order':
      if (!Array.isArray(ex.sentences) || ex.sentences.length < 2) return { valid: false, reason: 'Order needs at least 2 sentences.' };
      return { valid: true };

    case 'fix':
      if (!ex.errorText) return { valid: false, reason: 'Error correction is missing "errorText".' };
      if (!ex.correctedText) return { valid: false, reason: 'Error correction is missing "correctedText".' };
      return { valid: true };

    case 'flash':
      if (!Array.isArray(ex.pairs) || ex.pairs.length === 0) return { valid: false, reason: 'Flashcards is missing "pairs" array.' };
      return { valid: true };

    case 'listen':
      if (!ex.audioText) return { valid: false, reason: 'Listening exercise is missing "audioText".' };
      if (!ex.question) return { valid: false, reason: 'Listening exercise is missing "question".' };
      if (!Array.isArray(ex.options) || ex.options.length < 2) return { valid: false, reason: 'Listening exercise needs at least 2 options.' };
      if (ex.correct == null || ex.correct < 0 || ex.correct >= ex.options.length) return { valid: false, reason: 'Listening exercise "correct" must be a valid option index.' };
      return { valid: true };

    default:
      return { valid: false, reason: `Unknown exercise type: "${ex.type}".` };
  }
}

/**
 * Loads exercises from either:
 *   [ ...exercises ]
 *   { exercises: [ ...exercises ] }
 * Returns { exercises: [], errors: [] }
 */
export function loadExercises(raw) {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.exercises)) {
    list = raw.exercises;
  } else {
    return { exercises: [], errors: ['Could not parse exercise data. Expected an array or { exercises: [...] }.'] };
  }

  if (list.length === 0) {
    return { exercises: [], errors: ['The exercise array is empty.'] };
  }

  const exercises = [];
  const errors = [];
  list.forEach((ex, i) => {
    // Handle wrapped database objects
    const targetEx = ex.exercise_data ? ex.exercise_data : ex;
    
    const result = validateExercise(targetEx);
    if (result.valid) {
      exercises.push(targetEx);
    } else {
      errors.push(`Exercise ${i + 1}: ${result.reason}`);
    }
  });

  return { exercises, errors };
}
