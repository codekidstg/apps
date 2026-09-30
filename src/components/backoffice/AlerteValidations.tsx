import Link from "next/link";
import { leconsEnAttente, depuisLisible, type Attente } from "@/lib/lecons/en-attente";

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
export default async function AlerteValidations({ mentorId, href }: { mentorId?: string; href: string }) {
  const attentes = await leconsEnAttente(mentorId);
  if (!attentes.length) return null;

  const enfants = new Set(attentes.map((a) => a.studentId)).size;
  const vieilles = attentes.filter((a) => a.jours >= 3);
  const chaud = vieilles.length > 0;

  return (
    <Link href={href} className="block rounded-2xl px-5 py-4 transition-colors hover:brightness-[0.98]"
      style={{
        background: chaud ? "#FEF2F2" : "#FFFBEB",
        border: `1px solid ${chaud ? "#FECACA" : "#FDE68A"}`,
      }}>
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{chaud ? "⏳" : "✋"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black" style={{ color: chaud ? "#B91C1C" : "#1B2D5E" }}>
            {enfants === 1
              ? `${attentes[0].eleve} attend votre validation`
              : `${enfants} élèves attendent une validation`}
          </div>
          <div className="text-xs mt-0.5" style={{ color: chaud ? "#B91C1C" : "#92400E" }}>
            {attentes.slice(0, 3).map(resume).join(" · ")}
            {attentes.length > 3 && ` · +${attentes.length - 3}`}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
            Tant qu&apos;elle n&apos;est pas validée, la leçon suivante reste fermée.
          </div>
        </div>
        <span className="text-xs shrink-0" style={{ color: "#94A3B8" }}>›</span>
      </div>
    </Link>
  );
}

const resume = (a: Attente) => `${a.eleve} — « ${a.lecon} » ${depuisLisible(a.jours)}`;
