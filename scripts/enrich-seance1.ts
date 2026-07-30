/**
 * Enrichissement — Séance 1 "Mon premier algorithme"
 * Objectif : passer de ~25 min à ~55-60 min pour les 8-12 ans
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/enrich-seance1.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "f0ee843c-ba50-404f-a5c3-1f33b15d5598";
const THEME_ID  = "8979e87c-058c-4003-95fd-1531c649bd1d";

// ── Labyrinthes ────────────────────────────────────────────────────────────────

// Labyrinthe 1 — couloir droit 5×5 (EXISTANT, on remet propre)
// Robot à (0,2) face Est → arrivée (4,2). Seulement Avancer.
// Murs top/bottom (y=0 et y=4), et couloir central libre.
// Solution : Avancer × 4
const MAZE_1 = {
  grid_size: 5,
  start: { x: 0, y: 2, dir: "E" },
  goal:  { x: 4, y: 2 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },{ x:4,y:1 },
    { x:0,y:3 },{ x:1,y:3 },{ x:2,y:3 },{ x:3,y:3 },{ x:4,y:3 },
    { x:0,y:4 },{ x:1,y:4 },{ x:2,y:4 },{ x:3,y:4 },{ x:4,y:4 },
  ],
  max_blocks: 6,
  available_blocks: ["robot_move"],
  title: "Niveau 1 — Le couloir droit",
  instructions: "Guide Kirikou jusqu'à l'étoile ⭐ en utilisant seulement le bloc Avancer !",
  steps: [
    "Kirikou regarde vers la droite (tu vois la flèche sous lui ?)",
    "Utilise le bloc 🚀 Avancer",
    "Avance-le 4 fois pour atteindre l'étoile ⭐",
  ],
};

// Labyrinthe 2 — couloir plus long 6×6 (robot_move seulement)
// Robot à (0,3) face Est → arrivée (5,3). 5 cases à compter.
// Corridor élargi avec bords ouverts en haut/bas pour tromper l'œil
// mais le robot ne peut qu'avancer — il reste sur sa ligne.
// Solution : Avancer×5
//
//   x:  0  1  2  3  4  5
// y=0:  W  W  W  W  W  W
// y=1:  W  W  W  W  W  W
// y=2:  W  W  W  W  W  W
// y=3:  K  .  .  .  .  *
// y=4:  W  W  W  W  W  W
// y=5:  W  W  W  W  W  W
const MAZE_2 = {
  grid_size: 6,
  start: { x: 0, y: 3, dir: "E" },
  goal:  { x: 5, y: 3 },
  walls: [
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },{ x:5,y:0 },
    { x:0,y:1 },{ x:1,y:1 },{ x:2,y:1 },{ x:3,y:1 },{ x:4,y:1 },{ x:5,y:1 },
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },{ x:3,y:2 },{ x:4,y:2 },{ x:5,y:2 },
    { x:0,y:4 },{ x:1,y:4 },{ x:2,y:4 },{ x:3,y:4 },{ x:4,y:4 },{ x:5,y:4 },
    { x:0,y:5 },{ x:1,y:5 },{ x:2,y:5 },{ x:3,y:5 },{ x:4,y:5 },{ x:5,y:5 },
  ],
  max_blocks: 7,
  available_blocks: ["robot_move"],
  title: "Niveau 2 — Le grand couloir",
  instructions: "Le couloir est plus long ! Compte bien les cases avant de placer tes blocs Avancer.",
  steps: [
    "Compte les cases entre Kirikou et l'étoile ⭐",
    "Place exactement le bon nombre de blocs Avancer",
    "Trop peu → Kirikou s'arrête avant. Trop → il fonce dans le mur !",
  ],
};

// Labyrinthe 3 — 6×6 avec ouvertures latérales (robot_move seulement)
// Le labyrinthe SEMBLE complexe (couloirs ouverts en haut et en bas)
// mais Kirikou ne peut qu'Avancer — il suit son couloir central.
// Leçon : un bloc disponible = un seul comportement possible.
// Solution : Avancer×5
//
//   x:  0  1  2  3  4  5
// y=0:  W  W  W  W  W  W
// y=1:  W  .  .  .  .  W   ← couloir leurre (ouvert mais inaccessible)
// y=2:  W  W  W  W  .  W
// y=3:  K  .  .  .  .  *   ← vrai chemin
// y=4:  W  W  .  W  W  W
// y=5:  W  W  W  W  W  W
const MAZE_3 = {
  grid_size: 6,
  start: { x: 0, y: 3, dir: "E" },
  goal:  { x: 5, y: 3 },
  walls: [
    // y=0 — tout fermé
    { x:0,y:0 },{ x:1,y:0 },{ x:2,y:0 },{ x:3,y:0 },{ x:4,y:0 },{ x:5,y:0 },
    // y=1 — ouvert au milieu (leurre visuel)
    { x:0,y:1 },{ x:5,y:1 },
    // y=2 — fermé sauf (4,2) qui connecte visuellement y=1 et y=3
    { x:0,y:2 },{ x:1,y:2 },{ x:2,y:2 },{ x:3,y:2 },{ x:5,y:2 },
    // y=3 — chemin libre (départ + arrivée)
    // y=4 — ouvert en (2,4) (leurre visuel)
    { x:0,y:4 },{ x:1,y:4 },{ x:3,y:4 },{ x:4,y:4 },{ x:5,y:4 },
    // y=5 — tout fermé
    { x:0,y:5 },{ x:1,y:5 },{ x:2,y:5 },{ x:3,y:5 },{ x:4,y:5 },{ x:5,y:5 },
  ],
  max_blocks: 7,
  available_blocks: ["robot_move"],
  title: "Niveau 3 — Le labyrinthe piège 🌟",
  instructions: "Ce labyrinthe a l'air compliqué... mais tu n'as que le bloc Avancer ! Kirikou peut-il quand même atteindre l'étoile ?",
  steps: [
    "Observe bien le labyrinthe — il semble complexe !",
    "Mais Kirikou ne peut qu'Avancer vers la droite",
    "Compte les cases sur sa ligne et place tes blocs",
  ],
};

// ── Blocs de la leçon enrichie ──────────────────────────────────────────────

const BLOCKS = [
  // ── 0 : Intro motivation (ORIGINAL amélioré) ──────────────────────────────
  {
    type: "text", order_index: 0,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:22px 26px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.3em">🤖 Bienvenue, Architecte en herbe !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Est-ce que tu as déjà essayé d'expliquer à quelqu'un comment rentrer chez toi ? Sans carte, sans téléphone — juste avec des mots ?</p>
  <p style="color:#cbd5e1;margin:0 0 10px">Ce que tu faisais s'appelle <strong style="color:#FDB813">créer un algorithme</strong>. Et c'est exactement ce que font les programmeurs tous les jours pour créer des jeux, des applications, des robots !</p>
  <p style="color:#94a3b8;margin:0;font-size:0.95em">🎯 Dans cette séance, tu vas apprendre ce qu'est un algorithme — et en créer un vrai pour guider un robot dans un labyrinthe.</p>
</div>
` }
  },

  // ── 1 : Vidéo — algo pour les enfants ─────────────────────────────────────
  {
    type: "text", order_index: 1,
    content: { html: `
<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:4px">
  <h3 style="color:#60a5fa;margin:0 0 12px">🎬 Regarde d'abord cette petite vidéo !</h3>
  <p style="color:#94a3b8;margin:0 0 14px">Elle te montre en 2 minutes ce qu'est un algorithme — avec des exemples de la vraie vie. C'est en français et super court !</p>
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;background:#0f172a">
    <iframe
      src="https://www.youtube.com/embed/PzJMFDhwNKc"
      title="C'est quoi un algorithme ?"
      style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:10px"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
  <p style="color:#475569;margin:12px 0 0;font-size:0.85em">💡 Si la vidéo ne s'affiche pas, <a href="https://www.youtube.com/watch?v=PzJMFDhwNKc" target="_blank" style="color:#60a5fa">clique ici pour la voir sur YouTube</a>.</p>
</div>
` }
  },

  // ── 2 : Définition algo (ORIGINAL conservé) ───────────────────────────────
  {
    type: "text", order_index: 2,
    content: { html: `
<h2 style="color:#60a5fa;margin-top:0">🧠 C'est quoi un algorithme ?</h2>
<p style="color:#cbd5e1">Un <strong style="color:#FDB813">algorithme</strong>, c'est une liste d'instructions précises qu'on donne à quelqu'un (ou à un ordinateur) pour résoudre un problème.</p>
<p style="color:#cbd5e1">Imagine que tu veux faire un sandwich :</p>
<ol style="color:#94a3b8;padding-left:20px">
  <li>Prendre deux tranches de pain</li>
  <li>Étaler du beurre sur l'une d'elles</li>
  <li>Ajouter du fromage</li>
  <li>Fermer le sandwich</li>
</ol>
<p style="color:#cbd5e1">C'est un algorithme ! Les étapes sont dans l'ordre, elles sont précises, et si tu les suis, tu obtiens un sandwich.</p>

<div style="background:#1e293b;border-left:4px solid #FDB813;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:14px">
  <p style="color:#fbbf24;margin:0;font-weight:bold">📌 À retenir</p>
  <p style="color:#94a3b8;margin:6px 0 0">Un algorithme a toujours :
    <br/>✦ un <strong style="color:#cbd5e1">début</strong> et une <strong style="color:#cbd5e1">fin</strong>
    <br/>✦ des instructions dans un <strong style="color:#cbd5e1">ordre précis</strong>
    <br/>✦ un <strong style="color:#cbd5e1">résultat</strong> attendu
  </p>
</div>

<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:14px 18px;margin-top:14px">
  <p style="color:#60a5fa;margin:0 0 8px;font-weight:bold">🔬 Exemples de ta vie quotidienne</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0">
    <li>La recette de ton plat préféré</li>
    <li>Les règles d'un jeu de société</li>
    <li>Les étapes pour attacher tes lacets</li>
    <li>Le chemin pour aller à l'école</li>
  </ul>
  <p style="color:#475569;margin:10px 0 0;font-size:0.9em">Tous ces "modes d'emploi" sont des algorithmes — ils existaient bien avant les ordinateurs !</p>
</div>
` }
  },

  // ── 3 : Quiz 1 — définition algorithme (ORIGINAL + 2 nouvelles questions) ─
  {
    type: "quiz", order_index: 3,
    content: {
      questions: [
        {
          id: "q1",
          question: "Un algorithme, c'est…",
          type: "mcq",
          choices: [
            "Une suite d'instructions précises pour résoudre un problème",
            "Un type de robot très intelligent",
            "Un bug dans un programme",
          ],
          answer: 0,
          explanation: "Exactement ! Un algorithme est une liste d'instructions claires et ordonnées pour résoudre un problème — comme une recette de cuisine.",
        },
        {
          id: "q2",
          question: "Laquelle de ces listes est un algorithme ?",
          type: "mcq",
          choices: [
            "1. Prendre une casserole 2. Remplir d'eau 3. Chauffer 4. Ajouter les pâtes",
            "Faire cuire des pâtes (c'est facile !)",
            "Pâtes, eau, sel, chaleur",
          ],
          answer: 0,
          explanation: "La première liste donne des instructions dans l'ordre — c'est un algorithme ! Les deux autres ne sont pas assez précises.",
        },
        {
          id: "q3",
          question: "Les algorithmes ont été inventés par les ordinateurs ?",
          type: "mcq",
          choices: [
            "Non, ils existaient bien avant les ordinateurs",
            "Oui, c'est une invention du 20e siècle",
            "Ça dépend du type d'algorithme",
          ],
          answer: 0,
          explanation: "Les algorithmes existent depuis des millénaires ! Les mathématiciens arabes du 9e siècle utilisaient déjà des algorithmes pour résoudre des équations. Les ordinateurs les exécutent très vite, mais ne les ont pas inventés.",
        },
      ],
    },
  },

  // ── 4 : La précision c'est tout (NOUVEAU) ─────────────────────────────────
  {
    type: "text", order_index: 4,
    content: { html: `
<h2 style="color:#a78bfa;margin-top:0">🎯 La précision, c'est TOUT !</h2>
<p style="color:#cbd5e1">Il y a un truc super important avec les algorithmes : chaque instruction doit être <strong style="color:#a78bfa">ultra précise</strong>.</p>
<p style="color:#cbd5e1">Imagine que tu demandes à un robot de t'amener un verre d'eau. Tu lui dis :</p>
<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#f87171;margin:0;font-style:italic">"Va chercher de l'eau."</p>
</div>
<p style="color:#cbd5e1">Le robot part... et revient avec un seau entier d'eau qu'il renverse sur toi ! 💦</p>
<p style="color:#cbd5e1">Le robot a <strong style="color:#FDB813">suivi l'instruction à la lettre</strong>. Mais l'instruction n'était pas assez précise !</p>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #a78bfa40;border-radius:12px;padding:16px 20px;margin-top:14px">
  <h3 style="color:#a78bfa;margin:0 0 10px;font-size:1em">✅ La bonne version :</h3>
  <ol style="color:#c4b5fd;padding-left:18px;margin:0">
    <li>Va dans la cuisine</li>
    <li>Prends un verre dans le placard du haut</li>
    <li>Ouvre le robinet</li>
    <li>Remplis le verre aux trois quarts</li>
    <li>Ferme le robinet</li>
    <li>Reviens me l'apporter</li>
  </ol>
</div>

<div style="background:#0f172a;border-left:4px solid #a78bfa;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:14px">
  <p style="color:#a78bfa;margin:0 0 6px;font-weight:bold">💡 Règle d'or</p>
  <p style="color:#94a3b8;margin:0">Un ordinateur (ou un robot) fait <strong style="color:#cbd5e1">exactement</strong> ce qu'on lui dit — pas plus, pas moins. C'est toi le chef ! Si le résultat est bizarre, c'est que l'algorithme n'est pas assez précis.</p>
</div>
` }
  },

  // ── 5 : Quiz 2 — la précision (NOUVEAU) ────────────────────────────────────
  {
    type: "quiz", order_index: 5,
    content: {
      questions: [
        {
          id: "q_prec_1",
          question: "Tu demandes à un robot : \"Fais quelque chose de bien.\". Que va-t-il faire ?",
          type: "mcq",
          choices: [
            "Il ne sait pas — l'instruction est trop vague",
            "Il va deviner ce qui te ferait plaisir",
            "Il va faire la meilleure action possible",
          ],
          answer: 0,
          explanation: "Un robot ne peut pas deviner. Il a besoin d'instructions précises. \"Fais quelque chose de bien\" ne veut rien dire pour une machine !",
        },
        {
          id: "q_prec_2",
          question: "Parmi ces instructions pour aller à l'école, laquelle est assez précise pour un robot ?",
          type: "mcq",
          choices: [
            "Avance de 50 mètres, tourne à gauche, continue 200 mètres, entre par la porte principale",
            "Va à l'école",
            "C'est pas loin, tu verras bien",
          ],
          answer: 0,
          explanation: "\"Va à l'école\" et \"tu verras bien\" ne donnent aucune indication concrète à un robot. Il faut des distances, des directions, des points de repère précis.",
        },
        {
          id: "q_prec_3",
          question: "Si un robot fait une erreur, qui est responsable ?",
          type: "mcq",
          choices: [
            "Le programmeur qui a écrit l'algorithme",
            "Le robot qui a mal exécuté",
            "Les deux à égalité",
          ],
          answer: 0,
          explanation: "Le robot exécute toujours fidèlement ce qu'on lui demande. Si le résultat est mauvais, c'est que l'algorithme avait une erreur — c'est le programmeur qui doit le corriger !",
        },
      ],
    },
  },

  // ── 6 : Le robot obéit (ORIGINAL conservé) ───────────────────────────────
  {
    type: "text", order_index: 6,
    content: { html: `
<h2 style="color:#f97316;margin-top:0">🤖 Le robot obéit... à la lettre !</h2>
<p style="color:#cbd5e1">Dans ce cours, tu vas programmer un robot qui s'appelle <strong style="color:#FDB813">Kirikou</strong>. Il vit dans un labyrinthe et doit trouver la sortie.</p>
<p style="color:#cbd5e1">Kirikou comprend exactement <strong style="color:#f97316">3 instructions</strong> :</p>

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0">
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;text-align:center">
    <div style="font-size:1.8em">🚀</div>
    <div style="color:#FDB813;font-weight:bold;margin:4px 0">Avancer</div>
    <div style="color:#475569;font-size:0.85em">Kirikou avance d'une case dans la direction où il regarde</div>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;text-align:center">
    <div style="font-size:1.8em">↰</div>
    <div style="color:#60a5fa;font-weight:bold;margin:4px 0">Tourner à gauche</div>
    <div style="color:#475569;font-size:0.85em">Kirikou pivote de 90° vers la gauche (sans bouger)</div>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;text-align:center">
    <div style="font-size:1.8em">↱</div>
    <div style="color:#a78bfa;font-weight:bold;margin:4px 0">Tourner à droite</div>
    <div style="color:#475569;font-size:0.85em">Kirikou pivote de 90° vers la droite (sans bouger)</div>
  </div>
</div>

<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 18px;margin-top:4px">
  <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">⚠️ Points importants</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0">
    <li>Kirikou ne peut pas passer à travers les murs</li>
    <li>Tourner ne le fait <strong style="color:#cbd5e1">pas bouger</strong> — ça change juste sa direction</li>
    <li>Il faut utiliser les blocs dans le <strong style="color:#cbd5e1">bon ordre</strong></li>
    <li>Si tu te trompes, tu peux <strong style="color:#cbd5e1">tout effacer et recommencer</strong></li>
  </ul>
</div>
` }
  },

  // ── 7 : Quiz 3 — le robot et les murs ────────────────────────────────────
  {
    type: "quiz", order_index: 7,
    content: {
      questions: [
        {
          id: "q_robot_1",
          question: "Kirikou est face à un mur. Que se passe-t-il si tu lui dis d'Avancer ?",
          type: "mcq",
          choices: [
            "Il reste bloqué — on ne peut pas traverser les murs !",
            "Il traverse le mur",
            "Il fait demi-tour automatiquement",
          ],
          answer: 0,
          explanation: "Kirikou obéit aux règles du labyrinthe. Un mur reste un mur ! Le robot exécute l'instruction, mais le mur l'empêche de bouger.",
        },
        {
          id: "q_robot_2",
          question: "Kirikou a 3 blocs Avancer dans son programme. Le couloir devant lui fait 5 cases. Où s'arrête-t-il ?",
          type: "mcq",
          choices: [
            "À la 3ème case — il fait exactement ce qu'on lui a dit",
            "À la 5ème case — il va jusqu'au bout du couloir",
            "Il ne bouge pas du tout",
          ],
          answer: 0,
          explanation: "3 blocs = 3 cases, point final. Kirikou ne \"devine\" pas qu'il doit continuer. Il exécute fidèlement les 3 instructions et s'arrête.",
        },
        {
          id: "q_robot_3",
          question: "Tu veux que Kirikou avance de 6 cases. Combien de blocs Avancer faut-il placer ?",
          type: "mcq",
          choices: ["6 blocs Avancer", "1 bloc suffit", "3 blocs (il fait le reste seul)"],
          answer: 0,
          explanation: "1 bloc Avancer = 1 case, toujours. Pour 6 cases, il faut 6 blocs. Pas de raccourci — c'est la précision qui fait la force d'un algorithme !",
        },
      ],
    },
  },

  // ── 8 : Intro labyrinthe niveau 1 (ORIGINAL revu) ─────────────────────────
  {
    type: "text", order_index: 8,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e1f3b);border:1px solid #3b82f640;border-radius:14px;padding:20px 24px">
  <h2 style="color:#60a5fa;margin:0 0 12px">🗺️ C'est l'heure du labyrinthe !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Kirikou est coincé dans un labyrinthe. Il compte sur toi pour le guider jusqu'à l'étoile ⭐</p>
  <p style="color:#94a3b8;margin:0 0 10px">Pour ce <strong style="color:#60a5fa">premier niveau</strong>, tu n'as besoin que d'un seul bloc :</p>
  <div style="background:#0f172a;border-radius:10px;padding:12px 16px;margin-bottom:10px">
    <span style="color:#FDB813;font-weight:bold;font-size:1.1em">🚀 Avancer</span>
    <span style="color:#475569;font-size:0.9em;margin-left:10px">— fait avancer Kirikou d'une case</span>
  </div>
  <p style="color:#475569;margin:0;font-size:0.9em">💡 Kirikou regarde déjà dans la bonne direction. Compte les cases entre lui et l'étoile, et ajoute le bon nombre de blocs !</p>
</div>
` }
  },

  // ── 9 : GAME — Labyrinthe niveau 1 (ORIGINAL) ────────────────────────────
  {
    type: "game", order_index: 9,
    content: MAZE_1,
  },

  // ── 10 : Compter les cases — la clé de la précision ──────────────────────
  {
    type: "text", order_index: 10,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1f1535);border:1px solid #a78bfa40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#a78bfa;margin:0 0 10px">🔢 Compter les cases — la clé de la précision !</h2>
  <p style="color:#cbd5e1;margin:0 0 12px">Tu as réussi le premier couloir. Maintenant le labyrinthe est <strong style="color:#a78bfa">plus long</strong>. La difficulté ? Compter juste !</p>

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">📐 Rappel essentiel</p>
    <ul style="color:#94a3b8;padding-left:18px;margin:0;line-height:1.9">
      <li>1 bloc <strong style="color:#FDB813">Avancer</strong> = exactement <strong style="color:#FDB813">1 case</strong></li>
      <li>Trop peu de blocs → Kirikou s'arrête <strong style="color:#f87171">avant</strong> l'étoile ⭐</li>
      <li>Trop de blocs → Kirikou fonce dans <strong style="color:#f87171">le mur</strong> 💥</li>
    </ul>
  </div>

  <div style="background:#0f172a;border-left:4px solid #a78bfa;padding:12px 16px;border-radius:0 8px 8px 0">
    <p style="color:#a78bfa;margin:0 0 6px;font-weight:bold">💡 Technique de comptage</p>
    <p style="color:#94a3b8;margin:0">Pose le doigt sur Kirikou. Déplace-le case par case vers l'étoile en comptant à voix haute : <em style="color:#cbd5e1">"1, 2, 3…"</em>. Le chiffre final = le nombre de blocs Avancer à placer.</p>
  </div>
</div>
` }
  },

  // ── 11 : GAME — Labyrinthe niveau 2 (couloir long, robot_move) ────────────
  {
    type: "game", order_index: 11,
    content: MAZE_2,
  },

  // ── 12 : Intro niveau 3 — le labyrinthe piège ────────────────────────────
  {
    type: "text", order_index: 12,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1a2f0f);border:1px solid #22c55e40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#4ade80;margin:0 0 10px">🏆 Défi Bonus — Le labyrinthe qui fait peur !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Ce labyrinthe a l'air très compliqué. Plein de couloirs, des ouvertures partout… <strong style="color:#4ade80">Mais ne te laisse pas impressionner !</strong></p>
  <div style="background:#0f172a;border:1px solid #22c55e30;border-radius:10px;padding:12px 16px;margin:12px 0">
    <p style="color:#86efac;margin:0 0 8px;font-weight:bold">🧠 Le secret de ce niveau</p>
    <p style="color:#94a3b8;margin:0 0 6px">Tu n'as toujours que le bloc <strong style="color:#FDB813">Avancer</strong>. Kirikou ne peut pas s'éloigner de sa ligne — il avance tout droit, c'est tout.</p>
    <p style="color:#94a3b8;margin:0">Même si le labyrinthe semble complexe, la solution reste simple : <strong style="color:#cbd5e1">compte les cases sur la ligne de Kirikou et avance !</strong></p>
  </div>
  <p style="color:#475569;margin:0;font-size:0.9em">🎖️ Ce niveau t'apprend une leçon importante : les programmeurs ne se laissent pas impressionner par la complexité apparente. Ils se concentrent sur ce qu'ils <em>peuvent</em> faire !</p>
</div>
` }
  },

  // ── 13 : GAME — Labyrinthe niveau 3 piège (robot_move) ──────────────────
  {
    type: "game", order_index: 13,
    content: MAZE_3,
  },

  // ── 14 : Quiz final — 5 questions de clôture (NOUVEAU) ────────────────────
  {
    type: "quiz", order_index: 14,
    content: {
      questions: [
        {
          id: "q_final_1",
          question: "Dans un algorithme, l'ordre des instructions est important ?",
          type: "mcq",
          choices: [
            "Oui, changer l'ordre change le résultat",
            "Non, les instructions peuvent être dans n'importe quel ordre",
            "Seulement pour les robots",
          ],
          answer: 0,
          explanation: "L'ordre est CRUCIAL. \"Mettre du beurre, puis manger le pain\" donne un résultat différent de \"manger le pain, puis mettre du beurre\" !",
        },
        {
          id: "q_final_2",
          question: "Qu'est-ce qu'une SÉQUENCE en programmation ?",
          type: "mcq",
          choices: [
            "Des instructions exécutées une par une, dans l'ordre",
            "Un type de boucle qui se répète",
            "Une erreur dans le code",
          ],
          answer: 0,
          explanation: "Une séquence, c'est simplement des instructions exécutées l'une après l'autre. C'est la base de tout programme — même les jeux vidéo les plus complexes utilisent des séquences !",
        },
        {
          id: "q_final_3",
          question: "Kirikou a 10 cases à parcourir. Tu places 7 blocs Avancer. Que se passe-t-il ?",
          type: "mcq",
          choices: [
            "Kirikou s'arrête 3 cases avant l'étoile",
            "Kirikou atteint l'étoile quand même",
            "Kirikou fait demi-tour automatiquement",
          ],
          answer: 0,
          explanation: "7 blocs Avancer = 7 cases parcourues, pas plus. Kirikou s'immobilise à la 7ème case. Il ne devine pas qu'il faut continuer — il fait exactement ce qu'on lui a dit !",
        },
        {
          id: "q_final_4",
          question: "Qu'est-ce qui fait qu'un algorithme est \"bon\" ?",
          type: "mcq",
          choices: [
            "Il est précis, dans le bon ordre, et atteint le but",
            "Il est le plus long possible",
            "Il est difficile à comprendre",
          ],
          answer: 0,
          explanation: "Un bon algorithme résout le problème avec des instructions claires et ordonnées. Un algorithme court et efficace est même meilleur qu'un long !",
        },
        {
          id: "q_final_5",
          question: "Kirikou doit avancer de 5 cases. Laquelle de ces séquences est correcte ?",
          type: "mcq",
          choices: [
            "Avancer, Avancer, Avancer, Avancer, Avancer (5 fois)",
            "Avancer (1 fois suffit, il ira jusqu'au bout)",
            "Avancer, Avancer, Avancer (3 fois, puis il continue seul)",
          ],
          answer: 0,
          explanation: "Kirikou ne fait que ce qu'on lui dit, rien de plus. Il faut exactement 5 blocs Avancer pour 5 cases. Il ne continue pas \"tout seul\" — chaque case = un bloc !",
        },
      ],
    },
  },

  // ── 15 : Conclusion enrichie (REMPLACE l'ancienne) ────────────────────────
  {
    type: "text", order_index: 15,
    content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:14px;padding:22px 26px;margin-bottom:16px">
  <h2 style="color:#4ade80;margin:0 0 12px;font-size:1.3em">🏆 Mission accomplie, Architecte !</h2>
  <p style="color:#86efac;margin:0 0 10px">C'est exactement ce que font les développeurs professionnels tous les jours : décomposer un problème en petites étapes claires, une par une.</p>
  <p style="color:#86efac;margin:0">Et toi, tu viens de le faire — avec un vrai labyrinthe, un vrai robot, et de vraies instructions !</p>
</div>

<div style="background:#1e293b;border-radius:12px;padding:18px 22px;margin-bottom:16px">
  <h3 style="color:#FDB813;margin:0 0 12px;font-size:1em">📚 Ce que tu as appris aujourd'hui :</h3>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Un <strong style="color:#FDB813">algorithme</strong> est une suite d'instructions précises et ordonnées</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">La <strong style="color:#a78bfa">précision</strong> est essentielle — un robot fait exactement ce qu'on lui dit</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Une <strong style="color:#60a5fa">séquence</strong> = des instructions dans le bon ordre</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Comment guider un robot avec <strong>Avancer</strong>, <strong>Tourner à gauche</strong> et <strong>Tourner à droite</strong></span>
    </div>
  </div>
</div>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #60a5fa40;border-radius:12px;padding:16px 20px">
  <h3 style="color:#60a5fa;margin:0 0 10px;font-size:1em">🔭 La prochaine fois...</h3>
  <p style="color:#94a3b8;margin:0 0 8px">Dans la <strong style="color:#cbd5e1">Séance 2</strong>, les labyrinthes vont devenir encore plus complexes. Tu vas apprendre à :</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0">
    <li>Faire des virages dans toutes les directions</li>
    <li>Résoudre des labyrinthes avec plusieurs couloirs</li>
    <li>Commencer à lire une carte comme un vrai programmeur</li>
  </ul>
  <p style="color:#475569;margin:12px 0 0;font-size:0.9em">🏅 Pense à compléter tes <strong style="color:#cbd5e1">entraînements</strong> pour gagner des XP et consolider ce que tu as appris !</p>
</div>
` }
  },
];

async function main() {
  console.log("🔄 Enrichissement de la Séance 1 — Mon premier algorithme");
  console.log(`📌 Lesson ID : ${LESSON_ID}`);
  console.log("");

  // Supprimer les anciens blocs
  const { data: existing, error: fetchErr } = await supabase
    .from("lesson_blocks")
    .select("id")
    .eq("lesson_id", LESSON_ID);

  if (fetchErr) { console.error("❌ Impossible de lire les blocs :", fetchErr); process.exit(1); }

  if (existing?.length) {
    const { error: delErr } = await supabase
      .from("lesson_blocks")
      .delete()
      .eq("lesson_id", LESSON_ID);
    if (delErr) { console.error("❌ Impossible de supprimer les blocs :", delErr); process.exit(1); }
    console.log(`🗑️  ${existing.length} bloc(s) supprimé(s)`);
  }

  // Insérer les nouveaux blocs
  const rows = BLOCKS.map((b) => ({ ...b, lesson_id: LESSON_ID, theme_id: THEME_ID }));

  const { error: insertErr } = await supabase
    .from("lesson_blocks")
    .insert(rows);

  if (insertErr) {
    console.error("❌ Erreur insertion :", insertErr);
    process.exit(1);
  }

  console.log(`✅ ${BLOCKS.length} blocs insérés avec succès !\n`);
  console.log("📋 Structure de la leçon enrichie :");
  BLOCKS.forEach((b) => {
    const label = b.type === "game"
      ? `GAME  — ${(b.content as any).title}`
      : b.type === "quiz"
      ? `QUIZ  — ${(b.content as any).questions?.length} question(s)`
      : `TEXT  — bloc ${b.order_index}`;
    console.log(`  [${String(b.order_index).padStart(2, "0")}] ${label}`);
  });

  console.log("\n🎉 Séance 1 enrichie ! Durée estimée : ~55-60 min pour les 8-12 ans.");
}

main().catch(console.error);
