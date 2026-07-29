-- Teacher session planning: recurring (weekly) or one-time sessions
CREATE TABLE IF NOT EXISTS public.teacher_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  session_type  text NOT NULL CHECK (session_type IN ('recurring', 'once')),

  -- Recurring: day of week (0=Sun … 6=Sat) + time
  weekday       smallint CHECK (weekday BETWEEN 0 AND 6),
  start_time    time,

  -- One-time: exact datetime
  scheduled_at  timestamptz,

  duration_min  smallint NOT NULL DEFAULT 60,
  active_from   date NOT NULL DEFAULT CURRENT_DATE,
  active_until  date,

  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_sessions_teacher_idx ON public.teacher_sessions(teacher_id);

-- RLS: only admin/teacher can read their own sessions
ALTER TABLE public.teacher_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON public.teacher_sessions
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teacher reads own sessions" ON public.teacher_sessions
  FOR SELECT
  USING (teacher_id = auth.uid());
