"use client";
import dynamic from "next/dynamic";
import type { GameConfig } from "../../AtelierGame";

const AtelierGame = dynamic(() => import("../../AtelierGame"), { ssr: false });

type Props = {
  player: { name: string; avatar: string; config: GameConfig; score: number; created_at: string };
  shareId: string;
};

export default function ShareGameClient({ player, shareId }: Props) {
  const config: GameConfig = {
    ...player.config,
    avatar: player.avatar,
    name: player.name,
  };

  const date = new Date(player.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center px-4 py-10 gap-8">
      {/* Badge créateur */}
      <div className="text-center space-y-2">
        <div className="text-5xl">{player.avatar}</div>
        <h1 className="text-2xl font-black text-white">
          {player.name ? `${player.name}'s Space` : "Cosmic Game"}
        </h1>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-700/40">
            🏅 Cosmic Coder
          </span>
          <span className="text-xs text-slate-500">Créé le {date}</span>
        </div>
        {player.score > 0 && (
          <div className="text-slate-400 text-sm">
            Record personnel : <strong className="text-orange-400">{player.score} pts</strong>
          </div>
        )}
      </div>

      {/* Le jeu */}
      <div className="w-full max-w-xl">
        <AtelierGame config={config} />
      </div>

      {/* Algorithme derrière */}
      <div className="w-full max-w-xl bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
          💡 Les règles que {player.name} a programmées
        </div>
        <div className="space-y-2">
          {(player.config?.rules ?? []).map((r: any) => {
            const LABELS: Record<string, string> = {
              collision:   "💥 SI touche astéroïde → perdre une vie",
              score_boost: `⚡ SI score > ${r.value ?? 50} → les astéroïdes vont plus vite`,
              no_lives:    "☠️ SI plus de vies → GAME OVER",
              loop:        "🔄 TANT QUE vies > 0 → continuer le jeu",
            };
            return (
              <div key={r.id} className="text-sm text-slate-300 bg-slate-900/50 rounded-xl px-3 py-2 font-mono">
                {LABELS[r.condition] ?? r.condition}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2 italic">
          Cet algorithme a été écrit par {player.name} lors de l'Atelier CodeKids — sans jamais toucher à du code.
        </p>
      </div>

      {/* CTA parent */}
      <div className="w-full max-w-xl bg-gradient-to-br from-orange-950/60 to-slate-900 border border-orange-700/40 rounded-2xl p-6 text-center space-y-3">
        <div className="text-2xl">🚀</div>
        <div className="font-black text-white">Votre enfant a créé ça en 1 heure.</div>
        <p className="text-sm text-slate-400">
          Imaginez ce qu'il peut construire en 6 mois avec CodeKids.
        </p>
        <a
          href="https://codekids.tg"
          className="inline-block mt-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-sm transition-all hover:scale-105"
        >
          Découvrir CodeKids →
        </a>
      </div>
    </div>
  );
}
