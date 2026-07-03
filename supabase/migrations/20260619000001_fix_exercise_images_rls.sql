-- Add SELECT policy on storage.objects for exercise-images bucket.
-- The x-upsert header causes Supabase Storage to SELECT first (to check
-- whether the object already exists) before deciding INSERT vs. UPDATE.
-- Without a SELECT policy the internal lookup returns zero rows and the
-- upsert falls through to INSERT, which then violates RLS because the
-- storage server resolves the bucket_id differently during the check.

drop policy if exists "exercise-images select" on storage.objects;
create policy "exercise-images select" on storage.objects
  for select to authenticated
  using (bucket_id = 'exercise-images');
