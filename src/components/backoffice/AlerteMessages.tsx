import Link from "next/link";

/**
 * L'alerte des tableaux de bord admin et manager. Elle ne s'affiche que s'il y
 * a quelque chose à traiter, et passe au rouge dès qu'un message a dépassé les
 * 48 h promises aux parents.
 */
export default function AlerteMessages({
  aTraiter, enRetard, href,
}: {
  aTraiter: number;
  enRetard: number;
  href: string;
}) {
  if (aTraiter === 0) return null;
  const urgent = enRetard > 0;
  const pluriel = aTraiter > 1;

  return (
    <Link
      href={href}
      className={`block rounded-2xl p-5 border transition-shadow hover:shadow-md ${
        urgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">✉️</span>
        <div className="flex-1 min-w-0">
          <div className={`font-display font-black text-base ${urgent ? "text-red-700" : "text-amber-800"}`}>
            {aTraiter} message{pluriel ? "s" : ""} de parent{pluriel ? "s" : ""} à traiter
          </div>
          <div className="text-sm font-bold text-ink-muted mt-0.5">
            {urgent
              ? `Dont ${enRetard} au-delà des 48 h promises aux parents.`
              : "Réponse promise aux parents sous 48 h."}
          </div>
        </div>
        <span className="text-xs font-black text-brand-orange shrink-0">Ouvrir →</span>
      </div>
    </Link>
  );
}
