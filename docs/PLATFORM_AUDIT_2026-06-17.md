# Platform Audit — MET Prep Platform

**Date:** 2026-06-17
**Auditor lens:** `education-agent-skills-main` (165 evidence-based pedagogy skills used as the evaluative rubric)
**Scope:** MET-aligned homework creation · pedagogy & learning design · assessment & feedback · accessibility & EAL · content quality · code health
**Type:** Read-only analysis. No source files were modified. The only file written is this report.
**Canonical source audited:** `E:\Platform\src\` (React 19 + Vite SPA, Supabase, Vercel serverless `/api`). Dead siblings (`remix_-*`, `dialogue-practice-extracted`, `met-platform-*.html`, `archive/`) were excluded.

---

## Executive summary

**Overall verdict: a genuinely strong, evidence-aware platform with a few high-value gaps that are mostly about *wiring* and *durability*, not pedagogy.**

This audit deliberately goes deeper than the existing [`docs/PLATFORM_REVIEW.md`](PLATFORM_REVIEW.md) (a higher-level UX/trust pass) and grounds each finding in the evidence-based skills library.

The biggest positive surprise: the **AI/assessment layer is excellent and standards-aligned**. [`src/lib/prompts.js`](../src/lib/prompts.js) encodes the *actual official MET rating scales* (Speaking 3 categories × 0–4; Writing 5 categories × 0–4), full per-skill subskill taxonomies, score-confidence levels, a transcript-only "don't score delivery without audio" rule, and the Q4-vs-Q5 register distinction. [`src/components/exercises/ShortAnswer.jsx`](../src/components/exercises/ShortAnswer.jsx) contains `MET_TASK_CONFIG` covering **all five speaking tasks (Q1–Q5)** and the writing tasks (W1 three-question + W2 essay) with structure, sentence frames, self-checks, and trap warnings. [`src/lib/report-metrics.js`](../src/lib/report-metrics.js) enforces honest, evidence-gated readiness (no score without ≥4 evaluated skills; `null` not `0` for unevaluated). Row-level security in `supabase/migrations/` is correctly scoped. **This is the work of someone who understands the exam and assessment validity.**

The core problems are the inverse of "shallow but flashy" — it's **deep capability that isn't fully connected**:

1. **The best MET feature is largely unreachable in authoring.** The rich Q1–Q5 / W1 / W2 task scaffolding only activates when an exercise carries a `metTaskType` field — but neither the AI generator nor either editor sets it. Only curated `unit-bank.js` presets do. (A1, B-grade product gap.)
2. **Student learning data is localStorage-only.** The spaced-repetition / review engine has a sync hook (`enableSync`) that is **never called**, so review queues and self-assessments silently vanish across devices/browsers. (B1.)
3. **A second deploy target serves a broken app.** `.github/workflows/nextjs.yml` auto-deploys to GitHub Pages on every push — but GitHub Pages can't run the Vercel `/api` serverless functions, so AI feedback and TTS are dead on that URL. (F2.)

None of these are pedagogy failures. They are integration, persistence, and deployment gaps. Fix them and the platform's already-strong design is fully realized.

**Severity legend:** P1 = high (trust/breakage/major value) · P2 = medium (quality/consistency) · P3 = low (polish).
*(No P0 "everything-blocked" issues were found.)*

---

## MET coverage matrix

How the platform's exercise types map to the real MET test structure (per [`Exercises/MET_Test_Skills_Guide.md`](../Exercises/MET_Test_Skills_Guide.md)):

| MET section | Real format | Platform support | Coverage |
|---|---|---|---|
| **Listening** | MCQ; main idea/detail/inference/attitude/function | `listen` type; bank items in `met-b2-exercises.js` (typed `read` + `hidePassage`, audio via TTS); untracked `.mp3`s | **Partial** — audio depends on TTS; see E1 |
| **Reading** | Grammar + comprehension MCQ | `read`, `mcq`, `blank`, `fix`, `order` + large bank | **Strong** |
| **Grammar / Use** | Word/phrase-in-context MCQ | `blank`, `fix`, `mcq` | **Strong** |
| **Vocabulary** | Meaning, collocation, word-form, register | `flash`, `swap`, `levelup`, `mcq` + `met-vocab-*` banks | **Strong** |
| **Writing Task 1** | 3 short personal-response questions | `short` + `MET_TASK_CONFIG.W1Q1/2/3` | **Capable, not wired** — scaffolding needs `metTaskType` (A1) |
| **Writing Task 2** | Formal essay (250+ words) | `short` + `MET_TASK_CONFIG.W2` | **Capable, not wired** (A1) |
| **Speaking Q1–Q5** | 5 structured onscreen tasks, recorded | `speak` + `SpeakingRecorder` (audio capture, self-score) + `MET_TASK_CONFIG.Q1–Q5` | **Capable, not wired** (A1) |

**Read it this way:** receptive skills (Listening/Reading/Grammar/Vocabulary) are well-covered by the structured banks. Productive skills (Speaking/Writing) — the harder, higher-weighted MET sections — have *excellent* scaffolding that is mostly disconnected from how homework is actually created.

---

## A. MET homework creation & test alignment

**Rubric skills:** `curriculum-alignment/coverage-audit`, `curriculum-assessment/assessment-validity-checker`, `curriculum-assessment/learning-progression-builder`, `curriculum-assessment/backwards-design`.

**Strengths:** Full MET task model present (`MET_TASK_CONFIG`, all 5 speaking + writing tasks); AI generation is task-aware (`prompts.js` instructs "Writing Task 1 = 3 numbered questions, not an essay"; Task 2 = formal essay; `imageDescription` for picture-based speaking). Audio recording for speaking shipped (commit `3e3ed969`).

| # | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| A1 | **MET task scaffolding (Q1–Q5 / W1 / W2 frames, checks, traps) is unreachable in authoring.** It only renders when an exercise has `metTaskType`, but AI generation's output schema omits it (`prompts.js` speak fields list = type/title/prompt/targetSeconds/imageDescription, no `metTaskType`) and neither editor sets it (confirmed absent in `exercise-editor.jsx` / `exercise-editor-new-types.jsx`). Only `unit-bank.js` presets carry it. | `src/components/exercises/ShortAnswer.jsx:14`; `src/lib/prompts.js:~500,695`; `src/components/exercise-editor*.jsx` | **P1** | Add a `metTaskType` selector to the exercise editor for `speak`/`short`; add `metTaskType` to the AI generation JSON schema and instruct the model to tag the MET task. |
| A2 | **Two sources of truth for the MET task spec.** `MET_TASK_CONFIG` (player) and `SHARED_MET_DATA` (prompts) independently encode the Q1–Q5 / writing definitions — they can drift. | `ShortAnswer.jsx:14`, `prompts.js:15` | P2 | Extract one `met-task-spec.js` module imported by both player and prompts. |
| A3 | **Coverage skew toward receptive skills.** Structured banks are dense for Listening/Reading/Grammar/Vocab; Speaking/Writing depend on AI + curated units (see matrix). | `src/lib/met-b2-exercises.js`, `src/data/met-vocab-*` | P2 | Build a small curated speaking/writing task set per MET task type so productive practice isn't AI-only. |

---

## B. Pedagogy & learning design

**Rubric skills:** `memory-learning-science/spaced-practice-scheduler` & `retrieval-practice-*`, `ai-learning-science/formative-assessment-loop-designer`, `self-regulated-learning/*`, `curriculum-assessment/learning-progression-builder`.

**Strengths:** Retrieval practice is built into homework generation (`"retrieval_type": "Free Recall"`, `prompts.js:233`). A spaced-repetition engine (`spaced-repetition.js`, intervals 1/3/7/14/30 days) converts error-bank items into review MCQs and surfaces "due" items on student home and in the homework builder — a real **formative loop** (mistake → error bank → scheduled review). Structured error profiles (`error-bank-profiles.js`) enrich the diagnostic prompt. Strong scaffolding (frames/checks/traps).

| # | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| B1 | **Spaced-repetition & review data is localStorage-only — silently lost across devices.** `enableSync(fn)` exists to persist to Supabase but is **never called anywhere** in `src/`. A student switching browser/device loses their entire review queue. (Same class of durability gap as self-assessment, PLATFORM_REVIEW P2.) | `src/lib/spaced-repetition.js:8` (defined, no callers); `git grep enableSync` → definition only | **P1** | Call `enableSync()` at startup with a `supabase-db` upsert; load schedule from Supabase with localStorage fallback. |
| B2 | **Spacing is reactive (errors only), not proactive curriculum spacing/interleaving.** No scheduler distributes *new* content across a term; homework is largely one-off per diagnosis. The `spaced-practice-scheduler` pattern (term-wide spacing of topics) isn't realized. | `spaced-repetition.js` (error-bank scoped); `homework-create.jsx` | P2 | Add an optional term spacing/interleaving planner for new topics, not just error review. |
| B3 | **Biased/non-deterministic shuffle in review MCQ builder.** `toMCQ` uses `.sort(() => Math.random() - 0.5)` (statistically biased) and `Math.random` (non-reproducible). | `src/lib/spaced-repetition.js:147` | P3 | Reuse the seeded Fisher-Yates `shuffleArray` already in `exercise-types.js`. |

---

## C. Assessment & feedback quality

**Rubric skills:** `curriculum-assessment/assessment-validity-checker`, `gap-analysis-from-student-work`, `formative-assessment-technique-selector`, `ai-literacy/ai-output-critical-audit-designer`.

**Strengths (a major strength of the platform):** Official MET rating scales encoded verbatim with descriptors (Speaking 3×0–4, Writing 5×0–4, `prompts.js:21–88`); subskill taxonomy per skill; score-confidence levels; transcript-only audio rule (don't score delivery without audio, `prompts.js:40`); Q4/Q5 register distinction enforced; feedback is teacher-gated before students see it; `report-metrics.js` refuses to compute readiness without ≥4 evaluated skills and preserves `null` for unevaluated skills. This is textbook assessment-validity practice.

| # | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| C1 | **Scale fragmentation (confirmed in code).** At least five scales coexist: 0–4 (rating), 0–80 (MET/CEFR), 0–100% (readiness), 1–4 (confidence), 5-stage bars — and `report-metrics.js` introduces a *sixth*, 0–10 (`score = score4/4*10`). Hard to keep consistent; hard for students to interpret (echoes PLATFORM_REVIEW P1). | `src/lib/report-metrics.js:56`; `prompts.js:16` | P2 | Pick one internal canonical scale (0–4 source of truth); centralize display conversions in one helper; document them. |
| C2 | **Skill set differs across modules.** `REPORT_SKILLS` = 7 (adds "Test Strategy"); exercise/skill labels elsewhere use 6. | `report-metrics.js:1` vs other skill lists | P3 | Define one `SKILLS` constant and import everywhere. |
| C3 | **AI does first-pass scoring on a high-stakes exam — keep the teacher gate mandatory.** Prompts enforce evidence-only and the teacher gate exists (good governance). This is a strength to *protect*, not a defect. | `prompts.js`, `submission-review.jsx` | P3 (watch) | Keep the gate non-bypassable; consider logging AI-vs-teacher score deltas to monitor drift. |

---

## D. Accessibility & EAL

**Rubric skills:** `inclusive-design/udl-lesson-auditor`, `udl-barrier-anticipator`, `eal-language-development/language-demand-analyser`, `vocabulary-tiering-tool`, `sheltered-instruction-lesson-modifier`.

**Strengths:** `prefers-reduced-motion` reset (`system.css:2757`), `.sr-only` utility, 37 accessibility patterns (focus-visible / aria / role) in `system.css`; stage bars carry **text labels** ("Developing", etc.) so color isn't the sole indicator.

| # | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| D1 | **WCAG AAA is a stated target (PRODUCT.md) but unverified and likely unmet.** No contrast tokens or contrast checks; many colors are hardcoded inline (e.g. per-type hex in `exercise-types.js`) and large inline-style blocks (PLATFORM_REVIEW P2) make consistency fragile. AAA (7:1) is a very high bar. | `PRODUCT.md`; `src/lib/exercise-types.js:8–19`; `system.css` (no contrast tokens) | P2 | Run an automated contrast audit; either prove AAA on core text or revise the claim to AA (still strong) and fix failing pairs. |
| D2 | **EAL access not explicitly designed for, despite non-native learners.** UI/instruction language demand isn't tiered to level; listening items rely on TTS; verify transcripts/replay/captions and mic-permission fallbacks exist. | `met-b2-exercises.js` (`hidePassage`), `SpeakingRecorder` in `ShortAnswer.jsx` | P2 | Apply `language-demand-analyser` to UI copy; ensure replay + transcript-on-demand + graceful mic-denied path. |
| D3 | **Inline styling drift threatens focus/contrast consistency.** | per PLATFORM_REVIEW P2 | P3 | Migrate repeated panel/card/feedback styles to design-system classes. |

---

## E. Content quality of exercises

**Rubric skills:** `ai-literacy/ai-hallucination-fact-check-protocol`, `ai-output-critical-audit-designer`, `curriculum-assessment/assessment-validity-checker`, `eal-language-development/vocabulary-tiering-tool`.

**Strengths:** Spot-checked the listening bank — answer keys are **correct** and B2-calibrated with strong inference distractors (e.g. L01 "moved to next Thursday" → "It will happen on another day" ✓; L03 "keeping it until the newer model goes on sale" → "Buy a new phone" ✓; L04 "prefer it open but willing to close" → correct inference option ✓). `seed.sql` exercises include rubrics + scaffolding.

| # | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| E1 | **Listening items are stored as `type:'read'` with `hidePassage:true` — i.e. transcripts, not audio.** Real listening practice depends on TTS reading the hidden passage. If the `read` player doesn't speak it, students *read* what should be *heard* — invalidating the listening construct. | `src/lib/met-b2-exercises.js:6–70` (`type:'read', hidePassage:true`) | P2 | Confirm the player TTS-narrates hidden passages; otherwise retype these as `listen` or wire TTS for `hidePassage`. |
| E2 | **Orphaned media.** `Exercises/Listenings/*.mp3` and `Exercises/Speaking task 1/*.png` are untracked (not in git) and not clearly linked to exercise records → at risk of loss and not deployed. | `git status` (untracked); no DB references found | P2 | Track intended media or move to Supabase Storage; link to exercise records; delete the rest. |
| E3 | **Real student PII hardcoded in source.** `error-bank-profiles.js` embeds a real name + medical/professional context ("Ana Paula Silva", nurse, Massachusetts license). | `src/lib/error-bank-profiles.js:9–22` | P2 | Move learner profiles to data/DB seed (gitignored or anonymized); don't ship real PII in committed code. |

---

## F. Code health

| # | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| F1 | **No quality gate.** `package.json` has no `test` script; 5 `node:test` files in `tests/` are orphaned; CI (`nextjs.yml`) runs only build + deploy — no lint, no tests. | `package.json` (scripts: dev/build/preview/lint only); `tests/*.test.js`; `.github/workflows/nextjs.yml` | **P1** | Add `"test": "node --test tests/"`; run `npm run lint` + `npm test` in CI before deploy. |
| F2 | **Dual auto-deploy; the second target is broken.** `nextjs.yml` deploys to GitHub Pages on every push to `master`. GitHub Pages can't run Vercel `/api` serverless functions (`api/ai.js`, `api/tts.js`) → AI feedback + TTS are dead on the Pages URL. Two divergent live versions. Stale `netlify-cli` dep + a second `npm-publish-github-packages.yml` workflow add noise. | `.github/workflows/nextjs.yml`; `api/*.js`; `package.json` devDeps | **P1** (P0 if the Pages URL is shared with students) | Choose Vercel as sole prod; disable/remove the Pages workflow (or make it clearly a static-only preview); drop `netlify-cli`. |
| F3 | **Parallel exercise implementations + dead trees obscure the source of truth.** Canonical: `components/exercise-player.jsx` (+ `exercise-player-new-types.jsx`, used). But `components/exercises/*` (incl. `ShortAnswer.jsx`, which *houses* `MET_TASK_CONFIG`) is a separate tree of unclear wiring; plus dead `remix_-*`, `dialogue-practice-extracted`, `met-platform-*.html`, `archive/` (these even misled the exploration phase). | `src/components/exercise-player.jsx:12`; `src/components/exercises/`; root dirs | P2 | Document the canonical tree in `CLAUDE.md`; verify/consolidate the `exercises/` components; delete dead trees after import checks. |
| F4 | **Monolith files.** `homework-create.jsx` 74KB, `met-b2-exercises.js` 97KB, `system.css` 98KB, `exercise-player.jsx` 63KB, `prompts.js` 62KB, `submission-review.jsx` 53KB; no TypeScript. | file sizes | P2 | Split by sub-feature; move large data banks to JSON; consider gradual TS adoption. |
| F5 | **Root clutter & junk tracked files.** Stray `)` and `,` files, screenshots, and `.html` prototypes at repo root. *Positive:* `.env*` is correctly gitignored (secrets not committed ✓) and the hardwired Supabase **anon** key is safe given the solid RLS verified in `migrations/`. | `git status`; `.gitignore`; `migrations/*student_read_policies*.sql` | P3 | Remove junk files and prototypes; keep secret hygiene as-is. |

---

## Prioritized fix backlog

Ranked across all areas. Effort: S < 1h · M ≈ half-day · L ≈ multi-day.

| Rank | ID | Fix | Effort | Files |
|---|---|---|---|---|
| 1 | F2 | Make Vercel the sole prod target; disable/guard the GitHub Pages workflow (it serves a build with broken AI/TTS) | S | `.github/workflows/nextjs.yml` |
| 2 | B1 | Wire `enableSync()` so spaced-repetition + review data persists to Supabase (stop silent cross-device loss) | M | `spaced-repetition.js`, `supabase-db.js`, `App.jsx` |
| 3 | A1 | Make MET task scaffolding reachable: `metTaskType` selector in editor + emitted by AI generation | M | `exercise-editor*.jsx`, `prompts.js` |
| 4 | F1 | Add `test` script + run lint/test in CI before deploy | S | `package.json`, CI workflow |
| 5 | E3 | Remove real student PII from committed source | S | `error-bank-profiles.js` |
| 6 | E1 | Confirm/fix that `read`+`hidePassage` listening items are actually heard (TTS), not read | M | `exercise-player.jsx`, `met-b2-exercises.js` |
| 7 | C1 | Reconcile assessment scales to one canonical internal scale + centralized display conversions | M | `report-metrics.js`, progress/feedback pages |
| 8 | D1 | Contrast audit; prove AAA or revise claim to AA and fix failing pairs | M | `system.css`, `exercise-types.js` |
| 9 | E2 | Track or relocate orphaned media; link to exercise records | M | `Exercises/Listenings`, `Exercises/Speaking task 1` |
| 10 | A2/A3 | Single MET-task-spec module; curated speaking/writing task set | M | new `met-task-spec.js`, banks |
| 11 | F3/F4 | Document canonical tree; delete dead trees; begin splitting monoliths | L | repo-wide |
| 12 | B2, B3, C2, C3, D2, D3, F5 | Proactive spacing planner; seeded shuffle; unify skill set; EAL copy review; design-system migration; junk cleanup | mixed | various |

---

## Quick wins (safe, high-confidence, ~≤1h each)

- **F2** — Disable the GitHub Pages workflow (or restrict to manual dispatch) so students can't land on a build with no working AI/TTS.
- **F1** — Add `"test": "node --test tests/"` to `package.json`; add a lint+test step to CI.
- **E3** — Move the hardcoded `Ana Paula Silva` profile out of `error-bank-profiles.js` into gitignored/anonymized seed data.
- **B3** — Replace `toMCQ`'s `.sort(() => Math.random()-0.5)` with the existing seeded `shuffleArray`.
- **C2** — Collapse the 6-vs-7 skill lists into one shared `SKILLS` constant.
- **F5** — Delete stray root junk (`)`, `,`) and the unused `netlify-cli` dependency.

---

## What's already excellent (keep / protect)

- Official MET rating scales + subskill taxonomies encoded in `prompts.js` — a real differentiator.
- Honest, evidence-gated scoring: `null` not `0`; readiness needs ≥4 evaluated skills (`report-metrics.js`).
- Teacher-gated AI feedback with a preview before send (commit `32751cc5`).
- All 5 speaking tasks + writing tasks fully specified with frames/checks/traps (`MET_TASK_CONFIG`).
- Real formative loop: mistake → error bank → spaced review.
- Solid, correctly-scoped Supabase RLS; secrets kept out of git.
- Correct, B2-calibrated content with strong inference distractors (verified sample).

---

*Audit complete. 0 source files modified. Findings are evidence-cited; runtime-dependent items (E1 TTS narration, D1 contrast values) are flagged for empirical confirmation before remediation.*
