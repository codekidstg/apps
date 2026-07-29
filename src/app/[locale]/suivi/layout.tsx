import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Logo from "@/components/Logo";

export default async function SuiviLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const role = user.app_metadata?.role;
  if (!["admin", "manager", "parent"].includes(role)) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string }>();

  const nav = [
    { href: "/fr/suivi",              label: "👶 Tableau de bord" },
    { href: "/fr/suivi/progression",  label: "📊 Progression" },
    { href: "/fr/suivi/certificats",  label: "🎓 Certificats" },
    { href: "/fr/suivi/abonnement",   label: "💳 Abonnement" },
    { href: "/fr/suivi/consentement", label: "✅ Consentement" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0a1020] border-r border-slate-800 flex flex-col">
        <div className="px-3 py-4 border-b border-slate-800 flex flex-col items-start gap-1">
          <Link href="/fr/suivi">
            <Logo size={80} variant="white" />
          </Link>
          <div className="text-xs font-mono text-slate-600 uppercase tracking-widest">Espace Parent</div>
          <div className="text-xs font-bold text-slate-400 truncate">{profile?.display_name ?? "Parent"}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <form action="/fr/auth/deconnexion" method="POST">
            <button className="w-full text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-8">
        {children}
      </main>
    </div>
  );
}
