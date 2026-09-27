/**
 * Les règles communes à tous les lots du Terrain.
 *
 * Chaque script de séance apporte son contenu ; ce module apporte les
 * garde-fous, l'écriture et la relecture. Les règles ci-dessous sont nées de
 * vraies pannes — chacune porte la sienne en commentaire.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

export function base() {
  const env = Object.fromEntries(
    fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
export function lecteur(db) {
  return async function g(t, c, f) {
    for (let i = 0; i < 5; i++) {
      let q = db.from(t).select(c); if (f) q = f(q);
      const { data, error } = await q;
      if (!error) return data;
      if (i === 4) throw new Error(`${t} : ${error.message}`);
      await pause(1500);
    }
  };
}

export const kodi = (html) => ({ type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p>${html}` } });
export const jeu  = (content) => ({ type: "blockly_challenge", content });

/**
 * Relit un lot avant qu'il n'approche la base.
 *
 * `interdits` : le vocabulaire que la séance n'a pas encore enseigné. Il est
 * cherché dans TOUT ce que l'enfant voit — les tests cachés sont écrits pour
 * la machine, pas pour lui, et en sont exclus.
 */
export function verifier(EXOS, { interdits = [], paliers = [1, 1, 2, 2, 2, 3, 3], comptes = {} } = {}) {
  let ko = 0;
  const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };

  if (EXOS.length !== paliers.length) mauvais(`${EXOS.length} exercices, ${paliers.length} paliers attendus`);
  EXOS.forEach((e, i) => { if (e.palier !== paliers[i]) mauvais(`[${i}] ${e.title} : palier ${e.palier}, attendu ${paliers[i]}`); });

  for (const e of EXOS) {
    for (const b of e.blocs) {
      const c = b.content ?? {};
      const visible = JSON.stringify({ ...c, hidden_tests: undefined });
      for (const rx of interdits) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx} — pas encore enseigné`);

      // Le rappel du tri : `{ title, criteria[] }`. Une simple phrase s'affichait
      // sans titre et plantait la page au premier clic sur « Voir le rappel ».
      if (c.helper !== undefined) {
        const h = c.helper;
        if (typeof h !== "object" || !h.title || !Array.isArray(h.criteria) || !h.criteria.length)
          mauvais(`${e.title} : helper doit être { title, criteria[] }`);
      }

      // `swipe_sort` lit `categories`, `drag_to_bin` lit `bins` : deux noms pour
      // la même idée, et se tromper ne se voit qu'à l'écran. Le jeu de remise
      // en ordre a lui aussi des `items`, mais ce sont de simples phrases :
      // ces règles ne le concernent pas.
      if (c.items && (b.type === "swipe_sort" || b.type === "drag_to_bin")) {
        if (b.type === "swipe_sort" && !c.categories) mauvais(`${e.title} : swipe_sort attend categories`);
        if (b.type === "drag_to_bin" && !c.bins)      mauvais(`${e.title} : drag_to_bin attend bins`);
        const bacs = (c.categories ?? c.bins ?? []).map((x) => x.id);
        if (!bacs.length) mauvais(`${e.title} : des éléments sans bacs`);
        for (const it of c.items) {
          if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`);
          if (!bacs.includes(it.correct)) mauvais(`${e.title} : « ${it.label} » vise un bac inexistant (${it.correct})`);
        }
        for (const v of (c.categories ?? c.bins ?? []).filter((x) => !c.items.some((i) => i.correct === x.id)))
          mauvais(`${e.title} : le bac « ${v.label} » n'attend aucun élément`);
        // Un tri à bacs tient en 796 px à douze éléments ; au-delà, l'enfant doit
        // faire défiler entre l'étiquette et son bac.
        if (b.type === "drag_to_bin" && c.items.length > 12) mauvais(`${e.title} : ${c.items.length} éléments à ranger, 12 au plus`);
      }

      for (const s of c.sentences ?? []) {
        if (!s.options?.[s.correct]) mauvais(`${e.title} : phrase ${s.id} sans bonne réponse`);
        if (!s.explanation) mauvais(`${e.title} : phrase ${s.id} sans explication`);
      }

      // Deux fois la même réponse à droite, et le jeu de paires devient insoluble.
      if (c.pairs) {
        const g1 = c.pairs.map((p) => p.left), d1 = c.pairs.map((p) => p.right);
        if (g1.length !== new Set(g1).size) mauvais(`${e.title} : deux paires ont la même gauche`);
        if (d1.length !== new Set(d1).size) mauvais(`${e.title} : deux paires ont la même droite — insoluble`);
      }

      for (const q of c.questions ?? []) {
        if (!q.choices?.[q.answer]) mauvais(`${e.title} : une question sans bonne réponse`);
        if (new Set(q.choices).size !== q.choices.length) mauvais(`${e.title} : « ${q.question?.slice(0, 40)} » a deux choix identiques`);
        if (!q.explanation) mauvais(`${e.title} : « ${q.question?.slice(0, 40)} » sans explication`);
      }

      if (c.game_type === "bug_hunt") {
        if (!Number.isInteger(c.bug_index) || !c.instructions?.[c.bug_index]) mauvais(`${e.title} / ${c.title} : bug_index hors des lignes`);
        else if (c.instructions[c.bug_index] === c.fix) mauvais(`${e.title} / ${c.title} : la réparation répète la ligne fautive`);
        if (!c.explanation) mauvais(`${e.title} / ${c.title} : sans explication`);
      }

      if (c.game_type === "maze" || c.game_type === "python_maze") {
        const v = cheminLabyrinthe(c);
        if (v.erreur) mauvais(`${e.title} / ${c.title} : ${v.erreur}`);
        else {
          // Le budget de blocs doit laisser une chance : au moins un
          // déplacement par case du plus court chemin — sauf quand la boucle
          // est disponible, puisque c'est justement elle qui fait tenir un
          // long chemin dans peu de blocs.
          const boucle = (c.available_blocks ?? []).some((b2) => b2.includes("repeat"));
          if (!boucle && c.max_blocks !== undefined && c.max_blocks < v.pas)
            mauvais(`${e.title} / ${c.title} : ${c.max_blocks} blocs autorisés pour un chemin de ${v.pas} cases, sans boucle disponible`);
          if (c.collectibles?.length && !(c.available_blocks ?? []).includes("robot_pick"))
            mauvais(`${e.title} / ${c.title} : des gemmes à ramasser, mais pas de bloc robot_pick`);
        }
      }

      // Les moteurs de motif : le morceau annoncé doit réellement revenir à
      // l'identique, et le compte doit tomber juste. Un motif qui ne se répète
      // pas rend l'exercice insoluble sans qu'aucune erreur ne s'affiche.
      if (c.game_type === "pattern_select" || c.game_type === "pattern_build") {
        const n = (c.instructions ?? []).length;
        const [d, f] = [c.motif_start, c.motif_end];
        if (!Number.isInteger(d) || !Number.isInteger(f) || d < 0 || f < d || f >= n) {
          mauvais(`${e.title} / ${c.title} : motif_start/motif_end hors des instructions`);
        } else {
          const motif = c.instructions.slice(d, f + 1);
          // On compte les retours identiques, puis on s'arrête : ce qui suit est
          // « le reste », et c'est exactement le sujet de `pattern_build`.
          let tours = 0;
          while (c.instructions.slice(d + tours * motif.length, d + (tours + 1) * motif.length).join("|") === motif.join("|")) tours++;
          if (tours < 2) mauvais(`${e.title} / ${c.title} : le motif annoncé ne revient pas deux fois`);
          if (c.repetitions !== undefined) {
            if (c.repetitions !== tours)
              mauvais(`${e.title} / ${c.title} : ${c.repetitions} répétitions annoncées, ${tours} trouvées`);
            // `pattern_select` demande d'entourer le motif d'un bout à l'autre :
            // la suite doit être entièrement couverte, sans reste.
            if (d + tours * motif.length !== n)
              mauvais(`${e.title} / ${c.title} : ${n - d - tours * motif.length} instruction(s) restent en dehors du motif`);
          }
        }
      }

      if (c.game_type === "sort") {
        if (!Array.isArray(c.items) || c.items.length < 3) mauvais(`${e.title} : un tri d'ordre demande au moins trois phrases`);
        else if (new Set(c.items).size !== c.items.length) mauvais(`${e.title} : deux phrases identiques dans le tri`);
        if (!c.hint) mauvais(`${e.title} : tri d'ordre sans indice`);
      }

      if (c.game_type === "plan_builder") {
        if (!c.phases?.length) mauvais(`${e.title} : plan sans phases`);
        if (!c.distracteurs?.length) mauvais(`${e.title} : plan sans distracteurs`);
        for (const d of c.distracteurs ?? []) if (c.phases?.includes(d)) mauvais(`${e.title} : « ${d} » est piège ET bonne phase`);
      }

      // Une substitution doit aboutir exactement à la sortie annoncée.
      if (c.game_type === "deviens_ordinateur") {
        let ligne = c.ligne;
        (c.etapes ?? []).forEach((et, i) => {
          if (!et.choix?.includes(et.valeur)) mauvais(`${e.title} étape ${i + 1} : « ${et.valeur} » absente des pastilles`);
          if (ligne.indexOf(et.expression) === -1) { mauvais(`${e.title} étape ${i + 1} : « ${et.expression} » introuvable`); return; }
          ligne = ligne.replace(et.expression, et.valeur);
        });
        // La ligne finit sur `print(X)`. X garde ses guillemets quand c'est un
        // texte et n'en a pas quand c'est un nombre : on compare le contenu.
        if (c.sortie !== undefined) {
          const m = /^print\((.*)\)$/.exec(ligne);
          const rendu = m ? m[1].replace(/^"(.*)"$/, "$1") : null;
          if (rendu !== String(c.sortie)) mauvais(`${e.title} : la ligne finit sur ${ligne}, sortie annoncée « ${c.sortie} »`);
        }
      }

      // Une amorce qui finit sur un bloc vide fait planter Pyodide avant que
      // l'enfant ait écrit quoi que ce soit.
      if (c.starter_code && /:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code))
        mauvais(`${e.title} : l'amorce finit sur un bloc vide`);
    }
  }

  // Les nombres annoncés dans les textes doivent être vrais.
  for (const [titre, attendu] of Object.entries(comptes)) {
    const e = EXOS.find((x) => x.title === titre);
    if (!e) { mauvais(`compte réclamé pour « ${titre} », exercice introuvable`); continue; }
    const n = e.blocs.reduce((a, b) => a + (b.content?.items ?? b.content?.pairs ?? b.content?.sentences ?? b.content?.questions ?? []).length, 0);
    if (n !== attendu) mauvais(`${titre} : ${n} éléments, ${attendu} annoncés`);
  }

  if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
  // En mode banc, la sortie standard ne doit contenir que du JSON : les
  // félicitations passent par la sortie d'erreur.
  const dire = process.argv.includes("--banc") ? console.error : console.log;
  dire(`✓ ${EXOS.length} exercices, paliers ${paliers.join("-")}`);
  dire("✓ vocabulaire, bacs, indices, paires, questions, plans et amorces : vérifiés");
}

/** Écrit un lot, ou l'affiche. Refuse d'écraser un lot déjà joué. */
export async function appliquer(db, g, LECON, EXOS, { ecrire, refaire }) {
  const lecons = await g("lessons", "id,title", (q) => q.eq("title", LECON));
  if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
  const L = lecons[0];

  const toutes = await g("trainings", "id,libre_service", (q) => q.eq("lesson_id", L.id));
  const deja = toutes.filter((t) => t.libre_service);
  if (deja.length && !refaire) throw new Error(`${deja.length} exercice(s) de Terrain existent déjà — --refaire pour les remplacer`);
  if (deja.length) {
    const joues = await g("training_progress", "id,training_id", (q) => q.in("training_id", deja.map((t) => t.id)));
    if (joues.length) throw new Error(`${joues.length} progression(s) d'élève sur ce lot — --refaire refusé`);
    if (ecrire) {
      const { error } = await db.from("trainings").delete().in("id", deja.map((t) => t.id));
      if (error) throw new Error(`suppression : ${error.message}`);
      console.log(`  ⟲ ${deja.length} exercices remplacés (personne n'y avait joué)`);
    }
  }
  const parcours = toutes.filter((t) => !t.libre_service).length;
  const DEPART = 100;

  console.log(`\n${ecrire ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${EXOS.length} exercices`);
  console.log(`Séance « ${L.title} » — ${parcours} exercices de parcours conservés\n`);
  EXOS.forEach((e) => console.log(`  [P${e.palier}] ${e.title.padEnd(34)} ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));
  if (!ecrire) { console.log("\nRien n'a été écrit."); return; }

  for (const [i, e] of EXOS.entries()) {
    const { data, error } = await db.from("trainings").insert({
      lesson_id: L.id, title: e.title, description: e.description,
      xp_reward: 0, libre_service: true, palier: e.palier, order_index: DEPART + i,
    }).select("id").single();
    if (error) throw new Error(`${e.title} : ${error.message}`);
    const { error: eb } = await db.from("training_blocks").insert(
      e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j })),
    );
    if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
    console.log(`  ✓ [P${e.palier}] ${e.title}`);
  }

  let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
  console.log("\n── RELECTURE ──");
  const ap = await g("trainings", "id,title,palier,xp_reward,order_index", (q) => q.eq("lesson_id", L.id).eq("libre_service", true).order("order_index"));
  ok(ap.length === EXOS.length, `${EXOS.length} exercices de Terrain (trouvé ${ap.length})`);
  ok(ap.every((e) => e.xp_reward === 0), "aucun ne paie en XP");
  ok(ap.every((e) => [1, 2, 3].includes(e.palier)), "tous ont un palier");
  ok(ap.map((e) => e.order_index).every((v, i) => v === DEPART + i), "numérotation contiguë");
  const restes = await g("trainings", "id", (q) => q.eq("lesson_id", L.id).eq("libre_service", false));
  ok(restes.length === parcours, `les ${parcours} exercices du parcours sont intacts`);
  for (const e of ap) {
    const tb = await g("training_blocks", "order_index,type,content", (q) => q.eq("training_id", e.id).order("order_index"));
    ok(tb.length > 0 && tb.map((b) => b.order_index).every((v, i) => v === i) && tb.every((b) => b.content && Object.keys(b.content).length),
       `${e.title} — ${tb.length} blocs contigus et remplis`);
  }
  console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
  if (pb) process.exit(1);
}

/**
 * Un labyrinthe est-il réellement franchissable ?
 *
 * Les murs sont saisis à la main : rien ne garantit qu'un chemin existe, ni que
 * le budget de blocs suffise. On parcourt la grille en largeur — même méthode
 * que `scripts/verifier-labyrinthes.mjs`, remontée ici pour vérifier AVANT
 * d'écrire plutôt qu'après.
 */
export function cheminLabyrinthe(c) {
  const mur = new Set((c.walls ?? []).map((m) => `${m.x},${m.y}`));
  const dans = (x, y) => x >= 0 && y >= 0 && x < c.grid_size && y < c.grid_size;
  if (!dans(c.start.x, c.start.y)) return { erreur: "le départ est hors de la grille" };
  if (!dans(c.goal.x, c.goal.y)) return { erreur: "l'arrivée est hors de la grille" };
  if (mur.has(`${c.start.x},${c.start.y}`)) return { erreur: "le départ est dans un mur" };
  if (mur.has(`${c.goal.x},${c.goal.y}`)) return { erreur: "l'arrivée est dans un mur" };
  for (const g of c.collectibles ?? []) {
    if (!dans(g.x, g.y)) return { erreur: `une gemme est hors de la grille (${g.x},${g.y})` };
    if (mur.has(`${g.x},${g.y}`)) return { erreur: `une gemme est dans un mur (${g.x},${g.y})` };
  }
  const distance = (a, b) => {
    const file = [{ x: a.x, y: a.y, d: 0 }];
    const vus = new Set([`${a.x},${a.y}`]);
    while (file.length) {
      const { x, y, d } = file.shift();
      if (x === b.x && y === b.y) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (!dans(nx, ny) || mur.has(k) || vus.has(k)) continue;
        vus.add(k); file.push({ x: nx, y: ny, d: d + 1 });
      }
    }
    return null;
  };
  // Le trajet passe par chaque gemme avant l'étoile : on somme les étapes dans
  // l'ordre donné, ce qui est le parcours qu'on demande à l'enfant.
  let pas = 0, ici = c.start;
  for (const g of c.collectibles ?? []) {
    const d = distance(ici, g);
    if (d === null) return { erreur: `aucun chemin jusqu'à la gemme (${g.x},${g.y})` };
    pas += d; ici = g;
  }
  const d = distance(ici, c.goal);
  if (d === null) return { erreur: "aucun chemin jusqu'à l'étoile" };
  return { pas: pas + d };
}

/** Les cas du banc : chaque défi de code, avec ses bonnes et ses mauvaises solutions. */
export function banc(EXOS, SOLUTIONS) {
  const cas = [];
  for (const e of EXOS) {
    for (const b of e.blocs) {
      if (b.type !== "code_challenge") continue;
      const s = SOLUTIONS[e.title];
      if (!s) throw new Error(`${e.title} : défi de code sans solutions de référence`);
      // Un cas peut apporter ses propres réponses : c'est ainsi qu'on éprouve
      // les deux branches d'une décision avec le même programme.
      for (const c of s.cas) cas.push({ code: c.code, tests: b.content.hidden_tests, reponses: c.reponses ?? s.reponses ?? [], nom: `${e.title} — ${c.nom}`, attendu: c.attendu });
    }
  }
  return cas;
}
