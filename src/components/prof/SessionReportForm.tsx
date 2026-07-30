"use client";

import { useRef, useState, useTransition } from "react";
import { submitSessionReport } from "@/app/[locale]/prof/actions";

type Props = {
  sessionId?: string;
  studentId?: string;
  sessionTitle: string;
  sessionDate: string;
  onClose: () => void;
};

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

export default function SessionReportForm({ sessionId, studentId, sessionTitle, sessionDate, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [advancement, setAdvancement] = useState("");
  const [engagement, setEngagement] = useState("");
  const [helpMethods, setHelpMethods] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const totalSteps = 4;

  function toggleHelp(val: string) {
    setHelpMethods(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(formRef.current!);
    // Les étapes 1 et 2 sont démontées du DOM — on injecte les valeurs depuis le state
    data.set("advancement", advancement);
    data.set("engagement", engagement);
    data.delete("help_methods");
    helpMethods.forEach(v => data.append("help_methods", v));

    startTransition(async () => {
      const result = await submitSessionReport(data);
      if (result?.error) setError(result.error);
      else setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
          <div className="text-5xl mb-4">✅</div>
          <div className="text-lg font-black" style={{ color: "#1B2D5E" }}>Rapport enregistré !</div>
          <p className="text-sm mt-2 mb-6" style={{ color: "#64748B" }}>Merci pour ce retour pédagogique.</p>
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

          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* ÉTAPE 1 : Avancement */}
            {step === 1 && (
              <div>
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Où en est l'élève ?</div>
                <div className="text-xs mb-4" style={{ color: "#94A3B8" }}>À la fin de cette séance</div>
                <div className="space-y-2">
                  {ADVANCEMENT.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border-2 transition-all ${advancement === opt.value ? "border-yellow-400 bg-yellow-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                      <input type="radio" name="advancement" value={opt.value} checked={advancement === opt.value}
                        onChange={() => setAdvancement(opt.value)} className="sr-only" required />
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : Engagement */}
            {step === 2 && (
              <div>
                <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Comment était l'élève ?</div>
                <div className="text-xs mb-4" style={{ color: "#94A3B8" }}>Son engagement durant la séance</div>
                <div className="space-y-2">
                  {ENGAGEMENT.map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border-2 transition-all ${engagement === opt.value ? "border-yellow-400 bg-yellow-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                      <input type="radio" name="engagement" value={opt.value} checked={engagement === opt.value}
                        onChange={() => setEngagement(opt.value)} className="sr-only" required />
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : Difficultés + approche pédagogique */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Difficultés rencontrées ?</div>
                  <div className="text-xs mb-2" style={{ color: "#94A3B8" }}>Laisse vide si tout s'est bien passé</div>
                  <textarea name="difficulty_notes" rows={3} placeholder="Ex : la notion de boucle ne rentre pas encore, on a fait des exercices supplémentaires..."
                    className="w-full rounded-2xl border text-sm p-3 resize-none outline-none focus:border-yellow-400 transition-colors"
                    style={{ borderColor: "#E2E8F0", color: "#1B2D5E" }} />
                </div>
                <div>
                  <div className="font-black mb-1" style={{ color: "#1B2D5E" }}>Comment tu as aidé ?</div>
                  <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>Plusieurs choix possibles</div>
                  <div className="space-y-2">
                    {HELP_METHODS.map(opt => (
                      <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border-2 transition-all ${helpMethods.includes(opt.value) ? "border-yellow-400 bg-yellow-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
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

            {/* ÉTAPE 4 : Note pour la prochaine fois */}
            {step === 4 && (
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
              <button type="button"
                disabled={(step === 1 && !advancement) || (step === 2 && !engagement)}
                onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40"
                style={{ background: "#1B2D5E" }}>
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={pending}
                className="flex-1 py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-60"
                style={{ background: "#FDB813", color: "#1B2D5E" }}>
                {pending ? "Enregistrement..." : "✓ Valider le rapport"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
