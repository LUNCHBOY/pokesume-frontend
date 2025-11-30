/**
 * SupportSelectionScreen Component
 *
 * Allows users to select up to 5 support cards from their inventory for career.
 * Displays support cards with rarity, effects, and stat bonuses.
 */

import React, { useState } from 'react';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const { supportInventory, getSupportLimitBreak } = useInventory();
  const { startCareer, careerLoading } = useCareer();

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
          <div className="flex items-center justify-center gap-2">
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
        </motion.div>

        {/* Support Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
        >
          {sortedSupportInventory.map((supportKey, idx) => {
            const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
            if (!support) return null;

            const isSelected = selectedSupports.includes(supportKey);
            const trainerImage = getSupportImageFromCardName(support.name);

            const statBonuses = Object.entries(support.baseStatIncrease)
              .filter(([stat, value]) => value > 0)
              .map(([stat, value]) => `${stat}: +${value}`)
              .join(', ');

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
                className={`bg-white rounded-2xl shadow-card p-4 cursor-pointer transition ${
                  isSelected ? 'ring-4 ring-pocket-green' : 'hover:shadow-card-hover'
                }`}
                style={{ borderLeft: `4px solid ${getRarityColor(support.rarity)}` }}
              >
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
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: getRarityColor(support.rarity) }}
                        >
                          {support.rarity}
                        </span>
                        <h3 className="text-sm font-bold text-pocket-text mt-1">{support.name}</h3>
                        <LimitBreakDiamonds level={getSupportLimitBreak(supportKey)} size={8} className="mt-1" />
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-pocket-green flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {support.supportType && (
                  <p
                    className="text-xs font-bold mb-2"
                    style={{
                      color: TYPE_COLORS[
                        support.supportType === 'Attack'
                          ? 'Fire'
                          : support.supportType === 'Defense'
                          ? 'Water'
                          : support.supportType === 'HP'
                          ? 'Grass'
                          : support.supportType === 'Instinct'
                          ? 'Psychic'
                          : 'Electric'
                      ]
                    }}
                  >
                    Focus: {support.supportType}
                  </p>
                )}

                <p className="text-xs text-pocket-text-light italic mb-3">{support.description || support.effect?.description}</p>

                <div className="bg-pocket-bg rounded-xl p-2 mb-2 text-xs space-y-1">
                  {statBonuses && <div className="font-bold text-pocket-green">{statBonuses}</div>}
                  <div className="text-pocket-text-light">
                    Type Bonus: +{support.typeBonusTraining} (Max: +{support.friendshipBonusTraining})
                  </div>
                  <div className="text-pocket-text-light">Other Stats: +{support.generalBonusTraining}</div>

                  {/* Special Effects - new format */}
                  {support.specialEffect && (
                    <div className="border-t border-gray-200 pt-1 mt-1 text-type-psychic font-semibold">
                      {support.specialEffect.statGainMultiplier && (
                        <div>Stat Gain: {support.specialEffect.statGainMultiplier}x</div>
                      )}
                      {support.specialEffect.failRateReduction && (
                        <div>Fail Rate: -{(support.specialEffect.failRateReduction * 100).toFixed(0)}%</div>
                      )}
                      {support.specialEffect.maxEnergyBonus && (
                        <div>Max Energy: +{support.specialEffect.maxEnergyBonus}</div>
                      )}
                      {support.specialEffect.restBonus && (
                        <div>Rest Bonus: +{support.specialEffect.restBonus}</div>
                      )}
                      {support.specialEffect.energyRegenBonus && (
                        <div>Energy Regen: +{support.specialEffect.energyRegenBonus}</div>
                      )}
                      {support.specialEffect.skillPointMultiplier && (
                        <div>SP Mult: {support.specialEffect.skillPointMultiplier}x</div>
                      )}
                      {support.specialEffect.friendshipGainBonus && (
                        <div>Friend Gain: +{support.specialEffect.friendshipGainBonus}</div>
                      )}
                      {support.specialEffect.energyCostReduction && (
                        <div>Energy Cost: -{support.specialEffect.energyCostReduction}</div>
                      )}
                    </div>
                  )}
                </div>

                {support.moveHints && support.moveHints.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2 text-xs">
                    <div className="font-bold text-blue-700 mb-1">Move Hints:</div>
                    <div className="flex flex-wrap gap-1">
                      {support.moveHints.map((move, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                          {move}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-[10px] text-pocket-text-light">
                  <span>Appears: {Math.round(support.appearanceChance * 100)}%</span>
                  <span>Start Friend: {support.initialFriendship}</span>
                </div>
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
    </div>
  );
};

export default SupportSelectionScreen;
