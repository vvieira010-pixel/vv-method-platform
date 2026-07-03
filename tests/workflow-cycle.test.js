/**
 * Integration test for the core teaching workflow cycle:
 *   Diagnosis → Homework → Submission → Review
 *
 * Run: node --test "tests/workflow-cycle.test.js"
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for the entire test suite
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

// Minimal browser-like globals needed by workflow modules
global.window = { location: { href: 'http://localhost' }, addEventListener: () => {}, removeEventListener: () => {} };

// Mock import.meta.env
global.import = { meta: { env: {} } };

const {
  saveDiagnosis, getDiagnoses, getDiagnosis,
  saveHomework, getHomework,
  getSubmissions, submitHomework, deleteSubmission,
  getReviews, saveReview, deleteReview,
  getStudentCycleState,
} = await import('../src/lib/workflow.js');

const STUDENT_ID = 'test-student-1';

describe('workflow cycle: diagnosis → homework → submission → review', () => {
  before(() => {
    // Seed initial localStorage state
    store['vv:studentsCrud'] = JSON.stringify([{
      id: STUDENT_ID, name: 'Test Student', email: 'test@example.com',
      currentLevel: 'B1', targetLevel: 'B2',
    }]);
  });

  after(() => {
    const keys = Object.keys(store);
    keys.forEach(k => { if (k.startsWith('vv:')) delete store[k]; });
  });

  let diagnosisId = null;
  let homeworkId = null;
  let submissionId = null;

  it('1. creates a diagnosis', async () => {
    const dx = await saveDiagnosis({
      studentId: STUDENT_ID,
      strengths: ['Good vocabulary range'],
      weaknesses: ['Verb tense consistency'],
      grammarIssues: [{ error: 'present-perfect', detail: 'Frequent incorrect use of present perfect for past simple contexts' }],
      vocabularyIssues: [],
      skillIssues: [{ skill: 'Speaking', issue: 'Hesitation with complex sentences' }],
      status: 'draft',
      isBaseline: true,
    });
    assert.ok(dx, 'diagnosis should be created');
    assert.ok(dx.id, 'diagnosis should have an id');
    assert.equal(dx.studentId, STUDENT_ID);
    assert.equal(dx.isBaseline, true);
    assert.ok(Array.isArray(dx.strengths));
    diagnosisId = dx.id;
  });

  it('2. retrieves the diagnosis by id', async () => {
    const dx = await getDiagnosis(diagnosisId);
    assert.ok(dx, 'should find the diagnosis');
    assert.equal(dx.id, diagnosisId);
  });

  it('3. lists diagnoses for the student', async () => {
    const list = await getDiagnoses(STUDENT_ID);
    assert.ok(Array.isArray(list));
    assert.ok(list.some(d => d.id === diagnosisId), 'list should contain the new diagnosis');
  });

  it('4. assigns homework based on diagnosis', async () => {
    const hw = await saveHomework({
      studentId: STUDENT_ID,
      diagnosisId: diagnosisId,
      title: 'Present Perfect vs Past Simple Practice',
      activities: [
        { type: 'exercise', skill: 'grammar', description: 'Complete the sentences with the correct tense' },
        { type: 'speaking', skill: 'Speaking', description: 'Record yourself answering 3 questions about your work experience' },
      ],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'not-started',
    });
    assert.ok(hw, 'homework should be created');
    assert.ok(hw.id, 'homework should have an id');
    assert.equal(hw.studentId, STUDENT_ID);
    assert.equal(hw.diagnosisId, diagnosisId);
    assert.equal(hw.status, 'not-started');
    assert.ok(Array.isArray(hw.activities));
    assert.equal(hw.activities.length, 2);
    homeworkId = hw.id;
  });

  it('5. lists homework for the student', async () => {
    const list = await getHomework(STUDENT_ID);
    assert.ok(Array.isArray(list));
    assert.ok(list.some(h => h.id === homeworkId), 'list should contain the new homework');
    const hw = list.find(h => h.id === homeworkId);
    assert.equal(hw.status, 'not-started');
  });

  it('6. student submits homework', async () => {
    const sub = await submitHomework(
      homeworkId,
      STUDENT_ID,
      'I have worked as a nurse for 5 years. Yesterday I had a busy shift.',
      [
        { questionId: 1, answer: 'have worked' },
        { questionId: 2, answer: 'had' },
        { questionId: 3, transcript: 'I have been a nurse since 2019...' },
      ],
      3
    );
    assert.ok(sub, 'submission should be created');
    assert.ok(sub.id, 'submission should have an id');
    assert.equal(sub.homeworkId, homeworkId);
    assert.equal(sub.studentId, STUDENT_ID);
    assert.equal(sub.status, 'submitted');
    submissionId = sub.id;
  });

  it('7. lists submissions with status updates', async () => {
    const list = await getSubmissions(STUDENT_ID);
    const sub = list.find(s => s.id === submissionId);
    assert.ok(sub, 'submission should be in the list');
    assert.equal(sub.status, 'submitted');
  });

  it('8. teacher reviews the submission', async () => {
    const review = await saveReview({
      submissionId: submissionId,
      homeworkId: homeworkId,
      studentId: STUDENT_ID,
      diagnosisId: diagnosisId,
      corrections: [
        { type: 'grammar', original: 'I have worked', corrected: 'I worked', note: 'Use past simple for completed past actions with a specific time.' },
        { type: 'vocabulary', original: 'busy shift', corrected: 'demanding shift', note: 'More precise professional vocabulary.' },
      ],
      overallNote: 'Good use of present perfect for general experience. Remember to switch to past simple when mentioning specific past times.',
      score: 7,
    });
    assert.ok(review, 'review should be created');
    assert.ok(review.id, 'review should have an id');
    assert.equal(review.submissionId, submissionId);
    assert.equal(review.homeworkId, homeworkId);
    assert.equal(review.studentId, STUDENT_ID);
    assert.ok(Array.isArray(review.corrections));
    assert.equal(review.corrections.length, 2);
  });

  it('9. reviews are retrievable', async () => {
    const list = await getReviews(STUDENT_ID);
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0, 'should have at least one review');
  });

  it('10. cycle state reflects the review stage', async () => {
    const state = await getStudentCycleState(STUDENT_ID);
    assert.ok(state, 'should return cycle state');
    assert.ok(state.latestDiagnosis, 'should have a latest diagnosis');
    assert.ok(state.totalDiagnoses >= 1);
    assert.ok(state.totalHomework >= 1);
    assert.ok(state.totalSubmissions >= 1);
  });

  it('11. can delete submission and review', async () => {
    const reviewsBefore = await getReviews(STUDENT_ID);
    const submissionReviews = reviewsBefore.filter(r => r.submissionId === submissionId);
    for (const r of submissionReviews) {
      await deleteReview(r.id);
    }
    await deleteSubmission(submissionId);
    const submissionsAfter = await getSubmissions(STUDENT_ID);
    assert.ok(!submissionsAfter.some(s => s.id === submissionId), 'submission should be deleted');
  });

  it('12. cleanup: delete homework and diagnosis', async () => {
    const { deleteHomework, deleteDiagnosis } = await import('../src/lib/workflow.js');
    await deleteHomework(homeworkId);
    const hwList = await getHomework(STUDENT_ID);
    assert.ok(!hwList.some(h => h.id === homeworkId), 'homework should be deleted');

    await deleteDiagnosis(diagnosisId);
    const dxList = await getDiagnoses(STUDENT_ID);
    assert.ok(!dxList.some(d => d.id === diagnosisId), 'diagnosis should be deleted');
  });
});
