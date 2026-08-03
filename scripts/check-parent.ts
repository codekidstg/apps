import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: users } = await sb.auth.admin.listUsers();
  const parent = users.users.find(u => u.email === "parent@codekids.test");
  console.log("app_metadata:", parent?.app_metadata);
  console.log("user_metadata:", parent?.user_metadata);
  
  // Vérifier les liens
  const { data: links, error } = await (sb.from("parent_children") as any)
    .select("*")
    .eq("parent_id", parent?.id);
  console.log("Liens:", links, "Erreur:", error);
}
main().catch(console.error);
