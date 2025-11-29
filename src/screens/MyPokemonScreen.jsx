/**
 * MyPokemonScreen Component
 *
 * Displays the user's Pokemon inventory with sorting and filtering.
 * Allows viewing all owned Pokemon with their stats, grade, and rarity.
 * Supports limit breaking Pokemon using shards.
 */

import React, { useState } from 'react';
import { ArrowLeft, Box, Diamond, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getPokemonRarity,
  getRarityColor,
  StatIcon
} from '../utils/gameUtils';
import { TypeBadge, TYPE_COLORS } from '../components/TypeIcon';
import { POKEMON } from '../shared/gameData';
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

const MyPokemonScreen = () => {
  const {
    setGameState,
    pokemonSortBy,
    setPokemonSortBy,
    pokemonFilterType,
    setPokemonFilterType
  } = useGame();

  const {
    pokemonInventory,
    pokemonInventoryFull,
    getPokemonLimitBreak,
    limitBreakPokemonWithShards,
    limitBreakShards,
    MAX_LIMIT_BREAK,
    SHARD_COST_PER_LIMIT_BREAK
  } = useInventory();

  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isLimitBreaking, setIsLimitBreaking] = useState(false);

  // Sort pokemon inventory
  const sortPokemon = (inventory) => {
    const sorted = [...inventory];
    switch (pokemonSortBy) {
      case 'type':
        return sorted.sort((a, b) => {
          const typeA = POKEMON[a]?.primaryType || 'Normal';
          const typeB = POKEMON[b]?.primaryType || 'Normal';
          return typeA.localeCompare(typeB);
        });
      case 'rarity':
        return sorted.sort((a, b) => {
          const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
          const rarityA = getPokemonRarity(a);
          const rarityB = getPokemonRarity(b);
          const valueA = rarityOrder[rarityA] !== undefined ? rarityOrder[rarityA] : 999;
          const valueB = rarityOrder[rarityB] !== undefined ? rarityOrder[rarityB] : 999;
          return valueA - valueB;
        });
      case 'name':
        return sorted.sort((a, b) => a.localeCompare(b));
      default:
        return sorted;
    }
  };

  // Filter inventory by type
  const filteredInventory = pokemonFilterType === 'all'
    ? pokemonInventory
    : pokemonInventory.filter(name => POKEMON[name]?.primaryType === pokemonFilterType);

  const sortedInventory = sortPokemon(filteredInventory);

  // Get Pokemon ID from full inventory
  const getPokemonId = (pokemonName) => {
    const pokemon = pokemonInventoryFull.find(p => p.pokemon_name === pokemonName);
    return pokemon?.id;
  };

  // Handle limit break confirmation
  const handleLimitBreak = async () => {
    if (!selectedPokemon) return;

    const pokemonId = getPokemonId(selectedPokemon);
    if (!pokemonId) return;

    setIsLimitBreaking(true);
    const result = await limitBreakPokemonWithShards(pokemonId);
    setIsLimitBreaking(false);

    if (result && result.success) {
      // Keep modal open to show updated level, user can close manually
    } else {
      alert('Failed to limit break Pokemon. Please try again.');
    }
  };

  const currentLimitBreak = selectedPokemon ? getPokemonLimitBreak(selectedPokemon) : 0;
  const canLimitBreak = currentLimitBreak < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;

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
            <Box size={20} className="text-pocket-green" />
            <span className="font-bold text-pocket-text">My Pokemon</span>
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
            {['default', 'name', 'type', 'rarity'].map(sort => (
              <button
                key={sort}
                onClick={() => setPokemonSortBy(sort)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  pokemonSortBy === sort
                    ? 'bg-pocket-red text-white'
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
            <button
              onClick={() => setPokemonFilterType('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                pokemonFilterType === 'all'
                  ? 'bg-pocket-blue text-white'
                  : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Normal'].map(type => (
              <button
                key={type}
                onClick={() => setPokemonFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  pokemonFilterType === type ? 'text-white' : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
                style={pokemonFilterType === type ? { backgroundColor: TYPE_COLORS[type] } : {}}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Instruction hint */}
          <p className="text-xs text-pocket-text-light mt-3 text-center">
            Tap a Pokemon to limit break using shards
          </p>
        </motion.div>

        {/* Pokemon Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {sortedInventory.map((pokemonName, idx) => {
            const pokemon = POKEMON[pokemonName];
            const limitBreakLevel = getPokemonLimitBreak(pokemonName);
            if (!pokemon) {
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="pokemon-card"
                >
                  <div className="mb-2">
                    {generatePokemonSprite('Normal', pokemonName)}
                  </div>
                  <h3 className="font-bold text-pocket-text">{pokemonName}</h3>
                  <p className="text-xs text-pocket-text-light">Coming Soon</p>
                </motion.div>
              );
            }
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPokemon(pokemonName)}
                className="pokemon-card cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all"
                style={{ borderLeft: `4px solid ${getRarityColor(getPokemonRarity(pokemonName))}` }}
              >
                {/* Rarity badge at top */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: getRarityColor(getPokemonRarity(pokemonName)) }}
                  >
                    {getPokemonRarity(pokemonName)}
                  </span>
                  <Box size={14} className="text-pocket-green" />
                </div>
                <div className="mb-2">
                  {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h3 className="font-bold text-pocket-text text-sm">{pokemonName}</h3>
                  <LimitBreakDiamonds level={limitBreakLevel} size={8} />
                </div>
                <div className="my-2">
                  <TypeBadge type={pokemon.primaryType} size={14} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-pocket-text-light">
                  <div className="flex items-center gap-1">
                    <StatIcon stat="HP" size={10} />
                    <span>{pokemon.baseStats.HP}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Attack" size={10} />
                    <span>{pokemon.baseStats.Attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Defense" size={10} />
                    <span>{pokemon.baseStats.Defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Instinct" size={10} />
                    <span>{pokemon.baseStats.Instinct}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2 justify-center">
                    <StatIcon stat="Speed" size={10} />
                    <span>{pokemon.baseStats.Speed}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {pokemonInventory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pocket-bg flex items-center justify-center">
              <Box size={32} className="text-pocket-text-light" />
            </div>
            <p className="text-pocket-text-light">No Pokemon yet! Roll for some Pokemon to get started.</p>
          </motion.div>
        )}
      </div>

      {/* Limit Break Modal */}
      <AnimatePresence>
        {selectedPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPokemon(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-card-lg p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPokemon(null)}
                className="absolute top-4 right-4 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Pokemon info */}
              <div className="text-center mb-4">
                <div className="mb-3 flex justify-center">
                  {generatePokemonSprite(POKEMON[selectedPokemon]?.primaryType || 'Normal', selectedPokemon)}
                </div>
                <h3 className="font-bold text-xl text-pocket-text mb-2">{selectedPokemon}</h3>
                <div className="flex justify-center mb-3">
                  <LimitBreakDiamonds level={currentLimitBreak} size={16} />
                </div>
                <p className="text-sm text-pocket-text-light">
                  Limit Break Level: {currentLimitBreak} / {MAX_LIMIT_BREAK}
                </p>
                {currentLimitBreak > 0 && (
                  <p className="text-sm text-pocket-green font-semibold">
                    +{currentLimitBreak * 5}% Base Stats
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
                    Next level: +{(currentLimitBreak + 1) * 5}% Base Stats
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
                    This Pokemon is at full power (+20% Base Stats)
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelectedPokemon(null)}
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

export default MyPokemonScreen;
