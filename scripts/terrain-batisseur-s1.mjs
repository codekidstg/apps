/**
 * Le Terrain — Bâtisseur, séance 1 « Mon premier programme ».
 *
 *     node scripts/terrain-batisseur-s1.mjs           aperçu
 *     node scripts/terrain-batisseur-s1.mjs --ecrire  applique
 *
 * Sept exercices en libre service, sur la même réserve que le parcours mais par
 * l'autre porte : pas d'XP, rejouables, et aucun ne compte dans une note.
 *
 * La consigne était : au moins 2 à 3 minutes par exercice, pour travailler la
 * concentration. La durée ne vient JAMAIS de texte à lire — beaucoup d'enfants
 * ici lisent le français comme seconde langue. Elle vient de quatre leviers :
 *
 *   · chaque élément est un mini-problème (14 lignes à valider caractère par
 *     caractère, pas 6 objets à reconnaître) ;
 *   · l'indice ne sort qu'après l'erreur — le moteur le fait déjà ;
 *   · des étapes enchaînées dans un seul écran (« Deviens l'ordinateur ») ;
 *   · une contrainte qui oblige à planifier : une affiche à reproduire à
 *     l'identique, étoiles comptées.
 *
 *   0. Ça tourne, ou ça casse ?        palier 1 — 14 lignes à valider     ~3 min
 *   1. Le rouge et son remède          palier 1 — 7 messages d'erreur     ~3 min
 *   2. Deviens l'ordinateur            palier 2 — la ligne se réécrit     ~3 min
 *   3. Les deux pannes                 palier 2 — dont une invisible      ~3 min
 *   4. Le programme raconté            palier 2 — ce qui s'affiche avant  ~3 min
 *   5. L'affiche du marché             palier 3 — reproduire à l'exact    ~6 min
 *   6. La machine qui te salue         palier 3 — input(), 3 lignes       ~5 min
 *
 * CE QUE LA SÉANCE 1 N'A PAS ENCORE ENSEIGNÉ, et qui est donc interdit ici :
 * les variables (séance 2 — « la ligne mystérieuse »), texte contre nombre,
 * str(), int(), les conditions, les boucles, les fonctions, l'indexation.
 * Un garde-fou plus bas relit tout le contenu visible et refuse ces mots.
 *
 * Seule exception, assumée : `prenom = input(...)` apparaît DÉJÀ dans le
 * programme de la séance, et la leçon dit « la semaine prochaine, on ouvre la
 * ligne mystérieuse ». L'exercice 6 la donne donc toute écrite dans l'amorce —
 * l'enfant s'en sert, il n'a pas à l'inventer.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } });
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "Mon premier programme";
const ETOILES = 16;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function g(t, c, f) {
  for (let i = 0; i < 5; i++) {
    let q = db.from(t).select(c); if (f) q = f(q);
    const { data, error } = await q;
    if (!error) return data;
    if (i === 4) throw new Error(`${t} : ${error.message}`);
    await pause(1500);
  }
}

const kodi = (html) => ({ type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p>${html}` } });
const jeu  = (content) => ({ type: "blockly_challenge", content });

// ── Les sept exercices ─────────────────────────────────────────────────────
const EXOS = [
  {
    palier: 1,
    title: "Ça tourne, ou ça casse ?",
    description: "Quatorze lignes. Une virgule de travers suffit.",
    blocs: [
      kodi("<p>Quatorze lignes, une par une. Certaines tournent, d'autres refusent de démarrer.</p><p>Regarde les guillemets, les parenthèses, et l'orthographe de <code>print</code>. Prends ton temps : c'est fait pour.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ça tourne, ou ça casse ?",
          instruction: "Range chaque ligne du bon côté.",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Chaque guillemet ouvert doit être refermé.",
              "Chaque parenthèse ouverte doit être refermée.",
              "print s'écrit tout en minuscules, sans faute de lettres.",
              "Les guillemets courbes « » du clavier ne comptent pas : Python veut les droits.",
            ],
          },
          categories: [
            { id: "ok", label: "Ça tourne", emoji: "✅", color: "#10b981" },
            { id: "ko", label: "Ça casse",  emoji: "💥", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣",  label: 'print("Salut")',            correct: "ok", hint: "Guillemets fermés, parenthèses fermées, print en minuscules : tout est là." },
            { id: "b", emoji: "2️⃣",  label: 'print(Salut)',              correct: "ko", hint: "Sans guillemets, Python cherche un mot qu'il ne connaît pas : NameError." },
            { id: "c", emoji: "3️⃣",  label: 'print("Salut"',             correct: "ko", hint: "La parenthèse ne se ferme jamais. Python attend la suite jusqu'au bout du fichier : SyntaxError." },
            { id: "d", emoji: "4️⃣",  label: 'Print("Salut")',            correct: "ko", hint: "Avec un P majuscule, ce n'est plus le même mot. Python ne connaît que print : NameError." },
            { id: "e", emoji: "5️⃣",  label: 'prnit("Salut")',            correct: "ko", hint: "Deux lettres inversées, et le mot n'existe plus : NameError." },
            { id: "f", emoji: "6️⃣",  label: 'print("J\'ai", 12)',        correct: "ok", hint: "Deux choses séparées par une virgule : Python les affiche à la suite, avec un espace entre." },
            { id: "g", emoji: "7️⃣",  label: 'print("Bonjour", "Kodi")',  correct: "ok", hint: "Même virgule, deux textes : Bonjour Kodi." },
            { id: "h", emoji: "8️⃣",  label: 'print "Salut"',             correct: "ko", hint: "print réclame ses parenthèses. Sans elles : SyntaxError." },
            { id: "i", emoji: "9️⃣",  label: 'print(«Salut»)',            correct: "ko", hint: "Les guillemets courbes du clavier ne comptent pas pour Python. Il veut les droits : \"." },
            { id: "j", emoji: "🔟",  label: 'print()',                   correct: "ok", hint: "Rien entre les parenthèses : ça affiche une ligne vide. C'est permis, et c'est utile." },
            { id: "k", emoji: "🅰️",  label: 'print("2 + 2")',            correct: "ok", hint: "Entre guillemets, c'est du texte : il affiche 2 + 2, il ne calcule rien." },
            { id: "l", emoji: "🅱️",  label: 'input("Ton prenom ? ")',    correct: "ok", hint: "input demande et attend ta réponse. Il ne plante pas." },
            { id: "m", emoji: "🆎",  label: 'print("Bonjour) "',          correct: "ko", hint: "La parenthèse est dedans, le guillemet dehors : tout est inversé. SyntaxError." },
            { id: "n", emoji: "🆑",  label: 'print("Il a dit "bonjour"")', correct: "ko", hint: "Le deuxième guillemet ferme déjà le texte. Python ne comprend plus la suite : SyntaxError." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Le rouge et son remède",
    description: "Sept messages d'erreur, sept gestes pour les réparer.",
    blocs: [
      kodi("<p>Le rouge n'est pas une punition : c'est le seul moment où la machine t'explique ce qui cloche.</p><p>À chaque message, son remède. Deux se ressemblent — lis-les jusqu'au bout.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque rouge et son remède",
          pairs: [
            { left: "NameError : 'Salut'",            right: "Mettre des guillemets autour du mot" },
            { left: "NameError : 'Print'",            right: "Écrire print tout en minuscules" },
            { left: "SyntaxError : texte non fermé",  right: "Fermer le guillemet" },
            { left: "SyntaxError : '(' jamais fermée", right: "Fermer la parenthèse" },
            { left: "SyntaxError : print sans parenthèses", right: "Entourer le texte de parenthèses" },
            { left: "SyntaxError : caractère « invalide", right: "Remplacer les guillemets courbes par \"" },
            { left: "IndentationError",               right: "Supprimer l'espace en début de ligne" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "La ligne se réécrit sous tes yeux, morceau par morceau.",
    blocs: [
      kodi("<p>Python ne lit pas une ligne d'un coup : il remplace chaque morceau par ce qu'il vaut, jusqu'à ce qu'il ne reste qu'une seule chose.</p><p>À chaque étape, dis ce que devient le morceau allumé. Regarde bien les espaces.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "Le + colle deux textes. Rien de plus.",
        ligne: 'print("Bonjour " + "Kodi" + " !")',
        etapes: [
          { expression: '"Bonjour " + "Kodi"', choix: ['"Bonjour Kodi"', '"BonjourKodi"', '"Bonjour + Kodi"'], valeur: '"Bonjour Kodi"',
            explication: "Le + colle les deux textes. L'espace était DANS le premier texte, il reste là." },
          { expression: '"Bonjour Kodi" + " !"', choix: ['"Bonjour Kodi !"', '"Bonjour Kodi!"', '"Bonjour Kodi + !"'], valeur: '"Bonjour Kodi !"',
            explication: "Encore un collage. L'espace avant le ! vient du texte \" !\"." },
        ],
        sortie: "Bonjour Kodi !",
      }),
    ],
  },

  {
    palier: 2,
    title: "Les deux pannes",
    description: "Une panne qui crie, une panne qui se cache.",
    blocs: [
      kodi("<p>Deux programmes, deux pannes. La première se voit. La seconde, il faut la chercher lettre par lettre.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "La panne qui crie",
        context: "Ce programme devait afficher trois lignes. Il n'en affiche qu'une, puis du rouge.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: 'print("Apporte ton cahier.")',
        explanation: "Le guillemet de fin manque. Python lit la suite du fichier comme du texte et finit par se plaindre. La ligne 1 s'était affichée : tout ce qui précède l'erreur a bien eu lieu.",
        instructions: [
          'print("Club de code")',
          'print("Rendez-vous mardi a 15h.")',
          'print("Apporte ton cahier.)',
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "La panne qui se cache",
        context: "Aucun guillemet ne manque, aucune parenthèse. Pourtant la troisième ligne ne s'affiche pas.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: 'print("On compte sur toi.")',
        explanation: "Un P majuscule, et ce n'est plus le même mot : Python ne connaît que print. NameError. C'est le genre de faute qu'on relit dix fois sans la voir.",
        instructions: [
          'print("Match de samedi")',
          'print("Rendez-vous a 14h.")',
          'Print("On compte sur toi.")',
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Il plante à la ligne 4. Qu'est-ce que l'écran a eu le temps de montrer ?",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de cinq lignes. Il contient une faute, une seule.</p>" +
            "<pre><code>1  print(\"=== CLUB DE CODE ===\")\n" +
            "2  print(\"Seance du samedi\")\n" +
            "3  print()\n" +
            "4  print(Bienvenue)\n" +
            "5  print(\"=== FIN ===\")</code></pre>" +
            "<p>Ne le répare pas. Raconte-le : six phrases à compléter.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte ce qui se passe",
          sentences: [
            { id: "s1", before: "La faute est à la ligne", after: ".", options: ["4", "1", "5"], correct: 0,
              explanation: "Bienvenue n'a pas de guillemets. Python le prend pour le nom de quelque chose qu'il devrait connaître." },
            { id: "s2", before: "Le rouge dira", after: ".", options: ["NameError", "SyntaxError", "IndentationError"], correct: 0,
              explanation: "Les guillemets sont tous en place : la forme est bonne. C'est le MOT que Python ne connaît pas — NameError." },
            { id: "s3", before: "Avant de planter, l'écran a montré", after: "lignes.", options: ["3", "0", "5"], correct: 0,
              explanation: "Les lignes 1, 2 et 3 se sont exécutées — la 3 affiche une ligne vide, mais elle s'est exécutée." },
            { id: "s4", before: "La ligne 5", after: ".", options: ["ne s'affichera pas", "s'affichera quand même", "s'affichera deux fois"], correct: 0,
              explanation: "Python s'arrête à la première erreur. Tout ce qui vient après n'a pas lieu." },
            { id: "s5", before: "Pour réparer, il faut", after: ".", options: ["mettre des guillemets autour de Bienvenue", "supprimer la ligne 3", "ajouter une parenthèse"], correct: 0,
              explanation: "Entre guillemets, Bienvenue devient du texte à afficher. C'est tout ce qui manquait." },
            { id: "s6", before: "La ligne 3, print() tout seul, affiche", after: ".", options: ["une ligne vide", "le mot print", "rien du tout"], correct: 0,
              explanation: "Rien entre les parenthèses : Python passe à la ligne suivante de l'écran. C'est comme ça qu'on aère un affichage." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "L'affiche du marché",
    description: "Reproduire à l'identique. Compte tes étoiles.",
    blocs: [
      kodi("<p>Tu vas refaire cette affiche <strong>exactement</strong>, avec des <code>print</code>.</p><p>Les lignes d'étoiles en font <strong>seize</strong>, ni quinze ni dix-sept. Compte-les avant d'écrire, pas après.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Reproduis cette affiche, une ligne par print :\n" +
            "****************\n" +
            "*  MARCHE DE LOME\n" +
            "*  Ouvert a 7 h\n" +
            "*  Ferme a 18 h\n" +
            "****************\n" +
            "Les deux lignes d'etoiles en font seize chacune.",
          starter_code: '# Cinq lignes. La premiere et la derniere sont seize etoiles.\n',
          hidden_tests:
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'assert len(lignes) >= 5, "Il faut cinq lignes. Ton programme en affiche " + str(len(lignes)) + "."\n' +
            'etoiles = [l for l in lignes if set(l.strip()) == {"*"}]\n' +
            'assert len(etoiles) >= 2, "Il manque une ligne d etoiles."\n' +
            'for l in etoiles:\n' +
            '    n = l.strip().count("*")\n' +
            `    assert n == ${ETOILES}, "Une ligne d etoiles en compte " + str(n) + " au lieu de ${ETOILES}. Recompte."\n` +
            'assert lignes[0].strip().count("*") == ' + ETOILES + ', "L affiche commence par la ligne d etoiles."\n' +
            'assert lignes[-1].strip().count("*") == ' + ETOILES + ', "L affiche finit par la ligne d etoiles."\n' +
            'for mot in ["MARCHE DE LOME", "Ouvert a 7 h", "Ferme a 18 h"]:\n' +
            '    assert mot in output, "Il manque : " + mot\n' +
            'milieu = [l for l in lignes[1:-1]]\n' +
            'for l in milieu:\n' +
            '    assert l.lstrip().startswith("*"), "Chaque ligne du milieu commence par une etoile : " + l',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "La machine qui te salue",
    description: "Elle demande ton prénom, puis elle te répond.",
    blocs: [
      kodi("<p>Cette fois ton programme <strong>demande</strong> quelque chose, et se sert de la réponse.</p><p>La première ligne est déjà écrite — c'est la ligne mystérieuse de la séance, tu l'ouvriras la semaine prochaine. Ici, sers-t'en.</p><p>Trois lignes affichées au moins, dont une qui contient le prénom.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Le programme demande le prenom, puis affiche au moins trois lignes — dont une qui salue la personne par son prenom. Colle-le a ton texte avec un + ou une virgule, comme tu preferes.",
          starter_code:
            'prenom = input("Ton prenom ? ")\n\n# A toi : au moins trois print, dont un qui contient prenom\n',
          hidden_tests:
            'assert "input(" in code, "Garde la ligne qui demande le prenom."\n' +
            'assert code.count("print(") >= 3, "Il faut au moins trois print. Ton programme en a " + str(code.count("print(")) + "."\n' +
            // Chercher « prenom » après input( trouvait le mot dans l invite
            // « Ton prenom ? » : le test se validait tout seul. C est une ligne
            // print qui doit s en servir.
            'lignes_code = [l for l in code.split("\\n") if "print(" in l]\n' +
            'assert any("prenom" in l for l in lignes_code), "Un de tes print doit utiliser prenom — le nom donne dans l amorce — sinon la machine ne salue personne."\n' +
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'assert len(lignes) >= 3, "Ton programme affiche " + str(len(lignes)) + " ligne(s) au lieu de trois."',
        },
      },
    ],
  },
];

// ── Garde-fous ─────────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };

// 1. Sept exercices, paliers 1-1-2-2-2-3-3.
const PALIERS_ATTENDUS = [1, 1, 2, 2, 2, 3, 3];
if (EXOS.length !== 7) mauvais(`${EXOS.length} exercices au lieu de 7`);
EXOS.forEach((e, i) => { if (e.palier !== PALIERS_ATTENDUS[i]) mauvais(`[${i}] ${e.title} : palier ${e.palier}, attendu ${PALIERS_ATTENDUS[i]}`); });

// 2. Le vocabulaire que la séance 1 n'a pas enseigné n'apparaît nulle part
//    dans ce que l'enfant voit. Les tests cachés sont exclus : ils sont écrits
//    pour la machine, pas pour lui.
// `(?<!=)==(?!=)` : le vrai opérateur de comparaison, sans mordre sur les
// « === TITRE === » que la leçon elle-même utilise pour décorer.
const INTERDITS = [/\bfor\b/, /\bwhile\b/, /\bdef\b/, /\bif\b/, /\belif\b/, /\belse\s*:/, /\brange\(/, /\bstr\(/, /\bint\(/, /\bfloat\(/, /\.append/, /(?<!=)==(?!=)/, /\[\s*0\s*\]/];
for (const e of EXOS) {
  for (const b of e.blocs) {
    const visible = JSON.stringify({ ...b.content, hidden_tests: undefined });
    for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx} — pas encore enseigné en séance 1`);
  }
}

// 3. Les jeux de substitution doivent avoir une issue.
for (const e of EXOS) {
  for (const b of e.blocs) {
    const c = b.content;
    if (c?.game_type !== "deviens_ordinateur") continue;
    let ligne = c.ligne;
    c.etapes.forEach((et, i) => {
      if (!et.choix.includes(et.valeur)) mauvais(`${e.title} étape ${i + 1} : « ${et.valeur} » absente des pastilles`);
      if (ligne.indexOf(et.expression) === -1) { mauvais(`${e.title} étape ${i + 1} : « ${et.expression} » introuvable dans la ligne`); return; }
      ligne = ligne.replace(et.expression, et.valeur);
    });
    const attendu = `print("${c.sortie}")`;
    if (ligne !== attendu) mauvais(`${e.title} : la ligne finit sur ${ligne}, la sortie annoncée est ${c.sortie}`);
  }
}

// 4. La chasse au bug doit viser une ligne qui existe, et la réparer.
for (const e of EXOS) {
  for (const b of e.blocs) {
    const c = b.content;
    if (c?.game_type !== "bug_hunt") continue;
    if (!Number.isInteger(c.bug_index) || !c.instructions[c.bug_index]) mauvais(`${e.title} / ${c.title} : bug_index hors des lignes`);
    else if (c.instructions[c.bug_index] === c.fix) mauvais(`${e.title} / ${c.title} : la réparation est identique à la ligne fautive`);
  }
}

// 5. Chaque élément à trier porte son indice, chaque phrase à trous sa réponse.
for (const e of EXOS) {
  for (const b of e.blocs) {
    const c = b.content ?? {};
    (c.items ?? []).forEach((it) => { if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`); });
    (c.items ?? []).forEach((it) => {
      const cats = (c.categories ?? c.bins ?? []).map((x) => x.id);
      if (cats.length && !cats.includes(it.correct)) mauvais(`${e.title} : « ${it.label} » pointe vers un bac inexistant (${it.correct})`);
    });
    (c.sentences ?? []).forEach((s) => {
      if (!s.options[s.correct]) mauvais(`${e.title} : phrase ${s.id} sans bonne réponse`);
      if (!s.explanation) mauvais(`${e.title} : phrase ${s.id} sans explication`);
    });
    // Le rappel du swipe_sort n'est pas une phrase : le lecteur affiche
    // `helper.title` et parcourt `helper.criteria`. Une chaîne passait la
    // migration, s'affichait sans titre, et plantait au premier clic.
    if (c.helper !== undefined) {
      const h = c.helper;
      if (typeof h !== "object" || !h.title || !Array.isArray(h.criteria) || !h.criteria.length)
        mauvais(`${e.title} : helper doit être { title, criteria[] } — reçu ${typeof h}`);
    }
    const gauches = (c.pairs ?? []).map((p) => p.left);
    if (gauches.length !== new Set(gauches).size) mauvais(`${e.title} : deux paires portent la même gauche`);
  }
}

// 6. L'affiche : ce que la consigne montre et ce que le test exige doivent
//    compter le même nombre d'étoiles.
const affiche = EXOS.find((e) => e.title === "L'affiche du marché").blocs.find((b) => b.type === "code_challenge").content;
const lignesEtoiles = affiche.instructions.split("\n").filter((l) => l.trim() && [...new Set(l.trim())].join("") === "*");
if (lignesEtoiles.length !== 2) mauvais(`la consigne de l'affiche montre ${lignesEtoiles.length} ligne(s) d'étoiles, il en faut 2`);
for (const l of lignesEtoiles) if (l.trim().length !== ETOILES) mauvais(`la consigne montre une ligne de ${l.trim().length} étoiles, le test en exige ${ETOILES}`);

// 7. Une amorce ne doit jamais laisser un bloc vide ouvert (un `:` suivi de
//    rien fait planter Pyodide avant même que l'enfant écrive).
for (const e of EXOS) {
  for (const b of e.blocs) {
    const sc = b.content?.starter_code;
    if (sc && /:\s*\n(\s*#[^\n]*\n)*\s*$/.test(sc)) mauvais(`${e.title} : l'amorce finit sur un bloc vide`);
  }
}

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);

// ── Le banc : bonnes et mauvaises solutions des défis de code ───────────────
//
// `node scripts/terrain-batisseur-s1.mjs --banc | python3 scripts/banc-correcteur.py`
// Un test caché qui ne recale pas une mauvaise réponse ne sert à rien : chaque
// défi est donc rejoué avec une solution juste ET avec des solutions fausses,
// et le verdict attendu est écrit ici.
const E16 = "*".repeat(ETOILES);
const SOLUTIONS = {
  "L'affiche du marché": {
    reponses: [],
    cas: [
      { nom: "juste", attendu: "ok", code:
        `print("${E16}")\nprint("*  MARCHE DE LOME")\nprint("*  Ouvert a 7 h")\nprint("*  Ferme a 18 h")\nprint("${E16}")\n` },
      { nom: "quinze étoiles", attendu: "test raté", code:
        `print("${"*".repeat(ETOILES - 1)}")\nprint("*  MARCHE DE LOME")\nprint("*  Ouvert a 7 h")\nprint("*  Ferme a 18 h")\nprint("${"*".repeat(ETOILES - 1)}")\n` },
      { nom: "une ligne oubliée", attendu: "test raté", code:
        `print("${E16}")\nprint("*  MARCHE DE LOME")\nprint("*  Ouvert a 7 h")\nprint("${E16}")\n` },
      { nom: "étoile manquante au milieu", attendu: "test raté", code:
        `print("${E16}")\nprint("MARCHE DE LOME")\nprint("*  Ouvert a 7 h")\nprint("*  Ferme a 18 h")\nprint("${E16}")\n` },
    ],
  },
  "La machine qui te salue": {
    reponses: ["Ama"],
    cas: [
      { nom: "juste, avec un +", attendu: "ok", code:
        'prenom = input("Ton prenom ? ")\nprint("Bonjour " + prenom + " !")\nprint("Bienvenue au club de code.")\nprint("On se voit mardi.")\n' },
      { nom: "juste, avec une virgule", attendu: "ok", code:
        'prenom = input("Ton prenom ? ")\nprint("Bonjour", prenom)\nprint("Bienvenue au club de code.")\nprint("On se voit mardi.")\n' },
      { nom: "deux print seulement", attendu: "test raté", code:
        'prenom = input("Ton prenom ? ")\nprint("Bonjour " + prenom)\nprint("A mardi.")\n' },
      { nom: "ne salue personne", attendu: "test raté", code:
        'prenom = input("Ton prenom ? ")\nprint("Bonjour")\nprint("Bienvenue au club.")\nprint("A mardi.")\n' },
      { nom: "la demande supprimée", attendu: "test raté", code:
        'print("Bonjour")\nprint("Bienvenue au club.")\nprint("A mardi.")\n' },
    ],
  },
};

if (process.argv.includes("--banc")) {
  const cas = [];
  for (const e of EXOS) {
    for (const b of e.blocs) {
      if (b.type !== "code_challenge") continue;
      const s = SOLUTIONS[e.title];
      if (!s) throw new Error(`${e.title} : défi de code sans solutions de référence`);
      for (const c of s.cas) cas.push({ code: c.code, tests: b.content.hidden_tests, reponses: s.reponses, nom: `${e.title} — ${c.nom}`, attendu: c.attendu });
    }
  }
  // Le banc ignore les clés qu'il ne connaît pas : le nom et le verdict
  // attendu voyagent donc avec le cas, et rien ne se perd en route.
  console.log(JSON.stringify(cas));
  process.exit(0);
}

console.log("✓ 7 exercices, paliers 1-1-2-2-2-3-3");
console.log("✓ aucun mot non enseigné en séance 1 dans ce que l'enfant voit");
console.log("✓ substitutions, chasses au bug, indices, phrases à trous : tous vérifiés");
console.log(`✓ l'affiche : ${ETOILES} étoiles dans la consigne comme dans le test`);

// ── Application ────────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];

const colonnes = await g("trainings", "id,libre_service,palier", (q) => q.eq("lesson_id", L.id)).catch(() => null);
if (!colonnes) throw new Error("La migration 039 n'est pas passée : trainings.libre_service est absente.");
const dejaTerrain = colonnes.filter((t) => t.libre_service);
if (dejaTerrain.length && !process.argv.includes("--refaire"))
  throw new Error(`${dejaTerrain.length} exercice(s) de Terrain existent déjà sur cette séance — ce script n'écrase pas (--refaire pour les remplacer)`);
if (dejaTerrain.length) {
  // On ne refait un lot que tant qu'aucun enfant n'y a touché : sinon on
  // effacerait sa progression sans le lui dire.
  const joues = await g("training_progress", "id,training_id", (q) => q.in("training_id", dejaTerrain.map((t) => t.id)));
  if (joues.length) throw new Error(`${joues.length} progression(s) d'élève sur ce lot — --refaire est refusé, il faudrait effacer leur travail`);
  if (!ECRIRE) console.log(`(--refaire : ${dejaTerrain.length} exercices seraient remplacés, aucun élève n'y a joué)`);
  else {
    const { error } = await db.from("trainings").delete().in("id", dejaTerrain.map((t) => t.id));
    if (error) throw new Error(`suppression : ${error.message}`);
    console.log(`  ⟲ ${dejaTerrain.length} exercices remplacés (personne n'y avait joué)`);
  }
}
const parcours = colonnes.filter((t) => !t.libre_service);

// Le Terrain se range après le parcours, et n'entre pas dans sa numérotation.
const DEPART = 100;

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${EXOS.length} exercices de Terrain`);
console.log(`Séance « ${L.title} » — ${parcours.length} exercices de parcours conservés intacts\n`);
EXOS.forEach((e, i) =>
  console.log(`  [P${e.palier}] ${e.title.padEnd(26)} ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

for (const [i, e] of EXOS.entries()) {
  const { data, error } = await db.from("trainings").insert({
    lesson_id: L.id, title: e.title, description: e.description,
    xp_reward: 0, libre_service: true, palier: e.palier, order_index: DEPART + i,
  }).select("id").single();
  if (error) throw new Error(`${e.title} : ${error.message}`);
  const { error: eb } = await db.from("training_blocks").insert(
    e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j })),
  );
  if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
  console.log(`  ✓ [P${e.palier}] ${e.title}`);
}

// ── Relecture ──────────────────────────────────────────────────────────────
let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = await g("trainings", "id,title,palier,libre_service,xp_reward,order_index",
  (q) => q.eq("lesson_id", L.id).eq("libre_service", true).order("order_index"));
ok(ap.length === 7, `7 exercices de Terrain (trouvé ${ap.length})`);
ok(ap.every((e) => e.xp_reward === 0), "aucun ne paie en XP");
ok(ap.every((e) => [1, 2, 3].includes(e.palier)), "tous ont un palier");
ok(ap.map((e) => e.order_index).every((v, i) => v === DEPART + i), "numérotation contiguë à partir de 100");
const restes = await g("trainings", "id", (q) => q.eq("lesson_id", L.id).eq("libre_service", false));
ok(restes.length === parcours.length, `les ${parcours.length} exercices du parcours sont intacts`);
for (const e of ap) {
  const tb = await g("training_blocks", "order_index,type,content", (q) => q.eq("training_id", e.id).order("order_index"));
  const bon = tb.length > 0
    && tb.map((b) => b.order_index).every((v, i) => v === i)
    && tb.every((b) => b.content && Object.keys(b.content).length);
  ok(bon, `${e.title} — ${tb.length} blocs contigus et remplis`);
}
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
