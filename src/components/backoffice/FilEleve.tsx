import { filEleve } from "@/lib/backoffice/fil-eleve";
import { quandLisible, resumeDuFil, type Evenement, type Fil } from "@/lib/backoffice/fil-format";
import { dureeLisible } from "@/lib/temps-passe";

/**
 * « Son fil » — ce que l'élève a fait, dans l'ordre, du plus récent au plus ancien.
 *
 * Placé AU-DESSUS de la carte « Évolution », et c'est volontaire : Évolution est
 * une analyse (est-il au rythme ? comprend-il ?), le fil est un fait. On vient
 * d'abord chercher le fait.
 */

function LigneEvenement({ e, maintenant }: { e: Evenement; maintenant: number }) {
  const { jour, heure } = quandLisible(e.quand, maintenant);

  const pastille = e.type === "lecon" ? "✅" : e.type === "ouvert" ? "⏳" : e.terrain ? "🏟️" : "✏️";
  const fane = e.type === "ouvert";

  return (
    <li className="flex gap-3 py-2 border-t border-gray-100 first:border-t-0">
      <span className="text-sm shrink-0 w-5 text-center leading-6">{pastille}</span>
      <div className="w-32 shrink-0 text-xs text-gray-400 font-mono leading-6">
        {jour} <span className="text-gray-300">{heure}</span>
      </div>
      <div className={`flex-1 min-w-0 text-sm ${fane ? "text-gray-400" : "text-gray-700"}`}>
        {e.type === "lecon" ? (
          <span className="font-bold">séance « {e.titre} » terminée</span>
        ) : (
          <>
            <span className={fane ? "" : "font-bold"}>{e.titre}</span>
            {e.lecon && <span className="text-gray-400"> · {e.lecon}</span>}
            <div className="text-xs text-gray-400">
              {e.type === "ouvert" ? `${e.terrain ? "salle de jeu" : "entraînement"} · ouvert, jamais terminé` : (
                <>
                  {e.terrain ? "salle de jeu" : "entraînement"}
                  {" · "}{e.essais} essai{e.essais > 1 ? "s" : ""}
                  {e.sansIndice && <span className="text-green-700 font-bold"> · sans indice ★</span>}
                  {dureeLisible(e.secondes) && ` · ${dureeLisible(e.secondes)}`}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Le fil rendu seul, quand l'appelant a déjà chargé les données.
 *
 * `nu` : sans sa carte ni son titre — l'appelant les fournit déjà, et deux
 * cadres emboîtés avec deux titres identiques, ça se voit.
 */
export function CarteFil({ fil, titre = "Son fil", nu = false }: { fil: Fil; titre?: string; nu?: boolean }) {
  const maintenant = Date.now();
  const Cadre = nu ? "div" : "section";
  return (
    <Cadre className={nu ? "" : "bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5"}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        {!nu && <h2 className="font-black text-base" style={{ color: "#1B2D5E" }}>{titre}</h2>}
        <span className="text-xs text-gray-400 ml-auto">du plus récent au plus ancien</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{resumeDuFil(fil, maintenant)}</p>

      {fil.evenements.length === 0 ? (
        <p className="text-sm text-gray-400 mt-4">Rien d&apos;enregistré : il n&apos;a encore terminé ni séance ni exercice.</p>
      ) : (
        <ul className="mt-3">
          {fil.evenements.map((e, i) => <LigneEvenement key={i} e={e} maintenant={maintenant} />)}
        </ul>
      )}
    </Cadre>
  );
}

/**
 * Le fil replié, pour une liste d'élèves — la page de classe du mentor en
 * affiche un par enfant, et huit fils dépliés feraient une page de six écrans.
 * La phrase de résumé reste visible ; le détail se déroule sur demande.
 */
export function FilDeroulant({ fil }: { fil: Fil }) {
  const maintenant = Date.now();
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs text-ink-muted hover:text-ink transition-colors">
        <span className="inline-block transition-transform group-open:rotate-90 mr-1 text-ink-light">▸</span>
        {resumeDuFil(fil, maintenant)}
      </summary>
      {fil.evenements.length > 0 && (
        <ul className="mt-2 ml-4 border-l-2 border-cream-border pl-3">
          {fil.evenements.map((e, i) => <LigneEvenement key={i} e={e} maintenant={maintenant} />)}
        </ul>
      )}
    </details>
  );
}

export default async function FilEleve({ studentId, limite = 10, nu = false }: {
  studentId: string; limite?: number; nu?: boolean;
}) {
  return <CarteFil fil={await filEleve(studentId, limite)} nu={nu} />;
}

/** Le résumé du fil, pour l'afficher quand le bloc est replié. */
export async function resumeFilEleve(studentId: string): Promise<string> {
  return resumeDuFil(await filEleve(studentId, 1), Date.now());
}
