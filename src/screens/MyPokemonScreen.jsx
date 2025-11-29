/**
 * MyPokemonScreen Component
 *
 * Displays the user's Pokemon inventory with sorting and filtering.
 * Allows viewing all owned Pokemon with their stats, grade, and rarity.
 */

import React from 'react';
import { ArrowLeft, Box } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const { pokemonInventory, getPokemonLimitBreak } = useInventory();

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
          <span className="text-pocket-text-light text-sm font-semibold">
            {pokemonInventory.length} owned
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
                className="pokemon-card"
              >
                <div className="mb-2">
                  {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h3 className="font-bold text-pocket-text text-sm">{pokemonName}</h3>
                  <LimitBreakDiamonds level={getPokemonLimitBreak(pokemonName)} size={8} />
                </div>
                <div className="my-2">
                  <TypeBadge type={pokemon.primaryType} size={14} />
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: getRarityColor(getPokemonRarity(pokemonName)) }}
                  >
                    {getPokemonRarity(pokemonName)}
                  </span>
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
    </div>
  );
};

export default MyPokemonScreen;
