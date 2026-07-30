import { createAdminClient, createClient } from "@/lib/supabase/server";
import PastSessionsList from "./PlanningClient";

const WEEKDAY_FULL  = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

type Occurrence = {
  sessionId: string;
  title: string;
  at: Date;
  duration_min: number;
  notes: string | null;
  recurring: boolean;
  studentName: string | null;
};

function buildOccurrences(sessions: any[], from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = [];
  const recurring = sessions.filter((s: any) => s.session_type === "recurring");
  const oneTime   = sessions.filter((s: any) => s.session_type === "once");

  for (const s of recurring) {
    const [h, m] = (s.start_time as string).split(":").map(Number);
    const cursor = new Date(from);
    cursor.setHours(h, m, 0, 0);
    const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
    cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor >= from ? 0 : daysUntil === 0 ? 7 : daysUntil));
    while (cursor <= to) {
      if (cursor >= from && (!s.active_until || cursor <= new Date(s.active_until))) {
        out.push({
          sessionId: s.id,
          title: s.title,
          at: new Date(cursor),
          duration_min: s.duration_min,
          notes: s.notes,
          recurring: true,
          studentName: s.students?.profiles?.display_name ?? null,
        });
      }
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  for (const s of oneTime) {
    const at = new Date(s.scheduled_at);
    if (at >= from && at <= to) {
      out.push({
        sessionId: s.id,
        title: s.title,
        at,
        duration_min: s.duration_min,
        notes: s.notes,
        recurring: false,
        studentName: s.students?.profiles?.display_name ?? null,
      });
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export default async function ProfPlanningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: sessions } = await (admin.from("teacher_sessions") as any)
    .select("*, students(id, profiles!profile_id(display_name))")
    .eq("teacher_id", user.id)
    .order("weekday").order("start_time").order("scheduled_at");

  const now    = new Date();
  const in30   = new Date(now); in30.setDate(now.getDate() + 30);
  const past7  = new Date(now); past7.setDate(now.getDate() - 7);

  // Futures (30j)
  const upcoming = buildOccurrences(sessions ?? [], now, in30);
  // Passées (7 derniers jours) — pour l'archive
  const past     = buildOccurrences(sessions ?? [], past7, new Date(now.getTime() - 1)).reverse();

  // Grille semaine courante
  const startOfWeek = new Date(now);
  const dow = now.getDay();
  startOfWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const recurring = (sessions ?? []).filter((s: any) => s.session_type === "recurring");
  const recByWeekday = new Map<number, any[]>();
  for (const s of recurring) {
    const arr = recByWeekday.get(s.weekday) ?? [];
    arr.push(s);
    recByWeekday.set(s.weekday, arr);
  }

  const nextSession = upcoming[0] ?? null;
  const nextSessionDateStr = nextSession?.at.toDateString();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header inline compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>Mon planning</h1>
          <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>
            {sessions?.length ?? 0} session{(sessions?.length ?? 0) !== 1 ? "s" : ""} configurée{(sessions?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Prochaine session — spotlight */}
      {nextSession && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy to-indigo-700 p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <div className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
              Prochaine session
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-black text-white mb-1">{nextSession.title}</div>
                <div className="text-indigo-200 text-sm font-bold">
                  {nextSession.at.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  {" à "}
                  {nextSession.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {nextSession.duration_min} min
                </div>
                {nextSession.studentName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-black px-3 py-1 rounded-full">
                    👦 {nextSession.studentName}
                  </div>
                )}
                {!nextSession.studentName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-black px-3 py-1 rounded-full">
                    👥 Tous les élèves
                  </div>
                )}
              </div>
              <div className="text-center bg-white/10 rounded-2xl px-5 py-3 shrink-0">
                <div className="text-xs font-black text-indigo-300 uppercase">
                  {nextSession.at.toLocaleDateString("fr-FR", { month: "short" })}
                </div>
                <div className="text-4xl font-black text-white leading-none">{nextSession.at.getDate()}</div>
                <div className="text-xs font-black text-indigo-300 uppercase mt-1">
                  {WEEKDAY_SHORT[nextSession.at.getDay()]}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grille semaine */}
      <section>
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Semaine en cours</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const jsDay = day.getDay();
            const sessionsToday = [
              ...(recByWeekday.get(jsDay) ?? []).map((s: any) => ({
                title: s.title,
                time: s.start_time?.slice(0, 5),
                studentName: s.students?.profiles?.display_name ?? null,
              })),
              ...(sessions ?? []).filter((s: any) => {
                if (s.session_type !== "once") return false;
                return new Date(s.scheduled_at).toDateString() === day.toDateString();
              }).map((s: any) => ({
                title: s.title,
                time: new Date(s.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                studentName: s.students?.profiles?.display_name ?? null,
              })),
            ];

            const isToday    = day.toDateString() === now.toDateString();
            const isNextDay  = nextSession && day.toDateString() === nextSessionDateStr;
            const isPast     = day < now && !isToday;

            return (
              <div
                key={i}
                className={`rounded-2xl p-2 min-h-20 transition-all ${
                  isToday
                    ? "bg-yellow-50 border-2 border-yellow-300 shadow-sm"
                    : isNextDay
                    ? "bg-green-50 border-2 border-green-300 shadow-sm"
                    : isPast
                    ? "bg-gray-50/50 border border-gray-100 opacity-60"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className={`text-[10px] font-black mb-1 ${isToday ? "text-yellow-600" : isNextDay ? "text-green-600" : "text-gray-400"}`}>
                  {WEEKDAY_SHORT[jsDay]}
                  <span className={`block text-base leading-tight font-black ${isToday ? "text-yellow-700" : "text-gray-700"}`}>
                    {day.getDate()}
                  </span>
                </div>
                {sessionsToday.map((s, si) => (
                  <div
                    key={si}
                    className={`rounded-lg px-1.5 py-1 mb-1 ${
                      isToday ? "bg-yellow-100 border border-yellow-200"
                      : isNextDay ? "bg-green-100 border border-green-200"
                      : "bg-white border border-blue-100 shadow-sm"
                    }`}
                  >
                    <div className="text-[10px] font-black text-gray-800 truncate leading-tight">{s.title}</div>
                    <div className="text-[9px] text-gray-500">{s.time}</div>
                    {s.studentName && (
                      <div className="text-[8px] font-black text-indigo-500 truncate">👦 {s.studentName}</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Prochaines sessions */}
      <section>
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
          À venir — 30 jours
        </h2>
        {upcoming.length === 0 ? (
          <div className="text-gray-400 text-sm italic text-center py-8">Aucune session à venir.</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((occ, i) => {
              const isNext = i === 0;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${
                    isNext
                      ? "bg-green-50 border-2 border-green-200 shadow-sm"
                      : "bg-white border border-gray-100 shadow-sm"
                  }`}
                >
                  {/* Indicateur "suivant" */}
                  {isNext && (
                    <div className="shrink-0 w-1.5 h-10 bg-green-400 rounded-full" />
                  )}

                  {/* Date */}
                  <div className="w-10 text-center shrink-0">
                    <div className="text-[10px] font-black text-gray-400 uppercase">
                      {WEEKDAY_SHORT[occ.at.getDay()]}
                    </div>
                    <div className={`text-xl font-black leading-none ${isNext ? "text-green-700" : "text-gray-800"}`}>
                      {occ.at.getDate()}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {occ.at.toLocaleDateString("fr-FR", { month: "short" })}
                    </div>
                  </div>

                  <div className="w-px h-8 bg-gray-100 shrink-0" />

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-black text-sm ${isNext ? "text-green-900" : "text-gray-900"}`}>
                        {occ.title}
                      </span>
                      {isNext && (
                        <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full">
                          Prochaine
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>🕐 {occ.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>·</span>
                      <span>{occ.duration_min} min</span>
                      {occ.notes && <><span>·</span><span>{occ.notes}</span></>}
                    </div>
                  </div>

                  {/* Élève + type */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      occ.recurring ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {occ.recurring ? "🔁 Récurrent" : "📅 Ponctuel"}
                    </span>
                    {occ.studentName ? (
                      <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        👦 {occ.studentName}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        👥 Tous
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sessions passées — archive + bouton rapport */}
      <PastSessionsList sessions={past.map(occ => ({
        sessionId:   occ.sessionId,
        title:       occ.title,
        dateStr:     occ.at.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
        time:        occ.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        duration:    occ.duration_min,
        studentId:   undefined,
        studentName: occ.studentName,
        recurring:   occ.recurring,
      }))} />
    </div>
  );
}
