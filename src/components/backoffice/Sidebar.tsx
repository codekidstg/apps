"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Role } from "@/lib/supabase/types";
import { logout } from "@/app/[locale]/auth/actions";
import Logo from "@/components/Logo";

type SubItem = { label: string; href: string; pageKey?: string };
type NavItem = { label: string; href: string; icon: string; pageKey?: string; children?: SubItem[] };

const adminNav: NavItem[] = [
  { label: "Tableau de bord", href: "/admin",              icon: "◈",  pageKey: "admin.dashboard" },
  {
    label: "Utilisateurs",    href: "/admin/utilisateurs", icon: "👥", pageKey: "admin.utilisateurs",
    children: [
      { label: "Tous",         href: "/admin/utilisateurs",              pageKey: "admin.utilisateurs.tous" },
      { label: "Parents",      href: "/admin/utilisateurs/parents",      pageKey: "admin.utilisateurs.parents" },
      { label: "Élèves",       href: "/admin/utilisateurs/eleves",       pageKey: "admin.utilisateurs.eleves" },
      { label: "Professeurs",  href: "/admin/utilisateurs/professeurs",  pageKey: "admin.utilisateurs.professeurs" },
    ],
  },
  { label: "Écoles",           href: "/admin/ecoles",       icon: "🏫", pageKey: "admin.ecoles" },
  { label: "Thèmes & Cours",   href: "/admin/themes",       icon: "📚", pageKey: "admin.themes" },
  {
    label: "Compta",           href: "/admin/compta",       icon: "💰", pageKey: "admin.compta",
    children: [
      { label: "Mentors",      href: "/admin/compta/mentors",    pageKey: "admin.compta.mentors" },
      { label: "Parents",      href: "/admin/compta/parents",    pageKey: "admin.compta.parents" },
      { label: "Trésorerie",   href: "/admin/compta/tresorerie", pageKey: "admin.compta.tresorerie" },
    ],
  },
  { label: "Atelier",          href: "/admin/atelier",      icon: "🎓", pageKey: "admin.atelier" },
  { label: "Gestion des droits", href: "/admin/droits",     icon: "🔐", pageKey: "admin.droits" },
];

const managerNav: NavItem[] = [
  { label: "Tableau de bord", href: "/manager",              icon: "◈",  pageKey: "manager.dashboard" },
  {
    label: "Utilisateurs",    href: "/manager/utilisateurs", icon: "👥", pageKey: "manager.utilisateurs",
    children: [
      { label: "Tous",        href: "/manager/utilisateurs",              pageKey: "manager.utilisateurs.tous" },
      { label: "Parents",     href: "/manager/utilisateurs/parents",      pageKey: "manager.utilisateurs.parents" },
      { label: "Élèves",      href: "/manager/utilisateurs/eleves",       pageKey: "manager.utilisateurs.eleves" },
      { label: "Professeurs", href: "/manager/utilisateurs/professeurs",  pageKey: "manager.utilisateurs.professeurs" },
    ],
  },
  { label: "Mes thèmes",      href: "/manager/themes",       icon: "📚", pageKey: "manager.themes" },
  { label: "Affectations",    href: "/manager/affectations",  icon: "📋", pageKey: "manager.affectations" },
  {
    label: "Compta",          href: "/manager/compta",       icon: "💰", pageKey: "manager.compta",
    children: [
      { label: "Mentors",      href: "/manager/compta/mentors",    pageKey: "manager.compta.mentors" },
      { label: "Parents",      href: "/manager/compta/parents",    pageKey: "manager.compta.parents" },
      { label: "Trésorerie",   href: "/manager/compta/tresorerie", pageKey: "manager.compta.tresorerie" },
    ],
  },
  { label: "Atelier",         href: "/atelier/lecon",        icon: "🎓", pageKey: "manager.atelier" },
];

const teacherNav: NavItem[] = [
  { label: "Tableau de bord", href: "/prof",              icon: "◈",  pageKey: "teacher.dashboard" },
  { label: "Mon planning",    href: "/prof/planning",     icon: "📅", pageKey: "teacher.planning" },
  { label: "Mes rapports",    href: "/prof/rapports",     icon: "📝", pageKey: "teacher.rapports" },
  { label: "Mes cours",       href: "/prof/cours",        icon: "📚", pageKey: "teacher.cours" },
  { label: "Mes classes",     href: "/prof/classes",      icon: "👨‍🏫", pageKey: "teacher.classes" },
  { label: "Certificats",     href: "/prof/certificats",  icon: "🎓", pageKey: "teacher.certificats" },
  { label: "Atelier",         href: "/atelier/lecon",     icon: "🎓", pageKey: "teacher.atelier" },
];

const roleLabel: Record<string, string> = {
  admin:   "Administrateur",
  manager: "Manager",
  teacher: "Professeur",
};

type Props = { role: Role; displayName: string; hiddenKeys?: string[] };

export default function Sidebar({ role, displayName, hiddenKeys = [] }: Props) {
  const pathname = usePathname();
  const hidden   = new Set(hiddenKeys);
  const rawNav   = role === "admin" ? adminNav : role === "manager" ? managerNav : teacherNav;
  const locale   = pathname.split("/")[1] || "fr";
  const homeHref = `/${locale}/${role === "admin" ? "admin" : role === "manager" ? "manager" : "prof"}`;

  // Filter nav based on hidden keys (admin always sees all)
  const nav: NavItem[] = role === "admin"
    ? rawNav
    : rawNav
        .filter(item => !item.pageKey || !hidden.has(item.pageKey))
        .map(item => ({
          ...item,
          children: item.children?.filter(sub => !sub.pageKey || !hidden.has(sub.pageKey)),
        }));

  function isActive(href: string) {
    if (href === "/admin" || href === "/manager" || href === "/prof") return pathname.endsWith(href);
    return pathname.includes(href);
  }

  function isExactActive(href: string) {
    const stripped = pathname.replace(/^\/[a-z]{2}/, "");
    return stripped === href;
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full" style={{ background: "#1B2D5E" }}>
      {/* Logo + logout */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href={homeHref}>
          <Logo size={90} variant="white" />
        </Link>
        <form action={logout}>
          <button
            type="submit"
            title="Déconnexion"
            className="text-xs font-bold px-2 py-1.5 rounded-lg transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
          >
            ⎋ Exit
          </button>
        </form>
      </div>

      {/* Identité */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0" style={{ background: "#FDB813", color: "#1B2D5E" }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-white text-sm font-black truncate leading-tight">{displayName}</div>
          <div className="text-xs font-bold leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>{roleLabel[role] ?? role}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {nav.map((item) => {
          const active = isActive(item.href);
          const hasChildren = !!item.children?.length;
          const expanded = hasChildren && active;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  active ? "" : "hover:text-white"
                }`}
                style={active
                  ? { background: "#FDB813", color: "#1B2D5E" }
                  : { color: "rgba(255,255,255,0.55)" }
                }
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {hasChildren && (
                  <span style={{ fontSize: 10, opacity: 0.6 }}>{expanded ? "▲" : "▼"}</span>
                )}
              </Link>

              {expanded && item.children && (
                <div className="ml-8 mt-1 flex flex-col gap-0.5">
                  {item.children.map((sub) => {
                    const subActive = isExactActive(sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={subActive
                          ? { color: "#FDB813" }
                          : { color: "rgba(255,255,255,0.45)" }
                        }
                      >
                        <span style={{ fontSize: 8, color: subActive ? "#FDB813" : "rgba(255,255,255,0.25)" }}>●</span>
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
