# CareerScreen Extraction Plan

## Overview
CareerScreen is the **core gameplay component** containing ~920 lines of the main game loop. This is where players spend 90% of their time.

## Component Structure

### Main CareerScreen Component (lines 9628-10547)
**Location in App.jsx:** Lines 9628-10547 (919 lines)

**Key Features:**
1. **Training System**
   - 5 stat training options (HP, Attack, Defense, Instinct, Speed)
   - Energy costs per stat type
   - Fail chance calculation based on current energy
   - Support card bonuses
   - Friendship system with supports

2. **Energy Management**
   - Energy display and tracking
   - Rest action (restores 30-70 energy)
   - Energy cost warnings

3. **Random Events** (50 types)
   - Stat increase events
   - Choice events with multiple outcomes
   - Battle challenge events
   - Negative/setback events
   - Hangout events with supports

4. **Evolution System**
   - Trigger at specific stat thresholds
   - Visual evolution modal
   - 10% stat boost on evolution

5. **Inspiration System**
   - Triggers at turns 11, 23, 35, 47, 59
   - Applies bonuses from selected inspirations
   - Stat bonuses and aptitude upgrades

6. **Gym Leader Battles**
   - 5 gym leaders at turns 12, 24, 36, 48, 60
   - Preview gym leader stats
   - Mandatory battles (lose = game over)
   - Pokeclock retry system

7. **Ability Learning**
   - Skill point system
   - Move cost calculation with hint discounts
   - Learnable abilities pool
   - Forget abilities option

8. **View Modes:**
   - training: Main training interface
   - battle: Wild Pokemon battles
   - log: Turn history
   - abilities: Known abilities view
   - learn: Ability learning interface
   - gym: Next gym leader preview

### Internal Modal Components

#### 1. EvolutionModal (lines 6881-6945)
- Shows old vs new Pokemon sprites
- Displays stat changes (+10% all stats)
- "Evolve!" confirmation button
- Triggers applyEvolution function

#### 2. InspirationModal (lines 6948-7023)
- Displays at turns 11, 23, 35, 47, 59
- Shows each inspiration's bonuses:
  - Stat inspiration: +X to specific stat (stars indicate power)
  - Aptitude inspiration: Type upgrade chance (F→E→D→C→B→A→S)
- "Continue" button to close and proceed

#### 3. PokeclockModal (lines 7026-7038)
- Simple animation shown when pokeclock is used
- Clock emoji with pulse animation
- Auto-dismisses after gym battle retry

#### 4. HelpModal (lines 7043-7230)
- Comprehensive game guide (~190 lines)
- Sections:
  - Pokemon (stats, aptitudes, type matchups, strategies)
  - Battles (combat, stamina, abilities, damage formula)
  - Career (goals, energy, training, gym battles, events)
  - Gacha (rates, rarities)
- Scrollable side panel (right side of screen)
- Click outside to close

## Required Dependencies

### From GameContext:
```javascript
const {
  careerData,
  setCareerData,
  selectedPokemon,
  selectedSupports,
  selectedInspirations,
  setGameState,
  setBattleState,
  viewMode,
  setViewMode,
  showHelp,
  setShowHelp,
  evolutionModal,
  setEvolutionModal,
  inspirationModal,
  setInspirationModal,
  pokeclockModal,
  setPokeclockModal,
  battleSpeed,
  setBattleSpeed
} = useGame();
```

### From InventoryContext:
```javascript
const { trainedPokemon, addTrainedPokemon } = useInventory();
```

### Helper Functions (defined in original or need extraction):
- `calculateFailChance(currentEnergy, statType)`
- `performTraining(stat)`
- `performRest()`
- `resolveEvent(effect)`
- `startBattle(opponent, isGymLeader)`
- `generateTrainingOptions()`
- `learnMove(moveName)`
- `applyEvolution(fromName, toName, toStage)`
- `getSupportCardAttributes(supportKey)`
- `getAptitudeColor(grade)`
- `generateTrainerSprite(gymIndex)`

### Imports Needed:
```javascript
import React from 'react';
import { Clock, Zap, Trophy, Sparkles, Book, Users } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  getPokemonGrade,
  getAptitudeColor,
  StatIcon,
  getSupportCardAttributes
} from '../utils/gameUtils';
import {
  ICONS,
  GAME_CONFIG,
  MOVES,
  POKEMON,
  SUPPORT_CARDS,
  RANDOM_EVENTS,
  HANGOUT_EVENTS
} from '../shared/gameData';
```

## Extraction Strategy

### Option A: Monolithic File (Recommended for Initial Extract)
Create single `CareerScreen.jsx` file containing:
- Main CareerScreen component
- All 4 modals as internal components
- All helper functions
- Complete with all logic

**Pros:** Maintains exact functionality, easier to extract initially
**Cons:** Large file (~1000 lines)

### Option B: Split Components (Future Refactor)
Split into multiple files:
- `CareerScreen.jsx` (main component ~600 lines)
- `CareerModals.jsx` (4 modals ~300 lines)
- `careerHelpers.js` (helper functions ~100 lines)

**Pros:** Better organization
**Cons:** More complex, requires careful state management

## Implementation Notes

1. **State Dependencies:** CareerScreen heavily relies on GameContext state. Ensure all required state and setters are available.

2. **Helper Functions:** Many functions like `performTraining`, `startBattle`, `resolveEvent` are defined in the original App.jsx component scope. These need to be either:
   - Moved to GameContext as context functions
   - Defined within CareerScreen itself
   - Extracted to a helpers file

3. **Event System:** The random events and hangout events pull from RANDOM_EVENTS and HANGOUT_EVENTS arrays in gameData.

4. **Battle Integration:** When starting battles, CareerScreen calls `startBattle()` which needs to:
   - Set battleState in GameContext
   - Change gameState to 'battle'
   - Initialize battle simulation

5. **Career Completion:** On turn 60 or gym defeat, needs to:
   - Generate inspirations
   - Save to trained Pokemon
   - Navigate to victory/gameOver/careerEnd screens

## Lines of Code by Section

| Section | Lines | Description |
|---------|-------|-------------|
| Main component shell | ~50 | Component definition, hooks, early returns |
| Header (Pokemon info, turn counter) | ~120 | Pokemon sprite, stats, aptitudes, counters |
| Gym battle alert | ~20 | Red banner for gym battles |
| Pending event display | ~170 | Shows active event with choices |
| Event result display | ~90 | Shows results after event resolution |
| Abilities view | ~60 | Grid of known abilities |
| Gym preview view | ~70 | Next gym leader stats/abilities |
| Learn abilities view | ~100 | Learnable moves with costs |
| Training view | ~100 | 5 stat training buttons with support info |
| Battle selection view | ~70 | Wild Pokemon opponent list |
| Turn log view | ~30 | History of turns |
| EvolutionModal | ~65 | Evolution animation/confirmation |
| InspirationModal | ~75 | Inspiration bonuses display |
| PokeclockModal | ~13 | Retry animation |
| HelpModal | ~190 | Complete game guide |
| **TOTAL** | **~920** | **Complete CareerScreen** |

## Critical for Extraction

**MUST PRESERVE:**
- Exact training calculation formulas
- Energy cost system
- Fail chance calculations
- Support friendship mechanics
- Event probability system
- Evolution triggers
- Inspiration timing (turns 11, 23, 35, 47, 59)
- Gym battle timing (turns 12, 24, 36, 48, 60)
- ALL 50 random events
- ALL 30 hangout events
- Turn counter (1-60)
- Skill point economy
- Ability cost calculations with hint discounts

**NO CHANGES TO:**
- Game balance numbers
- Event probabilities
- Stat formulas
- Battle integration

