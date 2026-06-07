/**
 * prompts.js — Diagnostic prompt for MET teaching platform.
 * Wired with official MET scoring rubrics, CEFR bands, and all skill subskills.
 *
 * CRITICAL RULES:
 * - Only diagnose skills that were evaluated with evidence.
 * - Unevaluated skills = "Not evaluated enough — 0 turns/evidence."
 * - Unevaluated skill scores = null (never 0, never "—").
 * - Compare to selected target profile, not generic MET.
 * - No invented performance for unevaluated skills.
 */

// ━━━ SHARED DATA FORMATS ━━━

export const SHARED_MET_DATA = `━━━ MET SCORING REFERENCE ━━━
CEFR Score Bands (MET 0–80 scale):
  C1: 64–80 | B2: 53–63 | B1: 40–52 | A2: 27–39 | Below A2: 0–26

Healthcare target context: VisaScreen / work visa requires overall ≥58, speaking ≥59. CGFNS licensure requires speaking ≥55.

MET Speaking Rating Scale (3 categories, each scored 0–4):
  Task Completion — Relevance to task, quantity of language, elaboration with supporting detail
    4 = fully relevant, extensive supporting detail
    3 = relevant, completes task, general detail only
    2 = mostly relevant, some difficulty completing task
    1 = short/simple, difficulty completing task
    0 = no response or completely irrelevant
  Language Resources — Vocabulary range/appropriacy, grammar accuracy and complexity, fluency
    4 = complex grammar controlled, broad appropriate vocab, errors infrequent and not distracting
    3 = some complex structures, appropriate vocab, no errors causing misunderstanding
    2 = simple patterns generally controlled, noticeable errors but intended meaning clear
    1 = simple/short sentences, basic grammar/vocab errors, limited range
    0 = insufficient language to produce meaningful response
  Intelligibility / Delivery — Pronunciation, rhythm, hesitation, clarity
    4 = smooth delivery, minimal hesitation, clear and easy to understand
    3 = some hesitation, generally clear, only a few individual words unclear
    2 = sometimes hesitant, pauses/reformulations, listener effort required in stretches
    1 = frequent pauses, false starts, reformulations, speech requires significant listener effort
    0 = not comprehensible even to a sympathetic listener
  ⚠ SPEAKING AUDIO RULE: If evidence is transcript-only (no audio), do NOT score Intelligibility/Delivery — set score0to4 to null and note "audio required — transcript only."

MET Speaking Task Map (use this when diagnosing speaking evidence — match evidence to the correct task type):
  Q1 | 60s | Picture description      | Neutral/descriptive  | Full spatial coverage; foreground/background/centre/left/right; precise nouns | Only 1 element described; vague words ("a big thing")
  Q2 | 60s | Personal experience      | Informal/narrative   | Setup → event → outcome arc; past tense control; narrative connectors        | No sequence; tense switching mid-story
  Q3 | 60s | Opinion / preference     | Informal/committed   | One clear position stated early; two developed reasons; SINGLE side only     | Giving both sides weakens commitment; no elaboration
  Q4 | 90s | Advantages & disadvantages | Neutral/balanced   | BOTH sides required (~40s per side); neutral register; transition pivot      | Only one side = ~1/3 of task score lost
  Q5 | 90s | Roleplay — persuade authority | Formal/one-sided | Position stated in first 10–15s; formal register ("I strongly believe..."); maintained throughout | Under-committing; using informal register with authority figure

  ⚠ Q4 CRITICAL RULE: Task completion requires BOTH sides. Covering only one side loses approximately 1/3 of the total task score.
  ⚠ Q4 vs Q5 REGISTER DISTINCTION — these are DIFFERENT task types requiring DIFFERENT approaches:
    Q4: neutral, balanced, no personal opinion. Opener: "There are several benefits and drawbacks..."
    Q5: committed, one-sided, persuasive, address the authority figure. Opener: "As far as I'm concerned..." / "I strongly believe..."
    Never diagnose a Q4 response as if it were Q5 or vice versa. Register mismatch = task completion penalty.

  Q4 Subskill Traps: balanced coverage, neutral register, transition pivot, time management (~40s per side), evidence/elaboration per point.
  Q5 Subskill Traps: early position statement, formal register throughout, argument development, maintaining commitment, optional closing call to action.

MET Writing Rating Scale (5 categories, each scored 0–4):
  Grammatical Accuracy — Error quantity/severity, reader ability to process meaning
    4 = rare errors, none preventing meaning, advanced grammar attempted
    3 = simple constructions error-free, complex may err, errors don't interfere
    2 = frequent errors, some severe enough to obscure meaning
    1 = pervasive errors, reader frequently guesses intended meaning
    0 = impossible to process for meaning
  Vocabulary — Lexical sophistication, word choice appropriacy, degree of misuse
    4 = sophisticated vocab properly used, carefully chosen, almost no misuse
    3 = simple and sophisticated mix, generally appropriate, few misused
    2 = mostly simple, sophisticated attempted but may fail, some misuse
    1 = only simple words, sophisticated attempts unsuccessful, misuse causes confusion
    0 = no relevant vocabulary
  Mechanics — Sentence boundaries, punctuation, spelling
    4 = no boundary errors, almost no punctuation or spelling errors
    3 = minor errors with punctuation, few spelling errors, none causing confusion
    2 = frequent boundary/punctuation errors, frequent spelling, some severe
    1 = little to no control over sentence boundaries, pervasive spelling
    0 = no legible or decipherable text
  Cohesion & Organization — Linking ideas, connective devices, logical flow
    4 = very cohesive, connections always successful, connectives used correctly
    3 = generally cohesive, connections usually successful, mostly correct connectives
    2 = partially cohesive, connections partially successful, connectives attempted
    1 = not cohesive, ideas not connected clearly, only basic connectives if any
    0 = no clear ideas expressed
  Task Completion — Relevance, supporting detail, successful task fulfillment
    4 = directly relevant, supporting detail clearly developed, fully completes task
    3 = directly relevant, adequate supporting detail, adequately completes task
    2 = mainly relevant, some supporting detail, minimally completes task
    1 = very short/simple, may be only partially relevant, may be difficult to understand
    0 = no response attempted or only name written

Score Confidence Levels — use one of these exact strings for scoreConfidenceLevel:
  "Not evaluated enough"       — zero evidence (mandatory for unevaluated skills)
  "Limited evidence"           — 1 evidence piece, significant uncertainty
  "Provisional estimate"       — some evidence but not enough for full confidence
  "Diagnostic estimate"        — enough evidence for a confident class-based estimate
  "Mock-test estimate"         — full mock test performance observed
  "Official score imported manually" — teacher imported a real MET score

━━━ SKILL SUBSKILLS REFERENCE ━━━
When diagnosing, identify which subskills you actually have evidence for and list them in subskillsAssessed.
For each assessed subskill, use these diagnostic status labels (never "good"/"bad"):
  "Secure"         — consistent performance; can be cited as a strength
  "Consolidating"  — student shows the behavior inconsistently; needs repetition and cuing
  "Developing"     — partial control; appears in favorable conditions only
  "Not yet evident" — gap confirmed; student cannot yet produce this subskill reliably

Speaking: task_relevance, task_completion, idea_development, supporting_details, organization, grammar_accuracy, grammar_complexity, vocabulary_range, vocabulary_appropriacy, connector_use, fluency, hesitation, pronunciation*, rhythm*, intelligibility*
  (*transcript-only: mark pronunciation/rhythm/intelligibility as "audio required")
  When speaking evidence is tied to a specific task, tag it: e.g. "Q4: balanced_coverage", "Q5: position_commitment", "Q2: past_tense_accuracy".

Writing: task_completion, idea_development, grammar_accuracy, grammar_complexity, vocabulary_range, word_choice, mechanics, sentence_boundaries, punctuation, spelling, cohesion, organization, connector_use, register_consistency
  Writing has two sections: Section 1 = linguistic accuracy (grammar/vocabulary in context, collocations, connectors, register); Section 2 = extended writing (task type: letter/email/essay/report/description). Tag subskills to section when known.

Reading: main_idea, detail, inference, vocabulary_in_context, reference, purpose_tone, text_organization, paraphrase_recognition, distractor_recognition, scanning, skimming, time_management
  Common failure modes — main_idea: choosing a supporting detail instead of the gist; distractor_recognition: choosing option with familiar audio/text words; inference: over-literal reading; scanning: re-reading instead of targeting.

Listening: main_idea, detail, inference, speaker_purpose, vocabulary_in_context, prediction_anticipation, distractor_resistance, listening_under_time_pressure
  MET Listening sections: Sec 1 = short dialogues (identify main point/intent); Sec 2 = extended dialogues (track topic shifts); Sec 3 = lectures/monologues (main idea, detail, inference); Sec 4 = academic discussions (complex exchanges, identify roles/views).
  Common failure modes — main_idea: choosing a detail; distractor_resistance: choosing option with familiar audio words but wrong answer; speaker_purpose: confusing topic with intent; inference: surface reading of implied meaning.

Grammar: articles, quantifiers, verb_tenses, prepositions, subject_verb_agreement, sentence_structure, relative_clauses, conditionals, connectors

Vocabulary: general_met_vocabulary, healthcare_vocabulary, academic_vocabulary, topic_vocabulary, word_choice, collocation, paraphrasing, inference_language, connector_phrases

Test Strategy: time_management, question_type_recognition, distractor_management, evidence_selection, self_correction, exam_anxiety_control`;


// ━━━ PROMPT MODULES ━━━

/**
 * Module 1: Skill Diagnosis (The Analyst)
 * Focus: Accuracy, Rubrics, Evidence-based scores.
 */
export const buildSkillDiagnosisPrompt = (data) => {
  const { student, classEvent, classEvidence, targetProfile } = data;
  const ev = classEvidence || {};
  const tp = targetProfile || {};
  const bool = (v) => v ? 'Yes' : 'No';
  const count = (n) => `${n || 0} turn${(n || 1) === 1 ? '' : 's'}`;

  return `You are the Diagnostic Analyst for a MET English teaching platform.
Your goal is to provide a precise, evidence-based evaluation of student performance.

━━━ STUDENT PROFILE ━━━
Name: ${student?.name || 'Unknown'}
Current level: ${student?.currentLevel || student?.band || 'B1'}
Target level: ${student?.targetLevel || student?.bandTarget || 'B2'}
Exam goal: ${student?.examGoal || student?.goal || 'Pass MET B2'}

━━━ TARGET SCORE PROFILE ━━━
Profile: ${tp.label || tp.profileName || 'not selected'}
Targets: Overall ${tp.overallTarget ?? '?'} | Speaking ${tp.speakingTarget ?? '?'} | Writing ${tp.writingTarget ?? '?'} | Reading ${tp.readingTarget ?? '?'} | Listening ${tp.listeningTarget ?? '?'}

━━━ EVALUATED SKILLS ━━━
Speaking: ${bool(ev.evaluatedSpeaking)} (${count(ev.speakingEvidenceCount)})
Writing: ${bool(ev.evaluatedWriting)} (${count(ev.writingEvidenceCount)})
Reading: ${bool(ev.evaluatedReading)} (${count(ev.readingEvidenceCount)})
Listening: ${bool(ev.evaluatedListening)} (${count(ev.listeningEvidenceCount)})
Grammar: ${bool(ev.evaluatedGrammar)} (${count(ev.grammarEvidenceCount)})
Vocabulary: ${bool(ev.evaluatedVocabulary)} (${count(ev.vocabularyEvidenceCount)})
Test strategy: ${bool(ev.evaluatedTestStrategy)} (${count(ev.testStrategyEvidenceCount)})

━━━ CLASS EVIDENCE ━━━
Transcript/Answer:
${ev.studentTranscript || ev.studentAnswer || 'not provided'}

Performance Notes:
${ev.studentPerformance || 'not provided'}

Additional Teacher Notes:
${ev.additionalNotes || ev.teacherNotes || 'none'}

${SHARED_MET_DATA}

━━━ RULES ━━━
1. ONLY diagnose skills that were evaluated (Evaluated: Yes).
2. For unevaluated skills: set evaluated:false, score0to80:null, scoreConfidenceLevel:"Not evaluated enough", diagnosis:"Not evaluated enough — 0 turns/evidence."
3. Never create a score estimate for unevaluated skills.
4. Use the exact scoreConfidenceLevel strings from the reference.
5. For speaking with transcript only: score0to4 for Intelligibility/Delivery must be null and note "audio required."
6. subskillsAssessed should only list subskills you have actual evidence for.
7. ratingBreakdown for speaking and writing must align with the official MET rating scales.
8. priorityDiagnosis: 3–5 ranked items. urgency "Critical" = blocks the target; "Developing" = active growth area; "Strength" = cite one genuine strength. Every "evidence" MUST be a real quote from the evidence above — never invent. Base priorities only on evaluated skills.
9. classSummary, nextClassFocus, targetScoreRelevance, profileUpdateSuggestions: base ONLY on what was actually evaluated — never fabricate progress for an unevaluated skill. If almost nothing was evaluated, say so plainly.
10. profileUpdateSuggestions.progressNote is shown directly to the STUDENT — keep it plain, specific, and honest (no empty praise, no jargon).
11. REQUIRED OUTPUT — You MUST always return substantive content for every one of these fields, even when evidence is limited (write "limited evidence — [your best estimate]" rather than leaving blank):
    - classSummary: at least 1 sentence. Never return "".
    - nextClassFocus: all four keys (primaryFocus, suggestedActivities, warmUp, successCriteria). Never return {}.
    - targetScoreRelevance: all four keys (gapToTarget, prioritySkillForTarget, estimatedSessionsToTarget, onTrack). Never return {}.
    - profileUpdateSuggestions: all four keys (progressNote, suggestedLevelChange, recurringErrorsToTrack, masteredItems). Never return {}.
    - estimatedOverallScore: all three keys (estimate, confidence, note). Never return {}.

RETURN ONLY VALID JSON:
{
  "skillDiagnosis": {
    "speaking": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "transcriptOnly": boolean, "ratingBreakdown": { "taskCompletion": { "score0to4": number, "notes": string }, "languageResources": { "score0to4": number, "notes": string }, "intelligibilityDelivery": { "score0to4": number|null, "notes": string } }, "subskillsAssessed": string[], "strengths": string[], "weaknesses": string[], "readinessTowardTarget": string, "whatToImproveNext": string },
    "writing": { ... },
    "reading": { ... },
    "listening": { ... },
    "grammar": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "subskillsAssessed": string[], "mainIssues": string[], "strengths": string[], "whatToImproveNext": string },
    "vocabulary": { ... },
    "testStrategy": { ... }
  },
  "classSummary": "2-3 plain sentences that tie the whole diagnosis together: what was actually practised today, how it went, and the single most important takeaway. This is the cohesive overview the teacher reads first — not a thin restatement. No 'The class focused on...'.",
  "priorityDiagnosis": [
    { "rank": 1, "urgency": "Critical|Developing|Strength", "area": "short skill/subskill name", "evidence": "exact quote from the evidence", "whatToImprove": "1 concrete sentence", "howToImprove": "1 sentence — one actionable practice direction" }
  ],
  "targetScoreRelevance": { "gapToTarget": "string", "prioritySkillForTarget": "string", "estimatedSessionsToTarget": "string", "onTrack": "string" },
  "nextClassFocus": { "primaryFocus": "string", "suggestedActivities": ["string"], "warmUp": "string", "successCriteria": "string" },
  "profileUpdateSuggestions": { "progressNote": "1-2 student-facing sentences about progress this class", "suggestedLevelChange": "string", "recurringErrorsToTrack": ["string"], "masteredItems": ["string"] },
  "estimatedOverallScore": { "estimate": "number or 'Not evaluated enough'", "confidence": "string", "note": "1 sentence explaining the basis for this estimate — which evaluated skills it rests on and why the confidence level. Never leave blank." }
}`;
};

/**
 * Module 2: Student Feedback (The Tutor)
 * Focus: Warmth, Empathy, "You" language, Personalized quotes.
 */
export const buildStudentFeedbackPrompt = (data) => {
  const { student, classEvent, classEvidence, diagnosis } = data;
  const ev = classEvidence || {};

  return `You are a warm, encouraging, and highly personalized English Tutor.
Your job is to write student-facing feedback that feels handwritten and deeply connected to today's lesson.

━━━ STUDENT ━━━
Name: ${student?.name || 'Student'}
Current Level: ${student?.currentLevel || 'B1'}
Target Level: ${student?.targetLevel || 'B2'}

━━━ LESSON CONTEXT ━━━
Topic/Focus: ${classEvent?.classFocus || 'not specified'}
Transcript/Evidence: ${ev.studentTranscript || ev.studentAnswer || 'no transcript available'}

━━━ DIAGNOSIS DATA (For Reference) ━━━
${JSON.stringify(diagnosis?.skillDiagnosis || {}, null, 2)}

${SHARED_MET_DATA}

━━━ VOICE RULES (CRITICAL — this is the #1 priority) ━━━
Write like a real teacher talking TO this student right after class — warm, specific, human. Not a report.

• SECOND PERSON ONLY: "you", "your". NEVER "the student", "he/she", "this learner".
• USE THEIR NAME once or twice (it's fine to open finalNote with "${student?.firstName || 'You'}, ..."). Contractions are encouraged — "you're", "that's", "it'll".
• QUOTE-ANCHORED: every strength and every improvement points to something they actually said or wrote today — quote their real words.
• NO TEMPLATE / NO SAMENESS: phrase every item DIFFERENTLY. Never reuse one sentence shape (e.g. "You did X, which shows Y"). Vary length — some items can be a single short sentence. It must read hand-written, not filled into a form.
• BANNED JARGON / AI-WORDS (never use): demonstrate, showcase, leverage, utilize, delve, crucial, essential, foster, robust, navigate, journey, elevate, "in terms of", "when it comes to", "this highlights", "this underscores", "a testament to". Use plain everyday words.
• BANNED OPENERS: "Great work", "Well done", "Excellent", "Good job", "It is important", "Furthermore", "Additionally", "Moreover", "In addition", "Going forward", "In conclusion", "Overall".
• BANNED PHRASES: "This demonstrates", "Your performance", "You demonstrated", "You exhibited", "This is crucial for", "This is essential", "This shows that you", "Continue to", "Keep up".
• BREVITY: if a thought is one sentence, stop. No padding, no restating.
• MET BUDGET: at most 2 sentences in the whole feedback may mention the MET exam, and each must be concrete (e.g., "examiners weight delivery in the third descriptor...").

TONE EXAMPLE — match the natural version, never the robotic one:
  ✗ Robotic: "You demonstrated strong task completion, which is crucial for your target band and showcases developing fluency."
  ✓ Natural: "When you described the night shift on the ward, you kept going for the whole minute without freezing — that steady flow is exactly what the examiners are listening for."

━━━ OUTPUT FORMAT ━━━
Return ONLY VALID JSON:
{
  "classFocus": "2-3 sentences. Name the actual task. How did it go? No 'The class focused on...'",
  "whatYouDidWell": [
    { "strength": "plain phrase", "explanation": "1-2 sentences. What they did + WHY it worked. Include MET context if budget allows.", "example": "the actual quote: '...'" }
  ],
  "whatToImprove": [
    { "area": "plain phrase", "insteadOf": "exact quote of error", "sayInstead": "better version", "howToImprove": "1-2 sentences. ONE thing to try. Include MET context if budget allows." }
  ],
  "finalNote": "1-2 sentences. What you noticed them getting close to. Handwritten feel. No 'Keep up the great work!'"
}`;
};

/**
 * Module 3: Homework & Error Bank (The Designer)
 * Focus: Practicality, Target-driven, Fully written exercises.
 */
const arr = (v) => (Array.isArray(v) ? v : []);
const pickArray = (...values) => values.map(arr).find(v => v.length) || [];

export const buildHomeworkPrompt = (data) => {
  const { student, diagnosis } = data;
  const priorities = pickArray(diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(data?.errorBank, diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(data?.vocabTargets?.vocabularyTargets, diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar = pickArray(data?.vocabTargets?.grammarTargets, diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);

  return `You are an expert MET Instructional Designer.
Build 3 complete, student-ready, highly personalized homework tasks based on the diagnosis provided.

━━━ STUDENT ━━━
Name: ${student?.name || 'Student'}
Level: ${student?.currentLevel || 'B1'} → Target: ${student?.targetLevel || 'B2'}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.map(p => `- [${p.urgency}] ${p.area}: ${p.whatToImprove}`).join('\n') || 'No priorities'}

━━━ TARGET ERRORS & VOCAB ━━━
Errors: ${errors.map(e => `"${e.error}" → "${e.correct}"`).join(', ') || 'No recurring errors'}
Vocab: ${vocab.map(v => v.wordOrPhrase).join(', ') || 'No vocabulary targets'}
Grammar: ${grammar.map(g => g.area).join(', ') || 'No grammar targets'}

━━━ RULES ━━━
1. EXACTLY 3 TASKS.
2. FULLY WRITTEN: The 'content' field must contain the FULL exercise (the sentences to correct, the prompt to answer, the fill-in-the-blanks). NOT a description of a task.
3. VARIETY: Include at least one reading, one listening, and one speaking/writing task.
4. TARGET-DRIVEN: Every task must target a specific weakness identified in the diagnosis.
5. LEVEL-APPROPRIATE: B1-B2 level.

RETURN ONLY VALID JSON:
{
  "title": "specific title",
  "objective": "direct link to priority",
  "instructions": "friendly, second-person instructions",
  "tasks": [
    { "taskNumber": 1, "type": "grammar|vocabulary|writing|speaking|reading|listening", "description": "title", "content": "THE FULL EXERCISE TEXT", "example": "model", "expectedOutput": "what to submit" }
  ],
  "expectedSubmissionType": "text|audio|file|mixed",
  "selfCheck": ["check 1", "check 2"],
  "teacherNotes": "what to look for",
  "dueDateSuggestion": "Before next class"
}`;
};

/**
 * Module 4: Error Bank & Vocabulary (The Archivist)
 * Focus: Extraction, Categorization, Pattern recognition, and New Vocabulary Identification.
 */
export const buildErrorBankPrompt = (data) => {
  const { student, classEvidence, diagnosis } = data;
  return `You are a linguistic pattern analyst.
Your job is to:
1. Extract high-value errors and grammar targets.
2. Identify new, high-value vocabulary words from the evidence that are appropriate for the student's target level (B1-B2) to expand their range.

━━━ EVIDENCE ━━━
Transcript/Notes: ${classEvidence.studentTranscript || classEvidence.studentAnswer || 'no transcript'}

━━━ DIAGNOSIS CONTEXT ━━━
${JSON.stringify(diagnosis?.skillDiagnosis || {}, null, 2)}

RETURN ONLY VALID JSON:
{
  "errorBankSuggestions": [
    { "error": "exact student error", "correct": "improved version", "category": "grammar|vocabulary|pronunciation|register|strategy|cohesion", "priority": "high|medium|low", "evidence": "exact quote", "saveToProfile": true, "explanation": "short rule" }
  ],
  "vocabGrammarTargets": {
    "vocabularyTargets": [ { "wordOrPhrase": "...", "category": "...", "meaning": "...", "exampleSentence": "..." } ],
    "newHighValueWords": [ { "word": "...", "category": "...", "meaning": "...", "exampleSentence": "..." } ],
    "grammarTargets": [ { "area": "...", "issue": "...", "correction": "...", "practiceDirection": "..." } ]
  }
}`;
};

// ━━━ LEGACY COMPATIBILITY ━━━

export const DIAGNOSTIC_PROMPT = `(DEPRECATED: Use Module-based prompts for better performance)`;

export function buildDiagnosticPrompt(data) {
  // This remains for backward compatibility with the existing 'regenerate' logic
  // but we will move towards the new modular approach in the UI.
  return buildSkillDiagnosisPrompt(data); // Dummy implementation for now
}

export function buildSectionRegenPrompt(key, data) {
  // This is still useful for the 'Regen' button on individual sections
  // We'll refine this later to use the specific module prompts
  return buildSkillDiagnosisPrompt(data); 
}

// (Other existing build functions can be kept or deprecated)

/* ══════════════════════════════════════════════════════════════
   HOMEWORK GENERATOR PROMPT — used by homework-create.jsx
   Restored: was dropped during the module-prompt refactor.
══════════════════════════════════════════════════════════════ */
export const buildHomeworkGeneratorPrompt = ({ student, diagnosis }) => {
  const priorities = pickArray(diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar = pickArray(diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);
  const skillDx = diagnosis?.sections?.skillDiagnosis?.content || {};
  const classSummary = diagnosis?.sections?.classSummary?.content || '';

  const topPriority = priorities[0];
  const skillAreas = Object.entries(skillDx).filter(([, v]) => v?.evaluated).map(([k]) => k);
  const weaknesses = skillAreas.flatMap(k => skillDx[k]?.weaknesses || []).slice(0, 6);

  const t = (s, max) => !s || s.length <= max ? (s || '') : s.slice(0, max) + '…';

  return `You are a MET English homework creator. Build 3 complete, student-ready tasks from the diagnosis below.

━━━ STUDENT ━━━
${student?.name || 'Unknown'} | ${student?.currentLevel || student?.band || 'B1'} → ${student?.targetLevel || student?.bandTarget || 'B2'} | ${student?.examGoal || 'MET B2'} | ${student?.professionalContext || ''}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.slice(0, 3).map(p => `${p.rank}. [${p.urgency}] ${p.area}: ${p.whatToImprove}${p.evidence ? ` — "${p.evidence}"` : ''}`).join('\n') || 'No priorities.'}

━━━ ERRORS TO TARGET ━━━
${errors.slice(0, 5).map(e => `- "${e.error}" → "${e.correct}" (${e.category || '?'}, ${e.priority || 'medium'})${e.evidence ? ` — "${e.evidence}"` : ''}`).join('\n') || 'none'}

━━━ VOCABULARY TARGETS ━━━
${vocab.slice(0, 4).map(v => `- ${v.wordOrPhrase}: ${v.meaning || ''}`).join('\n') || 'none'}

━━━ GRAMMAR TARGETS ━━━
${grammar.slice(0, 3).map(g => `- ${g.area}: ${g.issue}`).join('\n') || 'none'}

━━━ RULES ━━━
- Exactly 3 tasks. Each FULLY WRITTEN — student opens and starts immediately.
- Grammar: 4–5 sentences with the actual error pattern for the student to correct.
- Vocabulary: 4–5 fill-in-the-blank sentences with a word bank.
- Writing/Speaking: one complete prompt (word count, structure, time limit).
- Use ${student?.professionalContext || 'real, specific'} contexts — not generic filler.
- B1–B2 level. Total homework time: 20–30 minutes.

Return ONLY valid JSON:
{
  "title": "specific title — reflects the actual target, not generic (e.g. 'Other / Another — Grammar Drill + Speaking Practice')",
  "objective": "exact link to top priority — state skill and specific sub-target",
  "instructions": "friendly, clear instructions in second person — tell the student what they will practice and why it matters for MET",
  "tasks": [
    {
      "taskNumber": 1,
      "type": "grammar|vocabulary|writing|speaking|reading|listening",
      "description": "one-line task title",
      "content": "FULLY WRITTEN OUT EXERCISE — the actual sentences, questions, prompt, or scenario the student will work with. This field must contain the complete task content, not a description of what to create.",
      "example": "a worked example or model showing the expected format and level (optional but recommended for grammar and vocabulary tasks)",
      "expectedOutput": "exactly what the student must write or record and submit"
    },
    {
      "taskNumber": 2,
      "type": "...",
      "description": "...",
      "content": "FULLY WRITTEN OUT exercise content",
      "example": "...",
      "expectedOutput": "..."
    },
    {
      "taskNumber": 3,
      "type": "...",
      "description": "...",
      "content": "FULLY WRITTEN OUT exercise content",
      "example": "...",
      "expectedOutput": "..."
    }
  ],
  "expectedSubmissionType": "text|audio|file|mixed",
  "selfCheck": [
    "specific check tied to homework target (e.g. 'I used 'another' with singular nouns only')",
    "item 2 — specific to the vocabulary or grammar target",
    "item 3 — specific to the writing/speaking task"
  ],
  "teacherNotes": "what to look for when reviewing: reference the specific error patterns and targets from the diagnosis",
  "dueDateSuggestion": "Before next class"
}`;
};

/* ══════════════════════════════════════════════════════════════
   HOMEWORK GROUP PROMPT — per-skill-group exercise generation.
   Called once per selected skill group (speaking, grammar, etc.)
   so each call is small and cascade-resilient.
══════════════════════════════════════════════════════════════ */
export const buildHomeworkGroupPrompt = ({ student, diagnosis, group, count = 5 }) => {
  const priorities = pickArray(diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors     = pickArray(diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab      = pickArray(diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar    = pickArray(diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);
  const skillDx    = diagnosis?.sections?.skillDiagnosis?.content || {};

  // Pull skill-specific weaknesses when available
  const skillData  = skillDx[group] || {};
  const weaknesses = arr(skillData.weaknesses).slice(0, 4);

  // Map group key to recommended exercise types
  const TYPE_HINTS = {
    speaking:    'speak, short',
    writing:     'short, fix',
    grammar:     'fix, blank, mcq',
    vocabulary:  'flash, blank, mcq',
    reading:     'mcq, order, short',
    listening:   'listen, mcq',
    mixed:       'mcq, blank, short, fix',
  };
  const typeHint = TYPE_HINTS[group] || 'mcq, blank, short';
  const groupLabel = group.charAt(0).toUpperCase() + group.slice(1);

  return `You are a MET English exam preparation expert. Generate exactly ${count} structured exercises targeting ${groupLabel}.

━━━ STUDENT ━━━
${student?.name || 'Student'} | ${student?.currentLevel || 'B1'} → ${student?.targetLevel || 'B2'} | ${student?.professionalContext || 'general professional context'}

━━━ SKILL GROUP: ${groupLabel.toUpperCase()} ━━━
${weaknesses.length ? weaknesses.map(w => `- ${w}`).join('\n') : `Target: B1→B2 ${groupLabel} skills relevant to MET exam`}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.slice(0, 2).map(p => `- [${p.urgency}] ${p.area}: ${p.whatToImprove}`).join('\n') || 'None recorded.'}

━━━ ERRORS TO TARGET ━━━
${errors.filter(e => (e.category || '').toLowerCase().includes(group) || group === 'mixed').slice(0, 4).map(e => `- "${e.error}" → "${e.correct}" (${e.category})`).join('\n') || errors.slice(0, 3).map(e => `- "${e.error}" → "${e.correct}" (${e.category})`).join('\n') || 'None recorded.'}

━━━ VOCABULARY / GRAMMAR TARGETS ━━━
${group === 'vocabulary' || group === 'mixed' ? vocab.slice(0, 4).map(v => `- ${v.wordOrPhrase}: ${v.meaning || ''}`).join('\n') || 'None.' : ''}
${group === 'grammar' || group === 'mixed' ? grammar.slice(0, 3).map(g => `- ${g.area}: ${g.issue}`).join('\n') || 'None.' : ''}

━━━ RULES ━━━
- Generate exactly ${count} exercises. Every exercise is FULLY WRITTEN — student opens and starts immediately.
- Recommended types: ${typeHint}. Mix them for variety. Use the 8 structured types: mcq, blank, short, speak, order, fix, flash, listen.
- Use the student's professional context (${student?.professionalContext || 'healthcare / nursing'}) — not generic filler.
- B1–B2 level. Each exercise should take 3–5 minutes.

Return ONLY valid JSON — an array of ${count} exercise objects:
[
  {
    "type": "mcq|blank|short|speak|order|fix|flash|listen",
    "skillGroup": "${group}",
    "content": "FULLY WRITTEN exercise content — the actual sentences, questions, or scenario",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "blanks": ["answer1"],
    "sentences": ["sentence 1", "sentence 2"],
    "correctedText": "corrected version (for fix type)",
    "hint": "optional hint",
    "pairs": [{"term": "word", "def": "meaning"}],
    "audioText": "text to read aloud (for listen type)",
    "question": "the question",
    "explanation": "why this answer is correct"
  }
]
Include only the fields relevant to the exercise type. The "content" field always contains the main exercise text.`;
};

/* ══════════════════════════════════════════════════════════════
   EXERCISE LIST PROMPT — used by homework-create.jsx
   Generate a menu of exercise options for the teacher to pick from.
   Restored: was dropped during the module-prompt refactor.
══════════════════════════════════════════════════════════════ */
export const buildExerciseListPrompt = ({ student, diagnosis }) => {
  const priorities = pickArray(diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar = pickArray(diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);

  return `You are a MET English exam preparation expert. Generate a menu of 6 distinct, ready-to-use exercises for the teacher to choose from.

━━━ STUDENT ━━━
Name: ${student?.name || 'Student'}
Level: ${student?.currentLevel || 'B1'} → Target: ${student?.targetLevel || 'B2'}
Context: ${student?.professionalContext || 'general'}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.slice(0, 3).map(p => `- [${p.urgency}] ${p.area}: ${p.whatToImprove}`).join('\n') || 'No priorities recorded.'}

━━━ ACTIVE ERRORS ━━━
${errors.slice(0, 6).map(e => `- "${e.error}" → "${e.correct}" (${e.category})`).join('\n') || 'None recorded.'}

━━━ VOCABULARY TARGETS ━━━
${vocab.slice(0, 5).map(v => `- ${v.wordOrPhrase}`).join('\n') || 'None.'}

━━━ GRAMMAR TARGETS ━━━
${grammar.slice(0, 3).map(g => `- ${g.area}: ${g.issue}`).join('\n') || 'None.'}

━━━ RULES ━━━
- Each exercise must be FULLY WRITTEN — the student opens it and starts immediately.
- Cover different skills: mix grammar, vocabulary, writing, speaking.
- Each exercise should take 5–15 minutes.
- Match B1–B2 transition level. Healthcare/nursing context when relevant.
- Use the INTERACTIVE EXERCISE TYPES below to create varied, engaging exercises.

━━━ INTERACTIVE EXERCISE TYPES ━━━
You MUST use these exact type IDs. Each has a specific JSON shape:

1. "mcq" (Multiple Choice) — question + 4 options + correct answer index
2. "blank" (Fill the Blank) — template with ___ markers + correct answers (pipe-separated alternatives)
3. "short" (Short Answer) — prompt + rubric hint + target word count
4. "speak" (Speaking Prompt) — prompt + target seconds
5. "order" (Order Sentences) — sentences array in correct order (student sees shuffled)
6. "fix" (Error Correction) — errorText + correctedText + hint
7. "flash" (Flashcards) — pairs of term/definition
8. "listen" (Listening Exercise) — audioText (the text read aloud via TTS) + plays (number of allowed listens, default 2) + question + 4 options + correct answer index + optional explanation

Return ONLY valid JSON — an array of 6 exercises mixing different types:
[
  {
    "title": "Short exercise title",
    "type": "mcq",
    "duration": "5 min",
    "content": "Which sentence uses the correct form?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct": 1,
    "teacherNote": "What to look for"
  },
  {
    "title": "Fill in the blanks — articles",
    "type": "blank",
    "duration": "8 min",
    "content": "The nurse gave ___ report to ___ doctor on duty.",
    "blanks": ["the|a", "the"],
    "teacherNote": "Check article use before nouns"
  },
  {
    "title": "Opinion paragraph",
    "type": "short",
    "duration": "12 min",
    "content": "Write 80–120 words arguing whether...",
    "targetWords": 120,
    "rubric": "Open with stance, give example, close with consequence",
    "teacherNote": "Look for cohesion markers"
  },
  {
    "title": "Speaking — past experience",
    "type": "speak",
    "duration": "5 min",
    "content": "Describe a challenging moment at work using past simple. 60 seconds.",
    "targetSeconds": 60,
    "teacherNote": "Check tense consistency"
  },
  {
    "title": "Patient admission steps",
    "type": "order",
    "duration": "5 min",
    "content": "Put these steps in order",
    "sentences": ["Step 1 in correct order", "Step 2", "Step 3", "Step 4"],
    "teacherNote": "Checks procedural vocabulary"
  },
  {
    "title": "Fix the errors — tenses",
    "type": "fix",
    "duration": "8 min",
    "content": "Text with errors here",
    "errorText": "Text with errors that student sees",
    "correctedText": "Corrected version for grading",
    "hint": "Look at: verb tenses, articles",
    "teacherNote": "Focus on past simple vs present perfect"
  },
  {
    "title": "Listen and answer — speaker purpose",
    "type": "listen",
    "duration": "5 min",
    "audioText": "The short dialogue or monologue text that will be read aloud by TTS. Keep it 2–4 sentences, realistic, at B1–B2 level.",
    "plays": 2,
    "question": "What is the speaker's main purpose?",
    "options": ["To complain about a procedure", "To request information about a patient", "To explain a treatment plan", "To apologise for a delay"],
    "correct": 1,
    "explanation": "The speaker asks directly about the patient's status, making option B the correct answer.",
    "teacherNote": "Targets speaker_purpose subskill — check if student identified intent vs topic"
  }
]`;
};
