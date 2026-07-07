import { READING_PART1, READING_PART2, READING_PART3 } from '../data/mock-test-1/reading.js';
import { LISTENING_PART1, LISTENING_PART2, LISTENING_PART3 } from '../data/mock-test-1/listening.js';
import { getPoints } from '../data/mock-test-1/index.js';

export function getAllReadingQuestions() {
  const qs = [];
  READING_PART1.questions.forEach(q => qs.push(q));
  READING_PART2.passages.forEach(p => p.questions.forEach(q => qs.push(q)));
  READING_PART3.textSets.forEach(ts => ts.questions.forEach(q => qs.push(q)));
  return qs;
}

export function getAllListeningQuestions() {
  const qs = [];
  LISTENING_PART1.questions.forEach(q => qs.push(q));
  LISTENING_PART2.conversations.forEach(c => c.questions.forEach(q => qs.push(q)));
  LISTENING_PART3.talks.forEach(t => t.questions.forEach(q => qs.push(q)));
  return qs;
}

export function scoreSection(answers, questions) {
  let total = 0;
  let max = 0;
  const details = [];

  questions.forEach(q => {
    const pts = getPoints(q.type, q.level);
    const selected = answers[q.id];
    const correct = selected === q.answer;
    if (correct) total += pts;
    max += pts;
    details.push({ qId: q.id, type: q.type, selected, correct, pts: correct ? pts : 0, max: pts });
  });

  return { total, max, details };
}

export function scoreReading(answers) {
  return scoreSection(answers, getAllReadingQuestions());
}

export function scoreListening(answers) {
  return scoreSection(answers, getAllListeningQuestions());
}
