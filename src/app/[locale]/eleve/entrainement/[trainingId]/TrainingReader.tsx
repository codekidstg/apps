"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTransition } from "react";
import dynamic from "next/dynamic";
import { completeTraining } from "../../actions";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const BlocklyKodi  = dynamic(() => import("@/components/eleve/BlocklyKodi"), { ssr: false });

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

export default function TrainingReader({ trainingId, blocks, xpReward, previousAttempts, previousScore, readOnly = false }: Props) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean | null>>({});
  const [codeResults, setCodeResults]  = useState<Record<string, boolean>>({});
  const [completed, setCompleted]      = useState(false);
  const [xpGained, setXpGained]       = useState<number | null>(null);
  const [finalScore, setFinalScore]    = useState<number | null>(null);
  const [isPending, startTransition]   = useTransition();

  const quizBlocks   = blocks.filter(b => b.type === "quiz");
  const codeBlocks   = blocks.filter(b => b.type === "code_challenge");
  const blocklyBlocks = blocks.filter(b => b.type === "blockly_challenge");

  const allQuizDone = quizBlocks.every(b => {
    type QQ = { questions?: { answer: number }[] };
    const raw = b.content as QQ;
    const count = raw.questions?.length ?? 1;
    return Array.from({ length: count }, (_, qi) => `${b.id}-${qi}`).every(k => quizResults[k] != null);
  });
  const allCodeDone = codeBlocks.every(b => {
    const cfg = b.content as { required?: boolean };
    return !cfg.required || codeResults[b.id];
  });
  const allBlocklyDone = blocklyBlocks.every(b => {
    const cfg = b.content as { required?: boolean };
    return !cfg.required || codeResults[b.id];
  });
  const canFinish = allQuizDone && allCodeDone && allBlocklyDone;

  // Score calculé : % de bonnes réponses quiz
  const computeScore = useCallback(() => {
    const quizKeys = quizBlocks.flatMap(b => {
      type QQ = { questions?: { answer: number }[] };
      const raw = b.content as QQ;
      const count = raw.questions?.length ?? 1;
      return Array.from({ length: count }, (_, qi) => `${b.id}-${qi}`);
    });
    if (quizKeys.length === 0) return 100;
    const correct = quizKeys.filter(k => quizResults[k] === true).length;
    return Math.round((correct / quizKeys.length) * 100);
  }, [quizBlocks, quizResults]);

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
    setCompleted(false);
    setXpGained(null);
    setFinalScore(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Attempt badge */}
      {previousAttempts > 0 && !completed && (
        <div className="mb-6 flex items-center gap-3 bg-blue-900/20 border border-blue-800/40 rounded-xl px-5 py-3">
          <span className="text-xl">🔄</span>
          <div className="text-sm text-blue-300">
            <span className="font-black">Nouvelle tentative</span>
            <span className="text-blue-400 ml-2">· {previousAttempts} déjà effectuée{previousAttempts > 1 ? "s" : ""}</span>
            {previousScore != null && <span className="text-blue-400 ml-2">· Meilleur score : {previousScore}%</span>}
          </div>
        </div>
      )}

      {/* Completed banner */}
      {completed && (
        <div className="mb-8 bg-emerald-900/60 border border-emerald-700 rounded-2xl px-8 py-6">
          <div className="flex items-center gap-5 mb-4">
            <div className="text-5xl">{finalScore != null && finalScore >= 80 ? "🏆" : finalScore != null && finalScore >= 50 ? "💪" : "📚"}</div>
            <div>
              <div className="font-black text-emerald-300 text-xl">Entraînement terminé !</div>
              {xpGained != null && <div className="text-sm text-emerald-400 mt-1">+{xpGained} XP gagnés</div>}
              {finalScore != null && (
                <div className="text-sm text-emerald-400">Score : <span className="font-black text-white">{finalScore}%</span></div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm transition-colors"
            >
              🔄 Recommencer l&apos;entraînement
            </button>
            <a
              href="/eleve/entrainement"
              className="flex-1 border border-slate-600 text-slate-300 font-bold py-3 rounded-xl text-sm text-center hover:bg-slate-800 transition-colors"
            >
              ← Tous les entraînements
            </a>
          </div>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-6">
        {blocks.map((block) => {

          /* ── Texte ── */
          if (block.type === "text") {
            const c = block.content as { html?: string; markdown?: string };
            const html = c.html ?? (c.markdown ? simpleMarkdown(c.markdown) : "");
            return (
              <div key={block.id}
                className="lesson-prose bg-slate-800/60 rounded-2xl p-6 border border-slate-700/60"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          /* ── Quiz ── */
          if (block.type === "quiz") {
            type QQ = { question: string; choices: string[]; answer: number; explanation?: string };
            const raw = block.content as { questions?: QQ[] } & QQ;
            const questions: QQ[] = raw.questions ?? [{
              question: raw.question, choices: raw.choices,
              answer: raw.answer, explanation: raw.explanation,
            }];

            return (
              <div key={block.id} className="rounded-2xl border border-violet-800/40 overflow-hidden">
                <div className="bg-violet-900/25 border-b border-violet-800/40 px-6 py-4 flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <div className="font-black text-white">Quiz flash</div>
                    <div className="text-xs text-violet-300 mt-0.5">{questions.length} question{questions.length > 1 ? "s" : ""}</div>
                  </div>
                  <div className="ml-auto text-xs text-violet-400 font-bold">
                    {Object.keys(quizResults).filter(k => k.startsWith(block.id) && quizResults[k] != null).length}/{questions.length} répondu{questions.length > 1 ? "es" : "e"}
                  </div>
                </div>
                <div className="bg-slate-800/80 divide-y divide-slate-700/50">
                  {questions.map((q, qi) => {
                    const qKey = `${block.id}-${qi}`;
                    const chosen = quizAnswers[qKey] ?? null;
                    const result = quizResults[qKey] ?? null;
                    return (
                      <div key={qKey} className="px-6 py-5">
                        <div className="flex items-start gap-3 mb-4">
                          <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                            result === true ? "bg-emerald-500 text-white" :
                            result === false ? "bg-red-500 text-white" :
                            "bg-slate-600 text-slate-300"}`}>
                            {result === true ? "✓" : result === false ? "✗" : qi + 1}
                          </span>
                          <p className="font-bold text-white text-base leading-snug">{q.question}</p>
                        </div>
                        <div className="space-y-2 ml-10">
                          {(q.choices ?? []).map((choice, ci) => {
                            const isChosen  = chosen === ci;
                            const isCorrect = ci === q.answer;
                            let cls = "bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 border-slate-600";
                            if (result != null) {
                              if (isCorrect) cls = "bg-emerald-900/60 text-emerald-200 border-emerald-600";
                              else if (isChosen) cls = "bg-red-900/60 text-red-200 border-red-600";
                              else cls = "bg-slate-800/60 text-slate-500 border-slate-700";
                            }
                            return (
                              <button key={ci}
                                onClick={() => {
                                  if (result != null || completed) return;
                                  const newAnswers = { ...quizAnswers, [qKey]: ci };
                                  const newResults = { ...quizResults, [qKey]: ci === q.answer };
                                  setQuizAnswers(newAnswers);
                                  setQuizResults(newResults);
                                }}
                                disabled={result != null || completed}
                                className={`w-full text-left px-5 py-3 rounded-xl font-semibold text-sm border transition-all ${cls}`}
                              >
                                <span className="text-slate-500 mr-2">{["A","B","C","D"][ci]}.</span>
                                {isCorrect && result != null ? "✓ " : ""}{choice}
                              </button>
                            );
                          })}
                        </div>
                        {result != null && q.explanation && (
                          <div className={`mt-4 ml-10 text-sm rounded-xl px-5 py-3 border-l-4 ${
                            result ? "bg-emerald-900/40 text-emerald-300 border-emerald-500" :
                                     "bg-amber-900/40 text-amber-300 border-amber-500"}`}>
                            {result ? "✅ Bonne réponse ! " : "💡 "}{q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          /* ── Code ── */
          if (block.type === "code_challenge") {
            const cfg = block.content as {
              instructions?: string; starter_code?: string;
              hidden_tests?: string; expected_output?: string;
              language?: "python" | "javascript" | "html"; required?: boolean;
            };
            const done = codeResults[block.id];
            return (
              <div key={block.id} className="rounded-2xl border border-emerald-800/40 overflow-hidden">
                <div className="bg-emerald-900/25 border-b border-emerald-800/40 px-6 py-4 flex items-center gap-3">
                  <span className="text-2xl">💻</span>
                  <div>
                    <div className="font-black text-white">Mini-défi code</div>
                    <div className="text-xs text-emerald-300 mt-0.5">{cfg.language ?? "python"}</div>
                  </div>
                  {done && <span className="ml-auto text-xs font-black text-emerald-400 bg-emerald-900/50 border border-emerald-800/40 px-3 py-1 rounded-full">✅ Réussi !</span>}
                </div>
                <div className="bg-slate-800/80 p-6 space-y-4">
                  {cfg.instructions && (
                    <div className="text-slate-200 text-sm leading-relaxed [&_code]:text-amber-300 [&_code]:bg-slate-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_strong]:text-white"
                      dangerouslySetInnerHTML={{ __html: cfg.instructions }} />
                  )}
                  <PythonRunner
                    starterCode={cfg.starter_code ?? "# Écris ton code ici\n"}
                    hiddenTests={cfg.hidden_tests}
                    expectedOutput={cfg.expected_output}
                    language={cfg.language ?? "python"}
                    onSuccess={() => {
                      if (!completed) setCodeResults(prev => ({ ...prev, [block.id]: true }));
                    }}
                  />
                </div>
              </div>
            );
          }

          /* ── Blockly Kodi ── */
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
              <div key={block.id} className="rounded-2xl border border-orange-800/40 overflow-hidden">
                <div className="bg-orange-900/20 border-b border-orange-800/40 px-6 py-4 flex items-center gap-3">
                  <span className="text-2xl">🧱</span>
                  <div>
                    <div className="font-black text-white">Défi blocs — Kodi</div>
                    <div className="text-xs text-orange-300 mt-0.5">Programme visuel</div>
                  </div>
                  {done && <span className="ml-auto text-xs font-black text-emerald-400 bg-emerald-900/50 border border-emerald-800/40 px-3 py-1 rounded-full">✅ Réussi !</span>}
                </div>
                <div className="bg-slate-900/80 p-4">
                  {done && (
                    <div className="mb-3 bg-emerald-900/50 border border-emerald-700 rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-black text-emerald-300">
                      <span className="text-xl">🎉</span> Défi résolu ! Super travail !
                    </div>
                  )}
                  <BlocklyKodi
                    config={{
                      instructions: cfg.instructions ?? "",
                      expected_lines: cfg.expected_lines,
                      expected_contains: cfg.expected_contains,
                      max_blocks: cfg.max_blocks,
                      available_blocks: cfg.available_blocks,
                    }}
                    onSolved={() => {
                      if (!completed) setCodeResults(prev => ({ ...prev, [block.id]: true }));
                    }}
                  />
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Finish */}
      {!completed && (
        <div className="mt-10 pt-6 border-t border-slate-700/60 space-y-3">
          {readOnly ? (
            <div className="rounded-2xl px-6 py-4 text-center font-bold text-sm"
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
              👁️ Mode aperçu professeur — aucune progression enregistrée
            </div>
          ) : (
            <>
              {!canFinish && (
                <p className="text-center text-sm text-slate-500 font-semibold">
                  {!allQuizDone ? "🧠 Réponds à toutes les questions pour terminer" : ""}
                </p>
              )}
              <button
                onClick={handleComplete}
                disabled={!canFinish || isPending}
                className="w-full bg-brand-orange hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border disabled:border-slate-700 text-white font-black py-5 rounded-2xl text-lg transition-all"
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

function parseTable(block: string): string {
  const lines = block.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return block;
  const isSep = (l: string) => /^\|[\s\-|:]+\|$/.test(l.trim());
  if (!isSep(lines[1])) return block;
  const tdStyle = `border:1px solid rgba(71,85,105,0.6);padding:6px 12px;color:#cbd5e1`;
  const thStyle = `${tdStyle};color:#f1f5f9;font-weight:700;text-align:left`;
  const cells = (line: string) =>
    line.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const headers = cells(lines[0]).map(h => `<th style="${thStyle}">${h}</th>`).join("");
  const rows = lines.slice(2).map((l, i) =>
    `<tr style="background:${i % 2 === 0 ? "rgba(30,41,59,0.4)" : "transparent"}">${cells(l).map(c => `<td style="${tdStyle}">${c}</td>`).join("")}</tr>`
  ).join("");
  return `<div style="overflow-x:auto;margin:12px 0"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:rgba(71,85,105,0.5)">${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function simpleMarkdown(md: string): string {
  // Tables first (before other transforms)
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
