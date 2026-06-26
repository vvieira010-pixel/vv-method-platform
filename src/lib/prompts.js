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

Some healthcare/work visa target profiles require overall ≥58, speaking ≥59. This is a target-score note only, not a required exercise topic.

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

Test Strategy: time_management, question_type_recognition, distractor_management, evidence_selection, self_correction, exam_anxiety_control

━━━ STRATEGIC INTERVENTIONS ━━━

Listening Strategic Interventions (use when diagnosing listening weaknesses or generating listening exercises):
  1. Mid-Stream Information Shifts — speakers often state an initial option then change it. Listen to the entire exchange before concluding.
  2. Lexical Distractors — wrong options reuse exact words from the audio. Prioritize semantic equivalence over verbatim matching.
  3. Note-Taking Overload — full transcription causes cognitive overload. Use lean symbolic notes: abbreviations + logical relationships (e.g., "meeting Tues -> Fri / manager travel").
  4. Discourse Signposts — real answers often follow contrast markers: but, however, actually, instead, although.

Reading Inference Formula:
  Text clue + Logical conclusion = Inference
  A valid inference is supported by evidence in the text + a reasonable step of logic.
  A bad inference is too extreme, unsupported, or contradicted by the text.

B2 Grammar Sub-System (tested within the MET Reading section):
  Core areas: Verb Tenses & Perfect Forms, Conditionals, Passive Voice & Reported Speech, Modals, Relative Clauses, Articles, Prepositions
  Diagnostic note: Grammar scores contribute to overall MET Reading performance. Track as a separate skill for diagnosis but understand it is assessed within the Reading competency.

B2 Vocabulary Sub-System (tested within the MET Reading section):
  Core areas: Collocations, Phrasal Verbs & Word Formation, Register
  Diagnostic note: Vocabulary scores contribute to overall MET Reading performance. Track as a separate skill for diagnosis but understand it is assessed within the Reading competency.

Writing Pedagogical Assessment Standards (guide diagnosis alongside the official 5-category rating above):
  Task Completion, Organization, Development, Grammar Accuracy, Vocabulary Range, Coherence, Register
  B2 Connectors for Writing: In addition, Furthermore, This is because, For instance, However, Overall, In conclusion

Speaking Execution Formulas (use when generating speaking exercises or diagnosing speaking structure):
  Q1: General situation (who/where/what) → key details (actions/objects/relationships) → logical inferences
  Q2: Situation → Problem/Main Event → Action Taken → Result → Reflection/Lesson
  Q3: Opinion → Reason 1 → Example → Reason 2 → Conclusion
  Q4: Introduce both sides → advantage with support → drawback with support → balanced concluding synthesis
  Q5: Address authority → State problem → Present reasons → Offer practical solution → Formal request

━━━ MET COMPETENCY MODEL ━━━
The MET assesses 4 core competencies. Grammar and Vocabulary are sub-systems of the Reading competency.
Test Strategy is a cross-cutting skill that applies to all competencies.
  Competency I:  Listening (5 sub-skills + 4 strategic interventions)
  Competency II: Reading + Grammar + Vocabulary (6 reading sub-skills + grammar sub-system + vocabulary sub-system)
  Competency III: Writing (2 tasks + 7 assessment standards)
  Competency IV:  Speaking (5 tasks with execution formulas)
For diagnosis JSON, continue using the 7-skill keys (speaking, writing, reading, listening, grammar, vocabulary, testStrategy).
The competency model is the pedagogical lens; the 7-skill keys are the data layer.`;


// ━━━ PROMPT MODULES ━━━

function topicRules() {
  const isHealthcare = typeof window !== 'undefined' && window.localStorage?.getItem('vv:healthcare_mode') === 'true';
  if (isHealthcare) {
    return `MET topic rules:
- Default to healthcare and nursing contexts: patient handovers, explaining medications, describing symptoms, giving instructions, reassuring patients, explaining procedures, reporting changes in patient condition, communicating with coworkers, handling difficult patient situations, and other clinical communication scenarios.
- Include general MET topics for balance: education, work, technology, community life, environment, personal decisions, travel, communication, public services, health and wellbeing, or study habits.
- Healthcare scenarios should feel practical and realistic for a nursing context.
- Tone should be professional, calm, and clear.`;
  }
  return `MET topic rules:
- Default to general MET preparation topics: education, work, technology, community life, environment, personal decisions, travel, communication, public services, health and wellbeing, or study habits.
- Do NOT default to nurses, hospitals, patients, doctors, medication, wards, symptoms, procedures, or healthcare roleplays.
- Use healthcare/nursing content only when the teacher explicitly asks for a healthcare task or the source exercise bank item is already healthcare-specific.
- If the student's profile mentions nursing or healthcare, treat it as background context, not as the topic for automatic diagnosis-based exercises.`;
}

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
11. HONEST OUTPUT — If you have enough evidence to evaluate a skill, provide substantive content. If you lack evidence, return null or "Not enough evidence" rather than fabricating or guessing. Never invent scores, progress, or observations for unevaluated skills.

RETURN ONLY VALID JSON:
{
  "skillDiagnosis": {
    "speaking": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "transcriptOnly": boolean, "ratingBreakdown": { "taskCompletion": { "score0to4": number, "notes": string }, "languageResources": { "score0to4": number, "notes": string }, "intelligibilityDelivery": { "score0to4": number|null, "notes": string } }, "subskillsAssessed": string[], "strengths": string[], "weaknesses": string[], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on (e.g. 'Based on 1 short Q3 opinion turn ≈45s' or 'Based on 2 short email paragraphs'). If limited, say 'Limited evidence — score is provisional.'" },
    "writing": { ... },
    "reading": { ... },
    "listening": { ... },
    "grammar": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "subskillsAssessed": string[], "mainIssues": string[], "strengths": string[], "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on." },
    "vocabulary": { ... },
    "testStrategy": { ... }
  },
  "classSummary": "2-3 plain sentences that tie the whole diagnosis together: what was actually practised today, how it went, and the single most important takeaway. This is the cohesive overview the teacher reads first — not a thin restatement. No 'The class focused on...'.",
  "priorityDiagnosis": [
    { "rank": 1, "urgency": "Critical|Developing|Strength", "area": "short skill/subskill name", "evidence": "exact quote from the evidence", "whatToImprove": "1 concrete sentence", "howToImprove": "1 sentence — frame as a testable hypothesis, not a guarantee. Use 'try...' / 'experiment with...' / 'see if...' rather than 'this will...'" }
  ],
  "targetScoreRelevance": { "gapToTarget": "string", "prioritySkillForTarget": "string", "estimatedSessionsToTarget": "string", "onTrack": "string" },
  "nextClassFocus": { "primaryFocus": "string", "suggestedActivities": ["string"], "warmUp": "string", "successCriteria": "string" },
  "profileUpdateSuggestions": { "progressNote": "1-2 student-facing sentences about progress this class", "suggestedLevelChange": "string", "recurringErrorsToTrack": ["string"], "masteredItems": ["string"] },
  "estimatedOverallScore": { "estimate": "number or 'Not evaluated enough'", "confidence": "string", "note": "1 sentence explaining the basis for this estimate — which evaluated skills it rests on and why the confidence level. Never leave blank." }
}`;
};

/**
 * Retrieval Practice Generator (retrieval-practice-generator skill)
 * Returns exercises in the platform's native format (mcq / blank / short).
 * Free Recall → short, Cued Recall → blank, Recognition → mcq.
 */
export const buildRetrievalPracticePrompt = ({ topic, studentLevel, questionCount = 5 }) => `You are a retrieval practice designer for a MET English exam preparation course.
Create a mix of retrieval practice questions for a student at level ${studentLevel}.

Topic / learning objective: ${topic}
Total questions: ${questionCount}

${GENERAL_MET_TOPIC_RULES}

Return a balanced mix: some Free Recall (open response), some Cued Recall (fill-in-the-blank), some Recognition (multiple choice).

Return ONLY valid JSON. Each question MUST match exactly one of these three formats:

Free Recall (becomes a written practice task):
{ "retrieval_type": "Free Recall", "type": "short", "prompt": "...", "rubric": "Key points expected: ...", "targetWords": 40, "focus": "skill name" }

Cued Recall (fill-in-the-blank — use ___ for each blank):
{ "retrieval_type": "Cued Recall", "type": "blank", "template": "sentence with ___ marking each blank", "blanks": [{"answer": "word"}], "focus": "skill name" }

Recognition (multiple choice — exactly 4 options, correct is the 0-based index):
{ "retrieval_type": "Recognition", "type": "mcq", "question": "...", "options": ["opt A", "opt B", "opt C", "opt D"], "correct": 0, "explanation": "...", "focus": "skill name" }

{
  "questions": [ ... ],
  "spacing_recommendation": "e.g. Review again in 1 day, then 3 days, then 1 week",
  "teacher_script": "one sentence on how to use these questions in the next session"
}`;

/**
 * Language Demand Analyser (language-demand-analyser skill, EAL/Cummins BICS/CALP)
 * Returns only the highest-priority actions to avoid overwhelming teachers.
 */
export const buildLanguageDemandPrompt = ({ exercises, studentLevel, objective = '' }) => {
  const exerciseList = (exercises || [])
    .slice(0, 12)
    .map((ex, i) => `${i + 1}. [${ex.type}] ${ex.prompt || ex.question || ex.template || ex.sentence || ex.errorText || ex.title || '(no text)'}`)
    .join('\n');
  return `You are a language demand analyst for an EFL/MET English exam preparation platform.
Apply Cummins' BICS/CALP framework to identify the highest-priority language scaffolding needs.

Student level: ${studentLevel}
${objective ? `Learning objective: ${objective}` : ''}

Exercises to analyse:
${exerciseList || 'No exercise content provided.'}

Focus on what the student needs BEFORE attempting these tasks. Keep recommendations specific and actionable.

Return ONLY valid JSON:
{
  "priority_actions": [
    {
      "demand_type": "vocabulary | grammar | discourse | genre",
      "description": "specific language challenge in these exercises",
      "recommendation": "one concrete thing the teacher should add or pre-teach"
    }
  ],
  "tier2_vocabulary": ["academic or instructional words the student may not know"],
  "tier3_vocabulary": ["MET exam-specific or topic-specific terms to pre-teach"],
  "overall_demand": "low | medium | high",
  "teacher_note": "one-sentence summary"
}`;
};

export const buildCompactSkillDiagnosisPrompt = (data) => {
  const { student, classEvidence, targetProfile } = data;
  const ev = classEvidence || {};
  const tp = targetProfile || {};
  const bool = (v) => v ? 'Yes' : 'No';
  const count = (n) => `${n || 0}`;

  return `Return a compact MET diagnosis as valid JSON only. Use evidence honestly. Do not score skills that were not evaluated.

Student: ${student?.name || 'Unknown'} | Level: ${student?.currentLevel || student?.band || 'B1'} -> ${student?.targetLevel || student?.bandTarget || 'B2'}
Target profile: ${tp.label || tp.profileName || 'not selected'} | Overall ${tp.overallTarget ?? '?'} | Speaking ${tp.speakingTarget ?? '?'}

Evaluated skills:
- speaking ${bool(ev.evaluatedSpeaking)} count ${count(ev.speakingEvidenceCount)}
- writing ${bool(ev.evaluatedWriting)} count ${count(ev.writingEvidenceCount)}
- reading ${bool(ev.evaluatedReading)} count ${count(ev.readingEvidenceCount)}
- listening ${bool(ev.evaluatedListening)} count ${count(ev.listeningEvidenceCount)}
- grammar ${bool(ev.evaluatedGrammar)} count ${count(ev.grammarEvidenceCount)}
- vocabulary ${bool(ev.evaluatedVocabulary)} count ${count(ev.vocabularyEvidenceCount)}
- testStrategy ${bool(ev.evaluatedTestStrategy)} count ${count(ev.testStrategyEvidenceCount)}

Evidence:
${ev.studentTranscript || ev.studentAnswer || 'not provided'}

Teacher notes:
${ev.studentPerformance || ev.additionalNotes || ev.teacherNotes || 'none'}

Rules:
- For not evaluated skills: evaluated false, evidenceCount 0, score0to80 null, scoreConfidenceLevel "Not evaluated enough".
- For evaluated skills with limited evidence: use scoreConfidenceLevel "Limited evidence" or "Provisional estimate".
- Use only real evidence. Keep text concise.
- Include every top-level key shown below. If evidence is limited, write that plainly instead of leaving blank.

JSON shape:
{
  "skillDiagnosis": {
    "speaking": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "transcriptOnly": boolean, "strengths": [string], "weaknesses": [string], "subskillsAssessed": [string], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "writing": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": [string], "weaknesses": [string], "subskillsAssessed": [string], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "reading": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": [string], "weaknesses": [string], "subskillsAssessed": [string], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "listening": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": [string], "weaknesses": [string], "subskillsAssessed": [string], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "grammar": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": [string], "mainIssues": [string], "subskillsAssessed": [string], "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "vocabulary": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": [string], "weaknesses": [string], "subskillsAssessed": [string], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "testStrategy": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": [string], "weaknesses": [string], "subskillsAssessed": [string], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" }
  },
  "classSummary": "2-3 sentences",
  "priorityDiagnosis": [{ "rank": 1, "urgency": "Critical|Developing|Strength", "area": string, "evidence": string, "whatToImprove": string, "howToImprove": string }],
  "targetScoreRelevance": { "gapToTarget": string, "prioritySkillForTarget": string, "estimatedSessionsToTarget": string, "onTrack": string },
  "nextClassFocus": { "primaryFocus": string, "suggestedActivities": [string], "warmUp": string, "successCriteria": string },
  "profileUpdateSuggestions": { "progressNote": string, "suggestedLevelChange": string, "recurringErrorsToTrack": [string], "masteredItems": [string] },
  "estimatedOverallScore": { "estimate": "number or Not evaluated enough", "confidence": string, "note": string }
}`;
};

/**
 * Module 1b: Diagnostic Data Only (The Analyst — data only, no narrative)
 * Returns ONLY structured data — scores, errors, vocabulary, gaps, priority recommendations.
 * No student-facing text, no feedback, no narrative. Teacher reads this data and writes meaning.
 */
export const buildDiagnosticDataPrompt = (data) => {
  const { student, classEvent, classEvidence, targetProfile } = data;
  const ev = classEvidence || {};
  const tp = targetProfile || {};
  const bool = (v) => v ? 'Yes' : 'No';
  const count = (n) => `${n || 0} turn${(n || 1) === 1 ? '' : 's'}`;

  return `You are the Diagnostic Data Analyst for a MET English teaching platform.
Your job is to produce ONLY structured data — scores, errors, vocabulary, gaps, and priority recommendations.
Do NOT write any narrative, student-facing text, or feedback. Output must be pure JSON data only.

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
1. ONLY score skills that were evaluated (Evaluated: Yes).
2. For unevaluated skills: set evaluated:false, score0to80:null, scoreConfidenceLevel:"Not evaluated enough".
3. Never create a score estimate for unevaluated skills.
4. Use the exact scoreConfidenceLevel strings from the reference.
5. For speaking with transcript only: score0to4 for Intelligibility/Delivery must be null and note "audio required."
6. subskillsAssessed should only list subskills you have actual evidence for.
7. ratingBreakdown for speaking and writing must align with the official MET rating scales.
8. priorityRecommendations: recommend 3–5 ranked priorities. Each must include an exact evidence quote from the transcript above — never invent.
9. errors: extract all correctable errors from the evidence. Each must include exact quote and corrected version.
10. vocabulary: identify new high-value B1–B2 words from the evidence. Do NOT include words the student already knows or basic vocabulary.
11. gapVsTarget: compute the gap between each evaluated skill's score and the corresponding target. Use null for unevaluated skills.
12. FORMAT: Return only the JSON structure below. No extra text, no commentary, no markdown.

RETURN ONLY VALID JSON:
{
  "scores": {
    "speaking": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "transcriptOnly": boolean, "ratingBreakdown": { "taskCompletion": { "score0to4": number, "notes": string }, "languageResources": { "score0to4": number, "notes": string }, "intelligibilityDelivery": { "score0to4": number|null, "notes": string } }, "subskillsAssessed": string[], "strengths": string[], "weaknesses": string[], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence stating what evidence this score is based on" },
    "writing": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": string[], "weaknesses": string[], "subskillsAssessed": string[], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence" },
    "reading": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": string[], "weaknesses": string[], "subskillsAssessed": string[], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence" },
    "listening": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "strengths": string[], "weaknesses": string[], "subskillsAssessed": string[], "readinessTowardTarget": string, "whatToImproveNext": string, "evidenceNote": "1 sentence" },
    "grammar": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "subskillsAssessed": string[], "mainIssues": string[], "strengths": string[], "whatToImproveNext": string, "evidenceNote": "1 sentence" },
    "vocabulary": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "subskillsAssessed": string[], "mainIssues": string[], "strengths": string[], "whatToImproveNext": string, "evidenceNote": "1 sentence" },
    "testStrategy": { "evaluated": boolean, "evidenceCount": number, "score0to80": number|null, "scoreConfidenceLevel": string, "scoreProvisional": boolean, "subskillsAssessed": string[], "mainIssues": string[], "strengths": string[], "whatToImproveNext": string, "evidenceNote": "1 sentence" }
  },
  "errors": [
    { "error": "exact student quote with error", "correct": "corrected version", "category": "grammar|vocabulary|pronunciation|register|strategy|cohesion", "priority": "high|medium|low", "evidence": "exact quote", "explanation": "short 1-sentence rule" }
  ],
  "vocabulary": [
    { "wordOrPhrase": "word", "meaning": "definition appropriate for B1-B2 level", "exampleSentence": "example using this word", "category": "topic tag" }
  ],
  "gapVsTarget": {
    "speaking": "X points below target or 'Not evaluated'",
    "writing": "X points below target or 'Not evaluated'",
    "reading": "X points below target or 'Not evaluated'",
    "listening": "X points below target or 'Not evaluated'",
    "grammar": "X points below target or 'Not evaluated'",
    "vocabulary": "X points below target or 'Not evaluated'",
    "testStrategy": "X points below target or 'Not evaluated'",
    "prioritySkillForTarget": "name of the single skill most holding the student back from their target"
  },
  "priorityRecommendations": [
    { "rank": 1, "urgency": "Critical|Developing|Strength", "area": "short skill/subskill name", "evidence": "exact quote from the evidence", "whatToImprove": "1 concrete sentence", "howToImprove": "1 sentence — frame as hypothesis, not guarantee. Use 'try...' / 'experiment with...' / 'see if...'" }
  ]
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
• BANNED CERTAINTY PHRASES: "This will help", "This will improve", "This will make", "Doing X will Y" — these state pedagogical outcomes as proven fact. Instead, frame improvement advice as a testable hypothesis: "Try X and see if it helps", "One thing to experiment with is Y", "If you try Z next class, notice whether...". The goal is a suggestion the student can test, not a guaranteed result.
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
  const priorities = pickArray(diagnosis?.teacherMeaning?.priorityDiagnosis, diagnosis?.diagnosticData?.priorityRecommendations, diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(data?.errorBank, diagnosis?.diagnosticData?.errors, diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(data?.vocabTargets?.vocabularyTargets, diagnosis?.diagnosticData?.vocabulary, diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
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
 6. TOPICS: ${topicRules()}

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
   CASCADE GENERATION PROMPTS — 3-step homework building
══════════════════════════════════════════════════════════════ */

const EXERCISE_COMPLETENESS_RULES = `Complete exercise JSON requirements:
- mcq: type, title, question, options with exactly 4 choices, correct as 0-3, explanation, hints (array of 2 strings: strategic hint shown after 2 wrong attempts, procedural hint after 3 wrong attempts).
- blank: type, title, template with ___ markers, blanks array matching every blank, hints (array of 2 strings: shown after 2 and 3 wrong attempts).
- short: type, title, prompt, rubric, targetWords.
- speak: type, title, prompt, targetSeconds, imageDescription (1–2 sentence description of a scene or picture the student will describe or react to — required for picture-based speaking tasks, optional for opinion tasks).
- order: type, title, sentences array in correct order with at least 3 sentences.
- fix: type, title, errorText, correctedText, hint.
- flash: type, title, pairs array with at least 10 { "term", "def" } items.
- listen: type, title, audioText, question, options with exactly 4 choices, correct as 0-3, explanation, plays, pictureHint (1–2 sentence visual description of a scene related to the audio topic — used to generate an image shown before the student listens).
- read: type, title, passage (full reading text, 150–250 words, authentic MET-style), questions array of at least 3 items each with {question, options[4], correct as 0-3, explanation}.
Do not return placeholder text. Do not omit answer keys.`;

const GENERAL_MET_TOPIC_RULES = `Topics should reflect real-life situations appropriate for the MET exam: education, work, healthcare, technology, community, lifestyle, environment, personal decisions, public services, health and wellbeing. Avoid overly niche or culturally specific topics.`;

export const buildHomeworkBlueprintPrompt = ({ student, diagnosis }) => {
  const priorities = pickArray(diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const skillDx = diagnosis?.sections?.skillDiagnosis?.content || {};

  // Map each MET skill to the exercise types that practice it
  const SKILL_TO_TYPES = {
    speaking:   ['speak', 'short'],
    writing:    ['short', 'fix'],
    grammar:    ['fix', 'blank', 'mcq'],
    vocabulary: ['flash', 'blank'],
    reading:    ['read'],
    listening:  ['listen'],
  };
  const FALLBACK_TYPES = ['speak', 'short', 'listen', 'mcq', 'blank', 'flash', 'fix'];

  // Find evaluated skills ordered by score ascending (weakest first)
  const weakSkills = Object.entries(skillDx)
    .filter(([, d]) => d?.evaluated)
    .sort((a, b) => (a[1]?.score0to80 ?? 100) - (b[1]?.score0to80 ?? 100))
    .map(([skill, d]) => ({ skill, score: d?.score0to80, weaknesses: arr(d?.weaknesses) }));

  // Build task type list: types for the weakest skills first, fill to 7 from fallback
  const seen = new Set();
  const taskTypes = [];
  for (const { skill } of weakSkills) {
    for (const t of (SKILL_TO_TYPES[skill] || [])) {
      if (!seen.has(t)) { taskTypes.push(t); seen.add(t); }
    }
  }
  for (const t of FALLBACK_TYPES) {
    if (!seen.has(t) && taskTypes.length < 7) { taskTypes.push(t); seen.add(t); }
  }
  const finalTypes = taskTypes.slice(0, 7);

  const weakSummary = weakSkills.length
    ? weakSkills.slice(0, 3).map(({ skill, score, weaknesses }) =>
        `${skill}${score != null ? ` (${score}/80)` : ''}: ${weaknesses.slice(0, 2).join(', ') || 'needs work'}`
      ).join(' | ')
    : null;

  return `Create a complete MET homework blueprint for ${student?.name || 'the student'}.
Priorities: ${priorities.slice(0, 3).map(p => `${p.area}: ${p.whatToImprove || ''}`).join(' | ') || 'MET B1-B2 readiness'}.
${weakSummary ? `Diagnosed weaknesses (weakest first): ${weakSummary}.` : ''}

Rules:
- Build a targeted MET set using exactly these task types in this order: ${finalTypes.join(', ')}.
- The order reflects the student's diagnosed gaps — do not reorder.
- ${GENERAL_MET_TOPIC_RULES}

Return JSON only:
{ "title": string, "objective": string, "taskTypes": ${JSON.stringify(finalTypes)} }`;
};

export const buildTaskGeneratorPrompt = ({ student, diagnosis, taskBlueprint, taskType }) => {
  const priorities = pickArray(diagnosis?.teacherMeaning?.priorityDiagnosis, diagnosis?.diagnosticData?.priorityRecommendations, diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(diagnosis?.diagnosticData?.errors, diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(diagnosis?.diagnosticData?.vocabulary, diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar = pickArray(diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);

  return `Generate one complete, fully written ${taskType} exercise for ${student?.name || 'the student'}.
Target: ${taskBlueprint.objective}.

Student: ${student?.currentLevel || 'B1'} -> ${student?.targetLevel || 'B2'}
Priorities: ${priorities.slice(0, 3).map(p => `${p.area}: ${p.whatToImprove || ''}`).join(' | ') || 'MET readiness'}
Errors: ${errors.slice(0, 4).map(e => `"${e.error}" -> "${e.correct}"`).join(' | ') || 'none'}
Vocabulary: ${vocab.slice(0, 4).map(v => v.wordOrPhrase).join(', ') || 'general MET vocabulary'}
Grammar: ${grammar.slice(0, 3).map(g => `${g.area}: ${g.issue}`).join(' | ') || 'B1-B2 grammar control'}

${EXERCISE_COMPLETENESS_RULES}

MET focus:
- Speaking: organize a timed answer with example and clear conclusion.
- Writing: give a clear opinion, support, transitions, and grammar control.
- Listening/reading: test main idea, detail, inference, purpose, attitude, or distractor recognition.
- Grammar/vocabulary: practice the exact language needed to perform better on MET tasks.
- Test strategy: help the student notice evidence, distractors, timing, or answer organization.
- ${topicRules()}

Return ONLY one valid JSON object for type "${taskType}".`;
};

export const buildFinalRefinementPrompt = ({ student, blueprint, tasks }) => {
  const types = (tasks || []).map(t => (t?.type || t?.skillGroup || '')).filter(Boolean).join(', ');
  return `Review and refine this homework for ${student?.name || 'the student'}.
Blueprint: ${blueprint.title}
Exercise types included: ${types || 'mixed'}
Tasks: ${JSON.stringify(tasks)}

Rules:
- Generate short, natural student-facing instructions.
- Generate 3-5 DISCIPLINE-SPECIFIC self-check items. Each must name the MET standard being checked — not generic reminders like "check before submitting". Examples of good self-check items:
  • For speaking: "Did I state my position in the first 10–15 seconds?"
  • For Q4 speaking: "Did I cover both sides with roughly equal time (~40 seconds per side)?"
  • For Q5 speaking: "Did I use formal register throughout — no hedging, no 'maybe'?"
  • For writing: "Did I develop my main idea with at least one concrete example?"
  • For writing: "Do my connectives link ideas, or do they just list them?"
  • For listening/reading MCQ: "Did I choose the answer based on what was actually said/written, or was I tricked by familiar words?"
  • For fill-in-blank: "Does my answer fit both the grammar AND the meaning of the sentence?"
  Match self-check items to the actual exercise types in this homework set.
- Generate teacher review notes focused on what to inspect after submission.
- Keep language adult, calm, and MET-focused.
Return JSON: { "instructions": string, "selfCheck": [string], "teacherNotes": string }`;
};

/* ══════════════════════════════════════════════════════════════
   HOMEWORK GROUP PROMPT — per-skill-group exercise generation.
   Called once per selected skill group (speaking, grammar, etc.)
   so each call is small and cascade-resilient.
══════════════════════════════════════════════════════════════ */
export const buildHomeworkGroupPrompt = ({ student, diagnosis, group, count = 5 }) => {
  const priorities = pickArray(diagnosis?.teacherMeaning?.priorityDiagnosis, diagnosis?.diagnosticData?.priorityRecommendations, diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors     = pickArray(diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab      = pickArray(diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar    = pickArray(diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);
  const skillDx    = diagnosis?.sections?.skillDiagnosis?.content || {};

  // Pull skill-specific weaknesses when available
  const skillData  = skillDx[group] || {};
  const weaknesses = arr(skillData.weaknesses).slice(0, 4);

  // Map group key to required exercise types. listening/reading are LOCKED to their structured type.
  const TYPE_HINTS = {
    speaking:    'speak, short',
    writing:     'short, fix',
    grammar:     'fix, blank, mcq',
    vocabulary:  'flash, blank, mcq',
    reading:     'read',
    listening:   'listen',
    mixed:       'mcq, blank, short, fix',
  };
  const typeHint = TYPE_HINTS[group] || 'mcq, blank, short';
  const groupLabel = group.charAt(0).toUpperCase() + group.slice(1);
  const typeRule = group === 'listening'
    ? `- MANDATORY: Every exercise MUST be type "listen". Include audioText (2–4 sentence spoken script), question, 4 options, correct index, and explanation. No other types allowed.`
    : group === 'reading'
    ? `- MANDATORY: Every exercise MUST be type "read". Include passage (150–250 words), questions array with at least 3 items (each with question, 4 options, correct index, explanation). No other types allowed.`
    : `- Use types: ${typeHint}. Mix them for variety. Use the structured types: mcq, blank, short, speak, order, fix, flash, listen, read.`;

  return `You are a MET English exam preparation expert. Generate exactly ${count} structured exercises targeting ${groupLabel}.

━━━ STUDENT ━━━
${student?.name || 'Student'} | ${student?.currentLevel || 'B1'} → ${student?.targetLevel || 'B2'}

━━━ SKILL GROUP: ${groupLabel.toUpperCase()} ━━━
${weaknesses.length ? weaknesses.map(w => `- ${w}`).join('\n') : `Target: B1→B2 ${groupLabel} skills relevant to MET exam`}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.slice(0, 2).map(p => `- [${p.urgency}] ${p.area}: ${p.whatToImprove}`).join('\n') || 'None recorded.'}

━━━ ERRORS TO TARGET ━━━
${(errors.filter(e => (e.category || '').toLowerCase().includes(group)).slice(0, 4).length
  ? errors.filter(e => (e.category || '').toLowerCase().includes(group)).slice(0, 4)
  : errors.slice(0, 4)
).map(e => `- "${e.error}" → "${e.correct}" (${e.category})`).join('\n') || 'None recorded.'}

━━━ VOCABULARY / GRAMMAR TARGETS ━━━
${group === 'vocabulary' || group === 'mixed' ? vocab.slice(0, 4).map(v => `- ${v.wordOrPhrase}: ${v.meaning || ''}`).join('\n') || 'None.' : ''}
${group === 'grammar' || group === 'mixed' ? grammar.slice(0, 3).map(g => `- ${g.area}: ${g.issue}`).join('\n') || 'None.' : ''}

━━━ RULES ━━━
- Generate exactly ${count} exercises. Every exercise is FULLY WRITTEN — student opens and starts immediately.
${typeRule}
- Use general MET topics by default. ${GENERAL_MET_TOPIC_RULES}
- B1–B2 level. Each exercise should take 3–5 minutes.
- Keep every item connected to MET skills: speaking organization, writing support, reading/listening evidence, grammar control, vocabulary range, or test strategy.
- MET focus by skill group:
  Listening: test for lexical distractors and mid-stream information shifts; use discourse signposts (but, however, actually, instead, although).
  Reading: use the inference formula (Text clue + Logical conclusion = Inference); test paraphrase recognition and distractor resistance.
  Speaking: follow the execution formula for the specific MET task type (Q1–Q5). Q2 = 5-stage narrative; Q4 = balanced both sides; Q5 = formal persuasion.
  Writing: target the 7 assessment standards (Task Completion, Organization, Development, Grammar Accuracy, Vocabulary Range, Coherence, Register); encourage B2 connectors.
  Grammar: focus on B2 sub-system areas (verb tenses, conditionals, passive voice, modals, relative clauses, articles, prepositions).
  Vocabulary: focus on collocations, phrasal verbs, word formation, and register awareness.

${EXERCISE_COMPLETENESS_RULES}

Return ONLY valid JSON — an array of ${count} exercise objects:
[
  {
    "type": "mcq|blank|short|speak|order|fix|flash|listen|read",
    "skillGroup": "${group}",
    "title": "specific MET exercise title",
    "content": "FULLY WRITTEN exercise content — the actual sentences, questions, or scenario",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "template": "sentence with ___ marker",
    "blanks": ["answer1"],
    "sentences": ["sentence 1", "sentence 2"],
    "errorText": "student-facing text with errors",
    "correctedText": "corrected version (for fix type)",
    "hints": ["strategic hint shown after 2nd wrong try", "procedural hint shown after 3rd wrong try"],
    "pairs": [{"term": "word", "def": "meaning"}],
    "audioText": "text to read aloud (for listen type)",
    "question": "the question",
    "explanation": "why this answer is correct",
    "imageDescription": "for speak type: 1–2 sentence description of the scene/picture shown to the student",
    "passage": "for read type: full 150–250 word reading text",
    "questions": [{"question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..."}]
  }
]
Include only the fields relevant to the exercise type. The "content" field always contains the main exercise text.`;
};

/* ══════════════════════════════════════════════════════════════
   EXERCISE LIST PROMPT — used by homework-create.jsx
   Generate a menu of exercise options for the teacher to pick from.
   Restored: was dropped during the module-prompt refactor.
══════════════════════════════════════════════════════════════ */
export const buildExerciseListPrompt = ({ student, diagnosis, level, skill }) => {
  const priorities = pickArray(diagnosis?.teacherMeaning?.priorityDiagnosis, diagnosis?.diagnosticData?.priorityRecommendations, diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(diagnosis?.diagnosticData?.errors, diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(diagnosis?.diagnosticData?.vocabulary, diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const grammar = pickArray(diagnosis?.vocabTargets?.grammarTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.grammarTargets);
  const levelNote = level ? `\nTarget CEFR level: ${level}` : '';

  const isSpeaking = skill === 'speaking';
  const isWriting  = skill === 'writing';
  const exerciseCount = isSpeaking ? 5 : isWriting ? 2 : 7;

  const MET_SPEAKING_BRIEF = `
━━━ MET SPEAKING TASK ALIGNMENT ━━━
Generate exactly 5 exercises — one per MET Speaking task. Each must match the task structure below.
Set metTask and targetSeconds exactly as specified. Do NOT invent your own time limits.

Q1 | metTask:"Q1" | targetSeconds:60  | Picture description
  Structure: general scene → key details (foreground/background) → inference about what may be happening
  Register: neutral, descriptive. Use precise nouns. Avoid vague words like "a big thing".
  imageDescription: required — write a 1–2 sentence vivid scene description the student will describe.

Q2 | metTask:"Q2" | targetSeconds:60  | Personal experience / narrative
  Structure: Situation → Problem/Main Event → Action Taken → Result → Reflection/Lesson. Use past tenses consistently.
  Register: informal, narrative. Include sequence connectors (first, then, in the end).
  imageDescription: omit (no picture needed).

Q3 | metTask:"Q3" | targetSeconds:90  | Opinion / preference
  Structure: clear position stated first → Reason 1 + example → Reason 2 → brief conclusion.
  Register: informal but committed. ONE side only — never give both sides.
  imageDescription: omit.

Q4 | metTask:"Q4" | targetSeconds:90  | Advantages and disadvantages
  Structure: introduce both sides → Advantage 1 + support → Disadvantage 1 + support → balanced conclusion.
  Register: neutral, balanced. BOTH sides required with equal development (~40 s each).
  imageDescription: omit.

Q5 | metTask:"Q5" | targetSeconds:90  | Persuade an authority figure
  Structure: address authority respectfully → state core problem → present strong supporting reasons → offer a highly practical solution → close with a direct, formal request.
  Register: formal throughout ("I strongly believe…", "I would like to suggest…"). ONE committed side only.
  imageDescription: omit.`;

  const MET_WRITING_BRIEF = `
━━━ MET WRITING TASK ALIGNMENT ━━━
Generate exactly 2 exercises — one per MET Writing task. Match the format exactly.

T1 | metTask:"T1" | targetWords:80 | type:"short"
  Format: 3 related personal questions about a real-world situation.
  Student answers each in 2–3 sentences (direct answer + reason + small detail/example).
  Rubric hint: "Answer all 3 questions directly. Add a reason and a specific detail to each."
  Do NOT write an essay prompt. Write 3 numbered questions.

T2 | metTask:"T2" | targetWords:250 | type:"short"
  Format: a formal opinion essay prompt on a real-world topic.
  Student writes intro (opinion) + body 1 (reason + example) + body 2 (reason or counterpoint) + conclusion.
  Rubric hint: "4 paragraphs: opinion → reason + example → second point → conclusion. Use connectors."
  Prompt should invite a genuine opinion, not just describe something.
  Assessment standards: Task Completion, Organization, Development, Grammar Accuracy, Vocabulary Range, Coherence, Register.
  B2 connectors to encourage: In addition, Furthermore, This is because, For instance, However, Overall, In conclusion.`;

  const skillNote = isSpeaking ? MET_SPEAKING_BRIEF
                  : isWriting  ? MET_WRITING_BRIEF
                  : skill      ? `\nSkill focus: ${skill}`
                  : '';

  return `You are a MET English exam preparation expert. Generate a menu of ${exerciseCount} distinct, ready-to-use exercises for the teacher to choose from.${levelNote}${skillNote}

━━━ STUDENT ━━━
Name: ${student?.name || 'Student'}
Level: ${student?.currentLevel || 'B1'} → Target: ${student?.targetLevel || 'B2'}

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
${isSpeaking ? '- Generate one exercise per MET Speaking task (Q1–Q5). Follow the task map above exactly.' : isWriting ? '- Generate one exercise per MET Writing task (T1 and T2). Follow the task format above exactly.' : '- Cover different MET skills: speaking, writing, reading or listening, grammar, vocabulary, and test strategy.'}
- Each exercise should take 5–15 minutes.
- Match B1–B2 transition level. Use general MET topics by default, not nurse/healthcare scenarios.
- ${topicRules()}
- Use the INTERACTIVE EXERCISE TYPES below to create varied, engaging exercises.
- Return only exercises that include all required fields and answer keys.

${EXERCISE_COMPLETENESS_RULES}

━━━ INTERACTIVE EXERCISE TYPES ━━━
You MUST use these exact type IDs. Each has a specific JSON shape:

1. "mcq" (Multiple Choice) — question + 4 options + correct answer index
2. "blank" (Fill the Blank) — template with ___ markers + correct answers (pipe-separated alternatives)
3. "short" (Short Answer) — prompt + rubric hint + target word count
4. "speak" (Speaking Prompt) — prompt + targetSeconds + metTask (required when skill=speaking: "Q1"–"Q5") + imageDescription (required for Q1 picture tasks)
5. "order" (Order Sentences) — sentences array in correct order (student sees shuffled)
6. "fix" (Error Correction) — errorText + correctedText + hint
7. "flash" (Flashcards) — at least 10 pairs of term/definition
8. "listen" (Listening Exercise) — audioText (the text read aloud via TTS) + plays (number of allowed listens, default 2) + question + 4 options + correct answer index + optional explanation

Return ONLY valid JSON — an array of ${exerciseCount} exercises${isSpeaking ? ' (one per MET Speaking task Q1–Q5)' : isWriting ? ' (T1 short questions, T2 essay)' : ' mixing different types'}:
[
  {
    "title": "Short exercise title",
    "type": "mcq",
    "duration": "5 min",
    "content": "Which sentence uses the correct form?",
    "question": "Which sentence uses the correct form?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct": 1,
    "explanation": "Why the correct option fits the grammar or MET evidence.",
    "hints": ["Think about which tense fits the time context.", "The sentence refers to a completed action — which tense signals completion?"],
    "teacherNote": "What to look for"
  },
  {
    "title": "Fill in the blanks — articles",
    "type": "blank",
    "duration": "8 min",
    "content": "The student gave ___ presentation to ___ class on Friday.",
    "template": "The student gave ___ presentation to ___ class on Friday.",
    "blanks": ["the|a", "the"],
    "hints": ["Think about whether these nouns are specific or general.", "Use 'the' for something both speaker and listener already know about."],
    "teacherNote": "Check article use before nouns"
  },
  {
    "title": "Opinion paragraph",
    "type": "short",
    "duration": "12 min",
    "content": "Write 80–120 words arguing whether...",
    "prompt": "Write 80–120 words arguing whether...",
    "targetWords": 120,
    "rubric": "Open with stance, give example, close with consequence",
    "teacherNote": "Look for cohesion markers"
  },
  {
    "title": "Speaking — past experience",
    "type": "speak",
    "duration": "5 min",
    "content": "Describe a challenging moment at work using past simple. 60 seconds.",
    "prompt": "Describe a challenging moment at work using past simple. 60 seconds.",
    "targetSeconds": 60,
    "teacherNote": "Check tense consistency"
  },
  {
    "title": "Community event steps",
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
    "options": ["To complain about a schedule change", "To request information about an event", "To explain a new policy", "To apologise for a delay"],
    "correct": 1,
    "explanation": "The speaker asks directly about the event details, making option B the correct answer.",
    "teacherNote": "Targets speaker_purpose subskill — check if student identified intent vs topic"
  }
]`;
};

/**
 * Module 5: Listening Generator (The Audio Architect)
 * Focus: High-fidelity listening tasks for MET.
 */
export const buildListeningGeneratorPrompt = ({ student, diagnosis, taskBlueprint }) => {
  const priorities = pickArray(diagnosis?.teacherMeaning?.priorityDiagnosis, diagnosis?.diagnosticData?.priorityRecommendations, diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const errors = pickArray(diagnosis?.diagnosticData?.errors, diagnosis?.errorBank, diagnosis?.sections?.errorBankSuggestions?.content);
  const vocab = pickArray(diagnosis?.diagnosticData?.vocabulary, diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);

  return `You are a MET English Instructional Designer specializing in Listening comprehension.
Build one complete, student-ready listening exercise.

━━━ STUDENT ━━━
Name: ${student?.name || 'Student'}
Level: ${student?.currentLevel || 'B1'} → Target: ${student?.targetLevel || 'B2'}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.slice(0, 3).map(p => `- [${p.urgency}] ${p.area}: ${p.whatToImprove}`).join('\n') || 'none'}

━━━ TARGET ERRORS & VOCAB ━━━
Errors: ${errors.slice(0, 4).map(e => `"${e.error}" → "${e.correct}"`).join(', ') || 'none'}
Vocab: ${vocab.slice(0, 4).map(v => v.wordOrPhrase).join(', ') || 'general MET vocabulary'}

━━━ RULES ━━━
1. COMPLETENESS: The output must be a single valid JSON object for the 'listen' type.
2. AUDIO TEXT: The 'audioText' must be a realistic, 2–5 sentence dialogue or monologue. 
   - Use a general MET topic by default, not the student's professional context.
   - ${topicRules()}
   - It should target B1-B2 level complexity.
3. MET FOCUS: The task must target one of these MET listening subskills: main_idea, detail, inference, speaker_purpose, or vocabulary_in_context.
4. QUESTIONS: The 'question' must be clear. The 'options' must have exactly 4 choices.
5. DISTRACTORS: At least one distractor must be a "plausible mistake" (e.g., a detail mentioned in the audio that is NOT the answer to the question).
6. EXPLANATION: Provide a clear, supportive explanation of WHY the correct answer is right.
7. PICTURE HINT: Include a pictureHint that describes a concrete visual scene related to the audio topic. Use specific, visible details (people, setting, objects, actions) that can be turned into an illustration. Avoid abstract concepts — describe what someone would see.
8. FORMAT: Use the following structure.

${EXERCISE_COMPLETENESS_RULES}

RETURN ONLY VALID JSON:
{
  "type": "listen",
  "title": "short title",
  "audioText": "the script to be read aloud",
  "question": "the question",
  "options": ["opt1", "opt2", "opt3", "opt4"],
  "correct": 0,
  "explanation": "why it's correct",
  "plays": 2,
  "pictureHint": "1–2 sentence visual description of a scene related to the audio topic. Describe specific, concrete visual details that can be turned into an illustration — e.g. 'A nurse checking a patient's blood pressure in a bright hospital room. The patient is sitting on the bed, smiling.'",
  "teacherNote": "what to look for in the student's response"
}`;
};

/**
 * Module 6: Reading Generator (The Passage Architect)
 * Focus: High-fidelity reading comprehension tasks for MET.
 */
export const buildReadingGeneratorPrompt = ({ student, diagnosis, questionCount = 3 }) => {
  const priorities = pickArray(diagnosis?.priorityDiagnosis, diagnosis?.sections?.priorityDiagnosis?.content);
  const vocab = pickArray(diagnosis?.vocabTargets?.vocabularyTargets, diagnosis?.sections?.vocabGrammarTargets?.content?.vocabularyTargets);
  const level = student?.currentLevel || 'B1';
  const targetLevel = student?.targetLevel || 'B2';

  return `You are a MET English Instructional Designer specializing in Reading comprehension.
Build one complete, student-ready reading exercise with a passage and ${questionCount} comprehension questions.

━━━ STUDENT ━━━
Name: ${student?.name || 'Student'}
Level: ${level} → Target: ${targetLevel}

━━━ DIAGNOSIS PRIORITIES ━━━
${priorities.slice(0, 3).map(p => `- [${p.urgency}] ${p.area}: ${p.whatToImprove}`).join('\n') || 'none'}

━━━ TARGET VOCAB ━━━
${vocab.slice(0, 6).map(v => v.wordOrPhrase).join(', ') || 'general MET academic vocabulary'}

━━━ RULES ━━━
1. PASSAGE: Write a realistic 120–200 word passage at ${level}–${targetLevel} level.
   - Use an informational or opinion text on a general interest topic.
   - ${GENERAL_MET_TOPIC_RULES}
   - Weave 2–3 of the target vocab words in naturally.
2. QUESTIONS: Write exactly ${questionCount} MCQ comprehension questions.
   - Cover different subskills: main_idea, specific_detail, inference, vocabulary_in_context.
   - Each question must have exactly 4 options. One must be unambiguously correct.
   - Distractors should be plausible — paraphrased details or reasonable inferences from the passage.
3. CORRECT: Use integer index (0–3) to mark the correct option.
4. COMPLETENESS: Every question must have all 4 options filled. No empty strings.
5. VOCABULARY: Include 3–5 key vocabulary words from the passage at ${level}–${targetLevel} level. These should be useful academic or topic-specific words the student should learn.

RETURN ONLY VALID JSON:
{
  "type": "read",
  "title": "short title",
  "passage": "the full reading passage here",
  "source": "Adapted from [source] (optional, or empty string)",
  "vocabulary": ["word1", "word2", "word3"],
  "questions": [
    {
      "question": "Q1 text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "why A is correct"
    }
  ],
  "teacherNote": "reading skill focus and what to discuss"
}`;
};
