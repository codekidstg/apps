-- Cron : rappel cours chaque heure
select cron.schedule(
  'push-cours-reminder-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/push-cours-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body   := '{}'::jsonb
  )
  $$
);

-- Table push_subscriptions (à créer si absente)
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  subscription jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

-- Un utilisateur ne peut voir/gérer que ses propres subscriptions
create policy "own_push_subs" on public.push_subscriptions
  for all using (auth.uid() = user_id);
