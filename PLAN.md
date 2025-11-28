# PvP Matchmaking Mode Implementation Plan

## Overview
Add a matchmade PvP mode separate from tournaments where players submit a team of 3 trained Pokemon, get matched against players with similar ratings, and watch replays of server-simulated battles.

## Database Schema

### New Tables

```sql
-- Matchmaking queue table
CREATE TABLE IF NOT EXISTS pvp_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pokemon1_roster_id INTEGER NOT NULL REFERENCES pokemon_rosters(id) ON DELETE CASCADE,
    pokemon2_roster_id INTEGER NOT NULL REFERENCES pokemon_rosters(id) ON DELETE CASCADE,
    pokemon3_roster_id INTEGER NOT NULL REFERENCES pokemon_rosters(id) ON DELETE CASCADE,
    rating_at_queue INTEGER NOT NULL,
    queued_at TIMESTAMP DEFAULT NOW() NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' NOT NULL,
    CONSTRAINT unique_user_in_queue UNIQUE (user_id),
    CONSTRAINT status_check CHECK (status IN ('waiting', 'matched', 'completed'))
);

-- PvP match results table (extend existing pvp_matches)
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'quick';
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS is_ai_opponent BOOLEAN DEFAULT false;
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS player1_rating_change INTEGER;
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS player2_rating_change INTEGER;
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS battles_won_p1 INTEGER;
ALTER TABLE pvp_matches ADD COLUMN IF NOT EXISTS battles_won_p2 INTEGER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pvp_queue_user ON pvp_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_queue_rating ON pvp_queue(rating_at_queue);
CREATE INDEX IF NOT EXISTS idx_pvp_queue_status ON pvp_queue(status);
CREATE INDEX IF NOT EXISTS idx_pvp_queue_queued_at ON pvp_queue(queued_at);
```

## Backend API Endpoints

### 1. POST /api/pvp/queue - Join matchmaking queue
**Request:**
```json
{
  "pokemon1RosterId": 123,
  "pokemon2RosterId": 124,
  "pokemon3RosterId": 125
}
```
**Response:**
```json
{
  "queueId": 1,
  "position": 5,
  "estimatedWait": 30
}
```
**Logic:**
- Validate user owns all 3 rosters
- Check user not already in queue
- Insert into pvp_queue with current rating
- Return queue position

### 2. GET /api/pvp/queue/status - Check queue status
**Response (waiting):**
```json
{
  "status": "waiting",
  "position": 3,
  "queueTime": 25
}
```
**Response (matched):**
```json
{
  "status": "matched",
  "matchId": 456,
  "opponent": {
    "username": "Trainer123",
    "rating": 1050,
    "isAI": false
  }
}
```

### 3. DELETE /api/pvp/queue - Leave queue
**Response:**
```json
{
  "message": "Left matchmaking queue"
}
```

### 4. GET /api/pvp/match/:matchId - Get match results/replay
**Response:**
```json
{
  "matchId": 456,
  "player1": { "username": "You", "rating": 1000 },
  "player2": { "username": "Opponent", "rating": 1050, "isAI": false },
  "winner": "player1",
  "battlesWonP1": 2,
  "battlesWonP2": 1,
  "ratingChange": { "player1": +15, "player2": -15 },
  "battles": [
    { "winner": 1, "battleLog": [...] },
    { "winner": 2, "battleLog": [...] },
    { "winner": 1, "battleLog": [...] }
  ]
}
```

### 5. Background Job: Matchmaker (runs every 5 seconds)
**Logic:**
```
1. Get all waiting entries from pvp_queue ordered by queued_at
2. For each entry:
   a. Find opponent within rating range (starts at ±100, expands over time)
   b. Rating range expansion: ±100 + (seconds_in_queue * 2)
   c. If opponent found:
      - Mark both as 'matched'
      - Simulate 3 battles using battleSimulator
      - Record results in pvp_matches
      - Update both players' ratings (Elo)
      - Remove from queue
   d. If no opponent after 60 seconds:
      - Generate AI opponent with similar stats
      - Simulate battles
      - Record results (is_ai_opponent = true)
      - Only update player's rating (smaller change for AI: K=16 instead of K=32)
      - Remove from queue
```

### AI Opponent Generation
```javascript
function generateAIOpponent(playerRating, playerTeam) {
  // Calculate average stats from player's team
  const avgStats = calculateAverageStats(playerTeam);

  // Add variance based on rating difference from 1000
  const variance = Math.abs(playerRating - 1000) * 0.1;

  // Generate 3 AI pokemon with similar stats ±15%
  return [
    generateAIPokemon(avgStats, variance),
    generateAIPokemon(avgStats, variance),
    generateAIPokemon(avgStats, variance)
  ];
}
```

## Frontend Components

### 1. PvPScreen.jsx (New)
Main PvP hub screen with:
- Current rating display
- "Find Match" button
- Recent matches list
- Win/Loss record

### 2. PvPTeamSelectScreen.jsx (New)
Team selection screen:
- Grid of trained Pokemon (from TrainedPokemonScreen pattern)
- 3 selection slots
- "Enter Queue" button
- Back button

### 3. PvPQueueScreen.jsx (New)
Queue waiting screen:
- Timer showing time in queue
- Animated "Searching..." indicator
- Cancel button
- Auto-polls /api/pvp/queue/status every 2 seconds
- Transitions to PvPReplayScreen when matched

### 4. PvPReplayScreen.jsx (New)
Match replay viewer:
- Shows opponent info
- Plays 3 battles sequentially (reuse BattleScreen replay logic)
- Shows match result and rating change
- "Back to PvP" button

## Game State Flow
```
menu -> pvp -> pvpTeamSelect -> pvpQueue -> pvpReplay -> pvp
                    ^                           |
                    |___________________________|
```

## Implementation Order

### Phase 1: Database & Backend Core
1. Create migration for new tables
2. Implement queue endpoints (join, status, leave)
3. Implement matchmaker background job
4. Implement AI opponent generation
5. Implement match recording and Elo updates

### Phase 2: Frontend Screens
1. Create PvPScreen (main hub)
2. Create PvPTeamSelectScreen
3. Create PvPQueueScreen with polling
4. Create PvPReplayScreen (adapt from TournamentReplayScreen)
5. Add game states to GameContext
6. Add navigation from MenuScreen

### Phase 3: Polish
1. Add rating history display
2. Add match statistics
3. Add queue position estimates
4. Add sound effects for match found

## Technical Notes

### Elo Rating System
```javascript
const K_HUMAN = 32;  // K-factor for human opponents
const K_AI = 16;     // K-factor for AI opponents (smaller impact)

function calculateEloChange(playerRating, opponentRating, won, isAI) {
  const K = isAI ? K_AI : K_HUMAN;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const score = won ? 1 : 0;
  return Math.round(K * (score - expected));
}
```

### Matchmaking Rating Range
```javascript
function getRatingRange(secondsInQueue) {
  const baseRange = 100;
  const expansion = Math.floor(secondsInQueue * 2);
  const maxRange = 500;
  return Math.min(baseRange + expansion, maxRange);
}
```

### Best of 3 Battle Format
- Each player's Pokemon 1 vs opponent's Pokemon 1
- Each player's Pokemon 2 vs opponent's Pokemon 2
- Each player's Pokemon 3 vs opponent's Pokemon 3
- Winner is player who wins 2+ individual battles

## Files to Create/Modify

### New Files:
- `migrations/002_add_pvp_matchmaking.sql`
- `routes/pvp.js` (extend existing)
- `services/matchmaker.js` (new background service)
- `src/screens/PvPScreen.jsx`
- `src/screens/PvPTeamSelectScreen.jsx`
- `src/screens/PvPQueueScreen.jsx`
- `src/screens/PvPReplayScreen.jsx`

### Modified Files:
- `server.js` (start matchmaker service)
- `src/contexts/GameContext.jsx` (add game states)
- `src/screens/MenuScreen.jsx` (add PvP button)
- `src/services/apiService.js` (add PvP API calls)
