-- Migration : table session_reports
-- Rapport pédagogique post-séance rempli par le professeur

create table if not exists session_reports (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references teacher_sessions(id) on delete cascade,
  teacher_id     uuid not null references profiles(id),
  student_id     uuid references students(id),
  reported_at    timestamptz not null default now(),

  -- Q1 : Avancement de l'élève
  advancement    text not null check (advancement in ('completed','partial','reviewed','blocked')),

  -- Q2 : Engagement / humeur
  engagement     text not null check (engagement in ('motivated','focused','distracted','disengaged')),

  -- Q3 : Difficultés (texte libre, optionnel)
  difficulty_notes text,

  -- Q4 : Approche pédagogique (multi-choix stocké en tableau)
  help_methods   text[] not null default '{}',

  -- Q5 : Note pour la prochaine fois (optionnel)
  next_session_note text,

  created_at     timestamptz not null default now()
);

-- Index pour requêtes fréquentes
create index if not exists session_reports_teacher_idx on session_reports(teacher_id);
create index if not exists session_reports_session_idx on session_reports(session_id);

-- RLS : le prof voit ses propres rapports, l'admin voit tout
alter table session_reports enable row level security;

create policy "prof_own_reports" on session_reports
  for all using (teacher_id = auth.uid());

create policy "admin_all_reports" on session_reports
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
