import { describe, it, expect } from "vitest";
import { statutParent } from "./statut-parent";

// Lundi 21 septembre 2026, midi à Lomé.
const MAINTENANT = new Date("2026-09-21T12:00:00Z");
const ilYa = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000);
const statut = (presence: number | null, compte = 60) =>
  statutParent({ dernierePresence: presence === null ? null : ilYa(presence), compteCree: ilYa(compte) }, MAINTENANT);

describe("statutParent", () => {
  it("venu dans les 7 derniers jours : actif", () => {
    expect(statut(0)).toBe("actif");
    expect(statut(7)).toBe("actif");
  });

  it("de 8 à 14 jours : tiède", () => {
    expect(statut(8)).toBe("tiede");
    expect(statut(14)).toBe("tiede");
  });

  it("plus de 14 jours : à relancer", () => {
    expect(statut(15)).toBe("relancer");
  });

  it("jamais venu : nouveau pendant 7 jours, puis à relancer", () => {
    expect(statut(null, 3)).toBe("nouveau");
    expect(statut(null, 6)).toBe("nouveau");
    expect(statut(null, 7)).toBe("relancer");
  });

  it("un nouveau compte déjà venu est actif, pas nouveau", () => {
    expect(statut(1, 2)).toBe("actif");
  });
});
