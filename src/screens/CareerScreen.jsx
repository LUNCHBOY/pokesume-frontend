/**
 * CareerScreen Component
 *
 * THE CORE GAMEPLAY LOOP - Where players train their Pokemon over 60 turns
 *
 * Features:
 * - Training system (5 stats with energy costs and fail chances)
 * - Energy/Rest system
 * - Random events (50 types) and Hangout events (30 types)
 * - Evolution system with modal
 * - Inspiration triggers at turns 11, 23, 35, 47, 59
 * - Gym battles at turns 12, 24, 36, 48, 60
 * - Ability learning system
 * - Multiple view modes (Training, Battle, Log, Abilities, Learn, Gym)
 * - 4 modal components (Evolution, Inspiration, Pokeclock, Help)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Book, Trophy, Zap, Clock } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useCareer } from '../contexts/CareerContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor,
  getPokemonGrade,
  getAptitudeColor,
  generateTrainerSprite,
  StatIcon
} from '../utils/gameUtils';
import {
  ICONS,
  GAME_CONFIG,
  MOVES,
  POKEMON,
  SUPPORT_CARDS,
  RANDOM_EVENTS,
  HANGOUT_EVENTS,
  EVOLUTION_CHAINS,
  EVOLUTION_CONFIG
} from '../shared/gameData';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if current turn triggers inspiration and apply bonuses
 */
const checkAndApplyInspiration = (turn, selectedInspirations, currentStats, currentAptitudes) => {
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

  const inspirationResults = selectedInspirations
    .filter(insp => insp && insp.inspirations)
    .map(trainedPokemon => {
      const statInsp = trainedPokemon.inspirations.stat;
      const aptInsp = trainedPokemon.inspirations.aptitude;

      const result = {
        pokemonName: trainedPokemon.name,
        statBonus: null,
        aptitudeUpgrade: null
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

      // Check for aptitude upgrade
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

      return result;
    });

  const finalResult = {
    turn,
    results: inspirationResults,
    updatedStats,
    updatedAptitudes
  };

  console.log('[checkAndApplyInspiration] Result:', finalResult);
  return finalResult;
};

/**
 * Get support card attributes with rarity-based defaults
 */
const getSupportCardAttributes = (supportKey) => {
  const card = SUPPORT_CARDS[supportKey];
  if (!card) return null;

  // Get rarity-based defaults
  const rarityDefaults = {
    'Legendary': {
      initialFriendship: 40,
      typeBonusTraining: 20,
      generalBonusTraining: 5,
      friendshipBonusTraining: 30,
      appearanceChance: 0.25,
      typeAppearancePriority: 3.0
    },
    'Rare': {
      initialFriendship: 30,
      typeBonusTraining: 15,
      generalBonusTraining: 4,
      friendshipBonusTraining: 25,
      appearanceChance: 0.35,
      typeAppearancePriority: 2.5
    },
    'Uncommon': {
      initialFriendship: 20,
      typeBonusTraining: 12,
      generalBonusTraining: 3,
      friendshipBonusTraining: 20,
      appearanceChance: 0.40,
      typeAppearancePriority: 2.0
    },
    'Common': {
      initialFriendship: 10,
      typeBonusTraining: 10,
      generalBonusTraining: 2,
      friendshipBonusTraining: 15,
      appearanceChance: 0.45,
      typeAppearancePriority: 1.5
    }
  };

  const defaults = rarityDefaults[card.rarity] || rarityDefaults['Common'];

  return {
    ...card,
    ...defaults,
    supportType: card.type || card.supportType
  };
};

const CareerScreen = () => {
  const {
    setGameState,
    selectedSupports,
    selectedInspirations,
    battleState,
    setBattleState
  } = useGame();

  const {
    careerData,
    setCareerData: setCareerDataLocal,
    updateCareer,
    processBattle
  } = useCareer();

  // Wrapper function that updates both local state and backend
  const setCareerData = (updaterFn) => {
    setCareerDataLocal(prev => {
      const newData = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
      // Async update to backend (fire and forget for now)
      if (newData) {
        updateCareer(newData).catch(err => console.error('Failed to sync career to backend:', err));
      }
      return newData;
    });
  };

  const [viewMode, setViewMode] = useState('training');
  const [showHelp, setShowHelp] = useState(false);
  const [evolutionModal, setEvolutionModal] = useState(null);
  const [inspirationModal, setInspirationModal] = useState(null);
  const [pokeclockModal] = useState(null);
  const lastProcessedTurnRef = useRef(null);

  // ============================================================================
  // HELPER FUNCTIONS (Component-specific)
  // ============================================================================

  /**
   * Generate training options with support assignments
   */
  const generateTrainingOptions = () => {
    const options = {};
    const stats = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];

    stats.forEach(stat => {
      options[stat] = {
        supports: [],
        hint: null
      };
    });

    selectedSupports.forEach(supportName => {
      const support = getSupportCardAttributes(supportName);
      if (!support) return;

      if (Math.random() < support.appearanceChance) {
        const supportType = support.type || support.supportType;
        const weights = stats.map(stat => stat === supportType ? support.typeAppearancePriority : 1);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const roll = Math.random() * totalWeight;
        let cumulative = 0;
        let selectedStat = stats[0];
        for (let i = 0; i < stats.length; i++) {
          cumulative += weights[i];
          if (roll < cumulative) {
            selectedStat = stats[i];
            break;
          }
        }

        const hasHint = Math.random() < 0.15;
        if (hasHint && support.moveHints && support.moveHints.length > 0) {
          const hint = support.moveHints[Math.floor(Math.random() * support.moveHints.length)];
          options[selectedStat].hint = { support: supportName, move: hint };
        }

        options[selectedStat].supports.push(supportName);
      }
    });

    return options;
  };

  /**
   * Check if Pokemon can evolve based on grade
   */
  const checkForEvolution = (pokemonName, currentStats) => {
    // Use basePokemonName from careerData to look up the evolution chain
    const baseName = careerData?.basePokemonName || pokemonName;
    const evolutionChain = EVOLUTION_CHAINS[baseName];
    if (!evolutionChain) return null;

    const currentGrade = getPokemonGrade(currentStats);
    const currentStage = careerData?.evolutionStage || 0;

    // Check for stage 1 evolution (at C grade)
    if (currentStage === 0 && evolutionChain.stage1 && ['C+', 'C', 'B+', 'B', 'A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
      return { toName: evolutionChain.stage1, toStage: 1 };
    }

    // Check for stage 2 evolution (at A grade)
    if (currentStage === 1 && evolutionChain.stage2 && ['A+', 'A', 'S+', 'S', 'UU+', 'UU'].includes(currentGrade)) {
      return { toName: evolutionChain.stage2, toStage: 2 };
    }

    return null;
  };

  /**
   * Apply evolution to Pokemon
   */
  const applyEvolution = (fromName, toName, toStage) => {
    console.log('=== applyEvolution START ===');
    console.log('fromName:', fromName, 'toName:', toName, 'toStage:', toStage);
    console.log('Current stats BEFORE evolution:', careerData.currentStats);

    // Determine stat boost based on evolution chain
    const baseName = careerData.basePokemonName || careerData.pokemon.name;
    const evolutionChain = EVOLUTION_CHAINS[baseName];
    const statBoost = evolutionChain && evolutionChain.stages === 2
      ? EVOLUTION_CONFIG.STAT_BOOST.TWO_STAGE  // 5% for two-stage evolutions
      : EVOLUTION_CONFIG.STAT_BOOST.ONE_STAGE; // 10% for one-stage evolutions

    console.log('Base Pokemon:', baseName);
    console.log('Evolution chain stages:', evolutionChain?.stages);
    console.log('Applying stat boost:', (statBoost * 100) + '%');

    const newStats = {};
    for (const [stat, value] of Object.entries(careerData.currentStats)) {
      newStats[stat] = Math.round(value * (1 + statBoost));
    }
    console.log('New stats AFTER boost:', newStats);

    // Get evolution data - if it doesn't exist, keep current Pokemon data but update name
    const evolutionData = POKEMON[toName];
    console.log('evolutionData exists?:', !!evolutionData);

    if (!evolutionData) {
      console.log('No evolution data found - using base Pokemon data with updated name');
      // Keep current Pokemon data but update the name
      const updatedPokemon = {
        ...careerData.pokemon,
        name: toName
      };

      console.log('Updated pokemon object:', updatedPokemon);
      console.log('Setting currentStats to:', newStats);

      setCareerData(prev => {
        const updated = {
          ...prev,
          pokemon: updatedPokemon,
          currentStats: newStats,
          evolutionStage: toStage,
          basePokemonName: prev.basePokemonName,
          turnLog: [{
            turn: prev.turn,
            type: 'evolution',
            message: `${fromName} evolved into ${toName}!`
          }, ...prev.turnLog]
        };
        console.log('New careerData after evolution:', updated);
        return updated;
      });

      setEvolutionModal(null);
      console.log('=== applyEvolution END ===');
      return;
    }

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

    setCareerData(prev => ({
      ...prev,
      pokemon: {
        ...evolutionData,
        learnableAbilities: newLearnableAbilities
      },
      currentStats: newStats,
      evolutionStage: toStage,
      basePokemonName: prev.basePokemonName, // Preserve the original base name
      turnLog: [{
        turn: prev.turn,
        type: 'evolution',
        message: `${fromName} evolved into ${toName}!${signatureMove ? ` Learned signature move: ${signatureMove}!` : ''}`
      }, ...prev.turnLog]
    }));

    setEvolutionModal(null);
  };

  /**
   * Perform training action
   */
  const performTraining = (stat) => {
    const energyCost = GAME_CONFIG.TRAINING.ENERGY_COSTS[stat];
    const currentEnergy = careerData.energy;

    // Calculate failure chance based on CURRENT energy (before deduction)
    let failureChance = 0;
    if (currentEnergy <= 75) {
      if (currentEnergy <= 0) {
        failureChance = 0.891; // Was 0.99
      } else if (currentEnergy <= 20) {
        failureChance = 0.891 - ((currentEnergy / 20) * 0.216);
      } else if (currentEnergy <= 30) {
        failureChance = 0.675 - (((currentEnergy - 20) / 10) * 0.225);
      } else if (currentEnergy <= 50) {
        failureChance = 0.45 - (((currentEnergy - 30) / 20) * 0.225);
      } else {
        failureChance = 0.225 - (((currentEnergy - 50) / 25) * 0.225);
      }
    }

    // Speed training has 50% lower fail rate than other trainings
    if (stat === 'Speed') {
      failureChance *= 0.5;
    }

    const trainingFailed = Math.random() < failureChance;

    if (trainingFailed) {
      // Speed training doesn't reduce stats on failure
      const statLoss = stat === 'Speed' ? 0 : GAME_CONFIG.TRAINING.STAT_LOSS_ON_FAILURE;

      const logEntry = {
        turn: careerData.turn,
        type: 'training_fail',
        stat,
        message: stat === 'Speed'
          ? `Training ${stat} failed! No stat loss.`
          : `Training ${stat} failed! Lost ${statLoss} ${stat}.`
      };

      setCareerData(prev => ({
        ...prev,
        currentStats: {
          ...prev.currentStats,
          [stat]: Math.max(1, prev.currentStats[stat] - statLoss)
        },
        energy: Math.max(0, prev.energy - energyCost),
        turn: prev.turn + 1,
        turnLog: [logEntry, ...prev.turnLog],
        currentTrainingOptions: null
      }));
      return;
    }

    // Training succeeded
    let statGain = GAME_CONFIG.TRAINING.BASE_STAT_GAINS[stat];
    const option = careerData.currentTrainingOptions[stat];
    const friendshipGains = {};

    option.supports.forEach(supportName => {
      const support = getSupportCardAttributes(supportName);
      if (!support) return;

      const friendship = careerData.supportFriendships[supportName];
      const isMaxFriendship = friendship >= 100;
      const supportType = support.type || support.supportType;

      if (supportType === stat) {
        statGain += isMaxFriendship ? support.friendshipBonusTraining : support.typeBonusTraining;
      } else {
        statGain += support.generalBonusTraining;
      }

      friendshipGains[supportName] = (friendshipGains[supportName] || 0) + GAME_CONFIG.TRAINING.FRIENDSHIP_GAIN;
    });

    const newMoveHints = { ...careerData.moveHints };
    const newLearnableAbilities = [...careerData.pokemon.learnableAbilities];
    if (option.hint) {
      const moveName = option.hint.move;
      newMoveHints[moveName] = (newMoveHints[moveName] || 0) + 1;
      if (!newLearnableAbilities.includes(moveName) && !careerData.knownAbilities.includes(moveName)) {
        newLearnableAbilities.push(moveName);
      }
    }

    const newFriendships = { ...careerData.supportFriendships };
    Object.keys(friendshipGains).forEach(support => {
      newFriendships[support] = Math.min(100, newFriendships[support] + friendshipGains[support]);
    });

    const logEntry = {
      turn: careerData.turn,
      type: 'training_success',
      stat,
      statGain,
      message: `Trained ${stat} successfully! Gained ${statGain} ${stat}.`
    };

    setCareerData(prev => {
      const nextTurn = prev.turn + 1;
      const newStats = {
        ...prev.currentStats,
        [stat]: prev.currentStats[stat] + statGain
      };

      // Check for inspiration event and apply before creating updatedData
      let finalStats = { ...newStats };
      let finalAptitudes = { ...prev.pokemon.typeAptitudes };
      const inspirationResult = checkAndApplyInspiration(nextTurn, selectedInspirations, newStats, prev.pokemon.typeAptitudes);
      if (inspirationResult && inspirationResult.results.length > 0) {
        // Use the updated stats and aptitudes from inspiration result
        finalStats = inspirationResult.updatedStats;
        finalAptitudes = inspirationResult.updatedAptitudes;

        setTimeout(() => {
          setInspirationModal(inspirationResult);
        }, 0);
      }

      const updatedData = {
        ...prev,
        currentStats: finalStats,
        energy: Math.max(0, prev.energy - energyCost),
        skillPoints: prev.skillPoints + GAME_CONFIG.TRAINING.SKILL_POINTS_GAIN,
        supportFriendships: newFriendships,
        moveHints: newMoveHints,
        pokemon: {
          ...prev.pokemon,
          learnableAbilities: newLearnableAbilities,
          typeAptitudes: finalAptitudes
        },
        turn: nextTurn,
        turnLog: [logEntry, ...prev.turnLog],
        currentTrainingOptions: null
      };

      // Check for evolution
      const evolutionCheck = checkForEvolution(updatedData.pokemon.name, updatedData.currentStats);
      if (evolutionCheck) {
        const oldStats = updatedData.currentStats;
        const statBoost = EVOLUTION_CHAINS[updatedData.basePokemonName || updatedData.pokemon.name]?.stages === 2
          ? EVOLUTION_CONFIG.STAT_BOOST.TWO_STAGE
          : EVOLUTION_CONFIG.STAT_BOOST.ONE_STAGE;
        const newStats = {};
        for (const [s, value] of Object.entries(oldStats)) {
          newStats[s] = Math.round(value * (1 + statBoost));
        }

        setTimeout(() => {
          setEvolutionModal({
            fromName: updatedData.pokemon.name,
            toName: evolutionCheck.toName,
            toStage: evolutionCheck.toStage,
            oldStats: oldStats,
            newStats: newStats
          });
        }, 0);
      }

      return updatedData;
    });
  };

  /**
   * Perform rest action to restore energy
   */
  const performRest = () => {
    const roll = Math.random();
    let energyGain = GAME_CONFIG.REST.ENERGY_GAINS[1];
    if (roll < GAME_CONFIG.REST.PROBMOVES[0]) energyGain = GAME_CONFIG.REST.ENERGY_GAINS[0];
    else if (roll > 1 - GAME_CONFIG.REST.PROBMOVES[2]) energyGain = GAME_CONFIG.REST.ENERGY_GAINS[2];

    const logEntry = {
      turn: careerData.turn,
      type: 'rest',
      energyGain,
      message: `Rested and recovered ${energyGain} energy.`
    };

    setCareerData(prev => {
      const nextTurn = prev.turn + 1;

      // Check for inspiration event and apply before creating updatedData
      let finalStats = { ...prev.currentStats };
      let finalAptitudes = { ...prev.pokemon.typeAptitudes };
      const inspirationResult = checkAndApplyInspiration(nextTurn, selectedInspirations, prev.currentStats, prev.pokemon.typeAptitudes);
      if (inspirationResult && inspirationResult.results.length > 0) {
        // Use the updated stats and aptitudes from inspiration result
        finalStats = inspirationResult.updatedStats;
        finalAptitudes = inspirationResult.updatedAptitudes;

        setTimeout(() => {
          setInspirationModal(inspirationResult);
        }, 0);
      }

      const updatedData = {
        ...prev,
        currentStats: finalStats,
        energy: Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, prev.energy + energyGain),
        pokemon: {
          ...prev.pokemon,
          typeAptitudes: finalAptitudes
        },
        turn: nextTurn,
        turnLog: [logEntry, ...prev.turnLog],
        currentTrainingOptions: null
      };

      return updatedData;
    });
  };

  /**
   * Resolve event outcome (stat changes, energy, friendship, etc.)
   */
  const resolveEvent = (outcome) => {
    const eventResult = outcome.effect || outcome; // Handle both full outcome object and just effect
    const newStats = { ...careerData.currentStats };
    let energyChange = 0;
    let skillPointsChange = 0;
    let friendshipChanges = {};
    let moveHintReceived = null;
    let flavorText = outcome.flavor || null;

    if (eventResult.stats) {
      Object.keys(eventResult.stats).forEach(stat => {
        newStats[stat] = Math.max(1, newStats[stat] + eventResult.stats[stat]);
      });
    }

    if (eventResult.energy) energyChange = eventResult.energy;
    if (eventResult.skillPoints) skillPointsChange = eventResult.skillPoints;
    if (eventResult.friendship && careerData.pendingEvent?.supportName) {
      friendshipChanges[careerData.pendingEvent.supportName] = eventResult.friendship;
    }
    if (eventResult.moveHint) {
      moveHintReceived = eventResult.moveHint;
    }

    const newMoveHints = { ...careerData.moveHints };
    const newLearnableAbilities = [...careerData.pokemon.learnableAbilities];
    if (moveHintReceived) {
      newMoveHints[moveHintReceived] = (newMoveHints[moveHintReceived] || 0) + 1;
      if (!newLearnableAbilities.includes(moveHintReceived) && !careerData.knownAbilities.includes(moveHintReceived)) {
        newLearnableAbilities.push(moveHintReceived);
      }
    }

    const newFriendships = { ...careerData.supportFriendships };
    Object.keys(friendshipChanges).forEach(support => {
      newFriendships[support] = Math.min(100, newFriendships[support] + friendshipChanges[support]);
    });

    const completedHangouts = (careerData.pendingEvent?.type === 'hangout' && careerData.pendingEvent?.supportName)
      ? [...careerData.completedHangouts, careerData.pendingEvent.supportName]
      : careerData.completedHangouts;

    // Show result screen for choice and hangout events
    const shouldShowResult = careerData.pendingEvent?.type === 'choice' || careerData.pendingEvent?.type === 'hangout';

    setCareerData(prev => ({
      ...prev,
      currentStats: newStats,
      energy: Math.max(0, Math.min(GAME_CONFIG.CAREER.MAX_ENERGY, prev.energy + energyChange)),
      skillPoints: prev.skillPoints + skillPointsChange,
      supportFriendships: newFriendships,
      moveHints: newMoveHints,
      pokemon: {
        ...prev.pokemon,
        learnableAbilities: newLearnableAbilities
      },
      completedHangouts,
      eventResult: shouldShowResult ? {
        stats: eventResult.stats || {},
        energy: energyChange,
        skillPoints: skillPointsChange,
        friendship: friendshipChanges,
        moveHint: moveHintReceived,
        flavor: flavorText
      } : null,
      pendingEvent: null,
      // Generate training options immediately for events that don't show result screens
      currentTrainingOptions: !shouldShowResult ? generateTrainingOptions() : prev.currentTrainingOptions
    }));
  };

  /**
   * Start battle with opponent
   */
  const startBattle = async (opponent, isGymLeader = false) => {
    // Prevent wild battles at 0 energy
    if (!isGymLeader && careerData.energy <= 0) {
      return; // Don't start battle
    }

    console.log('[startBattle] Processing server-side battle:', {
      opponent: opponent.name,
      isGymLeader
    });

    // Call server to process battle
    const battleResult = await processBattle(opponent, isGymLeader);

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
        currentHP: opponent.stats.HP,
        currentStamina: GAME_CONFIG.BATTLE.MAX_STAMINA,
        moveStates: {},
        isResting: false,
        statusEffects: []
      },
      tick: 0,
      log: battleResult.battleLog || [], // Use server's battle log
      isGymLeader,
      winner: battleResult.winner, // 'player' or 'opponent'
      rewards: battleResult.rewards, // { statGain, skillPoints, energyChange }
      serverResult: true // Flag to indicate this came from server
    });
    setGameState('battle');
  };

  /**
   * Generate random event or hangout event
   */
  const generateRandomEvent = () => {
    if (!careerData || !selectedSupports) return null;

    // Check for available hangout events
    const availableHangouts = selectedSupports.filter(supportName => {
      const friendship = careerData.supportFriendships[supportName];
      return friendship >= 80 && !careerData.completedHangouts.includes(supportName);
    });

    // If hangouts are available, 50% chance to pick a hangout event
    if (availableHangouts.length > 0 && Math.random() < 0.5) {
      const supportName = availableHangouts[Math.floor(Math.random() * availableHangouts.length)];
      const hangoutEvent = HANGOUT_EVENTS[supportName];
      if (hangoutEvent) {
        return {
          type: 'hangout',
          supportName,
          ...hangoutEvent
        };
      }
    }

    // Filter events: 70% chance to exclude negative events (30% reduction in incidence)
    const eventKeys = Object.keys(RANDOM_EVENTS);
    let filteredKeys = eventKeys;

    if (Math.random() < 0.7) {
      // Exclude negative events 70% of the time
      filteredKeys = eventKeys.filter(key => RANDOM_EVENTS[key].type !== 'negative');
    }

    // If we filtered out all events (shouldn't happen but safety check)
    if (filteredKeys.length === 0) {
      filteredKeys = eventKeys;
    }

    const randomKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
    const event = RANDOM_EVENTS[randomKey];

    return { ...event, key: randomKey };
  };

  /**
   * Learn a new move
   */
  const learnMove = (moveName) => {
    const move = MOVES[moveName];
    const hintsReceived = careerData.moveHints[moveName] || 0;
    const discount = Math.min(hintsReceived * GAME_CONFIG.MOVES.HINT_DISCOUNT, GAME_CONFIG.MOVES.MAX_HINT_DISCOUNT);
    const finalCost = Math.ceil(move.cost * (1 - discount));

    if (careerData.skillPoints >= finalCost && !careerData.knownAbilities.includes(moveName)) {
      setCareerData(prev => ({
        ...prev,
        knownAbilities: [...prev.knownAbilities, moveName],
        skillPoints: prev.skillPoints - finalCost
      }));
    }
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
    if (careerData && !careerData.currentTrainingOptions && !careerData.pendingEvent && !evolutionModal && !inspirationModal) {
      // Don't generate training on gym turns
      const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
      const isGymTurn = careerData.turn === nextGymTurn && careerData.currentGymIndex < 5;
      if (isGymTurn) return;

      // Check if we've already processed this turn
      const justExitedBattle = !battleState && lastProcessedTurnRef.current === careerData.turn;
      if (lastProcessedTurnRef.current === careerData.turn && !justExitedBattle) return;

      // Mark this turn as processed
      lastProcessedTurnRef.current = careerData.turn;

      // Check for random event first (only if not turn 1 and not gym turn)
      let eventToSet = null;
      if (careerData.turn > 1 && careerData.turn !== nextGymTurn && !justExitedBattle) {
        // 50% chance for an event
        if (Math.random() < 0.50) {
          eventToSet = generateRandomEvent();
        }
      }

      if (eventToSet) {
        setCareerData(prev => ({
          ...prev,
          pendingEvent: eventToSet
        }));
      } else {
        // Generate training options
        setCareerData(prev => ({
          ...prev,
          currentTrainingOptions: generateTrainingOptions()
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerData?.turn, careerData?.currentTrainingOptions, careerData?.pendingEvent, evolutionModal, inspirationModal, battleState]);

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
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-500 to-blue-500 rounded-lg p-8 max-w-md w-full shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Evolution!</h2>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="mb-2">
                {generatePokemonSprite(POKEMON[evolutionModal.fromName]?.primaryType || 'Normal', evolutionModal.fromName)}
              </div>
              <p className="text-white font-bold text-lg">{evolutionModal.fromName}</p>
              <span
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: getGradeColor(getPokemonGrade(evolutionModal.oldStats)) }}
              >
                {getPokemonGrade(evolutionModal.oldStats)}
              </span>
            </div>

            <div className="text-4xl text-yellow-300 animate-pulse">💡</div>

            <div className="text-center">
              <div className="mb-2">
                {generatePokemonSprite(POKEMON[evolutionModal.toName]?.primaryType || 'Normal', evolutionModal.toName)}
              </div>
              <p className="text-white font-bold text-lg">{evolutionModal.toName}</p>
              <span
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: getGradeColor(getPokemonGrade(evolutionModal.newStats)) }}
              >
                {getPokemonGrade(evolutionModal.newStats)}
              </span>
            </div>
          </div>

          <div className="bg-white bg-opacity-20 rounded p-4 mb-6 text-white text-sm">
            <p className="font-bold mb-2">Stats increased by 10%!</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.keys(evolutionModal.newStats).map(stat => {
                const oldVal = evolutionModal.oldStats[stat];
                const newVal = evolutionModal.newStats[stat];
                return (
                  <div key={stat} className="flex justify-between">
                    <span>{stat}:</span>
                    <span>{oldVal} → {newVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => applyEvolution(evolutionModal.fromName, evolutionModal.toName, evolutionModal.toStage)}
            className="w-full bg-yellow-400 text-purple-900 py-3 rounded-lg font-bold text-xl hover:bg-yellow-300 transition"
          >
            Evolve!
          </button>
        </div>
      </div>
    );
  };

  const InspirationModal = () => {
    console.log('[InspirationModal] Render, modal state:', inspirationModal);
    if (!inspirationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-500 to-pink-500 rounded-lg p-8 max-w-2xl w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">✨ Inspiration! ✨</h2>
          <p className="text-white text-center mb-6">Your trained Pokemon inspire you at Turn {inspirationModal.turn}!</p>

          <div className="space-y-4">
            {inspirationModal.results.map((result, idx) => (
              <div key={idx} className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="text-xl font-bold text-yellow-300 mb-3">{result.pokemonName}</h3>

                {result.statBonus && (
                  <div className="bg-green-500 bg-opacity-30 rounded p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">
                        {result.statBonus.stat} +{result.statBonus.amount}
                      </span>
                      <div className="flex gap-1">
                        {[...Array(result.statBonus.stars)].map((_, i) => (
                          <span key={i} className="text-yellow-300">⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.aptitudeUpgrade && (
                  <div className="bg-purple-500 bg-opacity-30 rounded p-3">
                    <div className="text-white font-bold mb-1">
                      {result.aptitudeUpgrade.type} Aptitude: {result.aptitudeUpgrade.from} → {result.aptitudeUpgrade.to}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white opacity-80">
                        {(result.aptitudeUpgrade.chance * 100).toFixed(0)}% chance
                      </span>
                      <div className="flex gap-1">
                        {[...Array(result.aptitudeUpgrade.stars)].map((_, i) => (
                          <span key={i} className="text-yellow-300">⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!result.statBonus && !result.aptitudeUpgrade && (
                  <div className="text-white opacity-70 text-sm italic">
                    No bonuses this time
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setInspirationModal(null);
              // Generate training options after closing modal
              if (careerData && !careerData.currentTrainingOptions) {
                setCareerData(prev => ({
                  ...prev,
                  currentTrainingOptions: generateTrainingOptions()
                }));
              }
            }}
            className="w-full mt-6 bg-yellow-400 text-purple-900 py-3 rounded-lg font-bold text-xl hover:bg-yellow-300 transition"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const PokeclockModal = () => {
    if (!pokeclockModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-blue-500 to-purple-500 rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-pulse">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-3xl font-bold text-white mb-4">Pokeclock Used!</h2>
          <p className="text-white text-lg">You get another chance!</p>
        </div>
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
        <div
          className="bg-white rounded-lg w-full sm:w-[500px] shadow-2xl"
          style={{
            height: 'calc(100vh - 2rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border-b p-4 flex justify-between items-center rounded-t-lg" style={{ flexShrink: 0 }}>
            <h2 className="text-xl font-bold text-purple-600">Game Guide</h2>
            <button onClick={() => setShowHelp(false)} className="text-2xl font-bold text-gray-600 hover:text-gray-800 px-2">{ICONS.CLOSE}</button>
          </div>

          <div
            className="p-6 space-y-6"
            style={{
              flex: 1,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Pokemon</h3>
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
                    <p><strong>Nuker:</strong> 40% faster warmup, 40% slower cooldown</p>
                    <p><strong>Balanced:</strong> 10% faster on both</p>
                    <p><strong>Scaler:</strong> 40% slower warmup, 40% faster cooldown</p>
                  </div>
                  <p className="text-sm ml-2 mt-1">Strategy aptitude grade affects stamina costs.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Battles</h3>
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
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Career</h3>
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
              <h3 className="text-lg sm:text-xl font-bold text-purple-600 mb-3 border-b pb-2">Gacha</h3>
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
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER MAIN SCREEN
  // ============================================================================

  // Show gym battle when turn matches the next gym's designated turn
  const nextGymTurn = (careerData.currentGymIndex + 1) * GAME_CONFIG.CAREER.GYM_LEADER_INTERVAL;
  const isGymTurn = careerData.turn === nextGymTurn && careerData.currentGymIndex < 5;
  const nextGymLeader = careerData.gymLeaders[careerData.currentGymIndex];

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-b from-purple-400 to-pink-500 p-2 sm:p-3">
        <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3">
          <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
            {/* Mobile: Stack everything vertically, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Pokemon Info */}
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
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
                  <div className="text-xs text-gray-600">
                    <span style={{ color: getTypeColor(careerData.pokemon.primaryType), fontWeight: 'bold' }}>
                      {careerData.pokemon.primaryType}
                    </span>
                  </div>
                  {/* Type Aptitudes - Show all 6 types */}
                  <div className="flex text-[10px] sm:text-xs mt-1 flex-wrap gap-x-2 gap-y-0.5">
                    <span>
                      <span style={{ color: getTypeColor('Fire'), fontWeight: 'bold' }}>Fir</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Red), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Red}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Water'), fontWeight: 'bold' }}>Wat</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Blue), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Blue}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Grass'), fontWeight: 'bold' }}>Gra</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Green), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Green}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Psychic'), fontWeight: 'bold' }}>Psy</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Purple), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Purple}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Electric'), fontWeight: 'bold' }}>Ele</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Yellow), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Yellow}</span>
                    </span>
                    <span>
                      <span style={{ color: getTypeColor('Fighting'), fontWeight: 'bold' }}>Fig</span>
                      <span style={{ color: getAptitudeColor(careerData.pokemon.typeAptitudes.Orange), fontWeight: 'bold' }}>:{careerData.pokemon.typeAptitudes.Orange}</span>
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
                  <div className="text-xs text-gray-600">Gym: {(careerData.currentGymIndex + 1) * 12}</div>
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
                    <span className="font-bold">{careerData.skillPoints}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('gym')}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-100 hover:bg-yellow-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <Trophy size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.currentGymIndex}/5</span>
                  </button>
                  <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 rounded text-xs sm:text-sm">
                    <Zap size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.energy}</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-pink-100 rounded text-xs sm:text-sm" title="Pokeclocks: Retry gym battles">
                    <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-bold">{careerData.pokeclocks || 0}</span>
                  </div>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded transition cursor-pointer text-xs sm:text-sm"
                  >
                    <span className="font-bold">?</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isGymTurn && (
            <div className="bg-red-600 text-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  {generateTrainerSprite(careerData.currentGymIndex + 1)}
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
            </div>
          )}

          {/* PENDING EVENT SCREEN */}
          {!isGymTurn && careerData.pendingEvent && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2 sm:p-4 shadow-lg mb-3 sm:mb-4">
              <div className="bg-white rounded-lg p-2 sm:p-4">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-purple-600">{careerData.pendingEvent.name}</h3>
                <p className="text-gray-700 mb-3 sm:mb-4">{careerData.pendingEvent.description}</p>

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
                      onClick={() => resolveEvent(careerData.pendingEvent.effect)}
                      className="w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-green-700 transition"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {careerData.pendingEvent.type === 'choice' && (
                  <div className="space-y-3">
                    {careerData.pendingEvent.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const roll = Math.random();
                          let cumulative = 0;
                          for (const outcome of choice.outcomes) {
                            cumulative += outcome.chance;
                            if (roll < cumulative) {
                              resolveEvent(outcome);
                              break;
                            }
                          }
                        }}
                        className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition text-left"
                      >
                        {choice.text}
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

                          // Apply same scaling as wild pokemon battles
                          const startMultiplier = 1.0 * 1.04;
                          const growthPerTurn = 0.03125 * 1.04 * 1.3 * 1.25;
                          const turnScaling = startMultiplier + (careerData.turn * growthPerTurn);

                          // Combine turn scaling with event difficulty
                          const mult = careerData.pendingEvent.difficulty * turnScaling;

                          const eventOpponent = {
                            name: 'Wandering Champion',
                            pokemon: eventPokemon.name,
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

                          startBattle(eventOpponent, false);
                        }}
                        className="bg-red-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        Accept Challenge
                      </button>
                      <button
                        onClick={() => {
                          // Decline the battle - clear event and generate training options
                          setCareerData(prev => ({
                            ...prev,
                            pendingEvent: null,
                            currentTrainingOptions: generateTrainingOptions()
                          }));
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
                      <div className="font-bold text-blue-700 mb-2 text-lg">Special Hangout with {SUPPORT_CARDS[careerData.pendingEvent.supportName]?.name || careerData.pendingEvent.supportName}!</div>
                      <div className="font-semibold text-gray-700 mb-1">{careerData.pendingEvent.name}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        {careerData.pendingEvent.description}
                      </div>
                    </div>
                    <button
                      onClick={() => resolveEvent({ effect: careerData.pendingEvent.effect, flavor: careerData.pendingEvent.flavor })}
                      className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                      Spend Time Together
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
                      onClick={() => resolveEvent(careerData.pendingEvent.effect)}
                      className="w-full bg-gray-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EVENT RESULT SCREEN */}
          {careerData.eventResult && (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-2 sm:p-4 shadow-lg mb-3 sm:mb-4">
              <div className="bg-white rounded-lg p-2 sm:p-4">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-green-600">Event Result</h3>

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
                        <div className="flex justify-center">
                          <div className="grid grid-cols-5 gap-2 text-sm max-w-md">
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
                  onClick={() => setCareerData(prev => ({
                    ...prev,
                    eventResult: null,
                    currentTrainingOptions: generateTrainingOptions()
                  }))}
                  className="w-full mt-4 bg-purple-600 text-white py-2 sm:py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODES */}
          {viewMode === 'abilities' && (
            <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-bold text-sm sm:text-base">Known Abilities</h3>
                <button onClick={() => setViewMode('training')} className="text-xs sm:text-sm text-purple-600 hover:underline">
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
                    <div key={moveName} className="border-2 bg-green-50 rounded p-1.5 sm:p-2" style={{ borderColor: getTypeColor(move.type) }}>
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <div className="font-bold text-xs sm:text-sm truncate pr-1">{moveName}</div>
                        <div className="text-[10px] sm:text-xs px-0.5 sm:px-1 rounded font-bold flex-shrink-0 text-white" style={{ backgroundColor: getTypeColor(move.type) }}>
                          {move.type}
                        </div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5">
                        <div>DMG: {move.damage}</div>
                        <div>Stam: {move.stamina} | WU: {move.warmup} | CD: {move.cooldown}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          setCareerData(prev => {
                            // Remove from known abilities
                            const newKnownAbilities = prev.knownAbilities.filter(m => m !== moveName);

                            // Add to learnable abilities if not already there
                            const newLearnableAbilities = [...prev.pokemon.learnableAbilities];
                            if (!newLearnableAbilities.includes(moveName)) {
                              newLearnableAbilities.push(moveName);
                            }

                            return {
                              ...prev,
                              knownAbilities: newKnownAbilities,
                              pokemon: {
                                ...prev.pokemon,
                                learnableAbilities: newLearnableAbilities
                              }
                            };
                          });
                        }}
                        className="w-full mt-1 bg-red-500 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 rounded hover:bg-red-600 cursor-pointer"
                      >
                        Forget
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'gym' && (
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Next Gym Leader</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-purple-600 hover:underline">
                  Back to Training
                </button>
              </div>
              {nextGymLeader && (
                <div className="border-2 border-yellow-500 rounded-lg p-3">
                  <div className="flex items-center gap-2 sm:p-4 mb-3">
                    {generateTrainerSprite(careerData.currentGymIndex + 1)}
                    <div>
                      <h4 className="text-lg font-bold">{nextGymLeader.name}</h4>
                      <p className="text-sm text-gray-600">
                        {nextGymLeader.pokemon} (
                        <span style={{ color: getTypeColor(nextGymLeader.type), fontWeight: 'bold' }}>
                          {nextGymLeader.type}
                        </span>
                        )
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Strategy: {nextGymLeader.strategy} ({nextGymLeader.strategyGrade})</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2 text-sm mb-3">
                    <div className="bg-gray-100 rounded p-2">
                      <div className="text-xs text-gray-500">HP</div>
                      <div className="font-bold">{nextGymLeader.stats.HP}</div>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <div className="text-xs text-gray-500">ATK</div>
                      <div className="font-bold">{nextGymLeader.stats.Attack}</div>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <div className="text-xs text-gray-500">DEF</div>
                      <div className="font-bold">{nextGymLeader.stats.Defense}</div>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <div className="text-xs text-gray-500">INS</div>
                      <div className="font-bold">{nextGymLeader.stats.Instinct}</div>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <div className="text-xs text-gray-500">SPE</div>
                      <div className="font-bold">{nextGymLeader.stats.Speed}</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="font-bold text-sm mb-2">Abilities:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {nextGymLeader.abilities.map(moveName => {
                        const move = MOVES[moveName];
                        return (
                          <div key={moveName} className="border rounded p-2 bg-gray-50">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold text-xs">{moveName}</div>
                              <div className="text-xs px-1 rounded font-bold" style={{ backgroundColor: getTypeColor(move.type) + '20', color: getTypeColor(move.type) }}>
                                {move.type}
                              </div>
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
            </div>
          )}

          {viewMode === 'learn' && (
            <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
                <h3 className="font-bold text-sm sm:text-base">Learn Abilities ({careerData.skillPoints} SP)</h3>
                <button onClick={() => setViewMode('training')} className="text-xs sm:text-sm text-purple-600 hover:underline self-start sm:self-auto">
                  Back
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                {careerData.pokemon.learnableAbilities
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
                      const hintsReceived = careerData.moveHints[moveName] || 0;
                      const discount = Math.min(hintsReceived * GAME_CONFIG.MOVES.HINT_DISCOUNT, GAME_CONFIG.MOVES.MAX_HINT_DISCOUNT);
                      const finalCost = Math.ceil(move.cost * (1 - discount));
                      const canAfford = careerData.skillPoints >= finalCost;

                      return (
                        <div key={moveName} className={`border-2 rounded p-1.5 sm:p-2 ${isKnown ? 'bg-green-50' : ''}`} style={{ borderColor: isKnown ? '#22c55e' : getTypeColor(move.type) }}>
                          <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                            <div className="font-bold text-xs sm:text-sm truncate pr-1">{moveName}</div>
                            <div className="text-[10px] sm:text-xs px-0.5 sm:px-1 rounded font-bold flex-shrink-0 text-white" style={{ backgroundColor: getTypeColor(move.type) }}>
                              {move.type}
                            </div>
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 mb-1 sm:mb-2">
                            <div>DMG: {move.damage}</div>
                            <div>Stam: {move.stamina} | WU: {move.warmup} | CD: {move.cooldown}</div>
                            {move.effect && (
                              <div className="text-purple-600 font-bold truncate">
                                {move.effect.type === 'burn' && `Burn ${Math.round(move.effect.chance * 100)}%`}
                                {move.effect.type === 'poison' && `Poison ${Math.round(move.effect.chance * 100)}%`}
                                {move.effect.type === 'paralyze' && `Paralyze ${Math.round(move.effect.chance * 100)}%`}
                                {move.effect.type === 'stun' && `Stun ${Math.round(move.effect.chance * 100)}%`}
                                {move.effect.type === 'soak' && `Soak ${Math.round(move.effect.chance * 100)}%`}
                                {move.effect.type === 'energize' && `Energize ${Math.round(move.effect.chance * 100)}%`}
                                {move.effect.type === 'exhaust' && `Self-Exhaust`}
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
            </div>
          )}

          {/* TRAINING VIEW */}
          {viewMode === 'training' && careerData.currentTrainingOptions && !careerData.pendingEvent && !careerData.eventResult && !isGymTurn && !inspirationModal && (
            <>
              <div className="bg-white rounded-lg p-2 sm:p-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm sm:text-base">Training</h3>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <button
                      onClick={performRest}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Rest
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
                  {Object.keys(careerData.currentTrainingOptions).map(stat => {
                    const option = careerData.currentTrainingOptions[stat];
                    const energyCost = GAME_CONFIG.TRAINING.ENERGY_COSTS[stat];

                    // Calculate fail chance based on CURRENT energy and stat type
                    const failChance = calculateFailChance(careerData.energy, stat);

                    let statGain = GAME_CONFIG.TRAINING.BASE_STAT_GAINS[stat];
                    option.supports.forEach(supportName => {
                      const support = getSupportCardAttributes(supportName);
                      if (!support) return;

                      const friendship = careerData.supportFriendships[supportName];
                      const isMaxFriendship = friendship >= 100;
                      const supportType = support.type || support.supportType;

                      if (supportType === stat) {
                        statGain += isMaxFriendship ? support.friendshipBonusTraining : support.typeBonusTraining;
                      } else {
                        statGain += support.generalBonusTraining;
                      }
                    });

                    const currentStatValue = careerData.currentStats[stat];

                    return (
                      <button
                        key={stat}
                        onClick={() => performTraining(stat)}
                        className="border-2 rounded p-1 sm:p-2 text-left transition border-purple-500 hover:bg-purple-50 cursor-pointer"
                      >
                        <div className="font-bold text-[10px] sm:text-sm mb-0.5 sm:mb-1">{stat}</div>
                        <div className="text-[9px] sm:text-xs mb-0.5 sm:mb-1">
                          <span className="text-gray-600">{currentStatValue}</span>
                          <span className="text-green-600 font-bold"> +{statGain}</span>
                        </div>
                        <div className="text-[9px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">
                          {energyCost > 0 ? `-${energyCost}` : `+${Math.abs(energyCost)}`} Energy
                        </div>
                        <div className="text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1" style={{ color: failChance === 0 ? '#16a34a' : failChance <= 25 ? '#eab308' : '#ef4444' }}>
                          Fail: {failChance}%
                        </div>
                        {option.supports.length > 0 && (
                          <div className="space-y-0.5">
                            {option.supports.map(supportName => {
                              const friendship = careerData.supportFriendships[supportName];
                              return (
                                <div key={supportName} className="bg-blue-100 text-blue-800 text-[8px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded">
                                  <div className="font-bold truncate">{supportName.split(' ')[0]}</div>
                                  <div className="flex items-center gap-0.5 sm:gap-1">
                                    <div className="flex-1 bg-blue-200 rounded h-1 min-w-0">
                                      <div className="bg-blue-600 h-1 rounded" style={{ width: `${friendship}%` }} />
                                    </div>
                                    <span className="text-[8px] sm:text-xs">{friendship}</span>
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
              </div>

              {careerData.turnLog.length > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  <h3 className="font-bold text-sm mb-2">Last Turn Result</h3>
                  {(() => {
                    const entry = careerData.turnLog[0];
                    return (
                      <div
                        className={`p-2 rounded text-sm ${
                          entry.type === 'training_success' ? 'bg-green-50 border-l-4 border-green-500' :
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
                </div>
              )}
            </>
          )}

          {/* BATTLE VIEW */}
          {viewMode === 'battle' && (
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Wild Battles</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-purple-600 hover:underline">
                  Back to Training
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {careerData.availableBattles.map((opponent, idx) => (
                  <div key={idx} className="border-2 border-red-500 rounded-lg p-2 bg-red-50">
                    <div className="mb-2">
                      <div className="font-bold text-sm mb-1">{opponent.name}</div>
                      <div className="text-xs text-gray-600">
                        <span style={{ color: getTypeColor(opponent.primaryType), fontWeight: 'bold' }}>
                          {opponent.primaryType}
                        </span>
                        {' | ' + opponent.strategy + ' (' + opponent.strategyGrade + ')'}
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
                                <span className="px-1 rounded text-xs" style={{ backgroundColor: getTypeColor(move.type) + '20', color: getTypeColor(move.type), fontWeight: 'bold' }}>
                                  {move.type}
                                </span>
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
            </div>
          )}

          {/* LOG VIEW */}
          {viewMode === 'log' && (
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Turn Log</h3>
                <button onClick={() => setViewMode('training')} className="text-sm text-purple-600 hover:underline">
                  Back to Training
                </button>
              </div>
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {careerData.turnLog.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No actions yet. Start training!</p>
                ) : (
                  careerData.turnLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${
                        entry.type === 'training_success' ? 'bg-green-50 border-l-4 border-green-500' :
                        entry.type === 'training_fail' ? 'bg-red-50 border-l-4 border-red-500' :
                        entry.type === 'battle_victory' || entry.type === 'gym_victory' ? 'bg-blue-50 border-l-4 border-blue-500' :
                        entry.type === 'battle_loss' ? 'bg-orange-50 border-l-4 border-orange-500' :
                        'bg-gray-50 border-l-4 border-gray-500'
                      }`}
                    >
                      <div className="font-bold text-xs text-gray-500 mb-1">Turn {entry.turn}</div>
                      <div className="text-gray-800">{entry.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <EvolutionModal />
      <InspirationModal />
      <PokeclockModal />
      <HelpModal />
    </>
  );
};

export default CareerScreen;
