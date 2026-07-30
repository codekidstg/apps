"use client";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { completeLesson, solveBlockly, syncBlockProgress } from "../../actions";
import { showBadgeToast } from "@/components/eleve/BadgeToast";
import type { BadgeId } from "@/lib/gamification/badges";
import { BADGES } from "@/lib/gamification/badges";
import BlocklyRobot from "@/components/eleve/BlocklyRobotLoader";
import BlocklyKodi from "@/components/eleve/BlocklyKodiLoader";
import BlocklyMusic from "@/components/eleve/BlocklyMusicLoader";
import dynamic from "next/dynamic";
const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });

type Block = {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order_index: number;
};

type Props = {
  lessonId: string;
  title: string;
  blocks: Block[];
  alreadyCompleted: boolean;
  xpReward: number;
  nextLessonId?: string | null;
  themeId?: string;
  savedBlockProgress?: Record<string, unknown> | null;
  readOnly?: boolean;
};

type SavedProgress = {
  quizAnswers:   Record<string, number | null>;
  quizResults:   Record<string, boolean | null>;
  codeResults:   Record<string, boolean>;
  codeValues:    Record<string, string>;
  solvedBlockly: Record<string, boolean>;
  gameStates:    Record<string, unknown>;
};

function loadProgress(lessonId: string): SavedProgress {
  try {
    const raw = localStorage.getItem(`ck:quest:${lessonId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { quizAnswers: {}, quizResults: {}, codeResults: {}, codeValues: {}, solvedBlockly: {}, gameStates: {} };
}

function saveProgress(lessonId: string, p: SavedProgress) {
  try { localStorage.setItem(`ck:quest:${lessonId}`, JSON.stringify(p)); } catch {}
}

export default function QuestReader({ lessonId, title, blocks, alreadyCompleted, xpReward, nextLessonId, themeId, savedBlockProgress, readOnly = false }: Props) {
  const [hydrated, setHydrated]             = useState(false);
  const [quizAnswers, setQuizAnswers]       = useState<Record<string, number | null>>({});
  const [quizResults, setQuizResults]       = useState<Record<string, boolean | null>>({});
  const [solvedBlockly, setSolvedBlockly]   = useState<Record<string, boolean>>({});
  const [completed, setCompleted]           = useState(alreadyCompleted);
  const [xpGained, setXpGained]            = useState<number | null>(null);
  const [isPending, startTransition]        = useTransition();
  const [codeResults, setCodeResults]       = useState<Record<string, boolean>>({});
  const [codeValues, setCodeValues]         = useState<Record<string, string>>({});
  const [gameStates, setGameStates]         = useState<Record<string, unknown>>({});

  const dbSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let merged: SavedProgress;
    if (savedBlockProgress && Object.keys(savedBlockProgress).length > 0) {
      merged = {
        quizAnswers:   (savedBlockProgress.quizAnswers   as Record<string, number | null>) ?? {},
        quizResults:   (savedBlockProgress.quizResults   as Record<string, boolean | null>) ?? {},
        codeResults:   (savedBlockProgress.codeResults   as Record<string, boolean>) ?? {},
        codeValues:    (savedBlockProgress.codeValues    as Record<string, string>) ?? {},
        solvedBlockly: (savedBlockProgress.solvedBlockly as Record<string, boolean>) ?? {},
        gameStates:    (savedBlockProgress.gameStates    as Record<string, unknown>) ?? {},
      };
    } else {
      merged = loadProgress(lessonId);
    }
    setQuizAnswers(merged.quizAnswers);
    setQuizResults(merged.quizResults);
    setCodeResults(merged.codeResults);
    setCodeValues(merged.codeValues ?? {});
    setSolvedBlockly(merged.solvedBlockly);
    setGameStates(merged.gameStates ?? {});
    setHydrated(true);
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((patch: Partial<SavedProgress>) => {
    const full: SavedProgress = {
      quizAnswers, quizResults, codeResults, codeValues, solvedBlockly, gameStates, ...patch,
    };
    saveProgress(lessonId, full);
    if (readOnly) return;
    if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
    dbSyncTimer.current = setTimeout(() => {
      syncBlockProgress(lessonId, full as unknown as Record<string, unknown>).catch(() => {});
    }, 2000);
  }, [lessonId, quizAnswers, quizResults, codeResults, codeValues, solvedBlockly, gameStates, readOnly]);

  const answerQuiz = useCallback((qKey: string, ci: number, correct: number) => {
    const newAnswers = { ...quizAnswers, [qKey]: ci };
    const newResults = { ...quizResults, [qKey]: ci === correct };
    setQuizAnswers(newAnswers);
    setQuizResults(newResults);
    persist({ quizAnswers: newAnswers, quizResults: newResults });
  }, [quizAnswers, quizResults, persist]);

  const markCodeDone = useCallback((blockId: string) => {
    const newCode = { ...codeResults, [blockId]: true };
    setCodeResults(newCode);
    if (readOnly) return;
    const full: SavedProgress = { quizAnswers, quizResults, codeResults: newCode, codeValues, solvedBlockly, gameStates };
    saveProgress(lessonId, full);
    if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
    syncBlockProgress(lessonId, full as unknown as Record<string, unknown>).catch(() => {});
  }, [codeResults, quizAnswers, quizResults, codeValues, solvedBlockly, gameStates, lessonId, readOnly]);

  const saveCodeValue = useCallback((blockId: string, code: string) => {
    const newVals = { ...codeValues, [blockId]: code };
    setCodeValues(newVals);
    persist({ codeValues: newVals });
  }, [codeValues, persist]);

  const markGameDone = useCallback((blockId: string) => {
    const newGames = { ...solvedBlockly, [blockId]: true };
    setSolvedBlockly(newGames);
    if (readOnly) return;
    const full: SavedProgress = { quizAnswers, quizResults, codeResults, codeValues, solvedBlockly: newGames, gameStates };
    saveProgress(lessonId, full);
    if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
    syncBlockProgress(lessonId, full as unknown as Record<string, unknown>).catch(() => {});
  }, [solvedBlockly, quizAnswers, quizResults, codeResults, codeValues, gameStates, lessonId, readOnly]);

  const saveGameState = useCallback((blockId: string, state: unknown) => {
    const newStates = { ...gameStates, [blockId]: state };
    setGameStates(newStates);
    persist({ gameStates: newStates });
  }, [gameStates, persist]);

  const quizBlocks  = blocks.filter((b) => b.type === "quiz");
  const allQuizDone = quizBlocks.every((b) => {
    type QQ = { questions?: { answer: number }[]; choices?: string[] };
    const raw = b.content as QQ;
    const count = raw.questions?.length ?? 1;
    return Array.from({ length: count }, (_, qi) => `${b.id}-${qi}`).every((k) => quizResults[k] != null);
  });
  const allBlockly  = blocks.filter((b) => b.type === "blockly" || b.type === "game");
  const allBlocklyDone = allBlockly.every((b) => solvedBlockly[b.id]);
  const codeBlocks  = blocks.filter((b) => b.type === "code_challenge");
  const allCodeDone = codeBlocks.every((b) => {
    const cfg = b.content as { required?: boolean };
    return !cfg.required || codeResults[b.id];
  });
  const canFinish = allQuizDone && allBlocklyDone && allCodeDone;

  function handleBlocklySolved(blockId: string) {
    markGameDone(blockId);
    if (readOnly) return;
    startTransition(async () => {
      const res = await solveBlockly(lessonId) as any;
      if (res?.newBadges?.length) {
        (res.newBadges as BadgeId[]).forEach((id) => {
          const b = BADGES[id];
          if (b) showBadgeToast(id, b.xpBonus);
        });
      }
    });
  }

  function handleComplete() {
    if (readOnly) { setCompleted(true); return; }
    const perfect = quizBlocks.every((b) => {
      type QQ = { questions?: { answer: number }[] };
      const raw = b.content as QQ;
      const count = raw.questions?.length ?? 1;
      return Array.from({ length: count }, (_, qi) => `${b.id}-${qi}`).every((k) => quizResults[k] === true);
    });
    startTransition(async () => {
      const res = await completeLesson(lessonId, perfect ? 100 : 70, perfect) as any;
      if (res?.xpGained) setXpGained(res.xpGained);
      if (res?.newBadges?.length) {
        (res.newBadges as BadgeId[]).forEach((id) => {
          const b = BADGES[id];
          if (b) showBadgeToast(id, b.xpBonus);
        });
      }
      try { localStorage.removeItem(`ck:quest:${lessonId}`); } catch {}
      setCompleted(true);
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Completed banner */}
      {completed && xpGained != null && (
        <div className="mb-8 rounded-2xl px-8 py-5 flex items-center gap-5"
          style={{ background: "#10b98115", border: "1.5px solid #10b98140", boxShadow: "0 0 30px #10b98110" }}>
          <div className="text-4xl">🎉</div>
          <div>
            <div className="font-black text-lg" style={{ color: "#10b981" }}>Quête terminée !</div>
            <div className="text-sm mt-0.5 font-mono" style={{ color: "#10b981" }}>+{xpGained} XP gagnés — ta cité grandit !</div>
          </div>
        </div>
      )}

      {hydrated && !completed && (
        <div className="flex items-center gap-1.5 text-xs mb-4 font-mono" style={{ color: "#334155" }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#10b981" }}></span>
          Progression sauvegardée automatiquement
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-6">
        {blocks.map((block) => {
          if (block.type === "text") {
            const c = block.content as { html?: string; markdown?: string };
            const html = c.html ?? mdToHtml(c.markdown ?? "");
            return (
              <div
                key={block.id}
                className="lesson-prose rounded-2xl p-8"
                style={{ background: "#1e293b", border: "1px solid #334155" }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          if (block.type === "video") {
            const c = block.content as { url?: string; title?: string };
            const embedUrl = toEmbedUrl(c.url ?? "");
            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
                {embedUrl ? (
                  <iframe src={embedUrl} className="w-full aspect-video" allowFullScreen />
                ) : (
                  <div className="p-8 font-bold" style={{ background: "#1e293b", color: "#475569" }}>🎬 {c.url || "URL vidéo manquante"}</div>
                )}
                {c.title && (
                  <div className="px-6 py-3 flex items-center gap-2" style={{ background: "#0f172a", borderTop: "1px solid #1e293b" }}>
                    <span className="text-sm" style={{ color: "#FDB813" }}>▶</span>
                    <span className="font-bold text-sm text-white">{c.title}</span>
                  </div>
                )}
              </div>
            );
          }

          if (block.type === "quiz") {
            type QQuestion = { question: string; choices: string[]; answer: number; explanation?: string };
            const raw = block.content as { questions?: QQuestion[] } & QQuestion;
            const questions: QQuestion[] = raw.questions ?? [{ question: raw.question, choices: raw.choices, answer: raw.answer, explanation: raw.explanation }];
            const answeredCount = Object.keys(quizResults).filter(k => k.startsWith(block.id)).length;

            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
                <div className="px-8 py-4 flex items-center gap-3" style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                  <span className="text-2xl">❓</span>
                  <div>
                    <div className="font-black text-base text-white">Quiz de compréhension</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: "#475569" }}>{questions.length} question{questions.length > 1 ? "s" : ""}</div>
                  </div>
                  <div className="ml-auto text-xs font-mono font-black" style={{ color: "#FDB813" }}>
                    {answeredCount}/{questions.length} répondu{questions.length > 1 ? "es" : "e"}
                  </div>
                </div>
                <div style={{ background: "#1e293b" }}>
                  {questions.map((q, qi) => {
                    const qKey = `${block.id}-${qi}`;
                    const chosen = quizAnswers[qKey] ?? null;
                    const result = quizResults[qKey] ?? null;
                    return (
                      <div key={qKey} className="px-8 py-6" style={{ borderBottom: "1px solid #0f172a" }}>
                        <div className="flex items-start gap-3 mb-4">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                            style={{
                              background: result === true ? "#10b98120" : result === false ? "#ef444420" : "#0f172a",
                              color: result === true ? "#10b981" : result === false ? "#ef4444" : "#475569",
                              border: `1px solid ${result === true ? "#10b98140" : result === false ? "#ef444440" : "#334155"}`,
                            }}>
                            {result === true ? "✓" : result === false ? "✗" : qi + 1}
                          </span>
                          <p className="font-bold text-base leading-snug text-white">{q.question}</p>
                        </div>
                        <div className="space-y-2 ml-10">
                          {(q.choices ?? []).map((choice, ci) => {
                            const isChosen  = chosen === ci;
                            const isCorrect = ci === q.answer;
                            let bg = "#0f172a", border = "#334155", color = "#94a3b8";
                            if (result != null) {
                              if (isCorrect)     { bg = "#10b98115"; border = "#10b98140"; color = "#10b981"; }
                              else if (isChosen) { bg = "#ef444415"; border = "#ef444440"; color = "#ef4444"; }
                              else               { bg = "#0f172a";   border = "#1e293b";   color = "#334155"; }
                            }
                            return (
                              <button
                                key={ci}
                                onClick={() => { if (result != null) return; answerQuiz(qKey, ci, q.answer); }}
                                disabled={result != null}
                                className="w-full text-left px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 hover:brightness-110"
                                style={{ background: bg, border: `1px solid ${border}`, color }}
                              >
                                <span className="mr-2 font-mono" style={{ color: "#334155" }}>{["A", "B", "C", "D"][ci]}.</span>
                                {isCorrect && result != null ? "✓ " : ""}{choice}
                              </button>
                            );
                          })}
                        </div>
                        {result != null && q.explanation && (
                          <div className="mt-4 ml-10 text-sm rounded-xl px-5 py-3.5 font-mono"
                            style={{
                              background: result ? "#10b98110" : "#FDB81310",
                              color: result ? "#10b981" : "#FDB813",
                              borderLeft: `3px solid ${result ? "#10b981" : "#FDB813"}`,
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

          if (block.type === "code_challenge") {
            const cfg = block.content as {
              instructions?: string;
              starter_code?: string;
              hidden_tests?: string;
              expected_output?: string;
              language?: "python" | "javascript" | "html";
              required?: boolean;
            };
            const done = codeResults[block.id];
            return (
              <div key={block.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #334155" }}>
                <div className="px-8 py-4 flex items-center gap-3" style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                  <span className="text-2xl">💻</span>
                  <div>
                    <div className="font-black text-base text-white">Défi code</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: "#a78bfa" }}>{cfg.language ?? "python"}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {cfg.required && !done && (
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-full"
                        style={{ background: "#FDB81320", color: "#FDB813", border: "1px solid #FDB81340" }}>Obligatoire</span>
                    )}
                    {done && (
                      <span className="text-xs font-mono font-black px-3 py-1 rounded-full"
                        style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi !</span>
                    )}
                  </div>
                </div>
                <div className="p-8 space-y-5" style={{ background: "#1e293b" }}>
                  {cfg.instructions && (
                    <div className="text-sm leading-relaxed [&_h3]:font-black [&_h3]:text-base [&_h3]:mb-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_strong]:font-bold"
                      style={{ color: "#94a3b8" }}
                      dangerouslySetInnerHTML={{ __html: cfg.instructions }} />
                  )}
                  <PythonRunner
                    starterCode={cfg.starter_code ?? "# Écris ton code ici\n"}
                    initialCode={codeValues[block.id]}
                    onCodeChange={(c) => saveCodeValue(block.id, c)}
                    hiddenTests={cfg.hidden_tests}
                    expectedOutput={cfg.expected_output}
                    language={cfg.language ?? "python"}
                    onSuccess={() => markCodeDone(block.id)}
                  />
                </div>
              </div>
            );
          }

          if (block.type === "blockly" || block.type === "game") {
            const cfg = block.content as Record<string, unknown>;
            const gameType = (cfg.game_type as string | undefined) ?? "maze";
            const done = solvedBlockly[block.id];
            const markDone = () => handleBlocklySolved(block.id);

            if (gameType === "kodi_output") {
              const kodiCfg = cfg as any;
              const savedXml = (gameStates[block.id] as string | undefined);
              return (
                <div key={block.id} className="space-y-3">
                  {done && (
                    <div className="rounded-2xl px-5 py-4 flex items-center gap-4"
                      style={{ background: "#10b98115", border: "1px solid #10b98140" }}>
                      <span className="text-3xl">🎉</span>
                      <div>
                        <div className="font-black text-base" style={{ color: "#10b981" }}>Défi résolu !</div>
                        <div className="text-xs mt-0.5 font-mono" style={{ color: "#10b981" }}>Tu peux continuer.</div>
                      </div>
                    </div>
                  )}
                  <BlocklyKodi
                    config={kodiCfg as any}
                    onSolved={done ? () => {} : markDone}
                    savedXml={savedXml}
                    onXmlChange={(xml) => saveGameState(block.id, xml)}
                  />
                </div>
              );
            }

            if (gameType === "maze" || block.type === "blockly") {
              return (
                <div key={block.id} className="space-y-3">
                  {done && (
                    <div className="rounded-xl px-4 py-3 text-sm font-black font-mono"
                      style={{ background: "#10b98115", border: "1px solid #10b98140", color: "#10b981" }}>
                      ✅ Défi résolu ! +40 XP
                    </div>
                  )}
                  <BlocklyRobot
                    config={cfg as Parameters<typeof BlocklyRobot>[0]["config"]}
                    onSolved={done ? () => {} : markDone}
                    savedXml={gameStates[block.id] as string | undefined}
                    onXmlChange={(xml) => saveGameState(block.id, xml)}
                  />
                </div>
              );
            }

            if (gameType === "music") {
              return (
                <div key={block.id} className="space-y-3">
                  {done && (
                    <div className="rounded-xl px-4 py-3 text-sm font-black font-mono"
                      style={{ background: "#10b98115", border: "1px solid #10b98140", color: "#10b981" }}>
                      ✅ Défi musical résolu ! +40 XP
                    </div>
                  )}
                  <BlocklyMusic
                    config={cfg as Parameters<typeof BlocklyMusic>[0]["config"]}
                    onSolved={done ? () => {} : markDone}
                    savedXml={gameStates[block.id] as string | undefined}
                    onXmlChange={(xml) => saveGameState(block.id, xml)}
                  />
                </div>
              );
            }

            if (gameType === "memory") {
              const pairs = (cfg.pairs as { left: string; right: string }[]) ?? [];
              return <MemoryGame key={block.id} blockId={block.id} title={cfg.title as string} description={cfg.description as string | undefined} pairs={pairs} done={done} onSolved={markDone} savedMatched={(gameStates[block.id] as string[]) ?? []} onStateChange={(s) => saveGameState(block.id, s)} />;
            }

            if (gameType === "sort") {
              const items = (cfg.items as string[]) ?? [];
              return <SortGame key={block.id} blockId={block.id} title={cfg.title as string} description={cfg.description as string | undefined} items={items} done={done} onSolved={markDone} savedOrder={(gameStates[block.id] as string[]) ?? []} onStateChange={(s) => saveGameState(block.id, s)} />;
            }

            if (gameType === "fill_blank") {
              const blanks = (cfg.blanks as string[]) ?? [];
              const template = (cfg.template as string) ?? "";
              return <FillBlankGame key={block.id} blockId={block.id} title={cfg.title as string} template={template} blanks={blanks} done={done} onSolved={markDone} savedAnswers={(gameStates[block.id] as string[]) ?? []} onStateChange={(s) => saveGameState(block.id, s)} />;
            }

            if (gameType === "bug_hunt") {
              const bh = cfg as any;
              return <BugHuntGame key={block.id} blockId={block.id} title={bh.title} description={bh.description} context={bh.context} instructions={bh.instructions ?? []} bugIndex={bh.bug_index ?? 0} fix={bh.fix ?? ""} explanation={bh.explanation} done={done} onSolved={markDone} savedState={(gameStates[block.id] as string) ?? null} onStateChange={(s) => saveGameState(block.id, s)} />;
            }

            return null;
          }

          return null;
        })}
      </div>

      {/* Finish button */}
      <div className="mt-12 pt-8" style={{ borderTop: "1px solid #1e293b" }}>
        {completed ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
            {nextLessonId ? (
              <a href={`/eleve/quete/${nextLessonId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-black px-10 py-4 rounded-2xl hover:opacity-90 transition-opacity text-lg"
                style={{ background: "#FDB813", color: "#0f172a" }}>
                Leçon suivante →
              </a>
            ) : themeId ? (
              <a href={`/eleve/theme/${themeId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-black px-10 py-4 rounded-2xl hover:opacity-90 transition-opacity text-lg"
                style={{ background: "#FDB813", color: "#0f172a" }}>
                🏆 Thème terminé — Retour
              </a>
            ) : null}
            <a href="/eleve"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl transition-colors"
              style={{ border: "1px solid #334155", color: "#475569", background: "#1e293b" }}>
              ← Ma cité
            </a>
          </div>
        ) : readOnly ? (
          <div className="rounded-2xl px-6 py-4 text-center font-bold text-sm"
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
            👁️ Mode aperçu professeur — aucune progression enregistrée
          </div>
        ) : (
          <div className="space-y-3">
            {!canFinish && (
              <p className="text-center text-sm font-mono font-semibold" style={{ color: "#475569" }}>
                {!allQuizDone ? "❓ Réponds à toutes les questions du quiz pour continuer" : !allBlocklyDone ? "🎮 Termine les jeux obligatoires" : ""}
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
              {isPending ? "Enregistrement…" : canFinish ? `✅ Terminer la quête  ·  +${xpReward} XP` : "Quête en cours…"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── YouTube embed URL ────────────────────────────────────────────────────────
function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return "";
}

// ── Markdown → HTML ──────────────────────────────────────────────────────────
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i].replace(/</g, "&lt;").replace(/>/g, "&gt;"));
        i++;
      }
      out.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
      i++; continue;
    }
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tableLines.push(lines[i]); i++; }
      const rows = tableLines.filter(r => !r.match(/^\|[-|\s:]+\|$/));
      const parseRow = (r: string, tag: string) => {
        const cells = r.split("|").slice(1, -1).map(c => `<${tag}>${inline(c.trim())}</${tag}>`).join("");
        return `<tr>${cells}</tr>`;
      };
      let html = "<table>";
      if (rows.length > 0) html += `<thead>${parseRow(rows[0], "th")}</thead>`;
      if (rows.length > 1) html += `<tbody>${rows.slice(1).map(r => parseRow(r, "td")).join("")}</tbody>`;
      html += "</table>";
      out.push(html); continue;
    }
    if (line.startsWith("# "))   { out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue; }
    if (line.startsWith("## "))  { out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (line.startsWith("### ")) { out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (line.startsWith("> "))   { out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); i++; continue; }
    if (line.match(/^---+$/))    { out.push("<hr/>"); i++; continue; }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(`<li>${inline(lines[i].slice(2))}</li>`); i++; }
      out.push(`<ul>${items.join("")}</ul>`); continue;
    }
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ""))}</li>`); i++; }
      out.push(`<ol>${items.join("")}</ol>`); continue;
    }
    if (line.trim() === "") { i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("|") && !lines[i].startsWith("- ") && !lines[i].startsWith("> ") && !lines[i].startsWith("```") && !lines[i].match(/^---+$/) && !lines[i].match(/^\d+\. /)) {
      paraLines.push(lines[i]); i++;
    }
    if (paraLines.length) out.push(`<p>${inline(paraLines.join(" "))}</p>`);
  }
  return out.join("\n");
}

function inline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/&amp;/g, "&");
}

// ── MemoryGame ───────────────────────────────────────────────────────────────
function MemoryGame({ title, description, pairs, done, onSolved, savedMatched, onStateChange }: {
  blockId: string; title?: string; description?: string; pairs: { left: string; right: string }[];
  done: boolean; onSolved: () => void;
  savedMatched: string[]; onStateChange: (s: string[]) => void;
}) {
  type Card = { id: string; label: string; pairIdx: number };
  const [cards, setCards] = useState<Card[]>(() => {
    const all: Card[] = [];
    pairs.forEach((p, i) => {
      all.push({ id: `L${i}`, label: p.left,  pairIdx: i });
      all.push({ id: `R${i}`, label: p.right, pairIdx: i });
    });
    return all;
  });
  useEffect(() => {
    setCards(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>(savedMatched);
  const [locked, setLocked] = useState(false);

  function flip(id: string) {
    if (locked || flipped.includes(id) || matched.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setLocked(true);
      const [a, b] = next.map((fid) => cards.find((c) => c.id === fid)!);
      if (a.pairIdx === b.pairIdx) {
        const newMatched = [...matched, a.id, b.id];
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        onStateChange(newMatched);
        if (newMatched.length === cards.length && !done) onSolved();
      } else {
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧠</span>
        <span className="font-black text-white">{title ?? "Jeu Mémoire"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      {description && <p className="text-sm mb-4 leading-relaxed" style={{ color: "#94a3b8" }}>{description}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          return (
            <button key={card.id} onClick={() => flip(card.id)}
              className="h-16 rounded-xl text-xs font-bold px-2 py-1 transition-all"
              style={{
                background: isMatched ? "#10b98120" : isFlipped ? "#FDB81315" : "#0f172a",
                border: isMatched ? "2px solid #10b98140" : isFlipped ? "2px solid #FDB81340" : "2px solid #1e293b",
                color: isMatched ? "#10b981" : isFlipped ? "#FDB813" : "#0f172a",
              }}>
              {isFlipped ? card.label : "?"}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-center font-mono" style={{ color: "#334155" }}>
        {matched.length / 2}/{pairs.length} paires trouvées
      </div>
    </div>
  );
}

// ── SortGame ─────────────────────────────────────────────────────────────────
function SortGame({ title, description, items, done, onSolved, savedOrder, onStateChange }: {
  blockId: string; title?: string; description?: string; items: string[];
  done: boolean; onSolved: () => void;
  savedOrder: string[]; onStateChange: (s: string[]) => void;
}) {
  const [order, setOrder] = useState<string[]>(() =>
    savedOrder.length === items.length ? savedOrder : [...items]
  );
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (savedOrder.length !== items.length) {
      setOrder([...items].sort(() => Math.random() - 0.5));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expectedOutput = items.map(item => {
    const m = item.match(/print\(["'](.*)["']\)/);
    return m ? m[1] : item;
  }).join("\n");

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    setChecked(false);
    onStateChange(next);
  }

  function check() {
    const ok = order.every((item, i) => item === items[i]);
    setChecked(true);
    setCorrect(ok);
    if (ok && !done) onSolved();
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔢</span>
        <span className="font-black text-white">{title ?? "Remets dans l'ordre"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      {description && <p className="text-sm mb-4 leading-relaxed whitespace-pre-line" style={{ color: "#94a3b8", fontFamily: description.includes("■") ? "monospace" : "inherit" }}>{description}</p>}
      <div className="space-y-2">
        {order.map((item, idx) => (
          <div key={item} className="flex items-center gap-2">
            <span className="text-xs w-5 text-right font-mono" style={{ color: "#334155" }}>{idx + 1}.</span>
            <div className="flex-1 rounded-xl px-3 py-2 text-sm font-mono"
              style={{ background: "#0f172a", color: "#FDB813", border: "1px solid #1e293b" }}>{item}</div>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(idx, -1)} className="text-xs leading-none hover:opacity-70" style={{ color: "#475569" }}>▲</button>
              <button onClick={() => move(idx,  1)} className="text-xs leading-none hover:opacity-70" style={{ color: "#475569" }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      {checked && (
        <div className="mt-3 text-sm rounded-xl px-4 py-2 font-bold font-mono"
          style={correct
            ? { background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }
            : { background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}>
          {correct ? "✅ Parfait ! C'est le bon ordre !" : "❌ Pas tout à fait… Essaie encore !"}
        </div>
      )}
      {!done && (
        <div className="mt-3 flex gap-2">
          <button onClick={check} className="flex-1 font-black py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
            style={{ background: "#FDB813", color: "#0f172a" }}>
            Vérifier l'ordre
          </button>
          <button onClick={() => setShowHint(!showHint)} className="text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            style={{ background: "#0f172a", color: "#475569", border: "1px solid #1e293b" }}>
            💡 Aide
          </button>
        </div>
      )}
      {showHint && (
        <div className="mt-3 rounded-xl p-4" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
          <div className="text-xs font-mono font-black mb-2" style={{ color: "#334155" }}>Sortie attendue :</div>
          <pre className="font-mono text-xs leading-relaxed" style={{ color: "#FDB813" }}>{expectedOutput}</pre>
        </div>
      )}
    </div>
  );
}

// ── BugHuntGame ──────────────────────────────────────────────────────────────
function BugHuntGame({ title, description, context, instructions, bugIndex, fix, explanation, done, onSolved, savedState, onStateChange }: {
  blockId: string; title?: string; description?: string; context?: string;
  instructions: string[]; bugIndex: number; fix: string; explanation?: string;
  done: boolean; onSolved: () => void;
  savedState: string | null; onStateChange: (s: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(
    savedState != null && savedState !== "" ? parseInt(savedState) : null
  );
  const [wrong, setWrong] = useState<number | null>(null);
  const solved = selected === bugIndex || done;

  function select(idx: number) {
    if (solved) return;
    if (idx === bugIndex) {
      setSelected(idx);
      onStateChange(String(idx));
      onSolved();
    } else {
      setWrong(idx);
      setTimeout(() => setWrong(null), 800);
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🕵️</span>
        <span className="font-black text-white">{title ?? "Trouve le bug !"}</span>
        {solved && (
          <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Trouvé !</span>
        )}
      </div>
      {description && <p className="text-sm mb-3 leading-relaxed" style={{ color: "#94a3b8" }}>{description}</p>}
      {context && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm font-mono whitespace-pre-line" style={{ background: "#0f172a", color: "#60a5fa", border: "1px solid #1e293b" }}>
          {context}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {instructions.map((inst, idx) => {
          const isBug    = solved && idx === bugIndex;
          const isWrong  = wrong === idx;
          return (
            <button key={idx} onClick={() => select(idx)} disabled={solved}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm transition-all duration-150"
              style={{
                background: isBug ? "#10b98115" : isWrong ? "#ef444415" : "#0f172a",
                border:     isBug ? "2px solid #10b98140" : isWrong ? "2px solid #ef444440" : "2px solid #1e293b",
                color:      isBug ? "#10b981" : isWrong ? "#ef4444" : "#FDB813",
                cursor:     solved ? "default" : "pointer",
              }}>
              <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: "#334155" }}>{idx + 1}.</span>
              <span className="flex-1">{inst}</span>
              {isBug    && <span className="text-xs font-bold" style={{ color: "#10b981" }}>← BUG !</span>}
              {isWrong  && <span className="text-xs font-bold" style={{ color: "#ef4444" }}>✗</span>}
            </button>
          );
        })}
      </div>

      {solved ? (
        <div className="rounded-xl px-5 py-4 space-y-2" style={{ background: "#052e16", border: "1px solid #166534" }}>
          <div className="font-black text-sm" style={{ color: "#10b981" }}>🎉 Bravo — bug trouvé !</div>
          <div className="text-sm font-mono" style={{ color: "#4ade80" }}>
            Ligne {bugIndex + 1} :{" "}
            <span style={{ color: "#ef4444", textDecoration: "line-through" }}>{instructions[bugIndex]}</span>
            {" → "}
            <span style={{ color: "#10b981" }}>{fix}</span>
          </div>
          {explanation && <div className="text-xs leading-relaxed mt-1" style={{ color: "#86efac" }}>💡 {explanation}</div>}
        </div>
      ) : (
        <p className="text-xs font-mono text-center" style={{ color: "#334155" }}>
          Clique sur l'instruction incorrecte 👆
        </p>
      )}
    </div>
  );
}

// ── FillBlankGame ─────────────────────────────────────────────────────────────
function FillBlankGame({ title, template, blanks, done, onSolved, savedAnswers, onStateChange }: {
  blockId: string; title?: string; template: string; blanks: string[];
  done: boolean; onSolved: () => void;
  savedAnswers: string[]; onStateChange: (s: string[]) => void;
}) {
  const parts = template.split("[___]");
  const [answers, setAnswers] = useState<string[]>(() =>
    savedAnswers.length === blanks.length ? savedAnswers : blanks.map(() => "")
  );
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function check() {
    const res = blanks.map((b, i) => answers[i].trim().toLowerCase() === b.toLowerCase());
    setResults(res);
    setChecked(true);
    if (res.every(Boolean) && !done) onSolved();
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔤</span>
        <span className="font-black text-white">{title ?? "Complète le code"}</span>
        {done && <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
          style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>}
      </div>
      <div className="rounded-xl p-4 font-mono text-sm leading-loose whitespace-pre-wrap"
        style={{ background: "#0f172a", color: "#FDB813", border: "1px solid #1e293b" }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <input
                type="text"
                value={answers[i]}
                onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); setChecked(false); onStateChange(a); }}
                className="inline-block w-20 text-center rounded px-1 mx-1 font-bold outline-none"
                style={{
                  borderBottom: !checked ? "2px solid rgba(255,255,255,0.2)" : results[i] ? "2px solid #10b981" : "2px solid #ef4444",
                  background: "rgba(255,255,255,0.05)",
                  color: !checked ? "white" : results[i] ? "#10b981" : "#ef4444",
                }}
                placeholder="___"
              />
            )}
          </span>
        ))}
      </div>
      {checked && !results.every(Boolean) && (
        <div className="mt-3 text-sm rounded-xl px-4 py-2 font-bold font-mono"
          style={{ background: "#FDB81310", color: "#FDB813", border: "1px solid #FDB81330" }}>
          💡 Les cases rouges ne sont pas correctes. Réessaie !
        </div>
      )}
      {!done && (
        <button onClick={check} className="mt-3 w-full font-black py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
          style={{ background: "#FDB813", color: "#0f172a" }}>
          Vérifier mes réponses
        </button>
      )}
    </div>
  );
}
