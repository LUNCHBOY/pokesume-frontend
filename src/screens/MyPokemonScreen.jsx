/**
 * MyPokemonScreen Component
 *
 * Displays the user's Pokemon inventory with sorting and filtering.
 * Allows viewing all owned Pokemon with their stats, grade, and rarity.
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
  getRarityColor,
  StatIcon
} from '../utils/gameUtils';
import { POKEMON } from '../shared/gameData';

const MyPokemonScreen = () => {
  const {
    setGameState,
    pokemonSortBy,
    setPokemonSortBy,
    pokemonFilterType,
    setPokemonFilterType
  } = useGame();

  const { pokemonInventory } = useInventory();

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
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-purple-600">My Pokemon</h2>
            <button
              onClick={() => setGameState('menu')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Back
            </button>
          </div>
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            <button
              onClick={() => setPokemonFilterType('all')}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                pokemonFilterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Normal'].map(type => (
              <button
                key={type}
                onClick={() => setPokemonFilterType(type)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  pokemonFilterType === type ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={pokemonFilterType === type ? { backgroundColor: getTypeColor(type) } : {}}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sortedInventory.map((pokemonName, idx) => {
            const pokemon = POKEMON[pokemonName];
            if (!pokemon) {
              // Handle Pokemon not in POKEMON object
              return (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex justify-center mb-2">
                    {generatePokemonSprite('Normal', pokemonName)}
                  </div>
                  <h3 className="text-center font-bold text-lg">{pokemonName}</h3>
                  <p className="text-center text-sm text-gray-500">
                    Coming Soon
                  </p>
                </div>
              );
            }
            return (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-lg">
                <div className="flex justify-center mb-2">
                  {generatePokemonSprite(pokemon.primaryType, pokemonName)}
                </div>
                <h3 className="text-center font-bold text-lg">{pokemonName}</h3>
                <p className="text-center text-sm" style={{ color: getTypeColor(pokemon.primaryType), fontWeight: 'bold' }}>
                  {pokemon.primaryType}
                </p>
                <div className="text-center mt-2 mb-2 flex items-center justify-center gap-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon.baseStats)) }}
                  >
                    {getPokemonGrade(pokemon.baseStats)}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: getRarityColor(getPokemonRarity(pokemonName)) }}
                  >
                    {getPokemonRarity(pokemonName)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs mt-2">
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
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Speed" size={10} />
                    <span>{pokemon.baseStats.Speed}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {pokemonInventory.length === 0 && (
          <div className="bg-white rounded-lg p-12 shadow-lg text-center">
            <p className="text-gray-500 text-lg">No Pokemon yet! Roll for some Pokemon to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPokemonScreen;
