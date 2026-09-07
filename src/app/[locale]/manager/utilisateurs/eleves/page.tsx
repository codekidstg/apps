import PageHeader from "@/components/backoffice/PageHeader";
import ElevesSearchTable from "@/app/[locale]/admin/utilisateurs/eleves/ElevesSearchTable";
import { chargerEleves } from "@/lib/backoffice/eleves";

export default async function ManagerElevesPage() {
  const eleves = await chargerEleves();

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Élèves" subtitle={`${eleves.length} élèves enregistrés`} />
      <ElevesSearchTable students={eleves} basePath="/manager/utilisateurs/eleves" />
    </div>
  );
}
