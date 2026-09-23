import { describe, it, expect } from "vitest";
import { attentes, calculerNote, couleurNote, momentTraitee, type SeanceDuMois } from "./note-mentor";

// Le 1er octobre à midi : le mois de septembre vient de finir.
const MAINTENANT = new Date("2026-10-01T12:00:00Z");

const rapport = (heuresApres: number, utile = true) => ({
  tenue: true, raisonNonTenue: null,
  rendule: new Date(new Date("2026-09-05T10:00:00Z").getTime() + heuresApres * 3_600_000).toISOString(),
  difficultes: utile, aides: false, noteProchaine: utile,
});
/** Une séance au 5, 12, 19… septembre, avec son compte rendu rendu 2 h après. */
const seance = (jour: number, r: SeanceDuMois["rapport"] = null): SeanceDuMois => ({
  date: `2026-09-${String(jour).padStart(2, "0")}`,
  quand: `2026-09-${String(jour).padStart(2, "0")}T10:00:00Z`,
  eleve: "Kenneth",
  rapport: r && { ...r, rendule: new Date(new Date(`2026-09-${String(jour).padStart(2, "0")}T10:00:00Z`).getTime() + (new Date(r.rendule).getTime() - new Date("2026-09-05T10:00:00Z").getTime())).toISOString() },
});
const parfaites = (n: number) => Array.from({ length: n }, (_, i) => seance(5 + i * 7, rapport(2)));
const note = (p: Parameters<typeof calculerNote>[0]) => calculerNote(p, MAINTENANT);

describe("la note du mentor", () => {
  it("un mois sans faute vaut 100", () => {
    const n = note({ seances: parfaites(3), questions: [], eleves: [] });
    expect(n.note).toBe(100);
    expect(n.pertes).toEqual([]);
    // Sans question ni élève en difficulté, les séances portent les 100 points.
    expect(n.blocs[0]).toMatchObject({ nom: "Ses séances", sur: 100, unites: 3 });
  });

  it("le même oubli coûte le même prix, avec 3 séances ou avec 8", () => {
    const petit = note({ seances: [seance(5, null), ...parfaites(2)], questions: [], eleves: [] });
    const gros = note({ seances: [seance(5, null), ...Array.from({ length: 7 }, (_, i) => seance(6 + i, rapport(2)))], questions: [], eleves: [] });
    expect(petit.note).toBe(92);
    expect(gros.note).toBe(92);
    expect(petit.pertes[0]).toMatchObject({ points: 8, manques: ["compte rendu jamais fait"] });
  });

  it("un compte rendu en retard, ou qui ne dit rien, coûte aussi", () => {
    const retard = note({ seances: [seance(5, rapport(72)), ...parfaites(2)], questions: [], eleves: [] });
    expect(retard.pertes[0].manques).toEqual(["compte rendu rendu 3 jours après"]);
    const vide = note({ seances: [seance(5, rapport(2, false)), ...parfaites(2)], questions: [], eleves: [] });
    expect(vide.pertes[0].manques).toEqual(["compte rendu sans difficulté, ni méthode d'aide, ni note pour la prochaine fois"]);
    expect(vide.note).toBeLessThan(100);
  });

  it("une séance non tenue sort du décompte, sauf si le mentor était empêché", () => {
    const nonTenue = (raison: string): SeanceDuMois => ({
      ...seance(26), rapport: { tenue: false, raisonNonTenue: raison, rendule: "2026-09-26T18:00:00Z", difficultes: false, aides: false, noteProchaine: false },
    });
    const absent = note({ seances: [...parfaites(3), nonTenue("enfant_absent")], questions: [], eleves: [] });
    expect(absent.note).toBe(100);
    expect(absent.seances).toEqual({ comptees: 3, nonTenues: [{ date: "2026-09-26", raison: "enfant_absent", duMentor: false }] });

    const empeche = note({ seances: [...parfaites(3), nonTenue("mentor_empeche")], questions: [], eleves: [] });
    expect(empeche.note).toBe(92);
    expect(empeche.pertes[0].manques).toEqual(["non tenue — le mentor était empêché"]);
  });

  it("les questions des enfants : sans réponse, ou répondues trop tard", () => {
    const seances = parfaites(3);
    const q = (traiteeLe: string | null) => [{ eleve: "Ryshawn", exercice: "quiz-1", poseeLe: "2026-09-20T17:00:00Z", traiteeLe }];
    const sans = note({ seances, questions: q(null), eleves: [] });
    expect(sans.note).toBe(92);
    expect(sans.pertes[0].manques).toEqual(["toujours sans réponse"]);

    const tard = note({ seances, questions: q("2026-09-23T17:00:00Z"), eleves: [] });
    expect(tard.pertes[0].manques).toEqual(["répondue au bout de 3 jours"]);

    const aTemps = note({ seances, questions: q("2026-09-21T09:00:00Z"), eleves: [] });
    expect(aTemps.note).toBe(100);
  });

  it("une question posée il y a moins de 48 h n'est pas encore en retard", () => {
    const n = note({ seances: parfaites(3), questions: [{ eleve: "Ryshawn", exercice: "quiz-1", poseeLe: "2026-09-30T18:00:00Z", traiteeLe: null }], eleves: [] });
    expect(n.note).toBe(100);
    expect(n.blocs[1].unites).toBe(0);
  });

  // Le mentor ne voit pas des questions une à une : il voit des fils, et il
  // répond au dernier message du fil.
  describe("deux messages sur le même exercice font un seul échange", () => {
    const q = (exercice: string, jour: string, traiteeLe: string | null = null) =>
      ({ eleve: "Kenneth", exercice, poseeLe: `2026-09-${jour}T10:00:00Z`, traiteeLe });

    it("deux messages sans réponse ne coûtent qu'une faute, comptée depuis le premier", () => {
      expect(attentes([q("quiz-1", "19"), q("quiz-1", "20")]))
        .toEqual([{ eleve: "Kenneth", depuis: "2026-09-19T10:00:00Z", traiteeLe: null }]);
      const n = note({ seances: parfaites(3), questions: [q("quiz-1", "19"), q("quiz-1", "20")], eleves: [] });
      expect(n.note).toBe(92);
      expect(n.pertes).toHaveLength(1);
      expect(n.pertes[0].quoi).toBe("Question de Kenneth du 19 sept. à 10:00");
    });

    it("mais deux exercices différents restent deux échanges", () => {
      const n = note({ seances: parfaites(3), questions: [q("quiz-1", "19"), q("quiz-2", "20")], eleves: [] });
      expect(n.pertes).toHaveLength(2);
      expect(n.note).toBe(84);
    });

    it("l'enfant qui relance après une réponse rouvre une attente", () => {
      // Répondu en 2 h le 19, l'enfant redemande le 20 : le mentor doit encore.
      expect(attentes([q("quiz-1", "19", "2026-09-19T12:00:00Z"), q("quiz-1", "20")])).toEqual([
        { eleve: "Kenneth", depuis: "2026-09-19T10:00:00Z", traiteeLe: "2026-09-19T12:00:00Z" },
        { eleve: "Kenneth", depuis: "2026-09-20T10:00:00Z", traiteeLe: null },
      ]);
    });

    it("une seule réponse solde les messages qui la précèdent", () => {
      // Deux messages de suite, une réponse au dernier : tout est traité, et
      // l'attente se compte depuis le premier.
      expect(attentes([q("quiz-1", "19"), q("quiz-1", "20", "2026-09-20T11:00:00Z")]))
        .toEqual([{ eleve: "Kenneth", depuis: "2026-09-19T10:00:00Z", traiteeLe: "2026-09-20T11:00:00Z" }]);
      // 25 h après le premier message : dans le délai, rien n'est perdu.
      expect(note({ seances: parfaites(3), questions: [q("quiz-1", "19"), q("quiz-1", "20", "2026-09-20T11:00:00Z")], eleves: [] }).note).toBe(100);
    });

    it("relancer n'efface pas le retard déjà subi", () => {
      // L'enfant demande le 19, redemande le 20, réponse le 22 : 25 h après son
      // dernier message, mais 3 jours après le premier. C'est le premier qui compte.
      const n = note({ seances: parfaites(3), questions: [q("quiz-1", "19"), q("quiz-1", "20", "2026-09-22T11:00:00Z")], eleves: [] });
      expect(n.pertes[0].manques).toEqual(["répondue au bout de 3 jours"]);
    });
  });

  // Une question réglée en séance est une réponse comme une autre : ce qui
  // compte, c'est quand l'enfant l'a eue.
  describe("la question réglée en séance", () => {
    const posee = "2026-09-16T18:32:00Z";
    const seance = (jour: string, heure = "08:00", tenue = true) => ({ quand: `2026-09-${jour}T${heure}:00Z`, tenue });

    it("compte depuis la séance, pas depuis le moment où le mentor l'a notée", () => {
      // Séance le 19 au matin, notée le 21 au soir : c'est la séance qui compte.
      expect(momentTraitee({ poseeLe: posee, repondueLe: null, regleeLe: "2026-09-21T20:00:00Z" }, [seance("19")]))
        .toEqual({ traiteeLe: "2026-09-19T08:00:00Z", enSeance: true });
    });

    it("moins de 48 h entre la question et la séance : rien n'est perdu", () => {
      const quest = { eleve: "Samuel", exercice: "quiz-1", poseeLe: "2026-09-18T19:00:00Z" };
      const { traiteeLe } = momentTraitee({ poseeLe: quest.poseeLe, repondueLe: null, regleeLe: "2026-09-25T09:00:00Z" }, [seance("19")]);
      expect(note({ seances: parfaites(3), questions: [{ ...quest, traiteeLe }], eleves: [] }).note).toBe(100);
    });

    it("au-delà de 48 h, elle coûte, même réglée pendant la séance", () => {
      const quest = { eleve: "Samuel", exercice: "quiz-1", poseeLe: posee };
      const { traiteeLe } = momentTraitee({ poseeLe: posee, repondueLe: null, regleeLe: "2026-09-19T08:30:00Z" }, [seance("19")]);
      expect(note({ seances: parfaites(3), questions: [{ ...quest, traiteeLe }], eleves: [] }).pertes[0].manques)
        .toEqual(["répondue au bout de 3 jours"]);
    });

    it("une séance non tenue n'a rien apporté à l'enfant : on prend la suivante", () => {
      expect(momentTraitee({ poseeLe: posee, repondueLe: null, regleeLe: "2026-09-27T10:00:00Z" },
        [seance("19", "08:00", false), seance("26")]))
        .toEqual({ traiteeLe: "2026-09-26T08:00:00Z", enSeance: true });
    });

    it("sans aucune séance depuis, il reste le moment où le mentor l'a réglée", () => {
      expect(momentTraitee({ poseeLe: posee, repondueLe: null, regleeLe: "2026-09-20T10:00:00Z" }, []))
        .toEqual({ traiteeLe: "2026-09-20T10:00:00Z", enSeance: false });
      // Une séance d'avant la question ne compte pas non plus.
      expect(momentTraitee({ poseeLe: posee, repondueLe: null, regleeLe: "2026-09-20T10:00:00Z" }, [seance("12")]))
        .toEqual({ traiteeLe: "2026-09-20T10:00:00Z", enSeance: false });
    });

    it("une réponse écrite garde sa date, et une question ouverte attend encore", () => {
      expect(momentTraitee({ poseeLe: posee, repondueLe: "2026-09-17T09:00:00Z", regleeLe: null }, [seance("19")]))
        .toEqual({ traiteeLe: "2026-09-17T09:00:00Z", enSeance: false });
      // Une séance passée ne solde pas toute seule ce que le mentor doit.
      expect(momentTraitee({ poseeLe: posee, repondueLe: null, regleeLe: null }, [seance("19")]))
        .toEqual({ traiteeLe: null, enSeance: false });
    });
  });

  it("un élève qui décroche sans que le mentor le signale", () => {
    const eleve = { nom: "Kenneth", enDifficulte: true, avecSeance: true, signale: false, suite: false };
    const n = note({ seances: parfaites(3), questions: [], eleves: [eleve] });
    expect(n.note).toBe(92);
    expect(n.pertes[0].manques).toEqual(["aucun compte rendu du mois ne le signale", "aucun compte rendu ne dit quoi reprendre"]);

    // Un élève qui va bien, ou qu'il n'a pas vu ce mois-ci, ne compte pas.
    expect(note({ seances: parfaites(3), questions: [], eleves: [{ ...eleve, enDifficulte: false }] }).note).toBe(100);
    expect(note({ seances: parfaites(3), questions: [], eleves: [{ ...eleve, avecSeance: false }] }).note).toBe(100);
  });

  it("sous trois séances, pas de note", () => {
    const deux = note({ seances: parfaites(2), questions: [], eleves: [] });
    expect(deux.note).toBeNull();
    expect(deux.sansNote).toMatch(/2 séances seulement/);
    expect(note({ seances: [], questions: [], eleves: [] }).sansNote).toMatch(/aucune séance/);
  });

  it("les couleurs suivent le seuil de 80", () => {
    expect(couleurNote(100).pastille).toBe("🟢");
    expect(couleurNote(80).pastille).toBe("🟢");
    expect(couleurNote(79).pastille).toBe("🟡");
    expect(couleurNote(69).pastille).toBe("🔴");
    expect(couleurNote(null).pastille).toBe("⚪");
  });
});
