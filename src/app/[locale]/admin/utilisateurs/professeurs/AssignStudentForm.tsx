"use client";

import { useState, useTransition } from "react";
import { assignTeacherToStudent } from "../actions";

type Student = { id: string; display_name: string };

export default function AssignStudentForm({
  teacherId,
  availableStudents,
}: {
  teacherId: string;
  availableStudents: Student[];
}) {
  const [studentId, setStudentId] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;
    startTransition(async () => {
      const res = await assignTeacherToStudent(studentId, teacherId);
      if ("error" in res) { setStatus("error"); setErrorMsg(res.error); return; }
      setStatus("ok");
      setStudentId("");
      setTimeout(() => setStatus("idle"), 2000);
    });
  }

  if (availableStudents.length === 0) {
    return <p className="text-xs text-gray-400 italic">Tous les élèves disponibles ont déjà un professeur.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        required
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
      >
        <option value="">Choisir un élève…</option>
        {availableStudents.map((s) => (
          <option key={s.id} value={s.id}>{s.display_name}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || !studentId}
        className="px-3 py-2 bg-brand-navy text-white text-xs font-black rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-40"
      >
        {pending ? "…" : "＋ Assigner"}
      </button>
      {status === "ok" && <span className="text-xs text-emerald-600 font-bold">✅ Assigné !</span>}
      {status === "error" && <span className="text-xs text-red-500 font-bold">{errorMsg}</span>}
    </form>
  );
}
