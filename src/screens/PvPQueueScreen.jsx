/**
 * PvPQueueScreen Component
 *
 * Matchmaking queue screen that:
 * - Shows waiting animation and timer
 * - Polls for match status every 2 seconds
 * - Transitions to replay screen when matched
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Swords, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import {
  apiJoinPvPQueue,
  apiGetPvPQueueStatus,
  apiLeavePvPQueue
} from '../services/apiService';

const PvPQueueScreen = () => {
  const { setGameState, pvpSelectedTeam, setPvPMatchId, setPvPMatchData } = useGame();
  const { authToken } = useAuth();

  const [queueStatus, setQueueStatus] = useState('joining'); // joining, waiting, matched, error
  const [queueTime, setQueueTime] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState(null);
  const [matchData, setMatchData] = useState(null);

  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  const joinedRef = useRef(false);

  // Join queue on mount
  useEffect(() => {
    const joinQueue = async () => {
      if (joinedRef.current) return;
      if (!pvpSelectedTeam || pvpSelectedTeam.filter(p => p !== null).length !== 3) {
        setError('Please select 3 Pokemon first');
        setQueueStatus('error');
        return;
      }

      joinedRef.current = true;

      try {
        const result = await apiJoinPvPQueue(
          pvpSelectedTeam[0].id,
          pvpSelectedTeam[1].id,
          pvpSelectedTeam[2].id,
          authToken
        );

        if (result) {
          setQueueStatus('waiting');
          setPosition(result.position);
          startPolling();
          startTimer();
        } else {
          setError('Failed to join queue');
          setQueueStatus('error');
        }
      } catch (err) {
        setError(err.message || 'Failed to join queue');
        setQueueStatus('error');
      }
    };

    joinQueue();

    return () => {
      stopPolling();
      stopTimer();
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const status = await apiGetPvPQueueStatus(authToken);

        if (status.status === 'matched') {
          stopPolling();
          stopTimer();
          setQueueStatus('matched');
          setMatchData(status);

          // Store match data and navigate
          setPvPMatchId(status.matchId);
          setPvPMatchData(status);

          // Short delay to show "Match Found!" then navigate
          setTimeout(() => {
            setGameState('pvpReplay');
          }, 2000);
        } else if (status.status === 'waiting') {
          setPosition(status.position);
          setQueueTime(status.queueTime);
        } else if (status.status === 'not_in_queue') {
          // User was removed from queue unexpectedly
          setError('You were removed from the queue');
          setQueueStatus('error');
          stopPolling();
        }
      } catch (err) {
        console.error('Queue status poll error:', err);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setQueueTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleLeaveQueue = async () => {
    stopPolling();
    stopTimer();

    try {
      await apiLeavePvPQueue(authToken);
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }

    setGameState('pvpTeamSelect');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-pocket-bg p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white shadow-card rounded-2xl mb-4"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleLeaveQueue}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Swords size={20} className="text-type-fighting" />
              <span className="font-bold text-pocket-text">Finding Match</span>
            </div>
            <div className="w-10" />
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-card p-8"
        >
          {queueStatus === 'error' ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <Swords size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
              <p className="text-pocket-text-light mb-6">{error}</p>
              <button
                onClick={() => setGameState('pvpTeamSelect')}
                className="pocket-btn-primary px-6 py-2"
              >
                Go Back
              </button>
            </div>
          ) : queueStatus === 'matched' ? (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
              >
                <Swords size={40} className="text-green-500" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-green-600 mb-2"
              >
                Match Found!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-pocket-text-light"
              >
                vs {matchData?.opponent?.username || 'Opponent'}
                {matchData?.opponent?.isAI && ' (AI)'}
              </motion.p>
            </div>
          ) : (
            <div className="text-center">
              {/* Animated searching icon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div
                  animate={{
                    rotate: 360
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute inset-0 rounded-full border-4 border-t-type-fighting border-r-transparent border-b-transparent border-l-transparent"
                />
                <motion.div
                  animate={{
                    rotate: -360
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-type-water border-b-transparent border-l-transparent"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords size={32} className="text-pocket-text" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-pocket-text mb-2">
                {queueStatus === 'joining' ? 'Joining Queue...' : 'Searching for Opponent...'}
              </h2>

              {/* Queue Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-pocket-text-light">
                  <Clock size={16} />
                  <span>{formatTime(queueTime)}</span>
                </div>
                {position > 0 && (
                  <div className="flex items-center justify-center gap-2 text-pocket-text-light">
                    <Users size={16} />
                    <span>Position: {position}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-pocket-text-light mb-6">
                {queueTime < 30
                  ? 'Looking for players with similar rating...'
                  : queueTime < 60
                    ? 'Expanding search range...'
                    : 'AI opponent will be generated soon...'}
              </p>

              <button
                onClick={handleLeaveQueue}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </motion.div>

        {/* Team Preview */}
        {queueStatus !== 'error' && pvpSelectedTeam && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-card p-4 mt-4"
          >
            <h3 className="text-sm font-bold text-pocket-text-light mb-2 text-center">Your Team</h3>
            <div className="flex justify-center gap-2">
              {pvpSelectedTeam.filter(p => p !== null).map((pokemon, index) => (
                <div
                  key={index}
                  className="w-12 h-12 rounded-lg bg-pocket-bg flex items-center justify-center"
                >
                  <span className="text-xl">{pokemon.name?.[0] || '?'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PvPQueueScreen;
