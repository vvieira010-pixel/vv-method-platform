-- B1: spaced-repetition persistence
-- Stores each student's error-bank review schedule so it survives device changes.
-- One row per (student, error). Bulk-upserted by the client on every SR state change.

create table if not exists public.review_schedule (
  id               uuid        primary key default gen_random_uuid(),
  student_id       uuid        not null references public.students(id) on delete cascade,
  error_id         text        not null,
  error_text       text,
  correct_text     text,
  interval_days    integer     not null default 1,
  last_seen        timestamptz,
  next_due         timestamptz,
  source_diagnosis_id text,
  practice_count   integer     default 0,
  mastered         boolean     default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(student_id, error_id)
);

alter table public.review_schedule enable row level security;

-- Students can read and write only their own rows.
create policy "review_schedule student select"
  on public.review_schedule for select
  using (student_id in (
    select id from public.students where auth_user_id = auth.uid()
  ));

create policy "review_schedule student all"
  on public.review_schedule for all
  using (student_id in (
    select id from public.students where auth_user_id = auth.uid()
  ))
  with check (student_id in (
    select id from public.students where auth_user_id = auth.uid()
  ));
