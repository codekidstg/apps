/**
 * Met à jour l'app_metadata des utilisateurs de test existants
 * pour que get_my_role() lise le rôle depuis le JWT.
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/update-app-metadata.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ROLE_MAP: Record<string, string> = {
  "admin@codekids.test":   "admin",
  "manager@codekids.test": "manager",
  "teacher@codekids.test": "teacher",
  "student@codekids.test": "student",
  "parent@codekids.test":  "parent",
};

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error(error.message); process.exit(1); }

  for (const user of users) {
    const role = ROLE_MAP[user.email ?? ""];
    if (!role) continue;

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { role },
    });

    if (updateErr) {
      console.error(`✗ ${user.email} — ${updateErr.message}`);
    } else {
      console.log(`✓ ${role.padEnd(8)} — ${user.email}`);
    }
  }
  console.log("\napp_metadata mis à jour.");
}

run().catch(console.error);
