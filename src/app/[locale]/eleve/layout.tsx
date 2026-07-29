import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AvatarSvg from "@/components/eleve/AvatarSvg";
import XPBar from "@/components/eleve/XPBar";
import Logo from "@/components/Logo";
import BadgeToast from "@/components/eleve/BadgeToast";
import SwRegistrar from "@/components/eleve/SwRegistrar";
import OfflineBanner from "@/components/eleve/OfflineBanner";

type StudentData = {
  display_name: string;
  xp: number;
  student_id: string;
  avatar: { base: string; hat: string | null; accessory: string | null; color: string } | null;
};

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single<{ display_name: string; role: string }>();

  if (!profile || !["student", "admin"].includes(profile.role ?? "")) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id, xp, points")
    .eq("profile_id", user.id)
    .single<{ id: string; xp: number; points: number }>();

  const xp = student?.xp ?? 0;

  const { data: avatarRaw } = student
    ? await (supabase.from("student_avatar") as any)
        .select("base, hat, accessory, color")
        .eq("student_id", student.id)
        .maybeSingle()
    : { data: null };

  const avatar = avatarRaw as StudentData["avatar"];

  const nav = [
    { href: "/eleve",              label: "Ma Cité",      icon: "🏙️" },
    { href: "/eleve/entrainement",  label: "Mon Entraînement", icon: "💪" },
    { href: "/eleve/classement",   label: "Classement",   icon: "🏆" },
    { href: "/eleve/badges",       label: "Badges",       icon: "⭐" },
    { href: "/eleve/avatar",       label: "Mon robot",    icon: "🤖" },
  ];

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
        <div className="px-3 pt-4 pb-3 flex flex-col items-start gap-0.5" style={{ borderBottom: "1px solid #1e293b" }}>
          <Link href="/eleve">
            <Logo size={90} variant="white" />
          </Link>
          <div className="text-xs font-mono tracking-widest uppercase ml-1" style={{ color: "#334155" }}>◈ Espace Élève</div>
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
        <XPBar xp={xp} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-slate-800"
              style={{ color: "#94a3b8" }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: "1px solid #1e293b" }}>
          <form action="/fr/auth/logout" method="POST">
            <button className="text-xs font-bold transition-colors w-full text-left hover:text-white" style={{ color: "#475569" }}>
              ← Déconnexion
            </button>
          </form>
        </div>
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
