/**
 * GameContext
 *
 * Manages game state including current screen, selections, career data, and battles.
 */

import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  // Screen navigation
  const [gameState, setGameState] = useState('menu');

  // Pokemon and support selections
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedSupports, setSelectedSupports] = useState([]);
  const [selectedInspirations, setSelectedInspirations] = useState([]);

  // Battle state (used for displaying battle replays)
  const [battleState, setBattleState] = useState(null);
  const [battleSpeed, setBattleSpeed] = useState(1);

  // View modes within career
  const [viewMode, setViewMode] = useState('training');

  // Modals and UI state
  const [evolutionModal, setEvolutionModal] = useState(null);
  const [inspirationModal, setInspirationModal] = useState(null);
  const [pokeclockModal, setPokeclockModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Gacha state
  const [rollResult, setRollResult] = useState(null);

  // Sorting and filtering
  const [pokemonSortBy, setPokemonSortBy] = useState('default');
  const [supportSortBy, setSupportSortBy] = useState('rarity');
  const [trainedSortBy, setTrainedSortBy] = useState('date');
  const [trainedFilterGrade, setTrainedFilterGrade] = useState('all');
  const [pokemonFilterType, setPokemonFilterType] = useState('all');
  const [supportFilterRarity, setSupportFilterRarity] = useState('all');
  const [inspirationSortMode, setInspirationSortMode] = useState('stars');

  // Tournament state
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentBracket, setTournamentBracket] = useState(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState([null, null, null]);
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const [selectedReplay, setSelectedReplay] = useState(null);
  const [userRosters, setUserRosters] = useState([]);

  // PvP Matchmaking state
  const [pvpSelectedTeam, setPvPSelectedTeam] = useState([null, null, null]);
  const [pvpMatchId, setPvPMatchId] = useState(null);
  const [pvpMatchData, setPvPMatchData] = useState(null);

  // Career history (local - could be moved to server later)
  const [careerHistory, setCareerHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('pokemonCareerHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load career history:', error);
      return [];
    }
  });

  // Completed career data (for GameOver/Victory screens)
  const [completedCareerData, setCompletedCareerData] = useState(null);

  // Reset game state (for starting new career or returning to menu)
  const resetGameState = () => {
    setSelectedPokemon(null);
    setSelectedSupports([]);
    setSelectedInspirations([]);
    setBattleState(null);
    setViewMode('training');
    setRollResult(null);
  };

  const value = {
    // Screen state
    gameState,
    setGameState,

    // Selections
    selectedPokemon,
    setSelectedPokemon,
    selectedSupports,
    setSelectedSupports,
    selectedInspirations,
    setSelectedInspirations,

    // Career history (local storage - for career log display)
    careerHistory,
    setCareerHistory,

    // Completed career data (for GameOver/Victory screens)
    completedCareerData,
    setCompletedCareerData,

    // Battle
    battleState,
    setBattleState,
    battleSpeed,
    setBattleSpeed,

    // View modes
    viewMode,
    setViewMode,

    // Modals
    evolutionModal,
    setEvolutionModal,
    inspirationModal,
    setInspirationModal,
    pokeclockModal,
    setPokeclockModal,
    showHelp,
    setShowHelp,
    showResetConfirm,
    setShowResetConfirm,

    // Gacha
    rollResult,
    setRollResult,

    // Sorting/Filtering
    pokemonSortBy,
    setPokemonSortBy,
    supportSortBy,
    setSupportSortBy,
    trainedSortBy,
    setTrainedSortBy,
    trainedFilterGrade,
    setTrainedFilterGrade,
    pokemonFilterType,
    setPokemonFilterType,
    supportFilterRarity,
    setSupportFilterRarity,
    inspirationSortMode,
    setInspirationSortMode,

    // Tournaments
    tournaments,
    setTournaments,
    selectedTournament,
    setSelectedTournament,
    tournamentBracket,
    setTournamentBracket,
    tournamentsLoading,
    setTournamentsLoading,
    selectedTeam,
    setSelectedTeam,
    tournamentDetails,
    setTournamentDetails,
    selectedReplay,
    setSelectedReplay,
    userRosters,
    setUserRosters,

    // PvP Matchmaking
    pvpSelectedTeam,
    setPvPSelectedTeam,
    pvpMatchId,
    setPvPMatchId,
    pvpMatchData,
    setPvPMatchData,

    // Utilities
    resetGameState
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
