"use client";

import { useState, useMemo } from "react";

interface Props {
  placeholder?: string;
  /** Appelé à chaque changement de texte — optionnel si on utilise children */
  onSearch?: (q: string) => void;
}

export function AdminSearchInput({ placeholder = "Rechercher…", onSearch }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
      <input
        type="search"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
        className="pl-9 pr-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 w-64 placeholder:text-gray-400 transition-all"
      />
    </div>
  );
}

/** Wrapper générique : filtre une liste côté client selon une fonction de matching */
export function SearchableSection<T>({
  items,
  placeholder,
  match,
  renderList,
  emptyLabel = "Aucun résultat.",
}: {
  items: T[];
  placeholder?: string;
  match: (item: T, q: string) => boolean;
  renderList: (filtered: T[]) => React.ReactNode;
  emptyLabel?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lower = q.toLowerCase();
    return items.filter((item) => match(item, lower));
  }, [q, items, match]);

  return (
    <div className="space-y-4">
      <AdminSearchInput placeholder={placeholder} onSearch={setQ} />
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-10 text-center text-sm text-gray-400 font-bold">
          {emptyLabel}
        </div>
      ) : (
        renderList(filtered)
      )}
      {q.trim() && (
        <div className="text-xs text-gray-400 font-medium">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} pour « {q} »
        </div>
      )}
    </div>
  );
}
