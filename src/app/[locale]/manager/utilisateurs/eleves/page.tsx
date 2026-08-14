import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import ElevesSearchTable from "@/app/[locale]/admin/utilisateurs/eleves/ElevesSearchTable";

export default async function ManagerElevesPage() {
  const admin = createAdminClient();

  const { data: students } = await (admin.from("students") as any)
    .select("id, xp, level_num, streak_days, profile_id, profiles!profile_id(id, display_name, created_at)")
    .order("xp", { ascending: false });

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailByProfileId = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));

  const studentIds = (students ?? []).map((s: any) => s.id);

  const { count: publishedLessonCount } = await (admin.from("lessons") as any)
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  const totalPublished = publishedLessonCount ?? 0;

  const { data: publishedLessons } = await (admin.from("lessons") as any)
    .select("id").eq("status", "published");
  const publishedLessonIds = new Set((publishedLessons ?? []).map((l: any) => l.id));

  const { data: progressAll } = studentIds.length
    ? await (admin.from("lesson_progress") as any)
        .select("student_id, lesson_id, status")
        .in("student_id", studentIds)
    : { data: [] };

  const progressByStudent = new Map<string, { total: number; done: number }>();
  for (const p of progressAll ?? []) {
    if (!publishedLessonIds.has(p.lesson_id)) continue;
    const cur = progressByStudent.get(p.student_id) ?? { total: totalPublished, done: 0 };
    if (p.status === "completed") cur.done++;
    progressByStudent.set(p.student_id, cur);
  }
  for (const s of students ?? []) {
    if (!progressByStudent.has(s.id))
      progressByStudent.set(s.id, { total: totalPublished, done: 0 });
  }

  const { data: inProgressRaw } = studentIds.length
    ? await (admin.from("lesson_progress") as any)
        .select("student_id, lessons!inner(chapters!inner(themes(id, title)))")
        .in("student_id", studentIds)
        .eq("status", "in_progress")
    : { data: [] };

  const currentThemeByStudent = new Map<string, string>();
  for (const p of inProgressRaw ?? []) {
    const title = p.lessons?.chapters?.themes?.title;
    if (title && !currentThemeByStudent.has(p.student_id))
      currentThemeByStudent.set(p.student_id, title);
  }

  const { data: parentLinks } = await (admin.from("parent_children") as any)
    .select("student_id, parent_id, profiles!parent_id(display_name)");

  const parentsByStudent = new Map<string, string[]>();
  for (const l of parentLinks ?? []) {
    const arr = parentsByStudent.get(l.student_id) ?? [];
    arr.push(l.profiles?.display_name ?? "Parent");
    parentsByStudent.set(l.student_id, arr);
  }

  const enriched = (students ?? []).map((s: any) => {
    const prog = progressByStudent.get(s.id) ?? { total: totalPublished, done: 0 };
    return {
      id: s.id,
      profile_id: s.profile_id,
      name: s.profiles?.display_name ?? "—",
      email: emailByProfileId.get(s.profile_id) ?? "—",
      xp: s.xp ?? 0,
      streak_days: s.streak_days ?? 0,
      level_num: s.level_num ?? 1,
      done: prog.done,
      total: prog.total,
      currentTheme: currentThemeByStudent.get(s.id) ?? null,
      parents: parentsByStudent.get(s.id) ?? [],
    };
  });

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Élèves" subtitle={`${students?.length ?? 0} élèves enregistrés`} />
      <ElevesSearchTable students={enriched} />
    </div>
  );
}
