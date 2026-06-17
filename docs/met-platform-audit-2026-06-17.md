# MET Prep Platform — Expert UX & EdTech Audit

_Date: 2026-06-17 · Scope: V.V. Method MET (Michigan English Test) prep platform · React 19 + Vite SPA_

## Context

A static **code-level audit** of the V.V. Method MET prep platform — a React 19 + Vite SPA
(`src/`) built by a solo teacher (Vinicius) to run the full teaching cycle
(Class → Diagnosis → Feedback + Homework → Review) for a roster of students. Stack: Supabase
(data + auth), Vercel (hosting + `api/*` serverless), Recharts (charts), Motion (animation),
multi-LLM + multi-TTS via proxied serverless functions.

**Method & limits:** Findings come from reading the source, git tracking, and config, plus a live
run of the app (see "Live verification"). Supabase RLS policies and Lighthouse were not audited
against the server, so RLS correctness and raw performance are assessed from code structure +
limited live observation, not exhaustive testing.

---

## Scorecard (1–10)

| Dimension | Score | One-line verdict |
|---|---|---|
| UX & UI | **6** | Strong design system + clear nav, but no real routing, partial mobile, accessibility aspirational |
| Content & Pedagogy | **7** | Genuine MET task mapping + 12 exercise types; missing timed mock test, video, A2/C1 |
| Progress Tracking | **7** | Stage bars, radar, by-skill L/R/W/S, readiness snapshot; no time-series, depends on teacher cadence |
| Technical Performance | **6** | Lean deps, lazy-loaded, error boundary; <20% tests, no monitoring, brittle hardwired config |
| Engagement & Retention | **4** | Spaced repetition + error bank + messaging exist; no streaks, reminders, certificates, email/WhatsApp |
| Business & Growth | **3** | Payment is mock data only; no Stripe, no booking, no pricing page, no onboarding, single-teacher by design |
| Security & Privacy | **5** | Good key hygiene (anon + proxied AI keys); but RLS-dependent & unverified, client-side teacher gate, no privacy policy / consent / minor handling |

**Overall: ~5.4 / 10** — a competent, well-architected *internal teaching tool* for one teacher,
not yet a scalable *student-facing product*. The pedagogy and design foundations are above
average; the product/business/retention/compliance layers are largely absent.

---

## Dimension findings

### 1. UX & UI — 6/10
**Strong**
- Real design system: `src/styles/system.css` (~1330 lines) with tokens for color, type scale,
  4px spacing, radius, shadow, z-index; reusable components in `src/components/shared.jsx`
  (Icon set of 50+ SVGs, Button 5 variants, Card, Pill, Modal w/ focus trap, Shell).
- Clear role-based nav: teacher sidebar grouped Today/Workflow/Support/Admin (`shared.jsx`
  `NEW_NAV_SECTIONS`), student 5-tab header (`student-dashboard.jsx`). Active state via
  `aria-current="page"`. Skip-nav link present.
- `prefers-reduced-motion` fully honored (`system.css` global reset).

**Weak / Missing**
- **No URL routing.** Navigation is in-memory state via `window.vvGo()` (`App.jsx`). Consequence:
  no deep links, no shareable/bookmarkable URLs, **broken browser back button**, refresh resets
  to dashboard. This is the single biggest UX architecture gap.
- **Mobile is partial.** Breakpoints exist (768/420/390) and teacher gets a bottom nav, but
  student horizontal tabs can overflow on <360px and some mobile nav targets lack a 44px min.
- **Accessibility is aspirational.** PRODUCT.md claims "WCAG AAA"; reality: good focus-visible +
  reduced-motion + some ARIA, but forms lack `aria-describedby` error association, contrast (e.g.
  `--muted` text, teal accent) is unverified against 7:1, no automated a11y check.
- Heavy inline-style usage in pages competes with the token system → drift risk.

### 2. Content Quality & Pedagogy — 7/10
**Strong**
- **Real MET structure mapping**, not generic ESL: `ShortAnswer.jsx` `MET_TASK_CONFIG` encodes
  Speaking Q1–Q5 (with 60/90s limits) and Writing W1/W2 (250+ word essay); `ReadExercise.jsx`
  encodes Reading Parts 2/3.
- CEFR tagging present (`exercise-types.js` level A2–C1; `unit-bank.js` B1+ vs B2 bands;
  practice units tagged `B1+ CEFR` / `B2 CEFR`).
- 12 exercise types (`exercise-types.js`): mcq, blank, short, speak, order, fix, flash, listen,
  dialogue, swap, levelup, read — covering all four skills.
- Listening has a TTS cascade (`Listening.jsx`); Speaking has real `MediaRecorder` audio capture
  (`ShortAnswer.jsx`); AI-graded short/speak with teacher review.

**Weak / Missing**
- **No timed, full-length mock test** — the closest is the teacher diagnosis flow. For an *exam*
  prep product this is the biggest content gap.
- **No video explanations** anywhere.
- A2 and C1 content effectively absent (B1+/B2 only); thin dedicated vocabulary-builder UI.
- Listening relies on live TTS, not curated MET-style recorded audio.

### 3. Student Progress Tracking — 7/10
**Strong**
- By-skill tracking across the MET 4 + ancillary: `report-metrics.js`
  `['Grammar','Reading','Writing','Listening','Speaking','Vocabulary','Test Strategy']`.
- Motivating, non-punitive visualization: 5-stage "readiness" bars + trend chips
  (`student-helpers.js`, `student-progress.jsx`), Recharts **radar** for sub-skills
  (Previous/Current/Target overlay), "Readiness Snapshot" on home, bar chart of exercise mix in
  reports. Thoughtful empty states.

**Weak / Missing**
- **No time-series / line chart of score-by-date** — trend is only a direction arrow, so students
  can't *see* a growth curve over weeks (a known motivator).
- Progress only advances when the teacher runs a diagnosis → updates are bursty, not continuous;
  auto-graded homework doesn't visibly move the needle.

### 4. Technical Performance — 6/10
**Strong**
- Lean stack; `React.lazy` for ~14 pages + manual vendor chunks (react/motion/recharts) in
  `vite.config.js`; error boundary present.
- Keys handled correctly: AI keys proxied through `api/ai.js` (multi-provider fallback), TTS
  through `api/tts.js`; nothing secret in the client bundle.

**Weak / Missing**
- **Testing ~<20%** — 5 `node --test` files; critical paths (diagnostics, submissions, auth)
  largely untested.
- **No monitoring** — error boundary logs to console only; no Sentry/APM, no analytics.
- Large monolithic page components; Motion used broadly (interaction-cost risk on low-end mobile).
- **Brittle config**: Supabase connection is *deliberately hardwired* in source (env vars ignored
  after past misconfig) → no rotation path, single project, fragile.
- **Integrations reality check:** Supabase + Vercel + multi-LLM + multi-TTS are real and working.
  **WhatsApp, Notion, and email are NOT in the codebase** — they're aspirational, not built.

### 5. Engagement & Retention — 4/10
**Strong**
- Spaced repetition with 1/3/7/14/30-day intervals (`spaced-repetition.js`), error bank with
  active→practicing→solved lifecycle (`error-bank.jsx`), two-way in-app messaging
  (`message-center.jsx`).

**Weak / Missing**
- **No streaks, no certificates, no achievement badges** (the only "badge" is an exercise-type
  label; an `xpAwarded` field exists but nothing populates it).
- **No outbound reminders at all** — no email, no WhatsApp, no push beyond an in-tab Notification
  for messages. Nothing pulls a student back to the platform between classes.

### 6. Business & Growth — 3/10
- **No payments**: `payment/amount/month` live as hardcoded mock data in `students.jsx`; no Stripe
  or gateway, no pricing page, no checkout.
- **No tutoring booking, no course purchase, no onboarding wizard** (login/register/reset only).
- Architected single-teacher (teacher = one hardcoded email) → no multi-teacher/multi-tenant path,
  so "scaling to more students/courses" is bounded by design.

### 7. Security & Privacy — 5/10
**Verified good**
- Committed key in `supabase-storage.js:13` is the **anon** key (JWT decodes to `role:anon`) — safe
  client-side *if RLS is correct*. **No service_role / API secret is in any git-tracked file**
  (`.env`, `.env.local`, `.env.vercel*` are all gitignored and never committed; the edge function
  reads `service_role` from server env only).
- AI/TTS provider keys are server-side via `api/*` — not in the browser.

**Risks**
- **Whole model rests on Supabase RLS that was not verified.** If any table's RLS is loose/off,
  the public anon key grants that access to anyone. The teacher role is gated by a *client-side*
  email constant — only safe if RLS enforces teacher writes server-side. **This must be verified.**
- **No privacy policy, no terms, no consent flow, no age gate.** Exam-prep students may be minors →
  potential COPPA/GDPR-K exposure. Student text/audio is sent to third-party LLM/TTS providers with
  no disclosed data-handling.
- Hardwired connection = no key rotation story.

---

## Top 3 critical issues — fix immediately

1. **Verify & lock down Supabase RLS** (Security). The entire data model's safety is an unproven
   assumption. Audit every table's RLS policy; confirm a student can only read/write their own
   rows and cannot assume the teacher role. *Until verified, treat all student data as exposed.*
2. **Publish a privacy policy + consent, handle minors** (Compliance). Add a privacy/ToS page, a
   consent checkbox at register, an age field + parental-consent path, and disclose third-party
   AI/TTS processing. This is a legal blocker for taking real (especially minor) students.
3. **Introduce real routing** (UX foundation). Adopt URL-based routes so back button, deep links,
   refresh-in-place, and shareable progress links work. Everything else (notifications linking to a
   page, bookmarking homework) depends on this.

---

## Top 5 strategic improvements — next 3–6 months

1. **Build a timed full-length MET mock test** with section timers, auto-scoring where possible,
   and a results→readiness feed. This is the headline missing pedagogical artifact for exam prep.
2. **Retention loop: reminders + streaks + a growth chart.** Add email (transactional) and/or
   WhatsApp homework reminders, a practice streak, and a score-by-date line chart so students see
   momentum between classes. (WhatsApp/Notion/email are currently *claimed but unbuilt*.)
3. **Monetization + onboarding.** Real Stripe (or similar) for course packages, a pricing/offer
   page, and a short onboarding wizard (goal MET score, target date, current level) that seeds the
   first diagnosis.
4. **Hardening: tests + monitoring.** Raise coverage on auth/diagnostics/submissions, add Sentry
   (or equivalent) + basic analytics, and move the Supabase connection back to validated env config
   with a rotation path.
5. **Finish accessibility & mobile to match the stated AAA goal.** Form error association, verified
   contrast, 44px touch targets, student-tab reflow on small screens, automated a11y checks in CI.

---

## Prioritized action plan (timeline)

| When | Priority | Work |
|---|---|---|
| **Week 1–2** | P0 | RLS audit + fix; confirm teacher-role enforcement server-side; rotate the anon key if any policy was open. Add privacy policy + ToS + consent checkbox + age field. |
| **Week 3–4** | P0/P1 | Add URL routing (back/deep-link/refresh); fix login form error association; mobile touch-target + tab-reflow pass. |
| **Month 2** | P1 | Timed mock-test mode (timers, section flow, results→readiness); score-by-date line chart. |
| **Month 2–3** | P1 | Retention loop: transactional email reminders, practice streak, then WhatsApp reminders. |
| **Month 3–4** | P2 | Stripe course-package checkout + pricing page + onboarding wizard. |
| **Month 4–6** | P2 | Test coverage on critical paths + Sentry/analytics; move Supabase to validated env config; finish a11y/contrast in CI; (optional) multi-teacher groundwork if scaling beyond solo. |

---

## Live verification (run against the running app, 2026-06-17)

Ran `npm run dev` (localhost:5173) and drove the live app (teacher session restored via an existing
`vv:supabase_session` token — no password entered). Results:

- **App health:** mounts clean, no console errors. First load was blank ~5s during Vite's
  first-run dep optimization, then fine.
- **No URL routing / broken back button — CONFIRMED (twice).** In-app navigation (login mode
  switch *and* authenticated sidebar nav) never changes the URL (`localhost:5173/` throughout),
  never grows `history.length`, and no router is mounted. Deep links / back / refresh all break.
- **Reduced-motion — CONFIRMED** present in live stylesheet; no runaway animations.
- **Login input labels — CORRECTION.** Inputs *are* labeled (`textbox:"EMAIL"`, `textbox:"PASSWORD"`
  in a11y tree). The `aria-describedby` error-association gap still stands.
- **Touch targets <44px — CONFIRMED live.** Login tabs 37px; teacher UI: "Sign out" 30px, filter
  chips ("All (13)", "Needs diagnosis") 26px, icon buttons 32px.
- **Mobile reflow — WORKS.** At 375px the teacher sidebar hides and a 5-item bottom nav appears;
  no horizontal document scroll (a few contained elements clip slightly — minor).
- **Charts / progress — empty-state only, by data.** Live DB has **13 real students and 0 recorded
  diagnoses** (dashboard: "NEED DIAGNOSIS 13", "PENDING REVIEW 0"). So every Recharts radar /
  readiness view currently renders its empty state for all students — a real cold-start situation.
  Empty states themselves render correctly.
- **RLS note:** the teacher token reads the full roster (expected). The critical case — whether a
  *student* token can read other students' rows — was not tested (no student session). The P0 RLS
  audit remains the key open risk.

## How to confirm fixes

- **RLS:** From a *student* anon session, attempt to read another student's `submissions`/`diagnoses`
  and to write a `homework` row — both must fail. Use the Supabase SQL editor / MCP to dump policies
  per table and confirm `teacher_id`/`student_id` predicates exist.
- **Routing:** Navigate to a sub-page, copy the URL into a new tab → lands on the same page; browser
  back returns to the previous view; refresh stays put.
- **Compliance:** Register flow blocks without consent; privacy page reachable pre-login.
- **Mock test:** Complete a timed run end-to-end; verify timer enforcement and that results write to
  the readiness snapshot.
- **Retention:** Trigger a reminder (email/WhatsApp) on an overdue homework; confirm delivery and
  that the link deep-links to the homework (depends on routing).
- **Perf/a11y:** Run Lighthouse + an axe pass on student dashboard, homework, progress; targets ≥90
  perf / no critical a11y violations.
