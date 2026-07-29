export type Level = {
  num: number;
  name: string;
  icon: string;
  minXp: number;
  maxXp: number;
  color: string;
  unlocks: string[];
};

export const LEVELS: Level[] = [
  { num: 1, name: "Explorateur",   icon: "🌱", minXp: 0,    maxXp: 500,  color: "#10b981", unlocks: ["robot_blue"] },
  { num: 2, name: "Bâtisseur",     icon: "🏗️",  minXp: 500,  maxXp: 1500, color: "#3b82f6", unlocks: ["robot_orange", "hat_cap"] },
  { num: 3, name: "Architecte",    icon: "🏛️", minXp: 1500, maxXp: 3000, color: "#8b5cf6", unlocks: ["robot_green", "hat_wizard"] },
  { num: 4, name: "Maître Codeur", icon: "🧠", minXp: 3000, maxXp: 9999, color: "#f59e0b", unlocks: ["robot_gold", "hat_crown", "acc_wings"] },
];

export function getLevelForXp(xp: number): Level {
  return LEVELS.findLast((l) => xp >= l.minXp) ?? LEVELS[0];
}

export function xpProgressInLevel(xp: number): { pct: number; current: number; needed: number } {
  const level = getLevelForXp(xp);
  const current = xp - level.minXp;
  const needed  = level.maxXp - level.minXp;
  return { pct: Math.min(100, Math.round((current / needed) * 100)), current, needed };
}

export const XP_REWARDS = {
  lesson_completed: 50,
  quiz_perfect:     30,
  blockly_solved:   40,
  streak_day:       20,
  first_lesson:    100,
} as const;
