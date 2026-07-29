"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTrainingBlock, updateTrainingBlock,
  deleteTrainingBlock, moveTrainingBlock,
} from "../../../../../actions";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

const BLOCK_TYPES = [
  { type: "quiz",              label: "Quiz flash",        icon: "🧠", desc: "Questions QCM de révision" },
  { type: "code_challenge",    label: "Mini-défi code",    icon: "💻", desc: "Exercice Python court" },
  { type: "blockly_challenge", label: "Défi Blockly",      icon: "📦", desc: "Exercice visuel par blocs" },
  { type: "text",              label: "Texte/Rappel",      icon: "📝", desc: "Note, rappel de cours" },
];

const ICONS: Record<string, string>  = { quiz: "🧠", code_challenge: "💻", blockly_challenge: "📦", text: "📝" };
const LABELS: Record<string, string> = { quiz: "Quiz flash", code_challenge: "Mini-défi code", blockly_challenge: "Défi Blockly", text: "Texte/Rappel" };

const ic = "w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white";
const ta = ic + " resize-none";

type Props = {
  blocks: Block[];
  lessonBlocks: Block[];
  trainingId: string;
  lessonId: string;
  themeId: string;
};

export default function TrainingBlockEditor({ blocks, lessonBlocks, trainingId, lessonId, themeId }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isPending, start] = useTransition();

  async function handleAdd(type: string) {
    setShowAddMenu(false);
    start(async () => {
      const res = await createTrainingBlock(trainingId, lessonId, themeId, type);
      if (res?.id) router.refresh();
    });
  }

  async function handleSave(blockId: string, content: unknown) {
    start(async () => {
      await updateTrainingBlock(blockId, trainingId, lessonId, themeId, content);
      setEditingId(null);
      router.refresh();
    });
  }

  async function handleDelete(blockId: string) {
    if (!confirm("Supprimer ce bloc ?")) return;
    start(async () => {
      await deleteTrainingBlock(blockId, trainingId, lessonId, themeId);
      router.refresh();
    });
  }

  async function handleMove(blockId: string, dir: "up" | "down") {
    start(async () => {
      await moveTrainingBlock(blockId, trainingId, lessonId, themeId, dir);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-cream-border p-10 text-center">
          <div className="text-4xl mb-3">💪</div>
          <div className="font-bold text-ink mb-1">Aucun bloc</div>
          <div className="text-sm text-ink-muted">Ajoutez des exercices de révision ci-dessous.</div>
        </div>
      )}

      {blocks.map((block, i) => (
        <div key={block.id} className="bg-white rounded-2xl border border-cream-border overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-cream border-b border-cream-border">
            <span className="text-lg">{ICONS[block.type] ?? "📦"}</span>
            <span className="font-bold text-sm text-ink flex-1">{LABELS[block.type] ?? block.type}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleMove(block.id, "up")} disabled={i === 0 || isPending} className="text-ink-muted hover:text-ink disabled:opacity-30 px-1 text-xs">▲</button>
              <button onClick={() => handleMove(block.id, "down")} disabled={i === blocks.length - 1 || isPending} className="text-ink-muted hover:text-ink disabled:opacity-30 px-1 text-xs">▼</button>
              <button onClick={() => setEditingId(editingId === block.id ? null : block.id)} className="text-xs font-bold text-brand-orange hover:underline px-2">
                {editingId === block.id ? "Fermer" : "Éditer"}
              </button>
              <button onClick={() => handleDelete(block.id)} className="text-xs font-bold text-red-400 hover:text-red-600 px-2">Suppr.</button>
            </div>
          </div>

          {editingId === block.id && (
            <div className="p-5">
              <BlockForm type={block.type} initial={block.content} onSave={(c) => handleSave(block.id, c)} saving={isPending} />
            </div>
          )}
        </div>
      ))}

      {/* Add block */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(v => !v)}
          className="w-full border-2 border-dashed border-cream-border rounded-2xl py-4 text-sm font-bold text-ink-muted hover:border-brand-orange hover:text-brand-orange transition-colors flex items-center justify-center gap-2"
        >
          + Ajouter un bloc
        </button>
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-white rounded-2xl border border-cream-border shadow-xl p-3 grid grid-cols-3 gap-2">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => handleAdd(bt.type)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-cream text-center transition-colors group">
                <span className="text-2xl">{bt.icon}</span>
                <span className="font-black text-xs text-ink">{bt.label}</span>
                <span className="text-[10px] text-ink-muted">{bt.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockForm({ type, initial, onSave, saving }: { type: string; initial: Record<string, unknown>; onSave: (c: unknown) => void; saving: boolean }) {
  const [content, setContent] = useState(initial);

  function update(key: string, value: unknown) {
    setContent(prev => ({ ...prev, [key]: value }));
  }

  if (type === "text") {
    return (
      <div className="space-y-3">
        <label className="block text-xs font-black text-ink-muted uppercase tracking-wider">Contenu Markdown</label>
        <textarea rows={6} value={(content.markdown as string) ?? ""} onChange={e => update("markdown", e.target.value)} className={ta} placeholder="## Rappel&#10;&#10;En Python, **print()** affiche du texte." />
        <button onClick={() => onSave(content)} disabled={saving} className="bg-brand-orange text-white font-black px-5 py-2 rounded-xl text-sm disabled:opacity-50">
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
    );
  }

  if (type === "quiz") {
    const questions: { question: string; choices: string[]; answer: number; explanation?: string }[] =
      (content.questions as any[]) ?? [];

    function updateQuestion(qi: number, key: string, value: unknown) {
      const updated = questions.map((q, i) => i === qi ? { ...q, [key]: value } : q);
      update("questions", updated);
    }
    function addQuestion() {
      update("questions", [...questions, { question: "", choices: ["", "", "", ""], answer: 0, explanation: "" }]);
    }
    function removeQuestion(qi: number) {
      update("questions", questions.filter((_, i) => i !== qi));
    }

    return (
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="border border-cream-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-ink-muted uppercase">Question {qi + 1}</span>
              <button onClick={() => removeQuestion(qi)} className="text-xs text-red-400 hover:text-red-600 font-bold">Supprimer</button>
            </div>
            <input value={q.question} onChange={e => updateQuestion(qi, "question", e.target.value)} className={ic} placeholder="La question…" />
            {q.choices.map((choice, ci) => (
              <div key={ci} className="flex gap-2">
                <input type="radio" name={`answer-${qi}`} checked={q.answer === ci} onChange={() => updateQuestion(qi, "answer", ci)} className="mt-3" />
                <input value={choice} onChange={e => {
                  const nc = [...q.choices]; nc[ci] = e.target.value;
                  updateQuestion(qi, "choices", nc);
                }} className={ic} placeholder={`Choix ${["A","B","C","D"][ci]}`} />
              </div>
            ))}
            <input value={q.explanation ?? ""} onChange={e => updateQuestion(qi, "explanation", e.target.value)} className={ic} placeholder="Explication (optionnelle)" />
          </div>
        ))}
        <button onClick={addQuestion} className="w-full border-2 border-dashed border-cream-border rounded-xl py-3 text-sm font-bold text-ink-muted hover:border-brand-orange hover:text-brand-orange transition-colors">
          + Ajouter une question
        </button>
        <button onClick={() => onSave(content)} disabled={saving} className="bg-brand-orange text-white font-black px-5 py-2 rounded-xl text-sm disabled:opacity-50">
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
    );
  }

  if (type === "code_challenge") {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Instructions (HTML)</label>
          <textarea rows={3} value={(content.instructions as string) ?? ""} onChange={e => update("instructions", e.target.value)} className={ta} placeholder="<p>Écris une boucle qui affiche…</p>" />
        </div>
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Code de départ</label>
          <textarea rows={4} value={(content.starter_code as string) ?? ""} onChange={e => update("starter_code", e.target.value)} className={ta + " font-mono"} placeholder="# Code ici" />
        </div>
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Tests cachés (Python assert)</label>
          <textarea rows={3} value={(content.hidden_tests as string) ?? ""} onChange={e => update("hidden_tests", e.target.value)} className={ta + " font-mono"} placeholder={`assert "bonjour" in output.lower(), "Affiche bonjour"`} />
        </div>
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Sortie attendue (si pas de tests cachés)</label>
          <input value={(content.expected_output as string) ?? ""} onChange={e => update("expected_output", e.target.value)} className={ic + " font-mono"} placeholder="Hello World" />
        </div>
        <button onClick={() => onSave(content)} disabled={saving} className="bg-brand-orange text-white font-black px-5 py-2 rounded-xl text-sm disabled:opacity-50">
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
    );
  }

  if (type === "blockly_challenge") {
    const rawBlocks = content.available_blocks;
    const blocksAsString = Array.isArray(rawBlocks) ? rawBlocks.join(", ") : (rawBlocks as string) ?? "";
    const expected_lines: string[] = (content.expected_lines as string[]) ?? [];
    const expected_contains: string[] = (content.expected_contains as string[]) ?? [];

    function setLines(raw: string) {
      update("expected_lines", raw.split("\n").map(s => s.trim()).filter(Boolean));
    }
    function setContains(raw: string) {
      update("expected_contains", raw.split("\n").map(s => s.trim()).filter(Boolean));
    }
    function setBlocks(raw: string) {
      update("available_blocks", raw.split(",").map(s => s.trim()).filter(Boolean));
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Instructions (HTML)</label>
          <textarea rows={3} value={(content.instructions as string) ?? ""} onChange={e => update("instructions", e.target.value)} className={ta} placeholder="<p>Fais bouger Kodi vers la droite 3 fois…</p>" />
        </div>
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Blocs disponibles (séparés par virgule)</label>
          <input
            value={blocksAsString}
            onChange={e => setBlocks(e.target.value)}
            className={ic}
            placeholder="move_right, move_left, loop, if_wall"
          />
          <p className="text-[10px] text-ink-muted mt-1">Blocs Blockly autorisés dans cet exercice</p>
        </div>
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Lignes de code attendues (1 par ligne)</label>
          <textarea rows={3} value={expected_lines.join("\n")} onChange={e => setLines(e.target.value)} className={ta + " font-mono"} placeholder={"moveRight()\nmoveRight()\nmoveRight()"} />
          <p className="text-[10px] text-ink-muted mt-1">Le programme généré doit contenir exactement ces lignes (dans l'ordre)</p>
        </div>
        <div>
          <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Mots-clés requis dans le code (1 par ligne)</label>
          <textarea rows={3} value={expected_contains.join("\n")} onChange={e => setContains(e.target.value)} className={ta + " font-mono"} placeholder={"moveRight\nfor"} />
          <p className="text-[10px] text-ink-muted mt-1">Alternative flexible : le code doit au moins contenir ces termes</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Nb max de blocs</label>
            <input type="number" min={1} max={50} value={(content.max_blocks as number) ?? 10} onChange={e => update("max_blocks", Number(e.target.value))} className={ic} />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!(content.required)} onChange={e => update("required", e.target.checked)} className="w-4 h-4 accent-brand-orange" />
              <span className="text-sm font-bold text-ink">Obligatoire pour terminer</span>
            </label>
          </div>
        </div>
        <button onClick={() => onSave(content)} disabled={saving} className="bg-brand-orange text-white font-black px-5 py-2 rounded-xl text-sm disabled:opacity-50">
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
    );
  }

  return null;
}
