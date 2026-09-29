import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ce qu'il faut savoir pour regarder une séance « comme un enfant ».
 *
 * La page de séance montrait ses blocs et rien d'autre : ni qui peut la voir,
 * ni où chacun en est, ni les exercices qui l'accompagnent. On ne savait donc
 * pas ce qu'un enfant a réellement sous les yeux — et c'est précisément ce
 * qu'on veut vérifier avant de publier quoi que ce soit.
 *
 * Seuls les enfants qui ont ACCÈS AU THÈME sont proposés : voir comme un enfant
 * qui ne l'a pas ne montrerait qu'une page vide. Les autres sont comptés, pour
 * qu'on sache qu'ils existent.
 */
export type EtatSeance = "terminee" | "commencee" | "rien";

export type EnfantApercu = {
  studentId: string;
  nom: string;
  niveau: string;
  etat: EtatSeance;
  termineeLe: string | null;
  /** Ses exercices de salle de jeu sur cette séance. */
  terrainEssayes: number;
  terrainSansIndice: number;
};

export type ExerciceSeance = {
  id: string;
  titre: string;
  description: string | null;
  palier: number | null;
  libreService: boolean;
  moteurs: string[];
  /** Combien d'enfants l'ont essayé au moins une fois, et combien sans indice. */
  essayePar: number;
  sansIndice: number;
};

export type ApercuSeance = {
  enfants: EnfantApercu[];
  /** Des enfants du bon niveau, mais sans accès à ce thème. */
  sansAcces: number;
  parcours: ExerciceSeance[];
  terrain: ExerciceSeance[];
};

const ETAT: Record<string, EtatSeance> = { completed: "terminee", in_progress: "commencee" };

export async function apercuSeance(lessonId: string, options?: { limiterAux?: string[] }): Promise<ApercuSeance> {
  const admin = createAdminClient() as any;

  const { data: lecon } = await admin.from("lessons").select("id, theme_id").eq("id", lessonId).single();
  if (!lecon) return { enfants: [], sansAcces: 0, parcours: [], terrain: [] };
  const { data: theme } = await admin.from("themes").select("id, level").eq("id", lecon.theme_id).single();

  const [{ data: acces }, { data: tousEleves }, { data: exos }] = await Promise.all([
    admin.from("student_theme_access").select("student_id").eq("theme_id", lecon.theme_id),
    admin.from("students").select("id, level, profile_id"),
    admin.from("trainings").select("id, title, description, palier, libre_service, order_index").eq("lesson_id", lessonId).order("order_index"),
  ]);

  const avecAcces = new Set((acces ?? []).map((a: any) => a.student_id));
  let concernes = (tousEleves ?? []).filter((e: any) => avecAcces.has(e.id));
  // Le mentor ne voit que ses élèves : la même page, un périmètre plus petit.
  if (options?.limiterAux) concernes = concernes.filter((e: any) => options.limiterAux!.includes(e.id));
  const sansAcces = (tousEleves ?? []).filter((e: any) => e.level === theme?.level && !avecAcces.has(e.id)).length;

  const ids = concernes.map((e: any) => e.id);
  const idsExos = (exos ?? []).map((t: any) => t.id);

  const [{ data: profils }, { data: progres }, { data: blocs }, { data: progresExos }] = await Promise.all([
    concernes.length
      ? admin.from("profiles").select("id, display_name").in("id", concernes.map((e: any) => e.profile_id))
      : Promise.resolve({ data: [] }),
    ids.length
      ? admin.from("lesson_progress").select("student_id, status, completed_at").eq("lesson_id", lessonId).in("student_id", ids)
      : Promise.resolve({ data: [] }),
    idsExos.length
      ? admin.from("training_blocks").select("training_id, type, content").in("training_id", idsExos)
      : Promise.resolve({ data: [] }),
    idsExos.length
      ? admin.from("training_progress").select("student_id, training_id, attempts, reussi_sans_indice").in("training_id", idsExos)
      : Promise.resolve({ data: [] }),
  ]);

  const nomDe = new Map((profils ?? []).map((p: any) => [p.id, p.display_name]));
  const progresDe = new Map((progres ?? []).map((p: any) => [p.student_id, p]));
  const terrainIds = new Set((exos ?? []).filter((t: any) => t.libre_service).map((t: any) => t.id));

  const enfants: EnfantApercu[] = concernes.map((e: any) => {
    const p = progresDe.get(e.id) as any;
    const siens = (progresExos ?? []).filter((r: any) => r.student_id === e.id && terrainIds.has(r.training_id));
    return {
      studentId: e.id,
      nom: nomDe.get(e.profile_id) ?? "Élève",
      niveau: e.level,
      etat: ETAT[p?.status] ?? "rien",
      termineeLe: p?.completed_at ?? null,
      terrainEssayes: siens.filter((r: any) => (r.attempts ?? 0) > 0).length,
      terrainSansIndice: siens.filter((r: any) => r.reussi_sans_indice).length,
    };
  }).sort((a: EnfantApercu, b: EnfantApercu) => {
    // Ceux qui ont terminé d'abord : leur écran est le plus riche à regarder.
    const rang = { terminee: 0, commencee: 1, rien: 2 };
    return rang[a.etat] - rang[b.etat] || a.nom.localeCompare(b.nom);
  });

  const carte = (t: any): ExerciceSeance => {
    const siens = (progresExos ?? []).filter((r: any) => r.training_id === t.id);
    return {
      id: t.id,
      titre: t.title,
      description: t.description,
      palier: t.palier,
      libreService: !!t.libre_service,
      moteurs: (blocs ?? []).filter((b: any) => b.training_id === t.id)
        .map((b: any) => b.content?.game_type ?? b.type).filter((m: string) => m !== "text"),
      essayePar: siens.filter((r: any) => (r.attempts ?? 0) > 0).length,
      sansIndice: siens.filter((r: any) => r.reussi_sans_indice).length,
    };
  };

  return {
    enfants,
    sansAcces,
    parcours: (exos ?? []).filter((t: any) => !t.libre_service).map(carte),
    terrain:  (exos ?? []).filter((t: any) =>  t.libre_service).map(carte),
  };
}
