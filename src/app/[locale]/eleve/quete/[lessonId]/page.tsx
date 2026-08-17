import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QuestReader from "./QuestReader";

const EXPLORER_THEME1_ID = "8979e87c-058c-4003-95fd-1531c649bd1d";
const EXPLORER_THEME2_ID = "b82126de-7df6-410a-8089-5c39330a035d";
const EXPLORER_THEME3_ID = "9277a050-62d8-4920-80a1-9114ae315e63";
const EXPLORER_THEME4_ID = "8cfcf715-b35b-446d-b5d7-a480952c3a2d";
const EXPLORER_THEME5_ID = "7c497d11-0cbf-4cb3-9f6f-43721b63e418";

type KodiBrief = { message: string; objectifs: string[] };

const KODI_BRIEFS: Record<string, KodiBrief> = {
  // ── Thème 1 — Routes du Village ──────────────────────────────────────────
  "L'ordinateur, la machine magique": {
    message: "Amavi… je ne sais plus bouger. Apprends-moi ce qu'est une instruction — c'est tout ce dont j'ai besoin pour recommencer.",
    objectifs: [
      "Comprendre qu'un ordinateur exécute des instructions une par une",
      "Distinguer une machine d'un être vivant",
      "Donner mes premières instructions dans l'ordre correct",
    ],
  },
  "Mon premier algorithme": {
    message: "Si tu m'apprends à suivre un chemin pas à pas, je pourrai quitter cette case. Montre-moi ton algorithme !",
    objectifs: [
      "Définir ce qu'est un algorithme (suite d'étapes pour résoudre un problème)",
      "Écrire une séquence d'instructions pour guider Kodi",
      "Comprendre que l'ordre des instructions est crucial",
    ],
  },
  "Gauche ou droite ?": {
    message: "Il y a un croisement devant moi. Comment je sais où aller ? Apprends-moi à choisir.",
    objectifs: [
      "Utiliser une condition (si… alors…) pour prendre une décision",
      "Identifier une situation où le programme doit choisir entre deux chemins",
      "Construire mon premier bloc conditionnel dans le labyrinthe",
    ],
  },
  "Le débogage — Deviens détective du code": {
    message: "J'ai suivi le chemin mais je me suis coincé dans un mur. Quelque chose cloche dans mes instructions — trouve mon erreur.",
    objectifs: [
      "Comprendre ce qu'est un bug (erreur dans le code)",
      "Lire un programme et identifier où il se trompe",
      "Corriger une séquence d'instructions pour atteindre l'objectif",
    ],
  },
  "La répétition — Kirikou dit moins pour faire plus": {
    message: "Il y a 40 lampes à allumer sur la route. Si tu m'apprends à répéter, je les allume toutes d'un seul bloc.",
    objectifs: [
      "Comprendre pourquoi répéter du code est inefficace",
      "Utiliser un bloc de répétition pour exécuter une action plusieurs fois",
      "Compter le nombre de répétitions nécessaires",
    ],
  },
  "La boucle qui fait tout": {
    message: "Regarde… les routes commencent à s'éclairer ! Tu m'as rendu mes jambes. Encore une boucle et je traverserai tout le village.",
    objectifs: [
      "Maîtriser la boucle « répéter N fois » dans un contexte complexe",
      "Combiner une boucle avec des instructions variées",
      "Traverser un labyrinthe complet en utilisant uniquement des boucles",
    ],
  },
  "Plan avant code": {
    message: "Avant de courir, les grands ingénieurs réfléchissent. Aide-moi à planifier le prochain quartier du village ensemble.",
    objectifs: [
      "Décomposer un problème en étapes avant d'écrire le moindre bloc",
      "Schématiser un algorithme sur papier (ou en blocs de planification)",
      "Comprendre que la réflexion préalable réduit les erreurs",
    ],
  },

  // ── Thème 3 — Bibliothèque (Python) ──────────────────────────────────────
  "Du bloc au texte — même idée, autre langue": {
    message: "La Bibliothèque contient les livres du savoir de tout le village. Mais ils sont écrits dans une nouvelle langue — Python. Tu connais déjà toutes les idées… il faut juste apprendre à les écrire autrement.",
    objectifs: [
      "Reconnaître que Python fait les mêmes choses que Blockly, avec une écriture différente",
      "Lire et comprendre un premier programme Python simple (5 à 10 lignes)",
      "Écrire print() et comprendre que le code texte s'exécute ligne par ligne",
    ],
  },
  "print() et les variables — ton programme a une mémoire": {
    message: "Un livre sans mémoire oublie tout. Python garde les informations dans des variables — comme des boîtes étiquetées. Apprends-moi à mémoriser ton prénom pour que je ne t'oublie jamais !",
    objectifs: [
      "Déclarer une variable et lui assigner une valeur (nom = 'Amavi')",
      "Distinguer les types de base : texte (str) et nombre (int)",
      "Utiliser print() pour afficher la valeur d'une variable à l'écran",
    ],
  },
  "if / else — ton programme choisit": {
    message: "Tu connais déjà les conditions depuis le labyrinthe et le Griot. En Python, ça s'écrit juste différemment — avec ':' et des espaces. Mais attention : Python est strict sur la mise en page. Une erreur d'indentation et tout plante !",
    objectifs: [
      "Écrire une condition if / else en Python avec la bonne indentation",
      "Comprendre que l'indentation (les espaces) structure le code Python",
      "Brancher deux comportements différents selon une valeur ou une comparaison",
    ],
  },
  "Lis l'erreur, comprends l'erreur — deviens détective Python": {
    message: "Python te parle quand quelque chose ne va pas — mais dans sa langue. 'IndentationError', 'NameError', 'SyntaxError'… ce ne sont pas des insultes, ce sont des indices. Apprends à les lire et tu ne resteras plus jamais bloqué !",
    objectifs: [
      "Lire un message d'erreur Python et identifier le type (Syntax, Indentation, Name, Type)",
      "Localiser la ligne fautive grâce au numéro indiqué dans le message d'erreur",
      "Utiliser print() comme outil de débogage pour tracer la valeur des variables",
    ],
  },
  "Ma première boucle for — tu reconnais novembre !": {
    message: "Les 30 jours de novembre, les 12 mois de l'année — Python les connaît tous par cœur grâce à for et range(). Montre-moi comment faire répéter une action un nombre précis de fois !",
    objectifs: [
      "Écrire une boucle for avec range(N) pour répéter N fois",
      "Utiliser la variable de boucle (i) à l'intérieur du bloc",
      "Comprendre la différence entre range(5) et range(1, 6)",
    ],
  },
  "La boucle while — le programme qui attend": {
    message: "Le for répète N fois. Mais parfois tu ne sais pas combien de fois — tu veux répéter JUSQU'À ce que quelque chose se passe. C'est le while. Et avec input(), ton programme peut poser des questions jusqu'à la bonne réponse !",
    objectifs: [
      "Écrire une boucle while avec une condition d'arrêt claire",
      "Utiliser input() pour recueillir une réponse de l'utilisateur",
      "Combiner while + input() pour créer un programme interactif simple",
    ],
  },
  "Certification Python niveau 1 — le tampon de la Bibliothèque": {
    message: "La Bibliothèque est rallumée ! Avant d'entrer au Palais des Décisions, tu dois obtenir le tampon de la Bibliothèque — ta première certification Python. Prouve en 30 minutes que tu maîtrises les bases. Si tu y arrives, le Palais t'ouvre ses portes.",
    objectifs: [
      "Créer de façon autonome un programme Python complet (variables, if/else, while, input)",
      "Relire son propre code et expliquer le rôle de chaque ligne — 'pensée à voix haute'",
      "Obtenir le tampon de la Bibliothèque : valider qu'on est prêt pour le Palais des Décisions",
    ],
  },

  // ── Thème 5 — Galerie des Œuvres (Pixel Art) ─────────────────────────────
  "La grille de pixels — x, y, couleur": {
    message: "La Galerie est une immense toile vide. Chaque case a une adresse — x pour la colonne, y pour la ligne — et une couleur. C'est comme ça que tous les jeux vidéo du monde sont dessinés. Allume ta première case !",
    objectifs: [
      "Comprendre le système de coordonnées (x, y) sur une grille 2D",
      "Colorier une case précise en lui donnant ses coordonnées et sa couleur",
      "Lire et interpréter une grille de pixels comme une carte de dessin",
    ],
  },
  "Dessiner avec des boucles — colonnes et lignes": {
    message: "Colorier 100 cases une par une prendrait une heure. Avec deux boucles imbriquées — une pour les lignes, une pour les colonnes — tu remplis toute la Galerie en 5 lignes de code. C'est la magie des boucles dans des boucles !",
    objectifs: [
      "Écrire une boucle for imbriquée dans une autre pour parcourir une grille 2D",
      "Comprendre que la boucle extérieure gère les lignes et la boucle intérieure les colonnes",
      "Dessiner des formes géométriques (ligne, rectangle, damier) uniquement avec des boucles",
    ],
  },
  "Mes propres fonctions de dessin": {
    message: "Un grand artiste a ses propres pinceaux. Crée tes fonctions : dessine_carré(), dessine_ligne(), dessine_diagonale(). Appelle-les autant de fois que tu veux pour composer ton œuvre !",
    objectifs: [
      "Créer des fonctions de dessin paramétrables (position, taille, couleur en paramètres)",
      "Réutiliser la même fonction plusieurs fois pour dessiner des motifs répétés",
      "Organiser son programme en fonctions claires pour qu'il reste lisible",
    ],
  },
  "Mon œuvre libre — je crée avec mon code": {
    message: "La Galerie t'appartient. Utilise tout ce que tu sais — coordonnées, boucles, fonctions, conditions — pour créer une œuvre qui te ressemble. Un visage, un paysage, un motif africain, un personnage… c'est ton choix, ton code, ton art.",
    objectifs: [
      "Concevoir une œuvre pixel art originale en planifiant d'abord sur papier",
      "Combiner boucles, fonctions et conditions dans un seul programme cohérent",
      "Commenter son code pour expliquer ses choix artistiques et techniques",
    ],
  },
  "Je présente, j'écoute et j'améliore — comme un vrai développeur": {
    message: "Tout développeur présente son travail à d'autres. C'est comme ça qu'on s'améliore. Montre ton œuvre à un camarade, explique ton code, écoute son retour — puis améliore une chose. C'est la boucle feedback qui rend les pros excellents.",
    objectifs: [
      "Présenter son œuvre en 2 minutes : ce que c'est, comment le code fonctionne, ce dont on est fier",
      "Donner un retour constructif à un camarade (un point fort + une suggestion précise)",
      "Intégrer un retour reçu en modifiant une partie de son programme",
    ],
  },
  "🎓 Je le montre à mes parents — remise de diplôme": {
    message: "Amavi… tu as rallumé tout le village. Les Routes brillent, le Griot chante, la Bibliothèque est ouverte, le Palais rend ses jugements, et la Galerie est en fête. Aujourd'hui, tu reçois ton diplôme d'Explorateur Numérique. Je suis fier de toi.",
    objectifs: [
      "Présenter l'ensemble de son parcours Explorateur devant sa famille",
      "Expliquer en termes simples ce qu'est la programmation et ce qu'on a appris",
      "Recevoir son certificat de niveau Explorateur et célébrer cette réussite",
    ],
  },

  // ── Thème 4 — Palais des Décisions ───────────────────────────────────────
  "L'Épreuve des Portes — prouve que tu mérites d'entrer au Palais": {
    message: "Le Palais des Décisions ne s'ouvre pas pour tout le monde. Ses gardes posent trois défis à chaque visiteur — variables, conditions, boucles. Réponds correctement aux trois et les grandes portes s'ouvrent pour toi. C'est l'Épreuve des Portes.",
    objectifs: [
      "Répondre à trois défis-éclair sur les bases Python (variables, if/else, boucles) en temps limité",
      "Identifier ses points forts et ses lacunes avant d'aborder elif et les conditions avancées",
      "Entrer au Palais avec confiance : l'épreuve est un jeu, pas un examen",
    ],
  },
  "Le carrefour à plusieurs routes — elif": {
    message: "À l'entrée du Palais, un immense carrefour : nord, sud, est, ouest, et bien d'autres directions encore. if et else ne gèrent que deux routes. elif en gère autant que tu veux. C'est comme au Griot où le rythme changeait selon la situation — mais avec autant de cas que la vie en réserve.",
    objectifs: [
      "Enchaîner plusieurs conditions avec elif pour couvrir plus de deux cas",
      "Comprendre que Python vérifie les conditions dans l'ordre et s'arrête à la première vraie",
      "Construire un programme qui donne des réponses différentes selon plusieurs valeurs possibles",
    ],
  },
  "Décider à l'intérieur d'une décision — if dans un if": {
    message: "Dans le Palais, certaines portes cachent d'autres portes. Un if peut vivre à l'intérieur d'un autre if. C'est ainsi que les programmes deviennent vraiment intelligents !",
    objectifs: [
      "Écrire un if imbriqué (nested if) avec la bonne indentation",
      "Comprendre quand utiliser elif vs un if imbriqué (deux questions différentes)",
      "Tracer le chemin d'exécution dans un programme avec conditions imbriquées",
    ],
  },
  "La liste des visiteurs du Palais — plusieurs infos, une seule variable": {
    message: "Le Palais reçoit 100 visiteurs par jour. Une variable ne peut retenir qu'un seul nom à la fois — comment faire ? Avec une liste. Une seule variable, mais qui se souvient de tout le monde dans l'ordre. Aide-moi à tenir le registre du Palais !",
    objectifs: [
      "Créer une liste Python et accéder à ses éléments par leur index (liste[0])",
      "Ajouter et retirer des éléments avec append() et remove()",
      "Parcourir une liste avec une boucle for pour traiter chaque élément",
    ],
  },
  "Les fonctions — mes propres blocs réutilisables": {
    message: "Tu te souviens du 'rythme à paramètre' au Griot ? Un bloc musical qu'on appelait avec des réglages différents ? En Python, ça s'écrit 'def'. C'est exactement la même idée — ton propre bloc réutilisable, avec des paramètres. Ce que tu as compris au Griot, tu vas maintenant l'écrire en code !",
    objectifs: [
      "Faire le lien explicite entre le 'paramètre de bloc' du Thème 2 et def fonction(paramètre) en Python",
      "Définir une fonction avec def, lui donner un nom significatif et des paramètres",
      "Utiliser return pour renvoyer un résultat et appeler la fonction plusieurs fois avec des arguments différents",
    ],
  },
  "Construis ton quiz — le projet du Palais commence": {
    message: "Le Grand Concours du Palais approche. Pour y participer, chaque candidat doit créer son propre quiz de 5 questions. Aujourd'hui tu poses les fondations — les questions, les réponses, le score. Le Palais jugera ta construction !",
    objectifs: [
      "Organiser un programme en fonctions (une fonction par question, une pour le score)",
      "Stocker les questions et réponses dans des listes",
      "Gérer un score avec une variable compteur mis à jour à chaque bonne réponse",
    ],
  },
  "Défi : le programme intelligent 🏆": {
    message: "Le Palais des Décisions est en pleine lumière ! Pour le sceller, crée ton programme le plus intelligent : il doit poser des questions, analyser les réponses, et donner un verdict personnalisé. C'est ton chef-d'œuvre Explorateur !",
    objectifs: [
      "Assembler un programme complet qui utilise elif, conditions imbriquées, listes et fonctions",
      "Gérer les erreurs de saisie utilisateur (réponse inattendue) avec grâce",
      "Présenter et défendre ses choix de conception devant un pair",
    ],
  },

  // ── Thème 2 — Case du Griot ───────────────────────────────────────────────
  "Le tambour qui répète": {
    message: "Le Griot m'a dit que chaque rythme de tambour est une séquence — Boom-Boom-Clap, encore et encore. Apprends-moi à coder ce pattern pour réveiller la Case !",
    objectifs: [
      "Reconnaître qu'une séquence est un ensemble d'instructions dans un ordre précis",
      "Créer un pattern rythmique avec des blocs de sons",
      "Comprendre que changer l'ordre change complètement le résultat",
    ],
  },
  "Le rythme à paramètre": {
    message: "Le Griot veut le même rythme, mais parfois fort, parfois doux, parfois rapide. Un seul bloc, mais avec des réglages différents — c'est ça, un paramètre ! Souviens-toi bien de ce concept : dans quelques thèmes, tu écriras des fonctions Python avec exactement la même idée.",
    objectifs: [
      "Comprendre ce qu'est un paramètre (une valeur qu'on peut changer sans réécrire le bloc)",
      "Modifier la vitesse, le volume ou la note d'un même bloc musical via un paramètre",
      "Faire le lien entre 'paramètre de bloc' en Blockly et ce que sera 'def fonction(paramètre)' en Python",
    ],
  },
  "Quand le Griot choisit": {
    message: "Le Griot dit : si c'est une fête, joue un rythme rapide — sinon, joue un rythme lent. Apprends-moi à choisir la bonne musique selon la situation !",
    objectifs: [
      "Réutiliser la condition (si… alors… sinon…) dans un nouveau contexte musical",
      "Brancher deux rythmes différents selon une condition",
      "Comprendre que les conditions permettent à un programme de s'adapter",
    ],
  },
  "La boucle musicale": {
    message: "La musique africaine répète des patterns pendant toute la nuit. Aide-moi à coder une boucle musicale qui tourne jusqu'à ce que la fête soit terminée !",
    objectifs: [
      "Appliquer la boucle « répéter N fois » à un contexte musical",
      "Combiner une boucle avec des patterns rhythmiques variés",
      "Distinguer une boucle finie (N fois) d'une boucle infinie",
    ],
  },
  "Mon concert de code": {
    message: "La Case du Griot vibre ! Maintenant combine tout — séquence, paramètres, conditions, boucles — pour créer ton propre concert. Je jouerai avec toi !",
    objectifs: [
      "Combiner séquences, paramètres, conditions et boucles dans un seul programme",
      "Concevoir un mini-concert de 8 mesures avec plusieurs instruments",
      "Tester et ajuster son programme pour obtenir le résultat voulu",
    ],
  },
  "Ma première vraie chanson": {
    message: "Amavi… j'entends de nouveau ! La Case du Griot est rallumée. Crée une chanson complète pour célébrer — c'est ton œuvre, ton code, ta musique !",
    objectifs: [
      "Créer un programme musical complet de A à Z de façon autonome",
      "Choisir ses propres sons, rythmes et structures",
      "Présenter et expliquer ses choix de code à voix haute (pensée computationnelle)",
    ],
  },
};

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

export default async function QuestePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!student) redirect("/fr/connexion");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, xp_reward, chapter_id, theme_id")
    .eq("id", lessonId)
    .single<{ id: string; title: string; xp_reward: number; chapter_id: string; theme_id: string | null }>();
  if (!lesson) notFound();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, theme_id")
    .eq("id", lesson.chapter_id)
    .single<{ id: string; title: string; theme_id: string }>();

  const { data: theme } = chapter
    ? await supabase.from("themes").select("id, title").eq("id", chapter.theme_id).single<{ id: string; title: string }>()
    : { data: null };

  const { data: blocksRaw } = await supabase
    .from("lesson_blocks")
    .select("id, type, content, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  const blocks = (blocksRaw ?? []) as Block[];

  type LessonRow = { id: string; title: string; order_index: number; chapter_id: string; theme_id?: string };
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, chapter_id")
    .eq("theme_id", lesson.theme_id ?? chapter?.theme_id ?? "")
    .order("chapter_id").order("order_index")
    .returns<LessonRow[]>();

  let nextLessonId: string | null = null;
  if (allLessons) {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0 && idx < allLessons.length - 1) nextLessonId = allLessons[idx + 1].id;
  }

  // Entraînements liés à cette leçon
  const { data: trainingsRaw } = await (supabase.from("trainings") as any)
    .select("id, title, xp_reward")
    .eq("lesson_id", lessonId)
    .order("created_at");
  const trainings = (trainingsRaw ?? []) as { id: string; title: string; xp_reward: number }[];

  const { data: progress } = await (supabase.from("lesson_progress") as any)
    .select("status, block_progress")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  const alreadyCompleted = progress?.status === "completed";
  const savedBlockProgress = (progress?.block_progress as Record<string, unknown> | null) ?? null;

  if (!progress) {
    await (supabase.from("lesson_progress") as any).upsert({
      student_id: student.id,
      lesson_id: lessonId,
      status: "in_progress",
      attempts: 1,
    }, { onConflict: "student_id,lesson_id" });
  }

  return (
    <div className="p-6 lg:p-10 bg-slate-950 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-mono mb-6 flex-wrap">
        <Link href="/eleve" className="hover:underline transition-colors" style={{ color: "#334155" }}>Ma Cité</Link>
        {theme && <><span style={{ color: "#1e293b" }}>›</span><Link href={`/eleve/theme/${theme.id}`} className="hover:underline transition-colors" style={{ color: "#334155" }}>{theme.title}</Link></>}
        {chapter && <><span style={{ color: "#1e293b" }}>›</span><span style={{ color: "#475569" }}>{chapter.title}</span></>}
        <span style={{ color: "#1e293b" }}>›</span>
        <span style={{ color: "#94a3b8" }}>{lesson.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid #FDB81330", boxShadow: "0 0 30px #FDB81310" }}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 text-9xl flex items-center justify-center select-none">⚔️</div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono font-black uppercase tracking-widest" style={{ color: "#FDB813" }}>⚔️ Quête</span>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "#FDB81320", color: "#FDB813", border: "1px solid #FDB81340" }}>
            +{lesson.xp_reward} XP
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">{lesson.title}</h1>
        {alreadyCompleted && (
          <div className="inline-flex items-center gap-2 mt-3 text-xs font-black px-3 py-1 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98130" }}>
            ✅ Déjà complétée
          </div>
        )}
      </div>

      {/* Brief de Kodi + objectifs — Thèmes 1 & 2 */}
      {(() => {
        const themeId = chapter?.theme_id;
        const isNarrativeTheme = themeId === EXPLORER_THEME1_ID || themeId === EXPLORER_THEME2_ID || themeId === EXPLORER_THEME3_ID || themeId === EXPLORER_THEME4_ID || themeId === EXPLORER_THEME5_ID;
        const brief = KODI_BRIEFS[lesson.title];
        const accentColor = themeId === EXPLORER_THEME2_ID ? "#a78bfa"
          : themeId === EXPLORER_THEME3_ID ? "#3b82f6"
          : themeId === EXPLORER_THEME4_ID ? "#10b981"
          : themeId === EXPLORER_THEME5_ID ? "#ec4899"
          : "#d97706";
        if (!isNarrativeTheme || !brief) return null;
        return (
          <div className="mb-8 space-y-3">
            {/* Message narratif de Kodi */}
            <div className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: "#0f172a", border: `1px solid ${accentColor}40`, boxShadow: `0 0 20px ${accentColor}10` }}>
              <div className="text-3xl flex-shrink-0 mt-0.5">🤖</div>
              <div>
                <div className="text-xs font-mono font-black uppercase tracking-widest mb-1.5" style={{ color: accentColor }}>
                  Kodi te parle
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
                  {brief.message}
                </p>
              </div>
            </div>
            {/* Objectifs de la leçon */}
            <div className="rounded-2xl px-5 py-4" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
              <div className="text-xs font-mono font-black uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                🎯 Ce que tu vas apprendre
              </div>
              <ul className="space-y-2">
                {brief.objectifs.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#94a3b8" }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                      style={{ background: `${accentColor}20`, color: accentColor }}>
                      {i + 1}
                    </span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}

      <QuestReader
        lessonId={lessonId}
        title={lesson.title}
        blocks={blocks}
        alreadyCompleted={alreadyCompleted}
        xpReward={lesson.xp_reward}
        nextLessonId={nextLessonId}
        themeId={chapter?.theme_id ?? ""}
        savedBlockProgress={savedBlockProgress}
        trainings={trainings}
      />
    </div>
  );
}
