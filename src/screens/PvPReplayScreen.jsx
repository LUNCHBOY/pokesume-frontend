/**
 * PvPReplayScreen Component
 *
 * Displays PvP match results and allows viewing battle replays.
 * Shows:
 * - Match result (win/loss)
 * - Rating change
 * - 3 battle replays with play controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipForward, Trophy, TrendingUp, TrendingDown, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { apiGetPvPMatch } from '../services/apiService';
import { TypeBadge } from '../components/TypeIcon';

const PvPReplayScreen = () => {
  const { setGameState, pvpMatchId, pvpMatchData } = useGame();
  const { authToken, user } = useAuth();

  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBattle, setCurrentBattle] = useState(0);
  const [battleTick, setBattleTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const playbackRef = useRef(null);

  useEffect(() => {
    const loadMatch = async () => {
      if (!pvpMatchId) {
        // Try to use the match data from queue screen
        if (pvpMatchData?.matchId) {
          const details = await apiGetPvPMatch(pvpMatchData.matchId, authToken);
          setMatchDetails(details);
        }
        setLoading(false);
        return;
      }

      try {
        const details = await apiGetPvPMatch(pvpMatchId, authToken);
        setMatchDetails(details);
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

  const currentBattleLog = matchDetails?.battles?.[currentBattle]?.battleLog || [];

  useEffect(() => {
    if (isPlaying && currentBattleLog.length > 0) {
      playbackRef.current = setInterval(() => {
        setBattleTick(prev => {
          if (prev >= currentBattleLog.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / playbackSpeed);
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentBattleLog.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipToEnd = () => {
    setIsPlaying(false);
    setBattleTick(currentBattleLog.length - 1);
  };

  const handleSelectBattle = (index) => {
    setCurrentBattle(index);
    setBattleTick(0);
    setIsPlaying(false);
  };

  const getCurrentState = () => {
    if (!currentBattleLog.length) return null;
    return currentBattleLog[Math.min(battleTick, currentBattleLog.length - 1)];
  };

  const state = getCurrentState();

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

  const isPlayer1 = matchDetails.youAre === 'player1';
  const won = matchDetails.winner === matchDetails.youAre;
  const yourData = isPlayer1 ? matchDetails.player1 : matchDetails.player2;
  const opponentData = isPlayer1 ? matchDetails.player2 : matchDetails.player1;

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
            <span className="font-bold text-pocket-text">Match Result</span>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Result Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl shadow-card p-6 ${won ? 'bg-green-50' : 'bg-red-50'}`}
        >
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                won ? 'bg-green-200' : 'bg-red-200'
              }`}
            >
              <Trophy size={32} className={won ? 'text-green-600' : 'text-red-600'} />
            </motion.div>
            <h2 className={`text-2xl font-bold ${won ? 'text-green-600' : 'text-red-600'}`}>
              {won ? 'Victory!' : 'Defeat'}
            </h2>
            <p className="text-pocket-text-light">
              vs {opponentData.username}
              {opponentData.isAI && ' (AI)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-sm text-pocket-text-light mb-1">Score</div>
              <div className="text-xl font-bold text-pocket-text">
                {isPlayer1 ? matchDetails.player1.battlesWon : matchDetails.player2.battlesWon}
                {' - '}
                {isPlayer1 ? matchDetails.player2.battlesWon : matchDetails.player1.battlesWon}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <div className="text-sm text-pocket-text-light mb-1">Rating</div>
              <div className={`text-xl font-bold flex items-center justify-center gap-1 ${
                yourData.ratingChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {yourData.ratingChange > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {yourData.ratingChange > 0 ? '+' : ''}{yourData.ratingChange}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Battle Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card p-4"
        >
          <h3 className="font-bold text-pocket-text mb-3">Battles</h3>
          <div className="grid grid-cols-3 gap-2">
            {matchDetails.battles?.map((battle, index) => {
              const battleWon = battle.winner === (isPlayer1 ? 1 : 2);
              const isActive = index === currentBattle;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectBattle(index)}
                  className={`p-3 rounded-xl font-bold text-sm transition-all ${
                    isActive
                      ? 'ring-2 ring-type-fighting'
                      : ''
                  } ${
                    battleWon
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  Battle {index + 1}
                  <div className="text-xs font-normal">
                    {battleWon ? 'Won' : 'Lost'}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Battle Replay */}
        {currentBattleLog.length > 0 && state && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-card p-4"
          >
            {/* HP Bars */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Player 1 (Your Pokemon) */}
              <div className={`p-3 rounded-xl ${isPlayer1 ? 'bg-blue-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">{state.player1?.name || 'Player 1'}</span>
                  <span className="text-xs text-pocket-text-light">
                    {isPlayer1 ? '(You)' : '(Opponent)'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(0, (state.player1?.currentHp / state.player1?.maxHp) * 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-pocket-text-light">
                  {state.player1?.currentHp || 0} / {state.player1?.maxHp || 0} HP
                </div>
              </div>

              {/* Player 2 (Opponent's Pokemon) */}
              <div className={`p-3 rounded-xl ${!isPlayer1 ? 'bg-blue-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">{state.player2?.name || 'Player 2'}</span>
                  <span className="text-xs text-pocket-text-light">
                    {!isPlayer1 ? '(You)' : '(Opponent)'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(0, (state.player2?.currentHp / state.player2?.maxHp) * 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-pocket-text-light">
                  {state.player2?.currentHp || 0} / {state.player2?.maxHp || 0} HP
                </div>
              </div>
            </div>

            {/* Battle Message */}
            <div className="bg-pocket-bg rounded-xl p-3 mb-4 min-h-[60px]">
              <p className="text-sm text-pocket-text">
                {state.message || `Tick ${state.tick || battleTick}`}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="p-2 bg-type-fighting text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={handleSkipToEnd}
                  className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 mx-4">
                <input
                  type="range"
                  min={0}
                  max={currentBattleLog.length - 1}
                  value={battleTick}
                  onChange={(e) => {
                    setBattleTick(parseInt(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full"
                />
              </div>

              {/* Speed Control */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            <div className="text-center text-xs text-pocket-text-light mt-2">
              Tick {battleTick + 1} / {currentBattleLog.length}
            </div>
          </motion.div>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setGameState('pvp')}
            className="w-full py-3 bg-type-fighting text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Back to PvP
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PvPReplayScreen;
