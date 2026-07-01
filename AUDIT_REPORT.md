# Impeccable Audit — MET Proficiency Mastery Platform

**Date:** 2026-07-01
**Method:** Systematic code-level audit across 5 dimensions per `/impeccable audit` protocol

---

## Anti-Patterns Verdict

**PASS — with reservations.** This does not broadly look AI-generated. The design is intentional: navy/teal/amber palette, Outfit + Sora fonts, no glassmorphism, no bounce animations, no hero metrics sliders. The personality reads as a professional teaching tool.

**What holds it back from a clean pass:**
- The `linear-gradient(120deg, TEAL 0%, NAVY 100%)` submit-button pattern appears identically in **10+ exercise files**, which is the project's most visible AI tell — not the gradient itself, but the mechanical repetition across files with identical inline style objects.
- `SectionHeader` using `<div role="heading" aria-level="2">` instead of `<h2>` is the most pervasive anti-pattern (65+ instances) — a single consistent non-semantic choice that feels like a tool-generated scaffold.
- Generic `alt="Exercise visual"` on every exercise image suggests a template that was never refined.
- The inline style system in exercise files reads as "all files generated from the same prompt" — identical structure, identical constants, identical patterns, no abstraction.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|---|---|---|
| 1 | Accessibility | **2** | SectionHeader `<div role="heading">` used 65+ times; ~30 unlabeled inputs; keyboard gaps on interactive elements; `dangerouslySetInnerHTML` without sanitization |
| 2 | Performance | **2** | Inline styles recreated every render (systemic); `transition: all` in CSS animates layout; no `loading="lazy"` on images; empty catch blocks swallow errors |
| 3 | Theming | **2** | Excellent token system (80+ properties) but 34+ hardcoded hex values in JSX; dark mode has gaps in exercise components; `outline: none` replaces box-shadow on buttons |
| 4 | Responsive | **2** | Good breakpoint coverage (390–1024px) but 420–768px gap; modal fixed width at 680px; login grid column at 420px; exercise touch targets may be < 44px |
| 5 | Anti-Patterns | **3** | Distinctive brand identity; 10x identical gradient pattern is the main tell; no side-tab borders, gradient text, glassmorphism, or bounce animations |
| **Total** | | **11/20** | **Acceptable (significant work needed)** |

**Rating band**: 10–13 = Acceptable

---

## Executive Summary

- **Audit Health Score: 11/20** (Acceptable — significant work needed)
- **Total issues: 52** — P0: 5, P1: 11, P2: 22, P3: 14
- **Top 5 critical issues:**
  1. **P0** `dangerouslySetInnerHTML` in `topic-explanations.jsx` without DOMPurify — XSS vector from AI or teacher content
  2. **P0** API keys stored in localStorage via `settings.jsx` — 7 provider keys exfiltratable by any XSS
  3. **P1** `<div role="heading" aria-level="2">` in `SectionHeader.jsx` used 65+ times instead of `<h2>` — largest single accessibility debt
  4. **P1** `outline: none` on `.btn:focus-visible` replaced with `box-shadow` — invisible in Windows High Contrast Mode, WCAG 2.4.7 violation
  5. **P1** 10 exercise files duplicate the same TEAL/NAVY constants, gradient pattern, and option style logic — 300+ lines of identical code, no shared module
- **Recommended next steps:** Fix P0 security issues immediately, then address P1 accessibility + theming + DRY gaps.

---

## Detailed Findings by Severity

### P0 — Blocking (fix immediately)

**[P0] `dangerouslySetInnerHTML` without sanitization — XSS vector**
- **Location:** `src/components/topic-explanations.jsx:58,61,66`
- **Category:** Accessibility / Security
- **Impact:** Content from AI generation or teacher textarea is rendered raw via `dangerouslySetInnerHTML={{ __html: b.text }}`. The `parseTopicContent` function converts `**bold**` to `<strong>` tags, but does not escape other HTML. A malicious `<img src=x onerror=alert(1)>` in teacher input or AI output executes scripts. Combined with localStorage API keys, this is a full XSS attack chain.
- **WCAG:** 4.1.1 Parsing
- **Recommendation:** Replace `dangerouslySetInnerHTML` with a structured renderer that only produces `<strong>` elements, or add DOMPurify sanitization. Move the `**bold**` parser to produce React elements instead of HTML strings.
- **Suggested command:** `/impeccable harden`

**[P0] 7 provider API keys stored unencrypted in `localStorage`**
- **Location:** `src/pages/settings.jsx:45-51,147-160`
- **Category:** Security
- **Impact:** Groq, Gemini, Anthropic, OpenAI, OpenRouter, ElevenLabs, Deepgram API keys stored via `localStorage.setItem('vv:[provider]_api_key', ...)`. Vulnerable to XSS exfiltration (see above), DevTools inspection, and browser extension access.
- **Recommendation:** Remove client-side API key entry entirely. Backend `api/ai.js` already has provider keys available via environment variables. Let the backend be the sole keyholder.
- **Suggested command:** `/impeccable harden`

**[P0] `outline: none` on `.btn:focus-visible` — invisible focus in High Contrast Mode**
- **Location:** `src/styles/components.css:57-59`
- **Category:** Accessibility
- **Impact:** `.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--accent-light); }` — In Windows High Contrast Mode, `box-shadow` is not rendered. Only `outline` is. Buttons become unfocusable for users relying on high-contrast mode. The same pattern exists on `.input:focus`. This affects **every button and input** in the application.
- **WCAG:** 2.4.7 Focus Visible (Level AA), 1.4.11 Non-text Contrast (Level AA)
- **Recommendation:** Keep `outline` alongside `box-shadow`: `outline: 2px solid var(--accent); outline-offset: 2px;`.
- **Suggested command:** `/impeccable harden`

**[P0] Empty `.catch(() => {})` swallows all errors silently**
- **Location:** `src/App.jsx:184,201,278`, `src/pages/exercises.jsx:60,64`
- **Category:** Performance / Code Quality
- **Impact:** Network failures, Supabase outages, and unexpected errors are silently discarded. The UI renders empty states with no error feedback, no retry mechanism, and no console warning. Developers debugging issues have zero signal.
- **Recommendation:** Log to console and optionally surface to UI via toast: `.catch(e => { console.warn('[load] failed:', e); })`. For user-facing errors, show a retry button.
- **Suggested command:** `/impeccable harden`

**[P0] Flashcard `<div onClick>` with no keyboard support**
- **Location:** `src/components/exercise-player.jsx:991` (approximate, confirmed in `FlashPlayer`)
- **Category:** Accessibility
- **Impact:** Keyboard-only users cannot flip flashcards. The `<div>` has `cursor: pointer` signaling interactivity but no `role="button"`, `tabIndex={0}`, or `onKeyDown` handler. Complete keyboard barrier.
- **WCAG:** 2.1.1 Keyboard (Level A), 4.1.2 Name Role Value
- **Recommendation:** Add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler for Enter/Space.
- **Suggested command:** `/impeccable harden`

---

### P1 — Major (fix before release)

**[P1] `<div role="heading" aria-level="2">` replaces semantic `<h2>` (65+ instances)**
- **Location:** `src/components/ui/SectionHeader.jsx:4`
- **Category:** Accessibility
- **Impact:** The primary heading component for the entire teacher UI uses `<div role="heading" aria-level="2">` instead of `<h2>`. While technically valid ARIA, `<div>` elements lose native heading semantics (font-size inheritance, heading outline navigation in some screen readers, browser reader mode). Used on every teacher page.
- **WCAG:** 1.3.1 Info and Relationships (Level A), 2.4.6 Headings and Labels (Level AA)
- **Recommendation:** Replace with `<h2>` element directly. The current CSS already has a `.section-title` class for styling, so no visual change needed.
- **Suggested command:** `/impeccable harden`

**[P1] 10 exercise files duplicate identical TEAL/NAVY constants and gradient pattern**
- **Location:** All `src/components/exercises/*.jsx` files (lines 3-5 of MultipleChoice, FillBlank, ErrorCorrection, OrderSentences, Listening, ReadExercise, ShortAnswer, ExercisePlayer, LevelUp, Reading)
- **Category:** Anti-Pattern / Code Quality
- **Impact:** Every exercise file redefines `const TEAL = 'var(--accent)'; const NAVY = 'var(--accent-text)';` identically. Two files (`LevelUp.jsx`, `Reading.jsx`) use `#0B1F3A` instead of `var(--accent-text)`, breaking dark mode. The submit-button gradient `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` is copy-pasted ~25 times with identical inline style objects.
- **Recommendation:** Create `src/components/exercises/shared.js` exporting TEAL, NAVY, submitButtonStyle(), optionStyle(state), markerLabel(state). Import from one place. Fix the two files with raw hex values.
- **Suggested command:** `/impeccable distill`

**[P1] Generic `alt="Exercise visual"` on teacher-uploaded images**
- **Location:** `src/components/exercises/LevelUp.jsx:51`, `src/components/exercises/Reading.jsx:64`
- **Category:** Accessibility
- **Impact:** Screen readers announce "Exercise visual" for every image, providing zero information. The exercise data may contain `imageAlt` but it's unused.
- **WCAG:** 1.1.1 Non-text Content (Level A)
- **Recommendation:** Use dynamic alt text from exercise data: `alt={ex.imageAlt || ex.imageDescription || ''}`.
- **Suggested command:** `/impeccable harden`

**[P1] Modal backdrop click dismisses but keyboard cannot dismiss with Enter/Space**
- **Location:** `src/components/ui/Modal.jsx:45,58`
- **Category:** Accessibility
- **Impact:** The backdrop overlay uses `onClick={handleBackdrop}` to dismiss the modal. But the backdrop `<div>` is not keyboard-focusable; if focus somehow reaches it (e.g., via tab navigation from the modal content boundary), pressing Enter/Space does nothing. Escape key dismissal exists but this is a secondary interaction gap.
- **WCAG:** 2.1.1 Keyboard
- **Recommendation:** Ensure Escape key dismissal is sufficient for all modal interaction patterns. Consider adding `onKeyDown` to the backdrop for parity.
- **Suggested command:** `/impeccable harden`

**[P1] 34+ hardcoded hex colors in JSX files bypass design tokens**
- **Location:** Various exercise files, `src/pages/login.jsx:28,108`, `src/pages/reports.jsx:355,392`, `src/pages/error-bank.jsx:171`, `src/pages/settings.jsx` (inline styles)
- **Category:** Theming
- **Impact:** Colors like `#DC2626`, `#92400E`, `#065F46` used inline instead of `var(--danger)`, `var(--warning-text)`, `var(--ex-correct-text)`. This bypasses the design token system entirely — theme changes (including dark mode) don't affect these values.
- **Recommendation:** Audit and replace all hardcoded hex values with CSS custom property references. Prioritize files with the highest counts: reports.jsx, error-bank.jsx, login.jsx.
- **Suggested command:** `/impeccable colorize`

**[P1] `SectionHeader` inline style objects recreated every render**
- **Location:** `src/components/topic-explanations.jsx:55-71`, `src/pages/calendar.jsx` (~40 inline styles), `src/pages/student-home.jsx` (~31 inline styles), `src/pages/student-dashboard.jsx` (multiple)
- **Category:** Performance
- **Impact:** Every `style={{...}}` creates a new object reference per render, defeating React's DOM diffing. Components with frequent state updates (exercise players, calendar, topic editor) trigger unnecessary reconciliation. Estimated 5-15% render overhead on interactive components.
- **Recommendation:** Extract static inline styles to CSS classes. For dynamic styles, use `useMemo`.
- **Suggested command:** `/impeccable optimize`

**[P1] No `loading="lazy"` on any `<img>` tag**
- **Location:** `src/components/exercise-player.jsx:521`, `src/components/exercises/ShortAnswer.jsx:90,281`, `src/components/exercises/Reading.jsx:63`, `src/components/exercises/LevelUp.jsx:50`, `src/components/resource-picker.jsx:174`, `src/components/exercise-editor.jsx:450`
- **Category:** Performance
- **Impact:** All images load eagerly on mount, blocking the initial paint. For exercises with images, this adds 50–200 kB of blocking requests.
- **Recommendation:** Add `loading="lazy"` to all `<img>` tags.
- **Suggested command:** `/impeccable optimize`

**[P1] `Modal` lacks `aria-describedby` for subtitle/body content**
- **Location:** `src/components/ui/Modal.jsx:61-65`
- **Category:** Accessibility
- **Impact:** The modal dialog has `aria-labelledby="modal-title"` for the title, but no `aria-describedby` linking to the subtitle or body content. Screen readers announce only the title, missing the descriptive content.
- **WCAG:** 4.1.2 Name, Role, Value
- **Recommendation:** Add `aria-describedby="modal-subtitle"` when subtitle is present.
- **Suggested command:** `/impeccable harden`

**[P1] `Promise.all` fetch storm with no error isolation**
- **Location:** `src/pages/teacher-dashboard.jsx:50`
- **Category:** Performance
- **Impact:** Fires N parallel async requests for every student simultaneously. A single rejection in any inner promise rejects the entire `Promise.all`, crashing the dashboard load. No `.catch` on the inner `getStudentCycleState`.
- **Recommendation:** Replace with `Promise.allSettled` for error isolation, or add concurrency limiting.
- **Suggested command:** `/impeccable harden`

**[P1] `transition: all` in CSS — animates layout properties**
- **Location:** `src/styles/components.css:45,203,288,317,451,1245` (`.btn`, `.progress-fill`, `.mini-bar`, `.card-row`, `.cr-skill-btn`, `.transition`)
- **Category:** Performance
- **Impact:** `transition: all` can animate `width`, `height`, `margin`, `padding` — all layout-triggering properties. The `.progress-fill` animates `width` via `transition: all` (should use `transform: scaleX()`).
- **Recommendation:** Replace with explicit transform/opacity transitions.
- **Suggested command:** `/impeccable optimize`

---

### P2 — Minor (fix in next pass)

**[P2] Form inputs without programmatic label association (~30 instances)**
- **Location:** `src/components/exercise-editor.jsx:166-391` (8+ inputs), `src/pages/diagnostic-create.jsx:739-862` (6+ inputs), `src/tools/tool-homework.jsx:251-266` (4 inputs), `src/pages/students.jsx:182`, `src/pages/student-profile.jsx:360`
- **Category:** Accessibility
- **Impact:** Label elements visually precede inputs but lack `htmlFor`/`id` association. Screen readers cannot programmatically identify which label belongs to which input.
- **WCAG:** 1.3.1 Info and Relationships, 4.1.2 Name Role Value
- **Recommendation:** Add `htmlFor` to each `<label>` with matching `id` on the `<input>`.
- **Suggested command:** `/impeccable harden`

**[P2] Avatar uses `<div role="img">` instead of `<img>` element**
- **Location:** `src/components/ui/Avatar.jsx:24` (approx.)
- **Category:** Accessibility
- **Impact:** While `<div role="img" aria-label="...">` is technically valid ARIA, using a native `<img>` element provides better semantics and screen reader support.
- **WCAG:** 1.1.1 Non-text Content
- **Recommendation:** Replace with `<img>` or use `<svg>` directly with proper aria-label.
- **Suggested command:** `/impeccable harden`

**[P2] Missing breakpoint coverage between 420px and 768px**
- **Location:** `src/styles/responsive.css` (breakpoints at 390, 420, 768, 860, 1024px)
- **Category:** Responsive Design
- **Impact:** Large phones and small tablets (421–767px) have no specific responsive treatment. Content may appear cramped or stretched.
- **Recommendation:** Add a 600px breakpoint for intermediate devices or make layouts fluid within ranges.
- **Suggested command:** `/impeccable adapt`

**[P2] Modal `maxWidth={680}` can exceed mobile viewport**
- **Location:** `src/components/ui/Modal.jsx:5,65`
- **Category:** Responsive Design
- **Impact:** Fixed 680px max-width can exceed the viewport width on mobile devices. On a 375px phone, the modal will overflow horizontally.
- **Recommendation:** Add `max-width: calc(100vw - 2rem)` fallback in CSS, or set a responsive maxWidth.
- **Suggested command:** `/impeccable adapt`

**[P2] Exercise touch targets potentially < 44px**
- **Location:** `src/components/exercises/MultipleChoice.jsx:74` (padding: '12px 16px'), all other exercise components follow same pattern
- **Category:** Responsive Design
- **Impact:** Option buttons use inline padding without `min-height` set. Depending on font-size, the total touch area may be below the 44×44px WCAG recommendation.
- **WCAG:** 2.5.8 Target Size (Level AA, WCAG 2.2)
- **Recommendation:** Ensure option buttons have `min-height: 44px` or equivalent via shared CSS class.
- **Suggested command:** `/impeccable adapt`

**[P2] Login page fixed grid column at 420px**
- **Location:** `src/pages/login.jsx:220-230` (`grid-template-columns: 420px 1fr`)
- **Category:** Responsive Design
- **Impact:** The 420px left column forces the login form to be wider than many mobile viewports. No intermediate breakpoint between 420px and 768px.
- **Recommendation:** Use `minmax(320px, 420px)` or add a breakpoint for ~600px viewports.
- **Suggested command:** `/impeccable adapt`

**[P2] Teal-navy gradient duplicated identically in 10+ exercise files**
- **Location:** All `src/components/exercises/*.jsx` files
- **Category:** Anti-Pattern / DRY
- **Impact:** `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` appears ~25 times across exercise files. The TEAL/NAVY constants are also duplicated. A shared CSS class `.gradient-action` would eliminate all duplication.
- **Recommendation:** Extract to a shared CSS class. Inline style gradient → CSS class.
- **Suggested command:** `/impeccable distill`

**[P2] `inboxUnread` localStorage key lacks `vv:` prefix**
- **Location:** `src/App.jsx:214`
- **Category:** Code Quality
- **Impact:** All other localStorage keys use the `vv:` prefix convention. This one doesn't, risking collisions with other apps on the same domain.
- **Recommendation:** Rename to `vv:inbox_unread`.
- **Suggested command:** `/impeccable distill`

**[P2] App.jsx imports directly from `workflow-roster.js` instead of facade**
- **Location:** `src/App.jsx:8`
- **Category:** Code Quality
- **Impact:** `import { getStudents, requestInboxNotificationPermission } from './lib/workflow-roster.js'` bypasses the facade (`workflow.js`). The facade is the documented import convention.
- **Recommendation:** Re-route through `workflow.js` facade.
- **Suggested command:** `/impeccable distill`

**[P2] Only 2 ErrorBoundary instances for 22+ page SPA**
- **Location:** `src/App.jsx:292,339`
- **Category:** Code Quality
- **Impact:** A single ErrorBoundary wraps the entire teacher shell. One page crash blanks the entire app. Students have their own, but teacher side has no per-page isolation.
- **Recommendation:** Add `<ErrorBoundary>` inside individual page renderers in `renderTeacherPage()`.
- **Suggested command:** `/impeccable harden`

**[P2] Hardcoded teacher email fallback in source**
- **Location:** `src/App.jsx:85`
- **Category:** Security / Code Quality
- **Impact:** `(rawTeacherEmail || 'vvieira010x@gmail.com')` — personal email exposed in codebase, silent fallback masks missing VITE_TEACHER_EMAIL config.
- **Recommendation:** Remove fallback; throw a config error if unset.
- **Suggested command:** `/impeccable harden`

**[P2] Magic numbers without named constants**
- **Location:** `src/App.jsx:218` (15000ms inbox poll), `src/App.jsx:458` (3200ms toast), `src/pages/homework-create.jsx` (100ms scroll delays ×5), `src/components/exercise-player.jsx:905` (600ms flash timeout)
- **Category:** Code Quality
- **Impact:** Hardcoded numeric values with no semantic name or documentation. Changes require grepping through code.
- **Recommendation:** Define `const INBOX_POLL_MS = 15000`, `const TOAST_DURATION_MS = 3200`, etc.
- **Suggested command:** `/impeccable distill`

**[P2] `stopPropagation` on `<div>` without keyboard handler**
- **Location:** `src/pages/class-record.jsx:150`, `src/pages/diagnostic-create.jsx:653`, `src/components/topic-explanations.jsx:169`
- **Category:** Accessibility
- **Impact:** Click events are stopped from propagating, but any keyboard-focusable elements inside these divs may have unexpected event behavior.
- **Recommendation:** Use sparingly; prefer CSS `pointer-events: none` where appropriate.
- **Suggested command:** `/impeccable harden`

**[P2] Inline `<style>` tag injection in SpeakPlayer**
- **Location:** `src/components/exercise-player.jsx:649`
- **Category:** Performance
- **Impact:** A new `<style>` element with `@keyframes vv-pulse` is injected into the DOM every render. React does not deduplicate these — they accumulate.
- **Recommendation:** Move the keyframe to `components.css`.
- **Suggested command:** `/impeccable optimize`

**[P2] `window.vvGo` and `window.toast` global mutations**
- **Location:** `src/App.jsx:237-242,461`
- **Category:** Code Quality
- **Impact:** Side-effect mutation of `window` object in effect hooks. Works but is fragile — multiple re-mounts (StrictMode) can leave stale references. Over 100 call sites use `window.toast`.
- **Recommendation:** Export `toast` from a dedicated module, import where needed.
- **Suggested command:** `/impeccable harden`

---

### P3 — Polish

**[P3] Modal `kicker` prop uses uppercase eyebrow pattern**
- **Location:** `src/components/ui/Modal.jsx:69`
- **Category:** Anti-Pattern
- **Impact:** The `modal-kicker` class applies tiny uppercase tracked text above the modal title. While used sparingly here, it's the exact "AI grammar" eyebrow pattern from the impeccable ban list. One instance is fine; it shouldn't proliferate.
- **Recommendation:** Keep as-is for now. Avoid expanding this pattern to section headers.
- **Suggested command:** `/impeccable quieter`

**[P3] `section-title` uses uppercase tracking**
- **Location:** `src/styles/components.css` (`.section-title` styling)
- **Category:** Anti-Pattern
- **Impact:** Section titles use uppercase with letter-spacing. This is acceptable for the "fewer than 4 words" exception in the impeccable guidelines but borders on the eyebrow trope.
- **Recommendation:** Ensure section titles are always short (≤4 words).
- **Suggested command:** N/A - monitor for creep

**[P3] No `safe-area-inset` on shell topbar or skip-nav**
- **Location:** `src/styles/base.css`, `src/styles/components.css`
- **Category:** Responsive Design
- **Impact:** On notched devices (iPhone X+), the topbar and skip-nav may be obscured by the notch or status bar. Only the message dock has `env(safe-area-inset-right)`.
- **Recommended:** Add `padding-top: env(safe-area-inset-top)` to `.shell-topbar`.
- **Suggested command:** `/impeccable adapt`

**[P3] OrderSentences move buttons lack position context in `aria-label`**
- **Location:** `src/components/exercises/OrderSentences.jsx:121-140` (approx.)
- **Category:** Accessibility
- **Impact:** Buttons labeled "Move up" / "Move down" don't include which item they move. In a list of 5+ sentences, screen reader users don't know which item will move.
- **WCAG:** 4.1.2 Name, Role, Value
- **Recommendation:** Use `aria-label={`Move "${sentence.text.slice(0, 20)}" up`}`.
- **Suggested command:** `/impeccable harden`

**[P3] `useRef` imported but unused in `ExerciseCard.jsx` and `topic-explanations.jsx`**
- **Location:** `src/components/exercises/ExerciseCard.jsx:1`, `src/components/topic-explanations.jsx:1`
- **Category:** Code Quality
- **Impact:** Dead imports contribute to bundle size unnecessarily.
- **Recommendation:** Remove unused imports.
- **Suggested command:** `/impeccable distill`

**[P3] `components.css` is 5668 lines — monolithic**
- **Location:** `src/styles/components.css`
- **Category:** Code Quality / Performance
- **Impact:** Every page loads the full 134 kB CSS bundle. No component-level CSS splitting.
- **Recommendation:** Split by feature area (shell, exercises, dashboard, calendar).
- **Suggested command:** `/impeccable distill`

**[P3] No `className` utility (clsx/classnames)**
- **Location:** Throughout application
- **Category:** Code Quality
- **Impact:** Dynamic class concatenation is done via template literals or `[].filter(Boolean).join(' ')` pattern throughout (e.g., `KpiCard` at `teacher-dashboard.jsx:290`). A utility library would reduce noise.
- **Recommendation:** Add and use `clsx` or `es-toolkit`'s classNames.
- **Suggested command:** `/impeccable distill`

**[P3] `Button.jsx` is used as import but inline buttons used instead**
- **Location:** `src/components/ui/Button.jsx` (16 lines), `src/components/exercises/PreviewExercise.jsx:2`
- **Category:** Code Quality
- **Impact:** The project defines and exports a `Button` component, but most exercise files render inline `<button>` elements with hardcoded styles, never using the `Button` component. `PreviewExercise.jsx` imports `Button` but uses inline styles throughout.
- **Recommendation:** Enforce `Button` component usage across the app.
- **Suggested command:** `/impeccable distill`

**[P3] Confusing token naming: `--accent-deep` equals `--primary`**
- **Location:** `src/styles/tokens.css:27`
- **Category:** Theming
- **Impact:** `--accent-deep: var(--primary)` is confusing — "accent deep" sounds like a darker version of the teal accent, but resolves to the navy primary color. Misleading for developers working with the design system.
- **Recommendation:** Rename to `--accent-text-deep` or remove if unused.
- **Suggested command:** `/impeccable clarify`

**[P3] Topic editor uses emoji (✏️) despite "No Emojis" design rule**
- **Location:** `src/components/topic-explanations.jsx:191`
- **Category:** Anti-Pattern
- **Impact:** DESIGN.md explicitly bans emojis for a "professional, clinical tone." The topic editor UI shows ✏️ before "AI prompt set".
- **Recommendation:** Replace with SVG icon.
- **Suggested command:** `/impeccable quieter`

**[P3] `ExerciseCard` uses `stopPropagation` on icon-button `<div>`**
- **Location:** Extended exercise card interaction patterns
- **Category:** Accessibility
- **Impact:** Icon-only buttons wrapped in divs with stopPropagation — non-keyboard-accessilble.
- **Recommendation:** Use `<button>` with `aria-label`.
- **Suggested command:** `/impeccable harden`

---

## Patterns & Systemic Issues

1. **Inline-over-CSS is the dominant exercise pattern.** The entire exercise subsystem (10+ files, ~2,500 lines) uses 100% inline styles. The design system's CSS classes (`.btn`, `.card`, `.pill`) are defined in `components.css` but exercise components never use them. This is the single biggest architectural debt.

2. **TEAL/NAVY constant duplication.** Every exercise file defines the same two constants. Two files diverge with raw hex values, breaking dark mode. The submit-button gradient is copy-pasted ~25 times.

3. **Hard-coded colors are pervasive.** 34+ hex values across JSX files bypass the design token system. While the token system is excellent (80+ properties), it's routinely ignored in inline styles.

4. **Accessibility is foundational but incomplete.** `system.css` has excellent foundations: `focus-visible` global outline, skip-nav, reduced-motion, 44px buttons. But individual components don't follow through — missing labels, non-semantic headings, keyboard-inaccessible interactions.

5. **Large files need splitting.** `components.css` (5,668 lines), `homework-create.jsx` (1,467 lines), `exercise-player.jsx` (1,358 lines), `submission-review.jsx` (975 lines) all exceed reasonable single-file limits.

6. **Error handling is inconsistent.** Empty `.catch(() => {})` blocks appear in 5+ locations. The `Promise.all` pattern in `teacher-dashboard.jsx` has no error isolation. Network failures produce silent failures.

---

## Positive Findings

- **Excellent code splitting**: 17 pages lazy-loaded via `React.lazy` + `Suspense` in App.jsx
- **Comprehensive design token system**: 80+ CSS custom properties covering colors, spacing, typography, radius, shadows, z-index, transitions — well-organized with comments
- **Dark mode infrastructure**: 438-line dedicated `dark.css` with thoughtful overrides for shell, cards, KPIs, student dashboard, modals
- **Motion accessibility**: `prefers-reduced-motion: reduce` disables all non-essential animations globally (in `tokens.css`)
- **Skip navigation**: Proper skip-nav link with focus-visible state
- **Global focus indicators**: `*:focus-visible` with clear 2px accent outline on all elements
- **Button sizing**: All `.btn` variants enforce `min-height: 44px` — exceeds WCAG touch target requirements
- **No bounce/spring animations**: Motion library used without trendy physics effects
- **Intentional typography**: Outfit + Sora is a deliberate, professional choice — a _product_ register font pairing, not a _brand_ display
- **Card style variants**: `[data-cards]` attribute allows flat/bordered/shadowed modes — flexible design system
- **Semantic z-index scale**: `--z-dropdown: 100`, `--z-modal: 500`, `--z-tooltip: 700` — no arbitrary 999 values
- **Modal keyboard handling**: Focus trapping, Escape dismissal, return focus on close — well-implemented
- **Product register alignment**: Product UI is restrained, uses one family (Outfit) for body, system fonts feel familiar — matches `reference/product.md` guidance
- **No side-tab borders**: Design system intentionally bans them and the code follows through ✓
- **No gradient text**: `background-clip: text` pattern not found ✓
- **No glassmorphism as default**: backdrop-blur used only on `.shell-topbar` and is minimal ✓
- **No hero metrics**: KPIs on teacher dashboard are functional, not decorative ✓
- **No numbered section markers**: No 01/02/03 scaffolding pattern found ✓
- **Cards are not the default layout**: Card usage is appropriate, not a lazy default ✓
- **Button labels are action-oriented**: "Review submission", "Run diagnosis", "Schedule a class" ✓

---

## Recommended Actions

1. **[P0] `/impeccable harden`**: Fix `dangerouslySetInnerHTML` in `topic-explanations.jsx` — replace with safe React element parsing or add DOMPurify
2. **[P0] `/impeccable harden`**: Remove client-side API key storage from `settings.jsx` — backend-only keys
3. **[P0] `/impeccable harden`**: Add `outline` back alongside `box-shadow` on `.btn:focus-visible` in `components.css`
4. **[P0] `/impeccable harden`**: Fix empty catch blocks — at minimum log to console
5. **[P1] `/impeccable harden`**: Replace `<div role="heading" aria-level="2">` with `<h2>` in `SectionHeader.jsx`
6. **[P1] `/impeccable distill`**: Extract shared TEAL/NAVY constants, gradient, and option styles into `shared.js` module
7. **[P1] `/impeccable colorize`**: Replace 34+ hardcoded hex values in JSX with CSS custom properties
8. **[P1] `/impeccable optimize`**: Add `loading="lazy"` to all `<img>` tags across exercise components
9. **[P1] `/impeccable harden`**: Convert `Promise.all` to `Promise.allSettled` in `teacher-dashboard.jsx`
10. **[P1] `/impeccable optimize`**: Fix `transition: all` → specific properties in CSS
11. **[P2] `/impeccable harden`**: Add `htmlFor`/`id` associations to all ~30 unlabeled form inputs
12. **[P2] `/impeccable adapt`**: Add intermediate breakpoint at ~600px, fix modal max-width, fix login grid
13. **[P2] `/impeccable adapt`**: Add `min-height: 44px` to exercise option buttons
14. **[P2] `/impeccable distill`**: Extract repeated gradient to shared CSS class
15. **[P2] `/impeccable harden`**: Add per-page ErrorBoundary in `renderTeacherPage()`
16. **[P2] `/impeccable polish`**: Named constants for magic numbers, remove unused imports, fix `window.toast`
17. **[P3] `/impeccable polish`**: Final pass — safe-area-inset, `aria-describedby` on modal, emoji → icon, `stopPropagation` clean-up

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `/impeccable audit` after fixes to see your score improve.

---

## Verification

After implementing fixes:
1. Run `npm run build` — confirm no build errors
2. Run `npm run lint` — check for regressions
3. Toggle `[data-theme="dark"]` — verify no hardcoded colors
4. Tab through all interactive elements — verify focus indicators
5. Test on 375px viewport — verify touch targets, no overflow
6. Check High Contrast Mode — verify focus outlines visible
7. Re-run this audit to measure score improvement
