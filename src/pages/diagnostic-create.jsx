/**
 * diagnostic-create.jsx — Split workflow: AI does data, teacher writes meaning
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
  const [step, setStep] = useState('prereq'); // prereq | analyzing | write | review | saved
  const [student, setStudent] = useState(null);
  const [classEvent, setClassEvent] = useState(null);
  const [classEvidence, setClassEvidence] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [savedDiagnosis, setSavedDiagnosis] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('Initializing…');

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
      // Handle new data model
      if (dx.diagnosticData) {
        setDiagnosticData(dx.diagnosticData);
      }
      if (dx.teacherMeaning) {
        setTeacherMeaning(dx.teacherMeaning);
      }
      // Handle legacy format (sections, no teacherMeaning)
      if (dx.sections && !dx.teacherMeaning) {
        setSections(dx.sections);
        setAiResult(dx.aiRaw || null);
      }
      setStep(dx.teacherMeaning && dx.diagnosticData ? 'review' : 'review');
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

  // ── Run AI diagnosis (data only) ──
  async function handleGenerate() {
    if (!prereqOk) return;
    setStep('generating');
    setGeneratingStatus('Analyzing class evidence…');
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
          diagnosticData: data,
          teacherMeaning: teacherMeaning,
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

      setStep('write');
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
        window.toast?.('Write a class summary and at least one feedback item before approving.', 'warn');
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
        diagnosticData,
        teacherMeaning,
        sections: legacySections,
        status: approve ? 'approved' : 'draft',
        teacherApproved: approve,
        cycleStage: approve ? 'diagnosed' : 'needs-diagnosis',
        classSummary: typeof sections.classSummary?.content === 'string' ? sections.classSummary.content : '',
        content: {
          overall_result: teacherMeaning.classSummary || '',
          priorities: teacherMeaning.priorityDiagnosis || [],
          student_friendly_feedback: teacherMeaning.studentFeedback || null,
          homework: teacherMeaning.homeworkRecommendation || '',
          error_bank: diagnosticData?.errors || [],
          section_snapshot: diagnosticData?.scores ? Object.entries(diagnosticData.scores).map(([skill, d]) => ({
            section: skill.charAt(0).toUpperCase() + skill.slice(1),
            score_0_80: d?.score0to80 ?? 0,
            score_0_4: d?.score0to80 ? Math.round((d.score0to80 / 80) * 4 * 100) / 100 : 0,
            confidence: d?.scoreProvisional ? 'low' : 'medium',
            trend: 'stable',
            strength: d?.strengths?.[0] || '',
            gap: d?.weaknesses?.[0] || '',
            next_step: d?.whatToImproveNext || '',
          })) : [],
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
  if (step === 'analyzing') {
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

      {/* ── STEP: WRITE (data summary + teacher writes meaning) ── */}
      {step === 'write' && (
        <div style={{ marginTop: 20 }}>
          {/* Phase indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
            <Pill tone="success">✓ AI analysis complete</Pill>
            <span style={{ color: 'var(--muted)' }}>→</span>
            <Pill tone="accent">You write the meaning</Pill>
            <span style={{ flex: 1 }} />
            <Button variant="ghost" size="sm" onClick={() => setStep('review')} disabled={!canApproveDiagnosis}>
              <Icon.arrowR size={13} /> Review & Approve
            </Button>
          </div>

          {/* ── DATA SUMMARY SECTION (AI output, read-only) ── */}
          <Card style={{ padding: 18, marginBottom: 20 }}>
            <SectionHeader title="AI Data Summary" />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 14 }}>AI-generated scores, errors, and gaps. Read this, then write your meaning below.</p>
            {diagnosticData && <DiagnosticDataSummary data={diagnosticData} />}
          </Card>

          {/* ── TEACHER WRITER SECTION ── */}
          <Card style={{ padding: 18, marginBottom: 20 }}>
            <SectionHeader title="Your Notes" />
            <TeacherWriter
              student={selectedStudent}
              diagnosticData={diagnosticData}
              teacherMeaning={teacherMeaning}
              setTeacherMeaning={setTeacherMeaning}
              aiDrafts={aiDrafts}
              setAiDrafts={setAiDrafts}
              setDraftOverlay={setDraftOverlay}
              draftOverlay={draftOverlay}
            />
          </Card>

          {/* ── Bottom actions ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
            <Button variant="primary" onClick={() => setStep('review')} disabled={!canApproveDiagnosis}>
              <Icon.arrowR size={14} /> Review & Approve
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: REVIEW (simple preview of teacher-written content) ── */}
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
                    {p.evidence && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 4 }}>Evidence: {p.evidence}</div>}
                    <div style={{ fontSize: 'var(--text-sm)' }}>{p.whatToImprove}</div>
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

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => setStep('write')}><Icon.arrowL size={13} /> Back to edit</Button>
            <Button variant="primary" onClick={() => handleSave(true)} disabled={saving || !canApproveDiagnosis}>
              <Icon.check size={14} /> Approve & Save
            </Button>
          </div>
        </div>
      )}

      {/* ── DRAFT OVERLAY (modal) ── */}
      {draftOverlay && (
        <DraftOverlay
          section={draftOverlay.section}
          draft={draftOverlay.draft}
          onAccept={(section, text) => {
            setTeacherMeaning(tm => {
              const next = { ...tm };
              if (section === 'classSummary') next.classSummary = text;
              if (section === 'studentFeedback') next.studentFeedback = { ...next.studentFeedback };
              if (section === 'nextClassFocus') next.nextClassFocus = { ...next.nextClassFocus, primaryFocus: text };
              if (section === 'homeworkRecommendation') next.homeworkRecommendation = text;
              return next;
            });
            setDraftOverlay(null);
          }}
          onDismiss={() => setDraftOverlay(null)}
        />
      )}
    </div>
  );
}

/* ── DIAGNOSTIC DATA SUMMARY (read-only) ── */
function DiagnosticDataSummary({ data }) {
  if (!data) return null;
  const { scores, errors, vocabulary, gapVsTarget, priorityRecommendations } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Skill scores */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Skill Scores</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {scores && Object.entries(scores).map(([skill, s]) => (
            <div key={skill} style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: s.evaluated ? (s.score0to80 >= 55 ? 'var(--success-bg)' : s.score0to80 >= 40 ? 'var(--warning-bg)' : 'var(--danger-bg)') : 'var(--bg)',
              border: '1px solid var(--border)', minWidth: 130,
            }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'capitalize' }}>{skill}</div>
              {s.evaluated ? (
                <>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{s.score0to80 != null ? `${s.score0to80}/80` : '—'}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.scoreConfidenceLevel} · {s.evidenceCount} turn{s.evidenceCount !== 1 ? 's' : ''}</div>
                </>
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontStyle: 'italic' }}>Not evaluated</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gap vs target */}
      {gapVsTarget && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Gap to Target</div>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            Priority skill: <strong>{gapVsTarget.prioritySkillForTarget || 'unevaluated'}</strong>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(gapVsTarget).filter(([k]) => k !== 'prioritySkillForTarget').map(([skill, gap]) => (
              <Pill key={skill} tone={gap.includes('Not evaluated') ? 'muted' : gap.includes('below') ? (parseInt(gap) > 20 ? 'danger' : 'warning') : 'success'}>
                {skill}: {gap}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Errors Found ({errors.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {errors.slice(0, 5).map((err, i) => (
              <div key={i} style={{ padding: 8, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>"{err.error}"</span>
                <span style={{ color: 'var(--muted)' }}> → </span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{err.correct}</span>
                <Pill tone={err.priority === 'high' ? 'danger' : 'muted'} style={{ marginLeft: 8 }}>{err.category}</Pill>
              </div>
            ))}
            {errors.length > 5 && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>+{errors.length - 5} more</p>}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {vocabulary && vocabulary.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>New Vocabulary ({vocabulary.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {vocabulary.slice(0, 8).map((v, i) => (
              <Pill key={i} tone="accent" title={v.meaning}>{v.wordOrPhrase}</Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TEACHER WRITER (teacher enters meaning) ── */
function TeacherWriter({ student, diagnosticData, teacherMeaning, setTeacherMeaning, aiDrafts, setAiDrafts, setDraftOverlay, draftOverlay }) {

  function update(path, value) {
    setTeacherMeaning(tm => {
      const next = { ...tm };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  async function requestDraft(field, promptBuilder) {
    if (!diagnosticData) return;
    const draft = await promptBuilder({ student, data: diagnosticData }).catch(() => 'Draft generation failed.');
    if (draft) {
      setDraftOverlay({ section: field, draft });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
      {/* 1. Class Summary */}
      <WriterField
        label="Class Summary"
        hint="What was practiced, how it went, key takeaway"
        value={teacherMeaning.classSummary}
        onChange={v => update('classSummary', v)}
        onDraft={() => requestDraft('classSummary', () => Promise.resolve(''))}
        required
      />

      {/* 2. Student Feedback */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 4 }}>Student Feedback</div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 10 }}>This is what the student will read. Write in your own voice.</p>

        <div style={{ background: 'var(--accent-subtle)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: 6 }}>Today's Focus</div>
          <textarea className="input" rows={2} value={teacherMeaning.studentFeedback.classFocus}
            onChange={e => update('studentFeedback.classFocus', e.target.value)}
            placeholder="What did the student work on today?" />
        </div>

        <div style={{ background: 'var(--success-bg)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: 6 }}>What Is Becoming Stronger</div>
          <textarea className="input" rows={2} value={teacherMeaning.studentFeedback.whatYouDidWell?.[0]?.explanation || ''}
            onChange={e => update('studentFeedback.whatYouDidWell', [{ strength: 'Improvement', explanation: e.target.value }])}
            placeholder="What did the student do well? Include a quote if you can." />
        </div>

        <div style={{ background: 'var(--warning-bg)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: 6 }}>Your Next Step</div>
          <textarea className="input" rows={2} value={teacherMeaning.studentFeedback.whatToImprove?.[0]?.howToImprove || ''}
            onChange={e => update('studentFeedback.whatToImprove', [{ area: 'Next step', howToImprove: e.target.value }])}
            placeholder="One clear thing to work on next." />
        </div>
      </div>

      {/* 3. Priority Diagnosis (AI recommended, teacher confirms) */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 4 }}>Priority Diagnosis</div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 8 }}>AI-recommended priorities — confirm, edit, or add your own.</p>
        {diagnosticData?.priorityRecommendations?.map((rec, i) => {
          const confirmed = teacherMeaning.priorityDiagnosis.find(p => p.rank === rec.rank);
          return (
            <div key={i} style={{
              padding: 10, marginBottom: 8, borderRadius: 'var(--radius-sm)',
              border: `1px solid ${confirmed ? 'var(--success)' : 'var(--border)'}`,
              background: confirmed ? 'var(--success-bg)' : 'var(--bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Pill tone={rec.urgency === 'Critical' ? 'danger' : rec.urgency === 'Developing' ? 'warning' : 'info'}>{rec.urgency}</Pill>
                <input className="input" style={{ flex: 1, fontWeight: 600, padding: '4px 8px', fontSize: 'var(--text-sm)' }}
                  value={rec.area} onChange={e => {
                    const updated = [...teacherMeaning.priorityDiagnosis];
                    const idx = updated.findIndex(p => p.rank === rec.rank);
                    if (idx >= 0) updated[idx] = { ...updated[idx], area: e.target.value };
                    else updated.push({ ...rec, area: e.target.value, confirmed: true });
                    setTeacherMeaning(tm => ({ ...tm, priorityDiagnosis: updated }));
                  }} />
                <Button variant="ghost" size="sm" onClick={() => {
                  const updated = teacherMeaning.priorityDiagnosis.filter(p => p.rank !== rec.rank);
                  setTeacherMeaning(tm => ({ ...tm, priorityDiagnosis: updated }));
                }}><Icon.close size={10} /></Button>
              </div>
              <textarea className="input" rows={1} style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}
                value={rec.evidence} placeholder="Evidence quote"
                onChange={e => {
                  const updated = [...teacherMeaning.priorityDiagnosis];
                  const idx = updated.findIndex(p => p.rank === rec.rank);
                  if (idx >= 0) updated[idx] = { ...updated[idx], evidence: e.target.value };
                  else updated.push({ ...rec, evidence: e.target.value, confirmed: true });
                  setTeacherMeaning(tm => ({ ...tm, priorityDiagnosis: updated }));
                }} />
            </div>
          );
        })}
      </div>

      {/* 4. Next Class Focus */}
      <WriterField
        label="Next Class Focus"
        hint="What should the next class focus on?"
        value={teacherMeaning.nextClassFocus?.primaryFocus || ''}
        onChange={v => update('nextClassFocus.primaryFocus', v)}
        onDraft={() => requestDraft('nextClassFocus', () => Promise.resolve(''))}
      />

      {/* 5. Homework Recommendation */}
      <WriterField
        label="Homework Recommendation"
        hint="What should the student practice? (AI will generate exercises later)"
        value={teacherMeaning.homeworkRecommendation}
        onChange={v => update('homeworkRecommendation', v)}
        onDraft={() => requestDraft('homeworkRecommendation', () => Promise.resolve(''))}
      />
    </div>
  );
}

/* ── SINGLE WRITER FIELD ── */
function WriterField({ label, hint, value, onChange, onDraft, required, rows = 3 }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={onDraft} title="Suggest a draft">
          <Icon.doc size={11} /> Draft
        </Button>
      </div>
      {hint && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 6 }}>{hint}</p>}
      <textarea className="input" rows={rows} value={value} onChange={e => onChange(e.target.value)}
        placeholder={hint} />
    </div>
  );
}

/* ── REVIEW FEEDBACK SECTION ── */
function ReviewFeedbackSection({ meaning }) {
  if (!meaning || (!meaning.classFocus && !meaning.whatYouDidWell?.length && !meaning.whatToImprove?.length)) {
    return <p style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>No feedback written yet</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {meaning.classFocus && (
        <div style={{ padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Today's Focus</div>
          <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{meaning.classFocus}</p>
        </div>
      )}
      {meaning.whatYouDidWell?.map((item, i) => (
        <div key={i} style={{ padding: 10, background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>What Is Becoming Stronger</div>
          <p style={{ fontSize: 'var(--text-sm)' }}>{item.explanation}</p>
        </div>
      ))}
      {meaning.whatToImprove?.map((item, i) => (
        <div key={i} style={{ padding: 10, background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>Your Next Step</div>
          <p style={{ fontSize: 'var(--text-sm)' }}>{item.howToImprove}</p>
        </div>
      ))}
    </div>
  );
}

/* ── DRAFT OVERLAY (modal) ── */
function DraftOverlay({ section, draft, onAccept, onDismiss }) {
  const [editing, setEditing] = useState(draft || '');

  const sectionLabel = {
    classSummary: 'Class Summary',
    studentFeedback: 'Student Feedback',
    nextClassFocus: 'Next Class Focus',
    homeworkRecommendation: 'Homework Recommendation',
  }[section] || section;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'auto',
        boxShadow: 'var(--shadow-modal)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>AI Draft: {sectionLabel}</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ padding: 12, background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent)', marginBottom: 12 }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>AI Suggestion</div>
            <textarea className="input" rows={6} value={editing}
              onChange={e => setEditing(e.target.value)}
              style={{ background: 'white', fontSize: 'var(--text-sm)' }} />
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginBottom: 12 }}>
            This is an AI draft. Edit it as you like, then accept to use it, or dismiss.
          </p>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
          <Button variant="primary" onClick={() => onAccept(section, editing)}>
            <Icon.check size={13} /> Accept & Use
          </Button>
        </div>
      </div>
    </div>
  );
}

const backStyle = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0, fontFamily: 'var(--font-ui)' };
const S = {
  headline: { fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-deep)', margin: '0 0 4px' },
  sub: { fontSize: 'var(--text-sm)', color: 'var(--muted)', margin: '0 0 0' },
};
