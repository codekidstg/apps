import { describe, it, expect } from "vitest";
import { occurrencesPassees } from "./occurrences-passees";

const le = (jour: string, heure = "12:00:00") => new Date(`${jour}T${heure}Z`);

/** Une séance hebdomadaire du samedi à 8 h, depuis la date donnée. */
const hebdo = (debut: string, extra: Record<string, unknown> = {}) => ({
  id: "s1", title: "Session codeKids", session_type: "recurring",
  weekday: 6, start_time: "08:00", active_from: debut, created_at: debut,
  profiles: { display_name: "Bernard" }, students: { profiles: { display_name: "Kenneth" } },
  ...extra,
});

const dates = (o: { date: string }[]) => o.map((x) => x.date);

describe("les séances passées", () => {
  const MAINTENANT = le("2026-09-23");

  it("déroule chaque samedi depuis le début, du plus récent au plus ancien", () => {
    const o = occurrencesPassees([hebdo("2026-09-01")], { jusqua: MAINTENANT });
    expect(dates(o)).toEqual(["2026-09-19", "2026-09-12", "2026-09-05"]);
    expect(o[0]).toMatchObject({ titre: "Session codeKids", mentor: "Bernard", eleve: "Kenneth" });
  });

  it("s'arrête à la fin de la séance, et ne va jamais dans le futur", () => {
    const o = occurrencesPassees([hebdo("2026-09-01", { active_until: "2026-09-12" })], { jusqua: MAINTENANT });
    expect(dates(o)).toEqual(["2026-09-12", "2026-09-05"]);
  });

  it("une séance ponctuelle ne compte qu'une fois, si elle est passée", () => {
    const ponctuelle = (quand: string) => ({
      id: "p1", title: "Première séance offerte", session_type: "one_off", scheduled_at: quand,
      profiles: { display_name: "Jean pierre" }, students: { profiles: { display_name: "Ryshawn" } },
    });
    expect(dates(occurrencesPassees([ponctuelle("2026-09-10T09:00:00Z")], { jusqua: MAINTENANT }))).toEqual(["2026-09-10"]);
    expect(occurrencesPassees([ponctuelle("2026-12-24T09:00:00Z")], { jusqua: MAINTENANT })).toEqual([]);
  });

  // La fenêtre : c'est elle qui empêche le coût de grandir tout seul.
  describe("la fenêtre de dates", () => {
    it("ne rend que ce qui est dedans", () => {
      const o = occurrencesPassees([hebdo("2026-09-01")], { depuis: le("2026-09-10"), jusqua: MAINTENANT });
      expect(dates(o)).toEqual(["2026-09-19", "2026-09-12"]);
    });

    it("découpe aussi les séances ponctuelles", () => {
      const p = { id: "p1", title: "Offerte", session_type: "one_off", scheduled_at: "2026-08-29T09:00:00Z" };
      expect(occurrencesPassees([p], { depuis: le("2026-09-01"), jusqua: MAINTENANT })).toEqual([]);
      expect(dates(occurrencesPassees([p], { jusqua: MAINTENANT }))).toEqual(["2026-08-29"]);
    });

    it("saute les années d'avant au lieu de les parcourir", () => {
      // Une hebdomadaire de 2022 : sans le saut, plus de 200 tours de boucle
      // pour rendre deux dates. Le résultat doit être exactement le même.
      const vieille = hebdo("2022-01-01");
      const fenetree = occurrencesPassees([vieille], { depuis: le("2026-09-10"), jusqua: MAINTENANT });
      const complete = occurrencesPassees([vieille], { jusqua: MAINTENANT });
      expect(dates(fenetree)).toEqual(["2026-09-19", "2026-09-12"]);
      expect(dates(fenetree)).toEqual(dates(complete).filter((d) => d >= "2026-09-10"));
      // Et la grille reste alignée sur le samedi, malgré le saut de 244 semaines.
      expect(complete.length).toBeGreaterThan(240);
      expect(new Date(`${fenetree[0].date}T12:00:00Z`).getUTCDay()).toBe(6);
    });

    it("une fenêtre qui commence après la fin de la séance ne rend rien", () => {
      expect(occurrencesPassees([hebdo("2026-09-01", { active_until: "2026-09-12" })],
        { depuis: le("2026-09-15"), jusqua: MAINTENANT })).toEqual([]);
    });

    it("sans fenêtre, le comportement d'avant est intact", () => {
      expect(dates(occurrencesPassees([hebdo("2026-09-01")], { jusqua: MAINTENANT })))
        .toEqual(["2026-09-19", "2026-09-12", "2026-09-05"]);
    });
  });
});
