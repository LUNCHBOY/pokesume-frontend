/**
 * SupportSelectionScreen Component
 *
 * Allows users to select up to 5 support cards from their inventory for career.
 * Shows compact cards by default with larger sprites.
 * Long-press opens detailed modal with all support information.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Users, Check, X, Diamond } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { useCareer } from '../contexts/CareerContext';
import {
  getRarityColor,
  getSupportCardAttributes
} from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS, POKEMON } from '../shared/gameData';
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

const SupportSelectionScreen = () => {
  const {
    selectedPokemon,
    selectedSupports,
    setSelectedSupports,
    setGameState,
    supportSortBy,
    setSupportSortBy,
    selectedInspirations
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
  const { startCareer, careerLoading } = useCareer();

  const [detailSupport, setDetailSupport] = useState(null);
  const [isLimitBreaking, setIsLimitBreaking] = useState(false);

  // Get Support ID from full inventory
  const getSupportId = (supportKey) => {
    const support = supportInventoryFull.find(s => s.support_name === supportKey);
    return support?.id;
  };

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

  // Calculate inspiration bonuses from selected inspirations
  // Returns: { aptitudeUpgrades: { Red: 2, Blue: 1, ... }, strategyUpgrades: 1 }
  const calculateInspirationBonuses = () => {
    const aptitudeStars = {}; // Track stars per aptitude type (by color)
    let strategyStars = 0;

    // Sum up all stars from selected inspirations
    selectedInspirations.forEach(insp => {
      if (!insp.inspirations) return;

      // Aptitude stars
      if (insp.inspirations.aptitude) {
        const color = insp.inspirations.aptitude.color;
        if (color) {
          aptitudeStars[color] = (aptitudeStars[color] || 0) + (insp.inspirations.aptitude.stars || 0);
        }
      }

      // Strategy stars
      if (insp.inspirations.strategy) {
        strategyStars += insp.inspirations.strategy.stars || 0;
      }
    });

    // Convert stars to grade upgrades (2 stars = 1 grade upgrade)
    const aptitudeUpgrades = {};
    Object.keys(aptitudeStars).forEach(color => {
      aptitudeUpgrades[color] = Math.floor(aptitudeStars[color] / 2);
    });

    const strategyUpgrades = Math.floor(strategyStars / 2);

    return { aptitudeUpgrades, strategyUpgrades };
  };

  // Apply grade upgrades to aptitudes
  const applyGradeUpgrades = (aptitudes, upgrades) => {
    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const upgraded = { ...aptitudes };

    Object.keys(upgrades).forEach(color => {
      const currentGrade = upgraded[color];
      if (!currentGrade) return;

      const currentIndex = gradeOrder.indexOf(currentGrade);
      const newIndex = Math.min(currentIndex + upgrades[color], gradeOrder.length - 1);
      upgraded[color] = gradeOrder[newIndex];
    });

    return upgraded;
  };

  // Apply strategy grade upgrade to all strategy aptitudes
  const applyStrategyAptitudesUpgrade = (strategyAptitudes, upgrades) => {
    if (!strategyAptitudes || upgrades === 0) return strategyAptitudes;

    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const upgraded = { ...strategyAptitudes };

    // Upgrade each strategy aptitude
    for (const [strategy, grade] of Object.entries(upgraded)) {
      const currentIndex = gradeOrder.indexOf(grade);
      if (currentIndex !== -1) {
        const newIndex = Math.min(currentIndex + upgrades, gradeOrder.length - 1);
        upgraded[strategy] = gradeOrder[newIndex];
      }
    }

    return upgraded;
  };

  // Derive best strategy and grade from strategyAptitudes
  const deriveStrategyFromAptitudes = (strategyAptitudes) => {
    const gradeRank = { 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
    let bestStrategy = 'Chipper';
    let bestGrade = 'C';
    let bestRank = 0;

    if (strategyAptitudes) {
      for (const [strategy, grade] of Object.entries(strategyAptitudes)) {
        const rank = gradeRank[grade] || 0;
        if (rank > bestRank) {
          bestStrategy = strategy;
          bestGrade = grade;
          bestRank = rank;
        }
      }
    }

    return { strategy: bestStrategy, strategyGrade: bestGrade };
  };

  const [typeFilter, setTypeFilter] = useState('All');
  const supportTypes = ['All', 'HP', 'Attack', 'Defense', 'Instinct', 'Speed'];

  // Filter and sort support inventory
  const filterAndSortSupportInventory = () => {
    const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
    const typeOrder = { 'HP': 0, 'Attack': 1, 'Defense': 2, 'Instinct': 3, 'Speed': 4 };

    // First filter by type
    const filtered = supportInventory.filter(supportKey => {
      if (typeFilter === 'All') return true;
      const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
      return support && support.supportType === typeFilter;
    });

    // Then sort
    return [...filtered].sort((a, b) => {
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

  const sortedSupportInventory = filterAndSortSupportInventory();

  const handleBeginCareer = async () => {
    if (!selectedPokemon || selectedSupports.length === 0) {
      alert('Please select at least one support card');
      return;
    }

    const pokemonData = POKEMON[selectedPokemon];
    if (!pokemonData) {
      alert('Invalid Pokemon selected');
      return;
    }

    // Calculate inspiration bonuses (2 stars = 1 grade upgrade)
    const { aptitudeUpgrades, strategyUpgrades } = calculateInspirationBonuses();

    // Apply inspiration upgrades to type aptitudes
    const upgradedAptitudes = applyGradeUpgrades(
      pokemonData.typeAptitudes || {},
      aptitudeUpgrades
    );

    // Apply inspiration upgrades to strategy aptitudes
    const upgradedStrategyAptitudes = applyStrategyAptitudesUpgrade(
      pokemonData.strategyAptitudes || {},
      strategyUpgrades
    );

    // Derive default strategy from best aptitude
    const { strategy: defaultStrategy, strategyGrade: defaultStrategyGrade } =
      deriveStrategyFromAptitudes(upgradedStrategyAptitudes);

    const pokemon = {
      name: selectedPokemon,
      ...pokemonData,
      typeAptitudes: upgradedAptitudes,
      strategyAptitudes: upgradedStrategyAptitudes,
      strategy: defaultStrategy,
      strategyGrade: defaultStrategyGrade
    };

    console.log('[SupportSelectionScreen] Starting career with inspiration bonuses:', {
      originalAptitudes: pokemonData.typeAptitudes,
      upgradedAptitudes,
      aptitudeUpgrades,
      originalStrategyAptitudes: pokemonData.strategyAptitudes,
      upgradedStrategyAptitudes,
      defaultStrategy,
      defaultStrategyGrade,
      strategyUpgrades
    });

    const careerState = await startCareer(pokemon, selectedSupports, selectedInspirations);

    if (careerState) {
      setGameState('career');
    } else {
      alert('Failed to start career. Please try again.');
    }
  };

  // Get type color for focus
  const getFocusColor = (supportType) => {
    return TYPE_COLORS[
      supportType === 'Attack' ? 'Fire' :
      supportType === 'Defense' ? 'Water' :
      supportType === 'HP' ? 'Grass' :
      supportType === 'Instinct' ? 'Psychic' : 'Electric'
    ];
  };

  const detailSupportData = detailSupport ? getSupportCardAttributes(detailSupport, SUPPORT_CARDS) : null;

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
            onClick={() => {
              setSelectedSupports([]);
              setGameState('inspirationSelect');
            }}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-pocket-blue" />
            <span className="font-bold text-pocket-text">Select Supports</span>
          </div>
          <span className="text-pocket-text-light text-sm font-semibold">
            {selectedSupports.length}/5
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
          {/* Type Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="text-sm font-semibold text-pocket-text-light">Filter:</span>
            {supportTypes.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                  typeFilter === type
                    ? 'text-white'
                    : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
                style={typeFilter === type ? {
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

          {/* Sort Options */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm font-semibold text-pocket-text-light">Sort:</span>
            {['rarity', 'type'].map(sort => (
              <button
                key={sort}
                onClick={() => setSupportSortBy(sort)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                  supportSortBy === sort
                    ? 'bg-pocket-blue text-white'
                    : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>

          {/* Instruction hint */}
          <p className="text-xs text-pocket-text-light text-center">
            Tap to select, hold for details
          </p>
        </motion.div>

        {/* Support Cards Grid - Compact View */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4"
        >
          {sortedSupportInventory.map((supportKey, idx) => {
            const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
            if (!support) return null;

            const isSelected = selectedSupports.includes(supportKey);
            const trainerImage = getSupportImageFromCardName(support.name);
            const limitBreakLevel = getSupportLimitBreak(supportKey);

            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isSelected) {
                    setSelectedSupports(selectedSupports.filter(s => s !== supportKey));
                  } else if (selectedSupports.length < 5) {
                    setSelectedSupports([...selectedSupports, supportKey]);
                  }
                }}
                onMouseDown={() => handleLongPressStart(supportKey)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(supportKey)}
                onTouchEnd={handleLongPressEnd}
                className={`bg-white rounded-2xl shadow-card p-3 cursor-pointer transition select-none ${
                  isSelected ? 'ring-4 ring-pocket-green' : 'hover:shadow-card-hover'
                }`}
                style={{ borderLeft: `4px solid ${getRarityColor(support.rarity)}` }}
              >
                {/* Rarity Badge */}
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: getRarityColor(support.rarity) }}
                  >
                    {support.rarity}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-pocket-green flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
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

        {/* Begin Career Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleBeginCareer}
            disabled={careerLoading || selectedSupports.length === 0}
            className="w-full pocket-btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {careerLoading ? 'Starting Career...' : 'Begin Career'}
          </button>
        </motion.div>
      </div>

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

              {/* Limit Break Section */}
              {(() => {
                const detailLimitBreak = getSupportLimitBreak(detailSupport);
                const detailSupportId = getSupportId(detailSupport);
                const detailCanLimitBreak = detailLimitBreak < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;

                return detailLimitBreak < MAX_LIMIT_BREAK ? (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-pocket-text">Limit Break Cost:</span>
                      <div className="flex items-center gap-1">
                        <Diamond size={14} className="text-purple-500" />
                        <span className="font-bold text-purple-600">{SHARD_COST_PER_LIMIT_BREAK}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-pocket-text-light">Your Shards:</span>
                      <div className="flex items-center gap-1">
                        <Diamond size={14} className="text-purple-500" />
                        <span className={`font-bold ${limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK ? 'text-pocket-green' : 'text-pocket-red'}`}>
                          {limitBreakShards}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-pocket-text-light text-center mb-2">
                      Current: +{detailLimitBreak * 5}% → Next: +{(detailLimitBreak + 1) * 5}% Training Bonuses
                    </p>
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
                      +20% Training Bonuses
                    </p>
                  </div>
                );
              })()}

              {/* Select/Deselect Button */}
              <button
                onClick={() => {
                  const isSelected = selectedSupports.includes(detailSupport);
                  if (isSelected) {
                    setSelectedSupports(selectedSupports.filter(s => s !== detailSupport));
                  } else if (selectedSupports.length < 5) {
                    setSelectedSupports([...selectedSupports, detailSupport]);
                  }
                  setDetailSupport(null);
                }}
                className={`w-full py-3 rounded-xl font-bold transition-all mb-2 ${
                  selectedSupports.includes(detailSupport)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : selectedSupports.length >= 5
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-pocket-green text-white hover:bg-green-600'
                }`}
                disabled={!selectedSupports.includes(detailSupport) && selectedSupports.length >= 5}
              >
                {selectedSupports.includes(detailSupport) ? 'Remove from Team' : 'Add to Team'}
              </button>

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

export default SupportSelectionScreen;
