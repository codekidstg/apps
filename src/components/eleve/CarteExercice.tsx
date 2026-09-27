"use client";

import Link from "next/link";

import type { Exercice } from "@/lib/eleve/paliers";
export type { Exercice };

/** Depuis combien de temps il n'y est pas revenu. */
export function getFreshness(last: string | null, attempts: number) {
  if (attempts === 0) return { icon: "✨", label: "Nouveau", color: "#FDB813", bg: "#FDB81315" };
  if (!last) return { icon: "✅", label: "Fait", color: "#10b981", bg: "#10b98115" };
  const days = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7)  return { icon: "🔥", label: "Chaud",    color: "#f97316", bg: "#f9731615" };
  if (days <= 30) return { icon: "✅", label: "Fait",     color: "#10b981", bg: "#10b98115" };
  return              { icon: "📚", label: "Révision",  color: "#a78bfa", bg: "#a78bfa15" };
}

/**
 * La carte d'un exercice. Celle du Terrain ne montre pas d'XP — il n'en donne
 * pas — mais le nombre de fois où l'enfant y est revenu : c'est ça, sa fierté.
 */
export default function CarteExercice({ t, terrain = false }: { t: Exercice; terrain?: boolean }) {
  const f = getFreshness(t.last_completed_at, t.attempts);
  return (
    <Link href={`/eleve/entrainement/${t.id}`}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:scale-[1.005]"
      style={{ background: "#1e293b", border: `1px solid ${t.attempts > 0 ? "#10b98125" : "#334155"}` }}
    >
      <span className="text-lg shrink-0">{f.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm text-white truncate">{t.title}</div>
        {t.description && (
          <div className="text-[11px] mt-0.5 truncate" style={{ color: "#475569" }}>{t.description}</div>
        )}
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        {terrain
          ? t.attempts > 0 && (
              <div className="text-[10px] font-mono" style={{ color: "#a78bfa" }}>
                {t.attempts === 1 ? "fait une fois" : `refait ${t.attempts} fois`}
              </div>
            )
          : <div className="text-xs font-mono font-black" style={{ color: "#FDB813" }}>+{t.xp_reward} XP</div>}
        {t.best_score != null && (
          <div className="text-[10px] font-mono" style={{ color: "#10b981" }}>⭐ {t.best_score}%</div>
        )}
      </div>
      <span style={{ color: "#334155", fontSize: 12 }}>›</span>
    </Link>
  );
}

