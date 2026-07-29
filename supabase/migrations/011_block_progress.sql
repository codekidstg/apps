-- Progression bloc par bloc (quiz, code, jeux)
-- Permet de reprendre une leçon là où on s'est arrêté, sur n'importe quel appareil

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS block_progress JSONB DEFAULT '{}'::jsonb;

-- Index pour accélerer les lectures par student+lesson
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_lesson
  ON lesson_progress (student_id, lesson_id);
