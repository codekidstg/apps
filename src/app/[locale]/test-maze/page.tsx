"use client";
import BlocklyRobot from "@/components/eleve/BlocklyRobot";

// Maze 3 — Le labyrinthe en S (pour tester les messages d'erreur)
// Solution : Avancer×2, Tourner droite, Avancer×3, Tourner gauche, Avancer×3, Tourner droite, Avancer×2
const MAZE_CONFIG = {
  grid_size: 6,
  start: { x: 0, y: 0, dir: "E" as const },
  goal:  { x: 5, y: 5 },
  walls: [
    {x:3,y:0},{x:4,y:0},{x:5,y:0},
    {x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:0,y:5},
    {x:1,y:1},{x:1,y:2},{x:1,y:3},{x:1,y:4},{x:1,y:5},
    {x:3,y:1},{x:3,y:2},
    {x:2,y:4},{x:2,y:5},
    {x:3,y:4},{x:3,y:5},{x:4,y:4},{x:4,y:5},
  ],
  max_blocks: 16,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
  title: "Niveau 3 — Le labyrinthe en S",
  instructions: "Trois virages t'attendent — planifie avant de lancer !",
  steps: [
    "→ Avance vers la droite — 2 cases",
    "↱ Tourne DROITE pour descendre ↓, avance 3 cases",
    "↰ Tourne GAUCHE pour repartir → à droite, avance 3 cases",
    "↱ Tourne DROITE pour descendre ↓ jusqu'à l'étoile ⭐",
  ],
};

export default function TestMaze() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 flex justify-center">
      <div className="w-full max-w-5xl">
        <BlocklyRobot
          config={MAZE_CONFIG}
          onSolved={() => alert("Bravo !")}
        />
      </div>
    </div>
  );
}
