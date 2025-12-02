/**
 * InspirationSelectionScreen Component
 *
 * Allows users to select up to 2 trained Pokemon as inspirations.
 * Inspirations provide stat bonuses and aptitude upgrades at turns 11, 23, 35, 47, 59.
 *
 * UI Features:
 * - 2 inspiration slots with tabs (like Uma Musume legacy screen)
 * - Click empty tab to open selection modal
 * - Condensed star display on each tab
 * - Stat/aptitude summary panel showing bonuses
 */

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Star, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { generatePokemonSprite, StatIcon, getAptitudeColor } from '../utils/gameUtils';
import { TypeIcon } from '../components/TypeIcon';
import { EVOLUTION_CHAINS, POKEMON } from '../shared/gameData';

// Helper function to get all Pokemon in the same evolution chain
const getEvolutionChainMembers = (pokemonName) => {
  if (EVOLUTION_CHAINS[pokemonName]) {
    const chain = EVOLUTION_CHAINS[pokemonName];
    const members = [pokemonName, chain.stage1];
    if (chain.stage2) members.push(chain.stage2);
    return members;
  }

  for (const [basePokemon, chain] of Object.entries(EVOLUTION_CHAINS)) {
    if (chain.stage1 === pokemonName || chain.stage2 === pokemonName) {
      const members = [basePokemon, chain.stage1];
      if (chain.stage2) members.push(chain.stage2);
      return members;
    }
  }

  return [pokemonName];
};

const areInSameEvolutionChain = (pokemon1Name, pokemon2Name) => {
  if (pokemon1Name === pokemon2Name) return true;
  const chain1 = getEvolutionChainMembers(pokemon1Name);
  return chain1.includes(pokemon2Name);
};

const colorToType = {
  Red: 'Fire',
  Blue: 'Water',
  Green: 'Grass',
  Yellow: 'Electric',
  Purple: 'Psychic',
  Orange: 'Fighting'
};

const InspirationSelectionScreen = () => {
  const {
    selectedPokemon,
    selectedInspirations,
    setSelectedInspirations,
    setGameState,
    inspirationSortMode,
    setInspirationSortMode
  } = useGame();

  const { trainedPokemon } = useInventory();

  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null); // null or 0 or 1
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate total bonuses from selected inspirations
  const calculateBonuses = () => {
    const statBonuses = {};
    const aptitudeStars = {};
    const strategyStars = {};

    selectedInspirations.forEach(insp => {
      if (!insp.inspirations) return;

      // Stat bonuses
      if (insp.inspirations.stat) {
        const statName = insp.inspirations.stat.name;
        const stars = insp.inspirations.stat.stars;
        const bonus = stars === 1 ? 10 : stars === 2 ? 25 : 50;
        statBonuses[statName] = (statBonuses[statName] || 0) + bonus;
      }

      // Aptitude stars
      if (insp.inspirations.aptitude) {
        const color = insp.inspirations.aptitude.color;
        aptitudeStars[color] = (aptitudeStars[color] || 0) + (insp.inspirations.aptitude.stars || 0);
      }

      // Strategy stars
      if (insp.inspirations.strategy) {
        const strategyName = insp.inspirations.strategy.name;
        strategyStars[strategyName] = (strategyStars[strategyName] || 0) + (insp.inspirations.strategy.stars || 0);
      }
    });

    // Calculate grade upgrades (2 stars = 1 grade)
    const aptitudeUpgrades = {};
    Object.keys(aptitudeStars).forEach(color => {
      aptitudeUpgrades[color] = Math.floor(aptitudeStars[color] / 2);
    });

    const strategyUpgrades = {};
    Object.keys(strategyStars).forEach(strategyName => {
      strategyUpgrades[strategyName] = Math.floor(strategyStars[strategyName] / 2);
    });

    return { statBonuses, aptitudeUpgrades, strategyUpgrades };
  };

  // Apply bonuses to show final stats/aptitudes
  const getModifiedStatsAndAptitudes = () => {
    if (!selectedPokemon) return null;
    const pokemonData = POKEMON[selectedPokemon];
    if (!pokemonData) return null;

    const { statBonuses, aptitudeUpgrades, strategyUpgrades } = calculateBonuses();

    // Base stats with bonuses
    const baseStats = pokemonData.baseStats || { HP: 150, Attack: 50, Defense: 50, Instinct: 50, Speed: 50 };
    const modifiedStats = { ...baseStats };
    Object.keys(statBonuses).forEach(stat => {
      if (modifiedStats[stat] !== undefined) {
        modifiedStats[stat] += statBonuses[stat];
      }
    });

    // Type aptitudes with upgrades (capped at A)
    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const maxIndex = gradeOrder.indexOf('A');
    const typeAptitudes = { ...pokemonData.typeAptitudes };
    Object.keys(aptitudeUpgrades).forEach(color => {
      const currentGrade = typeAptitudes[color];
      const currentIndex = gradeOrder.indexOf(currentGrade);
      const newIndex = Math.min(currentIndex + aptitudeUpgrades[color], maxIndex);
      typeAptitudes[color] = gradeOrder[newIndex];
    });

    // Strategy aptitudes with upgrades (capped at A)
    const strategyAptitudes = { ...pokemonData.strategyAptitudes };
    Object.keys(strategyUpgrades).forEach(strategyName => {
      if (strategyAptitudes[strategyName]) {
        const currentGrade = strategyAptitudes[strategyName];
        const currentIndex = gradeOrder.indexOf(currentGrade);
        const newIndex = Math.min(currentIndex + strategyUpgrades[strategyName], maxIndex);
        strategyAptitudes[strategyName] = gradeOrder[newIndex];
      }
    });

    return {
      baseStats: pokemonData.baseStats,
      modifiedStats,
      originalTypeAptitudes: pokemonData.typeAptitudes,
      typeAptitudes,
      originalStrategyAptitudes: pokemonData.strategyAptitudes,
      strategyAptitudes,
      statBonuses,
      aptitudeUpgrades,
      strategyUpgrades
    };
  };

  // Sort trained pokemon
  const sortTrainedByInspiration = (pokemon) => {
    return [...pokemon].sort((a, b) => {
      const getTotalStars = (p) => {
        if (!p.inspirations || !p.inspirations.stat || !p.inspirations.aptitude) return 0;
        return p.inspirations.stat.stars + p.inspirations.aptitude.stars + (p.inspirations.strategy?.stars || 0);
      };

      if (inspirationSortMode === 'stat') {
        const statA = a.inspirations?.stat?.name || '';
        const statB = b.inspirations?.stat?.name || '';
        const statCompare = statA.localeCompare(statB);
        if (statCompare !== 0) return statCompare;
        return getTotalStars(b) - getTotalStars(a);
      } else if (inspirationSortMode === 'aptitude') {
        const aptA = colorToType[a.inspirations?.aptitude?.name] || a.inspirations?.aptitude?.name || '';
        const aptB = colorToType[b.inspirations?.aptitude?.name] || b.inspirations?.aptitude?.name || '';
        const aptCompare = aptA.localeCompare(aptB);
        if (aptCompare !== 0) return aptCompare;
        return getTotalStars(b) - getTotalStars(a);
      } else {
        return getTotalStars(b) - getTotalStars(a);
      }
    });
  };

  const sortedTrainedPokemon = sortTrainedByInspiration(trainedPokemon);

  const handleSlotClick = (slotIndex) => {
    setSelectedSlotIndex(slotIndex);
    setIsModalOpen(true);
  };

  const handleSelectInspiration = (trained) => {
    if (selectedSlotIndex === null) return;

    const newInspirations = [...selectedInspirations];
    newInspirations[selectedSlotIndex] = trained;
    setSelectedInspirations(newInspirations);
    setIsModalOpen(false);
    setSelectedSlotIndex(null);
  };

  const handleRemoveInspiration = (slotIndex) => {
    const newInspirations = [...selectedInspirations];
    newInspirations[slotIndex] = null;
    setSelectedInspirations(newInspirations.filter(i => i !== null));
  };

  const modifiedData = getModifiedStatsAndAptitudes();

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
              setSelectedInspirations([]);
              setInspirationSortMode('stars');
              setGameState('pokemonSelect');
            }}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-type-psychic" />
            <span className="font-bold text-pocket-text">Select Inspirations</span>
          </div>
          <span className="text-pocket-text-light text-sm font-semibold">
            {selectedInspirations.length}/2
          </span>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* Pokemon Info Card - Career Screen Style */}
        {modifiedData && selectedPokemon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-4 mb-4"
          >
            <div className="flex items-center gap-4">
              {/* Pokemon Sprite */}
              <div className="w-20 h-20">
                {generatePokemonSprite(selectedPokemon, selectedPokemon)}
              </div>

              {/* Pokemon Name and Strategy */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-pocket-text mb-2">{selectedPokemon}</h2>

                {/* Strategy Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded">
                    ⚔ {modifiedData.strategyAptitudes && Object.entries(modifiedData.strategyAptitudes).reduce((best, [strat, grade]) => {
                      const gradeRank = { 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
                      const currentRank = gradeRank[grade] || 0;
                      const bestRank = gradeRank[best.grade] || 0;
                      return currentRank > bestRank ? { strat, grade } : best;
                    }, { strat: 'Chipper', grade: 'F' }).strat}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3">
                  {['HP', 'Attack', 'Defense', 'Instinct', 'Speed'].map((stat) => {
                    const hasBonus = modifiedData.statBonuses[stat];
                    const value = modifiedData.modifiedStats[stat];
                    return (
                      <div key={stat} className="flex items-center gap-1">
                        <StatIcon stat={stat} size={14} />
                        <span className={`font-bold text-sm ${hasBonus ? 'text-orange-500' : 'text-pocket-text'}`}>
                          {value}
                        </span>
                        {hasBonus && <span className="text-xs text-orange-500">(+{modifiedData.statBonuses[stat]})</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Type Aptitudes */}
                <div className="flex flex-wrap gap-2 mb-2 text-xs">
                  {Object.entries(modifiedData.typeAptitudes).map(([color, grade]) => {
                    const hasUpgrade = modifiedData.aptitudeUpgrades[color];
                    const typeMap = {
                      Red: 'Fire',
                      Blue: 'Water',
                      Green: 'Grass',
                      Purple: 'Psychic',
                      Yellow: 'Electric',
                      Orange: 'Fighting'
                    };
                    const type = typeMap[color];

                    return (
                      <span key={color} className={`inline-flex items-center gap-0.5 ${hasUpgrade ? 'text-orange-500' : ''}`}>
                        <TypeIcon type={type} size={14} />
                        <span style={{ color: hasUpgrade ? '#f97316' : getAptitudeColor(grade), fontWeight: 'bold' }}>{grade}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Strategy Aptitudes */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(modifiedData.strategyAptitudes).map(([strategy, grade]) => {
                    const hasUpgrade = modifiedData.strategyUpgrades[strategy];
                    return (
                      <span key={strategy} className={`${hasUpgrade ? 'text-orange-500' : 'text-gray-600'}`}>
                        {strategy} <span style={{ color: hasUpgrade ? '#f97316' : getAptitudeColor(grade), fontWeight: 'bold' }}>{grade}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Inspiration Slots - Uma Musume style tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          <p className="text-sm text-pocket-text-light text-center mb-4">
            Choose trained Pokemon to inspire your career at turns 11, 23, 35, 47, and 59
          </p>

          <div className="flex gap-3 mb-4">
            {[0, 1].map(slotIndex => {
              const inspiration = selectedInspirations[slotIndex];
              return (
                <motion.div
                  key={slotIndex}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSlotClick(slotIndex)}
                  className={`flex-1 relative rounded-xl border-2 cursor-pointer transition-all p-3 ${
                    inspiration
                      ? 'border-pocket-green bg-green-50'
                      : 'border-dashed border-gray-300 bg-gray-50 hover:border-pocket-blue hover:bg-blue-50'
                  }`}
                >
                  {inspiration ? (
                    <>
                      {/* Tab label */}
                      <div className="text-[10px] font-bold text-pocket-text-light mb-2">
                        LEGACY {slotIndex + 1}
                      </div>

                      {/* Pokemon sprite and name */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-12 h-12">
                          {generatePokemonSprite(inspiration.type, inspiration.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-pocket-text text-sm">{inspiration.name}</h3>
                        </div>
                      </div>

                      {/* Condensed star info */}
                      {inspiration.inspirations && (
                        <div className="space-y-1">
                          {/* Stat */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-pocket-text-light">{inspiration.inspirations.stat?.name}</span>
                            <div className="flex gap-0.5">
                              {[...Array(inspiration.inspirations.stat?.stars || 0)].map((_, i) => (
                                <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          {/* Aptitude */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-pocket-text-light">
                              {colorToType[inspiration.inspirations.aptitude?.name] || inspiration.inspirations.aptitude?.name}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(inspiration.inspirations.aptitude?.stars || 0)].map((_, i) => (
                                <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          {/* Strategy */}
                          {inspiration.inspirations.strategy && (
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-pocket-text-light">{inspiration.inspirations.strategy.name}</span>
                              <div className="flex gap-0.5">
                                {[...Array(inspiration.inspirations.strategy.stars)].map((_, i) => (
                                  <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveInspiration(slotIndex);
                        }}
                        className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Empty slot */}
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-pocket-text-light mb-2">
                          LEGACY {slotIndex + 1}
                        </div>
                        <div className="flex items-center justify-center h-20">
                          <Plus size={32} className="text-gray-400" />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setGameState('supportSelect')}
            className="w-full pocket-btn-primary py-4 text-lg"
          >
            Continue to Support Selection
          </button>
        </motion.div>
      </div>

      {/* Selection Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSlotIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsModalOpen(false);
              setSelectedSlotIndex(null);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-white rounded-2xl shadow-card-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3">
                <h3 className="font-bold text-pocket-text text-center">
                  Select Inspiration for Legacy {selectedSlotIndex + 1}
                </h3>

                {/* Sort Options */}
                <div className="flex justify-center gap-2 mt-3">
                  {['stars', 'stat', 'aptitude'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setInspirationSortMode(mode)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                        inspirationSortMode === mode
                          ? 'bg-type-psychic text-white'
                          : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                      }`}
                    >
                      {mode === 'stars' ? 'Total Stars' : mode === 'stat' ? 'By Stat' : 'By Type'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pokemon Grid */}
              <div className="p-4 overflow-y-auto flex-1">
                {trainedPokemon.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-pocket-text-light">No trained Pokemon available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sortedTrainedPokemon.map((trained, idx) => {
                      const isAlreadySelected = selectedInspirations.some(
                        insp => insp && insp.name === trained.name && insp.completedAt === trained.completedAt
                      );
                      const isSameSpecies = selectedPokemon && trained.name === selectedPokemon;
                      const isInEvolutionChain = selectedPokemon && !isSameSpecies && areInSameEvolutionChain(selectedPokemon, trained.name);
                      const isDisabled = isSameSpecies || isInEvolutionChain || isAlreadySelected;

                      const totalStars = trained.inspirations
                        ? (trained.inspirations.stat?.stars || 0) + (trained.inspirations.aptitude?.stars || 0) + (trained.inspirations.strategy?.stars || 0)
                        : 0;

                      return (
                        <motion.div
                          key={idx}
                          whileHover={!isDisabled ? { y: -2, scale: 1.02 } : {}}
                          whileTap={!isDisabled ? { scale: 0.98 } : {}}
                          onClick={() => {
                            if (!isDisabled) {
                              handleSelectInspiration(trained);
                            }
                          }}
                          className={`pokemon-card transition-all duration-200 cursor-pointer ${
                            isDisabled ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex justify-center mb-2">
                            {generatePokemonSprite(trained.type, trained.name)}
                          </div>
                          <h3 className="text-center font-bold text-pocket-text text-sm">{trained.name}</h3>

                          {isSameSpecies && (
                            <div className="text-[10px] font-bold text-pocket-red text-center mt-1">
                              Can't use same species
                            </div>
                          )}

                          {isInEvolutionChain && (
                            <div className="text-[10px] font-bold text-pocket-red text-center mt-1">
                              Same evolution line
                            </div>
                          )}

                          {isAlreadySelected && (
                            <div className="text-[10px] font-bold text-pocket-blue text-center mt-1">
                              Already selected
                            </div>
                          )}

                          {trained.inspirations && totalStars > 0 && (
                            <div className="flex justify-center gap-0.5 mt-2 mb-2">
                              {[...Array(totalStars)].map((_, i) => (
                                <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          )}

                          {trained.inspirations && trained.inspirations.stat && trained.inspirations.aptitude && (
                            <div className="bg-pocket-bg rounded-lg p-2 space-y-1 mt-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-pocket-text">{trained.inspirations.stat.name}</span>
                                <div className="flex gap-0.5">
                                  {[...Array(trained.inspirations.stat.stars)].map((_, i) => (
                                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-pocket-text">
                                  {colorToType[trained.inspirations.aptitude.name] || trained.inspirations.aptitude.name}
                                </span>
                                <div className="flex gap-0.5">
                                  {[...Array(trained.inspirations.aptitude.stars)].map((_, i) => (
                                    <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                                  ))}
                                </div>
                              </div>
                              {trained.inspirations.strategy && (
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-semibold text-pocket-text">{trained.inspirations.strategy.name}</span>
                                  <div className="flex gap-0.5">
                                    {[...Array(trained.inspirations.strategy.stars)].map((_, i) => (
                                      <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InspirationSelectionScreen;
