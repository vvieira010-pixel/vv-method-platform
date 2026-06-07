import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/pages/submission-review.jsx', 'utf8');

assert.match(
  source,
  /buildSubmissionEvidence/,
  'Submission review should build evidence from structured submission responses.'
);

assert.match(
  source,
  /SUBMISSION EVIDENCE FROM STRUCTURED RESPONSES/,
  'AI comparison prompt should include structured response evidence.'
);

assert.match(
  source,
  /Teacher review evidence/,
  'Teacher UI should show the response evidence used for review.'
);

assert.match(
  source,
  /Transcript used for review/,
  'Teacher UI should clearly label transcripts used for review.'
);
