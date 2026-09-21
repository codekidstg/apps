import { describe, it, expect } from "vitest";
import { alerteDe } from "./alerte-lecon";

const lecon = (p: { publiee?: boolean; blocs?: number } = {}) => ({
  etat: "trouvee" as const,
  lecon: { id: "l", titre: "Les dictionnaires", themeId: "t", publiee: true, blocs: 17, ...p },
});

describe("alerteDe", () => {
  it("se tait quand la leçon est publiée et remplie", () => {
    expect(alerteDe(lecon())).toBeNull();
  });

  it("se tait pour une séance de groupe, faute d'élève dont déduire une leçon", () => {
    expect(alerteDe(undefined)).toBeNull();
  });

  it("prévient quand le mentor ouvrirait une leçon vide", () => {
    expect(alerteDe(lecon({ blocs: 0 }))).toBe("Leçon vide — aucun bloc");
  });

  it("prévient quand la leçon n'est pas publiée", () => {
    expect(alerteDe(lecon({ publiee: false }))).toBe("Leçon non publiée");
  });

  it("dit les deux quand la leçon n'est ni publiée ni écrite", () => {
    expect(alerteDe(lecon({ publiee: false, blocs: 0 }))).toBe("Leçon non publiée, et vide");
  });

  it("distingue l'élève sans thème de celui qui a tout fini", () => {
    expect(alerteDe({ etat: "aucun-theme" })).toBe("Aucun thème activé pour cet élève");
    expect(alerteDe({ etat: "termine" })).toBe("Parcours terminé — plus rien à ouvrir");
  });
});
