# MET Proficiency Mastery Dashboard + Platform Audit

Date: 2026-06-07
Scope: Teacher dashboard, teacher app shell, student dashboard, student homework/feedback/progress surfaces.
Destination: Local folder (`product-audit/dashboard-audit/`).

## Evidence Limits

- The app responded at `http://localhost:5173/` with status `200`.
- Browser screenshot capture was blocked: the in-app Browser runtime failed to initialize twice with a sandbox startup error.
- This audit is based on current repo/source evidence, not accepted screenshots. Visual findings should be rechecked in the user browser before implementation.
- Product Design saved context was not available; the plugin context file is missing.

## Flow Steps Audited

1. Teacher shell and primary navigation
   Health: Good structure, medium UX risk.

2. Teacher dashboard command center
   Health: Useful, but too task-list oriented for a premium MET prep platform.

3. Student home dashboard
   Health: Strongest surface; clear next action and student-friendly framing.

4. Student feedback page
   Health: Good information architecture; needs stronger prioritization and scan behavior.

5. Student homework page
   Health: Functional and interactive; needs clearer progress/completion states.

6. Student progress view and evidence handling
   Health: Conceptually right; evidence/missingness needs to stay visible.

## Findings

### 1. Teacher dashboard lacks a MET-specific teaching overview

Evidence:
- `src/pages/teacher-dashboard.jsx` shows priority, KPIs, today classes, classes needing diagnosis, pending submissions, and quick actions.
- Current KPIs are operational: students, classes today, need diagnosis, pending review.

Issue:
The dashboard helps the teacher manage work, but it does not yet show the teacher the MET instructional picture: who is nearing target, which MET skill is under-evaluated, where vocabulary/grammar gaps are clustering, or which students need healthcare-related higher-standard preparation.

Recommendation:
Add one compact "MET readiness overview" band below the priority card:
- students needing evidence
- current common weak skill
- students near target
- next best teaching focus

This should use honest evidence language like "not enough evidence" instead of synthetic scores.

### 2. Teacher shell navigation is broad and may compete with daily workflow

Evidence:
- Teacher nav includes Dashboard, Students, Calendar, Diagnostics, Homework, Submissions, Inbox, Error Bank, Reports, Exercises, Settings.
- Sections are grouped as Today, Workflow, Support, Admin in `src/components/shared.jsx`.

Issue:
The structure is organized, but the teacher's actual recurring loop is diagnosis -> feedback -> homework -> review -> progress. The nav labels expose modules, not the workflow.

Recommendation:
Keep the current routes but reinforce the workflow in the dashboard:
- "After class: Diagnose"
- "Before student sees it: Approve feedback"
- "Next assignment: Create homework"
- "After submission: Review"

This can live in a horizontal workflow strip without adding routes.

### 3. Teacher dashboard empty states are calm but not guiding enough

Evidence:
- Empty states include "No classes scheduled today", "All caught up", and "No submissions waiting for review."

Issue:
These are reassuring but passive. The product standard says the teacher should feel "this saves me time without reducing my quality." Empty states should suggest the next useful setup or review action.

Recommendation:
Replace passive empty states with one next action:
- no classes today -> "Review progress or prepare a MET speaking task"
- no pending diagnoses -> "Check students with not enough evidence"
- no submissions -> "Open homework assignments"

### 4. Student home dashboard has a good next-action model

Evidence:
- `HomeView` surfaces next class, pending homework, latest review, approved feedback, current focus, and memo board.
- The hero action chooses homework when pending, otherwise progress.

Strength:
This matches the product standard: students can understand what to do next. The separation of memo, next class, homework, feedback, and progress is appropriate for adult learners.

Risk:
The student dashboard can become dense when every card has content. On mobile, metrics plus panels could push the true action below the fold.

Recommendation:
On mobile, keep the hero action and "What to do now" above memo/progress panels.

### 5. Student feedback page is warm but may duplicate information

Evidence:
- Feedback page has "What improved", "Current focus", full feedback, confidence checklist, and history.
- `StudentFeedbackView` is reused for full approved feedback.

Issue:
The page has the right pieces, but when feedback content is already structured, the summary cards and full feedback can repeat similar ideas.

Recommendation:
Make the page hierarchy:
- top card: today's focus
- second card: your next step
- full feedback collapsible or lower priority
- history at bottom

This keeps student-facing language simple and avoids diagnostic overload.

### 6. Homework surface is correctly interactive, but completion state needs more confidence

Evidence:
- `HomeworkView` detects structured exercises and uses `HomeworkStepThrough`/`ExercisePlayer`.
- Drafts save per homework and current exercise id.
- Filters are To do, Submitted, Reviewed, All.

Strength:
The platform is not just showing homework text; it supports real interaction for MCQ, blanks, speaking, ordering, correction, flashcards, and listening.

Issue:
From source evidence, completion is summarized at submission time, but the list state does not clearly show partial progress before submission beyond draft metadata.

Recommendation:
Show "saved progress" and "x/y exercises answered" in the homework card header when draft data exists.

### 7. Visual direction is close to brand, but teacher and student surfaces differ in density

Evidence:
- Shared design tokens use navy, teal, mint, white, light gray, and slate text.
- Student dashboard styles are dense but polished.
- Teacher dashboard uses inline styles with a narrower max width and simple grid.

Issue:
The student dashboard feels more productized than the teacher dashboard. Teacher should feel premium and efficient too, because teacher workflow quality is core to the platform.

Recommendation:
Bring teacher dashboard styling closer to student dashboard's system:
- more consistent section spacing
- compact evidence/readiness modules
- fewer generic card rows
- stronger MET-specific labels

### 8. Accessibility risks to verify visually

Evidence:
- Buttons generally use semantic `button`.
- Student tabs use `role="tab"` and `aria-selected`.
- Mobile shell hides sidebar and shows bottom nav.

Risks:
- Some icon-only status indicators need visible labels or aria labels.
- Some small text is 12px or 11.5px; verify readability on mobile.
- Bottom nav only shows first 5 teacher tabs on mobile, hiding Inbox, Error Bank, Reports, Exercises, Settings.
- Student top nav can wrap under 900px; verify it does not crowd the sign-out/avatar area.

Recommendation:
Run a visual mobile pass at 390px and 768px. Confirm tap targets, nav availability, and no clipped text.

## Priority Fix List

1. Add a teacher "MET readiness overview" band using existing diagnosis/report data.
2. Make dashboard empty states actionable.
3. Add homework progress counts/saved draft status to student homework cards.
4. Reorder mobile student dashboard so the next action remains above secondary content.
5. Make all teacher routes reachable on mobile, even if via a More menu.
6. Reduce duplicate student feedback summary/full-feedback repetition.

## Suggested Acceptance Checks

- Teacher dashboard answers: "What should I do next?" and "What MET evidence is missing?"
- Student home answers: "What do I do before the next class?"
- Homework card shows whether work is not started, in progress, submitted, or reviewed.
- Mobile teacher navigation still reaches Reports, Inbox, Error Bank, Exercises, and Settings.
- No skill displays a score unless it has enough evidence.
