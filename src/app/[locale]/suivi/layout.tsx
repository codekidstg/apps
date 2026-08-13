import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Logo from "@/components/Logo";
import { SuiviSidebarNav, SuiviBottomNav } from "./SuiviNav";
import PushPermission from "@/components/PushPermission";

export default async function SuiviLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const role = user.app_metadata?.role;
  if (!["admin", "manager", "parent"].includes(role)) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string }>();

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 shrink-0 bg-[#0a1020] border-r border-slate-800 flex-col">
        <div className="px-3 py-4 border-b border-slate-800 flex flex-col items-start gap-1">
          <Link href={`/${locale}/suivi`}>
            <Logo size={80} variant="white" />
          </Link>
          <div className="text-xs font-mono text-slate-600 uppercase tracking-widest">Espace Parent</div>
          <div className="text-xs font-bold text-slate-400 truncate">{profile?.display_name ?? "Parent"}</div>
        </div>

        <SuiviSidebarNav locale={locale} />

        <div className="p-4 border-t border-slate-800">
          <form action={`/${locale}/auth/deconnexion`} method="POST">
            <button className="w-full text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-[#0a1020] border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <Link href={`/${locale}/suivi`}>
          <Logo size={64} variant="white" />
        </Link>
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Espace Parent</div>
          <div className="text-xs font-bold text-slate-400 truncate max-w-[140px]">{profile?.display_name ?? "Parent"}</div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <SuiviBottomNav locale={locale} />

      {/* Push notifications — demande permission au parent */}
      <PushPermission />
    </div>
  );
}
