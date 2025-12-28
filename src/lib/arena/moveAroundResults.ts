// Move Around Results System
// Random results when players use "Move Around" action

export interface MoveAroundResult {
  id: string;
  description: string;
  effect: {
    type: "energy" | "aura" | "armor" | "mastery" | "atk_boost" | "mastery_use";
    value?: number;
    percentage?: number; // For percentage-based effects
    duration?: number; // For temporary effects (minutes)
  };
}

export const MOVE_AROUND_RESULTS: MoveAroundResult[] = [
  {
    id: "energy_25",
    description: "Energy gathered.",
    effect: { type: "energy", value: 25 },
  },
  {
    id: "energy_40",
    description: "Energy gathered.",
    effect: { type: "energy", value: 40 },
  },
  {
    id: "meditation_pond",
    description: "Found a Meditation pond.",
    effect: { type: "aura", percentage: 40 }, // 40% of Max HP
  },
  {
    id: "armor",
    description: "Found an armor.",
    effect: { type: "armor", value: 10 },
  },
  {
    id: "m_drive",
    description: "Found a M-Drive",
    effect: { type: "mastery", value: 1 },
  },
  {
    id: "m_bug",
    description: "Found a M-Bug",
    effect: { type: "mastery", value: -1 },
  },
  {
    id: "red_orb",
    description: "Found a Red Orb.",
    effect: { type: "atk_boost", percentage: 30, duration: 5 }, // 30% of current ATK for 5 minutes
  },
  {
    id: "m_key_1",
    description: "Found a M-Key",
    effect: { type: "mastery_use" }, // Uses Mastery based on Discipline
  },
  {
    id: "m_key_2",
    description: "Found a M-Key",
    effect: { type: "mastery_use" }, // Uses Mastery based on Discipline
  },
];

// Get random Move Around result
export function getRandomMoveAroundResult(): MoveAroundResult {
  const randomIndex = Math.floor(Math.random() * MOVE_AROUND_RESULTS.length);
  return MOVE_AROUND_RESULTS[randomIndex];
}

