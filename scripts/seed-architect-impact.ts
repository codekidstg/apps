/**
 * Seed Architecte — Thème 5 "Impact & Rayonnement" (Mai/Juin)
 * Portfolio, cybersécurité, métiers du numérique, cérémonie finale
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-architect-impact.ts
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
  { title: "Portfolio professionnel en ligne", desc: "GitHub bien rangé + site personnel avec ses 3 meilleurs projets — ce qu'un recruteur ou client regarde en premier" },
  { title: "Publier son propre projet open source", desc: "README clair, licence, issues ouvertes, fichier CONTRIBUTING — rendre son code utile au monde entier depuis Lomé" },
  { title: "Cybersécurité — protéger ce qu'on construit", desc: "Mots de passe hachés, HTTPS, injections SQL, XSS — sécuriser son app web avant de la mettre en ligne" },
  { title: "Les métiers du numérique en Afrique", desc: "Développeur freelance, CTO startup, data analyst, DevOps — salaires réels, témoignages d'entrepreneurs togolais, comment commencer" },
  { title: "Répétition générale", desc: "Portfolio finalisé, présentation de 5 min chrono, slides, répétition devant un camarade qui joue le jury" },
  { title: "🎓 Cérémonie Architecte", desc: "Présentation finale publique, diplôme Architecte, discours, invités extérieurs — et maintenant : le monde professionnel t'attend" },
];

async function main() {
  console.log("\n🌍  Seed Architecte 5 — Impact & Rayonnement\n");

  const themeId = await upsertTheme(
    "Impact & Rayonnement",
    "architect-impact",
    "Portfolio, open source, cybersécurité et la grande cérémonie finale — sortir de l'école et exister dans le monde numérique"
  );

  for (let i = 0; i < LESSONS.length; i++) {
    const { title, desc } = LESSONS[i];
    console.log(`  Séance ${i + 1} — ${title}`);
    const chId = await upsertChapter(themeId, `Séance ${i + 1} — ${title}`, i);
    const lId = await upsertLesson(chId, themeId, title, 0, i === 5 ? 250 : 90);
    await seedBlocks(lId, themeId, [
      { type: "text", order_index: 0, content: { html: `<h2>${title}</h2><p>${desc}</p><p><em>Contenu de la leçon à compléter.</em></p>` } },
    ]);
  }

  console.log("\n✅  Impact & Rayonnement seedé avec succès !\n");
}

main().catch(console.error);
