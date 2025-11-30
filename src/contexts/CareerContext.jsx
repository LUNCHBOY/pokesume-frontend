/**
 * CareerContext
 *
 * Manages server-authoritative career state.
 * All career operations go through the backend for persistence and anti-cheat.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  apiGetActiveCareer,
  apiStartCareer,
  apiUpdateCareer,
  apiProcessBattle,
  apiCompleteCareer,
  apiAbandonCareer,
  apiUsePokeclock,
  apiChangeStrategy,
  apiTrainStat,
  apiRest,
  apiGenerateTraining,
  apiTriggerEvent,
  apiResolveEvent,
  apiLearnAbility
} from '../services/apiService';
import { SUPPORT_CARDS, normalizeSupportName } from '../shared/gameData';

const CareerContext = createContext(null);

export const useCareer = () => {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within CareerProvider');
  }
  return context;
};

export const CareerProvider = ({ children }) => {
  const { authToken, user } = useAuth();

  // Career state
  const [careerData, setCareerData] = useState(null);
  const [hasActiveCareer, setHasActiveCareer] = useState(false);
  const [careerLoading, setCareerLoading] = useState(false);
  const [careerError, setCareerError] = useState(null);

  /**
   * Merge server career state with client-side moveHint additions.
   * The server doesn't track moveHints added client-side, so we need to preserve them.
   */
  const mergeCareerState = (serverState, currentState) => {
    if (!serverState) return serverState;
    if (!currentState) return serverState;

    // Get client-side moveHints that aren't in the server state
    const clientMoveHints = currentState.moveHints || {};
    const serverMoveHints = serverState.moveHints || {};
    const mergedMoveHints = { ...serverMoveHints };

    // Merge moveHints - keep the higher count for each move
    for (const [move, count] of Object.entries(clientMoveHints)) {
      mergedMoveHints[move] = Math.max(count, serverMoveHints[move] || 0);
    }

    // Get client-side learnableAbilities that aren't in server state
    const clientLearnables = currentState.pokemon?.learnableAbilities || [];
    const serverLearnables = serverState.pokemon?.learnableAbilities || [];
    const serverKnownAbilities = serverState.knownAbilities || [];

    // Find moves that were added client-side but not on server yet
    const clientOnlyMoves = clientLearnables.filter(move =>
      !serverLearnables.includes(move) && !serverKnownAbilities.includes(move)
    );

    // Also check moveHints keys - any hinted move should be preserved
    const hintedMoves = Object.keys(clientMoveHints);
    const hintedNotInServer = hintedMoves.filter(move =>
      !serverLearnables.includes(move) && !serverKnownAbilities.includes(move)
    );

    // Merge learnableAbilities - add client-only moves AND hinted moves not on server
    const allClientAdditions = [...new Set([...clientOnlyMoves, ...hintedNotInServer])];
    const mergedLearnables = [...serverLearnables, ...allClientAdditions];

    // Always log merge activity for debugging
    console.log('[mergeCareerState] Merge called:', {
      clientMoveHints,
      serverMoveHints,
      mergedMoveHints,
      clientLearnables: clientLearnables.length,
      serverLearnables: serverLearnables.length,
      clientOnlyMoves,
      hintedNotInServer,
      mergedLearnables: mergedLearnables.length
    });

    return {
      ...serverState,
      moveHints: mergedMoveHints,
      pokemon: {
        ...serverState.pokemon,
        learnableAbilities: mergedLearnables
      }
    };
  };

  /**
   * Update career data from server, preserving client-side moveHint additions
   */
  const updateCareerFromServer = (serverState) => {
    setCareerData(prev => mergeCareerState(serverState, prev));
  };

  // Load active career from server
  const loadActiveCareer = async () => {
    if (!authToken) return;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const data = await apiGetActiveCareer(authToken);
      setHasActiveCareer(data.hasActiveCareer);
      setCareerData(data.careerState || null);
    } catch (error) {
      console.error('Failed to load active career:', error);
      setCareerError(error.message);
      setHasActiveCareer(false);
      setCareerData(null);
    } finally {
      setCareerLoading(false);
    }
  };

  // Start new career
  const startCareer = async (pokemon, selectedSupports, selectedInspirations = []) => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      // Compute initial friendships from support card attributes
      const initialFriendships = {};
      selectedSupports.forEach(supportName => {
        const normalizedName = normalizeSupportName(supportName);
        const support = SUPPORT_CARDS[normalizedName];
        if (support) {
          initialFriendships[supportName] = support.initialFriendship || 0;
        }
      });

      const result = await apiStartCareer(pokemon, selectedSupports, selectedInspirations, initialFriendships, authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        setHasActiveCareer(true);
        return result.careerState;
      }
      return null;
    } catch (error) {
      console.error('Failed to start career:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Update career state
  const updateCareer = async (newCareerState) => {
    if (!authToken) return false;

    try {
      const result = await apiUpdateCareer(newCareerState, authToken);
      if (result && result.success) {
        setCareerData(newCareerState);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update career:', error);
      setCareerError(error.message);
      return false;
    }
  };

  // Process battle (server-authoritative)
  const processBattle = async (opponent, isGymLeader, isEventBattle = false) => {
    if (!authToken) {
      console.error('[processBattle] No auth token');
      return null;
    }

    setCareerLoading(true);
    setCareerError(null);
    try {
      console.log('[processBattle] Sending battle request:', { opponent, isGymLeader, isEventBattle });
      const result = await apiProcessBattle(opponent, isGymLeader, authToken, isEventBattle);
      console.log('[processBattle] Server response:', result);
      console.log('[processBattle] result.success:', result?.success, 'result.careerState exists:', !!result?.careerState);
      if (result && result.success) {
        // Update career data with the new state from server
        if (result.careerState) {
          console.log('[processBattle] Updating careerData. Turn:', result.careerState.turn, 'GymIndex:', result.careerState.currentGymIndex);
          updateCareerFromServer(result.careerState);
        } else {
          console.error('[processBattle] result.careerState is missing!', result);
        }
        return result.battleResult;
      }
      console.error('[processBattle] Server returned failure or missing battleResult:', result);
      return null;
    } catch (error) {
      console.error('[processBattle] Failed to process battle:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Complete career - returns the result including trainedPokemon data
  const completeCareer = async (completionType, inspirations = null) => {
    if (!authToken || !careerData) return null;

    // Save career data before clearing it (for use in GameOver screen)
    const savedCareerData = { ...careerData };

    // Include inspirations in career data for the server to save
    const careerDataWithInspirations = {
      ...careerData,
      inspirations: inspirations
    };

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiCompleteCareer(careerDataWithInspirations, completionType, authToken);
      if (result && result.success) {
        setCareerData(null);
        setHasActiveCareer(false);
        // Return the full result including trainedPokemon and savedCareerData
        return {
          ...result,
          savedCareerData: {
            ...savedCareerData,
            inspirations: inspirations
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to complete career:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Abandon career
  const abandonCareer = async () => {
    if (!authToken) return false;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiAbandonCareer(authToken);
      if (result && result.success) {
        setCareerData(null);
        setHasActiveCareer(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to abandon career:', error);
      setCareerError(error.message);
      return false;
    } finally {
      setCareerLoading(false);
    }
  };

  // Use pokeclock to retry gym battle
  const consumePokeclock = async () => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiUsePokeclock(authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to use pokeclock:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Change the Pokemon's active battle strategy
  const changeStrategy = async (strategy) => {
    if (!authToken) return null;

    try {
      const result = await apiChangeStrategy(strategy, authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to change strategy:', error);
      setCareerError(error.message);
      return null;
    }
  };

  // Server-authoritative training with state version for idempotency
  const trainStat = async (stat) => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const expectedVersion = careerData?.stateVersion;
      const result = await apiTrainStat(stat, expectedVersion, authToken);

      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result;
      }

      // Handle recoverable errors - sync state from server response
      if (result && result.currentState) {
        console.log('Recovering from state mismatch, syncing with server state');
        updateCareerFromServer(result.currentState);
        return { success: false, recovered: true, code: result.code };
      }

      // Network error - reload state from server
      if (result && result.code === 'NETWORK_ERROR') {
        console.log('Network error during training, reloading career state');
        await loadActiveCareer();
        return { success: false, recovered: true, code: 'NETWORK_ERROR' };
      }

      return null;
    } catch (error) {
      console.error('Failed to train stat:', error);
      setCareerError(error.message);
      // Attempt to reload career state on any error
      await loadActiveCareer();
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Server-authoritative rest with state version for idempotency
  const restOnServer = async () => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const expectedVersion = careerData?.stateVersion;
      const result = await apiRest(expectedVersion, authToken);

      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result;
      }

      // Handle recoverable errors - sync state from server response
      if (result && result.currentState) {
        console.log('Recovering from state mismatch, syncing with server state');
        updateCareerFromServer(result.currentState);
        return { success: false, recovered: true, code: result.code };
      }

      // Network error - reload state from server
      if (result && result.code === 'NETWORK_ERROR') {
        console.log('Network error during rest, reloading career state');
        await loadActiveCareer();
        return { success: false, recovered: true, code: 'NETWORK_ERROR' };
      }

      return null;
    } catch (error) {
      console.error('Failed to rest:', error);
      setCareerError(error.message);
      await loadActiveCareer();
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Server-authoritative training generation
  const generateTraining = async () => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiGenerateTraining(authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result.trainingOptions;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate training:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Server-authoritative event triggering
  const triggerEvent = async () => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiTriggerEvent(authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result.event;
      }
      return null;
    } catch (error) {
      console.error('Failed to trigger event:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Server-authoritative event resolution
  const resolveEvent = async (choiceIndex) => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiResolveEvent(choiceIndex, authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return result.outcome;
      }
      return null;
    } catch (error) {
      console.error('Failed to resolve event:', error);
      setCareerError(error.message);
      return null;
    } finally {
      setCareerLoading(false);
    }
  };

  // Server-authoritative ability learning
  const learnAbility = async (moveName) => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiLearnAbility(moveName, authToken);
      if (result && result.success) {
        updateCareerFromServer(result.careerState);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to learn ability:', error);
      setCareerError(error.message);
      return false;
    } finally {
      setCareerLoading(false);
    }
  };

  // Load career when user logs in
  useEffect(() => {
    if (authToken && user) {
      loadActiveCareer();
    } else {
      // Clear career when logged out
      setCareerData(null);
      setHasActiveCareer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, user]);

  const value = {
    // Career state
    careerData,
    hasActiveCareer,
    careerLoading,
    careerError,

    // Career operations
    loadActiveCareer,
    startCareer,
    updateCareer,
    processBattle,
    completeCareer,
    abandonCareer,
    consumePokeclock,
    changeStrategy,

    // Server-authoritative operations
    trainStat,
    restOnServer,
    generateTraining,
    triggerEvent,
    resolveEvent,
    learnAbility,

    // Local state setter (for optimistic updates)
    setCareerData
  };

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
};
