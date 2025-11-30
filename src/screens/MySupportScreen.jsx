/**
 * MySupportScreen Component
 *
 * Displays the user's support card inventory with sorting and filtering.
 * Shows compact cards by default with larger sprites.
 * Long-press opens detailed modal with all support information.
 * Supports limit breaking support cards using shards.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Users, Diamond, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  getRarityColor,
  getSupportCardAttributes
} from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';
import LimitBreakDiamonds from '../components/LimitBreakDiamonds';

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

  const {
    supportInventory,
    supportInventoryFull,
    getSupportLimitBreak,
    limitBreakSupportWithShards,
    limitBreakShards,
    MAX_LIMIT_BREAK,
    SHARD_COST_PER_LIMIT_BREAK
  } = useInventory();

  const [selectedSupport, setSelectedSupport] = useState(null);
  const [detailSupport, setDetailSupport] = useState(null);
  const [isLimitBreaking, setIsLimitBreaking] = useState(false);

  // Long-press state for detail modal
  const longPressTimerRef = useRef(null);
  const longPressSupportRef = useRef(null);
  const LONG_PRESS_DURATION = 500; // 500ms hold to trigger

  const handleLongPressStart = useCallback((supportKey) => {
    longPressSupportRef.current = supportKey;
    longPressTimerRef.current = setTimeout(() => {
      setDetailSupport(longPressSupportRef.current);
    }, LONG_PRESS_DURATION);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressSupportRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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

  // Get Support ID from full inventory
  const getSupportId = (supportKey) => {
    const support = supportInventoryFull.find(s => s.support_name === supportKey);
    return support?.id;
  };

  // Handle limit break confirmation
  const handleLimitBreak = async () => {
    if (!selectedSupport) return;

    const supportId = getSupportId(selectedSupport);
    if (!supportId) return;

    setIsLimitBreaking(true);
    const result = await limitBreakSupportWithShards(supportId);
    setIsLimitBreaking(false);

    if (result && result.success) {
      // Keep modal open to show updated level, user can close manually
    } else {
      alert('Failed to limit break Support. Please try again.');
    }
  };

  const selectedSupportData = selectedSupport ? getSupportCardAttributes(selectedSupport, SUPPORT_CARDS) : null;
  const detailSupportData = detailSupport ? getSupportCardAttributes(detailSupport, SUPPORT_CARDS) : null;
  const currentLimitBreak = selectedSupport ? getSupportLimitBreak(selectedSupport) : 0;
  const canLimitBreak = currentLimitBreak < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;

  // Get type color for focus
  const getFocusColor = (supportType) => {
    return TYPE_COLORS[
      supportType === 'Attack' ? 'Fire' :
      supportType === 'Defense' ? 'Water' :
      supportType === 'HP' ? 'Grass' :
      supportType === 'Instinct' ? 'Psychic' : 'Electric'
    ];
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
            onClick={() => setGameState('menu')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-pocket-blue" />
            <span className="font-bold text-pocket-text">My Supports</span>
          </div>
          <div className="flex items-center gap-2">
            <Diamond size={14} className="text-purple-500" />
            <span className="text-pocket-text-light text-sm font-semibold">
              {limitBreakShards}
            </span>
          </div>
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

          {/* Instruction hint */}
          <p className="text-xs text-pocket-text-light mt-3 text-center">
            Tap to limit break, hold for details
          </p>
        </motion.div>

        {/* Support Cards Grid - Compact View */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {sortedSupportInventory.map((supportKey, idx) => {
            const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
            if (!support) return null;
            const trainerImage = getSupportImageFromCardName(support.name);
            const limitBreakLevel = getSupportLimitBreak(supportKey);

            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSupport(supportKey)}
                onMouseDown={() => handleLongPressStart(supportKey)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(supportKey)}
                onTouchEnd={handleLongPressEnd}
                className="bg-white rounded-2xl shadow-card p-3 transition-shadow hover:shadow-card-hover cursor-pointer hover:ring-2 hover:ring-purple-300 select-none"
                style={{ borderLeft: `4px solid ${getRarityColor(support.rarity)}` }}
              >
                {/* Rarity Badge */}
                <div className="flex justify-center mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: getRarityColor(support.rarity) }}
                  >
                    {support.rarity}
                  </span>
                </div>

                {/* Larger Support Image */}
                <div className="flex justify-center mb-2">
                  {trainerImage && (
                    <img
                      src={trainerImage}
                      alt={support.trainer}
                      className="w-20 h-20 object-contain rounded-xl border-2 bg-pocket-bg"
                      style={{ borderColor: getRarityColor(support.rarity) }}
                    />
                  )}
                </div>

                {/* Support Name */}
                <h3 className="font-bold text-pocket-text text-sm text-center mb-1 truncate">{support.name}</h3>

                {/* Limit Break Diamonds */}
                <div className="flex justify-center mb-2">
                  <LimitBreakDiamonds level={limitBreakLevel} size={10} />
                </div>

                {/* Focus Type */}
                {support.supportType && (
                  <p
                    className="text-xs font-bold text-center mb-1"
                    style={{ color: getFocusColor(support.supportType) }}
                  >
                    Focus: {support.supportType}
                  </p>
                )}

                {/* Description - truncated */}
                <p className="text-[10px] text-pocket-text-light italic text-center line-clamp-2">
                  {support.description || support.effect?.description}
                </p>
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

      {/* Limit Break Modal */}
      <AnimatePresence>
        {selectedSupport && selectedSupportData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSupport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-card-lg p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedSupport(null)}
                className="absolute top-4 right-4 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Support info */}
              <div className="text-center mb-4">
                {getSupportImageFromCardName(selectedSupportData.name) && (
                  <img
                    src={getSupportImageFromCardName(selectedSupportData.name)}
                    alt={selectedSupportData.trainer}
                    className="w-20 h-20 object-contain rounded-xl border-2 bg-pocket-bg mx-auto mb-3"
                    style={{ borderColor: getRarityColor(selectedSupportData.rarity) }}
                  />
                )}
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white inline-block mb-2"
                  style={{ backgroundColor: getRarityColor(selectedSupportData.rarity) }}
                >
                  {selectedSupportData.rarity}
                </span>
                <h3 className="font-bold text-xl text-pocket-text mb-2">{selectedSupportData.name}</h3>
                <div className="flex justify-center mb-3">
                  <LimitBreakDiamonds level={currentLimitBreak} size={16} />
                </div>
                <p className="text-sm text-pocket-text-light">
                  Limit Break Level: {currentLimitBreak} / {MAX_LIMIT_BREAK}
                </p>
                {currentLimitBreak > 0 && (
                  <p className="text-sm text-pocket-green font-semibold">
                    +{currentLimitBreak * 5}% Training Bonuses
                  </p>
                )}
              </div>

              {/* Support details */}
              <div className="bg-pocket-bg rounded-xl p-3 mb-4 text-xs">
                <p className="text-pocket-text-light italic mb-2">{selectedSupportData.description}</p>
                {selectedSupportData.supportType && (
                  <p className="font-semibold" style={{ color: getFocusColor(selectedSupportData.supportType) }}>
                    Focus: {selectedSupportData.supportType}
                  </p>
                )}
              </div>

              {/* Limit Break Action */}
              {currentLimitBreak < MAX_LIMIT_BREAK ? (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-pocket-text">Limit Break Cost:</span>
                    <div className="flex items-center gap-1">
                      <Diamond size={14} className="text-purple-500" />
                      <span className="font-bold text-purple-600">{SHARD_COST_PER_LIMIT_BREAK}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-pocket-text-light">Your Shards:</span>
                    <div className="flex items-center gap-1">
                      <Diamond size={14} className="text-purple-500" />
                      <span className={`font-bold ${limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK ? 'text-pocket-green' : 'text-pocket-red'}`}>
                        {limitBreakShards}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-pocket-text-light text-center mb-3">
                    Next level: +{(currentLimitBreak + 1) * 5}% Training Bonuses
                  </p>
                  <button
                    onClick={handleLimitBreak}
                    disabled={!canLimitBreak || isLimitBreaking}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      canLimitBreak && !isLimitBreaking
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLimitBreaking ? 'Limit Breaking...' : 'Limit Break'}
                  </button>
                  {limitBreakShards < SHARD_COST_PER_LIMIT_BREAK && (
                    <p className="text-xs text-pocket-red text-center mt-2">
                      Not enough shards
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-4 text-center">
                  <p className="font-bold text-amber-600">Maximum Limit Break Reached!</p>
                  <p className="text-sm text-pocket-text-light mt-1">
                    This support is at full power (+20% Training Bonuses)
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelectedSupport(null)}
                className="w-full py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal (Long Press) */}
      <AnimatePresence>
        {detailSupport && detailSupportData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailSupport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-card-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setDetailSupport(null)}
                className="absolute top-3 right-3 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Support Header */}
              <div className="text-center mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white inline-block mb-2"
                  style={{ backgroundColor: getRarityColor(detailSupportData.rarity) }}
                >
                  {detailSupportData.rarity}
                </span>
                {getSupportImageFromCardName(detailSupportData.name) && (
                  <img
                    src={getSupportImageFromCardName(detailSupportData.name)}
                    alt={detailSupportData.trainer}
                    className="w-24 h-24 object-contain rounded-xl border-2 bg-pocket-bg mx-auto mb-3"
                    style={{ borderColor: getRarityColor(detailSupportData.rarity) }}
                  />
                )}
                <h3 className="font-bold text-xl text-pocket-text">{detailSupportData.name}</h3>
                <div className="flex justify-center mt-2">
                  <LimitBreakDiamonds level={getSupportLimitBreak(detailSupport)} size={14} />
                </div>
                {detailSupportData.supportType && (
                  <p
                    className="text-sm font-bold mt-2"
                    style={{ color: getFocusColor(detailSupportData.supportType) }}
                  >
                    Focus: {detailSupportData.supportType}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-pocket-text-light italic mb-4 text-center">
                {detailSupportData.description}
              </p>

              {/* Base Stats */}
              {detailSupportData.baseStatIncrease && Object.values(detailSupportData.baseStatIncrease).some(v => v > 0) && (
                <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                  <p className="font-bold text-type-psychic text-xs mb-2">Base Stat Bonuses</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(detailSupportData.baseStatIncrease).map(([stat, value]) => (
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
              <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                <p className="font-bold text-type-psychic text-xs mb-2">Training Bonuses</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Friendship</span>
                    <span className="text-pocket-blue font-bold">{detailSupportData.initialFriendship}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Type Match</span>
                    <span className="text-pocket-green font-bold">+{detailSupportData.typeBonusTraining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Other Stats</span>
                    <span className="text-pocket-green font-bold">+{detailSupportData.generalBonusTraining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Max Friend</span>
                    <span className="text-pocket-green font-bold">+{detailSupportData.friendshipBonusTraining}</span>
                  </div>
                </div>
              </div>

              {/* Appearance Rate & Type Match Preference */}
              <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Appearance</span>
                    <span className="text-pocket-text font-bold">{Math.round(detailSupportData.appearanceChance * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Type Pref</span>
                    <span className="text-pocket-text font-bold">{Math.round(detailSupportData.typeAppearancePriority * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Special Effects */}
              {detailSupportData.specialEffect && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                  <p className="font-bold text-purple-700 text-xs mb-2">Special Effects</p>
                  <div className="space-y-1 text-xs">
                    {detailSupportData.specialEffect.statGainMultiplier && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Stat Gain</span>
                        <span className="text-pocket-green font-bold">{detailSupportData.specialEffect.statGainMultiplier}x</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.failRateReduction && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Fail Rate</span>
                        <span className="text-pocket-green font-bold">-{(detailSupportData.specialEffect.failRateReduction * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.maxEnergyBonus && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Max Energy</span>
                        <span className="text-pocket-green font-bold">+{detailSupportData.specialEffect.maxEnergyBonus}</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.restBonus && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Rest Bonus</span>
                        <span className="text-pocket-green font-bold">+{detailSupportData.specialEffect.restBonus}</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.energyRegenBonus && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Energy Regen</span>
                        <span className="text-pocket-green font-bold">+{detailSupportData.specialEffect.energyRegenBonus}</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.skillPointMultiplier && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">SP Mult</span>
                        <span className="text-pocket-green font-bold">{detailSupportData.specialEffect.skillPointMultiplier}x</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.friendshipGainBonus && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Friendship Gain</span>
                        <span className="text-pocket-green font-bold">+{detailSupportData.specialEffect.friendshipGainBonus}</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.energyCostReduction && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Energy Cost</span>
                        <span className="text-pocket-green font-bold">-{detailSupportData.specialEffect.energyCostReduction}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Move Hints */}
              {detailSupportData.moveHints && detailSupportData.moveHints.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="font-bold text-blue-700 text-xs mb-2">Move Hints</p>
                  <div className="flex flex-wrap gap-1">
                    {detailSupportData.moveHints.map((move, moveIdx) => (
                      <span key={moveIdx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {move}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setDetailSupport(null)}
                className="w-full py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MySupportScreen;
