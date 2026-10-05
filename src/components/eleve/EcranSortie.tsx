"use client";

/**
 * Où s'affiche ce que le programme écrit.
 *
 * Une console, c'est un objet d'adulte. Un téléphone, c'est le monde de
 * l'enfant — et c'est ce qu'il montrera à son parent le samedi. Le cadre ne
 * change rien à ce qui tourne : il habille la sortie, rien d'autre. Les
 * erreurs et les questions du programme restent en clair, en dessous, là où
 * elles se lisent.
 *
 * Le téléphone fait 272 px de large : il tient même sur l'écran le plus
 * étroit, sans habillage à part pour le mobile.
 */

export type Appareil = "telephone" | "ordinateur" | "console";

export const APPAREILS: { id: Appareil; emoji: string; nom: string }[] = [
  { id: "telephone",  emoji: "📱", nom: "Téléphone" },
  { id: "ordinateur", emoji: "💻", nom: "Ordinateur" },
  { id: "console",    emoji: "⌨️", nom: "Console" },
];

const VIDE = "Lance ton programme pour voir ce qu'il affiche.";

export default function EcranSortie({ appareil, sortie, titre, attente }: {
  appareil: Appareil;
  sortie: string;
  /** Le nom qui s'affiche en haut de l'écran — celui de l'enfant, ou du programme. */
  titre?: string;
  /**
   * Ce que dit l'écran quand il n'a encore rien à montrer. Par défaut il
   * invite à lancer — mais pendant que le programme tourne, cette phrase est
   * fausse, et c'est elle qui fait croire que rien ne se passe.
   */
  attente?: string;
}) {
  const texte = sortie.trim();
  const rienAMontrer = attente ?? VIDE;

  if (appareil === "console") {
    return (
      <div className="rounded-xl border font-mono text-sm p-4 whitespace-pre-wrap"
        style={{ background: "#0f172a", borderColor: "#334155", color: "#e2e8f0" }}>
        {texte || <span style={{ color: "#64748b" }}>{rienAMontrer}</span>}
      </div>
    );
  }

  if (appareil === "ordinateur") {
    return (
      <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: "1px solid #334155" }}>
        {/* La barre de fenêtre, avec ses trois pastilles. */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: "#1e293b" }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
          <span className="text-[11px] font-bold ml-2 truncate" style={{ color: "#94a3b8" }}>
            {titre || "mon_programme.py"}
          </span>
        </div>
        <pre className="font-mono text-sm p-4 whitespace-pre-wrap min-h-[160px]"
          style={{ background: "#0b1220", color: "#e2e8f0" }}>
          {texte || <span style={{ color: "#64748b" }}>{rienAMontrer}</span>}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="rounded-[2rem] p-2 shadow-2xl" style={{ background: "#0b1220", border: "3px solid #334155", width: 272 }}>
        <div className="rounded-[1.6rem] overflow-hidden" style={{ background: "#f8fafc", height: 420, display: "flex", flexDirection: "column" }}>
          {/* La barre du haut et l'encoche — le même téléphone que le jalon. */}
          <div className="relative flex items-center justify-between px-4 pt-2 pb-1 text-[10px] font-bold" style={{ color: "#64748b" }}>
            <span>9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-1 rounded-b-xl" style={{ width: 70, height: 14, background: "#0b1220" }} />
            <span>▮▮▮</span>
          </div>

          <div className="px-4 py-2.5" style={{ background: "#1B2D5E" }}>
            <div className="text-white font-black text-sm truncate">{titre || "Mon programme"}</div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {texte ? (
              <pre className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#0f172a" }}>{texte}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs" style={{ color: "#94a3b8" }}>
                {rienAMontrer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Le choix de l'appareil, en trois pastilles. */
export function ChoixAppareil({ appareil, onChange }: { appareil: Appareil; onChange: (a: Appareil) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {APPAREILS.map((a) => (
        <button key={a.id} type="button" onClick={() => onChange(a.id)}
          className="text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors"
          style={a.id === appareil
            ? { background: "#1e293b", border: "1px solid #10b981", color: "#6ee7b7" }
            : { background: "transparent", border: "1px solid #334155", color: "#64748b" }}>
          {a.emoji} {a.nom}
        </button>
      ))}
    </div>
  );
}
