"use client";
import { useState } from "react";

/**
 * « Le Grand Plan » — l'enfant écrit son plan AVANT d'ouvrir l'atelier.
 *
 * La séance 7 enseigne le pseudocode et le « divide and conquer » dans deux
 * blocs de texte, puis vérifie la leçon par un QCM. L'enfant n'a donc jamais à
 * planifier quoi que ce soit : il arrive directement sur les blocs.
 *
 * Ici il compose son plan en phases, dans l'ordre, avant que Blockly ne
 * s'ouvre. C'est l'objectif de la leçon transformé en geste — et c'est aussi
 * ce que son parent lira sur la page de réalisation : des phrases en français,
 * écrites par son enfant, à côté du programme que c'est devenu.
 *
 * Les cartes en trop ne sont pas du décor : sans elles, remettre trois phases
 * dans l'ordre se réussit au hasard. L'une d'elles est toujours le raccourci
 * naïf (« aller droit à l'étoile »), celui que le labyrinthe punit.
 */

export type PlanBuilderConfig = {
  title?: string;
  description?: string;
  /** Les phases attendues, dans l'ordre. */
  phases: string[];
  /** Cartes plausibles mais fausses, mélangées aux bonnes. */
  distracteurs?: string[];
  explanation?: string;
};

/** Mélange stable : les cartes ne sautent pas d'une image à l'autre. */
function melangeStable<T>(arr: T[], graine: string): T[] {
  const out = [...arr];
  let h = graine.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  for (let i = out.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function PlanBuilder({
  config, done, onSolved, onEchec, savedState, onStateChange, blockId,
}: {
  blockId?: string;
  config: PlanBuilderConfig;
  done: boolean;
  onSolved: () => void;
  onEchec?: () => void;
  savedState?: string[] | null;
  onStateChange?: (s: string[]) => void;
}) {
  const { phases, distracteurs = [] } = config;
  const banque = melangeStable([...phases, ...distracteurs], blockId ?? phases.join("|"));

  const [choisies, setChoisies] = useState<string[]>(savedState ?? []);
  const [verdict, setVerdict] = useState<"idle" | "juste" | "faux">(done ? "juste" : "idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const fige = verdict === "juste";
  const maj = (s: string[]) => { setChoisies(s); onStateChange?.(s); setErreur(null); setVerdict("idle"); };

  const ajouter = (p: string) => { if (!fige && !choisies.includes(p)) maj([...choisies, p]); };
  const retirer = (i: number) => { if (!fige) maj(choisies.filter((_, k) => k !== i)); };
  const deplacer = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (fige || j < 0 || j >= choisies.length) return;
    const s = [...choisies];
    [s[i], s[j]] = [s[j], s[i]];
    maj(s);
  };

  function verifier() {
    if (choisies.length === 0) return;
    const bon = choisies.length === phases.length && choisies.every((p, i) => p === phases[i]);
    if (bon) {
      setVerdict("juste");
      setErreur(null);
      if (!done) onSolved();
      return;
    }
    setVerdict("faux");
    onEchec?.();
    // On dit ce qui cloche, jamais la bonne réponse.
    const intrus = choisies.filter((p) => !phases.includes(p)).length;
    setErreur(
      intrus > 0
        ? `Il y a ${intrus} étape${intrus > 1 ? "s" : ""} qui ne sert${intrus > 1 ? "ent" : ""} à rien dans ton plan. Relis le labyrinthe.`
        : choisies.length < phases.length
          ? "Ton plan est trop court : il manque au moins une étape."
          : choisies.length > phases.length
            ? "Ton plan a trop d'étapes."
            : "Les bonnes étapes sont là, mais pas dans le bon ordre.",
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: fige ? "#052e16" : "#1a1035" }}>
        <span className="text-2xl">🗺️</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white">{config.title ?? "Écris ton plan"}</div>
          {config.description && <div className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>{config.description}</div>}
        </div>
        {fige && (
          <span className="text-xs font-black px-3 py-1 rounded-full shrink-0"
            style={{ background: "#052e16", color: "#10b981", border: "1px solid #10b98140" }}>✅ Plan validé</span>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4" style={{ background: "#1e293b" }}>
        <div className="text-sm font-bold" style={{ color: verdict === "faux" ? "#fca5a5" : "#94a3b8" }}>
          {fige
            ? "✅ C'est exactement ça. Tu peux ouvrir l'atelier."
            : "Compose ton plan : touche les étapes dans l'ordre où Kirikou doit les faire."}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Les cartes disponibles */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>
              Les étapes possibles
            </div>
            {banque.map((p) => {
              const prise = choisies.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => ajouter(p)}
                  disabled={fige || prise}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-35 disabled:cursor-default"
                  style={{ background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1" }}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Le plan en construction */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>
              Ton plan
            </div>

            {choisies.length === 0 ? (
              <div className="rounded-xl px-4 py-6 text-center text-sm font-bold"
                style={{ background: "#0f172a", border: "1px dashed #334155", color: "#475569" }}>
                Encore vide. Touche une étape à gauche.
              </div>
            ) : (
              <div className="space-y-2">
                {choisies.map((p, i) => (
                  <div key={p} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "#0f172a", border: "1px solid #FDB81340" }}>
                    <span className="text-xs font-black shrink-0" style={{ color: "#FDB813" }}>
                      Phase {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold" style={{ color: "#e2e8f0" }}>{p}</span>
                    {!fige && (
                      <span className="flex gap-1 shrink-0">
                        <button onClick={() => deplacer(i, -1)} aria-label="Monter cette étape" disabled={i === 0}
                          className="w-6 h-6 rounded-lg text-xs font-black disabled:opacity-30"
                          style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>↑</button>
                        <button onClick={() => deplacer(i, 1)} aria-label="Descendre cette étape" disabled={i === choisies.length - 1}
                          className="w-6 h-6 rounded-lg text-xs font-black disabled:opacity-30"
                          style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>↓</button>
                        <button onClick={() => retirer(i)} aria-label="Retirer cette étape"
                          className="w-6 h-6 rounded-lg text-xs font-black"
                          style={{ background: "#1e293b", border: "1px solid #334155", color: "#f87171" }}>×</button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!fige && choisies.length > 0 && (
              <button
                onClick={verifier}
                className="w-full px-4 py-2.5 rounded-xl font-black text-sm transition-transform active:scale-95"
                style={{ background: "#FDB813", color: "#0f172a" }}
              >
                ▶ Vérifier mon plan
              </button>
            )}
          </div>
        </div>

        {erreur && verdict === "faux" && (
          <div className="rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: "#7f1d1d30", borderLeft: "4px solid #ef4444", color: "#fca5a5" }}>
            {erreur}
          </div>
        )}

        {fige && config.explanation && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "#052e16", borderLeft: "4px solid #10b981", color: "#6ee7b7" }}>
            {config.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
