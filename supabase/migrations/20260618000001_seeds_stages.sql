-- SEEDS stages: one row per student tracking their SEEDS regenerative
-- inquiry cycle stage. Teachers write; students read (own only).

create table if not exists public.seeds_stages (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references auth.users(id) on delete cascade,
  student_id   uuid references public.students(id) on delete cascade,
  stage        text not null default '',
  note         text not null default '',
  started_at   timestamptz,
  content      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(student_id)
);

create index if not exists seeds_stages_teacher_id_idx
  on public.seeds_stages (teacher_id);

create index if not exists seeds_stages_student_id_idx
  on public.seeds_stages (student_id);

drop trigger if exists seeds_stages_touch_updated_at on public.seeds_stages;
create trigger seeds_stages_touch_updated_at
  before update on public.seeds_stages
  for each row execute function public.touch_updated_at();

alter table public.seeds_stages enable row level security;

-- Teacher: full access
drop policy if exists "seeds_stages teacher all" on public.seeds_stages;
create policy "seeds_stages teacher all" on public.seeds_stages
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Student: read own only
drop policy if exists "seeds_stages student reads own" on public.seeds_stages;
create policy "seeds_stages student reads own" on public.seeds_stages
  for select
  using (
    student_id in (select id from public.students where auth_user_id = auth.uid())
  );
