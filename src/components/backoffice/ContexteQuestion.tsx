import type { Contexte } from "@/lib/questions/donnees";

/**
 * La consigne que l'enfant avait sous les yeux, et ce qu'il avait fait — côte
 * à côte. Figés au moment de la question : la leçon a pu être réécrite depuis.
 *
 * Partagé par la carte du mentor et les fils de la direction.
 *
 * `sansConsigne` : quand la fiche complète de l'exercice s'affiche à côté, la
 * consigne figée ferait doublon ; seul reste ce que l'élève avait fait.
 */
export default function ContexteQuestion({ contexte, sansConsigne = false }: { contexte: Contexte; sansConsigne?: boolean }) {
  const { travail, essais } = contexte;
  const bloc = sansConsigne ? null : contexte.bloc;
  if (!bloc?.consigne && !travail) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {bloc?.consigne && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>La consigne</div>
          <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "#334155" }}>{bloc.consigne}</p>
        </div>
      )}
      {travail && (
        <div className="rounded-xl bg-slate-900 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">
            Ce que l&apos;élève avait fait{essais ? ` · ${essais} essai${essais > 1 ? "s" : ""} raté${essais > 1 ? "s" : ""}` : ""}
          </div>
          <pre className="text-xs whitespace-pre-wrap leading-relaxed text-amber-300 font-mono">{travail}</pre>
        </div>
      )}
    </div>
  );
}
