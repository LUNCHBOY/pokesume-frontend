/**
 * PvPTeamSelectScreen Component
 *
 * Team selection screen for PvP matchmaking.
 * Player selects 3 trained Pokemon from their inventory.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Swords, Search, Filter, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { TypeBadge, TYPE_COLORS } from '../components/TypeIcon';
import { generatePokemonSprite, getPokemonGrade, getGradeColor } from '../utils/gameUtils';
import { ABILITIES } from '../shared/gameData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const PvPTeamSelectScreen = () => {
  const { setGameState, setPvPSelectedTeam } = useGame();
  const { authToken } = useAuth();
  const { trainedPokemon, loadTrainedPokemon, trainedLoading } = useInventory();

  const [selectedPokemon, setSelectedPokemon] = useState([null, null, null]);
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

  // Sort and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'grade', 'type'
  const [filterType, setFilterType] = useState('all'); // 'all' or specific type
  const [showFilters, setShowFilters] = useState(false);

  // Get unique types from trained Pokemon
  const availableTypes = useMemo(() => {
    const types = new Set();
    trainedPokemon.forEach(p => {
      const type = p.primaryType || p.type;
      if (type) types.add(type);
    });
    return ['all', ...Array.from(types).sort()];
  }, [trainedPokemon]);

  // Filter and sort trained Pokemon
  const filteredAndSortedPokemon = useMemo(() => {
    const gradeOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6 };
    let result = [...trainedPokemon];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => (p.name || '').toLowerCase().includes(query));
    }

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(p => (p.primaryType || p.type) === filterType);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'grade':
          const gradeA = a.grade || getPokemonGrade(a.stats);
          const gradeB = b.grade || getPokemonGrade(b.stats);
          return (gradeOrder[gradeA] || 6) - (gradeOrder[gradeB] || 6);
        case 'type':
          return (a.primaryType || a.type || '').localeCompare(b.primaryType || b.type || '');
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return result;
  }, [trainedPokemon, searchQuery, sortBy, filterType]);

  useEffect(() => {
    if (authToken) {
      loadTrainedPokemon(100, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const handleSelectPokemon = (pokemon) => {
    // Check if already selected (by roster ID)
    const existingIndex = selectedPokemon.findIndex(p => p?.id === pokemon.id);

    if (existingIndex >= 0) {
      // Deselect
      const newSelected = [...selectedPokemon];
      newSelected[existingIndex] = null;
      setSelectedPokemon(newSelected);
    } else {
      // Check if same species is already selected
      const speciesAlreadySelected = selectedPokemon.some(p => p && p.name === pokemon.name);
      if (speciesAlreadySelected) {
        return; // Don't allow duplicate species
      }

      // Select in first empty slot
      const emptyIndex = selectedPokemon.findIndex(p => p === null);
      if (emptyIndex >= 0) {
        const newSelected = [...selectedPokemon];
        newSelected[emptyIndex] = pokemon;
        setSelectedPokemon(newSelected);
      }
    }
  };

  const isSelected = (pokemon) => {
    return selectedPokemon.some(p => p?.id === pokemon.id);
  };

  // Check if same species is already selected (different roster but same name)
  const isSpeciesSelected = (pokemon) => {
    return selectedPokemon.some(p => p && p.name === pokemon.name && p.id !== pokemon.id);
  };

  const getSelectionIndex = (pokemon) => {
    return selectedPokemon.findIndex(p => p?.id === pokemon.id);
  };

  const canProceed = selectedPokemon.filter(p => p !== null).length === 3;

  const handleEnterQueue = () => {
    if (canProceed) {
      setPvPSelectedTeam(selectedPokemon);
      setGameState('pvpQueue');
    }
  };

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
            onClick={() => setGameState('pvp')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Swords size={20} className="text-type-fighting" />
            <span className="font-bold text-pocket-text">Select Your Team</span>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* Selected Team Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          <h3 className="font-bold text-pocket-text mb-3">Your Team (Select 3)</h3>
          <div className="grid grid-cols-3 gap-3">
            {selectedPokemon.map((pokemon, index) => (
              <div
                key={index}
                className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center ${
                  pokemon ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {pokemon ? (
                  <div className="text-center p-2">
                    <div className="w-12 h-12 mx-auto mb-1">
                      {generatePokemonSprite(pokemon.primaryType, pokemon.name)}
                    </div>
                    <div className="text-xs font-bold truncate">{pokemon.name}</div>
                    <div className="flex items-center justify-center gap-1">
                      {pokemon.stats && (
                        <span
                          className="px-1 py-0.5 rounded text-[8px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon.stats)) }}
                        >
                          {getPokemonGrade(pokemon.stats)}
                        </span>
                      )}
                      <TypeBadge type={pokemon.primaryType} size={10} className="text-[8px]" />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Slot {index + 1}</div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleEnterQueue}
            disabled={!canProceed}
            className={`w-full mt-4 py-3 rounded-xl font-bold transition-all ${
              canProceed
                ? 'bg-type-fighting text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canProceed ? 'Enter Queue' : `Select ${3 - selectedPokemon.filter(p => p !== null).length} more Pokemon`}
          </button>
        </motion.div>

        {/* Pokemon List */}
        {trainedLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <p className="text-pocket-text-light">Loading your trained Pokemon...</p>
          </motion.div>
        ) : trainedPokemon.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <p className="text-pocket-text mb-2">No trained Pokemon found</p>
            <p className="text-sm text-pocket-text-light mb-4">
              Complete careers to add Pokemon to your roster!
            </p>
            <button
              onClick={() => setGameState('menu')}
              className="pocket-btn-primary px-6 py-2"
            >
              Back to Menu
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-card p-4"
          >
            {/* Header with filter toggle */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-pocket-text">
                Trained Pokemon ({filteredAndSortedPokemon.length})
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-type-fighting text-white' : 'bg-pocket-bg text-pocket-text-light hover:text-pocket-text'}`}
              >
                <Filter size={16} />
              </button>
            </div>

            {/* Search and Filter Controls */}
            {showFilters && (
              <div className="bg-pocket-bg rounded-xl p-3 mb-3 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pocket-text-light" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-type-fighting"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-pocket-text-light hover:text-pocket-text"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Sort By */}
                  <div className="flex-1">
                    <label className="text-[10px] text-pocket-text-light font-bold mb-1 block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-type-fighting bg-white"
                    >
                      <option value="name">Name</option>
                      <option value="grade">Grade</option>
                      <option value="type">Type</option>
                    </select>
                  </div>

                  {/* Filter by Type */}
                  <div className="flex-1">
                    <label className="text-[10px] text-pocket-text-light font-bold mb-1 block">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-type-fighting bg-white"
                    >
                      {availableTypes.map(type => (
                        <option key={type} value={type}>
                          {type === 'all' ? 'All Types' : type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate species warning */}
            <p className="text-[10px] text-pocket-text-light mb-2 italic">
              Note: You cannot select multiple Pokemon of the same species.
            </p>

            {filteredAndSortedPokemon.length === 0 ? (
              <div className="bg-pocket-bg rounded-xl p-8 text-center">
                <p className="text-pocket-text-light mb-2">No Pokemon match your filters</p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                  className="text-xs text-type-fighting font-bold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {filteredAndSortedPokemon.map((pokemon) => {
                  const selected = isSelected(pokemon);
                  const speciesDuplicate = isSpeciesSelected(pokemon);
                  const selectionNum = getSelectionIndex(pokemon) + 1;
                  const grade = pokemon.grade || getPokemonGrade(pokemon.stats);
                  const statTotal = getStatTotal(pokemon.stats);
                  const isDisabled = speciesDuplicate && !selected;

                  return (
                    <motion.div
                      key={pokemon.id}
                      variants={itemVariants}
                      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                      onClick={() => !isDisabled && handleSelectPokemon(pokemon)}
                      onMouseDown={() => !isDisabled && handleLongPressStart(pokemon)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => !isDisabled && handleLongPressStart(pokemon)}
                      onTouchEnd={handleLongPressEnd}
                      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        selected
                          ? 'border-green-500 bg-green-50'
                          : isDisabled
                            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-400 bg-white'
                      }`}
                      title={isDisabled ? `${pokemon.name} already selected` : selected ? 'Click to deselect' : `Hold for details, click to select`}
                    >
                      {/* Selection Badge */}
                      {selected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{selectionNum}</span>
                        </div>
                      )}

                      {/* Duplicate Species Badge */}
                      {isDisabled && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white text-[6px] px-1 rounded font-bold">
                          DUP
                        </div>
                      )}


                      {/* Pokemon Info */}
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-2">
                          {generatePokemonSprite(pokemon.primaryType || pokemon.type, pokemon.name)}
                        </div>
                        <div className="font-bold text-sm truncate mb-1">{pokemon.name}</div>
                        <TypeBadge type={pokemon.primaryType || pokemon.type} size={12} className="text-[10px] mb-1" />

                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: getGradeColor(grade),
                              color: grade === 'UU' || grade === 'S' ? '#fff' : '#333'
                            }}
                          >
                            {grade}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {statTotal}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

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
                const grade = pokemon.grade || getPokemonGrade(pokemon.stats);
                const statTotal = getStatTotal(pokemon.stats);
                const colorToType = {
                  Red: 'Fire', Blue: 'Water', Green: 'Grass',
                  Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting'
                };

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
                    </div>

                    {/* Stats */}
                    {pokemon.stats && (
                      <div className="bg-pocket-bg rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-pocket-text text-sm mb-2">Stats</h4>
                        <div className="space-y-1.5 text-xs">
                          {Object.entries(pokemon.stats).map(([stat, value]) => (
                            <div key={stat} className="flex items-center gap-2">
                              <span className="text-pocket-text-light w-16">{stat}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-pocket-blue"
                                  style={{ width: `${Math.min(100, (value / 500) * 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-pocket-text w-10 text-right">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strategy */}
                    {pokemon.strategy && (
                      <div className="bg-purple-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-purple-700 text-sm mb-1">Strategy</h4>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600">{pokemon.strategy}</span>
                          {pokemon.strategyGrade && (
                            <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-700 text-xs font-bold">
                              {pokemon.strategyGrade}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Type Aptitudes */}
                    {pokemon.typeAptitudes && Object.keys(pokemon.typeAptitudes).length > 0 && (
                      <div className="bg-pocket-bg rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-pocket-text text-sm mb-2">Type Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.typeAptitudes).map(([color, aptGrade]) => {
                            const typeName = colorToType[color] || color;
                            return (
                              <div
                                key={color}
                                className="flex justify-between items-center px-2 py-1 rounded"
                                style={{ backgroundColor: `${TYPE_COLORS[typeName] || '#888'}20` }}
                              >
                                <span style={{ color: TYPE_COLORS[typeName] || '#888' }}>{typeName}</span>
                                <span className="font-bold text-pocket-text">{aptGrade}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Learned Moves */}
                    {pokemon.abilities && pokemon.abilities.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-blue-700 text-sm mb-2">Learned Moves ({pokemon.abilities.length})</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs max-h-32 overflow-y-auto">
                          {pokemon.abilities.map((moveName, idx) => {
                            const move = ABILITIES && ABILITIES[moveName];
                            const moveType = move?.type || pokemon.primaryType || pokemon.type || 'Normal';
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-white"
                              >
                                <TypeBadge type={moveType} size={10} />
                                <span className="truncate text-pocket-text">{moveName}</span>
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

                    {/* Select Button */}
                    <button
                      onClick={() => {
                        handleSelectPokemon(detailPokemon);
                        setDetailPokemon(null);
                      }}
                      disabled={isSpeciesSelected(detailPokemon) || isSelected(detailPokemon)}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${
                        isSelected(detailPokemon)
                          ? 'bg-green-500 text-white'
                          : isSpeciesSelected(detailPokemon)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-type-fighting text-white hover:bg-red-700'
                      }`}
                    >
                      {isSelected(detailPokemon) ? 'Already Selected' : isSpeciesSelected(detailPokemon) ? 'Species Already Selected' : 'Select for Team'}
                    </button>
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

export default PvPTeamSelectScreen;
