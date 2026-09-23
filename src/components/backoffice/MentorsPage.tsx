import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import AssignStudentForm from "@/app/[locale]/admin/utilisateurs/professeurs/AssignStudentForm";
import UnassignButton from "@/app/[locale]/admin/utilisateurs/professeurs/UnassignButton";
import SessionForm from "@/app/[locale]/admin/utilisateurs/professeurs/SessionForm";
import DeleteSessionButton from "@/app/[locale]/admin/utilisateurs/professeurs/DeleteSessionButton";
import ProfSearchBar from "@/app/[locale]/admin/utilisateurs/professeurs/ProfSearchBar";
import ThemeAccessToggles from "@/app/[locale]/admin/utilisateurs/professeurs/ThemeAccessToggles";

/**
 * Écran « Mentors » — qui suit quel enfant, et à quelle heure.
 *
 * Servi tel quel à l'admin et au manager. Les deux espaces en avaient chacun
 * leur copie, de 378 et 360 lignes, au caractère près sauf le chargement : le
 * manager lisait la base en série là où l'admin lisait en parallèle. Toute
 * correction devait donc être écrite deux fois.
 *
 * Chaque mentor est un volet replié. Sa ligne fermée dit déjà l'essentiel —
 * ses élèves et ses créneaux — pour qu'on n'ait pas à l'ouvrir neuf fois sur
 * dix ; c'est ça qui fait gagner de la place, pas un second pliage à
 * l'intérieur, qui demanderait trois clics pour voir les thèmes d'un enfant.
 */

const LEVEL_NAMES: Record<number, string> = { 1: "Explorateur", 2: "Bâtisseur", 3: "Architecte" };
const LEVEL_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-purple-100 text-purple-700",
};
const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const WEEKDAY_FULL  = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default async function MentorsPage() {
  const admin = createAdminClient();

  const [
    { data: teachers },
    { data: authList },
    { data: allSessions },
    { data: allStudents },
    { data: allThemes },
  ] = await Promise.all([
    (admin.from("profiles") as any).select("id, display_name, created_at").eq("role", "teacher").order("display_name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    (admin.from("teacher_sessions") as any)
      .select("*, students(id, profiles!profile_id(display_name))")
      .order("weekday").order("start_time").order("scheduled_at"),
    (admin.from("students") as any)
      .select("id, xp, level_num, teacher_id, profile_id, profiles!profile_id(id, display_name)")
      .order("xp", { ascending: false }),
    (admin.from("themes") as any).select("id, title, level").eq("status", "published").order("level").order("order_index"),
  ]);
  const emailById = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));

  const sessionsByTeacher = new Map<string, any[]>();
  for (const s of allSessions ?? []) {
    const arr = sessionsByTeacher.get(s.teacher_id) ?? [];
    arr.push(s);
    sessionsByTeacher.set(s.teacher_id, arr);
  }

  const studentsByTeacher = new Map<string, any[]>();
  const unassignedStudents: any[] = [];
  for (const s of allStudents ?? []) {
    if (s.teacher_id) {
      const arr = studentsByTeacher.get(s.teacher_id) ?? [];
      arr.push(s);
      studentsByTeacher.set(s.teacher_id, arr);
    } else {
      unassignedStudents.push(s);
    }
  }

  const studentOptions = (allStudents ?? []).map((s: any) => ({
    id: s.id,
    display_name: s.profiles?.display_name ?? "Élève",
    teacher_id: s.teacher_id,
  }));

  // Accès thèmes existants pour tous les élèves
  const allStudentIds = (allStudents ?? []).map((s: any) => s.id);
  const { data: allAccess } = allStudentIds.length
    ? await (admin.from("student_theme_access") as any)
        .select("student_id, theme_id")
        .in("student_id", allStudentIds)
    : { data: [] };

  // index: studentId → Set<themeId>
  const accessByStudent = new Map<string, Set<string>>();
  for (const a of allAccess ?? []) {
    if (!accessByStudent.has(a.student_id)) accessByStudent.set(a.student_id, new Set());
    accessByStudent.get(a.student_id)!.add(a.theme_id);
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Mentors"
        subtitle={`${teachers?.length ?? 0} mentor${(teachers?.length ?? 0) !== 1 ? "s" : ""} enregistré${(teachers?.length ?? 0) !== 1 ? "s" : ""}`}
      />

      <ProfSearchBar />

      {/* Alerte élèves sans prof */}
      {unassignedStudents.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <span className="font-black text-amber-800 text-sm">
              {unassignedStudents.length} élève{unassignedStudents.length !== 1 ? "s" : ""} sans mentor :
            </span>
            <span className="text-amber-700 text-sm ml-2">
              {unassignedStudents.map((s: any) => s.profiles?.display_name ?? "—").join(", ")}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {(teachers ?? []).map((teacher: any) => {
          const students  = studentsByTeacher.get(teacher.id) ?? [];
          const sessions  = sessionsByTeacher.get(teacher.id) ?? [];
          const email     = emailById.get(teacher.id) ?? "—";
          const available = studentOptions.filter(
            (s: any) => !s.teacher_id || s.teacher_id === teacher.id
          );

          // Mini-agenda : sessions récurrentes groupées par jour
          const recurring = sessions.filter((s: any) => s.session_type === "recurring");
          // Les séances ponctuelles *passées* ne sont pas du planning : c'est
          // de l'historique, et il a sa page. Les garder ici allongeait la
          // carte d'un tiers avec des « Première séance offerte » d'août.
          const oneTime   = sessions.filter((s: any) => s.session_type === "once"
            && s.scheduled_at && new Date(s.scheduled_at) >= new Date());
          const creneaux  = recurring.length + oneTime.length;

          // La ligne fermée doit répondre à la question qu'on se pose en
          // arrivant : qui suit-il, et quand ?
          const nomsEleves = students.map((s: any) => s.profiles?.display_name ?? "—");
          const resumeEleves = nomsEleves.length <= 3
            ? nomsEleves.join(", ")
            : `${nomsEleves.slice(0, 3).join(", ")} +${nomsEleves.length - 3}`;
          // « 10 h » plutôt que « 10 h 00 » : on n'écrit les minutes que s'il y en a.
          const heure = (t: string | null) => {
            const [h, m] = (t ?? "").slice(0, 5).split(":");
            return m && m !== "00" ? `${h} h ${m}` : `${h} h`;
          };
          const parJour = new Map<number, string[]>();
          for (const r of recurring) {
            parJour.set(r.weekday, [...(parJour.get(r.weekday) ?? []), heure(r.start_time)]);
          }
          const resumeCreneaux = [1, 2, 3, 4, 5, 6, 0]
            .filter((wd) => parJour.has(wd))
            .map((wd) => `${WEEKDAY_FULL[wd].toLowerCase()} ${parJour.get(wd)!.join(" et ")}`)
            .join(" · ");

          // Jours actifs dans la semaine (Lun→Dim)
          const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
          const recByDay = new Map<number, any[]>();
          for (const s of recurring) {
            const arr = recByDay.get(s.weekday) ?? [];
            arr.push(s);
            recByDay.set(s.weekday, arr);
          }

          const profText = [
            teacher.display_name ?? "",
            email,
            ...students.map((s: any) => s.profiles?.display_name ?? ""),
            ...sessions.map((s: any) => s.title ?? ""),
          ].join(" ").toLowerCase();

          return (
            <details key={teacher.id}
              data-prof-card=""
              data-prof-text={profText}
              className="group bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">

              {/* ── Ligne fermée : elle répond déjà, pour n'avoir pas à ouvrir ── */}
              <summary className="flex items-center gap-4 px-6 py-5 cursor-pointer list-none group-open:border-b group-open:border-gray-100 hover:bg-gray-50/60 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-sm">
                  {teacher.display_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-gray-900 text-base leading-tight">{teacher.display_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{email}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {students.length ? `👦 ${resumeEleves}` : "👦 aucun élève"}
                    {resumeCreneaux ? ` · 📅 ${resumeCreneaux}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full">
                    {students.length} élève{students.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs font-black bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">
                    {creneaux} créneau{creneaux !== 1 ? "x" : ""}
                  </span>
                  <span className="text-gray-300 text-xs transition-transform group-open:rotate-180">▼</span>
                </div>
              </summary>

              {/* ── Corps en deux colonnes ── */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">

                {/* Colonne gauche : Élèves */}
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Élèves assignés</span>
                    <details className="group relative">
                      <summary className="cursor-pointer list-none">
                        <span className="text-xs font-black text-brand-navy border border-brand-navy/20 bg-blue-50 hover:bg-brand-navy hover:text-white px-3 py-1.5 rounded-xl transition-colors">
                          ＋ Assigner
                        </span>
                      </summary>
                      <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl p-4">
                        <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Ajouter un élève</div>
                        <AssignStudentForm
                          teacherId={teacher.id}
                          availableStudents={available.filter((s: any) => s.teacher_id !== teacher.id)}
                        />
                      </div>
                    </details>
                  </div>

                  {students.length > 0 ? (
                    <div className="space-y-4">
                      {students.map((s: any) => (
                        <div key={s.id}>
                          <div className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-base shrink-0">
                              {s.level_num === 3 ? "🏛️" : s.level_num === 2 ? "🔨" : "🧭"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-800 text-sm truncate">{s.profiles?.display_name ?? "—"}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${LEVEL_COLORS[s.level_num ?? 1]}`}>
                                  {LEVEL_NAMES[s.level_num ?? 1]}
                                </span>
                                <span className="text-[10px] text-gray-400">{s.xp ?? 0} XP</span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <UnassignButton studentId={s.id} studentName={s.profiles?.display_name ?? "cet élève"} />
                            </div>
                          </div>
                          <ThemeAccessToggles
                            studentId={s.id}
                            studentName={s.profiles?.display_name ?? "Élève"}
                            studentLevel={["explorer","builder","architect"][Math.max(0,(s.level_num??1)-1)]}
                            themes={allThemes ?? []}
                            activeThemeIds={accessByStudent.get(s.id) ?? new Set()}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="text-3xl mb-2 opacity-30">👩‍🏫</span>
                      <p className="text-sm text-gray-400">Aucun élève assigné</p>
                    </div>
                  )}
                </div>

                {/* Colonne droite : Planning */}
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Planning de cours</span>
                  </div>

                  {/* Mini-agenda hebdo */}
                  {recurring.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {weekdayOrder.map((wd) => {
                          const daySessions = recByDay.get(wd) ?? [];
                          const hasSession  = daySessions.length > 0;
                          return (
                            <div
                              key={wd}
                              className={`rounded-xl text-center transition-all ${
                                hasSession
                                  ? "bg-brand-navy shadow-sm"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className={`text-[9px] font-black pt-1.5 pb-0.5 ${hasSession ? "text-blue-200" : "text-gray-300"}`}>
                                {WEEKDAY_SHORT[wd]}
                              </div>
                              {hasSession ? (
                                <div className="pb-1.5 px-0.5 space-y-0.5">
                                  {daySessions.map((s: any, i: number) => (
                                    <div key={i} className="text-[8px] font-black text-white bg-white/20 rounded-md px-0.5 py-0.5 leading-tight">
                                      {s.start_time?.slice(0, 5)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="pb-2 text-gray-200 text-[10px]">·</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Détail sessions récurrentes */}
                      <div className="space-y-1.5 mt-3">
                        {recurring.map((s: any) => {
                          const studentName = s.students?.profiles?.display_name ?? null;
                          return (
                            <div key={s.id} className="group flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                              <div className="w-1 h-8 bg-indigo-400 rounded-full shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-indigo-900 truncate">{s.title}</span>
                                  {studentName ? (
                                    <span className="text-[9px] font-black bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-md shrink-0">👦 {studentName}</span>
                                  ) : (
                                    <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md shrink-0">👥 Tous</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-indigo-500 mt-0.5">
                                  {WEEKDAY_FULL[s.weekday]} · {s.start_time?.slice(0, 5)} · {s.duration_min} min
                                  {s.active_until && ` · jusqu'au ${new Date(s.active_until).toLocaleDateString("fr-FR")}`}
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <DeleteSessionButton sessionId={s.id} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sessions ponctuelles */}
                  {oneTime.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      {oneTime.map((s: any) => {
                        const at = new Date(s.scheduled_at);
                        const studentName = s.students?.profiles?.display_name ?? null;
                        return (
                          <div key={s.id} className="group flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                            <div className="text-center shrink-0 w-8">
                              <div className="text-[9px] font-black text-amber-400 uppercase">
                                {at.toLocaleDateString("fr-FR", { month: "short" })}
                              </div>
                              <div className="text-base font-black text-amber-700 leading-none">{at.getDate()}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-amber-900 truncate">{s.title}</span>
                                {studentName ? (
                                  <span className="text-[9px] font-black bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-md shrink-0">👦 {studentName}</span>
                                ) : (
                                  <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md shrink-0">👥 Tous</span>
                                )}
                              </div>
                              <div className="text-[10px] text-amber-500 mt-0.5">
                                {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {s.duration_min} min
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <DeleteSessionButton sessionId={s.id} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {creneaux === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <span className="text-3xl mb-2 opacity-30">📅</span>
                      <p className="text-sm text-gray-400 mb-0.5">Aucune session planifiée</p>
                    </div>
                  )}

                  {/* Formulaire ajout session */}
                  <details className="group mt-2">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-brand-navy hover:bg-blue-50 rounded-xl py-2.5 text-xs font-black text-gray-400 hover:text-brand-navy transition-all">
                        <span className="text-base">＋</span> Planifier une session
                      </div>
                    </summary>
                    <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <SessionForm
                        teacherId={teacher.id}
                        students={students.map((s: any) => ({
                          id: s.id,
                          display_name: s.profiles?.display_name ?? "Élève",
                        }))}
                        existingSessions={sessions.map((s: any) => ({
                          id: s.id,
                          title: s.title,
                          session_type: s.session_type,
                          weekday: s.weekday,
                          start_time: s.start_time,
                          scheduled_at: s.scheduled_at,
                          duration_min: s.duration_min,
                        }))}
                      />
                    </div>
                  </details>
                </div>

              </div>
            </details>
          );
        })}

        {(teachers ?? []).length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <div className="text-4xl mb-3">👩‍🏫</div>
            <p>Aucun mentor enregistré.</p>
          </div>
        )}
      </div>
    </div>
  );
}
