-- ─────────────────────────────────────────────────────────────────────────────
-- 040 — L'atelier libre de l'élève
--
-- Samuel a terminé les cinq séances de son thème et fait vingt exercices sur
-- trente tout seul. Son mentor, le 3 octobre, demande de quoi écrire de vrais
-- petits programmes : « qu'ils puissent écrire et exécuter du code ».
--
-- Les exercices entraînent des gestes ; l'atelier est l'endroit où l'enfant
-- décide. Rien n'y est corrigé, rien n'y rapporte d'XP — ce n'est pas un
-- parcours, c'est un établi.
--
-- Un seul code par enfant, sauvegardé tout seul. Pas un gestionnaire de
-- projets : s'il faut nommer, ranger et supprimer des fichiers avant d'écrire
-- sa première ligne, l'enfant ne l'ouvre pas deux fois. La table est prête
-- pour plusieurs fichiers le jour venu — `titre` existe déjà.
--
-- Réservée au serveur, sans aucune règle d'accès : les pages de l'élève sont
-- rendues côté serveur et les écritures passent par des actions qui vérifient
-- qui écrit.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.atelier_eleve (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  titre       text not null default 'Mon programme',
  code        text not null default '',
  -- Le dernier résultat affiché, pour retrouver son écran en revenant.
  sortie      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Un seul établi par enfant pour l'instant.
  constraint atelier_eleve_un_par_enfant unique (student_id),
  -- Un garde-fou de taille : un programme d'enfant n'atteint pas 100 000
  -- caractères, et une boucle qui écrit dans le code ne remplira pas la base.
  constraint atelier_eleve_taille check (length(code) <= 100000 and length(coalesce(sortie, '')) <= 20000)
);

drop trigger if exists atelier_eleve_updated_at on public.atelier_eleve;
create trigger atelier_eleve_updated_at
  before update on public.atelier_eleve
  for each row execute function public.set_updated_at();

alter table public.atelier_eleve enable row level security;

-- Aucune règle : ni lecture ni écriture depuis un navigateur. Le serveur passe
-- outre avec la clé de service, après avoir vérifié qui visite la page.
