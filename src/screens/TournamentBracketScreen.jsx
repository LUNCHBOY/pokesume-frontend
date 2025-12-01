/**
 * TournamentBracketScreen Component
 *
 * Displays tournament bracket by rounds with:
 * - Round visualization (Finals, Semifinals, Quarterfinals, etc.)
 * - Match status (completed, active, upcoming)
 * - User match highlighting
 * - Battle replay access for completed matches
 */

import React from 'react';
import { ArrowLeft, Trophy, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileIcon from '../components/ProfileIcon';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const TournamentBracketScreen = () => {
  const {
    setGameState,
    selectedTournament,
    tournamentBracket,
    setSelectedReplay
  } = useGame();
  const { user } = useAuth();

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

  const groupByRound = () => {
    if (!tournamentBracket) return {};

    const rounds = {};
    tournamentBracket.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });

    // Sort matches by position within each round
    Object.keys(rounds).forEach(round => {
      rounds[round].sort((a, b) => a.position - b.position);
    });

    return rounds;
  };

  const rounds = groupByRound();
  const totalRounds = selectedTournament?.total_rounds || 0;

  const getMatchStatus = (match) => {
    if (match.completed_at) return 'completed';
    if (match.round === selectedTournament?.current_round) return 'active';
    return 'upcoming';
  };

  const getMatchStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-pocket-green/10 border-pocket-green';
      case 'active':
        return 'bg-amber-50 border-amber-400';
      case 'upcoming':
        return 'bg-pocket-bg border-gray-200';
      default:
        return 'bg-pocket-bg border-gray-200';
    }
  };

  const isUserMatch = (match) => {
    if (!user) return false;
    return match.player1_user_id === user.id || match.player2_user_id === user.id;
  };

  const getRoundName = (roundNum) => {
    if (roundNum === totalRounds) return 'Finals';
    if (roundNum === totalRounds - 1) return 'Semifinals';
    if (roundNum === totalRounds - 2) return 'Quarterfinals';
    return `Round ${roundNum}`;
  };

  return (
    <div className="min-h-screen bg-pocket-bg p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setGameState('tournamentDetails')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Trophy size={20} className="text-type-psychic" />
              <span className="font-bold text-pocket-text">{selectedTournament?.name}</span>
            </div>
            <p className="text-xs text-pocket-text-light">
              {selectedTournament?.status === 'completed'
                ? 'Final Results'
                : `Round ${selectedTournament?.current_round}/${totalRounds}`}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto">
        {!tournamentBracket || tournamentBracket.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pocket-bg flex items-center justify-center">
              <Trophy size={32} className="text-pocket-text-light" />
            </div>
            <p className="text-pocket-text mb-2">No bracket data available yet</p>
            <p className="text-sm text-pocket-text-light mb-4">Bracket will be generated when tournament starts</p>
            <button
              onClick={() => setGameState('tournamentDetails')}
              className="pocket-btn-primary px-6 py-2"
            >
              Back to Details
            </button>
          </motion.div>
        ) : (
          <>
            {/* Winner Banner for Completed Tournaments */}
            {selectedTournament?.status === 'completed' && (() => {
              // Find the finals match and winner
              const finalsMatch = tournamentBracket.find(m => m.round === totalRounds && m.completed_at);
              if (!finalsMatch || !finalsMatch.winner_username) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-400 rounded-2xl p-6 mb-4 text-center"
                >
                  <Trophy size={48} className="mx-auto text-amber-500 mb-2" />
                  <h2 className="text-2xl font-bold text-amber-700 mb-1">Tournament Champion</h2>
                  <div className="flex items-center justify-center gap-2">
                    <ProfileIcon
                      icon={finalsMatch.winner_user_id === finalsMatch.player1_user_id
                        ? finalsMatch.player1_profile_icon
                        : finalsMatch.player2_profile_icon || 'pikachu'}
                      size={32}
                      showBorder={true}
                    />
                    <span className="text-xl font-bold text-amber-800">{finalsMatch.winner_username}</span>
                  </div>
                </motion.div>
              );
            })()}

            {/* Bracket Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: selectedTournament?.status === 'completed' ? 0.1 : 0 }}
              className="bg-white rounded-2xl shadow-card p-4 overflow-x-auto"
            >
              <div className="flex gap-4 min-w-max pb-4">
                {[...Array(totalRounds)].map((_, roundIndex) => {
                  const roundNum = roundIndex + 1;
                  const roundMatches = rounds[roundNum] || [];

                  return (
                    <motion.div
                      key={roundNum}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex-shrink-0"
                      style={{ minWidth: '280px' }}
                    >
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-pocket-text">
                          {getRoundName(roundNum)}
                        </h3>
                        <p className="text-xs text-pocket-text-light">
                          {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {roundMatches.map((match) => {
                          const status = getMatchStatus(match);
                          const isUser = isUserMatch(match);

                          return (
                            <motion.div
                              key={match.id}
                              variants={itemVariants}
                              className={`border-2 rounded-xl p-3 ${getMatchStatusStyles(status)} ${
                                isUser ? 'ring-2 ring-type-psychic' : ''
                              }`}
                            >
                              {/* Player 1 */}
                              <div className={`flex items-center justify-between p-2 rounded-lg mb-2 ${
                                match.winner_user_id === match.player1_user_id
                                  ? 'bg-pocket-green/20'
                                  : 'bg-white'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {match.player1_username ? (
                                    <ProfileIcon
                                      icon={match.player1_profile_icon || 'pikachu'}
                                      size={24}
                                      showBorder={true}
                                      className={match.winner_user_id === match.player1_user_id ? 'ring-pocket-green' : 'ring-gray-200'}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-[10px] text-gray-400">?</span>
                                    </div>
                                  )}
                                  <span className={`text-sm ${
                                    match.winner_user_id === match.player1_user_id ? 'font-bold text-pocket-green' : 'text-pocket-text'
                                  }`}>
                                    {match.player1_username || 'TBD'}
                                  </span>
                                </div>
                                {match.battle_results && (
                                  <span className="text-sm font-bold text-pocket-text">
                                    {parseBattleResults(match.battle_results)?.player1Wins || '0'}
                                  </span>
                                )}
                              </div>

                              {/* VS */}
                              <div className="text-center text-[10px] font-bold text-pocket-text-light mb-2">
                                {status === 'completed' ? 'FINAL' : status === 'active' ? 'LIVE' : 'VS'}
                              </div>

                              {/* Player 2 */}
                              <div className={`flex items-center justify-between p-2 rounded-lg ${
                                match.winner_user_id === match.player2_user_id
                                  ? 'bg-pocket-green/20'
                                  : 'bg-white'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {match.player2_username ? (
                                    <ProfileIcon
                                      icon={match.player2_profile_icon || 'pikachu'}
                                      size={24}
                                      showBorder={true}
                                      className={match.winner_user_id === match.player2_user_id ? 'ring-pocket-green' : 'ring-gray-200'}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-[10px] text-gray-400">?</span>
                                    </div>
                                  )}
                                  <span className={`text-sm ${
                                    match.winner_user_id === match.player2_user_id ? 'font-bold text-pocket-green' : 'text-pocket-text'
                                  }`}>
                                    {match.player2_username || 'TBD'}
                                  </span>
                                </div>
                                {match.battle_results && (
                                  <span className="text-sm font-bold text-pocket-text">
                                    {parseBattleResults(match.battle_results)?.player2Wins || '0'}
                                  </span>
                                )}
                              </div>

                              {/* Match Details */}
                              {match.completed_at && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-[10px] text-pocket-text-light text-center mb-2">
                                    {new Date(match.completed_at).toLocaleString()}
                                  </p>
                                  {match.battle_results && (
                                    <button
                                      onClick={() => {
                                        setSelectedReplay(match);
                                        setGameState('tournamentReplay');
                                      }}
                                      className="w-full pocket-btn-purple py-1.5 text-xs flex items-center justify-center gap-1"
                                    >
                                      <Play size={12} /> Watch Battle
                                    </button>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Legend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-card p-4 mt-4"
            >
              <h4 className="font-bold text-pocket-text text-sm mb-3">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pocket-green/10 border-2 border-pocket-green rounded"></div>
                  <span className="text-pocket-text-light">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-50 border-2 border-amber-400 rounded"></div>
                  <span className="text-pocket-text-light">Active Round</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pocket-bg border-2 border-gray-200 rounded"></div>
                  <span className="text-pocket-text-light">Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-type-psychic rounded ring-2 ring-type-psychic"></div>
                  <span className="text-pocket-text-light">Your Match</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default TournamentBracketScreen;
