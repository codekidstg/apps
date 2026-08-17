"use client";

import { useEffect, useState } from "react";

// Progression par thème : 0 (verrouillé) → 1 (débloqué en cours) → 2 (complété)
export type ThemeProgress = {
  theme1: number; // Routes
  theme2: number; // Case du Griot
  theme3: number; // Bibliothèque
  theme4: number; // Palais
  theme5: number; // Galerie
};

type Props = {
  progress: ThemeProgress;
  kodiMessage?: string;
};

// Flamme animée
function Torch({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Poteau */}
      <rect x="-1.5" y="0" width="3" height="12" rx="1" fill="#8B5E3C" />
      {/* Flamme */}
      {lit && (
        <g>
          <ellipse cx="0" cy="-4" rx="4" ry="6" fill="#FDB813" opacity="0.9">
            <animate attributeName="ry" values="6;7;5;6" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;1;0.8;0.9" dur="1.2s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="0" cy="-5" rx="2.5" ry="4" fill="#f97316" opacity="0.8">
            <animate attributeName="cy" values="-5;-6;-5" dur="0.9s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="0" cy="-7" rx="1.2" ry="2" fill="#fef9c3" opacity="0.7">
            <animate attributeName="opacity" values="0.7;1;0.5;0.7" dur="0.7s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}
      {!lit && <ellipse cx="0" cy="-2" rx="3" ry="2" fill="#334155" opacity="0.5" />}
    </g>
  );
}

// Étoile scintillante
function Star({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <circle cx={x} cy={y} r="1.2" fill="white" opacity="0.7">
      <animate attributeName="opacity" values="0.7;0.2;0.9;0.7" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
  );
}

// Arbre/palmier simple dessiné
function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="-2" y="0" width="4" height="16" rx="2" fill="#7c5c3a" />
      <ellipse cx="0" cy="0" rx="9" ry="5" fill="#15803d" transform="rotate(-20)" />
      <ellipse cx="0" cy="0" rx="9" ry="5" fill="#16a34a" transform="rotate(20)" />
      <ellipse cx="0" cy="-2" rx="7" ry="4" fill="#22c55e" />
    </g>
  );
}

// Baobab
function Baobab({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-5" y="0" width="10" height="18" rx="5" fill="#92400e" />
      <rect x="-8" y="-2" width="16" height="10" rx="8" fill="#92400e" />
      <ellipse cx="0" cy="-4" rx="12" ry="7" fill="#15803d" />
      <ellipse cx="-6" cy="-2" rx="7" ry="4" fill="#166534" />
      <ellipse cx="6" cy="-2" rx="7" ry="4" fill="#166534" />
    </g>
  );
}

// Buisson
function Bush({ x, y, color = "#16a34a" }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="0" rx="7" ry="5" fill={color} />
      <ellipse cx="-4" cy="1" rx="5" ry="4" fill={color} />
      <ellipse cx="4" cy="1" rx="5" ry="4" fill={color} />
    </g>
  );
}

// Case ronde (maison africaine)
function RoundHut({ x, y, lit, color = "#d97706", label = "" }: { x: number; y: number; lit: boolean; color?: string; label?: string }) {
  const wallColor = lit ? color : "#334155";
  const roofColor = lit ? "#92400e" : "#1e293b";
  const glow = lit ? color : "none";
  return (
    <g transform={`translate(${x},${y})`}>
      {lit && <ellipse cx="0" cy="12" rx="20" ry="6" fill={glow} opacity="0.15">
        <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
      </ellipse>}
      {/* Mur circulaire */}
      <ellipse cx="0" cy="8" rx="16" ry="10" fill={wallColor} />
      {/* Toit en cône */}
      <polygon points="0,-6 -18,8 18,8" fill={roofColor} />
      {/* Porte */}
      <ellipse cx="0" cy="12" rx="5" ry="7" fill={lit ? "#78350f" : "#0f172a"} />
      {/* Fenêtre lumineuse */}
      {lit && <ellipse cx="9" cy="6" rx="3" ry="2.5" fill="#fef3c7" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite" />
      </ellipse>}
      {label && <text x="0" y="28" textAnchor="middle" fontSize="8" fill={lit ? "white" : "#475569"} fontWeight="bold">{label}</text>}
    </g>
  );
}

// Bâtiment rectangulaire (bibliothèque, galerie)
function Building({ x, y, w, h, lit, color, roofColor, label = "", windows = 2 }: {
  x: number; y: number; w: number; h: number; lit: boolean;
  color: string; roofColor: string; label?: string; windows?: number;
}) {
  const wallC = lit ? color : "#1e293b";
  const rC = lit ? roofColor : "#0f172a";
  return (
    <g transform={`translate(${x},${y})`}>
      {lit && <ellipse cx="0" cy={h + 6} rx={w * 0.8} ry="6" fill={color} opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
      </ellipse>}
      <rect x={-w / 2} y={0} width={w} height={h} rx="3" fill={wallC} />
      {/* Toit */}
      <rect x={-w / 2 - 3} y={-8} width={w + 6} height="10" rx="2" fill={rC} />
      {/* Fenêtres */}
      {Array.from({ length: windows }).map((_, i) => {
        const wx = -w / 2 + 8 + i * ((w - 16) / (windows > 1 ? windows - 1 : 1));
        return (
          <rect key={i} x={wx - 5} y={8} width="10" height="12" rx="2"
            fill={lit ? "#fef3c7" : "#0f172a"} opacity={lit ? 0.9 : 0.4}>
            {lit && <animate attributeName="opacity" values="0.9;0.6;0.9" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />}
          </rect>
        );
      })}
      {/* Porte */}
      <rect x="-6" y={h - 14} width="12" height="14" rx="2" fill={lit ? "#78350f" : "#0f172a"} />
      {label && <text x="0" y={h + 18} textAnchor="middle" fontSize="8" fill={lit ? "white" : "#475569"} fontWeight="bold">{label}</text>}
    </g>
  );
}

// Kodi SVG simple
function KodiCharacter({ x, y, animated }: { x: number; y: number; animated: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Corps */}
      <rect x="-8" y="8" width="16" height="20" rx="4" fill="#3b82f6" />
      {/* Tête */}
      <rect x="-9" y="-8" width="18" height="18" rx="5" fill="#60a5fa" />
      {/* Yeux */}
      <rect x="-5" y="-4" width="4" height="5" rx="2" fill="#0f172a" />
      <rect x="1" y="-4" width="4" height="5" rx="2" fill="#0f172a" />
      {/* Lueur yeux */}
      <circle cx="-3" cy="-2" r="1" fill="white" opacity="0.8" />
      <circle cx="3" cy="-2" r="1" fill="white" opacity="0.8" />
      {/* Bouche */}
      <path d="M -3 3 Q 0 5 3 3" stroke="#0f172a" strokeWidth="1.5" fill="none" />
      {/* Bras */}
      <rect x="-16" y="10" width="8" height="4" rx="2" fill="#3b82f6" />
      <rect x="8" y="10" width="8" height="4" rx="2" fill="#3b82f6" />
      {/* Jambes */}
      <rect x="-6" y="26" width="5" height="10" rx="2" fill="#1d4ed8" />
      <rect x="1" y="26" width="5" height="10" rx="2" fill="#1d4ed8" />
      {/* Antenne */}
      <line x1="0" y1="-8" x2="0" y2="-16" stroke="#60a5fa" strokeWidth="2" />
      <circle cx="0" cy="-17" r="3" fill="#FDB813">
        {animated && <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite" />}
        {animated && <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />}
      </circle>
      {/* Fissures si endommagé — disparaissent progressivement */}
    </g>
  );
}

// Kodi avec état de réparation
function KodiWithState({ x, y, repairLevel }: { x: number; y: number; repairLevel: number }) {
  // repairLevel 0-5 : 0 = tout cassé, 5 = complet
  const animated = repairLevel > 0;
  return (
    <g>
      <KodiCharacter x={x} y={y} animated={animated} />
      {/* Fissures visibles si non réparé */}
      {repairLevel < 2 && (
        <g transform={`translate(${x},${y})`} opacity={1 - repairLevel * 0.4}>
          <line x1="-4" y1="-6" x2="0" y2="0" stroke="#ef4444" strokeWidth="1" opacity="0.7" />
          <line x1="3" y1="-4" x2="6" y2="2" stroke="#ef4444" strokeWidth="1" opacity="0.7" />
          <line x1="-2" y1="10" x2="2" y2="18" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
        </g>
      )}
      {/* Halo de réparation */}
      {repairLevel >= 4 && (
        <circle cx={x} cy={y} r="25" fill="none" stroke="#FDB813" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

export default function VillageMap({ progress, kodiMessage }: Props) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (kodiMessage) {
      const t = setTimeout(() => setShowMessage(true), 800);
      return () => clearTimeout(t);
    }
  }, [kodiMessage]);

  const t1 = progress.theme1; // Routes
  const t2 = progress.theme2; // Griot
  const t3 = progress.theme3; // Bibliothèque
  const t4 = progress.theme4; // Palais
  const t5 = progress.theme5; // Galerie

  // Kodi se positionne sur le quartier actif
  const kodiPos = t1 < 2 ? { x: 130, y: 160 }
    : t2 < 2 ? { x: 68, y: 90 }
    : t3 < 2 ? { x: 200, y: 85 }
    : t4 < 2 ? { x: 300, y: 110 }
    : { x: 235, y: 200 };

  const repairLevel = t1 + t2 + t3 + t4 + t5;

  const roadColor = t1 >= 1 ? "#d97706" : "#374151";
  const roadOpacity = t1 >= 1 ? 1 : 0.35;

  return (
    <div className="relative w-full select-none" style={{ maxWidth: 420 }}>
      {/* Titre de la carte */}
      <div className="text-center mb-2">
        <span className="text-xs font-mono font-black uppercase tracking-widest" style={{ color: "#FDB813" }}>
          ◈ Village Numérique d&apos;Amavi
        </span>
      </div>

      <svg
        viewBox="0 0 400 280"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full rounded-2xl"
        style={{ background: "linear-gradient(180deg, #0a0f1e 0%, #0f172a 60%, #1a2a1a 100%)", border: "1px solid #1e3a5f" }}
        role="img"
        aria-label="Carte animée du Village Numérique d'Amavi"
      >
        {/* Ciel étoilé */}
        <Star x={30} y={18} delay={0} />
        <Star x={80} y={12} delay={0.5} />
        <Star x={150} y={8} delay={1} />
        <Star x={220} y={15} delay={0.3} />
        <Star x={310} y={10} delay={0.8} />
        <Star x={370} y={20} delay={0.2} />
        <Star x={55} y={30} delay={1.4} />
        <Star x={340} y={30} delay={0.6} />

        {/* Lune */}
        <circle cx="370" cy="25" r="14" fill="#1e3a5f" />
        <circle cx="378" cy="20" r="11" fill={t5 >= 2 ? "#fef3c7" : "#0f172a"} opacity={t5 >= 2 ? 1 : 0.4} />

        {/* ── ROUTES (Thème 1) ── */}
        {/* Route principale horizontale */}
        <path d="M 20 170 Q 100 160 200 165 Q 280 170 380 155"
          stroke={roadColor} strokeWidth="10" fill="none" strokeLinecap="round" opacity={roadOpacity} />
        {/* Route vers nord */}
        <path d="M 130 165 Q 100 130 80 100"
          stroke={roadColor} strokeWidth="8" fill="none" strokeLinecap="round" opacity={roadOpacity} />
        {/* Route vers bibliothèque */}
        <path d="M 200 165 Q 205 130 200 95"
          stroke={roadColor} strokeWidth="8" fill="none" strokeLinecap="round" opacity={roadOpacity} />
        {/* Route vers palais */}
        <path d="M 290 158 Q 300 130 300 108"
          stroke={roadColor} strokeWidth="8" fill="none" strokeLinecap="round" opacity={roadOpacity} />
        {/* Route galerie */}
        <path d="M 230 165 Q 235 220 235 240"
          stroke={roadColor} strokeWidth="7" fill="none" strokeLinecap="round" opacity={roadOpacity} />

        {/* Reflets de route allumée */}
        {t1 >= 1 && (
          <path d="M 20 170 Q 100 160 200 165 Q 280 170 380 155"
            stroke="#FDB813" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
          </path>
        )}

        {/* ── CASE DU GRIOT (Thème 2) ── */}
        <RoundHut x={75} y={88} lit={t2 >= 1} color="#a78bfa" label="Case du Griot" />
        {/* Notes de musique flottantes */}
        {t2 >= 1 && (
          <g>
            <text x="95" y="70" fontSize="10" fill="#a78bfa" opacity="0.8">
              ♪
              <animate attributeName="y" values="70;60;70" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </text>
            <text x="60" y="65" fontSize="8" fill="#c4b5fd" opacity="0.6">
              ♫
              <animate attributeName="y" values="65;55;65" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
            </text>
          </g>
        )}

        {/* ── BIBLIOTHÈQUE (Thème 3) ── */}
        <Building x={200} y={60} w={50} h={40} lit={t3 >= 1} color="#3b82f6" roofColor="#1e40af" label="Bibliothèque" windows={3} />

        {/* ── PALAIS DES DÉCISIONS (Thème 4) ── */}
        <Building x={300} y={65} w={65} h={50} lit={t4 >= 1} color="#10b981" roofColor="#065f46" label="Palais" windows={4} />
        {/* Colonnes */}
        {[-20, -7, 7, 20].map((dx, i) => (
          <rect key={i} x={300 + dx - 2} y={95} width="4" height="20" rx="1"
            fill={t4 >= 1 ? "#34d399" : "#1e293b"} opacity={t4 >= 1 ? 0.8 : 0.3} />
        ))}

        {/* ── GALERIE DES ŒUVRES (Thème 5) ── */}
        <Building x={235} y={220} w={60} h={35} lit={t5 >= 1} color="#ec4899" roofColor="#9d174d" label="Galerie" windows={3} />
        {/* Cadres de tableau */}
        {t5 >= 1 && [0, 1, 2].map((i) => (
          <rect key={i} x={208 + i * 18} y={226} width="12" height="10" rx="1"
            stroke="#f9a8d4" strokeWidth="1.5" fill="none" opacity="0.8" />
        ))}

        {/* ── VÉGÉTATION ── */}
        <Palm x={35} y={135} scale={0.8} />
        <Palm x={355} y={130} scale={0.9} />
        <Palm x={160} y={120} scale={0.7} />
        <Baobab x={340} y={175} />
        <Bush x={110} y={145} color={t1 >= 1 ? "#16a34a" : "#1e3a2a"} />
        <Bush x={250} y={145} color={t1 >= 1 ? "#15803d" : "#1e3a2a"} />
        <Bush x={170} y={185} color={t1 >= 1 ? "#16a34a" : "#1e3a2a"} />

        {/* ── TORCHES ── */}
        <Torch x={45} y={160} lit={t1 >= 1} />
        <Torch x={185} y={155} lit={t1 >= 1} />
        <Torch x={270} y={150} lit={t1 >= 1} />
        <Torch x={360} y={148} lit={t1 >= 1} />
        <Torch x={58} y={110} lit={t2 >= 1} />
        <Torch x={182} y={108} lit={t3 >= 1} />
        <Torch x={265} y={112} lit={t4 >= 1} />

        {/* Puits au centre */}
        <circle cx="155" cy="170" r="10" fill="#1e293b" stroke={t1 >= 1 ? "#d97706" : "#374151"} strokeWidth="2" />
        <rect x="148" y="162" width="14" height="3" rx="1.5" fill={t1 >= 1 ? "#d97706" : "#374151"} />
        <text x="155" y="173" textAnchor="middle" fontSize="7" fill={t1 >= 1 ? "#fbbf24" : "#475569"}>≋</text>

        {/* ── KODI ── */}
        <KodiWithState x={kodiPos.x} y={kodiPos.y} repairLevel={repairLevel} />

        {/* Légende en bas */}
        <rect x="5" y="262" width="390" height="16" rx="4" fill="#0f172a" opacity="0.7" />
        {[
          { label: "Routes", color: t1 >= 1 ? "#d97706" : "#374151", done: t1 >= 2 },
          { label: "Griot", color: t2 >= 1 ? "#a78bfa" : "#374151", done: t2 >= 2 },
          { label: "Biblio", color: t3 >= 1 ? "#3b82f6" : "#374151", done: t3 >= 2 },
          { label: "Palais", color: t4 >= 1 ? "#10b981" : "#374151", done: t4 >= 2 },
          { label: "Galerie", color: t5 >= 1 ? "#ec4899" : "#374151", done: t5 >= 2 },
        ].map((item, i) => (
          <g key={i} transform={`translate(${16 + i * 76}, 268)`}>
            <circle cx="0" cy="3" r="4" fill={item.color} />
            {item.done && <text x="0" y="5" textAnchor="middle" fontSize="5" fill="white">✓</text>}
            <text x="8" y="6" fontSize="7" fill={item.color} fontWeight="bold">{item.label}</text>
          </g>
        ))}
      </svg>

      {/* Bulle de message Kodi */}
      {kodiMessage && showMessage && (
        <div
          className="mt-3 rounded-2xl px-5 py-4 text-sm font-bold flex items-start gap-3"
          style={{
            background: "linear-gradient(135deg, #1e3a5f, #1e293b)",
            border: "1px solid #3b82f640",
            color: "#e2e8f0",
          }}
        >
          <span className="text-xl shrink-0">🤖</span>
          <span className="leading-snug italic">&ldquo;{kodiMessage}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
