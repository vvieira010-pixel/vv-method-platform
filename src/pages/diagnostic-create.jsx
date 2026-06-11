/**
 * diagnostic-create.jsx — Multi-step diagnosis: prereqs → AI → preview/approve → save
 *
 * The most important page. Teacher must:
 * 1. Select target score profile (blocker)
 * 2. Confirm evaluated skills (blocker)
 * 3. Run AI diagnosis
 * 4. Preview and approve each section
 * 5. Save approved diagnosis
 *
 * Business logic lives in src/domain/assessment/:
 *   constants.js, diagnosis-utils.js, hooks/useSectionApproval.js, components/SectionContent.jsx
 */
import { useState, useEffect } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, Avatar } from '../components/shared.jsx';
import { callAI } from '../components/shared.jsx';
import { parseAiJson } from '../lib/ai-helpers.js';
import {
  buildSkillDiagnosisPrompt,
  buildCompactSkillDiagnosisPrompt,
  buildStudentFeedbackPrompt,
  buildHomeworkPrompt,
  buildErrorBankPrompt,
  buildSectionRegenPrompt,
} from '../lib/prompts.js';
import { TARGET_PROFILE_PRESETS } from '../lib/workflow.js';
import { STUDENT_ERROR_PROFILES, buildErrorProfileContext } from '../lib/error-bank-profiles.js';
import {
  getStudent, getStudents,
  getTargetProfiles, saveTargetProfile, setActiveTargetProfile,
  getClassEvent, getClassEvidence,
  getDiagnosis, saveDiagnosis, updateClassEventStatus,
  promoteErrorToLongTerm, saveVocabularyEntry, saveProgressNote,
} from '../lib/workflow.js';

import {
  SECTION_KEYS, REQUIRED_APPROVAL_KEYS, SECTION_LABELS,
  DIAGNOSIS_DERIVED_KEYS, SECTION_GROUPS, SKILL_KEYS,
} from '../domain/assessment/constants.js';
import {
  friendlyAiError, aiText,
  generateDiagnosisJson, normalizeDiagnosisJson,
  normalizeErrorTargets, normalizeEvidenceCounts, buildSnapshot,
} from '../domain/assessment/diagnosis-utils.js';
import { useSectionApproval } from '../domain/assessment/hooks/useSectionApproval.js';
import { SectionContent, PrereqIcon, camelToLabel } from '../domain/assessment/components/SectionContent.jsx';

const labelStyle = { display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };

export default function DiagnosticCreate({ studentId, classEventId, diagnosisId, students, onNavigate }) {
  const [step, setStep] = useState('prereq'); // prereq | generating | review | saved
  const [student, setStudent] = useState(null);
  const [classEvent, setClassEvent] = useState(null);
  const [classEvidence, setClassEvidence] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [savedDiagnosis, setSavedDiagnosis] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('Initializing...');

  // Student selector (if no studentId passed)
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [selectedClassEventId, setSelectedClassEventId] = useState(classEventId || '');
  const [allStudents, setAllStudents] = useState([]);

  // Section approval state (extracted to domain hook)
  const {
    sections, setSections,
    editingSection, setEditingSection,
    editText, setEditText,
    regenerating, setRegenerating,
    startEdit, saveEdit,
    toggleApprove, toggleHide, approveAll,
    approvedCount, totalSections,
    missingRequiredApprovals, canApproveDiagnosis,
  } = useSectionApproval();

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
    if (!diagnosisId) setSavedDiagnosis(null);

    try {
      const promptData = { student: selectedStudent, classEvent, classEvidence: normalizedEvidence, targetProfile };
      const getContent = (res) => (res?.content?.map(b => b.text || '').join('') || '');

      setGeneratingStatus('Step 1/4 — Generating skill diagnosis…');
      const diagnosisResult = await generateDiagnosisJson(promptData, (status) => setGeneratingStatus(status));
      const diagnosisRaw = diagnosisResult.raw;
      const parsedDiagnosis = diagnosisResult.parsed;

      setGeneratingStatus('Step 2/4 — Analysing errors and vocabulary targets…');
      const errorBankRaw = await callAI(buildErrorBankPrompt({ ...promptData, diagnosis: parsedDiagnosis }), { max_tokens: 2500, preferredProvider: 'gemini' }).catch(() => null);
      const parsedErrorBank = normalizeErrorTargets(errorBankRaw ? parseAiJson(getContent(errorBankRaw)) : {});

      setGeneratingStatus('Step 3/4 — Writing student feedback…');
      const feedbackRaw = await callAI(buildStudentFeedbackPrompt({ ...promptData, diagnosis: parsedDiagnosis }), { max_tokens: 2500, preferredProvider: 'gemini' }).catch(() => null);
      const parsedFeedback = feedbackRaw ? parseAiJson(getContent(feedbackRaw)) : {};

      setGeneratingStatus('Step 4/4 — Building homework recommendation…');
      const homeworkRaw = await callAI(buildHomeworkPrompt({
        ...promptData,
        diagnosis: parsedDiagnosis,
        errorBank: parsedErrorBank.errorBankSuggestions,
        vocabTargets: parsedErrorBank.vocabGrammarTargets,
      }), { max_tokens: 3000, preferredProvider: 'gemini' }).catch(() => null);
      const parsedHomework = homeworkRaw ? parseAiJson(getContent(homeworkRaw)) : {};

      setGeneratingStatus('Structuring results…');

      const FAILED = { content: 'Failed to generate — click Regen to retry.', approved: false, hidden: false, edited: false };
      const initSections = {
        skillDiagnosis:           diagnosisRaw ? { content: parsedDiagnosis.skillDiagnosis ?? null,                                              approved: false, hidden: false, edited: false } : FAILED,
        studentFeedback:          feedbackRaw  ? { content: parsedFeedback,                                                                      approved: false, hidden: false, edited: false } : FAILED,
        homeworkRecommendation:   homeworkRaw  ? { content: parsedHomework,                                                                      approved: false, hidden: false, edited: false } : FAILED,
        errorBankSuggestions:                  { content: parsedErrorBank.errorBankSuggestions ?? [],                                            approved: false, hidden: false, edited: false },
        vocabGrammarTargets:                   { content: parsedErrorBank.vocabGrammarTargets ?? { vocabularyTargets: [], grammarTargets: [] },   approved: false, hidden: false, edited: false },
        readinessCheck:                        { content: { targetProfileSelected: !!targetProfile, evaluatedSkills, notEvaluatedSkills: [], diagnosisAllowed: true }, approved: true, hidden: false, edited: false },
        classSummary:                          { content: parsedDiagnosis.classSummary || '',                                                    approved: false, hidden: false, edited: false },
        targetScoreRelevance:                  { content: parsedDiagnosis.targetScoreRelevance || {},                                            approved: false, hidden: false, edited: false },
        estimatedOverallScore:                 { content: parsedDiagnosis.estimatedOverallScore || {},                                           approved: false, hidden: false, edited: false },
        priorityDiagnosis:                     { content: parsedDiagnosis.priorityDiagnosis || [],                                               approved: false, hidden: false, edited: false },
        nextClassFocus:                        { content: parsedDiagnosis.nextClassFocus || {},                                                  approved: false, hidden: false, edited: false },
        profileUpdateSuggestions:              { content: parsedDiagnosis.profileUpdateSuggestions || {},                                        approved: false, hidden: false, edited: false },
      };

      setAiResult(parsedDiagnosis);
      setSections(initSections);

      // Auto-save draft immediately
      try {
        const draft = await saveDiagnosis({
          id: diagnosisId ? savedDiagnosis?.id : undefined,
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
            error_bank: parsedErrorBank.errorBankSuggestions || [],
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

  // ── Regenerate individual section ──
  async function regenerateSection(key) {
    setRegenerating(key);
    try {
      const existingSections = Object.fromEntries(Object.entries(sections).filter(([k]) => k !== key));
      let prompt;
      const promptData = { student: selectedStudent, classEvent, classEvidence: normalizedEvidence, targetProfile, existingSections };

      switch (key) {
        case 'skillDiagnosis':       prompt = buildSkillDiagnosisPrompt(promptData);    break;
        case 'studentFeedback':      prompt = buildStudentFeedbackPrompt(promptData);   break;
        case 'homeworkRecommendation': prompt = buildHomeworkPrompt(promptData);        break;
        case 'errorBankSuggestions':
        case 'vocabGrammarTargets':  prompt = buildErrorBankPrompt(promptData);         break;
        default:
          prompt = DIAGNOSIS_DERIVED_KEYS.has(key)
            ? buildCompactSkillDiagnosisPrompt(promptData)
            : buildSectionRegenPrompt(key, promptData);
      }

      const SECTION_BUDGETS = {
        studentFeedback: 3000, homeworkRecommendation: 3000, skillDiagnosis: 6000,
        priorityDiagnosis: 6000, classSummary: 6000, targetScoreRelevance: 6000,
        nextClassFocus: 6000, profileUpdateSuggestions: 6000, errorBankSuggestions: 2200,
      };
      const data = await callAI(prompt, {
        max_tokens: DIAGNOSIS_DERIVED_KEYS.has(key) ? Math.min(SECTION_BUDGETS[key] || 2500, 3000) : SECTION_BUDGETS[key] || 2000,
        preferredProvider: 'gemini',
      });
      const raw = data.content?.map(b => b.text || '').join('') || '';
      const parsed = DIAGNOSIS_DERIVED_KEYS.has(key)
        ? normalizeDiagnosisJson(parseAiJson(raw), normalizedEvidence)
        : parseAiJson(raw);
      const content = parsed[key] ?? parsed;
      setSections(s => ({ ...s, [key]: { ...s[key], content, approved: false } }));
      window.toast?.('Section regenerated.', 'ok');
    } catch (e) {
      window.toast?.(`Regeneration failed: ${e.message}`, 'warn');
    }
    setRegenerating(null);
  }

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
      const visibleStudentFeedback = studentFeedbackSection?.approved && !studentFeedbackSection.hidden ? studentFeedbackSection.content : null;
      const visibleHomework = homeworkSection?.approved && !homeworkSection.hidden ? homeworkSection.content : null;

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)', maxWidth: 340, textAlign: 'center' }}>{generatingStatus}</p>
      </div>
    );
  }

  if (step === 'saved') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
        <button style={backStyle} onClick={() => setStep('review')}><Icon.arrow size={14} /> Back to Review</button>
        <SectionHeader title="Post-Approval Actions" subtitle="Sync this diagnosis to other parts of the platform." />
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="ghost" onClick={saveErrorsToBank}><Icon.error size={14} /> Save Errors to Error Bank</Button>
            <Button variant="ghost" onClick={saveVocabToBank}><Icon.vocab size={14} /> Save Vocabulary to Vocab Bank</Button>
            <Button variant="ghost" onClick={saveProgressNoteFromDx}><Icon.note size={14} /> Save Progress Note</Button>
            <Button variant="ghost" onClick={() => onNavigate('homework:create', { studentId: selectedStudentId || studentId, diagnosisId: savedDiagnosis?.id })}>
              <Icon.homework size={14} /> Create Homework from Diagnosis
            </Button>
          </div>
        </Card>
        <Button variant="primary" onClick={() => onNavigate('diagnostics:list', {})}>
          <Icon.check size={14} /> Done — View All Diagnoses
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={S.headline}>AI Diagnosis</h1>
          <p style={S.sub}>
            {selectedStudent
              ? `Diagnosing ${selectedStudent.name || selectedStudent.firstName || 'Student'}`
              : 'Select a student to begin'}
          </p>
        </div>
        {savedDiagnosis && <Pill tone={savedDiagnosis.status === 'approved' ? 'success' : 'warning'}>{savedDiagnosis.status}</Pill>}
      </div>

      {/* ── STEP: PREREQ ── */}
      {step === 'prereq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Student selector */}
          {!studentId && (
            <Card style={{ padding: 16 }}>
              <label style={labelStyle}>Student</label>
              <select
                className="input"
                value={selectedStudentId}
                onChange={e => { setSelectedStudentId(e.target.value); setSelectedClassEventId(''); setClassEvidence(null); setClassEvent(null); }}
              >
                <option value="">— Select student —</option>
                {(students || allStudents).map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.firstName || s.id}</option>
                ))}
              </select>
            </Card>
          )}

          {/* Target profile */}
          {selectedStudent && (
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <PrereqIcon ok={!!targetProfile} required />
                <label style={{ ...labelStyle, margin: 0 }}>Target Score Profile</label>
              </div>
              {profiles.length > 0 ? (
                <select className="input" value={targetProfile?.id || ''} onChange={e => setTargetProfile(profiles.find(p => p.id === e.target.value) || null)}>
                  <option value="">— Select profile —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName || p.label}</option>)}
                </select>
              ) : (
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 10 }}>No profiles — pick a preset to create one:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(TARGET_PROFILE_PRESETS).map(([key, preset]) => (
                      <Button key={key} variant="ghost" size="sm" onClick={() => selectPreset(key)}>{preset.label}</Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Class evidence */}
          {selectedStudent && (
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <PrereqIcon ok={evaluatedSkills.length > 0 && inlineReady} required />
                <label style={{ ...labelStyle, margin: 0 }}>Class Evidence</label>
              </div>

              {/* Class event selector */}
              {!classEventId && (
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Link a class record (optional)</label>
                  <input
                    className="input"
                    placeholder="Class event ID (optional)"
                    value={selectedClassEventId}
                    onChange={e => setSelectedClassEventId(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                </div>
              )}

              {/* Linked class evidence pills */}
              {classEvidence && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>Skills evaluated in the linked class:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SKILL_KEYS.map(({ key, evalKey, countKey }) => {
                      const evaluated = classEvidence[evalKey];
                      const count = countKey ? classEvidence[countKey] : null;
                      return (
                        <Pill key={key} tone={evaluated ? (count === 0 ? 'warning' : 'success') : 'muted'}>
                          {key}{evaluated && count !== null ? ` (${count})` : ''}
                          {evaluated && count === 0 ? <Icon.warning size={12} /> : ''}
                        </Pill>
                      );
                    })}
                  </div>
                  {classEventId && <Button variant="ghost" size="sm" style={{ marginTop: 10 }} onClick={() => onNavigate('calendar:class', { classEventId })}>Edit Class Record</Button>}
                </div>
              )}

              {/* No linked class — inline input form */}
              {noLinkedEvidence && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 12 }}>
                    No class linked. Paste your transcript and select which skills were covered — the AI will only diagnose what you evaluated.
                  </p>

                  <label style={labelStyle}>Class transcript / student answers *</label>
                  <textarea
                    className="input"
                    rows={8}
                    value={inlineTranscript}
                    onChange={e => setInlineTranscript(e.target.value)}
                    placeholder="Paste the student's exact words, speaking answer, writing sample, or transcript here. Quote errors directly — this is what the AI will analyze..."
                    style={{ marginBottom: 12 }}
                  />

                  <label style={labelStyle}>Teacher notes (optional)</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={inlineTeacherNotes}
                    onChange={e => setInlineTeacherNotes(e.target.value)}
                    placeholder="Observations, main difficulty, student mood..."
                    style={{ marginBottom: 14 }}
                  />

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
                                style={{ width: 48, padding: '2px 4px', border: '1px solid var(--border)', borderRadius: 0, fontSize: 11, textAlign: 'center' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {evaluatedSkills.length === 0 && (
                    <p style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: 8 }}><Icon.warning size={12} /> Select at least one skill that was covered in class.</p>
                  )}
                  {!inlineTranscript.trim() && !inlineTeacherNotes.trim() && evaluatedSkills.length > 0 && (
                    <p style={{ color: 'var(--warning)', fontSize: 'var(--text-xs)', marginTop: 8 }}><Icon.warning size={12} /> Paste a transcript or add teacher notes — the AI needs evidence to diagnose.</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {error && (
            <div style={{ padding: 14, background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>
              {error}
            </div>
          )}

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
              <div style={{ height: 6, background: 'var(--bg-deep)', borderRadius: 0, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: approvedCount === totalSections ? 'var(--success)' : 'var(--accent)', borderRadius: 0, transform: `scaleX(${approvedCount / totalSections})`, transformOrigin: 'left', transition: 'transform 0.3s' }} />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={approveAll}>Approve All</Button>
            <Button variant="ghost" size="sm" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
            <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !canApproveDiagnosis}>
              <Icon.check size={14} /> Approve & Save
            </Button>
          </div>

          {/* Empty draft */}
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

          {/* Section cards — grouped by zone */}
          {(() => {
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
                  {sec.approved && <Pill tone="success"><Icon.check size={12} /> Approved</Pill>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(key)} disabled={isRegenning}><Icon.edit size={12} /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => regenerateSection(key)} disabled={isRegenning}><Icon.refresh size={12} /> {isRegenning ? '…' : 'Regen'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleHide(key)} style={{ color: sec.hidden ? 'var(--muted)' : 'var(--text)' }}><Icon.eye size={12} /></Button>
                    <Button variant={sec.approved ? 'ghost' : 'primary'} size="sm" onClick={() => toggleApprove(key)} style={sec.approved ? { color: 'var(--danger)' } : {}}>
                      {sec.approved ? <><Icon.close size={12} /> Unapprove</> : <><Icon.check size={12} /> Approve</>}
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

const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '0 0 0' },
};
