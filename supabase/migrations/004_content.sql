-- ── 004_content.sql ──────────────────────────────────────────────────────────

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.themes (
  id                uuid    primary key default gen_random_uuid(),
  title             text    not null,
  slug              text    unique,
  description       text,
  level             text    not null check (level in ('explorer', 'builder', 'architect')),
  status            text    not null default 'draft'
                    check (status in ('draft', 'validated', 'published', 'locked')),
  version           int     not null default 1,
  parent_version_id uuid    references public.themes(id),
  created_by        uuid    references public.profiles(id) on delete set null,
  cover_image_url   text,
  estimated_hours   int,
  published_at      timestamptz,
  locked_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.chapters (
  id                 uuid primary key default gen_random_uuid(),
  theme_id           uuid not null references public.themes(id) on delete cascade,
  title              text not null,
  description        text,
  order_index        int  not null default 0,
  estimated_minutes  int,
  created_at         timestamptz not null default now()
);

create table if not exists public.lessons (
  id                 uuid    primary key default gen_random_uuid(),
  chapter_id         uuid    not null references public.chapters(id) on delete cascade,
  theme_id           uuid    not null references public.themes(id) on delete cascade,
  title              text    not null,
  objectives         text[],
  xp_reward          int     not null default 10,
  order_index        int     not null default 0,
  estimated_minutes  int,
  created_at         timestamptz not null default now()
);

create table if not exists public.lesson_blocks (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  theme_id    uuid not null references public.themes(id) on delete cascade,
  order_index int  not null default 0,
  type        text not null check (type in ('text', 'video', 'quiz', 'code_challenge', 'game')),
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.theme_assignments (
  id           uuid primary key default gen_random_uuid(),
  theme_id     uuid not null references public.themes(id),
  class_id     uuid not null references public.classes(id),
  teacher_id   uuid not null references public.profiles(id),
  scheduled_at timestamptz,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create table if not exists public.theme_validations (
  id           uuid primary key default gen_random_uuid(),
  theme_id     uuid not null references public.themes(id),
  from_status  text,
  to_status    text not null,
  changed_by   uuid references public.profiles(id),
  comment      text,
  changed_at   timestamptz not null default now()
);

-- ── Triggers updated_at ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists themes_updated_at        on public.themes;
drop trigger if exists lesson_blocks_updated_at on public.lesson_blocks;

create trigger themes_updated_at         before update on public.themes
  for each row execute function public.set_updated_at();
create trigger lesson_blocks_updated_at  before update on public.lesson_blocks
  for each row execute function public.set_updated_at();

-- ── Helper functions ──────────────────────────────────────────────────────────

create or replace function public.theme_status(p_id uuid)
returns text language sql security definer stable as $$
  select status from public.themes where id = p_id;
$$;

create or replace function public.theme_creator(p_id uuid)
returns uuid language sql security definer stable as $$
  select created_by from public.themes where id = p_id;
$$;

-- ── RLS — themes ─────────────────────────────────────────────────────────────

alter table public.themes enable row level security;

drop policy if exists "admin_all_themes"                on public.themes;
drop policy if exists "manager_select_themes"           on public.themes;
drop policy if exists "manager_insert_themes"           on public.themes;
drop policy if exists "manager_update_own_draft"        on public.themes;
drop policy if exists "teacher_student_read_published"  on public.themes;

create policy "admin_all_themes" on public.themes
  for all using (get_my_role() = 'admin');

create policy "manager_select_themes" on public.themes for select
  using (get_my_role() = 'manager' and (status <> 'draft' or created_by = auth.uid()));

create policy "manager_insert_themes" on public.themes for insert
  with check (get_my_role() = 'manager' and created_by = auth.uid());

create policy "manager_update_own_draft" on public.themes for update
  using (get_my_role() = 'manager' and created_by = auth.uid() and status = 'draft');

create policy "teacher_student_read_published" on public.themes for select
  using (get_my_role() in ('teacher', 'student', 'parent') and status = 'published');

-- ── RLS — chapters ───────────────────────────────────────────────────────────

alter table public.chapters enable row level security;

drop policy if exists "admin_all_chapters"                        on public.chapters;
drop policy if exists "manager_select_chapters"                   on public.chapters;
drop policy if exists "manager_write_draft_chapters"              on public.chapters;
drop policy if exists "manager_update_draft_chapters"             on public.chapters;
drop policy if exists "manager_delete_draft_chapters"             on public.chapters;
drop policy if exists "teacher_student_read_published_chapters"   on public.chapters;

create policy "admin_all_chapters" on public.chapters
  for all using (get_my_role() = 'admin');

create policy "manager_select_chapters" on public.chapters for select
  using (get_my_role() = 'manager' and (theme_status(theme_id) <> 'draft' or theme_creator(theme_id) = auth.uid()));

create policy "manager_write_draft_chapters" on public.chapters for insert
  with check (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "manager_update_draft_chapters" on public.chapters for update
  using (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "manager_delete_draft_chapters" on public.chapters for delete
  using (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "teacher_student_read_published_chapters" on public.chapters for select
  using (get_my_role() in ('teacher', 'student') and theme_status(theme_id) = 'published');

-- ── RLS — lessons ────────────────────────────────────────────────────────────

alter table public.lessons enable row level security;

drop policy if exists "admin_all_lessons"                       on public.lessons;
drop policy if exists "manager_select_lessons"                  on public.lessons;
drop policy if exists "manager_write_draft_lessons"             on public.lessons;
drop policy if exists "manager_update_draft_lessons"            on public.lessons;
drop policy if exists "manager_delete_draft_lessons"            on public.lessons;
drop policy if exists "teacher_student_read_published_lessons"  on public.lessons;

create policy "admin_all_lessons" on public.lessons
  for all using (get_my_role() = 'admin');

create policy "manager_select_lessons" on public.lessons for select
  using (get_my_role() = 'manager' and (theme_status(theme_id) <> 'draft' or theme_creator(theme_id) = auth.uid()));

create policy "manager_write_draft_lessons" on public.lessons for insert
  with check (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "manager_update_draft_lessons" on public.lessons for update
  using (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "manager_delete_draft_lessons" on public.lessons for delete
  using (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "teacher_student_read_published_lessons" on public.lessons for select
  using (get_my_role() in ('teacher', 'student') and theme_status(theme_id) = 'published');

-- ── RLS — lesson_blocks ──────────────────────────────────────────────────────

alter table public.lesson_blocks enable row level security;

drop policy if exists "admin_all_blocks"                       on public.lesson_blocks;
drop policy if exists "manager_select_blocks"                  on public.lesson_blocks;
drop policy if exists "manager_write_draft_blocks"             on public.lesson_blocks;
drop policy if exists "manager_update_draft_blocks"            on public.lesson_blocks;
drop policy if exists "manager_delete_draft_blocks"            on public.lesson_blocks;
drop policy if exists "teacher_student_read_published_blocks"  on public.lesson_blocks;

create policy "admin_all_blocks" on public.lesson_blocks
  for all using (get_my_role() = 'admin');

create policy "manager_select_blocks" on public.lesson_blocks for select
  using (get_my_role() = 'manager' and (theme_status(theme_id) <> 'draft' or theme_creator(theme_id) = auth.uid()));

create policy "manager_write_draft_blocks" on public.lesson_blocks for insert
  with check (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "manager_update_draft_blocks" on public.lesson_blocks for update
  using (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "manager_delete_draft_blocks" on public.lesson_blocks for delete
  using (get_my_role() = 'manager' and theme_status(theme_id) = 'draft' and theme_creator(theme_id) = auth.uid());

create policy "teacher_student_read_published_blocks" on public.lesson_blocks for select
  using (get_my_role() in ('teacher', 'student') and theme_status(theme_id) = 'published');

-- ── RLS — theme_assignments ──────────────────────────────────────────────────

alter table public.theme_assignments enable row level security;

drop policy if exists "admin_all_assignments"        on public.theme_assignments;
drop policy if exists "manager_all_assignments"      on public.theme_assignments;
drop policy if exists "teacher_read_own_assignments" on public.theme_assignments;

create policy "admin_all_assignments" on public.theme_assignments
  for all using (get_my_role() = 'admin');

create policy "manager_all_assignments" on public.theme_assignments
  for all using (get_my_role() = 'manager');

create policy "teacher_read_own_assignments" on public.theme_assignments for select
  using (get_my_role() = 'teacher' and teacher_id = auth.uid());

-- ── RLS — theme_validations ──────────────────────────────────────────────────

alter table public.theme_validations enable row level security;

drop policy if exists "admin_all_validations"        on public.theme_validations;
drop policy if exists "manager_read_own_validations" on public.theme_validations;

create policy "admin_all_validations" on public.theme_validations
  for all using (get_my_role() = 'admin');

create policy "manager_read_own_validations" on public.theme_validations for select
  using (get_my_role() = 'manager' and theme_creator(theme_id) = auth.uid());
