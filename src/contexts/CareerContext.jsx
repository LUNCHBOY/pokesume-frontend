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
  apiTrainStat,
  apiGenerateTraining,
  apiTriggerEvent,
  apiResolveEvent,
  apiLearnAbility
} from '../services/apiService';

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
  const startCareer = async (pokemon, selectedSupports) => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiStartCareer(pokemon, selectedSupports, authToken);
      if (result && result.success) {
        setCareerData(result.careerState);
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
  const processBattle = async (opponent, isGymLeader) => {
    if (!authToken) {
      console.error('[processBattle] No auth token');
      return null;
    }

    setCareerLoading(true);
    setCareerError(null);
    try {
      console.log('[processBattle] Sending battle request:', { opponent, isGymLeader });
      const result = await apiProcessBattle(opponent, isGymLeader, authToken);
      console.log('[processBattle] Server response:', result);
      if (result && result.success) {
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

  // Complete career
  const completeCareer = async (completionType) => {
    if (!authToken || !careerData) return false;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiCompleteCareer(careerData, completionType, authToken);
      if (result && result.success) {
        setCareerData(null);
        setHasActiveCareer(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to complete career:', error);
      setCareerError(error.message);
      return false;
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

  // Server-authoritative training
  const trainStat = async (stat) => {
    if (!authToken) return null;

    setCareerLoading(true);
    setCareerError(null);
    try {
      const result = await apiTrainStat(stat, authToken);
      if (result && result.success) {
        setCareerData(result.careerState);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to train stat:', error);
      setCareerError(error.message);
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
        setCareerData(result.careerState);
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
        setCareerData(result.careerState);
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
        setCareerData(result.careerState);
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
        setCareerData(result.careerState);
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

    // Server-authoritative operations
    trainStat,
    generateTraining,
    triggerEvent,
    resolveEvent,
    learnAbility,

    // Local state setter (for optimistic updates)
    setCareerData
  };

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
};
