-- ─────────────────────────────────────────────────────────────────────────────
-- 035 — Le bilan de fin de mois d'un mentor
--
-- Chaque fin de mois, la direction fait le point avec chaque mentor. Jusqu'ici
-- ce point se tenait de vive voix : rien n'en restait, et le mois suivant
-- personne ne savait ce qui avait été dit ni décidé.
--
-- La note du mois, elle, se recalcule à chaque lecture — elle suivrait donc
-- une règle changée six mois plus tard, et la note discutée avec le mentor ne
-- serait plus celle affichée. On la fige donc ici, telle qu'elle était le jour
-- du point.
--
-- L'ajustement (±10 au plus) est la main de la direction : un mois où le
-- contexte explique ce que les chiffres ne voient pas. Il exige une raison
-- écrite — sans elle, une note se corrige en silence.
--
-- Table réservée au serveur, sans aucune règle d'accès : admin et manager y
-- écrivent par leurs pages, et un mentor ne lit pas sa note (décision prise :
-- il voit ses faits, pas son chiffre).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.bilans_mentors (
  id                 uuid primary key default gen_random_uuid(),
  mentor_id          uuid not null references public.profiles(id) on delete cascade,
  -- Le mois du bilan, « 2026-09 ».
  mois               text not null check (mois ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  -- La note telle qu'elle était le jour du point ; null si le mois n'en avait
  -- pas (moins de trois séances).
  note_calculee      integer check (note_calculee between 0 and 100),
  ajustement         integer not null default 0 check (ajustement between -10 and 10),
  raison_ajustement  text,
  points_forts       text,
  a_ameliorer        text,
  decisions          text,
  auteur_id          uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Un seul bilan par mentor et par mois : le point se reprend, il ne se
  -- double pas.
  constraint bilans_mentors_un_par_mois unique (mentor_id, mois),

  -- Un ajustement sans raison écrite n'est pas un ajustement.
  constraint bilans_mentors_ajustement_motive check (
    (ajustement = 0 and raison_ajustement is null)
    or (ajustement <> 0
        and raison_ajustement is not null
        and length(btrim(raison_ajustement)) > 0)
  )
);

create index if not exists bilans_mentors_mentor_mois_idx
  on public.bilans_mentors (mentor_id, mois desc);

drop trigger if exists bilans_mentors_updated_at on public.bilans_mentors;
create trigger bilans_mentors_updated_at
  before update on public.bilans_mentors
  for each row execute function public.set_updated_at();

alter table public.bilans_mentors enable row level security;

-- Aucune règle : rien ne se lit ni ne s'écrit depuis un navigateur. Le serveur
-- passe outre avec la clé de service, après avoir vérifié qui visite la page.
