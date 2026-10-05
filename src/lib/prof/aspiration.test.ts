import { describe, it, expect } from "vitest";
import { picDeConsultation, estUneAspiration, SEUIL_LECONS } from "./aspiration";

const base = new Date("2026-10-10T09:00:00Z").getTime();
const a = (minutes: number, lesson: string) => ({
  lesson_id: lesson,
  consulte_le: new Date(base + minutes * 60_000).toISOString(),
});

describe("picDeConsultation", () => {
  it("ne dit rien quand il n'y a rien", () => {
    expect(picDeConsultation([])).toBeNull();
  });

  it("compte les leçons différentes d'une même fenêtre", () => {
    const pic = picDeConsultation([a(0, "l1"), a(5, "l2"), a(10, "l3")]);
    expect(pic?.lecons).toBe(3);
  });

  it("ne compte qu'une fois une leçon rouverte — relire, c'est travailler", () => {
    const pic = picDeConsultation([a(0, "l1"), a(5, "l1"), a(10, "l1"), a(12, "l2")]);
    expect(pic?.lecons).toBe(2);
  });

  it("ne mélange pas deux séances éloignées dans le temps", () => {
    // Trois leçons le matin, trois l'après-midi : jamais six d'un coup.
    const pic = picDeConsultation([
      a(0, "l1"), a(5, "l2"), a(10, "l3"),
      a(300, "l4"), a(305, "l5"), a(310, "l6"),
    ]);
    expect(pic?.lecons).toBe(3);
  });

  it("retient la fenêtre la plus chargée, pas la dernière", () => {
    const beaucoup = Array.from({ length: 20 }, (_, i) => a(i, `l${i}`));
    const pic = picDeConsultation([...beaucoup, a(600, "tard")]);
    expect(pic?.lecons).toBe(20);
  });

  it("donne le moment où la fenêtre a commencé", () => {
    const pic = picDeConsultation([a(0, "l1"), a(5, "l2")]);
    expect(pic?.debut).toBe(new Date(base).toISOString());
  });

  it("ignore une date illisible plutôt que de tout rejeter", () => {
    const pic = picDeConsultation([a(0, "l1"), { lesson_id: "l2", consulte_le: "pas une date" }]);
    expect(pic?.lecons).toBe(1);
  });
});

describe("estUneAspiration", () => {
  it("laisse tranquille un mentor qui prépare sa séance", () => {
    const pic = picDeConsultation([a(0, "l1"), a(3, "l2"), a(8, "l3")]);
    expect(estUneAspiration(pic)).toBe(false);
  });

  it("ne se déclenche pas pile au seuil", () => {
    const pile = Array.from({ length: SEUIL_LECONS }, (_, i) => a(i, `l${i}`));
    expect(estUneAspiration(picDeConsultation(pile))).toBe(false);
  });

  it("se déclenche juste au-dessus", () => {
    const trop = Array.from({ length: SEUIL_LECONS + 1 }, (_, i) => a(i, `l${i}`));
    expect(estUneAspiration(picDeConsultation(trop))).toBe(true);
  });

  it("ne dit rien quand il n'y a aucune consultation", () => {
    expect(estUneAspiration(null)).toBe(false);
  });
});
