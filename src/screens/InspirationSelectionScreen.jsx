/**
 * InspirationSelectionScreen Component
 *
 * Allows users to select up to 2 trained Pokemon as inspirations.
 * Inspirations provide stat bonuses and aptitude upgrades at turns 11, 23, 35, 47, 59.
 */

import React from 'react';
import { ArrowLeft, Sparkles, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { generatePokemonSprite } from '../utils/gameUtils';
import { EVOLUTION_CHAINS } from '../shared/gameData';

// Helper function to get all Pokemon in the same evolution chain
const getEvolutionChainMembers = (pokemonName) => {
  // Check if this Pokemon is a base form with evolutions
  if (EVOLUTION_CHAINS[pokemonName]) {
    const chain = EVOLUTION_CHAINS[pokemonName];
    const members = [pokemonName, chain.stage1];
    if (chain.stage2) members.push(chain.stage2);
    return members;
  }

  // Check if this Pokemon is an evolution of something else
  for (const [basePokemon, chain] of Object.entries(EVOLUTION_CHAINS)) {
    if (chain.stage1 === pokemonName || chain.stage2 === pokemonName) {
      const members = [basePokemon, chain.stage1];
      if (chain.stage2) members.push(chain.stage2);
      return members;
    }
  }

  // No evolution chain found, return just this Pokemon
  return [pokemonName];
};

// Check if two Pokemon are in the same evolution chain
const areInSameEvolutionChain = (pokemon1Name, pokemon2Name) => {
  if (pokemon1Name === pokemon2Name) return true;
  const chain1 = getEvolutionChainMembers(pokemon1Name);
  return chain1.includes(pokemon2Name);
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

  // Sort trained pokemon by inspiration
  const sortTrainedByInspiration = (pokemon) => {
    return [...pokemon].sort((a, b) => {
      const getTotalStars = (p) => {
        if (!p.inspirations || !p.inspirations.stat || !p.inspirations.aptitude) return 0;
        return p.inspirations.stat.stars + p.inspirations.aptitude.stars + (p.inspirations.strategy?.stars || 0);
      };

      // Primary sort by mode
      if (inspirationSortMode === 'stat') {
        const statA = a.inspirations?.stat?.name || '';
        const statB = b.inspirations?.stat?.name || '';
        const statCompare = statA.localeCompare(statB);
        if (statCompare !== 0) return statCompare;
        return getTotalStars(b) - getTotalStars(a);
      } else if (inspirationSortMode === 'aptitude') {
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
        return getTotalStars(b) - getTotalStars(a);
      } else {
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
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          <p className="text-sm text-pocket-text-light text-center">
            Choose trained Pokemon to inspire your career at turns 11, 23, 35, 47, and 59
          </p>

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
        </motion.div>

        {/* Trained Pokemon Grid */}
        {trainedPokemon.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pocket-bg flex items-center justify-center">
              <Sparkles size={32} className="text-pocket-text-light" />
            </div>
            <p className="text-pocket-text mb-2">No trained Pokemon yet</p>
            <p className="text-sm text-pocket-text-light mb-4">
              You can continue without inspirations.
            </p>
            <button
              onClick={() => setGameState('supportSelect')}
              className="pocket-btn-primary px-6 py-3"
            >
              Continue to Support Selection
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4"
            >
            {sortedTrainedPokemon.map((trained, idx) => {
              const isSelected = selectedInspirations.some(
                insp => insp.name === trained.name && insp.completedAt === trained.completedAt
              );
              const isSameSpecies = selectedPokemon && trained.name === selectedPokemon.name;
              const isInEvolutionChain = selectedPokemon && !isSameSpecies && areInSameEvolutionChain(selectedPokemon.name, trained.name);
              const isDisabled = isSameSpecies || isInEvolutionChain;
            
              const totalStars = trained.inspirations
                ? (trained.inspirations.stat?.stars || 0) + (trained.inspirations.aptitude?.stars || 0) + (trained.inspirations.strategy?.stars || 0)
                : 0;
            
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={!isDisabled ? { y: -2, scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  onClick={() => {
                    if (isDisabled) return;
                
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
                  className={`pokemon-card transition-all ${
                    isSelected ? 'ring-4 ring-pocket-green' : ''
                  } ${
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {generatePokemonSprite(trained.type, trained.name)}
                  </div>
                  <h3 className="text-center font-bold text-pocket-text text-sm">{trained.name}</h3>
                
                  {/* Same Species Warning */}
                  {isSameSpecies && (
                    <div className="text-[10px] font-bold text-pocket-red text-center mt-1">
                      Can't use same species
                    </div>
                  )}
                
                  {/* Evolution Chain Warning */}
                  {isInEvolutionChain && (
                    <div className="text-[10px] font-bold text-pocket-red text-center mt-1">
                      Same evolution line
                    </div>
                  )}
                
                  {/* Total Stars Display */}
                  {trained.inspirations && totalStars > 0 && (
                    <div className="flex justify-center gap-0.5 mt-2 mb-2">
                      {[...Array(totalStars)].map((_, i) => (
                        <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  )}
                
                  {/* Inspirations Display */}
                  {trained.inspirations && trained.inspirations.stat && trained.inspirations.aptitude ? (
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
                  ) : (
                    <div className="text-[10px] font-bold text-pocket-red text-center mt-2">No Inspirations</div>
                  )}
                </motion.div>
                              );
                            })}
                            </motion.div>
      
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <button
                      onClick={() => setGameState('supportSelect')}
                      disabled={selectedInspirations.length > 2}
                      className="w-full pocket-btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Support Selection
                    </button>
                  </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default InspirationSelectionScreen;



