/**
 * Éprouve le contrôle d'accès élève et l'anti-rejeu.
 *     node scripts/test-acces.mjs           cas construits
 *     node scripts/test-acces.mjs --base    + confrontation à la base réelle
 *
 * Aucun test n'écrit en base : l'anti-rejeu est vérifié en rejouant la requête
 * exacte du garde sur les événements déjà enregistrés.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");
const src = fs.readFileSync(path.join(process.cwd(), "src/lib/eleve/acces.ts"), "utf8");
const { outputText } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { verdictPourTheme, MESSAGE_REFUS, urlRefus } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);

let ok = 0, ko = 0;
const verifie = (nom, obtenu, attendu) => {
  const bon = JSON.stringify(obtenu) === JSON.stringify(attendu);
  console.log(`  ${bon ? "OK  " : "ÉCHEC"} ${nom.padEnd(56)} → ${JSON.stringify(obtenu)}`);
  if (!bon) { console.log(`         attendu : ${JSON.stringify(attendu)}`); ko++; } else ok++;
};

const perimetre = (ouverts, publies) => ({
  ouverts: new Set(ouverts),
  publies: new Set(publies),
  autorises: new Set(ouverts.filter((t) => publies.includes(t))),
});

console.log("LA RÈGLE — publié ET activé");
{
  const p = perimetre(["A"], ["A", "B"]);
  verifie("thème publié et activé",          verdictPourTheme("A", p), { ok: true, themeId: "A" });
  verifie("thème publié mais non activé",    verdictPourTheme("B", p), { ok: false, raison: "theme_non_ouvert" });
}
{
  // L'ancienne page de thème ne contrôlait rien quand l'élève n'avait aucune
  // ligne d'accès : il ouvrait donc toute la plateforme.
  const p = perimetre([], ["A", "B"]);
  verifie("aucun accès configuré → tout est refusé", verdictPourTheme("A", p), { ok: false, raison: "theme_non_ouvert" });
}
{
  // Le statut du thème n'était pas regardé du tout.
  const p = perimetre(["C"], ["A", "B"]);
  verifie("thème activé mais en brouillon",  verdictPourTheme("C", p), { ok: false, raison: "theme_non_publie" });
}
{
  const p = perimetre(["A"], ["A"]);
  verifie("leçon sans thème connu",          verdictPourTheme(null, p), { ok: false, raison: "introuvable" });
}

console.log("\nLE REFUS EST LISIBLE");
verifie("chaque raison a son message",
  Object.keys(MESSAGE_REFUS).sort(), ["introuvable", "theme_non_ouvert", "theme_non_publie"]);
verifie("l'URL de refus porte la raison",
  urlRefus("fr", "theme_non_ouvert"), "/fr/eleve?acces=theme_non_ouvert");

console.log(`\n${ok} réussis · ${ko} échoués`);

// ── Sur la base réelle ──────────────────────────────────────────────────────
if (process.argv.includes("--base")) {
  const { createClient } = await import("@supabase/supabase-js");
  const env = Object.fromEntries(
    fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log("\n═══ LA JOINTURE DU GARDE ═══");
  // C'est la requête exacte de themeDeLecon : si l'embed est ambigu, PostgREST
  // renvoie une erreur et le garde refuserait tout le monde.
  const { data: uneLecon } = await db.from("lessons").select("id, title").limit(1).single();
  const { data: jointure, error: eJ } = await db
    .from("lessons").select("id, chapters!inner(theme_id)").eq("id", uneLecon.id).maybeSingle();
  console.log(eJ ? `  ÉCHEC embed chapters : ${eJ.message}` : `  OK   « ${uneLecon.title} » → thème ${jointure.chapters.theme_id}`);
  if (eJ) ko++; else ok++;

  console.log("\n═══ CE QUE CHAQUE ÉLÈVE PEUT OUVRIR ═══");
  const [{ data: eleves }, { data: acces }, { data: themes }, { data: chaps }, { data: lecons }] = await Promise.all([
    db.from("students").select("id, profiles!profile_id(display_name)"),
    db.from("student_theme_access").select("student_id, theme_id"),
    db.from("themes").select("id, title, status"),
    db.from("chapters").select("id, theme_id"),
    db.from("lessons").select("id, title, chapter_id"),
  ]);
  const tById = new Map(themes.map((t) => [t.id, t]));
  const themeDe = (l) => chaps.find((c) => c.id === l.chapter_id)?.theme_id ?? null;
  const publies = themes.filter((t) => t.status === "published").map((t) => t.id);

  for (const e of eleves) {
    const ouverts = acces.filter((a) => a.student_id === e.id).map((a) => a.theme_id);
    const p = perimetre(ouverts, publies);
    const dedans = lecons.find((l) => p.autorises.has(themeDe(l)));
    const dehors = lecons.find((l) => !p.autorises.has(themeDe(l)));
    const vIn  = verdictPourTheme(dedans ? themeDe(dedans) : null, p);
    const vOut = verdictPourTheme(dehors ? themeDe(dehors) : null, p);
    const nom = (e.profiles?.display_name ?? "—").padEnd(26);
    const bon = vIn.ok === true && vOut.ok === false;
    console.log(`  ${bon ? "OK  " : "ÉCHEC"} ${nom} « ${(dedans?.title ?? "—").slice(0, 24)} » → ouvert · « ${(dehors?.title ?? "—").slice(0, 24)} » → ${vOut.raison ?? "OUVERT !"}`);
    if (bon) ok++; else ko++;
  }

  console.log("\n═══ L'ANTI-REJEU — la requête du garde sur les événements réels ═══");
  const { data: evs } = await db.from("gamification_events")
    .select("student_id, event_type, payload").eq("event_type", "lesson_completed").limit(1);
  if (!evs?.length) {
    console.log("  (aucun événement lesson_completed en base — rien à confronter)");
  } else {
    const ev = evs[0];
    const { count, error } = await db.from("gamification_events")
      .select("id", { count: "exact", head: true })
      .eq("student_id", ev.student_id)
      .eq("event_type", "lesson_completed")
      .eq("payload->>lessonId", String(ev.payload.lessonId));
    if (error) { console.log(`  ÉCHEC filtre payload->>lessonId : ${error.message}`); ko++; }
    else { console.log(`  OK   un rejeu de cette leçon serait refusé (${count} événement déjà enregistré)`); ok++; }

    const { count: absent, error: e2 } = await db.from("gamification_events")
      .select("id", { count: "exact", head: true })
      .eq("student_id", ev.student_id)
      .eq("event_type", "lesson_completed")
      .eq("payload->>lessonId", "00000000-0000-0000-0000-000000000000");
    if (e2) { console.log(`  ÉCHEC : ${e2.message}`); ko++; }
    else { console.log(`  OK   une leçon jamais faite n'est pas bloquée (${absent} événement)`); ok++; }
  }

  console.log(`\n${ok} réussis · ${ko} échoués`);
}

process.exit(ko ? 1 : 0);
