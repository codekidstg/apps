/**
 * Passe en 'draft' tous les thèmes sans leçons (sauf le labyrinthe)
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/_hide-empty-themes.ts
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  // Récupérer tous les thèmes publiés
  const { data: themes } = await sb.from("themes").select("id,title,status");

  // Récupérer tous les chapitres et leçons
  const { data: chapters } = await sb.from("chapters").select("id,theme_id");
  const { data: lessons }  = await sb.from("lessons").select("id,chapter_id");

  const lessonsByChapter = new Map<string, number>();
  for (const l of lessons ?? []) {
    lessonsByChapter.set(l.chapter_id, (lessonsByChapter.get(l.chapter_id) ?? 0) + 1);
  }

  const lessonCountByTheme = new Map<string, number>();
  for (const ch of chapters ?? []) {
    const count = lessonsByChapter.get(ch.id) ?? 0;
    lessonCountByTheme.set(ch.theme_id, (lessonCountByTheme.get(ch.theme_id) ?? 0) + count);
  }

  console.log("\nBilan des thèmes :");
  for (const t of themes ?? []) {
    const count = lessonCountByTheme.get(t.id) ?? 0;
    console.log(`  ${count > 0 ? "✅" : "⬜"} [${t.status}] ${t.title} — ${count} leçon(s)`);
  }

  // Passer en draft les thèmes sans leçons
  const toHide = (themes ?? []).filter((t) => (lessonCountByTheme.get(t.id) ?? 0) === 0 && t.status === "published");

  if (toHide.length === 0) {
    console.log("\n✅ Aucun thème vide à masquer.");
    return;
  }

  console.log(`\n🔒 Passage en draft de ${toHide.length} thème(s) vide(s) :`);
  for (const t of toHide) {
    const { error } = await sb.from("themes").update({ status: "draft" }).eq("id", t.id);
    console.log(error ? `  ❌ ${t.title}: ${error.message}` : `  ✓ ${t.title}`);
  }
  console.log("\n✅ Terminé — seuls les thèmes avec du contenu sont visibles.");
}
main().catch(console.error);
