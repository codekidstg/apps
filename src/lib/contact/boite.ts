import { createAdminClient } from "@/lib/supabase/server";

/**
 * La boîte de réception de la direction — données partagées par /admin et
 * /manager, comme les écrans Parents et Élèves.
 *
 * « Contacter la direction » promettait aux parents une réponse sous 48 h, mais
 * aucune page n'affichait la table `contact_messages` : le premier message
 * reçu, le 3 août 2026, est resté 43 jours sans lecteur.
 *
 * Deux destinataires voient tout, le manager et l'admin. Pour qu'aucun ne
 * compte sur l'autre, le premier qui ouvre un message le prend en charge et son
 * nom s'affiche.
 */

export const DELAI_PROMIS_HEURES = 48;

export type EtatMessage = "a_traiter" | "pris_en_charge" | "repondu" | "clos";

export type MessageDirection = {
  id: string;
  sujet: string;
  texte: string;
  recuLe: string;
  parentNom: string;
  enfants: string[];
  etat: EtatMessage;
  enRetard: boolean;
  priseEnCharge: { parId: string; parNom: string; le: string } | null;
  reponse: { texte: string; parNom: string; le: string; vueLe: string | null } | null;
  cloture: { note: string | null; le: string } | null;
};

type Ligne = {
  id: string;
  parent_id: string | null;
  parent_name: string | null;
  subject: string;
  message: string;
  created_at: string;
  read_at: string | null;
  claimed_by?: string | null;
  claimed_at?: string | null;
  reply?: string | null;
  replied_by?: string | null;
  replied_at?: string | null;
  closed_at?: string | null;
  closed_note?: string | null;
  reply_seen_at?: string | null;
};

/** L'état se déduit des dates : une réponse l'emporte sur tout le reste. */
export function etatDe(l: Pick<Ligne, "replied_at" | "closed_at" | "claimed_by">): EtatMessage {
  if (l.replied_at) return "repondu";
  if (l.closed_at) return "clos";
  if (l.claimed_by) return "pris_en_charge";
  return "a_traiter";
}

export function estEnRetard(
  l: Pick<Ligne, "replied_at" | "closed_at" | "created_at">,
  maintenant = Date.now(),
): boolean {
  if (l.replied_at || l.closed_at) return false;
  return maintenant - new Date(l.created_at).getTime() > DELAI_PROMIS_HEURES * 3_600_000;
}

export async function chargerBoiteDirection(): Promise<{
  aTraiter: MessageDirection[];
  traites: MessageDirection[];
  erreur: string | null;
}> {
  const admin = createAdminClient();

  // `select("*")` : les colonnes de prise en charge arrivent avec la migration
  // 028. Les nommer ferait échouer toute la requête tant qu'elle n'est pas
  // passée, alors que les messages eux-mêmes restent lisibles.
  const { data, error } = await (admin.from("contact_messages") as any)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[boite direction] messages :", error.message);
    return { aTraiter: [], traites: [], erreur: error.message };
  }
  const lignes = (data ?? []) as Ligne[];

  const idsPersonnel = [...new Set(lignes.flatMap((l) => [l.claimed_by, l.replied_by]).filter(Boolean))] as string[];
  const idsParents   = [...new Set(lignes.map((l) => l.parent_id).filter(Boolean))] as string[];

  const [personnelRes, enfantsRes] = await Promise.all([
    idsPersonnel.length
      ? (admin.from("profiles") as any).select("id, display_name").in("id", idsPersonnel)
      : Promise.resolve({ data: [], error: null }),
    // `students` référence `profiles` deux fois (l'élève et son prof) : sans
    // préciser `profile_id`, PostgREST refuse la requête.
    idsParents.length
      ? (admin.from("parent_children") as any)
          .select("parent_id, students(profiles!profile_id(display_name))")
          .in("parent_id", idsParents)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (personnelRes.error) console.error("[boite direction] personnel :", personnelRes.error.message);
  if (enfantsRes.error) console.error("[boite direction] enfants :", enfantsRes.error.message);

  const nomPersonnel = new Map<string, string>(
    ((personnelRes.data ?? []) as { id: string; display_name: string | null }[])
      .map((p) => [p.id, p.display_name ?? "Direction"]),
  );
  const enfantsParParent = new Map<string, string[]>();
  for (const lien of (enfantsRes.data ?? []) as any[]) {
    const nom = lien.students?.profiles?.display_name;
    if (!nom) continue;
    enfantsParParent.set(lien.parent_id, [...(enfantsParParent.get(lien.parent_id) ?? []), nom]);
  }

  const maintenant = Date.now();
  const messages: MessageDirection[] = lignes.map((l) => ({
    id: l.id,
    sujet: l.subject,
    texte: l.message,
    recuLe: l.created_at,
    parentNom: l.parent_name ?? "Parent",
    enfants: l.parent_id ? (enfantsParParent.get(l.parent_id) ?? []) : [],
    etat: etatDe(l),
    enRetard: estEnRetard(l, maintenant),
    priseEnCharge: l.claimed_by && l.claimed_at
      ? { parId: l.claimed_by, parNom: nomPersonnel.get(l.claimed_by) ?? "Direction", le: l.claimed_at }
      : null,
    reponse: l.reply && l.replied_at
      ? { texte: l.reply, parNom: nomPersonnel.get(l.replied_by ?? "") ?? "Direction", le: l.replied_at, vueLe: l.reply_seen_at ?? null }
      : null,
    cloture: l.closed_at ? { note: l.closed_note ?? null, le: l.closed_at } : null,
  }));

  // À traiter : les retards d'abord, puis le plus ancien — premier arrivé,
  // premier servi. Traités : le plus récent en tête.
  const aTraiter = messages
    .filter((m) => m.etat === "a_traiter" || m.etat === "pris_en_charge")
    .sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || a.recuLe.localeCompare(b.recuLe));
  const dateTraitement = (m: MessageDirection) => m.reponse?.le ?? m.cloture?.le ?? m.recuLe;
  const traites = messages
    .filter((m) => m.etat === "repondu" || m.etat === "clos")
    .sort((a, b) => dateTraitement(b).localeCompare(dateTraitement(a)));

  return { aTraiter, traites, erreur: null };
}

/** Ce que les tableaux de bord et la barre latérale affichent. */
export async function compterBoiteDirection(): Promise<{ aTraiter: number; enRetard: number }> {
  const admin = createAdminClient();
  const limite = new Date(Date.now() - DELAI_PROMIS_HEURES * 3_600_000).toISOString();
  const nonTraites = () =>
    (admin.from("contact_messages") as any)
      .select("id", { count: "exact", head: true })
      .is("replied_at", null)
      .is("closed_at", null);

  const [tous, retard] = await Promise.all([nonTraites(), nonTraites().lt("created_at", limite)]);
  const erreur = tous.error ?? retard.error;
  if (erreur) {
    console.error("[boite direction] compteurs :", erreur.message);
    return { aTraiter: 0, enRetard: 0 };
  }
  return { aTraiter: tous.count ?? 0, enRetard: retard.count ?? 0 };
}
