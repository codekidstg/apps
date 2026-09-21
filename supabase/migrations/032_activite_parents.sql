-- ─────────────────────────────────────────────────────────────────────────────
-- 032 — Le journal d'activité des parents
--
-- Pour savoir si une famille suit son enfant, la base ne connaissait que la
-- dernière fois qu'un parent avait tapé son mot de passe. Or un parent resté
-- connecté sur son téléphone peut revenir chaque jour sans que ce chiffre
-- bouge. On enregistre donc deux choses, et rien d'autre :
--
--   · visite       — l'ouverture de l'espace parent, au plus une par heure ;
--   · certificat   — l'ouverture ou le téléchargement d'un certificat.
--
-- Ni clics, ni temps passé, ni pages vues : la mesure d'usage globale et
-- anonyme reste à Vercel. Le journal est écrit par le serveur (clé de
-- service), lu par la direction, et purgé au-delà de 90 jours.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.activite_parents (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('visite', 'certificat')),
  cible       text,                       -- l'identifiant du certificat ouvert
  created_at  timestamptz not null default now()
);

create index if not exists activite_parents_parent_date_idx
  on public.activite_parents (parent_id, created_at desc);

alter table public.activite_parents enable row level security;

-- Seule la direction lit. Aucune règle d'écriture : le serveur écrit avec la
-- clé de service, qui ne passe pas par la RLS, et personne d'autre n'écrit.
drop policy if exists "direction lit l'activité des parents" on public.activite_parents;
create policy "direction lit l'activité des parents" on public.activite_parents
  for select using (public.get_my_role() in ('admin', 'manager'));

-- 90 jours d'historique, pas plus. La purge tourne chaque nuit à 03h30 UTC,
-- si l'extension pg_cron est active (elle l'est déjà pour les séries et les
-- notifications). Relancer la migration remplace la tâche au lieu de la doubler.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('purge-activite-parents')
      where exists (select 1 from cron.job where jobname = 'purge-activite-parents');
    perform cron.schedule(
      'purge-activite-parents',
      '30 3 * * *',
      $cron$delete from public.activite_parents where created_at < now() - interval '90 days'$cron$
    );
  end if;
end $$;
