-- ─────────────────────────────────────────────────────────────────────────────
-- 041 — La réalisation musicale : la chanson de l'enfant, écoutable par ses parents
--
-- `lesson_shares` sait montrer un plan et un labyrinthe : c'est né avec le
-- thème du robot. Le thème « Je compose de la musique » se termine par une
-- composition libre — l'enfant invente son refrain, son couplet, et les fait
-- se répondre — et cette chanson disparaissait dès qu'il fermait l'onglet.
--
-- Elle devient une page que le parent ouvre sans compte, avec le prénom de son
-- enfant, son robot, son plan s'il y en a un, et un bouton ▶ qui joue SA
-- chanson. C'est le moment où un parent comprend ce qu'on fait ici.
--
--   musique  { config, xml } — la configuration du défi et le programme Blockly
--            tel que l'enfant l'a laissé. Un instantané : refaire la leçon met
--            la page à jour, mais une chanson partagée ne change pas toute seule.
--
-- `plan` reste `not null default '[]'` : une leçon de musique sans plan produit
-- donc une réalisation avec un plan vide, et la page n'affiche simplement pas
-- cette section. Rien à changer de ce côté.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.lesson_shares
  add column if not exists musique jsonb;

-- Une réalisation doit montrer quelque chose : un plan, un labyrinthe, ou une
-- chanson. Sans ce garde, une leçon mal configurée fabriquerait une page vide
-- envoyée à un parent.
alter table public.lesson_shares drop constraint if exists lesson_shares_non_vide;
alter table public.lesson_shares add constraint lesson_shares_non_vide check (
  jsonb_array_length(coalesce(plan, '[]'::jsonb)) > 0
  or maze is not null
  or musique is not null
);
