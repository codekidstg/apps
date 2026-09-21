import { describe, it, expect } from "vitest";
import { prochainesOccurrences, type SeancePlanifiee } from "./occurrences";

// Dimanche 20 septembre 2026, 11:54 à Lomé (= UTC).
const MAINTENANT = new Date("2026-09-20T11:54:00Z");

const hebdo = (p: Partial<SeancePlanifiee> = {}): SeancePlanifiee => ({
  id: "s1", title: "Session codeKids", session_type: "recurring",
  weekday: 6, start_time: "10:00:00", scheduled_at: null,
  duration_min: 60, active_from: "2026-01-01", active_until: null,
  student_id: "e1", teacher_id: "p1", ...p,
});
const ponctuelle = (quand: string, p: Partial<SeancePlanifiee> = {}): SeancePlanifiee => ({
  id: "s2", title: "Première séance offerte", session_type: "once",
  weekday: null, start_time: null, scheduled_at: quand,
  duration_min: 60, active_from: "2026-01-01", active_until: null,
  student_id: "e2", teacher_id: "p2", ...p,
});

const quand = (o: { quand: Date }) => o.quand.toISOString();

describe("prochainesOccurrences", () => {
  it("déroule un rendez-vous hebdomadaire au bon jour et à la bonne heure", () => {
    const r = prochainesOccurrences([hebdo()], 7, MAINTENANT);
    expect(r).toHaveLength(1);
    expect(quand(r[0])).toBe("2026-09-26T10:00:00.000Z");   // samedi
    expect(r[0].enCours).toBe(false);
  });

  it("garde la séance du jour encore à venir", () => {
    const r = prochainesOccurrences([hebdo({ weekday: 0, start_time: "16:00:00" })], 7, MAINTENANT);
    expect(quand(r[0])).toBe("2026-09-20T16:00:00.000Z");   // aujourd'hui
  });

  it("renvoie à la semaine suivante celle du jour déjà terminée", () => {
    const r = prochainesOccurrences([hebdo({ weekday: 0, start_time: "09:00:00" })], 7, MAINTENANT);
    expect(quand(r[0])).toBe("2026-09-27T09:00:00.000Z");
  });

  it("montre comme « en cours » celle qui a commencé et n'est pas finie", () => {
    const r = prochainesOccurrences([hebdo({ weekday: 0, start_time: "11:30:00" })], 7, MAINTENANT);
    expect(quand(r[0])).toBe("2026-09-20T11:30:00.000Z");
    expect(r[0].enCours).toBe(true);
  });

  it("ne montre pas une récurrence qui ne commence que plus tard", () => {
    expect(prochainesOccurrences([hebdo({ active_from: "2026-11-01" })], 7, MAINTENANT)).toEqual([]);
  });

  it("s'arrête à la fin de la récurrence, dernier jour inclus", () => {
    expect(prochainesOccurrences([hebdo({ active_until: "2026-09-26" })], 7, MAINTENANT)).toHaveLength(1);
    expect(prochainesOccurrences([hebdo({ active_until: "2026-09-25" })], 7, MAINTENANT)).toEqual([]);
  });

  it("déroule toutes les occurrences d'une fenêtre longue", () => {
    const r = prochainesOccurrences([hebdo()], 30, MAINTENANT);
    expect(r.map(quand)).toEqual([
      "2026-09-26T10:00:00.000Z",
      "2026-10-03T10:00:00.000Z",
      "2026-10-10T10:00:00.000Z",
      "2026-10-17T10:00:00.000Z",
    ]);
  });

  it("trie une séance ponctuelle parmi les récurrentes, et écarte le passé comme le lointain", () => {
    const r = prochainesOccurrences([
      hebdo(),                                     // samedi 26, 10:00
      ponctuelle("2026-09-23T08:00:00Z", { id: "a" }),  // mercredi 23
      ponctuelle("2026-09-19T08:00:00Z", { id: "b" }),  // hier
      ponctuelle("2026-10-05T08:00:00Z", { id: "c" }),  // hors fenêtre
    ], 7, MAINTENANT);
    expect(r.map((o) => o.seanceId)).toEqual(["a", "s1"]);
  });

  it("remplace un titre vide par un mot lisible", () => {
    const r = prochainesOccurrences([hebdo({ title: "   " })], 7, MAINTENANT);
    expect(r[0].titre).toBe("Séance");
  });

  it("ne dépend pas du fuseau de la machine", () => {
    // Un poste européen lit « 2026-09-26T10:00Z » comme 12:00 : si le calcul
    // passait par getDay()/setHours(), le jour de la semaine basculerait pour
    // les séances de fin de soirée. Ici, minuit et le jour sont togolais.
    const tard = prochainesOccurrences([hebdo({ weekday: 1, start_time: "23:30:00" })], 7, MAINTENANT);
    expect(quand(tard[0])).toBe("2026-09-21T23:30:00.000Z");   // lundi, pas mardi
  });
});
