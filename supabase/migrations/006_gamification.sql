-- ── 006_gamification.sql ────────────────────────────────────────────────────

-- Extend students table
alter table public.students
  add column if not exists xp           int  not null default 0,
  add column if not exists coins        int  not null default 0,
  add column if not exists level_num    int  not null default 1,
  add column if not exists streak_days  int  not null default 0,
  add column if not exists last_activity date;

-- ── lesson_progress ──────────────────────────────────────────────────────────
create table if not exists public.lesson_progress (
  id           uuid        primary key default gen_random_uuid(),
  student_id   uuid        not null references public.students(id) on delete cascade,
  lesson_id    uuid        not null references public.lessons(id)  on delete cascade,
  status       text        not null default 'not_started'
               check (status in ('not_started','in_progress','completed')),
  score        numeric(5,2),
  attempts     int         not null default 0,
  completed_at timestamptz,
  unique (student_id, lesson_id)
);

-- ── gamification_events ───────────────────────────────────────────────────────
create table if not exists public.gamification_events (
  id           uuid        primary key default gen_random_uuid(),
  student_id   uuid        not null references public.students(id) on delete cascade,
  event_type   text        not null,
  payload      jsonb       not null default '{}',
  processed    boolean     not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists gamif_events_student_idx on public.gamification_events(student_id);
create index if not exists gamif_events_unprocessed  on public.gamification_events(processed) where processed = false;

-- ── student_achievements ──────────────────────────────────────────────────────
create table if not exists public.student_achievements (
  id         uuid        primary key default gen_random_uuid(),
  student_id uuid        not null references public.students(id) on delete cascade,
  badge_id   text        not null,
  earned_at  timestamptz not null default now(),
  unique (student_id, badge_id)
);

-- ── student_avatar ────────────────────────────────────────────────────────────
create table if not exists public.student_avatar (
  student_id  uuid primary key references public.students(id) on delete cascade,
  base        text not null default 'robot_blue',
  hat         text,
  accessory   text,
  color       text not null default '#3B82F6',
  updated_at  timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.lesson_progress      enable row level security;
alter table public.gamification_events  enable row level security;
alter table public.student_achievements enable row level security;
alter table public.student_avatar       enable row level security;

drop policy if exists "admin_all_lesson_progress"    on public.lesson_progress;
drop policy if exists "teacher_read_lesson_progress" on public.lesson_progress;
drop policy if exists "student_own_lesson_progress"  on public.lesson_progress;
create policy "admin_all_lesson_progress"    on public.lesson_progress for all    using (get_my_role() = 'admin');
create policy "teacher_read_lesson_progress" on public.lesson_progress for select using (get_my_role() = 'teacher');
create policy "student_own_lesson_progress"  on public.lesson_progress for all    using (
  get_my_role() = 'student'
  and student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "admin_all_gamif"   on public.gamification_events;
drop policy if exists "student_own_gamif" on public.gamification_events;
create policy "admin_all_gamif"   on public.gamification_events for all using (get_my_role() = 'admin');
create policy "student_own_gamif" on public.gamification_events for all using (
  get_my_role() = 'student'
  and student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "admin_all_achievements"    on public.student_achievements;
drop policy if exists "teacher_read_achievements" on public.student_achievements;
drop policy if exists "student_own_achievements"  on public.student_achievements;
create policy "admin_all_achievements"    on public.student_achievements for all    using (get_my_role() = 'admin');
create policy "teacher_read_achievements" on public.student_achievements for select using (get_my_role() = 'teacher');
create policy "student_own_achievements"  on public.student_achievements for all    using (
  get_my_role() = 'student'
  and student_id in (select id from public.students where profile_id = auth.uid())
);

drop policy if exists "admin_all_avatar"   on public.student_avatar;
drop policy if exists "student_own_avatar" on public.student_avatar;
create policy "admin_all_avatar"   on public.student_avatar for all using (get_my_role() = 'admin');
create policy "student_own_avatar" on public.student_avatar for all using (
  get_my_role() = 'student'
  and student_id in (select id from public.students where profile_id = auth.uid())
);
