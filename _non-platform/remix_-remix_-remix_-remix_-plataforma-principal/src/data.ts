import { PracticeUnit, DialogueLine, VocabularyItem, QuizQuestion } from './types';
import { UNITS_1_TO_5 } from './data/units1to5';
import { UNITS_6_TO_10 } from './data/units6to10';

export const PRACTICE_UNITS: PracticeUnit[] = [
  ...UNITS_1_TO_5,
  ...UNITS_6_TO_10
];

// Backwards-compatible legacy exports mapping to Unit 6 ("City Cycling Tour & Habits" interview)
// strictly to prevent any existing code referencing these exports from throwing errors during compile setup.
export const DIALOGUE_SCRIPT: DialogueLine[] = PRACTICE_UNITS[5].listening.script;
export const VOCABULARY_LIST: VocabularyItem[] = PRACTICE_UNITS[5].vocabulary.items;
export const COMPREHENSION_QUIZ: QuizQuestion[] = PRACTICE_UNITS[5].listening.questions;
