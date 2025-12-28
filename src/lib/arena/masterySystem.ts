// Mastery System for New Arena
// Handles discipline-specific Mastery effects

import type { Database } from "@/integrations/supabase/types";

type Discipline = Database["public"]["Enums"]["discipline_type"];

export interface MasteryEffect {
  type: "hidden" | "armor" | "damage" | "heal" | "status";
  value: number;
  target?: "self" | "target" | "zone";
  statuses?: string[];
  duration?: number;
}

// Get Mastery effect based on discipline and Mastery value
export function getMasteryEffect(
  discipline: Discipline,
  mastery: number
): MasteryEffect | null {
  // Mastery can only be used at whole numbers (1, 2, 3, 4, 5)
  const wholeMastery = Math.floor(mastery);
  if (wholeMastery < 1 || wholeMastery > 5) {
    return null;
  }

  switch (discipline) {
    case "Shadow":
      return {
        type: "status",
        value: wholeMastery,
        target: "self",
        statuses: ["Hidden"],
        duration: wholeMastery, // minutes
      };

    case "Titan":
      return {
        type: "armor",
        value: wholeMastery * 10, // 10 Armor per Mastery
        target: "self",
      };

    case "Finisher":
      return {
        type: "damage",
        value: wholeMastery * 15, // 15 damage per Mastery
        target: "target",
      };

    case "Emperor":
      return {
        type: "damage",
        value: wholeMastery * 10, // 10 damage per Mastery
        target: "zone",
      };

    case "Lightbringer":
      return {
        type: "heal",
        value: wholeMastery * 10, // 10 HP per Mastery
        target: "self",
      };

    case "All-Seeing":
      return {
        type: "status",
        value: wholeMastery,
        target: "self",
        statuses: ["Focused", "Lethal"],
        duration: wholeMastery, // minutes
      };

    default:
      return null;
  }
}

// Check if Mastery can be used (must be whole number >= 1)
export function canUseMastery(mastery: number): boolean {
  return Math.floor(mastery) >= 1;
}

// Cap Mastery at 5
export function capMastery(mastery: number): number {
  return Math.min(mastery, 5);
}

