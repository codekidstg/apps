"use client";
import { useEffect, useState } from "react";
import { BADGES, type BadgeId } from "@/lib/gamification/badges";

type ToastItem = { id: string; badge: BadgeId; xp: number };

let toastQueue: ToastItem[] = [];
let listeners: (() => void)[] = [];

export function showBadgeToast(badge: BadgeId, xp: number) {
  toastQueue = [...toastQueue, { id: `${badge}-${Date.now()}`, badge, xp }];
  listeners.forEach((l) => l());
}

export function showXpToast(xp: number) {
  showBadgeToast("first_step" as BadgeId, xp); // reuse mechanism for XP-only toast
}

export default function BadgeToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = () => { setToasts([...toastQueue]); };
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, []);

  const dismiss = (id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    setToasts([...toastQueue]);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const badge = BADGES[t.badge];
        return (
          <div
            key={t.id}
            className="pointer-events-auto bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4 animate-slide-in"
            style={{ borderLeft: `4px solid ${badge.color}` }}
            onClick={() => dismiss(t.id)}
          >
            <div className="text-3xl">{badge.icon}</div>
            <div>
              <div className="font-black text-white text-sm">{badge.name}</div>
              <div className="text-xs text-slate-400">{badge.description}</div>
              <div className="text-xs font-bold mt-1" style={{ color: badge.color }}>+{t.xp} XP bonus !</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
