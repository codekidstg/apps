"use client";
import { useState, useTransition } from "react";
import AvatarSvg from "@/components/eleve/AvatarSvg";
import { saveAvatar } from "../actions";

const BASES = [
  { id: "robot_blue",   name: "NEXUS-7",    unlockAt: 0,    emoji: "🔵", desc: "Unité de base" },
  { id: "robot_orange", name: "VULCAN-X",   unlockAt: 500,  emoji: "🔴", desc: "Modèle combat" },
  { id: "robot_green",  name: "BIO-ALPHA",  unlockAt: 1500, emoji: "🟢", desc: "Nano-organique" },
  { id: "robot_gold",   name: "AURUM-∞",    unlockAt: 3000, emoji: "🟡", desc: "Prototype légendaire" },
];
const HATS = [
  { id: "",           name: "Aucun",       unlockAt: 0,   icon: "⬜" },
  { id: "hat_cap",    name: "Casquette",   unlockAt: 0,   icon: "🧢" },
  { id: "hat_wizard", name: "Chapeau Mage",unlockAt: 500, icon: "🧙" },
  { id: "hat_crown",  name: "Couronne",    unlockAt: 3000,icon: "👑" },
];
const ACCESSORIES = [
  { id: "",          name: "Aucun", unlockAt: 0,    icon: "❌" },
  { id: "acc_wings", name: "Ailes", unlockAt: 1500, icon: "🦋" },
];
const COLORS = [
  { hex: "#3b82f6", name: "Plasma" },
  { hex: "#f97316", name: "Inferno" },
  { hex: "#10b981", name: "Matrix" },
  { hex: "#f59e0b", name: "Solar" },
  { hex: "#8b5cf6", name: "Void" },
  { hex: "#ec4899", name: "Neon" },
  { hex: "#06b6d4", name: "Cryo" },
  { hex: "#ef4444", name: "Danger" },
  { hex: "#64748b", name: "Stealth" },
  { hex: "#ffffff", name: "Ghost" },
];

type Props = {
  xp: number;
  level?: number;
  name?: string;
  initial: { base: string; hat: string | null; accessory: string | null; color: string };
};

type Tab = "model" | "hat" | "accessory" | "color";

export default function AvatarClient({ xp, level = 1, name = "Joueur", initial }: Props) {
  const [base, setBase]           = useState(initial.base ?? "robot_blue");
  const [hat, setHat]             = useState(initial.hat ?? "");
  const [accessory, setAccessory] = useState(initial.accessory ?? "");
  const [color, setColor]         = useState(initial.color ?? "#3b82f6");
  const [saved, setSaved]         = useState(false);
  const [tab, setTab]             = useState<Tab>("model");
  const [isPending, start]        = useTransition();

  const isUnlocked = (at: number) => xp >= at;
  const currentBase = BASES.find(b => b.id === base) ?? BASES[0];
  const currentColor = COLORS.find(c => c.hex === color) ?? COLORS[0];

  function handleSave() {
    const fd = new FormData();
    fd.append("base", base); fd.append("hat", hat);
    fd.append("accessory", accessory); fd.append("color", color);
    start(async () => { await saveAvatar(fd); setSaved(true); setTimeout(() => setSaved(false), 3000); });
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "model",     label: "Modèle",     icon: "🤖" },
    { id: "hat",       label: "Coiffe",      icon: "🎩" },
    { id: "accessory", label: "Accessoire",  icon: "⚡" },
    { id: "color",     label: "Couleur",     icon: "🎨" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ── Scanline overlay ── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)" }} />

      {/* ── Top HUD bar ── */}
      <div className="relative z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-brand-orange text-xs font-black tracking-[0.2em] uppercase">◈ Personnalisation</span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs font-mono">
          <span className="text-slate-500">XP</span>
          <span className="text-brand-orange font-black">{xp.toLocaleString()}</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">LV</span>
          <span className="text-emerald-400 font-black">{level}</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-[calc(100vh-53px)]">

        {/* ══ LEFT — Avatar display ════════════════════════════════════════ */}
        <div className="lg:w-[420px] shrink-0 flex flex-col items-center justify-center p-8 relative border-r border-slate-800/60">
          {/* Background grid */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

          {/* Corner brackets */}
          {[["top-4 left-4","border-t-2 border-l-2"],["top-4 right-4","border-t-2 border-r-2"],
            ["bottom-4 left-4","border-b-2 border-l-2"],["bottom-4 right-4","border-b-2 border-r-2"]
          ].map(([pos, border], i) => (
            <div key={i} className={`absolute ${pos} ${border} border-slate-600 w-8 h-8`} />
          ))}

          {/* Avatar ring */}
          <div className="relative mb-6">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full blur-xl opacity-40 scale-110"
              style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
            {/* Rotating dashed ring */}
            <div className="absolute inset-[-16px] rounded-full border-2 border-dashed opacity-30 animate-spin"
              style={{ borderColor: color, animationDuration: "12s" }} />
            {/* Static ring */}
            <div className="absolute inset-[-8px] rounded-full border opacity-20"
              style={{ borderColor: color }} />

            {/* Avatar container */}
            <div className="relative w-56 h-56 flex items-center justify-center rounded-full"
              style={{ background: `radial-gradient(circle at 40% 30%, ${color}22, #0f172a 70%)`, boxShadow: `0 0 40px ${color}33, inset 0 0 30px rgba(0,0,0,0.5)` }}>
              <AvatarSvg base={base} hat={hat || null} accessory={accessory || null} color={color} size={180} animated />
            </div>
          </div>

          {/* Identity card */}
          <div className="w-full max-w-xs bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 backdrop-blur mb-5"
            style={{ boxShadow: `0 0 20px ${color}15` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-slate-500 font-mono tracking-widest uppercase">Unité</div>
                <div className="font-black text-lg text-white">{name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-mono tracking-widest uppercase">Modèle</div>
                <div className="font-black text-sm" style={{ color }}>{currentBase.name}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">Couleur active</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: color }} />
                <span className="text-slate-300 font-bold">{currentColor.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {hat && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{HATS.find(h=>h.id===hat)?.icon} {HATS.find(h=>h.id===hat)?.name}</span>}
              {accessory && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{ACCESSORIES.find(a=>a.id===accessory)?.icon} {ACCESSORIES.find(a=>a.id===accessory)?.name}</span>}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full max-w-xs relative overflow-hidden font-black py-4 rounded-xl text-base transition-all duration-200 disabled:opacity-60"
            style={{
              background: saved ? "linear-gradient(135deg, #059669, #10b981)" : `linear-gradient(135deg, ${color}, ${shadeColor(color, -20)})`,
              boxShadow: saved ? "0 0 20px #10b98155" : `0 0 20px ${color}55`,
            }}
          >
            <span className="relative z-10">
              {saved ? "✅ Configuration sauvegardée !" : isPending ? "⟳ Synchronisation…" : "💾 Sauvegarder la configuration"}
            </span>
          </button>

          {/* XP progress */}
          <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-xs text-slate-600 mb-1 font-mono">
              <span>XP TOTAL</span>
              <span>{xp.toLocaleString()} / ∞</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (xp % 1000) / 10)}%`, background: `linear-gradient(90deg, ${color}, ${shadeColor(color, 20)})` }} />
            </div>
          </div>
        </div>

        {/* ══ RIGHT — Config panel ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col">

          {/* Tab bar */}
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center gap-1 py-4 text-xs font-black tracking-wider uppercase transition-all relative"
                style={{ color: tab === t.id ? color : "#475569" }}
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: color }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-6 overflow-y-auto">

            {/* ─ Models ─ */}
            {tab === "model" && (
              <div className="space-y-3">
                <SectionTitle label="Sélectionne ton unité" sub={`${BASES.filter(b => isUnlocked(b.unlockAt)).length}/${BASES.length} débloquées`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BASES.map((b) => {
                    const locked = !isUnlocked(b.unlockAt);
                    const active = base === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => !locked && setBase(b.id)}
                        disabled={locked}
                        className="relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group"
                        style={{
                          borderColor: active ? color : locked ? "#1e293b" : "#334155",
                          background: active ? `${color}15` : locked ? "#0f172a" : "#1e293b",
                          boxShadow: active ? `0 0 20px ${color}25` : "none",
                          opacity: locked ? 0.5 : 1,
                        }}
                      >
                        <div className="shrink-0 w-16 h-16 flex items-center justify-center rounded-xl"
                          style={{ background: active ? `${color}20` : "#0f172a" }}>
                          <AvatarSvg base={b.id} color={active ? color : undefined} size={52} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-sm" style={{ color: active ? color : locked ? "#475569" : "#e2e8f0" }}>
                            {b.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{b.desc}</div>
                          {locked && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full">
                              🔒 {b.unlockAt.toLocaleString()} XP
                            </div>
                          )}
                          {active && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}>
                              ◈ ACTIF
                            </div>
                          )}
                        </div>
                        {!locked && !active && (
                          <div className="shrink-0 w-6 h-6 rounded-full border border-slate-600 group-hover:border-slate-400 transition-colors" />
                        )}
                        {active && (
                          <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: color }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─ Hats ─ */}
            {tab === "hat" && (
              <div className="space-y-3">
                <SectionTitle label="Coiffe" sub="Personnalise la tête de ton unité" />
                <div className="grid grid-cols-2 gap-3">
                  {HATS.map((h) => {
                    const locked = !isUnlocked(h.unlockAt);
                    const active = hat === h.id;
                    return (
                      <button key={h.id} onClick={() => !locked && setHat(h.id)} disabled={locked}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200"
                        style={{
                          borderColor: active ? color : locked ? "#1e293b" : "#334155",
                          background: active ? `${color}15` : locked ? "#0f172a" : "#1e293b",
                          boxShadow: active ? `0 0 16px ${color}20` : "none",
                          opacity: locked ? 0.5 : 1,
                        }}>
                        <span className="text-3xl">{h.icon}</span>
                        <div>
                          <div className="font-black text-sm text-center" style={{ color: active ? color : locked ? "#475569" : "#e2e8f0" }}>
                            {h.name}
                          </div>
                          {locked && <div className="text-[10px] text-amber-500 text-center mt-1">🔒 {h.unlockAt} XP</div>}
                          {active && <div className="text-[10px] text-center mt-1 font-black" style={{ color }}>◈ ACTIF</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─ Accessories ─ */}
            {tab === "accessory" && (
              <div className="space-y-3">
                <SectionTitle label="Accessoires" sub="Équipements spéciaux" />
                <div className="grid grid-cols-2 gap-3">
                  {ACCESSORIES.map((a) => {
                    const locked = !isUnlocked(a.unlockAt);
                    const active = accessory === a.id;
                    return (
                      <button key={a.id} onClick={() => !locked && setAccessory(a.id)} disabled={locked}
                        className="flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200"
                        style={{
                          borderColor: active ? color : locked ? "#1e293b" : "#334155",
                          background: active ? `${color}15` : locked ? "#0f172a" : "#1e293b",
                          boxShadow: active ? `0 0 16px ${color}20` : "none",
                          opacity: locked ? 0.5 : 1,
                        }}>
                        <span className="text-3xl">{a.icon}</span>
                        <div>
                          <div className="font-black text-sm text-center" style={{ color: active ? color : locked ? "#475569" : "#e2e8f0" }}>
                            {a.name}
                          </div>
                          {locked && <div className="text-[10px] text-amber-500 text-center mt-1">🔒 {a.unlockAt.toLocaleString()} XP</div>}
                          {active && <div className="text-[10px] text-center mt-1 font-black" style={{ color }}>◈ ACTIF</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─ Colors ─ */}
            {tab === "color" && (
              <div className="space-y-4">
                <SectionTitle label="Couleur principale" sub="Chaque couleur change l'apparence complète du robot" />
                <div className="grid grid-cols-2 gap-3">
                  {COLORS.map((c) => {
                    const active = color === c.hex;
                    return (
                      <button key={c.hex} onClick={() => setColor(c.hex)}
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
                        style={{
                          borderColor: active ? c.hex : "#334155",
                          background: active ? `${c.hex}18` : "#1e293b",
                          boxShadow: active ? `0 0 16px ${c.hex}30` : "none",
                        }}>
                        <div className="w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: `radial-gradient(circle at 35% 30%, ${shadeColor(c.hex, 30)}, ${c.hex}, ${shadeColor(c.hex, -30)})`,
                            borderColor: active ? "white" : "transparent",
                            boxShadow: active ? `0 0 12px ${c.hex}60` : "none",
                          }}>
                          {active && <span className="text-white text-sm font-black">✓</span>}
                        </div>
                        <div>
                          <div className="font-black text-sm" style={{ color: active ? c.hex : "#e2e8f0" }}>{c.name}</div>
                          <div className="text-[10px] text-slate-600 font-mono">{c.hex.toUpperCase()}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-black text-white text-lg">{label}</h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent * 2.55));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent * 2.55));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent * 2.55));
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}
