import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import DemoParentClient from "./DemoParentClient";

export default async function DemoParentPage() {
  const admin = createAdminClient();

  const { data: students } = await (admin.from("students") as any)
    .select("id, atelier_active, profile_id, profiles!profile_id(display_name)")
    .order("id");

  const rows = (students ?? []).map((s: any) => ({
    id:            s.id as string,
    atelier_active: s.atelier_active as boolean,
    name:          s.profiles?.display_name ?? "—",
  }));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Démo parent"
        subtitle="Active la séance atelier gratuite pour un élève. Il verra un menu « Séance offerte » dans son espace."
      />
      <DemoParentClient students={rows} />
    </div>
  );
}
