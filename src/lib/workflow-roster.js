import { K, load, loadObj, save, uid, loadWithIds, dbReady, listVia, saveVia, removeVia, upsert } from './workflow-core.js';
import { dbList, dbUpsert, dbRemove, getDbContext } from './supabase-db.js';
import { initSchedule, markSRMastered } from './spaced-repetition.js';
import { getDiagnoses, getHomework, getSubmissions, getReviews, getFeedback } from './workflow-academic.js';

/* ─── INBOX ──────────────────────────────────────────────────── */
export async function getInbox({ role, studentId } = {}) {
  const all = load(K.inbox);
  if (role === 'student' && studentId) return all.filter(m => m.toStudentId === studentId || m.fromStudentId === studentId);
  return all;
}

export function requestInboxNotificationPermission() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
  Notification.requestPermission();
}

export async function sendMessage(data) {
  const all = load(K.inbox);
  const msg = { id: uid(), createdAt: new Date().toISOString(), read: false, ...data };
  all.unshift(msg);
  save(K.inbox, all);
  window.dispatchEvent(new CustomEvent('vv:messages-changed'));
  if (data.fromRole === 'student') {
    const unread = all.filter(m => m.fromRole === 'student' && !m.read).length;
    localStorage.setItem('inboxUnread', String(unread));
    window.dispatchEvent(new CustomEvent('vv:inbox-unread-changed'));
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const sender = data.fromName || 'A student';
      new Notification(`Message from ${sender}`, {
        body: String(data.body || '').slice(0, 100),
        icon: '/favicon.svg',
        tag: 'inbox',
      });
    }
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

/* ─── STUDENT GOALS ─────────────────────────────────────────── */
export async function getStudentGoal(studentId) {
  const progress = await getProgress(studentId);
  return progress?.goal || null;
}
export async function saveStudentGoal(studentId, goal) {
  return saveProgress(studentId, { goal });
}

/* ─── REPORTS ────────────────────────────────────────────────── */
export async function getReports(studentId) {
  return listVia('reports', K.reports, studentId ? (r => r.studentId === studentId) : null);
}
export async function saveReport(data) {
  return saveVia('reports', K.reports, data, { studentId: null, diagnosisIds: data?.diagnosisIds || [], feedbackIds: data?.feedbackIds || [], homeworkIds: data?.homeworkIds || [], content: data?.content || data?.report || null });
}

/* ─── PRACTICE ASSIGNMENTS ───────────────────────────────────── */
export async function getPracticeAssignments(studentId) {
  return listVia('practiceAssignments', K.practiceAssignments, studentId ? (p => p.studentId === studentId) : null);
}
export async function savePracticeAssignment(data) {
  return saveVia('practiceAssignments', K.practiceAssignments, data, { studentId: null, diagnosisId: null, resourceIds: data?.resourceIds || [], skillFocus: data?.skillFocus || data?.type || '', status: 'assigned' });
}
export async function deletePracticeAssignment(id) {
  return removeVia('practiceAssignments', K.practiceAssignments, id);
}

/* ─── PRACTICE RESOURCES ─────────────────────────────────────── */
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
    if (filters.search) { const q = String(filters.search).toLowerCase(); const hay = `${r.title} ${(r.tags || []).join(' ')} ${r.instructions || ''}`.toLowerCase(); if (!hay.includes(q)) return false; }
    return true;
  });
}
export async function savePracticeResource(data) {
  const record = { id: data?.id || uid(), title: data?.title || 'Untitled resource', skill: data?.skill || 'mixed', level: data?.level || 'B1-B2', met_task_type: data?.met_task_type || '', topic: data?.topic || '', grammar_focus: data?.grammar_focus || '', vocabulary_focus: data?.vocabulary_focus || '', instructions: data?.instructions || '', content: data?.content || '', questions: Array.isArray(data?.questions) ? data.questions : [], answer_key: data?.answer_key || '', teacher_notes: data?.teacher_notes || '', student_self_check: Array.isArray(data?.student_self_check) ? data.student_self_check : [], estimated_time: data?.estimated_time || '', tags: Array.isArray(data?.tags) ? data.tags : [], created_by: data?.created_by || 'teacher', source: data?.source || 'manual', createdAt: data?.createdAt || new Date().toISOString(), ...data };
  if (dbReady('practiceResources')) { try { const saved = await dbUpsert('practiceResources', record); if (saved) return saved; } catch (e) { console.warn('[workflow] savePracticeResource via Supabase failed, using localStorage:', e.message); } }
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

/* ─── PRACTICE SUBMISSIONS ───────────────────────────────────── */
export async function getPracticeSubmissions(query = {}) {
  const all = await listVia('practiceSubmissions', K.practiceSubmissions, null);
  if (typeof query === 'string') return all.filter(s => s.assignmentId === query || s.studentId === query);
  if (query.assignmentId) return all.filter(s => s.assignmentId === query.assignmentId);
  if (query.studentId) return all.filter(s => s.studentId === query.studentId);
  return all;
}
export async function savePracticeSubmission(data) {
  const existingForAssignment = await listVia('practiceSubmissions', K.practiceSubmissions, s => s.assignmentId === data.assignmentId);
  const record = { id: data?.id || uid(), assignmentId: data?.assignmentId || null, studentId: data?.studentId || null, attempt: data?.attempt || existingForAssignment.length + 1, answer: data?.answer || '', ai_feedback: data?.ai_feedback || null, teacher_feedback: data?.teacher_feedback || null, score: data?.score ?? null, xpAwarded: data?.xpAwarded || 0, errors_observed: Array.isArray(data?.errors_observed) ? data.errors_observed : [], strengths_observed: Array.isArray(data?.strengths_observed) ? data.strengths_observed : [], status: data?.status || 'submitted', submittedAt: data?.submittedAt || new Date().toISOString(), ...data };
  if (dbReady('practiceSubmissions')) { try { const saved = await dbUpsert('practiceSubmissions', record); if (saved) return saved; } catch (e) { console.warn('[workflow] savePracticeSubmission via Supabase failed, using localStorage:', e.message); } }
  const all = load(K.practiceSubmissions);
  all.unshift(record);
  save(K.practiceSubmissions, all);
  return record;
}

/* ─── ERROR BANK ─────────────────────────────────────────────── */
export async function getErrorBank(studentId) {
  if (dbReady('errorBank')) { try { return (await dbList('errorBank') || []).filter(e => e.studentId === studentId); } catch (e) { console.warn('[workflow] getErrorBank via Supabase failed, using localStorage:', e.message); } }
  const obj = loadObj(K.errorBankGlobal);
  return obj[studentId] || [];
}
export async function promoteErrorToLongTerm(diagnosisId, errorIndex, studentId) {
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
  const record = { id: uid(), studentId: sid, error: sourceItem.error || '', correct: sourceItem.correct || '', type: sourceItem.type || 'grammar', explanation: sourceItem.explanation || '', example_sentence: sourceItem.example_sentence || '', sourceDiagnosisId: diagnosisId, status: 'active', practiceCount: 0, lastPracticed: null, submissionAppearances: 0, createdAt: new Date().toISOString() };
  if (dbReady('errorBank')) { try { const saved = await dbUpsert('errorBank', record); if (saved) return saved; } catch (e) { console.warn('[workflow] promoteErrorToLongTerm via Supabase failed, using localStorage:', e.message); } }
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
      const wasFirst = (entry.practiceCount || 0) === 0;
      const practiceCount = (entry.practiceCount || 0) + 1;
      const saved = await dbUpsert('errorBank', { ...entry, practiceCount, status: practiceCount >= 3 ? 'solved' : 'practicing', lastPracticed: new Date().toISOString() });
      if (wasFirst) initSchedule(studentId, { ...entry, id: errorId });
      if (practiceCount >= 3) markSRMastered(studentId, errorId);
      return saved;
    } catch (e) { console.warn('[workflow] markErrorPracticed via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  const list = obj[studentId] || [];
  const idx = list.findIndex(e => e.id === errorId);
  if (idx < 0) return null;
  const wasFirst = (list[idx].practiceCount || 0) === 0;
  const newCount = (list[idx].practiceCount || 0) + 1;
  list[idx] = { ...list[idx], practiceCount: newCount, status: newCount >= 3 ? 'solved' : 'practicing', lastPracticed: new Date().toISOString() };
  obj[studentId] = list;
  save(K.errorBankGlobal, obj);
  if (wasFirst) initSchedule(studentId, { ...list[idx], id: errorId });
  if (newCount >= 3) markSRMastered(studentId, errorId);
  return list[idx];
}
export async function markErrorSolved(studentId, errorId) {
  if (dbReady('errorBank')) {
    try {
      const entry = (await dbList('errorBank') || []).find(e => e.id === errorId);
      if (!entry) return null;
      const saved = await dbUpsert('errorBank', { ...entry, status: 'solved', lastPracticed: new Date().toISOString() });
      markSRMastered(studentId, errorId);
      return saved;
    } catch (e) { console.warn('[workflow] markErrorSolved via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  const list = obj[studentId] || [];
  const idx = list.findIndex(e => e.id === errorId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], status: 'solved', lastPracticed: new Date().toISOString() };
  obj[studentId] = list;
  save(K.errorBankGlobal, obj);
  markSRMastered(studentId, errorId);
  return list[idx];
}

/** Increment submissionAppearances counter — called each time this error is marked
 *  active in a submission review, so the teacher can spot persistent patterns. */
export async function incrementErrorAppearance(studentId, errorId) {
  if (dbReady('errorBank')) {
    try {
      const entry = (await dbList('errorBank') || []).find(e => e.id === errorId);
      if (!entry) return null;
      return await dbUpsert('errorBank', { ...entry, submissionAppearances: (entry.submissionAppearances || 0) + 1 });
    } catch (e) { console.warn('[workflow] incrementErrorAppearance via Supabase failed, using localStorage:', e.message); }
  }
  const obj = loadObj(K.errorBankGlobal);
  const list = obj[studentId] || [];
  const idx = list.findIndex(e => e.id === errorId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], submissionAppearances: (list[idx].submissionAppearances || 0) + 1 };
  obj[studentId] = list;
  save(K.errorBankGlobal, obj);
  return list[idx];
}

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
      const record = { id: uid(), studentId, error: errorText, correct: correctText, type: 'grammar', category: cat.category_id, categoryName: cat.category_name, explanation: pattern.explanation || pattern.solution || cat.definition || '', example_sentence: '', priority: cat.priority || 'medium', feedbackTemplate: cat.teacher_feedback_template || '', studentAction: cat.student_action || '', suggestedHomework: cat.suggested_homework || [], sourceDiagnosisId: null, sourceProfile: true, status: 'active', practiceCount: 0, lastPracticed: null, createdAt: new Date().toISOString() };
      existingKeys.add(key);
      added.push(record);
    }
  }
  if (dbReady('errorBank')) { try { for (const rec of added) await dbUpsert('errorBank', rec); return added; } catch (e) { console.warn('[workflow] seedErrorBankFromProfile via Supabase failed, using localStorage:', e.message); } }
  const obj = loadObj(K.errorBankGlobal);
  obj[studentId] = [...(obj[studentId] || []), ...added];
  save(K.errorBankGlobal, obj);
  return added;
}

/* ─── STUDENT CRUD ───────────────────────────────────────────── */
export async function getStudents() {
  return listVia('studentsCrud', K.studentsCrud, null);
}
export async function getStudent(id) {
  return (await getStudents()).find(s => s.id === id) || null;
}
function withoutRosterPassword(student) {
  if (!student || !Object.prototype.hasOwnProperty.call(student, 'password')) return student;
  const { password, ...safeStudent } = student;
  return safeStudent;
}
export async function saveStudent(data) {
  const all = load(K.studentsCrud);
  const now = new Date().toISOString();
  const existing = all.findIndex(s => s.id === data.id);
  const previous = existing >= 0 ? all[existing] : {};
  const record = { id: data.id || uid(), name: data.name || '', firstName: data.firstName || (data.name || '').split(' ')[0] || '', email: data.email || '', currentLevel: data.currentLevel || data.band || 'B1', targetLevel: data.targetLevel || data.bandTarget || 'B2', examGoal: data.examGoal || data.goal || 'Pass MET B2', professionalContext: data.professionalContext || '', notes: data.notes || '', activeTargetProfileId: data.activeTargetProfileId || null, band: data.currentLevel || data.band || 'B1', bandTarget: data.targetLevel || data.bandTarget || 'B2', goal: data.examGoal || data.goal || 'Pass MET B2', session: data.session || 1, totalSessions: data.totalSessions || 24, track: data.track || 'MET', timezone: data.timezone || 'America/Sao_Paulo', createdAt: data.createdAt || now, updatedAt: now };
  if (dbReady('studentsCrud')) { try { const saved = await dbUpsert('studentsCrud', record); if (saved) return saved; } catch (e) { console.warn('[workflow] saveStudent via Supabase failed, using localStorage:', e.message); } }
  if (existing >= 0) all[existing] = { ...withoutRosterPassword(all[existing]), ...record };
  else all.unshift(record);
  save(K.studentsCrud, all);
  return record;
}
export async function deleteStudent(id) {
  if (dbReady('studentsCrud')) {
    try {
      const scoped = ['reviews', 'submissions', 'homework', 'diagnoses', 'reports', 'progressNotes', 'vocabularyBank', 'practiceSubmissions', 'practiceAssignments', 'classEvidence', 'classEvents', 'targetProfiles'];
      for (const entity of scoped) { try { const rows = (await dbList(entity)) || []; for (const r of rows.filter(r => r.studentId === id)) await dbRemove(entity, r.id); } catch { /* ignore */ } }
      await dbRemove('studentsCrud', id);
      return;
    } catch (e) { console.warn('[workflow] deleteStudent via Supabase failed, using localStorage:', e.message); }
  }
  save(K.studentsCrud, load(K.studentsCrud).filter(s => s.id !== id));
  const entities = [K.targetProfiles, K.classEvents, K.classEvidence, K.diagnoses, K.feedback, K.homework, K.submissions, K.reviews, K.reports, K.progressNotes, K.vocabularyBank, K.practiceAssignments, K.practiceSubmissions];
  for (const key of entities) save(key, load(key).filter(r => r.studentId !== id));
  save(K.inbox, load(K.inbox).filter(m => m.toStudentId !== id && m.fromStudentId !== id));
  const errorBank = loadObj(K.errorBankGlobal); delete errorBank[id]; save(K.errorBankGlobal, errorBank);
  const progress = loadObj(K.progress); delete progress[id]; save(K.progress, progress);
  const drafts = loadObj(K.drafts);
  Object.keys(drafts).forEach(key => { if (key.startsWith(`${id}:`)) delete drafts[key]; });
  save(K.drafts, drafts);
}
export async function seedStudentsIfEmpty(STUDENTS) {
  const existing = load(K.studentsCrud);
  if (existing.length > 0) {
    const patched = existing.map(withoutRosterPassword);
    const changed = patched.some((student, index) => student !== existing[index]);
    if (changed) save(K.studentsCrud, patched);
    const local = changed ? patched : existing;
    if (dbReady('studentsCrud')) { try { const sbStudents = await dbList('studentsCrud'); if (Array.isArray(sbStudents) && sbStudents.length === 0) { for (const s of local) await saveVia('studentsCrud', K.studentsCrud, s); } } catch { /* Supabase unavailable */ } }
    return local;
  }
  const seeded = STUDENTS.map(s => ({ id: s.id, name: s.name, firstName: s.firstName, email: s.email || '', currentLevel: s.band || s.currentBand || 'B1', targetLevel: s.bandTarget || s.targetBand || 'B2', examGoal: s.goal || 'Pass MET B2', professionalContext: '', notes: '', activeTargetProfileId: null, band: s.band || 'B1', bandTarget: s.bandTarget || 'B2', goal: s.goal || 'Pass MET B2', session: s.session || 1, totalSessions: s.totalSessions || 24, track: s.track || 'MET', timezone: s.timezone || 'America/Sao_Paulo', createdAt: s.createdAt || new Date().toISOString(), updatedAt: s.updatedAt || new Date().toISOString() }));
  save(K.studentsCrud, seeded);
  if (dbReady('studentsCrud')) { try { for (const s of seeded) await saveVia('studentsCrud', K.studentsCrud, s); } catch { /* ignore */ } }
  return seeded;
}

/* ─── TARGET PROFILES ────────────────────────────────────────── */
export const TARGET_PROFILE_PRESETS = { endorsement: { profileName: 'endorsement', label: 'Endorsement Minimum', overallTarget: 55, speakingTarget: 55, writingTarget: null, readingTarget: null, listeningTarget: null }, visascreen: { profileName: 'visascreen', label: 'VisaScreen / Work Visa', overallTarget: 58, speakingTarget: 59, writingTarget: null, readingTarget: null, listeningTarget: null }, healthcare: { profileName: 'healthcare', label: 'Healthcare Professional Preparation', overallTarget: 58, speakingTarget: 59, writingTarget: null, readingTarget: null, listeningTarget: null } };
export async function getTargetProfiles(studentId) {
  return listVia('targetProfiles', K.targetProfiles, studentId ? (p => p.studentId === studentId) : null);
}
export async function getActiveTargetProfile(studentId) {
  const profiles = await getTargetProfiles(studentId);
  return profiles.find(p => p.isActive) || profiles[0] || null;
}
export async function saveTargetProfile(data) {
  const record = { id: data.id || uid(), studentId: data.studentId || null, profileName: data.profileName || 'custom', label: data.label || data.profileName || 'Custom', overallTarget: data.overallTarget ?? null, speakingTarget: data.speakingTarget ?? null, writingTarget: data.writingTarget ?? null, readingTarget: data.readingTarget ?? null, listeningTarget: data.listeningTarget ?? null, isActive: data.isActive ?? false, createdAt: data.createdAt || new Date().toISOString() };
  if (dbReady('targetProfiles')) { try { const saved = await dbUpsert('targetProfiles', record); if (saved) return saved; } catch (e) { console.warn('[workflow] saveTargetProfile via Supabase failed, using localStorage:', e.message); } }
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
      for (const p of profiles) { if (Boolean(p.isActive) !== (p.id === profileId)) await dbUpsert('targetProfiles', { ...p, isActive: p.id === profileId }); }
      const student = await getStudent(studentId);
      if (student) await saveStudent({ ...student, activeTargetProfileId: profileId });
      return;
    } catch (e) { console.warn('[workflow] setActiveTargetProfile via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.targetProfiles);
  all.forEach(p => { if (p.studentId === studentId) p.isActive = p.id === profileId; });
  save(K.targetProfiles, all);
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
  const record = { id: data.id || uid(), studentId: data.studentId || null, date: data.date || new Date().toISOString().slice(0, 10), startTime: data.startTime || '', endTime: data.endTime || '', title: data.title || 'English Class', classFocus: data.classFocus || '', metSkillFocus: data.metSkillFocus || '', timezone: data.timezone || 'America/Sao_Paulo', status: data.status || 'scheduled', diagnosticStatus: data.diagnosticStatus || 'not-started', homeworkStatus: data.homeworkStatus || 'not-generated', createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (dbReady('classEvents')) { try { const saved = await dbUpsert('classEvents', record); if (saved) return saved; } catch (e) { console.warn('[workflow] saveClassEvent via Supabase failed, using localStorage:', e.message); } }
  const all = load(K.classEvents);
  const existing = all.findIndex(e => e.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.classEvents, all);
  return record;
}
export async function updateClassEventStatus(id, patch) {
  if (dbReady('classEvents')) {
    try { const ev = (await getClassEvents()).find(e => e.id === id); if (!ev) return null; return await dbUpsert('classEvents', { ...ev, ...patch }); }
    catch (e) { console.warn('[workflow] updateClassEventStatus via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.classEvents);
  const idx = all.findIndex(e => e.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  save(K.classEvents, all);
  return all[idx];
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
  const priorList = await listVia('classEvidence', K.classEvidence, null);
  const prior = priorList.find(e => e.classEventId === data.classEventId || e.id === data.id);
  const record = { id: data.id || prior?.id || uid(), classEventId: data.classEventId || null, studentId: data.studentId || null, evaluatedSpeaking: data.evaluatedSpeaking ?? false, evaluatedWriting: data.evaluatedWriting ?? false, evaluatedReading: data.evaluatedReading ?? false, evaluatedListening: data.evaluatedListening ?? false, evaluatedGrammar: data.evaluatedGrammar ?? false, evaluatedVocabulary: data.evaluatedVocabulary ?? false, evaluatedTestStrategy: data.evaluatedTestStrategy ?? false, testStrategyEvidenceCount: data.testStrategyEvidenceCount ?? 0, speakingEvidenceCount: data.speakingEvidenceCount ?? 0, writingEvidenceCount: data.writingEvidenceCount ?? 0, readingEvidenceCount: data.readingEvidenceCount ?? 0, listeningEvidenceCount: data.listeningEvidenceCount ?? 0, grammarEvidenceCount: data.grammarEvidenceCount ?? 0, vocabularyEvidenceCount: data.vocabularyEvidenceCount ?? 0, teacherNotes: data.teacherNotes || '', studentPerformance: data.studentPerformance || '', studentTranscript: data.studentTranscript || '', studentAnswer: data.studentAnswer || '', homeworkReviewed: data.homeworkReviewed || '', studentMood: data.studentMood || '', additionalNotes: data.additionalNotes || '', createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (dbReady('classEvidence')) { try { const saved = await dbUpsert('classEvidence', record); if (saved) return saved; } catch (e) { console.warn('[workflow] saveClassEvidence via Supabase failed, using localStorage:', e.message); } }
  const all = load(K.classEvidence);
  const existing = all.findIndex(e => e.classEventId === record.classEventId || e.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.push(record);
  save(K.classEvidence, all);
  return record;
}
export async function updateClassEvidence(id, patch) {
  if (dbReady('classEvidence')) {
    try { const ev = (await listVia('classEvidence', K.classEvidence, null)).find(e => e.id === id); if (!ev) return null; return await dbUpsert('classEvidence', { ...ev, ...patch }); }
    catch (e) { console.warn('[workflow] updateClassEvidence via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.classEvidence);
  const idx = all.findIndex(e => e.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  save(K.classEvidence, all);
  return all[idx];
}

/* ─── VOCABULARY BANK ────────────────────────────────────────── */
export async function getVocabularyBank(studentId) {
  return listVia('vocabularyBank', K.vocabularyBank, studentId ? (v => v.studentId === studentId) : null);
}
export async function saveVocabularyEntry(data) {
  const record = { id: data.id || uid(), studentId: data.studentId || null, wordOrPhrase: data.wordOrPhrase || data.word || '', category: data.category || 'general', meaning: data.meaning || '', exampleSentence: data.exampleSentence || '', status: data.status || 'active', evidenceSource: data.evidenceSource || {}, createdAt: data.createdAt || new Date().toISOString() };
  if (dbReady('vocabularyBank')) { try { const saved = await dbUpsert('vocabularyBank', record); if (saved) return saved; } catch (e) { console.warn('[workflow] saveVocabularyEntry via Supabase failed, using localStorage:', e.message); } }
  const all = load(K.vocabularyBank);
  const existing = all.findIndex(v => v.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.vocabularyBank, all);
  return record;
}
export async function updateVocabularyEntry(id, patch) {
  if (dbReady('vocabularyBank')) {
    try { const v = (await listVia('vocabularyBank', K.vocabularyBank, null)).find(x => x.id === id); if (!v) return null; return await dbUpsert('vocabularyBank', { ...v, ...patch }); }
    catch (e) { console.warn('[workflow] updateVocabularyEntry via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.vocabularyBank);
  const idx = all.findIndex(v => v.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  save(K.vocabularyBank, all);
  return all[idx];
}
export async function deleteVocabularyEntry(id) {
  return removeVia('vocabularyBank', K.vocabularyBank, id);
}

/* ─── PROGRESS NOTES ─────────────────────────────────────────── */
export async function getProgressNotes(studentId) {
  return listVia('progressNotes', K.progressNotes, studentId ? (n => n.studentId === studentId) : null);
}
export async function saveProgressNote(data) {
  const record = { id: data.id || uid(), studentId: data.studentId || null, sourceType: data.sourceType || 'teacher', sourceId: data.sourceId || null, note: data.note || '', createdAt: data.createdAt || new Date().toISOString() };
  if (dbReady('progressNotes')) { try { const saved = await dbUpsert('progressNotes', record); if (saved) return saved; } catch (e) { console.warn('[workflow] saveProgressNote via Supabase failed, using localStorage:', e.message); } }
  const all = load(K.progressNotes);
  all.unshift(record);
  save(K.progressNotes, all);
  return record;
}
export async function deleteProgressNote(id) {
  return removeVia('progressNotes', K.progressNotes, id);
}

/* ─── ONE-TIME LOCAL → CLOUD IMPORT ──────────────────────────── */
export async function syncLocalToCloud() {
  if (!getDbContext()) throw new Error('Sign in with Supabase first to sync to the cloud.');
  const order = ['studentsCrud', 'diagnoses', 'targetProfiles', 'classEvents', 'classEvidence', 'vocabularyBank', 'progressNotes', 'reports', 'practiceResources', 'practiceAssignments', 'practiceSubmissions', 'homework', 'submissions', 'reviews'];
  const synced = new Set(loadObj('vv:syncedIds').ids || []);
  const counts = {};
  for (const entity of order) {
    if (!dbReady(entity)) continue;
    const list = load(K[entity]);
    let n = 0;
    for (const rec of list) {
      if (!rec || !rec.id) continue;
      const tag = `${entity}:${rec.id}`;
      if (synced.has(tag)) continue;
      try { await dbUpsert(entity, rec); synced.add(tag); n++; } catch (e) { console.warn(`[sync] ${tag} failed:`, e.message); }
    }
    counts[entity] = n;
  }
  if (dbReady('errorBank')) {
    const obj = loadObj(K.errorBankGlobal);
    let n = 0;
    for (const [sid, entries] of Object.entries(obj)) {
      for (const entry of (entries || [])) {
        if (!entry?.id) continue;
        const tag = `errorBank:${entry.id}`;
        if (synced.has(tag)) continue;
        try { await dbUpsert('errorBank', { ...entry, studentId: entry.studentId || sid }); synced.add(tag); n++; } catch (e) { console.warn(`[sync] ${tag} failed:`, e.message); }
      }
    }
    counts.errorBank = n;
  }
  save('vv:syncedIds', { ids: [...synced] });
  return counts;
}

/* ─── EXPORT STUDENT DATA ────────────────────────────────────── */
export async function exportStudentData(studentId) {
  if (!studentId) throw new Error('studentId is required for export.');
  const studentScopedEntities = [
    { key: K.diagnoses, label: 'diagnoses', fn: getDiagnoses },
    { key: K.feedback, label: 'feedback', fn: getFeedback },
    { key: K.homework, label: 'homework', fn: getHomework },
    { key: K.practiceAssignments, label: 'practiceAssignments', fn: getPracticeAssignments },
    { key: K.practiceSubmissions, label: 'practiceSubmissions', fn: getPracticeSubmissions },
    { key: K.reports, label: 'reports', fn: getReports },
    { key: K.submissions, label: 'submissions', fn: getSubmissions },
    { key: K.reviews, label: 'reviews', fn: getReviews },
    { key: K.vocabularyBank, label: 'vocabularyBank', fn: getVocabularyBank },
    { key: K.progressNotes, label: 'progressNotes', fn: getProgressNotes },
  ];
  const exportPackage = { exportDate: new Date().toISOString(), studentId, data: {} };
  for (const entity of studentScopedEntities) {
    const items = await entity.fn(studentId);
    exportPackage.data[entity.label] = items;
  }
  const errorBankObj = loadObj(K.errorBankGlobal);
  exportPackage.data.errorBank = errorBankObj[studentId] || [];
  const profiles = await getTargetProfiles(studentId);
  exportPackage.data.targetProfiles = profiles;
  const allEvidence = await listVia('classEvidence', K.classEvidence, null);
  const studentClassEvents = await getClassEvents(studentId);
  const studentEventIds = new Set(studentClassEvents.map(e => e.id));
  exportPackage.data.classEvidence = allEvidence.filter(ev => studentEventIds.has(ev.classEventId));
  return exportPackage;
}
