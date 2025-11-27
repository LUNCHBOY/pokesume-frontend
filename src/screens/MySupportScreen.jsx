/**
 * MySupportScreen Component
 *
 * Displays the user's support card inventory with sorting and filtering.
 * Shows detailed information about each support card including bonuses and effects.
 */

import React from 'react';
import { Users } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  getTypeColor,
  getRarityColor,
  getSupportCardAttributes
} from '../utils/gameUtils';
import { SUPPORT_CARDS } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';

const MySupportScreen = () => {
  const {
    setGameState,
    supportSortBy,
    setSupportSortBy,
    supportFilterRarity,
    setSupportFilterRarity
  } = useGame();

  const { supportInventory } = useInventory();

  // Sort support inventory based on selected sort option
  const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
  const typeOrder = { 'HP': 0, 'Attack': 1, 'Defense': 2, 'Instinct': 3, 'Speed': 4 };

  const sortSupports = (inventory) => {
    const sorted = [...inventory];
    switch (supportSortBy) {
      case 'rarity':
        return sorted.sort((a, b) => {
          const supportA = getSupportCardAttributes(a, SUPPORT_CARDS);
          const supportB = getSupportCardAttributes(b, SUPPORT_CARDS);
          if (!supportA || !supportB) return 0;
          const rarityA = rarityOrder[supportA.rarity];
          const rarityB = rarityOrder[supportB.rarity];
          return (rarityA !== undefined ? rarityA : 999) - (rarityB !== undefined ? rarityB : 999);
        });
      case 'type':
        return sorted.sort((a, b) => {
          const supportA = getSupportCardAttributes(a, SUPPORT_CARDS);
          const supportB = getSupportCardAttributes(b, SUPPORT_CARDS);
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
        const support = getSupportCardAttributes(key, SUPPORT_CARDS);
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
              const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
              if (!support) return null;
              const trainerImage = getSupportImageFromCardName(support.name);

              return (
                <div key={idx} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 hover:shadow-lg transition" style={{ borderColor: getRarityColor(support.rarity) }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getRarityColor(support.rarity) }}>
                      {support.rarity}
                    </span>
                    <Users size={20} className="text-purple-600" />
                  </div>
                  <div className="flex gap-3 mb-2">
                    {trainerImage && (
                      <img
                        src={trainerImage}
                        alt={support.trainer}
                        className="w-20 h-20 object-contain rounded-lg border-2 bg-white flex-shrink-0"
                        style={{ borderColor: getRarityColor(support.rarity), imageRendering: 'pixelated' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1">{support.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">{support.trainer}</span> & <span className="font-semibold">{support.pokemon}</span>
                      </p>
                    </div>
                  </div>
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

                  {/* Move Hints */}
                  {support.moveHints && support.moveHints.length > 0 && (
                    <div className="text-xs space-y-1 bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                      <p className="font-bold text-blue-700">Move Hints:</p>
                      <div className="flex flex-wrap gap-1">
                        {support.moveHints.map((move, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                            {move}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
};

export default MySupportScreen;
