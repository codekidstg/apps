"use client";

import { useState, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────
type Dir   = "U" | "D" | "L" | "R";
type Pos   = { row: number; col: number };
type Phase = "idle" | "running" | "booster_pause" | "success" | "fail_wall" | "fail_miss";

const GRID = 5;
const START: Pos = { row: 4, col: 0 };
const MAX  = 14;

// ── 3 labyrinthes ────────────────────────────────────────────────
const MAZES = [
  {
    walls:        new Set(["3,0", "4,4"]),
    booster:      { row: 3, col: 3 },
    goal:         { row: 0, col: 4 },
    teleportPath: [{ row:2,col:3 },{ row:1,col:3 },{ row:0,col:3 },{ row:0,col:4 }],
    hint: "Pars à droite, puis monte !",
  },
  {
    walls:        new Set(["0,1", "3,3"]),
    booster:      { row: 1, col: 4 },
    goal:         { row: 0, col: 4 },
    teleportPath: [{ row:0,col:4 }],
    hint: "Le couloir du haut est bloqué — cherche un autre chemin.",
  },
  {
    walls:        new Set(["4,2", "1,0"]),
    booster:      { row: 2, col: 1 },
    goal:         { row: 0, col: 4 },
    teleportPath: [{ row:1,col:1 },{ row:0,col:1 },{ row:0,col:2 },{ row:0,col:3 },{ row:0,col:4 }],
    hint: "La colonne gauche est piégée — zigzague !",
  },
] as const;

// ── Avatar SVG ───────────────────────────────────────────────────
function KodiAvatar({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Oreilles */}
      <circle cx="8"  cy="24" r="4" fill="#F59E0B" />
      <circle cx="32" cy="24" r="4" fill="#F59E0B" />
      {/* Tête */}
      <circle cx="20" cy="24" r="14" fill="#FDB813" />
      {/* Casquette */}
      <rect x="7"  y="12" width="26" height="6" rx="3" fill="#1B2D5E" />
      <rect x="16" y="5"  width="8"  height="9" rx="2" fill="#1B2D5E" />
      <circle cx="20" cy="5" r="2.5" fill="#F97316" />
      {/* Visière casquette */}
      <rect x="5" y="17" width="30" height="3" rx="1.5" fill="#152447" />
      {/* Yeux */}
      <circle cx="15" cy="25" r="4"   fill="white" />
      <circle cx="25" cy="25" r="4"   fill="white" />
      <circle cx="15.5" cy="25.5" r="2.5" fill="#1B2D5E" />
      <circle cx="25.5" cy="25.5" r="2.5" fill="#1B2D5E" />
      {/* Reflets */}
      <circle cx="16.5" cy="24" r="1" fill="white" />
      <circle cx="26.5" cy="24" r="1" fill="white" />
      {/* Sourire */}
      <path d="M14 31 Q20 36 26 31" stroke="#1B2D5E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ── Direction helpers ────────────────────────────────────────────
const DIR_ARROW: Record<Dir, string> = { U: "↑", D: "↓", L: "←", R: "→" };
const DIR_FN:    Record<Dir, string> = { U: "haut", D: "bas", L: "gauche", R: "droite" };
const DIR_DELTA: Record<Dir, Pos>   = {
  U: { row: -1, col: 0 }, D: { row: 1, col: 0 },
  L: { row: 0, col: -1 }, R: { row: 0, col: 1 },
};

// ── Booster quiz (Cité Numérique) ────────────────────────────────
const QUIZ = [
  { question: "Il y a 3 quartiers dans la Cité et 2 routes par quartier. Combien de routes au total ?", options: ["5","6"], correct: 1 },
  { question: "Un feu rouge dans la Cité numérique signifie…", options: ["Avancer","S'arrêter"], correct: 1 },
  { question: "L'avatar doit livrer des colis dans 4 maisons. Il en a déjà livré 3. Combien lui en reste-t-il ?", options: ["2","1"], correct: 1 },
  { question: "La Cité a 12 panneaux solaires répartis en 2 quartiers égaux. Combien par quartier ?", options: ["4","6"], correct: 1 },
];

// ── Le savais-tu ? (faits info / IA / cybersécurité) ─────────────
const FACTS = [
  { emoji: "🐛", fact: "Le premier \"bug\" informatique était un vrai insecte. En 1947, une mite s'est coincée dans un ordinateur Harvard et a causé une panne. L'ingénieure Grace Hopper l'a collée dans son carnet de bord." },
  { emoji: "🚀", fact: "Le processeur de votre smartphone est des millions de fois plus puissant que l'ordinateur qui a guidé Apollo 11 sur la Lune en 1969." },
  { emoji: "📧", fact: "Le premier email a été envoyé en 1971 par Ray Tomlinson — et il ne se souvient plus du contenu. C'est lui qui a aussi inventé l'utilisation du @ dans les adresses." },
  { emoji: "🔐", fact: "Le mot de passe le plus utilisé dans le monde est encore \"123456\". Plus de 23 millions de comptes l'utilisent — et les hackers le testent en premier." },
  { emoji: "🤖", fact: "ChatGPT a atteint 100 millions d'utilisateurs en seulement 2 mois. Facebook en a mis 4 ans. Instagram : 2 ans et demi." },
  { emoji: "👩‍💻", fact: "Ada Lovelace est la première programmeuse de l'histoire — en 1843, soit avant l'existence des ordinateurs électroniques. Elle avait conçu un algorithme pour une machine mécanique." },
  { emoji: "🎣", fact: "\"Phishing\" vient de \"fishing\" (pêche en anglais). Les hackers \"pêchent\" vos informations avec un faux email comme appât — d'où le poisson." },
  { emoji: "📱", fact: "Il y a plus de lignes de code dans un smartphone moderne que dans tous les systèmes informatiques de la NASA des années 1970 réunis." },
  { emoji: "🌍", fact: "L'Afrique est le continent avec la croissance internet la plus rapide au monde. Entre 2000 et 2023, le taux de pénétration est passé de moins de 1% à plus de 40%." },
  { emoji: "🧠", fact: "Une IA a détecté un cancer du sein plus précisément que des médecins spécialistes dans une étude publiée en 2020 dans la revue Nature." },
  { emoji: "🎮", fact: "Le premier jeu vidéo était \"Tennis for Two\", créé en 1958 sur un oscilloscope dans un laboratoire américain — 13 ans avant Pong." },
  { emoji: "🦾", fact: "En 2016, une IA nommée AlphaGo a battu le champion du monde de Go. Ce jeu avait longtemps été considéré comme trop complexe pour les machines — 10^170 positions possibles." },
  { emoji: "🔒", fact: "95% des cyberattaques réussies sont dues à une erreur humaine, pas à une faille technique. Un clic sur un mauvais lien suffit souvent." },
  { emoji: "🐧", fact: "Linus Torvalds a créé Linux à 21 ans dans sa chambre d'étudiant en Finlande. Ce système fait aujourd'hui tourner 97% des serveurs d'Internet." },
  { emoji: "🍕", fact: "Python, l'un des langages les plus utilisés au monde, a été créé par un seul homme — Guido van Rossum — pendant ses vacances de Noël 1991. Il a choisi le nom d'après les Monty Python." },
  { emoji: "📊", fact: "90% des données mondiales ont été créées au cours des deux dernières années seulement. Nous produisons 2,5 quintillions d'octets de données par jour." },
  { emoji: "🖱️", fact: "La première souris d'ordinateur était en bois. Elle a été inventée par Doug Engelbart en 1964 et avait deux roues perpendiculaires à l'intérieur." },
  { emoji: "🌐", fact: "Le code source du premier site web au monde, créé par Tim Berners-Lee en 1991, est toujours en ligne. L'adresse est info.cern.ch." },
  { emoji: "⚡", fact: "En cybersécurité, activer la double authentification (2FA) réduit le risque de piratage de vos comptes de 99,9% selon Microsoft." },
  { emoji: "🎵", fact: "En 2023, une IA a composé une symphonie que les auditeurs ne distinguaient pas des œuvres humaines lors d'un test en aveugle à l'Université de Cambridge." },
  { emoji: "💾", fact: "Le Bitcoin consomme autant d'électricité par an que certains pays entiers. En 2023, sa consommation annuelle était comparable à celle des Pays-Bas." },
  { emoji: "🔢", fact: "Il existe plus de 700 langages de programmation dans le monde. Mais à peine une dizaine dominent vraiment : Python, JavaScript, Java, C, SQL..." },
  { emoji: "🕷️", fact: "Le premier virus informatique s'appelait \"Creeper\" — apparu en 1971, il affichait \"I'm the creeper, catch me if you can!\" sur les écrans des ordinateurs infectés." },
  { emoji: "🏆", fact: "En 1997, l'IA Deep Blue d'IBM a battu le champion du monde d'échecs Garry Kasparov. C'était la première fois qu'une machine battait un champion humain en conditions réelles." },
  { emoji: "🌑", fact: "Le dark web représente environ 5% d'Internet. Le reste — 95% — n'est pas indexé par Google. C'est ce qu'on appelle le \"deep web\" : bases de données, intranets, archives privées." },
  { emoji: "📡", fact: "Le Wi-Fi a été inventé par une équipe de scientifiques australiens dans les années 1990. À l'origine, leur technologie servait à détecter les mini trous noirs." },
  { emoji: "⏱️", fact: "Il faut en moyenne 287 jours pour détecter et contenir une cyberattaque dans une entreprise — soit plus de 9 mois pendant lesquels les hackers sont déjà à l'intérieur." },
  { emoji: "🌍", fact: "D'ici 2030, il faudra 85 millions de développeurs supplémentaires dans le monde pour répondre à la demande. C'est l'une des pénuries de talents les plus documentées de ce siècle." },
  { emoji: "📟", fact: "Le premier mobile pesait 1,1 kg. Lancé par Motorola en 1983, il valait l'équivalent de 10 000 € d'aujourd'hui. L'autonomie : 30 minutes d'appel." },
  { emoji: "🔍", fact: "Google traite plus de 8,5 milliards de recherches par jour — soit environ 100 000 requêtes chaque seconde, 24h/24." },
  { emoji: "🧩", fact: "La première connexion ARPANET (ancêtre d'Internet) en 1969 a planté après seulement 2 lettres. Le message prévu était \"login\" — seul \"lo\" est passé avant le crash." },
  { emoji: "🎨", fact: "En 2022, une image générée par une IA a remporté un concours de peinture artistique au Colorado — sans que les juges sachent qu'elle n'était pas faite par un humain." },
  { emoji: "🏗️", fact: "\"Hacker\" ne désigne pas forcément un criminel. À l'origine, c'est quelqu'un qui résout des problèmes de façon créative. Les \"white hat hackers\" sont payés pour trouver des failles avant les criminels." },
  { emoji: "☁️", fact: "Un seul datacentre de Google consomme autant d'eau par jour qu'une ville de 100 000 habitants — pour refroidir ses serveurs." },
  { emoji: "🎲", fact: "\"Spam\" en informatique vient d'un sketch des Monty Python de 1970 où le mot \"spam\" (une marque de conserve) était répété à l'infini jusqu'à noyer toute conversation." },
  { emoji: "🤯", fact: "Le nombre de combinaisons possibles dans une partie d'échecs est supérieur au nombre d'atomes dans l'univers observable. Les IA jouent pourtant mieux que n'importe quel humain." },
  { emoji: "🌱", fact: "Envoyer un email standard émet environ 4g de CO₂. Avec une pièce jointe lourde : jusqu'à 50g. Les datacentres représentent 4% des émissions mondiales de gaz à effet de serre." },
  { emoji: "🔮", fact: "La loi de Moore prédit depuis 1965 que la puissance des processeurs double tous les 2 ans. Elle a tenu pendant 50 ans — et commence seulement maintenant à atteindre ses limites physiques." },
  { emoji: "🛡️", fact: "Le plus grand vol de données de l'histoire a eu lieu en 2013 chez Yahoo : 3 milliards de comptes piratés. L'information n'a été rendue publique que 3 ans plus tard." },
  { emoji: "🧬", fact: "Des scientifiques ont réussi à stocker une vidéo dans de l'ADN synthétique. L'ADN peut théoriquement stocker 215 pétaoctets (215 millions de gigaoctets) par gramme de matière." },
];

// ── Code generation ──────────────────────────────────────────────
function genBasic(dirs: Dir[]): string {
  return dirs.map(d => `avatar.${DIR_FN[d]}()`).join("\n");
}
function genOptimized(dirs: Dir[]): string {
  if (!dirs.length) return "";
  const groups: { dir: Dir; count: number }[] = [];
  for (const d of dirs) {
    const last = groups[groups.length - 1];
    if (last?.dir === d) last.count++;
    else groups.push({ dir: d, count: 1 });
  }
  return groups
    .map(g => g.count === 1
      ? `avatar.${DIR_FN[g.dir]}()`
      : `for i in range(${g.count}):\n    avatar.${DIR_FN[g.dir]}()`)
    .join("\n");
}
function hasRepetition(dirs: Dir[]): boolean {
  for (let i = 1; i < dirs.length; i++) if (dirs[i] === dirs[i - 1]) return true;
  return false;
}

// ── Grid cell ────────────────────────────────────────────────────
function Cell({ row, col, avatarPos, path, teleportCells, phase, maze }: {
  row: number; col: number;
  avatarPos: Pos; path: Pos[]; teleportCells: Pos[]; phase: Phase;
  maze: typeof MAZES[number];
}) {
  const isAvatar   = avatarPos.row === row && avatarPos.col === col;
  const isGoal     = maze.goal.row === row && maze.goal.col === col;
  const isStart    = START.row === row && START.col === col && !isAvatar;
  const isWall     = maze.walls.has(`${row},${col}`);
  const isBooster  = maze.booster.row === row && maze.booster.col === col && !isAvatar;
  const isTeleport = !isAvatar && !isGoal && teleportCells.some(p => p.row === row && p.col === col);
  const isPath     = !isAvatar && !isGoal && !isWall && !isTeleport && path.some(p => p.row === row && p.col === col);

  if (isWall) return (
    <div className="aspect-square rounded-xl flex items-center justify-center bg-slate-700 border-2 border-slate-600">
      <span className="text-slate-500 text-lg">🧱</span>
    </div>
  );

  if (isBooster) return (
    <div className="aspect-square rounded-xl flex items-center justify-center bg-yellow-400/20 border-2 border-yellow-400/60"
      style={{ animation: "ckTwinkle 1.5s ease-in-out infinite" }}>
      <span className="text-xl">⚡</span>
    </div>
  );

  if (isTeleport) return (
    <div className="aspect-square rounded-xl flex items-center justify-center bg-yellow-300/30 border-2 border-yellow-300/70"
      style={{ animation: "ckTeleportFlash 0.6s ease-in-out infinite alternate" }}>
      <span className="text-xs text-yellow-300 font-black">✦</span>
    </div>
  );

  return (
    <div className={`
      aspect-square rounded-xl flex items-center justify-center transition-all duration-200
      ${isAvatar
        ? phase === "fail_wall" || phase === "fail_miss"
          ? "bg-rose-500/30 border-2 border-rose-400 scale-110"
          : phase === "success"
          ? "bg-explorer/30 border-2 border-explorer scale-110"
          : phase === "booster_pause"
          ? "bg-yellow-400/30 border-2 border-yellow-400 scale-110"
          : "bg-brand-amber/20 border-2 border-brand-amber scale-105"
        : isGoal
        ? "bg-brand-amber/15 border-2 border-brand-amber/60"
        : isStart
        ? "bg-white/5 border border-white/20"
        : isPath
        ? "bg-white/15 border border-white/25"
        : "bg-white/5 border border-white/10"}
    `}>
      {isAvatar
        ? <KodiAvatar size={26} />
        : isGoal ? "⭐"
        : isStart ? <span className="text-xs font-black text-white/20">S</span>
        : null}
    </div>
  );
}

// ── Booster quiz modal ───────────────────────────────────────────
function QuizModal({ questionIndex, onCorrect, onWrong }: {
  questionIndex: number; onCorrect: () => void; onWrong: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const q = QUIZ[questionIndex % QUIZ.length];

  function choose(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => { if (idx === q.correct) onCorrect(); else onWrong(); }, 800);
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-navy/80 rounded-3xl backdrop-blur-sm">
      <div className="bg-brand-blue border-2 border-yellow-400/60 rounded-2xl p-6 mx-4 max-w-xs w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⚡</span>
          <span className="text-xs font-extrabold uppercase tracking-widest text-yellow-300">Booster Cité Numérique</span>
        </div>
        <p className="text-sm font-bold text-white leading-snug mb-5">{q.question}</p>
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect  = i === q.correct;
            let cls = "w-full py-2.5 px-4 rounded-xl font-extrabold text-sm transition-all ";
            if (selected === null) cls += "bg-white/10 text-white hover:bg-white/20";
            else if (isSelected && isCorrect)   cls += "bg-explorer text-white scale-105";
            else if (isSelected && !isCorrect)  cls += "bg-rose-500 text-white";
            else if (!isSelected && isCorrect)  cls += "bg-explorer/40 text-white";
            else cls += "bg-white/5 text-white/40";
            return <button key={i} className={cls} onClick={() => choose(i)}>{opt}</button>;
          })}
        </div>
        {selected !== null && (
          <p className={`text-xs font-bold mt-3 text-center ${selected === q.correct ? "text-explorer" : "text-rose-300"}`}>
            {selected === q.correct ? "🎉 Bravo ! L'avatar file vers l'étoile !" : "❌ Pas tout à fait… Continue ton chemin."}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Celebration overlay ──────────────────────────────────────────
const FLOATERS = ["⭐","🚀","💡","🏆","🎯","✨","🎉","🌟"];

function CelebrationOverlay({ bonusXP }: { bonusXP: number }) {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none rounded-3xl overflow-hidden">
      <style>{`
        @keyframes ckCelebFloat { 0%{transform:translateY(100%) rotate(0deg);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-120%) rotate(360deg);opacity:0} }
        @keyframes ckCelebScale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes ckTeleportFlash { from{opacity:0.3} to{opacity:1} }
      `}</style>
      {FLOATERS.map((emoji, i) => (
        <span key={i} className="absolute text-2xl select-none"
          style={{ left:`${8+i*12}%`, bottom:"-10%", animation:`ckCelebFloat ${1.8+i*0.3}s ease-out ${i*0.15}s both` }}>
          {emoji}
        </span>
      ))}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-4 pt-3"
        style={{ background:"linear-gradient(to top,rgba(0,0,0,0.7),transparent)" }}>
        <div className="bg-explorer text-white text-center rounded-2xl px-5 py-3 mx-4 shadow-xl"
          style={{ animation:"ckCelebScale 1.5s ease-in-out infinite" }}>
          <p className="text-sm font-extrabold leading-tight">
            {bonusXP > 0 ? "⚡ Bravo ! La bonne réponse l'a propulsé vers l'étoile !" : "🎉 Objectif atteint !"}
          </p>
          <p className="text-xs font-bold mt-1 text-white/80">C&apos;est exactement ce que ressent votre enfant à chaque victoire.</p>
        </div>
      </div>
    </div>
  );
}

// ── Le savais-tu ? ───────────────────────────────────────────────
function DidYouKnow() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [visible, setVisible] = useState(true);

  function next() {
    setVisible(false);
    setTimeout(() => {
      setIdx(i => (i + 1) % FACTS.length);
      setVisible(true);
    }, 200);
  }

  const fact = FACTS[idx];

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" style={{ animation: "ckTwinkle 2s ease-in-out infinite" }}>💡</span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-brand-amber">Le savais-tu ?</span>
        <span className="ml-auto text-xs text-white/20 font-bold">{idx + 1}/{FACTS.length}</span>
      </div>

      <div
        className="transition-opacity duration-200 min-h-[80px]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="text-2xl block mb-2">{fact.emoji}</span>
        <p className="text-sm text-blue-100 font-bold leading-relaxed">{fact.fact}</p>
      </div>

      <button
        onClick={next}
        className="mt-4 text-xs font-extrabold text-brand-amber hover:text-white transition-colors flex items-center gap-1"
      >
        Suivant <span className="text-base leading-none">→</span>
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function MiniQuest() {
  const [mazeIdx]      = useState(() => Math.floor(Math.random() * MAZES.length));
  const maze           = MAZES[mazeIdx];

  const [instructions, setInstructions] = useState<Dir[]>([]);
  const [avatarPos,    setAvatarPos]    = useState<Pos>(START);
  const [path,         setPath]         = useState<Pos[]>([START]);
  const [teleportCells, setTeleportCells] = useState<Pos[]>([]);
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [quizIndex,    setQuizIndex]    = useState(0);
  const [bonusXP,      setBonusXP]      = useState(0);
  const [viaBooster,   setViaBooster]   = useState(false);

  const stepRef    = useRef(0);
  const posRef     = useRef<Pos>({ ...START });
  const visitedRef = useRef<Pos[]>([{ ...START }]);
  const dirsRef    = useRef<Dir[]>([]);

  function addDir(d: Dir) {
    if (phase !== "idle" || instructions.length >= MAX) return;
    setInstructions(prev => [...prev, d]);
  }

  function removeLastDir() {
    if (phase !== "idle") return;
    setInstructions(prev => prev.slice(0, -1));
  }

  function reset() {
    setInstructions([]);
    setAvatarPos(START);
    setPath([START]);
    setTeleportCells([]);
    setPhase("idle");
    setBonusXP(0);
    setViaBooster(false);
    stepRef.current    = 0;
    posRef.current     = { ...START };
    visitedRef.current = [{ ...START }];
    dirsRef.current    = [];
  }

  function resumeFrom(pos: Pos, step: number) {
    posRef.current  = { ...pos };
    stepRef.current = step;
    setPhase("running");
    setTimeout(tick, 320);
  }

  function tick() {
    const dirs = dirsRef.current;
    const step = stepRef.current;

    if (step >= dirs.length) {
      const pos = posRef.current;
      const won = pos.row === maze.goal.row && pos.col === maze.goal.col;
      setPhase(won ? "success" : "fail_miss");
      return;
    }

    const d    = dirs[step];
    const pos  = posRef.current;
    const next = { row: pos.row + DIR_DELTA[d].row, col: pos.col + DIR_DELTA[d].col };

    if (next.row < 0 || next.row >= GRID || next.col < 0 || next.col >= GRID) { setPhase("fail_wall"); return; }
    if (maze.walls.has(`${next.row},${next.col}`))                             { setPhase("fail_wall"); return; }

    posRef.current     = next;
    visitedRef.current = [...visitedRef.current, { ...next }];
    stepRef.current    = step + 1;
    setAvatarPos({ ...next });
    setPath([...visitedRef.current]);

    if (next.row === maze.booster.row && next.col === maze.booster.col) {
      setPhase("booster_pause");
      return;
    }
    setTimeout(tick, 320);
  }

  function execute() {
    if (!instructions.length || phase !== "idle") return;
    dirsRef.current    = [...instructions];
    stepRef.current    = 0;
    posRef.current     = { ...START };
    visitedRef.current = [{ ...START }];
    setAvatarPos(START);
    setPath([START]);
    setTeleportCells([]);
    setPhase("running");
    setTimeout(tick, 150);
  }

  function handleQuizCorrect() {
    setBonusXP(10);
    setViaBooster(true);
    const tp = maze.teleportPath as readonly Pos[];
    tp.forEach((cell, i) => {
      setTimeout(() => {
        setTeleportCells(prev => [...prev, cell]);
        if (i === tp.length - 1) {
          setTimeout(() => {
            setAvatarPos({ ...maze.goal });
            setPath(prev => [...prev, maze.goal]);
            setPhase("success");
          }, 200);
        }
      }, i * 120);
    });
  }

  function handleQuizWrong() {
    setQuizIndex(qi => qi + 1);
    resumeFrom(posRef.current, stepRef.current);
  }

  const basic     = genBasic(instructions);
  const optimized = genOptimized(instructions);
  const hasLoop   = hasRepetition(instructions);
  const succeeded = phase === "success";
  const boosterCodeBasic = `${basic}\n\nif avatar.atteint_booster():\n    avatar.teleporter(objectif)`;
  const boosterCodeOpt   = hasLoop ? `${optimized}\n\nif avatar.atteint_booster():\n    avatar.teleporter(objectif)` : null;

  return (
    <section className="bg-brand-blue py-20 overflow-hidden">
      <style>{`
        @keyframes ckTwinkle { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes ckTeleportFlash { from{opacity:0.3} to{opacity:1} }
      `}</style>
      <div className="max-w-7xl mx-auto px-7">

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-brand-amber mb-4">Expérience interactive</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white leading-tight">
              Essaie comme<br /><span className="text-brand-amber">ton enfant</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3 self-start md:self-auto max-w-xs">
            <KodiAvatar size={36} />
            <p className="text-sm text-blue-200 font-bold leading-snug">
              Guide l&apos;avatar jusqu&apos;à l&apos;étoile. Évite les murs 🧱 et touche le booster ⚡ pour une question bonus !
            </p>
          </div>
        </div>

        {/* Corps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Grille ── */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-300">
                Labyrinthe #{mazeIdx + 1} — <span className="text-yellow-300/70 normal-case font-bold">{maze.hint}</span>
              </span>
              <div className="flex items-center gap-3 text-xs font-bold text-blue-300">
                <span className="flex items-center gap-1"><KodiAvatar size={14} /> Avatar</span>
                <span>⭐ But</span>
                <span>🧱 Mur</span>
                <span>⚡ Bonus</span>
              </div>
            </div>

            <div className="grid gap-1.5 w-full" style={{ gridTemplateColumns:`repeat(${GRID}, 1fr)` }}>
              {Array.from({ length: GRID * GRID }).map((_, idx) => {
                const row = Math.floor(idx / GRID);
                const col = idx % GRID;
                return (
                  <Cell key={idx} row={row} col={col}
                    avatarPos={avatarPos} path={path} teleportCells={teleportCells}
                    phase={phase} maze={maze}
                  />
                );
              })}
            </div>

            {phase === "booster_pause" && (
              <QuizModal questionIndex={quizIndex} onCorrect={handleQuizCorrect} onWrong={handleQuizWrong} />
            )}
            {succeeded && <CelebrationOverlay bonusXP={bonusXP} />}

            <div className="mt-4 h-8 flex items-center">
              {phase === "fail_wall" && <p className="text-rose-300 font-bold text-sm">💥 L&apos;avatar a heurté un mur — réessaie !</p>}
              {phase === "fail_miss" && <p className="text-rose-300 font-bold text-sm">❌ Pas tout à fait… Ajuste ton chemin !</p>}
            </div>
          </div>

          {/* ── Contrôles + Le savais-tu ? ── */}
          <div className="flex flex-col gap-5">

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-300">Programme l&apos;avatar</span>
                <span className={`text-xs font-bold font-mono ${instructions.length >= MAX ? "text-rose-300" : "text-blue-300/60"}`}>
                  {instructions.length}/{MAX}
                </span>
              </div>

              {/* Pad directionnel */}
              <div className="grid grid-cols-3 gap-2 w-36 mx-auto mb-5">
                {([
                  [null,"p0"], ["U","U"],  [null,"p1"],
                  ["L","L"],  [null,"p2"], ["R","R"],
                  [null,"p3"], ["D","D"], [null,"p4"],
                ] as [Dir|null, string][]).map(([d, k]) =>
                  d ? (
                    <button key={k} onClick={() => addDir(d)} disabled={phase !== "idle"}
                      className="aspect-square bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl text-white text-xl font-black transition-all active:scale-95">
                      {DIR_ARROW[d]}
                    </button>
                  ) : <div key={k} className="aspect-square" />
                )}
              </div>

              {/* File d'instructions */}
              <div className="min-h-10 flex flex-wrap gap-1.5 mb-4">
                {instructions.length === 0 ? (
                  <span className="text-xs text-white/20 font-bold italic">Clique les flèches pour programmer…</span>
                ) : (
                  instructions.map((d, i) => (
                    <span key={i} className="w-7 h-7 flex items-center justify-center bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-sm font-black rounded-lg">
                      {DIR_ARROW[d]}
                    </span>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={execute} disabled={!instructions.length || phase !== "idle"}
                  className="flex-1 bg-brand-amber text-brand-navy font-extrabold text-sm py-3 rounded-xl hover:brightness-110 disabled:opacity-40 transition-all">
                  {phase === "running" ? "⏳ Exécution…" : phase === "booster_pause" ? "❓ Question…" : "▶ Exécuter"}
                </button>
                <button onClick={removeLastDir} disabled={phase !== "idle" || !instructions.length}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-bold rounded-xl transition-all">⌫</button>
                <button onClick={reset} disabled={phase === "running"}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-bold rounded-xl transition-all">↺</button>
              </div>
            </div>

            {/* ── Révélation du code ── */}
            {succeeded && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">💡</span>
                  <span className="text-sm font-extrabold text-white">Voici ce que tu viens de programmer :</span>
                </div>

                {viaBooster ? (
                  <div className="flex flex-col gap-3">
                    {hasLoop ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="opacity-60">
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 mb-1.5">Basique</div>
                          <pre className="bg-brand-navy rounded-xl p-3 text-[11px] text-blue-200 font-mono leading-relaxed overflow-auto max-h-40 border border-white/10">{boosterCodeBasic}</pre>
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-brand-amber mb-1.5">Optimisé ✨</div>
                          <pre className="bg-brand-navy rounded-xl p-3 text-[11px] text-brand-amber font-mono leading-relaxed overflow-auto max-h-40 border border-brand-amber/30">{boosterCodeOpt}</pre>
                        </div>
                      </div>
                    ) : (
                      <pre className="bg-brand-navy rounded-xl p-3 text-[11px] text-blue-200 font-mono leading-relaxed overflow-auto border border-white/10">{boosterCodeBasic}</pre>
                    )}
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-yellow-300 leading-snug">
                        ⚡ <strong>Le booster a introduit un `if`</strong> — en vrai code, une condition qui choisit quoi faire selon la situation. C&apos;est le cœur de tout programme intelligent.
                      </p>
                    </div>
                  </div>
                ) : hasLoop ? (
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <div className="opacity-60">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 mb-1.5">Basique</div>
                      <pre className="bg-brand-navy rounded-xl p-3 text-[11px] text-blue-200 font-mono leading-relaxed overflow-auto max-h-40 border border-white/10">{basic}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-brand-amber mb-1.5">Optimisé ✨</div>
                      <pre className="bg-brand-navy rounded-xl p-3 text-[11px] text-brand-amber font-mono leading-relaxed overflow-auto max-h-40 border border-brand-amber/30">{optimized}</pre>
                      <p className="text-[10px] text-blue-300 mt-1.5 leading-snug">
                        Les répétitions deviennent des <strong className="text-white">boucles</strong> — moins de lignes, même résultat.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-explorer mb-1.5">Code — déjà optimal ✅</div>
                    <pre className="bg-brand-navy rounded-xl p-3 text-[11px] text-explorer font-mono leading-relaxed overflow-auto max-h-40 border border-explorer/30">{basic}</pre>
                    <p className="text-[10px] text-blue-300 mt-2">Aucune répétition — ton algorithme est déjà propre !</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-amber">
                    ⚡ {bonusXP > 0 ? `+${20 + bonusXP} XP (dont ${bonusXP} bonus)` : "+20 XP gagnés"}
                  </span>
                  <button onClick={reset} className="text-xs font-bold text-blue-300 hover:text-white transition-colors">
                    Rejouer →
                  </button>
                </div>
              </div>
            )}

            {/* ── Le savais-tu ? ── */}
            <DidYouKnow />

          </div>
        </div>
      </div>
    </section>
  );
}
