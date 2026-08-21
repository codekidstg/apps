"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import type { GameConfig, Rule } from "./AtelierGame";
import CodeReveal from "./CodeReveal";
import CockpitPanel from "./CockpitPanel";

const AtelierGame = dynamic(() => import("./AtelierGame"), { ssr: false });

const AVATARS = ["🚀", "🛸", "⭐", "🌙", "🪐", "☄️"];

const THEME_OPTIONS = [
  {
    id: "space",
    emoji: "🌌",
    label: "Espace",
    desc: "Astéroïdes, étoiles filantes",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    border: "rgba(99,102,241,0.35)",
    activeBorder: "rgba(129,140,248,0.7)",
    glow: "rgba(99,102,241,0.25)",
    preview: ["⭐", "🌟", "💫"],
  },
  {
    id: "jungle",
    emoji: "🌿",
    label: "Jungle",
    desc: "Rochers mossis, feuilles",
    gradient: "linear-gradient(135deg, #052e16 0%, #14532d 100%)",
    border: "rgba(34,197,94,0.3)",
    activeBorder: "rgba(74,222,128,0.7)",
    glow: "rgba(34,197,94,0.2)",
    preview: ["🌿", "🍃", "🪨"],
  },
  {
    id: "ocean",
    emoji: "🌊",
    label: "Océan",
    desc: "Méduses, bulles sous-marines",
    gradient: "linear-gradient(135deg, #082f49 0%, #0c4a6e 100%)",
    border: "rgba(14,165,233,0.3)",
    activeBorder: "rgba(56,189,248,0.7)",
    glow: "rgba(14,165,233,0.2)",
    preview: ["🌊", "🫧", "🪸"],
  },
  {
    id: "volcano",
    emoji: "🌋",
    label: "Volcan",
    desc: "Rochers de lave, braises",
    gradient: "linear-gradient(135deg, #1c0500 0%, #431407 100%)",
    border: "rgba(249,115,22,0.3)",
    activeBorder: "rgba(251,146,60,0.7)",
    glow: "rgba(249,115,22,0.2)",
    preview: ["🌋", "🔥", "💥"],
  },
];

const STEPS = [
  { id: 0, label: "Bienvenue",        emoji: "👋" },
  { id: 1, label: "Ton prénom",       emoji: "✏️" },
  { id: 2, label: "Ton vaisseau",     emoji: "🚀" },
  { id: 3, label: "Ton univers",      emoji: "🌌" },
  { id: 4, label: "Mission Control",  emoji: "🎛️" },
  { id: 5, label: "Ton code",         emoji: "💻" },
  { id: 6, label: "À toi de jouer",   emoji: "🎮" },
  { id: 7, label: "Partager",         emoji: "🔗" },
];

type Props = {
  sessionStep: number;
  shareBase: string;
  homeHref: string;
  onSave?: (config: GameConfig, score: number) => Promise<string | null>;
  /** Repris de la leçon : seuil et cadeau choisis par l'enfant, vaisseau de la manche 1. */
  seuil?: number;
  cadeau?: string;
  vaisseau?: string;
};

export default function AtelierClient({ sessionStep, shareBase, homeHref, onSave, seuil, cadeau, vaisseau }: Props) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "fr";
  const [step, setStep]               = useState(0);
  const [name, setName]               = useState("");
  // Le vaisseau choisi en manche 1 est repris ; l'enfant reste libre d'en changer.
  const [avatar, setAvatar]           = useState(vaisseau || "🚀");
  const [theme, setTheme]             = useState("space");
  const [speed, setSpeed]             = useState(3);
  const [obstacles, setObstacles]     = useState(3);
  const [obstacleSize, setObstacleSize] = useState(2);
  const [rules, setRules]             = useState<Rule[]>([
    { id: "collision", condition: "collision", action: "lose_life" },
    { id: "no_lives",  condition: "no_lives",  action: "game_over" },
    { id: "loop",      condition: "loop",      action: "continue"  },
  ]);
  const [codeReady, setCodeReady] = useState(false);
  const [score, setScore]         = useState(0);
  const [shareId, setShareId]     = useState<string | null>(null);
  const [shareError, setShareError] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [stars, setStars]         = useState<{ x: number; y: number; s: number; o: number }[]>([]);

  const config: GameConfig = { avatar, name, speed, obstacles, obstacleSize, theme, rules };

  useEffect(() => {
    setStars(Array.from({ length: 80 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      s: Math.random() * 2 + 0.5, o: Math.random() * 0.7 + 0.3,
    })));
  }, []);

  useEffect(() => {
    if (sessionStep > step) setStep(prev => Math.min(prev + 1, sessionStep));
  }, [sessionStep]);

  function canAdvance() {
    if (step === 1 && name.trim().length < 2) return false;
    return step < Math.min(sessionStep, STEPS.length - 1);
  }

  function next() { if (canAdvance()) setStep(s => s + 1); }
  function prev() { if (step > 0 && step < 7) setStep(s => s - 1); }

  async function handleSave(finalScore: number) {
    if (saving || shareId) return;
    setSaving(true);
    try {
      const id = await onSave?.(config, finalScore);
      if (id) setShareId(id); else setShareError(true);
    } catch { setShareError(true); }
    setSaving(false);
    setStep(7);
  }

  const shareUrl = shareId ? `${shareBase}/fr/atelier/partage/${shareId}` : null;

  // ─── STEPS ────────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {

      // ── 0 : Bienvenue ──
      case 0:
        return (
          <div className="flex flex-col items-center gap-8 text-center py-8">
            <div className="text-6xl animate-bounce">🌌</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                Bienvenue, futur<br />
                <span className="text-orange-400">développeur</span>
              </h1>
              <p className="text-slate-400 mt-3 max-w-sm mx-auto">
                Dans <strong className="text-white">60 minutes</strong>, tu auras créé un jeu vidéo que{" "}
                <strong className="text-white">99% des adultes</strong> dans cette salle ne savent pas faire.
              </p>
            </div>
            {sessionStep >= 1 ? (
              <button onClick={next}
                className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                Je suis prêt →
              </button>
            ) : (
              <div className="text-slate-500 text-sm flex items-center gap-2">⏳ Attends le signal du mentor</div>
            )}
          </div>
        );

      // ── 1 : Prénom ──
      case 1:
        return (
          <div className="flex flex-col items-center gap-8 text-center py-6">
            <div className="text-5xl">✏️</div>
            <div>
              <h2 className="text-2xl font-black text-white">Comment tu t'appelles ?</h2>
              <p className="text-slate-400 mt-2 text-sm">Ton prénom apparaîtra sur ton jeu et ton certificat.</p>
            </div>
            <div className="w-full max-w-xs">
              <input autoFocus type="text" placeholder="Ton prénom..." value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canAdvance() && next()}
                className="w-full bg-slate-800 border-2 border-slate-600 focus:border-orange-500 rounded-2xl px-5 py-4 text-white text-xl text-center font-bold outline-none transition-colors"
                maxLength={20} />
              {name.length >= 2 && (
                <div className="mt-3 text-slate-400 text-sm">
                  Bienvenue, <strong className="text-orange-400">{name}</strong> ! 🌟
                </div>
              )}
            </div>
            <button onClick={next} disabled={!canAdvance()}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black rounded-full text-lg transition-all hover:scale-105">
              Continuer →
            </button>
          </div>
        );

      // ── 2 : Vaisseau ──
      case 2:
        return (
          <div className="flex flex-col items-center gap-8 text-center py-6">
            <div>
              <h2 className="text-2xl font-black text-white">Choisis ton vaisseau</h2>
              <p className="text-slate-400 mt-2 text-sm">C'est ton personnage. Il apparaîtra dans le jeu.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {AVATARS.map(av => (
                <button key={av} onClick={() => setAvatar(av)}
                  className={`w-20 h-20 rounded-2xl text-4xl flex items-center justify-center transition-all border-2 ${
                    avatar === av
                      ? "border-orange-500 bg-orange-500/20 scale-110 shadow-lg shadow-orange-500/30"
                      : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:scale-105"
                  }`}>
                  {av}
                </button>
              ))}
            </div>
            <div className="text-slate-400 text-sm">Tu as choisi : <strong className="text-white text-2xl">{avatar}</strong></div>
            <button onClick={next} disabled={!canAdvance()}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-full text-lg transition-all hover:scale-105">
              C'est parti →
            </button>
          </div>
        );

      // ── 3 : Univers (thème visuel uniquement) ──
      case 3:
        return (
          <div className="flex flex-col gap-8 py-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Choisis ton univers</h2>
              <p className="text-slate-400 mt-2 text-sm">Le décor de ton jeu. Chaque univers a ses propres obstacles.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {THEME_OPTIONS.map(t => {
                const active = theme === t.id;
                return (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className="flex flex-col gap-3 p-5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: t.gradient,
                      border: `2px solid ${active ? t.activeBorder : t.border}`,
                      boxShadow: active ? `0 0 24px ${t.glow}, 0 4px 16px rgba(0,0,0,0.4)` : "0 4px 16px rgba(0,0,0,0.3)",
                    }}>
                    {/* Preview emoji */}
                    <div className="flex items-center gap-1 text-xl">
                      {t.preview.map((e, i) => (
                        <span key={i} style={{ opacity: 1 - i * 0.25 }}>{e}</span>
                      ))}
                    </div>
                    <div>
                      <div className="text-base font-black text-white">{t.emoji} {t.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{t.desc}</div>
                    </div>
                    {active && (
                      <div className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full self-start"
                        style={{ background: t.activeBorder, color: "#030712" }}>
                        ✓ SÉLECTIONNÉ
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={next} disabled={!canAdvance()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-2xl text-lg transition-all hover:scale-[1.02]">
              Parfait →
            </button>
          </div>
        );

      // ── 4 : Mission Control (cockpit) ──
      case 4:
        return (
          <div className="flex flex-col gap-4 py-2">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Programme ton vaisseau</h2>
              <p className="text-slate-400 mt-2 text-sm">
                Règle les paramètres et active tes règles. Comme un vrai développeur.
              </p>
            </div>
            <CockpitPanel
              playerName={name}
              speed={speed} setSpeed={setSpeed}
              obstacles={obstacles} setObstacles={setObstacles}
              obstacleSize={obstacleSize} setObstacleSize={setObstacleSize}
              rules={rules} setRules={setRules}
              onLaunch={next}
              defaultThreshold={seuil}
              cadeau={cadeau}
            />
          </div>
        );

      // ── 5 : Code reveal ──
      case 5:
        return (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Regarde ce que tu viens d'écrire</h2>
              <p className="text-slate-400 mt-2 text-sm">
                Tes règles en français… <strong className="text-orange-400">traduites en JavaScript</strong>.
              </p>
            </div>
            <CodeReveal rules={rules} playerName={name} onDone={() => setCodeReady(true)} />
            {codeReady && (
              <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-emerald-300 font-black">Tu viens d'écrire ton premier algorithme !</div>
                <div className="text-sm text-emerald-500 mt-1">La machine a compris exactement ce que tu voulais.</div>
              </div>
            )}
            {codeReady && (
              <button onClick={next} disabled={!canAdvance()}
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-2xl text-lg transition-all">
                Lancer mon jeu →
              </button>
            )}
          </div>
        );

      // ── 6 : Jeu ──
      case 6:
        return (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center">
              <div className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">🎮 Ton jeu</div>
              <h2 className="text-2xl font-black text-white">{name ? `${name}'s Game` : "Mon Jeu"}</h2>
              <p className="text-slate-400 text-sm mt-1">Créé par toi · Tes règles · Ton vaisseau {avatar}</p>
            </div>
            <AtelierGame
              config={config}
              onScore={setScore}
              onGameOver={async (s) => { setScore(s); await handleSave(s); }}
            />
            <div className="text-center text-xs text-slate-500">
              Flèches ↑↓ pour esquiver · Glisse sur mobile
            </div>
          </div>
        );

      // ── 7 : Partage ──
      case 7:
        return (
          <div className="flex flex-col items-center gap-8 text-center py-6">
            <div className="text-6xl">🏆</div>
            <div>
              <h2 className="text-2xl font-black text-white">Félicitations, {name} !</h2>
              <p className="text-slate-400 mt-2">Score : <strong className="text-orange-400 text-xl">{score} pts</strong></p>
              <p className="text-slate-500 text-sm mt-1">Tu viens de créer ton premier jeu vidéo.</p>
            </div>

            {shareUrl ? (
              <div className="w-full max-w-sm space-y-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                  <div className="text-sm font-bold text-white mb-3">📲 Envoie ce lien à tes parents</div>
                  <div className="bg-slate-900 rounded-xl px-4 py-3 text-xs text-orange-400 font-mono break-all text-left">
                    {shareUrl}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="w-full mt-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors">
                    📋 Copier le lien
                  </button>
                </div>
                <div className="bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-700/40 rounded-2xl p-5">
                  <div className="text-3xl mb-2">{avatar}</div>
                  <div className="font-black text-white">{name}</div>
                  <div className="text-xs text-orange-400 mt-1">🏅 Cosmic Coder · CodeKids {new Date().getFullYear()}</div>
                  <div className="text-xs text-slate-500 mt-2">Score : {score} pts · {new Date().toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
            ) : saving ? (
              <div className="text-slate-400 text-sm animate-pulse">Génération de ton lien…</div>
            ) : shareError ? (
              <div className="space-y-4 w-full max-w-sm">
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 text-sm text-slate-300">
                  Le lien n'a pas pu être généré, mais ton jeu existe.
                  Score : <strong className="text-orange-400">{score} pts</strong>
                </div>
                <div className="bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-700/40 rounded-2xl p-5">
                  <div className="text-3xl mb-2">{avatar}</div>
                  <div className="font-black text-white">{name}</div>
                  <div className="text-xs text-orange-400 mt-1">🏅 Cosmic Coder · CodeKids {new Date().getFullYear()}</div>
                  <div className="text-xs text-slate-500 mt-2">Score : {score} pts · {new Date().toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm animate-pulse">Génération de ton lien…</div>
            )}
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden">
      {/* Étoiles fond */}
      <div className="fixed inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-pulse"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o,
              animationDelay: `${i * 0.1 % 3}s`, animationDuration: `${2 + (i % 3)}s` }} />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href={homeHref}
            className="text-slate-500 hover:text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
            title="Retour à l'accueil">
            🏠
          </Link>
          {step > 0 && step < 7 && (
            <button onClick={prev}
              className="text-slate-500 hover:text-white text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-all">
              ← Retour
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-black text-white text-sm">CodeKids Atelier</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.slice(1).map((s, i) => (
            <div key={s.id} className={`w-2 h-2 rounded-full transition-all ${
              step > i + 1 ? "bg-emerald-500" : step === i + 1 ? "bg-orange-500 scale-125" : "bg-slate-700"
            }`} />
          ))}
        </div>
        {name && <div className="text-xs text-slate-500 font-bold">{avatar} {name}</div>}
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span>{STEPS[step]?.emoji}</span>
          <span>Étape {step + 1}/{STEPS.length} — {STEPS[step]?.label}</span>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
