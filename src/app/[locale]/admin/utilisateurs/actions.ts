"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/supabase/types";

export async function createUser(formData: FormData) {
  const email       = formData.get("email") as string;
  const password    = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const role        = formData.get("role") as Role;
  const schoolId    = formData.get("school_id") as string | null;

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { display_name: displayName },
  });

  if (error) return { error: error.message };

  // Update profile (créé automatiquement par le trigger handle_new_user).
  // Le trigger lit raw_user_meta_data->>'role' mais on envoie app_metadata,
  // donc on corrige role explicitement ici.
  await (admin.from("profiles") as any).update({
    display_name: displayName,
    role: role || "student",
    school_id: schoolId || null,
  }).eq("id", data.user.id);

  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function updateUserRole(userId: string, role: Role) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (error) return { error: error.message };
  await (admin.from("profiles") as any).update({ role }).eq("id", userId);
  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function linkParentToStudent(parentProfileId: string, studentProfileId: string) {
  const admin = createAdminClient();

  // Récupérer le student.id depuis profile_id
  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", studentProfileId)
    .single<{ id: string }>();

  if (!student) return { error: "Élève introuvable — s'assurer que le profil élève existe" };

  const { error } = await (admin.from("parent_children") as any).upsert({
    parent_id:  parentProfileId,
    student_id: student.id,
    linked_by:  null,
  }, { onConflict: "parent_id,student_id" });

  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function resetUserPassword(userId: string, password: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function unlinkParentFromStudent(parentId: string, studentId: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("parent_children") as any)
    .delete()
    .eq("parent_id", parentId)
    .eq("student_id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/parents");
  return { success: true };
}

export async function setStudentLevel(studentId: string, levelNum: number) {
  const admin = createAdminClient();
  const { error } = await (admin.from("students") as any)
    .update({ level_num: levelNum })
    .eq("id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/eleves");
  return { success: true };
}

export async function assignTeacherToStudent(studentId: string, teacherProfileId: string | null) {
  const admin = createAdminClient();
  const { error } = await (admin.from("students") as any)
    .update({ teacher_id: teacherProfileId })
    .eq("id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/professeurs");
  return { success: true };
}

export async function toggleUserActive(userId: string, active: boolean) {
  const admin = createAdminClient();
  await (admin.from("profiles") as any).update({ active }).eq("id", userId);
  // Disable/enable via Supabase auth
  if (!active) {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });
  } else {
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  }
  revalidatePath("/admin/utilisateurs");
  return { success: true };
}
