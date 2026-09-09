"use client";
import { useState } from "react";

/**
 * « Surligne le motif » — l'enfant délimite le morceau qui se répète.
 *
 * C'est le geste central de la séance 6 : dans un programme long, trouver le
 * plus petit segment qui revient à l'identique, et voir ce qui reste en dehors.
 * Aucun jeu existant ne le fait — on ne pouvait que poser des questions *sur*
 * le geste (« quelle est la longueur du motif ? »), jamais le faire exécuter.
 *
 * Le thème suivant, « Je compose de la musique avec des boucles », est bâti
 * entièrement sur la reconnaissance de motifs : ce jeu y servira aussi.
 *
 * L'enfant clique la première instruction du motif, puis la dernière. Le jeu
 * colore alors les répétitions suivantes, et laisse en gris ce qui déborde.
 */

export type PatternSelectConfig = {
  title?: string;
  description?: string;
  /** Le programme, une instruction par ligne. */
  instructions: string[];
  /** Index de la première et de la dernière instruction du motif (0-based). */
  motif_start: number;
  motif_end: number;
  /** Nombre de répétitions attendues — sert au message de réussite. */
  repetitions: number;
  explanation?: string;
};

export default function PatternSelect({
  config, done, onSolved, savedState, onStateChange,
}: {
  blockId?: string;
  config: PatternSelectConfig;
  done: boolean;
  onSolved: () => void;
  savedState?: [number, number] | null;
  onStateChange?: (s: [number, number]) => void;
}) {
  const { instructions, motif_start, motif_end, repetitions } = config;
  const taille = motif_end - motif_start + 1;

  const [debut, setDebut] = useState<number | null>(savedState?.[0] ?? null);
  const [fin, setFin]     = useState<number | null>(savedState?.[1] ?? null);
  const [verdict, setVerdict] = useState<"idle" | "juste" | "faux">(done ? "juste" : "idle");

  /** Un clic pose le début, le suivant la fin ; un troisième recommence. */
  function cliquer(i: number) {
    if (verdict === "juste") return;
    if (debut === null || fin !== null) { setDebut(i); setFin(null); setVerdict("idle"); return; }
    if (i < debut) { setDebut(i); return; }

    setFin(i);
    onStateChange?.([debut, i]);
    const bon = debut === motif_start && i === motif_end;
    setVerdict(bon ? "juste" : "faux");
    if (bon && !done) onSolved();
  }

  /** Une fois le motif juste, on colore toutes ses répétitions. */
  function couleurDe(i: number): { fond: string; bordure: string; texte: string } {
    const gris = { fond: "#0f172a", bordure: "#1e293b", texte: "#94a3b8" };
    if (verdict === "juste") {
      const dansLeMotif = i >= motif_start && i < motif_start + taille * repetitions;
      if (!dansLeMotif) return gris;
      // Une couleur par répétition : l'enfant voit le motif se répéter.
      const tour = Math.floor((i - motif_start) / taille);
      const teintes = ["#10b981", "#3b82f6", "#a78bfa", "#f97316", "#ec4899", "#14b8a6"];
      const c = teintes[tour % teintes.length];
      return { fond: `${c}18`, bordure: `${c}60`, texte: "#e2e8f0" };
    }
    if (debut !== null && fin !== null && i >= debut && i <= fin)
      return { fond: "#7f1d1d30", bordure: "#ef444460", texte: "#fca5a5" };
    if (debut !== null && fin === null && i === debut)
      return { fond: "#FDB81320", bordure: "#FDB81360", texte: "#FDB813" };
    return gris;
  }

  const consigne =
    verdict === "juste" ? "✅ C'est bien le motif !"
    : debut === null ? "Clique sur la PREMIÈRE instruction du motif."
    : fin === null ? "Maintenant clique sur la DERNIÈRE instruction du motif."
    : "Ce n'est pas le bon motif — reclique sur la première instruction pour recommencer.";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: verdict === "juste" ? "#052e16" : "#1a1035" }}>
        <span className="text-2xl">🔁</span>
        <div className="flex-1">
          <div className="font-black text-white">{config.title ?? "Surligne le motif"}</div>
          {config.description && <div className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>{config.description}</div>}
        </div>
        {verdict === "juste" && (
          <span className="text-xs font-black px-3 py-1 rounded-full"
            style={{ background: "#052e16", color: "#10b981", border: "1px solid #10b98140" }}>✅ Trouvé !</span>
        )}
      </div>

      <div className="p-5 space-y-3" style={{ background: "#1e293b" }}>
        <div className="text-sm font-bold" style={{ color: verdict === "faux" ? "#fca5a5" : "#94a3b8" }}>
          {consigne}
        </div>

        <div className="space-y-1.5 font-mono text-sm">
          {instructions.map((inst, i) => {
            const c = couleurDe(i);
            return (
              <button
                key={i}
                onClick={() => cliquer(i)}
                disabled={verdict === "juste"}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all disabled:cursor-default"
                style={{ background: c.fond, border: `1px solid ${c.bordure}`, color: c.texte }}
              >
                <span className="text-xs font-black w-5 shrink-0" style={{ color: "#475569" }}>{i + 1}</span>
                <span className="flex-1 whitespace-pre overflow-x-auto">{inst}</span>
              </button>
            );
          })}
        </div>

        {verdict === "juste" && (
          <div className="rounded-xl px-4 py-3 text-sm space-y-1"
            style={{ background: "#052e16", borderLeft: "4px solid #10b981", color: "#6ee7b7" }}>
            <div>
              Le motif fait <strong>{taille} instruction{taille > 1 ? "s" : ""}</strong> et se répète{" "}
              <strong>{repetitions} fois</strong>
              {motif_start + taille * repetitions < instructions.length && (() => {
                const reste = instructions.length - (motif_start + taille * repetitions);
                return <> — {reste > 1 ? `les ${reste} dernières lignes restent` : "la dernière ligne reste"} en dehors de la boucle.</>;
              })()}
            </div>
            {config.explanation && <div style={{ color: "#a7f3d0" }}>{config.explanation}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
