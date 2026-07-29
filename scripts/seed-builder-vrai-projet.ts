/**
 * Seed Bâtisseur — Thème 4 "Mon Vrai Projet" (Mars/Avril)
 * 3 projets au choix : Agenda, Playlist, Mini-réseau
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-builder-vrai-projet.ts
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
    title: "Choisir et planifier son projet",
    desc: "Cahier des charges, découpage en étapes. 3 projets au choix : 🗓️ Agenda intelligent · 🎵 Générateur de playlists · 🏫 Mini-réseau de classe",
  },
  {
    title: "Architecture modulaire",
    desc: "Une fonction = une responsabilité. Découper avant de coder, dessiner l'architecture sur papier",
  },
  {
    title: "Coder le cœur du projet",
    desc: "Implémentation des fonctions principales — chaque élève avance sur son projet choisi",
  },
  {
    title: "Tester et déboguer",
    desc: "Cas limites, assert, print debug, corriger ses bugs — le debugging est une compétence à part entière",
  },
  {
    title: "Finir et embellir",
    desc: "Interface propre, messages clairs pour l'utilisateur, README en 5 lignes",
  },
  {
    title: "Démo intermédiaire 🎤",
    desc: "Chaque élève présente son projet à la classe — 3 minutes de présentation, retours bienveillants",
  },
];

async function main() {
  console.log("\n🚀  Seed Bâtisseur 4 — Mon Vrai Projet\n");

  const themeId = await upsertTheme(
    "Mon Vrai Projet",
    "builder-vrai-projet",
    "Concevoir et coder un projet de A à Z — 3 projets au choix : Agenda intelligent, Générateur de playlists, ou Mini-réseau de classe"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 120 : 80);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Mon Vrai Projet seedé avec succès !\n");
}

main().catch(console.error);
