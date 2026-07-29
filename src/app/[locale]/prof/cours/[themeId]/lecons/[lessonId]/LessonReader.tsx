"use client";

import { useEffect } from "react";
import type { BlockType } from "@/lib/supabase/types";

type Block = { id: string; type: BlockType; content: Record<string, unknown>; order_index: number };
type Props = { blocks: Block[]; watermarkId: string; teacherId: string };

export default function LessonReader({ blocks, watermarkId, teacherId }: Props) {
  // ── Protections côté client (dissuasives, non garanties) ──────────────────
  useEffect(() => {
    const now = new Date().toLocaleString("fr-FR");

    // Bloquer copier/couper sur les zones de contenu
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("text/plain",
        `[Contenu protégé — Accès prof #${watermarkId} — ${now}]`
      );
    };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); };

    // Bloquer clic-droit
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-protected]")) e.preventDefault();
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [watermarkId]);

  if (!blocks.length) {
    return (
      <div className="bg-white rounded-2xl border border-cream-border p-12 text-center text-ink-muted font-bold">
        Cette leçon n&apos;a pas encore de contenu.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bandeau lecture seule */}
      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
        🔒 Lecture seule · Accès journalisé · ID traçable : <span className="font-mono">{watermarkId}</span>
      </div>

      {/* Blocs de contenu */}
      {blocks.map((block) => (
        <ProtectedBlock key={block.id} block={block} watermarkId={watermarkId} teacherId={teacherId} />
      ))}
    </div>
  );
}

// ── Bloc individuel avec watermark superposé ──────────────────────────────────

function ProtectedBlock({ block, watermarkId, teacherId }: {
  block: Block; watermarkId: string; teacherId: string;
}) {
  const now = new Date().toLocaleDateString("fr-FR");

  return (
    <div className="relative bg-white rounded-2xl border border-cream-border overflow-hidden" data-protected>
      {/* Watermark SVG — superposé, non sélectionnable */}
      <WatermarkOverlay id={watermarkId} date={now} />

      {/* Contenu du bloc */}
      <div className="relative z-10 p-6 select-none" style={{ userSelect: "none" }}>
        <BlockRenderer block={block} />
      </div>
    </div>
  );
}

// ── Watermark SVG diagonal ────────────────────────────────────────────────────

function WatermarkOverlay({ id, date }: { id: string; date: string }) {
  const text = `PROF-${id} · ${date}`;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id={`wm-${id}`} x="0" y="0" width="220" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text
            x="10" y="50"
            fontFamily="monospace" fontSize="11" fontWeight="600"
            fill="rgba(30,58,138,0.07)"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#wm-${id})`} />
    </svg>
  );
}

// ── Rendu des blocs (lecture seule) ──────────────────────────────────────────

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "text": {
      const md = (block.content.markdown as string) || "";
      // Rendu simple : préserver sauts de ligne, pas de markdown complet (pas de bibliothèque)
      return (
        <div className="prose prose-sm max-w-none text-ink">
          {md.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <h2 key={i} className="text-base font-extrabold text-ink mt-4 mb-2">{line.slice(3)}</h2>;
            if (line.startsWith("# "))  return <h1 key={i} className="text-lg font-extrabold text-ink mt-4 mb-2">{line.slice(2)}</h1>;
            if (line.startsWith("```")) return null;
            if (!line.trim()) return <br key={i} />;
            return <p key={i} className="text-sm text-ink leading-relaxed">{renderInline(line)}</p>;
          })}
        </div>
      );
    }

    case "video": {
      const url   = block.content.url as string;
      const title = block.content.title as string;
      const embedUrl = toEmbedUrl(url);
      return (
        <div className="space-y-2">
          {title && <div className="font-bold text-sm text-ink">{title}</div>}
          {embedUrl ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={title} />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-4 text-sm text-ink-muted">
              🎬 Vidéo : <span className="font-mono text-xs">{url}</span>
            </div>
          )}
        </div>
      );
    }

    case "quiz": {
      const questions = (block.content.questions as Array<{
        question: string; type: string; options?: string[];
      }>) ?? [];
      return (
        <div className="space-y-4">
          <div className="font-extrabold text-sm text-ink flex items-center gap-2">
            <span>❓</span> Quiz — {questions.length} question(s)
          </div>
          {questions.map((q, i) => (
            <div key={i} className="bg-cream rounded-xl p-4">
              <div className="font-bold text-sm text-ink mb-2">{i + 1}. {q.question}</div>
              {q.options && (
                <ul className="space-y-1 text-sm text-ink-muted">
                  {q.options.map((opt, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded border border-cream-border bg-white flex items-center justify-center text-xs font-bold text-ink-light">
                        {String.fromCharCode(65 + j)}
                      </span>
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === "truefalse" && (
                <div className="flex gap-2 text-sm text-ink-muted">
                  <span className="px-3 py-1 rounded-lg bg-white border border-cream-border">Vrai</span>
                  <span className="px-3 py-1 rounded-lg bg-white border border-cream-border">Faux</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    case "code_challenge": {
      const lang = block.content.language as string;
      const code = block.content.starter_code as string;
      return (
        <div className="space-y-2">
          <div className="font-extrabold text-sm text-ink flex items-center gap-2">
            <span>💻</span> Défi code — <span className="capitalize">{lang}</span>
          </div>
          <pre className="bg-gray-900 text-green-300 rounded-xl p-4 text-xs font-mono overflow-x-auto">
            {code || "// Code de départ non défini"}
          </pre>
        </div>
      );
    }

    case "game": {
      const gameType = block.content.game_type as string;
      const labels: Record<string, string> = {
        maze: "🗺️ Labyrinthe algorithmique",
        fill_blank: "✏️ Compléter les blancs",
        sort: "🔀 Tri d'éléments",
        memory: "🧠 Jeu de mémoire",
      };
      return (
        <div className="bg-brand-blue-light rounded-xl p-5 text-center">
          <div className="text-2xl mb-2">🎮</div>
          <div className="font-extrabold text-ink">{labels[gameType] ?? gameType}</div>
          <div className="text-xs text-ink-muted mt-1">Jeu interactif — disponible uniquement pour les élèves</div>
        </div>
      );
    }

    default:
      return <div className="text-sm text-ink-muted italic">Type de bloc inconnu.</div>;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderInline(text: string) {
  // Gras **texte**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
