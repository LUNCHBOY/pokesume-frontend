/**
 * TournamentsScreen Component
 *
 * Displays list of available tournaments with:
 * - Tournament status (registration, upcoming, in_progress, completed)
 * - Player counts
 * - Time until start
 * - Navigation to details
 */

import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

const TournamentsScreen = () => {
  const { setGameState, tournaments, tournamentsLoading, setSelectedTournament } = useGame();
  const { user } = useAuth();

  const getTimeUntilStart = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;

    if (diff <= 0) return 'In Progress';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registration':
      case 'upcoming':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Trophy size={32} className="text-red-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">Tournaments</h2>
            </div>
            <button
              onClick={() => setGameState('menu')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Back to Menu
            </button>
          </div>
        </div>

        {!user && (
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
            <p className="text-center text-yellow-800 font-bold">
              Login required to enter tournaments
            </p>
          </div>
        )}

        {tournamentsLoading ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-lg">
            <p className="text-gray-600">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-lg">
            <Trophy size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">No tournaments available</p>
            <p className="text-gray-500 text-sm mt-2">Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
                onClick={() => {
                  setSelectedTournament(tournament);
                  setGameState('tournamentDetails');
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{tournament.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getStatusColor(tournament.status)}`}>
                        {tournament.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {tournament.status === 'in_progress' && (
                        <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-sm font-bold">
                          Round {tournament.current_round}/{tournament.total_rounds}
                        </span>
                      )}
                    </div>
                  </div>
                  <Trophy size={32} className="text-red-600" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Players:</span>
                    <span className="font-bold">{tournament.entries_count}/{tournament.max_players}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {tournament.status === 'upcoming' || tournament.status === 'registration' ? 'Starts in:' : 'Started:'}
                    </span>
                    <span className="font-bold flex items-center gap-1">
                      <Clock size={14} />
                      {tournament.status === 'upcoming' || tournament.status === 'registration'
                        ? getTimeUntilStart(tournament.start_time)
                        : new Date(tournament.start_time).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTournament(tournament);
                      setGameState('tournamentDetails');
                    }}
                    className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsScreen;
