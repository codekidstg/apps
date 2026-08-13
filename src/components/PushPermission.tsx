"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

async function registerPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const subscription = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch("/api/push/subscribe", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(subscription),
  });

  return true;
}

export default function PushPermission() {
  const [state, setState] = useState<"idle" | "asking" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!("Notification" in window)) { setState("unsupported"); return; }
    if (Notification.permission === "granted") { setState("granted"); return; }
    if (Notification.permission === "denied")  { setState("denied");  return; }
  }, []);

  async function handleClick() {
    setState("asking");
    const ok = await registerPush();
    setState(ok ? "granted" : "denied");
  }

  if (state === "granted" || state === "unsupported" || state === "denied") return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-xs bg-slate-800 border border-slate-600 rounded-2xl p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-sm">Activer les notifications</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Recevez les rappels de cours et les alertes de progression de votre enfant.
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleClick}
              disabled={state === "asking"}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black py-2 rounded-xl transition-colors"
            >
              {state === "asking" ? "..." : "Activer"}
            </button>
            <button
              onClick={() => setState("denied")}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
