import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  const { data } = await sb.from("chapters").select("id,title,order_index").eq("theme_id","8979e87c-058c-4003-95fd-1531c649bd1d").order("order_index");
  console.log(JSON.stringify(data, null, 2));
}
main();
