import PageHeader from "@/components/backoffice/PageHeader";
import { getParentsPageData } from "@/lib/backoffice/parents";
import { STATUT_PARENT, type StatutParent } from "@/lib/backoffice/statut-parent";
import { construireRelances } from "@/lib/backoffice/relance-parent";
import ParentsSearchList from "@/app/[locale]/admin/utilisateurs/parents/ParentsSearchList";

export default async function ManagerParentsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const { parents, studentList } = await getParentsPageData();
  const filtre = statut && statut in STATUT_PARENT ? (statut as StatutParent) : null;

  // Les deux messages de relance sont écrits ici, une fois, à partir de ce que
  // les enfants ont réellement fait — pas dans le navigateur, qui n'a ni les
  // leçons terminées ni les programmes partagés.
  const relances = await construireRelances(
    parents.map((p) => ({
      id: p.id,
      nom: p.display_name,
      email: p.email,
      enfants: p.children
        .filter((c) => c.students?.profiles)
        .map((c) => ({ id: c.students!.id, nom: c.students!.profiles!.display_name })),
    })),
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Parents" subtitle={`${parents.length} comptes parents`} />
      <ParentsSearchList parents={parents} studentList={studentList} relances={relances} filtreInitial={filtre} />
    </div>
  );
}
