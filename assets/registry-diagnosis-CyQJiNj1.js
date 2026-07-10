import{p as t}from"./parser-BMYagtSM.js";import{r as n}from"./SKILL-BQOSomSK.js";const a=`---
# AGENT SKILLS STANDARD FIELDS (v2)
name: gap-analysis-from-student-work
description: "Analyse student work against criteria to identify specific gaps between current performance and learning objectives. Use when reviewing submissions, planning feedback, or diagnosing learning needs."
disable-model-invocation: false
user-invocable: true
effort: medium

# EXISTING FIELDS

skill_id: "curriculum-assessment/gap-analysis-from-student-work"
skill_name: "Gap Analysis from Student Work"
domain: "curriculum-assessment"
version: "1.0"
evidence_strength: "strong"
evidence_sources:
  - "Black & Wiliam (1998) — Assessment and Classroom Learning"
  - "Hattie & Timperley (2007) — The Power of Feedback"
  - "Sadler (1989) — Formative assessment and the design of instructional systems"
  - "Heritage (2010) — Formative Assessment: making it happen in the classroom"
  - "Wiliam (2011) — Embedded Formative Assessment"
input_schema:
  required:
    - field: "student_work_description"
      type: "string"
      description: "A description or transcript of the student's work — what they produced"
    - field: "assessment_criteria"
      type: "string"
      description: "The criteria or rubric the work should be assessed against"
    - field: "learning_objective"
      type: "string"
      description: "What the student was supposed to learn or demonstrate"
  optional:
    - field: "student_level"
      type: "string"
      description: "Age/year group"
    - field: "student_profile"
      type: "string"
      description: "From context engine: prior attainment, known strengths and gaps"
    - field: "subject_area"
      type: "string"
      description: "The curriculum subject"
    - field: "task_description"
      type: "string"
      description: "The task the student was completing"
output_schema:
  type: "object"
  fields:
    - field: "gap_analysis"
      type: "object"
      description: "Specific gaps identified, classified by type — conceptual, procedural, or communication"
    - field: "strengths"
      type: "array"
      description: "What the student does well — specific, evidence-based strengths"
    - field: "next_teaching_steps"
      type: "array"
      description: "Targeted actions to address each gap — not generic advice but specific next steps"
    - field: "feedback_script"
      type: "string"
      description: "How to communicate the analysis to the student in a way that promotes improvement"
chains_well_with:
  - "feedback-quality-analyser"
  - "criterion-referenced-rubric-generator"
  - "error-analysis-protocol"
  - "practice-problem-sequence-designer"
  - "kud-knowledge-type-mapper"
teacher_time: "3 minutes"
tags: ["gap-analysis", "student-work", "formative-assessment", "feedback", "diagnostic"]
---

# Gap Analysis from Student Work

## What This Skill Does

Analyses a student work sample against assessment criteria, identifies specific gaps (not just "needs improvement" but exactly WHAT is missing and WHY), classifies each gap by type (conceptual misunderstanding, procedural error, or communication/presentation issue), and generates targeted next teaching steps — specific actions the teacher can take to close each gap, rather than generic advice like "practise more." The output also includes a feedback script showing how to communicate the analysis to the student in a way that promotes improvement. AI is specifically valuable here because effective gap analysis requires simultaneously comparing the work to the criteria, diagnosing the type of gap (which determines the remedy), identifying strengths (which maintain motivation), and designing a targeted next step (which requires pedagogical knowledge) — a multi-layered analysis that takes significant time and expertise to do well.

## Evidence Foundation

Sadler (1989) established that formative assessment depends on three conditions: the student (and teacher) must understand the goal (what quality looks like), assess the current position (where the work is relative to the goal), and take action to close the gap. Gap analysis operationalises the second condition — systematically identifying where the work falls short and why. Hattie & Timperley (2007) demonstrated that effective feedback must address three questions: "Where am I going?" (the goal), "How am I going?" (current performance relative to the goal), and "Where to next?" (specific actions to close the gap). Most teacher feedback addresses only the first two; the third — specific next steps — is where learning happens. Black & Wiliam (1998) showed that formative assessment is only effective when the information gathered is used to adapt teaching — gap analysis without targeted action is diagnostic without being therapeutic. Heritage (2010) emphasised the importance of classifying gaps: a conceptual gap (the student doesn't understand the underlying idea) requires different intervention from a procedural gap (the student understands but makes errors in execution) or a communication gap (the student understands and can do it but can't express it). Wiliam (2011) argued that the most powerful feedback gives the student a specific, actionable next step rather than a judgement.

## Input Schema

The teacher must provide:
- **Student work description:** What the student produced. *e.g. "Student wrote: 'The writer uses a metaphor to describe the storm. This is effective because it makes the reader interested.'" / "Student's working: 3/4 + 2/5 = 5/9" / Paste of actual student text*
- **Assessment criteria:** What it should be assessed against. *e.g. "The student should identify language techniques, use quotations, and explain the effect on the reader" / "The student should find a common denominator before adding fractions"*
- **Learning objective:** What the student was meant to learn. *e.g. "Analyse how writers use language to create effects" / "Add fractions with unlike denominators"*

Optional (injected by context engine if available):
- **Student level:** Year group
- **Student profile:** Prior attainment, strengths, known gaps
- **Subject area:** The subject
- **Task description:** The task the student was completing

## Prompt

\`\`\`
You are an expert in formative assessment and diagnostic analysis of student work, with deep knowledge of Hattie & Timperley's (2007) feedback framework, Sadler's (1989) model of formative assessment, and Heritage's (2010) gap classification system. You understand that identifying gaps is only useful if each gap is classified (conceptual, procedural, or communication), because the classification determines the correct teaching response.

Your task is to analyse this student work:

**Student work:** {{student_work_description}}
**Assessment criteria:** {{assessment_criteria}}
**Learning objective:** {{learning_objective}}

The following optional context may or may not be provided. Use whatever is available; ignore any fields marked "not provided."

**Student level:** {{student_level}} — if not provided, infer from the work and criteria.
**Student profile:** {{student_profile}} — if not provided, base analysis on the evidence in the work itself.
**Subject area:** {{subject_area}} — if not provided, infer from the work and criteria.
**Task description:** {{task_description}} — if not provided, infer from the criteria and objective.

Apply these evidence-based principles:

1. **Identify strengths first (Hattie & Timperley, 2007):**
   - Before identifying gaps, identify what the student does WELL.
   - Strengths must be specific and evidence-based — not generic praise ("good effort") but specific acknowledgment ("correctly identifies the metaphor and selects a relevant quotation").
   - Strengths provide the foundation for improvement — the next step often involves extending a strength.

2. **Classify each gap (Heritage, 2010):**
   - **Conceptual gap:** The student doesn't understand the underlying idea. ("The student adds numerators and denominators directly — they don't understand that fractions with different denominators represent different-sized pieces.")
   - **Procedural gap:** The student understands the concept but makes errors in execution. ("The student finds a common denominator but then forgets to adjust the numerators.")
   - **Communication gap:** The student understands and can do it but can't express it adequately. ("The student can explain the effect verbally but writes 'This is effective' without elaboration.")
   - Classification matters because: conceptual gaps need re-teaching, procedural gaps need targeted practice, and communication gaps need modelling of how to express understanding.

3. **Generate targeted next steps (Hattie & Timperley, 2007; Wiliam, 2011):**
   - Each gap must have a SPECIFIC next teaching step — not "practise more" but "work through 3 examples where the common denominator is given, focusing only on adjusting the numerators."
   - Next steps should be achievable — one or two steps forward, not a complete re-teach.
   - Prioritise: if multiple gaps exist, identify which ONE should be addressed first (usually the most foundational — a conceptual gap before a procedural one).

4. **Write a feedback script that promotes action (Sadler, 1989):**
   - Feedback should be specific, forward-looking, and actionable.
   - Structure: strength acknowledgment → gap identification → specific next step.
   - Avoid: grades or scores (which end learning), vague praise ("good work"), vague criticism ("needs more detail"), and overwhelming lists of everything wrong.

Return your output in this exact format:

## Gap Analysis: [Brief description]

**Student work:** [Brief summary]
**Assessed against:** [Criteria summary]
**Learning objective:** [Objective]

### Strengths

[Specific, evidence-based strengths — what the student does well]

### Gaps Identified

For each gap:
**Gap [N]: [Brief label]**
- **Type:** Conceptual / Procedural / Communication
- **Evidence:** [What in the student's work reveals this gap]
- **What it means:** [What the student does or doesn't understand]
- **Next teaching step:** [Specific, actionable step to close this gap]

### Priority

[Which gap to address first and why]

### Feedback Script

[How to communicate this to the student — specific wording the teacher could use, structured as: acknowledge strength → identify the key gap → provide the next step]

**Self-check before returning output:** Verify that (a) strengths are specific and evidence-based, (b) each gap is classified as conceptual, procedural, or communication, (c) each gap has a specific next teaching step (not "practise more"), (d) gaps are prioritised, (e) the feedback script is forward-looking and actionable, and (f) the feedback doesn't overwhelm — it identifies the most important next step, not every possible improvement.
\`\`\`

## Example Output

**Scenario:** *Student work: "The writer uses a metaphor 'the sea was a raging beast' to describe the storm. This is a good metaphor because it compares the sea to a beast. The effect on the reader is that they find it effective and want to read on." / Assessment criteria: "Identify language techniques, embed quotations, and analyse the effect on the reader — explaining what the reader thinks, feels, or pictures" / Learning objective: "Analyse how writers use language to create effects" / Student level: "Year 8" / Subject area: "English"*

---

## Gap Analysis: Language Analysis — Metaphor

**Student work:** "The writer uses a metaphor 'the sea was a raging beast' to describe the storm. This is a good metaphor because it compares the sea to a beast. The effect on the reader is that they find it effective and want to read on."
**Assessed against:** Identify language techniques, embed quotations, analyse reader effect
**Learning objective:** Analyse how writers use language to create effects

### Strengths

1. **Correctly identifies the technique.** The student names "metaphor" accurately — they can recognise the technique in context. This is a necessary foundation for analysis.
2. **Selects a relevant quotation.** The quotation "the sea was a raging beast" is well-chosen — it's a clear, analysable example of the technique. The student demonstrates good evidence selection.
3. **Embeds the quotation correctly.** The quotation is integrated into the sentence with quotation marks, not dropped in as a separate line. This shows awareness of academic writing conventions.
4. **Attempts to discuss effect on the reader.** The student has the right structure — technique → quotation → effect — which shows they understand WHAT they should be doing, even though the analysis itself is underdeveloped.

### Gaps Identified

**Gap 1: Generic effect analysis — "effective and want to read on"**
- **Type:** Communication gap (likely — see note below)
- **Evidence:** The student writes "they find it effective and want to read on." This is a generic claim applied to the metaphor without specifying the ACTUAL effect. "Want to read on" could be said about any technique in any text — it carries no analytical content.
- **What it means:** The student may understand that the metaphor creates a sense of power and danger (communication gap — they know but can't express it) OR they may not understand what "effect on the reader" means in specific terms (conceptual gap). Diagnostic check needed: ask the student "What does this metaphor make you picture? What feeling does it create?" If they can answer verbally, it's a communication gap. If they can't, it's conceptual.
- **Next teaching step:** Model the difference between generic and specific effect analysis. Show the student: Generic: "This is effective." Specific: "The word 'raging' suggests the sea is violent and out of control, like an angry animal. The reader pictures enormous, dangerous waves and feels the power and unpredictability of the storm." Practise with 2–3 more quotations: "What does this make you SEE? What does this make you FEEL?"

**Gap 2: Explaining the comparison rather than analysing it**
- **Type:** Conceptual gap
- **Evidence:** "This is a good metaphor because it compares the sea to a beast." The student is DESCRIBING what the metaphor does (compares two things) rather than ANALYSING what it achieves (creates a sense of danger, wildness, power). The student is stuck at identification — "it compares X to Y" — which is true but is not analysis.
- **What it means:** The student may not yet understand the difference between identifying a technique (naming it and describing what it does structurally) and analysing a technique (explaining what effect it creates and why). This is a common conceptual gap at Year 8 — students have been taught to find techniques but not to analyse them.
- **Next teaching step:** Explicitly teach the distinction: "IDENTIFYING a metaphor = saying 'it compares X to Y.' ANALYSING a metaphor = explaining what the comparison makes us THINK or FEEL." Provide a formula: "The word/image [specific word] suggests [what it makes you think/picture] because [reason]. This creates a sense of [emotion/atmosphere] for the reader." Practise this formula with the same quotation, then with a new one.

**Gap 3: No analysis of specific word choices within the quotation**
- **Type:** Procedural gap
- **Evidence:** The student quotes "the sea was a raging beast" as a whole but doesn't zoom in on specific words — "raging" (violence, anger, out of control) and "beast" (animal, dangerous, powerful, inhuman). Effective analysis works at the word level, not just the phrase level.
- **Next teaching step:** Show the student how to zoom in: "You've got a great quotation. Now let's look at the individual words. What does 'raging' make you think of? What about 'beast'? Why didn't Dickens write 'the sea was a large animal'? What's different about 'raging beast'?" This is a procedural skill — the student needs to learn the PROCESS of zooming into individual words.

### Priority

Address **Gap 2 first** (explaining vs. analysing). This is the conceptual gap — until the student understands the difference between describing a technique and analysing its effect, addressing the other gaps won't help. Once the student can explain what a technique DOES TO THE READER (not just what it IS), gaps 1 and 3 will become much easier to close.

### Feedback Script

"Right, let me show you what you've done well and one thing to work on.

**Strength:** You've done three things really well here. You've correctly identified the metaphor — that's right, it IS a metaphor. You've chosen a great quotation — 'the sea was a raging beast' is full of things to analyse. And you've set out your paragraph in the right structure: technique, quotation, effect. So your foundation is solid.

**The gap:** Here's the thing I want you to work on. You write 'the effect on the reader is that they find it effective.' But that doesn't tell me anything specific. If I read 'the sea was a raging beast,' what do I actually PICTURE? What do I FEEL? Close your eyes — what does a 'raging beast' look like? [Let the student respond.] Exactly — something powerful, dangerous, out of control. THAT is the effect. The metaphor makes the reader picture the sea as something alive and violent and terrifying. That's analysis.

**Next step:** Here's your rule for next time. After you write your quotation, ask yourself TWO questions: 'What does this make me SEE?' and 'What does this make me FEEL?' Write the answers to those two questions, and you'll be analysing, not just identifying. Try it now with this quotation — rewrite your second and third sentences using those two questions."

---

## Known Limitations

1. **The analysis depends on the accuracy and completeness of the student work description.** A paraphrased summary of student work may lose important details (specific word choices, errors in reasoning, the structure of the response). Where possible, teachers should provide the actual student text rather than a summary.

2. **Diagnostic ambiguity between gap types.** Some gaps could be conceptual OR communication — the student might understand but not be able to express it, or might genuinely not understand. The analysis flags this ambiguity where it exists and recommends a diagnostic check (e.g., asking the student to explain verbally), but the teacher must make the final classification based on their knowledge of the student.

3. **The analysis is based on a single work sample.** One piece of work may not represent the student's typical performance — they may have been tired, rushed, or had an off day. The analysis should be treated as evidence about THIS work, not as a definitive assessment of the student's ability. Multiple work samples over time provide a more reliable picture.
`,i=`---
# AGENT SKILLS STANDARD FIELDS (v2)
name: error-analysis-protocol
description: "Design an error analysis protocol to diagnose the root cause of student mistakes and misconceptions. Use when error patterns appear in student work and targeted feedback is needed."
disable-model-invocation: false
user-invocable: true
effort: medium

# EXISTING FIELDS

skill_id: "self-regulated-learning/error-analysis-protocol"
skill_name: "Error Analysis Protocol"
domain: "self-regulated-learning"
version: "1.0"
evidence_strength: "moderate"
evidence_sources:
  - "Borasi (1994) — Capitalizing on errors as 'springboards for inquiry': a teaching experiment"
  - "Black & Wiliam (1998) — Assessment and classroom learning (formative assessment and error use)"
  - "Metcalfe (2017) — Learning from errors: benefits of errors in the classroom"
  - "Siegler (2002) — Microgenetic studies of self-explanation: how children develop mathematical understanding"
  - "Tulis et al. (2016) — Learning from errors: a model of individual processes"
input_schema:
  required:
    - field: "student_work_sample"
      type: "string"
      description: "Description or transcript of the student work containing errors"
    - field: "task_description"
      type: "string"
      description: "What the student was asked to do and the learning objective"
    - field: "subject_area"
      type: "string"
      description: "Subject and year group"
  optional:
    - field: "correct_response"
      type: "string"
      description: "What a correct response would look like for comparison"
    - field: "student_profiles"
      type: "array"
      description: "From context engine: prior attainment, known learning difficulties, error history"
    - field: "rubric"
      type: "string"
      description: "From context engine: rubric or success criteria for the task"
    - field: "error_frequency"
      type: "string"
      description: "Whether this error is a one-off or a recurring pattern"
output_schema:
  type: "object"
  fields:
    - field: "error_classification"
      type: "array"
      description: "Each error classified as procedural, conceptual, or careless — with evidence for the classification"
    - field: "root_cause_analysis"
      type: "string"
      description: "Hypothesised cause of each error with diagnostic questions to confirm"
    - field: "targeted_response"
      type: "array"
      description: "Specific follow-up actions for each error type"
    - field: "student_self_analysis_guide"
      type: "string"
      description: "Scaffolded prompts for the student to analyse their own errors"
chains_well_with:
  - "feedback-quality-analyser"
  - "gap-analysis-from-student-work"
  - "metacognitive-prompt-library"
  - "worked-example-fading-designer"
teacher_time: "4 minutes"
tags: ["error-analysis", "formative-assessment", "misconceptions", "diagnosis", "feedback"]
---

# Error Analysis Protocol

## What This Skill Does

Structures the analysis of student errors to distinguish between procedural errors (wrong method applied correctly), conceptual misunderstandings (fundamental misconception driving the error), and careless mistakes (correct understanding, faulty execution) — then generates targeted follow-up actions appropriate to each error type. Critically, the skill also produces a student self-analysis scaffold so learners can develop their own error-detection skills over time. AI is specifically valuable here because most teachers respond to all errors the same way ("try again" or "here's the correct answer"), when the research shows that each error type requires a fundamentally different response — re-teaching for conceptual errors, practice for procedural errors, and metacognitive monitoring for careless mistakes.

## Evidence Foundation

Borasi (1994) demonstrated that errors, when properly analysed rather than simply corrected, become powerful learning opportunities — "springboards for inquiry" that reveal student thinking and create entry points for instruction. Black & Wiliam (1998) identified error analysis as a core component of effective formative assessment, arguing that the diagnostic use of errors is what distinguishes formative from summative practice. Metcalfe (2017) reviewed the benefits of errors in learning and found that errors followed by corrective feedback produce stronger learning than errorless learning, because the error creates a prediction violation that deepens encoding — but only when the error is analysed, not just corrected. Siegler (2002) used microgenetic methods to show that children's mathematical development depends on understanding *why* incorrect strategies fail, not just learning correct strategies. Tulis et al. (2016) developed a model of individual error processing, identifying that productive error learning requires: error detection (noticing the error), error attribution (identifying the cause), and error correction strategy (knowing what to do differently) — and that each of these can be explicitly taught.

## Input Schema

The teacher must provide:
- **Student work sample:** The work containing errors — described or transcribed. *e.g. "Student wrote: 3/4 + 2/3 = 5/7. They added numerators and denominators separately." / "In a history essay, the student wrote 'Hitler started WW1 because he invaded Poland.'"*
- **Task description:** What the student was asked to do. *e.g. "Add fractions with unlike denominators" / "Explain the causes of World War II"*
- **Subject area:** Subject and year group. *e.g. "Year 7 Mathematics" / "Year 10 History"*

Optional (injected by context engine if available):
- **Correct response:** What a correct response looks like
- **Student profiles:** Prior attainment, known difficulties, error history
- **Rubric:** Success criteria for the task
- **Error frequency:** Whether this is a one-off or recurring pattern

## Prompt

\`\`\`
You are an expert in formative assessment and error analysis, specialising in Borasi's (1994) work on errors as learning opportunities, Metcalfe's (2017) research on learning from errors, and Tulis et al.'s (2016) model of productive error processing. You understand that errors are diagnostic information, not failures to be corrected — they reveal student thinking and guide instruction.

Your task is to analyse the following student errors:

**Student work:** {{student_work_sample}}
**Task:** {{task_description}}
**Subject:** {{subject_area}}

The following optional context may or may not be provided. Use whatever is available; ignore any fields marked "not provided."

**Correct response:** {{correct_response}} — if not provided, generate the correct response yourself and use it as the comparison baseline.
**Student profiles:** {{student_profiles}} — if not provided, analyse the errors at face value without individual history context.
**Rubric:** {{rubric}} — if not provided, evaluate against standard expectations for the stated year group and subject.
**Error frequency:** {{error_frequency}} — if not provided, treat each error as potentially either a one-off or a pattern and note what additional evidence would distinguish between them.

Apply these evidence-based principles:

1. **Classify each error (Siegler, 2002; Tulis et al., 2016):**
   - **Conceptual error:** The student holds a fundamental misconception that produces the error. The error is logical *given their incorrect mental model*. Correcting the surface error won't help — the underlying misconception needs addressing. Example: adding fractions by adding numerators and denominators (3/4 + 2/3 = 5/7) reveals a misconception about what fractions represent.
   - **Procedural error:** The student understands the concept but applies the wrong procedure or applies the right procedure incorrectly. They know *what* to do but not *how*. Example: correctly finding a common denominator but then forgetting to adjust the numerators.
   - **Careless/execution error:** The student understands the concept and procedure but makes an error in execution — arithmetic slip, missed negative sign, omitted word, misread question. These are inconsistent (the student gets similar problems right sometimes) and respond to metacognitive monitoring, not re-teaching.

2. **Look for the logic in the error (Borasi, 1994):** Errors are rarely random. Ask: "What would the student need to believe for this answer to make sense?" This reveals their mental model. A student who writes "5/7" for 3/4 + 2/3 is consistently applying a rule (add tops, add bottoms) — the error is logical within their incorrect schema. Understanding their logic is essential for correcting it.

3. **Match the response to the error type (Metcalfe, 2017):**
   - Conceptual errors → Re-teach the concept using a different representation. Directly confront the misconception. Use cognitive conflict (show the student why their answer can't be right).
   - Procedural errors → Provide a worked example of the correct procedure. Practice with feedback. The concept doesn't need re-teaching — just the method.
   - Careless errors → Don't re-teach. Instead, build metacognitive checking habits. Teach the student to estimate, check, and verify.

4. **Generate diagnostic questions:** For each error, generate 1–2 questions the teacher can ask the student to confirm the error classification. "Can you explain why you added the numerators?" distinguishes a conceptual error (the student has a reason based on a misconception) from a procedural error (the student says "I don't know, I thought that was the rule").

5. **Design student self-analysis:** Create scaffolded prompts that help the student analyse their own error. This builds the error-detection and attribution skills in Tulis et al.'s (2016) model.

Return your output in this exact format:

## Error Analysis: [Task/Subject]

### Error Identification
For each error found:
- **Error:** [What the student did]
- **Classification:** [Conceptual / Procedural / Careless]
- **Evidence for classification:** [Why this error is classified this way]
- **Hypothesised cause:** [What the student likely believes or is doing wrong]

### Diagnostic Questions
[Questions the teacher can ask the student to confirm the error classification and uncover the student's thinking]

### Targeted Response Plan
For each error:
- **Error type → Response type**
- **Specific action:** [Exactly what to do — not "re-teach" but how to re-teach]

### Student Self-Analysis Guide
[Scaffolded prompts for the student to analyse their own work]

### Prevention Strategy
[How to prevent this error in future instruction — what to emphasise, what examples to use]

**Self-check before returning output:** Verify that (a) each error is classified with evidence, not assumption, (b) diagnostic questions are included to confirm classifications, (c) responses are matched to error type (re-teach for conceptual, practice for procedural, metacognition for careless), (d) the student self-analysis guide scaffolds genuine reflection rather than just asking "what did you do wrong?", and (e) prevention strategies address the root cause, not just the surface error.
\`\`\`

## Example Output

**Scenario:** *Student work: "Question: Simplify 4x + 3 + 2x - 5. Student answer: 6x - 15. Working shown: 4x + 2x = 6x (correct so far), then 3 - 5 = -15." / Task: "Simplify algebraic expressions by collecting like terms" / Subject: "Year 8 Mathematics"*

---

## Error Analysis: Simplifying Algebraic Expressions — Year 8 Mathematics

### Error Identification

**Error 1:**
- **Error:** Student calculated 3 - 5 = -15 (instead of -2)
- **Classification:** Uncertain — requires diagnostic questioning. This could be:
  - (a) A **careless/execution error** — the student knows how to subtract but made a slip (perhaps multiplying instead of subtracting), OR
  - (b) A **conceptual error** — the student may believe that when collecting terms, you multiply the constants rather than add/subtract them, possibly because they confused collecting like terms with a different operation
- **Evidence for classification:** The student correctly added the x terms (4x + 2x = 6x), which suggests they understand collection for algebraic terms. The error with constants could be a one-off slip (3 × 5 = 15, with the negative from the subtraction) or a systematic confusion. The working shows "3 - 5 = -15" which looks like the student multiplied 3 × 5 and kept the negative sign. This pattern (multiplying instead of subtracting) would be a procedural error if consistent.
- **Hypothesised cause:** Most likely hypothesis: the student conflated two operations. When they saw "3" and "5" together with a subtraction sign, they multiplied instead of subtracted. This may be a procedural error where the student switches between operations mid-problem, or a careless error where they simply miscalculated.

**Error 2 (implicit):**
- **Error:** The student correctly collected the x terms, suggesting they DO understand the core concept of collecting like terms — the algebraic component is fine.
- **Classification:** Not an error — correct application of the concept.
- **Significance:** This matters because it narrows the diagnosis. The student's problem is not with collecting like terms as a concept. It's specifically with the arithmetic on constants, which points toward procedural or careless rather than conceptual.

### Diagnostic Questions

Ask the student these questions to confirm the classification:

1. **"Can you talk me through how you got from 3 - 5 to -15?"**
   - If the student says "Oh! I multiplied instead of subtracting" → **careless error** (they know the procedure, made a slip, and can self-correct when prompted)
   - If the student says "You multiply the numbers when you collect them" → **procedural error** (systematic misunderstanding of the operation required)
   - If the student is confused and can't explain → further investigation needed

2. **"What is 3 - 5 if you just think of it as a number calculation, without the algebra?"**
   - If the student says "-2" → **careless error** (they can do the arithmetic, they just didn't apply it correctly in context)
   - If the student hesitates or gets it wrong → possible **arithmetic gap** (the problem may be with negative numbers, not with algebra at all)

3. **"Try this one for me: simplify 5x + 7 + 3x - 2. Talk me through each step."**
   - Observe whether they make the same error. If they correctly get 5 for 7 - 2 → careless one-off. If they multiply again → systematic procedural error.

### Targeted Response Plan

**If careless error (confirmed by diagnostic questions):**
- Do NOT re-teach collecting like terms — the student already knows how.
- **Action:** Build a metacognitive checking routine. After every simplification, the student should:
  1. Circle all the constant terms in the original expression
  2. Write them as a separate arithmetic calculation (3 - 5 = ?)
  3. Solve the arithmetic FIRST, then combine with the algebraic result
  4. Check: does my final answer have the right number of terms?
- Give 3 similar practice problems and ask the student to use this checking routine on each one.

**If procedural error (student says "you multiply when collecting"):**
- **Action:** Provide a direct comparison between collecting like terms and multiplying.
  - "Collecting like terms means ADDING or SUBTRACTING the numbers in front. 4x + 2x means you have 4 lots of x plus 2 lots of x = 6 lots of x. In the same way, +3 and -5 means you have positive 3 plus negative 5 = -2. You're adding/subtracting, never multiplying."
  - Give a physical analogy: "If you have 3 apples and someone takes away 5 apples, you don't have -15 apples. You have -2 apples (you owe 2)."
  - Follow with 5 practice problems involving only constant collection (no x terms) to isolate and reinforce the correct operation.

**If arithmetic gap (student can't calculate 3 - 5):**
- **Action:** The problem is with negative number arithmetic, not with algebra. Go back to integer operations.
  - Use a number line: start at 3, move 5 to the left. Where do you land? (-2)
  - Practise 10 integer subtraction problems before returning to algebra.
  - Then return to the original problem and see if the algebra now works.

### Student Self-Analysis Guide

Give the student this scaffold:

---

**FINDING MY MISTAKES**

Look at your answer: 6x - 15

**Step 1: Find the error**
The correct answer is 6x - 2. Your x terms (6x) are correct. Your number terms (-15) are not.
Look at your working for the number terms: 3 - 5 = -15.

**Step 2: Understand the error**
What calculation did you actually do? (Circle one)
- I subtracted: 3 - 5 = ?
- I multiplied: 3 × 5 = 15, then added the negative sign
- I'm not sure what I did

**Step 3: Fix the error**
Calculate 3 - 5 using a number line or by thinking: "I start with 3 and take away 5."
3 - 5 = ___

**Step 4: Correct your answer**
Replace the -15 with your new answer: 6x + ___

**Step 5: Prevent it next time**
What will you do differently on the next problem to avoid this mistake?
Write one specific thing: _______________________________________________

---

### Prevention Strategy

**In future teaching of collecting like terms:**
- When modelling, explicitly separate the algebraic collection and the arithmetic into two distinct steps. Don't combine them in one line of working. Show:
  - Step 1: Collect x terms: 4x + 2x = 6x
  - Step 2: Collect number terms: 3 - 5 = -2
  - Step 3: Combine: 6x - 2
- Include practice problems where the number calculation involves negative results (this is where the errors cluster) — don't just use problems where constants sum to positive numbers.
- After instruction, use a diagnostic exit ticket: "Simplify 2x + 8 - 3x - 3." This tests both negative x coefficients AND negative constant results. If students get 2x + 8 - 3x - 3 = -x + 5, they're secure. Common errors: 5x + 5 (adding all coefficients), -x + 24 (multiplying constants), 1x + 11 (various confusion).

---

## Known Limitations

1. **Error classification requires seeing the student's working, not just the final answer.** An answer of "5/7" for 3/4 + 2/3 could be a conceptual error (wrong mental model of fractions), a procedural error (wrong algorithm applied), or even a careless transcription. Without working or a diagnostic conversation, classification is hypothetical. The diagnostic questions section is essential — it must be used, not skipped.

2. **This skill analyses individual student errors; it does not address whole-class error patterns.** If 80% of the class makes the same error, the problem is likely with the instruction, not the students. For whole-class error patterns, the response should be re-teaching to the whole class, not individual error analysis. Chain with Gap Analysis from Student Work for class-level analysis.

3. **Error analysis takes time, and time is the scarcest resource in teaching.** Detailed analysis of every student's errors is impractical for a class of 30. Use this skill selectively — for errors that are persistent, surprising, or shared by multiple students. For quick identification of common errors across a class set, a whole-class diagnostic approach (exit tickets, hinge questions) is more efficient than individual error analysis.
`,s=`---
# AGENT SKILLS STANDARD FIELDS (v2)
name: ai-feedback-design-principles
description: "Audit and redesign AI-generated feedback for pedagogical quality, timing, and learning impact. Use when building or reviewing automated feedback in digital learning tools."
disable-model-invocation: false
user-invocable: true
effort: medium

# EXISTING FIELDS

skill_id: "ai-learning-science/ai-feedback-design-principles"
skill_name: "AI Feedback Design Principles"
domain: "ai-learning-science"
version: "1.0"
evidence_strength: "strong"
evidence_sources:
  - "Shute (2008) — Focus on formative feedback (comprehensive review)"
  - "Narciss (2008) — Feedback strategies for interactive learning tasks (informative tutoring feedback model)"
  - "Hattie & Timperley (2007) — The power of feedback (meta-analysis, effect size 0.73)"
  - "Dai et al. (2023) — Can large language models provide useful feedback on research papers? A large-scale empirical analysis"
  - "Kluger & DeNisi (1996) — The effects of feedback interventions on performance: A historical review and a meta-analysis"
input_schema:
  required:
    - field: "feedback_scenario"
      type: "string"
      description: "The specific context in which AI will deliver feedback — what the student has done and what kind of feedback is needed"
    - field: "current_feedback_design"
      type: "string"
      description: "The current or proposed AI feedback approach — what the system currently says or plans to say in response to student work"
  optional:
    - field: "student_level"
      type: "string"
      description: "Age/year group and proficiency level"
    - field: "subject_area"
      type: "string"
      description: "The curriculum subject"
    - field: "feedback_goals"
      type: "string"
      description: "What the feedback should achieve — error correction, motivation, deeper thinking, self-regulation, or something else"
    - field: "system_constraints"
      type: "string"
      description: "Technical or practical constraints on the feedback — character limits, timing requirements, or format restrictions"
output_schema:
  type: "object"
  fields:
    - field: "feedback_evaluation"
      type: "object"
      description: "Analysis of the current feedback design against research criteria — what works and what doesn't"
    - field: "improved_feedback"
      type: "object"
      description: "A redesigned version of the feedback that addresses identified weaknesses"
    - field: "feedback_type_analysis"
      type: "object"
      description: "Classification of the feedback by type (verification, elaboration, strategic) with recommendations for the optimal mix"
    - field: "implementation_guidance"
      type: "object"
      description: "Practical advice for deploying the improved feedback in the target system"
chains_well_with:
  - "adaptive-hint-sequence-designer"
  - "formative-assessment-loop-designer"
  - "intelligent-tutoring-dialogue-designer"
  - "self-explanation-prompt-designer"
  - "technological-pedagogical-content-knowledge-developer"
teacher_time: "4 minutes"
tags: ["feedback", "AI-feedback", "formative", "Shute", "Narciss", "Hattie", "LLM", "automated-feedback"]
---

# AI Feedback Design Principles

## What This Skill Does

Evaluates a proposed AI feedback design against research criteria for effective automated feedback and suggests specific improvements. This skill takes a feedback scenario (what the student did) and the current or proposed AI response (what the system says), then analyses the feedback against principles from Shute (2008), Narciss (2008), Hattie & Timperley (2007), and emerging LLM feedback research (Dai et al., 2023). The output includes a diagnosis of what's working and what isn't, a redesigned version of the feedback, and practical implementation guidance. The core challenge is that most AI feedback falls into one of two failure modes: it's either too vague to be actionable ("Good effort! Try to improve your argument.") or too specific and does the thinking for the student ("Your thesis should be: Climate change is the defining challenge of our generation because…"). Effective feedback lives in the narrow space between these extremes — specific enough that the student knows what to do, but not so specific that it bypasses the cognitive work that produces learning. AI is specifically valuable here because it can generate feedback at scale, but this makes the design principles even more critical: bad feedback at scale is worse than no feedback at all.

## Evidence Foundation

Hattie & Timperley (2007) conducted a meta-analysis finding that feedback has an average effect size of 0.73 — making it one of the most powerful influences on learning. However, they found enormous variation: some feedback interventions produced large positive effects while others had zero or even NEGATIVE effects. The critical variable was not whether feedback was given, but WHAT KIND of feedback was given. They proposed a model with four levels: task feedback (is the answer correct?), process feedback (what strategies can improve the work?), self-regulation feedback (how can you monitor your own learning?), and self feedback (you're a great student!). Task and process feedback were most effective; self feedback ("Good job!") was least effective and sometimes harmful because it directs attention to the self rather than the task. Shute (2008) reviewed formative feedback research and identified key principles: effective feedback is specific, timely, non-threatening, and focused on the task rather than the learner. She distinguished between verification feedback (correct/incorrect), elaborated feedback (why it's correct/incorrect and what to do next), and various combinations. She found that elaborated feedback generally outperforms simple verification, BUT that overly detailed feedback can overwhelm novice learners — creating a feedback paradox where more information sometimes produces less learning. Narciss (2008) developed the Informative Tutoring Feedback (ITF) model, which specifies that effective feedback should include: knowledge of result (correct or not), knowledge of the correct response (if wrong), and elaboration on the error (why it's wrong and what misconception it reveals). Critically, Narciss found that the optimal feedback depends on the error type: conceptual errors benefit from elaborated feedback, while careless slips benefit from simple verification. Kluger & DeNisi (1996) found in their meta-analysis that feedback that directs attention to the self (rather than the task) can DECREASE performance — a finding with direct implications for AI systems that generate encouraging but empty praise. Dai et al. (2023) evaluated LLM-generated feedback and found that while LLMs can produce fluent, well-structured feedback, they tend toward a specific pattern: excessive positivity, vague suggestions, and a reluctance to identify specific errors — precisely the pattern that research identifies as least effective.

## Input Schema

The teacher must provide:
- **Feedback scenario:** What the student did. *e.g. "Year 9 student submitted a persuasive essay arguing that school uniforms should be abolished. The argument is passionate but relies entirely on personal anecdotes — no evidence, no counterargument addressed, weak logical structure" / "Year 7 student solved 3x + 5 = 20 and got x = 7 (incorrect — should be x = 5)" / "A-level student wrote a lab report with correct data but a conclusion that doesn't follow from the results"*
- **Current feedback design:** What the AI currently says or plans to say. *e.g. "Great essay! You clearly feel strongly about this topic. To improve, try adding some evidence and considering the other side of the argument" / "Incorrect. The answer is x = 5. Try again" / "Your conclusion needs work. Think about what your data actually shows"*

Optional (injected by context engine if available):
- **Student level:** Year group and proficiency
- **Subject area:** The curriculum subject
- **Feedback goals:** What the feedback should achieve
- **System constraints:** Technical or practical limitations

## Prompt

\`\`\`
You are an expert in the science of feedback in learning, with deep knowledge of Hattie & Timperley's (2007) feedback model (task, process, self-regulation, self levels), Shute's (2008) formative feedback principles, Narciss's (2008) Informative Tutoring Feedback model, Kluger & DeNisi's (1996) meta-analysis on feedback interventions, and emerging research on LLM-generated feedback quality (Dai et al., 2023). You understand that feedback is one of the most powerful influences on learning — and one of the most dangerous when poorly designed. You know that AI systems tend toward a specific failure mode: generating feedback that is positive, fluent, well-structured, and educationally useless.

CRITICAL PRINCIPLES:
- **Feedback must be SPECIFIC and ACTIONABLE.** "Good effort" is not feedback. "Your introduction states a position but doesn't preview your three supporting arguments — add a sentence that maps out your essay structure" IS feedback. If a student cannot read the feedback and know EXACTLY what to do next, it has failed.
- **Distinguish verification, elaboration, and strategic feedback.** Verification: "This is incorrect." Elaboration: "This is incorrect because you subtracted 5 from the left side but not the right." Strategic: "When you get stuck on equations, always check: did I do the same operation to both sides?" Different errors need different types. A conceptual error needs elaboration. A careless slip needs verification. A recurring pattern needs strategic feedback.
- **Avoid the positivity trap.** AI systems default to excessive positivity. "Great work!" before pointing out fundamental errors sends a contradictory signal and dilutes the corrective message. Positive feedback is appropriate ONLY when genuinely earned AND directed at specific features ("Your use of statistical evidence in paragraph 2 is effective because it directly supports your claim"). Generic praise is worse than no praise at all (Kluger & DeNisi, 1996).
- **Don't do the student's thinking.** Feedback that tells the student exactly what to write, what the answer is, or how to fix their work is not feedback — it's answer-giving. The goal is to close the gap between current and desired performance by showing the student WHERE the gap is and giving them enough information to close it themselves.
- **Match feedback complexity to student level.** Novice learners benefit from simple, clear feedback focused on one or two specific issues. Advanced learners benefit from more complex feedback that addresses multiple dimensions. Overloading novices with comprehensive feedback produces cognitive overload, not learning (Shute, 2008).

Your task is to evaluate and improve this feedback design:

**Feedback scenario:** {{feedback_scenario}}
**Current feedback design:** {{current_feedback_design}}

The following optional context may or may not be provided. Use whatever is available; ignore any fields marked "not provided."

**Student level:** {{student_level}} — if not provided, infer from the scenario.
**Subject area:** {{subject_area}} — if not provided, infer from the scenario.
**Feedback goals:** {{feedback_goals}} — if not provided, assume the goal is to help the student improve their work while preserving their ownership of the thinking.
**System constraints:** {{system_constraints}} — if not provided, assume no significant constraints.

Return your output in this exact format:

## Feedback Evaluation: [Brief Scenario Description]

**Scenario:** [What the student did]
**Current feedback:** [What the AI currently says]
**Verdict:** [One-sentence summary — is this feedback likely to improve learning, have no effect, or actively harm it?]

### Diagnosis

[Analyse the current feedback against each principle. What works? What doesn't? Be specific — quote the problematic parts of the feedback and explain WHY they are problematic, citing the relevant research.]

### Feedback Type Analysis

| Feedback Component | Type | Effectiveness | Issue |
|---|---|---|---|
| [Quote from current feedback] | [Verification / Elaboration / Strategic / Self] | [Effective / Ineffective / Harmful] | [Why] |

### Improved Feedback Design

[The redesigned feedback. Show the exact text the AI should present to the student. Include specific, actionable guidance that addresses the identified weaknesses without doing the student's thinking for them.]

**Redesigned feedback:**

> [The exact feedback text]

### Design Rationale

[Explain why the improved version is better — what principles it follows and what specific changes were made.]

### Implementation Notes

[Practical guidance for deploying this feedback pattern — when it should trigger, how to handle edge cases, and what to watch for.]

**Self-check before returning output:** Verify that (a) the improved feedback is specific and actionable, (b) it doesn't do the student's thinking, (c) it avoids empty praise, (d) it uses the right type of feedback for the error type, and (e) it's appropriate for the student's level.
\`\`\`

## Example Output

**Scenario:** *Feedback scenario: "Year 9 student submitted a persuasive essay arguing that school uniforms should be abolished. The argument is passionate but relies entirely on personal anecdotes — no evidence, no counterargument addressed, weak logical structure. The essay is about 400 words, has an introduction, three body paragraphs, and a conclusion." / Current feedback design: "Great essay! You clearly feel strongly about this topic and your writing voice is engaging. To improve, try adding some evidence to support your points and consider addressing the opposing viewpoint. Your conclusion could be stronger — try restating your main argument. Overall, a solid effort — keep it up! 7/10" / Student level: "Year 9, target grade 6 (UK GCSE equivalent)" / Subject area: "English Language — persuasive writing"*

---

## Feedback Evaluation: Year 9 Persuasive Essay — School Uniforms

**Scenario:** Year 9 student wrote a persuasive essay relying on personal anecdotes with no evidence, no counterargument, and weak structure.
**Current feedback:** "Great essay! You clearly feel strongly… try adding some evidence… consider addressing the opposing viewpoint… a solid effort — keep it up! 7/10"
**Verdict:** This feedback is unlikely to produce improvement. It is vague, excessively positive, and tells the student they're doing well when their essay has fundamental structural problems.

### Diagnosis

**Problem 1: The positivity trap.** The feedback opens with "Great essay!" — but the essay has fundamental weaknesses (no evidence, no counterargument, weak structure). This sends a contradictory signal: you're telling the student the essay is great while simultaneously listing everything that's wrong with it. Kluger & DeNisi (1996) found that feedback directing attention to the self ("you clearly feel strongly") rather than the task reduces learning. The student's takeaway: "I got 7/10 and the teacher liked my voice. I just need to tweak a few things."

**Problem 2: Vague improvement suggestions.** "Try adding some evidence" — what kind of evidence? Where in the essay? How much? "Consider addressing the opposing viewpoint" — which opposing viewpoint? Where in the essay should it go? How should it be structured? Shute (2008) found that feedback must be specific enough that the student knows exactly what to do. These suggestions are too vague to be actionable.

**Problem 3: No diagnosis of the actual problem.** The essay's fundamental issue is that the student doesn't understand the difference between assertion and argument. Every paragraph makes claims supported only by personal experience. The feedback doesn't name this problem — it treats the symptoms (no evidence, no counterargument) without identifying the underlying cause (the student equates strong feeling with strong argument).

**Problem 4: The score undermines the feedback.** 7/10 signals "this is good." If the essay has no evidence and no counterargument, it has not met the basic criteria for persuasive writing. The score and the feedback are in conflict. The student will anchor on the score and dismiss the suggestions.

### Feedback Type Analysis

| Feedback Component | Type | Effectiveness | Issue |
|---|---|---|---|
| "Great essay!" | Self | Harmful | Empty praise directing attention to self not task |
| "You clearly feel strongly" | Self | Ineffective | Describes the student, not the work |
| "Your writing voice is engaging" | Task | Mildly effective | Specific enough to be useful, but buried in generic praise |
| "Try adding some evidence" | Strategic | Ineffective | Too vague — what evidence, where, how? |
| "Consider addressing the opposing viewpoint" | Strategic | Ineffective | Too vague — which viewpoint, where in the essay? |
| "Your conclusion could be stronger" | Task | Ineffective | "Stronger" is meaningless without specifics |
| "A solid effort — keep it up!" | Self | Harmful | False reassurance when major revisions needed |
| "7/10" | Verification | Harmful | Score contradicts the need for fundamental revision |

### Improved Feedback Design

**Redesigned feedback:**

> **What's working:** Your writing voice is confident and direct — "I shouldn't have to wear someone else's idea of who I am every single day" is a strong, memorable line. Hold onto that voice.
>
> **The main issue — assertion vs. argument:** Right now, every paragraph makes a claim and supports it with your personal experience. That's assertion, not argument. Persuasive writing needs EVIDENCE — facts, statistics, expert opinions, or real examples that someone who disagrees with you would have to take seriously. Your reader is thinking: "That's how YOU feel, but why should I care?"
>
> **One specific fix to try first:** Pick your strongest paragraph (I'd suggest paragraph 2 about comfort). Find ONE piece of evidence that supports your point — a study about student concentration, a school that removed uniforms and measured the effect, or a quote from an education expert. Add it. Then look at what it does to the paragraph. That's the difference between assertion and argument.
>
> **Next step after that:** Choose the strongest argument AGAINST your position (probably cost — uniforms save families money). Write a paragraph that acknowledges this argument and then explains why your position is still stronger. This is called a counterargument, and it's the single most persuasive move in argumentative writing — it shows you've considered the other side and still have a stronger case.
>
> **Don't revise yet.** First, reread your essay and put a star next to every sentence that is supported by evidence (not personal experience). Count the stars. That count tells you how much work is needed.

### Design Rationale

The redesigned feedback makes five key changes:

1. **Specific positive feedback first, directed at the task.** "Your writing voice is confident and direct" with a quoted example — this is task-level feedback on a genuine strength, not generic self-level praise. It tells the student exactly what to keep doing.

2. **Names the underlying problem.** "Assertion vs. argument" gives the student a conceptual framework for understanding what's wrong. This is elaborated feedback (Narciss, 2008) — it doesn't just say "add evidence" but explains WHY evidence is needed and what the essay currently lacks.

3. **One specific, manageable action.** Instead of a list of vague improvements, the feedback gives ONE concrete task: find one piece of evidence for one paragraph. This follows Shute's (2008) principle of matching feedback complexity to learner level — a Year 9 student targeting grade 6 needs focused, achievable steps, not a comprehensive critique.

4. **The counterargument instruction is scaffolded.** It doesn't just say "address the opposing viewpoint" — it tells the student which opposing argument to choose and explains the strategic reason for including it. This is process-level feedback (Hattie & Timperley, 2007).

5. **The diagnostic task replaces the score.** "Count the stars" is a self-regulation prompt that helps the student see the problem for themselves, rather than being told. This develops metacognitive awareness — a higher-order feedback function that builds independence.

### Implementation Notes

- **Do not open with a score.** If a score is required by the system, place it at the end, after the actionable feedback. Better yet, withhold the score until after revision.
- **Limit feedback to 2-3 actionable points.** This example addresses two issues (evidence, counterargument) plus one metacognitive prompt. That's the maximum for a Year 9 student. More points produce cognitive overload and paralysis.
- **Watch for the LLM positivity pattern.** If the AI is generating feedback, audit it for the "Great job! But…" pattern (Dai et al., 2023). Instruct the model to lead with specific, earned praise or to lead with the diagnostic — not with generic enthusiasm.
- **Re-evaluate after revision.** The feedback above is designed to produce a specific revision (adding evidence to one paragraph, adding a counterargument paragraph). After revision, the feedback should address different issues — probably structure and logical flow. Don't repeat the same feedback if the student has acted on it.

---

## Known Limitations

1. **This skill evaluates feedback DESIGN, not feedback DELIVERY.** The same feedback text can be effective or harmful depending on timing, student emotional state, and the relationship between student and system. A student who has just failed three assignments in a row needs a different emotional register than a confident student who made a careless error. This skill addresses content and structure, not affect and timing.

2. **The LLM feedback evidence base is still emerging.** Dai et al. (2023) is one of the first large-scale studies of LLM feedback quality, and the field is developing rapidly. The principles from Shute (2008), Narciss (2008), and Hattie & Timperley (2007) are well-established for human feedback — their application to AI-generated feedback is theoretically sound but not yet comprehensively validated.

3. **Cultural context affects feedback norms.** The direct, task-focused feedback style recommended here reflects Western educational research norms. In some cultural contexts, direct criticism (even when constructive) may be received differently. Narciss's (2008) model was developed primarily in European and North American contexts.

4. **Feedback interacts with student self-efficacy in complex ways.** Kluger & DeNisi (1996) found that feedback can decrease performance when it threatens self-concept. For students with very low self-efficacy, the "no empty praise" principle needs to be balanced against the risk of further damaging motivation. This skill does not model the individual student's motivational state.
`,r=`---
# AGENT SKILLS STANDARD FIELDS (v2)
name: feedback-quality-analyser
description: "Analyse existing written feedback for quality, specificity, actionability, and impact on student learning. Use when reviewing teacher or peer feedback to improve feedback practices."
disable-model-invocation: false
user-invocable: true
effort: medium

# EXISTING FIELDS

skill_id: "memory-learning-science/feedback-quality-analyser"
skill_name: "Feedback Quality Analyser & Rewriter"
domain: "memory-learning-science"
version: "1.0"
evidence_strength: "strong"
evidence_sources:
  - "Hattie & Timperley (2007) — The power of feedback: a meta-analysis (effect size ~0.73)"
  - "Shute (2008) — Focus on formative feedback: a review of the research"
  - "Kluger & DeNisi (1996) — Effects of feedback intervention on performance: a historical review and meta-analysis"
  - "Black & Wiliam (1998) — Assessment and classroom learning: formative assessment principles"
  - "Wisniewski et al. (2020) — The power of feedback revisited: a meta-analysis of educational feedback research"
input_schema:
  required:
    - field: "feedback_text"
      type: "string"
      description: "The existing feedback to analyse (teacher-written or peer-written)"
    - field: "task_context"
      type: "string"
      description: "What the student was asked to do and the learning objective"
  optional:
    - field: "student_work_summary"
      type: "string"
      description: "Brief summary of the student work the feedback refers to"
    - field: "student_level"
      type: "string"
      description: "Age/year group and ability profile"
    - field: "student_profiles"
      type: "array"
      description: "From context engine: self-regulation level, language proficiency, sensitivity factors"
    - field: "rubric"
      type: "string"
      description: "From context engine: the rubric or success criteria used for this task"
output_schema:
  type: "object"
  fields:
    - field: "analysis"
      type: "object"
      description: "Diagnosis of feedback level, specificity, and actionability using Hattie & Timperley's model"
    - field: "rewritten_feedback"
      type: "string"
      description: "Improved version addressing identified weaknesses"
    - field: "improvement_rationale"
      type: "string"
      description: "What was changed and why, referencing evidence"
chains_well_with:
  - "gap-analysis-from-student-work"
  - "criterion-referenced-rubric-generator"
  - "self-regulation-scaffold-generator"
  - "metacognitive-prompt-library"
  - "kud-knowledge-type-mapper"
teacher_time: "3 minutes"
tags: ["feedback", "formative-assessment", "metacognition", "writing", "assessment"]
---

# Feedback Quality Analyser & Rewriter

## What This Skill Does

Takes a piece of teacher or peer feedback, analyses it against Hattie & Timperley's (2007) four-level feedback model, and rewrites it to improve its level, specificity, and actionability. The analysis identifies whether the feedback operates at the task, process, self-regulation, or self level, and evaluates whether it tells the student where they are, where they're going, and how to get there. AI is specifically valuable here because most teacher feedback — even from experienced teachers — defaults to either vague praise ("Good effort!"), vague criticism ("Needs more detail"), or self-level feedback ("You're a great writer") that research shows has zero or negative effect on learning. Rewriting feedback to target process and self-regulation requires explicit knowledge of the feedback research that most teachers have never encountered.

## Evidence Foundation

Hattie & Timperley (2007) conducted a comprehensive meta-analysis finding that feedback has an average effect size of 0.73 — one of the highest in education research — but with enormous variability. Effective feedback answers three questions: Where am I going? (feed up), How am I going? (feed back), Where to next? (feed forward). They identified four feedback levels: task (correctness), process (strategies used), self-regulation (student's monitoring and control), and self (personal praise or criticism). Task-level feedback improves immediate performance; process-level feedback improves strategy use; self-regulation feedback builds independence. Self-level feedback ("You're so clever" / "Disappointing work") has no positive effect and can undermine learning by directing attention to ego rather than task. Kluger & DeNisi (1996) found that one-third of feedback interventions actually decreased performance — typically when feedback threatened self-esteem or directed attention away from the task. Wisniewski et al. (2020) updated the meta-analysis and confirmed that feedback containing information (specific, task-referenced) is significantly more effective than feedback containing only judgments (grades, praise, criticism). Shute (2008) identified that effective formative feedback is specific, timely, non-threatening, and focused on the gap between current and desired performance.

## Input Schema

The teacher must provide:
- **Feedback text:** The existing feedback to analyse. *e.g. "Good work! You clearly tried hard on this. Next time, add more detail to your analysis." / "7/10. Some good points but your conclusion is weak."*
- **Task context:** What the student was doing and what the learning objective was. *e.g. "Year 10 History essay on causes of WWI. Learning objective: construct a causal argument using evidence."*

Optional (injected by context engine if available):
- **Student work summary:** Brief description of the actual student work
- **Student level:** Year group and ability profile
- **Student profiles:** Self-regulation level, language proficiency, emotional factors
- **Rubric:** The success criteria or rubric used for this task

## Prompt

\`\`\`
You are an expert in educational feedback research, specialising in Hattie & Timperley's (2007) feedback model and Shute's (2008) formative feedback principles. You have deep knowledge of the distinction between feedback levels (task, process, self-regulation, self) and understand why feedback specificity and actionability determine its impact on learning.

Your task is to analyse and rewrite the following feedback:

**Feedback text:** "{{feedback_text}}"
**Task context:** {{task_context}}

The following optional context may or may not be provided. Use whatever is available; ignore any fields marked "not provided."

**Student work summary:** {{student_work_summary}} — if provided, use the details of the actual work to make the rewritten feedback more specific. If not provided, base your analysis and rewrite on what can be inferred from the feedback text and task context.
**Student level:** {{student_level}} — if provided, calibrate language and expectations accordingly. If not provided, infer from the task context.
**Rubric/Success criteria:** {{rubric}} — if provided, reference specific criteria in the rewritten feedback. If not provided, reference the learning objective from the task context.
**Student profiles:** {{student_profiles}} — if provided, consider self-regulation level when pitching feedback (high self-regulation: more self-monitoring prompts; low self-regulation: more specific task and process guidance). If not provided, pitch feedback at a general level.

Analyse the feedback using these evidence-based criteria:

1. **Feedback level diagnosis (Hattie & Timperley, 2007):**
   - **Task level:** Does it tell the student what is correct or incorrect about their specific work? (Useful but limited — doesn't help them improve next time.)
   - **Process level:** Does it address the strategies, skills, or processes the student used? (More powerful — transfers to future tasks.)
   - **Self-regulation level:** Does it prompt the student to monitor, evaluate, or adjust their own learning? (Most powerful for building independence.)
   - **Self level:** Does it comment on the student as a person rather than on the work? (No learning benefit. Remove or redirect.)

2. **The three feedback questions (Hattie & Timperley, 2007):**
   - **Feed up (Where am I going?):** Does the feedback reference the learning goal or success criteria?
   - **Feed back (How am I going?):** Does the feedback tell the student specifically what they did well or poorly *in relation to the goal*?
   - **Feed forward (Where to next?):** Does the feedback give a specific, actionable next step the student can take?

3. **Specificity check (Shute, 2008):** Is the feedback specific enough that the student knows exactly what to do differently? "Add more detail" is not specific. "In paragraph 3, you claim that militarism caused WWI but don't provide any evidence. Add a specific example of military build-up between 1900–1914 to support this claim" is specific.

4. **Threat check (Kluger & DeNisi, 1996):** Could this feedback be perceived as threatening to self-esteem, particularly for a struggling learner? If so, reframe to focus on the work, not the person.

5. **Actionability check:** Can the student act on this feedback independently? If the feedback requires knowledge or skills the student doesn't have, it's not actionable — it needs to be accompanied by instruction or a resource.

Return your output in this exact format:

## Feedback Analysis

### Original Feedback
[Reproduce the original feedback]

### Level Analysis
| Feedback Level | Present? | Examples from the text |
|---------------|----------|----------------------|
| Task | Yes/No | [Quote specific phrases] |
| Process | Yes/No | [Quote specific phrases] |
| Self-regulation | Yes/No | [Quote specific phrases] |
| Self | Yes/No | [Quote specific phrases] |

**Dominant level:** [Which level dominates and whether that's appropriate]

### Three Questions Check
- **Feed up (Where am I going?):** [Does the feedback reference the goal? Yes/No + detail]
- **Feed back (How am I going?):** [Does it say what was done well/poorly? Yes/No + detail]
- **Feed forward (Where to next?):** [Does it give a specific next step? Yes/No + detail]

### Specificity Rating
[Low / Medium / High] — [Explanation]

### Key Problems
[Numbered list of specific issues with the feedback]

### Rewritten Feedback
[The improved version — same approximate length, dramatically improved quality]

### What Changed and Why
[Bullet list explaining each change with reference to the research]

**Self-check before returning output:** Verify that (a) the rewritten feedback addresses all three feedback questions (feed up, feed back, feed forward), (b) it operates at process or self-regulation level, not just task level, (c) it is specific enough that the student knows exactly what to do, (d) it does not contain self-level comments disguised as encouragement, and (e) it is written in language the student can understand at their level.
\`\`\`

## Example Output

**Scenario:** *Feedback text: "Good effort, Priya! Some really nice points in here. You need to work on your analysis — try to go deeper next time. Your writing style is lovely. 6/10." / Task context: "Year 10 English Literature essay analysing how Shakespeare presents Lady Macbeth's ambition in Act 1. Learning objective: analyse language and structure to explore how a character is presented."*

---

## Feedback Analysis

### Original Feedback
"Good effort, Priya! Some really nice points in here. You need to work on your analysis — try to go deeper next time. Your writing style is lovely. 6/10."

### Level Analysis
| Feedback Level | Present? | Examples from the text |
|---------------|----------|----------------------|
| Task | Partial | "6/10" provides a score but no information about what was correct or incorrect |
| Process | No | No reference to the strategies, methods, or analytical processes Priya used |
| Self-regulation | No | No prompts for Priya to monitor or evaluate her own work |
| Self | Yes | "Good effort, Priya!" / "Your writing style is lovely" — both address Priya as a person, not her work |

**Dominant level:** Self-level feedback dominates. The two substantive comments ("Good effort" and "Your writing style is lovely") are about Priya, not about her analysis of Lady Macbeth. The only task-level element is the score (6/10), which tells Priya her work is "medium" but not why or how to improve. Self-level feedback has no positive effect on learning (Hattie & Timperley, 2007) and the score without explanation is a judgment, not information (Wisniewski et al., 2020).

### Three Questions Check
- **Feed up (Where am I going?):** No. The feedback does not reference the learning objective (analysing how Shakespeare presents Lady Macbeth's ambition through language and structure). Priya doesn't know what she was aiming for.
- **Feed back (How am I going?):** Barely. "Some really nice points" is vague — which points? What made them nice? "You need to work on your analysis" identifies a gap but not specifically.
- **Feed forward (Where to next?):** No. "Try to go deeper next time" is not actionable. Priya has no way of knowing what "deeper" means, what "deeper analysis" looks like, or how to do it.

### Specificity Rating
**Low** — The feedback contains no specific references to Priya's actual work. The same comment ("good effort, work on your analysis, go deeper") could be written on any student's essay on any topic. This is a strong indicator of low-quality feedback (Shute, 2008).

### Key Problems

1. **"Good effort" is self-level feedback.** It addresses Priya's effort (a personal quality), not her work. It provides no information about what was good or why. Kluger & DeNisi (1996) found that self-directed feedback shifts attention from the task to the ego.

2. **"Some really nice points" is unspecified task-level feedback.** Which points? What made them effective? Without specificity, Priya can't replicate what she did well.

3. **"You need to work on your analysis — try to go deeper" is vague feed-forward.** This is the most common feedback failure in secondary education. "Go deeper" means nothing to a Year 10 student who doesn't know what deep analysis looks like. It requires Priya to already have the skill the feedback is telling her to develop.

4. **"Your writing style is lovely" is self-level feedback with a gender dimension.** It compliments Priya as a writer rather than identifying specific effective writing choices. Research on gendered feedback patterns shows that girls more frequently receive praise for style/presentation while boys receive more substantive content feedback.

5. **"6/10" is a judgment, not feedback.** Butler (1988) found that when comments are accompanied by grades, students attend to the grade and ignore the comments entirely. The score undermines any formative value the comments might have had.

### Rewritten Feedback

Priya, this essay shows you can identify relevant quotations — you chose strong evidence from Act 1, Scene 5, particularly Lady Macbeth's "unsex me here" speech.

Your quotation choices are effective, but your analysis stays at the surface. For example, you write: "This shows Lady Macbeth is ambitious." That's the *what* — but the learning objective asks you to analyse *how* Shakespeare presents her ambition through language. Look at your "unsex me here" quotation again. Ask yourself: why does Shakespeare use the word "unsex"? What does it tell us about how ambition and gender are connected in this speech? What is the effect on the audience of hearing a woman ask to be stripped of femininity in order to be powerful? That's the depth of analysis this essay needs.

**Specific next step:** Choose your two strongest quotations from this essay. For each one, write three sentences: (1) what the quotation shows about Lady Macbeth, (2) why Shakespeare chose that specific word or image, and (3) what effect it creates for the audience. Bring these to our next lesson so we can look at them together.

### What Changed and Why

- **Removed "Good effort" and "lovely writing style"** — self-level feedback that shifts attention to Priya as a person rather than her work. Replaced with specific task-level praise that identifies what she did well: choosing relevant quotations from Act 1, Scene 5 (Hattie & Timperley, 2007 — task-level feedback about what was correct).

- **Replaced "go deeper" with a specific model of what "deeper" means** — the rewrite shows Priya exactly what analytical depth looks like by walking through one of her own quotations and demonstrating the questions she should ask (why this word? what effect?). This is process-level feedback: it addresses the *strategy* of analysis, not just the outcome (Hattie & Timperley, 2007).

- **Added a specific, actionable next step** — "Choose two quotations, write three sentences each using this structure" gives Priya something concrete to do. She can act on this independently. This is genuine feed-forward (Shute, 2008).

- **Removed the grade** — Butler (1988) demonstrated that comment-only feedback produces more learning than comment-plus-grade, because the grade draws attention away from the formative information. If a grade must be recorded, provide it separately or later.

- **Referenced the learning objective** — the rewrite explicitly connects the feedback to the task goal ("the learning objective asks you to analyse *how*"), giving Priya a clear reference point for improvement (feed up).

---

## Known Limitations

1. **The rewrite requires knowing the actual student work.** Without seeing Priya's essay, the rewritten feedback uses the quotation mentioned in the original and makes reasonable inferences about what she wrote. If the student work summary is provided, the rewrite will be more precise. Teachers should treat the rewrite as a model to adapt, not a final product.

2. **Feedback effectiveness depends on the relationship between teacher and student.** Wisniewski et al. (2020) found that the same feedback phrasing can be received differently depending on trust and the classroom culture around feedback. The rewrite assumes a supportive classroom environment. In a context where a student has feedback anxiety, the opening may need further softening — though the research is clear that reducing specificity to protect feelings reduces learning.

3. **This skill analyses individual feedback quality but cannot address systemic feedback problems.** If a teacher's marking load means they have 3 minutes per essay for 30 students, even excellent feedback knowledge won't help. Systemic solutions (reducing marking volume, using whole-class feedback, selective detailed marking) are outside this skill's scope but are often the real bottleneck.
`,o=[a,i,s,n,r].map(e=>t(e)).filter(Boolean);function l(){return o}export{l as getAll};
