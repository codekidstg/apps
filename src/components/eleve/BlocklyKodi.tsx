"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type KodiOutputConfig = {
  instructions: string;
  expected_lines?: string[];
  expected_contains?: string[];
  max_blocks?: number;
  available_blocks?: string[];
  starter_xml?: string;
};

type Props = {
  config: KodiOutputConfig;
  onSolved: () => void;
  savedXml?: string;
  onXmlChange?: (xml: string) => void;
};

type BubbleMsg = { text: string; type: "say" | "think" };

const BLOCK_COLORS: Record<string, string> = {
  kodi_say:            "#f97316",
  kodi_think:          "#8b5cf6",
  controls_repeat_ext: "#3b82f6",
  controls_if:         "#eab308",
  logic_compare:       "#06b6d4",
  variables_set:       "#10b981",
  variables_get:       "#34d399",
  text:                "#6366f1",
  math_number:         "#ec4899",
  math_arithmetic:     "#f43f5e",
  text_join:           "#a855f7",
};

function buildToolbox(available: string[] | undefined) {
  const all = available ?? ["kodi_say", "kodi_think", "controls_repeat_ext", "text", "math_number"];
  const contents: unknown[] = [];
  if (all.includes("kodi_say"))            contents.push({ kind: "block", type: "kodi_say" });
  if (all.includes("kodi_think"))          contents.push({ kind: "block", type: "kodi_think" });
  if (all.includes("controls_repeat_ext")) contents.push({ kind: "block", type: "controls_repeat_ext", inputs: { TIMES: { block: { type: "math_number", fields: { NUM: 3 } } } } });
  if (all.includes("controls_if"))         contents.push({ kind: "block", type: "controls_if" });
  if (all.includes("logic_compare"))       contents.push({ kind: "block", type: "logic_compare" });
  if (all.includes("variables_set"))       contents.push({ kind: "block", type: "variables_set" });
  if (all.includes("variables_get"))       contents.push({ kind: "block", type: "variables_get" });
  if (all.includes("text"))                contents.push({ kind: "block", type: "text" });
  if (all.includes("math_number"))         contents.push({ kind: "block", type: "math_number" });
  if (all.includes("math_arithmetic"))     contents.push({ kind: "block", type: "math_arithmetic" });
  if (all.includes("text_join"))           contents.push({ kind: "block", type: "text_join" });
  return { kind: "flyoutToolbox", contents } as any;
}

export default function BlocklyKodi({ config, onSolved, savedXml, onXmlChange }: Props) {
  const blocklyRef   = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<unknown>(null);
  const [messages, setMessages]     = useState<BubbleMsg[]>([]);
  const [status, setStatus]         = useState<"idle" | "running" | "success" | "fail">("idle");
  const [feedback, setFeedback]     = useState<string>("");
  const [blockCount, setBlockCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!blocklyRef.current) return;
    let ws: unknown = null;

    async function init() {
      const Blockly = await import("blockly");
      const { javascriptGenerator, Order } = await import("blockly/javascript");

      // ── Custom CodeKids dark theme ───────────────────────────────────
      const CodeKidsTheme = (Blockly as any).Theme.defineTheme("codekids_dark", {
        base: (Blockly as any).Themes?.Classic,
        componentStyles: {
          workspaceBackgroundColour: "#0f172a",
          toolboxBackgroundColour:   "#1e293b",
          toolboxForegroundColour:   "#e2e8f0",
          flyoutBackgroundColour:    "#1e293b",
          flyoutForegroundColour:    "#e2e8f0",
          flyoutOpacity:             1,
          scrollbarColour:           "#334155",
          scrollbarOpacity:          0.8,
          insertionMarkerColour:     "#f97316",
          insertionMarkerOpacity:    0.3,
          markerColour:              "#f97316",
          cursorColour:              "#f97316",
        },
        fontStyle: { family: "Inter, sans-serif", size: 12 },
      });

      // ── Custom blocks ────────────────────────────────────────────────
      (Blockly.Blocks as Record<string, unknown>)["kodi_say"] = {
        init(this: any) {
          this.appendValueInput("TEXT").setCheck(["String", "Number"])
            .appendField("💬  Kodi dit");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(BLOCK_COLORS.kodi_say);
          this.setTooltip("Kodi affiche un message");
          this.setStyle && this.setStyle("kodi_say");
        },
      };
      (Blockly.Blocks as Record<string, unknown>)["kodi_think"] = {
        init(this: any) {
          this.appendValueInput("TEXT").setCheck(["String", "Number"])
            .appendField("💭  Kodi pense");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(BLOCK_COLORS.kodi_think);
          this.setTooltip("Kodi pense à quelque chose");
        },
      };

      javascriptGenerator.forBlock["kodi_say"] = function (block: any) {
        const val = javascriptGenerator.valueToCode(block, "TEXT", Order.NONE) || '""';
        return `_say(String(${val}));\n`;
      };
      javascriptGenerator.forBlock["kodi_think"] = function (block: any) {
        const val = javascriptGenerator.valueToCode(block, "TEXT", Order.NONE) || '""';
        return `_think(String(${val}));\n`;
      };

      blocklyRef.current!.innerHTML = "";
      ws = Blockly.inject(blocklyRef.current!, {
        toolbox: buildToolbox(config.available_blocks),
        theme: CodeKidsTheme,
        scrollbars: true,
        trashcan: true,
        zoom: { controls: false, wheel: true, startScale: 0.95 },
        grid: { spacing: 20, length: 3, colour: "#1e3a5f", snap: true },
        media: "https://unpkg.com/blockly/media/",
      });
      workspaceRef.current = ws;

      const xml = savedXml ?? config.starter_xml;
      if (xml) {
        try {
          Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), ws as any);
        } catch { /* XML invalide ignoré */ }
      }

      (ws as any).addChangeListener(() => {
        setBlockCount((ws as any).getAllBlocks(false).length);
        if (onXmlChange) {
          try {
            onXmlChange(Blockly.utils.xml.domToText(Blockly.Xml.workspaceToDom(ws as any)));
          } catch { /* */ }
        }
      });

      requestAnimationFrame(() => setTimeout(() => (Blockly as any).svgResize?.(ws), 120));
    }

    init().catch(console.error);
    return () => { if (ws && (ws as any).dispose) (ws as any).dispose(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(async () => {
    const Blockly = await import("blockly");
    const ws = workspaceRef.current as any;
    if (!ws) return;
    const { javascriptGenerator } = await import("blockly/javascript");
    const code = javascriptGenerator.workspaceToCode(ws);
    setStatus("running");
    setMessages([]);
    setFeedback("");

    const output: BubbleMsg[] = [];
    const _say   = (t: string) => output.push({ text: t, type: "say" });
    const _think = (t: string) => output.push({ text: t, type: "think" });

    try {
      await new Function("_say", "_think", `return (async () => { ${code} })();`)(_say, _think);
    } catch {
      setStatus("fail");
      setFeedback("Une erreur dans les blocs 😬 Vérifie les connexions !");
      return;
    }

    // Animate bubbles one by one
    for (let i = 0; i < output.length; i++) {
      await new Promise(r => setTimeout(r, 250));
      setMessages(output.slice(0, i + 1));
    }

    const sayLines = output.filter(m => m.type === "say").map(m => m.text);

    if (config.expected_lines && config.expected_lines.length > 0) {
      const ok = config.expected_lines.every((line, i) => sayLines[i] === line);
      if (!ok) {
        setStatus("fail");
        setFeedback("Pas tout à fait… Kodi n'a pas dit exactement ce qu'on attendait. 🔍");
        return;
      }
    } else if (config.expected_contains && config.expected_contains.length > 0) {
      const all = output.map(m => m.text).join("\n");
      const ok = config.expected_contains.every(s => all.includes(s));
      if (!ok) {
        setStatus("fail");
        setFeedback("Il manque quelque chose dans ce que dit Kodi. Regarde bien la mission ! 🔍");
        return;
      }
    } else if (output.length === 0) {
      setStatus("fail");
      setFeedback("Kodi n'a rien dit ! Ajoute des blocs 💬 Kodi dit");
      return;
    }

    setStatus("success");
    setShowConfetti(true);
    setFeedback("🎉 Parfait ! Mission accomplie !");
    setTimeout(() => { setShowConfetti(false); onSolved(); }, 1200);
  }, [config, onSolved]);

  const reset = () => { setMessages([]); setStatus("idle"); setFeedback(""); };

  const maxReached = config.max_blocks != null && blockCount > config.max_blocks;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-xl flex flex-col" style={{ minHeight: 540 }}>

      {/* ── Header full width ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <span className="text-xl">🧱</span>
        <div className="flex-1">
          <div className="font-black text-white text-sm">Défi blocs</div>
          {config.max_blocks != null && (
            <div className={`text-xs font-bold mt-0.5 ${maxReached ? "text-red-400" : "text-slate-400"}`}>
              {blockCount} / {config.max_blocks} blocs{maxReached ? " — trop de blocs !" : ""}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={reset} disabled={status === "idle"}
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30">
            ↺ Reset
          </button>
          <button onClick={run}
            disabled={status === "running" || status === "success"}
            className={`text-xs font-black px-4 py-1.5 rounded-lg transition-all ${
              status === "success"
                ? "bg-emerald-600 text-white"
                : status === "running"
                ? "bg-slate-700 text-slate-400 cursor-wait"
                : "bg-brand-orange hover:bg-amber-500 text-white shadow-lg shadow-orange-900/40"
            }`}>
            {status === "running" ? "⏳ En cours…" : status === "success" ? "✅ Réussi !" : "▶ Lancer !"}
          </button>
        </div>
      </div>

      {/* ── Body : Workspace LEFT + Sidebar RIGHT ── */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT — Blockly workspace */}
        <div className="flex-1 relative" style={{ minHeight: 460 }}>
          <div className="absolute top-2 left-2 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-950/80 rounded-md">
            🔧 Zone de programmation
          </div>
          <div ref={blocklyRef} style={{ width: "100%", height: "100%", minHeight: 460 }} />
        </div>

        {/* RIGHT — Sidebar : Mission + Phone */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900/50 border-l border-slate-800">

          {/* ── Mission card ── */}
          <div className="flex-shrink-0 border-b border-slate-800">
            <div className="px-4 pt-4 pb-1">
              <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">🎯 Mission</div>
              {config.instructions ? (
                <div
                  className="text-sm text-slate-300 leading-relaxed
                    [&_h3]:font-black [&_h3]:text-white [&_h3]:text-sm [&_h3]:mb-1
                    [&_strong]:text-white [&_p]:mb-1.5 [&_code]:text-amber-300 [&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:rounded [&_code]:text-xs"
                  dangerouslySetInnerHTML={{ __html: config.instructions }}
                />
              ) : (
                <p className="text-sm text-slate-500 italic">Programme Kodi avec les blocs !</p>
              )}
            </div>

            {/* Objectif — lignes attendues */}
            {config.expected_lines && config.expected_lines.length > 0 && (
              <div className="px-4 pb-3 mt-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Résultat attendu</div>
                <div className="space-y-1">
                  {config.expected_lines.map((line, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono">
                      <span className="w-4 h-4 rounded-full bg-orange-900/60 text-orange-400 text-[9px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-slate-400 bg-slate-800/60 rounded px-2 py-0.5 flex-1 truncate">{line || <em className="text-slate-600">vide</em>}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objectif — mots-clés */}
            {(!config.expected_lines || config.expected_lines.length === 0) && config.expected_contains && config.expected_contains.length > 0 && (
              <div className="px-4 pb-3 mt-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Doit contenir</div>
                <div className="flex flex-wrap gap-1.5">
                  {config.expected_contains.map((kw, i) => (
                    <span key={i} className="bg-blue-900/50 border border-blue-800 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">"{kw}"</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Phone mockup ── */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-3 gap-2">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">📱 Écran de Kodi City</div>

            {/* Phone frame */}
            <div className={`relative flex-shrink-0 transition-all duration-500
              ${status === "success" ? "drop-shadow-[0_0_20px_rgba(52,211,153,0.55)]" : ""}
              ${status === "fail"    ? "drop-shadow-[0_0_20px_rgba(239,68,68,0.45)]"  : ""}
              ${status === "running" ? "drop-shadow-[0_0_16px_rgba(251,146,60,0.35)]" : ""}
            `} style={{ width: 210, height: 390 }}>

              {/* Body */}
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-b from-slate-600 to-slate-700 shadow-2xl" />
              {/* Inner screen bezel */}
              <div className="absolute inset-[7px] rounded-[29px] bg-slate-950 overflow-hidden flex flex-col">

                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-700 rounded-b-2xl z-20 flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <div className="w-3 h-2 rounded-full bg-slate-500" />
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 pt-6 pb-1 z-10 flex-shrink-0">
                  <span className="text-[9px] font-black text-slate-400">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none"><rect x="0" y="3" width="2.5" height="6" rx="0.5" fill="#64748b"/><rect x="3.5" y="1.5" width="2.5" height="7.5" rx="0.5" fill="#64748b"/><rect x="7" y="0" width="2.5" height="9" rx="0.5" fill="#94a3b8"/></svg>
                    <svg width="12" height="9" viewBox="0 0 16 11" fill="none"><rect x="0" y="3.5" width="13" height="7.5" rx="1.5" stroke="#64748b" strokeWidth="1.5"/><rect x="1.5" y="5" width="7" height="4.5" rx="0.5" fill="#94a3b8"/><path d="M14.5 6v3" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                </div>

                {/* App bar */}
                <div className={`flex items-center gap-2.5 px-3 py-2 flex-shrink-0 transition-colors duration-300 ${
                  status === "success" ? "bg-emerald-900/80" :
                  status === "fail"    ? "bg-red-900/70"     :
                  status === "running" ? "bg-orange-900/70"  :
                  "bg-slate-900"
                }`}>
                  <div className={`w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-base flex-shrink-0 ${
                    status === "running" ? "animate-pulse" : status === "success" ? "animate-bounce" : ""
                  }`}>🤖</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black text-white">KODI</div>
                    <div className={`text-[9px] font-bold ${
                      status === "running" ? "text-amber-400" :
                      status === "success" ? "text-emerald-400" :
                      status === "fail"    ? "text-red-400" : "text-slate-500"
                    }`}>
                      {status === "running" ? "⏳ Exécution…"  :
                       status === "success" ? "✅ Mission OK !" :
                       status === "fail"    ? "❌ Réessaie…"   : "● En attente"}
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-slate-950">
                  {status === "idle" && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="text-3xl opacity-20">📲</div>
                      <p className="text-[10px] text-slate-600 text-center italic leading-relaxed">
                        Lance le programme…<br />Kodi s'affichera ici
                      </p>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className="animate-fade-in">
                      {m.type === "say" ? (
                        <div className="flex items-end gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] flex-shrink-0 mb-0.5">🤖</div>
                          <div className="bg-slate-800 text-slate-100 text-[11px] font-medium rounded-2xl rounded-bl-sm px-3 py-1.5 max-w-[130px] break-words leading-snug">
                            {m.text}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <div className="bg-violet-900/60 text-violet-200 text-[11px] font-medium rounded-2xl rounded-br-sm px-3 py-1.5 max-w-[130px] break-words leading-snug italic border border-violet-800/40">
                            💭 {m.text}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {feedback && status !== "idle" && (
                    <div className={`rounded-xl px-3 py-2 text-[10px] font-black text-center leading-snug animate-fade-in ${
                      status === "success"
                        ? "bg-emerald-900/60 text-emerald-300 border border-emerald-800"
                        : "bg-red-900/50 text-red-300 border border-red-900"
                    }`}>
                      {feedback}
                    </div>
                  )}
                </div>

                {/* Home bar */}
                <div className="flex justify-center py-2 bg-slate-950 flex-shrink-0">
                  <div className="w-14 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>

              {/* Side buttons decorative */}
              <div className="absolute -right-[6px] top-20 w-[6px] h-12 bg-slate-600 rounded-r-md" />
              <div className="absolute -left-[6px] top-16 w-[6px] h-7 bg-slate-600 rounded-l-md" />
              <div className="absolute -left-[6px] top-28 w-[6px] h-10 bg-slate-600 rounded-l-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-2xl" aria-hidden>
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="absolute animate-confetti text-xl"
              style={{
                left: `${5 + i * 5.5}%`,
                animationDelay: `${(i * 60) % 400}ms`,
                animationDuration: `${700 + (i * 80) % 500}ms`,
              }}>
              {["🎉", "⭐", "🟠", "🔵", "💫", "✨"][i % 6]}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        @keyframes confetti { from { top: -10%; opacity: 1; } to { top: 110%; opacity: 0; } }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  );
}
