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
import { ArrowLeft, Trophy, Clock, Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor
} from '../utils/gameUtils';
import { TypeBadge } from '../components/TypeIcon';
import { apiEnterTournament, apiGetTournamentDetails } from '../services/apiService';

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

const TournamentDetailsScreen = () => {
  const {
    setGameState,
    selectedTournament,
    tournamentDetails,
    setTournamentDetails
  } = useGame();
  const { user, authToken } = useAuth();
  const { trainedPokemon } = useInventory();

  const [selectedTeam, setSelectedTeam] = useState([null, null, null]);

  const userHasRosters = trainedPokemon.length >= 3;
  const canEnter = user && userHasRosters &&
                   (selectedTournament?.status === 'registration' || selectedTournament?.status === 'upcoming');
  const userEntry = tournamentDetails?.entries?.find(e => e.user_id === user?.id);
  const isFull = (tournamentDetails?.tournament?.entries_count || 0) >= (selectedTournament?.max_players || 0);

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

    const roster1 = selectedTeam[0].roster_id;
    const roster2 = selectedTeam[1].roster_id;
    const roster3 = selectedTeam[2].roster_id;

    if (!roster1 || !roster2 || !roster3) {
      alert('Error: Invalid Pokemon selection. Please reselect your team.');
      return;
    }

    try {
      await apiEnterTournament(
        selectedTournament.id,
        roster1,
        roster2,
        roster3,
        authToken
      );
      alert('Successfully entered tournament!');
      setSelectedTeam([null, null, null]);
      const details = await apiGetTournamentDetails(selectedTournament.id);
      setTournamentDetails(details);
    } catch (error) {
      alert(`Failed to enter tournament: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registration':
      case 'upcoming':
        return '#6890F0';
      case 'in_progress':
        return '#78C850';
      case 'completed':
        return '#A8A878';
      default:
        return '#A8A878';
    }
  };

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
            onClick={() => {
              setGameState('tournaments');
              setSelectedTeam([null, null, null]);
            }}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-type-psychic" />
            <span className="font-bold text-pocket-text truncate max-w-[200px]">{selectedTournament?.name}</span>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-4xl mx-auto"
      >
        {/* Tournament Info Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-card p-5 mb-4"
        >
          <h3 className="font-bold text-pocket-text mb-4">Tournament Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-pocket-bg rounded-xl p-3">
              <span className="text-pocket-text-light text-xs">Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                  style={{ backgroundColor: getStatusColor(selectedTournament?.status) }}
                >
                  {selectedTournament?.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="bg-pocket-bg rounded-xl p-3">
              <span className="text-pocket-text-light text-xs">Players</span>
              <p className="font-bold text-pocket-text mt-1 flex items-center gap-1">
                <Users size={14} />
                {tournamentDetails?.tournament?.entries_count || 0}/{selectedTournament?.max_players}
              </p>
            </div>
            <div className="bg-pocket-bg rounded-xl p-3">
              <span className="text-pocket-text-light text-xs">Start Time</span>
              <p className="font-bold text-pocket-text mt-1 flex items-center gap-1">
                <Clock size={14} />
                {new Date(selectedTournament?.start_time).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-pocket-bg rounded-xl p-3">
              <span className="text-pocket-text-light text-xs">Rounds</span>
              <p className="font-bold text-pocket-text mt-1">
                {selectedTournament?.total_rounds} rounds
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Entry Status */}
        {userEntry ? (
          <motion.div
            variants={itemVariants}
            className="bg-pocket-green/10 border-2 border-pocket-green rounded-2xl p-5 mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} className="text-pocket-green" />
              <h3 className="font-bold text-pocket-green">You're Registered!</h3>
            </div>
            <p className="text-pocket-green/80 text-sm mb-4">Your team has been submitted for this tournament.</p>
            {selectedTournament?.status === 'in_progress' && (
              <button
                onClick={() => setGameState('tournamentBracket')}
                className="w-full pocket-btn-primary py-3"
              >
                View Bracket
              </button>
            )}
          </motion.div>
        ) : canEnter && !isFull ? (
          <>
            {/* Team Selection */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-card p-5 mb-4"
            >
              <h3 className="font-bold text-pocket-text mb-4">Select Your Team (3 Pokemon)</h3>

              {!userHasRosters && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-700 font-bold text-sm">You need at least 3 trained Pokemon to enter!</p>
                  <p className="text-amber-600 text-xs mt-1">Complete careers to save trained Pokemon.</p>
                </div>
              )}

              {/* Team Slots */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[0, 1, 2].map((slotIndex) => (
                  <div key={slotIndex} className="bg-pocket-bg rounded-xl p-3 border-2 border-type-psychic/30">
                    <h4 className="font-bold text-center text-xs text-pocket-text-light mb-2">Pokemon {slotIndex + 1}</h4>
                    {selectedTeam[slotIndex] ? (
                      <div>
                        <div className="flex justify-center mb-2">
                          {generatePokemonSprite(selectedTeam[slotIndex].type, selectedTeam[slotIndex].name)}
                        </div>
                        <h5 className="text-center font-bold text-sm text-pocket-text">{selectedTeam[slotIndex].name}</h5>
                        <div className="flex justify-center mt-1">
                          <TypeBadge type={selectedTeam[slotIndex].type} size={12} />
                        </div>
                        <div className="flex justify-center mt-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: getGradeColor(selectedTeam[slotIndex].grade) }}
                          >
                            {selectedTeam[slotIndex].grade}
                          </span>
                        </div>
                        <button
                          onClick={() => handleTeamSelect(slotIndex, null)}
                          className="w-full mt-2 bg-pocket-red text-white py-1 rounded-lg text-xs font-bold hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-pocket-text-light">Empty Slot</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Available Pokemon List */}
              <h4 className="font-bold text-pocket-text text-sm mb-3">Available Trained Pokemon ({trainedPokemon.length})</h4>
              {trainedPokemon.length === 0 ? (
                <div className="bg-pocket-bg rounded-xl p-8 text-center">
                  <p className="text-pocket-text-light mb-2">No trained Pokemon found</p>
                  <p className="text-xs text-pocket-text-light">Complete careers to train Pokemon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto bg-pocket-bg rounded-xl p-3">
                  {trainedPokemon.map((pokemon, idx) => {
                    const rosterId = pokemon.id;
                    const alreadySelected = selectedTeam.some(t => t && t.roster_id === rosterId);

                    return (
                      <motion.div
                        key={rosterId || idx}
                        whileHover={{ scale: alreadySelected ? 1 : 1.05 }}
                        whileTap={{ scale: alreadySelected ? 1 : 0.95 }}
                        className={`bg-white rounded-xl p-2 cursor-pointer transition shadow-card ${
                          alreadySelected ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-card-hover'
                        }`}
                        onClick={() => {
                          if (!alreadySelected) {
                            const emptySlot = selectedTeam.findIndex(t => t === null);
                            if (emptySlot !== -1) {
                              handleTeamSelect(emptySlot, {
                                roster_id: rosterId,
                                name: pokemon.name || 'Unknown',
                                type: pokemon.primaryType || pokemon.type || 'Normal',
                                grade: pokemon.grade || 'E'
                              });
                            }
                          }
                        }}
                      >
                        <div className="flex justify-center mb-1">
                          {generatePokemonSprite(pokemon.primaryType || pokemon.type, pokemon.name)}
                        </div>
                        <h5 className="text-center font-bold text-[10px] text-pocket-text truncate">{pokemon.name || 'Unknown'}</h5>
                        <div className="flex justify-center mt-1">
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white"
                            style={{ backgroundColor: getGradeColor(pokemon.grade) }}
                          >
                            {pokemon.grade || 'E'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleSubmitEntry}
                disabled={!selectedTeam[0] || !selectedTeam[1] || !selectedTeam[2]}
                className="w-full mt-6 pocket-btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Team Entry
              </button>
            </motion.div>
          </>
        ) : (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-card p-6 mb-4"
          >
            {!user ? (
              <p className="text-center text-pocket-text font-bold">Login required to enter tournaments</p>
            ) : !userHasRosters ? (
              <div className="text-center">
                <p className="text-pocket-text font-bold mb-2">Need 3 Trained Pokemon</p>
                <p className="text-sm text-pocket-text-light mb-2">You have {trainedPokemon.length} trained Pokemon</p>
                <p className="text-xs text-pocket-text-light">Complete Career Mode with 3 Pokemon to unlock tournament entry!</p>
              </div>
            ) : isFull ? (
              <p className="text-center text-pocket-text font-bold">Tournament is full</p>
            ) : selectedTournament?.status === 'in_progress' ? (
              <>
                <p className="text-center text-pocket-text font-bold mb-4">Tournament in progress</p>
                <button
                  onClick={() => setGameState('tournamentBracket')}
                  className="w-full pocket-btn-purple py-3"
                >
                  View Bracket
                </button>
              </>
            ) : (
              <p className="text-center text-pocket-text font-bold">Tournament not accepting entries</p>
            )}
          </motion.div>
        )}

        {/* Entries List */}
        {tournamentDetails?.entries && tournamentDetails.entries.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-card p-5"
          >
            <h3 className="font-bold text-pocket-text mb-4">Registered Players ({tournamentDetails.entries.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tournamentDetails.entries.map((entry) => (
                <div key={entry.id} className="bg-pocket-bg rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-pocket-text text-sm truncate">{entry.username}</span>
                    <span className="text-[10px] text-pocket-text-light">#{entry.bracket_position + 1}</span>
                  </div>
                  <div className="text-[10px] text-pocket-text-light mt-1">
                    Rating: {entry.rating}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TournamentDetailsScreen;
