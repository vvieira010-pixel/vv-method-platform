/**
 * workflow.js — Public API re-export facade.
 *
 * Splits the original 1371-line monolith into three domain files:
 *   workflow-core.js    — K constants, localStorage helpers, dual-mode adapters
 *   workflow-academic.js — Sessions, Diagnoses, Feedback, Homework, Submissions,
 *                          Reviews, Corrections, Drafts, Cycle State, Late Status
 *   workflow-roster.js   — Students, Target Profiles, Class Events, Class Evidence,
 *                          Vocabulary Bank, Progress Notes, Inbox, Practice, Error Bank,
 *                          syncLocalToCloud, exportStudentData
 *
 * All 27+ consumers import from 'lib/workflow.js' — unchanged.
 * Future: migrate consumers to direct imports from the domain files.
 */

export {
  // core helpers
  K, load, loadObj, save, uid, removeHomeworkDrafts, upsert, loadWithIds,
  dbReady, listVia, saveVia, removeVia,
  clearWorkflowData,
} from './workflow-core.js';

export {
  // academic domain
  getSessions, createSession, updateSession, deleteSession,
  getDiagnoses, getDiagnosis, getLatestDiagnosis, saveDiagnosis, deleteDiagnosis,
  getFeedback, saveFeedback, deleteFeedback,
  getHomework, saveHomework, deleteHomework,
  getSubmissions, submitHomework, getAllSubmissions, deleteSubmission,
  getCorrections, saveCorrection,
  getDraft, saveDraft,
  isReviewed, markReviewed,
  getReviews, saveReview, deleteReview,
  updateDiagnosisCycleStage, getDiagnosisTimeline, getStudentCycleState,
  getLateStatus,
} from './workflow-academic.js';

export {
  // roster / admin domain
  TARGET_PROFILE_PRESETS,
  getInbox, sendMessage, markRead, requestInboxNotificationPermission,
  getProgress, saveProgress,
  getReports, saveReport,
  getPracticeAssignments, savePracticeAssignment, deletePracticeAssignment,
  getPracticeResources, savePracticeResource, deletePracticeResource,
  getPracticeSubmissions, savePracticeSubmission,
  getErrorBank, promoteErrorToLongTerm, markErrorPracticed, markErrorSolved,
  incrementErrorAppearance,
  seedErrorBankFromProfile,
  getStudents, getStudent, saveStudent, deleteStudent, seedStudentsIfEmpty,
  getTargetProfiles, getActiveTargetProfile, saveTargetProfile, setActiveTargetProfile, deleteTargetProfile,
  getClassEvents, getClassEvent, saveClassEvent, updateClassEventStatus, deleteClassEvent,
  getClassEvidence, saveClassEvidence, updateClassEvidence,
  getVocabularyBank, saveVocabularyEntry, updateVocabularyEntry, deleteVocabularyEntry,
  getProgressNotes, saveProgressNote, deleteProgressNote,
  syncLocalToCloud, exportStudentData,
} from './workflow-roster.js';

export {
  getSeedsStages, getStudentSeedsStage, setStudentSeedsStage,
} from './workflow-seeds.js';
