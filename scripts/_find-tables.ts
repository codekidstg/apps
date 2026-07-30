import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  // Check students table
  const { data: s } = await sb.from("students").select("*").limit(5);
  console.log("students:", JSON.stringify(s, null, 2));
  // Check lesson_progress structure
  const { data: lp } = await sb.from("lesson_progress").select("*").limit(3);
  console.log("lesson_progress:", JSON.stringify(lp, null, 2));
}
main();
