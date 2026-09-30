import { leconsEnAttente } from "@/lib/lecons/en-attente";
import AlerteValidationsClient from "./AlerteValidationsClient";

/**
 * « X élèves attendent une validation ».
 *
 * Depuis le 30 septembre 2026, la validation du mentor ouvre la leçon suivante.
 * Un oubli ne coûte donc plus un point de suivi : il bloque un enfant jusqu'à
 * la séance d'après. Cet écran est la contrepartie du verrou, pas un ornement —
 * sans lui, le verrou serait dangereux.
 *
 * Le ton reste un constat. Un mentor qui n'a pas validé a souvent une bonne
 * raison : ils n'ont pas eu le temps, l'enfant doit reprendre. On montre le
 * fait, on ne gronde pas.
 */
export default async function AlerteValidations({ mentorId }: { mentorId?: string; href?: string }) {
  const attentes = await leconsEnAttente(mentorId);
  if (!attentes.length) return null;
  return <AlerteValidationsClient attentes={attentes} />;
}
