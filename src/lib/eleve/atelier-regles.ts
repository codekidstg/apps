/**
 * Les règles de l'atelier qui ne touchent pas la base.
 *
 * Ce fichier n'importe rien : les composants de l'enfant, qui tournent dans le
 * navigateur, s'en servent sans entraîner la clé de service avec eux.
 */

/**
 * Douze programmes par enfant.
 *
 * Ce n'est pas la place en base qui l'impose — douze programmes pèsent trente
 * kilo-octets. C'est la liste : au-delà, un enfant ne retrouve plus le sien, et
 * ranger devient un travail. Quand il est plein, il efface pour continuer.
 */
export const MAX_PROGRAMMES = 12;

export const TITRE_MAX = 60;
export const CODE_MAX = 100_000;
export const SORTIE_MAX = 20_000;

/**
 * Le prénom, et lui seul, pour la page publique.
 *
 * `display_name` porte le nom complet — « Ryshawn Ekoué AHYI-YENOU ». Un lien
 * de partage se transfère de téléphone en téléphone : on n'y met pas
 * l'identité entière d'un enfant.
 *
 * Au Togo comme en France, le nom de famille s'écrit souvent en capitales.
 * C'est un indice, pas une certitude : si tout le nom est en capitales, on
 * garde simplement le premier mot.
 */
export function prenomPublic(nomComplet: string | null | undefined): string {
  const mots = (nomComplet ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "un codeur";

  const enCapitales = (m: string) =>
    m.length >= 2 &&
    m === m.toLocaleUpperCase("fr") &&
    m !== m.toLocaleLowerCase("fr");

  const restants = mots.filter((m) => !enCapitales(m));
  return restants[0] ?? mots[0];
}

/**
 * Un programme qui pose une question est un jeu ; un programme qui ne fait
 * qu'afficher est un résultat. La page partagée ne promet pas « Jouer » quand
 * il n'y a rien à jouer.
 */
export function estInteractif(code: string): boolean {
  return /(^|[^\w.])input\s*\(/.test(code);
}

/**
 * « le programme de Samuel », mais « le programme d'Alice ».
 *
 * La page partagée répète le prénom trois fois : sans élision, elle a l'air
 * écrite par une machine — et c'est la page que le parent regarde.
 */
export function avecDe(prenom: string): string {
  return /^[aeiouyàâäéèêëïîôöùûüh]/i.test(prenom) ? `d'${prenom}` : `de ${prenom}`;
}

/** Le titre que porte un programme neuf, tiré de l'amorce dont il vient. */
export function titrePropre(titre: string): string {
  const t = titre.replace(/\s+/g, " ").trim();
  return t.slice(0, TITRE_MAX) || "Mon programme";
}
