import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireParentPermission } from "@/lib/permissions/parent";
import { chargerQuestionsEnfants } from "@/lib/questions/donnees";
import { libelleRaison, LIBELLE_CLOTURE, motCloture } from "@/lib/questions/raisons";
import { dateEtHeure } from "@/lib/planning/dates";

export const dynamic = "force-dynamic";

/**
 * « Questions de mon enfant » — en lecture seule.
 *
 * Aucun consentement n'est exigé pour qu'un enfant pose une question : c'est
 * cette visibilité qui protège. Le parent voit chaque question et chaque
 * réponse, sans pouvoir écrire dans l'échange ; pour le reste, il écrit à la
 * direction.
 */
export default async function QuestionsEnfantPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  await requireParentPermission(user.id, "parent.questions", locale);
  const questions = await chargerQuestionsEnfants(user.id);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Questions de mon enfant</h1>
        <p className="text-slate-400 text-sm">
          Quand votre enfant bloque sur un exercice, il peut poser une question à son mentor. Vous voyez ici chaque question et chaque réponse.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center text-sm text-slate-400">
          Aucune question pour l&apos;instant.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-white">{q.eleveNom}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {q.contexte.contenu?.titre ? `« ${q.contexte.contenu.titre} » · ` : ""}{dateEtHeure(q.poseeLe)}
                  </div>
                </div>
                <span className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full ${
                  q.etat === "repondue" ? "bg-emerald-900/50 text-emerald-300"
                  : q.etat === "reglee" ? "bg-slate-700 text-slate-300"
                  : "bg-amber-900/40 text-amber-300"}`}>
                  {q.etat === "repondue" ? "💬 Répondue" : q.etat === "reglee" ? `✅ ${LIBELLE_CLOTURE[q.reglee?.raison ?? "seance"].libelle}` : "⏳ En attente"}
                </span>
              </div>

              <p className="text-sm text-slate-300">
                « {libelleRaison(q.raison)} »{q.message ? ` — ${q.message}` : ""}
              </p>

              {q.reponse && (
                <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-4 space-y-1.5">
                  <div className="text-xs font-black text-blue-300 uppercase tracking-widest">
                    Réponse de {q.reponse.parNom} · {dateEtHeure(q.reponse.le)}
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{q.reponse.texte}</p>
                </div>
              )}
              {!q.reponse && q.reglee && <p className="text-sm text-slate-400">{motCloture(q.reglee.raison, q.reglee.note)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
