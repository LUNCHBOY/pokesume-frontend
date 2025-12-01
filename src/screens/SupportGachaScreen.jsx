/**
 * SupportGachaScreen Component
 *
 * Allows users to roll for support cards using Primos (currency).
 * Cost: 100 Primos per roll, 1000 Primos for 10-roll
 * Features Limit Break system for duplicate support cards.
 */

import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Gift, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { getRarityColor } from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS, SUPPORT_GACHA_RARITY, MOVES } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';
import LimitBreakDiamonds from '../components/LimitBreakDiamonds';

// Limit break shard rewards by rarity
const LIMIT_BREAK_SHARD_REWARDS = {
  Common: 1,
  Uncommon: 3,
  Rare: 5,
  Legendary: 20
};

// Rarity border colors for multi-roll display
const RARITY_BORDER_STYLES = {
  Common: 'border-gray-400 bg-gray-50',
  Uncommon: 'border-green-500 bg-green-50',
  Rare: 'border-blue-500 bg-blue-50',
  Legendary: 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-100'
};

const SupportGachaScreen = () => {
  const { setGameState } = useGame();
  const { primos, addSupport, updatePrimos, getSupportLimitBreak } = useInventory();
  const [rollResult, setRollResult] = useState(null);
  const [multiRollResults, setMultiRollResults] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState(null);

  // Single roll function (returns result, doesn't manage isRolling state)
  const performSingleRoll = async () => {
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

    // Add to inventory (backend handles limit break logic)
    const supportData = SUPPORT_CARDS[support];
    const result = await addSupport(support, supportData, selectedRarity);

    if (result) {
      return {
        support,
        rarity: selectedRarity,
        isDuplicate: result.isDuplicate || false,
        isMaxLimitBreak: result.isMaxLimitBreak || false,
        limitBreakLevel: result.limitBreakLevel || 0,
        shardsAwarded: result.shardsAwarded || 0
      };
    }

    return { support, rarity: selectedRarity, isDuplicate: false };
  };

  // Handle single roll
  const handleSupportRoll = async () => {
    if (primos < 100 || isRolling) return;

    setIsRolling(true);
    await updatePrimos(-100);
    const result = await performSingleRoll();
    setIsRolling(false);

    if (result) {
      setRollResult(result);
      setMultiRollResults(null);
    }
  };

  // Handle 10-roll
  const handleMultiRoll = async () => {
    if (primos < 1000 || isRolling) return;

    setIsRolling(true);
    await updatePrimos(-1000);

    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = await performSingleRoll();
      if (result) {
        results.push(result);
      }
    }

    setIsRolling(false);
    setMultiRollResults(results);
    setRollResult(null);
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
          {/* Multi-Roll Results Display */}
          {multiRollResults ? (
            <div className="p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-pocket-text">Gacha Results!</h2>
                  <p className="text-pocket-text-light text-sm">
                    {multiRollResults.filter(r => r.rarity === 'Legendary').length > 0 && (
                      <span className="text-amber-500 font-bold">
                        {multiRollResults.filter(r => r.rarity === 'Legendary').length} Legendary!
                      </span>
                    )}
                    {multiRollResults.filter(r => r.rarity === 'Rare').length > 0 && (
                      <span className="text-blue-500 font-bold ml-2">
                        {multiRollResults.filter(r => r.rarity === 'Rare').length} Rare
                      </span>
                    )}
                  </p>
                </div>

                {/* Grid of results - 2 rows of 5 like Uma Musume */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {multiRollResults.map((result, index) => {
                    const trainerImage = getSupportImageFromCardName(SUPPORT_CARDS[result.support]?.name);
                    return (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedSupport(result.support)}
                        className={`relative rounded-lg border-2 p-1 cursor-pointer hover:ring-2 hover:ring-type-psychic transition-all ${RARITY_BORDER_STYLES[result.rarity]}`}
                      >
                        {/* NEW badge for non-duplicates */}
                        {!result.isDuplicate && (
                          <div className="absolute -top-1 -right-1 z-10">
                            <span className="bg-red-500 text-white text-[8px] font-bold px-1 rounded">NEW</span>
                          </div>
                        )}

                        {/* Support Image */}
                        <div className="aspect-square flex items-center justify-center overflow-hidden rounded">
                          {trainerImage ? (
                            <img
                              src={trainerImage}
                              alt={SUPPORT_CARDS[result.support]?.trainer}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full bg-type-psychic/20 flex items-center justify-center">
                              <Gift size={20} className="text-type-psychic" />
                            </div>
                          )}
                        </div>

                        {/* Limit Break Diamonds */}
                        <div className="flex justify-center -mt-1">
                          <LimitBreakDiamonds level={getSupportLimitBreak(result.support)} size={6} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="bg-pocket-bg rounded-xl p-3 mb-4 text-xs">
                  <div className="flex justify-between text-pocket-text-light">
                    <span>New Supports:</span>
                    <span className="font-bold text-pocket-text">{multiRollResults.filter(r => !r.isDuplicate).length}</span>
                  </div>
                  <div className="flex justify-between text-pocket-text-light">
                    <span>Limit Breaks:</span>
                    <span className="font-bold text-green-600">{multiRollResults.filter(r => r.isDuplicate && !r.isMaxLimitBreak).length}</span>
                  </div>
                  {multiRollResults.some(r => r.isMaxLimitBreak) && (
                    <div className="flex justify-between text-pocket-text-light">
                      <span>Shards Earned:</span>
                      <span className="font-bold text-purple-600">
                        +{multiRollResults.filter(r => r.isMaxLimitBreak).reduce((sum, r) => sum + (r.shardsAwarded || LIMIT_BREAK_SHARD_REWARDS[r.rarity]), 0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: primos >= 1000 && !isRolling ? 1.02 : 1 }}
                    whileTap={{ scale: primos >= 1000 && !isRolling ? 0.98 : 1 }}
                    onClick={async () => {
                      setMultiRollResults(null);
                      if (primos >= 1000) {
                        await handleMultiRoll();
                      }
                    }}
                    disabled={primos < 1000 || isRolling}
                    className="w-full pocket-btn-purple py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Star size={16} />
                    {isRolling ? 'Rolling...' : '10-Roll Again'}
                  </motion.button>
                  <button
                    onClick={() => {
                      setMultiRollResults(null);
                    }}
                    className="w-full py-2 text-pocket-text-light font-semibold hover:text-pocket-text transition-colors text-sm"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            </div>
          ) : !rollResult ? (
            <div className="p-6">
              {/* Roll Info */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-type-psychic/10 flex items-center justify-center">
                  <Gift size={32} className="text-type-psychic" />
                </div>
                <h2 className="text-xl font-bold text-pocket-text mb-2">Roll for Supports</h2>
                <p className="text-pocket-text-light">100 Primos per roll • 1,000 for 10-roll</p>
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
                {/* 10-Roll Button */}
                <motion.button
                  whileHover={{ scale: primos >= 1000 && !isRolling ? 1.02 : 1 }}
                  whileTap={{ scale: primos >= 1000 && !isRolling ? 0.98 : 1 }}
                  onClick={handleMultiRoll}
                  disabled={primos < 1000 || isRolling}
                  className="w-full pocket-btn-purple py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Star size={20} />
                  {isRolling ? 'Rolling...' : primos >= 1000 ? '10-Roll! (1,000)' : 'Need 1,000 Primos'}
                </motion.button>

                {/* Single Roll Button */}
                <motion.button
                  whileHover={{ scale: primos >= 100 && !isRolling ? 1.02 : 1 }}
                  whileTap={{ scale: primos >= 100 && !isRolling ? 0.98 : 1 }}
                  onClick={handleSupportRoll}
                  disabled={primos < 100 || isRolling}
                  className="w-full py-3 bg-pocket-bg border-2 border-type-psychic/30 text-type-psychic font-bold rounded-xl hover:bg-type-psychic/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRolling ? 'Rolling...' : primos >= 100 ? 'Single Roll (100)' : 'Not Enough Primos'}
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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs">
                      <p className="font-bold text-gray-700 mb-1">Move Hints:</p>
                      <div className="flex flex-wrap gap-1">
                        {SUPPORT_CARDS[rollResult.support].moveHints.map((move, idx) => {
                          const moveData = MOVES[move];
                          const moveType = moveData?.type || 'Normal';
                          const typeColor = TYPE_COLORS[moveType] || '#A8A878';
                          return (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded font-semibold text-white"
                              style={{ backgroundColor: typeColor }}
                            >
                              {move}
                            </span>
                          );
                        })}
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

      {/* Support Detail Modal */}
      <AnimatePresence>
        {selectedSupport && SUPPORT_CARDS[selectedSupport] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSupport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-card-lg p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedSupport(null)}
                className="absolute top-4 right-4 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {(() => {
                // Get raw card data directly
                const card = SUPPORT_CARDS[selectedSupport];
                if (!card) return null;

                // Compute normalized values inline
                const support = {
                  ...card,
                  // Training bonuses from trainingBonus object
                  typeBonusTraining: card.trainingBonus?.typeMatch ?? 4,
                  generalBonusTraining: card.trainingBonus?.otherStats ?? 2,
                  friendshipBonusTraining: card.trainingBonus?.maxFriendshipTypeMatch ?? 8,
                  // Appearance rates
                  appearanceChance: card.appearanceRate ?? 0.40,
                  typeAppearancePriority: card.typeMatchPreference ?? 0.65,
                  // Base stats alias
                  baseStatIncrease: card.baseStats || { HP: 0, Attack: 0, Defense: 0, Instinct: 0, Speed: 0 }
                };

                const limitBreak = getSupportLimitBreak(selectedSupport);
                const trainerImage = getSupportImageFromCardName(support.name);

                return (
                  <>
                    {/* Support info */}
                    <div className="text-center mb-4">
                      {trainerImage && (
                        <img
                          src={trainerImage}
                          alt={support.trainer}
                          className="w-20 h-20 object-contain rounded-xl border-2 bg-pocket-bg mx-auto mb-3"
                          style={{ borderColor: getRarityColor(support.rarity) }}
                        />
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white inline-block mb-2"
                        style={{ backgroundColor: getRarityColor(support.rarity) }}
                      >
                        {support.rarity}
                      </span>
                      <h3 className="font-bold text-xl text-pocket-text mb-2">{support.name}</h3>
                      <div className="flex justify-center mb-2">
                        <LimitBreakDiamonds level={limitBreak} size={14} />
                      </div>
                      {limitBreak > 0 && (
                        <p className="text-sm text-pocket-green font-semibold">
                          +{limitBreak * 5}% Training Bonuses
                        </p>
                      )}
                    </div>

                    {/* Focus Type */}
                    {support.supportType && (
                      <p
                        className="text-sm font-bold mb-3 text-center"
                        style={{
                          color: TYPE_COLORS[
                            support.supportType === 'Attack' ? 'Fire' :
                            support.supportType === 'Defense' ? 'Water' :
                            support.supportType === 'HP' ? 'Grass' :
                            support.supportType === 'Instinct' ? 'Psychic' : 'Electric'
                          ]
                        }}
                      >
                        Focus: {support.supportType}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-xs text-pocket-text-light italic mb-4 text-center">
                      {support.description}
                    </p>

                    {/* Base Stats */}
                    {support.baseStatIncrease && Object.values(support.baseStatIncrease).some(v => v > 0) && (
                      <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                        <p className="font-bold text-type-psychic text-xs mb-2">Base Stat Bonuses</p>
                        <div className="space-y-1 text-xs">
                          {Object.entries(support.baseStatIncrease).map(([stat, value]) => (
                            value > 0 && (
                              <div key={stat} className="flex justify-between">
                                <span className="text-pocket-text-light">{stat}</span>
                                <span className="text-pocket-green font-bold">+{value}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Training Bonuses */}
                    <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                      <p className="font-bold text-type-psychic text-xs mb-2">Training Bonuses</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Friendship</span>
                          <span className="text-pocket-blue font-bold">{support.initialFriendship ?? 30}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Type Match</span>
                          <span className="text-pocket-green font-bold">+{support.typeBonusTraining}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Other Stats</span>
                          <span className="text-pocket-green font-bold">+{support.generalBonusTraining}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Max Friend</span>
                          <span className="text-pocket-green font-bold">+{support.friendshipBonusTraining}</span>
                        </div>
                      </div>
                    </div>

                    {/* Appearance Rate */}
                    <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Appearance</span>
                          <span className="text-pocket-text font-bold">{Math.round(support.appearanceChance * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pocket-text-light">Type Pref</span>
                          <span className="text-pocket-text font-bold">{Math.round(support.typeAppearancePriority * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Special Effects */}
                    {support.specialEffect && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                        <p className="font-bold text-purple-700 text-xs mb-2">Special Effects</p>
                        <div className="space-y-1 text-xs">
                          {support.specialEffect.statGainMultiplier && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Stat Gain</span>
                              <span className="text-pocket-green font-bold">{support.specialEffect.statGainMultiplier}x</span>
                            </div>
                          )}
                          {support.specialEffect.failRateReduction && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Fail Rate</span>
                              <span className="text-pocket-green font-bold">-{(support.specialEffect.failRateReduction * 100).toFixed(0)}%</span>
                            </div>
                          )}
                          {support.specialEffect.maxEnergyBonus && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Max Energy</span>
                              <span className="text-pocket-green font-bold">+{support.specialEffect.maxEnergyBonus}</span>
                            </div>
                          )}
                          {support.specialEffect.restBonus && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Rest Bonus</span>
                              <span className="text-pocket-green font-bold">+{support.specialEffect.restBonus}</span>
                            </div>
                          )}
                          {support.specialEffect.energyRegenBonus && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Energy Regen</span>
                              <span className="text-pocket-green font-bold">+{support.specialEffect.energyRegenBonus}</span>
                            </div>
                          )}
                          {support.specialEffect.skillPointMultiplier && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">SP Mult</span>
                              <span className="text-pocket-green font-bold">{support.specialEffect.skillPointMultiplier}x</span>
                            </div>
                          )}
                          {support.specialEffect.friendshipGainBonus && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Friendship Gain</span>
                              <span className="text-pocket-green font-bold">+{support.specialEffect.friendshipGainBonus}</span>
                            </div>
                          )}
                          {support.specialEffect.energyCostReduction && (
                            <div className="flex justify-between">
                              <span className="text-pocket-text-light">Energy Cost</span>
                              <span className="text-pocket-green font-bold">-{support.specialEffect.energyCostReduction}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Move Hints */}
                    {support.moveHints && support.moveHints.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="font-bold text-gray-700 text-xs mb-2">Move Hints</p>
                        <div className="flex flex-wrap gap-1">
                          {support.moveHints.map((move, idx) => {
                            const moveData = MOVES[move];
                            const moveType = moveData?.type || 'Normal';
                            const typeColor = TYPE_COLORS[moveType] || '#A8A878';
                            return (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                                style={{ backgroundColor: typeColor }}
                              >
                                {move}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Close button */}
              <button
                onClick={() => setSelectedSupport(null)}
                className="w-full mt-4 py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportGachaScreen;
