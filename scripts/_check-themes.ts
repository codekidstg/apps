import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  const { data } = await sb.from("themes").select("id,title,status,level").order("level");
  console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error);
