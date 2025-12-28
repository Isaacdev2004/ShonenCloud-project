// Stats System for New Arena
// Handles HP, ATK, Armor, Energy, Aura, Mastery calculations

// Calculate max HP based on level
export function calculateMaxHP(level: number): number {
  return 100 + (level - 1) * 5;
}

// Calculate max ATK based on level
export function calculateMaxATK(level: number): number {
  return 20 + (level - 1) * 2;
}

// Apply damage to target (Aura -> Armor -> HP)
export function applyDamage(
  damage: number,
  currentHP: number,
  armor: number,
  aura: number
): { newHP: number; newArmor: number; newAura: number } {
  let remainingDamage = damage;
  let newAura = aura;
  let newArmor = armor;
  let newHP = currentHP;

  // Damage Aura first
  if (newAura > 0 && remainingDamage > 0) {
    if (remainingDamage >= newAura) {
      remainingDamage -= newAura;
      newAura = 0;
    } else {
      newAura -= remainingDamage;
      remainingDamage = 0;
    }
  }

  // Then damage Armor
  if (newArmor > 0 && remainingDamage > 0) {
    if (remainingDamage >= newArmor) {
      remainingDamage -= newArmor;
      newArmor = 0;
    } else {
      newArmor -= remainingDamage;
      remainingDamage = 0;
    }
  }

  // Finally damage HP
  if (remainingDamage > 0) {
    newHP = Math.max(0, newHP - remainingDamage);
  }

  return { newHP, newArmor, newAura };
}

// Apply armor damage (only to Armor)
export function applyArmorDamage(
  damage: number,
  armor: number
): number {
  return Math.max(0, armor - damage);
}

// Apply aura damage (only to Aura)
export function applyAuraDamage(
  damage: number,
  aura: number
): number {
  return Math.max(0, aura - damage);
}

// Apply heal (adds to current HP, capped at max HP)
export function applyHeal(
  heal: number,
  currentHP: number,
  maxHP: number
): number {
  return Math.min(maxHP, currentHP + heal);
}

// Calculate Aura expiration time (2 minutes from now)
export function calculateAuraExpiration(): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 2);
  return expiration;
}

// Check if Aura has expired
export function isAuraExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

// Get effective HP (HP + Aura)
export function getEffectiveHP(currentHP: number, aura: number): number {
  return currentHP + aura;
}

