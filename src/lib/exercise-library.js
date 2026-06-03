/**
 * exercise-library.js — Teacher's persistent, reusable exercise bank.
 *
 * Exercises built or AI-generated in the homework builder normally live only
 * inside one homework assignment. This module lets the teacher save any
 * exercise into a personal library (localStorage key `vv:exerciseLibrary`)
 * and pull it back into any future homework.
 *
 * Stored shape extends the platform exercise format (see exercise-types.js):
 *   { id: 'lib_…', type, …type-specific fields…,
 *     title, tags: [], level: '', createdAt, usageCount }
 *
 * The shape is flat JSON, so this is trivially portable to a Supabase
 * `exercises` table when the data layer migrates off localStorage.
 */

const LIBRARY_KEY = 'vv:exerciseLibrary';

function load() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]'); }
  catch { return []; }
}
function save(list) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(list)); } catch {}
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Stable-ish content signature so saving the same exercise twice updates, not duplicates. */
function contentHash(ex) {
  const core = [
    ex.type,
    ex.question, ex.template, ex.prompt, ex.errorText,
    Array.isArray(ex.sentences) ? ex.sentences.join('|') : '',
    Array.isArray(ex.options) ? ex.options.join('|') : '',
    Array.isArray(ex.pairs) ? ex.pairs.map(p => `${p.term}=${p.def}`).join('|') : '',
  ].filter(Boolean).join('::').trim().toLowerCase();
  return core;
}

/** Derive a readable title from an exercise's primary text field. */
function deriveTitle(ex) {
  const raw = ex.title || ex.question || ex.prompt || ex.template || ex.errorText
    || (Array.isArray(ex.sentences) && ex.sentences[0])
    || (Array.isArray(ex.pairs) && ex.pairs[0] && `${ex.pairs[0].term} / ${ex.pairs[0].def}`)
    || ex.type || 'Exercise';
  const s = String(raw).replace(/_{3,}/g, '___').trim();
  return s.length > 80 ? s.slice(0, 77) + '…' : s;
}

/** All saved exercises, newest first. */
export function getLibraryExercises() {
  return load();
}

/**
 * Save an exercise to the library. `exercise` is a platform exercise object
 * (from the homework builder). Strips its per-homework id, assigns a lib id,
 * and dedupes by content signature (re-save updates the existing entry).
 * Returns the stored record.
 */
export function saveExerciseToLibrary(exercise, meta = {}) {
  if (!exercise || !exercise.type) return null;
  const list = load();
  const sig = contentHash(exercise);

  // Copy type-specific fields, drop the homework-scoped id.
  const { id, ...fields } = exercise;
  const base = {
    ...fields,
    title: meta.title || deriveTitle(exercise),
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    level: meta.level || '',
  };

  const existingIdx = list.findIndex(e => contentHash(e) === sig);
  if (existingIdx >= 0) {
    // Update in place, preserve id/createdAt/usageCount.
    const prev = list[existingIdx];
    const updated = { ...prev, ...base, id: prev.id, createdAt: prev.createdAt, usageCount: prev.usageCount || 0 };
    list[existingIdx] = updated;
    save(list);
    return updated;
  }

  const record = {
    ...base,
    id: 'lib_' + uid(),
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };
  list.unshift(record);
  save(list);
  return record;
}

/** Remove a saved exercise by its lib id. */
export function deleteLibraryExercise(libId) {
  save(load().filter(e => e.id !== libId));
}

/** Bump usage count (called when a saved exercise is added into a homework). */
export function incrementUsage(libId) {
  const list = load();
  const idx = list.findIndex(e => e.id === libId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], usageCount: (list[idx].usageCount || 0) + 1 };
    save(list);
  }
}
