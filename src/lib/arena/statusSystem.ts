// Status System for New Arena
// Handles all status effects, timers, and status logic

export type StatusType =
  | "Stunned"
  | "Hidden"
  | "Shielded"
  | "Weakened"
  | "Lethal"
  | "Grounded"
  | "Reaping"
  | "Unwell"
  | "Focused"
  | "Airborne"
  | "Underground"
  | "Silenced"
  | "Stasis"
  | "K.O"
  | "Element-affected"
  | "Launched Up"
  | "Shrouded"
  | "Analyzed"
  | "Blessed"
  | "Bleeding"
  | "Chaos-affected";

export interface PlayerStatus {
  status: StatusType;
  expires_at: string;
  applied_by_mastery: number;
}

// Status effects that always last 2 minutes regardless of Mastery
const ALWAYS_2_MIN_STATUSES: StatusType[] = ["Stunned", "Silenced"];

// Calculate status duration based on Mastery
export function calculateStatusDuration(mastery: number, status: StatusType): number {
  // Stunned and Silenced always last 2 minutes
  if (ALWAYS_2_MIN_STATUSES.includes(status)) {
    return 2;
  }
  
  // If mastery is less than 1, default to 1 minute
  if (mastery < 1) {
    return 1;
  }
  
  // Otherwise, 1 M = 1 minute
  return Math.floor(mastery);
}

// Check if status blocks actions
export function statusBlocksActions(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Stunned" || 
    s === "K.O" || 
    s === "Grounded"
  );
}

// Check if status blocks techniques
export function statusBlocksTechniques(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Stunned" || 
    s === "Silenced" || 
    s === "K.O"
  );
}

// Check if status blocks specific technique tags
export function statusBlocksTechniqueTag(statuses: StatusType[], tag: string): boolean {
  if (statuses.includes("Shrouded") && (tag === "Ranged" || tag === "Aoe")) {
    return true;
  }
  if (statuses.includes("Launched Up") && tag === "Defensive") {
    return true;
  }
  if (statuses.includes("Unwell") && tag === "Movement") {
    return true;
  }
  return false;
}

// Check if status allows hitting Airborne/Underground
export function canHitAirborneUnderground(statuses: StatusType[]): boolean {
  return statuses.includes("Focused");
}

// Check if status ignores damage
export function statusIgnoresDamage(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Shielded" || 
    s === "Stasis" || 
    s === "Airborne" || 
    s === "Underground"
  );
}

// Check if status can be affected by AOE/SETUP
export function canBeAffectedByAOE(statuses: StatusType[]): boolean {
  return !statuses.includes("Hidden");
}

// Get damage multiplier for status
export function getDamageMultiplier(statuses: StatusType[], techniqueTags: string[]): number {
  let multiplier = 1;
  
  if (statuses.includes("Element-affected") && techniqueTags.includes("Elemental")) {
    multiplier *= 1.5;
  }
  if (statuses.includes("Analyzed") && techniqueTags.includes("Physical")) {
    multiplier *= 1.5;
  }
  if (techniqueTags.includes("Setup") && statuses.some(s => s.includes("Aura"))) {
    multiplier *= 1.5;
  }
  
  return multiplier;
}

// Get heal multiplier for status
export function getHealMultiplier(statuses: StatusType[]): number {
  if (statuses.includes("Blessed")) {
    return 1.5;
  }
  if (statuses.includes("Unwell")) {
    return 0; // Cannot be healed
  }
  return 1;
}

// Check if status prevents Armor/Energy gain
export function statusPreventsGain(statuses: StatusType[]): { armor: boolean; energy: boolean } {
  return {
    armor: statuses.includes("Weakened"),
    energy: statuses.includes("Weakened")
  };
}

// Get periodic damage from statuses (per minute)
export function getPeriodicDamage(statuses: StatusType[], currentHp: number): number {
  if (statuses.includes("Bleeding")) {
    return Math.floor(currentHp * 0.2); // 20% of current HP
  }
  return 0;
}

// Get periodic energy loss from statuses (per minute)
export function getPeriodicEnergyLoss(statuses: StatusType[]): number {
  if (statuses.includes("Chaos-affected")) {
    return 2;
  }
  return 0;
}

// Get mastery loss from statuses (per minute)
export function getMasteryLoss(statuses: StatusType[]): number {
  if (statuses.includes("Launched Up")) {
    return 0.25;
  }
  return 0;
}

