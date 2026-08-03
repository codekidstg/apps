import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Use the Supabase Management API directly via fetch
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace("https://", "").split(".")[0];
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const sql = `
    ALTER TABLE training_blocks DROP CONSTRAINT IF EXISTS training_blocks_type_check;
    ALTER TABLE training_blocks ADD CONSTRAINT training_blocks_type_check
      CHECK (type IN ('quiz','code_challenge','text','blockly_challenge','fill_blank','match','swipe_sort','drag_to_bin'));
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error("❌ Error:", JSON.stringify(body));
    process.exit(1);
  }
  console.log("✅ Constraint updated successfully");
}

main().catch(console.error);
