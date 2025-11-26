/**
 * SupportGachaScreen Component
 *
 * Allows users to roll for support cards using Primos (currency).
 * Cost: 100 Primos per roll
 * Duplicates are automatically refunded.
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { getRarityColor } from '../utils/gameUtils';
import { SUPPORT_CARDS, SUPPORT_GACHA_RARITY } from '../shared/gameData';

const SupportGachaScreen = () => {
  const { setGameState } = useGame();
  const { primos, supportInventory, addSupportToInventory, updatePrimos } = useInventory();
  const [rollResult, setRollResult] = useState(null);

  const handleSupportRoll = () => {
    if (primos < 100) return;

    const roll = Math.random();
    let selectedRarity = 'Common';
    let cumulativeRate = 0;

    for (const [rarity, data] of Object.entries(SUPPORT_GACHA_RARITY)) {
      cumulativeRate += data.rate;
      if (roll < cumulativeRate) {
        selectedRarity = rarity;
        break;
      }
    }

    const rarityPool = SUPPORT_GACHA_RARITY[selectedRarity].supports;
    const support = rarityPool[Math.floor(Math.random() * rarityPool.length)];

    const isDuplicate = supportInventory.includes(support);

    if (!isDuplicate) {
      addSupportToInventory(support);
    }

    const newPrimos = isDuplicate ? primos : primos - 100;
    updatePrimos(newPrimos - primos); // Pass delta

    setRollResult({ support, rarity: selectedRarity, isDuplicate });
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-2 sm:p-4">
      {/* Primos display in top-left corner */}
      <div className="fixed top-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
        <Sparkles size={20} />
        <span>{primos} Primos</span>
      </div>

      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">Roll for Supports</h2>

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
                  <span>50%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Uncommon'), fontWeight: 'bold' }}>Uncommon</span>
                  <span>35%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Rare'), fontWeight: 'bold' }}>Rare</span>
                  <span>13%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: getRarityColor('Legendary'), fontWeight: 'bold' }}>Legendary</span>
                  <span>2%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleSupportRoll}
                disabled={primos < 100}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-purple-700 transition disabled:bg-gray-400"
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
            <div className="mb-4">
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg p-4 border-2" style={{ borderColor: getRarityColor(rollResult.rarity) }}>
                <h3 className="text-xl font-bold mb-2">{SUPPORT_CARDS[rollResult.support].name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-bold">{SUPPORT_CARDS[rollResult.support].trainer}</span> & <span className="font-bold">{SUPPORT_CARDS[rollResult.support].pokemon}</span>
                </p>
                <p className="text-xs text-gray-700 italic">{SUPPORT_CARDS[rollResult.support].effect.description}</p>
              </div>
            </div>
            {rollResult.isDuplicate && (
              <p className="text-orange-600 font-bold mb-4">Duplicate! 100 Primos refunded.</p>
            )}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setRollResult(null);
                  if (primos >= 100) {
                    handleSupportRoll();
                  }
                }}
                disabled={primos < 100}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-xl hover:bg-purple-700 transition disabled:bg-gray-400"
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

export default SupportGachaScreen;
