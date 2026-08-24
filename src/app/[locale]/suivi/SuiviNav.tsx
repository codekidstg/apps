"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Une entrée de menu déjà résolue par le serveur : lien localisé, libellés,
 * et surtout déjà filtrée par les droits. Ce composant n'a plus sa propre
 * liste — c'est précisément la liste en dur qui faisait apparaître des pages
 * désactivées dans /admin/droits.
 */
export type NavItem = {
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  href: string;
};

function useIsActive() {
  const pathname = usePathname();
  // /suivi est le préfixe de toutes les autres pages : seule l'égalité stricte
  // peut l'allumer, sinon le tableau de bord resterait actif partout.
  return (item: NavItem) =>
    pathname === item.href ||
    (item.key !== "parent.dashboard" && pathname.startsWith(item.href));
}

export function SuiviSidebarNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav className="flex-1 p-3 space-y-1">
      {items.map((n) => {
        const active = isActive(n);
        return (
          <Link
            key={n.key}
            href={n.href}
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

export function SuiviBottomNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1020] border-t border-slate-800 flex md:hidden safe-bottom">
      {items.map((n) => {
        const active = isActive(n);
        return (
          <Link
            key={n.key}
            href={n.href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              active ? "text-blue-400" : "text-slate-500"
            }`}
          >
            <span className="text-xl leading-none">{n.icon}</span>
            <span className="text-[10px] font-bold truncate max-w-full px-1">{n.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
