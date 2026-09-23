-- ─────────────────────────────────────────────────────────────────────────────
-- 036 — Pourquoi un échange se clôt
--
-- Un « Je bloque ici » se terminait de deux façons : une réponse écrite, ou
-- « réglé en séance ». Il en manquait une troisième, la plus fréquente.
--
-- Le 19 septembre, Kenneth écrit à son mentor : « OUI CEST REPARTIE desoler de
-- ne pas t'avoir vite repondu j'avais des tache menagere a faire ». Ce n'est
-- pas une question — l'enfant n'a aucun autre bouton pour répondre à son
-- mentor que « Je bloque ici ». Bernard a eu raison de ne rien répondre, et le
-- suivi lui comptait pourtant un échange resté sans réponse.
--
-- Le mentor dit donc maintenant pourquoi il clôt :
--
--   seance            réglé pendant la séance — compte comme une réponse, et le
--                     délai se mesure jusqu'à la séance
--   pas_une_question  rien à répondre — l'échange sort du décompte, et le
--                     clore trois jours plus tard ne coûte rien
--   autrement         réglé hors de l'application (téléphone, WhatsApp) —
--                     compte comme une réponse au moment où il le note
--
-- Les clôtures déjà en base datent d'avant ce choix et voulaient toutes dire
-- « réglé en séance » : elles sont reprises ainsi.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.student_questions
  add column if not exists closed_reason text;

update public.student_questions
   set closed_reason = 'seance'
 where closed_at is not null and closed_reason is null;

alter table public.student_questions drop constraint if exists student_questions_cloture_motivee;
alter table public.student_questions add constraint student_questions_cloture_motivee check (
  -- Pas de clôture : pas de raison.
  (closed_at is null and closed_reason is null)
  or
  -- Une clôture porte toujours sa raison, et une raison connue. Le
  -- « is not null » d'abord : sans lui, « raison in (...) » vaut inconnu quand
  -- la raison est nulle, et une contrainte laisse passer l'inconnu.
  (closed_at is not null
    and closed_reason is not null
    and closed_reason in ('seance', 'pas_une_question', 'autrement'))
);
