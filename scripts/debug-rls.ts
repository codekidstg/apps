import { createClient } from "@supabase/supabase-js";

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function run() {
  // 1. Vérifier les profils via service_role
  const admin = createClient(URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profiles } = await admin.from("profiles").select("id, role, display_name");
  console.log("Profils dans la DB :", profiles?.map(p => `${p.role} (${p.display_name})`).join(", "));

  // 2. Login élève avec client anon
  const anon = createClient(URL, ANON);
  const { data: auth, error: loginErr } = await anon.auth.signInWithPassword({
    email: "student@codekids.test",
    password: "TestStudent123!",
  });
  console.log("Login élève — userId:", auth?.user?.id, "| erreur:", loginErr?.message ?? "aucune");

  if (!auth?.user) return;

  // 3. Requête profil avec la session
  const { data: myProfile, error: pErr } = await anon
    .from("profiles")
    .select("id, role");
  console.log("Profils visibles par l'élève :", JSON.stringify(myProfile), "| erreur:", pErr?.message ?? "aucune");
}

run().catch(console.error);
