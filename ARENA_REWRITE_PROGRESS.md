# Arena System Rewrite - Progress Tracker

## Status: In Progress

This document tracks the comprehensive rewrite of Arena.tsx to implement the new Arena system.

## Completed Foundation ✅

1. **Database Migration** ✅
   - New tables: arena_sessions, arena_participants, player_statuses, action_cooldowns, technique_cooldowns, battle_feed, observe_status, red_orb_effects
   - New profile columns: max_hp, current_hp, max_atk, current_atk, aura, mastery, target tracking
   - Enhanced techniques table with 20+ new fields

2. **Utility Systems** ✅
   - `statusSystem.ts` - All 20+ statuses with logic
   - `masterySystem.ts` - Discipline-specific Mastery effects
   - `statsSystem.ts` - HP, ATK, Armor, Energy, Aura calculations
   - `moveAroundResults.ts` - Random Move Around results
   - `timerSystem.ts` - Open/close times, battle timer management

## Current Task: Arena.tsx Complete Rewrite ⏳

### New Features to Implement:

1. **Stats Display**
   - Show HP (current/max), ATK (current/max), Armor, Energy, Aura, Mastery
   - Compact format: "HP: 100/1367" (no spacing)
   - Real-time updates

2. **Join System**
   - Join button (only during open time)
   - Session tracking
   - Only joined players can participate

3. **Timer System**
   - Arena open/close timer display
   - Battle timer (60s with 30s setup phase)
   - Countdown displays

4. **Actions**
   - Attack (1min cooldown, +0.25M)
   - Move Around (random results, auto-apply stats)
   - Observe (5min cooldown, requires M>=1)
   - Change Zone (5min cooldown)

5. **Enhanced Techniques**
   - All new fields (damage, healing, status effects, etc.)
   - Energy cost validation
   - Cooldown tracking
   - Mastery requirements

6. **Status System**
   - Display active statuses
   - Mastery-based timers
   - Status effect logic

7. **Battle Feed**
   - Vanishing popups for own actions
   - Full list for other players
   - Technique notifications

8. **Zone Targeting**
   - Target zone button
   - Emperor discipline logic
   - Global tag techniques

9. **Player Popup**
   - Click-based (no hover)
   - Show all stats
   - Target/Battle Feed/Teleport buttons

10. **Inactivity/K.O Systems**
    - Inactivity penalties
    - K.O system with Revival
    - Action limits (1 action + 1 technique per minute)

## File Size Estimate

Current Arena.tsx: ~1,536 lines
New Arena.tsx: ~3,000+ lines (estimated)

## Next Steps

1. Create new Arena.tsx with all systems integrated
2. Test each system individually
3. Integration testing
4. UI/UX refinements

