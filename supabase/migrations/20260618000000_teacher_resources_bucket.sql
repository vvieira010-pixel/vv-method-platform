-- Public Storage bucket for teacher-uploaded media (images + audio).
-- Public so images display directly in <img> tags without signed URLs.
insert into storage.buckets (id, name, public)
values ('teacher-resources', 'teacher-resources', true)
on conflict (id) do nothing;

-- Any authenticated user (teacher) may upload; reads are public (bucket is public).
drop policy if exists "teacher-resources insert" on storage.objects;
create policy "teacher-resources insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'teacher-resources');

drop policy if exists "teacher-resources delete" on storage.objects;
create policy "teacher-resources delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'teacher-resources');
