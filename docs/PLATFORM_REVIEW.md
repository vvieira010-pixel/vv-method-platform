# MET Platform — Educational Product Audit

## Audit context

This audit reviews the current React/Vite platform as a MET preparation product for adult nurses and healthcare professionals. It focuses on learning clarity, teacher workflow, feedback quality, assessment honesty, MET alignment, and visual trust.

The platform has moved in a good direction since the earlier review: the teacher home is now a single **Today** command center, the student dashboard uses the correct **MET Proficiency Mastery** name, feedback is teacher-approved before students see it, practice remains available even when homework exists, and progress bars now appear for evaluated skills.

## Overall assessment

**Current level: strong foundation, needs consistency and trust polish.**

The product already feels more like a serious teacher workflow than a generic AI tool. The strongest areas are:

- A clear teacher cycle: diagnosis → feedback → homework → submission → review.
- A supportive student home with next class, homework, feedback, progress, and practice access.
- Student feedback labels that are warmer and more human than generic rubric language.
- Honest progress behavior that avoids showing skill bars when no score exists.

The biggest remaining risk is **fragmentation**: several screens repeat similar “next step” information, some assessment scales are mixed without student explanation, and teacher-only diagnostic depth is not yet visually separated enough from student-facing feedback in every workflow.

---

## What is working well

### 1. Teacher workflow is much clearer than a generic dashboard

The teacher dashboard is now explicitly positioned as **Today**, and it combines priority work, KPIs, today’s classes, the student cycle board, and quick actions in one place. This supports the real teaching loop instead of making the teacher hunt through unrelated pages.

**Why it matters:** the teacher should feel, “This saves me time without reducing my quality.” The current structure supports that goal.

### 2. The student dashboard gives a useful first answer: “What should I do next?”

The student home includes next class details, pending homework, feedback readiness, current focus, review due items, and a clear homework action. The compact Practice Studio also keeps self-paced work reachable even when homework is pending.

**Why it matters:** the student should feel, “I know what I need to do next.” The home page is close to that standard.

### 3. Student feedback tone is warmer and more teacher-like

The shared feedback view uses sections like **Current focus**, **What’s working**, **Your next focus**, and **A note from your teacher**. These labels match the desired supportive tone better than formal diagnostic headings.

**Why it matters:** students get feedback that sounds human and practical instead of clinical or robotic.

### 4. Progress display is more honest than many learning dashboards

The student home filters out skills with no score before rendering progress rows. This is aligned with the rule not to assign scores to skills that were not evaluated.

**Why it matters:** MET preparation must be credible. Empty or guessed scores damage trust.

---

## Priority findings

### P0 — Make one “Up next” source authoritative on the student home

The student home still presents next action information in several places: the hero action, metric cards, next class panel, prep box, todo list, feedback summary, and compact practice area. Each is useful alone, but together they can dilute the main action.

**Recommendation:** create one authoritative **Up next** panel near the top. It should choose exactly one primary action:

1. Review returned homework if available.
2. Complete pending homework.
3. Read new teacher feedback.
4. Prepare for the next class.
5. Practice independently.

Supporting cards can remain, but they should not compete with the primary next step.

**Suggested student copy:**

> **Up next:** Complete “MET Speaking: Giving a fuller answer.”  
> Due before your next class. Focus on giving one clear example.

### P0 — Add a visible target score profile before diagnosis and progress interpretation

The platform supports MET work, but the student-facing dashboard still leans on bands, sessions, and scores without a single visible target profile such as:

- Endorsement goal: 55 overall / 55 speaking
- VisaScreen or work visa goal: 58 overall / 59 speaking
- Healthcare professional preparation: 58 overall / 59 speaking

**Recommendation:** add a target profile card to the student profile/teacher diagnosis flow and surface a simple version on student progress:

> **Your target:** Healthcare professional preparation — 58 overall / 59 speaking.

This should happen before diagnosis when possible, so feedback and readiness are interpreted against the correct goal.

### P1 — Explain assessment scales in plain English

The platform uses several assessment ideas: B1/B2 bands, MET-style scores out of 80, teacher scores out of 100, confidence 1–4, and stage labels. These are useful for teachers, but students need a short explanation so the numbers feel trustworthy.

**Recommendation:** add a small “What this means” affordance on Progress and Feedback:

> We only show a skill score after your teacher has enough evidence. A missing score means “not evaluated yet,” not a bad result.

For students, avoid exposing too many scale names at once. Use one main readiness language and keep detailed diagnostics teacher-facing.

### P1 — Separate teacher diagnostic depth from student feedback more visibly

The workflow correctly requires approved feedback before student display, but the product should make the boundary visually obvious in the diagnosis creation/review experience:

- Teacher notes: detailed, diagnostic, editable, private by default.
- Student feedback: short, warm, approved, practical.
- Publish action: explicit and confirmable.

**Recommendation:** in diagnosis creation, label panels as **Teacher-only notes** and **Student feedback preview**. The teacher should never wonder which text the student will see.

### P1 — Strengthen healthcare-specific MET positioning in recurring UI

The app includes MET language, but healthcare preparation could be more consistently connected to MET tasks. The student home and practice studio should make the 70/30 positioning clearer:

- 70% MET preparation
- 30% healthcare communication support

**Recommendation:** use healthcare as a topic lane, not a separate purpose. Example:

> Practice MET speaking organization with a healthcare workplace topic.

This keeps healthcare English supportive of the exam goal.

### P2 — Reduce inline styling drift and protect the premium visual system

Several important components still use large inline style blocks. The visual direction is professional, but inline styles make it easier for spacing, color, and card behavior to drift across teacher and student experiences.

**Recommendation:** move repeated panel, metric, feedback, and teacher row styles into reusable design-system classes gradually. Prioritize:

1. Student feedback cards.
2. Teacher dashboard cards/rows.
3. Confidence/result cards.
4. Reply and history blocks.

### P2 — Persist student self-reflection controls beyond local-only behavior

The student feedback self-assessment is useful, and the “understood” action sends a teacher message. However, self-assessment is stored locally for the latest diagnosis. That can be lost across devices and may not reliably support teacher planning.

**Recommendation:** store self-assessment as a workflow record or inbox event, similar to “feedback understood.” This makes it teacher-visible and durable.

### P2 — Make announcements/memos feel more like a study board

The memo board exists, but it can be more educationally useful with a light structure:

- This week’s MET focus
- New resource
- Reminder
- Encouragement

**Recommendation:** keep the human tone, but add optional announcement categories so the board feels purposeful rather than a free-text note area.

---

## Screen-by-screen audit

### Teacher Today

**Status:** strong.

Keep:

- Today priority.
- KPIs.
- Student cycle board.
- Stage filters.
- Direct action buttons.

Improve:

- Group secondary navigation into teaching-cycle categories later.
- Make stale diagnosis thresholds configurable.
- Add a quick preview of the next recommended class focus for each student.

### Diagnosis and feedback workflow

**Status:** educationally valuable, needs clearer publish boundaries.

Improve:

- Add target profile selection before diagnosis.
- Clearly label teacher-only vs student-visible sections.
- Keep student feedback short: class focus, one win, one focus, one next step.
- Avoid showing multiple improvement areas to the student unless the teacher chooses to share them.

### Student Home

**Status:** good information, slightly too many competing next-step areas.

Improve:

- Promote one primary **Up next** decision.
- Keep metrics as status, not instructions.
- Keep Practice Studio reachable but visually secondary when homework is pending.
- Add target score profile and readiness interpretation.

### Student Feedback

**Status:** supportive and much better aligned with the desired tone.

Improve:

- Keep feedback shown once.
- Make “What this means” available for scores/stages.
- Store student self-assessment durably.
- Consider showing one concise takeaway above the full feedback:

> **Main takeaway:** Your examples are clearer. Next, organize your answer before you speak.

### Student Progress

**Status:** honest but should become more exam-focused.

Improve:

- Show evaluated vs not evaluated skills clearly.
- Add target profile.
- Explain that missing scores mean not enough evidence.
- Add trend over time for speaking/writing when enough approved diagnoses exist.

### Practice Studio and homework

**Status:** useful feature set.

Improve:

- Connect practice choices more explicitly to MET skills.
- Add healthcare-topic variants as optional topics.
- Make each practice activity end with one clear next step.

---

## Recommended roadmap

### Phase 1 — Trust and clarity

1. Add target profile selection and display.
2. Add one authoritative **Up next** block on student home.
3. Add plain-English assessment explanation on Progress/Feedback.
4. Label diagnosis sections as teacher-only vs student-visible.

### Phase 2 — MET readiness

1. Normalize score/band language in student UI.
2. Add a MET readiness summary tied to the selected target profile.
3. Show not-evaluated skills explicitly instead of omitting the whole area when useful.
4. Add trend history only when enough evidence exists.

### Phase 3 — Teacher efficiency

1. Group teacher nav into fewer mental buckets.
2. Add next-class recommendation from latest diagnosis.
3. Add durable student self-assessment records.
4. Add announcement categories for memo board.

### Phase 4 — Design-system polish

1. Move repeated inline styles into reusable CSS classes.
2. Standardize panel spacing and card headings.
3. Audit mobile layouts for student home, homework, and feedback.
4. Remove confirmed dead or duplicate exercise modules only after import checks.

---

## Suggested acceptance checks

Use these checks after implementing the next set of changes:

- A student can answer “What should I do next?” within five seconds of opening Home.
- A teacher can see which text is private and which text the student will see before publishing feedback.
- A skill with no evidence is shown as “Not evaluated yet” or omitted intentionally, never scored.
- The selected MET target profile is visible before diagnosis and on student progress.
- Healthcare content supports a MET skill instead of replacing exam preparation.
- The platform looks like one product across teacher and student views.

## Bottom line

The platform is on the right path. It already supports a real teacher-led MET preparation cycle and has a supportive student experience. The next improvements should not add complexity; they should make the existing workflow more trustworthy, more exam-specific, and easier to interpret.

The standard should remain simple:

- Student: “I know what to do next.”
- Teacher: “I can prepare, diagnose, and follow up faster without losing quality.”
