import { describe, it, expect } from "vitest";
import { lireExercice, cheminLabyrinthe, gestesLisibles, verificationsDuCorrecteur, type Geste, type Partie } from "./corrige";

// Des exercices réels de la plateforme, recopiés tels quels.
const PLAN_DU_COFFRE = {
  title: "Le plan du coffre", game_type: "plan_builder", description: "Compose les phases dans l'ordre.",
  phases: ["Aller jusqu'à la gemme 💎", "Ramasser la gemme 💎", "Repartir vers le coffre"],
  distracteurs: ["Ouvrir le coffre avant d'avoir la gemme", "Ramasser la clé 🗝️"],
  explanation: "Ramasser vient forcément après être arrivé, et repartir après avoir ramassé. Les phases ne se mélangent pas.",
};
const PREMIER_VIRAGE = {
  grid_size: 4, start: { x: 0, y: 3, dir: "E" }, goal: { x: 2, y: 0 }, max_blocks: 8,
  walls: [[0, 0], [1, 0], [3, 0], [0, 1], [1, 1], [3, 1], [0, 2], [1, 2], [3, 2], [3, 3]].map(([x, y]) => ({ x, y })),
};
const murs = (lignes: number[], colonnes: number[]) => lignes.flatMap((y) => colonnes.map((x) => ({ x, y })));
const PORTE_VERROUILLEE = {
  game_type: "maze", grid_size: 7, start: { x: 0, y: 0, dir: "E" }, goal: { x: 6, y: 2 }, max_blocks: 20,
  walls: [...murs([1, 2], [1, 2, 3, 4, 5]), ...murs([3, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6])],
  collectibles: [{ x: 0, y: 2, type: "key" }], locked_doors: [{ x: 3, y: 0, requires: "key" }],
};
const RECOLTE = {
  game_type: "maze", grid_size: 7, start: { x: 0, y: 3, dir: "E" }, goal: { x: 6, y: 3 }, max_blocks: 9,
  walls: murs([0, 1, 2, 4, 5, 6], [0, 1, 2, 3, 4, 5, 6]),
  collectibles: [{ x: 2, y: 3, type: "gem" }, { x: 4, y: 3, type: "gem" }],
};
const DESSINE_UN_L = {
  game_type: "maze", grid_size: 7, start: { x: 1, y: 1, dir: "E" }, goal: { x: 5, y: 5 }, walls: [], max_blocks: 10,
  target_trail: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5]].map(([x, y]) => ({ x, y })),
};

/**
 * Rejoue un trajet avec les règles de BlocklyRobot, écrites indépendamment
 * du calcul : c'est ce qui dit qu'un trajet calculé gagne vraiment.
 */
function rejoue(l: typeof PORTE_VERROUILLEE | typeof PREMIER_VIRAGE, gestes: Geste[]): boolean {
  const dirs = ["N", "E", "S", "W"];
  const pas: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  let { x, y } = l.start;
  let d = dirs.indexOf(l.start.dir);
  const objets = "collectibles" in l ? l.collectibles : [];
  const portes = "locked_doors" in l ? l.locked_doors : [];
  const ramasses = new Set<string>();
  let ouvertes = false;
  for (const g of gestes) {
    if (g === "gauche") d = (d + 3) % 4;
    else if (g === "droite") d = (d + 1) % 4;
    else if (g === "avancer") {
      const [dx, dy] = pas[dirs[d]];
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= l.grid_size || ny >= l.grid_size) return false;
      if (l.walls.some((w) => w.x === nx && w.y === ny)) return false;
      if (portes.some((p) => p.x === nx && p.y === ny) && !ouvertes) return false;
      x = nx; y = ny;
    } else {
      for (const o of objets) if (o.x === x && o.y === y) { ramasses.add(`${x},${y}`); if (o.type === "key") ouvertes = true; }
    }
  }
  return x === l.goal.x && y === l.goal.y && objets.every((o) => ramasses.has(`${o.x},${o.y}`));
}

const parties = (p: Partie[], genre: Partie["genre"]) => p.filter((x) => x.genre === genre);

describe("labyrinthes", () => {
  it("trouve le trajet du premier virage, celui que décrivent ses étapes", () => {
    const chemin = cheminLabyrinthe(PREMIER_VIRAGE)!;
    expect(gestesLisibles(chemin)).toEqual(["🚀 Avancer ×2", "↰ Tourner gauche", "🚀 Avancer ×3"]);
    expect(rejoue(PREMIER_VIRAGE, chemin)).toBe(true);
  });

  it("va chercher la clé avant de passer la porte", () => {
    const chemin = cheminLabyrinthe(PORTE_VERROUILLEE)!;
    expect(chemin).toContain("ramasser");
    expect(rejoue(PORTE_VERROUILLEE, chemin)).toBe(true);
    // Sans la clé, la porte bloque : le trajet direct ne gagne pas.
    expect(rejoue(PORTE_VERROUILLEE, ["avancer", "avancer", "avancer"])).toBe(false);
  });

  it("ramasse chaque gemme avant d'arriver", () => {
    const chemin = cheminLabyrinthe(RECOLTE)!;
    expect(chemin.filter((g) => g === "ramasser")).toHaveLength(2);
    expect(rejoue(RECOLTE, chemin)).toBe(true);
  });

  it("écrit le trajet en Python pour le labyrinthe en Python", () => {
    expect(gestesLisibles(["avancer", "avancer", "droite"], true)).toEqual(["avance() ×2", "tourne_droite()"]);
  });

  it("pour un tracé, montre la figure attendue au lieu d'un trajet", () => {
    const f = lireExercice("game", DESSINE_UN_L);
    const grilles = parties(f.parties, "grille") as Extract<Partie, { genre: "grille" }>[];
    expect(grilles.map((g) => g.titre)).toEqual(["Le labyrinthe", "La figure attendue"]);
    expect(Object.values(grilles[1].cases).filter((t) => t === "trace")).toHaveLength(7);
    expect(f.note).toMatch(/figure/);
  });

  it("annonce la limite de blocs du défi", () => {
    expect(lireExercice("game", { ...RECOLTE }).note).toMatch(/9 blocs au plus/);
  });
});

describe("fiches", () => {
  it("le plan du coffre : le bon ordre, les cartes en trop, l'explication", () => {
    const f = lireExercice("blockly_challenge", PLAN_DU_COFFRE);
    const listes = parties(f.parties, "liste") as Extract<Partie, { genre: "liste" }>[];
    expect(listes.find((l) => l.titre === "Le bon plan")?.lignes).toEqual(PLAN_DU_COFFRE.phases);
    expect(listes.find((l) => l.titre === "Les cartes en trop")?.lignes).toEqual(PLAN_DU_COFFRE.distracteurs);
    expect(parties(f.parties, "explication")).toHaveLength(1);
  });

  it("le quiz : chaque question, sa bonne réponse et son explication", () => {
    const f = lireExercice("quiz", { questions: [
      { question: "Combien de branches s'exécutent ?", choices: ["Une seule", "Les deux"], answer: 0, explanation: "Une seule." },
    ] });
    expect(f.parties).toEqual([{ genre: "question", question: "Combien de branches s'exécutent ?", choix: ["Une seule", "Les deux"], bonne: 0, explication: "Une seule." }]);
  });

  it("la chasse au bug : la ligne fautive, sa correction", () => {
    const f = lireExercice("game", {
      game_type: "bug_hunt", fix: "if age == 18:", bug_index: 1, explanation: "Un seul = range une valeur.",
      instructions: ["age = 20", "if age = 18:", "    print(\"Tu as 18 ans.\")"],
    });
    const bug = (parties(f.parties, "liste") as Extract<Partie, { genre: "liste" }>[]).find((l) => l.titre === "Le bug");
    expect(bug?.lignes).toEqual(["Ligne 2 : if age = 18:", "Correction : if age == 18:"]);
  });

  it("le motif à construire : compte les tours et dit ce qui reste après la boucle", () => {
    const f = lireExercice("game", {
      game_type: "pattern_build", motif_start: 0, motif_end: 3,
      instructions: [...Array(3).fill(["Avancer", "Tourner à droite", "Avancer", "Tourner à gauche"]).flat(), "Avancer", "Avancer"],
    });
    const reponse = (parties(f.parties, "liste") as Extract<Partie, { genre: "liste" }>[])[0].lignes;
    expect(reponse).toContain("Répété 3 fois");
    expect(reponse).toContain("Après la boucle : Avancer, Avancer");
  });

  it("deviens l'ordinateur : ce que devient chaque appel, puis l'affichage", () => {
    const f = lireExercice("game", {
      game_type: "deviens_ordinateur", ligne: "print(ajoute(double(5), 3))", sortie: "13",
      etapes: [{ expression: "double(5)", valeur: "10" }, { expression: "ajoute(10, 3)", valeur: "13" }],
    });
    expect((parties(f.parties, "liste")[0] as Extract<Partie, { genre: "liste" }>).lignes)
      .toEqual(["double(5) → 10", "ajoute(10, 3) → 13", "Affiche : 13"]);
  });

  it("le tri rapide : chaque carte, sa catégorie et pourquoi", () => {
    const f = lireExercice("swipe_sort", {
      categories: [{ id: "ok", emoji: "▶️", label: "Ça tourne ✅" }, { id: "ko", emoji: "💥", label: "Ça plante ❌" }],
      items: [{ label: "print(Salut)", emoji: "2️⃣", correct: "ko", hint: "Sans guillemets : NameError." }],
    });
    expect((parties(f.parties, "liste").at(-1) as Extract<Partie, { genre: "liste" }>).lignes)
      .toEqual(["2️⃣ print(Salut) → 💥 Ça plante ❌ — Sans guillemets : NameError."]);
  });

  it("le code à trous : le code complété", () => {
    const f = lireExercice("game", { game_type: "fill_blank", template: "total = [___]\ntotal = [___] + 500", blanks: ["0", "total"] });
    expect((parties(f.parties, "code")[1] as Extract<Partie, { genre: "code" }>).code).toBe("total = [0]\ntotal = [total] + 500");
  });

  it("le défi de code : ce que vérifie le correcteur, et le corrigé s'il existe", () => {
    const tests = "assert \"if\" in code, \"Il faut un if pour decider.\"\nassert \"else\" in code, \"Il faut un else pour l'autre cas.\"\nassert len(output.strip()) > 0";
    expect(verificationsDuCorrecteur(tests)).toEqual(["Il faut un if pour decider.", "Il faut un else pour l'autre cas.", "len(output.strip()) > 0"]);
    expect(lireExercice("code_challenge", { hidden_tests: tests }).note).toMatch(/Pas encore de corrigé/);
    const avec = lireExercice("code_challenge", { hidden_tests: tests }, "print(1)");
    expect(avec.note).toBeNull();
    expect(parties(avec.parties, "code").map((p) => (p as Extract<Partie, { genre: "code" }>).titre)).toContain("Le corrigé, vérifié par le correcteur");
    // Un corrigé glissé dans le contenu de l'exercice n'est pas lu : sa place
    // est la table réservée au serveur, pas ce qui part vers l'enfant.
    expect(lireExercice("code_challenge", { hidden_tests: tests, solution: "print(1)" }).note).toMatch(/Pas encore de corrigé/);
  });

  it("le défi sans test ni corrigé est un défi d'exploration", () => {
    expect(lireExercice("code_challenge", { instructions: "Lance ce programme et réponds-lui.", starter_code: "input()" }).note)
      .toMatch(/Défi d'exploration/);
  });

  it("l'entraînement « code à trous » se lit comme le jeu de leçon", () => {
    const f = lireExercice("fill_blank", { template: "x = [___]", blanks: ["0"] });
    expect(f.nom).toBe("Code à trous");
    expect((parties(f.parties, "code")[1] as Extract<Partie, { genre: "code" }>).code).toBe("x = [0]");
  });

  it("la musique libre n'a pas de réponse unique", () => {
    expect(lireExercice("game", { game_type: "music", free_mode: true, min_notes: 8 }).note).toMatch(/Création libre.*8 notes/);
  });

  it("un type inconnu garde au moins sa consigne", () => {
    const f = lireExercice("nouveau_jeu", { instructions: "Fais ceci." });
    expect(f.parties).toEqual([{ genre: "texte", texte: "Fais ceci.", role: "exercice" }]);
    expect(f.note).toMatch(/pas encore de fiche/);
  });
});
