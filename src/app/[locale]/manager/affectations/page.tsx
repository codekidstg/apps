import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import DataTable from "@/components/backoffice/DataTable";
import NewAssignmentForm from "./NewAssignmentForm";

type Assignment = {
  id: string;
  scheduled_at: string | null;
  themes: { title: string; level: string } | null;
  classes: { name: string } | null;
  profiles: { display_name: string } | null;
  created_at: string;
};

export default async function AffectationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [assignmentsRes, themesRes, classesRes, teachersRes] = await Promise.all([
    supabase
      .from("theme_assignments")
      .select("id, scheduled_at, created_at, themes(title, level), classes(name), profiles!teacher_id(display_name)")
      .order("created_at", { ascending: false })
      .returns<Assignment[]>(),
    supabase.from("themes").select("id, title, level").eq("status", "published").order("title"),
    supabase.from("classes").select("id, name").order("name"),
    supabase.from("profiles").select("id, display_name").eq("role", "teacher").order("display_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Affectations"
        subtitle="Assigner un thème publié à une classe"
        actions={
          <NewAssignmentForm
            themes={themesRes.data ?? []}
            classes={classesRes.data ?? []}
            teachers={teachersRes.data ?? []}
          />
        }
      />
      <div className="p-8">
        <DataTable
          data={assignmentsRes.data ?? []}
          emptyText="Aucune affectation enregistrée."
          columns={[
            {
              key: "theme", label: "Thème",
              render: (a) => (
                <div>
                  <div className="font-bold text-ink">{a.themes?.title ?? "—"}</div>
                  <div className="text-xs text-ink-light capitalize">{a.themes?.level ?? ""}</div>
                </div>
              ),
            },
            {
              key: "class", label: "Classe",
              render: (a) => <span className="font-bold text-ink">{a.classes?.name ?? "—"}</span>,
            },
            {
              key: "teacher", label: "Professeur",
              render: (a) => <span className="text-sm text-ink-muted">{a.profiles?.display_name ?? "—"}</span>,
            },
            {
              key: "scheduled_at", label: "Prévu le", width: "120px",
              render: (a) => (
                <span className="text-xs text-ink-light">
                  {a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString("fr-FR") : "—"}
                </span>
              ),
            },
            {
              key: "created_at", label: "Créé le", width: "110px",
              render: (a) => (
                <span className="text-xs text-ink-light">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
