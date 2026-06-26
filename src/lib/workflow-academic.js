import { K, load, loadObj, save, uid, loadWithIds, dbReady, listVia, saveVia, removeVia, upsert, removeHomeworkDrafts } from './workflow-core.js';
import { dbList, dbGet, dbUpsert, dbRemove } from './supabase-db.js';
import { initSchedule } from './spaced-repetition.js';
import { updateClassEventStatus } from './workflow-roster.js';

/* ─── SESSIONS ───────────────────────────────────────────────── */
export async function getSessions(studentId) {
  const all = load(K.sessions);
  return studentId ? all.filter(s => s.studentId === studentId) : all;
}
export async function createSession(data) {
  const all = load(K.sessions);
  const session = { id: uid(), createdAt: new Date().toISOString(), date: data?.date || new Date().toISOString().slice(0, 10), ...data };
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

/* ─── DIAGNOSES ─────────────────────────────────────────────── */
export async function getDiagnoses(studentId) {
  return listVia('diagnoses', K.diagnoses, studentId ? (d => d.studentId === studentId) : null);
}
export async function getDiagnosis(id) {
  if (!id) return null;
  if (dbReady('diagnoses')) {
    try { const record = await dbGet('diagnoses', id); if (record) return record; }
    catch (e) { console.warn('[workflow] getDiagnosis via Supabase failed, using localStorage:', e.message); }
  }
  return loadWithIds(K.diagnoses).find(r => r.id === id) || null;
}
export async function getLatestDiagnosis(studentId) {
  const all = await getDiagnoses(studentId);
  return all[0] || null;
}
export async function saveDiagnosis(data) {
  return saveVia('diagnoses', K.diagnoses, data, {
    studentId: null, sessionId: null, strengths: [], weaknesses: [],
    grammarIssues: [], vocabularyIssues: [], skillIssues: [], metConnections: [], nextSteps: [], content: null,
    isBaseline: false, interventionNote: '', inquiryHypothesis: '',
  });
}
export async function deleteDiagnosis(id) {
  const dx = (await getDiagnoses()).find(d => d.id === id);
  await removeVia('diagnoses', K.diagnoses, id);
  if (dx?.classEventId) {
    try { await updateClassEventStatus(dx.classEventId, { diagnosticStatus: 'not-started' }); }
    catch (e) { console.warn('[workflow] deleteDiagnosis: class event reset failed:', e.message); }
  }
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
    diagnosisId: null, assignedAt: new Date().toISOString(), status: 'not-started',
    activities: data?.activities || data?.tasks || [],
  });
}
export async function deleteHomework(id) {
  if (dbReady('homework')) {
    try {
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

/* ─── SUBMISSIONS ────────────────────────────────────────────── */
export async function getSubmissions(studentId) {
  return listVia('submissions', K.submissions, studentId ? (s => s.studentId === studentId) : null);
}
export async function submitHomework(homeworkId, studentId, content, responses, confidence) {
  const sub = {
    id: uid(), homeworkId, studentId, content,
    responses: responses || null, confidence: confidence != null ? confidence : null,
    submittedAt: new Date().toISOString(), status: 'submitted',
  };
  if (dbReady('submissions')) {
    try {
      const saved = await dbUpsert('submissions', sub);
      try {
        const hw = (await dbList('homework') || []).find(h => h.id === homeworkId);
        if (hw) await dbUpsert('homework', { ...hw, status: 'submitted' });
      } catch { /* ignore */ }
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

/* ─── REVIEWS (teacher correction of student submissions) ────── */
export async function getReviews(studentId) {
  return listVia('reviews', K.reviews, studentId ? (r => r.studentId === studentId) : null);
}
export async function saveReview(data) {
  const record = {
    id: data?.id || uid(), submissionId: data?.submissionId || null, homeworkId: data?.homeworkId || null,
    diagnosisId: data?.diagnosisId || null, studentId: data?.studentId || null,
    corrections: data?.corrections || [], overallNote: data?.overallNote || '',
    score: data?.score ?? null, reviewedAt: data?.reviewedAt || new Date().toISOString(),
    createdAt: data?.createdAt || new Date().toISOString(), ...data,
  };
  if (dbReady('reviews')) {
    try {
      const saved = await dbUpsert('reviews', record);
      if (record.submissionId) {
        try { const sub = (await dbList('submissions') || []).find(s => s.id === record.submissionId); if (sub) await dbUpsert('submissions', { ...sub, status: 'reviewed', reviewedAt: record.reviewedAt }); } catch { /* ignore */ }
      }
      if (record.homeworkId) {
        try { const hw = (await dbList('homework') || []).find(h => h.id === record.homeworkId); if (hw) await dbUpsert('homework', { ...hw, status: 'reviewed', reviewedAt: record.reviewedAt }); } catch { /* ignore */ }
      }
      if (saved) return saved;
    } catch (e) { console.warn('[workflow] saveReview via Supabase failed, using localStorage:', e.message); }
  }
  const all = load(K.reviews);
  const existing = all.findIndex(r => r.id === record.id);
  if (existing >= 0) all[existing] = { ...all[existing], ...record };
  else all.unshift(record);
  save(K.reviews, all);
  const submissions = load(K.submissions);
  const subIdx = submissions.findIndex(s => s.id === record.submissionId);
  if (subIdx >= 0) { submissions[subIdx] = { ...submissions[subIdx], status: 'reviewed', reviewedAt: record.reviewedAt }; save(K.submissions, submissions); }
  const homework = load(K.homework);
  const hwIdx = homework.findIndex(h => h.id === record.homeworkId);
  if (hwIdx >= 0) { homework[hwIdx] = { ...homework[hwIdx], status: 'reviewed', reviewedAt: record.reviewedAt }; save(K.homework, homework); }
  return record;
}
export async function deleteReview(id) {
  if (dbReady('reviews')) {
    try {
      const review = (await dbList('reviews') || []).find(r => r.id === id);
      await dbRemove('reviews', id);
      if (review?.submissionId) { const sub = (await dbList('submissions') || []).find(s => s.id === review.submissionId); if (sub) await dbUpsert('submissions', { ...sub, status: 'submitted', reviewedAt: undefined }); }
      if (review?.homeworkId) { try { const hw = (await dbList('homework') || []).find(h => h.id === review.homeworkId); if (hw) await dbUpsert('homework', { ...hw, status: 'submitted', reviewedAt: undefined }); } catch { /* ignore */ } }
      return;
    } catch (e) { console.warn('[workflow] deleteReview via Supabase failed, using localStorage:', e.message); }
  }
  const reviews = load(K.reviews);
  const review = reviews.find(r => r.id === id);
  save(K.reviews, reviews.filter(r => r.id !== id));
  if (review?.submissionId) { const submissions = load(K.submissions); const subIdx = submissions.findIndex(s => s.id === review.submissionId); if (subIdx >= 0) { submissions[subIdx] = { ...submissions[subIdx], status: 'submitted' }; delete submissions[subIdx].reviewedAt; save(K.submissions, submissions); } }
  const homework = load(K.homework);
  const hwIdx = homework.findIndex(h => h.id === review.homeworkId);
  if (hwIdx >= 0) { homework[hwIdx] = { ...homework[hwIdx], status: 'submitted' }; delete homework[hwIdx].reviewedAt; save(K.homework, homework); }
}

/* ─── DIAGNOSIS CYCLE STATE ─────────────────────────────────── */
export async function updateDiagnosisCycleStage(diagnosisId, stage) {
  if (dbReady('diagnoses')) {
    const all = await getDiagnoses(); const d = all.find(x => x.id === diagnosisId);
    if (!d) return null; return saveDiagnosis({ ...d, cycleStage: stage });
  }
  const all = load(K.diagnoses); const idx = all.findIndex(d => d.id === diagnosisId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], cycleStage: stage, updatedAt: new Date().toISOString() }; save(K.diagnoses, all); return all[idx];
}
export async function getDiagnosisTimeline(studentId) {
  const all = await getDiagnoses(studentId);
  return all.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export async function getStudentCycleState(studentId) {
  const diagnoses = await getDiagnoses(studentId);
  const homework = await getHomework(studentId);
  const submissions = await getSubmissions(studentId);
  const reviews = await getReviews(studentId);
  const latestDiagnosis = diagnoses[0] || null;
  const daysSinceLastDiagnosis = latestDiagnosis ? Math.floor((Date.now() - new Date(latestDiagnosis.createdAt).getTime()) / 86400000) : null;
  const pendingHomework = homework.filter(h => h.status === 'not-started' || h.status === 'in-progress');
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const pendingReviews = pendingSubmissions.filter(s => !reviews.some(r => r.submissionId === s.id));
  let cycleStage = 'needs-diagnosis';
  if (latestDiagnosis) {
    if (latestDiagnosis.isBaseline && !latestDiagnosis.interventionNote) cycleStage = 'baseline-complete';
    else if (latestDiagnosis.interventionNote) cycleStage = 'intervention-applied';
    else {
      const stage = latestDiagnosis.cycleStage;
      if (stage === 'reviewed') cycleStage = 'reviewed';
      else if (pendingReviews.length > 0) cycleStage = 'submitted';
      else if (stage === 'homework-assigned' || pendingHomework.length > 0) cycleStage = 'homework-assigned';
      else if (stage === 'feedback-sent') cycleStage = 'feedback-sent';
      else cycleStage = 'diagnosed';
    }
  }
  return { cycleStage, latestDiagnosis, pendingHomework, pendingSubmissions: pendingReviews, daysSinceLastDiagnosis, totalDiagnoses: diagnoses.length, totalHomework: homework.length, totalSubmissions: submissions.length };
}

/* ─── LATE STATUS ────────────────────────────────────────────── */
export async function getLateStatus(studentId) {
  const hw = await getHomework(studentId);
  const now = Date.now();
  const late = hw.filter(h => { if (!h.dueDate || h.status === 'completed' || h.status === 'corrected') return false; return new Date(h.dueDate).getTime() < now; });
  return { lateCount: late.length, lateItems: late };
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
        try { const hw = (await dbList('homework') || []).find(h => h.id === submission.homeworkId); if (hw) await dbUpsert('homework', { ...hw, status: 'not-started', reviewedAt: undefined }); } catch { /* ignore */ }
        removeHomeworkDrafts(submission.homeworkId);
      }
      return;
    } catch (e) { console.warn('[workflow] deleteSubmission via Supabase failed, using localStorage:', e.message); }
  }
  const submission = load(K.submissions).find(s => s.id === id);
  save(K.submissions, load(K.submissions).filter(s => s.id !== id));
  save(K.reviews, load(K.reviews).filter(r => r.submissionId !== id));
  if (submission?.homeworkId) {
    const homework = load(K.homework); const hwIdx = homework.findIndex(h => h.id === submission.homeworkId);
    if (hwIdx >= 0) { homework[hwIdx] = { ...homework[hwIdx], status: 'not-started' }; delete homework[hwIdx].reviewedAt; save(K.homework, homework); }
    removeHomeworkDrafts(submission.homeworkId);
  }
}
