import { describe, it, expect } from "vitest";
import { quandLisible, resumeDuFil, FIL_VIDE, type Fil } from "./fil-format";

/** Midi au Togo, pour que « aujourd'hui / hier » ne dépendent pas de l'heure du test. */
const MIDI = new Date("2026-09-29T12:00:00Z").getTime();
const JOUR = 86_400_000;

describe("quandLisible", () => {
  it("dit « aujourd'hui » et « hier » plutôt qu'une date", () => {
    expect(quandLisible(new Date(MIDI - 3600_000).toISOString(), MIDI).jour).toBe("aujourd'hui");
    expect(quandLisible(new Date(MIDI - JOUR).toISOString(), MIDI).jour).toBe("hier");
  });

  it("écrit la date au-delà de la veille, et ne la dit plus fraîche", () => {
    const q = quandLisible(new Date(MIDI - 5 * JOUR).toISOString(), MIDI);
    expect(q.jour).toMatch(/24/);
    expect(q.frais).toBe(false);
  });

  it("garde l'heure du Togo, pas celle du serveur", () => {
    // 23h30 UTC un 29 : au Togo (UTC+0) c'est encore le 29 à 23h30.
    expect(quandLisible("2026-09-29T23:30:00Z", MIDI).heure).toBe("23h30");
  });
});

describe("resumeDuFil", () => {
  it("le dit franchement quand rien n'a été fait", () => {
    expect(resumeDuFil(FIL_VIDE, MIDI)).toBe("Aucun passage enregistré pour l'instant.");
  });

  it("assemble le passage, la dernière séance et la leçon en cours", () => {
    const fil: Fil = {
      evenements: [],
      dernierPassage: new Date(MIDI - 3600_000).toISOString(),
      derniereLecon: { titre: "Les listes", quand: new Date(MIDI - JOUR).toISOString() },
      enCours: { titre: "Les dictionnaires", faits: 3, total: 5 },
    };
    expect(resumeDuFil(fil, MIDI)).toBe(
      "Dernier passage aujourd'hui · a terminé « Les listes » hier · en est à 3 exercices sur 5 de « Les dictionnaires ».",
    );
  });

  it("ne double pas le point derrière une date abrégée", () => {
    const fil: Fil = {
      ...FIL_VIDE,
      dernierPassage: new Date(MIDI - 5 * JOUR).toISOString(),
      derniereLecon: { titre: "Répéter", quand: new Date(MIDI - 5 * JOUR).toISOString() },
    };
    expect(resumeDuFil(fil, MIDI)).not.toMatch(/\.\.$/);
  });

  it("accorde le singulier d'un seul exercice fait", () => {
    const fil: Fil = {
      ...FIL_VIDE,
      dernierPassage: new Date(MIDI).toISOString(),
      enCours: { titre: "Les listes", faits: 1, total: 7 },
    };
    expect(resumeDuFil(fil, MIDI)).toContain("1 exercice sur 7");
  });

  it("se contente de « a ouvert » quand la leçon n'a aucun exercice", () => {
    const fil: Fil = {
      ...FIL_VIDE,
      dernierPassage: new Date(MIDI).toISOString(),
      enCours: { titre: "Le jalon", faits: 0, total: 0 },
    };
    expect(resumeDuFil(fil, MIDI)).toContain("a ouvert « Le jalon »");
  });
});
