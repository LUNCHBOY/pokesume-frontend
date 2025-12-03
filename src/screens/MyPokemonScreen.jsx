/**
 * MyPokemonScreen Component
 *
 * Displays the user's Pokemon inventory with sorting and filtering.
 * Allows viewing all owned Pokemon with their stats, grade, and rarity.
 * Supports limit breaking Pokemon using shards.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Box, Diamond, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getPokemonRarity,
  getRarityColor,
  getBestStrategy,
  getAptitudeColor,
  StatIcon
} from '../utils/gameUtils';
import { TypeBadge, TypeIcon, TYPE_COLORS } from '../components/TypeIcon';
import { POKEMON, LEGENDARY_POKEMON } from '../shared/gameData';
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

  const [isLimitBreaking, setIsLimitBreaking] = useState(false);
  const [detailPokemon, setDetailPokemon] = useState(null);

  // Long-press state for detail modal
  const longPressTimerRef = useRef(null);
  const longPressPokemonRef = useRef(null);
  const LONG_PRESS_DURATION = 500; // 500ms hold to trigger

  const handleLongPressStart = useCallback((pokemonName) => {
    longPressPokemonRef.current = pokemonName;
    longPressTimerRef.current = setTimeout(() => {
      setDetailPokemon(longPressPokemonRef.current);
    }, LONG_PRESS_DURATION);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressPokemonRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Color to type mapping for aptitudes
  const colorToType = {
    Red: 'Fire',
    Blue: 'Water',
    Green: 'Grass',
    Yellow: 'Electric',
    Purple: 'Psychic',
    Orange: 'Fighting'
  };

  // Sort pokemon inventory
  const sortPokemon = (inventory) => {
    const sorted = [...inventory];
    switch (pokemonSortBy) {
      case 'type':
        return sorted.sort((a, b) => {
          const typeA = (POKEMON[a] || LEGENDARY_POKEMON[a])?.primaryType || 'Normal';
          const typeB = (POKEMON[b] || LEGENDARY_POKEMON[b])?.primaryType || 'Normal';
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
    : pokemonInventory.filter(name => (POKEMON[name] || LEGENDARY_POKEMON[name])?.primaryType === pokemonFilterType);

  const sortedInventory = sortPokemon(filteredInventory);

  // Get Pokemon ID from full inventory
  const getPokemonId = (pokemonName) => {
    const pokemon = pokemonInventoryFull.find(p => p.pokemon_name === pokemonName);
    return pokemon?.id;
  };

  // Handle limit break confirmation
  const handleLimitBreak = async (pokemonName) => {
    if (!pokemonName) return;

    const pokemonId = getPokemonId(pokemonName);
    if (!pokemonId) return;

    setIsLimitBreaking(true);
    const result = await limitBreakPokemonWithShards(pokemonId);
    setIsLimitBreaking(false);

    if (!result || !result.success) {
      alert('Failed to limit break Pokemon. Please try again.');
    }
    // Keep modal open to show updated level
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
            Hold a Pokemon to view details and limit break
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
            const pokemon = POKEMON[pokemonName] || LEGENDARY_POKEMON[pokemonName];
            const limitBreakLevel = getPokemonLimitBreak(pokemonName);
            if (!pokemon) {
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="pokemon-card"
                >
                  <div className="mb-1">
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
                onMouseDown={() => handleLongPressStart(pokemonName)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(pokemonName)}
                onTouchEnd={handleLongPressEnd}
                className="pokemon-card cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all select-none"
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
                <div className="mb-1">
                  {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                </div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h3 className="font-bold text-pocket-text text-sm">{pokemonName}</h3>
                  <LimitBreakDiamonds level={limitBreakLevel} size={8} />
                </div>
                <div className="flex items-center justify-center gap-2 my-1">
                  <TypeBadge type={pokemon.primaryType} size={14} />
                  {(() => {
                    const bestStrat = getBestStrategy(pokemon.strategyAptitudes);
                    return bestStrat ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: getAptitudeColor(bestStrat.grade) }}
                      >
                        {bestStrat.name}
                      </span>
                    ) : null;
                  })()}
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

      {/* Pokemon Detail Modal (Long Press) */}
      <AnimatePresence>
        {detailPokemon && (POKEMON[detailPokemon] || LEGENDARY_POKEMON[detailPokemon]) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailPokemon(null)}
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
                onClick={() => setDetailPokemon(null)}
                className="absolute top-3 right-3 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {(() => {
                const pokemon = POKEMON[detailPokemon] || LEGENDARY_POKEMON[detailPokemon];
                const rarity = getPokemonRarity(detailPokemon);
                const limitBreakLevel = getPokemonLimitBreak(detailPokemon);
                const statTotal = Object.values(pokemon.baseStats).reduce((a, b) => a + b, 0);

                return (
                  <>
                    {/* Pokemon sprite and name */}
                    <div className="text-center mb-4">
                      <div className="mb-2 flex justify-center">
                        {generatePokemonSprite(pokemon.primaryType, detailPokemon)}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="font-bold text-xl text-pocket-text">{detailPokemon}</h3>
                        <LimitBreakDiamonds level={limitBreakLevel} size={12} />
                      </div>
                      <div className="flex justify-center gap-2 mt-2">
                        <TypeBadge type={pokemon.primaryType} size={16} />
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: getRarityColor(rarity) }}
                        >
                          {rarity}
                        </span>
                        <span className="text-sm text-pocket-text-light">
                          Base Total: {statTotal}
                        </span>
                      </div>
                      {limitBreakLevel > 0 && (
                        <p className="text-sm text-pocket-green font-semibold mt-1">
                          +{limitBreakLevel * 5}% Base Stats from Limit Break
                        </p>
                      )}
                    </div>

                    {/* Base Stats */}
                    <div className="bg-pocket-bg rounded-xl p-3 mb-3">
                      <h4 className="font-bold text-pocket-text text-sm mb-2">Base Stats</h4>
                      <div className="space-y-1.5 text-xs">
                        {Object.entries(pokemon.baseStats).map(([stat, value]) => (
                          <div key={stat} className="flex items-center gap-2">
                            <span className="text-pocket-text-light w-16">{stat}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-pocket-blue"
                                style={{ width: `${Math.min(100, (value / 150) * 100)}%` }}
                              />
                            </div>
                            <span className="font-bold text-pocket-text w-10 text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategy Aptitudes */}
                    {pokemon.strategyAptitudes && Object.keys(pokemon.strategyAptitudes).length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-purple-700 text-sm mb-2">Strategy Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.strategyAptitudes).map(([strategy, grade]) => (
                            <div
                              key={strategy}
                              className="flex justify-between items-center px-2 py-1 rounded bg-white"
                            >
                              <span className="text-pocket-text">{strategy}</span>
                              <span
                                className="px-2 py-0.5 rounded text-white font-bold"
                                style={{ backgroundColor: getAptitudeColor(grade) }}
                              >
                                {grade}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Type Aptitudes */}
                    {pokemon.typeAptitudes && Object.keys(pokemon.typeAptitudes).length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-blue-700 text-sm mb-2">Type Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.typeAptitudes).map(([color, grade]) => {
                            const typeName = colorToType[color] || color;
                            return (
                              <div
                                key={color}
                                className="flex justify-between items-center px-2 py-1 rounded bg-white"
                              >
                                <TypeIcon type={typeName} size={16} showLabel={true} />
                                <span
                                  className="px-2 py-0.5 rounded text-white font-bold"
                                  style={{ backgroundColor: getAptitudeColor(grade) }}
                                >
                                  {grade}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Limit Break Section */}
                    {(() => {
                      const canLimitBreak = limitBreakLevel < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;

                      return limitBreakLevel < MAX_LIMIT_BREAK ? (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 mb-3">
                          <h4 className="font-bold text-purple-700 text-sm mb-2">Limit Break</h4>
                          <div className="flex items-center justify-between mb-2 text-xs">
                            <span className="text-pocket-text">Level: {limitBreakLevel} / {MAX_LIMIT_BREAK}</span>
                            <div className="flex items-center gap-1">
                              <Diamond size={12} className="text-purple-500" />
                              <span className={`font-bold ${limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK ? 'text-pocket-green' : 'text-pocket-red'}`}>
                                {limitBreakShards} / {SHARD_COST_PER_LIMIT_BREAK}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-pocket-text-light text-center mb-2">
                            Next level: +{(limitBreakLevel + 1) * 5}% Base Stats
                          </p>
                          <button
                            onClick={() => handleLimitBreak(detailPokemon)}
                            disabled={!canLimitBreak || isLimitBreaking}
                            className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${
                              canLimitBreak && !isLimitBreaking
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isLimitBreaking ? 'Limit Breaking...' : 'Limit Break'}
                          </button>
                          {limitBreakShards < SHARD_COST_PER_LIMIT_BREAK && (
                            <p className="text-xs text-pocket-red text-center mt-1">
                              Not enough shards
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 mb-3 text-center">
                          <p className="font-bold text-amber-600 text-sm">Maximum Limit Break!</p>
                          <p className="text-xs text-pocket-text-light mt-1">
                            +20% Base Stats
                          </p>
                        </div>
                      );
                    })()}

                    {/* Close button */}
                    <button
                      onClick={() => setDetailPokemon(null)}
                      className="w-full py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyPokemonScreen;
