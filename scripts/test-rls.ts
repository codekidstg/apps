/**
 * Vérifie que le cloisonnement RLS fonctionne réellement.
 * Un rôle ne doit pas pouvoir lire les données d'un autre.
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/test-rls.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CREDENTIALS = {
  student: { email: "student@codekids.test", password: "TestStudent123!" },
  parent:  { email: "parent@codekids.test",  password: "TestParent123!" },
  teacher: { email: "teacher@codekids.test", password: "TestTeacher123!" },
};

let passed = 0;
let failed = 0;

function ok(label: string) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

async function loginAs(email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login échoué pour ${email} : ${error.message}`);
  return client;
}

async function run() {
  console.log("=== Test RLS CodeKids ===\n");

  // Récupérer les IDs via service_role pour les comparaisons
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: allProfiles } = await admin.from("profiles").select("id, role, display_name");
  const studentProfile = allProfiles?.find(p => p.role === "student");
  const teacherProfile = allProfiles?.find(p => p.role === "teacher");
  const parentProfile  = allProfiles?.find(p => p.role === "parent");

  if (!studentProfile || !teacherProfile || !parentProfile) {
    console.error("Utilisateurs de test manquants. Lance d'abord : pnpm seed");
    process.exit(1);
  }

  // ── TEST 1 : L'élève ne voit que son propre profil ──────────────────────
  console.log("1. Élève → ne voit que son propre profil");
  {
    const client = await loginAs(CREDENTIALS.student.email, CREDENTIALS.student.password);
    const { data } = await client.from("profiles").select("id, role");

    if (!data || data.length === 0) {
      fail("L'élève devrait voir son propre profil");
    } else if (data.length === 1 && data[0].id === studentProfile.id) {
      ok("L'élève voit uniquement son profil");
    } else if (data.some(p => p.id !== studentProfile.id)) {
      fail(`L'élève voit ${data.length} profils au lieu de 1`, JSON.stringify(data.map(p => p.role)));
    } else {
      ok("L'élève voit uniquement son profil");
    }
  }

  // ── TEST 2 : L'élève ne voit pas les données du parent ─────────────────
  console.log("\n2. Élève → ne peut pas lire les liens parent-enfant des autres");
  {
    const client = await loginAs(CREDENTIALS.student.email, CREDENTIALS.student.password);
    const { data } = await client
      .from("parent_student_links")
      .select("parent_id")
      .eq("parent_id", parentProfile.id);

    if (data && data.length > 0) {
      fail("L'élève a pu lire les liens parent — FAILLE RLS");
    } else {
      ok("L'élève ne voit pas les liens parent-enfant des autres");
    }
  }

  // ── TEST 3 : Le parent ne voit que son enfant ───────────────────────────
  console.log("\n3. Parent → ne voit que ses propres liens enfants");
  {
    const client = await loginAs(CREDENTIALS.parent.email, CREDENTIALS.parent.password);
    const { data } = await client.from("parent_student_links").select("parent_id");

    if (!data || data.length === 0) {
      ok("Le parent ne voit aucun lien (normal si le seed est incomplet)");
    } else if (data.every(l => l.parent_id === parentProfile.id)) {
      ok(`Le parent voit ${data.length} lien(s) — tous à lui`);
    } else {
      fail("Le parent voit des liens qui ne lui appartiennent pas — FAILLE RLS");
    }
  }

  // ── TEST 4 : Le prof ne voit que ses classes ────────────────────────────
  console.log("\n4. Professeur → ne voit que ses propres classes");
  {
    const client = await loginAs(CREDENTIALS.teacher.email, CREDENTIALS.teacher.password);
    const { data } = await client.from("classes").select("teacher_id");

    if (!data || data.length === 0) {
      ok("Le prof ne voit aucune classe (normal s'il n'en a pas encore)");
    } else if (data.every(c => c.teacher_id === teacherProfile.id)) {
      ok(`Le prof voit ${data.length} classe(s) — toutes les siennes`);
    } else {
      fail("Le prof voit des classes qui ne lui appartiennent pas — FAILLE RLS");
    }
  }

  // ── TEST 5 : Le prof ne peut pas lire les abonnements ──────────────────
  console.log("\n5. Professeur → ne peut pas lire les abonnements");
  {
    const client = await loginAs(CREDENTIALS.teacher.email, CREDENTIALS.teacher.password);
    const { data } = await client.from("subscriptions").select("id");

    if (data && data.length > 0) {
      fail("Le prof a pu lire des abonnements — FAILLE RLS");
    } else {
      ok("Le prof ne voit aucun abonnement");
    }
  }

  // ── Résultat ─────────────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════`);
  console.log(`  ${passed} tests passés  |  ${failed} échecs`);
  if (failed === 0) {
    console.log("  ✅ Cloisonnement RLS validé");
  } else {
    console.log("  ❌ Des failles RLS ont été détectées");
    process.exit(1);
  }
}

run().catch(console.error);
