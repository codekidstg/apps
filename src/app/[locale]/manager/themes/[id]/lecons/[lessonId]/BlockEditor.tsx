"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createBlock, updateBlock, deleteBlock, moveBlock } from "../../../actions";
import type { BlockType } from "@/lib/supabase/types";

type Block = { id: string; type: BlockType; content: Record<string, unknown>; order_index: number };
type Props = { blocks: Block[]; lessonId: string; themeId: string; canEdit: boolean };

const TYPE_META: Record<BlockType, { label: string; icon: string; color: string; desc: string }> = {
  text:           { label: "Texte",       icon: "📝", color: "border-l-blue-400 bg-blue-50/40",      desc: "Contenu Markdown enrichi" },
  video:          { label: "Vidéo",       icon: "🎬", color: "border-l-pink-400 bg-pink-50/40",      desc: "Vidéo YouTube / Vimeo" },
  quiz:           { label: "Quiz",        icon: "❓", color: "border-l-violet-400 bg-violet-50/40",  desc: "QCM, Vrai/Faux, texte libre" },
  code_challenge: { label: "Défi code",   icon: "💻", color: "border-l-emerald-400 bg-emerald-50/40",desc: "Éditeur + tests auto" },
  game:           { label: "Jeu",         icon: "🎮", color: "border-l-orange-400 bg-orange-50/40",  desc: "Kodi / Labyrinthe / Puzzle" },
};

const ic = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white placeholder:text-slate-400";
const label = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide";

export default function BlockEditor({ blocks, lessonId, themeId, canEdit }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd(type: BlockType) {
    setShowAddMenu(false);
    setSaving(true);
    const result = await createBlock(lessonId, themeId, type);
    setSaving(false);
    if (result?.id) router.refresh();
  }

  async function handleSaveBlock(blockId: string, content: unknown) {
    setSaving(true);
    await updateBlock(blockId, themeId, content);
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(blockId: string) {
    if (!confirm("Supprimer ce bloc ?")) return;
    await deleteBlock(blockId, themeId);
    router.refresh();
  }

  async function handleMove(blockId: string, direction: "up" | "down") {
    await moveBlock(blockId, lessonId, themeId, direction);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
          <div className="text-5xl mb-3">📭</div>
          <div className="font-bold text-slate-700 mb-1">Aucun contenu</div>
          <div className="text-sm text-slate-400">Ajoutez votre premier bloc ci-dessous.</div>
        </div>
      )}

      {blocks.map((block, i) => {
        const meta = TYPE_META[block.type];
        const isEditing = editingId === block.id;
        return (
          <div key={block.id} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${meta.color} overflow-hidden shadow-sm transition-shadow hover:shadow-md`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <span className="text-base">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-700">{meta.label}</span>
                <span className="ml-2 text-xs text-slate-400">{meta.desc}</span>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1">
                  <button disabled={i === 0} onClick={() => handleMove(block.id, "up")}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold">↑</button>
                  <button disabled={i === blocks.length - 1} onClick={() => handleMove(block.id, "down")}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold">↓</button>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  <button onClick={() => setEditingId(isEditing ? null : block.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isEditing ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}>
                    {isEditing ? "✕ Fermer" : "✏️ Éditer"}
                  </button>
                  <button onClick={() => handleDelete(block.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors text-xs">✕</button>
                </div>
              )}
            </div>

            {/* Preview */}
            {!isEditing && (
              <div className="px-5 py-4">
                <BlockPreview block={block} lessonId={lessonId} themeId={themeId} />
              </div>
            )}

            {/* Edit form */}
            {isEditing && canEdit && (
              <div className="px-5 py-5 bg-slate-50/60 border-t border-slate-100">
                <BlockForm
                  block={block}
                  onSave={(content) => handleSaveBlock(block.id, content)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add block */}
      {canEdit && (
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={saving}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/30 transition-all disabled:opacity-50"
          >
            {saving ? "⏳ Enregistrement…" : "+ Ajouter un bloc"}
          </button>

          {showAddMenu && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-20">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Choisir un type de bloc</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_META) as [BlockType, typeof TYPE_META[BlockType]][]).map(([type, meta]) => (
                  <button key={type} onClick={() => handleAdd(type)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left group">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-700 group-hover:text-slate-900">{meta.label}</div>
                      <div className="text-xs text-slate-400">{meta.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddMenu(false)}
                className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 w-full text-center">
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Markdown preview helper ───────────────────────────────────────────────────

function renderMdPreview(md: string): string {
  // Tables
  md = md.replace(/((?:^\|.+\n){2,}(?:^\|.+\n?))/gm, (m) => {
    const lines = m.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return m;
    const isSep = (l: string) => /^\|[\s\-|:]+\|$/.test(l.trim());
    if (!isSep(lines[1])) return m;
    const tdStyle = `border:1px solid #e2e8f0;padding:5px 10px;font-size:12px;color:#475569`;
    const thStyle = `${tdStyle};background:#f8fafc;font-weight:700;color:#334155`;
    const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    const headers = cells(lines[0]).map(h => `<th style="${thStyle}">${h}</th>`).join("");
    const rows = lines.slice(2).map((l, i) =>
      `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"}">${cells(l).map(c => `<td style="${tdStyle}">${c}</td>`).join("")}</tr>`
    ).join("");
    return `<div style="overflow-x:auto;margin:8px 0"><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  });
  // Inline
  md = md.replace(/^#{1,3} (.+)$/gm, "<span style='font-weight:800;color:#1e293b'>$1</span>");
  md = md.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  md = md.replace(/`([^`]+)`/g, "<code style='background:#f1f5f9;color:#d97706;padding:1px 5px;border-radius:4px;font-size:11px;font-family:monospace'>$1</code>");
  md = md.replace(/\n/g, "<br/>");
  return md;
}

// ── Preview ───────────────────────────────────────────────────────────────────

function BlockPreview({ block, lessonId, themeId }: { block: Block; lessonId: string; themeId: string }) {
  const c = block.content;

  if (block.type === "text") {
    // Format seedé : { html: "..." }
    const html = (c.html as string) || "";
    if (html) {
      return (
        <div
          className="prose prose-sm max-w-none text-slate-700 [&_h2]:text-base [&_h2]:font-black [&_h3]:text-sm [&_h3]:font-bold [&_pre]:text-xs [&_pre]:overflow-x-auto [&_table]:text-xs [&_td]:p-1 [&_th]:p-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    // Format éditeur : { markdown: "..." }
    const md = (c.markdown as string) || "";
    if (!md) return <em className="text-slate-400 text-sm">Aucun contenu</em>;
    return (
      <div className="text-sm text-slate-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMdPreview(md.slice(0, 600)) }} />
    );
  }

  if (block.type === "video") {
    const url = (c.url as string) ?? "";
    const title = (c.title as string) ?? "";
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-9 bg-pink-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">▶️</div>
        <div className="min-w-0">
          {title && <div className="font-semibold text-sm text-slate-700 truncate">{title}</div>}
          <div className="text-xs text-slate-400 truncate">{url || "URL non définie"}</div>
        </div>
      </div>
    );
  }

  if (block.type === "quiz") {
    // Format seedé : { question, choices, answer, explanation }
    const singleQ = c.question as string | undefined;
    if (singleQ) {
      const choices     = (c.choices as string[]) ?? [];
      const answer      = c.answer as number;
      const explanation = (c.explanation as string) ?? "";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 whitespace-pre-line">{singleQ}</p>
          <div className="space-y-1.5">
            {choices.map((ch, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${i === answer ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-bold" : "border-slate-200 bg-white text-slate-600"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === answer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {i === answer ? "✓" : i + 1}
                </span>
                {ch}
              </div>
            ))}
          </div>
          {explanation && <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2 mt-2">{explanation}</p>}
        </div>
      );
    }
    // Format éditeur : { questions: [...] }
    const qs = (c.questions as { question: string; type: string }[]) ?? [];
    if (qs.length === 0) return <em className="text-slate-400 text-sm">Aucune question</em>;
    return (
      <div className="space-y-1.5">
        {qs.slice(0, 3).map((q, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-violet-400 font-black shrink-0 mt-0.5">{i + 1}.</span>
            <span className="text-slate-600 line-clamp-1">{q.question || "Question vide"}</span>
            <span className="ml-auto text-xs text-slate-300 shrink-0">{q.type === "mcq" ? "QCM" : q.type === "truefalse" ? "V/F" : "Texte"}</span>
          </div>
        ))}
        {qs.length > 3 && <div className="text-xs text-slate-400 pl-5">+{qs.length - 3} autre(s)</div>}
      </div>
    );
  }

  if (block.type === "code_challenge") {
    const starter = (c.starter_code as string) ?? "";
    const lang = (c.language as string) || "python";
    const tests = ((c.tests as unknown[]) ?? []).length;
    return (
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <span className="bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono">{lang}</span>
          <span className="text-xs text-slate-400">{tests} test{tests > 1 ? "s" : ""}</span>
        </div>
        {starter && (
          <pre className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 line-clamp-2 overflow-hidden">
            {starter.slice(0, 140)}
          </pre>
        )}
      </div>
    );
  }

  if (block.type === "game") {
    // Détecter le type : explicite (game_type) ou implicite (structure du contenu)
    const gameType = (c.game_type as string)
      || ((c.grid_size || c.walls) ? "maze_robot" : "")
      || ((c.notes || c.bpm)       ? "music"      : "");
    return <GameBlockPreview block={block} gameType={gameType} lessonId={lessonId} themeId={themeId} />;
  }

  return null;
}

function GameBlockPreview({ block, gameType, lessonId, themeId }: { block: Block; gameType: string; lessonId: string; themeId: string }) {
  const c = block.content;
  const params = (c.params as Record<string, unknown>) ?? {};
  const studentUrl = `/fr/eleve/themes/${themeId}/lecons/${lessonId}`;

  if (!gameType) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 italic">
        <span>⚙️</span> Type de jeu non configuré — cliquez sur Éditer pour configurer
      </div>
    );
  }

  // ── Labyrinthe robot (format seed-septembre) ─────────────────────────────
  if (gameType === "maze_robot") {
    const gridSize   = (c.grid_size as number) ?? 5;
    const start      = c.start as { x: number; y: number; dir: string } | undefined;
    const goal       = c.goal  as { x: number; y: number } | undefined;
    const walls      = (c.walls as { x: number; y: number }[]) ?? [];
    const title      = (c.title as string) ?? "";
    const instr      = (c.instructions as string) ?? "";
    const steps      = (c.steps as string[]) ?? [];
    const maxBlocks  = c.max_blocks as number | undefined;
    const available  = (c.available_blocks as string[]) ?? [];

    const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
    const cellSize = Math.min(32, Math.floor(200 / gridSize));
    const dirArrow: Record<string, string> = { N: "↑", E: "→", S: "↓", W: "←" };

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-full">🏃 Labyrinthe Robot</span>
          {title && <span className="text-sm font-bold text-slate-700">{title}</span>}
          {maxBlocks && <span className="text-xs text-slate-400 ml-auto">max {maxBlocks} blocs</span>}
          <a href={studentUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shrink-0">
            👁 Jouer →
          </a>
        </div>

        {/* Instruction */}
        {instr && <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{instr}</p>}

        {/* Grille */}
        <div className="flex gap-6 items-start flex-wrap">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5">Carte ({gridSize}×{gridSize})</div>
            <div
              className="inline-grid gap-px bg-slate-300 rounded-lg overflow-hidden border border-slate-300"
              style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)` }}
            >
              {Array.from({ length: gridSize }).map((_, y) =>
                Array.from({ length: gridSize }).map((_, x) => {
                  const isWall  = wallSet.has(`${x},${y}`);
                  const isStart = start?.x === x && start?.y === y;
                  const isGoal  = goal?.x === x && goal?.y === y;
                  return (
                    <div
                      key={`${x}-${y}`}
                      style={{ width: cellSize, height: cellSize }}
                      className={`flex items-center justify-center text-[10px] font-black
                        ${isWall ? "bg-slate-800" : isStart ? "bg-green-200" : isGoal ? "bg-amber-200" : "bg-white"}`}
                    >
                      {isStart ? dirArrow[start?.dir ?? "E"] : isGoal ? "⭐" : ""}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-200 rounded-sm inline-block" />Départ {start ? `(${start.x},${start.y})` : ""}</span>
              <span>⭐ Objectif</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-800 rounded-sm inline-block" />Mur</span>
            </div>
          </div>

          {/* Étapes */}
          {steps.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5">Indices pour l'élève</div>
              <ol className="space-y-1">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center shrink-0 text-[10px]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Blocs disponibles */}
        {available.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {available.map(b => (
              <code key={b} className="bg-orange-50 border border-orange-200 text-orange-700 text-xs px-2 py-0.5 rounded-lg font-mono">{b}</code>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (gameType === "kodi_output") {
    const instructions = (c.instructions as string) ?? "";
    const expectedLines = (c.expected_lines as string[]) ?? [];
    const expectedContains = (c.expected_contains as string[]) ?? [];
    const availableBlocks = (c.available_blocks as string[]) ?? [];
    const maxBlocks = c.max_blocks as number | undefined;

    const blockColor = (id: string) =>
      id.startsWith("kodi_") ? "bg-orange-100 text-orange-700 border-orange-200"
      : id.startsWith("controls_") ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : id.startsWith("variables_") ? "bg-violet-100 text-violet-700 border-violet-200"
      : id.startsWith("logic_") ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

    const blockLabel: Record<string, string> = {
      kodi_say: "💬 Kodi dit", kodi_think: "💭 Kodi pense",
      controls_repeat_ext: "🔁 Répéter", controls_if: "❓ Si…alors",
      logic_compare: "⚖️ Comparer", variables_set: "📦 Variable =",
      variables_get: "📤 Lire var", text: "🔤 Texte",
      math_number: "🔢 Nombre", math_arithmetic: "➕ Calcul", text_join: "🔗 Assembler",
    };

    return (
      <div className="space-y-3">
        {/* Badge + lien élève */}
        <div className="flex items-center gap-2">
          <span className="bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-1 rounded-full">💬 Kodi parle — Blockly</span>
          {maxBlocks && <span className="text-xs text-slate-400">max {maxBlocks} blocs</span>}
          <a href={studentUrl} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs font-bold px-3 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shrink-0">
            👁 Voir comme élève →
          </a>
        </div>

        {/* Instructions preview */}
        {instructions && (
          <div className="text-sm text-slate-600 bg-orange-50/60 border border-orange-100 rounded-xl px-3 py-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: instructions }} />
        )}

        {/* Available blocks */}
        {availableBlocks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availableBlocks.slice(0, 8).map(id => (
              <span key={id} className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${blockColor(id)}`}>
                {blockLabel[id] ?? id}
              </span>
            ))}
            {availableBlocks.length > 8 && <span className="text-xs text-slate-400">+{availableBlocks.length - 8}</span>}
          </div>
        )}

        {/* Expected output */}
        {expectedLines.filter(Boolean).length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-2xl">🤖</span>
            <div className="space-y-1 flex-1">
              {expectedLines.filter(Boolean).slice(0, 3).map((line, i) => (
                <div key={i} className="bg-orange-50 border border-orange-200 text-orange-800 text-xs font-mono rounded-xl px-3 py-1.5">
                  {line}
                </div>
              ))}
              {expectedLines.filter(Boolean).length > 3 && (
                <div className="text-xs text-slate-400 pl-2">+{expectedLines.filter(Boolean).length - 3} ligne(s)…</div>
              )}
            </div>
          </div>
        )}
        {expectedLines.filter(Boolean).length === 0 && expectedContains.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-400">Contient :</span>
            {expectedContains.filter(Boolean).map((kw, i) => (
              <span key={i} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">"{kw}"</span>
            ))}
          </div>
        )}
        {expectedLines.filter(Boolean).length === 0 && expectedContains.filter(Boolean).length === 0 && (
          <span className="text-xs text-slate-400 italic">Exercice libre — pas de sortie attendue précise</span>
        )}
      </div>
    );
  }

  if (gameType === "maze") {
    const charEmoji: Record<string, string> = { amavi: "👦", kofi: "🧑", robot: "🤖", drone: "🚁" };
    const decorEmoji: Record<string, string> = { village: "🏘️", foret: "🌳", espace: "🌌", laboratoire: "🧪" };
    const char = (params.character as string) ?? "amavi";
    const decor = (params.decor as string) ?? "village";
    const cmds = (params.commands as string[]) ?? [];
    const instructions = (c.instructions as string) ?? "";
    const grid = (params.grid as string[][]) ?? [];
    return (
      <div className="space-y-3">
        {/* Badges config */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-full">🏃 Labyrinthe</span>
          <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{charEmoji[char]} {char}</span>
          <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">{decorEmoji[decor]} {decor}</span>
          <a href={studentUrl} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs font-bold px-3 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shrink-0">
            👁 Voir comme élève →
          </a>
        </div>

        {/* Instructions HTML */}
        {instructions && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 leading-relaxed
            [&_h3]:font-black [&_h3]:text-slate-800 [&_strong]:font-bold [&_em]:italic [&_code]:text-orange-600 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-orange-50 [&_code]:px-1 [&_code]:rounded"
            dangerouslySetInnerHTML={{ __html: instructions }} />
        )}

        {/* Grille de prévisualisation */}
        {grid.length > 0 && (
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5">Carte du labyrinthe</div>
            <div className="inline-grid gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200"
              style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 1}, 1.5rem)` }}>
              {grid.map((row, y) => row.map((cell, x) => {
                const bg =
                  cell === "S" ? "bg-green-400" :
                  cell === "E" ? "bg-orange-400" :
                  cell === "#" ? "bg-slate-800" :
                  cell === "." ? "bg-white" :
                  "bg-white";
                const symbol = cell === "S" ? charEmoji[char] : cell === "E" ? "🏁" : cell === "#" ? "" : "";
                return (
                  <div key={`${y}-${x}`} className={`w-6 h-6 flex items-center justify-center text-[10px] ${bg}`}>
                    {symbol}
                  </div>
                );
              }))}
            </div>
            <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400">
              <span>{charEmoji[char]} Départ</span><span>🏁 Arrivée</span><span className="inline-block w-3 h-3 bg-slate-800 rounded-sm align-middle" /> <span>Mur</span>
            </div>
          </div>
        )}

        {/* Commandes */}
        {cmds.length > 0 && (
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Commandes disponibles</div>
            <div className="flex flex-wrap gap-1">
              {cmds.map(cmd => (
                <code key={cmd} className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2 py-0.5 rounded-lg font-mono">{cmd}</code>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameType === "fill_blank") {
    const template = (params.template as string) ?? "";
    const answers = (params.answers as string[]) ?? [];
    return (
      <div className="space-y-2">
        {template && (
          <pre className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 line-clamp-3 whitespace-pre-wrap">
            {template.replace(/___/g, "[ ___ ]")}
          </pre>
        )}
        {answers.length > 0 && (
          <div className="text-xs text-slate-400">Réponses : <span className="text-slate-600 font-mono">{answers.join(", ")}</span></div>
        )}
      </div>
    );
  }

  if (gameType === "sort") {
    const items = (params.items as string[]) ?? [];
    return (
      <div className="space-y-1.5">
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-slate-300 font-mono text-xs w-4">{i + 1}.</span>
            <span className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-600 flex-1 line-clamp-1 text-xs">{item}</span>
          </div>
        ))}
        {items.length > 4 && <div className="text-xs text-slate-400 pl-6">+{items.length - 4} élément(s)</div>}
      </div>
    );
  }

  if (gameType === "memory") {
    const pairs = (params.pairs as { left: string; right: string }[]) ?? [];
    if (pairs.length === 0) return <em className="text-slate-400 text-sm">Aucune paire</em>;
    return (
      <div className="space-y-1.5">
        {pairs.slice(0, 3).map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="bg-purple-50 border border-purple-200 text-purple-700 font-semibold px-2.5 py-1 rounded-lg line-clamp-1 max-w-[140px]">{p.left}</span>
            <span className="text-slate-300 font-bold">↔</span>
            <span className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold px-2.5 py-1 rounded-lg line-clamp-1 flex-1">{p.right}</span>
          </div>
        ))}
        {pairs.length > 3 && <div className="text-xs text-slate-400">+{pairs.length - 3} paire(s)</div>}
      </div>
    );
  }

  return <span className="text-xs text-slate-400 italic">Type : {gameType}</span>;
}

// ── Forms ─────────────────────────────────────────────────────────────────────

type FormProps = { block: Block; onSave: (c: unknown) => void; onCancel: () => void; saving: boolean };

function normalizeBlockContent(block: Block): Record<string, unknown> {
  // Convert seeded single-question format → editor questions array
  if (block.type === "quiz" && block.content.question && !block.content.questions) {
    const c = block.content as any;
    return {
      questions: [{
        id: crypto.randomUUID(),
        question: c.question ?? "",
        type: "mcq",
        options: c.choices ?? [],
        correct: String(c.answer ?? 0),
        explanation: c.explanation ?? "",
      }],
    };
  }
  return block.content;
}

function BlockForm({ block, onSave, onCancel, saving }: FormProps) {
  const [content, setContent] = useState(() => normalizeBlockContent(block));

  function update(key: string, value: unknown) {
    setContent(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      {block.type === "text" && (() => {
        // Détecter le format : html (seedé) ou markdown (éditeur)
        const isHtml = !!(content.html as string);
        const rawValue = isHtml ? (content.html as string) ?? "" : (content.markdown as string) ?? "";
        return (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={label}>{isHtml ? "Contenu HTML" : "Contenu Markdown"}</label>
              {isHtml && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Format HTML — généré par seed</span>
              )}
            </div>
            <textarea
              rows={14}
              value={rawValue}
              onChange={e => isHtml ? update("html", e.target.value) : update("markdown", e.target.value)}
              placeholder={isHtml ? "<h2>Titre</h2>\n<p>Contenu…</p>" : "# Titre\n\nVotre contenu en **Markdown**…"}
              className={`${ic} resize-y font-mono text-xs leading-relaxed`}
            />
            <p className="text-xs text-slate-400 mt-1">
              {isHtml
                ? "HTML brut — modifiez directement les balises pour changer le contenu"
                : "Supporte : **gras**, `code`, # titres, tableaux Markdown, > citations"}
            </p>
          </div>
        );
      })()}

      {block.type === "video" && (
        <div className="space-y-4">
          <div>
            <label className={label}>URL de la vidéo *</label>
            <input type="url" value={(content.url as string) ?? ""}
              onChange={e => update("url", e.target.value)}
              placeholder="https://youtube.com/watch?v=…" className={ic} />
          </div>
          <div>
            <label className={label}>Titre (optionnel)</label>
            <input type="text" value={(content.title as string) ?? ""}
              onChange={e => update("title", e.target.value)} className={ic} />
          </div>
          <div>
            <label className={label}>Résumé / transcript (optionnel)</label>
            <textarea rows={3} value={(content.transcript as string) ?? ""}
              onChange={e => update("transcript", e.target.value)}
              className={`${ic} resize-none`} />
          </div>
        </div>
      )}

      {block.type === "quiz" && <QuizForm content={content} onChange={setContent} />}
      {block.type === "code_challenge" && <CodeChallengeForm content={content} onChange={setContent} />}
      {block.type === "game" && <GameForm content={content} onChange={setContent} />}

      <div className="flex gap-3 pt-1 border-t border-slate-100">
        <button onClick={() => onSave(content)} disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
          {saving ? "⏳ Enregistrement…" : "✅ Enregistrer"}
        </button>
        <button onClick={onCancel}
          className="border border-slate-200 text-slate-500 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}

// ── Quiz form ─────────────────────────────────────────────────────────────────

function QuizForm({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Question = { id: string; question: string; type: string; options: string[]; correct: string; explanation: string };
  const questions: Question[] = (content.questions as Question[]) ?? [];

  function addQuestion() {
    onChange({ ...content, questions: [...questions, { id: crypto.randomUUID(), question: "", type: "mcq", options: ["", "", "", ""], correct: "0", explanation: "" }] });
  }
  function updateQ(i: number, field: string, value: unknown) {
    const qs = [...questions]; qs[i] = { ...qs[i], [field]: value };
    onChange({ ...content, questions: qs });
  }
  function removeQ(i: number) {
    onChange({ ...content, questions: questions.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-violet-100 text-violet-700 text-xs font-black rounded-full flex items-center justify-center">{i + 1}</span>
              <span className="text-xs font-bold text-slate-500">Question {i + 1}</span>
            </div>
            <button onClick={() => removeQ(i)} className="text-xs text-slate-300 hover:text-red-500 font-bold w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">✕</button>
          </div>
          <input type="text" value={q.question} onChange={e => updateQ(i, "question", e.target.value)}
            placeholder="Quelle est la question ?" className={ic} />
          <select value={q.type} onChange={e => updateQ(i, "type", e.target.value)} className={ic}>
            <option value="mcq">QCM — Choix multiples</option>
            <option value="truefalse">Vrai / Faux</option>
            <option value="text">Texte libre</option>
          </select>
          {q.type === "mcq" && (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQ(i, "correct", String(oi))}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${q.correct === String(oi) ? "border-orange-500 bg-orange-500" : "border-slate-300 bg-white"}`}
                  />
                  <input type="text" value={opt}
                    onChange={e => { const opts = [...q.options]; opts[oi] = e.target.value; updateQ(i, "options", opts); }}
                    placeholder={`Option ${oi + 1}`} className={`${ic} flex-1`} />
                </div>
              ))}
              <p className="text-xs text-slate-400 pl-7">Cliquez sur le cercle pour marquer la bonne réponse</p>
            </div>
          )}
          {q.type === "truefalse" && (
            <div className="flex gap-3">
              {["Vrai", "Faux"].map(v => (
                <button key={v} type="button" onClick={() => updateQ(i, "correct", v)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${q.correct === v ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                  {v === "Vrai" ? "✅ Vrai" : "❌ Faux"}
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Explication (optionnel)</label>
            <input type="text" value={q.explanation} onChange={e => updateQ(i, "explanation", e.target.value)}
              placeholder="Pourquoi cette réponse est correcte…" className={ic} />
          </div>
        </div>
      ))}
      <button onClick={addQuestion}
        className="w-full py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-500 text-sm font-bold hover:border-violet-400 hover:bg-violet-50 transition-all">
        + Ajouter une question
      </button>
    </div>
  );
}

// ── Code challenge form ───────────────────────────────────────────────────────

function CodeChallengeForm({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Test = { input: string; expected: string };
  const tests: Test[] = (content.tests as Test[]) ?? [];

  function addTest() { onChange({ ...content, tests: [...tests, { input: "", expected: "" }] }); }
  function updateTest(i: number, field: string, value: string) {
    const ts = [...tests]; ts[i] = { ...ts[i], [field]: value };
    onChange({ ...content, tests: ts });
  }
  function removeTest(i: number) {
    onChange({ ...content, tests: tests.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Langage</label>
        <select value={(content.language as string) ?? "python"}
          onChange={e => onChange({ ...content, language: e.target.value })} className={ic}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>
      <div>
        <label className={label}>Code de départ</label>
        <textarea rows={6} value={(content.starter_code as string) ?? ""}
          onChange={e => onChange({ ...content, starter_code: e.target.value })}
          placeholder={"# Complète la fonction\ndef solution(n):\n    pass"}
          className={`${ic} resize-y font-mono text-xs leading-relaxed`} />
      </div>
      <div>
        <label className={label}>Tests automatiques</label>
        <div className="space-y-2">
          {tests.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={t.input} onChange={e => updateTest(i, "input", e.target.value)}
                placeholder="Entrée (ex: 5)" className={`${ic} flex-1 font-mono text-xs`} />
              <span className="text-slate-300 font-bold text-lg shrink-0">→</span>
              <input type="text" value={t.expected} onChange={e => updateTest(i, "expected", e.target.value)}
                placeholder="Sortie attendue" className={`${ic} flex-1 font-mono text-xs`} />
              <button onClick={() => removeTest(i)} className="text-slate-300 hover:text-red-500 font-bold shrink-0 w-6 h-6 flex items-center justify-center">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addTest}
          className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
          + Ajouter un test
        </button>
      </div>
    </div>
  );
}

// ── Game form ─────────────────────────────────────────────────────────────────

function GameForm({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const gameType = (content.game_type as string) ?? "";
  const params   = (content.params as Record<string, unknown>) ?? {};

  function setParam(key: string, value: unknown) {
    onChange({ ...content, params: { ...params, [key]: value } });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Type de jeu</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "kodi_output", icon: "💬", label: "Kodi parle", sub: "Blocs visuels Blockly" },
            { value: "maze",        icon: "🏃", label: "Labyrinthe", sub: "Algorithmique" },
            { value: "fill_blank",  icon: "🧩", label: "Puzzle code", sub: "Trous à compléter" },
            { value: "sort",        icon: "🔀", label: "Remise en ordre", sub: "Séquencer les étapes" },
            { value: "memory",      icon: "🃏", label: "Mémoire",    sub: "Associer les paires" },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => onChange({ ...content, game_type: opt.value, params: {}, instructions: (content.instructions as string) ?? "" })}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${gameType === opt.value ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <span className="text-xl">{opt.icon}</span>
              <div>
                <div className={`text-sm font-bold ${gameType === opt.value ? "text-orange-700" : "text-slate-700"}`}>{opt.label}</div>
                <div className="text-xs text-slate-400">{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {gameType === "kodi_output" && <KodiOutputForm content={content} onChange={onChange} />}

      {gameType === "maze" && (
        <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wide">Configuration du labyrinthe</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Personnage</label>
              <select value={(params.character as string) ?? "amavi"}
                onChange={e => setParam("character", e.target.value)} className={ic}>
                <option value="amavi">Amavi 👦</option>
                <option value="kofi">Kofi 🧑</option>
                <option value="robot">Robot 🤖</option>
                <option value="drone">Drone 🚁</option>
              </select>
            </div>
            <div>
              <label className={label}>Décor</label>
              <select value={(params.decor as string) ?? "village"}
                onChange={e => setParam("decor", e.target.value)} className={ic}>
                <option value="village">Village 🏘️</option>
                <option value="foret">Forêt 🌳</option>
                <option value="espace">Espace 🌌</option>
                <option value="laboratoire">Laboratoire 🧪</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Commandes disponibles</label>
            <div className="grid grid-cols-3 gap-2">
              {["avancer", "reculer", "tourner_gauche", "tourner_droite", "repeter", "si"].map(cmd => {
                const active = ((params.commands as string[]) ?? []).includes(cmd);
                return (
                  <button key={cmd} type="button"
                    onClick={() => {
                      const cmds = new Set((params.commands as string[]) ?? []);
                      active ? cmds.delete(cmd) : cmds.add(cmd);
                      setParam("commands", Array.from(cmds));
                    }}
                    className={`text-xs font-mono font-bold py-1.5 px-2 rounded-lg border-2 transition-colors ${active ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                    {cmd}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={label}>Indices (un par ligne)</label>
            <textarea rows={3}
              value={((params.hints as string[]) ?? []).join("\n")}
              onChange={e => setParam("hints", e.target.value.split("\n").filter(Boolean))}
              placeholder={"Pense à la boucle…\nTu dois tourner 2 fois"}
              className={`${ic} resize-none text-xs`} />
          </div>
        </div>
      )}

      {gameType === "fill_blank" && (
        <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div>
            <label className={label}>Code avec trous — utilisez ___ pour chaque blanc</label>
            <textarea rows={5}
              value={(params.template as string) ?? ""}
              onChange={e => setParam("template", e.target.value)}
              placeholder={"for i in ___(5):\n    print(___)"}
              className={`${ic} resize-y font-mono text-xs`} />
          </div>
          <div>
            <label className={label}>Réponses (dans l'ordre, séparées par virgule)</label>
            <input type="text"
              value={((params.answers as string[]) ?? []).join(", ")}
              onChange={e => setParam("answers", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              placeholder="range, i" className={ic} />
          </div>
          <div>
            <label className={label}>Contexte / objectif</label>
            <input type="text"
              value={(params.context as string) ?? ""}
              onChange={e => setParam("context", e.target.value)}
              placeholder="Affiche les nombres de 0 à 4" className={ic} />
          </div>
        </div>
      )}

      {gameType === "sort" && (
        <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div>
            <label className={label}>Éléments à trier (un par ligne, dans le bon ordre)</label>
            <textarea rows={6}
              value={((params.items as string[]) ?? []).join("\n")}
              onChange={e => setParam("items", e.target.value.split("\n").filter(Boolean))}
              placeholder={"Déclarer la variable\nEntrer la valeur\nAfficher le résultat"}
              className={`${ic} resize-none`} />
          </div>
          <div>
            <label className={label}>Affichage</label>
            <select value={(params.display as string) ?? "liste"}
              onChange={e => setParam("display", e.target.value)} className={ic}>
              <option value="liste">Liste</option>
              <option value="cartes">Cartes</option>
              <option value="blocs_code">Blocs de code</option>
            </select>
          </div>
        </div>
      )}

      {gameType === "memory" && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <label className={label}>Paires (terme = définition, une par ligne)</label>
          <textarea rows={6}
            value={((params.pairs as { left: string; right: string }[]) ?? []).map(p => `${p.left} = ${p.right}`).join("\n")}
            onChange={e => {
              const pairs = e.target.value.split("\n").filter(Boolean).map(line => {
                const [left, ...rest] = line.split("=");
                return { left: left?.trim() ?? "", right: rest.join("=").trim() };
              });
              setParam("pairs", pairs);
            }}
            placeholder={"int = Nombre entier\nstr = Chaîne de texte\nbool = Vrai ou Faux"}
            className={`${ic} resize-y mt-1`} />
        </div>
      )}
    </div>
  );
}

// ── Kodi Output form ──────────────────────────────────────────────────────────

const ALL_BLOCKS = [
  { id: "kodi_say",            label: "💬 Kodi dit",      cat: "kodi" },
  { id: "kodi_think",          label: "💭 Kodi pense",    cat: "kodi" },
  { id: "controls_repeat_ext", label: "🔁 Répéter N fois",cat: "control" },
  { id: "controls_if",         label: "❓ Si … alors",    cat: "control" },
  { id: "logic_compare",       label: "⚖️ Comparer",      cat: "logic" },
  { id: "variables_set",       label: "📦 Créer variable", cat: "variable" },
  { id: "variables_get",       label: "📤 Lire variable",  cat: "variable" },
  { id: "text",                label: "🔤 Texte",          cat: "text" },
  { id: "math_number",         label: "🔢 Nombre",         cat: "math" },
  { id: "math_arithmetic",     label: "➕ Calcul",          cat: "math" },
  { id: "text_join",           label: "🔗 Assembler texte",cat: "text" },
];

const CAT_COLORS: Record<string, string> = {
  kodi:     "bg-orange-100 border-orange-300 text-orange-700 data-[on=true]:bg-orange-500 data-[on=true]:border-orange-500 data-[on=true]:text-white",
  control:  "bg-yellow-50 border-yellow-300 text-yellow-700 data-[on=true]:bg-yellow-500 data-[on=true]:border-yellow-500 data-[on=true]:text-white",
  logic:    "bg-blue-50 border-blue-300 text-blue-700 data-[on=true]:bg-blue-500 data-[on=true]:border-blue-500 data-[on=true]:text-white",
  variable: "bg-violet-50 border-violet-300 text-violet-700 data-[on=true]:bg-violet-500 data-[on=true]:border-violet-500 data-[on=true]:text-white",
  text:     "bg-slate-50 border-slate-300 text-slate-700 data-[on=true]:bg-slate-500 data-[on=true]:border-slate-500 data-[on=true]:text-white",
  math:     "bg-emerald-50 border-emerald-300 text-emerald-700 data-[on=true]:bg-emerald-500 data-[on=true]:border-emerald-500 data-[on=true]:text-white",
};

function KodiOutputForm({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const instructions     = (content.instructions as string) ?? "";
  const expectedLines    = (content.expected_lines as string[]) ?? [];
  const expectedContains = (content.expected_contains as string[]) ?? [];
  const maxBlocks        = (content.max_blocks as number | undefined) ?? "";
  const availableBlocks  = (content.available_blocks as string[]) ?? ["kodi_say", "kodi_think", "controls_repeat_ext", "text", "math_number"];
  const [activeTab, setActiveTab] = React.useState<"config" | "preview">("config");

  function toggleBlock(id: string) {
    const next = availableBlocks.includes(id) ? availableBlocks.filter(b => b !== id) : [...availableBlocks, id];
    onChange({ ...content, available_blocks: next });
  }
  function updateLine(i: number, val: string) {
    const next = [...expectedLines]; next[i] = val;
    onChange({ ...content, expected_lines: next });
  }
  function addLine() { onChange({ ...content, expected_lines: [...expectedLines, ""] }); }
  function removeLine(i: number) { onChange({ ...content, expected_lines: expectedLines.filter((_, idx) => idx !== i) }); }
  function updateKeyword(i: number, val: string) {
    const next = [...expectedContains]; next[i] = val;
    onChange({ ...content, expected_contains: next });
  }
  function addKeyword() { onChange({ ...content, expected_contains: [...expectedContains, ""] }); }
  function removeKeyword(i: number) { onChange({ ...content, expected_contains: expectedContains.filter((_, idx) => idx !== i) }); }

  const blockColor = (id: string) => {
    const b = ALL_BLOCKS.find(x => x.id === id);
    return b ? CAT_COLORS[b.cat] : CAT_COLORS.text;
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {(["config", "preview"] as const).map(t => (
          <button key={t} type="button" onClick={() => setActiveTab(t)}
            className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all ${activeTab === t ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "config" ? "⚙️ Configuration" : "👁️ Aperçu élève"}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="space-y-5">
          {/* Instructions */}
          <div>
            <label className={label}>Consigne affichée à l'élève <span className="font-normal text-slate-300 normal-case">(HTML)</span></label>
            <textarea rows={4} value={instructions}
              onChange={e => onChange({ ...content, instructions: e.target.value })}
              className={`${ic} resize-y text-xs font-mono`}
              placeholder={"<h3>🎯 Mission</h3>\n<p>Fais dire à Kodi <strong>Bonjour !</strong></p>"} />
          </div>

          {/* Validation mode selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border-2 p-3 cursor-pointer transition-all ${expectedLines.length > 0 || expectedContains.length === 0 ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              onClick={() => { onChange({ ...content, expected_contains: [] }); }}>
              <div className="font-bold text-sm text-slate-700">📋 Lignes exactes</div>
              <div className="text-xs text-slate-400 mt-0.5">Kodi doit dire exactement ces phrases</div>
            </div>
            <div className={`rounded-xl border-2 p-3 cursor-pointer transition-all ${expectedContains.length > 0 ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              onClick={() => { onChange({ ...content, expected_lines: [] }); }}>
              <div className="font-bold text-sm text-slate-700">🔍 Mots-clés libres</div>
              <div className="text-xs text-slate-400 mt-0.5">La sortie doit contenir ces termes</div>
            </div>
          </div>

          {/* Expected lines */}
          {expectedContains.length === 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${label} mb-0`}>Ce que Kodi doit dire (ordre exact)</label>
                <button type="button" onClick={addLine}
                  className="text-xs font-bold text-orange-500 hover:text-orange-700 hover:underline">+ Ligne</button>
              </div>
              {expectedLines.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">Aucune ligne — exercice libre (Kodi dit ce que l'élève programme).</p>
              )}
              <div className="space-y-2">
                {expectedLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <input value={line} onChange={e => updateLine(i, e.target.value)}
                      className={`${ic} flex-1 font-mono text-xs`}
                      placeholder={`Ligne ${i + 1}…`} />
                    <button type="button" onClick={() => removeLine(i)} className="text-slate-300 hover:text-red-500 font-bold flex-shrink-0 w-6 h-6 flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {expectedLines.length === 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${label} mb-0`}>Mots-clés obligatoires</label>
                <button type="button" onClick={addKeyword}
                  className="text-xs font-bold text-blue-500 hover:text-blue-700 hover:underline">+ Mot-clé</button>
              </div>
              <div className="space-y-2">
                {expectedContains.map((kw, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={kw} onChange={e => updateKeyword(i, e.target.value)}
                      className={`${ic} flex-1 font-mono text-xs`}
                      placeholder="Mot ou phrase que la sortie doit contenir…" />
                    <button type="button" onClick={() => removeKeyword(i)} className="text-slate-300 hover:text-red-500 font-bold w-6 h-6 flex items-center justify-center">✕</button>
                  </div>
                ))}
                {expectedContains.length === 0 && <p className="text-xs text-slate-400 italic py-1">Aucun mot-clé.</p>}
              </div>
            </div>
          )}

          {/* Max blocks */}
          <div>
            <label className={label}>Limite de blocs <span className="font-normal text-slate-300 normal-case">(optionnel)</span></label>
            <input type="number" min={1} value={maxBlocks}
              onChange={e => onChange({ ...content, max_blocks: e.target.value ? Number(e.target.value) : undefined })}
              className={ic} placeholder="Ex : 5 — laissez vide pour illimité" />
          </div>

          {/* Available blocks */}
          <div>
            <label className={label}>Blocs que l'élève peut utiliser</label>
            <div className="flex flex-wrap gap-2">
              {ALL_BLOCKS.map(b => {
                const on = availableBlocks.includes(b.id);
                return (
                  <button key={b.id} type="button" onClick={() => toggleBlock(b.id)}
                    data-on={on}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${CAT_COLORS[b.cat]} ${on ? "opacity-100" : "opacity-60 hover:opacity-90"}`}>
                    {b.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2">{availableBlocks.length} bloc(s) sélectionné(s)</p>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="bg-slate-900 rounded-2xl p-5 space-y-5">
          <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Aperçu — vue élève</div>

          {instructions && (
            <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-200 leading-relaxed [&_h3]:font-black [&_h3]:text-white [&_strong]:text-white [&_code]:text-amber-300 [&_code]:font-mono [&_code]:text-xs"
              dangerouslySetInnerHTML={{ __html: instructions }} />
          )}

          <div>
            <div className="text-[10px] font-black text-slate-600 uppercase mb-2">Boîte à blocs disponible</div>
            <div className="flex flex-wrap gap-2">
              {availableBlocks.map(id => {
                const b = ALL_BLOCKS.find(x => x.id === id);
                if (!b) return null;
                const preview = id.startsWith("kodi_") ? "bg-orange-800/70 border-orange-600 text-orange-200"
                  : id.startsWith("controls_") ? "bg-yellow-800/70 border-yellow-600 text-yellow-200"
                  : id.startsWith("variables_") ? "bg-violet-800/70 border-violet-600 text-violet-200"
                  : id.startsWith("logic_") ? "bg-blue-800/70 border-blue-600 text-blue-200"
                  : id.startsWith("math_") ? "bg-emerald-800/70 border-emerald-600 text-emerald-200"
                  : "bg-slate-700 border-slate-600 text-slate-200";
                return (
                  <span key={id} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${preview}`}>{b.label}</span>
                );
              })}
              {availableBlocks.length === 0 && <span className="text-xs text-slate-600 italic">Aucun bloc sélectionné</span>}
            </div>
          </div>

          {expectedLines.filter(Boolean).length > 0 && (
            <div>
              <div className="text-[10px] font-black text-slate-600 uppercase mb-2">Résultat attendu</div>
              <div className="flex gap-3 items-start">
                <div className="text-3xl flex-shrink-0">🤖</div>
                <div className="space-y-2 flex-1">
                  {expectedLines.filter(Boolean).map((line, i) => (
                    <div key={i} className="bg-orange-900/60 border border-orange-700/60 text-orange-100 text-sm font-mono rounded-2xl px-4 py-2">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {expectedLines.filter(Boolean).length === 0 && expectedContains.filter(Boolean).length > 0 && (
            <div>
              <div className="text-[10px] font-black text-slate-600 uppercase mb-2">Mots-clés attendus dans la sortie</div>
              <div className="flex flex-wrap gap-2">
                {expectedContains.filter(Boolean).map((kw, i) => (
                  <span key={i} className="bg-blue-900/60 border border-blue-700 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-full">🔍 {kw}</span>
                ))}
              </div>
            </div>
          )}

          {expectedLines.filter(Boolean).length === 0 && expectedContains.filter(Boolean).length === 0 && (
            <div className="text-xs text-slate-600 italic">Exercice libre — Kodi dit ce que l'élève programme.</div>
          )}

          {maxBlocks && <div className="text-xs text-slate-500">🧱 Maximum {maxBlocks} blocs autorisés</div>}
        </div>
      )}
    </div>
  );
}
