import { createClient } from "@supabase/supabase-js";
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MUSIC_THEME_ID = "b82126de-7df6-410a-8089-5c39330a035d";
const LABY_THEME_ID  = "8979e87c-058c-4003-95fd-1531c649bd1d";

async function testTheme(themeId: string, name: string) {
  console.log(`\n=== ${name} (${themeId}) ===`);

  const { data: themeRaw, error: te } = await (admin.from("themes") as any)
    .select("id, title, level").eq("id", themeId).single();
  console.log("Theme:", themeRaw?.title ?? `ERROR: ${te?.message}`);

  const { data: chaptersRaw, error: ce } = await admin.from("chapters")
    .select("id, title, order_index").eq("theme_id", themeId).order("order_index") as any;
  console.log(`Chapters (${chaptersRaw?.length ?? 0}):`, ce?.message ?? chaptersRaw?.map((c: any) => c.title));

  const chapterIds = (chaptersRaw ?? []).map((c: any) => c.id);
  if (!chapterIds.length) { console.log("⚠️ No chapters → no lessons"); return; }

  const { data: lessonsRaw, error: le } = await admin.from("lessons")
    .select("id, title, xp_reward, chapter_id, order_index")
    .in("chapter_id", chapterIds).order("order_index") as any;
  console.log(`Lessons (${lessonsRaw?.length ?? 0}):`, le?.message ?? lessonsRaw?.map((l: any) => l.title));
}

async function main() {
  await testTheme(MUSIC_THEME_ID, "Musique");
  await testTheme(LABY_THEME_ID, "Labyrinthe");
}
main().catch(console.error);
