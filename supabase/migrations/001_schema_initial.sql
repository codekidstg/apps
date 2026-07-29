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
