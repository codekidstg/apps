"use client";

import { useState } from "react";
import { SEUIL, PLAFOND_PAR_OUBLI, MINIMUM_SEANCES, DELAI_HEURES, type Bloc } from "@/lib/backoffice/note-mentor";

/**
 * La règle de la note, écrite une fois, pour qui ne la connaît pas.
 *
 * Elle s'affiche au même endroit dans les deux écrans : dépliée par le « ? »
 * posé sur chaque bloc de la fiche, ou par son propre bandeau au bas de la
 * liste. Les seuils sont lus dans `note-mentor.ts`, la règle elle-même : si le
 * minimum passe un jour de 80 à 85, l'explication suit toute seule.
 */

const BLOCS = [
  {
    nom: "Ses séances", sur: 50,
    quoi: [
      "la séance a eu lieu",
      "son compte rendu est fait",
      `rendu dans les ${DELAI_HEURES} h`,
      "et il y dit quelque chose : une difficulté, une méthode d'aide, ou une note pour la prochaine fois",
    ],
  },
  {
    nom: "Ses réponses aux enfants", sur: 25,
    quoi: [
      "chaque « Je bloque ici » reçoit une réponse — ou se règle en séance",
      `dans les ${DELAI_HEURES} h`,
    ],
  },
  {
    nom: "Sa réaction quand un élève décroche", sur: 25,
    quoi: [
      "un compte rendu du mois signale l'élève qui ralentit ou qui bloque",
      "et dit quoi reprendre la prochaine fois",
    ],
  },
];

function Explication() {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5 space-y-3">
      <p className="text-xs font-bold text-ink">
        La note part de 100 et ne porte que sur ce que le mentor tient dans sa main.
        Chaque séance, chaque échange et chaque élève qui décroche est regardé sur quelques points précis ;
        ce qui manque coûte des points. Minimum attendu : {SEUIL} sur 100.
      </p>

      <div className="space-y-2.5">
        {BLOCS.map((b) => (
          <div key={b.nom}>
            <div className="text-xs font-black text-ink">{b.nom} <span className="text-ink-muted">· {b.sur} points</span></div>
            <ul className="mt-0.5 space-y-0.5">
              {b.quoi.map((q) => (
                <li key={q} className="text-xs font-bold text-ink-muted flex gap-1.5">
                  <span className="text-brand-orange">•</span><span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Les `{" "}` ne sont pas décoratifs : l'espace qui suit une balise est
          perdu à la compilation quand le texte qui vient après contient une
          entité (&apos;) — « décomptequand » au lieu de « décompte quand ». */}
      <div className="pt-2.5 border-t border-slate-200 space-y-1.5">
        <p className="text-[11px] font-bold text-ink-muted">
          <strong className="text-ink">Un oubli coûte au plus {PLAFOND_PAR_OUBLI} points</strong>, quel que soit le nombre
          de séances : la même faute doit coûter le même prix à un mentor qui fait 3 séances et à un mentor qui en fait 8.
        </p>
        <p className="text-[11px] font-bold text-ink-muted">
          <strong className="text-ink">Une séance non tenue sort du décompte</strong>{" "}quand la raison ne dépend pas de lui —
          élève absent, coupure, congés. « Mentor empêché » reste à sa charge, et le nombre de déclarations s&apos;affiche à part.
        </p>
        <p className="text-[11px] font-bold text-ink-muted">
          <strong className="text-ink">Deux messages d&apos;un enfant sur le même exercice font un seul échange</strong>{" "}:
          son écran lui montre un fil, et il y répond une fois. L&apos;attente se compte depuis le premier message resté sans réponse.
        </p>
        <p className="text-[11px] font-bold text-ink-muted">
          <strong className="text-ink">Un bloc sans matière passe ses points aux séances</strong>{" "}: un mois sans aucune question
          d&apos;élève, les séances valent 75 au lieu de 50. Et sous {MINIMUM_SEANCES}{" "}séances dans le mois, il n&apos;y a pas de
          note : une moyenne sur si peu ne voudrait rien dire.
        </p>
        <p className="text-[11px] font-bold text-ink-muted">
          <strong className="text-ink">La progression des élèves n&apos;entre pas dans la note</strong>{" "}: elle dépend aussi de leur
          maison, de leur santé, du courant qui saute. Elle est affichée à côté, pour la discussion de fin de mois.
        </p>
      </div>
    </div>
  );
}

function Bouton({ ouvert, onClick, texte }: { ouvert: boolean; onClick: () => void; texte?: string }) {
  return (
    <button
      type="button" onClick={onClick} aria-expanded={ouvert} aria-controls="regle-note"
      aria-label={texte ? undefined : "Comment cette note est calculée"}
      title="Comment cette note est calculée"
      className={texte
        ? "flex items-center gap-2 text-xs font-black text-ink-muted hover:text-ink transition-colors"
        : "w-4 h-4 rounded-full border border-slate-300 text-[10px] font-black text-ink-muted leading-none hover:border-brand-orange hover:text-brand-orange transition-colors shrink-0"}
    >
      {texte ? <><span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] leading-none flex items-center justify-center">?</span>{texte}<span style={{ fontSize: 9 }}>{ouvert ? "▲" : "▼"}</span></> : "?"}
    </button>
  );
}

/** Le bandeau seul, au bas de la liste des mentors. */
export default function RegleNote() {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="space-y-2">
      <Bouton ouvert={ouvert} onClick={() => setOuvert(!ouvert)} texte="Comment cette note est calculée" />
      {ouvert && <div id="regle-note"><Explication /></div>}
    </div>
  );
}

/** Les trois blocs de la fiche, chacun avec son « ? » qui déplie la règle. */
export function JaugesAvecRegle({ blocs }: { blocs: Bloc[] }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="space-y-3">
      {blocs.filter((b) => b.sur > 0).map((b) => {
        const part = Math.max(0, Math.min(100, (b.points / b.sur) * 100));
        return (
          <div key={b.nom}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-black text-ink flex items-center gap-1.5">
                {b.nom}
                <Bouton ouvert={ouvert} onClick={() => setOuvert(!ouvert)} />
              </span>
              <span className="text-xs font-black text-ink-muted tabular-nums">{b.points} / {b.sur}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${part}%`, background: part >= 80 ? "#10b981" : part >= 60 ? "#f59e0b" : "#ef4444" }} />
            </div>
          </div>
        );
      })}
      {ouvert && <div id="regle-note"><Explication /></div>}
    </div>
  );
}
