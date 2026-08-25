import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import UsersSearchTable from "@/app/[locale]/admin/utilisateurs/UsersSearchTable";
import CreateUserForm from "@/app/[locale]/admin/utilisateurs/CreateUserForm";
import LinkParentForm from "@/app/[locale]/admin/utilisateurs/LinkParentForm";

export default async function ManagerUtilisateursPage() {
  const admin = createAdminClient();

  const { data: users } = await (admin.from("profiles") as any)
    .select("*, schools(name)")
    .order("created_at", { ascending: false });

  const { data: schools } = await (admin.from("schools") as any).select("id, name").order("name");

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map<string, string>(
    (authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""])
  );

  const enriched = (users ?? []).map((u: any) => ({
    ...u,
    email: emailById.get(u.id) ?? "",
    temp_password: u.temp_password ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users?.length ?? 0} comptes enregistrés`}
        actions={
          <div className="flex gap-2">
            <LinkParentForm users={(users ?? []).map((u: any) => ({ id: u.id, display_name: u.display_name ?? "", role: u.role }))} />
            <CreateUserForm schools={schools ?? []} viewerRole="manager" />
          </div>
        }
      />
      <div className="p-8">
        <UsersSearchTable users={enriched} canDelete={false} viewerRole="manager" />
      </div>
    </div>
  );
}
