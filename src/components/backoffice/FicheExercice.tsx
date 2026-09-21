import type { FicheExercice as Fiche, Partie, TypeCase } from "@/lib/questions/corrige";

/**
 * La fiche d'un exercice : ce que l'enfant a devant lui, et la réponse
 * attendue, en vert. Réservée au mentor et à la direction. Pour un quiz, les
 * choix de l'enfant y sont marqués (❌ à côté du ✅).
 *
 * Sans état : elle sert la réponse du mentor (ReponseMentor, dans le
 * navigateur, avec `onReprendre`, qui verse une explication dans sa réponse)
 * comme les échanges en lecture seule (rendus par le serveur).
 */

const CASE: Record<TypeCase, { fond: string; signe: string; nom: string }> = {
  mur:     { fond: "#334155", signe: "",   nom: "mur" },
  depart:  { fond: "#0ea5e9", signe: "",   nom: "départ" },
  arrivee: { fond: "#FEF3C7", signe: "⭐", nom: "arrivée" },
  gemme:   { fond: "#FFFFFF", signe: "💎", nom: "gemme" },
  cle:     { fond: "#FFFFFF", signe: "🗝️", nom: "clé" },
  porte:   { fond: "#FDE68A", signe: "🔒", nom: "porte verrouillée" },
  trace:   { fond: "#FDE047", signe: "",   nom: "figure à tracer" },
  chemin:  { fond: "#6EE7B7", signe: "",   nom: "trajet" },
};
const FLECHE: Record<string, string> = { N: "↑", E: "→", S: "↓", W: "←" };

function Reprendre({ texte, onReprendre }: { texte: string; onReprendre?: (texte: string) => void }) {
  if (!onReprendre) return null;
  return (
    <button type="button" onClick={() => onReprendre(texte)}
      className="mt-1 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
      ↪ Reprendre dans ma réponse
    </button>
  );
}

function Titre({ texte, reponse }: { texte: string; reponse?: boolean }) {
  return (
    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${reponse ? "text-emerald-700" : "text-slate-400"}`}>
      {reponse ? "✅ " : ""}{texte}
    </div>
  );
}

function Grille({ p }: { p: Extract<Partie, { genre: "grille" }> }) {
  const presentes = [...new Set(Object.values(p.cases))];
  return (
    <div>
      <Titre texte={p.titre} reponse={p.role === "reponse"} />
      <div role="img" aria-label={`${p.titre}, grille de ${p.taille} cases sur ${p.taille}`}
        className="inline-grid gap-px bg-slate-200 border border-slate-200 rounded"
        style={{ gridTemplateColumns: `repeat(${p.taille}, 22px)` }}>
        {Array.from({ length: p.taille * p.taille }, (_, i) => {
          const type = p.cases[`${i % p.taille},${Math.floor(i / p.taille)}`];
          const c = type ? CASE[type] : null;
          return (
            <div key={i} className="w-[22px] h-[22px] flex items-center justify-center text-[12px] font-black leading-none"
              style={{ background: c?.fond ?? "#FFFFFF", color: "#FFFFFF" }}>
              {type === "depart" ? FLECHE[p.direction ?? "E"] ?? "→" : c?.signe}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] font-bold text-slate-500">
        {presentes.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm border border-slate-200 text-[8px] leading-3 text-center" style={{ background: CASE[t].fond }}>
              {t === "depart" ? "" : CASE[t].signe}
            </span>
            {CASE[t].nom}{t === "depart" ? ` (regarde ${FLECHE[p.direction ?? "E"] ?? "→"})` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function PartieVue({ p, onReprendre, eleve, avecEleve }: {
  p: Partie;
  onReprendre?: (texte: string) => void;
  /** Le choix de l'enfant à cette question, s'il l'a donné. */
  eleve?: number;
  /** Les choix de l'enfant sont connus : une question sans choix n'a pas encore reçu de réponse. */
  avecEleve: boolean;
}) {
  const reponse = "role" in p && p.role === "reponse";
  switch (p.genre) {
    case "texte":
      return (
        <div className={reponse ? "rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2" : ""}>
          {p.titre && <Titre texte={p.titre} reponse={reponse} />}
          <p className="text-xs whitespace-pre-wrap leading-relaxed text-slate-700">{p.texte}</p>
        </div>
      );
    case "liste": {
      const Liste = p.ordonnee ? "ol" : "ul";
      return (
        <div className={reponse ? "rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2" : ""}>
          <Titre texte={p.titre} reponse={reponse} />
          <Liste className={`text-xs leading-relaxed text-slate-700 space-y-0.5 pl-5 ${p.ordonnee ? "list-decimal" : "list-disc"}`}>
            {p.lignes.map((l, i) => <li key={i} className="whitespace-pre-wrap">{l}</li>)}
          </Liste>
        </div>
      );
    }
    case "code":
      return (
        <div>
          <Titre texte={p.titre} reponse={reponse} />
          <pre className={`text-xs whitespace-pre-wrap leading-relaxed font-mono rounded-lg p-3 ${
            reponse ? "bg-emerald-950 text-emerald-200" : "bg-slate-900 text-amber-300"}`}>{p.code}</pre>
        </div>
      );
    case "grille":
      return <Grille p={p} />;
    case "question":
      return (
        <div>
          <p className="text-xs font-bold text-slate-800 whitespace-pre-wrap">{p.question}</p>
          <ul className="mt-1 space-y-0.5">
            {p.choix.map((c, i) => {
              const bonne = i === p.bonne, choisie = i === eleve;
              return (
                <li key={i} className={`text-xs px-2 py-0.5 rounded ${
                  bonne ? "bg-emerald-50 text-emerald-800 font-black" : choisie ? "bg-red-50 text-red-800 font-black" : "text-slate-500"}`}>
                  {bonne ? "✅" : choisie ? "❌" : "▫️"} {c}
                  {choisie && <span className="font-bold text-slate-500"> · 👦 sa réponse</span>}
                </li>
              );
            })}
          </ul>
          {avecEleve && eleve === undefined && <p className="text-[11px] font-bold text-slate-400 mt-0.5">👦 pas encore de réponse</p>}
          {p.explication && (
            <div className="mt-1">
              <p className="text-xs italic text-slate-600">💡 {p.explication}</p>
              <Reprendre texte={p.explication} onReprendre={onReprendre} />
            </div>
          )}
        </div>
      );
    case "explication":
      return (
        <div>
          <p className="text-xs italic text-slate-600">💡 {p.pour ? <strong className="not-italic">{p.pour} : </strong> : null}{p.texte}</p>
          <Reprendre texte={p.texte} onReprendre={onReprendre} />
        </div>
      );
  }
}

export default function FicheExercice({ fiche, onReprendre, reponsesEleve }: {
  fiche: Fiche;
  onReprendre?: (texte: string) => void;
  /** Les choix de l'enfant, par rang de question dans `fiche.parties` (voir reponses-eleve.ts). */
  reponsesEleve?: Record<number, number> | null;
}) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{fiche.nom}</div>
      {fiche.note && <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{fiche.note}</p>}
      {fiche.parties.map((p, i) => (
        <PartieVue key={i} p={p} onReprendre={onReprendre} eleve={reponsesEleve?.[i]} avecEleve={!!reponsesEleve} />
      ))}
    </div>
  );
}
