import { logout } from "@/app/[locale]/auth/actions";
import type { Role } from "@/lib/supabase/types";

const ROLE_LABELS: Record<Role, string> = {
  admin:   "Administration",
  manager: "Manager",
  teacher: "Professeur",
  student: "Élève",
  parent:  "Parent",
};

const ROLE_COLORS: Record<Role, string> = {
  admin:   "bg-red-100 text-red-800",
  manager: "bg-purple-100 text-purple-800",
  teacher: "bg-blue-100 text-blue-800",
  student: "bg-emerald-100 text-emerald-800",
  parent:  "bg-orange-100 text-orange-800",
};

export default function DashboardShell({
  role,
  displayName,
  children,
}: {
  role: Role;
  displayName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Barre supérieure */}
      <header className="bg-white border-b border-stone-200 px-6 h-14 flex items-center justify-between">
        <div className="font-display font-extrabold text-lg">
          <span className="text-brand-orange">Code</span>
          <span className="text-brand-blue">Kids</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
          <span className="text-sm text-ink-muted">{displayName}</span>
          <form action={logout}>
            <button type="submit" className="text-sm text-ink-muted hover:text-ink transition-colors">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
