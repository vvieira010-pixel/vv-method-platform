-- Listening exercise bank: teacher-managed reusable listening exercises.
create table if not exists public.listening_exercises (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

alter table public.listening_exercises enable row level security;

drop policy if exists listening_exercises_select_own on public.listening_exercises;
create policy listening_exercises_select_own on public.listening_exercises
  for select using (teacher_id = auth.uid());

drop policy if exists listening_exercises_insert_own on public.listening_exercises;
create policy listening_exercises_insert_own on public.listening_exercises
  for insert with check (teacher_id = auth.uid());

drop policy if exists listening_exercises_update_own on public.listening_exercises;
create policy listening_exercises_update_own on public.listening_exercises
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists listening_exercises_delete_own on public.listening_exercises;
create policy listening_exercises_delete_own on public.listening_exercises
  for delete using (teacher_id = auth.uid());
