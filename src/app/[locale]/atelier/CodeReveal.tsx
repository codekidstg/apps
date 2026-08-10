"use client";
import { useEffect, useState } from "react";
import type { Rule } from "./AtelierGame";

function ruleToCode(rule: Rule, playerName: string): string[] {
  switch (rule.condition) {
    case "collision":
      return [
        `// Règle définie par ${playerName}`,
        `if (collision(vaisseau, asteroide)) {`,
        `    vies = vies - 1;`,
        `    afficherExplosion();`,
        `}`,
      ];
    case "score_boost":
      return [
        `// Règle définie par ${playerName}`,
        `if (score > ${rule.value ?? 50}) {`,
        `    vitesse = vitesse * 1.5;`,
        `    afficherMessage("Plus vite !");`,
        `}`,
      ];
    case "no_lives":
      return [
        `// Règle définie par ${playerName}`,
        `if (vies === 0) {`,
        `    afficherGameOver();`,
        `    arreterLeJeu();`,
        `}`,
      ];
    case "loop":
      return [
        `// Règle définie par ${playerName}`,
        `while (vies > 0) {`,
        `    deplacerVaisseau();`,
        `    detecterCollisions();`,
        `    afficherScore();`,
        `}`,
      ];
    default:
      return [];
  }
}

type Props = {
  rules: Rule[];
  playerName: string;
  onDone?: () => void;
};

export default function CodeReveal({ rules, playerName, onDone }: Props) {
  const allLines: { code: string; ruleId: string }[] = [];
  rules.forEach(rule => {
    const lines = ruleToCode(rule, playerName || "Développeur");
    lines.forEach(line => allLines.push({ code: line, ruleId: rule.id }));
    allLines.push({ code: "", ruleId: rule.id }); // ligne vide entre blocs
  });

  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= allLines.length) { onDone?.(); return; }
    const t = setTimeout(() => setRevealed(r => r + 1), 80);
    return () => clearTimeout(t);
  }, [revealed, allLines.length, onDone]);

  const COLORS: Record<string, string> = {
    collision:   "text-red-400",
    score_boost: "text-yellow-400",
    no_lives:    "text-purple-400",
    loop:        "text-blue-400",
  };

  function colorLine(line: string, ruleId: string) {
    if (line.startsWith("//"))  return "text-slate-500 italic";
    if (line.startsWith("if ") || line.startsWith("while ")) return COLORS[ruleId] ?? "text-orange-400";
    if (line.startsWith("}"))   return "text-slate-400";
    return "text-emerald-400";
  }

  return (
    <div className="bg-[#0d1117] border border-slate-700 rounded-2xl overflow-hidden font-mono text-sm">
      {/* Barre de titre style éditeur */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-400 font-sans">
          mon_jeu_{(playerName || "joueur").toLowerCase().replace(/\s+/g, "_")}.js
        </span>
        <span className="ml-auto text-xs text-emerald-500 animate-pulse font-sans">● En cours d'écriture…</span>
      </div>

      {/* Header fichier */}
      <div className="px-5 pt-4 pb-2 text-slate-500 text-xs">
        <div>{"/**"}</div>
        <div>{` * Jeu créé par ${playerName || "Développeur"}`}</div>
        <div>{` * CodeKids Atelier — ${new Date().toLocaleDateString("fr-FR")}`}</div>
        <div>{" * Algorithme écrit par l'enfant, traduit en JavaScript"}</div>
        <div>{"*/"}</div>
        <div className="mt-2" />
      </div>

      {/* Lignes révélées */}
      <div className="px-5 pb-5 space-y-0.5">
        {allLines.slice(0, revealed).map((item, i) => (
          <div key={i} className="flex gap-4 leading-6">
            <span className="text-slate-600 w-5 text-right shrink-0 select-none">{item.code ? i + 1 : ""}</span>
            <span className={`${colorLine(item.code, item.ruleId)} whitespace-pre`}>
              {item.code}
              {i === revealed - 1 && (
                <span className="inline-block w-2 h-4 bg-white/70 ml-0.5 animate-pulse align-middle" />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
