import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

/**
 * « Le Grand Plan » — la réalisation que l'enfant montre à son parent.
 *
 * Quand une leçon contient un plan (`plan_builder`), la terminer produit une
 * page publique : le plan que l'enfant a écrit en français, le programme que
 * c'est devenu, et le dessin que son code a tracé.
 *
 * Rien n'est recalculé ici : le plan et le programme sont déjà en base, dans
 * `lesson_progress.block_progress.gameStates`, écrits au fil de la séance par
 * `syncBlockProgress`. On ne fait que les figer sous un lien.
 *
 * ── Ce qui part sur un lien public ────────────────────────────────────────
 * Le PRÉNOM SEUL, jamais le nom de famille : la page est lisible par quiconque
 * possède l'adresse, y compris sans compte. Tout le reste (identifiants,
 * classe, école, scores) reste à l'intérieur de la plateforme.
 */

/** Le prénom, et rien d'autre : « Ryshawn Ekoué AHYI-YENOU » → « Ryshawn ». */
export function prenomSeul(nomComplet: string | null | undefined): string {
  const premier = (nomComplet ?? "").trim().split(/\s+/)[0] ?? "";
  return premier || "Un élève";
}

/**
 * Un identifiant imprévisible : c'est la seule protection du lien. 24 caractères
 * base64url ≈ 128 bits — il ne se devine pas à partir d'un autre.
 */
function nouvelIdentifiant(): string {
  return crypto.randomBytes(18).toString("base64url");
}

type Bloc = { id: string; type: string; content: Record<string, unknown> };

export type Realisation = {
  shareId: string;
  cree: boolean;
};

/**
 * Enregistre (ou met à jour) la réalisation d'un élève pour une leçon.
 *
 * Ne lève jamais : l'échec ne doit pas empêcher un enfant de terminer sa
 * leçon. Rend `null` quand il n'y a rien à montrer.
 *
 * Depuis le 30 septembre 2026, une leçon de MUSIQUE en produit une aussi : la
 * chanson que l'enfant a composée librement. Le plan n'est donc plus
 * obligatoire — le thème du Griot n'en a qu'à sa cinquième séance, et les
 * compositions des séances 3 et 4 méritaient déjà d'être entendues.
 */
export async function enregistrerRealisation(
  studentId: string,
  lessonId: string,
): Promise<Realisation | null> {
  try {
    const admin = createAdminClient();

    const { data: blocsRaw } = await (admin.from("lesson_blocks") as any)
      .select("id, type, content, order_index")
      .eq("lesson_id", lessonId)
      .order("order_index");
    const blocs = (blocsRaw ?? []) as Bloc[];

    const jeu = (b: Bloc) => (b.content?.game_type as string | undefined);
    const blocPlan = blocs.find((b) => jeu(b) === "plan_builder");

    // Le labyrinthe qui DESSINE d'abord : c'est lui qui impressionne un parent.
    // À défaut, le dernier labyrinthe de la leçon.
    const mazes = blocs.filter((b) => jeu(b) === "maze");
    const blocMaze = mazes.find((b) => b.content?.trail === true) ?? mazes[mazes.length - 1];

    // La composition LIBRE d'abord : c'est la chanson que l'enfant a inventée,
    // pas celle qu'on lui a demandé de reproduire. À défaut, le dernier défi
    // musical de la leçon.
    const musiques = blocs.filter((b) => jeu(b) === "music");
    const blocMusique = musiques.find((b) => b.content?.free_mode === true) ?? musiques[musiques.length - 1];

    // Une leçon qui n'a ni plan ni musique ne produit rien à montrer.
    if (!blocPlan && !blocMusique) return null;

    const { data: prog } = await (admin.from("lesson_progress") as any)
      .select("block_progress")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const etats = ((prog?.block_progress as any)?.gameStates ?? {}) as Record<string, unknown>;

    const planBrut = blocPlan ? etats[blocPlan.id] : null;
    const plan = Array.isArray(planBrut) ? (planBrut as string[]) : [];

    const programme = blocMaze ? etats[blocMaze.id] : null;

    // La chanson telle que l'enfant l'a laissée, avec la configuration du défi :
    // sans elle, la page publique ne saurait ni à quel tempo jouer ni quels
    // blocs montrer.
    const chansonXml = blocMusique ? etats[blocMusique.id] : null;
    const musique = typeof chansonXml === "string" && chansonXml.includes("<block")
      ? { config: blocMusique!.content, xml: chansonXml }
      : null;

    // Rien à montrer : ni plan composé, ni chanson écrite. On ne fabrique pas
    // une page vide pour un parent — c'est aussi ce que dit la contrainte de
    // la migration 041.
    if (!plan.length && !musique && !programme) return null;

    const [{ data: eleve }, { data: avatar }] = await Promise.all([
      (admin.from("students") as any)
        .select("profiles!profile_id(display_name)")
        .eq("id", studentId)
        .maybeSingle(),
      (admin.from("student_avatar") as any).select("*").eq("student_id", studentId).maybeSingle(),
    ]);

    const ligne = {
      student_id:  studentId,
      lesson_id:   lessonId,
      first_name:  prenomSeul(eleve?.profiles?.display_name),
      avatar:      avatar ?? null,
      plan,
      program_xml: typeof programme === "string" ? programme : null,
      maze:        blocMaze?.content ?? null,
      musique,
      updated_at:  new Date().toISOString(),
    };

    // Le lien déjà partagé doit rester valide : on ne regénère l'identifiant
    // que s'il n'y en a pas encore.
    const { data: existante } = await (admin.from("lesson_shares") as any)
      .select("share_id")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (existante?.share_id) {
      const { error } = await (admin.from("lesson_shares") as any)
        .update(ligne)
        .eq("student_id", studentId)
        .eq("lesson_id", lessonId);
      if (error) { console.error("[realisation] mise à jour :", error.message); return null; }
      return { shareId: existante.share_id, cree: false };
    }

    const shareId = nouvelIdentifiant();
    const { error } = await (admin.from("lesson_shares") as any).insert({ ...ligne, share_id: shareId });
    if (error) { console.error("[realisation] création :", error.message); return null; }
    return { shareId, cree: true };
  } catch (e) {
    console.error("[realisation] inattendu :", e);
    return null;
  }
}
