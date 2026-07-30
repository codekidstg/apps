import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

const STUDENT_ID = "c0c6e8f0-4b85-469b-826c-69acbb6a1e9f";

async function main() {
  const { data: lessons, error } = await sb.from("lessons").select("id, title");
  if (error) { console.error("Erreur:", error.message); return; }
  console.log(`${lessons!.length} leçons trouvées. Marquage en cours...`);

  for (const l of lessons!) {
    const { error: e } = await sb.from("lesson_progress").upsert(
      { student_id: STUDENT_ID, lesson_id: l.id, score: 100, status: "completed" },
      { onConflict: "student_id,lesson_id" }
    );
    console.log(e ? `❌ ${l.title}: ${e.message}` : `  ✓ ${l.title}`);
  }
  console.log("\n✅ Toutes les leçons débloquées !");
}
main().catch(console.error);
