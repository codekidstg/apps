-- ─────────────────────────────────────────────────────────────────────────────
-- 040 — La leçon préparée : séparer « je l'ai faite » de « c'est acquis »
--
-- Constat du 30 septembre 2026 : les quatre élèves actifs ont 2 à 3 leçons
-- d'avance sur leurs séances, et sur 16 leçons terminées, 12 l'ont été sans
-- qu'aucune séance ne les couvre. Samuel a fini « Répéter » avec son mentor le
-- 26 à 13h53, puis « Le bug qui ne dit rien » seul à 20h56 le même soir.
--
-- La cause n'est pas la vitesse des enfants : c'est qu'un seul drapeau,
-- `completed`, faisait trois métiers — « j'ai parcouru », « j'ai compris » et
-- « je peux passer à la suite ». L'enfant n'est légitime que sur le premier.
--
--   prepared   l'enfant a tout fait. C'est enregistré, le mentor le voit, mais
--              ça n'ouvre rien et ça ne paie pas la prime de fin de leçon.
--   completed  le mentor (ou la direction) a validé en séance. Là seulement,
--              l'XP tombe et la leçon suivante s'ouvre.
--
-- `completed` garde donc son sens de « c'est acquis », et les 65 endroits du
-- code qui le testent continuent de dire vrai sans être touchés. C'est la
-- raison de ce choix plutôt qu'une colonne « validée » à côté.
--
-- Le plafond d'une leçon d'avance n'est pas une règle ajoutée : une leçon
-- s'ouvre quand la précédente est `completed`, donc une leçon `prepared` n'en
-- ouvre aucune. Il ne peut jamais y avoir deux leçons préparées non validées.
--
-- Rien ne recule : tout ce qui est `completed` aujourd'hui vaut validation.
-- Sans cette précaution, les quatre élèves seraient bloqués dès demain matin.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.lesson_progress drop constraint if exists lesson_progress_status_check;
alter table public.lesson_progress add constraint lesson_progress_status_check
  check (status in ('not_started', 'in_progress', 'prepared', 'completed'));

-- Quand l'enfant a dit « j'ai tout fait ». Distinct de `completed_at`, qui dit
-- quand le mentor a validé — les deux dates racontent deux faits différents,
-- et l'écart entre elles est exactement le délai d'attente de l'enfant.
alter table public.lesson_progress
  add column if not exists prepared_at timestamptz,
  -- La prime « sans faute » se gagne à la préparation et se paie à la
  -- validation : sans cette mémoire, un enfant qui prépare parfaitement serait
  -- payé moins qu'un enfant qui fait tout en séance.
  add column if not exists prepare_sans_faute boolean not null default false;

-- Une leçon préparée porte toujours sa date, une leçon validée la sienne.
alter table public.lesson_progress drop constraint if exists lesson_progress_dates_coherentes;
alter table public.lesson_progress add constraint lesson_progress_dates_coherentes check (
  (status <> 'prepared'  or prepared_at  is not null)
  and (status <> 'completed' or completed_at is not null)
);

-- Les leçons en attente de validation : la requête de l'alerte du mentor.
create index if not exists lesson_progress_prepared_idx
  on public.lesson_progress (student_id, prepared_at) where status = 'prepared';
