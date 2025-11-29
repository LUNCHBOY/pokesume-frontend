/**
 * TournamentReplayScreen Component
 *
 * Battle replay viewer with playback controls:
 * - Tick-by-tick battle state display using same format as BattleScreen
 * - HP and energy tracking
 * - Playback controls (play/pause, restart, speed adjustment)
 * - Progress slider
 * - Matches visual style of career mode battles
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { GAME_CONFIG } from '../shared/gameData';
import { generatePokemonSprite } from '../utils/gameUtils';

const TournamentReplayScreen = () => {
  const { setGameState, selectedReplay, setSelectedReplay } = useGame();

  // Helper to safely parse battle_results (can be string or object from DB)
  const parseBattleResults = (battle_results) => {
    if (!battle_results) return null;
    if (typeof battle_results === 'object') return battle_results;
    try {
      return JSON.parse(battle_results);
    } catch (e) {
      console.error('Failed to parse battle_results:', e);
      return null;
    }
  };

  const battleResults = parseBattleResults(selectedReplay?.battle_results);

  const [replayTick, setReplayTick] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedBattleIndex, setSelectedBattleIndex] = useState(0);

  // Handle both old single-battle format and new 3v3 format
  const is3v3Format = battleResults?.battles && Array.isArray(battleResults.battles);
  const currentBattle = is3v3Format
    ? battleResults.battles[selectedBattleIndex]
    : battleResults;

  const battleLog = currentBattle?.battleLog || [];
  const maxTicks = battleLog.length;
  const battleLogRef = useRef(null);

  // Auto-scroll battle log to bottom when new ticks appear
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [replayTick]);

  useEffect(() => {
    if (!isPlaying || replayTick >= maxTicks - 1) return;

    const timer = setTimeout(() => {
      setReplayTick(prev => Math.min(prev + 1, maxTicks - 1));
    }, GAME_CONFIG.BATTLE.TICK_DURATION_MS / replaySpeed);

    return () => clearTimeout(timer);
  }, [replayTick, isPlaying, maxTicks, replaySpeed]);

  const handleBack = () => {
    setSelectedReplay(null);
    setGameState('tournamentBracket');
  };

  if (!battleResults || (!battleResults.battleLog && !is3v3Format)) {
    return (
      <div className="min-h-screen bg-pocket-bg p-4">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-lg mx-auto"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-pocket-text">Battle Replay</span>
            <div className="w-10" />
          </div>
        </motion.header>

        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <p className="text-pocket-text mb-4">Battle data not available</p>
            <button onClick={handleBack} className="pocket-btn-purple px-6 py-2">
              Back to Bracket
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentState = battleLog[replayTick] || battleLog[0];
  const battleOver = replayTick >= maxTicks - 1;

  // Build display log up to current tick
  const displayLog = battleLog.slice(0, replayTick + 1)
    .filter(entry => entry.message)
    .map((entry, idx) => {
      const message = entry.message;
      let type = 'normal';

      if (message.includes('CRITICAL HIT')) type = 'crit';
      else if (message.includes('Victory!')) type = 'victory';
      else if (message.includes('defeated')) type = 'defeat';
      else if (message.includes('damage')) type = 'hit';
      else if (message.includes('missed')) type = 'miss';

      return {
        text: message,
        type,
        tick: idx
      };
    });

  const player1Pct = ((currentState.player1?.currentHp || 0) / (currentState.player1?.maxHp || 1)) * 100;
  const player2Pct = ((currentState.player2?.currentHp || 0) / (currentState.player2?.maxHp || 1)) * 100;

  // Dynamic HP color based on percentage
  const getHpColor = (pct) => {
    if (pct > 50) return 'bg-pocket-green'; // Green when healthy
    if (pct > 25) return 'bg-yellow-500';   // Yellow when damaged
    return 'bg-red-600';                     // Red when critical
  };

  // Get stamina value - support both energy and currentStamina properties
  const getStamina = (player) => {
    return player?.currentStamina ?? player?.energy ?? 0;
  };

  return (
    <div className="min-h-screen bg-pocket-bg p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <span className="font-bold text-pocket-text">Tournament Replay</span>
            {is3v3Format && (
              <p className="text-xs text-pocket-text-light">
                Match Score: {battleResults.player1Wins} - {battleResults.player2Wins}
              </p>
            )}
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Battle selector for 3v3 matches */}
        {is3v3Format && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-4"
          >
            <div className="flex gap-2 justify-center">
              {battleResults.battles.map((battle, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedBattleIndex(index);
                    setReplayTick(0);
                    setIsPlaying(true);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                    selectedBattleIndex === index
                      ? 'bg-type-psychic text-white'
                      : 'bg-pocket-bg text-pocket-text hover:bg-gray-200'
                  }`}
                >
                  Battle {index + 1} {battle.winner === 1 ? '✓' : '✗'}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Battle Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-pocket-bg rounded-xl">
                <div className="flex-shrink-0 w-16 h-16">
                  {generatePokemonSprite('Fire', currentState.player1?.name || 'P1')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-pocket-text truncate">{currentState.player1?.name || 'Player 1'}</h3>
                </div>
              </div>
              <div className="bg-pocket-bg rounded-xl p-3">
                <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                  <span>HP</span>
                  <span>{currentState.player1?.currentHp || 0}/{currentState.player1?.maxHp || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${getHpColor(player1Pct)} h-3 rounded-full transition-all`}
                    style={{ width: `${player1Pct}%` }}
                  />
                </div>
              </div>
              <div className="bg-pocket-bg rounded-xl p-3">
                <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                  <span>Stamina</span>
                  <span>{getStamina(currentState.player1)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${getStamina(currentState.player1)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-pocket-bg rounded-xl">
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="font-bold text-pocket-text truncate">{currentState.player2?.name || 'Player 2'}</h3>
                </div>
                <div className="flex-shrink-0 w-16 h-16">
                  {generatePokemonSprite('Water', currentState.player2?.name || 'P2')}
                </div>
              </div>
              <div className="bg-pocket-bg rounded-xl p-3">
                <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                  <span>HP</span>
                  <span>{currentState.player2?.currentHp || 0}/{currentState.player2?.maxHp || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${getHpColor(player2Pct)} h-3 rounded-full transition-all`}
                    style={{ width: `${player2Pct}%` }}
                  />
                </div>
              </div>
              <div className="bg-pocket-bg rounded-xl p-3">
                <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                  <span>Stamina</span>
                  <span>{getStamina(currentState.player2)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${getStamina(currentState.player2)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tick counter */}
          <div className="text-center mt-4 py-2 bg-pocket-bg rounded-xl flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-pocket-text-light" />
              <span className="font-bold text-pocket-text">Tick: {replayTick + 1}/{maxTicks}</span>
              {battleOver && <span className="text-amber-500 font-bold">Replay Complete!</span>}
            </div>
            <div className="flex gap-1">
              {[1, 2, 4].map(speed => (
                <button
                  key={speed}
                  onClick={() => setReplaySpeed(speed)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    replaySpeed === speed
                      ? 'bg-type-psychic text-white'
                      : 'bg-white text-pocket-text hover:bg-gray-100'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Battle Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          ref={battleLogRef}
          className="bg-white rounded-2xl shadow-card p-4"
          style={{ height: '300px', overflowY: 'auto' }}
        >
          <h3 className="font-bold text-pocket-text mb-3 sticky top-0 bg-white pb-2">Battle Log</h3>
          <div className="space-y-1">
            {displayLog.map((entry, idx) => (
              <div
                key={idx}
                className={`py-1 border-b border-pocket-bg text-sm ${
                  entry.type === 'crit' ? 'text-lg font-black text-pocket-red' :
                  entry.type === 'hit' ? 'font-mono text-pocket-red font-bold' :
                  entry.type === 'miss' ? 'font-mono text-pocket-blue font-bold' :
                  entry.type === 'victory' ? 'font-mono text-pocket-green font-bold' :
                  entry.type === 'defeat' ? 'font-mono text-amber-600 font-bold' :
                  'font-mono text-pocket-text-light'
                }`}
              >
                {entry.text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Replay Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-card p-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => {
                setReplayTick(0);
                setIsPlaying(false);
              }}
              className="p-3 bg-pocket-bg text-pocket-text rounded-xl hover:bg-gray-200 transition"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-4 bg-type-psychic text-white rounded-xl hover:bg-purple-600 transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={() => {
                setReplayTick(maxTicks - 1);
                setIsPlaying(false);
              }}
              className="p-3 bg-pocket-bg text-pocket-text rounded-xl hover:bg-gray-200 transition"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs text-pocket-text-light mb-2">
              <span>Progress: {Math.round(((replayTick + 1) / maxTicks) * 100)}%</span>
              <span>Tick {replayTick + 1} / {maxTicks}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0, maxTicks - 1)}
              value={replayTick}
              onChange={(e) => {
                setReplayTick(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-2 bg-pocket-bg rounded-full appearance-none cursor-pointer accent-type-psychic"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TournamentReplayScreen;
