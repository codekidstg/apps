"use client";

import { useState, useEffect } from "react";

export default function ProfSearchBar() {
  const [q, setQ] = useState("");

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-prof-card]");
    const lower = q.toLowerCase().trim();
    cards.forEach((card) => {
      const text = (card.dataset.profText ?? "").toLowerCase();
      card.style.display = !lower || text.includes(lower) ? "" : "none";
    });
    // compteur
    const counter = document.getElementById("prof-count");
    if (counter) {
      const visible = [...cards].filter((c) => c.style.display !== "none").length;
      counter.textContent = lower ? `${visible} résultat${visible > 1 ? "s" : ""}` : "";
    }
  }, [q]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, email, élève…"
          className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 placeholder:text-gray-400 transition-all"
        />
      </div>
      <span id="prof-count" className="text-xs text-gray-400 font-medium" />
    </div>
  );
}
