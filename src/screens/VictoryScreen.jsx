/**
 * VictoryScreen Component
 *
 * Displayed when the player defeats all 5 gym leaders and the Elite Four.
 * Shows final Pokemon stats, grade, aptitudes, and earned inspirations.
 */

import React from 'react';
import { Trophy, ArrowLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade,
  StatIcon
} from '../utils/gameUtils';
import { TypeBadge } from '../components/TypeIcon';

/**
 * Generate inspirations based on final Pokemon stats, aptitudes, and strategy
 */
const generateInspirations = (stats, aptitudes, strategyGrade = 'C') => {
  // Find the highest stat for stat inspiration
  const statEntries = Object.entries(stats);
  const highestStat = statEntries.reduce((best, [name, value]) => {
    return value > best.value ? { name, value } : best;
  }, { name: statEntries[0][0], value: statEntries[0][1] });

  // Calculate stars based on stat value - champions get better inspirations
  const statStars = highestStat.value >= 350 ? 3 : highestStat.value >= 200 ? 2 : 1;

  // Find best aptitude for aptitude inspiration
  const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
  const aptitudeEntries = Object.entries(aptitudes || {});
  const bestAptitude = aptitudeEntries.reduce((best, [color, grade]) => {
    const currentIdx = aptitudeOrder.indexOf(grade);
    const bestIdx = aptitudeOrder.indexOf(best.grade);
    return currentIdx > bestIdx ? { color, grade } : best;
  }, { color: aptitudeEntries[0]?.[0] || 'Red', grade: aptitudeEntries[0]?.[1] || 'D' });

  // Calculate stars based on aptitude grade
  const aptitudeStars = ['S', 'A'].includes(bestAptitude.grade) ? 3 :
                        ['B', 'C'].includes(bestAptitude.grade) ? 2 : 1;

  // Calculate strategy stars based on strategy grade (same distribution as aptitudes)
  const strategyIndex = aptitudeOrder.indexOf(strategyGrade);
  let strategyStars = 1;
  if (strategyIndex <= 3) { // F, E, D, C
    strategyStars = 1;
  } else if (strategyIndex === 4) { // B
    strategyStars = 2;
  } else { // A, S
    strategyStars = 3;
  }

  const colorToType = {
    'Red': 'Fire',
    'Blue': 'Water',
    'Green': 'Grass',
    'Purple': 'Psychic',
    'Yellow': 'Electric',
    'Orange': 'Fighting'
  };

  return {
    stat: {
      name: highestStat.name,
      value: highestStat.value,
      stars: statStars
    },
    aptitude: {
      name: colorToType[bestAptitude.color] || bestAptitude.color,
      color: bestAptitude.color,
      grade: bestAptitude.grade,
      stars: aptitudeStars
    },
    strategy: {
      grade: strategyGrade,
      stars: strategyStars
    }
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

  const typeMap = { Red: 'Fire', Blue: 'Water', Green: 'Grass', Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting' };

  // Use inspirations from completedCareerData (generated in BattleScreen before career completion)
  // Fall back to generating locally if not available
  const inspirations = completedCareerData?.inspirations ||
    (completedCareerData?.currentStats && completedCareerData?.pokemon?.typeAptitudes
      ? generateInspirations(
          completedCareerData.currentStats,
          completedCareerData.pokemon.typeAptitudes,
          completedCareerData.pokemon.strategyGrade || 'C'
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

          {/* Aptitudes */}
          {Object.keys(aptitudes).length > 0 && (
            <div className="bg-pocket-bg rounded-xl p-4">
              <h3 className="font-bold text-pocket-text text-sm mb-3 text-center">Attack Aptitudes</h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Object.entries(aptitudes).map(([aptitude, aptGrade]) => (
                  <div key={aptitude} className="text-center">
                    <div className="text-pocket-text-light font-semibold mb-1">
                      {typeMap[aptitude] || aptitude}
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: getGradeColor(aptGrade) }}
                    >
                      {aptGrade}
                    </span>
                  </div>
                ))}
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
                  <div className="font-bold text-pocket-text mb-1 text-sm">Aptitude</div>
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
