-- ============================================================
-- CodeKids — Schéma initial
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- ============================================================

-- Types énumérés
create type public.role_type as enum ('admin', 'manager', 'teacher', 'student', 'parent');
create type public.level_type as enum ('explorer', 'builder', 'architect');
create type public.subscription_status as enum ('active', 'inactive', 'trial', 'cancelled');
create type public.subscription_period as enum ('monthly', 'annual');

-- ============================================================
-- TABLE : profiles
-- Étend auth.users — un profil par utilisateur
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.role_type not null default 'student',
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Mise à jour automatique de updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.role_type, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TABLE : students
-- Données spécifiques aux élèves
-- ============================================================
create table public.students (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  level      public.level_type not null default 'explorer',
  points     integer not null default 0 check (points >= 0),
  badges     text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE : classes
-- Un groupe d'élèves animé par un professeur
-- ============================================================
create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  level      public.level_type not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLE : class_enrollments
-- Relation élève ↔ classe
-- ============================================================
create table public.class_enrollments (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.classes(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (class_id, student_id)
);

-- ============================================================
-- TABLE : parent_student_links
-- Un parent peut suivre un ou plusieurs enfants
-- ============================================================
create table public.parent_student_links (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ============================================================
-- TABLE : subscriptions
-- Abonnement mensuel ou annuel par enfant et par niveau
-- ============================================================
create table public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  level      public.level_type not null,
  period     public.subscription_period not null,
  status     public.subscription_status not null default 'trial',
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Fonction utilitaire : récupère le rôle de l'utilisateur connecté
-- Utilisée dans les policies RLS pour éviter la récursion
-- ============================================================
create or replace function public.get_my_role()
returns public.role_type language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- ACTIVATION ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles           enable row level security;
alter table public.students           enable row level security;
alter table public.classes            enable row level security;
alter table public.class_enrollments  enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.subscriptions      enable row level security;

-- ============================================================
-- POLICIES : profiles
-- ============================================================

-- Admin et Manager : accès complet
create policy "admin_manager_full_profiles"
  on public.profiles for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Chaque utilisateur lit et modifie son propre profil
create policy "own_profile_read"
  on public.profiles for select
  using (id = auth.uid());

create policy "own_profile_update"
  on public.profiles for update
  using (id = auth.uid());

-- Un parent peut lire le profil de ses enfants
create policy "parent_reads_children_profiles"
  on public.profiles for select
  using (
    public.get_my_role() = 'parent'
    and id in (
      select s.profile_id from public.students s
      join public.parent_student_links psl on psl.student_id = s.id
      where psl.parent_id = auth.uid()
    )
  );

-- Un professeur peut lire les profils de ses élèves
create policy "teacher_reads_student_profiles"
  on public.profiles for select
  using (
    public.get_my_role() = 'teacher'
    and id in (
      select s.profile_id from public.students s
      join public.class_enrollments ce on ce.student_id = s.id
      join public.classes c on c.id = ce.class_id
      where c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES : students
-- ============================================================

create policy "admin_manager_full_students"
  on public.students for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Un élève accède à ses propres données
create policy "student_own_data"
  on public.students for select
  using (profile_id = auth.uid());

-- Un parent lit les données de ses enfants
create policy "parent_reads_children_students"
  on public.students for select
  using (
    public.get_my_role() = 'parent'
    and id in (
      select student_id from public.parent_student_links
      where parent_id = auth.uid()
    )
  );

-- Un professeur lit les élèves de ses classes
create policy "teacher_reads_enrolled_students"
  on public.students for select
  using (
    public.get_my_role() = 'teacher'
    and id in (
      select ce.student_id from public.class_enrollments ce
      join public.classes c on c.id = ce.class_id
      where c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES : classes
-- ============================================================

create policy "admin_manager_full_classes"
  on public.classes for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Un professeur lit uniquement ses classes
create policy "teacher_reads_own_classes"
  on public.classes for select
  using (
    public.get_my_role() = 'teacher'
    and teacher_id = auth.uid()
  );

-- ============================================================
-- POLICIES : class_enrollments
-- ============================================================

create policy "admin_manager_full_enrollments"
  on public.class_enrollments for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "teacher_reads_own_enrollments"
  on public.class_enrollments for select
  using (
    public.get_my_role() = 'teacher'
    and class_id in (
      select id from public.classes where teacher_id = auth.uid()
    )
  );

create policy "student_reads_own_enrollments"
  on public.class_enrollments for select
  using (
    public.get_my_role() = 'student'
    and student_id in (
      select id from public.students where profile_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES : parent_student_links
-- ============================================================

create policy "admin_manager_full_links"
  on public.parent_student_links for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "parent_reads_own_links"
  on public.parent_student_links for select
  using (parent_id = auth.uid());

-- ============================================================
-- POLICIES : subscriptions
-- ============================================================

create policy "admin_manager_full_subscriptions"
  on public.subscriptions for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "parent_reads_own_subscriptions"
  on public.subscriptions for select
  using (parent_id = auth.uid());
-- ============================================================
-- CodeKids — Fix récursion RLS
-- Problème : get_my_role() interrogeait profiles, qui a des
-- policies interrogeant students, qui interrogent profiles → boucle.
-- Solution : lire le rôle depuis le JWT (app_metadata), jamais depuis une table.
-- ============================================================

-- Doit être droppée avant de changer le type de retour
drop function if exists public.get_my_role() cascade;

-- Nouvelle version de get_my_role() : lit le JWT, pas la DB
create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'student'
  );
$$;

-- ============================================================
-- Supprimer et recréer les policies profiles
-- (les policies cross-table comme parent_reads_children_profiles
--  sont remplacées par des fonctions security definer)
-- ============================================================

drop policy if exists "admin_manager_full_profiles"         on public.profiles;
drop policy if exists "own_profile_read"                    on public.profiles;
drop policy if exists "own_profile_update"                  on public.profiles;
drop policy if exists "parent_reads_children_profiles"      on public.profiles;
drop policy if exists "teacher_reads_student_profiles"      on public.profiles;

-- Admin/Manager : accès complet (rôle lu depuis JWT)
create policy "admin_manager_full_profiles"
  on public.profiles for all
  using (public.get_my_role() in ('admin', 'manager'));

-- Tout utilisateur lit et modifie son propre profil
create policy "own_profile_read"
  on public.profiles for select
  using (id = auth.uid());

create policy "own_profile_update"
  on public.profiles for update
  using (id = auth.uid());

-- Parent : voit les profils de ses enfants via une fonction security definer
-- (évite la récursion : la fonction bypass RLS)
create or replace function public.get_my_children_profile_ids()
returns setof uuid language sql security definer stable as $$
  select s.profile_id
  from public.students s
  join public.parent_student_links psl on psl.student_id = s.id
  where psl.parent_id = auth.uid();
$$;

create policy "parent_reads_children_profiles"
  on public.profiles for select
  using (
    public.get_my_role() = 'parent'
    and id in (select public.get_my_children_profile_ids())
  );

-- Professeur : voit les profils de ses élèves via une fonction security definer
create or replace function public.get_my_students_profile_ids()
returns setof uuid language sql security definer stable as $$
  select s.profile_id
  from public.students s
  join public.class_enrollments ce on ce.student_id = s.id
  join public.classes c on c.id = ce.class_id
  where c.teacher_id = auth.uid();
$$;

create policy "teacher_reads_student_profiles"
  on public.profiles for select
  using (
    public.get_my_role() = 'teacher'
    and id in (select public.get_my_students_profile_ids())
  );

-- ============================================================
-- Recréer les policies students (idem)
-- ============================================================

drop policy if exists "admin_manager_full_students"        on public.students;
drop policy if exists "student_own_data"                   on public.students;
drop policy if exists "parent_reads_children_students"     on public.students;
drop policy if exists "teacher_reads_enrolled_students"    on public.students;

create policy "admin_manager_full_students"
  on public.students for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "student_own_data"
  on public.students for select
  using (profile_id = auth.uid());

create or replace function public.get_my_children_student_ids()
returns setof uuid language sql security definer stable as $$
  select student_id from public.parent_student_links where parent_id = auth.uid();
$$;

create policy "parent_reads_children_students"
  on public.students for select
  using (
    public.get_my_role() = 'parent'
    and id in (select public.get_my_children_student_ids())
  );

create or replace function public.get_my_enrolled_student_ids()
returns setof uuid language sql security definer stable as $$
  select ce.student_id
  from public.class_enrollments ce
  join public.classes c on c.id = ce.class_id
  where c.teacher_id = auth.uid();
$$;

create policy "teacher_reads_enrolled_students"
  on public.students for select
  using (
    public.get_my_role() = 'teacher'
    and id in (select public.get_my_enrolled_student_ids())
  );

-- ============================================================
-- Recréer les policies classes
-- ============================================================

drop policy if exists "admin_manager_full_classes"    on public.classes;
drop policy if exists "teacher_reads_own_classes"     on public.classes;

create policy "admin_manager_full_classes"
  on public.classes for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "teacher_reads_own_classes"
  on public.classes for select
  using (
    public.get_my_role() = 'teacher'
    and teacher_id = auth.uid()
  );

-- ============================================================
-- Recréer les policies class_enrollments
-- ============================================================

drop policy if exists "admin_manager_full_enrollments"   on public.class_enrollments;
drop policy if exists "teacher_reads_own_enrollments"    on public.class_enrollments;
drop policy if exists "student_reads_own_enrollments"    on public.class_enrollments;

create policy "admin_manager_full_enrollments"
  on public.class_enrollments for all
  using (public.get_my_role() in ('admin', 'manager'));

create or replace function public.get_my_class_ids()
returns setof uuid language sql security definer stable as $$
  select id from public.classes where teacher_id = auth.uid();
$$;

create policy "teacher_reads_own_enrollments"
  on public.class_enrollments for select
  using (
    public.get_my_role() = 'teacher'
    and class_id in (select public.get_my_class_ids())
  );

create or replace function public.get_my_student_id()
returns uuid language sql security definer stable as $$
  select id from public.students where profile_id = auth.uid() limit 1;
$$;

create policy "student_reads_own_enrollments"
  on public.class_enrollments for select
  using (
    public.get_my_role() = 'student'
    and student_id = public.get_my_student_id()
  );

-- ============================================================
-- Recréer les policies parent_student_links
-- ============================================================

drop policy if exists "admin_manager_full_links"   on public.parent_student_links;
drop policy if exists "parent_reads_own_links"     on public.parent_student_links;

create policy "admin_manager_full_links"
  on public.parent_student_links for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "parent_reads_own_links"
  on public.parent_student_links for select
  using (parent_id = auth.uid());

-- ============================================================
-- Recréer les policies subscriptions
-- ============================================================

drop policy if exists "admin_manager_full_subscriptions"  on public.subscriptions;
drop policy if exists "parent_reads_own_subscriptions"    on public.subscriptions;

create policy "admin_manager_full_subscriptions"
  on public.subscriptions for all
  using (public.get_my_role() in ('admin', 'manager'));

create policy "parent_reads_own_subscriptions"
  on public.subscriptions for select
  using (parent_id = auth.uid());
-- ── 003_schools.sql ─────────────────────────────────────────────────────────

create table if not exists public.schools (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text,
  country    text not null default 'Togo',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null,
  add column if not exists active    boolean not null default true;

alter table public.schools enable row level security;

drop policy if exists "admin_all_schools"             on public.schools;
drop policy if exists "manager_teacher_read_schools"  on public.schools;

create policy "admin_all_schools" on public.schools
  for all using (get_my_role() = 'admin');

create policy "manager_teacher_read_schools" on public.schools
  for select using (get_my_role() in ('manager', 'teacher'));
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
-- ============================================================
-- 007 — Espace Parent + Paiements
-- ============================================================

-- ── parent_children ─────────────────────────────────────────
create table if not exists public.parent_children (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id)  on delete cascade,
  linked_by  uuid references public.profiles(id),          -- admin qui a fait le lien
  linked_at  timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ── parental_consents ────────────────────────────────────────
create table if not exists public.parental_consents (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.students(id)  on delete cascade,
  version     text not null default 'v1',
  consented_at timestamptz not null default now(),
  ip          text,
  user_agent  text,
  revoked_at  timestamptz,
  unique (parent_id, student_id, version)
);

-- ── subscription_plans ──────────────────────────────────────
create table if not exists public.subscription_plans (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  plan_type    text not null check (plan_type in ('freemium','premium','b2b')),
  price_fcfa   int  not null default 0,
  billing_cycle text not null check (billing_cycle in ('month','year','lifetime')) default 'month',
  features     jsonb not null default '[]',
  active       boolean not null default true
);

-- Plans par défaut
insert into public.subscription_plans (name, plan_type, price_fcfa, billing_cycle, features) values
  ('Freemium',       'freemium', 0,     'month',    '["2 premières leçons par zone","Avatar basique","Progression visible parent"]'),
  ('Premium Mensuel','premium',  2000,  'month',    '["Tout le contenu débloqué","Badges premium","Certificats PDF","Avatars exclusifs"]'),
  ('Premium Annuel', 'premium',  18000, 'year',     '["Tout le contenu débloqué","Badges premium","Certificats PDF","Avatars exclusifs","2 mois offerts"]'),
  ('Licence École',  'b2b',      0,     'lifetime', '["Par classe ou école","Rapports CSV","Support prioritaire"]')
on conflict do nothing;

-- ── subscriptions ────────────────────────────────────────────
create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.students(id)  on delete cascade,
  plan_id     uuid not null references public.subscription_plans(id),
  status      text not null check (status in ('trial','active','cancelled','expired')) default 'trial',
  provider    text not null check (provider in ('cinetpay','cash','b2b','free')) default 'free',
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ── payments ─────────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  parent_id       uuid not null references public.profiles(id) on delete cascade,
  amount_fcfa     int  not null,
  provider        text not null check (provider in ('cinetpay','cash','b2b')),
  provider_tx_id  text,
  status          text not null check (status in ('pending','success','failed')) default 'pending',
  -- cash fields
  cash_date       date,
  cash_ref        text,
  cash_note       text,
  cash_validated_by uuid references public.profiles(id),
  cash_validated_at timestamptz,
  -- webhook
  webhook_payload jsonb,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ── certificates ────────────────────────────────────────────
create table if not exists public.certificates (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students(id) on delete cascade,
  theme_id        uuid references public.themes(id) on delete set null,
  level_num       int,                                    -- null = certificat thème, int = diplôme niveau
  cert_type       text not null check (cert_type in ('theme','level')),
  score           numeric(5,2),
  total_xp        int,
  issued_at       timestamptz not null default now(),
  validated_by    uuid references public.profiles(id),    -- prof qui valide
  validated_at    timestamptz,
  pdf_path        text,                                   -- chemin Supabase Storage
  verify_hash     text,                                   -- SHA-256 court
  revoked         boolean not null default false,
  unique (student_id, theme_id, cert_type)
);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.parent_children     enable row level security;
alter table public.parental_consents   enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.payments            enable row level security;
alter table public.certificates        enable row level security;

-- parent_children
drop policy if exists "admin_parent_children"   on public.parent_children;
drop policy if exists "parent_read_own_children" on public.parent_children;
create policy "admin_parent_children"    on public.parent_children for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_read_own_children" on public.parent_children for select
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- parental_consents
drop policy if exists "admin_consents"  on public.parental_consents;
drop policy if exists "parent_consents" on public.parental_consents;
create policy "admin_consents"  on public.parental_consents for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_consents" on public.parental_consents for all
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- subscriptions
drop policy if exists "admin_subscriptions"  on public.subscriptions;
drop policy if exists "parent_subscriptions" on public.subscriptions;
create policy "admin_subscriptions"  on public.subscriptions for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_subscriptions" on public.subscriptions for all
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- payments
drop policy if exists "admin_payments"  on public.payments;
drop policy if exists "parent_payments" on public.payments;
create policy "admin_payments"  on public.payments for all
  using (get_my_role() in ('admin','manager'));
create policy "parent_payments" on public.payments for all
  using (get_my_role() = 'parent' and parent_id = auth.uid());

-- certificates
drop policy if exists "admin_certificates"   on public.certificates;
drop policy if exists "teacher_certificates" on public.certificates;
drop policy if exists "parent_certificates"  on public.certificates;
drop policy if exists "student_certificates" on public.certificates;
create policy "admin_certificates"   on public.certificates for all
  using (get_my_role() in ('admin','manager'));
create policy "teacher_certificates" on public.certificates for all
  using (get_my_role() = 'teacher');
create policy "student_certificates" on public.certificates for select
  using (get_my_role() = 'student'
    and student_id in (select id from public.students where profile_id = auth.uid()));
create policy "parent_certificates"  on public.certificates for select
  using (get_my_role() = 'parent'
    and student_id in (
      select pc.student_id from public.parent_children pc where pc.parent_id = auth.uid()
    ));
-- Fix: get_my_children_* functions must read from parent_children (migration 007)
-- not from parent_student_links (old table from migration 002)

create or replace function public.get_my_children_student_ids()
returns setof uuid language sql security definer stable as $$
  select student_id from public.parent_children where parent_id = auth.uid();
$$;

create or replace function public.get_my_children_profile_ids()
returns setof uuid language sql security definer stable as $$
  select s.profile_id
  from public.students s
  join public.parent_children pc on pc.student_id = s.id
  where pc.parent_id = auth.uid();
$$;

-- subscription_plans est du contenu public : tout utilisateur authentifié peut lire
drop policy if exists "anyone_reads_plans" on public.subscription_plans;
create policy "anyone_reads_plans"
  on public.subscription_plans for select
  using (auth.role() = 'authenticated');
-- ── Migration 009 — Niveaux 2 & 3 + éditeur code ────────────────────────────

-- 1. Ajouter code_challenge comme type valide de lesson_block
alter table public.lesson_blocks drop constraint if exists lesson_blocks_type_check;
alter table public.lesson_blocks add constraint lesson_blocks_type_check
  check (type in ('text', 'video', 'quiz', 'code_challenge', 'game', 'blockly'));

-- 2. ── NIVEAU 2 — Les Bâtisseurs (12-15 ans) ─────────────────────────────────

-- Thème 2A : Python pour les Bâtisseurs
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b2000001-0000-0000-0000-000000000001', 'Python pour les Bâtisseurs', 'builder', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

-- Chapitres du thème Python
insert into public.chapters (id, theme_id, title, order_index) values
  ('b2001001-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Variables & Types',   1),
  ('b2001002-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Conditions & Logique',2),
  ('b2001003-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Boucles & Répétitions',3),
  ('b2001004-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Fonctions',           4)
on conflict (id) do nothing;

-- Leçons : Variables & Types
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002001-0000-0000-0000-000000000001','b2001001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Les variables : stocker de l''information', 1, 50),
  ('b2002002-0000-0000-0000-000000000001','b2001001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Nombres, textes et booléens', 2, 50),
  ('b2002003-0000-0000-0000-000000000001','b2001001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Calculer avec Python', 3, 60)
on conflict (id) do nothing;

-- Leçons : Conditions
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002004-0000-0000-0000-000000000001','b2001002-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Si… alors… sinon (if/else)', 1, 60),
  ('b2002005-0000-0000-0000-000000000001','b2001002-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Comparer des valeurs', 2, 60),
  ('b2002006-0000-0000-0000-000000000001','b2001002-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Projet : Calculateur de note', 3, 80)
on conflict (id) do nothing;

-- Leçons : Boucles
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002007-0000-0000-0000-000000000001','b2001003-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','La boucle for', 1, 60),
  ('b2002008-0000-0000-0000-000000000001','b2001003-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','La boucle while', 2, 60),
  ('b2002009-0000-0000-0000-000000000001','b2001003-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Projet : Table de multiplication', 3, 80)
on conflict (id) do nothing;

-- Leçons : Fonctions
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002010-0000-0000-0000-000000000001','b2001004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Créer ses propres fonctions', 1, 70),
  ('b2002011-0000-0000-0000-000000000001','b2001004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Paramètres et valeur de retour', 2, 70),
  ('b2002012-0000-0000-0000-000000000001','b2001004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Projet final : Mini-calculatrice', 3, 100)
on conflict (id) do nothing;

-- Blocs de leçon : Variables (leçon 1)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b2002001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🗃️ Une variable, c''est quoi ?</h2><p>Imagine une boîte avec une étiquette. Tu mets quelque chose dedans et tu peux t''y référer par son nom.</p><pre><code>prenom = \"Amavi\"\nage = 14\nprint(prenom, \"a\", age, \"ans\")</code></pre><p>En Python, on crée une variable en écrivant <strong>nom = valeur</strong>. C''est aussi simple que ça !</p>"}'),
  ('b2002001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Crée une variable <code>ville</code> avec la valeur <strong>\"Lomé\"</strong> et affiche-la.</p>","starter_code":"# Crée ta variable ici\n\n","expected_output":"Lomé","required":true}'),
  ('b2002001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 3, 'quiz',
   '{"question":"Que fait ce code ? x = 5 ; print(x)","choices":["Affiche la lettre x","Affiche le chiffre 5","Crée une erreur","Affiche x = 5"],"answer":1,"explanation":"x vaut 5, donc print(x) affiche 5."}')
on conflict do nothing;

-- Blocs : if/else (leçon 4)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b2002004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🚦 Prendre des décisions avec if/else</h2><p>En Python, tu peux faire exécuter du code <em>seulement si une condition est vraie</em>.</p><pre><code>note = 15\nif note >= 10:\n    print(\"Reçu !\")\nelse:\n    print(\"Ajourné\")</code></pre><p><strong>Attention :</strong> l''indentation (les espaces) est obligatoire en Python !</p>"}'),
  ('b2002004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Complète le code pour qu''il affiche <strong>Majeur</strong> si <code>age</code> est ≥ 18, sinon <strong>Mineur</strong>.</p>","starter_code":"age = 16\n# Complète ici\n","hidden_tests":"# test\nage = 18\nimport io, sys; buf=io.StringIO(); sys.stdout=buf\nif age >= 18:\n    print(\"Majeur\")\nelse:\n    print(\"Mineur\")\nsys.stdout=sys.__stdout__","expected_output":"Mineur","required":true}')
on conflict do nothing;

-- Blocs : boucle for (leçon 7)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b2002007-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🔁 Répéter avec for</h2><p>La boucle <code>for</code> permet de répéter du code un certain nombre de fois.</p><pre><code>for i in range(5):\n    print(\"Tour\", i)</code></pre><p><code>range(5)</code> génère les nombres 0, 1, 2, 3, 4.</p>"}'),
  ('b2002007-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Affiche les chiffres de <strong>1 à 5</strong> (inclus), un par ligne.</p>","starter_code":"# Ta boucle ici\n","expected_output":"1\n2\n3\n4\n5","required":true}')
on conflict do nothing;

-- 3. ── NIVEAU 2 — Thème 2B : HTML & CSS ────────────────────────────────────

insert into public.themes (id, title, level, status, version, created_by)
values
  ('b2000002-0000-0000-0000-000000000001', 'Construire des pages web', 'builder', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b2003001-0000-0000-0000-000000000001', 'b2000002-0000-0000-0000-000000000001', 'HTML — La structure',   1),
  ('b2003002-0000-0000-0000-000000000001', 'b2000002-0000-0000-0000-000000000001', 'CSS — Le style',        2),
  ('b2003003-0000-0000-0000-000000000001', 'b2000002-0000-0000-0000-000000000001', 'Ma première page web',  3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2004001-0000-0000-0000-000000000001','b2003001-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Structure d''une page HTML', 1, 50),
  ('b2004002-0000-0000-0000-000000000001','b2003001-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Titres, paragraphes et liens', 2, 50),
  ('b2004003-0000-0000-0000-000000000001','b2003002-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Couleurs et polices avec CSS', 3, 60),
  ('b2004004-0000-0000-0000-000000000001','b2003003-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Projet : Ma page de présentation', 4, 100)
on conflict (id) do nothing;

-- 4. ── NIVEAU 2 — Thème 2C : Citoyenneté Numérique ────────────────────────

insert into public.themes (id, title, level, status, version, created_by)
values
  ('b2000003-0000-0000-0000-000000000001', 'Hygiène & Citoyenneté Numériques', 'builder', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b2005001-0000-0000-0000-000000000001', 'b2000003-0000-0000-0000-000000000001', 'Sécurité en ligne',         1),
  ('b2005002-0000-0000-0000-000000000001', 'b2000003-0000-0000-0000-000000000001', 'Vie privée & données',      2),
  ('b2005003-0000-0000-0000-000000000001', 'b2000003-0000-0000-0000-000000000001', 'Être citoyen du numérique', 3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2006001-0000-0000-0000-000000000001','b2005001-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Mots de passe forts : comment ?', 1, 40),
  ('b2006002-0000-0000-0000-000000000001','b2005001-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Reconnaître le phishing', 2, 50),
  ('b2006003-0000-0000-0000-000000000001','b2005002-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Tes données personnelles', 3, 40),
  ('b2006004-0000-0000-0000-000000000001','b2005002-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Les réseaux sociaux : avantages et risques', 4, 50),
  ('b2006005-0000-0000-0000-000000000001','b2005003-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Cyberharcèlement : reconnaître et agir', 5, 50),
  ('b2006006-0000-0000-0000-000000000001','b2005003-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Droits d''auteur et licences', 6, 40)
on conflict (id) do nothing;

-- 5. ── NIVEAU 3 — Les Architectes (15-18 ans) ───────────────────────────────

-- Thème 3A : Python Avancé + JavaScript
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000001-0000-0000-0000-000000000001', 'Python Avancé & JavaScript', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3001001-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'Listes & Dictionnaires',    1),
  ('b3001002-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'POO en Python',             2),
  ('b3001003-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'JavaScript Essentiel',      3),
  ('b3001004-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'Manipuler le DOM',          4)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3002001-0000-0000-0000-000000000001','b3001001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Listes et opérations', 1, 70),
  ('b3002002-0000-0000-0000-000000000001','b3001001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Dictionnaires : clés & valeurs', 2, 70),
  ('b3002003-0000-0000-0000-000000000001','b3001001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Compréhensions de listes', 3, 80),
  ('b3002004-0000-0000-0000-000000000001','b3001002-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Classes et objets', 4, 90),
  ('b3002005-0000-0000-0000-000000000001','b3001002-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Héritage et polymorphisme', 5, 90),
  ('b3002006-0000-0000-0000-000000000001','b3001003-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Variables, fonctions JS', 6, 70),
  ('b3002007-0000-0000-0000-000000000001','b3001003-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Tableaux & objets JS', 7, 70),
  ('b3002008-0000-0000-0000-000000000001','b3001004-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','querySelector et événements', 8, 80),
  ('b3002009-0000-0000-0000-000000000001','b3001004-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Projet : Mini-app interactive', 9, 120)
on conflict (id) do nothing;

-- Blocs : Listes (leçon 1 N3)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b3002001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>📋 Les listes Python</h2><p>Une liste stocke plusieurs valeurs dans une seule variable.</p><pre><code>fruits = [\"mangue\", \"papaye\", \"ananas\"]\nprint(fruits[0])  # mangue\nprint(len(fruits)) # 3\nfruits.append(\"goyave\")</code></pre>"}'),
  ('b3002001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Crée une liste <code>villes</code> avec Lomé, Accra et Abidjan. Affiche la 2e ville.</p>","starter_code":"villes = []\n# Complète ici\n","expected_output":"Accra","required":true}')
on conflict do nothing;

-- Thème 3B : Algorithmes & Structures de données
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000002-0000-0000-0000-000000000001', 'Algorithmes & Structures de données', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3003001-0000-0000-0000-000000000001', 'b3000002-0000-0000-0000-000000000001', 'Complexité & Tri',          1),
  ('b3003002-0000-0000-0000-000000000001', 'b3000002-0000-0000-0000-000000000001', 'Recherche & Récursivité',   2),
  ('b3003003-0000-0000-0000-000000000001', 'b3000002-0000-0000-0000-000000000001', 'Piles, Files & Graphes',    3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3004001-0000-0000-0000-000000000001','b3003001-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','C''est quoi un algorithme ?', 1, 60),
  ('b3004002-0000-0000-0000-000000000001','b3003001-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Tri à bulles et tri par sélection', 2, 80),
  ('b3004003-0000-0000-0000-000000000001','b3003001-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Complexité O(n) : évaluer la vitesse', 3, 80),
  ('b3004004-0000-0000-0000-000000000001','b3003002-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Recherche linéaire vs binaire', 4, 80),
  ('b3004005-0000-0000-0000-000000000001','b3003002-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Récursivité : la fonction qui s''appelle', 5, 90),
  ('b3004006-0000-0000-0000-000000000001','b3003003-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Piles (Stack) et Files (Queue)', 6, 80),
  ('b3004007-0000-0000-0000-000000000001','b3003003-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Graphes et parcours (BFS/DFS)', 7, 100)
on conflict (id) do nothing;

-- Thème 3C : Cybersécurité défensive & éthique
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000003-0000-0000-0000-000000000001', 'Cybersécurité Éthique & Défensive', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3005001-0000-0000-0000-000000000001', 'b3000003-0000-0000-0000-000000000001', 'Fondamentaux sécu',         1),
  ('b3005002-0000-0000-0000-000000000001', 'b3000003-0000-0000-0000-000000000001', 'Attaques courantes',        2),
  ('b3005003-0000-0000-0000-000000000001', 'b3000003-0000-0000-0000-000000000001', 'Défense & Éthique',         3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3006001-0000-0000-0000-000000000001','b3005001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Chiffrement : César → AES', 1, 70),
  ('b3006002-0000-0000-0000-000000000001','b3005001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Hachage et empreintes numériques', 2, 70),
  ('b3006003-0000-0000-0000-000000000001','b3005001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Authentification & 2FA', 3, 70),
  ('b3006004-0000-0000-0000-000000000001','b3005002-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Injection SQL — comment et pourquoi l''éviter', 4, 80),
  ('b3006005-0000-0000-0000-000000000001','b3005002-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','XSS et CSRF : attaques web', 5, 80),
  ('b3006006-0000-0000-0000-000000000001','b3005002-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Ingénierie sociale & phishing avancé', 6, 70),
  ('b3006007-0000-0000-0000-000000000001','b3005003-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','CTF débutant : résoudre un challenge', 7, 120),
  ('b3006008-0000-0000-0000-000000000001','b3005003-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Éthique du hacker : responsible disclosure', 8, 60)
on conflict (id) do nothing;

-- Blocs : Chiffrement César (leçon N3 sécu)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b3006001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🔐 Le chiffre de César</h2><p>César chiffrait ses messages en décalant chaque lettre de 3 positions.<br>A→D, B→E, TOGO→WRJR</p><p>C''est le chiffrement le plus simple — et le plus facile à casser !</p>"}'),
  ('b3006001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Implémente la fonction <code>cesar(texte, decalage)</code> qui chiffre un texte (lettres minuscules uniquement). Affiche le résultat pour <code>cesar(\"togo\", 3)</code>.</p>","starter_code":"def cesar(texte, decalage):\n    # Complète ici\n    pass\n\nprint(cesar(\"togo\", 3))\n","expected_output":"wrjr","required":true}')
on conflict do nothing;

-- Thème 3D : Bases de l'IA
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000004-0000-0000-0000-000000000001', 'Bases de l''Intelligence Artificielle', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3007001-0000-0000-0000-000000000001', 'b3000004-0000-0000-0000-000000000001', 'C''est quoi l''IA ?',       1),
  ('b3007002-0000-0000-0000-000000000001', 'b3000004-0000-0000-0000-000000000001', 'Machine Learning intro',    2),
  ('b3007003-0000-0000-0000-000000000001', 'b3000004-0000-0000-0000-000000000001', 'IA éthique & Afrique',      3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3008001-0000-0000-0000-000000000001','b3007001-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','IA, ML, Deep Learning : les différences', 1, 60),
  ('b3008002-0000-0000-0000-000000000001','b3007001-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Comment une machine apprend-elle ?', 2, 70),
  ('b3008003-0000-0000-0000-000000000001','b3007002-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Régression linéaire en Python', 3, 90),
  ('b3008004-0000-0000-0000-000000000001','b3007002-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Classification : spam ou non ?', 4, 90),
  ('b3008005-0000-0000-0000-000000000001','b3007003-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Biais algorithmiques : exemples africains', 5, 70),
  ('b3008006-0000-0000-0000-000000000001','b3007003-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','L''IA au service de l''Afrique : cas réels', 6, 70),
  ('b3008007-0000-0000-0000-000000000001','b3007003-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Projet final : Mon premier modèle ML', 7, 150)
on conflict (id) do nothing;
-- Colonne pour stocker le mot de passe initial défini par l'admin
-- Accessible uniquement par les admins (RLS), utile pour les tests et le partage de credentials

alter table public.profiles
  add column if not exists temp_password text default null;

-- Seul l'admin (service role) peut lire cette colonne via le client admin.
-- Les autres rôles ne voient pas cette valeur grâce à la RLS existante sur profiles.
-- Progression bloc par bloc (quiz, code, jeux)
-- Permet de reprendre une leçon là où on s'est arrêté, sur n'importe quel appareil

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS block_progress JSONB DEFAULT '{}'::jsonb;

-- Index pour accélerer les lectures par student+lesson
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson
  ON lesson_progress (student_id, lesson_id);
-- ══════════════════════════════════════════════════════════════════════════
-- 012 — Système d'Entraînement
-- Entraînements liés aux leçons, optionnels, répétables, disponibles toute l'année
-- ══════════════════════════════════════════════════════════════════════════

-- ── Table trainings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  xp_reward   INT  NOT NULL DEFAULT 30,
  order_index INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Table training_blocks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id  UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('text','quiz','code_challenge','game')),
  content      JSONB NOT NULL DEFAULT '{}',
  order_index  INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Table training_progress ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  training_id  UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  score        INT  DEFAULT 0,
  attempts     INT  DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, training_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trainings_lesson      ON trainings (lesson_id);
CREATE INDEX IF NOT EXISTS idx_training_blocks_train ON training_blocks (training_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_progress_std ON training_progress (student_id, training_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE trainings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- Trainings : lisibles par tous les authentifiés (élèves, profs, admins)
CREATE POLICY "trainings_select" ON trainings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "trainings_manage" ON trainings
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('admin','teacher')
  );

-- Training blocks : même logique
CREATE POLICY "training_blocks_select" ON training_blocks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "training_blocks_manage" ON training_blocks
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('admin','teacher')
  );

-- Training progress : chaque élève voit/modifie uniquement le sien
CREATE POLICY "training_progress_own" ON training_progress
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "training_progress_admin" ON training_progress
  FOR SELECT USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('admin','teacher')
  );
-- Ajoute blockly_challenge comme type valide dans training_blocks
ALTER TABLE training_blocks
  DROP CONSTRAINT IF EXISTS training_blocks_type_check;

ALTER TABLE training_blocks
  ADD CONSTRAINT training_blocks_type_check
  CHECK (type IN ('quiz', 'code_challenge', 'text', 'blockly_challenge'));
-- Ajoute les compétences par thème pour les certificats
ALTER TABLE themes ADD COLUMN IF NOT EXISTS competencies text[] DEFAULT ARRAY[]::text[];

-- Seed des compétences pour chaque thème
UPDATE themes SET competencies = ARRAY[
  'Syntaxe Python et types de données',
  'Structures de contrôle (if/else, boucles)',
  'Fonctions et portée des variables',
  'Manipulation de listes et dictionnaires',
  'Débogage et lecture d''erreurs'
] WHERE id = '08ede49c-2b54-4bae-90b7-c786aa020770'; -- Introduction à Python

UPDATE themes SET competencies = ARRAY[
  'Pensée algorithmique et pseudo-code',
  'Python intermédiaire : fonctions avancées',
  'Programmation orientée objet (classes)',
  'Gestion de fichiers et exceptions',
  'Modules et bibliothèques Python'
] WHERE id = 'b2000001-0000-0000-0000-000000000001'; -- Python pour les Bâtisseurs

UPDATE themes SET competencies = ARRAY[
  'HTML5 : structure et sémantique',
  'CSS3 : mise en forme et mise en page',
  'Flexbox et Grid Layout',
  'Responsive design (mobile-first)',
  'Formulaires et accessibilité web'
] WHERE id = 'b2000002-0000-0000-0000-000000000001'; -- Construire des pages web

UPDATE themes SET competencies = ARRAY[
  'Identité numérique et traces en ligne',
  'Droits et devoirs sur internet',
  'Protection des données personnelles (RGPD)',
  'Cyberharcèlement : reconnaissance et réaction',
  'Évaluation de la fiabilité des sources'
] WHERE id = 'b2000003-0000-0000-0000-000000000001'; -- Hygiène & Citoyenneté Numériques

UPDATE themes SET competencies = ARRAY[
  'JavaScript : DOM et événements',
  'Python avancé : décorateurs et générateurs',
  'APIs REST et requêtes HTTP',
  'Gestion asynchrone (async/await)',
  'Tests unitaires et débogage avancé'
] WHERE id = 'b3000001-0000-0000-0000-000000000001'; -- Python Avancé & JavaScript

UPDATE themes SET competencies = ARRAY[
  'Complexité algorithmique O(n)',
  'Algorithmes de tri (bulles, sélection, fusion)',
  'Structures : piles, files, arbres, graphes',
  'Recherche binaire et récursivité',
  'Parcours de graphes (BFS/DFS)'
] WHERE id = 'b3000002-0000-0000-0000-000000000001'; -- Algorithmes & Structures de données

UPDATE themes SET competencies = ARRAY[
  'Principes OWASP et vulnérabilités courantes',
  'Chiffrement et cryptographie de base',
  'Sécurité des mots de passe et authentification',
  'Analyse de risques et tests de pénétration éthiques',
  'Réponse aux incidents et forensique numérique'
] WHERE id = 'b3000003-0000-0000-0000-000000000001'; -- Cybersécurité Éthique & Défensive

UPDATE themes SET competencies = ARRAY[
  'Concepts fondamentaux du machine learning',
  'Données d''entraînement et biais algorithmiques',
  'Réseaux de neurones : fonctionnement',
  'Éthique de l''IA et enjeux sociétaux',
  'Implémentation d''un modèle simple avec Python'
] WHERE id = 'b3000004-0000-0000-0000-000000000001'; -- Bases de l'Intelligence Artificielle

UPDATE themes SET competencies = ARRAY[
  'Environnement de développement Python',
  'Variables, types et opérations de base',
  'Boucles et structures conditionnelles',
  'Fonctions et décomposition de problèmes',
  'Logique de jeu et interactions utilisateur'
] WHERE id = 'b457dd7a-1d0c-423e-b97f-ca4f670d1584'; -- Game Studio T1
-- Lien direct élève → professeur (1 élève = 1 prof max)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS students_teacher_id_idx ON public.students(teacher_id);
-- Teacher session planning: recurring (weekly) or one-time sessions
CREATE TABLE IF NOT EXISTS public.teacher_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  session_type  text NOT NULL CHECK (session_type IN ('recurring', 'once')),

  -- Recurring: day of week (0=Sun … 6=Sat) + time
  weekday       smallint CHECK (weekday BETWEEN 0 AND 6),
  start_time    time,

  -- One-time: exact datetime
  scheduled_at  timestamptz,

  duration_min  smallint NOT NULL DEFAULT 60,
  active_from   date NOT NULL DEFAULT CURRENT_DATE,
  active_until  date,

  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_sessions_teacher_idx ON public.teacher_sessions(teacher_id);

-- RLS: only admin/teacher can read their own sessions
ALTER TABLE public.teacher_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.teacher_sessions
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teacher reads own sessions" ON public.teacher_sessions
  FOR SELECT
  USING (teacher_id = auth.uid());
-- Lier une session à un élève spécifique (NULL = toute la classe)
ALTER TABLE public.teacher_sessions
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS teacher_sessions_student_idx ON public.teacher_sessions(student_id);
-- Ajoute order_index aux thèmes pour permettre le réordonnancement manuel
alter table themes add column if not exists order_index integer not null default 0;

-- Initialise l'ordre à partir du titre (ordre alphabétique actuel)
with ranked as (
  select id, row_number() over (partition by level order by title) - 1 as rn
  from themes
)
update themes set order_index = ranked.rn from ranked where themes.id = ranked.id;
-- Numéro permanent d'un thème dans son niveau (jamais modifié par drag-drop)
alter table themes add column if not exists number integer;
