"use client";

import { useEffect, useState } from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function OfflineBanner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { online, syncing, syncedCount } = useOfflineSync();

  if (!mounted) return null;

  if (online && !syncing && syncedCount === 0) return null;

  if (!online) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-900 border border-amber-600 text-amber-200 text-sm font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
        <span>📡</span>
        <span>Mode hors-ligne — tes réponses seront synchronisées à la reconnexion</span>
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 text-slate-300 text-sm font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
        <span className="animate-spin">⟳</span>
        <span>Synchronisation en cours…</span>
      </div>
    );
  }

  if (syncedCount > 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 border border-emerald-600 text-emerald-200 text-sm font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
        <span>✅</span>
        <span>{syncedCount} action{syncedCount > 1 ? "s" : ""} synchronisée{syncedCount > 1 ? "s" : ""} !</span>
      </div>
    );
  }

  return null;
}
