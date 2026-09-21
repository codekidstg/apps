import { describe, it, expect } from "vitest";
import { statutEleve, joursDepuis, type FaitsEleve } from "./statut-eleve";

// Lundi 21 septembre 2026, midi à Lomé.
const MAINTENANT = new Date("2026-09-21T12:00:00Z");
const ilYa = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000);

const eleve = (p: Partial<FaitsEleve> = {}): FaitsEleve => ({
  debut: ilYa(60), derniereActivite: ilYa(2),
  seancesPassees: 6, leconsTerminees: 6,
  engagements: ["focused", "motivated"], avancements: ["completed", "completed"], blocagesParLecon: [],
  ...p,
});
const statut = (p: Partial<FaitsEleve>) => statutEleve(eleve(p), MAINTENANT).statut;

describe("statutEleve", () => {
  it("un élève actif et au rythme progresse", () => {
    expect(statut({})).toBe("progresse");
  });

  it("un élève inscrit depuis moins de 14 jours démarre, même sans activité", () => {
    expect(statut({ debut: ilYa(5), derniereActivite: null, seancesPassees: 1, leconsTerminees: 0 })).toBe("demarre");
  });

  it("l'aide demandée sur deux exercices d'une même leçon bloque, même au démarrage", () => {
    expect(statutEleve(eleve({ debut: ilYa(5), blocagesParLecon: [2] }), MAINTENANT)).toEqual({
      statut: "bloque", raisons: ["« Je bloque ici » sur 2 exercices d'une leçon pas finie, en 14 jours"],
    });
    // Un exercice dans chacune de deux leçons : pas le même blocage.
    expect(statut({ blocagesParLecon: [1, 1] })).toBe("progresse");
  });

  it("l'inactivité suit les seuils : 7 jours va, 8 ralentit, 14 bloque", () => {
    expect(statut({ derniereActivite: ilYa(7) })).toBe("progresse");
    expect(statut({ derniereActivite: ilYa(8) })).toBe("ralentit");
    expect(statut({ derniereActivite: ilYa(13) })).toBe("ralentit");
    expect(statut({ derniereActivite: ilYa(14) })).toBe("bloque");
  });

  it("jamais actif après la période de démarrage : bloqué", () => {
    expect(statut({ derniereActivite: null })).toBe("bloque");
  });

  it("2 leçons de retard sur ses séances ralentissent, 1 non", () => {
    expect(statut({ seancesPassees: 6, leconsTerminees: 4 })).toBe("ralentit");
    expect(statut({ seancesPassees: 6, leconsTerminees: 5 })).toBe("progresse");
  });

  it("une avance sur les séances n'est jamais comptée comme un retard", () => {
    expect(statut({ seancesPassees: 2, leconsTerminees: 9 })).toBe("progresse");
  });

  it("« distrait » deux rapports de suite ralentit, une seule fois non", () => {
    expect(statut({ engagements: ["distracted", "distracted"] })).toBe("ralentit");
    expect(statut({ engagements: ["distracted", "focused"] })).toBe("progresse");
  });

  it("« démotivé » compte comme « distrait »", () => {
    expect(statut({ engagements: ["disengaged", "distracted"] })).toBe("ralentit");
  });

  it("le mentor qui écrit « n'a pas pu avancer » au dernier rapport fait ralentir", () => {
    expect(statut({ avancements: ["blocked", "completed"] })).toBe("ralentit");
    expect(statut({ avancements: ["completed", "blocked"] })).toBe("progresse");
  });

  it("donne toutes les raisons, pas seulement la première", () => {
    const r = statutEleve(eleve({ derniereActivite: ilYa(9), seancesPassees: 5, leconsTerminees: 2 }), MAINTENANT);
    expect(r.statut).toBe("ralentit");
    expect(r.raisons).toEqual(["3 leçons de retard sur ses 5 séances", "inactif depuis 9 jours"]);
  });

  it("compte en jours de calendrier togolais, pas en durée écoulée", () => {
    // Hier à 23h30 : un jour de calendrier, même si 12h30 seulement ont passé.
    expect(joursDepuis(new Date("2026-09-20T23:30:00Z"), MAINTENANT)).toBe(1);
  });
});
