"use client";

/**
 * Le clavier et le son, partagés.
 *
 * Extraits de BlocklyMusic — le jeu de composition du niveau Explorateur — pour
 * que la version pilotée en Python les réutilise au lieu d'en refaire une copie.
 * Même découpage que mazeCanvas.ts, sorti de BlocklyRobot pour PythonMaze.
 */

export type Note = "Do" | "Re" | "Mi" | "Fa" | "Sol" | "La" | "Si";

export const NOTES: Note[] = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];

export const NOTE_FREQ: Record<Note, number> = {
  Do: 261.63, Re: 293.66, Mi: 329.63,
  Fa: 349.23, Sol: 392.00, La: 440.00, Si: 493.88,
};

export const NOTE_LABEL: Record<Note, string> = {
  Do: "Do", Re: "Ré", Mi: "Mi", Fa: "Fa", Sol: "Sol", La: "La", Si: "Si",
};

const NOTE_COLOR: Record<Note, string> = {
  Do: "#ef4444", Re: "#f97316", Mi: "#eab308",
  Fa: "#22c55e", Sol: "#3b82f6", La: "#8b5cf6", Si: "#ec4899",
};

// Touches noires : entre les blanches d'indices 1,2,4,5,6 (Do#, Ré#, Fa#, Sol#, La#)
const BLACK_KEY_AFTER = [1, 2, 4, 5, 6];

// ── Son ──────────────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

export function audioCtx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _ctx;
}

/** Timbre de piano : fondamentale + octave + quinte, avec une enveloppe. */
export function jouerSon(freq: number, dureeMs: number, ctx: AudioContext) {
  try {
    const t = ctx.currentTime;
    const dur = dureeMs / 1000;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    ([[freq, 0.60], [freq * 2, 0.28], [freq * 3, 0.12]] as [number, number][]).forEach(([f, w]) => {
      const osc = ctx.createOscillator();
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
  } catch { /* pas de son disponible : le jeu reste jouable à l'œil */ }
}

/** Accepte « do », « RÉ », « re »… — l'enfant tape ce qu'il veut. */
export function normaliseNote(s: string): Note | null {
  const n = (s ?? "").trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
  const table: Record<string, Note> = {
    do: "Do", re: "Re", mi: "Mi", fa: "Fa", sol: "Sol", la: "La", si: "Si",
  };
  return table[n] ?? null;
}

// ── Clavier ──────────────────────────────────────────────────────────────────
export function Piano({ noteActive }: { noteActive: Note | null }) {
  const W = 48, H = 126, GAP = 3, STEP = W + GAP;
  const BW = 30, BH = 76;
  const totalW = NOTES.length * STEP - GAP;

  return (
    <div style={{ position: "relative", width: totalW, height: H + 6, userSelect: "none", margin: "0 auto", maxWidth: "100%" }}>
      {NOTES.map((note, i) => {
        const on = noteActive === note;
        return (
          <div key={note} style={{
            position: "absolute", left: i * STEP, top: 0, width: W, height: H,
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
      {BLACK_KEY_AFTER.map(idx => (
        <div key={`b${idx}`} style={{
          position: "absolute", left: idx * STEP - BW / 2 - GAP / 2, top: 0,
          width: BW, height: BH,
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
