"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const STEP_LABELS = [
  { emoji: "👋", label: "Bienvenue",       desc: "Page d'accueil — attendre que tout le monde soit prêt" },
  { emoji: "✏️", label: "Prénom",          desc: "Chaque enfant saisit son prénom" },
  { emoji: "🚀", label: "Vaisseau",        desc: "Choix du personnage" },
  { emoji: "🌌", label: "Univers",         desc: "Configuration vitesse / obstacles / gravité" },
  { emoji: "📋", label: "Algorithme",      desc: "L'enfant active ses règles de jeu" },
  { emoji: "💻", label: "Code reveal",     desc: "Animation : les règles deviennent du vrai code" },
  { emoji: "🎮", label: "Jeu",             desc: "Lancement du jeu — les parents peuvent jouer via QR" },
  { emoji: "🔗", label: "Partage",         desc: "Badge final + lien partageable" },
];

type Player = { id: string; name: string; avatar: string; score: number; share_id: string; created_at: string };

type Props = { sessionCode: string };

export default function AnimateurClient({ sessionCode }: Props) {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [players, setPlayers]         = useState<Player[]>([]);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [creating, setCreating]       = useState(false);
  const [advancing, setAdvancing]     = useState(false);

  // Charger ou créer la session
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("atelier_sessions") as any)
        .select("id, current_step")
        .eq("code", sessionCode)
        .maybeSingle();
      if (data) {
        setSessionId(data.id);
        setCurrentStep(data.current_step);
      }
    })();
  }, [sessionCode]);

  // Realtime players
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("atelier_players") as any)
        .select("id, name, avatar, score, share_id, created_at")
        .eq("session_code", sessionCode)
        .order("created_at");
      setPlayers(data ?? []);
    })();

    const channel = supabase
      .channel(`players:${sessionCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "atelier_players", filter: `session_code=eq.${sessionCode}` },
        () => {
          (supabase.from("atelier_players") as any)
            .select("id, name, avatar, score, share_id, created_at")
            .eq("session_code", sessionCode)
            .order("created_at")
            .then(({ data }: any) => setPlayers(data ?? []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionCode]);

  // Realtime session step
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "atelier_sessions", filter: `id=eq.${sessionId}` },
        (payload: any) => setCurrentStep(payload.new.current_step)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  async function createSession() {
    setCreating(true);
    const { data } = await (supabase.from("atelier_sessions") as any)
      .insert({ code: sessionCode, current_step: 0 })
      .select("id")
      .single();
    if (data) setSessionId(data.id);
    setCreating(false);
  }

  async function advance() {
    if (!sessionId || advancing) return;
    setAdvancing(true);
    const next = Math.min(currentStep + 1, STEP_LABELS.length - 1);
    await (supabase.from("atelier_sessions") as any)
      .update({ current_step: next })
      .eq("id", sessionId);
    setCurrentStep(next);
    setAdvancing(false);
  }

  async function back() {
    if (!sessionId || currentStep === 0) return;
    const prev = currentStep - 1;
    await (supabase.from("atelier_sessions") as any)
      .update({ current_step: prev })
      .eq("id", sessionId);
    setCurrentStep(prev);
  }

  const playerUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/fr/atelier?session=${sessionCode}`;
  const step = STEP_LABELS[currentStep];

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center space-y-4 max-w-sm w-full">
          <div className="text-4xl">🎓</div>
          <h2 className="text-xl font-black text-white">Session <span className="text-orange-400">{sessionCode}</span></h2>
          <p className="text-sm text-slate-400">Aucune session trouvée. Créer une nouvelle session ?</p>
          <button onClick={createSession} disabled={creating}
            className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black rounded-xl transition-colors">
            {creating ? "Création…" : "Créer la session →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <div className="font-black text-white">Tableau de bord Mentor</div>
            <div className="text-xs text-slate-400">Session <span className="text-orange-400 font-mono font-bold">{sessionCode}</span> · {players.length} participant{players.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-bold">Live</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
        {/* Colonne gauche — contrôles */}
        <div className="space-y-4">
          {/* Étape courante */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Étape courante</div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-700/40 flex items-center justify-center text-3xl">
                {step.emoji}
              </div>
              <div>
                <div className="text-lg font-black text-white">{step.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Étape {currentStep + 1} / {STEP_LABELS.length}</span>
                <span>{Math.round((currentStep / (STEP_LABELS.length - 1)) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / (STEP_LABELS.length - 1)) * 100}%` }} />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3">
              <button onClick={back} disabled={currentStep === 0}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold rounded-xl transition-colors text-sm">
                ← Retour
              </button>
              <button onClick={advance} disabled={advancing || currentStep === STEP_LABELS.length - 1}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 text-white font-black rounded-xl transition-colors text-sm">
                {advancing ? "…" : "Suivant →"}
              </button>
            </div>
          </div>

          {/* Toutes les étapes */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-2">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Progression</div>
            {STEP_LABELS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                i === currentStep ? "bg-orange-500/20 border border-orange-700/40" :
                i < currentStep  ? "text-slate-500" : "text-slate-600"
              }`}>
                <span className={i <= currentStep ? "opacity-100" : "opacity-30"}>{s.emoji}</span>
                <span className={`font-bold ${i === currentStep ? "text-orange-400" : i < currentStep ? "text-slate-400 line-through" : "text-slate-600"}`}>
                  {s.label}
                </span>
                {i < currentStep && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
                {i === currentStep && <span className="ml-auto text-orange-400 text-xs font-black">EN COURS</span>}
              </div>
            ))}
          </div>

          {/* Lien enfants */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Lien pour les enfants</div>
            <div className="bg-slate-800 rounded-xl px-3 py-2 text-xs text-orange-400 font-mono break-all">{playerUrl}</div>
            <button onClick={() => navigator.clipboard.writeText(playerUrl)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors">
              📋 Copier le lien
            </button>
          </div>
        </div>

        {/* Colonne droite — participants */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Participants</div>
            <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{players.length}</span>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-sm">En attente des participants…</div>
              <div className="text-xs mt-1">Ils rejoindront dès qu'ils ouvrent le lien</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {players.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <div className="font-bold text-white text-sm">{p.name || "—"}</div>
                      <div className="text-xs text-slate-500">{p.score > 0 ? `${p.score} pts` : "En jeu…"}</div>
                    </div>
                  </div>
                  {p.share_id && (
                    <a
                      href={`/fr/atelier/partage/${p.share_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-400 hover:text-orange-300 font-bold"
                    >
                      Voir →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
