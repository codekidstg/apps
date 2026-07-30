import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  // Try auth users
  const { data: users } = await sb.auth.admin.listUsers();
  users?.users?.forEach(u => console.log(u.id, u.email, u.user_metadata));
}
main();
