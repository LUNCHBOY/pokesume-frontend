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

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Trophy, Clock, Users, CheckCircle, Search, Filter, X, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import {
  generatePokemonSprite,
  getGradeColor,
  getPokemonGrade,
  getAptitudeColor
} from '../utils/gameUtils';
import { TypeBadge, TypeIcon } from '../components/TypeIcon';
import { MOVES } from '../shared/gameData';
import StatRadarChart from '../components/StatRadarChart';
import { apiEnterTournament, apiGetTournamentDetails, apiGetTournamentBracket } from '../services/apiService';
import ProfileIcon from '../components/ProfileIcon';
import UserProfileModal from '../components/UserProfileModal';

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
    setTournamentDetails,
    setTournamentBracket
  } = useGame();
  const { user, authToken } = useAuth();
  const { trainedPokemon } = useInventory();

  const [selectedTeam, setSelectedTeam] = useState([null, null, null]);
  const [countdown, setCountdown] = useState('');
  const [detailPokemon, setDetailPokemon] = useState(null);
  // Profile modal state
  const [profileModal, setProfileModal] = useState({ isOpen: false, userId: null, username: null, profileIcon: null });

  // Long-press state for detail modal
  const longPressTimerRef = useRef(null);
  const longPressPokemonRef = useRef(null);
  const LONG_PRESS_DURATION = 500; // 500ms hold to trigger

  const handleLongPressStart = useCallback((pokemon) => {
    longPressPokemonRef.current = pokemon;
    longPressTimerRef.current = setTimeout(() => {
      setDetailPokemon(longPressPokemonRef.current);
    }, LONG_PRESS_DURATION);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressPokemonRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Sort and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'grade', 'type'
  const [filterType, setFilterType] = useState('all'); // 'all' or specific type
  const [showFilters, setShowFilters] = useState(false);

  // Get unique types from trained Pokemon
  const availableTypes = useMemo(() => {
    const types = new Set();
    trainedPokemon.forEach(p => {
      const type = p.primaryType || p.type;
      if (type) types.add(type);
    });
    return ['all', ...Array.from(types).sort()];
  }, [trainedPokemon]);

  // Filter and sort trained Pokemon
  const filteredAndSortedPokemon = useMemo(() => {
    const gradeOrder = {
      'UU+': 0, 'UU': 1, 'S+': 2, 'S': 3, 'A+': 4, 'A': 5,
      'B+': 6, 'B': 7, 'C+': 8, 'C': 9, 'D+': 10, 'D': 11,
      'E+': 12, 'E': 13, 'F+': 14, 'F': 15
    };
    let result = [...trainedPokemon];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => (p.name || '').toLowerCase().includes(query));
    }

    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(p => (p.primaryType || p.type) === filterType);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'grade':
          const gradeA = a.grade || getPokemonGrade(a.stats);
          const gradeB = b.grade || getPokemonGrade(b.stats);
          return (gradeOrder[gradeA] ?? 15) - (gradeOrder[gradeB] ?? 15);
        case 'type':
          return (a.primaryType || a.type || '').localeCompare(b.primaryType || b.type || '');
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return result;
  }, [trainedPokemon, searchQuery, sortBy, filterType]);

  // Calculate countdown to tournament start
  const getCountdown = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;

    if (diff <= 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  // Update countdown every second
  useEffect(() => {
    if (!selectedTournament?.start_time) return;

    const updateCountdown = () => {
      setCountdown(getCountdown(selectedTournament.start_time));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [selectedTournament?.start_time]);

  // Auto-refresh tournament details every 15 seconds to show status updates
  useEffect(() => {
    if (!selectedTournament?.id) return;

    const refreshDetails = async () => {
      try {
        const details = await apiGetTournamentDetails(selectedTournament.id);
        if (details) {
          setTournamentDetails(details);
        }
      } catch (error) {
        console.error('Failed to refresh tournament details:', error);
      }
    };

    // Refresh every 15 seconds
    const refreshInterval = setInterval(refreshDetails, 15000);

    return () => clearInterval(refreshInterval);
  }, [selectedTournament?.id, setTournamentDetails]);

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

  // Navigate to bracket screen (fetches bracket data first)
  const handleViewBracket = async () => {
    if (!selectedTournament?.id) return;
    try {
      const bracketData = await apiGetTournamentBracket(selectedTournament.id);
      setTournamentBracket(bracketData || []);
      setGameState('tournamentBracket');
    } catch (error) {
      console.error('Failed to load bracket:', error);
      alert('Failed to load tournament bracket');
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

  const getStatTotal = (stats) => {
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
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
              <span className="text-pocket-text-light text-xs">
                {selectedTournament?.status === 'in_progress' || selectedTournament?.status === 'completed'
                  ? 'Started'
                  : 'Starts In'}
              </span>
              <p className="font-bold text-pocket-text mt-1 flex items-center gap-1">
                <Clock size={14} />
                {selectedTournament?.status === 'in_progress' || selectedTournament?.status === 'completed'
                  ? new Date(selectedTournament?.start_time).toLocaleDateString()
                  : countdown}
              </p>
            </div>
            <div className="bg-pocket-bg rounded-xl p-3">
              <span className="text-pocket-text-light text-xs">Rounds</span>
              <p className="font-bold text-pocket-text mt-1">
                {selectedTournament?.current_round
                  ? `Round ${selectedTournament.current_round}/${selectedTournament?.total_rounds}`
                  : `${selectedTournament?.total_rounds} rounds`}
              </p>
            </div>
          </div>

          {/* Gym Badge / Battle Condition */}
          {(selectedTournament?.gymBadge || tournamentDetails?.tournament?.gymBadge) && (
            <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap size={16} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-purple-700 text-sm">
                    {(selectedTournament?.gymBadge || tournamentDetails?.tournament?.gymBadge)?.condition?.name}
                  </h4>
                  <p className="text-purple-600 text-[10px]">
                    {(selectedTournament?.gymBadge || tournamentDetails?.tournament?.gymBadge)?.leader}'s {(selectedTournament?.gymBadge || tournamentDetails?.tournament?.gymBadge)?.gym}
                  </p>
                </div>
                <div className="ml-auto">
                  <TypeBadge type={(selectedTournament?.gymBadge || tournamentDetails?.tournament?.gymBadge)?.type} size={14} />
                </div>
              </div>
              <p className="text-purple-700 text-xs leading-relaxed">
                {(selectedTournament?.gymBadge || tournamentDetails?.tournament?.gymBadge)?.condition?.description}
              </p>
            </div>
          )}

          {/* Tournament Progress Message */}
          {(selectedTournament?.status === 'registration' || selectedTournament?.status === 'upcoming') && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-700 text-xs font-medium text-center">
                {(tournamentDetails?.tournament?.entries_count || 0) < 2
                  ? '🎯 Waiting for at least 2 players to register. Tournament starts automatically when the timer reaches 0!'
                  : '✅ Ready to start! Tournament will begin automatically when the timer reaches 0.'}
              </p>
            </div>
          )}
          {selectedTournament?.status === 'in_progress' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-700 text-xs font-medium text-center">
                ⚔️ Tournament in progress! Battles are simulated automatically. View the bracket to see results.
              </p>
            </div>
          )}
          {selectedTournament?.status === 'completed' && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
              {(tournamentDetails?.tournament?.winner_username || selectedTournament?.winner_username) && (
                <div
                  className="flex items-center justify-center gap-3 mb-2 cursor-pointer hover:bg-amber-100 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  onClick={() => {
                    const winnerId = tournamentDetails?.tournament?.winner_user_id || selectedTournament?.winner_user_id;
                    const winnerUsername = tournamentDetails?.tournament?.winner_username || selectedTournament?.winner_username;
                    const winnerIcon = tournamentDetails?.tournament?.winner_profile_icon || selectedTournament?.winner_profile_icon;
                    if (winnerId) {
                      setProfileModal({
                        isOpen: true,
                        userId: winnerId,
                        username: winnerUsername,
                        profileIcon: winnerIcon
                      });
                    }
                  }}
                >
                  <Trophy size={20} className="text-amber-500" />
                  <ProfileIcon
                    icon={tournamentDetails?.tournament?.winner_profile_icon || selectedTournament?.winner_profile_icon || 'pikachu'}
                    size={32}
                    showBorder={true}
                  />
                  <span className="font-bold text-amber-700">
                    {tournamentDetails?.tournament?.winner_username || selectedTournament?.winner_username}
                  </span>
                  <Trophy size={20} className="text-amber-500" />
                </div>
              )}
              <p className="text-amber-700 text-xs font-medium text-center">
                Tournament completed! View the bracket to see the final results and watch battle replays.
              </p>
            </div>
          )}
          {selectedTournament?.status === 'cancelled' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-xs font-medium text-center">
                ❌ This tournament was cancelled due to insufficient players.
              </p>
            </div>
          )}
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
            {(selectedTournament?.status === 'in_progress' || selectedTournament?.status === 'completed') && (
              <button
                onClick={handleViewBracket}
                className="w-full pocket-btn-primary py-3"
              >
                {selectedTournament?.status === 'completed' ? 'View Results & Bracket' : 'View Bracket'}
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
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-pocket-text text-sm">
                  Available Trained Pokemon ({filteredAndSortedPokemon.length})
                </h4>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-type-psychic text-white' : 'bg-pocket-bg text-pocket-text-light hover:text-pocket-text'}`}
                >
                  <Filter size={16} />
                </button>
              </div>

              {/* Search and Filter Controls */}
              {showFilters && (
                <div className="bg-pocket-bg rounded-xl p-3 mb-3 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pocket-text-light" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-type-psychic"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-pocket-text-light hover:text-pocket-text"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Sort By */}
                    <div className="flex-1">
                      <label className="text-[10px] text-pocket-text-light font-bold mb-1 block">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-type-psychic bg-white"
                      >
                        <option value="name">Name</option>
                        <option value="grade">Grade</option>
                        <option value="type">Type</option>
                      </select>
                    </div>

                    {/* Filter by Type */}
                    <div className="flex-1">
                      <label className="text-[10px] text-pocket-text-light font-bold mb-1 block">Type</label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-type-psychic bg-white"
                      >
                        {availableTypes.map(type => (
                          <option key={type} value={type}>
                            {type === 'all' ? 'All Types' : type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate species warning */}
              <p className="text-[10px] text-pocket-text-light mb-2 italic">
                Note: You cannot select multiple Pokemon of the same species.
              </p>

              {trainedPokemon.length === 0 ? (
                <div className="bg-pocket-bg rounded-xl p-8 text-center">
                  <p className="text-pocket-text-light mb-2">No trained Pokemon found</p>
                  <p className="text-xs text-pocket-text-light">Complete careers to train Pokemon!</p>
                </div>
              ) : filteredAndSortedPokemon.length === 0 ? (
                <div className="bg-pocket-bg rounded-xl p-8 text-center">
                  <p className="text-pocket-text-light mb-2">No Pokemon match your filters</p>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                    className="text-xs text-type-psychic font-bold hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto bg-pocket-bg rounded-xl p-3">
                  {filteredAndSortedPokemon.map((pokemon, idx) => {
                    const rosterId = pokemon.id;
                    const pokemonName = pokemon.name || 'Unknown';
                    const alreadySelected = selectedTeam.some(t => t && t.roster_id === rosterId);
                    // Check if same species is already selected (different roster but same name)
                    const speciesAlreadySelected = selectedTeam.some(t => t && t.name === pokemonName && t.roster_id !== rosterId);
                    const isDisabled = alreadySelected || speciesAlreadySelected;

                    return (
                      <motion.div
                        key={rosterId || idx}
                        whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                        className={`bg-white rounded-xl p-2 cursor-pointer transition shadow-card relative select-none ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-card-hover'
                        }`}
                        onClick={() => {
                          if (!isDisabled) {
                            const emptySlot = selectedTeam.findIndex(t => t === null);
                            if (emptySlot !== -1) {
                              handleTeamSelect(emptySlot, {
                                roster_id: rosterId,
                                name: pokemonName,
                                type: pokemon.primaryType || pokemon.type || 'Normal',
                                grade: pokemon.grade || 'E'
                              });
                            }
                          }
                        }}
                        onMouseDown={() => !isDisabled && handleLongPressStart(pokemon)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => !isDisabled && handleLongPressStart(pokemon)}
                        onTouchEnd={handleLongPressEnd}
                        title={speciesAlreadySelected ? `${pokemonName} already selected` : alreadySelected ? 'Already in team' : `Hold for details, click to select`}
                      >
                        {speciesAlreadySelected && !alreadySelected && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white text-[6px] px-1 rounded font-bold">
                            DUP
                          </div>
                        )}
                        <div className="flex justify-center mb-1">
                          {generatePokemonSprite(pokemon.primaryType || pokemon.type, pokemon.name)}
                        </div>
                        <h5 className="text-center font-bold text-[10px] text-pocket-text truncate">{pokemonName}</h5>
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
                  onClick={handleViewBracket}
                  className="w-full pocket-btn-purple py-3"
                >
                  View Bracket
                </button>
              </>
            ) : selectedTournament?.status === 'completed' ? (
              <>
                <p className="text-center text-pocket-text font-bold mb-4">Tournament completed</p>
                <button
                  onClick={handleViewBracket}
                  className="w-full pocket-btn-purple py-3"
                >
                  View Results & Bracket
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

      {/* Pokemon Detail Modal */}
      <AnimatePresence>
        {detailPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailPokemon(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-card-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setDetailPokemon(null)}
                className="absolute top-3 right-3 p-2 text-pocket-text-light hover:text-pocket-text rounded-lg"
              >
                <X size={20} />
              </button>

              {(() => {
                const pokemon = detailPokemon;
                const grade = pokemon.grade || getPokemonGrade(pokemon.stats);
                const statTotal = getStatTotal(pokemon.stats);
                const colorToType = {
                  Red: 'Fire', Blue: 'Water', Green: 'Grass',
                  Yellow: 'Electric', Purple: 'Psychic', Orange: 'Fighting'
                };

                return (
                  <>
                    {/* Pokemon sprite and name */}
                    <div className="text-center mb-4">
                      <div className="mb-2 flex justify-center">
                        {generatePokemonSprite(pokemon.primaryType || pokemon.type, pokemon.name)}
                      </div>
                      <h3 className="font-bold text-xl text-pocket-text">{pokemon.name}</h3>
                      <div className="flex justify-center gap-2 mt-2">
                        <TypeBadge type={pokemon.primaryType || pokemon.type} size={16} />
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: getGradeColor(grade) }}
                        >
                          {grade}
                        </span>
                        <span className="text-sm text-pocket-text-light">
                          Total: {statTotal}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    {pokemon.stats && (
                      <div className="bg-pocket-bg rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-pocket-text text-sm mb-2">Stats</h4>
                        <StatRadarChart stats={pokemon.stats} size={160} color="#3B82F6" />
                      </div>
                    )}

                    {/* Strategy */}
                    {pokemon.strategy && (
                      <div className="bg-purple-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-purple-700 text-sm mb-1">Strategy</h4>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-600">{pokemon.strategy}</span>
                          {pokemon.strategyGrade && (
                            <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-700 text-xs font-bold">
                              {pokemon.strategyGrade}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Type Aptitudes */}
                    {pokemon.typeAptitudes && Object.keys(pokemon.typeAptitudes).length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-blue-700 text-sm mb-2">Type Aptitudes</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pokemon.typeAptitudes).map(([color, aptGrade]) => {
                            const typeName = colorToType[color] || color;
                            return (
                              <div
                                key={color}
                                className="flex justify-between items-center px-2 py-1 rounded bg-white"
                              >
                                <TypeIcon type={typeName} size={16} />
                                <span
                                  className="px-2 py-0.5 rounded text-white font-bold"
                                  style={{ backgroundColor: getAptitudeColor(aptGrade) }}
                                >
                                  {aptGrade}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Learned Moves */}
                    {pokemon.abilities && pokemon.abilities.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-blue-700 text-sm mb-2">Learned Moves ({pokemon.abilities.length})</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs max-h-32 overflow-y-auto">
                          {pokemon.abilities.map((moveName, idx) => {
                            const move = MOVES && MOVES[moveName];
                            const moveType = move?.type || pokemon.primaryType || pokemon.type || 'Normal';
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-white"
                              >
                                <TypeBadge type={moveType} size={10} />
                                <span className="truncate text-pocket-text">{moveName}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inspirations */}
                    {pokemon.inspirations && pokemon.inspirations.stat && pokemon.inspirations.aptitude && (
                      <div className="bg-amber-50 rounded-xl p-3 mb-3">
                        <h4 className="font-bold text-amber-700 text-sm mb-2">Inspirations</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-pocket-text">{pokemon.inspirations.stat.name}</span>
                            <div className="flex gap-0.5">
                              {[...Array(pokemon.inspirations.stat.stars || 0)].map((_, i) => (
                                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-pocket-text">
                              {colorToType[pokemon.inspirations.aptitude.name] || pokemon.inspirations.aptitude.name}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(pokemon.inspirations.aptitude.stars || 0)].map((_, i) => (
                                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          {pokemon.inspirations.strategy && (
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-pocket-text">{pokemon.inspirations.strategy.name}</span>
                              <div className="flex gap-0.5">
                                {[...Array(pokemon.inspirations.strategy.stars || 0)].map((_, i) => (
                                  <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      onClick={() => {
                        const alreadySelected = selectedTeam.some(t => t && t.roster_id === detailPokemon.id);
                        const speciesAlreadySelected = selectedTeam.some(t => t && t.name === detailPokemon.name && t.roster_id !== detailPokemon.id);
                        if (!alreadySelected && !speciesAlreadySelected) {
                          const emptySlot = selectedTeam.findIndex(t => t === null);
                          if (emptySlot !== -1) {
                            handleTeamSelect(emptySlot, {
                              roster_id: detailPokemon.id,
                              name: detailPokemon.name,
                              type: detailPokemon.primaryType || detailPokemon.type || 'Normal',
                              grade: detailPokemon.grade || 'E'
                            });
                          }
                        }
                        setDetailPokemon(null);
                      }}
                      disabled={selectedTeam.some(t => t && (t.roster_id === detailPokemon.id || t.name === detailPokemon.name))}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${
                        selectedTeam.some(t => t && t.roster_id === detailPokemon.id)
                          ? 'bg-green-500 text-white'
                          : selectedTeam.some(t => t && t.name === detailPokemon.name)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-type-psychic text-white hover:bg-purple-700'
                      }`}
                    >
                      {selectedTeam.some(t => t && t.roster_id === detailPokemon.id)
                        ? 'Already Selected'
                        : selectedTeam.some(t => t && t.name === detailPokemon.name)
                          ? 'Species Already Selected'
                          : 'Select for Team'}
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={profileModal.userId}
        username={profileModal.username}
        profileIcon={profileModal.profileIcon}
        isOpen={profileModal.isOpen}
        onClose={() => setProfileModal({ isOpen: false, userId: null, username: null, profileIcon: null })}
      />
    </div>
  );
};

export default TournamentDetailsScreen;
