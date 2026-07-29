import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import ValidateCertButton from "./ValidateCertButton";

const LEVEL_MAP: Record<number, string> = { 1: "explorer", 2: "builder", 3: "architect" };
const LEVEL_NAMES: Record<number, string> = { 1: "Explorateur", 2: "Bâtisseur", 3: "Architecte" };
const LEVEL_COLORS: Record<number, { bg: string; badge: string; bar: string }> = {
  1: { bg: "bg-green-50 border-green-200",   badge: "bg-green-100 text-green-700", bar: "#22c55e" },
  2: { bg: "bg-blue-50 border-blue-200",     badge: "bg-blue-100 text-blue-700",   bar: "#3b82f6" },
  3: { bg: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700", bar: "#a855f7" },
};

export default async function ProfCertificatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  // Élèves de ce prof
  const { data: students } = await (admin.from("students") as any)
    .select("id, level_num, xp, profiles!profile_id(display_name)")
    .eq("teacher_id", user.id)
    .order("level_num");

  if (!students?.length) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Certificats" subtitle="Progression de vos élèves vers leurs certificats" />
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🎓</div>
          <p className="font-bold text-gray-500">Aucun élève assigné pour le moment.</p>
        </div>
      </div>
    );
  }

  const studentIds = students.map((s: any) => s.id);
  const levelNums  = [...new Set(students.map((s: any) => s.level_num ?? 1))] as number[];
  const levelStrs  = levelNums.map((n) => LEVEL_MAP[n]).filter(Boolean);

  // Thèmes publiés des niveaux concernés (avec leçons pour compter)
  const { data: themes } = await (admin.from("themes") as any)
    .select("id, title, level, chapters(lessons(id))")
    .eq("status", "published")
    .in("level", levelStrs);

  // Progression lesson_progress
  const { data: progressRaw } = await (admin.from("lesson_progress") as any)
    .select("student_id, lesson_id, status")
    .in("student_id", studentIds)
    .eq("status", "completed");

  // Index: studentId → Set<lessonId>
  const doneIndex = new Map<string, Set<string>>();
  for (const p of progressRaw ?? []) {
    if (!doneIndex.has(p.student_id)) doneIndex.set(p.student_id, new Set());
    doneIndex.get(p.student_id)!.add(p.lesson_id);
  }

  // Certificats existants de ces élèves
  const { data: certs } = await (admin.from("certificates") as any)
    .select("id, student_id, cert_type, score, total_xp, issued_at, validated_at, revoked, theme_id, level_num, themes(title)")
    .in("student_id", studentIds)
    .eq("revoked", false)
    .order("issued_at", { ascending: false });

  const pending   = (certs ?? []).filter((c: any) => !c.validated_at);
  const validated = (certs ?? []).filter((c: any) => !!c.validated_at);

  // Thèmes indexés par level string et par id
  const themeById = new Map<string, any>();
  for (const t of themes ?? []) themeById.set(t.id, t);

  // Total leçons par thème
  function themeTotal(t: any): number {
    return (t.chapters ?? []).flatMap((c: any) => c.lessons ?? []).length;
  }

  // Index étudiant → nom
  const studentName = new Map<string, string>();
  for (const s of students) studentName.set(s.id, s.profiles?.display_name ?? "Élève");

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Certificats"
        subtitle="Progression de vos élèves vers leurs certificats"
      />

      {/* Certificats en attente de validation */}
      {pending.length > 0 && (
        <section>
          <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            En attente de validation ({pending.length})
          </div>
          <div className="space-y-3">
            {pending.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 shadow-sm">
                <div>
                  <div className="font-black text-gray-900 text-sm">
                    {c.cert_type === "theme" ? "📜 Certificat" : "🎓 Diplôme"} —{" "}
                    {c.themes?.title ?? `Niveau ${c.level_num}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {studentName.get(c.student_id) ?? "Élève"} · Score {c.score}/100 · {c.total_xp} XP ·
                    émis le {new Date(c.issued_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <ValidateCertButton certId={c.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certificats validés */}
      {validated.length > 0 && (
        <section>
          <div className="text-xs font-black text-green-700 uppercase tracking-widest mb-3">
            ✅ Validés ({validated.length})
          </div>
          <div className="space-y-2">
            {validated.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-3 shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 text-sm">
                    {c.cert_type === "theme" ? "📜" : "🎓"}{" "}
                    {c.themes?.title ?? `Niveau ${c.level_num}`} — {studentName.get(c.student_id)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Validé le {new Date(c.validated_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <a
                  href={`/api/certificats/${c.id}`}
                  target="_blank"
                  className="text-xs font-bold text-brand-orange hover:underline"
                >
                  ⬇ PDF
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Progression par élève × thème */}
      <section>
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          📊 Progression vers les certificats
        </div>
        <div className="space-y-4">
          {students.map((student: any) => {
            const name     = student.profiles?.display_name ?? "Élève";
            const levelNum = student.level_num ?? 1;
            const levelStr = LEVEL_MAP[levelNum];
            const colors   = LEVEL_COLORS[levelNum] ?? LEVEL_COLORS[1];
            const done     = doneIndex.get(student.id) ?? new Set<string>();
            const studentThemes = (themes ?? []).filter((t: any) => t.level === levelStr);
            const certIds  = new Set((certs ?? []).filter((c: any) => c.student_id === student.id).map((c: any) => c.theme_id));

            return (
              <div key={student.id} className={`border rounded-2xl overflow-hidden ${colors.bg}`}>
                {/* En-tête élève */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-inherit">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-black text-sm shadow-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 font-black text-gray-900 text-sm">{name}</div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {LEVEL_NAMES[levelNum]}
                  </span>
                </div>

                {/* Thèmes */}
                <div className="px-5 py-4 space-y-3">
                  {studentThemes.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">Aucun thème publié pour ce niveau.</div>
                  )}
                  {studentThemes.map((theme: any) => {
                    const allLessons = (theme.chapters ?? []).flatMap((c: any) => c.lessons ?? []);
                    const total      = allLessons.length;
                    const doneCount  = allLessons.filter((l: any) => done.has(l.id)).length;
                    const pct        = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                    const hasCert    = certIds.has(theme.id);

                    return (
                      <div key={theme.id} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-gray-700 truncate">{theme.title}</span>
                            {hasCert && (
                              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">
                                🎓 Certificat émis
                              </span>
                            )}
                            {pct === 100 && !hasCert && (
                              <span className="text-[10px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                                ✅ Complété
                              </span>
                            )}
                          </div>
                          <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: colors.bar }}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 text-right w-20">
                          <div className="text-xs font-black text-gray-600">{pct}%</div>
                          <div className="text-[10px] text-gray-400">{doneCount}/{total} leçons</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!pending.length && !validated.length && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-700 font-bold">
          💡 Les certificats apparaissent automatiquement quand un élève termine 100% des leçons d&apos;un thème.
        </div>
      )}
    </div>
  );
}
