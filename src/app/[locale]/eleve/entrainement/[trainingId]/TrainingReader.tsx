"use client";
import { useState, useTransition } from "react";

/* Mélange déterministe basé sur l'id du bloc (stable entre re-renders) */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let h = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  for (let i = result.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
import dynamic from "next/dynamic";
import { completeTraining } from "../../actions";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const BlocklyKodi  = dynamic(() => import("@/components/eleve/BlocklyKodi"), { ssr: false });
const PythonMaze   = dynamic(() => import("@/components/eleve/PythonMaze"), { ssr: false });

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

type Props = {
  trainingId: string;
  lessonId: string;
  blocks: Block[];
  xpReward: number;
  previousAttempts: number;
  previousScore: number | null;
  readOnly?: boolean;
};

function Stars({ score }: { score: number }) {
  const count = score === 100 ? 3 : score >= 75 ? 2 : score >= 50 ? 1 : 0;
  return (
    <div className="flex items-center justify-center gap-2 my-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="text-4xl transition-all duration-500"
          style={{
            opacity: i < count ? 1 : 0.2,
            filter: i < count ? "drop-shadow(0 0 8px #FDB813)" : "none",
            transform: i < count ? "scale(1.1)" : "scale(0.9)",
            animationDelay: `${i * 150}ms`,
          }}
        >⭐</span>
      ))}
    </div>
  );
}

export default function TrainingReader({ trainingId, blocks, xpReward, previousAttempts, previousScore, readOnly = false }: Props) {
  const [quizAnswers,  setQuizAnswers]  = useState<Record<string, number | null>>({});
  const [quizResults,  setQuizResults]  = useState<Record<string, boolean | null>>({});
  const [codeResults,  setCodeResults]  = useState<Record<string, boolean>>({});
  // fill_blank : blockId-itemIndex → chosenIndex
  const [fillAnswers,  setFillAnswers]  = useState<Record<string, number | null>>({});
  const [fillResults,  setFillResults]  = useState<Record<string, boolean | null>>({});
  // match : blockId → { leftId: rightId | null }
  const [matchSel,     setMatchSel]     = useState<Record<string, string | null>>({});   // blockId → selected left id
  const [matchPairs,   setMatchPairs]   = useState<Record<string, Record<string, string>>>({});  // blockId → {leftId: rightId}
  const [matchDone,    setMatchDone]    = useState<Record<string, boolean>>({});
  // swipe_sort : blockId-itemIndex → chosen category
  const [swipeResults, setSwipeResults] = useState<Record<string, { chosen: string; correct: boolean } | null>>({});
  const [swipeHintOpen, setSwipeHintOpen] = useState<Record<string, boolean>>({});  // blockId → helper ouvert
  // drag_to_bin : blockId-itemId → chosen binId
  const [dragResults,  setDragResults]  = useState<Record<string, { chosen: string; correct: boolean } | null>>({});
  const [dragSelected, setDragSelected] = useState<Record<string, string | null>>({});  // blockId → selected itemId
  // python_maze : blockId → résolu
  const [gameDone,     setGameDone]     = useState<Record<string, boolean>>({});

  const [completed, setCompleted]    = useState(false);
  const [xpGained, setXpGained]     = useState<number | null>(null);
  const [finalScore, setFinalScore]  = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const quizBlocks    = blocks.filter(b => b.type === "quiz");
  const codeBlocks    = blocks.filter(b => b.type === "code_challenge");
  const blocklyBlocks = blocks.filter(b => b.type === "blockly_challenge" && (b.content as any)?.game_type !== "python_maze");
  const fillBlocks    = blocks.filter(b => b.type === "fill_blank");
  const matchBlocks   = blocks.filter(b => b.type === "match");
  const swipeBlocks   = blocks.filter(b => b.type === "swipe_sort");
  const dragBlocks    = blocks.filter(b => b.type === "drag_to_bin");
  const mazeBlocks    = blocks.filter(b => b.type === "blockly_challenge" && (b.content as any)?.game_type === "python_maze");

  // — Progression —
  const allQuizKeys = quizBlocks.flatMap(b => {
    const raw = b.content as { questions?: { answer: number }[] };
    const count = raw.questions?.length ?? 1;
    return Array.from({ length: count }, (_, qi) => `${b.id}-${qi}`);
  });
  const allFillKeys = fillBlocks.flatMap(b => {
    const raw = b.content as { sentences?: unknown[] };
    return Array.from({ length: raw.sentences?.length ?? 0 }, (_, i) => `${b.id}-${i}`);
  });
  const allSwipeKeys = swipeBlocks.flatMap(b => {
    const raw = b.content as { items?: unknown[] };
    return Array.from({ length: raw.items?.length ?? 0 }, (_, i) => `${b.id}-${i}`);
  });
  const allDragKeys = dragBlocks.flatMap(b => {
    const raw = b.content as { items?: { id: string }[] };
    return (raw.items ?? []).map(item => `${b.id}-${item.id}`);
  });

  const doneQuiz    = allQuizKeys.filter(k => quizResults[k] != null).length;
  const totalQuiz   = allQuizKeys.length;
  const doneFill    = allFillKeys.filter(k => fillResults[k] != null).length;
  const totalFill   = allFillKeys.length;
  const doneSwipe   = allSwipeKeys.filter(k => swipeResults[k] != null).length;
  const totalSwipe  = allSwipeKeys.length;
  const doneDrag    = allDragKeys.filter(k => dragResults[k] != null).length;
  const totalDrag   = allDragKeys.length;
  const doneMatch   = matchBlocks.filter(b => matchDone[b.id]).length;
  const totalMatch  = matchBlocks.length;
  const doneMaze    = mazeBlocks.filter(b => gameDone[b.id]).length;
  const totalMaze   = mazeBlocks.length;
  const doneCode    = codeBlocks.filter(b => codeResults[b.id]).length;
  const doneBlockly = blocklyBlocks.filter(b => codeResults[b.id]).length;

  const requiredCode    = codeBlocks.filter(b => (b.content as any).required);
  const requiredBlockly = blocklyBlocks.filter(b => (b.content as any).required);
  const allQuizDone   = totalQuiz === 0  || doneQuiz  === totalQuiz;
  const allFillDone   = totalFill === 0  || doneFill  === totalFill;
  const allSwipeDone  = totalSwipe === 0 || doneSwipe === totalSwipe;
  const allDragDone   = totalDrag === 0  || doneDrag  === totalDrag;
  const allMatchDone  = totalMatch === 0 || doneMatch === totalMatch;
  const allMazeDone   = totalMaze === 0  || doneMaze  === totalMaze;
  const allCodeDone   = requiredCode.every(b => codeResults[b.id]);
  const allBlocklyDone = requiredBlockly.every(b => codeResults[b.id]);
  const canFinish = allQuizDone && allFillDone && allSwipeDone && allDragDone && allMatchDone && allMazeDone && allCodeDone && allBlocklyDone;

  // Progression globale pour la barre
  const totalSteps = totalQuiz + totalFill + totalSwipe + totalDrag + totalMatch + totalMaze + requiredCode.length + requiredBlockly.length;
  const doneSteps  = doneQuiz + doneFill + doneSwipe + doneDrag + doneMatch + doneMaze + doneCode + doneBlockly;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 100;

  function computeScore() {
    const allKeys = [...allQuizKeys, ...allFillKeys, ...allSwipeKeys, ...allDragKeys];
    if (allKeys.length === 0 && totalMatch === 0) return 100;
    let correct = 0; let total = 0;
    allQuizKeys.forEach(k => { total++; if (quizResults[k] === true) correct++; });
    allFillKeys.forEach(k => { total++; if (fillResults[k] === true) correct++; });
    allSwipeKeys.forEach(k => { total++; if (swipeResults[k]?.correct) correct++; });
    allDragKeys.forEach(k => { total++; if (dragResults[k]?.correct) correct++; });
    // match : on compte le nb de paires correctes
    matchBlocks.forEach(b => {
      const raw = b.content as { pairs?: { left: string; right: string }[] };
      (raw.pairs ?? []).forEach((_, pi) => {
        total++;
        const pairs = matchPairs[b.id] ?? {};
        const leftId = `l${pi}`;
        const rightId = `r${pi}`;
        if (pairs[leftId] === rightId) correct++;
      });
    });
    return total === 0 ? 100 : Math.round((correct / total) * 100);
  }

  function handleComplete() {
    if (readOnly) { setCompleted(true); return; }
    const score = computeScore();
    setFinalScore(score);
    startTransition(async () => {
      const res = await completeTraining(trainingId, score) as any;
      if (res?.xpGained) setXpGained(res.xpGained);
      setCompleted(true);
    });
  }

  function handleRestart() {
    setQuizAnswers({});
    setQuizResults({});
    setCodeResults({});
    setFillAnswers({});
    setFillResults({});
    setMatchSel({});
    setMatchPairs({});
    setMatchDone({});
    setSwipeResults({});
    setSwipeHintOpen({});
    setDragResults({});
    setDragSelected({});
    setCompleted(false);
    setXpGained(null);
    setFinalScore(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Barre de progression ── */}
      {!completed && totalSteps > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono mb-2" style={{ color: "#475569" }}>
            <span>Progression</span>
            <span style={{ color: progressPct === 100 ? "#10b981" : "#FDB813" }}>{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : "linear-gradient(90deg, #FDB813, #f97316)",
              }}
            />
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-[10px] font-mono" style={{ color: "#334155" }}>
            {totalQuiz > 0 && <span>🧠 Quiz {doneQuiz}/{totalQuiz}</span>}
            {requiredCode.length > 0 && <span>💻 Code {doneCode}/{requiredCode.length}</span>}
            {requiredBlockly.length > 0 && <span>🧱 Blocs {doneBlockly}/{requiredBlockly.length}</span>}
          </div>
        </div>
      )}

      {/* ── Badge tentative précédente ── */}
      {previousAttempts > 0 && !completed && (
        <div className="mb-6 flex items-center gap-3 rounded-xl px-5 py-3"
          style={{ background: "#1e2a45", border: "1px solid #2a3a5a" }}>
          <span className="text-xl">🔄</span>
          <div className="text-sm" style={{ color: "#8aaed4" }}>
            <span className="font-black">Nouvelle tentative</span>
            <span className="ml-2">· {previousAttempts} effectuée{previousAttempts > 1 ? "s" : ""}</span>
            {previousScore != null && <span className="ml-2">· Meilleur : <span className="font-black text-white">{previousScore}%</span></span>}
          </div>
        </div>
      )}

      {/* ── Écran résultat animé ── */}
      {completed && (
        <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: "1px solid #10b98140" }}>
          <div className="px-8 py-6 text-center" style={{ background: "linear-gradient(135deg, #0a1628, #0e2020)" }}>
            <div className="text-5xl mb-2">
              {finalScore != null && finalScore === 100 ? "🏆" : finalScore != null && finalScore >= 75 ? "🎯" : finalScore != null && finalScore >= 50 ? "💪" : "📚"}
            </div>
            <div className="font-black text-2xl text-white mb-1">Entraînement terminé !</div>
            {finalScore != null && <Stars score={finalScore} />}
            <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
              {finalScore != null && (
                <div className="text-center">
                  <div className="text-3xl font-black" style={{ color: finalScore >= 75 ? "#10b981" : finalScore >= 50 ? "#FDB813" : "#f97316" }}>
                    {finalScore}%
                  </div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "#475569" }}>Score</div>
                </div>
              )}
              {xpGained != null && xpGained > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-black" style={{ color: "#FDB813" }}>+{xpGained}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "#475569" }}>XP gagnés</div>
                </div>
              )}
              {previousScore != null && finalScore != null && finalScore > previousScore && (
                <div className="text-center">
                  <div className="text-3xl font-black" style={{ color: "#a78bfa" }}>+{finalScore - previousScore}%</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: "#475569" }}>Progression</div>
                </div>
              )}
            </div>
            {finalScore != null && finalScore < 50 && (
              <p className="text-sm mt-4 font-medium" style={{ color: "#64748b" }}>Continue à t&apos;entraîner, tu vas y arriver ! 💪</p>
            )}
            {finalScore != null && finalScore === 100 && (
              <p className="text-sm mt-4 font-black" style={{ color: "#10b981" }}>Score parfait ! Tu maîtrises cette leçon ! 🌟</p>
            )}
          </div>
          <div className="px-8 py-4 flex flex-col sm:flex-row gap-3" style={{ background: "#0f172a" }}>
            <button
              onClick={handleRestart}
              className="flex-1 font-black py-3 rounded-xl text-sm transition-colors"
              style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
            >
              🔄 Recommencer
            </button>
            <a
              href="/eleve/entrainement"
              className="flex-1 font-black py-3 rounded-xl text-sm text-center transition-colors"
              style={{ background: "#FDB813", color: "#0f172a" }}
            >
              ← Tous les entraînements
            </a>
          </div>
        </div>
      )}

      {/* ── Blocs ── */}
      <div className="space-y-6">
        {blocks.map((block) => {

          /* Texte */
          if (block.type === "text") {
            const c = block.content as { html?: string; markdown?: string };
            const html = c.html ?? (c.markdown ? simpleMarkdown(c.markdown) : "");
            return (
              <div key={block.id}
                className="lesson-prose rounded-2xl p-6 border"
                style={{ background: "#1e293b", borderColor: "#334155" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          /* Quiz */
          if (block.type === "quiz") {
            type QQ = { question: string; choices: string[]; answer: number; explanation?: string };
            const raw = block.content as { questions?: QQ[] } & QQ;
            const questions: QQ[] = raw.questions ?? [{
              question: raw.question, choices: raw.choices,
              answer: raw.answer, explanation: raw.explanation,
            }];
            const answered = questions.filter((_, qi) => quizResults[`${block.id}-${qi}`] != null).length;

            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #4c1d9540" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: "#1e103a" }}>
                  <span className="text-2xl">🧠</span>
                  <div className="flex-1">
                    <div className="font-black text-white">Quiz flash</div>
                    <div className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>{questions.length} question{questions.length > 1 ? "s" : ""}</div>
                  </div>
                  <div className="text-xs font-mono" style={{ color: answered === questions.length ? "#10b981" : "#a78bfa" }}>
                    {answered}/{questions.length} répondu{questions.length > 1 ? "es" : "e"}
                  </div>
                </div>
                <div className="divide-y" style={{ background: "#0f0a1e", borderColor: "#2a1a4a" }}>
                  {questions.map((q, qi) => {
                    const qKey = `${block.id}-${qi}`;
                    const chosen = quizAnswers[qKey] ?? null;
                    const result = quizResults[qKey] ?? null;
                    return (
                      <div key={qKey} className="px-6 py-5">
                        <div className="flex items-start gap-3 mb-4">
                          <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                            result === true  ? "bg-emerald-500 text-white" :
                            result === false ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                            {result === true ? "✓" : result === false ? "✗" : qi + 1}
                          </span>
                          <p className="font-bold text-white text-base leading-snug">{q.question}</p>
                        </div>
                        <div className="space-y-2 ml-10">
                          {(q.choices ?? []).map((choice, ci) => {
                            const isChosen  = chosen === ci;
                            const isCorrect = ci === q.answer;
                            let bg = "#1e293b", border = "#334155", color = "#cbd5e1";
                            if (result != null) {
                              if (isCorrect)      { bg = "#052e16"; border = "#10b981"; color = "#6ee7b7"; }
                              else if (isChosen)  { bg = "#2d0a0a"; border = "#ef4444"; color = "#fca5a5"; }
                              else                { bg = "#0f172a"; border = "#1e293b"; color = "#334155"; }
                            }
                            return (
                              <button key={ci}
                                onClick={() => {
                                  if (result != null || completed) return;
                                  setQuizAnswers({ ...quizAnswers, [qKey]: ci });
                                  setQuizResults({ ...quizResults, [qKey]: ci === q.answer });
                                }}
                                disabled={result != null || completed}
                                className="w-full text-left px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                                style={{ background: bg, border: `1px solid ${border}`, color }}
                              >
                                <span className="mr-2" style={{ color: "#475569" }}>{["A","B","C","D"][ci]}.</span>
                                {isCorrect && result != null ? "✓ " : ""}{choice}
                              </button>
                            );
                          })}
                        </div>
                        {result != null && q.explanation && (
                          <div className="mt-4 ml-10 text-sm rounded-xl px-5 py-3"
                            style={{
                              background: result ? "#052e16" : "#2d1a00",
                              borderLeft: `4px solid ${result ? "#10b981" : "#f59e0b"}`,
                              color: result ? "#6ee7b7" : "#fcd34d",
                            }}>
                            {result ? "✅ " : "💡 "}{q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          /* Labyrinthe piloté en Python. La contrainte de training_blocks n'autorise
             pas de nouveau type : on le porte par blockly_challenge + game_type,
             comme les leçons le font avec leurs jeux. */
          if (block.type === "blockly_challenge" && (block.content as any)?.game_type === "python_maze") {
            return (
              <PythonMaze
                key={block.id}
                config={block.content as any}
                done={!!gameDone[block.id]}
                onSolved={() => setGameDone(g => ({ ...g, [block.id]: true }))}
              />
            );
          }

          /* Code */
          if (block.type === "code_challenge") {
            const cfg = block.content as {
              instructions?: string; starter_code?: string;
              hidden_tests?: string; expected_output?: string;
              language?: "python" | "javascript" | "html"; required?: boolean;
            };
            const done = codeResults[block.id];
            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${done ? "#10b98140" : "#065f4640"}` }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: done ? "#052e16" : "#0a1f1a" }}>
                  <span className="text-2xl">💻</span>
                  <div>
                    <div className="font-black text-white">Mini-défi code</div>
                    <div className="text-xs mt-0.5" style={{ color: "#10b981" }}>{cfg.language ?? "python"}</div>
                  </div>
                  {done && <span className="ml-auto text-xs font-black px-3 py-1 rounded-full" style={{ background: "#052e16", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi !</span>}
                </div>
                <div className="p-6 space-y-4" style={{ background: "#0a0f1a" }}>
                  {cfg.instructions && (
                    <div className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}
                      dangerouslySetInnerHTML={{ __html: cfg.instructions }} />
                  )}
                  <PythonRunner
                    starterCode={cfg.starter_code ?? "# Écris ton code ici\n"}
                    hiddenTests={cfg.hidden_tests}
                    expectedOutput={cfg.expected_output}
                    language={cfg.language ?? "python"}
                    onSuccess={() => { if (!completed) setCodeResults(prev => ({ ...prev, [block.id]: true })); }}
                  />
                </div>
              </div>
            );
          }

          /* Blockly */
          if (block.type === "blockly_challenge") {
            const cfg = block.content as {
              instructions?: string;
              expected_lines?: string[];
              expected_contains?: string[];
              max_blocks?: number;
              available_blocks?: string[];
              required?: boolean;
            };
            const done = !!codeResults[block.id];
            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${done ? "#10b98140" : "#78350f40"}` }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: done ? "#052e16" : "#1a0f05" }}>
                  <span className="text-2xl">🧱</span>
                  <div>
                    <div className="font-black text-white">Défi blocs — Kodi</div>
                    <div className="text-xs mt-0.5" style={{ color: "#f97316" }}>Programme visuel</div>
                  </div>
                  {done && <span className="ml-auto text-xs font-black px-3 py-1 rounded-full" style={{ background: "#052e16", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi !</span>}
                </div>
                <div className="p-4" style={{ background: "#050a12" }}>
                  <BlocklyKodi
                    config={{
                      instructions: cfg.instructions ?? "",
                      expected_lines: cfg.expected_lines,
                      expected_contains: cfg.expected_contains,
                      max_blocks: cfg.max_blocks,
                      available_blocks: cfg.available_blocks,
                    }}
                    onSolved={() => { if (!completed) setCodeResults(prev => ({ ...prev, [block.id]: true })); }}
                  />
                </div>
              </div>
            );
          }

          /* ── fill_blank ── */
          if (block.type === "fill_blank") {
            type Sentence = { id: string; before: string; after?: string; options: string[]; correct: number; explanation?: string };
            const raw = block.content as { title?: string; sentences: Sentence[] };
            const answered = raw.sentences.filter((_, i) => fillResults[`${block.id}-${i}`] != null).length;
            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #0e4a6840" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: "#071a2a" }}>
                  <span className="text-2xl">✍️</span>
                  <div className="flex-1">
                    <div className="font-black text-white">{raw.title ?? "Complète les phrases"}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#60a5fa" }}>{raw.sentences.length} phrase{raw.sentences.length > 1 ? "s" : ""}</div>
                  </div>
                  <div className="text-xs font-mono" style={{ color: answered === raw.sentences.length ? "#10b981" : "#60a5fa" }}>
                    {answered}/{raw.sentences.length} complété{raw.sentences.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="divide-y" style={{ background: "#050f1a", borderColor: "#0e2a3a" }}>
                  {raw.sentences.map((s, si) => {
                    const key = `${block.id}-${si}`;
                    const chosen = fillAnswers[key] ?? null;
                    const result = fillResults[key] ?? null;
                    return (
                      <div key={key} className="px-6 py-5">
                        <div className="flex items-start gap-3 mb-4">
                          <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                            result === true ? "bg-emerald-500 text-white" : result === false ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                            {result === true ? "✓" : result === false ? "✗" : si + 1}
                          </span>
                          <p className="font-bold text-white text-base leading-relaxed">
                            {s.before}{" "}
                            <span className="inline-block px-3 py-0.5 rounded-lg mx-1 font-black text-sm"
                              style={{ background: result === true ? "#052e16" : result === false ? "#2d0a0a" : "#1e293b", color: result === true ? "#6ee7b7" : result === false ? "#fca5a5" : "#FDB813", border: `1px solid ${result === true ? "#10b981" : result === false ? "#ef4444" : "#FDB81360"}`, minWidth: 80, textAlign: "center" }}>
                              {chosen !== null ? s.options[chosen] : "______"}
                            </span>
                            {s.after ?? ""}
                          </p>
                        </div>
                        {result == null && (
                          <div className="flex flex-wrap gap-2 ml-10">
                            {seededShuffle(s.options.map((_, i) => i), key).map((oi) => (
                              <button key={oi} onClick={() => {
                                if (result != null || completed) return;
                                setFillAnswers(prev => ({ ...prev, [key]: oi }));
                                setFillResults(prev => ({ ...prev, [key]: oi === s.correct }));
                              }}
                                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                                style={{ background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1" }}>
                                {s.options[oi]}
                              </button>
                            ))}
                          </div>
                        )}
                        {result != null && (
                          <div className="mt-3 ml-10 text-sm rounded-xl px-4 py-2.5 space-y-1"
                            style={{ background: result ? "#052e16" : "#2d1a00", borderLeft: `4px solid ${result ? "#10b981" : "#f59e0b"}`, color: result ? "#6ee7b7" : "#fcd34d" }}>
                            {result
                              ? <span>✅ Bonne réponse !</span>
                              : <>
                                  <div>💡 La bonne réponse était : <strong>{s.options[s.correct]}</strong></div>
                                  {s.explanation && <div className="text-xs mt-1 opacity-80">→ {s.explanation}</div>}
                                </>
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          /* ── match ── */
          if (block.type === "match") {
            type Pair = { left: string; right: string };
            const raw = block.content as { title?: string; pairs: Pair[] };
            const bMatchPairs  = matchPairs[block.id] ?? {};
            const bMatchSel    = matchSel[block.id] ?? null;
            const isDone       = !!matchDone[block.id];
            // Mélange déterministe basé sur l'id du bloc (stable entre re-renders)
            const shuffledRight = seededShuffle(
              raw.pairs.map((p, i) => ({ label: p.right, id: `r${i}` })),
              block.id
            );

            function handleMatchLeft(leftId: string) {
              if (isDone || completed) return;
              // Si déjà apparié correctement, ne pas permettre de déséléctionner
              const paired = (matchPairs[block.id] ?? {})[leftId];
              if (paired && paired === leftId.replace("l", "r")) return;
              setMatchSel(prev => ({ ...prev, [block.id]: prev[block.id] === leftId ? null : leftId }));
            }
            function handleMatchRight(rightId: string) {
              if (isDone || completed || !bMatchSel) return;
              const newPairs = { ...bMatchPairs, [bMatchSel]: rightId };
              setMatchPairs(prev => ({ ...prev, [block.id]: newPairs }));
              setMatchSel(prev => ({ ...prev, [block.id]: null }));
              if (Object.keys(newPairs).length === raw.pairs.length) {
                setMatchDone(prev => ({ ...prev, [block.id]: true }));
              }
            }
            const takenRights = new Set(Object.values(bMatchPairs));

            // Compte les paires correctes pour le score affiché
            const correctPairsCount = raw.pairs.filter((_, pi) => bMatchPairs[`l${pi}`] === `r${pi}`).length;

            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${isDone ? "#10b98140" : "#4f1d9640"}` }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: isDone ? "#052e16" : "#1a0f35" }}>
                  <span className="text-2xl">🔗</span>
                  <div className="flex-1">
                    <div className="font-black text-white">{raw.title ?? "Associe les paires"}</div>
                    <div className="text-xs mt-0.5" style={{ color: isDone ? "#10b981" : "#a78bfa" }}>
                      {isDone
                        ? `✅ ${correctPairsCount}/${raw.pairs.length} paires correctes`
                        : `${Object.keys(bMatchPairs).length}/${raw.pairs.length} paires reliées`}
                    </div>
                  </div>
                  {!isDone && bMatchSel && (
                    <div className="text-xs font-bold px-3 py-1 rounded-full animate-pulse" style={{ background: "#4f1d96", color: "#e9d5ff" }}>
                      → Clique une définition
                    </div>
                  )}
                </div>
                <div className="p-5" style={{ background: "#0a0519" }}>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Colonne gauche */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#6b21a8" }}>Concept</div>
                      {raw.pairs.map((p, pi) => {
                        const leftId = `l${pi}`;
                        const paired = bMatchPairs[leftId];
                        const isCorrect = paired === `r${pi}`;
                        const isWrong   = paired && paired !== `r${pi}`;
                        const isSelected = bMatchSel === leftId;
                        // Une fois révélé correct, verrouillé ; si faux → peut re-cliquer
                        const isLocked = isCorrect;
                        return (
                          <button key={leftId}
                            onClick={() => { if (!isLocked) handleMatchLeft(leftId); }}
                            disabled={(isLocked && !isDone) || (isDone) || completed}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: isCorrect ? "#052e16" : isWrong ? "#2d0a0a" : isSelected ? "#2d1a5e" : "#1e293b",
                              border: `2px solid ${isCorrect ? "#10b981" : isWrong ? "#ef4444" : isSelected ? "#a78bfa" : "#334155"}`,
                              color: isCorrect ? "#6ee7b7" : isWrong ? "#fca5a5" : isSelected ? "#e9d5ff" : "#cbd5e1",
                              transform: isSelected ? "scale(1.02)" : "scale(1)",
                            }}>
                            <div>{p.left}</div>
                            {isCorrect && <div className="text-[10px] mt-0.5 opacity-70">✓ bien associé</div>}
                            {isWrong && !isDone && <div className="text-[10px] mt-0.5 opacity-70">✗ mauvaise association — réessaie</div>}
                          </button>
                        );
                      })}
                    </div>
                    {/* Colonne droite — mélangée */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#6b21a8" }}>Définition</div>
                      {shuffledRight.map(({ label, id: rightId }) => {
                        const pi = parseInt(rightId.replace("r", ""));
                        // Correctement associé = la paire gauche correspondante pointe vers ce rightId
                        const isCorrectlyPaired = bMatchPairs[`l${pi}`] === rightId;
                        // Pris par une mauvaise paire (une gauche différente pointe ici)
                        const takenByLeft = Object.entries(bMatchPairs).find(([, v]) => v === rightId)?.[0];
                        const isTakenCorrectly = isCorrectlyPaired;
                        const isTakenWrongly   = !!takenByLeft && !isCorrectlyPaired;
                        const isTaken = isTakenCorrectly || isTakenWrongly;
                        return (
                          <button key={rightId}
                            onClick={() => { if (!isTakenCorrectly) handleMatchRight(rightId); }}
                            disabled={isTakenCorrectly || isDone || completed || !bMatchSel}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: isTakenCorrectly ? "#052e16" : isTakenWrongly ? "#2d0a0a" : bMatchSel ? "#1e293b" : "#0f172a",
                              border: `2px solid ${isTakenCorrectly ? "#10b981" : isTakenWrongly ? "#ef4444" : bMatchSel && !isTaken ? "#a78bfa60" : "#1e293b"}`,
                              color: isTakenCorrectly ? "#6ee7b7" : isTakenWrongly ? "#fca5a5" : "#94a3b8",
                              opacity: isTakenCorrectly ? 1 : isTakenWrongly ? 0.6 : 1,
                              cursor: isTakenCorrectly || (!bMatchSel && !isTakenWrongly) ? "default" : "pointer",
                              transform: bMatchSel && !isTaken ? "scale(1.01)" : "scale(1)",
                            }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message fin */}
                  {isDone && (
                    <div className="mt-4 text-center text-sm font-black rounded-xl py-3"
                      style={{
                        background: correctPairsCount === raw.pairs.length ? "#052e16" : "#2d1a00",
                        color: correctPairsCount === raw.pairs.length ? "#10b981" : "#fcd34d",
                        border: `1px solid ${correctPairsCount === raw.pairs.length ? "#10b98140" : "#f59e0b40"}`,
                      }}>
                      {correctPairsCount === raw.pairs.length
                        ? "🎯 Parfait ! Tu as bien associé tous les éléments."
                        : `💪 ${correctPairsCount}/${raw.pairs.length} correctes — relis les associations en rouge pour mieux retenir.`}
                    </div>
                  )}

                  {/* Recommencer si pas fini */}
                  {!isDone && Object.keys(bMatchPairs).length > 0 && (
                    <button onClick={() => {
                      setMatchPairs(prev => ({ ...prev, [block.id]: {} }));
                      setMatchSel(prev => ({ ...prev, [block.id]: null }));
                    }}
                      className="mt-4 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      style={{ background: "#1e293b", color: "#475569" }}>
                      🔄 Recommencer l'association
                    </button>
                  )}
                </div>
              </div>
            );
          }

          /* ── swipe_sort ── */
          if (block.type === "swipe_sort") {
            type SwipeItem = { id: string; label: string; emoji?: string; correct: string; hint?: string };
            type Category  = { id: string; label: string; color: string; emoji?: string };
            type SwipeHelper = { title: string; criteria: string[] };
            const raw = block.content as { title?: string; instruction?: string; helper?: SwipeHelper; categories: Category[]; items: SwipeItem[] };
            const blockResults = raw.items.map((item, i) => swipeResults[`${block.id}-${i}`] ?? null);
            const answeredCount = blockResults.filter(r => r != null).length;
            const currentIdx = answeredCount;
            const allAnswered = answeredCount >= raw.items.length;
            const correctCount = blockResults.filter(r => r?.correct).length;
            const currentItem = !allAnswered ? raw.items[currentIdx] : null;
            const isHintOpen = swipeHintOpen[block.id] ?? false;

            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${allAnswered ? "#10b98140" : "#b4530040"}` }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: allAnswered ? "#052e16" : "#1a0a00" }}>
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <div className="font-black text-white">{raw.title ?? "Trie en vitesse !"}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#f97316" }}>
                      {allAnswered ? `✅ ${correctCount}/${raw.items.length} corrects` : `${answeredCount}/${raw.items.length} triés`}
                    </div>
                  </div>
                </div>
                <div className="p-6" style={{ background: "#0a0800" }}>
                  {raw.instruction && !allAnswered && (
                    <p className="text-sm text-center mb-4 font-medium" style={{ color: "#94a3b8" }}>{raw.instruction}</p>
                  )}

                  {/* ── Aide collapsible "Comment décider ?" ── */}
                  {raw.helper && !allAnswered && (
                    <div className="mb-5 rounded-xl overflow-hidden" style={{ border: "1px solid #78350f50" }}>
                      <button
                        onClick={() => setSwipeHintOpen(prev => ({ ...prev, [block.id]: !prev[block.id] }))}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-black transition-colors hover:bg-amber-900/20"
                        style={{ background: "#1a0f00", color: "#fbbf24" }}
                      >
                        <span>{isHintOpen ? "▾" : "▸"}</span>
                        <span>💡 {raw.helper.title}</span>
                        <span className="ml-auto font-normal opacity-60">{isHintOpen ? "Refermer" : "Voir le rappel"}</span>
                      </button>
                      {isHintOpen && (
                        <div className="px-4 py-3 space-y-1.5" style={{ background: "#120a00" }}>
                          {raw.helper.criteria.map((c, ci) => (
                            <div key={ci} className="flex items-start gap-2 text-xs" style={{ color: "#d97706" }}>
                              <span className="shrink-0 mt-0.5">▸</span>
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carte courante */}
                  {!allAnswered && currentItem && (
                    <div className="mb-6">
                      <div className="mx-auto max-w-xs rounded-2xl p-8 text-center mb-4"
                        style={{ background: "#1e293b", border: "2px solid #334155", boxShadow: "0 8px 32px #00000040" }}>
                        {currentItem.emoji && <div className="text-5xl mb-3">{currentItem.emoji}</div>}
                        <div className="font-black text-white text-lg">{currentItem.label}</div>
                        <div className="text-xs font-mono mt-2" style={{ color: "#475569" }}>{answeredCount + 1} / {raw.items.length}</div>
                      </div>
                      {/* Boutons catégories */}
                      <div className={`grid gap-3 ${raw.categories.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                        {raw.categories.map(cat => (
                          <button key={cat.id}
                            onClick={() => {
                              if (completed) return;
                              const key = `${block.id}-${currentIdx}`;
                              const isCorrect = cat.id === currentItem.correct;
                              setSwipeResults(prev => ({ ...prev, [key]: { chosen: cat.id, correct: isCorrect } }));
                              // Ouvre l'aide si mauvaise réponse et helper disponible
                              if (!isCorrect && raw.helper) {
                                setSwipeHintOpen(prev => ({ ...prev, [block.id]: true }));
                              }
                            }}
                            className="py-4 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95"
                            style={{ background: `${cat.color}20`, border: `2px solid ${cat.color}60`, color: cat.color }}>
                            {cat.emoji && <span className="mr-1">{cat.emoji}</span>}{cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Résultats inline avec hint sur erreur */}
                  {answeredCount > 0 && (
                    <div className="space-y-2 mt-2">
                      {raw.items.slice(0, answeredCount).map((item, i) => {
                        const res = swipeResults[`${block.id}-${i}`];
                        if (!res) return null;
                        const chosenCat = raw.categories.find(c => c.id === res.chosen);
                        const correctCat = raw.categories.find(c => c.id === item.correct);
                        return (
                          <div key={i} className="rounded-xl overflow-hidden"
                            style={{ border: `1px solid ${res.correct ? "#10b98130" : "#ef444330"}` }}>
                            <div className="flex items-center gap-3 px-4 py-2.5 text-sm"
                              style={{ background: res.correct ? "#052e16" : "#2d0a0a" }}>
                              <span>{res.correct ? "✅" : "❌"}</span>
                              <span className="font-bold text-white">{item.emoji} {item.label}</span>
                              <span className="ml-auto text-xs shrink-0" style={{ color: res.correct ? "#10b981" : "#ef4444" }}>
                                {res.correct ? chosenCat?.label : `${chosenCat?.label} → ${correctCat?.label}`}
                              </span>
                            </div>
                            {!res.correct && item.hint && (
                              <div className="px-4 py-2 text-xs" style={{ background: "#1a0800", color: "#d97706", borderTop: "1px solid #78350f40" }}>
                                💡 {item.hint}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {allAnswered && (
                    <div className="mt-4 text-center rounded-xl py-4 font-black"
                      style={{ background: correctCount === raw.items.length ? "#052e16" : "#1e293b", color: correctCount === raw.items.length ? "#10b981" : "#FDB813" }}>
                      {correctCount === raw.items.length ? "🏆 Parfait !" : `💪 ${correctCount}/${raw.items.length} — Relis les explications en rouge pour bien retenir !`}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          /* ── drag_to_bin ── */
          if (block.type === "drag_to_bin") {
            type DragItem = { id: string; label: string; emoji?: string; correct: string; hint?: string };
            type Bin      = { id: string; label: string; color: string; emoji?: string };
            const raw = block.content as { title?: string; instruction?: string; bins: Bin[]; items: DragItem[] };
            const bDragSelected = dragSelected[block.id] ?? null;
            const answeredItems = raw.items.filter(item => dragResults[`${block.id}-${item.id}`] != null);
            const pendingItems  = raw.items.filter(item => dragResults[`${block.id}-${item.id}`] == null);
            const allAnswered   = pendingItems.length === 0;
            const correctCount  = raw.items.filter(item => dragResults[`${block.id}-${item.id}`]?.correct).length;

            function handleItemTap(itemId: string) {
              if (allAnswered || completed) return;
              setDragSelected(prev => ({ ...prev, [block.id]: prev[block.id] === itemId ? null : itemId }));
            }
            function handleBinTap(binId: string) {
              if (!bDragSelected || allAnswered || completed) return;
              const item = raw.items.find(i => i.id === bDragSelected);
              if (!item) return;
              const key = `${block.id}-${bDragSelected}`;
              setDragResults(prev => ({ ...prev, [key]: { chosen: binId, correct: binId === item.correct } }));
              setDragSelected(prev => ({ ...prev, [block.id]: null }));
            }

            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${allAnswered ? "#10b98140" : "#a78bfa40"}` }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ background: allAnswered ? "#052e16" : "#150a2a" }}>
                  <span className="text-2xl">🗂️</span>
                  <div className="flex-1">
                    <div className="font-black text-white">{raw.title ?? "Glisse dans le bon bac"}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#a78bfa" }}>
                      {allAnswered ? `✅ ${correctCount}/${raw.items.length} corrects` : `${answeredItems.length}/${raw.items.length} placés`}
                    </div>
                  </div>
                  {bDragSelected && !allAnswered && (
                    <div className="text-xs font-bold px-3 py-1 rounded-full animate-pulse" style={{ background: "#4f1d96", color: "#e9d5ff" }}>
                      → Choisis un bac
                    </div>
                  )}
                </div>
                <div className="p-5" style={{ background: "#080514" }}>
                  {raw.instruction && !allAnswered && (
                    <p className="text-sm text-center mb-5 font-medium" style={{ color: "#94a3b8" }}>{raw.instruction}</p>
                  )}

                  {/* Bacs cibles */}
                  <div className={`grid gap-3 mb-6 ${raw.bins.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {raw.bins.map(bin => {
                      const itemsInBin = answeredItems.filter(item => dragResults[`${block.id}-${item.id}`]?.chosen === bin.id);
                      const isActive = !!bDragSelected && !allAnswered;
                      return (
                        <button key={bin.id}
                          onClick={() => handleBinTap(bin.id)}
                          disabled={!isActive}
                          className="rounded-2xl p-4 text-center transition-all min-h-[80px]"
                          style={{
                            background: `${bin.color}15`,
                            border: `2px solid ${isActive ? bin.color : `${bin.color}40`}`,
                            transform: isActive ? "scale(1.02)" : "scale(1)",
                          }}>
                          <div className="font-black text-sm mb-2" style={{ color: bin.color }}>{bin.emoji} {bin.label}</div>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {itemsInBin.map(item => {
                              const res = dragResults[`${block.id}-${item.id}`];
                              return (
                                <span key={item.id} className="text-xs px-2 py-0.5 rounded-full font-bold"
                                  style={{ background: res?.correct ? "#052e16" : "#2d0a0a", color: res?.correct ? "#10b981" : "#ef4444", border: `1px solid ${res?.correct ? "#10b98130" : "#ef444430"}` }}>
                                  {item.emoji ?? ""} {item.label}
                                </span>
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Items à placer */}
                  {!allAnswered && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {pendingItems.map(item => (
                        <button key={item.id}
                          onClick={() => handleItemTap(item.id)}
                          className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                          style={{
                            background: bDragSelected === item.id ? "#2d1a5e" : "#1e293b",
                            border: `2px solid ${bDragSelected === item.id ? "#a78bfa" : "#334155"}`,
                            color: bDragSelected === item.id ? "#e9d5ff" : "#cbd5e1",
                            transform: bDragSelected === item.id ? "scale(1.05)" : "scale(1)",
                          }}>
                          {item.emoji && <span className="mr-1">{item.emoji}</span>}{item.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {allAnswered && (
                    <>
                      <div className="mt-4 text-center rounded-xl py-4 font-black"
                        style={{ background: correctCount === raw.items.length ? "#052e16" : "#1e293b", color: correctCount === raw.items.length ? "#10b981" : "#FDB813" }}>
                        {correctCount === raw.items.length ? "🏆 Parfait — tout bien classé !" : `💪 ${correctCount}/${raw.items.length} bien placés`}
                      </div>
                      {/* Corrections pour les erreurs */}
                      {raw.items.some(item => dragResults[`${block.id}-${item.id}`]?.correct === false) && (
                        <div className="mt-3 space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#f59e0b" }}>💡 À retenir</div>
                          {raw.items.filter(item => dragResults[`${block.id}-${item.id}`]?.correct === false).map(item => {
                            const correctBin = raw.bins.find(b => b.id === item.correct);
                            return (
                              <div key={item.id} className="rounded-xl px-4 py-2.5 text-xs"
                                style={{ background: "#1a0f00", border: "1px solid #78350f40", color: "#d97706" }}>
                                <span className="font-bold">{item.emoji} {item.label}</span>
                                <span style={{ color: "#475569" }}> → devait aller dans </span>
                                <span className="font-bold" style={{ color: correctBin?.color ?? "#FDB813" }}>{correctBin?.label}</span>
                                {item.hint && <div className="mt-1 opacity-80">→ {item.hint}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── Bouton terminer ── */}
      {!completed && (
        <div className="mt-10 pt-6 space-y-3" style={{ borderTop: "1px solid #1e293b" }}>
          {readOnly ? (
            <div className="rounded-2xl px-6 py-4 text-center font-bold text-sm"
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
              👁️ Mode aperçu professeur — aucune progression enregistrée
            </div>
          ) : (
            <>
              {!canFinish && (
                <p className="text-center text-sm font-semibold" style={{ color: "#475569" }}>
                  {!allQuizDone ? "🧠 Réponds à toutes les questions pour terminer" : ""}
                </p>
              )}
              <button
                onClick={handleComplete}
                disabled={!canFinish || isPending}
                className="w-full font-black py-5 rounded-2xl text-lg transition-all"
                style={canFinish && !isPending
                  ? { background: "#FDB813", color: "#0f172a", boxShadow: "0 0 30px #FDB81330" }
                  : { background: "#1e293b", color: "#334155", border: "1px solid #1e293b" }
                }
              >
                {isPending ? "Enregistrement…" : canFinish ? `✅ Terminer l'entraînement · +${xpReward} XP` : "Entraînement en cours…"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Markdown helpers ── */
function parseTable(block: string): string {
  const lines = block.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return block;
  const isSep = (l: string) => /^\|[\s\-|:]+\|$/.test(l.trim());
  if (!isSep(lines[1])) return block;
  const tdStyle = `border:1px solid rgba(71,85,105,0.6);padding:6px 12px;color:#cbd5e1`;
  const thStyle = `${tdStyle};color:#f1f5f9;font-weight:700;text-align:left`;
  const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const headers = cells(lines[0]).map(h => `<th style="${thStyle}">${h}</th>`).join("");
  const rows = lines.slice(2).map((l, i) =>
    `<tr style="background:${i % 2 === 0 ? "rgba(30,41,59,0.4)" : "transparent"}">${cells(l).map(c => `<td style="${tdStyle}">${c}</td>`).join("")}</tr>`
  ).join("");
  return `<div style="overflow-x:auto;margin:12px 0"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:rgba(71,85,105,0.5)">${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function simpleMarkdown(md: string): string {
  md = md.replace(/(^\|.+\n)(^\|[\s\-|:]+\|\n)((?:^\|.+\n?)*)/gm, (m) => parseTable(m));
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, "<p>$1</p>");
}
