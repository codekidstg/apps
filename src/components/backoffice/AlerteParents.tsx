import Link from "next/link";
import { getParentsPageData } from "@/lib/backoffice/parents";

/**
 * « 🔴 N parents à relancer » — l'alerte des tableaux de bord admin et manager.
 * Elle ne s'affiche que s'il y a quelqu'un à appeler, et mène à la liste des
 * parents déjà filtrée.
 */
export default async function AlerteParents({ espace }: { espace: "admin" | "manager" }) {
  const { parents } = await getParentsPageData();
  const aRelancer = parents.filter((p) => p.activite.statut === "relancer").length;
  if (aRelancer === 0) return null;
  const pluriel = aRelancer > 1;

  return (
    <Link
      href={`/${espace}/utilisateurs/parents?statut=relancer`}
      className="block rounded-2xl p-5 border bg-red-50 border-red-200 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">👪</span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-black text-base text-red-700">
            {aRelancer} parent{pluriel ? "s" : ""} à relancer
          </div>
          <div className="text-sm font-bold text-ink-muted mt-0.5">
            Plus de 14 jours sans venir dans l&apos;espace parent, ou jamais venu depuis l&apos;inscription.
          </div>
        </div>
        <span className="text-xs font-black text-brand-orange shrink-0">Voir →</span>
      </div>
    </Link>
  );
}
