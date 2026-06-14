-- Teacher write policies for all tables teachers need to INSERT/UPDATE.
-- Pattern: teachers may all-ops rows where teacher_id = auth.uid().
-- Safe to run repeatedly — all policies are dropped before re-creating.

-- ── helpers ──────────────────────────────────────────────────────────────────
-- Tables that have a teacher_id column use:
--   using  (teacher_id = auth.uid())
--   with check (teacher_id = auth.uid())

-- ── students ─────────────────────────────────────────────────────────────────
drop policy if exists "students teacher all" on public.students;
create policy "students teacher all" on public.students
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── diagnoses ────────────────────────────────────────────────────────────────
drop policy if exists "diagnoses teacher all" on public.diagnoses;
create policy "diagnoses teacher all" on public.diagnoses
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── homework ─────────────────────────────────────────────────────────────────
drop policy if exists "homework teacher all" on public.homework;
create policy "homework teacher all" on public.homework
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── submissions ──────────────────────────────────────────────────────────────
drop policy if exists "submissions teacher all" on public.submissions;
create policy "submissions teacher all" on public.submissions
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── reviews ──────────────────────────────────────────────────────────────────
drop policy if exists "reviews teacher all" on public.reviews;
create policy "reviews teacher all" on public.reviews
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── progress_notes ───────────────────────────────────────────────────────────
drop policy if exists "progress_notes teacher all" on public.progress_notes;
create policy "progress_notes teacher all" on public.progress_notes
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── target_profiles ──────────────────────────────────────────────────────────
drop policy if exists "target_profiles teacher all" on public.target_profiles;
create policy "target_profiles teacher all" on public.target_profiles
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── class_events ─────────────────────────────────────────────────────────────
drop policy if exists "class_events teacher all" on public.class_events;
create policy "class_events teacher all" on public.class_events
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ── class_evidence ───────────────────────────────────────────────────────────
drop policy if exists "class_evidence teacher all" on public.class_evidence;
create policy "class_evidence teacher all" on public.class_evidence
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
