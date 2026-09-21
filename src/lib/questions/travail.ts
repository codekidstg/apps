import { programmeLisible } from "./programme";

/**
 * Ce que l'enfant a fait dans un exercice, rendu lisible pour son mentor :
 * le texte joint à « Je bloque ici ».
 *
 * Commun aux deux lecteurs, leçon et entraînement : chacun passe l'état qu'il
 * tient pour l'exercice. Avant, chacun avait sa copie, et une douzaine de
 * jeux n'envoyaient rien — le plan de Ryshawn, par exemple.
 *
 * Jamais la réponse attendue : l'enfant et son parent relisent ce texte. On
 * y dit ce que l'enfant a fait, et « (faux) » là où le jeu le lui a déjà dit.
 */

export type Bloc = { id: string; type: string; content: Record<string, unknown> };

export type EtatExercice = {
  quizAnswers?: Record<string, number | null>;
  quizResults?: Record<string, boolean | null>;
  /** Le code tapé : défi de code ou jeu en Python. */
  code?: string | null;
  /** L'état du jeu, tel que le jeu le sauvegarde. */
  jeu?: unknown;
  // Entraînements
  fillAnswers?: Record<string, number | null>;
  fillResults?: Record<string, boolean | null>;
  /** Relier : pour ce bloc, carte de gauche → carte de droite (« l0 » → « r2 »). */
  matchPairs?: Record<string, string>;
  swipeResults?: Record<string, { chosen: string; correct: boolean } | null>;
  dragResults?: Record<string, { chosen: string; correct: boolean } | null>;
};

type Contenu = Record<string, unknown>;
const txt = (v: unknown) => (typeof v === "string" ? v : "");
const tab = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const faux = (juste: boolean | null | undefined) => (juste === false ? " (faux)" : juste ? " (juste)" : "");

export function travailLisible(b: Bloc, e: EtatExercice): string | null {
  const c = b.content ?? {};
  const jeu = typeof c.game_type === "string" ? c.game_type : null;
  const lignesOuNull = (l: (string | null)[]) => {
    const pleines = l.filter((x): x is string => !!x);
    return pleines.length ? pleines.join("\n") : null;
  };

  if (b.type === "quiz") {
    type Q = { question?: string; choices?: string[] };
    const liste: Q[] = Array.isArray(c.questions) ? (c.questions as Q[]) : [c as Q];
    const lignes = liste.map((q, i) => {
      const choix = e.quizAnswers?.[`${b.id}-${i}`];
      if (choix == null) return null;
      return `${q.question ?? `Question ${i + 1}`}\n→ ${q.choices?.[choix] ?? "?"}${faux(e.quizResults?.[`${b.id}-${i}`])}`;
    }).filter(Boolean);
    return lignes.length ? lignes.join("\n\n") : null;
  }

  if (b.type === "code_challenge") return e.code ?? (typeof e.jeu === "string" ? e.jeu : null);

  // Les phrases à compléter des entraînements : un choix par trou.
  if (b.type === "fill_blank" && Array.isArray(c.sentences)) {
    type Phrase = { before?: string; after?: string; options?: string[] };
    return lignesOuNull((c.sentences as Phrase[]).map((s, i) => {
      const choix = e.fillAnswers?.[`${b.id}-${i}`];
      if (choix == null) return null;
      const rate = e.fillResults?.[`${b.id}-${i}`] === false;
      return `${s.before ?? ""} [${s.options?.[choix] ?? "?"}] ${s.after ?? ""}`.trim() + (rate ? " (faux)" : "");
    }));
  }

  if (b.type === "match") {
    const paires = tab<Contenu>(c.pairs);
    return lignesOuNull(Object.entries(e.matchPairs ?? {}).map(([g, d]) => {
      const i = Number(g.slice(1)), j = Number(d.slice(1));
      return `${txt(paires[i]?.left) || "?"} → ${txt(paires[j]?.right) || "?"}${i === j ? "" : " (faux)"}`;
    }));
  }

  if (b.type === "swipe_sort" || b.type === "drag_to_bin") {
    const items = tab<Contenu>(c.items);
    const groupes = tab<Contenu>(b.type === "swipe_sort" ? c.categories : c.bins);
    const nom = (id: string) => txt(groupes.find((g) => g.id === id)?.label) || id;
    const resultats = (b.type === "swipe_sort" ? e.swipeResults : e.dragResults) ?? {};
    return lignesOuNull(items.map((it, i) => {
      // Tri rapide : rangé par position ; bacs : par identifiant de carte.
      const r = resultats[b.type === "swipe_sort" ? `${b.id}-${i}` : `${b.id}-${String(it.id)}`];
      return r ? `${txt(it.label)} → ${nom(r.chosen)}${r.correct ? "" : " (faux)"}` : null;
    }));
  }

  // Les jeux : un programme, un ordre, une sélection…
  if (jeu === "python_maze" || jeu === "python_piano" || jeu === "python_arcade") {
    return e.code ?? (typeof e.jeu === "string" ? e.jeu : null);
  }
  // Les programmes à blocs. Un jeu de leçon sans game_type est un labyrinthe.
  if (jeu === "maze" || jeu === "music" || jeu === "kodi_output" || b.type === "blockly"
    || (!jeu && (b.type === "game" || b.type === "blockly_challenge"))) {
    return programmeLisible(e.jeu);
  }

  const etat = e.jeu;
  if (jeu === "sort" && Array.isArray(etat)) return (etat as string[]).join("\n");

  if (jeu === "fill_blank" && Array.isArray(etat)) {
    let k = 0;
    const reponses = etat as string[];
    return txt(c.template).replace(/\[___\]/g, () => `[${reponses[k++]?.trim() || "…"}]`) || null;
  }

  if (jeu === "pattern_build" && Array.isArray(etat)) {
    const [d, f, nb] = etat as [number, number, number];
    const lignes = tab<string>(c.instructions).slice(d, f + 1);
    return `Répéter ${nb} fois :\n${lignes.map((l) => `   ${l}`).join("\n")}`;
  }

  if (jeu === "pattern_select" && Array.isArray(etat)) {
    const [d, f] = etat as [number, number];
    const lignes = tab<string>(c.instructions).slice(d, f + 1);
    return `Motif choisi : lignes ${d + 1} à ${f + 1}\n${lignes.map((l) => `   ${l}`).join("\n")}`;
  }

  if (jeu === "plan_builder" && Array.isArray(etat)) {
    const plan = etat as string[];
    return plan.length ? `Son plan :\n${plan.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : null;
  }

  if (jeu === "deviens_ordinateur" && typeof etat === "number") {
    const etapes = tab<Contenu>(c.etapes);
    const courante = etapes[etat];
    return `Étapes réussies : ${etat} sur ${etapes.length}${courante ? `\nArrêté sur : ${txt(courante.expression)}` : ""}`;
  }

  if (jeu === "bug_hunt" && typeof etat === "string" && etat !== "") {
    return `A trouvé la ligne fautive (ligne ${Number(etat) + 1}).`;
  }

  if ((jeu === "memory" || jeu === "association") && Array.isArray(etat)) {
    const paires = tab<Contenu>(c.pairs);
    const trouvees = [...new Set((etat as string[]).filter((id) => id.startsWith("L")).map((id) => Number(id.slice(1))))];
    return `Paires trouvées : ${trouvees.length} sur ${paires.length}${trouvees.length
      ? `\n${trouvees.map((i) => `${txt(paires[i]?.left)} ↔ ${txt(paires[i]?.right)}`).join("\n")}` : ""}`;
  }

  return null;
}
