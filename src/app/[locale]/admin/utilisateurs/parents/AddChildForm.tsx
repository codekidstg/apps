"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkParentToStudent } from "../actions";

type Student = { id: string; display_name: string };

export default function AddChildForm({
  parentId,
  students,
}: {
  parentId: string;
  students: Student[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;
    startTransition(async () => {
      const res = await linkParentToStudent(parentId, studentId);
      if ("error" in res) { setStatus("error"); setErrorMsg(res.error); return; }
      setStatus("ok");
      setStudentId("");
      setTimeout(() => window.location.reload(), 800);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        required
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      >
        <option value="">Choisir un élève…</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.display_name}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || !studentId}
        className="px-3 py-2 bg-brand-navy text-white text-xs font-black rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-40"
      >
        {pending ? "…" : "＋ Associer"}
      </button>
      {status === "ok" && <span className="text-xs text-emerald-600 font-bold">✅ Lié !</span>}
      {status === "error" && <span className="text-xs text-red-500 font-bold">{errorMsg}</span>}
    </form>
  );
}
