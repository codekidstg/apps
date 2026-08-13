// Supabase Edge Function — reset-streaks
// Appelée chaque nuit à 02h00 (UTC) via pg_cron
// Remet streak_days = 0 pour les élèves inactifs depuis plus de 24h

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Vérification du secret pour éviter les appels non autorisés
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // Remet à zéro les streaks des élèves dont last_activity est antérieur à hier
  const { error, count } = await supabase
    .from("students")
    .update({ streak_days: 0 })
    .or(`last_activity.lt.${yesterday},last_activity.is.null`)
    .gt("streak_days", 0);

  if (error) {
    console.error("reset-streaks error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`reset-streaks: ${count ?? "?"} élèves remis à zéro`);
  return new Response(
    JSON.stringify({ reset: count ?? 0, date: yesterday }),
    { headers: { "Content-Type": "application/json" } },
  );
});
