/**
 * Éprouve la détection de conflits sur les cas réels et sur les pièges.
 *     node scripts/test-conflits.mjs
 */
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

// On transpile avec le TypeScript du projet : retirer les types à la main
// produisait un module cassé, donc un test qui ne testait rien.
const ts = createRequire(import.meta.url)("typescript");
const src = fs.readFileSync(path.join(process.cwd(), "src/lib/planning/conflits.ts"), "utf8");
const { outputText } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const mod = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
const { analyserConflit, messageConflit } = mod;

const AUJ = "2026-09-05";
let ok = 0, ko = 0;

function cas(nom, candidate, existantes, attendu) {
  const v = analyserConflit(candidate, existantes, AUJ);
  const bon = v.kind === attendu;
  console.log(`  ${bon ? "OK  " : "ÉCHEC"} ${nom.padEnd(58)} → ${v.kind}`);
  if (!bon) { console.log(`         attendu : ${attendu}`); ko++; } else ok++;
  if (v.kind !== "libre") console.log(`         ${messageConflit(v)}`);
}

const ponctuellePassee = {
  title: "Première séance offerte", session_type: "once", weekday: null, start_time: null,
  scheduled_at: "2026-08-29T10:00:00+00:00", duration_min: 90, active_from: "2026-08-25", active_until: null,
};
const ponctuelleFuture = { ...ponctuellePassee, scheduled_at: "2026-09-19T10:00:00+00:00" };

console.log("LE CAS SIGNALÉ — récurrente samedi 09:00 dès le 05/09, ponctuelle du 29/08");
cas("ne doit plus être un conflit",
  { type: "recurring", weekday: 6, startTime: "09:00", duration: 90, from: "2026-09-05", until: "2027-06-26" },
  [ponctuellePassee], "libre");

console.log("\nCE QUI DOIT ENCORE ÊTRE DÉTECTÉ");
cas("ponctuelle FUTURE, même samedi, chevauchement horaire",
  { type: "recurring", weekday: 6, startTime: "09:00", duration: 90, from: "2026-09-05", until: "2027-06-26" },
  [ponctuelleFuture], "chevauchement");

cas("deux récurrentes le samedi, mêmes horaires",
  { type: "recurring", weekday: 6, startTime: "09:00", duration: 90, from: "2026-09-05", until: null },
  [{ title: "Cours Michael", session_type: "recurring", weekday: 6, start_time: "09:30",
     scheduled_at: null, duration_min: 60, active_from: "2026-09-01", active_until: null }], "chevauchement");

cas("ponctuelle créée le même jour et à la même heure qu'une récurrente",
  { type: "once", scheduledAt: "2026-09-12T09:30:00+00:00", duration: 60 },
  [{ title: "Cours Kenneth", session_type: "recurring", weekday: 6, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-09-05", active_until: "2027-06-26" }], "chevauchement");

console.log("\nCE QUI NE DOIT PLUS BLOQUER");
cas("récurrente expirée en juin, ponctuelle en décembre",
  { type: "once", scheduledAt: "2026-12-12T09:00:00+00:00", duration: 60 },
  [{ title: "Ancien cours", session_type: "recurring", weekday: 6, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-01-10", active_until: "2026-06-27" }], "libre");

cas("deux récurrentes du samedi, périodes disjointes",
  { type: "recurring", weekday: 6, startTime: "09:00", duration: 90, from: "2026-10-01", until: null },
  [{ title: "Cours terminé", session_type: "recurring", weekday: 6, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-01-10", active_until: "2026-06-27" }], "libre");

cas("même jour de semaine mais récurrente qui démarre après la fin de l'autre",
  { type: "recurring", weekday: 6, startTime: "09:00", duration: 90, from: "2026-09-05", until: "2026-09-30" },
  [{ title: "Plus tard", session_type: "recurring", weekday: 6, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-11-01", active_until: null }], "libre");

console.log("\nL'ESPACEMENT — prévient sans interdire");
cas("samedi 09:00–10:30 puis 11:00 : 30 min d'écart",
  { type: "recurring", weekday: 6, startTime: "11:00", duration: 60, from: "2026-09-05", until: null },
  [{ title: "Cours Michael", session_type: "recurring", weekday: 6, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-09-05", active_until: null }], "serre");

cas("samedi 09:00–10:30 puis 14:00 : 3h30 d'écart",
  { type: "recurring", weekday: 6, startTime: "14:00", duration: 60, from: "2026-09-05", until: null },
  [{ title: "Cours Michael", session_type: "recurring", weekday: 6, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-09-05", active_until: null }], "libre");

console.log("\nJOURS DIFFÉRENTS");
cas("récurrente le samedi, existante le jeudi",
  { type: "recurring", weekday: 6, startTime: "09:00", duration: 90, from: "2026-09-05", until: null },
  [{ title: "Jeudi", session_type: "recurring", weekday: 4, start_time: "09:00",
     scheduled_at: null, duration_min: 90, active_from: "2026-09-05", active_until: null }], "libre");

console.log(`\n${ok} réussis · ${ko} échoués`);
process.exit(ko ? 1 : 0);
