// Timer System for New Arena
// Handles open/close times, battle timer, and session management

// Arena session constants
export const ARENA_OPEN_DURATION_MINUTES = 40;
export const ARENA_CLOSE_DURATION_MINUTES = 20;
export const BATTLE_TIMER_SECONDS = 60;
export const BATTLE_SETUP_PHASE_SECONDS = 30; // First 30 seconds

// Calculate next arena open time
export function calculateNextArenaOpenTime(lastClosedAt: Date): Date {
  const nextOpen = new Date(lastClosedAt);
  nextOpen.setMinutes(nextOpen.getMinutes() + ARENA_CLOSE_DURATION_MINUTES);
  return nextOpen;
}

// Calculate arena close time
export function calculateArenaCloseTime(openedAt: Date): Date {
  const closedAt = new Date(openedAt);
  closedAt.setMinutes(closedAt.getMinutes() + ARENA_OPEN_DURATION_MINUTES);
  return closedAt;
}

// Check if arena is currently open
export function isArenaOpen(openedAt: string | null, closedAt: string | null): boolean {
  if (!openedAt || !closedAt) return false;
  const now = new Date();
  const openTime = new Date(openedAt);
  const closeTime = new Date(closedAt);
  return now >= openTime && now < closeTime;
}

// Get time until arena opens (in seconds)
export function getTimeUntilArenaOpens(nextOpenAt: string | null): number {
  if (!nextOpenAt) return 0;
  const now = new Date();
  const openTime = new Date(nextOpenAt);
  const diff = openTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

// Get time until arena closes (in seconds)
export function getTimeUntilArenaCloses(closedAt: string | null): number {
  if (!closedAt) return 0;
  const now = new Date();
  const closeTime = new Date(closedAt);
  const diff = closeTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

// Calculate battle timer end time
export function calculateBattleTimerEnd(battleStartedAt: Date): Date {
  const endTime = new Date(battleStartedAt);
  endTime.setSeconds(endTime.getSeconds() + BATTLE_TIMER_SECONDS);
  return endTime;
}

// Get remaining battle timer (in seconds)
export function getRemainingBattleTimer(battleTimerEndsAt: string | null): number {
  if (!battleTimerEndsAt) return 0;
  const now = new Date();
  const endTime = new Date(battleTimerEndsAt);
  const diff = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

// Check if we're in setup phase (first 30 seconds)
export function isInSetupPhase(battleTimerEndsAt: string | null): boolean {
  const remaining = getRemainingBattleTimer(battleTimerEndsAt);
  return remaining > BATTLE_SETUP_PHASE_SECONDS;
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Check if action cooldown has expired
export function isCooldownExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

// Calculate cooldown expiration time
export function calculateCooldownExpiration(minutes: number): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration;
}

// Get remaining cooldown time (in seconds)
export function getRemainingCooldown(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const now = new Date();
  const endTime = new Date(expiresAt);
  const diff = endTime.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

