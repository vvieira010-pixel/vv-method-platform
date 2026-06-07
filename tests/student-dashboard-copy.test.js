import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/pages/student-dashboard.jsx', 'utf8');

for (const phrase of [
  'Slipped a stage',
  'This skill needs attention — we will focus here next class.',
]) {
  assert.equal(source.includes(phrase), false, `Student dashboard should not show: ${phrase}`);
}
