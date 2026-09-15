import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chargerQuestionsMentor, DELAI_QUESTION_HEURES, type QuestionAvecEleve } from "@/lib/questions/donnees";
import { dateEtHeure, ilYa } from "@/lib/planning/dates";
import CarteQuestion, { type LibellesQuestion } from "@/components/backoffice/CarteQuestion";

export const dynamic = "force-dynamic";

/**
 * « Questions des élèves » — ce que les élèves du mentor lui ont demandé
 * depuis leurs exercices. Les dates arrivent formatées par le serveur.
 */
function libellesDe(q: QuestionAvecEleve, maintenant: number): LibellesQuestion {
  return {
    posee: dateEtHeure(q.poseeLe),
    depuis: ilYa(q.poseeLe, maintenant),
    reponse: q.reponse ? dateEtHeure(q.reponse.le) : null,
    reglee: q.reglee ? dateEtHeure(q.reglee.le) : null,
  };
}

export default async function QuestionsElevesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { aTraiter, traitees } = await chargerQuestionsMentor(user.id);
  const maintenant = Date.now();
  const enRetard = aTraiter.filter((q) => q.enRetard).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>🙋 Questions des élèves</h1>
        <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>
          Posées depuis un exercice, avec ce que l&apos;élève avait fait. Répondez, ou réglez-les en séance.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-black text-sm flex flex-wrap items-center gap-2" style={{ color: "#1B2D5E" }}>
          À traiter
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100" style={{ color: "#64748B" }}>{aTraiter.length}</span>
          {enRetard > 0 && (
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {enRetard} au-delà de {DELAI_QUESTION_HEURES} h
            </span>
          )}
        </h2>
        {aTraiter.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-8 text-center text-sm font-bold" style={{ color: "#94A3B8" }}>
            Aucune question en attente.
          </div>
        ) : (
          aTraiter.map((q) => <CarteQuestion key={q.id} question={q} libelles={libellesDe(q, maintenant)} />)
        )}
      </section>

      {traitees.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>Récemment traitées</h2>
          {traitees.map((q) => <CarteQuestion key={q.id} question={q} libelles={libellesDe(q, maintenant)} />)}
        </section>
      )}
    </div>
  );
}
