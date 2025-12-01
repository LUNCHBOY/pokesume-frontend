/**
 * API Service
 *
 * Centralized API communication layer for all backend requests.
 * Handles authentication, career, inventory, tournaments, and PVP endpoints.
 */

// API Configuration
const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL ||
     process.env.REACT_APP_API_URL ||
     'https://pokesume-backend-production.up.railway.app/api')
  : 'https://pokesume-backend-production.up.railway.app/api';

console.log('[API] Using API_URL:', API_URL);

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const apiRegister = async (username, email, password) => {
  try {
    console.log('apiRegister called:', { username, email });

    const url = `${API_URL}/auth/register`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('apiRegister error:', error);
    throw error;
  }
};

export const apiLogin = async (username, password) => {
  try {
    console.log('apiLogin called:', { username });

    const url = `${API_URL}/auth/login`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('apiLogin error:', error);
    throw error;
  }
};

export const apiLogout = () => {
  localStorage.removeItem('pokesume_token');
  localStorage.removeItem('pokesume_user');
};

export const apiGoogleLogin = async (credential) => {
  try {
    console.log('apiGoogleLogin called');

    const url = `${API_URL}/auth/google`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ credential })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Google login failed');
    }

    return data;
  } catch (error) {
    console.error('apiGoogleLogin error:', error);
    throw error;
  }
};

export const apiSetUsername = async (username, authToken) => {
  try {
    console.log('apiSetUsername called:', { username });

    const url = `${API_URL}/auth/set-username`;
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ username })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to set username');
    }

    return data;
  } catch (error) {
    console.error('apiSetUsername error:', error);
    throw error;
  }
};

// ============================================================================
// POKEMON/ROSTER API
// ============================================================================

export const apiSaveRoster = async (pokemonData, turnNumber, authToken) => {
  if (!authToken) {
    console.log('[apiSaveRoster] No auth token, cannot save');
    return null;
  }

  console.log('[apiSaveRoster] Saving roster:', {
    pokemon: pokemonData.name,
    turn: turnNumber,
    hasAuthToken: !!authToken
  });

  try {
    const response = await fetch(`${API_URL}/pokemon/roster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ pokemonData, turnNumber })
    });

    console.log('[apiSaveRoster] Response status:', response.status);
    const data = await response.json();
    console.log('[apiSaveRoster] Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save roster');
    }

    return data;
  } catch (error) {
    console.error('Save roster error:', error);
    return null;
  }
};

export const apiGetRosters = async (limit = 10, offset = 0, authToken) => {
  if (!authToken) {
    console.log('[apiGetRosters] No auth token, returning empty array');
    return [];
  }

  try {
    console.log('[apiGetRosters] Fetching from:', `${API_URL}/pokemon/rosters?limit=${limit}&offset=${offset}`);
    const response = await fetch(`${API_URL}/pokemon/rosters?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('[apiGetRosters] Response status:', response.status);
    const data = await response.json();
    console.log('[apiGetRosters] Response data:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch rosters');
    }

    console.log('[apiGetRosters] Returning rosters:', data.rosters);
    return data.rosters || [];
  } catch (error) {
    console.error('[apiGetRosters] Error:', error);
    return [];
  }
};

// ============================================================================
// PVP API
// ============================================================================

export const apiGetOpponents = async (limit = 20, ratingRange = 200, authToken) => {
  if (!authToken) return [];

  try {
    const response = await fetch(`${API_URL}/pvp/opponents?limit=${limit}&ratingRange=${ratingRange}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch opponents');
    }

    return data.opponents;
  } catch (error) {
    console.error('Fetch opponents error:', error);
    return [];
  }
};

export const apiSubmitBattle = async (opponentRosterId, winnerId, battleData, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/pvp/battle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ opponentRosterId, winnerId, battleData })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit battle');
    }

    return data;
  } catch (error) {
    console.error('Submit battle error:', error);
    return null;
  }
};

// ============================================================================
// LEADERBOARD API
// ============================================================================

export const apiGetLeaderboard = async (limit = 100) => {
  try {
    const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch leaderboard');
    }

    return data.leaderboard;
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    return [];
  }
};

export const apiGetUserRank = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/leaderboard/rank`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch rank');
    }

    return data.userRank;
  } catch (error) {
    console.error('Fetch rank error:', error);
    return null;
  }
};

// ============================================================================
// TOURNAMENT API
// ============================================================================

export const apiGetTournaments = async () => {
  try {
    const response = await fetch(`${API_URL}/tournaments`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch tournaments');
    }

    return data.tournaments;
  } catch (error) {
    console.error('Fetch tournaments error:', error);
    return [];
  }
};

export const apiGetTournamentDetails = async (tournamentId) => {
  try {
    console.log('[apiGetTournamentDetails] Fetching tournament:', tournamentId);
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}`);

    console.log('[apiGetTournamentDetails] Response status:', response.status);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[apiGetTournamentDetails] Failed to parse JSON:', jsonError);
      const text = await response.text();
      console.error('[apiGetTournamentDetails] Response text:', text);
      throw new Error('Server returned invalid JSON');
    }

    console.log('[apiGetTournamentDetails] Response data:', data);

    if (!response.ok) {
      console.error('[apiGetTournamentDetails] Error response:', data);
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('[apiGetTournamentDetails] Error:', error);
    return null;
  }
};

export const apiEnterTournament = async (tournamentId, pokemon1RosterId, pokemon2RosterId, pokemon3RosterId, authToken) => {
  if (!authToken) {
    console.error('[apiEnterTournament] No auth token');
    return null;
  }

  const payload = { pokemon1RosterId, pokemon2RosterId, pokemon3RosterId };
  console.log('[apiEnterTournament] Submitting entry:', {
    tournamentId,
    payload
  });

  try {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    console.log('[apiEnterTournament] Response status:', response.status);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[apiEnterTournament] Failed to parse JSON:', jsonError);
      const text = await response.text();
      console.error('[apiEnterTournament] Response text:', text);
      throw new Error('Server returned invalid JSON');
    }

    console.log('[apiEnterTournament] Response data:', data);

    if (!response.ok) {
      console.error('[apiEnterTournament] Server error:', {
        status: response.status,
        error: data.error,
        fullResponse: data
      });
      throw new Error(data.error || `Server error: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('[apiEnterTournament] Error:', error);
    throw error;
  }
};

export const apiGetTournamentBracket = async (tournamentId) => {
  try {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/bracket`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch bracket');
    }

    return data.bracket;
  } catch (error) {
    console.error('Fetch bracket error:', error);
    return [];
  }
};

export const apiWithdrawTournament = async (tournamentId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/tournaments/${tournamentId}/withdraw`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to withdraw');
    }

    return data;
  } catch (error) {
    console.error('Withdraw error:', error);
    throw error;
  }
};

// ============================================================================
// INVENTORY API (NEW - Server Authoritative)
// ============================================================================

export const apiGetPokemonInventory = async (limit = 100, offset = 0, authToken) => {
  if (!authToken) return { pokemon: [], total: 0 };

  try {
    const response = await fetch(`${API_URL}/inventory/pokemon?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Pokemon inventory');
    }

    return data;
  } catch (error) {
    console.error('Get Pokemon inventory error:', error);
    return { pokemon: [], total: 0 };
  }
};

export const apiAddPokemonToInventory = async (pokemonName, pokemonData, authToken, rarity = 'Common') => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/pokemon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ pokemonName, pokemonData, rarity })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add Pokemon');
    }

    return data;
  } catch (error) {
    console.error('Add Pokemon error:', error);
    return null;
  }
};

export const apiDeletePokemonFromInventory = async (pokemonId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/pokemon/${pokemonId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete Pokemon');
    }

    return data;
  } catch (error) {
    console.error('Delete Pokemon error:', error);
    return null;
  }
};

export const apiLimitBreakPokemon = async (pokemonId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/pokemon/${pokemonId}/limit-break`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to limit break Pokemon');
    }

    return data;
  } catch (error) {
    console.error('Limit break Pokemon error:', error);
    return null;
  }
};

export const apiGetSupportInventory = async (limit = 100, offset = 0, authToken) => {
  if (!authToken) return { supports: [], total: 0 };

  try {
    const response = await fetch(`${API_URL}/inventory/supports?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Support inventory');
    }

    return data;
  } catch (error) {
    console.error('Get Support inventory error:', error);
    return { supports: [], total: 0 };
  }
};

export const apiAddSupportToInventory = async (supportName, supportData, authToken, rarity = 'Common') => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/supports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ supportName, supportData, rarity })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add Support');
    }

    return data;
  } catch (error) {
    console.error('Add Support error:', error);
    return null;
  }
};

export const apiDeleteSupportFromInventory = async (supportId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/supports/${supportId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete Support');
    }

    return data;
  } catch (error) {
    console.error('Delete Support error:', error);
    return null;
  }
};

export const apiLimitBreakSupport = async (supportId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/supports/${supportId}/limit-break`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to limit break Support');
    }

    return data;
  } catch (error) {
    console.error('Limit break Support error:', error);
    return null;
  }
};

export const apiGetTrainedPokemon = async (limit = 100, offset = 0, authToken) => {
  if (!authToken) return { trainedPokemon: [], total: 0 };

  try {
    const response = await fetch(`${API_URL}/inventory/trained?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch trained Pokemon');
    }

    return data;
  } catch (error) {
    console.error('Get trained Pokemon error:', error);
    return { trainedPokemon: [], total: 0 };
  }
};

export const apiDeleteTrainedPokemon = async (trainedId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/trained/${trainedId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete trained Pokemon');
    }

    return data;
  } catch (error) {
    console.error('Delete trained Pokemon error:', error);
    return null;
  }
};

export const apiGetPrimos = async (authToken) => {
  if (!authToken) return { primos: 0 };

  try {
    const response = await fetch(`${API_URL}/inventory/primos`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch Primos');
    }

    return data;
  } catch (error) {
    console.error('Get Primos error:', error);
    return { primos: 0 };
  }
};

export const apiUpdatePrimos = async (amount, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/primos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update Primos');
    }

    return data;
  } catch (error) {
    console.error('Update Primos error:', error);
    return null;
  }
};

// ============================================================================
// CAREER API (NEW - Server Authoritative)
// ============================================================================

export const apiGetActiveCareer = async (authToken) => {
  if (!authToken) return { hasActiveCareer: false };

  try {
    const response = await fetch(`${API_URL}/career/active`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get active career');
    }

    return data;
  } catch (error) {
    console.error('Get active career error:', error);
    return { hasActiveCareer: false };
  }
};

export const apiStartCareer = async (pokemon, selectedSupports, selectedInspirations, initialFriendships, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ pokemon, selectedSupports, selectedInspirations, initialFriendships })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start career');
    }

    return data;
  } catch (error) {
    console.error('Start career error:', error);
    return null;
  }
};

export const apiUpdateCareer = async (careerState, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ careerState })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update career');
    }

    return data;
  } catch (error) {
    console.error('Update career error:', error);
    return null;
  }
};

export const apiProcessBattle = async (opponent, isGymLeader, authToken, isEventBattle = false) => {
  if (!authToken) {
    console.error('[apiProcessBattle] No auth token');
    return null;
  }

  try {
    console.log('[apiProcessBattle] Sending request to server:', { opponent, isGymLeader, isEventBattle });
    const response = await fetch(`${API_URL}/career/battle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ opponent, isGymLeader, isEventBattle })
    });

    const data = await response.json();
    console.log('[apiProcessBattle] Server response:', { status: response.status, data });
    console.log('[apiProcessBattle] data has careerState:', 'careerState' in data, 'data keys:', Object.keys(data));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process battle');
    }

    return data;
  } catch (error) {
    console.error('[apiProcessBattle] Process battle error:', error);
    return null;
  }
};

export const apiCompleteCareer = async (careerState, completionType, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ careerState, completionType })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to complete career');
    }

    return data;
  } catch (error) {
    console.error('Complete career error:', error);
    return null;
  }
};

export const apiAbandonCareer = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/abandon`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to abandon career');
    }

    return data;
  } catch (error) {
    console.error('Abandon career error:', error);
    return null;
  }
};

export const apiUsePokeclock = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/use-pokeclock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to use pokeclock');
    }

    return data;
  } catch (error) {
    console.error('Use pokeclock error:', error);
    return null;
  }
};

export const apiChangeStrategy = async (strategy, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/change-strategy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ strategy })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change strategy');
    }

    return data;
  } catch (error) {
    console.error('Change strategy error:', error);
    return null;
  }
};

// ============================================================================
// CAREER API - Server-Authoritative Actions
// ============================================================================

export const apiTrainStat = async (stat, expectedVersion, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ stat, expectedVersion })
    });

    const data = await response.json();

    if (!response.ok) {
      // Return error with recovery state if available
      if (data.code === 'VERSION_MISMATCH' || data.code === 'INVALID_SELECTION') {
        return { success: false, error: data.error, code: data.code, currentState: data.currentState };
      }
      throw new Error(data.error || 'Failed to process training');
    }

    return data;
  } catch (error) {
    console.error('Train stat error:', error);
    return { success: false, error: error.message, code: 'NETWORK_ERROR' };
  }
};

export const apiRest = async (expectedVersion, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/rest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ expectedVersion })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'VERSION_MISMATCH') {
        return { success: false, error: data.error, code: data.code, currentState: data.currentState };
      }
      throw new Error(data.error || 'Failed to process rest');
    }

    return data;
  } catch (error) {
    console.error('Rest error:', error);
    return { success: false, error: error.message, code: 'NETWORK_ERROR' };
  }
};

export const apiGenerateTraining = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/generate-training`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate training');
    }

    return data;
  } catch (error) {
    console.error('Generate training error:', error);
    return null;
  }
};

export const apiTriggerEvent = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/trigger-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to trigger event');
    }

    return data;
  } catch (error) {
    console.error('Trigger event error:', error);
    return null;
  }
};

export const apiResolveEvent = async (choiceIndex, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/resolve-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ choiceIndex })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to resolve event');
    }

    return data;
  } catch (error) {
    console.error('Resolve event error:', error);
    return null;
  }
};

export const apiLearnAbility = async (moveName, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/learn-ability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ moveName })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to learn ability');
    }

    return data;
  } catch (error) {
    console.error('Learn ability error:', error);
    return null;
  }
};

export const apiForgetAbility = async (moveName, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/career/forget-ability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ moveName })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to forget ability');
    }

    return data;
  } catch (error) {
    console.error('Forget ability error:', error);
    return null;
  }
};

// ============================================================================
// PVP MATCHMAKING API
// ============================================================================

export const apiJoinPvPQueue = async (pokemon1RosterId, pokemon2RosterId, pokemon3RosterId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/pvp/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ pokemon1RosterId, pokemon2RosterId, pokemon3RosterId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to join queue');
    }

    return data;
  } catch (error) {
    console.error('Join PvP queue error:', error);
    throw error;
  }
};

export const apiGetPvPQueueStatus = async (authToken) => {
  if (!authToken) return { status: 'not_in_queue' };

  try {
    const response = await fetch(`${API_URL}/pvp/queue/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get queue status');
    }

    return data;
  } catch (error) {
    console.error('Get PvP queue status error:', error);
    return { status: 'error' };
  }
};

export const apiLeavePvPQueue = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/pvp/queue`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to leave queue');
    }

    return data;
  } catch (error) {
    console.error('Leave PvP queue error:', error);
    return null;
  }
};

export const apiGetPvPMatch = async (matchId, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/pvp/match/${matchId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get match');
    }

    return data;
  } catch (error) {
    console.error('Get PvP match error:', error);
    return null;
  }
};

export const apiGetPvPStats = async (authToken) => {
  if (!authToken) return { rating: 1000, wins: 0, losses: 0 };

  try {
    const response = await fetch(`${API_URL}/pvp/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get PvP stats');
    }

    return data;
  } catch (error) {
    console.error('Get PvP stats error:', error);
    return { rating: 1000, wins: 0, losses: 0 };
  }
};

export const apiGetPvPMatches = async (limit = 20, offset = 0, authToken) => {
  if (!authToken) return { matches: [] };

  try {
    const response = await fetch(`${API_URL}/pvp/matches?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get matches');
    }

    return data;
  } catch (error) {
    console.error('Get PvP matches error:', error);
    return { matches: [] };
  }
};

// ============================================================================
// PROFILE API
// ============================================================================

export const apiGetProfile = async (authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile');
    }

    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
};

export const apiGetAllBadges = async () => {
  try {
    const response = await fetch(`${API_URL}/profile/badges/all`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch badges');
    }

    return data;
  } catch (error) {
    console.error('Get all badges error:', error);
    return { badges: [] };
  }
};

export const apiGetUserBadges = async (authToken) => {
  if (!authToken) return { badges: [], allBadges: [] };

  try {
    const response = await fetch(`${API_URL}/profile/badges`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user badges');
    }

    return data;
  } catch (error) {
    console.error('Get user badges error:', error);
    return { badges: [], allBadges: [] };
  }
};

export const apiGetProfileIcons = async () => {
  try {
    const response = await fetch(`${API_URL}/profile/icons`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile icons');
    }

    return data.icons;
  } catch (error) {
    console.error('Get profile icons error:', error);
    return ['pikachu', 'squirtle', 'charmander', 'bulbasaur', 'mewtwo', 'officer-jenny'];
  }
};

export const apiUpdateProfileIcon = async (icon, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/profile/icon`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ icon })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile icon');
    }

    return data;
  } catch (error) {
    console.error('Update profile icon error:', error);
    return null;
  }
};

// ============================================================================
// SUPPORT DECK API
// ============================================================================

export const apiGetSupportDecks = async (authToken) => {
  if (!authToken) return { decks: Array(5).fill(null).map(() => Array(5).fill(null)) };

  try {
    const response = await fetch(`${API_URL}/inventory/support-decks`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch support decks');
    }

    return data;
  } catch (error) {
    console.error('Get support decks error:', error);
    return { decks: Array(5).fill(null).map(() => Array(5).fill(null)) };
  }
};

export const apiSaveSupportDeck = async (deckIndex, supports, authToken) => {
  if (!authToken) return null;

  try {
    const response = await fetch(`${API_URL}/inventory/support-decks/${deckIndex}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ supports })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save support deck');
    }

    return data;
  } catch (error) {
    console.error('Save support deck error:', error);
    return null;
  }
};

