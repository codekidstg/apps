"use client";
import { messagesFr } from "./blocklyFr";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Note = "Do" | "Re" | "Mi" | "Fa" | "Sol" | "La" | "Si";
/** Les trois frappes du tambour du Griot. */
type Percu = "Boum" | "Tac" | "Clap";
/**
 * Ce qu'un programme produit, temps par temps. Le silence en fait partie : il
 * dure un temps entier et il se vérifie. Avant, il durait un demi-temps et
 * n'était pas compté — « Boum Boum Clap » et « Boum Boum Clap · silence »
 * passaient pour le même rythme.
 */
type Son = Note | Percu | "silence";
/** Un programme écrit en abrégé : un son, ou une boucle et ce qu'elle contient. */
type Element = Son | { rep: number; corps: Element[] };

type MusicConfig = {
  title?: string;
  instructions?: string;
  steps?: string[];
  /** Ce que l'enfant doit reproduire : notes, frappes et silences. */
  target_notes?: Son[];
  free_mode?: boolean;
  /** Composition libre : nombre minimum de sons. Les silences ne comptent pas. */
  min_notes?: number;
  available_blocks?: string[];
  max_blocks?: number;
  tempo?: number;
  /**
   * Un programme déjà posé au départ : l'enfant le transforme ou le répare
   * au lieu de repartir de zéro. Son propre travail, s'il existe, passe devant.
   */
  depart?: Element[];
  /** Exige une boucle rangée dans une autre, chacune d'au moins deux tours. */
  boucle_imbriquee?: boolean;
  /** L'indice propre à ce défi quand le rythme est juste mais trop long. */
  indice_limite?: string;
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
const PERCUS: Percu[] = ["Boum", "Tac", "Clap"];
const PERCU_EMOJI: Record<Percu, string> = { Boum: "🥁", Tac: "✋", Clap: "👏" };
const PERCU_COLOR: Record<Percu, string> = { Boum: "#b45309", Tac: "#0d9488", Clap: "#db2777" };

const estNote  = (s: Son | null): s is Note  => !!s && (NOTES as string[]).includes(s);
const estPercu = (s: Son | null): s is Percu => !!s && (PERCUS as string[]).includes(s);

/** La pastille d'un son, quel qu'il soit. */
function pastille(s: Son): { texte: string; couleur: string } {
  if (s === "silence") return { texte: "⏸", couleur: "#334155" };
  if (estPercu(s)) return { texte: `${PERCU_EMOJI[s]} ${s}`, couleur: PERCU_COLOR[s] };
  return { texte: NOTE_LABEL[s], couleur: NOTE_COLOR[s] };
}
/** Le son dans une phrase : « Ré », « Boum », « un silence ». */
const nomSon = (s: Son) => (s === "silence" ? "un silence" : estNote(s) ? NOTE_LABEL[s] : s);

/** Le programme abrégé, traduit dans le XML que Blockly sait recharger. */
function versXml(prog: Element[]): string {
  const chaine = (liste: Element[]): string => {
    if (!liste.length) return "";
    const [tete, ...reste] = liste;
    const suite = reste.length ? `<next>${chaine(reste)}</next>` : "";
    if (typeof tete === "object") {
      return `<block type="controls_repeat_ext"><value name="TIMES"><block type="math_number"><field name="NUM">${tete.rep}</field></block></value>`
        + `<statement name="DO">${chaine(tete.corps)}</statement>${suite}</block>`;
    }
    if (tete === "silence") return `<block type="music_pause">${suite}</block>`;
    if (estPercu(tete)) return `<block type="music_drum"><field name="PERCU">${tete}</field>${suite}</block>`;
    return `<block type="music_play_note"><field name="NOTE">${tete}</field>${suite}</block>`;
  };
  return `<xml xmlns="https://developers.google.com/blockly/xml">${chaine(prog).replace("<block ", '<block x="24" y="24" ')}</xml>`;
}

/** Le nombre de tours d'un bloc Répéter, lu dans sa case. */
function toursDe(boucle: any): number {
  const n = boucle.getInputTargetBlock?.("TIMES");
  return n ? parseInt(n.getFieldValue("NUM") ?? "1", 10) || 1 : 1;
}

/** Une boucle rangée dans une autre, chacune d'au moins deux tours ? */
function aUneBoucleImbriquee(ws: any): boolean {
  const boucles = ws.getAllBlocks(false).filter((b: any) => b.type === "controls_repeat_ext");
  return boucles.some((b: any) => {
    if (toursDe(b) < 2) return false;
    for (let p = b.getSurroundParent?.(); p; p = p.getSurroundParent?.()) {
      if (p.type === "controls_repeat_ext" && toursDe(p) >= 2) return true;
    }
    return false;
  });
}

const ALL_MUSIC_BLOCKS = [
  { id: "music_play_note",     label: "🎵 Jouer une note", color: "#3b82f6" },
  { id: "music_drum",          label: "🥁 Tambour",        color: "#b45309" },
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

// Bruit blanc, fabriqué une seule fois : la matière du Tac et du Clap.
let _bruit: AudioBuffer | null = null;
function bruit(ctx: AudioContext): AudioBuffer {
  if (!_bruit || _bruit.sampleRate !== ctx.sampleRate) {
    const n = Math.floor(ctx.sampleRate * 0.25);
    _bruit = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = _bruit.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  return _bruit;
}

/**
 * Les trois frappes, fabriquées par le navigateur : aucun fichier son à
 * télécharger, ce qui compte quand les données mobiles coûtent cher.
 *   Boum — la paume au centre : une note grave qui plonge.
 *   Tac  — les doigts au bord : un claquement court et sec.
 *   Clap — les mains : trois bouffées de souffle très rapprochées.
 */
function playPercu(p: Percu, ctx: AudioContext) {
  try {
    const t = ctx.currentTime;

    if (p === "Boum") {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.28);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.95, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.42);
      return;
    }

    if (p === "Tac") {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.07);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.6, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.15);

      // Un souffle très bref : le claquement des doigts sur le bord.
      const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), gb = ctx.createGain();
      src.buffer = bruit(ctx);
      hp.type = "highpass"; hp.frequency.value = 2500;
      gb.gain.setValueAtTime(0.25, t);
      gb.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      src.connect(hp); hp.connect(gb); gb.connect(ctx.destination);
      src.start(t); src.stop(t + 0.06);
      return;
    }

    // Clap : trois bouffées, la dernière traîne un peu.
    [0, 0.011, 0.023].forEach((decalage, i) => {
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = bruit(ctx);
      bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.9;
      const debut = t + decalage, duree = i === 2 ? 0.18 : 0.02;
      g.gain.setValueAtTime(0.0001, debut);
      g.gain.exponentialRampToValueAtTime(0.7, debut + 0.002);
      g.gain.exponentialRampToValueAtTime(0.001, debut + duree);
      src.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(debut); src.stop(debut + duree + 0.01);
    });
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

// ── Tambours visual ───────────────────────────────────────────────────────────
function Tambours({ actif }: { actif: Percu | null }) {
  return (
    <div className="flex items-end justify-center gap-5 select-none">
      {PERCUS.map((p) => {
        const on = actif === p;
        const taille = p === "Boum" ? 92 : 72;
        return (
          <div key={p} className="flex flex-col items-center gap-1.5">
            <div style={{
              width: taille, height: taille, borderRadius: "50%",
              background: on ? PERCU_COLOR[p] : "radial-gradient(circle at 40% 35%, #e7d3b0, #b08a5a)",
              border: `4px solid ${on ? PERCU_COLOR[p] : "#6b4f2c"}`,
              boxShadow: on ? `0 0 28px ${PERCU_COLOR[p]}cc` : "inset 0 -6px 0 rgba(0,0,0,.18), 0 3px 8px rgba(0,0,0,.5)",
              transform: on ? "scale(0.94)" : "scale(1)",
              transition: "all 70ms ease",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: Math.round(taille * 0.38),
            }}>
              {PERCU_EMOJI[p]}
            </div>
            <span className="text-[11px] font-black" style={{ color: on ? PERCU_COLOR[p] : "#94a3b8" }}>{p}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Interpreter — walks Blockly block tree directly (no eval/new Function) ────
function buildInterpreter(
  playFn:  (son: Note | Percu) => Promise<void>,
  pauseFn: () => Promise<void>,
  // Le bloc qui joue s'allume dans le programme : l'enfant voit la petite
  // boucle faire ses tours, puis la grande remonter. Sans cela, une boucle
  // dans une boucle ne s'entend qu'en bloc, sans qu'on sache qui joue quoi.
  allume: (id: string | null) => void = () => {},
) {
  async function runBlock(block: any): Promise<void> {
    if (!block) return;
    switch (block.type) {
      case "music_play_note": {
        const note = (block.getFieldValue("NOTE") || "Do") as Note;
        allume(block.id);
        await playFn(note);
        break;
      }
      case "music_drum": {
        const frappe = (block.getFieldValue("PERCU") || "Boum") as Percu;
        allume(block.id);
        await playFn(frappe);
        break;
      }
      case "music_pause":
        allume(block.id);
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
  const [actif, setActif]                 = useState<Note | Percu | null>(null);
  const [playedHistory, setPlayedHistory] = useState<Son[]>([]);
  const [showConfetti, setShowConfetti]   = useState(false);

  const tempo     = config.tempo ?? 420;
  const maxB      = config.max_blocks;
  const avail     = config.available_blocks;
  const overLimit = maxB !== undefined && blockCount > maxB;

  // Ce que l'on montre : le piano, les tambours, ou les deux.
  const cible       = config.target_notes;
  const blocsDispo  = avail ?? ["music_play_note", "controls_repeat_ext"];
  const avecTambour = blocsDispo.includes("music_drum") || !!cible?.some((s) => estPercu(s));
  const avecPiano   = blocsDispo.includes("music_play_note") || !!cible?.some((s) => estNote(s)) || !avecTambour;
  /** La cible contient des frappes ou des silences : on parle en temps, pas en notes. */
  const rythme      = !!cible?.some((s) => !estNote(s));

  // ── Blockly init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!blocklyRef.current) return;

    // `mounted` flag prevents the Strict-Mode double-init race condition:
    // if the cleanup runs before an async init() finishes, we discard that workspace.
    let mounted = true;

    async function init() {
      const Blockly = await import("blockly");
      messagesFr(Blockly);
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
      // Garde à part : le registre de Blockly survit d'une page à l'autre, et
      // le bloc tambour doit exister même si les autres étaient déjà là.
      if (!Blocks["music_drum"]) {
        const FD = (Blockly as any).FieldDropdown;
        Blocks["music_drum"] = {
          init(this: any) {
            this.appendDummyInput()
              .appendField("🥁 Frappe")
              .appendField(new FD([["Boum","Boum"],["Tac","Tac"],["Clap","Clap"]]), "PERCU");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(25);
          },
        };
        javascriptGenerator.forBlock["music_drum"] = () => "";
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
      if (available.includes("music_drum"))
        // Trois blocs tout prêts plutôt qu'un menu à dérouler : sur un écran
        // tactile, glisser « Boum » est plus simple que d'ouvrir une liste.
        for (const p of PERCUS) toolbox.push({ kind: "block", type: "music_drum", fields: { PERCU: p } });
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

      // Le travail de l'enfant d'abord ; à défaut, le programme de départ du défi.
      const aCharger = savedXml || (config.depart?.length ? versXml(config.depart) : null);
      if (aCharger) {
        try {
          const dom = (Blockly as any).utils.xml.textToDom(aCharger);
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

      const played: Son[] = [];

      const _play = async (son: Note | Percu) => {
        played.push(son);
        setPlayedHistory([...played]);
        setActif(son);
        if (estPercu(son)) playPercu(son, ctx);
        else playSound(NOTE_FREQ[son], tempo * 0.9, ctx);
        await new Promise(r => setTimeout(r, tempo));
        setActif(null);
        await new Promise(r => setTimeout(r, 20));
      };

      // Un silence est un temps entier — aussi long qu'un son — et il se compte.
      const _pause = async () => {
        played.push("silence");
        setPlayedHistory([...played]);
        setActif(null);
        await new Promise(r => setTimeout(r, tempo + 20));
      };

      const allume = (id: string | null) => { try { ws.highlightBlock(id); } catch (_) { /* rendu sans surbrillance */ } };

      try {
        await buildInterpreter(_play, _pause, allume)(ws);
      } catch (e: any) {
        allume(null);
        setActif(null);
        setStatus("fail");
        if (e?.message?.startsWith("EMPTY_LOOP:")) {
          const n = e.message.split(":")[1];
          setMsg(`⚠️ Ta boucle ×${n} est vide ! Glisse un son DANS l'espace vert de la boucle.`);
        } else {
          setMsg("Erreur dans ton programme 😬");
        }
        return;
      }

      allume(null);
      setActif(null);
      if (testMode) { setStatus("idle"); return; }

      // La limite de blocs n'était qu'affichée : un enfant qui recopiait seize
      // blocs dans un défi « six au plus » était félicité quand même. On compte
      // au moment du verdict, sur le programme tel qu'il est — et on lui dit
      // d'abord ce qu'il a réussi, avant ce qui manque.
      const poses = ws.getAllBlocks(false).filter((b: any) => !b.isShadow()).length;
      const limite = config.max_blocks;
      const tropDeBlocs = limite !== undefined && poses > limite;
      const refuserPourBlocs = (reussi: string) => {
        setStatus("fail");
        // « Une boucle peut le faire à ta place » ne dit rien à un enfant qui a
        // déjà une boucle : chaque défi peut donner son propre indice.
        const indice = config.indice_limite ?? "Une boucle peut jouer tout ça à ta place 🔁";
        setMsg(`${reussi} Mais tu as posé ${poses} blocs, et il en faut ${limite} au plus. ${indice}`);
      };
      // Une seule boucle de 64 tours atteindrait n'importe quel nombre de sons :
      // quand le défi porte sur la boucle dans la boucle, on la vérifie.
      const manqueImbrication = !!config.boucle_imbriquee && !aUneBoucleImbriquee(ws);
      const refuserPourImbrication = (reussi: string) => {
        setStatus("fail");
        setMsg(`${reussi} Mais il manque une boucle rangée DANS une autre boucle — chacune d'au moins 2 tours. 🔁`);
      };
      const bravo = (texte: string) => {
        setStatus("success"); setMsg(texte);
        setShowConfetti(true);
        setTimeout(() => { setShowConfetti(false); onSolved(); }, 2200);
      };

      const attendu = config.target_notes;
      const enTemps = !!attendu?.some((s) => !estNote(s));

      if (config.free_mode) {
        const minN = config.min_notes ?? 1;
        const sons = played.filter((s) => s !== "silence").length;
        if (sons < minN) {
          setStatus("fail");
          setMsg(`🎵 Encore ${minN - sons} son${minN - sons > 1 ? "s" : ""} — laisse-toi aller !`);
          return;
        }
        if (tropDeBlocs) { refuserPourBlocs(`🎵 Joli, ${sons} sons !`); return; }
        if (manqueImbrication) { refuserPourImbrication(`🎵 Joli, ${sons} sons !`); return; }
        bravo("🎉 Superbe ! Tu es compositeur !");
        return;
      }

      if (attendu) {
        if (played.length !== attendu.length) {
          const diff = played.length - attendu.length;
          const ecart = diff > 0 ? `+${diff}` : `${diff}`;
          setStatus("fail");
          setMsg(enTemps
            ? `🥁 Il faut ${attendu.length} temps${attendu.includes("silence") ? ", silences compris" : ""} — ton rythme en fait ${played.length} (${ecart}).`
            : `🎵 Il faut exactement ${attendu.length} notes — tu en as joué ${played.length} (${ecart}).`);
          return;
        }
        const bad = played.findIndex((s, i) => s !== attendu[i]);
        if (bad !== -1) {
          setStatus("fail");
          setMsg(enTemps
            ? `❌ Temps ${bad + 1} : tu as joué ${nomSon(played[bad])}, mais il fallait ${nomSon(attendu[bad])}.`
            : `❌ Note ${bad + 1} incorrecte — tu as joué ${nomSon(played[bad])} mais il fallait ${nomSon(attendu[bad])}.`);
          return;
        }
        const juste = enTemps ? "🎵 C'est exactement le bon rythme !" : "🎵 C'est exactement la bonne mélodie !";
        if (tropDeBlocs) { refuserPourBlocs(juste); return; }
        if (manqueImbrication) { refuserPourImbrication(juste); return; }
        bravo(enTemps ? "🎉 Parfait ! Le rythme exact, temps par temps !" : "🎉 Parfait ! Mélodie reproduite à la note près !");
        return;
      }

      if (tropDeBlocs) { refuserPourBlocs("🎵 Ça joue !"); return; }
      if (manqueImbrication) { refuserPourImbrication("🎵 Ça joue !"); return; }
      bravo("🎉 Mélodie jouée !");
    })();
  }, [config, onSolved, tempo]);

  // ── Écouter le modèle ─────────────────────────────────────────────────────────
  // On ne reproduit pas une musique qu'on n'a jamais entendue : l'enfant écoute
  // la cible avant d'écrire, autant de fois qu'il veut. Rien n'est validé ici.
  const ecouterModele = useCallback(() => {
    const modele = config.target_notes;
    if (!modele?.length) return;
    const ctx = getAudioCtx();
    const resumeP = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();

    (async () => {
      await resumeP;
      setStatus("running"); setMsg(""); setPlayedHistory([]);
      for (const s of modele) {
        if (s === "silence") {
          setActif(null);
          await new Promise(r => setTimeout(r, tempo + 20));
          continue;
        }
        setActif(s);
        if (estPercu(s)) playPercu(s, ctx);
        else playSound(NOTE_FREQ[s], tempo * 0.9, ctx);
        await new Promise(r => setTimeout(r, tempo));
        setActif(null);
        await new Promise(r => setTimeout(r, 20));
      }
      setStatus("idle");
    })();
  }, [config, tempo]);

  const reset = () => {
    setStatus("idle"); setMsg("");
    setActif(null); setPlayedHistory([]);
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
        <span className="font-black text-amber-400 text-sm">{avecPiano ? "🎹" : "🥁"} {config.title ?? "Composition musicale"}</span>
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

          {/* Target */}
          {cible && (
            <div className="shrink-0">
              <div className="text-xs font-bold text-slate-400 mb-1.5">
                {rythme ? "🥁 Rythme à reproduire :" : "🎼 Mélodie à reproduire :"}
              </div>
              <div className="flex flex-wrap gap-1">
                {cible.map((s, i) => {
                  const p = pastille(s);
                  return (
                    <span key={i} className="text-xs font-black px-2 py-0.5 rounded-lg text-white shadow"
                      style={{ background: p.couleur }}>
                      {p.texte}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Played history */}
          {playedHistory.length > 0 && (
            <div className="shrink-0">
              <div className="text-xs font-bold text-slate-400 mb-1">
                {avecTambour ? "🎶 Ton programme a joué :" : "🎶 Notes jouées :"}
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {playedHistory.map((s, i) => {
                  const p = pastille(s);
                  return (
                    <span key={i} className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                      style={{ background: p.couleur }}>
                      {p.texte}
                    </span>
                  );
                })}
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
        {avecPiano && <Piano activeNote={estNote(actif) ? actif : null} />}
        {avecTambour && <Tambours actif={estPercu(actif) ? actif : null} />}
        <div className="flex flex-wrap justify-center gap-3">
          {cible && (
            <button onClick={ecouterModele} disabled={status === "running"}
              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors shadow">
              🔊 Écouter le modèle
            </button>
          )}
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
