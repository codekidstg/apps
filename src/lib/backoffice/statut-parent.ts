/**
 * Le statut d'un parent : suit-il son enfant ?
 *
 *   🟢 actif       — venu dans les 7 derniers jours
 *   🟡 tiède       — dernière venue il y a 8 à 14 jours
 *   🔴 à relancer  — plus de 14 jours sans venir, ou jamais venu alors que le
 *                    compte a plus de 7 jours
 *   ⚪ nouveau     — compte de moins de 7 jours, pas encore venu
 *
 * Les seuils suivent le rythme des séances : une par semaine. Un parent qui
 * suit son enfant passe au moins une fois par semaine.
 *
 * « Venu » : la dernière visite enregistrée, ou à défaut la dernière connexion.
 * Aucun accès à la base ici : la fonction est éprouvée par ses tests.
 */
import { joursDepuis } from "./statut-eleve";

export type StatutParent = "actif" | "tiede" | "relancer" | "nouveau";

/** L'affichage d'un statut — partagé par le serveur et la liste (client). */
export const STATUT_PARENT: Record<StatutParent, { label: string; pastille: string; classes: string; ordre: number }> = {
  relancer: { label: "À relancer", pastille: "🔴", classes: "bg-red-50 text-red-700 border-red-200",       ordre: 0 },
  tiede:    { label: "Tiède",      pastille: "🟡", classes: "bg-amber-50 text-amber-700 border-amber-200", ordre: 1 },
  nouveau:  { label: "Nouveau",    pastille: "⚪", classes: "bg-gray-50 text-gray-600 border-gray-200",    ordre: 2 },
  actif:    { label: "Actif",      pastille: "🟢", classes: "bg-green-50 text-green-700 border-green-200", ordre: 3 },
};

export function statutParent(
  { dernierePresence, compteCree }: { dernierePresence: Date | null; compteCree: Date },
  maintenant: Date = new Date(),
): StatutParent {
  if (!dernierePresence) return joursDepuis(compteCree, maintenant) < 7 ? "nouveau" : "relancer";
  const jours = joursDepuis(dernierePresence, maintenant);
  if (jours <= 7) return "actif";
  if (jours <= 14) return "tiede";
  return "relancer";
}
