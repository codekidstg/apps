/**
 * Vérifie que chaque labyrinthe est réellement franchissable.
 *     node scripts/verifier-labyrinthes.mjs
 *
 * Un labyrinthe se décrit par une grille, des murs, un départ et une arrivée.
 * Rien ne garantit qu'un chemin existe : les murs sont saisis à la main. Ce
 * script parcourt la grille en largeur et signale les labyrinthes sans issue,
 * puis compare la longueur du chemin le plus court à ce qu'annoncent les
 * consignes.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: lecons } = await db.from("lessons").select("id, title");
const { data: blocs } = await db.from("lesson_blocks").select("lesson_id, content, order_index").order("order_index");

/** Plus court chemin en nombre de cases, murs exclus. */
function cheminLePlusCourt(g, murs, depart, arrivee) {
  const mur = new Set(murs.map((m) => `${m.x},${m.y}`));
  if (mur.has(`${depart.x},${depart.y}`)) return { erreur: "le départ est dans un mur" };
  if (mur.has(`${arrivee.x},${arrivee.y}`)) return { erreur: "l'arrivée est dans un mur" };

  const file = [{ x: depart.x, y: depart.y, d: 0 }];
  const vus = new Set([`${depart.x},${depart.y}`]);
  while (file.length) {
    const { x, y, d } = file.shift();
    if (x === arrivee.x && y === arrivee.y) return { pas: d };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= g || ny >= g) continue;
      if (mur.has(k) || vus.has(k)) continue;
      vus.add(k);
      file.push({ x: nx, y: ny, d: d + 1 });
    }
  }
  return { erreur: "aucun chemin entre le départ et l'arrivée" };
}

let ko = 0, ok = 0;
for (const b of blocs) {
  const c = b.content ?? {};
  if (!c.start || !c.goal || c.grid_size === undefined) continue;

  const nom = lecons.find((l) => l.id === b.lesson_id)?.title ?? "?";
  const g = c.grid_size;
  const murs = c.walls ?? [];
  const libres = g * g - murs.length;
  const r = cheminLePlusCourt(g, murs, c.start, c.goal);

  const etiquette = `${nom.slice(0, 30).padEnd(32)} [${String(b.order_index).padStart(2)}] ${(c.title ?? "").slice(0, 28).padEnd(30)}`;
  if (r.erreur) {
    console.log(`  ✗ ${etiquette} ${r.erreur.toUpperCase()}  (grille ${g}×${g}, ${murs.length} murs, ${libres} cases libres)`);
    ko++;
  } else {
    console.log(`  ✓ ${etiquette} ${String(r.pas).padStart(2)} cases · max ${c.max_blocks ?? "—"} blocs · ${libres} cases libres`);
    ok++;
  }
}
console.log(`\n${ok} franchissables · ${ko} sans issue`);
process.exit(ko ? 1 : 0);
