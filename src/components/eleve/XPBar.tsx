"use client";
import { useEffect, useState } from "react";
import { getLevelForXp, xpProgressInLevel } from "@/lib/gamification/levels";

export default function XPBar({ xp }: { xp: number }) {
  const level  = getLevelForXp(xp);
  const prog   = xpProgressInLevel(xp);
  const [pct, setPct] = useState(0);

  useEffect(() => { setTimeout(() => setPct(prog.pct), 80); }, [xp, prog.pct]);

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-black" style={{ color: "#FDB813" }}>
          {level.icon} Lv {level.num} · {level.name}
        </span>
        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{xp} XP</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: "#FDB813" }}
        />
      </div>
      <div className="text-right text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{prog.current}/{prog.needed}</div>
    </div>
  );
}
