import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const STUDENT_ID = "c0c6e8f0-4b85-469b-826c-69acbb6a1e9f";
  const lessons = [
    { id: "9cecb7fd-330a-4c3d-a374-ec81203abc65", name: "Séance 1" },
    { id: "f0ee843c-ba50-404f-a5c3-1f33b15d5598", name: "Séance 2" },
    { id: "b76470f3-7f4e-4f16-892e-6e148ce227b6", name: "Séance 3" },
    { id: "d558294a-9f50-452b-bae4-a9f921e223dd", name: "Séance 4" },
  ];
  for (const l of lessons) {
    const { error } = await sb.from("lesson_progress").upsert(
      { student_id: STUDENT_ID, lesson_id: l.id, score: 100, xp_earned: 70 },
      { onConflict: "student_id,lesson_id" }
    );
    console.log(error ? `❌ ${l.name}: ${error.message}` : `  ✓ ${l.name}`);
  }
  console.log("\n✅ Séance 5 débloquée pour Amavi !");
}
main().catch(console.error);
