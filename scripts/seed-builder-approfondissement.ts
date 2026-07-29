/**
 * Seed Bâtisseur — Thème 1B "Approfondissement Explorateur" (Septembre/Octobre)
 * Pour les élèves venant du niveau Explorateur
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-builder-approfondissement.ts
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
    title, slug, description, level: "builder", status: "published",
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
  { title: "Pixel art algorithmique", desc: "Générer des motifs avec des formules mathématiques" },
  { title: "Fonctions récursives", desc: "Une fonction qui s'appelle elle-même — fractales visuelles" },
  { title: "Trier et chercher", desc: "Algorithmes de tri visuels (bulles, sélection)" },
  { title: "Coder un mini-jeu", desc: "Jeu de devinette avec score et chronomètre" },
  { title: "Optimiser son code", desc: "Lisibilité, découpage, éviter les répétitions" },
  { title: "Défi inter-niveaux 🏆", desc: "Les anciens Explorateurs coachent les nouveaux sur leur mini-projet" },
];

async function main() {
  console.log("\n🔥  Seed Bâtisseur 1B — Approfondissement Explorateur\n");

  const themeId = await upsertTheme(
    "Approfondissement Explorateur",
    "builder-approfondissement",
    "Aller plus loin sur les bases Explorateur : algorithmes visuels, récursivité, mini-jeux — consolider avant le niveau Bâtisseur commun"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 100 : 60);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Approfondissement Explorateur seedé avec succès !\n");
}

main().catch(console.error);
