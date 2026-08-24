import { createAdminClient } from "@/lib/supabase/server";

/**
 * Données de l'écran « Parents », partagées par /admin et /manager.
 *
 * Les deux pages en avaient chacune leur copie. Elles ont divergé sur un seul
 * caractère : la version manager demandait `profiles(...)` sans préciser par
 * quelle clé passer. Or `students` référence `profiles` deux fois — par
 * `profile_id` (l'élève) et par `teacher_id` (son prof). PostgREST refuse alors
 * la requête, l'erreur n'était pas lue, et tous les parents s'affichaient avec
 * « 0 enfant » côté manager alors que la liaison existait bien.
 *
 * Un seul chargement pour les deux écrans : la question ne peut plus se reposer.
 */
/**
 * `xp` et `level_num` sont normalisés ici : la liste les affiche tels quels et
 * un null s'y écrirait « null XP ». Les anciennes pages passaient par `any`,
 * ce qui masquait le problème au lieu de le régler.
 */
export type ParentChild = {
  parent_id: string;
  student_id: string;
  students: {
    id: string;
    xp: number;
    level_num: number;
    profiles: { id: string; display_name: string } | null;
  } | null;
};

export type ParentRow = {
  id: string;
  display_name: string;
  email: string;
  children: ParentChild[];
};

export async function getParentsPageData(): Promise<{
  parents: ParentRow[];
  studentList: { id: string; display_name: string }[];
}> {
  const admin = createAdminClient();

  const [
    { data: parents, error: errParents },
    { data: authList },
    { data: links, error: errLinks },
    { data: allStudents, error: errStudents },
  ] = await Promise.all([
    (admin.from("profiles") as any)
      .select("id, display_name, created_at").eq("role", "parent").order("display_name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    // `!profile_id` est obligatoire : sans lui la requête entière est rejetée.
    (admin.from("parent_children") as any)
      .select("parent_id, student_id, students(id, xp, level_num, profiles!profile_id(id, display_name))"),
    (admin.from("profiles") as any)
      .select("id, display_name").eq("role", "student").order("display_name"),
  ]);

  // Une erreur ici vidait silencieusement l'écran. Elle doit au moins se voir.
  for (const [quoi, err] of [["parents", errParents], ["liaisons", errLinks], ["élèves", errStudents]] as const) {
    if (err) console.error(`Écran Parents — ${quoi} :`, err.message);
  }

  const emailById = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));

  const linksByParent = new Map<string, ParentChild[]>();
  for (const l of (links ?? []) as any[]) {
    const arr = linksByParent.get(l.parent_id) ?? [];
    arr.push({
      parent_id:  l.parent_id,
      student_id: l.student_id,
      students: l.students
        ? {
            id:        l.students.id,
            xp:        l.students.xp ?? 0,
            level_num: l.students.level_num ?? 1,
            profiles:  l.students.profiles ?? null,
          }
        : null,
    });
    linksByParent.set(l.parent_id, arr);
  }

  return {
    parents: (parents ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name ?? "—",
      email: emailById.get(p.id) ?? "—",
      children: linksByParent.get(p.id) ?? [],
    })),
    studentList: (allStudents ?? []).map((s: any) => ({ id: s.id, display_name: s.display_name })),
  };
}
