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
