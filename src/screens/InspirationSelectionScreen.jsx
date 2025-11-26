/**
 * InspirationSelectionScreen Component
 *
 * Allows users to select up to 2 trained Pokemon as inspirations.
 * Inspirations provide stat bonuses and aptitude upgrades at turns 11, 23, 35, 47, 59.
 */

import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { generatePokemonSprite } from '../utils/gameUtils';
import { ICONS } from '../shared/gameData';

const InspirationSelectionScreen = () => {
  const {
    selectedInspirations,
    setSelectedInspirations,
    setGameState,
    inspirationSortMode,
    setInspirationSortMode
  } = useGame();

  const { trainedPokemon } = useInventory();

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
        const colorToType = {
          Red: 'Fire',
          Blue: 'Water',
          Green: 'Grass',
          Yellow: 'Electric',
          Purple: 'Psychic',
          Orange: 'Fighting'
        };
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

  const colorToType = {
    Red: 'Fire',
    Blue: 'Water',
    Green: 'Grass',
    Yellow: 'Electric',
    Purple: 'Psychic',
    Orange: 'Fighting'
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg p-4 mb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Select 2 Inspirations</h2>
              <p className="text-gray-600">Selected: {selectedInspirations.length}/2</p>
              <p className="text-xs text-gray-500 mt-1">
                Choose trained Pokemon to inspire your career Pokemon at turns 11, 23, 35, 47, and 59
              </p>
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
              <p className="text-gray-500 mb-4">
                You have no trained Pokemon yet. You can continue without inspirations.
              </p>
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
                  const isSelected = selectedInspirations.some(
                    insp => insp.name === trained.name && insp.completedAt === trained.completedAt
                  );
                  const totalStars = trained.inspirations
                    ? (trained.inspirations.stat?.stars || 0) + (trained.inspirations.aptitude?.stars || 0)
                    : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedInspirations(
                            selectedInspirations.filter(
                              insp => !(insp.name === trained.name && insp.completedAt === trained.completedAt)
                            )
                          );
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
                              ⭐
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Inspirations Display */}
                      {trained.inspirations &&
                      trained.inspirations.stat &&
                      trained.inspirations.aptitude ? (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{trained.inspirations.stat.name}</span>
                            <div className="flex gap-0.5">
                              {[...Array(trained.inspirations.stat.stars)].map((_, i) => (
                                <span key={i} className="text-xs text-yellow-500">
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">
                              {colorToType[trained.inspirations.aptitude.name] ||
                                trained.inspirations.aptitude.name}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(trained.inspirations.aptitude.stars)].map((_, i) => (
                                <span key={i} className="text-xs text-yellow-500">
                                  ⭐
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
};

export default InspirationSelectionScreen;
