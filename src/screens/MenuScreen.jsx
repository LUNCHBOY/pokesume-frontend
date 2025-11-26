/**
 * MenuScreen Component
 *
 * Main menu where users can navigate to different game modes:
 * - Start New Career
 * - View inventories (Pokemon, Supports, Trained)
 * - Enter Tournaments
 * - Roll Gacha
 */

import React, { useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { generatePokemonSprite, getTypeColor } from '../utils/gameUtils';
import { POKEMON, ICONS } from '../shared/gameData';

const MenuScreen = () => {
  const { user, logout } = useAuth();
  const { setGameState, setShowResetConfirm } = useGame();
  const { pokemonInventory, supportInventory, trainedPokemon, primos, loadPokemonInventory } = useInventory();

  // Starter selection (if user has no pokemon)
  if (pokemonInventory.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg p-4 sm:p-8 max-w-2xl w-full shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-purple-600">
            Choose Your Starter!
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Select your first Pokemon to begin your journey
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['Charmander', 'Squirtle', 'Bulbasaur'].map(starter => {
              const pokemon = POKEMON[starter];
              return (
                <div
                  key={starter}
                  onClick={async () => {
                    // TODO: Add to server inventory
                    // For now, just reload inventory which will trigger this screen again
                    await loadPokemonInventory();
                  }}
                  className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-xl transition transform hover:scale-105 border-2 border-purple-300"
                >
                  <div className="flex justify-center mb-3">
                    {generatePokemonSprite(pokemon.primaryType, starter)}
                  </div>
                  <h3 className="text-xl font-bold text-center mb-2">{starter}</h3>
                  <p
                    className="text-center text-sm"
                    style={{ color: getTypeColor(pokemon.primaryType), fontWeight: 'bold' }}
                  >
                    {pokemon.primaryType}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Version number in bottom-right corner */}
        <div className="fixed bottom-4 right-4 text-white text-xs font-semibold bg-black bg-opacity-30 px-3 py-1 rounded-lg">
          v4.0.0 (Modular)
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
      {/* Primos display in top-left corner */}
      <div className="fixed top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
        <Sparkles size={20} />
        <span>{primos} Primos</span>
      </div>

      {/* User display in top-right corner */}
      <div className="fixed top-4 right-4">
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-sm">{user.username}</p>
              <p className="text-xs text-gray-600">Rating: {user.rating || 1000}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 sm:p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 sm:mb-6 text-purple-600">
          Pokesume Pretty Duel
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          Defeat 5 gym leaders with your buddy to prove you're the best there ever was!
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              if (pokemonInventory.length > 0) {
                setGameState('pokemonSelect');
              }
            }}
            className="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-purple-700 transition disabled:bg-gray-400"
            disabled={pokemonInventory.length === 0}
          >
            Start New Career
          </button>

          <button
            onClick={() => setGameState('pokemonInventory')}
            className="w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-green-700 transition"
          >
            My Pokemon ({pokemonInventory.length})
          </button>

          <button
            onClick={() => setGameState('supportInventory')}
            className="w-full bg-indigo-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-indigo-700 transition"
          >
            My Supports ({supportInventory.length})
          </button>

          <button
            onClick={() => setGameState('trainedPokemon')}
            className="w-full bg-teal-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-teal-700 transition"
          >
            Trained Pokemon ({trainedPokemon.length})
          </button>

          <button
            onClick={() => setGameState('tournaments')}
            className="w-full bg-red-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-red-700 transition"
          >
            <Trophy className="inline-block mr-2" size={20} />
            Tournaments
          </button>

          <button
            onClick={() => setGameState('gacha')}
            className="w-full bg-yellow-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-yellow-700 transition"
          >
            Roll for Pokemon (100 Primos)
          </button>

          <button
            onClick={() => setGameState('supportGacha')}
            className="w-full bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold text-lg sm:text-xl hover:bg-purple-700 transition"
          >
            Roll for Supports (100 Primos)
          </button>
        </div>

        {/* Reset Data Button */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowResetConfirm(true);
            }}
            className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition cursor-pointer"
          >
            {ICONS.WARNING} Reset All Data
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            This will delete all progress and cannot be undone
          </p>
        </div>
      </div>

      {/* Version number in bottom-right corner */}
      <div className="fixed bottom-4 right-4 text-white text-xs font-semibold bg-black bg-opacity-30 px-3 py-1 rounded-lg">
        v4.0.0 (Modular)
      </div>
    </div>
  );
};

export default MenuScreen;
