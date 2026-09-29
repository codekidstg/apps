import PageHeader from "@/components/backoffice/PageHeader";
import ElevesSearchTable from "@/app/[locale]/admin/utilisateurs/eleves/ElevesSearchTable";
import { chargerEleves } from "@/lib/backoffice/eleves";

export default async function ManagerElevesPage() {
  const eleves = await chargerEleves();

  return (
    <div className="max-w-7xl space-y-6">
      {/* Sept colonnes : à 1024 px la dernière passait hors écran, donc la
          seule qu'on venait lire. Un tableau de données mérite la largeur. */}
      <PageHeader title="Élèves" subtitle={`${eleves.length} élèves enregistrés`} />
      <ElevesSearchTable students={eleves} basePath="/manager/utilisateurs/eleves" />
    </div>
  );
}
