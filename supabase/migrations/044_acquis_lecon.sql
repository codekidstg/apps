-- ─────────────────────────────────────────────────────────────────────────────
-- 044 — Ce que l'enfant sait faire, en mots de parent
--
-- Les leçons ont déjà un champ `objectives`, mais il est écrit pour un
-- pédagogue : « Cumuler des valeurs dans une boucle avec un accumulateur ».
-- Un parent ne lit pas ça. Et seules 38 leçons sur 99 en ont un.
--
-- `acquis` répond à une seule question, celle que pose un parent : qu'est-ce
-- que mon enfant sait faire maintenant qu'il ne savait pas avant ?
--
-- Il se range en complément d'une phrase, sans sujet, sans majuscule et sans
-- point final — la relance écrit « Savez-vous que Samuel sait maintenant
-- {acquis} ? ». Une leçon sans `acquis` ne casse rien : le message bascule
-- simplement sur le thème en cours.
--
-- Les dix premières sont remplies ici : ce sont les seules que des enfants ont
-- réellement terminées à ce jour. Les 89 autres s'écriront au fil de l'eau,
-- depuis l'écran des thèmes.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.lessons
  add column if not exists acquis text;

-- Une phrase, pas un paragraphe : au-delà, elle ne tient plus dans un message.
alter table public.lessons
  drop constraint if exists lessons_acquis_taille;
alter table public.lessons
  add constraint lessons_acquis_taille
  check (acquis is null or length(acquis) between 10 and 160);

comment on column public.lessons.acquis is
  'Ce que l''enfant sait faire après cette leçon, en mots de parent. Complément sans sujet ni majuscule : « écrire un programme et le faire tourner ».';

-- ── Les dix leçons déjà terminées par au moins un enfant ────────────────────

update public.lessons set acquis = 'écrire un vrai programme et le faire tourner sur un ordinateur'
  where title = 'Mon premier programme';

update public.lessons set acquis = 'faire retenir une information à un ordinateur pour la réutiliser plus loin'
  where title = 'Garder une information';

update public.lessons set acquis = 'écrire un programme qui réagit différemment selon la situation'
  where title = 'Choisir';

update public.lessons set acquis = 'faire répéter une tâche à un ordinateur au lieu de la réécrire dix fois'
  where title = 'Répéter';

update public.lessons set acquis = 'retrouver l''erreur dans un programme qui marche mal sans rien signaler'
  where title = '🔧 Le bug qui ne dit rien';

update public.lessons set acquis = 'expliquer ce qu''un ordinateur sait faire, et ce qu''il ne sait pas faire'
  where title = 'L''ordinateur, la machine magique';

update public.lessons set acquis = 'décrire une suite d''étapes assez précise pour qu''une machine la suive'
  where title = 'Mon premier algorithme';

update public.lessons set acquis = 'donner une direction à une machine sans laisser place au doute'
  where title = 'Gauche ou droite ?';

update public.lessons set acquis = 'repérer ce qui se répète dans une tâche, et ne l''écrire qu''une fois'
  where title = 'La répétition — Kirikou dit moins pour faire plus';

update public.lessons set acquis = 'chercher méthodiquement pourquoi un programme ne fait pas ce qu''on attend'
  where title = 'Le débogage — Deviens détective du code';
