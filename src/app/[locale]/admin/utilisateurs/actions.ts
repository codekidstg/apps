"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/supabase/types";
import { sendWelcomeEmail } from "@/lib/email";
import { slugFromNum } from "@/lib/levels";

/**
 * Garde d'accès à la gestion des utilisateurs.
 *
 * Ces actions écrivent avec le client service-role. Une server action est un
 * point d'entrée réseau appelable directement : masquer un bouton ne protège
 * rien, la règle doit être ici. Elles n'avaient aucun contrôle — n'importe
 * quelle session authentifiée pouvait fixer un mot de passe sur le compte
 * admin, puis s'y connecter.
 *
 * Règle : admin et manager gèrent les utilisateurs ; un manager ne touche
 * jamais à un compte admin et ne peut pas attribuer le rôle admin — sans quoi
 * il lui suffirait de se créer un compte admin pour contourner la première
 * moitié de la règle.
 */
type Appelant = { id: string; role: Role };

async function appelant(): Promise<Appelant | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single<{ role: Role }>();
  if (profile?.role !== "admin" && profile?.role !== "manager") return null;
  return { id: user.id, role: profile.role };
}

/**
 * Retour commun à toutes ces actions. Sans type explicite, TypeScript infère
 * une union dont certaines branches n'ont pas de `error`, et les appelants qui
 * testent `res.error` ne compilent plus.
 */
type Resultat = { error?: string; success?: boolean };

const REFUS_ADMIN: Resultat = { error: "Un manager ne peut pas agir sur un compte administrateur." };
const REFUS_ROLE:  Resultat = { error: "Un manager ne peut pas attribuer le rôle administrateur." };

/** Rôle actuel d'un compte cible, lu avec le service-role. */
async function roleDe(userId: string): Promise<Role | null> {
  const admin = createAdminClient();
  const { data } = await (admin.from("profiles") as any)
    .select("role").eq("id", userId).maybeSingle();
  return (data?.role as Role) ?? null;
}

/** Le compte cible est-il hors de portée de cet appelant ? */
async function cibleInterdite(qui: Appelant, userId: string): Promise<boolean> {
  if (qui.role === "admin") return false;
  return (await roleDe(userId)) === "admin";
}

/**
 * Crée la ligne `students` d'un profil élève si elle manque.
 *
 * Le trigger d'inscription ne crée que le profil. Or `students` porte le niveau,
 * l'XP, le prof assigné, et c'est son id — pas celui du profil — que référencent
 * `parent_children` et `lesson_progress`. Sans cette ligne, l'élève n'apparaît
 * ni dans la liste des élèves, ni dans les listes d'association.
 */
async function ensureStudentRow(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  role: Role,
) {
  if (role !== "student") return;
  const { data: existant } = await (admin.from("students") as any)
    .select("id").eq("profile_id", profileId).maybeSingle();
  if (existant) return;
  await (admin.from("students") as any).insert({
    profile_id: profileId,
    level: slugFromNum(1),
    level_num: 1,
  });
}

export async function createUser(formData: FormData): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };

  const email       = formData.get("email") as string;
  const password    = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const role        = formData.get("role") as Role;
  const schoolId    = formData.get("school_id") as string | null;

  if (qui.role === "manager" && role === "admin") return REFUS_ROLE;

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
    temp_password: password,
  }).eq("id", data.user.id);

  // Un profil role=student ne suffit pas : tout le reste de l'application
  // (progression, affectation d'un prof, lien parent, niveau) s'appuie sur la
  // ligne `students`. Sans elle, l'élève est invisible partout.
  await ensureStudentRow(admin, data.user.id, role || "student");

  // Envoyer email de bienvenue avec les identifiants
  try {
    await sendWelcomeEmail({ email, displayName, password, role: role || "student" });
  } catch {
    // Ne pas bloquer la création si l'email échoue
  }

  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function updateUserRole(userId: string, role: Role): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };
  if (await cibleInterdite(qui, userId)) return REFUS_ADMIN;
  if (qui.role === "manager" && role === "admin") return REFUS_ROLE;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (error) return { error: error.message };
  await (admin.from("profiles") as any).update({ role }).eq("id", userId);
  // Basculer quelqu'un en élève doit aussi lui créer sa ligne students
  await ensureStudentRow(admin, userId, role);
  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function linkParentToStudent(parentProfileId: string, studentProfileId: string): Promise<Resultat> {
  // Ces quatre actions ne visent jamais un admin, mais elles écrivent en
  // service-role : la vérification de l'appelant reste nécessaire.
  if (!await appelant()) return { error: "Non autorisé" };

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
  revalidatePath("/admin/utilisateurs", "layout");
  return { success: true };
}

export async function resetUserPassword(userId: string, password: string): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };
  // Le chemin de prise de contrôle : fixer un mot de passe sur le compte admin,
  // puis s'y connecter avec le lien affiché juste à côté.
  if (await cibleInterdite(qui, userId)) return REFUS_ADMIN;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function unlinkParentFromStudent(parentId: string, studentId: string): Promise<Resultat> {
  if (!await appelant()) return { error: "Non autorisé" };

  const admin = createAdminClient();
  const { error } = await (admin.from("parent_children") as any)
    .delete()
    .eq("parent_id", parentId)
    .eq("student_id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/parents");
  return { success: true };
}

export async function setStudentLevel(studentId: string, levelNum: number): Promise<Resultat> {
  if (!await appelant()) return { error: "Non autorisé" };

  const admin = createAdminClient();
  // Les deux colonnes doivent bouger ensemble : l'admin lit level_num,
  // l'espace élève lit level. N'écrire que l'une laissait l'élève affiché
  // Bâtisseur côté prof et Explorateur dans son propre espace.
  const { error } = await (admin.from("students") as any)
    .update({ level_num: levelNum, level: slugFromNum(levelNum) })
    .eq("id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/eleves");
  revalidatePath("/eleve");
  return { success: true };
}

export async function assignTeacherToStudent(studentId: string, teacherProfileId: string | null): Promise<Resultat> {
  if (!await appelant()) return { error: "Non autorisé" };

  const admin = createAdminClient();
  const { error } = await (admin.from("students") as any)
    .update({ teacher_id: teacherProfileId })
    .eq("id", studentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/professeurs");
  return { success: true };
}

export async function updateUser(userId: string, data: { display_name?: string; email?: string; role?: Role }): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };
  if (await cibleInterdite(qui, userId)) return REFUS_ADMIN;
  if (qui.role === "manager" && data.role === "admin") return REFUS_ROLE;

  const admin = createAdminClient();

  const authUpdate: Record<string, unknown> = {};
  if (data.email) authUpdate.email = data.email;
  if (data.role)  authUpdate.app_metadata = { role: data.role };
  if (Object.keys(authUpdate).length) {
    const { error } = await admin.auth.admin.updateUserById(userId, authUpdate);
    if (error) return { error: error.message };
  }

  const profileUpdate: Record<string, unknown> = {};
  if (data.display_name) profileUpdate.display_name = data.display_name;
  if (data.role)         profileUpdate.role = data.role;
  if (Object.keys(profileUpdate).length) {
    await (admin.from("profiles") as any).update(profileUpdate).eq("id", userId);
  }

  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function resendWelcomeEmail(userId: string): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };
  // Le renvoi expédie les identifiants en clair : à protéger comme le reste.
  if (await cibleInterdite(qui, userId)) return REFUS_ADMIN;

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("display_name, role, temp_password")
    .eq("id", userId)
    .single() as { data: { display_name: string; role: string; temp_password: string | null } | null };

  if (!profile?.temp_password) return { error: "Aucun mot de passe enregistré pour cet utilisateur" };

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return { error: "Email introuvable" };

  try {
    await sendWelcomeEmail({
      email,
      displayName: profile.display_name,
      password: profile.temp_password,
      role: profile.role as any,
    });
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteUser(userId: string): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };
  if (await cibleInterdite(qui, userId)) return REFUS_ADMIN;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs");
  return { success: true };
}

export async function toggleUserActive(userId: string, active: boolean): Promise<Resultat> {
  const qui = await appelant();
  if (!qui) return { error: "Non autorisé" };
  if (await cibleInterdite(qui, userId)) return REFUS_ADMIN;

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
