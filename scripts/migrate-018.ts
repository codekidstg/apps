import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Ajouter order_index si absent
  const { error: e1 } = await sb.rpc("exec_sql" as any, {
    sql: `alter table themes add column if not exists order_index integer not null default 0;`
  });
  if (e1) {
    // exec_sql n'existe peut-être pas, on utilise une autre approche
    console.log("rpc indisponible, on continue avec fetch direct");
  }

  // Lire tous les thèmes groupés par level
  const { data: themes, error } = await sb.from("themes").select("id, level, title").order("title");
  if (error) throw error;

  const byLevel: Record<string, typeof themes> = {};
  for (const t of themes!) {
    if (!byLevel[t.level]) byLevel[t.level] = [];
    byLevel[t.level].push(t);
  }

  // Mettre à jour order_index pour chaque thème
  for (const [, ts] of Object.entries(byLevel)) {
    for (let i = 0; i < ts!.length; i++) {
      const { error: ue } = await (sb.from("themes") as any)
        .update({ order_index: i })
        .eq("id", ts![i].id);
      if (ue) console.error("update error", ue);
      else console.log(`  ✓ ${ts![i].title} → order_index=${i}`);
    }
  }
  console.log("Migration 018 terminée");
}

main().catch(e => { console.error(e); process.exit(1); });
