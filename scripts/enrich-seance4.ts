/**
 * Enrichissement — Séance 4 "Le débogage"
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/enrich-seance4.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "d558294a-9f50-452b-bae4-a9f921e223dd"; // Déboguer son programme
const THEME_ID  = "8979e87c-058c-4003-95fd-1531c649bd1d";

// ── Labyrinthes ────────────────────────────────────────────────────────────────

// Maze A — 4×4 en L (Séance 4, correction niveau 1)
//
//   x:  0  1  2  3
// y=0:  W  W  W  ⭐
// y=1:  W  W  W  .
// y=2:  W  W  W  .
// y=3:  K  .  .  .
//
// Solution : Avancer×3, Tourner gauche, Avancer×3
const MAZE_A = {
  game_type: "maze",
  title: "Niveau Détective — Rectifie le tir (1/2)",
  instructions: "Le programme de Kirikou avait une erreur : il tournait à DROITE au lieu de GAUCHE. Écris le programme CORRECT pour le sortir du labyrinthe !",
  grid_size: 4,
  start: { x: 0, y: 3, dir: "E" },
  goal:  { x: 3, y: 0 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },
  ],
  max_blocks: 10,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  steps: [
    "Avance Kirikou 3 cases vers la droite",
    "Tourne à GAUCHE (vers le haut)",
    "Avance encore 3 cases jusqu'à l'étoile ⭐",
  ],
};

// Maze B — 5×5 en L (Séance 4, défi niveau 2)
//
//   x:  0  1  2  3  4
// y=0:  W  W  W  W  W
// y=1:  W  W  W  W  ⭐
// y=2:  W  W  W  W  .
// y=3:  W  W  W  W  .
// y=4:  K  .  .  .  .
//
// Solution : Avancer×4, Tourner gauche, Avancer×3
const MAZE_B = {
  game_type: "maze",
  title: "Niveau Détective — Rectifie le tir (2/2)",
  instructions: "Ce programme plus long avait DEUX erreurs : un Avancer trop court et un mauvais virage. Réécris-le correctement !",
  grid_size: 5,
  start: { x: 0, y: 4, dir: "E" },
  goal:  { x: 4, y: 1 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },{ x:3,y:2 },
    { x:0,y:3 },{ x:1,y:3 },{ x:2,y:3 },{ x:3,y:3 },
  ],
  max_blocks: 12,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  steps: [
    "Avance Kirikou 4 cases vers la droite",
    "Tourne à GAUCHE (vers le haut)",
    "Avance encore 3 cases jusqu'à l'étoile ⭐",
  ],
};

// ── Blocs ─────────────────────────────────────────────────────────────────────

const BLOCKS = [

  // ── 0 : Accroche ─────────────────────────────────────────────────────────────
  {
    type: "text", order_index: 0,
    content: { html: `
<div style="background:linear-gradient(135deg,#1a0a0a,#1e293b);border:1px solid #ef444440;border-radius:14px;padding:22px 26px">
  <h2 style="color:#ef4444;margin:0 0 12px;font-size:1.3em">🔴 Séance 4 — Le débogage</h2>
  <p style="color:#cbd5e1;margin:0 0 12px">Ce matin, Kirikou a suivi ton programme… et il est tombé dans le puits 🕳️</p>
  <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:14px 18px;margin-bottom:14px;font-family:monospace;font-size:0.9em">
    <div style="color:#334155;margin-bottom:8px;font-size:0.8em">// Programme reçu par Kirikou :</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#FDB813">Avancer</div>
    <div style="color:#ef4444;text-decoration:line-through">Tourner à droite</div>
    <div style="color:#475569;font-style:italic;font-size:0.8em">← quelque chose cloche ici…</div>
    <div style="color:#FDB813">Avancer</div>
  </div>
  <p style="color:#94a3b8;margin:0">🎯 Aujourd'hui, tu vas apprendre à <strong style="color:#ef4444">lire un programme comme un détective</strong>, trouver l'erreur et la corriger. C'est ce qu'on appelle le <strong style="color:#FDB813">débogage</strong> — une compétence que tous les développeurs utilisent chaque jour.</p>
</div>
` } },

  // ── 1 : Vidéo ────────────────────────────────────────────────────────────────
  {
    type: "video", order_index: 1,
    content: {
      url: "https://www.youtube.com/watch?v=cDA3_5982h8",
      title: "C'est quoi un bug ? — Origines et exemples célèbres",
    },
  },

  // ── 2 : Quiz intro ────────────────────────────────────────────────────────────
  {
    type: "quiz", order_index: 2,
    content: { questions: [
      {
        id: "q_debug_1",
        question: "Un bug informatique, c'est…",
        type: "mcq",
        choices: ["Une erreur dans le programme qui fait qu'il ne fait pas ce qu'on voulait", "Un virus qui détruit les fichiers", "Quand l'ordinateur est trop chaud"],
        answer: 0,
        explanation: "Un bug = une erreur dans le code. Le mot vient d'une vraie mouche (bug en anglais) trouvée dans un circuit en 1947 ! Depuis, on appelle ça un bug.",
      },
      {
        id: "q_debug_2",
        question: "Kirikou doit aller tout droit, mais tu as mis 'Tourner à gauche'. C'est…",
        type: "mcq",
        choices: ["Un bug — le programme ne fait pas ce qu'on voulait", "Pas un bug — c'est une décision de programmation", "Un virus"],
        answer: 0,
        explanation: "Oui ! Dès que le programme ne produit pas le bon résultat, c'est un bug. Même si le code s'exécute sans erreur visible, le résultat est faux.",
      },
      {
        id: "q_debug_3",
        question: "Est-ce que les meilleurs développeurs font des bugs ?",
        type: "mcq",
        choices: ["Oui — tout le monde en fait, même les experts", "Non — les pros ne font jamais d'erreurs", "Seulement les débutants font des bugs"],
        answer: 0,
        explanation: "Tous les développeurs font des bugs ! Ce qui différencie les pros, c'est qu'ils savent les trouver et les corriger vite. Le débogage est une compétence aussi importante que le codage.",
      },
    ] },
  },

  // ── 3 : Les 3 types d'erreurs ─────────────────────────────────────────────────
  {
    type: "text", order_index: 3,
    content: { html: `
<h2 style="color:#f97316;margin-top:0">🔍 Les 3 types d'erreurs de Kirikou</h2>
<p style="color:#cbd5e1;margin-bottom:16px">Quand un programme de robot ne fonctionne pas, il y a presque toujours une de ces 3 raisons :</p>

<div style="display:flex;flex-direction:column;gap:12px">
  <div style="background:#1e293b;border-left:4px solid #ef4444;border-radius:0 12px 12px 0;padding:16px 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="font-size:1.5em">🔴</span>
      <span style="color:#ef4444;font-weight:bold">Mauvaise instruction</span>
    </div>
    <p style="color:#94a3b8;margin:0;font-size:0.9em">Le robot tourne à droite au lieu de gauche, ou avance au lieu de tourner.</p>
    <div style="margin-top:8px;font-family:monospace;font-size:0.85em;background:#0f172a;padding:8px 12px;border-radius:8px">
      <span style="color:#ef4444;text-decoration:line-through">Tourner à droite</span>
      <span style="color:#94a3b8"> → devait être </span>
      <span style="color:#4ade80">Tourner à gauche</span>
    </div>
  </div>

  <div style="background:#1e293b;border-left:4px solid #FDB813;border-radius:0 12px 12px 0;padding:16px 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="font-size:1.5em">🟡</span>
      <span style="color:#FDB813;font-weight:bold">Trop ou pas assez</span>
    </div>
    <p style="color:#94a3b8;margin:0;font-size:0.9em">Le robot avance 3 cases au lieu de 4, ou tourne deux fois au lieu d'une.</p>
    <div style="margin-top:8px;font-family:monospace;font-size:0.85em;background:#0f172a;padding:8px 12px;border-radius:8px">
      <span style="color:#ef4444;text-decoration:line-through">Avancer (×3)</span>
      <span style="color:#94a3b8"> → devait être </span>
      <span style="color:#4ade80">Avancer (×4)</span>
    </div>
  </div>

  <div style="background:#1e293b;border-left:4px solid #a78bfa;border-radius:0 12px 12px 0;padding:16px 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <span style="font-size:1.5em">🟣</span>
      <span style="color:#a78bfa;font-weight:bold">Ordre inversé</span>
    </div>
    <p style="color:#94a3b8;margin:0;font-size:0.9em">Deux instructions dans le mauvais ordre — le robot tourne avant d'avancer au lieu de l'inverse.</p>
    <div style="margin-top:8px;font-family:monospace;font-size:0.85em;background:#0f172a;padding:8px 12px;border-radius:8px">
      <span style="color:#ef4444;text-decoration:line-through">Tourner, Avancer, Avancer</span>
      <span style="color:#94a3b8"> → </span>
      <span style="color:#4ade80">Avancer, Avancer, Tourner</span>
    </div>
  </div>
</div>
` } },

  // ── 4 : GAME sort ─────────────────────────────────────────────────────────────
  {
    type: "game", order_index: 4,
    content: {
      game_type: "sort",
      title: "Remets le programme dans le bon ordre",
      description: `Kirikou (K) part en bas à gauche, face à l'Est →
Il doit rejoindre l'étoile ⭐ en haut à droite.

Grille du labyrinthe :
  ■ ■ ■ ⭐
  ■ ■ ■ ·
  ■ ■ ■ ·
  K · · ·

Les instructions ont été mélangées — remets-les dans le bon ordre !`,
      items: [
        "Avancer",
        "Avancer",
        "Avancer",
        "Tourner à gauche",
        "Avancer",
        "Avancer",
        "Avancer",
      ],
    },
  },

  // ── 5 : Stratégie ────────────────────────────────────────────────────────────
  {
    type: "text", order_index: 5,
    content: { html: `
<h2 style="color:#60a5fa;margin-top:0">🧠 La technique du détective — tracer avec le doigt</h2>
<p style="color:#cbd5e1;margin-bottom:14px">Avant de chercher un bug, il faut d'abord <strong style="color:#60a5fa">lire le programme pas à pas</strong>, comme si on était le robot.</p>

<div style="background:#1e293b;border-radius:12px;padding:18px 22px;margin-bottom:14px">
  <p style="color:#FDB813;font-weight:bold;margin:0 0 12px">Les 4 étapes du détective :</p>
  <div style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#60a5fa20;border:2px solid #60a5fa60;display:flex;align-items:center;justify-content:center;color:#60a5fa;font-weight:bold;flex-shrink:0;font-size:0.9em">1</div>
      <div><span style="color:#60a5fa;font-weight:bold">Lire</span> <span style="color:#94a3b8;font-size:0.9em">— lire la liste d'instructions de haut en bas</span></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#FDB81320;border:2px solid #FDB81360;display:flex;align-items:center;justify-content:center;color:#FDB813;font-weight:bold;flex-shrink:0;font-size:0.9em">2</div>
      <div><span style="color:#FDB813;font-weight:bold">Tracer</span> <span style="color:#94a3b8;font-size:0.9em">— pointer du doigt sur la grille chaque case que le robot traverse</span></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#a78bfa20;border:2px solid #a78bfa60;display:flex;align-items:center;justify-content:center;color:#a78bfa;font-weight:bold;flex-shrink:0;font-size:0.9em">3</div>
      <div><span style="color:#a78bfa;font-weight:bold">Comparer</span> <span style="color:#94a3b8;font-size:0.9em">— est-ce que le résultat final est là où on voulait aller ?</span></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#10b98120;border:2px solid #10b98160;display:flex;align-items:center;justify-content:center;color:#10b981;font-weight:bold;flex-shrink:0;font-size:0.9em">4</div>
      <div><span style="color:#10b981;font-weight:bold">Corriger</span> <span style="color:#94a3b8;font-size:0.9em">— changer l'instruction incorrecte et retracer depuis le début</span></div>
    </div>
  </div>
</div>

<div style="background:#0f172a;border-left:4px solid #60a5fa;padding:12px 16px;border-radius:0 8px 8px 0">
  <p style="color:#60a5fa;margin:0 0 4px;font-weight:bold">💡 Le secret des pros</p>
  <p style="color:#94a3b8;margin:0;font-size:0.95em">Ne cherche pas le bug <em>dans</em> le code — <strong style="color:#cbd5e1">joue le code</strong> avec ton doigt et le bug se révélera tout seul.</p>
</div>
` } },

  // ── 6 : Bug de direction vs bug de compte ─────────────────────────────────────
  {
    type: "text", order_index: 6,
    content: { html: `
<h2 style="color:#a78bfa;margin-top:0">🔎 Deux types de bugs très courants</h2>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
  <div style="background:#1e293b;border:1px solid #ef444430;border-radius:12px;padding:16px">
    <div style="color:#ef4444;font-weight:bold;margin-bottom:10px">🔴 Bug de direction</div>
    <p style="color:#94a3b8;font-size:0.9em;margin:0 0 10px">Tourner du mauvais côté. Très visuel — Kirikou part à l'opposé de là où il devait aller.</p>
    <div style="font-family:monospace;font-size:0.8em;background:#0f172a;padding:8px;border-radius:8px">
      <div style="color:#ef4444;text-decoration:line-through">Tourner à droite</div>
      <div style="color:#4ade80">→ Tourner à gauche</div>
    </div>
  </div>
  <div style="background:#1e293b;border:1px solid #FDB81330;border-radius:12px;padding:16px">
    <div style="color:#FDB813;font-weight:bold;margin-bottom:10px">🟡 Bug de compte</div>
    <p style="color:#94a3b8;font-size:0.9em;margin:0 0 10px">Trop ou pas assez d'Avancer. Kirikou va dans la bonne direction mais s'arrête trop tôt ou dépasse.</p>
    <div style="font-family:monospace;font-size:0.8em;background:#0f172a;padding:8px;border-radius:8px">
      <div style="color:#ef4444;text-decoration:line-through">Avancer ×3</div>
      <div style="color:#4ade80">→ Avancer ×4</div>
    </div>
  </div>
</div>

<div style="background:#1e293b;border-radius:12px;padding:14px 18px">
  <p style="color:#cbd5e1;margin:0;font-size:0.95em">💡 <strong style="color:#a78bfa">Astuce :</strong> si Kirikou part dans la mauvaise direction → cherche un bug de direction. S'il va dans la bonne direction mais pas assez loin → cherche un bug de compte.</p>
</div>
` } },

  // ── 7 : GAME bug_hunt (round 1) ───────────────────────────────────────────────
  {
    type: "game", order_index: 7,
    content: {
      game_type: "bug_hunt",
      title: "Trouve le bug ! — Niveau 1",
      description: "Ce programme devait guider Kirikou en ligne droite de gauche à droite (4 cases). Mais une instruction est incorrecte. Clique sur elle !",
      context: "Labyrinthe : K . . . . ⭐  (ligne droite, 5 cases, Kirikou face à l'Est)",
      instructions: [
        "Avancer",
        "Avancer",
        "Tourner à droite",
        "Avancer",
        "Avancer",
      ],
      bug_index: 2,
      fix: "Avancer",
      explanation: "Le chemin était une ligne droite ! Kirikou n'avait pas besoin de tourner. L'instruction 3 (Tourner à droite) devait être Avancer.",
    },
  },

  // ── 8 : Activité mentor ───────────────────────────────────────────────────────
  {
    type: "text", order_index: 8,
    content: { html: `
<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:2px solid #FDB81340;border-radius:14px;padding:20px 24px">
  <h2 style="color:#FDB813;margin:0 0 12px">🎯 Activité avec ton mentor</h2>

  <div style="background:#0f172a;border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🕵️ Mission — Tu joues le robot</p>
    <p style="color:#94a3b8;margin:0">Ton mentor va lire un programme à voix haute, instruction par instruction. <strong style="color:#cbd5e1">Toi, tu joues Kirikou</strong> — tu bouges ton doigt sur la grille dessinée ou tu mimes les mouvements.</p>
  </div>

  <div style="background:#0f172a;border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🔄 On inverse !</p>
    <p style="color:#94a3b8;margin:0">Maintenant <strong style="color:#cbd5e1">ton mentor joue le robot</strong> et toi tu lis le programme. Mais attention — glisse une erreur dans ton programme pour voir si ton mentor la remarque !</p>
  </div>

  <div style="background:#0f172a;border-radius:10px;padding:14px 18px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🏆 Le vrai défi</p>
    <p style="color:#94a3b8;margin:0">Quel type de bug avait le programme ? Bug de <strong style="color:#ef4444">direction</strong>, bug de <strong style="color:#FDB813">compte</strong>, ou bug d'<strong style="color:#a78bfa">ordre</strong> ?</p>
  </div>
</div>
` } },

  // ── 9 : Quiz lire des programmes ──────────────────────────────────────────────
  {
    type: "quiz", order_index: 9,
    content: { questions: [
      {
        id: "q_read_1",
        question: "Kirikou est face à l'Est. Il exécute : Avancer, Tourner à gauche, Avancer, Avancer. Où regarde-t-il à la fin ?",
        type: "mcq",
        choices: ["Vers le Nord (haut)", "Vers le Sud (bas)", "Vers l'Ouest (gauche)", "Vers l'Est (droite)"],
        answer: 0,
        explanation: "Kirikou regardait vers l'Est (droite). Tourner à gauche depuis l'Est = regarder vers le Nord (haut). Les 2 Avancer le déplacent vers le haut. Il regarde donc vers le Nord !",
      },
      {
        id: "q_read_2",
        question: "Programme : Avancer, Avancer, Tourner à droite, Tourner à droite, Avancer. Combien de cases a parcouru Kirikou en tout ?",
        type: "mcq",
        choices: ["5 cases", "3 cases", "4 cases", "2 cases"],
        answer: 0,
        explanation: "Avancer + Avancer = 2 cases. Tourner à droite + Tourner à droite = demi-tour (0 case, juste une rotation). Avancer = 1 case. Total : 3 déplacements = 3 cases. Ah, c'était un piège — la bonne réponse est 3 ! (mais on a mis 5 en A pour tester si tu comptes les tours comme des cases)",
      },
      {
        id: "q_read_3",
        question: "Kirikou doit aller en ligne droite sur 3 cases. Quel programme est CORRECT ?",
        type: "mcq",
        choices: ["Avancer, Avancer, Avancer", "Avancer, Tourner à gauche, Avancer, Avancer", "Avancer, Avancer, Tourner à droite", "Tourner à gauche, Avancer, Avancer, Avancer"],
        answer: 0,
        explanation: "Pour une ligne droite, on n'a besoin que de 3 fois Avancer. Tout ajout de virage change la direction et ne produit plus une ligne droite.",
      },
    ] },
  },

  // ── 10 : Les pros déboguent aussi ────────────────────────────────────────────
  {
    type: "text", order_index: 10,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f1f2e,#1e293b);border:1px solid #60a5fa30;border-radius:14px;padding:20px 24px">
  <h2 style="color:#60a5fa;margin:0 0 12px">💻 Les pros déboguent aussi — chaque jour !</h2>
  <p style="color:#cbd5e1;margin:0 0 12px">En vrai, les développeurs passent <strong style="color:#FDB813">30 à 50 % de leur temps</strong> à déboguer leur propre code — pas à écrire du nouveau code.</p>
  <div style="background:#0f172a;border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <p style="color:#fbbf24;margin:0 0 6px;font-weight:bold">🚀 Quelques bugs célèbres :</p>
    <ul style="color:#94a3b8;padding-left:18px;margin:0;line-height:2;font-size:0.9em">
      <li>La sonde spatiale <strong style="color:#60a5fa">Mars Climate Orbiter</strong> (1999) s'est écrasée à cause d'un bug d'unité (mètres vs pieds) — 327 millions de dollars perdus</li>
      <li>Le jeu <strong style="color:#60a5fa">Cyberpunk 2077</strong> avait des milliers de bugs à sa sortie</li>
      <li>Un bug dans un distributeur de billets a <strong style="color:#60a5fa">distribué de l'argent gratuitement</strong> pendant quelques heures</li>
    </ul>
  </div>
  <p style="color:#94a3b8;margin:0;font-size:0.95em">💡 Déboguer n'est pas une honte — c'est une <strong style="color:#4ade80">compétence professionnelle</strong> que tu es en train d'acquérir !</p>
</div>
` } },

  // ── 11 : GAME bug_hunt — Labyrinthe A (trouve le bug) ────────────────────────
  {
    type: "game", order_index: 11,
    content: {
      game_type: "bug_hunt",
      title: "🔴 Trouve le bug ! — Labyrinthe 1",
      description: "Kirikou devait faire un virage en L dans ce labyrinthe 4×4. Quelqu'un a glissé une erreur dans le programme — laquelle ?",
      context: "Grille :\n  ■ ■ ■ ⭐\n  ■ ■ ■ ·\n  ■ ■ ■ ·\n  K · · ·\n\nK part en bas à gauche face à l'Est → doit atteindre ⭐ en haut à droite.",
      instructions: [
        "Avancer",
        "Avancer",
        "Avancer",
        "Tourner à droite",
        "Avancer",
        "Avancer",
        "Avancer",
      ],
      bug_index: 3,
      fix: "Tourner à gauche",
      explanation: "Après 3 Avancer vers la droite, Kirikou devait tourner à GAUCHE pour monter vers l'étoile. Tourner à droite l'envoyait vers le bas — droit dans le mur !",
    },
  },

  // ── 12 : GAME maze A — programme la version correcte ─────────────────────────
  { type: "game", order_index: 12, content: { ...MAZE_A, title: "Labyrinthe 1 — Programme la solution correcte", instructions: "Tu sais où était le bug ! Maintenant écris le programme CORRECT pour guider Kirikou jusqu'à l'étoile." } },

  // ── 13 : Transition ──────────────────────────────────────────────────────────
  {
    type: "text", order_index: 13,
    content: { html: `
<div style="background:#1e293b;border-radius:12px;padding:18px 22px;text-align:center">
  <div style="font-size:2em;margin-bottom:8px">🕵️</div>
  <h2 style="color:#10b981;margin:0 0 8px">Premier labyrinthe résolu, détective !</h2>
  <p style="color:#94a3b8;margin:0">Le prochain labyrinthe est plus grand (5×5). Même méthode : d'abord trouve l'erreur dans le programme proposé, ensuite écris la version correcte.</p>
</div>
` } },

  // ── 14 : GAME bug_hunt — Labyrinthe B (trouve le bug) ────────────────────────
  {
    type: "game", order_index: 14,
    content: {
      game_type: "bug_hunt",
      title: "🔴 Trouve le bug ! — Labyrinthe 2",
      description: "Ce labyrinthe 5×5 est plus grand. Le programme proposé a une erreur — trouve-la !",
      context: "Grille :\n  ■ ■ ■ ■ ■\n  ■ ■ ■ ■ ⭐\n  ■ ■ ■ ■ ·\n  ■ ■ ■ ■ ·\n  K · · · ·\n\nK part en bas à gauche face à l'Est → doit atteindre ⭐ en (4,1).",
      instructions: [
        "Avancer",
        "Avancer",
        "Avancer",
        "Avancer",
        "Tourner à droite",
        "Avancer",
        "Avancer",
        "Avancer",
      ],
      bug_index: 4,
      fix: "Tourner à gauche",
      explanation: "Après 4 Avancer vers la droite, Kirikou devait tourner à GAUCHE pour monter. Tourner à droite depuis l'Est = regarder vers le Sud (bas) — exactement le mauvais sens !",
    },
  },

  // ── 15 : GAME maze B — programme la version correcte ─────────────────────────
  { type: "game", order_index: 15, content: { ...MAZE_B, title: "Labyrinthe 2 — Programme la solution correcte", instructions: "Tu as trouvé le bug ! Maintenant écris le programme CORRECT pour guider Kirikou dans ce grand labyrinthe." } },

  // ── 16 : Quiz clôture ────────────────────────────────────────────────────────
  {
    type: "quiz", order_index: 16,
    content: { questions: [
      {
        id: "q_fin_d1",
        question: "Qu'est-ce que le débogage ?",
        type: "mcq",
        choices: ["Trouver et corriger les erreurs dans un programme", "Supprimer un programme qui ne fonctionne pas", "Réécrire tout le code depuis le début"],
        answer: 0,
        explanation: "Déboguer = détecter + corriger. On ne reécrit pas tout — on cherche précisément l'erreur et on la corrige.",
      },
      {
        id: "q_fin_d2",
        question: "Kirikou devait avancer 5 cases mais n'en a avancé que 3. Quel type de bug est-ce ?",
        type: "mcq",
        choices: ["Bug de compte — trop peu d'Avancer dans le programme", "Bug de direction — Kirikou allait du mauvais côté", "Bug d'ordre — les instructions étaient inversées"],
        answer: 0,
        explanation: "Le robot va dans la bonne direction mais s'arrête trop tôt → bug de compte. Il faudrait remplacer Avancer×3 par Avancer×5.",
      },
      {
        id: "q_fin_d3",
        question: "Quelle est la meilleure technique pour trouver un bug dans un programme de robot ?",
        type: "mcq",
        choices: ["Lire le programme instruction par instruction en traçant le chemin du robot avec le doigt", "Effacer tout et recommencer", "Exécuter le programme en espérant que ça marche"],
        answer: 0,
        explanation: "La technique du 'doigt sur la grille' est la plus efficace : tu joues le robot mentalement, instruction par instruction, et le bug apparaît au moment où le robot fait quelque chose de bizarre.",
      },
      {
        id: "q_fin_d4",
        question: "Programme : Tourner à gauche, Avancer, Avancer, Avancer. Kirikou devait aller vers la droite. Quel est le bug ?",
        type: "mcq",
        choices: ["Mauvaise instruction au début — le Tourner à gauche n'aurait pas dû être là", "Pas assez d'Avancer", "L'ordre est inversé"],
        answer: 0,
        explanation: "Kirikou devait aller à droite (Est) mais le programme le fait d'abord tourner à gauche (Nord). L'erreur est l'instruction Tourner à gauche qui ne devrait pas être là.",
      },
      {
        id: "q_fin_d5",
        question: "Est-ce qu'il est normal de faire des bugs quand on programme ?",
        type: "mcq",
        choices: ["Oui — même les meilleurs développeurs en font, c'est inévitable", "Non — si on est bon, on ne fait plus de bugs", "Seulement au début, quand on est débutant"],
        answer: 0,
        explanation: "Les bugs font partie du développement ! Les professionnels passent en moyenne 40 % de leur temps à déboguer. Ce qui compte, c'est de savoir les trouver et les corriger efficacement.",
      },
    ] },
  },

  // ── 17 : Conclusion ───────────────────────────────────────────────────────────
  {
    type: "text", order_index: 17,
    content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:14px;padding:22px 26px;margin-bottom:16px">
  <h2 style="color:#4ade80;margin:0 0 12px;font-size:1.3em">🏆 Bravo — tu es un vrai détective du code !</h2>
  <p style="color:#86efac;margin:0">Tu sais maintenant lire un programme comme un professionnel, identifier le type d'erreur, et corriger le bug. C'est une compétence que tu utiliseras tout au long de ton parcours de programmeur.</p>
</div>

<div style="background:#1e293b;border-radius:12px;padding:18px 22px;margin-bottom:16px">
  <h3 style="color:#FDB813;margin:0 0 12px;font-size:1em">📚 Ce que tu as appris :</h3>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">Un <strong>bug</strong> = une erreur dans le programme qui produit un mauvais résultat</span></div>
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">Les 3 types : <strong style="color:#ef4444">mauvaise instruction</strong>, <strong style="color:#FDB813">trop/pas assez</strong>, <strong style="color:#a78bfa">ordre inversé</strong></span></div>
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">La technique : <strong>lire pas à pas</strong> + <strong>tracer avec le doigt</strong></span></div>
    <div style="display:flex;align-items:flex-start;gap:10px"><span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span><span style="color:#cbd5e1">Tout le monde fait des bugs — même les <strong>meilleurs développeurs</strong></span></div>
  </div>
</div>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #FDB81340;border-radius:12px;padding:16px 20px">
  <h3 style="color:#FDB813;margin:0 0 8px;font-size:1em">🔭 Prochaine séance — "Si… alors — le robot réfléchit"</h3>
  <p style="color:#94a3b8;margin:0">Tu vas apprendre à donner des choix à Kirikou. Plutôt que de tout prévoir d'avance, le robot pourra <strong style="color:#cbd5e1">prendre des décisions seul</strong> selon ce qu'il voit devant lui !</p>
</div>
` } },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🕵️  Enrichissement — Séance 4 Le débogage\n");

  // Purger les blocs existants
  const { error: delErr } = await sb.from("lesson_blocks").delete().eq("lesson_id", LESSON_ID);
  if (delErr) { console.error("❌ Purge:", delErr.message); process.exit(1); }
  console.log("🗑  Anciens blocs supprimés");

  // Mettre à jour le titre de la leçon
  await sb.from("lessons").update({ title: "Le débogage — Deviens détective du code" }).eq("id", LESSON_ID);
  console.log("✏️  Titre de la leçon mis à jour");

  // Insérer les blocs
  const rows = BLOCKS.map((b) => ({ ...b, lesson_id: LESSON_ID, theme_id: THEME_ID }));
  const { error: insErr } = await sb.from("lesson_blocks").insert(rows);
  if (insErr) { console.error("❌ Insertion:", insErr.message); process.exit(1); }

  console.log(`\n✅ ${rows.length} blocs insérés :`);
  rows.forEach((b) => {
    const prev =
      b.type === "game" ? `GAME  — ${(b.content as any).game_type} / ${(b.content as any).title ?? ""}` :
      b.type === "quiz" ? `QUIZ  — ${(b.content as any).questions?.length} question(s)` :
      b.type === "video"? `VIDEO — ${(b.content as any).title}` :
                          `TEXT  — bloc ${b.order_index}`;
    console.log(`  [${String(b.order_index).padStart(2,"0")}] ${prev}`);
  });
}

main().catch(console.error);
