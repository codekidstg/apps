import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import DataTable from "@/components/backoffice/DataTable";
import StatusBadge, { LevelBadge } from "@/components/backoffice/StatusBadge";
import type { ContentStatus } from "@/lib/supabase/types";

export default async function ManagerThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  let query = (supabase.from("themes") as any)
    .select("id, title, level, status, version, updated_at")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: themes } = await query as { data: any[] | null };

  const statuses = [
    { key: "", label: "Tous" },
    { key: "draft",     label: "Brouillons" },
    { key: "validated", label: "Validés" },
    { key: "published", label: "Publiés" },
    { key: "locked",    label: "Archivés" },
  ];

  return (
    <div>
      <PageHeader
        title="Mes thèmes"
        subtitle={`${themes?.length ?? 0} thème(s)`}
        actions={
          <Link
            href="/manager/themes/new"
            className="bg-brand-orange text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors"
          >
            + Nouveau thème
          </Link>
        }
      />

      <div className="px-8 pt-6 pb-2 flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <a
            key={s.key}
            href={s.key ? `?status=${s.key}` : "?"}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-colors ${
              (status ?? "") === s.key
                ? "bg-brand-blue text-white border-brand-blue"
                : "bg-white text-ink-muted border-cream-border hover:border-brand-blue"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="p-8 pt-4">
        <DataTable
          data={themes ?? []}
          emptyText="Aucun thème. Créez votre premier thème !"
          columns={[
            {
              key: "title", label: "Titre",
              render: (t) => (
                <Link href={`/manager/themes/${t.id}`} className="group">
                  <div className="font-bold text-ink group-hover:text-brand-orange transition-colors">{t.title}</div>
                  <div className="text-xs text-ink-light">Version {t.version}</div>
                </Link>
              ),
            },
            {
              key: "level", label: "Niveau", width: "130px",
              render: (t) => <LevelBadge level={t.level} />,
            },
            {
              key: "status", label: "Statut", width: "120px",
              render: (t) => <StatusBadge status={t.status as ContentStatus} />,
            },
            {
              key: "updated_at", label: "Modifié", width: "110px",
              render: (t) => (
                <span className="text-xs text-ink-light">
                  {new Date(t.updated_at).toLocaleDateString("fr-FR")}
                </span>
              ),
            },
            {
              key: "actions", label: "", width: "80px",
              render: (t) => (
                <Link
                  href={`/manager/themes/${t.id}`}
                  className="text-xs font-extrabold text-brand-orange hover:underline"
                >
                  Ouvrir →
                </Link>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
