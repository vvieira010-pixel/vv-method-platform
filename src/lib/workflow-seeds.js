/* ─── SEEDS Stages — Supabase-first, localStorage fallback ─────── */

import { K, loadObj, save, uid, dbReady } from './workflow-core.js';
import { dbList, dbUpsert } from './supabase-db.js';

function migrateFromObjectToArray(obj) {
  return Object.entries(obj || {}).map(([studentId, val]) => ({
    id: val.id || `${studentId}:seeds`,
    studentId,
    stage: val.stage || 'sense',
    startedAt: val.startedAt || null,
    note: val.note || '',
  }));
}

export async function getSeedsStages() {
  if (dbReady('seedsStages')) {
    try {
      const all = await dbList('seedsStages');
      if (Array.isArray(all)) return all;
    } catch (e) {
      console.warn('[workflow] getSeedsStages via Supabase failed, using localStorage:', e.message);
    }
  }

  const raw = loadObj(K.seedsStages);
  if (Array.isArray(raw)) return raw;
  const migrated = migrateFromObjectToArray(raw);
  save(K.seedsStages, migrated);
  return migrated;
}

export async function getStudentSeedsStage(studentId) {
  if (dbReady('seedsStages')) {
    try {
      const all = await dbList('seedsStages');
      if (Array.isArray(all)) return all.find(r => r.studentId === studentId) || null;
    } catch (e) {
      console.warn('[workflow] getStudentSeedsStage via Supabase failed, using localStorage:', e.message);
    }
  }

  const all = await getSeedsStages();
  return all.find(r => r.studentId === studentId) || null;
}

export async function setStudentSeedsStage(studentId, stage, note = '') {
  const existing = await getStudentSeedsStage(studentId);
  const record = {
    id: existing?.id || uid(),
    studentId,
    stage,
    note: note || existing?.note || '',
    startedAt: existing?.startedAt || new Date().toISOString(),
  };

  if (dbReady('seedsStages')) {
    try {
      const saved = await dbUpsert('seedsStages', record);
      window.dispatchEvent(new CustomEvent('vv:seeds-updated'));
      return saved;
    } catch (e) {
      console.warn('[workflow] setStudentSeedsStage via Supabase failed, using localStorage:', e.message);
    }
  }

  const all = await getSeedsStages();
  const idx = all.findIndex(r => r.studentId === studentId);
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  save(K.seedsStages, all);
  window.dispatchEvent(new CustomEvent('vv:seeds-updated'));
  return record;
}
