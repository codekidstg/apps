/**
 * Seed Trimestre 1 — "Je guide un robot dans un labyrinthe" (Septembre)
 * 4 séances · 4 leçons · contenu enrichi pour enfants 10-15 ans
 *
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-septembre.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Maze configs ─────────────────────────────────────────────────────────────

const MAZE_1 = {
  grid_size: 5,
  start: { x: 0, y: 2, dir: "E" },
  goal:  { x: 4, y: 2 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },
    { x:0,y:4 },{ x:1,y:4 },{ x:2,y:4 },{ x:3,y:4 },{ x:4,y:4 },
  ],
  max_blocks: 6,
  available_blocks: ["robot_move"],
  title: "Niveau 1 — Le couloir droit",
  instructions: "Guide Kirikou jusqu'à l'étoile !",
  steps: [
    "Kirikou regarde vers la droite → (vois la flèche sous lui)",
    "Utilise le bloc 🚀 Avancer",
    "Avance-le 4 fois jusqu'à l'étoile ⭐",
  ],
};

const MAZE_2 = {
  grid_size: 5,
  start: { x: 0, y: 0, dir: "E" },
  goal:  { x: 4, y: 4 },
  walls: [
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },
    { x:0,y:2 },{ x:0,y:3 },{ x:0,y:4 },
    { x:1,y:2 },{ x:1,y:3 },{ x:1,y:4 },
    { x:2,y:2 },{ x:2,y:3 },{ x:2,y:4 },
    { x:3,y:2 },{ x:3,y:3 },{ x:3,y:4 },
  ],
  max_blocks: 12,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  title: "Niveau 2 — Le virage en L",
  instructions: "Kirikou doit tourner pour trouver la sortie !",
  steps: [
    "Avance Kirikou tout à droite jusqu'au mur",
    "Tourne à droite ↱ pour regarder vers le bas",
    "Avance encore jusqu'à l'étoile ⭐",
  ],
};

/**
 * Niveau 3 — Le labyrinthe en S (6×6)
 * Départ : (0,0) direction Est
 * Chemin  : →×2, ↓×3 (tourner droite), →×3 (tourner gauche), ↓×2 (tourner droite)
 * Solution: Avancer×2, Tourner droite, Avancer×3, Tourner gauche, Avancer×3, Tourner droite, Avancer×2
 *
 * Grille :
 *   0  1  2  3  4  5
 * 0 K  .  .  W  W  W
 * 1 W  W  .  W  .  .
 * 2 W  W  .  W  .  .
 * 3 W  W  .  .  .  .
 * 4 W  W  W  W  W  .
 * 5 W  W  W  W  W  *
 */
const MAZE_3 = {
  grid_size: 6,
  start: { x: 0, y: 0, dir: "E" },
  goal:  { x: 5, y: 5 },
  walls: [
    // Mur haut-droit → force à s'arrêter après 2 cases
    { x:3,y:0 },{ x:4,y:0 },{ x:5,y:0 },
    // Bloc gauche fermé (colonnes 0-1, lignes 1-5)
    { x:0,y:1 },{ x:0,y:2 },{ x:0,y:3 },{ x:0,y:4 },{ x:0,y:5 },
    { x:1,y:1 },{ x:1,y:2 },{ x:1,y:3 },{ x:1,y:4 },{ x:1,y:5 },
    // Mur droit du premier couloir vertical (col 3, lignes 1-2)
    { x:3,y:1 },{ x:3,y:2 },
    // Plancher du premier couloir + bloc milieu-bas
    { x:2,y:4 },{ x:2,y:5 },
    { x:3,y:4 },{ x:3,y:5 },{ x:4,y:4 },{ x:4,y:5 },
  ],
  max_blocks: 16,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  title: "Niveau 3 — Le labyrinthe en S",
  instructions: "Trois virages t'attendent — planifie avant de lancer !",
  steps: [
    "→ Avance vers la droite jusqu'au mur — 2 cases",
    "↱ Tourne DROITE pour descendre ↓, avance 3 cases",
    "↰ Tourne GAUCHE pour repartir vers la droite →, avance 3 cases",
    "↱ Tourne DROITE pour descendre ↓ jusqu'à l'étoile ⭐",
  ],
};

const MAZE_4 = {
  grid_size: 7,
  start: { x: 1, y: 1, dir: "S" },
  goal:  { x: 5, y: 6 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },{ x:5,y:0 },{ x:6,y:0 },
    { x:0,y:1 },{ x:4,y:1 },{ x:6,y:1 },
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },{ x:4,y:2 },{ x:6,y:2 },
    { x:0,y:3 },{ x:6,y:3 },
    { x:0,y:4 },{ x:2,y:4 },{ x:3,y:4 },{ x:4,y:4 },{ x:6,y:4 },
    { x:0,y:5 },{ x:4,y:5 },{ x:6,y:5 },
    { x:0,y:6 },{ x:1,y:6 },{ x:2,y:6 },{ x:6,y:6 },
  ],
  collectibles: [
    { x: 5, y: 1, type: "gem" },
    { x: 3, y: 5, type: "key" },
  ],
  locked_doors: [{ x: 3, y: 6, requires: "key" }],
  max_blocks: 18,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  title: "Niveau 4 — La clé et la porte secrète",
  instructions: "L'ordre des instructions est CRUCIAL ici !",
  steps: [
    "Ramasse la clé 🗝️ en passant dessus",
    "La porte 🚪 s'ouvre dès que tu as la clé",
    "Atteins la sortie ⭐ — gemme 💎 en bonus !",
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function upsertTheme(title: string, slug: string): Promise<string> {
  const { data: ex } = await sb.from("themes").select("id").eq("slug", slug).maybeSingle();
  if (ex) { console.log(`  ↩ Thème existant (${ex.id})`); return ex.id as string; }
  const { data, error } = await sb.from("themes").insert({
    title, slug,
    description: "Apprendre à décomposer un problème en étapes claires et guider un personnage à travers un labyrinthe.",
    level: "explorer",
    status: "published",
    estimated_hours: 4,
    published_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw error;
  console.log(`  ✓ Thème créé (${(data as any).id})`);
  return (data as any).id as string;
}

async function upsertChapter(themeId: string, title: string, desc: string, order: number): Promise<string> {
  const { data: ex } = await sb.from("chapters").select("id").eq("theme_id", themeId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await sb.from("chapters").insert({ theme_id: themeId, title, description: desc, order_index: order }).select("id").single();
  if (error) throw error;
  return (data as any).id as string;
}

async function upsertLesson(chapterId: string, themeId: string, title: string, order: number, xp = 60): Promise<string> {
  const { data: ex } = await sb.from("lessons").select("id").eq("chapter_id", chapterId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await sb.from("lessons").insert({ chapter_id: chapterId, theme_id: themeId, title, order_index: order, xp_reward: xp }).select("id").single();
  if (error) throw error;
  return (data as any).id as string;
}

async function seedBlocks(lessonId: string, themeId: string, blocks: object[]) {
  await sb.from("lesson_blocks").delete().eq("lesson_id", lessonId);
  const rows = blocks.map((b: any) => ({ ...b, lesson_id: lessonId, theme_id: themeId }));
  const { error } = await sb.from("lesson_blocks").insert(rows);
  if (error) throw error;
  console.log(`    ✓ ${rows.length} blocs (re)insérés`);
}

// ── Contenu ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Seed Septembre — Je guide un robot dans un labyrinthe\n");

  const themeId = await upsertTheme(
    "Je guide un robot dans un labyrinthe",
    "septembre-labyrinthe"
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 1 — Qu'est-ce qu'un algorithme ?
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 1");
  const ch1 = await upsertChapter(themeId,
    "Séance 1 — Mon premier algorithme",
    "Découvrir ce qu'est un algorithme et écrire sa première séquence d'instructions.",
    0
  );
  const l1 = await upsertLesson(ch1, themeId, "Mon premier algorithme", 0, 50);
  await seedBlocks(l1, themeId, [

    // ── Bloc 1 : accroche ──
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#fbbf24;font-weight:900;font-size:1.1em;margin:0 0 6px">🤖 Tu vas apprendre à parler le langage des robots.</p>
  <p style="color:#cbd5e1;margin:0">Pas besoin d'être un génie. Juste besoin de savoir <strong style="color:white">donner des instructions claires… dans le bon ordre.</strong></p>
</div>
      `.trim() },
    },

    // ── Bloc 2 : qu'est-ce qu'un algorithme ──
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🍳 C'est quoi un algorithme ?</h2>

<p>Avant même d'ouvrir une application, tu utilises des algorithmes tous les jours sans le savoir.</p>

<p>Un <strong>algorithme</strong>, c'est simplement une <strong>liste d'étapes dans un ordre précis</strong> pour accomplir quelque chose.</p>

<p>Exemple : préparer un bol de céréales le matin.</p>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <p style="color:#94a3b8;font-size:0.85em;margin:0 0 10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Algorithme "Céréales du matin"</p>
  <ol style="margin:0;padding-left:20px;color:#e2e8f0;line-height:2">
    <li>Prendre un bol</li>
    <li>Verser les céréales dans le bol</li>
    <li>Ajouter le lait</li>
    <li>Prendre une cuillère</li>
    <li>Manger 🥄</li>
  </ol>
</div>

<p>👆 Si tu changes l'ordre des étapes — par exemple si tu mets le lait <em>avant</em> les céréales — ça marche encore. Mais si tu manges <em>avant</em> de prendre le bol… problème ! 😅</p>

<p>En informatique, c'est pareil. Un programme est un algorithme que <strong>la machine exécute à la lettre</strong>, étape par étape, sans jamais improviser.</p>
      `.trim() },
    },

    // ── Bloc 3 : quiz ──
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Parmi ces définitions, laquelle décrit le mieux un algorithme ?",
        choices: [
          "Un robot qui pense et décide tout seul",
          "Une liste d'étapes dans un ordre précis pour accomplir une tâche",
          "Un bug qui fait planter un programme",
          "Un langage de programmation comme Python",
        ],
        answer: 1,
        explanation: "✅ Exactement ! Un algorithme, c'est une recette. Une série d'instructions précises et ordonnées. Le robot les suit à la lettre — toi tu es le chef cuisinier !",
      },
    },

    // ── Bloc 4 : le robot obéit aveuglément ──
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🤖 Le robot obéit… mais il ne réfléchit pas</h2>

<p>Voilà ce qui rend la programmation à la fois <strong>puissante</strong> et <strong>délicate</strong> :</p>

<p>Un robot (ou un ordinateur) fait <em>exactement</em> ce qu'on lui dit. Pas plus, pas moins. Il ne devine pas ce que tu veux dire. Il ne corrige pas tes erreurs. Il exécute tes instructions à la lettre, même si elles mènent dans un mur.</p>

<div style="display:flex;gap:16px;margin:16px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:200px;background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px">
    <p style="color:#4ade80;font-weight:900;margin:0 0 6px">✅ Ce que le robot comprend</p>
    <p style="color:#86efac;margin:0;font-size:0.9em">"Avance de 3 cases vers la droite →, puis tourne à droite de 90°, puis avance de 2 cases."</p>
  </div>
  <div style="flex:1;min-width:200px;background:#450a0a;border:1px solid #991b1b;border-radius:10px;padding:14px">
    <p style="color:#f87171;font-weight:900;margin:0 0 6px">❌ Ce que le robot ne comprend PAS</p>
    <p style="color:#fca5a5;margin:0;font-size:0.9em">"Va par là et ramène-moi ce truc brillant."</p>
  </div>
</div>

<p>C'est pour ça que les développeurs doivent être <strong>très précis</strong> quand ils écrivent du code. Une instruction vague = un bug garanti.</p>
      `.trim() },
    },

    // ── Bloc 5 : quiz ──
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Tu demandes à un robot : \"Va chercher quelque chose à manger dans la cuisine.\" Que va-t-il se passer ?",
        choices: [
          "Le robot va au frigo et prend ce qui lui semble bon",
          "Le robot fait une erreur car l'instruction n'est pas assez précise",
          "Le robot comprend et adapte l'ordre selon le contexte",
          "Le robot affiche : \"Tâche accomplie !\"",
        ],
        answer: 1,
        explanation: "🎯 Bonne réponse ! \"Quelque chose à manger\" est trop vague. Un robot a besoin d'instructions précises : quel aliment, dans quel placard, comment l'attraper... Sans précision, c'est le bug assuré !",
      },
    },

    // ── Bloc 6 : présentation du jeu ──
    {
      type: "text", order_index: 5,
      content: { html: `
<h2>🎮 Entre en jeu : Kirikou dans le labyrinthe</h2>

<p>Tu vas maintenant écrire ton <strong>tout premier algorithme</strong> pour guider <strong>Kirikou</strong> à travers un labyrinthe.</p>

<p>Kirikou est un petit personnage courageux — mais il a besoin de toi. Sans tes instructions, il reste immobile. C'est toi le programmeur !</p>

<h3>Comment ça marche ?</h3>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 10px"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">1</span> &nbsp;Dans la partie gauche, tu vois les <strong>blocs de commande</strong> disponibles</p>
  <p style="color:#e2e8f0;margin:0 0 10px"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">2</span> &nbsp;Glisse et dépose les blocs dans la zone de travail pour construire ton programme</p>
  <p style="color:#e2e8f0;margin:0 0 10px"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">3</span> &nbsp;Clique sur <strong>▶ Lancer !</strong> pour voir Kirikou exécuter ton algorithme</p>
  <p style="color:#e2e8f0;margin:0"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">4</span> &nbsp;Si ça ne marche pas, clique <strong>↺ Reset</strong> et recommence</p>
</div>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 Pour ce premier niveau :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Tu n'as qu'un seul bloc disponible : <code style="background:#292524;padding:2px 6px;border-radius:4px">🚀 Avancer</code>. Kirikou regarde déjà à droite. Compte le nombre de cases jusqu'à l'étoile ⭐ et place le bon nombre de blocs !</p>
</div>
      `.trim() },
    },

    // ── Bloc 7 : MAZE 1 ──
    {
      type: "game", order_index: 6,
      content: MAZE_1,
    },

    // ── Bloc 8 : conclusion séance 1 ──
    {
      type: "text", order_index: 7,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🏆 Tu as écrit ton premier algorithme !</h3>
  <p style="color:#86efac;margin:0 0 12px">C'est exactement ce que font les développeurs professionnels — décomposer un problème en petites étapes claires, une par une.</p>
  <p style="color:#86efac;margin:0">➡️ Dans la prochaine séance, tu vas apprendre à faire <strong>tourner</strong> Kirikou. Les labyrinthes vont devenir plus complexes !</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Un algorithme est une liste d'étapes ordonnées<br>
    ✓ Un robot exécute les instructions à la lettre<br>
    ✓ La précision est la clé d'un bon programme
  </p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 2 — Tourner dans le labyrinthe
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 2");
  const ch2 = await upsertChapter(themeId,
    "Séance 2 — Les virages",
    "Apprendre à tourner et comprendre les 4 directions.",
    1
  );
  const l2 = await upsertLesson(ch2, themeId, "Gauche ou droite ?", 0, 60);
  await seedBlocks(l2, themeId, [

    // ── Bloc 1 : rappel + intro ──
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin-bottom:4px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">📌 <strong style="color:#e2e8f0">Rappel de la séance 1 :</strong> un algorithme = une liste d'instructions dans l'ordre. Le robot les exécute à la lettre, sans jamais improviser.</p>
</div>
      `.trim() },
    },

    // ── Bloc 2 : la boussole ──
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🧭 Les 4 directions de Kirikou</h2>

<p>Dans le labyrinthe, Kirikou peut regarder dans <strong>4 directions</strong> — par rapport à <em>ton écran</em> :</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0;max-width:400px">
  <div style="background:#1e3a5f;border-radius:8px;padding:12px;text-align:center">
    <div style="font-size:1.5em">↑</div>
    <strong style="color:#93c5fd">Haut</strong>
    <p style="color:#cbd5e1;font-size:0.85em;margin:4px 0 0">vers le haut de l'écran</p>
  </div>
  <div style="background:#1e3a5f;border-radius:8px;padding:12px;text-align:center">
    <div style="font-size:1.5em">→</div>
    <strong style="color:#93c5fd">Droite</strong>
    <p style="color:#cbd5e1;font-size:0.85em;margin:4px 0 0">vers la droite de l'écran</p>
  </div>
  <div style="background:#1e3a5f;border-radius:8px;padding:12px;text-align:center">
    <div style="font-size:1.5em">↓</div>
    <strong style="color:#93c5fd">Bas</strong>
    <p style="color:#cbd5e1;font-size:0.85em;margin:4px 0 0">vers le bas de l'écran</p>
  </div>
  <div style="background:#1e3a5f;border-radius:8px;padding:12px;text-align:center">
    <div style="font-size:1.5em">←</div>
    <strong style="color:#93c5fd">Gauche</strong>
    <p style="color:#cbd5e1;font-size:0.85em;margin:4px 0 0">vers la gauche de l'écran</p>
  </div>
</div>

<div style="background:#431407;border-left:4px solid #f97316;padding:12px 16px;border-radius:4px;margin:16px 0">
  <strong style="color:#fb923c">⚠️ Attention — le piège classique !</strong>
  <p style="color:#fed7aa;margin:8px 0 0">« ↱ Tourner droite » <strong>ne veut pas dire avancer vers la droite de l'écran</strong>. Ça veut dire pivoter de 90° dans le sens des aiguilles d'une montre. Si Kirikou regarde vers le bas ↓ et qu'il tourne à droite ↱ — il regardera maintenant vers la gauche ← ! Regarde toujours la flèche sous Kirikou avant de coder.</p>
</div>

<p>Quand Kirikou <strong>tourne</strong>, il pivote de 90° sur place — sans avancer. Ensuite, tu dois lui dire d'avancer pour qu'il bouge dans la nouvelle direction.</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#94a3b8;font-size:0.85em;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em">Tableau des virages (par rapport à l'écran)</p>
  <table style="width:100%;border-collapse:collapse;font-size:0.9em">
    <tr style="color:#64748b">
      <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #334155">Kirikou regarde…</th>
      <th style="text-align:center;padding:6px 8px;border-bottom:1px solid #334155">↱ Tourner droite → il regardera</th>
      <th style="text-align:center;padding:6px 8px;border-bottom:1px solid #334155">↰ Tourner gauche → il regardera</th>
    </tr>
    <tr style="color:#e2e8f0">
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b">↑ vers le haut</td>
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b;text-align:center">→ droite</td>
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b;text-align:center">← gauche</td>
    </tr>
    <tr style="color:#e2e8f0">
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b">→ vers la droite</td>
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b;text-align:center">↓ bas</td>
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b;text-align:center">↑ haut</td>
    </tr>
    <tr style="color:#e2e8f0">
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b">↓ vers le bas</td>
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b;text-align:center">← gauche</td>
      <td style="padding:6px 8px;border-bottom:1px solid #1e293b;text-align:center">→ droite</td>
    </tr>
    <tr style="color:#e2e8f0">
      <td style="padding:6px 8px">← vers la gauche</td>
      <td style="padding:6px 8px;text-align:center">↑ haut</td>
      <td style="padding:6px 8px;text-align:center">↓ bas</td>
    </tr>
  </table>
</div>
      `.trim() },
    },

    // ── Bloc 3 : astuce mémorisation ──
    {
      type: "text", order_index: 2,
      content: { html: `
<h3>🤝 L'astuce pour ne jamais se tromper</h3>

<p>Tends ta <strong>main droite</strong> devant toi, le pouce vers le haut.</p>
<p>Tes doigts pointent dans la direction où tu regardes. Ton pouce indique "haut". En tournant ta main vers la droite de 90°, tu obtiens la nouvelle direction.</p>
<p>C'est la <strong>règle de la main droite</strong> — les ingénieurs l'utilisent encore aujourd'hui ! 🔧</p>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 Petit truc :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Tu peux toujours trouver la direction opposée avec <strong>2 tournages</strong> dans le même sens. Droite → ↱ → bas → ↱ → gauche. Ou plus rapide : 1 seul tournage dans l'autre sens !</p>
</div>
      `.trim() },
    },

    // ── Bloc 4 : quiz ──
    {
      type: "quiz", order_index: 3,
      content: {
        question: "Kirikou regarde vers la droite →. Il tourne à droite ↱. Dans quelle direction regarde-t-il maintenant ?",
        choices: [
          "↑ vers le haut",
          "← vers la gauche",
          "↓ vers le bas",
          "→ vers la droite (il reste pareil)",
        ],
        answer: 2,
        explanation: "✅ Parfait ! Regarder droite → + tourner droite ↱ = regarder vers le bas ↓. C'est comme pivoter sur toi-même dans le sens des aiguilles d'une montre — si tu regardais à droite, maintenant tu regardes en bas !",
      },
    },

    // ── Bloc 5 : quiz ──
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Kirikou regarde vers le bas ↓. Il veut regarder vers la droite →. Quelle est la solution la plus COURTE ?",
        choices: [
          "Tourner droite ↱ 1 fois",
          "Tourner gauche ↰ 1 fois",
          "Tourner droite ↱ 3 fois",
          "Avancer puis tourner",
        ],
        answer: 1,
        explanation: "✅ Bravo ! Regarder bas ↓ + tourner gauche ↰ = regarder droite →. Une seule instruction au lieu de 3 tournages à droite. En programmation, le code le plus court et le plus efficace est souvent le meilleur — c'est ce qu'on appelle l'élégance ! ✨",
      },
    },

    // ── Bloc 6 : méthode de planification ──
    {
      type: "text", order_index: 5,
      content: { html: `
<h2>🗺️ Planifier avant de coder</h2>

<p>Les meilleurs développeurs ne se lancent <strong>jamais</strong> dans le code sans réfléchir d'abord. Ils tracent leur plan — sur papier, dans leur tête, ou en expliquant à voix haute.</p>

<p>On appelle ça la méthode <strong>"Duck Debugging"</strong> (le débogage du canard en plastique 🦆). Quand un développeur est bloqué, il s'explique son problème à voix haute… parfois à un canard en plastique. L'action de mettre les mots dessus révèle souvent la solution !</p>

<h3>Ta méthode pour ce niveau :</h3>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 10px">
    <span style="color:#fbbf24;font-weight:900">Étape 1 🔍</span> — Repère la position de départ de Kirikou et la position de l'étoile ⭐
  </p>
  <p style="color:#e2e8f0;margin:0 0 10px">
    <span style="color:#fbbf24;font-weight:900">Étape 2 🗺️</span> — Trace le chemin dans ta tête (ou avec ton doigt sur l'écran)
  </p>
  <p style="color:#e2e8f0;margin:0 0 10px">
    <span style="color:#fbbf24;font-weight:900">Étape 3 📝</span> — Traduis chaque segment en blocs : "3 cases à droite = 3× Avancer", "virage = Tourner"
  </p>
  <p style="color:#e2e8f0;margin:0">
    <span style="color:#fbbf24;font-weight:900">Étape 4 ▶️</span> — Lance et observe ! Si ça plante, tu sais exactement où chercher
  </p>
</div>
      `.trim() },
    },

    // ── Bloc 7 : MAZE 2 ──
    {
      type: "game", order_index: 6,
      content: MAZE_2,
    },

    // ── Bloc 8 : conclusion ──
    {
      type: "text", order_index: 7,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #4338ca;border-radius:12px;padding:20px 24px">
  <h3 style="color:#a5b4fc;margin:0 0 10px">↱ Tu maîtrises les virages !</h3>
  <p style="color:#c7d2fe;margin:0 0 12px">Tu sais maintenant guider Kirikou dans n'importe quelle direction. C'est un vrai superpouvoir en programmation !</p>
  <p style="color:#c7d2fe;margin:0">➡️ Prochaine séance : il y aura des <strong>obstacles</strong> sur le chemin, et tu devras apprendre à <strong>déboguer</strong> quand ton programme ne fait pas exactement ce que tu veux.</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Les 4 directions : Nord, Est, Sud, Ouest<br>
    ✓ Tourner droite et tourner gauche changent la direction de 90°<br>
    ✓ La méthode "planifier avant de coder"
  </p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 3 — Déboguer
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 3");
  const ch3 = await upsertChapter(themeId,
    "Séance 3 — Le débogage",
    "Comprendre les erreurs, les lire, et corriger son programme.",
    2
  );
  const l3 = await upsertLesson(ch3, themeId, "Déboguer son programme", 0, 70);
  await seedBlocks(l3, themeId, [

    // ── Bloc 1 : accroche bug ──
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#450a0a,#1c0a0a);border:1px solid #991b1b;border-radius:12px;padding:20px 24px;margin-bottom:4px">
  <p style="color:#fca5a5;font-weight:900;font-size:1.1em;margin:0 0 6px">🐛 Bienvenue dans la réalité du développeur.</p>
  <p style="color:#fecaca;margin:0">Même les meilleurs programmeurs ont des bugs dans leur code. La différence, c'est qu'ils savent comment les <strong>trouver et les corriger</strong>.</p>
</div>
      `.trim() },
    },

    // ── Bloc 2 : histoire du vrai bug ──
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🐛 D'où vient le mot "bug" ?</h2>

<p>En 1947, une ingénieure américaine appelée <strong>Grace Hopper</strong> travaillait sur l'un des premiers ordinateurs du monde — une machine énorme qui remplissait une salle entière.</p>

<p>Un jour, l'ordinateur a mystérieusement planté. Après des heures de recherche, Grace et son équipe ont découvert la cause : une <strong>vraie mouche</strong> coincée entre deux composants électroniques !</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0;text-align:center">
  <p style="color:#94a3b8;font-style:italic;margin:0">"Bug" signifie "insecte" en anglais. Ce jour-là, Grace a noté dans son carnet : <strong style="color:#e2e8f0">"First actual case of bug being found."</strong></p>
  <p style="color:#64748b;font-size:0.85em;margin:6px 0 0">Premier cas réel d'un insecte trouvé dans un programme 🪲</p>
</div>

<p>Depuis, on appelle toutes les erreurs dans un programme des <strong>bugs</strong>, et l'action de les corriger s'appelle le <strong>débogage</strong> (debugging).</p>

<p>Grace Hopper est devenue une légende de l'informatique. La prochaine fois que tu débogues ton code, tu marches dans ses pas ! 👩‍💻</p>
      `.trim() },
    },

    // ── Bloc 3 : types d'erreurs ──
    {
      type: "text", order_index: 2,
      content: { html: `
<h2>🔍 Les types d'erreurs que tu peux faire</h2>

<p>En programmation (et dans le labyrinthe), il existe plusieurs types d'erreurs :</p>

<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0">

  <div style="background:#1e293b;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px">
    <strong style="color:#f87171">💥 Erreur de mur</strong>
    <p style="color:#cbd5e1;margin:6px 0 0;font-size:0.9em">Kirikou essaie d'avancer dans un mur. Le programme s'arrête immédiatement. Message : <em>"Kirikou a heurté un obstacle"</em>. <strong>Solution :</strong> recompter les cases ou ajouter un virage avant l'obstacle.</p>
  </div>

  <div style="background:#1e293b;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px">
    <strong style="color:#fbbf24">🎯 Erreur de destination</strong>
    <p style="color:#cbd5e1;margin:6px 0 0;font-size:0.9em">Kirikou termine ses instructions mais n'est pas sur l'étoile. Message : <em>"Kirikou n'a pas atteint la sortie"</em>. <strong>Solution :</strong> recompter les cases restantes, ajouter des blocs.</p>
  </div>

  <div style="background:#1e293b;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;padding:12px 16px">
    <strong style="color:#a78bfa">↩ Erreur de direction</strong>
    <p style="color:#cbd5e1;margin:6px 0 0;font-size:0.9em">Kirikou tourne du mauvais côté et part dans la mauvaise direction. <strong>Solution :</strong> vérifier le tableau des virages et choisir gauche ou droite selon la direction actuelle.</p>
  </div>

</div>
      `.trim() },
    },

    // ── Bloc 4 : méthode de débogage ──
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🔧 La méthode de débogage en 4 étapes</h2>

<p>Quand ton programme ne fonctionne pas, voilà comment procéder :</p>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start">
    <span style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9em;flex-shrink:0">1</span>
    <div>
      <strong style="color:#e2e8f0">Lire le message d'erreur</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">Il te dit ce qui s'est passé ("a heurté un mur", "n'a pas atteint la cible"). Ne l'ignore jamais !</p>
    </div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start">
    <span style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9em;flex-shrink:0">2</span>
    <div>
      <strong style="color:#e2e8f0">Localiser l'erreur</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">Observe où Kirikou s'est arrêté. Quelle instruction a causé le problème ?</p>
    </div>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start">
    <span style="background:#3b82f6;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9em;flex-shrink:0">3</span>
    <div>
      <strong style="color:#e2e8f0">Comprendre POURQUOI</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">Rejoue les instructions dans ta tête : comptais-tu les bonnes cases ? As-tu tourné au bon moment ? Dans le bon sens ?</p>
    </div>
  </div>
  <div style="display:flex;gap:12px;align-items:flex-start">
    <span style="background:#10b981;color:white;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9em;flex-shrink:0">4</span>
    <div>
      <strong style="color:#e2e8f0">Corriger et relancer</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">Modifie <em>seulement</em> la partie qui pose problème — ne recommence pas de zéro à chaque fois !</p>
    </div>
  </div>
</div>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">🦆 Le secret des pros :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Quand tu es vraiment bloqué, explique ton problème à voix haute. Dis les étapes une par une. Très souvent, tu vas trouver toi-même l'erreur en l'expliquant ! C'est la technique du canard en plastique — et elle marche vraiment. 😄</p>
</div>
      `.trim() },
    },

    // ── Bloc 5 : quiz ──
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Kirikou heurte un mur à la 3e instruction. Que fais-tu EN PREMIER ?",
        choices: [
          "Supprimer tous les blocs et recommencer depuis zéro",
          "Ajouter plus de blocs Avancer au hasard",
          "Regarder où Kirikou s'est arrêté et comprendre quelle instruction a causé le problème",
          "Réduire le nombre de blocs de moitié",
        ],
        answer: 2,
        explanation: "✅ Exactement ! Débogage = analyse, pas panique. Tu localises d'abord le problème, puis tu corriges chirurgicalement. Supprimer tout revient à démolir une maison parce qu'une fenêtre est cassée ! 🏠",
      },
    },

    // ── Bloc 6 : quiz ──
    {
      type: "quiz", order_index: 5,
      content: {
        question: "Ton programme : Avancer×2, Tourner droite, Avancer×3. Kirikou s'arrête sur un mur après le 2e Avancer. Quel est le problème ?",
        choices: [
          "Il faut ajouter un Avancer au début",
          "Le virage est trop tôt — il faut avancer 1 fois de plus avant de tourner",
          "Il faut utiliser Tourner gauche à la place",
          "Il manque des blocs après les 3 Avancer",
        ],
        answer: 1,
        explanation: "✅ Bien joué ! Le mur est après 3 cases, pas 2. Le virage arrive trop tôt. En changeant Avancer×2 en Avancer×3 avant le tournage, Kirikou évite le mur. C'est une erreur de comptage — la plus fréquente chez les débutants !",
      },
    },

    // ── Bloc 7 : intro maze ──
    {
      type: "text", order_index: 6,
      content: { html: `
<h2>🎮 Le labyrinthe en S — 3 virages t'attendent</h2>

<p>Ce niveau est le plus difficile jusqu'ici. Il a <strong>trois virages</strong> et des zones fermées qui forcent Kirikou à suivre un chemin précis.</p>

<p>Tu n'y arriveras peut-être pas du premier coup. C'est <strong>totalement normal</strong> et c'est même fait exprès ! L'objectif de ce niveau, c'est de pratiquer le débogage.</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;font-weight:700;margin:0 0 8px">🗺️ Stratégie recommandée :</p>
  <ul style="color:#94a3b8;margin:0;padding-left:20px;line-height:1.8;font-size:0.9em">
    <li>Trace le chemin avec ton doigt sur l'écran AVANT de coder</li>
    <li>Code et teste un tronçon à la fois — ne code pas tout d'un coup</li>
    <li>Quand ça plante, identifie où Kirikou s'arrête et corrige seulement cette partie</li>
    <li>Chaque essai raté = une information précieuse</li>
  </ul>
</div>
      `.trim() },
    },

    // ── Bloc 8 : MAZE 3 ──
    {
      type: "game", order_index: 7,
      content: MAZE_3,
    },

    // ── Bloc 9 : conclusion ──
    {
      type: "text", order_index: 8,
      content: { html: `
<div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #78350f;border-radius:12px;padding:20px 24px">
  <h3 style="color:#fbbf24;margin:0 0 10px">🔧 Tu es un débogueur !</h3>
  <p style="color:#fde68a;margin:0 0 12px">Si tu as dû corriger ton programme plusieurs fois avant d'y arriver — <strong>bravo !</strong> C'est exactement ce que font les vrais développeurs. Un bug corrigé = une compétence acquise.</p>
  <p style="color:#fde68a;margin:0">➡️ La prochaine et dernière séance est le <strong>défi final</strong> : la clé et la porte secrète. Tu devras maîtriser l'ordre de toutes tes actions simultanément !</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Un bug est une erreur dans un programme — ça arrive à tous les développeurs<br>
    ✓ La méthode de débogage : lire → localiser → comprendre → corriger<br>
    ✓ On ne recommence pas de zéro — on corrige chirurgicalement
  </p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 4 — L'ordre des instructions (défi final)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 4");
  const ch4 = await upsertChapter(themeId,
    "Séance 4 — L'ordre compte !",
    "Comprendre que l'ordre des instructions change tout : clé avant porte.",
    3
  );
  const l4 = await upsertLesson(ch4, themeId, "La clé et la porte secrète", 0, 100);
  await seedBlocks(l4, themeId, [

    // ── Bloc 1 : accroche ──
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #6d28d9;border-radius:12px;padding:20px 24px;margin-bottom:4px">
  <p style="color:#c4b5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🗝️ Dernière séance. Le défi final t'attend.</p>
  <p style="color:#ddd6fe;margin:0">Tout ce que tu as appris ce mois-ci va servir en même temps : algorithme, directions, débogage… et maintenant <strong>l'ordre des instructions</strong>.</p>
</div>
      `.trim() },
    },

    // ── Bloc 2 : l'ordre change tout ──
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>📋 Pourquoi l'ordre des instructions change tout</h2>

<p>Rappelle-toi la recette des céréales de la séance 1. Certaines étapes doivent se passer <em>avant</em> d'autres — sinon tout s'effondre.</p>

<p>En programmation, on appelle ça la <strong>dépendance entre les instructions</strong>. Une action dépend d'une autre qui doit avoir eu lieu avant.</p>

<h3>Des exemples de la vraie vie :</h3>

<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0">

  <div style="background:#1e293b;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px">
    <span style="font-size:1.4em">📱</span>
    <div>
      <strong style="color:#e2e8f0">Application mobile</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">Tu dois d'abord <em>te connecter</em> avant de pouvoir <em>envoyer un message</em>. Si l'ordre est inversé, l'app plante.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px">
    <span style="font-size:1.4em">🏧</span>
    <div>
      <strong style="color:#e2e8f0">Distributeur automatique</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">Tu dois d'abord <em>insérer ta carte</em>, puis <em>taper ton code</em>, avant de <em>retirer de l'argent</em>. Chaque étape débloque la suivante.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px">
    <span style="font-size:1.4em">🚗</span>
    <div>
      <strong style="color:#e2e8f0">Voiture</strong>
      <p style="color:#94a3b8;margin:4px 0 0;font-size:0.9em">D'abord <em>mettre la clé</em> (ou appuyer sur start), puis <em>démarrer</em>, puis <em>rouler</em>. Essaie de conduire sans avoir démarré…</p>
    </div>
  </div>

</div>

<p>Dans le labyrinthe de cette séance, il y a une <strong>porte verrouillée 🚪</strong> sur le chemin de Kirikou. Pour qu'elle s'ouvre, il faut <strong>ramasser la clé 🗝️ avant d'y arriver</strong>. Si Kirikou arrive à la porte sans la clé, le programme s'arrête — c'est un bug de séquence.</p>
      `.trim() },
    },

    // ── Bloc 3 : quiz ──
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Kirikou arrive devant la porte avant d'avoir ramassé la clé. Que se passe-t-il ?",
        choices: [
          "La porte s'ouvre quand même si le reste du chemin est correct",
          "La porte bloque le passage — erreur de séquence à corriger",
          "Kirikou peut sauter par-dessus la porte",
          "La clé se téléporte automatiquement dans sa poche",
        ],
        answer: 1,
        explanation: "✅ Exactement ! L'ordre est fondamental. La porte vérifie si Kirikou a déjà la clé. Si non : bloqué. C'est une logique qu'on retrouve dans TOUS les programmes : une action débloque la suivante seulement si elle a eu lieu avant.",
      },
    },

    // ── Bloc 4 : quiz ──
    {
      type: "quiz", order_index: 3,
      content: {
        question: "Pour accéder à ton espace CodeKids, tu dois faire ces 3 actions. Quel est le bon ordre ?",
        choices: [
          "Voir ton tableau de bord → Entrer ton mot de passe → Ouvrir l'application",
          "Ouvrir l'application → Entrer ton mot de passe → Voir ton tableau de bord",
          "Entrer ton mot de passe → Ouvrir l'application → Voir ton tableau de bord",
          "L'ordre n'a aucune importance",
        ],
        answer: 1,
        explanation: "✅ Parfait ! C'est la séquence logique : l'app doit être ouverte pour que tu puisses taper ton mot de passe, et tu dois être authentifié pour voir ton tableau de bord. Chaque étape dépend de la précédente — c'est la séquence !",
      },
    },

    // ── Bloc 5 : présentation du niveau final ──
    {
      type: "text", order_index: 4,
      content: { html: `
<h2>🎮 Le défi final — La clé et la porte secrète</h2>

<p>C'est le niveau le plus complexe du cours. Il rassemble tout ce que tu as appris :</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0">
  <div style="background:#052e16;border:1px solid #166534;border-radius:8px;padding:10px 14px">
    <p style="color:#4ade80;font-weight:700;margin:0 0 4px">✓ Algorithme</p>
    <p style="color:#86efac;font-size:0.85em;margin:0">Décomposer le chemin en étapes</p>
  </div>
  <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:8px;padding:10px 14px">
    <p style="color:#a5b4fc;font-weight:700;margin:0 0 4px">✓ Directions</p>
    <p style="color:#c7d2fe;font-size:0.85em;margin:0">Tourner au bon endroit, dans le bon sens</p>
  </div>
  <div style="background:#450a0a;border:1px solid #991b1b;border-radius:8px;padding:10px 14px">
    <p style="color:#f87171;font-weight:700;margin:0 0 4px">✓ Débogage</p>
    <p style="color:#fca5a5;font-size:0.85em;margin:0">Corriger sans tout recommencer</p>
  </div>
  <div style="background:#1c1917;border:1px solid #78350f;border-radius:8px;padding:10px 14px">
    <p style="color:#fbbf24;font-weight:700;margin:0 0 4px">✓ Séquence</p>
    <p style="color:#fde68a;font-size:0.85em;margin:0">Clé avant porte — l'ordre est crucial</p>
  </div>
</div>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;font-weight:700;margin:0 0 8px">💡 Avant de te lancer :</p>
  <ul style="color:#94a3b8;margin:0;padding-left:20px;line-height:1.8;font-size:0.9em">
    <li>Repère d'abord <strong>tous les éléments</strong> : départ, clé 🗝️, porte 🚪, étoile ⭐, gemme 💎</li>
    <li>Planifie un chemin qui passe <strong>par la clé avant la porte</strong></li>
    <li>La gemme 💎 est facultative — essaie de la récupérer en bonus !</li>
    <li>Si tu bloques, utilise la méthode de débogage : localise, comprends, corrige</li>
  </ul>
</div>
      `.trim() },
    },

    // ── Bloc 6 : MAZE 4 ──
    {
      type: "game", order_index: 5,
      content: MAZE_4,
    },

    // ── Bloc 7 : bilan final du cours ──
    {
      type: "text", order_index: 6,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#1e1b4b);border:1px solid #4ade80;border-radius:16px;padding:24px 28px;text-align:center">
  <div style="font-size:2.5em;margin-bottom:8px">🏆</div>
  <h2 style="color:#4ade80;margin:0 0 10px">Félicitations — Septembre est terminé !</h2>
  <p style="color:#a7f3d0;margin:0 0 16px">Tu as maîtrisé les 4 briques fondamentales de la programmation.</p>
</div>

<div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">🔢</span>
    <div>
      <strong style="color:#e2e8f0">L'algorithme</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">Toute solution informatique commence par décomposer un problème complexe en étapes simples. C'est la compétence n°1 du développeur.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">🧭</span>
    <div>
      <strong style="color:#e2e8f0">La précision des instructions</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">Un robot fait exactement ce qu'on lui dit. Être précis et clair dans ses instructions est une compétence qui s'étend bien au-delà du code.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">🐛</span>
    <div>
      <strong style="color:#e2e8f0">Le débogage</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">Les erreurs font partie du processus — pas de la honte. Savoir lire une erreur et la corriger méthodiquement, c'est ce qui distingue un bon développeur.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">📋</span>
    <div>
      <strong style="color:#e2e8f0">La séquence</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">L'ordre des instructions crée des dépendances. Certaines choses doivent se passer avant d'autres. C'est la logique fondamentale de tout programme.</p>
    </div>
  </div>

</div>

<div style="margin-top:20px;background:linear-gradient(135deg,#1e1b4b,#1c1917);border:1px solid #6d28d9;border-radius:12px;padding:18px 22px">
  <p style="color:#c4b5fd;font-weight:900;margin:0 0 8px">🎵 Novembre — La prochaine aventure t'attend :</p>
  <p style="color:#ddd6fe;margin:0">"<strong>Je compose de la musique avec des boucles</strong>" — tu vas découvrir comment faire répéter des actions automatiquement, et créer des mélodies avec du code !</p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 5 (Octobre) — Répéter au lieu de copier
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 5 (Octobre)");
  const ch5 = await upsertChapter(themeId,
    "Séance 5 — Répéter au lieu de copier",
    "Découvrir les boucles dans le labyrinthe : écrire moins pour faire plus.",
    4
  );
  const l5 = await upsertLesson(ch5, themeId, "La boucle qui fait tout", 0, 80);
  await seedBlocks(l5, themeId, [

    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#4ade80;font-weight:900;font-size:1.1em;margin:0 0 6px">🔁 Ce mois-ci : écrire <em>moins</em> pour faire <em>plus</em>.</p>
  <p style="color:#a7f3d0;margin:0">Tu as déjà maîtrisé les algorithmes et le débogage. Maintenant tu vas découvrir la première vraie <strong>arme secrète</strong> des développeurs : la boucle.</p>
</div>
      `.trim() },
    },

    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔁 Quand le code devient trop long…</h2>

<p>Imagine que tu veuilles faire tourner Kirikou en carré parfait — droite, bas, gauche, haut. Sans boucle, tu dois écrire :</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0;font-family:monospace;font-size:0.9em;color:#a5b4fc">
  Avancer × 3<br>
  Tourner droite<br>
  Avancer × 3<br>
  Tourner droite<br>
  Avancer × 3<br>
  Tourner droite<br>
  Avancer × 3<br>
  Tourner droite
</div>

<p>C'est <strong>8 lignes</strong> pour décrire quelque chose qui se répète 4 fois. Et si le carré faisait 10 cases de côté ? 40 lignes !</p>

<p>Un bon développeur déteste se répéter. Il existe une règle en informatique : le principe <strong>DRY — "Don't Repeat Yourself"</strong> (Ne te répète pas).</p>

<p>La solution : <strong>une boucle</strong>.</p>

<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px;margin:12px 0;font-family:monospace;font-size:0.9em;color:#4ade80">
  Répéter <strong>4 fois</strong> :<br>
  &nbsp;&nbsp;Avancer × 3<br>
  &nbsp;&nbsp;Tourner droite
</div>

<p>Même résultat, <strong>3 lignes au lieu de 8</strong>. Et si le carré change de taille ? Tu modifies un seul chiffre.</p>
      `.trim() },
    },

    {
      type: "quiz", order_index: 2,
      content: {
        question: "Tu dois faire Avancer×2, Tourner droite — 6 fois de suite. Combien de blocs sans boucle ? Et avec ?",
        choices: [
          "18 sans boucle / 3 avec boucle",
          "12 sans boucle / 2 avec boucle",
          "6 sans boucle / 6 avec boucle (ça ne change rien)",
          "18 sans boucle / 4 avec boucle",
        ],
        answer: 0,
        explanation: "✅ Exactement ! 6 × (2 + 1) = 18 blocs sans boucle. Avec boucle : Répéter×6 + Avancer×2 + Tourner = 3 blocs seulement. La boucle t'a économisé 15 blocs !",
      },
    },

    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🗺️ Lire un labyrinthe avant de coder</h2>

<p>Avant d'utiliser le bloc 🔁 Répéter, tu dois d'abord <strong>reconnaître le motif qui se répète</strong> dans le labyrinthe.</p>

<p>La méthode :</p>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 10px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">1</span> &nbsp;Trace le chemin complet avec ton doigt</p>
  <p style="color:#e2e8f0;margin:0 0 10px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">2</span> &nbsp;Cherche un segment qui se <strong>répète</strong> (même longueur, même virage)</p>
  <p style="color:#e2e8f0;margin:0 0 10px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">3</span> &nbsp;Ce segment devient le <strong>corps de ta boucle</strong></p>
  <p style="color:#e2e8f0;margin:0"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">4</span> &nbsp;Compte combien de fois il se répète → c'est ton <strong>N</strong></p>
</div>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 Astuce :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Si le chemin <em>ne se répète pas exactement</em>, utilise des blocs normaux pour les parties uniques, et une boucle seulement pour la partie qui se répète. Les deux s'utilisent ensemble !</p>
</div>
      `.trim() },
    },

    {
      type: "game", order_index: 4,
      content: {
        grid_size: 7,
        start: { x: 0, y: 3, dir: "E" },
        goal:  { x: 6, y: 3 },
        walls: [
          // Couloir horizontal avec 2 chicanes vers le bas
          { x:1,y:0 },{ x:1,y:1 },{ x:1,y:2 },
          { x:2,y:4 },{ x:2,y:5 },{ x:2,y:6 },
          { x:3,y:0 },{ x:3,y:1 },{ x:3,y:2 },
          { x:4,y:4 },{ x:4,y:5 },{ x:4,y:6 },
          { x:0,y:0 },{ x:0,y:1 },{ x:0,y:2 },{ x:0,y:4 },{ x:0,y:5 },{ x:0,y:6 },
          { x:6,y:0 },{ x:6,y:1 },{ x:6,y:2 },{ x:6,y:4 },{ x:6,y:5 },{ x:6,y:6 },
        ],
        max_blocks: 8,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        title: "Défi 1 — Le couloir infini",
        instructions: "6 cases à parcourir. Sans boucle tu auras besoin de 6 blocs Avancer. Avec boucle : 2 blocs. Trouve le raccourci !",
        steps: [
          "Compte le nombre de cases jusqu'à l'étoile",
          "Utilise 🔁 Répéter N fois avec 🚀 Avancer dedans",
          "Un seul Avancer dans la boucle suffit !",
        ],
      },
    },

    {
      type: "game", order_index: 5,
      content: {
        grid_size: 6,
        start: { x: 0, y: 0, dir: "S" },
        goal:  { x: 0, y: 5 },
        walls: [
          { x:1,y:0 },{ x:1,y:1 },{ x:1,y:2 },{ x:1,y:3 },{ x:1,y:4 },{ x:1,y:5 },
          { x:2,y:0 },{ x:2,y:1 },{ x:2,y:2 },{ x:2,y:3 },{ x:2,y:4 },{ x:2,y:5 },
          { x:3,y:0 },{ x:3,y:1 },{ x:3,y:2 },{ x:3,y:3 },{ x:3,y:4 },{ x:3,y:5 },
          { x:4,y:0 },{ x:4,y:1 },{ x:4,y:2 },{ x:4,y:3 },{ x:4,y:4 },{ x:4,y:5 },
          { x:5,y:0 },{ x:5,y:1 },{ x:5,y:2 },{ x:5,y:3 },{ x:5,y:4 },{ x:5,y:5 },
        ],
        max_blocks: 4,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        title: "Défi 2 — La chute libre",
        instructions: "Kirikou regarde vers le bas. 5 cases à descendre. Max 4 blocs — impossible sans boucle !",
        steps: [
          "Kirikou regarde déjà vers le bas ↓",
          "Compte : 5 cases jusqu'à l'étoile",
          "Répéter 5 fois { Avancer } — 2 blocs seulement !",
        ],
      },
    },

    {
      type: "game", order_index: 6,
      content: {
        grid_size: 7,
        start: { x: 0, y: 0, dir: "E" },
        goal:  { x: 6, y: 6 },
        walls: [
          // Escalier : droite 2, bas 1, droite 2, bas 1 ... (motif qui se répète)
          { x:0,y:1 },{ x:0,y:2 },{ x:0,y:3 },{ x:0,y:4 },{ x:0,y:5 },{ x:0,y:6 },
          { x:1,y:2 },{ x:1,y:3 },{ x:1,y:4 },{ x:1,y:5 },{ x:1,y:6 },
          { x:2,y:2 },{ x:2,y:3 },{ x:2,y:4 },{ x:2,y:5 },{ x:2,y:6 },
          { x:3,y:3 },{ x:3,y:4 },{ x:3,y:5 },{ x:3,y:6 },
          { x:4,y:4 },{ x:4,y:5 },{ x:4,y:6 },
          { x:5,y:5 },{ x:5,y:6 },
          { x:2,y:0 },{ x:3,y:0 },{ x:3,y:1 },{ x:3,y:2 },
          { x:4,y:0 },{ x:4,y:1 },{ x:4,y:2 },{ x:4,y:3 },
          { x:5,y:0 },{ x:5,y:1 },{ x:5,y:2 },{ x:5,y:3 },{ x:5,y:4 },
          { x:6,y:0 },{ x:6,y:1 },{ x:6,y:2 },{ x:6,y:3 },{ x:6,y:4 },{ x:6,y:5 },
        ],
        max_blocks: 7,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        title: "Défi 3 — L'escalier en diagonale",
        instructions: "Kirikou doit descendre en escalier. Repère le motif qui se répète : avancer + tourner droite + avancer + tourner gauche. Combien de fois ?",
        steps: [
          "Le motif : Avancer×1, Tourner droite, Avancer×1, Tourner gauche",
          "Ce motif se répète 3 fois",
          "Mets-le dans Répéter×3 — 5 blocs au total !",
        ],
      },
    },

    {
      type: "text", order_index: 7,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🔁 Tu penses maintenant comme un vrai développeur !</h3>
  <p style="color:#86efac;margin:0 0 12px">Reconnaître un motif qui se répète et l'automatiser — c'est exactement ce que fait un algorithme efficace. En novembre, tu utiliseras cette même idée pour composer de la musique !</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ DRY — ne jamais écrire deux fois la même chose<br>
    ✓ Identifier un motif qui se répète dans un labyrinthe<br>
    ✓ Utiliser la boucle 🔁 Répéter N fois dans le labyrinthe<br>
    ✓ Un seul chiffre changé = comportement entièrement différent
  </p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 6 (Octobre) — Lire un labyrinthe complexe : plan avant code
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 6 (Octobre)");
  const ch6 = await upsertChapter(themeId,
    "Séance 6 — Planifier comme un ingénieur",
    "Apprendre à lire un labyrinthe complexe et construire un plan avant de coder.",
    5
  );
  const l6 = await upsertLesson(ch6, themeId, "Plan avant code", 0, 100);
  await seedBlocks(l6, themeId, [

    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #78350f;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#fbbf24;font-weight:900;font-size:1.1em;margin:0 0 6px">🗺️ La séance des grands défis.</p>
  <p style="color:#fde68a;margin:0">Tu as tous les outils : avancer, tourner, boucle. Maintenant tu vas les combiner sur des labyrinthes plus grands. L'enjeu : <strong>planifier avant de coder</strong>.</p>
</div>
      `.trim() },
    },

    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🏗️ Comment les ingénieurs conçoivent un programme</h2>

<p>Tu sais ce que font les ingénieurs logiciels avant d'écrire la première ligne de code ? Ils font un <strong>plan</strong>.</p>

<p>On appelle ça le <strong>pseudocode</strong> : écrire son programme en langage humain, avant de le traduire en code.</p>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <p style="color:#94a3b8;font-size:0.85em;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em">Exemple de pseudocode pour un labyrinthe en L</p>
  <div style="font-family:monospace;font-size:0.9em;color:#e2e8f0;line-height:1.8">
    <span style="color:#94a3b8">// Phase 1 : aller vers la droite</span><br>
    avancer 4 fois vers l'est<br>
    <br>
    <span style="color:#94a3b8">// Phase 2 : descendre</span><br>
    tourner à droite (maintenant je regarde vers le bas)<br>
    avancer 3 fois vers le bas<br>
    <br>
    <span style="color:#94a3b8">// Arrivée</span><br>
    je suis sur l'étoile ⭐
  </div>
</div>

<p>Le pseudocode n'a pas de syntaxe précise — il sert juste à <strong>penser</strong>. Ensuite tu le traduis en blocs Blockly, puis plus tard en Python.</p>
      `.trim() },
    },

    {
      type: "quiz", order_index: 2,
      content: {
        question: "À quoi sert le pseudocode AVANT de coder ?",
        choices: [
          "C'est du vrai code que l'ordinateur peut exécuter",
          "C'est un plan en langage humain pour penser la solution avant de la coder",
          "C'est un message d'erreur qui s'affiche quand le programme plante",
          "C'est un outil pour vérifier que le code est sans bugs",
        ],
        answer: 1,
        explanation: "✅ Exactement ! Le pseudocode c'est ton plan sur papier. Tu penses la logique en français (ou en langue locale), puis tu la traduis en code. Les meilleurs développeurs planifient toujours avant de taper. 🧠",
      },
    },

    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🔍 Décomposer un grand problème en petits morceaux</h2>

<p>Face à un labyrinthe complexe, la technique est toujours la même :</p>

<div style="background:#1e293b;border-radius:10px;padding:16px 20px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 12px">
    <span style="color:#3b82f6;font-weight:900">DIVIDE</span> — Découpe le chemin en segments (entre chaque virage, c'est un segment)
  </p>
  <p style="color:#e2e8f0;margin:0 0 12px">
    <span style="color:#8b5cf6;font-weight:900">CONQUER</span> — Résous chaque segment séparément (avancer N fois)
  </p>
  <p style="color:#e2e8f0;margin:0">
    <span style="color:#059669;font-weight:900">COMBINE</span> — Assemble les segments dans l'ordre (n'oublie pas les virages entre eux !)
  </p>
</div>

<p>C'est l'approche "<strong>Divide and Conquer</strong>" — diviser pour régner. C'est l'un des algorithmes fondamentaux en informatique, utilisé dans les moteurs de recherche, les jeux vidéo, l'IA…</p>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">🦆 Le canard revient !</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Avant de lancer le programme, explique ton plan à voix haute : "D'abord je vais à droite pendant 4 cases, ensuite je tourne…". Si tu te perds en l'expliquant, ton plan a un problème. Corrige-le AVANT de coder.</p>
</div>
      `.trim() },
    },

    {
      type: "quiz", order_index: 4,
      content: {
        question: "Kirikou doit aller de (0,0) à (4,4) dans un labyrinthe en L : d'abord tout à droite (4 cases), puis tout en bas (4 cases). Écris le pseudocode le plus court :",
        choices: [
          "Répéter 8 fois { Avancer, Tourner droite }",
          "Avancer×4 → Tourner droite → Avancer×4",
          "Tourner droite → Avancer×4 → Tourner gauche → Avancer×4",
          "Avancer×4 → Avancer×4",
        ],
        answer: 1,
        explanation: "✅ Parfait ! 4 cases à droite, 1 virage pour regarder vers le bas, 4 cases vers le bas. Simple et précis. La réponse A est fausse car Kirikou tournerait à chaque case. La D oublie le virage entre les deux segments !",
      },
    },

    {
      type: "game", order_index: 5,
      content: {
        grid_size: 8,
        start: { x: 0, y: 0, dir: "E" },
        goal:  { x: 7, y: 7 },
        walls: [
          { x:0,y:1 },{ x:0,y:2 },{ x:0,y:3 },{ x:0,y:4 },{ x:0,y:5 },{ x:0,y:6 },{ x:0,y:7 },
          { x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },{ x:4,y:1 },{ x:5,y:1 },{ x:6,y:1 },
          { x:1,y:2 },{ x:1,y:3 },{ x:1,y:4 },{ x:1,y:5 },{ x:1,y:6 },{ x:1,y:7 },
          { x:2,y:2 },{ x:3,y:2 },{ x:4,y:2 },{ x:5,y:2 },{ x:6,y:2 },
          { x:2,y:3 },{ x:2,y:4 },{ x:2,y:5 },{ x:2,y:6 },{ x:2,y:7 },
          { x:3,y:3 },{ x:4,y:3 },{ x:5,y:3 },{ x:6,y:3 },
          { x:3,y:4 },{ x:3,y:5 },{ x:3,y:6 },{ x:3,y:7 },
          { x:4,y:4 },{ x:5,y:4 },{ x:6,y:4 },
          { x:4,y:5 },{ x:4,y:6 },{ x:4,y:7 },
          { x:5,y:5 },{ x:6,y:5 },
          { x:5,y:6 },{ x:5,y:7 },
          { x:6,y:6 },
          { x:7,y:0 },{ x:7,y:1 },{ x:7,y:2 },{ x:7,y:3 },{ x:7,y:4 },{ x:7,y:5 },{ x:7,y:6 },
        ],
        max_blocks: 10,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        title: "Défi 1 — Le couloir en spirale",
        instructions: "Une spirale qui descend vers la droite. Cherche le motif : avancer, tourner droite, avancer, tourner droite… Combien de tours ?",
        steps: [
          "Le motif : Avancer×1, Tourner droite — se répète 7 fois",
          "Utilise Répéter×7 { Avancer, Tourner droite }",
          "Puis Avancer×1 pour l'étoile finale",
        ],
      },
    },

    {
      type: "game", order_index: 6,
      content: {
        grid_size: 8,
        start: { x: 0, y: 4, dir: "E" },
        goal:  { x: 7, y: 4 },
        walls: [
          { x:0,y:0 },{ x:0,y:1 },{ x:0,y:2 },{ x:0,y:3 },
          { x:0,y:5 },{ x:0,y:6 },{ x:0,y:7 },
          { x:7,y:0 },{ x:7,y:1 },{ x:7,y:2 },{ x:7,y:3 },
          { x:7,y:5 },{ x:7,y:6 },{ x:7,y:7 },
          // Obstacles en zigzag
          { x:1,y:5 },{ x:1,y:6 },{ x:1,y:7 },
          { x:2,y:3 },{ x:2,y:2 },{ x:2,y:1 },{ x:2,y:0 },
          { x:3,y:5 },{ x:3,y:6 },{ x:3,y:7 },
          { x:4,y:3 },{ x:4,y:2 },{ x:4,y:1 },{ x:4,y:0 },
          { x:5,y:5 },{ x:5,y:6 },{ x:5,y:7 },
          { x:6,y:3 },{ x:6,y:2 },{ x:6,y:1 },{ x:6,y:0 },
        ],
        max_blocks: 12,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        title: "Défi 2 — Le slalom",
        instructions: "Kirikou doit slalomer entre les obstacles. Le chemin : avance 1, monte 1, avance 1, descends 1 — se répète. À toi de trouver combien de fois !",
        steps: [
          "Trace le chemin : droit, haut, droit, bas — c'est le motif",
          "Répéter 3 fois : { Avancer, Gauche, Avancer, Droite, Avancer, Droite, Avancer, Gauche }",
          "Compte bien tes cases à chaque segment !",
        ],
      },
    },

    {
      type: "game", order_index: 7,
      content: {
        grid_size: 8,
        start: { x: 1, y: 1, dir: "E" },
        goal:  { x: 6, y: 6 },
        walls: [
          { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },{ x:5,y:0 },{ x:6,y:0 },{ x:7,y:0 },
          { x:0,y:1 },{ x:0,y:2 },{ x:0,y:3 },{ x:0,y:4 },{ x:0,y:5 },{ x:0,y:6 },{ x:0,y:7 },
          { x:7,y:1 },{ x:7,y:2 },{ x:7,y:3 },{ x:7,y:4 },{ x:7,y:5 },{ x:7,y:6 },{ x:7,y:7 },
          { x:1,y:7 },{ x:2,y:7 },{ x:3,y:7 },{ x:4,y:7 },{ x:5,y:7 },{ x:6,y:7 },{ x:7,y:7 },
          // Murs intérieurs
          { x:2,y:2 },{ x:3,y:2 },{ x:4,y:2 },{ x:5,y:2 },
          { x:2,y:3 },{ x:5,y:3 },
          { x:2,y:4 },{ x:5,y:4 },
          { x:2,y:5 },{ x:3,y:5 },{ x:4,y:5 },{ x:5,y:5 },
        ],
        collectibles: [{ x: 4, y: 1, type: "gem" }, { x: 1, y: 4, type: "gem" }],
        max_blocks: 20,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext", "robot_pick"],
        title: "Défi 3 — Le grand tour (défi final octobre)",
        instructions: "Le labyrinthe final du mois. Collecte les 2 gemmes 💎 en chemin et atteins l'étoile. Planifie ton chemin AVANT de coder !",
        steps: [
          "Repère toutes les étapes : départ → gemme 1 → gemme 2 → étoile",
          "Écris le pseudocode sur papier avant de placer les blocs",
          "Utilise 🧲 Ramasser sur chaque gemme, boucle si possible",
        ],
      },
    },

    {
      type: "text", order_index: 8,
      content: { html: `
<div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #d97706;border-radius:12px;padding:20px 24px">
  <h3 style="color:#fbbf24;margin:0 0 10px">🏗️ Tu penses comme un ingénieur logiciel !</h3>
  <p style="color:#fde68a;margin:0 0 12px">Planifier avant de coder, décomposer un problème complexe, utiliser les boucles pour éviter les répétitions — c'est exactement ce que font les développeurs professionnels chaque jour.</p>
  <p style="color:#fde68a;margin:0">➡️ En novembre, tu vas appliquer toutes ces compétences à un nouveau domaine : la <strong>composition musicale avec du code</strong> !</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Bilan d'octobre :</strong><br>
    ✓ Boucles dans le labyrinthe — reconnaître et automatiser les motifs<br>
    ✓ Pseudocode — planifier en français avant de coder<br>
    ✓ "Divide and Conquer" — découper un grand problème en segments<br>
    ✓ Combiner boucles + virages sur des labyrinthes complexes
  </p>
</div>
      `.trim() },
    },
  ]);

  console.log("\n🎉  Seed terminé !");
  console.log("   Thème     : Je guide un robot dans un labyrinthe");
  console.log("   Chapitres : 6 séances (sept×4 + oct×2)");
  console.log("   Leçons    : 6");
  console.log("   Blocs     : 7-9 par leçon (texte enrichi + quiz + maze)");
}

main().catch((e) => { console.error(e); process.exit(1); });
