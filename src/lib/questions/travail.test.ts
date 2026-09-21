import { describe, it, expect } from "vitest";
import { travailLisible } from "./travail";

const bloc = (type: string, content: Record<string, unknown>) => ({ id: "b", type, content });

describe("travailLisible", () => {
  it("le quiz : chaque réponse donnée, juste ou fausse", () => {
    const b = bloc("quiz", { questions: [
      { question: "Combien de branches ?", choices: ["Une", "Deux"] },
      { question: "Et sans décalage ?", choices: ["Toujours", "Jamais"] },
    ] });
    expect(travailLisible(b, { quizAnswers: { "b-0": 1 }, quizResults: { "b-0": false } }))
      .toBe("Combien de branches ?\n→ Deux (faux)");
  });

  it("le plan : l'ordre que l'enfant a composé (le cas de Ryshawn, vide jusqu'ici)", () => {
    const b = bloc("blockly_challenge", { game_type: "plan_builder", phases: ["A", "B"] });
    expect(travailLisible(b, { jeu: ["Ramasser la clé 🗝️", "Aller jusqu'à la gemme 💎"] }))
      .toBe("Son plan :\n1. Ramasser la clé 🗝️\n2. Aller jusqu'à la gemme 💎");
    expect(travailLisible(b, { jeu: [] })).toBeNull();
  });

  it("le code à trous : le code avec ce que l'enfant a tapé", () => {
    const b = bloc("game", { game_type: "fill_blank", template: "total = [___]\nx = [___] + 1" });
    expect(travailLisible(b, { jeu: ["0", ""] })).toBe("total = [0]\nx = […] + 1");
  });

  it("le motif choisi, et l'étape où l'enfant s'est arrêté", () => {
    const motif = bloc("game", { game_type: "pattern_select", instructions: ["Boum", "Tac", "Tac", "Boum"] });
    expect(travailLisible(motif, { jeu: [0, 1] })).toBe("Motif choisi : lignes 1 à 2\n   Boum\n   Tac");
    const deviens = bloc("game", { game_type: "deviens_ordinateur", etapes: [{ expression: "double(5)" }, { expression: "ajoute(10, 3)" }] });
    expect(travailLisible(deviens, { jeu: 1 })).toBe("Étapes réussies : 1 sur 2\nArrêté sur : ajoute(10, 3)");
  });

  it("la mémoire : les paires trouvées", () => {
    const b = bloc("game", { game_type: "memory", pairs: [{ left: "return", right: "Rendre" }, { left: "None", right: "Rien" }] });
    expect(travailLisible(b, { jeu: ["L1", "R1"] })).toBe("Paires trouvées : 1 sur 2\nNone ↔ Rien");
  });

  it("le code tapé, en défi comme en jeu Python", () => {
    expect(travailLisible(bloc("code_challenge", {}), { code: "print(1)" })).toBe("print(1)");
    expect(travailLisible(bloc("code_challenge", {}), { jeu: "print(2)" })).toBe("print(2)");
    expect(travailLisible(bloc("blockly_challenge", { game_type: "python_maze" }), { jeu: "avance()" })).toBe("avance()");
  });

  it("les entraînements : relier, tri rapide, bacs", () => {
    const relier = bloc("match", { pairs: [{ left: "range(3)", right: "0 1 2" }, { left: "range(2)", right: "0 1" }] });
    expect(travailLisible(relier, { matchPairs: { l0: "r1", l1: "r1" } })).toBe("range(3) → 0 1 (faux)\nrange(2) → 0 1");
    const tri = bloc("swipe_sort", {
      categories: [{ id: "ok", label: "Ça tourne" }, { id: "ko", label: "Ça plante" }],
      items: [{ id: "a", label: "print(\"Salut\")" }, { id: "b", label: "print(Salut)" }],
    });
    expect(travailLisible(tri, { swipeResults: { "b-1": { chosen: "ok", correct: false } } })).toBe("print(Salut) → Ça tourne (faux)");
    const bacs = bloc("drag_to_bin", { bins: [{ id: "8", label: "8 sons" }], items: [{ id: "x", label: "Répéter 4 fois" }] });
    expect(travailLisible(bacs, { dragResults: { "b-x": { chosen: "8", correct: true } } })).toBe("Répéter 4 fois → 8 sons");
  });

  it("rien de fait : rien à envoyer", () => {
    expect(travailLisible(bloc("game", { game_type: "sort" }), {})).toBeNull();
    expect(travailLisible(bloc("quiz", { questions: [] }), {})).toBeNull();
  });
});
