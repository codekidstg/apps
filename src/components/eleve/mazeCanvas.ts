"use client";
// Rendu du labyrinthe — grille, murs, objectif et personnage.
// Partagé par BlocklyRobot (Explorateur, piloté en blocs) et PythonMaze
// (Bâtisseur, piloté en Python tapé). Deux copies auraient fini par diverger.

export type Collectible = { x: number; y: number; type: "key" | "gem" };
export type LockedDoor  = { x: number; y: number; requires: "key" };

export type ChallengeConfig = {
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

export type Dir = "N" | "E" | "S" | "W";
export const DIRS: Dir[] = ["N", "E", "S", "W"];
export const DELTA: Record<Dir, [number, number]> = {
  N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0],
};
// Visual rotation (degrees): character drawn facing South (↓) at 0°
export const DIR_ANGLE: Record<Dir, number> = { S: 0, W: 90, N: 180, E: 270 };
export const NEXT_DIR: Record<Dir, { L: Dir; R: Dir }> = {
  N: { L: "W", R: "E" }, E: { L: "N", R: "S" },
  S: { L: "E", R: "W" }, W: { L: "S", R: "N" },
};
export const DIR_ARROW: Record<Dir, string> = { N: "↑", E: "→", S: "↓", W: "←" };
export const DIR_LABEL: Record<Dir, string> = { N: "haut", E: "droite", S: "bas", W: "gauche" };

export const CONFETTI = ["🌟", "⭐", "✨", "🎉", "🏆", "🥳", "💫", "🎊"];


export const CELL = 52;

// ── Kirikou canvas drawing ──────────────────────────────────────────────────

export function drawKirikou(
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

export function drawScene(
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
