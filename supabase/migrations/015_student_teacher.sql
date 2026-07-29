-- Lien direct élève → professeur (1 élève = 1 prof max)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS students_teacher_id_idx ON public.students(teacher_id);
