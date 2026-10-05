-- ─────────────────────────────────────────────────────────────────────────────
-- 043 — Voir l'aspiration, et engager les mentors
--
-- Deux tables pour les deux mesures qui restent après la fermeture de la
-- faille (042 et le correctif d'accès aux leçons).
--
-- `consultations_cours` : une ligne par leçon ouverte par un mentor. Un mentor
-- qui prépare sa séance en ouvre deux ou trois ; celui qui en ouvre quarante
-- en vingt minutes ne prépare rien. Sans journal, on l'apprend six mois trop
-- tard — ou jamais.
--
-- `engagements_mentors` : ce que le mentor a accepté, et quand. L'adresse et
-- le navigateur sont conservés parce qu'une acceptation en ligne ne vaut que
-- par ce qui l'entoure : sans eux, c'est une ligne dans une base, et une ligne
-- dans une base se conteste.
--
-- Réservées au serveur, sans aucune règle d'accès : les pages du mentor sont
-- rendues côté serveur et les écritures passent par des actions qui vérifient
-- qui écrit.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.consultations_cours (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  -- L'entraînement est rattaché à sa leçon : c'est la leçon qui compte pour
  -- mesurer l'étendue de ce qui a été lu.
  consulte_le timestamptz not null default now()
);

-- La détection lit « ce mentor, ces derniers jours » — jamais la table entière.
create index if not exists consultations_par_mentor
  on public.consultations_cours (teacher_id, consulte_le desc);

alter table public.consultations_cours enable row level security;

create table if not exists public.engagements_mentors (
  teacher_id  uuid primary key references public.profiles(id) on delete cascade,
  -- La version du texte accepté. Si vous le modifiez, les mentors le revoient
  -- au lieu de rester engagés sur un texte qu'ils n'ont jamais lu.
  version     text not null,
  accepte_le  timestamptz not null default now(),
  -- Ce qui donne du poids à l'acceptation le jour où elle est contestée.
  adresse_ip  text,
  navigateur  text
);

alter table public.engagements_mentors enable row level security;

-- Aucune règle : ni lecture ni écriture depuis un navigateur. Le serveur passe
-- outre avec la clé de service, après avoir vérifié qui visite la page.
