"use client";
import { useState } from "react";

/**
 * « Deviens l'ordinateur » — un appel se remplace par ce qu'il rend.
 *
 * Écrire le mot `return` est facile. Le saut mental, c'est de comprendre que
 * `total(panier)` ne « fait » pas quelque chose à côté : il **devient 4600**
 * dans l'expression qui l'entoure, et c'est cette valeur qui continue le
 * voyage.
 *
 * Aucune mécanique existante ne montrait ça. La chasse au bug montre une ligne
 * fautive, le texte à trous montre un mot manquant, le quiz demande de
 * reconnaître — mais rien ne montrait une valeur qui circule.
 *
 * Ici l'enfant est l'ordinateur : l'appel le plus intérieur s'allume, il
 * choisit ce qu'il devient, et la ligne se réécrit sous ses yeux. En trois ou
 * quatre pas, le programme se résout jusqu'à sa sortie.
 *
 * Le cas vedette est `None` : quand une fonction oublie son `return`, la bonne
 * pastille est `None` — et l'enfant voit le trou s'en remplir, puis l'étape
 * suivante s'effondrer. L'erreur la plus silencieuse des fonctions devient
 * visible.
 */

export type EtapeOrdinateur = {
  /** Le morceau qui s'allume, tel qu'il apparaît dans la ligne. */
  expression: string;
  /** Les pastilles proposées. L'une d'elles est `valeur`. */
  choix: string[];
  /** Ce que l'appel devient. */
  valeur: string;
  explication?: string;
};

export type DeviensOrdinateurConfig = {
  title?: string;
  description?: string;
  /** Les définitions à lire, affichées au-dessus et jamais réécrites. */
  contexte?: string[];
  /** La ligne qui se transforme, pas à pas. */
  ligne: string;
  etapes: EtapeOrdinateur[];
  /** Ce que le programme affiche au bout du compte. */
  sortie?: string;
  explanation?: string;
};

export default function DeviensOrdinateur({
  config, done, onSolved, onEchec, savedState, onStateChange,
}: {
  blockId?: string;
  config: DeviensOrdinateurConfig;
  done: boolean;
  onSolved: () => void;
  onEchec?: () => void;
  /** Nombre d'étapes déjà franchies. */
  savedState?: number | null;
  onStateChange?: (s: number) => void;
}) {
  const { ligne, etapes } = config;

  const [fait, setFait] = useState<number>(done ? etapes.length : (savedState ?? 0));
  const [erreur, setErreur] = useState<string | null>(null);

  const termine = fait >= etapes.length;
  const etape = termine ? null : etapes[fait];

  /** La ligne après les `n` premières substitutions. */
  function ligneApres(n: number): string {
    let texte = ligne;
    for (let i = 0; i < n; i++) texte = texte.replace(etapes[i].expression, etapes[i].valeur);
    return texte;
  }
  const courante = ligneApres(fait);

  function choisir(valeur: string) {
    if (termine || !etape) return;
    if (valeur !== etape.valeur) {
      setErreur(
        valeur === "None"
          ? "Non — cette fonction rend bien quelque chose. Relis son return."
          : `Non. Relis ce que cette fonction rend, puis regarde ce qu'on lui a donné.`,
      );
      onEchec?.();
      return;
    }
    setErreur(null);
    const suivant = fait + 1;
    setFait(suivant);
    onStateChange?.(suivant);
    if (suivant >= etapes.length && !done) onSolved();
  }

  /** La ligne, avec le morceau du moment mis en évidence. */
  function rendreLigne() {
    if (!etape) return <span style={{ color: "#6ee7b7" }}>{courante}</span>;
    const i = courante.indexOf(etape.expression);
    if (i === -1) return <span style={{ color: "#e2e8f0" }}>{courante}</span>;
    return (
      <>
        <span style={{ color: "#94a3b8" }}>{courante.slice(0, i)}</span>
        <span className="px-1 rounded" style={{ background: "#FDB81330", color: "#FDB813", border: "1px solid #FDB81360" }}>
          {etape.expression}
        </span>
        <span style={{ color: "#94a3b8" }}>{courante.slice(i + etape.expression.length)}</span>
      </>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: termine ? "#052e16" : "#1a1035" }}>
        <span className="text-2xl">🧠</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white">{config.title ?? "Deviens l'ordinateur"}</div>
          {config.description && <div className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>{config.description}</div>}
        </div>
        {termine && (
          <span className="text-xs font-black px-3 py-1 rounded-full shrink-0"
            style={{ background: "#052e16", color: "#10b981", border: "1px solid #10b98140" }}>✅ Résolu</span>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4" style={{ background: "#1e293b" }}>

        {config.contexte?.length ? (
          <div className="rounded-xl px-4 py-3 font-mono text-sm space-y-0.5 overflow-x-auto"
            style={{ background: "#020617", border: "1px solid #334155", color: "#94a3b8" }}>
            {config.contexte.map((l, i) => <div key={i} className="whitespace-pre">{l}</div>)}
          </div>
        ) : null}

        {/* La ligne qui se réécrit — le cœur du jeu. */}
        <div className="rounded-xl px-4 py-4 font-mono text-base overflow-x-auto"
          style={{ background: "#0f172a", border: `1px solid ${termine ? "#10b98140" : "#334155"}` }}>
          <div className="whitespace-pre">{rendreLigne()}</div>
        </div>

        {!termine && etape && (
          <>
            <div className="text-sm font-bold" style={{ color: erreur ? "#fca5a5" : "#94a3b8" }}>
              Que devient <span className="font-mono" style={{ color: "#FDB813" }}>{etape.expression}</span> ?
            </div>
            <div className="flex flex-wrap gap-2">
              {etape.choix.map((c) => (
                <button
                  key={c}
                  onClick={() => choisir(c)}
                  className="px-4 py-2.5 rounded-xl font-mono text-sm font-black transition-transform active:scale-95"
                  style={{ background: "#0f172a", border: "1px solid #475569", color: "#e2e8f0" }}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {erreur && (
          <div className="rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: "#7f1d1d30", borderLeft: "4px solid #ef4444", color: "#fca5a5" }}>
            {erreur}
          </div>
        )}

        {/* L'explication de l'étape qu'on vient de franchir. */}
        {fait > 0 && etapes[fait - 1].explication && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "#0f172a", borderLeft: "4px solid #a78bfa", color: "#c4b5fd" }}>
            {etapes[fait - 1].explication}
          </div>
        )}

        {termine && (
          <div className="rounded-xl px-4 py-3 text-sm space-y-1"
            style={{ background: "#052e16", borderLeft: "4px solid #10b981", color: "#6ee7b7" }}>
            {config.sortie && (
              <div>
                Le programme affiche : <span className="font-mono font-black">{config.sortie}</span>
              </div>
            )}
            {config.explanation && <div style={{ color: "#a7f3d0" }}>{config.explanation}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
