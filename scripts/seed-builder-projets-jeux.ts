/**
 * Seed Bâtisseur — Thème 3 "Projets-Jeux" (Janvier/Février)
 * Apprendre les concepts avancés à travers des créations ludiques
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-builder-projets-jeux.ts
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
  { title: "L'aventure textuelle", desc: "Un jeu 'choisissez votre aventure' — conditions imbriquées, dictionnaires de scènes" },
  { title: "Le chatbot de classe", desc: "Un bot qui répond à des questions — listes, conditions, réponses aléatoires avec random" },
  { title: "Le quiz builder", desc: "Créer son propre quiz jouable — listes de dictionnaires, score, boucle de jeu" },
  { title: "La calculatrice magique", desc: "Interface en boucle, try/except pour les erreurs, module math pour les fonctions avancées" },
  { title: "Le générateur de blagues", desc: "Données en JSON, tirage aléatoire, interface propre et colorée dans le terminal" },
  { title: "Tournoi de projets-jeux 🏆", desc: "Chaque élève présente son projet-jeu préféré — vote de la classe, retours constructifs" },
];

async function main() {
  console.log("\n🎮  Seed Bâtisseur 3 — Projets-Jeux\n");

  const themeId = await upsertTheme(
    "Projets-Jeux",
    "builder-projets-jeux",
    "Apprendre les concepts Python avancés à travers des projets qui ressemblent à de vrais jeux et applications"
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

  console.log("\n✅  Projets-Jeux seedé avec succès !\n");
}

main().catch(console.error);
