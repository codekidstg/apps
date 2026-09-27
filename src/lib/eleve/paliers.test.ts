import { describe, it, expect } from "vitest";
import { ceintureDe, CEINTURES } from "./paliers";

/** Une séance complète : deux exercices par palier, comme les lots écrits. */
const seance = (faits: number[]) =>
  [1, 1, 2, 2, 2, 3, 3].map((palier, i) => ({ palier, attempts: faits.includes(i) ? 1 : 0 }));

describe("la ceinture d'une séance", () => {
  it("part blanche quand rien n'est fait", () => {
    expect(ceintureDe(seance([]))).toEqual(CEINTURES[0]);
  });

  it("passe jaune quand tout le premier palier est fait", () => {
    expect(ceintureDe(seance([0, 1]))).toEqual(CEINTURES[1]);
  });

  it("ne saute pas un barreau : le palier 3 fait sans le 2 ne donne rien de plus", () => {
    expect(ceintureDe(seance([0, 1, 5, 6]))).toEqual(CEINTURES[1]);
  });

  it("passe orange aux deux premiers paliers", () => {
    expect(ceintureDe(seance([0, 1, 2, 3, 4]))).toEqual(CEINTURES[2]);
  });

  it("passe verte quand les trois paliers sont faits", () => {
    expect(ceintureDe(seance([0, 1, 2, 3, 4, 5, 6]))).toEqual(CEINTURES[3]);
  });

  it("s'arrête à un palier incomplet : un seul exercice du palier 1 ne suffit pas", () => {
    expect(ceintureDe(seance([0]))).toEqual(CEINTURES[0]);
  });

  it("n'offre pas de ceinture quand un palier n'a aucun exercice", () => {
    const sansPalier2 = [{ palier: 1, attempts: 3 }, { palier: 3, attempts: 2 }];
    expect(ceintureDe(sansPalier2)).toEqual(CEINTURES[1]);
  });

  it("une séance vide reste blanche", () => {
    expect(ceintureDe([])).toEqual(CEINTURES[0]);
  });
});
