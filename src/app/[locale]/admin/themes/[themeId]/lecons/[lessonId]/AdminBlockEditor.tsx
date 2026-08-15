"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { adminCreateBlock, adminUpdateBlock, adminDeleteBlock, adminMoveBlock } from "./actions";
import type { BlockType } from "@/lib/supabase/types";

const RichTextEditor = dynamic(() => import("@/components/editor/lesson/RichTextEditor"), { ssr: false });

type Block = { id: string; type: BlockType; content: Record<string, unknown>; order_index: number };

const TYPE_META: Record<BlockType, { label: string; icon: string; color: string; desc: string }> = {
  text:           { label: "Texte",     icon: "📝", color: "border-l-blue-400 bg-blue-50/40",       desc: "Contenu HTML enrichi (éditeur visuel)" },
  video:          { label: "Vidéo",     icon: "🎬", color: "border-l-pink-400 bg-pink-50/40",       desc: "Vidéo YouTube / Vimeo" },
  quiz:           { label: "Quiz",      icon: "❓", color: "border-l-violet-400 bg-violet-50/40",   desc: "QCM, Vrai/Faux, texte libre" },
  code_challenge: { label: "Défi code", icon: "💻", color: "border-l-emerald-400 bg-emerald-50/40", desc: "Éditeur + tests auto" },
  game:           { label: "Jeu",       icon: "🎮", color: "border-l-orange-400 bg-orange-50/40",   desc: "Kodi / Labyrinthe / Puzzle" },
};

const ic = "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white placeholder:text-slate-400";
const lbl = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide";

export default function AdminBlockEditor({
  blocks,
  lessonId,
  themeId,
}: {
  blocks: Block[];
  lessonId: string;
  themeId: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd(type: BlockType) {
    setShowAddMenu(false);
    setSaving(true);
    const result = await adminCreateBlock(lessonId, themeId, type);
    setSaving(false);
    if (result?.id) router.refresh();
  }

  async function handleSave(blockId: string, content: unknown) {
    setSaving(true);
    await adminUpdateBlock(blockId, themeId, lessonId, content);
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(blockId: string) {
    if (!confirm("Supprimer ce bloc ?")) return;
    await adminDeleteBlock(blockId, themeId, lessonId);
    router.refresh();
  }

  async function handleMove(blockId: string, direction: "up" | "down") {
    await adminMoveBlock(blockId, lessonId, themeId, direction);
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
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <span className="text-base">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-slate-700">{meta.label}</span>
                <span className="ml-2 text-xs text-slate-400">{meta.desc}</span>
              </div>
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
            </div>

            {!isEditing && (
              <div className="px-5 py-4">
                <BlockPreview block={block} />
              </div>
            )}

            {isEditing && (
              <div className="px-5 py-5 bg-slate-50/60 border-t border-slate-100">
                <BlockForm
                  block={block}
                  onSave={(content) => handleSave(block.id, content)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </div>
            )}
          </div>
        );
      })}

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
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Type de bloc</div>
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
              className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 w-full text-center">Annuler</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview ───────────────────────────────────────────────────────────────────

function BlockPreview({ block }: { block: Block }) {
  const c = block.content;

  if (block.type === "text") {
    const html = (c.html as string) || "";
    if (html) return (
      <div className="prose prose-sm max-w-none text-slate-700 [&_h2]:text-base [&_h2]:font-black [&_h3]:text-sm [&_h3]:font-bold [&_pre]:text-xs [&_table]:text-xs [&_td]:p-1 [&_th]:p-1"
        dangerouslySetInnerHTML={{ __html: html }} />
    );
    const md = (c.markdown as string) || "";
    if (!md) return <em className="text-slate-400 text-sm">Aucun contenu</em>;
    return <div className="text-sm text-slate-500 italic line-clamp-3 whitespace-pre-line">{md.slice(0, 200)}</div>;
  }

  if (block.type === "video") {
    const url = (c.url as string) ?? "";
    const title = (c.title as string) ?? "";
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-9 bg-pink-100 rounded-lg flex items-center justify-center text-lg shrink-0">▶️</div>
        <div className="min-w-0">
          {title && <div className="font-semibold text-sm text-slate-700 truncate">{title}</div>}
          <div className="text-xs text-slate-400 truncate">{url || "URL non définie"}</div>
        </div>
      </div>
    );
  }

  if (block.type === "quiz") {
    const qs = (c.questions as { question: string; type: string }[]) ?? [];
    const singleQ = c.question as string | undefined;
    const displayQs = singleQ ? [{ question: singleQ, type: "mcq" }] : qs;
    if (displayQs.length === 0) return <em className="text-slate-400 text-sm">Aucune question</em>;
    return (
      <div className="space-y-1.5">
        {displayQs.slice(0, 3).map((q, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-violet-400 font-black shrink-0 mt-0.5">{i + 1}.</span>
            <span className="text-slate-600 line-clamp-1">{q.question || "Question vide"}</span>
          </div>
        ))}
        {displayQs.length > 3 && <div className="text-xs text-slate-400 pl-5">+{displayQs.length - 3} autre(s)</div>}
      </div>
    );
  }

  if (block.type === "code_challenge") {
    const lang = (c.language as string) || "python";
    const tests = ((c.tests as unknown[]) ?? []).length;
    return (
      <div className="flex gap-2 items-center">
        <span className="bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono">{lang}</span>
        <span className="text-xs text-slate-400">{tests} test{tests !== 1 ? "s" : ""}</span>
      </div>
    );
  }

  if (block.type === "game") {
    const gameType = (c.game_type as string) ?? "—";
    return <span className="text-xs text-slate-400 italic">🎮 {gameType || "Type non configuré"}</span>;
  }

  return null;
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function normalizeBlock(block: Block): Record<string, unknown> {
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

function BlockForm({ block, onSave, onCancel, saving }: {
  block: Block;
  onSave: (c: unknown) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [content, setContent] = useState(() => normalizeBlock(block));

  function update(key: string, value: unknown) {
    setContent(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      {block.type === "text" && (
        <div>
          <label className={lbl}>Contenu du bloc texte</label>
          <RichTextEditor
            value={(content.html as string) || (content.markdown as string) || ""}
            onChange={(html) => setContent({ html })}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Supporte : tableaux, images, listes, titres, liens, code inline — sauvegardé en HTML.
          </p>
        </div>
      )}

      {block.type === "video" && (
        <div className="space-y-4">
          <div>
            <label className={lbl}>URL de la vidéo *</label>
            <input type="url" value={(content.url as string) ?? ""}
              onChange={e => update("url", e.target.value)}
              placeholder="https://youtube.com/watch?v=…" className={ic} />
          </div>
          <div>
            <label className={lbl}>Titre (optionnel)</label>
            <input type="text" value={(content.title as string) ?? ""}
              onChange={e => update("title", e.target.value)} className={ic} />
          </div>
          <div>
            <label className={lbl}>Transcription / résumé (optionnel)</label>
            <textarea rows={3} value={(content.transcript as string) ?? ""}
              onChange={e => update("transcript", e.target.value)}
              className={`${ic} resize-none`} />
          </div>
        </div>
      )}

      {block.type === "quiz" && <QuizForm content={content} onChange={setContent} />}
      {block.type === "code_challenge" && <CodeChallengeForm content={content} onChange={setContent} />}
      {block.type === "game" && <GamePlaceholder />}

      <div className="flex gap-3 pt-2 border-t border-slate-100">
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

// ── Quiz ──────────────────────────────────────────────────────────────────────

function QuizForm({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Q = { id: string; question: string; type: string; options: string[]; correct: string; explanation: string };
  const questions: Q[] = (content.questions as Q[]) ?? [];

  function addQ() {
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
            <span className="w-6 h-6 bg-violet-100 text-violet-700 text-xs font-black rounded-full flex items-center justify-center">{i + 1}</span>
            <button onClick={() => removeQ(i)} className="text-xs text-slate-300 hover:text-red-500 font-bold w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50">✕</button>
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
                  <button type="button" onClick={() => updateQ(i, "correct", String(oi))}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${q.correct === String(oi) ? "border-orange-500 bg-orange-500" : "border-slate-300 bg-white"}`} />
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
      <button onClick={addQ}
        className="w-full py-3 rounded-xl border-2 border-dashed border-violet-200 text-violet-500 text-sm font-bold hover:border-violet-400 hover:bg-violet-50 transition-all">
        + Ajouter une question
      </button>
    </div>
  );
}

// ── Code challenge ────────────────────────────────────────────────────────────

function CodeChallengeForm({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  type Test = { input: string; expected: string };
  const tests: Test[] = (content.tests as Test[]) ?? [];

  function addTest() { onChange({ ...content, tests: [...tests, { input: "", expected: "" }] }); }
  function updateTest(i: number, field: string, value: string) {
    const ts = [...tests]; ts[i] = { ...ts[i], [field]: value };
    onChange({ ...content, tests: ts });
  }
  function removeTest(i: number) { onChange({ ...content, tests: tests.filter((_, j) => j !== i) }); }

  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Langage</label>
        <select value={(content.language as string) ?? "python"}
          onChange={e => onChange({ ...content, language: e.target.value })} className={ic}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Code de départ</label>
        <textarea rows={6} value={(content.starter_code as string) ?? ""}
          onChange={e => onChange({ ...content, starter_code: e.target.value })}
          placeholder={"# Complète la fonction\ndef solution(n):\n    pass"}
          className={`${ic} resize-y font-mono text-xs leading-relaxed`} />
      </div>
      <div>
        <label className={lbl}>Tests automatiques (entrée → sortie attendue)</label>
        <div className="space-y-2">
          {tests.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" value={t.input} onChange={e => updateTest(i, "input", e.target.value)}
                placeholder="Entrée" className={`${ic} flex-1 font-mono text-xs`} />
              <span className="text-slate-300 font-bold text-lg shrink-0">→</span>
              <input type="text" value={t.expected} onChange={e => updateTest(i, "expected", e.target.value)}
                placeholder="Sortie attendue" className={`${ic} flex-1 font-mono text-xs`} />
              <button onClick={() => removeTest(i)} className="text-slate-300 hover:text-red-500 font-bold shrink-0 w-6 h-6 flex items-center justify-center">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addTest} className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
          + Ajouter un test
        </button>
      </div>
    </div>
  );
}

function GamePlaceholder() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 font-bold">
      🎮 Pour éditer les jeux (Kodi, Labyrinthe, Puzzle…) utilisez l'interface Manager.
      <br />
      <span className="font-normal text-amber-600">L'éditeur de jeux avancé est disponible dans le panneau Manager → Thèmes.</span>
    </div>
  );
}
