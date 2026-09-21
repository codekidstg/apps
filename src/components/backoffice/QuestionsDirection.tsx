import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import ContexteQuestion from "./ContexteQuestion";
import { chargerQuestionsDirection, DELAI_QUESTION_HEURES, LIMITE_DIRECTION, type QuestionDirection } from "@/lib/questions/donnees";
import { enFils, type Fil } from "@/lib/questions/fils";
import { LIBELLE_RAISON } from "@/lib/questions/raisons";
import { dateEtHeure, ilYa } from "@/lib/planning/dates";

/**
 * Écran « Questions des élèves » de la direction, servi tel quel à l'admin et
 * au manager : chaque « Je bloque ici », la réponse du mentor, et ce que
 * l'enfant a répondu ensuite — en lecture seule, c'est le mentor qui répond.
 *
 * Les dates sont formatées ici, côté serveur.
 */

type Filtre = "tous" | "attente" | "retard";

const ETATS = {
  en_attente: { libelle: "En attente", fond: "#FEF3C7", texte: "#92400E" },
  repondue:   { libelle: "Répondue",   fond: "#D1FAE5", texte: "#059669" },
  reglee:     { libelle: "Réglée",     fond: "#F1F5F9", texte: "#64748B" },
} as const;

const EXERCICE: Record<string, string> = {
  quiz: "Quiz", code_challenge: "Défi de code", game: "Jeu", blockly: "Programme à blocs",
};

function FilQuestions({ fil, espace, maintenant }: { fil: Fil<QuestionDirection>; espace: string; maintenant: number }) {
  const d = fil.derniere;
  const { contenu, bloc } = d.contexte;
  const etat = ETATS[fil.etat];

  return (
    <article className={`bg-white rounded-2xl border overflow-hidden ${fil.enRetard ? "border-red-200" : "border-cream-border"}`}>
      <header className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="font-black text-sm" style={{ color: "#1B2D5E" }}>
            <Link href={`/${espace}/utilisateurs/eleves/${d.eleveId}`} className="hover:underline">👦 {d.eleveNom}</Link>
            {d.mentorNom
              ? <span className="font-bold" style={{ color: "#64748B" }}> · mentor : {d.mentorNom}</span>
              : <span className="font-black text-red-700"> · aucun mentor attitré : aucun mentor ne voit ses questions</span>}
          </h3>
          <div className="text-xs mt-1" style={{ color: "#64748B" }}>
            {contenu?.titre && <span>{contenu.genre === "entrainement" ? "Entraînement" : "Leçon"} « {contenu.titre} » › </span>}
            <span>{bloc?.titre ?? EXERCICE[bloc?.type ?? ""] ?? "Exercice"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {fil.enRetard && (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700">Au-delà de {DELAI_QUESTION_HEURES} h</span>
          )}
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{ background: etat.fond, color: etat.texte }}>
            {etat.libelle}
          </span>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4">
        {/* La conversation, dans l'ordre : l'enfant, puis ce qu'on lui a répondu. */}
        <ol className="space-y-3">
          {fil.questions.map((q) => (
            <li key={q.id} className="space-y-2">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 sm:mr-10">
                <div className="text-[11px] font-bold" style={{ color: "#64748B" }}>
                  👦 {q.eleveNom} · {dateEtHeure(q.poseeLe)} · {LIBELLE_RAISON[q.raison] ?? q.raison}
                </div>
                {q.message
                  ? <p className="text-sm whitespace-pre-wrap mt-1" style={{ color: "#1B2D5E" }}>{q.message}</p>
                  : <p className="text-xs italic mt-1" style={{ color: "#94A3B8" }}>Sans message : l&apos;enfant a seulement choisi la raison.</p>}
              </div>

              {q.reponse && (
                <div className="rounded-xl px-3 py-2 sm:ml-10" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  <div className="text-[11px] font-bold" style={{ color: "#059669" }}>
                    💬 {q.reponse.parNom} · {dateEtHeure(q.reponse.le)}
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-1" style={{ color: "#1B2D5E" }}>{q.reponse.texte}</p>
                  <p className="text-[11px] font-bold mt-1" style={{ color: "#64748B" }}>
                    {q.reponse.vueLe ? `✓ Lue par l'élève le ${dateEtHeure(q.reponse.vueLe)}` : "Pas encore lue par l'élève"}
                  </p>
                </div>
              )}

              {!q.reponse && q.reglee && (
                <div className="rounded-xl px-3 py-2 sm:ml-10 bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold" style={{ color: "#64748B" }}>
                    ✅ Réglée en séance par {q.reglee.parNom} · {dateEtHeure(q.reglee.le)}
                  </div>
                  {q.reglee.note && <p className="text-sm mt-1" style={{ color: "#334155" }}>{q.reglee.note}</p>}
                </div>
              )}
            </li>
          ))}
        </ol>

        {fil.etat === "en_attente" && (
          <p className={`text-xs font-black ${fil.enRetard ? "text-red-700" : "text-amber-700"}`}>
            ⏳ Sans réponse depuis {ilYa(d.poseeLe, maintenant).replace("il y a ", "")}.
          </p>
        )}

        {(bloc?.consigne || d.contexte.travail) && (
          <details>
            <summary className="text-xs font-black cursor-pointer select-none" style={{ color: "#1B2D5E" }}>
              Voir l&apos;exercice et ce que l&apos;élève avait fait
            </summary>
            <div className="mt-3"><ContexteQuestion contexte={d.contexte} /></div>
          </details>
        )}
      </div>
    </article>
  );
}

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

  const actif: Filtre = filtre === "attente" || filtre === "retard" ? filtre : "tous";
  const compte: Record<Filtre, number> = {
    tous: fils.length,
    attente: fils.filter((f) => f.etat === "en_attente").length,
    retard: fils.filter((f) => f.enRetard).length,
  };
  const visibles = fils.filter((f) => actif === "tous" || (actif === "attente" ? f.etat === "en_attente" : f.enRetard));

  const base = `/${espace}/questions`;
  const lien = (f: Filtre) => {
    const params = new URLSearchParams();
    if (f !== "tous") params.set("filtre", f);
    if (eleveId) params.set("eleve", eleveId);
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  };
  const CHIPS: { f: Filtre; libelle: string }[] = [
    { f: "tous", libelle: "Tous les échanges" },
    { f: "attente", libelle: "En attente de réponse" },
    { f: "retard", libelle: `Au-delà de ${DELAI_QUESTION_HEURES} h` },
  ];

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

        <nav className="flex gap-1.5 flex-wrap">
          {CHIPS.map(({ f, libelle }) => (
            <Link key={f} href={lien(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${
                actif === f ? "bg-brand-navy text-white border-brand-navy" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
              {libelle} <span className="opacity-60">{compte[f]}</span>
            </Link>
          ))}
        </nav>

        {visibles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-border px-6 py-10 text-center text-sm font-bold text-ink-muted">
            {actif === "tous" ? "Aucune question pour l'instant." : "Rien dans ce filtre."}
          </div>
        ) : (
          visibles.map((fil) => <FilQuestions key={fil.cle} fil={fil} espace={espace} maintenant={maintenant} />)
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
