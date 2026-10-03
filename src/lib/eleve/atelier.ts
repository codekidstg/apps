import { createAdminClient } from "@/lib/supabase/admin";
import { slugFromNum, type LevelSlug } from "@/lib/levels";

/**
 * L'atelier libre — l'établi de l'enfant.
 *
 * Les exercices entraînent des gestes, l'atelier est l'endroit où il décide.
 * Rien n'y est corrigé, rien n'y rapporte d'XP : ce n'est pas un parcours.
 *
 * Réservé au Bâtisseur et au-delà : l'Explorateur travaille en blocs, un
 * éditeur de texte vide ne lui dirait rien. Son bac à sable sera un autre
 * objet.
 *
 * Et il ne s'ouvre jamais sur une page blanche. Un enfant de douze ans devant
 * un éditeur vide ne tape rien : il retrouve son dernier code, ou le choix de
 * trois amorces qui tournent déjà.
 */

export const NIVEAUX_AUTORISES: LevelSlug[] = ["builder", "architect"];

export function atelierOuvertA(niveau: string | null | undefined, levelNum?: number | null): boolean {
  const slug = (niveau as LevelSlug) ?? slugFromNum(levelNum);
  return NIVEAUX_AUTORISES.includes(slug);
}

/** Une amorce : du code qui tourne déjà, et qu'on a envie de modifier. */
export type Amorce = { id: string; titre: string; emoji: string; quoi: string; code: string };

export const AMORCES: Amorce[] = [
  {
    id: "calculatrice",
    titre: "La calculatrice",
    emoji: "🧮",
    quoi: "Elle demande deux nombres et les additionne. À toi de lui apprendre à multiplier.",
    code: `# Une calculatrice qui ne sait qu'additionner.
a = int(input("Premier nombre : "))
b = int(input("Deuxième nombre : "))

print("Résultat :", a + b)
`,
  },
  {
    id: "banque",
    titre: "Le compte en banque",
    emoji: "🏦",
    quoi: "Tu as 1000 F. Dépose, retire — et empêche le compte de passer en négatif.",
    code: `# Ton compte, et ce que tu peux en faire.
solde = 1000
print("Ton solde :", solde, "F")

action = input("dépôt ou retrait ? ")
montant = int(input("Combien ? "))

if action == "dépôt":
    solde = solde + montant
else:
    solde = solde - montant

print("Nouveau solde :", solde, "F")
`,
  },
  {
    id: "quiz",
    titre: "Le quiz",
    emoji: "❓",
    quoi: "Une question, une réponse, un score. Ajoute-lui tes propres questions.",
    code: `# Un quiz d'une seule question. Pour l'instant.
score = 0

reponse = input("Quelle est la capitale du Togo ? ")
if reponse == "Lomé":
    print("Bravo !")
    score = score + 1
else:
    print("Non, c'était Lomé.")

print("Ton score :", score)
`,
  },
];

export type Etabli = { code: string; sortie: string | null; modifieLe: string | null };

/** Le code où l'enfant s'est arrêté. Vide la première fois. */
export async function chargerAtelier(studentId: string): Promise<Etabli> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from("atelier_eleve")
    .select("code, sortie, updated_at")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) {
    console.error("[atelier] chargement :", error.message);
    return { code: "", sortie: null, modifieLe: null };
  }
  return { code: data?.code ?? "", sortie: data?.sortie ?? null, modifieLe: data?.updated_at ?? null };
}
