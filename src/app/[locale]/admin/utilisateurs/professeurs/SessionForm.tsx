"use client";

import { useState, useTransition } from "react";
import { createTeacherSession } from "./session-actions";

const WEEKDAYS = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1h",     value: 60 },
  { label: "1h30",   value: 90 },
  { label: "2h",     value: 120 },
];

type Student = { id: string; display_name: string };

export default function SessionForm({
  teacherId,
  students,
}: {
  teacherId: string;
  students: Student[];
}) {
  const [type,     setType]     = useState<"recurring" | "once">("recurring");
  const [weekday,  setWeekday]  = useState(1);
  const [duration, setDuration] = useState(60);
  const [studentId, setStudentId] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [status,  setStatus]   = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("teacher_id",   teacherId);
    fd.set("session_type", type);
    fd.set("weekday",      String(weekday));
    fd.set("duration_min", String(duration));
    fd.set("student_id",   studentId === "all" ? "" : studentId);
    startTransition(async () => {
      const res = await createTeacherSession(fd);
      if ("error" in res) { setStatus("error"); setErrorMsg(res.error); return; }
      setStatus("ok");
      (e.target as HTMLFormElement).reset();
      setType("recurring"); setWeekday(1); setDuration(60); setStudentId("all");
      setTimeout(() => setStatus("idle"), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Pour quel élève */}
      {students.length > 0 && (
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Pour quel élève ?</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStudentId("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                studentId === "all"
                  ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
              }`}
            >
              <span>👥</span> Tous les élèves
            </button>
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudentId(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  studentId === s.id
                    ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                }`}
              >
                <span>👦</span> {s.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type toggle */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Type de session</label>
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(["recurring", "once"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${
                type === t ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span>{t === "recurring" ? "🔁" : "📅"}</span>
              {t === "recurring" ? "Récurrente (hebdo)" : "Ponctuelle"}
            </button>
          ))}
        </div>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Titre de la session</label>
        <input
          name="title"
          required
          placeholder="ex: Cours Python — Groupe A"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
        />
      </div>

      {type === "recurring" ? (
        <>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Jour de la semaine</label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setWeekday(d.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                    weekday === d.value
                      ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Heure de début</label>
            <input
              name="start_time"
              type="time"
              required
              defaultValue="09:00"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">À partir du</label>
              <input
                name="active_from"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Jusqu&apos;au <span className="font-normal normal-case">(optionnel)</span>
              </label>
              <input
                name="active_until"
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Date et heure</label>
          <input
            name="scheduled_at"
            type="datetime-local"
            required
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
          />
          <input name="active_from" type="hidden" value={new Date().toISOString().slice(0, 10)} />
        </div>
      )}

      {/* Durée */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Durée</label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                duration === d.value
                  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <input
        name="notes"
        placeholder="Notes (optionnel) — salle, lien Zoom…"
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
      />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-black rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-40 shadow-sm"
        >
          {pending ? "Enregistrement…" : "＋ Ajouter cette session"}
        </button>
        {status === "ok"    && <span className="text-xs text-emerald-600 font-bold">✅ Session ajoutée !</span>}
        {status === "error" && <span className="text-xs text-red-500 font-bold">{errorMsg}</span>}
      </div>
    </form>
  );
}
