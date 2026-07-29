"use client";

import { useState } from "react";

export function CopyCell({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-ink-muted font-mono truncate max-w-[180px]">{email}</span>
      <button
        onClick={copy}
        className="shrink-0 text-xs px-2 py-0.5 rounded-lg bg-cream hover:bg-cream-border text-ink-muted hover:text-ink transition-colors font-bold"
      >
        {copied ? "✓" : "Copier"}
      </button>
    </div>
  );
}
