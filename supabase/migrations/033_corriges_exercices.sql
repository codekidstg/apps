-- ─────────────────────────────────────────────────────────────────────────────
-- 033 — Les corrigés des exercices, réservés au serveur
--
-- Quand un enfant appuie sur « Je bloque ici », son mentor voit l'exercice et
-- sa réponse attendue. Pour les défis de code, cette réponse est un programme
-- entier : le corrigé.
--
-- Il ne va pas dans le contenu de l'exercice. Ce contenu part vers le
-- navigateur de l'enfant — le jeu en a besoin — et l'enfant peut aussi le lire
-- lui-même dans la base : un corrigé rangé là se trouverait en deux clics.
--
-- D'où cette table à part, sans aucune règle d'accès : un enfant connecté,
-- même en interrogeant la base depuis son navigateur, n'y lit rien. Seul le
-- serveur (clé de service) la lit, pour les pages du mentor et de la
-- direction, et l'écrit, par le script qui vérifie chaque corrigé avec le
-- correcteur avant de le ranger (scripts/corriges-defis-code.mjs).
--
-- Un corrigé suit son exercice : supprimé avec lui. Un script de contenu qui
-- réécrit une leçon recrée ses exercices sous de nouveaux identifiants ; leurs
-- corrigés sont alors à réécrire, et la fiche du mentor le dit en attendant.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.corriges_exercices (
  id                 uuid primary key default gen_random_uuid(),
  lesson_block_id    uuid unique references public.lesson_blocks(id) on delete cascade,
  training_block_id  uuid unique references public.training_blocks(id) on delete cascade,
  solution           text not null,
  -- Dernier passage réussi par le correcteur.
  verifie_le         timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  -- Un corrigé appartient à un exercice de leçon OU d'entraînement.
  constraint corriges_exercices_un_seul_bloc
    check ((lesson_block_id is null) <> (training_block_id is null))
);

alter table public.corriges_exercices enable row level security;

-- Aucune règle : ni lecture ni écriture depuis un navigateur, quel que soit le
-- rôle. Le serveur, lui, passe outre avec la clé de service.
