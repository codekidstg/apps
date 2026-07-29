/**
 * Seed Architecte — Thème 3 "Intelligence Artificielle Appliquée" (Janvier/Février)
 * Construire et utiliser l'IA — modèles, NLP, API Claude, problèmes africains
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-architect-ia.ts
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
  { title: "Comment l'IA apprend", desc: "Features, labels, entraînement, prédiction — démystifier le machine learning avec des exemples visuels et concrets" },
  { title: "Mon premier modèle de classification", desc: "scikit-learn en pratique : classer des emails (spam/non-spam) ou des symptômes — dataset préparé fourni" },
  { title: "Traitement du langage naturel", desc: "Analyser des avis clients, détecter une émotion, résumer un texte — NLP accessible avec des librairies Python" },
  { title: "Construire un assistant IA avec l'API Claude", desc: "Un appel API, un résultat magique — créer son propre chatbot personnalisé qui répond en français et en Éwé" },
  { title: "IA pour l'Afrique — données réelles", desc: "Prédire le prix des tomates au marché de Lomé, détecter une maladie des plantes — datasets africains fournis par l'équipe" },
  { title: "Mon projet IA 🏆", desc: "Choisir un problème togolais, entraîner un modèle ou appeler une API, présenter les résultats à la classe" },
];

async function main() {
  console.log("\n🤖  Seed Architecte 3 — Intelligence Artificielle Appliquée\n");

  const themeId = await upsertTheme(
    "Intelligence Artificielle Appliquée",
    "architect-ia-appliquee",
    "Construire et utiliser l'IA : modèles de classification, NLP, API Claude et applications concrètes pour l'Afrique"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 150 : 80);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  IA Appliquée seedée avec succès !\n");
}

main().catch(console.error);
