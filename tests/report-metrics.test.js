import assert from 'node:assert/strict';
import {
  buildExerciseMix,
  buildReadinessEvidence,
  getReadinessDisplay,
} from '../src/lib/report-metrics.js';

const partialSkills = [
  { name: 'Speaking', score: 8, status: 'Evaluated' },
  { name: 'Writing', score: null, status: 'Not evaluated yet' },
  { name: 'Reading', score: null, status: 'Not evaluated yet' },
  { name: 'Listening', score: null, status: 'Not evaluated yet' },
  { name: 'Grammar', score: null, status: 'Not evaluated yet' },
  { name: 'Vocabulary', score: null, status: 'Not evaluated yet' },
  { name: 'Test Strategy', score: null, status: 'Not evaluated yet' },
];

const partial = buildReadinessEvidence(partialSkills);
assert.equal(partial.readiness, null);
assert.equal(partial.evaluatedCount, 1);
assert.equal(partial.requiredCount, 4);
assert.equal(getReadinessDisplay(partial).value, 'Not enough');
assert.match(getReadinessDisplay(partial).sub, /1\/7/);

const enough = buildReadinessEvidence([
  { name: 'Speaking', score: 8 },
  { name: 'Writing', score: 7 },
  { name: 'Reading', score: 6 },
  { name: 'Listening', score: 5 },
  { name: 'Grammar', score: null },
  { name: 'Vocabulary', score: null },
]);
assert.equal(enough.readiness, 65);
assert.equal(getReadinessDisplay(enough).value, '65%');

const mix = buildExerciseMix([
  { type: 'Speaking', status: 'submitted' },
  { type: 'Speaking', status: 'reviewed' },
  { type: 'Speaking', status: 'not-started' },
  { skillType: 'Writing', status: 'completed' },
]);
assert.deepEqual(mix.find(row => row.type === 'Speaking'), {
  type: 'Speaking',
  count: 3,
  submitted: 2,
  reviewed: 1,
  submittedRate: 67,
  reviewedRate: 33,
});

console.log('report-metrics tests passed');
