import { createAdminClient } from "@/lib/supabase/server";
import { statutParent, type StatutParent } from "./statut-parent";
import { joursDepuis } from "./statut-eleve";
import { jourTogo } from "@/lib/planning/dates";

/**
 * Données de l'écran « Parents », partagées par /admin et /manager.
 *
 * Les deux pages en avaient chacune leur copie. Elles ont divergé sur un seul
 * caractère : la version manager demandait `profiles(...)` sans préciser par
 * quelle clé passer. Or `students` référence `profiles` deux fois — par
 * `profile_id` (l'élève) et par `teacher_id` (son prof). PostgREST refuse alors
 * la requête, l'erreur n'était pas lue, et tous les parents s'affichaient avec
 * « 0 enfant » côté manager alors que la liaison existait bien.
 *
 * Un seul chargement pour les deux écrans : la question ne peut plus se reposer.
 */
/**
 * `xp` et `level_num` sont normalisés ici : la liste les affiche tels quels et
 * un null s'y écrirait « null XP ». Les anciennes pages passaient par `any`,
 * ce qui masquait le problème au lieu de le régler.
 */
export type ParentChild = {
  parent_id: string;
  student_id: string;
  students: {
    id: string;
    xp: number;
    level_num: number;
    profiles: { id: string; display_name: string } | null;
  } | null;
};

/**
 * Ce que la direction voit de la présence d'un parent. Les textes arrivent
 * tout faits : calculés dans le navigateur, « il y a 3 jours » différerait du
 * rendu serveur et casserait l'hydratation.
 */
export type ActiviteParent = {
  statut: StatutParent;
  /** « aujourd'hui », « il y a 3 jours », « jamais ». */
  presence: string;
  /** D'où vient cette présence : une visite enregistrée, ou seulement la dernière connexion. */
  presenceSource: "visite" | "connexion" | null;
  /** Jours distincts de visite sur 30 — null tant que le journal n'existe pas. */
  joursVisite30: number | null;
  consentement: boolean;
  abonnement: "actif" | "essai" | "termine" | "aucun";
  notifications: boolean;
  derniereAction: string | null;
  recents: string[];
  journalActif: boolean;
};

export type ParentRow = {
  id: string;
  display_name: string;
  email: string;
  children: ParentChild[];
  activite: ActiviteParent;
};

export async function getParentsPageData(): Promise<{
  parents: ParentRow[];
  studentList: { id: string; display_name: string }[];
}> {
  const admin = createAdminClient();

  const [
    { data: parents, error: errParents },
    { data: authList },
    { data: links, error: errLinks },
    { data: allStudents, error: errStudents },
  ] = await Promise.all([
    (admin.from("profiles") as any)
      .select("id, display_name, created_at").eq("role", "parent").order("display_name"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    // `!profile_id` est obligatoire : sans lui la requête entière est rejetée.
    (admin.from("parent_children") as any)
      .select("parent_id, student_id, students(id, xp, level_num, profiles!profile_id(id, display_name))"),
    (admin.from("profiles") as any)
      .select("id, display_name").eq("role", "student").order("display_name"),
  ]);

  // Une erreur ici vidait silencieusement l'écran. Elle doit au moins se voir.
  for (const [quoi, err] of [["parents", errParents], ["liaisons", errLinks], ["élèves", errStudents]] as const) {
    if (err) console.error(`Écran Parents — ${quoi} :`, err.message);
  }

  const emailById = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));
  const connexionById = new Map((authList?.users ?? []).map((u: any) => [u.id, u.last_sign_in_at ?? null]));
  const activites = await chargerActivites(
    (parents ?? []).map((p: any) => ({ id: p.id, compteCree: p.created_at, derniereConnexion: connexionById.get(p.id) ?? null })),
  );

  const linksByParent = new Map<string, ParentChild[]>();
  for (const l of (links ?? []) as any[]) {
    const arr = linksByParent.get(l.parent_id) ?? [];
    arr.push({
      parent_id:  l.parent_id,
      student_id: l.student_id,
      students: l.students
        ? {
            id:        l.students.id,
            xp:        l.students.xp ?? 0,
            level_num: l.students.level_num ?? 1,
            profiles:  l.students.profiles ?? null,
          }
        : null,
    });
    linksByParent.set(l.parent_id, arr);
  }

  return {
    parents: (parents ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name ?? "—",
      email: emailById.get(p.id) ?? "—",
      children: linksByParent.get(p.id) ?? [],
      activite: activites.get(p.id)!,
    })),
    studentList: (allStudents ?? []).map((s: any) => ({ id: s.id, display_name: s.display_name })),
  };
}

const JOUR = 86_400_000;
const depuisTexte = (d: Date, maintenant: Date) => {
  const n = joursDepuis(d, maintenant);
  return n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} jours`;
};
const dateTexte = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })
  + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const LIBELLE_ACTIVITE: Record<string, string> = {
  visite: "a ouvert son espace",
  certificat: "a ouvert un certificat",
};

/**
 * La présence de chaque parent, et ses démarches.
 *
 * Le journal des visites (migration 032) peut ne pas exister encore : dans ce
 * cas l'écran s'appuie sur la dernière connexion, et le dit.
 */
async function chargerActivites(
  parents: { id: string; compteCree: string; derniereConnexion: string | null }[],
  maintenant: Date = new Date(),
): Promise<Map<string, ActiviteParent>> {
  const resultat = new Map<string, ActiviteParent>();
  if (!parents.length) return resultat;
  const ids = parents.map((p) => p.id);

  const admin = createAdminClient() as any;
  const [journal, consentements, abonnements, paiements, push] = await Promise.all([
    admin.from("activite_parents").select("parent_id, type, created_at")
      .in("parent_id", ids).gte("created_at", new Date(maintenant.getTime() - 90 * JOUR).toISOString())
      .order("created_at", { ascending: false }),
    admin.from("parental_consents").select("parent_id, consented_at, revoked_at").in("parent_id", ids),
    admin.from("subscriptions").select("parent_id, status").in("parent_id", ids),
    admin.from("payments").select("parent_id, status, paid_at, created_at").in("parent_id", ids).eq("status", "success"),
    admin.from("push_subscriptions").select("user_id").in("user_id", ids),
  ]);
  for (const [nom, res] of Object.entries({ consentements, abonnements, paiements, push })) {
    if ((res as any).error) console.error(`[parents] ${nom} :`, (res as any).error.message);
  }
  const journalActif = !journal.error;

  for (const p of parents) {
    const evenements = ((journal.data ?? []) as any[]).filter((e) => e.parent_id === p.id);
    const derniereVisite = evenements[0] ? new Date(evenements[0].created_at) : null;
    const connexion = p.derniereConnexion ? new Date(p.derniereConnexion) : null;

    // La présence : la plus récente des deux traces.
    const presence = [derniereVisite, connexion].filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const presenceSource = !presence ? null : presence === derniereVisite ? "visite" : "connexion";

    const mesConsentements = ((consentements.data ?? []) as any[]).filter((c) => c.parent_id === p.id);
    const statuts = ((abonnements.data ?? []) as any[]).filter((s) => s.parent_id === p.id).map((s) => s.status);
    const mesPaiements = ((paiements.data ?? []) as any[]).filter((x) => x.parent_id === p.id);

    // La dernière chose qu'il a faite, toutes sources confondues.
    const actions: { quand: Date; quoi: string }[] = [
      ...evenements.slice(0, 1).map((e) => ({ quand: new Date(e.created_at), quoi: LIBELLE_ACTIVITE[e.type] ?? e.type })),
      ...mesConsentements.filter((c) => c.consented_at).map((c) => ({ quand: new Date(c.consented_at), quoi: "a signé le consentement" })),
      ...mesPaiements.map((x) => ({ quand: new Date(x.paid_at ?? x.created_at), quoi: "a payé" })),
      ...(connexion ? [{ quand: connexion, quoi: "s'est connecté" }] : []),
    ].sort((a, b) => b.quand.getTime() - a.quand.getTime());

    resultat.set(p.id, {
      statut: statutParent({ dernierePresence: presence, compteCree: new Date(p.compteCree) }, maintenant),
      presence: presence ? depuisTexte(presence, maintenant) : "jamais",
      presenceSource,
      joursVisite30: journalActif
        ? new Set(evenements.filter((e) => joursDepuis(new Date(e.created_at), maintenant) < 30).map((e) => jourTogo(new Date(e.created_at)))).size
        : null,
      consentement: mesConsentements.some((c) => !c.revoked_at),
      abonnement: statuts.includes("active") ? "actif" : statuts.includes("trial") ? "essai" : statuts.length ? "termine" : "aucun",
      notifications: ((push.data ?? []) as any[]).some((s) => s.user_id === p.id),
      derniereAction: actions[0] ? `${actions[0].quoi} — ${depuisTexte(actions[0].quand, maintenant)}` : null,
      recents: evenements.slice(0, 8).map((e) => `${dateTexte(new Date(e.created_at))} — ${LIBELLE_ACTIVITE[e.type] ?? e.type}`),
      journalActif,
    });
  }
  return resultat;
}
