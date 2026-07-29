/**
 * Seed Architecte — Thème 4 "Ma Startup Tech" (Mars/Avril)
 * De l'idée au MVP — entrepreneuriat + code + Demo Day jury externe
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-architect-startup.ts
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
  { title: "De l'idée au MVP", desc: "Penser produit avant code : identifier un vrai problème, définir les utilisateurs, cahier des charges en 1 page" },
  { title: "Designer pour de vrais utilisateurs", desc: "UX/UI bases : wireframe sur papier, tester avec un camarade, itérer avant de coder une ligne" },
  { title: "Construire le MVP", desc: "1 fonctionnalité qui marche vraiment — JS + Supabase pour un produit réel, pas un prototype fragile" },
  { title: "Tester avec de vrais utilisateurs", desc: "Donner son app à 3 personnes qui ne connaissent pas le projet, noter leurs blocages, améliorer en séance" },
  { title: "Pitcher sa startup", desc: "5 minutes format investisseur : problème, solution, démo live, vision — répéter, chronométrer, recevoir des retours" },
  { title: "Demo Day 🎤", desc: "Jury externe : parents, entrepreneurs locaux, invités — chaque équipe présente, le public vote, les meilleurs projets reçoivent un prix" },
];

async function main() {
  console.log("\n🚀  Seed Architecte 4 — Ma Startup Tech\n");

  const themeId = await upsertTheme(
    "Ma Startup Tech",
    "architect-startup",
    "De l'idée au MVP : concevoir, coder, tester et pitcher une vraie startup devant un jury externe"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 200 : 90);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Ma Startup Tech seedée avec succès !\n");
}

main().catch(console.error);
