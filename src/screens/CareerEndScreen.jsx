/**
 * CareerEndScreen Component
 *
 * Displayed when the player completes all 60 turns.
 * Shows final Pokemon stats, grade, aptitudes, and earned inspirations.
 */

import React from 'react';
import { ArrowLeft, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor,
  StatIcon
} from '../utils/gameUtils';
import { TypeBadge } from '../components/TypeIcon';

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

const CareerEndScreen = () => {
  const { setGameState, setSelectedPokemon, setSelectedSupports, setCareerData } = useGame();
  const { trainedPokemon, loadTrainedPokemon } = useInventory();

  // Get the most recent trained pokemon (just added)
  const completedPokemon = trainedPokemon[trainedPokemon.length - 1];

  const typeMap = { Fire: 'Fire', Water: 'Water', Grass: 'Grass', Electric: 'Electric', Psychic: 'Psychic', Fighting: 'Fighting' };

  const handleReturn = () => {
    setGameState('menu');
    setSelectedPokemon(null);
    setSelectedSupports([]);
    setCareerData(null);
    loadTrainedPokemon();
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
            onClick={handleReturn}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-pocket-blue" />
            <span className="font-bold text-pocket-text">Career Complete</span>
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
        {/* Completion Banner */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-card-lg p-6 mb-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Trophy size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1">Career Complete!</h1>
          <p className="text-white/90 text-sm">
            Completed all 60 turns!
          </p>
        </motion.div>

        {completedPokemon && (
          <>
            {/* Pokemon Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-card p-5 mb-4"
            >
              <div className="flex justify-center mb-3">
                {generatePokemonSprite(completedPokemon.type, completedPokemon.name)}
              </div>
              <h2 className="text-xl font-bold text-pocket-text text-center mb-2">{completedPokemon.name}</h2>
              <div className="flex justify-center mb-3">
                <TypeBadge type={completedPokemon.type} size={16} />
              </div>
              <div className="flex justify-center mb-4">
                <span
                  className="px-4 py-1.5 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: getGradeColor(completedPokemon.grade) }}
                >
                  Grade: {completedPokemon.grade}
                </span>
              </div>

              {/* Final Stats */}
              <div className="bg-pocket-bg rounded-xl p-4 mb-4">
                <h3 className="font-bold text-pocket-text text-sm mb-3 text-center">Final Stats</h3>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {Object.entries(completedPokemon.stats).map(([stat, value]) => (
                    <div key={stat} className="flex flex-col items-center gap-1">
                      <StatIcon stat={stat} size={14} />
                      <span className="font-bold text-pocket-text">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aptitudes */}
              {completedPokemon.aptitudes && Object.keys(completedPokemon.aptitudes).length > 0 && (
                <div className="bg-pocket-bg rounded-xl p-4">
                  <h3 className="font-bold text-pocket-text text-sm mb-3 text-center">Attack Aptitudes</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(completedPokemon.aptitudes).map(([aptitude, grade]) => (
                      <div key={aptitude} className="text-center">
                        <div className="text-pocket-text-light font-semibold mb-1">
                          {typeMap[aptitude] || aptitude}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(grade) }}
                        >
                          {grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Inspirations */}
            {completedPokemon.inspirations && (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-card p-5 mb-4"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star size={18} className="text-type-psychic" />
                  <h3 className="font-bold text-pocket-text">Inspirations Earned</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Stat Inspiration */}
                  <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                    <div className="text-[10px] font-bold text-type-psychic mb-1">STAT INSPIRATION</div>
                    <div className="font-bold text-pocket-text mb-1">{completedPokemon.inspirations.stat.name}</div>
                    <div className="text-xs text-pocket-text-light mb-2">Value: {completedPokemon.inspirations.stat.value}</div>
                    <div className="flex gap-0.5">
                      {[...Array(completedPokemon.inspirations.stat.stars)].map((_, i) => (
                        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Aptitude Inspiration */}
                  <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                    <div className="text-[10px] font-bold text-type-psychic mb-1">APTITUDE INSPIRATION</div>
                    <div className="font-bold text-pocket-text mb-1">{completedPokemon.inspirations.aptitude.name}</div>
                    <div className="text-xs text-pocket-text-light mb-2">Grade: {completedPokemon.inspirations.aptitude.grade}</div>
                    <div className="flex gap-0.5">
                      {[...Array(completedPokemon.inspirations.aptitude.stars)].map((_, i) => (
                        <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
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

export default CareerEndScreen;
