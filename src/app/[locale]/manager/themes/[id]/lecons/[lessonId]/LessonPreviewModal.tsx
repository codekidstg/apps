"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

type Props = {
  title: string;
  xpReward: number;
  blocks: Block[];
};

export function LessonPreviewModal({ title, xpReward, blocks }: Props) {
  const [open, setOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean | null>>({});

  function reset() {
    setQuizAnswers({});
    setQuizResults({});
  }

  function answerQuiz(blockId: string, idx: number, correct: number) {
    if (quizResults[blockId] != null) return;
    setQuizAnswers((p) => ({ ...p, [blockId]: idx }));
    setQuizResults((p) => ({ ...p, [blockId]: idx === correct }));
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-cream-border text-sm font-extrabold text-ink-muted hover:border-brand-orange hover:text-brand-orange transition-colors"
      >
        👁️ Prévisualisation élève
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vue élève</div>
                <h2 className="font-black text-white text-lg">{title}</h2>
                <div className="text-xs text-slate-400">{xpReward} XP · {blocks.length} bloc(s)</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {blocks.length === 0 && (
                <div className="text-center text-slate-500 font-bold py-12">Aucun bloc dans cette leçon.</div>
              )}
              {blocks.map((block) => (
                <StudentBlock
                  key={block.id}
                  block={block}
                  quizAnswer={quizAnswers[block.id] ?? null}
                  quizResult={quizResults[block.id] ?? null}
                  onAnswerQuiz={(idx, correct) => answerQuiz(block.id, idx, correct)}
                />
              ))}

              {/* Bouton terminer (décoratif) */}
              <div className="pt-4 border-t border-slate-700">
                <button
                  disabled
                  className="w-full bg-slate-700 text-slate-500 font-black py-4 rounded-2xl text-base cursor-not-allowed"
                >
                  ✅ Terminer la quête (+{xpReward} XP) — désactivé en aperçu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Rendu d'un bloc en mode élève ─────────────────────────────────────────────

function StudentBlock({
  block, quizAnswer, quizResult, onAnswerQuiz,
}: {
  block: Block;
  quizAnswer: number | null;
  quizResult: boolean | null;
  onAnswerQuiz: (idx: number, correct: number) => void;
}) {
  const c = block.content;

  if (block.type === "text") {
    const html = (c.html as string) ?? markdownToHtml((c.markdown as string) ?? "");
    return (
      <div
        className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-slate-200 [&_h1]:text-white [&_h2]:text-white [&_h2]:font-black [&_h3]:text-white [&_p]:text-slate-300 [&_strong]:text-white [&_code]:text-amber-300 [&_code]:bg-slate-700 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-slate-900 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-emerald-300"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (block.type === "video") {
    const url = (c.url as string) ?? "";
    const embedUrl = toEmbedUrl(url);
    return (
      <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
        {embedUrl ? (
          <iframe src={embedUrl} className="w-full aspect-video" allowFullScreen />
        ) : (
          <div className="p-6 text-slate-400 font-bold">🎬 URL vidéo : {url || "non définie"}</div>
        )}
        {(c.title as string) && (
          <div className="px-6 py-3 font-black text-white">{c.title as string}</div>
        )}
      </div>
    );
  }

  if (block.type === "quiz") {
    const questions: Array<{ question: string; type: string; options: string[]; correct: string; explanation: string }> =
      (c.questions as any[]) ?? [];

    if (questions.length === 0) {
      return <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-slate-400">❓ Quiz vide</div>;
    }

    // For preview, show first question only (same as QuestReader single-question mode)
    const q = questions[0];
    const answer = typeof q.correct === "string" ? parseInt(q.correct, 10) : q.correct as unknown as number;

    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
        {questions.map((q, qi) => {
          const correctIdx = typeof q.correct === "string" ? parseInt(q.correct, 10) : q.correct as unknown as number;
          return (
            <div key={qi} className="space-y-3">
              <div className="font-black text-white">
                <span className="text-brand-orange mr-2">❓</span>{q.question}
              </div>
              {q.type === "mcq" && (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt, ci) => {
                    const isChosen = quizAnswer === ci + qi * 100;
                    const isCorrect = ci === correctIdx;
                    let bg = "bg-slate-700 hover:bg-slate-600 text-slate-200";
                    if (isChosen || quizResult != null) {
                      if (isCorrect) bg = "bg-emerald-800 text-emerald-200 border-emerald-500";
                      else if (isChosen) bg = "bg-red-800 text-red-200 border-red-500";
                      else bg = "bg-slate-700 text-slate-500";
                    }
                    return (
                      <button key={ci}
                        onClick={() => onAnswerQuiz(ci + qi * 100, correctIdx + qi * 100)}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm border border-transparent transition-colors ${bg}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === "truefalse" && (
                <div className="flex gap-3">
                  {["Vrai", "Faux"].map((v, ci) => (
                    <button key={v}
                      className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 border border-transparent transition-colors"
                    >{v}</button>
                  ))}
                </div>
              )}
              {q.explanation && (
                <div className="text-xs text-slate-400 bg-slate-700/50 rounded-xl px-4 py-3">
                  💡 {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "code_challenge") {
    const cfg = c as { instructions?: string; starter_code?: string; hidden_tests?: string; language?: string };
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💻</span>
          <span className="font-black text-white">Défi code</span>
          <span className="text-xs font-bold text-slate-400 ml-auto">{cfg.language ?? "python"}</span>
        </div>
        {cfg.instructions && (
          <div className="text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: cfg.instructions }} />
        )}
        <PythonRunner
          starterCode={cfg.starter_code ?? "# Écris ton code ici\n"}
          hiddenTests={cfg.hidden_tests}
          language={(cfg.language as any) ?? "python"}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  if (block.type === "game") {
    const gameType = (c.game_type as string) ?? "maze";
    const params = (c.params as Record<string, unknown>) ?? {};
    const gameLabels: Record<string, string> = {
      maze: "🏃 Labyrinthe algorithmique",
      fill_blank: "🧩 Puzzle de code",
      sort: "🔀 Tri / Remise en ordre",
      memory: "🃏 Mémoire de concepts",
    };
    return <GameStudentView gameType={gameType} params={params} label={gameLabels[gameType] ?? gameType} />;
  }

  return null;
}

// ── Jeu vue élève ─────────────────────────────────────────────────────────────

function GameStudentView({ gameType, params, label }: { gameType: string; params: Record<string, unknown>; label: string }) {
  const [filled, setFilled] = useState<Record<number, string>>({});
  const [sortItems, setSortItems] = useState<string[] | null>(null);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lastFlip, setLastFlip] = useState<number | null>(null);
  const [sortResult, setSortResult] = useState<boolean | null>(null);
  const [fillResult, setFillResult] = useState<boolean | null>(null);

  if (gameType === "maze") {
    const character = (params.character as string) ?? "amavi";
    const decor = (params.decor as string) ?? "village";
    const commands = (params.commands as string[]) ?? [];
    const charEmoji: Record<string, string> = { amavi: "👦", kofi: "🧑", robot: "🤖", drone: "🚁" };
    const decorEmoji: Record<string, string> = { village: "🏘️", foret: "🌳", espace: "🌌", laboratoire: "🧪" };
    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
        <div className="font-black text-white text-base">🏃 Labyrinthe algorithmique</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-700 rounded-xl p-3">
            <div className="text-slate-400 text-xs font-bold mb-1">Personnage</div>
            <div className="text-white font-bold">{charEmoji[character]} {character}</div>
          </div>
          <div className="bg-slate-700 rounded-xl p-3">
            <div className="text-slate-400 text-xs font-bold mb-1">Décor</div>
            <div className="text-white font-bold">{decorEmoji[decor]} {decor}</div>
          </div>
        </div>
        {commands.length > 0 && (
          <div>
            <div className="text-slate-400 text-xs font-bold mb-2">Commandes disponibles</div>
            <div className="flex flex-wrap gap-1.5">
              {commands.map((cmd) => (
                <code key={cmd} className="bg-amber-900/40 text-amber-300 text-xs px-2 py-1 rounded-lg font-mono">{cmd}</code>
              ))}
            </div>
          </div>
        )}
        <div className="bg-slate-700/50 rounded-xl p-4 text-center text-slate-400 text-sm font-bold italic">
          🎮 Le jeu interactif s'affichera ici pour l'élève
        </div>
      </div>
    );
  }

  if (gameType === "fill_blank") {
    const template = (params.template as string) ?? "";
    const answers = (params.answers as string[]) ?? [];
    const parts = template.split("___");

    function checkFillBlank() {
      const correct = parts.slice(0, -1).every((_, i) => {
        return (filled[i] ?? "").trim().toLowerCase() === (answers[i] ?? "").trim().toLowerCase();
      });
      setFillResult(correct);
    }

    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
        <div className="font-black text-white text-base">🧩 Puzzle de code</div>
        {(params.context as string) && (
          <div className="text-slate-300 text-sm">{params.context as string}</div>
        )}
        <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-slate-200 leading-relaxed">
          {parts.map((part, i) => (
            <span key={i}>
              <span className="text-emerald-300 whitespace-pre">{part}</span>
              {i < parts.length - 1 && (
                <input
                  type="text"
                  value={filled[i] ?? ""}
                  onChange={(e) => setFilled((p) => ({ ...p, [i]: e.target.value }))}
                  className="bg-amber-900/60 border border-amber-500 text-amber-300 text-xs font-mono px-2 py-0.5 rounded mx-1 w-24 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  placeholder="???"
                />
              )}
            </span>
          ))}
        </div>
        <button
          onClick={checkFillBlank}
          className="px-5 py-2 bg-brand-orange text-white font-extrabold text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          Vérifier
        </button>
        {fillResult !== null && (
          <div className={`rounded-xl px-4 py-3 text-sm font-black ${fillResult ? "bg-emerald-900 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
            {fillResult ? "✅ Parfait !" : "❌ Réessaie…"}
          </div>
        )}
      </div>
    );
  }

  if (gameType === "sort") {
    const originalItems = (params.items as string[]) ?? [];
    const current = sortItems ?? [...originalItems].sort(() => Math.random() - 0.5);
    if (!sortItems) setSortItems(current);

    function moveItem(i: number, dir: -1 | 1) {
      const arr = [...(sortItems ?? current)];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      setSortItems(arr);
    }

    function checkSort() {
      const correct = (sortItems ?? current).every((item, i) => item === originalItems[i]);
      setSortResult(correct);
    }

    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
        <div className="font-black text-white text-base">🔀 Remise en ordre</div>
        <div className="space-y-2">
          {(sortItems ?? current).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                  className="text-xs text-slate-400 hover:text-white disabled:opacity-30 leading-none">▲</button>
                <button onClick={() => moveItem(i, 1)} disabled={i === (sortItems ?? current).length - 1}
                  className="text-xs text-slate-400 hover:text-white disabled:opacity-30 leading-none">▼</button>
              </div>
              <div className="flex-1 bg-slate-700 rounded-xl px-4 py-3 text-slate-200 font-bold text-sm">
                {item}
              </div>
            </div>
          ))}
        </div>
        <button onClick={checkSort}
          className="px-5 py-2 bg-brand-orange text-white font-extrabold text-sm rounded-xl hover:opacity-90 transition-opacity">
          Valider l'ordre
        </button>
        {sortResult !== null && (
          <div className={`rounded-xl px-4 py-3 text-sm font-black ${sortResult ? "bg-emerald-900 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
            {sortResult ? "✅ Bravo, bon ordre !" : "❌ Pas tout à fait…"}
          </div>
        )}
      </div>
    );
  }

  if (gameType === "memory") {
    const pairs: { left: string; right: string }[] = (params.pairs as any[]) ?? [];
    const cards = [...pairs.map((p, i) => ({ id: i * 2, text: p.left, pairId: i })),
                   ...pairs.map((p, i) => ({ id: i * 2 + 1, text: p.right, pairId: i }))];
    const shuffled = cards.sort(() => Math.random() - 0.5);

    function flipCard(id: number) {
      if (matched.includes(id) || flipped.includes(id)) return;
      if (flipped.length === 1) {
        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);
        const [a, b] = newFlipped.map((fid) => cards.find((c) => c.id === fid)!);
        if (a && b && a.pairId === b.pairId) {
          setTimeout(() => { setMatched((m) => [...m, a.id, b.id]); setFlipped([]); }, 600);
        } else {
          setTimeout(() => setFlipped([]), 1000);
        }
      } else {
        setFlipped([id]);
      }
    }

    if (pairs.length === 0) {
      return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-slate-400 font-bold text-center">
          🃏 Aucune paire configurée
        </div>
      );
    }

    return (
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
        <div className="font-black text-white text-base">🃏 Mémoire de concepts</div>
        <div className="grid grid-cols-3 gap-2">
          {shuffled.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => flipCard(card.id)}
                className={`aspect-square rounded-xl font-bold text-xs p-2 transition-all ${
                  matched.includes(card.id)
                    ? "bg-emerald-800 text-emerald-200"
                    : isFlipped
                    ? "bg-amber-800 text-amber-200"
                    : "bg-slate-700 text-slate-500 hover:bg-slate-600"
                }`}
              >
                {isFlipped ? card.text : "🃏"}
              </button>
            );
          })}
        </div>
        {matched.length === cards.length && (
          <div className="bg-emerald-900 text-emerald-300 rounded-xl px-4 py-3 text-sm font-black text-center">
            ✅ Toutes les paires trouvées !
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-slate-400 font-bold">
      🎮 {label}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function markdownToHtml(md: string): string {
  return md
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hpbr]|<pre|<\/p>)(.+)$/gm, "<p>$1</p>");
}

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
