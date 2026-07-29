import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import Link from "next/link";

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: themes } = await supabase
    .from("themes")
    .select("id, title, status, level, updated_at")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  const byStatus = ((themes ?? []) as { status: string }[]).reduce<Record<string, number>>((a, t) => ({
    ...a, [t.status]: (a[t.status] ?? 0) + 1,
  }), {});

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Aperçu de vos contenus" />
      <div className="p-8 space-y-8">

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Brouillons",  key: "draft",     color: "text-gray-500" },
            { label: "Validés",     key: "validated", color: "text-brand-blue" },
            { label: "Publiés",     key: "published", color: "text-explorer" },
            { label: "Archivés",    key: "locked",    color: "text-brand-orange" },
          ].map((s) => (
            <div key={s.key} className="bg-white rounded-2xl border border-cream-border p-5">
              <div className={`font-display font-black text-4xl ${s.color}`}>{byStatus[s.key] ?? 0}</div>
              <div className="text-sm font-bold text-ink-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-border">
            <h2 className="font-display font-black text-base text-ink">Mes derniers thèmes</h2>
            <Link href="/manager/themes" className="text-xs font-extrabold text-brand-orange hover:underline">
              Voir tout →
            </Link>
          </div>
          {(themes ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center text-ink-muted font-bold text-sm">
              Aucun thème créé.{" "}
              <Link href="/manager/themes/new" className="text-brand-orange hover:underline">Créer votre premier thème</Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-border">
              {((themes ?? []) as any[]).map((t) => (
                <Link key={t.id} href={`/manager/themes/${t.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-cream transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink truncate">{t.title}</div>
                    <div className="text-xs text-ink-light capitalize">{t.level} · modifié le {new Date(t.updated_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                    t.status === "published" ? "bg-explorer-light text-explorer" :
                    t.status === "validated" ? "bg-brand-blue-light text-brand-blue" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {t.status === "draft" ? "Brouillon" : t.status === "validated" ? "Validé" : t.status === "published" ? "Publié" : "Archivé"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
