/**
 * CareerScreen Component
 *
 * THE CORE GAMEPLAY LOOP - Where players train their Pokemon over 63 turns
 *
 * Features:
 * - Training system (5 stats with energy costs and fail chances)
 * - Energy/Rest system
 * - Random events (50 types) and Hangout events (30 types)
 * - Evolution system with modal
 * - Inspiration triggers at turns 11, 23, 35, 47, 59
 * - Gym battles at turns 12, 24, 36, 48 (4 gyms)
 * - Elite Four gauntlet at turns 60, 61, 62, 63
 * - Ability learning system
 * - Multiple view modes (Training, Battle, Log, Abilities, Learn, Gym)
 * - 4 modal components (Evolution, Inspiration, Pokeclock, Help)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Book, Trophy, Clock, Star, HelpCircle, Home, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useCareer } from '../contexts/CareerContext';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade,
  getAptitudeColor,
  StatIcon
} from '../utils/gameUtils';
import {
  ICONS,
  GAME_CONFIG,
  MOVES,
  POKEMON,
  SUPPORT_CARDS,
  EVOLUTION_CHAINS,
  EVOLUTION_CONFIG,
  ELITE_FOUR,
  normalizeSupportName
} from '../shared/gameData';
import { getSupportImageWithConfig, getGymLeaderImage } from '../constants/trainerImages';
import { TypeIcon, TypeBadge, TYPE_COLORS } from '../components/TypeIcon';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Elite Four base multipliers - ENEMY_STAT_MULTIPLIER (0.8) is applied separately
// Cascades from quadratic curve endpoint, capping at 3.75x effective for Lance
const ELITE_FOUR_BASE_MULTIPLIERS = {
  0: 4.06,  // Lorelei (turn 60) - 3.25x effective
  1: 4.25,  // Bruno (turn 61) - 3.40x effective
  2: 4.44,  // Agatha (turn 62) - 3.55x effective
  3: 4.69   // Lance (turn 63) - 3.75x effective (Champion cap)
};

/**
 * Calculate difficulty multiplier based on turn
 * Matches backend: 1.0x until turn 12, then quadratic curve to 3.25x effective at turn 60
 * Elite Four uses fixed multipliers from 3.25x to 3.75x (Lance cap)
 * ENEMY_STAT_MULTIPLIER (0.8) is applied
 */
const calculateDifficultyMultiplier = (turn) => {
  const enemyStatMult = GAME_CONFIG.CAREER.ENEMY_STAT_MULTIPLIER || 1.0;
  const eliteFourStartTurn = GAME_CONFIG.CAREER.ELITE_FOUR_START_TURN || 60;

  // Elite Four uses fixed multipliers
  if (turn >= eliteFourStartTurn) {
    const eliteFourIndex = turn - eliteFourStartTurn;
    if (eliteFourIndex >= 0 && eliteFourIndex < 4) {
      const baseMult = ELITE_FOUR_BASE_MULTIPLIERS[eliteFourIndex] || 4.25;
      return baseMult * enemyStatMult;
    }
  }

  // No scaling before turn 12
  if (turn < 12) {
    return 1.0 * enemyStatMult;
  }

  // Quadratic scaling from turn 12 to 59
  const progress = (turn - 12) / 48;
  const baseMultiplier = 1.0 + (1.56 * progress * progress) + (1.5 * progress);
  return baseMultiplier * enemyStatMult;
};

// Alias for backwards compatibility
const calculateGymLeaderMultiplier = calculateDifficultyMultiplier;

/**
 * Scale stats based on turn for display purposes
 */
const getScaledStats = (baseStats, turn) => {
  const multiplier = calculateDifficultyMultiplier(turn);
  return {
    HP: Math.floor(baseStats.HP * multiplier),
    Attack: Math.floor(baseStats.Attack * multiplier),
    Defense: Math.floor(baseStats.Defense * multiplier),
    Instinct: Math.floor(baseStats.Instinct * multiplier),
    Speed: Math.floor(baseStats.Speed * multiplier)
  };
};

/**
 * Generate a brief description for a move based on its properties
 */
const getMoveDescription = (move) => {
  const parts = [];

  // Describe warmup/cooldown characteristics
  if (move.warmup === 0) {
    parts.push('Quick strike');
  } else if (move.warmup >= 6) {
    parts.push('Slow but powerful');
  } else if (move.warmup >= 4) {
    parts.push('Heavy attack');
  }

  // Describe effect
  if (move.effect) {
    const effect = move.effect;
    switch (effect.type) {
      // Status effects
      case 'burn':
        parts.push(`burns for ${effect.damage || 3} dmg/tick`);
        break;
      case 'poison':
        parts.push('poisons target');
        break;
      case 'badly_poison':
        parts.push('badly poisons target');
        break;
      case 'paralyze':
        parts.push('may paralyze');
        break;
      case 'stun':
        parts.push('can stun');
        break;
      case 'confuse':
        parts.push('confuses target');
        break;
      case 'freeze':
        parts.push('may freeze');
        break;
      case 'sleep':
        parts.push('induces sleep');
        break;
      case 'soak':
        parts.push('soaks target');
        break;
      case 'infatuate':
        parts.push('may infatuate');
        break;
      case 'curse':
        parts.push('curses target');
        break;

      // Healing/drain effects
      case 'energize':
        parts.push('restores stamina');
        break;
      case 'drain':
        parts.push('drains HP');
        break;
      case 'drain_sleep':
        parts.push('drains sleeping foe');
        break;
      case 'heal_self':
        parts.push('restores HP');
        break;
      case 'regen':
        parts.push('heals over time');
        break;

      // Self-penalty effects
      case 'recoil':
        parts.push('causes recoil');
        break;
      case 'exhaust':
        parts.push('exhausts user');
        break;
      case 'self_ko':
        parts.push('user faints');
        break;
      case 'confuse_self_after':
        parts.push('confuses user after');
        break;

      // Buff effects (self)
      case 'buff_all':
        parts.push('boosts all stats');
        break;
      case 'buff_attack':
        parts.push('boosts Attack');
        break;
      case 'buff_defense':
        parts.push('boosts Defense');
        break;
      case 'buff_speed':
        parts.push('boosts Speed');
        break;
      case 'buff_instinct':
        parts.push('boosts Instinct');
        break;
      case 'buff_crit':
        parts.push('boosts critical rate');
        break;
      case 'buff_attack_defense':
        parts.push('boosts Attack & Defense');
        break;
      case 'buff_attack_speed':
        parts.push('boosts Attack & Speed');
        break;
      case 'evasion':
        parts.push('grants evasion');
        break;

      // Debuff effects (opponent)
      case 'debuff_attack':
        parts.push('lowers foe Attack');
        break;
      case 'debuff_defense':
        parts.push('lowers foe Defense');
        break;
      case 'debuff_speed':
        parts.push('lowers foe Speed');
        break;
      case 'debuff_instinct':
        parts.push('lowers foe Instinct');
        break;
      case 'debuff_accuracy':
        parts.push('lowers foe accuracy');
        break;

      // Self-debuff effects
      case 'debuff_instinct_self':
        parts.push('lowers user Instinct');
        break;
      case 'debuff_speed_self':
        parts.push('lowers user Speed');
        break;
      case 'debuff_attack_self':
        parts.push('lowers user Attack');
        break;

      // Special damage mechanics
      case 'high_crit':
        parts.push('high critical rate');
        break;
      case 'double_if_status':
        parts.push('double vs status');
        break;
      case 'double_if_status_self':
        parts.push('double if user has status');
        break;
      case 'double_if_half_hp':
        parts.push('double if foe <50% HP');
        break;
      case 'hp_based_damage':
        parts.push('power scales with HP');
        break;
      case 'buff_boost_damage':
        parts.push('power scales with buffs');
        break;
      case 'use_opponent_attack':
        parts.push('uses foe Attack stat');
        break;
      case 'ohko':
        parts.push('one-hit KO chance');
        break;
      case 'consecutive_boost':
        parts.push('grows stronger on hit');
        break;
      case 'delayed_damage':
        parts.push('delayed strike');
        break;

      // Field effects
      case 'push_back':
        parts.push('pushes foe back');
        break;
      case 'entry_hazard':
        parts.push('sets entry hazard');
        break;
      case 'entry_hazard_rock':
        parts.push('sets stealth rocks');
        break;
      case 'remove_hazards':
        parts.push('clears hazards');
        break;

      // Weather effects
      case 'weather_sand':
        parts.push('summons sandstorm');
        break;
      case 'weather_rain':
        parts.push('summons rain');
        break;
      case 'weather_sun':
        parts.push('intensifies sunlight');
        break;
      case 'weather_hail':
        parts.push('summons hail');
        break;

      // Terrain effects
      case 'terrain_psychic':
        parts.push('sets psychic terrain');
        break;
      case 'terrain_electric':
        parts.push('sets electric terrain');
        break;
      case 'terrain_grassy':
        parts.push('sets grassy terrain');
        break;

      // Unique/special effects
      case 'destiny_bond':
        parts.push('foe faints if user does');
        break;
      case 'random_move':
        parts.push('uses random move');
        break;
      case 'random_damage_or_heal':
        parts.push('random damage or heal');
        break;
      case 'copy_opponent':
        parts.push('copies opponent');
        break;
      case 'switch_out':
        parts.push('user switches out');
        break;

      default:
        break;
    }
  }

  // If no special characteristics, describe based on damage
  if (parts.length === 0) {
    if (move.damage === 0) {
      return 'Status move';
    } else if (move.damage >= 35) {
      return 'High-power attack';
    } else if (move.damage >= 25) {
      return 'Solid damage dealer';
    } else if (move.damage >= 15) {
      return 'Balanced attack';
    } else {
      return 'Light attack';
    }
  }

  return parts.join(', ');
};

/**
 * Check if current turn triggers inspiration and apply bonuses
 */
const checkAndApplyInspiration = (turn, selectedInspirations, currentStats, currentAptitudes, currentStrategyAptitudes = null) => {
  const inspirationTurns = [11, 23, 35, 47, 59];

  console.log('[checkAndApplyInspiration] Turn:', turn, 'Selected:', selectedInspirations?.length);

  if (!inspirationTurns.includes(turn) || !selectedInspirations || selectedInspirations.length === 0) {
    console.log('[checkAndApplyInspiration] Skipping - not inspiration turn or no selections');
    return null;
  }

  console.log('[checkAndApplyInspiration] Processing inspirations for turn', turn);

  // Color to type name mapping
  const colorToType = {
    'Red': 'Fire',
    'Blue': 'Water',
    'Green': 'Grass',
    'Purple': 'Psychic',
    'Yellow': 'Electric',
    'Orange': 'Fighting'
  };

  const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

  // Create copies to mutate
  const updatedStats = { ...currentStats };
  const updatedAptitudes = { ...currentAptitudes };
  const updatedStrategyAptitudes = { ...(currentStrategyAptitudes || {}) };

  const inspirationResults = selectedInspirations
    .filter(insp => insp && insp.inspirations)
    .map(trainedPokemon => {
      const statInsp = trainedPokemon.inspirations.stat;
      const aptInsp = trainedPokemon.inspirations.aptitude;
      const strategyInsp = trainedPokemon.inspirations.strategy;

      const result = {
        pokemonName: trainedPokemon.name,
        statBonus: null,
        aptitudeUpgrade: null,
        strategyUpgrade: null
      };

      // Apply stat bonus
      if (statInsp && statInsp.name && statInsp.stars) {
        const statBonus = statInsp.stars === 1 ? 10 : statInsp.stars === 2 ? 25 : 50;
        updatedStats[statInsp.name] = (updatedStats[statInsp.name] || 0) + statBonus;
        result.statBonus = {
          stat: statInsp.name,
          amount: statBonus,
          stars: statInsp.stars
        };
      }

      // Check for type aptitude upgrade
      if (aptInsp && aptInsp.color && aptInsp.stars) {
        const upgradeChance = aptInsp.stars === 1 ? 0.03 : aptInsp.stars === 2 ? 0.10 : 0.20;
        if (Math.random() < upgradeChance) {
          const currentGrade = updatedAptitudes[aptInsp.color];
          const currentIndex = aptitudeOrder.indexOf(currentGrade);
          if (currentIndex < aptitudeOrder.length - 1) { // Not already S
            const newGrade = aptitudeOrder[currentIndex + 1];
            updatedAptitudes[aptInsp.color] = newGrade;
            result.aptitudeUpgrade = {
              type: colorToType[aptInsp.color] || aptInsp.color,
              color: aptInsp.color,
              from: currentGrade,
              to: newGrade,
              stars: aptInsp.stars,
              chance: upgradeChance
            };
          }
        }
      }

      // Check for strategy aptitude upgrade (same % chance as type aptitudes)
      // Now uses strategy name to upgrade specific strategy aptitude
      if (strategyInsp && strategyInsp.name && strategyInsp.stars) {
        const upgradeChance = strategyInsp.stars === 1 ? 0.03 : strategyInsp.stars === 2 ? 0.10 : 0.20;
        if (Math.random() < upgradeChance) {
          const strategyName = strategyInsp.name;
          const currentGrade = updatedStrategyAptitudes[strategyName] || 'C';
          const currentIndex = aptitudeOrder.indexOf(currentGrade);
          if (currentIndex < aptitudeOrder.length - 1) { // Not already S
            const newGrade = aptitudeOrder[currentIndex + 1];
            updatedStrategyAptitudes[strategyName] = newGrade;
            result.strategyUpgrade = {
              strategy: strategyName,
              from: currentGrade,
              to: newGrade,
              stars: strategyInsp.stars,
              chance: upgradeChance
            };
          }
        }
      }

      return result;
    });

  const finalResult = {
    turn,
    results: inspirationResults,
    updatedStats,
    updatedAptitudes,
    updatedStrategyAptitudes
  };

  console.log('[checkAndApplyInspiration] Result:', finalResult);
  return finalResult;
};

/**
 * Get support card attributes using the card's actual trainingBonus values
 * Must match backend career.js getSupportCardAttributes
 */
const getSupportCardAttributes = (supportKey) => {
  // Normalize legacy support names to new format
  const normalizedKey = normalizeSupportName(supportKey);
  const card = SUPPORT_CARDS[normalizedKey];
  if (!card) return null;

  // Extract training bonuses from card's trainingBonus object
  const trainingBonus = card.trainingBonus || {};

  return {
    ...card,
    // Map card's trainingBonus to the expected property names
    typeBonusTraining: trainingBonus.typeMatch || 5,
    generalBonusTraining: trainingBonus.otherStats || 1,
    friendshipBonusTraining: trainingBonus.maxFriendshipTypeMatch || 10,
    // Use card's actual appearance settings
    appearanceChance: card.appearanceRate || 0.40,
    typeAppearancePriority: 1 + (card.typeMatchPreference || 0.10) * 10,
    supportType: card.type || card.supportType
  };
};

const CareerScreen = () => {
  const {
    setGameState,
    resetGameState,
    selectedInspirations,
    battleState,
    setBattleState
  } = useGame();

  const {
    careerData,
    setCareerData,
    updateCareer,
    processBattle,
    trainStat,
    restOnServer,
    generateTraining,
    triggerEvent,
    resolveEvent: resolveEventOnServer,
    clearEventResult,
    learnAbility: learnAbilityOnServer,
    forgetAbility: forgetAbilityOnServer,
    changeStrategy,
    abandonCareer
  } = useCareer();

  const [viewMode, setViewMode] = useState('training');
  const [showHelp, setShowHelp] = useState(false);
  const [evolutionModal, setEvolutionModal] = useState(null);
  const [inspirationModal, setInspirationModal] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [pokeclockModal, setPokeclockModal] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [forgetMoveConfirm, setForgetMoveConfirm] = useState(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const lastProcessedTurnRef = useRef(null);
  const declinedEventRef = useRef(false);

  // ============================================================================
  // HELPER FUNCTIONS (Component-specific)
  // ============================================================================

  /**
   * Request server to generate new training options (SERVER-AUTHORITATIVE)
   */
  const requestNewTrainingOptions = async () => {
    await generateTraining();
    // Career state will be updated through CareerContext
  };

  /**
   * Check if Pokemon can evolve based on grade
   */
  const checkForEvolution = (pokemonName, currentStats, serverCareerState) => {
    // Use basePokemonName from server state to look up the evolution chain
    const baseName = serverCareerState?.basePokemonName || pokemonName;
    const evolutionChain = EVOLUTION_CHAINS[baseName];
    if (!evolutionChain) return null;

    const currentGrade = getPokemonGrade(currentStats);
    // Use evolution stage from server state (not React state which may be stale)
    const currentStage = serverCareerState?.evolutionStage || 0;

    // Check for stage 1 evolution (at C grade or higher)
    if (currentStage === 0 && evolutionChain.stage1 && ['C', 'C+', 'B', 'B+', 'A', 'A+', 'S', 'S+', 'UU', 'UU+'].includes(currentGrade)) {
      return { toName: evolutionChain.stage1, toStage: 1 };
    }

    // Check for stage 2 evolution (at A grade or higher)
    if (currentStage === 1 && evolutionChain.stage2 && ['A', 'A+', 'S', 'S+', 'UU', 'UU+'].includes(currentGrade)) {
      return { toName: evolutionChain.stage2, toStage: 2 };
    }

    return null;
  };

  /**
   * Apply evolution to Pokemon (persists to server)
   */
  const applyEvolution = async (fromName, toName, toStage) => {
    console.log('=== applyEvolution START ===');
    console.log('fromName:', fromName, 'toName:', toName, 'toStage:', toStage);

    // Get evolution data - if it doesn't exist, keep current Pokemon data but update name
    const evolutionData = POKEMON[toName];
    console.log('evolutionData exists?:', !!evolutionData);

    // Build the evolved career state
    const baseName = careerData.basePokemonName || careerData.pokemon.name;
    const evolutionChain = EVOLUTION_CHAINS[baseName];
    const statBoost = evolutionChain && evolutionChain.stages === 2
      ? EVOLUTION_CONFIG.STAT_BOOST.TWO_STAGE  // 5% for two-stage evolutions
      : EVOLUTION_CONFIG.STAT_BOOST.ONE_STAGE; // 10% for one-stage evolutions

    console.log('Base Pokemon:', baseName);
    console.log('Evolution chain stages:', evolutionChain?.stages);
    console.log('Applying stat boost:', (statBoost * 100) + '%');
    console.log('Current stats BEFORE evolution:', careerData.currentStats);

    // Calculate new stats
    const newStats = {};
    for (const [stat, value] of Object.entries(careerData.currentStats)) {
      newStats[stat] = Math.round(value * (1 + statBoost));
    }
    console.log('New stats AFTER boost:', newStats);

    let evolvedCareerState;

    if (!evolutionData) {
      console.log('No evolution data found - using base Pokemon data with updated name');
      // Keep current Pokemon data but update the name
      const updatedPokemon = {
        ...careerData.pokemon,
        name: toName
      };

      evolvedCareerState = {
        ...careerData,
        pokemon: updatedPokemon,
        currentStats: newStats,
        evolutionStage: toStage,
        basePokemonName: careerData.basePokemonName,
        turnLog: [{
          turn: careerData.turn,
          type: 'evolution',
          message: `${fromName} evolved into ${toName}!`
        }, ...(careerData.turnLog || [])]
      };
    } else {
      // Add signature move for final evolution
      let signatureMove = null;
      const chain = EVOLUTION_CHAINS[baseName];
      if (chain) {
        if ((chain.stages === 1 && toStage === 1) || (chain.stages === 2 && toStage === 2)) {
          // Add signature move based on type
          const moveMap = {
            Fire: 'FireBlast',
            Water: 'HydroPump',
            Grass: 'SolarBeam',
            Poison: 'PsychicBlast',
            Electric: 'Thunder'
          };
          signatureMove = moveMap[evolutionData.primaryType];
        }
      }

      const newLearnableAbilities = [...careerData.pokemon.learnableAbilities];
      if (signatureMove && !newLearnableAbilities.includes(signatureMove) && !careerData.knownAbilities.includes(signatureMove)) {
        newLearnableAbilities.push(signatureMove);
      }

      evolvedCareerState = {
        ...careerData,
        pokemon: {
          ...evolutionData,
          learnableAbilities: newLearnableAbilities
        },
        currentStats: newStats,
        evolutionStage: toStage,
        basePokemonName: careerData.basePokemonName, // Preserve the original base name
        turnLog: [{
          turn: careerData.turn,
          type: 'evolution',
          message: `${fromName} evolved into ${toName}!${signatureMove ? ` Learned signature move: ${signatureMove}!` : ''}`
        }, ...(careerData.turnLog || [])]
      };
    }

    console.log('Evolved careerData:', evolvedCareerState);

    // Persist evolution to server
    const success = await updateCareer(evolvedCareerState);
    if (!success) {
      console.error('Failed to persist evolution to server');
    }

    setEvolutionModal(null);
    console.log('=== applyEvolution END ===');
  };

  /**
   * Perform training action (SERVER-AUTHORITATIVE)
   */
  const performTraining = async (stat) => {
    // Prevent double-clicks
    if (isProcessingAction) return;
    setIsProcessingAction(true);

    try {
      // Call server-authoritative training endpoint
      const result = await trainStat(stat);

      if (!result) {
        console.error('Training failed - no result from server');
        return;
      }

      // Handle recovered state (action was already processed or state was stale)
      if (result.recovered) {
        console.log('State recovered after interruption, continuing with synced state');
        return; // State has been synced, UI will update via careerData change
      }

      // Server has already updated careerData through CareerContext
      // Now handle client-side presentation (modals, animations)
      const nextTurn = result.careerState.turn;

      // If training result contains a moveHint (from support card), add to learnableAbilities
      const moveHint = result.moveHint || result.hint?.move;
      if (moveHint) {
        setCareerData(prev => {
          const isAlreadyLearnable = prev.pokemon.learnableAbilities?.includes(moveHint);
          const isAlreadyKnown = prev.knownAbilities?.includes(moveHint);

          if (isAlreadyLearnable || isAlreadyKnown) {
            return prev; // No update needed
          }

          return {
            ...prev,
            pokemon: {
              ...prev.pokemon,
              learnableAbilities: [...(prev.pokemon.learnableAbilities || []), moveHint]
            },
            moveHints: {
              ...prev.moveHints,
              [moveHint]: (prev.moveHints?.[moveHint] || 0) + 1
            }
          };
        });
      }

      // Check for inspiration event
      const inspirationResult = checkAndApplyInspiration(
        nextTurn,
        selectedInspirations,
        result.careerState.currentStats,
        result.careerState.pokemon.typeAptitudes,
        result.careerState.pokemon.strategyAptitudes
      );

      if (inspirationResult && inspirationResult.results.length > 0) {
        setTimeout(() => {
          setInspirationModal(inspirationResult);
        }, 0);
      }

      // Check for evolution (pass server state to avoid stale React state)
      const evolutionCheck = checkForEvolution(
        result.careerState.pokemon.name,
        result.careerState.currentStats,
        result.careerState
      );

      if (evolutionCheck) {
        const oldStats = result.careerState.currentStats;
        const statBoost = EVOLUTION_CHAINS[result.careerState.basePokemonName || result.careerState.pokemon.name]?.stages === 2
          ? EVOLUTION_CONFIG.STAT_BOOST.TWO_STAGE
          : EVOLUTION_CONFIG.STAT_BOOST.ONE_STAGE;
        const newStats = {};
        for (const [s, value] of Object.entries(oldStats)) {
          newStats[s] = Math.round(value * (1 + statBoost));
        }

        setTimeout(() => {
          setEvolutionModal({
            fromName: result.careerState.pokemon.name,
            toName: evolutionCheck.toName,
            toStage: evolutionCheck.toStage,
            oldStats: oldStats,
            newStats: newStats
          });
        }, 0);
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  /**
   * Perform rest action to restore energy (SERVER-AUTHORITATIVE)
   */
  const performRest = async () => {
    // Prevent double-clicks
    if (isProcessingAction) return;
    setIsProcessingAction(true);

    try {
      // Call server-authoritative rest endpoint
      const result = await restOnServer();

      if (!result) {
        console.error('Rest failed - no result from server');
        return;
      }

      // Handle recovered state (action was already processed or state was stale)
      if (result.recovered) {
        console.log('State recovered after interruption, continuing with synced state');
        return; // State has been synced, UI will update via careerData change
      }

      // Server has already updated careerData through CareerContext
      // Now handle client-side presentation (modals, animations)
      const nextTurn = result.careerState.turn;

      // Check for inspiration event
      const inspirationResult = checkAndApplyInspiration(
        nextTurn,
        selectedInspirations,
        result.careerState.currentStats,
        result.careerState.pokemon.typeAptitudes,
        result.careerState.pokemon.strategyAptitudes
      );

      if (inspirationResult && inspirationResult.results.length > 0) {
        setInspirationModal(inspirationResult);
      }

      console.log('[performRest] Energy gain:', result.energyGain, 'New energy:', result.careerState.energy);
    } finally {
      // Small delay to prevent rapid clicks
      setTimeout(() => setIsProcessingAction(false), 300);
    }
  };

  /**
   * Resolve event by making choice (SERVER-AUTHORITATIVE)
   */
  const handleEventChoice = async (choiceIndex) => {
    // Prevent double-clicks and flickering
    if (isProcessingEvent) return;
    setIsProcessingEvent(true);

    try {
      const outcome = await resolveEventOnServer(choiceIndex);

      if (!outcome) {
        console.error('Event resolution failed - no outcome from server');
        return;
      }

      // If outcome contains a moveHint, ensure it's added to learnableAbilities
      // (Server should handle this, but we ensure it client-side as well)
      if (outcome.moveHint) {
        console.log('[handleEventChoice] Adding moveHint to learnableAbilities:', outcome.moveHint);
        setCareerData(prev => {
          // Check if move is already in learnableAbilities or known
          const isAlreadyLearnable = prev.pokemon.learnableAbilities?.includes(outcome.moveHint);
          const isAlreadyKnown = prev.knownAbilities?.includes(outcome.moveHint);

          if (isAlreadyLearnable || isAlreadyKnown) {
            console.log('[handleEventChoice] Move already known/learnable, skipping:', outcome.moveHint);
            return prev; // No update needed
          }

          console.log('[handleEventChoice] Adding to learnableAbilities:', {
            move: outcome.moveHint,
            currentLearnables: prev.pokemon.learnableAbilities
          });

          // Add moveHint to learnableAbilities
          return {
            ...prev,
            pokemon: {
              ...prev.pokemon,
              learnableAbilities: [...(prev.pokemon.learnableAbilities || []), outcome.moveHint]
            },
            // Also update moveHints count for discount calculation
            moveHints: {
              ...prev.moveHints,
              [outcome.moveHint]: (prev.moveHints?.[outcome.moveHint] || 0) + 1
            }
          };
        });
      }
    } finally {
      setIsProcessingEvent(false);
    }
  };

  /**
   * Start battle with opponent
   */
  const startBattle = async (opponent, isGymLeader = false, isEliteFour = false, isEventBattle = false) => {
    // Prevent wild battles at 0 energy (gym leaders and event battles don't cost energy upfront)
    if (!isGymLeader && !isEliteFour && !isEventBattle && careerData.energy <= 0) {
      return; // Don't start battle
    }

    console.log('[startBattle] Processing server-side battle:', {
      opponent: opponent.name,
      isGymLeader,
      isEliteFour,
      isEventBattle
    });

    // Call server to process battle
    const battleResult = await processBattle(opponent, isGymLeader, isEventBattle);

    if (!battleResult) {
      console.error('[startBattle] Failed to get battle result from server');
      alert('Battle failed to process. Please try again.');
      return;
    }

    console.log('[startBattle] Server returned battle result:', battleResult);

    // Create player and opponent objects for battle replay
    const playerPokemon = {
      name: careerData.pokemon.name,
      primaryType: careerData.pokemon.primaryType,
      stats: { ...careerData.currentStats },
      abilities: careerData.knownAbilities,
      typeAptitudes: careerData.pokemon.typeAptitudes,
      strategy: careerData.pokemon.strategy,
      strategyGrade: careerData.pokemon.strategyGrade
    };

    // Normalize opponent data - use server's scaled stats from battle log
    // The server scales gym leader/Elite Four stats before battle, so we must use those values
    const pokemonData = opponent.pokemon || opponent; // Elite Four has nested pokemon object
    const opponentName = pokemonData.name || opponent.name;
    const opponentType = pokemonData.primaryType || opponent.primaryType;

    // Get the actual stats from the first battle log entry - these are the SERVER's scaled stats
    const battleLog = battleResult.battleLog || [];
    const initialLogEntry = battleLog[0];

    // Use server's maxHp from battle log for opponent stats (these are properly scaled)
    // Fall back to baseStats only if no battle log exists
    const serverOpponentMaxHp = initialLogEntry?.player2?.maxHp;
    const baseOpponentStats = pokemonData.stats || pokemonData.baseStats;

    // If server provided scaled HP, calculate the scale factor and apply to all stats
    let opponentStats;
    if (serverOpponentMaxHp && baseOpponentStats && baseOpponentStats.HP) {
      const scaleFactor = serverOpponentMaxHp / baseOpponentStats.HP;
      opponentStats = {
        HP: serverOpponentMaxHp,
        Attack: Math.floor(baseOpponentStats.Attack * scaleFactor),
        Defense: Math.floor(baseOpponentStats.Defense * scaleFactor),
        Instinct: Math.floor(baseOpponentStats.Instinct * scaleFactor),
        Speed: Math.floor(baseOpponentStats.Speed * scaleFactor)
      };
    } else {
      opponentStats = baseOpponentStats;
    }

    // Set battle state with server's battle log for replay
    setBattleState({
      player: {
        ...playerPokemon,
        currentHP: playerPokemon.stats.HP,
        currentStamina: GAME_CONFIG.BATTLE.MAX_STAMINA,
        moveStates: {},
        isResting: false,
        statusEffects: []
      },
      opponent: {
        ...opponent,
        name: opponentName,
        primaryType: opponentType,
        stats: opponentStats,
        currentHP: opponentStats?.HP || 100,
        currentStamina: GAME_CONFIG.BATTLE.MAX_STAMINA,
        moveStates: {},
        isResting: false,
        statusEffects: []
      },
      tick: 0,
      log: battleResult.battleLog || [], // Use server's battle log
      displayLog: [], // Initialize empty display log - will be populated tick-by-tick
      isGymLeader,
      isEliteFour,
      eliteFourIndex: isEliteFour ? (careerData.turn - (GAME_CONFIG.CAREER.ELITE_FOUR_START_TURN || 60)) : null,
      winner: battleResult.winner, // 'player' or 'opponent'
      rewards: battleResult.rewards, // { statGain, skillPoints, energyChange }
      serverResult: true // Flag to indicate this came from server
    });
    setGameState('battle');
  };

  /**
   * Learn a new move (SERVER-AUTHORITATIVE)
   */
  const learnMove = async (moveName) => {
    const success = await learnAbilityOnServer(moveName);

    if (!success) {
      console.error('Failed to learn ability:', moveName);
    }

    // Server has already updated careerData with the new ability and SP cost
  };

  /**
   * Calculate training fail chance based on energy
   */
  const calculateFailChance = (currentEnergy, statType = null) => {
    // Reduced intensity by ~10%: More lenient curve
    let baseFailureChance = 0;
    if (currentEnergy <= 75) {
      if (currentEnergy <= 0) {
        baseFailureChance = 0.891; // Was 0.99
      } else if (currentEnergy <= 20) {
        baseFailureChance = 0.891 - ((currentEnergy / 20) * 0.216); // Was 0.99 - 0.24
      } else if (currentEnergy <= 30) {
        baseFailureChance = 0.675 - (((currentEnergy - 20) / 10) * 0.225); // Was 0.75 - 0.25
      } else if (currentEnergy <= 50) {
        baseFailureChance = 0.45 - (((currentEnergy - 30) / 20) * 0.225); // Was 0.50 - 0.25
      } else {
        baseFailureChance = 0.225 - (((currentEnergy - 50) / 25) * 0.225); // Was 0.25 - 0.25
      }
    }

    // Speed training has 50% lower fail rate than other trainings
    if (statType === 'Speed') {
      baseFailureChance *= 0.5;
    }

    return Math.round(baseFailureChance * 100);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Skip if still processing an event resolution (prevents flicker during state transition)
    if (isProcessingEvent) return;

    // Skip if a training/rest action is in progress (prevents race condition where
    // triggerEvent/generateTraining overwrites training options while user's action is pending)
    if (isProcessingAction) return;

    // Skip if we just declined an event and are waiting for training options
    if (declinedEventRef.current) return;

    if (careerData && !careerData.currentTrainingOptions && !careerData.pendingEvent && !careerData.eventResult && !evolutionModal && !inspirationModal) {
      // Don't generate training on gym turns or Elite 4 turns
      const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
      const isGymTurn = careerData.turn === nextGymTurn && careerData.currentGymIndex < 4;
      const eliteFourStartTurn = GAME_CONFIG.CAREER.ELITE_FOUR_START_TURN || 60;
      const eliteFourIdx = careerData.turn - eliteFourStartTurn;
      const isEliteFourTurn = careerData.turn >= eliteFourStartTurn && eliteFourIdx >= 0 && eliteFourIdx < 4 && !careerData.eliteFourDefeated?.[eliteFourIdx];
      if (isGymTurn || isEliteFourTurn) return;

      // Check if we've already processed this turn
      const justExitedBattle = !battleState && lastProcessedTurnRef.current === careerData.turn;
      if (lastProcessedTurnRef.current === careerData.turn && !justExitedBattle) return;

      // Mark this turn as processed
      lastProcessedTurnRef.current = careerData.turn;

      // Inspiration turns are reserved - no random events
      const inspirationTurns = [11, 23, 35, 47, 59];
      const isInspirationTurn = inspirationTurns.includes(careerData.turn);

      // SERVER-AUTHORITATIVE: Let server decide if event should trigger
      const shouldCheckForEvent = careerData.turn > 1 && careerData.turn !== nextGymTurn && !justExitedBattle && !isInspirationTurn;

      if (shouldCheckForEvent) {
        // Server will decide if an event occurs (50% chance) or generate training options
        triggerEvent();
      } else {
        // No event possible, generate training options from server
        generateTraining();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerData?.turn, careerData?.currentTrainingOptions, careerData?.pendingEvent, careerData?.eventResult, evolutionModal, inspirationModal, battleState, isProcessingEvent, isProcessingAction]);

  // Null check AFTER all hooks
  if (!careerData) {
    return null;
  }

  // ============================================================================
  // MODAL COMPONENTS
  // ============================================================================

  const EvolutionModal = () => {
    console.log('EvolutionModal render - evolutionModal:', evolutionModal);
    if (!evolutionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-card-lg text-center"
        >
          <h2 className="text-2xl font-bold text-pocket-red mb-4">Evolution!</h2>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="mb-2">
                {generatePokemonSprite(POKEMON[evolutionModal.fromName]?.primaryType || 'Normal', evolutionModal.fromName)}
              </div>
              <p className="font-bold text-pocket-text">{evolutionModal.fromName}</p>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: getGradeColor(getPokemonGrade(evolutionModal.oldStats)) }}
              >
                {getPokemonGrade(evolutionModal.oldStats)}
              </span>
            </div>

            <div className="text-3xl text-amber-400 animate-pulse">→</div>

            <div className="text-center">
              <div className="mb-2">
                {generatePokemonSprite(POKEMON[evolutionModal.toName]?.primaryType || 'Normal', evolutionModal.toName)}
              </div>
              <p className="font-bold text-pocket-text">{evolutionModal.toName}</p>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: getGradeColor(getPokemonGrade(evolutionModal.newStats)) }}
              >
                {getPokemonGrade(evolutionModal.newStats)}
              </span>
            </div>
          </div>

          <div className="bg-pocket-bg rounded-xl p-4 mb-4">
            <p className="font-bold text-pocket-text mb-2 text-sm">Stats increased by 10%!</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.keys(evolutionModal.newStats).map(stat => {
                const oldVal = evolutionModal.oldStats[stat];
                const newVal = evolutionModal.newStats[stat];
                return (
                  <div key={stat} className="flex justify-between text-pocket-text-light">
                    <span>{stat}:</span>
                    <span className="text-pocket-green font-bold">{oldVal} → {newVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => applyEvolution(evolutionModal.fromName, evolutionModal.toName, evolutionModal.toStage)}
            className="pocket-btn-primary w-full py-3 text-lg"
          >
            Evolve!
          </button>
        </motion.div>
      </div>
    );
  };

  // Strategy Selector Modal - allows player to choose battle strategy
  const StrategySelector = () => {
    if (!showStrategySelector || !careerData?.pokemon?.strategyAptitudes) return null;

    const strategies = ['Scaler', 'Nuker', 'Debuffer', 'Chipper', 'MadLad'];
    const strategyDescriptions = {
      Scaler: 'Buffs first, then highest damage moves',
      Nuker: 'Saves stamina for powerful attacks',
      Debuffer: 'Prioritizes status effects before damage',
      Chipper: 'Rapid low-stamina attacks for pressure',
      MadLad: 'Completely random move selection'
    };

    const handleStrategySelect = async (strategy) => {
      const result = await changeStrategy(strategy);
      if (result) {
        setShowStrategySelector(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowStrategySelector(false)}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-card-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-pocket-text mb-3 text-center">Select Battle Strategy</h2>

          <div className="space-y-2">
            {strategies.map(strategy => {
              const grade = careerData.pokemon.strategyAptitudes[strategy] || 'C';
              const isSelected = careerData.pokemon.strategy === strategy;

              return (
                <button
                  key={strategy}
                  onClick={() => handleStrategySelect(strategy)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-pocket-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pocket-text">{strategy}</span>
                      {isSelected && (
                        <span className="text-xs text-pocket-blue font-bold">(Active)</span>
                      )}
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getAptitudeColor(grade) }}
                    >
                      {grade}
                    </span>
                  </div>
                  <p className="text-xs text-pocket-text-light mt-1">{strategyDescriptions[strategy]}</p>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowStrategySelector(false)}
            className="w-full mt-4 py-2 rounded-xl border-2 border-gray-300 text-pocket-text font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  };

  const InspirationModal = () => {
    console.log('[InspirationModal] Render, modal state:', inspirationModal);
    if (!inspirationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-card-lg"
        >
          <h2 className="text-2xl font-bold text-amber-500 mb-2 text-center">Inspiration!</h2>
          <p className="text-pocket-text-light text-center mb-4 text-sm">Your trained Pokemon inspire you at Turn {inspirationModal.turn}!</p>

          <div className="space-y-3">
            {inspirationModal.results.map((result, idx) => (
              <div key={idx} className="bg-pocket-bg rounded-xl p-4">
                <h3 className="text-lg font-bold text-pocket-text mb-2">{result.pokemonName}</h3>

                {result.statBonus && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-pocket-green font-bold">
                        {result.statBonus.stat} +{result.statBonus.amount}
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(result.statBonus.stars)].map((_, i) => (
                          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.aptitudeUpgrade && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                    <div className="text-purple-700 font-bold mb-1 text-sm">
                      {result.aptitudeUpgrade.type} Aptitude: {result.aptitudeUpgrade.from} → {result.aptitudeUpgrade.to}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-pocket-text-light">
                        {(result.aptitudeUpgrade.chance * 100).toFixed(0)}% chance
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(result.aptitudeUpgrade.stars)].map((_, i) => (
                          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.strategyUpgrade && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-orange-700 font-bold mb-1 text-sm">
                      {result.strategyUpgrade.strategy} Strategy: {result.strategyUpgrade.from} → {result.strategyUpgrade.to}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-pocket-text-light">
                        {(result.strategyUpgrade.chance * 100).toFixed(0)}% chance
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(result.strategyUpgrade.stars)].map((_, i) => (
                          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!result.statBonus && !result.aptitudeUpgrade && !result.strategyUpgrade && (
                  <div className="text-pocket-text-light text-sm italic">
                    No bonuses this time
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={async () => {
              // Apply the inspiration bonuses to career state before closing
              if (inspirationModal.updatedStats || inspirationModal.updatedAptitudes || inspirationModal.updatedStrategyAptitudes) {
                console.log('[InspirationModal] Applying inspiration bonuses:', {
                  stats: inspirationModal.updatedStats,
                  aptitudes: inspirationModal.updatedAptitudes,
                  strategyAptitudes: inspirationModal.updatedStrategyAptitudes
                });
                const updatedCareerData = {
                  ...careerData,
                  currentStats: inspirationModal.updatedStats || careerData.currentStats,
                  pokemon: {
                    ...careerData.pokemon,
                    typeAptitudes: inspirationModal.updatedAptitudes || careerData.pokemon.typeAptitudes,
                    strategyAptitudes: inspirationModal.updatedStrategyAptitudes || careerData.pokemon.strategyAptitudes
                  }
                };
                // Update career state (syncs to backend via updateCareer)
                const success = await updateCareer(updatedCareerData);
                console.log('[InspirationModal] Career update result:', success);
              }

              setInspirationModal(null);
              // Training options were already generated by the server when training completed,
              // so no need to request new ones here. The useEffect will handle edge cases.
            }}
            className="pocket-btn-primary w-full mt-4 py-3 text-lg"
          >
            Continue
          </button>
        </motion.div>
      </div>
    );
  };

  const PokeclockModal = () => {
    if (!pokeclockModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full shadow-card-lg text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pocket-blue/10 flex items-center justify-center">
            <Clock size={40} className="text-pocket-blue animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-pocket-blue mb-2">Pokeclock Used!</h2>
          <p className="text-pocket-text-light">You get another chance!</p>
        </motion.div>
      </div>
    );
  };

  const HelpModal = () => {
    if (!showHelp) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4"
        onClick={() => setShowHelp(false)}
        style={{ overflow: 'hidden' }}
      >
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-2xl w-full sm:w-[500px] shadow-card-lg"
          style={{
            height: 'calc(100vh - 2rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border-b border-pocket-bg p-4 flex justify-between items-center rounded-t-2xl" style={{ flexShrink: 0 }}>
            <div className="flex items-center gap-2">
              <HelpCircle size={20} className="text-pocket-blue" />
              <h2 className="text-lg font-bold text-pocket-text">Game Guide</h2>
            </div>
            <button onClick={() => setShowHelp(false)} className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors">{ICONS.CLOSE}</button>
          </div>

          <div
            className="p-4 space-y-4"
            style={{
              flex: 1,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <section>
              <h3 className="text-base font-bold text-pocket-red mb-2 border-b border-pocket-bg pb-2">Pokemon</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Stats</h4>
                  <div className="text-sm space-y-1 ml-2">
                    <p><strong>HP:</strong> Health points in battle</p>
                    <p><strong>Attack:</strong> Damage output</p>
                    <p><strong>Defense:</strong> Damage mitigation</p>
                    <p><strong>Instinct:</strong> Crit chance & dodge chance</p>
                    <p><strong>Speed:</strong> Stamina regeneration rate</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Type Aptitudes</h4>
                  <p className="text-sm ml-2">Grades (F-S) multiply damage when using that type.</p>
                  <div className="text-sm ml-2 mt-1 grid grid-cols-2 gap-1">
                    <span><strong style={{color: '#000'}}>F:</strong> 60%</span>
                    <span><strong style={{color: '#9ca3af'}}>E:</strong> 70%</span>
                    <span><strong style={{color: '#3b82f6'}}>D:</strong> 80%</span>
                    <span><strong style={{color: '#22c55e'}}>C:</strong> 90%</span>
                    <span><strong style={{color: '#ec4899'}}>B:</strong> 100%</span>
                    <span><strong style={{color: '#f97316'}}>A:</strong> 110%</span>
                    <span><strong style={{color: '#eab308'}}>S:</strong> 120%</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Type Matchups</h4>
                  <p className="text-sm ml-2">Super effective attacks deal +20% damage.</p>
                  <div className="text-sm ml-2 space-y-1 mt-1">
                    <p>Fire {ICONS.ARROW_RIGHT} Grass {ICONS.ARROW_RIGHT} Water {ICONS.ARROW_RIGHT} Fire</p>
                    <p>Fighting {ICONS.ARROW_RIGHT} Electric</p>
                    <p>Psychic {ICONS.ARROW_RIGHT} Fighting</p>
                    <p>Psychic {ICONS.ARROW_DOUBLE} Psychic (neutral)</p>
                    <p>Fighting {ICONS.ARROW_RIGHT} Normal</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Strategies</h4>
                  <p className="text-sm ml-2">Each Pokemon has a preferred battle strategy:</p>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Scaler:</strong> Buffs first, then highest damage moves</p>
                    <p><strong>Nuker:</strong> Saves stamina for powerful attacks</p>
                    <p><strong>Debuffer:</strong> Prioritizes status effects</p>
                    <p><strong>Chipper:</strong> Rapid low-stamina attacks</p>
                    <p><strong>MadLad:</strong> Random move selection</p>
                  </div>
                  <p className="text-sm ml-2 mt-1">Strategy aptitude grade affects stamina costs.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-pocket-red mb-2 border-b border-pocket-bg pb-2">Battles</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Combat</h4>
                  <p className="text-sm ml-2">Real-time auto-battle system. Pokemon automatically use abilities based on stamina and cooldowns.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Stamina</h4>
                  <p className="text-sm ml-2">Required to use abilities. Regenerates when resting (not using abilities). Speed stat increases regen rate.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Abilities</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Warmup:</strong> Ticks before ability becomes available</p>
                    <p><strong>Cooldown:</strong> Ticks before ability can be used again</p>
                    <p><strong>Stamina Cost:</strong> Modified by strategy grade (better grade = lower cost)</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Accuracy & Critical Hits</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p>Low stamina increases miss chance</p>
                    <p>Resting grants dodge chance (Instinct/2786)</p>
                    <p>Crit chance: 5% + (Instinct/800) for 2{ICONS.MULTIPLY} damage</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Status Effects</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Burn/Poison:</strong> Damage over time</p>
                    <p><strong>Paralyze:</strong> -25% accuracy</p>
                    <p><strong>Stun:</strong> Cannot act</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Damage Formula</h4>
                  <p className="text-sm ml-2">Base {ICONS.MULTIPLY} (Attack/Defense) {ICONS.MULTIPLY} Type Aptitude {ICONS.MULTIPLY} Type Matchup {ICONS.MULTIPLY} Crit Multiplier</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-pocket-red mb-2 border-b border-pocket-bg pb-2">Career</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Goal</h4>
                  <p className="text-sm ml-2">Defeat 5 Gym Leaders within 60 turns. Gym battles occur at turns 12, 24, 36, 48, and 60.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Energy</h4>
                  <p className="text-sm ml-2">Required for training and battles. At 0 energy, training has 99% fail rate. Resting restores 30-70 energy.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Training</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p><strong>Success:</strong> Gain stats, 3 Skill Points, 7 friendship</p>
                    <p><strong>Failure:</strong> Lose 2 stats</p>
                    <p><strong>Support Bonus:</strong> 100 friendship grants major stat boost</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Wild Battles</h4>
                  <p className="text-sm ml-2">Win: +5 all stats, +10 SP. Cost: -25 energy. At 0 energy: 50% chance to lose 10 all stats.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Gym Battles</h4>
                  <p className="text-sm ml-2">Must win or Game Over. Preview upcoming gym leader stats and abilities. Each gym progressively harder.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Learning Abilities</h4>
                  <div className="text-sm ml-2 space-y-1">
                    <p>Spend Skill Points to learn new abilities</p>
                    <p>Base cost {ICONS.MULTIPLY} 3.0, reduced by move hints (up to -60%)</p>
                    <p>Hints earned through support hangouts</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Events</h4>
                  <p className="text-sm ml-2">50% chance per turn. Includes stat gains, choices, wild battles, setbacks, and support hangouts (at 80+ friendship).</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-base font-bold text-pocket-red mb-2 border-b border-pocket-bg pb-2">Gacha</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Pokemon Gachapon</h4>
                  <p className="text-sm ml-2">Draw random Pokemon to add to your collection. Each Pokemon has unique base stats, type aptitudes, strategies, and learnable abilities.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Rarity Tiers</h4>
                  <p className="text-sm ml-2">Pokemon are graded by total base stats (D to S+). Higher grades are more powerful but rarer.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Starting Fresh</h4>
                  <p className="text-sm ml-2">Each career run starts with a new Pokemon at base stats. Use gacha to find Pokemon suited to your strategy.</p>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    );
  };

  // ============================================================================
  // RENDER MAIN SCREEN
  // ============================================================================

  // Show gym battle when turn matches the next gym's designated turn (turns 12, 24, 36, 48 = 4 gyms)
  const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
  const isGymTurn = careerData.turn === nextGymTurn && careerData.currentGymIndex < 4;
  const nextGymLeader = careerData.gymLeaders?.[careerData.currentGymIndex];

  console.log('[CareerScreen] Render - Turn:', careerData.turn, 'GymIndex:', careerData.currentGymIndex, 'NextGymTurn:', nextGymTurn, 'IsGymTurn:', isGymTurn);

  // Elite 4 battles on turns 60, 61, 62, 63
  const eliteFourStartTurn = GAME_CONFIG.CAREER.ELITE_FOUR_START_TURN || 60;
  const eliteFourIndex = careerData.turn - eliteFourStartTurn;
  const isEliteFourTurn = careerData.turn >= eliteFourStartTurn && eliteFourIndex >= 0 && eliteFourIndex < 4 && !careerData.eliteFourDefeated?.[eliteFourIndex];
  const currentEliteFour = isEliteFourTurn && ELITE_FOUR ? ELITE_FOUR[eliteFourIndex] : null;

  // Combined battle turn check
  const isBattleTurn = isGymTurn || isEliteFourTurn;

  return (
    <>
      <div className="w-full min-h-screen bg-pocket-bg p-2 sm:p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl p-3 sm:p-4 shadow-card"
          >
            {/* Mobile: Stack everything vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Pokemon Info */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                  {generatePokemonSprite(careerData.pokemon.primaryType, careerData.pokemon.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-bold truncate">{careerData.pokemon.name}</h2>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: getGradeColor(getPokemonGrade(careerData.currentStats)) }}
                    >
                      {getPokemonGrade(careerData.currentStats)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <TypeBadge type={careerData.pokemon.primaryType} size={14} />
                    {careerData.pokemon.strategyAptitudes && (
                      <button
                        onClick={() => setShowStrategySelector(true)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-600 text-white hover:bg-gray-500 transition-colors cursor-pointer"
                        title="Click to change strategy"
                      >
                        {careerData.pokemon.strategy || 'Select'} <span style={{ color: getAptitudeColor(careerData.pokemon.strategyGrade || 'C') }}>({careerData.pokemon.strategyGrade || '?'})</span>
                      </button>
                    )}
                  </div>
                  {/* Type Aptitudes - Show all 6 types */}
                  <div className="flex text-[10px] sm:text-xs mt-1 flex-wrap gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-0.5">
                      <TypeIcon type="Fire" size={12} />
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Red), fontWeight: 'bold' }}>{careerData.pokemon.typeAptitudes.Red}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <TypeIcon type="Water" size={12} />
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Blue), fontWeight: 'bold' }}>{careerData.pokemon.typeAptitudes.Blue}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <TypeIcon type="Grass" size={12} />
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Green), fontWeight: 'bold' }}>{careerData.pokemon.typeAptitudes.Green}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <TypeIcon type="Psychic" size={12} />
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Purple), fontWeight: 'bold' }}>{careerData.pokemon.typeAptitudes.Purple}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <TypeIcon type="Electric" size={12} />
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Yellow), fontWeight: 'bold' }}>{careerData.pokemon.typeAptitudes.Yellow}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <TypeIcon type="Fighting" size={12} />
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Orange), fontWeight: 'bold' }}>{careerData.pokemon.typeAptitudes.Orange}</span>
                    </span>
                  </div>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-x-1 sm:gap-x-2 text-xs mt-1">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="HP" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.HP}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Attack" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Attack}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Defense" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Defense}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Instinct" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Instinct}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <StatIcon stat="Speed" size={10} />
                      <span className="font-bold text-[10px] sm:text-xs">{careerData.currentStats.Speed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Turn Counter and Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="font-bold text-sm sm:text-base">Turn {careerData.turn}/{GAME_CONFIG.CAREER.TOTAL_TURNS}</div>
                  <div className="text-xs text-gray-600">
                    {careerData.turn < eliteFourStartTurn
                      ? `Next: Turn ${careerData.currentGymIndex < 4 ? (careerData.currentGymIndex + 1) * 12 : eliteFourStartTurn}`
                      : `Elite 4: ${(careerData.eliteFourDefeated?.filter(Boolean)?.length || 0)}/4`
                    }
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-wrap">
                  <button
                    onClick={() => setViewMode('abilities')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-100 hover:bg-purple-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Sparkles size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.knownAbilities.length}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('learn')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Book size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.skillPoints ?? 0}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('gym')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-100 hover:bg-yellow-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Trophy size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.currentGymIndex}/4</span>
                  </button>
                  <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-pink-100 rounded text-xs sm:text-sm" title="Pokeclocks: Retry gym battles">
                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.pokeclocks || 0}</span>
                  </div>
                  <button
                    onClick={() => setGameState('menu')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 rounded transition cursor-pointer text-xs sm:text-sm"
                    title="Return to Homescreen"
                  >
                    <Home size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAbandonConfirm(true)}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 hover:bg-red-200 rounded transition cursor-pointer text-xs sm:text-sm"
                    title="Abandon Career"
                  >
                    <LogOut size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {isGymTurn && nextGymLeader && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-pocket-red text-white rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-yellow-400 overflow-hidden bg-gray-800 flex-shrink-0">
                    <img
                      src={getGymLeaderImage(nextGymLeader.name)}
                      alt={nextGymLeader.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">GYM LEADER BATTLE!</h3>
                    <p className="text-sm">Face {nextGymLeader.name} now!</p>
                  </div>
                </div>
                <button
                  onClick={() => startBattle(nextGymLeader, true)}
                  className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition"
                >
                  Challenge
                </button>
              </div>
            </motion.div>
          )}

          {isEliteFourTurn && currentEliteFour && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-yellow-400 overflow-hidden bg-gray-800 flex-shrink-0">
                    <img
                      src={getGymLeaderImage(currentEliteFour.name)}
                      alt={currentEliteFour.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Elite Four Member {eliteFourIndex + 1}/4</div>
                    <h3 className="text-xl sm:text-2xl font-bold">{currentEliteFour.name}</h3>
                    <p className="text-sm text-purple-200">{currentEliteFour.title}</p>
                    <p className="text-xs mt-1">Ace: {currentEliteFour.pokemon.name} ({currentEliteFour.type})</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <button
                    onClick={() => {
                      // Pass Elite 4 opponent data - server will scale stats based on turn
                      const pokemon = currentEliteFour.pokemon;
                      const eliteOpponent = {
                        name: currentEliteFour.name,
                        pokemon: pokemon,
                        primaryType: pokemon.primaryType,
                        baseStats: pokemon.baseStats,
                        abilities: [...(pokemon.defaultAbilities || []), ...(pokemon.learnableAbilities || [])],
                        typeAptitudes: pokemon.typeAptitudes,
                        strategy: pokemon.strategy,
                        strategyGrade: pokemon.strategyGrade
                      };
                      startBattle(eliteOpponent, true, true); // isGymLeader=true, isEliteFour=true
                    }}
                    className="bg-yellow-400 text-purple-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-300 transition text-lg"
                  >
                    Challenge Elite Four!
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PENDING EVENT SCREEN */}
          {!isBattleTurn && careerData.pendingEvent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 shadow-card border-l-4 border-amber-500"
            >
              <h3 className="text-lg font-bold mb-2 text-pocket-text">{careerData.pendingEvent.name}</h3>
              <p className="text-pocket-text-light mb-4 text-sm">{careerData.pendingEvent.description}</p>

              {careerData.pendingEvent.type === 'stat_increase' && (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-3 rounded border-2 border-green-500">
                      <div className="font-bold text-green-700 mb-2 text-center">Stat Gains:</div>
                      <div className="flex justify-center">
                        <div className="grid grid-cols-5 gap-2 text-sm max-w-md">
                          {Object.entries(careerData.pendingEvent.effect).map(([stat, value]) => (
                            <div key={stat} className="text-center">
                              <div className="text-gray-600">{stat}</div>
                              <div className="font-bold text-green-600">+{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEventChoice(0)}
                      disabled={isProcessingEvent}
                      className={`w-full py-2 sm:py-3 rounded-lg font-bold transition ${
                        isProcessingEvent
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isProcessingEvent ? 'Processing...' : 'Continue'}
                    </button>
                  </div>
                )}

                {careerData.pendingEvent.type === 'choice' && (
                  <div className="space-y-3">
                    {careerData.pendingEvent.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEventChoice(idx)}
                        disabled={isProcessingEvent}
                        className={`w-full py-2 sm:py-3 px-4 rounded-lg font-bold transition text-left ${
                          isProcessingEvent
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isProcessingEvent ? 'Processing...' : choice.text}
                      </button>
                    ))}
                  </div>
                )}

                {careerData.pendingEvent.type === 'battle' && (
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded border-2 border-red-500">
                      <div className="font-bold text-red-700">This battle will be challenging!</div>
                      <div className="text-sm text-gray-600 mt-1">Difficulty: {careerData.pendingEvent.difficulty}x</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const allNonStarterPokemons = Object.values(POKEMON).filter(c => !c.isStarter);
                          const eventPokemon = allNonStarterPokemons[Math.floor(Math.random() * allNonStarterPokemons.length)];

                          // Use same quadratic scaling as backend wild pokemon battles
                          // calculateDifficultyMultiplier formula from career.js
                          const enemyStatMult = GAME_CONFIG.CAREER.ENEMY_STAT_MULTIPLIER || 0.8;
                          const turn = careerData.turn;
                          let baseMult;
                          if (turn < 12) {
                            baseMult = 1.0 * enemyStatMult;
                          } else {
                            const progress = (turn - 12) / 48;
                            baseMult = (1.0 + (1.56 * progress * progress) + (1.5 * progress)) * enemyStatMult;
                          }
                          // Wild pokemon are 25% stronger than gym leaders (wildMult = baseMult * 1.25)
                          // Event difficulty (1.0-1.25x) represents scaling vs wild baseline
                          // So event mult = baseMult * 1.25 * difficulty
                          // But difficulty 1.0 should equal wild (1.25x), difficulty 1.25 should be ~1.56x
                          // For events to be 1.0-1.25x OF wild: mult = wildMult * difficulty
                          const wildMult = baseMult * 1.25;
                          const mult = wildMult * careerData.pendingEvent.difficulty;

                          const eventOpponent = {
                            name: eventPokemon.name,
                            trainerName: 'Wandering Champion',
                            primaryType: eventPokemon.primaryType,
                            stats: {
                              HP: Math.floor(eventPokemon.baseStats.HP * mult),
                              Attack: Math.floor(eventPokemon.baseStats.Attack * mult),
                              Defense: Math.floor(eventPokemon.baseStats.Defense * mult),
                              Instinct: Math.floor(eventPokemon.baseStats.Instinct * mult),
                              Speed: Math.floor(eventPokemon.baseStats.Speed * mult)
                            },
                            abilities: [...eventPokemon.defaultAbilities, ...eventPokemon.learnableAbilities.slice(0, 3), 'BodySlam'],
                            typeAptitudes: eventPokemon.typeAptitudes,
                            strategy: eventPokemon.strategy,
                            strategyGrade: eventPokemon.strategyGrade
                          };

                          // Store event rewards to apply after battle
                          setCareerData(prev => ({
                            ...prev,
                            eventBattleRewards: careerData.pendingEvent.rewards,
                            pendingEvent: null
                          }));

                          startBattle(eventOpponent, false, false, true); // isEventBattle = true
                        }}
                        className="bg-red-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        Accept Challenge
                      </button>
                      <button
                        onClick={async () => {
                          // Decline the battle - clear event and generate training options
                          // Mark that we declined to prevent re-triggering events
                          declinedEventRef.current = true;
                          setCareerData(prev => ({
                            ...prev,
                            pendingEvent: null
                          }));
                          await requestNewTrainingOptions();
                          declinedEventRef.current = false;
                        }}
                        className="bg-gray-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {careerData.pendingEvent.type === 'hangout' && careerData.pendingEvent.supportName && careerData.pendingEvent.effect && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded border-2 border-blue-500">
                      <div className="font-bold text-blue-700 mb-2 text-lg">Special Hangout with {SUPPORT_CARDS[normalizeSupportName(careerData.pendingEvent.supportName)]?.name || careerData.pendingEvent.supportName}!</div>
                      <div className="font-semibold text-gray-700 mb-1">{careerData.pendingEvent.name}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        {careerData.pendingEvent.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEventChoice(0)}
                      disabled={isProcessingEvent}
                      className={`w-full py-2 sm:py-3 rounded-lg font-bold transition ${
                        isProcessingEvent
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isProcessingEvent ? 'Processing...' : 'Spend Time Together'}
                    </button>
                  </div>
                )}

                {careerData.pendingEvent.type === 'negative' && (
                  <div className="space-y-3">
                    <div className="bg-red-50 p-3 rounded border-2 border-red-500">
                      <div className="font-bold text-red-700 mb-2">Negative Effect:</div>
                      {careerData.pendingEvent.effect.stats && (
                        <div className="text-sm text-gray-600">
                          Stat changes: {Object.entries(careerData.pendingEvent.effect.stats).map(([stat, val]) => `${stat}: ${val}`).join(', ')}
                        </div>
                      )}
                      {careerData.pendingEvent.effect.energy && (
                        <div className="text-sm text-gray-600">
                          Energy: {careerData.pendingEvent.effect.energy}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEventChoice(0)}
                      disabled={isProcessingEvent}
                      className={`w-full py-2 sm:py-3 rounded-lg font-bold transition ${
                        isProcessingEvent
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {isProcessingEvent ? 'Processing...' : 'Continue'}
                    </button>
                  </div>
                )}
            </motion.div>
          )}

          {/* EVENT RESULT SCREEN */}
          {careerData.eventResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 shadow-card border-l-4 border-pocket-green"
            >
              <h3 className="text-lg font-bold mb-3 text-pocket-green">Event Result</h3>

                {/* Flavor Text */}
                {careerData.eventResult.flavor && (
                  <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-3 mb-4">
                    <p className="text-base sm:text-lg italic text-gray-700 text-center">
                      "{careerData.eventResult.flavor}"
                    </p>
                  </div>
                )}

                {(Object.keys(careerData.eventResult.stats).length > 0 || careerData.eventResult.energy !== 0 || careerData.eventResult.skillPoints !== 0) && (
                  <div className="space-y-3">
                    {Object.keys(careerData.eventResult.stats).length > 0 && (
                      <div className={`p-3 rounded border-2 ${
                        Object.values(careerData.eventResult.stats).some(v => v < 0) ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
                      }`}>
                        <div className="font-bold mb-2 text-center">Stat Changes:</div>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                          {Object.entries(careerData.eventResult.stats).map(([stat, value]) => (
                            <div key={stat} className="text-center">
                              <div className="text-gray-600">{stat}</div>
                              <div className={`font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {value >= 0 ? '+' : ''}{value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {careerData.eventResult.energy !== 0 && (
                      <div className={`p-3 rounded border-2 ${
                        careerData.eventResult.energy >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}>
                        <div className="font-bold text-center">
                          Energy: <span className={careerData.eventResult.energy >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {careerData.eventResult.energy >= 0 ? '+' : ''}{careerData.eventResult.energy}
                          </span>
                        </div>
                      </div>
                    )}

                    {careerData.eventResult.skillPoints !== 0 && (
                      <div className={`p-3 rounded border-2 ${
                        careerData.eventResult.skillPoints >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                      }`}>
                        <div className="font-bold text-center">
                          Skill Points: <span className={careerData.eventResult.skillPoints >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {careerData.eventResult.skillPoints >= 0 ? '+' : ''}{careerData.eventResult.skillPoints}
                          </span>
                        </div>
                      </div>
                    )}

                    {Object.keys(careerData.eventResult.friendship).length > 0 && (
                      <div className="bg-blue-50 p-3 rounded border-2 border-blue-500">
                        <div className="font-bold mb-2">Friendship Gained:</div>
                        {Object.entries(careerData.eventResult.friendship).map(([support, value]) => (
                          <div key={support} className="text-sm">
                            <span className="font-bold">{support}:</span> <span className="text-blue-600">+{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {careerData.eventResult.moveHint && (
                      <div className="bg-yellow-50 p-3 rounded border-2 border-yellow-500">
                        <div className="font-bold text-yellow-700">💡 New Move Unlocked!</div>
                        <div className="text-sm mt-1">You can now learn: <span className="font-bold">{careerData.eventResult.moveHint}</span></div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (isProcessingEvent) return;
                    setIsProcessingEvent(true);
                    try {
                      // Server clears eventResult and returns updated state
                      // Training options are already set from resolve-event, so no need to regenerate
                      await clearEventResult();
                    } finally {
                      setIsProcessingEvent(false);
                    }
                  }}
                  disabled={isProcessingEvent}
                  className={`w-full mt-4 py-2 sm:py-3 rounded-lg font-bold transition ${
                    isProcessingEvent
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isProcessingEvent ? 'Processing...' : 'Continue'}
                </button>
            </motion.div>
          )}

          {/* VIEW MODES */}
          {viewMode === 'abilities' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-3 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-pocket-text">Known Abilities</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-pocket-blue hover:underline">
                  Back
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                {careerData.knownAbilities
                  .sort((a, b) => {
                    const moveA = MOVES[a];
                    const moveB = MOVES[b];
                    return moveA.type.localeCompare(moveB.type);
                  })
                  .map(moveName => {
                  const move = MOVES[moveName];
                  return (
                    <div key={moveName} className="border-2 bg-green-50 rounded p-1.5 sm:p-2" style={{ borderColor: TYPE_COLORS[move.type] }}>
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <div className="font-bold text-xs sm:text-sm truncate pr-1">{moveName}</div>
                        <TypeBadge type={move.type} size={12} className="text-[10px] sm:text-xs flex-shrink-0" />
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5">
                        <div>DMG: {move.damage}</div>
                        <div>Stam: {move.stamina} | WU: {move.warmup} | CD: {move.cooldown}</div>
                      </div>
                      {forgetMoveConfirm === moveName ? (
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Use server-authoritative forget ability
                              await forgetAbilityOnServer(moveName);
                              setForgetMoveConfirm(null);
                            }}
                            className="flex-1 bg-red-600 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 rounded hover:bg-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setForgetMoveConfirm(null);
                            }}
                            className="flex-1 bg-gray-400 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 rounded hover:bg-gray-500 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setForgetMoveConfirm(moveName);
                          }}
                          className="w-full mt-1 bg-red-500 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 rounded hover:bg-red-600 cursor-pointer"
                        >
                          Forget
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {viewMode === 'gym' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-3 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-pocket-text">Next Gym Leader</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-pocket-blue hover:underline">
                  Back to Training
                </button>
              </div>
              {nextGymLeader && nextGymLeader.pokemon && (
                <div className="border-2 border-yellow-500 rounded-lg p-3">
                  <div className="flex items-center gap-2 sm:p-4 mb-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-yellow-400 overflow-hidden bg-gray-800 flex-shrink-0">
                      <img
                        src={getGymLeaderImage(nextGymLeader.name)}
                        alt={nextGymLeader.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{nextGymLeader.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        {nextGymLeader.pokemon.name} <TypeBadge type={nextGymLeader.pokemon.primaryType} size={12} />
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Strategy: {nextGymLeader.pokemon.strategy} ({nextGymLeader.pokemon.strategyGrade})</p>
                    </div>
                  </div>
                  {(() => {
                    const scaledStats = getScaledStats(nextGymLeader.pokemon.baseStats, nextGymTurn);
                    return (
                      <div className="grid grid-cols-6 gap-2 text-sm mb-3">
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">HP</div>
                          <div className="font-bold">{scaledStats.HP}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">ATK</div>
                          <div className="font-bold">{scaledStats.Attack}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">DEF</div>
                          <div className="font-bold">{scaledStats.Defense}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">INS</div>
                          <div className="font-bold">{scaledStats.Instinct}</div>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                          <div className="text-xs text-gray-500">SPE</div>
                          <div className="font-bold">{scaledStats.Speed}</div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="mb-2">
                    <div className="font-bold text-sm mb-2">Abilities:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[...(nextGymLeader.pokemon.defaultAbilities || []), ...(nextGymLeader.pokemon.learnableAbilities || [])].map(moveName => {
                        const move = MOVES[moveName];
                        if (!move) return null;
                        return (
                          <div key={moveName} className="border rounded p-2 bg-gray-50">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold text-xs">{moveName}</div>
                              <TypeBadge type={move.type} size={12} className="text-xs" />
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <div>DMG: {move.damage}</div>
                              <div>Stamina: {move.stamina}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {viewMode === 'learn' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-3 shadow-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="font-bold text-pocket-text">Learn Abilities ({careerData.skillPoints ?? 0} SP)</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-pocket-blue hover:underline self-start sm:self-auto">
                  Back
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                {(() => {
                  // Combine learnableAbilities with any hinted moves that aren't already included
                  const baseLearnables = careerData.pokemon.learnableAbilities || [];
                  const hintedMoves = Object.keys(careerData.moveHints || {});
                  const knownMoves = careerData.knownAbilities || [];

                  // Add hinted moves that aren't in base list and aren't already known
                  const additionalFromHints = hintedMoves.filter(
                    move => !baseLearnables.includes(move) && !knownMoves.includes(move) && MOVES[move]
                  );

                  const allLearnables = [...baseLearnables, ...additionalFromHints];

                  // Debug logging
                  if (additionalFromHints.length > 0) {
                    console.log('[Learn Screen] Adding hinted moves not in base list:', additionalFromHints);
                  }

                  return allLearnables;
                })()
                  .filter(moveName => {
                    if (!MOVES[moveName]) {
                      console.error(`[Learn Screen] Move not found: ${moveName}`);
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    try {
                      const moveA = MOVES[a];
                      const moveB = MOVES[b];
                      if (!moveA || !moveB) {
                        console.error('[Learn Screen] Missing move data:', { a, moveA, b, moveB });
                        return 0;
                      }
                      return (moveA.type || '').localeCompare(moveB.type || '');
                    } catch (error) {
                      console.error('[Learn Screen] Sort error:', error, { a, b });
                      return 0;
                    }
                  })
                  .map(moveName => {
                    try {
                      const move = MOVES[moveName];
                      if (!move) {
                        console.error(`[Learn Screen] Move data missing for: ${moveName}`);
                        return null;
                      }

                      const isKnown = careerData.knownAbilities.includes(moveName);
                      const hintsReceived = (careerData.moveHints || {})[moveName] || 0;
                      const discount = Math.min(hintsReceived * GAME_CONFIG.MOVES.HINT_DISCOUNT, GAME_CONFIG.MOVES.MAX_HINT_DISCOUNT);
                      const finalCost = Math.ceil(move.cost * (1 - discount));
                      const canAfford = (careerData.skillPoints ?? 0) >= finalCost;

                      return (
                        <div key={moveName} className={`border-2 rounded p-1.5 sm:p-2 ${isKnown ? 'bg-green-50' : ''}`} style={{ borderColor: isKnown ? '#22c55e' : TYPE_COLORS[move.type] }}>
                          <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                            <div className="font-bold text-xs sm:text-sm truncate pr-1">{moveName}</div>
                            <TypeBadge type={move.type} size={12} className="text-[10px] sm:text-xs flex-shrink-0" />
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 italic mb-1">{getMoveDescription(move)}</div>
                          <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 mb-1 sm:mb-2">
                            <div>DMG: {move.damage}</div>
                            <div>Stam: {move.stamina} | WU: {move.warmup} | CD: {move.cooldown}</div>
                            {move.effect && (
                              <div className="text-purple-600 font-bold truncate">
                                {move.effect.type === 'burn' && `Burn ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'poison' && `Poison ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'paralyze' && `Paralyze ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'stun' && `Stun ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'confuse' && `Confuse ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'freeze' && `Freeze ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'sleep' && `Sleep ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'soak' && `Soak ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'energize' && `Energize ${Math.round((move.effect.chance || 1) * 100)}%`}
                                {move.effect.type === 'drain' && `Drain ${Math.round((move.effect.healPercent || 0.5) * 100)}%`}
                                {move.effect.type === 'recoil' && `Recoil ${Math.round((move.effect.damagePercent || 0.1) * 100)}%`}
                                {move.effect.type === 'exhaust' && `Self-Exhaust`}
                                {move.effect.type === 'evasion' && `Evasion`}
                                {move.effect.type === 'high_crit' && `High Crit`}
                                {move.effect.type === 'buff_speed' && `+Speed`}
                                {move.effect.type === 'buff_attack' && `+Attack`}
                                {move.effect.type === 'buff_defense' && `+Defense`}
                                {move.effect.type === 'buff_instinct' && `+Instinct`}
                                {move.effect.type === 'buff_attack_defense' && `+Atk/Def`}
                                {move.effect.type === 'buff_attack_speed' && `+Atk/Spd`}
                                {move.effect.type === 'debuff_attack' && `-Attack`}
                                {move.effect.type === 'debuff_defense' && `-Defense`}
                                {move.effect.type === 'debuff_speed' && `-Speed`}
                                {move.effect.type === 'debuff_instinct' && `-Instinct`}
                                {move.effect.type === 'debuff_accuracy' && `-Accuracy`}
                                {move.effect.type === 'debuff_instinct_self' && `Self -Inst`}
                                {move.effect.type === 'debuff_speed_self' && `Self -Spd`}
                                {move.effect.type === 'debuff_attack_self' && `Self -Atk`}
                                {move.effect.type === 'heal_self' && `Heal ${Math.round((move.effect.healPercent || 0.5) * 100)}%`}
                                {move.effect.type === 'badly_poison' && `Bad Poison`}
                                {move.effect.type?.startsWith('weather_') && `Weather`}
                                {move.effect.type?.startsWith('terrain_') && `Terrain`}
                                {move.effect.type === 'buff_crit' && `+Crit Rate`}
                              </div>
                            )}
                          </div>
                          {!isKnown && (
                            <>
                              {discount > 0 && (
                                <div className="text-[10px] sm:text-xs text-green-600 font-bold mb-0.5 sm:mb-1">
                                  -{Math.round(discount * 100)}% off!
                                </div>
                              )}
                              <button
                                onClick={() => learnMove(moveName)}
                                disabled={!canAfford}
                                className={`w-full py-1 rounded text-[10px] sm:text-xs font-bold ${
                                  canAfford ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                Learn ({finalCost} SP)
                              </button>
                            </>
                          )}
                          {isKnown && <div className="text-center text-green-600 font-bold text-[10px] sm:text-xs">Learned</div>}
                        </div>
                      );
                    } catch (error) {
                      console.error('[Learn Screen] Render error for move:', moveName, error);
                      return null;
                    }
                })}
              </div>
            </motion.div>
          )}

          {/* TRAINING VIEW */}
          {viewMode === 'training' && careerData.currentTrainingOptions && !careerData.pendingEvent && !careerData.eventResult && !isBattleTurn && !inspirationModal && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-3 shadow-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-pocket-text">Training</h3>
                    {/* Energy bar with conditional colors */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-pocket-text-light">Energy</span>
                      <div className="relative w-32 sm:w-40 h-4 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                        {/* Active energy portion with conditional color */}
                        <div
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (careerData.energy / (careerData.maxEnergy || GAME_CONFIG.CAREER?.MAX_ENERGY || 100)) * 100)}%`,
                            backgroundColor: careerData.energy > 50 ? '#22c55e' : careerData.energy >= 25 ? '#eab308' : '#ef4444'
                          }}
                        />
                        {/* Energy text overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                            {careerData.energy}/{careerData.maxEnergy || GAME_CONFIG.CAREER?.MAX_ENERGY || 100}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <button
                      onClick={performRest}
                      disabled={isProcessingAction}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded font-bold transition text-xs sm:text-sm flex-1 sm:flex-none ${
                        isProcessingAction
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isProcessingAction ? 'Resting...' : 'Rest'}
                    </button>
                    <button
                      onClick={() => setViewMode('battle')}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Battle
                    </button>
                    <button
                      onClick={() => setViewMode('log')}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-700 transition text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Log
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {['HP', 'Attack', 'Defense', 'Instinct', 'Speed'].map(stat => {
                    const option = careerData.currentTrainingOptions[stat];
                    if (!option) return null; // Skip if option doesn't exist for this stat
                    const energyCost = GAME_CONFIG.TRAINING.ENERGY_COSTS[stat];

                    // Calculate fail chance based on CURRENT energy and stat type
                    const failChance = calculateFailChance(careerData.energy, stat);

                    let statGain = GAME_CONFIG.TRAINING.BASE_STAT_GAINS[stat];
                    let energyRegenBonus = 0; // Bonus energy for Speed training from support cards
                    option.supports.forEach(supportName => {
                      const support = getSupportCardAttributes(supportName);
                      if (!support) return;

                      const initialFriendship = support?.initialFriendship || 0;
                      const friendship = careerData.supportFriendships?.[supportName] ?? initialFriendship;
                      const isMaxFriendship = friendship >= 100;
                      const supportType = support.type || support.supportType;

                      if (supportType === stat) {
                        statGain += isMaxFriendship ? support.friendshipBonusTraining : support.typeBonusTraining;
                      } else {
                        statGain += support.generalBonusTraining;
                      }

                      // Collect energy regen bonus for Speed training
                      if (stat === 'Speed') {
                        const supportCard = SUPPORT_CARDS[normalizeSupportName(supportName)];
                        if (supportCard?.specialEffect?.energyRegenBonus) {
                          energyRegenBonus += supportCard.specialEffect.energyRegenBonus;
                        }
                      }
                    });

                    // Apply training level bonus
                    const trainingLevel = careerData.trainingLevels?.[stat] || 0;
                    const levelBonus = trainingLevel * (GAME_CONFIG.TRAINING.LEVEL_BONUS_MULTIPLIER || 0.10);
                    statGain = Math.floor(statGain * (1 + levelBonus));

                    // Get training progress
                    const trainingProgress = careerData.trainingProgress?.[stat] || 0;

                    // Get training level color based on level (like rarity colors)
                    const getLevelColor = (level) => {
                      if (level === 0) return '#9ca3af'; // Gray
                      if (level <= 2) return '#22c55e'; // Green (Common)
                      if (level <= 4) return '#3b82f6'; // Blue (Uncommon)
                      if (level <= 6) return '#a855f7'; // Purple (Rare)
                      return '#eab308'; // Gold (Legendary)
                    };

                    const currentStatValue = careerData.currentStats[stat];

                    // Check if any support card's type matches this stat AND is at max friendship
                    const hasMaxFriendshipTypeMatch = option.supports.some(supportName => {
                      const support = getSupportCardAttributes(supportName);
                      if (!support) return false;
                      const supportType = support.supportType;
                      const friendship = careerData.supportFriendships?.[supportName] || 0;
                      const isMaxFriendship = friendship >= 100;
                      const matches = supportType === stat && isMaxFriendship;
                      if (isMaxFriendship) {
                        console.log('[RainbowSheen] Support:', supportName, 'Type:', supportType, 'Stat:', stat, 'Friendship:', friendship, 'Matches:', matches);
                      }
                      return matches;
                    });

                    return (
                      <button
                        key={stat}
                        onClick={() => performTraining(stat)}
                        disabled={isProcessingAction}
                        className={`border-2 rounded p-1 sm:p-2 text-left transition relative overflow-hidden ${
                          isProcessingAction
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                            : hasMaxFriendshipTypeMatch
                              ? 'border-amber-400 cursor-pointer'
                              : 'border-purple-500 hover:bg-purple-50 cursor-pointer'
                        }`}
                        style={hasMaxFriendshipTypeMatch ? {
                          background: 'linear-gradient(135deg, rgba(255,180,180,0.5) 0%, rgba(255,255,180,0.5) 20%, rgba(180,255,180,0.5) 40%, rgba(180,255,255,0.5) 60%, rgba(180,180,255,0.5) 80%, rgba(255,180,255,0.5) 100%)',
                          animation: 'rainbow-sheen 3s ease infinite',
                          backgroundSize: '200% 200%',
                          boxShadow: '0 0 10px rgba(255, 200, 100, 0.5)'
                        } : {}}
                      >
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <div className="font-bold text-[10px] sm:text-sm">{stat}</div>
                          <div
                            className="text-white text-[8px] sm:text-xs px-1 py-0.5 rounded font-bold"
                            style={{ backgroundColor: getLevelColor(trainingLevel) }}
                          >
                            Lv.{trainingLevel}
                          </div>
                        </div>
                        <div className="text-[9px] sm:text-xs mb-0.5 sm:mb-1">
                          <span className="text-gray-600">{currentStatValue}</span>
                          <span className="text-green-600 font-bold"> +{statGain}</span>
                        </div>
                        <div className="text-[9px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">
                          {energyCost > 0 ? `-${energyCost}` : `+${Math.abs(energyCost)}`}{energyRegenBonus > 0 ? <span className="text-green-600 font-bold">+{energyRegenBonus}</span> : ''} Energy
                        </div>
                        <div className="text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1" style={{ color: failChance === 0 ? '#16a34a' : failChance <= 25 ? '#eab308' : '#ef4444' }}>
                          Fail: {failChance}%
                        </div>
                        {/* Training progress bar */}
                        <div className="mb-0.5 sm:mb-1">
                          <div className="flex items-center justify-between text-[8px] sm:text-xs text-gray-500 mb-0.5">
                            <span>Progress</span>
                            <span>{trainingProgress}/4</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-1">
                            <div
                              className="h-1 rounded transition-all"
                              style={{
                                width: `${(trainingProgress / 4) * 100}%`,
                                backgroundColor: getLevelColor(trainingLevel)
                              }}
                            />
                          </div>
                        </div>
                        {option.supports && option.supports.length > 0 && (
                          <div className="space-y-0.5">
                            {option.supports.map(supportName => {
                              // Use stored friendship, or fall back to initial friendship from support card
                              const support = getSupportCardAttributes(supportName);
                              const initialFriendship = support?.initialFriendship || 0;
                              const friendship = careerData.supportFriendships?.[supportName] ?? initialFriendship;
                              const { image: trainerImage, config: faceConfig, trainerName } = getSupportImageWithConfig(supportName);
                              // Only show image if we found a valid trainer in our image mappings
                              const hasValidImage = trainerImage && !trainerImage.includes('default.png');
                              return (
                                <div key={supportName} className="bg-blue-100 text-blue-800 text-[8px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded flex items-center gap-1">
                                  {hasValidImage ? (
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-blue-300 overflow-hidden flex-shrink-0">
                                      <img
                                        src={trainerImage}
                                        alt={trainerName || supportName}
                                        className="w-full h-full object-cover"
                                        style={{
                                          transform: `scale(${faceConfig.scale}) translate(${faceConfig.offsetX}%, ${faceConfig.offsetY}%)`,
                                          transformOrigin: 'top center'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-blue-300 bg-blue-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-[8px] font-bold text-blue-600">{(support?.name || supportName).charAt(0)}</span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold truncate">{support?.name || supportName}</div>
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                      <div className="flex-1 bg-blue-200 rounded h-1 min-w-0">
                                        <div className="bg-blue-600 h-1 rounded" style={{ width: `${friendship}%` }} />
                                      </div>
                                      <span className="text-[8px] sm:text-xs">{friendship}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {option.hint && (
                          <div className="bg-yellow-200 text-yellow-800 text-[8px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded mt-0.5 sm:mt-1 truncate">
                            💡 {option.hint.move}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {careerData.turnLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-3 shadow-card"
                >
                  <h3 className="font-bold text-pocket-text text-sm mb-2">Last Turn Result</h3>
                  {(() => {
                    const entry = careerData.turnLog[0];
                    return (
                      <div
                        className={`p-2 rounded text-sm ${
                          entry.type === 'training_success' ? 'bg-green-50 border-l-4 border-green-500' :
                          entry.type === 'training_levelup' ? 'bg-purple-50 border-l-4 border-purple-500' :
                          entry.type === 'training_fail' ? 'bg-red-50 border-l-4 border-red-500' :
                          entry.type === 'battle_victory' || entry.type === 'gym_victory' ? 'bg-blue-50 border-l-4 border-blue-500' :
                          entry.type === 'battle_loss' ? 'bg-orange-50 border-l-4 border-orange-500' :
                          'bg-gray-50 border-l-4 border-gray-500'
                        }`}
                      >
                        <div className="font-bold text-xs text-gray-500 mb-1">Turn {entry.turn}</div>
                        <div className="text-gray-800">{entry.message}</div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </>
          )}

          {/* BATTLE VIEW */}
          {viewMode === 'battle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-3 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-pocket-text">Wild Battles</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-pocket-blue hover:underline">
                  Back to Training
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {careerData.availableBattles.map((opponent, idx) => (
                  <div key={idx} className="border-2 border-red-500 rounded-lg p-2 bg-red-50">
                    <div className="mb-2">
                      <div className="font-bold text-sm mb-1">{opponent.name}</div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <TypeBadge type={opponent.primaryType} size={12} />
                        <span>{opponent.strategy} ({opponent.strategyGrade})</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                      <div className="bg-white rounded p-1">
                        <div className="text-gray-500">HP</div>
                        <div className="font-bold">{opponent.stats.HP}</div>
                      </div>
                      <div className="bg-white rounded p-1">
                        <div className="text-gray-500">ATK</div>
                        <div className="font-bold">{opponent.stats.Attack}</div>
                      </div>
                      <div className="bg-white rounded p-1">
                        <div className="text-gray-500">DEF</div>
                        <div className="font-bold">{opponent.stats.Defense}</div>
                      </div>
                      <div className="bg-white rounded p-1">
                        <div className="text-gray-500">INS</div>
                        <div className="font-bold">{opponent.stats.Instinct}</div>
                      </div>
                      <div className="bg-white rounded p-1">
                        <div className="text-gray-500">SPE</div>
                        <div className="font-bold">{opponent.stats.Speed}</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="font-bold text-xs mb-1">Abilities:</div>
                      <div className="space-y-1">
                        {opponent.abilities.map(moveName => {
                          const move = MOVES[moveName];
                          return (
                            <div key={moveName} className="bg-white rounded p-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{moveName}</span>
                                <TypeBadge type={move.type} size={10} className="text-[10px]" />
                              </div>
                              <div className="text-gray-600">DMG: {move.damage}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => startBattle(opponent, false)}
                      disabled={careerData.energy <= 0}
                      className={`w-full rounded py-2 transition font-bold text-sm ${
                        careerData.energy <= 0
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {careerData.energy <= 0 ? 'Need Energy!' : 'Battle!'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* LOG VIEW */}
          {viewMode === 'log' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-3 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-pocket-text">Turn Log</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-pocket-blue hover:underline">
                  Back to Training
                </button>
              </div>
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {careerData.turnLog.length === 0 ? (
                  <p className="text-pocket-text-light text-sm text-center py-4">No actions yet. Start training!</p>
                ) : (
                  careerData.turnLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-sm ${
                        entry.type === 'training_success' ? 'bg-green-50 border-l-4 border-green-500' :
                        entry.type === 'training_fail' ? 'bg-red-50 border-l-4 border-red-500' :
                        entry.type === 'battle_victory' || entry.type === 'gym_victory' ? 'bg-blue-50 border-l-4 border-blue-500' :
                        entry.type === 'battle_loss' ? 'bg-orange-50 border-l-4 border-orange-500' :
                        'bg-pocket-bg border-l-4 border-gray-400'
                      }`}
                    >
                      <div className="font-bold text-xs text-pocket-text-light mb-1">Turn {entry.turn}</div>
                      <div className="text-pocket-text">{entry.message}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <EvolutionModal />
      <InspirationModal />
      <StrategySelector />
      <PokeclockModal />
      <HelpModal />

      {/* Abandon Career Confirmation Modal */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-pocket-text mb-2">Abandon Career?</h3>
              <p className="text-pocket-text-light text-sm">
                This will permanently end your current career with {careerData?.pokemon?.name || 'your Pokemon'}.
                All progress will be lost and cannot be recovered.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbandonConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-pocket-text transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const success = await abandonCareer();
                  if (success) {
                    setShowAbandonConfirm(false);
                    resetGameState();
                    setGameState('menu');
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition"
              >
                Abandon Career
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default CareerScreen;
