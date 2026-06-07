/**
 * diagnostic-create.jsx — Multi-step diagnosis: prereqs → AI → preview/approve → save
 *
 * The most important page. Teacher must:
 * 1. Select target score profile (blocker)
 * 2. Confirm evaluated skills (blocker)
 * 3. Run AI diagnosis
 * 4. Preview and approve each section
 * 5. Save approved diagnosis
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar, StudentFeedbackView } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import { 
  buildSkillDiagnosisPrompt, 
  buildStudentFeedbackPrompt, 
  buildHomeworkPrompt, 
  buildErrorBankPrompt, 
  buildSectionRegenPrompt 
} from '../lib/prompts.js';
import { TARGET_PROFILE_PRESETS } from '../lib/workflow.js';
import { STUDENT_ERROR_PROFILES, buildErrorProfileContext } from '../lib/error-bank-profiles.js';
import {
  getStudent, getStudents,
  getTargetProfiles, saveTargetProfile, getActiveTargetProfile, setActiveTargetProfile,
  getClassEvent, getClassEvidence,
  getDiagnoses, getDiagnosis, saveDiagnosis, updateDiagnosisCycleStage, updateClassEventStatus,
  promoteErrorToLongTerm, saveVocabularyEntry, saveProgressNote,
  getHomework,
} from '../lib/workflow.js';

const labelStyle = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };

const SECTION_KEYS = [
  { key: 'readinessCheck',         label: 'Diagnostic Readiness Check',    studentFacing: false },
  { key: 'classSummary',           label: 'Class Summary',                 studentFacing: false },
  { key: 'targetScoreRelevance',   label: 'Target Score Relevance',        studentFacing: false },
  { key: 'estimatedOverallScore',  label: 'Estimated Overall Score',       studentFacing: false },
  { key: 'skillDiagnosis',         label: 'Skill Diagnosis',               studentFacing: false },
  { key: 'errorBankSuggestions',   label: 'Error Bank Suggestions',        studentFacing: false },
  { key: 'vocabGrammarTargets',    label: 'Vocabulary & Grammar Targets',  studentFacing: false },
  { key: 'priorityDiagnosis',      label: 'Priority Diagnosis (Top 3)',    studentFacing: false },
  { key: 'studentFeedback',        label: 'Personalized Student Feedback', studentFacing: true  },
  { key: 'homeworkRecommendation', label: 'Homework Recommendation',       studentFacing: true  },
  { key: 'nextClassFocus',         label: 'Next Class Focus',              studentFacing: false },
  { key: 'profileUpdateSuggestions',label:'Profile Update Suggestions',   studentFacing: false },
];

const REQUIRED_APPROVAL_KEYS = ['skillDiagnosis', 'studentFeedback', 'homeworkRecommendation', 'nextClassFocus'];
const SECTION_LABELS = Object.fromEntries(SECTION_KEYS.map(section => [section.key, section.label]));

// Review layout: two zones, with thin teacher sections merged into fuller cards.
// A group with one key renders as its own card; multiple keys render together in
// one card (each member keeps its own approve/edit/regen controls).
const SECTION_GROUPS = [
  {
    zone: 'teacher', title: 'Teacher Analysis', studentFacing: false,
    groups: [
      { title: 'Readiness Check', keys: ['readinessCheck'] },
      { title: 'Overview', keys: ['classSummary', 'targetScoreRelevance', 'estimatedOverallScore'] },
      { title: 'Skill Diagnosis', keys: ['skillDiagnosis'] },
      { title: 'Priorities', keys: ['priorityDiagnosis'] },
      { title: 'Errors & Targets', keys: ['errorBankSuggestions', 'vocabGrammarTargets'] },
      { title: 'Class Planning', keys: ['nextClassFocus', 'profileUpdateSuggestions'] },
    ],
  },
  {
    zone: 'student', title: 'Student-Facing', studentFacing: true,
    caption: 'This is exactly what your student will see.',
    groups: [
      { title: 'Personalized Student Feedback', keys: ['studentFeedback'] },
      { title: 'Homework Recommendation', keys: ['homeworkRecommendation'] },
    ],
  },
];

function shouldRetryCompact(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('request too large')
    || msg.includes('tokens per minute')
    || msg.includes('tokens per day')
    || msg.includes('rate limit')
    || msg.includes('quota')
    || msg.includes('limit reached');
}

function friendlyAiError(error) {
  const msg = String(error?.message || error || '');
  if (/quota|rate limit|tokens per day|limit reached/i.test(msg)) {
    return 'Diagnosis failed because the available AI providers are out of quota or rate-limited. The app tried the full diagnosis and a smaller fallback. Wait for quota reset, use a different key, or shorten the transcript/notes.';
  }
  if (/request too large|tokens per minute|too many tokens/i.test(msg)) {
    return 'Diagnosis failed because the class evidence is too long for the available fallback model. Shorten the transcript/notes and try again.';
  }
  if (/failed to fetch/i.test(msg)) {
    return 'Diagnosis failed because one provider could not be reached from the browser. Check the key/provider setup and try again.';
  }
  return `Diagnosis failed: ${msg}`;
}

export default function DiagnosticCreate({ studentId, classEventId, diagnosisId, students, onNavigate }) {
  const [step, setStep] = useState('prereq'); // prereq | generating | review | saved
  const [student, setStudent] = useState(null);
  const [classEvent, setClassEvent] = useState(null);
  const [classEvidence, setClassEvidence] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [sections, setSections] = useState({});
  const [savedDiagnosis, setSavedDiagnosis] = useState(null);
  const [error, setError] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [editText, setEditText] = useState('');
  const [regenerating, setRegenerating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('Initializing...');

  // Student selector (if no studentId passed)
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [selectedClassEventId, setSelectedClassEventId] = useState(classEventId || '');
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    getStudents().then(setAllStudents);
  }, []);

  useEffect(() => {
    if (selectedStudentId) loadStudent(selectedStudentId);
  }, [selectedStudentId]);

  useEffect(() => {
    if (selectedClassEventId) loadClassData(selectedClassEventId);
  }, [selectedClassEventId]);

  useEffect(() => {
    if (diagnosisId) loadExistingDiagnosis(diagnosisId);
    else setStep('prereq');
  }, [diagnosisId]);

  async function loadStudent(sid) {
    const [s, tp] = await Promise.all([getStudent(sid), getTargetProfiles(sid)]);
    setStudent(s || allStudents.find(x => x.id === sid));
    setProfiles(tp);
    setTargetProfile(tp.find(p => p.isActive) || tp[0] || null);
  }

  async function loadClassData(ceid) {
    const [ev, evid] = await Promise.all([getClassEvent(ceid), getClassEvidence(ceid)]);
    setClassEvent(ev);
    setClassEvidence(evid);
  }

  async function loadExistingDiagnosis(dxId) {
    if (!dxId) return;
    const dx = await getDiagnosis(dxId);
    if (dx) {
      setSavedDiagnosis(dx);
      if (dx.studentId) {
        setSelectedStudentId(dx.studentId);
        loadStudent(dx.studentId);
      }
      if (dx.sections) {
        setSections(dx.sections);
        setAiResult(dx.aiRaw || null);
      }
      setStep('review');
    } else {
      setError('Could not load that diagnosis — it may have been deleted.');
    }
  }

  // ── Inline evidence (when no class event linked) ──
  const [inlineTranscript, setInlineTranscript] = useState('');
  const [inlineTeacherNotes, setInlineTeacherNotes] = useState('');
  const [inlineSkills, setInlineSkills] = useState({
    evaluatedSpeaking: false, evaluatedWriting: false, evaluatedReading: false,
    evaluatedListening: false, evaluatedGrammar: false, evaluatedVocabulary: false, evaluatedTestStrategy: false,
    speakingEvidenceCount: 0, writingEvidenceCount: 0, readingEvidenceCount: 0,
    listeningEvidenceCount: 0, grammarEvidenceCount: 0, vocabularyEvidenceCount: 0, testStrategyEvidenceCount: 0,
  });

  // ── Prereq validation ──
  const selectedStudent = student || allStudents.find(s => s.id === selectedStudentId);
  // Use class evidence if available, otherwise build from inline inputs
  const noLinkedEvidence = !classEvidence;
  const inlineEvidenceObj = noLinkedEvidence ? {
    ...inlineSkills,
    teacherNotes: inlineTeacherNotes,
    studentTranscript: inlineTranscript,
    studentAnswer: inlineTranscript,
  } : null;
  const evidence = classEvidence || inlineEvidenceObj;
  const normalizedEvidence = normalizeEvidenceCounts(evidence);

  const evaluatedSkills = normalizedEvidence ? Object.entries({
    speaking: normalizedEvidence.evaluatedSpeaking,
    writing: normalizedEvidence.evaluatedWriting,
    reading: normalizedEvidence.evaluatedReading,
    listening: normalizedEvidence.evaluatedListening,
    grammar: normalizedEvidence.evaluatedGrammar,
    vocabulary: normalizedEvidence.evaluatedVocabulary,
    testStrategy: normalizedEvidence.evaluatedTestStrategy,
  }).filter(([, v]) => v).map(([k]) => k) : [];

  // When no class linked: need transcript OR teacher notes + at least one skill
  const inlineReady = noLinkedEvidence
    ? (inlineTranscript.trim().length > 0 || inlineTeacherNotes.trim().length > 0) && evaluatedSkills.length > 0
    : evaluatedSkills.length > 0;

  const prereqOk = selectedStudent && targetProfile && inlineReady;
  const prereqWarning = evaluatedSkills.some(sk => {
    const countKey = sk + 'EvidenceCount';
    return normalizedEvidence && (normalizedEvidence[countKey] === 0 || normalizedEvidence[countKey] === undefined);
  });

  // ── Run AI diagnosis ──
  async function handleGenerate() {
    if (!prereqOk) return;
    setStep('generating');
    setGeneratingStatus('Analyzing class evidence...');
    setError('');

    try {
      const promptData = { student: selectedStudent, classEvent, classEvidence: normalizedEvidence, targetProfile };
      
      // Sequential generation: diagnosis first, then informed layers.
      const getContent = (res) => (res?.content?.map(b => b.text || '').join('') || '');

      // Phase 1: Core skill diagnosis
      setGeneratingStatus('Step 1/4 — Generating skill diagnosis…');
      const diagnosisRaw = await callAI(buildSkillDiagnosisPrompt(promptData), { max_tokens: 6000, preferredProvider: 'gemini' }).catch(() => null);
      const parsedDiagnosis = diagnosisRaw ? parseAiJson(getContent(diagnosisRaw)) : {};

      // Phase 2: Error bank + vocab targets (informed by the diagnosis)
      setGeneratingStatus('Step 2/4 — Analysing errors and vocabulary targets…');
      const errorBankRaw = await callAI(buildErrorBankPrompt({ ...promptData, diagnosis: parsedDiagnosis }), { max_tokens: 2500, preferredProvider: 'gemini' }).catch(() => null);
      const parsedErrorBank = errorBankRaw ? parseAiJson(getContent(errorBankRaw)) : {};

      // Phase 3: Student feedback (informed by the full diagnosis)
      setGeneratingStatus('Step 3/4 — Writing student feedback…');
      const feedbackRaw = await callAI(buildStudentFeedbackPrompt({ ...promptData, diagnosis: parsedDiagnosis }), { max_tokens: 2500, preferredProvider: 'gemini' }).catch(() => null);
      const parsedFeedback = feedbackRaw ? parseAiJson(getContent(feedbackRaw)) : {};

      // Phase 4: Homework recommendation (informed by diagnosis + errors + vocab)
      setGeneratingStatus('Step 4/4 — Building homework recommendation…');
      const homeworkRaw = await callAI(buildHomeworkPrompt({
        ...promptData,
        diagnosis: parsedDiagnosis,
        errorBank: parsedErrorBank.errorBankSuggestions,
        vocabTargets: parsedErrorBank.vocabGrammarTargets,
      }), { max_tokens: 3000, preferredProvider: 'gemini' }).catch(() => null);
      const parsedHomework = homeworkRaw ? parseAiJson(getContent(homeworkRaw)) : {};

      setGeneratingStatus('Structuring results…');

      // Combine results into the sections state, marking failed ones for Regen
      const FAILED = { content: "Failed to generate — click Regen to retry.", approved: false, hidden: false, edited: false };
      const initSections = {
        skillDiagnosis:        diagnosisRaw  ? { content: parsedDiagnosis.skillDiagnosis ?? null,              approved: false, hidden: false, edited: false } : FAILED,
        studentFeedback:       feedbackRaw   ? { content: parsedFeedback,                                       approved: false, hidden: false, edited: false } : FAILED,
        homeworkRecommendation:homeworkRaw   ? { content: parsedHomework,                                       approved: false, hidden: false, edited: false } : FAILED,
        errorBankSuggestions:  errorBankRaw  ? { content: parsedErrorBank.errorBankSuggestions ?? [],           approved: false, hidden: false, edited: false } : { content: [], approved: false, hidden: false, edited: false },
        vocabGrammarTargets:   errorBankRaw  ? { content: parsedErrorBank.vocabGrammarTargets ?? null,          approved: false, hidden: false, edited: false } : { content: null, approved: false, hidden: false, edited: false },
        readinessCheck: { content: { targetProfileSelected: !!targetProfile, evaluatedSkills: evaluatedSkills, notEvaluatedSkills: [], diagnosisAllowed: true }, approved: true, hidden: false, edited: false },
        classSummary: { content: parsedDiagnosis.classSummary || '', approved: false, hidden: false, edited: false },
        targetScoreRelevance: { content: parsedDiagnosis.targetScoreRelevance || {}, approved: false, hidden: false, edited: false },
        estimatedOverallScore: { content: parsedDiagnosis.estimatedOverallScore || {}, approved: false, hidden: false, edited: false },
        priorityDiagnosis: { content: parsedDiagnosis.priorityDiagnosis || [], approved: false, hidden: false, edited: false },
        nextClassFocus: { content: parsedDiagnosis.nextClassFocus || {}, approved: false, hidden: false, edited: false },
        profileUpdateSuggestions: { content: parsedDiagnosis.profileUpdateSuggestions || {}, approved: false, hidden: false, edited: false },
      };

      setAiResult(parsedDiagnosis);
      setSections(initSections);

      // Auto-save draft immediately
      try {
        const draft = await saveDiagnosis({
          id: savedDiagnosis?.id,
          studentId: selectedStudentId || studentId,
          classEventId: selectedClassEventId || classEventId,
          targetProfileId: targetProfile?.id,
          evaluatedSkills: Object.fromEntries(evaluatedSkills.map(k => [k, true])),
          evidenceCounts: {
            speaking: normalizedEvidence?.speakingEvidenceCount || 0,
            writing: normalizedEvidence?.writingEvidenceCount || 0,
            reading: normalizedEvidence?.readingEvidenceCount || 0,
            listening: normalizedEvidence?.listeningEvidenceCount || 0,
            grammar: normalizedEvidence?.grammarEvidenceCount || 0,
            vocabulary: normalizedEvidence?.vocabularyEvidenceCount || 0,
            testStrategy: normalizedEvidence?.testStrategyEvidenceCount || 0,
          },
          sections: initSections,
          aiRaw: parsedDiagnosis,
          status: 'draft',
          cycleStage: 'needs-diagnosis',
          classSummary: typeof parsedDiagnosis.classSummary === 'string' ? parsedDiagnosis.classSummary : '',
          content: { 
            overall_result: typeof parsedDiagnosis.classSummary === 'string' ? parsedDiagnosis.classSummary : '', 
            priorities: parsedDiagnosis.priorityDiagnosis || [], 
            error_bank: parsedErrorBank.errorBankSuggestions || [] 
          },
        });
        if (draft) setSavedDiagnosis(draft);
      } catch (autoSaveErr) {
        console.warn('Auto-save draft failed:', autoSaveErr);
      }

      if (!diagnosisRaw || !errorBankRaw || !feedbackRaw || !homeworkRaw) {
        window.toast?.('Some sections failed to generate — please Regen them.', 'warn');
      }

      setStep('review');
    } catch (e) {
      console.error(e);
      setError(friendlyAiError(e));
      setStep('prereq');
    }
  }

  // ── Section actions ──
  function startEdit(key) {
    const content = sections[key]?.content;
    setEditText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
    setEditingSection(key);
  }

  function saveEdit(key) {
    setSections(s => ({
      ...s,
      [key]: { ...s[key], content: tryParseOrString(editText), edited: true },
    }));
    setEditingSection(null);
  }

  function toggleApprove(key) {
    setSections(s => ({ ...s, [key]: { ...s[key], approved: !s[key].approved } }));
  }

  function toggleHide(key) {
    setSections(s => ({ ...s, [key]: { ...s[key], hidden: !s[key].hidden } }));
  }

  async function regenerateSection(key) {
    setRegenerating(key);
    try {
      const existingSections = Object.fromEntries(
        Object.entries(sections).filter(([k]) => k !== key)
      );
      
      let prompt;
      let promptData = { student: selectedStudent, classEvent, classEvidence: normalizedEvidence, targetProfile, existingSections };

      switch (key) {
        case 'skillDiagnosis':
          prompt = buildSkillDiagnosisPrompt(promptData);
          break;
        case 'studentFeedback':
          prompt = buildStudentFeedbackPrompt(promptData);
          break;
        case 'homeworkRecommendation':
          prompt = buildHomeworkPrompt(promptData);
          break;
        case 'errorBankSuggestions':
        case 'vocabGrammarTargets':
          prompt = buildErrorBankPrompt(promptData);
          break;
        default:
          prompt = buildSectionRegenPrompt(key, promptData);
      }

      // The skillDiagnosis prompt now also emits classSummary/priorityDiagnosis/nextClassFocus/
      // targetScoreRelevance/profileUpdateSuggestions, and regen of any of those runs that full
      // prompt (default case → buildSectionRegenPrompt → buildSkillDiagnosisPrompt), so they
      // need the larger budget too.
      const SECTION_BUDGETS = { studentFeedback: 3000, homeworkRecommendation: 3000, skillDiagnosis: 6000, priorityDiagnosis: 6000, classSummary: 6000, targetScoreRelevance: 6000, nextClassFocus: 6000, profileUpdateSuggestions: 6000, errorBankSuggestions: 2200 };
      const data = await callAI(prompt, { max_tokens: SECTION_BUDGETS[key] || 2000, preferredProvider: 'gemini' });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = parseAiJson(raw);
      const content = parsed[key] ?? parsed;
      setSections(s => ({ ...s, [key]: { ...s[key], content, approved: false } }));
      window.toast?.('Section regenerated.', 'ok');
    } catch (e) {
      window.toast?.(`Regeneration failed: ${e.message}`, 'warn');
    }
    setRegenerating(null);
  }

  function approveAll() {
    setSections(s => {
      const next = { ...s };
      Object.keys(next).forEach(k => { next[k] = { ...next[k], approved: true }; });
      return next;
    });
  }

  const approvedCount = Object.values(sections).filter(s => s.approved).length;
  const totalSections = SECTION_KEYS.length;
  const missingRequiredApprovals = REQUIRED_APPROVAL_KEYS.filter(key => {
    const section = sections[key];
    return !section?.approved || section.hidden;
  });
  const canApproveDiagnosis = missingRequiredApprovals.length === 0;

  // ── Save diagnosis ──
  async function handleSave(approve = false) {
    setSaving(true);
    try {
      if (approve && !canApproveDiagnosis) {
        const missing = missingRequiredApprovals.map(key => SECTION_LABELS[key]).join(', ');
        window.toast?.(`Approve required sections first: ${missing}`, 'warn');
        setSaving(false);
        return;
      }
      const studentFeedbackSection = sections.studentFeedback;
      const homeworkSection = sections.homeworkRecommendation;
      const visibleStudentFeedback = studentFeedbackSection?.approved && !studentFeedbackSection.hidden
        ? studentFeedbackSection.content
        : null;
      const visibleHomework = homeworkSection?.approved && !homeworkSection.hidden
        ? homeworkSection.content
        : null;
      const dx = await saveDiagnosis({
        id: savedDiagnosis?.id,
        studentId: selectedStudentId || studentId,
        classEventId: selectedClassEventId || classEventId,
        targetProfileId: targetProfile?.id,
        evaluatedSkills: Object.fromEntries(evaluatedSkills.map(k => [k, true])),
        evidenceCounts: {
          speaking: normalizedEvidence?.speakingEvidenceCount || 0,
          writing: normalizedEvidence?.writingEvidenceCount || 0,
          reading: normalizedEvidence?.readingEvidenceCount || 0,
          listening: normalizedEvidence?.listeningEvidenceCount || 0,
          grammar: normalizedEvidence?.grammarEvidenceCount || 0,
          vocabulary: normalizedEvidence?.vocabularyEvidenceCount || 0,
          testStrategy: normalizedEvidence?.testStrategyEvidenceCount || 0,
        },
        sections,
        aiRaw: aiResult,
        status: approve ? 'approved' : 'draft',
        teacherApproved: approve,
        cycleStage: approve ? 'diagnosed' : 'needs-diagnosis',
        // Legacy compat fields
        classSummary: typeof sections.classSummary?.content === 'string' ? sections.classSummary.content : '',
        content: {
          overall_result: typeof sections.classSummary?.content === 'string' ? sections.classSummary.content : '',
          priorities: sections.priorityDiagnosis?.content || [],
          student_friendly_feedback: visibleStudentFeedback,
          homework: visibleHomework?.instructions || '',
          homework_directions: visibleHomework,
          error_bank: sections.errorBankSuggestions?.content || [],
          section_snapshot: buildSnapshot(sections.skillDiagnosis?.content),
        },
      });
      setSavedDiagnosis(dx);
      // Update class event diagnostic status
      if (selectedClassEventId || classEventId) {
        await updateClassEventStatus(selectedClassEventId || classEventId, { diagnosticStatus: approve ? 'approved' : 'draft' });
      }
      window.toast?.(approve ? 'Diagnosis approved and saved!' : 'Draft saved.', 'ok');
      if (approve) setStep('saved');
    } catch (e) {
      window.toast?.(`Save failed: ${e.message}`, 'warn');
    }
    setSaving(false);
  }

  // ── Post-approval actions ──
  async function saveErrorsToBank() {
    const errors = sections.errorBankSuggestions?.content;
    if (!Array.isArray(errors)) { window.toast?.('No errors to save.', 'warn'); return; }
    let saved = 0;
    for (let i = 0; i < errors.length; i++) {
      const err = errors[i];
      if (err.saveToProfile !== false) {
        await promoteErrorToLongTerm(savedDiagnosis.id, i, selectedStudentId || studentId);
        saved++;
      }
    }
    window.toast?.(`${saved} error${saved !== 1 ? 's' : ''} saved to error bank.`, 'ok');
  }

  async function saveVocabToBank() {
    const vocabTargets = sections.vocabGrammarTargets?.content?.vocabularyTargets;
    if (!Array.isArray(vocabTargets)) { window.toast?.('No vocabulary to save.', 'warn'); return; }
    for (const v of vocabTargets) {
      await saveVocabularyEntry({
        studentId: selectedStudentId || studentId,
        wordOrPhrase: v.wordOrPhrase || v.word,
        category: v.category || 'general',
        meaning: v.meaning || '',
        exampleSentence: v.exampleSentence || '',
        evidenceSource: { diagnosisId: savedDiagnosis?.id },
      });
    }
    window.toast?.(`${vocabTargets.length} words saved to vocabulary bank.`, 'ok');
  }

  async function saveProgressNoteFromDx() {
    const note = sections.profileUpdateSuggestions?.content?.progressNote;
    if (!note) { window.toast?.('No progress note in diagnosis.', 'warn'); return; }
    await saveProgressNote({ studentId: selectedStudentId || studentId, sourceType: 'diagnosis', sourceId: savedDiagnosis?.id, note });
    window.toast?.('Progress note saved.', 'ok');
  }

  // ── Target profile selection ──
  async function selectPreset(key) {
    const preset = TARGET_PROFILE_PRESETS[key];
    const sid = selectedStudentId || studentId;
    let existing = profiles.find(p => p.profileName === preset.profileName);
    if (!existing) {
      existing = await saveTargetProfile({ ...preset, studentId: sid, isActive: true });
    }
    await setActiveTargetProfile(sid, existing.id);
    const updated = await getTargetProfiles(sid);
    setProfiles(updated);
    setTargetProfile(updated.find(p => p.id === existing.id) || existing);
    window.toast?.(`Target profile set: ${preset.label}`, 'ok');
  }

  // ── Render ──
  if (step === 'generating') {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-deep)', marginBottom: 12 }}>Running Diagnosis…</div>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{generatingStatus}</p>
        <div style={{ height: 4, background: 'var(--bg-deep)', borderRadius: 99, overflow: 'hidden' }}>
          <div role="progressbar" aria-label="Generating diagnosis" aria-valuemin={0} aria-valuemax={100} style={{ height: '100%', background: 'var(--accent)', borderRadius: 99, animation: 'slideIn 2s ease-in-out infinite alternate' }} />
        </div>
        <style>{`@keyframes slideIn { from { width: 20%; margin-left: 0; } to { width: 60%; margin-left: 40%; } }`}</style>
      </div>
    );
  }

  if (step === 'saved') {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>Diagnosis Approved</div>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>The diagnosis for {selectedStudent?.name} has been saved and approved.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => onNavigate('homework:create', { diagnosisId: savedDiagnosis?.id, studentId: selectedStudentId || studentId })}>
            <Icon.homework size={14} /> Generate Homework
          </Button>
          <Button variant="ghost" onClick={saveErrorsToBank}><Icon.warning size={14} /> Save Errors to Bank</Button>
          <Button variant="ghost" onClick={saveVocabToBank}><Icon.doc size={14} /> Save Vocabulary</Button>
          <Button variant="ghost" onClick={saveProgressNoteFromDx}><Icon.edit size={14} /> Save Progress Note</Button>
          <Button variant="ghost" onClick={() => onNavigate('students:profile', { studentId: selectedStudentId || studentId })}>View Student Profile</Button>
          <Button variant="ghost" onClick={() => onNavigate('diagnostics')}>All Diagnostics</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
      <button onClick={() => onNavigate('diagnostics')} style={backStyle}>
        <Icon.arrowL size={13} /> Back to diagnostics
      </button>

      <h1 style={S.headline}>{step === 'review' ? 'Review Diagnosis' : 'New Diagnosis'}</h1>
      {selectedStudent && <p style={S.sub}>{selectedStudent.name} · {selectedStudent.currentLevel} → {selectedStudent.targetLevel}</p>}

      {/* ── STEP: PREREQ ── */}
      {step === 'prereq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>

          {/* Student selector */}
          <Card style={{ padding: 18 }}>
            <SectionHeader title="1. Student" icon={<PrereqIcon ok={!!selectedStudent} />} />
            <select className="input" style={{ marginTop: 10, maxWidth: 320 }} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
              <option value="">Select student…</option>
              {allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Card>

          {/* Target profile */}
          <Card style={{ padding: 18, border: !targetProfile ? '2px solid var(--danger)' : undefined }}>
            <SectionHeader title="2. Target Score Profile" icon={<PrereqIcon ok={!!targetProfile} required />} />
            {!targetProfile && <p style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', margin: '6px 0' }}>⚠ Required — select a target before running diagnosis.</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {Object.entries(TARGET_PROFILE_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => selectPreset(key)}
                  aria-pressed={targetProfile?.profileName === preset.profileName}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `2px solid ${targetProfile?.profileName === preset.profileName ? 'var(--accent)' : 'var(--border)'}`, background: targetProfile?.profileName === preset.profileName ? 'var(--accent-subtle)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {preset.label}
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 400 }}>Overall {preset.overallTarget} · Speaking {preset.speakingTarget}</div>
                </button>
              ))}
            </div>
            {targetProfile && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', marginTop: 8 }}>
                ✓ Active: {targetProfile.label} — Overall {targetProfile.overallTarget}, Speaking {targetProfile.speakingTarget}
              </p>
            )}
          </Card>

          {/* Class & evidence */}
          <Card style={{ padding: 18 }}>
            <SectionHeader title="3. Class Evidence" icon={<PrereqIcon ok={inlineReady} required />} />

            {/* If class event is linked, show its evidence summary */}
            {classEvent && (
              <div style={{ marginTop: 8, padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)' }}>
                <strong>{classEvent.title}</strong> · {classEvent.date} · {classEvent.classFocus || 'No focus set'}
              </div>
            )}

            {/* If evidence from class record exists, show summary */}
            {classEvidence && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 8 }}>Evaluated skills from class record:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SKILL_KEYS.map(({ key, evalKey, countKey }) => {
                    const evaluated = classEvidence[evalKey];
                    const count = countKey ? classEvidence[countKey] : null;
                    return (
                      <Pill key={key} tone={evaluated ? (count === 0 ? 'warning' : 'success') : 'muted'}>
                        {key}{evaluated && count !== null ? ` (${count})` : ''}
                        {evaluated && count === 0 ? ' ⚠' : ''}
                      </Pill>
                    );
                  })}
                </div>
                {classEventId && <Button variant="ghost" size="sm" style={{ marginTop: 10 }} onClick={() => onNavigate('calendar:class', { classEventId })}>Edit Class Record</Button>}
              </div>
            )}

            {/* No linked class — show inline input form */}
            {noLinkedEvidence && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 12 }}>
                  No class linked. Paste your transcript and select which skills were covered — the AI will only diagnose what you evaluated.
                </p>

                {/* Transcript */}
                <label style={labelStyle}>Class transcript / student answers *</label>
                <textarea
                  className="input"
                  rows={8}
                  value={inlineTranscript}
                  onChange={e => setInlineTranscript(e.target.value)}
                  placeholder="Paste the student's exact words, speaking answer, writing sample, or transcript here. Quote errors directly — this is what the AI will analyze..."
                  style={{ marginBottom: 12 }}
                />

                {/* Teacher notes */}
                <label style={labelStyle}>Teacher notes (optional)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={inlineTeacherNotes}
                  onChange={e => setInlineTeacherNotes(e.target.value)}
                  placeholder="Observations, main difficulty, student mood..."
                  style={{ marginBottom: 14 }}
                />

                {/* Skills evaluated */}
                <label style={{ ...labelStyle, marginBottom: 8 }}>Skills evaluated in this class *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                  {SKILL_KEYS.map(({ key, evalKey, countKey }) => {
                    const evaluated = inlineSkills[evalKey];
                    return (
                      <div
                        key={key}
                        style={{ padding: 10, borderRadius: 'var(--radius-sm)', border: `2px solid ${evaluated ? 'var(--accent)' : 'var(--border)'}`, background: evaluated ? 'var(--accent-subtle)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => setInlineSkills(s => {
                          const newVal = !s[evalKey];
                          return {
                            ...s,
                            [evalKey]: newVal,
                            ...(countKey ? { [countKey]: newVal ? Math.max(1, Number(s[countKey] || 0)) : 0 } : {}),
                          };
                        })}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${evaluated ? 'var(--accent)' : 'var(--border)'}`, background: evaluated ? 'var(--accent)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            {evaluated && <Icon.check size={10} color="#fff" />}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: evaluated ? 'var(--accent-deep)' : 'var(--text)' }}>{key}</span>
                        </div>
                        {evaluated && countKey && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>Turns:</span>
                            <input type="number" min={1} max={30} value={inlineSkills[countKey]}
                              onChange={e => setInlineSkills(s => ({ ...s, [countKey]: Math.max(1, Number(e.target.value) || 1) }))}
                              style={{ width: 48, padding: '2px 4px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, textAlign: 'center' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {evaluatedSkills.length === 0 && (
                  <p style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: 8 }}>⚠ Select at least one skill that was covered in class.</p>
                )}
                {!inlineTranscript.trim() && !inlineTeacherNotes.trim() && evaluatedSkills.length > 0 && (
                  <p style={{ color: 'var(--warning)', fontSize: 'var(--text-xs)', marginTop: 8 }}>⚠ Paste a transcript or add teacher notes — the AI needs evidence to diagnose.</p>
                )}
              </div>
            )}
          </Card>

          {error && (
            <div style={{ padding: 14, background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>
              {error}
            </div>
          )}

          {/* Run button */}
          <div>
            <Button variant="primary" style={{ fontSize: 'var(--text-md)', padding: '12px 24px' }} onClick={handleGenerate} disabled={!prereqOk}>
              <Icon.diagnose size={16} /> Run AI Diagnosis
            </Button>
            {!prereqOk && (
              <p style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', marginTop: 8 }}>
                {!selectedStudent ? '• Select a student' : ''}
                {!targetProfile ? ' • Select a target score profile' : ''}
                {evaluatedSkills.length === 0 ? ' • At least one skill must be evaluated' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: REVIEW ── */}
      {step === 'review' && (
        <div style={{ marginTop: 20 }}>
          {/* Approval status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{approvedCount} of {totalSections} sections approved</div>
              {missingRequiredApprovals.length > 0 && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 4 }}>
                  Required before final approval: {missingRequiredApprovals.map(key => SECTION_LABELS[key]).join(', ')}
                </div>
              )}
              <div style={{ height: 6, background: 'var(--bg-deep)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: approvedCount === totalSections ? 'var(--success)' : 'var(--accent)', borderRadius: 99, transform: `scaleX(${approvedCount / totalSections})`, transformOrigin: 'left', transition: 'transform 0.3s' }} />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={approveAll}>Approve All</Button>
            <Button variant="ghost" size="sm" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
            <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !canApproveDiagnosis}>
              <Icon.check size={14} /> Approve & Save
            </Button>
          </div>

          {/* Empty draft — no generated content */}
          {!SECTION_KEYS.some(({ key }) => sections[key]) && (
            <Card style={{ padding: 28, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', marginBottom: 14 }}>
                This diagnosis has no generated content — it was saved before the AI analysis completed.
              </p>
              <Button variant="primary" size="sm" onClick={() => onNavigate('diagnostics:create', { studentId: savedDiagnosis?.studentId || selectedStudentId || studentId })}>
                <Icon.diagnose size={13} /> Start a new diagnosis
              </Button>
            </Card>
          )}

          {/* Sections — grouped into Teacher Analysis + Student-Facing zones */}
          {(() => {
            // One section's header + body. `embedded` = rendered inside a merged
            // card (no outer Card chrome); otherwise gets its own card.
            const renderSection = (key, studentFacing, embedded) => {
              const sec = sections[key];
              if (!sec) return null;
              const label = SECTION_LABELS[key] || key;
              const isEditing = editingSection === key;
              const isRegenning = regenerating === key;

              const header = (
                <div style={{ padding: '12px 16px', background: sec.approved ? 'var(--success-bg)' : (studentFacing ? 'var(--accent-soft)' : 'var(--bg)'), display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', flex: 1 }}>{label}</span>
                  {studentFacing && <Pill tone="info">Student-facing</Pill>}
                  {sec.edited && <Pill tone="warning">Edited</Pill>}
                  {sec.hidden && <Pill tone="muted">Hidden</Pill>}
                  {sec.approved && <Pill tone="success">✓ Approved</Pill>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(key)} disabled={isRegenning}><Icon.edit size={12} /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => regenerateSection(key)} disabled={isRegenning}><Icon.refresh size={12} /> {isRegenning ? '…' : 'Regen'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleHide(key)} style={{ color: sec.hidden ? 'var(--muted)' : 'var(--text)' }}><Icon.eye size={12} /></Button>
                    <Button variant={sec.approved ? 'ghost' : 'primary'} size="sm" onClick={() => toggleApprove(key)} style={sec.approved ? { color: 'var(--danger)' } : {}}>
                      {sec.approved ? '✕ Unapprove' : '✓ Approve'}
                    </Button>
                  </div>
                </div>
              );

              const body = (
                <div style={{ padding: 16 }}>
                  {isEditing ? (
                    <div>
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={10} style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <Button variant="primary" size="sm" onClick={() => saveEdit(key)}>Save Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <SectionContent sectionKey={key} content={sec.content} />
                  )}
                </div>
              );

              if (embedded) {
                return <div key={key} style={{ borderTop: '1px solid var(--divider)' }}>{header}{body}</div>;
              }
              return (
                <Card key={key} style={{ padding: 0, overflow: 'hidden', border: sec.approved ? '2px solid var(--success)' : (studentFacing ? '2px solid var(--accent)' : '1px solid var(--border)') }}>
                  {header}{body}
                </Card>
              );
            };

            const zoneHeaderStyle = {
              fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--muted)', margin: '4px 2px 0',
            };

            return SECTION_GROUPS.map(zone => {
              const groups = zone.groups.filter(g => g.keys.some(k => sections[k]));
              if (!groups.length) return null;
              return (
                <div key={zone.zone} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: zone.zone === 'student' ? 8 : 0 }}>
                  <div>
                    <div style={{ ...zoneHeaderStyle, color: zone.studentFacing ? 'var(--accent-text)' : 'var(--muted)' }}>{zone.title}</div>
                    {zone.caption && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '2px 2px 0' }}>{zone.caption}</div>}
                  </div>
                  {groups.map(group => {
                    const keys = group.keys.filter(k => sections[k]);
                    if (keys.length === 1) return renderSection(keys[0], zone.studentFacing, false);
                    // Merged card: one outer card, members stacked inside.
                    return (
                      <Card key={group.title} style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ padding: '10px 16px', background: 'var(--surface)', fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{group.title}</div>
                        {keys.map(k => renderSection(k, zone.studentFacing, true))}
                      </Card>
                    );
                  })}
                </div>
              );
            });
          })()}

          {/* Bottom actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
            <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !canApproveDiagnosis}>
              <Icon.check size={14} /> Approve & Save ({approvedCount}/{totalSections})
            </Button>
            {savedDiagnosis && <Button variant="ghost" size="sm" onClick={() => setStep('saved')}>Post-approval actions</Button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section content renderer ── */
function EmptySectionNote({ message }) {
  return (
    <div style={{ padding: 14, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon.refresh size={14} color="var(--warning)" />
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)' }}>{message}</span>
    </div>
  );
}

function KeyValueCards({ content }) {
  if (!content || typeof content !== 'object') return null;
  const entries = Array.isArray(content) ? content.map((v, i) => [`${i + 1}`, v]) : Object.entries(content);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(String(k))}</div>
          <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: Array.isArray(v) && v.length === 0 ? 'var(--muted)' : 'inherit', fontStyle: Array.isArray(v) && v.length === 0 ? 'italic' : 'normal' }}>
            {typeof v === 'object' ? (Array.isArray(v) ? (v.length === 0 ? 'None identified' : v.map((item, j) => <div key={j}>• {typeof item === 'object' ? Object.values(item).join(' — ') : String(item)}</div>)) : Object.entries(v).map(([sk, sv]) => `${camelToLabel(sk)}: ${sv}`).join(' · ')) : String(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionContent({ sectionKey, content }) {
  if (!content) return <EmptySectionNote message="Not generated — click Regen to retry this section." />;

  if (typeof content === 'object' && !Array.isArray(content) && Object.keys(content).length === 0) {
    return <EmptySectionNote message="Not generated — click Regen to retry this section." />;
  }

  if (typeof content === 'string' && content.trim() === '') {
    return <EmptySectionNote message="Not generated — click Regen to retry this section." />;
  }

  if (sectionKey === 'classSummary') {
    return <p style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{String(content)}</p>;
  }

  if (sectionKey === 'studentFeedback' && typeof content === 'object') {
    return <StudentFeedbackView feedback={content} />;
  }

  if (sectionKey === 'errorBankSuggestions' && Array.isArray(content)) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Error', 'Correct', 'Category', 'Priority', 'Save?'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {content.map((err, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '6px 8px', color: 'var(--danger)', fontWeight: 600 }}>{err.error}</td>
                <td style={{ padding: '6px 8px', color: 'var(--success)', fontWeight: 600 }}>{err.correct}</td>
                <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{err.category}</td>
                <td style={{ padding: '6px 8px' }}><Pill tone={err.priority === 'high' ? 'danger' : err.priority === 'medium' ? 'warning' : 'muted'}>{err.priority}</Pill></td>
                <td style={{ padding: '6px 8px' }}>{err.saveToProfile !== false ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sectionKey === 'priorityDiagnosis' && Array.isArray(content)) {
    if (content.length === 0) {
      return <EmptySectionNote message="No priority items were generated — click Regen to retry this section." />;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {content.map((p, i) => (
          <div key={i} style={{ padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Pill tone={p.urgency === 'Critical' ? 'danger' : p.urgency === 'Developing' ? 'warning' : 'info'}>{p.urgency}</Pill>
              <strong style={{ fontSize: 'var(--text-sm)' }}>{p.area}</strong>
            </div>
            {p.evidence && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 4 }}>Evidence: {p.evidence}</div>}
            <div style={{ fontSize: 'var(--text-sm)' }}>{p.whatToImprove}</div>
            {p.howToImprove && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginTop: 4 }}>How: {p.howToImprove}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'skillDiagnosis' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(content).map(([skill, data]) => (
          <div key={skill} style={{ padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: 'var(--text-sm)' }}>{skill}</span>
              {data?.evaluated === false ? (
                <Pill tone="muted">Not evaluated</Pill>
              ) : (
                <>
                  {data?.score0to80 != null && <Pill tone={data.score0to80 >= 55 ? 'success' : data.score0to80 >= 40 ? 'warning' : 'danger'}>{data.score0to80}/80</Pill>}
                  {data?.scoreConfidenceLevel && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{data.scoreConfidenceLevel}</span>}
                </>
              )}
            </div>
            {data?.evaluated === false ? (
              <p style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', fontStyle: 'italic', margin: 0 }}>{data.diagnosis || 'Not evaluated — no evidence.'}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data?.strengths?.length > 0 && data.strengths.map((s, j) => (
                  <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>✓ {s}</div>
                ))}
                {data?.weaknesses?.length > 0 && data.weaknesses.map((w, j) => (
                  <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>✗ {w}</div>
                ))}
                {data?.mainIssues?.length > 0 && data.mainIssues.map((iss, j) => (
                  <div key={j} style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>✗ {iss}</div>
                ))}
                {data?.whatToImproveNext && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', marginTop: 2 }}>Next: {data.whatToImproveNext}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'homeworkRecommendation' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', marginBottom: 4 }}>{content.title}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)' }}>{content.objective}</div>
        </div>
        {content.instructions && (
          <div style={{ padding: 12, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{content.instructions}</div>
        )}
        {Array.isArray(content.tasks) && content.tasks.map((t, i) => (
          <div key={i} style={{ padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)' }}>Task {t.taskNumber || i + 1}</span>
              {t.type && <Pill tone="accent">{t.type}</Pill>}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 6 }}>{typeof t === 'string' ? t : t.description}</div>
            {t.content && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 6 }}>{t.content}</div>}
            {t.example && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>Example: {t.example}</div>}
          </div>
        ))}
        {content.teacherNotes && (
          <div style={{ padding: 10, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
            <strong>Teacher notes:</strong> {content.teacherNotes}
          </div>
        )}
      </div>
    );
  }

  if (sectionKey === 'nextClassFocus' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(k)}</div>
            <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>{String(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'profileUpdateSuggestions' && typeof content === 'object' && !Array.isArray(content)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>{camelToLabel(k)}</div>
            {Array.isArray(v) ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                {v.map((item, j) => <li key={j}>{String(item)}</li>)}
              </ul>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{String(v)}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (sectionKey === 'vocabGrammarTargets' && typeof content === 'object') {
    const vocab = Array.isArray(content.vocabularyTargets) ? content.vocabularyTargets : [];
    const grammar = Array.isArray(content.grammarTargets) ? content.grammarTargets : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {vocab.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Vocabulary Targets</div>
            {vocab.map((v, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 'var(--text-sm)' }}>{v.wordOrPhrase}</strong>
                  {v.category && <Pill tone="muted">{v.category}</Pill>}
                </div>
                {v.meaning && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginBottom: 2 }}>{v.meaning}</div>}
                {v.exampleSentence && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>"{v.exampleSentence}"</div>}
              </div>
            ))}
          </div>
        )}
        {grammar.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: 8 }}>Grammar Targets</div>
            {grammar.map((g, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                <strong style={{ fontSize: 'var(--text-sm)' }}>{g.area}</strong>
                {g.issue && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 4 }}>{g.issue}</div>}
                {g.correction && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', marginTop: 2 }}>{g.correction}</div>}
                {g.practiceDirection && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>Practice: {g.practiceDirection}</div>}
              </div>
            ))}
          </div>
        )}
        {vocab.length === 0 && grammar.length === 0 && (
          <EmptySectionNote message="No vocabulary or grammar targets were generated — click Regen to retry this section." />
        )}
      </div>
    );
  }

  if (sectionKey === 'readinessCheck' && typeof content === 'object') {
    const fmt = (v) => {
      if (v === true) return '✓ Yes';
      if (v === false) return '✗ No';
      return String(v);
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(content).map(([k, v]) => {
          if (Array.isArray(v) && v.length === 0) return null;
          return (
            <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(k)}</div>
              <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>
                {Array.isArray(v)
                  ? v.map((item, j) => <div key={j}>• {camelToLabel(String(item))}</div>)
                  : fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (sectionKey === 'targetScoreRelevance' && typeof content === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(content).map(([k, v]) => (
          <div key={k} style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{camelToLabel(k)}</div>
            <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text)' }}>
              {Array.isArray(v) ? v.map((item, j) => <div key={j}>• {typeof item === 'object' ? JSON.stringify(item) : String(item)}</div>) : String(v)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof content === 'object') {
    return <KeyValueCards content={content} />;
  }

  return <p style={{ lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>{String(content)}</p>;
}

function PrereqIcon({ ok, required }) {
  return (
    <span style={{ width: 20, height: 20, borderRadius: '50%', background: ok ? 'var(--success)' : required ? 'var(--danger)' : 'var(--muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {ok ? <Icon.check size={11} color="#fff" /> : <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{required ? '!' : '?'}</span>}
    </span>
  );
}

function camelToLabel(str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

// True when an AI section came back missing or with no usable content.
function isSectionEmpty(content) {
  if (content == null) return true;
  if (typeof content === 'string') return content.trim().length === 0;
  if (Array.isArray(content)) return content.length === 0;
  if (typeof content === 'object') {
    const vals = Object.values(content);
    if (vals.length === 0) return true;
    // Object of arrays (e.g. vocabGrammarTargets): empty if every array is empty.
    if (vals.every(v => Array.isArray(v))) return vals.every(v => v.length === 0);
  }
  return false;
}

function tryParseOrString(text) {
  try { return JSON.parse(text); } catch { return text; }
}

function normalizeEvidenceCounts(evidence) {
  if (!evidence || typeof evidence !== 'object') return evidence;
  const next = { ...evidence };
  SKILL_KEYS.forEach(({ evalKey, countKey }) => {
    if (!countKey) return;
    if (next[evalKey]) next[countKey] = Math.max(1, Number(next[countKey] || 0));
    else next[countKey] = 0;
  });
  return next;
}

function buildSnapshot(skillDiagnosis) {
  if (!skillDiagnosis || typeof skillDiagnosis !== 'object') return [];
  return Object.entries(skillDiagnosis).map(([skill, data]) => ({
    section: skill.charAt(0).toUpperCase() + skill.slice(1),
    score_0_80: data?.score0to80 ?? 0,
    score_0_4: data?.score0to80 ? Math.round((data.score0to80 / 80) * 4 * 100) / 100 : 0,
    confidence: data?.scoreProvisional ? 'low' : 'medium',
    trend: 'stable',
    strength: data?.strengths?.[0] || '',
    gap: data?.weaknesses?.[0] || '',
    next_step: data?.whatToImproveNext || '',
  }));
}

const SKILL_KEYS = [
  { key: 'Speaking',     evalKey: 'evaluatedSpeaking',     countKey: 'speakingEvidenceCount' },
  { key: 'Writing',      evalKey: 'evaluatedWriting',      countKey: 'writingEvidenceCount' },
  { key: 'Reading',      evalKey: 'evaluatedReading',      countKey: 'readingEvidenceCount' },
  { key: 'Listening',    evalKey: 'evaluatedListening',    countKey: 'listeningEvidenceCount' },
  { key: 'Grammar',      evalKey: 'evaluatedGrammar',      countKey: 'grammarEvidenceCount' },
  { key: 'Vocabulary',   evalKey: 'evaluatedVocabulary',   countKey: 'vocabularyEvidenceCount' },
  { key: 'Test Strategy',evalKey: 'evaluatedTestStrategy', countKey: 'testStrategyEvidenceCount' },
];

const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const S = {
  headline: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '0 0 0' },
};
