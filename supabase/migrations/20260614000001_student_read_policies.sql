-- Student read (and where needed, write) policies for all tables the student
-- dashboard and progress page consume.
--
-- Pattern: students may read rows where student_id belongs to their own roster
-- row, identified by auth_user_id = auth.uid().
-- Safe to run repeatedly — all policies are dropped before re-creating.

-- ── helpers ──────────────────────────────────────────────────────────────────
-- A helper expression used in every student SELECT policy:
--   student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())

-- ── students ─────────────────────────────────────────────────────────────────
drop policy if exists "students student reads own" on public.students;
create policy "students student reads own" on public.students
  for select
  using (auth_user_id = auth.uid());

-- ── diagnoses ────────────────────────────────────────────────────────────────
drop policy if exists "diagnoses student reads own" on public.diagnoses;
create policy "diagnoses student reads own" on public.diagnoses
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── homework ─────────────────────────────────────────────────────────────────
drop policy if exists "homework student reads own" on public.homework;
create policy "homework student reads own" on public.homework
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── class_events ─────────────────────────────────────────────────────────────
drop policy if exists "class_events student reads own" on public.class_events;
create policy "class_events student reads own" on public.class_events
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── submissions ───────────────────────────────────────────────────────────────
drop policy if exists "submissions student reads own" on public.submissions;
create policy "submissions student reads own" on public.submissions
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

drop policy if exists "submissions student creates own" on public.submissions;
create policy "submissions student creates own" on public.submissions
  for insert
  to authenticated
  with check (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

drop policy if exists "submissions student updates own" on public.submissions;
create policy "submissions student updates own" on public.submissions
  for update
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── reviews ──────────────────────────────────────────────────────────────────
drop policy if exists "reviews student reads own" on public.reviews;
create policy "reviews student reads own" on public.reviews
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── progress_notes ───────────────────────────────────────────────────────────
drop policy if exists "progress_notes student reads own" on public.progress_notes;
create policy "progress_notes student reads own" on public.progress_notes
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── target_profiles ──────────────────────────────────────────────────────────
drop policy if exists "target_profiles student reads own" on public.target_profiles;
create policy "target_profiles student reads own" on public.target_profiles
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );

-- ── class_evidence ───────────────────────────────────────────────────────────
drop policy if exists "class_evidence student reads own" on public.class_evidence;
create policy "class_evidence student reads own" on public.class_evidence
  for select
  using (
    student_id in (
      select id from public.students where auth_user_id = auth.uid()
    )
  );
