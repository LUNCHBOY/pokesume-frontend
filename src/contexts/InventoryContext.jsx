/**
 * InventoryContext
 *
 * Manages server-side inventory including Pokemon, supports, trained Pokemon, and Primos.
 * All inventory operations are server-authoritative.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  apiGetPokemonInventory,
  apiAddPokemonToInventory,
  apiDeletePokemonFromInventory,
  apiGetSupportInventory,
  apiAddSupportToInventory,
  apiDeleteSupportFromInventory,
  apiGetTrainedPokemon,
  apiGetPrimos,
  apiUpdatePrimos
} from '../services/apiService';
import { getPokemonGrade } from '../utils/gameUtils';

const InventoryContext = createContext(null);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const { authToken, user } = useAuth();

  // Pokemon inventory (from gacha)
  const [pokemonInventory, setPokemonInventory] = useState([]);
  const [pokemonTotal, setPokemonTotal] = useState(0);
  const [pokemonLoading, setPokemonLoading] = useState(false);

  // Support inventory (from gacha)
  const [supportInventory, setSupportInventory] = useState([]);
  const [supportTotal, setSupportTotal] = useState(0);
  const [supportLoading, setSupportLoading] = useState(false);

  // Trained Pokemon (completed careers)
  const [trainedPokemon, setTrainedPokemon] = useState([]);
  const [trainedTotal, setTrainedTotal] = useState(0);
  const [trainedLoading, setTrainedLoading] = useState(false);

  // Primos (currency)
  const [primos, setPrimos] = useState(0);
  const [primosLoading, setPrimosLoading] = useState(false);

  // Load Pokemon inventory
  const loadPokemonInventory = async (limit = 100, offset = 0) => {
    if (!authToken) return;

    setPokemonLoading(true);
    try {
      const data = await apiGetPokemonInventory(limit, offset, authToken);
      // Extract just the pokemon names from the inventory objects
      const pokemonNames = (data.pokemon || []).map(item => item.pokemon_name);
      setPokemonInventory(pokemonNames);
      setPokemonTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load Pokemon inventory:', error);
    } finally {
      setPokemonLoading(false);
    }
  };

  // Add Pokemon to inventory
  const addPokemon = async (pokemonName, pokemonData) => {
    if (!authToken) return null;

    try {
      const result = await apiAddPokemonToInventory(pokemonName, pokemonData, authToken);
      if (result) {
        // Refresh inventory
        await loadPokemonInventory();
      }
      return result;
    } catch (error) {
      console.error('Failed to add Pokemon:', error);
      return null;
    }
  };

  // Delete Pokemon from inventory
  const deletePokemon = async (pokemonId) => {
    if (!authToken) return null;

    try {
      const result = await apiDeletePokemonFromInventory(pokemonId, authToken);
      if (result) {
        // Refresh inventory
        await loadPokemonInventory();
      }
      return result;
    } catch (error) {
      console.error('Failed to delete Pokemon:', error);
      return null;
    }
  };

  // Load Support inventory
  const loadSupportInventory = async (limit = 100, offset = 0) => {
    if (!authToken) return;

    setSupportLoading(true);
    try {
      const data = await apiGetSupportInventory(limit, offset, authToken);
      // Extract just the support names from the inventory objects
      const supportNames = (data.supports || []).map(item => item.support_name);
      setSupportInventory(supportNames);
      setSupportTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load Support inventory:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  // Add Support to inventory
  const addSupport = async (supportName, supportData) => {
    if (!authToken) return null;

    try {
      const result = await apiAddSupportToInventory(supportName, supportData, authToken);
      if (result) {
        // Refresh inventory
        await loadSupportInventory();
      }
      return result;
    } catch (error) {
      console.error('Failed to add Support:', error);
      return null;
    }
  };

  // Delete Support from inventory
  const deleteSupport = async (supportId) => {
    if (!authToken) return null;

    try {
      const result = await apiDeleteSupportFromInventory(supportId, authToken);
      if (result) {
        // Refresh inventory
        await loadSupportInventory();
      }
      return result;
    } catch (error) {
      console.error('Failed to delete Support:', error);
      return null;
    }
  };

  // Load Trained Pokemon
  const loadTrainedPokemon = async (limit = 100, offset = 0) => {
    if (!authToken) return;

    setTrainedLoading(true);
    try {
      const data = await apiGetTrainedPokemon(limit, offset, authToken);
      // Normalize the data - flatten pokemon_data into the main object
      const normalizedPokemon = (data.trainedPokemon || []).map(row => {
        const pokemonData = row.pokemon_data || {};
        const stats = pokemonData.stats || {};
        // Calculate grade from stats if not saved
        const grade = pokemonData.grade || (Object.keys(stats).length > 0 ? getPokemonGrade(stats) : null);
        return {
          id: row.id,
          completedAt: row.created_at || pokemonData.completedAt,
          turnNumber: row.turn_number || pokemonData.turnNumber,
          // Flatten pokemon_data fields
          name: pokemonData.name,
          type: pokemonData.primaryType,
          primaryType: pokemonData.primaryType,
          stats: stats,
          abilities: pokemonData.abilities,
          typeAptitudes: pokemonData.typeAptitudes,
          strategy: pokemonData.strategy,
          strategyGrade: pokemonData.strategyGrade,
          inspirations: pokemonData.inspirations,
          grade: grade,
          completionType: pokemonData.completionType
        };
      });
      setTrainedPokemon(normalizedPokemon);
      setTrainedTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load trained Pokemon:', error);
    } finally {
      setTrainedLoading(false);
    }
  };

  // Load Primos
  const loadPrimos = async () => {
    if (!authToken) return;

    setPrimosLoading(true);
    try {
      const data = await apiGetPrimos(authToken);
      setPrimos(data.primos || 0);
    } catch (error) {
      console.error('Failed to load Primos:', error);
    } finally {
      setPrimosLoading(false);
    }
  };

  // Update Primos (add or subtract)
  const updatePrimos = async (amount) => {
    if (!authToken) return null;

    try {
      const result = await apiUpdatePrimos(amount, authToken);
      if (result) {
        setPrimos(result.primos);
      }
      return result;
    } catch (error) {
      console.error('Failed to update Primos:', error);
      return null;
    }
  };

  // Load all inventory data when user logs in
  useEffect(() => {
    if (authToken && user) {
      loadPokemonInventory();
      loadSupportInventory();
      loadTrainedPokemon();
      loadPrimos();
    } else {
      // Clear inventory when logged out
      setPokemonInventory([]);
      setSupportInventory([]);
      setTrainedPokemon([]);
      setPrimos(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, user]);

  const value = {
    // Pokemon inventory
    pokemonInventory,
    pokemonTotal,
    pokemonLoading,
    loadPokemonInventory,
    addPokemon,
    deletePokemon,

    // Support inventory
    supportInventory,
    supportTotal,
    supportLoading,
    loadSupportInventory,
    addSupport,
    deleteSupport,

    // Trained Pokemon
    trainedPokemon,
    trainedTotal,
    trainedLoading,
    loadTrainedPokemon,

    // Primos
    primos,
    primosLoading,
    loadPrimos,
    updatePrimos
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};
