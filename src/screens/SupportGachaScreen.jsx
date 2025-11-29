/**
 * SupportGachaScreen Component
 *
 * Allows users to roll for support cards using Primos (currency).
 * Cost: 100 Primos per roll
 * Features Limit Break system for duplicate support cards.
 */

import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { getRarityColor } from '../utils/gameUtils';
import { SUPPORT_CARDS, SUPPORT_GACHA_RARITY } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';
import LimitBreakDiamonds from '../components/LimitBreakDiamonds';

// Limit break shard rewards by rarity
const LIMIT_BREAK_SHARD_REWARDS = {
  Common: 1,
  Uncommon: 3,
  Rare: 5,
  Legendary: 20
};

const SupportGachaScreen = () => {
  const { setGameState } = useGame();
  const { primos, supportInventory, addSupport, updatePrimos, getSupportLimitBreak } = useInventory();
  const [rollResult, setRollResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleSupportRoll = async () => {
    if (primos < 100 || isRolling) return;

    setIsRolling(true);

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

    // Deduct primos first
    await updatePrimos(-100);

    // Add to inventory (backend handles limit break logic)
    const supportData = SUPPORT_CARDS[support];
    const result = await addSupport(support, supportData, selectedRarity);

    setIsRolling(false);

    if (result) {
      setRollResult({
        support,
        rarity: selectedRarity,
        isDuplicate: result.isDuplicate || false,
        isMaxLimitBreak: result.isMaxLimitBreak || false,
        limitBreakLevel: result.limitBreakLevel || 0,
        shardsAwarded: result.shardsAwarded || 0
      });
    } else {
      setRollResult({ support, rarity: selectedRarity, isDuplicate: false });
    }
  };

  return (
    <div className="min-h-screen bg-pocket-bg p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-lg mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setGameState('menu')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-type-psychic" />
            <span className="font-bold text-pocket-text">Support Gacha</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-pocket-text font-bold text-sm">{primos.toLocaleString()}</span>
          </div>
        </div>
      </motion.header>

      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          {!rollResult ? (
            <div className="p-6">
              {/* Roll Info */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-type-psychic/10 flex items-center justify-center">
                  <Gift size={32} className="text-type-psychic" />
                </div>
                <h2 className="text-xl font-bold text-pocket-text mb-2">Roll for Supports</h2>
                <p className="text-pocket-text-light">100 Primos per roll</p>
              </div>

              {/* Rates Card */}
              <div className="bg-pocket-bg rounded-xl p-4 mb-6">
                <h3 className="font-bold text-pocket-text mb-3 text-sm">Drop Rates</h3>
                <div className="space-y-2">
                  {[
                    { rarity: 'Common', rate: '50%' },
                    { rarity: 'Uncommon', rate: '35%' },
                    { rarity: 'Rare', rate: '13%' },
                    { rarity: 'Legendary', rate: '2%' }
                  ].map(({ rarity, rate }) => (
                    <div key={rarity} className="flex justify-between items-center">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: getRarityColor(rarity) }}
                      >
                        {rarity}
                      </span>
                      <span className="text-pocket-text-light text-sm">{rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limit Break Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
                <h3 className="font-bold text-pocket-text mb-2 text-sm flex items-center gap-2">
                  <LimitBreakDiamonds level={4} size={10} />
                  Limit Break System
                </h3>
                <p className="text-pocket-text-light text-xs">
                  Duplicate supports increase Limit Break level, enhancing their effects.
                  Max level duplicates award Limit Break Shards!
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: primos >= 100 && !isRolling ? 1.02 : 1 }}
                  whileTap={{ scale: primos >= 100 && !isRolling ? 0.98 : 1 }}
                  onClick={handleSupportRoll}
                  disabled={primos < 100 || isRolling}
                  className="w-full pocket-btn-purple py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRolling ? 'Rolling...' : primos >= 100 ? 'Roll!' : 'Not Enough Primos'}
                </motion.button>
                <button
                  onClick={() => setGameState('menu')}
                  className="w-full py-3 text-pocket-text-light font-semibold hover:text-pocket-text transition-colors"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Result Display */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                {/* Rarity Badge */}
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="mb-4"
                >
                  <span
                    className="inline-block px-4 py-2 rounded-full font-bold text-white text-lg"
                    style={{ backgroundColor: getRarityColor(rollResult.rarity) }}
                  >
                    {rollResult.rarity}!
                  </span>
                </motion.div>

                {/* Support Card Display */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="bg-pocket-bg rounded-xl p-4 mb-4"
                  style={{ borderLeft: `4px solid ${getRarityColor(rollResult.rarity)}` }}
                >
                  {(() => {
                    const trainerImage = getSupportImageFromCardName(SUPPORT_CARDS[rollResult.support].name);
                    return trainerImage && (
                      <div className="flex justify-center mb-3">
                        <div
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-4 bg-white shadow-card overflow-hidden flex items-center justify-center"
                          style={{ borderColor: getRarityColor(rollResult.rarity) }}
                        >
                          <img
                            src={trainerImage}
                            alt={SUPPORT_CARDS[rollResult.support].trainer}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    );
                  })()}
                  <h3 className="text-xl font-bold text-pocket-text mb-2">
                    {SUPPORT_CARDS[rollResult.support].name}
                  </h3>

                  {/* Limit Break Diamonds */}
                  <div className="flex justify-center mb-2">
                    <LimitBreakDiamonds level={getSupportLimitBreak(rollResult.support)} size={14} />
                  </div>

                  <p className="text-xs text-pocket-text-light italic mb-3">
                    {SUPPORT_CARDS[rollResult.support].description || SUPPORT_CARDS[rollResult.support].effect?.description}
                  </p>

                  {/* Move Hints Display */}
                  {SUPPORT_CARDS[rollResult.support].moveHints && SUPPORT_CARDS[rollResult.support].moveHints.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
                      <p className="font-bold text-blue-700 mb-1">Move Hints:</p>
                      <div className="flex flex-wrap gap-1">
                        {SUPPORT_CARDS[rollResult.support].moveHints.map((move, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                            {move}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Duplicate / Limit Break Result */}
                {rollResult.isDuplicate && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`rounded-xl p-3 mb-4 ${
                      rollResult.isMaxLimitBreak
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    {rollResult.isMaxLimitBreak ? (
                      <div>
                        <p className="text-purple-700 font-bold">Max Limit Break!</p>
                        <p className="text-purple-600 text-sm">
                          +{rollResult.shardsAwarded || LIMIT_BREAK_SHARD_REWARDS[rollResult.rarity]} Limit Break Shards
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-green-700 font-bold">Limit Break Up!</p>
                        <p className="text-green-600 text-sm">
                          Support Enhanced (Level {rollResult.limitBreakLevel})
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="space-y-3 mt-6">
                  <motion.button
                    whileHover={{ scale: primos >= 100 && !isRolling ? 1.02 : 1 }}
                    whileTap={{ scale: primos >= 100 && !isRolling ? 0.98 : 1 }}
                    onClick={async () => {
                      setRollResult(null);
                      if (primos >= 100) {
                        await handleSupportRoll();
                      }
                    }}
                    disabled={primos < 100 || isRolling}
                    className="w-full pocket-btn-purple py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRolling ? 'Rolling...' : 'Roll Again'}
                  </motion.button>
                  <button
                    onClick={() => {
                      setRollResult(null);
                      setGameState('menu');
                    }}
                    className="w-full py-3 text-pocket-text-light font-semibold hover:text-pocket-text transition-colors"
                  >
                    Back to Menu
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SupportGachaScreen;
