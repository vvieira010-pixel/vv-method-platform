-- profiles: links auth.users to teacher/student roles.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'teacher',
  display_name text,
  student_id   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- mock-test-audio bucket (for speaking recording uploads)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mock-test-audio', 'mock-test-audio', true, null, null)
on conflict (id) do nothing;

-- RLS policies for mock_test_results (currently RLS-enabled but has no policies)
alter table public.mock_test_results enable row level security;

drop policy if exists mock_test_results_select_own on public.mock_test_results;
create policy mock_test_results_select_own on public.mock_test_results
  for select
  to authenticated
  using (teacher_id = auth.uid()::text or student_id = auth.uid()::text);

drop policy if exists mock_test_results_insert_own on public.mock_test_results;
create policy mock_test_results_insert_own on public.mock_test_results
  for insert
  to authenticated
  with check (teacher_id = auth.uid()::text or student_id = auth.uid()::text);

drop policy if exists mock_test_results_update_own on public.mock_test_results;
create policy mock_test_results_update_own on public.mock_test_results
  for update
  to authenticated
  using (teacher_id = auth.uid()::text or student_id = auth.uid()::text)
  with check (teacher_id = auth.uid()::text or student_id = auth.uid()::text);
