-- Public Storage bucket for teacher-supplied exercise images
-- (e.g. the picture shown in a speaking-prompt exercise).
--
-- Unlike submission-audio (private, signed URLs), these images are rendered
-- directly in an <img src> for students, so the bucket is public: reads go
-- through the /object/public/ route and need no SELECT policy. Writes are
-- restricted to authenticated users (teachers). Paths are namespaced
-- {exercise_id}/{timestamp}_{filename}.
insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do nothing;

-- Any authenticated user (teacher) may upload new images.
drop policy if exists "exercise-images insert" on storage.objects;
create policy "exercise-images insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exercise-images');

-- Allow upsert ("Replace image" in the editor sends x-upsert) and cleanup.
drop policy if exists "exercise-images update" on storage.objects;
create policy "exercise-images update" on storage.objects
  for update to authenticated
  using (bucket_id = 'exercise-images')
  with check (bucket_id = 'exercise-images');

drop policy if exists "exercise-images delete" on storage.objects;
create policy "exercise-images delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'exercise-images');
