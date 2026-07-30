import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  // Tester la requête exacte utilisée par la page thème
  const { data, error } = await sb.from("lessons")
    .select("id, title, xp_reward, chapter_id, order_index")
    .limit(1);
  console.log("xp_reward query:", error?.message ?? "OK", data?.[0]);

  // Sans xp_reward
  const { data: d2, error: e2 } = await sb.from("lessons")
    .select("id, title, chapter_id, order_index")
    .limit(3);
  console.log("sans xp_reward:", e2?.message ?? "OK", JSON.stringify(d2));

  // Colonnes disponibles via une leçon existante
  const { data: d3 } = await sb.from("lessons").select("*").limit(1);
  console.log("colonnes:", Object.keys(d3?.[0] ?? {}));
}
main().catch(console.error);
