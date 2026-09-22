import { describe, it, expect } from "vitest";
import { moisDisponibles, lireMois, libelleMois, DEBUT_SUIVI } from "./mois";

const le = (jour: string) => new Date(`${jour}T12:00:00Z`);
const cles = (d: Date) => moisDisponibles(d).map((m) => m.cle);

describe("les mois du suivi", () => {
  it("le premier mois du suivi est seul dans la liste", () => {
    expect(cles(le("2026-09-22"))).toEqual([DEBUT_SUIVI]);
  });

  it("la liste s'allonge d'un mois par mois, du plus récent au plus ancien", () => {
    expect(cles(le("2026-10-01"))).toEqual(["2026-10", "2026-09"]);
    expect(cles(le("2027-02-15"))).toEqual(["2027-02", "2027-01", "2026-12", "2026-11", "2026-10", "2026-09"]);
  });

  it("puis elle glisse : au-delà d'un an, le plus ancien sort", () => {
    // Douze mois pile : septembre 2026 est encore là.
    expect(cles(le("2027-08-31"))).toHaveLength(12);
    expect(cles(le("2027-08-31")).at(-1)).toBe("2026-09");
    // Le mois suivant, il sort.
    expect(cles(le("2027-09-01"))).toEqual(expect.arrayContaining(["2027-09"]));
    expect(cles(le("2027-09-01"))).toHaveLength(12);
    expect(cles(le("2027-09-01")).at(-1)).toBe("2026-10");
  });

  it("jamais de mois avant le début du suivi, même avec une horloge en arrière", () => {
    expect(cles(le("2026-05-10"))).toEqual(["2026-05"]);
  });

  it("l'adresse ne fabrique pas un mois qui n'a pas eu lieu", () => {
    const aujourdhui = le("2027-03-10");
    expect(lireMois("2026-08", aujourdhui)).toBe("2027-03");   // avant le suivi
    expect(lireMois("2027-04", aujourdhui)).toBe("2027-03");   // dans le futur
    expect(lireMois("2027-13", aujourdhui)).toBe("2027-03");   // mois inexistant
    expect(lireMois("bricolé", aujourdhui)).toBe("2027-03");
    expect(lireMois(undefined, aujourdhui)).toBe("2027-03");
  });

  it("un mois sorti de la fenêtre reste lisible : les anciens bilans y renvoient", () => {
    expect(lireMois("2026-09", le("2028-01-05"))).toBe("2026-09");
  });

  it("les libellés sont écrits en français", () => {
    expect(libelleMois("2026-09")).toBe("septembre 2026");
    expect(libelleMois("2027-01")).toBe("janvier 2027");
  });
});
