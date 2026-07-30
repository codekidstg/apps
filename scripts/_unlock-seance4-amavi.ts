import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // Trouver Amavi
  const { data: user } = await sb.from("profiles").select("id,display_name").ilike("display_name", "%amavi%").single();
  if (!user) { console.error("❌ Amavi introuvable"); process.exit(1); }
  console.log(`👤 ${user.display_name} — ${user.id}`);

  // Leçons à marquer complètes pour débloquer Séance 4
  const lessons = [
    { id: "9cecb7fd-330a-4c3d-a374-ec81203abc65", name: "Séance 1 — L'ordinateur" },
    { id: "f0ee843c-ba50-404f-a5c3-1f33b15d5598", name: "Séance 2 — Mon premier algorithme" },
    { id: "b76470f3-7f4e-4f16-892e-6e148ce227b6", name: "Séance 3 — Gauche ou droite ?" },
  ];

  for (const l of lessons) {
    const { error } = await sb.from("lesson_progress").upsert(
      { user_id: user.id, lesson_id: l.id, completed: true, score: 100, xp_earned: 70 },
      { onConflict: "user_id,lesson_id" }
    );
    if (error) { console.error(`❌ ${l.name}:`, error.message); }
    else { console.log(`  ✓ ${l.name}`); }
  }
  console.log("\n✅ Séance 4 débloquée pour Amavi !");
}
main().catch(console.error);
