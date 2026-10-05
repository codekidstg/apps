import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/email";
import { prenomPublic } from "@/lib/eleve/atelier-regles";
import { chargerParcours, type Parcours } from "@/lib/progression";

/**
 * Le message de relance d'un parent.
 *
 * La première version était un relevé de notes : titre de la leçon, nombre
 * d'exercices, nombre de points. Un parent qui ne suit pas décroche à la
 * deuxième ligne — « La répétition — Kirikou dit moins pour faire plus » est
 * un titre écrit pour un enfant de dix ans, et personne ne sait si 2 620
 * points, c'est bien.
 *
 * Il dit maintenant trois choses, dans cet ordre : un fait qui surprend, un
 * repère qui situe, une invitation. Le reste a été jeté.
 *
 * Quatre règles tenues dans la rédaction :
 *
 *  1. Jamais de reproche. Pas de compteur de jours d'absence : le message
 *     parle de l'enfant, pas de l'absence du parent.
 *  2. Jamais de mérite inventé. Un enfant qui n'a rien fait fait basculer le
 *     texte sur ce qui vient, sans « savez-vous que » — il n'y a rien à
 *     révéler.
 *  3. Rien de genré. La colonne `gender` est vide pour six élèves sur sept :
 *     s'y fier reviendrait à écrire « il » à la mère d'une fille.
 *  4. Une porte de sortie. « Répondez-moi simplement » distingue le parent
 *     bloqué à la connexion du parent désintéressé — ce ne sont pas les mêmes,
 *     et ça ne se traite pas pareil.
 *
 * Et deux messages séparés, jamais un seul : celui qui rend fier est fait pour
 * être transféré. Les identifiants ne voyagent pas avec lui.
 */

export type Relance = {
  /** Le message transférable. Aucun identifiant dedans. */
  fier: string;
  /** Les accès, à envoyer juste après, dans la même conversation. */
  acces: string;
};

type Enfant = { id: string; nom: string; niveau: string };
type ParentACibler = { id: string; nom: string; email: string; enfants: Enfant[] };

const prenom = prenomPublic;

/** Ce qu'on sait de ce que fait l'enfant *en ce moment*. */
type Situation = {
  parcours: Parcours;
  /** Part des entraînements réussis sans indice, sur ceux qu'il a terminés. */
  autonomie: number | null;
  /** Le jeton d'un programme qu'il a partagé depuis son atelier. */
  jeton: string | null;
};

async function situations(eleves: Enfant[]): Promise<Map<string, Situation>> {
  const resultat = new Map<string, Situation>();
  if (eleves.length === 0) return resultat;

  const ids = eleves.map((e) => e.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [parcours, entrainements, ateliers] = await Promise.all([
    // Le même calcul que le tableau des élèves : le thème *en cours*, pas
    // celui de la dernière leçon terminée. C'est ce que l'enfant fait
    // aujourd'hui qui intéresse son parent.
    chargerParcours(admin, eleves.map((e) => ({ id: e.id, niveau: e.niveau }))),
    admin.from("training_progress")
      .select("student_id, reussi_sans_indice").in("student_id", ids).eq("status", "completed"),
    admin.from("atelier_eleve").select("student_id, jeton").in("student_id", ids).not("jeton", "is", null),
  ]);

  const faits = new Map<string, { total: number; sans: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (entrainements.data ?? []) as any[]) {
    const c = faits.get(r.student_id) ?? { total: 0, sans: 0 };
    c.total += 1;
    if (r.reussi_sans_indice) c.sans += 1;
    faits.set(r.student_id, c);
  }

  const jetons = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (ateliers.data ?? []) as any[]) if (!jetons.has(r.student_id)) jetons.set(r.student_id, r.jeton);

  for (const e of eleves) {
    const c = faits.get(e.id);
    resultat.set(e.id, {
      parcours: parcours.get(e.id)!,
      // Sous cinq entraînements, le taux ne veut rien dire : on se tait.
      autonomie: c && c.total >= 5 ? c.sans / c.total : null,
      jeton: jetons.get(e.id) ?? null,
    });
  }
  return resultat;
}

/** « presque tous », « la plupart de » — ou rien, si ce n'est pas flatteur. */
function motAutonomie(part: number | null): string | null {
  if (part === null) return null;
  if (part >= 0.8) return "presque tous";
  if (part >= 0.5) return "la plupart de";
  return null;
}

const RANGS = ["", "1re", "2e", "3e", "4e", "5e", "6e", "7e", "8e", "9e", "10e"];
const rang = (n: number) => RANGS[n] ?? `${n}e`;

/**
 * Ce qu'on raconte d'un enfant : une révélation, puis un repère.
 *
 * Le titre du thème est cité entre guillemets plutôt qu'intégré à la phrase —
 * ils sont écrits à la première personne (« Je guide un robot dans un
 * labyrinthe »), et aucune tournure ne les avale proprement.
 */
function paragraphesEnfant(nom: string, s: Situation | undefined): string[] {
  const p = prenom(nom);
  if (!s) return [];
  const { parcours: q } = s;

  // Rien d'ouvert, ou rien de commencé : pas de « savez-vous que », il n'y a
  // rien à révéler.
  if (q.aucunThemeActive || !q.themeCourant) {
    return [`${p} vient de rejoindre CodeKids, et sa première séance approche.`];
  }

  const ouverture = s.jeton
    ? `Savez-vous que ${p} a écrit son propre programme ? Vous pouvez y jouer ici :\n${SITE_URL}/fr/p/${s.jeton}`
    : `Savez-vous que ${p} travaille en ce moment sur « ${q.themeCourant} » ?`;

  const mot = motAutonomie(s.autonomie);
  const bouts: string[] = [];

  /**
   * « il ou elle » est illisible, et répéter le prénom à chaque phrase pèse.
   * On s'appuie donc sur des possessifs qui s'accordent avec le nom commun —
   * « sa séance », « il compte » pour le thème — et le prénom ne revient
   * qu'une fois, là où il porte quelque chose.
   */
  if (q.termine) {
    bouts.push(`${p} vient de terminer tout ce qui lui était ouvert — c'est du beau travail.`);
  } else if (q.faites === 0) {
    bouts.push(`${p} vient de le commencer : il compte ${q.total} séances.`);
  } else {
    bouts.push(`C'est sa ${rang(q.faites)} séance sur ${q.total}.`);
  }

  if (mot) {
    bouts.push(`${p} résout ${mot} ses exercices sans demander d'aide.`);
  }

  return [ouverture, bouts.join(" ")];
}

export function redigerRelance(
  parent: ParentACibler,
  parEleve: Map<string, Situation>,
  motDePasse: string | null,
): Relance {
  const corps = parent.enfants.flatMap((e) => paragraphesEnfant(e.nom, parEleve.get(e.id)));
  const prenoms = parent.enfants.map((e) => prenom(e.nom));
  const pluriel = prenoms.length > 1;
  // Le prénom plutôt que « il ou elle » : c'est plus court, et c'est juste.
  const liste = pluriel
    ? `${prenoms.slice(0, -1).join(", ")} et ${prenoms.at(-1)}`
    : prenoms[0] ?? "votre enfant";

  const fier = [
    `Bonjour ${prenom(parent.nom)},`,
    "",
    ...corps.flatMap((c) => [c, ""]),
    `Vous pouvez voir ce que ${pluriel ? "font" : "fait"} ${liste}, séance par séance, depuis votre espace :`,
    `${SITE_URL}/fr/suivi`,
    "",
    "Si vous n'arrivez pas à vous connecter, répondez-moi simplement.",
    "",
    "Roland · CodeKids",
  ].join("\n");

  return {
    fier,
    acces: [
      "Vos accès à CodeKids :",
      `Identifiant : ${parent.email}`,
      motDePasse
        ? `Mot de passe : ${motDePasse}`
        : "Mot de passe : répondez à ce message, je vous l'envoie.",
      `${SITE_URL}/fr/connexion`,
    ].join("\n"),
  };
}

/** Les deux messages, pour chaque parent de la liste. */
export async function construireRelances(parents: ParentACibler[]): Promise<Record<string, Relance>> {
  const enfants = parents.flatMap((p) => p.enfants);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [parEleve, { data: profils }] = await Promise.all([
    situations(enfants),
    admin.from("profiles").select("id, temp_password").in("id", parents.map((p) => p.id)),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const motDePasse = new Map(((profils ?? []) as any[]).map((p) => [p.id, p.temp_password as string | null]));

  return Object.fromEntries(
    parents.map((p) => [p.id, redigerRelance(p, parEleve, motDePasse.get(p.id) ?? null)]),
  );
}
