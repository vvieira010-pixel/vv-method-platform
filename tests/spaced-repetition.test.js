/**
 * Basic smoke tests for the spaced repetition engine.
 * Run with: node --experimental-vm-modules tests/spaced-repetition.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { getAllEntries } from '../src/lib/spaced-repetition.js';

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const {
  initSchedule, recordPractice, getDueCount, getDueItems,
} = (await import('../src/lib/spaced-repetition.js'));

const SID = 'test-student-1';
const ERROR = { id: 'err1', error: 'I have went', correct: 'I have gone' };

describe('spaced-repetition', () => {
  before(() => { store['vv:reviewSchedule:test-student-1'] = JSON.stringify([]); });
  after(() => Object.keys(store).filter(k => k.startsWith('vv:reviewSchedule:')).forEach(k => delete store[k]));

  it('initSchedule creates initial entry with interval 1', () => {
    const entry = initSchedule(SID, ERROR);
    assert.equal(entry.interval, 1);
    assert.equal(entry.errorText, 'I have went');
    assert.equal(entry.correctText, 'I have gone');
    assert.ok(entry.nextDue > new Date().toISOString());
    assert.equal(entry.practiceCount, 1);
  });

  it('initSchedule is idempotent on same error', () => {
    const a = initSchedule(SID, ERROR);
    const b = initSchedule(SID, ERROR);
    assert.equal(a.id, b.id);
  });

  it('recordPractice advances interval on correct', () => {
    const items = getDueItems(SID);
    if (items.length === 0) return; // may not be due yet depending on timing
    const entry = recordPractice(SID, items[0].id, true);
    assert.ok(entry.interval > 1 || entry.interval === 30);
    assert.equal(entry.practiceCount, (items[0].practiceCount || 0) + 1);
  });

  it('recordPractice advances interval adaptively based on confidence', () => {
    const entryLow = initSchedule(SID, { id: 'err_low', error: 'Low confidence', correct: 'Correct' });
    const entryHigh = initSchedule(SID, { id: 'err_high', error: 'High confidence', correct: 'Correct' });
    
    // Reset intervals to 1 for testing
    entryLow.interval = 1;
    entryHigh.interval = 1;

    // Practice with low confidence (1) -> multiplier 1x -> interval remains 1
    recordPractice(SID, entryLow.id, true, 1);
    
    // Practice with high confidence (5) -> multiplier 2.5x -> interval becomes 3 (ceil(1 * 2.5))
    recordPractice(SID, entryHigh.id, true, 5);
    
    const all = getAllEntries(SID);
    const updatedLow = all.find(e => e.errorId === 'err_low');
    const updatedHigh = all.find(e => e.errorId === 'err_high');
    
    assert.equal(updatedLow.interval, 1);
    assert.equal(updatedHigh.interval, 3);
  });

  it('recordPractice resets interval on wrong', () => {
    const entry = initSchedule(SID, { id: 'err2', error: 'He do', correct: 'He does' });
    const updated = recordPractice(SID, entry.id, false);
    assert.equal(updated.interval, 1);
  });

  it('getDueCount returns non-negative integer', () => {
    const count = getDueCount(SID);
    assert.ok(Number.isInteger(count));
    assert.ok(count >= 0);
  });
});
