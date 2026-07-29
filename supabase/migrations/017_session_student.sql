-- Lier une session à un élève spécifique (NULL = toute la classe)
ALTER TABLE public.teacher_sessions
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS teacher_sessions_student_idx ON public.teacher_sessions(student_id);
