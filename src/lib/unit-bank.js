/**
 * unit-bank.js — Query and convert dialogue-practice unit data into Platform exercises.
 * Supports 10 subject types: reading, listening, vocabulary, grammar, speaking, writing,
 * levelup, grammar-doctor, vocab-swapper, interactive-dialogue.
 */
import { UNITS_1_TO_5 } from '../data/practice-units-1-5.js';
import { UNITS_6_TO_10 } from '../data/practice-units-6-10.js';
import { LEVEL_UP_DATA } from '../data/level-up-data.js';
import { GRAMMAR_DOCTOR_DATA } from '../data/grammar-doctor-data.js';
import { VOCABULARY_SWAPPER_DATA } from '../data/vocabulary-swapper-data.js';

let _seq = 0;
function uid() { return 'ub_' + Date.now().toString(36) + '_' + (++_seq).toString(36); }

/** CEFR level → unit arrays */
export const UNIT_LEVELS = [
  { id: 'B1+', label: 'B1+', units: UNITS_1_TO_5 },
  { id: 'B2',  label: 'B2',  units: UNITS_6_TO_10 },
];

export function getUnitsByLevel(level) {
  const entry = UNIT_LEVELS.find(l => l.id === level);
  return entry ? entry.units : [];
}

/** All 10 subject options shown in the wizard */
export const SUBJECT_OPTIONS = [
  { id: 'reading',             label: 'Reading',            icon: '📖', desc: 'Passage comprehension MCQ' },
  { id: 'listening',           label: 'Listening',          icon: '🎧', desc: 'Dialogue comprehension MCQ' },
  { id: 'vocabulary',          label: 'Vocabulary',         icon: '📚', desc: 'Flashcard sets' },
  { id: 'grammar',             label: 'Grammar Drills',     icon: '✏️', desc: 'Sentence completion MCQ' },
  { id: 'speaking',            label: 'Speaking',           icon: '🎙️', desc: 'Situational roleplay prompt' },
  { id: 'writing',             label: 'Writing',            icon: '📝', desc: 'Essay composition prompt' },
  { id: 'levelup',             label: 'Level-Up',           icon: '🚀', desc: 'B1 → B2 sentence upgrade MCQ' },
  { id: 'grammar-doctor',      label: 'Grammar Doctor',     icon: '🩺', desc: 'Error correction challenges' },
  { id: 'vocab-swapper',       label: 'Vocab Swapper',      icon: '🔄', desc: 'Replace simple words with B2 vocab' },
  { id: 'interactive-dialogue',label: 'Interactive Dialogue',icon: '💬', desc: 'Speech roleplay with dialogue script' },
];

/* ── converters ── */

function fromQuiz(q) {
  return {
    id: uid(), type: 'mcq',
    question: q.question,
    options: q.options,
    correct: q.correctAnswer,
    explanation: q.explanation || '',
  };
}

function fromGrammarItem(g) {
  return {
    id: uid(), type: 'mcq',
    question: g.sentence,
    options: g.options,
    correct: g.correctAnswer,
    explanation: g.explanation || '',
  };
}

function fromVocabItems(items, unitTitle) {
  return {
    id: uid(), type: 'flash',
    pairs: items.map(v => ({ term: v.phrase, def: v.definition + (v.example ? ' — ' + v.example : '') })),
    _sourceLabel: unitTitle || 'Vocabulary',
  };
}

function fromLevelUp(lu) {
  return {
    id: uid(), type: 'mcq',
    question: `Level-Up: Upgrade this B1 sentence to B2:\n"${lu.b1Sentence}"`,
    options: lu.options.map(o => o.text),
    correct: lu.correctOptionIndex,
    explanation: lu.options[lu.correctOptionIndex]?.explanation || '',
  };
}

function fromGrammarDoctor(gd) {
  const correct = (gd.remedyOptions || []).find(o => o.isCorrect);
  return {
    id: uid(), type: 'fix',
    errorText: gd.symptom,
    correctedText: correct ? correct.text : gd.symptom,
    hint: gd.linguisticRule || gd.focus || '',
  };
}

function fromSwapperTarget(challenge, target) {
  const correctIdx = target.options.indexOf(target.correctWord);
  return {
    id: uid(), type: 'mcq',
    question: `Vocabulary Swap — Replace "${target.simpleWord}" with the B2 word:\n"${challenge.sentence}"`,
    options: target.options,
    correct: correctIdx >= 0 ? correctIdx : 0,
    explanation: target.explanation || '',
  };
}

function fromSpeaking(unit) {
  const sp = unit.speaking;
  return {
    id: uid(), type: 'speak',
    prompt: `${sp.setup || ''}\n\n${sp.instructions || ''}`.trim(),
    targetSeconds: 90,
  };
}

function fromWriting(unit) {
  const wr = unit.writing;
  return {
    id: uid(), type: 'short',
    prompt: wr.prompt || '',
    rubric: (wr.criteria || []).join(' | '),
    targetWords: parseInt(wr.wordCount) || 120,
  };
}

function fromDialogue(unit) {
  const lines = (unit.listening?.script || [])
    .slice(0, 12)
    .map(l => `${l.speaker}: ${l.text}`)
    .join('\n');
  const speakers = [...new Set((unit.listening?.script || []).map(l => l.speaker))];
  return {
    id: uid(), type: 'speak',
    prompt: `Interactive Dialogue — choose the role of ${speakers[1] || speakers[0]} and practise the conversation:\n\n${lines}`,
    targetSeconds: 120,
  };
}

/* ── main public function ── */

/**
 * Get up to maxCount Platform exercises from a set of units for a given skill.
 * @param {Array} units — result of getUnitsByLevel()
 * @param {string} skill — one of SUBJECT_OPTIONS ids
 * @param {number} [maxCount=10]
 */
export function getSkillExercises(units, skill, maxCount = 10) {
  const results = [];

  for (const unit of units) {
    if (results.length >= maxCount) break;

    switch (skill) {
      case 'reading':
        for (const q of unit.reading?.questions || []) {
          if (results.length >= maxCount) break;
          results.push(fromQuiz(q));
        }
        break;

      case 'listening':
        for (const q of unit.listening?.questions || []) {
          if (results.length >= maxCount) break;
          results.push(fromQuiz(q));
        }
        break;

      case 'vocabulary':
        if (unit.vocabulary?.items?.length) {
          results.push(fromVocabItems(unit.vocabulary.items, unit.title));
        }
        break;

      case 'grammar':
        for (const g of unit.grammar?.questions || []) {
          if (results.length >= maxCount) break;
          results.push(fromGrammarItem(g));
        }
        break;

      case 'speaking':
        results.push(fromSpeaking(unit));
        break;

      case 'writing':
        results.push(fromWriting(unit));
        break;

      case 'levelup': {
        const items = LEVEL_UP_DATA.filter(lu => lu.unitId === unit.id);
        for (const lu of items) {
          if (results.length >= maxCount) break;
          results.push(fromLevelUp(lu));
        }
        break;
      }

      case 'grammar-doctor': {
        const items = GRAMMAR_DOCTOR_DATA.filter(gd => gd.unitId === unit.id);
        for (const gd of items) {
          if (results.length >= maxCount) break;
          results.push(fromGrammarDoctor(gd));
        }
        break;
      }

      case 'vocab-swapper': {
        const challenges = VOCABULARY_SWAPPER_DATA.filter(c => c.unitId === unit.id);
        for (const ch of challenges) {
          for (const target of ch.targets || []) {
            if (results.length >= maxCount) break;
            results.push(fromSwapperTarget(ch, target));
          }
        }
        break;
      }

      case 'interactive-dialogue':
        results.push(fromDialogue(unit));
        break;

      default:
        break;
    }
  }

  return results.slice(0, maxCount);
}
