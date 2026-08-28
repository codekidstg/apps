/**
 * Correctifs — Séance 1 "L'ordinateur, la machine magique"
 * (retours de relecture par l'équipe pédagogique)
 *
 * Contrairement à seed-seance1-ordinateur.ts, ce script NE SUPPRIME PAS
 * les blocs existants : il met à jour leur `content` en place, en conservant
 * leur `id`, pour ne pas casser la progression déjà enregistrée par des élèves.
 *
 * Corrige :
 *  - order_index 2 : question quiz calculatrice → contradiction avec l'entraînement
 *  - order_index 3 : ajoute le critère "reprogrammable" à la définition
 *  - order_index 5 et 8 : jeux Memory → jeux d'association (cartes visibles)
 *
 * Ne corrige PAS la vidéo (order_index 1) : nécessite une URL vidéo en
 * français fournie par l'équipe — voir NEW_VIDEO ci-dessous.
 *
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/fix-seance1-ordinateur.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "9cecb7fd-330a-4c3d-a374-ec81203abc65"; // L'ordinateur, la machine magique

// Renseigner cette URL puis dé-commenter le bloc plus bas pour appliquer le correctif vidéo.
const NEW_VIDEO_URL: string | null = null;
const NEW_VIDEO_TITLE = "C'est quoi un ordinateur ? — Vidéo pour les enfants";

async function main() {
  console.log("🔧 Correctifs Séance 1 — L'ordinateur, la machine magique");
  console.log(`📌 Lesson ID : ${LESSON_ID}\n`);

  const { data: blocks, error } = await sb
    .from("lesson_blocks")
    .select("id, order_index, type, content")
    .eq("lesson_id", LESSON_ID)
    .order("order_index");

  if (error || !blocks) {
    console.error("❌ Impossible de lire les blocs :", error?.message);
    process.exit(1);
  }
  console.log(`📦 ${blocks.length} blocs trouvés\n`);

  const byOrder = (i: number) => blocks.find((b) => b.order_index === i);

  // ── 1. Vidéo (order_index 1) — optionnel, si une URL a été fournie ──────────
  const videoBlock = byOrder(1);
  if (videoBlock && NEW_VIDEO_URL) {
    const { error: e } = await sb
      .from("lesson_blocks")
      .update({ content: { url: NEW_VIDEO_URL, title: NEW_VIDEO_TITLE } })
      .eq("id", videoBlock.id);
    if (e) console.error("  ❌ Vidéo:", e.message);
    else console.log("  ✓ [01] Vidéo remplacée par la version française");
  } else if (videoBlock) {
    console.log("  ⏭️  [01] Vidéo — NEW_VIDEO_URL non renseignée, ignoré (voir haut du script)");
  }

  // ── 2. Quiz — question calculatrice (order_index 2) ─────────────────────────
  const quizOrdi = byOrder(2);
  if (quizOrdi) {
    const content = quizOrdi.content as { questions: any[] };
    const idx = content.questions.findIndex((q) => q.id === "q_ordi_2");
    if (idx === -1) {
      console.error("  ❌ [02] Question q_ordi_2 introuvable — contenu inattendu, rien changé.");
    } else {
      content.questions[idx] = {
        id: "q_ordi_2",
        question: "Laquelle de ces machines est un vrai ordinateur ?",
        type: "mcq",
        choices: ["Une tablette tactile", "Un grille-pain classique", "Un marteau"],
        answer: 0,
        explanation:
          "Une tablette reçoit des données (tu la touches), les traite, et affiche un résultat — ET on peut la reprogrammer pour faire plein de choses différentes (jeux, dessin, calcul…). C'est ça, un vrai ordinateur ! Une simple calculatrice, elle, fait toujours la même chose : elle ne peut pas être reprogrammée pour autre chose.",
      };
      const { error: e } = await sb.from("lesson_blocks").update({ content }).eq("id", quizOrdi.id);
      if (e) console.error("  ❌ [02] Quiz calculatrice:", e.message);
      else console.log("  ✓ [02] Quiz — question calculatrice corrigée (cohérente avec l'entraînement)");
    }
  }

  // ── 3. Définition — ajoute le critère "reprogrammable" (order_index 3) ──────
  const defBlock = byOrder(3);
  if (defBlock) {
    const content = defBlock.content as { html: string };
    const addendum = `
<div style="background:#0f172a;border-left:4px solid #a78bfa;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:10px">
  <p style="color:#a78bfa;margin:0 0 4px;font-weight:bold">🔁 Et une chose en plus : il peut changer de programme</p>
  <p style="color:#94a3b8;margin:0">Une calculatrice fait aussi des calculs… mais elle fait <strong style="color:#cbd5e1">toujours la même chose</strong>, on ne peut pas la reprogrammer. Un vrai ordinateur, lui, peut apprendre à faire plein de tâches différentes selon le programme qu'on lui donne. C'est cette différence qui en fait un <em>vrai</em> ordinateur !</p>
</div>`;
    if (content.html.includes("Et une chose en plus")) {
      console.log("  ⏭️  [03] Définition — déjà corrigée, ignoré");
    } else {
      const newHtml = content.html.replace(
        /(<div style="background:#0f172a;border-left:4px solid #60a5fa[^>]*>[\s\S]*?<\/div>)/,
        `$1${addendum}`
      );
      if (newHtml === content.html) {
        console.error("  ❌ [03] Définition — bloc d'ancrage introuvable, rien changé.");
      } else {
        const { error: e } = await sb.from("lesson_blocks").update({ content: { html: newHtml } }).eq("id", defBlock.id);
        if (e) console.error("  ❌ [03] Définition:", e.message);
        else console.log("  ✓ [03] Définition — critère \"reprogrammable\" ajouté");
      }
    }
  }

  // ── 4. Jeux Memory → Association (order_index 5 et 8) ────────────────────────
  for (const oi of [5, 8]) {
    const gameBlock = byOrder(oi);
    if (!gameBlock) continue;
    const content = gameBlock.content as { game_type: string; [k: string]: unknown };
    if (content.game_type === "association") {
      console.log(`  ⏭️  [${String(oi).padStart(2, "0")}] Jeu — déjà en mode association, ignoré`);
      continue;
    }
    const { error: e } = await sb
      .from("lesson_blocks")
      .update({ content: { ...content, game_type: "association" } })
      .eq("id", gameBlock.id);
    if (e) console.error(`  ❌ [${oi}] Jeu:`, e.message);
    else console.log(`  ✓ [${String(oi).padStart(2, "0")}] Jeu Memory → Association (cartes visibles)`);
  }

  console.log("\n✅ Correctifs appliqués (progression des élèves préservée — mêmes IDs de blocs).");
  if (!NEW_VIDEO_URL) {
    console.log("⚠️  Pense à relancer ce script avec NEW_VIDEO_URL renseignée une fois la vidéo choisie.");
  }
}

main().catch(console.error);
