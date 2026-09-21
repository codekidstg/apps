import { describe, it, expect } from "vitest";
import { reponsesDansLaFiche } from "./reponses-eleve";
import { lireExercice } from "./corrige";
import { travailLisible } from "./travail";

// Le quiz de « Choisir », tel que Kenneth l'a envoyé le 19 septembre.
const QUIZ = { questions: [
  { question: "age = 20 : qu'est-ce qui s'affiche ?", choices: ["Majeur", "Mineur"], answer: 0 },
  { question: "Dans un si… sinon…, combien de branches s'exécutent ?", choices: ["Toujours une seule", "Les deux"], answer: 0 },
  { question: "Une ligne SANS décalage après le si : quand s'exécute-t-elle ?", choices: ["Seulement si vrai", "Toujours"], answer: 1 },
] };
const bloc = { id: "q", type: "quiz", content: QUIZ };

describe("reponsesDansLaFiche", () => {
  it("retrouve chaque choix de l'enfant dans la fiche du quiz", () => {
    const travail = travailLisible(bloc, {
      quizAnswers: { "q-0": 0, "q-1": 1, "q-2": 0 },
      quizResults: { "q-0": true, "q-1": false, "q-2": false },
    });
    expect(reponsesDansLaFiche(travail, lireExercice("quiz", QUIZ))).toEqual({ choix: { 0: 0, 1: 1, 2: 0 }, complet: true });
  });

  it("lit le texte tel qu'il arrive en base, retours à la ligne changés par le formulaire", () => {
    // Recopié de la question de Kenneth du 19 septembre, telle qu'enregistrée.
    const travail = "age = 20 : qu'est-ce qui s'affiche ?\r\n→ Majeur (juste)\r\n\r\nDans un si… sinon…, combien de branches s'exécutent ?\r\n→ Les deux (faux)";
    expect(reponsesDansLaFiche(travail, lireExercice("quiz", QUIZ))).toEqual({ choix: { 0: 0, 1: 1 }, complet: true });
  });

  it("une question pas encore répondue n'a pas de choix", () => {
    const travail = travailLisible(bloc, { quizAnswers: { "q-1": 1 }, quizResults: { "q-1": false } });
    expect(reponsesDansLaFiche(travail, lireExercice("quiz", QUIZ))).toEqual({ choix: { 1: 1 }, complet: true });
  });

  it("les phrases à compléter d'un entraînement", () => {
    const contenu = { sentences: [
      { before: "Les blocs envoyés à Kirikou sont une", after: "pour lui.", options: ["entrée", "sortie"], correct: 0 },
    ] };
    const travail = travailLisible({ id: "f", type: "fill_blank", content: contenu }, { fillAnswers: { "f-0": 1 }, fillResults: { "f-0": false } });
    expect(reponsesDansLaFiche(travail, lireExercice("fill_blank", contenu))).toEqual({ choix: { 0: 1 }, complet: true });
  });

  it("la leçon a changé depuis la question : ce qui ne se retrouve plus garde le bloc « ce qu'il avait fait »", () => {
    const travail = "Une question retirée depuis\n→ Oui (faux)\n\nDans un si… sinon…, combien de branches s'exécutent ?\n→ Les deux (faux)";
    expect(reponsesDansLaFiche(travail, lireExercice("quiz", QUIZ))).toEqual({ choix: { 1: 1 }, complet: false });
    expect(reponsesDansLaFiche("print('bonjour')", lireExercice("quiz", QUIZ))).toBeNull();
    expect(reponsesDansLaFiche(null, lireExercice("quiz", QUIZ))).toBeNull();
  });
});
