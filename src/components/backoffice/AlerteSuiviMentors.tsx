import Link from "next/link";
import { getRapportsData } from "@/lib/rapports";
import { compterBilansAFaire } from "@/lib/backoffice/bilans";
import { moisABoucler, libelleMois } from "@/lib/backoffice/mois";
import { debutPeriode, PERIODE_DEFAUT, libellePeriode } from "@/lib/planning/occurrences-passees";

/**
 * Les deux choses du suivi des mentors qui attendent quelqu'un, en tête des
 * tableaux de bord admin et manager :
 *
 *   · les comptes rendus de séance jamais rédigés — une séance sans compte
 *     rendu ne se remarquait qu'en ouvrant la page des rapports ;
 *   · le point de fin de mois pas encore fait.
 *
 * L'alerte ne s'affiche que s'il y a quelque chose à faire. Le point de fin de
 * mois n'apparaît qu'à partir du 25 : avant, réclamer un bilan sur un mois qui
 * vient de commencer n'aurait aucun sens (voir `moisABoucler`).
 */

function Ligne({ href, emoji, titre, detail, ton }: {
  href: string; emoji: string; titre: string; detail: string; ton: "rouge" | "ambre";
}) {
  const couleurs = ton === "rouge"
    ? { fond: "bg-red-50 border-red-200", texte: "text-red-700" }
    : { fond: "bg-amber-50 border-amber-200", texte: "text-amber-800" };
  return (
    <Link href={href} className={`block rounded-2xl p-5 border transition-shadow hover:shadow-md ${couleurs.fond}`}>
      <div className="flex items-center gap-4">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-display font-black text-base ${couleurs.texte}`}>{titre}</div>
          <div className="text-sm font-bold text-ink-muted mt-0.5">{detail}</div>
        </div>
        <span className="text-xs font-black text-brand-orange shrink-0">Voir →</span>
      </div>
    </Link>
  );
}

export default async function AlerteSuiviMentors(
  // `maintenant` : la date se passe en paramètre, comme partout ailleurs dans
  // le suivi — c'est ce qui rend la bascule du 25 vérifiable.
  { espace, maintenant = new Date() }: { espace: "admin" | "manager"; maintenant?: Date },
) {
  const mois = moisABoucler(maintenant);
  // La même période que la page des rapports : l'alerte et l'écran qu'elle
  // ouvre doivent annoncer le même nombre.
  const [{ manquants }, bilans] = await Promise.all([
    getRapportsData({ depuis: debutPeriode(PERIODE_DEFAUT) ?? undefined }),
    mois ? compterBilansAFaire(mois) : Promise.resolve({ mentors: 0, aFaire: 0 }),
  ]);

  if (!manquants && !bilans.aFaire) return null;

  return (
    <div className="space-y-4">
      {manquants > 0 && (
        <Ligne
          href={`/${espace}/rapports`}
          emoji="📝"
          ton="rouge"
          titre={`${manquants} compte${manquants > 1 ? "s" : ""} rendu${manquants > 1 ? "s" : ""} de séance manquant${manquants > 1 ? "s" : ""}`}
          detail={`${libellePeriode(PERIODE_DEFAUT)} : des séances passées dont le mentor n'a rien écrit. Une séance non tenue se déclare, elle ne se laisse pas vide.`}
        />
      )}
      {mois && bilans.aFaire > 0 && (
        <Ligne
          href={`/${espace}/mentors?mois=${mois}`}
          emoji="🧑‍🏫"
          ton="ambre"
          titre={`${bilans.aFaire} mentor${bilans.aFaire > 1 ? "s n'ont" : " n'a"} pas encore eu ${bilans.aFaire > 1 ? "leur" : "son"} point de fin de mois`}
          // « pour 3 mentors … sur 3 mentors » : le total ne se dit que s'il
          // reste des points déjà faits, sinon il répète le même chiffre.
          detail={`${libelleMois(mois)}${bilans.aFaire < bilans.mentors ? ` — sur ${bilans.mentors}` : ""}. La note du mois est prête si vous voulez en parler ; un mois peut aussi se passer.`}
        />
      )}
    </div>
  );
}
