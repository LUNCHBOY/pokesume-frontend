/**
 * VictoryScreen Component
 *
 * Displayed when the player defeats all 5 gym leaders.
 * Shows final Pokemon stats, grade, aptitudes, and earned inspirations.
 */

import React from 'react';
import { Trophy } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  StatIcon
} from '../utils/gameUtils';

const VictoryScreen = () => {
  const { careerData, setGameState, setSelectedPokemon, setSelectedSupports, setCareerData } = useGame();
  const { trainedPokemon } = useInventory();

  // Get the most recent trained pokemon (just added)
  const completedPokemon = trainedPokemon[trainedPokemon.length - 1];

  const typeMap = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' };

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
                <h3 className="font-bold mb-3 text-center text-purple-800">✨ Inspirations Earned ✨</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Stat Inspiration */}
                  <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
                    <div className="text-xs font-semibold text-purple-600 mb-1">STAT INSPIRATION</div>
                    <div className="font-bold text-lg mb-1">{completedPokemon.inspirations.stat.name}</div>
                    <div className="text-sm text-gray-600 mb-2">Value: {completedPokemon.inspirations.stat.value}</div>
                    <div className="flex gap-1">
                      {[...Array(completedPokemon.inspirations.stat.stars)].map((_, i) => (
                        <span key={i} className="text-xl text-yellow-400">
                          ⭐
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
                          ⭐
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
};

export default VictoryScreen;
