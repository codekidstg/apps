import PageHeader from "@/components/backoffice/PageHeader";
import { getParentsPageData } from "@/lib/backoffice/parents";
import { STATUT_PARENT, type StatutParent } from "@/lib/backoffice/statut-parent";
import ParentsSearchList from "./ParentsSearchList";

export default async function ParentsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const { parents, studentList } = await getParentsPageData();
  const filtre = statut && statut in STATUT_PARENT ? (statut as StatutParent) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Parents" subtitle={`${parents.length} comptes parents`} />
      <ParentsSearchList parents={parents} studentList={studentList} filtreInitial={filtre} />
    </div>
  );
}
