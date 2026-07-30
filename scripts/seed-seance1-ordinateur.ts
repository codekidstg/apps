/**
 * Seed — Séance 1 "L'ordinateur, la machine magique"
 * + Décalage des chapitres existants (Séance 1→2, 2→3, …, 6→7)
 *
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-seance1-ordinateur.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const THEME_ID = "8979e87c-058c-4003-95fd-1531c649bd1d"; // Je guide un robot dans un labyrinthe

// ── IDs chapitres existants à décaler ─────────────────────────────────────────
// (récupérés via la DB : order_index 0-5)
const EXISTING_CHAPTERS = [
  { id: "26715551-0a7e-4b07-9677-5790458ce4e6", newTitle: "Séance 2 — Mon premier algorithme",        newOrder: 1 },
  { id: "ab1b49f3-54fd-48c7-bedc-202fbb3a9921", newTitle: "Séance 3 — Les virages",                   newOrder: 2 },
  { id: "97a4527f-852a-41b2-b46d-b2e1e4d534ac", newTitle: "Séance 4 — Le débogage",                   newOrder: 3 },
  { id: "9b31a8d5-dd7d-429d-a7a3-d2b50bf9a",    newTitle: "Séance 5 — L'ordre compte !",              newOrder: 4 },
  { id: "855cce96-99a9-45cb-94b9-2d668fa25ae0", newTitle: "Séance 6 — Répéter au lieu de copier",     newOrder: 5 },
  { id: "4688cee4-f135-438b-9949-c046c565a953", newTitle: "Séance 7 — Planifier comme un ingénieur",  newOrder: 6 },
];

// ── Contenu de la nouvelle leçon ──────────────────────────────────────────────

const BLOCKS = (lessonId: string, themeId: string) => [

  // ── 0 : Accroche ─────────────────────────────────────────────────────────────
  {
    type: "text", order_index: 0, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:22px 26px">
  <h2 style="color:#FDB813;margin:0 0 12px;font-size:1.3em">🤖 Séance 1 — L'ordinateur, la machine magique !</h2>
  <p style="color:#cbd5e1;margin:0 0 10px">Est-ce que tu utilises un ordinateur en ce moment ? <strong style="color:#FDB813">Bien sûr !</strong> Mais tu en utilises sûrement d'autres sans t'en rendre compte…</p>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:14px 0">
    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:1.4em">📱</span><span style="color:#cbd5e1;font-size:0.9em">Ton smartphone</span>
    </div>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:1.4em">🎮</span><span style="color:#cbd5e1;font-size:0.9em">Ta console de jeux</span>
    </div>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:1.4em">🚦</span><span style="color:#cbd5e1;font-size:0.9em">Les feux de circulation</span>
    </div>
    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:8px">
      <span style="font-size:1.4em">🏧</span><span style="color:#cbd5e1;font-size:0.9em">Le distributeur de billets</span>
    </div>
  </div>
  <p style="color:#94a3b8;margin:0;font-size:0.95em">🎯 Aujourd'hui tu vas découvrir <strong style="color:#FDB813">ce qu'est vraiment un ordinateur</strong>, comment il fonctionne, et pourquoi c'est un outil si puissant.</p>
</div>
` },
  },

  // ── 1 : Vidéo ────────────────────────────────────────────────────────────────
  {
    type: "video", order_index: 1, lesson_id: lessonId, theme_id: themeId,
    content: {
      url: "https://www.youtube.com/watch?v=AkFi90lZmXA",
      title: "C'est quoi un ordinateur ? — Vidéo pour les enfants",
    },
  },

  // ── 2 : Quiz — est-ce un ordinateur ? ────────────────────────────────────────
  {
    type: "quiz", order_index: 2, lesson_id: lessonId, theme_id: themeId,
    content: {
      questions: [
        {
          id: "q_ordi_1",
          question: "Un smartphone, c'est un ordinateur ?",
          type: "mcq",
          choices: ["Oui, c'est un mini-ordinateur dans ta poche !", "Non, c'est juste un téléphone", "Ça dépend de la marque"],
          answer: 0,
          explanation: "Un smartphone est un vrai ordinateur — il a un processeur, de la mémoire, un écran, et exécute des programmes (tes applications). Il est juste plus petit qu'un PC !",
        },
        {
          id: "q_ordi_2",
          question: "Laquelle de ces machines est un ordinateur ?",
          type: "mcq",
          choices: ["Une calculatrice scientifique", "Un grille-pain classique", "Un marteau"],
          answer: 0,
          explanation: "Une calculatrice scientifique reçoit des données (les chiffres), les traite (calculs), et affiche un résultat — c'est la définition d'un ordinateur !",
        },
        {
          id: "q_ordi_3",
          question: "Les feux de circulation sont-ils pilotés par un ordinateur ?",
          type: "mcq",
          choices: ["Oui — un programme décide quand passer au vert ou au rouge", "Non — c'est une minuterie mécanique", "Parfois, selon la ville"],
          answer: 0,
          explanation: "Les feux modernes sont connectés à un système informatique qui analyse le trafic et adapte les durées en temps réel. Un vrai ordinateur caché dans la rue !",
        },
      ],
    },
  },

  // ── 3 : C'est quoi un ordinateur ? ───────────────────────────────────────────
  {
    type: "text", order_index: 3, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<h2 style="color:#60a5fa;margin-top:0">🖥️ C'est quoi un ordinateur ?</h2>
<p style="color:#cbd5e1">Un ordinateur, c'est une machine qui fait <strong style="color:#60a5fa">trois choses</strong> :</p>

<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0">
  <div style="display:flex;align-items:flex-start;gap:14px;background:#1e293b;border-radius:10px;padding:14px">
    <div style="width:36px;height:36px;border-radius:50%;background:#60a5fa20;border:2px solid #60a5fa60;display:flex;align-items:center;justify-content:center;color:#60a5fa;font-weight:black;font-size:1.1em;flex-shrink:0">1</div>
    <div>
      <div style="color:#60a5fa;font-weight:bold">Recevoir des informations</div>
      <div style="color:#475569;font-size:0.9em;margin-top:3px">Via le clavier, la souris, la caméra, un capteur… c'est ce qu'on appelle les <strong style="color:#cbd5e1">entrées</strong>.</div>
    </div>
  </div>
  <div style="display:flex;align-items:flex-start;gap:14px;background:#1e293b;border-radius:10px;padding:14px">
    <div style="width:36px;height:36px;border-radius:50%;background:#FDB81320;border:2px solid #FDB81360;display:flex;align-items:center;justify-content:center;color:#FDB813;font-weight:black;font-size:1.1em;flex-shrink:0">2</div>
    <div>
      <div style="color:#FDB813;font-weight:bold">Traiter ces informations</div>
      <div style="color:#475569;font-size:0.9em;margin-top:3px">Il exécute les instructions qu'on lui a données — les <strong style="color:#cbd5e1">programmes</strong>. C'est ça, le calcul.</div>
    </div>
  </div>
  <div style="display:flex;align-items:flex-start;gap:14px;background:#1e293b;border-radius:10px;padding:14px">
    <div style="width:36px;height:36px;border-radius:50%;background:#10b98120;border:2px solid #10b98160;display:flex;align-items:center;justify-content:center;color:#10b981;font-weight:black;font-size:1.1em;flex-shrink:0">3</div>
    <div>
      <div style="color:#10b981;font-weight:bold">Produire un résultat</div>
      <div style="color:#475569;font-size:0.9em;margin-top:3px">Il affiche, joue, imprime ou envoie — c'est ce qu'on appelle les <strong style="color:#cbd5e1">sorties</strong>.</div>
    </div>
  </div>
</div>

<div style="background:#0f172a;border-left:4px solid #60a5fa;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:4px">
  <p style="color:#60a5fa;margin:0 0 4px;font-weight:bold">💡 La définition en une phrase</p>
  <p style="color:#94a3b8;margin:0">Un ordinateur est une machine qui <strong style="color:#cbd5e1">reçoit</strong> des informations, les <strong style="color:#cbd5e1">traite</strong> selon des instructions, et produit un <strong style="color:#cbd5e1">résultat</strong>.</p>
</div>
` },
  },

  // ── 4 : Les composants ────────────────────────────────────────────────────────
  {
    type: "text", order_index: 4, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<h2 style="color:#a78bfa;margin-top:0">🔧 Les composants — le corps de l'ordinateur</h2>
<p style="color:#cbd5e1;margin-bottom:16px">Un ordinateur, c'est comme un corps humain — chaque partie a un rôle précis. Voici les pièces principales :</p>

<div style="display:flex;flex-direction:column;gap:10px">
  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:16px">
    <span style="font-size:2em;flex-shrink:0">🧠</span>
    <div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="color:#FDB813;font-weight:bold">Processeur (CPU)</span>
        <span style="color:#334155;font-size:0.8em">=</span>
        <span style="color:#94a3b8;font-size:0.9em">le cerveau</span>
      </div>
      <div style="color:#475569;font-size:0.85em;margin-top:3px">Il exécute les calculs et les instructions. Plus il est rapide, plus l'ordinateur est puissant.</div>
    </div>
  </div>

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:16px">
    <span style="font-size:2em;flex-shrink:0">📋</span>
    <div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="color:#60a5fa;font-weight:bold">Mémoire RAM</span>
        <span style="color:#334155;font-size:0.8em">=</span>
        <span style="color:#94a3b8;font-size:0.9em">le bureau de travail</span>
      </div>
      <div style="color:#475569;font-size:0.85em;margin-top:3px">Elle garde les programmes ouverts en ce moment. Si tu éteinds l'ordi, le bureau est vidé !</div>
    </div>
  </div>

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:16px">
    <span style="font-size:2em;flex-shrink:0">🎒</span>
    <div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="color:#4ade80;font-weight:bold">Disque dur / SSD</span>
        <span style="color:#334155;font-size:0.8em">=</span>
        <span style="color:#94a3b8;font-size:0.9em">le sac à dos</span>
      </div>
      <div style="color:#475569;font-size:0.85em;margin-top:3px">Il stocke tes fichiers, photos et applications en permanence — même quand l'ordi est éteint.</div>
    </div>
  </div>

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:16px">
    <span style="font-size:2em;flex-shrink:0">🖥️</span>
    <div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="color:#f97316;font-weight:bold">Écran</span>
        <span style="color:#334155;font-size:0.8em">=</span>
        <span style="color:#94a3b8;font-size:0.9em">la bouche</span>
      </div>
      <div style="color:#475569;font-size:0.85em;margin-top:3px">Il affiche le résultat du travail de l'ordinateur — c'est une sortie.</div>
    </div>
  </div>

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:16px">
    <span style="font-size:2em;flex-shrink:0">⌨️</span>
    <div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="color:#a78bfa;font-weight:bold">Clavier / Souris</span>
        <span style="color:#334155;font-size:0.8em">=</span>
        <span style="color:#94a3b8;font-size:0.9em">les mains</span>
      </div>
      <div style="color:#475569;font-size:0.85em;margin-top:3px">Ils envoient tes commandes à l'ordinateur — ce sont des entrées.</div>
    </div>
  </div>
</div>
` },
  },

  // ── 5 : GAME — Memory composants ──────────────────────────────────────────────
  {
    type: "game", order_index: 5, lesson_id: lessonId, theme_id: themeId,
    content: {
      game_type: "memory",
      title: "Associe chaque composant à son rôle",
      description: "Retourne deux cartes — si elles forment une paire, elles restent visibles ! Trouve les 5 paires.",
      pairs: [
        { left: "🧠 Processeur (CPU)",    right: "Le cerveau — il calcule tout" },
        { left: "📋 Mémoire RAM",         right: "Le bureau — travail en cours" },
        { left: "🎒 Disque dur / SSD",    right: "Le sac à dos — stockage permanent" },
        { left: "🖥️ Écran",              right: "La bouche — il affiche les résultats" },
        { left: "⌨️ Clavier & Souris",   right: "Les mains — tes commandes entrent" },
      ],
    },
  },

  // ── 6 : Quiz composants ───────────────────────────────────────────────────────
  {
    type: "quiz", order_index: 6, lesson_id: lessonId, theme_id: themeId,
    content: {
      questions: [
        {
          id: "q_comp_1",
          question: "Tu ouvres 10 applications en même temps et l'ordi devient lent. Quel composant est probablement saturé ?",
          type: "mcq",
          choices: ["La mémoire RAM (le bureau est trop petit !)", "L'écran", "Le clavier"],
          answer: 0,
          explanation: "La RAM garde tous les programmes ouverts en mémoire. Si elle est pleine, l'ordinateur ralentit — comme un bureau encombré où on ne peut plus travailler !",
        },
        {
          id: "q_comp_2",
          question: "Tu éteins l'ordinateur. Tes fichiers sauvegardés sont-ils perdus ?",
          type: "mcq",
          choices: ["Non — ils sont dans le disque dur/SSD qui ne s'efface pas", "Oui — tout est effacé", "Ça dépend du processeur"],
          answer: 0,
          explanation: "Le disque dur et le SSD conservent les données même sans électricité. C'est différent de la RAM qui, elle, se vide à chaque extinction.",
        },
        {
          id: "q_comp_3",
          question: "Quel composant est le plus important pour jouer à un jeu vidéo rapide ?",
          type: "mcq",
          choices: ["Le processeur (CPU) — il calcule tous les mouvements", "L'écran — plus il est grand, mieux c'est", "Le clavier — il réagit plus vite"],
          answer: 0,
          explanation: "Le processeur calcule chaque image du jeu en temps réel. Un processeur puissant = un jeu fluide. L'écran et le clavier aident, mais le CPU fait le vrai travail !",
        },
      ],
    },
  },

  // ── 7 : Entrée / Sortie ───────────────────────────────────────────────────────
  {
    type: "text", order_index: 7, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<h2 style="color:#f97316;margin-top:0">📡 Entrée / Sortie — l'ordi parle et écoute</h2>
<p style="color:#cbd5e1;margin-bottom:14px">Tout ce qui <strong style="color:#60a5fa">entre dans l'ordinateur</strong> s'appelle une <strong style="color:#60a5fa">ENTRÉE</strong>. Tout ce qui <strong style="color:#f97316">sort de l'ordinateur</strong> s'appelle une <strong style="color:#f97316">SORTIE</strong>.</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0">
  <div style="background:#1e3a5f;border:1px solid #60a5fa40;border-radius:12px;padding:14px">
    <div style="color:#60a5fa;font-weight:bold;font-size:0.9em;margin-bottom:10px">🔵 ENTRÉES — tu envoies à l'ordi</div>
    <ul style="color:#94a3b8;padding-left:16px;margin:0;font-size:0.9em;line-height:1.9">
      <li>⌨️ Clavier</li>
      <li>🖱️ Souris</li>
      <li>🎤 Microphone</li>
      <li>📷 Webcam</li>
      <li>🕹️ Manette de jeu</li>
    </ul>
  </div>
  <div style="background:#3b1a0f;border:1px solid #f9731640;border-radius:12px;padding:14px">
    <div style="color:#f97316;font-weight:bold;font-size:0.9em;margin-bottom:10px">🟠 SORTIES — l'ordi t'envoie</div>
    <ul style="color:#94a3b8;padding-left:16px;margin:0;font-size:0.9em;line-height:1.9">
      <li>🖥️ Écran</li>
      <li>🔊 Haut-parleur</li>
      <li>🖨️ Imprimante</li>
      <li>💡 LED / Voyants</li>
      <li>📳 Vibration (téléphone)</li>
    </ul>
  </div>
</div>

<div style="background:#0f172a;border-left:4px solid #f97316;padding:12px 16px;border-radius:0 8px 8px 0">
  <p style="color:#f97316;margin:0 0 4px;font-weight:bold">🤔 Et certains font les deux !</p>
  <p style="color:#94a3b8;margin:0">Un écran tactile est à la fois une <strong style="color:#60a5fa">entrée</strong> (tu touches) et une <strong style="color:#f97316">sortie</strong> (il affiche). Pareil pour un casque avec micro intégré !</p>
</div>
` },
  },

  // ── 8 : GAME — Memory entrée/sortie ──────────────────────────────────────────
  {
    type: "game", order_index: 8, lesson_id: lessonId, theme_id: themeId,
    content: {
      game_type: "memory",
      title: "Entrée ou Sortie ?",
      description: "Retrouve la paire de chaque appareil ! Retourne les cartes et associe chaque périphérique à son type.",
      pairs: [
        { left: "⌨️ Clavier",          right: "🔵 ENTRÉE — tes frappes entrent" },
        { left: "🖥️ Écran",            right: "🟠 SORTIE — l'image sort" },
        { left: "🎤 Microphone",        right: "🔵 ENTRÉE — ta voix entre" },
        { left: "🔊 Haut-parleur",      right: "🟠 SORTIE — le son sort" },
        { left: "🖱️ Souris",           right: "🔵 ENTRÉE — tes clics entrent" },
        { left: "🖨️ Imprimante",       right: "🟠 SORTIE — le document sort" },
      ],
    },
  },

  // ── 9 : Quiz entrée/sortie ────────────────────────────────────────────────────
  {
    type: "quiz", order_index: 9, lesson_id: lessonId, theme_id: themeId,
    content: {
      questions: [
        {
          id: "q_io_1",
          question: "Un écran tactile, c'est…",
          type: "mcq",
          choices: ["Les deux — entrée (tu touches) et sortie (il affiche)", "Seulement une sortie", "Seulement une entrée"],
          answer: 0,
          explanation: "L'écran tactile est un double champion ! Il affiche les images (sortie) ET capte tes doigts (entrée). C'est une des inventions les plus malines de l'informatique.",
        },
        {
          id: "q_io_2",
          question: "Tu parles à ton téléphone pour lui demander la météo. Ta voix, c'est…",
          type: "mcq",
          choices: ["Une entrée — tu envoies ta voix au téléphone", "Une sortie — le téléphone te parle", "Ni l'un ni l'autre"],
          answer: 0,
          explanation: "Ta voix entre dans le microphone → c'est une entrée. La réponse vocale du téléphone sort par le haut-parleur → c'est une sortie. Les deux dans la même conversation !",
        },
        {
          id: "q_io_3",
          question: "Quand tu joues à un jeu et que la manette vibre, la vibration c'est…",
          type: "mcq",
          choices: ["Une sortie — l'ordi/console t'envoie une sensation", "Une entrée — tu envoies un signal", "Aucune des deux, c'est automatique"],
          answer: 0,
          explanation: "La vibration est envoyée par la console vers ta manette pour te donner une sensation de choc ou d'impact. C'est une sortie — le jeu te répond physiquement !",
        },
      ],
    },
  },

  // ── 10 : Moment mentor ────────────────────────────────────────────────────────
  {
    type: "text", order_index: 10, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:2px solid #FDB81340;border-radius:14px;padding:20px 24px">
  <h2 style="color:#FDB813;margin:0 0 12px">🎯 Activité — Regarde autour de toi !</h2>
  <p style="color:#cbd5e1;margin:0 0 14px">Ton mentor va faire une activité avec toi. Prends une feuille ou note dans ta tête !</p>

  <div style="background:#0f172a;border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🔍 Mission 1 — Les ordis cachés</p>
    <p style="color:#94a3b8;margin:0">Cite <strong style="color:#cbd5e1">3 appareils autour de toi</strong> qui sont des ordinateurs (en dehors du PC ou téléphone évidents). Ton mentor t'aide si tu bloques !</p>
  </div>

  <div style="background:#0f172a;border-radius:10px;padding:14px 18px;margin-bottom:12px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🧩 Mission 2 — Entrée ou Sortie ?</p>
    <p style="color:#94a3b8;margin:0">Ton mentor va nommer 5 objets. Pour chacun, dis vite : <strong style="color:#60a5fa">ENTRÉE</strong> ou <strong style="color:#f97316">SORTIE</strong> ? Exemples : imprimante, webcam, haut-parleur, manette, écran de TV…</p>
  </div>

  <div style="background:#0f172a;border-radius:10px;padding:14px 18px">
    <p style="color:#fbbf24;margin:0 0 8px;font-weight:bold">🎤 Mission 3 — Explique avec tes mots</p>
    <p style="color:#94a3b8;margin:0">Explique à ton mentor, <strong style="color:#cbd5e1">avec tes propres mots</strong>, à quoi sert le processeur. Pas besoin d'être parfait — l'important c'est que tu aies compris l'idée !</p>
  </div>
</div>
` },
  },

  // ── 11 : Les ordis partout ────────────────────────────────────────────────────
  {
    type: "text", order_index: 11, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<h2 style="color:#4ade80;margin-top:0">🌍 Les ordinateurs partout — même chez toi !</h2>
<p style="color:#cbd5e1;margin-bottom:14px">L'ordinateur n'est pas qu'un gros écran dans un bureau. Aujourd'hui, les ordinateurs sont <strong style="color:#4ade80">partout</strong> — et en Afrique, le téléphone est souvent le <em>premier</em> ordinateur de la famille.</p>

<div style="background:#1e293b;border-radius:12px;padding:16px 20px;margin-bottom:14px">
  <p style="color:#fbbf24;margin:0 0 10px;font-weight:bold">🌐 Savais-tu que…</p>
  <ul style="color:#94a3b8;padding-left:18px;margin:0;line-height:2">
    <li>Il y a plus de <strong style="color:#4ade80">6 milliards de smartphones</strong> dans le monde</li>
    <li>Le téléphone mobile est l'ordinateur numéro 1 en Afrique — plus qu'un PC</li>
    <li>Un avion moderne contient plus de <strong style="color:#4ade80">100 ordinateurs</strong> embarqués</li>
    <li>Ta voiture (si elle est récente) a un ordinateur qui gère le moteur, les freins, la climatisation…</li>
    <li>Les composants des ordinateurs contiennent des minéraux comme le <strong style="color:#4ade80">coltan</strong>, extrait notamment en RDC</li>
  </ul>
</div>

<div style="background:#0f172a;border-left:4px solid #4ade80;padding:12px 16px;border-radius:0 8px 8px 0">
  <p style="color:#4ade80;margin:0 0 6px;font-weight:bold">💡 Pourquoi c'est important pour toi ?</p>
  <p style="color:#94a3b8;margin:0">Apprendre à programmer, c'est apprendre à <strong style="color:#cbd5e1">contrôler ces machines</strong> — pas juste les utiliser. C'est un superpouvoir qui ouvre des portes partout dans le monde !</p>
</div>
` },
  },

  // ── 12 : Quiz culture générale ────────────────────────────────────────────────
  {
    type: "quiz", order_index: 12, lesson_id: lessonId, theme_id: themeId,
    content: {
      questions: [
        {
          id: "q_cult_1",
          question: "Quel est l'ordinateur le plus utilisé en Afrique ?",
          type: "mcq",
          choices: ["Le smartphone", "L'ordinateur de bureau", "La tablette"],
          answer: 0,
          explanation: "Le smartphone domine en Afrique. Il est abordable, portable, et permet d'accéder à internet, aux applications, à la banque mobile, à l'éducation — tout ça dans une poche !",
        },
        {
          id: "q_cult_2",
          question: "Un robot aspirateur qui évite les meubles, c'est un ordinateur ?",
          type: "mcq",
          choices: ["Oui — il reçoit des infos (capteurs), les traite, et agit (sortie)", "Non — c'est juste un aspirateur automatique", "Seulement si il est connecté au Wi-Fi"],
          answer: 0,
          explanation: "Un robot aspirateur est un vrai ordinateur embarqué ! Ses capteurs = entrées. Son processeur calcule le chemin = traitement. Ses moteurs = sorties. C'est de la robotique !",
        },
      ],
    },
  },

  // ── 13 : Connexion Kirikou ────────────────────────────────────────────────────
  {
    type: "text", order_index: 13, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e1f3b);border:1px solid #a78bfa40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#a78bfa;margin:0 0 12px">🤖 Et Kirikou dans tout ça ?</h2>
  <p style="color:#cbd5e1;margin:0 0 12px">Dans les prochaines séances, tu vas rencontrer <strong style="color:#FDB813">Kirikou</strong> — un robot coincé dans un labyrinthe qui a besoin de toi pour trouver la sortie.</p>
  <p style="color:#cbd5e1;margin:0 0 14px">Eh bien… Kirikou est lui aussi un ordinateur ! Il a :</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
    <div style="background:#0f172a;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.5em">🧠</div>
      <div style="color:#FDB813;font-weight:bold;font-size:0.9em;margin:4px 0">Processeur</div>
      <div style="color:#475569;font-size:0.8em">Il exécute tes instructions</div>
    </div>
    <div style="background:#0f172a;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.5em">📋</div>
      <div style="color:#60a5fa;font-weight:bold;font-size:0.9em;margin:4px 0">Mémoire</div>
      <div style="color:#475569;font-size:0.8em">Il garde ton programme</div>
    </div>
    <div style="background:#0f172a;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.5em">📡</div>
      <div style="color:#4ade80;font-weight:bold;font-size:0.9em;margin:4px 0">Entrée</div>
      <div style="color:#475569;font-size:0.8em">Tes blocs = ses instructions</div>
    </div>
    <div style="background:#0f172a;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.5em">🚀</div>
      <div style="color:#f97316;font-weight:bold;font-size:0.9em;margin:4px 0">Sortie</div>
      <div style="color:#475569;font-size:0.8em">Il se déplace dans le labyrinthe</div>
    </div>
  </div>

  <p style="color:#94a3b8;margin:0;font-size:0.95em">💡 Quand tu programmeras Kirikou, tu feras exactement ce que font les vrais développeurs : <strong style="color:#cbd5e1">donner des instructions précises à un ordinateur</strong> pour qu'il accomplisse une mission.</p>
</div>
` },
  },

  // ── 14 : Quiz clôture ─────────────────────────────────────────────────────────
  {
    type: "quiz", order_index: 14, lesson_id: lessonId, theme_id: themeId,
    content: {
      questions: [
        {
          id: "q_fin_1",
          question: "Un ordinateur fait trois choses dans l'ordre. Lesquelles ?",
          type: "mcq",
          choices: [
            "Recevoir → Traiter → Produire un résultat",
            "Traiter → Recevoir → Afficher",
            "Stocker → Calculer → Envoyer",
          ],
          answer: 0,
          explanation: "La séquence universelle : Entrée → Traitement → Sortie. C'est vrai pour un PC, un smartphone, un robot ou un distributeur de billets !",
        },
        {
          id: "q_fin_2",
          question: "Tu fermes un programme sans sauvegarder. Qu'est-ce qui se passe avec ton travail ?",
          type: "mcq",
          choices: [
            "Il est perdu — il était dans la RAM qui vient d'être vidée",
            "Il est sauvegardé automatiquement dans le disque dur",
            "Il reste dans la RAM jusqu'au redémarrage",
          ],
          answer: 0,
          explanation: "La RAM est un bureau temporaire. Fermer sans sauvegarder = vider le bureau sans ranger. Ton fichier disparaît car il n'a pas été copié dans le disque dur (le sac à dos permanent).",
        },
        {
          id: "q_fin_3",
          question: "Le processeur (CPU) et la mémoire RAM : quelle est la différence ?",
          type: "mcq",
          choices: [
            "Le CPU calcule, la RAM stocke temporairement ce qui est en cours d'utilisation",
            "Ce sont deux noms pour la même chose",
            "La RAM calcule, le CPU stocke",
          ],
          answer: 0,
          explanation: "Le CPU = le cerveau qui pense. La RAM = le bureau sur lequel le cerveau travaille. Ils sont complémentaires mais ont des rôles complètement différents !",
        },
        {
          id: "q_fin_4",
          question: "Une imprimante 3D, c'est une entrée ou une sortie ?",
          type: "mcq",
          choices: [
            "Une sortie — elle produit un objet à partir des données de l'ordinateur",
            "Une entrée — elle scanne les objets pour les envoyer à l'ordi",
            "Ni l'un ni l'autre — c'est juste une machine",
          ],
          answer: 0,
          explanation: "L'ordinateur envoie un fichier 3D → la machine le fabrique en vrai. C'est une sortie spectaculaire ! (Une imprimante 3D qui scanne, elle, serait une entrée.)",
        },
        {
          id: "q_fin_5",
          question: "Kirikou le robot reçoit tes blocs d'instructions. Ces blocs sont…",
          type: "mcq",
          choices: [
            "Une entrée — tu envoies des instructions à Kirikou",
            "Une sortie — Kirikou t'envoie ses actions",
            "Un composant interne de Kirikou",
          ],
          answer: 0,
          explanation: "Quand tu places des blocs dans la zone de programmation, tu crées un programme qui entre dans Kirikou (entrée). Ses mouvements dans le labyrinthe sont la sortie !",
        },
      ],
    },
  },

  // ── 15 : Conclusion ───────────────────────────────────────────────────────────
  {
    type: "text", order_index: 15, lesson_id: lessonId, theme_id: themeId,
    content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:14px;padding:22px 26px;margin-bottom:16px">
  <h2 style="color:#4ade80;margin:0 0 12px;font-size:1.3em">🏆 Bravo — tu connais l'ordinateur !</h2>
  <p style="color:#86efac;margin:0">Tu sais maintenant ce qu'est vraiment un ordinateur, comment il est organisé, et comment il communique avec le monde. C'est la base de tout ce qui va suivre !</p>
</div>

<div style="background:#1e293b;border-radius:12px;padding:18px 22px;margin-bottom:16px">
  <h3 style="color:#FDB813;margin:0 0 12px;font-size:1em">📚 Ce que tu as appris :</h3>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Un ordinateur <strong>reçoit</strong>, <strong>traite</strong> et <strong>produit</strong> un résultat</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Les 5 composants : CPU 🧠, RAM 📋, SSD 🎒, Écran 🖥️, Clavier ⌨️</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1"><strong style="color:#60a5fa">Entrée</strong> = informations qui entrent · <strong style="color:#f97316">Sortie</strong> = résultats qui sortent</span>
    </div>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:#4ade80;font-size:1.2em;flex-shrink:0">✓</span>
      <span style="color:#cbd5e1">Kirikou est aussi un ordinateur — et tu vas le programmer !</span>
    </div>
  </div>
</div>

<div style="background:linear-gradient(135deg,#1a1f2e,#1e293b);border:1px solid #FDB81340;border-radius:12px;padding:16px 20px">
  <h3 style="color:#FDB813;margin:0 0 8px;font-size:1em">🔭 Prochaine séance — "Mon premier algorithme"</h3>
  <p style="color:#94a3b8;margin:0">Tu vas rencontrer Kirikou dans son labyrinthe et lui donner tes premières instructions. Tu vas écrire ton <strong style="color:#cbd5e1">premier algorithme</strong> — une vraie liste d'instructions pour une vraie machine !</p>
  <p style="color:#475569;margin:10px 0 0;font-size:0.9em">🏅 Pense à compléter tes <strong style="color:#cbd5e1">entraînements</strong> pour consolider tout ça et gagner des XP !</p>
</div>
` },
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Création de la Séance 1 — L'ordinateur, la machine magique\n");

  // 1. Décaler les chapitres existants ─────────────────────────────────────────
  console.log("📦 Décalage des chapitres existants (Séance 1→2 … Séance 6→7) …");
  // On passe d'abord à order_index temporaires (100+) pour éviter les conflits d'unicité
  for (const ch of EXISTING_CHAPTERS) {
    await sb.from("chapters").update({ order_index: ch.newOrder + 100 }).eq("id", ch.id);
  }
  for (const ch of EXISTING_CHAPTERS) {
    const { error } = await sb.from("chapters")
      .update({ title: ch.newTitle, order_index: ch.newOrder })
      .eq("id", ch.id);
    if (error) { console.error(`  ❌ ${ch.newTitle}:`, error.message); process.exit(1); }
    console.log(`  ✓ ${ch.newTitle}`);
  }

  // 2. Créer le nouveau chapitre ────────────────────────────────────────────────
  console.log("\n📂 Création du chapitre Séance 1 …");
  const { data: chapter, error: chapErr } = await sb
    .from("chapters")
    .insert({ title: "Séance 1 — L'ordinateur, la machine magique", theme_id: THEME_ID, order_index: 0 })
    .select("id")
    .single<{ id: string }>();
  if (chapErr || !chapter) { console.error("❌ Chapitre:", chapErr?.message); process.exit(1); }
  console.log(`  ✓ Chapter ID: ${chapter.id}`);

  // 3. Créer la leçon ───────────────────────────────────────────────────────────
  console.log("\n📖 Création de la leçon …");
  const { data: lesson, error: lessonErr } = await sb
    .from("lessons")
    .insert({ title: "L'ordinateur, la machine magique", chapter_id: chapter.id, order_index: 0, xp_reward: 150 })
    .select("id")
    .single<{ id: string }>();
  if (lessonErr || !lesson) { console.error("❌ Leçon:", lessonErr?.message); process.exit(1); }
  console.log(`  ✓ Lesson ID: ${lesson.id}`);

  // 4. Insérer les blocs ────────────────────────────────────────────────────────
  console.log("\n🧱 Insertion des blocs …");
  const blocks = BLOCKS(lesson.id, THEME_ID);
  const { error: blocksErr } = await sb.from("lesson_blocks").insert(blocks);
  if (blocksErr) { console.error("❌ Blocs:", blocksErr.message); process.exit(1); }

  console.log(`  ✓ ${blocks.length} blocs insérés`);
  blocks.forEach((b) => {
    const preview =
      b.type === "game"  ? `GAME  — ${(b.content as any).game_type ?? "maze"} / ${(b.content as any).title}` :
      b.type === "quiz"  ? `QUIZ  — ${(b.content as any).questions?.length} question(s)` :
      b.type === "video" ? `VIDEO — ${(b.content as any).title}` :
                           `TEXT  — bloc ${b.order_index}`;
    console.log(`    [${String(b.order_index).padStart(2,"0")}] ${preview}`);
  });

  console.log("\n✅ Terminé !");
  console.log("   Leçon disponible dans l'espace élève, prof, manager et admin.");
  console.log("   ⚠️  Pense à vérifier/remplacer l'URL de la vidéo depuis l'admin.");
}

main().catch(console.error);
