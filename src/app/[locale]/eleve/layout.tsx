import { createClient } from "@/lib/supabase/server";
import { getCachedAllTrainings } from "@/lib/cache/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import AvatarSvg from "@/components/eleve/AvatarSvg";
import XPBar from "@/components/eleve/XPBar";
import Logo from "@/components/Logo";
import BadgeToast from "@/components/eleve/BadgeToast";
import SwRegistrar from "@/components/eleve/SwRegistrar";
import OfflineBanner from "@/components/eleve/OfflineBanner";
import { logout } from "@/app/[locale]/auth/actions";

type StudentData = {
  display_name: string;
  xp: number;
  student_id: string;
  avatar: { base: string; hat: string | null; accessory: string | null; color: string } | null;
};

export default async function EleveLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  // profile + student en parallèle
  const [profileRes, studentRes] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", user.id).single<{ display_name: string; role: string }>(),
    // level_num vient avec : c'est le niveau pédagogique fixé par l'admin, à ne
    // pas confondre avec le palier d'XP qui porte malheureusement les mêmes noms.
    supabase.from("students").select("id, xp, points, atelier_active, level_num").eq("profile_id", user.id).single<{ id: string; xp: number; points: number; atelier_active: boolean; level_num: number | null }>(),
  ]);
  const profile = profileRes.data;
  const student = studentRes.data;

  if (!profile || !["student", "admin"].includes(profile.role ?? "")) redirect("/fr/connexion");

  const xp = student?.xp ?? 0;

  // Badge entraînements + avatar en parallèle
  // allTrainings depuis le cache (5 min) — évite un aller-retour DB à chaque navigation élève
  const [allTrainings, lessonProgRes, trainingProgRes, avatarRes] = await Promise.all([
    getCachedAllTrainings(),
    student ? (supabase.from("lesson_progress") as any).select("lesson_id").eq("student_id", student.id) : Promise.resolve({ data: [] }),
    student ? (supabase.from("training_progress") as any).select("training_id").eq("student_id", student.id).gt("attempts", 0) : Promise.resolve({ data: [] }),
    student ? (supabase.from("student_avatar") as any).select("base, hat, accessory, color").eq("student_id", student.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const startedIds = new Set((lessonProgRes.data ?? []).map((r: any) => r.lesson_id));
  const doneIds    = new Set((trainingProgRes.data ?? []).map((r: any) => r.training_id));
  const trainingBadgeCount = student
    ? allTrainings.filter((t) => startedIds.has(t.lesson_id) && !doneIds.has(t.id)).length
    : 0;
  const avatarRaw = avatarRes.data;

  const avatar = avatarRaw as StudentData["avatar"];

  const nav = [
    { href: "/eleve",              label: "Ma Cité",           icon: "🏙️" },
    { href: "/eleve/entrainement", label: "Mon Entraînement",  icon: "💪" },
    { href: "/eleve/classement",   label: "Classement",        icon: "🏆" },
    { href: "/eleve/badges",       label: "Badges",            icon: "⭐" },
    { href: "/eleve/avatar",       label: "Mon robot",         icon: "🤖" },
    ...(student?.atelier_active
      ? [{ href: "/atelier/lecon", label: "Séance offerte", icon: "🎟️", special: true }]
      : []),
  ] as { href: string; label: string; icon: string; special?: boolean }[];

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Skip link a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:font-black focus:px-4 focus:py-2 focus:rounded-xl"
        style={{ background: "#FDB813", color: "#0f172a" }}
      >
        Aller au contenu
      </a>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col" style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}>
        {/* Logo */}
        <div className="px-3 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="flex flex-col items-start gap-0.5">
            <Link href={`/${locale}/eleve`}>
              <Logo size={90} variant="white" />
            </Link>
            <div className="text-xs font-mono tracking-widest uppercase ml-1" style={{ color: "#334155" }}>◈ Espace Élève</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Déconnexion"
              className="text-xs font-bold px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-800 hover:text-white"
              style={{ color: "#475569" }}
            >
              ⎋ Exit
            </button>
          </form>
        </div>

        {/* Avatar + nom */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="shrink-0 relative">
            <div className="absolute inset-0 rounded-full blur-md opacity-30" style={{ background: avatar?.color ?? "#FDB813" }} />
            <AvatarSvg
              base={avatar?.base}
              hat={avatar?.hat}
              accessory={avatar?.accessory}
              color={avatar?.color}
              size={44}
            />
          </div>
          <div className="min-w-0">
            <div className="font-black text-white text-sm truncate">{profile.display_name}</div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: "#FDB813" }}>{xp.toLocaleString()} XP</div>
          </div>
        </div>

        {/* XP Bar */}
        <XPBar xp={xp} niveauNum={student?.level_num ?? 1} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {nav.map((item) => {
            const isTraining = item.href === "/eleve/entrainement";
            if (item.special) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all mt-2 border border-orange-500/40 hover:border-orange-400"
                  style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c" }}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse"
                    style={{ background: "#f97316", color: "white" }}>
                    NEW
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-slate-800"
                style={{ color: "#94a3b8" }}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isTraining && trainingBadgeCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: "#FDB813", color: "#0f172a" }}>
                    {trainingBadgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 overflow-auto bg-slate-950">
        {children}
      </main>

      <BadgeToast />
      <SwRegistrar />
      <OfflineBanner />
    </div>
  );
}
