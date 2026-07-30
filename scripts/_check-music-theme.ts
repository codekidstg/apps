import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
const THEME_ID = "b82126de-7df6-410a-8089-5c39330a035d";
async function main() {
  const { data: chapters } = await sb.from("chapters").select("id,title,order_index,theme_id").eq("theme_id", THEME_ID);
  console.log("Chapitres:", JSON.stringify(chapters, null, 2));
  if (!chapters?.length) { console.log("⚠️ Aucun chapitre pour ce thème !"); return; }
  const { data: lessons } = await sb.from("lessons").select("id,title,chapter_id").in("chapter_id", chapters.map(c => c.id));
  console.log("Leçons:", JSON.stringify(lessons, null, 2));
  const { data: blocks } = await sb.from("lesson_blocks").select("id,lesson_id,type").eq("theme_id", THEME_ID).limit(5);
  console.log("Blocs (5 premiers):", JSON.stringify(blocks, null, 2));
}
main().catch(console.error);
