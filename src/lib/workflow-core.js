import { getDbContext, dbHasEntity, dbList, dbGet, dbUpsert, dbRemove } from './supabase-db.js';

export const K = {
  sessions:    'vv:sessions',
  diagnoses:   'vv:diagnoses',
  feedback:    'vv:feedback',
  homework:    'vv:homework',
  practiceAssignments: 'vv:practiceAssignments',
  practiceResources:   'vv:practiceResources',
  practiceSubmissions: 'vv:practiceSubmissions',
  errorBankGlobal:     'vv:errorBankGlobal',
  reports:             'vv:reports',
  submissions:         'vv:submissions',
  corrections:         'vv:corrections',
  reviews:             'vv:reviews',
  inbox:               'vv:inbox',
  progress:            'vv:progress',
  reviewed:            'vv:reviewed',
  drafts:              'vv:drafts',
  studentsCrud:        'vv:studentsCrud',
  targetProfiles:      'vv:targetProfiles',
  classEvents:         'vv:classEvents',
  classEvidence:       'vv:classEvidence',
  vocabularyBank:      'vv:vocabularyBank',
  progressNotes:       'vv:progressNotes',
  seedsStages:         'vv:seedsStages',
};

export function load(key)     { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
export function loadObj(key)  { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
export function save(key, v)  { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function removeHomeworkDrafts(homeworkId) {
  if (!homeworkId) return;
  const drafts = loadObj(K.drafts);
  let changed = false;
  Object.keys(drafts).forEach(key => {
    if (key.includes(`:${homeworkId}`)) {
      delete drafts[key];
      changed = true;
    }
  });
  if (changed) save(K.drafts, drafts);
}

export function upsert(key, data, defaults = {}) {
  const all = load(key);
  const now = new Date().toISOString();
  const id = (data && data.id) || uid();
  const idx = (data && data.id) ? all.findIndex(r => r.id === data.id) : -1;
  if (idx >= 0) {
    const merged = { ...all[idx], ...data, id, updatedAt: now };
    all[idx] = merged;
    save(key, all);
    return merged;
  }
  const record = { ...defaults, ...data, id, createdAt: (data && data.createdAt) || now, updatedAt: now };
  all.unshift(record);
  save(key, all);
  return record;
}

export function loadWithIds(key) {
  const all = load(key);
  let changed = false;
  for (const r of all) {
    if (r && !r.id) { r.id = uid(); changed = true; }
  }
  if (changed) save(key, all);
  return all;
}

export function dbReady(entityKey) {
  return dbHasEntity(entityKey) && Boolean(getDbContext());
}

export async function listVia(entityKey, lsKey, filterFn) {
  if (dbReady(entityKey)) {
    try {
      const all = await dbList(entityKey);
      if (Array.isArray(all)) return filterFn ? all.filter(filterFn) : all;
    } catch (e) {
      console.warn(`[workflow] ${entityKey} list via Supabase failed, using localStorage:`, e.message);
    }
  }
  const all = loadWithIds(lsKey);
  return filterFn ? all.filter(filterFn) : all;
}

export async function saveVia(entityKey, lsKey, data, defaults = {}) {
  const now = new Date().toISOString();
  const id = (data && data.id) || uid();
  const record = { ...defaults, ...data, id, createdAt: (data && data.createdAt) || now, updatedAt: now };
  if (dbReady(entityKey)) {
    try {
      const saved = await dbUpsert(entityKey, record);
      if (saved) return saved;
    } catch (e) {
      console.warn(`[workflow] ${entityKey} save via Supabase failed, using localStorage:`, e.message);
    }
  }
  const all = load(lsKey);
  const idx = (data && data.id) ? all.findIndex(r => r.id === data.id) : -1;
  if (idx >= 0) { const merged = { ...all[idx], ...record }; all[idx] = merged; save(lsKey, all); return merged; }
  all.unshift(record);
  save(lsKey, all);
  return record;
}

export async function removeVia(entityKey, lsKey, id) {
  if (dbReady(entityKey)) {
    try { if (await dbRemove(entityKey, id)) return; }
    catch (e) { console.warn(`[workflow] ${entityKey} delete via Supabase failed, using localStorage:`, e.message); }
  }
  save(lsKey, load(lsKey).filter(r => r.id !== id));
}

export async function clearWorkflowData() {
  Object.values(K).forEach(k => localStorage.removeItem(k));
}
