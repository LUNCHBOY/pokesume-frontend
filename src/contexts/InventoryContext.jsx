/**
 * InventoryContext
 *
 * Manages server-side inventory including Pokemon, supports, trained Pokemon, Primos, and Limit Break Shards.
 * All inventory operations are server-authoritative.
 * Supports Limit Break system for Pokemon and Support cards.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  apiGetPokemonInventory,
  apiAddPokemonToInventory,
  apiDeletePokemonFromInventory,
  apiLimitBreakPokemon,
  apiGetSupportInventory,
  apiAddSupportToInventory,
  apiDeleteSupportFromInventory,
  apiLimitBreakSupport,
  apiGetTrainedPokemon,
  apiDeleteTrainedPokemon,
  apiGetPrimos,
  apiUpdatePrimos
} from '../services/apiService';
import { getPokemonGrade } from '../utils/gameUtils';
import { normalizeSupportName } from '../shared/gameData';

// Max limit break level
const MAX_LIMIT_BREAK = 4;

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

  // Pokemon inventory (from gacha) - now includes limit break data
  const [pokemonInventory, setPokemonInventory] = useState([]);
  const [pokemonInventoryFull, setPokemonInventoryFull] = useState([]); // Full data with limit break
  const [pokemonTotal, setPokemonTotal] = useState(0);
  const [pokemonLoading, setPokemonLoading] = useState(false);

  // Support inventory (from gacha) - now includes limit break data
  const [supportInventory, setSupportInventory] = useState([]);
  const [supportInventoryFull, setSupportInventoryFull] = useState([]); // Full data with limit break
  const [supportTotal, setSupportTotal] = useState(0);
  const [supportLoading, setSupportLoading] = useState(false);

  // Trained Pokemon (completed careers)
  const [trainedPokemon, setTrainedPokemon] = useState([]);
  const [trainedTotal, setTrainedTotal] = useState(0);
  const [trainedLoading, setTrainedLoading] = useState(false);

  // Currencies
  const [primos, setPrimos] = useState(0);
  const [limitBreakShards, setLimitBreakShards] = useState(0);
  const [primosLoading, setPrimosLoading] = useState(false);

  // Helper to get limit break level for a Pokemon
  const getPokemonLimitBreak = (pokemonName) => {
    const pokemon = pokemonInventoryFull.find(p => p.pokemon_name === pokemonName);
    return pokemon?.limit_break_level || 0;
  };

  // Helper to get limit break level for a Support
  const getSupportLimitBreak = (supportName) => {
    const support = supportInventoryFull.find(s => s.support_name === supportName);
    return support?.limit_break_level || 0;
  };

  // Calculate stat bonus from limit break (5% per level for Pokemon)
  const getLimitBreakStatBonus = (limitBreakLevel) => {
    return 1 + (limitBreakLevel * 0.05); // 1.0, 1.05, 1.10, 1.15, 1.20
  };

  // Load Pokemon inventory
  const loadPokemonInventory = async (limit = 100, offset = 0) => {
    if (!authToken) return;

    setPokemonLoading(true);
    try {
      const data = await apiGetPokemonInventory(limit, offset, authToken);
      // Store full inventory data with limit break levels
      setPokemonInventoryFull(data.pokemon || []);
      // Extract just the pokemon names for backward compatibility
      const pokemonNames = (data.pokemon || []).map(item => item.pokemon_name);
      setPokemonInventory(pokemonNames);
      setPokemonTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load Pokemon inventory:', error);
    } finally {
      setPokemonLoading(false);
    }
  };

  // Add Pokemon to inventory (handles limit break system)
  const addPokemon = async (pokemonName, pokemonData, rarity = 'Common') => {
    if (!authToken) return null;

    try {
      const result = await apiAddPokemonToInventory(pokemonName, pokemonData, authToken, rarity);
      if (result) {
        // Refresh inventory to get updated limit break levels
        await loadPokemonInventory();
        // Update limit break shards if awarded
        if (result.isMaxLimitBreak && result.totalShards !== undefined) {
          setLimitBreakShards(result.totalShards);
        }
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

  // Limit break Pokemon using shards
  const limitBreakPokemonWithShards = async (pokemonId) => {
    if (!authToken) return null;

    try {
      const result = await apiLimitBreakPokemon(pokemonId, authToken);
      if (result && result.success) {
        // Update local shard count
        setLimitBreakShards(result.remainingShards);
        // Refresh inventory to get updated limit break level
        await loadPokemonInventory();
      }
      return result;
    } catch (error) {
      console.error('Failed to limit break Pokemon:', error);
      return null;
    }
  };

  // Load Support inventory
  const loadSupportInventory = async (limit = 100, offset = 0) => {
    if (!authToken) return;

    setSupportLoading(true);
    try {
      const data = await apiGetSupportInventory(limit, offset, authToken);
      // Store full inventory data with limit break levels
      // Normalize support names to handle legacy entries
      const normalizedSupports = (data.supports || []).map(item => ({
        ...item,
        support_name: normalizeSupportName(item.support_name)
      }));

      // Deduplicate by normalized name, keeping the entry with highest limit break level
      const deduplicatedMap = new Map();
      for (const support of normalizedSupports) {
        const existingSupport = deduplicatedMap.get(support.support_name);
        if (!existingSupport || (support.limit_break_level || 0) > (existingSupport.limit_break_level || 0)) {
          deduplicatedMap.set(support.support_name, support);
        }
      }
      const deduplicatedSupports = Array.from(deduplicatedMap.values());

      setSupportInventoryFull(deduplicatedSupports);
      // Extract just the support names for backward compatibility
      const supportNames = deduplicatedSupports.map(item => item.support_name);
      setSupportInventory(supportNames);
      setSupportTotal(deduplicatedSupports.length);
    } catch (error) {
      console.error('Failed to load Support inventory:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  // Add Support to inventory (handles limit break system)
  const addSupport = async (supportName, supportData, rarity = 'Common') => {
    if (!authToken) return null;

    try {
      const result = await apiAddSupportToInventory(supportName, supportData, authToken, rarity);
      if (result) {
        // Refresh inventory to get updated limit break levels
        await loadSupportInventory();
        // Update limit break shards if awarded
        if (result.isMaxLimitBreak && result.totalShards !== undefined) {
          setLimitBreakShards(result.totalShards);
        }
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

  // Limit break Support using shards
  const limitBreakSupportWithShards = async (supportId) => {
    if (!authToken) return null;

    try {
      const result = await apiLimitBreakSupport(supportId, authToken);
      if (result && result.success) {
        // Update local shard count
        setLimitBreakShards(result.remainingShards);
        // Refresh inventory to get updated limit break level
        await loadSupportInventory();
      }
      return result;
    } catch (error) {
      console.error('Failed to limit break Support:', error);
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
          strategyAptitudes: pokemonData.strategyAptitudes,
          strategy: pokemonData.strategy,
          strategyGrade: pokemonData.strategyGrade,
          inspirations: pokemonData.inspirations,
          grade: grade,
          completionType: pokemonData.completionType,
          gymsDefeated: pokemonData.gymsDefeated || 0
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

  // Delete trained Pokemon
  const deleteTrainedPokemon = async (trainedId) => {
    if (!authToken) return null;

    try {
      const result = await apiDeleteTrainedPokemon(trainedId, authToken);
      if (result) {
        // Refresh trained Pokemon list
        await loadTrainedPokemon();
      }
      return result;
    } catch (error) {
      console.error('Failed to delete trained Pokemon:', error);
      return null;
    }
  };

  // Load Primos and Limit Break Shards
  const loadPrimos = async () => {
    if (!authToken) return;

    setPrimosLoading(true);
    try {
      const data = await apiGetPrimos(authToken);
      setPrimos(data.primos || 0);
      setLimitBreakShards(data.limitBreakShards || 0);
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
        if (result.limitBreakShards !== undefined) {
          setLimitBreakShards(result.limitBreakShards);
        }
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
      setPokemonInventoryFull([]);
      setSupportInventory([]);
      setSupportInventoryFull([]);
      setTrainedPokemon([]);
      setPrimos(0);
      setLimitBreakShards(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, user]);

  // Shard cost constant
  const SHARD_COST_PER_LIMIT_BREAK = 10;

  const value = {
    // Pokemon inventory
    pokemonInventory,
    pokemonInventoryFull,
    pokemonTotal,
    pokemonLoading,
    loadPokemonInventory,
    addPokemon,
    deletePokemon,
    getPokemonLimitBreak,
    limitBreakPokemonWithShards,

    // Support inventory
    supportInventory,
    supportInventoryFull,
    supportTotal,
    supportLoading,
    loadSupportInventory,
    addSupport,
    deleteSupport,
    getSupportLimitBreak,
    limitBreakSupportWithShards,

    // Trained Pokemon
    trainedPokemon,
    trainedTotal,
    trainedLoading,
    loadTrainedPokemon,
    deleteTrainedPokemon,

    // Currencies
    primos,
    limitBreakShards,
    primosLoading,
    loadPrimos,
    updatePrimos,

    // Limit break helpers
    getLimitBreakStatBonus,
    MAX_LIMIT_BREAK,
    SHARD_COST_PER_LIMIT_BREAK
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};
