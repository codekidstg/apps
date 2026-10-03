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

/**
 * Une amorce : du code qui tourne déjà, et qu'on a envie de modifier.
 *
 * Règle de la liste : chaque amorce ouvre une notion qu'aucune autre n'ouvre,
 * et porte une mission en une phrase. C'est la mission qui fait qu'un enfant
 * modifie au lieu de simplement lancer — les trois premières se ressemblaient
 * toutes (un `input`, un `if`, un `print`), et aucune ne contenait de boucle,
 * la notion précise sur laquelle un Bâtisseur a bloqué en séance.
 *
 * Elles sont rangées de la plus simple à la plus exigeante.
 */
export type Amorce = {
  id: string;
  titre: string;
  emoji: string;
  /** La mission, en mots d'enfant : ce qu'il y a à changer. */
  quoi: string;
  /** Ce que le programme lui fait rencontrer, en trois mots. */
  notion: string;
  code: string;
};

export const AMORCES: Amorce[] = [
  {
    id: "calculatrice",
    titre: "La calculatrice",
    emoji: "🧮",
    quoi: "Elle demande deux nombres et les additionne. À toi de lui apprendre à multiplier.",
    notion: "Demander et calculer",
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
    notion: "Choisir avec si",
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
    notion: "Garder un score",
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
  {
    id: "table",
    titre: "La table de 7",
    emoji: "🔢",
    quoi: "Python la récite tout seul. Change le 7 — puis fais-la s'arrêter à 5.",
    notion: "Répéter avec une boucle",
    code: `# Une boucle répète la même ligne, en changeant juste le nombre.
for n in range(1, 11):
    print(7, "x", n, "=", 7 * n)
`,
  },
  {
    id: "decollage",
    titre: "Le décollage",
    emoji: "🚀",
    quoi: "5, 4, 3… Fais-le partir de 10, et dis quelque chose à chaque étape.",
    notion: "Compter à l'envers",
    code: `# Le compte à rebours : la boucle descend au lieu de monter.
for n in range(5, 0, -1):
    print(n, "...")

print("Décollage !")
`,
  },
  {
    id: "courses",
    titre: "La liste des courses",
    emoji: "🛒",
    quoi: "Ajoute ce qu'il te faut au marché. Puis fais-lui dire combien ça fait d'articles.",
    notion: "Ranger dans une liste",
    code: `# Une liste garde plusieurs choses sous un seul nom.
courses = ["riz", "tomates", "huile"]

for article in courses:
    print("-", article)

print("Il y a", len(courses), "choses à acheter.")
`,
  },
  {
    id: "motdepasse",
    titre: "Le mot de passe",
    emoji: "🔐",
    quoi: "Il redemande tant que ce n'est pas le bon. À toi de ne lui laisser que 3 essais.",
    notion: "Recommencer tant que",
    code: `# "while" veut dire : recommence tant que c'est faux.
secret = "codekids"
essai = input("Mot de passe : ")

while essai != secret:
    print("Non, ce n'est pas ça.")
    essai = input("Mot de passe : ")

print("C'est ouvert !")
`,
  },
  {
    id: "pyramide",
    titre: "La pyramide",
    emoji: "⭐",
    quoi: "Fais-la plus haute. Puis remplace les étoiles par autre chose.",
    notion: "Une boucle dans une boucle",
    code: `# Une boucle pour les lignes, une autre pour les étoiles de la ligne.
hauteur = 5

for ligne in range(1, hauteur + 1):
    dessin = ""
    for etoile in range(ligne):
        dessin = dessin + "*"
    print(dessin)
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
