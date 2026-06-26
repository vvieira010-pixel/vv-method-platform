# Technical Audit — VV Method Platform

## Context

The VV Method Platform is a React 19 + Vite 6 education platform for MET (Michigan English Test) preparation. It serves a solo teacher and their student roster with dashboards, diagnostics, exercises, homework, and progress tracking. The product targets **WCAG AAA** compliance and aims for a "calm, focused, expert" brand personality — explicitly anti-flashy, anti-generic-SaaS.

This audit was requested to systematically evaluate technical quality across 5 dimensions, document issues without fixing them, and prioritize next steps.

---

## Anti-Patterns Verdict

**PASS — with notes.** This does *not* look AI-generated. The design is intentional and distinctive: navy/teal/amber palette with DM Sans + Sora fonts, no bounce animations, no glassmorphism, no hero metrics, no mascots. The brand personality reads as a professional teaching tool, not a generic SaaS dashboard.

**One notable tell:** The `linear-gradient(120deg, TEAL 0%, NAVY 100%)` pattern is used identically in **10+ exercise files** (~25 instances). While it uses CSS tokens (not raw hex), the repetition and teal-to-navy direction are a moderate AI palette signature. The gradient also appears in progress bars, dark headers on reports/error-bank, and student dashboard elements. This is the project's weakest design signal — it feels like a default rather than a deliberate choice.

The backdrop-blur on `.shell-topbar` is minimal and functional (not glassmorphism). The `translateY(-1px)` hover pattern is overused (9+ instances) but not an AI tell per se — more of an over-applied micro-animation.

---

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | **2** | Missing keyboard support, form labels, and ARIA across exercises |
| 2 | Performance | **3** | Good lazy loading; missing useMemo and image optimization |
| 3 | Theming | **2** | Strong token system but 145 hard-coded hex values in JSX + dark-mode gaps |
| 4 | Responsive Design | **2** | Mobile nav exists but fixed widths, missing breakpoints, touch target gaps |
| 5 | Anti-Patterns | **3** | Distinctive design; teal-navy gradient overused across exercises |
| **Total** | | **12/20** | **Acceptable (significant work needed)** |

---

## Executive Summary

- **Audit Health Score: 12/20** (Acceptable — significant work needed)
- **Total issues: 28** — P0: 2, P1: 6, P2: 12, P3: 8
- **Top 5 critical issues:**
  1. **P0** API keys stored unencrypted in localStorage — direct XSS leak vector
  2. **P0** `dangerouslySetInnerHTML` without sanitization — XSS vulnerability
  3. **P1** Flashcard div with onClick but no keyboard/ARIA support
  4. **P1** Form inputs across exercises missing `<label>` associations
  5. **P1** 145 hard-coded hex colors in JSX files, several breaking dark mode
- **Recommended next steps:** Fix P0 security issues immediately, then address P1 accessibility and theming gaps before release.

---

## Detailed Findings by Severity

### P0 — Blocking (fix immediately)

**[P0] API keys stored unencrypted in localStorage**
- **Location:** `src/pages/settings.jsx:43-60, 145-163`
- **Category:** Security
- **Impact:** Teachers input LLM API keys (Groq, Gemini, Anthropic, OpenAI, etc.) stored via `localStorage.setItem('vv:groq_api_key', ...)`. Vulnerable to XSS, DevTools inspection, and browser extension access. Any XSS vulnerability (see next P0) becomes a key-theft attack.
- **Recommendation:** Move to a backend API proxy pattern. If client-side storage is unavoidable, use sessionStorage with encryption at minimum.
- **Suggested command:** `/impeccable harden`

**[P0] dangerouslySetInnerHTML without sanitization**
- **Location:** `src/components/topic-explanations.jsx:56, 59, 64`
- **Category:** Security
- **Impact:** HTML content from teacher input rendered with `dangerouslySetInnerHTML={{ __html: b.text }}` without DOMPurify or equivalent sanitization. Combined with localStorage API keys, this is a high-severity XSS chain.
- **Recommendation:** Add DOMPurify sanitization before any dangerouslySetInnerHTML usage.
- **Suggested command:** `/impeccable harden`

---

### P1 — Major (fix before release)

**[P1] Flashcard div onClick without keyboard support**
- **Location:** `src/components/exercise-player.jsx:925`
- **Category:** Accessibility
- **Impact:** `<div onClick={() => setFlipped(f => !f)}>` — keyboard users and screen readers cannot flip flashcards. Violates WCAG 2.1 Level A (2.1.1 Keyboard).
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Recommendation:** Use `<button>` or add `role="button"`, `tabIndex={0}`, `onKeyDown` handler.
- **Suggested command:** `/impeccable harden`

**[P1] Form inputs missing associated labels**
- **Location:** `src/components/message-center.jsx:~135`, `src/components/exercises/ShortAnswer.jsx` (checkboxes), `src/pages/homework-create.jsx`, `src/pages/diagnostic-create.jsx`
- **Category:** Accessibility
- **Impact:** Textareas, checkboxes, and select elements without `<label>` associations. Screen readers can't identify input purpose.
- **WCAG:** 3.3.2 Labels or Instructions (Level A)
- **Recommendation:** Add explicit `<label htmlFor>` or `aria-label` to all form controls.
- **Suggested command:** `/impeccable harden`

**[P1] Icon-only buttons without aria-labels**
- **Location:** `src/components/exercises/ExerciseCard.jsx:~88-96`, various exercise components
- **Category:** Accessibility
- **Impact:** Buttons containing only SVG icons (check, delete, etc.) lack `aria-label`. Screen readers announce "button" with no context.
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Recommendation:** Add `aria-label` describing the action.
- **Suggested command:** `/impeccable harden`

**[P1] SectionHeader uses div instead of semantic heading**
- **Location:** `src/components/ui/SectionHeader.jsx:4`
- **Category:** Accessibility
- **Impact:** `<div role="heading" aria-level="2">` instead of `<h2>`. Breaks semantic heading navigation for screen reader users.
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Recommendation:** Replace with `<h2>` element (keep styling via className).
- **Suggested command:** `/impeccable harden`

**[P1] Hard-coded hex colors breaking dark mode**
- **Location:** `src/styles/system.css:1682-1741` (student dashboard topbar gradient), `src/styles/system.css:2450` (student cards), `src/pages/reports.jsx:355,378,392`, `src/pages/error-bank.jsx:171`, `src/pages/login.jsx:28,108`
- **Category:** Theming
- **Impact:** Hard-coded gradients like `linear-gradient(180deg, #0f1b2d, #172437)` don't respond to dark mode token changes. Student dashboard header and card backgrounds remain hard-coded in both themes.
- **Recommendation:** Replace hex values with CSS custom properties. Create gradient tokens where needed.
- **Suggested command:** `/impeccable colorize`

**[P1] 145 hard-coded hex colors across JSX files**
- **Location:** 30 JSX files (highest: `src/components/exercises/ShortAnswer.jsx:15`, `src/components/exercise-player-new-types.jsx:16`, `src/pages/login.jsx:12`, `src/pages/reports.jsx:10`)
- **Category:** Theming
- **Impact:** Hard-coded colors bypass the design token system, making theme changes fragile and dark mode incomplete.
- **Recommendation:** Audit and replace with CSS custom property references. Two specific files use `#0B1F3A` instead of `var(--primary-ink)`: `src/components/exercises/LevelUp.jsx:4` and `src/components/exercises/Reading.jsx:4`.
- **Suggested command:** `/impeccable colorize`

---

### P2 — Minor (fix in next pass)

**[P2] Missing useMemo on expensive dashboard calculations**
- **Location:** `src/pages/teacher-dashboard.jsx:73-97`
- **Category:** Performance
- **Impact:** `studentsWithCycle` array and `stageCounts` object recomputed every render.
- **Suggested command:** `/impeccable optimize`

**[P2] Inline style objects recreated every render**
- **Location:** `src/pages/calendar.jsx` (34 inline styles), `src/pages/student-home.jsx` (31 inline styles), `src/pages/student-dashboard.jsx:99`
- **Category:** Performance
- **Impact:** New object allocations per render; prevents React bailout optimizations.
- **Suggested command:** `/impeccable optimize`

**[P2] Width transitions instead of transform**
- **Location:** `src/styles/system.css:514` (`transition: width var(--transition-base)`)
- **Category:** Performance
- **Impact:** Animating `width` forces layout recalculation. Should use `transform: scaleX()`.
- **Suggested command:** `/impeccable optimize`

**[P2] Modal max-width not responsive**
- **Location:** `src/components/ui/Modal.jsx:51`
- **Category:** Responsive Design
- **Impact:** `maxWidth=680` (fixed prop) can exceed mobile viewport width.
- **Recommendation:** Add `max-width: calc(100vw - 2rem)` in CSS.
- **Suggested command:** `/impeccable adapt`

**[P2] Exercise touch targets potentially < 44px**
- **Location:** `src/components/exercises/MultipleChoice.jsx:73-86`
- **Category:** Responsive Design
- **Impact:** Option buttons use `padding: '12px 16px'` with no `min-height` — may be < 44px.
- **Suggested command:** `/impeccable adapt`

**[P2] Missing breakpoints between 420px and 768px**
- **Location:** `src/styles/system.css` (breakpoints at 390, 420, 768, 860, 1024px)
- **Category:** Responsive Design
- **Impact:** Gap in coverage for large phones / small tablets (421-767px).
- **Suggested command:** `/impeccable adapt`

**[P2] Teal-navy gradient duplicated across 10+ exercise files**
- **Location:** All `src/components/exercises/*.jsx` files
- **Category:** Anti-Pattern / DRY
- **Impact:** `linear-gradient(120deg, ${TEAL} 0%, ${NAVY} 100%)` copy-pasted identically ~25 times. TEAL/NAVY constants also duplicated per file.
- **Recommendation:** Extract to a shared CSS class (`.gradient-action` or similar).
- **Suggested command:** `/impeccable distill`

**[P2] Excessive translateY hover animations**
- **Location:** `src/styles/system.css` — 9+ `.btn:hover`, `.card:hover`, `.student-practice-primary:hover`, etc.
- **Category:** Anti-Pattern
- **Impact:** Excessive micro-motion on every interactive element. While `prefers-reduced-motion` disables these, the default is overactive for a "calm, focused" brand.
- **Suggested command:** `/impeccable quieter`

**[P2] Hardcoded teacher email fallback**
- **Location:** `src/App.jsx:81`
- **Category:** Security / Code Quality
- **Impact:** `(rawTeacherEmail || 'vvieira010x@gmail.com')` — personal email exposed in codebase, silent fallback masks missing config.
- **Suggested command:** `/impeccable harden`

**[P2] Missing image lazy loading**
- **Location:** Across exercise components (`src/components/exercises/Reading.jsx:64-66`, etc.)
- **Category:** Performance
- **Impact:** No `loading="lazy"` on `<img>` tags.
- **Suggested command:** `/impeccable optimize`

**[P2] Promise.all without error handling in App.jsx**
- **Location:** `src/App.jsx:40-50`
- **Category:** Performance / Code Quality
- **Impact:** If any data-fetching promise rejects, entire page load fails silently.
- **Suggested command:** `/impeccable harden`

**[P2] Login page fixed grid layout**
- **Location:** `src/pages/login.jsx:220-230`
- **Category:** Responsive Design
- **Impact:** `grid-template-columns: 420px 1fr` with no tablet intermediate — awkward at ~768-1024px.
- **Suggested command:** `/impeccable adapt`

---

### P3 — Polish (fix if time permits)

**[P3] No safe-area-inset on topbar/skip-nav** — `src/styles/system.css` (only message dock uses `env(safe-area-inset-right)`)
**[P3] Avatar uses div role="img" instead of img element** — `src/components/ui/Avatar.jsx:24`
**[P3] Modal missing aria-describedby for subtitle** — `src/components/ui/Modal.jsx:49`
**[P3] Magic timeout numbers** — `src/App.jsx:426` (3200ms), `src/pages/settings.jsx:162` (2000ms)
**[P3] OrderSentences move buttons lack position context** — `src/components/exercises/OrderSentences.jsx:121-140` (`aria-label="Move up"` without item context)
**[P3] Confusing token naming** — `src/styles/system.css:27` (`--accent-deep` is same as `--primary`)
**[P3] No className utility (clsx/classnames)** — String concatenation for dynamic classes throughout
**[P3] Missing input validation on API key format** — `src/pages/settings.jsx:144-163`

---

## Patterns & Systemic Issues

1. **Hard-coded colors are pervasive.** 145 hex values across 30 JSX files — the design token system exists but is routinely bypassed via inline styles. This is the single biggest barrier to reliable dark mode and theming.

2. **Exercise components share identical patterns but no shared module.** TEAL/NAVY constants, gradient backgrounds, check/submit button styling, and feedback patterns are copy-pasted across 10 exercise files. A shared exercise CSS class or utility would eliminate ~100 lines of duplication.

3. **Accessibility is foundational but incomplete.** The system.css has excellent foundations (focus-visible, skip-nav, reduced-motion, 44px buttons), but individual components don't follow through — missing labels, non-semantic headings, keyboard-inaccessible interactions.

4. **Inline styles compete with the design system.** Calendar, student-home, and student-dashboard each have 30+ inline style blocks, undermining the CSS custom property system and creating maintenance burden.

---

## Positive Findings

- **Excellent code splitting**: All 17 pages lazy-loaded via `React.lazy` + `Suspense` in `App.jsx`
- **Comprehensive design token system**: 80+ CSS custom properties covering colors, spacing, typography, radius, shadows, z-index, transitions
- **Dark mode infrastructure**: ~200 lines of `[data-theme="dark"]` overrides with thoughtful color choices
- **Motion accessibility**: `prefers-reduced-motion: reduce` disables all non-essential animations globally
- **Skip navigation**: Proper skip-nav link for keyboard users
- **Focus indicators**: Global `*:focus-visible` with clear 2px accent outline
- **Button sizing**: All `.btn` variants enforce `min-height: 44px`
- **No bounce/spring animations**: Motion library used without trendy physics effects
- **Intentional typography**: DM Sans + Sora is a distinctive, deliberate choice — not generic Inter
- **Card style variants**: `[data-cards]` attribute allows flat/bordered/shadowed modes
- **Professional brand**: The "calm, focused, expert" personality comes through clearly

---

## Recommended Actions

1. **[P0] `/impeccable harden`**: Fix security issues — sanitize dangerouslySetInnerHTML, migrate API keys from localStorage, add keyboard support to interactive divs, associate labels with form inputs, fix hardcoded email fallback
2. **[P1] `/impeccable colorize`**: Replace 145 hard-coded hex values with CSS custom properties. Fix the 2 exercise files using `#0B1F3A` instead of `var(--primary-ink)`. Create gradient tokens for recurring patterns
3. **[P1] `/impeccable adapt`**: Fix responsive gaps — modal max-width, exercise touch targets, missing breakpoints, login grid layout
4. **[P2] `/impeccable distill`**: Extract duplicated TEAL/NAVY constants and gradient patterns from 10 exercise files into shared CSS classes
5. **[P2] `/impeccable optimize`**: Add useMemo to dashboard calculations, add `loading="lazy"` to images, convert width transitions to transform
6. **[P2] `/impeccable quieter`**: Reduce excessive translateY hover animations to match "calm, focused" brand personality
7. **[P3] `/impeccable polish`**: Final pass — safe-area-inset, semantic Avatar, modal describedby, clsx utility

> You can ask me to run these one at a time, all at once, or in any order you prefer.
>
> Re-run `/impeccable audit` after fixes to see your score improve.

---

## Verification

After implementing fixes:
1. Run `npm run build` — confirm no build errors
2. Run `npm run lint` — check for lint regressions
3. Toggle dark mode via `[data-theme="dark"]` — verify no hard-coded colors remain visible
4. Tab through all interactive elements — verify keyboard access and focus indicators
5. Test exercise components on 375px viewport — verify touch targets and no horizontal scroll
6. Check browser DevTools console for React warnings (missing keys, etc.)
7. Re-run this audit to measure score improvement
