/**
 * MySupportScreen Component
 *
 * Displays the user's support card inventory with sorting and filtering.
 * Shows detailed information about each support card including bonuses and effects.
 */

import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  getRarityColor,
  getSupportCardAttributes
} from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

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
    <div className="min-h-screen bg-pocket-bg p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setGameState('menu')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-pocket-blue" />
            <span className="font-bold text-pocket-text">My Supports</span>
          </div>
          <span className="text-pocket-text-light text-sm font-semibold">
            {supportInventory.length} owned
          </span>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          {/* Sort Options */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-sm font-semibold text-pocket-text-light">Sort:</span>
            {['default', 'rarity', 'type'].map(sort => (
              <button
                key={sort}
                onClick={() => setSupportSortBy(sort)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  supportSortBy === sort
                    ? 'bg-pocket-blue text-white'
                    : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>

          {/* Rarity Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-pocket-text-light">Filter:</span>
            <button
              onClick={() => setSupportFilterRarity('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                supportFilterRarity === 'all'
                  ? 'bg-pocket-blue text-white'
                  : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {['Legendary', 'Rare', 'Uncommon', 'Common'].map(rarity => (
              <button
                key={rarity}
                onClick={() => setSupportFilterRarity(rarity)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  supportFilterRarity === rarity ? 'text-white' : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
                style={supportFilterRarity === rarity ? { backgroundColor: getRarityColor(rarity) } : {}}
              >
                {rarity}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Support Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {sortedSupportInventory.map((supportKey, idx) => {
            const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
            if (!support) return null;
            const trainerImage = getSupportImageFromCardName(support.name);

            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl shadow-card p-4 transition-shadow hover:shadow-card-hover"
                style={{ borderLeft: `4px solid ${getRarityColor(support.rarity)}` }}
              >
                {/* Header with rarity and icon */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: getRarityColor(support.rarity) }}
                  >
                    {support.rarity}
                  </span>
                  <Users size={16} className="text-pocket-blue" />
                </div>

                {/* Support info with image */}
                <div className="flex gap-3 mb-3">
                  {trainerImage && (
                    <img
                      src={trainerImage}
                      alt={support.trainer}
                      className="w-16 h-16 object-contain rounded-xl border-2 bg-pocket-bg flex-shrink-0"
                      style={{ borderColor: getRarityColor(support.rarity) }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-pocket-text text-sm mb-1">{support.name}</h3>
                  </div>
                </div>

                {/* Focus Type */}
                {support.supportType && (
                  <p
                    className="text-xs font-bold mb-2"
                    style={{ color: TYPE_COLORS[support.supportType === 'Attack' ? 'Fire' : support.supportType === 'Defense' ? 'Water' : support.supportType === 'HP' ? 'Grass' : support.supportType === 'Instinct' ? 'Psychic' : 'Electric'] }}
                  >
                    Focus: {support.supportType}
                  </p>
                )}

                {/* Effect Description */}
                <p className="text-xs text-pocket-text-light italic mb-3">{support.effect.description}</p>

                {/* Base Stats */}
                {support.baseStatIncrease && Object.values(support.baseStatIncrease).some(v => v > 0) && (
                  <div className="bg-pocket-bg rounded-lg p-2 mb-2">
                    <p className="font-bold text-type-psychic text-[10px] mb-1">Base Stat Bonuses</p>
                    <div className="space-y-0.5 text-[10px]">
                      {Object.entries(support.baseStatIncrease).map(([stat, value]) => (
                        value > 0 && (
                          <div key={stat} className="flex justify-between">
                            <span className="text-pocket-text-light">{stat}</span>
                            <span className="text-pocket-green font-bold">+{value}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Training Bonuses */}
                <div className="bg-pocket-bg rounded-lg p-2 mb-2">
                  <p className="font-bold text-type-psychic text-[10px] mb-1">Training Bonuses</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-pocket-text-light">Friendship</span>
                      <span className="text-pocket-blue font-bold">{support.initialFriendship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pocket-text-light">Type Match</span>
                      <span className="text-pocket-green font-bold">+{support.typeBonusTraining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pocket-text-light">Other Stats</span>
                      <span className="text-pocket-green font-bold">+{support.generalBonusTraining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pocket-text-light">Max Friend</span>
                      <span className="text-pocket-green font-bold">+{support.friendshipBonusTraining}</span>
                    </div>
                  </div>
                </div>

                {/* Appearance Rate */}
                <div className="bg-pocket-bg rounded-lg p-2 mb-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-pocket-text-light">Appearance</span>
                    <span className="text-pocket-text font-bold">{Math.round(support.appearanceChance * 100)}%</span>
                  </div>
                </div>

                {/* Move Hints */}
                {support.moveHints && support.moveHints.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="font-bold text-blue-700 text-[10px] mb-1">Move Hints</p>
                    <div className="flex flex-wrap gap-1">
                      {support.moveHints.map((move, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {move}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Effect-specific bonuses */}
                {support.effect.type === 'training_boost' && (
                  <div className="bg-pocket-bg rounded-lg p-2 mt-2">
                    <p className="font-bold text-type-psychic text-[10px] mb-1">Special Effects</p>
                    <div className="space-y-0.5 text-[10px]">
                      {support.effect.trainingMultiplier && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Gain Mult</span>
                          <span className="text-pocket-green font-bold">{support.effect.trainingMultiplier}x</span>
                        </div>
                      )}
                      {support.effect.energyCostReduction && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Energy Cost</span>
                          <span className="text-pocket-green font-bold">-{support.effect.energyCostReduction}</span>
                        </div>
                      )}
                      {support.effect.failureReduction && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Fail Rate</span>
                          <span className="text-pocket-green font-bold">-{(support.effect.failureReduction * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {support.effect.type === 'energy_boost' && (
                  <div className="bg-pocket-bg rounded-lg p-2 mt-2">
                    <p className="font-bold text-type-psychic text-[10px] mb-1">Energy Benefits</p>
                    <div className="space-y-0.5 text-[10px]">
                      {support.effect.energyBonus && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Max Energy</span>
                          <span className="text-pocket-green font-bold">+{support.effect.energyBonus}</span>
                        </div>
                      )}
                      {support.effect.restBonus && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Rest Bonus</span>
                          <span className="text-pocket-green font-bold">+{support.effect.restBonus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {support.effect.type === 'experience_boost' && (
                  <div className="bg-pocket-bg rounded-lg p-2 mt-2">
                    <p className="font-bold text-type-psychic text-[10px] mb-1">XP Benefits</p>
                    <div className="space-y-0.5 text-[10px]">
                      {support.effect.skillPointMultiplier && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">SP Mult</span>
                          <span className="text-pocket-green font-bold">{support.effect.skillPointMultiplier}x</span>
                        </div>
                      )}
                      {support.effect.friendshipBonus && (
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Friendship</span>
                          <span className="text-pocket-green font-bold">+{support.effect.friendshipBonus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {sortedSupportInventory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pocket-bg flex items-center justify-center">
              <Users size={32} className="text-pocket-text-light" />
            </div>
            <p className="text-pocket-text mb-2">
              {supportFilterRarity === 'all'
                ? "No supports yet!"
                : `No ${supportFilterRarity} supports found!`}
            </p>
            {supportFilterRarity === 'all' && (
              <p className="text-sm text-pocket-text-light mb-4">
                Roll for some supports to get started.
              </p>
            )}
            <button
              onClick={() => setGameState('menu')}
              className="pocket-btn-primary px-6 py-2"
            >
              Back to Menu
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MySupportScreen;
