-- teacher_settings: key-value store for teacher-level configuration.
-- Teachers can write their own settings; students can read their teacher's.

create table if not exists public.teacher_settings (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  value      text not null default '',
  updated_at timestamptz not null default now(),
  constraint teacher_settings_teacher_key unique (teacher_id, key)
);

create index if not exists teacher_settings_teacher_id_idx
  on public.teacher_settings (teacher_id);

drop trigger if exists teacher_settings_touch_updated_at on public.teacher_settings;
create trigger teacher_settings_touch_updated_at
  before update on public.teacher_settings
  for each row execute function public.touch_updated_at();

alter table public.teacher_settings enable row level security;

-- Teachers: full access to their own settings
drop policy if exists teacher_settings_teacher_all on public.teacher_settings;
create policy teacher_settings_teacher_all on public.teacher_settings
  for all
  using  (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Students: read-only access to their teacher's settings
drop policy if exists teacher_settings_student_read on public.teacher_settings;
create policy teacher_settings_student_read on public.teacher_settings
  for select
  using (
    teacher_id in (
      select teacher_id from public.students where auth_user_id = auth.uid()
    )
  );
