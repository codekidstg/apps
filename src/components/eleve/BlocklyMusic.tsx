"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Note = "Do" | "Re" | "Mi" | "Fa" | "Sol" | "La" | "Si";

type MusicConfig = {
  title?: string;
  instructions?: string;
  steps?: string[];
  target_notes?: Note[];
  free_mode?: boolean;
  min_notes?: number;
  available_blocks?: string[];
  max_blocks?: number;
  tempo?: number;
};

type Props = {
  config: MusicConfig;
  onSolved: () => void;
  savedXml?: string;
  onXmlChange?: (xml: string) => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const NOTE_FREQ: Record<Note, number> = {
  Do: 261.63, Re: 293.66, Mi: 329.63,
  Fa: 349.23, Sol: 392.00, La: 440.00, Si: 493.88,
};
const NOTES: Note[] = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const NOTE_LABEL: Record<Note, string> = {
  Do: "Do", Re: "Ré", Mi: "Mi", Fa: "Fa", Sol: "Sol", La: "La", Si: "Si",
};
const NOTE_COLOR: Record<Note, string> = {
  Do: "#ef4444", Re: "#f97316", Mi: "#eab308",
  Fa: "#22c55e", Sol: "#3b82f6", La: "#8b5cf6", Si: "#ec4899",
};
const ALL_MUSIC_BLOCKS = [
  { id: "music_play_note",     label: "🎵 Jouer une note", color: "#3b82f6" },
  { id: "music_pause",         label: "⏸ Silence",         color: "#64748b" },
  { id: "controls_repeat_ext", label: "🔁 Répéter",        color: "#059669", badge: "Clé !" },
];
const CONFETTI = ["🎵", "🎶", "🎸", "🎹", "🎺", "⭐", "✨", "🎉"];
// Black key positions: between white-key indices (Do=0…Si=6)
// C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb
const BLACK_KEY_AFTER = [1, 2, 4, 5, 6];

// ── Audio ─────────────────────────────────────────────────────────────────────
let _sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!_sharedCtx) {
    _sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _sharedCtx;
}

// Piano-like tone: fundamental + 2 harmonics, ADSR envelope
function playSound(freq: number, durationMs: number, ctx: AudioContext) {
  try {
    const t   = ctx.currentTime;
    const dur = durationMs / 1000;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    // fundamental + octave + 5th
    [[freq, 0.60], [freq * 2, 0.28], [freq * 3, 0.12]].forEach(([f, w]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(master);
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(w, t);
      osc.start(t); osc.stop(t + dur);
    });
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(0.45, t + 0.012);
    master.gain.exponentialRampToValueAtTime(0.18, t + 0.08);
    master.gain.setValueAtTime(0.18, t + dur * 0.65);
    master.gain.exponentialRampToValueAtTime(0.001, t + dur);
  } catch (_) {}
}

// ── Piano visual ──────────────────────────────────────────────────────────────
function Piano({ activeNote }: { activeNote: Note | null }) {
  const W = 48, H = 126, GAP = 3, STEP = W + GAP;
  const BW = 30, BH = 76;
  const totalW = NOTES.length * STEP - GAP;
  return (
    <div style={{ position: "relative", width: totalW, height: H + 6, userSelect: "none", margin: "0 auto" }}>
      {NOTES.map((note, i) => {
        const on = activeNote === note;
        return (
          <div key={note} style={{
            position: "absolute", left: i * STEP, top: 0,
            width: W, height: H,
            background: on ? NOTE_COLOR[note] : "linear-gradient(180deg,#f8fafc,#e2e8f0)",
            border: `2px solid ${on ? NOTE_COLOR[note] : "#94a3b8"}`,
            borderRadius: "0 0 10px 10px",
            boxShadow: on
              ? `0 0 26px ${NOTE_COLOR[note]}cc, inset 0 -3px 0 rgba(0,0,0,.15)`
              : "inset 0 -4px 0 rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.4)",
            transform: on ? "scaleY(0.97)" : "scaleY(1)",
            transformOrigin: "top center",
            transition: "all 70ms ease",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 8, zIndex: 1,
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: on ? "white" : "#475569", transition: "color 70ms" }}>
              {NOTE_LABEL[note]}
            </span>
          </div>
        );
      })}
      {BLACK_KEY_AFTER.map((idx) => (
        <div key={`b${idx}`} style={{
          position: "absolute",
          left: idx * STEP - BW / 2 - GAP / 2,
          top: 0, width: BW, height: BH,
          background: "linear-gradient(180deg,#1e293b,#0f172a)",
          border: "1.5px solid #475569", borderTop: "none",
          borderRadius: "0 0 6px 6px",
          boxShadow: "2px 4px 8px rgba(0,0,0,.8)",
          zIndex: 2,
        }} />
      ))}
    </div>
  );
}

// ── Interpreter — walks Blockly block tree directly (no eval/new Function) ────
function buildInterpreter(
  playFn:  (note: Note) => Promise<void>,
  pauseFn: () => Promise<void>,
) {
  async function runBlock(block: any): Promise<void> {
    if (!block) return;
    switch (block.type) {
      case "music_play_note": {
        const note = (block.getFieldValue("NOTE") || "Do") as Note;
        await playFn(note);
        break;
      }
      case "music_pause":
        await pauseFn();
        break;
      case "controls_repeat_ext": {
        const timesBlock = block.getInputTargetBlock("TIMES");
        const n = timesBlock
          ? Math.max(1, Math.min(64, parseInt(timesBlock.getFieldValue("NUM") ?? "1", 10) || 1))
          : 1;
        const doInput = block.getInput?.("DO");
        const body    = doInput?.connection?.targetBlock() ?? block.getInputTargetBlock?.("DO") ?? null;
        if (!body) throw new Error(`EMPTY_LOOP:${n}`);
        for (let i = 0; i < n; i++) await runChain(body);
        break;
      }
      default: break;
    }
  }

  async function runChain(start: any): Promise<void> {
    let cur = start;
    while (cur) {
      await runBlock(cur);
      cur = cur.getNextBlock?.() ?? null;
    }
  }

  return async (ws: any) => {
    const tops: any[] = ws.getTopBlocks(true);
    for (const top of tops) await runChain(top);
  };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BlocklyMusic({ config, onSolved, savedXml, onXmlChange }: Props) {
  const blocklyRef   = useRef<HTMLDivElement>(null);
  // Stable ref to current workspace — never reassigned to a disposed workspace
  const wsRef        = useRef<any>(null);

  const [status, setStatus]               = useState<"idle" | "running" | "success" | "fail">("idle");
  const [msg, setMsg]                     = useState("");
  const [blockCount, setBlockCount]       = useState(0);
  const [activeNote, setActiveNote]       = useState<Note | null>(null);
  const [playedHistory, setPlayedHistory] = useState<Note[]>([]);
  const [showConfetti, setShowConfetti]   = useState(false);

  const tempo     = config.tempo ?? 420;
  const maxB      = config.max_blocks;
  const avail     = config.available_blocks;
  const overLimit = maxB !== undefined && blockCount > maxB;

  // ── Blockly init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!blocklyRef.current) return;

    // `mounted` flag prevents the Strict-Mode double-init race condition:
    // if the cleanup runs before an async init() finishes, we discard that workspace.
    let mounted = true;

    async function init() {
      const Blockly = await import("blockly");
      const { javascriptGenerator } = await import("blockly/javascript");
      if (!mounted) return; // aborted by cleanup

      const Blocks = Blockly.Blocks as Record<string, unknown>;
      if (!Blocks["music_play_note"]) {
        const FD = (Blockly as any).FieldDropdown;
        Blocks["music_play_note"] = {
          init(this: any) {
            this.appendDummyInput()
              .appendField("🎵 Jouer")
              .appendField(new FD([
                ["Do","Do"],["Ré","Re"],["Mi","Mi"],
                ["Fa","Fa"],["Sol","Sol"],["La","La"],["Si","Si"],
              ]), "NOTE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(210);
          },
        };
        Blocks["music_pause"] = {
          init(this: any) {
            this.appendDummyInput().appendField("⏸ Silence");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(40);
          },
        };
        // Keep stubs so workspaceToCode doesn't warn (interpreter doesn't use them)
        javascriptGenerator.forBlock["music_play_note"] = () => "";
        javascriptGenerator.forBlock["music_pause"]     = () => "";
      }

      const darkTheme = (Blockly as any).Theme.defineTheme("music_dark", {
        base: (Blockly as any).Themes?.Classic,
        componentStyles: {
          workspaceBackgroundColour: "#0f172a",
          toolboxBackgroundColour:   "#1e293b",
          toolboxForegroundColour:   "#e2e8f0",
          flyoutBackgroundColour:    "#1e293b",
          flyoutForegroundColour:    "#e2e8f0",
          flyoutOpacity: 1,
          scrollbarColour: "#475569", scrollbarOpacity: 0.6,
        },
      });

      const available = config.available_blocks ?? ["music_play_note", "controls_repeat_ext"];
      const toolbox: unknown[] = [];
      if (available.includes("music_play_note"))
        toolbox.push({ kind: "block", type: "music_play_note" });
      if (available.includes("music_pause"))
        toolbox.push({ kind: "block", type: "music_pause" });
      if (available.includes("controls_repeat_ext"))
        toolbox.push({
          kind: "block", type: "controls_repeat_ext",
          inputs: { TIMES: { block: { type: "math_number", fields: { NUM: 4 } } } },
        });

      if (!mounted || !blocklyRef.current) return; // may have unmounted during imports

      const ws = (Blockly as any).inject(blocklyRef.current, {
        theme: darkTheme,
        toolbox: { kind: "flyoutToolbox", contents: toolbox },
        trashcan: true, scrollbars: true, sounds: false, renderer: "zelos",
        zoom: {
          controls: true,   // boutons +/- dans le workspace
          wheel: true,      // molette pour zoomer
          startScale: 0.75, // commence déjà légèrement dézoomé
          maxScale: 1.2,
          minScale: 0.35,
          scaleSpeed: 1.2,
        },
        move: { scrollbars: { horizontal: true, vertical: true }, drag: true, wheel: false },
      });

      if (!mounted) { ws.dispose(); return; } // cleanup ran while injecting

      // Restore saved XML if any
      if (savedXml) {
        try {
          const dom = (Blockly as any).utils.xml.textToDom(savedXml);
          (Blockly as any).Xml.domToWorkspace(dom, ws);
        } catch (_) {}
      }

      // Count only non-shadow blocks for the counter
      ws.addChangeListener(() => {
        if (!mounted) return;
        const all: any[] = ws.getAllBlocks(false);
        setBlockCount(all.filter((b: any) => !b.isShadow()).length);
        if (onXmlChange) {
          const dom = (Blockly as any).Xml.workspaceToDom(ws);
          onXmlChange((Blockly as any).utils.xml.domToText(dom));
        }
      });

      wsRef.current = ws; // assign ONLY after everything is ready
    }

    init();
    return () => {
      mounted = false;
      const ws = wsRef.current;
      if (ws) { ws.dispose(); wsRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Run ───────────────────────────────────────────────────────────────────────
  const run = useCallback((testMode = false) => {
    // AudioContext MUST be created/resumed synchronously in the click handler
    const ctx = getAudioCtx();
    const resumeP = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();

    (async () => {
      await resumeP;

      const ws = wsRef.current;
      if (!ws) return;

      setStatus("running");
      setMsg("");
      setPlayedHistory([]);

      const played: Note[] = [];

      const _play = async (note: Note) => {
        played.push(note);
        setPlayedHistory([...played]);
        setActiveNote(note);
        playSound(NOTE_FREQ[note], tempo * 0.9, ctx);
        await new Promise(r => setTimeout(r, tempo));
        setActiveNote(null);
        await new Promise(r => setTimeout(r, 20));
      };

      const _pause = async () => {
        setActiveNote(null);
        await new Promise(r => setTimeout(r, Math.round(tempo * 0.5)));
      };

      try {
        await buildInterpreter(_play, _pause)(ws);
      } catch (e: any) {
        setActiveNote(null);
        setStatus("fail");
        if (e?.message?.startsWith("EMPTY_LOOP:")) {
          const n = e.message.split(":")[1];
          setMsg(`⚠️ Ta boucle ×${n} est vide ! Glisse un bloc 🎵 Jouer DANS l'espace vert de la boucle.`);
        } else {
          setMsg("Erreur dans ton programme 😬");
        }
        return;
      }

      setActiveNote(null);
      if (testMode) { setStatus("idle"); return; }

      // ── Validation ──
      if (config.free_mode) {
        const minN = config.min_notes ?? 1;
        if (played.length >= minN) {
          setStatus("success"); setMsg("🎉 Superbe mélodie ! Tu es compositeur !");
          setShowConfetti(true);
          setTimeout(() => { setShowConfetti(false); onSolved(); }, 2200);
        } else {
          setStatus("fail");
          setMsg(`🎵 Encore ${minN - played.length} note(s) — laisse-toi aller !`);
        }
        return;
      }

      if (config.target_notes) {
        const target = config.target_notes;
        if (played.length !== target.length) {
          const diff = played.length - target.length;
          setStatus("fail");
          setMsg(`🎵 Il faut exactement ${target.length} notes — tu en as joué ${played.length} (${diff > 0 ? "+" + diff : diff}).`);
          return;
        }
        const bad = played.findIndex((n, i) => n !== target[i]);
        if (bad !== -1) {
          setStatus("fail");
          setMsg(`❌ Note ${bad + 1} incorrecte — tu as joué ${NOTE_LABEL[played[bad]]} mais il fallait ${NOTE_LABEL[target[bad]]}.`);
          return;
        }
        setStatus("success"); setMsg("🎉 Parfait ! Mélodie reproduite à la note près !");
        setShowConfetti(true);
        setTimeout(() => { setShowConfetti(false); onSolved(); }, 2200);
        return;
      }

      setStatus("success"); setMsg("🎉 Mélodie jouée !");
      setShowConfetti(true);
      setTimeout(() => { setShowConfetti(false); onSolved(); }, 2200);
    })();
  }, [config, onSolved, tempo]);

  const reset = () => {
    setStatus("idle"); setMsg("");
    setActiveNote(null); setPlayedHistory([]);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 relative flex flex-col">

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="absolute text-2xl animate-bounce" style={{
              left: `${Math.random() * 95}%`, top: `${Math.random() * 80}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${0.4 + Math.random() * 0.5}s`,
            }}>{CONFETTI[i % CONFETTI.length]}</span>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between">
        <span className="font-black text-amber-400 text-sm">🎹 {config.title ?? "Composition musicale"}</span>
        {maxB !== undefined && (
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${overLimit ? "bg-red-900 text-red-300" : "bg-slate-700 text-slate-300"}`}>
            {blockCount}/{maxB} blocs{overLimit ? " ⚠️" : ""}
          </span>
        )}
      </div>

      {/* ── Main: Blockly (wide) + Info panel (narrow) ── */}
      <div className="flex min-h-0" style={{ minHeight: 420 }}>

        {/* LEFT — Blockly (62%) */}
        <div className="flex flex-col border-r border-slate-700" style={{ flex: "0 0 62%", isolation: "isolate" }}>
          <div className="bg-slate-800/60 px-3 py-1.5 border-b border-slate-700 shrink-0">
            <span className="text-xs font-bold text-slate-400">🔧 Programme</span>
          </div>
          <div ref={blocklyRef} style={{ flex: 1, minHeight: 380, overflow: "hidden" }} />
        </div>

        {/* RIGHT — Mission + feedback (40%) */}
        <div className="flex flex-col gap-2 p-3 overflow-y-auto" style={{ flex: 1 }}>

          {/* Mission */}
          {(config.steps || config.instructions) && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 px-3 py-2.5 shrink-0">
              <div className="text-xs font-black text-amber-400 mb-1.5">🎯 Mission</div>
              {config.steps ? (
                <ol className="space-y-1">
                  {config.steps.map((s, i) => (
                    <li key={i} className="text-xs text-slate-200 flex gap-1.5 leading-snug">
                      <span className="font-black text-amber-500 shrink-0">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-200 leading-snug">{config.instructions}</p>
              )}
            </div>
          )}

          {/* Target melody */}
          {config.target_notes && (
            <div className="shrink-0">
              <div className="text-xs font-bold text-slate-400 mb-1.5">🎼 Mélodie à reproduire :</div>
              <div className="flex flex-wrap gap-1">
                {config.target_notes.map((note, i) => (
                  <span key={i} className="text-xs font-black px-2 py-0.5 rounded-lg text-white shadow"
                    style={{ background: NOTE_COLOR[note] }}>
                    {NOTE_LABEL[note]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Played history */}
          {playedHistory.length > 0 && (
            <div className="shrink-0">
              <div className="text-xs font-bold text-slate-400 mb-1">🎶 Notes jouées :</div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {playedHistory.map((note, i) => (
                  <span key={i} className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                    style={{ background: NOTE_COLOR[note] }}>
                    {NOTE_LABEL[note]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status message */}
          {msg && (
            <div className={`text-xs font-bold rounded-xl px-3 py-2 leading-snug ${
              status === "success" ? "bg-emerald-900/80 text-emerald-300" : "bg-red-900/80 text-red-300"
            }`}>{msg}</div>
          )}
        </div>
      </div>

      {/* ── Piano + Buttons (full width) ── */}
      <div className="border-t border-slate-700 bg-slate-950 py-5 px-4 flex flex-col items-center gap-4"
        style={{ position: "relative", zIndex: 20 }}>
        <Piano activeNote={activeNote} />
        <div className="flex gap-3">
          <button onClick={() => run(true)} disabled={status === "running"}
            className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors shadow">
            👁 Tester
          </button>
          <button onClick={() => run(false)} disabled={status === "running"}
            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-xl text-sm transition-colors shadow-lg">
            ▶ Jouer !
          </button>
          <button onClick={reset}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors shadow">
            ↺ Reset
          </button>
        </div>
      </div>

      {/* ── Block palette ── */}
      <div className="border-t border-slate-700 bg-slate-800 px-4 py-2">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Blocs disponibles</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_MUSIC_BLOCKS.map((b) => {
            const on = !avail || avail.includes(b.id);
            return (
              <span key={b.id} className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${
                on ? "border-slate-600 text-slate-200 bg-slate-700" : "border-slate-800 text-slate-600 bg-slate-900 opacity-40"
              }`}>
                {b.label}
                {b.badge && (
                  <span className={`text-[9px] px-1 rounded ${on ? "bg-amber-800 text-amber-300" : "bg-slate-800 text-slate-700"}`}>
                    {b.badge}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
