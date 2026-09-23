-- ─────────────────────────────────────────────────────────────────────────────
-- 037 — Quand l'enfant répond à son mentor
--
-- Un enfant qui veut répondre à son mentor n'a aucun autre bouton que « Je
-- bloque ici ». Sa réponse arrive donc comme une nouvelle question, et le
-- mentor se retrouve avec une dette qu'il n'a pas : le 19 septembre, Kenneth
-- écrit « OUI CEST REPARTIE, désolé de ne pas t'avoir vite répondu » — et son
-- mentor porte un échange « sans réponse » pour un merci.
--
-- La clôture (migration 036) permettait de rattraper le cas après coup. Ici on
-- le supprime à la source : l'enfant a deux gestes, et ils ne veulent pas dire
-- la même chose.
--
--   question   « Je bloque ici » — le mentor doit une réponse
--   reponse    l'enfant écrit dans le fil, sans rien demander : rien n'est dû,
--              et le message n'entre pas dans le suivi du mentor
--
-- Une réponse n'a pas de raison à cocher — elle ne dit pas ce qui bloque.
-- `reason` devient donc facultative, et une contrainte garde les deux cas
-- cohérents : une question porte toujours sa raison, une réponse jamais.
--
-- Les lignes déjà en base sont toutes des questions : le défaut les laisse
-- telles quelles.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.student_questions
  add column if not exists kind text not null default 'question';

alter table public.student_questions alter column reason drop not null;

alter table public.student_questions drop constraint if exists student_questions_reason_check;
alter table public.student_questions drop constraint if exists student_questions_genre_coherent;
alter table public.student_questions add constraint student_questions_genre_coherent check (
  (kind = 'question'
    -- `is not null` d'abord : sans lui, « reason in (...) » vaut inconnu quand
    -- la raison est nulle, et une contrainte laisse passer l'inconnu.
    and reason is not null
    and reason in ('consigne', 'programme', 'commencer', 'autre'))
  or
  (kind = 'reponse'
    and reason is null
    -- Une réponse d'enfant ne se répond pas et ne se clôt pas : elle n'attend
    -- rien. Ce qui attend, c'est la dernière question du fil.
    and replied_at is null
    and closed_at is null)
);

-- Les index « en attente » ne doivent plus compter les réponses d'enfants :
-- elles ne sont dues à personne.
drop index if exists student_questions_ouvertes_par_bloc;
create index if not exists student_questions_ouvertes_par_bloc
  on public.student_questions (student_id, block_id)
  where kind = 'question' and replied_at is null and closed_at is null;

drop index if exists student_questions_en_attente;
create index if not exists student_questions_en_attente
  on public.student_questions (created_at)
  where kind = 'question' and replied_at is null and closed_at is null;
