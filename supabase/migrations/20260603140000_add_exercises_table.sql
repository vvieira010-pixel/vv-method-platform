-- Self-service exercise library: a teacher's persistent, reusable exercise bank.
-- First app entity to live in Supabase (pilot slice of the localStorage→DB migration).
-- Each row is owned by the authenticated teacher (teacher_id defaults to auth.uid()),
-- and RLS ensures a teacher only ever sees/edits their own exercises.

create extension if not exists pgcrypto;

create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type         text not null,
  title        text not null default '',
  tags         text[] not null default '{}',
  level        text not null default '',
  content      jsonb not null default '{}'::jsonb,  -- full platform exercise object (type-specific fields)
  usage_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists exercises_teacher_id_created_at_idx
  on public.exercises (teacher_id, created_at desc);

-- keep updated_at fresh (reuses the platform convention from the initial schema)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exercises_touch_updated_at on public.exercises;
create trigger exercises_touch_updated_at
  before update on public.exercises
  for each row execute function public.touch_updated_at();

alter table public.exercises enable row level security;

drop policy if exists exercises_select_own on public.exercises;
create policy exercises_select_own on public.exercises
  for select using (teacher_id = auth.uid());

drop policy if exists exercises_insert_own on public.exercises;
create policy exercises_insert_own on public.exercises
  for insert with check (teacher_id = auth.uid());

drop policy if exists exercises_update_own on public.exercises;
create policy exercises_update_own on public.exercises
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists exercises_delete_own on public.exercises;
create policy exercises_delete_own on public.exercises
  for delete using (teacher_id = auth.uid());
