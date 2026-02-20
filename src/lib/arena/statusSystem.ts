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
  | "K.O.Lockout"
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

const ALWAYS_2_MIN_STATUSES: StatusType[] = ["Stunned", "Silenced"];

export function calculateStatusDuration(mastery: number, status: StatusType): number {
  if (ALWAYS_2_MIN_STATUSES.includes(status)) {
    return 2;
  }
  if (mastery < 1) {
    return 1;
  }
  return Math.floor(mastery);
}

// Blocks actions: Attack, Move Around, Change Zone, Observe, Teleport
export function statusBlocksActions(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Stunned" || 
    s === "K.O" || 
    s === "K.O.Lockout" ||
    s === "Grounded" ||
    s === "Stasis"
  );
}

// Blocks ALL techniques (Stunned, Silenced, K.O.Lockout, Stasis)
export function statusBlocksTechniques(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Stunned" || 
    s === "Silenced" || 
    s === "K.O" ||
    s === "K.O.Lockout" ||
    s === "Stasis"
  );
}

// Blocks techniques with specific tags based on active statuses
export function statusBlocksTechniqueTag(statuses: StatusType[], tag: string): boolean {
  const normalizedTag = tag.toLowerCase();
  if (statuses.includes("Shrouded") && (normalizedTag === "ranged" || normalizedTag === "aoe")) {
    return true;
  }
  if (statuses.includes("Launched Up") && normalizedTag === "defensive") {
    return true;
  }
  if (statuses.includes("Unwell") && normalizedTag === "movement") {
    return true;
  }
  if (statuses.includes("Bleeding") && (normalizedTag === "buff" || normalizedTag === "revival")) {
    return true;
  }
  if (statuses.includes("Chaos-affected") && (normalizedTag === "combo" || normalizedTag === "setup")) {
    return true;
  }
  return false;
}

// Blocks zone changes (clicking on zone pictures)
export function statusBlocksZoneChange(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Stunned" ||
    s === "K.O" ||
    s === "K.O.Lockout" ||
    s === "Grounded" ||
    s === "Stasis"
  );
}

// Blocks Teleport action specifically
export function statusBlocksTeleport(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Stunned" ||
    s === "K.O" ||
    s === "K.O.Lockout" ||
    s === "Grounded" ||
    s === "Stasis" ||
    s === "Chaos-affected"
  );
}

export function canHitAirborneUnderground(statuses: StatusType[]): boolean {
  return statuses.includes("Focused");
}

// Whether target ignores ALL damage (Shielded, Airborne, Underground)
// Stasis is handled separately as a complete immunity
export function statusIgnoresDamage(statuses: StatusType[]): boolean {
  return statuses.some(s => 
    s === "Shielded" || 
    s === "Airborne" || 
    s === "Underground"
  );
}

// Stasis: complete immunity - can't take damage, can't be targeted, techniques don't affect them
export function statusIsImmune(statuses: StatusType[]): boolean {
  return statuses.includes("Stasis");
}

// Stasis: can't heal
export function statusBlocksHealing(statuses: StatusType[]): boolean {
  return statuses.includes("Stasis") || statuses.includes("Unwell");
}

// Stasis: can't attack
export function statusBlocksAttacking(statuses: StatusType[]): boolean {
  return statuses.includes("Stasis");
}

// Lethal: attack bypasses Armor and Aura, deals direct HP damage
export function attackBypassesDefenses(statuses: StatusType[]): boolean {
  return statuses.includes("Lethal");
}

// Reaping: ignores Armor, Aura, AND Shielded (but NOT Stasis)
export function attackIgnoresEverything(statuses: StatusType[]): boolean {
  return statuses.includes("Reaping");
}

export function canBeAffectedByAOE(statuses: StatusType[]): boolean {
  return !statuses.includes("Hidden");
}

export function getDamageMultiplier(statuses: StatusType[], techniqueTags: string[]): number {
  let multiplier = 1;
  const normalizedTags = techniqueTags.map(t => t.toLowerCase());
  
  if (statuses.includes("Element-affected") && normalizedTags.includes("elemental")) {
    multiplier *= 1.5;
  }
  if (statuses.includes("Analyzed") && normalizedTags.includes("physical")) {
    multiplier *= 1.5;
  }
  if (normalizedTags.includes("setup") && statuses.some(s => s.includes("Aura"))) {
    multiplier *= 1.5;
  }
  
  return multiplier;
}

export function getHealMultiplier(statuses: StatusType[]): number {
  if (statuses.includes("Blessed")) {
    return 1.5;
  }
  if (statuses.includes("Unwell") || statuses.includes("Stasis")) {
    return 0;
  }
  return 1;
}

// Weakened: blocks Energy AND Armor gain
export function statusPreventsGain(statuses: StatusType[]): { armor: boolean; energy: boolean } {
  return {
    armor: statuses.includes("Weakened"),
    energy: statuses.includes("Weakened")
  };
}

// Weakened: blocks Energy AND Armor gain, and loses 4 ATK on apply
// Bleeding: blocks BUFF/REVIVAL techniques (handled by statusBlocksTechniqueTag)
// Chaos-affected: blocks COMBO/SETUP techniques + Teleport (handled by statusBlocksTechniqueTag + statusBlocksTeleport)
// Launched Up: blocks DEFENSIVE techniques + loses 0.50 M on apply (handled in Arena.tsx)
