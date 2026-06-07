/**
 * convert-homework-listening.js
 *
 * Converts listening exercises from the MET homework JSON format
 * into the app's native `listen` exercise format (used by Listening.jsx).
 *
 * Input format (met-homework-hw0x.json):
 *   audioScriptTeacherOnly, studentQuestion, options {A,B,C,D}, correctAnswer (letter), answerExplanation
 *
 * Output format (app listen exercise):
 *   { type: 'listen', audioText, plays, question, options[], correct (index), explanation }
 *
 * Usage:
 *   node scripts/convert-homework-listening.js
 *
 * Output is written to scripts/converted-listening-exercises.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

const HOMEWORK_FILES = [
  join(root, '..', '..', '..', 'met-homework-hw01.json'),
  join(root, '..', '..', '..', 'met-homework-hw02.json'),
];

const LETTER_TO_INDEX = { A: 0, B: 1, C: 2, D: 3 };
const LISTEN_TYPES = [
  'listening_part_1_short_conversation',
  'listening_part_2_longer_conversation',
  'listening_part_3_short_talk',
];

/** Strip speaker labels from audio script for a cleaner TTS read */
function cleanScript(script) {
  if (!script) return '';
  return script
    // Handle newline-separated scripts: "Woman: text\nMan: text"
    .replace(/^[A-Za-z][A-Za-z\s()]{0,30}:\s*/gm, '')
    // Handle inline speaker labels: "… text. Man: Next line. Woman: …"
    .replace(/\b[A-Z][a-zA-Z\s()]{1,25}:\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convert one exercise item into the app's listen format */
function convertSingle({ exerciseId, audioScriptTeacherOnly, studentQuestion, options, correctAnswer, answerExplanation, title }) {
  const optionsArr = ['A', 'B', 'C', 'D'].map(k => options[k] || '');
  return {
    _source: exerciseId,
    _title: title,
    type: 'listen',
    level: 'B2',
    audioText: cleanScript(audioScriptTeacherOnly),
    audioScriptFull: audioScriptTeacherOnly,   // preserve original for teacher use
    plays: 2,
    question: studentQuestion,
    options: optionsArr,
    correct: LETTER_TO_INDEX[correctAnswer] ?? null,
    explanation: answerExplanation,
    pictureHint: '',
  };
}

const results = [];

for (const filePath of HOMEWORK_FILES) {
  let hw;
  try {
    hw = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    console.warn(`Skipping ${filePath} — not found or invalid JSON`);
    continue;
  }

  for (const ex of hw.exercises || []) {
    if (!LISTEN_TYPES.includes(ex.type)) continue;

    if (ex.type === 'listening_part_1_short_conversation') {
      // Single question
      results.push(convertSingle(ex));
    } else {
      // P2 / P3 — multiple questions, same audio
      for (const q of ex.questions || []) {
        results.push(convertSingle({
          exerciseId: ex.exerciseId,
          title: `${ex.title} — Q${(ex.questions.indexOf(q) + 1)}`,
          audioScriptTeacherOnly: ex.audioScriptTeacherOnly,
          studentQuestion: q.studentQuestion,
          options: q.options,
          correctAnswer: q.correctAnswer,
          answerExplanation: q.answerExplanation,
        }));
      }
    }
  }
}

const out = JSON.stringify(results, null, 2);
writeFileSync(join(__dir, 'converted-listening-exercises.json'), out);

console.log(`Converted ${results.length} listening exercises.`);
console.log('Output → scripts/converted-listening-exercises.json');
console.log('');
console.log('Paste each object into the exercise editor, or use the Supabase insert helper below:');
console.log('');

// Print a quick Supabase insert snippet
console.log('// Supabase JS — insert all at once:');
console.log('// const { error } = await supabase.from(\'exercises\').insert(exercises.map(e => ({ ...e, created_at: new Date() })))');
