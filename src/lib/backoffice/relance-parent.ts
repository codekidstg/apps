import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/email";
import { prenomPublic } from "@/lib/eleve/atelier-regles";

/**
 * Le message de relance d'un parent, écrit à partir de ce que son enfant a
 * réellement fait.
 *
 * Trois règles, et elles comptent plus que la rédaction :
 *
 *  1. Jamais de reproche. Pas de « vous ne vous êtes jamais connecté », pas de
 *     compteur de jours d'absence. Le message parle de l'enfant.
 *  2. Jamais de mérite inventé. Un enfant à zéro n'a rien accompli : le
 *     message bascule alors sur ce qui vient, et ne prétend rien. C'est ici
 *     qu'un générateur bâclé ferait mentir la direction à un parent.
 *  3. Une seule action, un seul lien.
 *
 * Et deux messages séparés, jamais un seul : celui qui rend fier est fait pour
 * être transféré — à l'autre parent, à la tante, au groupe familial. Les
 * identifiants ne doivent pas voyager avec lui.
 */

export type Relance = {
  /** Le message transférable. Aucun identifiant dedans. */
  fier: string;
  /** Les accès, à envoyer juste après, dans la même conversation. */
  acces: string;
};

type Enfant = { id: string; nom: string };
type ParentACibler = { id: string; nom: string; email: string; enfants: Enfant[] };

const jour = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/**
 * Le prénom, pas le premier mot.
 *
 * « ABBEY Elie » commence par le nom de famille : le message disait « Bonjour
 * ABBEY ». La même règle que la page partagée de l'atelier écarte le nom écrit
 * en capitales.
 */
const prenom = prenomPublic;

type Exploit = {
  derniereLecon: { titre: string; quand: string } | null;
  sansIndice: number;
  niveau: string;
  xp: number;
  jeton: string | null;
  themeCourant: string | null;
};

const NIVEAUX: Record<number, string> = { 1: "Explorateur", 2: "Bâtisseur", 3: "Architecte" };

/** Tout ce qu'on sait de ce que les enfants ont fait, en un seul lot de requêtes. */
async function exploits(idsEleves: string[]): Promise<Map<string, Exploit>> {
  const resultat = new Map<string, Exploit>();
  if (idsEleves.length === 0) return resultat;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [eleves, progres, entrainements, ateliers] = await Promise.all([
    admin.from("students").select("id, level_num, xp").in("id", idsEleves),
    admin.from("lesson_progress")
      .select("student_id, completed_at, lessons!lesson_id(title, chapters!chapter_id(themes!theme_id(title)))")
      .in("student_id", idsEleves).eq("status", "completed").order("completed_at", { ascending: false }),
    admin.from("training_progress")
      .select("student_id").in("student_id", idsEleves).eq("reussi_sans_indice", true),
    admin.from("atelier_eleve").select("student_id, jeton").in("student_id", idsEleves).not("jeton", "is", null),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parEleve = <T,>(rows: any[], cle = "student_id") => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) {
      const liste = m.get(r[cle]) ?? [];
      liste.push(r);
      m.set(r[cle], liste as T[]);
    }
    return m;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lecons = parEleve<any>(progres.data ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sans = parEleve<any>(entrainements.data ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jetons = parEleve<any>(ateliers.data ?? []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of (eleves.data ?? []) as any[]) {
    const derniere = (lecons.get(e.id) ?? []).find((r) => r.completed_at && r.lessons?.title);
    resultat.set(e.id, {
      derniereLecon: derniere ? { titre: derniere.lessons.title, quand: derniere.completed_at } : null,
      themeCourant: derniere?.lessons?.chapters?.themes?.title ?? null,
      sansIndice: (sans.get(e.id) ?? []).length,
      niveau: NIVEAUX[e.level_num ?? 1] ?? "Explorateur",
      xp: e.xp ?? 0,
      jeton: (jetons.get(e.id) ?? [])[0]?.jeton ?? null,
    });
  }
  return resultat;
}

/** Ce qu'on raconte d'un enfant — ou rien, s'il n'y a rien à raconter. */
function phrasesEnfant(nom: string, x: Exploit | undefined): string[] {
  const p = prenom(nom);
  if (!x) return [];
  const lignes: string[] = [];

  if (x.derniereLecon) {
    lignes.push(
      `${p} a terminé « ${x.derniereLecon.titre} » le ${jour(x.derniereLecon.quand)}` +
      (x.themeCourant ? `, dans « ${x.themeCourant} ».` : "."),
    );
  }

  // Trois, c'est le seuil où ça cesse d'être un hasard et devient une manière
  // de travailler — et c'est ce qui touche un parent : l'autonomie.
  if (x.sansIndice >= 3) {
    lignes.push(`${x.sansIndice} exercices réussis sans demander une seule aide.`);
  }

  if (x.xp > 0) {
    lignes.push(`${x.xp.toLocaleString("fr-FR")} points au compteur, niveau ${x.niveau}.`);
  }

  if (x.jeton) {
    lignes.push(`Et un programme écrit de sa main — vous pouvez y jouer : ${SITE_URL}/fr/p/${x.jeton}`);
  }

  return lignes;
}

export function redigerRelance(
  parent: ParentACibler,
  parEleve: Map<string, Exploit>,
  motDePasse: string | null,
): Relance {
  const corps = parent.enfants.flatMap((e) => phrasesEnfant(e.nom, parEleve.get(e.id)));
  const prenoms = parent.enfants.map((e) => prenom(e.nom));
  const liste = prenoms.length > 1 ? `${prenoms.slice(0, -1).join(", ")} et ${prenoms.at(-1)}` : prenoms[0] ?? "votre enfant";

  const ouverture = `Bonjour ${prenom(parent.nom)},`;

  // Rien à raconter : on ne fabrique pas un exploit. On parle de ce qui vient.
  const milieu = corps.length > 0
    ? corps
    : [`${liste} vient de rejoindre CodeKids, et sa première séance approche.`];

  /**
   * Tout est écrit sans genre, volontairement.
   *
   * La colonne `gender` est vide pour six élèves sur sept : s'y fier, c'est
   * écrire « il » à la mère d'une fille. Une tournure neutre coûte une seconde
   * de rédaction et ne se trompe jamais.
   */
  const fermeture = [
    `Vous pouvez suivre tout ça depuis votre espace : ${prenoms.length > 1 ? "leurs" : "ses"} séances, ${prenoms.length > 1 ? "leurs" : "ses"} progrès, et ${prenoms.length > 1 ? "leurs" : "ses"} certificats dès qu'ils arrivent.`,
    SITE_URL + "/fr/suivi",
    "",
    "Roland · CodeKids",
  ];

  return {
    fier: [ouverture, "", ...milieu, "", ...fermeture].join("\n"),
    acces: [
      "Vos accès à CodeKids :",
      `Identifiant : ${parent.email}`,
      motDePasse
        ? `Mot de passe : ${motDePasse}`
        : "Mot de passe : répondez à ce message, je vous l'envoie.",
      SITE_URL + "/fr/connexion",
    ].join("\n"),
  };
}

/** Les deux messages, pour chaque parent de la liste. */
export async function construireRelances(parents: ParentACibler[]): Promise<Record<string, Relance>> {
  const ids = parents.flatMap((p) => p.enfants.map((e) => e.id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [parEleve, { data: profils }] = await Promise.all([
    exploits(ids),
    admin.from("profiles").select("id, temp_password").in("id", parents.map((p) => p.id)),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const motDePasse = new Map(((profils ?? []) as any[]).map((p) => [p.id, p.temp_password as string | null]));

  return Object.fromEntries(
    parents.map((p) => [p.id, redigerRelance(p, parEleve, motDePasse.get(p.id) ?? null)]),
  );
}
