-- « Je bloque ici » : la question d'un élève à son mentor, depuis l'exercice.
--
-- Ce n'est pas une messagerie. Une question est accrochée à un exercice précis
-- et emporte une copie figée de ce que l'enfant avait sous les yeux et de ce
-- qu'il avait fait. Figée, parce que les leçons se réécrivent : un script de
-- contenu supprime et recrée les exercices avec de nouveaux identifiants, et
-- une question qui ne pointerait que vers l'exercice pointerait vers rien.
--
-- C'est pourquoi `block_id` n'a pas de clé étrangère, et que `lesson_id` et
-- `training_id` passent à NULL si le contenu disparaît : la question reste
-- lisible grâce à `context`.
--
-- Qui voit quoi : l'élève ses questions, son mentor celles de ses élèves, le
-- parent celles de son enfant (en lecture seule), la direction tout. Les
-- écritures passent par les actions serveur, qui vérifient qui écrit.

CREATE TABLE IF NOT EXISTS student_questions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id     uuid        REFERENCES public.lessons(id) ON DELETE SET NULL,
  training_id   uuid        REFERENCES public.trainings(id) ON DELETE SET NULL,
  block_id      uuid        NOT NULL,
  reason        text        NOT NULL CHECK (reason IN ('consigne', 'programme', 'commencer', 'autre')),
  message       text,
  context       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  reply         text,
  replied_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  replied_at    timestamptz,
  closed_at     timestamptz,
  closed_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_note   text,
  reply_seen_at timestamptz
);

ALTER TABLE student_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questions_direction" ON student_questions;
CREATE POLICY "questions_direction" ON student_questions
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager'));

DROP POLICY IF EXISTS "questions_eleve_lecture" ON student_questions;
CREATE POLICY "questions_eleve_lecture" ON student_questions
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "questions_parent_lecture" ON student_questions;
CREATE POLICY "questions_parent_lecture" ON student_questions
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.parent_children WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "questions_mentor_lecture" ON student_questions;
CREATE POLICY "questions_mentor_lecture" ON student_questions
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE teacher_id = auth.uid()));

-- Une seule question ouverte par exercice : redemander complète l'existante.
CREATE INDEX IF NOT EXISTS student_questions_ouvertes_par_bloc
  ON student_questions (student_id, block_id)
  WHERE replied_at IS NULL AND closed_at IS NULL;

CREATE INDEX IF NOT EXISTS student_questions_en_attente
  ON student_questions (created_at)
  WHERE replied_at IS NULL AND closed_at IS NULL;

CREATE INDEX IF NOT EXISTS student_questions_par_eleve
  ON student_questions (student_id, created_at DESC);
