"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { GameConfig, Rule } from "./AtelierGame";
import AtelierBlocks from "./AtelierBlocks";
import CodeReveal from "./CodeReveal";

const AtelierGame = dynamic(() => import("./AtelierGame"), { ssr: false });

const AVATARS = ["🚀", "🛸", "⭐", "🌙", "🪐", "☄️"];

const STEPS = [
  { id: 0, label: "Bienvenue",      emoji: "👋" },
  { id: 1, label: "Ton prénom",     emoji: "✏️" },
  { id: 2, label: "Ton vaisseau",   emoji: "🚀" },
  { id: 3, label: "Ton univers",    emoji: "🌌" },
  { id: 4, label: "Tes règles",     emoji: "📋" },
  { id: 5, label: "Ton code",       emoji: "💻" },
  { id: 6, label: "À toi de jouer", emoji: "🎮" },
  { id: 7, label: "Partager",       emoji: "🔗" },
];

type Props = {
  sessionStep: number;        // étape débloquée par le mentor
  shareBase: string;          // ex: "https://codekids.tg"
  onSave?: (config: GameConfig, score: number) => Promise<string | null>; // retourne shareId
};

export default function AtelierClient({ sessionStep, shareBase, onSave }: Props) {
  const [step, setStep]           = useState(0);
  const [name, setName]           = useState("");
  const [avatar, setAvatar]       = useState("🚀");
  const [speed, setSpeed]         = useState(3);
  const [obstacles, setObstacles] = useState(3);
  const [gravity, setGravity]     = useState(2);
  const [rules, setRules]         = useState<Rule[]>([
    { id: "collision", condition: "collision", action: "lose_life" },
    { id: "no_lives",  condition: "no_lives",  action: "game_over" },
    { id: "loop",      condition: "loop",      action: "continue"  },
  ]);
  const [codeReady, setCodeReady] = useState(false);
  const [score, setScore]         = useState(0);
  const [shareId, setShareId]     = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [stars, setStars]         = useState<{ x: number; y: number; s: number; o: number }[]>([]);

  const config: GameConfig = { avatar, name, speed, obstacles, gravity, rules };

  // Étoiles fond
  useEffect(() => {
    setStars(Array.from({ length: 80 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      s: Math.random() * 2 + 0.5, o: Math.random() * 0.7 + 0.3,
    })));
  }, []);

  // Avancer selon session mentor
  useEffect(() => {
    if (sessionStep > step) setStep(prev => Math.min(prev + 1, sessionStep));
  }, [sessionStep]);

  function canAdvance() {
    if (step === 1 && name.trim().length < 2) return false;
    return step < Math.min(sessionStep, STEPS.length - 1);
  }

  function next() { if (canAdvance()) setStep(s => s + 1); }

  async function handleSave(finalScore: number) {
    if (saving || shareId) return;
    setSaving(true);
    try {
      const id = await onSave?.(config, finalScore);
      setShareId(id ?? null);
    } catch {
      // Sauvegarde échouée → on avance quand même
    }
    setSaving(false);
    setStep(7);
  }

  const shareUrl = shareId ? `${shareBase}/fr/atelier/partage/${shareId}` : null;

  // ─── STEP RENDERERS ───────────────────────────────────────────────────────

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
                Dans <strong className="text-white">60 minutes</strong>, tu auras créé un jeu vidéo que <strong className="text-white">99% des adultes</strong> dans cette salle ne savent pas faire.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">⏳ <span>Attends le signal du mentor pour commencer</span></div>
            </div>
            {sessionStep >= 1 && (
              <button onClick={next} className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                Je suis prêt →
              </button>
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
              <input
                autoFocus
                type="text"
                placeholder="Ton prénom..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canAdvance() && next()}
                className="w-full bg-slate-800 border-2 border-slate-600 focus:border-orange-500 rounded-2xl px-5 py-4 text-white text-xl text-center font-bold outline-none transition-colors"
                maxLength={20}
              />
              {name.length >= 2 && (
                <div className="mt-3 text-slate-400 text-sm animate-fade-in">
                  Bienvenue, <strong className="text-orange-400">{name}</strong> ! 🌟
                </div>
              )}
            </div>
            <button
              onClick={next}
              disabled={!canAdvance()}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black rounded-full text-lg transition-all hover:scale-105"
            >
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
              <p className="text-slate-400 mt-2 text-sm">C'est ton personnage. Il sera unique dans ton jeu.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-20 h-20 rounded-2xl text-4xl flex items-center justify-center transition-all border-2 ${
                    avatar === av
                      ? "border-orange-500 bg-orange-500/20 scale-110 shadow-lg shadow-orange-500/30"
                      : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:scale-105"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
            <div className="text-slate-400 text-sm">Tu as choisi : <strong className="text-white text-xl">{avatar}</strong></div>
            <button onClick={next} disabled={!canAdvance()} className="px-8 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-full text-lg transition-all hover:scale-105">
              C'est parti →
            </button>
          </div>
        );

      // ── 3 : Univers ──
      case 3:
        return (
          <div className="flex flex-col gap-8 py-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Configure ton univers</h2>
              <p className="text-slate-400 mt-2 text-sm">Ces paramètres définissent les règles physiques de ton jeu.</p>
            </div>
            <div className="space-y-6">
              {[
                { label: "Vitesse des astéroïdes", emoji: "⚡", value: speed, set: setSpeed, desc: ["Très lent", "Lent", "Normal", "Rapide", "Fulgurant"] },
                { label: "Densité des obstacles", emoji: "☄️", value: obstacles, set: setObstacles, desc: ["Vide", "Peu", "Normal", "Dense", "Extreme"] },
                { label: "Gravité", emoji: "🌍", value: gravity, set: setGravity, desc: ["Zéro-G", "Lunaire", "Terrestre", "Joviale", "Écrasante"] },
              ].map(({ label, emoji, value, set, desc }) => (
                <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold text-white">{emoji} {label}</div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-500/20 text-orange-400">{desc[value - 1]}</span>
                  </div>
                  <input
                    type="range" min={1} max={5} value={value}
                    onChange={e => set(parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>{desc[0]}</span><span>{desc[4]}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={next} disabled={!canAdvance()} className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-2xl text-lg transition-all hover:scale-[1.02]">
              Parfait, on continue →
            </button>
          </div>
        );

      // ── 4 : Règles ──
      case 4:
        return (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Écris les règles de ton jeu</h2>
              <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto">
                Ces instructions s'appellent un <strong className="text-orange-400">algorithme</strong>. Tu vas apprendre ce mot ce soir.
              </p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-start gap-2">
              <span className="text-base shrink-0">💡</span>
              <span>Clique sur une règle pour l'activer ou la désactiver. Les règles actives seront dans ton jeu.</span>
            </div>
            <AtelierBlocks rules={rules} onChange={setRules} />
            <div className="text-center text-xs text-slate-500">
              {rules.length} règle{rules.length > 1 ? "s" : ""} activée{rules.length > 1 ? "s" : ""}
            </div>
            <button onClick={next} disabled={!canAdvance() || rules.length === 0} className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-2xl text-lg transition-all">
              Mes règles sont prêtes →
            </button>
          </div>
        );

      // ── 5 : Code reveal ──
      case 5:
        return (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">Regarde ce que tu viens d'écrire</h2>
              <p className="text-slate-400 mt-2 text-sm">
                Tes règles en français… <strong className="text-orange-400">traduites en JavaScript</strong>. La langue des machines.
              </p>
            </div>
            <CodeReveal rules={rules} playerName={name} onDone={() => setCodeReady(true)} />
            {codeReady && (
              <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 text-center animate-fade-in">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-emerald-300 font-black">Tu viens d'écrire ton premier algorithme !</div>
                <div className="text-sm text-emerald-500 mt-1">La machine a compris exactement ce que tu voulais.</div>
              </div>
            )}
            {codeReady && (
              <button onClick={next} disabled={!canAdvance()} className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-2xl text-lg transition-all">
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
              <h2 className="text-2xl font-black text-white">{name ? `${name}'s Space` : "Mon Jeu"}</h2>
              <p className="text-slate-400 text-sm mt-1">Créé par toi. Tes règles. Ton vaisseau.</p>
            </div>
            <AtelierGame
              config={config}
              onScore={setScore}
              onGameOver={async (s) => { setScore(s); await handleSave(s); }}
            />
            <div className="text-center text-xs text-slate-500">
              Espace / Clic / Tap pour faire voler {avatar}
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
                  <div className="bg-slate-900 rounded-xl px-4 py-3 text-xs text-orange-400 font-mono break-all">
                    {shareUrl}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="w-full mt-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    📋 Copier le lien
                  </button>
                </div>

                {/* Badge */}
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
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o,
              animationDelay: `${i * 0.1 % 3}s`, animationDuration: `${2 + (i % 3)}s` }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-black text-white text-sm">CodeKids Atelier</span>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.slice(1).map((s, i) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all ${
                step > i + 1 ? "bg-emerald-500" : step === i + 1 ? "bg-orange-500 scale-125" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        {name && <div className="text-xs text-slate-500 font-bold">{avatar} {name}</div>}
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Étiquette étape */}
        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span>{STEPS[step]?.emoji}</span>
          <span>Étape {step + 1}/{STEPS.length} — {STEPS[step]?.label}</span>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
