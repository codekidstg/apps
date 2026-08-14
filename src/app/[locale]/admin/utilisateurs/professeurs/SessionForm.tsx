"use client";

import { useState, useTransition, useMemo } from "react";
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

const BUFFER_MIN = 180;

type Student = { id: string; display_name: string };
type ExistingSession = {
  id: string;
  title: string;
  session_type: "recurring" | "once";
  weekday?: number;
  start_time?: string;
  scheduled_at?: string;
  duration_min: number;
};

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function findConflict(
  newWeekday: number,
  newStartMin: number,
  existing: ExistingSession[],
): string | null {
  for (const s of existing) {
    let existingMin: number | null = null;
    if (s.session_type === "recurring" && s.weekday === newWeekday && s.start_time) {
      existingMin = timeToMin(s.start_time);
    } else if (s.session_type === "once" && s.scheduled_at) {
      const d = new Date(s.scheduled_at);
      if (d.getDay() === newWeekday) existingMin = d.getHours() * 60 + d.getMinutes();
    }
    if (existingMin !== null && Math.abs(newStartMin - existingMin) < BUFFER_MIN) {
      return s.title;
    }
  }
  return null;
}

export default function SessionForm({
  teacherId,
  students,
  existingSessions = [],
}: {
  teacherId: string;
  students: Student[];
  existingSessions?: ExistingSession[];
}) {
  const [type,       setType]      = useState<"recurring" | "once">("recurring");
  const [weekday,    setWeekday]   = useState(1);
  const [startTime,  setStartTime] = useState("09:00");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration,   setDuration]  = useState(60);
  const [studentId,  setStudentId] = useState<string>("all");
  const [pending,    startTransition] = useTransition();
  const [status,     setStatus]    = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg,   setErrorMsg]  = useState("");

  // Avertissement de conflit en temps réel
  const conflictWarning = useMemo(() => {
    if (type === "recurring" && startTime) {
      return findConflict(weekday, timeToMin(startTime), existingSessions);
    }
    if (type === "once" && scheduledAt) {
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) {
        return findConflict(d.getDay(), d.getHours() * 60 + d.getMinutes(), existingSessions);
      }
    }
    return null;
  }, [type, weekday, startTime, scheduledAt, existingSessions]);

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
      setType("recurring"); setWeekday(1); setStartTime("09:00");
      setScheduledAt(""); setDuration(60); setStudentId("all");
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
            <button type="button" onClick={() => setStudentId("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                studentId === "all"
                  ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
              }`}>
              <span>👥</span> Tous les élèves
            </button>
            {students.map((s) => (
              <button key={s.id} type="button" onClick={() => setStudentId(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  studentId === s.id
                    ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                }`}>
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
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-all ${
                type === t ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}>
              <span>{t === "recurring" ? "🔁" : "📅"}</span>
              {t === "recurring" ? "Récurrente (hebdo)" : "Ponctuelle"}
            </button>
          ))}
        </div>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Titre de la session</label>
        <input name="title" required placeholder="ex: Cours Python — Groupe A"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
        />
      </div>

      {type === "recurring" ? (
        <>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Jour de la semaine</label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((d) => (
                <button key={d.value} type="button" onClick={() => setWeekday(d.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                    weekday === d.value
                      ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Heure de début</label>
            <input name="start_time" type="time" required value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition ${
                conflictWarning ? "border-amber-400 bg-amber-50" : "border-gray-200"
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">À partir du</label>
              <input name="active_from" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Jusqu&apos;au <span className="font-normal normal-case">(optionnel)</span>
              </label>
              <input name="active_until" type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Date et heure</label>
          <input name="scheduled_at" type="datetime-local" required value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition ${
              conflictWarning ? "border-amber-400 bg-amber-50" : "border-gray-200"
            }`}
          />
          <input name="active_from" type="hidden" value={new Date().toISOString().slice(0, 10)} />
        </div>
      )}

      {/* Avertissement conflit */}
      {conflictWarning && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs">
          <span className="text-amber-500 text-base shrink-0">⚠️</span>
          <div>
            <span className="font-black text-amber-800">Conflit potentiel (tampon 3h) :</span>
            <span className="text-amber-700 ml-1">« {conflictWarning} » est déjà planifié proche de ce créneau.</span>
          </div>
        </div>
      )}

      {/* Durée */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Durée</label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button key={d.value} type="button" onClick={() => setDuration(d.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                duration === d.value
                  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
              }`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <input name="notes" placeholder="Notes (optionnel) — salle, lien Zoom…"
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
      />

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white text-sm font-black rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-40 shadow-sm">
          {pending ? "Enregistrement…" : "＋ Ajouter cette session"}
        </button>
        {status === "ok"    && <span className="text-xs text-emerald-600 font-bold">✅ Session ajoutée !</span>}
        {status === "error" && <span className="text-xs text-red-500 font-bold">{errorMsg}</span>}
      </div>
    </form>
  );
}
