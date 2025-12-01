/**
 * SupportSelectionScreen Component
 *
 * Uma Musume style support selection with deck slots.
 * - 5 slots with + signs for empty slots
 * - Modal for selecting supports when clicking a slot
 * - Deck navigation with arrows (5 decks total)
 * - Deck persistence
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Users, Check, X, Diamond, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { useCareer } from '../contexts/CareerContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getRarityColor,
  getSupportCardAttributes,
  StatIcon
} from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS, POKEMON } from '../shared/gameData';
import { getSupportImageFromCardName } from '../constants/trainerImages';
import LimitBreakDiamonds from '../components/LimitBreakDiamonds';
import { apiGetSupportDecks, apiSaveSupportDeck } from '../services/apiService';

const TOTAL_DECKS = 5;
const SLOTS_PER_DECK = 5;

const SupportSelectionScreen = () => {
  const {
    selectedPokemon,
    setSelectedSupports,
    setGameState,
    selectedInspirations
  } = useGame();

  const {
    supportInventory,
    supportInventoryFull,
    getSupportLimitBreak,
    limitBreakSupportWithShards,
    limitBreakShards,
    MAX_LIMIT_BREAK,
    SHARD_COST_PER_LIMIT_BREAK
  } = useInventory();
  const { startCareer, careerLoading } = useCareer();
  const { token } = useAuth();

  // Deck state
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [decks, setDecks] = useState(() => {
    // Initialize 5 empty decks
    return Array(TOTAL_DECKS).fill(null).map(() => Array(SLOTS_PER_DECK).fill(null));
  });
  const [decksLoaded, setDecksLoaded] = useState(false);

  // Modal state
  const [selectingSlotIndex, setSelectingSlotIndex] = useState(null);
  const [detailSupport, setDetailSupport] = useState(null);
  const [isLimitBreaking, setIsLimitBreaking] = useState(false);

  // Long-press state for detail modal
  const longPressTimerRef = useRef(null);
  const longPressSupportRef = useRef(null);
  const LONG_PRESS_DURATION = 500; // 500ms hold to trigger

  const handleLongPressStart = useCallback((supportKey) => {
    longPressSupportRef.current = supportKey;
    longPressTimerRef.current = setTimeout(() => {
      setDetailSupport(longPressSupportRef.current);
    }, LONG_PRESS_DURATION);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressSupportRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Filter/sort state for modal
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('rarity');
  const supportTypes = ['All', 'HP', 'Attack', 'Defense', 'Instinct', 'Speed'];

  // Load decks from backend on mount
  useEffect(() => {
    const loadDecks = async () => {
      if (!token) {
        setDecksLoaded(true);
        return;
      }
      try {
        const response = await apiGetSupportDecks(token);
        const savedDecks = response?.decks;
        if (savedDecks && Array.isArray(savedDecks) && savedDecks.length > 0) {
          // Merge saved decks with empty deck structure
          const mergedDecks = Array(TOTAL_DECKS).fill(null).map((_, i) => {
            if (savedDecks[i] && Array.isArray(savedDecks[i])) {
              // Ensure we have exactly 5 slots
              const deckSupports = [...savedDecks[i]];
              while (deckSupports.length < SLOTS_PER_DECK) {
                deckSupports.push(null);
              }
              return deckSupports.slice(0, SLOTS_PER_DECK);
            }
            return Array(SLOTS_PER_DECK).fill(null);
          });
          setDecks(mergedDecks);
        }
      } catch (error) {
        console.error('Failed to load decks:', error);
      }
      setDecksLoaded(true);
    };
    loadDecks();
  }, [token]);

  // Sync selectedSupports with current deck
  useEffect(() => {
    if (decksLoaded) {
      const currentDeck = decks[currentDeckIndex].filter(s => s !== null);
      setSelectedSupports(currentDeck);
    }
  }, [currentDeckIndex, decks, decksLoaded, setSelectedSupports]);

  // Save deck to backend
  const saveDeck = async (deckIndex, deckSupports) => {
    if (!token) return;
    try {
      await apiSaveSupportDeck(deckIndex, deckSupports, token);
    } catch (error) {
      console.error('Failed to save deck:', error);
    }
  };

  // Get Support ID from full inventory
  const getSupportId = (supportKey) => {
    const support = supportInventoryFull.find(s => s.support_name === supportKey);
    return support?.id;
  };

  // Calculate inspiration bonuses from selected inspirations
  const calculateInspirationBonuses = () => {
    const aptitudeStars = {};
    let strategyStars = 0;

    selectedInspirations.forEach(insp => {
      if (!insp.inspirations) return;
      if (insp.inspirations.aptitude) {
        const color = insp.inspirations.aptitude.color;
        if (color) {
          aptitudeStars[color] = (aptitudeStars[color] || 0) + (insp.inspirations.aptitude.stars || 0);
        }
      }
      if (insp.inspirations.strategy) {
        strategyStars += insp.inspirations.strategy.stars || 0;
      }
    });

    const aptitudeUpgrades = {};
    Object.keys(aptitudeStars).forEach(color => {
      aptitudeUpgrades[color] = Math.floor(aptitudeStars[color] / 2);
    });

    const strategyUpgrades = Math.floor(strategyStars / 2);
    return { aptitudeUpgrades, strategyUpgrades };
  };

  // Apply grade upgrades to aptitudes
  const applyGradeUpgrades = (aptitudes, upgrades) => {
    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const upgraded = { ...aptitudes };

    Object.keys(upgrades).forEach(color => {
      const currentGrade = upgraded[color];
      if (!currentGrade) return;
      const currentIndex = gradeOrder.indexOf(currentGrade);
      const newIndex = Math.min(currentIndex + upgrades[color], gradeOrder.length - 1);
      upgraded[color] = gradeOrder[newIndex];
    });

    return upgraded;
  };

  // Apply strategy grade upgrade
  const applyStrategyAptitudesUpgrade = (strategyAptitudes, upgrades) => {
    if (!strategyAptitudes || upgrades === 0) return strategyAptitudes;

    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const upgraded = { ...strategyAptitudes };

    for (const [strategy, grade] of Object.entries(upgraded)) {
      const currentIndex = gradeOrder.indexOf(grade);
      if (currentIndex !== -1) {
        const newIndex = Math.min(currentIndex + upgrades, gradeOrder.length - 1);
        upgraded[strategy] = gradeOrder[newIndex];
      }
    }

    return upgraded;
  };

  // Derive best strategy from aptitudes
  const deriveStrategyFromAptitudes = (strategyAptitudes) => {
    const gradeRank = { 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
    let bestStrategy = 'Chipper';
    let bestGrade = 'C';
    let bestRank = 0;

    if (strategyAptitudes) {
      for (const [strategy, grade] of Object.entries(strategyAptitudes)) {
        const rank = gradeRank[grade] || 0;
        if (rank > bestRank) {
          bestStrategy = strategy;
          bestGrade = grade;
          bestRank = rank;
        }
      }
    }

    return { strategy: bestStrategy, strategyGrade: bestGrade };
  };

  // Filter and sort support inventory for modal
  const getFilteredSortedSupports = () => {
    const rarityOrder = { 'Legendary': 0, 'Rare': 1, 'Uncommon': 2, 'Common': 3 };
    const typeOrder = { 'HP': 0, 'Attack': 1, 'Defense': 2, 'Instinct': 3, 'Speed': 4 };

    const filtered = supportInventory.filter(supportKey => {
      if (typeFilter === 'All') return true;
      const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
      return support && support.supportType === typeFilter;
    });

    return [...filtered].sort((a, b) => {
      const supportA = getSupportCardAttributes(a, SUPPORT_CARDS);
      const supportB = getSupportCardAttributes(b, SUPPORT_CARDS);
      if (!supportA || !supportB) return 0;

      if (sortBy === 'rarity') {
        const rarityAValue = rarityOrder[supportA.rarity] ?? 999;
        const rarityBValue = rarityOrder[supportB.rarity] ?? 999;
        return rarityAValue - rarityBValue;
      } else if (sortBy === 'type') {
        const valueA = typeOrder[supportA.supportType] ?? 999;
        const valueB = typeOrder[supportB.supportType] ?? 999;
        return valueA - valueB;
      }
      return 0;
    });
  };

  const handleBeginCareer = async () => {
    const currentDeckSupports = decks[currentDeckIndex].filter(s => s !== null);
    if (!selectedPokemon || currentDeckSupports.length === 0) {
      alert('Please select at least one support card');
      return;
    }

    const pokemonData = POKEMON[selectedPokemon];
    if (!pokemonData) {
      alert('Invalid Pokemon selected');
      return;
    }

    const { aptitudeUpgrades, strategyUpgrades } = calculateInspirationBonuses();
    const upgradedAptitudes = applyGradeUpgrades(pokemonData.typeAptitudes || {}, aptitudeUpgrades);
    const upgradedStrategyAptitudes = applyStrategyAptitudesUpgrade(pokemonData.strategyAptitudes || {}, strategyUpgrades);
    const { strategy: defaultStrategy, strategyGrade: defaultStrategyGrade } = deriveStrategyFromAptitudes(upgradedStrategyAptitudes);

    const pokemon = {
      name: selectedPokemon,
      ...pokemonData,
      typeAptitudes: upgradedAptitudes,
      strategyAptitudes: upgradedStrategyAptitudes,
      strategy: defaultStrategy,
      strategyGrade: defaultStrategyGrade
    };

    const careerState = await startCareer(pokemon, currentDeckSupports, selectedInspirations);

    if (careerState) {
      setGameState('career');
    } else {
      alert('Failed to start career. Please try again.');
    }
  };

  // Handle slot click - open modal to select support
  const handleSlotClick = (slotIndex) => {
    setSelectingSlotIndex(slotIndex);
  };

  // Handle support selection from modal
  const handleSelectSupport = (supportKey) => {
    if (selectingSlotIndex === null) return;

    const newDecks = [...decks];
    const currentDeck = [...newDecks[currentDeckIndex]];

    // Remove support from other slots if already in deck
    const existingIndex = currentDeck.indexOf(supportKey);
    if (existingIndex !== -1 && existingIndex !== selectingSlotIndex) {
      currentDeck[existingIndex] = null;
    }

    currentDeck[selectingSlotIndex] = supportKey;
    newDecks[currentDeckIndex] = currentDeck;
    setDecks(newDecks);
    saveDeck(currentDeckIndex, currentDeck);
    setSelectingSlotIndex(null);
  };

  // Handle removing support from slot
  const handleRemoveFromSlot = (slotIndex) => {
    const newDecks = [...decks];
    const currentDeck = [...newDecks[currentDeckIndex]];
    currentDeck[slotIndex] = null;
    newDecks[currentDeckIndex] = currentDeck;
    setDecks(newDecks);
    saveDeck(currentDeckIndex, currentDeck);
  };

  // Handle deck navigation
  const handlePrevDeck = () => {
    setCurrentDeckIndex((prev) => (prev - 1 + TOTAL_DECKS) % TOTAL_DECKS);
  };

  const handleNextDeck = () => {
    setCurrentDeckIndex((prev) => (prev + 1) % TOTAL_DECKS);
  };

  // Handle reset deck
  const handleResetDeck = () => {
    const newDecks = [...decks];
    newDecks[currentDeckIndex] = Array(SLOTS_PER_DECK).fill(null);
    setDecks(newDecks);
    saveDeck(currentDeckIndex, Array(SLOTS_PER_DECK).fill(null));
  };

  // Get type color for focus
  const getFocusColor = (supportType) => {
    return TYPE_COLORS[
      supportType === 'Attack' ? 'Fire' :
      supportType === 'Defense' ? 'Water' :
      supportType === 'HP' ? 'Grass' :
      supportType === 'Instinct' ? 'Psychic' : 'Electric'
    ];
  };

  const currentDeck = decks[currentDeckIndex];
  const filledSlots = currentDeck.filter(s => s !== null).length;
  const detailSupportData = detailSupport ? getSupportCardAttributes(detailSupport, SUPPORT_CARDS) : null;

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
            onClick={() => {
              setSelectedSupports([]);
              setGameState('inspirationSelect');
            }}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-pocket-blue" />
            <span className="font-bold text-pocket-text">Select Supports</span>
          </div>
          <span className="text-pocket-text-light text-sm font-semibold">
            {filledSlots}/5
          </span>
        </div>
      </motion.header>

      <div className="max-w-lg mx-auto">
        {/* Deck Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevDeck}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-pocket-text text-lg">Deck {currentDeckIndex + 1}</span>
            </div>
            <button
              onClick={handleNextDeck}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Deck Dots */}
          <div className="flex justify-center gap-2 mb-4">
            {Array(TOTAL_DECKS).fill(null).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentDeckIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentDeckIndex
                    ? 'bg-pocket-blue scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Deck Slots - Uma Musume style grid */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {currentDeck.map((supportKey, slotIndex) => {
              const support = supportKey ? getSupportCardAttributes(supportKey, SUPPORT_CARDS) : null;
              const trainerImage = support ? getSupportImageFromCardName(support.name) : null;
              const limitBreakLevel = supportKey ? getSupportLimitBreak(supportKey) : 0;

              return (
                <motion.div
                  key={slotIndex}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSlotClick(slotIndex)}
                  className={`relative aspect-[3/4] rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                    support
                      ? 'border-transparent'
                      : 'border-dashed border-gray-300 bg-gray-50 hover:border-pocket-blue hover:bg-blue-50'
                  }`}
                  style={support ? { borderColor: getRarityColor(support.rarity) } : {}}
                >
                  {support ? (
                    <>
                      {/* Rarity indicator */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: getRarityColor(support.rarity) }}
                      />

                      {/* Support Image */}
                      {trainerImage && (
                        <img
                          src={trainerImage}
                          alt={support.trainer}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Stat type icon */}
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white/80 rounded-full flex items-center justify-center">
                        <StatIcon stat={support.supportType} size={10} />
                      </div>

                      {/* Limit Break indicator */}
                      {limitBreakLevel > 0 && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                          <LimitBreakDiamonds level={limitBreakLevel} size={6} />
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromSlot(slotIndex);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Plus size={24} className="text-gray-400" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Deck Actions */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleResetDeck}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-pocket-text-light hover:text-pocket-red hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </motion.div>

        {/* Begin Career Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleBeginCareer}
            disabled={careerLoading || filledSlots === 0}
            className="w-full pocket-btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {careerLoading ? 'Starting Career...' : 'Begin Career'}
          </button>
        </motion.div>
      </div>

      {/* Support Selection Modal */}
      <AnimatePresence mode="sync">
        {selectingSlotIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setSelectingSlotIndex(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-card-lg w-full sm:max-w-lg max-h-[85vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-pocket-text">Select Support</h3>
                <button
                  onClick={() => setSelectingSlotIndex(null)}
                  className="p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filters */}
              <div className="px-4 py-3 border-b border-gray-100">
                {/* Type Filter */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-pocket-text-light">Filter:</span>
                  {supportTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-2 py-1 rounded-lg font-bold text-[10px] transition ${
                        typeFilter === type
                          ? 'text-white'
                          : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                      }`}
                      style={typeFilter === type ? {
                        backgroundColor: type === 'All' ? '#6366f1' :
                          type === 'HP' ? TYPE_COLORS['Grass'] :
                          type === 'Attack' ? TYPE_COLORS['Fire'] :
                          type === 'Defense' ? TYPE_COLORS['Water'] :
                          type === 'Instinct' ? TYPE_COLORS['Psychic'] :
                          TYPE_COLORS['Electric']
                      } : {}}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-pocket-text-light">Sort:</span>
                  {['rarity', 'type'].map(sort => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`px-3 py-1 rounded-lg font-bold text-[10px] transition ${
                        sortBy === sort
                          ? 'bg-pocket-blue text-white'
                          : 'bg-pocket-bg text-pocket-text-light hover:bg-gray-200'
                      }`}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Support Grid */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {getFilteredSortedSupports().map((supportKey, idx) => {
                    const support = getSupportCardAttributes(supportKey, SUPPORT_CARDS);
                    if (!support) return null;

                    const trainerImage = getSupportImageFromCardName(support.name);
                    const limitBreakLevel = getSupportLimitBreak(supportKey);
                    const isInDeck = currentDeck.includes(supportKey);

                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelectSupport(supportKey)}
                        onMouseDown={() => handleLongPressStart(supportKey)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(supportKey)}
                        onTouchEnd={handleLongPressEnd}
                        className={`relative aspect-[3/4] rounded-xl border-2 cursor-pointer transition-all overflow-hidden select-none ${
                          isInDeck
                            ? 'ring-2 ring-pocket-green ring-offset-1'
                            : ''
                        }`}
                        style={{ borderColor: getRarityColor(support.rarity) }}
                        title="Tap to select • Hold for details"
                      >
                        {/* Rarity indicator */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: getRarityColor(support.rarity) }}
                        />

                        {/* Support Image */}
                        {trainerImage && (
                          <img
                            src={trainerImage}
                            alt={support.trainer}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        )}

                        {/* Overlay with info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-white text-[9px] font-bold truncate">{support.name}</p>
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[8px] font-bold"
                              style={{ color: getFocusColor(support.supportType) }}
                            >
                              {support.supportType}
                            </span>
                            <LimitBreakDiamonds level={limitBreakLevel} size={5} />
                          </div>
                        </div>

                        {/* In-deck indicator */}
                        {isInDeck && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-pocket-green rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}

                        {/* Stat type icon */}
                        <div className="absolute top-1 left-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center">
                          <StatIcon stat={support.supportType} size={12} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailSupport && detailSupportData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
            onClick={() => setDetailSupport(null)}
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
                onClick={() => setDetailSupport(null)}
                className="absolute top-3 right-3 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {/* Support Header */}
              <div className="text-center mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white inline-block mb-2"
                  style={{ backgroundColor: getRarityColor(detailSupportData.rarity) }}
                >
                  {detailSupportData.rarity}
                </span>
                {getSupportImageFromCardName(detailSupportData.name) && (
                  <img
                    src={getSupportImageFromCardName(detailSupportData.name)}
                    alt={detailSupportData.trainer}
                    className="w-24 h-24 object-contain rounded-xl border-2 bg-pocket-bg mx-auto mb-3"
                    style={{ borderColor: getRarityColor(detailSupportData.rarity) }}
                  />
                )}
                <h3 className="font-bold text-xl text-pocket-text">{detailSupportData.name}</h3>
                <div className="flex justify-center mt-2">
                  <LimitBreakDiamonds level={getSupportLimitBreak(detailSupport)} size={14} />
                </div>
                {detailSupportData.supportType && (
                  <p
                    className="text-sm font-bold mt-2"
                    style={{ color: getFocusColor(detailSupportData.supportType) }}
                  >
                    Focus: {detailSupportData.supportType}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-pocket-text-light italic mb-4 text-center">
                {detailSupportData.description}
              </p>

              {/* Base Stats */}
              {detailSupportData.baseStatIncrease && Object.values(detailSupportData.baseStatIncrease).some(v => v > 0) && (
                <div className="bg-pocket-bg rounded-lg p-3 mb-3">
                  <p className="font-bold text-type-psychic text-xs mb-2">Base Stat Bonuses</p>
                  <div className="space-y-1 text-xs">
                    {Object.entries(detailSupportData.baseStatIncrease).map(([stat, value]) => (
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
                    <span className="text-pocket-blue font-bold">{detailSupportData.initialFriendship}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Type Match</span>
                    <span className="text-pocket-green font-bold">+{detailSupportData.typeBonusTraining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Other Stats</span>
                    <span className="text-pocket-green font-bold">+{detailSupportData.generalBonusTraining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pocket-text-light">Max Friend</span>
                    <span className="text-pocket-green font-bold">+{detailSupportData.friendshipBonusTraining}</span>
                  </div>
                </div>
              </div>

              {/* Special Effects */}
              {detailSupportData.specialEffect && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                  <p className="font-bold text-purple-700 text-xs mb-2">Special Effects</p>
                  <div className="space-y-1 text-xs">
                    {detailSupportData.specialEffect.statGainMultiplier && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Stat Gain</span>
                        <span className="text-pocket-green font-bold">{detailSupportData.specialEffect.statGainMultiplier}x</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.failRateReduction && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Fail Rate</span>
                        <span className="text-pocket-green font-bold">-{(detailSupportData.specialEffect.failRateReduction * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.maxEnergyBonus && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Max Energy</span>
                        <span className="text-pocket-green font-bold">+{detailSupportData.specialEffect.maxEnergyBonus}</span>
                      </div>
                    )}
                    {detailSupportData.specialEffect.restBonus && (
                      <div className="flex justify-between">
                        <span className="text-pocket-text-light">Rest Bonus</span>
                        <span className="text-pocket-green font-bold">+{detailSupportData.specialEffect.restBonus}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Move Hints */}
              {detailSupportData.moveHints && detailSupportData.moveHints.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="font-bold text-blue-700 text-xs mb-2">Move Hints</p>
                  <div className="flex flex-wrap gap-1">
                    {detailSupportData.moveHints.map((move, moveIdx) => (
                      <span key={moveIdx} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {move}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Limit Break Section */}
              {(() => {
                const detailLimitBreak = getSupportLimitBreak(detailSupport);
                const detailSupportId = getSupportId(detailSupport);
                const detailCanLimitBreak = detailLimitBreak < MAX_LIMIT_BREAK && limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK;

                return detailLimitBreak < MAX_LIMIT_BREAK ? (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-pocket-text">Limit Break Cost:</span>
                      <div className="flex items-center gap-1">
                        <Diamond size={14} className="text-purple-500" />
                        <span className="font-bold text-purple-600">{SHARD_COST_PER_LIMIT_BREAK}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-pocket-text-light">Your Shards:</span>
                      <div className="flex items-center gap-1">
                        <Diamond size={14} className="text-purple-500" />
                        <span className={`font-bold ${limitBreakShards >= SHARD_COST_PER_LIMIT_BREAK ? 'text-pocket-green' : 'text-pocket-red'}`}>
                          {limitBreakShards}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!detailSupportId || !detailCanLimitBreak) return;
                        setIsLimitBreaking(true);
                        await limitBreakSupportWithShards(detailSupportId);
                        setIsLimitBreaking(false);
                      }}
                      disabled={!detailCanLimitBreak || isLimitBreaking}
                      className={`w-full py-2.5 rounded-xl font-bold transition-all ${
                        detailCanLimitBreak && !isLimitBreaking
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isLimitBreaking ? 'Limit Breaking...' : 'Limit Break'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 mb-3 text-center">
                    <p className="font-bold text-amber-600 text-sm">Maximum Limit Break Reached!</p>
                  </div>
                );
              })()}

              {/* Close button */}
              <button
                onClick={() => setDetailSupport(null)}
                className="w-full py-2 rounded-xl bg-pocket-bg text-pocket-text-light font-semibold hover:bg-gray-200 transition-colors"
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

export default SupportSelectionScreen;
