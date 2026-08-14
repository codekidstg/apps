-- ============================================================
-- 025 — Module Comptabilité
-- ============================================================

-- ── teacher_rates : tarif par mentor ────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rate_fcfa     int  NOT NULL CHECK (rate_fcfa >= 0),
  rate_type     text NOT NULL CHECK (rate_type IN ('per_session', 'per_hour')) DEFAULT 'per_session',
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teacher_rates_teacher_idx ON public.teacher_rates(teacher_id, effective_from DESC);

-- ── student_session_rates : coût par élève ──────────────────
CREATE TABLE IF NOT EXISTS public.student_session_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rate_fcfa     int  NOT NULL CHECK (rate_fcfa >= 0),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  notes         text,
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_session_rates_student_idx ON public.student_session_rates(student_id, effective_from DESC);

-- ── mentor_payments : suivi paiement mentor par occurrence ──
CREATE TABLE IF NOT EXISTS public.mentor_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id      uuid REFERENCES public.teacher_sessions(id) ON DELETE SET NULL,
  occurrence_date date NOT NULL,
  -- status: pending_report=pas de rapport|to_pay=rapport ok, à payer|paid=payé
  status          text NOT NULL CHECK (status IN ('pending_report','to_pay','paid')) DEFAULT 'pending_report',
  amount_fcfa     int  NOT NULL DEFAULT 0,
  paid_at         timestamptz,
  notes           text,
  created_by      uuid REFERENCES public.profiles(id),
  updated_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, session_id, occurrence_date)
);
CREATE INDEX IF NOT EXISTS mentor_payments_teacher_idx ON public.mentor_payments(teacher_id);
CREATE INDEX IF NOT EXISTS mentor_payments_date_idx    ON public.mentor_payments(occurrence_date);

-- ── parent_session_payments : suivi paiement parent ─────────
CREATE TABLE IF NOT EXISTS public.parent_session_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES public.students(id)  ON DELETE CASCADE,
  session_id      uuid REFERENCES public.teacher_sessions(id) ON DELETE SET NULL,
  occurrence_date date NOT NULL,
  -- status: pending=en attente|paid=payé|unpaid=impayé (commentaire obligatoire)
  status          text NOT NULL CHECK (status IN ('pending','paid','unpaid')) DEFAULT 'pending',
  amount_fcfa     int  NOT NULL DEFAULT 0,
  paid_at         timestamptz,
  comment         text,
  created_by      uuid REFERENCES public.profiles(id),
  updated_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id, session_id, occurrence_date)
);
CREATE INDEX IF NOT EXISTS parent_session_payments_parent_idx  ON public.parent_session_payments(parent_id);
CREATE INDEX IF NOT EXISTS parent_session_payments_student_idx ON public.parent_session_payments(student_id);

-- ── compta_audit_log : historique de chaque changement ──────
CREATE TABLE IF NOT EXISTS public.compta_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  text NOT NULL,
  record_id   uuid NOT NULL,
  action      text NOT NULL,   -- status_change, rate_set, etc.
  old_value   text,
  new_value   text,
  changed_by  uuid REFERENCES public.profiles(id),
  changed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS compta_audit_log_record_idx ON public.compta_audit_log(record_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.teacher_rates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_session_rates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_session_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_audit_log       ENABLE ROW LEVEL SECURITY;

-- Admin + Manager : accès complet
CREATE POLICY "compta_admin_manager_teacher_rates" ON public.teacher_rates FOR ALL
  USING (get_my_role() IN ('admin','manager'));
CREATE POLICY "compta_admin_manager_student_rates" ON public.student_session_rates FOR ALL
  USING (get_my_role() IN ('admin','manager'));
CREATE POLICY "compta_admin_manager_mentor_pay"    ON public.mentor_payments FOR ALL
  USING (get_my_role() IN ('admin','manager'));
CREATE POLICY "compta_admin_manager_parent_pay"    ON public.parent_session_payments FOR ALL
  USING (get_my_role() IN ('admin','manager'));
CREATE POLICY "compta_admin_manager_audit"         ON public.compta_audit_log FOR ALL
  USING (get_my_role() IN ('admin','manager'));
