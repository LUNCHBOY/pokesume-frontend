/**
 * TournamentDetailsScreen Component
 *
 * Displays tournament details and allows team selection:
 * - Tournament information (status, players, rounds)
 * - User entry status
 * - Team selection (3 Pokemon from trained rosters)
 * - Entry submission
 * - Registered players list
 */

import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import {
  generatePokemonSprite,
  getTypeColor,
  getGradeColor
} from '../utils/gameUtils';
import { apiEnterTournament, apiGetTournamentDetails } from '../services/apiService';

const TournamentDetailsScreen = () => {
  const {
    setGameState,
    selectedTournament,
    tournamentDetails,
    setTournamentDetails,
    userRosters
  } = useGame();
  const { user } = useAuth();

  const [selectedTeam, setSelectedTeam] = useState([null, null, null]);

  const userHasRosters = userRosters.length >= 3;
  const canEnter = user && userHasRosters &&
                   (selectedTournament?.status === 'registration' || selectedTournament?.status === 'upcoming');
  const userEntry = tournamentDetails?.entries?.find(e => e.user_id === user?.id);
  const isFull = (tournamentDetails?.tournament?.entries_count || 0) >= (selectedTournament?.max_players || 0);

  // Debug logging
  console.log('[Tournament Details] Entry conditions:', {
    user: !!user,
    userRostersLength: userRosters.length,
    userHasRosters,
    tournamentStatus: selectedTournament?.status,
    canEnter,
    userEntry: !!userEntry,
    isFull
  });

  const handleTeamSelect = (slotIndex, roster) => {
    const newTeam = [...selectedTeam];
    newTeam[slotIndex] = roster;
    setSelectedTeam(newTeam);
  };

  const handleSubmitEntry = async () => {
    if (!selectedTeam[0] || !selectedTeam[1] || !selectedTeam[2]) {
      alert('Please select 3 Pokemon for your team');
      return;
    }

    // Validate roster IDs exist
    const roster1 = selectedTeam[0].roster_id;
    const roster2 = selectedTeam[1].roster_id;
    const roster3 = selectedTeam[2].roster_id;

    if (!roster1 || !roster2 || !roster3) {
      console.error('[Tournament Entry] Missing roster IDs:', {
        team: selectedTeam,
        ids: { roster1, roster2, roster3 }
      });
      alert('Error: Invalid Pokemon selection. Please reselect your team.');
      return;
    }

    // Debug logging
    console.log('[Tournament Entry] Selected Team:', selectedTeam);
    console.log('[Tournament Entry] Roster IDs being sent:', {
      pokemon1: roster1,
      pokemon2: roster2,
      pokemon3: roster3
    });

    try {
      await apiEnterTournament(
        selectedTournament.id,
        roster1,
        roster2,
        roster3
      );
      alert('Successfully entered tournament!');
      setSelectedTeam([null, null, null]);
      // Reload details
      const details = await apiGetTournamentDetails(selectedTournament.id);
      setTournamentDetails(details);
    } catch (error) {
      alert(`Failed to enter tournament: ${error.message}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-4 shadow-2xl">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Trophy size={32} className="text-red-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">{selectedTournament?.name}</h2>
            </div>
            <button
              onClick={() => {
                setGameState('tournaments');
                setSelectedTeam([null, null, null]);
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
            >
              Back to Tournaments
            </button>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-lg">
          <h3 className="text-xl font-bold mb-4">Tournament Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-bold">{selectedTournament?.status?.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div>
              <span className="text-gray-600">Players:</span>
              <span className="ml-2 font-bold">{tournamentDetails?.tournament?.entries_count || 0}/{selectedTournament?.max_players}</span>
            </div>
            <div>
              <span className="text-gray-600">Start Time:</span>
              <span className="ml-2 font-bold">{new Date(selectedTournament?.start_time).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Rounds:</span>
              <span className="ml-2 font-bold">{selectedTournament?.total_rounds}</span>
            </div>
          </div>
        </div>

        {/* User Entry Status */}
        {userEntry ? (
          <div className="bg-green-100 border-2 border-green-400 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-bold text-green-800 mb-2">You're Registered!</h3>
            <p className="text-green-700">Your team has been submitted for this tournament.</p>
            {selectedTournament?.status === 'in_progress' && (
              <button
                onClick={() => setGameState('tournamentBracket')}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
              >
                View Bracket
              </button>
            )}
          </div>
        ) : canEnter && !isFull ? (
          <>
            {/* Team Selection */}
            <div className="bg-white rounded-lg p-6 mb-4 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Select Your Team (3 Pokemon)</h3>

              {!userHasRosters && (
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-bold">You need at least 3 trained Pokemon to enter!</p>
                  <p className="text-yellow-700 text-sm">Complete careers to save trained Pokemon.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[0, 1, 2].map((slotIndex) => (
                  <div key={slotIndex} className="border-2 border-purple-300 rounded-lg p-4">
                    <h4 className="font-bold text-center mb-3">Pokemon {slotIndex + 1}</h4>
                    {selectedTeam[slotIndex] ? (
                      <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4">
                        <div className="flex justify-center mb-2">
                          {generatePokemonSprite(selectedTeam[slotIndex].type, selectedTeam[slotIndex].name)}
                        </div>
                        <h5 className="text-center font-bold">{selectedTeam[slotIndex].name}</h5>
                        <p className="text-center text-sm" style={{ color: getTypeColor(selectedTeam[slotIndex].type) }}>
                          {selectedTeam[slotIndex].type}
                        </p>
                        <div className="text-center mt-2">
                          <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(selectedTeam[slotIndex].grade) }}>
                            {selectedTeam[slotIndex].grade}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTeamSelect(slotIndex, null)}
                          className="w-full mt-3 bg-red-500 text-white py-1 rounded text-sm font-bold hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">No Pokemon selected</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Available Pokemon List */}
              <h4 className="font-bold mb-3">Available Trained Pokemon ({userRosters.length} rosters)</h4>
              {userRosters.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-2">No trained Pokemon found</p>
                  <p className="text-sm text-gray-400">You need to train at least 3 Pokemon before entering tournaments.</p>
                  <p className="text-sm text-gray-400 mt-2">Go to Career Mode to train Pokemon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {userRosters.map((roster, idx) => {
                  // Handle pokemon_data that might be string or already parsed object
                  let pokemonData = {};
                  try {
                    pokemonData = typeof roster.pokemon_data === 'string'
                      ? JSON.parse(roster.pokemon_data)
                      : (roster.pokemon_data || {});
                  } catch (e) {
                    console.error('[Tournament] Failed to parse pokemon_data:', roster.pokemon_data, e);
                  }

                  // Backend might use 'id' instead of 'roster_id'
                  const rosterId = roster.roster_id || roster.id;
                  const alreadySelected = selectedTeam.some(t => t && t.roster_id === rosterId);

                  return (
                    <div
                      key={rosterId || idx}
                      className={`bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-3 cursor-pointer transition ${
                        alreadySelected ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'
                      }`}
                      onClick={() => {
                        if (!alreadySelected) {
                          const emptySlot = selectedTeam.findIndex(t => t === null);
                          if (emptySlot !== -1) {
                            console.log('[Tournament] Selecting roster:', {
                              roster_id: rosterId,
                              full_roster: roster
                            });
                            handleTeamSelect(emptySlot, {
                              roster_id: rosterId,
                              name: pokemonData.name || 'Unknown',
                              type: pokemonData.primaryType || pokemonData.type || 'Normal',
                              grade: pokemonData.grade || 'E'
                            });
                          }
                        }
                      }}
                    >
                      <div className="flex justify-center mb-2">
                        {generatePokemonSprite(pokemonData.primaryType || pokemonData.type, pokemonData.name)}
                      </div>
                      <h5 className="text-center font-bold text-sm">{pokemonData.name || 'Unknown'}</h5>
                      <p className="text-center text-xs" style={{ color: getTypeColor(pokemonData.primaryType || pokemonData.type) }}>
                        {pokemonData.primaryType || pokemonData.type || 'Normal'}
                      </p>
                      <div className="text-center mt-1">
                        <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: getGradeColor(pokemonData.grade) }}>
                          {pokemonData.grade || 'E'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              <button
                onClick={handleSubmitEntry}
                disabled={!selectedTeam[0] || !selectedTeam[1] || !selectedTeam[2]}
                className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Team Entry
              </button>
            </div>
          </>
        ) : (
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6">
            {!user ? (
              <p className="text-center text-gray-700 font-bold">Login required to enter tournaments</p>
            ) : !userHasRosters ? (
              <div className="text-center">
                <p className="text-gray-700 font-bold mb-2">Need 3 Trained Pokemon</p>
                <p className="text-sm text-gray-600 mb-2">You have {userRosters.length} trained Pokemon</p>
                <p className="text-sm text-gray-500">Complete Career Mode with 3 Pokemon to unlock tournament entry!</p>
              </div>
            ) : isFull ? (
              <p className="text-center text-gray-700 font-bold">Tournament is full</p>
            ) : selectedTournament?.status === 'in_progress' ? (
              <>
                <p className="text-center text-gray-700 font-bold mb-4">Tournament in progress</p>
                <button
                  onClick={() => setGameState('tournamentBracket')}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition"
                >
                  View Bracket
                </button>
              </>
            ) : (
              <p className="text-center text-gray-700 font-bold">Tournament not accepting entries</p>
            )}
          </div>
        )}

        {/* Entries List */}
        {tournamentDetails?.entries && tournamentDetails.entries.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Registered Players ({tournamentDetails.entries.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tournamentDetails.entries.map((entry) => (
                <div key={entry.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{entry.username}</span>
                    <span className="text-sm text-gray-500">#{entry.bracket_position + 1}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Rating: {entry.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailsScreen;
