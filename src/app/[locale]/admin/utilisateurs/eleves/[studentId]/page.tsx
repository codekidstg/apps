import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import StudentProfileForm from "./StudentProfileForm";

const LEVELS = [
  { num: 1, name: "Explorateur 🌱", color: "#10B981" },
  { num: 2, name: "Bâtisseur 🏗️",  color: "#7C3AED" },
  { num: 3, name: "Architecte 🏛️", color: "#F47B20" },
];

const DEVICE_LABEL: Record<string, string> = {
  tablet:   "Tablette 📱",
  computer: "Ordinateur 💻",
  both:     "Les deux 📱💻",
  none:     "Aucun appareil 🚫",
};

const OBJECTIVE_LABEL: Record<string, string> = {
  leisure:     "🎮 Loisir / passion",
  academic:    "📚 Renforcement scolaire",
  tech_career: "🚀 Orientation tech / dev",
  competition: "🏆 Prépa concours / olympiades",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; locale: string }>;
}) {
  const { studentId, locale } = await params;
  const admin = createAdminClient();

  const { data: student } = await (admin.from("students") as any)
    .select("id, xp, level_num, streak_days, profile_id, gender, birth_year, device, school_level, objective, notes, profiles!profile_id(id, display_name, created_at)")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  const { data: authUser } = await admin.auth.admin.getUserById(student.profile_id);
  const email = authUser?.user?.email ?? "—";

  const { data: parentLinks } = await (admin.from("parent_children") as any)
    .select("parent_id, profiles!parent_id(display_name)")
    .eq("student_id", studentId);
  const parents = (parentLinks ?? []).map((l: any) => l.profiles?.display_name ?? "Parent");

  const { data: progressRaw } = await (admin.from("lesson_progress") as any)
    .select("status")
    .eq("student_id", studentId);
  const done  = (progressRaw ?? []).filter((p: any) => p.status === "completed").length;
  const total = (progressRaw ?? []).length;

  const lvl = LEVELS.find(l => l.num === (student.level_num ?? 1)) ?? LEVELS[0];
  const age  = student.birth_year ? new Date().getFullYear() - student.birth_year : null;

  const backHref = `/${locale}/admin/utilisateurs/eleves`;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Retour */}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors">
        ← Retour aux élèves
      </Link>

      {/* En-tête identité */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0" style={{ background: lvl.color }}>
          {student.profiles?.display_name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>{student.profiles?.display_name ?? "—"}</h1>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{email}</div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: lvl.color }}>{lvl.name}</span>
            <span className="text-xs text-gray-500 font-bold">⚡ {student.xp ?? 0} XP</span>
            <span className="text-xs text-gray-500 font-bold">🔥 {student.streak_days ?? 0}j streak</span>
            <span className="text-xs text-gray-500 font-bold">📖 {done}/{total} leçons</span>
            {age && <span className="text-xs text-gray-500 font-bold">🎂 {age} ans</span>}
            {student.device && <span className="text-xs text-gray-500 font-bold">{DEVICE_LABEL[student.device]}</span>}
            {student.objective && <span className="text-xs text-gray-500 font-bold">{OBJECTIVE_LABEL[student.objective]}</span>}
          </div>
          {parents.length > 0 && (
            <div className="mt-1.5 flex gap-2 flex-wrap">
              {parents.map((p: string, i: number) => (
                <span key={i} className="text-xs font-bold text-blue-600">👤 {p}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formulaire fiche */}
      <StudentProfileForm
        studentId={studentId}
        initial={{
          gender:       student.gender       ?? null,
          birth_year:   student.birth_year   ?? null,
          device:       student.device       ?? null,
          school_level: student.school_level ?? null,
          objective:    student.objective    ?? null,
          notes:        student.notes        ?? null,
        }}
      />
    </div>
  );
}
