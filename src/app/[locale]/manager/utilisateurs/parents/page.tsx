import PageHeader from "@/components/backoffice/PageHeader";
import { getParentsPageData } from "@/lib/backoffice/parents";
import ParentsSearchList from "@/app/[locale]/admin/utilisateurs/parents/ParentsSearchList";

export default async function ManagerParentsPage() {
  const { parents, studentList } = await getParentsPageData();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Parents" subtitle={`${parents.length} comptes parents`} />
      <ParentsSearchList parents={parents} studentList={studentList} />
    </div>
  );
}
