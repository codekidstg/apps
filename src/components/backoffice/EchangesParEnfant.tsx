import Link from "next/link";
import ContexteQuestion from "./ContexteQuestion";
import FicheExercice from "./FicheExercice";
import { DELAI_QUESTION_HEURES, type QuestionDirection } from "@/lib/questions/donnees";
import type { Enfant, Fil, FiltreEchanges } from "@/lib/questions/fils";
import type { FicheExercice as Fiche } from "@/lib/questions/corrige";
import { reponsesDansLaFiche } from "@/lib/questions/reponses-eleve";
import { libelleRaison, LIBELLE_CLOTURE } from "@/lib/questions/raisons";
import { dateEtHeure, ilYa } from "@/lib/planning/dates";

/**
 * Les échanges « Je bloque ici » : une ligne par enfant, qu'on déplie, puis
 * une ligne par échange, qu'on déplie aussi. La même page pour la direction,
 * qui lit, et pour le mentor, qui répond : la page reste courte, même avec
 * cinquante enfants.
 *
 * Chaque échange montre la conversation dans l'ordre, ce que l'enfant avait
 * fait, et l'exercice avec sa réponse attendue. Pour un quiz, les choix de
 * l'enfant sont marqués dans l'exercice (❌ à côté du ✅) : le bloc « ce que
 * l'élève avait fait » ferait doublon et disparaît.
 *
 * Rendu par le serveur ; les dates sont formatées ici.
 */

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

/** Chez le mentor : ce qu'il faut pour répondre à un échange qui attend. */
export type Repondre = (fil: Fil<QuestionDirection>, fiche: Fiche | null, choixEleve: Record<number, number> | null) => React.ReactNode;

/** Les filtres en tête de page, chacun avec son nombre d'échanges. */
export function Filtres({ base, actif, compte, eleveId }: {
  base: string;
  actif: FiltreEchanges;
  compte: Record<FiltreEchanges, number>;
  /** Venu de la fiche d'un élève : les filtres restent sur lui. */
  eleveId?: string;
}) {
  const lien = (f: FiltreEchanges) => {
    const params = new URLSearchParams();
    if (f !== "tous") params.set("filtre", f);
    if (eleveId) params.set("eleve", eleveId);
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  };
  const CHIPS: { f: FiltreEchanges; libelle: string }[] = [
    { f: "tous", libelle: "Tous les échanges" },
    { f: "attente", libelle: "En attente de réponse" },
    { f: "retard", libelle: `Au-delà de ${DELAI_QUESTION_HEURES} h` },
  ];
  return (
    <nav className="flex gap-1.5 flex-wrap">
      {CHIPS.map(({ f, libelle }) => (
        <Link key={f} href={lien(f)}
          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${
            actif === f ? "bg-brand-navy text-white border-brand-navy" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
          {libelle} <span className="opacity-60">{compte[f]}</span>
        </Link>
      ))}
    </nav>
  );
}

function Pastille({ fond, texte, children }: { fond: string; texte: string; children: React.ReactNode }) {
  return <span className="text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: fond, color: texte }}>{children}</span>;
}

/** La conversation, dans l'ordre : l'enfant, puis ce qu'on lui a répondu. */
function Conversation({ fil }: { fil: Fil<QuestionDirection> }) {
  return (
    <ol className="space-y-3">
      {fil.questions.map((q) => (
        <li key={q.id} className="space-y-2">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 sm:mr-10">
            <div className="text-[11px] font-bold" style={{ color: "#64748B" }}>
              {/* Un message que l'enfant écrit sans rien demander n'a pas de
                  raison cochée, et n'attend pas de réponse (migration 037). */}
              {q.kind === "reponse" ? "💬" : "👦"} {q.eleveNom} · {dateEtHeure(q.poseeLe)}
              {` · ${libelleRaison(q.raison)}`}
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
                {LIBELLE_CLOTURE[q.reglee.raison].emoji} {LIBELLE_CLOTURE[q.reglee.raison].libelle} — par {q.reglee.parNom} · {dateEtHeure(q.reglee.le)}
              </div>
              {q.reglee.note && <p className="text-sm mt-1" style={{ color: "#334155" }}>{q.reglee.note}</p>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function Echange({ fil, fiche, maintenant, ouvert, repondre }: {
  fil: Fil<QuestionDirection>;
  fiche: Fiche | null;
  maintenant: number;
  ouvert: boolean;
  repondre?: Repondre;
}) {
  const d = fil.derniere;
  const { contenu, bloc } = d.contexte;
  const etat = ETATS[fil.etat];
  // Les choix de l'enfant, retrouvés dans ce qu'il a envoyé : marqués dans la fiche.
  const dansLaFiche = fiche ? reponsesDansLaFiche(d.contexte.travail, fiche) : null;
  const reponse = repondre && fil.etat === "en_attente" ? repondre(fil, fiche, dansLaFiche?.choix ?? null) : null;

  return (
    <details open={ouvert}>
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
        <Conversation fil={fil} />

        {fil.etat === "en_attente" && (
          <p className={`text-xs font-black ${fil.enRetard ? "text-red-700" : "text-amber-700"}`}>
            ⏳ Sans réponse depuis {depuis(d.poseeLe, maintenant)}.
          </p>
        )}

        {!dansLaFiche?.complet && <ContexteQuestion contexte={d.contexte} sansConsigne={!!fiche} />}

        {reponse ?? (fiche ? (
          <details className="rounded-xl border border-slate-200">
            <summary className="px-3 py-2 text-xs font-black cursor-pointer select-none" style={{ color: "#1B2D5E" }}>
              📘 L&apos;exercice et sa réponse
            </summary>
            <div className="px-3 pb-3"><FicheExercice fiche={fiche} reponsesEleve={dansLaFiche?.choix} /></div>
          </details>
        ) : (
          <p className="text-[11px] font-bold" style={{ color: "#94A3B8" }}>
            Cet exercice a été modifié depuis la question : seule sa consigne d&apos;alors reste visible.
          </p>
        ))}
      </div>
    </details>
  );
}

export default function EchangesParEnfant({ enfants, fiches, maintenant, ouvert, afficherMentor, lienFiche, repondre }: {
  enfants: Enfant<QuestionDirection>[];
  fiches: Record<string, Fiche>;
  maintenant: number;
  /** Tout déplié : venu de la fiche d'un élève. */
  ouvert: boolean;
  /** La direction voit le mentor de chaque enfant ; le mentor, non : c'est lui. */
  afficherMentor: boolean;
  lienFiche?: (eleveId: string) => string;
  repondre?: Repondre;
}) {
  return (
    <div className="space-y-3">
      {enfants.map((e) => {
        const premier = e.fils[0].derniere;
        return (
          <details key={e.eleveId} open={ouvert}
            className={`bg-white rounded-2xl border overflow-hidden ${e.enRetard ? "border-red-200" : "border-slate-200"}`}>
            <summary className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50">
              <span className="min-w-0 text-sm">
                <span className="font-black" style={{ color: "#1B2D5E" }}>👦 {premier.eleveNom}</span>
                {afficherMentor && (premier.mentorNom
                  ? <span className="font-bold" style={{ color: "#64748B" }}> · mentor : {premier.mentorNom}</span>
                  : <span className="font-black text-red-700"> · aucun mentor attitré : aucun mentor ne voit ses questions</span>)}
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
                <Echange key={fil.cle} fil={fil} fiche={fiches[fil.derniere.blocId] ?? null}
                  maintenant={maintenant} ouvert={ouvert} repondre={repondre} />
              ))}
              {lienFiche && (
                <div className="px-5 py-3">
                  <Link href={lienFiche(e.eleveId)} className="text-xs font-black text-brand-orange hover:underline">Voir sa fiche →</Link>
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
