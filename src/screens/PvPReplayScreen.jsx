/**
 * PvPReplayScreen Component
 *
 * Displays PvP match battle replays sequentially using BattleScreen-style UI.
 * Flow:
 * 1. Watch Battle 1 replay
 * 2. Watch Battle 2 replay
 * 3. Watch Battle 3 replay
 * 4. Show final match result
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Swords, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { apiGetPvPMatch } from '../services/apiService';
import { TypeBadge } from '../components/TypeIcon';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade
} from '../utils/gameUtils';

const PvPReplayScreen = () => {
  const { setGameState, pvpMatchId, pvpMatchData } = useGame();
  const { authToken, user } = useAuth();

  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Battle replay state
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [battleTick, setBattleTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [battleComplete, setBattleComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const playbackRef = useRef(null);
  const battleLogRef = useRef(null);

  useEffect(() => {
    const loadMatch = async () => {
      const matchId = pvpMatchId || pvpMatchData?.matchId;
      if (!matchId) {
        setLoading(false);
        return;
      }

      try {
        const details = await apiGetPvPMatch(matchId, authToken);
        setMatchDetails(details);
        // Auto-start playback
        setTimeout(() => setIsPlaying(true), 500);
      } catch (error) {
        console.error('Failed to load match:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [pvpMatchId, pvpMatchData, authToken]);

  // Get current battle data
  const currentBattle = matchDetails?.battles?.[currentBattleIndex];
  const battleLog = currentBattle?.battleLog || [];

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
    if (currentBattleIndex < 2) {
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

  const getCurrentState = () => {
    if (!battleLog.length) return null;
    return battleLog[Math.min(battleTick, battleLog.length - 1)];
  };

  const state = getCurrentState();

  // Determine which player is "you"
  const isPlayer1 = matchDetails?.youAre === 'player1';

  // Get HP bar color based on percentage
  const getHpColor = (pct) => {
    if (pct > 50) return 'bg-stat-hp';
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
        // Determine message type
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

  if (loading) {
    return (
      <div className="min-h-screen bg-pocket-bg p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <Swords size={48} className="mx-auto mb-4 text-pocket-text-light animate-pulse" />
          <p className="text-pocket-text-light">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="min-h-screen bg-pocket-bg p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <Swords size={48} className="mx-auto mb-4 text-pocket-text-light" />
          <p className="text-pocket-text mb-4">Match not found</p>
          <button
            onClick={() => setGameState('pvp')}
            className="pocket-btn-primary px-6 py-2"
          >
            Back to PvP
          </button>
        </div>
      </div>
    );
  }

  // Final result screen
  if (showResult) {
    const won = matchDetails.winner === matchDetails.youAre;
    const yourData = isPlayer1 ? matchDetails.player1 : matchDetails.player2;
    const opponentData = isPlayer1 ? matchDetails.player2 : matchDetails.player1;

    return (
      <div className="min-h-screen bg-pocket-bg p-4">
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
            className={`rounded-2xl shadow-card p-6 ${won ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  won ? 'bg-green-200' : 'bg-red-200'
                }`}
              >
                <Trophy size={40} className={won ? 'text-green-600' : 'text-red-600'} />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-3xl font-bold ${won ? 'text-green-600' : 'text-red-600'}`}
              >
                {won ? 'Victory!' : 'Defeat'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-pocket-text-light"
              >
                vs {opponentData.username}
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-pocket-text-light mb-1">Final Score</div>
                <div className="text-3xl font-bold text-pocket-text">
                  {isPlayer1 ? matchDetails.player1.battlesWon : matchDetails.player2.battlesWon}
                  {' - '}
                  {isPlayer1 ? matchDetails.player2.battlesWon : matchDetails.player1.battlesWon}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-pocket-text-light mb-1">Rating Change</div>
                <div className={`text-3xl font-bold flex items-center justify-center gap-1 ${
                  yourData.ratingChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {yourData.ratingChange > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  {yourData.ratingChange > 0 ? '+' : ''}{yourData.ratingChange}
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
              {matchDetails.battles?.map((battle, index) => {
                const battleWon = battle.winner === (isPlayer1 ? 1 : 2);
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl text-center ${
                      battleWon ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <div className={`text-lg font-bold ${battleWon ? 'text-green-700' : 'text-red-700'}`}>
                      Battle {index + 1}
                    </div>
                    <div className={`text-sm ${battleWon ? 'text-green-600' : 'text-red-600'}`}>
                      {battleWon ? 'Won' : 'Lost'}
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
              onClick={() => setGameState('pvp')}
              className="w-full py-4 bg-type-fighting text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors"
            >
              Back to PvP
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Battle replay screen (using BattleScreen style)
  const yourPokemon = isPlayer1 ? currentBattle?.pokemon1 : currentBattle?.pokemon2;
  const opponentPokemon = isPlayer1 ? currentBattle?.pokemon2 : currentBattle?.pokemon1;

  // Get HP from current state
  const yourHp = state ? (isPlayer1 ? state.player1 : state.player2) : null;
  const opponentHp = state ? (isPlayer1 ? state.player2 : state.player1) : null;

  const yourPct = yourHp ? (yourHp.currentHp / yourHp.maxHp) * 100 : 100;
  const opponentPct = opponentHp ? (opponentHp.currentHp / opponentHp.maxHp) * 100 : 100;

  const battleWon = currentBattle?.winner === (isPlayer1 ? 1 : 2);

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
              onClick={() => setGameState('pvp')}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Swords size={20} className="text-type-fighting" />
              <span className="font-bold text-pocket-text">
                Battle {currentBattleIndex + 1} of 3
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
          <div className="bg-gradient-to-r from-pocket-red to-red-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Zap size={18} />
              <span className="font-bold">PvP Battle Replay</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/80" />
              <span className="text-white font-bold">Tick {battleTick + 1}</span>
            </div>
          </div>

          {/* Combatants */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-8 relative">
              {/* Your Pokemon */}
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={yourHp?.currentHp <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}
                    className="inline-block"
                  >
                    {yourPokemon && generatePokemonSprite(yourPokemon.primaryType, yourPokemon.name)}
                  </motion.div>
                </div>

                <div className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-pocket-text text-sm">{yourPokemon?.name || 'Your Pokemon'}</h3>
                      {yourPokemon?.stats && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(yourPokemon.stats)) }}
                        >
                          {getPokemonGrade(yourPokemon.stats)}
                        </span>
                      )}
                    </div>
                    {yourPokemon && <TypeBadge type={yourPokemon.primaryType} size={14} />}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold mb-2">(You)</div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>HP</span>
                      <span className="font-semibold">{yourHp?.currentHp || 0}/{yourHp?.maxHp || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getHpColor(yourPct)}`}
                        animate={{ width: `${yourPct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  {yourHp?.currentStamina !== undefined && (
                    <div>
                      <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                        <span>Stamina</span>
                        <span>{yourHp.currentStamina}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${yourHp.currentStamina}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  {yourPokemon?.stats && (
                    <div className="flex justify-between mt-3 text-[10px] text-pocket-text-light">
                      <span>ATK {yourPokemon.stats.Attack}</span>
                      <span>DEF {yourPokemon.stats.Defense}</span>
                      <span>INS {yourPokemon.stats.Instinct}</span>
                      <span>SPE {yourPokemon.stats.Speed}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* VS Divider */}
              <div className="absolute left-1/2 top-12 -translate-x-1/2 z-10 hidden sm:block">
                <div className="w-10 h-10 rounded-full bg-pocket-red flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  VS
                </div>
              </div>

              {/* Opponent Pokemon */}
              <div className="space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={opponentHp?.currentHp <= 0 ? { opacity: 0.3, scale: 0.9 } : {}}
                    className="inline-block"
                  >
                    {opponentPokemon && generatePokemonSprite(opponentPokemon.primaryType, opponentPokemon.name)}
                  </motion.div>
                </div>

                <div className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-pocket-text text-sm">{opponentPokemon?.name || 'Opponent'}</h3>
                      {opponentPokemon?.stats && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(opponentPokemon.stats)) }}
                        >
                          {getPokemonGrade(opponentPokemon.stats)}
                        </span>
                      )}
                    </div>
                    {opponentPokemon && <TypeBadge type={opponentPokemon.primaryType} size={14} />}
                  </div>
                  <div className="text-[10px] text-red-600 font-semibold mb-2">(Opponent)</div>

                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                      <span>HP</span>
                      <span className="font-semibold">{opponentHp?.currentHp || 0}/{opponentHp?.maxHp || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${getHpColor(opponentPct)}`}
                        animate={{ width: `${opponentPct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stamina Bar */}
                  {opponentHp?.currentStamina !== undefined && (
                    <div>
                      <div className="flex justify-between text-xs text-pocket-text-light mb-1">
                        <span>Stamina</span>
                        <span>{opponentHp.currentStamina}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${opponentHp.currentStamina}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  {opponentPokemon?.stats && (
                    <div className="flex justify-between mt-3 text-[10px] text-pocket-text-light">
                      <span>ATK {opponentPokemon.stats.Attack}</span>
                      <span>DEF {opponentPokemon.stats.Defense}</span>
                      <span>INS {opponentPokemon.stats.Instinct}</span>
                      <span>SPE {opponentPokemon.stats.Speed}</span>
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
                      ? 'bg-pocket-red text-white shadow-pill'
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
                className={`font-bold text-sm ${battleWon ? 'text-green-600' : 'text-red-600'}`}
              >
                {battleWon ? 'Victory!' : 'Defeat'}
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
              {currentBattleIndex < 2 ? `Continue to Battle ${currentBattleIndex + 2}` : 'View Match Result'}
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
          {[0, 1, 2].map((idx) => {
            const battle = matchDetails?.battles?.[idx];
            const won = battle?.winner === (isPlayer1 ? 1 : 2);
            const isActive = idx === currentBattleIndex;
            const isCompleted = idx < currentBattleIndex || (idx === currentBattleIndex && battleComplete);

            return (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${
                  isActive ? 'w-6' : ''
                } ${
                  isCompleted
                    ? won ? 'bg-green-500' : 'bg-red-500'
                    : isActive ? 'bg-type-fighting' : 'bg-gray-300'
                }`}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default PvPReplayScreen;
