/**
 * Seed Architecte — Thème 2 "Le Web Vivant" (Novembre/Décembre)
 * JS + Fetch APIs + Supabase — apps web dynamiques sans backend custom
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-architect-web-vivant.ts
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
  { title: "JavaScript — le langage qui fait bouger les pages", desc: "Variables, fonctions, événements, DOM — rendre une page interactive sans recharger" },
  { title: "Fetch & APIs — connecter son app au monde", desc: "Afficher la météo de Lomé en temps réel, le taux CFA/EUR du jour, les actualités — fetch(), JSON, async/await" },
  { title: "Supabase depuis le frontend", desc: "Lire et écrire dans une vraie base de données directement depuis JavaScript — sans backend custom" },
  { title: "App interactive complète", desc: "Combiner JS + Supabase pour une app qui stocke et affiche des données réelles : sondage, liste, classement" },
  { title: "Responsive & Mobile-first", desc: "CSS Flexbox, Grid, media queries — une app qui s'affiche parfaitement sur téléphone (90% des utilisateurs au Togo)" },
  { title: "Déploiement & partage 🚀", desc: "Mettre son app en ligne sur Vercel ou Netlify — un lien qu'on envoie à sa famille depuis n'importe quel téléphone" },
];

async function main() {
  console.log("\n🌐  Seed Architecte 2 — Le Web Vivant\n");

  const themeId = await upsertTheme(
    "Le Web Vivant",
    "architect-web-vivant",
    "JavaScript, APIs réelles et Supabase — créer des apps web dynamiques accessibles depuis n'importe quel téléphone au Togo"
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

  console.log("\n✅  Le Web Vivant seedé avec succès !\n");
}

main().catch(console.error);
