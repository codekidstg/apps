"use client";

import { useTransition } from "react";
import { deleteTeacherSession } from "./session-actions";

export default function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer cette session ?")) return;
        startTransition(async () => { await deleteTeacherSession(sessionId); });
      }}
      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors disabled:opacity-40"
    >
      {pending ? "…" : "✕"}
    </button>
  );
}
