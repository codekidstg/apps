"use client";

import { useState } from "react";
import { resetUserPassword } from "./actions";

export function ResetPasswordCell({ userId }: { userId: string }) {
  const [open, setOpen]     = useState(false);
  const [value, setValue]   = useState("");
  const [shown, setShown]   = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  async function handleReset() {
    if (!value) return;
    setLoading(true);
    await resetUserPassword(userId, value);
    setLoading(false);
    setDone(true);
  }

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-ink-muted hover:text-ink font-bold px-2 py-0.5 rounded-lg hover:bg-cream transition-colors"
      >
        🔑 Mot de passe
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="relative flex-1 min-w-0">
        <input
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => { setValue(e.target.value); setDone(false); }}
          placeholder="Nouveau mdp…"
          className="w-full border border-cream-border rounded-lg px-2 py-1 text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-orange bg-white pr-7"
        />
        <button
          onClick={() => setShown((s) => !s)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          title={shown ? "Masquer" : "Afficher"}
        >
          {shown ? "🙈" : "👁️"}
        </button>
      </div>
      {done ? (
        <button
          onClick={copy}
          className="shrink-0 text-xs font-extrabold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      ) : (
        <button
          onClick={handleReset}
          disabled={loading || !value}
          className="shrink-0 text-xs font-extrabold px-2 py-1 rounded-lg bg-cream hover:bg-cream-border text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
        >
          {loading ? "…" : "Reset"}
        </button>
      )}
      <button
        onClick={() => { setOpen(false); setValue(""); setDone(false); }}
        className="shrink-0 text-ink-muted hover:text-ink text-xs"
      >
        ✕
      </button>
    </div>
  );
}
