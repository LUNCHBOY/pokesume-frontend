/**
 * BattleScreen Component
 *
 * Displays real-time battle animation between player Pokemon and opponent.
 * Shows HP bars, stamina, battle log, and playback speed controls.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useCareer } from '../contexts/CareerContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade,
  getEvolutionFormForGrade
} from '../utils/gameUtils';
import { TypeBadge } from '../components/TypeIcon';
import { ICONS } from '../shared/gameData';
import { getGymLeaderImage } from '../constants/trainerImages';
import { getGymLeaderBadge } from '../constants/badgeImages';
import BadgeModal from '../components/BadgeModal';

/**
 * Generate inspirations based on final Pokemon stats, aptitudes, and strategy aptitudes
 * Picks a RANDOM stat, RANDOM type aptitude, and RANDOM strategy aptitude
 * Determines stars based on value/grade with identical weighting for aptitudes and strategies
 */
const generateInspirations = (stats, aptitudes, strategyAptitudes = null, isVictory = false) => {
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

  // Pick a RANDOM stat (not highest)
  const statNames = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];
  const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
  const statValue = stats[randomStat];

  if (statValue === undefined) {
    return null;
  }

  // Determine stat stars based on stat value with % rolls
  let statStars = 1;
  const statRoll = Math.random();

  if (statValue < 300) {
    // Low stat: 90% 1-star, 10% 2-star
    statStars = statRoll < 0.90 ? 1 : 2;
  } else if (statValue <= 400) {
    // Medium stat: 50% 1-star, 45% 2-star, 5% 3-star
    if (statRoll < 0.50) statStars = 1;
    else if (statRoll < 0.95) statStars = 2;
    else statStars = 3;
  } else {
    // High stat (>400): 20% 1-star, 70% 2-star, 10% 3-star
    if (statRoll < 0.20) statStars = 1;
    else if (statRoll < 0.90) statStars = 2;
    else statStars = 3;
  }

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

/**
 * Calculate stat modifiers from status effects
 * Returns an object with buff/debuff info for each stat
 */
const getStatModifiers = (statusEffects = []) => {
  const modifiers = {
    Attack: { buff: 0, debuff: 0 },
    Defense: { buff: 0, debuff: 0 },
    Instinct: { buff: 0, debuff: 0 },
    Speed: { buff: 0, debuff: 0 }
  };

  statusEffects.forEach(effect => {
    if (effect.type === 'buff_attack' && effect.multiplier) {
      // Convert multiplier to percentage increase (e.g., 2.0 -> +100%)
      modifiers.Attack.buff += Math.round((effect.multiplier - 1) * 100);
    }
    if (effect.type === 'debuff_attack' && effect.multiplier) {
      // Convert multiplier to percentage decrease (e.g., 0.7 -> -30%)
      modifiers.Attack.debuff += Math.round((1 - effect.multiplier) * 100);
    }
    if (effect.type === 'buff_defense' && effect.multiplier) {
      modifiers.Defense.buff += Math.round((effect.multiplier - 1) * 100);
    }
    if (effect.type === 'debuff_defense' && effect.multiplier) {
      modifiers.Defense.debuff += Math.round((1 - effect.multiplier) * 100);
    }
    if (effect.type === 'buff_instinct' && effect.multiplier) {
      modifiers.Instinct.buff += Math.round((effect.multiplier - 1) * 100);
    }
    if (effect.type === 'debuff_instinct' && effect.multiplier) {
      modifiers.Instinct.debuff += Math.round((1 - effect.multiplier) * 100);
    }
    if (effect.type === 'buff_speed' && effect.multiplier) {
      modifiers.Speed.buff += Math.round((effect.multiplier - 1) * 100);
    }
    if (effect.type === 'debuff_speed' && effect.multiplier) {
      modifiers.Speed.debuff += Math.round((1 - effect.multiplier) * 100);
    }
  });

  return modifiers;
};

/**
 * StatDisplay component - shows stat value with buff/debuff indicators
 */
const StatDisplay = ({ label, value, modifier }) => {
  const hasBuff = modifier.buff > 0;
  const hasDebuff = modifier.debuff > 0;

  return (
    <span className="flex items-center gap-0.5">
      <span>{label} {value}</span>
      {hasBuff && (
        <span className="text-green-500 font-bold">+{modifier.buff}%</span>
      )}
      {hasDebuff && (
        <span className="text-red-500 font-bold">-{modifier.debuff}%</span>
      )}
    </span>
  );
};

const BattleScreen = () => {
  const { battleState, battleSpeed, setBattleSpeed, setGameState, setBattleState, setCareerHistory, setCompletedCareerData } = useGame();
  const { careerData, completeCareer, consumePokeclock } = useCareer();
  const { loadPrimos } = useInventory();
  const battleLogRef = useRef(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [showPokeclockModal, setShowPokeclockModal] = useState(false);
  const badgeShownRef = useRef(false);

  // Reset badge shown ref when battle state is cleared (new battle starting)
  useEffect(() => {
    if (!battleState) {
      badgeShownRef.current = false;
    }
  }, [battleState]);

  // Auto-scroll battle log to bottom when new messages appear
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleState?.displayLog?.length]);

  // Check if battle is over and show badge modal for gym leader victories
  useEffect(() => {
    if (!battleState) return;
    // Prevent showing badge modal multiple times
    if (badgeShownRef.current) return;

    const battleOver = battleState.player.currentHP <= 0 || battleState.opponent.currentHP <= 0;
    const playerWon = battleState.winner === 'player';
    const isGymLeader = battleState.isGymLeader;
    const badge = battleState.rewards?.badge;

    // Show badge modal if player won against gym leader and has a badge
    if (battleOver && playerWon && isGymLeader && badge && !showBadgeModal) {
      const badgeInfo = getGymLeaderBadge(badge.gymLeaderName);
      if (badgeInfo) {
        // Mark as shown immediately to prevent duplicate triggers
        badgeShownRef.current = true;
        setEarnedBadge({ ...badgeInfo, gymLeaderName: badge.gymLeaderName });
        // Refresh primos after gym leader victory (primos were awarded server-side)
        loadPrimos();
        // Small delay to let battle complete animation finish
        setTimeout(() => {
          setShowBadgeModal(true);
        }, 1500);
      }
    }
  }, [battleState?.player.currentHP, battleState?.opponent.currentHP, battleState, showBadgeModal, loadPrimos]);

  if (!battleState) {
    return null;
  }

  const getBattleDisplayName = (combatant) => {
    // Get the appropriate evolution form name based on grade
    const displayName = getEvolutionFormForGrade(combatant.name, combatant.stats);
    if (combatant.isGymLeader) {
      return `${displayName} (Gym Leader)`;
    }
    return displayName;
  };

  const handleContinue = async () => {
    const playerLost = battleState.winner === 'opponent';
    const playerWon = battleState.winner === 'player';
    const isGymLeader = battleState.isGymLeader;
    const isEliteFour = battleState.isEliteFour;
    const eliteFourIndex = battleState.eliteFourIndex;

    // If player lost to a gym leader or Elite Four, check pokeclocks
    if (playerLost && (isGymLeader || isEliteFour)) {
      const pokeclocks = careerData?.pokeclocks || 0;

      if (pokeclocks > 0) {
        // Use a pokeclock to retry the battle (server-authoritative)
        setShowPokeclockModal(true);

        // Call server to use pokeclock - this decrements pokeclocks and reverts turn
        const result = await consumePokeclock();

        // Hide modal after 2 seconds and return to career for gym retry
        setTimeout(() => {
          setShowPokeclockModal(false);
          setBattleState(null);
          setGameState('career');
        }, 2000);

        if (!result) {
          console.error('Failed to use pokeclock on server');
        }
        return;
      } else {
        // No pokeclocks remaining - career ends
        // Generate inspirations before completing career
        const inspirations = generateInspirations(
          careerData?.currentStats,
          careerData?.pokemon?.typeAptitudes,
          careerData?.pokemon?.strategyAptitudes,
          false // defeat
        );

        // Server handles saving the trained Pokemon when completeCareer is called
        const result = await completeCareer('defeated', inspirations);

        if (result && result.savedCareerData) {
          // Refresh primos balance after earning career completion reward
          loadPrimos();

          // Save completed career data for GameOver screen
          setCompletedCareerData({
            ...result.savedCareerData,
            trainedPokemon: result.trainedPokemon,
            inspirations: inspirations,
            victory: false,
            primosReward: result.primosReward || 0
          });

          // Add to career history
          const historyEntry = {
            pokemon: result.savedCareerData.pokemon.name,
            primaryType: result.savedCareerData.pokemon.primaryType,
            finalStats: result.savedCareerData.currentStats,
            knownAbilities: result.savedCareerData.knownAbilities,
            finalTurn: result.savedCareerData.turn,
            gymsDefeated: result.savedCareerData.currentGymIndex,
            victory: false,
            timestamp: new Date().toISOString()
          };

          setCareerHistory(prev => {
            const newHistory = [historyEntry, ...prev];
            localStorage.setItem('pokemonCareerHistory', JSON.stringify(newHistory));
            return newHistory;
          });

          setBattleState(null);
          setGameState('gameOver');
          return;
        } else {
          // completeCareer failed - fall back to using local career data or battleState
          const fallbackPokemon = careerData?.pokemon || {
            name: battleState.player?.name || 'Pokemon',
            primaryType: battleState.player?.type || 'Normal',
            typeAptitudes: {},
            strategyAptitudes: {}
          };
          const fallbackStats = careerData?.currentStats || battleState.player?.stats || {};

          setCompletedCareerData({
            pokemon: fallbackPokemon,
            currentStats: fallbackStats,
            turn: careerData?.turn,
            currentGymIndex: careerData?.currentGymIndex || 0,
            inspirations: inspirations,
            victory: false,
            primosReward: 0
          });
          setBattleState(null);
          setGameState('gameOver');
          return;
        }
      }
    }

    // Check for Elite Four victory - if player won the 4th Elite Four battle (index 3)
    if (playerWon && isEliteFour && eliteFourIndex === 3) {
      // Player has become Champion!
      // Generate inspirations before completing career
      const inspirations = generateInspirations(
        careerData?.currentStats,
        careerData?.pokemon?.typeAptitudes,
        careerData?.pokemon?.strategyAptitudes,
        true // victory
      );

      const result = await completeCareer('champion', inspirations);

      if (result && result.savedCareerData) {
        // Refresh primos balance after earning career completion reward
        loadPrimos();

        // Save completed career data for Victory screen
        setCompletedCareerData({
          ...result.savedCareerData,
          trainedPokemon: result.trainedPokemon,
          inspirations: inspirations,
          victory: true,
          primosReward: result.primosReward || 0
        });

        // Add to career history
        const historyEntry = {
          pokemon: result.savedCareerData.pokemon.name,
          primaryType: result.savedCareerData.pokemon.primaryType,
          finalStats: result.savedCareerData.currentStats,
          knownAbilities: result.savedCareerData.knownAbilities,
          finalTurn: result.savedCareerData.turn,
          gymsDefeated: 5, // All gyms defeated
          victory: true,
          timestamp: new Date().toISOString()
        };

        setCareerHistory(prev => {
          const newHistory = [historyEntry, ...prev];
          localStorage.setItem('pokemonCareerHistory', JSON.stringify(newHistory));
          return newHistory;
        });

        setBattleState(null);
        setGameState('victory');
        return;
      } else {
        // completeCareer failed - this is a serious issue, career is still active!
        console.error('[BattleScreen] completeCareer FAILED! Career may still be active.');
        // Don't show victory screen - go back to career and let the user try again
        // or show an error message
        alert('Failed to complete career. Please try again.');
        setBattleState(null);
        setGameState('career');
        return;
      }
    }

    // Normal case - player won or wasn't a gym battle, return to career
    setBattleState(null);
    setGameState('career');
  };

  const playerPct = (battleState.player.currentHP / battleState.player.stats.HP) * 100;
  const opponentPct = (battleState.opponent.currentHP / battleState.opponent.stats.HP) * 100;
  const battleOver = battleState.player.currentHP <= 0 || battleState.opponent.currentHP <= 0;

  // Get HP bar color based on percentage
  const getHpColor = (pct) => {
    if (pct > 50) return 'bg-pocket-green'; // Green when healthy
    if (pct > 25) return 'bg-yellow-500';   // Yellow when damaged
    return 'bg-red-600';                     // Red when critical
  };

  return (
    <div className={`min-h-screen bg-pocket-bg p-2 sm:p-4 ${battleOver ? 'pb-24' : ''}`}>
      <div className="max-w-4xl mx-auto">
        {/* Battle Arena Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card-lg overflow-hidden mb-4"
        >
          {/* Battle Header */}
          <div className="bg-gradient-to-r from-pocket-red to-red-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Zap size={18} />
              <span className="font-bold">Battle Arena</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/80" />
              <span className="text-white font-bold">Tick {battleState.tick}</span>
            </div>
          </div>

          {/* Combatants */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-8 relative">
              {/* Player Side */}
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={battleState.player.currentHP <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}
                    className="inline-block"
                  >
                    {generatePokemonSprite(battleState.player.primaryType, battleState.player.name)}
                  </motion.div>
                </div>

                <div className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-pocket-text text-sm">{battleState.player.name}</h3>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: getGradeColor(getPokemonGrade(battleState.player.stats)) }}
                      >
                        {getPokemonGrade(battleState.player.stats)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {battleState.player.strategy && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-600 text-white">
                          {battleState.player.strategy}
                        </span>
                      )}
                      <TypeBadge type={battleState.player.primaryType} size={14} />
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>HP</span>
                      <span className="font-semibold">{battleState.player.currentHP}/{battleState.player.stats.HP}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getHpColor(playerPct)}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${playerPct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span className="flex items-center gap-1">
                        Stamina
                        {battleState.player.isResting && <span className="text-blue-500">{ICONS.SLEEPING}</span>}
                      </span>
                      <span>{battleState.player.currentStamina}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${battleState.player.currentStamina}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  {(() => {
                    const modifiers = getStatModifiers(battleState.player.statusEffects);
                    return (
                      <div className="flex justify-between mt-3 text-[10px] text-pocket-text-light">
                        <StatDisplay label="ATK" value={battleState.player.stats.Attack} modifier={modifiers.Attack} />
                        <StatDisplay label="DEF" value={battleState.player.stats.Defense} modifier={modifiers.Defense} />
                        <StatDisplay label="INS" value={battleState.player.stats.Instinct} modifier={modifiers.Instinct} />
                        <StatDisplay label="SPE" value={battleState.player.stats.Speed} modifier={modifiers.Speed} />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* VS Divider - centered between the two sides */}
              <div className="absolute left-1/2 top-12 -translate-x-1/2 z-10 hidden sm:block">
                <div className="w-10 h-10 rounded-full bg-pocket-red flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  VS
                </div>
              </div>

              {/* Opponent Side */}
              <div className="space-y-4">
                {battleState.opponent.isGymLeader && (
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <img
                        src={getGymLeaderImage(battleState.opponent.name)}
                        alt={`${battleState.opponent.name} - Gym Leader`}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl border-3 border-yellow-400 bg-white shadow-card"
                      />
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full text-[10px] font-bold shadow whitespace-nowrap">
                        Gym Leader
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <motion.div
                    animate={battleState.opponent.currentHP <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}
                    className="inline-block"
                  >
                    {generatePokemonSprite(
                      battleState.opponent.primaryType,
                      getEvolutionFormForGrade(battleState.opponent.name, battleState.opponent.stats)
                    )}
                  </motion.div>
                </div>

                <div className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-pocket-text text-sm">{getBattleDisplayName(battleState.opponent)}</h3>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: getGradeColor(getPokemonGrade(battleState.opponent.stats)) }}
                      >
                        {getPokemonGrade(battleState.opponent.stats)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {battleState.opponent.strategy && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-600 text-white">
                          {battleState.opponent.strategy}
                        </span>
                      )}
                      <TypeBadge type={battleState.opponent.primaryType} size={14} />
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>HP</span>
                      <span className="font-semibold">{battleState.opponent.currentHP}/{battleState.opponent.stats.HP}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getHpColor(opponentPct)}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${opponentPct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span className="flex items-center gap-1">
                        Stamina
                        {battleState.opponent.isResting && <span className="text-blue-500">{ICONS.SLEEPING}</span>}
                      </span>
                      <span>{battleState.opponent.currentStamina}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${battleState.opponent.currentStamina}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  {(() => {
                    const modifiers = getStatModifiers(battleState.opponent.statusEffects);
                    return (
                      <div className="flex justify-between mt-3 text-[10px] text-pocket-text-light">
                        <StatDisplay label="ATK" value={battleState.opponent.stats.Attack} modifier={modifiers.Attack} />
                        <StatDisplay label="DEF" value={battleState.opponent.stats.Defense} modifier={modifiers.Defense} />
                        <StatDisplay label="INS" value={battleState.opponent.stats.Instinct} modifier={modifiers.Instinct} />
                        <StatDisplay label="SPE" value={battleState.opponent.stats.Speed} modifier={modifiers.Speed} />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Speed Controls */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-pocket-bg">
            <div className="flex items-center gap-2 text-pocket-text-light text-sm">
              <span>Speed:</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setBattleSpeed(speed)}
                  className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all ${
                    battleSpeed === speed
                      ? 'bg-pocket-red text-white shadow-pill'
                      : 'bg-white text-pocket-text-light hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            {battleOver && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-pocket-green font-bold text-sm"
              >
                Battle Complete!
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Battle Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white rounded-2xl shadow-card overflow-hidden ${battleOver ? 'mb-20' : ''}`}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-pocket-text">Battle Log</h3>
          </div>
          <div
            ref={battleLogRef}
            className="p-4 space-y-1 overflow-y-auto pocket-scrollbar"
            style={{ maxHeight: battleOver ? 'calc(100vh - 550px)' : '300px', minHeight: '200px' }}
          >
            {(battleState.displayLog || []).map((entry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`py-1.5 px-2 rounded ${
                  entry.type === 'crit' ? 'text-lg font-black text-red-600 bg-red-50' :
                  entry.type === 'hit' ? 'text-sm text-red-600 font-semibold' :
                  entry.type === 'miss' ? 'text-sm text-blue-600' :
                  entry.type === 'victory' ? 'text-sm font-bold text-green-600 bg-green-50' :
                  entry.type === 'defeat' ? 'text-sm font-bold text-orange-600 bg-orange-50' :
                  'text-sm text-pocket-text-light'
                }`}
              >
                {entry.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Continue Button - Fixed at bottom on mobile when battle is over */}
      {battleOver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-pocket-bg via-pocket-bg to-transparent z-40"
        >
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleContinue}
              className="w-full pocket-btn-primary py-4 text-lg shadow-lg"
            >
              {battleState.winner === 'player' ? 'Continue ▶' : (
                (battleState.isGymLeader || battleState.isEliteFour) && (careerData?.pokeclocks || 0) > 0
                  ? `Use Pokeclock ⏰ (${careerData?.pokeclocks} left)`
                  : 'Continue'
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Badge Modal for Gym Leader Victories */}
      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        badge={earnedBadge}
        gymLeaderName={earnedBadge?.gymLeaderName}
        primosReward={battleState?.rewards?.primosReward || 0}
      />

      {/* Pokeclock Modal for Gym Battle Retries */}
      {showPokeclockModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-card-lg text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-4xl">⏰</span>
            </div>
            <h2 className="text-2xl font-bold text-pocket-text mb-2">Pokeclock Used!</h2>
            <p className="text-pocket-text-light mb-4">You get another chance!</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pocket-bg rounded-full">
              <span className="text-pocket-text-light text-sm">
                {(careerData?.pokeclocks || 0)} Pokeclock{(careerData?.pokeclocks || 0) !== 1 ? 's' : ''} remaining
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BattleScreen;

