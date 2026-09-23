"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { submitSessionReport, marquerLeconTerminee } from "@/app/[locale]/prof/actions";
import { NON_TENUE } from "@/lib/rapports-libelles";

type Props = {
  sessionId?: string;
  studentId?: string;
  sessionTitle: string;
  sessionDate: string;
  occurrenceDate: string; // ISO date YYYY-MM-DD — identifie l'occurrence exacte
  /** La note laissée à la séance précédente de cet enfant, s'il y en a une. */
  notePrecedente?: { texte: string; date: string } | null;
  /** Les leçons de l'élève, celle où il en est marquée `suggeree`. */
  lecons?: { id: string; titre: string; theme: string; rang: number; etat: string; suggeree: boolean }[];
  onClose: () => void;
};

/**
 * Le compte rendu d'une séance, en quelques gestes.
 *
 * Première question : la séance a-t-elle eu lieu ? Sans elle, une séance sans
 * compte rendu voulait dire deux choses — le mentor a oublié, ou la séance
 * n'a pas eu lieu — et le suivi des mentors comptait les deux pareil.
 */

const ADVANCEMENT = [
  { value: "completed",  icon: "✅", label: "A terminé la séance prévue" },
  { value: "partial",    icon: "⏩", label: "A avancé mais pas fini" },
  { value: "reviewed",   icon: "🔁", label: "A revu / consolidé une séance précédente" },
  { value: "blocked",    icon: "⚠️", label: "N'a pas pu avancer (blocage)" },
];

const ENGAGEMENT = [
  { value: "motivated",   icon: "🚀", label: "Très motivé, curieux" },
  { value: "focused",     icon: "😊", label: "Bien concentré" },
  { value: "distracted",  icon: "😐", label: "Distrait mais participait" },
  { value: "disengaged",  icon: "😔", label: "Démotivé ou difficile à engager" },
];

const HELP_METHODS = [
  { value: "example",     label: "Réexplication avec un exemple concret" },
  { value: "drawing",     label: "Dessin / schéma au tableau" },
  { value: "unplugged",   label: "\"Joue le rôle de la machine\" (débranche)" },
  { value: "encouragement", label: "Encouragement / patience" },
  { value: "simplified",  label: "Simplifié l'exercice" },
  { value: "other",       label: "Autre" },
];

/**
 * Les suites possibles de la note laissée la dernière fois. Ce sont des débuts
 * de phrase, pas des cases : le mentor les complète. Une case cochée se coche
 * sans réfléchir, une phrase commencée se finit.
 */
const SUITES = [
  { chip: "On l'a repris, c'est réglé", texte: "On a repris ce point, c'est réglé : " },
  { chip: "Repris, encore fragile",     texte: "On a repris ce point, c'est encore fragile : " },
  { chip: "Pas eu le temps",            texte: "On n'a pas eu le temps d'y revenir : " },
];

const CHOIX = "flex items-center gap-3 p-3 rounded-2xl cursor-pointer border-2 transition-all";
const CHOISI = "border-yellow-400 bg-yellow-50";
const NON_CHOISI = "border-gray-100 bg-gray-50 hover:border-gray-200";

export default function SessionReportForm({ sessionId, studentId, sessionTitle, sessionDate, occurrenceDate, notePrecedente, lecons = [], onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [tenue, setTenue] = useState<boolean | null>(null);
  const [raison, setRaison] = useState("");
  const [advancement, setAdvancement] = useState("");
  const [engagement, setEngagement] = useState("");
  const [helpMethods, setHelpMethods] = useState<string[]>([]);
  const [difficultes, setDifficultes] = useState("");
  // La leçon travaillée : proposée, jamais imposée. « Pas de leçon » est une
  // réponse valable — on a repris les bases, l'enfant était fatigué.
  const [leconId, setLeconId] = useState(() => lecons.find((l) => l.suggeree)?.id ?? "");
  const [lecon2Id, setLecon2Id] = useState("");
  const [deuxieme, setDeuxieme] = useState(false);
  const [leconFinie, setLeconFinie] = useState(false);
  const laLecon = lecons.find((l) => l.id === leconId) ?? null;
  // « On l'a terminée ensemble » : l'écran de fin le propose, il ne le fait
  // jamais tout seul (voir migration 038).
  const [aProposer, setAProposer] = useState(false);
  const [valide, setValide] = useState<"non" | "en_cours" | "fait">("non");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [canSubmit, setCanSubmit] = useState(false);

  // Une séance non tenue tient en deux écrans : ce qui s'est passé, pourquoi.
  const totalSteps = tenue === false ? 2 : 5;

  useEffect(() => {
    if (step === totalSteps) {
      const t = setTimeout(() => setCanSubmit(true), 400);
      return () => clearTimeout(t);
    }
    setCanSubmit(false);
  }, [step, totalSteps]);

  function toggleHelp(val: string) {
    setHelpMethods(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function choisirTenue(valeur: boolean) {
    setTenue(valeur);
    setStep(2);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(formRef.current!);
    // Les étapes précédentes sont démontées du DOM — on injecte les valeurs depuis le state
    data.set("tenue", tenue === false ? "0" : "1");
    if (tenue === false) {
      data.set("raison_non_tenue", raison);
    } else {
      data.set("advancement", advancement);
      data.set("engagement", engagement);
      data.set("lesson_id", leconId);
      data.set("lesson_2_id", deuxieme ? lecon2Id : "");
      data.set("lecon_finie", leconFinie ? "1" : "0");
      data.delete("help_methods");
      helpMethods.forEach(v => data.append("help_methods", v));
    }

    startTransition(async () => {
      const result = await submitSessionReport(data);
      if (result?.error) setError(result.error);
      else {
        setAProposer(Boolean(result?.aProposer) && !!studentId);
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
          <div className="text-5xl mb-4">{tenue === false ? "🗓️" : "✅"}</div>
          <div className="text-lg font-black" style={{ color: "#1B2D5E" }}>
            {tenue === false ? "Séance déclarée non tenue" : "Rapport enregistré !"}
          </div>
          <p className="text-sm mt-2 mb-6" style={{ color: "#64748B" }}>
            {tenue === false ? "Elle ne compte plus comme un compte rendu à faire." : "Merci pour ce retour pédagogique."}
          </p>

          {aProposer && laLecon && valide !== "fait" && (
            <div className="rounded-2xl p-4 mb-4 text-left" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <p className="text-sm font-bold" style={{ color: "#1B2D5E" }}>
                Vous avez terminé « {laLecon.titre} » ensemble.
              </p>
              <p className="text-xs mt-1" style={{ color: "#92400E" }}>
                La marquer comme faite pour l&apos;élève ? Il gagnera ses points et la leçon suivante s&apos;ouvrira.
              </p>
              <div className="flex gap-2 mt-3">
                <button type="button" disabled={valide === "en_cours"}
                  onClick={() => {
                    setValide("en_cours");
                    startTransition(async () => {
                      const r = await marquerLeconTerminee(laLecon.id, studentId!, occurrenceDate);
                      setValide(r?.error ? "non" : "fait");
                      if (r?.error) setError(r.error);
                    });
                  }}
                  className="flex-1 py-2.5 rounded-2xl font-black text-sm text-white disabled:opacity-50"
                  style={{ background: "#1B2D5E" }}>
                  {valide === "en_cours" ? "Un instant…" : "Oui, la marquer faite"}
                </button>
                <button type="button" onClick={() => setAProposer(false)}
                  className="px-4 py-2.5 rounded-2xl font-bold text-sm" style={{ color: "#94A3B8" }}>
                  Non
                </button>
              </div>
            </div>
          )}
          {valide === "fait" && (
            <p className="text-sm font-bold mb-4" style={{ color: "#059669" }}>
              ✅ Leçon marquée faite — ses points sont versés.
            </p>
          )}
          <button onClick={onClose} className="w-full py-3 rounded-2xl font-black text-white text-sm" style={{ background: "#1B2D5E" }}>
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-3xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#FDB813" }}>
                Rapport de séance
              </div>
              <div className="font-black text-base" style={{ color: "#1B2D5E" }}>{sessionTitle}</div>
              <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{sessionDate}</div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0">✕</button>
          </div>
          {/* Progress */}
          <div className="flex gap-1 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i < step ? "#FDB813" : "#E2E8F0" }} />
            ))}
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          {sessionId && <input type="hidden" name="session_id" value={sessionId} />}
          {studentId && <input type="hidden" name="student_id" value={studentId} />}
          <input type="hidden" name="occurrence_date" value={occurrenceDate} />

          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* ÉTAPE 1 : la séance a-t-elle eu lieu ? */}
            {step === 1 && (
              <div>
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>La séance a-t-elle eu lieu ?</div>
                <div className="text-xs mb-4" style={{ color: "#94A3B8" }}>Une séance qui n'a pas eu lieu se déclare aussi</div>
                <div className="space-y-2">
                  <button type="button" onClick={() => choisirTenue(true)}
                    className={`w-full text-left ${CHOIX} ${tenue === true ? CHOISI : NON_CHOISI}`}>
                    <span className="text-xl">✅</span>
                    <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>Oui, elle a eu lieu</span>
                  </button>
                  <button type="button" onClick={() => choisirTenue(false)}
                    className={`w-full text-left ${CHOIX} ${tenue === false ? CHOISI : NON_CHOISI}`}>
                    <span className="text-xl">🚫</span>
                    <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>Non, elle n&apos;a pas eu lieu</span>
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 (séance non tenue) : pourquoi */}
            {step === 2 && tenue === false && (
              <div className="space-y-5">
                <div>
                  <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Pourquoi n&apos;a-t-elle pas eu lieu ?</div>
                  <div className="text-xs mb-4" style={{ color: "#94A3B8" }}>Cette raison sert au suivi : dites ce qui s&apos;est passé</div>
                  <div className="space-y-2">
                    {Object.entries(NON_TENUE).map(([valeur, r]) => (
                      <label key={valeur} className={`${CHOIX} ${raison === valeur ? CHOISI : NON_CHOISI}`}>
                        <input type="radio" name="raison_non_tenue" value={valeur} checked={raison === valeur}
                          onChange={() => setRaison(valeur)} className="sr-only" />
                        <span className="text-xl">{r.icon}</span>
                        <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Un mot de plus ?</div>
                  <div className="text-xs mb-2" style={{ color: "#94A3B8" }}>Optionnel — ce que la direction doit savoir</div>
                  <textarea name="difficulty_notes" rows={3} placeholder="Ex : prévenu la veille, on décale à samedi prochain."
                    className="w-full rounded-2xl border text-sm p-3 resize-none outline-none focus:border-yellow-400 transition-colors"
                    style={{ borderColor: "#E2E8F0", color: "#1B2D5E" }} />
                  {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : Avancement */}
            {step === 2 && tenue !== false && lecons.length > 0 && (
              <div className="mb-5">
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Quelle leçon avez-vous travaillée ?</div>
                <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>
                  Rien ne le disait jusqu&apos;ici — et c&apos;est ce qui manquait pour suivre l&apos;enfant
                </div>
                <select name="lesson_id" value={leconId} onChange={(e) => { setLeconId(e.target.value); if (!e.target.value) setLeconFinie(false); }}
                  className="w-full rounded-2xl border text-sm p-3 outline-none focus:border-yellow-400 transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#1B2D5E" }}>
                  <option value="">Pas de leçon — on a repris les bases, ou autre chose</option>
                  {lecons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.rang}. {l.titre}{l.etat === "terminee" ? " (déjà terminée)" : ""}
                    </option>
                  ))}
                </select>

                {laLecon && (
                  <>
                    <label className={`${CHOIX} mt-2 ${leconFinie ? CHOISI : NON_CHOISI}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${leconFinie ? "border-yellow-400 bg-yellow-400" : "border-gray-300"}`}>
                        {leconFinie && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <input type="checkbox" name="lecon_finie" value="1" checked={leconFinie}
                        onChange={() => setLeconFinie((v) => !v)} className="sr-only" />
                      <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>On l&apos;a terminée ensemble</span>
                    </label>

                    {deuxieme ? (
                      <select name="lesson_2_id" value={lecon2Id} onChange={(e) => setLecon2Id(e.target.value)}
                        className="w-full mt-2 rounded-2xl border text-sm p-3 outline-none focus:border-yellow-400"
                        style={{ borderColor: "#E2E8F0", color: "#1B2D5E" }}>
                        <option value="">Et une deuxième leçon…</option>
                        {lecons.filter((l) => l.id !== leconId).map((l) => (
                          <option key={l.id} value={l.id}>{l.rang}. {l.titre}</option>
                        ))}
                      </select>
                    ) : (
                      <button type="button" onClick={() => setDeuxieme(true)}
                        className="text-xs font-bold mt-2 underline" style={{ color: "#94A3B8" }}>
                        + On a vu une deuxième leçon
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 2 && tenue !== false && (
              <div>
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Où en est l&apos;élève ?</div>
                <div className="text-xs mb-4" style={{ color: "#94A3B8" }}>À la fin de cette séance</div>
                <div className="space-y-2">
                  {ADVANCEMENT.map(opt => (
                    <label key={opt.value} className={`${CHOIX} ${advancement === opt.value ? CHOISI : NON_CHOISI}`}>
                      <input type="radio" name="advancement" value={opt.value} checked={advancement === opt.value}
                        onChange={() => setAdvancement(opt.value)} className="sr-only" />
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : Engagement */}
            {step === 3 && (
              <div>
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Comment était l&apos;élève ?</div>
                <div className="text-xs mb-4" style={{ color: "#94A3B8" }}>Son engagement durant la séance</div>
                <div className="space-y-2">
                  {ENGAGEMENT.map(opt => (
                    <label key={opt.value} className={`${CHOIX} ${engagement === opt.value ? CHOISI : NON_CHOISI}`}>
                      <input type="radio" name="engagement" value={opt.value} checked={engagement === opt.value}
                        onChange={() => setEngagement(opt.value)} className="sr-only" />
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : Difficultés + approche pédagogique */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  {/* La note laissée la dernière fois revient ici : c'est ce qui
                      transforme une suite de photos isolées en un fil suivi. Sans
                      elle, personne ne relisait jamais ce qui avait été écrit. */}
                  {notePrecedente && (
                    <div className="rounded-2xl p-3 mb-3" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <div className="text-[11px] font-black" style={{ color: "#B45309" }}>
                        📌 La dernière fois ({notePrecedente.date}), vous aviez noté :
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: "#1B2D5E" }}>{notePrecedente.texte}</p>
                      <div className="text-[11px] font-black mt-2" style={{ color: "#B45309" }}>Qu&apos;est-ce que ça a donné ?</div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {SUITES.map((s) => (
                          <button key={s.chip} type="button"
                            onClick={() => setDifficultes((t) => (t.trim() ? `${t.trimEnd()}\n${s.texte}` : s.texte))}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-white"
                            style={{ borderColor: "#FDE68A", color: "#B45309" }}>
                            {s.chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Ce qui s&apos;est passé</div>
                  <div className="text-xs mb-2" style={{ color: "#94A3B8" }}>
                    Ce que le prochain mentor et la direction liront — deux phrases suffisent
                  </div>
                  <textarea name="difficulty_notes" rows={3} value={difficultes} onChange={(e) => setDifficultes(e.target.value)}
                    placeholder="Ex : la notion de boucle ne rentre pas encore, on a fait des exercices supplémentaires..."
                    className="w-full rounded-2xl border text-sm p-3 resize-none outline-none focus:border-yellow-400 transition-colors"
                    style={{ borderColor: "#E2E8F0", color: "#1B2D5E" }} />
                </div>
                <div>
                  <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Comment tu as aidé ?</div>
                  <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>Plusieurs choix possibles</div>
                  <div className="space-y-2">
                    {HELP_METHODS.map(opt => (
                      <label key={opt.value} className={`${CHOIX} ${helpMethods.includes(opt.value) ? CHOISI : NON_CHOISI}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${helpMethods.includes(opt.value) ? "border-yellow-400 bg-yellow-400" : "border-gray-300"}`}>
                          {helpMethods.includes(opt.value) && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <input type="checkbox" value={opt.value} checked={helpMethods.includes(opt.value)}
                          onChange={() => toggleHelp(opt.value)} className="sr-only" />
                        <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 5 : Note pour la prochaine fois */}
            {step === 5 && (
              <div>
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Note pour la prochaine fois</div>
                <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>Optionnel — un rappel que tu te laisses à toi-même</div>
                <textarea name="next_session_note" rows={4} placeholder="Ex : reprendre les boucles avec un jeu différent, apporter une feuille..."
                  className="w-full rounded-2xl border text-sm p-3 resize-none outline-none focus:border-yellow-400 transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#1B2D5E" }} />
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="px-6 py-4 flex gap-3" style={{ borderTop: "1px solid #E2E8F0" }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-colors"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
                ← Retour
              </button>
            )}
            {step < totalSteps ? (
              step > 1 && (
                <button type="button"
                  disabled={(step === 2 && !advancement) || (step === 3 && !engagement)}
                  onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40"
                  style={{ background: "#1B2D5E" }}>
                  Suivant →
                </button>
              )
            ) : (
              <button type="submit" disabled={pending || !canSubmit || (tenue === false && !raison)}
                className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-60"
                style={{ background: "#FDB813", color: "#1B2D5E" }}>
                {pending ? "Enregistrement..." : tenue === false ? "✓ Déclarer la séance non tenue" : "✓ Valider le rapport"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
