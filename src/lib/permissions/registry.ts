export interface NavPageDef {
  key: string;
  label: string;
  href: string;
  icon?: string;
  parentKey?: string;
  role: string;
}

export const NAV_PAGES: NavPageDef[] = [
  // ── Parent ───────────────────────────────────────────────────────────────────
  { role: "parent", key: "parent.dashboard",     label: "Tableau de bord",    href: "/suivi",                 icon: "🏠" },
  { role: "parent", key: "parent.progression",   label: "Suivi progression",  href: "/suivi/progression",     icon: "📊" },
  { role: "parent", key: "parent.entrainements", label: "Entraînements",      href: "/suivi/entrainements",   icon: "🏋️" },
  { role: "parent", key: "parent.certificats",   label: "Certificats",        href: "/suivi/certificats",     icon: "🎓" },
  { role: "parent", key: "parent.abonnement",    label: "Abonnement",         href: "/suivi/abonnement",      icon: "💳" },
  { role: "parent", key: "parent.contact",       label: "Contact",            href: "/suivi/contact",         icon: "✉️" },

  // ── Élève ────────────────────────────────────────────────────────────────────
  { role: "student", key: "student.suivi",        label: "Suivi / Progression",    href: "/suivi/progression",     icon: "📊" },
  { role: "student", key: "student.apprendre",    label: "Apprendre (cours)",       href: "/eleve",                 icon: "🎮" },
  { role: "student", key: "student.entrainement", label: "Entraînement",            href: "/eleve/entrainement",    icon: "🏋️" },
  { role: "student", key: "student.certificats",  label: "Certificats",             href: "/suivi/certificats",     icon: "🎓" },
  { role: "student", key: "student.abonnement",   label: "Paiement / Abonnement",   href: "/suivi/abonnement",      icon: "💳" },


  // ── Admin ────────────────────────────────────────────────────────────────────
  { role: "admin", key: "admin.dashboard",                label: "Tableau de bord",  href: "/admin",                           icon: "◈" },
  { role: "admin", key: "admin.utilisateurs",             label: "Utilisateurs",     href: "/admin/utilisateurs",              icon: "👥" },
  { role: "admin", key: "admin.utilisateurs.tous",        label: "↳ Tous",           href: "/admin/utilisateurs",              parentKey: "admin.utilisateurs" },
  { role: "admin", key: "admin.utilisateurs.parents",     label: "↳ Parents",        href: "/admin/utilisateurs/parents",      parentKey: "admin.utilisateurs" },
  { role: "admin", key: "admin.utilisateurs.eleves",      label: "↳ Élèves",         href: "/admin/utilisateurs/eleves",       parentKey: "admin.utilisateurs" },
  { role: "admin", key: "admin.utilisateurs.professeurs", label: "↳ Professeurs",    href: "/admin/utilisateurs/professeurs",  parentKey: "admin.utilisateurs" },
  { role: "admin", key: "admin.ecoles",                   label: "Écoles",           href: "/admin/ecoles",                    icon: "🏫" },
  { role: "admin", key: "admin.themes",                   label: "Thèmes & Cours",   href: "/admin/themes",                    icon: "📚" },
  { role: "admin", key: "admin.compta",                   label: "Compta",           href: "/admin/compta",                    icon: "💰" },
  { role: "admin", key: "admin.compta.mentors",           label: "↳ Mentors",        href: "/admin/compta/mentors",            parentKey: "admin.compta" },
  { role: "admin", key: "admin.compta.parents",           label: "↳ Parents",        href: "/admin/compta/parents",            parentKey: "admin.compta" },
  { role: "admin", key: "admin.compta.tresorerie",        label: "↳ Trésorerie",     href: "/admin/compta/tresorerie",         parentKey: "admin.compta" },
  { role: "admin", key: "admin.demo_parent",              label: "Démo parent",      href: "/admin/demo-parent",               icon: "🎟️" },
  { role: "admin", key: "admin.droits",                   label: "Gestion des droits", href: "/admin/droits",                  icon: "🔐" },

  // ── Manager ──────────────────────────────────────────────────────────────────
  { role: "manager", key: "manager.dashboard",                label: "Tableau de bord",  href: "/manager",                           icon: "◈" },
  { role: "manager", key: "manager.utilisateurs",             label: "Utilisateurs",     href: "/manager/utilisateurs",              icon: "👥" },
  { role: "manager", key: "manager.utilisateurs.tous",        label: "↳ Tous",           href: "/manager/utilisateurs",              parentKey: "manager.utilisateurs" },
  { role: "manager", key: "manager.utilisateurs.parents",     label: "↳ Parents",        href: "/manager/utilisateurs/parents",      parentKey: "manager.utilisateurs" },
  { role: "manager", key: "manager.utilisateurs.eleves",      label: "↳ Élèves",         href: "/manager/utilisateurs/eleves",       parentKey: "manager.utilisateurs" },
  { role: "manager", key: "manager.utilisateurs.professeurs", label: "↳ Professeurs",    href: "/manager/utilisateurs/professeurs",  parentKey: "manager.utilisateurs" },
  { role: "manager", key: "manager.themes",                   label: "Mes thèmes",       href: "/manager/themes",                    icon: "📚" },
  { role: "manager", key: "manager.affectations",             label: "Affectations",     href: "/manager/affectations",              icon: "📋" },
  { role: "manager", key: "manager.compta",                   label: "Compta",           href: "/manager/compta",                    icon: "💰" },
  { role: "manager", key: "manager.compta.mentors",           label: "↳ Mentors",        href: "/manager/compta/mentors",            parentKey: "manager.compta" },
  { role: "manager", key: "manager.compta.parents",           label: "↳ Parents",        href: "/manager/compta/parents",            parentKey: "manager.compta" },
  { role: "manager", key: "manager.compta.tresorerie",        label: "↳ Trésorerie",     href: "/manager/compta/tresorerie",         parentKey: "manager.compta" },

  // ── Teacher ──────────────────────────────────────────────────────────────────
  { role: "teacher", key: "teacher.dashboard",    label: "Tableau de bord",  href: "/prof",             icon: "◈" },
  { role: "teacher", key: "teacher.planning",     label: "Mon planning",     href: "/prof/planning",    icon: "📅" },
  { role: "teacher", key: "teacher.rapports",     label: "Mes rapports",     href: "/prof/rapports",    icon: "📝" },
  { role: "teacher", key: "teacher.cours",        label: "Mes cours",        href: "/prof/cours",       icon: "📚" },
  { role: "teacher", key: "teacher.classes",      label: "Mes classes",      href: "/prof/classes",     icon: "👨‍🏫" },
  { role: "teacher", key: "teacher.certificats",  label: "Certificats",      href: "/prof/certificats", icon: "🎓" },
];

export const PAGES_BY_ROLE: Record<string, NavPageDef[]> = {
  admin:   NAV_PAGES.filter(p => p.role === "admin"),
  manager: NAV_PAGES.filter(p => p.role === "manager"),
  teacher: NAV_PAGES.filter(p => p.role === "teacher"),
  parent:  NAV_PAGES.filter(p => p.role === "parent"),
  student: NAV_PAGES.filter(p => p.role === "student"),
};

export const PAGE_BY_KEY: Record<string, NavPageDef> = Object.fromEntries(
  NAV_PAGES.map(p => [p.key, p])
);
