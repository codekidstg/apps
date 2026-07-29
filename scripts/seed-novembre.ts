/**
 * Seed — Novembre : Je compose de la musique avec des boucles
 * Objectif algo : découvrir les boucles (itération, paramètre, factorisation)
 * Jeu : BlocklyMusic (piano 7 touches, Web Audio API)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertTheme(title: string, slug: string): Promise<string> {
  const { data: ex } = await sb.from("themes").select("id").eq("slug", slug).maybeSingle();
  if (ex) { console.log(`  ↩ Thème existant (${ex.id})`); return ex.id as string; }
  const { data, error } = await sb.from("themes").insert({
    title, slug, description: "Découvrir les boucles en composant de la musique avec du code.",
    level: "explorer", status: "published",
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

// ── Configs jeux musicaux ──────────────────────────────────────────────────────

// SÉANCE 1 — Le tambour qui répète
const MUSIC_1_1 = {
  game_type: "music",
  title: "Défi 1 — Tes premières notes",
  instructions: "Glisse 3 blocs « 🎵 Jouer Do » dans le programme et clique ▶ Jouer ! Tu vas entendre ta toute première mélodie.",
  target_notes: ["Do", "Do", "Do"],
  available_blocks: ["music_play_note"],
  max_blocks: 3,
  tempo: 500,
};

const MUSIC_1_2 = {
  game_type: "music",
  title: "Défi 2 — 8 fois… vraiment ?",
  instructions: "Joue Do 8 fois de suite. Compte combien de blocs tu dois poser. On verra ensemble pourquoi c'est un problème !",
  target_notes: ["Do","Do","Do","Do","Do","Do","Do","Do"],
  available_blocks: ["music_play_note"],
  max_blocks: 8,
  tempo: 420,
};

const MUSIC_1_3 = {
  game_type: "music",
  title: "Défi 3 — La magie de la boucle 🪄",
  instructions: "Même mélodie qu'avant — Do 8 fois. Mais cette fois tu as seulement 3 blocs maximum. Le bloc 🔁 Répéter est ta seule chance !",
  steps: [
    "Glisse un bloc 🔁 Répéter dans le programme",
    "Change le nombre en haut du bloc : mets 8",
    "Glisse un bloc 🎵 Jouer Do À L'INTÉRIEUR du bloc Répéter",
    "Clique ▶ Jouer ! — 3 blocs, même résultat qu'avant 🤯",
  ],
  target_notes: ["Do","Do","Do","Do","Do","Do","Do","Do"],
  available_blocks: ["music_play_note", "controls_repeat_ext"],
  max_blocks: 3,
  tempo: 420,
};

// SÉANCE 2 — Compose ta première mélodie
const MUSIC_2_1 = {
  game_type: "music",
  title: "Défi 1 — L'accord parfait",
  instructions: "Joue Do, puis Mi, puis Sol — dans cet ordre. Ces 3 notes ensemble forment l'accord de Do majeur, la base de milliers de chansons !",
  target_notes: ["Do", "Mi", "Sol"],
  available_blocks: ["music_play_note"],
  max_blocks: 3,
  tempo: 520,
};

const MUSIC_2_2 = {
  game_type: "music",
  title: "Défi 2 — Le riff qui se répète",
  instructions: "Joue la séquence Do-Ré-Mi-Fa deux fois de suite. Avec la boucle Répéter, tu peux le faire avec seulement 5 blocs !",
  target_notes: ["Do","Re","Mi","Fa","Do","Re","Mi","Fa"],
  available_blocks: ["music_play_note", "controls_repeat_ext"],
  max_blocks: 6,
  tempo: 400,
};

const MUSIC_2_3 = {
  game_type: "music",
  title: "Défi 3 — Deux phrases musicales",
  instructions: "Joue Do-Ré-Mi 2 fois (ta première phrase), puis Sol-La-Si 2 fois (ta deuxième phrase). Deux boucles à la suite — c'est comme ça qu'on structure un vrai morceau !",
  target_notes: ["Do","Re","Mi","Do","Re","Mi","Sol","La","Si","Sol","La","Si"],
  available_blocks: ["music_play_note", "controls_repeat_ext"],
  max_blocks: 8,
  tempo: 380,
};

// SÉANCE 3 — Rythmes et variations
const MUSIC_3_1 = {
  game_type: "music",
  title: "Défi 1 — Change un chiffre, change tout",
  instructions: "Joue Mi-Sol-Mi 3 fois. Ensuite, change le 3 en 5 et réécoute. Un seul chiffre modifié = un morceau totalement différent !",
  target_notes: ["Mi","Sol","Mi","Mi","Sol","Mi","Mi","Sol","Mi"],
  available_blocks: ["music_play_note", "controls_repeat_ext"],
  max_blocks: 4,
  tempo: 380,
};

const MUSIC_3_2 = {
  game_type: "music",
  title: "Défi 2 — Couplet et refrain",
  instructions: "Les vrais morceaux alternent couplet et refrain. Joue Do-Mi 2 fois (couplet), puis Sol répété 4 fois (refrain). Deux boucles différentes pour deux ambiances différentes !",
  target_notes: ["Do","Mi","Do","Mi","Sol","Sol","Sol","Sol"],
  available_blocks: ["music_play_note", "music_pause", "controls_repeat_ext"],
  max_blocks: 7,
  tempo: 380,
};

const MUSIC_3_3 = {
  game_type: "music",
  title: "Défi 3 — Ton thème musical 🎨",
  instructions: "Compose une mélodie de ton choix avec au moins 12 notes. Utilise des boucles, varie les notes — c'est TON morceau !",
  free_mode: true,
  min_notes: 12,
  available_blocks: ["music_play_note", "music_pause", "controls_repeat_ext"],
  max_blocks: 12,
  tempo: 360,
};

// SÉANCE 4 — Mon concert de code
const MUSIC_4_1 = {
  game_type: "music",
  title: "Défi 1 — La gamme aller-retour",
  instructions: "Joue la gamme complète en montant : Do-Ré-Mi-Fa-Sol-La-Si, puis redescends : La-Sol-Fa-Mi-Ré-Do. C'est un grand classique des musiciens qui s'échauffent !",
  target_notes: ["Do","Re","Mi","Fa","Sol","La","Si","La","Sol","Fa","Mi","Re","Do"],
  available_blocks: ["music_play_note", "controls_repeat_ext"],
  max_blocks: 15,
  tempo: 340,
};

const MUSIC_4_2 = {
  game_type: "music",
  title: "Défi 2 — Mon concert 🎤",
  instructions: "Compose un morceau de 16 notes minimum. Utilise des boucles, des silences, plusieurs notes différentes. Ce sera ta pièce à montrer à tes parents en juin !",
  free_mode: true,
  min_notes: 16,
  available_blocks: ["music_play_note", "music_pause", "controls_repeat_ext"],
  max_blocks: 15,
  tempo: 350,
};

const MUSIC_4_3 = {
  game_type: "music",
  title: "🎼 Ma signature musicale",
  instructions: "Compose une mélodie courte — 8 notes minimum — qui te ressemble. Pas de mélodie cible, pas de contrainte. C'est ton identité musicale.",
  free_mode: true,
  min_notes: 8,
  available_blocks: ["music_play_note", "music_pause", "controls_repeat_ext"],
  tempo: 380,
};

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Seed Novembre — Je compose de la musique avec des boucles\n");

  const themeId = await upsertTheme(
    "Je compose de la musique avec des boucles",
    "novembre-musique-boucles"
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 1 — Le tambour qui répète
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 1");
  const ch1 = await upsertChapter(themeId,
    "Séance 1 — Le tambour qui répète",
    "Découvrir pourquoi les boucles existent à travers la répétition musicale.",
    0
  );
  const l1 = await upsertLesson(ch1, themeId, "Le tambour qui répète", 0, 50);
  await seedBlocks(l1, themeId, [

    // ── Bloc 1 : accroche ──
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#a78bfa;font-weight:900;font-size:1.1em;margin:0 0 6px">🎵 Ce mois-ci, tu vas apprendre à composer de la musique avec du code.</p>
  <p style="color:#cbd5e1;margin:0">Et en chemin, tu vas découvrir l'une des idées les plus puissantes de l'informatique : <strong style="color:white">ne jamais écrire deux fois la même chose.</strong></p>
</div>
      `.trim() },
    },

    // ── Bloc 2 : concept — pourquoi répéter ? ──
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🥁 Le tambour qui joue 32 fois</h2>

<p>Imagine qu'un batteur joue le même rythme 32 fois pendant une chanson. Si tu devais écrire ses instructions, tu écrirais :</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0;font-family:monospace;font-size:0.9em;color:#94a3b8">
  Joue "Boum" · Joue "Boum" · Joue "Boum" · Joue "Boum" · Joue "Boum" · Joue "Boum" · Joue "Boum" · Joue "Boum" · (×4 encore…)
</div>

<p>32 instructions pour une seule idée. Catastrophique. Et si le batteur change d'avis et veut jouer 64 fois ? Tu dois tout réécrire.</p>

<p>Les développeurs ont inventé une solution : la <strong>boucle</strong>. Au lieu de répéter l'instruction 32 fois, tu dis juste :</p>

<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#4ade80;font-family:monospace;font-weight:700;margin:0">Répéter 32 fois :</p>
  <p style="color:#86efac;font-family:monospace;margin:4px 0 0 20px">Joue "Boum"</p>
</div>

<p>2 lignes. Et changer 32 en 64 prend une seconde.</p>
      `.trim() },
    },

    // ── Bloc 3 : quiz ──
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Un DJ veut jouer la même note 50 fois. Sans boucle, combien d'instructions doit-il écrire ?",
        choices: ["1 instruction", "5 instructions", "50 instructions", "100 instructions"],
        answer: 2,
        explanation: "✅ Exactement ! Sans boucle = 50 blocs identiques. Avec une boucle Répéter 50 fois + 1 bloc note = seulement 2 blocs. C'est ça la puissance des boucles !",
      },
    },

    // ── Bloc 4 : concept — DRY ──
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🧠 La règle d'or des développeurs : DRY</h2>

<p>Il existe un principe célèbre en programmation :</p>

<div style="background:#1e3a5f;border-radius:10px;padding:16px 20px;margin:12px 0;text-align:center">
  <p style="color:#60a5fa;font-size:1.4em;font-weight:900;margin:0 0 4px">DRY</p>
  <p style="color:#93c5fd;font-weight:700;margin:0 0 8px">Don't Repeat Yourself</p>
  <p style="color:#bfdbfe;font-size:0.9em;margin:0">Ne te répète pas.</p>
</div>

<p>Chaque fois que tu copies-colles du code, tu devrais te poser la question : <em>"Est-ce que je pourrais utiliser une boucle à la place ?"</em></p>

<div style="display:flex;gap:12px;margin:16px 0;flex-wrap:wrap">
  <div style="flex:1;min-width:180px;background:#450a0a;border:1px solid #991b1b;border-radius:10px;padding:12px">
    <p style="color:#f87171;font-weight:900;margin:0 0 4px">❌ Code WET (répétitif)</p>
    <code style="color:#fca5a5;font-size:0.8em">jouerDo()<br>jouerDo()<br>jouerDo()<br>jouerDo()<br>jouerDo()</code>
  </div>
  <div style="flex:1;min-width:180px;background:#052e16;border:1px solid #166534;border-radius:10px;padding:12px">
    <p style="color:#4ade80;font-weight:900;margin:0 0 4px">✅ Code DRY (élégant)</p>
    <code style="color:#86efac;font-size:0.8em">répéter(5) {<br>&nbsp;&nbsp;jouerDo()<br>}</code>
  </div>
</div>

<p>Les deux font exactement la même chose. Mais le code DRY est plus <strong>lisible</strong>, plus <strong>rapide à écrire</strong>, et surtout plus <strong>facile à modifier</strong>.</p>
      `.trim() },
    },

    // ── Bloc 5 : quiz ──
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Tu veux changer une mélodie de 8 notes en 12 notes. Dans quel cas c'est plus rapide à modifier ?",
        choices: [
          "Avec 8 blocs séparés — tu ajoutes 4 blocs supplémentaires",
          "Avec une boucle — tu changes juste le chiffre de 8 à 12",
          "Les deux prennent le même temps",
          "Sans boucle c'est toujours plus rapide",
        ],
        answer: 1,
        explanation: "✅ Bonne réponse ! Avec une boucle, changer 8 en 12 prend une seconde. Sans boucle, tu dois ajouter 4 blocs, les reconnecter, tout revérifier. La boucle gagne à chaque fois !",
      },
    },

    // ── Bloc 6 : intro jeux ──
    {
      type: "text", order_index: 5,
      content: { html: `
<h2>🎹 À toi de jouer — 3 défis pour sentir la différence</h2>

<p>Tu vas maintenant <strong>entendre</strong> la différence entre "écrire 8 blocs" et "utiliser une boucle". Les deux donnent exactement la même musique — mais l'un de ces codes est beaucoup plus intelligent.</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 1</span> &nbsp;Joue 3 notes — découvre comment fonctionne le piano</p>
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 2</span> &nbsp;Joue 8 fois la même note — sans boucle (sens la douleur !)</p>
  <p style="color:#e2e8f0;margin:0"><span style="background:#059669;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 3</span> &nbsp;Même mélodie avec 3 blocs max — découvre la boucle 🪄</p>
</div>
      `.trim() },
    },

    // ── Blocs 7-8-9 : les 3 jeux ──
    { type: "game", order_index: 6, content: MUSIC_1_1 },
    { type: "game", order_index: 7, content: MUSIC_1_2 },
    { type: "game", order_index: 8, content: MUSIC_1_3 },

    // ── Bloc 10 : conclusion ──
    {
      type: "text", order_index: 9,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🏆 Tu viens de découvrir les boucles !</h3>
  <p style="color:#86efac;margin:0 0 12px">Une boucle, c'est une instruction qui dit à l'ordinateur : "fais ça X fois". C'est l'une des 3 structures fondamentales de tous les langages de programmation.</p>
  <p style="color:#86efac;margin:0">➡️ La prochaine séance, tu vas utiliser la boucle pour créer de vraies mélodies — pas juste des répétitions !</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Une boucle remplace une longue liste d'instructions identiques<br>
    ✓ Le principe DRY : ne jamais écrire deux fois la même chose<br>
    ✓ Changer le nombre dans une boucle change tout le comportement
  </p>
</div>
      `.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 2 — Compose ta première mélodie
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 2");
  const ch2 = await upsertChapter(themeId,
    "Séance 2 — Compose ta première mélodie",
    "Utiliser des boucles pour créer de vraies mélodies avec plusieurs notes.",
    1
  );
  const l2 = await upsertLesson(ch2, themeId, "Compose ta première mélodie", 0, 60);
  await seedBlocks(l2, themeId, [

    // ── Bloc 1 : rappel + intro ──
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin-bottom:4px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">📌 <strong style="color:#e2e8f0">Rappel séance 1 :</strong> une boucle remplace une liste d'instructions répétées. Au lieu de 8 blocs identiques, tu écris <em>Répéter 8 fois { jouer Do }</em>. 2 blocs suffisent, et changer le 8 en 16 prend une seconde.</p>
</div>
      `.trim() },
    },

    // ── Bloc 2 : concept — notes différentes ──
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎶 Plusieurs notes = une mélodie</h2>

<p>Jusqu'ici tu as répété la <em>même</em> note. Mais une vraie mélodie, c'est une <strong>séquence de notes différentes</strong> qui se répète.</p>

<p>Pense à "Frère Jacques" :</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0;font-family:monospace">
  <p style="color:#a78bfa;margin:0 0 4px">Do - Ré - Mi - Do</p>
  <p style="color:#a78bfa;margin:0 0 4px">Do - Ré - Mi - Do</p>
  <p style="color:#64748b;margin:0;font-size:0.85em">← deux fois la même phrase de 4 notes !</p>
</div>

<p>Ce n'est pas "Do" répété 8 fois — c'est <em>une séquence de 4 notes</em> répétée 2 fois. La boucle peut contenir <strong>plusieurs instructions</strong> à la fois :</p>

<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#4ade80;font-family:monospace;font-weight:700;margin:0">Répéter 2 fois :</p>
  <p style="color:#86efac;font-family:monospace;margin:4px 0 0 20px">Joue Do → Joue Ré → Joue Mi → Joue Do</p>
</div>

<p>4 notes × 2 répétitions = 8 notes jouées. Et si tu veux répéter 4 fois, tu changes juste le chiffre.</p>
      `.trim() },
    },

    // ── Bloc 3 : quiz ──
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Tu veux jouer Do-Mi-Sol 3 fois. Combien de blocs as-tu besoin au minimum avec une boucle ?",
        choices: ["9 blocs (3 notes × 3 répétitions)", "4 blocs (Répéter + Do + Mi + Sol)", "3 blocs (Do + Mi + Sol)", "2 blocs (Répéter + 1 note)"],
        answer: 1,
        explanation: "✅ Exactement ! 1 bloc Répéter (avec le chiffre 3) + 3 blocs de notes à l'intérieur = 4 blocs. Sans boucle il t'en faudrait 9. La boucle réduit presque par 3 le nombre de blocs !",
      },
    },

    // ── Bloc 4 : concept — structure interne ──
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🏗️ L'intérieur d'une boucle</h2>

<p>La boucle a deux parties :</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:#1e3a5f;border-radius:8px;padding:12px">
    <p style="color:#60a5fa;font-weight:900;margin:0 0 6px">🔢 Le compteur</p>
    <p style="color:#bfdbfe;font-size:0.9em;margin:0">C'est le chiffre en haut : combien de fois on répète. Tu peux le changer à n'importe quelle valeur.</p>
  </div>
  <div style="background:#1e3a5f;border-radius:8px;padding:12px">
    <p style="color:#60a5fa;font-weight:900;margin:0 0 6px">📦 Le corps</p>
    <p style="color:#bfdbfe;font-size:0.9em;margin:0">C'est ce qui est à l'intérieur du bloc. Tout ce que tu mets dedans sera répété.</p>
  </div>
</div>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 Astuce :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Pour mettre des blocs <em>à l'intérieur</em> du bloc Répéter, fais-les glisser directement dans l'espace creusé du bloc. Tu verras qu'il s'agrandit automatiquement pour les accueillir !</p>
</div>
      `.trim() },
    },

    // ── Bloc 5 : quiz ──
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Dans une boucle « Répéter 4 fois { Do Ré Mi } », combien de notes au total seront jouées ?",
        choices: ["3 notes", "4 notes", "7 notes", "12 notes"],
        answer: 3,
        explanation: "✅ Bravo ! 3 notes (Do Ré Mi) × 4 répétitions = 12 notes jouées. La boucle multiplie. C'est son super-pouvoir !",
      },
    },

    // ── Bloc 6 : intro défis ──
    {
      type: "text", order_index: 5,
      content: { html: `
<h2>🎹 3 défis — de la note à la phrase musicale</h2>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 1</span> &nbsp;L'accord de Do — 3 notes qui sonnent ensemble</p>
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 2</span> &nbsp;Ton premier riff — Do Ré Mi Fa répété 2 fois</p>
  <p style="color:#e2e8f0;margin:0"><span style="background:#059669;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 3</span> &nbsp;Deux phrases musicales — deux boucles à la suite</p>
</div>
      `.trim() },
    },

    { type: "game", order_index: 6, content: MUSIC_2_1 },
    { type: "game", order_index: 7, content: MUSIC_2_2 },
    { type: "game", order_index: 8, content: MUSIC_2_3 },

    // ── Conclusion ──
    {
      type: "text", order_index: 9,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #4c1d95;border-radius:12px;padding:20px 24px">
  <h3 style="color:#a78bfa;margin:0 0 10px">🏆 Tu composes maintenant de vraies mélodies !</h3>
  <p style="color:#c4b5fd;margin:0 0 12px">Tu viens d'utiliser le même outil que les programmeurs qui créent les musiques de jeux vidéo. Une boucle avec plusieurs notes à l'intérieur, c'est exactement comme ça que fonctionne un séquenceur musical professionnel.</p>
  <p style="color:#c4b5fd;margin:0">➡️ La prochaine séance, tu vas apprendre à combiner plusieurs boucles différentes — comme un vrai compositeur qui écrit couplet et refrain.</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Une boucle peut contenir plusieurs notes différentes<br>
    ✓ La boucle répète <em>tout</em> ce qu'elle contient<br>
    ✓ Nombre de notes = notes dans le corps × compteur
  </p>
</div>
      `.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 3 — Rythmes et variations
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 3");
  const ch3 = await upsertChapter(themeId,
    "Séance 3 — Rythmes et variations",
    "Enchaîner plusieurs boucles et comprendre le rôle du paramètre (le compteur).",
    2
  );
  const l3 = await upsertLesson(ch3, themeId, "Rythmes et variations", 0, 70);
  await seedBlocks(l3, themeId, [

    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin-bottom:4px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">📌 <strong style="color:#e2e8f0">Rappel séance 2 :</strong> une boucle peut contenir plusieurs notes. "Répéter 2 fois { Do Ré Mi Fa }" joue 8 notes en tout. Le corps de la boucle est répété autant de fois que le compteur l'indique.</p>
</div>
      `.trim() },
    },

    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎛️ Le paramètre : le vrai pouvoir de la boucle</h2>

<p>Le chiffre dans la boucle (le compteur) s'appelle un <strong>paramètre</strong>. C'est une valeur que tu contrôles et qui change le comportement de toute la boucle.</p>

<p>Voici pourquoi c'est révolutionnaire :</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 6px"><strong>Même code</strong>, compteur différent → résultat différent :</p>
  <p style="color:#a78bfa;font-family:monospace;margin:4px 0">Répéter <span style="background:#4c1d95;padding:1px 6px;border-radius:4px">2</span> fois { Mi Sol Mi } → 6 notes</p>
  <p style="color:#a78bfa;font-family:monospace;margin:4px 0">Répéter <span style="background:#4c1d95;padding:1px 6px;border-radius:4px">8</span> fois { Mi Sol Mi } → 24 notes</p>
  <p style="color:#a78bfa;font-family:monospace;margin:4px 0">Répéter <span style="background:#4c1d95;padding:1px 6px;border-radius:4px">16</span> fois { Mi Sol Mi } → 48 notes</p>
</div>

<p>En Python, tu écris <code style="background:#1e293b;padding:2px 6px;border-radius:4px">for i in range(N)</code> où <code style="background:#1e293b;padding:2px 6px;border-radius:4px">N</code> est ce paramètre. C'est l'une des premières choses que tu apprends quand tu passes au vrai code en janvier.</p>
      `.trim() },
    },

    {
      type: "quiz", order_index: 2,
      content: {
        question: "Dans « Répéter N fois { jouer Do } », si tu changes N de 3 à 6, que se passe-t-il ?",
        choices: [
          "La note change — ça joue Ré au lieu de Do",
          "Le tempo change — ça joue plus vite",
          "Ça joue deux fois plus de notes (6 au lieu de 3)",
          "Rien ne change",
        ],
        answer: 2,
        explanation: "✅ Exactement ! Le paramètre N contrôle uniquement le nombre de répétitions. Changer N de 3 à 6 double le nombre de notes. La note (Do) et la vitesse restent identiques.",
      },
    },

    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🎼 Deux boucles = un vrai morceau</h2>

<p>Un morceau de musique a toujours une <strong>structure</strong>. Les musiciens utilisent des termes comme :</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:#1e3a5f;border-radius:8px;padding:12px;text-align:center">
    <p style="color:#60a5fa;font-size:1.2em;font-weight:900;margin:0 0 4px">Couplet</p>
    <p style="color:#bfdbfe;font-size:0.85em;margin:0">La partie qui change, qui raconte quelque chose de nouveau</p>
  </div>
  <div style="background:#1e3a5f;border-radius:8px;padding:12px;text-align:center">
    <p style="color:#60a5fa;font-size:1.2em;font-weight:900;margin:0 0 4px">Refrain</p>
    <p style="color:#bfdbfe;font-size:0.85em;margin:0">La partie mémorable qui revient souvent — celle que tout le monde chante</p>
  </div>
</div>

<p>En code, ça donne <strong>deux boucles à la suite</strong> — chacune avec sa propre mélodie et son propre compteur :</p>

<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px;margin:12px 0;font-family:monospace;font-size:0.9em">
  <p style="color:#64748b;margin:0 0 2px">// Couplet</p>
  <p style="color:#4ade80;margin:0">Répéter 2 fois { Do Ré Mi }</p>
  <p style="color:#64748b;margin:8px 0 2px">// Refrain</p>
  <p style="color:#4ade80;margin:0">Répéter 4 fois { Sol }</p>
</div>
      `.trim() },
    },

    {
      type: "quiz", order_index: 4,
      content: {
        question: "Quelle est la différence entre un couplet et un refrain dans un morceau de musique ?",
        choices: [
          "Le couplet est rapide, le refrain est lent",
          "Le couplet joue des notes graves, le refrain des notes aiguës",
          "Le couplet change à chaque fois, le refrain revient souvent et est mémorable",
          "Ce sont deux mots pour dire la même chose",
        ],
        answer: 2,
        explanation: "✅ Exactement ! Le couplet raconte une histoire (il change), le refrain est l'accroche qui revient régulièrement. En code : deux boucles différentes, l'une après l'autre.",
      },
    },

    {
      type: "text", order_index: 5,
      content: { html: `
<h2>🎹 3 défis — paramètres et structure</h2>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 1</span> &nbsp;Joue Mi-Sol-Mi 3 fois — puis change le 3 en 5 et réécoute</p>
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 2</span> &nbsp;Couplet + refrain avec 2 boucles différentes</p>
  <p style="color:#e2e8f0;margin:0"><span style="background:#059669;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 3</span> &nbsp;Composition libre — ton thème musical de A à Z</p>
</div>
      `.trim() },
    },

    { type: "game", order_index: 6, content: MUSIC_3_1 },
    { type: "game", order_index: 7, content: MUSIC_3_2 },
    { type: "game", order_index: 8, content: MUSIC_3_3 },

    {
      type: "text", order_index: 9,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🏆 Tu penses comme un compositeur ET comme un développeur !</h3>
  <p style="color:#86efac;margin:0 0 12px">Deux boucles avec des paramètres différents = un morceau structuré. C'est exactement ce que font les logiciels de composition musicale professionnels — juste avec plus de notes et plus de boucles !</p>
  <p style="color:#86efac;margin:0">➡️ La prochaine séance, tu vas créer ton morceau final — celui que tu montreras à tes parents en juin. C'est ta signature musicale.</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Le paramètre d'une boucle contrôle le nombre de répétitions<br>
    ✓ Changer un seul chiffre change tout le morceau<br>
    ✓ Deux boucles à la suite = structure couplet/refrain
  </p>
</div>
      `.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 4 — Mon concert de code
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 4");
  const ch4 = await upsertChapter(themeId,
    "Séance 4 — Mon concert de code",
    "Créer une composition musicale complète et personnelle.",
    3
  );
  const l4 = await upsertLesson(ch4, themeId, "Mon concert de code", 0, 80);
  await seedBlocks(l4, themeId, [

    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#a78bfa;font-weight:900;font-size:1.1em;margin:0 0 6px">🎤 C'est ta dernière séance du mois de novembre.</p>
  <p style="color:#cbd5e1;margin:0">Tu vas créer ton <strong style="color:white">morceau de musique personnel</strong> — celui que tu montreras à tes parents lors de la grande démo de juin.</p>
</div>
      `.trim() },
    },

    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🌍 Les boucles : partout dans l'informatique</h2>

<p>Tu as découvert les boucles avec la musique. Mais elles sont partout :</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <p style="color:#fbbf24;font-weight:900;margin:0 0 4px">🎮 Jeux vidéo</p>
    <p style="color:#cbd5e1;font-size:0.85em;margin:0">"Tant que le joueur est en vie : recalcule les ennemis, redessine l'écran, écoute les touches"</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <p style="color:#fbbf24;font-weight:900;margin:0 0 4px">📱 Réseaux sociaux</p>
    <p style="color:#cbd5e1;font-size:0.85em;margin:0">"Pour chaque post dans le fil : affiche l'image, le texte, les likes, les commentaires"</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <p style="color:#fbbf24;font-weight:900;margin:0 0 4px">🤖 Intelligence artificielle</p>
    <p style="color:#cbd5e1;font-size:0.85em;margin:0">"Répète 10 000 fois : analyse un exemple, ajuste les paramètres, vérifie le résultat"</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <p style="color:#fbbf24;font-weight:900;margin:0 0 4px">🎵 Streaming musical</p>
    <p style="color:#cbd5e1;font-size:0.85em;margin:0">"Pour chaque milliseconde : décode un bout de son, envoie-le aux haut-parleurs"</p>
  </div>
</div>

<p>La boucle <code style="background:#1e293b;padding:2px 6px;border-radius:4px">for</code> que tu apprendras en Python en janvier fait exactement la même chose que ton bloc Répéter. Tu connais déjà le concept — tu apprendras juste la syntaxe.</p>
      `.trim() },
    },

    {
      type: "quiz", order_index: 2,
      content: {
        question: "Un jeu vidéo tourne à 60 images par seconde. Quelle structure fait recalculer l'écran 60 fois par seconde ?",
        choices: [
          "Une condition (si/sinon)",
          "Une variable",
          "Une boucle qui se répète indéfiniment",
          "Une fonction",
        ],
        answer: 2,
        explanation: "✅ Parfait ! La 'game loop' (boucle de jeu) est la boucle infinie au cœur de tout jeu vidéo. Elle tourne 60 fois par seconde, met à jour l'état du jeu et redessine l'écran. Sans boucle, le jeu s'arrêterait après la première image !",
      },
    },

    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🎼 Construire un vrai morceau</h2>

<p>Un compositeur professionnel structure son morceau avant d'écrire la première note. Il pense en termes de <strong>blocs qui se répètent</strong> — exactement comme un développeur.</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#94a3b8;font-size:0.85em;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em">Structure d'un morceau type</p>
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    <span style="background:#3b82f6;color:white;padding:4px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Intro</span>
    <span style="color:#64748b;font-size:0.85em;line-height:2">→</span>
    <span style="background:#8b5cf6;color:white;padding:4px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Couplet ×2</span>
    <span style="color:#64748b;font-size:0.85em;line-height:2">→</span>
    <span style="background:#059669;color:white;padding:4px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Refrain ×2</span>
    <span style="color:#64748b;font-size:0.85em;line-height:2">→</span>
    <span style="background:#8b5cf6;color:white;padding:4px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Couplet ×2</span>
    <span style="color:#64748b;font-size:0.85em;line-height:2">→</span>
    <span style="background:#059669;color:white;padding:4px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Refrain ×3</span>
  </div>
  <p style="color:#64748b;font-size:0.8em;margin:8px 0 0">= plusieurs boucles à la suite, avec des compteurs différents</p>
</div>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 Avant de coder :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Les meilleurs développeurs planifient avant d'écrire. Note sur un papier : quelles notes pour ton couplet ? Pour ton refrain ? Combien de répétitions ? C'est ton algorithme <em>avant</em> le code.</p>
</div>
      `.trim() },
    },

    {
      type: "quiz", order_index: 4,
      content: {
        question: "Pourquoi est-il utile de planifier son morceau AVANT de placer les blocs ?",
        choices: [
          "Pour impressionner le professeur",
          "Parce que Blockly n'accepte pas les blocs non planifiés",
          "Pour avoir une idée claire de la structure — ça évite de tout recommencer à chaque erreur",
          "La planification ne sert à rien, il vaut mieux essayer directement",
        ],
        answer: 2,
        explanation: "✅ Exactement ! Un développeur qui code sans plan passe 80% de son temps à corriger des erreurs évitables. Planifier d'abord, coder ensuite — c'est la méthode des pros.",
      },
    },

    {
      type: "text", order_index: 5,
      content: { html: `
<h2>🎤 3 défis finaux — ton concert de code</h2>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#3b82f6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 1</span> &nbsp;La gamme aller-retour — 13 notes, 0 boucle possible 😈</p>
  <p style="color:#e2e8f0;margin:0 0 8px"><span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 2</span> &nbsp;Ton concert — composition libre de 16 notes minimum</p>
  <p style="color:#e2e8f0;margin:0"><span style="background:#059669;color:white;padding:2px 10px;border-radius:20px;font-size:0.85em;font-weight:700">Défi 3</span> &nbsp;Ta signature musicale — ta mélodie personnelle, libre total</p>
</div>
      `.trim() },
    },

    { type: "game", order_index: 6, content: MUSIC_4_1 },
    { type: "game", order_index: 7, content: MUSIC_4_2 },
    { type: "game", order_index: 8, content: MUSIC_4_3 },

    {
      type: "text", order_index: 9,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #4c1d95;border-radius:12px;padding:20px 24px">
  <h3 style="color:#a78bfa;margin:0 0 10px">🏆 Tu es compositeur ET développeur !</h3>
  <p style="color:#c4b5fd;margin:0 0 12px">Ce mois-ci tu as découvert l'une des idées fondamentales de l'informatique. Chaque fois que tu répètes quelque chose, il y a une boucle derrière. Dans les jeux, dans les applications, dans l'IA — partout.</p>
  <p style="color:#c4b5fd;margin:0">➡️ En janvier, tu apprendras à écrire <code style="background:#312e81;padding:2px 6px;border-radius:4px">for i in range(N):</code> en vrai Python. Tu reconnaîtras immédiatement ton bloc Répéter.</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Bilan du mois de novembre :</strong><br>
    ✓ Boucle = répéter un bloc d'instructions N fois<br>
    ✓ DRY : ne jamais écrire deux fois la même chose<br>
    ✓ Le paramètre (N) contrôle le comportement de toute la boucle<br>
    ✓ Plusieurs boucles à la suite = structure complète (couplet/refrain)<br>
    ✓ Python : <code>for i in range(N):</code> = ton bloc Répéter
  </p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 5 (Décembre) — Boucles dans les boucles
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 5 (Décembre)");
  const ch5 = await upsertChapter(themeId,
    "Séance 5 — Boucles dans les boucles",
    "Découvrir les boucles imbriquées : une boucle qui en contient une autre.",
    4
  );
  const l5 = await upsertLesson(ch5, themeId, "La boucle des boucles", 0, 90);
  await seedBlocks(l5, themeId, [

    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#a5b4fc;font-weight:900;font-size:1.1em;margin:0 0 6px">🪆 Une boucle… dans une boucle.</p>
  <p style="color:#c7d2fe;margin:0">Tu sais déjà utiliser une seule boucle. Aujourd'hui tu vas découvrir qu'on peut <strong>mettre une boucle à l'intérieur d'une autre</strong> — comme des poupées gigognes. C'est une des idées les plus puissantes en programmation.</p>
</div>
      `.trim() },
    },

    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🪆 Les boucles imbriquées</h2>

<p>Imagine un groupe de danse. Le chorégraphe dit :</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0;font-family:monospace;font-size:0.9em;color:#e2e8f0;line-height:2">
  Répéter <strong>3 fois</strong> (le couplet) :<br>
  &nbsp;&nbsp;Répéter <strong>4 fois</strong> (le refrain) :<br>
  &nbsp;&nbsp;&nbsp;&nbsp;Clap clap clap
</div>

<p>Combien de "Clap" au total ? <strong>3 × 4 = 12 claps</strong>.</p>

<p>La boucle <em>extérieure</em> (×3) dit combien de couplets. La boucle <em>intérieure</em> (×4) dit combien de claps par couplet. On les appelle des <strong>boucles imbriquées</strong>.</p>

<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 La règle :</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Chaque fois que la boucle extérieure fait 1 tour, la boucle intérieure fait <strong>tous ses tours</strong> entièrement. Puis recommence.</p>
</div>
      `.trim() },
    },

    {
      type: "quiz", order_index: 2,
      content: {
        question: "Répéter 2 fois { Répéter 3 fois { Jouer Do } }. Combien de Do joue-t-on ?",
        choices: ["2 Do", "3 Do", "5 Do", "6 Do"],
        answer: 3,
        explanation: "✅ 2 × 3 = 6 Do ! La boucle intérieure joue 3 Do, puis la boucle extérieure relance tout ça une 2e fois. Total : 6.",
      },
    },

    {
      type: "quiz", order_index: 3,
      content: {
        question: "Tu veux jouer { Do Mi Sol } 4 fois, puis { La Si } 2 fois. Comment organises-tu tes boucles ?",
        choices: [
          "Une seule boucle ×6 avec tout dedans",
          "Répéter×4 { Do Mi Sol } PUIS Répéter×2 { La Si } — deux boucles l'une après l'autre",
          "Répéter×4 { Répéter×2 { Do Mi Sol La Si } }",
          "Répéter×2 { Do Mi Sol } puis Répéter×4 { La Si }",
        ],
        answer: 1,
        explanation: "✅ Parfait ! Deux boucles séparées, l'une après l'autre. Les boucles imbriquées servent quand une répétition EST À L'INTÉRIEUR d'une autre. Ici les deux répétitions sont indépendantes, donc côte à côte.",
      },
    },

    {
      type: "game", order_index: 4,
      content: {
        game_type: "music",
        title: "Défi 1 — Couplet×2 + Refrain×3",
        instructions: "Joue : { Sol Mi Do } 2 fois, puis { La Sol } 3 fois. Structure : deux boucles à la suite.",
        target_notes: ["Sol","Mi","Do","Sol","Mi","Do","La","Sol","La","Sol","La","Sol"] as any,
        available_blocks: ["music_play_note","controls_repeat_ext"],
        max_blocks: 8,
        tempo: 420,
      },
    },

    {
      type: "game", order_index: 5,
      content: {
        game_type: "music",
        title: "Défi 2 — La phrase musicale imbriquée",
        instructions: "Joue Do-Mi 3 fois, mais chaque fois suivi de Sol-Sol. Utilise une boucle extérieure ×3 contenant { Do Mi Sol Sol }.",
        target_notes: ["Do","Mi","Sol","Sol","Do","Mi","Sol","Sol","Do","Mi","Sol","Sol"] as any,
        available_blocks: ["music_play_note","controls_repeat_ext"],
        max_blocks: 6,
        tempo: 380,
      },
    },

    {
      type: "game", order_index: 6,
      content: {
        game_type: "music",
        title: "Défi 3 — Montée et descente",
        instructions: "Joue la montée { Do Ré Mi } puis la descente { Mi Ré Do } — 2 fois l'ensemble. Boucle extérieure ×2, deux groupes de notes dedans.",
        target_notes: ["Do","Re","Mi","Mi","Re","Do","Do","Re","Mi","Mi","Re","Do"] as any,
        available_blocks: ["music_play_note","controls_repeat_ext"],
        max_blocks: 8,
        tempo: 400,
      },
    },

    {
      type: "text", order_index: 7,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #4338ca;border-radius:12px;padding:20px 24px">
  <h3 style="color:#a5b4fc;margin:0 0 10px">🪆 Les boucles imbriquées : mission accomplie !</h3>
  <p style="color:#c7d2fe;margin:0 0 12px">En Python en janvier, tu écriras <code style="background:#312e81;padding:2px 6px;border-radius:4px">for i in range(3):</code> contenant <code style="background:#312e81;padding:2px 6px;border-radius:4px">for j in range(4):</code>. Tu reconnaîtras exactement ce que tu as fait aujourd'hui !</p>
</div>

<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Boucle imbriquée = une boucle à l'intérieur d'une autre<br>
    ✓ Boucle extérieure × boucle intérieure = total d'exécutions<br>
    ✓ Deux boucles côte à côte ≠ deux boucles imbriquées
  </p>
</div>
      `.trim() },
    },
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // SÉANCE 6 (Décembre) — Reproduire une chanson connue
  // ════════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 6 (Décembre)");
  const ch6 = await upsertChapter(themeId,
    "Séance 6 — Code une vraie chanson",
    "Récapitulatif festif : reproduire une mélodie connue avec des boucles.",
    5
  );
  const l6 = await upsertLesson(ch6, themeId, "Ma première vraie chanson", 0, 120);
  await seedBlocks(l6, themeId, [

    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#134e4a,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#34d399;font-weight:900;font-size:1.1em;margin:0 0 6px">🎄 La séance de fin de trimestre !</p>
  <p style="color:#a7f3d0;margin:0">Aujourd'hui tu vas coder une vraie chanson que tu connais. Toutes tes compétences du trimestre vont servir en même temps : boucles, notes, structure musicale.</p>
</div>
      `.trim() },
    },

    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎵 Les chansons sont des algorithmes</h2>

<p>Tu le sais maintenant : <strong>toute musique a une structure répétitive</strong>. Couplets, refrains, ponts — ce sont des boucles avec des paramètres différents.</p>

<p>Regarde "Frère Jacques" :</p>

<div style="background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#94a3b8;font-size:0.85em;font-weight:700;margin:0 0 8px;text-transform:uppercase">Frère Jacques — structure algorithmique</p>
  <div style="font-family:monospace;font-size:0.9em;color:#e2e8f0;line-height:2">
    <span style="color:#34d399">Répéter 2 fois</span> : Do Ré Mi Do<br>
    <span style="color:#34d399">Répéter 2 fois</span> : Mi Fa Sol<br>
    <span style="color:#34d399">Répéter 2 fois</span> : Sol La Sol Fa Mi Do<br>
    <span style="color:#34d399">Répéter 2 fois</span> : Do Sol Do
  </div>
</div>

<p>Quatre boucles à la suite — chacune une phrase musicale. En changeant juste les notes dans chaque boucle, tu as une chanson entière.</p>
      `.trim() },
    },

    {
      type: "game", order_index: 2,
      content: {
        game_type: "music",
        title: "Défi 1 — Frère Jacques (phrase 1)",
        instructions: "Joue 'Do Ré Mi Do' 2 fois. C'est la première phrase de Frère Jacques !",
        target_notes: ["Do","Re","Mi","Do","Do","Re","Mi","Do"] as any,
        available_blocks: ["music_play_note","controls_repeat_ext"],
        max_blocks: 6,
        tempo: 500,
      },
    },

    {
      type: "game", order_index: 3,
      content: {
        game_type: "music",
        title: "Défi 2 — Frère Jacques (phrases 3 et 4)",
        instructions: "Joue 'Mi Fa Sol' 2 fois, puis 'Do Sol Do' 2 fois. Enchaîne deux boucles !",
        target_notes: ["Mi","Fa","Sol","Mi","Fa","Sol","Do","Sol","Do","Do","Sol","Do"] as any,
        available_blocks: ["music_play_note","controls_repeat_ext"],
        max_blocks: 9,
        tempo: 500,
      },
    },

    {
      type: "game", order_index: 4,
      content: {
        game_type: "music",
        title: "Défi 3 — Frère Jacques complet 🏆",
        instructions: "Maintenant la chanson entière ! 4 phrases musicales, chacune répétée 2 fois. Planifie les 4 boucles avant de coder.",
        target_notes: [
          "Do","Re","Mi","Do",
          "Do","Re","Mi","Do",
          "Mi","Fa","Sol",
          "Mi","Fa","Sol",
          "Sol","La","Sol","Fa","Mi","Do",
          "Sol","La","Sol","Fa","Mi","Do",
          "Do","Sol","Do",
          "Do","Sol","Do",
        ] as any,
        available_blocks: ["music_play_note","controls_repeat_ext"],
        max_blocks: 18,
        tempo: 480,
      },
    },

    {
      type: "text", order_index: 5,
      content: { html: `
<div style="background:linear-gradient(135deg,#134e4a,#1e1b4b);border:1px solid #34d399;border-radius:16px;padding:24px 28px;text-align:center">
  <div style="font-size:2.5em;margin-bottom:8px">🏆</div>
  <h2 style="color:#34d399;margin:0 0 10px">Trimestre 2 terminé — Tu es compositeur !</h2>
  <p style="color:#a7f3d0;margin:0 0 16px">En 6 séances, tu as maîtrisé l'outil fondamental de tout programmeur : la <strong>boucle</strong>.</p>
</div>

<div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">🔁</span>
    <div>
      <strong style="color:#e2e8f0">La boucle</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">Répéter un bloc N fois au lieu de le copier-coller. DRY en action.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">🎵</span>
    <div>
      <strong style="color:#e2e8f0">Structure musicale = structure algorithmique</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">Couplet, refrain, pont — tout est une boucle. La musique et le code partagent la même logique.</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:10px;padding:14px 18px;display:flex;gap:12px;align-items:flex-start">
    <span style="font-size:1.3em;flex-shrink:0">🪆</span>
    <div>
      <strong style="color:#e2e8f0">Boucles imbriquées</strong>
      <p style="color:#64748b;font-size:0.9em;margin:4px 0 0">Une boucle dans une boucle multiplie les répétitions. La base des algorithmes complexes.</p>
    </div>
  </div>

</div>

<div style="margin-top:20px;background:linear-gradient(135deg,#1e1b4b,#1c1917);border:1px solid #6d28d9;border-radius:12px;padding:18px 22px">
  <p style="color:#c4b5fd;font-weight:900;margin:0 0 8px">🐍 Janvier — La prochaine aventure :</p>
  <p style="color:#ddd6fe;margin:0">"<strong>J'écris en vrai Python</strong>" — tu vas voir pour la première fois du vrai code texte. Et tu reconnaîtras immédiatement <code style="background:#312e81;padding:2px 6px;border-radius:4px">for i in range(N):</code> — c'est exactement ton bloc Répéter !</p>
</div>
      `.trim() },
    },
  ]);

  console.log("\n🎉  Seed terminé !");
  console.log(`   Thème     : Je compose de la musique avec des boucles`);
  console.log(`   Chapitres : 4 séances`);
  console.log(`   Leçons    : 4`);
  console.log(`   Jeux      : 3 défis musicaux par séance`);
}

main().catch((e) => { console.error(e); process.exit(1); });
