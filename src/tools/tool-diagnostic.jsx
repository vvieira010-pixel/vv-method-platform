import { useState, useEffect, useRef } from 'react';
import { Icon, Card, SectionHeader, Pill, Button, PillNav, Avatar, callAI, summarizeTranscript } from '../components/shared.jsx';
import { createSession, getSessions, deleteSession, saveDiagnosis, getStudentCycleState, updateDiagnosisCycleStage, getLatestDiagnosis } from '../lib/workflow.js';
import { parseAiJson } from '../lib/ai-helpers.js';
import { DIAGNOSTIC_PROMPT } from '../lib/prompts.js';
import { getStudentMemory } from '../lib/agent-memory.js';

/* ─── Styles ───────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('diagnostic-styles')) {
  const style = document.createElement('style');
  style.id = 'diagnostic-styles';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Helpers ──────────────────────────────────────────────── */
function clampTwoDecimals(value, min = 0, max = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(max, Math.max(min, n)) * 100) / 100;
}
function fmt4(value) { return `${clampTwoDecimals(value).toFixed(2)} / 4.00`; }
function isNotEnoughEvidence(text) { return String(text || "").toLowerCase().includes("not enough evidence"); }

const CEFR_LEVELS = ["A2", "B1", "B2", "B2 Strong"];
function normalizeCefrLevel(value) {
  const v = String(value || "").trim();
  if (CEFR_LEVELS.includes(v)) return v;
  if (/b2\s*\+|b2\+|strong\s*b2|approaching/i.test(v)) return "B2 Strong";
  if (/^a2/i.test(v)) return "A2";
  if (/^b1/i.test(v)) return "B1";
  if (/^b2/i.test(v)) return "B2";
  return "B1";
}

const SKILL_KEYS = [
  { id: "speaking_fluency", label: "Speaking fluency" },
  { id: "speaking_org",     label: "Speaking org" },
  { id: "grammar",          label: "Grammar" },
  { id: "vocabulary",       label: "Vocabulary" },
  { id: "listening",        label: "Listening" },
  { id: "reading",          label: "Reading" },
  { id: "confidence",       label: "Confidence" },
  { id: "met_strategy",     label: "MET strategy" },
];

const STAGE_LABELS = {
  'needs-diagnosis': { label: 'Needs Diagnosis', tone: 'danger' },
  'diagnosed':       { label: 'Diagnosed', tone: 'info' },
  'feedback-sent':   { label: 'Feedback Sent', tone: 'info' },
  'homework-assigned':{ label: 'HW Assigned', tone: 'warning' },
  'submitted':       { label: 'Submitted', tone: 'success' },
  'reviewed':        { label: 'Reviewed', tone: 'success' },
};

/* ─── Normalize AI response ────────────────────────────────── */
const DEFAULT_SNAPSHOT = [
  { section: "Speaking", score_0_80: 0, score_0_4: 0, confidence: "medium", trend: "stable", key_metrics: [], strength: "", gap: "", next_step: "" },
  { section: "Writing",  score_0_80: 0, score_0_4: 0, confidence: "medium", trend: "stable", key_metrics: [], strength: "", gap: "", next_step: "" },
  { section: "Listening",score_0_80: 0, score_0_4: 0, confidence: "medium", trend: "stable", key_metrics: [], strength: "", gap: "", next_step: "" },
  { section: "Reading",  score_0_80: 0, score_0_4: 0, confidence: "medium", trend: "stable", key_metrics: [], strength: "", gap: "", next_step: "" },
];

function normalizeDiagnosticPayload(parsed) {
  const safe = parsed && typeof parsed === "object" ? parsed : {};
  const priorities = Array.isArray(safe.priorities) ? safe.priorities : [];
  const normalizedP = priorities.slice(0, 5).map((p, i) => ({
    rank: Number.isFinite(p?.rank) ? p.rank : i + 1,
    urgency: p?.urgency || (i === 0 ? "Critical" : i === 1 ? "Developing" : "Watch"),
    area: p?.area || "", evidence: p?.evidence || "", pattern: p?.pattern || "",
    what_to_improve: p?.what_to_improve || "", why_it_matters: p?.why_it_matters || "",
    how_to_improve: p?.how_to_improve || "", success_criteria: p?.success_criteria || "",
    time_horizon: p?.time_horizon || "", next_focus: p?.next_focus || "",
  }));
  while (normalizedP.length < 3) {
    const i = normalizedP.length;
    normalizedP.push({ rank: i + 1, urgency: i === 0 ? "Critical" : i === 1 ? "Developing" : "Watch",
      area: "", evidence: "", pattern: "", what_to_improve: "", why_it_matters: "",
      how_to_improve: "", success_criteria: "", time_horizon: "", next_focus: "" });
  }
  const snapIn = Array.isArray(safe.section_snapshot) ? safe.section_snapshot : [];
  const section_snapshot = DEFAULT_SNAPSHOT.map(base => {
    const found = snapIn.find(s => String(s?.section || "").toLowerCase() === base.section.toLowerCase()) || {};
    return {
      section: base.section,
      score_0_80: Number.isFinite(Number(found.score_0_80)) ? Number(found.score_0_80) : 0,
      score_0_4: clampTwoDecimals(found.score_0_4),
      confidence: ["high", "medium", "low"].includes(found.confidence) ? found.confidence : "medium",
      trend: ["improving", "stable", "declining"].includes(found.trend) ? found.trend : "stable",
      key_metrics: Array.isArray(found.key_metrics) ? found.key_metrics.filter(Boolean).slice(0, 4) : [],
      strength: found.strength || "", gap: found.gap || "", next_step: found.next_step || "",
    };
  });
  return {
    overall_result: safe.overall_result || "",
    section_snapshot, priorities: normalizedP,
    strengths: Array.isArray(safe.strengths) ? safe.strengths : [],
    improvements: Array.isArray(safe.improvements) ? safe.improvements : [],
    corrections: (Array.isArray(safe.corrections) ? safe.corrections : []).map(c => ({
      original: c?.original || "", improved: c?.improved || c?.corrected || "",
      what_to_improve: c?.what_to_improve || "", how_to_improve: c?.how_to_improve || "",
      rule_or_strategy: c?.rule_or_strategy || "", why: c?.why || ""
    })),
    student_profile: safe.student_profile || "",
    strengths_detailed: Array.isArray(safe.strengths_detailed) ? safe.strengths_detailed : [],
    weaknesses_detailed: Array.isArray(safe.weaknesses_detailed) ? safe.weaknesses_detailed : [],
    error_bank: Array.isArray(safe.error_bank) ? safe.error_bank : [],
    vocabulary_table: Array.isArray(safe.vocabulary_table) ? safe.vocabulary_table : [],
    grammar_table: Array.isArray(safe.grammar_table) ? safe.grammar_table : [],
    met_skill_table: Array.isArray(safe.met_skill_table) ? safe.met_skill_table : [],
    homework_directions: safe.homework_directions && typeof safe.homework_directions === "object" ? safe.homework_directions : {},
    recurring_vs_new_errors: safe.recurring_vs_new_errors && typeof safe.recurring_vs_new_errors === "object" ? safe.recurring_vs_new_errors : {},
    speaking_diagnosis: safe.speaking_diagnosis ?? "",
    writing_diagnosis: safe.writing_diagnosis ?? "",
    reading_listening_diagnosis: safe.reading_listening_diagnosis ?? "",
    vocabulary_diagnosis: typeof safe.vocabulary_diagnosis === "string" ? safe.vocabulary_diagnosis : "",
    grammar_diagnosis: typeof safe.grammar_diagnosis === "string" ? safe.grammar_diagnosis : "",
    met_skill_connection: typeof safe.met_skill_connection === "string" ? safe.met_skill_connection : "",
    student_friendly_feedback: safe.student_friendly_feedback ?? "",
    teacher_notes_next_class: safe.teacher_notes_next_class ?? "",
    homework: safe.homework || "",
    progress_note: safe.progress_note || "",
  };
}

/* ─── Pre-analyze prompt ───────────────────────────────────── */
const PRE_ANALYZE_PROMPT = `You are an expert MET teacher-examiner. Analyze this class transcript and extract structured information.

STUDENT: {STUDENT_INFO}
TRANSCRIPT:
{TRANSCRIPT}

Return ONLY valid JSON (no markdown, no backticks):
{
  "lessonFocus": "detected lesson focus",
  "teacherNotes": "key observations about the student",
  "skillRatings": {
    "speaking_fluency": 2.5, "speaking_org": 2.5, "grammar": 2.5, "vocabulary": 2.5,
    "listening": 2.5, "reading": 2.5, "confidence": 2.5, "met_strategy": 2.5
  }
}

Rate ONLY what you see evidence for. 0.00-4.00. Use two decimals. Be honest.`;

/* ─── Main component ───────────────────────────────────────── */
export default function ToolDiagnostic({ student, students, onSelectStudent, onNavigateToHomework }) {
  const [view, setView] = useState("generate");
  const [transcript, setTranscript] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [lessonFocus, setLessonFocus] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [preAnalyzing, setPreAnalyzing] = useState(false);
  const [cycleState, setCycleState] = useState(null);
  const [savedDiagnosisId, setSavedDiagnosisId] = useState(null);
  const [skillRatings, setSkillRatings] = useState(() =>
    Object.fromEntries(SKILL_KEYS.map(k => [k.id, 2.5]))
  );
  const [currentLevel, setCurrentLevel] = useState("B1");
  const [targetLevel, setTargetLevel] = useState("B2");
  const [confirmNewDiag, setConfirmNewDiag] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      const sessions = await getSessions();
      setSaved(sessions || []);
      if (student?.id) {
        setCycleState(await getStudentCycleState(student.id));
      }
    })();
  }, [student?.id]);

  useEffect(() => {
    setCurrentLevel(normalizeCefrLevel(student?.band));
    setTargetLevel(normalizeCefrLevel(student?.bandTarget));
  }, [student?.id, student?.band, student?.bandTarget]);

  const studentName = student?.name || "Unknown";

  /* ── PDF upload ── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      try {
        const mod = await import('pdfjs-dist');
        mod.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const buf = await file.arrayBuffer();
        const pdf = await mod.getDocument({ data: buf }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        setTranscript(text.trim());
        window.toast?.("PDF loaded.", "ok");
      } catch (err) {
        window.toast?.("Failed to read PDF: " + err.message, "warn");
      }
    } else {
      const text = await file.text();
      setTranscript(text);
      window.toast?.("File loaded.", "ok");
    }
  };

  /* ── Pre-analyze ── */
  const handlePreAnalyze = async () => {
    if (!transcript.trim()) return;
    setPreAnalyzing(true);
    const sInfo = `Name: ${studentName}\nLevel: ${currentLevel} → ${targetLevel}\nSession: ${student?.session || "?"}/${student?.totalSessions || "?"}`;
    try {
      const prompt = PRE_ANALYZE_PROMPT.replace("{STUDENT_INFO}", sInfo).replace("{TRANSCRIPT}", transcript.trim());
      const data = await callAI(prompt, { max_tokens: 800 });
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const p = parseAiJson(raw);
      if (p.lessonFocus) setLessonFocus(p.lessonFocus);
      if (p.teacherNotes) setTeacherNotes(p.teacherNotes);
      if (p.skillRatings && typeof p.skillRatings === "object") {
        setSkillRatings(prev => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(p.skillRatings)) {
            if (k in next) next[k] = clampTwoDecimals(v);
          }
          return next;
        });
      }
      window.toast?.("Pre-analysis done — review fields, then run diagnostic.", "ok");
    } catch (e) {
      window.toast?.(`Pre-analysis failed: ${e.message}`, "warn");
    }
    setPreAnalyzing(false);
  };

  /* ── Run full diagnostic ── */
  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setLoadingMessage("Preparing transcript...");
    setError("");
    setResult(null);
    setSavedDiagnosisId(null);

    const teacherNotesBlock = [
      `Session: ${student?.session || "?"}/${student?.totalSessions || "?"}`,
      lessonFocus ? `Lesson focus: ${lessonFocus}` : null,
      teacherNotes ? `Teacher notes: ${teacherNotes}` : null,
      `Skill ratings: ${SKILL_KEYS.map(k => `${k.label} ${clampTwoDecimals(skillRatings[k.id]).toFixed(2)}/4.00`).join(", ")}`,
    ].filter(Boolean).join("\n");

    try {
      // Summarize long transcripts to save output token budget
      setLoadingMessage("Condensing transcript...");
      const condensed = transcript.length > 2000
        ? await summarizeTranscript(transcript)
        : transcript;

      setLoadingMessage("Retrieving student memory...");
      const memory = await getStudentMemory(student?.id);

      const replacements = {
        "{STUDENT_NAME}": studentName,
        "{CURRENT_LEVEL}": currentLevel || "not provided",
        "{TARGET_LEVEL}": targetLevel || "not provided",
        "{EXAM_GOAL}": student?.goal || "MET B2",
        "{EXAM_DATE}": "not provided",
        "{PROFESSIONAL_CONTEXT}": student?.professionalContext || "not provided",
        "{STUDENT_GOAL}": student?.goal || "not provided",
        "{PREVIOUS_STRENGTHS}": memory.strengths || "not provided",
        "{PREVIOUS_ERRORS}": memory.errors || "not provided",
        "{EMOTIONAL_STATE}": "not provided",
        "{LESSON_DATE}": new Date().toISOString().slice(0, 10),
        "{LESSON_FOCUS}": lessonFocus || "not specified",
        "{TASK_TYPE}": "one class",
        "{SKILL_FOCUS}": "not specified",
        "{INPUT_MATERIAL}": "Class transcript",
        "{TRANSCRIPT}": condensed,
        "{TEACHER_NOTES}": teacherNotesBlock,
        "{CORRECT_ANSWERS}": "not applicable",
        "{LANGUAGE_OF_FEEDBACK}": "English",
        "{TEACHER_TONE}": "Warm, precise, professional",
        "{OUTPUT_REQUIREMENTS}": "Include ALL fields defined in the JSON schema above.",
      };
      let prompt = DIAGNOSTIC_PROMPT;
      for (const [key, value] of Object.entries(replacements)) {
        prompt = prompt.split(key).join(value);
      }

      // 8000 tokens — the full diagnostic JSON needs room to breathe
      setLoadingMessage("Analyzing with AI (this may take 30-90 seconds)...");
      const data = await callAI(prompt, { max_tokens: 8000 });
      const raw = data.content?.map(b => b.text || "").join("") || "";

      if (!raw.trim()) throw new Error("AI returned an empty response. Check your API key and try again.");

      setLoadingMessage("Processing results...");
      const parsed = parseAiJson(raw);
      setResult(normalizeDiagnosticPayload(parsed));
    } catch (e) {
      console.error("Diagnostic error:", e);
      const msg = e.message || "Unknown error";
      if (msg.includes("quota") || msg.includes("rate") || msg.includes("limit")) {
        setError("API quota or rate limit reached. Wait a moment and retry.");
      } else if (msg.includes("invalid JSON") || msg.includes("JSON")) {
        setError("AI response was cut off or malformed. Try shortening the transcript or retry.");
      } else {
        setError(`Analysis failed: ${msg}`);
      }
    }
    setLoading(false);
    setLoadingMessage("");
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!result) return;
    const session = await createSession({
      studentId: student?.id || null, studentName,
      track: student?.track || "MET",
      sessionOverride: student?.session || 1,
      transcript, lessonFocus, teacherNotes, currentLevel, targetLevel,
      overall_result: result.overall_result, section_snapshot: result.section_snapshot,
      strengths: result.strengths, improvements: result.improvements,
      corrections: result.corrections, priorities: result.priorities,
      homework: result.homework, progress_note: result.progress_note,
      skillRatings,
    });
    const diagnosis = await saveDiagnosis({
      studentId: student?.id || null,
      sessionId: session.id,
      date: session.date,
      cycleStage: 'diagnosed',
      inputText: transcript,
      classSummary: result.overall_result || '',
      strengths: result.strengths || [],
      weaknesses: result.improvements || [],
      skillIssues: (result.priorities || []).map(p => p.area).filter(Boolean),
      nextSteps: (result.priorities || []).map(p => p.next_focus).filter(Boolean),
      content: {
        overall_result: result.overall_result,
        section_snapshot: result.section_snapshot,
        corrections: result.corrections,
        priorities: result.priorities,
        progress_note: result.progress_note,
        student_profile: result.student_profile,
        strengths_detailed: result.strengths_detailed,
        weaknesses_detailed: result.weaknesses_detailed,
        error_bank: result.error_bank,
        vocabulary_table: result.vocabulary_table,
        grammar_table: result.grammar_table,
        met_skill_table: result.met_skill_table,
        speaking_diagnosis: result.speaking_diagnosis,
        writing_diagnosis: result.writing_diagnosis,
        reading_listening_diagnosis: result.reading_listening_diagnosis,
        homework_directions: result.homework_directions,
        homework: result.homework,
        student_friendly_feedback: result.student_friendly_feedback,
        teacher_notes_next_class: result.teacher_notes_next_class,
        recurring_vs_new_errors: result.recurring_vs_new_errors,
        vocabulary_diagnosis: result.vocabulary_diagnosis,
        grammar_diagnosis: result.grammar_diagnosis,
        met_skill_connection: result.met_skill_connection,
      },
      createdAt: session.createdAt,
    });
    setSavedDiagnosisId(diagnosis.id);
    setSaved(await getSessions());
    setCycleState(await getStudentCycleState(student?.id));
    window.toast?.(`Diagnosis saved for ${studentName}.`, "ok");
  };

  /* ── Cycle actions ── */
  const handleSendFeedback = async () => {
    if (!savedDiagnosisId) return;
    await updateDiagnosisCycleStage(savedDiagnosisId, 'feedback-sent');
    setCycleState(await getStudentCycleState(student?.id));
    window.toast?.("Feedback sent to student.", "ok");
  };

  const handleAssignHomework = () => {
    if (!savedDiagnosisId || !result) return;
    const diagForHw = { id: savedDiagnosisId, content: result, studentId: student?.id };
    if (onNavigateToHomework) onNavigateToHomework(diagForHw);
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    await deleteSession(id);
    setSaved(prev => prev.filter(d => d.id !== id));
    setConfirmDelete(null);
    window.toast?.("Deleted.", "info");
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  const studentSessions = saved.filter(s => s.studentId === student?.id);
  const stageInfo = STAGE_LABELS[cycleState?.cycleStage] || STAGE_LABELS['needs-diagnosis'];

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* Student selector */}
        <PillNav
          tabs={students.map(s => ({ id: s.id, label: s.firstName }))}
          active={student?.id}
          onChange={onSelectStudent}
        />

        {/* Cycle stage indicator */}
        {cycleState && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 20px", padding: "10px 14px", background: "var(--bg-deep)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)" }}>Cycle:</span>
            <Pill tone={stageInfo.tone}>{stageInfo.label}</Pill>
            {cycleState.daysSinceLastDiagnosis !== null && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
                {cycleState.daysSinceLastDiagnosis}d since last diagnosis
              </span>
            )}
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginLeft: "auto" }}>
              {cycleState.totalDiagnoses} diagnoses · {cycleState.totalHomework} HW sets
            </span>
          </div>
        )}

        {/* View tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <Button variant={view === "generate" ? "primary" : "ghost"} size="sm" onClick={() => { setView("generate"); setViewing(null); }}>
            Run Diagnostic
          </Button>
          <Button variant={view === "history" ? "primary" : "ghost"} size="sm" onClick={() => setView("history")}>
            History ({studentSessions.length})
          </Button>
        </div>

        {/* ─── GENERATE VIEW ─── */}
        {view === "generate" && !result && (
          <Card style={{ padding: 24 }}>
            <SectionHeader title="New Diagnosis" icon={<Icon.diagnose size={16} />} />

            {/* Transcript input */}
            <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginTop: 16, marginBottom: 6 }}>
              Class transcript
            </label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={10}
              placeholder="Paste the class transcript here, or upload a file..."
              style={{ width: "100%", padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", resize: "vertical", background: "var(--surface)" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                Upload PDF / TXT
              </Button>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={handleFileUpload} />
              {transcript.trim() && (
                <Button variant="ghost" size="sm" onClick={handlePreAnalyze} disabled={preAnalyzing}>
                  {preAnalyzing ? "Analyzing..." : "Pre-analyze"}
                </Button>
              )}
            </div>

            {/* Lesson focus + teacher notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <div>
                <label style={labelStyle}>Lesson focus</label>
                <input value={lessonFocus} onChange={e => setLessonFocus(e.target.value)} placeholder="e.g. Past simple retelling" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Level</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                    {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                  <span style={{ alignSelf: "center", color: "var(--muted)" }}>→</span>
                  <select value={targetLevel} onChange={e => setTargetLevel(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                    {CEFR_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <label style={{ ...labelStyle, marginTop: 12 }}>Teacher notes</label>
            <textarea
              value={teacherNotes}
              onChange={e => setTeacherNotes(e.target.value)}
              rows={3}
              placeholder="Key observations, main difficulty, evidence from class..."
              style={{ width: "100%", padding: 10, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "var(--text-sm)", resize: "vertical", background: "var(--surface)" }}
            />

            {/* Skill ratings */}
            <label style={{ ...labelStyle, marginTop: 16 }}>
              Skill ratings (0–4 scale)
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: "normal", display: "block", marginTop: 2 }}>
                0 = Not evident • 1 = Minimal • 2 = Emerging • 3 = Developing • 4 = Proficient
              </span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginTop: 6 }}>
              {SKILL_KEYS.map(sk => (
                <div key={sk.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", flex: 1 }}>{sk.label}</span>
                  <input
                    type="number" min="0" max="4" step="0.25"
                    value={skillRatings[sk.id]}
                    onChange={e => setSkillRatings(r => ({ ...r, [sk.id]: clampTwoDecimals(e.target.value) }))}
                    style={{ width: 60, padding: "4px 6px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "var(--text-xs)", textAlign: "center" }}
                    title="Rate only what you observed evidence for"
                  />
                </div>
              ))}
            </div>

            {/* Generate button with loading state */}
            <div style={{ marginTop: 20 }}>
              <Button variant="primary" size="lg" onClick={handleGenerate} disabled={loading || !transcript.trim()}>
                {loading ? `${loadingMessage || "Running Diagnostic..."}` : "Run Full Diagnostic"}
              </Button>
              {loading && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--info-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--info-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--info)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                    <span style={{ color: "var(--info)", fontSize: "var(--text-sm)" }}>{loadingMessage || "Processing..."}</span>
                  </div>
                </div>
              )}
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--danger-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--danger-soft)" }}>
                <p style={{ color: "var(--danger)", fontSize: "var(--text-sm)", margin: 0 }}>{error}</p>
                <Button variant="ghost" size="sm" onClick={handleGenerate} style={{ marginTop: 8 }}>Retry</Button>
              </div>
            )}
          </Card>
        )}

        {/* ─── RESULT VIEW ─── */}
        {view === "generate" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Action bar */}
            <Card style={{ padding: "14px 18px", background: "var(--accent-subtle)", border: "1.5px solid var(--accent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--accent-deep)" }}>Diagnosis Complete</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!savedDiagnosisId && (
                    <Button variant="primary" size="sm" onClick={handleSave}>Save Diagnosis</Button>
                  )}
                  {savedDiagnosisId && (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleSendFeedback}>Send Feedback to Student</Button>
                      <Button variant="primary" size="sm" onClick={handleAssignHomework}>Assign Homework</Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setConfirmNewDiag(true)}>New Diagnosis</Button>
                </div>
              </div>
            </Card>

            {/* Overall result */}
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Summary" />
              <p style={{ fontSize: "var(--text-md)", lineHeight: 1.6, marginTop: 8 }}>{result.overall_result}</p>
            </Card>

            {/* Priorities — moved to top for visual hierarchy */}
            <Card style={{ padding: 18, border: "2px solid var(--accent-soft)", background: "var(--accent-subtle)" }}>
              <SectionHeader title="Priority Focus Areas" subtitle="Start here" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                {result.priorities.filter(p => p.area).slice(0, 3).map((p, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: "var(--radius-sm)", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `4px solid ${p.urgency === "Critical" ? "var(--danger)" : p.urgency === "Developing" ? "var(--warning)" : "var(--info)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Pill tone={p.urgency === "Critical" ? "danger" : p.urgency === "Developing" ? "warning" : "info"}>{p.urgency}</Pill>
                      <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{p.area}</span>
                    </div>
                    {p.evidence && <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: 4 }}>Evidence: {p.evidence}</div>}
                    <div style={{ fontSize: "var(--text-sm)", marginBottom: 4 }}>{p.what_to_improve}</div>
                    {p.how_to_improve && <div style={{ fontSize: "var(--text-xs)", color: "var(--text-2)", marginTop: 2, fontStyle: "italic" }}>Next step: {p.how_to_improve}</div>}
                  </div>
                ))}
              </div>
            </Card>

            {/* Section snapshot */}
            <Card style={{ padding: 18 }}>
              <SectionHeader title="Skill Snapshot" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 12 }}>
                {result.section_snapshot.map(s => (
                  <div key={s.section} style={{ padding: 12, borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{s.section}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{fmt4(s.score_0_4)}</span>
                    </div>
                    <SnapshotBar value4={s.score_0_4} />
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 6 }}>
                      {s.trend !== "stable" && <Pill tone={s.trend === "improving" ? "success" : "danger"} style={{ marginRight: 4 }}>{s.trend}</Pill>}
                      {!isNotEnoughEvidence(s.strength) && <span>Strength: {s.strength}</span>}
                    </div>
                    {!isNotEnoughEvidence(s.gap) && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginTop: 3 }}>Gap: {s.gap}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Error bank */}
            {result.error_bank.length > 0 && (
              <Card style={{ padding: 18 }}>
                <SectionHeader title="Error Bank" />
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={thStyle}>Error</th>
                        <th style={thStyle}>Correct</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Rule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.error_bank.map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--divider)" }}>
                          <td style={tdStyle}><span style={{ color: "var(--danger)" }}>{e.error}</span></td>
                          <td style={tdStyle}><span style={{ color: "var(--success)" }}>{e.correct}</span></td>
                          <td style={tdStyle}><Pill tone="muted">{e.type}</Pill></td>
                          <td style={tdStyle}>{e.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Student-friendly feedback preview */}
            {result.student_friendly_feedback && typeof result.student_friendly_feedback === "object" && (
              <Card style={{ padding: 18, background: "var(--success-bg)", border: "1px solid var(--success-soft)" }}>
                <SectionHeader title="Student Feedback Preview" icon={<Icon.feedback size={16} />} />
                <div style={{ marginTop: 10, fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                  {result.student_friendly_feedback.what_is_improving && (
                    <p><strong>What's improving:</strong> {result.student_friendly_feedback.what_is_improving}</p>
                  )}
                  {result.student_friendly_feedback.what_needs_attention && (
                    <p style={{ marginTop: 6 }}><strong>Needs attention:</strong> {result.student_friendly_feedback.what_needs_attention}</p>
                  )}
                  {result.student_friendly_feedback.your_next_step && (
                    <p style={{ marginTop: 6 }}><strong>Your next step:</strong> {result.student_friendly_feedback.your_next_step}</p>
                  )}
                  {result.student_friendly_feedback.closing_message && (
                    <p style={{ marginTop: 8, fontStyle: "italic", color: "var(--text-2)" }}>{result.student_friendly_feedback.closing_message}</p>
                  )}
                </div>
              </Card>
            )}

            {/* Homework preview */}
            {result.homework && (
              <Card style={{ padding: 18 }}>
                <SectionHeader title="Generated Homework" icon={<Icon.homework size={16} />} />
                <pre style={{ marginTop: 10, fontSize: "var(--text-sm)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{result.homework}</pre>
              </Card>
            )}

            {/* Corrections */}
            {result.corrections.length > 0 && (
              <Card style={{ padding: 18 }}>
                <SectionHeader title="Corrections" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {result.corrections.map((c, i) => (
                    <div key={i} style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
                      <div style={{ fontSize: "var(--text-sm)" }}>
                        <span style={{ color: "var(--danger)", textDecoration: "line-through" }}>{c.original}</span>
                        {" → "}
                        <span style={{ color: "var(--success)", fontWeight: 600 }}>{c.improved}</span>
                      </div>
                      {c.why && <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 3 }}>{c.why}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── HISTORY VIEW ─── */}
        {view === "history" && !viewing && (
          <Card style={{ padding: 18 }}>
            <SectionHeader title={`Diagnosis History — ${studentName}`} />
            {studentSessions.length === 0 && (
              <p style={{ color: "var(--muted)", marginTop: 12 }}>No diagnoses yet for this student.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {studentSessions.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--bg)", cursor: "pointer" }} onClick={() => setViewing(s)}>
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", flex: 1 }}>
                    Session {s.sessionOverride || "?"} — {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.overall_result?.slice(0, 60) || s.progress_note || "—"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id); }}>Delete</Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ─── VIEW SINGLE DIAGNOSIS ─── */}
        {view === "history" && viewing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>← Back to history</Button>
            <Card style={{ padding: 18 }}>
              <SectionHeader title={`Session ${viewing.sessionOverride || "?"} — ${new Date(viewing.createdAt).toLocaleDateString('en-GB')}`} />
              {viewing.overall_result && <p style={{ marginTop: 10, lineHeight: 1.6 }}>{viewing.overall_result}</p>}
              {viewing.progress_note && <p style={{ marginTop: 8, fontSize: "var(--text-sm)", color: "var(--text-2)", fontStyle: "italic" }}>{viewing.progress_note}</p>}
            </Card>
            {viewing.section_snapshot && (
              <Card style={{ padding: 18 }}>
                <SectionHeader title="Snapshot" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
                  {viewing.section_snapshot.map(s => (
                    <div key={s.section} style={{ padding: 8, borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-xs)" }}>{s.section}: {fmt4(s.score_0_4)}</div>
                      <SnapshotBar value4={s.score_0_4} />
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {viewing.priorities?.length > 0 && (
              <Card style={{ padding: 18 }}>
                <SectionHeader title="Priorities" />
                {viewing.priorities.filter(p => p.area).map((p, i) => (
                  <div key={i} style={{ padding: 8, marginTop: 8, borderRadius: "var(--radius-sm)", background: "var(--bg)" }}>
                    <strong>{p.urgency}</strong>: {p.area} — {p.what_to_improve}
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* Confirmation dialogs */}
        {confirmNewDiag && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <Card style={{ padding: 24, maxWidth: 400, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: "var(--text-lg)", fontWeight: 700 }}>Discard current result?</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", marginBottom: 16 }}>
                You have an unsaved diagnosis result. Starting a new diagnosis will discard it. Save it first if you want to keep this work.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="ghost" size="sm" onClick={() => setConfirmNewDiag(false)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={() => { setResult(null); setSavedDiagnosisId(null); setConfirmNewDiag(false); }}>Discard & Continue</Button>
              </div>
            </Card>
          </div>
        )}

        {confirmDelete && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <Card style={{ padding: 24, maxWidth: 400, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: "var(--text-lg)", fontWeight: 700 }}>Delete this diagnosis?</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", marginBottom: 16 }}>
                This action cannot be undone. This will permanently delete the diagnosis record and all associated data.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(confirmDelete)}>Delete</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components & styles ──────────────────────────────── */
function SnapshotBar({ value4 }) {
  const scale = Math.max(0, Math.min(1, clampTwoDecimals(value4) / 4));
  return (
    <div style={{ width: "100%", height: 8, borderRadius: "var(--radius-pill)", background: "var(--bg-deep)", overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "var(--radius-pill)", background: "var(--accent)", transform: `scaleX(${scale})`, transformOrigin: "left", transition: "transform 0.4s var(--ease)" }} />
    </div>
  );
}

const labelStyle = { fontSize: "var(--text-sm)", fontWeight: 600, display: "block", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "var(--text-sm)", background: "var(--surface)" };
const thStyle = { textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "var(--muted)" };
const tdStyle = { padding: "6px 8px", verticalAlign: "top" };
