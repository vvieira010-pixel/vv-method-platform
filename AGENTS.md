# MET Proficiency Mastery — Agent Instructions

MET test prep platform (SPA) for nurses/healthcare professionals. Primary user is a solo teacher managing a student roster. AI-powered diagnosis → homework → feedback cycle.

---

## Tech Stack

- **React 19** + **Vite 6** + `@vitejs/plugin-react` — plain JSX (no TypeScript)
- **CSS**: `src/styles/system.css` only (no CSS framework, no modules)
- **Vite proxy**: `/api` → `localhost:3000` (dev only)
- **Supabase**: auth + database (project `grnzzgzqizoxfcbflnwq`)
- **Vercel**: SPA hosting + 4 serverless functions in `api/` (`ai.js`, `tts.js`, `send-invite.js`, `generate-image.js`)
- **Testing**: Node native (`node --test`) — no Jest/Vitest
- **Dependencies**: `motion` (anim), `recharts` (charts), `es-toolkit` (utils)

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
**Install**: `npm ci` in CI/Vercel (`.npmrc` strips platform-specific store dirs for Linux builds).

---

## Architecture

### Entrypoint
`src/main.jsx` → `src/App.jsx` — no React Router. SPA navigation uses a `view` state variable with `navigate(target, params)`. Page routes in `renderTeacherPage()` at `App.jsx:324`. Sub-views use colon syntax: `students:profile`, `diagnostics:create`, `homework:create`, `submissions:review`, `calendar:class`.

### Key Source Structure
```
src/
  lib/           — Core logic (workflow, AI, supabase, spaced-repetition)
  pages/         — 22 page components
  components/    — Shared UI components
  domain/        — assessment/ (diagnosis), seeds/
  education-skills/ — AI skill augmentation subsystem
  data/          — Static data (students, vocab banks, exercises)
  styles/        — system.css
  tools/         — Tool pages (inbox, homework, perspective-designer)
```

### Dual Storage
All domain data lives in **both** localStorage (`vv:*` keys) **and** Supabase. Sync via `syncLocalToCloud` in `workflow-roster.js`. The `listVia`/`saveVia`/`removeVia` adapters in `workflow-core.js` try Supabase first, fall back to localStorage on failure.

### Workflow Facade
`src/lib/workflow.js` re-exports from 4 domain files — import from the facade, not the internals:
- `workflow-core.js` — localStorage helpers, K constants
- `workflow-academic.js` — sessions, diagnoses, feedback, homework, submissions
- `workflow-roster.js` — students, classes, inbox, error bank, progress
- `workflow-seeds.js` — SEEDS regenerative inquiry stages

### AI Calls
Browser POSTs to `/api/ai` (Vercel serverless proxy at `api/ai.js`) — API keys stay server-side. Client call in `src/lib/callAI.js`. Accepts optional `skills` array to append pedagogical augmentations to the system prompt.

Education skills injected via `withSkills(taskType, options)` from `src/education-skills/active-skills.js`. Task types: `diagnosis`, `feedback`, `homework`, `exercise`, `progress`. Toggles stored in localStorage `vv:skills_enabled`.

### Supabase
- **URL + anon key are HARDWIRED** in `src/lib/supabase-storage.js:12-13` — NOT from env vars (deliberate fix for earlier env-var failures)
- Supabase JS client library is NOT used; all REST calls via `fetch()`
- Auth flows: PKCE (`?code=`) and legacy implicit (`#access_token=`) — handled in `App.jsx:57-163`
- Row Level Security is the auth protection (anon key is safe to expose)
- Migrations in `supabase/migrations/` (17 current), edge functions in `supabase/functions/`
- `opencode.json` has Supabase MCP configured (read-only, database + docs + functions)

### Spaced Repetition
Engine in `src/lib/spaced-repetition.js`. Review intervals: [1, 3, 7, 14, 30] days. Synced to Supabase via `enableSync()` in `App.jsx:169`. Student schedules stored in localStorage key `vv:reviewSchedule:{studentId}`.

### Teacher Gate
Only the email(s) in `VITE_TEACHER_EMAIL` env var resolve to a teacher role at sign-in. Everyone else is a roster student or rejected. Fallback hardcoded to `vvieira010x@gmail.com` in `App.jsx:81`.

### Education Skills Integration
SKILL.md files imported at build time (Vite `?raw`) and injected into AI calls. Files: `parser.js`, `registry.js` (16 skills), `selectors.js`, `active-skills.js` (`withSkills()`), `index.js`.

Wired into: `diagnosis-utils.js`, `diagnostic-create.jsx`, `homework-create.jsx`, `submission-review.jsx`.

---

## Testing

Run all: `npm test`. Tests use Node native `assert` — no assertion library.

5 test files in `tests/`:
- **Static checks**: `student-dashboard-copy.test.js`, `homework-create-icons.test.js`, `submission-review-transcripts.test.js` — grep for prohibited phrases, verify icon imports, check structural patterns
- **Unit tests**: `spaced-repetition.test.js`, `report-metrics.test.js`

Add new `.test.js` files under `tests/` — auto-discovered by the glob.

**CI** (`.github/workflows/ci.yml`): runs `npm test` on push/PR to `master`. Lint intentionally not gated (eslint plugins not installed, codebase not lint-clean yet).

---

## Deployment

- **Vercel** (production): SPA with rewrite-all-to-index.html (`vercel.json:5`). Build output: `dist-build/`. Install: `npm ci`.
- **Serverless functions**: 4 in `api/` — AI proxy (`/api/ai`), TTS (`/api/tts`), class invites (`/api/send-invite`), image generation (`/api/generate-image`). Set API keys in Vercel dashboard using **bare names** (no `VITE_` prefix — that would inline into client bundle).
- **GitHub Pages** (manual dispatch only, `.github/workflows/nextjs.yml`): creates a static SPA snapshot — AI feedback, TTS, and any `/api` feature will **not** work here. Uses `cp dist-build/index.html dist-build/404.html` for SPA fallback.
- Supabase migrations apply via CLI: `supabase db push`.
- `VITE_TEACHER_EMAIL` env var controls teacher access.

---

## Conventions

- localStorage keys use `vv:` prefix (`vv:supabase_session`, `vv:skills_enabled`, `vv:reviewSchedule:*`)
- API keys in Vercel dashboard use bare names (`GEMINI_API_KEY`) — NOT `VITE_` prefixed
- Build dir: `dist-build/`, Vite cache: `.vite-cache-v2/`
- AI model cascade order: OpenRouter (free) → Gemini → Groq → OpenAI → Anthropic (`api/ai.js:189`)
- `.claude/settings.json` hooks warn about graphify before grep/find/rg commands — read `graphify-out/GRAPH_REPORT.md` if you need a codebase map
- Stale dirs (`.vercelignore`): `_non-platform/`, `archive/`, `education-agent-skills-main/`, `met-platform-2.0-repo/`, `product-audit/`, `graphify-out/`
- Brand colors: navy main, teal accent, mint/white/gray support. See `DESIGN_SYSTEM_UPDATE.md` for full OKLch tokens.
