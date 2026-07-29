/**
 * Seed Bâtisseur — Thème 2 "Python Puissant" (Novembre/Décembre)
 * Tous les élèves convergent ici
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-builder-python-puissant.ts
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
  { title: "Dictionnaires", desc: "clé → valeur, get(), keys(), values() — analogie répertoire téléphonique" },
  { title: "Modules & bibliothèques", desc: "import math, random, datetime — ne pas réinventer la roue" },
  { title: "Textes qui ont des super-pouvoirs", desc: "f-strings, split(), join(), strip(), upper() — maîtriser les chaînes" },
  { title: "Quand ça plante, on gère", desc: "try / except / finally — les erreurs sont normales, il faut les anticiper" },
  { title: "JSON — le langage universel", desc: "import json, dumps(), loads() — parler avec le monde entier" },
  { title: "Quiz mi-parcours 🏆", desc: "Défi combiné — un programme qui utilise tout ce qu'on a appris" },
];

async function main() {
  console.log("\n🐍  Seed Bâtisseur 2 — Python Puissant\n");

  const themeId = await upsertTheme(
    "Python Puissant",
    "builder-python-puissant",
    "Dictionnaires, modules, JSON et gestion d'erreurs : les outils qu'un vrai développeur utilise chaque jour"
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

  console.log("\n✅  Python Puissant seedé avec succès !\n");
}

main().catch(console.error);
