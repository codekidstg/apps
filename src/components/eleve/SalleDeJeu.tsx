export const dynamic = "force-dynamic";

import Link from "next/link";
import CarteExercice from "@/components/eleve/CarteExercice";
import { PALIERS, ceintureDe, type Exercice } from "@/lib/eleve/paliers";
import type { SeanceSalle } from "@/lib/eleve/salle-de-jeu";

/**
 * Ma salle de jeu — la seconde porte de la même réserve d'exercices.
 *
 * Pourquoi une porte à part : jusqu'ici, ces exercices vivaient au bas de la
 * séance à laquelle ils appartiennent. Pour les atteindre, il fallait déjà
 * avoir décidé de s'entraîner, retrouver la bonne séance, puis dérouler. Un
 * enfant ne navigue jamais en arrière — il va là où c'est ouvert.
 *
 * Trois règles tiennent cette page :
 *
 *   · On ne montre QUE ce qui est ouvert. Un enfant qui découvre 80 exercices
 *     dont 73 verrouillés se croit en retard le jour de son arrivée.
 *   · Rien ici ne compte. Pas d'XP, pas de note, pas de classement. On y vient
 *     parce qu'on en a envie, et on rejoue autant qu'on veut.
 *   · Le but est proche : une ceinture par séance, à trois barreaux. « Encore
 *     deux exercices » se tente ; « 7 exercices à faire » est une dette.
 */

export default function SalleDeJeu({ seances }: { seances: SeanceSalle[] }) {
  const tousLesExos = seances.flatMap((s) => s.exercices);
  const joues       = tousLesExos.filter((e) => e.attempts > 0).length;
  const sansIndice  = tousLesExos.filter((e) => e.sansIndice).length;

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#a78bfa" }}>◈ Libre service</div>
        <h1 className="text-3xl font-black text-white">🏟️ Ma salle de jeu</h1>
        <p className="mt-2 text-sm" style={{ color: "#475569" }}>
          Rejoue autant de fois que tu veux. Ici, rien ne compte dans tes points — c&apos;est pour le plaisir de savoir faire.
        </p>
      </div>

      {tousLesExos.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { v: tousLesExos.length, l: "exercices ouverts", c: "#a78bfa" },
            { v: joues,              l: "déjà essayés",      c: "#FDB813" },
            { v: sansIndice,         l: "sans indice ★",     c: "#10b981" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl px-4 py-3" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
              <div className="text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {seances.length === 0 ? (
        <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
          <div className="text-5xl mb-4">🏟️</div>
          <div className="text-lg font-black text-white mb-2">Ta salle n&apos;est pas encore ouverte</div>
          <p className="text-sm mb-6" style={{ color: "#475569" }}>
            Elle s&apos;ouvre dès que tu termines ta première séance. Tu y trouveras des défis
            à refaire autant de fois que tu veux.
          </p>
          <Link href="/eleve/entrainement" className="text-sm font-black hover:underline" style={{ color: "#FDB813" }}>
            Voir mon entraînement →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {seances.map((s) => {
            const ceinture = ceintureDe(s.exercices);
            const faits = s.exercices.filter((e) => e.attempts > 0).length;
            const tousSansIndice = s.exercices.length > 0 && s.exercices.every((e) => e.sansIndice);

            return (
              <section key={s.lessonId} className="rounded-2xl overflow-hidden"
                style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
                <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #1e293b" }}>
                  <span className="text-xl shrink-0" title={ceinture.nom}>{ceinture.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-sm truncate">{s.titre}</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: ceinture.couleur }}>
                      {ceinture.nom}{tousSansIndice && " ★ tout sans indice"}
                    </div>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: faits === s.exercices.length ? "#10b981" : "#475569" }}>
                    {faits}/{s.exercices.length}
                  </span>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {PALIERS.map((p) => {
                    const lot = s.exercices.filter((e) => (e.palier ?? 1) === p.n);
                    if (!lot.length) return null;
                    return (
                      <div key={p.n}>
                        <div className="text-[10px] font-mono px-1 mb-1.5" style={{ color: p.color }}>{p.label}</div>
                        <div className="space-y-2">
                          {lot.map((e) => <CarteExercice key={e.id} t={e} terrain />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Ce qui manque ne se montre pas comme une dette, mais comme une promesse. */}
          <p className="text-xs text-center pt-2" style={{ color: "#334155" }}>
            D&apos;autres salles s&apos;ouvriront quand tu termineras de nouvelles séances.
          </p>
        </div>
      )}
    </div>
  );
}
