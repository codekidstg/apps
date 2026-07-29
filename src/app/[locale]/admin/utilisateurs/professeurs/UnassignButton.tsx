"use client";

import { useTransition } from "react";
import { assignTeacherToStudent } from "../actions";

export default function UnassignButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`Désassigner ${studentName} de ce professeur ?`)) return;
        startTransition(async () => {
          await assignTeacherToStudent(studentId, null);
        });
      }}
      className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
    >
      {pending ? "…" : "✕ Désassigner"}
    </button>
  );
}
