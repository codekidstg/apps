import { createClient } from "@supabase/supabase-js";

// On simule ce que ferait le serveur avec le JWT du parent
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Login as parent
  const { data: auth, error: authError } = await sb.auth.signInWithPassword({
    email: "parent@codekids.test",
    password: "TestParent123!",
  });
  if (authError) { console.error("Auth error:", authError); return; }
  
  console.log("JWT role:", auth.user?.app_metadata?.role);
  
  const { data, error } = await (sb.from("parent_children") as any)
    .select("student_id, students(id, xp, level_num, profiles(display_name))")
    .eq("parent_id", auth.user!.id);
  
  console.log("Links:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
main().catch(console.error);
