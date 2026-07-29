-- ══════════════════════════════════════════════════════════════════════════
-- 012 — Système d'Entraînement
-- Entraînements liés aux leçons, optionnels, répétables, disponibles toute l'année
-- ══════════════════════════════════════════════════════════════════════════

-- ── Table trainings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  xp_reward   INT  NOT NULL DEFAULT 30,
  order_index INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Table training_blocks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id  UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('text','quiz','code_challenge','game')),
  content      JSONB NOT NULL DEFAULT '{}',
  order_index  INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Table training_progress ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  training_id  UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  score        INT  DEFAULT 0,
  attempts     INT  DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, training_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trainings_lesson      ON trainings (lesson_id);
CREATE INDEX IF NOT EXISTS idx_training_blocks_train ON training_blocks (training_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_progress_std ON training_progress (student_id, training_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE trainings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

-- Trainings : lisibles par tous les authentifiés (élèves, profs, admins)
CREATE POLICY "trainings_select" ON trainings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "trainings_manage" ON trainings
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('admin','teacher')
  );

-- Training blocks : même logique
CREATE POLICY "training_blocks_select" ON training_blocks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "training_blocks_manage" ON training_blocks
  FOR ALL USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('admin','teacher')
  );

-- Training progress : chaque élève voit/modifie uniquement le sien
CREATE POLICY "training_progress_own" ON training_progress
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "training_progress_admin" ON training_progress
  FOR SELECT USING (
    (auth.jwt()->'app_metadata'->>'role') IN ('admin','teacher')
  );
