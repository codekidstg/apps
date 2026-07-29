"use client";

import { useTransition } from "react";
import { unlinkParentFromStudent } from "../actions";

export default function UnlinkButton({ parentId, studentId }: { parentId: string; studentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Dissocier cet enfant du parent ?")) return;
        startTransition(async () => {
          await unlinkParentFromStudent(parentId, studentId);
        });
      }}
      className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
    >
      {pending ? "…" : "✕ Dissocier"}
    </button>
  );
}
