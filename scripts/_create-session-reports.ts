import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // Test si la table existe
  const { error: checkErr } = await sb.from("session_reports").select("id").limit(1);
  if (!checkErr) { console.log("✅ Table session_reports existe déjà."); return; }

  console.log("Table manquante:", checkErr.message);
  console.log("\n📋 Exécute ce SQL dans le dashboard Supabase → SQL Editor :\n");
  console.log(`
create table if not exists session_reports (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references teacher_sessions(id) on delete cascade,
  teacher_id     uuid not null references profiles(id),
  student_id     uuid references students(id),
  reported_at    timestamptz not null default now(),
  advancement    text not null check (advancement in ('completed','partial','reviewed','blocked')),
  engagement     text not null check (engagement in ('motivated','focused','distracted','disengaged')),
  difficulty_notes text,
  help_methods   text[] not null default '{}',
  next_session_note text,
  created_at     timestamptz not null default now()
);
create index if not exists session_reports_teacher_idx on session_reports(teacher_id);
create index if not exists session_reports_session_idx on session_reports(session_id);
alter table session_reports enable row level security;
create policy "prof_own_reports" on session_reports
  for all using (teacher_id = auth.uid());
create policy "admin_all_reports" on session_reports
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
  `);
}
main().catch(console.error);
