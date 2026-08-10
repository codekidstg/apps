"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

type Example = { icon: string; title: string; desc: string };

type Block =
  | { type: "intro" }
  | { type: "concept"; concept: string; color: string; icon: string; title: string; body: string; examples: Example[] }
  | { type: "quiz"; quiz: QuizQuestion }
  | { type: "cadeau" }
  | { type: "fin" };

// ─── Contenu ─────────────────────────────────────────────────────────────────

const BLOCKS: Block[] = [
  { type: "intro" },

  // ── VARIABLE ──
  {
    type: "concept",
    concept: "variable", color: "orange", icon: "📦",
    title: "La Variable",
    body: "Une variable, c'est une case mémoire dans l'ordinateur. Elle retient un chiffre ou un mot — et cette valeur peut changer à tout moment.",
    examples: [
      {
        icon: "👟",
        title: "Les chaussures du matin",
        desc: "Tu as plusieurs paires, tu en choisis une. Ton cerveau retient ce choix toute la journée — pas celui de ton voisin. L'ordinateur fait pareil.",
      },
      {
        icon: "🔊",
        title: "Le volume de la musique",
        desc: "Tu montes, tu baisses. Le téléphone retient le niveau exact. Demain il repart du même endroit. C'est une variable.",
      },
      {
        icon: "💬",
        title: "Les messages non lus WhatsApp",
        desc: "Le badge passe de 3 à 12 à 0. Ce compteur change en permanence — c'est une variable que l'app met à jour à chaque message.",
      },
      {
        icon: "⚽",
        title: "Le score d'un match",
        desc: "0 - 0 au début, 2 - 1 à la fin. Le tableau retient le score et le met à jour à chaque but. Variable.",
      },
    ],
  },
  {
    type: "quiz",
    quiz: {
      question: "Parmi ces exemples, lequel est une variable ?",
      options: [
        "Ton prénom",
        "Ton solde de crédit téléphonique",
        "La couleur du ciel en journée",
      ],
      correct: 1,
      explanation: "Ton solde change chaque fois que tu appelles ou que tu recharges — c'est exactement ça une variable : un chiffre qui évolue dans le temps.",
    },
  },

  // ── CONDITION ──
  {
    type: "concept",
    concept: "condition", color: "red", icon: "❓",
    title: "La Condition",
    body: "Une condition, c'est une question dont la réponse est OUI ou NON. L'ordinateur vérifie des milliers de conditions par seconde et agit selon la réponse.",
    examples: [
      {
        icon: "📳",
        title: "Le téléphone qui vibre",
        desc: "Il ne vibre pas tout le temps — seulement SI un message arrive. SI message reçu ALORS faire vibrer. C'est une condition.",
      },
      {
        icon: "💡",
        title: "Le groupe électrogène",
        desc: "SI le courant s'arrête ALORS le générateur démarre. Ça se fait tout seul — c'est une condition programmée dans la machine.",
      },
      {
        icon: "🏫",
        title: "La note à l'école",
        desc: "SI ta note est >= 10 ALORS tu passes. Le système vérifie ça automatiquement pour chaque élève. Même logique qu'un programme.",
      },
      {
        icon: "🌧️",
        title: "La pluie et le parapluie",
        desc: "SI il pleut ALORS tu prends ton parapluie. Ton cerveau fait cette vérification dès que tu sors — l'ordinateur fait pareil, des milliers de fois par seconde.",
      },
    ],
  },
  {
    type: "quiz",
    quiz: {
      question: "Complète la condition : SI il pleut ALORS…",
      options: [
        "Je reste dehors quand même",
        "Je prends un parapluie",
        "Je mange du riz",
      ],
      correct: 1,
      explanation: "Exact ! SI (condition) il pleut ALORS (action) prendre un parapluie. Les programmes fonctionnent tous comme ça.",
    },
  },

  // ── COMPARAISON + CADEAU ──
  { type: "cadeau" },
  {
    type: "quiz",
    quiz: {
      question: "C'est quoi une comparaison ?",
      options: [
        "Une variable qui change",
        "Vérifier si un chiffre a dépassé un seuil",
        "Une action qui se répète",
      ],
      correct: 1,
      explanation: "L'ordinateur compare en permanence des chiffres avec des seuils. C'est toi qui fixes le seuil — comme tu viens de fixer le prix de ton cadeau.",
    },
  },

  // ── BOUCLE ──
  {
    type: "concept",
    concept: "boucle", color: "blue", icon: "🔄",
    title: "La Boucle",
    body: "Une boucle, c'est une action qui se répète encore et encore — jusqu'à ce qu'une condition l'arrête. Sans boucle, un programme s'exécute une seule fois puis s'arrête.",
    examples: [
      {
        icon: "🫁",
        title: "La respiration",
        desc: "Inspire, expire, inspire, expire — sans fin, sans y penser. Ton jeu fait pareil : 60 fois par seconde il vérifie tes règles et bouge les astéroïdes.",
      },
      {
        icon: "🌀",
        title: "Le ventilateur",
        desc: "Dès qu'on l'allume il tourne, tourne, tourne — jusqu'à ce qu'on l'éteigne. Sans boucle, il ferait un seul tour et s'arrêterait.",
      },
      {
        icon: "🚦",
        title: "Le feu tricolore",
        desc: "Rouge → vert → orange → rouge → vert… Il ne s'arrête jamais, il recommence toujours. C'est une boucle programmée.",
      },
      {
        icon: "📣",
        title: "Le marchand au marché",
        desc: "Il répète « venez acheter, venez acheter » toute la journée. Humainement c'est une boucle — et dans ton jeu, c'est comme ça que les astéroïdes continuent d'arriver.",
      },
    ],
  },
  {
    type: "quiz",
    quiz: {
      question: "Le jeu vérifie tes règles 60 fois par seconde. C'est…",
      options: [
        "Une condition",
        "Une variable",
        "Une boucle",
      ],
      correct: 2,
      explanation: "Exactement ! La boucle tourne en permanence. Chaque tour, elle vérifie tes conditions, met à jour les variables, et recommence.",
    },
  },

  { type: "fin" },
];

const COLORS: Record<string, { bg: string; border: string; badge: string; text: string; card: string }> = {
  orange: { bg: "bg-orange-950/40", border: "border-orange-500", badge: "bg-orange-500/20 text-orange-300", text: "text-orange-400", card: "bg-orange-900/20 border-orange-800/40" },
  red:    { bg: "bg-red-950/40",    border: "border-red-500",    badge: "bg-red-500/20 text-red-300",       text: "text-red-400",    card: "bg-red-900/20 border-red-800/40" },
  yellow: { bg: "bg-yellow-950/40", border: "border-yellow-500", badge: "bg-yellow-500/20 text-yellow-300", text: "text-yellow-400", card: "bg-yellow-900/20 border-yellow-800/40" },
  blue:   { bg: "bg-blue-950/40",   border: "border-blue-500",   badge: "bg-blue-500/20 text-blue-300",     text: "text-blue-400",   card: "bg-blue-900/20 border-blue-800/40" },
};

export default function LeconClient() {
  const router = useRouter();
  const [idx, setIdx]               = useState(0);
  const [answered, setAnswered]     = useState<number | null>(null);
  const [cadeauNom, setCadeauNom]   = useState("");
  const [cadeauPrix, setCadeauPrix] = useState("");
  const [xp, setXp]                 = useState(0);

  const block    = BLOCKS[idx];
  const total    = BLOCKS.length;
  const progress = Math.round((idx / (total - 1)) * 100);

  function next() { setAnswered(null); setIdx(i => Math.min(i + 1, total - 1)); }

  function answer(i: number) {
    if (answered !== null) return;
    setAnswered(i);
    if (block.type === "quiz" && i === block.quiz.correct) setXp(x => x + 20);
  }

  function startAtelier() {
    const params = new URLSearchParams();
    if (cadeauPrix) params.set("seuil", cadeauPrix);
    if (cadeauNom)  params.set("cadeau", cadeauNom);
    router.push(`/fr/atelier?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-black text-white text-sm">Avant l'atelier</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-yellow-400">⭐ {xp} XP</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-500">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl space-y-6">

          {/* ── INTRO ── */}
          {block.type === "intro" && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">🎮</div>
              <h1 className="text-3xl font-black leading-tight">
                Ce soir tu crées<br />
                <span className="text-orange-400">un vrai jeu vidéo.</span>
              </h1>
              <p className="text-slate-300 text-base leading-relaxed">
                Pour ça, tu vas apprendre <strong className="text-white">4 mots</strong> que
                les développeurs utilisent tous les jours.<br />
                Ça prend 10 minutes. Allons-y.
              </p>
              <div className="grid grid-cols-4 gap-3 pt-2">
                {[
                  { icon: "📦", label: "Variable",    color: "text-orange-400" },
                  { icon: "❓", label: "Condition",   color: "text-red-400" },
                  { icon: "⚖️", label: "Comparaison", color: "text-yellow-400" },
                  { icon: "🔄", label: "Boucle",      color: "text-blue-400" },
                ].map(c => (
                  <div key={c.label} className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
                    <div className="text-2xl mb-1">{c.icon}</div>
                    <div className={`text-xs font-black ${c.color}`}>{c.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={next}
                className="mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                C'est parti →
              </button>
            </div>
          )}

          {/* ── CONCEPT ── */}
          {block.type === "concept" && (() => {
            const c = COLORS[block.color];
            return (
              <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6 space-y-5`}>
                {/* En-tête */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{block.icon}</span>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.badge}`}>
                      {block.concept}
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">{block.title}</h2>
                  </div>
                </div>

                {/* Définition */}
                <p className="text-slate-200 text-sm leading-relaxed">{block.body}</p>

                {/* Exemples en cartes */}
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    💡 Exemples concrets
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {block.examples.map((ex, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${c.card}`}>
                        <span className="text-2xl shrink-0 mt-0.5">{ex.icon}</span>
                        <div>
                          <div className={`text-xs font-black mb-0.5 ${c.text}`}>{ex.title}</div>
                          <div className="text-xs text-slate-300 leading-relaxed">{ex.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={next}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-xl transition-all">
                  J'ai compris →
                </button>
              </div>
            );
          })()}

          {/* ── QUIZ ── */}
          {block.type === "quiz" && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  ✏️ Quiz
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
                <p className="text-white font-bold text-base leading-relaxed">{block.quiz.question}</p>
                <div className="space-y-2">
                  {block.quiz.options.map((opt, i) => {
                    const isCorrect = i === block.quiz.correct;
                    const isChosen  = answered === i;
                    const revealed  = answered !== null;
                    return (
                      <button key={i} onClick={() => answer(i)} disabled={revealed}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                          !revealed
                            ? "border-slate-600 bg-slate-800 hover:border-slate-400 hover:bg-slate-700 text-white"
                            : isCorrect
                              ? "border-emerald-500 bg-emerald-950/50 text-emerald-300"
                              : isChosen
                                ? "border-red-500 bg-red-950/50 text-red-300"
                                : "border-slate-700 bg-slate-800/50 text-slate-500"
                        }`}
                      >
                        <span className="mr-2 text-slate-400">{["A", "B", "C"][i]}.</span>
                        {opt}
                        {revealed && isCorrect && <span className="float-right">✅</span>}
                        {revealed && isChosen && !isCorrect && <span className="float-right">❌</span>}
                      </button>
                    );
                  })}
                </div>
                {answered !== null && (
                  <div className={`rounded-xl p-4 text-sm leading-relaxed ${
                    answered === block.quiz.correct
                      ? "bg-emerald-950/50 border border-emerald-700 text-emerald-300"
                      : "bg-slate-800 border border-slate-600 text-slate-300"
                  }`}>
                    {answered === block.quiz.correct
                      ? <><strong>+20 XP 🎉</strong> — </>
                      : <><strong>Pas tout à fait.</strong> — </>
                    }
                    {block.quiz.explanation}
                  </div>
                )}
                {answered !== null && (
                  <button onClick={next}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-xl transition-all">
                    Continuer →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── CADEAU (Comparaison) ── */}
          {block.type === "cadeau" && (
            <div className="rounded-2xl border-2 border-yellow-500 bg-yellow-950/40 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">⚖️</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                    comparaison
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">La Comparaison</h2>
                </div>
              </div>

              <p className="text-slate-200 text-sm leading-relaxed">
                Une comparaison, c'est vérifier si un chiffre a dépassé un seuil. L'ordinateur fait ça des milliers de fois par seconde — sans jamais se fatiguer.
              </p>

              {/* Exemples */}
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">💡 Exemples concrets</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: "🔋", title: "La batterie du téléphone", desc: "SI batterie <= 20% ALORS afficher alerte rouge. Le téléphone compare ton niveau avec le seuil 20, des milliers de fois par seconde." },
                    { icon: "🚰", title: "L'eau du robinet", desc: "SI le château d'eau est trop bas ALORS la pompe redémarre. Un chiffre comparé à un seuil — automatiquement." },
                    { icon: "📝", title: "La note de passage", desc: "SI moyenne >= 10 ALORS passage en classe supérieure. Le système fait cette comparaison pour chaque élève, automatiquement." },
                  ].map((ex, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-yellow-900/20 border-yellow-800/40">
                      <span className="text-2xl shrink-0 mt-0.5">{ex.icon}</span>
                      <div>
                        <div className="text-xs font-black mb-0.5 text-yellow-400">{ex.title}</div>
                        <div className="text-xs text-slate-300 leading-relaxed">{ex.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saisie cadeau */}
              <div className="bg-black/30 rounded-xl p-4 border-l-4 border-yellow-500/40 space-y-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🎁 Maintenant ton exemple à toi</div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Ton cadeau et son prix vont devenir une règle dans ton jeu. Le seuil que tu fixes ici sera le moment où les astéroïdes accélèrent.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">C'est quoi ton cadeau ?</label>
                    <input type="text" placeholder="Ex : un téléphone, des baskets…"
                      value={cadeauNom} onChange={e => setCadeauNom(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-yellow-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Ça coûte combien ? (en FCFA)</label>
                    <input type="number" placeholder="Ex : 15000"
                      value={cadeauPrix} onChange={e => setCadeauPrix(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-yellow-500" />
                  </div>
                </div>
              </div>

              {cadeauNom && cadeauPrix && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200 leading-relaxed">
                  <strong>Ta règle :</strong><br />
                  <code className="text-yellow-400 font-mono text-xs">
                    SI score &gt;= {parseInt(cadeauPrix).toLocaleString()} pts<br />
                    ALORS les astéroïdes vont plus vite
                  </code>
                  <p className="mt-2 text-slate-300 text-xs">
                    Tu viens de fixer ton seuil — comme quand le téléphone se met à sonner à 20% de batterie. C'est toi le développeur.
                  </p>
                </div>
              )}

              <button onClick={next} disabled={!cadeauNom || !cadeauPrix}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-xl transition-all">
                J'ai compris →
              </button>
            </div>
          )}

          {/* ── FIN ── */}
          {block.type === "fin" && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🏆</div>
              <h2 className="text-3xl font-black">
                Tu es <span className="text-orange-400">prêt·e</span> !
              </h2>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: "📦", label: "Variable",    desc: "Un chiffre que le programme retient et met à jour", color: "text-orange-400" },
                  { icon: "❓", label: "Condition",   desc: "SI… ALORS… — OUI ou NON",                          color: "text-red-400" },
                  { icon: "⚖️", label: "Comparaison", desc: "Vérifier si un seuil est dépassé",                 color: "text-yellow-400" },
                  { icon: "🔄", label: "Boucle",      desc: "Répéter 60× par seconde, sans s'arrêter",          color: "text-blue-400" },
                ].map(c => (
                  <div key={c.label} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-1">
                    <div className="text-xl">{c.icon}</div>
                    <div className={`text-sm font-black ${c.color}`}>{c.label}</div>
                    <div className="text-xs text-slate-400">{c.desc}</div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-4 text-sm text-slate-300">
                ⭐ Tu as gagné <strong className="text-yellow-400">{xp} XP</strong> dans cette leçon.
                {cadeauNom && (
                  <span> Et ton cadeau — <strong className="text-orange-400">{cadeauNom}</strong> — sera dans ton jeu.</span>
                )}
              </div>
              <button onClick={startAtelier}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                🚀 Créer mon jeu →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
