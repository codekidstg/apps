"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { accesLecon, accesEntrainement, MESSAGE_REFUS } from "@/lib/eleve/acces";
import { estRaison, LIBELLE_RAISON } from "./raisons";
import { prochaineSeance, jourDeSeance, type SeanceBrute } from "./seance";
import { dateEtHeure } from "@/lib/planning/dates";
import type { Contexte } from "./donnees";

/**
 * « Je bloque ici » — les écritures.
 *
 * L'élève pose sa question depuis l'exercice ; son mentor y répond, ou la
 * règle en séance. Le mentor répond, il n'ouvre jamais de conversation avec un
 * enfant : il n'existe aucune action pour ça.
 */

export type ResultatQuestion = {
  error?: string;
  success?: boolean;
  promesse?: { mentor: string | null; seance: string | null };
};

export type ResultatSimple = { error?: string; success?: boolean };

const MESSAGE_MAX = 500;
const TRAVAIL_MAX = 20_000;
const REPONSE_MAX = 2_000;
const NOTE_MAX = 300;

function rafraichir() {
  // Les segments `[locale]` doivent figurer dans le chemin, sinon rien n'est
  // revalidé ; en mode "layout", les pastilles des menus suivent.
  revalidatePath("/[locale]/eleve", "layout");
  revalidatePath("/[locale]/prof", "layout");
  revalidatePath("/[locale]/suivi", "layout");
}

/** Ce que dit l'exercice, sans jamais sa solution. */
function consigneDe(type: string, content: Record<string, unknown>): string | null {
  if (type === "quiz") {
    const liste = Array.isArray(content.questions) ? content.questions : [content];
    const textes = (liste as any[])
      .map((q) => (typeof q?.question === "string" ? `• ${q.question}` : null))
      .filter(Boolean);
    return textes.length ? textes.join("\n") : null;
  }
  for (const cle of ["instructions", "instruction", "description", "context"]) {
    const v = content[cle];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

// ── Élève ───────────────────────────────────────────────────────────────────

export async function poserQuestion(_prev: ResultatQuestion, formData: FormData): Promise<ResultatQuestion> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Reconnecte-toi pour poser ta question." };

  const admin = createAdminClient();
  const { data: eleve, error: eEleve } = await (admin.from("students") as any)
    .select("id, teacher_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (eEleve) console.error("[questions] élève :", eEleve.message);
  if (!eleve) return { error: "Seuls les élèves peuvent poser une question ici." };

  const lessonId   = String(formData.get("lessonId") ?? "") || null;
  const trainingId = String(formData.get("trainingId") ?? "") || null;
  const blockId    = String(formData.get("blockId") ?? "");
  const raison     = formData.get("raison");
  const message    = String(formData.get("message") ?? "").trim();
  const travail    = String(formData.get("travail") ?? "").trim();
  const essais     = Math.max(0, Math.min(999, Number(formData.get("essais")) || 0));

  if (!!lessonId === !!trainingId || !blockId) return { error: "Il manque l'exercice. Recharge la page." };
  if (!estRaison(raison)) return { error: "Choisis ce qui te bloque." };
  if (message.length > MESSAGE_MAX) return { error: `Ton message est trop long (${MESSAGE_MAX} caractères au plus).` };

  // Même règle d'accès que la page : on ne pose pas de question sur un
  // exercice qu'on n'a pas le droit d'ouvrir.
  const verdict = lessonId
    ? await accesLecon(admin, eleve.id, lessonId)
    : await accesEntrainement(admin, eleve.id, trainingId!);
  if (!verdict.ok) return { error: MESSAGE_REFUS[verdict.raison] };

  const [blocRes, contenuRes] = await Promise.all([
    lessonId
      ? (admin.from("lesson_blocks") as any).select("type, content").eq("id", blockId).eq("lesson_id", lessonId).maybeSingle()
      : (admin.from("training_blocks") as any).select("type, content").eq("id", blockId).eq("training_id", trainingId).maybeSingle(),
    lessonId
      ? (admin.from("lessons") as any).select("title").eq("id", lessonId).maybeSingle()
      : (admin.from("trainings") as any).select("title").eq("id", trainingId).maybeSingle(),
  ]);
  if (blocRes.error) console.error("[questions] exercice :", blocRes.error.message);
  if (!blocRes.data) return { error: "Cet exercice n'existe plus. Recharge la page." };

  const content = (blocRes.data.content ?? {}) as Record<string, unknown>;
  const contexte: Contexte = {
    contenu: { genre: lessonId ? "lecon" : "entrainement", id: (lessonId ?? trainingId)!, titre: contenuRes.data?.title ?? "" },
    bloc: {
      type: blocRes.data.type,
      jeu: typeof content.game_type === "string" ? content.game_type : null,
      titre: typeof content.title === "string" ? content.title : null,
      consigne: consigneDe(blocRes.data.type, content),
    },
    travail: travail ? travail.slice(0, TRAVAIL_MAX) : null,
    essais,
  };

  const maintenant = new Date().toISOString();

  // Une seule question ouverte par exercice : redemander la complète.
  const { data: ouverte, error: eOuverte } = await (admin.from("student_questions") as any)
    .select("id, message, reason")
    .eq("student_id", eleve.id)
    .eq("block_id", blockId)
    .is("replied_at", null)
    .is("closed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eOuverte) console.error("[questions] question ouverte :", eOuverte.message);

  let erreur;
  if (ouverte) {
    const ajout = [raison !== ouverte.reason ? `(${LIBELLE_RAISON[raison]})` : null, message || null].filter(Boolean).join(" ");
    const texte = ajout
      ? [ouverte.message, `— Ajouté le ${dateEtHeure(maintenant)} —\n${ajout}`].filter(Boolean).join("\n\n")
      : ouverte.message;
    ({ error: erreur } = await (admin.from("student_questions") as any)
      .update({ message: texte, context: contexte, updated_at: maintenant })
      .eq("id", ouverte.id));
  } else {
    ({ error: erreur } = await (admin.from("student_questions") as any).insert({
      student_id: eleve.id,
      lesson_id: lessonId,
      training_id: trainingId,
      block_id: blockId,
      reason: raison,
      message: message || null,
      context: contexte,
    }));
  }
  if (erreur) {
    console.error("[questions] envoi :", erreur.message);
    return { error: "Ta question n'est pas partie. Réessaie dans un instant." };
  }

  // La promesse : qui va répondre, et avant quand.
  const [mentorRes, seancesRes] = await Promise.all([
    eleve.teacher_id
      ? (admin.from("profiles") as any).select("display_name").eq("id", eleve.teacher_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    (admin.from("teacher_sessions") as any)
      .select("session_type, weekday, start_time, scheduled_at, active_until")
      .eq("student_id", eleve.id),
  ]);
  if (seancesRes.error) console.error("[questions] séances :", seancesRes.error.message);
  const prochaine = prochaineSeance((seancesRes.data ?? []) as SeanceBrute[]);

  rafraichir();
  return {
    success: true,
    promesse: {
      mentor: mentorRes.data?.display_name ?? null,
      seance: prochaine ? jourDeSeance(prochaine) : null,
    },
  };
}

// ── Mentor (et direction) ───────────────────────────────────────────────────

/** Le mentor de l'élève, ou la direction. Personne d'autre ne répond à un enfant. */
async function repondant(questionId: string): Promise<{ id: string; ligne: { replied_at: string | null; closed_at: string | null } } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const [profilRes, questionRes] = await Promise.all([
    (admin.from("profiles") as any).select("role").eq("id", user.id).maybeSingle(),
    (admin.from("student_questions") as any).select("replied_at, closed_at, students(teacher_id)").eq("id", questionId).maybeSingle(),
  ]);
  if (profilRes.error) console.error("[questions] rôle :", profilRes.error.message);
  if (questionRes.error) console.error("[questions] question :", questionRes.error.message);

  const role = profilRes.data?.role;
  const q = questionRes.data;
  if (!q) return null;
  const autorise = role === "admin" || role === "manager" || (role === "teacher" && q.students?.teacher_id === user.id);
  return autorise ? { id: user.id, ligne: q } : null;
}

export async function repondreQuestion(_prev: ResultatSimple, formData: FormData): Promise<ResultatSimple> {
  const id = String(formData.get("id") ?? "");
  const texte = String(formData.get("reponse") ?? "").trim();
  if (!texte) return { error: "La réponse est vide." };
  if (texte.length > REPONSE_MAX) return { error: `La réponse dépasse ${REPONSE_MAX} caractères.` };

  const qui = await repondant(id);
  if (!qui) return { error: "Seul le mentor de cet élève, ou la direction, peut répondre." };
  if (qui.ligne.replied_at) return { error: "Une réponse a déjà été envoyée." };

  const { error } = await (createAdminClient().from("student_questions") as any)
    .update({ reply: texte, replied_by: qui.id, replied_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[questions] réponse :", error.message);
    return { error: "La réponse n'a pas pu être enregistrée. Réessayez dans un instant." };
  }
  rafraichir();
  return { success: true };
}

export async function reglerEnSeance(_prev: ResultatSimple, formData: FormData): Promise<ResultatSimple> {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (note.length > NOTE_MAX) return { error: `La note dépasse ${NOTE_MAX} caractères.` };

  const qui = await repondant(id);
  if (!qui) return { error: "Seul le mentor de cet élève, ou la direction, peut clore cette question." };
  if (qui.ligne.replied_at || qui.ligne.closed_at) return { error: "Cette question est déjà traitée." };

  const { error } = await (createAdminClient().from("student_questions") as any)
    .update({ closed_at: new Date().toISOString(), closed_by: qui.id, closed_note: note || "Réglé en séance." })
    .eq("id", id);
  if (error) {
    console.error("[questions] clôture :", error.message);
    return { error: "La clôture a échoué. Réessayez dans un instant." };
  }
  rafraichir();
  return { success: true };
}
