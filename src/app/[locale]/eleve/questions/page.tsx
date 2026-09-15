import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { chargerMesQuestions, marquerReponsesVuesEleve } from "@/lib/questions/donnees";
import { LIBELLE_RAISON } from "@/lib/questions/raisons";
import { dateEtHeure } from "@/lib/planning/dates";

export const dynamic = "force-dynamic";

/**
 * « Mes questions » — toutes les questions de l'élève, et les réponses.
 *
 * La réponse s'affiche aussi sous l'exercice ; cette page sert à retrouver ce
 * qu'on a demandé sans devoir se souvenir de quelle leçon il s'agissait.
 */
export default async function MesQuestionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: eleve, error } = await (createAdminClient().from("students") as any)
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) console.error("[questions] élève :", error.message);

  const questions = eleve ? await chargerMesQuestions(eleve.id) : [];
  // Ouvrir la page, c'est lire les réponses : la pastille du menu s'éteint.
  if (eleve) await marquerReponsesVuesEleve(eleve.id, questions.filter((q) => q.reponse).map((q) => q.id));

  return (
    <div className="p-6 lg:p-10 max-w-3xl space-y-6">
      <div>
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Aide</div>
        <h1 className="text-2xl font-black text-white">🙋 Mes questions</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Quand tu bloques sur un exercice, touche « Je bloque ici » juste en dessous : ton mentor te répond.
        </p>
      </div>

      {!eleve && (
        <div className="rounded-2xl px-5 py-4 text-sm font-bold" style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
          👁️ Aperçu — ce compte n&apos;est pas un élève.
        </div>
      )}

      {eleve && questions.length === 0 && (
        <div className="rounded-2xl px-5 py-10 text-center text-sm font-bold" style={{ background: "#1e293b", border: "1px solid #334155", color: "#64748b" }}>
          Tu n&apos;as encore posé aucune question.
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q) => {
          const lien = q.lessonId ? `/eleve/quete/${q.lessonId}` : q.trainingId ? `/eleve/entrainement/${q.trainingId}` : null;
          return (
            <div key={q.id} className="rounded-2xl p-5 space-y-3" style={{ background: "#1e293b", border: "1px solid #334155" }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-black text-white">{q.contexte.contenu?.titre || "Exercice"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    {q.contexte.bloc?.titre ? `${q.contexte.bloc.titre} · ` : ""}posée le {dateEtHeure(q.poseeLe)}
                  </div>
                </div>
                {lien && (
                  <Link href={lien} className="text-xs font-black shrink-0" style={{ color: "#FDB813" }}>
                    Revoir l&apos;exercice →
                  </Link>
                )}
              </div>

              <p className="text-sm" style={{ color: "#cbd5e1" }}>
                « {LIBELLE_RAISON[q.raison]} »{q.message ? ` — ${q.message}` : ""}
              </p>

              {q.reponse ? (
                <div className="rounded-xl p-4 space-y-1" style={{ background: "#052e16", border: "1px solid #10b98140" }}>
                  <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
                    💬 {q.reponse.parNom} t&apos;a répondu · {dateEtHeure(q.reponse.le)}
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{q.reponse.texte}</p>
                </div>
              ) : q.reglee ? (
                <p className="text-sm" style={{ color: "#94a3b8" }}>✅ {q.reglee.note ?? "Réglé en séance."}</p>
              ) : (
                <p className="text-sm" style={{ color: "#94a3b8" }}>⏳ Ton mentor va te répondre.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
