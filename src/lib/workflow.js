/**
 * workflow.js — V.V. Method data layer
 *
 * Dual-mode persistence: when the user has a live Supabase session, list
 * entities are read/written through src/lib/supabase-db.js (cross-device);
 * otherwise everything falls back to localStorage (offline / dev logins).
 * Function signatures are unchanged — all callers already `await`.
 */

import { getDbContext, dbHasEntity, dbList, dbUpsert, dbRemove } from './supabase-db.js';

const K = {
  sessions:    'vv:sessions',
  diagnoses:   'vv:diagnoses',
  feedback:    'vv:feedback',
  homework:    'vv:homework',
  practiceAssignments: 'vv:practiceAssignments',
  practiceResources:   'vv:practiceResources',
  practiceSubmissions: 'vv:practiceSubmissions',
  errorBankGlobal:     'vv:errorBankGlobal',
  reports:     'vv:reports',
  submissions: 'vv:submissions',
  corrections: 'vv:corrections',
  reviews:     'vv:reviews',
  inbox:       'vv:inbox',
  progress:    'vv:progress',
  reviewed:    'vv:reviewed',
  drafts:      'vv:drafts',
  // Phase 1 new entities
  studentsCrud:    'vv:studentsCrud',
  targetProfiles:  'vv:targetProfiles',
  classEvents:     'vv:classEvents',
  classEvidence:   'vv:classEvidence',
  vocabularyBank:  'vv:vocabularyBank',
  progressNotes:   'vv:progressNotes',
};

function load(key)     { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function loadObj(key)  { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
function save(key, v)  { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function removeHomeworkDrafts(homeworkId) {
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

/**
 * upsert — safe create-or-update for id-keyed list records.
 * Guarantees a valid id even when callers pass `{ id: undefined }`, by
 * applying id/timestamps AFTER the data spread (so they can never be clobbered).
 * Matches an existing record only when data.id is truthy.
 */
function upsert(key, data, defaults = {}) {
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

/** Backfill ids for any legacy records persisted without one, then return the list. */
function loadWithIds(key) {
  const all = load(key);
  let changed = false;
  for (const r of all) {
    if (r && !r.id) { r.id = uid(); changed = true; }
  }
  if (changed) save(key, all);
  return all;
}

/* ─── dual-mode helpers (Supabase when signed in, else localStorage) ── */

/** True when this entity should route through Supabase right now. */
function dbReady(entityKey) {
  return dbHasEntity(entityKey) && Boolean(getDbContext());
}

/** List an entity's records, Supabase-first with localStorage fallback. */
async function listVia(entityKey, lsKey, filterFn) {
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

/**
 * Create-or-update one record (Supabase-first). Builds the record with defaults,
 * a stable id and timestamps, then upserts. Mirrors the localStorage `upsert`
 * semantics (match existing only when data.id is truthy) on the fallback path.
 */
async function saveVia(entityKey, lsKey, data, defaults = {}) {
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

/** Delete one record by id (Supabase-first). */
async function removeVia(entityKey, lsKey, id) {
  if (dbReady(entityKey)) {
    try { if (await dbRemove(entityKey, id)) return; }
    catch (e) { console.warn(`[workflow] ${entityKey} delete via Supabase failed, using localStorage:`, e.message); }
  }
  save(lsKey, load(lsKey).filter(r => r.id !== id));
}

/* ─── SESSIONS ───────────────────────────────────────────────── */
export async function getSessions(studentId) {
  const all = load(K.sessions);
  return studentId ? all.filter(s => s.studentId === studentId) : all;
}
export async function createSession(data) {
  const all = load(K.sessions);
  const session = {
    id: uid(),
    createdAt: new Date().toISOString(),
    date: data?.date || new Date().toISOString().slice(0, 10),
    ...data,
  };
  all.unshift(session);
  save(K.sessions, all);
  return session;
}
export async function updateSession(id, patch) {
  const all = load(K.sessions);
  const idx = all.findIndex(s => s.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; save(K.sessions, all); return all[idx]; }
  return null;
}
export async function deleteSession(id) {
  save(K.sessions, load(K.sessions).filter(s => s.id !== id));
}
export async function clearWorkflowData() {
  Object.values(K).forEach(k => localStorage.removeItem(k));
}

/* ─── DIAGNOSES ─────────────────────────────────────────────── */
export async function getDiagnoses(studentId) {
  return listVia('diagnoses', K.diagnoses, studentId ? (d => d.studentId === studentId) : null);
}
export async function getLatestDiagnosis(studentId) {
  const all = await getDiagnoses(studentId);
  return all[0] || null;
}
export async function saveDiagnosis(data) {
  return saveVia('diagnoses', K.diagnoses, data, {
    studentId: null,
    sessionId: null,
    strengths: [],
    weaknesses: [],
    grammarIssues: [],
    vocabularyIssues: [],
    skillIssues: [],
    metConnections: [],
    nextSteps: [],
    content: null,
  });
}

/* ─── FEEDBACK ───────────────────────────────────────────────── */
export async function getFeedback(studentId) {
  const all = load(K.feedback);
  return studentId ? all.filter(f => f.studentId === studentId) : all;
}
export async function saveFeedback(data) {
  return upsert(K.feedback, data, { diagnosisId: null, status: 'draft' });
}
export async function deleteFeedback(id) {
  save(K.feedback, load(K.feedback).filter(f => f.id !== id));
}

/* ─── HOMEWORK ───────────────────────────────────────────────── */
export async function getHomework(studentId) {
  return listVia('homework', K.homework, studentId ? (h => h.studentId === studentId) : null);
}
export async function saveHomework(data) {
  return saveVia('homework', K.homework, data, {
    diagnosisId: null,
    assignedAt: new Date().toISOString(),
    status: 'not-started',
    activities: data?.activities || data?.tasks || [],
  });
}
export async function deleteHomework(id) {
  if (dbReady('homework')) {
    try {
      // FKs have no cascade — remove dependent submissions + reviews first.
      const subs = await dbList('submissions');
      for (const s of (subs || []).filter(s => s.homeworkId === id)) await dbRemove('submissions', s.id);
      const revs = await dbList('reviews');
      for (const r of (revs || []).filter(r => r.homeworkId === id)) await dbRemove('reviews', r.id);
      await dbRemove('homework', id);
      removeHomeworkDrafts(id);
      return;
    } catch (e) {
      console.warn('[workflow] deleteHomework via Supabase failed, using localStorage:', e.message);
    }
  }
  save(K.homework, load(K.homework).filter(h => h.id !== id));
  save(K.submissions, load(K.submissions).filter(s => s.homeworkId !== id));
  save(K.reviews, load(K.reviews).filter(r => r.homeworkId !== id));
  removeHomeworkDrafts(id);
}

/* ─── PRACTICE ASSIGNMENTS ───────────────────────────────────── */
export async function getPracticeAssignments(studentId) {
  return listVia('practiceAssignments', K.practiceAssignments, studentId ? (p => p.studentId === studentId) : null);
}
export async function savePracticeAssignment(data) {
  return saveVia('practiceAssignments', K.practiceAssignments, data, {
    studentId: null,
    diagnosisId: null,
    resourceIds: data?.resourceIds || [],
    skillFocus: data?.skillFocus || data?.type || '',
    status: 'assigned',
  });
}
export async function deletePracticeAssignment(id) {
  return removeVia('practiceAssignments', K.practiceAssignments, id);
}

/* ─── SUBMISSIONS ────────────────────────────────────────────── */
export async function getSubmissions(studentId) {
  return listVia('submissions', K.submissions, studentId ? (s => s.studentId === studentId) : null);
}
export async function submitHomework(homeworkId, studentId, content, responses) {
  const sub = {
    id: uid(), homeworkId, studentId, content,
    responses: responses || null,
    submittedAt: new Date().toISOString(), status: 'submitted',
  };
  if (dbReady('submissions')) {
    try {
      const saved = await dbUpsert('submissions', sub);
      // Bump the homework to 'submitted' (best-effort; ignore if not visible).
      try {
        const hw = (await dbList('homework') || []).find(h => h.id === homeworkId);
        if (hw) await dbUpsert('homework', { ...hw, status: 'submitted' });
      } catch { /* student may not be able to write homework — RLS; ignore */ }
      if (saved) return saved;
    } catch (e) {
      console.warn('[workflow] submitHomework via Supabase failed, using localStorage:', e.message);
    }
  }
  const all = load(K.submissions);
  all.unshift(sub);
  save(K.submissions, all);
  const hw = load(K.homework);
  const idx = hw.findIndex(h => h.id === homeworkId);
  if (idx >= 0) { hw[idx].status = 'submitted'; save(K.homework, hw); }
  return sub;
}

/* ─── CORRECTIONS ────────────────────────────────────────────── */
export async function getCorrections(homeworkId) {
  const all = load(K.corrections);
  return all.filter(c => c.homeworkId === homeworkId);
}
export async function saveCorrection(data) {
  const all = load(K.corrections);
  const record = { id: uid(), createdAt: new Date().toISOString(), ...data };
  all.unshift(record);
  save(K.corrections, all);
  return record;
}

/* ─── DRAFT ──────────────────────────────────────────────────── */
export async function getDraft(key) {
  const drafts = loadObj(K.drafts);
  return drafts[key] || null;
}
export async function saveDraft(key, content) {
  const drafts = loadObj(K.drafts);
  drafts[key] = content;
  save(K.drafts, drafts);
}

/* ─── REVIEWED ───────────────────────────────────────────────── */
export async function isReviewed(id) {
  return load(K.reviewed).includes(id);
}
export async function markReviewed(id) {
  const all = load(K.reviewed);
  if (!all.includes(id)) { all.push(id); save(K.reviewed, all); }
}

/* ─── INBOX ──────────────────────────────────────────────────── */
export async function getInbox({ role, studentId } = {}) {
  const all = load(K.inbox);
  if (role === 'student' && studentId) return all.filter(m => m.toStudentId === studentId || m.fromStudentId === studentId);
  return all;
}
export async function sendMessage(data) {
  const all = load(K.inbox);
  const msg = { id: uid(), createdAt: new Date().toISOString(), read: false, ...data };
  all.unshift(msg);
  save(K.inbox, all);
  window.dispatchEvent(new CustomEvent('vv:messages-changed'));
  // Update unread count for teacher
  if (data.fromRole === 'student') {
    const unread = all.filter(m => m.fromRole === 'student' && !m.read).length;
    localStorage.setItem('inboxUnread', String(unread));
    window.dispatchEvent(new CustomEvent('vv:inbox-unread-changed'));
  }
  return msg;
}
export async function markRead(messageId) {
  const all = load(K.inbox);
  const idx = all.findIndex(m => m.id === messageId);
  if (idx >= 0) { all[idx].read = true; save(K.inbox, all); }
}

/* ─── PROGRESS ───────────────────────────────────────────────── */
export async function getProgress(studentId) {
  const obj = loadObj(K.progress);
  return obj[studentId] || null;
}
export async function saveProgress(studentId, data) {
  const obj = loadObj(K.progress);
  obj[studentId] = { ...obj[studentId], ...data, updatedAt: new Date().toISOString() };
  save(K.progress, obj);
}

/* ─── REPORTS ────────────────────────────────────────────────── */
export async function getReports(studentId) {
  return listVia('reports', K.reports, studentId ? (r => r.studentId === studentId) : null);
}
export async function saveReport(data) {
  return saveVia('reports', K.reports, data, {
    studentId: null,
    diagnosisIds: data?.diagnosisIds || [],
    feedbackIds: data?.feedbackIds || [],
    homeworkIds: data?.homeworkIds || [],
    content: data?.content || data?.report || null,
  });
}

/* ─── LATE STATUS ────────────────────────────────────────────── */
export async function getLateStatus(studentId) {
  const hw = await getHomework(studentId);
  const now = Date.now();
  const late = hw.filter(h => {
    if (!h.dueDate || h.status === 'completed' || h.status === 'corrected') return false;
    return new Date(h.dueDate).getTime() < now;
  });
  return { lateCount: late.length, lateItems: late };
}

/* ─── PRACTICE RESOURCES (the catalog) ───────────────────────── */
export async function getPracticeResources(filters = {}) {
  const all = await listVia('practiceResources', K.practiceResources, null);
  if (!filters || Object.keys(filters).length === 0) return all;
  return all.filter(r => {
    if (filters.skill && r.skill !== filters.skill) return false;
    if (filters.level && r.level !== filters.level) return false;
    if (filters.met_task_type && r.met_task_type !== filters.met_task_type) return false;
    if (filters.topic && !String(r.topic || '').toLowerCase().includes(String(filters.topic).toLowerCase())) return false;
    if (filters.grammar_focus && r.grammar_focus !== filters.grammar_focus) return false;
    if (filters.vocabulary_focus && r.vocabulary_focus !== filters.vocabulary_focus) return false;
    if (filters.source && r.source !== filters.source) return false;
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      const hay = `${r.title} ${(r.tags || []).join(' ')} ${r.instructions || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
export async function savePracticeResource(data) {
  const record = {
    id: data?.id || uid(),
    title: data?.title || 'Untitled resource',
    skill: data?.skill || 'mixed',
    level: data?.level || 'B1-B2',
    met_task_type: data?.met_task_type || '',
    topic: data?.topic || '',
    grammar_focus: data?.grammar_focus || '',
    vocabulary_focus: data?.vocabulary_focus || '',
    instructions: data?.instructions || '',
    content: data?.content || '',
    questions: Array.isArray(data?.questions) ? data.questions : [],
    answer_key: data?.answer_key || '',
    teacher_notes: data?.teacher_notes || '',
    student_self_check: Array.isArray(data?.student_self_check) ? data.student_self_check : [],
    estimated_time: data?.estimated_time || '',
    tags: Array.isArray(data?.tags) ? data.tags : [],
    created_by: data?.created_by || 'teacher',
    source: data?.source || 'manual', // 'manual' | 'ai' | 'diagnostic'
    createdAt: data?.createdAt || new Date().toISOString(),
    ...data,
  };
  if (dbReady('practiceResources')) {
    try { const saved = await dbUpsert('practiceResources', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] savePracticeResource via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.practiceResources);
  const existing = all.findIndex(r => r.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.practiceResources, all);
  return record;
}
export async function deletePracticeResource(id) {
  return removeVia('practiceResources', K.practiceResources, id);
}

/* ─── PRACTICE SUBMISSIONS (student answers + AI feedback) ───── */
export async function getPracticeSubmissions(query = {}) {
  const all = await listVia('practiceSubmissions', K.practiceSubmissions, null);
  if (typeof query === 'string') return all.filter(s => s.assignmentId === query || s.studentId === query);
  if (query.assignmentId) return all.filter(s => s.assignmentId === query.assignmentId);
  if (query.studentId) return all.filter(s => s.studentId === query.studentId);
  return all;
}
export async function savePracticeSubmission(data) {
  // attempt number is auto-incremented from existing submissions for the same assignment
  const existingForAssignment = await listVia('practiceSubmissions', K.practiceSubmissions, s => s.assignmentId === data.assignmentId);
  const previousAttempts = existingForAssignment.length;
  const record = {
    id: data?.id || uid(),
    assignmentId: data?.assignmentId || null,
    studentId: data?.studentId || null,
    attempt: data?.attempt || previousAttempts + 1,
    answer: data?.answer || '',
    ai_feedback: data?.ai_feedback || null,
    teacher_feedback: data?.teacher_feedback || null,
    score: data?.score ?? null,
    xpAwarded: data?.xpAwarded || 0,
    errors_observed: Array.isArray(data?.errors_observed) ? data.errors_observed : [],
    strengths_observed: Array.isArray(data?.strengths_observed) ? data.strengths_observed : [],
    status: data?.status || 'submitted', // 'submitted' | 'completed' | 'needs-redo' | 'pending-review'
    submittedAt: data?.submittedAt || new Date().toISOString(),
    ...data,
  };
  if (dbReady('practiceSubmissions')) {
    try { const saved = await dbUpsert('practiceSubmissions', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] savePracticeSubmission via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.practiceSubmissions);
  all.unshift(record);
  save(K.practiceSubmissions, all);
  return record;
}

/* ─── ERROR BANK (per-student long-term store) ───────────────── */
// localStorage shape is object-keyed (errorBankGlobal[studentId] = [entries]);
// the DB stores one row per entry (error_bank_entries) with studentId in content.
export async function getErrorBank(studentId) {
  if (dbReady('errorBank')) {
    try { return (await dbList('errorBank') || []).filter(e => e.studentId === studentId); }
    catch (e) { console.warn('[workflow] getErrorBank via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  return obj[studentId] || [];
}
export async function promoteErrorToLongTerm(diagnosisId, errorIndex, studentId) {
  // Pull the diagnosis, lift one error_bank item, dedupe by `error+correct` so a
  // teacher can click promote twice without creating duplicates.
  const diags = await getDiagnoses();
  const diag = diags.find(d => d.id === diagnosisId);
  if (!diag) return null;
  const sourceItem = diag.content?.error_bank?.[errorIndex];
  if (!sourceItem) return null;
  const sid = studentId || diag.studentId;
  if (!sid) return null;
  const existing = await getErrorBank(sid);
  const dupe = existing.find(it => it.error === sourceItem.error && it.correct === sourceItem.correct);
  if (dupe) return dupe;
  const record = {
    id: uid(),
    studentId: sid,
    error: sourceItem.error || '',
    correct: sourceItem.correct || '',
    type: sourceItem.type || 'grammar',
    explanation: sourceItem.explanation || '',
    example_sentence: sourceItem.example_sentence || '',
    sourceDiagnosisId: diagnosisId,
    status: 'active', // 'active' | 'practicing' | 'solved'
    practiceCount: 0,
    lastPracticed: null,
    createdAt: new Date().toISOString(),
  };
  if (dbReady('errorBank')) {
    try { const saved = await dbUpsert('errorBank', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] promoteErrorToLongTerm via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  obj[sid] = [record, ...(obj[sid] || [])];
  save(K.errorBankGlobal, obj);
  return record;
}
export async function markErrorPracticed(studentId, errorId) {
  if (dbReady('errorBank')) {
    try {
      const entry = (await dbList('errorBank') || []).find(e => e.id === errorId);
      if (!entry) return null;
      const practiceCount = (entry.practiceCount || 0) + 1;
      return await dbUpsert('errorBank', {
        ...entry, practiceCount,
        status: practiceCount >= 3 ? 'solved' : 'practicing',
        lastPracticed: new Date().toISOString(),
      });
    } catch (e) { console.warn('[workflow] markErrorPracticed via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  const list = obj[studentId] || [];
  const idx = list.findIndex(e => e.id === errorId);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    practiceCount: (list[idx].practiceCount || 0) + 1,
    status: list[idx].practiceCount + 1 >= 3 ? 'solved' : 'practicing',
    lastPracticed: new Date().toISOString(),
  };
  obj[studentId] = list;
  save(K.errorBankGlobal, obj);
  return list[idx];
}
export async function markErrorSolved(studentId, errorId) {
  if (dbReady('errorBank')) {
    try {
      const entry = (await dbList('errorBank') || []).find(e => e.id === errorId);
      if (!entry) return null;
      return await dbUpsert('errorBank', { ...entry, status: 'solved', lastPracticed: new Date().toISOString() });
    } catch (e) { console.warn('[workflow] markErrorSolved via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  const list = obj[studentId] || [];
  const idx = list.findIndex(e => e.id === errorId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], status: 'solved', lastPracticed: new Date().toISOString() };
  obj[studentId] = list;
  save(K.errorBankGlobal, obj);
  return list[idx];
}

/* ─── REVIEWS (teacher correction of student submissions) ────── */
export async function getReviews(studentId) {
  return listVia('reviews', K.reviews, studentId ? (r => r.studentId === studentId) : null);
}
export async function saveReview(data) {
  const record = {
    id: data?.id || uid(),
    submissionId: data?.submissionId || null,
    homeworkId: data?.homeworkId || null,
    diagnosisId: data?.diagnosisId || null,
    studentId: data?.studentId || null,
    corrections: data?.corrections || [],
    overallNote: data?.overallNote || '',
    score: data?.score ?? null,
    reviewedAt: data?.reviewedAt || new Date().toISOString(),
    createdAt: data?.createdAt || new Date().toISOString(),
    ...data,
  };
  if (dbReady('reviews')) {
    try {
      const saved = await dbUpsert('reviews', record);
      // Flip the submission + homework to 'reviewed'.
      if (record.submissionId) {
        try {
          const sub = (await dbList('submissions') || []).find(s => s.id === record.submissionId);
          if (sub) await dbUpsert('submissions', { ...sub, status: 'reviewed', reviewedAt: record.reviewedAt });
        } catch { /* ignore */ }
      }
      if (record.homeworkId) {
        try {
          const hw = (await dbList('homework') || []).find(h => h.id === record.homeworkId);
          if (hw) await dbUpsert('homework', { ...hw, status: 'reviewed', reviewedAt: record.reviewedAt });
        } catch { /* ignore */ }
      }
      if (saved) return saved;
    } catch (e) {
      console.warn('[workflow] saveReview via Supabase failed, using localStorage:', e.message);
    }
  }
  const all = load(K.reviews);
  const existing = all.findIndex(r => r.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.reviews, all);

  const submissions = load(K.submissions);
  const subIdx = submissions.findIndex(s => s.id === record.submissionId);
  if (subIdx >= 0) {
    submissions[subIdx] = { ...submissions[subIdx], status: 'reviewed', reviewedAt: record.reviewedAt };
    save(K.submissions, submissions);
  }

  const homework = load(K.homework);
  const hwIdx = homework.findIndex(h => h.id === record.homeworkId);
  if (hwIdx >= 0) {
    homework[hwIdx] = { ...homework[hwIdx], status: 'reviewed', reviewedAt: record.reviewedAt };
    save(K.homework, homework);
  }

  return record;
}
export async function deleteReview(id) {
  if (dbReady('reviews')) {
    try {
      const review = (await dbList('reviews') || []).find(r => r.id === id);
      await dbRemove('reviews', id);
      if (review?.submissionId) {
        const sub = (await dbList('submissions') || []).find(s => s.id === review.submissionId);
        if (sub) await dbUpsert('submissions', { ...sub, status: 'submitted', reviewedAt: undefined });
      }
      if (review?.homeworkId) {
        try {
          const hw = (await dbList('homework') || []).find(h => h.id === review.homeworkId);
          if (hw) await dbUpsert('homework', { ...hw, status: 'submitted', reviewedAt: undefined });
        } catch { /* ignore */ }
      }
      return;
    } catch (e) {
      console.warn('[workflow] deleteReview via Supabase failed, using localStorage:', e.message);
    }
  }
  const reviews = load(K.reviews);
  const review = reviews.find(r => r.id === id);
  save(K.reviews, reviews.filter(r => r.id !== id));

  if (review?.submissionId) {
    const submissions = load(K.submissions);
    const subIdx = submissions.findIndex(s => s.id === review.submissionId);
    if (subIdx >= 0) {
      submissions[subIdx] = { ...submissions[subIdx], status: 'submitted' };
      delete submissions[subIdx].reviewedAt;
      save(K.submissions, submissions);
    }
  }
  if (review?.homeworkId) {
    const homework = load(K.homework);
    const hwIdx = homework.findIndex(h => h.id === review.homeworkId);
    if (hwIdx >= 0) {
      homework[hwIdx] = { ...homework[hwIdx], status: 'submitted' };
      delete homework[hwIdx].reviewedAt;
      save(K.homework, homework);
    }
  }
}

/* ─── DIAGNOSIS CYCLE STATE ─────────────────────────────────── */
export async function updateDiagnosisCycleStage(diagnosisId, stage) {
  if (dbReady('diagnoses')) {
    const all = await getDiagnoses();
    const d = all.find(x => x.id === diagnosisId);
    if (!d) return null;
    return saveDiagnosis({ ...d, cycleStage: stage });
  }
  const all = load(K.diagnoses);
  const idx = all.findIndex(d => d.id === diagnosisId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], cycleStage: stage, updatedAt: new Date().toISOString() };
  save(K.diagnoses, all);
  return all[idx];
}

export async function getDiagnosisTimeline(studentId) {
  const all = await getDiagnoses(studentId);
  return all
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getStudentCycleState(studentId) {
  const diagnoses = await getDiagnoses(studentId);
  const homework = await getHomework(studentId);
  const submissions = await getSubmissions(studentId);
  const reviews = await getReviews(studentId);

  const latestDiagnosis = diagnoses[0] || null;
  const daysSinceLastDiagnosis = latestDiagnosis
    ? Math.floor((Date.now() - new Date(latestDiagnosis.createdAt).getTime()) / 86400000)
    : null;

  const pendingHomework = homework.filter(h =>
    h.status === 'not-started' || h.status === 'in-progress'
  );
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const pendingReviews = pendingSubmissions.filter(s =>
    !reviews.some(r => r.submissionId === s.id)
  );

  let cycleStage = 'needs-diagnosis';
  if (latestDiagnosis) {
    const stage = latestDiagnosis.cycleStage;
    if (stage === 'reviewed') cycleStage = 'reviewed';
    else if (pendingReviews.length > 0) cycleStage = 'submitted';
    else if (stage === 'homework-assigned' || pendingHomework.length > 0) cycleStage = 'homework-assigned';
    else if (stage === 'feedback-sent') cycleStage = 'feedback-sent';
    else cycleStage = 'diagnosed';
  }

  return {
    cycleStage,
    latestDiagnosis,
    pendingHomework,
    pendingSubmissions: pendingReviews,
    daysSinceLastDiagnosis,
    totalDiagnoses: diagnoses.length,
    totalHomework: homework.length,
    totalSubmissions: submissions.length,
  };
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1 — NEW ENTITIES
   ═══════════════════════════════════════════════════════════════ */

/* ─── ERROR BANK PROFILE SEEDING ─────────────────────────────── */
export async function seedErrorBankFromProfile(studentId, profile) {
  if (!studentId || !profile?.error_categories) return [];
  const existingEntries = await getErrorBank(studentId);
  const existingKeys = new Set(existingEntries.map(e => `${e.error}|${e.correct}`));
  const added = [];

  for (const cat of profile.error_categories) {
    for (const pattern of cat.common_error_patterns || []) {
      const errorText = pattern.error || pattern.problem || '';
      const correctText = pattern.correction || pattern.solution || '';
      if (!errorText || !correctText) continue;
      const key = `${errorText}|${correctText}`;
      if (existingKeys.has(key)) continue;

      const record = {
        id: uid(),
        studentId,
        error: errorText,
        correct: correctText,
        type: cat.skill_area?.includes('speaking') ? 'grammar' : 'grammar',
        category: cat.category_id,
        categoryName: cat.category_name,
        explanation: pattern.explanation || pattern.solution || cat.definition || '',
        example_sentence: '',
        priority: cat.priority || 'medium',
        feedbackTemplate: cat.teacher_feedback_template || '',
        studentAction: cat.student_action || '',
        suggestedHomework: cat.suggested_homework || [],
        sourceDiagnosisId: null,
        sourceProfile: true,
        status: 'active',
        practiceCount: 0,
        lastPracticed: null,
        createdAt: new Date().toISOString(),
      };
      existingKeys.add(key);
      added.push(record);
    }
  }

  if (dbReady('errorBank')) {
    try {
      for (const rec of added) await dbUpsert('errorBank', rec);
      return added;
    } catch (e) {
      console.warn('[workflow] seedErrorBankFromProfile via Supabase failed, using localStorage:', e.message);
    }
  }
  const obj = loadObj(K.errorBankGlobal);
  obj[studentId] = [...(obj[studentId] || []), ...added];
  save(K.errorBankGlobal, obj);
  return added;
}

/* ─── STUDENT CRUD (teacher-managed, replaces hardcoded roster) ── */
export async function getStudents() {
  return listVia('studentsCrud', K.studentsCrud, null);
}
export async function getStudent(id) {
  return (await getStudents()).find(s => s.id === id) || null;
}
export async function getStudentByEmailPassword(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '').trim();
  if (!normalizedEmail || !normalizedPassword) return null;
  return load(K.studentsCrud).find(s =>
    String(s.email || '').trim().toLowerCase() === normalizedEmail &&
    String(s.password || '').trim() === normalizedPassword
  ) || null;
}
export async function saveStudent(data) {
  const all = load(K.studentsCrud);
  const now = new Date().toISOString();
  const existing = all.findIndex(s => s.id === data.id);
  const previous = existing >= 0 ? all[existing] : {};
  const record = {
    id: data.id || uid(),
    name: data.name || '',
    firstName: data.firstName || (data.name || '').split(' ')[0] || '',
    email: data.email || '',
    password: data.password ?? previous.password ?? '',
    currentLevel: data.currentLevel || data.band || 'B1',
    targetLevel: data.targetLevel || data.bandTarget || 'B2',
    examGoal: data.examGoal || data.goal || 'Pass MET B2',
    professionalContext: data.professionalContext || '',
    notes: data.notes || '',
    activeTargetProfileId: data.activeTargetProfileId || null,
    // Legacy fields preserved for student-dashboard compatibility
    band: data.currentLevel || data.band || 'B1',
    bandTarget: data.targetLevel || data.bandTarget || 'B2',
    goal: data.examGoal || data.goal || 'Pass MET B2',
    session: data.session || 1,
    totalSessions: data.totalSessions || 24,
    track: data.track || 'MET',
    timezone: data.timezone || 'America/Sao_Paulo',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
  if (dbReady('studentsCrud')) {
    try { const saved = await dbUpsert('studentsCrud', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] saveStudent via Supabase failed, using localStorage:', e.message); }
  }
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.studentsCrud, all);
  return record;
}
export async function deleteStudent(id) {
  if (dbReady('studentsCrud')) {
    try {
      // FKs have no cascade — clear student-scoped rows before removing the student.
      const scoped = ['reviews', 'submissions', 'homework', 'diagnoses', 'reports',
        'progressNotes', 'vocabularyBank', 'practiceSubmissions', 'practiceAssignments',
        'classEvidence', 'classEvents', 'targetProfiles'];
      for (const entity of scoped) {
        try {
          const rows = (await dbList(entity)) || [];
          for (const r of rows.filter(r => r.studentId === id)) await dbRemove(entity, r.id);
        } catch { /* ignore one entity's failure */ }
      }
      await dbRemove('studentsCrud', id);
      return;
    } catch (e) {
      console.warn('[workflow] deleteStudent via Supabase failed, using localStorage:', e.message);
    }
  }
  save(K.studentsCrud, load(K.studentsCrud).filter(s => s.id !== id));
  save(K.targetProfiles, load(K.targetProfiles).filter(p => p.studentId !== id));
  save(K.classEvents, load(K.classEvents).filter(e => e.studentId !== id));
  save(K.classEvidence, load(K.classEvidence).filter(e => e.studentId !== id));
  save(K.diagnoses, load(K.diagnoses).filter(d => d.studentId !== id));
  save(K.feedback, load(K.feedback).filter(f => f.studentId !== id));
  save(K.homework, load(K.homework).filter(h => h.studentId !== id));
  save(K.submissions, load(K.submissions).filter(s => s.studentId !== id));
  save(K.reviews, load(K.reviews).filter(r => r.studentId !== id));
  save(K.reports, load(K.reports).filter(r => r.studentId !== id));
  save(K.progressNotes, load(K.progressNotes).filter(n => n.studentId !== id));
  save(K.vocabularyBank, load(K.vocabularyBank).filter(v => v.studentId !== id));
  save(K.practiceAssignments, load(K.practiceAssignments).filter(p => p.studentId !== id));
  save(K.practiceSubmissions, load(K.practiceSubmissions).filter(s => s.studentId !== id));
  save(K.inbox, load(K.inbox).filter(m => m.toStudentId !== id && m.fromStudentId !== id));
  const errorBank = loadObj(K.errorBankGlobal);
  delete errorBank[id];
  save(K.errorBankGlobal, errorBank);
  const progress = loadObj(K.progress);
  delete progress[id];
  save(K.progress, progress);
  const drafts = loadObj(K.drafts);
  Object.keys(drafts).forEach(key => {
    if (key.startsWith(`${id}:`)) delete drafts[key];
  });
  save(K.drafts, drafts);
}
export async function seedStudentsIfEmpty(STUDENTS) {
  const existing = load(K.studentsCrud);
  if (existing.length > 0) {
    let changed = false;
    const seededById = new Map((STUDENTS || []).map(s => [s.id, s]));
    const patched = existing.map(student => {
      if (student.password) return student;
      const seed = seededById.get(student.id);
      if (!seed?.password) return student;
      changed = true;
      return { ...student, password: seed.password };
    });
    if (changed) save(K.studentsCrud, patched);
    return changed ? patched : existing;
  }
  const seeded = STUDENTS.map(s => ({
    id: s.id, name: s.name, firstName: s.firstName, email: s.email || '',
    password: s.password || '',
    currentLevel: s.band || s.currentBand || 'B1',
    targetLevel: s.bandTarget || s.targetBand || 'B2',
    examGoal: s.goal || 'Pass MET B2',
    professionalContext: '', notes: '', activeTargetProfileId: null,
    // Legacy
    band: s.band || 'B1', bandTarget: s.bandTarget || 'B2',
    goal: s.goal || 'Pass MET B2', session: s.session || 1,
    totalSessions: s.totalSessions || 24, track: s.track || 'MET',
    timezone: s.timezone || 'America/Sao_Paulo',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  save(K.studentsCrud, seeded);
  return seeded;
}

/* ─── TARGET PROFILES ────────────────────────────────────────── */
export const TARGET_PROFILE_PRESETS = {
  endorsement: { profileName: 'endorsement', label: 'Endorsement Minimum',   overallTarget: 55, speakingTarget: 55, writingTarget: null, readingTarget: null, listeningTarget: null },
  visascreen:  { profileName: 'visascreen',  label: 'VisaScreen / Work Visa', overallTarget: 58, speakingTarget: 59, writingTarget: null, readingTarget: null, listeningTarget: null },
};

export async function getTargetProfiles(studentId) {
  return listVia('targetProfiles', K.targetProfiles, studentId ? (p => p.studentId === studentId) : null);
}
export async function getActiveTargetProfile(studentId) {
  const profiles = await getTargetProfiles(studentId);
  return profiles.find(p => p.isActive) || profiles[0] || null;
}
export async function saveTargetProfile(data) {
  const record = {
    id: data.id || uid(),
    studentId: data.studentId || null,
    profileName: data.profileName || 'custom',
    label: data.label || data.profileName || 'Custom',
    overallTarget: data.overallTarget ?? null,
    speakingTarget: data.speakingTarget ?? null,
    writingTarget: data.writingTarget ?? null,
    readingTarget: data.readingTarget ?? null,
    listeningTarget: data.listeningTarget ?? null,
    isActive: data.isActive ?? false,
    createdAt: data.createdAt || new Date().toISOString(),
  };
  if (dbReady('targetProfiles')) {
    try { const saved = await dbUpsert('targetProfiles', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] saveTargetProfile via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.targetProfiles);
  const existing = all.findIndex(p => p.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.targetProfiles, all);
  return record;
}
export async function setActiveTargetProfile(studentId, profileId) {
  if (dbReady('targetProfiles')) {
    try {
      const profiles = await getTargetProfiles(studentId);
      for (const p of profiles) {
        const shouldBeActive = p.id === profileId;
        if (Boolean(p.isActive) !== shouldBeActive) await dbUpsert('targetProfiles', { ...p, isActive: shouldBeActive });
      }
      const student = await getStudent(studentId);
      if (student) await saveStudent({ ...student, activeTargetProfileId: profileId });
      return;
    } catch (e) {
      console.warn('[workflow] setActiveTargetProfile via Supabase failed, using localStorage:', e.message);
    }
  }
  const all = load(K.targetProfiles);
  all.forEach(p => { if (p.studentId === studentId) p.isActive = p.id === profileId; });
  save(K.targetProfiles, all);
  // Also update student record
  const students = load(K.studentsCrud);
  const si = students.findIndex(s => s.id === studentId);
  if (si >= 0) { students[si].activeTargetProfileId = profileId; save(K.studentsCrud, students); }
}
export async function deleteTargetProfile(id) {
  return removeVia('targetProfiles', K.targetProfiles, id);
}

/* ─── CLASS EVENTS ───────────────────────────────────────────── */
export async function getClassEvents(studentId) {
  return listVia('classEvents', K.classEvents, studentId ? (e => e.studentId === studentId) : null);
}
export async function getClassEvent(id) {
  return (await getClassEvents()).find(e => e.id === id) || null;
}
export async function saveClassEvent(data) {
  const record = {
    id: data.id || uid(),
    studentId: data.studentId || null,
    date: data.date || new Date().toISOString().slice(0, 10),
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    title: data.title || 'English Class',
    classFocus: data.classFocus || '',
    metSkillFocus: data.metSkillFocus || '',
    status: data.status || 'scheduled',
    diagnosticStatus: data.diagnosticStatus || 'not-started',
    homeworkStatus: data.homeworkStatus || 'not-generated',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (dbReady('classEvents')) {
    try { const saved = await dbUpsert('classEvents', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] saveClassEvent via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.classEvents);
  const existing = all.findIndex(e => e.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.classEvents, all);
  return record;
}
export async function updateClassEventStatus(id, patch) {
  if (dbReady('classEvents')) {
    try {
      const ev = (await getClassEvents()).find(e => e.id === id);
      if (!ev) return null;
      return await dbUpsert('classEvents', { ...ev, ...patch });
    } catch (e) {
      console.warn('[workflow] updateClassEventStatus via Supabase failed, using localStorage:', e.message);
    }
  }
  const all = load(K.classEvents);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }; save(K.classEvents, all); return all[idx]; }
  return null;
}
export async function deleteClassEvent(id) {
  return removeVia('classEvents', K.classEvents, id);
}

/* ─── CLASS EVIDENCE ─────────────────────────────────────────── */
export async function getClassEvidence(classEventId) {
  const all = await listVia('classEvidence', K.classEvidence, null);
  return classEventId ? all.find(e => e.classEventId === classEventId) || null : all;
}
export async function saveClassEvidence(data) {
  // dedupe by classEventId so re-saving the same class updates one row
  const priorList = await listVia('classEvidence', K.classEvidence, null);
  const prior = priorList.find(e => e.classEventId === data.classEventId || e.id === data.id);
  const record = {
    id: data.id || prior?.id || uid(),
    classEventId: data.classEventId || null,
    studentId: data.studentId || null,
    // Skill flags
    evaluatedSpeaking: data.evaluatedSpeaking ?? false,
    evaluatedWriting: data.evaluatedWriting ?? false,
    evaluatedReading: data.evaluatedReading ?? false,
    evaluatedListening: data.evaluatedListening ?? false,
    evaluatedGrammar: data.evaluatedGrammar ?? false,
    evaluatedVocabulary: data.evaluatedVocabulary ?? false,
    evaluatedTestStrategy: data.evaluatedTestStrategy ?? false,
    // Evidence counts
    testStrategyEvidenceCount: data.testStrategyEvidenceCount ?? 0,
    speakingEvidenceCount: data.speakingEvidenceCount ?? 0,
    writingEvidenceCount: data.writingEvidenceCount ?? 0,
    readingEvidenceCount: data.readingEvidenceCount ?? 0,
    listeningEvidenceCount: data.listeningEvidenceCount ?? 0,
    grammarEvidenceCount: data.grammarEvidenceCount ?? 0,
    vocabularyEvidenceCount: data.vocabularyEvidenceCount ?? 0,
    // Content
    teacherNotes: data.teacherNotes || '',
    studentPerformance: data.studentPerformance || '',
    studentTranscript: data.studentTranscript || '',
    studentAnswer: data.studentAnswer || '',
    homeworkReviewed: data.homeworkReviewed || '',
    studentMood: data.studentMood || '',
    additionalNotes: data.additionalNotes || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (dbReady('classEvidence')) {
    try { const saved = await dbUpsert('classEvidence', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] saveClassEvidence via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.classEvidence);
  const existing = all.findIndex(e => e.classEventId === record.classEventId || e.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.push(record);
  save(K.classEvidence, all);
  return record;
}
export async function updateClassEvidence(id, patch) {
  if (dbReady('classEvidence')) {
    try {
      const ev = (await listVia('classEvidence', K.classEvidence, null)).find(e => e.id === id);
      if (!ev) return null;
      return await dbUpsert('classEvidence', { ...ev, ...patch });
    } catch (e) {
      console.warn('[workflow] updateClassEvidence via Supabase failed, using localStorage:', e.message);
    }
  }
  const all = load(K.classEvidence);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }; save(K.classEvidence, all); return all[idx]; }
  return null;
}

/* ─── VOCABULARY BANK ────────────────────────────────────────── */
export async function getVocabularyBank(studentId) {
  return listVia('vocabularyBank', K.vocabularyBank, studentId ? (v => v.studentId === studentId) : null);
}
export async function saveVocabularyEntry(data) {
  const record = {
    id: data.id || uid(),
    studentId: data.studentId || null,
    wordOrPhrase: data.wordOrPhrase || data.word || '',
    category: data.category || 'general',
    meaning: data.meaning || '',
    exampleSentence: data.exampleSentence || '',
    status: data.status || 'active',
    evidenceSource: data.evidenceSource || {},
    createdAt: data.createdAt || new Date().toISOString(),
  };
  if (dbReady('vocabularyBank')) {
    try { const saved = await dbUpsert('vocabularyBank', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] saveVocabularyEntry via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.vocabularyBank);
  const existing = all.findIndex(v => v.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.vocabularyBank, all);
  return record;
}
export async function updateVocabularyEntry(id, patch) {
  if (dbReady('vocabularyBank')) {
    try {
      const v = (await listVia('vocabularyBank', K.vocabularyBank, null)).find(x => x.id === id);
      if (!v) return null;
      return await dbUpsert('vocabularyBank', { ...v, ...patch });
    } catch (e) {
      console.warn('[workflow] updateVocabularyEntry via Supabase failed, using localStorage:', e.message);
    }
  }
  const all = load(K.vocabularyBank);
  const idx = all.findIndex(v => v.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; save(K.vocabularyBank, all); return all[idx]; }
  return null;
}
export async function deleteVocabularyEntry(id) {
  return removeVia('vocabularyBank', K.vocabularyBank, id);
}

/* ─── PROGRESS NOTES ─────────────────────────────────────────── */
export async function getProgressNotes(studentId) {
  return listVia('progressNotes', K.progressNotes, studentId ? (n => n.studentId === studentId) : null);
}
export async function saveProgressNote(data) {
  const record = {
    id: data.id || uid(),
    studentId: data.studentId || null,
    sourceType: data.sourceType || 'teacher',
    sourceId: data.sourceId || null,
    note: data.note || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
  if (dbReady('progressNotes')) {
    try { const saved = await dbUpsert('progressNotes', record); if (saved) return saved; }
    catch (e) { console.warn('[workflow] saveProgressNote via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.progressNotes);
  all.unshift(record);
  save(K.progressNotes, all);
  return record;
}
export async function deleteProgressNote(id) {
  return removeVia('progressNotes', K.progressNotes, id);
}

/* ─── ALL SUBMISSIONS (teacher view) ─────────────────────────── */
export async function getAllSubmissions() {
  return listVia('submissions', K.submissions, null);
}
export async function deleteSubmission(id) {
  if (dbReady('submissions')) {
    try {
      const submission = (await dbList('submissions') || []).find(s => s.id === id);
      const revs = (await dbList('reviews') || []).filter(r => r.submissionId === id);
      for (const r of revs) await dbRemove('reviews', r.id);
      await dbRemove('submissions', id);
      if (submission?.homeworkId) {
        try {
          const hw = (await dbList('homework') || []).find(h => h.id === submission.homeworkId);
          if (hw) await dbUpsert('homework', { ...hw, status: 'not-started', reviewedAt: undefined });
        } catch { /* ignore */ }
        removeHomeworkDrafts(submission.homeworkId);
      }
      return;
    } catch (e) {
      console.warn('[workflow] deleteSubmission via Supabase failed, using localStorage:', e.message);
    }
  }
  const submission = load(K.submissions).find(s => s.id === id);
  save(K.submissions, load(K.submissions).filter(s => s.id !== id));
  save(K.reviews, load(K.reviews).filter(r => r.submissionId !== id));
  if (submission?.homeworkId) {
    const homework = load(K.homework);
    const hwIdx = homework.findIndex(h => h.id === submission.homeworkId);
    if (hwIdx >= 0) {
      homework[hwIdx] = { ...homework[hwIdx], status: 'not-started' };
      delete homework[hwIdx].reviewedAt;
      save(K.homework, homework);
    }
    removeHomeworkDrafts(submission.homeworkId);
  }
}

/* ─── ONE-TIME LOCAL → CLOUD IMPORT ──────────────────────────── */
/**
 * Push existing localStorage records into Supabase. Idempotent: each record's
 * `${entity}:${id}` is recorded in `vv:syncedIds` and skipped on re-run.
 * Order matters — students before everything (FK + studentId resolution),
 * homework before submissions/reviews. Returns a per-entity count of new rows.
 */
export async function syncLocalToCloud() {
  if (!getDbContext()) throw new Error('Sign in with Supabase first to sync to the cloud.');
  const order = [
    'studentsCrud', 'diagnoses', 'targetProfiles', 'classEvents', 'classEvidence',
    'vocabularyBank', 'progressNotes', 'reports', 'practiceResources',
    'practiceAssignments', 'practiceSubmissions', 'homework', 'submissions', 'reviews',
  ];
  const synced = new Set(loadObj('vv:syncedIds').ids || []);
  const counts = {};
  for (const entity of order) {
    if (!dbHasEntity(entity)) continue;
    const list = load(K[entity]);
    let n = 0;
    for (const rec of list) {
      if (!rec || !rec.id) continue;
      const tag = `${entity}:${rec.id}`;
      if (synced.has(tag)) continue;
      try { await dbUpsert(entity, rec); synced.add(tag); n++; }
      catch (e) { console.warn(`[sync] ${tag} failed:`, e.message); }
    }
    counts[entity] = n;
  }
  // Error bank is object-keyed (errorBankGlobal[studentId] = [entries]) — push after students.
  if (dbHasEntity('errorBank')) {
    const obj = loadObj(K.errorBankGlobal);
    let n = 0;
    for (const [sid, entries] of Object.entries(obj)) {
      for (const entry of (entries || [])) {
        if (!entry?.id) continue;
        const tag = `errorBank:${entry.id}`;
        if (synced.has(tag)) continue;
        try { await dbUpsert('errorBank', { ...entry, studentId: entry.studentId || sid }); synced.add(tag); n++; }
        catch (e) { console.warn(`[sync] ${tag} failed:`, e.message); }
      }
    }
    counts.errorBank = n;
  }
  save('vv:syncedIds', { ids: [...synced] });
  return counts;
}
