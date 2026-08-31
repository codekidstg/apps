/**
 * Identifiants de connexion — format `prénom.initiale`.
 *
 * Supabase Auth impose une adresse unique par compte. Pour les personnes qui
 * n'en donnent pas, on en fabrique une à partir de l'identifiant. Elle reste
 * interne : jamais affichée, jamais saisie, aucun message n'y part.
 */

/** Sous-domaine sans MX, sur un domaine que CodeKids possède. */
export const DOMAINE_INTERNE = "interne.codekids.tg";

/** Une adresse fabriquée ne doit jamais être présentée comme un email. */
export function estEmailInterne(email: string | null | undefined) {
  return !!email && email.toLowerCase().endsWith(`@${DOMAINE_INTERNE}`);
}

function sansAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function nettoie(s: string) {
  return sansAccents(s)
    .toLowerCase()
    .replace(/['’]/g, "")       // O'Brien → obrien
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * `Uriel AMEGANVI` → `uriel.a`
 * `Jean pierre Gaba` → `jean-pierre.g`
 * `Ryshawn Ekoué AHYI-YENOU` → `ryshawn-ekoue.a`
 *
 * Le nom de famille étant en dernier dans les comptes créés ici, tout ce qui
 * précède forme le prénom — les prénoms composés sont la règle.
 */
export function identifiantDepuisNom(displayName: string): string {
  const mots = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "";
  if (mots.length === 1) return nettoie(mots[0]);

  const prenom  = nettoie(mots.slice(0, -1).join(" "));
  const initale = nettoie(mots[mots.length - 1]).charAt(0);
  return initale ? `${prenom}.${initale}` : prenom;
}

/**
 * Rend l'identifiant unique en suffixant un chiffre : `uriel.a`, `uriel.a2`,
 * `uriel.a3`… La comparaison se fait en minuscules, comme l'index unique.
 */
export function identifiantLibre(base: string, pris: Set<string>): string {
  const b = base.toLowerCase();
  if (!pris.has(b)) return base;
  for (let i = 2; i < 1000; i++) {
    if (!pris.has(`${b}${i}`)) return `${base}${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function emailInterne(identifiant: string) {
  return `${identifiant.toLowerCase()}@${DOMAINE_INTERNE}`;
}

/** Ce que l'utilisateur a tapé est-il une adresse, ou un identifiant ? */
export function ressembleAUnEmail(saisie: string) {
  return saisie.includes("@");
}
