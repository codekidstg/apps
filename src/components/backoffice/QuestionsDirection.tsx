import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import EchangesParEnfant, { Filtres } from "./EchangesParEnfant";
import { chargerQuestionsDirection, LIMITE_DIRECTION } from "@/lib/questions/donnees";
import { enFils, parEnfant, lireFiltre, filtrerFils, compterFils } from "@/lib/questions/fils";
import { fichesDesQuestions } from "@/lib/questions/fiches";

/**
 * Écran « Questions des élèves » de la direction, servi tel quel à l'admin et
 * au manager : chaque « Je bloque ici », la réponse du mentor, et ce que
 * l'enfant a répondu ensuite — en lecture seule, c'est le mentor qui répond.
 * Le mentor a la même page, où il répond (prof/questions).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuestionsDirection({ espace, filtre, eleve }: {
  espace: "admin" | "manager";
  filtre?: string;
  /** Tel qu'il arrive dans l'adresse : un identifiant mal formé est ignoré. */
  eleve?: string;
}) {
  const eleveId = eleve && UUID.test(eleve) ? eleve : undefined;
  const { questions, eleveNom, erreur, maintenant } = await chargerQuestionsDirection(eleveId);
  const fils = enFils(questions);
  const fiches = await fichesDesQuestions(questions);
  const actif = lireFiltre(filtre);
  const enfants = parEnfant(filtrerFils(fils, actif));
  const base = `/${espace}/questions`;

  return (
    <div>
      <PageHeader
        title="Questions des élèves"
        subtitle="Les « Je bloque ici » des enfants, les réponses de leurs mentors et la suite des échanges. En lecture seule : c'est le mentor qui répond."
      />
      <div className="p-8 space-y-6 max-w-4xl">
        {erreur && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Les questions n&apos;ont pas pu être chargées : {erreur}
          </div>
        )}

        {eleveId && (
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold" style={{ color: "#1B2D5E" }}>
            <span>Échanges de {eleveNom ?? "cet élève"}</span>
            <Link href={base} className="text-xs font-black text-brand-orange hover:underline">Voir tous les élèves →</Link>
          </div>
        )}

        <Filtres base={base} actif={actif} compte={compterFils(fils)} eleveId={eleveId} />

        {enfants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-border px-6 py-10 text-center text-sm font-bold text-ink-muted">
            {actif === "tous" ? "Aucune question pour l'instant." : "Rien dans ce filtre."}
          </div>
        ) : (
          // Venu de la fiche de l'élève : son bloc s'ouvre, et ses échanges avec.
          <EchangesParEnfant enfants={enfants} fiches={fiches} maintenant={maintenant} ouvert={!!eleveId}
            afficherMentor lienFiche={(id) => `/${espace}/utilisateurs/eleves/${id}`} />
        )}

        {questions.length >= LIMITE_DIRECTION && (
          <p className="text-xs font-bold text-ink-muted">
            Seules les {LIMITE_DIRECTION} questions les plus récentes sont affichées.
          </p>
        )}
      </div>
    </div>
  );
}
