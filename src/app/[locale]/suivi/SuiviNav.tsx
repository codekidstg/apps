"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { key: "suivi",           label: "Accueil",        icon: "🏠", href: (l: string) => `/${l}/suivi` },
  { key: "progression",     label: "Progression",    icon: "📊", href: (l: string) => `/${l}/suivi/progression` },
  { key: "entrainements",   label: "Entraînements",  icon: "💪", href: (l: string) => `/${l}/suivi/entrainements` },
  { key: "certificats",     label: "Certificats",    icon: "🎓", href: (l: string) => `/${l}/suivi/certificats` },
  { key: "abonnement",      label: "Abonnement",     icon: "💳", href: (l: string) => `/${l}/suivi/abonnement` },
  { key: "consentement",    label: "Consentement",   icon: "✅", href: (l: string) => `/${l}/suivi/consentement` },
  { key: "contact",         label: "Contact",        icon: "✉️", href: (l: string) => `/${l}/suivi/contact` },
];

export function SuiviSidebarNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1">
      {NAV.map((n) => {
        const href = n.href(locale);
        const active = pathname === href || (n.key !== "suivi" && pathname.startsWith(href));
        return (
          <Link
            key={n.key}
            href={href}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              active
                ? "bg-blue-900/50 text-white border border-blue-700/40"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="text-base">{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SuiviBottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  // Show only 5 items on bottom bar (most used)
  const BOTTOM = NAV.filter((n) => ["suivi", "progression", "entrainements", "certificats", "contact"].includes(n.key));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1020] border-t border-slate-800 flex md:hidden safe-bottom">
      {BOTTOM.map((n) => {
        const href = n.href(locale);
        const active = pathname === href || (n.key !== "suivi" && pathname.startsWith(href));
        return (
          <Link
            key={n.key}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              active ? "text-blue-400" : "text-slate-500"
            }`}
          >
            <span className="text-xl leading-none">{n.icon}</span>
            <span className="text-[10px] font-bold truncate max-w-full px-1">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
