/**
 * TournamentReplayScreen Component
 *
 * Displays tournament match battle replays sequentially using BattleScreen-style UI.
 * Flow:
 * 1. Watch Battle 1 replay
 * 2. Watch Battle 2 replay
 * 3. Watch Battle 3 replay
 * 4. Show final match result
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Swords, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { TypeBadge } from '../components/TypeIcon';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade
} from '../utils/gameUtils';
import ProfileIcon from '../components/ProfileIcon';

const TournamentReplayScreen = () => {
  const { setGameState, selectedReplay, setSelectedReplay } = useGame();

  // Helper to safely parse battle_results (can be string or object from DB)
  const parseBattleResults = (battle_results) => {
    if (!battle_results) return null;
    if (typeof battle_results === 'object') return battle_results;
    try {
      return JSON.parse(battle_results);
    } catch (e) {
      console.error('Failed to parse battle_results:', e);
      return null;
    }
  };

  const battleResults = parseBattleResults(selectedReplay?.battle_results);

  // Battle replay state
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [battleTick, setBattleTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [battleComplete, setBattleComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const playbackRef = useRef(null);
  const battleLogRef = useRef(null);

  // Handle both old single-battle format and new 3v3 format
  const is3v3Format = battleResults?.battles && Array.isArray(battleResults.battles);
  const battles = is3v3Format ? battleResults.battles : [battleResults];
  const currentBattle = battles[currentBattleIndex];
  const battleLog = currentBattle?.battleLog || [];

  // Auto-start playback on mount
  useEffect(() => {
    if (battleResults) {
      setTimeout(() => setIsPlaying(true), 500);
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [battleResults]);

  // Auto-scroll battle log
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleTick]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && battleLog.length > 0 && !battleComplete) {
      playbackRef.current = setInterval(() => {
        setBattleTick(prev => {
          if (prev >= battleLog.length - 1) {
            setIsPlaying(false);
            setBattleComplete(true);
            return prev;
          }
          return prev + 1;
        });
      }, 400 / battleSpeed);
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, battleSpeed, battleLog.length, battleComplete]);

  const handleNextBattle = () => {
    const totalBattles = battles.length;
    if (currentBattleIndex < totalBattles - 1) {
      // Move to next battle
      setCurrentBattleIndex(prev => prev + 1);
      setBattleTick(0);
      setBattleComplete(false);
      setIsPlaying(true);
    } else {
      // All battles watched, show result
      setShowResult(true);
    }
  };

  const handleBack = () => {
    setSelectedReplay(null);
    setGameState('tournamentBracket');
  };

  const getCurrentState = () => {
    if (!battleLog.length) return null;
    return battleLog[Math.min(battleTick, battleLog.length - 1)];
  };

  const state = getCurrentState();

  // Get HP bar color based on percentage
  const getHpColor = (pct) => {
    if (pct > 50) return 'bg-pocket-green';
    if (pct > 25) return 'bg-yellow-500';
    return 'bg-red-600';
  };

  // Build display log from battle log up to current tick
  const getDisplayLog = () => {
    if (!battleLog.length) return [];
    const entries = [];
    for (let i = 0; i <= Math.min(battleTick, battleLog.length - 1); i++) {
      const tick = battleLog[i];
      if (tick.message) {
        let type = 'normal';
        const msg = tick.message.toLowerCase();
        if (msg.includes('critical')) type = 'crit';
        else if (msg.includes('damage') || msg.includes('hits')) type = 'hit';
        else if (msg.includes('miss') || msg.includes('dodges')) type = 'miss';
        else if (msg.includes('wins') || msg.includes('victory')) type = 'victory';
        else if (msg.includes('fainted') || msg.includes('defeated')) type = 'defeat';

        entries.push({ text: tick.message, type });
      }
    }
    return entries;
  };

  const displayLog = getDisplayLog();

  // No battle data available
  if (!battleResults || (!battleResults.battleLog && !is3v3Format)) {
    return (
      <div className="min-h-screen bg-pocket-bg p-4">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-lg mx-auto"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-pocket-text">Battle Replay</span>
            <div className="w-10" />
          </div>
        </motion.header>

        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <Swords size={48} className="mx-auto mb-4 text-pocket-text-light" />
            <p className="text-pocket-text mb-4">Battle data not available</p>
            <button onClick={handleBack} className="pocket-btn-purple px-6 py-2">
              Back to Bracket
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Final result screen
  if (showResult) {
    const player1Wins = battleResults.player1Wins || 0;
    const player2Wins = battleResults.player2Wins || 0;
    const player1Won = player1Wins > player2Wins;

    return (
      <div className="min-h-screen bg-pocket-bg p-4">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <span className="font-bold text-pocket-text">Match Result</span>
            </div>
            <div className="w-10" />
          </div>
        </motion.header>

        <div className="max-w-4xl mx-auto space-y-4">
          {/* Result Summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-400 rounded-2xl shadow-card p-6"
          >
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-3 rounded-full bg-amber-200 flex items-center justify-center"
              >
                <Trophy size={40} className="text-amber-600" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-amber-700 mb-1"
              >
                Match Complete!
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <ProfileIcon
                    icon={selectedReplay?.player1_profile_icon || 'pikachu'}
                    size={24}
                    showBorder={true}
                  />
                  <span className={`font-bold ${player1Won ? 'text-amber-700' : 'text-pocket-text-light'}`}>
                    {selectedReplay?.player1_username || 'Player 1'}
                  </span>
                </div>
                <span className="text-pocket-text-light">vs</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${!player1Won ? 'text-amber-700' : 'text-pocket-text-light'}`}>
                    {selectedReplay?.player2_username || 'Player 2'}
                  </span>
                  <ProfileIcon
                    icon={selectedReplay?.player2_profile_icon || 'pikachu'}
                    size={24}
                    showBorder={true}
                  />
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-pocket-text-light mb-1">Final Score</div>
                <div className="text-3xl font-bold text-pocket-text">
                  {player1Wins} - {player2Wins}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-pocket-text-light mb-1">Winner</div>
                <div className="flex items-center justify-center gap-2">
                  <Trophy size={20} className="text-amber-500" />
                  <span className="text-lg font-bold text-amber-600">
                    {selectedReplay?.winner_username || (player1Won ? selectedReplay?.player1_username : selectedReplay?.player2_username) || 'Winner'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Battle Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-card p-4"
          >
            <h3 className="font-bold text-pocket-text mb-3">Battle Results</h3>
            <div className="grid grid-cols-3 gap-3">
              {battles.map((battle, index) => {
                const battleWinner = battle.winner;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl text-center ${
                      battleWinner === 1 ? 'bg-blue-100' : 'bg-red-100'
                    }`}
                  >
                    <div className={`text-lg font-bold ${battleWinner === 1 ? 'text-blue-700' : 'text-red-700'}`}>
                      Battle {index + 1}
                    </div>
                    <div className={`text-sm ${battleWinner === 1 ? 'text-blue-600' : 'text-red-600'}`}>
                      {battleWinner === 1 ? selectedReplay?.player1_username || 'P1' : selectedReplay?.player2_username || 'P2'} Won
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={handleBack}
              className="w-full py-4 bg-type-psychic text-white rounded-xl font-bold text-lg hover:bg-purple-600 transition-colors"
            >
              Back to Bracket
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Battle replay screen (using BattleScreen style)
  // Handle both new format (pokemon1 object) and old format (pokemon1Name string)
  const pokemon1 = currentBattle?.pokemon1 || (currentBattle?.pokemon1Name ? { name: currentBattle.pokemon1Name } : null);
  const pokemon2 = currentBattle?.pokemon2 || (currentBattle?.pokemon2Name ? { name: currentBattle.pokemon2Name } : null);

  // Get HP from current state
  const player1Hp = state?.player1;
  const player2Hp = state?.player2;

  const player1Pct = player1Hp ? (player1Hp.currentHp / player1Hp.maxHp) * 100 : 100;
  const player2Pct = player2Hp ? (player2Hp.currentHp / player2Hp.maxHp) * 100 : 100;

  const battleWon = currentBattle?.winner === 1;

  return (
    <div className="min-h-screen bg-pocket-bg p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white shadow-card rounded-2xl mb-4"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-type-psychic" />
              <span className="font-bold text-pocket-text">
                Battle {currentBattleIndex + 1} of {battles.length}
              </span>
            </div>
            <div className="w-10" />
          </div>
        </motion.header>

        {/* Battle Arena Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card-lg overflow-hidden mb-4"
        >
          {/* Battle Header */}
          <div className="bg-gradient-to-r from-type-psychic to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Zap size={18} />
              <span className="font-bold">Tournament Battle Replay</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/80" />
              <span className="text-white font-bold">Tick {battleTick + 1}</span>
            </div>
          </div>

          {/* Combatants */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-8 relative">
              {/* Player 1 Pokemon */}
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={player1Hp?.currentHp <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}
                    className="inline-block"
                  >
                    {pokemon1 && generatePokemonSprite(pokemon1.primaryType || pokemon1.type, pokemon1.name)}
                  </motion.div>
                </div>

                <div className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-pocket-text text-sm">{pokemon1?.name || 'Pokemon 1'}</h3>
                      {pokemon1?.stats && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon1.stats)) }}
                        >
                          {getPokemonGrade(pokemon1.stats)}
                        </span>
                      )}
                    </div>
                    {pokemon1 && <TypeBadge type={pokemon1.primaryType || pokemon1.type} size={14} />}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold mb-2">
                    ({selectedReplay?.player1_username || 'Player 1'})
                  </div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>HP</span>
                      <span className="font-semibold">{player1Hp?.currentHp || 0}/{player1Hp?.maxHp || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getHpColor(player1Pct)}`}
                        animate={{ width: `${player1Pct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>Stamina</span>
                      <span>{player1Hp?.currentStamina ?? player1Hp?.energy ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${player1Hp?.currentStamina ?? player1Hp?.energy ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  {pokemon1?.stats && (
                    <div className="flex justify-between mt-3 text-[10px] text-pocket-text-light">
                      <span>ATK {pokemon1.stats.Attack}</span>
                      <span>DEF {pokemon1.stats.Defense}</span>
                      <span>INS {pokemon1.stats.Instinct}</span>
                      <span>SPE {pokemon1.stats.Speed}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* VS Divider */}
              <div className="absolute left-1/2 top-12 -translate-x-1/2 z-10 hidden sm:block">
                <div className="w-10 h-10 rounded-full bg-type-psychic flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  VS
                </div>
              </div>

              {/* Player 2 Pokemon */}
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={player2Hp?.currentHp <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}
                    className="inline-block"
                  >
                    {pokemon2 && generatePokemonSprite(pokemon2.primaryType || pokemon2.type, pokemon2.name)}
                  </motion.div>
                </div>

                <div className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-pocket-text text-sm">{pokemon2?.name || 'Pokemon 2'}</h3>
                      {pokemon2?.stats && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon2.stats)) }}
                        >
                          {getPokemonGrade(pokemon2.stats)}
                        </span>
                      )}
                    </div>
                    {pokemon2 && <TypeBadge type={pokemon2.primaryType || pokemon2.type} size={14} />}
                  </div>
                  <div className="text-[10px] text-red-600 font-semibold mb-2">
                    ({selectedReplay?.player2_username || 'Player 2'})
                  </div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>HP</span>
                      <span className="font-semibold">{player2Hp?.currentHp || 0}/{player2Hp?.maxHp || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getHpColor(player2Pct)}`}
                        animate={{ width: `${player2Pct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>Stamina</span>
                      <span>{player2Hp?.currentStamina ?? player2Hp?.energy ?? 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${player2Hp?.currentStamina ?? player2Hp?.energy ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  {pokemon2?.stats && (
                    <div className="flex justify-between mt-3 text-[10px] text-pocket-text-light">
                      <span>ATK {pokemon2.stats.Attack}</span>
                      <span>DEF {pokemon2.stats.Defense}</span>
                      <span>INS {pokemon2.stats.Instinct}</span>
                      <span>SPE {pokemon2.stats.Speed}</span>
                    </div>
                  )}
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
                      ? 'bg-type-psychic text-white shadow-pill'
                      : 'bg-white text-pocket-text-light hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
            {battleComplete && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`font-bold text-sm ${battleWon ? 'text-blue-600' : 'text-red-600'}`}
              >
                {selectedReplay?.player1_username || 'P1'} {battleWon ? 'Wins!' : 'Loses'}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Battle Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-pocket-text">Battle Log</h3>
          </div>
          <div
            ref={battleLogRef}
            className="p-4 space-y-1 overflow-y-auto pocket-scrollbar"
            style={{ maxHeight: '200px' }}
          >
            {displayLog.map((entry, idx) => (
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
            {displayLog.length === 0 && (
              <div className="text-sm text-pocket-text-light text-center py-4">
                Battle starting...
              </div>
            )}
          </div>
        </motion.div>

        {/* Continue Button - Only shows when battle is complete */}
        {battleComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <button
              onClick={handleNextBattle}
              className="w-full pocket-btn-primary py-4 text-lg"
            >
              {currentBattleIndex < battles.length - 1 ? `Continue to Battle ${currentBattleIndex + 2}` : 'View Match Result'}
            </button>
          </motion.div>
        )}

        {/* Battle Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex justify-center gap-2"
        >
          {battles.map((battle, idx) => {
            const won = battle?.winner === 1;
            const isActive = idx === currentBattleIndex;
            const isCompleted = idx < currentBattleIndex || (idx === currentBattleIndex && battleComplete);

            return (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${
                  isActive ? 'w-6' : ''
                } ${
                  isCompleted
                    ? won ? 'bg-blue-500' : 'bg-red-500'
                    : isActive ? 'bg-type-psychic' : 'bg-gray-300'
                }`}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default TournamentReplayScreen;
