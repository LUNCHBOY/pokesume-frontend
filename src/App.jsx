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
import { useGame } from './contexts/GameContext';
import AuthWrapper from './components/AuthWrapper';
import BattleController from './components/BattleController';

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
import PvPScreen from './screens/PvPScreen';
import PvPTeamSelectScreen from './screens/PvPTeamSelectScreen';
import PvPQueueScreen from './screens/PvPQueueScreen';
import PvPReplayScreen from './screens/PvPReplayScreen';
import GameGuideScreen from './screens/GameGuideScreen';
import ProfileScreen from './screens/ProfileScreen';

/**
 * GameRouter
 *
 * Routes to different screens based on gameState
 */
const GameRouter = () => {
  const { gameState, setGameState } = useGame();

  // Redirect unknown states to menu
  React.useEffect(() => {
    const validStates = [
      'menu', 'pokemonSelect', 'pokemonSelection', 'inspirationSelect', 'inspirationSelection',
      'supportSelect', 'supportSelection', 'myPokemon', 'pokemonInventory', 'mySupports',
      'supportInventory', 'trainedPokemon', 'gacha', 'supportGacha', 'career', 'battle',
      'victory', 'gameOver', 'careerEnd', 'history', 'tournaments', 'tournamentDetails',
      'tournamentBracket', 'tournamentReplay', 'pvp', 'pvpTeamSelect', 'pvpQueue', 'pvpReplay',
      'guide', 'profile'
    ];

    if (!validStates.includes(gameState)) {
      console.warn(`Unknown game state: ${gameState}, redirecting to menu`);
      setGameState('menu');
    }
  }, [gameState, setGameState]);

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
      return <TournamentsScreen key={Date.now()} />;

    case 'tournamentDetails':
      return <TournamentDetailsScreen />;

    case 'tournamentBracket':
      return <TournamentBracketScreen />;

    case 'tournamentReplay':
      return <TournamentReplayScreen />;

    // PvP Matchmaking Screens
    case 'pvp':
      return <PvPScreen />;

    case 'pvpTeamSelect':
      return <PvPTeamSelectScreen />;

    case 'pvpQueue':
      return <PvPQueueScreen />;

    case 'pvpReplay':
      return <PvPReplayScreen />;

    case 'guide':
      return <GameGuideScreen />;

    case 'profile':
      return <ProfileScreen />;

    default:
      return <MenuScreen />;
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
      <BattleController />
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
