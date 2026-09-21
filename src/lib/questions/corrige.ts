/**
 * La fiche d'un exercice pour son mentor et pour la direction : ce que
 * l'enfant a devant lui, et la réponse attendue.
 *
 * Réservée au personnel. Elle est lue dans l'exercice lui-même, au moment de
 * l'afficher, et n'est jamais recopiée dans la question : l'enfant et son
 * parent peuvent relire leur question, ils ne doivent jamais y trouver la
 * solution. Le corrigé d'un défi de code n'est pas dans l'exercice : il vient
 * de la table corriges_exercices, que seul le serveur lit (migration 033).
 *
 * Aucun accès à la base ici : les règles, type par type, sont éprouvées par
 * leurs tests. Elles suivent les jeux eux-mêmes (composants de
 * src/components/eleve) : un changement de règle d'un jeu se reporte ici.
 */

export type Role = "exercice" | "reponse";
export type Case = { x: number; y: number };
export type TypeCase = "mur" | "depart" | "arrivee" | "gemme" | "cle" | "porte" | "trace" | "chemin";

export type Partie =
  | { genre: "texte"; titre?: string; texte: string; role?: Role }
  | { genre: "liste"; titre: string; lignes: string[]; ordonnee?: boolean; role?: Role }
  | { genre: "code"; titre: string; code: string; role?: Role }
  | { genre: "grille"; titre: string; taille: number; cases: Record<string, TypeCase>; direction?: string; role?: Role }
  | { genre: "question"; question: string; choix: string[]; bonne: number | null; explication: string | null }
  | { genre: "explication"; texte: string; pour?: string };

export type FicheExercice = {
  /** Le nom du jeu, tel que le mentor le reconnaît. */
  nom: string;
  parties: Partie[];
  /** Ce qu'il faut savoir avant de lire la réponse : création libre, corrigé à venir… */
  note: string | null;
};

type Contenu = Record<string, unknown>;

const txt = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const tab = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const textes = (v: unknown): string[] => tab(v).filter((x): x is string => typeof x === "string");
const consigneDe = (c: Contenu) => txt(c.instructions) ?? txt(c.instruction) ?? txt(c.description);
const numerote = (lignes: string[]) => lignes.map((l, i) => `${String(i + 1).padStart(2, " ")}  ${l}`).join("\n");

// ── Les labyrinthes ─────────────────────────────────────────────────────────

const DIRS = ["N", "E", "S", "W"] as const;
type Dir = (typeof DIRS)[number];
const DELTA: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export type Geste = "avancer" | "gauche" | "droite" | "ramasser";

type Labyrinthe = {
  grid_size?: unknown; start?: unknown; goal?: unknown; walls?: unknown;
  collectibles?: unknown; locked_doors?: unknown; target_trail?: unknown;
};

const cle = (c: Case) => `${c.x},${c.y}`;
const estCase = (v: unknown): v is Case =>
  !!v && typeof (v as Case).x === "number" && typeof (v as Case).y === "number";

/**
 * Le plus court programme qui mène le robot à l'arrivée, objets ramassés —
 * avec les règles du jeu (BlocklyRobot) : un mur ou le bord arrêtent tout,
 * une porte verrouillée ne s'ouvre qu'avec la clé ramassée, un objet ne se
 * ramasse qu'avec le geste « Ramasser », et l'arrivée ne compte qu'une fois
 * tous les objets ramassés. Null si aucun chemin n'existe.
 */
export function cheminLabyrinthe(l: Labyrinthe): Geste[] | null {
  const n = num(l.grid_size);
  const depart = l.start as (Case & { dir?: string }) | undefined;
  if (!n || !estCase(depart) || !estCase(l.goal)) return null;
  const arrivee = l.goal;
  const murs = new Set(tab(l.walls).filter(estCase).map(cle));
  const portes = new Set(tab(l.locked_doors).filter(estCase).map(cle));
  const objets = tab<Case & { type?: string }>(l.collectibles).filter((o) => estCase(o));
  const tous = (1 << objets.length) - 1;
  const cles = objets.map((o, i) => (o.type === "key" ? 1 << i : 0)).reduce((a, b) => a | b, 0);

  type Etat = { x: number; y: number; d: number; m: number };
  const nom = (e: Etat) => `${e.x},${e.y},${e.d},${e.m}`;
  const debut: Etat = { x: depart.x, y: depart.y, d: Math.max(0, DIRS.indexOf((depart.dir ?? "E") as Dir)), m: 0 };
  const venuDe = new Map<string, { avant: string | null; geste: Geste | null; etat: Etat }>([[nom(debut), { avant: null, geste: null, etat: debut }]]);
  const file: Etat[] = [debut];

  while (file.length) {
    const e = file.shift()!;
    if (e.x === arrivee.x && e.y === arrivee.y && e.m === tous) {
      const gestes: Geste[] = [];
      for (let k: string | null = nom(e); k; k = venuDe.get(k)!.avant) {
        const g = venuDe.get(k)!.geste;
        if (g) gestes.unshift(g);
      }
      return gestes;
    }
    const suivants: [Geste, Etat | null][] = [
      ["gauche", { ...e, d: (e.d + 3) % 4 }],
      ["droite", { ...e, d: (e.d + 1) % 4 }],
    ];
    const [dx, dy] = DELTA[DIRS[e.d]];
    const nx = e.x + dx;
    const ny = e.y + dy;
    const bloque = nx < 0 || ny < 0 || nx >= n || ny >= n || murs.has(`${nx},${ny}`)
      || (portes.has(`${nx},${ny}`) && (e.m & cles) === 0);
    suivants.push(["avancer", bloque ? null : { ...e, x: nx, y: ny }]);
    const ici = objets.findIndex((o, i) => o.x === e.x && o.y === e.y && (e.m & (1 << i)) === 0);
    suivants.push(["ramasser", ici < 0 ? null : { ...e, m: e.m | (1 << ici) }]);

    for (const [geste, s] of suivants) {
      if (!s || venuDe.has(nom(s))) continue;
      venuDe.set(nom(s), { avant: nom(e), geste, etat: s });
      file.push(s);
    }
  }
  return null;
}

/**
 * « 🚀 Avancer ×3 », dans les mots du jeu : ceux des blocs (BlocklyRobot), ou
 * ceux du Python (PythonMaze, qui n'a pas d'objets à ramasser).
 */
export function gestesLisibles(gestes: Geste[], python = false): string[] {
  const mots: Record<Geste, string> = python
    ? { avancer: "avance()", gauche: "tourne_gauche()", droite: "tourne_droite()", ramasser: "ramasser" }
    : { avancer: "🚀 Avancer", gauche: "↰ Tourner gauche", droite: "↱ Tourner droite", ramasser: "🧲 Ramasser" };
  const lignes: string[] = [];
  for (let i = 0; i < gestes.length;) {
    let j = i;
    while (j < gestes.length && gestes[j] === gestes[i]) j++;
    lignes.push(j - i > 1 ? `${mots[gestes[i]]} ×${j - i}` : mots[gestes[i]]);
    i = j;
  }
  return lignes;
}

function grilleDe(l: Labyrinthe, chemin: Geste[] | null): { exercice: Partie; reponse: Partie | null } | null {
  const n = num(l.grid_size);
  const depart = l.start as (Case & { dir?: string }) | undefined;
  if (!n || !estCase(depart)) return null;
  const cases: Record<string, TypeCase> = {};
  for (const m of tab(l.walls).filter(estCase)) cases[cle(m)] = "mur";
  for (const p of tab(l.locked_doors).filter(estCase)) cases[cle(p)] = "porte";
  for (const o of tab<Case & { type?: string }>(l.collectibles).filter((o) => estCase(o))) cases[cle(o)] = o.type === "key" ? "cle" : "gemme";
  if (estCase(l.goal)) cases[cle(l.goal)] = "arrivee";
  cases[cle(depart)] = "depart";
  const exercice: Partie = { genre: "grille", titre: "Le labyrinthe", taille: n, cases, direction: depart.dir ?? "E", role: "exercice" };

  // Le tracé à dessiner, ou le trajet calculé, sur une seconde grille.
  const trace = tab(l.target_trail).filter(estCase);
  // Seules les cases vides changent : les objets, les portes et l'arrivée
  // restent visibles sur le trajet, c'est là qu'il se passe quelque chose.
  const surGrille = (a: Case[], type: TypeCase): Partie => {
    const c2: Record<string, TypeCase> = { ...cases };
    for (const k of a.map(cle)) if (!c2[k]) c2[k] = type;
    return { genre: "grille", titre: type === "trace" ? "La figure attendue" : "Le trajet", taille: n, cases: c2, direction: depart.dir ?? "E", role: "reponse" };
  };
  if (trace.length) return { exercice, reponse: surGrille(trace, "trace") };
  if (!chemin) return { exercice, reponse: null };
  const passees: Case[] = [];
  let x = depart.x, y = depart.y, d = Math.max(0, DIRS.indexOf((depart.dir ?? "E") as Dir));
  for (const g of chemin) {
    if (g === "gauche") d = (d + 3) % 4;
    else if (g === "droite") d = (d + 1) % 4;
    else if (g === "avancer") { x += DELTA[DIRS[d]][0]; y += DELTA[DIRS[d]][1]; passees.push({ x, y }); }
  }
  return { exercice, reponse: surGrille(passees, "chemin") };
}

function ficheLabyrinthe(c: Contenu, python: boolean): FicheExercice {
  const parties: Partie[] = [];
  const consigne = consigneDe(c);
  if (consigne) parties.push({ genre: "texte", texte: consigne, role: "exercice" });
  const etapes = textes(c.steps);
  if (etapes.length) parties.push({ genre: "liste", titre: "Les étapes données à l'enfant", lignes: etapes, ordonnee: true, role: "exercice" });
  if (python && txt(c.starter_code)) parties.push({ genre: "code", titre: "Le code de départ", code: String(c.starter_code), role: "exercice" });

  const figure = tab(c.target_trail).filter(estCase).length > 0;
  const chemin = figure ? null : cheminLabyrinthe(c);
  const grilles = grilleDe(c, chemin);
  if (grilles) parties.push(grilles.exercice);

  let note: string | null = null;
  if (figure) {
    if (grilles?.reponse) parties.push(grilles.reponse);
    note = "Le robot doit dessiner exactement cette figure, en revenant à l'arrivée : aucune case en plus, aucune en moins.";
  } else if (chemin) {
    parties.push({ genre: "liste", titre: python ? "Le trajet, en Python" : "Le trajet, en blocs", lignes: gestesLisibles(chemin, python), role: "reponse" });
    if (grilles?.reponse) parties.push(grilles.reponse);
    const limite = python ? num(c.par) : num(c.max_blocks);
    if (limite) {
      note = python
        ? `Trajet calculé, écrit sans boucle. L'objectif est de l'écrire en ${limite} lignes : c'est là que la boucle ou la fonction servent.`
        : `Trajet calculé, écrit sans boucle. Le défi autorise ${limite} blocs au plus : il faut regrouper les gestes qui se répètent.`;
    } else {
      note = "Trajet calculé : le plus court. Tout autre programme qui arrive, objets ramassés, est juste aussi.";
    }
  } else {
    note = "Aucun trajet n'a pu être calculé pour ce labyrinthe.";
  }
  return { nom: python ? "Labyrinthe en Python" : "Labyrinthe", parties, note };
}

// ── Les défis de code ───────────────────────────────────────────────────────

/** Ce que vérifie le correcteur, avec ses propres mots : le message de chaque `assert`. */
export function verificationsDuCorrecteur(tests: string): string[] {
  const lignes: string[] = [];
  for (const brute of tests.split("\n")) {
    const l = brute.trim();
    if (!l.startsWith("assert ")) continue;
    const message = l.match(/,\s*(["'])((?:\\.|(?!\1).)*)\1\s*$/);
    lignes.push(message ? message[2].replace(/\\(["'])/g, "$1") : l.slice(7));
  }
  return lignes;
}

// ── La fiche ────────────────────────────────────────────────────────────────

/** `corrigeCode` : le corrigé d'un défi de code, tiré de corriges_exercices. */
export function lireExercice(type: string, contenu: Contenu | null, corrigeCode: string | null = null): FicheExercice {
  const c = contenu ?? {};
  const jeu = txt(c.game_type);
  const consigne = consigneDe(c);
  const avecConsigne = (parties: Partie[]): Partie[] =>
    consigne ? [{ genre: "texte", texte: consigne, role: "exercice" }, ...parties] : parties;
  const explication = (v: unknown, pour?: string): Partie[] => {
    const t = txt(v);
    return t ? [{ genre: "explication", texte: t, ...(pour ? { pour } : {}) }] : [];
  };

  if (type === "quiz") {
    const questions = Array.isArray(c.questions) ? tab<Contenu>(c.questions) : [c];
    return {
      nom: "Quiz",
      parties: questions.map((q, i) => ({
        genre: "question",
        question: txt(q.question) ?? `Question ${i + 1}`,
        choix: textes(q.choices),
        bonne: num(q.answer),
        explication: txt(q.explanation),
      })),
      note: null,
    };
  }

  if (type === "code_challenge") {
    const parties: Partie[] = avecConsigne([]);
    if (txt(c.starter_code)) parties.push({ genre: "code", titre: "Le code de départ", code: String(c.starter_code), role: "exercice" });
    const corrige = txt(corrigeCode);
    if (corrige) parties.push({ genre: "code", titre: "Le corrigé, vérifié par le correcteur", code: String(corrigeCode), role: "reponse" });
    const verifs = typeof c.hidden_tests === "string" ? verificationsDuCorrecteur(c.hidden_tests) : [];
    if (verifs.length) parties.push({ genre: "liste", titre: "Ce que vérifie le correcteur", lignes: verifs, role: "reponse" });
    return {
      nom: "Défi de code",
      parties,
      note: corrige ? null
        : verifs.length ? "Pas encore de corrigé écrit pour ce défi : voici ce que le correcteur vérifie."
        // Sans test ni corrigé : « lance ce programme et réponds-lui ».
        : "Défi d'exploration : l'enfant lance le programme fourni et observe. Pas de vérification automatique.",
    };
  }

  if (type === "fill_blank" && Array.isArray(c.sentences)) {
    const phrases = tab<Contenu>(c.sentences);
    return {
      nom: "Phrases à compléter",
      parties: phrases.map((s, i): Partie => ({
        genre: "question",
        question: `${txt(s.before) ?? ""} ___ ${txt(s.after) ?? ""}`.trim() || `Phrase ${i + 1}`,
        choix: textes(s.options),
        bonne: num(s.correct),
        explication: txt(s.explanation),
      })),
      note: null,
    };
  }

  if (type === "match") {
    const gauche = txt(c.left_label), droite = txt(c.right_label);
    return {
      nom: "Relier",
      parties: [{
        genre: "liste",
        titre: gauche && droite ? `Les bonnes paires (${gauche} ↔ ${droite})` : "Les bonnes paires",
        lignes: tab<Contenu>(c.pairs).map((p) => `${txt(p.left) ?? "?"}  ↔  ${txt(p.right) ?? "?"}`),
        role: "reponse",
      }],
      note: null,
    };
  }

  if (type === "swipe_sort" || type === "drag_to_bin") {
    const groupes = tab<Contenu>(type === "swipe_sort" ? c.categories : c.bins);
    const nomDe = (id: unknown) => {
      const g = groupes.find((x) => x.id === id);
      return g ? `${txt(g.emoji) ?? ""} ${txt(g.label) ?? String(id)}`.trim() : String(id);
    };
    const parties = avecConsigne([]);
    const criteres = textes((c.helper as Contenu | undefined)?.criteria);
    if (criteres.length) parties.push({ genre: "liste", titre: "Les critères donnés à l'enfant", lignes: criteres, role: "exercice" });
    parties.push({
      genre: "liste",
      titre: "Le bon classement",
      lignes: tab<Contenu>(c.items).map((it) =>
        `${txt(it.emoji) ?? ""} ${txt(it.label) ?? "?"} → ${nomDe(it.correct)}${txt(it.hint) ? ` — ${txt(it.hint)}` : ""}`.trim()),
      role: "reponse",
    });
    return { nom: type === "swipe_sort" ? "Tri rapide" : "Ranger dans les bacs", parties, note: null };
  }

  const estJeu = type === "game" || type === "blockly" || type === "blockly_challenge";

  if (estJeu && (jeu === "maze" || jeu === "python_maze" || (!jeu && c.walls !== undefined && c.goal !== undefined))) {
    return ficheLabyrinthe(c, jeu === "python_maze");
  }

  if (estJeu && jeu === "bug_hunt") {
    const lignes = textes(c.instructions);
    const i = num(c.bug_index);
    const parties: Partie[] = [];
    const intro = txt(c.description);
    if (intro) parties.push({ genre: "texte", texte: intro, role: "exercice" });
    if (txt(c.context)) parties.push({ genre: "texte", titre: "Ce qui se passe", texte: String(c.context), role: "exercice" });
    if (lignes.length) parties.push({ genre: "code", titre: "Le programme", code: numerote(lignes), role: "exercice" });
    if (i !== null && lignes[i] !== undefined) {
      parties.push({ genre: "liste", titre: "Le bug", lignes: [`Ligne ${i + 1} : ${lignes[i].trim()}`, `Correction : ${txt(c.fix) ?? "?"}`], role: "reponse" });
    }
    parties.push(...explication(c.explanation));
    return { nom: "Chasse au bug", parties, note: null };
  }

  if (estJeu && jeu === "sort") {
    return {
      nom: "Remets dans l'ordre",
      parties: [
        ...avecConsigne([]),
        { genre: "liste", titre: "Le bon ordre", lignes: textes(c.items), ordonnee: true, role: "reponse" },
        ...explication(c.hint, "Indice"),
      ],
      note: null,
    };
  }

  if (estJeu && jeu === "plan_builder") {
    const phases = textes(c.phases);
    const intrus = textes(c.distracteurs);
    const parties: Partie[] = [
      ...avecConsigne([]),
      { genre: "liste", titre: "Les cartes proposées", lignes: [...phases, ...intrus].sort((a, b) => a.localeCompare(b, "fr")), role: "exercice" },
      { genre: "liste", titre: "Le bon plan", lignes: phases, ordonnee: true, role: "reponse" },
    ];
    if (intrus.length) parties.push({ genre: "liste", titre: "Les cartes en trop", lignes: intrus, role: "reponse" });
    parties.push(...explication(c.explanation));
    return { nom: "Le plan", parties, note: null };
  }

  if (estJeu && (jeu === "memory" || jeu === "association")) {
    return {
      nom: jeu === "memory" ? "Mémoire" : "Association",
      parties: [
        ...avecConsigne([]),
        { genre: "liste", titre: "Les bonnes paires", lignes: tab<Contenu>(c.pairs).map((p) => `${txt(p.left) ?? "?"}  ↔  ${txt(p.right) ?? "?"}`), role: "reponse" },
      ],
      note: null,
    };
  }

  // Le code à trous : un jeu de leçon, ou un entraînement écrit sur le même modèle.
  if ((estJeu && jeu === "fill_blank") || (type === "fill_blank" && typeof c.template === "string")) {
    const modele = typeof c.template === "string" ? c.template : "";
    const trous = textes(c.blanks);
    let k = 0;
    const rempli = modele.replace(/\[___\]/g, () => `[${trous[k++] ?? "?"}]`);
    return {
      nom: "Code à trous",
      parties: [
        { genre: "code", titre: "Le code à compléter", code: modele, role: "exercice" },
        { genre: "code", titre: "Complété", code: rempli, role: "reponse" },
      ],
      note: null,
    };
  }

  if (estJeu && (jeu === "pattern_build" || jeu === "pattern_select")) {
    const lignes = textes(c.instructions);
    const debut = num(c.motif_start) ?? 0;
    const fin = num(c.motif_end) ?? debut;
    const motif = lignes.slice(debut, fin + 1);
    const taille = motif.length || 1;
    // Le nombre de tours, s'il n'est pas écrit : combien de fois le motif
    // revient à l'identique, d'affilée.
    let tours = num(c.repetitions) ?? 0;
    if (!tours) {
      while (motif.length && lignes.slice(debut + tours * taille, debut + (tours + 1) * taille).join("\n") === motif.join("\n")) tours++;
    }
    const avant = lignes.slice(0, debut);
    const apres = lignes.slice(debut + tours * taille);
    const reponse = [
      `Le motif : lignes ${debut + 1} à ${fin + 1} — ${motif.join(", ")}`,
      `Répété ${tours} fois`,
      ...(avant.length ? [`Avant la boucle : ${avant.join(", ")}`] : []),
      ...(apres.length ? [`Après la boucle : ${apres.join(", ")}`] : []),
    ];
    return {
      nom: jeu === "pattern_build" ? "Construis la boucle" : "Trouve le motif",
      parties: [
        ...avecConsigne([]),
        { genre: "code", titre: "La suite de départ", code: numerote(lignes), role: "exercice" },
        { genre: "liste", titre: "La réponse", lignes: reponse, role: "reponse" },
        ...explication(c.explanation),
      ],
      note: jeu === "pattern_build" ? "Toute boucle qui redonne exactement la suite de départ est acceptée, avec au moins deux tours." : null,
    };
  }

  if (estJeu && jeu === "deviens_ordinateur") {
    const etapes = tab<Contenu>(c.etapes);
    const parties: Partie[] = avecConsigne([]);
    const contexte = textes(c.contexte);
    if (contexte.length) parties.push({ genre: "code", titre: "Le programme", code: contexte.join("\n"), role: "exercice" });
    if (txt(c.ligne)) parties.push({ genre: "code", titre: "La ligne à exécuter", code: String(c.ligne), role: "exercice" });
    parties.push({
      genre: "liste",
      titre: "Ce que devient chaque appel",
      lignes: [...etapes.map((e) => `${txt(e.expression) ?? "?"} → ${txt(e.valeur) ?? "?"}`), ...(txt(c.sortie) ? [`Affiche : ${txt(c.sortie)}`] : [])],
      ordonnee: true,
      role: "reponse",
    });
    etapes.forEach((e, i) => parties.push(...explication(e.explication, `Étape ${i + 1}`)));
    parties.push(...explication(c.explanation));
    return { nom: "Deviens l'ordinateur", parties, note: null };
  }

  if (estJeu && jeu === "music") {
    const modele = textes(c.target_notes);
    const parties: Partie[] = avecConsigne([]);
    const etapes = textes(c.steps);
    if (etapes.length) parties.push({ genre: "liste", titre: "Les étapes données à l'enfant", lignes: etapes, ordonnee: true, role: "exercice" });
    if (modele.length) parties.push({ genre: "texte", titre: "Le modèle à reproduire", texte: modele.join(" · "), role: "reponse" });
    const limite = num(c.max_blocks);
    const libre = !modele.length;
    return {
      nom: "Musique",
      parties,
      note: libre
        ? `Création libre : pas de réponse unique${num(c.min_notes) ? `, au moins ${num(c.min_notes)} notes` : ""}.`
        : limite ? `Le modèle doit être rejoué en ${limite} blocs au plus : c'est la boucle qui le permet.` : null,
    };
  }

  if (estJeu && jeu === "python_piano") {
    const melodie = textes(c.target);
    const parties: Partie[] = avecConsigne([]);
    if (txt(c.starter_code)) parties.push({ genre: "code", titre: "Le code de départ", code: String(c.starter_code), role: "exercice" });
    if (melodie.length) parties.push({ genre: "texte", titre: "La mélodie attendue", texte: melodie.join(" · "), role: "reponse" });
    return {
      nom: "Piano en Python",
      parties,
      note: melodie.length
        ? num(c.par) ? `L'objectif est de l'écrire en ${num(c.par)} lignes : les répétitions se regroupent.` : null
        : `Mélodie libre : pas de réponse unique${num(c.min_notes) ? `, au moins ${num(c.min_notes)} notes` : ""}.`,
    };
  }

  if (estJeu && jeu === "python_arcade") {
    const parties = avecConsigne([]);
    if (txt(c.starter_code)) parties.push({ genre: "code", titre: "Le code de départ", code: String(c.starter_code), role: "exercice" });
    return { nom: "Jeu en Python", parties, note: "Exercice d'exploration : l'enfant change les valeurs et observe. Pas de réponse unique." };
  }

  // Le défi de Kodi : ce qu'il doit dire, dans l'ordre.
  if (type === "blockly_challenge" && Array.isArray(c.expected_lines)) {
    const limite = num(c.max_blocks);
    return {
      nom: "Programme de Kodi",
      parties: [
        ...avecConsigne([]),
        { genre: "liste", titre: "Ce que Kodi doit dire, dans l'ordre", lignes: textes(c.expected_lines), ordonnee: true, role: "reponse" },
      ],
      note: limite ? `En ${limite} blocs au plus : il faut une boucle.` : null,
    };
  }

  return {
    nom: "Exercice",
    parties: avecConsigne([]),
    note: "Ce type d'exercice n'a pas encore de fiche : seule sa consigne s'affiche.",
  };
}
