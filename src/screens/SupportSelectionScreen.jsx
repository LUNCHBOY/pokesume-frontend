/**
 * SupportSelectionScreen Component
 *
 * Uma Musume style support selection with deck slots.
 * - 5 slots with + signs for empty slots
 * - Modal for selecting supports when clicking a slot (MULTI-SELECT)
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
  StatIcon,
  getAptitudeColor
} from '../utils/gameUtils';
import { TypeIcon, TYPE_COLORS } from '../components/TypeIcon';
import { SUPPORT_CARDS, POKEMON, MOVES } from '../shared/gameData';
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

  // Modal state - Changed to boolean instead of slot index
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
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
    const strategyStars = {}; // Changed to object to track per-strategy
    const statBonuses = {}; // NEW: Track stat bonuses

    selectedInspirations.forEach(insp => {
      if (!insp.inspirations) return;

      // Type aptitude stars
      if (insp.inspirations.aptitude) {
        const color = insp.inspirations.aptitude.color;
        if (color) {
          aptitudeStars[color] = (aptitudeStars[color] || 0) + (insp.inspirations.aptitude.stars || 0);
        }
      }

      // Strategy stars - track per strategy name
      if (insp.inspirations.strategy) {
        const strategyName = insp.inspirations.strategy.name;
        if (strategyName) {
          strategyStars[strategyName] = (strategyStars[strategyName] || 0) + (insp.inspirations.strategy.stars || 0);
        }
      }

      // NEW: Stat bonuses (same calculation as in-career: 1★=+10, 2★=+25, 3★=+50)
      if (insp.inspirations.stat) {
        const statName = insp.inspirations.stat.name;
        const stars = insp.inspirations.stat.stars;
        if (statName && stars) {
          const bonus = stars === 1 ? 10 : stars === 2 ? 25 : 50;
          statBonuses[statName] = (statBonuses[statName] || 0) + bonus;
        }
      }
    });

    // Calculate aptitude upgrades: every 2 stars = 1 grade upgrade (max A grade)
    const aptitudeUpgrades = {};
    Object.keys(aptitudeStars).forEach(color => {
      aptitudeUpgrades[color] = Math.floor(aptitudeStars[color] / 2);
    });

    // Calculate strategy upgrades: every 2 stars = 1 grade upgrade per strategy (max A grade)
    const strategyUpgrades = {};
    Object.keys(strategyStars).forEach(strategyName => {
      strategyUpgrades[strategyName] = Math.floor(strategyStars[strategyName] / 2);
    });

    return { aptitudeUpgrades, strategyUpgrades, statBonuses };
  };

  // Apply grade upgrades to aptitudes (capped at A grade for pre-career bonuses)
  const applyGradeUpgrades = (aptitudes, upgrades) => {
    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const maxGradeIndex = gradeOrder.indexOf('A'); // Cap at A grade
    const upgraded = { ...aptitudes };

    Object.keys(upgrades).forEach(color => {
      const currentGrade = upgraded[color];
      if (!currentGrade) return;
      const currentIndex = gradeOrder.indexOf(currentGrade);
      const targetIndex = currentIndex + upgrades[color];
      const newIndex = Math.min(targetIndex, maxGradeIndex);
      upgraded[color] = gradeOrder[newIndex];
    });

    return upgraded;
  };

  // Apply strategy grade upgrades (only to specific strategies, capped at A grade)
  const applyStrategyAptitudesUpgrade = (strategyAptitudes, upgrades) => {
    if (!strategyAptitudes || !upgrades || Object.keys(upgrades).length === 0) return strategyAptitudes;

    const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const maxGradeIndex = gradeOrder.indexOf('A'); // Cap at A grade
    const upgraded = { ...strategyAptitudes };

    // Only upgrade the specific strategies that have upgrade values
    for (const [strategyName, upgradeAmount] of Object.entries(upgrades)) {
      if (upgraded[strategyName]) {
        const currentGrade = upgraded[strategyName];
        const currentIndex = gradeOrder.indexOf(currentGrade);
        if (currentIndex !== -1) {
          const targetIndex = currentIndex + upgradeAmount;
          const newIndex = Math.min(targetIndex, maxGradeIndex);
          upgraded[strategyName] = gradeOrder[newIndex];
        }
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

    const { aptitudeUpgrades, strategyUpgrades, statBonuses } = calculateInspirationBonuses();
    const upgradedAptitudes = applyGradeUpgrades(pokemonData.typeAptitudes || {}, aptitudeUpgrades);
    const upgradedStrategyAptitudes = applyStrategyAptitudesUpgrade(pokemonData.strategyAptitudes || {}, strategyUpgrades);
    const { strategy: defaultStrategy, strategyGrade: defaultStrategyGrade } = deriveStrategyFromAptitudes(upgradedStrategyAptitudes);

    // Apply initial stat bonuses from inspirations
    const baseStats = pokemonData.baseStats || { HP: 150, Attack: 50, Defense: 50, Instinct: 50, Speed: 50 };
    const upgradedBaseStats = { ...baseStats };
    Object.keys(statBonuses).forEach(statName => {
      if (upgradedBaseStats[statName] !== undefined) {
        upgradedBaseStats[statName] += statBonuses[statName];
      }
    });

    const pokemon = {
      name: selectedPokemon,
      ...pokemonData,
      baseStats: upgradedBaseStats,
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

  // Handle slot click - open modal to select supports
  const handleSlotClick = (slotIndex) => {
    setIsSelectModalOpen(true);
  };

  // Handle support selection from modal - MULTI-SELECT VERSION
  const handleSelectSupport = (supportKey) => {
    const newDecks = [...decks];
    const currentDeck = [...newDecks[currentDeckIndex]];

    // Check if support is already in deck
    const existingIndex = currentDeck.indexOf(supportKey);
    
    if (existingIndex !== -1) {
      // If clicking a card that's already in the deck, remove it
      currentDeck[existingIndex] = null;
    } else {
      // Find first empty slot and add the support
      const firstEmptySlot = currentDeck.findIndex(slot => slot === null);
      if (firstEmptySlot !== -1) {
        currentDeck[firstEmptySlot] = supportKey;
      } else {
        // If no empty slots, replace the last slot
        currentDeck[SLOTS_PER_DECK - 1] = supportKey;
      }
    }

    newDecks[currentDeckIndex] = currentDeck;
    setDecks(newDecks);
    saveDeck(currentDeckIndex, currentDeck);
    // Don't close modal - let user keep selecting
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
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-4xl mx-auto"
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

      <div className="max-w-4xl mx-auto">
        {/* Pokemon Info Card - Career Screen Style */}
        {selectedPokemon && (() => {
          const pokemonData = POKEMON[selectedPokemon];
          if (!pokemonData) return null;

          const { aptitudeUpgrades, strategyUpgrades, statBonuses } = calculateInspirationBonuses();

          // Calculate support deck stat bonuses
          const supportStatBonuses = {};
          const currentDeckSupports = decks[currentDeckIndex].filter(s => s !== null);
          currentDeckSupports.forEach(supportKey => {
            const support = SUPPORT_CARDS[supportKey];
            if (support && support.baseStats) {
              Object.entries(support.baseStats).forEach(([stat, value]) => {
                supportStatBonuses[stat] = (supportStatBonuses[stat] || 0) + value;
              });
            }
          });

          // Calculate total stat bonuses (inspiration + support)
          const totalStatBonuses = { ...statBonuses };
          Object.keys(supportStatBonuses).forEach(stat => {
            totalStatBonuses[stat] = (totalStatBonuses[stat] || 0) + supportStatBonuses[stat];
          });

          // Calculate modified stats
          const baseStats = pokemonData.baseStats || { HP: 150, Attack: 50, Defense: 50, Instinct: 50, Speed: 50 };
          const modifiedStats = { ...baseStats };
          Object.keys(totalStatBonuses).forEach(stat => {
            if (modifiedStats[stat] !== undefined) {
              modifiedStats[stat] += totalStatBonuses[stat];
            }
          });

          // Calculate modified aptitudes (capped at A)
          const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
          const maxIndex = gradeOrder.indexOf('A');
          const typeAptitudes = { ...pokemonData.typeAptitudes };
          Object.keys(aptitudeUpgrades).forEach(color => {
            const currentGrade = typeAptitudes[color];
            const currentIndex = gradeOrder.indexOf(currentGrade);
            const newIndex = Math.min(currentIndex + aptitudeUpgrades[color], maxIndex);
            typeAptitudes[color] = gradeOrder[newIndex];
          });

          // Calculate modified strategy aptitudes (capped at A)
          const strategyAptitudes = { ...pokemonData.strategyAptitudes };
          Object.keys(strategyUpgrades).forEach(strategyName => {
            if (strategyAptitudes[strategyName]) {
              const currentGrade = strategyAptitudes[strategyName];
              const currentIndex = gradeOrder.indexOf(currentGrade);
              const newIndex = Math.min(currentIndex + strategyUpgrades[strategyName], maxIndex);
              strategyAptitudes[strategyName] = gradeOrder[newIndex];
            }
          });

          // Pokemon sprite component
          const PokemonSprite = ({ pokemonName }) => {
            const [spriteUrl, setSpriteUrl] = React.useState(null);
            React.useEffect(() => {
              fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
                .then(res => res.json())
                .then(data => {
                  const bwAnimated = data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default;
                  setSpriteUrl(bwAnimated || data.sprites.front_default);
                })
                .catch(() => setSpriteUrl(null));
            }, [pokemonName]);
            return spriteUrl ? <img src={spriteUrl} alt={pokemonName} className="w-20 h-20" /> : <div className="w-20 h-20" />;
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-card p-4 mb-4"
            >
              <div className="flex items-center gap-4">
                {/* Pokemon Sprite */}
                <div className="w-20 h-20">
                  <PokemonSprite pokemonName={selectedPokemon} />
                </div>

                {/* Pokemon Name and Type */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-pocket-text mb-2">{selectedPokemon}</h2>

                  {/* Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const pokemonData = POKEMON[selectedPokemon];
                      const primaryType = pokemonData?.primaryType;
                      const typeColorMap = {
                        Red: 'Fire',
                        Blue: 'Water',
                        Green: 'Grass',
                        Purple: 'Psychic',
                        Yellow: 'Electric',
                        Orange: 'Fighting'
                      };
                      const typeName = typeColorMap[primaryType] || primaryType;
                      const typeGrade = typeAptitudes?.[primaryType] || 'F';

                      return (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-pocket-text text-sm font-bold rounded">
                          <TypeIcon type={typeName} size={16} />
                          <span style={{ color: getAptitudeColor(typeGrade) }}>{typeGrade}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mb-3">
                    {['HP', 'Attack', 'Defense', 'Instinct', 'Speed'].map((stat) => {
                      const hasBonus = totalStatBonuses[stat];
                      const value = modifiedStats[stat];
                      return (
                        <div key={stat} className="flex items-center gap-1">
                          <StatIcon stat={stat} size={14} />
                          <span className={`font-bold text-sm ${hasBonus ? 'text-orange-500' : 'text-pocket-text'}`}>
                            {value}
                          </span>
                          {hasBonus && <span className="text-xs text-orange-500">(+{totalStatBonuses[stat]})</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Type Aptitudes */}
                  <div className="flex flex-wrap gap-2 mb-2 text-xs">
                    {Object.entries(typeAptitudes).map(([color, grade]) => {
                      const hasUpgrade = aptitudeUpgrades[color];
                      const typeMap = {
                        Red: 'Fire',
                        Blue: 'Water',
                        Green: 'Grass',
                        Purple: 'Psychic',
                        Yellow: 'Electric',
                        Orange: 'Fighting'
                      };
                      const type = typeMap[color];

                      return (
                        <span key={color} className={`inline-flex items-center gap-0.5 ${hasUpgrade ? 'text-orange-500' : ''}`}>
                          <TypeIcon type={type} size={14} />
                          <span style={{ color: hasUpgrade ? '#f97316' : getAptitudeColor(grade), fontWeight: 'bold' }}>{grade}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Strategy Aptitudes */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(strategyAptitudes).map(([strategy, grade]) => {
                      const hasUpgrade = strategyUpgrades[strategy];
                      return (
                        <span key={strategy} className={`${hasUpgrade ? 'text-orange-500' : 'text-gray-600'}`}>
                          {strategy} <span style={{ color: hasUpgrade ? '#f97316' : getAptitudeColor(grade), fontWeight: 'bold' }}>{grade}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

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

      {/* Support Selection Modal - MULTI-SELECT VERSION */}
      <AnimatePresence mode="sync">
        {isSelectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setIsSelectModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl shadow-card-lg w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header with Done button */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-pocket-text">
                  Select Supports ({filledSlots}/5)
                </h3>
                <button
                  onClick={() => setIsSelectModalOpen(false)}
                  className="px-4 py-1.5 bg-pocket-blue text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors"
                >
                  Done
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
              <div className="p-4 overflow-y-auto flex-1">
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
                        title="Tap to add/remove • Hold for details"
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="font-bold text-gray-700 text-xs mb-2">Move Hints</p>
                  <div className="flex flex-wrap gap-1">
                    {detailSupportData.moveHints.map((move, moveIdx) => {
                      const moveData = MOVES[move];
                      const moveType = moveData?.type || 'Normal';
                      const typeColor = TYPE_COLORS[moveType] || '#A8A878';
                      return (
                        <span
                          key={moveIdx}
                          className="px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: typeColor }}
                        >
                          {move}
                        </span>
                      );
                    })}
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
