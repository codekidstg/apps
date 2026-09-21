import { describe, it, expect } from "vitest";
import { enFils, parEnfant } from "./fils";
import type { Question } from "./donnees";

const question = (p: Partial<Question> & Pick<Question, "id" | "poseeLe">): Question => ({
  eleveId: "kenneth", blocId: "quiz-choisir", lessonId: "choisir", trainingId: null,
  raison: "autre", message: null, misAJourLe: p.poseeLe,
  etat: "en_attente", enRetard: false, reponse: null, reglee: null, contexte: {},
  ...p,
});

describe("enFils", () => {
  it("met la conversation de Kenneth dans un seul fil, dans l'ordre où elle a eu lieu", () => {
    const fils = enFils([
      // Chargées de la plus récente à la plus ancienne, comme le fait la base.
      question({ id: "q2", poseeLe: "2026-09-19T21:40:02Z", message: "OUI C'EST REPARTI" }),
      question({
        id: "q1", poseeLe: "2026-09-19T12:13:54Z", message: "on a redonné le courant", etat: "repondue",
        reponse: { texte: "tu as pu revoir le cours ?", parNom: "Bernard", le: "2026-09-19T17:41:37Z", vueLe: "2026-09-19T21:37:51Z" },
      }),
    ]);
    expect(fils).toHaveLength(1);
    expect(fils[0].questions.map((q) => q.id)).toEqual(["q1", "q2"]);
    expect(fils[0].etat).toBe("en_attente");
    expect(fils[0].derniereActivite).toBe("2026-09-19T21:40:02Z");
  });

  it("sépare les exercices, et les élèves", () => {
    const fils = enFils([
      question({ id: "a", poseeLe: "2026-09-20T17:02:00Z", eleveId: "ryshawn", blocId: "gauche-droite" }),
      question({ id: "b", poseeLe: "2026-09-20T17:19:00Z", eleveId: "ryshawn", blocId: "plan" }),
      question({ id: "c", poseeLe: "2026-09-19T12:13:00Z", eleveId: "kenneth", blocId: "plan" }),
    ]);
    expect(fils).toHaveLength(3);
  });

  it("met en tête ce qui attend au-delà du délai, puis le plus récemment actif", () => {
    const fils = enFils([
      question({ id: "recente", poseeLe: "2026-09-20T10:00:00Z", blocId: "x" }),
      question({ id: "en-retard", poseeLe: "2026-09-16T10:00:00Z", blocId: "y", enRetard: true }),
      question({
        id: "repondue-hier", poseeLe: "2026-09-15T10:00:00Z", blocId: "z", etat: "repondue",
        reponse: { texte: "ok", parNom: "Bernard", le: "2026-09-20T12:00:00Z", vueLe: null },
      }),
    ]);
    expect(fils.map((f) => f.derniere.id)).toEqual(["en-retard", "repondue-hier", "recente"]);
  });
});

describe("parEnfant", () => {
  const repondue = (p: Partial<Question> & Pick<Question, "id" | "poseeLe">) => question({
    ...p, etat: "repondue", reponse: { texte: "ok", parNom: "Jean", le: p.poseeLe, vueLe: null },
  });

  it("une ligne par enfant, avec ses échanges, ce qui attend et ce qui dépasse le délai", () => {
    const enfants = parEnfant(enFils([
      question({ id: "r1", poseeLe: "2026-09-20T17:02:00Z", eleveId: "ryshawn", blocId: "a" }),
      question({ id: "r2", poseeLe: "2026-09-20T17:19:00Z", eleveId: "ryshawn", blocId: "b" }),
      question({ id: "k1", poseeLe: "2026-09-19T21:40:00Z", eleveId: "kenneth", blocId: "c", enRetard: true }),
      repondue({ id: "s1", poseeLe: "2026-09-21T09:00:00Z", eleveId: "samuel", blocId: "d" }),
    ]));
    expect(enfants.map((e) => [e.eleveId, e.fils.length, e.enAttente, e.enRetard])).toEqual([
      ["kenneth", 1, 1, 1],   // au-delà du délai : en tête
      ["ryshawn", 2, 2, 0],   // attend une réponse
      ["samuel", 1, 0, 0],    // tout est traité, même si c'est le plus récent
    ]);
    expect(enfants[1].derniereActivite).toBe("2026-09-20T17:19:00Z");
  });
});
