# MET Proficiency Mastery Product Audit

Date: 2026-06-07
Target: http://localhost:4173/
Mode: Combined UX and accessibility audit

## Evidence Status

Screenshot evidence was captured for the public login screen:
- `01-login-desktop.png`
- `02-login-mobile.png`

Authenticated teacher and student surfaces could not be captured because the app requires Supabase authentication and the local browser automation path could not complete an authenticated session. Those authenticated sections are code-grounded and flow-grounded, not screenshot-backed.

Audited surfaces from source:
- Login and registration entry: `src/pages/login.jsx`
- Teacher dashboard and shell: `src/App.jsx`, `src/pages/teacher-dashboard.jsx`, `src/components/shared.jsx`
- Student dashboard: `src/pages/student-dashboard.jsx`, `src/styles/logbook.css`
- Students roster: `src/pages/students.jsx`
- Diagnostics list: `src/pages/diagnostics.jsx`

## Step List

1. Public login screen: medium health.
   Desktop has strong brand direction and clear sign-in/register split. Mobile hides the brand panel and the form content is horizontally clipped at 390px, so the first screen loses brand context and has a responsive layout problem.

2. Teacher dashboard: medium health.
   Useful operational summary with classes, diagnosis, submissions, and quick actions. Risk: the dashboard is task-heavy but not strongly prioritized around the core MET workflow.

3. Teacher navigation shell: medium health.
   Comprehensive routes exist, but there are many top-level items. For repeated teacher work, the shell should make the main loop more obvious: Students, Classes, Diagnosis, Homework, Review, Progress.

4. Students roster: good health.
   The recent password cleanup makes the flow cleaner and safer. The roster now focuses on student profile and invite readiness. Opportunity: add a stronger "next action" per student.

5. Diagnostics list: medium health.
   Clear filters and status, but the list does not surface enough learning context at a glance. Teachers need to know what diagnosis means, what is missing, and what to do next.

6. Student dashboard: good health.
   It has the right student-facing structure: Home, Homework, Feedback, Progress, Messages, next class, current focus, and approved feedback only. Risk: some areas may still feel dense for adult learners if there is little or no data.

## Strengths

- The product direction matches the MET Proficiency Mastery goal: serious, calm, and teacher-led.
- Student-facing areas are separated clearly: homework, feedback, progress, and messages are not mixed into one confusing feed.
- The teacher dashboard already supports the real operating loop: class, diagnosis, homework, review, error bank, reports.
- Feedback visibility rules are responsible: approved student feedback is treated differently from teacher-only diagnostic detail.
- The color system is mostly aligned with the brand: navy, teal, mint, white, and slate.

## UX Risks

- The mobile login screen removes the brand panel, so mobile students see a generic sign-in form without the "MET Proficiency Mastery" pathway context.
- The mobile login form is horizontally clipped in `02-login-mobile.png`; the email field and sign-in button extend past the right edge.
- The teacher shell has too many equal-weight destinations. This makes the product feel more like an admin system than a guided MET teaching workflow.
- The teacher dashboard has KPIs, lists, and quick actions, but it does not yet clearly answer: "What should I do first today?"
- Diagnostics list rows show approval counts, but not evidence coverage or missingness. That can hide the important rule: do not score what was not evaluated.
- Empty states are polite but not always action-oriented. Example: "No diagnoses yet" should point the teacher to the exact next step after a class.
- Student progress may look useful only when data exists. In empty or early states, the dashboard needs stronger "what to do next" guidance.

## Accessibility Risks

- Some interaction styles rely on hover background changes. Keyboard focus exists in shared CSS for several controls, but inline button styles should be checked for consistent focus visibility.
- The login mobile experience hides supporting context, which is not an accessibility failure by itself, but reduces orientation for users with cognitive load or anxiety.
- Teacher dashboard cards with `onClick` may behave visually like cards but semantically like buttons. Clickable cards should have clear keyboard behavior and accessible names.
- The mobile login layout has a visible reflow issue at 390px wide.
- Dense navigation on smaller screens needs real keyboard and zoom testing. The shell has mobile nav CSS, but the route count may still cause cramped labels.
- Full WCAG compliance cannot be claimed without live keyboard, screen reader, contrast, and reflow testing.

## Recommendations

1. Fix mobile login width and keep a compact brand header.
   Ensure the form fits within the viewport at 390px and show "MET Proficiency Mastery" plus "Michigan English Test Preparation for Nurses" above the form even when the large brand panel is hidden.

2. Reframe teacher navigation around the core workflow.
   Group or visually emphasize: Today, Students, Diagnosis, Homework, Review, Progress. Move Settings and Exercises lower in priority.

3. Add a "Today priority" block to the teacher dashboard.
   One clear card should say the next best teacher action: review a submission, finish a diagnosis, assign homework, or prepare the next class.

4. Improve diagnosis list rows.
   Add compact evidence labels such as "Speaking evaluated", "Writing not enough evidence", or "Listening not evaluated yet" so teachers see truthfulness before approval.

5. Make student empty states more instructive.
   For no homework, no feedback, or no next class, use calm next-step copy: "Your teacher will add this after class" plus one useful study action.

6. Add per-student next action in the roster.
   Beside each student, show one operational cue: "Needs diagnosis", "Homework pending", "Submission waiting", or "No next class".

7. Keep healthcare support visible but secondary.
   Add small contextual tags like "MET speaking", "healthcare scenario", or "test strategy" in homework/diagnosis flows so the 70% MET / 30% healthcare balance is visible.

8. Run a real accessibility pass after screenshot capture works.
   Test keyboard tab order, focus rings, zoom at 200%, mobile reflow, and screen reader labels for the shell, dashboard cards, forms, and homework player.

## Suggested Priority Order

1. Mobile login width and brand header.
2. Teacher dashboard "Today priority" card.
3. Diagnosis evidence labels in list rows.
4. Student empty-state guidance.
5. Teacher navigation grouping.
6. Roster next-action cue.

## Capture Blockers

- Product Design in-app Browser: node/browser kernel failed to start.
- Authenticated teacher/student screens: not captured because the app requires Supabase sign-in and no authenticated browser session was available.

Recommended next step for a fuller visual audit: capture or provide screenshots from the teacher dashboard, student dashboard, diagnostics, and homework flows after signing in.
