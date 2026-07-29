/**
 * Seed Bâtisseur — Thème 5 "Présenter & Partager" (Mai/Juin)
 * HTML, CSS, Git visuel, démo finale et cérémonie
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-builder-partager.ts
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
  {
    title: "HTML — la structure du web",
    desc: "Balises, liens, images, listes — construire une page qui s'affiche dans le navigateur",
  },
  {
    title: "CSS — habiller sa page",
    desc: "Couleurs, polices, marges, arrière-plans — rendre sa page belle et personnelle",
  },
  {
    title: "Ma page de portfolio",
    desc: "Combiner HTML + CSS pour présenter son projet de l'année sur une vraie page web",
  },
  {
    title: "Git — ne jamais perdre son code",
    desc: "init, add, commit, log — en mode visuel et gamifié, comprendre l'arbre de commits",
  },
  {
    title: "Répétition générale",
    desc: "Structurer sa démo de 5 minutes, supports visuels, gérer le stress, répéter devant un camarade",
  },
  {
    title: "🎓 Cérémonie Bâtisseur",
    desc: "Présentation finale, diplôme Bâtisseur, récap du parcours de l'année et cap vers le niveau Architecte",
  },
];

async function main() {
  console.log("\n🌍  Seed Bâtisseur 5 — Présenter & Partager\n");

  const themeId = await upsertTheme(
    "Présenter & Partager",
    "builder-presenter-partager",
    "HTML, CSS, Git visuel et la grande présentation finale — bienvenue dans le monde des développeurs"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 150 : 70);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Présenter & Partager seedé avec succès !\n");
}

main().catch(console.error);
