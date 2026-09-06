/**
 * Dates ancrées sur l'heure du Togo.
 *
 * Les tableaux de bord lisaient les dates avec `getDate()`, `getDay()`,
 * `setHours()` — qui dépendent du fuseau de la machine. Ça fonctionne par
 * coïncidence tant que le serveur est en UTC, comme le Togo. Sur un poste
 * européen à UTC+2, une séance de 23:00 heure du Togo bascule au lendemain,
 * et toute la semaine se décale.
 *
 * Le Togo est à UTC+0 toute l'année, sans heure d'été : l'heure UTC EST
 * l'heure locale. Tout passe donc par les accesseurs UTC, et le résultat ne
 * dépend plus de l'endroit où tourne le code.
 */

/** « 2026-09-06 » — le jour civil togolais d'un instant donné. */
export function jourTogo(d: Date | number = new Date()): string {
  const x = typeof d === "number" ? new Date(d) : d;
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-${String(x.getUTCDate()).padStart(2, "0")}`;
}

/** Minuit togolais du jour civil indiqué. */
export function minuit(jour: string): Date {
  return new Date(`${jour}T00:00:00Z`);
}

/** Jour de la semaine togolais — 0 dimanche, 6 samedi. */
export function jourSemaine(d: Date): number {
  return d.getUTCDay();
}

/**
 * Écart en **jours de calendrier**, pas en durée écoulée.
 *
 * C'était l'erreur : `Math.ceil((date - maintenant) / 86400000)` mesure une
 * durée. Une séance dans deux heures donnait 0,083 → arrondi à 1 → « Demain ».
 * « Aujourd'hui » était inatteignable, et tout le reste décalé d'un jour.
 */
export function ecartEnJours(cible: Date, maintenant: Date | number = new Date()): number {
  const a = minuit(jourTogo(maintenant)).getTime();
  const b = minuit(jourTogo(cible)).getTime();
  return Math.round((b - a) / 86400000);
}

/** « Aujourd'hui », « Demain », « Dans 3 jours »… */
export function libelleEcart(cible: Date, maintenant: Date | number = new Date()): string {
  const n = ecartEnJours(cible, maintenant);
  if (n < 0)  return n === -1 ? "Hier" : `Il y a ${-n} jours`;
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return "Demain";
  return `Dans ${n} jours`;
}

/** Lundi et dimanche de la semaine togolaise contenant cet instant. */
export function semaineDe(maintenant: Date | number = new Date()): { lundi: string; dimanche: string } {
  const j = jourTogo(maintenant);
  const d = minuit(j);
  const dow = d.getUTCDay();               // 0 = dimanche
  const recul = dow === 0 ? 6 : dow - 1;   // la semaine commence lundi
  const lundi = new Date(d);
  lundi.setUTCDate(lundi.getUTCDate() - recul);
  const dimanche = new Date(lundi);
  dimanche.setUTCDate(dimanche.getUTCDate() + 6);
  return { lundi: jourTogo(lundi), dimanche: jourTogo(dimanche) };
}
