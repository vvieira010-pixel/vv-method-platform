-- Finish the localStorage -> Supabase migration: enable the two-sided
-- student<->teacher flow at the database layer.
--
-- 1. Student self-claim policy
--    The roster rows in public.students are created by the teacher and start
--    with auth_user_id = null. The existing "student reads own" policy keys on
--    auth_user_id = auth.uid(), so on a student's very first magic-link sign-in
--    they can see nothing and cannot attach themselves. This policy lets a
--    signed-in user claim the (single) roster row whose email matches their JWT
--    email, setting auth_user_id to their own uid. After that, the normal
--    "student reads own" / "submissions student creates own" policies apply.
drop policy if exists "students self-claim by email" on public.students;
create policy "students self-claim by email" on public.students
  for update
  to authenticated
  using (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  with check (auth_user_id = auth.uid());

-- 2. Private Storage bucket for student speaking recordings.
--    Replaces base64-in-row audio. Paths are namespaced
--    {teacher_id}/{student_local_id}/{submission_id}/{exId}.webm.
insert into storage.buckets (id, name, public)
values ('submission-audio', 'submission-audio', false)
on conflict (id) do nothing;

-- Any authenticated user (teacher or linked student) may upload; reads are
-- authenticated-only. Single-teacher pilot scope: the teacher is the consumer.
drop policy if exists "submission-audio insert" on storage.objects;
create policy "submission-audio insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'submission-audio');

drop policy if exists "submission-audio read" on storage.objects;
create policy "submission-audio read" on storage.objects
  for select to authenticated
  using (bucket_id = 'submission-audio');
