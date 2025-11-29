/**
 * GachaScreen Component
 *
 * Allows users to roll for new Pokemon using Primos (currency).
 * Cost: 100 Primos per roll
 * Features Limit Break system for duplicate Pokemon.
 */

import React, { useState } from 'react';
import { Sparkles, ArrowLeft, CircleDot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getRarityColor
} from '../utils/gameUtils';
import { TypeBadge } from '../components/TypeIcon';
import { POKEMON, GACHA_RARITY } from '../shared/gameData';
import LimitBreakDiamonds from '../components/LimitBreakDiamonds';

// Limit break shard rewards by rarity
const LIMIT_BREAK_SHARD_REWARDS = {
  Common: 1,
  Uncommon: 3,
  Rare: 5,
  Legendary: 20
};

const GachaScreen = () => {
  const { setGameState } = useGame();
  const { primos, pokemonInventory, addPokemon, updatePrimos, getPokemonLimitBreak, limitBreakShards } = useInventory();
  const [rollResult, setRollResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollForPokemon = async () => {
    if (primos < 100 || isRolling) return null;

    setIsRolling(true);

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

    // Deduct primos first
    await updatePrimos(-100);

    // Add to inventory (backend handles limit break logic)
    const pokemonData = POKEMON[pokemon];
    const result = await addPokemon(pokemon, pokemonData, selectedRarity);

    setIsRolling(false);

    if (result) {
      return {
        pokemon,
        rarity: selectedRarity,
        isDuplicate: result.isDuplicate || false,
        isMaxLimitBreak: result.isMaxLimitBreak || false,
        limitBreakLevel: result.limitBreakLevel || 0,
        shardsAwarded: result.shardsAwarded || 0
      };
    }

    return { pokemon, rarity: selectedRarity, isDuplicate: false };
  };

  const handleRoll = async () => {
    const result = await rollForPokemon();
    if (result) {
      setRollResult(result);
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
            <CircleDot size={20} className="text-type-poison" />
            <span className="font-bold text-pocket-text">Pokemon Gacha</span>
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-type-poison/10 flex items-center justify-center">
                  <CircleDot size={32} className="text-type-poison" />
                </div>
                <h2 className="text-xl font-bold text-pocket-text mb-2">Roll for Pokemon</h2>
                <p className="text-pocket-text-light">100 Primos per roll</p>
              </div>

              {/* Rates Card */}
              <div className="bg-pocket-bg rounded-xl p-4 mb-6">
                <h3 className="font-bold text-pocket-text mb-3 text-sm">Drop Rates</h3>
                <div className="space-y-2">
                  {[
                    { rarity: 'Common', rate: '60%' },
                    { rarity: 'Uncommon', rate: '30%' },
                    { rarity: 'Rare', rate: '9%' },
                    { rarity: 'Legendary', rate: '1%' }
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
                  Duplicate Pokemon increase Limit Break level (+5% base stats per level).
                  Max level duplicates award Limit Break Shards!
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: primos >= 100 && !isRolling ? 1.02 : 1 }}
                  whileTap={{ scale: primos >= 100 && !isRolling ? 0.98 : 1 }}
                  onClick={handleRoll}
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

                {/* Pokemon Display */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mb-4"
                >
                  {generatePokemonSprite(POKEMON[rollResult.pokemon]?.primaryType || 'Normal', rollResult.pokemon)}
                </motion.div>

                <h3 className="text-2xl font-bold text-pocket-text mb-2">{rollResult.pokemon}</h3>

                {/* Limit Break Diamonds */}
                <div className="flex justify-center mb-2">
                  <LimitBreakDiamonds level={getPokemonLimitBreak(rollResult.pokemon)} size={14} />
                </div>

                {POKEMON[rollResult.pokemon] && (
                  <div className="flex justify-center mb-4">
                    <TypeBadge type={POKEMON[rollResult.pokemon].primaryType} size={18} />
                  </div>
                )}

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
                          +5% Base Stats (Level {rollResult.limitBreakLevel})
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
                        await handleRoll();
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

export default GachaScreen;
