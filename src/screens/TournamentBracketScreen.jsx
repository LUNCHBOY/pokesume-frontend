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
import { Trophy, Users } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

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

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-400';
      case 'active':
        return 'bg-yellow-100 border-yellow-400';
      case 'upcoming':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const isUserMatch = (match) => {
    if (!user) return false;
    return match.player1_user_id === user.id || match.player2_user_id === user.id;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Trophy size={32} className="text-red-600" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">{selectedTournament?.name}</h2>
                <p className="text-sm text-gray-600">Round {selectedTournament?.current_round}/{totalRounds}</p>
              </div>
            </div>
            <button
              onClick={() => setGameState('tournamentDetails')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Back to Details
            </button>
          </div>
        </div>

        {!tournamentBracket || tournamentBracket.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-lg">
            <p className="text-gray-600">No bracket data available yet</p>
            <p className="text-gray-500 text-sm mt-2">Bracket will be generated when tournament starts</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-lg overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[...Array(totalRounds)].map((_, roundIndex) => {
                const roundNum = roundIndex + 1;
                const roundMatches = rounds[roundNum] || [];

                return (
                  <div key={roundNum} className="flex-shrink-0" style={{ minWidth: '300px' }}>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-purple-600">
                        {roundNum === totalRounds ? 'Finals' :
                         roundNum === totalRounds - 1 ? 'Semifinals' :
                         roundNum === totalRounds - 2 ? 'Quarterfinals' :
                         `Round ${roundNum}`}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {roundMatches.map((match) => {
                        const status = getMatchStatus(match);
                        const isUser = isUserMatch(match);

                        return (
                          <div
                            key={match.id}
                            className={`border-2 rounded-lg p-4 ${getMatchStatusColor(status)} ${
                              isUser ? 'ring-2 ring-purple-500' : ''
                            }`}
                          >
                            {/* Player 1 */}
                            <div className={`flex items-center justify-between p-2 rounded mb-2 ${
                              match.winner_user_id === match.player1_user_id ? 'bg-green-200 font-bold' : 'bg-white'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span className="text-sm">{match.player1_username || 'TBD'}</span>
                              </div>
                              {match.battle_results && (
                                <span className="text-sm font-bold">
                                  {parseBattleResults(match.battle_results)?.score?.split('-')[0] || '0'}
                                </span>
                              )}
                            </div>

                            {/* VS */}
                            <div className="text-center text-xs text-gray-500 mb-2">
                              {status === 'completed' ? 'FINAL' : status === 'active' ? 'LIVE' : 'VS'}
                            </div>

                            {/* Player 2 */}
                            <div className={`flex items-center justify-between p-2 rounded ${
                              match.winner_user_id === match.player2_user_id ? 'bg-green-200 font-bold' : 'bg-white'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span className="text-sm">{match.player2_username || 'TBD'}</span>
                              </div>
                              {match.battle_results && (
                                <span className="text-sm font-bold">
                                  {parseBattleResults(match.battle_results)?.score?.split('-')[1] || '0'}
                                </span>
                              )}
                            </div>

                            {/* Match Details */}
                            {match.completed_at && (
                              <div className="mt-2 pt-2 border-t border-gray-300">
                                <p className="text-xs text-gray-600 text-center mb-2">
                                  Completed: {new Date(match.completed_at).toLocaleString()}
                                </p>
                                {match.battle_results && (
                                  <button
                                    onClick={() => {
                                      setSelectedReplay(match);
                                      setGameState('tournamentReplay');
                                    }}
                                    className="w-full bg-purple-600 text-white py-1.5 px-3 rounded text-xs font-bold hover:bg-purple-700 transition"
                                  >
                                    ▶️ Watch Battle
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h4 className="font-bold mb-3 text-sm">Legend:</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
                  <span>Active Round</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded"></div>
                  <span>Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-purple-500 rounded"></div>
                  <span>Your Match</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracketScreen;
