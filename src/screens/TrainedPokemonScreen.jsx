/**
 * TrainedPokemonScreen Component
 *
 * Displays Pokemon that have completed careers with their final stats,
 * grade, and inspirations. Shows trained Pokemon history with sorting and filtering.
 */

import React from 'react';
import { ArrowLeft, Trophy, Star, Shield } from 'lucide-react';
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
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const TrainedPokemonScreen = () => {
  const {
    setGameState,
    trainedSortBy,
    setTrainedSortBy,
    trainedFilterGrade,
    setTrainedFilterGrade
  } = useGame();

  const { trainedPokemon } = useInventory();

  // Sort trained pokemon
  const sortTrainedPokemon = (inventory) => {
    const sorted = [...inventory];
    switch (trainedSortBy) {
      case 'date':
        return sorted.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); // Most recent first
      case 'grade':
        const gradeOrder = ['UU+', 'UU', 'S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E+', 'E', 'F+', 'F'];
        return sorted.sort((a, b) => {
          const indexA = gradeOrder.indexOf(a.grade);
          const indexB = gradeOrder.indexOf(b.grade);
          return indexA - indexB;
        });
      case 'type':
        return sorted.sort((a, b) => {
          const typeA = a.type || 'Normal';
          const typeB = b.type || 'Normal';
          return typeA.localeCompare(typeB);
        });
      case 'gyms':
        return sorted.sort((a, b) => (b.gymsDefeated || 0) - (a.gymsDefeated || 0)); // Most gyms first
      default:
        return sorted;
    }
  };

  // Filter by grade
  const filteredTrainedPokemon = trainedFilterGrade === 'all'
    ? trainedPokemon
    : trainedPokemon.filter(p => {
        const baseGrade = p.grade.replace('+', '');
        return baseGrade === trainedFilterGrade;
      });

  const sortedTrainedPokemon = sortTrainedPokemon(filteredTrainedPokemon);

  const colorToType = {
    Red: 'Fire',
    Blue: 'Water',
    Green: 'Grass',
    Yellow: 'Electric',
    Purple: 'Psychic',
    Orange: 'Fighting'
  };

  return (
    <div className="min-h-screen bg-pocket-bg p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setGameState('menu')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            <span className="font-bold text-pocket-text">Hall of Fame</span>
          </div>
          <span className="text-pocket-text-light text-sm font-semibold">
            {trainedPokemon.length} trained
          </span>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          {/* Sort Options */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-sm font-semibold text-pocket-text-light">Sort:</span>
            {[
              { key: 'date', label: 'Date' },
              { key: 'grade', label: 'Grade' },
              { key: 'type', label: 'Type' },
              { key: 'gyms', label: 'Gyms' }
            ].map(sort => (
              <button
                key={sort.key}
                onClick={() => setTrainedSortBy(sort.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  trainedSortBy === sort.key
                    ? 'bg-amber-500 text-white'
                    : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>

          {/* Grade Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-pocket-text-light">Filter:</span>
            <button
              onClick={() => setTrainedFilterGrade('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                trainedFilterGrade === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {['UU', 'S', 'A', 'B', 'C', 'D', 'E'].map(grade => (
              <button
                key={grade}
                onClick={() => setTrainedFilterGrade(grade)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  trainedFilterGrade === grade ? 'text-white' : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                }`}
                style={trainedFilterGrade === grade ? { backgroundColor: getGradeColor(grade) } : {}}
              >
                {grade}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pokemon Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {sortedTrainedPokemon.map((trained, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="pokemon-card"
            >
              <div className="mb-2">
                {generatePokemonSprite(trained.type, trained.name)}
              </div>
              <h3 className="font-bold text-pocket-text text-sm text-center">{trained.name}</h3>
              <div className="flex justify-center my-2">
                <TypeBadge type={trained.type} size={14} />
              </div>
              <div className="flex justify-center mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: getGradeColor(trained.grade) }}
                >
                  {trained.grade || '?'}
                </span>
              </div>
              {/* Gyms Defeated & Date */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-pocket-text-light mb-2">
                <div className="flex items-center gap-1">
                  <Shield size={10} className="text-amber-500" />
                  <span className="font-semibold">{trained.gymsDefeated || 0}/7</span>
                </div>
                <span>•</span>
                <span>{new Date(trained.completedAt).toLocaleDateString()}</span>
              </div>

              {/* Inspirations Display */}
              {trained.inspirations && trained.inspirations.stat && trained.inspirations.aptitude ? (
                <div className="bg-pocket-bg rounded-lg p-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-pocket-text">{trained.inspirations.stat.name}</span>
                    <div className="flex gap-0.5">
                      {[...Array(trained.inspirations.stat.stars)].map((_, i) => (
                        <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-pocket-text">
                      {colorToType[trained.inspirations.aptitude.name] || trained.inspirations.aptitude.name}
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(trained.inspirations.aptitude.stars)].map((_, i) => (
                        <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-pocket-red text-center">No Inspirations</div>
              )}

              {trained.stats && (
                <div className="grid grid-cols-2 gap-1 text-[10px] mt-2">
                  <div className="flex items-center gap-1">
                    <StatIcon stat="HP" size={10} />
                    <span className="text-pocket-text-light">{trained.stats.HP}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Attack" size={10} />
                    <span className="text-pocket-text-light">{trained.stats.Attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Defense" size={10} />
                    <span className="text-pocket-text-light">{trained.stats.Defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatIcon stat="Instinct" size={10} />
                    <span className="text-pocket-text-light">{trained.stats.Instinct}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2 justify-center">
                    <StatIcon stat="Speed" size={10} />
                    <span className="text-pocket-text-light">{trained.stats.Speed}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {trainedPokemon.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <Trophy size={32} className="text-amber-500" />
            </div>
            <p className="text-pocket-text mb-2">No trained Pokemon yet!</p>
            <p className="text-sm text-pocket-text-light mb-4">
              Complete a career to add your first trained Pokemon.
            </p>
            <button
              onClick={() => setGameState('menu')}
              className="pocket-btn-primary px-6 py-2"
            >
              Back to Menu
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrainedPokemonScreen;
