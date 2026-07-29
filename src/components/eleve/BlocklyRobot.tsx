"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Collectible = { x: number; y: number; type: "key" | "gem" };
type LockedDoor  = { x: number; y: number; requires: "key" };

type ChallengeConfig = {
  grid_size: number;
  start: { x: number; y: number; dir: "N" | "E" | "S" | "W" };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  collectibles?: Collectible[];
  locked_doors?: LockedDoor[];
  max_blocks?: number;
  instructions?: string;
  steps?: string[];
  title?: string;
  available_blocks?: string[];
};

type Props = {
  config: ChallengeConfig;
  onSolved: () => void;
  savedXml?: string;
  onXmlChange?: (xml: string) => void;
};

type Dir = "N" | "E" | "S" | "W";
const DIRS: Dir[] = ["N", "E", "S", "W"];
const DELTA: Record<Dir, [number, number]> = {
  N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0],
};
// Visual rotation (degrees): character drawn facing South (↓) at 0°
const DIR_ANGLE: Record<Dir, number> = { S: 0, W: 90, N: 180, E: 270 };
const NEXT_DIR: Record<Dir, { L: Dir; R: Dir }> = {
  N: { L: "W", R: "E" }, E: { L: "N", R: "S" },
  S: { L: "E", R: "W" }, W: { L: "S", R: "N" },
};
const DIR_ARROW: Record<Dir, string> = { N: "↑", E: "→", S: "↓", W: "←" };
const DIR_LABEL: Record<Dir, string> = { N: "haut", E: "droite", S: "bas", W: "gauche" };

const CONFETTI = ["🌟", "⭐", "✨", "🎉", "🏆", "🥳", "💫", "🎊"];

const ALL_BLOCKS = [
  { id: "robot_move",          label: "🚀 Avancer",        color: "#3b82f6" },
  { id: "robot_turn_left",     label: "↰ Gauche",          color: "#8b5cf6" },
  { id: "robot_turn_right",    label: "↱ Droite",          color: "#8b5cf6" },
  { id: "controls_repeat_ext", label: "🔁 Répéter",        color: "#059669", badge: "Niv.3" },
  { id: "robot_pick",          label: "🧲 Ramasser",       color: "#d97706", badge: "Niv.4" },
  { id: "controls_if",         label: "❓ Si…alors",       color: "#dc2626", badge: "Niv.5" },
  { id: "controls_if_else",    label: "↩ Sinon",           color: "#dc2626", badge: "Niv.5" },
  { id: "sensor_look",         label: "👁️ Regarder",       color: "#0891b2", badge: "Niv.7" },
  { id: "end",                 label: "⏹ Fin",             color: "#374151" },
];

const CELL = 52;

// ── Kirikou canvas drawing ──────────────────────────────────────────────────

function drawKirikou(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  rotationDeg: number,
  walkFrame: number,
) {
  const S = CELL / 50;
  const cx = px * CELL + CELL / 2;
  const cy = py * CELL + CELL / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // Walk cycle: frames 0-3 → leg angles
  const legAngles = [0, 18, 0, -18];
  const leg = (legAngles[walkFrame] * Math.PI) / 180;
  const arm = -leg * 0.7;

  // ── Legs ──
  const legLen = 12 * S;
  ctx.strokeStyle = "#3d1f08";
  ctx.lineWidth = 4 * S;
  ctx.lineCap = "round";

  // Left leg
  ctx.beginPath();
  ctx.moveTo(-3 * S, 7 * S);
  ctx.lineTo(-3 * S + Math.sin(leg) * legLen, 7 * S + Math.cos(leg) * legLen);
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(3 * S, 7 * S);
  ctx.lineTo(3 * S + Math.sin(-leg) * legLen, 7 * S + Math.cos(-leg) * legLen);
  ctx.stroke();

  // Green shorts
  ctx.fillStyle = "#059669";
  ctx.beginPath();
  ctx.roundRect(-7 * S, 4 * S, 14 * S, 7 * S, 3 * S);
  ctx.fill();

  // ── Arms ──
  const armLen = 11 * S;
  ctx.strokeStyle = "#3d1f08";
  ctx.lineWidth = 3.5 * S;

  // Left arm
  ctx.beginPath();
  ctx.moveTo(-6 * S, -5 * S);
  ctx.lineTo(-6 * S + Math.sin(arm) * armLen, -5 * S + Math.cos(arm) * armLen);
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(6 * S, -5 * S);
  ctx.lineTo(6 * S + Math.sin(-arm) * armLen, -5 * S + Math.cos(-arm) * armLen);
  ctx.stroke();

  // ── Amber top (tunic) ──
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.roundRect(-7 * S, -8 * S, 14 * S, 14 * S, 3 * S);
  ctx.fill();

  // Pattern stripes on tunic
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 1.5 * S;
  ctx.beginPath();
  ctx.moveTo(-7 * S, -3 * S);
  ctx.lineTo(7 * S, -3 * S);
  ctx.moveTo(-7 * S, 1 * S);
  ctx.lineTo(7 * S, 1 * S);
  ctx.stroke();

  // ── Head ──
  ctx.fillStyle = "#5c2d0a";
  ctx.beginPath();
  ctx.ellipse(0, -14 * S, 8 * S, 9 * S, 0, 0, Math.PI * 2);
  ctx.fill();

  // Show face unless roughly facing North (upward = 180° rotation)
  const normDeg = ((rotationDeg % 360) + 360) % 360;
  const showFace = normDeg < 120 || normDeg > 240;
  if (showFace) {
    // ── Face ──
    // Eyes (white)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(-3 * S, -15 * S, 2.5 * S, 2.8 * S, 0, 0, Math.PI * 2);
    ctx.ellipse(3 * S, -15 * S, 2.5 * S, 2.8 * S, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = "#1e1e1e";
    ctx.beginPath();
    ctx.ellipse(-3 * S, -14.5 * S, 1.3 * S, 1.5 * S, 0, 0, Math.PI * 2);
    ctx.ellipse(3 * S, -14.5 * S, 1.3 * S, 1.5 * S, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight dots on eyes
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-2.5 * S, -15.2 * S, 0.6 * S, 0, Math.PI * 2);
    ctx.arc(3.5 * S, -15.2 * S, 0.6 * S, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1.2 * S;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-5 * S, -18 * S);
    ctx.quadraticCurveTo(-3 * S, -19 * S, -1 * S, -18 * S);
    ctx.moveTo(1 * S, -18 * S);
    ctx.quadraticCurveTo(3 * S, -19 * S, 5 * S, -18 * S);
    ctx.stroke();

    // Smile
    ctx.strokeStyle = "#1e1e1e";
    ctx.lineWidth = 1.2 * S;
    ctx.beginPath();
    ctx.arc(0, -13 * S, 3 * S, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Nose
    ctx.fillStyle = "#3d1f08";
    ctx.beginPath();
    ctx.ellipse(0, -14 * S, 1 * S, 0.8 * S, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Hair knot ──
  ctx.fillStyle = "#1a0a00";
  ctx.beginPath();
  ctx.arc(0, -22 * S, 3.5 * S, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Scene drawing ────────────────────────────────────────────────────────────

function drawScene(
  ctx: CanvasRenderingContext2D,
  config: ChallengeConfig,
  px: number,
  py: number,
  dir: Dir,
  rotationDeg: number,
  walkFrame: number,
  collected: Set<string>,
  doorsOpen: Set<string>,
) {
  const G = config.grid_size;
  const size = G * CELL;
  ctx.clearRect(0, 0, size, size);

  for (let x = 0; x < G; x++) {
    for (let y = 0; y < G; y++) {
      const isWall = config.walls.some((w) => w.x === x && w.y === y);
      const isGoal = config.goal.x === x && config.goal.y === y;

      // Floor
      if (isWall) {
        // Brick wall
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        ctx.fillStyle = "#334155";
        ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        // Brick rows
        const bh = Math.floor(CELL / 4);
        for (let row = 0; row < 4; row++) {
          const offset = row % 2 === 0 ? 0 : CELL / 3;
          ctx.fillStyle = "#475569";
          ctx.fillRect(x * CELL + offset + 2, y * CELL + row * bh + 1, CELL / 3 - 3, bh - 2);
          ctx.fillRect(x * CELL + offset + CELL / 3 + 4, y * CELL + row * bh + 1, CELL / 3 - 3, bh - 2);
        }
      } else {
        // Sand floor checkerboard
        ctx.fillStyle = (x + y) % 2 === 0 ? "#92400e" : "#78350f";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        if (isGoal) {
          ctx.fillStyle = "rgba(16,185,129,0.35)";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
        // Subtle grid line
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }

      // Goal star
      if (isGoal) {
        ctx.font = `${CELL - 12}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", x * CELL + CELL / 2, y * CELL + CELL / 2);
      }
    }
  }

  // Collectibles
  if (config.collectibles) {
    for (const c of config.collectibles) {
      const key = `${c.x},${c.y}`;
      if (!collected.has(key)) {
        ctx.font = `${CELL - 14}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.type === "key" ? "🗝️" : "💎", c.x * CELL + CELL / 2, c.y * CELL + CELL / 2);
      }
    }
  }

  // Locked doors
  if (config.locked_doors) {
    for (const d of config.locked_doors) {
      const key = `${d.x},${d.y}`;
      if (!doorsOpen.has(key)) {
        ctx.font = `${CELL - 10}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🚪", d.x * CELL + CELL / 2, d.y * CELL + CELL / 2);
      }
    }
  }

  // Kirikou
  drawKirikou(ctx, px, py, rotationDeg, walkFrame);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BlocklyRobot({ config, onSolved, savedXml, onXmlChange }: Props) {
  const blocklyRef    = useRef<HTMLDivElement>(null);
  const workspaceRef  = useRef<unknown>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const animRef       = useRef<number>(0);

  const [dir, setDir]             = useState<Dir>(config.start.dir);
  const [pos, setPos]             = useState({ x: config.start.x, y: config.start.y });
  const [status, setStatus]       = useState<"idle" | "running" | "success" | "fail">("idle");
  const [msg, setMsg]             = useState("");
  const [blockCount, setBlockCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [doorsOpen, setDoorsOpen] = useState<Set<string>>(new Set());
  const [hoveredTurn, setHoveredTurn] = useState<null | "L" | "R">(null);

  const G         = config.grid_size;
  const canvasSize = G * CELL;
  const maxBlocks  = config.max_blocks;
  const overLimit  = maxBlocks !== undefined && blockCount > maxBlocks;
  const available  = config.available_blocks;

  // ── Draw whenever state changes ──
  const redraw = useCallback((
    px: number, py: number, d: Dir, rotDeg: number, wf: number,
    coll: Set<string>, dOpen: Set<string>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawScene(ctx, config, px, py, d, rotDeg, wf, coll, dOpen);
  }, [config]);

  useEffect(() => {
    redraw(pos.x, pos.y, dir, DIR_ANGLE[dir], 0, collected, doorsOpen);
  }, [pos, dir, collected, doorsOpen, redraw]);

  // ── Blockly init ──
  useEffect(() => {
    if (!blocklyRef.current) return;
    let ws: unknown = null;

    async function init() {
      const Blockly = await import("blockly");
      const Blocks = Blockly.Blocks as Record<string, unknown>;

      if (!Blocks["robot_move"]) {
        const def = (label: string, color: number, tooltip: string) => ({
          init(this: unknown) {
            (this as any).appendDummyInput().appendField(label);
            (this as any).setPreviousStatement(true, null);
            (this as any).setNextStatement(true, null);
            (this as any).setColour(color);
            (this as any).setTooltip(tooltip);
          },
        });
        Blocks["robot_move"]       = def("🚀 Avancer",       210, "Kirikou avance d'une case");
        Blocks["robot_turn_left"]  = def("↰ Tourner gauche", 290, "Tourne de 90° à gauche");
        Blocks["robot_turn_right"] = def("↱ Tourner droite", 290, "Tourne de 90° à droite");
        Blocks["robot_pick"]       = def("🧲 Ramasser",      35,  "Ramasse l'objet sur cette case");
      }

      const { javascriptGenerator } = await import("blockly/javascript");
      javascriptGenerator.forBlock["robot_move"]       = () => "await _move();\n";
      javascriptGenerator.forBlock["robot_turn_left"]  = () => "_turn('L');\n";
      javascriptGenerator.forBlock["robot_turn_right"] = () => "_turn('R');\n";
      javascriptGenerator.forBlock["robot_pick"]       = () => "_pick();\n";

      const allToolboxBlocks = [
        { kind: "block", type: "robot_move" },
        { kind: "block", type: "robot_turn_left" },
        { kind: "block", type: "robot_turn_right" },
        {
          kind: "block", type: "controls_repeat_ext",
          inputs: { TIMES: { block: { type: "math_number", fields: { NUM: 3 } } } },
        },
        { kind: "block", type: "robot_pick" },
      ];

      const contents = available
        ? allToolboxBlocks.filter((b) => available.includes((b as any).type))
        : allToolboxBlocks;

      const toolbox = { kind: "flyoutToolbox", contents };

      // Build a dark theme so the workspace background matches the UI
      const darkTheme = (Blockly as any).Theme.defineTheme("codekids_dark", {
        base: (Blockly as any).Themes?.Dark ?? (Blockly as any).Themes?.Classic,
        componentStyles: {
          workspaceBackgroundColour: "#0f172a",
          toolboxBackgroundColour: "#1e293b",
          toolboxForegroundColour: "#e2e8f0",
          flyoutBackgroundColour: "#1e293b",
          flyoutForegroundColour: "#e2e8f0",
          flyoutOpacity: 1,
          scrollbarColour: "#475569",
          insertionMarkerColour: "#fff",
          insertionMarkerOpacity: 0.3,
          scrollbarOpacity: 0.6,
          cursorColour: "#d0d0d0",
        },
      });

      blocklyRef.current!.innerHTML = "";
      ws = Blockly.inject(blocklyRef.current!, {
        toolbox,
        theme: darkTheme,
        scrollbars: true,
        trashcan: true,
        media: "https://unpkg.com/blockly/media/",
      });
      workspaceRef.current = ws;

      if (savedXml) {
        try {
          const xml = (Blockly as any).utils.xml.textToDom(savedXml);
          (Blockly as any).Xml.domToWorkspace(xml, ws);
        } catch { /* ignore stale XML */ }
      }

      (ws as any).addChangeListener(() => {
        setBlockCount((ws as any).getAllBlocks(false).length);
        if (onXmlChange) {
          try {
            const dom = (Blockly as any).Xml.workspaceToDom(ws);
            onXmlChange((Blockly as any).utils.xml.domToText(dom));
          } catch { /* ignore */ }
        }
      });

      requestAnimationFrame(() => setTimeout(() => (Blockly as any).svgResize?.(ws), 100));
    }

    init().catch(console.error);
    return () => {
      if (ws && (ws as any).dispose) (ws as any).dispose();
      cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Run ──
  const run = useCallback(async (testMode = false) => {
    const ws = workspaceRef.current as any;
    if (!ws) return;

    const { javascriptGenerator } = await import("blockly/javascript");
    const code = javascriptGenerator.workspaceToCode(ws);
    setStatus("running");
    setMsg("");

    type Cmd = { type: "move" } | { type: "turn"; side: "L" | "R" } | { type: "pick" };
    const commands: Cmd[] = [];
    const _turn = (side: "L" | "R") => commands.push({ type: "turn", side });
    const _move  = async () => { commands.push({ type: "move" }); };
    const _pick  = () => commands.push({ type: "pick" });

    try {
      const fn = new Function("_move", "_turn", "_pick", `return (async () => { ${code} })();`);
      await fn(_move, _turn, _pick);
    } catch {
      setStatus("fail");
      setMsg("Erreur dans ton programme 😬");
      return;
    }

    // Execute step by step with smooth animation
    let cur = { x: config.start.x, y: config.start.y, dir: config.start.dir as Dir };
    let curAngle = DIR_ANGLE[cur.dir]; // visual rotation in degrees
    const coll  = new Set<string>();
    const dOpen = new Set<string>();

    const smoothTurn = (side: "L" | "R", newDir: Dir): Promise<void> =>
      new Promise((resolve) => {
        const fromAngle = curAngle;
        const toAngle = fromAngle + (side === "R" ? 90 : -90);
        const start = performance.now();
        const DURATION = 260;
        const frame = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const angle = fromAngle + (toAngle - fromAngle) * e;
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d")!;
            drawScene(ctx, config, cur.x, cur.y, newDir, angle, 0, coll, dOpen);
          }
          if (t < 1) {
            animRef.current = requestAnimationFrame(frame);
          } else {
            curAngle = toAngle;
            setDir(newDir);
            resolve();
          }
        };
        animRef.current = requestAnimationFrame(frame);
      });

    const smoothMove = (
      fromX: number, fromY: number, toX: number, toY: number, d: Dir,
    ): Promise<void> =>
      new Promise((resolve) => {
        const angle = curAngle;
        const start = performance.now();
        const DURATION = 280;
        const frame = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          const px = fromX + (toX - fromX) * e;
          const py = fromY + (toY - fromY) * e;
          const wf = Math.floor(now / 75) % 4;
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d")!;
            drawScene(ctx, config, px, py, d, angle, wf, coll, dOpen);
          }
          if (t < 1) {
            animRef.current = requestAnimationFrame(frame);
          } else {
            setPos({ x: toX, y: toY });
            setDir(d);
            resolve();
          }
        };
        animRef.current = requestAnimationFrame(frame);
      });

    for (const cmd of commands) {
      if (cmd.type === "turn") {
        const idx = DIRS.indexOf(cur.dir);
        const newDir = cmd.side === "L" ? DIRS[(idx + 3) % 4] : DIRS[(idx + 1) % 4];
        cur = { ...cur, dir: newDir };
        await smoothTurn(cmd.side, newDir);
      } else if (cmd.type === "move") {
        const [dx, dy] = DELTA[cur.dir];
        const nx = cur.x + dx;
        const ny = cur.y + dy;

        // Check wall
        const DIR_SCREEN: Record<Dir, string> = { N: "vers le haut ↑", E: "vers la droite →", S: "vers le bas ↓", W: "vers la gauche ←" };
        const oob = nx < 0 || ny < 0 || nx >= G || ny >= G;
        if (oob || config.walls.some((w) => w.x === nx && w.y === ny)) {
          setStatus("fail");
          const reason = oob
            ? `Kirikou sort de la grille en avançant ${DIR_SCREEN[cur.dir]}.`
            : `Kirikou heurte un mur en avançant ${DIR_SCREEN[cur.dir]}. Compte bien les cases ou vérifie sa direction !`;
          setMsg(`💥 ${reason}`);
          return;
        }

        // Check locked door
        const doorKey = `${nx},${ny}`;
        if (config.locked_doors?.some((d) => d.x === nx && d.y === ny) && !dOpen.has(doorKey)) {
          setStatus("fail");
          setMsg(`🔒 La porte est verrouillée ! Kirikou doit ramasser la clé 🗝️ avant d'arriver ici.`);
          return;
        }

        await smoothMove(cur.x, cur.y, nx, ny, cur.dir);
        cur = { ...cur, x: nx, y: ny };

        // Collect items on this cell
        if (config.collectibles) {
          for (const c of config.collectibles) {
            const ck = `${c.x},${c.y}`;
            if (c.x === cur.x && c.y === cur.y && !coll.has(ck)) {
              coll.add(ck);
              setCollected(new Set(coll));

              // If picked a key, open matching locked doors
              if (c.type === "key" && config.locked_doors) {
                for (const d of config.locked_doors) {
                  if (d.requires === "key") {
                    dOpen.add(`${d.x},${d.y}`);
                  }
                }
                setDoorsOpen(new Set(dOpen));
              }
            }
          }
        }
      } else if (cmd.type === "pick") {
        // Manual pick (robot_pick block)
        if (config.collectibles) {
          for (const c of config.collectibles) {
            const ck = `${c.x},${c.y}`;
            if (c.x === cur.x && c.y === cur.y && !coll.has(ck)) {
              coll.add(ck);
              setCollected(new Set(coll));
              if (c.type === "key" && config.locked_doors) {
                for (const d of config.locked_doors) {
                  dOpen.add(`${d.x},${d.y}`);
                }
                setDoorsOpen(new Set(dOpen));
              }
            }
          }
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    if (testMode) {
      setStatus("idle");
      return;
    }

    if (cur.x === config.goal.x && cur.y === config.goal.y) {
      setStatus("success");
      setMsg("🎉 Bravo Kirikou ! Tu as atteint la sortie !");
      setShowConfetti(true);
      setTimeout(() => { setShowConfetti(false); onSolved(); }, 2000);
    } else {
      setStatus("fail");
      const dx = config.goal.x - cur.x;
      const dy = config.goal.y - cur.y;
      const hint = dx > 0 ? `encore ${dx} case(s) vers la droite →`
        : dx < 0 ? `encore ${-dx} case(s) vers la gauche ←`
        : dy > 0 ? `encore ${dy} case(s) vers le bas ↓`
        : `encore ${-dy} case(s) vers le haut ↑`;
      setMsg(`🎯 Kirikou s'est arrêté en (${cur.x}, ${cur.y}) — il lui manquait ${hint} pour atteindre la sortie. Continue !`);
    }
  }, [config, G, onSolved]);

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    setPos({ x: config.start.x, y: config.start.y });
    setDir(config.start.dir);
    setStatus("idle");
    setMsg("");
    setCollected(new Set());
    setDoorsOpen(new Set());
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 relative flex flex-col">

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 95}%`,
                top: `${Math.random() * 80}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.6}s`,
              }}
            >
              {CONFETTI[i % CONFETTI.length]}
            </span>
          ))}
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <span className="font-black text-amber-400 text-sm">
          {config.title ?? "Labyrinthe Kirikou"}
        </span>
        {maxBlocks !== undefined && (
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${overLimit ? "bg-red-900 text-red-300" : "bg-slate-700 text-slate-300"}`}>
            {blockCount}/{maxBlocks} blocs{overLimit ? " ⚠️" : ""}
          </span>
        )}
      </div>

      {/* ── Main area: Blockly left | Maze+Mission right ── */}
      <div className="flex flex-1 min-h-0" style={{ minHeight: 420 }}>

        {/* LEFT — Blockly */}
        <div className="flex flex-col flex-1 border-r border-slate-700 min-w-0">
          <div className="bg-slate-800 px-3 py-1.5 border-b border-slate-700">
            <span className="text-xs font-bold text-slate-400">🔧 Programme</span>
          </div>
          <div ref={blocklyRef} style={{ flex: 1, minHeight: 360 }} />
        </div>

        {/* RIGHT — Mission + Maze + Controls */}
        <div className="flex flex-col items-center gap-2 p-3 bg-slate-900" style={{ minWidth: canvasSize + 24 }}>

          {/* Mission steps */}
          {(config.steps || config.instructions) && (
            <div className="w-full bg-slate-800 rounded-xl border border-slate-700 px-3 py-2">
              <div className="text-xs font-black text-amber-400 mb-1">🎯 Mission</div>
              {config.steps ? (
                <ol className="space-y-0.5">
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

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="rounded-xl border border-slate-700 block"
            style={{ imageRendering: "pixelated" }}
          />

          {/* Status message */}
          {msg && (
            <div className={`text-xs font-bold rounded-xl px-3 py-1.5 text-center w-full ${
              status === "success" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
            }`}>
              {msg}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => run(true)}
              disabled={status === "running"}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors"
            >
              👁 Tester
            </button>
            <button
              onClick={() => run(false)}
              disabled={status === "running"}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-colors"
            >
              ▶ Lancer !
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Block palette (bottom full-width) ── */}
      <div className="border-t border-slate-700 bg-slate-800 px-4 py-2">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-xs font-black text-slate-500">Blocs disponibles</span>
          {hoveredTurn && (
            <span className="text-xs bg-amber-950 border border-amber-700 text-amber-300 px-2 py-0.5 rounded-lg animate-pulse">
              → Kirikou regardera{" "}
              <strong>{DIR_ARROW[NEXT_DIR[dir][hoveredTurn]]} {DIR_LABEL[NEXT_DIR[dir][hoveredTurn]]}</strong>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_BLOCKS.map((b) => {
            const unlocked = !available || available.includes(b.id);
            const isTurnL = b.id === "robot_turn_left";
            const isTurnR = b.id === "robot_turn_right";
            return (
              <span
                key={b.id}
                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                  unlocked
                    ? "border-slate-600 text-slate-200 bg-slate-700 " + ((isTurnL || isTurnR) ? "cursor-default hover:border-amber-600 hover:bg-amber-950/40" : "")
                    : "border-slate-800 text-slate-600 bg-slate-900 opacity-50"
                }`}
                onMouseEnter={() => { if (unlocked && isTurnL) setHoveredTurn("L"); if (unlocked && isTurnR) setHoveredTurn("R"); }}
                onMouseLeave={() => setHoveredTurn(null)}
              >
                {b.label}
                {b.badge && (
                  <span className={`text-[9px] px-1 rounded ${unlocked ? "bg-slate-600 text-slate-400" : "bg-slate-800 text-slate-700"}`}>
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
