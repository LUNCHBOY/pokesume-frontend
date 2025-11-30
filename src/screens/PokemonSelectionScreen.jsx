/**
 * PokemonSelectionScreen Component
 *
 * Allows users to select a Pokemon from their inventory to start a career.
 * Displays Pokemon with stats, grade, and rarity.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Swords, X } from 'lucide-react';
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

          {/* Instruction hint */}
          <p className="text-xs text-pocket-text-light mt-3 text-center">
            Tap to select • Hold for details
          </p>
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

            const rarity = getPokemonRarity(pokemonName);
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
                onMouseDown={() => handleLongPressStart(pokemonName)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(pokemonName)}
                onTouchEnd={handleLongPressEnd}
                className="bg-white rounded-2xl shadow-card p-4 text-left transition-shadow hover:shadow-card-hover select-none"
                style={{ borderLeft: `4px solid ${getRarityColor(rarity)}` }}
              >
                {/* Rarity badge at top */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: getRarityColor(rarity) }}
                  >
                    {rarity}
                  </span>
                  <Swords size={14} className="text-pocket-red" />
                </div>
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

      {/* Pokemon Detail Modal (Long Press) */}
      <AnimatePresence>
        {detailPokemon && POKEMON[detailPokemon] && (
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
                const pokemon = POKEMON[detailPokemon];
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
                      <div className="bg-pocket-bg rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-pocket-text text-sm mb-2">Type Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.typeAptitudes).map(([color, grade]) => {
                            const typeName = colorToType[color] || color;
                            return (
                              <div
                                key={color}
                                className="flex justify-between items-center px-2 py-1 rounded"
                                style={{ backgroundColor: `${TYPE_COLORS[typeName] || '#888'}20` }}
                              >
                                <span style={{ color: TYPE_COLORS[typeName] || '#888' }}>{typeName}</span>
                                <span className="font-bold text-pocket-text">{grade}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailPokemon(null)}
                        className="flex-1 py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setDetailPokemon(null);
                          setSelectedPokemon(detailPokemon);
                          setGameState('inspirationSelect');
                        }}
                        className="flex-1 py-2 rounded-xl bg-pocket-red text-white font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Swords size={16} />
                        Select
                      </button>
                    </div>
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

export default PokemonSelectionScreen;
