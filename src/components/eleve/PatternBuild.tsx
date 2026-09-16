"use client";
import { useState } from "react";

/**
 * « Construis la boucle » — l'enfant transforme un programme déroulé en boucle.
 *
 * `PatternSelect` fait délimiter le motif, et c'est déjà bien : mais il s'arrête
 * là. Il annonce lui-même « se répète N fois » dans sa correction, si bien que
 * le deuxième objectif de la séance 6 — « compter les répétitions pour régler le
 * nombre de la boucle » — n'était exercé nulle part. Les labyrinthes eux-mêmes
 * donnaient le compte dans leur consigne.
 *
 * Ici l'enfant fait les trois gestes du métier, dans l'ordre :
 *   1. il délimite le motif (les deux clics qu'il connaît déjà) ;
 *   2. il règle N lui-même ;
 *   3. le jeu redéroule sa boucle et la compare, ligne à ligne, au programme
 *      d'origine — et ce qui n'est pas couvert tombe naturellement « en dehors ».
 *
 * La réussite n'est pas « tu as retrouvé les index de l'auteur » mais « ta
 * boucle redonne exactement le programme de départ », avec au moins deux tours.
 * Toute factorisation réellement correcte est donc acceptée : un enfant qui a
 * raison n'est jamais recalé par une coquille du contenu.
 */

export type PatternBuildConfig = {
  title?: string;
  description?: string;
  /** Le programme déroulé, une instruction par ligne. */
  instructions: string[];
  /** Index attendus du motif — servent à la correction écrite, pas au verdict. */
  motif_start?: number;
  motif_end?: number;
  /** Accepté pour que le même contenu puisse alimenter PatternSelect. Inutilisé. */
  repetitions?: number;
  explanation?: string;
};

type Etat = [number, number, number];

export default function PatternBuild({
  config, done, onSolved, onEchec, savedState, onStateChange,
}: {
  blockId?: string;
  config: PatternBuildConfig;
  done: boolean;
  onSolved: () => void;
  onEchec?: () => void;
  savedState?: Etat | null;
  onStateChange?: (s: Etat) => void;
}) {
  const { instructions } = config;

  const [debut, setDebut] = useState<number | null>(savedState?.[0] ?? null);
  const [fin,   setFin]   = useState<number | null>(savedState?.[1] ?? null);
  const [n,     setN]     = useState<number>(savedState?.[2] ?? 2);
  const [verdict, setVerdict] = useState<"idle" | "juste" | "faux">(done ? "juste" : "idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const motifPret = debut !== null && fin !== null;
  const taille = motifPret ? fin! - debut! + 1 : 0;

  /** Le programme que produit la boucle de l'enfant, déroulé à plat. */
  function reconstruire(d: number, f: number, nb: number): string[] {
    const motif = instructions.slice(d, f + 1);
    const couvert = d + motif.length * nb;
    return [
      ...instructions.slice(0, d),
      ...Array.from({ length: nb }, () => motif).flat(),
      ...instructions.slice(couvert),
    ];
  }

  /** Un clic pose le début, le suivant la fin ; un troisième recommence. */
  function cliquer(i: number) {
    if (verdict === "juste") return;
    setErreur(null);
    if (debut === null || fin !== null) { setDebut(i); setFin(null); setVerdict("idle"); return; }
    if (i < debut) { setDebut(i); return; }
    setFin(i);
  }

  function verifier() {
    if (!motifPret) return;
    const d = debut!, f = fin!;

    if (n < 2) {
      setErreur("Une boucle qui ne tourne qu'une fois ne sert à rien. Combien de fois ce morceau revient-il ?");
      setVerdict("faux"); onEchec?.(); return;
    }

    const rec = reconstruire(d, f, n);
    onStateChange?.([d, f, n]);

    if (rec.length > instructions.length) {
      setErreur(`Ta boucle écrit ${rec.length} instructions, le programme n'en a que ${instructions.length}. Elle tourne trop de fois.`);
      setVerdict("faux"); onEchec?.(); return;
    }

    const i = rec.findIndex((ligne, k) => ligne !== instructions[k]);
    if (i !== -1) {
      setErreur(`Ligne ${i + 1} : ta boucle écrit « ${rec[i]} », mais le programme dit « ${instructions[i]} ».`);
      setVerdict("faux"); onEchec?.(); return;
    }

    /**
     * Sous-compter est l'erreur que la séance vise, et elle passait ici sans
     * être vue : ce qui dépasse la boucle est repris du programme d'origine, si
     * bien que « Répéter 2 fois » sur un motif qui en fait trois se reconstruit
     * quand même à l'identique. Le reste ne doit donc jamais recommencer par une
     * copie complète du motif — sinon il restait des tours à compter.
     */
    const motifChoisi = instructions.slice(d, f + 1);
    const couvert = d + motifChoisi.length * n;
    const suite = instructions.slice(couvert, couvert + motifChoisi.length);
    if (suite.length === motifChoisi.length && suite.every((l, k) => l === motifChoisi[k])) {
      setErreur("Ta boucle s'arrête trop tôt : le même morceau revient encore juste après elle. Compte encore.");
      setVerdict("faux"); onEchec?.(); return;
    }

    setErreur(null);
    setVerdict("juste");
    if (!done) onSolved();
  }

  function recommencer() {
    setDebut(null); setFin(null); setN(2); setVerdict("idle"); setErreur(null);
  }

  /** Couleur d'une ligne du programme d'origine. */
  function couleurDe(i: number): { fond: string; bordure: string; texte: string } {
    const gris = { fond: "#0f172a", bordure: "#1e293b", texte: "#94a3b8" };
    if (!motifPret) {
      if (debut !== null && i === debut)
        return { fond: "#FDB81320", bordure: "#FDB81360", texte: "#FDB813" };
      return gris;
    }
    const couvert = debut! + taille * (verdict === "juste" ? n : 1);
    const dansLaBoucle = i >= debut! && i < couvert;
    if (!dansLaBoucle) return gris;
    const tour = Math.floor((i - debut!) / taille);
    const teintes = ["#10b981", "#3b82f6", "#a78bfa", "#f97316", "#ec4899", "#14b8a6"];
    const c = teintes[tour % teintes.length];
    return { fond: `${c}18`, bordure: `${c}60`, texte: "#e2e8f0" };
  }

  const consigne =
    verdict === "juste" ? "✅ Ta boucle redonne exactement le programme de départ."
    : debut === null ? "1️⃣ Clique sur la PREMIÈRE instruction du morceau qui revient."
    : fin === null ? "2️⃣ Maintenant clique sur la DERNIÈRE instruction de ce morceau."
    : "3️⃣ Règle le nombre de tours, puis vérifie.";

  const motif = motifPret ? instructions.slice(debut!, fin! + 1) : [];
  const couvert = motifPret ? debut! + taille * n : 0;
  const avant = motifPret ? instructions.slice(0, debut!) : [];
  const dehors = motifPret && couvert < instructions.length ? instructions.slice(couvert) : [];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: verdict === "juste" ? "#052e16" : "#1a1035" }}>
        <span className="text-2xl">🔁</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white">{config.title ?? "Construis la boucle"}</div>
          {config.description && <div className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>{config.description}</div>}
        </div>
        {verdict === "juste" && (
          <span className="text-xs font-black px-3 py-1 rounded-full shrink-0"
            style={{ background: "#052e16", color: "#10b981", border: "1px solid #10b98140" }}>✅ Construite !</span>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4" style={{ background: "#1e293b" }}>
        <div className="text-sm font-bold" style={{ color: verdict === "faux" ? "#fca5a5" : "#94a3b8" }}>
          {consigne}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Le programme déroulé */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>
              Le programme déroulé
            </div>
            <div className="space-y-1 font-mono text-sm">
              {instructions.map((inst, i) => {
                const c = couleurDe(i);
                return (
                  <button
                    key={i}
                    onClick={() => cliquer(i)}
                    disabled={verdict === "juste"}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all disabled:cursor-default"
                    style={{ background: c.fond, border: `1px solid ${c.bordure}`, color: c.texte }}
                  >
                    <span className="text-xs font-black w-5 shrink-0" style={{ color: "#475569" }}>{i + 1}</span>
                    <span className="flex-1 whitespace-pre overflow-x-auto">{inst}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* La boucle en construction */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="text-[11px] font-black uppercase tracking-wider" style={{ color: "#475569" }}>
              Ta boucle
            </div>

            {!motifPret ? (
              <div className="rounded-xl px-4 py-6 text-center text-sm font-bold"
                style={{ background: "#0f172a", border: "1px dashed #334155", color: "#475569" }}>
                Choisis d&apos;abord le morceau qui revient.
              </div>
            ) : (
              <div className="rounded-xl p-3 font-mono text-sm space-y-1"
                style={{ background: "#0f172a", border: "1px solid #334155" }}>
                {avant.map((l, i) => (
                  <div key={`av-${i}`} style={{ color: "#94a3b8" }}>{l}</div>
                ))}

                <div className="flex items-center gap-2 flex-wrap py-1">
                  <span className="font-black" style={{ color: "#FDB813" }}>🔁 Répéter</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setN((v) => Math.max(1, v - 1)); setErreur(null); setVerdict("idle"); }}
                      disabled={verdict === "juste"}
                      aria-label="Un tour de moins"
                      className="w-7 h-7 rounded-lg font-black text-base leading-none disabled:opacity-40"
                      style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                    >−</button>
                    <span className="w-8 text-center font-black text-base" style={{ color: "#FDB813" }}>{n}</span>
                    <button
                      onClick={() => { setN((v) => Math.min(20, v + 1)); setErreur(null); setVerdict("idle"); }}
                      disabled={verdict === "juste"}
                      aria-label="Un tour de plus"
                      className="w-7 h-7 rounded-lg font-black text-base leading-none disabled:opacity-40"
                      style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
                    >+</button>
                  </div>
                  <span className="font-black" style={{ color: "#FDB813" }}>fois :</span>
                </div>

                {motif.map((l, i) => (
                  <div key={`m-${i}`} className="pl-5" style={{ color: "#6ee7b7" }}>{l}</div>
                ))}

                {dehors.length > 0 && (
                  <div className="pt-1.5 mt-1.5 space-y-1" style={{ borderTop: "1px dashed #334155" }}>
                    {dehors.map((l, i) => (
                      <div key={`d-${i}`} className="flex items-center gap-2">
                        <span style={{ color: "#e2e8f0" }}>{l}</span>
                        <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>← en dehors</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {motifPret && verdict !== "juste" && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={verifier}
                  className="flex-1 px-4 py-2.5 rounded-xl font-black text-sm transition-transform active:scale-95"
                  style={{ background: "#FDB813", color: "#0f172a" }}
                >
                  ▶ Vérifier ma boucle
                </button>
                <button
                  onClick={recommencer}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "#0f172a", border: "1px solid #334155", color: "#94a3b8" }}
                >
                  ↺
                </button>
              </div>
            )}
          </div>
        </div>

        {erreur && verdict === "faux" && (
          <div className="rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: "#7f1d1d30", borderLeft: "4px solid #ef4444", color: "#fca5a5" }}>
            {erreur}
          </div>
        )}

        {verdict === "juste" && (
          <div className="rounded-xl px-4 py-3 text-sm space-y-1"
            style={{ background: "#052e16", borderLeft: "4px solid #10b981", color: "#6ee7b7" }}>
            <div>
              Motif de <strong>{taille} instruction{taille > 1 ? "s" : ""}</strong>, répété <strong>{n} fois</strong>
              {dehors.length > 0 && (
                <> — {dehors.length > 1 ? `les ${dehors.length} dernières lignes restent` : "la dernière ligne reste"} en dehors de la boucle.</>
              )}
              {dehors.length === 0 && <> — tout le programme tient dans la boucle.</>}
            </div>
            {config.explanation && <div style={{ color: "#a7f3d0" }}>{config.explanation}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
