import { chargerEvolutions, type Evolution } from "@/lib/backoffice/evolution";
import { STATUT_ELEVE } from "@/lib/backoffice/statut-eleve";
import { AVANCEMENT, ENGAGEMENT } from "@/lib/rapports";

/**
 * La section « Évolution » de la fiche élève — pour l'admin comme pour le
 * manager. Quatre questions, un statut, et les quatre dernières semaines.
 */

const ilYa = (n: number | null) =>
  n === null ? "jamais" : n === 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} jours`;
const dateCourte = (jour: string) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

function Ligne({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-1 py-3 border-t border-gray-100 first:border-t-0">
      <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 pt-0.5">{question}</div>
      <div className="text-sm text-gray-700 space-y-1">{children}</div>
    </div>
  );
}

export function CarteEvolution({ ev }: { ev: Evolution }) {
  const s = STATUT_ELEVE[ev.statut];
  const p = ev.parcours;
  const retard = ev.seancesPassees > 0 ? Math.max(0, ev.seancesPassees - ev.leconsTerminees) : null;
  const note = ev.rapports.find((r) => r.note)?.note ?? null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="font-black text-base" style={{ color: "#1B2D5E" }}>Évolution</h2>
        <span className={`text-xs font-black px-3 py-1 rounded-full border ${s.classes}`}>
          {s.pastille} {s.label.toUpperCase()}
        </span>
      </div>
      {ev.raisons.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">Pourquoi : {ev.raisons.join(" · ")}</p>
      )}

      <div className="mt-3">
        <Ligne question="Avance-t-il ?">
          <div>
            📖 {p.faitesParcours}/{p.totalParcours} leçons de son parcours
            {p.themeCourant ? <> · thème « {p.themeCourant} » ({p.faites}/{p.total})</> : " · aucun thème activé"}
          </div>
          <div className="text-gray-500">
            🗓️ {ev.seancesPassees === 0 ? "aucune séance passée pour l'instant"
              : <>{ev.seancesPassees} séance{ev.seancesPassees > 1 ? "s" : ""} passée{ev.seancesPassees > 1 ? "s" : ""} · {ev.leconsTerminees} leçon{ev.leconsTerminees > 1 ? "s" : ""} terminée{ev.leconsTerminees > 1 ? "s" : ""}</>}
            {retard !== null && " "}
            {retard !== null && (
              <span className={`ml-1 text-xs font-black ${retard >= 2 ? "text-amber-700" : "text-green-700"}`}>
                {retard === 0 ? "au rythme" : `${retard} leçon${retard > 1 ? "s" : ""} de retard`}
              </span>
            )}
          </div>
        </Ligne>

        <Ligne question="Est-il régulier ?">
          <div>
            Dernière activité : <strong>{ilYa(ev.joursDepuisActivite)}</strong>
            {ev.derniereActivite && ev.joursDepuisActivite! > 1 && <span className="text-gray-400"> ({dateCourte(ev.derniereActivite)})</span>}
          </div>
          <div className="text-gray-500">{ev.joursActifs30} jour{ev.joursActifs30 > 1 ? "s" : ""} actif{ev.joursActifs30 > 1 ? "s" : ""} sur 30 · série de {ev.serie} jour{ev.serie > 1 ? "s" : ""}</div>
        </Ligne>

        <Ligne question="Comprend-il ?">
          <div>
            {ev.quiz
              ? <>Quiz : <strong>{Math.round((ev.quiz.justes / ev.quiz.total) * 100)} %</strong> de bonnes réponses <span className="text-gray-400">({ev.quiz.justes}/{ev.quiz.total})</span></>
              : "Quiz : pas encore de réponse"}
          </div>
          <div className="text-gray-500">
            « Je bloque ici » : {ev.questions.sur30} sur 30 jours
            {ev.questions.ouvertes > 0 && <span className="text-amber-700 font-bold"> · {ev.questions.ouvertes} encore ouvert{ev.questions.ouvertes > 1 ? "s" : ""}</span>}
          </div>
          {ev.entrainements && (
            <div className="text-gray-500">
              Entraînements : {ev.entrainements.faits} fait{ev.entrainements.faits > 1 ? "s" : ""}
              {ev.entrainements.essaisMoyens !== null && <>, {ev.entrainements.essaisMoyens.toFixed(1).replace(".", ",")} essai{ev.entrainements.essaisMoyens >= 2 ? "s" : ""} en moyenne</>}
            </div>
          )}
        </Ligne>

        <Ligne question="Son mentor dit">
          {ev.rapports.length === 0 ? (
            <div className="text-gray-400">Aucun rapport de séance pour l&apos;instant.</div>
          ) : (
            <>
              {ev.rapports.map((r, i) => (
                <div key={i} className="text-gray-600">
                  <span className="text-gray-400">{dateCourte(r.date)} :</span>{" "}
                  {r.engagement ? `${ENGAGEMENT[r.engagement]?.icon ?? ""} ${ENGAGEMENT[r.engagement]?.label ?? r.engagement}` : "engagement non noté"}
                  {r.avancement && r.avancement !== "completed" && <> · {AVANCEMENT[r.avancement]?.label ?? r.avancement}</>}
                </div>
              ))}
              {note && <div className="text-gray-700">Pour la prochaine fois : « {note} »</div>}
            </>
          )}
        </Ligne>
      </div>

      {/* Quatre semaines, une case par jour. */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">4 dernières semaines</div>
        {/* Une ligne par semaine : sur une seule bande, la dernière semaine
            passait à la ligne dès que l'écran rétrécissait. */}
        <div className="space-y-1">
          {[0, 1, 2, 3].map((s) => {
            const semaine = ev.frise.slice(s * 7, s * 7 + 7);
            return (
              <div key={s} className="flex items-center gap-1">
                {/* Des blocs de 7 jours qui finissent aujourd'hui, pas des semaines
                    du calendrier : chaque ligne porte donc sa date de début. */}
                <span className="w-16 shrink-0 text-[10px] font-bold text-gray-400">dès le {dateCourte(semaine[0].jour)}</span>
                {semaine.map((j) => (
                  <div key={j.jour}
                    title={`${dateCourte(j.jour)} — ${[j.lecon && "leçon terminée", j.seance && "séance", j.blocage && "« Je bloque ici »"].filter(Boolean).join(", ") || "rien"}`}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${j.lecon ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {j.blocage ? "?" : j.seance ? "●" : ""}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-[11px] text-gray-400">
          <span><span className="inline-block w-3 h-3 rounded bg-green-500 align-middle mr-1" />leçon terminée</span>
          <span>● séance</span>
          <span>? « Je bloque ici »</span>
        </div>
      </div>
    </section>
  );
}

/** La section qui va chercher elle-même ses données : une fiche n'a qu'à la poser. */
export default async function EvolutionEleve({ studentId }: { studentId: string }) {
  const ev = (await chargerEvolutions([studentId], true)).get(studentId);
  if (!ev) return null;
  return <CarteEvolution ev={ev} />;
}
