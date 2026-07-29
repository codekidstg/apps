"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getPendingActions, deleteAction } from "@/lib/offlineQueue";

export function useOnlineStatus() {
  // Start true to match SSR, correct after mount to avoid hydration mismatch
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

// Rejoue la queue IndexedDB au retour de connexion
// Merge optimiste : le serveur applique MAX(score) — jamais de régression
export function useOfflineSync() {
  const online = useOnlineStatus();
  const [syncing, setSyncing]     = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const didMount = useRef(false);

  const sync = useCallback(async () => {
    const pending = await getPendingActions();
    if (!pending.length) return;
    setSyncing(true);

    let synced = 0;
    for (const action of pending) {
      try {
        let res: Response;
        if (action.type === "completeLesson") {
          res = await fetch("/api/sync/complete-lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId: action.lessonId,
              score: action.score,
              perfect: action.perfect,
            }),
          });
        } else {
          res = await fetch("/api/sync/solve-blockly", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId: action.lessonId }),
          });
        }
        if (res.ok) { await deleteAction(action.id); synced++; }
      } catch {
        break; // réseau encore instable — réessayer au prochain online
      }
    }

    setSyncedCount((p) => p + synced);
    setSyncing(false);
  }, []);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (online) sync();
  }, [online, sync]);

  return { online, syncing, syncedCount };
}
