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
