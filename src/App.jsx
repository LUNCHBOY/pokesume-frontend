import React, { useState, useEffect, useRef } from 'react';
import { Zap, Heart, Shield, Sparkles, Clock, Trophy, Users, Book, Swords, Wind, ShieldCheck } from 'lucide-react';

// Auth Modal Component - defined outside to prevent re-renders
const AuthModal = ({ 
  showAuth, 
  authMode, 
  authForm, 
  authError, 
  authLoading,
  onClose,
  onSubmit,
  onFormChange,
  onModeChange,
  ICONS
}) => {
  if (!showAuth) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-600">
            {authMode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="text-2xl">{ICONS.CLOSE}</span>
          </button>
        </div>

        {authError && (
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm font-bold">{authError}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={authForm.username}
              onChange={(e) => onFormChange('username', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              placeholder="Enter username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Enter email (optional)"
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => onFormChange('password', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              placeholder="Enter password"
              autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onModeChange}
            className="text-purple-600 hover:text-purple-700 font-bold text-sm"
          >
            {authMode === 'login' 
              ? "Don't have an account? Register" 
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Tournament Replay Viewer Component - extracted to fix hooks rules
const TournamentReplayViewer = ({ 
  selectedReplay, 
  setSelectedReplay, 
  setGameState,
  GAME_CONFIG,
  MOVES,
  ICONS
}) => {
  const battleResults = selectedReplay.battle_results ? JSON.parse(selectedReplay.battle_results) : null;
  
  const [replayTick, setReplayTick] = React.useState(0);
  const [replaySpeed, setReplaySpeed] = React.useState(1);
  const [isPlaying, setIsPlaying] = React.useState(true);
  
  const battleLog = battleResults?.battleLog || [];
  const maxTicks = battleLog.length;
  
  React.useEffect(() => {
    if (!isPlaying || replayTick >= maxTicks - 1) return;
    
    const timer = setTimeout(() => {
      setReplayTick(prev => Math.min(prev + 1, maxTicks - 1));
    }, GAME_CONFIG.BATTLE.TICK_DURATION_MS / replaySpeed);
    
    return () => clearTimeout(timer);
  }, [replayTick, isPlaying, maxTicks, replaySpeed, GAME_CONFIG.BATTLE.TICK_DURATION_MS]);
  
  if (!battleResults || !battleResults.battleLog) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">Battle data not available</p>
          <button
            onClick={() => {
              setSelectedReplay(null);
              setGameState('tournamentBracket');
            }}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
          >
            Back to Bracket
          </button>
        </div>
      </div>
    );
  }
  
  const currentState = battleLog[replayTick] || battleLog[0];
  
  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-600">Tournament Replay</h2>
          <button
            onClick={() => {
              setSelectedReplay(null);
              setGameState('tournamentBracket');
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition"
          >
            Back to Bracket
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{currentState.player1?.name || 'Player 1'}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>HP:</span>
                <span className="font-bold">{currentState.player1?.currentHp || 0}/{currentState.player1?.maxHp || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${((currentState.player1?.currentHp || 0) / (currentState.player1?.maxHp || 1)) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                Energy: {currentState.player1?.energy || 0}
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{currentState.player2?.name || 'Player 2'}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>HP:</span>
                <span className="font-bold">{currentState.player2?.currentHp || 0}/{currentState.player2?.maxHp || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${((currentState.player2?.currentHp || 0) / (currentState.player2?.maxHp || 1)) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                Energy: {currentState.player2?.energy || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 h-40 overflow-y-auto">
          <div className="text-sm space-y-1">
            {currentState.message && (
              <div className="font-bold text-purple-600">{currentState.message}</div>
            )}
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setReplayTick(0)}
              className="px-3 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600"
            >
              ⏮ Start
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={() => setReplayTick(maxTicks - 1)}
              className="px-3 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600"
            >
              ⏭ End
            </button>
            <select
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              className="px-3 py-2 border-2 border-gray-300 rounded font-bold"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Tick {replayTick + 1}/{maxTicks}</span>
              <span>{Math.round((replayTick / maxTicks) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxTicks - 1}
              value={replayTick}
              onChange={(e) => setReplayTick(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * POKEMON CAREER BATTLE GAME - v3.04
 * ============================================================================
 * 
 * CHANGELOG v3.04:
 * - Fixed React Hooks rules: moved tournament roster loading useEffect outside conditional
 * - Added tournament roster_id validation before submission
 * - Enhanced error logging for roster selection
 * - Log backend roster structure to debug missing roster_id field
 * 
 * CHANGELOG v3.04:
 * - Fixed React Hooks rules violations: extracted TournamentReplayViewer to separate component
 * - Resolved hooks being called conditionally
 * - Removed undefined TYPE_COLORS reference
 * 
 * CHANGELOG v3.02:
 * - Fixed syntax error: Escaped unicode \u2192 changed to actual → character
 * - This was causing crash on load in some environments
 * 
 * CHANGELOG v3.01:
 * - Added CSP-friendly fetch configuration (mode: 'cors')
 * - API_URL now supports environment variables (NEXT_PUBLIC_API_URL, REACT_APP_API_URL)
 * - Added Accept headers to all fetch requests
 * - Added console logging for API_URL to debug
 * - See CSP_FIX_GUIDE.md for hosting platform configuration
 * 
 * CHANGELOG v3.00:
 * - FIXED: Auth modal inputs now maintain focus while typing
 * - Moved AuthModal component outside main component (no more re-creation)
 * - Added helper functions: handleAuthFormChange, handleAuthClose, handleAuthModeChange
 * - AuthModal now receives props instead of using closures
 * - Login/Register buttons now work properly
 * - This was the React re-render issue - component was being recreated on every keystroke
 * 
 * CHANGELOG v2.99:
 * - Fixed input focus loss: used onInput with key props and prev state
 * - Fixed button clicks: added explicit onClick handler with debug logging
 * - Changed state updates to use functional form: prev => ({...prev})
 * - Added extensive console logging for debugging auth flow
 * - Check browser console for "[Auth]" messages to debug issues
 * 
 * CHANGELOG v2.98:
 * - Fixed auth modal input issues
 * - Inputs no longer lose focus while typing
 * - Login/Register buttons now properly close modal on success
 * - Added autoComplete attributes for better browser compatibility
 * - Improved error handling in auth flow
 * 
 * CHANGELOG v2.97:
 * - Tournament Battle Replay System
 * - "Watch Battle" button on completed tournament matches
 * - Full battle replay viewer with play/pause/restart controls
 * - Adjustable playback speed (0.5x, 1x, 2x, 4x)
 * - Progress bar for scrubbing through battle
 * - Reads battle log from server's battle_results
 * - Shows HP/Stamina bars, battle log, and match details
 * 
 * CHANGELOG v2.96:
 * - Auto-save rosters to backend on career completion
 * - Victory: roster saved with all stats, moves, aptitudes
 * - Defeat by gym: roster saved with final state
 * - Turn 60: roster saved when career times out
 * - Backend creates rosters for tournament entry
 * 
 * CHANGELOG v2.95:
 * - Email now optional for registration
 * - If no email provided, uses username@pokesume.local as default
 * - Register form shows "Email (Optional)" label
 * - Removed required attribute from email field
 * 
 * CHANGELOG v2.94:
 * - FIXED: Moved AuthModal definition before it's used (was causing crash)
 * - AuthModal now defined with other modal components at top of render section
 * - Removed duplicate AuthModal definition
 * - App should load properly now
 * 
 * CHANGELOG v2.93:
 * - FIXED: Auth modal now renders on menu screen
 * - Modal was only in final return statement which was unreachable
 * - Login/Register button now properly opens modal
 * 
 * CHANGELOG v2.92:
 * - Added console logging to auth functions for debugging
 * - Better error handling and display in auth flow
 * - Check browser console for detailed auth request/response logs
 * 
 * CHANGELOG v2.91:
 * - Added Login/Register UI Modal
 * - Login/Register button in top-right of home screen
 * - User display shows username and rating when logged in
 * - Logout button for authenticated users
 * - Auth modal with form validation
 * - Toggle between login and register modes
 * - Error display for auth failures
 * - Integrates with backend API (register/login endpoints)
 * 
 * CHANGELOG v2.90:
 * - Added Tournament Bracket Viewer (Part C complete!)
 * - Horizontal bracket display showing all rounds
 * - Color-coded match status (completed/active/upcoming)
 * - Highlights user's matches with purple ring
 * - Shows match scores (best-of-3)
 * - Round labels (Finals, Semifinals, Quarterfinals, etc)
 * - Auto-refreshes every 30 seconds
 * - Legend explaining status colors
 * 
 * CHANGELOG v2.89:
 * - FIXED: Tournament screen crash by moving useEffect hooks outside conditional render
 * - Hooks (useEffect) must be at component top level, not inside if statements
 * - Tournament list and details now load properly
 * 
 * CHANGELOG v2.88:
 * - Fixed tournament screen crash (moved useState to top level)
 * - Added Tournament Entry/Details screen (Part B)
 * - Select 3 trained Pokemon team for tournament
 * - Submit team entry to backend
 * - View registered players list
 * - Entry status indicator (registered/can enter/closed)
 * - Auto-refresh tournament details every 30 seconds
 * 
 * CHANGELOG v2.87:
 * - Added Tournament List screen
 * - Shows upcoming/active/completed tournaments
 * - Displays time until start, player count, status
 * - Auto-refreshes every 30 seconds
 * - Login required indicator for non-authenticated users
 * 
 * CHANGELOG v2.86:
 * - Added backend API integration for user authentication
 * - Added API utility functions for auth, roster management, PVP
 * - Backend URL: https://pokesume-backend-production.up.railway.app
 * - Auth system ready (login/register/logout)
 * - Roster sync ready (save career completions to server)
 * - PVP infrastructure ready (matchmaking, battle submission)
 * 
 * CHANGELOG v2.85:
 * - Added ALL grade multipliers (F through UU+, including + versions)
 * - Fixed potential bug with any Pokemon that reaches +grades (F+, E+, D+, C+, B+, A+, S+, UU+)
 * - All grades now have proper stamina cost multipliers in battles
 * 
 * CHANGELOG v2.84:
 * - FIXED MEWTWO BUG: Added UU and UU+ grades to APTITUDE.MULTIPLIERS
 * - UU grade multiplier: 1.25x, UU+ grade multiplier: 1.3x
 * - Mewtwo (and other UU grade Pokemon) can now attack in battles
 * 
 * CHANGELOG v2.83:
 * - Added extensive battle tick logging for Mewtwo
 * - Logs show: moveStates, available moves, stamina, cast chance per tick
 * - This will help diagnose why Mewtwo isn't attacking
 * 
 * CHANGELOG v2.82:
 * - Fixed clock emoji (ÃƒÂ¢Ã‚ÂÃ‚Â°) in pokeclock modal
 * - Added debug logging for Mewtwo battle initialization to diagnose attack issue
 * 
 * CHANGELOG v2.81:
 * - Fixed Mewtwo type: Normal ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Psychic
 * - Fixed Mewtwo starting moves: Tackle/ThunderShock ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ PsyBeam/Tackle  
 * - Fixed battle aptitude lookup bug: added PsychicÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢Purple, FightingÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢Orange type mappings
 * - Psychic and Fighting type Pokemon can now properly attack in battles
 * 
 * CHANGELOG v2.80:
 * - Fixed crash when inspiration modal triggers
 * - checkAndApplyInspiration now properly returns updatedStats and updatedAptitudes
 * - All inspiration calls updated to use new return structure
 * 
 * CHANGELOG v2.79:
 * - Fixed inspiration modal not triggering on inspiration turns (11, 23, 35, 47, 59)
 * - Inspiration modal now shows at start of turn before training generation
 * - Training now properly generates after inspiration modal is closed
 * 
 * CHANGELOG v2.78:
 * - Added safety checks in battle logic for undefined moves
 * - Added console error logging for missing moves to help debug Mewtwo attack issue
 * 
 * CHANGELOG v2.77:
 * - Fixed remaining em-dash corruption in flavor text strings
 * - All emojis verified: ÃƒÂ¢Ã…â€œÃ‚Â¨ sparkles, â˜… stars, ðŸ’¡ lightbulb, ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ arrow
 * 
 * CHANGELOG v2.76:
 * - Fixed sparkle emoji (ÃƒÂ¢Ã…â€œÃ‚Â¨) in inspiration modals (4 locations)
 * - Fixed arrow (ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢) in inspiration aptitude upgrade display
 * 
 * CHANGELOG v2.75:
 * - Fixed UTF-8 corruption in emoji characters
 * - Fixed lightbulb emoji (ðŸ’¡) in 4 locations
 * - Fixed star emoji (â˜…) preserved correctly
 * - Cleaned up corrupted text in old changelogs
 * 
 * CHANGELOG v2.74:
 * - HyperBeam stamina cost reduced: 85ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢65
 * 
 * CHANGELOG v2.73:
 * - HyperBeam stamina cost reduced: 105ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢85
 * - HyperBeam SP cost reduced: 95ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢80
 * 
 * CHANGELOG v2.72:
 * - Balance pass on Normal type abilities - reduced damage by 10-15% across all Normal moves
 * - Increased stamina/SP costs slightly on Normal moves to make them weaker than typed abilities
 * - Tackle: 8ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢7 dmg | QuickAttack: 12ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢10 dmg | BodySlam: 24ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢21 dmg, 40ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢42 stam, 30ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢35 cost
 * - ExtremeSpeed: 22ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢19 dmg | StoneEdge: 30ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢27 dmg | PlayRough: 27ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢24 dmg
 * - DoubleEdge: 38ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢34 dmg | HyperBeam: 42ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢38 dmg, 100ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢105 stam, 90ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢95 cost
 * 
 * CHANGELOG v2.71:
 * - New accounts now start with 5 common support cards
 * - Common supports: Whitney/Miltank, Chuck/Poliwrath, Pryce/Delibird, Wattson/Magneton, Flannery/Camerupt
 * 
 * CHANGELOG v2.70:
 * - Players can now start career with 0-5 support cards (was locked to 5)
 * - Begin Career button now always shows on support selection screen
 * 
 * CHANGELOG v2.69:
 * - New accounts no longer receive 5 random support cards on first launch
 * - New accounts start with empty support inventory
 * 
 * CHANGELOG v2.68:
 * - Added sorting options to inspiration select screen (Total Stars/By Stat/By Type)
 * - Star level sorting applies as secondary sort when using stat or type sorting
 * - Sort state resets when leaving inspiration select screen
 * 
 * CHANGELOG v2.67:
 * - Gym leader scaling increased by 10% (26.3% total boost, was 14.8%)
 * - Added Bibarel sprite
 * 
 * CHANGELOG v2.32:
 * - Added sorting options to Pokemon selection screen (Default/Name/Type/Rarity)
 * - Moved back button to upper right in Pokemon selection screen (matches My Pokemon)
 * - Moved back button to upper right in Support selection screen (matches My Supports)
 * - Removed ? Help button from Support selection screen
 * - Consistent white card header design across selection screens
 * 
 * CHANGELOG v2.31:
 * - Event battle rewards increased by 50% (stats and skill points)
 * - Abilities UI now sorts by type (alphabetically)
 * - Ability boxes now use type color for borders
 * - Ability type badges now use solid type color backgrounds (white text)
 * - Applies to both "Learn Abilities" and "Known Abilities" screens
 * 
 * CHANGELOG v2.30:
 * - Wild battles now require energy (disabled at 0 energy)
 * - Wild battle stat gains increased by 50% (10 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 15 per victory)
 * - Wild battles have 20% chance to grant move hint (logged in turn history)
 * - Event battles now scale with turn progression (same as wild pokemon)
 * - Event battle scaling combines turn multiplier with event difficulty
 * 
 * CHANGELOG v2.29:
 * - Added Inspirations system - Pokemon earn stat and aptitude inspirations on career completion
 * - Stat Inspiration: Randomly chooses 1 stat, 1-3 stars based on stat value (<200/200-300/>300)
 * - Aptitude Inspiration: Randomly chooses 1 aptitude, 1-3 stars based on grade (ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¤C/B/ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥A)
 * - Career completion screens now show full Pokemon details (stats, aptitudes, inspirations)
 * - Trained Pokemon inventory displays inspirations on each card
 * - Removed "Career History" button from menu (data shown in Trained Pokemon)
 * - All three career end states (victory/defeat/time limit) save inspirations
 * 
 * CHANGELOG v2.28:
 * - Added Primos display to Roll for Pokemon screen (top-left corner)
 * - Added Primos display to Roll for Supports screen (top-left corner)
 * 
 * CHANGELOG v2.27:
 * - Fixed Legendary rarity sorting (already correct at 0, highest priority)
 * - Added Rarity field to Pokemon info cards in My Pokemon screen
 * - Replaced Grade sorting with Rarity sorting in My Pokemon screen
 * - Created Trained Pokemon inventory system (separate from usable Pokemon)
 * - Trained Pokemon automatically saved when career ends (victory/defeat)
 * - Added "Trained Pokemon" button on home screen
 * - Trained Pokemon inventory supports sorting (date/grade/type) and filtering (grade)
 * - Fixed white screen bug by moving getRarityColor to global scope
 * 
 * CHANGELOG v2.26:
 * - Added filter options to My Pokemon screen (All/Fire/Water/Grass/Electric/Psychic/Fighting/Normal)
 * - Added filter options to My Supports screen (All/Legendary/Rare/Uncommon/Common)
 * - Filter buttons use type colors for Pokemon, rarity colors for Supports
 * 
 * CHANGELOG v2.25:
 * - Updated My Supports screen to match My Pokemon layout
 * - Back button and sort buttons now in white card header (same style as My Pokemon)
 * - Sort options: Rarity and Type (matching inventory screen)
 * - Consistent UI across all inventory screens
 * 
 * CHANGELOG v2.24:
 * - Primos display now only shows on home screen
 * - Removed Primos counter from Pokemon selection, Support selection, My Pokemon, My Supports, and Gacha screens
 * - Cleaner UI on non-menu screens
 * 
 * CHANGELOG v2.23:
 * - Added sort options to Support selection screen (Rarity/Type)
 * - Support cards can now be sorted by stat focus type (HP/Attack/Defense/Instinct/Speed)
 * - Active sort button highlighted in yellow
 * 
 * CHANGELOG v2.22:
 * - Added back button to Pokemon selection (returns to home screen)
 * - Added back button to Support selection (returns to Pokemon selection)
 * - Support cards now auto-sort by rarity (Legendary > Rare > Uncommon > Common)
 * 
 * CHANGELOG v2.21:
 * - Fixed warning emoji in Reset button
 * - Fixed bell emoji corruption
 * - Fixed em-dashes in flavor text
 * 
 * CHANGELOG v2.20:
 * - ICONS now use Unicode escape sequences
 * - Prevents UTF-8 corruption during file operations
 * 
 * CHANGELOG v2.19:
 * - Fixed white screen: mySupports missing closing tags
 * - UTF-8 characters left as-is (will be handled by browser)
 * - Added automated integrity check scripts
 * 
 * CHANGELOG v2.17:
 * - Removed SUPPORT_POKEMON concept - all supports are now Support Cards
 * - Support cards now have all training attributes (baseStatIncrease, friendship, bonuses, appearance)
 * - Added getSupportCardAttributes() helper function with rarity-based defaults
 * - Updated My Supports screen to show all relevant effects and training info
 * - Updated Support Selection screen to show complete card details
 * - Displays: base stats, training bonuses, friendship, appearance rate, special effects
 * 
 * CHANGELOG v2.26:
 * - Added filter options to My Pokemon screen (All/Fire/Water/Grass/Electric/Psychic/Fighting/Normal)
 * - Added filter options to My Supports screen (All/Legendary/Rare/Uncommon/Common)
 * - Filter buttons use type colors for Pokemon, rarity colors for Supports
 * - Confirmed Legendary is highest sort (order: 0) for support cards
 * 
 * CHANGELOG v2.25:
 * - Updated My Supports screen to match My Pokemon layout
 * - Back button and sort buttons now in white card header (same style as My Pokemon)
 * - Sort options: Rarity and Type (matching inventory screen)
 * - Consistent UI across all inventory screens
 * 
 * CHANGELOG v2.24:
 * - Primos display now only shows on home screen
 * - Removed Primos counter from Pokemon selection, Support selection, My Pokemon, My Supports, and Gacha screens
 * - Cleaner UI on non-menu screens
 * 
 * CHANGELOG v2.23:
 * - Added sort options to Support selection screen (Rarity/Type)
 * - Support cards can now be sorted by stat focus type (HP/Attack/Defense/Instinct/Speed)
 * - Active sort button highlighted in yellow
 * 
 * CHANGELOG v2.22:
 * - Added back button to Pokemon selection (returns to home screen)
 * - Added back button to Support selection (returns to Pokemon selection)
 * - Support cards now auto-sort by rarity (Legendary > Rare > Uncommon > Common)
 * 
 * CHANGELOG v2.21:
 * - Fixed warning emoji in Reset button
 * - Fixed bell emoji corruption
 * - Fixed em-dashes in flavor text
 * 
 * CHANGELOG v2.20:
 * - ICONS now use Unicode escape sequences
 * - Prevents UTF-8 corruption during file operations
 * 
 * CHANGELOG v2.19:
 * - Fixed white screen: mySupports missing closing tags
 * - UTF-8 characters left as-is (will be handled by browser)
 * - Added automated integrity check scripts
 * 
 * CHANGELOG v2.17:
 * - Reordered home screen menu for better UX
 * - Menu order: Start Career > My Pokemon > My Supports > Roll Pokemon > Roll Supports > History
 * 
 * CHANGELOG v2.15:
 * - Added sort functionality to Pokemon inventory (default, name, type, grade)
 * - Enhanced support card display with complete details in selection screen
 * - Support cards now show all effects including training bonuses, initial friendship
 * - Separated support pokemon and support cards sections in selection
 * - Improved support inventory display with detailed effect breakdowns
 * - Fixed all UTF-8 character encoding issues (icons now display correctly)
 * - Added version number display (v2.15) in bottom-right corner of home screen
 * 
 * CHANGELOG v2.14:
 * - Fixed all support card names (added trainer & pokemon fields)
 * - Reduced support card bonuses from 5 stats to 2 stats per card
 * - Rebalanced stat bonuses to be more focused and impactful
 * 
 * CHANGELOG v2.13:
 * - Added Fighting type (orange color)
 * - Changed Poison type to Psychic type
 * - Updated type matchup system (Fighting > Electric, Psychic > Fighting, Psychic > Psychic, Fighting > Normal)
 * - Re-typed appropriate Pokemon as Fighting type
 * - Added Fighting type aptitudes to all Pokemon
 * - Added Fighting type moves (6 new moves)
 * - Focused support bonuses on 1-2 stats
 * - Added type and detailed effects display to support inventory
 * 
 * CHANGELOG v2.12:
 * - Added 50 new basic Pokemon with evolutions (including Klefki)
 * - Added 20 new moves with status effects
 * - Added Support Card system (trainer + iconic Pokemon pairs)
 * - Added 30 Support Cards with unique effects
 * - Added Support Gacha system
 * - Players receive 5 random supports on first launch
 * - Expanded gacha pool with new Pokemon
 * 
 * CHANGELOG v2.11:
 * - Added Mew, Mewtwo, Snorlax with sprites
 * - Added base stats display in Pokemon inventory
 * - Fixed Hyper Beam self-exhaust preventing casting
 * - Added Pokeclock system (3 retries per run)
 * - Reduced training failure curve by ~10%
 * - Speed training: 50% lower fail rate, no stat penalty on fail
 * - Changed display from "Success Rate" to "Fail Rate"
 * - Fixed energy cost calculation bug with support Pokemon
 * 
 * STRUCTURE:
 * 1. Constants & Configuration
 *    - UTF-8 Icons
 *    - Evolution Config
 *    - Game Config
 *    - Type Matchups
 * 
 * 2. Game Data
 *    - Moves Database
 *    - Pokemon Database
 *    - Support Pokemon
 *    - Gacha Pools
 *    - Random Events
 * 
 * 3. React Component
 *    - State Management
 *    - Game Logic Functions
 *    - UI Rendering
 * 
 * ========================================================================== */


/* ============================================================================
 * DEVELOPER GUIDE
 * ============================================================================
 * 
 * ADDING NEW POKEMON:
 * 1. Add evolution chain to EVOLUTION_CHAINS (if applicable)
 * 2. Add Pokemon entry to POKEMON object with:
 *    - name, primaryType, baseStats, typeAptitudes, strategy
 *    - defaultAbilities, learnableAbilities
 * 3. Add sprite to generatePokemonSprite() function
 * 
 * ADDING NEW MOVES:
 * 1. Add to MOVES object with: type, damage, warmup, cooldown, stamina, cost
 * 2. Add effect object if move has special effects
 * 3. Effect types: burn, poison, paralyze, stun, soak, energize, exhaust
 * 
 * BALANCING STATS:
 * - Base Pokemon (2 evolutions): ~300 total stats
 * - Base Pokemon (1 evolution): ~350 total stats
 * - Base Pokemon (no evolution): ~400 total stats
 * - Legendary Pokemon: ~425 total stats
 * - Evolution boosts: 5% for 2-stage, 10% for 1-stage
 * 
 * ADDING SUPPORT POKEMON:
 * 1. Add to SUPPORT_POKEMON with stat bonuses and training multipliers
 * 2. Set appearanceChance (0.0-1.0) and typeAppearancePriority
 * 
 * MODIFYING GAME BALANCE:
 * - Edit GAME_CONFIG for training costs, energy, battle mechanics
 * - Adjust TYPE_MATCHUPS for type advantage multipliers
 * - Modify EVOLUTION_CONFIG for evolution requirements
 * 
 * UTF-8 CHARACTERS:
 * - Always use ICONS constants, never hardcode special characters
 * - This prevents encoding corruption during file operations
 * 
 * ========================================================================== */



// ============================================================================
// SECTION 1: CONSTANTS & CONFIGURATION
// ============================================================================

// ===== UTF-8 SPECIAL CHARACTERS =====
// Define as constants to prevent encoding corruption during file operations
const ICONS = {
  SLEEPING: '\u{1F4A4}',
  CHECKMARK: '\u2713',
  CHECK: '\u2713',
  ARROW_RIGHT: '\u2192',
  ARROW_DOUBLE: '\u21D2',
  MULTIPLY: '\u00D7',
  BULLET: '\u2022',
  WARNING: '\u26A0\uFE0F',
  CLOSE: '\u00D7'
};

// ===== EVOLUTION CONFIGURATION =====
// ===== EVOLUTION CONFIGURATION =====
const EVOLUTION_CONFIG = {
  GRADE_REQUIREMENTS: {
    STAGE_1: 'C',  // Evolve to stage 1 at C grade (800 total stats)
    STAGE_2: 'A'   // Evolve to stage 2 at A grade (1200 total stats)
  },
  STAT_BOOST: {
    TWO_STAGE: 0.05,  // 5% boost for Pokemon that evolve twice (per evolution)
    ONE_STAGE: 0.10   // 10% boost for Pokemon that evolve once
  },
  BASE_STAT_MULTIPLIERS: {
    NO_EVOLUTION: 1.30,    // 30% stronger - Pokemon that never evolve
    ONE_EVOLUTION: 1.15,   // 15% stronger - Pokemon that evolve once
    TWO_EVOLUTIONS: 1.00   // Base strength - Pokemon that evolve twice
  }
};

// Evolution chains: maps base Pokemon to their evolution stages
// ===== EVOLUTION CHAINS =====
// Maps base Pokemon to their evolution forms
// Format: 'BaseName': { stage1: 'Stage1Name', stage2: 'Stage2Name', stages: X }
const EVOLUTION_CHAINS = {
  // Two-stage evolutions
  'Charmander': { stage1: 'Charmeleon', stage2: 'Charizard', stages: 2 },
  'Squirtle': { stage1: 'Wartortle', stage2: 'Blastoise', stages: 2 },
  'Bulbasaur': { stage1: 'Ivysaur', stage2: 'Venusaur', stages: 2 },
  'Caterpie': { stage1: 'Metapod', stage2: 'Butterfree', stages: 2 },
  'Weedle': { stage1: 'Kakuna', stage2: 'Beedrill', stages: 2 },
  'Pidgey': { stage1: 'Pidgeotto', stage2: 'Pidgeot', stages: 2 },
  'Rattata': { stage1: 'Raticate', stage2: null, stages: 1 },
  'Spearow': { stage1: 'Fearow', stage2: null, stages: 1 },
  'Ekans': { stage1: 'Arbok', stage2: null, stages: 1 },
  'Sandshrew': { stage1: 'Sandslash', stage2: null, stages: 1 },
  'Nidoran\u2640': { stage1: 'Nidorina', stage2: 'Nidoqueen', stages: 2 },
  'Nidoran\u2642': { stage1: 'Nidorino', stage2: 'Nidoking', stages: 2 },
  'Vulpix': { stage1: 'Ninetales', stage2: null, stages: 1 },
  'Zubat': { stage1: 'Golbat', stage2: null, stages: 1 },
  'Oddish': { stage1: 'Gloom', stage2: 'Vileplume', stages: 2 },
  'Paras': { stage1: 'Parasect', stage2: null, stages: 1 },
  'Venonat': { stage1: 'Venomoth', stage2: null, stages: 1 },
  'Diglett': { stage1: 'Dugtrio', stage2: null, stages: 1 },
  'Meowth': { stage1: 'Persian', stage2: null, stages: 1 },
  'Psyduck': { stage1: 'Golduck', stage2: null, stages: 1 },
  'Mankey': { stage1: 'Primeape', stage2: null, stages: 1 },
  'Growlithe': { stage1: 'Arcanine', stage2: null, stages: 1 },
  'Poliwag': { stage1: 'Poliwhirl', stage2: 'Poliwrath', stages: 2 },
  'Abra': { stage1: 'Kadabra', stage2: 'Alakazam', stages: 2 },
  'Machop': { stage1: 'Machoke', stage2: 'Machamp', stages: 2 },
  'Bellsprout': { stage1: 'Weepinbell', stage2: 'Victreebel', stages: 2 },
  'Tentacool': { stage1: 'Tentacruel', stage2: null, stages: 1 },
  'Geodude': { stage1: 'Graveler', stage2: 'Golem', stages: 2 },
  'Ponyta': { stage1: 'Rapidash', stage2: null, stages: 1 },
  'Magnemite': { stage1: 'Magneton', stage2: null, stages: 1 },
  'Doduo': { stage1: 'Dodrio', stage2: null, stages: 1 },
  'Seel': { stage1: 'Dewgong', stage2: null, stages: 1 },
  'Grimer': { stage1: 'Muk', stage2: null, stages: 1 },
  'Shellder': { stage1: 'Cloyster', stage2: null, stages: 1 },
  'Gastly': { stage1: 'Haunter', stage2: 'Gengar', stages: 2 },
  'Drowzee': { stage1: 'Hypno', stage2: null, stages: 1 },
  'Krabby': { stage1: 'Kingler', stage2: null, stages: 1 },
  'Voltorb': { stage1: 'Electrode', stage2: null, stages: 1 },
  'Cubone': { stage1: 'Marowak', stage2: null, stages: 1 },
  'Koffing': { stage1: 'Weezing', stage2: null, stages: 1 },
  'Rhyhorn': { stage1: 'Rhydon', stage2: null, stages: 1 },
  'Horsea': { stage1: 'Seadra', stage2: null, stages: 1 },
  'Goldeen': { stage1: 'Seaking', stage2: null, stages: 1 },
  'Staryu': { stage1: 'Starmie', stage2: null, stages: 1 },
  'Magikarp': { stage1: 'Gyarados', stage2: null, stages: 1 },
  'Eevee': { stage1: 'Vaporeon', stage2: null, stages: 1 },
  'Omanyte': { stage1: 'Omastar', stage2: null, stages: 1 },
  'Kabuto': { stage1: 'Kabutops', stage2: null, stages: 1 },
  'Dratini': { stage1: 'Dragonair', stage2: 'Dragonite', stages: 2 },
  
  // Gen 2-6 Two-Stage Evolutions
  'Cyndaquil': { stage1: 'Quilava', stage2: 'Typhlosion', stages: 2 },
  'Totodile': { stage1: 'Croconaw', stage2: 'Feraligatr', stages: 2 },
  'Chikorita': { stage1: 'Bayleef', stage2: 'Meganium', stages: 2 },
  'Torchic': { stage1: 'Combusken', stage2: 'Blaziken', stages: 2 },
  'Mudkip': { stage1: 'Marshtomp', stage2: 'Swampert', stages: 2 },
  'Treecko': { stage1: 'Grovyle', stage2: 'Sceptile', stages: 2 },
  'Piplup': { stage1: 'Prinplup', stage2: 'Empoleon', stages: 2 },
  'Turtwig': { stage1: 'Grotle', stage2: 'Torterra', stages: 2 },
  'Chimchar': { stage1: 'Monferno', stage2: 'Infernape', stages: 2 },
  'Tepig': { stage1: 'Pignite', stage2: 'Emboar', stages: 2 },
  'Oshawott': { stage1: 'Dewott', stage2: 'Samurott', stages: 2 },
  'Snivy': { stage1: 'Servine', stage2: 'Serperior', stages: 2 },
  
  // Gen 2-6 One-Stage Evolutions
  'Klefki': { stage1: 'Klefking', stage2: null, stages: 1 },
  'Sneasel': { stage1: 'Weavile', stage2: null, stages: 1 },
  'Murkrow': { stage1: 'Honchkrow', stage2: null, stages: 1 },
  'Gligar': { stage1: 'Gliscor', stage2: null, stages: 1 },
  'Yanma': { stage1: 'Yanmega', stage2: null, stages: 1 },
  'Snorunt': { stage1: 'Glalie', stage2: null, stages: 1 },
  'Spheal': { stage1: 'Sealeo', stage2: null, stages: 1 },
  'Aron': { stage1: 'Lairon', stage2: null, stages: 1 },
  'Ralts': { stage1: 'Kirlia', stage2: null, stages: 1 },
  'Shinx': { stage1: 'Luxio', stage2: null, stages: 1 },
  'Starly': { stage1: 'Staravia', stage2: null, stages: 1 },
  'Bidoof': { stage1: 'Bibarel', stage2: null, stages: 1 },
  'Buneary': { stage1: 'Lopunny', stage2: null, stages: 1 },
  'Glameow': { stage1: 'Purugly', stage2: null, stages: 1 },
  'Stunky': { stage1: 'Skuntank', stage2: null, stages: 1 },
  'Croagunk': { stage1: 'Toxicroak', stage2: null, stages: 1 },
  'Purrloin': { stage1: 'Liepard', stage2: null, stages: 1 },
  'Patrat': { stage1: 'Watchog', stage2: null, stages: 1 },
  'Lillipup': { stage1: 'Herdier', stage2: null, stages: 1 },
  'Roggenrola': { stage1: 'Boldore', stage2: null, stages: 1 },
  'Tympole': { stage1: 'Palpitoad', stage2: null, stages: 1 },
  'Venipede': { stage1: 'Whirlipede', stage2: null, stages: 1 },
  'Sandile': { stage1: 'Krokorok', stage2: null, stages: 1 },
  'Dwebble': { stage1: 'Crustle', stage2: null, stages: 1 },
  'Scraggy': { stage1: 'Scrafty', stage2: null, stages: 1 },
  'Gothita': { stage1: 'Gothorita', stage2: null, stages: 1 },
  'Fletchling': { stage1: 'Fletchinder', stage2: null, stages: 1 },
  'Litleo': { stage1: 'Pyroar', stage2: null, stages: 1 },
  'Skiddo': { stage1: 'Gogoat', stage2: null, stages: 1 },
  'Pancham': { stage1: 'Pangoro', stage2: null, stages: 1 },
  'Honedge': { stage1: 'Doublade', stage2: null, stages: 1 },
  'Inkay': { stage1: 'Malamar', stage2: null, stages: 1 },
  'Binacle': { stage1: 'Barbaracle', stage2: null, stages: 1 },
  'Skrelp': { stage1: 'Dragalge', stage2: null, stages: 1 },
  'Helioptile': { stage1: 'Heliolisk', stage2: null, stages: 1 },
  'Tyrunt': { stage1: 'Tyrantrum', stage2: null, stages: 1 },
  'Amaura': { stage1: 'Aurorus', stage2: null, stages: 1 },
  'Goomy': { stage1: 'Sliggoo', stage2: null, stages: 1 },
  'Noibat': { stage1: 'Noivern', stage2: null, stages: 1 }
};


// ===== TYPE SYSTEM =====
// Primary Types: Fire, Water, Grass, Electric, Psychic, Normal, Fighting
// Type Aptitudes: S > A > B > C > D > E > F
// Grade System: UU+ > UU > S+ > S > A+ > A > B+ > B > C+ > C > D+ > D > E+ > E

// ===== GAME CONFIGURATION =====
// Core game mechanics and balance settings
const GAME_CONFIG = {
  CAREER: {
    TOTAL_TURNS: 60,
    GYM_LEADER_INTERVAL: 12,
    STARTING_ENERGY: 100,
    MAX_ENERGY: 100
  },
  TRAINING: {
    ENERGY_COSTS: { HP: 25, Attack: 30, Defense: 20, Instinct: 25, Speed: -5 },
    FAILURE_CHANCE_AT_ZERO_ENERGY: 0.99,
    BASE_STAT_GAINS: { HP: 15, Attack: 10, Defense: 10, Instinct: 7, Speed: 5 },
    SKILL_POINTS_ON_SUCCESS: 3,
    STAT_LOSS_ON_FAILURE: 2,
    FRIENDSHIP_GAIN_PER_TRAINING: 7
  },
  REST: {
    ENERGY_GAINS: [30, 50, 70],
    PROBMOVES: [0.2, 0.6, 0.2]
  },
  BATTLE: {
    TICK_DURATION_MS: 1000,
    BASE_REST_STAMINA_GAIN: 1,
    SPEED_STAMINA_DENOMINATOR: 15,
    MAX_STAMINA: 100,
    BASE_DODGE_CHANCE: 0.01,
    INSTINCT_DODGE_DENOMINATOR: 2786,
    BASE_CRIT_CHANCE: 0.05,
    INSTINCT_CRIT_DENOMINATOR: 800,
    WIN_STAT_GAIN: 5,
    WIN_SKILL_POINTS: 10
  },
  APTITUDE: {
    MULTIPLIERS: { 
      'F': 0.6, 'F+': 0.65,
      'E': 0.7, 'E+': 0.75, 
      'D': 0.8, 'D+': 0.85,
      'C': 0.9, 'C+': 0.95,
      'B': 1.0, 'B+': 1.05,
      'A': 1.1, 'A+': 1.15,
      'S': 1.2, 'S+': 1.225,
      'UU': 1.25, 'UU+': 1.3 
    }
  },
  STRATEGY: {
    Nuker: { warmup_mult: 0.6, cooldown_mult: 1.4 },
    Balanced: { warmup_mult: 0.9, cooldown_mult: 0.9 },
    Scaler: { warmup_mult: 1.4, cooldown_mult: 0.6 }
  },
  TYPE_MATCHUPS: {
    Red: { strong: 'Grass', weak: 'Water' },
    Blue: { strong: 'Fire', weak: 'Grass' },
    Green: { strong: 'Water', weak: 'Fire' },
    Yellow: { strong: 'Psychic', weak: 'Psychic' },
    Purple: { strong: 'Fighting', weak: 'Psychic' },
    Orange: { strong: 'Electric', weak: 'Psychic' }
  },
  MOVES: {
    BASE_COST_MULTIPLIER: 3.0,
    HINT_DISCOUNT: 0.15,
    MAX_HINT_DISCOUNT: 0.60
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Returns the color hex code for a given Pokemon type
 * Used for UI theming and visual consistency
 */
const getTypeColor = (type) => {
  const colors = { 
    Red: '#dc2626', 
    Blue: '#2563eb', 
    Green: '#16a34a', 
    Purple: '#9333ea', 
    Yellow: '#ca8a04',
    Orange: '#f97316',
    Colorless: '#6b7280',
    Fire: '#dc2626',
    Water: '#2563eb',
    Grass: '#16a34a',
    Psychic: '#9333ea',
    Electric: '#ca8a04',
    Fighting: '#f97316',
    Normal: '#6b7280'
  };
  return colors[type] || '#6b7280';
};

const getAptitudeColor = (grade) => {
  const colors = {
    F: '#000000',
    E: '#9ca3af',
    D: '#3b82f6',
    C: '#22c55e',
    B: '#ec4899',
    A: '#f97316',
    S: '#eab308'
  };
  return colors[grade] || '#6b7280';
};

/**
 * Calculates Pokemon grade based on total stats
 * Grade determines evolution thresholds and overall power level
 * @param stats - Pokemon stat object {HP, Attack, Defense, Instinct, Speed}
 * @returns Grade string (E, D, C, B, A, S, UU, etc.)
 */
const getPokemonGrade = (stats) => {
  const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0);
  
  if (totalStats >= 1900) return 'UU+';
  if (totalStats >= 1800) return 'UU';
  if (totalStats >= 1700) return 'S+';
  if (totalStats >= 1600) return 'S';
  if (totalStats >= 1500) return 'A+';
  if (totalStats >= 1400) return 'A';
  if (totalStats >= 1300) return 'B+';
  if (totalStats >= 1200) return 'B';
  if (totalStats >= 1100) return 'C+';
  if (totalStats >= 1000) return 'C';
  if (totalStats >= 900) return 'D+';
  if (totalStats >= 800) return 'D';
  if (totalStats >= 700) return 'E+';
  if (totalStats >= 600) return 'E';
  if (totalStats >= 500) return 'F+';
  return 'F';
};

/**
 * Returns the rarity of a Pokemon based on evolution potential
 */
const getPokemonRarity = (pokemonName) => {
  // Check if it's a legendary (no evolution, special Pokemon)
  const legendary = ['Moltres', 'Articuno', 'Celebi', 'Raikou', 'Gengar', 'Entei', 'Suicune', 
                     'Mew', 'Mewtwo', 'Snorlax', 'Lapras', 'Aerodactyl', 'Ditto'];
  if (legendary.includes(pokemonName)) return 'Legendary';
  
  // Check evolution chain
  const evolutionData = Object.entries(EVOLUTION_CHAINS).find(([base, data]) => {
    return base === pokemonName || data.stage1 === pokemonName || data.stage2 === pokemonName;
  });
  
  if (!evolutionData) return 'Common'; // No evolution chain = common
  
  const [baseName, chainData] = evolutionData;
  
  // If it's a fully evolved Pokemon from a 2-stage chain
  if (chainData.stages === 2 && chainData.stage2 === pokemonName) return 'Rare';
  
  // If it's a fully evolved Pokemon from a 1-stage chain
  if (chainData.stages === 1 && chainData.stage1 === pokemonName) return 'Uncommon';
  
  // Base stage or middle stage
  return 'Common';
};

/**
 * Generates inspirations for a completed career Pokemon
 * Returns object with stat inspiration and attack aptitude inspiration
 */
const generateInspirations = (stats, aptitudes) => {
  try {
    console.log('[generateInspirations] Called with:', { stats, aptitudes });
    
    if (!stats || !aptitudes) {
      console.error('[generateInspirations] Missing required parameters:', { stats, aptitudes });
      return null;
    }
    
    // Color to type name mapping
    const colorToType = {
      'Red': 'Fire',
      'Blue': 'Water',
      'Green': 'Grass',
      'Purple': 'Psychic',
      'Yellow': 'Electric',
      'Orange': 'Fighting'
    };
    
    // Generate Stat Inspiration
    const statNames = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];
    const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
    const statValue = stats[randomStat];
    
    if (statValue === undefined) {
      console.error('[generateInspirations] Stat value undefined for:', randomStat, stats);
      return null;
    }
    
    let statStars = 1;
    const statRoll = Math.random();
    
    if (statValue < 200) {
      statStars = statRoll < 0.90 ? 1 : 2;
    } else if (statValue <= 300) {
      if (statRoll < 0.50) statStars = 1;
      else if (statRoll < 0.95) statStars = 2;
      else statStars = 3;
    } else {
      if (statRoll < 0.20) statStars = 1;
      else if (statRoll < 0.90) statStars = 2;
      else statStars = 3;
    }
    
    // Generate Attack Aptitude Inspiration
    const aptitudeKeys = Object.keys(aptitudes);
    if (aptitudeKeys.length === 0) {
      console.error('[generateInspirations] No aptitude keys found:', aptitudes);
      return null;
    }
    
    const randomAptitude = aptitudeKeys[Math.floor(Math.random() * aptitudeKeys.length)];
    const aptitudeGrade = aptitudes[randomAptitude];
    
    if (!aptitudeGrade) {
      console.error('[generateInspirations] Aptitude grade undefined for:', randomAptitude, aptitudes);
      return null;
    }
    
    let aptitudeStars = 1;
    const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const aptitudeIndex = aptitudeOrder.indexOf(aptitudeGrade);
    
    if (aptitudeIndex <= 3) { // F, E, D, C
      aptitudeStars = 1;
    } else if (aptitudeIndex === 4) { // B
      aptitudeStars = 2;
    } else { // A, S
      aptitudeStars = 3;
    }
    
    const result = {
      stat: {
        name: randomStat,
        value: statValue,
        stars: statStars
      },
      aptitude: {
        name: colorToType[randomAptitude] || randomAptitude, // Convert color to type name
        color: randomAptitude, // Keep the color key for lookups
        grade: aptitudeGrade,
        stars: aptitudeStars
      }
    };
    
    console.log('[generateInspirations] Generated:', result);
    return result;
  } catch (error) {
    console.error('[generateInspirations] Error:', error, { stats, aptitudes });
    return null;
  }
};

/**
 * Check if inspiration should trigger on current turn and apply effects
 */
const checkAndApplyInspiration = (turn, selectedInspirations, currentStats, currentAptitudes) => {
  const inspirationTurns = [11, 23, 35, 47, 59];
  
  console.log('[checkAndApplyInspiration] Turn:', turn, 'Selected:', selectedInspirations?.length);
  
  if (!inspirationTurns.includes(turn) || !selectedInspirations || selectedInspirations.length === 0) {
    console.log('[checkAndApplyInspiration] Skipping - not inspiration turn or no selections');
    return null;
  }
  
  console.log('[checkAndApplyInspiration] Processing inspirations for turn', turn);
  
  // Color to type name mapping
  const colorToType = {
    'Red': 'Fire',
    'Blue': 'Water',
    'Green': 'Grass',
    'Purple': 'Psychic',
    'Yellow': 'Electric',
    'Orange': 'Fighting'
  };
  
  const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
  
  // Create copies to mutate
  const updatedStats = { ...currentStats };
  const updatedAptitudes = { ...currentAptitudes };
  
  const inspirationResults = selectedInspirations
    .filter(insp => insp && insp.inspirations)
    .map(trainedPokemon => {
      const statInsp = trainedPokemon.inspirations.stat;
      const aptInsp = trainedPokemon.inspirations.aptitude;
      
      const result = {
        pokemonName: trainedPokemon.name,
        statBonus: null,
        aptitudeUpgrade: null
      };
      
      // Apply stat bonus
      if (statInsp && statInsp.name && statInsp.stars) {
        const statBonus = statInsp.stars === 1 ? 10 : statInsp.stars === 2 ? 25 : 50;
        updatedStats[statInsp.name] = (updatedStats[statInsp.name] || 0) + statBonus;
        result.statBonus = {
          stat: statInsp.name,
          amount: statBonus,
          stars: statInsp.stars
        };
      }
      
      // Check for aptitude upgrade
      if (aptInsp && aptInsp.color && aptInsp.stars) {
        const upgradeChance = aptInsp.stars === 1 ? 0.03 : aptInsp.stars === 2 ? 0.10 : 0.20;
        if (Math.random() < upgradeChance) {
          const currentGrade = updatedAptitudes[aptInsp.color];
          const currentIndex = aptitudeOrder.indexOf(currentGrade);
          if (currentIndex < aptitudeOrder.length - 1) { // Not already S
            const newGrade = aptitudeOrder[currentIndex + 1];
            updatedAptitudes[aptInsp.color] = newGrade;
            result.aptitudeUpgrade = {
              type: colorToType[aptInsp.color] || aptInsp.color,
              color: aptInsp.color,
              from: currentGrade,
              to: newGrade,
              stars: aptInsp.stars,
              chance: upgradeChance
            };
          }
        }
      }
      
      return result;
    });
  
  const finalResult = {
    turn,
    results: inspirationResults,
    updatedStats,
    updatedAptitudes
  };
  
  console.log('[checkAndApplyInspiration] Result:', finalResult);
  return finalResult;
};

/**
 * Returns the color for a grade badge
 * Color coding helps players quickly assess Pokemon strength
 */
const getGradeColor = (grade) => {
  const baseGrade = grade.replace('+', '');
  const colors = {
    F: '#000000',
    E: '#9ca3af',
    D: '#3b82f6',
    C: '#22c55e',
    B: '#ec4899',
    A: '#f97316',
    S: '#eab308',
    UU: '#14b8a6'  // Teal
  };
  return colors[baseGrade] || '#6b7280';
};

/**
 * Returns the color for a rarity badge
 * Used for Pokemon and Support card rarity display
 */
const getRarityColor = (rarity) => {
  const colors = {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Legendary: '#eab308'
  };
  return colors[rarity] || '#6b7280';
};

const StatIcon = ({ stat, size = 16 }) => {
  const icons = {
    HP: <Heart size={size} className="text-red-500" />,
    Attack: <Swords size={size} className="text-orange-500" />,
    Defense: <Shield size={size} className="text-blue-500" />,
    Instinct: <Sparkles size={size} className="text-purple-500" />,
    Speed: <Wind size={size} className="text-green-500" />
  };
  return icons[stat] || null;
};

const generatePokemonSprite = (type, pokemonName) => {
  // Create custom colored SVG sprites for each Pokemon with distinct features
  const pokemonSprites = {
    // Starters - Fire type
    'Charmander': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="45" r="20" fill="#ff7f27" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="33" cy="40" r="4" fill="#fff"/>
        <circle cx="47" cy="40" r="4" fill="#fff"/>
        <circle cx="33" cy="40" r="2" fill="#000"/>
        <circle cx="47" cy="40" r="2" fill="#000"/>
        <path d="M 35 50 Q 40 53 45 50" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 55 25 Q 58 20 60 25 Q 58 30 55 28 Q 53 26 55 25" fill="#ff4444" stroke="#d4521a" strokeWidth="1.5"/>
        <ellipse cx="40" cy="60" rx="8" ry="12" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1.5"/>
      </svg>
    ),
    'Squirtle': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="45" r="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="40" cy="60" rx="12" ry="8" fill="#88c9ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <circle cx="33" cy="42" r="5" fill="#fff"/>
        <circle cx="47" cy="42" r="5" fill="#fff"/>
        <circle cx="33" cy="42" r="2.5" fill="#000"/>
        <circle cx="47" cy="42" r="2.5" fill="#000"/>
        <path d="M 35 52 Q 40 55 45 52" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 22 48 Q 18 50 22 52" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <path d="M 58 48 Q 62 50 58 52" stroke="#1a75d4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Bulbasaur': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="15" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#4d9966" stroke="#2d8b2d" strokeWidth="2"/>
        <path d="M 35 26 L 38 22 L 36 26 L 40 24 L 38 28 L 42 26 L 40 30 L 44 28 L 42 32 L 45 30" stroke="#2d8b2d" strokeWidth="1.5" fill="none"/>
        <circle cx="34" cy="48" r="4" fill="#fff"/>
        <circle cx="46" cy="48" r="4" fill="#fff"/>
        <circle cx="34" cy="48" r="2" fill="#8b0000"/>
        <circle cx="46" cy="48" r="2" fill="#8b0000"/>
        <path d="M 36 56 Q 40 58 44 56" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Pikachu': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="42" r="18" fill="#ffd700" stroke="#e6b800" strokeWidth="2"/>
        <ellipse cx="28" cy="30" rx="6" ry="12" fill="#ffd700" stroke="#e6b800" strokeWidth="1.5"/>
        <path d="M 28 18 L 26 14" stroke="#000" strokeWidth="2"/>
        <ellipse cx="52" cy="30" rx="6" ry="12" fill="#ffd700" stroke="#e6b800" strokeWidth="1.5"/>
        <path d="M 52 18 L 54 14" stroke="#000" strokeWidth="2"/>
        <circle cx="34" cy="40" r="3" fill="#000"/>
        <circle cx="46" cy="40" r="3" fill="#000"/>
        <circle cx="33" cy="48" r="4" fill="#ff6b6b" opacity="0.6"/>
        <circle cx="47" cy="48" r="4" fill="#ff6b6b" opacity="0.6"/>
        <path d="M 37 52 Q 40 54 43 52" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Gastly': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="24" fill="#6b4c93" stroke="#4a3567" strokeWidth="2" opacity="0.85"/>
        <path d="M 25 35 Q 20 30 25 25 Q 30 30 25 35" fill="#4a3567" opacity="0.6"/>
        <path d="M 55 35 Q 60 30 55 25 Q 50 30 55 35" fill="#4a3567" opacity="0.6"/>
        <circle cx="32" cy="38" r="6" fill="#ff3366"/>
        <circle cx="48" cy="38" r="6" fill="#ff3366"/>
        <circle cx="32" cy="38" r="2" fill="#fff"/>
        <circle cx="48" cy="38" r="2" fill="#fff"/>
        <path d="M 28 50 Q 32 54 36 52 Q 40 50 44 52 Q 48 54 52 50" stroke="#000" strokeWidth="2" fill="none"/>
        <ellipse cx="40" cy="60" rx="18" ry="8" fill="#4a3567" opacity="0.4"/>
      </svg>
    ),
    // Add key Pokemon
    'Gengar': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#6b4c93" stroke="#4a3567" strokeWidth="2"/>
        <path d="M 20 45 Q 15 42 18 38" stroke="#4a3567" strokeWidth="3" fill="none"/>
        <path d="M 60 45 Q 65 42 62 38" stroke="#4a3567" strokeWidth="3" fill="none"/>
        <circle cx="32" cy="44" r="6" fill="#ff3366"/>
        <circle cx="48" cy="44" r="6" fill="#ff3366"/>
        <path d="M 28 54 Q 32 58 36 56 Q 40 54 44 56 Q 48 58 52 54" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 36 56 L 34 62 M 44 56 L 46 62" stroke="#fff" strokeWidth="2"/>
      </svg>
    ),
    'Moltres': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="45" rx="16" ry="20" fill="#ff8c00" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 30 25 Q 25 20 28 15 L 32 20 L 30 25" fill="#ff4444" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 22 Q 38 16 40 10 L 42 18 L 40 22" fill="#ffaa00" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 50 25 Q 55 20 52 15 L 48 20 L 50 25" fill="#ff4444" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="35" cy="42" r="3" fill="#fff"/>
        <circle cx="45" cy="42" r="3" fill="#fff"/>
        <path d="M 35 42 L 33 44 M 45 42 L 47 44" stroke="#000" strokeWidth="1.5"/>
        <path d="M 25 55 Q 22 60 18 62 M 35 62 Q 32 67 28 70 M 45 62 Q 48 67 52 70 M 55 55 Q 58 60 62 62" stroke="#ff4444" strokeWidth="2"/>
      </svg>
    ),
    'Articuno': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="45" rx="16" ry="20" fill="#87ceeb" stroke="#4682b4" strokeWidth="2"/>
        <path d="M 30 28 Q 28 22 30 18 L 32 24 L 30 28" fill="#b0e0e6" stroke="#4682b4" strokeWidth="1"/>
        <path d="M 40 25 Q 40 18 42 14 L 42 22 L 40 25" fill="#e0f6ff" stroke="#4682b4" strokeWidth="1"/>
        <path d="M 50 28 Q 52 22 50 18 L 48 24 L 50 28" fill="#b0e0e6" stroke="#4682b4" strokeWidth="1"/>
        <circle cx="35" cy="42" r="3" fill="#fff"/>
        <circle cx="45" cy="42" r="3" fill="#fff"/>
        <circle cx="35" cy="42" r="1.5" fill="#000"/>
        <circle cx="45" cy="42" r="1.5" fill="#000"/>
        <path d="M 25 58 L 20 65 M 35 64 L 30 72 M 45 64 L 50 72 M 55 58 L 60 65" stroke="#87ceeb" strokeWidth="2.5"/>
      </svg>
    ),
    'Raikou': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="16" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 30 32 L 28 25 L 32 30 L 30 32" fill="#6a0dad" stroke="#4a0080" strokeWidth="1"/>
        <path d="M 50 32 L 52 25 L 48 30 L 50 32" fill="#6a0dad" stroke="#4a0080" strokeWidth="1"/>
        <rect x="36" y="28" width="8" height="6" fill="#6a0dad" stroke="#4a0080" strokeWidth="1"/>
        <circle cx="34" cy="45" r="3" fill="#ff0000"/>
        <circle cx="46" cy="45" r="3" fill="#ff0000"/>
        <path d="M 36 54 Q 40 56 44 54" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 22 50 L 18 48 L 20 52 M 58 50 L 62 48 L 60 52" stroke="#d4a017" strokeWidth="2"/>
      </svg>
    ),
    'Celebi': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="14" ry="18" fill="#90ee90" stroke="#228b22" strokeWidth="2"/>
        <circle cx="40" cy="28" r="8" fill="#90ee90" stroke="#228b22" strokeWidth="1.5"/>
        <ellipse cx="26" cy="38" rx="8" ry="10" fill="#b0f0b0" stroke="#228b22" strokeWidth="1" transform="rotate(-20 26 38)"/>
        <ellipse cx="54" cy="38" rx="8" ry="10" fill="#b0f0b0" stroke="#228b22" strokeWidth="1" transform="rotate(20 54 38)"/>
        <circle cx="36" cy="40" r="3" fill="#4169e1"/>
        <circle cx="44" cy="40" r="3" fill="#4169e1"/>
        <circle cx="36" cy="40" r="1" fill="#fff"/>
        <circle cx="44" cy="40" r="1" fill="#fff"/>
        <path d="M 37 48 Q 40 50 43 48" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Growlithe': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="15" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="32" r="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <ellipse cx="28" cy="28" rx="6" ry="8" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <ellipse cx="52" cy="28" rx="6" ry="8" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="32" r="3" fill="#000"/>
        <circle cx="44" cy="32" r="3" fill="#000"/>
        <path d="M 36 40 Q 40 42 44 40" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 32 50 Q 30 55 28 58 M 48 50 Q 50 55 52 58" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Arcanine': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="14" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 30 22 L 28 16 L 32 20" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 50 22 L 52 16 L 48 20" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="35" cy="30" r="3" fill="#000"/>
        <circle cx="45" cy="30" r="3" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 22 52 Q 18 56 16 60 M 58 52 Q 62 56 64 60" stroke="#d4521a" strokeWidth="2.5"/>
      </svg>
    ),
    'Golduck': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="22" r="4" fill="#ff4444" stroke="#cc0000" strokeWidth="1.5"/>
        <circle cx="35" cy="30" r="4" fill="#fff"/>
        <circle cx="45" cy="30" r="4" fill="#fff"/>
        <circle cx="35" cy="30" r="2" fill="#000"/>
        <circle cx="45" cy="30" r="2" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 25 50 Q 22 54 20 58 M 55 50 Q 58 54 60 58" stroke="#1a75d4" strokeWidth="2"/>
      </svg>
    ),
    'Lapras': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="24" ry="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="40" cy="32" rx="14" ry="18" fill="#88c9ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 32 20 Q 30 14 32 10 L 34 18" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1"/>
        <circle cx="36" cy="32" r="4" fill="#000"/>
        <circle cx="44" cy="32" r="4" fill="#000"/>
        <path d="M 36 40 Q 40 42 44 40" stroke="#000" strokeWidth="2" fill="none"/>
        <ellipse cx="40" cy="65" rx="18" ry="8" fill="#2563eb" stroke="#1a75d4" strokeWidth="1.5"/>
      </svg>
    ),
    'Victreebel': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="22" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <path d="M 30 35 Q 25 30 30 25 L 35 32" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1"/>
        <path d="M 50 35 Q 55 30 50 25 L 45 32" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1"/>
        <circle cx="35" cy="45" r="4" fill="#ff0000"/>
        <circle cx="45" cy="45" r="4" fill="#ff0000"/>
        <path d="M 30 56 Q 35 60 40 58 Q 45 60 50 56" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 35 58 L 33 64 M 45 58 L 47 64" stroke="#ffe4b5" strokeWidth="2"/>
      </svg>
    ),
    'Vileplume': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="16" ry="14" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="28" r="16" fill="#ff6b9d" stroke="#c41e3a" strokeWidth="2"/>
        <circle cx="28" cy="22" r="6" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="40" cy="18" r="6" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="52" cy="22" r="6" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="36" cy="50" r="3" fill="#000"/>
        <circle cx="44" cy="50" r="3" fill="#000"/>
        <path d="M 37 58 Q 40 60 43 58" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Zapdos': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="45" rx="16" ry="20" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 30 26 L 26 20 L 28 22 L 24 18" stroke="#ffd700" strokeWidth="2.5"/>
        <path d="M 40 22 L 38 14 L 40 18 L 38 12" stroke="#ffaa00" strokeWidth="2.5"/>
        <path d="M 50 26 L 54 20 L 52 22 L 56 18" stroke="#ffd700" strokeWidth="2.5"/>
        <circle cx="35" cy="42" r="3" fill="#000"/>
        <circle cx="45" cy="42" r="3" fill="#000"/>
        <path d="M 37 50 Q 40 52 43 50" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 26 58 L 22 66 M 36 64 L 32 72 M 44 64 L 48 72 M 54 58 L 58 66" stroke="#ffd700" strokeWidth="2.5"/>
      </svg>
    ),
    'Raichu': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="45" rx="18" ry="16" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <ellipse cx="28" cy="32" rx="6" ry="10" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <ellipse cx="52" cy="32" rx="6" ry="10" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="34" cy="42" r="3" fill="#000"/>
        <circle cx="46" cy="42" r="3" fill="#000"/>
        <circle cx="33" cy="50" r="4" fill="#ff6b6b" opacity="0.6"/>
        <circle cx="47" cy="50" r="4" fill="#ff6b6b" opacity="0.6"/>
        <path d="M 37 54 Q 40 56 43 54" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 52 40 Q 58 38 62 40 Q 64 44 60 46" stroke="#8b4513" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Arbok': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="22" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="32" r="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 32 28 Q 28 26 30 22" stroke="#6a0dad" strokeWidth="2" fill="none"/>
        <path d="M 48 28 Q 52 26 50 22" stroke="#6a0dad" strokeWidth="2" fill="none"/>
        <circle cx="35" cy="32" r="4" fill="#ffff00"/>
        <circle cx="45" cy="32" r="4" fill="#ffff00"/>
        <circle cx="35" cy="32" r="1.5" fill="#000"/>
        <circle cx="45" cy="32" r="1.5" fill="#000"/>
        <path d="M 35 42 Q 40 44 45 42" stroke="#ff0000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Nidoking': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="18" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 40 18 L 38 12 L 40 16 L 42 12 L 40 18" fill="#8b008b" stroke="#6a0dad" strokeWidth="1"/>
        <ellipse cx="26" cy="28" rx="6" ry="8" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <ellipse cx="54" cy="28" rx="6" ry="8" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#ff0000"/>
        <circle cx="44" cy="30" r="3" fill="#ff0000"/>
        <path d="M 36 40 Q 40 42 44 40" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Rapidash': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="16" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 35 18 Q 32 12 35 8 L 37 16" fill="#ff4444" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 15 Q 38 8 40 4 L 42 14" fill="#ffaa00" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 45 18 Q 48 12 45 8 L 43 16" fill="#ff4444" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Starmie': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="18" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="40" r="8" fill="#ff0000" stroke="#cc0000" strokeWidth="2"/>
        <path d="M 40 22 L 38 16 L 42 16 L 40 22" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 52 30 L 56 26 L 56 32 L 52 30" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 52 50 L 56 54 L 56 48 L 52 50" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 40 58 L 38 64 L 42 64 L 40 58" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 28 50 L 24 54 L 24 48 L 28 50" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 28 30 L 24 26 L 24 32 L 28 30" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
      </svg>
    ),
    'Exeggutor': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="58" rx="16" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="30" cy="28" r="10" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="24" r="10" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="50" cy="28" r="10" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="28" cy="26" r="2" fill="#000"/>
        <circle cx="32" cy="26" r="2" fill="#000"/>
        <circle cx="38" cy="22" r="2" fill="#000"/>
        <circle cx="42" cy="22" r="2" fill="#000"/>
        <circle cx="48" cy="26" r="2" fill="#000"/>
        <circle cx="52" cy="26" r="2" fill="#000"/>
        <path d="M 28 32 Q 30 34 32 32 M 38 28 Q 40 30 42 28 M 48 32 Q 50 34 52 32" stroke="#000" strokeWidth="1"/>
      </svg>
    ),
    'Jolteon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 20 L 30 14 L 32 18 L 28 12" stroke="#ffd700" strokeWidth="2"/>
        <path d="M 40 18 L 38 10 L 40 14 L 38 8" stroke="#ffaa00" strokeWidth="2"/>
        <path d="M 48 20 L 50 14 L 48 18 L 52 12" stroke="#ffd700" strokeWidth="2"/>
      </svg>
    ),
    // ===== EVOLUTION SPRITES =====
    // Starter Evolutions - Stage 1
    'Charmeleon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="22" ry="20" fill="#ff7f27" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="14" fill="#ff7f27" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 32 25 L 30 20" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 48 25 L 50 20" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="34" cy="28" r="4" fill="#fff"/>
        <circle cx="46" cy="28" r="4" fill="#fff"/>
        <circle cx="34" cy="28" r="2" fill="#000"/>
        <circle cx="46" cy="28" r="2" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 56 20 Q 60 14 64 18 Q 62 24 58 22" fill="#ff4444" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Wartortle': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="22" ry="18" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="40" cy="62" rx="14" ry="10" fill="#88c9ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 28 22 Q 24 18 26 14" stroke="#88c9ff" strokeWidth="2" fill="none"/>
        <path d="M 52 22 Q 56 18 54 14" stroke="#88c9ff" strokeWidth="2" fill="none"/>
        <circle cx="35" cy="28" r="5" fill="#fff"/>
        <circle cx="45" cy="28" r="5" fill="#fff"/>
        <circle cx="35" cy="28" r="2.5" fill="#000"/>
        <circle cx="45" cy="28" r="2.5" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 56 42 Q 62 40 64 44" stroke="#1a75d4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Ivysaur': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="20" ry="16" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#ff6b9d" stroke="#c41e3a" strokeWidth="2"/>
        <circle cx="36" cy="22" r="4" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="44" cy="22" r="4" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <path d="M 32 28 L 34 32 L 30 30 L 34 34 L 32 32 L 36 36 L 34 34 L 38 38" stroke="#2d8b2d" strokeWidth="1.5" fill="none"/>
        <path d="M 48 28 L 46 32 L 50 30 L 46 34 L 48 32 L 44 36 L 46 34 L 42 38" stroke="#2d8b2d" strokeWidth="1.5" fill="none"/>
        <circle cx="36" cy="50" r="4" fill="#fff"/>
        <circle cx="44" cy="50" r="4" fill="#fff"/>
        <circle cx="36" cy="50" r="2" fill="#8b0000"/>
        <circle cx="44" cy="50" r="2" fill="#8b0000"/>
      </svg>
    ),
    // Starter Evolutions - Stage 2
    'Charizard': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="24" ry="20" fill="#ff7f27" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="16" fill="#ff7f27" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 30 22 L 26 16 L 28 18" stroke="#d4521a" strokeWidth="2.5"/>
        <path d="M 50 22 L 54 16 L 52 18" stroke="#d4521a" strokeWidth="2.5"/>
        <circle cx="34" cy="26" r="5" fill="#fff"/>
        <circle cx="46" cy="26" r="5" fill="#fff"/>
        <circle cx="34" cy="26" r="2.5" fill="#000"/>
        <circle cx="46" cy="26" r="2.5" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 18 38 Q 12 36 10 40 L 16 42" fill="#ff8844" stroke="#d4521a" strokeWidth="1.5"/>
        <path d="M 62 38 Q 68 36 70 40 L 64 42" fill="#ff8844" stroke="#d4521a" strokeWidth="1.5"/>
        <path d="M 58 16 Q 62 10 66 14 Q 64 20 60 18" fill="#ff4444" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Blastoise': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="24" ry="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="40" cy="64" rx="16" ry="10" fill="#88c9ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="35" cy="28" r="6" fill="#fff"/>
        <circle cx="45" cy="28" r="6" fill="#fff"/>
        <circle cx="35" cy="28" r="3" fill="#000"/>
        <circle cx="45" cy="28" r="3" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="28" cy="44" r="6" fill="#2563eb" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="52" cy="44" r="6" fill="#2563eb" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="28" cy="44" r="3" fill="#1a75d4"/>
        <circle cx="52" cy="44" r="3" fill="#1a75d4"/>
      </svg>
    ),
    'Venusaur': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="54" rx="22" ry="18" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="24" r="20" fill="#ff6b9d" stroke="#c41e3a" strokeWidth="2.5"/>
        <circle cx="26" cy="18" r="7" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1.5"/>
        <circle cx="40" cy="12" r="7" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1.5"/>
        <circle cx="54" cy="18" r="7" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1.5"/>
        <circle cx="32" cy="26" r="5" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="48" cy="26" r="5" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <path d="M 30 32 L 32 38 L 28 36 L 32 42" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 50 32 L 48 38 L 52 36 L 48 42" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <circle cx="36" cy="52" r="4" fill="#fff"/>
        <circle cx="44" cy="52" r="4" fill="#fff"/>
        <circle cx="36" cy="52" r="2" fill="#8b0000"/>
        <circle cx="44" cy="52" r="2" fill="#8b0000"/>
      </svg>
    ),
    // Common Evolution Lines
    'Pidgeotto': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 36 22 L 34 16 L 36 18" fill="#ff6b6b" stroke="#8b6914" strokeWidth="1"/>
        <path d="M 44 22 L 46 16 L 44 18" fill="#ff6b6b" stroke="#8b6914" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 20 44 Q 14 42 12 46" stroke="#8b6914" strokeWidth="2" fill="none"/>
        <path d="M 60 44 Q 66 42 68 46" stroke="#8b6914" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Pidgeot': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="26" r="14" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 18 L 28 10 L 30 14" fill="#ff6b6b" stroke="#8b6914" strokeWidth="1.5"/>
        <path d="M 40 14 L 38 6 L 40 10" fill="#ffaa00" stroke="#8b6914" strokeWidth="1.5"/>
        <path d="M 48 18 L 52 10 L 50 14" fill="#ff6b6b" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="36" cy="26" r="4" fill="#000"/>
        <circle cx="44" cy="26" r="4" fill="#000"/>
        <path d="M 16 46 Q 8 44 6 48 L 14 50" stroke="#8b6914" strokeWidth="2.5" fill="none"/>
        <path d="M 64 46 Q 72 44 74 48 L 66 50" stroke="#8b6914" strokeWidth="2.5" fill="none"/>
      </svg>
    ),
    'Raticate': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="16" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 34 22 L 32 16" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 46 22 L 48 16" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 34 36 L 32 38 L 30 36" stroke="#fff" strokeWidth="2"/>
        <path d="M 46 36 L 48 38 L 50 36" stroke="#fff" strokeWidth="2"/>
        <path d="M 36 40 Q 40 42 44 40" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Haunter': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="20" ry="18" fill="#6b4c93" stroke="#4a3567" strokeWidth="2" opacity="0.85"/>
        <path d="M 22 38 Q 16 36 14 40 L 20 42" fill="#4a3567" opacity="0.6"/>
        <path d="M 58 38 Q 64 36 66 40 L 60 42" fill="#4a3567" opacity="0.6"/>
        <circle cx="32" cy="40" r="7" fill="#ff3366"/>
        <circle cx="48" cy="40" r="7" fill="#ff3366"/>
        <circle cx="32" cy="40" r="2.5" fill="#fff"/>
        <circle cx="48" cy="40" r="2.5" fill="#fff"/>
        <path d="M 28 52 Q 32 56 36 54 Q 40 52 44 54 Q 48 56 52 52" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 36 54 L 34 60 M 44 54 L 46 60" stroke="#fff" strokeWidth="2"/>
      </svg>
    ),
    'Kadabra': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="20" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="26" r="14" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 36 22 L 34 16 L 36 18" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 44 22 L 46 16 L 44 18" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="26" r="3" fill="#000"/>
        <circle cx="44" cy="26" r="3" fill="#000"/>
        <path d="M 52 48 Q 58 46 62 50" stroke="#8b4513" strokeWidth="2" fill="none"/>
        <ellipse cx="62" cy="50" rx="4" ry="6" fill="#d4a017" stroke="#8b4513" strokeWidth="1"/>
      </svg>
    ),
    'Alakazam': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="18" ry="22" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="24" r="16" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 18 L 28 10 L 30 14" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 48 18 L 52 10 L 50 14" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="24" r="4" fill="#000"/>
        <circle cx="44" cy="24" r="4" fill="#000"/>
        <path d="M 20 50 Q 12 48 10 52" stroke="#8b4513" strokeWidth="2" fill="none"/>
        <ellipse cx="10" cy="52" rx="5" ry="7" fill="#d4a017" stroke="#8b4513" strokeWidth="1"/>
        <path d="M 60 50 Q 68 48 70 52" stroke="#8b4513" strokeWidth="2" fill="none"/>
        <ellipse cx="70" cy="52" rx="5" ry="7" fill="#d4a017" stroke="#8b4513" strokeWidth="1"/>
      </svg>
    ),
    'Machoke': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="20" fill="#6c7a89" stroke="#434a54" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#6c7a89" stroke="#434a54" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 22 48 Q 18 46 16 50" stroke="#434a54" strokeWidth="3" fill="none"/>
        <path d="M 58 48 Q 62 46 64 50" stroke="#434a54" strokeWidth="3" fill="none"/>
        <circle cx="32" cy="52" r="3" fill="#434a54"/>
        <circle cx="48" cy="52" r="3" fill="#434a54"/>
      </svg>
    ),
    'Machamp': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="24" ry="22" fill="#6c7a89" stroke="#434a54" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#6c7a89" stroke="#434a54" strokeWidth="2"/>
        <circle cx="36" cy="26" r="4" fill="#ff0000"/>
        <circle cx="44" cy="26" r="4" fill="#ff0000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 18 44 Q 12 42 10 46" stroke="#434a54" strokeWidth="3" fill="none"/>
        <path d="M 62 44 Q 68 42 70 46" stroke="#434a54" strokeWidth="3" fill="none"/>
        <path d="M 22 54 Q 16 52 14 56" stroke="#434a54" strokeWidth="3" fill="none"/>
        <path d="M 58 54 Q 64 52 66 56" stroke="#434a54" strokeWidth="3" fill="none"/>
      </svg>
    ),
    'Graveler': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="42" r="22" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <circle cx="34" cy="38" r="4" fill="#000"/>
        <circle cx="46" cy="38" r="4" fill="#000"/>
        <path d="M 36 48 Q 40 50 44 48" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 20 40 Q 16 38 14 42" stroke="#4a4a4a" strokeWidth="3" fill="none"/>
        <path d="M 60 40 Q 64 38 66 42" stroke="#4a4a4a" strokeWidth="3" fill="none"/>
        <circle cx="28" cy="32" r="4" fill="#6b6b6b"/>
        <circle cx="52" cy="32" r="4" fill="#6b6b6b"/>
      </svg>
    ),
    'Golem': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="44" r="26" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <circle cx="34" cy="40" r="5" fill="#000"/>
        <circle cx="46" cy="40" r="5" fill="#000"/>
        <path d="M 36 50 Q 40 52 44 50" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 18 42 Q 12 40 10 44" stroke="#4a4a4a" strokeWidth="4" fill="none"/>
        <path d="M 62 42 Q 68 40 70 44" stroke="#4a4a4a" strokeWidth="4" fill="none"/>
        <circle cx="26" cy="30" r="5" fill="#6b6b6b"/>
        <circle cx="54" cy="30" r="5" fill="#6b6b6b"/>
        <circle cx="40" cy="24" r="6" fill="#6b6b6b"/>
      </svg>
    ),
    'Dragonair': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <path d="M 40 60 Q 35 50 40 40 Q 45 30 40 20" stroke="#4da6ff" strokeWidth="18" fill="none"/>
        <circle cx="40" cy="20" r="10" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="36" cy="18" r="3" fill="#fff"/>
        <circle cx="44" cy="18" r="3" fill="#fff"/>
        <circle cx="36" cy="18" r="1.5" fill="#000"/>
        <circle cx="44" cy="18" r="1.5" fill="#000"/>
        <circle cx="30" cy="30" r="6" fill="#fff" stroke="#1a75d4" strokeWidth="1"/>
        <circle cx="50" cy="50" r="6" fill="#fff" stroke="#1a75d4" strokeWidth="1"/>
      </svg>
    ),
    'Dragonite': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="24" ry="22" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 18 36 Q 12 34 10 38 L 16 40" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <path d="M 62 36 Q 68 34 70 38 L 64 40" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="26" r="5" fill="#000"/>
        <circle cx="44" cy="26" r="5" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 34 16 L 32 10 L 34 12" fill="#ff8c42" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 46 16 L 48 10 L 46 12" fill="#ff8c42" stroke="#d4521a" strokeWidth="1"/>
      </svg>
    ),
    // ===== ADDITIONAL EVOLUTION SPRITES =====
    'Fearow': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="16" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="26" r="13" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 40 14 L 38 6 L 42 10" fill="#ff0000" stroke="#cc0000" strokeWidth="1.5"/>
        <circle cx="36" cy="26" r="3" fill="#ff0000"/>
        <circle cx="44" cy="26" r="3" fill="#ff0000"/>
        <path d="M 38 32 L 42 34" stroke="#ffd700" strokeWidth="2" fill="none"/>
        <path d="M 16 44 Q 10 42 8 46" stroke="#8b6914" strokeWidth="2.5" fill="none"/>
        <path d="M 64 44 Q 70 42 72 46" stroke="#8b6914" strokeWidth="2.5" fill="none"/>
      </svg>
    ),
    'Arcanine': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#ffe4b5" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 32 18 Q 28 12 30 8 L 34 16" fill="#ff4444" stroke="#d4521a" strokeWidth="1.5"/>
        <path d="M 40 14 Q 38 6 40 2 L 42 12" fill="#ffaa00" strokeWidth="2"/>
        <path d="M 48 18 Q 52 12 50 8 L 46 16" fill="#ff4444" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="4" fill="#000"/>
        <circle cx="44" cy="28" r="4" fill="#000"/>
        <path d="M 22 48 Q 18 46 16 50" stroke="#d4521a" strokeWidth="2" fill="none"/>
        <path d="M 58 48 Q 62 46 64 50" stroke="#d4521a" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Ninetales': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <ellipse cx="26" cy="26" rx="6" ry="8" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1.5"/>
        <ellipse cx="54" cy="26" rx="6" ry="8" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 48 50 Q 52 48 56 50 M 54 52 Q 58 50 62 52 M 60 54 Q 64 52 68 54" stroke="#ff8c42" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Golbat': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="18" ry="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 20 42 Q 12 38 10 44 Q 12 50 20 46" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 60 42 Q 68 38 70 44 Q 68 50 60 46" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="34" cy="40" r="4" fill="#000"/>
        <circle cx="46" cy="40" r="4" fill="#000"/>
        <path d="M 32 48 Q 36 52 40 50 Q 44 52 48 48" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 38 50 L 36 56 M 42 50 L 44 56" stroke="#fff" strokeWidth="1.5"/>
      </svg>
    ),
    'Gloom': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="16" ry="14" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="26" r="12" fill="#c41e3a" stroke="#8b0000" strokeWidth="2"/>
        <circle cx="34" cy="22" r="4" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="46" cy="22" r="4" fill="#ffe4b5" stroke="#c41e3a" strokeWidth="1"/>
        <path d="M 32 30 L 34 34 M 48 30 L 46 34" stroke="#8b0000" strokeWidth="1.5"/>
        <circle cx="36" cy="50" r="2" fill="#000"/>
        <circle cx="44" cy="50" r="2" fill="#000"/>
        <path d="M 37 56 Q 40 58 43 56" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Parasect': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="54" rx="18" ry="14" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="22" r="16" fill="#ff6b6b" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="30" cy="16" r="5" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="40" cy="12" r="6" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="50" cy="16" r="5" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="36" cy="52" r="2" fill="#fff"/>
        <circle cx="44" cy="52" r="2" fill="#fff"/>
      </svg>
    ),
    'Venomoth': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 18 36 Q 10 32 8 38 Q 12 44 18 42" fill="#c8a2d0" stroke="#6a0dad" strokeWidth="1.5"/>
        <path d="M 62 36 Q 70 32 72 38 Q 68 44 62 42" fill="#c8a2d0" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="5" fill="#ff0000"/>
        <circle cx="44" cy="30" r="5" fill="#ff0000"/>
        <path d="M 28 22 L 26 16 M 52 22 L 54 16" stroke="#6a0dad" strokeWidth="2"/>
      </svg>
    ),
    'Dugtrio': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="28" cy="50" rx="10" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <ellipse cx="40" cy="48" rx="10" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <ellipse cx="52" cy="50" rx="10" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="26" cy="48" r="2" fill="#000"/>
        <circle cx="30" cy="48" r="2" fill="#000"/>
        <circle cx="38" cy="46" r="2" fill="#000"/>
        <circle cx="42" cy="46" r="2" fill="#000"/>
        <circle cx="50" cy="48" r="2" fill="#000"/>
        <circle cx="54" cy="48" r="2" fill="#000"/>
      </svg>
    ),
    'Persian': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="16" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 20 L 30 14 L 32 16" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 48 20 L 50 14 L 48 16" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="28" r="4" fill="#ff0000"/>
        <circle cx="44" cy="28" r="4" fill="#ff0000"/>
        <path d="M 32 34 L 28 36 M 48 34 L 52 36" stroke="#000" strokeWidth="1.5"/>
        <circle cx="40" cy="18" r="4" fill="#ff0000" stroke="#cc0000" strokeWidth="1"/>
      </svg>
    ),
    'Primeape': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="18" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="34" cy="26" r="4" fill="#ff0000"/>
        <circle cx="46" cy="26" r="4" fill="#ff0000"/>
        <path d="M 34 36 Q 40 38 46 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 22 48 Q 18 46 16 50" stroke="#d4a017" strokeWidth="3" fill="none"/>
        <path d="M 58 48 Q 62 46 64 50" stroke="#d4a017" strokeWidth="3" fill="none"/>
        <circle cx="28" cy="22" r="4" fill="#8b4513"/>
        <circle cx="52" cy="22" r="4" fill="#8b4513"/>
      </svg>
    ),
    'Poliwhirl': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="42" r="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="40" cy="42" rx="12" ry="10" fill="#fff" opacity="0.8"/>
        <path d="M 35 40 Q 40 38 45 40 Q 43 44 40 45 Q 37 44 35 40" fill="#000"/>
        <circle cx="32" cy="34" r="4" fill="#000"/>
        <circle cx="48" cy="34" r="4" fill="#000"/>
      </svg>
    ),
    'Poliwrath': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="24" ry="22" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="40" cy="34" rx="10" ry="8" fill="#fff" opacity="0.8"/>
        <path d="M 36 32 Q 40 30 44 32 Q 42 36 40 37 Q 38 36 36 32" fill="#000"/>
        <circle cx="34" cy="24" r="4" fill="#000"/>
        <circle cx="46" cy="24" r="4" fill="#000"/>
        <path d="M 20 48 Q 16 46 14 50" stroke="#1a75d4" strokeWidth="3" fill="none"/>
        <path d="M 60 48 Q 64 46 66 50" stroke="#1a75d4" strokeWidth="3" fill="none"/>
      </svg>
    ),
    'Weepinbell': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="54" rx="12" ry="10" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <ellipse cx="40" cy="36" rx="14" ry="16" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="36" cy="32" r="4" fill="#000"/>
        <circle cx="44" cy="32" r="4" fill="#000"/>
        <path d="M 34 42 Q 38 46 42 44 Q 46 46 50 42" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 28 38 Q 24 38 22 40" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 52 38 Q 56 38 58 40" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Tentacruel': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="32" r="18" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="34" cy="30" r="4" fill="#ff0000"/>
        <circle cx="46" cy="30" r="4" fill="#ff0000"/>
        <path d="M 34 40 Q 40 42 46 40" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 24 48 Q 22 54 20 60" stroke="#1a75d4" strokeWidth="3"/>
        <path d="M 32 50 Q 30 56 28 62" stroke="#1a75d4" strokeWidth="3"/>
        <path d="M 40 52 Q 40 58 40 64" stroke="#1a75d4" strokeWidth="3"/>
        <path d="M 48 50 Q 50 56 52 62" stroke="#1a75d4" strokeWidth="3"/>
        <path d="M 56 48 Q 58 54 60 60" stroke="#1a75d4" strokeWidth="3"/>
      </svg>
    ),
    'Slowbro': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="22" ry="20" fill="#ff99cc" stroke="#cc6699" strokeWidth="2"/>
        <circle cx="40" cy="26" r="14" fill="#ff99cc" stroke="#cc6699" strokeWidth="2"/>
        <circle cx="36" cy="26" r="4" fill="#000"/>
        <circle cx="44" cy="26" r="4" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="2" fill="none"/>
        <ellipse cx="52" cy="58" rx="10" ry="8" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 50 58 Q 52 56 54 58" stroke="#fff" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Magneton': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="30" r="10" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="30" r="4" fill="#ff0000"/>
        <circle cx="28" cy="50" r="10" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="28" cy="50" r="4" fill="#ff0000"/>
        <circle cx="52" cy="50" r="10" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="52" cy="50" r="4" fill="#ff0000"/>
        <path d="M 35 36 L 32 44 M 45 36 L 48 44" stroke="#505050" strokeWidth="2"/>
      </svg>
    ),
    'Dodrio': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="58" rx="18" ry="12" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="28" cy="26" r="8" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="24" r="8" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="52" cy="26" r="8" fill="#b8860b" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 28 34 L 32 48" stroke="#b8860b" strokeWidth="4"/>
        <path d="M 40 32 L 40 48" stroke="#b8860b" strokeWidth="4"/>
        <path d="M 52 34 L 48 48" stroke="#b8860b" strokeWidth="4"/>
      </svg>
    ),
    'Dewgong': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="22" ry="16" fill="#fff" stroke="#a8a8a8" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#fff" stroke="#a8a8a8" strokeWidth="2"/>
        <path d="M 40 14 L 38 8 L 42 10" fill="#ffe4b5" stroke="#a8a8a8" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 22 50 Q 18 52 16 56" stroke="#a8a8a8" strokeWidth="2" fill="none"/>
        <path d="M 58 50 Q 62 52 64 56" stroke="#a8a8a8" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Cloyster': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="46" rx="22" ry="20" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="40" r="12" fill="#000" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="36" cy="38" r="3" fill="#ff0000"/>
        <circle cx="44" cy="38" r="3" fill="#ff0000"/>
        <path d="M 24 28 L 20 22 L 22 26" fill="#e6e6e6" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 32 24 L 28 16 L 30 20" fill="#e6e6e6" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 48 24 L 52 16 L 50 20" fill="#e6e6e6" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 56 28 L 60 22 L 58 26" fill="#e6e6e6" stroke="#6a0dad" strokeWidth="1"/>
      </svg>
    ),
    'Hypno': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="20" ry="18" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="28" r="5" fill="#fff"/>
        <circle cx="44" cy="28" r="5" fill="#fff"/>
        <circle cx="36" cy="28" r="2" fill="#ff0000"/>
        <circle cx="44" cy="28" r="2" fill="#ff0000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="40" cy="16" r="5" fill="#8b4513"/>
        <path d="M 50 50 Q 54 48 58 50" stroke="#8b4513" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Kingler': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="16" fill="#ff6b6b" stroke="#cc0000" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ff6b6b" stroke="#cc0000" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 18 42 Q 12 38 10 44" stroke="#cc0000" strokeWidth="4" fill="none"/>
        <ellipse cx="10" cy="44" rx="6" ry="8" fill="#ff6b6b" stroke="#cc0000" strokeWidth="2"/>
        <path d="M 62 42 Q 68 38 70 44" stroke="#cc0000" strokeWidth="3" fill="none"/>
        <ellipse cx="70" cy="44" rx="4" ry="6" fill="#ff6b6b" stroke="#cc0000" strokeWidth="2"/>
      </svg>
    ),
    'Electrode': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="22" fill="#fff" stroke="#ff0000" strokeWidth="3"/>
        <path d="M 18 40 L 62 40" stroke="#ff0000" strokeWidth="4"/>
        <circle cx="40" cy="40" r="8" fill="#ff0000" stroke="#cc0000" strokeWidth="2"/>
        <circle cx="32" cy="32" r="4" fill="#000"/>
        <circle cx="48" cy="32" r="4" fill="#000"/>
        <path d="M 34 48 Q 40 50 46 48" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Marowak': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="16" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#fff" stroke="#a8a8a8" strokeWidth="2"/>
        <circle cx="34" cy="26" r="4" fill="#000"/>
        <circle cx="46" cy="26" r="4" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 50 46 Q 58 44 64 48" stroke="#8b4513" strokeWidth="3" fill="none"/>
        <ellipse cx="64" cy="48" rx="6" ry="8" fill="#ffe4b5" stroke="#8b4513" strokeWidth="2"/>
      </svg>
    ),
    'Weezing': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="30" cy="40" r="16" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="50" cy="44" r="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="26" cy="36" r="4" fill="#fff"/>
        <circle cx="34" cy="36" r="4" fill="#fff"/>
        <circle cx="26" cy="36" r="2" fill="#000"/>
        <circle cx="34" cy="36" r="2" fill="#000"/>
        <circle cx="46" cy="42" r="4" fill="#fff"/>
        <circle cx="54" cy="42" r="4" fill="#fff"/>
        <circle cx="46" cy="42" r="2" fill="#000"/>
        <circle cx="54" cy="42" r="2" fill="#000"/>
      </svg>
    ),
    'Rhydon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="24" ry="20" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="16" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <path d="M 40 12 L 38 6 L 42 8" fill="#ffe4b5" stroke="#4a4a4a" strokeWidth="1.5"/>
        <circle cx="34" cy="28" r="4" fill="#ff0000"/>
        <circle cx="46" cy="28" r="4" fill="#ff0000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 20 50 Q 16 48 14 52" stroke="#4a4a4a" strokeWidth="4" fill="none"/>
        <path d="M 60 50 Q 64 48 66 52" stroke="#4a4a4a" strokeWidth="4" fill="none"/>
      </svg>
    ),
    'Seadra': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="18" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="24" r="10" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 32 18 L 30 12 L 32 14" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 40 14 L 38 8 L 40 10" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 48 18 L 50 12 L 48 14" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="37" cy="24" r="3" fill="#000"/>
        <circle cx="43" cy="24" r="3" fill="#000"/>
        <path d="M 48 34 L 52 32 L 50 36" stroke="#1a75d4" strokeWidth="2"/>
      </svg>
    ),
    'Seaking': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="44" rx="20" ry="16" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="26" r="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 40 14 L 38 8 L 42 10" fill="#fff" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="26" r="3" fill="#000"/>
        <circle cx="44" cy="26" r="3" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 20 48 L 14 52 L 18 50" fill="#fff" stroke="#d4521a" strokeWidth="1.5"/>
        <path d="M 60 48 L 66 52 L 62 50" fill="#fff" stroke="#d4521a" strokeWidth="1.5"/>
      </svg>
    ),
    'Gyarados': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="24" ry="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 32 18 L 28 10 L 30 14" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 48 18 L 52 10 L 50 14" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="34" cy="24" r="5" fill="#ff0000"/>
        <circle cx="46" cy="24" r="5" fill="#ff0000"/>
        <path d="M 32 36 Q 36 40 40 38 Q 44 40 48 36" stroke="#fff" strokeWidth="3" fill="none"/>
        <path d="M 38 38 L 36 44 M 42 38 L 44 44" stroke="#fff" strokeWidth="2"/>
      </svg>
    ),
    'Omastar': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="44" r="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 30 36 Q 28 32 32 30 Q 34 34 32 36" fill="#88c9ff"/>
        <path d="M 36 32 Q 34 28 38 26 Q 40 30 38 32" fill="#88c9ff"/>
        <path d="M 44 32 Q 42 28 46 26 Q 48 30 46 32" fill="#88c9ff"/>
        <path d="M 50 36 Q 48 32 52 30 Q 54 34 52 36" fill="#88c9ff"/>
        <circle cx="34" cy="42" r="4" fill="#ff0000"/>
        <circle cx="46" cy="42" r="4" fill="#ff0000"/>
        <path d="M 26 50 Q 22 52 20 56" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 54 50 Q 58 52 60 56" stroke="#1a75d4" strokeWidth="2"/>
      </svg>
    ),
    'Kabutops': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="18" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <circle cx="40" cy="26" r="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 20 L 30 14 L 32 16" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 48 20 L 50 14 L 48 16" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="36" cy="26" r="4" fill="#ff0000"/>
        <circle cx="44" cy="26" r="4" fill="#ff0000"/>
        <path d="M 20 48 Q 14 46 12 50" stroke="#4a4a4a" strokeWidth="3" fill="none"/>
        <path d="M 60 48 Q 66 46 68 50" stroke="#4a4a4a" strokeWidth="3" fill="none"/>
        <path d="M 12 50 L 10 56 L 14 52" fill="#e6e6e6" stroke="#4a4a4a" strokeWidth="1"/>
        <path d="M 68 50 L 70 56 L 66 52" fill="#e6e6e6" stroke="#4a4a4a" strokeWidth="1"/>
      </svg>
    ),
    'Metapod': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="16" ry="20" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="36" cy="38" r="3" fill="#000"/>
        <circle cx="44" cy="38" r="3" fill="#000"/>
        <path d="M 36 46 Q 40 48 44 46" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Butterfree': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="12" ry="10" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="32" r="8" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 18 34 Q 10 28 8 36 Q 12 42 18 40" fill="#fff" stroke="#6a0dad" strokeWidth="1.5"/>
        <path d="M 62 34 Q 70 28 72 36 Q 68 42 62 40" fill="#fff" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="32" r="4" fill="#ff0000"/>
        <circle cx="44" cy="32" r="4" fill="#ff0000"/>
        <path d="M 34 22 L 32 16 M 46 22 L 48 16" stroke="#6a0dad" strokeWidth="2"/>
      </svg>
    ),
    'Kakuna': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="16" ry="20" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="38" r="3" fill="#000"/>
        <circle cx="44" cy="38" r="3" fill="#000"/>
        <path d="M 36 46 Q 40 48 44 46" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Beedrill': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="46" rx="14" ry="12" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="10" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 20 42 Q 16 40 14 44" stroke="#d4a017" strokeWidth="2" fill="none"/>
        <path d="M 14 44 L 12 48 L 16 46" fill="#e6e6e6" stroke="#000" strokeWidth="1"/>
        <path d="M 60 42 Q 64 40 66 44" stroke="#d4a017" strokeWidth="2" fill="none"/>
        <path d="M 66 44 L 68 48 L 64 46" fill="#e6e6e6" stroke="#000" strokeWidth="1"/>
        <path d="M 34 20 L 32 14 M 46 20 L 48 14" stroke="#d4a017" strokeWidth="2"/>
      </svg>
    ),
    'Nidorina': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="16" fill="#ff99cc" stroke="#cc6699" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#ff99cc" stroke="#cc6699" strokeWidth="2"/>
        <ellipse cx="28" cy="26" rx="5" ry="7" fill="#ff99cc" stroke="#cc6699" strokeWidth="1.5"/>
        <ellipse cx="52" cy="26" rx="5" ry="7" fill="#ff99cc" stroke="#cc6699" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Nidoqueen': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="22" ry="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 40 14 L 38 8 L 40 10 L 42 8 L 40 14" fill="#1a75d4" stroke="#1a75d4" strokeWidth="1"/>
        <ellipse cx="26" cy="26" rx="6" ry="8" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <ellipse cx="54" cy="26" rx="6" ry="8" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Nidorino': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="16" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 40 18 L 38 12 L 40 14 L 42 12 L 40 18" fill="#8b008b" stroke="#6a0dad" strokeWidth="1"/>
        <ellipse cx="28" cy="26" rx="5" ry="7" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <ellipse cx="52" cy="26" rx="5" ry="7" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Sandslash': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="18" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 30 18 L 28 12 L 30 14" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 40 14 L 38 8 L 40 10" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 50 18 L 52 12 L 50 14" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 22 48 Q 18 46 16 50" stroke="#8b6914" strokeWidth="2" fill="none"/>
        <path d="M 58 48 Q 62 46 64 50" stroke="#8b6914" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Muk': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="24" ry="20" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="32" cy="42" r="5" fill="#000"/>
        <circle cx="48" cy="42" r="5" fill="#000"/>
        <circle cx="32" cy="42" r="2" fill="#ffff00"/>
        <circle cx="48" cy="42" r="2" fill="#ffff00"/>
        <path d="M 32 54 Q 40 58 48 54" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="25" cy="50" r="6" fill="#7a5cb5" opacity="0.7"/>
        <circle cx="55" cy="50" r="6" fill="#7a5cb5" opacity="0.7"/>
        <circle cx="30" cy="30" r="4" fill="#7a5cb5" opacity="0.6"/>
        <circle cx="50" cy="35" r="5" fill="#7a5cb5" opacity="0.6"/>
      </svg>
    ),
    'Magmar': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#ff8c00" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ff8c00" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 35 18 Q 32 12 35 8" stroke="#ff4444" strokeWidth="2" fill="none"/>
        <path d="M 45 18 Q 48 12 45 8" stroke="#ff4444" strokeWidth="2" fill="none"/>
        <circle cx="36" cy="28" r="3" fill="#ffff00"/>
        <circle cx="44" cy="28" r="3" fill="#ffff00"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 28 50 Q 26 56 24 60 M 52 50 Q 54 56 56 60" stroke="#d4521a" strokeWidth="2.5"/>
      </svg>
    ),
    'Vaporeon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="26" cy="28" rx="6" ry="8" fill="#88c9ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <ellipse cx="54" cy="28" rx="6" ry="8" fill="#88c9ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 37 38 Q 40 40 43 38" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 50 45 Q 56 44 60 46 Q 62 50 58 52" stroke="#1a75d4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Tangela': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="20" fill="#4d9966" stroke="#2d8b2d" strokeWidth="2"/>
        <path d="M 25 30 Q 20 28 22 24" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 35 25 Q 32 20 36 18" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 45 25 Q 48 20 44 18" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 55 30 Q 60 28 58 24" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 25 50 Q 20 52 22 56" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 55 50 Q 60 52 58 56" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <circle cx="34" cy="38" r="3" fill="#fff"/>
        <circle cx="46" cy="38" r="3" fill="#fff"/>
        <circle cx="34" cy="38" r="1.5" fill="#8b0000"/>
        <circle cx="46" cy="38" r="1.5" fill="#8b0000"/>
      </svg>
    ),
    'Electabuzz': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 30 20 L 26 16 L 28 20 L 24 18" stroke="#000" strokeWidth="2"/>
        <path d="M 50 20 L 54 16 L 52 20 L 56 18" stroke="#000" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 25 50 Q 22 56 20 60 M 55 50 Q 58 56 60 60" stroke="#d4a017" strokeWidth="2.5"/>
      </svg>
    ),
    'Weezing': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="30" cy="40" r="16" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="50" cy="44" r="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="26" cy="36" r="4" fill="#fff"/>
        <circle cx="34" cy="36" r="4" fill="#fff"/>
        <circle cx="26" cy="36" r="2" fill="#000"/>
        <circle cx="34" cy="36" r="2" fill="#000"/>
        <circle cx="46" cy="42" r="4" fill="#fff"/>
        <circle cx="54" cy="42" r="4" fill="#fff"/>
        <circle cx="46" cy="42" r="2" fill="#000"/>
        <circle cx="54" cy="42" r="2" fill="#000"/>
        <circle cx="22" cy="48" r="5" fill="#7a5cb5" opacity="0.6"/>
        <circle cx="38" cy="50" r="4" fill="#7a5cb5" opacity="0.6"/>
        <circle cx="56" cy="54" r="5" fill="#7a5cb5" opacity="0.6"/>
      </svg>
    ),
    'Flareon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 30 18 Q 28 12 30 8 L 32 16" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 16 Q 38 8 40 4 L 42 14" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 50 18 Q 52 12 50 8 L 48 16" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <ellipse cx="26" cy="28" rx="6" ry="8" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <ellipse cx="54" cy="28" rx="6" ry="8" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 37 36 Q 40 38 43 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Cloyster': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 25 40 L 20 35 L 25 38" fill="#e0e0e0" stroke="#9370db" strokeWidth="1"/>
        <path d="M 30 32 L 26 26 L 30 30" fill="#e0e0e0" stroke="#9370db" strokeWidth="1"/>
        <path d="M 40 28 L 38 22 L 40 26" fill="#e0e0e0" stroke="#9370db" strokeWidth="1"/>
        <path d="M 50 32 L 54 26 L 50 30" fill="#e0e0e0" stroke="#9370db" strokeWidth="1"/>
        <path d="M 55 40 L 60 35 L 55 38" fill="#e0e0e0" stroke="#9370db" strokeWidth="1"/>
        <circle cx="34" cy="48" r="3" fill="#000"/>
        <circle cx="46" cy="48" r="3" fill="#000"/>
        <path d="M 35 56 Q 40 58 45 56" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Parasect': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="54" rx="18" ry="14" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <ellipse cx="40" cy="28" rx="18" ry="14" fill="#ff6b6b" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="32" cy="26" r="5" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="48" cy="26" r="5" fill="#ffe4b5" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="36" cy="52" r="3" fill="#fff"/>
        <circle cx="44" cy="52" r="3" fill="#fff"/>
        <circle cx="36" cy="52" r="1.5" fill="#000"/>
        <circle cx="44" cy="52" r="1.5" fill="#000"/>
        <path d="M 26 56 Q 22 60 20 64 M 54 56 Q 58 60 60 64" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Magneton': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="35" r="10" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="28" cy="50" r="8" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="52" cy="50" r="8" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="35" r="4" fill="#ff0000"/>
        <circle cx="28" cy="50" r="3" fill="#ff0000"/>
        <circle cx="52" cy="50" r="3" fill="#ff0000"/>
        <rect x="36" y="28" width="2" height="8" fill="#505050"/>
        <rect x="42" y="28" width="2" height="8" fill="#505050"/>
        <rect x="24" y="43" width="2" height="8" fill="#505050"/>
        <rect x="30" y="43" width="2" height="8" fill="#505050"/>
        <rect x="48" y="43" width="2" height="8" fill="#505050"/>
        <rect x="54" y="43" width="2" height="8" fill="#505050"/>
      </svg>
    ),
    'Tentacruel': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="32" rx="18" ry="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="28" cy="24" r="4" fill="#ff0000"/>
        <circle cx="40" cy="22" r="4" fill="#ff0000"/>
        <circle cx="52" cy="24" r="4" fill="#ff0000"/>
        <circle cx="34" cy="32" r="4" fill="#000"/>
        <circle cx="46" cy="32" r="4" fill="#000"/>
        <path d="M 28 48 Q 26 56 24 62" stroke="#1a75d4" strokeWidth="3" fill="none"/>
        <path d="M 34 48 Q 32 58 30 66" stroke="#1a75d4" strokeWidth="3" fill="none"/>
        <path d="M 40 48 Q 40 58 40 66" stroke="#1a75d4" strokeWidth="3" fill="none"/>
        <path d="M 46 48 Q 48 58 50 66" stroke="#1a75d4" strokeWidth="3" fill="none"/>
        <path d="M 52 48 Q 54 56 56 62" stroke="#1a75d4" strokeWidth="3" fill="none"/>
      </svg>
    ),
    'Rattata': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <ellipse cx="28" cy="26" rx="5" ry="7" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <ellipse cx="52" cy="26" rx="5" ry="7" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="2.5" fill="#000"/>
        <circle cx="44" cy="30" r="2.5" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 50 46 Q 56 44 60 46" stroke="#6a0dad" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Meowth': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 30 20 L 28 12 L 32 18" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1"/>
        <path d="M 50 20 L 52 12 L 48 18" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1"/>
        <circle cx="36" cy="30" r="2.5" fill="#000"/>
        <circle cx="44" cy="30" r="2.5" fill="#000"/>
        <circle cx="40" cy="24" r="3" fill="#ffd700" stroke="#d4a017" strokeWidth="1"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 35 38 L 32 40 M 45 38 L 48 40" stroke="#000" strokeWidth="1"/>
      </svg>
    ),
    'Sandshrew': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="16" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="32" r="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 26 L 30 22 M 40 24 L 40 20 M 48 26 L 50 22" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 28 44 L 26 40 M 36 46 L 34 42 M 44 46 L 46 42 M 52 44 L 54 40" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="36" cy="32" r="3" fill="#000"/>
        <circle cx="44" cy="32" r="3" fill="#000"/>
        <path d="M 36 40 Q 40 42 44 40" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Psyduck': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 35 18 Q 32 14 35 10" stroke="#d4a017" strokeWidth="2" fill="none"/>
        <path d="M 40 16 Q 38 12 40 8" stroke="#d4a017" strokeWidth="2" fill="none"/>
        <path d="M 45 18 Q 48 14 45 10" stroke="#d4a017" strokeWidth="2" fill="none"/>
        <circle cx="36" cy="28" r="3" fill="#fff"/>
        <circle cx="44" cy="28" r="3" fill="#fff"/>
        <circle cx="36" cy="28" r="1.5" fill="#000"/>
        <circle cx="44" cy="28" r="1.5" fill="#000"/>
        <path d="M 37 36 Q 40 38 43 36" stroke="#ff8c00" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Poliwag': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="20" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="36" cy="36" r="5" fill="#fff"/>
        <circle cx="44" cy="36" r="5" fill="#fff"/>
        <circle cx="36" cy="36" r="2.5" fill="#000"/>
        <circle cx="44" cy="36" r="2.5" fill="#000"/>
        <path d="M 40 48 Q 35 50 32 52 Q 30 55 28 58" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <path d="M 40 48 Q 45 50 48 52 Q 50 55 52 58" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <ellipse cx="40" cy="50" rx="8" ry="6" fill="none" stroke="#000" strokeWidth="2" transform="rotate(20 40 50)"/>
      </svg>
    ),
    'Tentacool': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="30" rx="14" ry="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="32" cy="24" r="3" fill="#ff0000"/>
        <circle cx="48" cy="24" r="3" fill="#ff0000"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 32 42 Q 30 50 28 56" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <path d="M 40 42 Q 40 50 40 56" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <path d="M 48 42 Q 50 50 52 56" stroke="#1a75d4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Shellder': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <ellipse cx="40" cy="32" rx="18" ry="14" fill="#e0e0e0" stroke="#9370db" strokeWidth="2"/>
        <path d="M 28 28 L 24 24 M 34 26 L 32 22 M 40 24 L 40 20 M 46 26 L 48 22 M 52 28 L 56 24" stroke="#9370db" strokeWidth="1.5"/>
        <circle cx="36" cy="46" r="3" fill="#000"/>
        <circle cx="44" cy="46" r="3" fill="#000"/>
        <path d="M 36 52 Q 40 54 44 52" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Krabby': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="14" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="32" cy="36" r="4" fill="#000"/>
        <circle cx="48" cy="36" r="4" fill="#000"/>
        <path d="M 25 40 Q 22 38 20 36 L 24 38" stroke="#d4521a" strokeWidth="2.5" fill="none"/>
        <path d="M 55 40 Q 58 38 60 36 L 56 38" stroke="#d4521a" strokeWidth="2.5" fill="none"/>
        <path d="M 28 56 L 26 62 M 34 58 L 32 64 M 46 58 L 48 64 M 52 56 L 54 62" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Oddish': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="14" ry="12" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="36" cy="50" r="3" fill="#000"/>
        <circle cx="44" cy="50" r="3" fill="#000"/>
        <path d="M 36 58 Q 40 60 44 58" stroke="#000" strokeWidth="1.5" fill="none"/>
        <circle cx="32" cy="26" r="6" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1.5"/>
        <circle cx="40" cy="22" r="7" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1.5"/>
        <circle cx="48" cy="26" r="6" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1.5"/>
        <path d="M 32 20 L 30 16 M 40 15 L 40 11 M 48 20 L 50 16" stroke="#2d8b2d" strokeWidth="1.5"/>
      </svg>
    ),
    'Bellsprout': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="56" rx="10" ry="8" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <rect x="36" y="36" width="8" height="20" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <ellipse cx="40" cy="24" rx="10" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="36" cy="22" r="3" fill="#000"/>
        <circle cx="44" cy="22" r="3" fill="#000"/>
        <path d="M 36 28 Q 40 30 44 28" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 30 40 Q 26 40 24 42" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
        <path d="M 50 40 Q 54 40 56 42" stroke="#2d8b2d" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Paras': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="16" ry="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="32" cy="24" r="6" fill="#ff6b6b" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="48" cy="24" r="6" fill="#ff6b6b" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="50" r="3" fill="#fff"/>
        <circle cx="44" cy="50" r="3" fill="#fff"/>
        <circle cx="36" cy="50" r="1.5" fill="#000"/>
        <circle cx="44" cy="50" r="1.5" fill="#000"/>
        <path d="M 26 54 Q 22 58 20 62 M 54 54 Q 58 58 60 62" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Zubat': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="40" rx="14" ry="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 24 40 Q 18 36 16 42 Q 18 46 24 44" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <path d="M 56 40 Q 62 36 64 42 Q 62 46 56 44" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="38" r="3" fill="#000"/>
        <circle cx="44" cy="38" r="3" fill="#000"/>
        <path d="M 36 44 Q 40 46 44 44" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Grimer': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="18" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="34" cy="42" r="4" fill="#000"/>
        <circle cx="46" cy="42" r="4" fill="#000"/>
        <path d="M 34 52 Q 40 56 46 52" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="28" cy="48" r="5" fill="#7a5cb5" opacity="0.7"/>
        <circle cx="52" cy="48" r="5" fill="#7a5cb5" opacity="0.7"/>
        <circle cx="32" cy="32" r="4" fill="#7a5cb5" opacity="0.6"/>
      </svg>
    ),
    'Koffing': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="18" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="34" cy="36" r="4" fill="#fff"/>
        <circle cx="46" cy="36" r="4" fill="#fff"/>
        <circle cx="34" cy="36" r="2" fill="#000"/>
        <circle cx="46" cy="36" r="2" fill="#000"/>
        <path d="M 34 46 Q 40 48 46 46" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="26" cy="46" r="4" fill="#7a5cb5" opacity="0.6"/>
        <circle cx="54" cy="46" r="4" fill="#7a5cb5" opacity="0.6"/>
        <circle cx="32" cy="26" r="3" fill="#7a5cb5" opacity="0.6"/>
        <circle cx="48" cy="26" r="3" fill="#7a5cb5" opacity="0.6"/>
      </svg>
    ),
    'Voltorb': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="20" fill="#ff0000" stroke="#cc0000" strokeWidth="2"/>
        <path d="M 20 40 L 60 40" stroke="#fff" strokeWidth="3"/>
        <circle cx="40" cy="40" r="6" fill="#fff" stroke="#000" strokeWidth="2"/>
        <circle cx="40" cy="40" r="3" fill="#000"/>
      </svg>
    ),
    'Magnemite': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="12" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="40" r="5" fill="#ff0000"/>
        <rect x="36" y="32" width="2" height="10" fill="#505050"/>
        <rect x="42" y="32" width="2" height="10" fill="#505050"/>
        <circle cx="26" cy="46" r="4" fill="#505050"/>
        <circle cx="54" cy="46" r="4" fill="#505050"/>
        <path d="M 32 40 L 26 46 M 48 40 L 54 46" stroke="#505050" strokeWidth="2"/>
      </svg>
    ),
    'Sentret': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="16" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="28" r="10" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <ellipse cx="28" cy="26" rx="4" ry="6" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <ellipse cx="52" cy="26" rx="4" ry="6" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="2.5" fill="#000"/>
        <circle cx="44" cy="28" r="2.5" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Zigzagoon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 28 32 Q 24 30 26 26 Q 28 28 30 28" fill="#8b4513" stroke="#5a2d0c" strokeWidth="1"/>
        <path d="M 52 32 Q 56 30 54 26 Q 52 28 50 28" fill="#8b4513" stroke="#5a2d0c" strokeWidth="1"/>
        <circle cx="36" cy="30" r="2.5" fill="#000"/>
        <circle cx="44" cy="30" r="2.5" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Bidoof': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <rect x="36" y="36" width="8" height="6" fill="#fff" stroke="#8b6914" strokeWidth="1"/>
        <circle cx="34" cy="28" r="3" fill="#000"/>
        <circle cx="46" cy="28" r="3" fill="#000"/>
        <path d="M 50 46 Q 54 44 58 46" stroke="#8b6914" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Bibarel': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#8b6914" stroke="#654321" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#8b6914" stroke="#654321" strokeWidth="2"/>
        <rect x="35" y="36" width="10" height="8" fill="#fff" stroke="#654321" strokeWidth="1.5"/>
        <circle cx="34" cy="26" r="4" fill="#000"/>
        <circle cx="46" cy="26" r="4" fill="#000"/>
        <path d="M 50 48 Q 56 46 60 48" stroke="#654321" strokeWidth="3" fill="none"/>
        <ellipse cx="55" cy="48" rx="6" ry="10" fill="#d4a017" stroke="#654321" strokeWidth="2"/>
      </svg>
    ),
    'Lillipup': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 22 Q 28 18 30 14 L 34 20" fill="#ffe4b5" stroke="#8b6914" strokeWidth="1"/>
        <path d="M 48 22 Q 52 18 50 14 L 46 20" fill="#ffe4b5" stroke="#8b6914" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Vulpix': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <ellipse cx="28" cy="28" rx="5" ry="7" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <ellipse cx="52" cy="28" rx="5" ry="7" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 48 50 Q 54 48 58 50 Q 60 54 56 56" stroke="#ffe4b5" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Ponyta': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 18 Q 30 12 32 8 L 34 16" fill="#ff4444" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 16 Q 38 8 40 4 L 42 14" fill="#ffaa00" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 48 18 Q 50 12 48 8 L 46 16" fill="#ff4444" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Houndour': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#000" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#000" stroke="#505050" strokeWidth="2"/>
        <path d="M 30 24 Q 26 20 28 16 L 32 22" fill="#ff8c00" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 50 24 Q 54 20 52 16 L 48 22" fill="#ff8c00" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#ff0000"/>
        <circle cx="44" cy="30" r="3" fill="#ff0000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#ff8c00" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Torchic': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="16" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="10" fill="#ffe4b5" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 36 18 Q 34 12 36 8" stroke="#ff4444" strokeWidth="2" fill="none"/>
        <path d="M 44 18 Q 46 12 44 8" stroke="#ff4444" strokeWidth="2" fill="none"/>
        <circle cx="36" cy="28" r="2.5" fill="#000"/>
        <circle cx="44" cy="28" r="2.5" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#ff8c00" strokeWidth="2" fill="none"/>
        <path d="M 30 54 L 28 60 M 50 54 L 52 60" stroke="#ff8c00" strokeWidth="2"/>
      </svg>
    ),
    'Chinchou': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="30" cy="20" r="4" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="50" cy="20" r="4" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <path d="M 30 24 L 32 32 M 50 24 L 48 32" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="34" cy="46" r="4" fill="#000"/>
        <circle cx="46" cy="46" r="4" fill="#000"/>
        <path d="M 34 54 Q 40 56 46 54" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Mareep': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="26" cy="26" r="4" fill="#ffd700" opacity="0.6"/>
        <circle cx="32" cy="20" r="3" fill="#ffd700" opacity="0.6"/>
        <circle cx="40" cy="18" r="4" fill="#ffd700" opacity="0.6"/>
        <circle cx="48" cy="20" r="3" fill="#ffd700" opacity="0.6"/>
        <circle cx="54" cy="26" r="4" fill="#ffd700" opacity="0.6"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Elekid': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="16" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="10" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 20 L 28 16 M 48 20 L 52 16" stroke="#000" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="2" fill="none"/>
        <path d="M 30 54 L 28 60 M 50 54 L 52 60" stroke="#d4a017" strokeWidth="2"/>
      </svg>
    ),
    'Hoppip': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="44" r="14" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <circle cx="28" cy="24" r="5" fill="#90ee90" stroke="#228b22" strokeWidth="1.5"/>
        <circle cx="40" cy="20" r="6" fill="#90ee90" stroke="#228b22" strokeWidth="1.5"/>
        <circle cx="52" cy="24" r="5" fill="#90ee90" stroke="#228b22" strokeWidth="1.5"/>
        <circle cx="36" cy="42" r="3" fill="#000"/>
        <circle cx="44" cy="42" r="3" fill="#000"/>
        <path d="M 36 48 Q 40 50 44 48" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Sunkern': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="12" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 35 32 L 32 24 L 36 30" fill="#90ee90" stroke="#228b22" strokeWidth="1"/>
        <path d="M 40 30 L 38 22 L 42 28" fill="#90ee90" stroke="#228b22" strokeWidth="1"/>
        <path d="M 45 32 L 48 24 L 44 30" fill="#90ee90" stroke="#228b22" strokeWidth="1"/>
        <circle cx="36" cy="46" r="2.5" fill="#000"/>
        <circle cx="44" cy="46" r="2.5" fill="#000"/>
        <path d="M 36 52 Q 40 54 44 52" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Spinarak': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="12" fill="#90ee90" stroke="#228b22" strokeWidth="2"/>
        <circle cx="40" cy="32" r="8" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="34" cy="30" r="3" fill="#ff0000"/>
        <circle cx="46" cy="30" r="3" fill="#ff0000"/>
        <path d="M 24 44 L 20 42 M 28 48 L 24 50 M 52 48 L 56 50 M 56 44 L 60 42" stroke="#228b22" strokeWidth="2"/>
        <path d="M 30 54 L 26 58 M 50 54 L 54 58" stroke="#228b22" strokeWidth="2"/>
      </svg>
    ),
    'Skorupi': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="32" r="10" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="36" cy="30" r="3" fill="#ff0000"/>
        <circle cx="44" cy="30" r="3" fill="#ff0000"/>
        <path d="M 50 48 Q 56 46 60 48 Q 62 52 58 54" stroke="#6a0dad" strokeWidth="2" fill="none"/>
        <path d="M 26 54 L 24 60 M 54 54 L 56 60" stroke="#6a0dad" strokeWidth="2"/>
      </svg>
    ),
    'Eevee': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <ellipse cx="28" cy="24" rx="6" ry="10" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <ellipse cx="52" cy="24" rx="6" ry="10" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 50 46 Q 56 44 60 46" stroke="#ffe4b5" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Togepi': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="18" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 30 44 L 28 40 L 32 42" fill="#ff0000" stroke="#cc0000" strokeWidth="1"/>
        <path d="M 40 42 L 38 38 L 42 40" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1"/>
        <path d="M 50 44 L 52 40 L 48 42" fill="#ffd700" stroke="#d4a017" strokeWidth="1"/>
        <circle cx="36" cy="48" r="3" fill="#000"/>
        <circle cx="44" cy="48" r="3" fill="#000"/>
        <path d="M 36 54 Q 40 56 44 54" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Snubbull': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <ellipse cx="28" cy="28" rx="5" ry="8" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1.5"/>
        <ellipse cx="52" cy="28" rx="5" ry="8" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 34 38 L 32 42 M 46 38 L 48 42" stroke="#fff" strokeWidth="2"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Teddiursa': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="28" cy="24" r="5" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="52" cy="24" r="5" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 40 22 Q 38 18 40 14" stroke="#ffe4b5" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Slugma': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="18" fill="#ff8c00" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="10" fill="#ff8c00" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#ffff00"/>
        <circle cx="44" cy="28" r="3" fill="#ffff00"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="30" cy="50" r="4" fill="#ff4444" opacity="0.7"/>
        <circle cx="50" cy="50" r="4" fill="#ff4444" opacity="0.7"/>
      </svg>
    ),
    'Clefairy': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <path d="M 34 20 Q 30 16 32 12 L 36 18" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1"/>
        <path d="M 46 20 Q 50 16 48 12 L 44 18" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Jigglypuff': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="44" r="18" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <path d="M 34 18 Q 30 14 32 10 L 36 16" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1"/>
        <path d="M 46 18 Q 50 14 48 10 L 44 16" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="34" cy="42" r="5" fill="#4169e1"/>
        <circle cx="46" cy="42" r="5" fill="#4169e1"/>
        <circle cx="34" cy="42" r="2" fill="#fff"/>
        <circle cx="46" cy="42" r="2" fill="#fff"/>
        <path d="M 35 50 Q 40 52 45 50" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Phanpy': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="28" cy="28" rx="5" ry="8" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <ellipse cx="52" cy="28" rx="5" ry="8" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <path d="M 40 18 Q 36 12 38 8 Q 40 10 42 8 Q 44 12 40 18" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Spheal': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="46" r="18" fill="#87ceeb" stroke="#4682b4" strokeWidth="2"/>
        <circle cx="34" cy="42" r="4" fill="#000"/>
        <circle cx="46" cy="42" r="4" fill="#000"/>
        <path d="M 35 50 Q 40 52 45 50" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="30" cy="48" r="4" fill="#ff69b4" opacity="0.6"/>
        <circle cx="50" cy="48" r="4" fill="#ff69b4" opacity="0.6"/>
        <path d="M 25 52 Q 22 56 20 60 M 55 52 Q 58 56 60 60" stroke="#4682b4" strokeWidth="2"/>
      </svg>
    ),
    'Spoink': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="16" fill="#000" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="18" r="5" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1.5"/>
        <path d="M 40 23 L 40 34" stroke="#505050" strokeWidth="2"/>
        <circle cx="36" cy="48" r="3" fill="#fff"/>
        <circle cx="44" cy="48" r="3" fill="#fff"/>
        <circle cx="36" cy="48" r="1.5" fill="#000"/>
        <circle cx="44" cy="48" r="1.5" fill="#000"/>
        <path d="M 36 56 Q 40 58 44 56" stroke="#ff69b4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Skitty': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="12" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#ff69b4" stroke="#c41e3a" strokeWidth="2"/>
        <path d="M 32 20 L 28 14 L 32 18" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1"/>
        <path d="M 48 20 L 52 14 L 48 18" fill="#ff69b4" stroke="#c41e3a" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 50 46 Q 56 44 60 46" stroke="#c41e3a" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Deerling': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 20 L 28 14 L 30 18 L 28 20" stroke="#228b22" strokeWidth="2" fill="none"/>
        <path d="M 48 20 L 52 14 L 50 18 L 52 20" stroke="#228b22" strokeWidth="2" fill="none"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <circle cx="36" cy="24" r="2" fill="#ff69b4"/>
        <circle cx="44" cy="24" r="2" fill="#ff69b4"/>
      </svg>
    ),
    'Fletchling': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#ffe4b5" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#ff8c00" strokeWidth="2" fill="none"/>
        <path d="M 24 46 Q 20 44 18 46 L 24 48" fill="#ff8c42" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 56 46 Q 60 44 62 46 L 56 48" fill="#ff8c42" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 22 Q 38 18 40 14" stroke="#d4521a" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Bunnelby': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="10" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <ellipse cx="28" cy="20" rx="5" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <ellipse cx="52" cy="20" rx="5" ry="12" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <rect x="36" y="36" width="8" height="4" fill="#ffe4b5" stroke="#8b6914" strokeWidth="1"/>
        <path d="M 30 54 L 28 60 M 50 54 L 52 60" stroke="#8b6914" strokeWidth="2"/>
      </svg>
    ),
    'Yungoos': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <rect x="36" y="36" width="8" height="4" fill="#ffe4b5" stroke="#8b6914" strokeWidth="1"/>
        <path d="M 50 48 Q 56 46 60 48" stroke="#8b6914" strokeWidth="2" fill="none"/>
        <path d="M 32 22 L 30 18 M 40 20 L 40 16 M 48 22 L 50 18" stroke="#8b6914" strokeWidth="2"/>
      </svg>
    ),
    'Wooloo': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="44" r="18" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="28" cy="36" r="5" fill="#fff" opacity="0.7"/>
        <circle cx="40" cy="32" r="6" fill="#fff" opacity="0.7"/>
        <circle cx="52" cy="36" r="5" fill="#fff" opacity="0.7"/>
        <circle cx="32" cy="48" r="4" fill="#fff" opacity="0.7"/>
        <circle cx="48" cy="48" r="4" fill="#fff" opacity="0.7"/>
        <circle cx="36" cy="42" r="3" fill="#000"/>
        <circle cx="44" cy="42" r="3" fill="#000"/>
        <path d="M 36 48 Q 40 50 44 48" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Skwovet': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="28" cy="28" r="4" fill="#ffe4b5" opacity="0.8"/>
        <circle cx="52" cy="28" r="4" fill="#ffe4b5" opacity="0.8"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <rect x="36" y="36" width="8" height="4" fill="#ffe4b5" stroke="#8b6914" strokeWidth="1"/>
        <path d="M 50 46 Q 56 44 60 46 Q 62 50 58 52" stroke="#8b6914" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Mew': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="2"/>
        <ellipse cx="28" cy="24" rx="6" ry="9" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="1.5"/>
        <ellipse cx="52" cy="24" rx="6" ry="9" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="4" fill="#4169e1"/>
        <circle cx="44" cy="28" r="4" fill="#4169e1"/>
        <circle cx="36" cy="28" r="1.5" fill="#fff"/>
        <circle cx="44" cy="28" r="1.5" fill="#fff"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#ff1493" strokeWidth="1.5" fill="none"/>
        <path d="M 48 50 Q 54 48 60 52" stroke="#ff69b4" strokeWidth="2.5" fill="none"/>
        <ellipse cx="60" cy="52" rx="4" ry="6" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="1.5"/>
      </svg>
    ),
    'Mewtwo': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="20" ry="20" fill="#d8bfd8" stroke="#9370db" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#d8bfd8" stroke="#9370db" strokeWidth="2"/>
        <path d="M 40 10 L 38 4 L 42 6 L 40 10" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="35" cy="26" r="5" fill="#8b00ff"/>
        <circle cx="45" cy="26" r="5" fill="#8b00ff"/>
        <circle cx="35" cy="26" r="2" fill="#fff"/>
        <circle cx="45" cy="26" r="2" fill="#fff"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#6a0dad" strokeWidth="2" fill="none"/>
        <path d="M 20 50 Q 16 48 12 52" stroke="#9370db" strokeWidth="3" fill="none"/>
        <path d="M 60 50 Q 64 48 68 52" stroke="#9370db" strokeWidth="3" fill="none"/>
        <path d="M 40 72 Q 38 78 40 82" stroke="#9370db" strokeWidth="3" fill="none"/>
      </svg>
    ),
    'Snorlax': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="28" ry="24" fill="#4a5d6a" stroke="#2c3e50" strokeWidth="2"/>
        <circle cx="40" cy="28" r="16" fill="#4a5d6a" stroke="#2c3e50" strokeWidth="2"/>
        <ellipse cx="26" cy="26" rx="5" ry="7" fill="#4a5d6a" stroke="#2c3e50" strokeWidth="1.5"/>
        <ellipse cx="54" cy="26" rx="5" ry="7" fill="#4a5d6a" stroke="#2c3e50" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 34 36 Q 40 38 46 36" stroke="#000" strokeWidth="2" fill="none"/>
        <ellipse cx="40" cy="50" rx="18" ry="14" fill="#f5e6d3" stroke="#2c3e50" strokeWidth="2"/>
        <circle cx="30" cy="48" r="2" fill="#2c3e50"/>
        <circle cx="38" cy="52" r="2" fill="#2c3e50"/>
        <circle cx="50" cy="48" r="2" fill="#2c3e50"/>
      </svg>
    ),
    'Klefki': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="30" r="12" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="30" r="6" fill="none" stroke="#505050" strokeWidth="2"/>
        <rect x="38" y="42" width="4" height="20" fill="#a8a8a8" stroke="#505050" strokeWidth="1.5"/>
        <path d="M 32 54 L 28 56 L 30 58 L 34 56 Z" fill="#d4a017" stroke="#8b6914" strokeWidth="1"/>
        <path d="M 48 54 L 52 56 L 50 58 L 46 56 Z" fill="#d4a017" stroke="#8b6914" strokeWidth="1"/>
        <circle cx="36" cy="28" r="2" fill="#4169e1"/>
        <circle cx="44" cy="28" r="2" fill="#4169e1"/>
      </svg>
    ),
    'Cyndaquil': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#ffcc00" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="32" r="12" fill="#ffcc00" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 35 20 Q 32 14 35 10 L 37 18" fill="#ff4444" stroke="#cc0000" strokeWidth="1"/>
        <path d="M 40 18 Q 38 10 40 6 L 42 16" fill="#ff6600" stroke="#cc3300" strokeWidth="1"/>
        <path d="M 45 20 Q 48 14 45 10 L 43 18" fill="#ff4444" stroke="#cc0000" strokeWidth="1"/>
        <circle cx="36" cy="32" r="3" fill="#000"/>
        <circle cx="44" cy="32" r="3" fill="#000"/>
        <path d="M 36 40 Q 40 42 44 40" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Totodile': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 35 18 L 33 14 L 35 16 L 33 12 L 35 14" stroke="#1a75d4" strokeWidth="1.5" fill="none"/>
        <path d="M 40 16 L 38 12 L 40 14 L 38 10 L 40 12" stroke="#1a75d4" strokeWidth="1.5" fill="none"/>
        <path d="M 45 18 L 47 14 L 45 16 L 47 12 L 45 14" stroke="#1a75d4" strokeWidth="1.5" fill="none"/>
        <circle cx="36" cy="28" r="4" fill="#fff"/>
        <circle cx="44" cy="28" r="4" fill="#fff"/>
        <circle cx="36" cy="28" r="2" fill="#000"/>
        <circle cx="44" cy="28" r="2" fill="#000"/>
        <path d="M 32 36 Q 36 40 40 38 Q 44 40 48 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Chikorita': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="16" r="8" fill="#4d9966" stroke="#2d8b2d" strokeWidth="2"/>
        <path d="M 36 12 L 34 8 M 40 10 L 40 6 M 44 12 L 46 8" stroke="#2d8b2d" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Sneasel': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="14" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="2"/>
        <path d="M 32 20 L 28 14 L 30 18" fill="#ff0000" stroke="#cc0000" strokeWidth="1"/>
        <path d="M 48 20 L 52 14 L 50 18" fill="#ff0000" stroke="#cc0000" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 24 46 L 20 50" stroke="#2c2c2c" strokeWidth="2"/>
        <path d="M 56 46 L 60 50" stroke="#2c2c2c" strokeWidth="2"/>
      </svg>
    ),
    'Ralts': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="16" fill="#fff" stroke="#4d9966" strokeWidth="2"/>
        <circle cx="40" cy="26" r="14" fill="#fff" stroke="#4d9966" strokeWidth="2"/>
        <path d="M 30 18 L 26 10 L 28 16" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1"/>
        <path d="M 50 18 L 54 10 L 52 16" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1"/>
        <circle cx="36" cy="26" r="4" fill="#ff0000"/>
        <circle cx="44" cy="26" r="4" fill="#ff0000"/>
        <path d="M 36 34 Q 40 36 44 34" stroke="#4d9966" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Shinx': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 32 20 L 28 14 L 30 18" fill="#000" stroke="#000" strokeWidth="1"/>
        <path d="M 48 20 L 52 14 L 50 18" fill="#000" stroke="#000" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#ffd700"/>
        <circle cx="44" cy="28" r="3" fill="#ffd700"/>
        <path d="M 50 46 Q 56 44 60 46" stroke="#1a75d4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Mudkip': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 35 18 L 30 12 L 33 16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <path d="M 40 16 L 38 10 L 40 14" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <path d="M 45 18 L 50 12 L 47 16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="4" fill="#000"/>
        <circle cx="44" cy="28" r="4" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Treecko': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="14" ry="14" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="36" cy="30" r="4" fill="#ffd700"/>
        <circle cx="44" cy="30" r="4" fill="#ffd700"/>
        <circle cx="36" cy="30" r="2" fill="#000"/>
        <circle cx="44" cy="30" r="2" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 50 50 Q 60 48 65 52" stroke="#2d8b2d" strokeWidth="3" fill="none"/>
      </svg>
    ),
    'Piplup': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="15" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <ellipse cx="28" cy="26" rx="5" ry="8" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <ellipse cx="52" cy="26" rx="5" ry="8" fill="#4da6ff" stroke="#1a75d4" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="4" fill="#fff"/>
        <circle cx="44" cy="28" r="4" fill="#fff"/>
        <circle cx="36" cy="28" r="2" fill="#000"/>
        <circle cx="44" cy="28" r="2" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#ffd700" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Turtwig': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="18" ry="14" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="30" r="12" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="20" r="10" fill="#8b4513" stroke="#5a2d0c" strokeWidth="2"/>
        <path d="M 32 16 L 30 12 M 36 14 L 36 10 M 44 14 L 44 10 M 48 16 L 50 12" stroke="#2d8b2d" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Chimchar': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="15" ry="14" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ffe4b5" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 35 18 Q 32 12 35 8 L 37 16" fill="#ff4444" stroke="#cc0000" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
        <path d="M 48 46 Q 54 44 58 46" stroke="#d4521a" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Tepig': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="17" ry="15" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="30" r="13" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <ellipse cx="32" cy="26" rx="4" ry="6" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <ellipse cx="48" cy="26" rx="4" ry="6" fill="#ff8c42" stroke="#d4521a" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <ellipse cx="40" cy="36" rx="3" ry="2" fill="#ffe4b5"/>
        <path d="M 37 40 Q 40 42 43 40" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Oshawott': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="30" r="13" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="46" r="6" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="4" fill="#000"/>
        <circle cx="44" cy="30" r="4" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Snivy': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="13" ry="14" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <path d="M 30 26 L 24 22 L 28 26" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1"/>
        <path d="M 50 26 L 56 22 L 52 26" fill="#4d9966" stroke="#2d8b2d" strokeWidth="1"/>
        <circle cx="36" cy="30" r="3" fill="#ff0000"/>
        <circle cx="44" cy="30" r="3" fill="#ff0000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Murkrow': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="15" ry="13" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="2"/>
        <path d="M 32 18 L 28 12 L 30 16" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="1"/>
        <path d="M 48 18 L 52 12 L 50 16" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="1"/>
        <circle cx="36" cy="28" r="4" fill="#ffd700"/>
        <circle cx="44" cy="28" r="4" fill="#ffd700"/>
        <path d="M 24 46 Q 18 44 16 48" stroke="#2c2c2c" strokeWidth="2" fill="none"/>
        <path d="M 56 46 Q 62 44 64 48" stroke="#2c2c2c" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Gligar': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 20 44 Q 14 42 12 46" stroke="#6a0dad" strokeWidth="2.5" fill="none"/>
        <path d="M 60 44 Q 66 42 68 46" stroke="#6a0dad" strokeWidth="2.5" fill="none"/>
        <circle cx="36" cy="28" r="4" fill="#ffd700"/>
        <circle cx="44" cy="28" r="4" fill="#ffd700"/>
        <path d="M 40 58 Q 42 64 46 66" stroke="#6a0dad" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Yanma': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="40" rx="14" ry="12" fill="#22c55e" stroke="#16a34a" strokeWidth="2"/>
        <circle cx="34" cy="38" r="6" fill="#ff0000"/>
        <circle cx="46" cy="38" r="6" fill="#ff0000"/>
        <path d="M 20 36 Q 12 32 10 38" stroke="#16a34a" strokeWidth="2" fill="none"/>
        <path d="M 60 36 Q 68 32 70 38" stroke="#16a34a" strokeWidth="2" fill="none"/>
        <path d="M 40 48 L 40 56" stroke="#16a34a" strokeWidth="2"/>
      </svg>
    ),
    'Snorunt': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="42" r="18" fill="#87ceeb" stroke="#4682b4" strokeWidth="2"/>
        <path d="M 35 30 Q 32 26 35 22" fill="#87ceeb" stroke="#4682b4" strokeWidth="1.5"/>
        <path d="M 45 30 Q 48 26 45 22" fill="#87ceeb" stroke="#4682b4" strokeWidth="1.5"/>
        <circle cx="36" cy="40" r="3" fill="#000"/>
        <circle cx="44" cy="40" r="3" fill="#000"/>
        <path d="M 36 48 Q 40 50 44 48" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Aron': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="20" ry="16" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <path d="M 32 20 L 28 14 L 30 18" fill="#505050" stroke="#2c2c2c" strokeWidth="1.5"/>
        <path d="M 48 20 L 52 14 L 50 18" fill="#505050" stroke="#2c2c2c" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#4169e1"/>
        <circle cx="44" cy="28" r="3" fill="#4169e1"/>
        <rect x="34" y="36" width="12" height="4" fill="#505050"/>
      </svg>
    ),
    'Starly': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="12" fill="#8b4513" stroke="#5a2d0c" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#ff8c00" strokeWidth="2" fill="none"/>
        <path d="M 24 46 Q 18 44 16 48" stroke="#5a2d0c" strokeWidth="2" fill="none"/>
        <path d="M 56 46 Q 62 44 64 48" stroke="#5a2d0c" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Buneary': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="13" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="30" r="11" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <ellipse cx="30" cy="14" rx="4" ry="10" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1.5"/>
        <ellipse cx="50" cy="14" rx="4" ry="10" fill="#ffe4b5" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="36" cy="30" r="3" fill="#000"/>
        <circle cx="44" cy="30" r="3" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Glameow': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="12" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <path d="M 32 20 L 28 16 L 30 20" fill="#a8a8a8" stroke="#505050" strokeWidth="1"/>
        <path d="M 48 20 L 52 16 L 50 20" fill="#a8a8a8" stroke="#505050" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#4169e1"/>
        <circle cx="44" cy="28" r="3" fill="#4169e1"/>
        <path d="M 50 46 Q 58 44 62 48" stroke="#505050" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Stunky': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <rect x="36" y="16" width="8" height="8" fill="#fff" stroke="#6a0dad" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 50 46 Q 56 44 60 48" stroke="#6a0dad" strokeWidth="2.5" fill="none"/>
      </svg>
    ),
    'Croagunk': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="34" cy="26" r="5" fill="#ff0000"/>
        <circle cx="46" cy="26" r="5" fill="#ff0000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
        <circle cx="28" cy="50" r="3" fill="#9370db"/>
        <circle cx="52" cy="50" r="3" fill="#9370db"/>
      </svg>
    ),
    'Purrloin': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="13" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 32 20 L 28 14 L 30 18" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <path d="M 48 20 L 52 14 L 50 18" fill="#9370db" stroke="#6a0dad" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#22c55e"/>
        <circle cx="44" cy="28" r="3" fill="#22c55e"/>
        <path d="M 50 46 Q 56 44 60 48" stroke="#6a0dad" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Patrat': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="15" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="34" cy="28" r="5" fill="#ff0000"/>
        <circle cx="46" cy="28" r="5" fill="#ff0000"/>
        <circle cx="34" cy="28" r="2" fill="#000"/>
        <circle cx="46" cy="28" r="2" fill="#000"/>
        <path d="M 36 38 Q 40 40 44 38" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Roggenrola': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="42" r="18" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <circle cx="40" cy="38" r="6" fill="#ffd700" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="28" cy="44" r="4" fill="#6b6b6b"/>
        <circle cx="52" cy="44" r="4" fill="#6b6b6b"/>
        <circle cx="40" cy="52" r="3" fill="#6b6b6b"/>
      </svg>
    ),
    'Tympole': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="16" ry="18" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="36" cy="38" r="4" fill="#000"/>
        <circle cx="44" cy="38" r="4" fill="#000"/>
        <path d="M 36 48 Q 40 50 44 48" stroke="#000" strokeWidth="2" fill="none"/>
        <ellipse cx="40" cy="28" rx="6" ry="4" fill="#ffd700" stroke="#d4a017" strokeWidth="1"/>
      </svg>
    ),
    'Venipede': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="44" rx="18" ry="14" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="36" cy="40" r="3" fill="#ff0000"/>
        <circle cx="44" cy="40" r="3" fill="#ff0000"/>
        <path d="M 28 48 L 26 54 M 34 50 L 32 56 M 46 50 L 48 56 M 52 48 L 54 54" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 32 36 Q 28 34 26 36 M 48 36 Q 52 34 54 36" stroke="#6a0dad" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Sandile': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 22 L 28 18 L 30 22" fill="#000" stroke="#000" strokeWidth="1.5"/>
        <path d="M 48 22 L 52 18 L 50 22" fill="#000" stroke="#000" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 32 36 Q 36 40 40 38 Q 44 40 48 36" stroke="#fff" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Dwebble': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="16" ry="12" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
        <circle cx="30" cy="24" r="4" fill="#6b6b6b"/>
        <circle cx="50" cy="24" r="4" fill="#6b6b6b"/>
        <circle cx="36" cy="50" r="2" fill="#000"/>
        <circle cx="44" cy="50" r="2" fill="#000"/>
        <path d="M 30 54 L 26 58 M 50 54 L 54 58" stroke="#d4521a" strokeWidth="2"/>
      </svg>
    ),
    'Scraggy': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="15" ry="16" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 35 20 Q 32 16 35 12" fill="#ff0000" stroke="#cc0000" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#fff"/>
        <circle cx="44" cy="28" r="3" fill="#fff"/>
        <circle cx="36" cy="28" r="1.5" fill="#000"/>
        <circle cx="44" cy="28" r="1.5" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Gothita': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="14" ry="15" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 32 18 L 28 12 L 30 16" fill="#000" stroke="#000" strokeWidth="1.5"/>
        <path d="M 48 18 L 52 12 L 50 16" fill="#000" stroke="#000" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="4" fill="#4169e1"/>
        <circle cx="44" cy="28" r="4" fill="#4169e1"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Litleo': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="15" ry="13" fill="#ff8c42" stroke="#d4521a" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 18 Q 28 12 32 8 L 34 16" fill="#ff4444" stroke="#cc0000" strokeWidth="1"/>
        <path d="M 48 18 Q 52 12 48 8 L 46 16" fill="#ff4444" stroke="#cc0000" strokeWidth="1"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Skiddo': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="17" ry="15" fill="#7fcc7f" stroke="#2d8b2d" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 32 18 L 28 12 L 30 16" fill="#8b4513" stroke="#5a2d0c" strokeWidth="1.5"/>
        <path d="M 48 18 L 52 12 L 50 16" fill="#8b4513" stroke="#5a2d0c" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <circle cx="40" cy="34" r="2" fill="#000"/>
      </svg>
    ),
    'Pancham': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="14" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="13" fill="#ffe4b5" stroke="#d4a017" strokeWidth="2"/>
        <ellipse cx="30" cy="24" rx="5" ry="7" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="1.5"/>
        <ellipse cx="50" cy="24" rx="5" ry="7" fill="#4a4a4a" stroke="#2c2c2c" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <rect x="36" y="34" width="8" height="3" fill="#4a4a4a"/>
      </svg>
    ),
    'Honedge': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <rect x="36" y="20" width="8" height="40" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <rect x="32" y="18" width="16" height="6" fill="#8b4513" stroke="#5a2d0c" strokeWidth="1.5"/>
        <path d="M 40 58 L 36 68 L 44 68 L 40 58" fill="#a8a8a8" stroke="#505050" strokeWidth="2"/>
        <circle cx="40" cy="40" r="5" fill="#4169e1" stroke="#2563eb" strokeWidth="1.5"/>
        <circle cx="40" cy="40" r="2" fill="#fff"/>
      </svg>
    ),
    'Inkay': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="32" rx="14" ry="12" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="34" cy="30" r="4" fill="#22c55e"/>
        <circle cx="46" cy="30" r="4" fill="#22c55e"/>
        <path d="M 32 44 Q 30 52 28 58" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <path d="M 40 44 Q 40 52 40 58" stroke="#1a75d4" strokeWidth="2" fill="none"/>
        <path d="M 48 44 Q 50 52 52 58" stroke="#1a75d4" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Binacle': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="32" cy="45" rx="10" ry="12" fill="#8b4513" stroke="#5a2d0c" strokeWidth="2"/>
        <ellipse cx="48" cy="45" rx="10" ry="12" fill="#8b4513" stroke="#5a2d0c" strokeWidth="2"/>
        <circle cx="32" cy="42" r="3" fill="#fff"/>
        <circle cx="48" cy="42" r="3" fill="#fff"/>
        <circle cx="32" cy="42" r="1.5" fill="#000"/>
        <circle cx="48" cy="42" r="1.5" fill="#000"/>
        <rect x="36" y="50" width="8" height="16" fill="#8b8b8b" stroke="#4a4a4a" strokeWidth="2"/>
      </svg>
    ),
    'Skrelp': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <path d="M 40 60 Q 36 50 40 40 Q 44 30 40 20" stroke="#9370db" strokeWidth="16" fill="none"/>
        <circle cx="40" cy="22" r="10" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="36" cy="20" r="3" fill="#ffd700"/>
        <circle cx="44" cy="20" r="3" fill="#ffd700"/>
        <path d="M 36 26 Q 40 28 44 26" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Helioptile': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="14" ry="13" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="40" cy="28" r="11" fill="#ffd700" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 28 24 L 22 20 L 26 24" fill="#000" stroke="#000" strokeWidth="1.5"/>
        <path d="M 52 24 L 58 20 L 54 24" fill="#000" stroke="#000" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#000"/>
        <circle cx="44" cy="28" r="3" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Tyrunt': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="18" ry="15" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <circle cx="40" cy="28" r="14" fill="#d4a017" stroke="#8b6914" strokeWidth="2"/>
        <path d="M 32 18 L 28 12 L 30 16" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <path d="M 48 18 L 52 12 L 50 16" fill="#d4a017" stroke="#8b6914" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="3" fill="#ff0000"/>
        <circle cx="44" cy="28" r="3" fill="#ff0000"/>
        <path d="M 32 36 Q 36 40 40 38 Q 44 40 48 36" stroke="#fff" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Amaura': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="16" ry="15" fill="#87ceeb" stroke="#4682b4" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#87ceeb" stroke="#4682b4" strokeWidth="2"/>
        <path d="M 32 18 Q 28 12 32 8" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="1.5"/>
        <path d="M 48 18 Q 52 12 48 8" fill="#ffb3d9" stroke="#ff69b4" strokeWidth="1.5"/>
        <circle cx="36" cy="28" r="4" fill="#000"/>
        <circle cx="44" cy="28" r="4" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Goomy': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="18" ry="16" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="40" cy="28" r="13" fill="#9370db" stroke="#6a0dad" strokeWidth="2" opacity="0.9"/>
        <circle cx="34" cy="26" r="5" fill="#fff"/>
        <circle cx="46" cy="26" r="5" fill="#fff"/>
        <circle cx="34" cy="26" r="2.5" fill="#000"/>
        <circle cx="46" cy="26" r="2.5" fill="#000"/>
        <path d="M 36 36 Q 40 38 44 36" stroke="#000" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Noibat': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="42" rx="13" ry="11" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 22 38 Q 14 34 12 40 Q 16 46 22 42" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <path d="M 58 38 Q 66 34 68 40 Q 64 46 58 42" fill="#9370db" stroke="#6a0dad" strokeWidth="2"/>
        <circle cx="36" cy="40" r="4" fill="#ffd700"/>
        <circle cx="44" cy="40" r="4" fill="#ffd700"/>
        <path d="M 36 48 Q 40 50 44 48" stroke="#000" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    'Entei': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="22" ry="18" fill="#d4521a" stroke="#8b2f0a" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#d4521a" stroke="#8b2f0a" strokeWidth="2"/>
        <path d="M 30 14 Q 26 8 30 4 L 32 12" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <path d="M 40 10 Q 38 4 40 0 L 42 8" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <path d="M 50 14 Q 54 8 50 4 L 48 12" fill="#ffd700" stroke="#d4a017" strokeWidth="1.5"/>
        <circle cx="36" cy="26" r="4" fill="#ff0000"/>
        <circle cx="44" cy="26" r="4" fill="#ff0000"/>
        <rect x="34" y="34" width="12" height="4" fill="#8b4513"/>
      </svg>
    ),
    'Suicune': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="52" rx="22" ry="18" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <circle cx="40" cy="26" r="16" fill="#4da6ff" stroke="#1a75d4" strokeWidth="2"/>
        <path d="M 30 14 Q 26 8 30 4" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <path d="M 40 10 Q 38 4 40 0" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <path d="M 50 14 Q 54 8 50 4" fill="#9370db" stroke="#6a0dad" strokeWidth="1.5"/>
        <circle cx="36" cy="26" r="5" fill="#fff"/>
        <circle cx="44" cy="26" r="5" fill="#fff"/>
        <circle cx="36" cy="26" r="2" fill="#ff0000"/>
        <circle cx="44" cy="26" r="2" fill="#ff0000"/>
      </svg>
    ),
    // New Legendary Pokemon
    'Entei': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="22" ry="18" fill="#8b4513" stroke="#5c2e0a" strokeWidth="2"/>
        <path d="M 30 28 Q 28 22 30 18 L 32 24 L 30 28" fill="#ff6347" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 25 Q 40 18 42 14 L 42 22 L 40 25" fill="#ff8c00" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 50 28 Q 52 22 50 18 L 48 24 L 50 28" fill="#ff6347" stroke="#d4521a" strokeWidth="1"/>
        <rect x="36" y="32" width="8" height="4" fill="#ff4500" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="34" cy="48" r="3" fill="#ff0000"/>
        <circle cx="46" cy="48" r="3" fill="#ff0000"/>
      </svg>
    ),
    'Suicune': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="16" fill="#87ceeb" stroke="#4682b4" strokeWidth="2"/>
        <path d="M 25 32 Q 22 28 25 24 L 28 30 L 25 32" fill="#b0e0e6" stroke="#4682b4" strokeWidth="1"/>
        <path d="M 35 28 Q 34 22 36 18 L 37 26 L 35 28" fill="#add8e6" stroke="#4682b4" strokeWidth="1"/>
        <path d="M 45 28 Q 46 22 44 18 L 43 26 L 45 28" fill="#add8e6" stroke="#4682b4" strokeWidth="1"/>
        <path d="M 55 32 Q 58 28 55 24 L 52 30 L 55 32" fill="#b0e0e6" stroke="#4682b4" strokeWidth="1"/>
        <circle cx="35" cy="46" r="3" fill="#fff"/>
        <circle cx="45" cy="46" r="3" fill="#fff"/>
        <circle cx="35" cy="46" r="1.5" fill="#000"/>
        <circle cx="45" cy="46" r="1.5" fill="#000"/>
      </svg>
    ),
    'Zapdos': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="45" rx="18" ry="20" fill="#ffdd57" stroke="#d4a017" strokeWidth="2"/>
        <path d="M 28 26 L 24 20 L 28 22 L 26 18 L 30 24" fill="#ffd700" stroke="#d4a017" strokeWidth="1"/>
        <path d="M 40 20 L 38 14 L 40 18 L 42 14 L 40 22" fill="#ffff00" stroke="#d4a017" strokeWidth="1"/>
        <path d="M 52 26 L 56 20 L 52 22 L 54 18 L 50 24" fill="#ffd700" stroke="#d4a017" strokeWidth="1"/>
        <circle cx="35" cy="42" r="3" fill="#000"/>
        <circle cx="45" cy="42" r="3" fill="#000"/>
        <path d="M 25 56 L 20 64 M 35 62 L 30 70 M 45 62 L 50 70 M 55 56 L 60 64" stroke="#ffd700" strokeWidth="2.5"/>
      </svg>
    ),
    'Lugia': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="22" fill="#e6e6fa" stroke="#9370db" strokeWidth="2"/>
        <path d="M 25 38 Q 18 36 20 30 L 26 35" fill="#d8bfd8" stroke="#9370db" strokeWidth="1.5"/>
        <path d="M 55 38 Q 62 36 60 30 L 54 35" fill="#d8bfd8" stroke="#9370db" strokeWidth="1.5"/>
        <ellipse cx="40" cy="28" rx="12" ry="14" fill="#f0e6ff" stroke="#9370db" strokeWidth="2"/>
        <circle cx="36" cy="28" r="3" fill="#4169e1"/>
        <circle cx="44" cy="28" r="3" fill="#4169e1"/>
        <path d="M 37 36 Q 40 38 43 36" stroke="#9370db" strokeWidth="2" fill="none"/>
      </svg>
    ),
    'Ho-Oh': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="45" rx="18" ry="22" fill="#ff4500" stroke="#d4521a" strokeWidth="2"/>
        <path d="M 28 24 Q 24 18 26 12 L 30 20 L 28 24" fill="#ff6347" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 40 20 Q 38 12 40 6 L 42 16 L 40 20" fill="#ffd700" stroke="#d4521a" strokeWidth="1"/>
        <path d="M 52 24 Q 56 18 54 12 L 50 20 L 52 24" fill="#ff6347" stroke="#d4521a" strokeWidth="1"/>
        <circle cx="35" cy="42" r="3" fill="#ffd700"/>
        <circle cx="45" cy="42" r="3" fill="#ffd700"/>
        <path d="M 22 56 Q 18 62 14 66 M 32 62 Q 28 68 24 72 M 48 62 Q 52 68 56 72 M 58 56 Q 62 62 66 66" stroke="#ff4500" strokeWidth="2.5"/>
      </svg>
    ),
    'Mewtwo': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="16" ry="20" fill="#dda0dd" stroke="#9370db" strokeWidth="2"/>
        <circle cx="40" cy="28" r="12" fill="#dda0dd" stroke="#9370db" strokeWidth="2"/>
        <circle cx="36" cy="28" r="4" fill="#6a0dad"/>
        <circle cx="44" cy="28" r="4" fill="#6a0dad"/>
        <circle cx="36" cy="28" r="1.5" fill="#fff"/>
        <circle cx="44" cy="28" r="1.5" fill="#fff"/>
        <path d="M 38 36 Q 40 38 42 36" stroke="#9370db" strokeWidth="2" fill="none"/>
        <ellipse cx="40" cy="70" rx="6" ry="12" fill="#c8a2c8" stroke="#9370db" strokeWidth="1.5"/>
      </svg>
    ),
    'Kyogre': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="24" ry="20" fill="#0047ab" stroke="#003366" strokeWidth="2"/>
        <path d="M 25 36 Q 20 34 22 28 L 26 34" fill="#1e90ff" stroke="#003366" strokeWidth="1.5"/>
        <path d="M 55 36 Q 60 34 58 28 L 54 34" fill="#1e90ff" stroke="#003366" strokeWidth="1.5"/>
        <circle cx="34" cy="44" r="4" fill="#ffff00"/>
        <circle cx="46" cy="44" r="4" fill="#ffff00"/>
        <path d="M 30 56 Q 25 60 22 64 M 50 56 Q 55 60 58 64" stroke="#1e90ff" strokeWidth="2.5"/>
      </svg>
    ),
    'Groudon': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="50" rx="24" ry="18" fill="#8b4513" stroke="#5c2e0a" strokeWidth="2"/>
        <path d="M 28 34 L 25 28 L 28 30 L 26 26 L 30 32" fill="#dc143c" stroke="#5c2e0a" strokeWidth="1.5"/>
        <path d="M 40 30 L 38 24 L 40 26 L 42 24 L 40 30" fill="#ff4500" stroke="#5c2e0a" strokeWidth="1.5"/>
        <path d="M 52 34 L 55 28 L 52 30 L 54 26 L 50 32" fill="#dc143c" stroke="#5c2e0a" strokeWidth="1.5"/>
        <circle cx="34" cy="48" r="3" fill="#ffd700"/>
        <circle cx="46" cy="48" r="3" fill="#ffd700"/>
      </svg>
    ),
    'Rayquaza': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="40" rx="8" ry="30" fill="#2e8b57" stroke="#1a4d2e" strokeWidth="2"/>
        <circle cx="40" cy="20" r="10" fill="#2e8b57" stroke="#1a4d2e" strokeWidth="2"/>
        <path d="M 32 14 L 30 8 L 34 12" fill="#ffd700" stroke="#1a4d2e" strokeWidth="1"/>
        <path d="M 48 14 L 50 8 L 46 12" fill="#ffd700" stroke="#1a4d2e" strokeWidth="1"/>
        <circle cx="36" cy="20" r="3" fill="#ffff00"/>
        <circle cx="44" cy="20" r="3" fill="#ffff00"/>
        <path d="M 30 50 Q 26 52 28 56 M 50 50 Q 54 52 52 56" stroke="#ffd700" strokeWidth="2"/>
      </svg>
    ),
    'Dialga': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="18" fill="#4682b4" stroke="#27408b" strokeWidth="2"/>
        <path d="M 30 30 Q 28 24 30 20 L 32 26 L 30 30" fill="#87ceeb" stroke="#27408b" strokeWidth="1.5"/>
        <path d="M 50 30 Q 52 24 50 20 L 48 26 L 50 30" fill="#87ceeb" stroke="#27408b" strokeWidth="1.5"/>
        <rect x="35" y="32" width="10" height="6" fill="#b0c4de" stroke="#27408b" strokeWidth="1.5"/>
        <circle cx="35" cy="46" r="3" fill="#ff0000"/>
        <circle cx="45" cy="46" r="3" fill="#ff0000"/>
      </svg>
    ),
    'Palkia': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="20" ry="18" fill="#dda0dd" stroke="#9370db" strokeWidth="2"/>
        <path d="M 30 30 Q 26 26 28 20 L 32 28" fill="#ee82ee" stroke="#9370db" strokeWidth="1.5"/>
        <path d="M 50 30 Q 54 26 52 20 L 48 28" fill="#ee82ee" stroke="#9370db" strokeWidth="1.5"/>
        <ellipse cx="40" cy="32" rx="8" ry="6" fill="#fff" stroke="#9370db" strokeWidth="1.5"/>
        <circle cx="36" cy="46" r="3" fill="#ff1493"/>
        <circle cx="44" cy="46" r="3" fill="#ff1493"/>
      </svg>
    ),
    'Giratina': (
      <svg width="80" height="80" viewBox="0 0 80 80">
        <ellipse cx="40" cy="48" rx="22" ry="20" fill="#4b0082" stroke="#2f004f" strokeWidth="2"/>
        <path d="M 22 40 Q 16 38 18 32 L 24 38" fill="#8b008b" stroke="#2f004f" strokeWidth="1.5"/>
        <path d="M 58 40 Q 64 38 62 32 L 56 38" fill="#8b008b" stroke="#2f004f" strokeWidth="1.5"/>
        <circle cx="35" cy="44" r="4" fill="#ff0000"/>
        <circle cx="45" cy="44" r="4" fill="#ff0000"/>
        <circle cx="35" cy="44" r="1.5" fill="#fff"/>
        <circle cx="45" cy="44" r="1.5" fill="#fff"/>
      </svg>
    )
  };

  // Return custom sprite if available
  if (pokemonSprites[pokemonName]) {
    return pokemonSprites[pokemonName];
  }
  
  // Fallback generic sprite for Pokemon without custom sprites
  const colors = { Fire: '#ff7f27', Water: '#4488ff', Grass: '#7fcc7f', Poison: '#9370db', Electric: '#ffd700', Normal: '#a8a878' };
  const color = colors[type] || '#888';
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="22" fill={color} stroke="#000" strokeWidth="2"/>
      <circle cx="32" cy="36" r="4" fill="#fff"/>
      <circle cx="48" cy="36" r="4" fill="#fff"/>
      <circle cx="32" cy="36" r="2" fill="#000"/>
      <circle cx="48" cy="36" r="2" fill="#000"/>
      <path d="M 32 48 Q 40 52 48 48" stroke="#000" strokeWidth="2" fill="none"/>
      <text x="40" y="68" fontSize="8" textAnchor="middle" fill="#000" fontWeight="bold">{pokemonName}</text>
    </svg>
  );
};

const generateTrainerSprite = (gymNum) => {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="20" r="12" fill="#ffcc99" stroke="#000" strokeWidth="2"/>
      <rect x="18" y="32" width="24" height="20" fill="#4488ff" stroke="#000" strokeWidth="2"/>
      <text x="30" y="25" fontSize="10" textAnchor="middle" fill="#000">G{gymNum}</text>
    </svg>
  );
};


// ============================================================================
// SECTION 2: GAME DATA
// ============================================================================

// ===== MOVES DATABASE =====
const MOVES = {
  Ember: { type: 'Fire', damage: 12, warmup: 0, cooldown: 2, stamina: 25, cost: 30, effect: null },
  Flamethrower: { type: 'Fire', damage: 26, warmup: 3, cooldown: 4, stamina: 45, cost: 45, effect: { type: 'burn', chance: 0.2, duration: 5, damage: 3 } },
  FireBlast: { type: 'Fire', damage: 35, warmup: 5, cooldown: 6, stamina: 60, cost: 75, effect: { type: 'burn', chance: 0.4, duration: 6, damage: 5 } },
  WaterGun: { type: 'Water', damage: 12, warmup: 0, cooldown: 2, stamina: 25, cost: 30, effect: null },
  Surf: { type: 'Water', damage: 26, warmup: 3, cooldown: 4, stamina: 45, cost: 45, effect: null },
  HydroPump: { type: 'Water', damage: 35, warmup: 5, cooldown: 6, stamina: 60, cost: 75, effect: { type: 'soak', chance: 0.3, duration: 4 } },
  VineWhip: { type: 'Grass', damage: 14, warmup: 0, cooldown: 2, stamina: 25, cost: 30, effect: null },
  RazorLeaf: { type: 'Grass', damage: 26, warmup: 3, cooldown: 4, stamina: 45, cost: 45, effect: null },
  SolarBeam: { type: 'Grass', damage: 35, warmup: 6, cooldown: 5, stamina: 55, cost: 75, effect: { type: 'energize', chance: 0.25, duration: 3, staminaBoost: 5 } },
  PsyBeam: { type: 'Psychic', damage: 11, warmup: 0, cooldown: 2, stamina: 25, cost: 30, effect: { type: 'confuse', chance: 0.3, duration: 3 } },
  Psychic: { type: 'Psychic', damage: 25, warmup: 3, cooldown: 4, stamina: 45, cost: 45, effect: { type: 'confuse', chance: 0.5, duration: 4 } },
  PsychicBlast: { type: 'Psychic', damage: 34, warmup: 5, cooldown: 6, stamina: 60, cost: 75, effect: { type: 'confuse', chance: 0.7, duration: 5 } },
  ThunderShock: { type: 'Electric', damage: 11, warmup: 0, cooldown: 2, stamina: 25, cost: 30, effect: { type: 'paralyze', chance: 0.2, duration: 3 } },
  Thunderbolt: { type: 'Electric', damage: 26, warmup: 3, cooldown: 4, stamina: 45, cost: 45, effect: { type: 'paralyze', chance: 0.3, duration: 4 } },
  Thunder: { type: 'Electric', damage: 35, warmup: 5, cooldown: 6, stamina: 65, cost: 75, effect: { type: 'paralyze', chance: 0.5, duration: 5 } },
  LowKick: { type: 'Fighting', damage: 10, warmup: 0, cooldown: 2, stamina: 20, cost: 25, effect: null },
  KarateChop: { type: 'Fighting', damage: 12, warmup: 0, cooldown: 2, stamina: 25, cost: 30, effect: null },
  Submission: { type: 'Fighting', damage: 28, warmup: 3, cooldown: 4, stamina: 50, cost: 50, effect: { type: 'recoil', damagePercent: 0.1 } },
  BrickBreak: { type: 'Fighting', damage: 26, warmup: 3, cooldown: 4, stamina: 45, cost: 45, effect: null },
  CloseCombat: { type: 'Fighting', damage: 35, warmup: 5, cooldown: 6, stamina: 60, cost: 75, effect: { type: 'recoil', damagePercent: 0.15 } },
  AuraSphere: { type: 'Fighting', damage: 28, warmup: 3, cooldown: 4, stamina: 45, cost: 50, effect: null },
  DrainPunch: { type: 'Fighting', damage: 22, warmup: 2, cooldown: 3, stamina: 35, cost: 42, effect: { type: 'drain', chance: 0.5, duration: 1, healPercent: 0.5 } },
  DynamicPunch: { type: 'Fighting', damage: 30, warmup: 4, cooldown: 5, stamina: 50, cost: 60, effect: { type: 'confuse', chance: 0.5, duration: 3 } },
  Tackle: { type: 'Normal', damage: 7, warmup: 1, cooldown: 2, stamina: 20, cost: 30, effect: null },
  BodySlam: { type: 'Normal', damage: 21, warmup: 2, cooldown: 3, stamina: 42, cost: 35, effect: { type: 'stun', chance: 0.2, duration: 2 } },
  HyperBeam: { type: 'Normal', damage: 38, warmup: 8, cooldown: 8, stamina: 65, cost: 80, effect: { type: 'exhaust', duration: 3 } },
  
  // Legendary Signature Moves
  SacredFire: { type: 'Fire', damage: 38, warmup: 6, cooldown: 6, stamina: 85, cost: 80, effect: { type: 'burn', duration: 2 } },
  Psystrike: { type: 'Psychic', damage: 40, warmup: 7, cooldown: 7, stamina: 90, cost: 85, effect: { type: 'confuse', chance: 1.0, duration: 2 } },
  OriginPulse: { type: 'Water', damage: 39, warmup: 7, cooldown: 6, stamina: 90, cost: 85 },
  PrecipiceBlades: { type: 'Fire', damage: 41, warmup: 8, cooldown: 7, stamina: 95, cost: 88 },
  DragonAscent: { type: 'Grass', damage: 40, warmup: 7, cooldown: 7, stamina: 92, cost: 87 },
  RoarOfTime: { type: 'Fighting', damage: 42, warmup: 8, cooldown: 8, stamina: 100, cost: 90, effect: { type: 'exhaust', duration: 2 } },
  SpacialRend: { type: 'Water', damage: 40, warmup: 7, cooldown: 7, stamina: 92, cost: 87 },
  ShadowForce: { type: 'Psychic', damage: 38, warmup: 6, cooldown: 7, stamina: 88, cost: 82, effect: { type: 'evasion', duration: 1 } },
  
  // New Moves
  IceBeam: { type: 'Water', damage: 28, warmup: 3, cooldown: 4, stamina: 45, cost: 50, effect: { type: 'freeze', chance: 0.25, duration: 3 } },
  Blizzard: { type: 'Water', damage: 36, warmup: 5, cooldown: 6, stamina: 65, cost: 80, effect: { type: 'freeze', chance: 0.4, duration: 4 } },
  LeafBlade: { type: 'Grass', damage: 27, warmup: 2, cooldown: 3, stamina: 40, cost: 48, effect: null },
  GigaDrain: { type: 'Grass', damage: 22, warmup: 3, cooldown: 4, stamina: 35, cost: 45, effect: { type: 'drain', chance: 0.5, duration: 1, healPercent: 0.5 } },
  PowerWhip: { type: 'Grass', damage: 32, warmup: 4, cooldown: 5, stamina: 50, cost: 65, effect: null },
  FireFang: { type: 'Fire', damage: 20, warmup: 1, cooldown: 3, stamina: 30, cost: 40, effect: { type: 'burn', chance: 0.15, duration: 4, damage: 2 } },
  LavaPlume: { type: 'Fire', damage: 30, warmup: 4, cooldown: 5, stamina: 50, cost: 60, effect: { type: 'burn', chance: 0.35, duration: 5, damage: 4 } },
  VoltSwitch: { type: 'Electric', damage: 18, warmup: 1, cooldown: 2, stamina: 25, cost: 35, effect: { type: 'energize', chance: 0.3, duration: 2, staminaBoost: 3 } },
  WildCharge: { type: 'Electric', damage: 32, warmup: 4, cooldown: 5, stamina: 55, cost: 70, effect: { type: 'paralyze', chance: 0.25, duration: 4 } },
  Hypnosis: { type: 'Psychic', damage: 20, warmup: 2, cooldown: 3, stamina: 35, cost: 42, effect: { type: 'sleep', chance: 0.6, duration: 3 } },
  Psyshock: { type: 'Psychic', damage: 28, warmup: 2, cooldown: 3, stamina: 40, cost: 48, effect: { type: 'confuse', chance: 0.35, duration: 4 } },
  ZenHeadbutt: { type: 'Psychic', damage: 24, warmup: 2, cooldown: 4, stamina: 35, cost: 45, effect: { type: 'confuse', chance: 0.25, duration: 3 } },
  QuickAttack: { type: 'Normal', damage: 10, warmup: 0, cooldown: 2, stamina: 22, cost: 30, effect: null },
  ExtremeSpeed: { type: 'Normal', damage: 19, warmup: 0, cooldown: 3, stamina: 38, cost: 52, effect: null },
  DoubleEdge: { type: 'Normal', damage: 34, warmup: 3, cooldown: 5, stamina: 58, cost: 68, effect: { type: 'recoil', damagePercent: 0.25 } },
  StoneEdge: { type: 'Normal', damage: 27, warmup: 3, cooldown: 4, stamina: 48, cost: 58, effect: null },
  PlayRough: { type: 'Normal', damage: 24, warmup: 2, cooldown: 4, stamina: 42, cost: 52, effect: { type: 'confuse', chance: 0.2, duration: 2 } }
};

// ===== HELPER FUNCTIONS =====

/**
 * Calculates base stats for Pokemon based on evolution stages
 * @param rawStats - The raw stat distribution
 * @param evolutionStages - Number of evolution stages (0, 1, or 2)
 * @returns Adjusted stats scaled to appropriate total
 */
const calculateBaseStats = (rawStats, evolutionStages) => {
  let multiplier = EVOLUTION_CONFIG.BASE_STAT_MULTIPLIERS.TWO_EVOLUTIONS;
  
  if (evolutionStages === 0) {
    // Pokemon that never evolve
    multiplier = EVOLUTION_CONFIG.BASE_STAT_MULTIPLIERS.NO_EVOLUTION;
  } else if (evolutionStages === 1) {
    // Pokemon that evolve once
    multiplier = EVOLUTION_CONFIG.BASE_STAT_MULTIPLIERS.ONE_EVOLUTION;
  }
  
  const adjustedStats = {};
  for (const [stat, value] of Object.entries(rawStats)) {
    adjustedStats[stat] = Math.round(value * multiplier);
  }
  
  // Ensure total stats are within bounds for base forms
  const total = Object.values(adjustedStats).reduce((sum, val) => sum + val, 0);
  if (total < 300) {
    const scale = 300 / total;
    for (const stat in adjustedStats) {
      adjustedStats[stat] = Math.round(adjustedStats[stat] * scale);
    }
  } else if (total > 400) {
    const scale = 400 / total;
    for (const stat in adjustedStats) {
      adjustedStats[stat] = Math.round(adjustedStats[stat] * scale);
    }
  }
  
  return adjustedStats;
};


// ===== POKEMON DATABASE =====
const POKEMON = {
  // Original 5 starter pokemons
  Charmander: {
    name: 'Charmander',
    primaryType: 'Fire',
    baseStats: calculateBaseStats({ HP: 93, Attack: 68, Defense: 58, Instinct: 78, Speed: 83 }, 2),
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'BodySlam', 'FireBlast', 'WaterGun', 'ThunderShock'],
    isStarter: true
  },
  Squirtle: {
    name: 'Squirtle',
    primaryType: 'Water',
    baseStats: calculateBaseStats({ HP: 98, Attack: 59, Defense: 66, Instinct: 81, Speed: 76 }, 2),
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'BodySlam', 'HydroPump', 'VineWhip', 'Ember'],
    isStarter: true
  },
  Bulbasaur: {
    name: 'Bulbasaur',
    primaryType: 'Grass',
    baseStats: calculateBaseStats({ HP: 100, Attack: 70, Defense: 70, Instinct: 75, Speed: 65 }, 2),
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'BodySlam', 'SolarBeam', 'WaterGun', 'PsyBeam'],
    isStarter: true
  },
  Pikachu: {
    name: 'Pikachu',
    primaryType: 'Electric',
    baseStats: calculateBaseStats({ HP: 82, Attack: 57, Defense: 52, Instinct: 87, Speed: 102 }, 1),
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'B', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'A',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'BodySlam', 'Thunder', 'HyperBeam', 'Ember'],
    isStarter: true
  },
  Gastly: {
    name: 'Gastly',
    primaryType: 'Psychic',
    baseStats: calculateBaseStats({ HP: 96, Attack: 81, Defense: 61, Instinct: 71, Speed: 71 }, 2),
    typeAptitudes: { Red: 'B', Blue: 'B', Green: 'C', Purple: 'A', Yellow: 'D', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'A',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'BodySlam', 'PsychicBlast', 'VineWhip', 'ThunderShock'],
    isStarter: true
  },
  
  // 25 Additional Wild Pokemons
  Growlithe: {
    name: 'Growlithe',
    primaryType: 'Fire',
    baseStats: calculateBaseStats({ HP: 88, Attack: 78, Defense: 53, Instinct: 73, Speed: 88 }, 1),
    typeAptitudes: { Red: 'A', Blue: 'E', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam']
  },
  Arcanine: {
    name: 'Arcanine',
    primaryType: 'Fire',
    baseStats: { HP: 106, Attack: 86, Defense: 71, Instinct: 61, Speed: 56 },
    typeAptitudes: { Red: 'S', Blue: 'D', Green: 'B', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'A',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam']
  },
  Golduck: {
    name: 'Golduck',
    primaryType: 'Water',
    baseStats: { HP: 91, Attack: 61, Defense: 76, Instinct: 86, Speed: 66 },
    typeAptitudes: { Red: 'D', Blue: 'A', Green: 'E', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam']
  },
  Lapras: {
    name: 'Lapras',
    primaryType: 'Water',
    baseStats: calculateBaseStats({ HP: 111, Attack: 66, Defense: 81, Instinct: 76, Speed: 46 }, 0),
    typeAptitudes: { Red: 'C', Blue: 'S', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'A',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam']
  },
  Victreebel: {
    name: 'Victreebel',
    primaryType: 'Grass',
    baseStats: { HP: 96, Attack: 76, Defense: 81, Instinct: 66, Speed: 61 },
    typeAptitudes: { Red: 'E', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam']
  },
  Vileplume: {
    name: 'Vileplume',
    primaryType: 'Grass',
    baseStats: { HP: 81, Attack: 66, Defense: 66, Instinct: 81, Speed: 86 },
    typeAptitudes: { Red: 'D', Blue: 'B', Green: 'A', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam']
  },
  Zapdos: {
    name: 'Zapdos',
    primaryType: 'Electric',
    baseStats: calculateBaseStats({ HP: 76, Attack: 61, Defense: 56, Instinct: 91, Speed: 96 }, 0),
    typeAptitudes: { Red: 'C', Blue: 'B', Green: 'C', Purple: 'B', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'A',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam']
  },
  Raichu: {
    name: 'Raichu',
    primaryType: 'Electric',
    baseStats: { HP: 86, Attack: 71, Defense: 61, Instinct: 81, Speed: 81 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'B', Purple: 'D', Yellow: 'S', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'A',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam']
  },
  Arbok: {
    name: 'Arbok',
    primaryType: 'Psychic',
    baseStats: { HP: 91, Attack: 86, Defense: 66, Instinct: 76, Speed: 61 },
    typeAptitudes: { Red: 'C', Blue: 'B', Green: 'D', Purple: 'A', Yellow: 'E', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam']
  },
  Nidoking: {
    name: 'Nidoking',
    primaryType: 'Psychic',
    baseStats: { HP: 81, Attack: 91, Defense: 71, Instinct: 66, Speed: 71 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'C', Purple: 'S', Yellow: 'D', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'A',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam']
  },
  Rapidash: {
    name: 'Rapidash',
    primaryType: 'Fire',
    baseStats: { HP: 96, Attack: 81, Defense: 61, Instinct: 76, Speed: 66 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'B', Purple: 'C', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam']
  },
  Starmie: {
    name: 'Starmie',
    primaryType: 'Water',
    baseStats: { HP: 86, Attack: 71, Defense: 86, Instinct: 71, Speed: 66 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam']
  },
  Exeggutor: {
    name: 'Exeggutor',
    primaryType: 'Grass',
    baseStats: { HP: 91, Attack: 61, Defense: 76, Instinct: 86, Speed: 66 },
    typeAptitudes: { Red: 'D', Blue: 'B', Green: 'A', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'A',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam']
  },
  Jolteon: {
    name: 'Jolteon',
    primaryType: 'Electric',
    baseStats: { HP: 81, Attack: 64, Defense: 57, Instinct: 87, Speed: 91 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'B', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam']
  },
  Muk: {
    name: 'Muk',
    primaryType: 'Psychic',
    baseStats: { HP: 101, Attack: 76, Defense: 66, Instinct: 81, Speed: 56 },
    typeAptitudes: { Red: 'B', Blue: 'B', Green: 'C', Purple: 'A', Yellow: 'E', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam']
  },
  Magmar: {
    name: 'Magmar',
    primaryType: 'Fire',
    baseStats: { HP: 99, Attack: 89, Defense: 66, Instinct: 69, Speed: 57 },
    typeAptitudes: { Red: 'S', Blue: 'E', Green: 'C', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam']
  },
  Vaporeon: {
    name: 'Vaporeon',
    primaryType: 'Water',
    baseStats: { HP: 93, Attack: 69, Defense: 79, Instinct: 79, Speed: 60 },
    typeAptitudes: { Red: 'D', Blue: 'A', Green: 'E', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'A',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam']
  },
  Tangela: {
    name: 'Tangela',
    primaryType: 'Grass',
    baseStats: { HP: 89, Attack: 83, Defense: 69, Instinct: 73, Speed: 66 },
    typeAptitudes: { Red: 'E', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam']
  },
  Electabuzz: {
    name: 'Electabuzz',
    primaryType: 'Electric',
    baseStats: { HP: 85, Attack: 71, Defense: 61, Instinct: 83, Speed: 80 },
    typeAptitudes: { Red: 'C', Blue: 'B', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam']
  },
  Weezing: {
    name: 'Weezing',
    primaryType: 'Psychic',
    baseStats: { HP: 94, Attack: 79, Defense: 69, Instinct: 75, Speed: 63 },
    typeAptitudes: { Red: 'C', Blue: 'B', Green: 'D', Purple: 'A', Yellow: 'D', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'A',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam']
  },
  Flareon: {
    name: 'Flareon',
    primaryType: 'Fire',
    baseStats: { HP: 88, Attack: 84, Defense: 59, Instinct: 73, Speed: 76 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'A',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam']
  },
  Cloyster: {
    name: 'Cloyster',
    primaryType: 'Water',
    baseStats: { HP: 92, Attack: 65, Defense: 73, Instinct: 83, Speed: 67 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam']
  },
  Parasect: {
    name: 'Parasect',
    primaryType: 'Grass',
    baseStats: { HP: 85, Attack: 79, Defense: 73, Instinct: 77, Speed: 66 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam']
  },
  Magneton: {
    name: 'Magneton',
    primaryType: 'Electric',
    baseStats: { HP: 79, Attack: 69, Defense: 55, Instinct: 93, Speed: 94 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'B', Purple: 'D', Yellow: 'S', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'A',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam']
  },
  Tentacruel: {
    name: 'Tentacruel',
    primaryType: 'Psychic',
    baseStats: { HP: 97, Attack: 75, Defense: 71, Instinct: 69, Speed: 68 },
    typeAptitudes: { Red: 'B', Blue: 'A', Green: 'C', Purple: 'A', Yellow: 'E', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam']
  },
  Mew: {
    name: 'Mew',
    primaryType: 'Normal',
    baseStats: calculateBaseStats({ HP: 100, Attack: 100, Defense: 100, Instinct: 100, Speed: 100 }, 0),
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'A', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['Tackle', 'Ember'],
    learnableAbilities: ['BodySlam', 'HyperBeam', 'Flamethrower', 'Surf', 'RazorLeaf', 'Thunderbolt', 'Psychic']
  },
  Mewtwo: {
    name: 'Mewtwo',
    primaryType: 'Psychic',
    baseStats: calculateBaseStats({ HP: 106, Attack: 110, Defense: 90, Instinct: 154, Speed: 130 }, 0),
    typeAptitudes: { Red: 'S', Blue: 'S', Green: 'S', Purple: 'S', Yellow: 'S', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'UU',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['BodySlam', 'HyperBeam', 'Flamethrower', 'FireBlast', 'Surf', 'HydroPump', 'RazorLeaf', 'SolarBeam', 'Thunderbolt', 'Thunder', 'Psychic', 'PsychicBlast']
  },
  Snorlax: {
    name: 'Snorlax',
    primaryType: 'Normal',
    baseStats: calculateBaseStats({ HP: 160, Attack: 110, Defense: 65, Instinct: 65, Speed: 30 }, 0),
    typeAptitudes: { Red: 'B', Blue: 'B', Green: 'B', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'A',
    defaultAbilities: ['Tackle', 'BodySlam'],
    learnableAbilities: ['HyperBeam', 'Ember', 'WaterGun', 'VineWhip', 'ThunderShock']
  },
  
  // Common Tier Gacha Pokemon
  Rattata: {
    name: 'Rattata',
    primaryType: 'Normal',
    baseStats: { HP: 84, Attack: 69, Defense: 59, Instinct: 74, Speed: 94 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Meowth: {
    name: 'Meowth',
    primaryType: 'Normal',
    baseStats: { HP: 85, Attack: 70, Defense: 60, Instinct: 75, Speed: 90 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Sandshrew: {
    name: 'Sandshrew',
    primaryType: 'Normal',
    baseStats: { HP: 88, Attack: 83, Defense: 88, Instinct: 63, Speed: 58 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Psyduck: {
    name: 'Psyduck',
    primaryType: 'Water',
    baseStats: { HP: 91, Attack: 66, Defense: 66, Instinct: 81, Speed: 76 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'BodySlam']
  },
  Poliwag: {
    name: 'Poliwag',
    primaryType: 'Water',
    baseStats: { HP: 89, Attack: 64, Defense: 64, Instinct: 74, Speed: 89 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'BodySlam']
  },
  Tentacool: {
    name: 'Tentacool',
    primaryType: 'Water',
    baseStats: { HP: 90, Attack: 68, Defense: 65, Instinct: 72, Speed: 85 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'PsyBeam', 'BodySlam']
  },
  Shellder: {
    name: 'Shellder',
    primaryType: 'Water',
    baseStats: { HP: 82, Attack: 77, Defense: 97, Instinct: 67, Speed: 57 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'BodySlam']
  },
  Krabby: {
    name: 'Krabby',
    primaryType: 'Water',
    baseStats: { HP: 78, Attack: 98, Defense: 88, Instinct: 58, Speed: 58 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'BodySlam']
  },
  Oddish: {
    name: 'Oddish',
    primaryType: 'Grass',
    baseStats: { HP: 89, Attack: 69, Defense: 74, Instinct: 79, Speed: 69 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'PsyBeam', 'BodySlam']
  },
  Bellsprout: {
    name: 'Bellsprout',
    primaryType: 'Grass',
    baseStats: { HP: 80, Attack: 85, Defense: 55, Instinct: 80, Speed: 80 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'PsyBeam', 'BodySlam']
  },
  Paras: {
    name: 'Paras',
    primaryType: 'Grass',
    baseStats: { HP: 79, Attack: 84, Defense: 74, Instinct: 74, Speed: 69 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'BodySlam']
  },
  Zubat: {
    name: 'Zubat',
    primaryType: 'Psychic',
    baseStats: { HP: 84, Attack: 69, Defense: 59, Instinct: 74, Speed: 94 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'BodySlam']
  },
  Grimer: {
    name: 'Grimer',
    primaryType: 'Psychic',
    baseStats: { HP: 92, Attack: 82, Defense: 67, Instinct: 77, Speed: 62 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'D', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'BodySlam']
  },
  Koffing: {
    name: 'Koffing',
    primaryType: 'Psychic',
    baseStats: { HP: 88, Attack: 78, Defense: 73, Instinct: 73, Speed: 68 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'D', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'BodySlam']
  },
  Voltorb: {
    name: 'Voltorb',
    primaryType: 'Electric',
    baseStats: { HP: 81, Attack: 66, Defense: 66, Instinct: 76, Speed: 91 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'BodySlam']
  },
  Magnemite: {
    name: 'Magnemite',
    primaryType: 'Electric',
    baseStats: { HP: 76, Attack: 71, Defense: 76, Instinct: 81, Speed: 76 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'BodySlam']
  },
  Sentret: {
    name: 'Sentret',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 71, Defense: 66, Instinct: 76, Speed: 86 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Zigzagoon: {
    name: 'Zigzagoon',
    primaryType: 'Normal',
    baseStats: { HP: 84, Attack: 68, Defense: 66, Instinct: 76, Speed: 86 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Bidoof: {
    name: 'Bidoof',
    primaryType: 'Normal',
    baseStats: { HP: 90, Attack: 73, Defense: 71, Instinct: 70, Speed: 76 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Lillipup: {
    name: 'Lillipup',
    primaryType: 'Normal',
    baseStats: { HP: 85, Attack: 75, Defense: 67, Instinct: 73, Speed: 80 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  
  // Uncommon Tier Gacha Pokemon
  Vulpix: {
    name: 'Vulpix',
    primaryType: 'Fire',
    baseStats: { HP: 84, Attack: 64, Defense: 62, Instinct: 84, Speed: 86 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'BodySlam']
  },
  Ponyta: {
    name: 'Ponyta',
    primaryType: 'Fire',
    baseStats: { HP: 83, Attack: 83, Defense: 63, Instinct: 68, Speed: 83 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'BodySlam']
  },
  Houndour: {
    name: 'Houndour',
    primaryType: 'Fire',
    baseStats: { HP: 79, Attack: 79, Defense: 59, Instinct: 84, Speed: 79 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'PsyBeam', 'BodySlam']
  },
  Torchic: {
    name: 'Torchic',
    primaryType: 'Fire',
    baseStats: { HP: 81, Attack: 76, Defense: 61, Instinct: 79, Speed: 83 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'BodySlam']
  },
  Chinchou: {
    name: 'Chinchou',
    primaryType: 'Water',
    baseStats: { HP: 85, Attack: 65, Defense: 73, Instinct: 81, Speed: 76 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'ThunderShock', 'BodySlam']
  },
  Mareep: {
    name: 'Mareep',
    primaryType: 'Electric',
    baseStats: { HP: 83, Attack: 65, Defense: 63, Instinct: 85, Speed: 84 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'BodySlam']
  },
  Elekid: {
    name: 'Elekid',
    primaryType: 'Electric',
    baseStats: { HP: 79, Attack: 77, Defense: 59, Instinct: 81, Speed: 84 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'BodySlam']
  },
  Hoppip: {
    name: 'Hoppip',
    primaryType: 'Grass',
    baseStats: { HP: 77, Attack: 62, Defense: 65, Instinct: 87, Speed: 89 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'BodySlam']
  },
  Sunkern: {
    name: 'Sunkern',
    primaryType: 'Grass',
    baseStats: { HP: 82, Attack: 67, Defense: 72, Instinct: 77, Speed: 82 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'BodySlam']
  },
  Spinarak: {
    name: 'Spinarak',
    primaryType: 'Psychic',
    baseStats: { HP: 85, Attack: 76, Defense: 64, Instinct: 74, Speed: 81 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'BodySlam']
  },
  Skorupi: {
    name: 'Skorupi',
    primaryType: 'Psychic',
    baseStats: { HP: 79, Attack: 77, Defense: 84, Instinct: 69, Speed: 71 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'BodySlam']
  },
  Eevee: {
    name: 'Eevee',
    primaryType: 'Normal',
    baseStats: { HP: 79, Attack: 69, Defense: 66, Instinct: 83, Speed: 83 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Togepi: {
    name: 'Togepi',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 62, Defense: 75, Instinct: 87, Speed: 79 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Snubbull: {
    name: 'Snubbull',
    primaryType: 'Normal',
    baseStats: { HP: 83, Attack: 86, Defense: 66, Instinct: 71, Speed: 74 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Teddiursa: {
    name: 'Teddiursa',
    primaryType: 'Normal',
    baseStats: { HP: 83, Attack: 81, Defense: 66, Instinct: 73, Speed: 77 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  
  // Rare Tier Gacha Pokemon
  Slugma: {
    name: 'Slugma',
    primaryType: 'Fire',
    baseStats: { HP: 89, Attack: 69, Defense: 67, Instinct: 84, Speed: 71 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'BodySlam']
  },
  Clefairy: {
    name: 'Clefairy',
    primaryType: 'Normal',
    baseStats: { HP: 87, Attack: 61, Defense: 69, Instinct: 84, Speed: 79 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Jigglypuff: {
    name: 'Jigglypuff',
    primaryType: 'Normal',
    baseStats: { HP: 109, Attack: 64, Defense: 62, Instinct: 79, Speed: 66 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Phanpy: {
    name: 'Phanpy',
    primaryType: 'Normal',
    baseStats: { HP: 84, Attack: 79, Defense: 77, Instinct: 67, Speed: 73 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Spheal: {
    name: 'Spheal',
    primaryType: 'Water',
    baseStats: { HP: 93, Attack: 65, Defense: 70, Instinct: 83, Speed: 69 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'BodySlam']
  },
  Spoink: {
    name: 'Spoink',
    primaryType: 'Normal',
    baseStats: { HP: 83, Attack: 66, Defense: 69, Instinct: 86, Speed: 76 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Skitty: {
    name: 'Skitty',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 65, Defense: 63, Instinct: 83, Speed: 88 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam']
  },
  Deerling: {
    name: 'Deerling',
    primaryType: 'Grass',
    baseStats: { HP: 81, Attack: 71, Defense: 67, Instinct: 77, Speed: 84 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'BodySlam']
  },
  
  // Legendary Tier Gacha Pokemon (already defined as starters)
  Fletchling: {
    name: 'Fletchling',
    primaryType: 'Fire',
    baseStats: { HP: 79, Attack: 69, Defense: 59, Instinct: 81, Speed: 92 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'BodySlam'],
    isStarter: true
  },
  Bunnelby: {
    name: 'Bunnelby',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 75, Defense: 59, Instinct: 77, Speed: 88 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam'],
    isStarter: true
  },
  Yungoos: {
    name: 'Yungoos',
    primaryType: 'Normal',
    baseStats: { HP: 83, Attack: 79, Defense: 65, Instinct: 75, Speed: 78 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam'],
    isStarter: true
  },
  Wooloo: {
    name: 'Wooloo',
    primaryType: 'Normal',
    baseStats: { HP: 89, Attack: 65, Defense: 75, Instinct: 79, Speed: 72 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam'],
    isStarter: true
  },
  Skwovet: {
    name: 'Skwovet',
    primaryType: 'Normal',
    baseStats: { HP: 85, Attack: 69, Defense: 67, Instinct: 77, Speed: 82 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['BodySlam'],
    isStarter: true
  },
  
  // New Gen 2-6 Pokemon (50 total)
  Cyndaquil: {
    name: 'Cyndaquil',
    primaryType: 'Fire',
    baseStats: calculateBaseStats({ HP: 95, Attack: 66, Defense: 56, Instinct: 76, Speed: 87 }, 2),
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'QuickAttack'],
    learnableAbilities: ['Flamethrower', 'FireFang', 'FireBlast']
  },
  Totodile: {
    name: 'Totodile',
    primaryType: 'Water',
    baseStats: calculateBaseStats({ HP: 100, Attack: 69, Defense: 64, Instinct: 71, Speed: 76 }, 2),
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'IceBeam', 'HydroPump']
  },
  Chikorita: {
    name: 'Chikorita',
    primaryType: 'Grass',
    baseStats: calculateBaseStats({ HP: 98, Attack: 59, Defense: 67, Instinct: 78, Speed: 78 }, 2),
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'LeafBlade', 'SolarBeam']
  },
  Torchic: {
    name: 'Torchic',
    primaryType: 'Fire',
    baseStats: calculateBaseStats({ HP: 91, Attack: 71, Defense: 57, Instinct: 76, Speed: 85 }, 2),
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'QuickAttack'],
    learnableAbilities: ['Flamethrower', 'FireFang', 'LavaPlume']
  },
  Mudkip: {
    name: 'Mudkip',
    primaryType: 'Water',
    baseStats: calculateBaseStats({ HP: 100, Attack: 63, Defense: 66, Instinct: 73, Speed: 78 }, 2),
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'IceBeam', 'HydroPump']
  },
  Treecko: {
    name: 'Treecko',
    primaryType: 'Grass',
    baseStats: calculateBaseStats({ HP: 90, Attack: 65, Defense: 61, Instinct: 79, Speed: 85 }, 2),
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'QuickAttack'],
    learnableAbilities: ['LeafBlade', 'GigaDrain', 'SolarBeam']
  },
  Piplup: {
    name: 'Piplup',
    primaryType: 'Water',
    baseStats: calculateBaseStats({ HP: 97, Attack: 61, Defense: 67, Instinct: 77, Speed: 78 }, 2),
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'IceBeam', 'Blizzard']
  },
  Turtwig: {
    name: 'Turtwig',
    primaryType: 'Grass',
    baseStats: calculateBaseStats({ HP: 101, Attack: 61, Defense: 70, Instinct: 75, Speed: 73 }, 2),
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['LeafBlade', 'PowerWhip', 'SolarBeam']
  },
  Chimchar: {
    name: 'Chimchar',
    primaryType: 'Fire',
    baseStats: calculateBaseStats({ HP: 93, Attack: 66, Defense: 58, Instinct: 78, Speed: 85 }, 2),
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'QuickAttack'],
    learnableAbilities: ['Flamethrower', 'LavaPlume', 'FireBlast']
  },
  Tepig: {
    name: 'Tepig',
    primaryType: 'Fire',
    baseStats: calculateBaseStats({ HP: 99, Attack: 68, Defense: 61, Instinct: 71, Speed: 81 }, 2),
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireFang', 'LavaPlume']
  },
  Oshawott: {
    name: 'Oshawott',
    primaryType: 'Water',
    baseStats: calculateBaseStats({ HP: 97, Attack: 65, Defense: 63, Instinct: 75, Speed: 80 }, 2),
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'QuickAttack'],
    learnableAbilities: ['Surf', 'IceBeam', 'HydroPump']
  },
  Snivy: {
    name: 'Snivy',
    primaryType: 'Grass',
    baseStats: calculateBaseStats({ HP: 91, Attack: 61, Defense: 67, Instinct: 81, Speed: 80 }, 2),
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'B', Yellow: 'B', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'QuickAttack'],
    learnableAbilities: ['LeafBlade', 'GigaDrain', 'SolarBeam']
  },
  Klefki: {
    name: 'Klefki',
    primaryType: 'Normal',
    baseStats: { HP: 79, Attack: 71, Defense: 85, Instinct: 82, Speed: 83 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'B', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Sneasel: {
    name: 'Sneasel',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 85, Defense: 63, Instinct: 79, Speed: 96 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'A',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['ExtremeSpeed', 'PlayRough']
  },
  Murkrow: {
    name: 'Murkrow',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 81, Defense: 58, Instinct: 81, Speed: 99 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['ExtremeSpeed', 'BodySlam']
  },
  Gligar: {
    name: 'Gligar',
    primaryType: 'Psychic',
    baseStats: { HP: 83, Attack: 77, Defense: 81, Instinct: 73, Speed: 86 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'QuickAttack'],
    learnableAbilities: ['ZenHeadbutt', 'Psyshock']
  },
  Yanma: {
    name: 'Yanma',
    primaryType: 'Normal',
    baseStats: { HP: 78, Attack: 69, Defense: 59, Instinct: 83, Speed: 111 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'B', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['ExtremeSpeed', 'DoubleEdge']
  },
  Snorunt: {
    name: 'Snorunt',
    primaryType: 'Water',
    baseStats: { HP: 81, Attack: 69, Defense: 69, Instinct: 79, Speed: 82 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['IceBeam', 'Blizzard']
  },
  Aron: {
    name: 'Aron',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 75, Defense: 95, Instinct: 67, Speed: 62 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['StoneEdge', 'BodySlam']
  },
  Ralts: {
    name: 'Ralts',
    primaryType: 'Normal',
    baseStats: { HP: 73, Attack: 63, Defense: 63, Instinct: 91, Speed: 90 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Shinx: {
    name: 'Shinx',
    primaryType: 'Electric',
    baseStats: { HP: 77, Attack: 75, Defense: 67, Instinct: 79, Speed: 82 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'QuickAttack'],
    learnableAbilities: ['VoltSwitch', 'Thunderbolt', 'WildCharge']
  },
  Starly: {
    name: 'Starly',
    primaryType: 'Normal',
    baseStats: { HP: 75, Attack: 69, Defense: 57, Instinct: 75, Speed: 104 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['ExtremeSpeed', 'DoubleEdge']
  },
  Buneary: {
    name: 'Buneary',
    primaryType: 'Normal',
    baseStats: { HP: 79, Attack: 77, Defense: 65, Instinct: 77, Speed: 82 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['PlayRough', 'DoubleEdge']
  },
  Glameow: {
    name: 'Glameow',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 73, Defense: 65, Instinct: 79, Speed: 86 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Stunky: {
    name: 'Stunky',
    primaryType: 'Psychic',
    baseStats: { HP: 81, Attack: 77, Defense: 65, Instinct: 75, Speed: 82 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Hypnosis', 'Psychic']
  },
  Croagunk: {
    name: 'Croagunk',
    primaryType: 'Psychic',
    baseStats: { HP: 77, Attack: 77, Defense: 65, Instinct: 77, Speed: 84 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'QuickAttack'],
    learnableAbilities: ['Psyshock', 'ZenHeadbutt']
  },
  Purrloin: {
    name: 'Purrloin',
    primaryType: 'Normal',
    baseStats: { HP: 75, Attack: 73, Defense: 62, Instinct: 81, Speed: 89 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Patrat: {
    name: 'Patrat',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 73, Defense: 65, Instinct: 75, Speed: 90 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['ExtremeSpeed', 'BodySlam']
  },
  Roggenrola: {
    name: 'Roggenrola',
    primaryType: 'Normal',
    baseStats: { HP: 79, Attack: 73, Defense: 91, Instinct: 63, Speed: 74 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['StoneEdge', 'BodySlam']
  },
  Tympole: {
    name: 'Tympole',
    primaryType: 'Water',
    baseStats: { HP: 81, Attack: 67, Defense: 65, Instinct: 77, Speed: 90 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'IceBeam']
  },
  Venipede: {
    name: 'Venipede',
    primaryType: 'Psychic',
    baseStats: { HP: 77, Attack: 73, Defense: 75, Instinct: 71, Speed: 84 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Hypnosis', 'Psychic']
  },
  Sandile: {
    name: 'Sandile',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 79, Defense: 65, Instinct: 75, Speed: 80 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle', 'QuickAttack'],
    learnableAbilities: ['StoneEdge', 'BodySlam']
  },
  Dwebble: {
    name: 'Dwebble',
    primaryType: 'Normal',
    baseStats: { HP: 75, Attack: 73, Defense: 91, Instinct: 67, Speed: 74 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['StoneEdge', 'BodySlam']
  },
  Scraggy: {
    name: 'Scraggy',
    primaryType: 'Normal',
    baseStats: { HP: 81, Attack: 83, Defense: 85, Instinct: 67, Speed: 64 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Gothita: {
    name: 'Gothita',
    primaryType: 'Normal',
    baseStats: { HP: 75, Attack: 63, Defense: 71, Instinct: 87, Speed: 84 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Litleo: {
    name: 'Litleo',
    primaryType: 'Fire',
    baseStats: { HP: 79, Attack: 73, Defense: 67, Instinct: 83, Speed: 78 },
    typeAptitudes: { Red: 'A', Blue: 'D', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Ember', 'QuickAttack'],
    learnableAbilities: ['FireFang', 'Flamethrower']
  },
  Skiddo: {
    name: 'Skiddo',
    primaryType: 'Grass',
    baseStats: { HP: 83, Attack: 75, Defense: 79, Instinct: 73, Speed: 70 },
    typeAptitudes: { Red: 'D', Blue: 'C', Green: 'A', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['LeafBlade', 'PowerWhip']
  },
  Pancham: {
    name: 'Pancham',
    primaryType: 'Normal',
    baseStats: { HP: 83, Attack: 85, Defense: 67, Instinct: 71, Speed: 74 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Honedge: {
    name: 'Honedge',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 85, Defense: 95, Instinct: 69, Speed: 54 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['StoneEdge', 'BodySlam']
  },
  Inkay: {
    name: 'Inkay',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 71, Defense: 69, Instinct: 83, Speed: 80 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Binacle: {
    name: 'Binacle',
    primaryType: 'Water',
    baseStats: { HP: 77, Attack: 77, Defense: 85, Instinct: 71, Speed: 70 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'IceBeam']
  },
  Skrelp: {
    name: 'Skrelp',
    primaryType: 'Psychic',
    baseStats: { HP: 75, Attack: 71, Defense: 85, Instinct: 79, Speed: 70 },
    typeAptitudes: { Red: 'C', Blue: 'B', Green: 'C', Purple: 'A', Yellow: 'C', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'B',
    defaultAbilities: ['PsyBeam', 'WaterGun'],
    learnableAbilities: ['Hypnosis', 'Psychic']
  },
  Helioptile: {
    name: 'Helioptile',
    primaryType: 'Electric',
    baseStats: { HP: 75, Attack: 67, Defense: 63, Instinct: 83, Speed: 92 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['ThunderShock', 'QuickAttack'],
    learnableAbilities: ['VoltSwitch', 'Thunderbolt']
  },
  Tyrunt: {
    name: 'Tyrunt',
    primaryType: 'Normal',
    baseStats: { HP: 83, Attack: 85, Defense: 71, Instinct: 69, Speed: 72 },
    typeAptitudes: { Red: 'B', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['StoneEdge', 'DoubleEdge']
  },
  Amaura: {
    name: 'Amaura',
    primaryType: 'Water',
    baseStats: { HP: 87, Attack: 63, Defense: 69, Instinct: 81, Speed: 80 },
    typeAptitudes: { Red: 'C', Blue: 'A', Green: 'D', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['IceBeam', 'Blizzard']
  },
  Goomy: {
    name: 'Goomy',
    primaryType: 'Normal',
    baseStats: { HP: 77, Attack: 69, Defense: 63, Instinct: 83, Speed: 88 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'C', Yellow: 'C', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'B',
    defaultAbilities: ['Tackle'],
    learnableAbilities: ['PlayRough', 'BodySlam']
  },
  Noibat: {
    name: 'Noibat',
    primaryType: 'Normal',
    baseStats: { HP: 75, Attack: 67, Defense: 59, Instinct: 81, Speed: 98 },
    typeAptitudes: { Red: 'C', Blue: 'C', Green: 'C', Purple: 'B', Yellow: 'C', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'B',
    defaultAbilities: ['QuickAttack', 'Tackle'],
    learnableAbilities: ['ExtremeSpeed', 'DoubleEdge']
  },
  
  // Legendary Pokemon
  Moltres: {
    name: 'Moltres',
    primaryType: 'Fire',
    baseStats: { HP: 110, Attack: 95, Defense: 70, Instinct: 85, Speed: 75 },
    typeAptitudes: { Red: 'S', Blue: 'D', Green: 'B', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam', 'HyperBeam']
  },
  Articuno: {
    name: 'Articuno',
    primaryType: 'Water',
    baseStats: { HP: 115, Attack: 75, Defense: 90, Instinct: 90, Speed: 65 },
    typeAptitudes: { Red: 'B', Blue: 'S', Green: 'D', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam', 'HyperBeam']
  },
  Celebi: {
    name: 'Celebi',
    primaryType: 'Grass',
    baseStats: { HP: 120, Attack: 85, Defense: 85, Instinct: 80, Speed: 65 },
    typeAptitudes: { Red: 'D', Blue: 'B', Green: 'S', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'S',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam', 'HyperBeam']
  },
  Raikou: {
    name: 'Raikou',
    primaryType: 'Electric',
    baseStats: { HP: 95, Attack: 80, Defense: 65, Instinct: 100, Speed: 95 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'A', Purple: 'B', Yellow: 'S', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam', 'HyperBeam']
  },
  Gengar: {
    name: 'Gengar',
    primaryType: 'Psychic',
    baseStats: { HP: 105, Attack: 90, Defense: 75, Instinct: 85, Speed: 80 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'B', Purple: 'S', Yellow: 'D', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam', 'HyperBeam']
  },
  Entei: {
    name: 'Entei',
    primaryType: 'Fire',
    baseStats: { HP: 108, Attack: 98, Defense: 73, Instinct: 83, Speed: 73 },
    typeAptitudes: { Red: 'S', Blue: 'D', Green: 'B', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam', 'HyperBeam']
  },
  Suicune: {
    name: 'Suicune',
    primaryType: 'Water',
    baseStats: { HP: 118, Attack: 73, Defense: 93, Instinct: 88, Speed: 63 },
    typeAptitudes: { Red: 'B', Blue: 'S', Green: 'D', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'S',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam', 'HyperBeam']
  },
  Zapdos: {
    name: 'Zapdos',
    primaryType: 'Electric',
    baseStats: { HP: 98, Attack: 83, Defense: 68, Instinct: 98, Speed: 88 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'A', Purple: 'B', Yellow: 'S', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam', 'HyperBeam']
  }
};

// 7 Legendary Pokemons

// ===== LEGENDARY POKEMON =====
const LEGENDARY_POKEMON = {
  Moltres: {
    name: 'Moltres',
    primaryType: 'Fire',
    baseStats: { HP: 110, Attack: 95, Defense: 70, Instinct: 85, Speed: 75 },
    typeAptitudes: { Red: 'S', Blue: 'D', Green: 'B', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam', 'HyperBeam']
  },
  Articuno: {
    name: 'Articuno',
    primaryType: 'Water',
    baseStats: { HP: 115, Attack: 75, Defense: 90, Instinct: 90, Speed: 65 },
    typeAptitudes: { Red: 'B', Blue: 'S', Green: 'D', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam', 'HyperBeam']
  },
  Celebi: {
    name: 'Celebi',
    primaryType: 'Grass',
    baseStats: { HP: 120, Attack: 85, Defense: 85, Instinct: 80, Speed: 65 },
    typeAptitudes: { Red: 'D', Blue: 'B', Green: 'S', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'S',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'BodySlam', 'HyperBeam']
  },
  Raikou: {
    name: 'Raikou',
    primaryType: 'Electric',
    baseStats: { HP: 95, Attack: 80, Defense: 65, Instinct: 100, Speed: 95 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'A', Purple: 'B', Yellow: 'S', Orange: 'C' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam', 'HyperBeam']
  },
  Gengar: {
    name: 'Gengar',
    primaryType: 'Psychic',
    baseStats: { HP: 105, Attack: 90, Defense: 75, Instinct: 85, Speed: 80 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'B', Purple: 'S', Yellow: 'D', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam', 'HyperBeam']
  },
  Entei: {
    name: 'Entei',
    primaryType: 'Fire',
    baseStats: { HP: 108, Attack: 98, Defense: 73, Instinct: 83, Speed: 73 },
    typeAptitudes: { Red: 'S', Blue: 'D', Green: 'B', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'BodySlam', 'HyperBeam']
  },
  Suicune: {
    name: 'Suicune',
    primaryType: 'Water',
    baseStats: { HP: 118, Attack: 73, Defense: 93, Instinct: 88, Speed: 63 },
    typeAptitudes: { Red: 'B', Blue: 'S', Green: 'D', Purple: 'A', Yellow: 'A', Orange: 'C' },
    strategy: 'Scaler',
    strategyGrade: 'S',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'BodySlam', 'HyperBeam']
  },
  Zapdos: {
    name: 'Zapdos',
    primaryType: 'Electric',
    baseStats: { HP: 100, Attack: 88, Defense: 68, Instinct: 98, Speed: 91 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'A', Purple: 'B', Yellow: 'S', Orange: 'D' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['ThunderShock', 'Tackle'],
    learnableAbilities: ['Thunderbolt', 'Thunder', 'BodySlam', 'HyperBeam']
  },
  Lugia: {
    name: 'Lugia',
    primaryType: 'Psychic',
    baseStats: { HP: 125, Attack: 80, Defense: 100, Instinct: 95, Speed: 65 },
    typeAptitudes: { Red: 'A', Blue: 'S', Green: 'B', Purple: 'S', Yellow: 'A', Orange: 'B' },
    strategy: 'Scaler',
    strategyGrade: 'S',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'BodySlam', 'HyperBeam']
  },
  HoOh: {
    name: 'Ho-Oh',
    primaryType: 'Fire',
    baseStats: { HP: 120, Attack: 105, Defense: 80, Instinct: 90, Speed: 70 },
    typeAptitudes: { Red: 'S', Blue: 'D', Green: 'A', Purple: 'S', Yellow: 'A', Orange: 'B' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'SacredFire', 'HyperBeam']
  },
  Mewtwo: {
    name: 'Mewtwo',
    primaryType: 'Psychic',
    baseStats: { HP: 110, Attack: 105, Defense: 70, Instinct: 105, Speed: 85 },
    typeAptitudes: { Red: 'B', Blue: 'A', Green: 'A', Purple: 'S', Yellow: 'A', Orange: 'A' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'Psystrike', 'HyperBeam']
  },
  Kyogre: {
    name: 'Kyogre',
    primaryType: 'Water',
    baseStats: { HP: 122, Attack: 98, Defense: 85, Instinct: 95, Speed: 65 },
    typeAptitudes: { Red: 'C', Blue: 'S', Green: 'D', Purple: 'A', Yellow: 'A', Orange: 'B' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'OriginPulse', 'HyperBeam']
  },
  Groudon: {
    name: 'Groudon',
    primaryType: 'Fire',
    baseStats: { HP: 118, Attack: 110, Defense: 95, Instinct: 78, Speed: 64 },
    typeAptitudes: { Red: 'S', Blue: 'E', Green: 'A', Purple: 'B', Yellow: 'A', Orange: 'S' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['Ember', 'Tackle'],
    learnableAbilities: ['Flamethrower', 'FireBlast', 'PrecipiceBlades', 'HyperBeam']
  },
  Rayquaza: {
    name: 'Rayquaza',
    primaryType: 'Grass',
    baseStats: { HP: 115, Attack: 105, Defense: 75, Instinct: 105, Speed: 85 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'S', Purple: 'A', Yellow: 'S', Orange: 'A' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['VineWhip', 'Tackle'],
    learnableAbilities: ['RazorLeaf', 'SolarBeam', 'DragonAscent', 'HyperBeam']
  },
  Dialga: {
    name: 'Dialga',
    primaryType: 'Fighting',
    baseStats: { HP: 112, Attack: 103, Defense: 88, Instinct: 88, Speed: 74 },
    typeAptitudes: { Red: 'A', Blue: 'A', Green: 'A', Purple: 'B', Yellow: 'A', Orange: 'S' },
    strategy: 'Balanced',
    strategyGrade: 'S',
    defaultAbilities: ['LowKick', 'Tackle'],
    learnableAbilities: ['KarateChop', 'Submission', 'RoarOfTime', 'HyperBeam']
  },
  Palkia: {
    name: 'Palkia',
    primaryType: 'Water',
    baseStats: { HP: 108, Attack: 103, Defense: 78, Instinct: 98, Speed: 78 },
    typeAptitudes: { Red: 'A', Blue: 'S', Green: 'C', Purple: 'S', Yellow: 'A', Orange: 'B' },
    strategy: 'Nuker',
    strategyGrade: 'S',
    defaultAbilities: ['WaterGun', 'Tackle'],
    learnableAbilities: ['Surf', 'HydroPump', 'SpacialRend', 'HyperBeam']
  },
  Giratina: {
    name: 'Giratina',
    primaryType: 'Psychic',
    baseStats: { HP: 125, Attack: 93, Defense: 93, Instinct: 93, Speed: 71 },
    typeAptitudes: { Red: 'B', Blue: 'A', Green: 'A', Purple: 'S', Yellow: 'B', Orange: 'A' },
    strategy: 'Scaler',
    strategyGrade: 'S',
    defaultAbilities: ['PsyBeam', 'Tackle'],
    learnableAbilities: ['Psychic', 'PsychicBlast', 'ShadowForce', 'HyperBeam']
  }
};


// ===== SUPPORT CARDS =====
// Support Cards feature trainer + iconic Pokemon pairs with unique effects
const SUPPORT_CARDS = {
  CynthiaGarchomp: {
    name: 'Cynthia & Garchomp',
    trainer: 'Cynthia',
    pokemon: 'Garchomp',
    rarity: 'Legendary',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 50, Defense: 0, Instinct: 30, Speed: 0 },
      description: 'The Sinnoh Champion grants overwhelming power'
    }
  },
  RedCharizard: {
    name: 'Red & Charizard',
    trainer: 'Red',
    pokemon: 'Charizard',
    rarity: 'Legendary',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 55, Defense: 0, Instinct: 35, Speed: 0 },
      description: 'The legendary trainer boosts overwhelming power'
    }
  },
  StevenMetagross: {
    name: 'Steven & Metagross',
    trainer: 'Steven',
    pokemon: 'Metagross',
    rarity: 'Legendary',
    supportType: 'Defense',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 60, Instinct: 30, Speed: 0 },
      description: 'The Hoenn Champion fortifies iron defenses'
    }
  },
  LanceDragonite: {
    name: 'Lance & Dragonite',
    trainer: 'Lance',
    pokemon: 'Dragonite',
    rarity: 'Rare',
    supportType: 'Instinct',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 25, Defense: 0, Instinct: 40, Speed: 0 },
      description: 'The Dragon Master enhances draconic power'
    }
  },
  MistyStarmie: {
    name: 'Misty & Starmie',
    trainer: 'Misty',
    pokemon: 'Starmie',
    rarity: 'Uncommon',
    supportType: 'Instinct',
    effect: {
      type: 'training_boost',
      trainingMultiplier: 1.15,
      energyCostReduction: 5,
      description: 'The Cerulean Gym Leader improves training efficiency'
    }
  },
  BrockOnix: {
    name: 'Brock & Onix',
    trainer: 'Brock',
    pokemon: 'Onix',
    rarity: 'Uncommon',
    supportType: 'Defense',
    effect: {
      type: 'stat_boost',
      stats: { HP: 20, Attack: 0, Defense: 40, Instinct: 0, Speed: 0 },
      description: 'The Pewter Gym Leader hardens defenses'
    }
  },
  ErikaTangela: {
    name: 'Erika & Tangela',
    trainer: 'Erika',
    pokemon: 'Tangela',
    rarity: 'Uncommon',
    supportType: 'HP',
    effect: {
      type: 'stat_boost',
      stats: { HP: 40, Attack: 0, Defense: 20, Instinct: 0, Speed: 0 },
      description: 'The Celadon Gym Leader nurtures vitality'
    }
  },
  SabrinaAlakazam: {
    name: 'Sabrina & Alakazam',
    trainer: 'Sabrina',
    pokemon: 'Alakazam',
    rarity: 'Rare',
    supportType: 'Instinct',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 0, Instinct: 45, Speed: 20 },
      description: 'The Saffron Gym Leader sharpens the mind'
    }
  },
  BlaineMagmar: {
    name: 'Blaine & Magmar',
    trainer: 'Blaine',
    pokemon: 'Magmar',
    rarity: 'Uncommon',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 35, Defense: 0, Instinct: 20, Speed: 0 },
      description: 'The Cinnabar Gym Leader ignites fiery passion'
    }
  },
  KogaWeezing: {
    name: 'Koga & Weezing',
    trainer: 'Koga',
    pokemon: 'Weezing',
    rarity: 'Uncommon',
    supportType: 'Instinct',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 0, Instinct: 30, Speed: 15 },
      description: 'The Fuchsia Gym Leader masters poison tactics'
    }
  },
  WhitneyMiltank: {
    name: 'Whitney & Miltank',
    trainer: 'Whitney',
    pokemon: 'Miltank',
    rarity: 'Common',
    supportType: 'HP',
    effect: {
      type: 'stat_boost',
      stats: { HP: 20, Attack: 0, Defense: 15, Instinct: 0, Speed: 0 },
      description: 'The Goldenrod Gym Leader boosts endurance'
    }
  },
  MortyGengar: {
    name: 'Morty & Gengar',
    trainer: 'Morty',
    pokemon: 'Gengar',
    rarity: 'Rare',
    supportType: 'Instinct',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 0, Instinct: 30, Speed: 20 },
      description: 'The Ecruteak Gym Leader channels ghostly power'
    }
  },
  ChuckPoliwrath: {
    name: 'Chuck & Poliwrath',
    trainer: 'Chuck',
    pokemon: 'Poliwrath',
    rarity: 'Common',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 15, Attack: 20, Defense: 0, Instinct: 0, Speed: 0 },
      description: 'The Cianwood Gym Leader builds strength'
    }
  },
  JasminSteelix: {
    name: 'Jasmine & Steelix',
    trainer: 'Jasmine',
    pokemon: 'Steelix',
    rarity: 'Uncommon',
    supportType: 'Defense',
    effect: {
      type: 'stat_boost',
      stats: { HP: 20, Attack: 0, Defense: 30, Instinct: 0, Speed: 0 },
      description: 'The Olivine Gym Leader provides iron defense'
    }
  },
  PryceDelibird: {
    name: 'Pryce & Delibird',
    trainer: 'Pryce',
    pokemon: 'Delibird',
    rarity: 'Common',
    supportType: 'HP',
    effect: {
      type: 'energy_boost',
      energyBonus: 15,
      restBonus: 10,
      description: 'The Mahogany Gym Leader aids recovery'
    }
  },
  WallaceMillotic: {
    name: 'Wallace & Milotic',
    trainer: 'Wallace',
    pokemon: 'Milotic',
    rarity: 'Rare',
    supportType: 'Defense',
    effect: {
      type: 'stat_boost',
      stats: { HP: 25, Attack: 0, Defense: 30, Instinct: 0, Speed: 0 },
      description: 'The Hoenn Champion exudes elegance'
    }
  },
  WinonaSkarmory: {
    name: 'Winona & Skarmory',
    trainer: 'Winona',
    pokemon: 'Skarmory',
    rarity: 'Uncommon',
    supportType: 'Speed',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 25, Instinct: 0, Speed: 25 },
      description: 'The Fortree Gym Leader soars with grace'
    }
  },
  WattsonMagneton: {
    name: 'Wattson & Magneton',
    trainer: 'Wattson',
    pokemon: 'Magneton',
    rarity: 'Common',
    supportType: 'Instinct',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 0, Instinct: 20, Speed: 12 },
      description: 'The Mauville Gym Leader electrifies training'
    }
  },
  FlanneryCamerupt: {
    name: 'Flannery & Camerupt',
    trainer: 'Flannery',
    pokemon: 'Camerupt',
    rarity: 'Common',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 15, Attack: 20, Defense: 0, Instinct: 0, Speed: 0 },
      description: 'The Lavaridge Gym Leader unleashes volcanic fury'
    }
  },
  CynthiaLucario: {
    name: 'Cynthia & Lucario',
    trainer: 'Cynthia',
    pokemon: 'Lucario',
    rarity: 'Rare',
    supportType: 'Attack',
    effect: {
      type: 'training_boost',
      trainingMultiplier: 1.25,
      failureReduction: 0.15,
      description: 'The Champion refines battle technique'
    }
  },
  NReshiram: {
    name: 'N & Reshiram',
    trainer: 'N',
    pokemon: 'Reshiram',
    rarity: 'Legendary',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 45, Defense: 0, Instinct: 35, Speed: 0 },
      description: 'The King of Team Plasma wields truth'
    }
  },
  IrisHaxorus: {
    name: 'Iris & Haxorus',
    trainer: 'Iris',
    pokemon: 'Haxorus',
    rarity: 'Rare',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 40, Defense: 0, Instinct: 0, Speed: 25 },
      description: 'The Unova Champion commands dragons'
    }
  },
  ElitesFourKaren: {
    name: 'Karen & Umbreon',
    trainer: 'Karen',
    pokemon: 'Umbreon',
    rarity: 'Uncommon',
    supportType: 'Defense',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 30, Instinct: 25, Speed: 0 },
      description: 'The Elite Four member embraces darkness'
    }
  },
  AgathaGengar: {
    name: 'Agatha & Gengar',
    trainer: 'Agatha',
    pokemon: 'Gengar',
    rarity: 'Uncommon',
    supportType: 'Instinct',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 0, Defense: 0, Instinct: 30, Speed: 20 },
      description: 'The Elite Four member masters ghosts'
    }
  },
  BluePidgeot: {
    name: 'Blue & Pidgeot',
    trainer: 'Blue',
    pokemon: 'Pidgeot',
    rarity: 'Rare',
    supportType: 'Speed',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 25, Defense: 0, Instinct: 0, Speed: 30 },
      description: 'The rival trainer pushes limits'
    }
  },
  GiovanniPersian: {
    name: 'Giovanni & Persian',
    trainer: 'Giovanni',
    pokemon: 'Persian',
    rarity: 'Rare',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 0, Attack: 35, Defense: 0, Instinct: 25, Speed: 0 },
      description: 'The Rocket Boss commands ruthlessly'
    }
  },
  ProfessorOakMew: {
    name: 'Professor Oak & Mew',
    trainer: 'Professor Oak',
    pokemon: 'Mew',
    rarity: 'Legendary',
    supportType: 'Instinct',
    effect: {
      type: 'experience_boost',
      skillPointMultiplier: 1.5,
      friendshipBonus: 20,
      description: 'The Professor grants knowledge and wisdom'
    }
  },
  DianthaDiancie: {
    name: 'Diantha & Diancie',
    trainer: 'Diantha',
    pokemon: 'Diancie',
    rarity: 'Legendary',
    supportType: 'Defense',
    effect: {
      type: 'stat_boost',
      stats: { HP: 30, Attack: 0, Defense: 50, Instinct: 0, Speed: 0 },
      description: 'The Kalos Champion radiates brilliance'
    }
  },
  MaxieGroudon: {
    name: 'Maxie & Groudon',
    trainer: 'Maxie',
    pokemon: 'Groudon',
    rarity: 'Rare',
    supportType: 'Attack',
    effect: {
      type: 'stat_boost',
      stats: { HP: 25, Attack: 35, Defense: 0, Instinct: 0, Speed: 0 },
      description: 'The Magma Leader harnesses earth power'
    }
  },
  ArchieKyogre: {
    name: 'Archie & Kyogre',
    trainer: 'Archie',
    pokemon: 'Kyogre',
    rarity: 'Rare',
    supportType: 'HP',
    effect: {
      type: 'stat_boost',
      stats: { HP: 35, Attack: 0, Defense: 25, Instinct: 0, Speed: 0 },
      description: 'The Aqua Leader commands the seas'
    }
  }
};

// Helper function to get complete support card attributes with defaults
const getSupportCardAttributes = (supportKey) => {
  const card = SUPPORT_CARDS[supportKey];
  if (!card) return null;
  
  // Get rarity-based defaults
  const rarityDefaults = {
    'Legendary': {
      initialFriendship: 40,
      typeBonusTraining: 20,
      generalBonusTraining: 5,
      friendshipBonusTraining: 30,
      appearanceChance: 0.25,
      typeAppearancePriority: 3.0
    },
    'Rare': {
      initialFriendship: 30,
      typeBonusTraining: 15,
      generalBonusTraining: 4,
      friendshipBonusTraining: 25,
      appearanceChance: 0.35,
      typeAppearancePriority: 2.5
    },
    'Uncommon': {
      initialFriendship: 20,
      typeBonusTraining: 12,
      generalBonusTraining: 3,
      friendshipBonusTraining: 20,
      appearanceChance: 0.40,
      typeAppearancePriority: 2.0
    },
    'Common': {
      initialFriendship: 15,
      typeBonusTraining: 10,
      generalBonusTraining: 2,
      friendshipBonusTraining: 15,
      appearanceChance: 0.45,
      typeAppearancePriority: 1.5
    }
  };
  
  const defaults = rarityDefaults[card.rarity] || rarityDefaults['Common'];
  
  // Extract baseStatIncrease from effect.stats if available
  let baseStatIncrease = { HP: 0, Attack: 0, Defense: 0, Instinct: 0, Speed: 0 };
  if (card.effect && card.effect.type === 'stat_boost' && card.effect.stats) {
    baseStatIncrease = card.effect.stats;
  }
  
  // Return complete attributes
  return {
    ...card,
    baseStatIncrease: card.baseStatIncrease || baseStatIncrease,
    initialFriendship: card.initialFriendship || defaults.initialFriendship,
    typeBonusTraining: card.typeBonusTraining || defaults.typeBonusTraining,
    generalBonusTraining: card.generalBonusTraining || defaults.generalBonusTraining,
    friendshipBonusTraining: card.friendshipBonusTraining || defaults.friendshipBonusTraining,
    moveHints: card.moveHints || ['BodySlam', 'HyperBeam'],
    appearanceChance: card.appearanceChance || defaults.appearanceChance,
    typeAppearancePriority: card.typeAppearancePriority || defaults.typeAppearancePriority,
    type: card.supportType || 'HP' // For compatibility
  };
};

// Support Card Gacha Rarity
const SUPPORT_GACHA_RARITY = {
  Common: {
    rate: 0.50,
    supports: ['WhitneyMiltank', 'ChuckPoliwrath', 'PryceDelibird', 'WattsonMagneton', 'FlanneryCamerupt']
  },
  Uncommon: {
    rate: 0.35,
    supports: ['MistyStarmie', 'BrockOnix', 'ErikaTangela', 'BlaineMagmar', 'KogaWeezing', 
               'JasminSteelix', 'WinonaSkarmory', 'ElitesFourKaren', 'AgathaGengar']
  },
  Rare: {
    rate: 0.13,
    supports: ['LanceDragonite', 'SabrinaAlakazam', 'MortyGengar', 'WallaceMillotic', 
               'CynthiaLucario', 'IrisHaxorus', 'BluePidgeot', 'GiovanniPersian', 
               'MaxieGroudon', 'ArchieKyogre']
  },
  Legendary: {
    rate: 0.02,
    supports: ['CynthiaGarchomp', 'RedCharizard', 'StevenMetagross', 'NReshiram', 
               'ProfessorOakMew', 'DianthaDiancie']
  }
};

// Pokemon Gacha Rarity Table
const GACHA_RARITY = {
    Common: {
        rate: 0.60, // 60%
        pokemon: [
            'Rattata', 'Meowth', 'Sandshrew', 'Psyduck', 'Poliwag',
            'Tentacool', 'Shellder', 'Krabby', 'Oddish', 'Bellsprout',
            'Paras', 'Zubat', 'Grimer', 'Koffing', 'Voltorb',
            'Magnemite', 'Sentret', 'Zigzagoon', 'Bidoof', 'Lillipup',
            'Hoppip', 'Sunkern', 'Spinarak', 'Patrat', 'Purrloin',
            'Roggenrola', 'Tympole', 'Venipede', 'Dwebble', 'Binacle'
        ]
    },
    Uncommon: {
        rate: 0.30, // 30%
        pokemon: [
            'Growlithe', 'Vulpix', 'Ponyta', 'Houndour', 'Torchic', 
            'Chinchou', 'Mareep', 'Elekid', 'Skorupi', 'Eevee', 
            'Togepi', 'Snubbull', 'Teddiursa', 'Slugma', 'Skitty',
            'Pikachu', 'Gastly', 'Fletchling', 'Cyndaquil', 'Totodile',
            'Chikorita', 'Mudkip', 'Treecko', 'Piplup', 'Turtwig',
            'Chimchar', 'Tepig', 'Oshawott', 'Snivy', 'Klefki',
            'Gligar', 'Snorunt', 'Aron', 'Ralts', 'Shinx', 'Starly'
        ]
    },
    Rare: {
        rate: 0.09, // 9%
        pokemon: [
            'Magmar', 'Electabuzz', 'Clefairy', 'Jigglypuff',
            'Phanpy', 'Spheal', 'Spoink', 'Deerling', 'Tangela', 'Muk',
            'Lapras', 'Bunnelby', 'Yungoos', 'Wooloo', 'Skwovet',
            'Sneasel', 'Murkrow', 'Yanma', 'Buneary', 'Glameow',
            'Stunky', 'Croagunk', 'Sandile', 'Scraggy', 'Gothita',
            'Litleo', 'Skiddo', 'Pancham', 'Honedge', 'Inkay',
            'Skrelp', 'Helioptile', 'Tyrunt', 'Amaura', 'Goomy', 'Noibat'
        ]
    },
    Legendary: {
        rate: 0.01, // 1%
        pokemon: [
            'Moltres', 'Articuno', 'Zapdos', 'Raikou', 'Entei', 
            'Suicune', 'Celebi', 'Gengar'
        ]
    }
};


// ===== RANDOM EVENTS =====
const RANDOM_EVENTS = {
  // Stat increase events (10)
  wildEncounter: {
    type: 'stat_increase',
    name: 'Wild Pokemon Spar',
    description: 'A friendly wild Pokemon wants to battle for fun!',
    effect: { HP: 4, Attack: 2, Defense: 2, Instinct: 2, Speed: 2 }
  },
  trainingDummies: {
    type: 'stat_increase',
    name: 'Training Dummies',
    description: 'You find a set of battle training dummies at the Pokemon Center!',
    effect: { HP: 6, Attack: 4, Defense: 3, Instinct: 3, Speed: 2 }
  },
  climbingRocks: {
    type: 'stat_increase',
    name: 'Rock Climb Practice',
    description: 'Practicing Rock Climb on Mt. Moon has toughened you up!',
    effect: { HP: 8, Defense: 4, Speed: 3 }
  },
  psychicMeditation: {
    type: 'stat_increase',
    name: 'Psychic Training',
    description: 'A Psychic-type trainer teaches you meditation techniques!',
    effect: { Instinct: 6, Defense: 2, Speed: 2 }
  },
  cyclingRoad: {
    type: 'stat_increase',
    name: 'Cycling Road Sprint',
    description: 'Racing down Cycling Road has boosted your speed!',
    effect: { Speed: 8, Instinct: 3, HP: 2 }
  },
  fightingDojo: {
    type: 'stat_increase',
    name: 'Fighting Dojo Session',
    description: 'Training with Fighting-types at the dojo increased your power!',
    effect: { Attack: 6, HP: 4, Defense: 2 }
  },
  doubleTeam: {
    type: 'stat_increase',
    name: 'Double Team Training',
    description: 'Practicing evasion techniques has sharpened your reflexes!',
    effect: { Instinct: 4, Speed: 4, Defense: 2 }
  },
  marathonRun: {
    type: 'stat_increase',
    name: 'Route Marathon',
    description: 'Running the entire length of Route 9 built your endurance!',
    effect: { HP: 9, Speed: 4, Defense: 3 }
  },
  strengthBoulders: {
    type: 'stat_increase',
    name: 'Strength Training',
    description: 'Moving massive boulders with Strength dramatically increased your power!',
    effect: { Attack: 8, Defense: 4, HP: 4 }
  },
  balancedWorkout: {
    type: 'stat_increase',
    name: 'Balanced Training',
    description: 'A well-rounded training session at the gym improved all your stats!',
    effect: { HP: 3, Attack: 2, Defense: 2, Instinct: 2, Speed: 2 }
  },
  
  // Choice events with risk/reward (25)
  mysteriousItem: {
    type: 'choice',
    name: 'Strange Berry',
    description: 'You found a strange berry on the path! Your Pokemon sniffs it curiously.',
    choices: [
      { 
        text: 'Let your Pokemon eat it (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { HP: 23, Attack: 12, Defense: 12, Instinct: 12, Speed: 12 } }, flavor: 'Jackpot! It was a rare Liechi Berry! Your Pokemon feels incredibly powerful!' },
          { chance: 0.5, effect: { stats: { HP: -8, Attack: -4, Defense: -4 }, energy: -15 }, flavor: 'Ugh! That berry was poisonous! Your Pokemon feels terrible!' }
        ]
      },
      {
        text: 'Save it for later (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 11 }, flavor: 'You preserve it properly for a meal later, recovering energy.' }
        ]
      }
    ]
  },
  crossroads: {
    type: 'choice',
    name: 'Route Split',
    description: 'The route splits ahead. Which path will you and your Pokemon take?',
    choices: [
      {
        text: 'Rocky mountain trail',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 15, Defense: 10, Attack: 5 } }, flavor: 'The tough terrain provides excellent training for your Pokemon!' }
        ]
      },
      {
        text: 'Shaded forest path',
        outcomes: [
          { chance: 1.0, effect: { energy: 10, skillPoints: 5 }, flavor: 'The peaceful walk through the forest helps you rest and reflect.' }
        ]
      }
    ]
  },
  strangerGift: {
    type: 'choice',
    name: 'Helpful Trainer',
    description: 'A friendly trainer offers to share some items. Accept their generosity?',
    choices: [
      {
        text: 'Accept the items',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 6, Attack: 4, Defense: 4 } }, flavor: 'They gave you protein supplements! Your Pokemon grows stronger!' }
        ]
      },
      {
        text: 'Politely decline',
        outcomes: [
          { chance: 1.0, effect: { energy: 8, skillPoints: 5 }, flavor: 'You maintain your independence and feel energized by self-reliance.' }
        ]
      }
    ]
  },
  ancientRuins: {
    type: 'choice',
    name: 'Ancient Ruins',
    description: 'You discover ancient ruins with mysterious Unown symbols carved into stone. Investigate?',
    choices: [
      {
        text: 'Touch the symbols',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 9, Instinct: 8, Speed: 8 } }, flavor: 'The ancient power flows into your Pokemon, awakening hidden potential!' }
        ]
      },
      {
        text: 'Just observe carefully',
        outcomes: [
          { chance: 1.0, effect: { skillPoints: 10, energy: 5 }, flavor: 'You sketch the symbolsÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âvaluable knowledge that grants understanding!' }
        ]
      }
    ]
  },
  trainingOffer: {
    type: 'choice',
    name: 'Veteran Trainer Challenge',
    description: 'A battle-scarred Ace Trainer offers to train with you. It looks intense...',
    choices: [
      {
        text: 'Accept the training (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { Attack: 23, Speed: 18, Instinct: 11 } }, flavor: 'Incredible training! You learn advanced techniques from the veteran!' },
          { chance: 0.5, effect: { stats: { HP: -11, Defense: -6 }, energy: -22 }, flavor: 'The training was too brutal! Your Pokemon is exhausted and hurt!' }
        ]
      },
      {
        text: 'Train on your own (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 10, skillPoints: 4 }, flavor: 'You follow your own proven training regimen with good results.' }
        ]
      }
    ]
  },
  competitionInvite: {
    type: 'choice',
    name: 'Local Tournament',
    description: 'A Pokemon battle tournament is happening at the local stadium! Entry fee is just your time and energy.',
    choices: [
      {
        text: 'Enter the tournament',
        outcomes: [
          { chance: 1.0, effect: { stats: { Attack: 9, Instinct: 8, Speed: 8 } }, flavor: 'You make it to semifinals! Great battle experience gained!' }
        ]
      },
      {
        text: 'Watch from the stands',
        outcomes: [
          { chance: 1.0, effect: { skillPoints: 10, energy: 8 }, flavor: 'You take notes on advanced strategiesÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âvery educational!' }
        ]
      }
    ]
  },
  mysteriousCave: {
    type: 'choice',
    name: 'Dark Cave',
    description: 'A pitch-black cave entrance looms ahead. Your Pokemon hesitates...',
    choices: [
      {
        text: 'Explore the cave (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { HP: 18, Attack: 18, Instinct: 18 }, skillPoints: 19 }, flavor: 'You find a hidden chamber with rare evolutionary stones! Incredible!' },
          { chance: 0.5, effect: { stats: { HP: -11, Defense: -8 }, energy: -19 }, flavor: 'Wild Zubat swarm attacks! You barely escape!' }
        ]
      },
      {
        text: 'Camp outside instead (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 14 }, flavor: 'You set up camp and enjoy a peaceful night under the stars.' }
        ]
      }
    ]
  },
  riverCrossing: {
    type: 'choice',
    name: 'Rushing River',
    description: 'A wide river blocks your path. Can your Pokemon help you cross?',
    choices: [
      {
        text: 'Use Surf to cross',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 9, Speed: 8, Defense: 8 } }, flavor: 'Your Pokemon powers through the currentÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âexcellent water training!' }
        ]
      },
      {
        text: 'Look for a bridge',
        outcomes: [
          { chance: 1.0, effect: { energy: 8, skillPoints: 5 }, flavor: 'Good thinking! You find a safe bridge and conserve energy.' }
        ]
      }
    ]
  },
  berryBush: {
    type: 'choice',
    name: 'Wild Berry Bush',
    description: 'You spot a bush full of colorful berries your Pokemon seems interested in!',
    choices: [
      {
        text: 'Let Pokemon eat them (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { HP: 29, Instinct: 14 }, energy: 28 }, flavor: 'They were premium Oran Berries! Your Pokemon is fully revitalized!' },
          { chance: 0.5, effect: { stats: { HP: -8 }, energy: -19 }, flavor: 'Those were bitter Razz BerriesÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âyour Pokemon feels sick!' }
        ]
      },
      {
        text: 'Pick some for later (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 11 }, flavor: 'You harvest several berries for the road ahead.' }
        ]
      }
    ]
  },
  hauntedForest: {
    type: 'choice',
    name: 'Lavender Town Woods',
    description: 'This forest near Lavender Town is rumored to have Ghost-types. Proceed anyway?',
    choices: [
      {
        text: 'Venture through',
        outcomes: [
          { chance: 1.0, effect: { stats: { Instinct: 11, Speed: 8, Attack: 4 } }, flavor: 'Your Pokemon bonds with wild Gastly! What an amazing experience!' }
        ]
      },
      {
        text: 'Take the long route',
        outcomes: [
          { chance: 1.0, effect: { energy: 10, skillPoints: 5 }, flavor: 'Better safe than sorryÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âyou take a safer path and stay fresh.' }
        ]
      }
    ]
  },
  battleTournament: {
    type: 'choice',
    name: 'Battle Frontier',
    description: 'A Battle Frontier facility is holding trials today! Want to participate?',
    choices: [
      {
        text: 'Register and compete',
        outcomes: [
          { chance: 1.0, effect: { stats: { Attack: 9, Speed: 8, Instinct: 8 } }, flavor: 'You win several matches! Great battle experience!' }
        ]
      },
      {
        text: 'Skip it',
        outcomes: [
          { chance: 1.0, effect: { energy: 11 }, flavor: 'You skip it and save your energy for upcoming challenges.' }
        ]
      }
    ]
  },
  picnicArea: {
    type: 'choice',
    name: 'Trainer Picnic',
    description: 'Trainers are having a Pokemon picnic! Join them?',
    choices: [
      {
        text: 'Join the picnic',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 11, Defense: 8 } }, flavor: 'The homemade Poffins provide excellent nutrition!' }
        ]
      },
      {
        text: 'Eat moderately',
        outcomes: [
          { chance: 1.0, effect: { energy: 10, skillPoints: 5 }, flavor: 'You snack lightly while chatting with trainersÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Ânice break!' }
        ]
      }
    ]
  },
  trainingManual: {
    type: 'choice',
    name: 'Champion\'s Guide',
    description: 'You find a worn training manual written by a Pokemon Champion. Read it?',
    choices: [
      {
        text: 'Study intensely',
        outcomes: [
          { chance: 1.0, effect: { stats: { Instinct: 11, Attack: 10 } }, flavor: 'The Champion\'s strategies are brilliant! You learn so much!' }
        ]
      },
      {
        text: 'Skim through it',
        outcomes: [
          { chance: 1.0, effect: { skillPoints: 12, energy: 8 }, flavor: 'You pick up several useful battle tips from skimming it.' }
        ]
      }
    ]
  },
  stormWarning: {
    type: 'choice',
    name: 'Incoming Storm',
    description: 'Dark clouds gather. Train in the rain or find shelter at the Pokemon Center?',
    choices: [
      {
        text: 'Train in the rain',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 11, Defense: 9, Instinct: 8 } }, flavor: 'Training in the storm tempers your body and mind like steel!' }
        ]
      },
      {
        text: 'Take shelter',
        outcomes: [
          { chance: 1.0, effect: { energy: 15 }, flavor: 'You rest comfortably as the storm rages outside.' }
        ]
      }
    ]
  },
  lostChild: {
    type: 'choice',
    name: 'Lost Child',
    description: 'A child is lost and crying for their Pikachu. Help them search?',
    choices: [
      {
        text: 'Search for the Pokemon',
        outcomes: [
          { chance: 1.0, effect: { stats: { Instinct: 8, HP: 8 }, skillPoints: 8 }, flavor: 'You find their Pikachu! The grateful parent rewards you!' }
        ]
      },
      {
        text: 'Keep moving',
        outcomes: [
          { chance: 1.0, effect: { energy: 8, stats: { Attack: 6, Speed: 6 } }, flavor: 'You focus on your own journey, making steady progress.' }
        ]
      }
    ]
  },
  moveTutor: {
    type: 'choice',
    name: 'Move Tutor',
    description: 'A mysterious Move Tutor offers to teach a powerful move. It might be risky though...',
    choices: [
      {
        text: 'Learn the move (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { Attack: 23, Instinct: 18 }, skillPoints: 25 }, flavor: 'You master the secret technique! Devastating new power unlocked!' },
          { chance: 0.5, effect: { stats: { HP: -11, Defense: -8, Attack: -6 } }, flavor: 'The technique backfires horribly, leaving you worse than before!' }
        ]
      },
      {
        text: 'Pass on it (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 10, skillPoints: 5 }, flavor: 'You decline the risk, trusting in your proven methods.' }
        ]
      }
    ]
  },
  healingSpring: {
    type: 'choice',
    name: 'Hot Spring',
    description: 'A natural hot spring is said to restore Pokemon vitality. Try it?',
    choices: [
      {
        text: 'Bathe in the spring',
        outcomes: [
          { chance: 1.0, effect: { stats: { HP: 14, Defense: 12 } }, flavor: 'The mineral-rich waters invigorate and strengthen your Pokemon!' }
        ]
      },
      {
        text: 'Rest on the shore',
        outcomes: [
          { chance: 1.0, effect: { energy: 13 }, flavor: 'You rest beside the spring, enjoying the peaceful ambiance.' }
        ]
      }
    ]
  },
  aceTrainerBattle: {
    type: 'choice',
    name: 'Ace Trainer Battle',
    description: 'An Ace Trainer challenges you to a serious practice battle!',
    choices: [
      {
        text: 'Accept the battle',
        outcomes: [
          { chance: 1.0, effect: { stats: { Attack: 11, Defense: 9, Instinct: 10 } }, flavor: 'You hold your own against the elite! Advanced techniques learned!' }
        ]
      },
      {
        text: 'Decline and watch',
        outcomes: [
          { chance: 1.0, effect: { skillPoints: 15, energy: 10 }, flavor: 'You watch carefully, absorbing their masterful technique.' }
        ]
      }
    ]
  },
  itemfinderPing: {
    type: 'choice',
    name: 'Itemfinder Signal',
    description: 'Your Itemfinder is beeping! There might be rare items buried in a dangerous area nearby.',
    choices: [
      {
        text: 'Dig for items (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { skillPoints: 31, stats: { HP: 18 } }, flavor: 'You unearth a cache of Rare Candies and TMs! Amazing find!' },
          { chance: 0.5, effect: { stats: { HP: -14, Defense: -8 }, energy: -22 }, flavor: 'It was a Voltorb nest! You escape but worse for wear!' }
        ]
      },
      {
        text: 'Skip the search (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 11, stats: { Defense: 6 } }, flavor: 'You wisely ignore the too-good-to-be-true signal and stay safe.' }
        ]
      }
    ]
  },
  professorLecture: {
    type: 'choice',
    name: 'Professor\'s Lecture',
    description: 'A renowned Pokemon Professor is giving a lecture on battle strategy!',
    choices: [
      {
        text: 'Attend the lecture',
        outcomes: [
          { chance: 1.0, effect: { stats: { Instinct: 14, Defense: 10 }, skillPoints: 12 }, flavor: 'The Professor\'s wisdom opens your mind to new strategies!' }
        ]
      },
      {
        text: 'Pass on it',
        outcomes: [
          { chance: 1.0, effect: { energy: 10, stats: { Speed: 8 } }, flavor: 'You politely decline and continue training at your own pace.' }
        ]
      }
    ]
  },
  speedChallenge: {
    type: 'choice',
    name: 'Rapidash Race',
    description: 'A trainer with a Rapidash challenges you to a speed contest!',
    choices: [
      {
        text: 'Accept the race',
        outcomes: [
          { chance: 1.0, effect: { stats: { Speed: 14, Instinct: 10 } }, flavor: 'You keep pace with Rapidash, proving your superior speed!' }
        ]
      },
      {
        text: 'Decline politely',
        outcomes: [
          { chance: 1.0, effect: { energy: 11 }, flavor: 'You conserve your energy, knowing when to compete and when to rest.' }
        ]
      }
    ]
  },
  hotSprings: {
    type: 'choice',
    name: 'Lavaridge Hot Springs',
    description: 'The famous Lavaridge hot springs are nearby! They might help your Pokemon recover...',
    choices: [
      {
        text: 'Take a dip (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { HP: 36, Attack: 23, Instinct: 18 } }, flavor: 'The legendary springs grant your Pokemon incredible power!' },
          { chance: 0.5, effect: { stats: { HP: -11, Attack: -9 }, energy: -19 }, flavor: 'The springs were cursed by a Hex! Your Pokemon weakens!' }
        ]
      },
      {
        text: 'Rest on the shore (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 14, skillPoints: 5 }, flavor: 'You resist temptation and rest safely nearby.' }
        ]
      }
    ]
  },
  toughBattle: {
    type: 'choice',
    name: 'Intense Training Match',
    description: 'A skilled trainer offers an intense practice battle! It will push you hard.',
    choices: [
      {
        text: 'Maximum effort',
        outcomes: [
          { chance: 1.0, effect: { stats: { Speed: 11, Attack: 9, Instinct: 10 } }, flavor: 'You complete the match flawlessly, proving your capabilities!' }
        ]
      },
      {
        text: 'Moderate pace',
        outcomes: [
          { chance: 1.0, effect: { energy: 11, stats: { HP: 8, Defense: 8 } }, flavor: 'Slow and steady wins the raceÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âyou train safely.' }
        ]
      }
    ]
  },
  luckyEgg: {
    type: 'choice',
    name: 'Lucky Egg Vendor',
    description: 'A vendor is selling a mysterious Lucky Egg. Worth trying?',
    choices: [
      {
        text: 'Buy the Lucky Egg',
        outcomes: [
          { chance: 1.0, effect: { stats: { Instinct: 9, HP: 10 }, skillPoints: 10 }, flavor: 'The Lucky Egg works! You feel fortune smiling upon you!' }
        ]
      },
      {
        text: 'Don\'t buy it',
        outcomes: [
          { chance: 1.0, effect: { skillPoints: 8, energy: 8 }, flavor: 'You save your resources, trusting in your own abilities.' }
        ]
      }
    ]
  },
  wildcardEvent: {
    type: 'choice',
    name: 'Random Encounter',
    description: 'Something unexpected happens ahead! What could it be?',
    choices: [
      {
        text: 'Investigate (RISKY)',
        outcomes: [
          { chance: 0.5, effect: { stats: { HP: 29, Attack: 23, Defense: 18, Instinct: 18, Speed: 18 } }, flavor: 'Fortune favors the bold! Everything goes perfectly!' },
          { chance: 0.5, effect: { stats: { HP: -15, Attack: -11, Defense: -9 }, energy: -22 }, flavor: 'Your gamble backfires spectacularlyÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âsometimes caution is best!' }
        ]
      },
      {
        text: 'Ignore it (SAFE)',
        outcomes: [
          { chance: 1.0, effect: { energy: 11, stats: { HP: 8, Defense: 6 } }, flavor: 'You choose the safe path, making modest but reliable progress.' }
        ]
      }
    ]
  },
  
  // Battle events (5)
  championChallenge: {
    type: 'battle',
    name: 'Champion Challenge',
    description: 'A powerful wandering Champion challenges you!',
    difficulty: 1.5,
    rewards: { stats: { HP: 18, Attack: 12, Defense: 12, Instinct: 12, Speed: 12 }, skillPoints: 30, energy: -22 }
  },
  eliteWarrior: {
    type: 'battle',
    name: 'Elite Four Member',
    description: 'An Elite Four member is training here and wants to battle!',
    difficulty: 1.6,
    rewards: { stats: { Attack: 22, Defense: 15, Instinct: 15 }, skillPoints: 36, energy: -26 }
  },
  legendaryPokemon: {
    type: 'battle',
    name: 'Legendary Pokemon',
    description: 'A legendary Pokemon appears before you!',
    difficulty: 1.8,
    rewards: { stats: { HP: 22, Attack: 18, Defense: 18, Instinct: 18, Speed: 18 }, skillPoints: 50, energy: -30 }
  },
  rivalAppears: {
    type: 'battle',
    name: 'Rival Battle',
    description: 'Your rival shows up demanding a battle!',
    difficulty: 1.4,
    rewards: { stats: { Attack: 15, Instinct: 15, Speed: 12 }, skillPoints: 24, energy: -19 }
  },
  ancientGuardian: {
    type: 'battle',
    name: 'Ruin Guardian',
    description: 'An ancient guardian Golem awakens to test you!',
    difficulty: 1.7,
    rewards: { stats: { HP: 27, Defense: 22, Instinct: 18 }, skillPoints: 40, energy: -28 }
  },
  
  // Negative events (10)
  injury: {
    type: 'negative',
    name: 'Training Injury',
    description: 'You pushed too hard and your Pokemon got injured!',
    effect: { stats: { HP: -6, Attack: -3, Defense: -3 }, energy: -11 }
  },
  fatigue: {
    type: 'negative',
    name: 'Exhaustion',
    description: 'The intense training has left you and your Pokemon exhausted.',
    effect: { energy: -19 }
  },
  pokerus: {
    type: 'negative',
    name: 'Pokerus Infection',
    description: 'Your Pokemon caught a mild case of Pokerus and needs rest.',
    effect: { stats: { HP: -8, Speed: -4 }, energy: -15 }
  },
  badFood: {
    type: 'negative',
    name: 'Spoiled Berries',
    description: 'You ate spoiled berries and feel terrible.',
    effect: { stats: { HP: -9, Defense: -4 }, energy: -22 }
  },
  accident: {
    type: 'negative',
    name: 'Training Accident',
    description: 'A training accident with your Pokemon has set you back.',
    effect: { stats: { HP: -11, Attack: -6 }, energy: -15 }
  },
  weatherDelay: {
    type: 'negative',
    name: 'Sandstorm',
    description: 'A terrible sandstorm prevents proper training.',
    effect: { energy: -22 }
  },
  equipmentBreak: {
    type: 'negative',
    name: 'Broken TM',
    description: 'Your TM breaks during training!',
    effect: { stats: { Attack: -4, Defense: -4 }, skillPoints: -5 }
  },
  distraction: {
    type: 'negative',
    name: 'Wild Pokemon Swarm',
    description: 'A swarm of wild Zubat has wasted your time.',
    effect: { energy: -15, skillPoints: -3 }
  },
  badLuck: {
    type: 'negative',
    name: 'Unlucky Day',
    description: 'Everything seems to go wrong today.',
    effect: { stats: { HP: -4, Attack: -2, Defense: -2, Instinct: -2, Speed: -2 } }
  },
  overtraining: {
    type: 'negative',
    name: 'Overtraining',
    description: 'You overtrained your Pokemon and it needs serious rest.',
    effect: { stats: { HP: -8, Speed: -6 }, energy: -26 }
  }
};

// Hangout events - one per support pokemon, can only happen once
const HANGOUT_EVENTS = {
  CynthiaGarchomp: {
    name: 'Champion\'s Masterclass',
    description: 'Cynthia invites you to train with her ace Garchomp!',
    flavor: 'Cynthia demonstrates overwhelming power with Garchomp. "True strength comes from understanding your partner," she says with a serene smile.',
    effect: { stats: { Attack: 15, Instinct: 10 }, moveHint: 'DragonClaw', energy: 20 }
  },
  RedCharizard: {
    name: 'Silent Training',
    description: 'The legendary Red gestures for you to join his training.',
    flavor: 'Red says nothing, but his Charizard\'s fierce determination speaks volumes. You feel inspired by his quiet intensity.',
    effect: { stats: { Attack: 16, Instinct: 12 }, moveHint: 'FlareBlitz', skillPoints: 15 }
  },
  StevenMetagross: {
    name: 'Stone Analysis Session',
    description: 'Steven shares his geological expertise and defensive tactics.',
    flavor: 'Steven examines rare stones while Metagross demonstrates impenetrable defense. "Patience and precision win battles," he explains.',
    effect: { stats: { Defense: 17, Instinct: 10 }, moveHint: 'IronHead', energy: 18 }
  },
  LanceDragonite: {
    name: 'Dragon Tamer\'s Wisdom',
    description: 'Lance shares secrets of dragon-type mastery.',
    flavor: 'Lance\'s Dragonite soars majestically overhead. "Dragons respond to those with true conviction," he declares.',
    effect: { stats: { Attack: 12, Instinct: 14 }, moveHint: 'DragonClaw', skillPoints: 12 }
  },
  MistyStarmie: {
    name: 'Water Ballet Practice',
    description: 'Misty teaches elegant water-type techniques.',
    flavor: 'Misty and Starmie perform graceful aquatic maneuvers. "Water flows effortlessly\u2014your training should too!" she chirps.',
    effect: { stats: { Instinct: 11, Speed: 8 }, moveHint: 'Surf', energy: 15 }
  },
  BrockOnix: {
    name: 'Rock Solid Defense',
    description: 'Brock demonstrates endurance training with Onix.',
    flavor: 'Brock\'s Onix stands unmovable like a mountain. "Defense isn\'t just blocking\u2014it\'s outlasting!" he teaches firmly.',
    effect: { stats: { HP: 12, Defense: 14 }, moveHint: 'RockSlide', energy: 16 }
  },
  ErikaTangela: {
    name: 'Garden Meditation',
    description: 'Erika invites you to her peaceful garden training.',
    flavor: 'Surrounded by blooming flowers and Tangela\'s vines, Erika teaches harmony with nature. "Growth requires patience," she whispers.',
    effect: { stats: { HP: 14, Defense: 10 }, energy: 20 }
  },
  SabrinaAlakazam: {
    name: 'Psychic Awakening',
    description: 'Sabrina helps unlock your Pokemon\'s mental potential.',
    flavor: 'Alakazam\'s spoons bend as psychic energy fills the room. "The mind is the strongest muscle," Sabrina says cryptically.',
    effect: { stats: { Instinct: 16, Speed: 9 }, moveHint: 'Psychic', skillPoints: 13 }
  },
  BlaineMagmar: {
    name: 'Volcanic Training',
    description: 'Blaine\'s fiery enthusiasm ignites your passion!',
    flavor: 'Magmar\'s flames roar as Blaine cackles. "Hot-headed? Maybe! But that heat forges champions!" he bellows.',
    effect: { stats: { Attack: 13, Instinct: 9 }, moveHint: 'Flamethrower', energy: 14 }
  },
  KogaWeezing: {
    name: 'Ninja Techniques',
    description: 'Koga teaches tactical maneuvering and precision.',
    flavor: 'Weezing creates concealing smoke as Koga moves with ninja precision. "Strike from the shadows," he whispers.',
    effect: { stats: { Instinct: 11, Speed: 10 }, moveHint: 'SludgeBomb', energy: 13 }
  },
  WhitneyMiltank: {
    name: 'Endurance Run',
    description: 'Whitney challenges you to a stamina-building session!',
    flavor: 'Miltank\'s Rollout never stops! Whitney giggles, "Stamina wins the long game\u2014just keep going!"',
    effect: { stats: { HP: 10, Defense: 8 }, energy: 16 }
  },
  MortyGengar: {
    name: 'Spirit Connection',
    description: 'Morty communes with ghost-type energies.',
    flavor: 'Gengar phases through walls as Morty meditates. "The bond between worlds strengthens the spirit," he murmurs.',
    effect: { stats: { Instinct: 12, Speed: 9 }, moveHint: 'ShadowBall', skillPoints: 11 }
  },
  ChuckPoliwrath: {
    name: 'Waterfall Training',
    description: 'Chuck\'s intense martial arts under a waterfall!',
    flavor: 'Poliwrath punches through cascading water. Chuck roars, "Strength and discipline\u2014that\'s the warrior\'s way!"',
    effect: { stats: { HP: 9, Attack: 11 }, moveHint: 'DynamicPunch', energy: 14 }
  },
  JasminSteelix: {
    name: 'Steel Resolve',
    description: 'Jasmine demonstrates unwavering defensive tactics.',
    flavor: 'Steelix\'s metallic body gleams. Jasmine speaks softly, "True strength means protecting what matters most."',
    effect: { stats: { HP: 10, Defense: 12 }, moveHint: 'IronTail', energy: 15 }
  },
  PryceDelibird: {
    name: 'Gift of Rest',
    description: 'Pryce shares wisdom on recovery and preparation.',
    flavor: 'Delibird delivers treats as Pryce smiles warmly. "Rest is not weakness\u2014it\'s strategic preparation," he advises.',
    effect: { stats: { HP: 8 }, energy: 25 }
  },
  WallaceMillotic: {
    name: 'Elegant Performance',
    description: 'Wallace showcases the art of beauty and strength.',
    flavor: 'Milotic glides gracefully through water. Wallace beams, "True champions combine elegance with power!"',
    effect: { stats: { HP: 11, Defense: 12 }, moveHint: 'HydroPump', energy: 17 }
  },
  WinonaSkarmory: {
    name: 'Aerial Maneuvers',
    description: 'Winona teaches swift flying techniques.',
    flavor: 'Skarmory cuts through the air with razor precision. Winona calls out, "Speed and grace dominate the skies!"',
    effect: { stats: { Defense: 10, Speed: 12 }, moveHint: 'SteelWing', energy: 14 }
  },
  WattsonMagneton: {
    name: 'Electric Circuit Training',
    description: 'Wattson\'s shocking workout charges you up!',
    flavor: 'Magneton crackles with electricity as Wattson laughs heartily. "Wahahaha! Feel the voltage!" he exclaims.',
    effect: { stats: { Instinct: 10, Speed: 8 }, moveHint: 'Thunderbolt', energy: 13 }
  },
  FlanneryCamerupt: {
    name: 'Explosive Power',
    description: 'Flannery demonstrates volcanic offensive tactics.',
    flavor: 'Camerupt erupts with magma as Flannery pumps her fist. "Burn bright and strike hard!" she shouts enthusiastically.',
    effect: { stats: { HP: 9, Attack: 11 }, moveHint: 'Earthquake', energy: 14 }
  },
  CynthiaLucario: {
    name: 'Aura Training',
    description: 'Cynthia helps awaken your Pokemon\'s inner aura.',
    flavor: 'Lucario\'s aura glows brilliantly. Cynthia explains, "True mastery comes from sensing your opponent\'s spirit."',
    effect: { stats: { Attack: 12, Instinct: 10 }, moveHint: 'AuraSphere', skillPoints: 14 }
  },
  NReshiram: {
    name: 'Truth\'s Flame',
    description: 'N shares ideals with Reshiram\'s legendary power.',
    flavor: 'Reshiram\'s flames burn with truth itself. N speaks passionately, "Only through honesty can Pokemon and trainer unite!"',
    effect: { stats: { Attack: 14, Instinct: 12 }, moveHint: 'BlueFlare', skillPoints: 16 }
  },
  IrisHaxorus: {
    name: 'Dragon Dance',
    description: 'Iris teaches fierce dragon-type combat techniques.',
    flavor: 'Haxorus roars powerfully as Iris cheers. "Dragons never back down\u2014show your fighting spirit!" she yells excitedly.',
    effect: { stats: { Attack: 14, Speed: 11 }, moveHint: 'DragonClaw', energy: 16 }
  },
  ElitesFourKaren: {
    name: 'Dark Arts Mastery',
    description: 'Karen reveals the strength of dark-type strategy.',
    flavor: 'Umbreon\'s rings glow in the darkness. Karen smirks, "Winning isn\'t about type\u2014it\'s about strategy and bond."',
    effect: { stats: { Defense: 11, Instinct: 10 }, moveHint: 'DarkPulse', skillPoints: 12 }
  },
  AgathaGengar: {
    name: 'Spectral Training',
    description: 'Agatha teaches ancient ghost-type techniques.',
    flavor: 'Gengar\'s eerie laugh echoes as Agatha cackles. "Fear is a weapon\u2014use it wisely!" she says ominously.',
    effect: { stats: { Instinct: 12, Speed: 9 }, moveHint: 'ShadowBall', energy: 13 }
  },
  BluePidgeot: {
    name: 'Rival\'s Challenge',
    description: 'Blue pushes you to exceed your limits.',
    flavor: 'Pidgeot soars majestically. Blue smirks, "Smell ya later\u2014unless you can actually keep up!" he taunts.',
    effect: { stats: { Attack: 11, Speed: 12 }, moveHint: 'AerialAce', skillPoints: 13 }
  },
  GiovanniPersian: {
    name: 'Ruthless Tactics',
    description: 'Giovanni demonstrates calculated dominance.',
    flavor: 'Persian prowls with predatory grace. Giovanni states coldly, "Power respects only power. Show no mercy."',
    effect: { stats: { Attack: 13, Instinct: 10 }, moveHint: 'PayDay', skillPoints: 14 }
  },
  ProfessorOakMew: {
    name: 'Legendary Research',
    description: 'Professor Oak shares knowledge with Mew\'s assistance.',
    flavor: 'Mew playfully teleports around as Oak beams. "The bond between Pokemon and trainer transcends science!" he declares.',
    effect: { stats: { Instinct: 14, Speed: 10 }, skillPoints: 18, energy: 20 }
  },
  DianthaDiancie: {
    name: 'Dazzling Showcase',
    description: 'Diantha performs with Diancie\'s brilliance.',
    flavor: 'Diancie\'s diamonds sparkle radiantly. Diantha smiles, "A champion shines brightest under pressure\u2014be dazzling!"',
    effect: { stats: { HP: 12, Defense: 15 }, moveHint: 'DiamondStorm', energy: 18 }
  },
  MaxieGroudon: {
    name: 'Land Expansion',
    description: 'Maxie demonstrates earth-shaking power.',
    flavor: 'Groudon\'s presence makes the ground tremble. Maxie declares, "The land itself will bow to our strength!"',
    effect: { stats: { HP: 11, Attack: 13 }, moveHint: 'Earthquake', energy: 16 }
  },
  ArchieKyogre: {
    name: 'Ocean\'s Depth',
    description: 'Archie channels the power of the seas.',
    flavor: 'Kyogre summons massive waves. Archie roars, "The ocean\'s fury is unstoppable\u2014embrace its power!"',
    effect: { stats: { HP: 13, Defense: 11 }, moveHint: 'HydroPump', energy: 17 }
  }
};


// ============================================================================
// SECTION 3: REACT COMPONENT
// ============================================================================

/**
 * Main Pokemon Career Game Component
 * 
 * This is an Uma Musume-inspired Pokemon training game where players:
 * - Select a starter Pokemon and support characters
 * - Train stats over 60 turns
 * - Battle gym leaders at turn 12, 24, 36, 48, 60
 * - Can evolve Pokemon by reaching stat thresholds
 * - Learn new moves through training
 * 
 * Game Flow:
 * 1. Menu -> Pokemon Selection -> Support Selection
 * 2. Career Mode (60 turns of training/resting)
 * 3. Gym Battles (every 12 turns)
 * 4. Victory or Game Over
 */
export default function PokemonCareerGame() {
  // ===== API CONFIGURATION =====
  // Use environment variable if available, otherwise construct from current location
  const API_URL = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 
       process.env.REACT_APP_API_URL || 
       'https://pokesume-backend-production.up.railway.app/api')
    : 'https://pokesume-backend-production.up.railway.app/api';
  
  console.log('[API] Using API_URL:', API_URL);
  
  // ===== AUTH STATE =====
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pokesume_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load user:', error);
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('pokesume_token') || null);
  const [authError, setAuthError] = useState(null);
  const [showAuth, setShowAuth] = useState(false); // Login/Register modal
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  
  // ===== TOURNAMENT STATE =====
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState([null, null, null]); // 3 Pokemon roster IDs
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const [selectedReplay, setSelectedReplay] = useState(null); // For watching tournament battles
  const [userRosters, setUserRosters] = useState([]); // Rosters loaded from backend
  
  // ===== EXISTING STATE =====
  const [gameState, setGameState] = useState('menu');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedSupports, setSelectedSupports] = useState([]);
  const [selectedInspirations, setSelectedInspirations] = useState([]);
  const [inspirationSortMode, setInspirationSortMode] = useState('stars'); // 'stars', 'stat', 'aptitude'
  const [careerData, setCareerData] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [viewMode, setViewMode] = useState('training');
  const [evolutionModal, setEvolutionModal] = useState(null); // { fromName, toName, stats }
  const [inspirationModal, setInspirationModal] = useState(null); // { turn, results }
  const [pokeclockModal, setPokeclockModal] = useState(false);
  const [careerHistory, setCareerHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('pokemonCareerHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load career history:', error);
      return [];
    }
  });
  
  // Global error handler
  useEffect(() => {
    const handleError = (event) => {
      console.error('=== GLOBAL ERROR ===');
      console.error('Error:', event.error);
      console.error('Message:', event.message);
      console.error('Stack:', event.error?.stack);
      console.error('Game State:', gameState);
      console.error('View Mode:', viewMode);
      console.error('Career Data exists:', !!careerData);
      console.error('Evolution Modal:', evolutionModal);
      console.error('Battle State:', battleState);
      console.error('===================');
    };

    const handleUnhandledRejection = (event) => {
      console.error('=== UNHANDLED PROMISE REJECTION ===');
      console.error('Reason:', event.reason);
      console.error('Promise:', event.promise);
      console.error('Game State:', gameState);
      console.error('===================================');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [gameState, viewMode, careerData, evolutionModal, battleState]);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1); // 1x or 2x speed
  const [rollResult, setRollResult] = useState(null); // For gacha roll result
  const [pokemonSortBy, setPokemonSortBy] = useState('default'); // default, type, rarity, name
  const [supportSortBy, setSupportSortBy] = useState('rarity'); // rarity, type
  const [trainedSortBy, setTrainedSortBy] = useState('date'); // date, grade, type
  const [trainedFilterGrade, setTrainedFilterGrade] = useState('all'); // all, UU, S, A, B, C, D, E
  const [pokemonFilterType, setPokemonFilterType] = useState('all'); // all, Fire, Water, Grass, Electric, Psychic, Fighting, Normal
  const [supportFilterRarity, setSupportFilterRarity] = useState('all'); // all, Legendary, Rare, Uncommon, Common
  const [trainedPokemon, setTrainedPokemon] = useState(() => {
    try {
      const saved = localStorage.getItem('trainedPokemon');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load trained pokemon:', error);
      return [];
    }
  });
  const [pokemonInventory, setPokemonInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('pokemonInventory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load pokemon inventory:', error);
      return [];
    }
  });
  const [primos, setPrimos] = useState(() => {
    try {
      const saved = localStorage.getItem('playerPrimos');
      return saved ? parseInt(saved) : 1000;
    } catch (error) {
      console.error('Failed to load primos:', error);
      return 1000;
    }
  });
  const [supportInventory, setSupportInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('supportInventory');
      if (saved) {
        return JSON.parse(saved);
      }
      // First time initialization - give 5 common supports
      const commonSupports = ['WhitneyMiltank', 'ChuckPoliwrath', 'PryceDelibird', 'WattsonMagneton', 'FlanneryCamerupt'];
      localStorage.setItem('supportInventory', JSON.stringify(commonSupports));
      return commonSupports;
    } catch (error) {
      console.error('Failed to load support inventory:', error);
      return [];
    }
  });
  const battleTimerRef = useRef(null);
  const savedCareersRef = useRef(new Set());
  const battleLogRef = useRef(null);
  const lastProcessedTurnRef = useRef(null);
  const isResettingRef = useRef(false);

  // Tournament data loading
  useEffect(() => {
    if (gameState === 'tournaments') {
      const loadTournaments = async () => {
        setTournamentsLoading(true);
        const data = await apiGetTournaments();
        setTournaments(data);
        setTournamentsLoading(false);
      };
      loadTournaments();
      
      const interval = setInterval(loadTournaments, 30000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Tournament details loading
  useEffect(() => {
    if (gameState === 'tournamentDetails' && selectedTournament) {
      const loadDetails = async () => {
        const details = await apiGetTournamentDetails(selectedTournament.id);
        setTournamentDetails(details);
      };
      loadDetails();
      
      const interval = setInterval(loadDetails, 30000);
      return () => clearInterval(interval);
    }
  }, [gameState, selectedTournament]);

  // Tournament bracket loading
  useEffect(() => {
    if (gameState === 'tournamentBracket' && selectedTournament) {
      const loadBracket = async () => {
        const bracket = await apiGetTournamentBracket(selectedTournament.id);
        setTournamentBracket(bracket);
      };
      loadBracket();
      
      const interval = setInterval(loadBracket, 30000);
      return () => clearInterval(interval);
    }
  }, [gameState, selectedTournament]);

  // Debug: Track evolutionModal changes
  useEffect(() => {
    console.log('evolutionModal state changed:', evolutionModal);
  }, [evolutionModal]);

  useEffect(() => {
    if (!isResettingRef.current) {
      localStorage.setItem('supportInventory', JSON.stringify(supportInventory));
    }
  }, [supportInventory]);

  // Load user rosters when entering tournament details screen
  useEffect(() => {
    if (gameState === 'tournamentDetails' && user && authToken) {
      apiGetRosters(100, 0).then(rosters => {
        console.log('[Tournament] Loaded rosters:', rosters);
        console.log('[Tournament] First roster sample:', rosters[0]);
        if (rosters.length > 0 && !rosters[0].roster_id) {
          console.error('[Tournament] ERROR: Rosters missing roster_id field!', rosters[0]);
        }
        setUserRosters(rosters || []);
      });
    }
  }, [gameState, user, authToken]);

  const handleResetData = () => {
    console.log('=== handleResetData FUNCTION CALLED ===');
    console.log('Current state - pokemonInventory:', pokemonInventory.length);
    console.log('Current state - primos:', primos);
    console.log('Current state - careerHistory:', careerHistory.length);
    console.log('Current showResetConfirm:', showResetConfirm);
    
    // Show custom confirmation dialog instead of browser confirm
    console.log('Setting showResetConfirm to true');
    setShowResetConfirm(true);
    console.log('After setShowResetConfirm call');
  };

  const confirmReset = () => {
    console.log('=== STARTING RESET ===');
    
    // Set flag to prevent useEffect from saving
    isResettingRef.current = true;
    console.log('Set isResettingRef to true');
    
    // Clear all localStorage data FIRST
    console.log('Clearing localStorage...');
    localStorage.removeItem('pokemonCareerHistory');
    localStorage.removeItem('pokemonInventory');
    localStorage.removeItem('playerPrimos');
    localStorage.removeItem('supportInventory');
    localStorage.removeItem('trainedPokemon');
    console.log('localStorage cleared');
    
    // Reset all state to initial values
    console.log('Resetting state...');
    setCareerHistory([]);
    setPokemonInventory([]);
    setPrimos(1000);
    setTrainedPokemon([]);
    // New game starts with 5 common support cards
    const commonSupports = ['WhitneyMiltank', 'ChuckPoliwrath', 'PryceDelibird', 'WattsonMagneton', 'FlanneryCamerupt'];
    setSupportInventory(commonSupports);
    localStorage.setItem('supportInventory', JSON.stringify(commonSupports));
    
    setGameState('menu');
    setCareerData(null);
    setBattleState(null);
    setSelectedPokemon(null);
    setSelectedSupports([]);
    setViewMode('training');
    setRollResult(null);
    setShowResetConfirm(false);
    console.log('State reset complete');
    
    // Clear flag after a delay to allow state updates
    setTimeout(() => {
      isResettingRef.current = false;
      console.log('=== RESET COMPLETE - isResettingRef set to false ===');
    }, 100);
  };

  // ===== API UTILITY FUNCTIONS =====
  
  // Auth: Register new user
  const apiRegister = async (username, email, password) => {
    try {
      console.log('apiRegister called:', { username, email });
      setAuthError(null);
      
      const url = `${API_URL}/auth/register`;
      console.log('Fetching:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Save token and user
      setAuthToken(data.token);
      setUser(data.user);
      localStorage.setItem('pokesume_token', data.token);
      localStorage.setItem('pokesume_user', JSON.stringify(data.user));
      setShowAuth(false);
      
      return data;
    } catch (error) {
      console.error('apiRegister error:', error);
      setAuthError(error.message);
      throw error;
    }
  };
  
  // Auth: Login existing user
  const apiLogin = async (username, password) => {
    try {
      console.log('apiLogin called:', { username });
      setAuthError(null);
      
      const url = `${API_URL}/auth/login`;
      console.log('Fetching:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Save token and user
      setAuthToken(data.token);
      setUser(data.user);
      localStorage.setItem('pokesume_token', data.token);
      localStorage.setItem('pokesume_user', JSON.stringify(data.user));
      setShowAuth(false);
      
      return data;
    } catch (error) {
      console.error('apiLogin error:', error);
      setAuthError(error.message);
      throw error;
    }
  };
  
  // Auth: Logout
  const apiLogout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('pokesume_token');
    localStorage.removeItem('pokesume_user');
  };
  
  // Pokemon: Save roster to backend (career completion)
  const apiSaveRoster = async (pokemonData, turnNumber) => {
    if (!authToken) return null;
    
    try {
      const response = await fetch(`${API_URL}/pokemon/roster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ pokemonData, turnNumber })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save roster');
      }
      
      return data;
    } catch (error) {
      console.error('Save roster error:', error);
      return null;
    }
  };
  
  // Pokemon: Get user's saved rosters
  const apiGetRosters = async (limit = 10, offset = 0) => {
    if (!authToken) return [];
    
    try {
      const response = await fetch(`${API_URL}/pokemon/rosters?limit=${limit}&offset=${offset}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rosters');
      }
      
      return data.rosters;
    } catch (error) {
      console.error('Fetch rosters error:', error);
      return [];
    }
  };
  
  // PVP: Get available opponents
  const apiGetOpponents = async (limit = 20, ratingRange = 200) => {
    if (!authToken) return [];
    
    try {
      const response = await fetch(`${API_URL}/pvp/opponents?limit=${limit}&ratingRange=${ratingRange}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch opponents');
      }
      
      return data.opponents;
    } catch (error) {
      console.error('Fetch opponents error:', error);
      return [];
    }
  };
  
  // PVP: Submit battle result
  const apiSubmitBattle = async (opponentRosterId, winnerId, battleData) => {
    if (!authToken) return null;
    
    try {
      const response = await fetch(`${API_URL}/pvp/battle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ opponentRosterId, winnerId, battleData })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit battle');
      }
      
      // Update local user rating
      if (data.newRatings && data.newRatings.player) {
        setUser(prev => ({ ...prev, rating: data.newRatings.player }));
        const updatedUser = { ...user, rating: data.newRatings.player };
        localStorage.setItem('pokesume_user', JSON.stringify(updatedUser));
      }
      
      return data;
    } catch (error) {
      console.error('Submit battle error:', error);
      return null;
    }
  };
  
  // Leaderboard: Get global leaderboard
  const apiGetLeaderboard = async (limit = 100) => {
    try {
      const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }
      
      return data.leaderboard;
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
      return [];
    }
  };
  
  // Leaderboard: Get user's rank
  const apiGetUserRank = async () => {
    if (!authToken) return null;
    
    try {
      const response = await fetch(`${API_URL}/leaderboard/rank`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rank');
      }
      
      return data.userRank;
    } catch (error) {
      console.error('Fetch rank error:', error);
      return null;
    }
  };

  // Tournament: Get all tournaments
  const apiGetTournaments = async () => {
    try {
      const response = await fetch(`${API_URL}/tournaments`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tournaments');
      }
      
      return data.tournaments;
    } catch (error) {
      console.error('Fetch tournaments error:', error);
      return [];
    }
  };

  // Tournament: Get tournament details
  const apiGetTournamentDetails = async (tournamentId) => {
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tournament details');
      }
      
      return data;
    } catch (error) {
      console.error('Fetch tournament details error:', error);
      return null;
    }
  };

  // Tournament: Enter tournament
  const apiEnterTournament = async (tournamentId, pokemon1RosterId, pokemon2RosterId, pokemon3RosterId) => {
    if (!authToken) return null;
    
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}/enter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ pokemon1RosterId, pokemon2RosterId, pokemon3RosterId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enter tournament');
      }
      
      return data;
    } catch (error) {
      console.error('Enter tournament error:', error);
      throw error;
    }
  };

  // Tournament: Get bracket
  const apiGetTournamentBracket = async (tournamentId) => {
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}/bracket`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bracket');
      }
      
      return data.bracket;
    } catch (error) {
      console.error('Fetch bracket error:', error);
      return [];
    }
  };

  // Tournament: Withdraw from tournament
  const apiWithdrawTournament = async (tournamentId) => {
    if (!authToken) return null;
    
    try {
      const response = await fetch(`${API_URL}/tournaments/${tournamentId}/withdraw`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to withdraw');
      }
      
      return data;
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    }
  };

  // Auth form handlers
  const handleAuthSubmit = async (e) => {
    console.log('[Auth] handleAuthSubmit called', { authMode, username: authForm.username });
    e.preventDefault();
    e.stopPropagation();
    setAuthError(null);
    setAuthLoading(true);

    try {
      console.log('Auth submit:', authMode, authForm.username);
      
      if (authMode === 'register') {
        // Use email if provided, otherwise use username@pokesume.local
        const email = authForm.email || `${authForm.username}@pokesume.local`;
        console.log('Calling apiRegister...');
        const result = await apiRegister(authForm.username, email, authForm.password);
        console.log('Registration successful!', result);
        if (result) {
          setShowAuth(false);
          setAuthForm({ username: '', email: '', password: '' });
        }
      } else {
        console.log('Calling apiLogin...');
        const result = await apiLogin(authForm.username, authForm.password);
        console.log('Login successful!', result);
        if (result) {
          setShowAuth(false);
          setAuthForm({ username: '', email: '', password: '' });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthLogout = () => {
    apiLogout();
    setGameState('menu');
  };

  const handleAuthFormChange = (field, value) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAuthClose = () => {
    setShowAuth(false);
    setAuthError(null);
    setAuthForm({ username: '', email: '', password: '' });
  };

  const handleAuthModeChange = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setAuthError(null);
  };

  // ===== EXISTING GAME LOGIC FUNCTIONS =====

    const rollForPokemon = () => {
        if (primos < 100) return null;

        const roll = Math.random();
        let cumulative = 0;
        let rarity = 'Common';

        for (const [rarityTier, data] of Object.entries(GACHA_RARITY)) {
            cumulative += data.rate;
            if (roll < cumulative) {
                rarity = rarityTier;
                break;
            }
        }

        const pokemonList = GACHA_RARITY[rarity].pokemon;
        const rolledPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];

        // Check for duplicate
        if (pokemonInventory.includes(rolledPokemon)) {
            // Refund primos for duplicate
            return { pokemon: rolledPokemon, rarity, isDuplicate: true };
        }

        setPrimos(prev => prev - 100);
        setPokemonInventory(prev => [...prev, rolledPokemon]);

        return { pokemon: rolledPokemon, rarity, isDuplicate: false };
    };

  const initializeCareer = () => {
    console.log('[initializeCareer] Selected inspirations:', selectedInspirations);
    const pokemon = { ...POKEMON[selectedPokemon] };
    const stats = { ...pokemon.baseStats };
    
    selectedSupports.forEach(supportKey => {
      const support = getSupportCardAttributes(supportKey);
      if (support && support.baseStatIncrease) {
        Object.keys(support.baseStatIncrease).forEach(stat => {
          stats[stat] += support.baseStatIncrease[stat];
        });
      }
    });

    const friendships = {};
    selectedSupports.forEach(supportKey => {
      const support = getSupportCardAttributes(supportKey);
      if (support) {
        friendships[supportKey] = support.initialFriendship;
      }
    });

    const gymLeaders = generateGymLeaders();

    setCareerData({
      pokemon,
      currentStats: stats,
      turn: 1,
      energy: GAME_CONFIG.CAREER.STARTING_ENERGY,
      skillPoints: 30,
      knownAbilities: [...pokemon.defaultAbilities],
      supportFriendships: friendships,
      currentTrainingOptions: null,
      gymLeaders,
      currentGymIndex: 0,
      availableBattles: generateWildBattles(1),
      turnLog: [],
      moveHints: {}, // Track how many hints received per move
      completedHangouts: [], // Track which hangout events have been completed
      pendingEvent: null, // Current event that needs to be resolved
      timestamp: Date.now(), // Add timestamp for tracking in history
      evolutionStage: 0, // Track current evolution stage (0 = base, 1 = stage 1, 2 = stage 2)
      basePokemonName: pokemon.name, // Track original base Pokemon name for evolution chain lookup
      pokeclocks: 3 // Player starts with 3 pokeclocks for battle retries
    });
    setViewMode('training');
    setGameState('career');
  };

  const generateGymLeaders = () => {
    const allGymLeaders = [
      { name: 'Blaine', type: 'Fire', pokemon: LEGENDARY_POKEMON.Moltres },
      { name: 'Misty', type: 'Water', pokemon: LEGENDARY_POKEMON.Articuno },
      { name: 'Erika', type: 'Grass', pokemon: LEGENDARY_POKEMON.Celebi },
      { name: 'Lt. Surge', type: 'Electric', pokemon: LEGENDARY_POKEMON.Raikou },
      { name: 'Agatha', type: 'Poison', pokemon: LEGENDARY_POKEMON.Gengar },
      { name: 'Giovanni', type: 'Fire', pokemon: LEGENDARY_POKEMON.Entei },
      { name: 'Wallace', type: 'Water', pokemon: LEGENDARY_POKEMON.Suicune },
      { name: 'Wattson', type: 'Electric', pokemon: LEGENDARY_POKEMON.Zapdos },
      { name: 'Will', type: 'Psychic', pokemon: LEGENDARY_POKEMON.Lugia },
      { name: 'Flannery', type: 'Fire', pokemon: LEGENDARY_POKEMON.HoOh },
      { name: 'Sabrina', type: 'Psychic', pokemon: LEGENDARY_POKEMON.Mewtwo },
      { name: 'Juan', type: 'Water', pokemon: LEGENDARY_POKEMON.Kyogre },
      { name: 'Maxie', type: 'Fire', pokemon: LEGENDARY_POKEMON.Groudon },
      { name: 'Winona', type: 'Grass', pokemon: LEGENDARY_POKEMON.Rayquaza },
      { name: 'Bruno', type: 'Fighting', pokemon: LEGENDARY_POKEMON.Dialga }
    ];
    
    // Randomly shuffle and pick 5 gym leaders
    const shuffled = [...allGymLeaders].sort(() => Math.random() - 0.5);
    const selectedLeaders = shuffled.slice(0, 5);
    
    return selectedLeaders.map((data, idx) => {
      const baseMultiplier = (1.0 + (idx * 0.5)) * 1.26284; // Increased by 10%: 26.3% total boost (was 14.8%)
      const pokemon = data.pokemon;
      return {
        name: data.name,
        type: data.type,
        pokemon: pokemon.name,
        stats: {
          HP: Math.floor(pokemon.baseStats.HP * baseMultiplier),
          Attack: Math.floor(pokemon.baseStats.Attack * baseMultiplier),
          Defense: Math.floor(pokemon.baseStats.Defense * baseMultiplier),
          Instinct: Math.floor(pokemon.baseStats.Instinct * baseMultiplier),
          Speed: Math.floor(pokemon.baseStats.Speed * baseMultiplier)
        },
        abilities: ['Tackle', 'BodySlam', ...pokemon.learnableAbilities],
        typeAptitudes: pokemon.typeAptitudes,
        strategy: pokemon.strategy,
        strategyGrade: pokemon.strategyGrade,
        primaryType: data.type
      };
    });
  };

  const generateWildBattles = (turn) => {
    // Aggressive scaling with 4% boost, 30% increase, and additional 25% increase: start at 1.04x, grow faster
    const startMultiplier = 1.0 * 1.04;
    const growthPerTurn = 0.03125 * 1.04 * 1.3 * 1.25; // Increased by 30% then by 25% more
    const difficultyMult = startMultiplier + (turn * growthPerTurn);
    
    // Randomly select 2 pokemons from all available pokemons
    const allPokemons = Object.values(POKEMON);
    const shuffled = [...allPokemons].sort(() => Math.random() - 0.5);
    const selectedPokemons = shuffled.slice(0, 2);
    
    return selectedPokemons.map(pokemon => {
      // Determine move pool based on turn
      let availableAbilities = [...pokemon.defaultAbilities];
      
      // Add learnable abilities progressively
      if (turn >= 8) {
        // Add first 2 learnable abilities
        availableAbilities.push(...pokemon.learnableAbilities.slice(0, 2));
      }
      if (turn >= 16) {
        // Add next 2 learnable abilities
        availableAbilities.push(...pokemon.learnableAbilities.slice(2, 4));
      }
      if (turn >= 24) {
        // Add all remaining learnable abilities
        availableAbilities.push(...pokemon.learnableAbilities.slice(4));
      }
      
      // Add colorless abilities at higher turns
      if (turn >= 20) {
        availableAbilities.push('BodySlam');
      }
      if (turn >= 36) {
        availableAbilities.push('HyperBeam');
      }
      
      // Remove duplicates
      availableAbilities = [...new Set(availableAbilities)];
      
      return {
        name: `Wild ${pokemon.name}`,
        pokemon: pokemon.name,
        primaryType: pokemon.primaryType,
        stats: {
          HP: Math.floor(pokemon.baseStats.HP * difficultyMult),
          Attack: Math.floor(pokemon.baseStats.Attack * difficultyMult),
          Defense: Math.floor(pokemon.baseStats.Defense * difficultyMult),
          Instinct: Math.floor(pokemon.baseStats.Instinct * difficultyMult),
          Speed: Math.floor(pokemon.baseStats.Speed * difficultyMult)
        },
        abilities: availableAbilities,
        typeAptitudes: pokemon.typeAptitudes,
        strategy: pokemon.strategy,
        strategyGrade: pokemon.strategyGrade
      };
    });
  };

  const generateTrainingOptions = () => {
    const options = {};
    const stats = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];
    
    stats.forEach(stat => {
      options[stat] = {
        supports: [],
        hint: null
      };
    });

    selectedSupports.forEach(supportName => {
      const support = getSupportCardAttributes(supportName);
      if (!support) return;
      
      if (Math.random() < support.appearanceChance) {
        const supportType = support.type || support.supportType;
        const weights = stats.map(stat => stat === supportType ? support.typeAppearancePriority : 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const roll = Math.random() * totalWeight;
        let cumulative = 0;
        let selectedStat = stats[0];
        for (let i = 0; i < stats.length; i++) {
          cumulative += weights[i];
          if (roll < cumulative) {
            selectedStat = stats[i];
            break;
          }
        }
        
        const hasHint = Math.random() < 0.15;
        if (hasHint && support.moveHints && support.moveHints.length > 0) {
          const hint = support.moveHints[Math.floor(Math.random() * support.moveHints.length)];
          options[selectedStat].hint = { support: supportName, move: hint };
        }
        
        options[selectedStat].supports.push(supportName);
      }
    });

    return options;
  };

  // Evolution helper functions
  const checkForEvolution = (pokemonName, currentStats) => {
    // Use basePokemonName from careerData to look up the evolution chain
    const baseName = careerData?.basePokemonName || pokemonName;
    const evolutionChain = EVOLUTION_CHAINS[baseName];
    if (!evolutionChain) return null;

    const currentGrade = getPokemonGrade(currentStats);
    const currentStage = careerData?.evolutionStage || 0;

    // Check for stage 1 evolution (at C grade)
    if (currentStage === 0 && evolutionChain.stage1 && ['C+', 'C', 'B+', 'B', 'A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
      return { toName: evolutionChain.stage1, toStage: 1 };
    }

    // Check for stage 2 evolution (at A grade)
    if (currentStage === 1 && evolutionChain.stage2 && ['A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
      return { toName: evolutionChain.stage2, toStage: 2 };
    }

    return null;
  };

  const applyEvolution = (fromName, toName, toStage) => {
    console.log('=== applyEvolution START ===');
    console.log('fromName:', fromName, 'toName:', toName, 'toStage:', toStage);
    console.log('Current stats BEFORE evolution:', careerData.currentStats);
    
    // Determine stat boost based on evolution chain
    const baseName = careerData.basePokemonName || careerData.pokemon.name;
    const evolutionChain = EVOLUTION_CHAINS[baseName];
    const statBoost = evolutionChain && evolutionChain.stages === 2 
      ? EVOLUTION_CONFIG.STAT_BOOST.TWO_STAGE  // 5% for two-stage evolutions
      : EVOLUTION_CONFIG.STAT_BOOST.ONE_STAGE; // 10% for one-stage evolutions
    
    console.log('Base Pokemon:', baseName);
    console.log('Evolution chain stages:', evolutionChain?.stages);
    console.log('Applying stat boost:', (statBoost * 100) + '%');
    
    const newStats = {};
    for (const [stat, value] of Object.entries(careerData.currentStats)) {
      newStats[stat] = Math.round(value * (1 + statBoost));
    }
    console.log('New stats AFTER boost:', newStats);

    // Get evolution data - if it doesn't exist, keep current Pokemon data but update name
    const evolutionData = POKEMON[toName];
    console.log('evolutionData exists?:', !!evolutionData);
    
    if (!evolutionData) {
      console.log('No evolution data found - using base Pokemon data with updated name');
      // Keep current Pokemon data but update the name
      const updatedPokemon = {
        ...careerData.pokemon,
        name: toName
      };
      
      console.log('Updated pokemon object:', updatedPokemon);
      console.log('Setting currentStats to:', newStats);
      
      setCareerData(prev => {
        const updated = {
          ...prev,
          pokemon: updatedPokemon,
          currentStats: newStats,
          evolutionStage: toStage,
          basePokemonName: prev.basePokemonName,
          turnLog: [{
            turn: prev.turn,
            type: 'evolution',
            message: `${fromName} evolved into ${toName}!`
          }, ...prev.turnLog]
        };
        console.log('New careerData after evolution:', updated);
        return updated;
      });
      
      setEvolutionModal(null);
      console.log('=== applyEvolution END ===');
      return;
    }
    
    // Add signature move for final evolution
    let signatureMove = null;
    const chain = EVOLUTION_CHAINS[baseName];
    if (chain) {
      if ((chain.stages === 1 && toStage === 1) || (chain.stages === 2 && toStage === 2)) {
        // Add signature move based on type
        const moveMap = {
          Fire: 'FireBlast',
          Water: 'HydroPump',
          Grass: 'SolarBeam',
          Poison: 'PsychicBlast',
          Electric: 'Thunder'
        };
        signatureMove = moveMap[evolutionData.primaryType];
      }
    }

    const newLearnableAbilities = [...careerData.pokemon.learnableAbilities];
    if (signatureMove && !newLearnableAbilities.includes(signatureMove) && !careerData.knownAbilities.includes(signatureMove)) {
      newLearnableAbilities.push(signatureMove);
    }

    setCareerData(prev => ({
      ...prev,
      pokemon: {
        ...evolutionData,
        learnableAbilities: newLearnableAbilities
      },
      currentStats: newStats,
      evolutionStage: toStage,
      basePokemonName: prev.basePokemonName, // Preserve the original base name
      turnLog: [{
        turn: prev.turn,
        type: 'evolution',
        message: `${fromName} evolved into ${toName}!${signatureMove ? ` Learned signature move: ${signatureMove}!` : ''}`
      }, ...prev.turnLog]
    }));

    setEvolutionModal(null);
  };

  const performTraining = (stat) => {
    const energyCost = GAME_CONFIG.TRAINING.ENERGY_COSTS[stat];
    const currentEnergy = careerData.energy;
    
    // Calculate failure chance based on CURRENT energy (before deduction)
    // Reduced intensity by ~10%: More lenient curve
    let failureChance = 0;
    if (currentEnergy <= 75) {
      if (currentEnergy <= 0) {
        failureChance = 0.891; // Was 0.99
      } else if (currentEnergy <= 20) {
        // Between 0 and 20: interpolate from 89.1% to 67.5%
        failureChance = 0.891 - ((currentEnergy / 20) * 0.216);
      } else if (currentEnergy <= 30) {
        // Between 20 and 30: interpolate from 67.5% to 45%
        failureChance = 0.675 - (((currentEnergy - 20) / 10) * 0.225);
      } else if (currentEnergy <= 50) {
        // Between 30 and 50: interpolate from 45% to 22.5%
        failureChance = 0.45 - (((currentEnergy - 30) / 20) * 0.225);
      } else {
        // Between 50 and 75: interpolate from 22.5% to 0%
        failureChance = 0.225 - (((currentEnergy - 50) / 25) * 0.225);
      }
    }
    
    // Speed training has 50% lower fail rate than other trainings
    if (stat === 'Speed') {
      failureChance *= 0.5;
    }
    
    const trainingFailed = Math.random() < failureChance;
    
    if (trainingFailed) {
      // Speed training doesn't reduce stats on failure
      const statLoss = stat === 'Speed' ? 0 : GAME_CONFIG.TRAINING.STAT_LOSS_ON_FAILURE;
      
      const logEntry = {
        turn: careerData.turn,
        type: 'training_fail',
        stat,
        message: stat === 'Speed' 
          ? `Training ${stat} failed! No stat loss.`
          : `Training ${stat} failed! Lost ${statLoss} ${stat}.`
      };
      
      setCareerData(prev => ({
        ...prev,
        currentStats: {
          ...prev.currentStats,
          [stat]: Math.max(1, prev.currentStats[stat] - statLoss)
        },
        turn: prev.turn + 1,
        currentTrainingOptions: null,
        turnLog: [logEntry, ...prev.turnLog]
      }));
      return;
    }

    let statGain = GAME_CONFIG.TRAINING.BASE_STAT_GAINS[stat];
    let skillGain = GAME_CONFIG.TRAINING.SKILL_POINTS_ON_SUCCESS;
    const newFriendships = { ...careerData.supportFriendships };
    let hintedMove = null;

    const trainingOption = careerData.currentTrainingOptions[stat];
    trainingOption.supports.forEach(supportName => {
      const support = getSupportCardAttributes(supportName);
      if (!support) return;
      
      const friendship = careerData.supportFriendships[supportName];
      const isMaxFriendship = friendship >= 100;
      const supportType = support.type || support.supportType;
      
      if (supportType === stat) {
        statGain += isMaxFriendship ? support.friendshipBonusTraining : support.typeBonusTraining;
      } else {
        statGain += support.generalBonusTraining;
      }
      
      newFriendships[supportName] = Math.min(100, friendship + GAME_CONFIG.TRAINING.FRIENDSHIP_GAIN_PER_TRAINING);
    });

    if (trainingOption.hint) {
      hintedMove = trainingOption.hint.move;
      newFriendships[trainingOption.hint.support] = Math.min(100, newFriendships[trainingOption.hint.support] + 15);
    }

    const newStats = { ...careerData.currentStats };
    newStats[stat] = careerData.currentStats[stat] + statGain;

    // Add hinted move to learnable pool if not already there
    const newLearnableAbilities = [...careerData.pokemon.learnableAbilities];
    const newMoveHints = { ...careerData.moveHints };
    if (hintedMove && !newLearnableAbilities.includes(hintedMove) && !careerData.knownAbilities.includes(hintedMove)) {
      newLearnableAbilities.push(hintedMove);
    }
    if (hintedMove) {
      newMoveHints[hintedMove] = (newMoveHints[hintedMove] || 0) + 1;
    }

    const logEntry = {
      turn: careerData.turn,
      type: 'training_success',
      stat,
      statGain,
      skillGain,
      hintedMove,
      message: `Trained ${stat}! +${statGain} ${stat}, +${skillGain} SP${hintedMove ? `, unlocked ${hintedMove} to learn!` : ''}`
    };

    setCareerData(prev => {
      const nextTurn = prev.turn + 1;
      
      // Check for inspiration event and apply before creating updatedData
      console.log('[performTraining] Checking inspiration for turn', nextTurn, 'with', selectedInspirations?.length, 'selections');
      let finalStats = { ...newStats };
      let finalAptitudes = { ...prev.pokemon.typeAptitudes };
      const inspirationResult = checkAndApplyInspiration(nextTurn, selectedInspirations, newStats, prev.pokemon.typeAptitudes);
      if (inspirationResult && inspirationResult.results.length > 0) {
        // Use the updated stats and aptitudes from inspiration result
        finalStats = inspirationResult.updatedStats;
        finalAptitudes = inspirationResult.updatedAptitudes;
        
        // Show inspiration modal
        console.log('[Training] Setting inspiration modal:', inspirationResult);
        setTimeout(() => {
          setInspirationModal(inspirationResult);
        }, 0);
      }
      
      const updatedData = {
        ...prev,
        currentStats: finalStats,
        energy: Math.max(0, Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, prev.energy - energyCost)),
        skillPoints: prev.skillPoints + skillGain,
        supportFriendships: newFriendships,
        pokemon: {
          ...prev.pokemon,
          learnableAbilities: newLearnableAbilities,
          typeAptitudes: finalAptitudes
        },
        moveHints: newMoveHints,
        turn: nextTurn,
        currentTrainingOptions: null,
        availableBattles: prev.turn % 12 === 0 ? generateWildBattles(prev.turn + 1) : prev.availableBattles,
        turnLog: [logEntry, ...prev.turnLog]
      };

      // Check for evolution with updated stats immediately
      const baseName = updatedData.basePokemonName || updatedData.pokemon.name;
      const evolutionChain = EVOLUTION_CHAINS[baseName];
      const currentGrade = getPokemonGrade(finalStats);
      const currentStage = updatedData.evolutionStage || 0;
      const totalStats = Object.values(finalStats).reduce((sum, val) => sum + val, 0);
      
      console.log('=== EVOLUTION CHECK (Training) ===');
      console.log('Pokemon:', updatedData.pokemon.name);
      console.log('Base Name:', baseName);
      console.log('Current Stage:', currentStage);
      console.log('Total Stats:', totalStats);
      console.log('Current Grade:', currentGrade);
      console.log('Evolution Chain:', evolutionChain);
      
      if (evolutionChain) {
        let evolution = null;
        // Check for stage 1 evolution (at C grade)
        if (currentStage === 0 && evolutionChain.stage1) {
          console.log('Checking stage 1 evolution...');
          console.log('Stage 1 name:', evolutionChain.stage1);
          console.log('Grade qualifies?', ['C+', 'C', 'B+', 'B', 'A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade));
          if (['C+', 'C', 'B+', 'B', 'A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
            evolution = { toName: evolutionChain.stage1, toStage: 1 };
            console.log('EVOLUTION TRIGGERED! Stage 1');
          }
        }
        // Check for stage 2 evolution (at A grade)
        else if (currentStage === 1 && evolutionChain.stage2) {
          console.log('Checking stage 2 evolution...');
          console.log('Stage 2 name:', evolutionChain.stage2);
          console.log('Grade qualifies?', ['A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade));
          if (['A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
            evolution = { toName: evolutionChain.stage2, toStage: 2 };
            console.log('EVOLUTION TRIGGERED! Stage 2');
          }
        }

        if (evolution) {
          console.log('Setting evolution modal...');
          // Use setTimeout to ensure state update completes first
          setTimeout(() => {
            setEvolutionModal({
              fromName: updatedData.pokemon.name,
              toName: evolution.toName,
              toStage: evolution.toStage,
              oldStats: prev.currentStats,
              newStats: finalStats
            });
          }, 0);
        } else {
          console.log('No evolution triggered');
        }
      } else {
        console.log('No evolution chain found for:', baseName);
      }
      console.log('=== END EVOLUTION CHECK ===');

      return updatedData;
    });
  };

  const performRest = () => {
    const roll = Math.random();
    let energyGain = GAME_CONFIG.REST.ENERGY_GAINS[1];
    if (roll < GAME_CONFIG.REST.PROBMOVES[0]) energyGain = GAME_CONFIG.REST.ENERGY_GAINS[0];
    else if (roll > 1 - GAME_CONFIG.REST.PROBMOVES[2]) energyGain = GAME_CONFIG.REST.ENERGY_GAINS[2];

    const logEntry = {
      turn: careerData.turn,
      type: 'rest',
      energyGain,
      message: `Rested and recovered ${energyGain} energy.`
    };

    setCareerData(prev => {
      const nextTurn = prev.turn + 1;
      
      // Check for inspiration event and apply before creating updatedData
      let finalStats = { ...prev.currentStats };
      let finalAptitudes = { ...prev.pokemon.typeAptitudes };
      const inspirationResult = checkAndApplyInspiration(nextTurn, selectedInspirations, prev.currentStats, prev.pokemon.typeAptitudes);
      if (inspirationResult && inspirationResult.results.length > 0) {
        // Use the updated stats and aptitudes from inspiration result
        finalStats = inspirationResult.updatedStats;
        finalAptitudes = inspirationResult.updatedAptitudes;
        
        setTimeout(() => {
          setInspirationModal(inspirationResult);
        }, 0);
      }
      
      const updatedData = {
        ...prev,
        currentStats: finalStats,
        energy: Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, prev.energy + energyGain),
        turn: nextTurn,
        currentTrainingOptions: null,
        availableBattles: prev.turn % 12 === 0 ? generateWildBattles(prev.turn + 1) : prev.availableBattles,
        turnLog: [logEntry, ...prev.turnLog],
        pokemon: {
          ...prev.pokemon,
          typeAptitudes: finalAptitudes
        }
      };
      
      return updatedData;
    });
  };

  const getBattleDisplayName = (combatant) => {
    // For gym leaders, show the Pokemon name instead of the title
    return combatant.pokemon || combatant.name;
  };

  const startBattle = (opponent, isGymLeader = false) => {
    // Prevent wild battles at 0 energy
    if (!isGymLeader && careerData.energy <= 0) {
      return; // Don't start battle
    }
    
    const playerPokemon = {
      name: careerData.pokemon.name,
      primaryType: careerData.pokemon.primaryType,
      stats: { ...careerData.currentStats },
      abilities: careerData.knownAbilities,
      typeAptitudes: careerData.pokemon.typeAptitudes,
      strategy: careerData.pokemon.strategy,
      strategyGrade: careerData.pokemon.strategyGrade
    };

    // Debug logging for Mewtwo
    if (playerPokemon.name === 'Mewtwo') {
      console.log('[startBattle] Mewtwo debug:', {
        name: playerPokemon.name,
        primaryType: playerPokemon.primaryType,
        abilities: playerPokemon.abilities,
        typeAptitudes: playerPokemon.typeAptitudes,
        strategy: playerPokemon.strategy,
        strategyGrade: playerPokemon.strategyGrade
      });
    }

    setBattleState({
      player: {
        ...playerPokemon,
        currentHP: playerPokemon.stats.HP,
        currentStamina: GAME_CONFIG.BATTLE.MAX_STAMINA,
        moveStates: {},
        isResting: false,
        statusEffects: [] // Array of active status effects
      },
      opponent: {
        ...opponent,
        currentHP: opponent.stats.HP,
        currentStamina: GAME_CONFIG.BATTLE.MAX_STAMINA,
        moveStates: {},
        isResting: false,
        statusEffects: []
      },
      tick: 0,
      log: [],
      isGymLeader
    });
    setGameState('battle');
  };

  const generateRandomEvent = () => {
    if (!careerData || !selectedSupports) return null;
    
    // Check for available hangout events
    const availableHangouts = selectedSupports.filter(supportName => {
      const friendship = careerData.supportFriendships[supportName];
      return friendship >= 80 && !careerData.completedHangouts.includes(supportName);
    });
    
    // If hangouts are available, 50% chance to pick a hangout event
    if (availableHangouts.length > 0 && Math.random() < 0.5) {
      const supportName = availableHangouts[Math.floor(Math.random() * availableHangouts.length)];
      const hangoutEvent = HANGOUT_EVENTS[supportName];
      if (hangoutEvent) {
        return {
          type: 'hangout',
          supportName,
          ...hangoutEvent
        };
      }
    }
    
    // Filter events: 70% chance to exclude negative events (30% reduction in incidence)
    const eventKeys = Object.keys(RANDOM_EVENTS);
    let filteredKeys = eventKeys;
    
    if (Math.random() < 0.7) {
      // Exclude negative events 70% of the time
      filteredKeys = eventKeys.filter(key => RANDOM_EVENTS[key].type !== 'negative');
    }
    
    // If we filtered out all events (shouldn't happen but safety check)
    if (filteredKeys.length === 0) {
      filteredKeys = eventKeys;
    }
    
    const randomKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
    const event = RANDOM_EVENTS[randomKey];
    
    return { ...event, key: randomKey };
  };

  const checkForRandomEvent = () => {
    if (!careerData || !selectedSupports) return;
    
    // No random events on turn 1
    if (careerData.turn === 1) return;
    
    // No random events on gym turns
    const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
    if (careerData.turn === nextGymTurn && careerData.currentGymIndex < 5) return;
    
    // 50% chance for an event each turn (excluding gym turns)
    if (Math.random() < 0.50) {
      const event = generateRandomEvent();
      if (event) {
        setCareerData(prev => ({
          ...prev,
          pendingEvent: event
        }));
      }
    }
  };

  const resolveEvent = (outcome) => {
    const eventResult = outcome.effect || outcome; // Handle both full outcome object and just effect
    const newStats = { ...careerData.currentStats };
    let energyChange = 0;
    let skillPointsChange = 0;
    let friendshipChanges = {};
    let moveHintReceived = null;
    let flavorText = outcome.flavor || null;

    if (eventResult.stats) {
      Object.keys(eventResult.stats).forEach(stat => {
        newStats[stat] = Math.max(1, newStats[stat] + eventResult.stats[stat]);
      });
    }
    
    if (eventResult.energy) energyChange = eventResult.energy;
    if (eventResult.skillPoints) skillPointsChange = eventResult.skillPoints;
    if (eventResult.friendship && careerData.pendingEvent?.supportName) {
      friendshipChanges[careerData.pendingEvent.supportName] = eventResult.friendship;
    }
    if (eventResult.moveHint) {
      moveHintReceived = eventResult.moveHint;
    }

    const newMoveHints = { ...careerData.moveHints };
    const newLearnableAbilities = [...careerData.pokemon.learnableAbilities];
    if (moveHintReceived) {
      newMoveHints[moveHintReceived] = (newMoveHints[moveHintReceived] || 0) + 1;
      if (!newLearnableAbilities.includes(moveHintReceived) && !careerData.knownAbilities.includes(moveHintReceived)) {
        newLearnableAbilities.push(moveHintReceived);
      }
    }

    const newFriendships = { ...careerData.supportFriendships };
    Object.keys(friendshipChanges).forEach(support => {
      newFriendships[support] = Math.min(100, newFriendships[support] + friendshipChanges[support]);
    });

    const completedHangouts = (careerData.pendingEvent?.type === 'hangout' && careerData.pendingEvent?.supportName)
      ? [...careerData.completedHangouts, careerData.pendingEvent.supportName]
      : careerData.completedHangouts;

    // Show result screen for choice and hangout events
    const shouldShowResult = careerData.pendingEvent?.type === 'choice' || careerData.pendingEvent?.type === 'hangout';

    setCareerData(prev => ({
      ...prev,
      currentStats: newStats,
      energy: Math.max(0, Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, prev.energy + energyChange)),
      skillPoints: prev.skillPoints + skillPointsChange,
      supportFriendships: newFriendships,
      moveHints: newMoveHints,
      pokemon: {
        ...prev.pokemon,
        learnableAbilities: newLearnableAbilities
      },
      completedHangouts,
      eventResult: shouldShowResult ? {
        stats: eventResult.stats || {},
        energy: energyChange,
        skillPoints: skillPointsChange,
        friendship: friendshipChanges,
        moveHint: moveHintReceived,
        flavor: flavorText
      } : null,
      pendingEvent: null,
      // Generate training options immediately for events that don't show result screens
      currentTrainingOptions: !shouldShowResult ? generateTrainingOptions() : prev.currentTrainingOptions
    }));
  };

  // Save career history to localStorage whenever it changes
  useEffect(() => {
    if (isResettingRef.current) {
      console.log('Skipping save during reset: careerHistory');
      return;
    }
    try {
      localStorage.setItem('pokemonCareerHistory', JSON.stringify(careerHistory));
    } catch (error) {
      console.error('Failed to save career history:', error);
    }
  }, [careerHistory]);

  // Save pokemon inventory to localStorage
  useEffect(() => {
    if (isResettingRef.current) {
      console.log('Skipping save during reset: pokemonInventory');
      return;
    }
    try {
      localStorage.setItem('pokemonInventory', JSON.stringify(pokemonInventory));
    } catch (error) {
      console.error('Failed to save pokemon inventory:', error);
    }
  }, [pokemonInventory]);

  // Save trained Pokemon to localStorage
  useEffect(() => {
    if (isResettingRef.current) {
      return;
    }
    try {
      localStorage.setItem('trainedPokemon', JSON.stringify(trainedPokemon));
    } catch (error) {
      console.error('Failed to save trained pokemon:', error);
    }
  }, [trainedPokemon]);

  // Save primos to localStorage
  useEffect(() => {
    if (isResettingRef.current) {
      console.log('Skipping save during reset: primos');
      return;
    }
    try {
      localStorage.setItem('playerPrimos', primos.toString());
    } catch (error) {
      console.error('Failed to save primos:', error);
    }
  }, [primos]);

  useEffect(() => {
    if (gameState === 'battle' && battleState && !battleTimerRef.current) {
      battleTimerRef.current = setInterval(() => {
        setBattleState(prev => {
          if (!prev) return prev;
          
          const newState = { ...prev };
          newState.tick += 1;
          newState.log = [...prev.log];

          const processCombatant = (combatant, opponent, isPlayer) => {
            const name = isPlayer ? 'Player' : 'Opponent';
            
            // Debug logging for Mewtwo
            if (combatant.name === 'Mewtwo' && isPlayer) {
              console.log(`[Battle Tick] Mewtwo processing - tick ${newState.tick}`, {
                abilities: combatant.abilities,
                currentStamina: combatant.currentStamina,
                moveStates: combatant.moveStates,
                isResting: combatant.isResting
              });
            }
            
            combatant.abilities.forEach(moveName => {
              if (!combatant.moveStates[moveName]) {
                const move = MOVES[moveName];
                if (!move) {
                  console.error(`[Battle] Move ${moveName} not found in MOVES database`);
                  return;
                }
                const strategyMult = GAME_CONFIG.STRATEGY[combatant.strategy];
                combatant.moveStates[moveName] = {
                  warmupRemaining: Math.ceil(move.warmup * strategyMult.warmup_mult),
                  cooldownRemaining: 0,
                  everCast: false
                };
              }
            });

            const available = combatant.abilities.filter(moveName => {
              const move = MOVES[moveName];
              if (!move) {
                console.error(`[Battle] Move ${moveName} not found when filtering available moves`);
                return false;
              }
              const state = combatant.moveStates[moveName];
              if (!state) {
                console.error(`[Battle] Move state for ${moveName} not initialized`);
                return false;
              }
              const strategyMult = GAME_CONFIG.STRATEGY[combatant.strategy];
              const staminaCost = Math.ceil(move.stamina * GAME_CONFIG.APTITUDE.MULTIPLIERS[combatant.strategyGrade]);
              
              // Check if move is ready and combatant has enough stamina
              const isReady = state.warmupRemaining === 0 && state.cooldownRemaining === 0 && combatant.currentStamina >= staminaCost;
              
              // Don't allow casting moves during exhaust effect, EXCEPT for moves that cause self-exhaust
              // (They can still be cast when stamina is available, but will apply exhaust after)
              const isExhausted = combatant.statusEffects.some(e => e.type === 'exhaust');
              
              return isReady && !isExhausted;
            });

            let willCast = false;
            let selectedMove = null;

            // Debug logging for Mewtwo
            if (combatant.name === 'Mewtwo' && isPlayer) {
              console.log(`[Battle Tick] Mewtwo available moves:`, {
                available: available,
                availableCount: available.length,
                currentStamina: combatant.currentStamina,
                maxStamina: GAME_CONFIG.BATTLE.MAX_STAMINA,
                castChance: combatant.currentStamina / GAME_CONFIG.BATTLE.MAX_STAMINA
              });
            }

            if (available.length > 0) {
              const castChance = combatant.currentStamina / GAME_CONFIG.BATTLE.MAX_STAMINA;
              
              if (Math.random() < castChance) {
                willCast = true;
                
                // Calculate predicted damage for each available move
                const movesWithPredictedDamage = available.map(moveName => {
                  const move = MOVES[moveName];
                  const moveType = move.type;
                  
                  // Map type to color for aptitude lookup
                  const typeToColor = { Fire: 'Red', Water: 'Blue', Grass: 'Green', Electric: 'Yellow', Psychic: 'Purple', Fighting: 'Orange', Poison: 'Purple', Normal: 'Colorless' };
                  const moveColor = typeToColor[moveType];
                  const aptitude = moveType === 'Normal' ? 'B' : (moveColor ? combatant.typeAptitudes[moveColor] : 'B');
                  const aptitudeMult = moveType === 'Normal' ? 1.0 : (GAME_CONFIG.APTITUDE.MULTIPLIERS[aptitude] || 1.0);
                  
                  // Calculate type matchup
                  let typeMatchupMult = 1.0;
                  const colorMapping = { Fire: 'Red', Water: 'Blue', Grass: 'Green', Electric: 'Yellow', Psychic: 'Purple', Fighting: 'Orange', Poison: 'Purple', Normal: 'Colorless' };
                  const opponentColor = colorMapping[opponent.primaryType] || opponent.primaryType;
                  
                  if (moveColor && opponentColor && GAME_CONFIG.TYPE_MATCHUPS[moveColor]) {
                    if (GAME_CONFIG.TYPE_MATCHUPS[moveColor].strong === opponent.primaryType) {
                      typeMatchupMult = 1.25;
                    } else if (GAME_CONFIG.TYPE_MATCHUPS[moveColor].weak === opponent.primaryType) {
                      typeMatchupMult = 0.75;
                    }
                  }
                  
                  // Calculate crit chance
                  const critChance = 0.05 + (combatant.stats.Instinct / 800);
                  const avgCritMult = (1 - critChance) * 1 + critChance * 2;
                  
                  // Calculate base damage (attack/defense ratio)
                  const attackDefenseRatio = combatant.stats.Attack / Math.max(1, opponent.stats.Defense);
                  
                  // Predicted damage = base * aptitude * matchup * crit (averaged)
                  const predictedDamage = move.damage * attackDefenseRatio * aptitudeMult * typeMatchupMult * avgCritMult;
                  
                  const staminaCost = Math.ceil(move.stamina * GAME_CONFIG.APTITUDE.MULTIPLIERS[combatant.strategyGrade]);
                  const strategyMult = GAME_CONFIG.STRATEGY[combatant.strategy];
                  const adjustedCooldown = Math.ceil(move.cooldown * strategyMult.cooldown_mult);
                  
                  return {
                    moveName,
                    move,
                    predictedDamage,
                    damagePerStamina: predictedDamage / staminaCost,
                    staminaCost,
                    cooldown: adjustedCooldown,
                    aptitude
                  };
                });
                
                // Strategy-specific move selection
                if (combatant.strategy === 'Nuker') {
                  // Nukers: Always go for highest damage, no stamina reservation
                  // 35% chance to pick a random move, 65% chance to pick optimal move
                  if (Math.random() < 0.35) {
                    selectedMove = movesWithPredictedDamage[Math.floor(Math.random() * movesWithPredictedDamage.length)].moveName;
                  } else {
                    // Pick the one with highest predicted damage
                    selectedMove = movesWithPredictedDamage.sort((a, b) => b.predictedDamage - a.predictedDamage)[0].moveName;
                  }
                  
                } else if (combatant.strategy === 'Scaler') {
                  // Scalers: Early game use low cooldown moves, late game use high damage
                  const opponentHealthPercent = (opponent.currentHP / opponent.stats.HP) * 100;
                  
                  // 35% chance to pick a random move, 65% chance to pick optimal move
                  if (Math.random() < 0.35) {
                    selectedMove = movesWithPredictedDamage[Math.floor(Math.random() * movesWithPredictedDamage.length)].moveName;
                  } else {
                    const opponentHealthPercent = (opponent.currentHP / opponent.stats.HP) * 100;
                    
                    if (opponentHealthPercent > 50) {
                      // Early game: Prioritize damage-per-stamina efficiency and low cooldown
                      const scored = movesWithPredictedDamage.map(m => ({
                        ...m,
                        score: m.damagePerStamina * 10 - m.cooldown * 2
                      }));
                      selectedMove = scored.sort((a, b) => b.score - a.score)[0].moveName;
                    } else {
                      // Late game: Prioritize highest raw predicted damage
                      selectedMove = movesWithPredictedDamage.sort((a, b) => b.predictedDamage - a.predictedDamage)[0].moveName;
                    }
                  }
                  
                } else {
                  // Balanced: Balance efficiency with damage output
                  // Be more conservative with stamina usage at low levels
                  if (combatant.currentStamina < 30) {
                    if (Math.random() < 0.5) willCast = false;
                  }
                  
                  if (willCast) {
                    // 35% chance to pick a random move, 65% chance to pick optimal move
                    if (Math.random() < 0.35) {
                      selectedMove = movesWithPredictedDamage[Math.floor(Math.random() * movesWithPredictedDamage.length)].moveName;
                    } else {
                      // Score based on a balance of efficiency and raw damage
                      // Factor in both damage-per-stamina and absolute predicted damage
                      const scored = movesWithPredictedDamage.map(m => ({
                        ...m,
                        // 60% weight on efficiency, 40% weight on raw damage (normalized)
                        score: (m.damagePerStamina * 0.6) + (m.predictedDamage / 100 * 0.4)
                      }));
                      selectedMove = scored.sort((a, b) => b.score - a.score)[0].moveName;
                    }
                  }
                }
              }
            }

            if (willCast && selectedMove) {
              const move = MOVES[selectedMove];
              const strategyMult = GAME_CONFIG.STRATEGY[combatant.strategy];
              const staminaCost = Math.ceil(move.stamina * GAME_CONFIG.APTITUDE.MULTIPLIERS[combatant.strategyGrade]);
              
              combatant.currentStamina = Math.max(0, combatant.currentStamina - staminaCost);
              combatant.isResting = false;
              
              // Check for paralysis (reduces accuracy)
              const isParalyzed = combatant.statusEffects.some(e => e.type === 'paralyze');
              const paralyzePenalty = isParalyzed ? 0.25 : 0;
              
              // Miss chance based on stamina (reduced by 50%: was 0.15, now 0.075)
              const missChance = Math.max(0, (GAME_CONFIG.BATTLE.MAX_STAMINA - combatant.currentStamina) / GAME_CONFIG.BATTLE.MAX_STAMINA * 0.075) + paralyzePenalty;
              
              // Dodge chance when opponent is resting (divisor increased by 30%: was 2143, now ~2786)
              const dodgeChance = opponent.isResting 
                ? GAME_CONFIG.BATTLE.BASE_DODGE_CHANCE + (opponent.stats.Instinct / 2786)
                : 0;
              
              const hitRoll = Math.random();
              const hitChance = 1.0 - dodgeChance - missChance;
              
              if (hitRoll < hitChance) {
                // Hit! Calculate damage
                const moveType = move.type;
                const aptitudeMult = moveType === 'Normal' ? 1.0 : (GAME_CONFIG.APTITUDE.MULTIPLIERS[combatant.typeAptitudes[moveType]] || 1.0);
                
                // Type matchup bonus based on move type vs opponent type
                let typeBonus = 1.0;
                if (moveType !== 'Normal' && GAME_CONFIG.TYPE_MATCHUPS[moveType]) {
                  if (GAME_CONFIG.TYPE_MATCHUPS[moveType].strong === opponent.primaryType) {
                    typeBonus = 1.2;
                  }
                }
                
                const attackStat = combatant.stats.Attack;
                const defenseStat = opponent.stats.Defense;
                
                const baseDamage = move.damage * (attackStat / defenseStat);
                let damage = Math.floor(baseDamage * aptitudeMult * typeBonus);
                
                // Check for critical hit
                const critChance = GAME_CONFIG.BATTLE.BASE_CRIT_CHANCE + (combatant.stats.Instinct / GAME_CONFIG.BATTLE.INSTINCT_CRIT_DENOMINATOR);
                const isCrit = Math.random() < critChance;
                if (isCrit) {
                  damage = Math.floor(damage * 2);
                }
                
                damage = Math.max(1, damage);
                opponent.currentHP = Math.max(0, opponent.currentHP - damage);
                
                let logMessage = `[${newState.tick}] ${name} used ${selectedMove}! Dealt ${damage} damage!`;
                if (isCrit) logMessage += ' *** CRITICAL HIT! ***';
                if (typeBonus > 1.0) logMessage += ' Super effective!';
                
                newState.log.push({
                  text: logMessage,
                  type: isCrit ? 'crit' : 'hit'
                });
                
                // Apply status effects
                if (move.effect) {
                  const effect = move.effect;
                  if (effect.type === 'exhaust') {
                    // Self-exhaust effect
                    combatant.statusEffects.push({
                      type: 'exhaust',
                      duration: effect.duration,
                      ticksRemaining: effect.duration
                    });
                    newState.log.push({
                      text: `[${newState.tick}] ${name} is exhausted from the powerful attack!`,
                      type: 'rest'
                    });
                  } else if (Math.random() < (effect.chance || 1.0)) {
                    // Effect applied to opponent
                    opponent.statusEffects.push({
                      type: effect.type,
                      duration: effect.duration,
                      ticksRemaining: effect.duration,
                      damage: effect.damage,
                      staminaBoost: effect.staminaBoost
                    });
                    
                    const effectName = effect.type.charAt(0).toUpperCase() + effect.type.slice(1);
                    newState.log.push({
                      text: `[${newState.tick}] ${opponent === newState.player ? 'Player' : 'Opponent'} is ${effect.type === 'burn' ? 'burned' : effect.type === 'poison' ? 'poisoned' : effect.type === 'paralyze' ? 'paralyzed' : effect.type === 'stun' ? 'stunned' : effect.type === 'soak' ? 'soaked' : effect.type === 'energize' ? 'energized' : effect.type}!`,
                      type: 'rest'
                    });
                  }
                }
              } else {
                newState.log.push({
                  text: `[${newState.tick}] ${name} used ${selectedMove} but missed!`,
                  type: 'miss'
                });
              }
              
              const state = combatant.moveStates[selectedMove];
              state.cooldownRemaining = Math.ceil(move.cooldown * strategyMult.cooldown_mult);
              state.everCast = true;
            } else {
              // Stamina regeneration based on Speed stat only (not affected by strategy)
              const baseRestGain = GAME_CONFIG.BATTLE.BASE_REST_STAMINA_GAIN;
              const speedBonus = Math.floor(combatant.stats.Speed / GAME_CONFIG.BATTLE.SPEED_STAMINA_DENOMINATOR);
              const restGain = baseRestGain + speedBonus;
              combatant.currentStamina = Math.min(GAME_CONFIG.BATTLE.MAX_STAMINA, combatant.currentStamina + restGain);
              combatant.isResting = true;
              newState.log.push({
                text: `[${newState.tick}] ${name} is resting... (+${restGain} stamina)`,
                type: 'rest'
              });
            }

            Object.keys(combatant.moveStates).forEach(moveName => {
              const state = combatant.moveStates[moveName];
              if (state.warmupRemaining > 0) state.warmupRemaining--;
              if (state.cooldownRemaining > 0) state.cooldownRemaining--;
            });
            
            // Process status effects
            combatant.statusEffects = combatant.statusEffects.filter(effect => {
              effect.ticksRemaining--;
              
              if (effect.type === 'burn' || effect.type === 'poison') {
                combatant.currentHP = Math.max(0, combatant.currentHP - effect.damage);
                newState.log.push({
                  text: `[${newState.tick}] ${name} takes ${effect.damage} damage from ${effect.type}!`,
                  type: 'rest'
                });
              } else if (effect.type === 'energize') {
                combatant.currentStamina = Math.min(GAME_CONFIG.BATTLE.MAX_STAMINA, combatant.currentStamina + effect.staminaBoost);
              } else if (effect.type === 'stun' && effect.ticksRemaining > 0) {
                newState.log.push({
                  text: `[${newState.tick}] ${name} is stunned and cannot act!`,
                  type: 'rest'
                });
              }
              
              return effect.ticksRemaining > 0;
            });
          };

          processCombatant(newState.player, newState.opponent, true);
          if (newState.opponent.currentHP > 0) {
            processCombatant(newState.opponent, newState.player, false);
          }

          if (newState.player.currentHP <= 0 || newState.opponent.currentHP <= 0) {
            clearInterval(battleTimerRef.current);
            
            if (newState.player.currentHP > 0) {
              newState.log.push({
                text: `Victory! You defeated ${newState.opponent.name}!`,
                type: 'victory'
              });
            } else {
              newState.log.push({
                text: `Defeat! You were defeated by ${newState.opponent.name}!`,
                type: 'defeat'
              });
            }
            
            setTimeout(() => {
              exitBattle();
            }, 2000);
          }

          return newState;
        });
      }, GAME_CONFIG.BATTLE.TICK_DURATION_MS / battleSpeed);

      return () => {
        if (battleTimerRef.current) clearInterval(battleTimerRef.current);
        battleTimerRef.current = null;
      };
    }
  }, [gameState, battleSpeed]);

  const exitBattle = () => {
    // Capture current battleState before clearing it
    const currentBattleState = battleState;
    
    // Guard against double calls - if no battleState, exit immediately
    if (!currentBattleState) return;
    
    // Clear the battle timer
    if (battleTimerRef.current) {
      clearInterval(battleTimerRef.current);
      battleTimerRef.current = null;
    }
    
    // Reset battle speed
    setBattleSpeed(1);
    
    // Clear battleState immediately to prevent double-calls
    setBattleState(null);
    
    setCareerData(prev => {
      if (!prev) return prev;
      
      // Gym leader battles don't consume energy
      const energyCost = currentBattleState.isGymLeader ? 0 : 25;
      const energyAfterBattle = prev.energy - energyCost;
      
      if (currentBattleState.player.currentHP > 0) {
        const skillGain = GAME_CONFIG.BATTLE.WIN_SKILL_POINTS;
        
        let newStats = { ...prev.currentStats };
        
        // Give +10 to a random stat for gym battles, +15 for wild battles (50% increase)
        const statNames = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];
        const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
        const statGain = currentBattleState.isGymLeader ? 10 : 15;
        newStats[randomStat] += statGain;

        // Check for move hint on wild battle victory (20% chance)
        let moveHint = null;
        if (!currentBattleState.isGymLeader && Math.random() < 0.20) {
          // Get learnable abilities not yet known
          const learnableAbilities = prev.pokemon.learnableAbilities || [];
          const unknownAbilities = learnableAbilities.filter(ability => !prev.knownAbilities.includes(ability));
          
          if (unknownAbilities.length > 0) {
            moveHint = unknownAbilities[Math.floor(Math.random() * unknownAbilities.length)];
          }
        }

        // Check for exhaustion penalty (battling at 0 energy)
        let exhaustionPenalty = false;
        if (prev.energy <= 0) {
          if (Math.random() < 0.5) {
            exhaustionPenalty = true;
            Object.keys(newStats).forEach(stat => {
              newStats[stat] = Math.max(1, newStats[stat] - 10);
            });
          }
        }

        const logEntry = {
          turn: prev.turn,
          type: currentBattleState.isGymLeader ? 'gym_victory' : 'battle_victory',
          opponent: getBattleDisplayName(currentBattleState.opponent),
          statGain,
          randomStat,
          skillGain,
          exhaustionPenalty,
          moveHint,
          message: `Defeated ${getBattleDisplayName(currentBattleState.opponent)}! +${statGain} ${randomStat}, +${skillGain} SP.${moveHint ? ` Learned hint for ${moveHint}!` : ''}${exhaustionPenalty ? ' EXHAUSTED: -10 to all stats!' : ''}`
        };

        // Check for event battle rewards (increased by 50%)
        let finalSkillGain = skillGain;
        if (prev.eventBattleRewards && !currentBattleState.isGymLeader) {
          const rewards = prev.eventBattleRewards;
          if (rewards.stats) {
            Object.keys(rewards.stats).forEach(stat => {
              const boostedStatReward = Math.floor(rewards.stats[stat] * 1.5);
              newStats[stat] = Math.max(1, newStats[stat] + boostedStatReward);
            });
          }
          if (rewards.skillPoints) {
            const boostedSkillReward = Math.floor(rewards.skillPoints * 1.5);
            finalSkillGain += boostedSkillReward;
          }
          // Energy penalty is already in rewards
        }

        // Advance turn and update gym index
        // Event battles don't advance turn, wild and gym battles DO advance turn
        const isEventBattle = prev.eventBattleRewards !== null;
        const nextTurn = isEventBattle ? prev.turn : prev.turn + 1;
        const newGymIndex = currentBattleState.isGymLeader ? prev.currentGymIndex + 1 : prev.currentGymIndex;

        // Check for inspiration event and apply before creating updatedState
        let finalStats = { ...newStats };
        let finalAptitudes = { ...prev.pokemon.typeAptitudes };
        const inspirationResult = checkAndApplyInspiration(nextTurn, selectedInspirations, newStats, prev.pokemon.typeAptitudes);
        if (inspirationResult && inspirationResult.results.length > 0) {
          // Use the updated stats and aptitudes from inspiration result
          finalStats = inspirationResult.updatedStats;
          finalAptitudes = inspirationResult.updatedAptitudes;
        }

        const updatedState = {
          ...prev,
          currentStats: finalStats,
          skillPoints: prev.skillPoints + finalSkillGain,
          energy: Math.max(0, Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, energyAfterBattle + (prev.eventBattleRewards?.energy || 0))),
          turn: nextTurn,
          currentGymIndex: newGymIndex,
          currentTrainingOptions: null,
          availableBattles: isEventBattle ? prev.availableBattles : generateWildBattles(nextTurn),
          turnLog: [logEntry, ...prev.turnLog],
          eventBattleRewards: null,
          pokemon: {
            ...prev.pokemon,
            typeAptitudes: finalAptitudes
          }
        };

        if (currentBattleState.isGymLeader && prev.currentGymIndex >= 4) {
          // Save trained Pokemon before victory
          const inspirations = generateInspirations(finalStats, finalAptitudes);
          const trainedData = {
            name: updatedState.pokemon.name,
            stats: finalStats,
            grade: getPokemonGrade(finalStats),
            type: updatedState.pokemon.primaryType,
            completedAt: Date.now(),
            baseName: updatedState.basePokemonName || updatedState.pokemon.name,
            evolutionStage: updatedState.evolutionStage || 0,
            inspirations: inspirations,
            aptitudes: finalAptitudes
          };
          console.log('[Victory] Saving trained Pokemon with inspirations:', trainedData);
          setTrainedPokemon(prev => [...prev, trainedData]);
          
          // Save roster to backend
          if (authToken) {
            apiSaveRoster(trainedData, nextTurn).then(result => {
              if (result) {
                console.log('[Victory] Roster saved to backend:', result);
              }
            }).catch(err => console.error('[Victory] Failed to save roster:', err));
          }
          
          setGameState('victory');
        } else {
          setViewMode('training');
          setGameState('career');
          
          // Show inspiration modal if there were inspirations
          if (inspirationResult && inspirationResult.results.length > 0) {
            setTimeout(() => {
              setInspirationModal(inspirationResult);
            }, 0);
          }
          
          // Check for evolution after battle win with updated state
          setTimeout(() => {
            const baseName = updatedState.basePokemonName || updatedState.pokemon.name;
            const evolutionChain = EVOLUTION_CHAINS[baseName];
            const currentGrade = getPokemonGrade(finalStats);
            const currentStage = updatedState.evolutionStage || 0;
            const totalStats = Object.values(finalStats).reduce((sum, val) => sum + val, 0);
            
            console.log('=== EVOLUTION CHECK (Battle) ===');
            console.log('Pokemon:', updatedState.pokemon.name);
            console.log('Base Name:', baseName);
            console.log('Current Stage:', currentStage);
            console.log('Total Stats:', totalStats);
            console.log('Current Grade:', currentGrade);
            console.log('Evolution Chain:', evolutionChain);
            
            if (evolutionChain) {
              let evolution = null;
              // Check for stage 1 evolution (at C grade)
              if (currentStage === 0 && evolutionChain.stage1) {
                console.log('Checking stage 1 evolution...');
                console.log('Stage 1 name:', evolutionChain.stage1);
                console.log('Grade qualifies?', ['C+', 'C', 'B+', 'B', 'A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade));
                if (['C+', 'C', 'B+', 'B', 'A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
                  evolution = { toName: evolutionChain.stage1, toStage: 1 };
                  console.log('EVOLUTION TRIGGERED! Stage 1');
                }
              }
              // Check for stage 2 evolution (at A grade)
              else if (currentStage === 1 && evolutionChain.stage2) {
                console.log('Checking stage 2 evolution...');
                console.log('Stage 2 name:', evolutionChain.stage2);
                console.log('Grade qualifies?', ['A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade));
                if (['A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
                  evolution = { toName: evolutionChain.stage2, toStage: 2 };
                  console.log('EVOLUTION TRIGGERED! Stage 2');
                }
              }

              if (evolution) {
                console.log('Setting evolution modal...');
                setEvolutionModal({
                  fromName: updatedState.pokemon.name,
                  toName: evolution.toName,
                  toStage: evolution.toStage,
                  oldStats: prev.currentStats,
                  newStats: finalStats
                });
              } else {
                console.log('No evolution triggered');
              }
            } else {
              console.log('No evolution chain found for:', baseName);
            }
            console.log('=== END EVOLUTION CHECK ===');
          }, 100);
        }

        return updatedState;
      } else {
        if (currentBattleState.isGymLeader) {
          // Check if player has pokeclocks remaining
          if (prev.pokeclocks > 0) {
            // Use a pokeclock to retry the battle
            setPokeclockModal(true);
            setTimeout(() => setPokeclockModal(false), 2000);
            setGameState('career');
            setViewMode('training');
            return {
              ...prev,
              pokeclocks: prev.pokeclocks - 1
            };
          } else {
            // No pokeclocks remaining - game over
            // Save trained Pokemon before game over
            setCareerData(prev => {
              if (prev) {
                const inspirations = generateInspirations(prev.currentStats, prev.pokemon.typeAptitudes);
                const trainedData = {
                  name: prev.pokemon.name,
                  stats: prev.currentStats,
                  grade: getPokemonGrade(prev.currentStats),
                  type: prev.pokemon.primaryType,
                  completedAt: Date.now(),
                  baseName: prev.basePokemonName || prev.pokemon.name,
                  evolutionStage: prev.evolutionStage || 0,
                  inspirations: inspirations,
                  aptitudes: prev.pokemon.typeAptitudes
                };
                console.log('[Game Over] Saving trained Pokemon with inspirations:', trainedData);
                setTrainedPokemon(trained => [...trained, trainedData]);
                
                // Save roster to backend
                if (authToken) {
                  apiSaveRoster(trainedData, prev.turn).then(result => {
                    if (result) {
                      console.log('[Game Over] Roster saved to backend:', result);
                    }
                  }).catch(err => console.error('[Game Over] Failed to save roster:', err));
                }
              }
              return prev;
            });
            setGameState('gameOver');
            return prev;
          }
        } else {
          const logEntry = {
            turn: prev.turn,
            type: 'battle_loss',
            opponent: getBattleDisplayName(currentBattleState.opponent),
            message: `Lost to ${getBattleDisplayName(currentBattleState.opponent)}.`
          };

          setViewMode('training');
          setGameState('career');
          
          // Event battles don't advance turn, wild battles do
          const isEventBattle = prev.eventBattleRewards !== null;
          const nextTurn = isEventBattle ? prev.turn : prev.turn + 1;
          
          return {
            ...prev,
            energy: Math.max(0, Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, energyAfterBattle)),
            turn: nextTurn,
            currentTrainingOptions: null,
            availableBattles: isEventBattle ? prev.availableBattles : generateWildBattles(nextTurn),
            turnLog: [logEntry, ...prev.turnLog],
            eventBattleRewards: null
          };
        }
      }
    });
  };

  const learnMove = (moveName) => {
    const move = MOVES[moveName];
    const hintsReceived = careerData.moveHints[moveName] || 0;
    const discount = Math.min(hintsReceived * GAME_CONFIG.MOVES.HINT_DISCOUNT, GAME_CONFIG.MOVES.MAX_HINT_DISCOUNT);
    const finalCost = Math.ceil(move.cost * (1 - discount));
    
    if (careerData.skillPoints >= finalCost && !careerData.knownAbilities.includes(moveName)) {
      setCareerData(prev => ({
        ...prev,
        knownAbilities: [...prev.knownAbilities, moveName],
        skillPoints: prev.skillPoints - finalCost
      }));
    }
  };

  useEffect(() => {
    if (gameState === 'career' && careerData && !careerData.currentTrainingOptions && !careerData.pendingEvent && !evolutionModal && !inspirationModal) {
      // Don't generate training on gym turns
      const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
      const isGymTurn = careerData.turn === nextGymTurn && careerData.currentGymIndex < 5;
      if (isGymTurn) return;
      
      // Check for inspiration turn - trigger modal first
      const inspirationTurns = [11, 23, 35, 47, 59];
      const isInspirationTurn = inspirationTurns.includes(careerData.turn);
      if (isInspirationTurn && selectedInspirations.length > 0) {
        // Trigger inspiration modal
        const inspirationResult = checkAndApplyInspiration(
          careerData.turn, 
          selectedInspirations, 
          careerData.currentStats, 
          careerData.pokemon.typeAptitudes
        );
        if (inspirationResult && inspirationResult.results && inspirationResult.results.length > 0) {
          console.log('[useEffect] Triggering inspiration modal for turn', careerData.turn);
          setInspirationModal(inspirationResult);
          // Update stats from inspiration
          setCareerData(prev => ({
            ...prev,
            currentStats: inspirationResult.updatedStats,
            pokemon: {
              ...prev.pokemon,
              typeAptitudes: inspirationResult.updatedAptitudes
            }
          }));
          return; // Don't generate training yet - modal will generate it when closed
        }
      }
      
      // Check if we've already processed this turn (but allow reprocessing if we just came back from battle)
      // We detect this by checking if battleState was recently null (meaning we just exited a battle)
      const justExitedBattle = !battleState && lastProcessedTurnRef.current === careerData.turn;
      if (lastProcessedTurnRef.current === careerData.turn && !justExitedBattle) return;
      
      // Mark this turn as processed
      lastProcessedTurnRef.current = careerData.turn;
      
      // Check for random event first (only if not turn 1 and not gym turn)
      let eventToSet = null;
      if (careerData.turn > 1 && careerData.turn !== nextGymTurn && !justExitedBattle) {
        // 50% chance for an event
        if (Math.random() < 0.50) {
          eventToSet = generateRandomEvent();
        }
      }
      
      // Set either event or training options (but never on gym turns)
      setCareerData(prev => {
        if (!prev) return prev;
        
        // Don't overwrite existing pending events or training options
        if (prev.pendingEvent || prev.currentTrainingOptions) return prev;
        
        // Double-check it's not a gym turn in case of race conditions
        const nextGymTurn = (prev.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
        const isStillGymTurn = prev.turn === nextGymTurn && prev.currentGymIndex < 5;
        if (isStillGymTurn) return prev;
        
        if (eventToSet) {
          return {
            ...prev,
            pendingEvent: eventToSet
          };
        } else {
          return {
            ...prev,
            currentTrainingOptions: generateTrainingOptions()
          };
        }
      });
    }
  }, [gameState, careerData?.turn, careerData?.currentTrainingOptions !== null && careerData?.currentTrainingOptions !== undefined, careerData?.pendingEvent !== null && careerData?.pendingEvent !== undefined, battleState, evolutionModal, inspirationModal]);

  useEffect(() => {
    if (careerData && careerData.turn > GAME_CONFIG.CAREER.TOTAL_TURNS && gameState !== 'victory') {
      // Save trained Pokemon before career end (only if not already saved via victory)
      console.log('[Turn 60] Saving trained Pokemon');
      const inspirations = generateInspirations(careerData.currentStats, careerData.pokemon.typeAptitudes);
      const trainedData = {
        name: careerData.pokemon.name,
        stats: careerData.currentStats,
        grade: getPokemonGrade(careerData.currentStats),
        type: careerData.pokemon.primaryType,
        completedAt: Date.now(),
        baseName: careerData.basePokemonName || careerData.pokemon.name,
        evolutionStage: careerData.evolutionStage || 0,
        inspirations: inspirations,
        aptitudes: careerData.pokemon.typeAptitudes
      };
      console.log('[Turn 60] trainedData:', trainedData);
      setTrainedPokemon(prev => [...prev, trainedData]);
      
      // Save roster to backend
      if (authToken) {
        apiSaveRoster(trainedData, careerData.turn).then(result => {
          if (result) {
            console.log('[Turn 60] Roster saved to backend:', result);
          }
        }).catch(err => console.error('[Turn 60] Failed to save roster:', err));
      }
      
      setGameState('careerEnd');
    }
  }, [careerData?.turn, gameState]);

  // Auto-scroll battle log to bottom when new entries are added
  useEffect(() => {
    if (battleLogRef.current && battleState?.log) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleState?.log?.length]);

  // Save career to history when victory or gameOver state is reached
  useEffect(() => {
    if ((gameState === 'victory' || gameState === 'gameOver' || gameState === 'careerEnd') && careerData && careerData.timestamp) {
      if (!savedCareersRef.current.has(careerData.timestamp)) {
        savedCareersRef.current.add(careerData.timestamp);
        const careerSnapshot = {
          pokemon: careerData.pokemon.name,
          primaryType: careerData.pokemon.primaryType,
          finalStats: { ...careerData.currentStats },
          knownAbilities: [...careerData.knownAbilities],
          gymsDefeated: careerData.currentGymIndex,
          finalTurn: careerData.turn,
          timestamp: careerData.timestamp,
          victory: gameState === 'victory'
        };
        setCareerHistory(prev => [careerSnapshot, ...prev]);
        
        // Award primos based on gyms defeated
        const gymsDefeated = careerData.currentGymIndex;
        let primosEarned = 0;
        if (gymsDefeated === 1) primosEarned = 10;
        else if (gymsDefeated === 2) primosEarned = 20;
        else if (gymsDefeated === 3) primosEarned = 30;
        else if (gymsDefeated === 4) primosEarned = 50;
        else if (gymsDefeated >= 5) primosEarned = 100;
        
        if (primosEarned > 0) {
          setPrimos(prev => prev + primosEarned);
        }
      }
    }
  }, [gameState, careerData?.timestamp]);

  // Evolution Modal Component
  const EvolutionModal = () => {
    console.log('EvolutionModal render - evolutionModal:', evolutionModal);
    if (!evolutionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-500 to-blue-500 rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Evolution!</h2>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="mb-2">
                {generatePokemonSprite(POKEMON[evolutionModal.fromName]?.primaryType || 'Normal', evolutionModal.fromName)}
              </div>
              <p className="text-white font-bold text-lg">{evolutionModal.fromName}</p>
              <span 
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: getGradeColor(getPokemonGrade(evolutionModal.oldStats)) }}
              >
                {getPokemonGrade(evolutionModal.oldStats)}
              </span>
            </div>

            <div className="text-4xl text-yellow-300 animate-pulse">ðŸ’¡</div>

            <div className="text-center">
              <div className="mb-2">
                {generatePokemonSprite(POKEMON[evolutionModal.toName]?.primaryType || 'Normal', evolutionModal.toName)}
              </div>
              <p className="text-white font-bold text-lg">{evolutionModal.toName}</p>
              <span 
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: getGradeColor(getPokemonGrade(evolutionModal.newStats)) }}
              >
                {getPokemonGrade(evolutionModal.newStats)}
              </span>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded p-4 mb-6 text-white text-sm">
            <p className="font-bold mb-2">Stats increased by 10%!</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.keys(evolutionModal.newStats).map(stat => {
                const oldVal = evolutionModal.oldStats[stat];
                const newVal = evolutionModal.newStats[stat];
                return (
                  <div key={stat} className="flex justify-between">
                    <span>{stat}:</span>
                    <span>{oldVal} â†’ {newVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => applyEvolution(evolutionModal.fromName, evolutionModal.toName, evolutionModal.toStage)}
            className="w-full bg-yellow-400 text-purple-900 py-3 rounded-lg font-bold text-xl hover:bg-yellow-300 transition"
          >
            Evolve!
          </button>
        </div>
      </div>
    );
  };

  // Inspiration Modal Component
  const InspirationModal = () => {
    console.log('[InspirationModal] Render, modal state:', inspirationModal);
    if (!inspirationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-500 to-pink-500 rounded-lg p-8 max-w-2xl w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">ÃƒÂ¢Ã…â€œÃ‚Â¨ Inspiration! ÃƒÂ¢Ã…â€œÃ‚Â¨</h2>
          <p className="text-white text-center mb-6">Your trained Pokemon inspire you at Turn {inspirationModal.turn}!</p>
          
          <div className="space-y-4">
            {inspirationModal.results.map((result, idx) => (
              <div key={idx} className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="text-xl font-bold text-yellow-300 mb-3">{result.pokemonName}</h3>
                
                {result.statBonus && (
                  <div className="bg-green-500 bg-opacity-30 rounded p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">
                        {result.statBonus.stat} +{result.statBonus.amount}
                      </span>
                      <div className="flex gap-1">
                        {[...Array(result.statBonus.stars)].map((_, i) => (
                          <span key={i} className="text-yellow-300">â˜…</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {result.aptitudeUpgrade && (
                  <div className="bg-purple-500 bg-opacity-30 rounded p-3">
                    <div className="text-white font-bold mb-1">
                      {result.aptitudeUpgrade.type} Aptitude: {result.aptitudeUpgrade.from} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ {result.aptitudeUpgrade.to}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white opacity-80">
                        {(result.aptitudeUpgrade.chance * 100).toFixed(0)}% chance
                      </span>
                      <div className="flex gap-1">
                        {[...Array(result.aptitudeUpgrade.stars)].map((_, i) => (
                          <span key={i} className="text-yellow-300">â˜…</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {!result.statBonus && !result.aptitudeUpgrade && (
                  <div className="text-white opacity-70 text-sm italic">
                    No bonuses this time
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setInspirationModal(null);
              // Generate training options after closing modal
              if (careerData && !careerData.currentTrainingOptions) {
                setCareerData(prev => ({
                  ...prev,
                  currentTrainingOptions: generateTrainingOptions()
                }));
              }
            }}
            className="w-full mt-6 bg-yellow-400 text-purple-900 py-3 rounded-lg font-bold text-xl hover:bg-yellow-300 transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Pokeclock Modal Component
  const PokeclockModal = () => {
    if (!pokeclockModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-blue-500 to-purple-500 rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-pulse">
          <div className="text-6xl mb-4">ÃƒÂ¢Ã‚ÂÃ‚Â°</div>
          <h2 className="text-3xl font-bold text-white mb-4">Pokeclock Used!</h2>
          <p className="text-white text-lg">You get another chance!</p>
        </div>
      </div>
    );
  };

  // Auth Modal Component

  // Help Modal Component
  const HelpModal = () => {
    if (!showHelp) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4" 
        onClick={() => setShowHelp(false)}
        style={{ overflow: 'hidden' }}
      >
        <div 
          className="bg-white rounded-lg w-full sm:w-[500px] shadow-2xl"
          style={{ 
            height: 'calc(100vh - 2rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border-b p-4 flex justify-between items-center rounded-t-lg" style={{ flexShrink: 0 }}>
            <h2 className="text-xl font-bold text-purple-600">Game Guide</h2>
            <button onClick={() => setShowHelp(false)} className="text-2xl font-bold text-gray-600 hover:text-gray-800 px-2">{ICONS.CLOSE}</button>
          </div>
          
          <div 
            className="p-6 space-y-6"
            style={{ 
              flex: 1,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Pokemon</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Stats</h4>
                  <div className="text-sm space-y-1 ml-2">
                    <p><strong>HP:</strong> Health points in battle</p>
                    <p><strong>Attack:</strong> Damage output</p>
                    <p><strong>Defense:</strong> Damage mitigation</p>
                    <p><strong>Instinct:</strong> Crit chance & dodge chance</p>
                    <p><strong>Speed:</strong> Stamina regeneration rate</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Type Aptitudes</h4>
                  <p className="text-sm ml-2">Grades (F-S) multiply damage when using that type.</p>
                  <div className="text-sm ml-2 mt-1 grid grid-cols-2 gap-1">
                    <span><strong style={{color: '#000'}}>F:</strong> 60%</span>
                    <span><strong style={{color: '#9ca3af'}}>E:</strong> 70%</span>
                    <span><strong style={{color: '#3b82f6'}}>D:</strong> 80%</span>
                    <span><strong style={{color: '#22c55e'}}>C:</strong> 90%</span>
                    <span><strong style={{color: '#ec4899'}}>B:</strong> 100%</span>
                    <span><strong style={{color: '#f97316'}}>A:</strong> 110%</span>
                    <span><strong style={{color: '#eab308'}}>S:</strong> 120%</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Type Matchups</h4>
                  <p className="text-sm ml-2">Super effective attacks deal +20% damage.</p>
                  <div className="text-sm ml-2 space-y-1 mt-1">
                    <p>Fire {ICONS.ARROW_RIGHT} Grass {ICONS.ARROW_RIGHT} Water {ICONS.ARROW_RIGHT} Fire</p>
                    <p>Fighting {ICONS.ARROW_RIGHT} Electric</p>
                    <p>Psychic {ICONS.ARROW_RIGHT} Fighting</p>
                    <p>Psychic {ICONS.ARROW_DOUBLE} Psychic (neutral)</p>
                    <p>Fighting {ICONS.ARROW_RIGHT} Normal</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Strategies</h4>
                  <p className="text-sm ml-2">Each Pokemon has a preferred battle strategy:</p>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Nuker:</strong> 40% faster warmup, 40% slower cooldown</p>
                    <p><strong>Balanced:</strong> 10% faster on both</p>
                    <p><strong>Scaler:</strong> 40% slower warmup, 40% faster cooldown</p>
                  </div>
                  <p className="text-sm ml-2 mt-1">Strategy aptitude grade affects stamina costs.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Battles</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Combat</h4>
                  <p className="text-sm ml-2">Real-time auto-battle system. Pokemon automatically use abilities based on stamina and cooldowns.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Stamina</h4>
                  <p className="text-sm ml-2">Required to use abilities. Regenerates when resting (not using abilities). Speed stat increases regen rate.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Abilities</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Warmup:</strong> Ticks before ability becomes available</p>
                    <p><strong>Cooldown:</strong> Ticks before ability can be used again</p>
                    <p><strong>Stamina Cost:</strong> Modified by strategy grade (better grade = lower cost)</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Accuracy & Critical Hits</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p>Low stamina increases miss chance</p>
                    <p>Resting grants dodge chance (Instinct/2786)</p>
                    <p>Crit chance: 5% + (Instinct/800) for 2{ICONS.MULTIPLY} damage</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Status Effects</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Burn/Poison:</strong> Damage over time</p>
                    <p><strong>Paralyze:</strong> -25% accuracy</p>
                    <p><strong>Stun:</strong> Cannot act</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Damage Formula</h4>
                  <p className="text-sm ml-2">Base {ICONS.MULTIPLY} (Attack/Defense) {ICONS.MULTIPLY} Type Aptitude {ICONS.MULTIPLY} Type Matchup {ICONS.MULTIPLY} Crit Multiplier</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Career</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Goal</h4>
                  <p className="text-sm ml-2">Defeat 5 Gym Leaders within 60 turns. Gym battles occur at turns 12, 24, 36, 48, and 60.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Energy</h4>
                  <p className="text-sm ml-2">Required for training and battles. At 0 energy, training has 99% fail rate. Resting restores 30-70 energy.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Training</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Success:</strong> Gain stats, 3 Skill Points, 7 friendship</p>
                    <p><strong>Failure:</strong> Lose 2 stats</p>
                    <p><strong>Support Bonus:</strong> 100 friendship grants major stat boost</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Wild Battles</h4>
                  <p className="text-sm ml-2">Win: +5 all stats, +10 SP. Cost: -25 energy. At 0 energy: 50% chance to lose 10 all stats.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Gym Battles</h4>
                  <p className="text-sm ml-2">Must win or Game Over. Preview upcoming gym leader stats and abilities. Each gym progressively harder.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Learning Abilities</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p>Spend Skill Points to learn new abilities</p>
                    <p>Base cost {ICONS.MULTIPLY} 3.0, reduced by move hints (up to -60%)</p>
                    <p>Hints earned through support hangouts</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Events</h4>
                  <p className="text-sm ml-2">50% chance per turn. Includes stat gains, choices, wild battles, setbacks, and support hangouts (at 80+ friendship).</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Gacha</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Pokemon Gachapon</h4>
                  <p className="text-sm ml-2">Draw random Pokemon to add to your collection. Each Pokemon has unique base stats, type aptitudes, strategies, and learnable abilities.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Rarity Tiers</h4>
                  <p className="text-sm ml-2">Pokemon are graded by total base stats (D to S+). Higher grades are more powerful but rarer.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Starting Fresh</h4>
                  <p className="text-sm ml-2">Each career run starts with a new Pokemon at base stats. Use gacha to find Pokemon suited to your strategy.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  // Reset Confirmation Dialog Component
  const ResetConfirmDialog = () => {
    console.log('ResetConfirmDialog render - showResetConfirm:', showResetConfirm);
    
    if (!showResetConfirm) {
      console.log('ResetConfirmDialog returning null');
      return null;
    }
    
    console.log('ResetConfirmDialog rendering modal');
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowResetConfirm(false)}
        style={{ zIndex: 9999 }}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold text-red-600 mb-4">{ICONS.WARNING} Reset All Data?</h2>
          <p className="text-gray-700 mb-4">
            Are you sure you want to reset ALL game data? This will permanently delete:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
            <li>All Pokemon in your collection</li>
            <li>All Primos</li>
            <li>Career history</li>
          </ul>
          <p className="text-red-600 font-bold mb-6">This action cannot be undone!</p>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log('Cancel clicked');
                setShowResetConfirm(false);
              }}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('Reset Everything clicked');
                confirmReset();
              }}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
            >
              Reset Everything
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (gameState === 'menu') {
    // If player has no pokemon, force starter selection
    if (pokemonInventory.length === 0) {
      return (
        <>
          <ResetConfirmDialog />
          <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg p-4 sm:p-8 max-w-2xl w-full shadow-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-purple-600">Choose Your Starter!</h1>
              <p className="text-center text-gray-600 mb-6">Select your first Pokemon to begin your journey</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['Charmander', 'Squirtle', 'Bulbasaur'].map(starter => {
                  const pokemon = POKEMON[starter];
                  return (
                    <div
                      key={starter}
                      onClick={() => {
                        setPokemonInventory([starter]);
                        setGameState('menu');
                      }}
                      className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-xl transition transform hover:scale-105 border-2 border-purple-300"
                    >
                      <div className="flex justify-center mb-3">
                        {generatePokemonSprite(pokemon.primaryType, starter)}
                      </div>
                      <h3 className="text-xl font-bold text-center mb-2">{starter}</h3>
                      <p className="text-center text-sm" style={{ color: getTypeColor(pokemon.primaryType), fontWeight: 'bold' }}>
                        {pokemon.primaryType}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Version number in bottom-right corner */}
            <div className="fixed bottom-4 right-4 text-white text-xs font-semibold bg-black bg-opacity-30 px-3 py-1 rounded-lg">
              v3.04
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <AuthModal 
          showAuth={showAuth}
          authMode={authMode}
          authForm={authForm}
          authError={authError}
          authLoading={authLoading}
          onClose={handleAuthClose}
          onSubmit={handleAuthSubmit}
          onFormChange={handleAuthFormChange}
          onModeChange={handleAuthModeChange}
          ICONS={ICONS}
        />
        <ResetConfirmDialog />
        <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
        {/* Primos display in top-left corner */}
        <div className="fixed top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
          <Sparkles size={20} />
          <span>{primos} Primos</span>
        </div>

        {/* User/Auth display in top-right corner */}
        <div className="fixed top-4 right-4">
          {user ? (
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-sm">{user.username}</p>
                  <p className="text-xs text-gray-600">Rating: {user.rating || 1000}</p>
                </div>
                <button
                  onClick={handleAuthLogout}
                  className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuth(true);
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-lg"
            >
              Login / Register
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-8 max-w-md w-full shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 text-purple-600">Pokesume Pretty Duel</h1>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">Defeat 5 gym leaders with your buddy to prove you're the best there ever was!</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (pokemonInventory.length > 0) {
                  setGameState('pokemonSelect');
                }
              }}
              className="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-purple-700 transition disabled:bg-gray-400"
              disabled={pokemonInventory.length === 0}
            >
              Start New Career
            </button>
            <button
              onClick={() => setGameState('myPokemon')}
              className="w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-green-700 transition"
            >
              My Pokemon ({pokemonInventory.length})
            </button>
            <button
              onClick={() => setGameState('mySupports')}
              className="w-full bg-indigo-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-indigo-700 transition"
            >
              My Supports ({supportInventory.length})
            </button>
            <button
              onClick={() => setGameState('trainedPokemon')}
              className="w-full bg-teal-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-teal-700 transition"
            >
              Trained Pokemon ({trainedPokemon.length})
            </button>
            <button
              onClick={() => setGameState('tournaments')}
              className="w-full bg-red-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-red-700 transition"
            >
              <Trophy className="inline-block mr-2" size={20} />
              Tournaments
            </button>
            <button
              onClick={() => setGameState('gacha')}
              className="w-full bg-yellow-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-yellow-700 transition"
            >
              Roll for Pokemon (100 Primos)
            </button>
            <button
              onClick={() => setGameState('supportGacha')}
              className="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-purple-700 transition"
            >
              Roll for Supports (100 Primos)
            </button>
          </div>
          
          {/* Reset Data Button */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={(e) => {
                console.log('=== BUTTON CLICKED ===');
                console.log('Event:', e);
                console.log('Event type:', e.type);
                console.log('Target:', e.target);
                
                e.preventDefault();
                e.stopPropagation();
                
                console.log('About to call handleResetData');
                try {
                  handleResetData();
                  console.log('handleResetData completed');
                } catch (error) {
                  console.error('Error calling handleResetData:', error);
                  alert('Error: ' + error.message);
                }
              }}
              onMouseDown={(e) => console.log('Mouse down on button')}
              onMouseUp={(e) => console.log('Mouse up on button')}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition cursor-pointer"
              style={{ pointerEvents: 'auto', zIndex: 1 }}
            >
             {ICONS.WARNING} Reset All Data
            </button>
            <p className="text-center text-xs text-gray-500 mt-2">This will delete all progress and cannot be undone</p>
          </div>
        </div>
        
        {/* Version number in bottom-right corner */}
        <div className="fixed bottom-4 right-4 text-white text-xs font-semibold bg-black bg-opacity-30 px-3 py-1 rounded-lg">
          v3.04
        </div>
      </div>
      </>
    );
  }

  if (gameState === 'history') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-3 sm:mb-4 shadow-2xl">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Career History</h2>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back to Menu
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:p-4">
            {careerHistory.map((career, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-2 sm:p-4 mb-3 sm:mb-4">
                  {generatePokemonSprite(career.primaryType, career.pokemon)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{career.pokemon}</h3>
                      <span 
                        className="px-2 py-0.5 rounded text-sm font-bold text-white"
                        style={{ backgroundColor: getGradeColor(getPokemonGrade(career.finalStats)) }}
                      >
                        {getPokemonGrade(career.finalStats)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span style={{ color: getTypeColor(career.primaryType), fontWeight: 'bold' }}>
                        {career.primaryType}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className={`inline-block px-3 py-1 rounded-lg font-bold ${
                        career.victory ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {career.victory ? 'ðŸ’¡ CHAMPION' : `Gyms Defeated: ${career.gymsDefeated}/5`}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Turn {career.finalTurn} {ICONS.BULLET} {new Date(career.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-bold text-sm mb-2 text-gray-700">Final Stats</h4>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <StatIcon stat="HP" size={14} />
                      </div>
                      <div className="text-xs text-gray-500">HP</div>
                      <div className="font-bold text-sm">{career.finalStats.HP}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <StatIcon stat="Attack" size={14} />
                      </div>
                      <div className="text-xs text-gray-500">ATK</div>
                      <div className="font-bold text-sm">{career.finalStats.Attack}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <StatIcon stat="Defense" size={14} />
                      </div>
                      <div className="text-xs text-gray-500">DEF</div>
                      <div className="font-bold text-sm">{career.finalStats.Defense}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <StatIcon stat="Instinct" size={14} />
                      </div>
                      <div className="text-xs text-gray-500">INS</div>
                      <div className="font-bold text-sm">{career.finalStats.Instinct}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="flex justify-center mb-1">
                        <StatIcon stat="Speed" size={14} />
                      </div>
                      <div className="text-xs text-gray-500">SPE</div>
                      <div className="font-bold text-sm">{career.finalStats.Speed}</div>
                    </div>
                  </div>
                </div>
                {career.knownAbilities && career.knownAbilities.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-bold text-sm mb-2 text-gray-700">Moves Learned</h4>
                    <div className="flex flex-wrap gap-2">
                      {career.knownAbilities.map((moveName, moveIdx) => {
                        const move = MOVES[moveName];
                        return (
                          <div 
                            key={moveIdx}
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{ 
                              backgroundColor: `${getTypeColor(move.type)}20`,
                              color: getTypeColor(move.type),
                              border: `1px solid ${getTypeColor(move.type)}`
                            }}
                          >
                            {moveName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {careerHistory.length === 0 && (
            <div className="bg-white rounded-lg p-12 shadow-lg text-center">
              <p className="text-gray-500 text-lg">No career history yet. Complete your first career to see it here!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'myPokemon') {
    // Sort pokemon inventory
    const sortPokemon = (inventory) => {
      const sorted = [...inventory];
      switch (pokemonSortBy) {
        case 'type':
          return sorted.sort((a, b) => {
            const typeA = POKEMON[a]?.primaryType || 'Normal';
            const typeB = POKEMON[b]?.primaryType || 'Normal';
            return typeA.localeCompare(typeB);
          });
        case 'rarity':
          return sorted.sort((a, b) => {
            const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
            const rarityA = getPokemonRarity(a);
            const rarityB = getPokemonRarity(b);
            const valueA = rarityOrder[rarityA] !== undefined ? rarityOrder[rarityA] : 999;
            const valueB = rarityOrder[rarityB] !== undefined ? rarityOrder[rarityB] : 999;
            return valueA - valueB;
          });
        case 'name':
          return sorted.sort((a, b) => a.localeCompare(b));
        default:
          return sorted;
      }
    };

    // Filter inventory by type
    const filteredInventory = pokemonFilterType === 'all' 
      ? pokemonInventory 
      : pokemonInventory.filter(name => POKEMON[name]?.primaryType === pokemonFilterType);
    
    const sortedInventory = sortPokemon(filteredInventory);

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">

        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-purple-600">My Pokemon</h2>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-sm font-semibold text-gray-700">Sort by:</span>
              <button
                onClick={() => setPokemonSortBy('default')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'default' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Default
              </button>
              <button
                onClick={() => setPokemonSortBy('name')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setPokemonSortBy('type')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setPokemonSortBy('rarity')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'rarity' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rarity
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Filter:</span>
              <button
                onClick={() => setPokemonFilterType('all')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonFilterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Normal'].map(type => (
                <button
                  key={type}
                  onClick={() => setPokemonFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                    pokemonFilterType === type ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={pokemonFilterType === type ? { backgroundColor: getTypeColor(type) } : {}}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedInventory.map((pokemonName, idx) => {
              const pokemon = POKEMON[pokemonName];
              if (!pokemon) {
                // Handle Pokemon not in POKEMON object
                return (
                  <div key={idx} className="bg-white rounded-lg p-4 shadow-lg">
                    <div className="flex justify-center mb-2">
                      {generatePokemonSprite('Normal', pokemonName)}
                    </div>
                    <h3 className="text-center font-bold text-lg">{pokemonName}</h3>
                    <p className="text-center text-sm text-gray-500">
                      Coming Soon
                    </p>
                  </div>
                );
              }
              return (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex justify-center mb-2">
                    {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                  </div>
                  <h3 className="text-center font-bold text-lg">{pokemonName}</h3>
                  <p className="text-center text-sm" style={{ color: getTypeColor(pokemon.primaryType), fontWeight: 'bold' }}>
                    {pokemon.primaryType}
                  </p>
                  <div className="text-center mt-2 mb-2 flex items-center justify-center gap-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon.baseStats)) }}
                    >
                      {getPokemonGrade(pokemon.baseStats)}
                    </span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: getRarityColor(getPokemonRarity(pokemonName)) }}
                    >
                      {getPokemonRarity(pokemonName)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                    <div className="flex items-center gap-1">
                      <StatIcon stat="HP" size={10} />
                      <span>{pokemon.baseStats.HP}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Attack" size={10} />
                      <span>{pokemon.baseStats.Attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Defense" size={10} />
                      <span>{pokemon.baseStats.Defense}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Instinct" size={10} />
                      <span>{pokemon.baseStats.Instinct}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Speed" size={10} />
                      <span>{pokemon.baseStats.Speed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {pokemonInventory.length === 0 && (
            <div className="bg-white rounded-lg p-12 shadow-lg text-center">
              <p className="text-gray-500 text-lg">No Pokemon yet! Roll for some Pokemon to get started.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'trainedPokemon') {
    // Debug: Log first trained pokemon to see if inspirations exist
    if (trainedPokemon.length > 0) {
      console.log('[Trained Pokemon Screen] First pokemon:', trainedPokemon[0]);
      console.log('[Trained Pokemon Screen] Has inspirations?', !!trainedPokemon[0].inspirations);
      if (trainedPokemon[0].inspirations) {
        console.log('[Trained Pokemon Screen] Inspirations:', trainedPokemon[0].inspirations);
      }
    }
    
    // Sort trained pokemon
    const sortTrainedPokemon = (inventory) => {
      const sorted = [...inventory];
      switch (trainedSortBy) {
        case 'date':
          return sorted.sort((a, b) => b.completedAt - a.completedAt); // Most recent first
        case 'grade':
          const gradeOrder = ['UU+', 'UU', 'S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E+', 'E', 'F+', 'F'];
          return sorted.sort((a, b) => {
            const indexA = gradeOrder.indexOf(a.grade);
            const indexB = gradeOrder.indexOf(b.grade);
            return indexA - indexB;
          });
        case 'type':
          return sorted.sort((a, b) => {
            const typeA = a.type || 'Normal';
            const typeB = b.type || 'Normal';
            return typeA.localeCompare(typeB);
          });
        default:
          return sorted;
      }
    };

    // Filter by grade
    const filteredTrainedPokemon = trainedFilterGrade === 'all'
      ? trainedPokemon
      : trainedPokemon.filter(p => {
          const baseGrade = p.grade.replace('+', '');
          return baseGrade === trainedFilterGrade;
        });

    const sortedTrainedPokemon = sortTrainedPokemon(filteredTrainedPokemon);

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-purple-600">Trained Pokemon</h2>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-sm font-semibold text-gray-700">Sort by:</span>
              <button
                onClick={() => setTrainedSortBy('date')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  trainedSortBy === 'date' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setTrainedSortBy('grade')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  trainedSortBy === 'grade' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Grade
              </button>
              <button
                onClick={() => setTrainedSortBy('type')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  trainedSortBy === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Type
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Filter by Grade:</span>
              <button
                onClick={() => setTrainedFilterGrade('all')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  trainedFilterGrade === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {['UU', 'S', 'A', 'B', 'C', 'D', 'E'].map(grade => (
                <button
                  key={grade}
                  onClick={() => setTrainedFilterGrade(grade)}
                  className={`px-3 py-1 rounded-lg text-sm font-bold transition text-white`}
                  style={{ 
                    backgroundColor: trainedFilterGrade === grade ? getGradeColor(grade) : '#e5e7eb',
                    color: trainedFilterGrade === grade ? 'white' : '#374151'
                  }}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedTrainedPokemon.map((trained, idx) => {
              return (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex justify-center mb-2">
                    {generatePokemonSprite(trained.type, trained.name)}
                  </div>
                  <h3 className="text-center font-bold text-lg">{trained.name}</h3>
                  <p className="text-center text-sm" style={{ color: getTypeColor(trained.type), fontWeight: 'bold' }}>
                    {trained.type}
                  </p>
                  <div className="text-center mt-2 mb-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: getGradeColor(trained.grade) }}
                    >
                      {trained.grade}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mb-2">
                    {new Date(trained.completedAt).toLocaleDateString()}
                  </div>
                  
                  {/* Inspirations Display */}
                  {trained.inspirations && trained.inspirations.stat && trained.inspirations.aptitude ? (
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold">{trained.inspirations.stat.name}</span>
                          <div className="flex gap-0.5">
                            {[...Array(trained.inspirations.stat.stars)].map((_, i) => (
                              <span key={i} className="text-xs text-yellow-500">
                                â˜…
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold">{(() => { const colorToType = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' }; return colorToType[trained.inspirations.aptitude.name] || trained.inspirations.aptitude.name; })()}</span>
                          <div className="flex gap-0.5">
                            {[...Array(trained.inspirations.aptitude.stars)].map((_, i) => (
                              <span key={i} className="text-xs text-yellow-500">
                                â˜…
                              </span>
                            ))}
                          </div>
                        </div>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-red-700 text-center">No Inspirations</div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                    <div className="flex items-center gap-1">
                      <StatIcon stat="HP" size={10} />
                      <span>{trained.stats.HP}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Attack" size={10} />
                      <span>{trained.stats.Attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Defense" size={10} />
                      <span>{trained.stats.Defense}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Instinct" size={10} />
                      <span>{trained.stats.Instinct}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Speed" size={10} />
                      <span>{trained.stats.Speed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {trainedPokemon.length === 0 && (
            <div className="bg-white rounded-lg p-12 shadow-lg text-center">
              <p className="text-gray-500 text-lg">No trained Pokemon yet! Complete a career to add your first trained Pokemon.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tournament List Screen
  if (gameState === 'tournaments') {
    const getTimeUntilStart = (startTime) => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = start - now;
      
      if (diff <= 0) return 'In Progress';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'registration':
        case 'upcoming':
          return 'bg-blue-500';
        case 'in_progress':
          return 'bg-green-500';
        case 'completed':
          return 'bg-gray-500';
        default:
          return 'bg-gray-400';
      }
    };

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3">
                <Trophy size={32} className="text-red-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Tournaments</h2>
              </div>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back to Menu
              </button>
            </div>
          </div>

          {!user && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
              <p className="text-center text-yellow-800 font-bold">
                Login required to enter tournaments
              </p>
            </div>
          )}

          {tournamentsLoading ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-lg">
              <p className="text-gray-600">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-lg">
              <Trophy size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-lg">No tournaments available</p>
              <p className="text-gray-500 text-sm mt-2">Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
                  onClick={() => {
                    setSelectedTournament(tournament);
                    setGameState('tournamentDetails');
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{tournament.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getStatusColor(tournament.status)}`}>
                          {tournament.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {tournament.status === 'in_progress' && (
                          <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-bold">
                            Round {tournament.current_round}/{tournament.total_rounds}
                          </span>
                        )}
                      </div>
                    </div>
                    <Trophy size={32} className="text-red-600" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Players:</span>
                      <span className="font-bold">{tournament.entries_count}/{tournament.max_players}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {tournament.status === 'upcoming' || tournament.status === 'registration' ? 'Starts in:' : 'Started:'}
                      </span>
                      <span className="font-bold flex items-center gap-1">
                        <Clock size={14} />
                        {tournament.status === 'upcoming' || tournament.status === 'registration' 
                          ? getTimeUntilStart(tournament.start_time)
                          : new Date(tournament.start_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTournament(tournament);
                        setGameState('tournamentDetails');
                      }}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tournament Details & Entry Screen
  if (gameState === 'tournamentDetails') {

    const userHasRosters = userRosters.length >= 3;
    const canEnter = user && userHasRosters && 
                     (selectedTournament?.status === 'registration' || selectedTournament?.status === 'upcoming');
    const userEntry = tournamentDetails?.entries?.find(e => e.user_id === user?.id);
    const isFull = (tournamentDetails?.tournament?.entries_count || 0) >= (selectedTournament?.max_players || 0);

    const handleTeamSelect = (slotIndex, roster) => {
      const newTeam = [...selectedTeam];
      newTeam[slotIndex] = roster;
      setSelectedTeam(newTeam);
    };

    const handleSubmitEntry = async () => {
      if (!selectedTeam[0] || !selectedTeam[1] || !selectedTeam[2]) {
        alert('Please select 3 Pokemon for your team');
        return;
      }

      // Validate roster IDs exist
      const roster1 = selectedTeam[0].roster_id;
      const roster2 = selectedTeam[1].roster_id;
      const roster3 = selectedTeam[2].roster_id;
      
      if (!roster1 || !roster2 || !roster3) {
        console.error('[Tournament Entry] Missing roster IDs:', {
          team: selectedTeam,
          ids: { roster1, roster2, roster3 }
        });
        alert('Error: Invalid Pokemon selection. Please reselect your team.');
        return;
      }

      // Debug logging
      console.log('[Tournament Entry] Selected Team:', selectedTeam);
      console.log('[Tournament Entry] Roster IDs being sent:', {
        pokemon1: roster1,
        pokemon2: roster2,
        pokemon3: roster3
      });

      try {
        await apiEnterTournament(
          selectedTournament.id,
          roster1,
          roster2,
          roster3
        );
        alert('Successfully entered tournament!');
        setSelectedTeam([null, null, null]);
        // Reload details
        const details = await apiGetTournamentDetails(selectedTournament.id);
        setTournamentDetails(details);
      } catch (error) {
        alert(`Failed to enter tournament: ${error.message}`);
      }
    };

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3">
                <Trophy size={32} className="text-red-600" />
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">{selectedTournament?.name}</h2>
              </div>
              <button
                onClick={() => {
                  setGameState('tournaments');
                  setSelectedTeam([null, null, null]);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back to Tournaments
              </button>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="bg-white rounded-lg p-6 mb-4 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Tournament Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-bold">{selectedTournament?.status?.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div>
                <span className="text-gray-600">Players:</span>
                <span className="ml-2 font-bold">{tournamentDetails?.tournament?.entries_count || 0}/{selectedTournament?.max_players}</span>
              </div>
              <div>
                <span className="text-gray-600">Start Time:</span>
                <span className="ml-2 font-bold">{new Date(selectedTournament?.start_time).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Rounds:</span>
                <span className="ml-2 font-bold">{selectedTournament?.total_rounds}</span>
              </div>
            </div>
          </div>

          {/* User Entry Status */}
          {userEntry ? (
            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-bold text-green-800 mb-2">You're Registered!</h3>
              <p className="text-green-700">Your team has been submitted for this tournament.</p>
              {selectedTournament?.status === 'in_progress' && (
                <button
                  onClick={() => setGameState('tournamentBracket')}
                  className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
                >
                  View Bracket
                </button>
              )}
            </div>
          ) : canEnter && !isFull ? (
            <>
              {/* Team Selection */}
              <div className="bg-white rounded-lg p-6 mb-4 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Select Your Team (3 Pokemon)</h3>
                
                {!userHasRosters && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-bold">You need at least 3 trained Pokemon to enter!</p>
                    <p className="text-yellow-700 text-sm">Complete careers to save trained Pokemon.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[0, 1, 2].map((slotIndex) => (
                    <div key={slotIndex} className="border-2 border-purple-300 rounded-lg p-4">
                      <h4 className="font-bold text-center mb-3">Pokemon {slotIndex + 1}</h4>
                      {selectedTeam[slotIndex] ? (
                        <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4">
                          <div className="flex justify-center mb-2">
                            {generatePokemonSprite(selectedTeam[slotIndex].type, selectedTeam[slotIndex].name)}
                          </div>
                          <h5 className="text-center font-bold">{selectedTeam[slotIndex].name}</h5>
                          <p className="text-center text-sm" style={{ color: getTypeColor(selectedTeam[slotIndex].type) }}>
                            {selectedTeam[slotIndex].type}
                          </p>
                          <div className="text-center mt-2">
                            <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(selectedTeam[slotIndex].grade) }}>
                              {selectedTeam[slotIndex].grade}
                            </span>
                          </div>
                          <button
                            onClick={() => handleTeamSelect(slotIndex, null)}
                            className="w-full mt-3 bg-red-500 text-white py-1 rounded text-sm font-bold hover:bg-red-600 transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <p className="text-sm">No Pokemon selected</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Available Pokemon List */}
                <h4 className="font-bold mb-3">Available Trained Pokemon ({userRosters.length} rosters)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {userRosters.map((roster, idx) => {
                    const alreadySelected = selectedTeam.some(t => t && t.roster_id === roster.roster_id);
                    const pokemonData = roster.pokemon_data ? JSON.parse(roster.pokemon_data) : {};
                    return (
                      <div
                        key={roster.roster_id || idx}
                        className={`bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-3 cursor-pointer transition ${
                          alreadySelected ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'
                        }`}
                        onClick={() => {
                          if (!alreadySelected) {
                            const emptySlot = selectedTeam.findIndex(t => t === null);
                            if (emptySlot !== -1) {
                              console.log('[Tournament] Selecting roster:', {
                                roster_id: roster.roster_id,
                                full_roster: roster
                              });
                              handleTeamSelect(emptySlot, {
                                roster_id: roster.roster_id,
                                name: pokemonData.name || 'Unknown',
                                type: pokemonData.primaryType || pokemonData.type || 'Normal',
                                grade: pokemonData.grade || 'E'
                              });
                            }
                          }
                        }}
                      >
                        <div className="flex justify-center mb-2">
                          {generatePokemonSprite(pokemonData.primaryType || pokemonData.type, pokemonData.name)}
                        </div>
                        <h5 className="text-center font-bold text-sm">{pokemonData.name || 'Unknown'}</h5>
                        <p className="text-center text-xs" style={{ color: getTypeColor(pokemonData.primaryType || pokemonData.type) }}>
                          {pokemonData.primaryType || pokemonData.type || 'Normal'}
                        </p>
                        <div className="text-center mt-1">
                          <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(pokemonData.grade) }}>
                            {pokemonData.grade || 'E'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleSubmitEntry}
                  disabled={!selectedTeam[0] || !selectedTeam[1] || !selectedTeam[2]}
                  className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Submit Team Entry
                </button>
              </div>
            </>
          ) : (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6">
              {!user ? (
                <p className="text-center text-gray-700 font-bold">Login required to enter tournaments</p>
              ) : isFull ? (
                <p className="text-center text-gray-700 font-bold">Tournament is full</p>
              ) : selectedTournament?.status === 'in_progress' ? (
                <>
                  <p className="text-center text-gray-700 font-bold mb-4">Tournament in progress</p>
                  <button
                    onClick={() => setGameState('tournamentBracket')}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition"
                  >
                    View Bracket
                  </button>
                </>
              ) : (
                <p className="text-center text-gray-700 font-bold">Tournament not accepting entries</p>
              )}
            </div>
          )}

          {/* Entries List */}
          {tournamentDetails?.entries && tournamentDetails.entries.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Registered Players ({tournamentDetails.entries.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tournamentDetails.entries.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{entry.username}</span>
                      <span className="text-sm text-gray-500">#{entry.bracket_position + 1}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Rating: {entry.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tournament Bracket Viewer Screen
  if (gameState === 'tournamentBracket') {
    const groupByRound = () => {
      if (!tournamentBracket) return {};
      
      const rounds = {};
      tournamentBracket.forEach(match => {
        if (!rounds[match.round]) {
          rounds[match.round] = [];
        }
        rounds[match.round].push(match);
      });
      
      // Sort matches by position within each round
      Object.keys(rounds).forEach(round => {
        rounds[round].sort((a, b) => a.position - b.position);
      });
      
      return rounds;
    };

    const rounds = groupByRound();
    const totalRounds = selectedTournament?.total_rounds || 0;

    const getMatchStatus = (match) => {
      if (match.completed_at) return 'completed';
      if (match.round === selectedTournament?.current_round) return 'active';
      return 'upcoming';
    };

    const getMatchStatusColor = (status) => {
      switch (status) {
        case 'completed':
          return 'bg-green-100 border-green-400';
        case 'active':
          return 'bg-yellow-100 border-yellow-400';
        case 'upcoming':
          return 'bg-gray-100 border-gray-300';
        default:
          return 'bg-gray-100 border-gray-300';
      }
    };

    const isUserMatch = (match) => {
      if (!user) return false;
      return match.player1_user_id === user.id || match.player2_user_id === user.id;
    };

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3">
                <Trophy size={32} className="text-red-600" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">{selectedTournament?.name}</h2>
                  <p className="text-sm text-gray-600">Round {selectedTournament?.current_round}/{totalRounds}</p>
                </div>
              </div>
              <button
                onClick={() => setGameState('tournamentDetails')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back to Details
              </button>
            </div>
          </div>

          {!tournamentBracket || tournamentBracket.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-lg">
              <p className="text-gray-600">No bracket data available yet</p>
              <p className="text-gray-500 text-sm mt-2">Bracket will be generated when tournament starts</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-lg overflow-x-auto">
              <div className="flex gap-6 min-w-max">
                {[...Array(totalRounds)].map((_, roundIndex) => {
                  const roundNum = roundIndex + 1;
                  const roundMatches = rounds[roundNum] || [];
                  
                  return (
                    <div key={roundNum} className="flex-shrink-0" style={{ minWidth: '300px' }}>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-purple-600">
                          {roundNum === totalRounds ? 'Finals' : 
                           roundNum === totalRounds - 1 ? 'Semifinals' :
                           roundNum === totalRounds - 2 ? 'Quarterfinals' :
                           `Round ${roundNum}`}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {roundMatches.map((match) => {
                          const status = getMatchStatus(match);
                          const isUser = isUserMatch(match);
                          
                          return (
                            <div
                              key={match.id}
                              className={`border-2 rounded-lg p-4 ${getMatchStatusColor(status)} ${
                                isUser ? 'ring-2 ring-purple-500' : ''
                              }`}
                            >
                              {/* Player 1 */}
                              <div className={`flex items-center justify-between p-2 rounded mb-2 ${
                                match.winner_user_id === match.player1_user_id ? 'bg-green-200 font-bold' : 'bg-white'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <Users size={16} />
                                  <span className="text-sm">{match.player1_username || 'TBD'}</span>
                                </div>
                                {match.battle_results && (
                                  <span className="text-sm font-bold">
                                    {JSON.parse(match.battle_results).score?.split('-')[0] || '0'}
                                  </span>
                                )}
                              </div>

                              {/* VS */}
                              <div className="text-center text-xs text-gray-500 mb-2">
                                {status === 'completed' ? 'FINAL' : status === 'active' ? 'LIVE' : 'VS'}
                              </div>

                              {/* Player 2 */}
                              <div className={`flex items-center justify-between p-2 rounded ${
                                match.winner_user_id === match.player2_user_id ? 'bg-green-200 font-bold' : 'bg-white'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <Users size={16} />
                                  <span className="text-sm">{match.player2_username || 'TBD'}</span>
                                </div>
                                {match.battle_results && (
                                  <span className="text-sm font-bold">
                                    {JSON.parse(match.battle_results).score?.split('-')[1] || '0'}
                                  </span>
                                )}
                              </div>

                              {/* Match Details */}
                              {match.completed_at && (
                                <div className="mt-2 pt-2 border-t border-gray-300">
                                  <p className="text-xs text-gray-600 text-center mb-2">
                                    Completed: {new Date(match.completed_at).toLocaleString()}
                                  </p>
                                  {match.battle_results && (
                                    <button
                                      onClick={() => {
                                        setSelectedReplay(match);
                                        setGameState('tournamentReplay');
                                      }}
                                      className="w-full bg-purple-600 text-white py-1.5 px-3 rounded text-xs font-bold hover:bg-purple-700 transition"
                                    >
                                      âš”ï¸ Watch Battle
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-gray-300">
                <h4 className="font-bold mb-3 text-sm">Legend:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                    <span>Active Round</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                    <span>Upcoming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-purple-500 rounded"></div>
                    <span>Your Match</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tournament Replay Viewer Screen
  if (gameState === 'tournamentReplay' && selectedReplay) {
    return (
      <TournamentReplayViewer 
        selectedReplay={selectedReplay}
        setSelectedReplay={setSelectedReplay}
        setGameState={setGameState}
        GAME_CONFIG={GAME_CONFIG}
        MOVES={MOVES}
        ICONS={ICONS}
      />
    );
  }

  if (gameState === 'gacha') {
    const handleRoll = () => {
      const result = rollForPokemon();
      if (result) {
        setRollResult(result);
      }
    };

    return (
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
        {/* Primos display in top-left corner */}
        <div className="fixed top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
          <Sparkles size={20} />
          <span>{primos} Primos</span>
        </div>

        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">Roll for Pokemon</h2>
          
          {!rollResult ? (
            <>
              <p className="text-center text-gray-600 mb-6">
                Cost: 100 Primos per roll
              </p>
              <div className="mb-6 text-sm text-gray-600">
                <h3 className="font-bold mb-2">Rates:</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Common'), fontWeight: 'bold' }}>Common</span>
                    <span>60%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Uncommon'), fontWeight: 'bold' }}>Uncommon</span>
                    <span>30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Rare'), fontWeight: 'bold' }}>Rare</span>
                    <span>9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Legendary'), fontWeight: 'bold' }}>Legendary</span>
                    <span>1%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleRoll}
                  disabled={primos < 100}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-yellow-700 transition disabled:bg-gray-400"
                >
                  {primos >= 100 ? 'Roll!' : 'Not Enough Primos'}
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Back to Menu
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block px-4 py-2 rounded-lg font-bold text-white text-xl mb-4" style={{ backgroundColor: getRarityColor(rollResult.rarity) }}>
                  {rollResult.rarity}!
                </div>
              </div>
              <div className="flex justify-center mb-4">
                {generatePokemonSprite(POKEMON[rollResult.pokemon]?.primaryType || 'Normal', rollResult.pokemon)}
              </div>
              <h3 className="text-2xl font-bold mb-2">{rollResult.pokemon}</h3>
              {POKEMON[rollResult.pokemon] && (
                <p className="text-lg mb-6" style={{ color: getTypeColor(POKEMON[rollResult.pokemon].primaryType), fontWeight: 'bold' }}>
                  {POKEMON[rollResult.pokemon].primaryType}
                </p>
              )}
              {rollResult.isDuplicate && (
                <p className="text-orange-600 font-bold mb-4">Duplicate! 100 Primos refunded.</p>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setRollResult(null);
                    if (primos >= 100) {
                      handleRoll();
                    }
                  }}
                  disabled={primos < 100}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-yellow-700 transition disabled:bg-gray-400"
                >
                  Roll Again
                </button>
                <button
                  onClick={() => {
                    setRollResult(null);
                    setGameState('menu');
                  }}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Support Gacha Screen
  if (gameState === 'supportGacha') {
    const handleSupportRoll = () => {
      if (primos < 100) return;
      
      const roll = Math.random();
      let selectedRarity = 'Common';
      let cumulativeRate = 0;
      
      for (const [rarity, data] of Object.entries(SUPPORT_GACHA_RARITY)) {
        cumulativeRate += data.rate;
        if (roll < cumulativeRate) {
          selectedRarity = rarity;
          break;
        }
      }
      
      const rarityPool = SUPPORT_GACHA_RARITY[selectedRarity].supports;
      const support = rarityPool[Math.floor(Math.random() * rarityPool.length)];
      
      const isDuplicate = supportInventory.includes(support);
      
      if (!isDuplicate) {
        const newInventory = [...supportInventory, support];
        setSupportInventory(newInventory);
        localStorage.setItem('supportInventory', JSON.stringify(newInventory));
      }
      
      const newPrimos = isDuplicate ? primos : primos - 100;
      setPrimos(newPrimos);
      localStorage.setItem('playerPrimos', newPrimos.toString());
      
      setRollResult({ support, rarity: selectedRarity, isDuplicate });
    };

    return (
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
        {/* Primos display in top-left corner */}
        <div className="fixed top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
          <Sparkles size={20} />
          <span>{primos} Primos</span>
        </div>

        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">Roll for Supports</h2>
          
          {!rollResult ? (
            <>
              <p className="text-center text-gray-600 mb-6">
                Cost: 100 Primos per roll
              </p>
              <div className="mb-6 text-sm text-gray-600">
                <h3 className="font-bold mb-2">Rates:</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Common'), fontWeight: 'bold' }}>Common</span>
                    <span>50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Uncommon'), fontWeight: 'bold' }}>Uncommon</span>
                    <span>35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Rare'), fontWeight: 'bold' }}>Rare</span>
                    <span>13%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: getRarityColor('Legendary'), fontWeight: 'bold' }}>Legendary</span>
                    <span>2%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleSupportRoll}
                  disabled={primos < 100}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-purple-700 transition disabled:bg-gray-400"
                >
                  {primos >= 100 ? 'Roll!' : 'Not Enough Primos'}
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Back to Menu
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block px-4 py-2 rounded-lg font-bold text-white text-xl mb-4" style={{ backgroundColor: getRarityColor(rollResult.rarity) }}>
                  {rollResult.rarity}!
                </div>
              </div>
              <div className="mb-4">
                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg p-4 border-2" style={{ borderColor: getRarityColor(rollResult.rarity) }}>
                  <h3 className="text-xl font-bold mb-2">{SUPPORT_CARDS[rollResult.support].name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-bold">{SUPPORT_CARDS[rollResult.support].trainer}</span> & <span className="font-bold">{SUPPORT_CARDS[rollResult.support].pokemon}</span>
                  </p>
                  <p className="text-xs text-gray-700 italic">{SUPPORT_CARDS[rollResult.support].effect.description}</p>
                </div>
              </div>
              {rollResult.isDuplicate && (
                <p className="text-orange-600 font-bold mb-4">Duplicate! 100 Primos refunded.</p>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setRollResult(null);
                    if (primos >= 100) {
                      handleSupportRoll();
                    }
                  }}
                  disabled={primos < 100}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-purple-700 transition disabled:bg-gray-400"
                >
                  Roll Again
                </button>
                <button
                  onClick={() => {
                    setRollResult(null);
                    setGameState('menu');
                  }}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // My Supports Screen
  if (gameState === 'mySupports') {
    // Sort support inventory based on selected sort option
    const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
    const typeOrder = { 'HP': 0, 'Attack': 1, 'Defense': 2, 'Instinct': 3, 'Speed': 4 };
    
    const sortSupports = (inventory) => {
      const sorted = [...inventory];
      switch (supportSortBy) {
        case 'rarity':
          return sorted.sort((a, b) => {
            const supportA = getSupportCardAttributes(a);
            const supportB = getSupportCardAttributes(b);
            if (!supportA || !supportB) return 0;
            const rarityA = rarityOrder[supportA.rarity];
            const rarityB = rarityOrder[supportB.rarity];
            return (rarityA !== undefined ? rarityA : 999) - (rarityB !== undefined ? rarityB : 999);
          });
        case 'type':
          return sorted.sort((a, b) => {
            const supportA = getSupportCardAttributes(a);
            const supportB = getSupportCardAttributes(b);
            if (!supportA || !supportB) return 0;
            const typeA = supportA.supportType || 'HP';
            const typeB = supportB.supportType || 'HP';
            const valueA = typeOrder[typeA] !== undefined ? typeOrder[typeA] : 999;
            const valueB = typeOrder[typeB] !== undefined ? typeOrder[typeB] : 999;
            return valueA - valueB;
          });
        default:
          return sorted;
      }
    };

    // Filter inventory by rarity
    const filteredSupportInventory = supportFilterRarity === 'all'
      ? supportInventory
      : supportInventory.filter(key => {
          const support = getSupportCardAttributes(key);
          return support?.rarity === supportFilterRarity;
        });

    const sortedSupportInventory = sortSupports(filteredSupportInventory);
    
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-purple-600">My Support Cards</h2>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-sm font-semibold text-gray-700">Sort by:</span>
              <button
                onClick={() => setSupportSortBy('rarity')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportSortBy === 'rarity' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rarity
              </button>
              <button
                onClick={() => setSupportSortBy('type')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportSortBy === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Type
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Filter:</span>
              <button
                onClick={() => setSupportFilterRarity('all')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportFilterRarity === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSupportFilterRarity('Legendary')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportFilterRarity === 'Legendary' ? 'bg-yellow-500 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Legendary
              </button>
              <button
                onClick={() => setSupportFilterRarity('Rare')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportFilterRarity === 'Rare' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rare
              </button>
              <button
                onClick={() => setSupportFilterRarity('Uncommon')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportFilterRarity === 'Uncommon' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Uncommon
              </button>
              <button
                onClick={() => setSupportFilterRarity('Common')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportFilterRarity === 'Common' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Common
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSupportInventory.map((supportKey, idx) => {
                const support = getSupportCardAttributes(supportKey);
                if (!support) return null;
                
                return (
                  <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 hover:shadow-lg transition" style={{ borderColor: getRarityColor(support.rarity) }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getRarityColor(support.rarity) }}>
                        {support.rarity}
                      </span>
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{support.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">{support.trainer}</span> & <span className="font-semibold">{support.pokemon}</span>
                    </p>
                    {support.supportType && (
                      <p className="text-xs font-bold mb-2" style={{ color: getTypeColor(support.supportType === 'Attack' ? 'Fire' : support.supportType === 'Defense' ? 'Water' : support.supportType === 'HP' ? 'Grass' : support.supportType === 'Instinct' ? 'Psychic' : 'Electric') }}>
                        Focus: {support.supportType}
                      </p>
                    )}
                    <p className="text-xs text-gray-700 italic mb-3">{support.effect.description}</p>
                    
                    {/* Base Stats */}
                    {support.baseStatIncrease && Object.values(support.baseStatIncrease).some(v => v > 0) && (
                      <div className="text-xs space-y-1 bg-white rounded p-2 mb-2">
                        <p className="font-bold text-purple-600">Base Stat Bonuses:</p>
                        {Object.entries(support.baseStatIncrease).map(([stat, value]) => (
                          value > 0 && <div key={stat} className="flex justify-between"><span>{stat}:</span><span className="text-green-600 font-bold">+{value}</span></div>
                        ))}
                      </div>
                    )}
                    
                    {/* Training Bonuses */}
                    <div className="text-xs space-y-1 bg-white rounded p-2 mb-2">
                      <p className="font-bold text-purple-600">Training Bonuses:</p>
                      <div className="flex justify-between"><span>Initial Friendship:</span><span className="text-blue-600 font-bold">{support.initialFriendship}</span></div>
                      <div className="flex justify-between"><span>Type Match:</span><span className="text-green-600 font-bold">+{support.typeBonusTraining}</span></div>
                      <div className="flex justify-between"><span>Other Stats:</span><span className="text-green-600 font-bold">+{support.generalBonusTraining}</span></div>
                      <div className="flex justify-between"><span>Max Friend:</span><span className="text-green-600 font-bold">+{support.friendshipBonusTraining}</span></div>
                    </div>
                    
                    {/* Appearance */}
                    <div className="text-xs space-y-1 bg-white rounded p-2">
                      <div className="flex justify-between"><span>Appearance:</span><span className="text-gray-700 font-bold">{Math.round(support.appearanceChance * 100)}%</span></div>
                    </div>
                    
                    {/* Effect-specific bonuses */}
                    {support.effect.type === 'training_boost' && (
                      <div className="text-xs space-y-1 bg-white rounded p-2 mt-2">
                        <p className="font-bold text-purple-600">Special Effects:</p>
                        {support.effect.trainingMultiplier && <div className="flex justify-between"><span>Gain Mult:</span><span className="text-green-600 font-bold">{support.effect.trainingMultiplier}x</span></div>}
                        {support.effect.energyCostReduction && <div className="flex justify-between"><span>Energy Cost:</span><span className="text-green-600 font-bold">-{support.effect.energyCostReduction}</span></div>}
                        {support.effect.failureReduction && <div className="flex justify-between"><span>Fail Rate:</span><span className="text-green-600 font-bold">-{(support.effect.failureReduction * 100).toFixed(0)}%</span></div>}
                      </div>
                    )}
                    {support.effect.type === 'energy_boost' && (
                      <div className="text-xs space-y-1 bg-white rounded p-2 mt-2">
                        <p className="font-bold text-purple-600">Energy Benefits:</p>
                        {support.effect.energyBonus && <div className="flex justify-between"><span>Max Energy:</span><span className="text-green-600 font-bold">+{support.effect.energyBonus}</span></div>}
                        {support.effect.restBonus && <div className="flex justify-between"><span>Rest Bonus:</span><span className="text-green-600 font-bold">+{support.effect.restBonus}</span></div>}
                      </div>
                    )}
                    {support.effect.type === 'experience_boost' && (
                      <div className="text-xs space-y-1 bg-white rounded p-2 mt-2">
                        <p className="font-bold text-purple-600">XP Benefits:</p>
                        {support.effect.skillPointMultiplier && <div className="flex justify-between"><span>SP Mult:</span><span className="text-green-600 font-bold">{support.effect.skillPointMultiplier}x</span></div>}
                        {support.effect.friendshipBonus && <div className="flex justify-between"><span>Friendship:</span><span className="text-green-600 font-bold">+{support.effect.friendshipBonus}</span></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {sortedSupportInventory.length === 0 && (
              <p className="text-center text-gray-500 text-lg mt-4">No supports yet! Roll for some supports to get started.</p>
            )}
        </div>
      </div>
    );
  }

  if (gameState === 'pokemonSelect') {
    // Sort pokemon inventory
    const sortPokemon = (inventory) => {
      const sorted = [...inventory].filter(name => POKEMON[name]);
      switch (pokemonSortBy) {
        case 'type':
          return sorted.sort((a, b) => {
            const typeA = POKEMON[a]?.primaryType || 'Normal';
            const typeB = POKEMON[b]?.primaryType || 'Normal';
            return typeA.localeCompare(typeB);
          });
        case 'rarity':
          return sorted.sort((a, b) => {
            const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
            const rarityA = getPokemonRarity(a);
            const rarityB = getPokemonRarity(b);
            const valueA = rarityOrder[rarityA] !== undefined ? rarityOrder[rarityA] : 999;
            const valueB = rarityOrder[rarityB] !== undefined ? rarityOrder[rarityB] : 999;
            return valueA - valueB;
          });
        case 'name':
          return sorted.sort((a, b) => a.localeCompare(b));
        default:
          return sorted;
      }
    };
    
    const sortedInventory = sortPokemon(pokemonInventory);
    
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">

        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-4 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Select Your Pokemon</h2>
              <button
                onClick={() => setGameState('menu')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Sort by:</span>
              <button
                onClick={() => setPokemonSortBy('default')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'default' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Default
              </button>
              <button
                onClick={() => setPokemonSortBy('name')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => setPokemonSortBy('type')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setPokemonSortBy('rarity')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonSortBy === 'rarity' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rarity
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {sortedInventory.map((pokemonName, idx) => {
              const pokemon = POKEMON[pokemonName];
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPokemon(pokemonName);
                    setGameState('inspirationSelect');
                  }}
                  className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">{pokemonName}</h3>
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon.baseStats)) }}
                        >
                          {getPokemonGrade(pokemon.baseStats)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span style={{ color: getTypeColor(pokemon.primaryType), fontWeight: 'bold' }}>
                          {pokemon.primaryType}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">{pokemon.strategy} ({pokemon.strategyGrade})</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <StatIcon stat="HP" size={12} />
                      <span>HP: {pokemon.baseStats.HP}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Attack" size={12} />
                      <span>ATK: {pokemon.baseStats.Attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Defense" size={12} />
                      <span>DEF: {pokemon.baseStats.Defense}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Instinct" size={12} />
                      <span>INS: {pokemon.baseStats.Instinct}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatIcon stat="Speed" size={12} />
                      <span>SPE: {pokemon.baseStats.Speed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {sortedInventory.length === 0 && (
            <div className="bg-white rounded-lg p-8 shadow-lg text-center mt-4">
              <p className="text-gray-600 mb-4">You don't have any playable Pokemon yet!</p>
              <p className="text-sm text-gray-500">The Pokemon you rolled are not yet available in gameplay. Please roll for starter Pokemon: Charmander, Squirtle, Bulbasaur, Pikachu, or Gastly.</p>
              <button
                onClick={() => setGameState('menu')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
              >
                Back to Menu
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'supportSelect') {
    // Sort support inventory based on selected sort option
    const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
    const typeOrder = { 'HP': 0, 'Attack': 1, 'Defense': 2, 'Instinct': 3, 'Speed': 4 };
    
    console.log('[Support Select] Sorting by:', supportSortBy);
    console.log('[Support Select] Raw inventory:', supportInventory);
    
    const sortedSupportInventory = [...supportInventory].sort((a, b) => {
      const supportA = getSupportCardAttributes(a);
      const supportB = getSupportCardAttributes(b);
      if (!supportA || !supportB) return 0;
      
      if (supportSortBy === 'rarity') {
        const rarityAValue = rarityOrder[supportA.rarity];
        const rarityBValue = rarityOrder[supportB.rarity];
        const rarityAFinal = rarityAValue !== undefined ? rarityAValue : 999;
        const rarityBFinal = rarityBValue !== undefined ? rarityBValue : 999;
        const result = rarityAFinal - rarityBFinal;
        console.log(`[Support Sort] ${supportA.name} (rarity="${supportA.rarity}", lookup=${rarityAValue}, final=${rarityAFinal}) vs ${supportB.name} (rarity="${supportB.rarity}", lookup=${rarityBValue}, final=${rarityBFinal}) = ${result}`);
        return result;
      } else if (supportSortBy === 'type') {
        const typeA = supportA.supportType || 'HP';
        const typeB = supportB.supportType || 'HP';
        const valueA = typeOrder[typeA] !== undefined ? typeOrder[typeA] : 999;
        const valueB = typeOrder[typeB] !== undefined ? typeOrder[typeB] : 999;
        return valueA - valueB;
      }
      return 0;
    });
    
    console.log('[Support Select] Sorted inventory:', sortedSupportInventory.map(key => {
      const support = getSupportCardAttributes(key);
      return `${support?.name} (${support?.rarity})`;
    }));
    
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-4 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Select Up to 5 Supports</h2>
                <p className="text-gray-600">Selected: {selectedSupports.length}/5</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSupports([]);
                  setGameState('inspirationSelect');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Sort by:</span>
              <button
                onClick={() => setSupportSortBy('rarity')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportSortBy === 'rarity' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rarity
              </button>
              <button
                onClick={() => setSupportSortBy('type')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  supportSortBy === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Type
              </button>
            </div>
          </div>
          
          {/* All Support Cards */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3">Your Support Cards</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {sortedSupportInventory.map((supportKey, idx) => {
                const support = getSupportCardAttributes(supportKey);
                if (!support) return null;
                
                const isSelected = selectedSupports.includes(supportKey);

                const statBonuses = Object.entries(support.baseStatIncrease)
                  .filter(([stat, value]) => value > 0)
                  .map(([stat, value]) => `${stat}: +${value}`)
                  .join(', ');

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSupports(selectedSupports.filter(s => s !== supportKey));
                      } else if (selectedSupports.length < 5) {
                        setSelectedSupports([...selectedSupports, supportKey]);
                      }
                    }}
                    className={`bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 cursor-pointer transition border-2 ${
                      isSelected ? 'ring-4 ring-green-500' : 'hover:shadow-lg'
                    }`}
                    style={{ borderColor: getRarityColor(support.rarity) }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: getRarityColor(support.rarity) }}>
                          {support.rarity}
                        </span>
                        <h3 className="text-base font-bold text-gray-800 mt-1">{support.name}</h3>
                      </div>
                      {isSelected && <span className="text-xl">{ICONS.CHECKMARK}</span>}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-semibold">{support.trainer}</span> & <span className="font-semibold">{support.pokemon}</span>
                    </p>
                    {support.supportType && (
                      <p className="text-xs font-bold mb-2" style={{ color: getTypeColor(support.supportType === 'Attack' ? 'Fire' : support.supportType === 'Defense' ? 'Water' : support.supportType === 'HP' ? 'Grass' : support.supportType === 'Instinct' ? 'Psychic' : 'Electric') }}>
                        Focus: {support.supportType}
                      </p>
                    )}
                    <p className="text-xs text-gray-700 italic mb-2">{support.effect.description}</p>
                    
                    <div className="bg-white rounded p-2 mb-2 text-xs space-y-1">
                      {statBonuses && <div className="font-bold text-green-600 mb-1">{statBonuses}</div>}
                      <div className="text-gray-600">Type Bonus: +{support.typeBonusTraining} (Max: +{support.friendshipBonusTraining})</div>
                      <div className="text-gray-600">Other Stats: +{support.generalBonusTraining}</div>
                      
                      {support.effect.type === 'training_boost' && (
                        <div className="border-t pt-1 mt-1 text-purple-600 font-semibold">
                          {support.effect.trainingMultiplier && <div>Gain Mult: {support.effect.trainingMultiplier}x</div>}
                          {support.effect.energyCostReduction && <div>Energy Cost: -{support.effect.energyCostReduction}</div>}
                          {support.effect.failureReduction && <div>Fail Rate: -{(support.effect.failureReduction * 100).toFixed(0)}%</div>}
                        </div>
                      )}
                      {support.effect.type === 'energy_boost' && (
                        <div className="border-t pt-1 mt-1 text-purple-600 font-semibold">
                          {support.effect.energyBonus && <div>Max Energy: +{support.effect.energyBonus}</div>}
                          {support.effect.restBonus && <div>Rest Bonus: +{support.effect.restBonus}</div>}
                        </div>
                      )}
                      {support.effect.type === 'experience_boost' && (
                        <div className="border-t pt-1 mt-1 text-purple-600 font-semibold">
                          {support.effect.skillPointMultiplier && <div>SP Mult: {support.effect.skillPointMultiplier}x</div>}
                          {support.effect.friendshipBonus && <div>Friendship: +{support.effect.friendshipBonus}</div>}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Appears: {Math.round(support.appearanceChance * 100)}%</span>
                      <span>Start Friend: {support.initialFriendship}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={initializeCareer}
            className="w-full bg-green-600 text-white py-2 sm:py-3 sm:py-4 rounded-lg font-bold text-lg sm:text-xl hover:bg-green-700 transition"
          >
            Begin Career
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'inspirationSelect') {
    // Sort trained pokemon by inspiration
    const sortTrainedByInspiration = (pokemon) => {
      return [...pokemon].sort((a, b) => {
        const getTotalStars = (p) => {
          if (!p.inspirations || !p.inspirations.stat || !p.inspirations.aptitude) return 0;
          return p.inspirations.stat.stars + p.inspirations.aptitude.stars;
        };
        
        // Primary sort by mode
        if (inspirationSortMode === 'stat') {
          // Sort by stat name alphabetically
          const statA = a.inspirations?.stat?.name || '';
          const statB = b.inspirations?.stat?.name || '';
          const statCompare = statA.localeCompare(statB);
          if (statCompare !== 0) return statCompare;
          // Secondary sort by total stars descending
          return getTotalStars(b) - getTotalStars(a);
        } else if (inspirationSortMode === 'aptitude') {
          // Sort by aptitude type alphabetically
          const colorToType = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' };
          const aptA = colorToType[a.inspirations?.aptitude?.name] || a.inspirations?.aptitude?.name || '';
          const aptB = colorToType[b.inspirations?.aptitude?.name] || b.inspirations?.aptitude?.name || '';
          const aptCompare = aptA.localeCompare(aptB);
          if (aptCompare !== 0) return aptCompare;
          // Secondary sort by total stars descending
          return getTotalStars(b) - getTotalStars(a);
        } else {
          // Default: sort by total stars descending
          return getTotalStars(b) - getTotalStars(a);
        }
      });
    };
    
    const sortedTrainedPokemon = sortTrainedByInspiration(trainedPokemon);
    
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-4 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Select 2 Inspirations</h2>
                <p className="text-gray-600">Selected: {selectedInspirations.length}/2</p>
                <p className="text-xs text-gray-500 mt-1">Choose trained Pokemon to inspire your career Pokemon at turns 11, 23, 35, 47, and 59</p>
              </div>
              <button
                onClick={() => {
                  setSelectedInspirations([]);
                  setInspirationSortMode('stars');
                  setGameState('pokemonSelect');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back
              </button>
            </div>
            
            {/* Sort Options */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setInspirationSortMode('stars')}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  inspirationSortMode === 'stars'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Total Stars
              </button>
              <button
                onClick={() => setInspirationSortMode('stat')}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  inspirationSortMode === 'stat'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Stat
              </button>
              <button
                onClick={() => setInspirationSortMode('aptitude')}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  inspirationSortMode === 'aptitude'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Type
              </button>
            </div>
          </div>
          
          {/* Trained Pokemon Grid */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3">Your Trained Pokemon</h3>
            {trainedPokemon.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-lg text-center">
                <p className="text-gray-500 mb-4">You have no trained Pokemon yet. You can continue without inspirations.</p>
                <button
                  onClick={() => setGameState('supportSelect')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
                >
                  Continue to Support Selection
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sortedTrainedPokemon.map((trained, idx) => {
                    const isSelected = selectedInspirations.some(insp => 
                      insp.name === trained.name && insp.completedAt === trained.completedAt
                    );
                    const totalStars = trained.inspirations ? 
                      (trained.inspirations.stat?.stars || 0) + (trained.inspirations.aptitude?.stars || 0) : 0;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedInspirations(selectedInspirations.filter(insp => 
                              !(insp.name === trained.name && insp.completedAt === trained.completedAt)
                            ));
                          } else if (selectedInspirations.length < 2) {
                            setSelectedInspirations([...selectedInspirations, trained]);
                          }
                        }}
                        className={`bg-white rounded-lg p-4 shadow-lg cursor-pointer transition border-2 ${
                          isSelected ? 'ring-4 ring-green-500' : 'hover:shadow-xl'
                        }`}
                      >
                        <div className="flex justify-center mb-2">
                          {generatePokemonSprite(trained.type, trained.name)}
                        </div>
                        <h3 className="text-center font-bold text-lg">{trained.name}</h3>
                        
                        {/* Total Stars Display */}
                        {trained.inspirations && (
                          <div className="flex justify-center gap-1 mt-2 mb-3">
                            {[...Array(totalStars)].map((_, i) => (
                              <span key={i} className="text-base text-yellow-500">
                                â˜…
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Inspirations Display */}
                        {trained.inspirations && trained.inspirations.stat && trained.inspirations.aptitude ? (
                          <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold">{trained.inspirations.stat.name}</span>
                                <div className="flex gap-0.5">
                                  {[...Array(trained.inspirations.stat.stars)].map((_, i) => (
                                    <span key={i} className="text-xs text-yellow-500">
                                      â˜…
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold">{(() => { const colorToType = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' }; return colorToType[trained.inspirations.aptitude.name] || trained.inspirations.aptitude.name; })()}</span>
                                <div className="flex gap-0.5">
                                  {[...Array(trained.inspirations.aptitude.stars)].map((_, i) => (
                                    <span key={i} className="text-xs text-yellow-500">
                                      â˜…
                                    </span>
                                  ))}
                                </div>
                              </div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-red-700 text-center">No Inspirations</div>
                        )}
                        
                        {isSelected && (
                          <div className="text-center mt-2">
                            <span className="text-2xl">{ICONS.CHECKMARK}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setGameState('supportSelect')}
                  disabled={selectedInspirations.length > 2}
                  className={`w-full mt-6 py-3 rounded-lg font-bold text-lg transition ${
                    selectedInspirations.length <= 2
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  Continue to Support Selection
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'career' && careerData) {
    // Show gym battle when turn matches the next gym's designated turn
    const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
    const isGymTurn = careerData.turn === nextGymTurn && careerData.currentGymIndex < 5;
    const nextGymLeader = careerData.gymLeaders[careerData.currentGymIndex];

    const calculateFailChance = (currentEnergy, statType = null) => {
      // Reduced intensity by ~10%: More lenient curve
      let baseFailureChance = 0;
      if (currentEnergy <= 75) {
        if (currentEnergy <= 0) {
          baseFailureChance = 0.891; // Was 0.99
        } else if (currentEnergy <= 20) {
          baseFailureChance = 0.891 - ((currentEnergy / 20) * 0.216); // Was 0.99 - 0.24
        } else if (currentEnergy <= 30) {
          baseFailureChance = 0.675 - (((currentEnergy - 20) / 10) * 0.225); // Was 0.75 - 0.25
        } else if (currentEnergy <= 50) {
          baseFailureChance = 0.45 - (((currentEnergy - 30) / 20) * 0.225); // Was 0.50 - 0.25
        } else {
          baseFailureChance = 0.225 - (((currentEnergy - 50) / 25) * 0.225); // Was 0.25 - 0.25
        }
      }
      
      // Speed training has 50% lower fail rate than other trainings
      if (statType === 'Speed') {
        baseFailureChance *= 0.5;
      }
      
      return Math.round(baseFailureChance * 100);
    };

    return (
      <>
      <div className="w-full min-h-screen bg-gradient-to-b from-purple-400 to-pink-500 p-2 sm:p-3">
        <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3">
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
            {/* Mobile: Stack everything vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Pokemon Info */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                  {generatePokemonSprite(careerData.pokemon.primaryType, careerData.pokemon.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-bold truncate">{careerData.pokemon.name}</h2>
                    <span 
                      className="px-1.5 py-0.5 rounded text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: getGradeColor(getPokemonGrade(careerData.currentStats)) }}
                    >
                      {getPokemonGrade(careerData.currentStats)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <span style={{ color: getTypeColor(careerData.pokemon.primaryType), fontWeight: 'bold' }}>
                      {careerData.pokemon.primaryType}
                    </span>
                  </div>
                  {/* Type Aptitudes - Show all 6 types */}
                  <div className="flex text-[10px] sm:text-xs mt-1 flex-wrap gap-x-2 gap-y-0.5">
                    <span>
                      <span style={{ color: getTypeColor('Fire'), fontWeight: 'bold' }}>Fir</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Red), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Red}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Water'), fontWeight: 'bold' }}>Wat</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Blue), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Blue}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Grass'), fontWeight: 'bold' }}>Gra</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Green), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Green}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Psychic'), fontWeight: 'bold' }}>Psy</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Purple), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Purple}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Electric'), fontWeight: 'bold' }}>Ele</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Yellow), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Yellow}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Fighting'), fontWeight: 'bold' }}>Fig</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Orange), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Orange}</span>
                    </span>
                  </div>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-x-1 sm:gap-x-2 text-xs mt-1">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="HP" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.HP}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Attack" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Attack}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Defense" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Defense}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Instinct" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Instinct}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Speed" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Speed}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Turn Counter and Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="font-bold text-sm sm:text-base">Turn {careerData.turn}/{GAME_CONFIG.CAREER.TOTAL_TURNS}</div>
                  <div className="text-xs text-gray-600">Gym: {(careerData.currentGymIndex + 1) * 12}</div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-wrap">
                  <button
                    onClick={() => setViewMode('abilities')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-100 hover:bg-purple-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Sparkles size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.knownAbilities.length}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('learn')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Book size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.skillPoints}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('gym')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-100 hover:bg-yellow-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Trophy size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.currentGymIndex}/5</span>
                  </button>
                  <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 rounded text-xs sm:text-sm">
                    <Zap size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.energy}</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-pink-100 rounded text-xs sm:text-sm" title="Pokeclocks: Retry gym battles">
                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.pokeclocks || 0}</span>
                  </div>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <span className="font-bold">?</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isGymTurn && (
            <div className="bg-red-600 text-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  {generateTrainerSprite(careerData.currentGymIndex + 1)}
                  <div>
                    <h3 className="text-lg font-bold">GYM LEADER BATTLE!</h3>
                    <p className="text-sm">Face {nextGymLeader.name} now!</p>
                  </div>
                </div>
                <button
                  onClick={() => startBattle(nextGymLeader, true)}
                  className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition"
                >
                  Challenge
                </button>
              </div>
            </div>
          )}

          {careerData && (
            <>
              {!isGymTurn && careerData.pendingEvent && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2 sm:p-4 shadow-lg mb-3 sm:mb-4">
                  <div className="bg-white rounded-lg p-2 sm:p-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-purple-600">{careerData.pendingEvent.name}</h3>
                    <p className="text-gray-700 mb-3 sm:mb-4">{careerData.pendingEvent.description}</p>
                    
                    {careerData.pendingEvent.type === 'stat_increase' && (
                      <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded border-2 border-green-500">
                          <div className="font-bold text-green-700 mb-2 text-center">Stat Gains:</div>
                          <div className="flex justify-center">
                            <div className="grid grid-cols-5 gap-2 text-sm max-w-md">
                              {Object.entries(careerData.pendingEvent.effect).map(([stat, value]) => (
                                <div key={stat} className="text-center">
                                  <div className="text-gray-600">{stat}</div>
                                  <div className="font-bold text-green-600">+{value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => resolveEvent(careerData.pendingEvent.effect)}
                          className="w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-green-700 transition"
                        >
                          Continue
                        </button>
                      </div>
                    )}
                    
                    {careerData.pendingEvent.type === 'choice' && (
                      <div className="space-y-3">
                        {careerData.pendingEvent.choices.map((choice, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const roll = Math.random();
                              let cumulative = 0;
                              for (const outcome of choice.outcomes) {
                                cumulative += outcome.chance;
                                if (roll < cumulative) {
                                  resolveEvent(outcome);
                                  break;
                                }
                              }
                            }}
                            className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition text-left"
                          >
                            {choice.text}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {careerData.pendingEvent.type === 'battle' && (
                      <div className="space-y-3">
                        <div className="bg-red-50 p-3 rounded border-2 border-red-500">
                          <div className="font-bold text-red-700">This battle will be challenging!</div>
                          <div className="text-sm text-gray-600 mt-1">Difficulty: {careerData.pendingEvent.difficulty}x</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const allNonStarterPokemons = Object.values(POKEMON).filter(c => !c.isStarter);
                              const eventPokemon = allNonStarterPokemons[Math.floor(Math.random() * allNonStarterPokemons.length)];
                              
                              // Apply same scaling as wild pokemon battles
                              const startMultiplier = 1.0 * 1.04;
                              const growthPerTurn = 0.03125 * 1.04 * 1.3 * 1.25;
                              const turnScaling = startMultiplier + (careerData.turn * growthPerTurn);
                              
                              // Combine turn scaling with event difficulty
                              const mult = careerData.pendingEvent.difficulty * turnScaling;
                              
                              const eventOpponent = {
                                name: 'Wandering Champion',
                                pokemon: eventPokemon.name,
                                primaryType: eventPokemon.primaryType,
                                stats: {
                                  HP: Math.floor(eventPokemon.baseStats.HP * mult),
                                  Attack: Math.floor(eventPokemon.baseStats.Attack * mult),
                                  Defense: Math.floor(eventPokemon.baseStats.Defense * mult),
                                  Instinct: Math.floor(eventPokemon.baseStats.Instinct * mult),
                                  Speed: Math.floor(eventPokemon.baseStats.Speed * mult)
                                },
                                abilities: [...eventPokemon.defaultAbilities, ...eventPokemon.learnableAbilities.slice(0, 3), 'BodySlam'],
                                typeAptitudes: eventPokemon.typeAptitudes,
                                strategy: eventPokemon.strategy,
                                strategyGrade: eventPokemon.strategyGrade
                              };
                              
                              // Store event rewards to apply after battle
                              setCareerData(prev => ({
                                ...prev,
                                eventBattleRewards: careerData.pendingEvent.rewards,
                                pendingEvent: null
                              }));
                              
                              startBattle(eventOpponent, false);
                            }}
                            className="bg-red-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-red-700 transition"
                          >
                            Accept Challenge
                          </button>
                          <button
                            onClick={() => {
                              // Decline the battle - clear event and generate training options
                              setCareerData(prev => ({
                                ...prev,
                                pendingEvent: null,
                                currentTrainingOptions: generateTrainingOptions()
                              }));
                            }}
                            className="bg-gray-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {careerData.pendingEvent.type === 'hangout' && careerData.pendingEvent.supportName && careerData.pendingEvent.effect && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-3 rounded border-2 border-blue-500">
                          <div className="font-bold text-blue-700 mb-2 text-lg">Special Hangout with {SUPPORT_CARDS[careerData.pendingEvent.supportName]?.name || careerData.pendingEvent.supportName}!</div>
                          <div className="font-semibold text-gray-700 mb-1">{careerData.pendingEvent.name}</div>
                          <div className="text-sm text-gray-600 mb-3">
                            {careerData.pendingEvent.description}
                          </div>
                        </div>
                        <button
                          onClick={() => resolveEvent({ effect: careerData.pendingEvent.effect, flavor: careerData.pendingEvent.flavor })}
                          className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                          Spend Time Together
                        </button>
                      </div>
                    )}
                    
                    {careerData.pendingEvent.type === 'negative' && (
                      <div className="space-y-3">
                        <div className="bg-red-50 p-3 rounded border-2 border-red-500">
                          <div className="font-bold text-red-700 mb-2">Negative Effect:</div>
                          {careerData.pendingEvent.effect.stats && (
                            <div className="text-sm text-gray-600">
                              Stat changes: {Object.entries(careerData.pendingEvent.effect.stats).map(([stat, val]) => `${stat}: ${val}`).join(', ')}
                            </div>
                          )}
                          {careerData.pendingEvent.effect.energy && (
                            <div className="text-sm text-gray-600">
                              Energy: {careerData.pendingEvent.effect.energy}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => resolveEvent(careerData.pendingEvent.effect)}
                          className="w-full bg-gray-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {careerData.eventResult && (
                <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-2 sm:p-4 shadow-lg mb-3 sm:mb-4">
                  <div className="bg-white rounded-lg p-2 sm:p-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-green-600">Event Result</h3>
                    
                    {/* Flavor Text */}
                    {careerData.eventResult.flavor && (
                      <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-3 mb-4">
                        <p className="text-base sm:text-lg italic text-gray-700 text-center">
                          &ldquo;{careerData.eventResult.flavor}&rdquo;
                        </p>
                      </div>
                    )}
                    
                    {(Object.keys(careerData.eventResult.stats).length > 0 || careerData.eventResult.energy !== 0 || careerData.eventResult.skillPoints !== 0) && (
                      <div className="space-y-3">
                        {Object.keys(careerData.eventResult.stats).length > 0 && (
                          <div className={`p-3 rounded border-2 ${
                            Object.values(careerData.eventResult.stats).some(v => v < 0) ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
                          }`}>
                            <div className="font-bold mb-2 text-center">Stat Changes:</div>
                            <div className="flex justify-center">
                              <div className="grid grid-cols-5 gap-2 text-sm max-w-md">
                                {Object.entries(careerData.eventResult.stats).map(([stat, value]) => (
                                  <div key={stat} className="text-center">
                                    <div className="text-gray-600">{stat}</div>
                                    <div className={`font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {value >= 0 ? '+' : ''}{value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {careerData.eventResult.energy !== 0 && (
                          <div className={`p-3 rounded border-2 ${
                            careerData.eventResult.energy >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                          }`}>
                            <div className="font-bold text-center">
                              Energy: <span className={careerData.eventResult.energy >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {careerData.eventResult.energy >= 0 ? '+' : ''}{careerData.eventResult.energy}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {careerData.eventResult.skillPoints !== 0 && (
                          <div className={`p-3 rounded border-2 ${
                            careerData.eventResult.skillPoints >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                          }`}>
                            <div className="font-bold text-center">
                              Skill Points: <span className={careerData.eventResult.skillPoints >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {careerData.eventResult.skillPoints >= 0 ? '+' : ''}{careerData.eventResult.skillPoints}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {Object.keys(careerData.eventResult.friendship).length > 0 && (
                          <div className="bg-blue-50 p-3 rounded border-2 border-blue-500">
                            <div className="font-bold mb-2">Friendship Gained:</div>
                            {Object.entries(careerData.eventResult.friendship).map(([support, value]) => (
                              <div key={support} className="text-sm">
                                <span className="font-bold">{support}:</span> <span className="text-blue-600">+{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {careerData.eventResult.moveHint && (
                          <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-500">
                            <div className="font-bold text-yellow-700">ðŸ’¡ New Move Unlocked!</div>
                            <div className="text-sm mt-1">You can now learn: <span className="font-bold">{careerData.eventResult.moveHint}</span></div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => setCareerData(prev => ({ 
                        ...prev, 
                        eventResult: null,
                        currentTrainingOptions: generateTrainingOptions()
                      }))}
                      className="w-full mt-4 bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {viewMode === 'abilities' && (
                <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="font-bold text-sm sm:text-base">Known Abilities</h3>
                    <button onClick={() => setViewMode('training')} className="text-xs sm:text-sm text-purple-600 hover:underline">
                      Back
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                    {careerData.knownAbilities
                      .sort((a, b) => {
                        const moveA = MOVES[a];
                        const moveB = MOVES[b];
                        return moveA.type.localeCompare(moveB.type);
                      })
                      .map(moveName => {
                      const move = MOVES[moveName];
                      return (
                        <div key={moveName} className="border-2 bg-green-50 rounded p-1.5 sm:p-2" style={{ borderColor: getTypeColor(move.type) }}>
                          <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                            <div className="font-bold text-xs sm:text-sm truncate pr-1">{moveName}</div>
                            <div className="text-[10px] sm:text-xs px-0.5 sm:px-1 rounded font-bold flex-shrink-0 text-white" style={{ backgroundColor: getTypeColor(move.type) }}>
                              {move.type}
                            </div>
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5">
                            <div>DMG: {move.damage}</div>
                            <div>Stam: {move.stamina} | WU: {move.warmup} | CD: {move.cooldown}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              setCareerData(prev => {
                                // Remove from known abilities
                                const newKnownAbilities = prev.knownAbilities.filter(m => m !== moveName);
                                
                                // Add to learnable abilities if not already there
                                const newLearnableAbilities = [...prev.pokemon.learnableAbilities];
                                if (!newLearnableAbilities.includes(moveName)) {
                                  newLearnableAbilities.push(moveName);
                                }
                                
                                return {
                                  ...prev,
                                  knownAbilities: newKnownAbilities,
                                  pokemon: {
                                    ...prev.pokemon,
                                    learnableAbilities: newLearnableAbilities
                                  }
                                };
                              });
                            }}
                            className="w-full mt-1 bg-red-500 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 rounded hover:bg-red-600 cursor-pointer"
                          >
                            Forget
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'gym' && (
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Next Gym Leader</h3>
                    <button onClick={() => setViewMode('training')} className="text-sm text-purple-600 hover:underline">
                      Back to Training
                    </button>
                  </div>
                  {nextGymLeader && (
                    <div className="border-2 border-yellow-500 rounded-lg p-3">
                      <div className="flex items-center gap-2 sm:p-4 mb-3">
                        {generateTrainerSprite(careerData.currentGymIndex + 1)}
                        <div>
                          <h4 className="text-lg font-bold">{nextGymLeader.name}</h4>
                          <p className="text-sm text-gray-600">
                            {nextGymLeader.pokemon} (
                            <span style={{ color: getTypeColor(nextGymLeader.type), fontWeight: 'bold' }}>
                              {nextGymLeader.type}
                            </span>
                            )
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Strategy: {nextGymLeader.strategy} ({nextGymLeader.strategyGrade})</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2 text-sm mb-3">
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">HP</div>
                          <div className="font-bold">{nextGymLeader.stats.HP}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">ATK</div>
                          <div className="font-bold">{nextGymLeader.stats.Attack}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">DEF</div>
                          <div className="font-bold">{nextGymLeader.stats.Defense}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">INS</div>
                          <div className="font-bold">{nextGymLeader.stats.Instinct}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">SPE</div>
                          <div className="font-bold">{nextGymLeader.stats.Speed}</div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="font-bold text-sm mb-2">Abilities:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {nextGymLeader.abilities.map(moveName => {
                            const move = MOVES[moveName];
                            return (
                              <div key={moveName} className="border rounded p-2 bg-gray-50">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-bold text-xs">{moveName}</div>
                                  <div className="text-xs px-1 rounded font-bold" style={{ backgroundColor: getTypeColor(move.type) + '20', color: getTypeColor(move.type) }}>
                                    {move.type}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 space-y-0.5">
                                  <div>DMG: {move.damage}</div>
                                  <div>Stamina: {move.stamina}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'learn' && (
                <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
                    <h3 className="font-bold text-sm sm:text-base">Learn Abilities ({careerData.skillPoints} SP)</h3>
                    <button onClick={() => setViewMode('training')} className="text-xs sm:text-sm text-purple-600 hover:underline self-start sm:self-auto">
                      Back
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                    {careerData.pokemon.learnableAbilities
                      .filter(moveName => {
                        if (!MOVES[moveName]) {
                          console.error(`[Learn Screen] Move not found: ${moveName}`);
                          return false;
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        try {
                          const moveA = MOVES[a];
                          const moveB = MOVES[b];
                          if (!moveA || !moveB) {
                            console.error('[Learn Screen] Missing move data:', { a, moveA, b, moveB });
                            return 0;
                          }
                          return (moveA.type || '').localeCompare(moveB.type || '');
                        } catch (error) {
                          console.error('[Learn Screen] Sort error:', error, { a, b });
                          return 0;
                        }
                      })
                      .map(moveName => {
                        try {
                          const move = MOVES[moveName];
                          if (!move) {
                            console.error(`[Learn Screen] Move data missing for: ${moveName}`);
                            return null;
                          }
                          
                          const isKnown = careerData.knownAbilities.includes(moveName);
                          const hintsReceived = careerData.moveHints[moveName] || 0;
                          const discount = Math.min(hintsReceived * GAME_CONFIG.MOVES.HINT_DISCOUNT, GAME_CONFIG.MOVES.MAX_HINT_DISCOUNT);
                          const finalCost = Math.ceil(move.cost * (1 - discount));
                          const canAfford = careerData.skillPoints >= finalCost;
                          
                          return (
                            <div key={moveName} className={`border-2 rounded p-1.5 sm:p-2 ${isKnown ? 'bg-green-50' : ''}`} style={{ borderColor: isKnown ? '#22c55e' : getTypeColor(move.type) }}>
                              <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                                <div className="font-bold text-xs sm:text-sm truncate pr-1">{moveName}</div>
                                <div className="text-[10px] sm:text-xs px-0.5 sm:px-1 rounded font-bold flex-shrink-0 text-white" style={{ backgroundColor: getTypeColor(move.type) }}>
                                  {move.type}
                                </div>
                              </div>
                              <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 mb-1 sm:mb-2">
                                <div>DMG: {move.damage}</div>
                                <div>Stam: {move.stamina} | WU: {move.warmup} | CD: {move.cooldown}</div>
                                {move.effect && (
                                  <div className="text-purple-600 font-bold truncate">
                                    {move.effect.type === 'burn' && `Burn ${Math.round(move.effect.chance * 100)}%`}
                                    {move.effect.type === 'poison' && `Poison ${Math.round(move.effect.chance * 100)}%`}
                                    {move.effect.type === 'paralyze' && `Paralyze ${Math.round(move.effect.chance * 100)}%`}
                                    {move.effect.type === 'stun' && `Stun ${Math.round(move.effect.chance * 100)}%`}
                                    {move.effect.type === 'soak' && `Soak ${Math.round(move.effect.chance * 100)}%`}
                                    {move.effect.type === 'energize' && `Energize ${Math.round(move.effect.chance * 100)}%`}
                                    {move.effect.type === 'exhaust' && `Self-Exhaust`}
                                  </div>
                                )}
                              </div>
                              {!isKnown && (
                                <>
                                  {discount > 0 && (
                                    <div className="text-[10px] sm:text-xs text-green-600 font-bold mb-0.5 sm:mb-1">
                                      -{Math.round(discount * 100)}% off!
                                    </div>
                                  )}
                                  <button
                                    onClick={() => learnMove(moveName)}
                                    disabled={!canAfford}
                                    className={`w-full py-1 rounded text-[10px] sm:text-xs font-bold ${
                                      canAfford ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    Learn ({finalCost} SP)
                                  </button>
                                </>
                              )}
                              {isKnown && <div className="text-center text-green-600 font-bold text-[10px] sm:text-xs">Learned</div>}
                            </div>
                          );
                        } catch (error) {
                          console.error('[Learn Screen] Render error for move:', moveName, error);
                          return null;
                        }
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'training' && careerData.currentTrainingOptions && !careerData.pendingEvent && !careerData.eventResult && !isGymTurn && !inspirationModal && (
                <>
                  <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm sm:text-base">Training</h3>
                      <div className="flex gap-1 sm:gap-2 flex-wrap">
                        <button
                          onClick={performRest}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          Rest
                        </button>
                        <button
                          onClick={() => setViewMode('battle')}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          Battle
                        </button>
                        <button
                          onClick={() => setViewMode('log')}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-700 transition text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 sm:gap-2">
                      {Object.keys(careerData.currentTrainingOptions).map(stat => {
                        const option = careerData.currentTrainingOptions[stat];
                        const energyCost = GAME_CONFIG.TRAINING.ENERGY_COSTS[stat];
                        
                        // Calculate fail chance based on CURRENT energy and stat type
                        const failChance = calculateFailChance(careerData.energy, stat);
                        
                        let statGain = GAME_CONFIG.TRAINING.BASE_STAT_GAINS[stat];
                        option.supports.forEach(supportName => {
                          const support = getSupportCardAttributes(supportName);
                          if (!support) return;
                          
                          const friendship = careerData.supportFriendships[supportName];
                          const isMaxFriendship = friendship >= 100;
                          const supportType = support.type || support.supportType;
                          
                          if (supportType === stat) {
                            statGain += isMaxFriendship ? support.friendshipBonusTraining : support.typeBonusTraining;
                          } else {
                            statGain += support.generalBonusTraining;
                          }
                        });
                        
                        const currentStatValue = careerData.currentStats[stat];
                        
                        return (
                          <button
                            key={stat}
                            onClick={() => performTraining(stat)}
                            className="border-2 rounded p-1 sm:p-2 text-left transition border-purple-500 hover:bg-purple-50 cursor-pointer"
                          >
                            <div className="font-bold text-[10px] sm:text-sm mb-0.5 sm:mb-1">{stat}</div>
                            <div className="text-[9px] sm:text-xs mb-0.5 sm:mb-1">
                              <span className="text-gray-600">{currentStatValue}</span>
                              <span className="text-green-600 font-bold"> +{statGain}</span>
                            </div>
                            <div className="text-[9px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">
                              {energyCost > 0 ? `-${energyCost}` : `+${Math.abs(energyCost)}`} Energy
                            </div>
                            <div className="text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1" style={{ color: failChance === 0 ? '#16a34a' : failChance <= 25 ? '#eab308' : '#ef4444' }}>
                              Fail: {failChance}%
                            </div>
                            {option.supports.length > 0 && (
                              <div className="space-y-0.5">
                                {option.supports.map(supportName => {
                                  const friendship = careerData.supportFriendships[supportName];
                                  return (
                                    <div key={supportName} className="bg-blue-100 text-blue-800 text-[8px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded">
                                      <div className="font-bold truncate">{supportName.split(' ')[0]}</div>
                                      <div className="flex items-center gap-0.5 sm:gap-1">
                                        <div className="flex-1 bg-blue-200 rounded h-1 min-w-0">
                                          <div className="bg-blue-600 h-1 rounded" style={{ width: `${friendship}%` }} />
                                        </div>
                                        <span className="text-[8px] sm:text-xs">{friendship}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {option.hint && (
                              <div className="bg-yellow-200 text-yellow-800 text-[8px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded mt-0.5 sm:mt-1 truncate">
                                ðŸ’¡ {option.hint.move}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {careerData.turnLog.length > 0 && (
                    <div className="bg-white rounded-lg p-3 shadow-lg">
                      <h3 className="font-bold text-sm mb-2">Last Turn Result</h3>
                      {(() => {
                        const entry = careerData.turnLog[0];
                        return (
                          <div 
                            className={`p-2 rounded text-sm ${
                              entry.type === 'training_success' ? 'bg-green-50 border-l-4 border-green-500' :
                              entry.type === 'training_fail' ? 'bg-red-50 border-l-4 border-red-500' :
                              entry.type === 'battle_victory' || entry.type === 'gym_victory' ? 'bg-blue-50 border-l-4 border-blue-500' :
                              entry.type === 'battle_loss' ? 'bg-orange-50 border-l-4 border-orange-500' :
                              'bg-gray-50 border-l-4 border-gray-500'
                            }`}
                          >
                            <div className="font-bold text-xs text-gray-500 mb-1">Turn {entry.turn}</div>
                            <div className="text-gray-800">{entry.message}</div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {viewMode === 'battle' && (
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Wild Battles</h3>
                    <button onClick={() => setViewMode('training')} className="text-sm text-purple-600 hover:underline">
                      Back to Training
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {careerData.availableBattles.map((opponent, idx) => (
                      <div key={idx} className="border-2 border-red-500 rounded-lg p-2 bg-red-50">
                        <div className="mb-2">
                          <div className="font-bold text-sm mb-1">{opponent.name}</div>
                          <div className="text-xs text-gray-600">
                            <span style={{ color: getTypeColor(opponent.primaryType), fontWeight: 'bold' }}>
                              {opponent.primaryType}
                            </span>
                            {' | ' + opponent.strategy + ' (' + opponent.strategyGrade + ')'}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                          <div className="bg-white rounded p-1">
                            <div className="text-gray-500">HP</div>
                            <div className="font-bold">{opponent.stats.HP}</div>
                          </div>
                          <div className="bg-white rounded p-1">
                            <div className="text-gray-500">ATK</div>
                            <div className="font-bold">{opponent.stats.Attack}</div>
                          </div>
                          <div className="bg-white rounded p-1">
                            <div className="text-gray-500">DEF</div>
                            <div className="font-bold">{opponent.stats.Defense}</div>
                          </div>
                          <div className="bg-white rounded p-1">
                            <div className="text-gray-500">INS</div>
                            <div className="font-bold">{opponent.stats.Instinct}</div>
                          </div>
                          <div className="bg-white rounded p-1">
                            <div className="text-gray-500">SPE</div>
                            <div className="font-bold">{opponent.stats.Speed}</div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="font-bold text-xs mb-1">Abilities:</div>
                          <div className="space-y-1">
                            {opponent.abilities.map(moveName => {
                              const move = MOVES[moveName];
                              return (
                                <div key={moveName} className="bg-white rounded p-1 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold">{moveName}</span>
                                    <span className="px-1 rounded text-xs" style={{ backgroundColor: getTypeColor(move.type) + '20', color: getTypeColor(move.type), fontWeight: 'bold' }}>
                                      {move.type}
                                    </span>
                                  </div>
                                  <div className="text-gray-600">DMG: {move.damage}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => startBattle(opponent, false)}
                          disabled={careerData.energy <= 0}
                          className={`w-full rounded py-2 transition font-bold text-sm ${
                            careerData.energy <= 0 
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {careerData.energy <= 0 ? 'Need Energy!' : 'Battle!'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'log' && (
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Turn Log</h3>
                    <button onClick={() => setViewMode('training')} className="text-sm text-purple-600 hover:underline">
                      Back to Training
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                    {careerData.turnLog.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No actions yet. Start training!</p>
                    ) : (
                      careerData.turnLog.map((entry, idx) => (
                        <div 
                          key={idx} 
                          className={`p-2 rounded text-sm ${
                            entry.type === 'training_success' ? 'bg-green-50 border-l-4 border-green-500' :
                            entry.type === 'training_fail' ? 'bg-red-50 border-l-4 border-red-500' :
                            entry.type === 'battle_victory' || entry.type === 'gym_victory' ? 'bg-blue-50 border-l-4 border-blue-500' :
                            entry.type === 'battle_loss' ? 'bg-orange-50 border-l-4 border-orange-500' :
                            'bg-gray-50 border-l-4 border-gray-500'
                          }`}
                        >
                          <div className="font-bold text-xs text-gray-500 mb-1">Turn {entry.turn}</div>
                          <div className="text-gray-800">{entry.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <EvolutionModal />
      <InspirationModal />
      <PokeclockModal />
      <HelpModal />
      </>
    );
  }

  if (gameState === 'battle' && battleState) {
    const playerPct = (battleState.player.currentHP / battleState.player.stats.HP) * 100;
    const opponentPct = (battleState.opponent.currentHP / battleState.opponent.stats.HP) * 100;
    const battleOver = battleState.player.currentHP <= 0 || battleState.opponent.currentHP <= 0;

    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-700 rounded-lg p-2 sm:p-4 mb-3 sm:mb-4 shadow-2xl">
            <div className="grid grid-cols-2 gap-4 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 sm:p-4">
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                    {generatePokemonSprite(battleState.player.primaryType, battleState.player.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white">{battleState.player.name}</h3>
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: getGradeColor(getPokemonGrade(battleState.player.stats)) }}
                      >
                        {getPokemonGrade(battleState.player.stats)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 mb-2">
                      <span style={{ color: getTypeColor(battleState.player.primaryType), fontWeight: 'bold' }}>
                        {battleState.player.primaryType}
                      </span>
                      {' | ' + battleState.player.strategy}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-300">
                      <div>HP: {battleState.player.stats.HP}</div>
                      <div>ATK: {battleState.player.stats.Attack}</div>
                      <div>DEF: {battleState.player.stats.Defense}</div>
                      <div>INS: {battleState.player.stats.Instinct}</div>
                      <div>SPE: {battleState.player.stats.Speed}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>HP</span>
                    <span>{battleState.player.currentHP}/{battleState.player.stats.HP}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded h-3">
                    <div className="bg-green-500 h-3 rounded transition-all" style={{ width: `${playerPct}%` }} />
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>Stamina {battleState.player.isResting && <span className="text-blue-400">{ICONS.SLEEPING}</span>}</span>
                    <span>{battleState.player.currentStamina}/100</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded h-2">
                    <div className="bg-yellow-500 h-2 rounded transition-all" style={{ width: `${battleState.player.currentStamina}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 sm:p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white text-right">{getBattleDisplayName(battleState.opponent)}</h3>
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: getGradeColor(getPokemonGrade(battleState.opponent.stats)) }}
                      >
                        {getPokemonGrade(battleState.opponent.stats)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 mb-2 text-right">
                      <span style={{ color: getTypeColor(battleState.opponent.primaryType), fontWeight: 'bold' }}>
                        {battleState.opponent.primaryType}
                      </span>
                      {' | ' + battleState.opponent.strategy}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-gray-300 text-right">
                      <div>HP: {battleState.opponent.stats.HP}</div>
                      <div>ATK: {battleState.opponent.stats.Attack}</div>
                      <div>DEF: {battleState.opponent.stats.Defense}</div>
                      <div>INS: {battleState.opponent.stats.Instinct}</div>
                      <div>SPE: {battleState.opponent.stats.Speed}</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                    {generatePokemonSprite(battleState.opponent.primaryType, getBattleDisplayName(battleState.opponent))}
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>HP</span>
                    <span>{battleState.opponent.currentHP}/{battleState.opponent.stats.HP}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded h-3">
                    <div className="bg-red-500 h-3 rounded transition-all" style={{ width: `${opponentPct}%` }} />
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>Stamina {battleState.opponent.isResting && <span className="text-blue-400">{ICONS.SLEEPING}</span>}</span>
                    <span>{battleState.opponent.currentStamina}/100</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded h-2">
                    <div className="bg-yellow-500 h-2 rounded transition-all" style={{ width: `${battleState.opponent.currentStamina}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-white mt-4 py-2 bg-gray-800 rounded flex items-center justify-center gap-4">
              <div>
                <Clock className="inline mr-2" size={16} />
                <span className="text-lg font-bold">Tick: {battleState.tick}</span>
                {battleOver && <span className="ml-4 text-yellow-400">Battle Complete!</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBattleSpeed(1)}
                  className={`px-3 py-1 rounded font-bold text-sm transition ${
                    battleSpeed === 1 ? 'bg-green-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  1x
                </button>
                <button
                  onClick={() => setBattleSpeed(2)}
                  className={`px-3 py-1 rounded font-bold text-sm transition ${
                    battleSpeed === 2 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  2x
                </button>
                <button
                  onClick={() => setBattleSpeed(4)}
                  className={`px-3 py-1 rounded font-bold text-sm transition ${
                    battleSpeed === 4 ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                >
                  4x
                </button>
              </div>
            </div>
          </div>

          <div ref={battleLogRef} className="bg-white rounded-lg p-2 sm:p-4 shadow-lg" style={{ height: '400px', overflowY: 'auto' }}>
            <h3 className="text-lg font-bold mb-3 sticky top-0 bg-white pb-2">Battle Log</h3>
            <div className="space-y-1">
              {battleState.log.slice(-30).map((entry, idx) => (
                <div 
                  key={idx} 
                  className={`py-1 border-b border-gray-100 ${
                    entry.type === 'crit' ? 'text-xl sm:text-2xl font-black text-red-600' :
                    entry.type === 'hit' ? 'text-base font-mono text-red-600 font-bold' :
                    entry.type === 'miss' ? 'text-base font-mono text-blue-600 font-bold' :
                    entry.type === 'victory' ? 'text-base font-mono text-green-600 font-bold' :
                    entry.type === 'defeat' ? 'text-base font-mono text-orange-600 font-bold' :
                    'text-base font-mono text-gray-700'
                  }`}
                >
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'victory' && careerData) {
    // Get the most recent trained pokemon (just added)
    const completedPokemon = trainedPokemon[trainedPokemon.length - 1];
    
    return (
      <div className="w-full h-screen bg-gradient-to-b from-yellow-400 to-orange-500 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-4">
          <Trophy className="mx-auto mb-3 text-yellow-500" size={60} />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-800 text-center">CHAMPION!</h1>
          <p className="text-gray-600 mb-4 text-center">You defeated all gym leaders!</p>
          
          {completedPokemon && (
            <>
              {/* Pokemon Display */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-4">
                <div className="flex justify-center mb-2">
                  {generatePokemonSprite(completedPokemon.type, completedPokemon.name)}
                </div>
                <h2 className="text-2xl font-bold text-center mb-1">{completedPokemon.name}</h2>
                <p className="text-center text-sm mb-2" style={{ color: getTypeColor(completedPokemon.type), fontWeight: 'bold' }}>
                  {completedPokemon.type}
                </p>
                <div className="text-center mb-3">
                  <span className="px-3 py-1 rounded text-sm font-bold text-white" style={{ backgroundColor: getGradeColor(completedPokemon.grade) }}>
                    Grade: {completedPokemon.grade}
                  </span>
                </div>
                
                {/* Final Stats */}
                <div className="mb-4">
                  <h3 className="font-bold mb-2 text-center">Final Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    {Object.entries(completedPokemon.stats).map(([stat, value]) => (
                      <div key={stat} className="flex items-center gap-1 justify-center">
                        <StatIcon stat={stat} size={14} />
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Aptitudes */}
                {completedPokemon.aptitudes && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2 text-center text-sm">Attack Aptitudes</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {Object.entries(completedPokemon.aptitudes).map(([aptitude, grade]) => {
                        const typeMap = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' };
                        return (
                        <div key={aptitude} className="text-center">
                          <div className="font-semibold">{typeMap[aptitude] || aptitude}</div>
                          <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(grade) }}>
                            {grade}
                          </span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Inspirations */}
              {completedPokemon.inspirations && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold mb-3 text-center text-purple-800">ÃƒÂ¢Ã…â€œÃ‚Â¨ Inspirations Earned ÃƒÂ¢Ã…â€œÃ‚Â¨</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Stat Inspiration */}
                    <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                      <div className="text-xs font-semibold text-purple-600 mb-1">STAT INSPIRATION</div>
                      <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.stat.name}</div>
                      <div className="text-sm text-gray-600 mb-2">Value: {completedPokemon.inspirations.stat.value}</div>
                      <div className="flex gap-1">
                        {[...Array(completedPokemon.inspirations.stat.stars)].map((_, i) => (
                          <span key={i} className="text-xl text-yellow-400">
                            â˜…
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Aptitude Inspiration */}
                    <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                      <div className="text-xs font-semibold text-purple-600 mb-1">APTITUDE INSPIRATION</div>
                      <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.aptitude.name}</div>
                      <div className="text-sm text-gray-600 mb-2">Grade: {completedPokemon.inspirations.aptitude.grade}</div>
                      <div className="flex gap-1">
                        {[...Array(completedPokemon.inspirations.aptitude.stars)].map((_, i) => (
                          <span key={i} className="text-xl text-yellow-400">
                            â˜…
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <button
            onClick={() => {
              setGameState('menu');
              setSelectedPokemon(null);
              setSelectedSupports([]);
              setCareerData(null);
            }}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver' && careerData) {
    // Get the most recent trained pokemon (just added)
    const completedPokemon = trainedPokemon[trainedPokemon.length - 1];
    
    return (
      <div className="w-full h-screen bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-red-600 text-center">Career Complete</h1>
          <p className="text-gray-600 mb-4 text-center">Defeated by gym leader</p>
          
          {completedPokemon && (
            <>
              {/* Pokemon Display */}
              <div className="bg-gradient-to-br from-gray-50 to-red-50 rounded-lg p-4 mb-4">
                <div className="flex justify-center mb-2">
                  {generatePokemonSprite(completedPokemon.type, completedPokemon.name)}
                </div>
                <h2 className="text-2xl font-bold text-center mb-1">{completedPokemon.name}</h2>
                <p className="text-center text-sm mb-2" style={{ color: getTypeColor(completedPokemon.type), fontWeight: 'bold' }}>
                  {completedPokemon.type}
                </p>
                <div className="text-center mb-3">
                  <span className="px-3 py-1 rounded text-sm font-bold text-white" style={{ backgroundColor: getGradeColor(completedPokemon.grade) }}>
                    Grade: {completedPokemon.grade}
                  </span>
                </div>
                
                {/* Final Stats */}
                <div className="mb-4">
                  <h3 className="font-bold mb-2 text-center">Final Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    {Object.entries(completedPokemon.stats).map(([stat, value]) => (
                      <div key={stat} className="flex items-center gap-1 justify-center">
                        <StatIcon stat={stat} size={14} />
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Aptitudes */}
                {completedPokemon.aptitudes && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2 text-center text-sm">Attack Aptitudes</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {Object.entries(completedPokemon.aptitudes).map(([aptitude, grade]) => {
                        const typeMap = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' };
                        return (
                        <div key={aptitude} className="text-center">
                          <div className="font-semibold">{typeMap[aptitude] || aptitude}</div>
                          <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(grade) }}>
                            {grade}
                          </span>
                        </div>
                      )})}

                    </div>
                  </div>
                )}
              </div>
              
              {/* Inspirations */}
              {completedPokemon.inspirations && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold mb-3 text-center text-purple-800">ÃƒÂ¢Ã…â€œÃ‚Â¨ Inspirations Earned ÃƒÂ¢Ã…â€œÃ‚Â¨</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Stat Inspiration */}
                    <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                      <div className="text-xs font-semibold text-purple-600 mb-1">STAT INSPIRATION</div>
                      <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.stat.name}</div>
                      <div className="text-sm text-gray-600 mb-2">Value: {completedPokemon.inspirations.stat.value}</div>
                      <div className="flex gap-1">
                        {[...Array(completedPokemon.inspirations.stat.stars)].map((_, i) => (
                          <span key={i} className="text-xl text-yellow-400">
                            â˜…
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Aptitude Inspiration */}
                    <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                      <div className="text-xs font-semibold text-purple-600 mb-1">APTITUDE INSPIRATION</div>
                      <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.aptitude.name}</div>
                      <div className="text-sm text-gray-600 mb-2">Grade: {completedPokemon.inspirations.aptitude.grade}</div>
                      <div className="flex gap-1">
                        {[...Array(completedPokemon.inspirations.aptitude.stars)].map((_, i) => (
                          <span key={i} className="text-xl text-yellow-400">
                            â˜…
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <button
            onClick={() => {
              setGameState('menu');
              setSelectedPokemon(null);
              setSelectedSupports([]);
              setCareerData(null);
            }}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'careerEnd') {
    // Get the most recent trained pokemon (just added)
    const completedPokemon = trainedPokemon[trainedPokemon.length - 1];
    
    return (
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-lg p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-800 text-center">Career Complete</h1>
          <p className="text-gray-600 mb-4 text-center">Completed all 60 turns!</p>
          
          {completedPokemon && (
            <>
              {/* Pokemon Display */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                <div className="flex justify-center mb-2">
                  {generatePokemonSprite(completedPokemon.type, completedPokemon.name)}
                </div>
                <h2 className="text-2xl font-bold text-center mb-1">{completedPokemon.name}</h2>
                <p className="text-center text-sm mb-2" style={{ color: getTypeColor(completedPokemon.type), fontWeight: 'bold' }}>
                  {completedPokemon.type}
                </p>
                <div className="text-center mb-3">
                  <span className="px-3 py-1 rounded text-sm font-bold text-white" style={{ backgroundColor: getGradeColor(completedPokemon.grade) }}>
                    Grade: {completedPokemon.grade}
                  </span>
                </div>
                
                {/* Final Stats */}
                <div className="mb-4">
                  <h3 className="font-bold mb-2 text-center">Final Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    {Object.entries(completedPokemon.stats).map(([stat, value]) => (
                      <div key={stat} className="flex items-center gap-1 justify-center">
                        <StatIcon stat={stat} size={14} />
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Aptitudes */}
                {completedPokemon.aptitudes && (
                  <div className="mb-4">
                    <h3 className="font-bold mb-2 text-center text-sm">Attack Aptitudes</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {Object.entries(completedPokemon.aptitudes).map(([aptitude, grade]) => {
                        const typeMap = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' };
                        return (
                        <div key={aptitude} className="text-center">
                          <div className="font-semibold">{typeMap[aptitude] || aptitude}</div>
                          <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(grade) }}>
                            {grade}
                          </span>
                        </div>
                      )})}

                    </div>
                  </div>
                )}
              </div>
              
              {/* Inspirations */}
              {completedPokemon.inspirations && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h3 className="font-bold mb-3 text-center text-purple-800">ÃƒÂ¢Ã…â€œÃ‚Â¨ Inspirations Earned ÃƒÂ¢Ã…â€œÃ‚Â¨</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Stat Inspiration */}
                    <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                      <div className="text-xs font-semibold text-purple-600 mb-1">STAT INSPIRATION</div>
                      <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.stat.name}</div>
                      <div className="text-sm text-gray-600 mb-2">Value: {completedPokemon.inspirations.stat.value}</div>
                      <div className="flex gap-1">
                        {[...Array(completedPokemon.inspirations.stat.stars)].map((_, i) => (
                          <span key={i} className="text-xl text-yellow-400">
                            â˜…
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Aptitude Inspiration */}
                    <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                      <div className="text-xs font-semibold text-purple-600 mb-1">APTITUDE INSPIRATION</div>
                      <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.aptitude.name}</div>
                      <div className="text-sm text-gray-600 mb-2">Grade: {completedPokemon.inspirations.aptitude.grade}</div>
                      <div className="flex gap-1">
                        {[...Array(completedPokemon.inspirations.aptitude.stars)].map((_, i) => (
                          <span key={i} className="text-xl text-yellow-400">
                            â˜…
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <button
            onClick={() => {
              setGameState('menu');
              setSelectedPokemon(null);
              setSelectedSupports([]);
              setCareerData(null);
            }}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthModal 
        showAuth={showAuth}
        authMode={authMode}
        authForm={authForm}
        authError={authError}
        authLoading={authLoading}
        onClose={handleAuthClose}
        onSubmit={handleAuthSubmit}
        onFormChange={handleAuthFormChange}
        onModeChange={handleAuthModeChange}
        ICONS={ICONS}
      />
      <EvolutionModal />
      <InspirationModal />
      <PokeclockModal />
      <HelpModal />
      <ResetConfirmDialog />
    </>
  );
}
