/**
 * TournamentReplayScreen Component
 *
 * Battle replay viewer with playback controls:
 * - Tick-by-tick battle state display
 * - HP and energy tracking
 * - Playback controls (play/pause, restart, speed adjustment)
 * - Progress slider
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GAME_CONFIG } from '../shared/gameData';

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

  const battleLog = battleResults?.battleLog || [];
  const maxTicks = battleLog.length;

  useEffect(() => {
    if (!isPlaying || replayTick >= maxTicks - 1) return;

    const timer = setTimeout(() => {
      setReplayTick(prev => Math.min(prev + 1, maxTicks - 1));
    }, GAME_CONFIG.BATTLE.TICK_DURATION_MS / replaySpeed);

    return () => clearTimeout(timer);
  }, [replayTick, isPlaying, maxTicks, replaySpeed]);

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

export default TournamentReplayScreen;
