import Link from "next/link";
import { getSeancesAVenir, type SeanceAVenir } from "@/lib/planning/seances-a-venir";

/**
 * « Séances — 7 prochains jours », pour l'admin comme pour le manager.
 *
 * Le titre en gras est la leçon que l'enfant ouvrira, pas le libellé de la
 * séance : en base, ces libellés sont « Session codeKids » neuf fois sur dix,
 * et n'apprennent rien à personne. Le libellé reste en dessous, en petit.
 */

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Le Togo est à UTC+0 toute l'année : on lit tout en UTC, où que tourne le serveur.
const jourCourt = (d: Date) => JOURS[d.getUTCDay()];
const numero    = (d: Date) => d.getUTCDate();
const heure     = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function ListeSeances({
  seances, total, espace, jours = 7,
}: {
  seances: SeanceAVenir[];
  total: number;
  espace: "admin" | "manager";
  jours?: number;
}) {
  const profs = `/${espace}/utilisateurs/professeurs`;

  return (
    <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-cream-border">
        <h2 className="font-display font-black text-base text-ink whitespace-nowrap">
          📅 Séances — {jours} jours
          {total > 0 && <span className="ml-2 text-xs font-black text-ink-muted">{total}</span>}
        </h2>
        <Link href={profs} className="shrink-0 whitespace-nowrap text-xs font-extrabold text-brand-orange hover:underline">
          Planning →
        </Link>
      </div>

      {seances.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="text-ink-muted font-bold text-sm">Aucune séance prévue.</div>
          <Link href={profs} className="text-xs font-extrabold text-brand-orange hover:underline">
            Planifier une séance →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-cream-border">
          {seances.map((s) => {
            const apercu = s.lecon?.themeId
              ? `/${espace}/themes/${s.lecon.themeId}/lecons/${s.lecon.id}`
              : null;

            return (
              <div key={`${s.seanceId}-${s.quand.toISOString()}`} className="flex items-start gap-4 px-5 py-3">
                <div className="w-10 text-center shrink-0 pt-0.5">
                  <div className="text-[10px] font-black text-gray-400 uppercase">{jourCourt(s.quand)}</div>
                  <div className="text-lg font-black text-ink leading-none">{numero(s.quand)}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {apercu ? (
                      <Link href={apercu} className="font-bold text-ink text-sm hover:text-brand-orange hover:underline truncate">
                        {s.lecon!.titre}
                      </Link>
                    ) : (
                      <span className="font-bold text-ink-muted text-sm truncate">
                        {s.eleve ? "Leçon à ouvrir : aucune" : "Séance de groupe"}
                      </span>
                    )}

                    {s.enCours && (
                      <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        EN COURS
                      </span>
                    )}
                  </div>

                  {/* Le point de séparation est porté par l'élément qui précède :
                      quand la ligne passe à la suivante, il reste en fin de ligne
                      au lieu de l'ouvrir. */}
                  <div className="text-xs text-ink-muted flex items-baseline gap-x-1.5 flex-wrap mt-0.5">
                    <span className="font-bold whitespace-nowrap">{heure(s.quand)}{" ·"}</span>
                    <span className="whitespace-nowrap">👩‍🏫 {s.mentor}{s.eleve ? " ·" : ""}</span>
                    {s.eleve && <span className="whitespace-nowrap">👦 {s.eleve}</span>}
                  </div>

                  <div className="text-[11px] text-gray-400 truncate mt-0.5">« {s.titre} »</div>

                  {s.alerte && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-black px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                      ⚠️ {s.alerte}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** L'encadré qui va chercher lui-même ses séances : un tableau de bord n'a qu'à le poser. */
export default async function ProchainesSeances({
  espace, jours = 7, max = 5,
}: {
  espace: "admin" | "manager";
  jours?: number;
  max?: number;
}) {
  const seances = await getSeancesAVenir(jours);
  return <ListeSeances seances={seances.slice(0, max)} total={seances.length} espace={espace} jours={jours} />;
}
