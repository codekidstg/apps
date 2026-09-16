-- ════════════════════════════════════════════════════════════════════════════
-- 030 — « Le Grand Plan » : la réalisation que l'enfant montre à son parent
-- ════════════════════════════════════════════════════════════════════════════
--
-- À la fin d'un thème, l'enfant produit une page publique : son plan écrit en
-- français, le programme que c'est devenu, et le tracé de son robot. Le parent
-- l'ouvre depuis un lien, sans compte et sans application.
--
-- ── Ce que cette table expose, volontairement ──────────────────────────────
-- Les lignes non révoquées sont lisibles par N'IMPORTE QUI possédant le lien,
-- y compris sans être connecté : c'est le but même de la fonctionnalité, et
-- c'est la raison des choix ci-dessous.
--
--   • `first_name` — le PRÉNOM SEUL. Jamais le nom de famille, jamais l'école,
--     jamais la classe, jamais l'âge. Un lien qui fuite ne doit pas permettre
--     d'identifier un enfant réel.
--   • `share_id` — imprévisible (généré côté application, ≥ 16 caractères
--     aléatoires). C'est la seule protection du lien : il ne doit pas être
--     devinable à partir d'un autre.
--   • `revoked` — le parent ou la direction peut couper un lien à tout moment.
--     La règle de lecture publique l'exclut immédiatement.
--   • Aucune colonne ne porte d'identifiant de connexion : `student_id` sert
--     aux écrans internes, et n'est jamais rendu sur la page publique.
--
-- ── À exécuter dans l'éditeur SQL Supabase ────────────────────────────────

create table if not exists public.lesson_shares (
  id           uuid primary key default gen_random_uuid(),
  share_id     text not null unique,
  student_id   uuid not null references public.students(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id)  on delete cascade,

  -- Prénom seul : voir la note de confidentialité ci-dessus.
  first_name   text not null,
  -- Instantané du robot au moment du partage : le robot peut changer ensuite,
  -- la réalisation, elle, ne doit plus bouger.
  avatar       jsonb,

  -- Ce que l'enfant a écrit et construit.
  plan         jsonb not null default '[]'::jsonb,
  program_xml  text,
  maze         jsonb,

  revoked      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Une réalisation par leçon et par enfant : refaire la leçon met à jour la
  -- page au lieu d'en créer une seconde, et le lien déjà partagé reste valide.
  unique (student_id, lesson_id)
);

create index if not exists lesson_shares_student_idx on public.lesson_shares (student_id);
-- Les lectures publiques passent toutes par share_id sur une ligne vivante.
create index if not exists lesson_shares_live_idx    on public.lesson_shares (share_id) where revoked = false;

alter table public.lesson_shares enable row level security;

-- ── Lecture ────────────────────────────────────────────────────────────────

-- Publique, et strictement limitée aux liens vivants. C'est cette règle qui
-- rend la page ouvrable par un parent qui n'a pas de compte.
drop policy if exists lecture_publique on public.lesson_shares;
create policy lecture_publique on public.lesson_shares
  for select
  to anon, authenticated
  using (revoked = false);

-- ── Écriture ───────────────────────────────────────────────────────────────

-- L'enfant crée et met à jour sa propre réalisation, jamais celle d'un autre.
drop policy if exists eleve_ecrit_la_sienne on public.lesson_shares;
create policy eleve_ecrit_la_sienne on public.lesson_shares
  for insert
  to authenticated
  with check (
    student_id in (select s.id from public.students s where s.profile_id = auth.uid())
  );

drop policy if exists eleve_met_a_jour_la_sienne on public.lesson_shares;
create policy eleve_met_a_jour_la_sienne on public.lesson_shares
  for update
  to authenticated
  using (
    student_id in (select s.id from public.students s where s.profile_id = auth.uid())
  )
  with check (
    student_id in (select s.id from public.students s where s.profile_id = auth.uid())
  );

-- Le parent peut couper le lien de son enfant (il ne peut rien écrire d'autre :
-- la règle de mise à jour ci-dessus reste la seule voie pour le contenu).
drop policy if exists parent_revoque on public.lesson_shares;
create policy parent_revoque on public.lesson_shares
  for update
  to authenticated
  using (
    student_id in (select pc.student_id from public.parent_children pc where pc.parent_id = auth.uid())
  )
  with check (
    student_id in (select pc.student_id from public.parent_children pc where pc.parent_id = auth.uid())
  );

-- La direction voit et coupe tout.
drop policy if exists direction_tout on public.lesson_shares;
create policy direction_tout on public.lesson_shares
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'manager'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'manager'));
