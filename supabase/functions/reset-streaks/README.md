# reset-streaks — Edge Function

Remet `streak_days = 0` pour les élèves dont `last_activity` est antérieur à hier.

## Déploiement

```bash
supabase functions deploy reset-streaks
```

## Activation du cron (une seule fois)

1. Dans Supabase Dashboard → Extensions → activer `pg_cron` et `pg_net`
2. Dans le SQL Editor, définir les variables app :
```sql
alter database postgres set app.supabase_url = 'https://TON_PROJECT.supabase.co';
alter database postgres set app.service_role_key = 'TON_SERVICE_ROLE_KEY';
```
3. Exécuter le fichier `supabase/migrations/20260813_streak_cron.sql`

## Test manuel

```bash
curl -X POST https://TON_PROJECT.supabase.co/functions/v1/reset-streaks \
  -H "Authorization: Bearer TON_SERVICE_ROLE_KEY"
```
