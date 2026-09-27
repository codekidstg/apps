/**
 * Le Terrain — Explorateur, séance 1 « L'ordinateur, la machine magique ».
 *
 *     node scripts/terrain-explorateur-s1.mjs            aperçu
 *     node scripts/terrain-explorateur-s1.mjs --ecrire   applique
 *     node scripts/terrain-explorateur-s1.mjs --refaire --ecrire   remplace
 *
 * Sept exercices en libre service, deux à trois minutes chacun, sur la même
 * réserve que le parcours mais par l'autre porte.
 *
 * La difficulté ici ne peut pas venir du code : à cette séance, l'enfant n'a
 * pas écrit une seule ligne. Elle vient donc des SITUATIONS — un feu de
 * circulation est-il un ordinateur ? qu'est-ce qui survit à une coupure de
 * courant à Lomé ? — et chaque élément demande de raisonner, pas de
 * reconnaître. C'est ça qui fait tenir trois minutes.
 *
 *   0. Ordinateur, ou pas ?          palier 1 — 14 objets du quotidien   ~3 min
 *   1. Le chemin de l'information    palier 1 — 8 paires, deux pièges    ~3 min
 *   2. Entrée, sortie, ou les deux ? palier 2 — 12 appareils, 3 bacs     ~3 min
 *   3. Quand le courant saute        palier 2 — 12 situations vécues     ~3 min
 *   4. Le voyage d'une touche        palier 2 — la chaîne, en 6 étapes   ~3 min
 *   5. Les deux pannes de Kirikou    palier 3 — diagnostiquer            ~3 min
 *   6. Le plan de la salle           palier 3 — produire un plan juste   ~3 min
 *
 * CE QUE LA SÉANCE 1 N'A PAS ENCORE ENSEIGNÉ, et qui est donc interdit ici :
 * toute ligne de code, la boucle et la répétition (séance 5), le mot
 * « algorithme » (séance 2), les blocs de programmation. Un garde-fou relit
 * tout ce que l'enfant voit et refuse ces mots.
 *
 * Le moteur « Deviens l'ordinateur » n'est pas utilisé ici, malgré son nom :
 * c'est une machine à substitution de code (`triple(4)` devient `12`). À cette
 * séance il n'y a rien à substituer. La chaîne se déroule donc en six phrases
 * à trous — même intention, moteur qui va avec.
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
const LECON = "L'ordinateur, la machine magique";

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

const EXOS = [
  {
    palier: 1,
    title: "Ordinateur, ou pas ?",
    description: "Quatorze objets. Certains cachent bien leur jeu.",
    blocs: [
      kodi("<p>Un ordinateur fait trois choses : il <strong>reçoit</strong>, il <strong>traite</strong>, il <strong>produit</strong>.</p><p>Les trois, sinon ce n'en est pas un. Quatorze objets t'attendent — plusieurs sont des ordinateurs qui ne ressemblent pas à des ordinateurs.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ordinateur, ou pas ?",
          instruction: "Range chaque objet du bon côté.",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Est-ce qu'il REÇOIT quelque chose ? (un appui, une carte, une mesure)",
              "Est-ce qu'il DÉCIDE, qu'il calcule quelque chose avec ?",
              "Est-ce qu'il PRODUIT un résultat ? (une image, un son, un mouvement)",
              "Les trois → c'est un ordinateur. Il en manque un → ce n'en est pas un.",
            ],
          },
          categories: [
            { id: "oui", label: "C'est un ordinateur", emoji: "🧠", color: "#10b981" },
            { id: "non", label: "Ce n'en est pas un",  emoji: "🔧", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "📱", label: "Un smartphone",                    correct: "oui", hint: "Processeur, mémoire, écran : c'est l'ordinateur numéro un en Afrique." },
            { id: "b", emoji: "🍲", label: "Une marmite",                      correct: "non", hint: "Elle chauffe. Elle ne reçoit aucune information et ne décide rien." },
            { id: "c", emoji: "🚦", label: "Un feu de circulation",            correct: "oui", hint: "Il reçoit le temps qui passe, il décide qui passe, il allume. Un ordinateur caché." },
            { id: "d", emoji: "🏧", label: "Un distributeur de billets",       correct: "oui", hint: "Il reçoit ta carte et ton code, il vérifie, il produit des billets. Les trois y sont." },
            { id: "e", emoji: "🪡", label: "Une machine à coudre à pédale",    correct: "non", hint: "C'est ton pied qui donne la force. Rien ne calcule là-dedans." },
            { id: "f", emoji: "🧮", label: "Une calculatrice",                 correct: "oui", hint: "Tu entres des nombres, elle calcule, elle affiche. Petit, mais complet." },
            { id: "g", emoji: "🔦", label: "Une lampe torche",                 correct: "non", hint: "Un interrupteur et une ampoule. Personne ne décide rien." },
            { id: "h", emoji: "📺", label: "Une télévision connectée",         correct: "oui", hint: "Elle installe des applications : elle a donc un processeur et de la mémoire." },
            { id: "i", emoji: "⌚", label: "Une montre à aiguilles",           correct: "non", hint: "Des engrenages qui tournent toujours pareil. Aucune information traitée." },
            { id: "j", emoji: "🎮", label: "Une console de jeux",              correct: "oui", hint: "Un ordinateur fait pour jouer : la manette entre, l'image et le son sortent." },
            { id: "k", emoji: "🚲", label: "Un vélo",                          correct: "non", hint: "De la mécanique, rien que de la mécanique." },
            { id: "l", emoji: "✈️", label: "Le pilote automatique d'un avion", correct: "oui", hint: "Il reçoit la position, il calcule la route, il commande l'avion." },
            { id: "m", emoji: "📻", label: "Une radio à transistor",           correct: "non", hint: "Le piège : elle reçoit une onde et produit du son, mais elle ne DÉCIDE rien au milieu." },
            { id: "n", emoji: "🛗", label: "Un ascenseur qui choisit son étage", correct: "oui", hint: "Plusieurs personnes appuient, il décide dans quel ordre s'arrêter. C'est bien une décision." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Le chemin de l'information",
    description: "Chaque morceau de la machine, et ce qu'il fait vraiment.",
    blocs: [
      kodi("<p>Dans un ordinateur, chaque partie a UN rôle, et un seul.</p><p>Deux d'entre elles se ressemblent beaucoup — celle qui oublie et celle qui garde. Lis jusqu'au bout avant de relier.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque partie et son rôle",
          instruction: "Touche une partie de l'ordinateur, puis le rôle qui lui va.",
          left_label: "La partie",
          right_label: "Son rôle",
          pairs: [
            { left: "🧠 Le processeur",   right: "Il calcule et il décide" },
            { left: "📋 La mémoire RAM",  right: "Elle oublie tout quand on éteint" },
            { left: "🎒 Le disque (SSD)", right: "Il garde, même éteint" },
            { left: "⌨️ Le clavier",       right: "Tes frappes entrent" },
            { left: "🔊 Le haut-parleur", right: "Le son sort" },
            { left: "📷 La webcam",       right: "Ton image entre" },
            { left: "📱 L'écran tactile", right: "Il affiche ET il sent tes doigts" },
            { left: "🖨️ L'imprimante",     right: "Le papier sort" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Entrée, sortie, ou les deux ?",
    description: "Douze appareils — trois d'entre eux font les deux.",
    blocs: [
      kodi("<p>Ce qui ENTRE dans l'ordinateur, c'est une entrée. Ce qui EN SORT, une sortie.</p><p>Et trois de ces appareils font les deux à la fois. À toi de les débusquer.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Entrée, sortie, ou les deux ?",
          instruction: "Choisis un appareil, puis son bac.",
          bins: [
            { id: "in",   emoji: "🔵", label: "Entrée",   color: "#3b82f6" },
            { id: "out",  emoji: "🟠", label: "Sortie",   color: "#f97316" },
            { id: "both", emoji: "🟣", label: "Les deux", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "⌨️", label: "Le clavier",            correct: "in",   hint: "Tes frappes entrent dans la machine." },
            { id: "b", emoji: "🖱️", label: "La souris",             correct: "in",   hint: "Tes clics et tes mouvements entrent." },
            { id: "c", emoji: "🎤", label: "Le microphone",         correct: "in",   hint: "Ta voix entre." },
            { id: "d", emoji: "📷", label: "La webcam",             correct: "in",   hint: "Ton image entre." },
            { id: "e", emoji: "🕹️", label: "La manette",            correct: "in",   hint: "Ce que tu appuies entre." },
            { id: "f", emoji: "🖥️", label: "L'écran",               correct: "out",  hint: "L'image sort de la machine vers tes yeux." },
            { id: "g", emoji: "🔊", label: "Le haut-parleur",       correct: "out",  hint: "Le son sort." },
            { id: "h", emoji: "🖨️", label: "L'imprimante",          correct: "out",  hint: "Le papier sort." },
            { id: "i", emoji: "💡", label: "Le voyant lumineux",    correct: "out",  hint: "Il te dit quelque chose : ça sort." },
            { id: "j", emoji: "📱", label: "L'écran tactile",       correct: "both", hint: "Il affiche (sortie) ET il sent tes doigts (entrée). Le double champion." },
            { id: "k", emoji: "🎧", label: "Le casque à micro",     correct: "both", hint: "L'écouteur fait sortir le son, le micro fait entrer ta voix." },
            { id: "l", emoji: "🖨️", label: "L'imprimante-scanner",  correct: "both", hint: "Elle imprime (sortie) et elle scanne une feuille (entrée)." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Quand le courant saute",
    description: "Douze situations. Qu'est-ce qui survit ?",
    blocs: [
      kodi("<p>Le courant saute — ça arrive. L'ordinateur s'éteint d'un coup.</p><p>Pour chaque situation, dis ce qui est encore là au rallumage. Souviens-toi de celle qui oublie et de celui qui garde.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ça reste, ou c'est perdu ?",
          instruction: "Le courant saute maintenant. Et ça ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Ce qui est seulement OUVERT, en cours, pas encore enregistré → c'est dans la RAM.",
              "La RAM s'efface dès que le courant s'en va.",
              "Ce qui a été ENREGISTRÉ, téléchargé, installé → c'est sur le disque.",
              "Le disque garde, même éteint.",
            ],
          },
          categories: [
            { id: "reste", label: "C'est encore là", emoji: "🎒", color: "#10b981" },
            { id: "perdu", label: "C'est perdu",     emoji: "💨", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "📝", label: "Le devoir que tu tapes depuis 20 minutes, jamais enregistré", correct: "perdu", hint: "Il n'a jamais quitté la RAM. C'est la mésaventure la plus courante du monde." },
            { id: "b", emoji: "📸", label: "La photo prise ce matin, déjà dans la galerie",               correct: "reste", hint: "Une photo part directement sur le disque." },
            { id: "c", emoji: "🎮", label: "La partie en cours, pas sauvegardée",                         correct: "perdu", hint: "Une partie en cours vit dans la RAM tant qu'on ne sauvegarde pas." },
            { id: "d", emoji: "🎵", label: "La chanson téléchargée hier",                                 correct: "reste", hint: "Téléchargée veut dire écrite sur le disque." },
            { id: "e", emoji: "📋", label: "Le texte que tu viens de copier, prêt à coller",                correct: "perdu", hint: "Le presse-papier vit dans la RAM. Au rallumage, il n'y a plus rien à coller." },
            { id: "f", emoji: "📱", label: "L'application installée la semaine dernière",                 correct: "reste", hint: "Installer, c'est écrire sur le disque." },
            { id: "g", emoji: "🌐", label: "Les dix pages ouvertes dans le navigateur",                   correct: "perdu", hint: "Des pages ouvertes occupent la RAM — c'est même pour ça que l'ordi ralentit." },
            { id: "h", emoji: "📇", label: "Les contacts du téléphone",                                   correct: "reste", hint: "Ils sont enregistrés, pas seulement affichés." },
            { id: "i", emoji: "🧮", label: "Le calcul à moitié tapé sur la calculatrice",                 correct: "perdu", hint: "Rien n'est enregistré : tout est en cours." },
            { id: "j", emoji: "🎬", label: "La vidéo téléchargée pour la regarder hors ligne",            correct: "reste", hint: "Téléchargée, donc sur le disque." },
            { id: "k", emoji: "📄", label: "Le devoir enregistré hier soir",                              correct: "reste", hint: "Enregistré : il est sur le disque, il t'attend." },
            { id: "l", emoji: "⏱️", label: "La minuterie de 10 minutes en train de tourner",                correct: "perdu", hint: "Elle compte dans la RAM. Au rallumage, plus de minuterie — il faut la relancer." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le voyage d'une touche",
    description: "Tu appuies sur A. Raconte tout ce qui se passe ensuite.",
    blocs: [
      kodi("<p>Tu appuies sur la touche <strong>A</strong>. Une seconde plus tard, un A apparaît à l'écran.</p><p>Entre les deux, il s'est passé beaucoup de choses. Raconte-les dans l'ordre.</p>"),
      {
        type: "fill_blank",
        content: {
          title: "Le voyage d'une touche",
          instruction: "Touche le bon mot pour compléter chaque phrase. Elles sont dans l'ordre du voyage.",
          sentences: [
            { id: "s1", before: "Quand tu appuies sur la touche, le clavier est une", after: ".",
              options: ["entrée", "sortie", "mémoire"], correct: 0,
              explanation: "Tout ce qui va vers la machine est une entrée." },
            { id: "s2", before: "L'information part vers le", after: ", qui décide quoi en faire.",
              options: ["processeur", "haut-parleur", "disque"], correct: 0,
              explanation: "Le processeur est le seul qui décide. Les autres exécutent ou rangent." },
            { id: "s3", before: "Pendant que tu écris, ton texte est gardé dans la", after: ".",
              options: ["mémoire RAM", "webcam", "imprimante"], correct: 0,
              explanation: "La RAM, c'est le bureau : le travail en cours y est posé." },
            { id: "s4", before: "La lettre qui apparaît à l'écran est une", after: ".",
              options: ["sortie", "entrée", "décision"], correct: 0,
              explanation: "Elle sort de la machine vers toi." },
            { id: "s5", before: "Pour retrouver ton texte demain, il faut l'enregistrer sur le", after: ".",
              options: ["disque", "clavier", "écran"], correct: 0,
              explanation: "Seul le disque garde quand le courant s'en va." },
            { id: "s6", before: "Si le courant saute avant que tu aies enregistré, ton texte est", after: ".",
              options: ["perdu", "sur le disque", "dans l'imprimante"], correct: 0,
              explanation: "Il n'était que dans la RAM. C'est pour ça qu'on enregistre souvent." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Les deux pannes de Kirikou",
    description: "Deux explications, deux lignes fausses. À toi de les trouver.",
    blocs: [
      kodi("<p>Kirikou est un ordinateur, lui aussi : tes blocs entrent, son processeur décide, il se déplace.</p><p>Voici deux explications de panne. Chacune contient <strong>une seule</strong> ligne fausse.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Kirikou ne bouge plus",
        context: "Tu as posé tes blocs, et Kirikou reste immobile. Quelqu'un explique pourquoi. Une ligne est fausse.",
        description: "Clique sur la ligne qui ne va pas.",
        bug_index: 2,
        fix: "Le processeur envoie l'ordre aux roues.",
        explanation: "L'écran ne commande rien du tout : il affiche, c'est une sortie. C'est le processeur qui décide et qui commande.",
        instructions: [
          "Tes blocs entrent dans Kirikou : c'est une entrée.",
          "Son processeur lit les blocs et décide.",
          "L'écran envoie l'ordre au processeur.",
          "Kirikou se déplace : c'est une sortie.",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Le travail disparu",
        context: "La tablette s'est éteinte pendant la séance. Au rallumage, le travail de Kirikou avait disparu. Une ligne de l'explication est fausse.",
        description: "Clique sur la ligne qui ne va pas.",
        bug_index: 1,
        fix: "La RAM s'efface dès qu'on éteint.",
        explanation: "C'est l'inverse : la RAM oublie tout à l'extinction. Seul le disque garde. Rien n'ayant été enregistré, il ne restait rien.",
        instructions: [
          "Le travail était gardé dans la mémoire RAM.",
          "La RAM garde tout, même éteinte.",
          "Rien n'avait été enregistré sur le disque.",
          "Au rallumage, il ne restait rien.",
        ],
      }),
    ],
  },

  {
    palier: 3,
    title: "Le plan de la salle",
    description: "Cinq gestes dans le bon ordre — et deux pièges.",
    blocs: [
      kodi("<p>Dernier défi : écris le plan d'une séance à la salle informatique, du début à la fin.</p><p>Deux cartes sont là pour te piéger. Une seule chose compte vraiment : ce qui n'est pas enregistré n'existe pas.</p>"),
      jeu({
        game_type: "plan_builder",
        title: "Le plan de la salle informatique",
        description: "Sept cartes, cinq bonnes. Deux sont des pièges : laisse-les de côté.",
        consigne: "Tu arrives en salle informatique, tu écris ton devoir, tu repars. Touche les cinq bonnes étapes, dans l'ordre.",
        phases: [
          "Allumer l'ordinateur",
          "Ouvrir le programme",
          "Écrire son travail",
          "Enregistrer sur le disque",
          "Éteindre l'ordinateur",
        ],
        distracteurs: [
          "Éteindre avant d'enregistrer",
          "Débrancher la prise pour aller plus vite",
        ],
        explanation: "Enregistrer vient toujours avant éteindre : ce qui n'est que dans la RAM part avec le courant. Et débrancher, c'est exactement la coupure qu'on redoute.",
      }),
    ],
  },
];

// ── Garde-fous ─────────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };

const PALIERS_ATTENDUS = [1, 1, 2, 2, 2, 3, 3];
if (EXOS.length !== 7) mauvais(`${EXOS.length} exercices au lieu de 7`);
EXOS.forEach((e, i) => { if (e.palier !== PALIERS_ATTENDUS[i]) mauvais(`[${i}] ${e.title} : palier ${e.palier}, attendu ${PALIERS_ATTENDUS[i]}`); });

// À cette séance, l'enfant n'a pas écrit une ligne de code, ni vu une boucle,
// ni entendu le mot « algorithme ». Rien de tout ça ne doit apparaître.
const INTERDITS = [/print\(/, /\bdef\b/, /\bfor\b/, /\bwhile\b/, /\brange\(/, /\bpython\b/i,
                   /\bboucle\b/i, /répéter/i, /\balgorithme\b/i, /\bvariable\b/i];
for (const e of EXOS) {
  for (const b of e.blocs) {
    const visible = JSON.stringify(b.content);
    for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx} — pas encore vu en séance 1`);
  }
}

for (const e of EXOS) {
  for (const b of e.blocs) {
    const c = b.content ?? {};

    // Le rappel : `{ title, criteria[] }`, jamais une phrase. Une chaîne
    // s'affichait sans titre et plantait la page au premier clic.
    if (c.helper !== undefined) {
      const h = c.helper;
      if (typeof h !== "object" || !h.title || !Array.isArray(h.criteria) || !h.criteria.length)
        mauvais(`${e.title} : helper doit être { title, criteria[] }`);
    }

    // Chaque élément à trier porte son indice et vise un bac qui existe.
    // `swipe_sort` lit `categories`, `drag_to_bin` lit `bins` : deux noms
    // différents pour la même idée, et se tromper ne se voit qu'à l'écran.
    if (c.items) {
      const bacs = (c.categories ?? c.bins ?? []).map((x) => x.id);
      if (!bacs.length) mauvais(`${e.title} : des éléments sans bacs (categories pour swipe_sort, bins pour drag_to_bin)`);
      if (b.type === "swipe_sort" && !c.categories) mauvais(`${e.title} : swipe_sort attend categories`);
      if (b.type === "drag_to_bin" && !c.bins)      mauvais(`${e.title} : drag_to_bin attend bins`);
      for (const it of c.items) {
        if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`);
        if (!bacs.includes(it.correct)) mauvais(`${e.title} : « ${it.label} » vise un bac inexistant (${it.correct})`);
      }
      const vides = (c.categories ?? c.bins ?? []).filter((b2) => !c.items.some((i) => i.correct === b2.id));
      for (const v of vides) mauvais(`${e.title} : le bac « ${v.label} » n'attend aucun élément`);
    }

    // Les phrases à trous : une bonne réponse, une explication.
    for (const s of c.sentences ?? []) {
      if (!s.options?.[s.correct]) mauvais(`${e.title} : phrase ${s.id} sans bonne réponse`);
      if (!s.explanation) mauvais(`${e.title} : phrase ${s.id} sans explication`);
    }

    // Les paires : uniques des DEUX côtés. Deux fois la même réponse à droite
    // et le jeu devient insoluble — on ne peut relier qu'une fois.
    if (c.pairs) {
      const g1 = c.pairs.map((p) => p.left), d1 = c.pairs.map((p) => p.right);
      if (g1.length !== new Set(g1).size) mauvais(`${e.title} : deux paires ont la même gauche`);
      if (d1.length !== new Set(d1).size) mauvais(`${e.title} : deux paires ont la même droite — le jeu serait insoluble`);
    }

    // La chasse au bug vise une ligne qui existe, et la répare vraiment.
    if (c.game_type === "bug_hunt") {
      if (!Number.isInteger(c.bug_index) || !c.instructions?.[c.bug_index]) mauvais(`${e.title} / ${c.title} : bug_index hors des lignes`);
      else if (c.instructions[c.bug_index] === c.fix) mauvais(`${e.title} / ${c.title} : la réparation répète la ligne fautive`);
      if (!c.explanation) mauvais(`${e.title} / ${c.title} : sans explication`);
    }

    // Le plan : des phases, des pièges, et aucun piège qui soit une vraie phase.
    if (c.game_type === "plan_builder") {
      if (!c.phases?.length) mauvais(`${e.title} : plan sans phases`);
      if (!c.distracteurs?.length) mauvais(`${e.title} : plan sans distracteurs — il n'y aurait rien à trancher`);
      for (const d of c.distracteurs ?? []) if (c.phases?.includes(d)) mauvais(`${e.title} : « ${d} » est à la fois piège et bonne phase`);
    }
  }
}

// Les comptes annoncés dans les titres et les textes doivent être vrais.
const compte = (titre, type, attendu) => {
  const e = EXOS.find((x) => x.title === titre);
  const b = e?.blocs.find((x) => x.type === type || x.content?.game_type === type);
  const n = (b?.content?.items ?? b?.content?.pairs ?? b?.content?.sentences ?? []).length;
  if (n !== attendu) mauvais(`${titre} : ${n} éléments, ${attendu} annoncés dans le texte`);
};
compte("Ordinateur, ou pas ?", "swipe_sort", 14);
compte("Le chemin de l'information", "match", 8);
compte("Entrée, sortie, ou les deux ?", "drag_to_bin", 12);
compte("Quand le courant saute", "swipe_sort", 12);
compte("Le voyage d'une touche", "fill_blank", 6);
const deuxDeux = EXOS.find((x) => x.title === "Entrée, sortie, ou les deux ?").blocs[1].content.items.filter((i) => i.correct === "both").length;
if (deuxDeux !== 3) mauvais(`« les deux » : ${deuxDeux} appareils, 3 annoncés`);

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
console.log("✓ 7 exercices, paliers 1-1-2-2-2-3-3");
console.log("✓ ni code, ni boucle, ni « algorithme » dans ce que l'enfant voit");
console.log("✓ bacs, indices, paires, phrases, chasses au bug et plan : tous vérifiés");
console.log("✓ les nombres annoncés (14, 8, 12, 12, 6, et 3 « les deux ») sont exacts");

// ── Application ────────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];

const colonnes = await g("trainings", "id,libre_service,palier", (q) => q.eq("lesson_id", L.id));
const dejaTerrain = colonnes.filter((t) => t.libre_service);
if (dejaTerrain.length && !process.argv.includes("--refaire"))
  throw new Error(`${dejaTerrain.length} exercice(s) de Terrain existent déjà — ce script n'écrase pas (--refaire pour les remplacer)`);
if (dejaTerrain.length) {
  const joues = await g("training_progress", "id,training_id", (q) => q.in("training_id", dejaTerrain.map((t) => t.id)));
  if (joues.length) throw new Error(`${joues.length} progression(s) d'élève sur ce lot — --refaire est refusé`);
  if (ECRIRE) {
    const { error } = await db.from("trainings").delete().in("id", dejaTerrain.map((t) => t.id));
    if (error) throw new Error(`suppression : ${error.message}`);
    console.log(`  ⟲ ${dejaTerrain.length} exercices remplacés (personne n'y avait joué)`);
  }
}
const parcours = colonnes.filter((t) => !t.libre_service);
const DEPART = 100;

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${EXOS.length} exercices de Terrain`);
console.log(`Séance « ${L.title} » — ${parcours.length} exercices de parcours conservés intacts\n`);
EXOS.forEach((e) => console.log(`  [P${e.palier}] ${e.title.padEnd(30)} ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));

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
  ok(tb.length > 0 && tb.map((b) => b.order_index).every((v, i) => v === i) && tb.every((b) => b.content && Object.keys(b.content).length),
     `${e.title} — ${tb.length} blocs contigus et remplis`);
}
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
