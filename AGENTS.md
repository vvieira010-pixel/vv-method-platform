# MET Proficiency Mastery — Agent Instructions

MET test prep platform (SPA) for nurses/healthcare professionals. Primary user is a solo teacher managing a student roster. AI-powered diagnosis → homework → feedback cycle.

---

## Tech Stack

- **React 19** + **Vite 6** + `@vitejs/plugin-react` — plain JSX (no TypeScript)
- **CSS**: hand-written files in `src/styles/` (no CSS framework, no modules)
- **Vite proxy**: `/api` → `localhost:3000` (dev only)
- **Supabase**: auth + database (project `grnzzgzqizoxfcbflnwq`)
- **Vercel**: SPA hosting + serverless functions in `api/`
- **Testing**: Node native (`node --test`) — no Jest/Vitest

### Dependencies
- `motion` (animation), `recharts` (charts), `es-toolkit` (utilities)

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | Build to `dist-build/` |
| `npm run preview` | Vite preview of build |
| `npm run lint` | ESLint on `src/` |
| `npm run lint:fix` | ESLint auto-fix |
| `npm test` | `node --test "tests/**/*.test.js"` |

**Node version**: 22+ (needed for native test glob patterns).

---

## Architecture

### Entrypoint
`src/main.jsx` → `src/App.jsx` — no React Router. SPA navigation uses a `view` state variable with `navigate(target, params)`. Page routes are in `renderTeacherPage()` at `App.jsx:314`.

### Pages
All in `src/pages/` — lazy-loaded via `React.lazy`. Teacher shell at `App.jsx:266` with tabs: Today, Students, Calendar, Diagnostics, Homework, Submissions, Inbox, Error Bank, Reports, Exercises.

### Key Source Structure
```
src/
  lib/           — Core logic (workflow, AI, supabase, spaced-repetition)
  pages/         — 22 page components
  components/    — Shared UI components
  domain/        — assessment/ (diagnosis), seeds/
  education-skills/ — AI skill augmentation subsystem
  data/          — Static data (students, vocab banks, exercises)
  styles/        — system.css, design-system.css
  tools/         — Tool pages (inbox, homework, perspective-designer)
```

### Dual Storage
All domain data (sessions, diagnoses, homework, etc.) lives in **both** localStorage (`vv:*` keys) **and** Supabase (`workflow-core.js:2-3`). Sync happens via `syncLocalToCloud` in `workflow-roster.js`.

### Workflow Facade
`src/lib/workflow.js` is a **re-export facade** — it imports from three split files:
- `workflow-core.js` — localStorage helpers, K constants
- `workflow-academic.js` — sessions, diagnoses, feedback, homework, submissions
- `workflow-roster.js` — students, classes, inbox, error bank, progress

Import from `lib/workflow.js` in consuming code (27+ consumers); don't bypass the facade.

### AI Calls
Browser POSTs to `/api/ai` (Vercel serverless proxy at `api/ai.js`) — API keys stay server-side. Client cascade in `src/lib/callAI.js`. Accepts optional `skills` array to append pedagogical augmentations to the system prompt.

Education skills are injected via `withSkills(taskType, options)` from `src/education-skills/active-skills.js`. Task types: `diagnosis`, `feedback`, `homework`, `exercise`, `progress`. Toggles stored in localStorage `vv:skills_enabled`.

### Supabase
- **URL + anon key are HARDWIRED** in `src/lib/supabase-storage.js:12-13` — NOT from env vars (deliberate fix for earlier env-var failures)
- Supabase JS client library is NOT used; all REST calls via `fetch()`
- Auth flows: PKCE (`?code=`) and legacy implicit (`#access_token=`) — handled in `App.jsx:57-163`
- Row Level Security is the auth protection (anon key is safe to expose)
- Migrations in `supabase/migrations/`, edge functions in `supabase/functions/`

### Spaced Repetition
Engine in `src/lib/spaced-repetition.js`. Review intervals: [1, 3, 7, 14, 30] days. Synced to Supabase via `enableSync()` in `App.jsx:169`. Student schedules stored in localStorage key `vv:reviewSchedule:{studentId}`.

### Teacher Gate
Only the email(s) in `VITE_TEACHER_EMAIL` env var resolve to a teacher role at sign-in. Everyone else is a roster student or rejected. Fallback hardcoded in `App.jsx:80`.

### Education Skills Integration
Skills are parsed from SKILL.md files at import time (Vite `?raw`) and injected into AI calls. Architecture:

| File | Role |
|---|---|
| `src/education-skills/parser.js` | Parse YAML + prompt from SKILL.md |
| `src/education-skills/registry.js` | Import 16 curated SKILL.md files |
| `src/education-skills/selectors.js` | Map task types → skill sets |
| `src/education-skills/active-skills.js` | `withSkills()` — reads toggles from localStorage |
| `src/education-skills/index.js` | Barrel export |

Wired flows: `diagnosis-utils.js` (diagnosis), `diagnostic-create.jsx` (diagnosis + feedback + homework), `homework-create.jsx` (exercise + homework), `submission-review.jsx` (feedback).

---

## Testing

Run all: `npm test`. Tests use Node native `assert` — no assertion library.

5 test files in `tests/`:
- **Source-code static checks**: `student-dashboard-copy.test.js`, `homework-create-icons.test.js`, `submission-review-transcripts.test.js` — grep for prohibited phrases, verify icon imports, check structural patterns
- **Unit tests**: `spaced-repetition.test.js`, `report-metrics.test.js`

Add new `.test.js` files under `tests/` — they're auto-discovered by the glob.

**CI** (`.github/workflows/ci.yml`): runs `npm test` on push/PR to `master`. Lint is NOT enforced in CI (eslint plugins aren't installed and codebase isn't lint-clean yet — flagged as follow-up F1).

---

## Deployment

- **Vercel**: SPA with rewrite-all-to-index.html (`vercel.json:5`)
- Build output: `dist-build/`, install: `npm ci`
- Serverless AI proxy at `/api/ai` — set API keys in Vercel dashboard (no `VITE_` prefix)
- Environment: keys are server-only env vars (GEMINI_API_KEY, GROQ_API_KEY, etc.)
- Supabase migrations apply via CLI: `supabase db push`
- `VITE_TEACHER_EMAIL` controls teacher access

---

## Conventions

- localStorage keys use `vv:` prefix (`vv:supabase_session`, `vv:skills_enabled`, `vv:reviewSchedule:*`)
- API keys in Vercel dashboard use bare names (`GEMINI_API_KEY`) — NOT `VITE_` prefixed (would inline into client bundle)
- Build dir: `dist-build/`, Vite cache: `.vite-cache-v2/`
- AI model cascade order: OpenRouter (free) → Gemini → Groq → OpenAI → Anthropic (`api/ai.js:189`)
- Stale dirs (`.vercelignore`): `_non-platform/`, `archive/`, `education-agent-skills-main/`, `met-platform-2.0-repo/`, `product-audit/`, `graphify-out/` — not part of the app
- `graphify-out/` exists but the knowledge graph has not been built yet (empty cache/)
- Brand colors: navy main, teal accent, mint/white/gray support. See `DESIGN_SYSTEM_UPDATE.md` for full design tokens (OKLch system)
