import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
const THEME_ID = "8979e87c-058c-4003-95fd-1531c649bd1d";
async function main() {
  const { data: chapters } = await sb.from("chapters").select("id,title,order_index").eq("theme_id", THEME_ID).order("order_index");
  console.log("Chapitres :", JSON.stringify(chapters, null, 2));
  const { data: lessons } = await sb.from("lessons").select("id,title,chapter_id,order_index").eq("theme_id", THEME_ID).order("order_index");
  console.log("Leçons :", JSON.stringify(lessons, null, 2));
}
main().catch(console.error);
