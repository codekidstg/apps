-- ─────────────────────────────────────────────────────────────────────────────
-- 039 — Le Terrain : des exercices en libre service, et le temps passé dessus
--
-- Les enfants réclament des exercices. Ils en réclament pour une raison que la
-- base dit clairement : 59 entraînements passés pour 16 leçons terminées, et
-- 18 refaits — dont un six fois de suite. Ils ne manquaient pas d'envie, ils
-- manquaient de matière.
--
-- Le Terrain ajoute une seconde porte sur la même réserve d'exercices : ceux du
-- parcours restent dans l'entraînement de la séance, vus du mentor ; ceux du
-- Terrain s'ouvrent librement, se rejouent, et ne comptent pour aucune note.
--
--   libre_service  cet exercice appartient au Terrain. Il ne s'affiche pas dans
--                  la liste du parcours et ne verse aucune XP.
--   palier         1 je m'échauffe · 2 je m'entraîne · 3 je me dépasse. Trois
--                  barreaux d'une même échelle : reconnaître, dérouler et
--                  réparer, produire. Le palier 3 est celui qui manquait — un
--                  enfant a « maîtrisé » le range en réussissant un
--                  glisser-déposer dont les étiquettes donnaient la réponse.
--
-- Pas de colonne « notion » : le regroupement se fait sur `lesson_id`, qui est
-- déjà là. Une étiquette libre en plus se serait écrite de trois façons en six
-- mois, et aurait coupé en trois une notion qui doit rester entière.
--
-- `xp_reward = 0` est imposé ici, dans la base, et pas seulement dans le code :
-- `completeTraining` verse aujourd'hui 50 XP fixes à toute première réussite
-- sans regarder cette colonne. La contrainte dit ce qui est vrai — le Terrain
-- ne paie pas en XP — pour que personne ne rebranche le versement par erreur.
--
--   temps_dernier_secondes  ce qu'a duré la dernière tentative.
--   temps_total_secondes    tout le temps passé sur cet exercice, toutes
--                           tentatives confondues.
--   reussi_sans_indice      il a fini au moins une fois sans qu'un indice
--                           s'affiche. C'est ça, la vraie réussite — « fini »
--                           ne dit pas si l'enfant a compris.
--
-- Le temps est mesuré chez l'enfant : un onglet resté ouvert pendant le repas
-- raconterait quarante minutes de concentration. Le compte s'arrête donc quand
-- l'onglet passe en arrière-plan, et le serveur plafonne une tentative à
-- 1 200 secondes — vingt minutes, au-delà desquelles il ne s'est rien passé.
-- Ce temps est lu par le mentor, le parent et l'admin ; l'enfant ne le voit
-- pas, et il n'entre pas dans la note du mentor.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.trainings
  add column if not exists libre_service boolean  not null default false,
  add column if not exists palier        smallint;

-- Un exercice de Terrain porte toujours son palier, et ne paie jamais en XP.
alter table public.trainings drop constraint if exists trainings_terrain_coherent;
alter table public.trainings add constraint trainings_terrain_coherent check (
  (palier is null or palier between 1 and 3)
  and (libre_service = false or palier is not null)
  and (libre_service = false or xp_reward = 0)
);

alter table public.training_progress
  add column if not exists temps_dernier_secondes int,
  add column if not exists temps_total_secondes   int     not null default 0,
  add column if not exists reussi_sans_indice     boolean not null default false;

-- Des durées qu'un enfant peut avoir vécues. 1 200 s pour une tentative, et le
-- cumul ne peut pas dépasser ce que 1 200 s par tentative autorisent.
alter table public.training_progress drop constraint if exists training_progress_temps_plausible;
alter table public.training_progress add constraint training_progress_temps_plausible check (
  (temps_dernier_secondes is null or temps_dernier_secondes between 0 and 1200)
  and temps_total_secondes >= 0
  and temps_total_secondes <= 1200 * greatest(coalesce(attempts, 1), 1)
);

-- La liste du Terrain d'une séance, dans l'ordre des paliers.
create index if not exists trainings_terrain_idx
  on public.trainings (lesson_id, palier, order_index) where libre_service;
