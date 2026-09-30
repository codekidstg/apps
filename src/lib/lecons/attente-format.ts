/**
 * Le type d'une attente et sa mise en forme — sans accès à la base.
 *
 * Séparé de `en-attente.ts` parce que le bouton « Valider » est un composant
 * client : il lui faut le type et la phrase, jamais le client Supabase de
 * service, qui dépend de `next/headers` et casse la compilation côté client.
 */

export type Attente = {
  studentId: string;
  eleve: string;
  lessonId: string;
  lecon: string;
  depuis: string;        // ISO
  jours: number;         // arrondi au jour entier, 0 = aujourd'hui
  mentorId: string | null;
};

/** « depuis 3 jours », « hier », « aujourd'hui » — dit à un mentor pressé. */
export function depuisLisible(jours: number): string {
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "depuis hier";
  return `depuis ${jours} jours`;
}
