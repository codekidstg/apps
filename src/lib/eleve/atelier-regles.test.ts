import { describe, it, expect } from "vitest";
import { prenomPublic, estInteractif, titrePropre, avecDe } from "./atelier-regles";

describe("avecDe", () => {
  it("élide devant une voyelle ou un h", () => {
    expect(avecDe("Alice")).toBe("d'Alice");
    expect(avecDe("Harmonia")).toBe("d'Harmonia");
    expect(avecDe("Émile")).toBe("d'Émile");
  });

  it("garde « de » devant une consonne", () => {
    expect(avecDe("Samuel")).toBe("de Samuel");
    expect(avecDe("Kenneth")).toBe("de Kenneth");
  });
});

describe("prenomPublic", () => {
  it("garde le prénom et laisse le nom de famille", () => {
    expect(prenomPublic("Samuel Mabalo")).toBe("Samuel");
    expect(prenomPublic("Kenneth Amegandvi")).toBe("Kenneth");
  });

  it("écarte le nom de famille écrit en capitales", () => {
    expect(prenomPublic("Michael BAROMI")).toBe("Michael");
    expect(prenomPublic("Ryshawn Ekoué AHYI-YENOU")).toBe("Ryshawn");
  });

  it("écarte le nom de famille même quand il est écrit en premier", () => {
    expect(prenomPublic("ABBEY Harmonia")).toBe("Harmonia");
  });

  it("garde le premier mot quand tout est en capitales", () => {
    expect(prenomPublic("JEAN PIERRE")).toBe("JEAN");
  });

  it("ne laisse jamais la page sans nom", () => {
    expect(prenomPublic(null)).toBe("un codeur");
    expect(prenomPublic("   ")).toBe("un codeur");
  });
});

describe("estInteractif", () => {
  it("reconnaît un programme qui pose une question", () => {
    expect(estInteractif('reponse = input("Ton nom ? ")')).toBe(true);
    expect(estInteractif("x = int(input())")).toBe(true);
  });

  it("ne voit pas de question là où il n'y en a pas", () => {
    expect(estInteractif('print("bonjour")')).toBe(false);
  });

  it("ne se laisse pas prendre par un mot qui finit par input", () => {
    // Le compte à rebours n'attend rien de personne.
    expect(estInteractif("mon_input = 3\nprint(mon_input)")).toBe(false);
  });
});

describe("titrePropre", () => {
  it("coupe un titre trop long plutôt que de le laisser refuser par la base", () => {
    expect(titrePropre("a".repeat(200))).toHaveLength(60);
  });

  it("ne rend jamais un titre vide", () => {
    expect(titrePropre("   ")).toBe("Mon programme");
  });
});
