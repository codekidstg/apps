-- Atelier CodeKids : sessions de démonstration live

create table if not exists atelier_sessions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,           -- code court ex: "MARS42"
  title       text not null default 'Atelier CodeKids',
  current_step int not null default 0,        -- étape courante (contrôlée par le mentor)
  max_step    int not null default 7,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);

create table if not exists atelier_players (
  id          uuid primary key default gen_random_uuid(),
  share_id    text not null unique default substring(gen_random_uuid()::text, 1, 8),
  session_code text not null references atelier_sessions(code) on delete cascade,
  name        text not null,
  avatar      text not null default '🚀',    -- emoji vaisseau
  config      jsonb not null default '{}'::jsonb,  -- vitesse, obstacles, gravité, règles
  score       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists atelier_players_session_idx on atelier_players(session_code);
create index if not exists atelier_players_share_idx   on atelier_players(share_id);

-- RLS : tout est public en lecture pour cet atelier (pas de compte requis)
alter table atelier_sessions enable row level security;
alter table atelier_players  enable row level security;

-- Sessions : lecture publique, écriture via service_role uniquement
create policy "atelier_sessions_read" on atelier_sessions for select using (true);

-- Players : lecture publique, insert/update sans auth (participants sans compte)
create policy "atelier_players_read"   on atelier_players for select using (true);
create policy "atelier_players_insert" on atelier_players for insert with check (true);
create policy "atelier_players_update" on atelier_players for update using (true);

-- Realtime
alter publication supabase_realtime add table atelier_sessions;
alter publication supabase_realtime add table atelier_players;
