export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CertificatsClient from "./CertificatsClient";

const LEVEL_MAP: Record<number, string> = { 1: "explorer", 2: "builder", 3: "architect" };

export default async function ProfCertificatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  // Nom du prof (pour signature sur le certificat)
  const { data: profProfile } = await admin.from("profiles").select("display_name").eq("id", user.id).single<{ display_name: string }>();
  const profName = profProfile?.display_name ?? "Prof CodeKids";

  // Élèves de ce prof avec leur niveau
  const { data: studentsRaw } = await (admin.from("students") as any)
    .select("id, level_num, xp, profiles!profile_id(display_name)")
    .eq("teacher_id", user.id)
    .order("level_num");
  const students = studentsRaw ?? [];

  if (!students.length) {
    return (
      <div className="max-w-3xl">
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🎓</div>
          <p className="font-bold text-gray-500">Aucun élève assigné pour le moment.</p>
        </div>
      </div>
    );
  }

  const studentIds = students.map((s: any) => s.id);

  // Thèmes publiés avec leçons et compétences
  const { data: themes } = await (admin.from("themes") as any)
    .select("id, title, level, competencies, chapters(lessons(id))")
    .eq("status", "published");
  const themesList = themes ?? [];

  // Total leçons par thème
  const lessonCountByTheme = new Map<string, number>();
  for (const t of themesList) {
    const n = (t.chapters ?? []).flatMap((c: any) => c.lessons ?? []).length;
    lessonCountByTheme.set(t.id, n);
  }

  // Leçons complétées pour ces élèves
  const { data: progressRaw } = await (admin.from("lesson_progress") as any)
    .select("student_id, lesson_id, status")
    .in("student_id", studentIds)
    .eq("status", "completed");

  const doneByStudent = new Map<string, Set<string>>();
  for (const p of progressRaw ?? []) {
    if (!doneByStudent.has(p.student_id)) doneByStudent.set(p.student_id, new Set());
    doneByStudent.get(p.student_id)!.add(p.lesson_id);
  }

  // Certificats (thème uniquement) pour ces élèves
  const { data: certsRaw } = await (admin.from("certificates") as any)
    .select("id, student_id, theme_id, score, total_xp, issued_at, validated_at, revoked")
    .in("student_id", studentIds)
    .eq("cert_type", "theme")
    .eq("revoked", false)
    .order("issued_at", { ascending: false });

  // index: studentId|themeId → cert
  const certIndex = new Map<string, any>();
  for (const c of certsRaw ?? []) {
    const key = `${c.student_id}|${c.theme_id}`;
    if (!certIndex.has(key)) certIndex.set(key, c);
  }

  // Construire tableau par élève
  const rows = students.map((s: any) => {
    const levelStr = LEVEL_MAP[s.level_num ?? 1] ?? "explorer";
    const done     = doneByStudent.get(s.id) ?? new Set<string>();

    const studentThemes = themesList
      .filter((t: any) => t.level === levelStr)
      .map((t: any) => {
        const allLessons = (t.chapters ?? []).flatMap((c: any) => c.lessons ?? []);
        const total      = allLessons.length;
        const doneCount  = allLessons.filter((l: any) => done.has(l.id)).length;
        const rawCert    = certIndex.get(`${s.id}|${t.id}`) ?? null;

        return {
          theme_id:    t.id,
          theme_title: t.title,
          done:        doneCount,
          total,
          cert: rawCert ? {
            id:           rawCert.id,
            theme_id:     rawCert.theme_id,
            validated_at: rawCert.validated_at ?? null,
            score:        rawCert.score ?? 95,
            issued_at:    rawCert.issued_at,
            competencies: (t.competencies as string[]) ?? [],
            nLessons:     lessonCountByTheme.get(t.id) ?? 0,
          } : null,
        };
      });

    return {
      id:     s.id,
      name:   s.profiles?.display_name ?? "Élève",
      level:  levelStr,
      xp:     s.xp ?? 0,
      themes: studentThemes,
    };
  });

  return <CertificatsClient students={rows} profName={profName} />;
}
