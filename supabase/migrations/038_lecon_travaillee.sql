-- ─────────────────────────────────────────────────────────────────────────────
-- 038 — Quelle leçon a été travaillée en séance
--
-- Rien, dans un compte rendu, ne disait ce qui avait été fait. « A terminé la
-- séance prévue » — laquelle ? Le 23 septembre, pour remettre d'aplomb les
-- parcours de quatre enfants, il a fallu téléphoner à leurs mentors pour
-- savoir quelle leçon ils avaient terminée le samedi. L'application ne le
-- savait pas.
--
-- Elle ne pouvait pas le deviner non plus : ce que l'enfant fait seul dans
-- l'application et ce que son mentor travaille avec lui sont deux choses
-- différentes, et toutes deux vraies.
--
--   lesson_id   la leçon travaillée. Null : pas de leçon — on a repris les
--               bases, l'enfant était fatigué, on a joué. C'est une
--               information, pas un oubli.
--   lesson_2_id une seconde leçon : une séance finit souvent l'une et entame
--               l'autre. Deux au plus — au-delà, on ne décrit plus rien.
--   lecon_finie le mentor dit qu'ils l'ont terminée ensemble. L'application
--               *propose* alors de la marquer faite pour l'enfant ; elle ne le
--               fait jamais en silence. Le mentor dit ce qui a été travaillé,
--               l'enfant valide ce qu'il a fait : confondre les deux ferait
--               sauter des exercices sans que personne ne l'ait voulu.
--
-- `on delete set null` : les leçons se réécrivent, un script de contenu les
-- recrée sous de nouveaux identifiants. Le compte rendu doit survivre à ça.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.session_reports
  add column if not exists lesson_id   uuid references public.lessons(id) on delete set null,
  add column if not exists lesson_2_id uuid references public.lessons(id) on delete set null,
  add column if not exists lecon_finie boolean not null default false;

-- Une seconde leçon sans première n'a pas de sens, et « terminée » ne se dit
-- que d'une leçon nommée.
alter table public.session_reports drop constraint if exists session_reports_lecons_coherentes;
alter table public.session_reports add constraint session_reports_lecons_coherentes check (
  (lesson_2_id is null or lesson_id is not null)
  and (lecon_finie = false or lesson_id is not null)
  and (lesson_2_id is null or lesson_2_id <> lesson_id)
);

-- Une séance non tenue n'a travaillé aucune leçon.
alter table public.session_reports drop constraint if exists session_reports_non_tenue_sans_lecon;
alter table public.session_reports add constraint session_reports_non_tenue_sans_lecon check (
  tenue or (lesson_id is null and lesson_2_id is null and lecon_finie = false)
);

create index if not exists session_reports_lecon_idx
  on public.session_reports (lesson_id) where lesson_id is not null;
