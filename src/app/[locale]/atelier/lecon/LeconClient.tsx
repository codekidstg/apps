"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AtelierGame from "../AtelierGame";

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

type Example = { icon: string; title: string; desc: string };

type Block =
  | { type: "intro" }
  | { type: "vaisseau" }
  | { type: "manche1" }
  | { type: "concept"; concept: string; color: string; icon: string; title: string; body: string; examples: Example[] }
  | { type: "quiz"; quiz: QuizQuestion }
  | { type: "cadeau" }
  | { type: "fin" };

/** Manche 1 : mêmes règles de base que l'atelier, mais SANS score_boost —
 *  la vitesse reste donc constante. C'est ce manque que la leçon vient combler. */
const MANCHE1_RULES = [
  { id: "collision", condition: "collision", action: "lose_life" },
  { id: "no_lives",  condition: "no_lives",  action: "game_over" },
  { id: "loop",      condition: "loop",      action: "continue"  },
];

const VAISSEAUX = ["🚀", "🛸", "☄️"];

// ─── Contenu ─────────────────────────────────────────────────────────────────

const BLOCKS: Block[] = [
  { type: "intro" },

  { type: "vaisseau" },
  { type: "manche1" },

  // ── VARIABLE ──
  {
    type: "concept",
    concept: "variable", color: "orange", icon: "📦",
    title: "La Variable",
    body: "Une variable, c'est une case mémoire dans l'ordinateur. Elle retient un chiffre ou un mot — et cette valeur peut changer à tout moment.",
    examples: [
      {
        icon: "❤️",
        title: "Tes vies, à l'instant",
        desc: "Tu as commencé avec 3 vies. Tu as touché un astéroïde, il t'en restait 2. Ce nombre changeait pendant que tu jouais — c'est une variable.",
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
      question: "Dans la manche que tu viens de jouer, qu'est-ce qui était une variable ?",
      options: [
        "La forme des astéroïdes",
        "Ton score",
        "La couleur du fond",
      ],
      correct: 1,
      explanation: "Ton score montait pendant que tu survivais. Une variable, c'est exactement ça : une valeur qui évolue pendant que le programme tourne. Ton prénom en est une aussi — tu vas le donner tout à l'heure, et le jeu s'en souviendra.",
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
        desc: "SI le courant s'arrête ALORS le générateur démarre. Sur les grosses installations, la machine surveille le courant en permanence et bascule toute seule.",
      },
      {
        icon: "🔒",
        title: "Le code du téléphone",
        desc: "SI le code est bon ALORS le téléphone s'ouvre. SINON il reste bloqué. Une question, deux réponses possibles — jamais autre chose.",
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
      question: "Dans ta manche : SI ton vaisseau touche un astéroïde, ALORS…",
      options: [
        "Le jeu accélère",
        "Tu perds une vie",
        "Ton score monte",
      ],
      correct: 1,
      explanation: "SI (la question) tu touches un astéroïde, ALORS (l'action) tu perds une vie. Cette condition tournait déjà dans ton jeu sans que tu l'écrives. Tout à l'heure, c'est toi qui en ajouteras une.",
    },
  },

  // ── COMPARAISON + CADEAU ──
  { type: "cadeau" },
  {
    type: "quiz",
    quiz: {
      question: "Le prix que tu viens de fixer va servir à quoi dans ton jeu ?",
      options: [
        "Changer la couleur du vaisseau",
        "Savoir quand les astéroïdes accélèrent",
        "Compter tes vies",
      ],
      correct: 1,
      explanation: "Le jeu compare ton score à ton seuil, 60 fois par seconde. Et c'est là le lien : une comparaison, c'est ce qui répond à la question posée par une condition. SI score >= seuil — la comparaison dit OUI ou NON, la condition agit.",
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
        icon: "🥣",
        title: "Le pilon dans le mortier",
        desc: "Pam, pam, pam — encore et encore, jusqu'à ce que la pâte soit prête. Le geste se répète ; c'est la pâte prête qui arrête la boucle.",
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
      question: "Pendant ta manche, le jeu vérifiait ses règles 60 fois par seconde. C'est…",
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

export default function LeconClient({ homeHref }: { homeHref: string }) {
  const router = useRouter();
  const [confirmSortie, setConfirmSortie] = useState(false);
  const [idx, setIdx]               = useState(0);
  const [answered, setAnswered]     = useState<number | null>(null);
  const [cadeauNom, setCadeauNom]   = useState("");
  const [cadeauPrix, setCadeauPrix] = useState("");
  const [xp, setXp]                 = useState(0);
  const [vaisseau, setVaisseau]     = useState(VAISSEAUX[0]);
  const [manche1Score, setManche1Score] = useState<number | null>(null);

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
    if (vaisseau)   params.set("vaisseau", vaisseau);
    router.push(`/fr/atelier?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">

      {/* Confirmation de sortie — rien n'est sauvegardé, on prévient avant de perdre */}
      {confirmSortie && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
             onClick={() => setConfirmSortie(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center"
               onClick={e => e.stopPropagation()}>
            <div className="text-4xl">👋</div>
            <h2 className="text-lg font-black text-white">Quitter la leçon ?</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ta progression n&apos;est pas enregistrée. Si tu sors maintenant,
              tu devras tout recommencer depuis le début.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmSortie(false)}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-xl text-sm transition-colors">
                Rester
              </button>
              <button onClick={() => router.push(homeHref)}
                className="flex-1 py-2.5 border border-slate-600 hover:bg-slate-800 text-slate-300 font-black rounded-xl text-sm transition-colors">
                Sortir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Sortie : sur l'intro il n'y a rien à perdre, ensuite on confirme */}
          <button
            onClick={() => (idx === 0 ? router.push(homeHref) : setConfirmSortie(true))}
            className="text-slate-500 hover:text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
            title="Quitter la leçon">
            🏠 <span className="hidden sm:inline">Quitter</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-black text-white text-sm">Avant l&apos;atelier</span>
          </div>
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
                Mais on ne commence pas par un cours.<br />
                <strong className="text-white">D&apos;abord tu joues.</strong> Une minute.<br />
                Ensuite tu verras ce qui manque à ce jeu — et tu le répareras.
              </p>
              <button onClick={next}
                className="mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                Choisir mon vaisseau →
              </button>
            </div>
          )}

          {/* ── CHOIX DU VAISSEAU (rapide) ── */}
          {block.type === "vaisseau" && (
            <div className="text-center space-y-6">
              <div className="text-5xl">🚀</div>
              <h2 className="text-2xl font-black text-white">Choisis ton vaisseau</h2>
              <p className="text-slate-400 text-sm">Tu pourras en changer plus tard.</p>
              <div className="flex justify-center gap-4">
                {VAISSEAUX.map(v => (
                  <button key={v} onClick={() => setVaisseau(v)}
                    className={`w-20 h-20 rounded-2xl text-4xl flex items-center justify-center transition-all border-2 ${
                      vaisseau === v
                        ? "border-orange-500 bg-orange-500/20 scale-110 shadow-lg shadow-orange-500/30"
                        : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:scale-105"
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={next}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105">
                Jouer →
              </button>
            </div>
          )}

          {/* ── MANCHE 1 : vitesse constante, aucune règle de l'enfant ── */}
          {block.type === "manche1" && (
            <div className="space-y-5">
              {manche1Score === null ? (
                <>
                  <div className="text-center">
                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Manche 1</div>
                    <h2 className="text-xl font-black text-white mt-1">Survis le plus longtemps possible</h2>
                    <p className="text-slate-400 text-xs mt-1">Flèches ou doigt pour bouger. 3 vies.</p>
                  </div>
                  <AtelierGame
                    config={{
                      avatar: vaisseau, name: "", speed: 2, obstacles: 2,
                      obstacleSize: 2, theme: "space", rules: MANCHE1_RULES,
                    }}
                    onGameOver={(s) => setManche1Score(s)}
                  />
                </>
              ) : (
                <div className="text-center space-y-5">
                  <div className="text-5xl">🎯</div>
                  <div>
                    <div className="text-slate-400 text-sm">Ton score</div>
                    <div className="text-4xl font-black text-orange-400">{manche1Score}</div>
                  </div>
                  <div className="bg-slate-900 border-l-4 border-orange-500 rounded-xl p-4 text-left space-y-2">
                    <p className="text-slate-200 text-sm leading-relaxed">
                      Tu as remarqué ? Les astéroïdes allaient <strong className="text-white">toujours à la même vitesse</strong>.
                      Du début à la fin. Jamais plus dur, jamais plus excitant.
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      C&apos;est parce qu&apos;il manque une règle à ce jeu. Une règle que
                      <strong className="text-orange-400"> tu vas écrire toi-même</strong> dans quelques minutes.
                    </p>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Pour l&apos;écrire, il te faut 4 mots. Les voici.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: "📦", label: "Variable",    color: "text-orange-400" },
                      { icon: "❓", label: "Condition",   color: "text-red-400" },
                      { icon: "⚖️", label: "Comparaison", color: "text-yellow-400" },
                      { icon: "🔄", label: "Boucle",      color: "text-blue-400" },
                    ].map(c => (
                      <div key={c.label} className="bg-slate-900 border border-slate-700 rounded-2xl p-2 text-center">
                        <div className="text-xl mb-0.5">{c.icon}</div>
                        <div className={`text-[10px] font-black ${c.color}`}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={next}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105">
                    Comprendre pourquoi →
                  </button>
                </div>
              )}
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
                    { icon: "🚰", title: "L'eau du château", desc: "SI le niveau descend sous 30 % ALORS la pompe redémarre. Un chiffre comparé à un seuil précis — automatiquement." },
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
