/**
 * VictoryScreen Component
 *
 * Displayed when the player defeats all 5 gym leaders and the Elite Four.
 * Shows final Pokemon stats, grade, aptitudes, and earned inspirations.
 */

import React from 'react';
import { Trophy, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade,
  getAptitudeColor,
  StatIcon
} from '../utils/gameUtils';
import { TypeBadge, TypeIcon } from '../components/TypeIcon';

/**
 * Generate inspirations based on final Pokemon stats, aptitudes, and strategy aptitudes
 * Picks a RANDOM stat, RANDOM type aptitude, and RANDOM strategy aptitude
 * Determines stars based on value/grade with identical weighting for aptitudes and strategies
 */
const generateInspirations = (stats, aptitudes, strategyAptitudes = null) => {
  if (!stats || Object.keys(stats).length === 0) return null;

  const colorToType = {
    'Red': 'Fire',
    'Blue': 'Water',
    'Green': 'Grass',
    'Purple': 'Psychic',
    'Yellow': 'Electric',
    'Orange': 'Fighting'
  };

  const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

  // Helper function to determine stars from grade (same weighting for both aptitudes and strategies)
  // F-C grade: 75% chance 1 star, 25% chance 2 star
  // B-S grade: 50% chance 1 star, 30% chance 2 star, 20% chance 3 star
  const getStarsFromGrade = (grade) => {
    const index = aptitudeOrder.indexOf(grade);
    const roll = Math.random();

    if (index <= 3) {
      // F, E, D, C: 75% 1-star, 25% 2-star
      return roll < 0.75 ? 1 : 2;
    } else {
      // B, A, S: 50% 1-star, 30% 2-star, 20% 3-star
      if (roll < 0.50) return 1;
      if (roll < 0.80) return 2;
      return 3;
    }
  };

  // Pick a RANDOM stat
  const statNames = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];
  const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
  const statValue = stats[randomStat];

  if (statValue === undefined) return null;

  // Determine stat stars based on stat value - champions get better inspirations
  const statStars = statValue >= 350 ? 3 : statValue >= 200 ? 2 : 1;

  // Pick a RANDOM type aptitude
  const aptitudeKeys = Object.keys(aptitudes || {});
  let aptitudeResult = { name: 'Fire', color: 'Red', grade: 'D', stars: 1 };

  if (aptitudeKeys.length > 0) {
    const randomAptitudeKey = aptitudeKeys[Math.floor(Math.random() * aptitudeKeys.length)];
    const aptitudeGrade = aptitudes[randomAptitudeKey];
    aptitudeResult = {
      name: colorToType[randomAptitudeKey] || randomAptitudeKey,
      color: randomAptitudeKey,
      grade: aptitudeGrade,
      stars: getStarsFromGrade(aptitudeGrade)
    };
  }

  // Pick a RANDOM strategy from strategyAptitudes (same logic as type aptitudes)
  let strategyResult = { name: 'Chipper', grade: 'C', stars: 1 };

  if (strategyAptitudes && typeof strategyAptitudes === 'object') {
    const strategyKeys = Object.keys(strategyAptitudes);
    if (strategyKeys.length > 0) {
      const randomStrategyKey = strategyKeys[Math.floor(Math.random() * strategyKeys.length)];
      const strategyGrade = strategyAptitudes[randomStrategyKey];
      strategyResult = {
        name: randomStrategyKey,
        grade: strategyGrade,
        stars: getStarsFromGrade(strategyGrade)
      };
    }
  }

  return {
    stat: {
      name: randomStat,
      value: statValue,
      stars: statStars
    },
    aptitude: aptitudeResult,
    strategy: strategyResult
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const VictoryScreen = () => {
  const { setGameState, setSelectedPokemon, setSelectedSupports, completedCareerData, setCompletedCareerData } = useGame();
  const { loadTrainedPokemon } = useInventory();

  const typeMap = { Fire: 'Fire', Water: 'Water', Grass: 'Grass', Electric: 'Electric', Psychic: 'Psychic', Fighting: 'Fighting' };

  // Use inspirations from completedCareerData (generated in BattleScreen before career completion)
  // Fall back to generating locally if not available
  const inspirations = completedCareerData?.inspirations ||
    (completedCareerData?.currentStats && completedCareerData?.pokemon?.typeAptitudes
      ? generateInspirations(
          completedCareerData.currentStats,
          completedCareerData.pokemon.typeAptitudes,
          completedCareerData.pokemon.strategyAptitudes
        )
      : null);

  const handleReturn = () => {
    setGameState('menu');
    setSelectedPokemon(null);
    setSelectedSupports([]);
    setCompletedCareerData(null);
    loadTrainedPokemon();
  };

  // If no career data, show loading state
  if (!completedCareerData) {
    return (
      <div className="min-h-screen bg-pocket-bg p-4">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-lg mx-auto"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleReturn}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <span className="font-bold text-pocket-text">Champion!</span>
            </div>
            <div className="w-10" />
          </div>
        </motion.header>

        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <Trophy size={32} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-pocket-text mb-2">CHAMPION!</h1>
            <p className="text-pocket-text-light mb-6">Loading results...</p>
            <button onClick={handleReturn} className="pocket-btn-purple px-6 py-3">
              Return to Menu
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const pokemonName = completedCareerData.pokemon?.name || 'Unknown';
  const pokemonType = completedCareerData.pokemon?.primaryType || 'Normal';
  const finalStats = completedCareerData.currentStats || {};
  const aptitudes = completedCareerData.pokemon?.typeAptitudes || {};
  const grade = getPokemonGrade(finalStats);
  const finalTurn = completedCareerData.turn || 63;

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
            onClick={handleReturn}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            <span className="font-bold text-pocket-text">Champion!</span>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-lg mx-auto"
      >
        {/* Victory Banner */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl shadow-card-lg p-6 mb-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Trophy size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1">CHAMPION!</h1>
          <p className="text-white/90 text-sm">
            You defeated all gym leaders and the Elite Four!
          </p>
          <p className="text-white/70 text-xs mt-1">
            Completed on Turn {finalTurn}
          </p>
          {completedCareerData.primosReward > 0 && (
            <div className="mt-3 bg-white/20 rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <Sparkles className="text-white" size={18} />
              <span className="text-white font-bold">+{completedCareerData.primosReward} Primos</span>
              <Sparkles className="text-white" size={18} />
            </div>
          )}
        </motion.div>

        {/* Pokemon Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-card p-5 mb-4"
        >
          <div className="flex justify-center mb-3">
            {generatePokemonSprite(pokemonType, pokemonName)}
          </div>
          <h2 className="text-xl font-bold text-pocket-text text-center mb-2">{pokemonName}</h2>
          <div className="flex justify-center mb-3">
            <TypeBadge type={pokemonType} size={16} />
          </div>
          <div className="flex justify-center mb-4">
            <span
              className="px-4 py-1.5 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: getGradeColor(grade) }}
            >
              Grade: {grade}
            </span>
          </div>

          {/* Final Stats */}
          <div className="bg-pocket-bg rounded-xl p-4 mb-4">
            <h3 className="font-bold text-pocket-text text-sm mb-3 text-center">Final Stats</h3>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {Object.entries(finalStats).map(([stat, value]) => (
                <div key={stat} className="flex flex-col items-center gap-1">
                  <StatIcon stat={stat} size={14} />
                  <span className="font-bold text-pocket-text">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type Aptitudes */}
          {Object.keys(aptitudes).length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-bold text-blue-700 text-sm mb-3 text-center">Type Aptitudes</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(aptitudes).map(([aptitude, aptGrade]) => {
                  const typeName = typeMap[aptitude] || aptitude;
                  return (
                    <div
                      key={aptitude}
                      className="flex justify-between items-center px-2 py-1 rounded bg-white"
                    >
                      <TypeIcon type={typeName} size={16} />
                      <span
                        className="px-2 py-0.5 rounded text-white font-bold"
                        style={{ backgroundColor: getAptitudeColor(aptGrade) }}
                      >
                        {aptGrade}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Inspirations */}
        {inspirations && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-card p-5 mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star size={18} className="text-type-psychic" />
              <h3 className="font-bold text-pocket-text">Inspirations Earned</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Stat Inspiration */}
              <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                <div className="text-[10px] font-bold text-type-psychic mb-1">STAT</div>
                <div className="font-bold text-pocket-text mb-1 text-sm">{inspirations.stat.name}</div>
                <div className="text-xs text-pocket-text-light mb-2">Value: {inspirations.stat.value}</div>
                <div className="flex gap-0.5">
                  {[...Array(inspirations.stat.stars)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Aptitude Inspiration */}
              <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                <div className="text-[10px] font-bold text-type-psychic mb-1">APTITUDE</div>
                <div className="font-bold text-pocket-text mb-1 text-sm">{inspirations.aptitude.name}</div>
                <div className="text-xs text-pocket-text-light mb-2">Grade: {inspirations.aptitude.grade}</div>
                <div className="flex gap-0.5">
                  {[...Array(inspirations.aptitude.stars)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Strategy Inspiration */}
              {inspirations.strategy && (
                <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                  <div className="text-[10px] font-bold text-type-psychic mb-1">STRATEGY</div>
                  <div className="font-bold text-pocket-text mb-1 text-sm">{inspirations.strategy.name}</div>
                  <div className="text-xs text-pocket-text-light mb-2">Grade: {inspirations.strategy.grade}</div>
                  <div className="flex gap-0.5">
                    {[...Array(inspirations.strategy.stars)].map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Return Button */}
        <motion.div variants={itemVariants}>
          <button
            onClick={handleReturn}
            className="w-full pocket-btn-purple py-4 text-lg"
          >
            Return to Menu
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VictoryScreen;
