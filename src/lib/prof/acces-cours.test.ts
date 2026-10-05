import { describe, it, expect } from "vitest";
import { leconsAutorisees, ordreDesLecons, leconOuverte } from "./acces-cours";

const ordre = ["l1", "l2", "l3", "l4", "l5"];

describe("leconsAutorisees", () => {
  it("ouvre la première leçon quand aucun élève n'a rien terminé", () => {
    expect([...leconsAutorisees(ordre, new Set())]).toEqual(["l1"]);
  });

  it("ouvre le passé et une seule leçon d'avance", () => {
    expect([...leconsAutorisees(ordre, new Set(["l1", "l2"]))]).toEqual(["l1", "l2", "l3"]);
  });

  it("se cale sur l'élève le plus avancé, pas sur le dernier inscrit", () => {
    // Un élève en est à la 1, un autre à la 4 : le mentor prépare pour les deux.
    expect([...leconsAutorisees(ordre, new Set(["l1", "l4"]))])
      .toEqual(["l1", "l2", "l3", "l4", "l5"]);
  });

  it("n'ouvre rien au-delà de la fin du thème", () => {
    expect([...leconsAutorisees(ordre, new Set(ordre))]).toEqual(ordre);
  });

  it("ignore une leçon terminée qui n'appartient pas au thème", () => {
    expect([...leconsAutorisees(ordre, new Set(["ailleurs"]))]).toEqual(["l1"]);
  });

  it("ne tombe pas sur un thème vide", () => {
    expect([...leconsAutorisees([], new Set())]).toEqual([]);
  });
});

describe("ordreDesLecons", () => {
  it("suit le programme : chapitre par chapitre, leçon par leçon", () => {
    const chapitres = [
      { order_index: 2, lessons: [{ id: "b2", order_index: 2 }, { id: "b1", order_index: 1 }] },
      { order_index: 1, lessons: [{ id: "a2", order_index: 2 }, { id: "a1", order_index: 1 }] },
    ];
    expect(ordreDesLecons(chapitres)).toEqual(["a1", "a2", "b1", "b2"]);
  });

  it("supporte un chapitre sans leçon", () => {
    expect(ordreDesLecons([{ order_index: 1, lessons: null }])).toEqual([]);
  });
});

describe("leconOuverte", () => {
  it("laisse l'admin voir tout son catalogue", () => {
    expect(leconOuverte({ mode: "admin" }, "n-importe-quoi")).toBe(true);
  });

  it("refuse une leçon hors de la portée du mentor", () => {
    const a = { mode: "mentor", lecons: new Set(["l1"]) } as const;
    expect(leconOuverte(a, "l1")).toBe(true);
    expect(leconOuverte(a, "l4")).toBe(false);
  });

  it("refuse tout à qui n'est ni admin ni mentor du thème", () => {
    expect(leconOuverte({ mode: "refus" }, "l1")).toBe(false);
  });
});
