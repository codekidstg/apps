-- Active l'extension pg_cron si pas encore activée
-- (à activer une seule fois dans Supabase Dashboard > Extensions)

-- Cron : reset des streaks chaque nuit à 02h00 UTC
-- Appelle la Edge Function reset-streaks via pg_net
select cron.schedule(
  'reset-streaks-nightly',       -- nom du job (unique)
  '0 2 * * *',                   -- chaque nuit à 02h00 UTC
  $$
  select net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/reset-streaks',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body   := '{}'::jsonb
  )
  $$
);
