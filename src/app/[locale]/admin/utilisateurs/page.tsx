import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PageHeader from "@/components/backoffice/PageHeader";
import CreateUserForm from "./CreateUserForm";
import LinkParentForm from "./LinkParentForm";
import UsersSearchTable from "./UsersSearchTable";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  schools: { name: string } | null;
};

export default async function UtilisateursPage() {
  const supabase = await createClient();

  const admin = createAdminClient();
  const [{ data: users }, { data: schools }, { data: authList }] = await Promise.all([
    supabase.from("profiles").select("*, schools(name)").order("created_at", { ascending: false }).returns<Profile[]>(),
    supabase.from("schools").select("id, name").order("name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailById = new Map<string, string>(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const enriched = (users ?? []).map((u) => ({
    ...u,
    email: emailById.get(u.id) ?? "",
    temp_password: (u as any).temp_password ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users?.length ?? 0} comptes enregistrés`}
        actions={
          <div className="flex gap-2">
            <a
              href="/api/admin/export/utilisateurs"
              download
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              ⬇ CSV
            </a>
            <LinkParentForm users={(users ?? []).map((u) => ({ id: u.id, display_name: u.display_name ?? "", role: u.role }))} />
            <CreateUserForm schools={schools ?? []} />
          </div>
        }
      />
      <div className="p-8">
        <UsersSearchTable users={enriched} />
      </div>
    </div>
  );
}
