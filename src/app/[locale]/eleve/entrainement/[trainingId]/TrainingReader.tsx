"use client";
import { useState, useTransition } from "react";
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
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean | null>>({});
  const [codeResults, setCodeResults] = useState<Record<string, boolean>>({});
  const [completed, setCompleted]     = useState(false);
  const [xpGained, setXpGained]      = useState<number | null>(null);
  const [finalScore, setFinalScore]   = useState<number | null>(null);
  const [isPending, startTransition]  = useTransition();

  const quizBlocks    = blocks.filter(b => b.type === "quiz");
  const codeBlocks    = blocks.filter(b => b.type === "code_challenge");
  const blocklyBlocks = blocks.filter(b => b.type === "blockly_challenge");

  // — Progression —
  const allQuizKeys = quizBlocks.flatMap(b => {
    const raw = b.content as { questions?: { answer: number }[] };
    const count = raw.questions?.length ?? 1;
    return Array.from({ length: count }, (_, qi) => `${b.id}-${qi}`);
  });
  const doneQuiz    = allQuizKeys.filter(k => quizResults[k] != null).length;
  const totalQuiz   = allQuizKeys.length;
  const doneCode    = codeBlocks.filter(b => codeResults[b.id]).length;
  const doneBlockly = blocklyBlocks.filter(b => codeResults[b.id]).length;

  const requiredCode    = codeBlocks.filter(b => (b.content as any).required);
  const requiredBlockly = blocklyBlocks.filter(b => (b.content as any).required);
  const allQuizDone     = totalQuiz === 0 || doneQuiz === totalQuiz;
  const allCodeDone     = requiredCode.every(b => codeResults[b.id]);
  const allBlocklyDone  = requiredBlockly.every(b => codeResults[b.id]);
  const canFinish       = allQuizDone && allCodeDone && allBlocklyDone;

  // Progression globale pour la barre
  const totalSteps = totalQuiz + requiredCode.length + requiredBlockly.length;
  const doneSteps  = doneQuiz + doneCode + doneBlockly;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 100;

  function computeScore() {
    if (allQuizKeys.length === 0) return 100;
    const correct = allQuizKeys.filter(k => quizResults[k] === true).length;
    return Math.round((correct / allQuizKeys.length) * 100);
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
