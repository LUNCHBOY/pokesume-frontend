/**
 * Pokesume - Pokemon Career Training Game
 *
 * Modular Architecture Version
 * - Server-authoritative gameplay
 * - Mandatory authentication
 * - Separated concerns and modular components
 */

import React from 'react';
import { AppProviders } from './contexts/AppProviders';
import { useAuth } from './contexts/AuthContext';
import { useGame } from './contexts/GameContext';
import AuthWrapper from './components/AuthWrapper';

// Import game data
import { ICONS } from './shared/gameData';

// Import screens
import MenuScreen from './screens/MenuScreen';
import PokemonSelectionScreen from './screens/PokemonSelectionScreen';
import InspirationSelectionScreen from './screens/InspirationSelectionScreen';
import SupportSelectionScreen from './screens/SupportSelectionScreen';
import MyPokemonScreen from './screens/MyPokemonScreen';
import MySupportScreen from './screens/MySupportScreen';
import TrainedPokemonScreen from './screens/TrainedPokemonScreen';
import GachaScreen from './screens/GachaScreen';
import SupportGachaScreen from './screens/SupportGachaScreen';
import VictoryScreen from './screens/VictoryScreen';
import GameOverScreen from './screens/GameOverScreen';
import CareerEndScreen from './screens/CareerEndScreen';
import BattleScreen from './screens/BattleScreen';
import CareerScreen from './screens/CareerScreen';
import HistoryScreen from './screens/HistoryScreen';
import TournamentsScreen from './screens/TournamentsScreen';
import TournamentDetailsScreen from './screens/TournamentDetailsScreen';
import TournamentBracketScreen from './screens/TournamentBracketScreen';
import TournamentReplayScreen from './screens/TournamentReplayScreen';

// Temporary placeholder component until screens are extracted
const PlaceholderScreen = ({ screenName }) => {
  const { gameState, setGameState } = useGame();

  return (
    <div className="w-full h-screen bg-gradient-to-b from-purple-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-2xl">
        <h1 className="text-3xl font-bold mb-4 text-purple-600">
          {screenName || gameState}
        </h1>
        <p className="text-gray-600 mb-6">
          This screen is being modularized. Current state: {gameState}
        </p>
        <button
          onClick={() => setGameState('menu')}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
};

/**
 * GameRouter
 *
 * Routes to different screens based on gameState
 */
const GameRouter = () => {
  const { gameState } = useGame();

  // Routing to different screens based on gameState
  switch (gameState) {
    case 'menu':
      return <MenuScreen />;

    case 'pokemonSelect':
    case 'pokemonSelection':
      return <PokemonSelectionScreen />;

    case 'inspirationSelect':
    case 'inspirationSelection':
      return <InspirationSelectionScreen />;

    case 'supportSelect':
    case 'supportSelection':
      return <SupportSelectionScreen />;

    // Inventory Screens
    case 'myPokemon':
    case 'pokemonInventory':
      return <MyPokemonScreen />;

    case 'mySupports':
    case 'supportInventory':
      return <MySupportScreen />;

    case 'trainedPokemon':
      return <TrainedPokemonScreen />;

    // Gacha Screens
    case 'gacha':
      return <GachaScreen />;

    case 'supportGacha':
      return <SupportGachaScreen />;

    // Career and Battle Screens
    case 'career':
      return <CareerScreen />;

    case 'battle':
      return <BattleScreen />;

    case 'victory':
      return <VictoryScreen />;

    case 'gameOver':
      return <GameOverScreen />;

    case 'careerEnd':
      return <CareerEndScreen />;

    // History Screen
    case 'history':
      return <HistoryScreen />;

    // Tournament Screens
    case 'tournaments':
      return <TournamentsScreen />;

    case 'tournamentDetails':
      return <TournamentDetailsScreen />;

    case 'tournamentBracket':
      return <TournamentBracketScreen />;

    case 'tournamentReplay':
      return <TournamentReplayScreen />;

    case 'leaderboard':
      return <PlaceholderScreen screenName="Leaderboard Screen" />;

    default:
      return <PlaceholderScreen screenName="Unknown Screen" />;
  }
};

/**
 * Main App Component (Authenticated)
 *
 * Only rendered after successful authentication
 */
const AuthenticatedApp = () => {
  return (
    <div className="w-full min-h-screen">
      <GameRouter />
    </div>
  );
};

/**
 * Root App Component
 *
 * Entry point - sets up providers and authentication gate
 */
export default function App() {
  return (
    <AppProviders>
      <AuthWrapper>
        <AuthenticatedApp />
      </AuthWrapper>
    </AppProviders>
  );
}
