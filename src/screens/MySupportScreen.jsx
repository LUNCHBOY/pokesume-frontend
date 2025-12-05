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
  getSupportCardAttributes,
  getDominantMoveType
} from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS, MOVES, getSupportAtLimitBreak, SUPPORT_LIMIT_BREAK_PROGRESSIONS, normalizeSupportName } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';
import LimitBreakDiamonds from '../components/LimitBreakDiamonds';

/**
 * Computes what changes at a specific limit break level for a support
 * @param supportName - The support card name
 * @param currentLB - Current limit break level (0-3, since we're looking at next)
 * @returns Object describing what changes, or null if no progression data
 */
const getNextLimitBreakChanges = (supportName, currentLB) => {
  const normalizedName = normalizeSupportName(supportName);
  const progression = SUPPORT_LIMIT_BREAK_PROGRESSIONS[normalizedName];
  if (!progression || currentLB >= 4) return null;

  const currentData = progression.progression[currentLB];
  const nextData = progression.progression[currentLB + 1];
  if (!currentData || !nextData) return null;

  const changes = [];

  // Check each attribute for changes
  if (nextData.baseStats !== currentData.baseStats) {
    const percent = Math.round((nextData.baseStats - currentData.baseStats) * 100);
    changes.push({ attr: 'Base Stats', change: `+${percent}%`, value: `${Math.round(nextData.baseStats * 100)}%` });
  }
  if (nextData.trainingBonus !== currentData.trainingBonus) {
    const percent = Math.round((nextData.trainingBonus - currentData.trainingBonus) * 100);
    changes.push({ attr: 'Training Bonus', change: `+${percent}%`, value: `${Math.round(nextData.trainingBonus * 100)}%` });
  }
  if (nextData.appearanceRate !== currentData.appearanceRate) {
    const percent = Math.round((nextData.appearanceRate - currentData.appearanceRate) * 100);
    changes.push({ attr: 'Appearance Rate', change: `+${percent}%`, value: `${Math.round(nextData.appearanceRate * 100)}%` });
  }
  if (nextData.typeMatchPreference !== currentData.typeMatchPreference) {
    const percent = Math.round((nextData.typeMatchPreference - currentData.typeMatchPreference) * 100);
    changes.push({ attr: 'Type Preference', change: `+${percent}%`, value: `${Math.round(nextData.typeMatchPreference * 100)}%` });
  }
  if (nextData.initialFriendship !== currentData.initialFriendship) {
    const diff = nextData.initialFriendship - currentData.initialFriendship;
    changes.push({ attr: 'Initial Friendship', change: `+${diff}`, value: nextData.initialFriendship });
  }
  if (nextData.specialEffect !== currentData.specialEffect) {
    const percent = Math.round((nextData.specialEffect - currentData.specialEffect) * 100);
    if (currentData.specialEffect === 0) {
      changes.push({ attr: 'Special Effect', change: 'UNLOCKED', value: `${Math.round(nextData.specialEffect * 100)}%` });
    } else {
      changes.push({ attr: 'Special Effect', change: `+${percent}%`, value: `${Math.round(nextData.specialEffect * 100)}%` });
    }
  }

  return changes.length > 0 ? changes : null;
};

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
    setSupportSortBy
  } = useGame();

  const [filterType, setFilterType] = useState('All');
  const supportTypes = ['All', 'HP', 'Attack', 'Defense', 'Instinct', 'Speed'];

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

  // Filter inventory by type
  const filteredSupportInventory = filterType === 'All'
    ? supportInventory
    : supportInventory.filter(key => {
        const support = getSupportCardAttributes(key, SUPPORT_CARDS);
        return support?.supportType === filterType;
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

  const currentLimitBreak = selectedSupport ? getSupportLimitBreak(selectedSupport) : 0;
  const selectedSupportData = selectedSupport ? getSupportCardAttributes(selectedSupport, SUPPORT_CARDS, currentLimitBreak) : null;
  const canLimitBreak = currentLimitBreak < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;

  // For detail modal: get support data at CURRENT limit break level (not max)
  const detailLimitBreakLevel = detailSupport ? getSupportLimitBreak(detailSupport) : 0;
  const detailSupportAtCurrentLB = detailSupport ? getSupportAtLimitBreak(detailSupport, detailLimitBreakLevel) : null;
  // Convert to display format with computed fields
  const detailSupportData = detailSupportAtCurrentLB ? {
    ...detailSupportAtCurrentLB,
    baseStatIncrease: detailSupportAtCurrentLB.baseStats || { HP: 0, Attack: 0, Defense: 0, Instinct: 0, Speed: 0 },
    typeBonusTraining: detailSupportAtCurrentLB.trainingBonus?.typeMatch || 4,
    generalBonusTraining: detailSupportAtCurrentLB.trainingBonus?.otherStats || 2,
    friendshipBonusTraining: detailSupportAtCurrentLB.trainingBonus?.maxFriendshipTypeMatch || 8,
    appearanceChance: detailSupportAtCurrentLB.appearanceRate || 0.40,
    typeAppearancePriority: detailSupportAtCurrentLB.typeMatchPreference || 0.65,
    moveHints: detailSupportAtCurrentLB.moveHints || [],
  } : null;

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

          {/* Type Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-pocket-text-light">Filter:</span>
            {supportTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterType === type
                    ? 'text-white'
                    : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
                style={filterType === type ? {
                  backgroundColor: type === 'All' ? '#6366f1' :
                    type === 'HP' ? TYPE_COLORS['Grass'] :
                    type === 'Attack' ? TYPE_COLORS['Fire'] :
                    type === 'Defense' ? TYPE_COLORS['Water'] :
                    type === 'Instinct' ? TYPE_COLORS['Psychic'] :
                    TYPE_COLORS['Electric']
                } : {}}
              >
                {type}
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

                {/* Focus Type & Move Type */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  {support.supportType && (
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: getFocusColor(support.supportType) }}
                    >
                      {support.supportType}
                    </span>
                  )}
                  {(() => {
                    const dominantType = getDominantMoveType(support.moveHints, MOVES);
                    if (!dominantType) return null;
                    const typeColor = TYPE_COLORS[dominantType] || '#A8A878';
                    return (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                        style={{ backgroundColor: typeColor }}
                        title={`Primary move type: ${dominantType}`}
                      >
                        {dominantType}
                      </span>
                    );
                  })()}
                </div>

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
              {filterType === 'All'
                ? "No supports yet!"
                : `No ${filterType} supports found!`}
            </p>
            {filterType === 'All' && (
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
              {(() => {
                const nextLBChanges = getNextLimitBreakChanges(selectedSupport, currentLimitBreak);
                return currentLimitBreak < MAX_LIMIT_BREAK ? (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-bold text-purple-700 text-center mb-2">
                      LB{currentLimitBreak} → LB{currentLimitBreak + 1}
                    </p>
                    {/* Next LB Changes */}
                    {nextLBChanges && nextLBChanges.length > 0 ? (
                      <div className="bg-white bg-opacity-60 rounded-lg p-2 mb-3">
                        <p className="text-xs font-semibold text-purple-600 mb-1">Next Level Unlocks:</p>
                        {nextLBChanges.map((change, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-pocket-text-light">{change.attr}</span>
                            <span className={`font-bold ${change.change === 'UNLOCKED' ? 'text-amber-500' : 'text-pocket-green'}`}>
                              {change.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-pocket-text-light text-center mb-2">
                        Standard progression bonus
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-pocket-text">Cost:</span>
                      <div className="flex items-center gap-1">
                        <Diamond size={14} className="text-purple-500" />
                        <span className="font-bold text-purple-600">{SHARD_COST_PER_LIMIT_BREAK}</span>
                        <span className="text-pocket-text-light text-xs">
                          (You have: <span className={limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK ? 'text-pocket-green' : 'text-pocket-red'}>{limitBreakShards}</span>)
                        </span>
                      </div>
                    </div>
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
                      Full power unlocked
                    </p>
                  </div>
                );
              })()}

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
                <div className="flex items-center justify-center gap-3 mt-2">
                  {detailSupportData.supportType && (
                    <span
                      className="text-sm font-bold"
                      style={{ color: getFocusColor(detailSupportData.supportType) }}
                    >
                      Focus: {detailSupportData.supportType}
                    </span>
                  )}
                  {(() => {
                    const dominantType = getDominantMoveType(detailSupportData.moveHints, MOVES);
                    if (!dominantType) return null;
                    const typeColor = TYPE_COLORS[dominantType] || '#A8A878';
                    return (
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: typeColor }}
                      >
                        {dominantType} Moves
                      </span>
                    );
                  })()}
                </div>
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="font-bold text-gray-700 text-xs mb-2">Move Hints</p>
                  <div className="flex flex-wrap gap-1">
                    {detailSupportData.moveHints.map((move, moveIdx) => {
                      const moveData = MOVES[move];
                      const moveType = moveData?.type || 'Normal';
                      const typeColor = TYPE_COLORS[moveType] || '#A8A878';
                      return (
                        <span
                          key={moveIdx}
                          className="px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: typeColor }}
                        >
                          {move}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Limit Break Section */}
              {(() => {
                const detailLimitBreak = getSupportLimitBreak(detailSupport);
                const detailSupportId = getSupportId(detailSupport);
                const detailCanLimitBreak = detailLimitBreak < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;
                const nextLBChanges = getNextLimitBreakChanges(detailSupport, detailLimitBreak);

                return detailLimitBreak < MAX_LIMIT_BREAK ? (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-3">
                    <p className="text-sm font-bold text-purple-700 text-center mb-2">
                      LB{detailLimitBreak} → LB{detailLimitBreak + 1}
                    </p>
                    {/* Next LB Changes */}
                    {nextLBChanges && nextLBChanges.length > 0 ? (
                      <div className="bg-white bg-opacity-60 rounded-lg p-2 mb-3">
                        <p className="text-xs font-semibold text-purple-600 mb-1">Next Level Unlocks:</p>
                        {nextLBChanges.map((change, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-pocket-text-light">{change.attr}</span>
                            <span className={`font-bold ${change.change === 'UNLOCKED' ? 'text-amber-500' : 'text-pocket-green'}`}>
                              {change.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-pocket-text-light text-center mb-2">
                        Standard progression bonus
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-pocket-text">Cost:</span>
                      <div className="flex items-center gap-1">
                        <Diamond size={14} className="text-purple-500" />
                        <span className="font-bold text-purple-600">{SHARD_COST_PER_LIMIT_BREAK}</span>
                        <span className="text-pocket-text-light text-xs">
                          (You have: <span className={limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK ? 'text-pocket-green' : 'text-pocket-red'}>{limitBreakShards}</span>)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!detailSupportId || !detailCanLimitBreak) return;
                        setIsLimitBreaking(true);
                        await limitBreakSupportWithShards(detailSupportId);
                        setIsLimitBreaking(false);
                      }}
                      disabled={!detailCanLimitBreak || isLimitBreaking}
                      className={`w-full py-2.5 rounded-xl font-bold transition-all ${
                        detailCanLimitBreak && !isLimitBreaking
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
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 mb-3 text-center">
                    <p className="font-bold text-amber-600 text-sm">Maximum Limit Break Reached!</p>
                    <p className="text-xs text-pocket-text-light mt-1">
                      Full power unlocked
                    </p>
                  </div>
                );
              })()}

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
