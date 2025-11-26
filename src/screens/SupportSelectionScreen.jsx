/**
 * SupportSelectionScreen Component
 *
 * Allows users to select up to 5 support cards from their inventory for career.
 * Displays support cards with rarity, effects, and stat bonuses.
 */

import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  getTypeColor,
  getRarityColor,
  getSupportCardAttributes
} from '../utils/gameUtils';
import { SUPPORT_CARDS, ICONS } from '../shared/gameData';

const SupportSelectionScreen = () => {
  const {
    selectedPokemon,
    selectedSupports,
    setSelectedSupports,
    setGameState,
    supportSortBy,
    setSupportSortBy
  } = useGame();

  const { supportInventory } = useInventory();

  // Sort support inventory
  const sortSupportInventory = () => {
    const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
    const typeOrder = { 'HP': 0, 'Attack': 1, 'Defense': 2, 'Instinct': 3, 'Speed': 4 };

    return [...supportInventory].sort((a, b) => {
      const supportA = getSupportCardAttributes(a, SUPPORT_CARDS);
      const supportB = getSupportCardAttributes(b, SUPPORT_CARDS);
      if (!supportA || !supportB) return 0;

      if (supportSortBy === 'rarity') {
        const rarityAValue = rarityOrder[supportA.rarity];
        const rarityBValue = rarityOrder[supportB.rarity];
        const rarityAFinal = rarityAValue !== undefined ? rarityAValue : 999;
        const rarityBFinal = rarityBValue !== undefined ? rarityBValue : 999;
        return rarityAFinal - rarityBFinal;
      } else if (supportSortBy === 'type') {
        const typeA = supportA.supportType || 'HP';
        const typeB = supportB.supportType || 'HP';
        const valueA = typeOrder[typeA] !== undefined ? typeOrder[typeA] : 999;
        const valueB = typeOrder[typeB] !== undefined ? typeOrder[typeB] : 999;
        return valueA - valueB;
      }
      return 0;
    });
  };

  const sortedSupportInventory = sortSupportInventory();

  const handleBeginCareer = () => {
    // TODO: Initialize career with server API
    console.log('[SupportSelection] Beginning career with:', {
      pokemon: selectedPokemon,
      supports: selectedSupports
    });
    // For now, go to career screen (placeholder)
    setGameState('career');
  };

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

        {/* Support Cards Grid */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-3">Your Support Cards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {sortedSupportInventory.map((supportKey, idx) => {
              const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
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
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getRarityColor(support.rarity) }}
                      >
                        {support.rarity}
                      </span>
                      <h3 className="text-base font-bold text-gray-800 mt-1">{support.name}</h3>
                    </div>
                    {isSelected && <span className="text-xl">{ICONS.CHECKMARK}</span>}
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    <span className="font-semibold">{support.trainer}</span> &{' '}
                    <span className="font-semibold">{support.pokemon}</span>
                  </p>

                  {support.supportType && (
                    <p
                      className="text-xs font-bold mb-2"
                      style={{
                        color: getTypeColor(
                          support.supportType === 'Attack'
                            ? 'Fire'
                            : support.supportType === 'Defense'
                            ? 'Water'
                            : support.supportType === 'HP'
                            ? 'Grass'
                            : support.supportType === 'Instinct'
                            ? 'Psychic'
                            : 'Electric'
                        )
                      }}
                    >
                      Focus: {support.supportType}
                    </p>
                  )}

                  <p className="text-xs text-gray-700 italic mb-2">{support.effect.description}</p>

                  <div className="bg-white rounded p-2 mb-2 text-xs space-y-1">
                    {statBonuses && <div className="font-bold text-green-600 mb-1">{statBonuses}</div>}
                    <div className="text-gray-600">
                      Type Bonus: +{support.typeBonusTraining} (Max: +{support.friendshipBonusTraining})
                    </div>
                    <div className="text-gray-600">Other Stats: +{support.generalBonusTraining}</div>

                    {support.effect.type === 'training_boost' && (
                      <div className="border-t pt-1 mt-1 text-purple-600 font-semibold">
                        {support.effect.trainingMultiplier && (
                          <div>Gain Mult: {support.effect.trainingMultiplier}x</div>
                        )}
                        {support.effect.energyCostReduction && (
                          <div>Energy Cost: -{support.effect.energyCostReduction}</div>
                        )}
                        {support.effect.failureReduction && (
                          <div>Fail Rate: -{(support.effect.failureReduction * 100).toFixed(0)}%</div>
                        )}
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
                        {support.effect.skillPointMultiplier && (
                          <div>SP Mult: {support.effect.skillPointMultiplier}x</div>
                        )}
                        {support.effect.friendshipBonus && (
                          <div>Friendship: +{support.effect.friendshipBonus}</div>
                        )}
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

        {/* Begin Career Button */}
        <button
          onClick={handleBeginCareer}
          className="w-full bg-green-600 text-white py-2 sm:py-3 sm:py-4 rounded-lg font-bold text-lg sm:text-xl hover:bg-green-700 transition"
        >
          Begin Career
        </button>
      </div>
    </div>
  );
};

export default SupportSelectionScreen;
