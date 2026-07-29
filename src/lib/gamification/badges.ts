export type BadgeId =
  | "first_step"
  | "city_builder"
  | "quiz_ace"
  | "blockly_coder"
  | "streak_3"
  | "architect"
  | "zone_1"
  | "zone_2"
  | "zone_3"
  | "zone_4";

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  color: string;
  xpBonus: number;
};

export const BADGES: Record<BadgeId, Badge> = {
  first_step:    { id: "first_step",    name: "Premier Pas",         description: "Tu as complété ta première leçon !",             icon: "🚀", color: "#f59e0b", xpBonus: 100 },
  city_builder:  { id: "city_builder",  name: "Bâtisseur",           description: "5 leçons complétées — ta cité grandit !",         icon: "🏗️",  color: "#3b82f6", xpBonus:  50 },
  quiz_ace:      { id: "quiz_ace",      name: "As du Quiz",          description: "3 quiz parfaits d'affilée — tu es imbattable !",  icon: "⭐", color: "#8b5cf6", xpBonus:  75 },
  blockly_coder: { id: "blockly_coder", name: "Codeur Blockly",      description: "Premier défi robot résolu — le labo est à toi !",  icon: "🤖", color: "#10b981", xpBonus:  50 },
  streak_3:      { id: "streak_3",      name: "En Feu !",            description: "3 jours de suite — ta motivation est légendaire !", icon: "🔥", color: "#ef4444", xpBonus:  60 },
  architect:     { id: "architect",     name: "Architecte",          description: "10 leçons complétées — tu es l'architecte en chef !", icon: "🏛️", color: "#f59e0b", xpBonus: 150 },
  zone_1:        { id: "zone_1",        name: "La Place du Code",    description: "Zone 1 entièrement complétée !",                   icon: "🏛️", color: "#3b82f6", xpBonus:  80 },
  zone_2:        { id: "zone_2",        name: "La Tour des Boucles", description: "Zone 2 entièrement complétée !",                   icon: "🔁", color: "#8b5cf6", xpBonus:  80 },
  zone_3:        { id: "zone_3",        name: "Le Pont des Conditions", description: "Zone 3 entièrement complétée !",                icon: "🌉", color: "#10b981", xpBonus:  80 },
  zone_4:        { id: "zone_4",        name: "Le Labo Blockly",     description: "Zone 4 entièrement complétée !",                   icon: "🧪", color: "#f59e0b", xpBonus: 120 },
};

export const BADGE_ORDER: BadgeId[] = [
  "first_step", "city_builder", "quiz_ace", "blockly_coder",
  "streak_3", "zone_1", "zone_2", "zone_3", "zone_4", "architect",
];
