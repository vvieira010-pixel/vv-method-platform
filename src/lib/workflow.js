/**
 * workflow.js — V.V. Method data layer
 * localStorage-backed persistence with Firebase-ready interface.
 */

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
  const all = loadWithIds(K.diagnoses);
  return studentId ? all.filter(d => d.studentId === studentId) : all;
}
export async function getLatestDiagnosis(studentId) {
  const all = await getDiagnoses(studentId);
  return all[0] || null;
}
export async function saveDiagnosis(data) {
  return upsert(K.diagnoses, data, {
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
  const all = load(K.homework);
  return studentId ? all.filter(h => h.studentId === studentId) : all;
}
export async function saveHomework(data) {
  return upsert(K.homework, data, {
    diagnosisId: null,
    assignedAt: new Date().toISOString(),
    status: 'not-started',
    activities: data?.activities || data?.tasks || [],
  });
}
export async function deleteHomework(id) {
  save(K.homework, load(K.homework).filter(h => h.id !== id));
}

/* ─── PRACTICE ASSIGNMENTS ───────────────────────────────────── */
export async function getPracticeAssignments(studentId) {
  const all = load(K.practiceAssignments);
  return studentId ? all.filter(p => p.studentId === studentId) : all;
}
export async function savePracticeAssignment(data) {
  return upsert(K.practiceAssignments, data, {
    studentId: null,
    diagnosisId: null,
    resourceIds: data?.resourceIds || [],
    skillFocus: data?.skillFocus || data?.type || '',
    status: 'assigned',
  });
}
export async function deletePracticeAssignment(id) {
  save(K.practiceAssignments, load(K.practiceAssignments).filter(p => p.id !== id));
}

/* ─── SUBMISSIONS ────────────────────────────────────────────── */
export async function getSubmissions(studentId) {
  const all = load(K.submissions);
  return studentId ? all.filter(s => s.studentId === studentId) : all;
}
export async function submitHomework(homeworkId, studentId, content, responses) {
  const all = load(K.submissions);
  const sub = {
    id: uid(), homeworkId, studentId, content,
    responses: responses || null,
    submittedAt: new Date().toISOString(), status: 'submitted',
  };
  all.unshift(sub);
  save(K.submissions, all);
  // Update homework status
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
  const all = load(K.reports);
  return studentId ? all.filter(r => r.studentId === studentId) : all;
}
export async function saveReport(data) {
  return upsert(K.reports, data, {
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
  const all = load(K.practiceResources);
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
  const all = load(K.practiceResources);
  const existing = all.findIndex(r => r.id === data.id);
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.practiceResources, all);
  return record;
}
export async function deletePracticeResource(id) {
  save(K.practiceResources, load(K.practiceResources).filter(r => r.id !== id));
}

/* ─── PRACTICE SUBMISSIONS (student answers + AI feedback) ───── */
export async function getPracticeSubmissions(query = {}) {
  const all = load(K.practiceSubmissions);
  if (typeof query === 'string') return all.filter(s => s.assignmentId === query || s.studentId === query);
  if (query.assignmentId) return all.filter(s => s.assignmentId === query.assignmentId);
  if (query.studentId) return all.filter(s => s.studentId === query.studentId);
  return all;
}
export async function savePracticeSubmission(data) {
  const all = load(K.practiceSubmissions);
  // attempt number is auto-incremented from existing submissions for the same assignment
  const previousAttempts = all.filter(s => s.assignmentId === data.assignmentId).length;
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
  all.unshift(record);
  save(K.practiceSubmissions, all);
  return record;
}

/* ─── ERROR BANK (per-student long-term store) ───────────────── */
export async function getErrorBank(studentId) {
  const obj = loadObj(K.errorBankGlobal);
  return obj[studentId] || [];
}
export async function promoteErrorToLongTerm(diagnosisId, errorIndex, studentId) {
  // Pull the diagnosis, lift one error_bank item, dedupe by `error+correct` so a
  // teacher can click promote twice without creating duplicates.
  const diags = load(K.diagnoses);
  const diag = diags.find(d => d.id === diagnosisId);
  if (!diag) return null;
  const sourceItem = diag.content?.error_bank?.[errorIndex];
  if (!sourceItem) return null;
  const sid = studentId || diag.studentId;
  if (!sid) return null;
  const obj = loadObj(K.errorBankGlobal);
  const list = obj[sid] || [];
  const dupe = list.find(it => it.error === sourceItem.error && it.correct === sourceItem.correct);
  if (dupe) return dupe;
  const record = {
    id: uid(),
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
  obj[sid] = [record, ...list];
  save(K.errorBankGlobal, obj);
  return record;
}
export async function markErrorPracticed(studentId, errorId) {
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
  const all = load(K.reviews);
  return studentId ? all.filter(r => r.studentId === studentId) : all;
}
export async function saveReview(data) {
  const all = load(K.reviews);
  const existing = all.findIndex(r => r.id === data.id);
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.reviews, all);
  return record;
}
export async function deleteReview(id) {
  save(K.reviews, load(K.reviews).filter(r => r.id !== id));
}

/* ─── DIAGNOSIS CYCLE STATE ─────────────────────────────────── */
export async function updateDiagnosisCycleStage(diagnosisId, stage) {
  const all = load(K.diagnoses);
  const idx = all.findIndex(d => d.id === diagnosisId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], cycleStage: stage, updatedAt: new Date().toISOString() };
  save(K.diagnoses, all);
  return all[idx];
}

export async function getDiagnosisTimeline(studentId) {
  const all = load(K.diagnoses);
  return all
    .filter(d => d.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getStudentCycleState(studentId) {
  const diagnoses = load(K.diagnoses).filter(d => d.studentId === studentId);
  const homework = load(K.homework).filter(h => h.studentId === studentId);
  const submissions = load(K.submissions).filter(s => s.studentId === studentId);
  const reviews = load(K.reviews).filter(r => r.studentId === studentId);

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
  const obj = loadObj(K.errorBankGlobal);
  const existing = obj[studentId] || [];
  const existingKeys = new Set(existing.map(e => `${e.error}|${e.correct}`));
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
        error: errorText,
        correct: correctText,
        type: cat.skill_area?.includes('speaking') ? 'speaking'
            : cat.skill_area?.includes('writing') ? 'writing'
            : cat.skill_area?.includes('listening') ? 'listening'
            : cat.skill_area?.includes('reading') ? 'reading'
            : 'grammar',
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
      existing.push(record);
      existingKeys.add(key);
      added.push(record);
    }
  }

  obj[studentId] = existing;
  save(K.errorBankGlobal, obj);
  return added;
}

/* ─── STUDENT CRUD (teacher-managed, replaces hardcoded roster) ── */
export async function getStudents() {
  return load(K.studentsCrud);
}
export async function getStudent(id) {
  return load(K.studentsCrud).find(s => s.id === id) || null;
}
export async function saveStudent(data) {
  const all = load(K.studentsCrud);
  const now = new Date().toISOString();
  const existing = all.findIndex(s => s.id === data.id);
  const record = {
    id: data.id || uid(),
    name: data.name || '',
    firstName: data.firstName || (data.name || '').split(' ')[0] || '',
    email: data.email || '',
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.studentsCrud, all);
  return record;
}
export async function deleteStudent(id) {
  save(K.studentsCrud, load(K.studentsCrud).filter(s => s.id !== id));
}
export async function seedStudentsIfEmpty(STUDENTS) {
  const existing = load(K.studentsCrud);
  if (existing.length > 0) return existing;
  const seeded = STUDENTS.map(s => ({
    id: s.id, name: s.name, firstName: s.firstName, email: s.email || '',
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

export async function seedDemoDataIfEmpty() {
  const diagnoses = load(K.diagnoses);
  const events = load(K.classEvents);
  if (diagnoses.some(d => d.id?.startsWith('demo-'))) return;

  const students = load(K.studentsCrud);
  if (!students.length) return;
  const s1 = students[0].id;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDate = tomorrow.toISOString().slice(0, 10);

  events.push({
    id: 'demo-class-1', studentId: s1, date: nextDate, startTime: '14:00', endTime: '15:00',
    title: 'English Class', classFocus: 'Speaking & Vocabulary', metSkillFocus: 'speaking',
    status: 'scheduled', diagnosticStatus: 'not-started', homeworkStatus: 'not-generated',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  save(K.classEvents, events);

  diagnoses.unshift({
    id: 'demo-dx-1', studentId: s1, status: 'approved',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    sections: {
      studentFeedback: { approved: true, content: {
        whatYouDidWell: "You showed strong improvement in using past tenses correctly during our conversation practice. Your confidence when speaking has noticeably increased, and you're making fewer hesitation pauses. Your vocabulary range for describing daily routines is solid at B1+ level.",
        whatToImprove: "Focus on article usage ('a' vs 'the') — you consistently drop articles before nouns. Also work on linking words (however, although, furthermore) to connect your ideas more naturally.",
        finalNote: "Great progress this week! Your speaking fluency is really developing. For next class, review the article rules handout and try writing 3 sentences using 'although' and 'however'. Keep up the excellent work!"
      }},
      priorityDiagnosis: { approved: true, content: [
        { rank: 1, area: 'Articles & Determiners', whatToImprove: 'Consistent omission of articles before nouns', urgency: 'high' },
        { rank: 2, area: 'Linking & Cohesion', whatToImprove: 'Limited use of discourse markers', urgency: 'medium' },
      ]},
    },
    content: { section_snapshot: [
      { section: 'Speaking', score_0_80: 52, next_step: 'Improve fluency with linking phrases' },
      { section: 'Writing', score_0_80: 44, next_step: 'Article usage and sentence variety' },
      { section: 'Reading', score_0_80: 56, next_step: 'Inference and detail questions' },
      { section: 'Listening', score_0_80: 48, next_step: 'Note-taking during longer passages' },
    ]},
  });
  diagnoses.push({
    id: 'demo-dx-2', studentId: s1, status: 'approved',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    sections: {
      studentFeedback: { approved: true, content: {
        whatYouDidWell: "Excellent effort on the reading comprehension exercise! You correctly identified the main idea and supporting details. Your pronunciation of difficult words like 'environment' and 'responsibility' has improved significantly.",
        whatToImprove: "Work on your writing speed — you tend to spend too long thinking before writing. Practice timed writing exercises (10 minutes, 100 words). Also, pay attention to subject-verb agreement with third person singular.",
        finalNote: "You're making steady progress. I can see you're practicing between classes. Next week we'll focus on speaking practice for the MET oral exam format. Try to listen to one English podcast this week!"
      }},
      priorityDiagnosis: { approved: true, content: [] },
    },
    content: {},
  });
  save(K.diagnoses, diagnoses);
}

/* ─── TARGET PROFILES ────────────────────────────────────────── */
export const TARGET_PROFILE_PRESETS = {
  endorsement: { profileName: 'endorsement', label: 'Endorsement Minimum',   overallTarget: 55, speakingTarget: 55, writingTarget: null, readingTarget: null, listeningTarget: null },
  visascreen:  { profileName: 'visascreen',  label: 'VisaScreen / Work Visa', overallTarget: 58, speakingTarget: 59, writingTarget: null, readingTarget: null, listeningTarget: null },
};

export async function getTargetProfiles(studentId) {
  const all = load(K.targetProfiles);
  return studentId ? all.filter(p => p.studentId === studentId) : all;
}
export async function getActiveTargetProfile(studentId) {
  const profiles = await getTargetProfiles(studentId);
  return profiles.find(p => p.isActive) || profiles[0] || null;
}
export async function saveTargetProfile(data) {
  const all = load(K.targetProfiles);
  const existing = all.findIndex(p => p.id === data.id);
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.targetProfiles, all);
  return record;
}
export async function setActiveTargetProfile(studentId, profileId) {
  const all = load(K.targetProfiles);
  all.forEach(p => { if (p.studentId === studentId) p.isActive = p.id === profileId; });
  save(K.targetProfiles, all);
  // Also update student record
  const students = load(K.studentsCrud);
  const si = students.findIndex(s => s.id === studentId);
  if (si >= 0) { students[si].activeTargetProfileId = profileId; save(K.studentsCrud, students); }
}
export async function deleteTargetProfile(id) {
  save(K.targetProfiles, load(K.targetProfiles).filter(p => p.id !== id));
}

/* ─── CLASS EVENTS ───────────────────────────────────────────── */
export async function getClassEvents(studentId) {
  const all = load(K.classEvents);
  return studentId ? all.filter(e => e.studentId === studentId) : all;
}
export async function getClassEvent(id) {
  return load(K.classEvents).find(e => e.id === id) || null;
}
export async function saveClassEvent(data) {
  const all = load(K.classEvents);
  const existing = all.findIndex(e => e.id === data.id);
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.classEvents, all);
  return record;
}
export async function updateClassEventStatus(id, patch) {
  const all = load(K.classEvents);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }; save(K.classEvents, all); return all[idx]; }
  return null;
}
export async function deleteClassEvent(id) {
  save(K.classEvents, load(K.classEvents).filter(e => e.id !== id));
}

/* ─── CLASS EVIDENCE ─────────────────────────────────────────── */
export async function getClassEvidence(classEventId) {
  const all = load(K.classEvidence);
  return classEventId ? all.find(e => e.classEventId === classEventId) || null : all;
}
export async function saveClassEvidence(data) {
  const all = load(K.classEvidence);
  const existing = all.findIndex(e => e.classEventId === data.classEventId || e.id === data.id);
  const record = {
    id: data.id || uid(),
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.push(record);
  save(K.classEvidence, all);
  return record;
}
export async function updateClassEvidence(id, patch) {
  const all = load(K.classEvidence);
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }; save(K.classEvidence, all); return all[idx]; }
  return null;
}

/* ─── VOCABULARY BANK ────────────────────────────────────────── */
export async function getVocabularyBank(studentId) {
  const all = load(K.vocabularyBank);
  return studentId ? all.filter(v => v.studentId === studentId) : all;
}
export async function saveVocabularyEntry(data) {
  const all = load(K.vocabularyBank);
  const existing = all.findIndex(v => v.id === data.id);
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
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.vocabularyBank, all);
  return record;
}
export async function updateVocabularyEntry(id, patch) {
  const all = load(K.vocabularyBank);
  const idx = all.findIndex(v => v.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...patch }; save(K.vocabularyBank, all); return all[idx]; }
  return null;
}
export async function deleteVocabularyEntry(id) {
  save(K.vocabularyBank, load(K.vocabularyBank).filter(v => v.id !== id));
}

/* ─── PROGRESS NOTES ─────────────────────────────────────────── */
export async function getProgressNotes(studentId) {
  const all = load(K.progressNotes);
  return studentId ? all.filter(n => n.studentId === studentId) : all;
}
export async function saveProgressNote(data) {
  const all = load(K.progressNotes);
  const record = {
    id: data.id || uid(),
    studentId: data.studentId || null,
    sourceType: data.sourceType || 'teacher',
    sourceId: data.sourceId || null,
    note: data.note || '',
    createdAt: data.createdAt || new Date().toISOString(),
  };
  all.unshift(record);
  save(K.progressNotes, all);
  return record;
}
export async function deleteProgressNote(id) {
  save(K.progressNotes, load(K.progressNotes).filter(n => n.id !== id));
}

/* ─── ALL SUBMISSIONS (teacher view) ─────────────────────────── */
export async function getAllSubmissions() {
  return load(K.submissions);
}
