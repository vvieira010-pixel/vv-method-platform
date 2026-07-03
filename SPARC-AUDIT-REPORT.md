# SPARC Gate-Based Full Audit Report — MET Platform

**Project**: MET Proficiency Mastery  
**Date**: 2026-07-03  
**Audit type**: Full SPARC gate-based cycle (5 dimensions)  
**Status**: Phase 5 — Completion

---

## Executive Summary

| Dimension | Score (1-10) | Critical | High | Medium | Low | Total |
|-----------|:---:|:--------:|:----:|:-----:|:---:|:-----:|
| Security | **3** | 5 | 10 | 8 | 3 | 26 |
| Performance | **4** | 3 | 9 | 7 | 4 | 23 |
| Code Quality | **5** | 3 | 8 | 12 | 10 | 33 |
| Architecture | **4** | 3 | 4 | 5 | 3 | 15 |
| CSS/Design System | **4** | 4 | 8 | 6 | 5 | 23 |
| **Composite** | **4.0** | **18** | **39** | **38** | **25** | **120** |

**Health assessment**: POOR — 18 critical + 39 high findings require immediate attention before further feature development.

---

## P0 — Critical Findings (Must fix before next deploy)

### Security

| # | Finding | File | Line |
|---|---------|------|------|
| S1 | **Live OpenAI API key in committed `.env`** | `.env` | 7 |
| S2 | **Live ElevenLabs API key in committed `.env`** | `.env` | 11 |
| S3 | **API provider keys stored in plaintext localStorage** — Groq, Gemini, OpenAI, Anthropic, OpenRouter, ElevenLabs, Deepgram | `settings.jsx` | 45-51, 147-160 |
| S4 | **API keys read from localStorage and used client-side** — exposed in browser network tab | `Listening.jsx` | 27-31 |
| S5 | **`document.write` XSS vector** in print window | `print-homework.js` | 114 |

### Performance

| # | Finding | File | Line |
|---|---------|------|------|
| P1 | **23 MB unoptimized media** bypassing Vite build | `dist-build/` root | — |
| P2 | **Static recharts import (442 KB)** on student home initial load | `student-home.jsx` | 7 |
| P3 | **No debouncing/throttling** anywhere in the app | entire codebase | — |

### Code Quality

| # | Finding | File | Line |
|---|---------|------|------|
| Q1 | **3 React Compiler errors** — stale `useCallback` deps in `PracticeSession.jsx` | `PracticeSession.jsx` | 110 |
| Q2 | **`es-toolkit` is dead weight** — listed as dependency but never imported | `package.json` | — |
| Q3 | **Missing ESLint devDependencies in package.json** — `eslint`, `@eslint/js`, plugins | `package.json` | — |

### Architecture

| # | Finding | File | Line |
|---|---------|------|------|
| A1 | **No conflict resolution in dual-storage** — last-write-wins with stale localStorage | `workflow-core.js` | 82-121 |
| A2 | **syncLocalToCloud is one-way push only** — never pulls cloud → local | `workflow-roster.js` | 457-489 |
| A3 | **No React Context** — severe prop drilling of `students`, `navigate` to all pages | `App.jsx` | 347 |

### CSS/Design System

| # | Finding | File | Line |
|---|---------|------|------|
| C1 | **Undefined token references** — `--shadow-toast`, `--shadow-modal`, `--faint` | multiple | — |
| C2 | **`.progress-fill` defined twice** — second overrides first | `components.css` | 301, 1248 |
| C3 | **`.student-home-columns` defined twice with different values** | `components.css` | 2306, 2500 |
| C4 | **Monolithic `components.css` (164 KB / 6,139 lines)** | `components.css` | — |

---

## P1 — High Findings (This sprint)

### Security (10)
- S6: Supabase session tokens (`vv:supabase_session`) in plaintext localStorage
- S7: No Content Security Policy header in `vercel.json`
- S8: `api/tts.js` has no authentication — anyone can abuse ElevenLabs/OpenAI keys
- S9: `api/generate-image.js` has no authentication
- S10: `api/ai.js` allows all origins when `APP_ORIGIN` env var unset
- S11: Hardcoded teacher email fallback in `App.jsx:81`
- S12: Permissive storage bucket SELECT policies (`storage.objects`)
- S13: `exercise-images` bucket allows authenticated user INSERT/UPDATE/DELETE
- S14: `submission-audio` bucket has no RLS — path isolation only
- S15: `.env` has weak hardcoded teacher PIN (`1234`)

### Performance (9)
- P4: `homework-create.jsx` chunk 310 KB — imports from 12 library modules
- P5: Monolithic CSS (160 KB) — single file, no code splitting
- P6: No `React.memo` on any component — 50+ components re-render on parent change
- P7: ~1,520 inline `style={{}}` objects create new references on every render
- P8: Inline arrow function `onClick` handlers throughout
- P9: Empty `useEffect` dependency arrays in 6 places
- P10: Barrel imports via `shared.jsx` pull entire dependency graph
- P11: No image width/height attributes — Cumulative Layout Shift
- P12: Missing Vite build optimizations (no `cssCodeSplit`, no gzip, no `sourcemap: false`)

### Code Quality (8)
- Q4: 0 behavioral tests for 23/25 page components
- Q5: No test coverage tool configured
- Q6: 25 silent `catch { /* ignore */ }` blocks
- Q7: 15 fire-and-forget `.catch(() => {})` promises
- Q8: 5 dead functions in `homework-create.jsx` (lines 548-690)
- Q9: 7 `console.log` in production code (`Listening.jsx`)
- Q10: Monolithic CSS (5,554 lines in `components.css`)
- Q11: camelCase page filenames inconsistent with PascalCase UI components

### Architecture (4)
- A4: Circular dependency between `workflow-academic.js` and `workflow-roster.js`
- A5: Several entity types never sync to Supabase (sessions, feedback, corrections, drafts)
- A6: `saveVia` writes to Supabase only — does not update localStorage on success
- A7: Pages bypass workflow facade to call `supabase-db.js` directly

### CSS/Design System (8)
- C5: ~70 hardcoded hex colors outside design tokens
- C6: ~586 hardcoded px values should use `--space-*` tokens
- C7: ~1,520 inline styles in JSX defeating the design system
- C8: ~10 hardcoded border-radius values
- C9: ~34 transitions on layout-triggering properties (background, border, box-shadow)
- C10: `--shadow-toast` referenced but not defined — renders as `initial`
- C11: Redundant `student-*` utility classes duplicating base.css
- C12: 27 `!important` declarations (6 in base.css likely unnecessary)

---

## P2 — Medium Findings (Backlog)

38 medium-severity findings across all dimensions — see individual audit reports for details.
Key themes: missing loading states, no Context API, unused variable warnings, missing useEffect deps, 
`uid()` defined in 3 places, exercise-library.js reimplements Supabase adapter, no CSP headers,
callAI imported from 3 different paths, view state not in URL, animation on box-shadow/backdrop-filter,
3 touch targets below 44px, dark mode vars split across files.

---

## Remediation Roadmap

### Week 1: Security triage (P0 criticals)
1. Rotate compromised OpenAI + ElevenLabs API keys (compromised in committed `.env`)
2. Remove `.env` from git tracking — add to `.gitignore` immediately
3. Remove API key storage from localStorage — route through server-side proxy only
4. Add authentication to `api/tts.js` and `api/generate-image.js`
5. Add CSP headers to `vercel.json`

### Week 2: Performance quick wins
6. Convert `student-home.jsx` recharts import to dynamic (saves 442 KB)
7. Run 23 MB of PNGs through `sharp` → WebP, add width/height
8. Set `cssCodeSplit: true`, `sourcemap: false` in vite.config.js
9. Add `React.memo` to Button, Card, Pill, Avatar, SkeletonCard

### Week 3: Code quality
10. Install missing ESLint plugins — fix 90 unused var warnings
11. Fix 3 React Compiler errors in PracticeSession.jsx
12. Remove `es-toolkit` (dead dep) and 5 dead functions in homework-create.jsx
13. Replace 7 `console.log` with `console.warn` in Listening.jsx

### Week 4: Architecture debt
14. Break circular dependency between workflow-academic.js ↔ workflow-roster.js
15. Implement bidirectional sync (cloud → local pull in syncLocalToCloud)
16. SaveVia should write to both Supabase AND localStorage
17. Add React Context for `students` and `navigate` to eliminate prop drilling

### Week 5-6: Design system
18. Define missing tokens (`--shadow-toast`, `--shadow-modal`, `--faint`)
19. Resolve duplicate `.progress-fill` and `.student-home-columns` definitions
20. Migrate top inline-style offenders (~1,520 instances) to CSS classes
21. Split `components.css` into domain-specific files
22. Consolidate hardcoded hex/px/radius to token references

---

## Gate Check Results

| Phase | Status | Gate Result |
|-------|--------|-------------|
| 1 — Specification | ✅ PASS | 5 ACs defined (Security, Performance, Code Quality, Architecture, CSS) |
| 2 — Pseudocode | ✅ PASS | Collection strategy documented per AC |
| 3 — Architecture | ✅ PASS | Report structure, tool chain, and data flow designed |
| 4 — Refinement | ✅ PASS | 120 findings collected across all 5 dimensions |
| 5 — Completion | ✅ PASS | Full report compiled, traceability verified, remediation prioritized |

---

## Traceability Matrix

| AC | Dimension | Findings | Coverage |
|----|-----------|----------|----------|
| AC1 | Security | 26 (5C, 10H, 8M, 3L) | ✅ Full |
| AC2 | Performance | 23 (3C, 9H, 7M, 4L) | ✅ Full |
| AC3 | Code Quality | 33 (3C, 8H, 12M, 10L) | ✅ Full |
| AC4 | Architecture | 15 (3C, 4H, 5M, 3L) | ✅ Full |
| AC5 | CSS/Design System | 23 (4C, 8H, 6M, 5L) | ✅ Full |
| **Total** | | **120** | **100%** |

---

## Files Referenced

Full details per finding in the individual audit reports generated during Phase 4:

- Security: `src/lib/supabase-storage.js`, `settings.jsx`, `Listening.jsx`, `.env`, `api/*.js`, `vercel.json`, 14 migration files
- Performance: `vite.config.js`, `student-home.jsx`, `homework-create.jsx`, `shared.jsx`, `App.jsx`, 23 MB of static media
- Code Quality: 131 files linted (126 issues), 5 test files, `package.json`, `eslint.config.js`
- Architecture: `workflow-core.js`, `workflow-academic.js`, `workflow-roster.js`, `workflow-seeds.js`, `workflow.js`, `App.jsx`, `supabase-db.js`
- CSS: `tokens.css` (140 lines), `components.css` (6,139 lines), `base.css`, `responsive.css`, `dark.css`
