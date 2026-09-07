/**
 * Éprouve le calcul de progression.
 *     node scripts/test-progression.mjs           cas construits
 *     node scripts/test-progression.mjs --base    + confrontation à la base réelle
 */
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");
const src = fs.readFileSync(path.join(process.cwd(), "src/lib/progression.ts"), "utf8");
const { outputText } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { calculerParcours } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);

let ok = 0, ko = 0;
const verifie = (nom, obtenu, attendu) => {
  const bon = JSON.stringify(obtenu) === JSON.stringify(attendu);
  console.log(`  ${bon ? "OK  " : "ÉCHEC"} ${nom.padEnd(56)} → ${JSON.stringify(obtenu)}`);
  if (!bon) { console.log(`         attendu : ${JSON.stringify(attendu)}`); ko++; } else ok++;
};

// ── Un catalogue de test ────────────────────────────────────────────────────
// Thème A (explorer, 2 leçons), thème B (explorer, 1 leçon), thème C (builder).
// Les order_index sont volontairement en désordre dans les tableaux.
const catalogue = {
  themes: [
    { id: "B", title: "Thème B", level: "explorer", order_index: 2 },
    { id: "A", title: "Thème A", level: "explorer", order_index: 1 },
    { id: "C", title: "Thème C", level: "builder",  order_index: 1 },
  ],
  chapitres: [
    { id: "a2", theme_id: "A", order_index: 2 },
    { id: "a1", theme_id: "A", order_index: 1 },
    { id: "b1", theme_id: "B", order_index: 1 },
    { id: "c1", theme_id: "C", order_index: 1 },
  ],
  lecons: [
    { id: "l3", title: "A-chap2-l1", chapter_id: "a2", order_index: 1 },
    { id: "l2", title: "A-chap1-l2", chapter_id: "a1", order_index: 2 },
    { id: "l1", title: "A-chap1-l1", chapter_id: "a1", order_index: 1 },
    { id: "l4", title: "B-l1",       chapter_id: "b1", order_index: 1 },
    { id: "l5", title: "C-l1",       chapter_id: "c1", order_index: 1 },
  ],
};
const S = (...ids) => new Set(ids);

console.log("L'ORDRE DU PROGRAMME");
{
  const p = calculerParcours([], catalogue, S("A"), "explorer");
  verifie("aucune leçon faite → la première du thème", p.prochaineLecon, "A-chap1-l1");
  verifie("… et le compteur du thème", `${p.faites}/${p.total}`, "0/3");
}
{
  const p = calculerParcours([{ lesson_id: "l1", status: "completed" }], catalogue, S("A"), "explorer");
  verifie("l1 faite → la suivante est l2, pas l3", p.prochaineLecon, "A-chap1-l2");
}
{
  const p = calculerParcours(
    [{ lesson_id: "l1", status: "completed" }, { lesson_id: "l2", status: "completed" }],
    catalogue, S("A"), "explorer");
  verifie("chapitre 1 fini → on passe au chapitre 2", p.prochaineLecon, "A-chap2-l1");
}

console.log("\nLE CAS SIGNALÉ — le thème actif ne doit plus disparaître");
{
  // Kenneth : une leçon terminée, aucune ligne « in_progress ». L'écran
  // affichait « — » alors qu'il lui reste tout le thème à faire.
  const p = calculerParcours([{ lesson_id: "l1", status: "completed" }], catalogue, S("A"), "explorer");
  verifie("terminée sans leçon ouverte → thème quand même affiché", p.themeCourant, "Thème A");
  verifie("… avec le bon compteur", `${p.faites}/${p.total}`, "1/3");
}
{
  // Michael : trois leçons ouvertes dont une hors parcours. Le thème affiché
  // dépendait de l'ordre de retour de Postgres.
  const p = calculerParcours(
    [{ lesson_id: "l1", status: "in_progress" },
     { lesson_id: "l5", status: "in_progress" },
     { lesson_id: "l3", status: "in_progress" }],
    catalogue, S("A"), "explorer");
  verifie("plusieurs leçons ouvertes → le thème reste déterministe", p.themeCourant, "Thème A");
  verifie("… et le travail hors parcours est compté", p.horsParcours, 1);
}

console.log("\nLE PÉRIMÈTRE");
{
  const p = calculerParcours([{ lesson_id: "l5", status: "completed" }], catalogue, S("A"), "explorer");
  verifie("une leçon d'un thème non activé ne compte pas", `${p.faites}/${p.total}`, "0/3");
  verifie("… mais elle est signalée", p.horsParcours, 1);
}
{
  const p = calculerParcours([], catalogue, S(), "explorer");
  verifie("aucun thème activé", p.aucunThemeActive, true);
  verifie("… pas de faux dénominateur", `${p.faites}/${p.total}`, "0/0");
}
{
  const p = calculerParcours([], catalogue, S("A", "B"), "explorer");
  verifie("deux thèmes activés → parcours complet", `${p.faitesParcours}/${p.totalParcours}`, "0/4");
  verifie("… mais le compteur affiché reste celui du thème", `${p.faites}/${p.total}`, "0/3");
}

console.log("\nLE RANG DANS LE NIVEAU");
{
  const p = calculerParcours([], catalogue, S("A", "B"), "explorer");
  verifie("thème A = 1er des 2 thèmes explorateur", `${p.rangTheme}/${p.themesDuNiveau}`, "1/2");
}
{
  const faites = ["l1", "l2", "l3"].map((id) => ({ lesson_id: id, status: "completed" }));
  const p = calculerParcours(faites, catalogue, S("A", "B"), "explorer");
  verifie("thème A fini → on bascule sur le thème B", p.themeCourant, "Thème B");
  verifie("… rang mis à jour", `${p.rangTheme}/${p.themesDuNiveau}`, "2/2");
}
{
  // Un thème activé qui n'appartient pas au niveau de l'élève n'a pas de rang.
  const p = calculerParcours([], catalogue, S("C"), "explorer");
  verifie("thème hors niveau → pas de rang", p.rangTheme, null);
}

console.log("\nPARCOURS TERMINÉ");
{
  const faites = ["l1", "l2", "l3"].map((id) => ({ lesson_id: id, status: "completed" }));
  const p = calculerParcours(faites, catalogue, S("A"), "explorer");
  verifie("tout fait → terminé", p.termine, true);
  verifie("… plus de prochaine leçon", p.prochaineLecon, null);
  verifie("… le thème reste affiché", p.themeCourant, "Thème A");
}

console.log(`\n${ok} réussis · ${ko} échoués`);

// ── Confrontation à la base réelle ──────────────────────────────────────────
if (process.argv.includes("--base")) {
  const { createClient } = await import("@supabase/supabase-js");
  const env = Object.fromEntries(
    fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: themes }, { data: chapitres }, { data: lecons }, { data: eleves }, { data: acces }, { data: progres }] =
    await Promise.all([
      db.from("themes").select("id, title, level, order_index").eq("status", "published"),
      db.from("chapters").select("id, theme_id, order_index"),
      db.from("lessons").select("id, title, chapter_id, order_index"),
      db.from("students").select("id, level, profiles!profile_id(display_name)"),
      db.from("student_theme_access").select("student_id, theme_id"),
      db.from("lesson_progress").select("student_id, lesson_id, status"),
    ]);

  console.log("\n═══ SUR LA BASE RÉELLE ═══");
  for (const e of eleves ?? []) {
    const p = calculerParcours(
      (progres ?? []).filter((x) => x.student_id === e.id),
      { themes, chapitres, lecons },
      new Set((acces ?? []).filter((a) => a.student_id === e.id).map((a) => a.theme_id)),
      e.level ?? "explorer",
    );
    const rang = p.rangTheme ? ` · thème ${p.rangTheme} sur ${p.themesDuNiveau}` : "";
    const hors = p.horsParcours ? ` · ${p.horsParcours} hors parcours` : "";
    console.log(`  ${(e.profiles?.display_name ?? "—").padEnd(26)} ${p.faites}/${p.total}  ${(p.themeCourant ?? "AUCUN THÈME ACTIVÉ").padEnd(42)}${rang}${hors}`);
    if (p.prochaineLecon) console.log(`  ${"".padEnd(26)} prochaine : ${p.prochaineLecon}`);
  }
}

process.exit(ko ? 1 : 0);
