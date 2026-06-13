# MET Platform — Design / UX / Functionality Review + Action Plan

## Context
The platform (React 19 + Vite SPA) is a solo-teacher MET-prep tool for adult healthcare students.
Teacher runs the loop **Class → Diagnosis → Feedback → Homework → Submission → Review → Next class**;
students get a dashboard with homework, feedback, progress, and practice.

This review finds what looks unprofessional/confusing, what's duplicated or broken, and what to fix
first. Findings are grounded in the actual source. The plan is a prioritized cleanup, **not** a
rewrite — the design tokens and exercise player are already strong.

---

## Biggest problems (ranked)

### P0 — Duplicate "command center" screens (teacher)
- `src/pages/teacher-dashboard.jsx` ("Dashboard") **and** `src/pages/teacher-home.jsx`
  ("Class Prep") both render a greeting, the same stat cards (Students / Classes today /
  Pending review / Needs diagnosis), and a prioritized "who needs attention" list. Two front
  doors, ~70% overlap, different layouts.
- **Fix:** Keep ONE. Merge into a single "Today" home: priority banner + KPIs (from
  `teacher-dashboard`) + the stage-filtered Cycle Board (from `teacher-home`). Delete the other
  from nav. Rename tab to **Today** (or **Home**).

### P0 — Inconsistent product identity
- Student shell brand = "MET Proficiency Mastery" (`src/pages/student-dashboard.jsx:75`);
  package = "V.V. Method"; `PRODUCT.md` brand = "V.V. Method"; student hero kicker =
  "MET preparation dashboard".
- Student half uses a warm cream theme (`--student-bg #f7f5f0`) + top-nav; teacher half uses
  navy/teal + side `Shell`. Reads like two different apps.
- **Fix:** Pick ONE product name, apply everywhere. Unify the shell chrome + background so teacher
  and student feel like the same product.

### P1 — Teacher nav overload (12 flat tabs)
Dashboard, Class Prep, Students, Calendar, Diagnostics, Homework, Submissions, Inbox, Error Bank,
Reports, Exercises, Settings — no grouping; several are stages of one cycle.
- **Fix:** Group to ~6: **Today · Students · Calendar · Teaching cycle** (Diagnostics/Homework/
  Submissions/Error Bank as sub-views) **· Library** (Exercises) **· Inbox**. Settings → avatar menu.

### P1 — Feedback shown twice with different labels (student)
On the Feedback page the summary grid uses kickers **"What improved" / "Current focus"**
(`src/pages/student-feedback.jsx`), then the full `StudentFeedbackView` repeats the *same* content
under **"What is getting stronger" / "Try this next" / "A note from your teacher"**
(`src/components/domain-ui.jsx`). Same data, two headings, one screen → repetitive and confusing.
- **Fix:** Show feedback ONCE. Standardize section names (see wording below). Drop the duplicate
  summary cards; lead with a one-line takeaway + the single structured view.

### P1 — Practice Studio disappears when homework exists
`src/pages/student-home.jsx:266` gates the whole Practice Studio behind `pendingHw.length === 0`.
A student with homework cannot reach self-practice from Home.
- **Fix:** Always show practice; just de-emphasize it (smaller card / move below homework) when
  homework is pending. Don't hide a whole feature.

### P1 — "What to do next" is told in 4 places (student Home)
Hero action button + metric cards + "What's Next" prep box + "Daily Agenda / What to do now" todo
list all answer the same question with slightly different content.
- **Fix:** ONE authoritative "Up next" block (reuse `StudentNextTask` in `domain-ui.jsx`). Demote
  the rest to supporting detail.

### P2 — Progress is barely visualized on Home
`SkillRow` renders only `Last assessed: <stage label>` — no score, no bar, no trend. `TrendChip` is
defined but never used (dead code). "Readiness Snapshot" feels empty for an exam-prep tool.
- **Fix:** Show a real skill bar (score_0_80 → %) + the existing trend arrow. `recharts` is already
  a dependency.

### P2 — Pervasive inline styles vs the design system
`teacher-dashboard`, `teacher-home`, `student-feedback`, `domain-ui` are heavily inline-styled
despite `src/styles/system.css` claiming to be the "single source of truth." Drives drift and
inconsistent spacing/color.
- **Fix:** Move repeated inline blocks to classes/tokens incrementally (start with stat cards,
  panels, feedback cards).

### P2 — MET specifics under-supported
- Exam countdown is gated behind `localStorage 'vv:met_exam_date'`; if unset, it silently vanishes.
  Make exam date a first-class field set by teacher per student.
- Mixed scales with no student-facing explanation: CEFR bands (B1/B2), `score_0_80`, teacher
  `score/100`, `confidence 1–4`. Field names also inconsistent (`currentLevel`/`band`/`currentBand`).
- **Fix:** Normalize student level fields; add a tiny "what these numbers mean" affordance; surface
  a single MET-readiness indicator.

### P3 — Smaller issues
- Self-check checkboxes (`student-homework.jsx:294`) and the feedback "Confidence check" rows don't
  persist — look interactive, do nothing.
- Variable metric count (4–6 cards) makes a ragged grid; "Current focus" can be a long skill name in
  a card meant for short values → overflow.
- Likely dead/duplicate modules: `exercise-editor-new-types.jsx`, `exercise-player-new-types.jsx`,
  `components/exercises/ExercisePlayer.jsx` vs `components/exercise-player.jsx`. Confirm + remove.
- "Danger zone → Clear all workflow data" sits on the main Class Prep screen. Move to Settings.

---

## Better wording (feedback & sections)
| Current | Better |
|---|---|
| "What you did well" / "What improved" | **"What's working"** |
| "What to improve" / "Try this next" | **"Your next focus"** (one focus, not a list) |
| "A note from your teacher" | keep — it's good |
| "Readiness Snapshot / Evaluated skills" | **"Where you stand"** |
| "Daily Agenda / What to do now" | **"Up next"** (single source) |
| "Class Prep" (teacher tab, but shows cycle board) | **"Today"** |
| Confidence check (4 dead checkboxes) | replace with 1 line: *"Before next class, can you name your focus and one win?"* |

## Better student feedback shape (concise, practical, motivating)
> **Focus:** Linking ideas with connectors. **One win:** clear opening sentence.
> **Try next:** swap "and then" → "as a result / however". **Why it matters:** MET Speaking rewards
> organized answers. *(one screen, no duplicate cards)*

---

## Action plan
**Phase 1 — De-duplicate & rename (highest impact, low risk)**
1. Merge teacher Dashboard + Class Prep → one "Today" page; remove dup tab. `App.jsx`,
   `teacher-dashboard.jsx`, `teacher-home.jsx`.
2. Single product name + unified shell/background across teacher & student. `App.jsx`,
   `student-dashboard.jsx`, `system.css`.
3. Feedback shown once; standardize section names. `student-feedback.jsx`, `domain-ui.jsx`.

**Phase 2 — Student clarity**
4. One "Up next" block on Home; stop hiding Practice Studio. `student-home.jsx`.
5. Real progress bars + trend on Home/Progress. `student-home.jsx`, `student-progress.jsx`.

**Phase 3 — MET fit & polish**
6. Exam date as a per-student field; normalize level fields; readiness indicator.
7. Group teacher nav to ~6 items; Settings → avatar menu. `App.jsx`.

**Phase 4 — Hygiene (can wait)**
8. Persist self-check/confidence state; fix ragged metric grid + overflow.
9. Remove confirmed dead modules; migrate inline styles → tokens; move Danger zone to Settings.

## Verification
- `npm run dev`, sign in as teacher (VITE_TEACHER_EMAIL) and as a roster student.
- Teacher: confirm a single command-center; walk Class→Diagnosis→Feedback→Homework→Review with no
  dead-ends or duplicate screens.
- Student: Home shows ONE "next", practice always reachable, feedback appears once with new labels,
  progress shows bars. `npm run lint` clean.
