/**
 * TrainedPokemonScreen Component
 *
 * Displays Pokemon that have completed careers with their final stats,
 * grade, and inspirations. Shows trained Pokemon history with sorting and filtering.
 */

import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  StatIcon
} from '../utils/gameUtils';

const TrainedPokemonScreen = () => {
  const {
    setGameState,
    trainedSortBy,
    setTrainedSortBy,
    trainedFilterGrade,
    setTrainedFilterGrade
  } = useGame();

  const { trainedPokemon } = useInventory();

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
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold">
                          {colorToType[trained.inspirations.aptitude.name] || trained.inspirations.aptitude.name}
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
};

export default TrainedPokemonScreen;
