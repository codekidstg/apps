"use client";
import { useEffect, useState } from "react";
import { xpProgressInLevel } from "@/lib/gamification/levels";

/**
 * Identité de l'élève et progression d'XP.
 *
 * Deux systèmes portaient les mêmes noms sans aucun rapport : le niveau
 * pédagogique de `students.level_num`, fixé par l'administration et qui décide
 * des thèmes accessibles, et le palier d'XP calculé sur des seuils
 * (0 / 500 / 1500). Un élève inscrit en Bâtisseur mais à 130 XP se voyait
 * annoncer « Lv 1 · Explorateur » dans sa propre barre latérale.
 *
 * Le nom affiché est désormais le niveau pédagogique — celui qui dit ce qu'il
 * apprend. L'XP reste une progression, sans prétendre nommer l'élève.
 */
const NIVEAU: Record<number, { nom: string; icone: string }> = {
  1: { nom: "Explorateur", icone: "🌱" },
  2: { nom: "Bâtisseur",   icone: "🏗️" },
  3: { nom: "Architecte",  icone: "🏛️" },
};

export default function XPBar({ xp, niveauNum = 1 }: { xp: number; niveauNum?: number }) {
  const niveau = NIVEAU[niveauNum] ?? NIVEAU[1];
  const prog   = xpProgressInLevel(xp);
  const [pct, setPct] = useState(0);

  useEffect(() => { setTimeout(() => setPct(prog.pct), 80); }, [xp, prog.pct]);

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-black" style={{ color: "#FDB813" }}>
          {niveau.icone} {niveau.nom}
        </span>
        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{xp} XP</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: "#FDB813" }}
        />
      </div>
      <div className="text-right text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
        {prog.current}/{prog.needed} XP
      </div>
    </div>
  );
}
