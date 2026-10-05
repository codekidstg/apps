/**
 * L'engagement des mentors sur le contenu pédagogique.
 *
 * Il ne remplace pas un contrat signé — une acceptation en ligne pèse moins
 * devant un tribunal. Mais il est daté, horodaté, attaché à une adresse, et il
 * retire définitivement la défense « je ne savais pas ».
 *
 * Le texte est volontairement court et sans jargon : un engagement qu'on ne
 * lit pas n'engage personne. Il dit trois choses — à qui appartient le
 * contenu, ce qu'on a le droit d'en faire, ce qui se passe sinon.
 *
 * À faire relire par un conseil juridique togolais avant d'y attacher des
 * conséquences lourdes.
 */

/**
 * La version du texte.
 *
 * À changer dès que le texte change : les mentors le revoient alors une fois,
 * au lieu de rester engagés sur des mots qu'ils n'ont jamais lus.
 */
export const VERSION_ENGAGEMENT = "2026-10-05";

export const TITRE_ENGAGEMENT = "Le contenu que vous allez enseigner";

export const ENGAGEMENT: { titre: string; texte: string }[] = [
  {
    titre: "Ce contenu appartient à CodeKids",
    texte:
      "Les cours, exercices, énoncés et corrigés que vous consultez sur cette plateforme sont la propriété exclusive de CodeKids. Ils vous sont donnés pour une seule chose : animer les séances des enfants qui vous sont confiés.",
  },
  {
    titre: "Ce que vous ne pouvez pas en faire",
    texte:
      "Les reproduire, les enregistrer, les photographier pour les conserver, les transmettre à un tiers, ou les réutiliser dans un autre cadre — une autre école, des cours particuliers, une formation à vous. Ni pendant votre collaboration avec CodeKids, ni après.",
  },
  {
    titre: "Ce qui est tracé",
    texte:
      "Chaque support porte une marque qui identifie le mentor à qui il a été présenté, et les consultations sont enregistrées. Ce n'est pas de la défiance : c'est ce qui permet de distinguer un malentendu d'une faute, le jour où la question se pose.",
  },
  {
    titre: "Ce qui se passe en cas de manquement",
    texte:
      "La collaboration prend fin immédiatement, et CodeKids se réserve le droit d'engager toute action utile pour faire cesser l'usage et réparer le préjudice.",
  },
];

export const PHRASE_ACCEPTATION =
  "J'ai lu et j'accepte ces règles sur le contenu pédagogique de CodeKids.";
