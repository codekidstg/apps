import PageHeader from "@/components/backoffice/PageHeader";
import ElevesSearchTable from "./ElevesSearchTable";
import { chargerEleves } from "@/lib/backoffice/eleves";

export default async function ElevesPage() {
  const eleves = await chargerEleves();

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Élèves" subtitle={`${eleves.length} élèves enregistrés`} />
      <ElevesSearchTable students={eleves} />
    </div>
  );
}
