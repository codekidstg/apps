import type { FicheExercice, Partie } from "./corrige";

/**
 * Les choix de l'enfant, retrouvés dans ce qu'il a envoyé avec sa question,
 * pour les marquer dans la fiche : ❌ son choix à côté du ✅ attendu.
 *
 * Le texte vient de travailLisible (travail.ts) : « question\n→ choix (faux) »
 * pour un quiz, « avant [choix] après (faux) » pour une phrase à compléter.
 * Les clés du résultat sont les rangs des questions dans `fiche.parties`.
 *
 * `complet` : chaque réponse envoyée a retrouvé sa question dans la fiche. La
 * page se passe alors du bloc « ce que l'élève avait fait », qui ferait
 * doublon. Sinon — la leçon a changé depuis la question —, ce bloc reste.
 */
export function reponsesDansLaFiche(
  travail: string | null | undefined,
  fiche: FicheExercice,
): { choix: Record<number, number>; complet: boolean } | null {
  if (!travail) return null;
  // Le texte a voyagé dans un formulaire : le navigateur y a changé chaque
  // retour à la ligne en « \r\n ».
  travail = travail.replace(/\r\n?/g, "\n");
  const sansMarque = (s: string) => s.replace(/\s*\((faux|juste)\)$/, "").trim();

  const envoyees: { question: string; reponse: string }[] = [];
  // Un quiz : « question », puis « → choix », séparés par une ligne vide.
  for (const bloc of travail.split("\n\n")) {
    const lignes = bloc.split("\n");
    const derniere = lignes[lignes.length - 1] ?? "";
    if (lignes.length >= 2 && derniere.startsWith("→ ")) {
      envoyees.push({ question: lignes.slice(0, -1).join("\n").trim(), reponse: sansMarque(derniere.slice(2)) });
    }
  }
  // Des phrases à compléter : « avant [choix] après », une par ligne.
  if (!envoyees.length) {
    for (const ligne of travail.split("\n")) {
      const m = ligne.match(/^(.*?)\s*\[(.*)\]\s*(.*)$/);
      if (m) envoyees.push({ question: `${m[1]} ___ ${sansMarque(m[3])}`.trim(), reponse: m[2].trim() });
    }
  }
  if (!envoyees.length) return null;

  const choix: Record<number, number> = {};
  let retrouvees = 0;
  for (const e of envoyees) {
    const i = fiche.parties.findIndex((p) => p.genre === "question" && p.question.trim() === e.question);
    if (i < 0) continue;
    const c = (fiche.parties[i] as Extract<Partie, { genre: "question" }>).choix.findIndex((x) => x.trim() === e.reponse);
    if (c < 0) continue;
    choix[i] = c;
    retrouvees++;
  }
  return retrouvees ? { choix, complet: retrouvees === envoyees.length } : null;
}
