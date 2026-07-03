-- Add SELECT and UPDATE policies on storage.objects for teacher-resources bucket.
-- The x-upsert header in uploadTeacherResource() causes Supabase Storage to
-- SELECT first (to check whether the object already exists) before deciding
-- INSERT vs. UPDATE. Without a SELECT policy the internal lookup returns zero
-- rows and the upsert falls through to INSERT, which then violates RLS.
-- The UPDATE policy is needed when the object already exists and upsert
-- decides to update instead of insert.

drop policy if exists "teacher-resources select" on storage.objects;
create policy "teacher-resources select" on storage.objects
  for select to authenticated
  using (bucket_id = 'teacher-resources');

drop policy if exists "teacher-resources update" on storage.objects;
create policy "teacher-resources update" on storage.objects
  for update to authenticated
  using (bucket_id = 'teacher-resources')
  with check (bucket_id = 'teacher-resources');
