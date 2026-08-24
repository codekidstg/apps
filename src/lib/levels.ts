/**
 * Correspondance unique entre les deux façons de nommer un niveau.
 *
 * La table `students` porte deux colonnes pour la même information :
 * `level_num` (1, 2, 3) utilisée par les écrans d'administration, et `level`
 * ("explorer", "builder", "architect") utilisée par l'espace élève et par la
 * jointure sur les thèmes. Elles se sont désynchronisées parce que le sélecteur
 * de niveau n'écrivait que la première.
 *
 * Tant que les deux colonnes existent, toute écriture doit passer par ici.
 */
export type LevelSlug = "explorer" | "builder" | "architect";

export const NUM_TO_SLUG: Record<number, LevelSlug> = {
  1: "explorer",
  2: "builder",
  3: "architect",
};

export const SLUG_TO_NUM: Record<LevelSlug, number> = {
  explorer: 1,
  builder: 2,
  architect: 3,
};

export function slugFromNum(n: number | null | undefined): LevelSlug {
  return NUM_TO_SLUG[n ?? 1] ?? "explorer";
}

export function numFromSlug(s: string | null | undefined): number {
  return SLUG_TO_NUM[(s ?? "explorer") as LevelSlug] ?? 1;
}
