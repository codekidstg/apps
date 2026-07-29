-- ── 005_grades_logs.sql ──────────────────────────────────────────────────────

-- ── Table : grades ────────────────────────────────────────────────────────────

create table if not exists public.grades (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  theme_id   uuid not null references public.themes(id)   on delete cascade,
  score      numeric(5,2) check (score between 0 and 100),
  comment    text,
  graded_at  timestamptz not null default now(),
  unique (teacher_id, student_id, theme_id)
);

-- ── Table : access_logs ───────────────────────────────────────────────────────

create table if not exists public.access_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id)  on delete cascade,
  theme_id    uuid not null references public.themes(id)   on delete cascade,
  ip          text,
  user_agent  text,
  suspicious  boolean not null default false,
  accessed_at timestamptz not null default now()
);

create index if not exists access_logs_user_id_idx       on public.access_logs(user_id);
create index if not exists access_logs_suspicious_idx    on public.access_logs(suspicious) where suspicious = true;
create index if not exists access_logs_accessed_at_idx   on public.access_logs(accessed_at);

-- ── Fonction : log_lesson_access ─────────────────────────────────────────────
-- Insère un log et marque suspicious si > 15 leçons dans les 60 dernières secondes

create or replace function public.log_lesson_access(
  p_user_id   uuid,
  p_lesson_id uuid,
  p_theme_id  uuid,
  p_ip        text default null,
  p_ua        text default null
)
returns void language plpgsql security definer as $$
declare
  v_recent int;
  v_suspicious boolean;
begin
  select count(*) into v_recent
  from public.access_logs
  where user_id = p_user_id
    and accessed_at > now() - interval '60 seconds';

  v_suspicious := v_recent >= 15;

  insert into public.access_logs (user_id, lesson_id, theme_id, ip, user_agent, suspicious)
  values (p_user_id, p_lesson_id, p_theme_id, p_ip, p_ua, v_suspicious);
end;
$$;

-- ── RLS — grades ──────────────────────────────────────────────────────────────

alter table public.grades enable row level security;

drop policy if exists "admin_all_grades"          on public.grades;
drop policy if exists "teacher_manage_own_grades" on public.grades;
drop policy if exists "student_read_own_grades"   on public.grades;

create policy "admin_all_grades" on public.grades
  for all using (get_my_role() = 'admin');

create policy "teacher_manage_own_grades" on public.grades
  for all using (get_my_role() = 'teacher' and teacher_id = auth.uid());

create policy "student_read_own_grades" on public.grades
  for select using (get_my_role() = 'student' and student_id = auth.uid());

-- ── RLS — access_logs ────────────────────────────────────────────────────────

alter table public.access_logs enable row level security;

drop policy if exists "admin_all_logs"   on public.access_logs;
drop policy if exists "insert_own_log"   on public.access_logs;

create policy "admin_all_logs" on public.access_logs
  for all using (get_my_role() = 'admin');

-- Le prof peut insérer ses propres logs (via la fonction security definer)
create policy "insert_own_log" on public.access_logs
  for insert with check (user_id = auth.uid());

-- ── RLS — classes (si pas encore créées dans 001) ────────────────────────────

drop policy if exists "admin_all_classes"         on public.classes;
drop policy if exists "teacher_read_own_classes"  on public.classes;
drop policy if exists "student_read_own_classes"  on public.classes;

create policy "admin_all_classes" on public.classes
  for all using (get_my_role() = 'admin');

create policy "teacher_read_own_classes" on public.classes
  for select using (get_my_role() = 'teacher' and teacher_id = auth.uid());

create policy "student_read_own_classes" on public.classes
  for select using (
    get_my_role() = 'student' and exists (
      select 1 from public.class_enrollments ce
      join public.students s on s.id = ce.student_id
      where ce.class_id = classes.id and s.profile_id = auth.uid()
    )
  );

-- ── RLS — class_enrollments ──────────────────────────────────────────────────

drop policy if exists "admin_all_enrollments"        on public.class_enrollments;
drop policy if exists "teacher_read_own_enrollments" on public.class_enrollments;
drop policy if exists "student_read_own_enrollment"  on public.class_enrollments;

create policy "admin_all_enrollments" on public.class_enrollments
  for all using (get_my_role() = 'admin');

create policy "teacher_read_own_enrollments" on public.class_enrollments
  for select using (
    get_my_role() = 'teacher' and exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

create policy "student_read_own_enrollment" on public.class_enrollments
  for select using (
    get_my_role() = 'student' and exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );
