-- ════════════════════════════════════════════════════════════════════════════
-- 031 — Le parent coupe le lien, et rien d'autre
-- ════════════════════════════════════════════════════════════════════════════
--
-- La migration 030 donne au parent une policy `for update` sur la réalisation
-- de son enfant, avec ce commentaire : « il ne peut rien écrire d'autre ». Or
-- c'était faux. Une policy RLS `for update` autorise TOUTES les colonnes : le
-- parent pouvait donc réécrire le plan ou le programme de son enfant, et la
-- page publique aurait affiché des phrases que l'enfant n'a pas écrites.
--
-- Postgres ne sait pas restreindre une policy à certaines colonnes. Ce trigger
-- le fait : hors élève propriétaire, direction et contexte serveur, une mise à
-- jour ne peut toucher que `revoked` (et `updated_at`).
--
-- ── À exécuter dans l'éditeur SQL Supabase ────────────────────────────────

create or replace function public.lesson_shares_revocation_seulement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  est_eleve     boolean;
  est_direction boolean;
begin
  -- Contexte serveur (clé de service) : auth.uid() est nul. Les actions du
  -- serveur ont déjà vérifié qui appelle avant d'écrire — c'est par là que
  -- passe l'enregistrement d'une réalisation. Sans cette porte, le trigger
  -- bloquerait l'application elle-même.
  if auth.uid() is null then
    return new;
  end if;

  select exists (
    select 1 from public.students s
    where s.id = new.student_id and s.profile_id = auth.uid()
  ) into est_eleve;

  est_direction := coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'manager'), false);

  if est_eleve or est_direction then
    return new;
  end if;

  -- Tout le reste — en pratique le parent — ne peut que couper le lien.
  if new.share_id    is distinct from old.share_id
     or new.student_id  is distinct from old.student_id
     or new.lesson_id   is distinct from old.lesson_id
     or new.first_name  is distinct from old.first_name
     or new.avatar      is distinct from old.avatar
     or new.plan        is distinct from old.plan
     or new.program_xml is distinct from old.program_xml
     or new.maze        is distinct from old.maze
     or new.created_at  is distinct from old.created_at
  then
    raise exception 'Seule la révocation du lien est permise ici.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists lesson_shares_revocation_seulement on public.lesson_shares;
create trigger lesson_shares_revocation_seulement
  before update on public.lesson_shares
  for each row
  execute function public.lesson_shares_revocation_seulement();
