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
  refreshSupabaseSession,
} from './supabase-storage.js';

/* ─── cache ────────────────────────────────────────────────── */

const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function invalidateCache(table) {
  for (const key of cache.keys()) {
    if (key.startsWith(`${table}:`)) {
      cache.delete(key);
    }
  }
}

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
  const cacheKey = `${table}:${query}`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  const res = await sbFetch(ctx, `${table}${query ? `?${query}` : ''}`);
  const data = await res.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

async function sbInsert(ctx, table, row) {
  const res = await sbFetch(ctx, table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  invalidateCache(table);
  return (await res.json())[0];
}

async function sbUpdate(ctx, table, filter, patch) {
  const res = await sbFetch(ctx, `${table}?${filter}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  invalidateCache(table);
  return (await res.json())[0] || null;
}

async function sbDelete(ctx, table, filter) {
  await sbFetch(ctx, `${table}?${filter}`, { method: 'DELETE' });
  invalidateCache(table);
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

  /* seeds stages — one row per student tracking SEEDS cycle stage */
  seedsStages: {
    ...contentEntity('seeds_stages'),
    async toRow(record, ctx) {
      return {
        teacher_id: ctx.teacherId,
        student_id: await studentUuid(ctx, record.studentId),
        stage: record.stage || '',
        note: record.note || '',
        started_at: record.startedAt || null,
        content: record,
      };
    },
  },

  /* listening exercises — teacher-managed exercise bank */
  listeningExercises: contentEntity('listening_exercises', { student: false }),

  /* mock test results — per-student mock test submissions */
  mockTestResults: contentEntity('mock_test_results'),
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

/* ─── Realtime subscriptions ────────────────────────────────── */

/**
 * Subscribe to realtime changes on a table via Supabase WebSocket.
 * Calls `onChange` with { eventType, new, old } for each matching change.
 * Returns an unsubscribe function.
 * Works only when a Supabase session is active.
 */
export function subscribeToTable(table, onChange, { event, filter } = {}) {
  const ctx = getDbContext();
  if (!ctx) return () => {};

  const channelName = `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const subUrl = `${ctx.url}/realtime/v1/websocket?apikey=${ctx.anonKey}&token=${ctx.token}`;

  let ws = null;
  let closed = false;

  function connect() {
    if (closed) return;
    try {
      ws = new WebSocket(subUrl);
    } catch {
      return;
    }

    ws.onopen = () => {
      const subscribeMsg = {
        topic: `realtime:${table}`,
        event: 'phx_join',
        payload: { config: { broadcast: { self: false } } },
        ref: '1',
      };
      ws.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.event === 'postgres_changes' && data.payload) {
          const change = data.payload;
          if (!event || change.type === event) {
            onChange({
              eventType: change.type,
              new: change.record || change.new,
              old: change.old_record || change.old,
            });
          }
        }
      } catch {
      }
    };

    ws.onclose = () => {
      if (!closed) setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return () => {
    closed = true;
    ws?.close();
  };
}

/* ─── Storage (student speaking audio) ───────────────────────── */

const AUDIO_BUCKET = 'submission-audio';
const MOCK_AUDIO_BUCKET = 'mock-test-audio';

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

/** Upload a mock test speaking recording blob to the mock-test-audio bucket. Returns the object path. */
export async function uploadMockTestAudio(blob, path) {
  const ctx = getDbContext();
  if (!ctx) throw new Error('Not signed in.');
  const res = await fetch(`${ctx.url}/storage/v1/object/${MOCK_AUDIO_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': blob.type || 'audio/webm',
    },
    body: blob,
  });
  if (!res.ok) throw new Error(`mock audio upload → ${res.status} ${await res.text().catch(() => '')}`);
  return path;
}

/** Get a signed URL for a mock test audio file. */
export async function getMockTestAudioUrl(path, expiresIn = 86400) {
  return createSignedAudioUrlFromBucket(MOCK_AUDIO_BUCKET, path, expiresIn);
}

async function createSignedAudioUrlFromBucket(bucket, path, expiresIn = 3600) {
  const ctx = getDbContext();
  if (!ctx || !path) return null;
  try {
    const res = await fetch(`${ctx.url}/storage/v1/object/sign/${bucket}/${path}`, {
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

/* ─── Storage (exercise images) ──────────────────────────────── */

const IMAGE_BUCKET = 'exercise-images';

/**
 * Upload a teacher-supplied image to the public exercise-images bucket.
 * Returns a stable public URL suitable for storing in exercise.imageUrl and
 * rendering directly in an <img src>. Throws on failure.
 */
export async function uploadExerciseImage(file, path) {
  // Refresh the session if the token is close to expiry (within 5 min).
  const stored = readStoredSupabaseSession();
  if (stored && stored.expires_at && stored.expires_at - 300 <= Math.floor(Date.now() / 1000)) {
    await refreshSupabaseSession();
  }
  const ctx = getDbContext();
  if (!ctx) throw new Error('Not signed in.');
  const res = await fetch(`${ctx.url}/storage/v1/object/${IMAGE_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': file.type || 'image/png',
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!res.ok) throw new Error(`image upload → ${res.status} ${await res.text().catch(() => '')}`);
  return `${ctx.url}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

/* ─── teacher settings ───────────────────────────────────────── */

/**
 * Read one teacher setting by key. Works for both teacher and student sessions
 * (students can read their teacher's settings via RLS). Returns the stored string
 * value, or null if not found / DB unavailable.
 */
export async function getTeacherSetting(key) {
  const ctx = getDbContext();
  if (!ctx) return null;
  try {
    const teacherId = await resolveTeacherId(ctx);
    if (!teacherId) return null;
    const rows = await sbSelect(
      ctx,
      'teacher_settings',
      `teacher_id=eq.${teacherId}&key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
    );
    return rows[0]?.value ?? null;
  } catch (e) {
    console.warn('[supabase-db] getTeacherSetting failed:', e.message);
    return null;
  }
}

/**
 * Upsert one teacher setting. Only callable by a teacher session.
 * Pass value=null to delete the setting.
 */
export async function setTeacherSetting(key, value) {
  const baseCtx = getDbContext();
  if (!baseCtx) return false;
  try {
    const ctx = { ...baseCtx, teacherId: await resolveTeacherId(baseCtx) };
    if (!ctx.teacherId) return false;
    if (value === null || value === undefined) {
      await sbDelete(ctx, 'teacher_settings', `teacher_id=eq.${ctx.teacherId}&key=eq.${encodeURIComponent(key)}`);
    } else {
      await sbFetch(ctx, 'teacher_settings', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ teacher_id: ctx.teacherId, key, value: String(value) }),
      });
    }
    return true;
  } catch (e) {
    console.warn('[supabase-db] setTeacherSetting failed:', e.message);
    return false;
  }
}

/* ─── review schedule (spaced-repetition persistence) ───────── */

/**
 * Bulk-upsert a student's full review schedule.
 * Called by spaced-repetition.js via enableSync() on every SR state change.
 * @param {string} localStudentId — app local string id (e.g. "ana-paula")
 * @param {object[]} list — full schedule array from localStorage
 */
export async function upsertReviewSchedule(localStudentId, list) {
  const ctx = getDbContext();
  if (!ctx || !list?.length) return;
  const sid = await studentUuid(ctx, localStudentId);
  if (!sid) return;
  const rows = list.map(e => ({
    student_id: sid,
    error_id: e.errorId,
    error_text: e.errorText || '',
    correct_text: e.correctText || '',
    interval_days: e.interval || 1,
    last_seen: e.lastSeen || null,
    next_due: e.nextDue || null,
    source_diagnosis_id: e.sourceDiagnosisId || null,
    practice_count: e.practiceCount || 0,
    mastered: Boolean(e.mastered),
  }));
  await sbFetch(ctx, 'review_schedule?on_conflict=student_id,error_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
}

/**
 * Load a student's review schedule from Supabase and write it to localStorage
 * so the in-memory SR module picks it up without a schema change.
 * Returns the list of schedule entries (or [] if DB unavailable / empty).
 */
export async function loadReviewSchedule(localStudentId) {
  const ctx = getDbContext();
  if (!ctx) return [];
  try {
    const sid = await studentUuid(ctx, localStudentId);
    if (!sid) return [];
    const rows = await sbSelect(
      ctx,
      'review_schedule',
      `student_id=eq.${sid}&select=*&order=created_at.asc`,
    );
    return rows.map(r => ({
      id: r.id,
      studentId: localStudentId,
      errorId: r.error_id,
      errorText: r.error_text || '',
      correctText: r.correct_text || '',
      interval: r.interval_days || 1,
      lastSeen: r.last_seen || null,
      nextDue: r.next_due || null,
      sourceDiagnosisId: r.source_diagnosis_id || null,
      practiceCount: r.practice_count || 0,
      mastered: Boolean(r.mastered),
    }));
  } catch (e) {
    console.warn('[supabase-db] loadReviewSchedule:', e.message);
    return [];
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
 * Attach the signed-in user to a teacher-created roster row matched by email.
 * Uses the `claim_student_by_email` SECURITY DEFINER RPC, which links the
 * caller's row using their OWN verified JWT email server-side (it can't claim
 * anyone else's). The direct RLS self-claim UPDATE policy proved unreliable in
 * practice, so we no longer depend on it. Returns the claimed student's
 * { id (uuid), local_id } or null if there is no matching row (⇒ the user is a
 * teacher, not a student). The `email` arg is ignored (the server reads the JWT).
 */
export async function claimStudentByEmail(email) {
  const ctx = getDbContext();
  if (!ctx) return null;
  try {
    const res = await sbFetch(ctx, 'rpc/claim_student_by_email', { method: 'POST', body: '{}' });
    const rows = await res.json();
    invalidateRefs();
    if (Array.isArray(rows) && rows[0]) return rows[0];
  } catch (e) {
    console.warn('[supabase-db] claimStudentByEmail RPC failed:', e.message);
  }
  // Fallback: already claimed in a prior session — find the row by auth uid.
  try {
    const mine = await sbSelect(ctx, 'students', `auth_user_id=eq.${ctx.authUid}&select=id,local_id&limit=1`);
    invalidateRefs();
    return mine[0] || null;
  } catch (e) {
    console.warn('[supabase-db] claimStudentByEmail select failed:', e.message);
    return null;
  }
}

/* ─── Storage: teacher resources (public bucket) ────────────── */

const RESOURCE_BUCKET = 'teacher-resources';

/**
 * Upload a file (image or audio) to the public teacher-resources bucket.
 * Path: {folder}/{timestamp}-{filename}
 */
export async function uploadTeacherResource(file, folder = 'images') {
  // Refresh the session if the token is close to expiry (within 5 min).
  const stored = readStoredSupabaseSession();
  if (stored && stored.expires_at && stored.expires_at - 300 <= Math.floor(Date.now() / 1000)) {
    await refreshSupabaseSession();
  }
  const ctx = getDbContext();
  if (!ctx) throw new Error('Not signed in.');
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const res = await fetch(`${ctx.url}/storage/v1/object/${RESOURCE_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!res.ok) throw new Error(`upload → ${res.status} ${await res.text().catch(() => '')}`);
  return `${ctx.url}/storage/v1/object/public/${RESOURCE_BUCKET}/${path}`;
}

/**
 * List all objects in a folder (e.g. 'images' or 'audio').
 * Returns an array of { name, created_at, updated_at, id, ... } or null.
 */
export async function listTeacherResources(folder = 'images') {
  const ctx = getDbContext();
  if (!ctx) return null;
  try {
    const res = await fetch(`${ctx.url}/storage/v1/object/list/${RESOURCE_BUCKET}`, {
      method: 'POST',
      headers: { apikey: ctx.anonKey, Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: `${folder}/`, sortBy: { column: 'created_at', order: 'desc' } }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Delete a resource by its full path (e.g. 'images/abc123.jpg').
 */
export async function deleteTeacherResource(path) {
  const ctx = getDbContext();
  if (!ctx) throw new Error('Not signed in.');
  const res = await fetch(`${ctx.url}/storage/v1/object/${RESOURCE_BUCKET}/${path}`, {
    method: 'DELETE',
    headers: { apikey: ctx.anonKey, Authorization: `Bearer ${ctx.token}` },
  });
  if (!res.ok) throw new Error(`delete → ${res.status}`);
}

/* ─── Listening Exercises ──────────────────────────────────── */

export async function addListeningExercise(exercise) {
  return dbUpsert('listeningExercises', {
    id: exercise.id || crypto.randomUUID(),
    ...exercise,
    createdAt: new Date().toISOString(),
  });
}

export async function getListeningExercises() {
  return dbList('listeningExercises');
}
