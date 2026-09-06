"use client";

import { useState, useTransition, useMemo } from "react";
import { createTeacherSession } from "./session-actions";
import { analyserConflit, messageConflit, type Seance } from "@/lib/planning/conflits";

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
type ExistingSession = {
  id: string;
  title: string;
  session_type: "recurring" | "once";
  weekday?: number;
  start_time?: string;
  scheduled_at?: string;
  duration_min: number;
};

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
  // Contrôlés : l'aperçu de conflit a besoin de la période pour être exact.
  const [activeFrom,  setActiveFrom]  = useState(new Date().toISOString().slice(0, 10));
  const [activeUntil, setActiveUntil] = useState("");
  const [pending,    startTransition] = useTransition();
  const [status,     setStatus]    = useState<"idle" | "ok" | "warning" | "error">("idle");
  const [errorMsg,   setErrorMsg]  = useState("");

  // Aperçu du conflit pendant la saisie — même analyse que le serveur, pour ne
  // pas annoncer un problème que l'enregistrement accepterait, ni l'inverse.
  const apercuConflit = useMemo(() => {
    const existantes = existingSessions as unknown as Seance[];
    if (type === "recurring" && startTime) {
      return analyserConflit(
        { type: "recurring", weekday, startTime, duration, from: activeFrom, until: activeUntil || null },
        existantes,
      );
    }
    if (type === "once" && scheduledAt) {
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) {
        return analyserConflit({ type: "once", scheduledAt, duration }, existantes);
      }
    }
    return { kind: "libre" } as const;
  }, [type, weekday, startTime, scheduledAt, duration, activeFrom, activeUntil, existingSessions]);

  const conflictWarning = apercuConflit.kind === "libre" ? null : messageConflit(apercuConflit);
  const bloquant = apercuConflit.kind === "chevauchement";

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
      // La séance est créée : un espacement trop court se signale sans empêcher.
      const avert = "warning" in res ? (res.warning as string) : "";
      setStatus(avert ? "warning" : "ok");
      setErrorMsg(avert);
      (e.target as HTMLFormElement).reset();
      setType("recurring"); setWeekday(1); setStartTime("09:00");
      setScheduledAt(""); setDuration(60); setStudentId("all");
      // Ces deux champs sont contrôlés : form.reset() ne les remet pas à zéro.
      setActiveFrom(new Date().toISOString().slice(0, 10)); setActiveUntil("");
      setTimeout(() => setStatus("idle"), avert ? 9000 : 3000);
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
              <input name="active_from" type="date" required value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                Jusqu&apos;au <span className="font-normal normal-case">(optionnel)</span>
              </label>
              <input name="active_until" type="date" value={activeUntil} onChange={(e) => setActiveUntil(e.target.value)}
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
          <input name="active_from" type="hidden" value={activeFrom} />
        </div>
      )}

      {/* Avertissement conflit */}
      {conflictWarning && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs">
          <span className="text-amber-500 text-base shrink-0">⚠️</span>
          <div>
            <span className="font-black text-amber-800">Conflit potentiel (tampon 3h) :</span>
            <span className="text-amber-700 ml-1">{conflictWarning}</span>
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
        {status === "warning" && <span className="text-xs text-amber-600 font-bold">⚠️ {errorMsg}</span>}
        {status === "error"   && <span className="text-xs text-red-500 font-bold">{errorMsg}</span>}
      </div>
    </form>
  );
}
