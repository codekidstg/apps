import { prenomPublic } from "@/lib/eleve/atelier-regles";

/**
 * La marque de propriété sur les supports de cours.
 *
 * Elle n'empêche rien, et c'est assumé : aucune technique au monde n'empêche
 * de photographier un écran. Elle fait trois choses qui, elles, servent.
 *
 * Le pied de page affirme la propriété. Il ne nomme personne : il se lit comme
 * l'en-tête d'un support de formation, pas comme une caméra de surveillance —
 * et il retire à quiconque la défense « je ne savais pas que c'était protégé ».
 *
 * Le fond, lui, porte le nom du mentor. C'est la seule partie qui trace, et
 * elle est volontairement discrète : une ligne en pied de page se recadre en
 * deux secondes sur une capture, un fond répété sur toute la hauteur, non.
 *
 * La signature invisible voyage dans le texte lui-même, en caractères de
 * largeur nulle. Elle survit à ce que le pied de page et le fond ne survivent
 * pas : un copier-coller du cours dans un document Word.
 */

const MENTION = "© CodeKids · Support pédagogique · Propriété exclusive · Reproduction interdite";

/**
 * Le nom tel qu'il apparaît en fond. Prénom seul : la marque doit identifier
 * sans étaler l'état civil de quelqu'un sur chaque page.
 */
function marque(nomComplet: string | null | undefined): string {
  return `CodeKids · ${prenomPublic(nomComplet)}`;
}

/**
 * La tuile de fond, en SVG : une seule règle CSS, aucun nœud supplémentaire
 * dans la page, et elle se répète toute seule quelle que soit la hauteur.
 */
function fondTuile(texte: string, couleur: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
<text x="0" y="110" transform="rotate(-24 0 110)" font-family="system-ui,sans-serif" font-size="15" fill="${couleur}">${texte}</text>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ""))}")`;
}

/**
 * Le code invisible, en caractères de largeur nulle.
 *
 * Chaque chiffre hexadécimal de l'identifiant devient une paire de caractères
 * que personne ne voit et qu'aucun éditeur de texte ne retire. Les quatre
 * premiers octets suffisent à désigner un mentor parmi cinq, ou parmi mille.
 */
const INVISIBLES = ["​", "‌", "‍", "⁠"];

export function signatureInvisible(id: string): string {
  return [...id.replace(/-/g, "").slice(0, 8)]
    .map((c) => {
      const n = parseInt(c, 16);
      return INVISIBLES[n >> 2] + INVISIBLES[n & 3];
    })
    .join("");
}

/** Le fond, à poser sur le conteneur qui entoure le contenu du cours. */
export function FondMarque({ nom, sombre = true }: { nom: string | null | undefined; sombre?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
      style={{
        backgroundImage: fondTuile(marque(nom), sombre ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.05)"),
        backgroundRepeat: "repeat",
      }}
    />
  );
}

/** La ligne de propriété, en bas du support. */
export function PiedDeMarque({ sombre = true }: { sombre?: boolean }) {
  return (
    <p className="mt-10 text-center text-[11px] font-bold"
      style={{ color: sombre ? "#334155" : "#94a3b8" }}>
      {MENTION}
    </p>
  );
}

/**
 * La signature invisible, à glisser dans le texte du support — jamais dans un
 * bloc de code : un caractère de largeur nulle au milieu d'un programme Python
 * casserait l'exécution, et l'enfant verrait une erreur incompréhensible.
 */
export function SignatureInvisible({ id }: { id: string }) {
  return <span aria-hidden="true">{signatureInvisible(id)}</span>;
}
