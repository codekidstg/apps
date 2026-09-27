/**
 * Relit TOUS les exercices du Terrain, tels qu'ils sont en base.
 *
 *     node scripts/relire-terrain.mjs
 *
 * Les lots ont été écrits les uns après les autres, et les règles se sont
 * ajoutées en cours de route : les premiers lots n'ont jamais connu la moitié
 * des garde-fous. Ce script rejoue toutes les règles sur tout le contenu, plus
 * quelques contrôles qui n'ont de sens qu'une fois l'ensemble écrit — un
 * exercice sans rien à faire, deux exercices du même nom, une étiquette qui
 * revient deux fois dans le même tri.
 *
 * Il ne modifie rien : il lit, il compte, il signale.
 */
import { base, lecteur, verifier } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);

// Le vocabulaire que chaque séance n'a pas encore enseigné, par titre de leçon.
const INTERDITS = {
  "L'ordinateur, la machine magique": [/print\(/, /\bdef\b/, /\bboucle\b/i, /répéter/i, /\bmotif\b/i, /\balgorithme\b/i],
  "Mon premier algorithme":           [/\bboucle\b/i, /répéter/i, /\bmotif\b/i, /print\(/, /\bdef\b/, /tourner/i],
  "Gauche ou droite ?":               [/\bboucle\b/i, /répéter/i, /\bmotif\b/i, /print\(/, /\bdef\b/],
  "Le débogage — Deviens détective du code": [/\bboucle\b/i, /répéter/i, /\bmotif\b/i, /print\(/, /\bdef\b/],
  "La répétition — Kirikou dit moins pour faire plus": [/\bmotif\b/i, /print\(/, /\bdef\b/],
  "Trouver le motif":                 [/print\(/, /\bdef\b/, /pseudocode/i],
  "Plan avant code":                  [/print\(/, /\bdef\b/],
  "Mon premier programme":            [/\bfor\b/, /\bwhile\b/, /\bdef\b/, /\bif\b/, /\brange\(/, /\bstr\(/, /\.append/, /(?<!=)==(?!=)/],
  "Garder une information":           [/\bif\b/, /\bfor\b/, /\bwhile\b/, /\bdef\b/, /\brange\(/, /\bstr\(/, /\.append/, /(?<!=)==(?!=)/],
  "Choisir":                          [/\bfor\b/, /\bwhile\b/, /\bdef\b/, /\belif\b/, /\brange\(/, /\bstr\(/, /\.append/],
  "Répéter":                          [/\bwhile\b/, /\bdef\b/, /\belif\b/, /\bstr\(/, /\.append/],
  "🔧 Le bug qui ne dit rien":         [/\bwhile\b/, /\bdef\b/, /\belif\b/, /\bstr\(/, /\.append/],
};

const INTERACTIFS = new Set(["quiz", "code_challenge", "blockly_challenge", "fill_blank", "match", "swipe_sort", "drag_to_bin"]);

const lecons = await g("lessons", "id,title");
const trainings = await g("trainings", "id,title,description,lesson_id,palier,libre_service,order_index,xp_reward");
const blocs = await g("training_blocks", "id,training_id,type,content,order_index");
const parTraining = new Map();
for (const b of blocs) (parTraining.get(b.training_id) ?? parTraining.set(b.training_id, []).get(b.training_id)).push(b);

let defauts = 0;
const signaler = (m) => { console.log(`⛔ ${m}`); defauts++; };
let nbExos = 0, nbBlocs = 0, nbInteractifs = 0;

for (const lecon of lecons) {
  const mine = trainings.filter((t) => t.lesson_id === lecon.id && t.libre_service)
    .sort((a, b) => a.order_index - b.order_index);
  if (!mine.length) continue;

  const EXOS = mine.map((t) => ({
    palier: t.palier,
    title: t.title,
    description: t.description,
    blocs: (parTraining.get(t.id) ?? []).sort((a, b) => a.order_index - b.order_index)
      .map((b) => ({ type: b.type, content: b.content })),
  }));
  nbExos += EXOS.length;

  console.log(`\n── ${lecon.title} (${EXOS.length} exercices)`);
  try {
    verifier(EXOS, { interdits: INTERDITS[lecon.title] ?? [], paliers: EXOS.map((e) => e.palier) });
  } catch (e) {
    signaler(`${lecon.title} : ${e.message}`);
  }

  // ── Contrôles qui n'ont de sens qu'une fois l'ensemble écrit ────────────
  const titres = EXOS.map((e) => e.title);
  if (new Set(titres).size !== titres.length) signaler(`${lecon.title} : deux exercices portent le même titre`);

  const parcours = trainings.filter((t) => t.lesson_id === lecon.id && !t.libre_service).map((t) => t.title);
  for (const t of titres) if (parcours.includes(t)) signaler(`${lecon.title} : « ${t} » porte le même titre qu'un exercice du parcours`);

  for (const e of EXOS) {
    nbBlocs += e.blocs.length;
    const inter = e.blocs.filter((b) => INTERACTIFS.has(b.type));
    nbInteractifs += inter.length;

    // Un exercice sans rien à faire n'est pas un exercice.
    if (!inter.length) signaler(`${lecon.title} / ${e.title} : aucun bloc interactif — il n'y a rien à jouer`);
    if (!e.description) signaler(`${lecon.title} / ${e.title} : sans description`);

    for (const b of e.blocs) {
      const c = b.content ?? {};
      if (b.type === "text") {
        if (!c.html || c.html.replace(/<[^>]+>/g, "").trim().length < 20)
          signaler(`${lecon.title} / ${e.title} : bloc de texte vide ou trop court`);
        continue;
      }
      // Tout ce qui se joue doit dire ce qu'on attend.
      // Le quiz est le seul moteur dont la consigne vit dans chaque question :
      // son en-tête est fixe (« Quiz flash »), un titre n'y serait pas lu.
      const consigne = b.type === "quiz"
        ? (c.questions ?? []).every((q) => q.question)
        : (c.instruction ?? c.instructions ?? c.description ?? c.title);
      if (!consigne) signaler(`${lecon.title} / ${e.title} : un bloc ${c.game_type ?? b.type} sans consigne`);

      // Deux étiquettes identiques dans un même tri : l'enfant croit à un bug.
      const etiquettes = (c.items ?? []).map((i) => (typeof i === "string" ? i : i.label));
      if (etiquettes.length && new Set(etiquettes).size !== etiquettes.length)
        signaler(`${lecon.title} / ${e.title} : deux étiquettes identiques dans le même exercice`);

      // Une question à choix dont deux options se valent n'a pas de réponse.
      for (const s of c.sentences ?? []) {
        if (new Set(s.options).size !== s.options.length)
          signaler(`${lecon.title} / ${e.title} : la phrase ${s.id} a deux options identiques`);
        if (s.options.length < 3)
          signaler(`${lecon.title} / ${e.title} : la phrase ${s.id} n'a que ${s.options.length} options`);
      }

      // Un défi de code doit avoir de quoi démarrer et de quoi corriger.
      if (b.type === "code_challenge") {
        if (!c.hidden_tests) signaler(`${lecon.title} / ${e.title} : défi de code sans tests cachés`);
        if (!c.starter_code) signaler(`${lecon.title} / ${e.title} : défi de code sans amorce`);
        if (c.hidden_tests && /\b(ATTENDU|EXPECTED)\b/.test(c.hidden_tests))
          signaler(`${lecon.title} / ${e.title} : les tests s'appuient sur une variable fournie de l'extérieur`);
      }
    }
  }
}

console.log(`\n══ ${nbExos} exercices, ${nbBlocs} blocs dont ${nbInteractifs} interactifs`);
console.log(defauts === 0 ? "✅ AUCUN DÉFAUT" : `⛔ ${defauts} DÉFAUT(S)`);
process.exit(defauts === 0 ? 0 : 1);
