import { useState, useEffect, useRef } from 'react';
import { Icon, Card, SectionHeader, Pill, Avatar, Button, ReviewStatusBadge, callAI, summarizeTranscript } from '../components/shared.jsx';
import { saveFeedback, getFeedback, getSessions, getLatestDiagnosis, getDiagnoses } from '../lib/workflow.js';

// ─── STORAGE ─────────────────────────────────────────────────────
let cachedPdfJs = null;
async function getPdfJs() {
  if (cachedPdfJs) return cachedPdfJs;
  const mod = await import('pdfjs-dist');
  mod.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  cachedPdfJs = mod;
  return mod;
}

function parseAiJson(raw) {
  let text = String(raw || "").replace(/```json|```/gi, "").trim();
  const start = text.indexOf("{");
  if (start >= 0) text = text.slice(start);
  
  try {
    return JSON.parse(text);
  } catch {
    let openBraces = 0, openBrackets = 0, inString = false, escape = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (!inString) {
        if (c === '{') openBraces++;
        if (c === '}') openBraces--;
        if (c === '[') openBrackets++;
        if (c === ']') openBrackets--;
      }
    }
    
    let fixed = text;
    if (inString) fixed += '"';
    fixed = fixed.replace(/,\s*$/, "");
    for (let i = 0; i < openBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces; i++) fixed += '}';
    
    try { return JSON.parse(fixed); } catch {
      const cleaned = fixed.replace(/,\s*([}\]])/g, "$1");
      try { return JSON.parse(cleaned); } catch {}
      throw new Error("AI returned invalid JSON. Please retry.");
    }
  }
}

// ─── STATUS COLORS ───────────────────────────────────────────────
const STATUS_MAP = {
  "Consolidating":   { bg: "var(--success-bg, #ECFDF5)", fg: "var(--success, #059669)" },
  "Developing well": { bg: "var(--info-bg, #EFF6FF)",    fg: "var(--info, #2563EB)" },
  "Developing":      { bg: "var(--info-bg, #EFF6FF)",    fg: "var(--info, #2563EB)" },
  "Priority focus":  { bg: "var(--warning-bg, #FFFBEB)", fg: "var(--warning, #D97706)" },
  "Useful strength": { bg: "var(--success-bg, #ECFDF5)", fg: "var(--success, #059669)" },
  "Needs attention": { bg: "var(--danger-bg, #FEF2F2)",  fg: "var(--danger, #DC2626)" },
};

// ─── CLAUDE PROMPT ───────────────────────────────────────────────
const REPORT_PROMPT = `You are Teacher Vinicius Vieira's feedback assistant for MET Prep (Michigan English Test preparation for Brazilian students at B1–B2 level).

CRITICAL RULES FOR THIS REPORT:
- If MAIN DIFFICULTY is provided by the teacher, that IS the main_diagnosis. Do not invent a different one.
- If EVIDENCE FROM CLASS is provided, use those exact examples in corrections and section analysis. Quote them.
- Use SKILL RATINGS to calibrate section scores and prioritize what to emphasize.
- If Output type is "Brief feedback": keep sections concise, max 2-3 items per list.
- If Output type is "Detailed report" or classes covered > 1: expand all sections, include before/after comparison.
- Always follow diagnosis → evidence → correction → model → practice → next step logic.

Use official MET criteria:
- Speaking: Task Completion, Language Resources, Intelligibility/Delivery
- Writing: Grammatical Accuracy, Vocabulary, Mechanics, Cohesion & Organization, Task Completion
- Listening: detail comprehension, inference, accent flexibility
- Overall MET scale: 0–80 → A2 27–39 · B1 40–52 · B2 53–63 · C1 64–80

Task timing: Task 1/2/3 = 60s, Task 4/5 = 90s.

Feedback style: warm, encouraging, student-facing. Use "what to improve", not harsh labels. Reference actual class evidence. Be specific — quote student utterances.

STUDENT INFORMATION:
{STUDENT_INFO}

CLASS TRANSCRIPT:
{TRANSCRIPT}

Return ONLY valid JSON — no markdown, no backticks, no preamble. The JSON must follow this exact structure:

{
  "progress_summary": {
    "current_level": "e.g. Strong B2, approaching B2+",
    "main_diagnosis": "2-3 sentences: the student's main challenge is not X, it is Y. Be specific about the gap between knowledge and performance.",
    "focus_snapshot": [
      { "area": "Speaking", "work_completed": "What was practiced in this area." },
      { "area": "Listening", "work_completed": "What was practiced." },
      { "area": "Vocabulary", "work_completed": "What was practiced." },
      { "area": "Grammar", "work_completed": "What was practiced." },
      { "area": "Test Strategy", "work_completed": "What was practiced." }
    ],
    "progress_indicators": [
      { "skill": "Vocabulary range", "level": 75 },
      { "skill": "Listening comprehension", "level": 60 },
      { "skill": "Speaking organization", "level": 55 },
      { "skill": "Pacing and control", "level": 40 }
    ]
  },

  "session_glance": [
    { "area": "MET awareness", "evidence": "Specific class evidence.", "status": "Consolidating" },
    { "area": "Speaking fluency", "evidence": "Evidence.", "status": "Developing well" },
    { "area": "Idea organization", "evidence": "Evidence.", "status": "Priority focus" },
    { "area": "Listening confidence", "evidence": "Evidence.", "status": "Priority focus" },
    { "area": "Vocabulary precision", "evidence": "Evidence.", "status": "Developing" },
    { "area": "Reading / grammar base", "evidence": "Evidence.", "status": "Useful strength" }
  ],

  "answer_bridge": {
    "statement": "Say your opinion clearly.",
    "reason": "Explain why your opinion makes sense.",
    "support": "Add one example, detail, or experience.",
    "usage_note": "When and why to use this structure.",
    "quick_model": "A full model answer from today's topic using Statement-Reason-Support."
  },

  "speaking_dev": {
    "summary": "Paragraph summarizing speaking development with evidence.",
    "strengths": [
      { "title": "Strong vocabulary range", "detail": "Evidence of advanced vocabulary use in familiar topics." },
      { "title": "Good engagement", "detail": "Participates actively and discusses complex topics." },
      { "title": "Better response structure", "detail": "Learning to use models such as big picture - details - inference." },
      { "title": "Critical thinking", "detail": "Can compare perspectives and support ideas with experience." }
    ],
    "areas_to_improve": [
      { "area": "Speaking speed", "pattern": "Sometimes speaks too quickly under pressure.", "strategy": "Pause after each main idea. One idea at a time." },
      { "area": "Sentence completion", "pattern": "Starts sentences and moves to new ideas before completing.", "strategy": "Use repair phrases: What I mean is... / Let me explain that more clearly..." },
      { "area": "Precision under pressure", "pattern": "Grammar accuracy drops when rushing.", "strategy": "Slow down first; accuracy will improve immediately." }
    ],
    "example_correction": {
      "original": "Student's actual sentence showing the pattern.",
      "improved": "The same idea expressed clearly and accurately at B2 level."
    }
  },

  "listening_dev": {
    "summary": "Paragraph about listening strengths and next steps.",
    "strengths": [
      { "title": "Detail comprehension", "detail": "Identifies clear info: symptoms, numbers, instructions." },
      { "title": "Accent flexibility", "detail": "Handles different accents well." },
      { "title": "Inference growth", "detail": "Learning to notice tone, hesitation, speaker attitude." }
    ],
    "inference_strategy": [
      { "step": 1, "question": "What is the situation?" },
      { "step": 2, "question": "How does the speaker sound?" },
      { "step": 3, "question": "What is implied but not directly said?" },
      { "step": 4, "question": "Which answer is too extreme or unsupported?" },
      { "step": 5, "question": "Which option has the clearest evidence from the audio?" }
    ],
    "note_taking": [
      { "instead_of": "Long full sentence from audio.", "write_this": "Short keyword version." }
    ]
  },

  "vocab_dev": {
    "summary": "Paragraph about vocabulary strengths.",
    "word_bank": [
      { "word": "word or phrase from class", "meaning": "definition in context", "example": "Example sentence using the word." }
    ],
    "upgrade_targets": [
      { "basic": "happy", "better": "pleased, delighted, joyful, content, cheerful" },
      { "basic": "good", "better": "beneficial, effective, positive, useful, valuable" },
      { "basic": "bad", "better": "negative, harmful, problematic, unfavorable, concerning" },
      { "basic": "sad", "better": "upset, disappointed, discouraged, distressed" },
      { "basic": "important", "better": "essential, significant, necessary, valuable" }
    ]
  },

  "corrections": [
    { "pattern": "exact student utterance", "better_version": "corrected form", "stronger_version": "Stronger MET-level version", "why": "short rule explanation" }
  ],

  "answer_models": [
    { "task": "Describe an image", "basic": "Basic student answer.", "improved": "Full improved version showing structure and vocabulary." },
    { "task": "Personal experience", "basic": "Basic.", "improved": "Improved." },
    { "task": "Opinion question", "basic": "Basic.", "improved": "Improved." }
  ],

  "phrase_bank": [
    { "function": "Give your opinion", "phrases": "In my opinion... / Personally, I think... / From my perspective..." },
    { "function": "Give a reason", "phrases": "This is because... / My main reason is that..." },
    { "function": "Give support", "phrases": "For example... / In my experience..." },
    { "function": "Contrast", "phrases": "However... / On the other hand..." },
    { "function": "Repair your answer", "phrases": "What I mean is... / Let me explain that better." },
    { "function": "Finish clearly", "phrases": "For this reason... / That is why I believe..." }
  ],

  "exercises": [],

  "next_steps": [
    { "skill": "Speaking", "action": "Record one 60-second answer per day.", "success_check": "Did I speak slowly? Did I complete my sentences?" },
    { "skill": "Listening", "action": "Practice inference questions, write keywords not full sentences.", "success_check": "Did I choose the answer with evidence?" },
    { "skill": "Vocabulary", "action": "Upgrade five basic words per week.", "success_check": "Did I avoid repeating happy, good, bad?" },
    { "skill": "Grammar", "action": "Review recurring patterns.", "success_check": "Did I self-correct?" },
    { "skill": "Test Strategy", "action": "Use short mock simulations.", "success_check": "Did I move forward without overthinking?" }
  ],

  "teacher_note": "A warm, personal closing paragraph from Teacher Vinicius. Reference specific progress, encourage the student by name, and frame what comes next. End with something motivational but grounded in evidence."
}`;

// ─── REPORT SECTIONS (toggleable) ────────────────────────────────
const REPORT_SECTIONS = [
  { id: "progress_summary", label: "Overall Progress Summary",   num: "00", default: false },
  { id: "session_glance",   label: "Session at a Glance",        num: "01", default: true },
  { id: "answer_bridge",    label: "MET Answer Bridge",          num: "02", default: true },
  { id: "speaking_dev",     label: "Speaking Development",       num: "03", default: true },
  { id: "listening_dev",    label: "Listening Development",      num: "04", default: false },
  { id: "vocab_dev",        label: "Vocabulary Development",     num: "05", default: true },
  { id: "corrections",      label: "Grammar Focus",              num: "06", default: true },
  { id: "answer_models",    label: "Better Answer Models",       num: "07", default: false },
  { id: "phrase_bank",      label: "Phrase Bank",                num: "08", default: true },
  { id: "exercises",        label: "Homework Exercises",         num: "09", default: true },
  { id: "next_steps",       label: "Recommended Next Steps",     num: "10", default: true },
  { id: "teacher_note",     label: "Teacher's Final Note",       num: "11", default: true },
];

// ─── MATERIAL TYPES ──────────────────────────────────────────────
const MATERIAL_TYPES = [
  { id: "one-class",   label: "One class" },
  { id: "multi-class", label: "Multiple classes" },
  { id: "mock-test",   label: "Mock test" },
  { id: "homework",    label: "Homework correction" },
  { id: "transcript",  label: "Speaking transcript" },
  { id: "writing",     label: "Writing task" },
  { id: "mixed",       label: "Mixed material" },
];

// ─── OUTPUT TYPES ────────────────────────────────────────────────
const OUTPUT_TYPES = [
  { id: "brief",       label: "Brief feedback" },
  { id: "full",        label: "Feedback + homework" },
  { id: "detailed",    label: "Detailed report" },
  { id: "homework",    label: "Homework only" },
  { id: "correction",  label: "Correction bank" },
];

// ─── SKILL RATING KEYS ───────────────────────────────────────────
const SKILL_RATING_KEYS = [
  { id: "speaking_fluency", label: "Speaking fluency" },
  { id: "speaking_org",     label: "Speaking organization" },
  { id: "grammar",          label: "Grammar accuracy" },
  { id: "vocabulary",       label: "Vocabulary range" },
  { id: "listening",        label: "Listening comprehension" },
  { id: "confidence",       label: "Confidence" },
  { id: "met_strategy",     label: "MET strategy" },
];

// ─── EXERCISE TYPES (teacher picks which to include) ─────────────
const EXERCISE_CATALOG = [
  { id: "srs_table",        label: "Statement-Reason-Support table",  focus: "Speaking organization",    default: true },
  { id: "speaking_record",  label: "Speaking recording",              focus: "Fluency",                  default: true },
  { id: "error_correction", label: "Correct the sentences",           focus: "Grammar accuracy",         default: true },
  { id: "level_up",         label: "Level up a sentence",             focus: "Speaking + writing",       default: true },
  { id: "upgrade_answer",   label: "Upgrade a basic answer",         focus: "Speaking + writing",        default: true },
  { id: "vocabulary_bank",  label: "Vocabulary precision bank",       focus: "Vocabulary",               default: true },
  { id: "timed_speaking",   label: "MET opinion answers (timed)",     focus: "Timed speaking",           default: false },
  { id: "listening_task",   label: "Listening mini-task",             focus: "Listening interpretation",  default: false },
  { id: "confidence",       label: "Do not freeze practice",         focus: "Confidence under pressure", default: false },
  { id: "writing_task",     label: "Mini writing task",               focus: "Writing structure",         default: false },
  { id: "error_diary",      label: "Error diary — your sentences",    focus: "Grammar + Vocabulary",     default: false },
  { id: "connector_logic",  label: "Connector logic practice",       focus: "Coherence",                 default: false },
  { id: "image_description",label: "Image description (Task 1)",     focus: "MET Speaking — Task 1",     default: false },
  { id: "personal_exp",     label: "Personal experience (Task 2)",   focus: "MET Speaking — Task 2",     default: false },
  { id: "reflection",       label: "Reflection note to teacher",     focus: "Self-awareness",            default: true },
];

const GENERATOR_DEFAULTS = {
  reportType: "Full Class Progress Report",
  classFocus: "Auto-detect from transcript",
  skillEmphasis: ["Auto-detect"],
  homeworkStyle: "Standard Homework",
  tone: "Warm, Professional, and Diagnostic",
  includeTeacherEvaluation: true,
  includeSupplementalResources: true,
  includeExercises: false,
  mainExamOrGoal: "MET preparation",
};

const GENERATOR_REPORT_TYPES = [
  "Full Class Progress Report",
  "Quick Feedback + Homework",
  "Weekly Consolidated Report",
  "Homework Builder Only",
  "Practice Studio Generator",
];

const GENERATOR_CLASS_FOCUS = [
  "Auto-detect from transcript",
  "Speaking practice",
  "Writing development",
  "Reading strategy",
  "Listening comprehension",
  "Grammar correction",
  "Vocabulary building",
  "Pronunciation / fluency",
  "MET exam strategy",
  "Presentation development",
  "Homework correction",
  "Mixed-skills class",
  "Other",
];

const GENERATOR_SKILL_EMPHASIS = [
  "Auto-detect",
  "Speaking fluency",
  "Speaking organization",
  "Writing structure",
  "Grammar accuracy",
  "Vocabulary range",
  "Connector precision",
  "Reading comprehension",
  "Listening comprehension",
  "Pronunciation",
  "MET task strategy",
  "Confidence under pressure",
  "Homework discipline",
  "Academic organization",
  "Error correction",
  "Presentation delivery",
];

const GENERATOR_HOMEWORK_STYLES = [
  "Light Homework",
  "Standard Homework",
  "Intensive Homework",
  "Exam Simulation Homework",
  "Correction-Based Homework",
  "No Homework",
];

const GENERATOR_TONES = [
  "Warm, Professional, and Diagnostic",
  "Student-Friendly and Simple",
  "Direct and Objective",
  "Formal and Detailed",
  "Encouraging and Motivational",
  "Concise and Practical",
];

const REPORT_TYPE_MODIFIERS = {
  "Full Class Progress Report": "Create a complete student-facing progress report with sections for class overview, objectives, strengths, development areas, homework, progress summary, and strategic focus areas.",
  "Quick Feedback + Homework": "Create a concise student-facing report with class focus, what was done well, what to improve, key corrections, homework checklist, and next class focus.",
  "Weekly Consolidated Report": "Create a weekly student-facing report that consolidates repeated patterns, key improvements, recurring challenges, and next-week goals.",
  "Homework Builder Only": "Do not write a full report. Create personalized homework with objective, skill focus, staged exercises, reflection task, and clear submission instructions.",
  "Practice Studio Generator": "Create a practice mission with 4 levels, bonus challenge, and student-friendly feedback messages.",
};

const HOMEWORK_STYLE_MODIFIERS = {
  "Light Homework": "Create only 2-3 short review tasks.",
  "Standard Homework": "Create 4-6 balanced tasks connected directly to class focus.",
  "Intensive Homework": "Create 8-10 demanding but realistic tasks including timed work when useful.",
  "Exam Simulation Homework": "Create MET-style exam simulation tasks with timed practice and a short reflection.",
  "Correction-Based Homework": "Create homework from student mistakes: rewrite, correct, upgrade, and repeat with better accuracy.",
  "No Homework": "Do not create a checklist. Add a short 'Recommended Review' with 2-3 light suggestions.",
};

const TONE_MODIFIERS = {
  "Warm, Professional, and Diagnostic": "Use a supportive and precise tone with practical next steps.",
  "Student-Friendly and Simple": "Use simple clear English and avoid unexplained technical terms.",
  "Direct and Objective": "Be clear and practical with balanced evidence-based guidance.",
  "Formal and Detailed": "Use a formal tone with detailed progress explanation.",
  "Encouraging and Motivational": "Use confidence-building language while keeping constructive feedback.",
  "Concise and Practical": "Keep output shorter and focused on actions.",
};

function buildGeneratorPrompt(form) {
  const masterPrompt = `You are an expert ESL teacher, MET preparation specialist, and academic progress report writer.

Transform class transcript, lesson summary, teacher notes, or AI meeting notes into a polished student-facing report.

Important rules:
- Do not create a simple meeting summary.
- Do not mention AI or that source was transcript/notes.
- Remove citation markers like [Citação].
- Remove payment, security, platform, login, private business, and internal operational notes.
- Keep only student-learning information: class content, performance, strengths, difficulties, corrections, homework, progress, and next steps.
- Use warm constructive language: what to improve, what to change, next step.
- Do not invent missing details.

VOICE & AUTHENTICITY (write like a real teacher, not a chatbot):
- Speak directly to ${form.studentName || "the student"} in a warm, human teacher voice — personal and specific, never generic or robotic.
- Anchor every comment to a REAL moment from the class: paraphrase what the student actually said or did, the words they used, the question they answered. No vague "good participation" filler.
- Avoid empty praise ("great job!", "well done!") and AI-template phrasing. If you praise something, name exactly what and why.
- Vary your sentence openings and structure — two strengths/corrections should never read like the same template.
- Sound like natural spoken-to-written English: encouraging but honest, concrete, and concise. Never mention AI or that this came from a transcript.`;

  const reportTypeModifier = REPORT_TYPE_MODIFIERS[form.reportType] || REPORT_TYPE_MODIFIERS["Full Class Progress Report"];
  const classFocusModifier = form.classFocus === "Auto-detect from transcript"
    ? "Selected Class Focus: Auto-detect from transcript. Analyze input and detect the true focus."
    : `Selected Class Focus: ${form.classFocus}. Adapt if transcript shows additional focus.`;
  const skillEmphasisModifier = form.skillEmphasis.includes("Auto-detect")
    ? "Selected Skill Emphasis: Auto-detect. Identify and prioritize most relevant skills from transcript."
    : `Selected Skill Emphasis: ${form.skillEmphasis.join(", ")}. Prioritize these skills in analysis, homework, and next steps.`;
  const homeworkStyleModifier = HOMEWORK_STYLE_MODIFIERS[form.homeworkStyle] || HOMEWORK_STYLE_MODIFIERS["Standard Homework"];
  const toneModifier = TONE_MODIFIERS[form.tone] || TONE_MODIFIERS["Warm, Professional, and Diagnostic"];

  const optionalInfo = `Optional Information:
Student name: ${form.studentName || "Not provided"}
Instructor name: ${form.instructorName || "Not provided"}
Class date: ${form.classDate || "Not provided"}
Class time: ${form.classTime || "Not provided"}
Reporting period: ${form.reportingPeriod || "Not provided"}
Main exam or goal: ${form.mainExamOrGoal || "Not provided"}
Next class date/time: ${form.nextClassDateTime || "Not provided"}
Include teacher evaluation: ${form.includeTeacherEvaluation ? "Yes" : "No"}
Include supplemental resources: ${form.includeSupplementalResources ? "Yes" : "No"}
Include exercises: ${form.includeExercises ? "Yes" : "No"}`;

  const schemaInstruction = `Return ONLY valid JSON with this structure:
{
  "progress_summary": {"current_level":"","main_diagnosis":"","focus_snapshot":[{"area":"","work_completed":""}],"progress_indicators":[{"skill":"","level":0}]},
  "session_glance":[{"area":"","evidence":"","status":"Developing"}],
  "answer_bridge":{"statement":"","reason":"","support":"","usage_note":"","quick_model":""},
  "speaking_dev":{"summary":"","strengths":[{"title":"","detail":""}],"areas_to_improve":[{"area":"","pattern":"","strategy":""}],"example_correction":{"original":"","improved":""}},
  "listening_dev":{"summary":"","strengths":[{"title":"","detail":""}],"inference_strategy":[{"step":1,"question":""}],"note_taking":[{"instead_of":"","write_this":""}]},
  "vocab_dev":{"summary":"","word_bank":[{"word":"","meaning":"","example":""}],"upgrade_targets":[{"basic":"","better":""}]},
  "corrections":[{"pattern":"","better_version":"","stronger_version":"","why":""}],
  "answer_models":[{"task":"","basic":"","improved":""}],
  "phrase_bank":[{"function":"","phrases":""}],
  "exercises":[],
  "next_steps":[{"skill":"","action":"","success_check":""}],
  "teacher_note":"",
  "compatibility":{
    "overview":[{"s":"","r":"","t":""}],
    "priorities":[{"l":"1 — HIGH","s":"","tg":"","h":""}],
    "homeworks":[{"num":"01","title":"","skill":"","instruction":"","items":[{"b":"A","t":""}],"deadline":"Before next class"}],
    "feedbacks":[{"type":"overall","text":""}],
    "student_visible_summary":"",
    "private_teacher_note":""
  }
}`;

  return [
    masterPrompt,
    `Report Type: ${form.reportType}. ${reportTypeModifier}`,
    classFocusModifier,
    skillEmphasisModifier,
    `Homework Style: ${form.homeworkStyle}. ${homeworkStyleModifier}`,
    `Tone: ${form.tone}. ${toneModifier}`,
    optionalInfo,
    schemaInstruction,
    `Now transform the following input into the selected output format:\n\n${form.transcriptOrSummary}`,
  ].join("\n\n");
}

function mapCompatibility(report, form) {
  const existing = report?.compatibility || {};
  const overview = (report?.progress_summary?.progress_indicators || []).slice(0, 4).map((item) => ({
    s: item.skill || "Skill",
    r: Number(item.level) >= 70 ? "Achieving" : Number(item.level) >= 50 ? "Developing" : "Priority focus",
    t: Number(item.level) >= 70 ? "Strong evidence" : Number(item.level) >= 50 ? "Developing evidence" : "Needs more samples",
  }));
  const priorities = (report?.next_steps || []).slice(0, 3).map((step, idx) => ({
    l: `${idx + 1} — ${idx === 0 ? "URGENT" : "HIGH"}`,
    s: step.skill || "Skill",
    tg: step.action || "Next target",
    h: step.success_check || "Track completion in next class.",
  }));
  const homeworkItems = (report?.exercises || []).slice(0, 5).map((ex, i) => ({
    b: String.fromCharCode(65 + i),
    t: ex?.instruction || ex?.prompt_text || ex?.title || `Practice task ${i + 1}`,
  }));
  const homeworkSkill = form.classFocus === "Auto-detect from transcript" ? "Mixed skills" : form.classFocus;

  const homeworks = existing.homeworks?.length ? existing.homeworks : [{
    num: "01",
    title: form.reportType === "Homework Builder Only" ? "Personalized Homework Plan" : "Class Follow-up Practice",
    skill: homeworkSkill,
    instruction: `Homework style: ${form.homeworkStyle}`,
    items: homeworkItems.length ? homeworkItems : [{ b: "A", t: "Complete the recommended review tasks." }],
    deadline: form.nextClassDateTime || "Before next class",
    success_criteria: "Student completes all tasks and applies corrections in a follow-up response.",
  }];

  const correctionTemplate = homeworks.map((hw, idx) => ({
    correction_id: `corr-${String(idx + 1).padStart(2, "0")}`,
    homework_id: `hw-${String(idx + 1).padStart(2, "0")}`,
    homework_title: hw.title,
    status: "assigned",
    teacher_notes: {
      what_went_well: "",
      what_to_improve: "",
      what_to_change_next_time: "",
      next_step_checklist: [],
    },
    task_feedback: (hw.items || []).map((item, itemIdx) => ({
      task_id: `task-${idx + 1}-${itemIdx + 1}`,
      label: item.b || String.fromCharCode(65 + itemIdx),
      prompt: item.t || "",
      score: null,
      completed: false,
      note: "",
    })),
  }));

  return {
    overview: existing.overview?.length ? existing.overview : overview,
    priorities: existing.priorities?.length ? existing.priorities : priorities,
    homeworks,
    feedbacks: existing.feedbacks?.length ? existing.feedbacks : [{
      type: "overall",
      text: report?.teacher_note || report?.progress_summary?.main_diagnosis || "Keep practicing with the next-step plan.",
    }],
    corrections: existing.corrections?.length ? existing.corrections : correctionTemplate,
    student_visible_summary: existing.student_visible_summary || report?.progress_summary?.main_diagnosis || "",
    private_teacher_note: existing.private_teacher_note || "",
  };
}

function buildHomeworkPackage(form, report, meta) {
  const homeworks = report?.compatibility?.homeworks || [];
  return homeworks.map((hw, idx) => ({
    id: `hw-${String(idx + 1).padStart(2, "0")}`,
    num: hw.num || String(idx + 1).padStart(2, "0"),
    title: hw.title || `Homework ${idx + 1}`,
    skill: hw.skill || form.classFocus || "Mixed skills",
    instruction: hw.instruction || "",
    expected_output_type: /record|speaking|audio/i.test(`${hw.skill} ${hw.instruction}`) ? "recording" : "text",
    rubric_hint: `Focus on: ${hw.skill || "class targets"}; tone: ${form.tone}`,
    success_criteria: hw.success_criteria || "Complete task with clear structure and corrected language.",
    deadline: hw.deadline || form.nextClassDateTime || "Before next class",
    status: "assigned",
    tasks: (hw.items || []).map((item, taskIdx) => ({
      task_id: `task-${idx + 1}-${taskIdx + 1}`,
      label: item.b || String.fromCharCode(65 + taskIdx),
      prompt: item.t || "",
      expected_output_type: /record|speak|audio/i.test(item.t || "") ? "recording" : "text",
      score: null,
      completion: false,
      correction_note: "",
      what_to_improve: "",
      what_to_change: "",
    })),
    assignment_metadata: {
      studentId: meta.studentId || null,
      studentName: meta.studentName || "",
      session: meta.session || null,
      reportType: form.reportType,
      homeworkStyle: form.homeworkStyle,
      createdAt: new Date().toISOString(),
    },
  }));
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function ToolFeedback({ student, students, onSelectStudent }) {
  const [view, setView] = useState("split");
  const [tab, setTab] = useState("compose");
  const [report, setReport] = useState(null);
  const [transcript, setTranscript] = useState(() => localStorage.getItem("vv:shared_transcript") || "");
  const [reportType, setReportType] = useState(GENERATOR_DEFAULTS.reportType);
  const [classFocus, setClassFocus] = useState(GENERATOR_DEFAULTS.classFocus);
  const [skillEmphasis, setSkillEmphasis] = useState(GENERATOR_DEFAULTS.skillEmphasis);
  const [homeworkStyle, setHomeworkStyle] = useState(GENERATOR_DEFAULTS.homeworkStyle);
  const [tone, setTone] = useState(GENERATOR_DEFAULTS.tone);
  const [studentNameField, setStudentNameField] = useState(student?.name || "");
  const [instructorName, setInstructorName] = useState("Vinicius Vieira");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [mainExamOrGoal, setMainExamOrGoal] = useState(GENERATOR_DEFAULTS.mainExamOrGoal);
  const [nextClassDateTime, setNextClassDateTime] = useState("");
  const [includeTeacherEvaluation, setIncludeTeacherEvaluation] = useState(GENERATOR_DEFAULTS.includeTeacherEvaluation);
  const [includeSupplementalResources, setIncludeSupplementalResources] = useState(GENERATOR_DEFAULTS.includeSupplementalResources);
  const [includeExercises, setIncludeExercises] = useState(GENERATOR_DEFAULTS.includeExercises);
  const [sessionFocus, setSessionFocus] = useState("MET Speaking + Listening");
  const [target, setTarget] = useState("B2 - MET");
  const [currentMarker, setCurrentMarker] = useState("B1/B2 bridge");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoGenerateAfterSave] = useState(false);
  const [saved, setSaved] = useState([]);
  const [latestDiagnosis, setLatestDiagnosis] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [viewingSaved, setViewingSaved] = useState(null);
  const [sections, setSections] = useState(() => REPORT_SECTIONS.filter(s => s.default).map(s => s.id));
  const [exerciseTypes, setExerciseTypes] = useState(() => EXERCISE_CATALOG.filter(e => e.default).map(e => e.id));
  const previewRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── Diagnosis fields (from Diagnosis1.md) ──
  const [materialType, setMaterialType] = useState("one-class");
  const [outputType, setOutputType] = useState("full");
  const [mainDifficulty, setMainDifficulty] = useState("");
  const [mainStrength, setMainStrength] = useState("");
  const [nextPriority, setNextPriority] = useState("");
  const [hwFocus, setHwFocus] = useState("");
  const [classEvidence, setClassEvidence] = useState("");
  const [skillRatings, setSkillRatings] = useState(() =>
    Object.fromEntries(SKILL_RATING_KEYS.map(k => [k.id, 3]))
  );
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [classesCovered, setClassesCovered] = useState(1);
  const [diagReports, setDiagReports] = useState([]);
  const [showDiagPicker, setShowDiagPicker] = useState(false);
  const [, setImportingDiag] = useState(false);
  const [whatChanged, setWhatChanged] = useState("");
  const [grammarProblems, setGrammarProblems] = useState("");
  const [vocabProblems, setVocabProblems] = useState("");
  const [fluencyPatterns, setFluencyPatterns] = useState("");
  const [listeningProblems, setListeningProblems] = useState("");

  const toggleSection = (id) => setSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleExType = (id) => setExerciseTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSkillEmphasis = (label) => {
    setSkillEmphasis((prev) => {
      if (label === "Auto-detect") return ["Auto-detect"];
      const withoutAuto = prev.filter((x) => x !== "Auto-detect");
      const next = withoutAuto.includes(label) ? withoutAuto.filter((x) => x !== label) : [...withoutAuto, label];
      return next.length ? next : ["Auto-detect"];
    });
  };

  useEffect(() => {
    setStudentNameField(student?.name || "");
  }, [student?.name]);

  useEffect(() => {
    (async () => {
      const all = await getFeedback();
      setSaved(all || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const [diag, allDiags] = await Promise.all([
        getLatestDiagnosis(student?.id),
        getDiagnoses(student?.id),
      ]);
      setLatestDiagnosis(diag);
      setDiagnoses(allDiags || []);
      setSelectedDiagnosisId((current) => current && (allDiags || []).some(d => d.id === current) ? current : (allDiags?.[0]?.id || ''));
      if (!transcript && diag?.content?.overall_result) {
        setTranscript(diag.content.overall_result);
      }
      // Auto-load: if a saved diagnosis exists and the teacher has no report
      // in progress yet, hydrate the feedback view straight from it. This is
      // the "one run" path — diagnostic already produced the feedback content.
      if (diag && !report) {
        importFromDiag(diag, { silent: true });
      }
    })();
  }, [student?.id]);

  // When the teacher picks a different diagnosis from the dropdown,
  // re-hydrate the feedback view from it (silently, to avoid toast spam).
  useEffect(() => {
    if (!selectedDiagnosisId) return;
    const diag = diagnoses.find(d => d.id === selectedDiagnosisId);
    if (diag) importFromDiag(diag, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiagnosisId]);

  const loadDiagReports = async () => {
    setImportingDiag(true);
    const diags = await getDiagnoses(student?.id);
    setDiagReports(diags);
    setShowDiagPicker(true);
    setImportingDiag(false);
  };

  const importFromDiag = (diag, opts = {}) => {
    const silent = opts.silent === true;
    const c = diag.content || {};
    const snap = c.section_snapshot || diag.section_snapshot || [];
    // Master Diagnostic already returned a student-friendly feedback object
    // with the exact sections the spec asks for. Prefer it over re-mapping.
    const sff = c.student_friendly_feedback;
    const usingMaster = sff && typeof sff === "object";

    const vocabTable = Array.isArray(c.vocabulary_table) ? c.vocabulary_table : [];
    const wordBank = vocabTable.slice(0, 8).map(v => ({
      word: v.word_or_phrase || "",
      meaning: v.student_friendly_meaning || "",
      example: v.example_sentence || "",
    }));

    const hwDir = c.homework_directions || {};
    const hwExercises = c.homework
      ? [{ type: "speaking", instruction: "Homework from diagnostic", prompt_text: c.homework }]
      : Object.entries(hwDir)
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => ({ type: k, instruction: k.replace(/_/g, " "), prompt_text: v }));

    const teacherNote = (usingMaster && sff.closing_message)
      ? sff.closing_message
      : (c.progress_note || diag.progress_note || "");

    const r = {
      progress_summary: {
        current_level: c.student_profile?.approximate_current_level || diag.studentType || "",
        main_diagnosis: usingMaster
          ? [sff.what_is_improving, sff.what_needs_attention].filter(Boolean).join(" ")
          : (c.overall_result || diag.overall_result || ""),
        focus_snapshot: snap.map(s => ({ area: s.section, work_completed: s.strength || s.gap || "" })),
        progress_indicators: snap.map(s => ({ skill: s.section, level: s.score_0_80 || 0 })),
      },
      session_glance: (c.priorities || diag.priorities || []).slice(0, 5).map(p => ({
        area: p.area,
        evidence: p.evidence || p.pattern || "",
        status: p.urgency === "Critical" ? "Priority focus" : p.urgency === "Developing" ? "Developing" : "Consolidating",
      })),
      answer_bridge: { statement: "", reason: "", support: "", usage_note: "", quick_model: "" },
      speaking_dev: {
        summary: usingMaster ? (sff.what_is_improving || "") : ((diag.strengths || []).slice(0, 2).join("; ") || ""),
        strengths: (Array.isArray(c.strengths_detailed) && c.strengths_detailed.length
          ? c.strengths_detailed.map(s => ({ title: s.title || "", detail: s.evidence || "" }))
          : (diag.strengths || []).map(s => ({ title: String(s).slice(0, 40), detail: s }))),
        areas_to_improve: (Array.isArray(c.weaknesses_detailed) && c.weaknesses_detailed.length
          ? c.weaknesses_detailed.map(w => ({ area: w.title || "", pattern: w.evidence || "", strategy: w.stronger_version || "" }))
          : (diag.improvements || []).map(i => ({ area: String(i).slice(0, 40), pattern: i, strategy: "" }))),
        example_correction: (c.error_bank?.[0] || c.corrections?.[0] || diag.corrections?.[0])
          ? {
              original: (c.error_bank?.[0]?.error || c.corrections?.[0]?.original || diag.corrections?.[0]?.original || ""),
              improved: (c.error_bank?.[0]?.correct || c.corrections?.[0]?.improved || diag.corrections?.[0]?.improved || ""),
            }
          : { original: "", improved: "" },
      },
      listening_dev: { summary: (c.reading_listening_diagnosis && c.reading_listening_diagnosis.main_idea) || "", strengths: [], inference_strategy: [], note_taking: [] },
      vocab_dev: { summary: c.vocabulary_diagnosis || "", word_bank: wordBank, upgrade_targets: [] },
      corrections: (c.error_bank || c.corrections || diag.corrections || []).map(item => ({
        pattern: item.error || item.original || item.pattern || "",
        better_version: item.correct || item.improved || item.better_version || "",
        stronger_version: item.stronger_version || "",
        why: item.explanation || item.why || item.rule_or_strategy || "",
      })),
      answer_models: [],
      phrase_bank: [],
      exercises: hwExercises,
      next_steps: usingMaster
        ? [{ skill: "Next step", action: sff.your_next_step || "", success_check: sff.why_this_matters_for_exam || "" }]
        : (c.priorities || diag.priorities || []).map(p => ({ skill: p.area, action: p.next_focus || "", success_check: "" })),
      teacher_note: teacherNote,
    };
    setReport(r);
    if (diag.mainDiagnosis) setMainDifficulty(diag.mainDiagnosis);
    if (diag.mainStrength) setMainStrength(diag.mainStrength);
    if (diag.mainDifficulty) setMainDifficulty(diag.mainDifficulty);
    if (diag.classEvidence) setClassEvidence(diag.classEvidence);
    if (diag.skillRatings) setSkillRatings(prev => ({ ...prev, ...diag.skillRatings }));
    setShowDiagPicker(false);
    setImportingDiag(false);
    if (!silent) {
      window.toast?.(
        usingMaster
          ? `Loaded Master diagnostic for ${diag.studentName}.`
          : `Loaded diagnostic for ${diag.studentName}.`,
        "ok"
      );
    }
  };

  const meta = {
    studentId: student?.id || null,
    studentName: student?.name || "",
    firstName: student?.firstName || "",
    sessionFocus,
    target,
    currentMarker,
    session: student?.session || 1,
    track: student?.track || "MET",
    code: student?.code || "",
  };

  const buildContext = () => [
    `Student: ${meta.studentName}`,
    `Session: ${meta.session}`,
    `Track: ${meta.track}`,
    `Target: ${target}`,
    `Current marker: ${currentMarker}`,
    `Session focus: ${sessionFocus}`,
    `Material type: ${MATERIAL_TYPES.find(m => m.id === materialType)?.label || materialType}`,
    `Output type requested: ${OUTPUT_TYPES.find(o => o.id === outputType)?.label || outputType}`,
    mainDifficulty ? `MAIN DIFFICULTY (teacher diagnosis): ${mainDifficulty}` : null,
    mainStrength   ? `MAIN STRENGTH (teacher): ${mainStrength}` : null,
    classEvidence  ? `EVIDENCE FROM CLASS (teacher examples): ${classEvidence}` : null,
    nextPriority   ? `Next class priority: ${nextPriority}` : null,
    hwFocus        ? `Homework focus: ${hwFocus}` : null,
    classesCovered > 1 ? `Classes covered: ${classesCovered}` : null,
    whatChanged    ? `What changed across classes: ${whatChanged}` : null,
    grammarProblems ? `Recurring grammar problems: ${grammarProblems}` : null,
    vocabProblems   ? `Vocabulary problems: ${vocabProblems}` : null,
    fluencyPatterns ? `Fluency patterns: ${fluencyPatterns}` : null,
    listeningProblems ? `Listening/reading strategy problems: ${listeningProblems}` : null,
    `Skill ratings (teacher 1-5): ${SKILL_RATING_KEYS.map(k => `${k.label} ${skillRatings[k.id]}/5`).join(', ')}`,
  ].filter(Boolean).join("\n");

  const buildSectionDirective = () => {
    const included = REPORT_SECTIONS.filter(s => sections.includes(s.id)).map(s => `${s.num} ${s.label}`);
    const excluded = REPORT_SECTIONS.filter(s => !sections.includes(s.id)).map(s => `${s.num} ${s.label}`);
    const exTypes = EXERCISE_CATALOG.filter(e => exerciseTypes.includes(e.id)).map(e => `${e.label} [${e.focus}]`);
    return `

SECTION SELECTION (MUST FOLLOW):
- INCLUDE these sections: ${included.join(", ")}
- SKIP these sections (return empty array/object for them): ${excluded.length ? excluded.join(", ") : "none — include all"}
- For homework exercises, use ONLY these exercise types: ${exTypes.join(", ")}
- Generate one exercise per selected type, numbered sequentially.
- For "Level up a sentence" exercises, use this format: give the student 5-8 basic sentences from class and ask them to rewrite each at a higher level (B2). Include columns: "Basic sentence" | "Your B2 version" | "Target structure". Example: "She is happy." → "She appears genuinely pleased." (target: descriptive adjective + adverb).
- For "Error diary" exercises, list 4-6 exact student errors from the transcript with space for: identify problem → write corrected version → write new original sentence using same structure.
- For "Connector logic" exercises, give 5-6 sentences where student chooses the best connector (because/due to/however/consequently/as a result) and explains why.
- For "Image description (Task 1)" exercises, give a workplace/daily life scenario to describe for 60 seconds using: big picture → details → objects → spatial language → final sentence.
- For "Personal experience (Task 2)" exercises, give a question connected to class topics, 60 seconds, using: who/where/when/what + one feeling/reaction.
`;
  };

  /* ── PDF upload ── */
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    try {
      const pdfjsLib = await getPdfJs();
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n\n";
      }
      setTranscript(prev => (prev ? prev + "\n\n" : "") + text);
      window.toast?.(`Extracted ${pdf.numPages} page(s) from "${file.name}"`, "ok");
    } catch (err) {
      console.error(err);
      window.toast?.("Could not read PDF. Try copying text manually.", "error");
    }
    setPdfLoading(false);
    e.target.value = "";
  };

  const generate = async () => {
    if (!transcript.trim()) { setError("Transcript required."); return; }
    setError(""); setLoading(true);
    try {
      const condensed = await summarizeTranscript(transcript);
      const form = {
        transcriptOrSummary: condensed,
        studentName: studentNameField || meta.studentName,
        instructorName,
        classDate,
        classTime,
        reportingPeriod,
        mainExamOrGoal,
        nextClassDateTime,
        reportType,
        classFocus,
        skillEmphasis,
        homeworkStyle,
        tone,
        includeTeacherEvaluation,
        includeSupplementalResources,
        includeExercises,
      };
      const prompt = `${buildGeneratorPrompt(form)}\n\n${buildSectionDirective()}\n\nTeacher context:\n${buildContext()}`;
      // Warmer temperature → more natural, human teacher voice (less template-y).
      const data = await callAI(prompt, { max_tokens: 4096, temperature: 0.7 });
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const parsed = parseAiJson(raw);
      const compatibility = mapCompatibility(parsed, form);
      const normalized = {
        ...parsed,
        compatibility,
      };
      setReport(normalized);
      setTab("compose");
    } catch (e) {
      setError(`Generation failed: ${e.message}`);
      console.error(e);
    }
    setLoading(false);
  };

  const saveSession = async () => {
    if (!report) return;
    const sessions = await getSessions(student?.id);
    const latestSession = sessions?.[0] || null;
    const generatorForm = {
      transcriptOrSummary: transcript,
      studentName: studentNameField || meta.studentName,
      instructorName,
      classDate,
      classTime,
      reportingPeriod,
      mainExamOrGoal,
      nextClassDateTime,
      reportType,
      classFocus,
      skillEmphasis,
      homeworkStyle,
      tone,
      includeTeacherEvaluation,
      includeSupplementalResources,
      includeExercises,
    };
    const assignmentHomework = buildHomeworkPackage(generatorForm, report, meta);
    const assignmentHandoff = {
      studentId: student?.id || null,
      studentName: meta.studentName,
      sessionId: latestSession?.id || null,
      reportType,
      homeworkStyle,
      classFocus,
      assignedAt: new Date().toISOString(),
      workflow: {
        current: "assigned",
        allowedTransitions: ["submitted", "corrected", "revision-requested"],
      },
      tasks: assignmentHomework,
    };
    await saveFeedback({
      sessionId: latestDiagnosis?.sessionId || latestSession?.id || null,
      diagnosisId: latestDiagnosis?.id || null,
      studentId: student?.id || null,
      studentName: meta.studentName,
      report,
      outputType,
      materialType,
      transcript,
      skillRatings,
      metTaskFocus: [],
      exercises: exerciseTypes,
      teacherNote: report.teacher_note || "",
      generatorForm,
      reportType,
      classFocus,
      skillEmphasis,
      homeworkStyle,
      tone,
      studentVisibleSummary: report?.compatibility?.student_visible_summary || report?.progress_summary?.main_diagnosis || "",
      privateTeacherNote: report?.compatibility?.private_teacher_note || "",
      assignmentHandoff,
      correctionWorkflow: {
        status: "assigned",
        transitions: ["assigned", "submitted", "corrected", "revision-requested"],
        corrections: report?.compatibility?.corrections || [],
      },
    });
    const all = await getFeedback();
    setSaved(all || []);
    window.toast && window.toast(`Feedback saved for ${meta.firstName}.`, "go");
    if (autoGenerateAfterSave) generate();
  };

  const clearGenerator = () => {
    setTranscript("");
    localStorage.setItem("vv:shared_transcript", "");
    setReport(null);
    setReportType(GENERATOR_DEFAULTS.reportType);
    setClassFocus(GENERATOR_DEFAULTS.classFocus);
    setSkillEmphasis(GENERATOR_DEFAULTS.skillEmphasis);
    setHomeworkStyle(GENERATOR_DEFAULTS.homeworkStyle);
    setTone(GENERATOR_DEFAULTS.tone);
    setIncludeTeacherEvaluation(GENERATOR_DEFAULTS.includeTeacherEvaluation);
    setIncludeSupplementalResources(GENERATOR_DEFAULTS.includeSupplementalResources);
    setIncludeExercises(GENERATOR_DEFAULTS.includeExercises);
    setClassDate("");
    setClassTime("");
    setReportingPeriod("");
    setMainExamOrGoal(GENERATOR_DEFAULTS.mainExamOrGoal);
    setNextClassDateTime("");
    window.toast?.("Generator cleared.", "info");
  };

  const copyPromptText = async () => {
    const form = {
      transcriptOrSummary: transcript,
      studentName: studentNameField || meta.studentName,
      instructorName,
      classDate,
      classTime,
      reportingPeriod,
      mainExamOrGoal,
      nextClassDateTime,
      reportType,
      classFocus,
      skillEmphasis,
      homeworkStyle,
      tone,
      includeTeacherEvaluation,
      includeSupplementalResources,
      includeExercises,
    };
    const prompt = `${buildGeneratorPrompt(form)}\n\n${buildSectionDirective()}\n\nTeacher context:\n${buildContext()}`;
    await navigator.clipboard.writeText(prompt);
    window.toast?.("Prompt copied.", "ok");
  };

  const copyReportText = async () => {
    if (!report) return;
    const text = JSON.stringify(report, null, 2);
    await navigator.clipboard.writeText(text);
    window.toast?.("Report copied.", "ok");
  };

  const set = (path, val) => {
    setReport(prev => {
      const d = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cur = d;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = val;
      return d;
    });
  };

  const setNested = (key, i, field, val) => {
    setReport(prev => {
      const d = JSON.parse(JSON.stringify(prev));
      d[key][i][field] = val;
      return d;
    });
  };

  const selectedDiagnosis = diagnoses.find(d => d.id === selectedDiagnosisId) || latestDiagnosis;
  const refreshFeedback = async () => {
    const all = await getFeedback();
    setSaved(all || []);
  };
  const generateDiagnosisFeedback = () => {
    if (!selectedDiagnosis) return;
    setFeedbackDraft(buildStudentFeedbackDraft(student, selectedDiagnosis));
    window.toast?.('Feedback draft created from diagnosis.', 'ok');
  };
  const saveDiagnosisFeedback = async (status) => {
    if (!selectedDiagnosis || !feedbackDraft.trim()) return;
    setFeedbackSaving(true);
    await saveFeedback({
      studentId: student?.id || null,
      studentName: student?.name || '',
      diagnosisId: selectedDiagnosis.id,
      sessionId: selectedDiagnosis.sessionId || null,
      content: feedbackDraft,
      teacherNote: feedbackDraft,
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
    });
    await refreshFeedback();
    setFeedbackSaving(false);
    window.toast?.(status === 'published' ? 'Feedback published to student.' : 'Feedback saved as draft.', 'ok');
  };

  return (
    <DiagnosisFeedbackWorkspace
      student={student}
      students={students}
      onSelectStudent={onSelectStudent}
      diagnoses={diagnoses}
      selectedDiagnosisId={selectedDiagnosisId}
      onSelectDiagnosis={setSelectedDiagnosisId}
      selectedDiagnosis={selectedDiagnosis}
      draft={feedbackDraft}
      onDraft={setFeedbackDraft}
      onGenerate={generateDiagnosisFeedback}
      onSave={saveDiagnosisFeedback}
      saving={feedbackSaving}
      saved={saved}
    />
  );

  return (
    !latestDiagnosis ? (
      <div className="page-shell">
        <div className="page-inner-narrow">
          <Card padding={24}>
            <SectionHeader title="Feedback" sub="Diagnosis required first" />
            <p className="text-md text-muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
              This feature is not active yet. Start by creating a diagnosis.
            </p>
            <p className="text-sm text-muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
              Required flow: Diagnose → Feedback → Homework → Student view.
            </p>
          </Card>
        </div>
      </div>
    ) : (
    <div className="paper" style={{ minHeight: "calc(100vh - 64px)", padding: "32px 40px 80px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--accent-deep)", fontSize: 18, fontWeight: 700 }}>iii.</span>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>Student Feedback & Homework Generator</h1>
            <span className="text-sm text-muted">Paste transcript, choose report style, generate student-ready feedback.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {report && <Button variant="ghost" size="sm" icon={<Icon.print />} onClick={() => window.print()}>PDF</Button>}
            {report && <Button variant="ghost" size="sm" onClick={saveSession}>Save</Button>}
            <Button variant="ghost" size="sm" onClick={() => setTab(tab === "saved" ? "compose" : "saved")}>
              Saved ({saved.length})
            </Button>
            {report && (
              <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 2, background: "var(--surface)" }}>
                {["split", "preview"].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    background: view === v ? "var(--primary)" : "transparent",
                    color: view === v ? "var(--on-dark)" : "var(--muted)",
                    border: "none", padding: "6px 14px", borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-ui)", fontSize: 12, cursor: "pointer", textTransform: "capitalize"
                  }}>{v}</button>
                ))}
              </div>
            )}
            <Button variant="primary" size="sm" iconRight={<Icon.arrowR />}
              onClick={() => window.toast && window.toast(`Dispatched to ${meta.firstName}. They'll see it on their dashboard.`, "go")}>
              Dispatch to {meta.firstName}
            </Button>
          </div>
        </header>

        {/* ── Student bar ──────────────────────────────────── */}
        <Card padding={16} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <Avatar name={meta.studentName} size={36} tone="auto" />
          <div style={{ flex: 1 }}>
            <select className="select" value={student?.id || ""} onChange={e => onSelectStudent?.(e.target.value)} style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
              {(students || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="text-sm text-muted">{meta.track} · Session {meta.session} · code <span className="mono">{meta.code}</span></div>
          </div>
          <Pill kind="primary">Session {meta.session}</Pill>
        </Card>

        <section className="ai-review-banner" aria-label="Teacher review workflow" style={{ marginBottom: 20 }}>
          <div>
            <p className="ai-review-kicker">AI supports the teacher</p>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Draft feedback, review it, then publish to the student.
            </h2>
            <p className="text-13 text-muted" style={{ margin: "6px 0 0", maxWidth: 760 }}>
              The student never receives raw AI output. This screen keeps the teacher in control of scores, corrections, examples, homework focus, and final note.
            </p>
          </div>
          <div className="ai-review-statuses">
            <ReviewStatusBadge status={report ? "draft" : "queued"} />
            <ReviewStatusBadge status="reviewed" />
            <ReviewStatusBadge status="published" />
          </div>
        </section>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "1px solid var(--divider)" }}>
          {[
            { id: "compose", label: "Compose" },
            { id: "saved", label: `Saved (${saved.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "transparent", border: "none", padding: "10px 14px",
              fontFamily: "var(--font-ui)", fontSize: 13.5, fontWeight: 500,
              color: tab === t.id ? "var(--text)" : "var(--muted)", cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Saved list ──────────────────────────────────── */}
        {tab === "saved" && (
          <div>
            {viewingSaved ? (
              <div>
                <Button variant="ghost" size="sm" icon={<Icon.arrowL />} onClick={() => setViewingSaved(null)} className="mb-8">Back</Button>
                <ReportPreview report={viewingSaved.report} meta={viewingSaved} activeSections={null} />
              </div>
            ) : saved.length === 0 ? (
              <Card padding={40} style={{ textAlign: "center" }}>
                <p style={{ color: "var(--faint)" }}>No sessions saved yet.</p>
              </Card>
            ) : saved.map(s => (
              <Card key={s.id} padding={16} style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setViewingSaved(s)}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{s.studentName} — Session {s.session}</p>
                  <p style={{ fontSize: 12, color: "var(--faint)" }}>{new Date(s.savedAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <span style={{ color: "var(--faint)" }}>›</span>
              </Card>
            ))}
          </div>
        )}

        {/* ── Compose ─────────────────────────────────────── */}
        {tab === "compose" && (
          <div style={{ display: "grid", gridTemplateColumns: report && view === "split" ? "380px 1fr" : "1fr", gap: 24 }}>

            {/* Left: input panel */}
            {(!report || view === "split") && (
              <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Step 0 — Load from Diagnostic */}
                <Card padding={16} style={{ border: "1.5px solid var(--accent)", background: "var(--accent-soft)" }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <SectionHeader num="↻" title="Load from Diagnostic" />
                    <Button variant="ghost" size="sm" onClick={loadDiagReports}>
                      Browse saved diagnostics
                    </Button>
                  </div>
                  {showDiagPicker && (
                    <div style={{ maxHeight: 220, overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {diagReports.length === 0 ? (
                        <p className="text-sm text-muted" style={{ margin: 0 }}>No saved diagnostics yet. Run a diagnostic first.</p>
                      ) : diagReports.map(d => (
                        <div key={d.id} className="pointer flex-between" style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "var(--surface)", border: "1px solid var(--border)" }} onClick={() => importFromDiag(d)}>
                          <div>
                            <span className="text-13 fw-600">{d.studentName}</span>
                            <span className="text-sm text-muted" style={{ marginLeft: 8 }}>· {new Date(d.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <span className="text-sm text-muted">{d.outputType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted" style={{ margin: "6px 0 0" }}>Import a saved diagnostic report to auto-fill the feedback fields.</p>
                </Card>

                {/* Step 1 — Paste transcript or summary */}
                <Card padding={16}>
                  <SectionHeader num="1" title="Paste Transcript or Summary" />
                  <p className="text-sm text-muted" style={{ margin: "6px 0 10px" }}>
                    Paste class transcript, lesson summary, or teacher notes here.
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <Button variant="ghost" size="sm" icon={<Icon.doc />} onClick={() => pdfInputRef.current?.click()} disabled={pdfLoading}>
                      {pdfLoading ? "Reading PDF…" : "Upload PDF"}
                    </Button>
                    <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdfUpload} />
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.readText().then(t => t && setTranscript(t)).catch(() => {});
                    }}>Clipboard</Button>
                    <span style={{ fontSize: 11, color: "var(--faint)", alignSelf: "center", marginLeft: "auto" }}>
                      {pdfLoading ? "⏳ extracting…" : "PDF, text, or markdown"}
                    </span>
                  </div>
                  <textarea className="textarea" rows={14} value={transcript} onChange={e => {
                    setTranscript(e.target.value);
                    localStorage.setItem("vv:shared_transcript", e.target.value);
                  }}
                    placeholder={"Paste your transcript or class notes here..."} style={{ marginTop: 12 }} />
                </Card>

                {/* Step 2 — Report type */}
                <Card padding={16}>
                  <SectionHeader num="2" title="Choose Report Type" sub="Default: Full Class Progress Report" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {GENERATOR_REPORT_TYPES.map((option) => (
                      <button key={option} onClick={() => setReportType(option)} style={{
                        background: reportType === option ? "var(--accent-deep)" : "var(--surface)",
                        color: reportType === option ? "var(--on-dark)" : "var(--muted)",
                        border: `1px solid ${reportType === option ? "var(--accent-deep)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: 12,
                        cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: reportType === option ? 600 : 400,
                      }}>{option}</button>
                    ))}
                  </div>
                </Card>

                {/* Step 3 — Class focus */}
                <Card padding={16}>
                  <SectionHeader num="3" title="Choose Class Focus" sub="Default: Auto-detect from transcript" />
                  <select className="select" value={classFocus} onChange={(e) => setClassFocus(e.target.value)} style={{ marginTop: 10 }}>
                    {GENERATOR_CLASS_FOCUS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Card>

                {/* Step 4 — Skill emphasis */}
                <Card padding={16}>
                  <SectionHeader num="4" title="Choose Skill Emphasis" sub="Select multiple if needed" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {GENERATOR_SKILL_EMPHASIS.map((option) => (
                      <button key={option} onClick={() => toggleSkillEmphasis(option)} style={{
                        background: skillEmphasis.includes(option) ? "var(--primary)" : "var(--surface)",
                        color: skillEmphasis.includes(option) ? "var(--on-dark)" : "var(--muted)",
                        border: `1px solid ${skillEmphasis.includes(option) ? "var(--primary)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: 11.5,
                        cursor: "pointer", fontFamily: "var(--font-ui)",
                      }}>{option}</button>
                    ))}
                  </div>
                </Card>

                {/* Step 5 — Homework style */}
                <Card padding={16}>
                  <SectionHeader num="5" title="Choose Homework Style" sub="Default: Standard Homework" />
                  <select className="select" value={homeworkStyle} onChange={(e) => setHomeworkStyle(e.target.value)} style={{ marginTop: 10 }}>
                    {GENERATOR_HOMEWORK_STYLES.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Card>

                {/* Step 6 — Tone */}
                <Card padding={16}>
                  <SectionHeader num="6" title="Choose Tone" sub="Default: Warm, Professional, and Diagnostic" />
                  <select className="select" value={tone} onChange={(e) => setTone(e.target.value)} style={{ marginTop: 10 }}>
                    {GENERATOR_TONES.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Card>

                {/* Step 7 — Optional fields */}
                <Card padding={16}>
                  <SectionHeader num="7" title="Optional Fields" />
                  <div style={{ display: "grid", gap: 9, marginTop: 10 }}>
                    <div>
                      <label className="field-label">Student name</label>
                      <input className="input" value={studentNameField} onChange={(e) => setStudentNameField(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Instructor name</label>
                      <input className="input" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label className="field-label">Class date</label>
                        <input className="input" value={classDate} onChange={(e) => setClassDate(e.target.value)} placeholder="YYYY-MM-DD" />
                      </div>
                      <div>
                        <label className="field-label">Class time</label>
                        <input className="input" value={classTime} onChange={(e) => setClassTime(e.target.value)} placeholder="19:00" />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Reporting period</label>
                      <input className="input" value={reportingPeriod} onChange={(e) => setReportingPeriod(e.target.value)} placeholder="Week 3 · May 2026" />
                    </div>
                    <div>
                      <label className="field-label">Main exam or goal</label>
                      <input className="input" value={mainExamOrGoal} onChange={(e) => setMainExamOrGoal(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Next class date/time</label>
                      <input className="input" value={nextClassDateTime} onChange={(e) => setNextClassDateTime(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      <button onClick={() => setIncludeTeacherEvaluation(v => !v)} style={{ border: "1px solid var(--border)", background: includeTeacherEvaluation ? "var(--success-bg, #ECFDF5)" : "var(--surface)", color: includeTeacherEvaluation ? "var(--success, #059669)" : "var(--muted)", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 11 }}>Include teacher evaluation: {includeTeacherEvaluation ? "Yes" : "No"}</button>
                      <button onClick={() => setIncludeSupplementalResources(v => !v)} style={{ border: "1px solid var(--border)", background: includeSupplementalResources ? "var(--success-bg, #ECFDF5)" : "var(--surface)", color: includeSupplementalResources ? "var(--success, #059669)" : "var(--muted)", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 11 }}>Include supplemental resources: {includeSupplementalResources ? "Yes" : "No"}</button>
                      <button onClick={() => setIncludeExercises(v => !v)} style={{ border: "1px solid var(--border)", background: includeExercises ? "var(--success-bg, #ECFDF5)" : "var(--surface)", color: includeExercises ? "var(--success, #059669)" : "var(--muted)", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 11 }}>Include exercises: {includeExercises ? "Yes" : "No"}</button>
                    </div>
                  </div>
                </Card>

                {/* Step 2 — Quick teacher notes */}
                <Card padding={16}>
                  <SectionHeader num="2" title="Teacher notes" sub="5 required fields" />
                  <div style={{ display: "grid", gap: 9, marginTop: 10 }}>
                    <div>
                      <label className="field-label">Class focus</label>
                      <input className="input" value={sessionFocus} onChange={e => setSessionFocus(e.target.value)} placeholder="e.g. MET Speaking + Listening" />
                    </div>
                    <div>
                      <label className="field-label">Main student strength</label>
                      <input className="input" value={mainStrength} onChange={e => setMainStrength(e.target.value)} placeholder="e.g. Rich professional vocabulary, natural storytelling" />
                    </div>
                    <div>
                      <label className="field-label">Main student difficulty <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input className="input" value={mainDifficulty} onChange={e => setMainDifficulty(e.target.value)} placeholder="e.g. Past simple collapses under pressure, not vocabulary" />
                    </div>
                    <div>
                      <label className="field-label">Next class priority</label>
                      <input className="input" value={nextPriority} onChange={e => setNextPriority(e.target.value)} placeholder="e.g. Re-tell drill + article set" />
                    </div>
                    <div>
                      <label className="field-label">Homework focus</label>
                      <input className="input" value={hwFocus} onChange={e => setHwFocus(e.target.value)} placeholder="e.g. Confidence under pressure, speaking structure" />
                    </div>
                  </div>
                </Card>

                {/* Step 2b — Evidence from class */}
                <Card padding={16}>
                  <SectionHeader num="·" title="Evidence from class" sub="2–5 examples — optional but powerful" />
                  <textarea className="textarea" rows={3} value={classEvidence} onChange={e => setClassEvidence(e.target.value)}
                    placeholder={"She restarted sentences several times.\nShe used good healthcare vocabulary.\nShe confused when to use opinion connectors."} style={{ marginTop: 8, fontSize: 12.5 }} />
                </Card>

                {/* Step 2c — Skill ratings */}
                <Card padding={16}>
                  <SectionHeader num="·" title="Skill ratings" sub="rate 1–5 to calibrate report" />
                  <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
                    {SKILL_RATING_KEYS.map(k => (
                      <div key={k.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
                        <label className="text-sm text-muted">{k.label}</label>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={() => setSkillRatings(r => ({ ...r, [k.id]: n }))} style={{
                              width: 26, height: 26, borderRadius: "var(--radius-sm)",
                              border: "1px solid " + (skillRatings[k.id] >= n ? "var(--primary)" : "var(--border)"),
                              background: skillRatings[k.id] >= n ? "var(--primary)" : "var(--surface)",
                              color: skillRatings[k.id] >= n ? "var(--on-dark)" : "var(--muted)",
                              cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-ui)"
                            }}>{n}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Legacy output tuning */}
                <Card padding={16}>
                  <SectionHeader num="·" title="Legacy output tuning" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {OUTPUT_TYPES.map(o => (
                      <button key={o.id} onClick={() => setOutputType(o.id)} style={{
                        background: outputType === o.id ? "var(--accent-deep)" : "var(--surface)",
                        color: outputType === o.id ? "var(--on-dark)" : "var(--muted)",
                        border: `1px solid ${outputType === o.id ? "var(--accent-deep)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)", padding: "5px 11px", fontSize: 12,
                        cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: outputType === o.id ? 600 : 400,
                      }}>{o.label}</button>
                    ))}
                  </div>
                </Card>

                {/* Step 4 — Advanced options (detailed/multi-class) */}
                {(outputType === "detailed" || materialType === "multi-class" || materialType === "mock-test") && (
                  <Card padding={16} style={{ border: "1px solid var(--accent-deep)" }}>
                    <button onClick={() => setShowAdvanced(v => !v)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                      background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", padding: 0
                    }}>
                      <SectionHeader num="4" title="Advanced options" sub="for detailed/multi-class reports" />
                      <span style={{ fontSize: 18, color: "var(--accent-deep)" }}>{showAdvanced ? "−" : "+"}</span>
                    </button>
                    {showAdvanced && (
                      <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label className="field-label">Target level</label>
                            <input className="input" value={target} onChange={e => setTarget(e.target.value)} />
                          </div>
                          <div>
                            <label className="field-label">Current marker</label>
                            <input className="input" value={currentMarker} onChange={e => setCurrentMarker(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="field-label">What changed from first class to now?</label>
                          <textarea className="textarea" rows={2} value={whatChanged} onChange={e => setWhatChanged(e.target.value)}
                            placeholder="e.g. Speaking speed improved, grammar still unstable under pressure" style={{ fontSize: 12.5 }} />
                        </div>
                        <div>
                          <label className="field-label">Recurring grammar problems</label>
                          <input className="input" value={grammarProblems} onChange={e => setGrammarProblems(e.target.value)}
                            placeholder="e.g. Past simple, article before professional roles" />
                        </div>
                        <div>
                          <label className="field-label">Vocabulary problems</label>
                          <input className="input" value={vocabProblems} onChange={e => setVocabProblems(e.target.value)}
                            placeholder="e.g. Over-uses 'good', 'bad', 'happy'" />
                        </div>
                        <div>
                          <label className="field-label">Fluency patterns</label>
                          <input className="input" value={fluencyPatterns} onChange={e => setFluencyPatterns(e.target.value)}
                            placeholder="e.g. Mid-clause restarts, speed drop under pressure" />
                        </div>
                        <div>
                          <label className="field-label">Listening/reading strategy problems</label>
                          <input className="input" value={listeningProblems} onChange={e => setListeningProblems(e.target.value)}
                            placeholder="e.g. Strong on detail, weak on inference" />
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Section selector */}
                <Card padding={16}>
                  <SectionHeader title="Report sections" sub="toggle on/off" />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {REPORT_SECTIONS.map(s => (
                      <button key={s.id} onClick={() => toggleSection(s.id)} style={{
                        background: sections.includes(s.id) ? "var(--primary)" : "var(--surface)",
                        color: sections.includes(s.id) ? "var(--on-dark)" : "var(--muted)",
                        border: `1px solid ${sections.includes(s.id) ? "var(--primary)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 11,
                        cursor: "pointer", fontFamily: "var(--font-ui)",
                      }}>
                        <span style={{ fontWeight: 700, marginRight: 4 }}>{s.num}</span>{s.label}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Exercise type selector */}
                {sections.includes("exercises") && (
                  <Card padding={16}>
                    <SectionHeader title="Exercise types" sub={`${exerciseTypes.length} selected`} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {EXERCISE_CATALOG.map(ex => (
                        <button key={ex.id} onClick={() => toggleExType(ex.id)} style={{
                          background: exerciseTypes.includes(ex.id) ? "var(--success-bg, #ECFDF5)" : "var(--surface)",
                          color: exerciseTypes.includes(ex.id) ? "var(--success, #059669)" : "var(--muted)",
                          border: `1px solid ${exerciseTypes.includes(ex.id) ? "var(--success, #059669)" : "var(--border)"}`,
                          borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 11,
                          cursor: "pointer", fontFamily: "var(--font-ui)",
                        }}>
                          {ex.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => setExerciseTypes(EXERCISE_CATALOG.map(e => e.id))} style={{
                        background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                        padding: "3px 8px", fontSize: 10, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-ui)"
                      }}>Select all</button>
                      <button onClick={() => setExerciseTypes(EXERCISE_CATALOG.filter(e => e.default).map(e => e.id))} style={{
                        background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                        padding: "3px 8px", fontSize: 10, color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-ui)"
                      }}>Reset defaults</button>
                    </div>
                  </Card>
                )}

                {/* Generate */}
                <Button variant="primary" onClick={generate} disabled={loading || !transcript.trim()}
                  style={{ width: "100%", justifyContent: "center", padding: "14px" }}>
                  {loading ? "Generating Report..." : "Generate Report"}
                </Button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Button variant="ghost" size="sm" onClick={clearGenerator}>Clear</Button>
                  <Button variant="ghost" size="sm" onClick={copyPromptText}>Copy Prompt</Button>
                  <Button variant="ghost" size="sm" onClick={copyReportText} disabled={!report}>Copy Report</Button>
                  <Button variant="ghost" size="sm" icon={<Icon.print />} onClick={() => window.print()} disabled={!report}>Download .pdf</Button>
                </div>

                {error && (
                  <Card padding={12} style={{ background: "var(--danger-bg, #FEF2F2)", border: "1px solid var(--danger, #DC2626)" }}>
                    <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>
                  </Card>
                )}

                {/* Editor (only when report exists) */}
                {report && <ReportEditor report={report} set={set} setNested={setNested} setReport={setReport} />}
              </div>
            )}

            {/* Right: preview */}
            {report && (
              <div ref={previewRef} className="print-area">
                <ReportPreview report={report} meta={meta} activeSections={sections} />
              </div>
            )}

            {/* Empty state */}
            {!report && !loading && (
              <Card padding={60} style={{ textAlign: "center", gridColumn: "1 / -1" }}>
                <p style={{ fontSize: 40, marginBottom: 16 }}>📋</p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Ready to generate</h2>
                <p className="text-13 text-muted">Paste transcript and hit Generate. Claude builds full report + 10 exercises.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
    )
  );
}

// ═════════════════════════════════════════════════════════════════
// REPORT EDITOR (left panel — editable fields)
// ═════════════════════════════════════════════════════════════════
function ReportEditor({ report, set, setNested, setReport }) {
  const addCorrection = () => setReport(r => ({ ...r, corrections: [...(r.corrections || []), { pattern: "", better_version: "", stronger_version: "", why: "" }] }));
  const addPhrase = () => setReport(r => ({ ...r, phrase_bank: [...(r.phrase_bank || []), { function: "", phrases: "" }] }));
  const addGlance = () => setReport(r => ({ ...r, session_glance: [...(r.session_glance || []), { area: "", evidence: "", status: "Developing" }] }));

  return (
    <>
      {/* 1. Progress Summary */}
      {report.progress_summary && (
        <Card padding={16}>
          <SectionHeader num="1" title="Progress Summary" />
          <label className="field-label">Current level</label>
          <input className="input" value={report.progress_summary.current_level || ""} onChange={e => set("progress_summary.current_level", e.target.value)} />
          <label className="field-label" style={{ marginTop: 10 }}>Main diagnosis</label>
          <textarea className="textarea" rows={3} value={report.progress_summary.main_diagnosis || ""} onChange={e => set("progress_summary.main_diagnosis", e.target.value)} />
        </Card>
      )}

      {/* Session at a Glance */}
      <Card padding={16}>
        <SectionHeader num="" title="Session at a Glance" />
        {(report.session_glance || []).map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: 8, marginBottom: 8 }}>
            <input className="input" value={row.area} onChange={e => setNested("session_glance", i, "area", e.target.value)} placeholder="Area" />
            <input className="input" value={row.evidence} onChange={e => setNested("session_glance", i, "evidence", e.target.value)} placeholder="Class evidence" />
            <select className="select" value={row.status} onChange={e => setNested("session_glance", i, "status", e.target.value)} style={{ minWidth: 130 }}>
              {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<Icon.plus />} onClick={addGlance}>Add row</Button>
      </Card>

      {/* 2. Speaking Development */}
      {report.speaking_dev && (
        <Card padding={16}>
          <SectionHeader num="2" title="Speaking Development" />
          <label className="field-label">Summary</label>
          <textarea className="textarea" rows={3} value={report.speaking_dev.summary || ""} onChange={e => set("speaking_dev.summary", e.target.value)} />
          <label className="field-label" style={{ marginTop: 10 }}>Example correction — original</label>
          <input className="input" value={report.speaking_dev.example_correction?.original || ""} onChange={e => set("speaking_dev.example_correction.original", e.target.value)} />
          <label className="field-label" style={{ marginTop: 6 }}>Example correction — improved</label>
          <input className="input" value={report.speaking_dev.example_correction?.improved || ""} onChange={e => set("speaking_dev.example_correction.improved", e.target.value)} />
        </Card>
      )}

      {/* 3. Listening Development */}
      {report.listening_dev && (
        <Card padding={16}>
          <SectionHeader num="3" title="Listening Development" />
          <label className="field-label">Summary</label>
          <textarea className="textarea" rows={3} value={report.listening_dev.summary || ""} onChange={e => set("listening_dev.summary", e.target.value)} />
        </Card>
      )}

      {/* 4. Vocabulary Development */}
      {report.vocab_dev && (
        <Card padding={16}>
          <SectionHeader num="4" title="Vocabulary Development" />
          <label className="field-label">Summary</label>
          <textarea className="textarea" rows={3} value={report.vocab_dev.summary || ""} onChange={e => set("vocab_dev.summary", e.target.value)} />
        </Card>
      )}

      {/* 5. Grammar Focus */}
      <Card padding={16}>
        <SectionHeader num="5" title="Grammar Focus" />
        {(report.corrections || []).map((c, i) => (
          <div key={i} style={{ background: "var(--bg-deep)", borderRadius: "var(--radius-md)", padding: 10, marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
              <div>
                <div className="field-label">From class</div>
                <input className="input" value={c.pattern} onChange={e => setNested("corrections", i, "pattern", e.target.value)} />
              </div>
              <div>
                <div className="field-label">Better version</div>
                <input className="input" value={c.better_version} onChange={e => setNested("corrections", i, "better_version", e.target.value)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
              <div>
                <div className="field-label">Stronger (MET-level)</div>
                <input className="input" value={c.stronger_version || ""} onChange={e => setNested("corrections", i, "stronger_version", e.target.value)} />
              </div>
              <div>
                <div className="field-label">Why it matters</div>
                <input className="input" value={c.why} onChange={e => setNested("corrections", i, "why", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<Icon.plus />} onClick={addCorrection}>Add correction</Button>
      </Card>

      {/* Phrase Bank */}
      <Card padding={16}>
        <SectionHeader num="" title="Useful Speaking Starters" />
        {(report.phrase_bank || []).map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, marginBottom: 8 }}>
            <input className="input" value={p.function} onChange={e => setNested("phrase_bank", i, "function", e.target.value)} placeholder="Function" />
            <input className="input" value={p.phrases} onChange={e => setNested("phrase_bank", i, "phrases", e.target.value)} placeholder="Phrases separated by /" />
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<Icon.plus />} onClick={addPhrase}>Add phrase</Button>
      </Card>

      {/* 7. Next Steps */}
      {(report.next_steps || []).length > 0 && (
        <Card padding={16}>
          <SectionHeader num="7" title="Next Steps" />
          {report.next_steps.map((ns, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <input className="input" value={ns.skill} onChange={e => setNested("next_steps", i, "skill", e.target.value)} placeholder="Skill" />
              <input className="input" value={ns.action} onChange={e => setNested("next_steps", i, "action", e.target.value)} placeholder="Action" />
              <input className="input" value={ns.success_check} onChange={e => setNested("next_steps", i, "success_check", e.target.value)} placeholder="Success check" />
            </div>
          ))}
        </Card>
      )}

      {/* Teacher Note */}
      <Card padding={16}>
        <SectionHeader num="" title="Teacher's Final Note" />
        <textarea className="textarea" rows={4} value={typeof report.teacher_note === "string" ? report.teacher_note : ""} onChange={e => set("teacher_note", e.target.value)} placeholder="Personal closing paragraph..." />
      </Card>
    </>
  );
}

// ─── Markdown export ──────────────────────────────────────────────
function generateMarkdown(report, meta) {
  const lines = [];
  const h1 = (t) => lines.push("# " + t);
  const h2 = (t) => lines.push("## " + t);
  const h3 = (t) => lines.push("### " + t);
  const p = (t) => { if (t) lines.push("", t, ""); };
  const table = (headers, rows) => {
    lines.push("| " + headers.join(" | ") + " |");
    lines.push("| " + headers.map(() => "---").join(" | ") + " |");
    rows.forEach(r => lines.push("| " + r.join(" | ") + " |"));
  };

  h1(`Detailed Feedback Report — ${meta.studentName}`);
  p(`${meta.sessionFocus} | ${meta.target}`);
  p(`**Current Level:** ${report.progress_summary?.current_level || meta.currentMarker}  `);
  p(`**Prepared by:** Teacher Vinicius Vieira  `);

  if (report.progress_summary?.main_diagnosis) {
    p(`> **Focus for the next stage:** ${report.progress_summary.main_diagnosis.split(".").slice(0, 2).join(".")}.`);
  }

  h2("1. Overall Progress Summary");
  if (report.progress_summary?.main_diagnosis) p(report.progress_summary.main_diagnosis);
  if (report.progress_summary?.focus_snapshot?.length) {
    p("");
    table(["Area", "Work Completed"], report.progress_summary.focus_snapshot.map(f => [f.area, f.work_completed]));
  }
  if (report.progress_summary?.progress_indicators?.length) {
    h3("Progress Indicators");
    report.progress_summary.progress_indicators.forEach(ind => {
      const bar = "█".repeat(Math.round(ind.level / 10)) + "░".repeat(10 - Math.round(ind.level / 10));
      p(`- **${ind.skill}** — ${bar} ${ind.level}%`);
    });
  }

  h2("2. Speaking Development");
  if (report.speaking_dev?.summary) p(report.speaking_dev.summary);
  if (report.speaking_dev?.strengths?.length) {
    h3("Speaking Strengths");
    report.speaking_dev.strengths.forEach(s => p(`- **${s.title}:** ${s.detail}`));
  }
  if (report.speaking_dev?.areas_to_improve?.length) {
    h3("Areas to Improve");
    table(["Area", "Pattern", "Strategy"], report.speaking_dev.areas_to_improve.map(a => [a.area, a.pattern, a.strategy]));
  }
  if (report.speaking_dev?.example_correction) {
    h3("Example: Sentence Control");
    p(`**Original:** "${report.speaking_dev.example_correction.original}"`);
    p(`**Improved:** "${report.speaking_dev.example_correction.improved}"`);
  }

  h2("3. Listening Development");
  if (report.listening_dev?.summary) p(report.listening_dev.summary);
  if (report.listening_dev?.strengths?.length) {
    h3("Listening Strengths");
    report.listening_dev.strengths.forEach(s => p(`- **${s.title}:** ${s.detail}`));
  }
  if (report.listening_dev?.inference_strategy?.length) {
    h3("Inference Strategy Steps");
    report.listening_dev.inference_strategy.forEach(s => p(`${s.step}. ${s.question}`));
  }
  if (report.listening_dev?.note_taking?.length) {
    h3("Note-Taking Upgrade");
    table(["Instead of writing...", "Write this"], report.listening_dev.note_taking.map(n => [n.instead_of, n.write_this]));
  }

  h2("4. Vocabulary Development");
  if (report.vocab_dev?.summary) p(report.vocab_dev.summary);
  if (report.vocab_dev?.word_bank?.length) {
    h3("Word Bank");
    table(["Word / Phrase", "Meaning", "Example"], report.vocab_dev.word_bank.map(w => [w.word, w.meaning, w.example]));
  }
  if (report.vocab_dev?.upgrade_targets?.length) {
    h3("Vocabulary Upgrade Targets");
    table(["Basic Word", "Better Options"], report.vocab_dev.upgrade_targets.map(u => [u.basic, u.better]));
  }

  h2("5. Grammar Focus");
  if (report.corrections?.length) {
    table(["From Class", "Corrected", "Stronger (MET)", "Why"], report.corrections.map(c => [c.pattern, c.better_version, c.stronger_version || "—", c.why]));
  }

  if (report.answer_models?.length) {
    h2("6. Better Answer Models");
    report.answer_models.forEach(m => {
      p(`**${m.task}**`);
      p(`- Basic: "${m.basic}"`);
      p(`- Improved: "${m.improved}"`);
    });
  }

  if (report.phrase_bank?.length) {
    h2("Useful Speaking Starters");
    table(["Function", "Phrases"], report.phrase_bank.map(pb => [pb.function, pb.phrases]));
  }

  if (report.next_steps?.length) {
    h2("7. Recommended Next Steps");
    table(["Skill", "Daily Action", "Success Check"], report.next_steps.map(ns => [ns.skill, ns.action, ns.success_check]));
  }

  if (report.teacher_note) {
    h2("Teacher's Final Note");
    p(report.teacher_note);
    p("— Teacher Vinicius Vieira  ");
    p("Source: Classroom observation summary. This report is student-facing and designed for motivation, clarity, and next-step guidance.");
  }

  return lines.join("\n");
}

// ═════════════════════════════════════════════════════════════════
// REPORT PREVIEW (student-facing view)
// ═════════════════════════════════════════════════════════════════
function ReportPreview({ report, meta, activeSections }) {
  if (!report) return null;
  const show = (id) => !activeSections || activeSections.includes(id);
  const [compatTab, setCompatTab] = useState("report");
  const compatibility = report.compatibility || {};

  return (
    <div style={{ fontFamily: "var(--font-ui)" }}>

      {/* ── Branded header ─────────────────────────────────── */}
      <Card padding={0} style={{ overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: "var(--primary)", padding: "28px 32px", color: "var(--on-dark)" }}>
          <div className="eyebrow" style={{ color: "var(--on-dark-muted, rgba(255,255,255,0.5))", marginBottom: 6 }}>Detailed Feedback Report</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-display)" }}>{meta.studentName}</h1>
          <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>{meta.sessionFocus} | {meta.target}</p>
        </div>
        <div style={{ padding: "16px 32px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 13 }}>
          <div><span className="field-label">Current Level</span><br />{report.progress_summary?.current_level || meta.currentMarker}</div>
          <div><span className="field-label">Target</span><br />{meta.target}</div>
          <div><span className="field-label">Period</span><br />{meta.sessionFocus}</div>
          <div><span className="field-label">Prepared by</span><br />Teacher Vinicius Vieira</div>
        </div>
        {/* Focus for next stage */}
        {report.progress_summary?.main_diagnosis && (
          <div style={{ padding: "14px 32px", borderTop: "1px solid var(--divider)", background: "var(--warning-bg, #FFFBEB)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warning, #D97706)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Focus for the next stage: </span>
            <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{
              report.progress_summary.main_diagnosis.split(".").slice(0, 2).join(".") + "."
            }</span>
          </div>
        )}
      </Card>

      {/* ── Download button ────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Button variant="ghost" size="sm" icon={<Icon.print />} onClick={() => window.print()}>Print</Button>
        <Button variant="ghost" size="sm" icon={<Icon.doc />} onClick={() => {
          const md = generateMarkdown(report, meta);
          navigator.clipboard.writeText(md);
          window.toast?.("Markdown copied to clipboard", "ok");
        }}>Copy Markdown</Button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { id: "report", label: "Report" },
          { id: "homeworks", label: "Homeworks" },
          { id: "feedbacks", label: "Feedbacks" },
          { id: "corrections", label: "Corrections" },
        ].map((t) => (
          <button key={t.id} onClick={() => setCompatTab(t.id)} style={{
            background: compatTab === t.id ? "var(--primary)" : "var(--surface)",
            color: compatTab === t.id ? "var(--on-dark)" : "var(--muted)",
            border: `1px solid ${compatTab === t.id ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            padding: "6px 12px",
            fontSize: 12,
            fontFamily: "var(--font-ui)",
            cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {compatTab === "homeworks" && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title="Homework Packages" />
          {(compatibility.homeworks || []).length === 0 ? (
            <p className="text-sm text-muted" style={{ marginTop: 10 }}>No homework package generated yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {compatibility.homeworks.map((hw, i) => (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{hw.num || String(i + 1).padStart(2, "0")} · {hw.title}</p>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>Skill: {hw.skill || "Mixed skills"}</p>
                  <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--text-2)" }}>{hw.instruction}</p>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(hw.items || []).map((it, j) => <li key={j} style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 4 }}>{it.b}. {it.t}</li>)}
                  </ul>
                  <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--warning, #D97706)" }}>Deadline: {hw.deadline || "Before next class"}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {compatTab === "feedbacks" && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title="Student-facing Feedback Summary" />
          {(compatibility.feedbacks || []).length === 0 ? (
            <p className="text-sm text-muted" style={{ marginTop: 10 }}>No feedback summary generated yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {compatibility.feedbacks.map((fb, i) => (
                <div key={i} style={{ background: "var(--bg-deep)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>{fb.type || "feedback"}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{fb.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {compatTab === "corrections" && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title="Homework Corrections Workflow" />
          {(compatibility.corrections || []).length === 0 ? (
            <p className="text-sm text-muted" style={{ marginTop: 10 }}>No correction workflow entries yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {compatibility.corrections.map((corr, i) => (
                <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{corr.homework_id} · {corr.homework_title}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--info, #2563EB)", textTransform: "uppercase" }}>{corr.status}</span>
                  </div>
                  <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
                    {(corr.task_feedback || []).map((tf, j) => (
                      <li key={j} style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 4 }}>
                        {tf.task_id}: score {tf.score ?? "—"} · {tf.completed ? "completed" : "pending"} {tf.note ? `· ${tf.note}` : ""}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    What to improve: {corr.teacher_notes?.what_to_improve || "—"} | What to change: {corr.teacher_notes?.what_to_change_next_time || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {compatTab === "report" && (
      <>
      {/* ── 1. Overall Progress Summary ────────────────────── */}
      {show("progress_summary") && report.progress_summary && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="1" title="Overall Progress Summary" />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
            <Pill kind="primary">{report.progress_summary.current_level}</Pill>
          </div>
          {report.progress_summary.main_diagnosis && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: "14px 0 0" }}>{report.progress_summary.main_diagnosis}</p>
          )}
          {(report.progress_summary.focus_snapshot || []).length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 16 }}>
              <thead>
                <tr style={{ background: "var(--bg-deep)" }}>
                  {["Area", "Work Completed"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.progress_summary.focus_snapshot.map((f, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)", width: "25%" }}>{f.area}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)", lineHeight: 1.5 }}>{f.work_completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(report.progress_summary.progress_indicators || []).length > 0 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progress Indicators</p>
              {report.progress_summary.progress_indicators.map((ind, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>{ind.skill}</span>
                    <span style={{ color: "var(--muted)" }}>{ind.level}%</span>
                  </div>
                  <div style={{ background: "var(--bg-deep)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                    <div style={{ background: ind.level >= 70 ? "var(--success, #059669)" : ind.level >= 50 ? "var(--info, #2563EB)" : "var(--warning, #D97706)", height: "100%", width: `${ind.level}%`, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Session at a Glance ────────────────────────────── */}
      {show("session_glance") && (report.session_glance || []).length > 0 && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title="Session at a Glance" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "var(--bg-deep)" }}>
                {["Area", "Class Evidence", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.session_glance.map((row, i) => {
                const st = STATUS_MAP[row.status] || STATUS_MAP["Developing"];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)" }}>{row.area}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)", lineHeight: 1.5 }}>{row.evidence}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: st.bg, color: st.fg, borderRadius: "var(--radius-pill)", padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{row.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Answer Bridge ──────────────────────────────────── */}
      {show("answer_bridge") && report.answer_bridge?.statement && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title="MET Speaking Formula" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "var(--primary)", color: "var(--on-dark)" }}>
                {["Statement", "Reason", "Support"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "12px 14px", color: "var(--text)", lineHeight: 1.5, borderBottom: "1px solid var(--border)" }}>{report.answer_bridge.statement}</td>
                <td style={{ padding: "12px 14px", color: "var(--text)", lineHeight: 1.5, borderBottom: "1px solid var(--border)" }}>{report.answer_bridge.reason}</td>
                <td style={{ padding: "12px 14px", color: "var(--text)", lineHeight: 1.5, borderBottom: "1px solid var(--border)" }}>{report.answer_bridge.support}</td>
              </tr>
            </tbody>
          </table>
          {report.answer_bridge.usage_note && (
            <p className="text-13 text-muted mt-5" style={{ lineHeight: 1.6 }}>{report.answer_bridge.usage_note}</p>
          )}
          {report.answer_bridge.quick_model && (
            <div style={{ background: "var(--primary)", borderRadius: "var(--radius-md)", padding: "14px 16px", marginTop: 14 }}>
              <div className="eyebrow" style={{ color: "var(--on-dark-muted, rgba(255,255,255,0.5))", marginBottom: 6 }}>Quick model from today's topic</div>
              <p style={{ fontSize: 14, color: "var(--on-dark)", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{report.answer_bridge.quick_model}</p>
            </div>
          )}
        </Card>
      )}

      {/* ── 2. Speaking Development ─────────────────────────── */}
      {show("speaking_dev") && report.speaking_dev && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="2" title="Speaking Development" />
          {report.speaking_dev.summary && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: "12px 0 0" }}>{report.speaking_dev.summary}</p>
          )}
          {(report.speaking_dev.strengths || []).length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              {report.speaking_dev.strengths.map((s, i) => (
                <div key={i} style={{ background: "var(--success-bg, #ECFDF5)", border: "1px solid var(--success, #059669)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--success, #059669)", margin: "0 0 4px" }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>{s.detail}</p>
                </div>
              ))}
            </div>
          )}
          {(report.speaking_dev.areas_to_improve || []).length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 18, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Areas to Improve</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--warning-bg, #FFFBEB)" }}>
                    {["Area", "Pattern", "Strategy"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--warning, #D97706)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.speaking_dev.areas_to_improve.map((a, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)" }}>{a.area}</td>
                      <td style={{ padding: "10px 14px", color: "var(--muted)", lineHeight: 1.5 }}>{a.pattern}</td>
                      <td style={{ padding: "10px 14px", color: "var(--success, #059669)", fontWeight: 500, lineHeight: 1.5 }}>{a.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {report.speaking_dev.example_correction && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--danger-bg, #FEF2F2)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--danger, #DC2626)", margin: "0 0 4px" }}>ORIGINAL</p>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{report.speaking_dev.example_correction.original}</p>
              </div>
              <div style={{ background: "var(--success-bg, #ECFDF5)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--success, #059669)", margin: "0 0 4px" }}>IMPROVED</p>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{report.speaking_dev.example_correction.improved}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── 3. Listening Development ────────────────────────── */}
      {show("listening_dev") && report.listening_dev && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="3" title="Listening Development" />
          {report.listening_dev.summary && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: "12px 0 0" }}>{report.listening_dev.summary}</p>
          )}
          {(report.listening_dev.strengths || []).length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
              {report.listening_dev.strengths.map((s, i) => (
                <div key={i} style={{ background: "var(--info-bg, #EFF6FF)", border: "1px solid var(--info, #2563EB)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--info, #2563EB)", margin: "0 0 4px" }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, margin: 0 }}>{s.detail}</p>
                </div>
              ))}
            </div>
          )}
          {(report.listening_dev.inference_strategy || []).length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 18, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Inference Strategy Steps</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {report.listening_dev.inference_strategy.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-deep)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "var(--on-dark)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.step}</span>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{s.question}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {(report.listening_dev.note_taking || []).length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 18, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Note-Taking Upgrade</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg-deep)" }}>
                    {["Instead of writing...", "Write this"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.listening_dev.note_taking.map((n, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 14px", color: "var(--danger)", fontStyle: "italic" }}>{n.instead_of}</td>
                      <td style={{ padding: "10px 14px", color: "var(--success, #059669)", fontWeight: 500 }}>{n.write_this}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      )}

      {/* ── 4. Vocabulary Development ──────────────────────── */}
      {show("vocab_dev") && report.vocab_dev && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="4" title="Vocabulary Development" />
          {report.vocab_dev.summary && (
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", margin: "12px 0 0" }}>{report.vocab_dev.summary}</p>
          )}
          {(report.vocab_dev.word_bank || []).length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 16 }}>
              <thead>
                <tr style={{ background: "var(--primary)", color: "var(--on-dark)" }}>
                  {["Word / Phrase", "Meaning", "Example"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.vocab_dev.word_bank.map((w, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)" }}>{w.word}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{w.meaning}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5 }}>{w.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(report.vocab_dev.upgrade_targets || []).length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 18, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Upgrade Targets</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--warning-bg, #FFFBEB)" }}>
                    {["Stop using...", "Try instead..."].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--warning, #D97706)", fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.vocab_dev.upgrade_targets.map((u, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 14px", color: "var(--danger)", fontWeight: 600, width: "25%" }}>{u.basic}</td>
                      <td style={{ padding: "10px 14px", color: "var(--success, #059669)", lineHeight: 1.5 }}>{u.better}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      )}

      {/* ── 5. Grammar Focus ────────────────────────────────── */}
      {show("corrections") && (report.corrections || []).length > 0 && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="5" title="Grammar Focus" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "var(--bg-deep)" }}>
                {["From Class", "Better Version", "Stronger (MET)", "Why"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.corrections.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", color: "var(--danger)", fontStyle: "italic" }}>{c.pattern}</td>
                  <td style={{ padding: "10px 14px", color: "var(--info, #2563EB)", fontWeight: 500 }}>{c.better_version}</td>
                  <td style={{ padding: "10px 14px", color: "var(--success, #059669)", fontWeight: 600 }}>{c.stronger_version || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{c.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── 6. Better Answer Models ────────────────────────── */}
      {show("answer_models") && (report.answer_models || []).length > 0 && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="6" title="Better Answer Models" />
          {report.answer_models.map((m, i) => (
            <div key={i} style={{ marginTop: i === 0 ? 12 : 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.task}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "var(--warning-bg, #FFFBEB)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--warning, #D97706)", margin: "0 0 4px" }}>BASIC</p>
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{m.basic}</p>
                </div>
                <div style={{ background: "var(--success-bg, #ECFDF5)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--success, #059669)", margin: "0 0 4px" }}>IMPROVED</p>
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{m.improved}</p>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ── Useful Speaking Starters ───────────────────────── */}
      {show("phrase_bank") && (report.phrase_bank || []).length > 0 && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title="Useful Speaking Starters" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "var(--primary)", color: "var(--on-dark)" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, width: "30%" }}>Function</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 }}>Phrases You Can Use</th>
              </tr>
            </thead>
            <tbody>
              {report.phrase_bank.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)" }}>{p.function}</td>
                  <td style={{ padding: "10px 14px", color: "var(--muted)", lineHeight: 1.6 }}>{p.phrases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Homework Exercises (unnumbered) ───────────────── */}
      {show("exercises") && (report.exercises || []).length > 0 && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="" title={`Homework — ${(report.exercises || []).length} Practice Exercises`} />
          <div style={{ background: "var(--primary)", borderRadius: "var(--radius-md)", padding: "12px 16px", margin: "12px 0 16px" }}>
            <div className="eyebrow" style={{ color: "var(--on-dark-muted, rgba(255,255,255,0.5))", marginBottom: 4 }}>How to use this homework</div>
            <p style={{ fontSize: 13, color: "var(--on-dark)", lineHeight: 1.6, margin: 0 }}>
              First, read your feedback. Then complete the exercises. The goal is not to be perfect — the goal is to train your brain to organize answers faster and continue speaking even when the topic changes.
            </p>
          </div>
          {report.exercises.map((ex, i) => (
            <ExercisePreview key={i} ex={ex} />
          ))}
        </Card>
      )}

      {/* ── 7. Recommended Next Steps ──────────────────────── */}
      {show("next_steps") && (report.next_steps || []).length > 0 && (
        <Card padding={20} className="mb-7">
          <PreviewSectionHead num="7" title="Recommended Next Steps" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: "var(--primary)", color: "var(--on-dark)" }}>
                {["Skill", "Daily Action", "Success Check"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.next_steps.map((ns, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--primary)", width: "18%" }}>{ns.skill}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text)", lineHeight: 1.5 }}>{ns.action}</td>
                  <td style={{ padding: "10px 14px", color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5 }}>{ns.success_check}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Teacher's Final Note ────────────────────────────── */}
      {show("teacher_note") && report.teacher_note && (
        <Card padding={20} style={{ marginBottom: 16, background: "var(--info-bg, #EFF6FF)", border: "1px solid var(--info, #2563EB)" }}>
          <PreviewSectionHead num="" title="Teacher's Final Note" />
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text)", margin: "14px 0 0" }}>{report.teacher_note}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", marginTop: 14, marginBottom: 0 }}>— Teacher Vinicius Vieira</p>
        </Card>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid var(--divider)" }}>
        <p style={{ fontSize: 11, color: "var(--faint)", margin: 0 }}>Teacher Vinicius Vieira · MET Proficiency Mastery · Feedback & Homework</p>
      </div>
      </>
      )}
    </div>
  );
}

// ─── EXERCISE PREVIEW ─────────────────────────────────────────
function ExercisePreview({ ex }) {
  const focusColor =
    ex.focus?.includes("Grammar") ? "var(--accent-deep, #7C3AED)" :
    ex.focus?.includes("Speaking") || ex.focus?.includes("Fluency") || ex.focus?.includes("Confidence") ? "var(--danger, #DC2626)" :
    ex.focus?.includes("Vocabulary") ? "var(--info, #2563EB)" :
    ex.focus?.includes("Listening") ? "var(--success, #059669)" :
    ex.focus?.includes("Writing") ? "var(--warning, #D97706)" :
    "var(--accent-deep)";

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16, className: "mb-5" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: focusColor, background: `${focusColor}15`, borderRadius: 6, padding: "3px 8px" }}>{ex.number}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{ex.label}</span>
        <span style={{ fontSize: 11, color: focusColor, background: `${focusColor}10`, borderRadius: "var(--radius-pill)", padding: "2px 8px", fontWeight: 500 }}>{ex.focus}</span>
      </div>
      <p className="text-13 text-muted" style={{ lineHeight: 1.65, fontStyle: "italic", margin: "0 0 10px" }}>{ex.instruction}</p>

      {/* Table type (Statement-Reason-Support) */}
      {ex.type === "table" && ex.items && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-deep)" }}>
              {["Question", "Statement", "Reason", "Support / Example"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ex.items.map((item, j) => (
              <tr key={j} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px", color: "var(--text)", fontSize: 12 }}>{item.question}</td>
                <td style={{ padding: "8px 10px", color: "var(--faint)" }}>___</td>
                <td style={{ padding: "8px 10px", color: "var(--faint)" }}>___</td>
                <td style={{ padding: "8px 10px", color: "var(--faint)" }}>___</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Error correction */}
      {ex.type === "error_correction" && ex.items && ex.items.map((item, j) => (
        <div key={j} style={{ background: "var(--danger-bg, #FEF2F2)", borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: "var(--muted)", marginRight: 8 }}>{j + 1}.</span>
          <span style={{ color: "var(--danger)" }}>{item.wrong}</span>
          <span style={{ color: "var(--faint)", marginLeft: 8 }}>→ ___________</span>
        </div>
      ))}

      {/* Vocabulary */}
      {ex.type === "vocabulary" && ex.items && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-deep)" }}>
              {["Word / Expression", "Meaning", "Your Sentence"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ex.items.map((item, j) => (
              <tr key={j} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text)" }}>{item.word}</td>
                <td style={{ padding: "8px 10px", color: "var(--muted)" }}>{item.meaning}</td>
                <td style={{ padding: "8px 10px", color: "var(--faint)" }}>___________</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Timed speaking */}
      {ex.type === "timed_speaking" && ex.questions && ex.questions.map((q, j) => (
        <div key={j} style={{ background: "var(--bg-deep)", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{q.question}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "var(--faint)" }}>
            <span>Statement: ___________</span>
            <span>Reason: ___________</span>
            <span>Support: ___________</span>
            <span>Final idea: ___________</span>
          </div>
        </div>
      ))}

      {/* Speaking / recording */}
      {(ex.type === "speaking" || ex.type === "confidence") && (
        <div style={{ background: "var(--danger-bg, #FEF2F2)", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", margin: "0 0 4px" }}>RECORD YOURSELF{ex.duration_seconds ? ` — ${ex.duration_seconds} seconds` : ""}</p>
          {ex.topics && (
            <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px" }}>
              {ex.topics.map((t, j) => <li key={j} style={{ fontSize: 12, color: "var(--text)", marginBottom: 4 }}>{t}</li>)}
            </ul>
          )}
          {ex.self_eval && (
            <div style={{ marginTop: 10, background: "rgba(255,255,255,0.6)", borderRadius: 6, padding: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>After each recording, answer:</p>
              {ex.self_eval.map((q, j) => <p key={j} style={{ fontSize: 12, color: "var(--text)", margin: "0 0 4px" }}>› {q}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Listening */}
      {ex.type === "listening" && ex.questions_list && (
        <ol style={{ margin: "8px 0 0", padding: "0 0 0 20px" }}>
          {ex.questions_list.map((q, j) => <li key={j} style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, marginBottom: 4 }}>{q}</li>)}
        </ol>
      )}

      {/* Level up sentences */}
      {ex.type === "level_up" && ex.items && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-deep)" }}>
              {["#", "Basic Sentence", "Your B2 Version", "Target Structure"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: 10, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ex.items.map((item, j) => (
              <tr key={j} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--muted)", width: 30 }}>{j + 1}</td>
                <td style={{ padding: "8px 10px", color: "var(--danger)", fontStyle: "italic" }}>{item.basic || item.wrong}</td>
                <td style={{ padding: "8px 10px", color: "var(--faint)" }}>___________</td>
                <td style={{ padding: "8px 10px", color: "var(--success)", fontSize: 11 }}>{item.target || item.structure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Connector logic */}
      {ex.type === "connector_logic" && ex.items && ex.items.map((item, j) => (
        <div key={j} style={{ background: "var(--bg-deep)", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: "var(--text)", margin: "0 0 6px" }}>
            <span style={{ fontWeight: 600, color: "var(--muted)", marginRight: 8 }}>{j + 1}.</span>
            {item.sentence}
          </p>
          {item.options && <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 4px" }}>Options: {item.options.join(" / ")}</p>}
          <p style={{ fontSize: 11, color: "var(--faint)" }}>Answer: ___________ Why: ___________</p>
        </div>
      ))}

      {/* Error diary */}
      {ex.type === "error_diary" && ex.items && ex.items.map((item, j) => (
        <div key={j} style={{ background: "var(--bg-deep)", borderRadius: "var(--radius-md)", padding: 12, marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{j + 1}. "{item.wrong}"</p>
          <p className="text-sm text-muted mb-3 m-0">Issue: {item.issue}</p>
          <p style={{ fontSize: 12, color: "var(--faint)", margin: "0 0 4px" }}>› Corrected: ___________</p>
          <p style={{ fontSize: 12, color: "var(--faint)", margin: 0 }}>› Your new sentence: ___________</p>
        </div>
      ))}

      {/* Image description (Task 1) */}
      {ex.type === "image_description" && (
        <div style={{ background: "var(--danger-bg, #FEF2F2)", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", margin: "0 0 8px" }}>RECORD YOURSELF — 60 seconds</p>
          <p style={{ fontSize: 12, color: "var(--text)", margin: "0 0 6px" }}>Follow this order:</p>
          <ol style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "var(--text)" }}>
            <li>Big picture first</li>
            <li>Broad details — who, what, setting</li>
            <li>Objects and evidence</li>
            <li>Spatial language (foreground, background)</li>
            <li>Final sentence</li>
          </ol>
          {ex.keyword_plan && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Keyword plan:</p>
              {[1, 2, 3].map(n => <p key={n} style={{ fontSize: 12, color: "var(--faint)", margin: "0 0 4px" }}>_________________________</p>)}
            </div>
          )}
        </div>
      )}

      {/* Personal experience (Task 2) */}
      {ex.type === "personal_exp" && (
        <div style={{ background: "var(--danger-bg, #FEF2F2)", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", margin: "0 0 4px" }}>RECORD YOURSELF — 60 seconds</p>
          {ex.prompt_text && <p style={{ fontSize: 13, color: "var(--text)", margin: "8px 0", fontStyle: "italic" }}>{ex.prompt_text}</p>}
          <p className="text-sm text-muted mt-3">Include: who, where, when, what happened, and one feeling or reaction.</p>
        </div>
      )}

      {/* Upgrade */}
      {ex.type === "upgrade" && (
        <div>
          <div style={{ background: "var(--warning-bg, #FFFBEB)", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", marginBottom: 4 }}>Basic answer to upgrade</p>
            <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{ex.basic_answer}</p>
          </div>
          <p style={{ fontSize: 13, color: "var(--faint)" }}>Your improved answer: ___________</p>
        </div>
      )}

      {/* Writing */}
      {ex.type === "writing" && ex.topic && (
        <div style={{ background: "var(--bg-deep)", borderRadius: 8, padding: "10px 14px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>Topic</p>
          <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{ex.topic}</p>
        </div>
      )}

      {/* Reflection */}
      {ex.type === "reflection" && (
        <div style={{ background: "var(--bg-deep)", borderRadius: 8, padding: "10px 14px", color: "var(--faint)", fontSize: 12, lineHeight: 2 }}>
          ___________________________________________________________<br />
          ___________________________________________________________
        </div>
      )}
    </div>
  );
}

// ─── SECTION HEAD (preview) ──────────────────────────────────
function PreviewSectionHead({ num, title }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{num}</span>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text)" }}>{title}</h2>
    </div>
  );
}

function DiagnosisFeedbackWorkspace({
  student,
  students,
  onSelectStudent,
  diagnoses,
  selectedDiagnosisId,
  onSelectDiagnosis,
  selectedDiagnosis,
  draft,
  onDraft,
  onGenerate,
  onSave,
  saving,
  saved,
}) {
  const studentItems = (saved || []).filter(item => item.studentId === student?.id);
  const published = studentItems.filter(item => item.status === 'published');
  const drafts = studentItems.filter(item => item.status !== 'published');

  return (
    <div className="page-shell">
      <div className="page-inner">
        <SectionHeader title="Feedback" sub="Select a saved diagnosis, generate feedback, edit, then publish" />

        <Card style={{ margin: '12px 0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <label style={simpleFieldLabel}>Student
              <select className="input" value={student?.id || ''} onChange={e => onSelectStudent?.(e.target.value)} style={{ marginTop: 6 }}>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label style={simpleFieldLabel}>Diagnosis history
              <select className="input" value={selectedDiagnosisId} onChange={e => onSelectDiagnosis(e.target.value)} style={{ marginTop: 6 }} disabled={!diagnoses.length}>
                {diagnoses.map(d => <option key={d.id} value={d.id}>{formatDiagnosisLabel(d)}</option>)}
              </select>
            </label>
            <Button variant="primary" size="sm" onClick={onGenerate} disabled={!selectedDiagnosis}>
              Generate feedback
            </Button>
          </div>
        </Card>

        {!selectedDiagnosis ? (
          <Card>
            <SectionHeader title="No diagnosis found" sub="Run Diagnose before creating connected feedback" />
            <p className="text-sm text-muted" style={{ marginTop: 8, lineHeight: 1.7 }}>
              No diagnosis found for this student. Run a diagnosis first or create feedback manually later.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 20 }}>
            <Card>
              <SectionHeader title="Student-facing feedback" sub="Warm, clear, and editable before publishing" />
              <textarea
                className="input"
                value={draft}
                onChange={e => onDraft(e.target.value)}
                placeholder="Generate feedback from the selected diagnosis, then edit it here..."
                rows={16}
                style={{ marginTop: 8 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Button variant="ghost" onClick={() => onSave('draft')} disabled={saving || !draft.trim()}>
                  Save draft
                </Button>
                <Button variant="accent" onClick={() => onSave('published')} disabled={saving || !draft.trim()}>
                  Publish to student
                </Button>
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card>
                <SectionHeader title="Diagnosis source" sub={formatDiagnosisLabel(selectedDiagnosis)} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Pill tone="accent">Reusable diagnosis</Pill>
                  <Pill tone="info">{selectedDiagnosis.metConnections?.[0] || selectedDiagnosis.metConnection || 'MET focus'}</Pill>
                </div>
                <SmallList title="Strengths" items={selectedDiagnosis.strengths} />
                <SmallList title="What to improve" items={selectedDiagnosis.weaknesses || selectedDiagnosis.improvementAreas} />
                <SmallList title="Next steps" items={selectedDiagnosis.nextSteps} />
              </Card>

              <Card>
                <SectionHeader title="Feedback history" sub={`${published.length} published · ${drafts.length} draft(s)`} />
                {studentItems.slice(0, 5).map((item, i) => (
                  <div key={item.id} style={{ borderTop: i > 0 ? '1px solid var(--divider)' : 'none', paddingTop: i > 0 ? 11 : 0, marginTop: i > 0 ? 11 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{item.status === 'published' ? 'Published feedback' : 'Draft feedback'}</strong>
                      <Pill tone={item.status === 'published' ? 'success' : 'muted'}>{item.status || 'draft'}</Pill>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '6px 0 0' }}>
                      {(item.content || item.teacherNote || item.studentVisibleSummary || '').slice(0, 120) || 'Saved feedback'}
                    </p>
                  </div>
                ))}
                {!studentItems.length && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>No feedback saved for this student yet.</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SmallList({ title, items }) {
  const list = (items || []).filter(Boolean).slice(0, 3);
  if (!list.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{title}</div>
      <ul style={{ paddingLeft: 18, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
        {list.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function buildStudentFeedbackDraft(student, diagnosis) {
  const firstName = student?.firstName || student?.name || 'You';
  const strengths = (diagnosis.strengths || []).filter(Boolean).slice(0, 3);
  const improve = (diagnosis.weaknesses || diagnosis.improvementAreas || []).filter(Boolean).slice(0, 3);
  const grammar = (diagnosis.grammarIssues || []).filter(Boolean).slice(0, 2);
  const vocabulary = (diagnosis.vocabularyIssues || []).filter(Boolean).slice(0, 2);
  const met = (diagnosis.metConnections || [diagnosis.metConnection]).filter(Boolean).slice(0, 2);
  const next = (diagnosis.nextSteps || [diagnosis.priorityFocus]).filter(Boolean).slice(0, 3);
  return [
    `Hi ${firstName},`,
    '',
    'Here is your feedback from our latest MET preparation work.',
    '',
    'What you did well:',
    bulletLines(strengths, 'You participated well and showed useful control of the class focus.'),
    '',
    'What to improve:',
    bulletLines(improve, 'Keep working on accuracy, organization, and clearer examples.'),
    '',
    'Main correction points:',
    bulletLines([...grammar, ...vocabulary], 'Use the corrected language from class slowly and deliberately.'),
    '',
    'MET skill connection:',
    bulletLines(met, 'This connects directly to clearer MET speaking and writing performance.'),
    '',
    'Next focus:',
    bulletLines(next, 'For the next class, focus on one clear answer structure and a smaller number of accurate sentences.'),
    '',
    'Teacher note:',
    'You are making real progress. The next step is to make your answers more controlled, complete, and easy to follow.'
  ].join('\n');
}

function bulletLines(items, fallback) {
  const list = items?.length ? items : [fallback];
  return list.map(item => `- ${item}`).join('\n');
}

const simpleFieldLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

function formatDiagnosisLabel(diagnosis) {
  const date = diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Saved diagnosis';
  const focus = diagnosis?.priorityFocus || diagnosis?.nextSteps?.[0] || diagnosis?.weaknesses?.[0] || 'MET focus';
  return `${date} - ${String(focus).slice(0, 48)}`;
}
