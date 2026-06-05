/**
 * supabase-db.js — dual-mode persistence adapter.
 *
 * The app's data layer (workflow.js) keeps its existing record shapes: string
 * `id`s, camelCase fields. This module stores those records in Supabase when the
 * user has a live session, otherwise workflow.js falls back to localStorage.
 *
 * STRATEGY (mirrors exercise-library.js):
 *   - The full app record is stored in a `content jsonb` column (for tables that
 *     have one) or mapped onto typed columns (submissions, students, …).
 *   - Relational columns (teacher_id, student_id, homework_id, local_id) are
 *     populated to satisfy RLS + foreign keys and to let the teacher query by
 *     student. They are write-side obligations — on read we return the preserved
 *     `content`, so workflow.js's existing in-memory `.filter(s => s.studentId …)`
 *     keeps working unchanged.
 *   - Reads fetch all rows the RLS lets you see (teacher: their students' data;
 *     student: their own) and reconstruct app records. Data volumes are small
 *     (one teacher, a handful of students), so in-memory filtering is fine.
 *
 * Any network failure THROWS so the caller can fall back to localStorage.
 */

import {
  getSupabaseConfig,
  readStoredSupabaseSession,
  buildSupabaseHeaders,
  parseJwtClaims,
} from './supabase-storage.js';

/* ─── session / context ──────────────────────────────────────── */

const ROLE_KEY = 'vv:db_role';

/** Persist the role resolved at sign-in so getDbContext() can scope writes. */
export function setSessionRole(role) {
  try {
    if (role) localStorage.setItem(ROLE_KEY, role);
    else localStorage.removeItem(ROLE_KEY);
  } catch { /* ignore */ }
}

/** Returns { url, anonKey, token, authUid, role } or null (null ⇒ localStorage mode). */
export function getDbContext() {
  const cfg = getSupabaseConfig();
  if (!cfg.isConfigured) return null;
  const session = readStoredSupabaseSession();
  if (!session?.access_token) return null;
  const claims = parseJwtClaims(session.access_token) || {};
  const authUid = session.user?.id || claims.sub || null;
  if (!authUid) return null;
  // Role is resolved at sign-in (claim flow) and cached; default teacher.
  let role = 'teacher';
  try { role = localStorage.getItem(ROLE_KEY) || role; } catch { /* ignore */ }
  return { url: cfg.url, anonKey: cfg.anonKey, token: session.access_token, authUid, role };
}

export function dbEnabled() {
  return Boolean(getDbContext());
}

/* ─── REST helpers ───────────────────────────────────────────── */

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

export async function sbSelect(ctx, table, query = '') {
  const res = await sbFetch(ctx, `${table}${query ? `?${query}` : ''}`);
  return res.json();
}

async function sbInsert(ctx, table, row) {
  const res = await sbFetch(ctx, table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  return (await res.json())[0];
}

async function sbUpdate(ctx, table, filter, patch) {
  const res = await sbFetch(ctx, `${table}?${filter}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  return (await res.json())[0] || null;
}

async function sbDelete(ctx, table, filter) {
  await sbFetch(ctx, `${table}?${filter}`, { method: 'DELETE' });
}

/* ─── id resolution (local string ⇄ row uuid) ────────────────── */
// Only students/homework/class_events carry local_id bridge columns; those are
// the entities other records reference by foreign key, so we map them both ways.

let refsCache = null;

async function loadRefs(ctx) {
  const [students, homework] = await Promise.all([
    sbSelect(ctx, 'students', 'select=id,local_id'),
    sbSelect(ctx, 'homework', 'select=id,local_id'),
  ]);
  const r = {
    studentByLocal: new Map(), studentByUuid: new Map(),
    hwByLocal: new Map(), hwByUuid: new Map(),
  };
  for (const s of students) {
    if (s.local_id) r.studentByLocal.set(s.local_id, s.id);
    r.studentByUuid.set(s.id, s.local_id || s.id);
  }
  for (const h of homework) {
    if (h.local_id) r.hwByLocal.set(h.local_id, h.id);
    r.hwByUuid.set(h.id, h.local_id || h.id);
  }
  refsCache = r;
  return r;
}

async function getRefs(ctx, force = false) {
  if (!refsCache || force) await loadRefs(ctx);
  return refsCache;
}

/** Invalidate caches when an entity that others reference changes. */
export function invalidateRefs() { refsCache = null; teacherIdCache = null; }

// Every row's teacher_id must be the *teacher's* profile id, even when a student
// writes the row (e.g. a submission). For a teacher session that's authUid; for a
// student session we read it off their own students row (students.teacher_id).
let teacherIdCache = null; // { authUid, teacherId }

async function resolveTeacherId(ctx) {
  if (ctx.role !== 'student') return ctx.authUid;
  if (teacherIdCache && teacherIdCache.authUid === ctx.authUid) return teacherIdCache.teacherId;
  const rows = await sbSelect(ctx, 'students', `auth_user_id=eq.${ctx.authUid}&select=teacher_id&limit=1`);
  const teacherId = rows[0]?.teacher_id || null;
  teacherIdCache = { authUid: ctx.authUid, teacherId };
  return teacherId;
}

async function studentUuid(ctx, localId) {
  if (!localId) return null;
  let refs = await getRefs(ctx);
  if (refs.studentByLocal.has(localId)) return refs.studentByLocal.get(localId);
  refs = await getRefs(ctx, true);
  return refs.studentByLocal.get(localId) || null;
}

async function homeworkUuid(ctx, localId) {
  if (!localId) return null;
  let refs = await getRefs(ctx);
  if (refs.hwByLocal.has(localId)) return refs.hwByLocal.get(localId);
  refs = await getRefs(ctx, true);
  return refs.hwByLocal.get(localId) || null;
}

function studentLocal(refs, uuid) { return uuid ? (refs.studentByUuid.get(uuid) || uuid) : null; }
function homeworkLocal(refs, uuid) { return uuid ? (refs.hwByUuid.get(uuid) || uuid) : null; }

/* ─── entity registry ────────────────────────────────────────── */
// Each entity defines how an app record maps to/from a DB row.
//   table      — Supabase table name
//   key        — how to locate a row by the app's id ('local_id' | 'content' | 'uuid')
//   uuidAsId   — true when the app record's id IS the row uuid (no local id kept)
//   toRow      — async (record, ctx) → DB row  (resolves FK uuids)
//   fromRow    — (row, refs) → app record
//   refEntity  — true if this entity is referenced by FK (invalidate refs on write)

/** Generic builder for tables that have a `content jsonb` catch-all column. */
function contentEntity(table, { student = true, extra } = {}) {
  return {
    table,
    key: 'content',          // located by content->>id
    refEntity: false,
    async toRow(record, ctx) {
      const row = { teacher_id: ctx.teacherId, content: record };
      if (student && record.studentId) row.student_id = await studentUuid(ctx, record.studentId);
      if (extra) Object.assign(row, extra(record));
      return row;
    },
    fromRow(row) { return { ...(row.content || {}), id: row.content?.id || row.id }; },
  };
}

const ENTITIES = {
  /* students — teacher-managed roster (referenced by everything) */
  studentsCrud: {
    table: 'students',
    key: 'local_id',
    refEntity: true,
    async toRow(record, ctx) {
      const { password, ...safe } = record; // never persist plaintext password to the DB
      return {
        teacher_id: ctx.teacherId,
        local_id: record.id,
        name: record.name || '',
        first_name: record.firstName || '',
        email: record.email || '',
        current_level: record.currentLevel || record.band || '',
        target_level: record.targetLevel || record.bandTarget || '',
        focus_skill: record.focusSkill || record.skillFocus || '',
        metadata: safe,
      };
    },
    fromRow(row) {
      return { ...(row.metadata || {}), id: row.local_id || row.id, email: row.email, name: row.name };
    },
  },

  /* diagnoses */
  diagnoses: {
    table: 'diagnoses',
    key: 'content',
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        student_id: await studentUuid(ctx, record.studentId),
        status: record.status || 'draft',
        cycle_stage: record.cycleStage || null,
        content: record,
      };
    },
    fromRow(row) { return { ...(row.content || {}), id: row.content?.id || row.id }; },
  },

  /* homework — referenced by submissions/reviews */
  homework: {
    table: 'homework',
    key: 'local_id',
    refEntity: true,
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        student_id: await studentUuid(ctx, record.studentId),
        student_local_id: record.studentId || null,
        diagnosis_local_id: record.diagnosisId || null,
        local_id: record.id,
        title: record.title || '',
        status: record.status || 'not-started',
        assigned_at: record.assignedAt || new Date().toISOString(),
        due_at: record.dueDate || null,
        activities: record.activities || record.tasks || [],
        content: record,
      };
    },
    fromRow(row) { return { ...(row.content || {}), id: row.local_id || row.content?.id || row.id }; },
  },

  /* submissions — fully relational (no content-jsonb / local_id); app id = row uuid */
  submissions: {
    table: 'submissions',
    key: 'uuid',
    uuidAsId: true,
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        homework_id: await homeworkUuid(ctx, record.homeworkId),
        student_id: await studentUuid(ctx, record.studentId),
        status: record.status || 'submitted',
        content: record.content || null,
        responses: record.responses || null,
        submitted_at: record.submittedAt || new Date().toISOString(),
      };
    },
    fromRow(row, refs) {
      return {
        id: row.id,
        homeworkId: homeworkLocal(refs, row.homework_id),
        studentId: studentLocal(refs, row.student_id),
        content: row.content || '',
        responses: row.responses || null,
        status: row.status,
        submittedAt: row.submitted_at,
        reviewedAt: row.status === 'reviewed' ? row.updated_at : undefined,
      };
    },
  },

  /* reviews — content jsonb + relational FKs; app id = row uuid */
  reviews: {
    table: 'reviews',
    key: 'uuid',
    uuidAsId: true,
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        student_id: await studentUuid(ctx, record.studentId),
        submission_id: record.submissionId || null,   // submissions use their uuid as id
        homework_id: await homeworkUuid(ctx, record.homeworkId),
        redo_required: Boolean(record.redoRequired),
        reviewed_at: record.reviewedAt || new Date().toISOString(),
        sent_to_student: record.sentToStudent !== false,
        content: record,
      };
    },
    fromRow(row) { return { ...(row.content || {}), id: row.id }; },
  },

  /* reports */
  reports: contentEntity('reports'),
  /* practice */
  practiceAssignments: contentEntity('practice_assignments'),
  practiceResources: contentEntity('practice_resources', { student: false }),
  practiceSubmissions: contentEntity('practice_submissions'),
  /* target profiles */
  targetProfiles: {
    ...contentEntity('target_profiles'),
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        student_id: await studentUuid(ctx, record.studentId),
        is_active: Boolean(record.isActive),
        content: record,
      };
    },
  },
  /* class events */
  classEvents: {
    table: 'class_events',
    key: 'local_id',
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        student_id: await studentUuid(ctx, record.studentId),
        student_local_id: record.studentId || null,
        local_id: record.id,
        date: record.date || new Date().toISOString().slice(0, 10),
        status: record.status || 'scheduled',
        diagnostic_status: record.diagnosticStatus || null,
        homework_status: record.homeworkStatus || null,
        metadata: record,
      };
    },
    fromRow(row) { return { ...(row.metadata || {}), id: row.local_id || row.id }; },
  },
  /* class evidence */
  classEvidence: contentEntity('class_evidence'),
  /* vocabulary + progress notes */
  vocabularyBank: contentEntity('vocabulary_entries'),
  progressNotes: contentEntity('progress_notes'),
  /* error bank — per-student long-term error store (object-keyed in localStorage) */
  errorBank: contentEntity('error_bank_entries'),
};

export function dbHasEntity(key) { return Boolean(ENTITIES[key]); }

/* ─── public ops (used by workflow.js) ───────────────────────── */

/** All app records for an entity that RLS lets the current user see. Throws on network error. */
export async function dbList(entityKey) {
  const ctx = getDbContext();
  const cfg = ENTITIES[entityKey];
  if (!ctx || !cfg) return null;
  const refs = await getRefs(ctx);
  const rows = await sbSelect(ctx, cfg.table, 'select=*&order=created_at.desc');
  return rows.map(r => cfg.fromRow(r, refs));
}

/** Fetch a single app record by its app id. Returns null if not found or not in DB mode. Throws on network error. */
export async function dbGet(entityKey, appId) {
  const ctx = getDbContext();
  const cfg = ENTITIES[entityKey];
  if (!ctx || !cfg || !appId) return null;
  const refs = await getRefs(ctx);
  const rows = await sbSelect(ctx, cfg.table, `${idFilter(cfg, appId)}&limit=1`);
  return rows.length ? cfg.fromRow(rows[0], refs) : null;
}

function idFilter(cfg, appId) {
  if (cfg.key === 'local_id') return `local_id=eq.${encodeURIComponent(appId)}`;
  if (cfg.key === 'uuid') return `id=eq.${encodeURIComponent(appId)}`;
  return `content->>id=eq.${encodeURIComponent(appId)}`;
}

/**
 * Create or update one app record. Returns the stored app record (with its id),
 * or null when not in DB mode. Throws on network error (caller falls back to LS).
 */
export async function dbUpsert(entityKey, record) {
  const baseCtx = getDbContext();
  const cfg = ENTITIES[entityKey];
  if (!baseCtx || !cfg) return null;

  // teacher_id on every row must be the teacher's id, even for student writes.
  const ctx = { ...baseCtx, teacherId: await resolveTeacherId(baseCtx) };
  const row = await cfg.toRow(record, ctx);
  let saved;

  if (cfg.uuidAsId && record.id && /^[0-9a-f-]{36}$/i.test(record.id)) {
    // existing row addressed by its uuid
    saved = await sbUpdate(ctx, cfg.table, `id=eq.${record.id}`, row);
    if (!saved) saved = await sbInsert(ctx, cfg.table, row);
  } else if (cfg.uuidAsId) {
    // new relational record — let the DB assign the uuid
    saved = await sbInsert(ctx, cfg.table, row);
  } else {
    // content/local_id keyed: update if present, else insert
    const existing = await sbSelect(ctx, cfg.table, `${idFilter(cfg, record.id)}&select=id&limit=1`);
    if (existing.length) saved = await sbUpdate(ctx, cfg.table, idFilter(cfg, record.id), row);
    else saved = await sbInsert(ctx, cfg.table, row);
  }

  if (cfg.refEntity) invalidateRefs();
  const refs = await getRefs(ctx);
  return cfg.fromRow(saved, refs);
}

/** Delete one app record by its app id. Returns true if attempted in DB mode. */
export async function dbRemove(entityKey, appId) {
  const ctx = getDbContext();
  const cfg = ENTITIES[entityKey];
  if (!ctx || !cfg) return false;
  await sbDelete(ctx, cfg.table, idFilter(cfg, appId));
  if (cfg.refEntity) invalidateRefs();
  return true;
}

/* ─── Storage (student speaking audio) ───────────────────────── */

const AUDIO_BUCKET = 'submission-audio';

/** Upload a recorded audio Blob to the private bucket. Returns the object path. Throws on failure. */
export async function uploadSubmissionAudio(blob, path) {
  const ctx = getDbContext();
  if (!ctx) throw new Error('Not signed in.');
  const res = await fetch(`${ctx.url}/storage/v1/object/${AUDIO_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': blob.type || 'audio/webm',
      'x-upsert': 'true',
    },
    body: blob,
  });
  if (!res.ok) throw new Error(`audio upload → ${res.status} ${await res.text().catch(() => '')}`);
  return path;
}

/** Create a time-limited signed URL to play a private audio object. Returns null on failure. */
export async function createSignedAudioUrl(path, expiresIn = 3600) {
  const ctx = getDbContext();
  if (!ctx || !path) return null;
  try {
    const res = await fetch(`${ctx.url}/storage/v1/object/sign/${AUDIO_BUCKET}/${path}`, {
      method: 'POST',
      headers: { apikey: ctx.anonKey, Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn }),
    });
    if (!res.ok) return null;
    const { signedURL } = await res.json();
    return signedURL ? `${ctx.url}/storage/v1${signedURL}` : null;
  } catch {
    return null;
  }
}

/* ─── auth / profile linking (called at sign-in) ─────────────── */

/** Upsert the caller's own profile row (id = auth uid). Best-effort. */
export async function ensureProfile(role, { displayName, studentUuid } = {}) {
  const ctx = getDbContext();
  if (!ctx) return;
  const row = { id: ctx.authUid, role };
  if (displayName) row.display_name = displayName;
  if (studentUuid) row.student_id = studentUuid;
  try {
    await sbFetch(ctx, 'profiles', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.warn('[supabase-db] ensureProfile failed:', e.message);
  }
}

/**
 * Attach the signed-in user to a teacher-created roster row matched by email
 * (the "students self-claim by email" RLS policy gates this). Returns the
 * claimed student's { id (uuid), local_id } or null if there is no matching row
 * (⇒ the user is a teacher, not a student).
 */
export async function claimStudentByEmail(email) {
  const ctx = getDbContext();
  if (!ctx || !email) return null;
  try {
    // No-op if already claimed by someone else or none matches.
    await sbUpdate(ctx, 'students', `email=eq.${encodeURIComponent(email)}&auth_user_id=is.null`, { auth_user_id: ctx.authUid });
  } catch (e) {
    console.warn('[supabase-db] claimStudentByEmail update failed:', e.message);
  }
  try {
    const mine = await sbSelect(ctx, 'students', `auth_user_id=eq.${ctx.authUid}&select=id,local_id&limit=1`);
    invalidateRefs();
    return mine[0] || null;
  } catch (e) {
    console.warn('[supabase-db] claimStudentByEmail select failed:', e.message);
    return null;
  }
}
