import { createAdminClient } from "@/lib/supabase/server";

/**
 * Rapports de séance — libellés et chargement, partagés par les trois espaces.
 *
 * Les correspondances vivaient uniquement dans RapportsClient.tsx, côté prof.
 * Les recopier pour l'admin aurait produit une divergence de plus : le tableau
 * de bord manager en est déjà un exemple, il dessine des étoiles pour un champ
 * qui contient du texte.
 *
 * Seul le mentor qui a fait la séance rédige. Admin et manager consultent.
 */

export const AVANCEMENT: Record<string, { icon: string; label: string; color: string }> = {
  completed: { icon: "✅", label: "A terminé la séance prévue",               color: "#10b981" },
  partial:   { icon: "⏩", label: "A avancé mais pas fini",                   color: "#f59e0b" },
  reviewed:  { icon: "🔁", label: "A revu / consolidé une séance précédente", color: "#6366f1" },
  blocked:   { icon: "⚠️", label: "N'a pas pu avancer (blocage)",             color: "#ef4444" },
};

export const ENGAGEMENT: Record<string, { icon: string; label: string }> = {
  motivated:  { icon: "🚀", label: "Très motivé, curieux" },
  focused:    { icon: "😊", label: "Bien concentré" },
  distracted: { icon: "😐", label: "Distrait mais participait" },
  disengaged: { icon: "😔", label: "Démotivé ou difficile à engager" },
};

export const AIDES: Record<string, string> = {
  example:       "Réexplication avec un exemple concret",
  drawing:       "Dessin / schéma au tableau",
  unplugged:     "« Joue le rôle de la machine » (débranché)",
  encouragement: "Encouragement / patience",
  simplified:    "Simplifié l'exercice",
  other:         "Autre",
};

export type Occurrence = {
  cle: string;              // session_id|YYYY-MM-DD
  sessionId: string;
  titre: string;
  date: string;             // YYYY-MM-DD
  quand: string;            // ISO complet, pour l'heure
  mentor: string;
  eleve: string | null;
  rapport: Rapport | null;  // null = compte rendu manquant
};

export type Rapport = {
  id: string;
  reported_at: string;
  advancement: string | null;
  engagement: string | null;
  help_methods: string[] | null;
  difficulty_notes: string | null;
  next_session_note: string | null;
};

function jourLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Toutes les séances déjà passées, récurrentes déroulées semaine par semaine.
 *
 * Extrait de l'écran prof, où la fonction était enfermée : c'est elle qui dit
 * quelles séances auraient dû donner lieu à un rapport, donc lesquelles
 * manquent.
 */
export function occurrencesPassees(sessions: any[]) {
  const out: Omit<Occurrence, "cle" | "rapport">[] = [];
  const limite = new Date(Date.now() - 1);

  for (const s of sessions) {
    const mentor = s.profiles?.display_name ?? "Mentor";
    const eleve  = s.students?.profiles?.display_name ?? null;

    const ajoute = (at: Date) => out.push({
      sessionId: s.id,
      titre: s.title ?? "Séance",
      date: jourLocal(at),
      quand: at.toISOString(),
      mentor,
      eleve,
    });

    if (s.session_type === "recurring") {
      const debut = new Date(s.active_from ?? s.created_at);
      debut.setHours(0, 0, 0, 0);
      const [h, m] = String(s.start_time ?? "00:00").split(":").map(Number);
      const curseur = new Date(debut);
      curseur.setHours(h || 0, m || 0, 0, 0);

      const ecart = (s.weekday - curseur.getDay() + 7) % 7;
      curseur.setDate(curseur.getDate() + (ecart === 0 && curseur >= debut ? 0 : ecart === 0 ? 7 : ecart));

      while (curseur <= limite) {
        if (!s.active_until || curseur <= new Date(s.active_until)) ajoute(new Date(curseur));
        curseur.setDate(curseur.getDate() + 7);
      }
    } else if (s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at <= limite) ajoute(at);
    }
  }

  return out.sort((a, b) => b.quand.localeCompare(a.quand));
}

/**
 * Séances passées de toute la structure, chacune avec son rapport ou sans.
 * Un seul chargement pour l'écran admin et l'écran manager.
 */
export async function getRapportsData(): Promise<{
  occurrences: Occurrence[];
  faits: number;
  manquants: number;
}> {
  const admin = createAdminClient();

  const [{ data: sessions, error: errS }, { data: rapports, error: errR }] = await Promise.all([
    (admin.from("teacher_sessions") as any)
      .select("*, profiles!teacher_id(display_name), students(id, profiles!profile_id(display_name))")
      .order("scheduled_at", { ascending: false }),
    (admin.from("session_reports") as any)
      .select("id, session_id, occurrence_date, reported_at, advancement, engagement, help_methods, difficulty_notes, next_session_note")
      .order("reported_at", { ascending: false }),
  ]);

  // Une erreur ici viderait l'écran sans rien dire — c'est exactement ce qui
  // est arrivé au bloc du tableau de bord manager.
  if (errS) console.error("Rapports — séances :", errS.message);
  if (errR) console.error("Rapports — rapports :", errR.message);

  const parCle = new Map<string, Rapport>();
  for (const r of (rapports ?? []) as any[]) {
    const cle = `${r.session_id ?? ""}|${r.occurrence_date ?? ""}`;
    if (!parCle.has(cle)) parCle.set(cle, r);
  }

  const occurrences: Occurrence[] = occurrencesPassees(sessions ?? []).map(o => ({
    ...o,
    cle: `${o.sessionId}|${o.date}`,
    rapport: parCle.get(`${o.sessionId}|${o.date}`) ?? null,
  }));

  return {
    occurrences,
    faits:     occurrences.filter(o => o.rapport).length,
    manquants: occurrences.filter(o => !o.rapport).length,
  };
}
