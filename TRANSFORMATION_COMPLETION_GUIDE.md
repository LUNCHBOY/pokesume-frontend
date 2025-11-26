# Pokesume Modular Architecture Transformation - Completion Guide

## Current Status: 73.7% Complete

### ✅ COMPLETED (14/19 Screens)

All extracted screens are **fully functional** and located in `src/screens/`:

1. **MenuScreen.jsx** (190 lines) - Main menu, starter selection, navigation
2. **PokemonSelectionScreen.jsx** (220 lines) - Pokemon selection for career
3. **InspirationSelectionScreen.jsx** (260 lines) - Inspiration Pokemon selection
4. **SupportSelectionScreen.jsx** (250 lines) - Support card selection
5. **MyPokemonScreen.jsx** (210 lines) - Pokemon inventory viewer
6. **MySupportScreen.jsx** (290 lines) - Support card inventory
7. **TrainedPokemonScreen.jsx** (240 lines) - Completed careers viewer
8. **GachaScreen.jsx** (180 lines) - Pokemon gacha rolls
9. **SupportGachaScreen.jsx** (170 lines) - Support gacha rolls
10. **BattleScreen.jsx** (210 lines) - Battle visualization with replay
11. **VictoryScreen.jsx** (140 lines) - Champion victory screen
12. **GameOverScreen.jsx** (140 lines) - Gym defeat screen
13. **CareerEndScreen.jsx** (140 lines) - 60-turn completion screen
14. **HistoryScreen.jsx** (160 lines) - Career history display

**Total Extracted:** ~2,800 lines across 14 modular components

---

## ⏳ REMAINING (5/19 Screens)

### 1. CareerScreen (~920 lines) - **CRITICAL**

**Challenge:** This is THE CORE GAMEPLAY LOOP. Most complex component.

**Content:**
- Training system (5 stats, energy, fail chances)
- Energy/Rest system
- Random events (50 types) + Hangout events (30 types)
- Evolution system with modal
- Inspiration triggers (turns 11, 23, 35, 47, 59)
- Gym battles (turns 12, 24, 36, 48, 60)
- Ability learning system
- Multiple view modes (Training, Battle, Log, Abilities, Learn, Gym)
- 4 modal components (Evolution, Inspiration, Pokeclock, Help)

**Special Requirement:** Many helper functions are defined in original App.jsx's component scope. These need to be either:

**Option A (Recommended):** Move to GameContext as context methods:
```javascript
// In GameContext.jsx, add these methods:
const performTraining = (stat) => { /* logic */ };
const performRest = () => { /* logic */ };
const resolveEvent = (effect) => { /* logic */ };
const startBattle = (opponent, isGymLeader) => { /* logic */ };
const generateTrainingOptions = () => { /* logic */ };
const learnMove = (moveName) => { /* logic */ };
const applyEvolution = (fromName, toName, toStage) => { /* logic */ };
```

**Option B:** Recreate all helper functions within CareerScreen component (creates large file but maintains locality)

**Files to Reference:**
- Original location: App.jsx lines 9628-10547
- Modal components: App.jsx lines 6881-7230
- Helper functions: Scattered throughout App.jsx in component scope
- Plan document: `CAREERSCREEN_EXTRACTION_PLAN.md`

---

### 2-5. Tournament Screens (~500 lines total)

**TournamentsScreen** (~130 lines)
- Location: App.jsx lines 7983-8115
- Tournament list with status, time remaining, player counts
- Uses: Trophy, Clock icons
- State: tournaments, tournamentsLoading, selectedTournament

**TournamentDetailsScreen** (~305 lines)
- Location: App.jsx lines 8118-8417
- Team selection (3 Pokemon from rosters)
- Entry submission
- Registered players list
- Uses: Trophy, Users icons
- State: selectedTournament, tournamentDetails, selectedTeam, userRosters

**TournamentBracketScreen** (~210 lines)
- Location: App.jsx lines 8422-8630
- Bracket visualization by rounds
- Match status display
- Watch replay button
- Uses: Trophy, Users icons
- State: tournamentBracket, selectedReplay

**TournamentReplayScreen** (~55 lines)
- Location: App.jsx lines 8633-8644
- Uses TournamentReplayViewer component (App.jsx lines 115-174, ~60 lines)
- Battle replay with playback controls
- Tick-by-tick state display
- State: selectedReplay

---

## 🎯 Completion Steps

### Step 1: Complete CareerScreen Extraction

**Approach A - Context Methods (Cleaner):**

1. Add helper methods to `GameContext.jsx`:
   - performTraining
   - performRest
   - resolveEvent
   - startBattle
   - generateTrainingOptions
   - learnMove
   - applyEvolution
   - (and any other career-specific functions)

2. Create `src/screens/CareerScreen.jsx`:
   - Import all helper methods from GameContext
   - Include 4 modals as internal components
   - Connect all UI to context methods

**Approach B - Self-Contained (Simpler):**

1. Create `src/screens/CareerScreen.jsx`:
   - Define all helper functions within component
   - Include 4 modals as internal components
   - Creates ~1200 line file but fully self-contained

### Step 2: Extract Tournament Screens

1. Create `src/screens/TournamentsScreen.jsx`
   - Extract lines 7983-8115 from App.jsx
   - Add necessary imports and context hooks

2. Create `src/screens/TournamentDetailsScreen.jsx`
   - Extract lines 8118-8417
   - Handle team selection logic

3. Create `src/screens/TournamentBracketScreen.jsx`
   - Extract lines 8422-8630
   - Implement bracket visualization

4. Create `src/screens/TournamentReplayScreen.jsx`
   - Extract TournamentReplayViewer component (lines 115-174)
   - Create wrapper screen (lines 8633-8644)

### Step 3: Integrate into App_NEW.jsx

Update `App_NEW.jsx`:

```javascript
// Add imports
import CareerScreen from './screens/CareerScreen';
import TournamentsScreen from './screens/TournamentsScreen';
import TournamentDetailsScreen from './screens/TournamentDetailsScreen';
import TournamentBracketScreen from './screens/TournamentBracketScreen';
import TournamentReplayScreen from './screens/TournamentReplayScreen';
import HistoryScreen from './screens/HistoryScreen';

// Update GameRouter
case 'career':
  return <CareerScreen />;

case 'history':
  return <HistoryScreen />;

case 'tournaments':
  return <TournamentsScreen />;

case 'tournamentDetails':
  return <TournamentDetailsScreen />;

case 'tournamentBracket':
  return <TournamentBracketScreen />;

case 'tournamentReplay':
  return <TournamentReplayScreen />;
```

### Step 4: Final Validation

1. **Remove PlaceholderScreen component** from App_NEW.jsx
2. **Test navigation flow:**
   - Menu → Pokemon Select → Inspiration → Support → Career
   - Career → Battle → Victory/GameOver/CareerEnd
   - Menu → Tournaments → Details → Bracket → Replay
   - Menu → My Pokemon/Supports/Trained
   - Menu → Gacha screens

3. **Verify GameContext methods:**
   - All career helper functions work
   - Battle state transitions correctly
   - Event system functions properly

4. **Test server integration:**
   - Inventory loads from server
   - Career saves/loads correctly
   - Battles process on server

### Step 5: Replace Original App.jsx

```bash
# Backup original
mv src/App.jsx src/App_OLD.jsx

# Activate new modular version
mv src/App_NEW.jsx src/App.jsx

# Test thoroughly before deleting App_OLD.jsx
```

---

## 📊 Metrics

### Before Transformation
- **App.jsx:** 11,086 lines (monolithic)
- **Maintainability:** Extremely difficult
- **Modular Components:** 0
- **Reusability:** Minimal

### After Transformation
- **App.jsx:** ~165 lines (routing only)
- **Screen Components:** 19 files (~200-300 lines each)
- **Total Modular Code:** ~4,300 lines across 19 files
- **Maintainability:** Excellent
- **Reusability:** High
- **Code Reduction:** 98.5% smaller main component

### Architecture Improvements
✅ Server-authoritative gameplay
✅ Mandatory authentication gate
✅ Separated concerns (Auth, Game, Inventory contexts)
✅ Reusable game utilities
✅ Shared game data module (125.91 KB)
✅ API service layer
✅ Backend battle simulator
✅ Database schema for inventories

---

## 🚨 Critical Notes

### CareerScreen Function Dependencies

The following functions from original App.jsx need handling:

**From component scope (need to move or recreate):**
- `performTraining(stat)` - Executes training action
- `performRest()` - Rest to restore energy
- `resolveEvent(effect)` - Apply event outcomes
- `startBattle(opponent, isGymLeader)` - Initialize battle
- `generateTrainingOptions()` - Create training choices per turn
- `learnMove(moveName)` - Learn new ability
- `applyEvolution(fromName, toName, toStage)` - Execute evolution
- `getSupportCardAttributes(supportKey)` - Get support details
- `getAptitudeColor(grade)` - Color mapping for aptitudes
- `generateTrainerSprite(gymIndex)` - Gym leader sprites

**Recommended Solution:**
Move these to GameContext as methods, making them available to all components that need them. This keeps CareerScreen clean and makes the functions reusable.

### Tournament Screen Dependencies

Tournament screens use these API calls:
- `apiGetTournaments()` - List all tournaments
- `apiGetTournamentDetails(id)` - Tournament info
- `apiGetTournamentBracket(id)` - Bracket data
- `apiEnterTournament(id, roster1, roster2, roster3)` - Submit entry
- `apiGetUserRosters()` - Trained Pokemon rosters

All these are already in `apiService.js` ✅

---

## 📁 File Structure (Final)

```
src/
├── App.jsx                    # ~165 lines (router only)
├── contexts/
│   ├── AuthContext.jsx        # Authentication
│   ├── GameContext.jsx        # Game state + career helpers
│   ├── InventoryContext.jsx   # Server inventories
│   └── AppProviders.jsx       # Provider wrapper
├── components/
│   ├── AuthModal.jsx          # Login/register
│   └── AuthWrapper.jsx        # Auth gate
├── screens/
│   ├── MenuScreen.jsx
│   ├── PokemonSelectionScreen.jsx
│   ├── InspirationSelectionScreen.jsx
│   ├── SupportSelectionScreen.jsx
│   ├── MyPokemonScreen.jsx
│   ├── MySupportScreen.jsx
│   ├── TrainedPokemonScreen.jsx
│   ├── GachaScreen.jsx
│   ├── SupportGachaScreen.jsx
│   ├── CareerScreen.jsx       # ~920 lines
│   ├── BattleScreen.jsx
│   ├── VictoryScreen.jsx
│   ├── GameOverScreen.jsx
│   ├── CareerEndScreen.jsx
│   ├── HistoryScreen.jsx
│   ├── TournamentsScreen.jsx
│   ├── TournamentDetailsScreen.jsx
│   ├── TournamentBracketScreen.jsx
│   └── TournamentReplayScreen.jsx
├── services/
│   └── apiService.js          # All API calls
├── utils/
│   └── gameUtils.jsx          # Helper functions
└── shared/
    └── gameData.js            # 125.91 KB game data
```

---

## 🎉 Success Criteria

Transformation is complete when:

✅ All 19 screens extracted and functional
✅ App.jsx reduced to < 200 lines (routing only)
✅ All game features work identically to original
✅ Server-authoritative model fully integrated
✅ No functionality lost or truncated
✅ Clean navigation between all screens
✅ Battle system works with server simulation
✅ Tournament system fully functional

---

## Next Actions

1. **Decide on CareerScreen approach:**
   - Option A: Move helpers to GameContext (cleaner, recommended)
   - Option B: Self-contained component (simpler, larger file)

2. **Extract remaining 5 screens**

3. **Integrate and test**

4. **Replace App.jsx**

5. **Celebrate! 🎉**

---

**Current Progress: 14/19 screens (73.7%)**
**Estimated Remaining Work: 2-3 hours for experienced developer**
**Complexity: High (CareerScreen), Medium (Tournaments)**

