/**
 * Crée une classe de test + une affectation de thème pour le prof de test.
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-prof-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Variables manquantes. Lance avec : pnpm dotenv -e .env.local -- tsx scripts/seed-prof-data.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Récupérer le prof
  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .single<{ id: string }>();

  if (!teacherProfile) { console.error("Prof introuvable — lance d'abord seed-test-users.ts"); process.exit(1); }
  console.log(`✓ Prof : ${teacherProfile.id}`);

  // 2. Créer une classe
  const { data: existingClass } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", teacherProfile.id)
    .single<{ id: string }>();

  let classId: string;
  if (existingClass) {
    classId = existingClass.id;
    console.log(`⚠  Classe déjà existante : ${classId}`);
  } else {
    const { data: newClass, error } = await supabase.from("classes").insert({
      name:       "Terminale A — Informatique",
      teacher_id: teacherProfile.id,
      level:      "explorer",
    }).select("id").single<{ id: string }>();
    if (error) { console.error("Erreur création classe:", error.message); process.exit(1); }
    classId = newClass!.id;
    console.log(`✓ Classe créée : ${classId}`);
  }

  // 3. Trouver le thème publié
  const { data: theme } = await supabase
    .from("themes")
    .select("id, title")
    .eq("status", "published")
    .limit(1)
    .single<{ id: string; title: string }>();

  if (!theme) { console.error("Aucun thème publié — publie d'abord un thème via le back-office Manager/Admin"); process.exit(1); }
  console.log(`✓ Thème : ${theme.title}`);

  // 4. Créer l'affectation
  const { data: existingAssignment } = await supabase
    .from("theme_assignments")
    .select("id")
    .eq("teacher_id", teacherProfile.id)
    .eq("theme_id", theme.id)
    .eq("class_id", classId)
    .single();

  if (existingAssignment) {
    console.log("⚠  Affectation déjà existante");
  } else {
    const { error } = await supabase.from("theme_assignments").insert({
      theme_id:   theme.id,
      class_id:   classId,
      teacher_id: teacherProfile.id,
      created_by: teacherProfile.id,
    });
    if (error) { console.error("Erreur affectation:", error.message); process.exit(1); }
    console.log("✓ Affectation créée");
  }

  // 5. Inscrire l'élève dans la classe
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .single<{ id: string }>();

  if (studentProfile) {
    const { data: studentRow } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", studentProfile.id)
      .single<{ id: string }>();

    if (studentRow) {
      const { data: existingEnroll } = await supabase
        .from("class_enrollments")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentRow.id)
        .single();

      if (!existingEnroll) {
        const { error } = await supabase.from("class_enrollments").insert({
          class_id:   classId,
          student_id: studentRow.id,
        });
        if (error) { console.error("Erreur enrollment:", error.message); }
        else console.log("✓ Élève Amavi inscrit dans la classe");
      } else {
        console.log("⚠  Élève déjà inscrit");
      }
    }
  }

  console.log("\n🎉 Données de test créées. Connecte-toi comme prof sur /fr/prof");
}

main();
