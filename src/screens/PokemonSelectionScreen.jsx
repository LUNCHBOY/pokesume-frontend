/**
 * PokemonSelectionScreen Component
 *
 * Allows users to select a Pokemon from their inventory to start a career.
 * Displays Pokemon with stats, grade, and rarity.
 */

import React from 'react';
import { ArrowLeft, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getPokemonRarity,
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

const PokemonSelectionScreen = () => {
  const {
    setSelectedPokemon,
    setGameState,
    pokemonSortBy,
    setPokemonSortBy,
    pokemonFilterType,
    setPokemonFilterType
  } = useGame();

  const { pokemonInventory, getPokemonLimitBreak } = useInventory();

  // Sort pokemon inventory
  const sortPokemon = (inventory) => {
    const sorted = [...inventory].filter(name => POKEMON[name]);

    // Apply type filter
    const filtered = pokemonFilterType === 'all'
      ? sorted
      : sorted.filter(name => POKEMON[name]?.primaryType === pokemonFilterType);

    switch (pokemonSortBy) {
      case 'type':
        return filtered.sort((a, b) => {
          const typeA = POKEMON[a]?.primaryType || 'Normal';
          const typeB = POKEMON[b]?.primaryType || 'Normal';
          return typeA.localeCompare(typeB);
        });
      case 'rarity':
        return filtered.sort((a, b) => {
          const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
          const rarityA = getPokemonRarity(a);
          const rarityB = getPokemonRarity(b);
          const valueA = rarityOrder[rarityA] !== undefined ? rarityOrder[rarityA] : 999;
          const valueB = rarityOrder[rarityB] !== undefined ? rarityOrder[rarityB] : 999;
          return valueA - valueB;
        });
      case 'name':
        return filtered.sort((a, b) => a.localeCompare(b));
      default:
        return filtered;
    }
  };

  const sortedInventory = sortPokemon(pokemonInventory);

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
            <Swords size={20} className="text-pocket-red" />
            <span className="font-bold text-pocket-text">Select Pokemon</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
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
            {['all', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Normal'].map(type => (
              <button
                key={type}
                onClick={() => setPokemonFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  pokemonFilterType === type
                    ? type === 'all' ? 'bg-pocket-red text-white' : 'text-white'
                    : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
                style={pokemonFilterType === type && type !== 'all' ? { backgroundColor: TYPE_COLORS[type] } : {}}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pokemon Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {sortedInventory.map((pokemonName, idx) => {
            const pokemon = POKEMON[pokemonName];
            if (!pokemon) return null;

            return (
              <motion.button
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPokemon(pokemonName);
                  setGameState('inspirationSelect');
                }}
                className="bg-white rounded-2xl shadow-card p-4 text-left transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-pocket-text">{pokemonName}</h3>
                      <LimitBreakDiamonds level={getPokemonLimitBreak(pokemonName)} size={10} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <TypeBadge type={pokemon.primaryType} size={12} />
                    </div>
                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-pocket-text-light">
                      <span className="flex items-center gap-1">
                        <StatIcon stat="HP" size={10} /> {pokemon.baseStats.HP}
                      </span>
                      <span className="flex items-center gap-1">
                        <StatIcon stat="Attack" size={10} /> {pokemon.baseStats.Attack}
                      </span>
                      <span className="flex items-center gap-1">
                        <StatIcon stat="Defense" size={10} /> {pokemon.baseStats.Defense}
                      </span>
                      <span className="flex items-center gap-1">
                        <StatIcon stat="Instinct" size={10} /> {pokemon.baseStats.Instinct}
                      </span>
                      <span className="flex items-center gap-1">
                        <StatIcon stat="Speed" size={10} /> {pokemon.baseStats.Speed}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {sortedInventory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pocket-bg flex items-center justify-center">
              <Swords size={32} className="text-pocket-text-light" />
            </div>
            <p className="text-pocket-text mb-2">
              {pokemonFilterType === 'all'
                ? "You don't have any playable Pokemon yet!"
                : `No ${pokemonFilterType} type Pokemon found!`}
            </p>
            {pokemonFilterType === 'all' && (
              <p className="text-sm text-pocket-text-light mb-4">
                Roll for starter Pokemon: Charmander, Squirtle, Bulbasaur, Pikachu, or Gastly.
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

export default PokemonSelectionScreen;
