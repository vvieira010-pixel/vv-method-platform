# Graph Report - .  (2026-06-05)

## Corpus Check
- 87 files · ~132,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1160 nodes · 2419 edges · 75 communities (47 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.87)
- Token cost: 75,512 input · 10,245 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Supabase Data Layer|Supabase Data Layer]]
- [[_COMMUNITY_Bundled Assets (index)|Bundled Assets (index)]]
- [[_COMMUNITY_Exercise Editor & Bank|Exercise Editor & Bank]]
- [[_COMMUNITY_App Shell & Routing|App Shell & Routing]]
- [[_COMMUNITY_Shared UI Components|Shared UI Components]]
- [[_COMMUNITY_Exercise Editor Fields|Exercise Editor Fields]]
- [[_COMMUNITY_AI Helpers & Error Profiles|AI Helpers & Error Profiles]]
- [[_COMMUNITY_Homework Create Bundle|Homework Create Bundle]]
- [[_COMMUNITY_Listening Education Data|Listening Education Data]]
- [[_COMMUNITY_Teacher Pages|Teacher Pages]]
- [[_COMMUNITY_Feedback Tools|Feedback Tools]]
- [[_COMMUNITY_Exercise Player|Exercise Player]]
- [[_COMMUNITY_Docs & Concepts|Docs & Concepts]]
- [[_COMMUNITY_Bundled Assets (misc)|Bundled Assets (misc)]]
- [[_COMMUNITY_AI Cascade (callAI)|AI Cascade (callAI)]]
- [[_COMMUNITY_Supabase Auth & Routing|Supabase Auth & Routing]]
- [[_COMMUNITY_Bundled Assets (shared)|Bundled Assets (shared)]]
- [[_COMMUNITY_Bundled Assets (tools)|Bundled Assets (tools)]]
- [[_COMMUNITY_Diagnostic Create Bundle|Diagnostic Create Bundle]]
- [[_COMMUNITY_Exercise Library|Exercise Library]]
- [[_COMMUNITY_Module 20|Module 20]]
- [[_COMMUNITY_Module 21|Module 21]]
- [[_COMMUNITY_Module 22|Module 22]]
- [[_COMMUNITY_Module 23|Module 23]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 25|Module 25]]
- [[_COMMUNITY_Module 26|Module 26]]
- [[_COMMUNITY_Module 27|Module 27]]
- [[_COMMUNITY_Module 28|Module 28]]
- [[_COMMUNITY_Module 29|Module 29]]
- [[_COMMUNITY_Module 30|Module 30]]
- [[_COMMUNITY_Module 31|Module 31]]
- [[_COMMUNITY_Module 32|Module 32]]
- [[_COMMUNITY_Module 33|Module 33]]
- [[_COMMUNITY_Module 34|Module 34]]
- [[_COMMUNITY_Module 35|Module 35]]
- [[_COMMUNITY_Module 36|Module 36]]
- [[_COMMUNITY_Module 37|Module 37]]
- [[_COMMUNITY_Module 38|Module 38]]
- [[_COMMUNITY_Module 39|Module 39]]
- [[_COMMUNITY_Module 40|Module 40]]
- [[_COMMUNITY_Module 41|Module 41]]
- [[_COMMUNITY_Module 42|Module 42]]
- [[_COMMUNITY_Module 43|Module 43]]
- [[_COMMUNITY_Module 44|Module 44]]
- [[_COMMUNITY_Module 45|Module 45]]
- [[_COMMUNITY_Module 46|Module 46]]
- [[_COMMUNITY_Module 47|Module 47]]
- [[_COMMUNITY_Module 48|Module 48]]
- [[_COMMUNITY_Module 49|Module 49]]
- [[_COMMUNITY_Module 50|Module 50]]
- [[_COMMUNITY_Module 51|Module 51]]
- [[_COMMUNITY_Module 52|Module 52]]
- [[_COMMUNITY_Module 53|Module 53]]
- [[_COMMUNITY_Module 54|Module 54]]
- [[_COMMUNITY_Module 55|Module 55]]
- [[_COMMUNITY_Module 56|Module 56]]
- [[_COMMUNITY_Module 57|Module 57]]
- [[_COMMUNITY_Module 58|Module 58]]
- [[_COMMUNITY_Module 59|Module 59]]
- [[_COMMUNITY_Module 60|Module 60]]
- [[_COMMUNITY_Module 61|Module 61]]
- [[_COMMUNITY_Module 62|Module 62]]
- [[_COMMUNITY_Module 63|Module 63]]
- [[_COMMUNITY_Module 64|Module 64]]
- [[_COMMUNITY_Module 65|Module 65]]
- [[_COMMUNITY_Module 66|Module 66]]
- [[_COMMUNITY_Module 67|Module 67]]
- [[_COMMUNITY_Module 68|Module 68]]
- [[_COMMUNITY_Module 69|Module 69]]
- [[_COMMUNITY_Module 70|Module 70]]
- [[_COMMUNITY_Module 71|Module 71]]
- [[_COMMUNITY_Module 72|Module 72]]
- [[_COMMUNITY_Module 73|Module 73]]
- [[_COMMUNITY_Module 74|Module 74]]

## God Nodes (most connected - your core abstractions)
1. `save()` - 41 edges
2. `load()` - 40 edges
3. `dbUpsert()` - 32 edges
4. `dbReady()` - 30 edges
5. `Button()` - 29 edges
6. `ae()` - 28 edges
7. `Icon` - 28 edges
8. `Card()` - 28 edges
9. `qe()` - 27 edges
10. `Ge()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `SubmissionReview Page` --implements--> `Teaching Cycle (Diagnose→Feedback→HW→Review)`  [INFERRED]
  src/pages/submission-review.jsx → AGENTS.md
- `ToolHomework` --implements--> `Teaching Cycle (Diagnose→Feedback→HW→Review)`  [INFERRED]
  src/tools/tool-homework.jsx → AGENTS.md
- `TeacherHome Page` --references--> `Teaching Cycle (Diagnose→Feedback→HW→Review)`  [INFERRED]
  src/pages/teacher-home.jsx → AGENTS.md
- `ToolDiagnostic` --implements--> `Teaching Cycle (Diagnose→Feedback→HW→Review)`  [INFERRED]
  src/tools/tool-diagnostic.jsx → AGENTS.md
- `ToolFeedback` --implements--> `Teaching Cycle (Diagnose→Feedback→HW→Review)`  [INFERRED]
  src/tools/tool-feedback.jsx → AGENTS.md

## Communities (75 total, 28 thin omitted)

### Community 0 - "Supabase Data Layer"
Cohesion: 0.06
Nodes (103): claimStudentByEmail(), dbEnabled(), dbHasEntity(), dbList(), dbRemove(), dbUpsert(), ensureProfile(), ENTITIES (+95 more)

### Community 1 - "Bundled Assets (index)"
Cohesion: 0.03
Nodes (41): a0(), Ag, Ah(), b0(), Bg, Cg, co(), d0() (+33 more)

### Community 2 - "Exercise Editor & Bank"
Cohesion: 0.06
Nodes (44): ExerciseEditor(), ExerciseTypePicker(), bankMeta, convertExercise(), exId(), getExerciseModules(), getModuleExercises(), contentHash() (+36 more)

### Community 3 - "App Shell & Routing"
Cohesion: 0.05
Nodes (47): App (Root Component), ToastHost, TweaksUI, renderTeacherPage, ErrorBoundary, ExTypeBadge, ExerciseEditor (teacher-facing), ExercisePlayer (student-facing) (+39 more)

### Community 4 - "Shared UI Components"
Cohesion: 0.08
Nodes (26): Button(), Card(), Icon, Pill(), SectionHeader(), deletePracticeAssignment(), getHomework(), getLateStatus() (+18 more)

### Community 5 - "Exercise Editor Fields"
Cohesion: 0.06
Nodes (20): ExTypeBadge(), fieldLabel, fieldWrap, hintText, BlankPlayer(), ExercisePlayer(), HomeworkStepThrough(), autoGrade() (+12 more)

### Community 6 - "AI Helpers & Error Profiles"
Cohesion: 0.06
Nodes (25): extractBalancedJson(), parseAiJson(), ANA_PAULA_PROFILE, buildErrorProfileContext(), STUDENT_ERROR_PROFILES, backStyle, DiagnosticCreate(), labelStyle (+17 more)

### Community 7 - "Homework Create Bundle"
Cohesion: 0.09
Nodes (32): at(), B(), ct(), dt(), E(), Et, ft(), gt (+24 more)

### Community 8 - "Listening Education Data"
Cohesion: 0.05
Nodes (33): ALL_LISTENING_EDUCATION, META_P1, META_P2A, META_P2B, META_P3, P1_Q1, P1_Q2, P1_Q3 (+25 more)

### Community 9 - "Teacher Pages"
Cohesion: 0.12
Nodes (36): CalendarPage, ClassRecord, DiagnosticCreate, ErrorBankPage, StudentProfile, StudentsPage, buildSectionRegenPrompt, dbHasEntity (+28 more)

### Community 10 - "Feedback Tools"
Cohesion: 0.06
Nodes (21): ReviewStatusBadge(), buildStudentFeedbackDraft(), bulletLines(), DiagnosisFeedbackWorkspace(), EXERCISE_CATALOG, formatDiagnosisLabel(), GENERATOR_CLASS_FOCUS, GENERATOR_DEFAULTS (+13 more)

### Community 11 - "Exercise Player"
Cohesion: 0.07
Nodes (7): ErrorCorrection(), normalize(), ExercisePlayer(), TYPE_LABELS, REFLECTION_CHECKS, loadExercises(), DEMO_EXERCISES

### Community 12 - "Docs & Concepts"
Cohesion: 0.1
Nodes (30): AGENTS.md (Project instructions), parseAiJson (ai-helpers), parseAiJson, AI-draft teacher-review-before-publish pattern, localStorage-to-Supabase migration, MET Preparation Domain, RLS teacher-owned data pattern, Student Cycle State Machine (+22 more)

### Community 13 - "Bundled Assets (misc)"
Cohesion: 0.2
Nodes (26): $0(), ae(), ay(), ce(), Fg(), fy(), Ge(), hy() (+18 more)

### Community 14 - "AI Cascade (callAI)"
Cohesion: 0.1
Nodes (18): AVATAR_PALETTES, callAI(), GEMINI_DEFAULT_MODELS, geminiModels(), LEGACY_NAV_SECTIONS, multiKeys(), NEW_NAV_SECTIONS, OPENROUTER_DEFAULT_MODELS (+10 more)

### Community 15 - "Supabase Auth & Routing"
Cohesion: 0.08
Nodes (21): setSessionRole(), App(), CalendarPage, ClassRecord, DiagnosticCreate, DiagnosticsPage, ErrorBankPage, ExerciseDemo (+13 more)

### Community 16 - "Bundled Assets (shared)"
Cohesion: 0.18
Nodes (23): av, bs(), ey(), ha(), io(), It(), Jg(), Jn() (+15 more)

### Community 17 - "Bundled Assets (tools)"
Cohesion: 0.1
Nodes (20): bv(), Ct(), cv(), cy(), Dg(), dv(), dy(), em() (+12 more)

### Community 18 - "Diagnostic Create Bundle"
Cohesion: 0.11
Nodes (9): ae, Ce, D, gt, ht(), jt, le, Tt() (+1 more)

### Community 19 - "Exercise Library"
Cohesion: 0.14
Nodes (20): bankMeta, convertExercise (internal), getExerciseModules, getModuleExercises, deleteLibraryExercise, getLibraryExercises, incrementUsage, saveExerciseToLibrary (+12 more)

### Community 20 - "Module 20"
Cohesion: 0.16
Nodes (20): createEmptyResponse, isStructuredExercise, HomeworkPage, ReportsPage, StudentDashboard, buildPrintableHomeworkHtml, printHomework, SubmissionReview Page (+12 more)

### Community 21 - "Module 21"
Cohesion: 0.11
Nodes (11): createSignedAudioUrl(), getStudent(), getStudents(), DAYS, DX_TONE, EMPTY_FORM, S, STATUS_TONE (+3 more)

### Community 22 - "Module 22"
Cohesion: 0.14
Nodes (8): E(), ee, I, O(), U(), V(), X(), z()

### Community 23 - "Module 23"
Cohesion: 0.18
Nodes (17): DiagnosticsPage, dbRemove, ToolPracticeStudio, ToolReports, ToolTemplates (Resource Library), deleteClassEvent, deleteDiagnosis, deleteHomework (+9 more)

### Community 24 - "Module 24"
Cohesion: 0.16
Nodes (6): inject(), MessageTeacherDock(), StudentInbox(), StudentFeedbackView(), DONE_MESSAGES, TABS

### Community 25 - "Module 25"
Cohesion: 0.14
Nodes (9): Avatar(), Kpi(), pickColor(), getAllSubmissions(), styles, TeacherDashboard(), timeOfDay(), fieldLabel (+1 more)

### Community 26 - "Module 26"
Cohesion: 0.15
Nodes (16): LoginPage, SettingsPage, claimStudentByEmail, createSignedAudioUrl, dbEnabled, ensureProfile, getDbContext, invalidateRefs (+8 more)

### Community 27 - "Module 27"
Cohesion: 0.15
Nodes (15): bt(), Bh(), Ch(), Dh(), Gg(), Ic(), Ie, Jc() (+7 more)

### Community 28 - "Module 28"
Cohesion: 0.14
Nodes (8): deleteDiagnosis(), getDiagnoses(), getDiagnosisTimeline(), getLatestDiagnosis(), S, EMPTY_FORM, LEVELS, S

### Community 29 - "Module 29"
Cohesion: 0.18
Nodes (8): b, p, c(), d(), Nh(), _v(), j, g

### Community 30 - "Module 30"
Cohesion: 0.18
Nodes (8): injectGlobalCSS(), Shell(), STUDENTS, VALID_CODES, getSupabaseConfig(), signInWithPassword(), LoginScreen(), TEACHER

### Community 31 - "Module 31"
Cohesion: 0.14
Nodes (14): Audio Storage (Supabase bucket), Student self-claim by email pattern, ExTypeBadge (exercise-editor), ExercisePlayer (exercise-player), autoGrade (exercise-types), exercisePreview (exercise-types), isStructuredExercise (exercise-types), student self-claim + audio bucket migration (+6 more)

### Community 32 - "Module 32"
Cohesion: 0.21
Nodes (11): buildSupabaseHeaders(), challengeFromVerifier(), clearStoredSupabaseSession(), exchangePKCECode(), fetchSupabaseUser(), generateVerifier(), normalizeSupabaseUrl(), parsePKCECode() (+3 more)

### Community 33 - "Module 33"
Cohesion: 0.18
Nodes (7): Mh(), oo(), ue(), B, f, w(), z

### Community 34 - "Module 34"
Cohesion: 0.2
Nodes (4): v, k, I, J

### Community 36 - "Module 36"
Cohesion: 0.25
Nodes (5): d(), g(), fe, he, M

### Community 37 - "Module 37"
Cohesion: 0.25
Nodes (6): getReviews(), getStudentCycleState(), getSubmissions(), STAGE_CONFIG, TeacherHome(), timeOfDay()

### Community 38 - "Module 38"
Cohesion: 0.25
Nodes (4): F, G, y, z

### Community 39 - "Module 39"
Cohesion: 0.25
Nodes (4): A, ee, Q, R

### Community 40 - "Module 40"
Cohesion: 0.32
Nodes (5): BADGE_DEFS, calcStreak(), calcXP(), computeGamification(), LEVELS

### Community 41 - "Module 41"
Cohesion: 0.32
Nodes (7): DAY_NAMES, getDaysInMonth(), getFirstDayOfMonth(), labelStyle, MONTH_NAMES, navBtnStyle, ToolCalendar()

### Community 42 - "Module 42"
Cohesion: 0.29
Nodes (4): clearWorkflowData(), S, SENSITIVE_LOCAL_KEYS, SettingsPage()

### Community 43 - "Module 43"
Cohesion: 0.33
Nodes (5): injectCSS(), TweakColor(), TweakRadio(), TweakSection(), TweaksPanel()

### Community 44 - "Module 44"
Cohesion: 0.4
Nodes (3): a, E(), I()

### Community 46 - "Module 46"
Cohesion: 0.6
Nodes (5): buildPrintableHomeworkHtml(), esc(), exerciseHtml(), lines(), printHomework()

### Community 49 - "Module 49"
Cohesion: 0.67
Nodes (3): B, C(), P()

### Community 51 - "Module 51"
Cohesion: 0.67
Nodes (3): ANA_PAULA_PROFILE, STUDENT_ERROR_PROFILES, buildErrorProfileContext

## Knowledge Gaps
- **297 isolated node(s):** `env`, `Q`, `ee`, `A`, `R` (+292 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Shared UI Components` to `Supabase Data Layer`, `Exercise Editor & Bank`, `Exercise Editor Fields`, `AI Helpers & Error Profiles`, `Module 37`, `Module 41`, `Module 42`, `Feedback Tools`, `AI Cascade (callAI)`, `Supabase Auth & Routing`, `Module 21`, `Module 24`, `Module 25`, `Module 28`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `Icon` connect `Shared UI Components` to `Supabase Data Layer`, `Exercise Editor & Bank`, `Exercise Editor Fields`, `AI Helpers & Error Profiles`, `Module 37`, `Module 41`, `Module 42`, `Feedback Tools`, `AI Cascade (callAI)`, `Supabase Auth & Routing`, `Module 21`, `Module 24`, `Module 25`, `Module 28`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Pill()` connect `Shared UI Components` to `Supabase Data Layer`, `Exercise Editor & Bank`, `Exercise Editor Fields`, `AI Helpers & Error Profiles`, `Module 37`, `Module 40`, `Module 41`, `Feedback Tools`, `AI Cascade (callAI)`, `Module 21`, `Module 25`, `Module 28`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `env`, `Q`, `ee` to the rest of the system?**
  _297 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Supabase Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Bundled Assets (index)` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Exercise Editor & Bank` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._