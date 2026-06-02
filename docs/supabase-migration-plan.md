# Supabase Migration Plan

## Purpose

Move the VV Method Platform from browser-only `localStorage` persistence to Supabase without breaking the core workflow:

Class -> Diagnosis -> Feedback + Homework -> Review

This plan is intentionally narrow. It keeps the platform focused on MET preparation for a private teacher, not a generic LMS.

## Current Persistence Surface

The current data layer is `src/lib/workflow.js`. Runtime data is stored in browser keys:

- `vv:studentsCrud`
- `vv:targetProfiles`
- `vv:classEvents`
- `vv:classEvidence`
- `vv:diagnoses`
- `vv:feedback`
- `vv:homework`
- `vv:submissions`
- `vv:reviews`
- `vv:inbox`
- `vv:errorBankGlobal`
- `vv:vocabularyBank`
- `vv:progress`
- `vv:progressNotes`
- `vv:reports`

The Settings page now supports exporting these `vv:` keys as a recovery backup before migration.

## Migration Principles

1. Keep `localStorage` as the fallback until Supabase reads and writes are verified.
2. Migrate teacher-owned data first, then student-facing reads, then student writes.
3. Never show diagnosis or feedback to a student unless the teacher-approved and visible flags allow it.
4. Enable RLS on every table in `public`.
5. Do not store authorization roles in user-editable metadata.
6. Do not expose `service_role` or secret keys to the browser.
7. Do not create broad anonymous access policies.

## Proposed Roles

### Teacher

The teacher can:

- manage students
- create class records and evidence
- create and approve diagnoses
- assign homework
- review submissions
- read and respond to messages
- manage error bank, vocabulary bank, progress notes, and reports

### Student

A student can:

- read only their own approved-visible feedback
- read only their own assigned homework
- submit only their own homework responses
- read only their own reviews
- send and read only their own messages

## Auth Model

Use Supabase Auth for both teacher and students.

Recommended user profile table:

```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  display_name text,
  student_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Authorization should use `public.profiles.role`, not `raw_user_meta_data`.

## Schema Proposal

### students

Teacher-owned roster and student profile.

```sql
create table public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  first_name text,
  email text,
  current_level text,
  target_level text,
  focus_skill text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### target_profiles

Student goals and MET score targets.

```sql
create table public.target_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  is_active boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### class_events

Calendar and class workflow status.

```sql
create table public.class_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  status text not null default 'scheduled',
  diagnostic_status text,
  homework_status text,
  review_status text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### class_evidence

Teacher-facing evidence captured from class.

```sql
create table public.class_evidence (
  id uuid primary key default gen_random_uuid(),
  class_event_id uuid references public.class_events(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  evaluated_skills jsonb not null default '{}'::jsonb,
  evidence_counts jsonb not null default '{}'::jsonb,
  transcript text,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### diagnoses

Teacher-reviewed diagnosis. This table preserves the current `sections` and `content` shape for compatibility.

```sql
create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_event_id uuid references public.class_events(id) on delete set null,
  target_profile_id uuid references public.target_profiles(id) on delete set null,
  status text not null default 'draft',
  teacher_approved boolean not null default false,
  cycle_stage text,
  evaluated_skills jsonb not null default '{}'::jsonb,
  evidence_counts jsonb not null default '{}'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  ai_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Student-facing reads must filter:

- `status = 'approved'`
- `teacher_approved = true`
- `sections->'studentFeedback'->>'approved' = 'true'`
- `sections->'studentFeedback'->>'hidden' != 'true'`

### homework

Teacher-assigned homework linked to diagnosis where possible.

```sql
create table public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  diagnosis_id uuid references public.diagnoses(id) on delete set null,
  title text,
  status text not null default 'not-started',
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  activities jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### submissions

Student homework submissions.

```sql
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted',
  content text,
  responses jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### homework_drafts

Student-saved in-progress homework responses. This supports the current "Save progress" button and lets a student continue from the last saved exercise before final submission.

```sql
create table public.homework_drafts (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  current_exercise_id text,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (homework_id, student_id)
);
```

### reviews

Teacher review of student submissions.

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  homework_id uuid references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  redo_required boolean not null default false,
  reviewed_at timestamptz not null default now(),
  sent_to_student boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

When a review is saved:

- update the linked `submissions.status` to `reviewed`
- update the linked `homework.status` to `reviewed`
- create an `inbox_messages` notification for the student when `sent_to_student = true`

### inbox_messages

Teacher-student messages.

```sql
create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  from_role text not null check (from_role in ('teacher', 'student')),
  message_type text not null default 'message',
  homework_id uuid references public.homework(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
```

### platform_settings

Teacher-managed app settings. Use this for the student dashboard general memo shown to all students.

```sql
create table public.platform_settings (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  student_general_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### support tables

Use JSONB content first for compatibility, then normalize later only if needed:

- `error_bank_entries`
- `vocabulary_entries`
- `progress_notes`
- `reports`
- `practice_assignments`
- `practice_resources`
- `practice_submissions`

## RLS Policy Pattern

Every table in `public` should run:

```sql
alter table public.table_name enable row level security;
grant select, insert, update, delete on table public.table_name to authenticated;
```

No student or teacher table should grant broad `anon` access.

Teacher policy pattern:

```sql
create policy "teacher owns rows"
on public.table_name
for all
to authenticated
using (
  (select auth.uid()) is not null
  and teacher_id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and teacher_id = (select auth.uid())
);
```

Student select policy pattern:

```sql
create policy "student reads own rows"
on public.table_name
for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.students s
    where s.id = table_name.student_id
      and s.auth_user_id = (select auth.uid())
  )
);
```

Diagnosis student read policy must include the approved-visible checks. If this becomes hard to express against JSONB, create a `student_feedback_public` view with `security_invoker = true` on Postgres 15+.

## Migration Order

1. Add Supabase client package and environment variables, but keep localStorage active.
2. Create schema in a development Supabase project.
3. Enable RLS and policies.
4. Add indexes on `teacher_id`, `student_id`, `auth_user_id`, `class_event_id`, `diagnosis_id`, and `homework_id`.
5. Add a storage adapter interface beside `workflow.js`.
6. Implement read-through fallback: try Supabase, fall back to localStorage.
7. Add export-to-Supabase importer that reads the Settings backup JSON.
8. Migrate teacher roster and class records first.
9. Migrate diagnoses, preserving `sections` and `content` JSON exactly.
10. Migrate homework, submissions, reviews, and messages.
11. Verify teacher flow end-to-end.
12. Verify student flow end-to-end with a real student auth account.
13. Only after verification, make Supabase the default write path.
14. Keep localStorage backup/export available for rollback.

## LocalStorage Fallback Strategy

Keep the current `workflow.js` methods as the compatibility layer.

Proposed adapter shape:

```js
const storage = useSupabase
  ? supabaseWorkflowAdapter
  : localStorageWorkflowAdapter;
```

During migration:

- reads: Supabase first, localStorage fallback
- writes: localStorage first in phase 1, dual-write only after test data passes
- rollback: disable Supabase flag and restore from exported backup

## Verification Checklist

Before turning Supabase on for real users:

1. Teacher login.
2. Student login.
3. Create/select student.
4. Create class.
5. Record evidence.
6. Run diagnosis.
7. Approve required sections.
8. Hidden feedback remains invisible to student.
9. Visible approved feedback appears to student.
10. Create homework.
11. Student submits homework.
12. Teacher reviews submission.
13. Student sees review.
14. Export backup still works.
15. RLS blocks cross-student reads.
16. RLS blocks student writes to teacher-only tables.

## Open Decisions

- Whether students will use email/password, magic links, or teacher-created accounts.
- Whether one teacher account is enough for now or multi-teacher support is required.
- Whether AI provider keys move to environment/server functions immediately or remain browser-local during prototype phase.
- Whether reports need normalized analytics tables or can remain JSONB until usage stabilizes.
