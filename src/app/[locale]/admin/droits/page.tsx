import { getDroitsPageData } from "@/lib/permissions/access";
import PageHeader from "@/components/backoffice/PageHeader";
import DroitsClient from "./DroitsClient";

export default async function DroitsPage() {
  const { allRoleConfigs, allUserOverrides, users } = await getDroitsPageData();

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="Gestion des droits"
        subtitle="Contrôlez l'accès aux pages par rôle et par utilisateur"
      />
      <div className="mt-6">
        <DroitsClient
          allRoleConfigs={allRoleConfigs}
          allUserOverrides={allUserOverrides}
          users={users}
        />
      </div>
    </div>
  );
}
