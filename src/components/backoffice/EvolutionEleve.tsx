import Link from "next/link";
import { chargerEvolutions, type Evolution, type QuestionVue } from "@/lib/backoffice/evolution";
import { STATUT_ELEVE } from "@/lib/backoffice/statut-eleve";
import { AVANCEMENT, ENGAGEMENT, NON_TENUE } from "@/lib/rapports";

/**
 * La section « Évolution » de la fiche élève — pour l'admin comme pour le
 * manager. Quatre questions, un statut, et les quatre dernières semaines.
 */

const ilYa = (n: number | null) =>
  n === null ? "jamais" : n === 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} jours`;
const dateCourte = (jour: string) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const s = (n: number) => (n > 1 ? "s" : "");

function Ligne({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-1 py-3 border-t border-gray-100 first:border-t-0">
      <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 pt-0.5">{question}</div>
      <div className="text-sm text-gray-700 space-y-1">{children}</div>
    </div>
  );
}

/** Ce qu'est devenu un « Je bloque ici » : en attente, répondu, ou réglé en séance. */
function SuiteQuestion({ q }: { q: QuestionVue }) {
  if (q.etat === "en_attente") return <div className="font-bold text-amber-700">⏳ en attente de réponse</div>;
  const qui = q.par ?? "le mentor";
  return (
    <div className="text-gray-500">
      ↳ {q.etat === "repondue" ? `${qui} a répondu` : `${qui} l'a réglé`}
      {q.suite && <> : « {q.suite} »</>}
    </div>
  );
}

export function CarteEvolution({ ev, lienQuestions }: { ev: Evolution; lienQuestions?: string }) {
  const statut = STATUT_ELEVE[ev.statut];
  const p = ev.parcours;
  const retard = ev.seancesPassees > 0 ? Math.max(0, ev.seancesPassees - ev.leconsTerminees) : null;
  const note = ev.rapports.find((r) => r.note)?.note ?? null;
  const enCours = ev.leconEnCours;
  const ouEnEst = !enCours ? null
    : enCours.faits > 0 ? `est en cours (${enCours.faits} exercice${s(enCours.faits)} sur ${enCours.total})`
    : enCours.ouverte ? "est ouverte, sans exercice fait"
    : "n'est pas encore ouverte";
  // La dernière séance, et son rapport s'il existe. Un rapport plus ancien ne
  // dit rien d'elle : on ne lui impute pas un retard qu'il n'a pas vu.
  const derniere = ev.derniereSeance;
  const rapportDerniere = derniere?.aUnRapport ? ev.rapports.find((r) => r.date === derniere.date) ?? null : null;
  // Le mentor a coché « terminé » pour la dernière séance, alors que la
  // plateforme compte une leçon de retard : c'est l'écart qu'il faut voir.
  const ecart = retard !== null && retard >= 1 && enCours && rapportDerniere?.avancement === "completed" ? rapportDerniere : null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="font-black text-base" style={{ color: "#1B2D5E" }}>Évolution</h2>
        <span className={`text-xs font-black px-3 py-1 rounded-full border ${statut.classes}`}>
          {statut.pastille} {statut.label.toUpperCase()}
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
          {enCours && (
            <div className="text-gray-500">
              {enCours.faits > 0
                ? <>📍 En cours : « {enCours.titre} » · {enCours.faits} exercice{s(enCours.faits)} sur {enCours.total}</>
                : enCours.ouverte
                  ? <>📍 En cours : « {enCours.titre} » · ouverte, aucun exercice fait sur {enCours.total}</>
                  : <>📍 Prochaine leçon : « {enCours.titre} », pas encore ouverte</>}
            </div>
          )}
          <div className="text-gray-500">
            🗓️ {ev.seancesPassees === 0 ? "aucune séance depuis la création de son compte"
              : <>{ev.seancesPassees} séance{s(ev.seancesPassees)} depuis la création de son compte · {ev.leconsTerminees} leçon{s(ev.leconsTerminees)} terminée{s(ev.leconsTerminees)}</>}
            {retard !== null && " "}
            {retard !== null && (
              <span className={`ml-1 text-xs font-black ${retard >= 2 ? "text-amber-700" : retard === 1 ? "text-gray-700" : "text-green-700"}`}>
                {retard === 0 ? "au rythme" : `${retard} leçon${s(retard)} de retard`}
              </span>
            )}
          </div>
          {ev.seancesNonTenues.length > 0 && (
            <div className="text-xs text-gray-500">
              🚫 {ev.seancesNonTenues.length} séance{s(ev.seancesNonTenues.length)} non tenue{s(ev.seancesNonTenues.length)} :{" "}
              {ev.seancesNonTenues.map((n) => `${dateCourte(n.date)} (${NON_TENUE[n.raison]?.label.toLowerCase() ?? "raison non dite"})`).join(", ")}
            </div>
          )}
          {ev.seancesAvantCompte > 0 && (
            <div className="text-xs text-gray-400">
              {/* Sans apostrophe : un `&apos;` dans ce texte faisait perdre à
                  la compilation l'espace qui suit l'expression. */}
              + {ev.seancesAvantCompte} séance{s(ev.seancesAvantCompte)} avant la création de son compte, non comptée{s(ev.seancesAvantCompte)}.
            </div>
          )}
        </Ligne>

        <Ligne question="Est-il régulier ?">
          <div>
            Dernière activité : <strong>{ilYa(ev.joursDepuisActivite)}</strong>
            {ev.derniereActivite && ev.joursDepuisActivite! > 1 && <span className="text-gray-400"> ({dateCourte(ev.derniereActivite)})</span>}
          </div>
          <div className="text-gray-500">{ev.joursActifs30} jour{s(ev.joursActifs30)} actif{s(ev.joursActifs30)} sur 30 · série de {ev.serie} jour{s(ev.serie)}</div>
        </Ligne>

        <Ligne question="Comprend-il ?">
          <div>
            {ev.quiz
              ? <>Quiz : <strong>{Math.round((ev.quiz.justes / ev.quiz.total) * 100)} %</strong> de bonnes réponses <span className="text-gray-400">({ev.quiz.justes}/{ev.quiz.total})</span></>
              : "Quiz : pas encore de réponse"}
          </div>
          {enCours && enCours.erreurs.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 space-y-2">
              <div className="text-xs font-black text-amber-800">À revoir dans « {enCours.titre} » :</div>
              {enCours.erreurs.map((e, i) => (
                <div key={i} className="text-xs">
                  <div className="text-gray-700">« {e.question} »</div>
                  <div className="text-gray-500">
                    a répondu <span className="font-bold text-red-700">{e.reponse ?? "?"}</span>
                    {e.bonne && <> · bonne réponse : <span className="font-bold text-green-700">{e.bonne}</span></>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-gray-500">
            « Je bloque ici » : {ev.questions.sur30} sur 30 jours
            {ev.questions.enAttente > 0 && <span className="text-amber-700 font-bold"> · {ev.questions.enAttente} en attente de réponse</span>}
          </div>
          {ev.questions.liste.length > 0 && (
            <ul className="space-y-2">
              {ev.questions.liste.map((q, i) => (
                <li key={i} className="text-xs border-l-2 border-gray-200 pl-3">
                  <div className="text-gray-400">
                    {dateCourte(q.date)}{q.contenu && <> · « {q.contenu} »</>} · {q.raison}
                  </div>
                  {q.message
                    ? <div className="text-gray-700">« {q.message} »</div>
                    : <div className="text-gray-400 italic">sans message</div>}
                  <SuiteQuestion q={q} />
                </li>
              ))}
            </ul>
          )}
          {lienQuestions && ev.questions.liste.length > 0 && (
            <Link href={lienQuestions} className="inline-block text-xs font-black text-brand-orange hover:underline">
              Tous ses échanges avec son mentor →
            </Link>
          )}
          {ev.entrainements && (
            <div className="text-gray-500">
              Entraînements : {ev.entrainements.faits} fait{s(ev.entrainements.faits)}
              {ev.entrainements.essaisMoyens !== null && <>, {ev.entrainements.essaisMoyens.toFixed(1).replace(".", ",")} essai{ev.entrainements.essaisMoyens >= 2 ? "s" : ""} en moyenne</>}
            </div>
          )}
        </Ligne>

        <Ligne question="Son mentor dit">
          {ev.rapports.length === 0 ? (
            <div className="text-gray-400">Aucun rapport de séance pour l&apos;instant.</div>
          ) : (
            <>
              {derniere && !derniere.aUnRapport && (
                <div className="text-xs font-bold text-amber-700">Séance du {dateCourte(derniere.date)} : pas encore de rapport du mentor.</div>
              )}
              {ev.rapports.map((r, i) => (
                <div key={i} className="text-gray-600">
                  <span className="text-gray-400">{dateCourte(r.date)} :</span>{" "}
                  {r.engagement ? `${ENGAGEMENT[r.engagement]?.icon ?? ""} ${ENGAGEMENT[r.engagement]?.label ?? r.engagement}` : "engagement non noté"}
                  {r.avancement && <> · {AVANCEMENT[r.avancement]?.icon ?? ""} {AVANCEMENT[r.avancement]?.label ?? r.avancement}</>}
                </div>
              ))}
              {ecart && enCours && (
                <div className="text-xs font-bold text-amber-700">
                  ⚠ Séance du {dateCourte(ecart.date)} notée « terminée », mais dans la plateforme « {enCours.titre} » {ouEnEst}.
                </div>
              )}
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
          {[0, 1, 2, 3].map((n) => {
            const semaine = ev.frise.slice(n * 7, n * 7 + 7);
            return (
              <div key={n} className="flex items-center gap-1">
                {/* Des blocs de 7 jours qui finissent aujourd'hui, pas des semaines
                    du calendrier : chaque ligne porte donc sa date de début. */}
                <span className="w-16 shrink-0 text-[10px] font-bold text-gray-400">dès le {dateCourte(semaine[0].jour)}</span>
                {semaine.map((j) => (
                  <div key={j.jour}
                    title={`${dateCourte(j.jour)} — ${[j.lecon && "leçon terminée", j.entrainement && "entraînement réussi", j.seance && "séance", j.blocage && "« Je bloque ici »"].filter(Boolean).join(", ") || "rien"}`}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                      j.lecon ? "bg-green-500 text-white" : j.entrainement ? "bg-green-200 text-green-800" : "bg-gray-100 text-gray-400"}`}>
                    {j.blocage ? "?" : j.seance ? "●" : ""}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-400">
          <span><span className="inline-block w-3 h-3 rounded bg-green-500 align-middle mr-1" />leçon terminée</span>
          <span><span className="inline-block w-3 h-3 rounded bg-green-200 align-middle mr-1" />entraînement réussi</span>
          <span>● séance</span>
          <span>? « Je bloque ici »</span>
        </div>
      </div>
    </section>
  );
}

/** La section qui va chercher elle-même ses données : une fiche n'a qu'à la poser. */
export default async function EvolutionEleve({ studentId, espace }: { studentId: string; espace: "admin" | "manager" }) {
  const ev = (await chargerEvolutions([studentId], true)).get(studentId);
  if (!ev) return null;
  return <CarteEvolution ev={ev} lienQuestions={`/${espace}/questions?eleve=${studentId}`} />;
}
