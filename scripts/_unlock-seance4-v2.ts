import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

const STUDENT_ID = "c0c6e8f0-4b85-469b-826c-69acbb6a1e9f"; // Amavi

const lessons = [
  { id: "9cecb7fd-330a-4c3d-a374-ec81203abc65", name: "Séance 1 — L'ordinateur" },
  { id: "b76470f3-7f4e-4f16-892e-6e148ce227b6", name: "Séance 3 — Gauche ou droite ?" },
];

async function main() {
  for (const l of lessons) {
    const { error } = await sb.from("lesson_progress").upsert(
      { student_id: STUDENT_ID, lesson_id: l.id, status: "completed", score: 100 },
      { onConflict: "student_id,lesson_id" }
    );
    if (error) console.error(`❌ ${l.name}:`, error.message);
    else console.log(`  ✓ ${l.name} → completed`);
  }
  console.log("\n✅ Séance 4 débloquée pour Amavi !");
}
main().catch(console.error);
