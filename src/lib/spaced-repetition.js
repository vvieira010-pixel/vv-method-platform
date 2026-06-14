/* spaced-repetition.js — Error bank items scheduled for review at increasing intervals */

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

// Optional Supabase sync — enabled when dbUpsert is provided.
// Import and pass a function to enableSync() to persist SR data beyond localStorage.
let _syncFn = null;
export function enableSync(fn) { _syncFn = fn; }

async function maybeSync(studentId, list) {
  if (_syncFn) try { await _syncFn(studentId, list); } catch { /* silent fallback to localStorage */ }
}

function storageKey(studentId) {
  return `vv:reviewSchedule:${studentId}`;
}

function load(studentId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(studentId)) || '[]');
  } catch { return []; }
}

function save(studentId, list) {
  localStorage.setItem(storageKey(studentId), JSON.stringify(list));
}

function uid() {
  return 'sr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

/**
 * Initialise a schedule entry for an error bank item on first practice.
 * @param {string} studentId
 * @param {object} errorEntry — from error bank { id, error, correct, ... }
 */
export function initSchedule(studentId, errorEntry) {
  const list = load(studentId);
  const existing = list.find(e => e.errorId === errorEntry.id);
  if (existing) return existing;
  const entry = {
    id: uid(),
    studentId,
    errorId: errorEntry.id,
    errorText: errorEntry.error || errorEntry.errorText || '',
    correctText: errorEntry.correct || '',
    interval: 1,
    lastSeen: new Date().toISOString(),
    nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    sourceDiagnosisId: errorEntry.sourceDiagnosisId || null,
    practiceCount: 1,
    mastered: false,
  };
  list.push(entry);
  save(studentId, list);
  maybeSync(studentId, list);
  return entry;
}

/**
 * Mark a scheduled item as mastered — stops it from appearing in due items.
 * Called when the error bank entry reaches 'solved' status.
 */
export function markSRMastered(studentId, errorId) {
  const list = load(studentId);
  const idx = list.findIndex(e => e.errorId === errorId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], mastered: true };
  save(studentId, list);
  maybeSync(studentId, list);
}

/**
 * Record a practice attempt on a scheduled item.
 * @param {string} studentId
 * @param {string} scheduleId
 * @param {boolean} correct — whether the student answered correctly
 */
export function recordPractice(studentId, scheduleId, correct) {
  const list = load(studentId);
  const idx = list.findIndex(e => e.id === scheduleId);
  if (idx < 0) return null;
  const entry = list[idx];
  if (correct) {
    const intervalIdx = REVIEW_INTERVALS.indexOf(entry.interval);
    entry.interval = intervalIdx >= 0 && intervalIdx < REVIEW_INTERVALS.length - 1
      ? REVIEW_INTERVALS[intervalIdx + 1]
      : REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
  } else {
    entry.interval = 1;
  }
  entry.lastSeen = new Date().toISOString();
  entry.nextDue = new Date(Date.now() + entry.interval * 24 * 60 * 60 * 1000).toISOString();
  entry.practiceCount = (entry.practiceCount || 0) + 1;
  list[idx] = entry;
  save(studentId, list);
  maybeSync(studentId, list);
  return entry;
}

/**
 * Get all items due for review (nextDue <= now).
 * @param {string} studentId
 * @returns {object[]}
 */
export function getDueItems(studentId) {
  const list = load(studentId);
  const now = new Date().toISOString();
  return list
    .filter(e => !e.mastered && e.nextDue <= now)
    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
}

/**
 * Get total count of due items.
 */
export function getDueCount(studentId) {
  return getDueItems(studentId).length;
}

/**
 * Convert a schedule entry to an MCQ exercise for use in homework.
 * @param {object} scheduleEntry
 * @param {object[]} [allEntries] — other entries to use for distractor options
 * @returns {object} exercise object with type 'mcq'
 */
export function toMCQ(scheduleEntry, allEntries) {
  const pool = (allEntries || []).filter(e => e.id !== scheduleEntry.id && e.correctText);
  const distractors = [];
  const used = new Set([scheduleEntry.correctText.toLowerCase()]);
  for (const e of pool) {
    const t = (e.correctText || '').toLowerCase();
    if (t && !used.has(t)) {
      distractors.push(e.correctText);
      used.add(t);
      if (distractors.length >= 3) break;
    }
  }
  while (distractors.length < 3) {
    const fallbacks = ['The original version', 'A different form', 'None of the above'];
    if (!used.has(fallbacks[distractors.length].toLowerCase())) {
      distractors.push(fallbacks[distractors.length]);
    }
  }

  const options = [scheduleEntry.correctText, ...distractors];
  const shuffled = options.map((v, i) => ({ v, i })).sort(() => Math.random() - 0.5);
  const correctIdx = shuffled.findIndex(s => s.i === 0);

  return {
    id: 'review_' + scheduleEntry.id,
    type: 'mcq',
    level: 'B1',
    question: `Which is the correct way to say this?\n"${scheduleEntry.errorText}"`,
    options: shuffled.map(s => s.v),
    correct: correctIdx,
    reviewItemId: scheduleEntry.id,
    isReviewItem: true,
  };
}

/**
 * Get all schedule entries for a student (for building distractor pools).
 */
export function getAllEntries(studentId) {
  return load(studentId);
}
