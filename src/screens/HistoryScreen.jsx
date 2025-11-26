/**
 * HistoryScreen Component
 *
 * Displays the user's career history showing all completed careers
 * with final stats, moves learned, and outcome.
 */

import React from 'react';
import { useGame } from '../contexts/GameContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  getPokemonGrade,
  StatIcon
} from '../utils/gameUtils';
import { ICONS, MOVES } from '../shared/gameData';

const HistoryScreen = () => {
  const { setGameState, careerHistory } = useGame();

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
                      {career.victory ? '💡 CHAMPION' : `Gyms Defeated: ${career.gymsDefeated}/5`}
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
};

export default HistoryScreen;
