/**
 * Seed Architecte — Thème 1A "Passerelle Architecte" (Septembre/Octobre)
 * Pour les nouveaux élèves placés en Architecte sans avoir fait Bâtisseur
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-architect-passerelle.ts
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
  { title: "Python express", desc: "Dictionnaires, modules, JSON, try/except en une séance — l'essentiel condensé avec fiches de référence" },
  { title: "HTML + CSS en 90 minutes", desc: "Structure + style : une page qui s'affiche dans le navigateur, sans fioritures" },
  { title: "Git — sauvegarder son code", desc: "add, commit, log, diff — version control de base pour ne jamais perdre son travail" },
  { title: "Fonctions avancées", desc: "Paramètres par défaut, return multiple, docstrings — écrire du code que les autres peuvent lire" },
  { title: "Mini-projet web statique", desc: "Une page personnelle qui présente un projet en combinant HTML, CSS et Python" },
  { title: "Défi de passage de niveau 🏁", desc: "Programme complet à terminer en séance — validé par le prof pour rejoindre le groupe Architecte" },
];

async function main() {
  console.log("\n⚡  Seed Architecte 1A — Passerelle Architecte\n");

  const themeId = await upsertTheme(
    "Passerelle Architecte",
    "architect-passerelle",
    "Rattrapage intensif Bâtisseur en 6 séances : Python intermédiaire, HTML/CSS, Git et premier projet web"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 120 : 60);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Passerelle Architecte seedée avec succès !\n");
}

main().catch(console.error);
