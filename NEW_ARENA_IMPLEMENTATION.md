# New Arena System Implementation Plan

## Overview
This document outlines the complete implementation of the new Arena system with enhanced stats, statuses, timers, and mechanics.

## Database Changes ✅
- New columns in `profiles`: max_hp, current_hp, max_atk, current_atk, aura, mastery, target tracking
- New tables: arena_sessions, arena_participants, player_statuses, action_cooldowns, technique_cooldowns, battle_feed, observe_status, red_orb_effects
- Enhanced `techniques` table with 20+ new fields

## Implementation Phases

### Phase 1: Core Stats System
- HP (current/max): Starts at 100, +5 per level
- ATK (current/max): Starts at 20, +2 per level
- Armor: Starts at 0, gained through techniques/items
- Energy: Starts at 0, gained through actions/items
- Aura: Starts at 0, added to HP, auto-expires after 2 minutes
- Mastery (M): Starts at 0, max 5, discipline-specific effects

### Phase 2: Actions System
1. **Attack** (1min cooldown)
   - Deals current ATK damage
   - Targets Armor first, then HP
   - Increases M by 0.25

2. **Move Around** (no cooldown)
   - Random results with stat modifications
   - Results visible in battle feed only

3. **Observe** (5min cooldown, requires M >= 1)
   - Allows targeting different zones for 3 minutes

4. **Change Zone** (5min cooldown)
   - Move to different zone via popup

### Phase 3: Enhanced Techniques
- 20+ new fields for damage, healing, status effects, cooldowns, etc.
- Multi-select tags system
- Energy cost/given
- Mastery requirements/effects
- ATK modifications

### Phase 4: Status System
- 20+ statuses with Mastery-based timers
- 1 M = 1 minute duration (except Stunned/Silenced = 2min always)
- Status effects logic (blocking actions, modifying damage, etc.)

### Phase 5: Timer System
- Open time: 20 minutes (players can join)
- Close time: 30 minutes (Arena closed)
- Battle timer: 60 seconds
  - First 30s: Only SETUP/COMBO techniques
  - Last 30s: All techniques allowed
- Periodic K.O: Every 30min, K.O players with <= 20 HP

### Phase 6: Join System
- Join button appears during open time
- Only joined players can participate
- Session tracking

### Phase 7: UI/UX Updates
- Compact stats display (no spacing)
- Current target display
- Battle timer display
- Player popup redesign (click-based, no hover)
- Zone targeting UI
- Battle feed with vanishing popups

### Phase 8: Advanced Systems
- Inactivity penalties
- K.O system with Revival mechanics
- Action limit (1 action + 1 technique per minute)
- Discipline-specific Mastery effects

## Status List (20+ statuses)
1. Stunned - Cannot do anything
2. Hidden - Only affected by AOE/SETUP
3. Shielded - Ignore damage
4. Weakened - No Armor/Energy gain
5. Lethal - Ignore Armor
6. Grounded - Cannot use action buttons
7. Reaping - Ignore Armor and Shielded
8. Unwell - Cannot be healed, no Movement techniques
9. Focused - Can hit Airborne/Underground
10. Airborne/Underground - Damage = 0 (except FOCUSED/AOE/GLOBAL)
11. Silenced - Cannot use techniques
12. Stasis - Damage = 0, no status received
13. K.O - Only Revival techniques
14. Element-affected - 1.5x Elemental damage
15. Launched Up - No DEFENSIVE, loses 0.25M/min
16. Shrouded - No RANGED/AOE techniques
17. Analyzed - 1.5x Physical damage
18. Blessed - 1.5x Heal
19. Bleeding - Loses 20% HP/min
20. Chaos-affected - Loses 2 Energy/min

## Mastery Effects by Discipline
- **Shadow**: HIDDEN status (M minutes)
- **Titan**: +10 Armor per M
- **Finisher**: 15 damage per M to target
- **Emperor**: 10 damage per M to everyone in zone
- **Lightbringer**: Heal 10 HP per M
- **All-Seeing**: FOCUSED + LETHAL (M minutes)

## Move Around Results
1. Energy gathered (+25 Energy)
2. Energy gathered (+40 Energy)
3. Found Meditation pond (+40% Max HP as Aura)
4. Found armor (+10 Armor)
5. Found M-Drive (+1 Mastery)
6. Found M-Bug (-1 Mastery)
7. Found Red Orb (+30% current ATK for 5min)
8. Found M-Key (Use Mastery based on Discipline)
9. Found M-Key (Use Mastery based on Discipline)

## Next Steps
1. ✅ Database migration created
2. ⏳ Update Arena.tsx component
3. ⏳ Create status management system
4. ⏳ Implement timer system
5. ⏳ Update AdminPanel for new technique fields
6. ⏳ Testing and refinement

