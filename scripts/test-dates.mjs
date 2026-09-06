/**
 * Éprouve les dates ancrées sur l'heure du Togo.
 *     node scripts/test-dates.mjs
 *     TZ=America/New_York node scripts/test-dates.mjs   (doit donner la même chose)
 */
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");
const src = fs.readFileSync(path.join(process.cwd(), "src/lib/planning/dates.ts"), "utf8");
const { outputText } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { libelleEcart, ecartEnJours, semaineDe, jourTogo } =
  await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));

let ok = 0, ko = 0;
const verifie = (nom, obtenu, attendu) => {
  const bon = obtenu === attendu;
  console.log(`  ${bon ? "OK  " : "ÉCHEC"} ${nom.padEnd(52)} → ${obtenu}`);
  if (!bon) { console.log(`         attendu : ${attendu}`); ko++; } else ok++;
};

// Dimanche 6 septembre 2026, 14:00 heure du Togo.
const MAINTENANT = new Date("2026-09-06T14:00:00Z");

console.log("LE CAS SIGNALÉ — séance du dimanche 6 septembre à 16:00");
verifie("dans 2 heures, le même jour", libelleEcart(new Date("2026-09-06T16:00:00Z"), MAINTENANT), "Aujourd'hui");

console.log("\nLE RESTE DE L'ÉCHELLE");
verifie("dans 30 minutes",            libelleEcart(new Date("2026-09-06T14:30:00Z"), MAINTENANT), "Aujourd'hui");
verifie("ce soir à 23:00",            libelleEcart(new Date("2026-09-06T23:00:00Z"), MAINTENANT), "Aujourd'hui");
verifie("demain matin 09:00",         libelleEcart(new Date("2026-09-07T09:00:00Z"), MAINTENANT), "Demain");
verifie("demain soir 23:00",          libelleEcart(new Date("2026-09-07T23:00:00Z"), MAINTENANT), "Demain");
verifie("dans 2 jours, même heure",   libelleEcart(new Date("2026-09-08T14:00:00Z"), MAINTENANT), "Dans 2 jours");
verifie("dans 2 jours + 3 h",         libelleEcart(new Date("2026-09-08T17:00:00Z"), MAINTENANT), "Dans 2 jours");
verifie("dans 6 jours",               libelleEcart(new Date("2026-09-12T08:00:00Z"), MAINTENANT), "Dans 6 jours");
verifie("hier",                       libelleEcart(new Date("2026-09-05T20:00:00Z"), MAINTENANT), "Hier");

console.log("\nLES BORNES DE MINUIT");
verifie("23:59 aujourd'hui",  libelleEcart(new Date("2026-09-06T23:59:00Z"), MAINTENANT), "Aujourd'hui");
verifie("00:01 demain",       libelleEcart(new Date("2026-09-07T00:01:00Z"), MAINTENANT), "Demain");

console.log("\nLA SEMAINE (lundi → dimanche)");
const sem = semaineDe(MAINTENANT);
verifie("dimanche 6/9 appartient à la semaine du lundi", sem.lundi, "2026-08-31");
verifie("… qui se termine le dimanche",                  sem.dimanche, "2026-09-06");
const semLundi = semaineDe(new Date("2026-09-07T08:00:00Z"));
verifie("lundi 7/9 ouvre une nouvelle semaine",          semLundi.lundi, "2026-09-07");

console.log("\nINDÉPENDANCE AU FUSEAU DU SERVEUR");
verifie("le jour togolais de 23:30 UTC", jourTogo(new Date("2026-09-06T23:30:00Z")), "2026-09-06");
verifie("le jour togolais de 00:30 UTC", jourTogo(new Date("2026-09-07T00:30:00Z")), "2026-09-07");

console.log(`\n${ok} réussis · ${ko} échoués   [TZ=${process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone}]`);
process.exit(ko ? 1 : 0);
