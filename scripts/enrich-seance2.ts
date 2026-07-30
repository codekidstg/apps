/**
 * Enrichissement — Séance 2 "Gauche ou droite ?"
 * Objectif : passer de ~20 min à ~55-60 min pour les 8-12 ans
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/enrich-seance2.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "b76470f3-7f4e-4f16-892e-6e148ce227b6"; // Gauche ou droite ?
const THEME_ID  = "8979e87c-058c-4003-95fd-1531c649bd1d";

// ── Labyrinthes ────────────────────────────────────────────────────────────────

// Labyrinthe 1 — 4×4, un seul virage (gauche)
// Départ (0,3) face Est → arrivée (2,0)
// Solution : Avancer×2, Tourner gauche, Avancer×3
//
//   x:  0  1  2  3
// y=0:  W  W  *  W
// y=1:  W  W  .  W
// y=2:  W  W  .  W
// y=3:  K  .  .  W
const MAZE_1 = {
  grid_size: 4,
  start: { x: 0, y: 3, dir: "E" },
  goal:  { x: 2, y: 0 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:3,y:0 },
    { x:0,y:1 },{ x:1,y:1 },{ x:3,y:1 },
    { x:0,y:2 },{ x:1,y:2 },{ x:3,y:2 },
    { x:3,y:3 },
  ],
  max_blocks: 8,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  title: "Niveau 1 — Le premier virage",
  instructions: "Kirikou doit tourner pour rejoindre l'étoile ⭐. Avance-le puis fais-le pivoter au bon moment !",
  steps: [
    "Kirikou regarde vers la droite (Est)",
    "Avance-le de 2 cases",
    "Tourne à gauche ← pour regarder vers le haut",
    "Avance encore de 3 cases jusqu'à l'étoile ⭐",
  ],
};

// Labyrinthe 2 — 5×5 en L (existant, gardé tel quel)
// Départ (0,0) face Est → arrivée (4,4)
// Solution : Avancer×4, Tourner droite, Avancer×4
//
//   x:  0  1  2  3  4
// y=0:  K  .  .  .  .
// y=1:  W  W  W  W  .
// y=2:  W  W  W  W  .
// y=3:  W  W  W  W  .
// y=4:  W  W  W  W  *
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
  instructions: "Kirikou doit aller jusqu'au bout puis descendre. Un seul virage, mais au bon endroit !",
  steps: [
    "Avance Kirikou tout à droite jusqu'au mur (4 cases)",
    "Tourne à droite ↱ pour regarder vers le bas",
    "Avance encore de 4 cases jusqu'à l'étoile ⭐",
  ],
};

// Labyrinthe 3 bonus — 6×6 en S (2 virages)
// Départ (0,5) face Est → arrivée (5,0)
// Solution : Avancer×3, Tourner gauche, Avancer×3, Tourner droite, Avancer×2, Tourner gauche, Avancer×2
//
//   x:  0  1  2  3  4  5
// y=0:  W  W  W  W  W  *
// y=1:  W  W  W  W  W  .
// y=2:  W  W  W  .  .  .
// y=3:  W  W  W  .  W  W
// y=4:  W  W  W  .  W  W
// y=5:  K  .  .  .  W  W
const MAZE_3 = {
  grid_size: 6,
  start: { x: 0, y: 5, dir: "E" },
  goal:  { x: 5, y: 0 },
  walls: [
    // y=0 — sauf (5,0) arrivée
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },
    // y=1 — sauf (5,1) chemin
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },{ x:4,y:1 },
    // y=2 — sauf (3,2)(4,2)(5,2) chemin
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },
    // y=3 — sauf (3,3) chemin
    { x:0,y:3 },{ x:1,y:3 },{ x:2,y:3 },{ x:4,y:3 },{ x:5,y:3 },
    // y=4 — sauf (3,4) chemin
    { x:0,y:4 },{ x:1,y:4 },{ x:2,y:4 },{ x:4,y:4 },{ x:5,y:4 },
    // y=5 — sauf (0,5) départ et (1,5)(2,5)(3,5) chemin
    { x:4,y:5 },{ x:5,y:5 },
  ],
  max_blocks: 16,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  title: "Niveau 3 — Le serpent en S 🌟",
  instructions: "Deux virages cette fois ! Le chemin fait une forme de S. Trace-le du doigt avant de commencer !",
  steps: [
    "Avance 3 cases vers la droite",
    "Tourne à gauche pour regarder vers le haut",
    "Monte 3 cases puis tourne à droite",
    "Avance 2 cases, tourne à gauche, encore 2 cases jusqu'à l'étoile !",
  ],
};

// ── Blocs de la leçon ──────────────────────────────────────────────────────

const BLOCKS = [
  // ── 0 : Rappel + mise en situation ──────────────────────────────────────
  {
    type: "text", order_index: 0,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:22px 26px">
  <h2 style="color:#FDB813;margin:0 0 12px;font-size:1.3em">🤖 Séance 2 — Les virages !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Tu te souviens de Kirikou ? La dernière fois, tu lui as appris à avancer tout droit dans un labyrinthe. Il ne savait faire qu'une chose : <strong style="color:#FDB813">Avancer</strong>.</p>
  <p style="color:#cbd5e1;margin:0 0 12px">Mais les vrais labyrinthes ne sont pas des couloirs droits ! Cette fois, Kirikou doit <strong style="color:#a78bfa">tourner</strong>. Et c'est là que beaucoup de gens se perdent… 🌀</p>

  <div style="background:#0f172a;border-radius:10px;padding:12px 16px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">📌 Rappel séance 1</p>
    <ul style="color:#94a3b8;padding-left:18px;margin:0">
      <li>Un <strong style="color:#cbd5e1">algorithme</strong> = une suite d'instructions précises dans l'ordre</li>
      <li>Un robot exécute <strong style="color:#cbd5e1">exactement</strong> ce qu'on lui dit</li>
      <li>Kirikou comprend : <strong style="color:#FDB813">Avancer</strong>, <strong style="color:#60a5fa">Tourner à gauche</strong>, <strong style="color:#a78bfa">Tourner à droite</strong></li>
    </ul>
  </div>
</div>
` }
  },

  // ── 1 : Les 4 directions ─────────────────────────────────────────────────
  {
    type: "text", order_index: 1,
    content: { html: `
<h2 style="color:#60a5fa;margin-top:0">🧭 Les 4 directions de Kirikou</h2>
<p style="color:#cbd5e1">Dans le labyrinthe, Kirikou peut regarder dans <strong style="color:#60a5fa">4 directions</strong>. Ces directions sont toujours par rapport à <strong>ton écran</strong> :</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;text-align:center">
    <div style="font-size:2em">⬆️</div>
    <div style="color:#60a5fa;font-weight:bold;margin:4px 0">NORD — Haut</div>
    <div style="color:#475569;font-size:0.85em">Kirikou regarde vers le haut de l'écran</div>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;text-align:center">
    <div style="font-size:2em">⬇️</div>
    <div style="color:#f87171;font-weight:bold;margin:4px 0">SUD — Bas</div>
    <div style="color:#475569;font-size:0.85em">Kirikou regarde vers le bas de l'écran</div>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;text-align:center">
    <div style="font-size:2em">⬅️</div>
    <div style="color:#a78bfa;font-weight:bold;margin:4px 0">OUEST — Gauche</div>
    <div style="color:#475569;font-size:0.85em">Kirikou regarde vers la gauche</div>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;text-align:center">
    <div style="font-size:2em">➡️</div>
    <div style="color:#FDB813;font-weight:bold;margin:4px 0">EST — Droite</div>
    <div style="color:#475569;font-size:0.85em">Kirikou regarde vers la droite</div>
  </div>
</div>

<div style="background:#0f172a;border-left:4px solid #60a5fa;padding:12px 16px;border-radius:0 8px 8px 0">
  <p style="color:#60a5fa;margin:0 0 6px;font-weight:bold">💡 Important</p>
  <p style="color:#94a3b8;margin:0">Quand Kirikou <strong style="color:#cbd5e1">tourne</strong>, il ne bouge pas de case — il change juste de direction. C'est comme toi qui fais demi-tour sur place !</p>
</div>
` }
  },

  // ── 2 : Quiz — reconnaître les directions ────────────────────────────────
  {
    type: "quiz", order_index: 2,
    content: {
      questions: [
        {
          id: "q_dir_1",
          question: "Kirikou regarde vers le haut de l'écran. Dans quelle direction regarde-t-il ?",
          type: "mcq",
          choices: ["Nord", "Sud", "Est", "Ouest"],
          answer: 0,
          explanation: "Le haut de l'écran = Nord. Comme sur une carte géographique !",
        },
        {
          id: "q_dir_2",
          question: "Kirikou regarde à droite (Est). Il fait \"Tourner à gauche\". Où regarde-t-il maintenant ?",
          type: "mcq",
          choices: ["Nord (vers le haut)", "Sud (vers le bas)", "Ouest (vers la gauche)", "Il ne change pas"],
          answer: 0,
          explanation: "Depuis l'Est, tourner à gauche = regarder vers le Nord. Essaie avec ta main : tourne-toi vers la droite, puis tourne à gauche — tu regardes maintenant devant toi !",
        },
        {
          id: "q_dir_3",
          question: "Kirikou regarde vers le bas (Sud). Il fait \"Tourner à droite\". Où regarde-t-il ?",
          type: "mcq",
          choices: ["Vers la gauche (Ouest)", "Vers la droite (Est)", "Vers le haut (Nord)", "Toujours vers le bas"],
          answer: 0,
          explanation: "Depuis le Sud, tourner à droite = regarder vers l'Ouest (la gauche de l'écran). Le cercle des directions : Nord → Est → Sud → Ouest → Nord...",
        },
      ],
    },
  },

  // ── 3 : L'astuce de la main droite ──────────────────────────────────────
  {
    type: "text", order_index: 3,
    content: { html: `
<h2 style="color:#f97316;margin-top:0">🤝 L'astuce de la main — ne plus jamais se tromper !</h2>
<p style="color:#cbd5e1">Gauche et droite, c'est relatif à <strong style="color:#f97316">celui qui regarde</strong>. C'est là que tout le monde se trompe !</p>
<p style="color:#cbd5e1">Voici l'astuce magique des développeurs :</p>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #f9731640;border-radius:12px;padding:18px 22px;margin:14px 0">
  <h3 style="color:#f97316;margin:0 0 12px;font-size:1em">✋ La technique de la main</h3>
  <ol style="color:#cbd5e1;padding-left:18px;margin:0;line-height:1.8">
    <li>Pointe ta main dans la <strong style="color:#f97316">même direction que Kirikou</strong></li>
    <li>Ta main gauche → c'est la <strong style="color:#60a5fa">gauche de Kirikou</strong></li>
    <li>Ta main droite → c'est la <strong style="color:#a78bfa">droite de Kirikou</strong></li>
  </ol>
</div>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin-top:12px">
  <p style="color:#fbbf24;margin:0 0 10px;font-weight:bold">🧪 Essaie maintenant !</p>
  <p style="color:#94a3b8;margin:0 0 8px">Kirikou regarde vers le haut (Nord). <br/>Tends ta main vers le haut aussi.</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0">
    <li>Ta main gauche pointe vers… <strong style="color:#60a5fa">l'Ouest (la gauche de l'écran)</strong> ✓</li>
    <li>Ta main droite pointe vers… <strong style="color:#a78bfa">l'Est (la droite de l'écran)</strong> ✓</li>
  </ul>
  <p style="color:#475569;margin:10px 0 0;font-size:0.9em">💡 Maintenant tourne-toi vers le bas (Sud) : ta main gauche pointe maintenant vers l'Est ! La gauche et la droite dépendent de la direction qu'on regarde.</p>
</div>
` }
  },

  // ── 4 : Tourner en chaîne — la boussole dans la tête ────────────────────
  {
    type: "text", order_index: 4,
    content: { html: `
<h2 style="color:#a78bfa;margin-top:0">🌀 Tourner en chaîne — la boussole dans la tête</h2>
<p style="color:#cbd5e1">Il y a un truc que les pros connaissent par cœur : si tu tournes plusieurs fois de suite, tu peux prédire où tu vas regarder <strong style="color:#a78bfa">sans même bouger !</strong></p>

<div style="background:#1e293b;border-radius:12px;padding:16px 20px;margin:14px 0">
  <p style="color:#fbbf24;margin:0 0 10px;font-weight:bold">🔄 Le cycle des directions (dans le sens horaire)</p>
  <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;font-size:1.1em">
    <span style="color:#60a5fa;font-weight:bold">NORD ⬆️</span>
    <span style="color:#334155">→</span>
    <span style="color:#FDB813;font-weight:bold">EST ➡️</span>
    <span style="color:#334155">→</span>
    <span style="color:#f87171;font-weight:bold">SUD ⬇️</span>
    <span style="color:#334155">→</span>
    <span style="color:#a78bfa;font-weight:bold">OUEST ⬅️</span>
    <span style="color:#334155">→</span>
    <span style="color:#60a5fa;font-weight:bold">NORD ⬆️</span>
  </div>
  <p style="color:#475569;margin:10px 0 0;font-size:0.85em">Tourner à droite = avancer dans ce cycle. Tourner à gauche = reculer dans ce cycle.</p>
</div>

<div style="background:#0f172a;border-radius:10px;padding:14px 18px;margin-top:12px">
  <p style="color:#a78bfa;margin:0 0 8px;font-weight:bold">📐 Exemples :</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0;line-height:1.9">
    <li>Nord + <strong style="color:#a78bfa">1 droite</strong> → Est</li>
    <li>Nord + <strong style="color:#a78bfa">2 droites</strong> → Sud (demi-tour !)</li>
    <li>Nord + <strong style="color:#a78bfa">3 droites</strong> → Ouest</li>
    <li>Nord + <strong style="color:#a78bfa">4 droites</strong> → Nord (tour complet !)</li>
    <li>Est + <strong style="color:#60a5fa">1 gauche</strong> → Nord</li>
    <li>Est + <strong style="color:#60a5fa">2 gauches</strong> → Ouest (demi-tour !)</li>
  </ul>
</div>
` }
  },

  // ── 5 : Quiz — rotations en chaîne ──────────────────────────────────────
  {
    type: "quiz", order_index: 5,
    content: {
      questions: [
        {
          id: "q_rot_1",
          question: "Kirikou regarde vers le Nord. Il tourne à droite 2 fois. Où regarde-t-il ?",
          type: "mcq",
          choices: ["Sud (vers le bas)", "Est (vers la droite)", "Ouest (vers la gauche)", "Toujours Nord"],
          answer: 0,
          explanation: "Nord + droite = Est. Est + droite = Sud. Deux tours à droite depuis le Nord → Kirikou fait un demi-tour et regarde vers le bas !",
        },
        {
          id: "q_rot_2",
          question: "Kirikou regarde vers l'Est. Il tourne à gauche 3 fois. Où regarde-t-il ?",
          type: "mcq",
          choices: ["Sud (vers le bas)", "Nord (vers le haut)", "Ouest (vers la gauche)", "Est — il est revenu"],
          answer: 0,
          explanation: "Est → gauche → Nord → gauche → Ouest → gauche → Sud. Trois tours à gauche depuis l'Est = regarder vers le Sud.",
        },
        {
          id: "q_rot_3",
          question: "Kirikou fait 4 fois \"Tourner à droite\". Que se passe-t-il ?",
          type: "mcq",
          choices: [
            "Il fait un tour complet et regarde dans la même direction qu'au départ",
            "Il avance de 4 cases",
            "Il se retrouve face à un mur automatiquement",
          ],
          answer: 0,
          explanation: "4 rotations de 90° = 360° = un tour complet ! Kirikou revient exactement à sa direction de départ. C'est comme si rien ne s'était passé !",
        },
      ],
    },
  },

  // ── 6 : Planifier avant de coder ────────────────────────────────────────
  {
    type: "text", order_index: 6,
    content: { html: `
<h2 style="color:#4ade80;margin-top:0">🗺️ Planifier avant de coder</h2>
<p style="color:#cbd5e1">Les meilleurs développeurs ne se lancent jamais dans le code sans réfléchir d'abord. Ils ont une méthode simple mais <strong style="color:#4ade80">vraiment efficace</strong>.</p>

<div style="background:#1e293b;border-radius:12px;padding:16px 20px;margin:14px 0">
  <h3 style="color:#4ade80;margin:0 0 12px;font-size:1em">📋 La méthode en 3 étapes</h3>
  <div style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:flex-start;gap:12px;background:#0f172a;border-radius:8px;padding:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#4ade8020;border:1px solid #4ade8060;display:flex;align-items:center;justify-content:center;color:#4ade80;font-weight:bold;flex-shrink:0">1</div>
      <div>
        <div style="color:#4ade80;font-weight:bold">Observer le labyrinthe</div>
        <div style="color:#475569;font-size:0.9em;margin-top:2px">Repère le point de départ 🤖 et l'étoile ⭐. Cherche les murs.</div>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;background:#0f172a;border-radius:8px;padding:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#FDB81320;border:1px solid #FDB81360;display:flex;align-items:center;justify-content:center;color:#FDB813;font-weight:bold;flex-shrink:0">2</div>
      <div>
        <div style="color:#FDB813;font-weight:bold">Tracer le chemin du doigt</div>
        <div style="color:#475569;font-size:0.9em;margin-top:2px">Suis le chemin sur l'écran avec le doigt. Note où tu dois tourner.</div>
      </div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;background:#0f172a;border-radius:8px;padding:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:#60a5fa20;border:1px solid #60a5fa60;display:flex;align-items:center;justify-content:center;color:#60a5fa;font-weight:bold;flex-shrink:0">3</div>
      <div>
        <div style="color:#60a5fa;font-weight:bold">Traduire en blocs</div>
        <div style="color:#475569;font-size:0.9em;margin-top:2px">Chaque mouvement du doigt devient un bloc : droite → Avancer, virage → Tourner à gauche/droite.</div>
      </div>
    </div>
  </div>
</div>

<div style="background:#0f172a;border-left:4px solid #4ade80;padding:12px 16px;border-radius:0 8px 8px 0">
  <p style="color:#4ade80;margin:0 0 6px;font-weight:bold">🏆 Pourquoi c'est important ?</p>
  <p style="color:#94a3b8;margin:0">Un programmeur qui réfléchit avant d'écrire le code fait <strong style="color:#cbd5e1">3× moins d'erreurs</strong> que celui qui fonce tête baissée. La réflexion, c'est du travail — mais c'est le bon travail !</p>
</div>
` }
  },

  // ── 7 : Quiz — lire le labyrinthe ────────────────────────────────────────
  {
    type: "quiz", order_index: 7,
    content: {
      questions: [
        {
          id: "q_plan_1",
          question: "Avant de programmer Kirikou, quelle est la première chose à faire ?",
          type: "mcq",
          choices: [
            "Observer le labyrinthe et trouver un chemin",
            "Poser le plus de blocs possible et voir ce qui se passe",
            "Tourner Kirikou dans tous les sens au hasard",
          ],
          answer: 0,
          explanation: "Exactement ! Réfléchir avant d'agir, c'est la marque d'un bon programmeur. Observer, tracer le chemin, puis traduire en blocs.",
        },
        {
          id: "q_plan_2",
          question: "Kirikou part face à l'Est dans un couloir. Il y a un mur devant lui après 3 cases. Le passage continue vers le bas. Quelle est la bonne séquence ?",
          type: "mcq",
          choices: [
            "Avancer×3, Tourner à droite, puis avancer",
            "Tourner à droite, Avancer×3, puis avancer",
            "Avancer×3, Tourner à gauche, puis avancer",
          ],
          answer: 0,
          explanation: "On avance d'abord (3 cases), puis on tourne à droite pour regarder vers le bas (Sud), puis on continue. Tourner à gauche depuis l'Est donnerait le Nord — la mauvaise direction !",
        },
      ],
    },
  },

  // ── 8 : Intro niveau 1 ───────────────────────────────────────────────────
  {
    type: "text", order_index: 8,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e1f3b);border:1px solid #60a5fa40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#60a5fa;margin:0 0 12px">🗺️ À toi de jouer — Niveau 1 !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Ce premier labyrinthe n'a qu'<strong style="color:#60a5fa">un seul virage</strong>. C'est parfait pour vérifier que tu as bien compris l'astuce de la main.</p>

  <div style="background:#0f172a;border-radius:10px;padding:12px 16px;margin-bottom:10px">
    <p style="color:#fbbf24;margin:0 0 6px;font-weight:bold">💡 Rappel :</p>
    <ul style="color:#94a3b8;padding-left:16px;margin:0">
      <li>Kirikou commence face à l'<strong style="color:#FDB813">Est</strong> (vers la droite)</li>
      <li>Repère où se trouve l'étoile ⭐</li>
      <li>Trace le chemin du doigt</li>
      <li>Traduis en blocs !</li>
    </ul>
  </div>
</div>
` }
  },

  // ── 9 : GAME — Labyrinthe 1 ──────────────────────────────────────────────
  {
    type: "game", order_index: 9,
    content: MAZE_1,
  },

  // ── 10 : Transition → Niveau 2 ───────────────────────────────────────────
  {
    type: "text", order_index: 10,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1f1535);border:1px solid #a78bfa40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#a78bfa;margin:0 0 10px">✅ Super ! Le labyrinthe devient plus grand</h2>
  <p style="color:#cbd5e1;margin:0 0 12px">Tu as réussi un virage ! Maintenant le labyrinthe passe en <strong style="color:#a78bfa">5×5</strong>. Le principe est identique — mais il faut compter plus de cases.</p>

  <div style="background:#1e293b;border-radius:10px;padding:12px 16px">
    <p style="color:#fbbf24;margin:0 0 6px;font-weight:bold">🧠 Stratégie gagnante</p>
    <p style="color:#94a3b8;margin:0">Avant de placer tes blocs, compte <strong style="color:#cbd5e1">exactement</strong> combien de cases Kirikou doit parcourir dans chaque direction. Un bloc Avancer = une case.</p>
  </div>
</div>
` }
  },

  // ── 11 : GAME — Labyrinthe 2 ─────────────────────────────────────────────
  {
    type: "game", order_index: 11,
    content: MAZE_2,
  },

  // ── 12 : Intro défi bonus ────────────────────────────────────────────────
  {
    type: "text", order_index: 12,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1a2f0f);border:1px solid #22c55e40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#4ade80;margin:0 0 10px">🏆 Défi Bonus — Le serpent en S !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Ce labyrinthe est <strong style="color:#4ade80">6×6</strong> et demande <strong style="color:#4ade80">deux virages</strong>. Le chemin forme un S — comme un vrai serpent 🐍</p>

  <div style="background:#0f172a;border:1px solid #22c55e30;border-radius:10px;padding:14px 18px;margin:12px 0">
    <p style="color:#86efac;margin:0 0 8px;font-weight:bold">🧩 Comment l'aborder :</p>
    <ol style="color:#94a3b8;padding-left:18px;margin:0;line-height:1.8">
      <li>Trouve les <strong style="color:#cbd5e1">deux endroits</strong> où Kirikou doit tourner</li>
      <li>Compte les cases entre chaque virage</li>
      <li>Note : tourne-t-il à <strong style="color:#60a5fa">gauche</strong> ou à <strong style="color:#a78bfa">droite</strong> à chaque fois ?</li>
      <li>Place tes blocs et lance !</li>
    </ol>
  </div>

  <p style="color:#475569;margin:0;font-size:0.9em">🎖️ Ce niveau utilise exactement les mêmes blocs qu'avant — juste plus de réflexion. Tu en es capable !</p>
</div>
` }
  },

  // ── 13 : GAME — Labyrinthe 3 bonus ───────────────────────────────────────
  {
    type: "game", order_index: 13,
    content: MAZE_3,
  },

  // ── 14 : Quiz final — 5 questions ────────────────────────────────────────
  {
    type: "quiz", order_index: 14,
    content: {
      questions: [
        {
          id: "q_fin_1",
          question: "Quelle est la différence entre \"Avancer\" et \"Tourner\" ?",
          type: "mcq",
          choices: [
            "Avancer déplace Kirikou d'une case, Tourner change sa direction sans le bouger",
            "Tourner est plus rapide qu'Avancer",
            "Les deux font avancer Kirikou, mais dans des directions différentes",
          ],
          answer: 0,
          explanation: "Exactement ! Tourner ne fait pas bouger Kirikou — ça change juste la direction vers laquelle il regarde. Il faut ensuite Avancer pour qu'il se déplace.",
        },
        {
          id: "q_fin_2",
          question: "Kirikou regarde vers l'Ouest (gauche). Il fait \"Tourner à droite\". Où regarde-t-il ?",
          type: "mcq",
          choices: ["Nord (vers le haut)", "Sud (vers le bas)", "Est (vers la droite)", "Il regarde toujours à l'Ouest"],
          answer: 0,
          explanation: "Depuis l'Ouest, tourner à droite = regarder vers le Nord. Le cycle : Nord → Est → Sud → Ouest → Nord. En sens inverse (gauche) : Nord → Ouest → Sud → Est → Nord.",
        },
        {
          id: "q_fin_3",
          question: "Pour aller de la case (0,0) à la case (3,2) en partant face à l'Est, combien d'instructions \"Avancer\" faut-il au minimum ?",
          type: "mcq",
          choices: ["5 (3 vers la droite + 2 vers le bas)", "3 (juste vers la droite)", "2 (juste vers le bas)"],
          answer: 0,
          explanation: "Il faut couvrir 3 cases vers l'Est et 2 cases vers le Sud = 5 cases au total. Les rotations (Tourner) ne comptent pas dans le déplacement.",
        },
        {
          id: "q_fin_4",
          question: "Kirikou doit faire un demi-tour (regarder dans le sens opposé). Quelle séquence fonctionne ?",
          type: "mcq",
          choices: [
            "Tourner à droite, Tourner à droite",
            "Tourner à droite seulement",
            "Avancer, Tourner à gauche",
          ],
          answer: 0,
          explanation: "Deux rotations de 90° dans le même sens = 180° = demi-tour ! \"Tourner à droite, Tourner à droite\" ou \"Tourner à gauche, Tourner à gauche\" — les deux fonctionnent.",
        },
        {
          id: "q_fin_5",
          question: "Avant de programmer un labyrinthe complexe, quelle est la meilleure approche ?",
          type: "mcq",
          choices: [
            "Tracer le chemin du doigt, compter les cases, puis traduire en blocs",
            "Essayer tous les blocs au hasard jusqu'à trouver",
            "Commencer par placer les blocs \"Tourner\" en premier",
          ],
          answer: 0,
          explanation: "Planifier avant de coder ! Tracer le chemin, compter les cases à chaque segment, noter les virages — puis seulement traduire en blocs. C'est ce que font les vrais développeurs.",
        },
      ],
    },
  },

  // ── 15 : Conclusion ──────────────────────────────────────────────────────
  {
    type: "text", order_index: 15,
    content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:14px;padding:22px 26px;margin-bottom:16px">
  <h2 style="color:#4ade80;margin:0 0 12px;font-size:1.3em">🏆 Tu maîtrises les virages !</h2>
  <p style="color:#86efac;margin:0 0 10px">Tu peux maintenant guider Kirikou dans n'importe quelle direction. C'est un vrai superpouvoir en programmation — tu <strong>contrôles l'espace</strong> !</p>
</div>

<div style="background:#1e293b;border-radius:12px;padding:18px 22px;margin-bottom:16px">
  <h3 style="color:#FDB813;margin:0 0 12px;font-size:1em">📚 Ce que tu sais maintenant :</h3>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Les <strong style="color:#FDB813">4 directions</strong> : Nord, Sud, Est, Ouest</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">L'<strong style="color:#f97316">astuce de la main</strong> pour ne jamais se tromper de sens</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Le <strong style="color:#a78bfa">cycle des directions</strong> : tourner 4 fois = revenir au départ</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1"><strong style="color:#4ade80">Planifier avant de coder</strong> : observer → tracer → traduire</span>
    </div>
  </div>
</div>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #f8717140;border-radius:12px;padding:16px 20px">
  <h3 style="color:#f87171;margin:0 0 10px;font-size:1em">🔭 La prochaine fois — Séance 3 : Déboguer son programme</h3>
  <p style="color:#94a3b8;margin:0 0 8px">Tu vas apprendre ce qu'est un <strong style="color:#f87171">bug</strong> et comment le corriger. C'est l'une des compétences les plus précieuses d'un développeur !</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0">
    <li>Repérer une erreur dans un algorithme</li>
    <li>Comprendre pourquoi Kirikou ne va pas là où on veut</li>
    <li>Corriger le programme étape par étape</li>
  </ul>
  <p style="color:#475569;margin:10px 0 0;font-size:0.9em">🏅 N'oublie pas tes <strong style="color:#cbd5e1">entraînements</strong> pour gagner des XP !</p>
</div>
` }
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Enrichissement de la Séance 2 — Gauche ou droite ?");
  console.log(`📌 Lesson ID : ${LESSON_ID}\n`);

  const { data: existing, error: fetchErr } = await supabase
    .from("lesson_blocks").select("id").eq("lesson_id", LESSON_ID);
  if (fetchErr) { console.error("❌ Lecture :", fetchErr); process.exit(1); }

  if (existing?.length) {
    const { error: delErr } = await supabase
      .from("lesson_blocks").delete().eq("lesson_id", LESSON_ID);
    if (delErr) { console.error("❌ Suppression :", delErr); process.exit(1); }
    console.log(`🗑️  ${existing.length} bloc(s) supprimé(s)`);
  }

  const rows = BLOCKS.map((b) => ({ ...b, lesson_id: LESSON_ID, theme_id: THEME_ID }));
  const { error: insertErr } = await supabase.from("lesson_blocks").insert(rows);
  if (insertErr) { console.error("❌ Insertion :", insertErr); process.exit(1); }

  console.log(`✅ ${BLOCKS.length} blocs insérés !\n`);
  console.log("📋 Structure de la leçon :");
  BLOCKS.forEach((b) => {
    const label = b.type === "game"
      ? `GAME  — ${(b.content as any).title}`
      : b.type === "quiz"
      ? `QUIZ  — ${(b.content as any).questions?.length} question(s)`
      : `TEXT  — bloc ${b.order_index}`;
    console.log(`  [${String(b.order_index).padStart(2, "0")}] ${label}`);
  });

  console.log("\n🎉 Séance 2 enrichie ! Durée estimée : ~55-60 min pour les 8-12 ans.");
}

main().catch(console.error);
