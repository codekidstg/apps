/**
 * Seed — 4 entraînements pour Séance 1 "L'ordinateur, la machine magique"
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-trainings-seance1-ordinateur.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "9cecb7fd-330a-4c3d-a374-ec81203abc65"; // L'ordinateur, la machine magique

// ─── Helpers HTML ────────────────────────────────────────────────────────────

const card = (emoji: string, text: string, color = "#FDB813") =>
  `<div style="background:#0f172a;border:1px solid ${color}30;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;margin:6px 0"><span style="font-size:1.4em">${emoji}</span><span style="color:#cbd5e1;font-size:0.92em">${text}</span></div>`;

const narr = (text: string) =>
  `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-left:3px solid #FDB813;border-radius:0 10px 10px 0;padding:12px 16px;margin:10px 0;color:#cbd5e1;font-size:0.95em;line-height:1.6">${text}</div>`;

const tip = (text: string) =>
  `<div style="background:#10b98115;border:1px solid #10b98140;border-radius:10px;padding:10px 14px;margin:10px 0;color:#10b981;font-size:0.88em"><strong>💡 Indice :</strong> ${text}</div>`;

// ─── Entraînements ───────────────────────────────────────────────────────────

const TRAININGS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1 — Vrai ordinateur ou pas ?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Vrai ordinateur ou pas ?",
    description: "Kirikou explore Lomé — aide-le à reconnaître les ordinateurs cachés partout autour de lui.",
    xp_reward: 30,
    order_index: 0,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:22px 26px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.2em">🤖 Kirikou explore Lomé</h2>
  ${narr("Ce matin, Kirikou se promène dans les rues de Lomé avec ses yeux de robot grand ouverts. Il voit des machines partout. Mais lesquelles sont de <strong style='color:#FDB813'>vrais ordinateurs</strong> ?")}
  <p style="color:#94a3b8;margin:10px 0 0;font-size:0.9em">Un ordinateur <strong style="color:#FDB813">reçoit des données</strong>, les <strong style="color:#60a5fa">traite</strong>, et produit un <strong style="color:#10b981">résultat</strong>. Il a un processeur, de la mémoire, et peut exécuter des programmes différents.</p>
  ${tip("Une machine qui ne fait QU'UNE seule chose figée (comme une horloge analogique) n'est pas un ordinateur.")}
</div>`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "q1",
              question: "Kirikou voit une élève avec un smartphone. Est-ce un ordinateur ?",
              type: "mcq",
              narrative: "📱 Une fille envoie un message vocal sur son téléphone devant le marché...",
              choices: [
                "Oui, c'est un ordinateur de poche",
                "Non, c'est juste un téléphone",
                "Seulement si on installe des applis",
              ],
              correct: 0,
              explanation:
                "✅ Un smartphone est un vrai ordinateur : il a un processeur, de la RAM, du stockage, et exécute des programmes. Il tient dans ta main, mais il est aussi puissant qu'un PC de bureau des années 2000 !",
            },
            {
              id: "q2",
              question: "Kirikou passe devant une vieille télé (sans Wi-Fi, sans smart TV). Est-ce un ordinateur ?",
              type: "mcq",
              narrative: "📺 Une télévision ancienne diffuse la chaîne locale dans un salon...",
              choices: [
                "Oui, elle traite l'image et le son",
                "Non, elle ne peut pas exécuter de programmes",
                "Oui, parce qu'elle a des boutons",
              ],
              correct: 1,
              explanation:
                "✅ Une télé classique (non connectée) n'est PAS un ordinateur. Elle reçoit un signal et l'affiche, mais elle ne peut pas exécuter des programmes différents — elle fait toujours la même chose.",
            },
            {
              id: "q3",
              question: "Kirikou voit un distributeur de billets (DAB). Est-ce un ordinateur ?",
              type: "mcq",
              narrative: "🏧 Un homme retire de l'argent au distributeur de la BTCI...",
              choices: [
                "Non, il ne fait que donner des billets",
                "Oui, c'est un ordinateur spécialisé",
                "Seulement si on insère une carte",
              ],
              correct: 1,
              explanation:
                "✅ Un DAB est un vrai ordinateur ! Il a un processeur, un écran, un clavier, un lecteur de carte — et exécute un logiciel bancaire complexe. C'est un ordinateur conçu pour une tâche précise.",
            },
            {
              id: "q4",
              question: "Kirikou trouve une montre à pile qui affiche juste l'heure. Est-ce un ordinateur ?",
              type: "mcq",
              narrative: "⌚ Une montre digitale basique bipe à 8h sur le poignet de la maîtresse...",
              choices: [
                "Oui, elle a un écran digital",
                "Oui, elle calcule les secondes",
                "Non, elle ne peut pas changer de programme",
              ],
              correct: 2,
              explanation:
                "✅ Une montre à pile simple n'est PAS un ordinateur. Elle compte le temps avec un circuit fixe — elle ne peut pas changer de programme ou faire autre chose. Une smartwatch, par contre, en serait une !",
            },
            {
              id: "q5",
              question: "Kirikou aperçoit un décodeur CANAL+ relié à la télé. Est-ce un ordinateur ?",
              type: "mcq",
              narrative: "📡 Un décodeur satellite clignote sous la télé dans un salon familial...",
              choices: [
                "Non, il ne fait que décoder les chaînes",
                "Oui, il a un processeur et exécute un logiciel",
                "Seulement si on paie l'abonnement",
              ],
              correct: 1,
              explanation:
                "✅ Surprenant mais vrai : un décodeur CANAL+ est un ordinateur embarqué ! Il a un processeur ARM, de la mémoire, et tourne un système d'exploitation pour gérer les chaînes, le guide TV et les mises à jour.",
            },
            {
              id: "q6",
              question: "Piège ! Kirikou voit un robot aspirateur sans Wi-Fi qui suit juste les murs. Est-ce un ordinateur ?",
              type: "mcq",
              narrative: "🤖 Un petit robot rond tourne en rond dans une maison, évitant les meubles...",
              choices: [
                "Non, il n'a pas d'écran",
                "Non, il ne fait qu'aspirer",
                "Oui, il a des capteurs, traite des données et prend des décisions",
              ],
              correct: 2,
              explanation:
                "✅ Même sans écran ni Wi-Fi, ce robot est un ordinateur embarqué ! Ses capteurs = entrée. Son processeur décide comment avancer = traitement. Ses moteurs bougent = sortie. Voilà le cycle Entrée → Traitement → Sortie !",
            },
          ],
        },
      },
      {
        type: "text",
        order_index: 2,
        content: {
          html: `
<div style="background:#10b98115;border:1px solid #10b98140;border-radius:12px;padding:18px 22px">
  <h3 style="color:#10b981;margin:0 0 10px">🎯 Mission accomplie !</h3>
  ${narr("Kirikou est impressionné. Les ordinateurs sont <strong style='color:#FDB813'>partout</strong> — dans ta poche, au marché, dans les machines. Dans la prochaine séance, il va apprendre comment ces cerveaux numériques <strong style='color:#60a5fa'>fonctionnent à l'intérieur</strong>.")}
</div>`,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2 — Qui fait quoi dans l'ordinateur ?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Qui fait quoi dans l'ordinateur ?",
    description: "Kirikou compare les composants d'un ordinateur aux parties de son corps de robot.",
    xp_reward: 35,
    order_index: 1,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:22px 26px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.2em">🤖 Le corps de Kirikou = les composants d'un PC</h2>
  ${narr("Kirikou pose une question à son créateur : <em>'Comment je fonctionne ?'</em> Alors on lui explique que son corps est exactement comme un ordinateur !")}
  <div style="margin:14px 0">
    ${card("🧠", "<strong style='color:#FDB813'>Processeur (CPU)</strong> — Le cerveau. Il fait tous les calculs.")}
    ${card("📋", "<strong style='color:#60a5fa'>RAM</strong> — La mémoire de travail. Ce que tu gardes <em>pendant</em> que tu travailles.")}
    ${card("🗃️", "<strong style='color:#a78bfa'>Stockage (SSD/HDD)</strong> — Le carnet de notes. Ce qui reste <em>même quand tu dors</em>.")}
    ${card("⌨️", "<strong style='color:#10b981'>Périphériques d'entrée</strong> — Tes oreilles et tes yeux. Tu reçois des infos.")}
    ${card("🖥️", "<strong style='color:#f97316'>Périphériques de sortie</strong> — Ta bouche et tes mains. Tu envoies des infos.")}
  </div>
</div>`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "q1",
              question: "Tu as 20 onglets ouverts dans ton navigateur et ton PC ralentit. Quel composant est probablement saturé ?",
              type: "mcq",
              choices: ["Le processeur (CPU)", "La RAM", "Le stockage (SSD)", "L'écran"],
              correct: 1,
              explanation:
                "✅ La RAM ! Chaque onglet ouvert consomme de la mémoire vive. Quand la RAM est pleine, l'ordinateur utilise le stockage comme mémoire de secours — c'est beaucoup plus lent, d'où le ralentissement.",
            },
            {
              id: "q2",
              question: "Tu éteins ton PC et tu le rallumes le lendemain. Tes fichiers Word sont toujours là. Quel composant les a gardés ?",
              type: "mcq",
              choices: ["La RAM", "Le processeur", "Le stockage (SSD ou HDD)", "L'alimentation"],
              correct: 2,
              explanation:
                "✅ Le stockage ! Contrairement à la RAM qui s'efface à chaque extinction, le SSD ou HDD garde les données de façon permanente. C'est comme la différence entre un tableau blanc (RAM) et un cahier (SSD).",
            },
            {
              id: "q3",
              question: "Le processeur de ton téléphone tourne à 99% depuis 5 minutes. Qu'est-ce qui se passe probablement ?",
              type: "mcq",
              choices: [
                "Le téléphone va s'améliorer tout seul",
                "Il chauffe et ralentit pour se protéger",
                "La batterie se charge plus vite",
              ],
              correct: 1,
              explanation:
                "✅ Quand le CPU est surchargé, le téléphone chauffe. Pour éviter de griller les circuits, il réduit automatiquement sa vitesse — c'est le 'throttling thermique'. Ferme les applis en arrière-plan !",
            },
            {
              id: "q4",
              question: "Tu travailles sur un document Word pendant 1 heure sans sauvegarder. L'électricité coupe. Que se passe-t-il ?",
              type: "mcq",
              narrative: "💡 La lumière s'éteint brusquement...",
              choices: [
                "Le document est sauvegardé automatiquement dans le SSD",
                "Tout le travail non sauvegardé est perdu — la RAM s'est effacée",
                "Le processeur garde une copie de secours",
              ],
              correct: 1,
              explanation:
                "✅ Tout ce qui était en RAM (non sauvegardé) disparaît ! La RAM est une mémoire VOLATILE — elle a besoin d'électricité pour garder les données. Conseil : Ctrl+S souvent, ou active la sauvegarde automatique !",
            },
            {
              id: "q5",
              question: "Kirikou reçoit les blocs de commande que tu lui envoies via l'écran tactile. C'est quelle catégorie de composant ?",
              type: "mcq",
              choices: ["Sortie — il envoie les infos", "Entrée — il reçoit les infos", "Stockage — il garde les infos"],
              correct: 1,
              explanation:
                "✅ L'écran tactile est ici un périphérique d'ENTRÉE — tu touches l'écran pour envoyer des commandes À l'ordinateur. (L'écran est aussi une sortie pour l'affichage — c'est un composant double !)",
            },
            {
              id: "q6",
              question: "Orange Money calcule ton solde en temps réel quand tu consultes ton compte. Quel composant fait ce calcul ?",
              type: "mcq",
              choices: ["La RAM", "Le stockage", "Le processeur (CPU)", "L'écran"],
              correct: 2,
              explanation:
                "✅ Le processeur ! C'est lui qui effectue tous les calculs — additions, comparaisons, vérifications. La RAM stocke les données temporaires pendant le calcul, et le SSD garde le solde final.",
            },
          ],
        },
      },
      {
        type: "text",
        order_index: 2,
        content: {
          html: `
<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 20px">
  <h3 style="color:#FDB813;margin:0 0 8px">🤖 Kirikou a tout compris !</h3>
  ${narr("'Alors mon CPU, c'est mon cerveau… ma RAM c'est ce que je pense maintenant… et mon stockage c'est mes souvenirs !' dit Kirikou. <strong style='color:#FDB813'>Exactement.</strong> Et dans la prochaine séance, il va se servir de tout ça pour naviguer dans un labyrinthe.")}
</div>`,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3 — Entrée, Sortie ou les deux ?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Entrée, Sortie ou les deux ?",
    description: "Aide Kirikou à trier les périphériques — il a besoin de savoir qui lui parle et à qui il parle.",
    xp_reward: 40,
    order_index: 2,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `
<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:22px 26px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.2em">🤖 Kirikou doit trier ses sens</h2>
  ${narr("Avant d'entrer dans le labyrinthe, Kirikou veut identifier chaque partie de lui-même. <em>'Par où est-ce que je reçois des informations ? Par où est-ce que j'en envoie ?'</em>")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0">
    <div style="background:#10b98115;border:1px solid #10b98140;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.5em">⬇️</div>
      <div style="color:#10b981;font-weight:800;font-size:0.9em">ENTRÉE</div>
      <div style="color:#94a3b8;font-size:0.8em;margin-top:4px">L'ordinateur <em>reçoit</em> des infos du monde extérieur</div>
    </div>
    <div style="background:#f9731615;border:1px solid #f9731640;border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1.5em">⬆️</div>
      <div style="color:#f97316;font-weight:800;font-size:0.9em">SORTIE</div>
      <div style="color:#94a3b8;font-size:0.8em;margin-top:4px">L'ordinateur <em>envoie</em> des infos vers l'extérieur</div>
    </div>
  </div>
  ${tip("Certains périphériques font les DEUX à la fois — c'est une réponse valide !")}
</div>`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "q1",
              question: "Le clavier de ton ordinateur — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée", "Sortie", "Les deux"],
              correct: 0,
              explanation: "✅ Entrée ! Tu tapes → l'ordinateur reçoit. C'est l'exemple classique de périphérique d'entrée.",
            },
            {
              id: "q2",
              question: "L'écran de ton PC (qui affiche du texte et des images) — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée", "Sortie", "Les deux"],
              correct: 1,
              explanation:
                "✅ Sortie ! L'écran affiche ce que l'ordinateur produit. Tu REÇOIS l'information, mais c'est l'ordinateur qui l'ENVOIE vers l'écran.",
            },
            {
              id: "q3",
              question: "Le microphone de ton téléphone — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée", "Sortie", "Les deux"],
              correct: 0,
              explanation:
                "✅ Entrée ! Le micro capte ta voix et l'envoie à l'ordinateur pour traitement (reconnaissance vocale, enregistrement...).",
            },
            {
              id: "q4",
              question: "Le haut-parleur de ton PC — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée", "Sortie", "Les deux"],
              correct: 1,
              explanation:
                "✅ Sortie ! Le son sort de l'ordinateur vers tes oreilles. Tu n'envoies rien à l'ordinateur via le haut-parleur.",
            },
            {
              id: "q5",
              question: "Piège ! L'écran TACTILE de ton smartphone — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée seulement", "Sortie seulement", "Les deux — il affiche ET détecte les touches"],
              correct: 2,
              explanation:
                "✅ Les DEUX ! L'écran affiche (sortie) ET détecte tes touches (entrée). C'est un composant hybride entrée/sortie — comme beaucoup de technologies modernes !",
            },
            {
              id: "q6",
              question: "Le GPS de ton téléphone qui calcule ta position — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée — il reçoit des signaux satellites", "Sortie — il émet un signal", "Les deux"],
              correct: 0,
              explanation:
                "✅ Entrée ! Le GPS reçoit des signaux des satellites pour calculer ta position. L'ordinateur (téléphone) REÇOIT ces données — c'est donc une entrée.",
            },
            {
              id: "q7",
              question: "La vibration de ton téléphone quand tu reçois un message — Entrée ou Sortie ?",
              type: "mcq",
              choices: ["Entrée", "Sortie", "Les deux"],
              correct: 1,
              explanation:
                "✅ Sortie ! La vibration est produite PAR l'ordinateur pour te signaler quelque chose. C'est une sortie tactile — comme l'écran est une sortie visuelle.",
            },
            {
              id: "q8",
              question: "GRAND PIÈGE ! Kirikou reçoit tes blocs de commandes (entrée pour lui) et affiche sa position sur l'écran (sortie pour toi). Quel est le point de vue CORRECT ?",
              type: "mcq",
              choices: [
                "Entrée et Sortie dépendent toujours de qui envoie et qui reçoit",
                "C'est toujours une sortie car l'écran affiche",
                "C'est toujours une entrée car quelqu'un envoie",
              ],
              correct: 0,
              explanation:
                "✅ Exactement ! Entrée et Sortie sont RELATIVES à l'ordinateur (ou au robot). Ce qui entre DANS l'ordinateur = Entrée. Ce qui sort DE l'ordinateur = Sortie. Le même fil peut être les deux selon qui on observe !",
            },
          ],
        },
      },
      {
        type: "text",
        order_index: 2,
        content: {
          html: `
<div style="background:#a78bfa15;border:1px solid #a78bfa40;border-radius:12px;padding:16px 20px">
  <h3 style="color:#a78bfa;margin:0 0 8px">⚡ Kirikou est prêt !</h3>
  ${narr("Kirikou sait maintenant comment il reçoit les ordres (entrée), comment il réfléchit (CPU + RAM), et comment il montre sa position (sortie). <strong style='color:#FDB813'>Dans la Séance 2, tu vas lui donner ses premières vraies instructions.</strong>")}
</div>`,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4 — Kirikou a besoin de toi
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Kirikou a besoin de toi !",
    description: "Quiz final qui relie tout ce que tu as appris sur l'ordinateur au fonctionnement de Kirikou.",
    xp_reward: 45,
    order_index: 3,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `
<div style="background:linear-gradient(135deg,#1a0f2e,#0f172a);border:1px solid #a78bfa40;border-radius:14px;padding:22px 26px">
  <h2 style="color:#a78bfa;margin:0 0 10px;font-size:1.2em">🏆 Le test final de Kirikou</h2>
  ${narr("Kirikou est au bord du labyrinthe. Avant d'entrer, son créateur lui pose des questions pour vérifier qu'il comprend bien comment il fonctionne. <strong style='color:#FDB813'>Réponds à sa place !</strong>")}
  <p style="color:#94a3b8;font-size:0.88em;margin:10px 0 0">Ce quiz mélange tout ce que tu as vu dans cette séance. Montre que tu es prêt(e) pour la Séance 2 !</p>
</div>`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "q1",
              question: "Tu envoies les blocs de commande à Kirikou via l'écran tactile. Pour Kirikou, c'est quoi ?",
              type: "mcq",
              choices: ["Une sortie — il affiche quelque chose", "Une entrée — il reçoit tes instructions", "Du stockage — il mémorise"],
              correct: 1,
              explanation:
                "✅ Pour Kirikou, recevoir tes blocs = ENTRÉE. Tu lui envoies des données, il les reçoit. Comme un clavier pour un PC.",
            },
            {
              id: "q2",
              question: "Kirikou calcule le chemin le plus court dans le labyrinthe. Quel composant fait ce calcul ?",
              type: "mcq",
              choices: ["La RAM", "Le processeur (CPU)", "Le stockage", "L'écran"],
              correct: 1,
              explanation:
                "✅ Le CPU ! Le processeur analyse les données, compare les options, et calcule le meilleur chemin. C'est son travail : faire des calculs.",
            },
            {
              id: "q3",
              question: "Pendant que Kirikou avance, il garde en mémoire les cases déjà visitées. Quel composant stocke ça ?",
              type: "mcq",
              choices: ["Le CPU", "La RAM — mémoire de travail active", "Le SSD — stockage permanent"],
              correct: 1,
              explanation:
                "✅ La RAM ! C'est la mémoire de travail en temps réel. Kirikou garde la carte du labyrinthe en RAM pendant qu'il avance — c'est temporaire et rapide.",
            },
            {
              id: "q4",
              question: "La carte complète du labyrinthe (les murs, la sortie) est sauvegardée avant la partie. Quel composant la garde ?",
              type: "mcq",
              choices: ["La RAM", "Le CPU", "Le stockage (SSD)"],
              correct: 2,
              explanation:
                "✅ Le stockage ! La carte est une donnée permanente — elle doit rester même si on éteint Kirikou. C'est le rôle du SSD ou de la mémoire flash.",
            },
            {
              id: "q5",
              question: "Kirikou affiche sa position actuelle sur l'écran du labyrinthe. Pour Kirikou, c'est quoi ?",
              type: "mcq",
              choices: ["Une entrée", "Une sortie", "Du stockage"],
              correct: 1,
              explanation:
                "✅ Sortie ! Kirikou ENVOIE sa position vers l'écran. L'écran est un périphérique de sortie — il montre ce que l'ordinateur produit.",
            },
            {
              id: "q6",
              question: "PIÈGE ! Tu éteins Kirikou en plein milieu du labyrinthe, puis tu le rallumes. Se souvient-il de sa position ?",
              type: "mcq",
              narrative: "😱 Panne de courant au milieu du labyrinthe...",
              choices: [
                "Oui, il a tout gardé en RAM",
                "Non — la RAM s'efface à l'extinction, sa position est perdue",
                "Oui, le CPU garde toujours une copie",
              ],
              correct: 1,
              explanation:
                "✅ Non ! La RAM s'efface à chaque extinction. Sa position (non sauvegardée sur SSD) est perdue. C'est pourquoi les jeux vidéo ont des 'sauvegardes' — elles copient la RAM vers le stockage !",
            },
          ],
        },
      },
      {
        type: "text",
        order_index: 2,
        content: {
          html: `
<div style="background:linear-gradient(135deg,#10b98115,#1e293b);border:1px solid #10b98140;border-radius:14px;padding:22px 26px;text-align:center">
  <div style="font-size:2.5em;margin-bottom:10px">🎉</div>
  <h2 style="color:#10b981;margin:0 0 8px">Séance 1 terminée !</h2>
  ${narr("Tu connais maintenant l'ordinateur de l'intérieur. Kirikou t'attend à l'entrée du labyrinthe. <strong style='color:#FDB813'>Dans la Séance 2, tu vas écrire tes premiers algorithmes pour le guider.</strong> C'est parti !")}
</div>`,
        },
      },
    ],
  },
];

// ─── Insertion ───────────────────────────────────────────────────────────────

async function main() {
  // Supprimer les entraînements existants pour cette leçon
  const { data: existing } = await (supabase.from("trainings") as any)
    .select("id")
    .eq("lesson_id", LESSON_ID);

  if (existing?.length) {
    for (const t of existing) {
      await (supabase.from("training_blocks") as any).delete().eq("training_id", t.id);
    }
    await (supabase.from("trainings") as any).delete().eq("lesson_id", LESSON_ID);
    console.log(`🗑️  ${existing.length} entraînement(s) existant(s) supprimé(s)`);
  }

  for (const [i, training] of TRAININGS.entries()) {
    const { blocks, ...trainingData } = training;

    const { data: t, error: tErr } = await (supabase.from("trainings") as any)
      .insert({ ...trainingData, lesson_id: LESSON_ID })
      .select("id")
      .single();

    if (tErr || !t) {
      console.error(`❌ [${i + 1}] ${training.title}:`, tErr?.message);
      continue;
    }

    for (const block of blocks) {
      const { error: bErr } = await (supabase.from("training_blocks") as any).insert({
        ...block,
        training_id: t.id,
      });
      if (bErr) console.error(`  ❌ bloc ${block.order_index}:`, bErr.message);
    }

    console.log(`✓ [${i + 1}/${TRAININGS.length}] ${training.title} (${training.xp_reward} XP)`);
  }

  console.log(`\n🎉 ${TRAININGS.length} entraînements créés pour 'L'ordinateur, la machine magique' !`);
}

main().catch(console.error);
