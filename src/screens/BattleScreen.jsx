/**
 * BattleScreen Component
 *
 * Displays real-time battle animation between player Pokemon and opponent.
 * Shows HP bars, stamina, battle log, and playback speed controls.
 */

import React, { useRef } from 'react';
import { Clock } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  getPokemonGrade
} from '../utils/gameUtils';
import { ICONS } from '../shared/gameData';

const BattleScreen = () => {
  const { battleState, battleSpeed, setBattleSpeed } = useGame();
  const battleLogRef = useRef(null);

  if (!battleState) {
    return null;
  }

  const getBattleDisplayName = (combatant) => {
    if (combatant.isGymLeader) {
      return `${combatant.name} (Gym Leader)`;
    }
    return combatant.name;
  };

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
};

export default BattleScreen;
