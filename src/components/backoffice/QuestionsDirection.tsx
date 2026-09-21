import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import ContexteQuestion from "./ContexteQuestion";
import FicheExercice from "./FicheExercice";
import { chargerQuestionsDirection, DELAI_QUESTION_HEURES, LIMITE_DIRECTION, type QuestionDirection } from "@/lib/questions/donnees";
import { enFils, parEnfant, type Fil } from "@/lib/questions/fils";
import { fichesDesQuestions } from "@/lib/questions/fiches";
import type { FicheExercice as Fiche } from "@/lib/questions/corrige";
import { LIBELLE_RAISON } from "@/lib/questions/raisons";
import { dateEtHeure, ilYa } from "@/lib/planning/dates";

/**
 * Écran « Questions des élèves » de la direction, servi tel quel à l'admin et
 * au manager : chaque « Je bloque ici », la réponse du mentor, et ce que
 * l'enfant a répondu ensuite — en lecture seule, c'est le mentor qui répond.
 *
 * Une ligne par enfant, qu'on déplie ; puis une ligne par échange, qu'on
 * déplie aussi : la page reste courte, même avec cinquante enfants. Chaque
 * échange montre l'exercice complet et sa réponse attendue.
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

const s = (n: number) => (n > 1 ? "s" : "");
const depuis = (iso: string, maintenant: number) => ilYa(iso, maintenant).replace("il y a ", "");

function Pastille({ fond, texte, children }: { fond: string; texte: string; children: React.ReactNode }) {
  return <span className="text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: fond, color: texte }}>{children}</span>;
}

/** Un échange : la conversation, ce que l'enfant avait fait, l'exercice et sa réponse. */
function Echange({ fil, fiche, maintenant, ouvert }: { fil: Fil<QuestionDirection>; fiche: Fiche | null; maintenant: number; ouvert: boolean }) {
  const d = fil.derniere;
  const { contenu, bloc } = d.contexte;
  const etat = ETATS[fil.etat];

  return (
    <details open={ouvert} className="group">
      <summary className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-50">
        <span className="text-xs min-w-0" style={{ color: "#1B2D5E" }}>
          {contenu?.titre && <span className="font-bold">{contenu.genre === "entrainement" ? "Entraînement" : "Leçon"} « {contenu.titre} » › </span>}
          {/* Le titre de l'exercice s'il en a un (« Le plan du coffre »), sinon le nom du jeu. */}
          <span>{bloc?.titre ?? fiche?.nom ?? EXERCICE[bloc?.type ?? ""] ?? "Exercice"}</span>
          <span style={{ color: "#94A3B8" }}> · {fil.questions.length} message{s(fil.questions.length)} de l&apos;élève</span>
        </span>
        <span className="flex items-center gap-2">
          {fil.etat === "en_attente" && (
            <span className={`text-[11px] font-black ${fil.enRetard ? "text-red-700" : "text-amber-700"}`}>
              ⏳ {depuis(d.poseeLe, maintenant)}
            </span>
          )}
          {fil.enRetard && <Pastille fond="#FEE2E2" texte="#B91C1C">Au-delà de {DELAI_QUESTION_HEURES} h</Pastille>}
          <Pastille fond={etat.fond} texte={etat.texte}>{etat.libelle}</Pastille>
        </span>
      </summary>

      <div className="px-5 pb-5 pt-1 space-y-4">
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
            ⏳ Sans réponse depuis {depuis(d.poseeLe, maintenant)}.
          </p>
        )}

        <ContexteQuestion contexte={d.contexte} sansConsigne={!!fiche} />

        {fiche ? (
          <details className="rounded-xl border border-slate-200">
            <summary className="px-3 py-2 text-xs font-black cursor-pointer select-none" style={{ color: "#1B2D5E" }}>
              📘 L&apos;exercice et sa réponse
            </summary>
            <div className="px-3 pb-3"><FicheExercice fiche={fiche} /></div>
          </details>
        ) : (
          <p className="text-[11px] font-bold" style={{ color: "#94A3B8" }}>
            Cet exercice a été modifié depuis la question : seule sa consigne d&apos;alors reste visible.
          </p>
        )}
      </div>
    </details>
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
  const fiches = await fichesDesQuestions(questions);

  const actif: Filtre = filtre === "attente" || filtre === "retard" ? filtre : "tous";
  const compte: Record<Filtre, number> = {
    tous: fils.length,
    attente: fils.filter((f) => f.etat === "en_attente").length,
    retard: fils.filter((f) => f.enRetard).length,
  };
  const enfants = parEnfant(fils.filter((f) => actif === "tous" || (actif === "attente" ? f.etat === "en_attente" : f.enRetard)));

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

        {enfants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-border px-6 py-10 text-center text-sm font-bold text-ink-muted">
            {actif === "tous" ? "Aucune question pour l'instant." : "Rien dans ce filtre."}
          </div>
        ) : (
          <div className="space-y-3">
            {enfants.map((e) => {
              const premier = e.fils[0].derniere;
              return (
                // Venu de la fiche de l'élève : son bloc s'ouvre, et ses échanges avec.
                <details key={e.eleveId} open={!!eleveId}
                  className={`bg-white rounded-2xl border overflow-hidden ${e.enRetard ? "border-red-200" : "border-cream-border"}`}>
                  <summary className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50">
                    <span className="min-w-0 text-sm">
                      <span className="font-black" style={{ color: "#1B2D5E" }}>👦 {premier.eleveNom}</span>
                      {premier.mentorNom
                        ? <span className="font-bold" style={{ color: "#64748B" }}> · mentor : {premier.mentorNom}</span>
                        : <span className="font-black text-red-700"> · aucun mentor attitré : aucun mentor ne voit ses questions</span>}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-[11px] font-bold" style={{ color: "#64748B" }}>
                      <span>{e.fils.length} échange{s(e.fils.length)}</span>
                      {e.enAttente > 0 && <Pastille fond="#FEF3C7" texte="#92400E">{e.enAttente} en attente</Pastille>}
                      {e.enRetard > 0 && <Pastille fond="#FEE2E2" texte="#B91C1C">{e.enRetard} au-delà de {DELAI_QUESTION_HEURES} h</Pastille>}
                      <span>dernier : {ilYa(e.derniereActivite, maintenant)}</span>
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {e.fils.map((fil) => (
                      <Echange key={fil.cle} fil={fil} fiche={fiches[fil.derniere.blocId] ?? null} maintenant={maintenant} ouvert={!!eleveId} />
                    ))}
                    <div className="px-5 py-3">
                      <Link href={`/${espace}/utilisateurs/eleves/${e.eleveId}`} className="text-xs font-black text-brand-orange hover:underline">
                        Voir sa fiche →
                      </Link>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
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
