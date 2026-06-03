/**
 * exercise-library.js — Teacher's persistent, reusable exercise bank.
 *
 * Exercises built or AI-generated in the homework builder normally live only
 * inside one homework assignment. This module lets the teacher save any
 * exercise into a personal library and pull it back into any future homework.
 *
 * STORAGE: Supabase `exercises` table when the teacher is authenticated with
 * Supabase (cross-device, survives cache clears) — otherwise a localStorage
 * fallback (`vv:exerciseLibrary`) so the feature still works for dev/local
 * teacher logins and offline. This is the pilot slice of the broader
 * localStorage→Supabase migration.
 *
 * All functions are async (the Supabase path is network-bound). The
 * localStorage path resolves synchronously-fast but is still awaited.
 *
 * Stored shape (both backends), extends the platform exercise format:
 *   { id, type, …type-specific fields…, title, tags: [], level: '',
 *     createdAt, usageCount }
 */

import {
  getSupabaseConfig,
  readStoredSupabaseSession,
  buildSupabaseHeaders,
} from './supabase-storage.js';

const LIBRARY_KEY = 'vv:exerciseLibrary';

/* ─── backend selection ──────────────────────────────────────── */
// Use Supabase only when configured AND the teacher has a live Supabase
// session token. Local/dev password logins have no token → localStorage.
function supabaseCtx() {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) return null;
  const session = readStoredSupabaseSession();
  if (!session?.access_token) return null;
  return { url: cfg.url, anonKey: cfg.anonKey, token: session.access_token };
}

/* ─── localStorage fallback ──────────────────────────────────── */
function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]'); }
  catch { return []; }
}
function lsSave(list) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(list)); } catch {}
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─── shared helpers ─────────────────────────────────────────── */

/** Stable-ish content signature so saving the same exercise twice updates, not duplicates. */
function contentHash(ex) {
  return [
    ex.type,
    ex.question, ex.template, ex.prompt, ex.errorText,
    Array.isArray(ex.sentences) ? ex.sentences.join('|') : '',
    Array.isArray(ex.options) ? ex.options.join('|') : '',
    Array.isArray(ex.pairs) ? ex.pairs.map(p => `${p.term}=${p.def}`).join('|') : '',
  ].filter(Boolean).join('::').trim().toLowerCase();
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

/** Split a saved exercise into { meta, fields } where fields are the type-specific platform fields. */
function splitExercise(exercise, meta = {}) {
  const { id, title, tags, level, createdAt, usageCount, ...fields } = exercise;
  return {
    fields,
    title: meta.title || deriveTitle(exercise),
    tags: Array.isArray(meta.tags) ? meta.tags : (Array.isArray(tags) ? tags : []),
    level: meta.level || level || '',
  };
}

/** Map a Supabase `exercises` row back into the flat library-exercise shape used by the UI. */
function rowToExercise(row) {
  return {
    ...(row.content || {}),
    id: row.id,
    type: row.type,
    title: row.title || '',
    tags: row.tags || [],
    level: row.level || '',
    createdAt: row.created_at,
    usageCount: row.usage_count || 0,
  };
}

/* ─── Supabase REST ──────────────────────────────────────────── */
async function sbFetch(ctx, path, init = {}) {
  const res = await fetch(`${ctx.url}/rest/v1/${path}`, {
    ...init,
    headers: buildSupabaseHeaders(ctx.anonKey, ctx.token, init.headers),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${init.method || 'GET'} ${path} → ${res.status} ${body}`);
  }
  return res;
}

/* ─── public API (async) ─────────────────────────────────────── */

/** All saved exercises, newest first. */
export async function getLibraryExercises() {
  const ctx = supabaseCtx();
  if (!ctx) return lsLoad();
  try {
    const res = await sbFetch(ctx, 'exercises?select=*&order=created_at.desc');
    return (await res.json()).map(rowToExercise);
  } catch (e) {
    console.warn('[exercise-library] Supabase read failed, falling back to localStorage:', e.message);
    return lsLoad();
  }
}

/**
 * Save an exercise to the library. Strips its per-homework id, derives a title,
 * and dedupes by content signature (re-save updates the existing entry).
 * Returns the stored record (flat library-exercise shape).
 */
export async function saveExerciseToLibrary(exercise, meta = {}) {
  if (!exercise || !exercise.type) return null;
  const { fields, title, tags, level } = splitExercise(exercise, meta);
  const ctx = supabaseCtx();

  if (ctx) {
    try {
      const sig = contentHash(exercise);
      // Dedupe: look for an existing row with the same content signature.
      const existing = (await (await sbFetch(ctx, 'exercises?select=*&order=created_at.desc')).json())
        .map(rowToExercise)
        .find(e => contentHash(e) === sig);

      const payload = { type: exercise.type, title, tags, level, content: fields };
      if (existing) {
        const res = await sbFetch(ctx, `exercises?id=eq.${existing.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload),
        });
        return rowToExercise((await res.json())[0]);
      }
      const res = await sbFetch(ctx, 'exercises', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),  // teacher_id defaults to auth.uid() server-side
      });
      return rowToExercise((await res.json())[0]);
    } catch (e) {
      console.warn('[exercise-library] Supabase save failed, falling back to localStorage:', e.message);
      // fall through to localStorage
    }
  }

  // localStorage path (fallback / unauthenticated / dev login)
  const list = lsLoad();
  const sig = contentHash(exercise);
  const base = { ...fields, type: exercise.type, title, tags, level };
  const idx = list.findIndex(e => contentHash(e) === sig);
  if (idx >= 0) {
    const prev = list[idx];
    const updated = { ...prev, ...base, id: prev.id, createdAt: prev.createdAt, usageCount: prev.usageCount || 0 };
    list[idx] = updated;
    lsSave(list);
    return updated;
  }
  const record = { ...base, id: 'lib_' + uid(), createdAt: new Date().toISOString(), usageCount: 0 };
  list.unshift(record);
  lsSave(list);
  return record;
}

/** Remove a saved exercise by id. */
export async function deleteLibraryExercise(id) {
  const ctx = supabaseCtx();
  if (ctx) {
    try {
      await sbFetch(ctx, `exercises?id=eq.${id}`, { method: 'DELETE' });
      return;
    } catch (e) {
      console.warn('[exercise-library] Supabase delete failed, falling back to localStorage:', e.message);
    }
  }
  lsSave(lsLoad().filter(e => e.id !== id));
}

/** Bump usage count (called when a saved exercise is added into a homework). */
export async function incrementUsage(id) {
  const ctx = supabaseCtx();
  if (ctx) {
    try {
      // read current, then write +1 (no atomic RPC for the pilot)
      const rows = await (await sbFetch(ctx, `exercises?id=eq.${id}&select=usage_count`)).json();
      const current = rows[0]?.usage_count || 0;
      await sbFetch(ctx, `exercises?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ usage_count: current + 1 }),
      });
      return;
    } catch (e) {
      console.warn('[exercise-library] Supabase usage bump failed, falling back to localStorage:', e.message);
    }
  }
  const list = lsLoad();
  const idx = list.findIndex(e => e.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], usageCount: (list[idx].usageCount || 0) + 1 };
    lsSave(list);
  }
}
