/**
 * TrainedPokemonScreen Component
 *
 * Displays Pokemon that have completed careers with their final stats,
 * grade, and inspirations. Shows trained Pokemon history with sorting and filtering.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Trophy, Star, Shield, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor,
  getAptitudeColor,
  StatIcon
} from '../utils/gameUtils';
import { TypeBadge, TypeIcon, TYPE_COLORS } from '../components/TypeIcon';
import { MOVES } from '../shared/gameData';
import StatRadarChart from '../components/StatRadarChart';

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

  const { trainedPokemon, deleteTrainedPokemon } = useInventory();

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [detailPokemon, setDetailPokemon] = useState(null);

  // Long-press state for detail modal
  const longPressTimerRef = useRef(null);
  const longPressPokemonRef = useRef(null);
  const LONG_PRESS_DURATION = 500; // 500ms hold to trigger

  const handleLongPressStart = useCallback((pokemon) => {
    longPressPokemonRef.current = pokemon;
    longPressTimerRef.current = setTimeout(() => {
      setDetailPokemon(longPressPokemonRef.current);
    }, LONG_PRESS_DURATION);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressPokemonRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleDelete = async (trained) => {
    setDeleting(true);
    try {
      await deleteTrainedPokemon(trained.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete trained Pokemon:', error);
    } finally {
      setDeleting(false);
    }
  };

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

  // Helper to calculate total stats
  const getStatTotal = (stats) => {
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
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

          {/* Instruction hint */}
          <p className="text-xs text-pocket-text-light mt-3 text-center">
            Hold a Pokemon to view full details
          </p>
        </motion.div>

        {/* Pokemon Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {sortedTrainedPokemon.map((trained, idx) => {
            const statTotal = getStatTotal(trained.stats);
            return (
            <motion.div
              key={trained.id || idx}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              onMouseDown={() => handleLongPressStart(trained)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(trained)}
              onTouchEnd={handleLongPressEnd}
              className="pokemon-card relative cursor-pointer select-none"
            >
              <div className="mb-1">
                {generatePokemonSprite(trained.type, trained.name)}
              </div>
              <h3 className="font-bold text-pocket-text text-sm text-center">{trained.name}</h3>
              <div className="flex justify-center my-1">
                <TypeBadge type={trained.type} size={14} />
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: getGradeColor(trained.grade) }}
                >
                  {trained.grade || '?'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {statTotal}
                </span>
              </div>
              {/* Gyms Defeated & Date */}
              <div className="flex items-center justify-center gap-2 text-[10px] text-pocket-text-light mb-2">
                <div className="flex items-center gap-1">
                  <Shield size={10} className="text-amber-500" />
                  <span className="font-semibold">{trained.gymsDefeated || 0}/8</span>
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
                  {trained.inspirations.strategy && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-pocket-text">{trained.inspirations.strategy.name}</span>
                      <div className="flex gap-0.5">
                        {[...Array(trained.inspirations.strategy.stars)].map((_, i) => (
                          <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  )}
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
          );
          })}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 size={20} className="text-white" />
                  <h2 className="text-lg font-bold text-white">Delete Pokemon</h2>
                </div>
                <button
                  onClick={() => !deleting && setDeleteConfirm(null)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  disabled={deleting}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  {generatePokemonSprite(deleteConfirm.type, deleteConfirm.name)}
                </div>
                <h3 className="font-bold text-pocket-text text-lg mb-2">{deleteConfirm.name}</h3>
                <p className="text-pocket-text-light text-sm mb-4">
                  Are you sure you want to delete this trained Pokemon? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-pocket-text font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pokemon Detail Modal */}
      <AnimatePresence>
        {detailPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailPokemon(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-card-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setDetailPokemon(null)}
                className="absolute top-3 right-3 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {(() => {
                const pokemon = detailPokemon;
                const grade = pokemon.grade;
                const statTotal = getStatTotal(pokemon.stats);

                return (
                  <>
                    {/* Pokemon sprite and name */}
                    <div className="text-center mb-4">
                      <div className="mb-2 flex justify-center">
                        {generatePokemonSprite(pokemon.primaryType || pokemon.type, pokemon.name)}
                      </div>
                      <h3 className="font-bold text-xl text-pocket-text">{pokemon.name}</h3>
                      <div className="flex justify-center gap-2 mt-2">
                        <TypeBadge type={pokemon.primaryType || pokemon.type} size={16} />
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: getGradeColor(grade) }}
                        >
                          {grade}
                        </span>
                        <span className="text-sm text-pocket-text-light">
                          Total: {statTotal}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-pocket-text-light">
                        <div className="flex items-center gap-1">
                          <Shield size={12} className="text-amber-500" />
                          <span>{pokemon.gymsDefeated || 0}/8 Gyms</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(pokemon.completedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    {pokemon.stats && (
                      <div className="bg-pocket-bg rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-pocket-text text-sm mb-2">Stats</h4>
                        <StatRadarChart stats={pokemon.stats} size={160} color="#3B82F6" />
                      </div>
                    )}

                    {/* Strategy Aptitudes */}
                    {pokemon.strategyAptitudes && Object.keys(pokemon.strategyAptitudes).length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-purple-700 text-sm mb-2">Strategy Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.strategyAptitudes).map(([strategy, aptGrade]) => (
                            <div
                              key={strategy}
                              className="flex justify-between items-center px-2 py-1 rounded bg-white"
                            >
                              <span className="text-pocket-text">{strategy}</span>
                              <span
                                className="px-2 py-0.5 rounded text-white font-bold"
                                style={{ backgroundColor: getAptitudeColor(aptGrade) }}
                              >
                                {aptGrade}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Type Aptitudes */}
                    {pokemon.typeAptitudes && Object.keys(pokemon.typeAptitudes).length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-blue-700 text-sm mb-2">Type Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.typeAptitudes).map(([color, aptGrade]) => {
                            const typeName = colorToType[color] || color;
                            return (
                              <div
                                key={color}
                                className="flex justify-between items-center px-2 py-1 rounded bg-white"
                              >
                                <TypeIcon type={typeName} size={16} showLabel={true} />
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

                    {/* Learned Moves */}
                    {pokemon.abilities && pokemon.abilities.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-blue-700 text-sm mb-2">Known Moves ({pokemon.abilities.length})</h4>
                        <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto">
                          {pokemon.abilities.map((moveName, idx) => {
                            const move = MOVES && MOVES[moveName];
                            const moveType = move?.type || pokemon.primaryType || pokemon.type || 'Normal';
                            const typeColor = TYPE_COLORS[moveType] || '#A8A878';
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-2 py-1.5 rounded bg-white border-l-4"
                                style={{ borderLeftColor: typeColor }}
                              >
                                <div className="flex items-center gap-2">
                                  <TypeBadge type={moveType} size={12} />
                                  <span className="font-semibold text-pocket-text">{moveName}</span>
                                </div>
                                {move && (
                                  <div className="flex items-center gap-2 text-pocket-text-light">
                                    <span title="Damage">⚔️{move.damage}</span>
                                    <span title="Stamina">💪{move.stamina}</span>
                                    <span title="Warmup/Cooldown">⏱️{move.warmup}/{move.cooldown}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inspirations */}
                    {pokemon.inspirations && pokemon.inspirations.stat && pokemon.inspirations.aptitude && (
                      <div className="bg-amber-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-amber-700 text-sm mb-2">Inspirations</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-pocket-text">{pokemon.inspirations.stat.name}</span>
                            <div className="flex gap-0.5">
                              {[...Array(pokemon.inspirations.stat.stars || 0)].map((_, i) => (
                                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-pocket-text">
                              {colorToType[pokemon.inspirations.aptitude.name] || pokemon.inspirations.aptitude.name}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(pokemon.inspirations.aptitude.stars || 0)].map((_, i) => (
                                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          {pokemon.inspirations.strategy && (
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-pocket-text">{pokemon.inspirations.strategy.name}</span>
                              <div className="flex gap-0.5">
                                {[...Array(pokemon.inspirations.strategy.stars || 0)].map((_, i) => (
                                  <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailPokemon(null)}
                        className="flex-1 py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirm(pokemon);
                          setDetailPokemon(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainedPokemonScreen;
