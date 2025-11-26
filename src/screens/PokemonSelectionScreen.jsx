/**
 * PokemonSelectionScreen Component
 *
 * Allows users to select a Pokemon from their inventory to start a career.
 * Displays Pokemon with stats, grade, and rarity.
 */

import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  getPokemonGrade,
  getPokemonRarity,
  StatIcon
} from '../utils/gameUtils';
import { POKEMON } from '../shared/gameData';

const PokemonSelectionScreen = () => {
  const {
    setSelectedPokemon,
    setGameState,
    pokemonSortBy,
    setPokemonSortBy,
    pokemonFilterType,
    setPokemonFilterType
  } = useGame();

  const { pokemonInventory } = useInventory();

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
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg p-4 mb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Select Your Pokemon</h2>
            <button
              onClick={() => setGameState('menu')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Back
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-sm font-semibold text-gray-700">Sort by:</span>
            <button
              onClick={() => setPokemonSortBy('default')}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                pokemonSortBy === 'default' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setPokemonSortBy('name')}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                pokemonSortBy === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setPokemonSortBy('type')}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                pokemonSortBy === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Type
            </button>
            <button
              onClick={() => setPokemonSortBy('rarity')}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                pokemonSortBy === 'rarity' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rarity
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            {['all', 'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Normal'].map(type => (
              <button
                key={type}
                onClick={() => setPokemonFilterType(type)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonFilterType === type ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Pokemon Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {sortedInventory.map((pokemonName, idx) => {
            const pokemon = POKEMON[pokemonName];
            if (!pokemon) return null;

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedPokemon(pokemonName);
                  setGameState('inspirationSelect');
                }}
                className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">{pokemonName}</h3>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon.baseStats)) }}
                      >
                        {getPokemonGrade(pokemon.baseStats)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <span style={{ color: getTypeColor(pokemon.primaryType), fontWeight: 'bold' }}>
                        {pokemon.primaryType}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{pokemon.strategy} ({pokemon.strategyGrade})</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <StatIcon stat="HP" size={12} />
                    <span>HP: {pokemon.baseStats.HP}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Attack" size={12} />
                    <span>ATK: {pokemon.baseStats.Attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Defense" size={12} />
                    <span>DEF: {pokemon.baseStats.Defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Instinct" size={12} />
                    <span>INS: {pokemon.baseStats.Instinct}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Speed" size={12} />
                    <span>SPE: {pokemon.baseStats.Speed}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedInventory.length === 0 && (
          <div className="bg-white rounded-lg p-8 shadow-lg text-center mt-4">
            <p className="text-gray-600 mb-4">
              {pokemonFilterType === 'all'
                ? "You don't have any playable Pokemon yet!"
                : `No ${pokemonFilterType} type Pokemon found!`}
            </p>
            {pokemonFilterType === 'all' && (
              <p className="text-sm text-gray-500 mb-4">
                The Pokemon you rolled are not yet available in gameplay. Please roll for starter Pokemon:
                Charmander, Squirtle, Bulbasaur, Pikachu, or Gastly.
              </p>
            )}
            <button
              onClick={() => setGameState('menu')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonSelectionScreen;
