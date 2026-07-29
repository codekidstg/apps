import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import ParentsSearchList from "./ParentsSearchList";

export default async function ParentsPage() {
  const admin = createAdminClient();

  const { data: parents } = await (admin.from("profiles") as any)
    .select("id, display_name, created_at")
    .eq("role", "parent")
    .order("display_name");

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));

  const { data: links } = await (admin.from("parent_children") as any)
    .select("parent_id, student_id, students(id, xp, level_num, profiles(id, display_name))");

  const linksByParent = new Map<string, any[]>();
  for (const l of links ?? []) {
    const arr = linksByParent.get(l.parent_id) ?? [];
    arr.push(l);
    linksByParent.set(l.parent_id, arr);
  }

  const { data: allStudents } = await (admin.from("profiles") as any)
    .select("id, display_name")
    .eq("role", "student")
    .order("display_name");
  const studentList = (allStudents ?? []).map((s: any) => ({ id: s.id, display_name: s.display_name }));

  const enriched = (parents ?? []).map((p: any) => ({
    id: p.id,
    display_name: p.display_name ?? "—",
    email: emailById.get(p.id) ?? "—",
    children: linksByParent.get(p.id) ?? [],
  }));

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Parents" subtitle={`${parents?.length ?? 0} comptes parents`} />
      <ParentsSearchList parents={enriched} studentList={studentList} />
    </div>
  );
}
