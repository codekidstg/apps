import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const STUDENT_ID = "c0c6e8f0-4b85-469b-826c-69acbb6a1e9f";

async function main() {
  // 1. Marquer toutes les leçons comme completées
  const { data: lessons, error: lErr } = await sb.from("lessons").select("id, title");
  if (lErr) { console.error("Erreur leçons:", lErr.message); return; }
  console.log(`${lessons!.length} leçons — marquage en cours...`);

  for (const l of lessons!) {
    const { error } = await sb.from("lesson_progress").upsert(
      { student_id: STUDENT_ID, lesson_id: l.id, score: 95, status: "completed", attempts: 1, completed_at: new Date().toISOString() },
      { onConflict: "student_id,lesson_id" }
    );
    if (error) console.log(`  ❌ ${l.title}: ${error.message}`);
    else process.stdout.write(".");
  }
  console.log("\n✅ Leçons marquées !");

  // 2. Récupérer tous les thèmes publiés
  const { data: themes, error: tErr } = await sb.from("themes").select("id, title").eq("status", "published");
  if (tErr) { console.error("Erreur thèmes:", tErr.message); return; }
  console.log(`\n${themes!.length} thèmes publiés — génération des certificats...`);

  for (const theme of themes!) {
    // Vérifier si le certificat existe déjà
    const { data: existing } = await sb.from("certificates" as any)
      .select("id").eq("student_id", STUDENT_ID).eq("theme_id", theme.id).eq("cert_type", "theme").maybeSingle();
    if (existing) {
      console.log(`  ⏭ ${theme.title} — certificat déjà présent`);
      continue;
    }

    const hash = crypto.createHash("sha256")
      .update(`${STUDENT_ID}-${theme.id}-${Date.now()}`)
      .digest("hex").slice(0, 12);

    const { error } = await sb.from("certificates" as any).insert({
      student_id:   STUDENT_ID,
      cert_type:    "theme",
      theme_id:     theme.id,
      score:        95,
      total_xp:     500,
      verify_hash:  hash,
      revoked:      false,
      // validated_at intentionnellement vide → en attente validation prof
    });
    if (error) console.log(`  ❌ ${theme.title}: ${error.message}`);
    else console.log(`  ✓ ${theme.title}`);
  }

  console.log("\n🎓 Terminé !");
}

main().catch(console.error);
