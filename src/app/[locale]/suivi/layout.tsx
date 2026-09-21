import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Logo from "@/components/Logo";
import { SuiviSidebarNav, SuiviBottomNav, type NavItem } from "./SuiviNav";
import PushPermission from "@/components/PushPermission";
import { getEffectiveNavPermissions } from "@/lib/permissions/access";
import { PAGES_BY_ROLE } from "@/lib/permissions/registry";
import { compterReponsesNonVues } from "@/lib/contact/parent";
import { noterActiviteParent } from "@/lib/parents/activite";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";

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

  // Le menu se construit à partir du registre filtré par les droits, comme
  // celui du prof et du manager. Les pages elles-mêmes appliquent déjà
  // requireParentPermission : un admin ou un manager qui visite /suivi voit
  // donc exactement les entrées auxquelles le parent a droit.
  const [allowedKeys, reponsesNonVues] = await Promise.all([
    getEffectiveNavPermissions(user.id, "parent"),
    // La pastille « Contact » : une réponse de la direction pas encore lue.
    role === "parent" ? compterReponsesNonVues(user.id) : Promise.resolve(0),
    // La visite du parent, au plus une par heure. Un admin ou un manager qui
    // regarde l'espace parent n'est pas un parent : il n'est pas compté.
    role === "parent" ? noterActiviteParent(user.id, "visite") : Promise.resolve(),
  ]);
  const items: NavItem[] = (PAGES_BY_ROLE["parent"] ?? [])
    .filter(p => allowedKeys.has(p.key))
    .map(p => ({
      key:        p.key,
      label:      p.label,
      shortLabel: p.shortLabel ?? p.label,
      icon:       p.icon ?? "•",
      href:       `/${locale}${p.href}`,
      ...(p.key === "parent.contact" && reponsesNonVues > 0 ? { badge: reponsesNonVues } : {}),
    }));

  const bottomKeys = new Set(
    (PAGES_BY_ROLE["parent"] ?? []).filter(p => p.bottomNav).map(p => p.key)
  );
  const bottomItems = items.filter(i => bottomKeys.has(i.key)).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 shrink-0 bg-[#0a1020] border-r border-slate-800 flex-col">
        <div className="px-3 py-4 border-b border-slate-800 flex flex-col items-start gap-1">
          {/* En haut, à côté du logo, comme dans les autres espaces : tout en
              bas de la barre, en gris sur noir, on ne le voyait pas. */}
          <div className="w-full flex items-center justify-between gap-2">
            <Link href={`/${locale}/suivi`}>
              <Logo size={80} variant="white" />
            </Link>
            <BoutonDeconnexion />
          </div>
          <div className="text-xs font-mono text-slate-600 uppercase tracking-widest">Espace Parent</div>
          <div className="text-xs font-bold text-slate-400 truncate">{profile?.display_name ?? "Parent"}</div>
        </div>

        <SuiviSidebarNav items={items} />
      </aside>

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-[#0a1020] border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <Link href={`/${locale}/suivi`}>
          <Logo size={64} variant="white" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          {/* Le nom se raccourcit avant le bouton : sur un petit téléphone,
              « Se déconnecter » doit rester lisible en entier. */}
          <div className="text-right min-w-0">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Espace Parent</div>
            <div className="text-xs font-bold text-slate-400 truncate max-w-[110px]">{profile?.display_name ?? "Parent"}</div>
          </div>
          {/* La barre latérale est masquée sur téléphone : sans ce bouton, un
              parent sur mobile n'avait aucun moyen de se déconnecter. */}
          <BoutonDeconnexion />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <SuiviBottomNav items={bottomItems} />

      {/* Push notifications — demande permission au parent */}
      <PushPermission />
    </div>
  );
}
