-- ─────────────────────────────────────────────────────────────────────────────
-- 042 — Plusieurs programmes par enfant, et le lien qu'on envoie à son parent
--
-- La 040 posait un seul établi par enfant : choisir une autre amorce écrasait
-- le travail de la veille. Le mentor de Samuel demandait « sauvegarder un peu
-- sous forme de fichiers de projet » — le voici.
--
-- Le partage ensuite : un enfant qui peut envoyer son jeu à son père a une
-- raison de le finir. Le lien ne s'allume que si l'enfant le décide, et il
-- s'éteint de la même façon. Rien n'est public par défaut.
--
-- La table ne change pas de nom : c'est toujours l'atelier de l'élève, il y a
-- seulement plusieurs programmes dessus.
-- ─────────────────────────────────────────────────────────────────────────────

-- Un seul établi, c'était la contrainte. Elle saute.
alter table public.atelier_eleve
  drop constraint if exists atelier_eleve_un_par_enfant;

-- La liste d'un enfant se lit par cet index — jamais la table entière.
create index if not exists atelier_eleve_par_enfant
  on public.atelier_eleve (student_id, updated_at desc);

-- Le jeton du lien public. Nul tant que l'enfant n'a rien partagé : une
-- adresse qui n'existe pas ne peut pas fuiter.
alter table public.atelier_eleve
  add column if not exists jeton text;

create unique index if not exists atelier_eleve_jeton_unique
  on public.atelier_eleve (jeton) where jeton is not null;

-- Un titre tient sur une carte. Au-delà, ce n'est plus un titre.
-- `is not null` d'abord : sans lui, un titre nul rendrait la condition
-- inconnue — et une contrainte inconnue passe.
alter table public.atelier_eleve
  drop constraint if exists atelier_eleve_titre_taille;
alter table public.atelier_eleve
  add constraint atelier_eleve_titre_taille
  check (titre is not null and length(titre) between 1 and 60);

-- Le plafond de douze programmes par enfant est tenu par l'action serveur,
-- seule écrivaine de cette table : elle peut dire à l'enfant, en français, ce
-- qu'il doit faire. Une contrainte SQL ne saurait que refuser.
