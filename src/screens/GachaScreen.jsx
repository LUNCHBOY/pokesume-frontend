/**
 * GachaScreen Component
 *
 * Allows users to roll for new Pokemon using Primos (currency).
 * Cost: 100 Primos per roll
 * Duplicates are automatically refunded.
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getRarityColor
} from '../utils/gameUtils';
import { POKEMON, GACHA_RARITY } from '../shared/gameData';

const GachaScreen = () => {
  const { setGameState } = useGame();
  const { primos, pokemonInventory, addPokemonToInventory, updatePrimos } = useInventory();
  const [rollResult, setRollResult] = useState(null);

  const rollForPokemon = () => {
    if (primos < 100) return null;

    // Roll for rarity
    const roll = Math.random();
    let selectedRarity = 'Common';
    let cumulativeRate = 0;

    for (const [rarity, data] of Object.entries(GACHA_RARITY)) {
      cumulativeRate += data.rate;
      if (roll < cumulativeRate) {
        selectedRarity = rarity;
        break;
      }
    }

    // Select random Pokemon from rarity pool
    const rarityPool = GACHA_RARITY[selectedRarity].pokemon;
    const pokemon = rarityPool[Math.floor(Math.random() * rarityPool.length)];

    // Check if duplicate
    const isDuplicate = pokemonInventory.includes(pokemon);

    // Add to inventory if not duplicate
    if (!isDuplicate) {
      addPokemonToInventory(pokemon);
    }

    // Update primos (refund if duplicate)
    const newPrimos = isDuplicate ? primos : primos - 100;
    updatePrimos(newPrimos - primos); // Pass delta

    return { pokemon, rarity: selectedRarity, isDuplicate };
  };

  const handleRoll = () => {
    const result = rollForPokemon();
    if (result) {
      setRollResult(result);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
      {/* Primos display in top-left corner */}
      <div className="fixed top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
        <Sparkles size={20} />
        <span>{primos} Primos</span>
      </div>

      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">Roll for Pokemon</h2>

        {!rollResult ? (
          <>
            <p className="text-center text-gray-600 mb-6">
              Cost: 100 Primos per roll
            </p>
            <div className="mb-6 text-sm text-gray-600">
              <h3 className="font-bold mb-2">Rates:</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Common'), fontWeight: 'bold' }}>Common</span>
                  <span>60%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Uncommon'), fontWeight: 'bold' }}>Uncommon</span>
                  <span>30%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Rare'), fontWeight: 'bold' }}>Rare</span>
                  <span>9%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Legendary'), fontWeight: 'bold' }}>Legendary</span>
                  <span>1%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRoll}
                disabled={primos < 100}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-yellow-700 transition disabled:bg-gray-400"
              >
                {primos >= 100 ? 'Roll!' : 'Not Enough Primos'}
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back to Menu
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block px-4 py-2 rounded-lg font-bold text-white text-xl mb-4" style={{ backgroundColor: getRarityColor(rollResult.rarity) }}>
                {rollResult.rarity}!
              </div>
            </div>
            <div className="flex justify-center mb-4">
              {generatePokemonSprite(POKEMON[rollResult.pokemon]?.primaryType || 'Normal', rollResult.pokemon)}
            </div>
            <h3 className="text-2xl font-bold mb-2">{rollResult.pokemon}</h3>
            {POKEMON[rollResult.pokemon] && (
              <p className="text-lg mb-6" style={{ color: getTypeColor(POKEMON[rollResult.pokemon].primaryType), fontWeight: 'bold' }}>
                {POKEMON[rollResult.pokemon].primaryType}
              </p>
            )}
            {rollResult.isDuplicate && (
              <p className="text-orange-600 font-bold mb-4">Duplicate! 100 Primos refunded.</p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setRollResult(null);
                  if (primos >= 100) {
                    handleRoll();
                  }
                }}
                disabled={primos < 100}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-yellow-700 transition disabled:bg-gray-400"
              >
                Roll Again
              </button>
              <button
                onClick={() => {
                  setRollResult(null);
                  setGameState('menu');
                }}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GachaScreen;
