/**
 * Seed Architecte — Thème 1B "Algorithmique & Maîtrise" (Septembre/Octobre)
 * Pour les élèves venant du niveau Bâtisseur
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-architect-algorithmique.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function upsertTheme(title: string, slug: string, description: string): Promise<string> {
  const { data: ex } = await sb.from("themes").select("id").eq("slug", slug).maybeSingle();
  if (ex) { console.log(`  ↩ Thème existant (${ex.id})`); return ex.id as string; }
  const { data, error } = await (sb.from("themes") as any).insert({
    title, slug, description, level: "architect", status: "published",
    estimated_hours: 6, published_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw error;
  console.log(`  ✓ Thème créé (${(data as any).id})`);
  return (data as any).id as string;
}

async function upsertChapter(themeId: string, title: string, order: number): Promise<string> {
  const { data: ex } = await sb.from("chapters").select("id").eq("theme_id", themeId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await (sb.from("chapters") as any).insert({ theme_id: themeId, title, description: "", order_index: order }).select("id").single();
  if (error) throw error;
  return (data as any).id as string;
}

async function upsertLesson(chapterId: string, themeId: string, title: string, order: number, xp = 60): Promise<string> {
  const { data: ex } = await sb.from("lessons").select("id").eq("chapter_id", chapterId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await (sb.from("lessons") as any).insert({ chapter_id: chapterId, theme_id: themeId, title, order_index: order, xp_reward: xp }).select("id").single();
  if (error) throw error;
  return (data as any).id as string;
}

async function seedBlocks(lessonId: string, themeId: string, blocks: object[]) {
  await (sb.from("lesson_blocks") as any).delete().eq("lesson_id", lessonId);
  const rows = blocks.map((b: any) => ({ ...b, lesson_id: lessonId, theme_id: themeId }));
  const { error } = await (sb.from("lesson_blocks") as any).insert(rows);
  if (error) throw error;
  console.log(`    ✓ ${rows.length} blocs insérés`);
}

const LESSONS = [
  { title: "Complexité — pourquoi certains codes sont lents", desc: "O(n), O(n²), O(log n) — mesurer et visualiser la vitesse d'un algorithme avec des exemples concrets" },
  { title: "Récursivité — la fonction qui se rappelle", desc: "Fibonacci, factorielle, tours de Hanoï — comprendre la pile d'appels visuellement" },
  { title: "Piles, files et tables de hachage", desc: "Quand utiliser quoi : Stack (undo), Queue (tickets), Hash table (recherche instantanée)" },
  { title: "Tri fusion — diviser pour régner", desc: "Comprendre et implémenter merge sort — visualiser comment diviser un problème le résout" },
  { title: "Graphes — BFS et DFS", desc: "Parcourir un réseau en largeur ou profondeur — application : trouver le chemin le plus court à Lomé" },
  { title: "Défi algorithmique 🏆", desc: "Résoudre un problème réel : optimiser la tournée de livraison d'un commerçant du marché de Lomé" },
];

async function main() {
  console.log("\n🧠  Seed Architecte 1B — Algorithmique & Maîtrise\n");

  const themeId = await upsertTheme(
    "Algorithmique & Maîtrise",
    "architect-algorithmique",
    "Penser comme un ingénieur : complexité, récursivité, structures de données et graphes — résoudre de vrais problèmes"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 120 : 70);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Algorithmique & Maîtrise seedé avec succès !\n");
}

main().catch(console.error);
