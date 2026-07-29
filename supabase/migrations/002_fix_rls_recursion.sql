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
