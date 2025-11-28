/**
 * PvPScreen Component
 *
 * Main PvP hub screen showing:
 * - Current rating and stats
 * - Find Match button
 * - Recent match history
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Swords, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { apiGetPvPStats, apiGetPvPMatches } from '../services/apiService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const PvPScreen = () => {
  const { setGameState, setPvPMatchId } = useGame();
  const { user, authToken } = useAuth();

  const [stats, setStats] = useState({ rating: 1000, wins: 0, losses: 0 });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }

      try {
        const [statsData, matchesData] = await Promise.all([
          apiGetPvPStats(authToken),
          apiGetPvPMatches(10, 0, authToken)
        ]);

        if (statsData) {
          setStats(statsData);
        }
        if (matchesData?.matches) {
          setMatches(matchesData.matches);
        }
      } catch (err) {
        console.error('Failed to load PvP data:', err);
        setError(err.message);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authToken]);

  const getWinRate = () => {
    const total = stats.wins + stats.losses;
    if (total === 0) return 0;
    return Math.round((stats.wins / total) * 100);
  };

  const getRatingTier = (rating) => {
    const r = rating || 1000;
    if (r >= 1800) return { name: 'Master', color: '#FFD700' };
    if (r >= 1600) return { name: 'Diamond', color: '#B9F2FF' };
    if (r >= 1400) return { name: 'Platinum', color: '#E5E4E2' };
    if (r >= 1200) return { name: 'Gold', color: '#FFD700' };
    if (r >= 1000) return { name: 'Silver', color: '#C0C0C0' };
    return { name: 'Bronze', color: '#CD7F32' };
  };

  const tier = getRatingTier(stats?.rating);

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
            onClick={() => setGameState('menu')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Swords size={20} className="text-type-fighting" />
            <span className="font-bold text-pocket-text">PvP Battle</span>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* Login Warning */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4"
          >
            <p className="text-center text-amber-700 font-bold text-sm">
              Login required to battle other players
            </p>
          </motion.div>
        )}

        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pocket-bg flex items-center justify-center">
              <Swords size={32} className="text-pocket-text-light animate-pulse" />
            </div>
            <p className="text-pocket-text-light">Loading PvP data...</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Rating Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-pocket-text">Your Rating</h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ backgroundColor: tier.color, color: '#333' }}
                >
                  {tier.name}
                </span>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-pocket-text mb-2">
                  {stats.rating}
                </div>
                <div className="text-sm text-pocket-text-light">
                  Rating Points
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
                  <div className="text-xs text-green-700">Wins</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
                  <div className="text-xs text-red-700">Losses</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-blue-600">{getWinRate()}%</div>
                  <div className="text-xs text-blue-700">Win Rate</div>
                </div>
              </div>
            </motion.div>

            {/* Find Match Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => setGameState('pvpTeamSelect')}
                disabled={!user}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  user
                    ? 'bg-type-fighting text-white hover:bg-red-700 shadow-card hover:shadow-card-hover'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Swords size={24} />
                  <span>Find Match</span>
                </div>
              </button>
            </motion.div>

            {/* Recent Matches */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-card p-6"
            >
              <h3 className="font-bold text-pocket-text mb-4">Recent Matches</h3>

              {matches.length === 0 ? (
                <div className="text-center py-8 text-pocket-text-light">
                  <Trophy size={48} className="mx-auto mb-2 opacity-30" />
                  <p>No matches yet</p>
                  <p className="text-sm">Start battling to see your history!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => {
                    const isPlayer1 = match.player1_id === user?.id;
                    const won = match.winner_id === user?.id;
                    const opponentName = isPlayer1
                      ? (match.player2_username || 'AI Trainer')
                      : match.player1_username;
                    const ratingChange = isPlayer1
                      ? match.player1_rating_change
                      : match.player2_rating_change;

                    return (
                      <motion.div
                        key={match.id}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setPvPMatchId(match.id);
                          setGameState('pvpReplay');
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                          won ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            won ? 'bg-green-200' : 'bg-red-200'
                          }`}>
                            {won ? (
                              <Trophy size={20} className="text-green-600" />
                            ) : (
                              <Swords size={20} className="text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              vs {opponentName}
                              {match.is_ai_opponent && (
                                <span className="ml-1 text-xs text-gray-500">(AI)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {won ? 'Victory' : 'Defeat'} • {match.battles_won_p1 || 0}-{match.battles_won_p2 || 0}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 font-bold ${
                          ratingChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {ratingChange > 0 ? (
                            <TrendingUp size={16} />
                          ) : (
                            <TrendingDown size={16} />
                          )}
                          <span>{ratingChange > 0 ? '+' : ''}{ratingChange || 0}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PvPScreen;
