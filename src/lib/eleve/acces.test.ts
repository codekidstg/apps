import { describe, it, expect } from "vitest";
import { accesLecon, accesEntrainement } from "./acces";

/**
 * Une base simulée : `acces.ts` reçoit son client en paramètre, on lui en
 * donne un qui lit des tableaux. Les requêtes réellement utilisées sont
 * `select`, `eq`, `in`, `order`, `maybeSingle` — et l'attente du résultat.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ligne = Record<string, any>;

function fausseBase(tables: Record<string, Ligne[]>) {
  const requete = (table: string) => {
    let lignes = [...(tables[table] ?? [])];
    const resultat = () => Promise.resolve({ data: lignes, error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api: any = {
      select: () => api,
      eq: (col: string, val: unknown) => { lignes = lignes.filter((r) => r[col] === val); return api; },
      in: (col: string, vals: unknown[]) => { lignes = lignes.filter((r) => vals.includes(r[col])); return api; },
      order: (col: string) => { lignes.sort((a, b) => (a[col] ?? 0) - (b[col] ?? 0)); return api; },
      maybeSingle: () => Promise.resolve({ data: lignes[0] ?? null, error: null }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      then: (suite: any, echec: any) => resultat().then(suite, echec),
    };
    return api;
  };
  return { from: requete };
}

const ELEVE = "eleve-1";
const THEME = "theme-labyrinthe";

/** Un thème publié et ouvert à l'élève : 2 chapitres, 4 leçons, 1 entraînement. */
const base = (progres: { lesson_id: string; status: string }[]) => fausseBase({
  themes: [{ id: THEME, status: "published" }, { id: "theme-ferme", status: "published" }],
  student_theme_access: [{ student_id: ELEVE, theme_id: THEME }],
  chapters: [
    { id: "ch-1", theme_id: THEME, order_index: 1 },
    { id: "ch-2", theme_id: THEME, order_index: 2 },
    { id: "ch-x", theme_id: "theme-ferme", order_index: 1 },
  ],
  lessons: [
    { id: "l1", chapter_id: "ch-1", order_index: 1, chapters: { theme_id: THEME } },
    { id: "l2", chapter_id: "ch-1", order_index: 2, chapters: { theme_id: THEME } },
    { id: "l3", chapter_id: "ch-2", order_index: 1, chapters: { theme_id: THEME } },
    { id: "l4", chapter_id: "ch-2", order_index: 2, chapters: { theme_id: THEME } },
    { id: "lx", chapter_id: "ch-x", order_index: 1, chapters: { theme_id: "theme-ferme" } },
  ],
  trainings: [{ id: "t3", lesson_id: "l3" }],
  lesson_progress: progres.map((p) => ({ ...p, student_id: ELEVE })),
});

const fini = (id: string) => ({ lesson_id: id, status: "completed" });
const enCours = (id: string) => ({ lesson_id: id, status: "in_progress" });

describe("l'ordre du programme, appliqué côté serveur", () => {
  it("la première leçon du thème est toujours ouverte", async () => {
    expect(await accesLecon(base([]), ELEVE, "l1")).toEqual({ ok: true, themeId: THEME });
  });

  it("la suivante s'ouvre quand la précédente est terminée", async () => {
    expect(await accesLecon(base([fini("l1")]), ELEVE, "l2")).toEqual({ ok: true, themeId: THEME });
    // L'ordre traverse les chapitres : l3 vient après l2.
    expect(await accesLecon(base([fini("l1"), fini("l2")]), ELEVE, "l3")).toEqual({ ok: true, themeId: THEME });
  });

  it("elle reste fermée tant que la précédente n'est pas finie", async () => {
    expect(await accesLecon(base([fini("l1"), enCours("l2")]), ELEVE, "l3"))
      .toEqual({ ok: false, raison: "lecon_verrouillee" });
    // Le saut de Ryshawn : l1 finie, puis on tente la dernière du thème.
    expect(await accesLecon(base([fini("l1")]), ELEVE, "l4"))
      .toEqual({ ok: false, raison: "lecon_verrouillee" });
  });

  it("une leçon déjà terminée se rouvre : on peut toujours revoir", async () => {
    expect(await accesLecon(base([fini("l4")]), ELEVE, "l4")).toEqual({ ok: true, themeId: THEME });
  });

  it("le thème passe avant l'ordre : ce qui n'est pas ouvert reste fermé", async () => {
    expect(await accesLecon(base([]), ELEVE, "lx")).toEqual({ ok: false, raison: "theme_non_ouvert" });
  });
});

describe("l'entraînement vient après le cours", () => {
  it("il s'ouvre quand sa leçon est terminée", async () => {
    expect(await accesEntrainement(base([fini("l1"), fini("l2"), fini("l3")]), ELEVE, "t3"))
      .toEqual({ ok: true, themeId: THEME });
  });

  it("une leçon seulement commencée ne l'ouvre pas — le cas de Samuel", async () => {
    expect(await accesEntrainement(base([fini("l1"), fini("l2"), enCours("l3")]), ELEVE, "t3"))
      .toEqual({ ok: false, raison: "entrainement_verrouille" });
  });

  it("une leçon verrouillée verrouille son entraînement, avec le bon mot", async () => {
    expect(await accesEntrainement(base([fini("l1")]), ELEVE, "t3"))
      .toEqual({ ok: false, raison: "entrainement_verrouille" });
  });

  it("un entraînement inconnu n'existe pas", async () => {
    expect(await accesEntrainement(base([]), ELEVE, "t-inconnu")).toEqual({ ok: false, raison: "introuvable" });
  });
});
