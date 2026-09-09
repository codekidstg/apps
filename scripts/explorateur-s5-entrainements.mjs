/**
 * Les quatre entraînements de la séance 5 Explorateur — « La répétition ».
 *
 *     node scripts/explorateur-s5-entrainements.mjs           aperçu seul
 *     node scripts/explorateur-s5-entrainements.mjs --ecrire  écrit en base
 *
 * La séance enseigne l'équivalence « Répéter N fois : X = écrire X N fois »,
 * la lecture d'une boucle au doigt, et la traduction dans les deux sens —
 * long vers court, court vers long. Son quiz repère la confusion centrale :
 * dans « Répéter 3 fois : [Avancer, Tourner] », il y a 3 Avancer, pas 6.
 * Elle ne la fait jamais pratiquer ; ces exercices s'en chargent.
 *
 * Le quatrième est le premier `blockly_challenge` de la série. Il l'est parce
 * que la notion EST la boucle : l'enfant doit en assembler une vraie. Le bloc
 * « Kodi dit Boum » est pré-posé par `starter_xml`, si bien qu'il n'y a rien
 * à taper — la validation compare des chaînes à l'identique, et un enfant de
 * neuf ans y perdrait sur une majuscule. Il ne reste que la boucle à monter.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "La répétition — Kirikou dit moins pour faire plus";

// ── 1 · 30 XP — l'équivalence, et ses deux pièges ───────────────────────────
const pareil = {
  titre: "Est-ce que ça fait pareil ?",
  description: "Version longue et version courte : donnent-elles vraiment le même résultat ?",
  xp: 30,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Une boucle ne change <strong>rien</strong> au résultat : elle change seulement la façon de l'écrire. <em>Répéter 3 fois : Avancer</em> fait exactement ce que font trois « Avancer » à la suite.</p><p>Encore faut-il que le compte tombe juste — et que ce qui est <strong>dans</strong> la boucle soit bien ce qu'on voulait répéter.</p><p>Six paires. Chacune fait-elle vraiment la même chose ?</p>` } },
    {
      type: "swipe_sort",
      content: {
        title: "Même résultat, ou pas ?",
        instruction: "Compare les deux versions de chaque paire.",
        helper: {
          title: "Comment vérifier ?",
          criteria: [
            "🖐️ Déroule la boucle avec ton doigt, en comptant à voix haute",
            "🔢 Compte les « Avancer » d'un côté puis de l'autre",
            "⚠️ Si la boucle contient DEUX instructions, les deux sont répétées",
          ],
        },
        categories: [
          { id: "pareil", label: "Même résultat", emoji: "🟰", color: "#10b981" },
          { id: "different", label: "Pas pareil", emoji: "✖️", color: "#ef4444" },
        ],
        items: [
          { id: "p1", emoji: "🔁", label: "Avancer, Avancer, Avancer  ⟷  Répéter 3 fois : Avancer", correct: "pareil",
            hint: "Trois d'un côté, trois de l'autre. C'est exactement la définition d'une boucle." },
          { id: "p2", emoji: "🔁", label: "Avancer, Avancer, Avancer, Avancer  ⟷  Répéter 3 fois : Avancer", correct: "different",
            hint: "Quatre à gauche, trois à droite. Kirikou s'arrête une case trop tôt avec la version courte." },
          { id: "p3", emoji: "🔁", label: "Avancer, Tourner à gauche, Avancer, Tourner à gauche  ⟷  Répéter 2 fois : [Avancer, Tourner à gauche]", correct: "pareil",
            hint: "Le motif « Avancer puis Tourner » revient deux fois : il rentre entier dans la boucle." },
          { id: "p4", emoji: "🔁", label: "Avancer, Avancer, Tourner à droite  ⟷  Répéter 2 fois : [Avancer, Tourner à droite]", correct: "different",
            hint: "Le piège ! La boucle répète les DEUX instructions : elle fait 2 Avancer mais aussi 2 Tourner, alors qu'on n'en voulait qu'un." },
          { id: "p5", emoji: "🔁", label: "Avancer  ⟷  Répéter 1 fois : Avancer", correct: "pareil",
            hint: "Répéter une seule fois, c'est faire une seule fois. C'est inutile, mais ce n'est pas faux." },
          { id: "p6", emoji: "🔁", label: "Avancer, Avancer, Avancer  ⟷  Répéter 2 fois : [Avancer, Avancer]", correct: "different",
            hint: "Deux tours de boucle à deux Avancer chacun font quatre Avancer, pas trois." },
        ],
      },
    },
  ],
};

// ── 2 · 35 XP — dérouler : court vers long ──────────────────────────────────
const derouler = {
  titre: "Déroule la boucle",
  description: "Compte ce que fait vraiment chaque boucle, instruction par instruction.",
  xp: 35,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Lire une boucle, c'est la <strong>dérouler</strong> : poser le doigt sur ce qu'il y a dedans et compter à voix haute — 1… 2… 3…</p><p>⚠️ Quand il y a deux instructions dans la boucle, <strong>les deux</strong> sont répétées. C'est là que tout le monde se trompe.</p>` } },
    {
      type: "fill_blank",
      content: {
        title: "Combien de fois, au total ?",
        sentences: [
          { id: "d1", before: "Répéter 6 fois : Avancer — Kirikou parcourt", after: "cases.",
            options: ["6", "1", "12"], correct: 0,
            explanation: "Un seul « Avancer » dans la boucle, répété six fois : six cases." },
          { id: "d2", before: "Répéter 3 fois : [Avancer, Tourner à droite] — ce programme contient", after: "« Avancer » en tout.",
            options: ["3", "6", "9"], correct: 0,
            explanation: "À chaque tour, un seul « Avancer » est exécuté. Trois tours, donc trois « Avancer ». Le « Tourner » ne les multiplie pas." },
          { id: "d3", before: "… et il contient", after: "« Tourner à droite ».",
            options: ["3", "1", "6"], correct: 0,
            explanation: "Le « Tourner » est lui aussi dans la boucle : il est donc exécuté à chaque tour, trois fois." },
          { id: "d4", before: "Répéter 4 fois : [Avancer, Avancer] — Kirikou parcourt", after: "cases.",
            options: ["8", "4", "6"], correct: 0,
            explanation: "Deux « Avancer » par tour, quatre tours : 2 × 4 = 8 cases." },
          { id: "d5", before: "Répéter 2 fois : [Avancer, Tourner à gauche, Avancer] — Kirikou parcourt", after: "cases.",
            options: ["4", "2", "6"], correct: 0,
            explanation: "Deux « Avancer » par tour, deux tours : quatre cases. Les deux « Tourner » ne déplacent pas Kirikou." },
          { id: "d6", before: "Répéter 1 fois : Avancer — Kirikou parcourt", after: "case.",
            options: ["1", "0", "2"], correct: 0,
            explanation: "Une seule répétition : une seule case. La boucle ne sert à rien ici, mais elle ne fausse rien." },
        ],
      },
    },
  ],
};

// ── 3 · 40 XP — compresser : long vers court ────────────────────────────────
const compresser = {
  titre: "La version courte",
  description: "Retrouve, pour chaque programme long, la boucle qui fait la même chose.",
  xp: 40,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Tu viens de dérouler des boucles. Maintenant on fait le trajet dans l'autre sens : tu regardes un programme long, tu <strong>repères le motif qui se répète</strong>, et tu l'écris en court.</p><p>C'est exactement le « Round 1 » que tu as fait avec ton mentor.</p>` } },
    {
      type: "match",
      content: {
        title: "Programme long → version courte",
        left_label: "La version longue",
        right_label: "La version courte",
        pairs: [
          { left: "Avancer, Avancer, Avancer, Avancer", right: "Répéter 4 fois : Avancer" },
          { left: "Tourner à droite, Tourner à droite, Tourner à droite", right: "Répéter 3 fois : Tourner à droite" },
          { left: "Avancer, Tourner à droite, Avancer, Tourner à droite", right: "Répéter 2 fois : [Avancer, Tourner à droite]" },
          { left: "Avancer, Avancer, Tourner à gauche, Avancer, Avancer", right: "Répéter 2 fois : Avancer — Tourner à gauche — Répéter 2 fois : Avancer" },
        ],
      },
    },
    { type: "text", content: { html: `<p>💡 Le dernier est le plus utile : <strong>deux boucles séparées par un virage</strong>. C'est la forme de tous les labyrinthes en L — celle dont tu auras besoin dans le défi de la séance.</p>` } },
  ],
};

// ── 4 · 45 XP — construire une vraie boucle ─────────────────────────────────
const tambour = {
  titre: "Kodi tape le tambour",
  description: "Fais dire « Boum » huit fois à Kodi — avec quatre blocs seulement.",
  xp: 45,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Assez compté : à toi de <strong>construire</strong> une boucle.</p><p>Je dois taper le tambour <strong>huit fois</strong> — donc dire « Boum » huit fois de suite. Le bloc « Kodi dit Boum » est déjà posé pour toi.</p><p>🔁 Attrape le bloc <strong>Répéter</strong>, glisse le « Kodi dit » à l'intérieur, et règle le nombre.</p><p>⚠️ Le bloc Répéter compte pour deux : il arrive avec son nombre. Avec le « Kodi dit » et son texte, ça fait quatre blocs — et huit blocs « Kodi dit » séparés en feraient seize.</p>` } },
    {
      type: "blockly_challenge",
      content: {
        instructions: "Fais dire « Boum » huit fois de suite à Kodi, sans ajouter d'autres blocs « Kodi dit ». Utilise 🔁 Répéter.",
        expected_lines: ["Boum", "Boum", "Boum", "Boum", "Boum", "Boum", "Boum", "Boum"],
        max_blocks: 4,
        available_blocks: ["kodi_say", "controls_repeat_ext", "text", "math_number"],
        required: true,
        starter_xml:
          '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '<block type="kodi_say" x="40" y="40">' +
          '<value name="TEXT"><block type="text"><field name="TEXT">Boum</field></block></value>' +
          "</block></xml>",
      },
    },
    { type: "text", content: { html: `<p>🏆 <strong>Quatre blocs pour huit tambours.</strong></p><p>C'est toute la séance en une image : écrire moins pour faire plus. Les développeurs professionnels font ça dans chaque programme qu'ils écrivent.</p>` } },
  ],
};

const ENTRAINEMENTS = [pareil, derouler, compresser, tambour];

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`SÉANCE 5 — « ${LECON} »\n`);
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const mecas = e.blocs.filter((b) => b.type !== "text").map((b) => b.type);
  console.log(`  ${i + 1}. ${String(e.xp).padStart(3)} XP  ${e.titre.padEnd(26)} ${e.blocs.length} blocs · ${mecas.join(", ")}`);
}
const mecaniques = new Set(ENTRAINEMENTS.flatMap((e) => e.blocs.filter((b) => b.type !== "text").map((b) => b.type)));
console.log(`\n  ${mecaniques.size} mécaniques distinctes : ${[...mecaniques].join(", ")}`);
console.log(`  XP : ${ENTRAINEMENTS.map((e) => e.xp).join(" · ")}`);

if (!ECRIRE) {
  console.log("\n(aperçu seul — relancer avec --ecrire pour écrire en base)");
  process.exit(0);
}

// ── Écriture ────────────────────────────────────────────────────────────────
const { data: lecon, error: eL } = await db.from("lessons").select("id").eq("title", LECON).single();
if (eL || !lecon) { console.error("Leçon introuvable :", eL?.message); process.exit(1); }

const { data: existants } = await db.from("trainings").select("id, title").eq("lesson_id", lecon.id);
if (existants?.length) {
  console.error(`\n⚠ ${existants.length} entraînement(s) existent déjà sur cette leçon :`);
  for (const x of existants) console.error(`   · ${x.title}`);
  console.error("Rien n'a été écrit — supprimez-les d'abord si vous voulez repartir de zéro.");
  process.exit(1);
}

console.log("\nÉcriture…");
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data: tr, error } = await db.from("trainings").insert({
    lesson_id: lecon.id, title: e.titre, description: e.description,
    xp_reward: e.xp, order_index: i,
  }).select("id").single();
  if (error) { console.error(`  ✗ ${e.titre} : ${error.message}`); process.exit(1); }

  const blocs = e.blocs.map((b, j) => ({ training_id: tr.id, type: b.type, content: b.content, order_index: j }));
  const { error: eB } = await db.from("training_blocks").insert(blocs);
  if (eB) { console.error(`  ✗ blocs de « ${e.titre} » : ${eB.message}`); process.exit(1); }
  console.log(`  ✓ ${String(e.xp).padStart(3)} XP  ${e.titre}  (${blocs.length} blocs)`);
}
console.log("\nTerminé.");
