/**
 * Crée 1 utilisateur de test par rôle dans Supabase.
 * Usage : pnpm tsx scripts/seed-test-users.ts
 *
 * Identifiants créés :
 *   admin@codekids.test   / TestAdmin123!
 *   manager@codekids.test / TestManager123!
 *   teacher@codekids.test / TestTeacher123!
 *   student@codekids.test / TestStudent123!
 *   parent@codekids.test  / TestParent123!
 */

import { createClient } from "@supabase/supabase-js";
import type { Role } from "../src/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Variables manquantes. Lance avec : pnpm dotenv -e .env.local -- tsx scripts/seed-test-users.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS: { email: string; password: string; role: Role; display_name: string }[] = [
  { email: "admin@codekids.test",   password: "TestAdmin123!",   role: "admin",   display_name: "Admin Test" },
  { email: "manager@codekids.test", password: "TestManager123!", role: "manager", display_name: "Manager Test" },
  { email: "teacher@codekids.test", password: "TestTeacher123!", role: "teacher", display_name: "Prof Kofi" },
  { email: "student@codekids.test", password: "TestStudent123!", role: "student", display_name: "Amavi" },
  { email: "parent@codekids.test",  password: "TestParent123!",  role: "parent",  display_name: "Parent Amavi" },
];

async function seed() {
  console.log("Création des utilisateurs de test...\n");

  for (const user of TEST_USERS) {
    // Créer l'utilisateur via Auth admin (sans email de confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        display_name: user.display_name,
        role: user.role,
      },
      // app_metadata est inclus dans le JWT → utilisé par get_my_role() sans requête DB
      app_metadata: { role: user.role },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`⚠️  ${user.email} existe déjà — ignoré`);
      } else {
        console.error(`✗  ${user.email} — ${error.message}`);
      }
      continue;
    }

    // Mettre à jour le profil avec le bon rôle (le trigger crée le profil,
    // mais on force le rôle via service_role pour contourner RLS)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: user.role, display_name: user.display_name })
      .eq("id", data.user.id);

    if (profileError) {
      console.error(`✗  Profil ${user.email} — ${profileError.message}`);
      continue;
    }

    // Pour l'élève : créer l'entrée dans students
    if (user.role === "student") {
      const { error: studentError } = await supabase
        .from("students")
        .insert({ profile_id: data.user.id, level: "explorer" });
      if (studentError) {
        console.error(`✗  Student ${user.email} — ${studentError.message}`);
        continue;
      }

      // Lier l'élève au parent de test
      const { data: parentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "parent")
        .single();

      const { data: studentRow } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", data.user.id)
        .single();

      if (parentProfile && studentRow) {
        await supabase.from("parent_student_links").insert({
          parent_id: parentProfile.id,
          student_id: studentRow.id,
        });
      }
    }

    console.log(`✓  ${user.role.padEnd(8)} — ${user.email}`);
  }

  console.log("\nTerminé. Identifiants de test :");
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`);
  }
}

seed().catch(console.error);
