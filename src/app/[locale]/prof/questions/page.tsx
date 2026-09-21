import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { chargerQuestionsMentor, DELAI_QUESTION_HEURES } from "@/lib/questions/donnees";
import { enFils, parEnfant, lireFiltre, filtrerFils, compterFils } from "@/lib/questions/fils";
import { fichesDesQuestions } from "@/lib/questions/fiches";
import EchangesParEnfant, { Filtres } from "@/components/backoffice/EchangesParEnfant";
import ReponseMentor from "@/components/backoffice/ReponseMentor";

export const dynamic = "force-dynamic";

/**
 * « Questions des élèves » — ce que les élèves du mentor lui ont demandé
 * depuis leurs exercices. La même page que celle de la direction : une ligne
 * par enfant, une ligne par échange ; sous chaque échange qui attend, l'exercice
 * avec sa réponse et de quoi répondre.
 */
export default async function QuestionsElevesPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { filtre } = await searchParams;
  const { questions, erreur, maintenant } = await chargerQuestionsMentor(user.id);
  const fils = enFils(questions);
  // L'exercice de chaque question, avec sa réponse : de quoi répondre sans
  // rouvrir la leçon.
  const fiches = await fichesDesQuestions(questions);
  const actif = lireFiltre(filtre);
  const enfants = parEnfant(filtrerFils(fils, actif));
  const compte = compterFils(fils);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>🙋 Questions des élèves</h1>
        <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>
          Posées depuis un exercice, avec ce que l&apos;élève avait fait. Répondez, ou réglez-les en séance.
        </p>
      </div>

      {erreur && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          Les questions n&apos;ont pas pu être chargées : {erreur}
        </div>
      )}

      <Filtres base="/prof/questions" actif={actif} compte={compte} />
      {compte.retard > 0 && (
        <p className="text-xs font-black text-red-700">
          {compte.retard} échange{compte.retard > 1 ? "s attendent" : " attend"} une réponse depuis plus de {DELAI_QUESTION_HEURES} h.
        </p>
      )}

      {enfants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-8 text-center text-sm font-bold" style={{ color: "#94A3B8" }}>
          {actif === "tous" ? "Aucune question pour l'instant." : "Rien dans ce filtre."}
        </div>
      ) : (
        <EchangesParEnfant enfants={enfants} fiches={fiches} maintenant={maintenant} ouvert={false} afficherMentor={false}
          repondre={(fil, fiche, choixEleve) => (
            <ReponseMentor questionId={fil.derniere.id} fiche={fiche} choixEleve={choixEleve} />
          )} />
      )}
    </div>
  );
}
