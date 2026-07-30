/**
 * Enrichissement — Séance 5 "La répétition"
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/enrich-seance5.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CHAPTER_ID = "9b31a8d5-dd7d-429d-a7a3-d2b50bb0bf9a";
const LESSON_ID  = "4891f4c5-6e7b-423b-b907-fcd76b767ae6";
const THEME_ID   = "8979e87c-058c-4003-95fd-1531c649bd1d";

// ── Maze — L-shape 5×5 (forced Répéter) ────────────────────────────────────
//
//   x:  0  1  2  3  4
// y=0:  W  W  W  W  ⭐
// y=1:  W  W  W  W  ·
// y=2:  W  W  W  W  ·
// y=3:  W  W  W  W  ·
// y=4:  K  ·  ·  ·  ·
//
// Solution : Répéter 4 : Avancer → Tourner gauche → Répéter 4 : Avancer
// Sans Répéter = 9 blocs > 6 → Répéter obligatoire
const MAZE_S5 = {
  game_type: "maze",
  title: "Labyrinthe — Répéter obligatoire !",
  instructions: "Tu n'as que 6 blocs maximum. Avancer 4 fois serait déjà 4 blocs — utilise Répéter pour faire mieux !",
  steps: [
    "Utilise Répéter pour avancer 4 cases vers la droite",
    "Tourne à gauche",
    "Utilise Répéter pour monter 4 cases jusqu'à l'étoile ⭐",
  ],
  grid_size: 5,
  start: { x: 0, y: 4, dir: "E" },
  goal:  { x: 4, y: 0 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },{ x:3,y:2 },
    { x:0,y:3 },{ x:1,y:3 },{ x:2,y:3 },{ x:3,y:3 },
  ],
  max_blocks: 6,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
};

// ── Blocs ──────────────────────────────────────────────────────────────────

const BLOCKS = [

  // ── 0 : Accroche ──────────────────────────────────────────────────────────
  {
    type: "text", order_index: 0,
    content: { html: `
<div style="background:linear-gradient(135deg,#0a1628,#1e293b);border:1px solid #3b82f640;border-radius:14px;padding:22px 26px">
  <h2 style="color:#3b82f6;margin:0 0 12px;font-size:1.3em">🔁 Séance 5 — La répétition</h2>

  <p style="color:#cbd5e1;margin:0 0 14px">Kirikou doit traverser un long couloir. Voici son programme :</p>

  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:14px 18px;margin-bottom:14px;font-family:monospace;font-size:0.9em">
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#475569;font-style:italic;font-size:0.85em;margin-top:6px">… encore 2 lignes</div>
  </div>

  <p style="color:#94a3b8;margin:0 0 10px">😩 <strong style="color:#cbd5e1">10 fois "Avancer"</strong> — vraiment ?!</p>
  <p style="color:#94a3b8;margin:0">🎯 Il existe une instruction magique que tous les développeurs utilisent pour éviter ça. Tu vas l'apprendre aujourd'hui : le <strong style="color:#3b82f6">bloc Répéter</strong>.</p>
</div>
` } },

  // ── 1 : Vidéo ─────────────────────────────────────────────────────────────
  {
    type: "video", order_index: 1,
    content: {
      url: "https://www.youtube.com/watch?v=mgooqyWMTxk",
      title: "C'est quoi une boucle ? — Les répétitions en programmation",
    },
  },

  // ── 2 : Le bloc Répéter ───────────────────────────────────────────────────
  {
    type: "text", order_index: 2,
    content: { html: `
<h2 style="color:#3b82f6;margin-top:0">🔁 Le bloc Répéter — moins de mots, même résultat</h2>

<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;margin:16px 0">
  <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center">
    <div style="color:#475569;font-size:0.8em;margin-bottom:10px">Version longue</div>
    <div style="font-family:monospace;font-size:0.9em;line-height:2;color:#FDB813">
      Avancer<br>Avancer<br>Avancer<br>Avancer<br>Avancer
    </div>
  </div>
  <div style="text-align:center;font-size:1.8em">→</div>
  <div style="background:#1e293b;border:2px solid #3b82f640;border-radius:12px;padding:16px;text-align:center">
    <div style="color:#3b82f6;font-size:0.8em;margin-bottom:10px;font-weight:bold">Version courte ✨</div>
    <div style="font-family:monospace;font-size:0.9em;color:#FDB813">
      <span style="color:#3b82f6;font-weight:bold">Répéter 5 fois :</span><br>
      &nbsp;&nbsp;Avancer
    </div>
  </div>
</div>

<div style="background:#1e293b;border-radius:12px;padding:16px 20px;margin-bottom:14px">
  <p style="color:#FDB813;font-weight:bold;margin:0 0 10px">🖐️ Technique du doigt pour lire un Répéter :</p>
  <ol style="color:#94a3b8;padding-left:20px;margin:0;line-height:2;font-size:0.95em">
    <li>Regarde le <strong style="color:#3b82f6">nombre</strong> dans Répéter (ex: 4)</li>
    <li>Pointe sur l'instruction à l'intérieur</li>
    <li>Exécute-la <strong style="color:#3b82f6">4 fois</strong> en comptant à voix haute : 1… 2… 3… 4…</li>
    <li>Continue avec la suite du programme</li>
  </ol>
</div>

<div style="background:#0f172a;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0">
  <p style="color:#3b82f6;margin:0 0 4px;font-weight:bold">💡 À retenir</p>
  <p style="color:#94a3b8;margin:0;font-size:0.95em"><strong style="color:#cbd5e1">Répéter N fois : X</strong> = écrire X exactement N fois. Le résultat est identique — juste plus élégant et plus rapide à écrire.</p>
</div>
` } },

  // ── 3 : GAME fill_blank — Traduction ──────────────────────────────────────
  {
    type: "game", order_index: 3,
    content: {
      game_type: "fill_blank",
      title: "Traduis en version courte",
      template: `// Programme 1 — ligne droite (5 cases) :
Avancer × 5  =  Répéter [___] fois : Avancer

// Programme 2 — virage en L (4 cases droite, 3 cases haut) :
Répéter [___] fois : Avancer
Tourner à gauche
Répéter [___] fois : Avancer`,
      blanks: ["5", "4", "3"],
    },
  },

  // ── 4 : GAME bug_hunt ─────────────────────────────────────────────────────
  {
    type: "game", order_index: 4,
    content: {
      game_type: "bug_hunt",
      title: "Trouve le bug ! — Mauvais nombre dans Répéter",
      description: "Ce programme devait guider Kirikou dans un L-shape 5×5. Le nombre dans un Répéter est faux — lequel ?",
      context: `Grille :
· · · · ⭐
· · · · ·
· · · · ·
· · · · ·
K · · · ·

K part en bas à gauche face à l'Est.
Chemin : 4 cases → droite, tourner, 4 cases → haut.`,
      instructions: [
        "Répéter 2 fois : Avancer",
        "Tourner à gauche",
        "Répéter 4 fois : Avancer",
      ],
      bug_index: 0,
      fix: "Répéter 4 fois : Avancer",
      explanation: "Le corridor fait 4 cases de large, pas 2 ! Avec Répéter 2, Kirikou s'arrêtait au milieu puis finissait dans le mur en montant.",
    },
  },

  // ── 5 : Activité mentor ───────────────────────────────────────────────────
  {
    type: "text", order_index: 5,
    content: { html: `
<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:2px solid #FDB81340;border-radius:14px;padding:20px 24px">
  <h2 style="color:#FDB813;margin:0 0 14px">🎯 Activité avec ton mentor — Traducteur de programmes</h2>

  <div style="display:flex;flex-direction:column;gap:12px">
    <div style="background:#0f172a;border-radius:10px;padding:14px 18px">
      <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🔄 Round 1 — Version courte</p>
      <p style="color:#94a3b8;margin:0 0 8px">Ton mentor lit un programme long à voix haute. Toi, tu trouves la version courte avec Répéter et tu l'écris sur papier.</p>
      <div style="font-family:monospace;font-size:0.85em;background:#0a0f1a;padding:10px 14px;border-radius:8px;color:#FDB813">
        Avancer, Avancer, Avancer, Tourner gauche, Avancer, Avancer, Avancer
      </div>
      <p style="color:#60a5fa;margin:8px 0 0;font-size:0.9em">→ <em>Répéter 3 : Avancer, Tourner gauche, Répéter 3 : Avancer</em></p>
    </div>

    <div style="background:#0f172a;border-radius:10px;padding:14px 18px">
      <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🔄 Round 2 — Version longue</p>
      <p style="color:#94a3b8;margin:0">Maintenant c'est l'inverse : ton mentor écrit un programme avec Répéter, toi tu le "déroules" et tu écris la version longue. Puis compte combien de cases Kirikou parcourt.</p>
    </div>

    <div style="background:#0f172a;border-radius:10px;padding:14px 18px">
      <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🏆 Défi</p>
      <p style="color:#94a3b8;margin:0">Ton mentor dessine un labyrinthe simple sur papier. Toi, tu écris le programme le plus court possible avec Répéter pour le résoudre. Qui trouve le programme le plus court ?</p>
    </div>
  </div>
</div>
` } },

  // ── 6 : Quiz ──────────────────────────────────────────────────────────────
  {
    type: "quiz", order_index: 6,
    content: { questions: [
      {
        id: "q_rep_1",
        question: "Répéter 5 fois : Avancer — combien de cases avance Kirikou ?",
        type: "mcq",
        choices: ["5 cases", "1 case", "10 cases", "4 cases"],
        answer: 0,
        explanation: "Répéter 5 fois : Avancer = Avancer × 5 = 5 cases. Simple !",
      },
      {
        id: "q_rep_2",
        question: "Répéter 3 fois : [Avancer, Tourner droite] — combien d'Avancer au total ?",
        type: "mcq",
        choices: ["3 Avancer", "6 Avancer", "1 Avancer", "9 Avancer"],
        answer: 0,
        explanation: "À chaque répétition, on exécute Avancer + Tourner droite. Répété 3 fois → 3 Avancer (et 3 Tourner). Pas 6 — le Tourner est aussi dans la boucle !",
      },
      {
        id: "q_rep_3",
        question: "Quel programme est équivalent à : Avancer, Avancer, Avancer, Avancer, Avancer, Avancer ?",
        type: "mcq",
        choices: ["Répéter 6 fois : Avancer", "Répéter 3 fois : Avancer", "Répéter 6 fois : [Avancer, Avancer]", "Avancer × 3"],
        answer: 0,
        explanation: "6 fois Avancer = Répéter 6 fois : Avancer. Les autres réponses donnent soit moins de cases, soit trop.",
      },
    ] },
  },

  // ── 7 : Transition ────────────────────────────────────────────────────────
  {
    type: "text", order_index: 7,
    content: { html: `
<div style="background:#1e293b;border-radius:12px;padding:18px 22px">
  <h2 style="color:#10b981;margin:0 0 10px">🚀 Place à la pratique !</h2>
  <p style="color:#94a3b8;margin:0 0 10px">Tu sais lire et écrire des programmes avec Répéter. Maintenant Kirikou t'attend dans un labyrinthe — avec une contrainte :</p>
  <div style="background:#0f172a;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0">
    <p style="color:#ef4444;font-weight:bold;margin:0 0 4px">⚠️ Maximum 6 blocs</p>
    <p style="color:#94a3b8;margin:0;font-size:0.95em">La solution sans Répéter nécessite 9 blocs. Impossible d'y arriver sans la boucle !</p>
  </div>
</div>
` } },

  // ── 8 : GAME maze ─────────────────────────────────────────────────────────
  { type: "game", order_index: 8, content: MAZE_S5 },

  // ── 9 : Transition piano ──────────────────────────────────────────────────
  {
    type: "text", order_index: 9,
    content: { html: `
<div style="background:linear-gradient(135deg,#1a0a2e,#1e1b4b);border:1px solid #8b5cf640;border-radius:14px;padding:20px 24px;text-align:center">
  <div style="font-size:2.5em;margin-bottom:12px">🎹</div>
  <h2 style="color:#a78bfa;margin:0 0 10px">Kirikou devient compositeur !</h2>
  <p style="color:#c4b5fd;margin:0 0 12px">Un robot qui avance case par case, une mélodie qui joue note par note — c'est <strong>la même logique</strong>.</p>
  <p style="color:#94a3b8;margin:0">Et devinez quoi ? <strong style="color:#a78bfa">Répéter fonctionne aussi pour la musique.</strong><br>Un motif musical qui se répète, c'est exactement ce que tu viens d'apprendre.</p>
</div>
` } },

  // ── 10 : GAME music — Piano 1 (libre) ────────────────────────────────────
  {
    type: "game", order_index: 10,
    content: {
      game_type: "music",
      title: "Piano 1 — Compose avec Répéter",
      instructions: "Tu dois jouer au moins 6 notes — mais tu n'as que 4 blocs maximum ! La seule façon d'y arriver : utilise Répéter.",
      steps: [
        "Place un bloc 🔁 Répéter dans ton programme",
        "Glisse un bloc 🎵 Jouer DANS l'espace vert de la boucle",
        "Choisis le nombre de répétitions (au moins 6 au total)",
        "Appuie sur ▶ Jouer pour entendre ta mélodie !",
      ],
      free_mode: true,
      min_notes: 6,
      max_blocks: 4,
      available_blocks: ["music_play_note", "controls_repeat_ext"],
      tempo: 400,
    },
  },

  // ── 11 : GAME music — Piano 2 (mélodie exacte) ───────────────────────────
  {
    type: "game", order_index: 11,
    content: {
      game_type: "music",
      title: "Piano 2 — Reproduis la mélodie Do-Mi-Sol",
      instructions: "La mélodie Do → Mi → Sol se répète 2 fois. Reproduis-la exactement avec 5 blocs maximum — utilise Répéter !",
      steps: [
        "La mélodie à reproduire : Do, Mi, Sol, Do, Mi, Sol (6 notes)",
        "Sans Répéter, il faudrait 6 blocs — tu n'en as que 5 !",
        "Indice : Répéter 2 fois [Do, Mi, Sol] = 4 blocs seulement 😉",
      ],
      target_notes: ["Do", "Mi", "Sol", "Do", "Mi", "Sol"],
      max_blocks: 5,
      available_blocks: ["music_play_note", "controls_repeat_ext"],
      tempo: 380,
    },
  },

  // ── 12 : Conclusion ───────────────────────────────────────────────────────
  {
    type: "text", order_index: 12,
    content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:14px;padding:22px 26px;margin-bottom:16px">
  <h2 style="color:#4ade80;margin:0 0 12px;font-size:1.3em">🏆 Bravo — tu maîtrises les boucles !</h2>
  <p style="color:#86efac;margin:0">Tu viens de découvrir l'un des concepts les plus puissants de la programmation. Les développeurs utilisent des boucles dans <strong>chaque programme qu'ils écrivent</strong>.</p>
</div>

<div style="background:#1e293b;border-radius:12px;padding:18px 22px;margin-bottom:16px">
  <h3 style="color:#FDB813;margin:0 0 12px;font-size:1em">📚 Ce que tu as appris :</h3>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1"><strong>Répéter N fois : X</strong> = écrire X exactement N fois</span></div>
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">Lire une boucle avec le <strong>doigt qui compte</strong></span></div>
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">Les boucles fonctionnent partout : <strong>labyrinthe</strong> et <strong>musique</strong></span></div>
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">Un programme <strong>plus court</strong> peut faire <strong>plus de choses</strong></span></div>
  </div>
</div>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #FDB81340;border-radius:12px;padding:16px 20px">
  <h3 style="color:#FDB813;margin:0 0 8px;font-size:1em">🔭 Prochaine séance — "Si… alors — Kirikou réfléchit"</h3>
  <p style="color:#94a3b8;margin:0">Tu vas apprendre à donner des <strong style="color:#cbd5e1">choix</strong> à Kirikou. Plutôt que de tout prévoir d'avance, il pourra <strong style="color:#cbd5e1">regarder ce qu'il y a devant lui et décider tout seul</strong> quoi faire !</p>
</div>
` } },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔁  Enrichissement — Séance 5 La répétition\n");

  // Mettre à jour chapitre + leçon
  await sb.from("chapters").update({ title: "Séance 5 — La répétition" }).eq("id", CHAPTER_ID);
  await sb.from("lessons").update({ title: "La répétition — Kirikou dit moins pour faire plus" }).eq("id", LESSON_ID);
  console.log("✏️  Titres mis à jour");

  // Purger les blocs existants
  const { error: delErr } = await sb.from("lesson_blocks").delete().eq("lesson_id", LESSON_ID);
  if (delErr) { console.error("❌ Purge:", delErr.message); process.exit(1); }
  console.log("🗑  Anciens blocs supprimés");

  // Insérer les blocs
  const rows = BLOCKS.map((b) => ({ ...b, lesson_id: LESSON_ID, theme_id: THEME_ID }));
  const { error: insErr } = await sb.from("lesson_blocks").insert(rows);
  if (insErr) { console.error("❌ Insertion:", insErr.message); process.exit(1); }

  console.log(`\n✅ ${rows.length} blocs insérés :`);
  rows.forEach((b) => {
    const label =
      b.type === "game"  ? `GAME  — ${(b.content as any).game_type} / ${(b.content as any).title ?? ""}` :
      b.type === "quiz"  ? `QUIZ  — ${(b.content as any).questions?.length} question(s)` :
      b.type === "video" ? `VIDEO — ${(b.content as any).title}` :
                           `TEXT  — bloc ${b.order_index}`;
    console.log(`  [${String(b.order_index).padStart(2,"0")}] ${label}`);
  });
}

main().catch(console.error);
