-- Activation de l'atelier par l'admin pour un élève spécifique
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS atelier_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN students.atelier_active IS 'Admin peut activer la séance démo atelier pour cet élève';
