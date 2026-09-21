import { describe, it, expect } from "vitest";
import { seancesComptees, exercicesAvecAide, joursDeTravail, etatLecon, type BlocLecon } from "./evolution-regles";

// Lundi 21 septembre 2026, midi à Lomé.
const MAINTENANT = new Date("2026-09-21T12:00:00Z");
const ilYa = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000);

describe("seancesComptees", () => {
  it("ne compte pas une séance qui précède la création du compte (cas de Kenneth)", () => {
    const r = seancesComptees(["2026-08-29", "2026-09-05", "2026-09-12", "2026-09-19"], new Date("2026-09-01T06:22:23Z"));
    expect(r).toEqual({ comptees: ["2026-09-05", "2026-09-12", "2026-09-19"], avant: 1 });
  });

  it("compte la séance du jour même où le compte est créé", () => {
    expect(seancesComptees(["2026-09-05"], new Date("2026-09-05T10:40:00Z")).avant).toBe(0);
  });
});

describe("exercicesAvecAide", () => {
  const finies = new Set(["garder"]);

  it("deux messages sur le même exercice font un seul exercice (cas de Kenneth)", () => {
    const q = [
      { lessonId: "choisir", blockId: "quiz", creeLe: ilYa(2) },
      { lessonId: "choisir", blockId: "quiz", creeLe: ilYa(2) },
    ];
    expect(exercicesAvecAide(q, finies, MAINTENANT)).toEqual([1]);
  });

  it("deux exercices différents d'une même leçon comptent deux", () => {
    const q = [
      { lessonId: "choisir", blockId: "quiz", creeLe: ilYa(3) },
      { lessonId: "choisir", blockId: "jeu", creeLe: ilYa(1) },
    ];
    expect(exercicesAvecAide(q, finies, MAINTENANT)).toEqual([2]);
  });

  it("ignore les leçons finies, les entraînements et ce qui a 14 jours ou plus", () => {
    const q = [
      { lessonId: "garder", blockId: "a", creeLe: ilYa(1) },
      { lessonId: null, blockId: "b", creeLe: ilYa(1) },
      { lessonId: "choisir", blockId: "c", creeLe: ilYa(14) },
    ];
    expect(exercicesAvecAide(q, finies, MAINTENANT)).toEqual([]);
  });
});

describe("joursDeTravail", () => {
  const lecons = [
    { lesson_id: "L1", status: "completed", completed_at: "2026-09-05T20:09:01Z" },
    { lesson_id: "L3", status: "in_progress", completed_at: null },
  ];
  const entrainements = [{ training_id: "T1", status: "completed", completed_at: "2026-09-11T16:30:00Z" }];

  it("range un entraînement réussi du côté des entraînements, même enregistré comme « leçon terminée »", () => {
    const j = joursDeTravail([
      { event_type: "lesson_completed", created_at: "2026-09-09T13:37:00Z", payload: { lessonId: "T1" } },
      { event_type: "lesson_completed", created_at: "2026-09-12T11:45:00Z", payload: { lessonId: "L1" } },
    ], lecons, entrainements);
    expect([...j.lecons].sort()).toEqual(["2026-09-05", "2026-09-12"]);
    expect([...j.entrainements].sort()).toEqual(["2026-09-09", "2026-09-11"]);
  });

  it("n'invente rien : identifiant inconnu, événement sans identifiant ou d'un autre type", () => {
    const j = joursDeTravail([
      { event_type: "lesson_completed", created_at: "2026-09-14T10:00:00Z", payload: { lessonId: "inconnu" } },
      { event_type: "lesson_completed", created_at: "2026-09-15T10:00:00Z", payload: null },
      { event_type: "blockly_solved", created_at: "2026-09-16T10:00:00Z", payload: { lessonId: "L3" } },
    ], lecons, entrainements);
    expect([...j.lecons]).toEqual(["2026-09-05"]);
    expect([...j.entrainements]).toEqual(["2026-09-11"]);
  });
});

describe("etatLecon", () => {
  const blocs: BlocLecon[] = [
    { id: "t0", type: "text", content: {} },
    { id: "c1", type: "code_challenge", content: { required: false } },
    { id: "q3", type: "quiz", content: { questions: [
      { question: "Qu'est-ce qui s'affiche ?", choices: ["Majeur", "Mineur"], answer: 0 },
      { question: "Combien de branches s'exécutent ?", choices: ["Une seule", "Les deux"], answer: 0 },
    ] } },
    { id: "g4", type: "game", content: { game_type: "sort" } },
    { id: "g5", type: "game", content: { game_type: "fill_blank" } },
    { id: "q7", type: "quiz", content: { question: "5 > 3 ?", choices: ["Vrai", "Faux"], answer: 0 } },
  ];

  it("compte les exercices faits comme le lecteur de leçon, et relève les mauvaises réponses", () => {
    const r = etatLecon(blocs, {
      codeResults: { c1: true },
      quizAnswers: { "q3-0": 0, "q3-1": 1 },
      quizResults: { "q3-0": true, "q3-1": false },
      solvedBlockly: { g4: true },
    });
    expect(r.faits).toBe(3);
    expect(r.total).toBe(5);
    expect(r.erreurs).toEqual([{ question: "Combien de branches s'exécutent ?", reponse: "Les deux", bonne: "Une seule" }]);
  });

  it("un quiz à moitié répondu n'est pas fait ; une question posée à plat se lit aussi", () => {
    const r = etatLecon(blocs, {
      quizAnswers: { "q3-0": 0, "q7-0": 1 },
      quizResults: { "q3-0": true, "q7-0": false },
    });
    expect(r.faits).toBe(1);
    expect(r.erreurs).toEqual([{ question: "5 > 3 ?", reponse: "Faux", bonne: "Vrai" }]);
  });

  it("sans progression : rien de fait, aucune erreur", () => {
    expect(etatLecon(blocs, null)).toEqual({ faits: 0, total: 5, erreurs: [] });
  });
});
