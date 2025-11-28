/**
 * Game Utility Functions
 *
 * Collection of helper functions for Pokemon stats, colors, sprites, and grading.
 */

import React from 'react';
import { Heart, Shield, Sparkles, Swords, Wind } from 'lucide-react';
import { EVOLUTION_CHAINS } from '../shared/gameData';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export const getTypeColor = (type) => {
  const colors = {
    Red: '#dc2626',
    Blue: '#2563eb',
    Green: '#16a34a',
    Purple: '#9333ea',
    Yellow: '#ca8a04',
    Orange: '#f97316',
    Colorless: '#6b7280',
    Fire: '#dc2626',
    Water: '#2563eb',
    Grass: '#16a34a',
    Psychic: '#9333ea',
    Electric: '#ca8a04',
    Fighting: '#f97316',
    Normal: '#6b7280'
  };
  return colors[type] || '#6b7280';
};

export const getAptitudeColor = (grade) => {
  const colors = {
    F: '#000000',
    E: '#9ca3af',
    D: '#3b82f6',
    C: '#22c55e',
    B: '#ec4899',
    A: '#f97316',
    S: '#eab308'
  };
  return colors[grade] || '#6b7280';
};

export const getGradeColor = (grade) => {
  if (!grade) return '#6b7280'; // Default gray for undefined/null
  const baseGrade = grade.replace('+', '');
  const colors = {
    F: '#000000',
    E: '#9ca3af',
    D: '#3b82f6',
    C: '#22c55e',
    B: '#ec4899',
    A: '#f97316',
    S: '#eab308',
    UU: '#14b8a6'  // Teal
  };
  return colors[baseGrade] || '#6b7280';
};

export const getRarityColor = (rarity) => {
  const colors = {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Legendary: '#eab308'
  };
  return colors[rarity] || '#6b7280';
};

// ============================================================================
// GRADING UTILITIES
// ============================================================================

/**
 * Calculates Pokemon grade based on total stats
 * Grade determines evolution thresholds and overall power level
 * @param stats - Pokemon stat object {HP, Attack, Defense, Instinct, Speed}
 * @returns Grade string (E, D, C, B, A, S, UU, etc.)
 */
export const getPokemonGrade = (stats) => {
  const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0);

  // Each grade is 100 stat points apart
  if (totalStats >= 2000) return 'UU+';
  if (totalStats >= 1900) return 'UU';
  if (totalStats >= 1800) return 'S+';
  if (totalStats >= 1700) return 'S';
  if (totalStats >= 1600) return 'A+';
  if (totalStats >= 1500) return 'A';
  if (totalStats >= 1400) return 'B+';
  if (totalStats >= 1300) return 'B';
  if (totalStats >= 1200) return 'C+';
  if (totalStats >= 1100) return 'C';
  if (totalStats >= 1000) return 'D+';
  if (totalStats >= 900) return 'D';
  if (totalStats >= 800) return 'E+';
  if (totalStats >= 700) return 'E';
  if (totalStats >= 600) return 'F+';
  return 'F';
};

/**
 * Returns the rarity of a Pokemon based on evolution potential
 */
export const getPokemonRarity = (pokemonName) => {
  // Check if it's a legendary (no evolution, special Pokemon)
  const legendary = ['Moltres', 'Articuno', 'Celebi', 'Raikou', 'Gengar', 'Entei', 'Suicune',
                     'Mew', 'Mewtwo', 'Snorlax', 'Lapras', 'Aerodactyl', 'Ditto'];
  if (legendary.includes(pokemonName)) return 'Legendary';

  // Check evolution chain
  const evolutionData = Object.entries(EVOLUTION_CHAINS).find(([base, data]) => {
    return base === pokemonName || data.stage1 === pokemonName || data.stage2 === pokemonName;
  });

  if (!evolutionData) return 'Common'; // No evolution chain = common

  const [, chainData] = evolutionData;

  // If it's a fully evolved Pokemon from a 2-stage chain
  if (chainData.stages === 2 && chainData.stage2 === pokemonName) return 'Rare';

  // If it's a fully evolved Pokemon from a 1-stage chain
  if (chainData.stages === 1 && chainData.stage1 === pokemonName) return 'Uncommon';

  // Base stage or middle stage
  return 'Common';
};

// ============================================================================
// INSPIRATION UTILITIES
// ============================================================================

/**
 * Generates inspirations for a completed career Pokemon
 * Returns object with stat inspiration and attack aptitude inspiration
 */
export const generateInspirations = (stats, aptitudes) => {
  try {
    console.log('[generateInspirations] Called with:', { stats, aptitudes });

    if (!stats || !aptitudes) {
      console.error('[generateInspirations] Missing required parameters:', { stats, aptitudes });
      return null;
    }

    // Color to type name mapping
    const colorToType = {
      'Red': 'Fire',
      'Blue': 'Water',
      'Green': 'Grass',
      'Purple': 'Psychic',
      'Yellow': 'Electric',
      'Orange': 'Fighting'
    };

    // Generate Stat Inspiration
    const statNames = ['HP', 'Attack', 'Defense', 'Instinct', 'Speed'];
    const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
    const statValue = stats[randomStat];

    if (statValue === undefined) {
      console.error('[generateInspirations] Stat value undefined for:', randomStat, stats);
      return null;
    }

    let statStars = 1;
    const statRoll = Math.random();

    if (statValue < 200) {
      statStars = statRoll < 0.90 ? 1 : 2;
    } else if (statValue <= 300) {
      if (statRoll < 0.50) statStars = 1;
      else if (statRoll < 0.95) statStars = 2;
      else statStars = 3;
    } else {
      if (statRoll < 0.20) statStars = 1;
      else if (statRoll < 0.90) statStars = 2;
      else statStars = 3;
    }

    // Generate Attack Aptitude Inspiration
    const aptitudeKeys = Object.keys(aptitudes);
    if (aptitudeKeys.length === 0) {
      console.error('[generateInspirations] No aptitude keys found:', aptitudes);
      return null;
    }

    const randomAptitude = aptitudeKeys[Math.floor(Math.random() * aptitudeKeys.length)];
    const aptitudeGrade = aptitudes[randomAptitude];

    if (!aptitudeGrade) {
      console.error('[generateInspirations] Aptitude grade undefined for:', randomAptitude, aptitudes);
      return null;
    }

    let aptitudeStars = 1;
    const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
    const aptitudeIndex = aptitudeOrder.indexOf(aptitudeGrade);

    if (aptitudeIndex <= 3) { // F, E, D, C
      aptitudeStars = 1;
    } else if (aptitudeIndex === 4) { // B
      aptitudeStars = 2;
    } else { // A, S
      aptitudeStars = 3;
    }

    const result = {
      stat: {
        name: randomStat,
        value: statValue,
        stars: statStars
      },
      aptitude: {
        name: colorToType[randomAptitude] || randomAptitude, // Convert color to type name
        color: randomAptitude, // Keep the color key for lookups
        grade: aptitudeGrade,
        stars: aptitudeStars
      }
    };

    console.log('[generateInspirations] Generated:', result);
    return result;
  } catch (error) {
    console.error('[generateInspirations] Error:', error, { stats, aptitudes });
    return null;
  }
};

/**
 * Check if inspiration should trigger on current turn and apply effects
 */
export const checkAndApplyInspiration = (turn, selectedInspirations, currentStats, currentAptitudes) => {
  const inspirationTurns = [11, 23, 35, 47, 59];

  console.log('[checkAndApplyInspiration] Turn:', turn, 'Selected:', selectedInspirations?.length);

  if (!inspirationTurns.includes(turn) || !selectedInspirations || selectedInspirations.length === 0) {
    console.log('[checkAndApplyInspiration] Skipping - not inspiration turn or no selections');
    return null;
  }

  console.log('[checkAndApplyInspiration] Processing inspirations for turn', turn);

  // Color to type name mapping
  const colorToType = {
    'Red': 'Fire',
    'Blue': 'Water',
    'Green': 'Grass',
    'Purple': 'Psychic',
    'Yellow': 'Electric',
    'Orange': 'Fighting'
  };

  const aptitudeOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

  // Create copies to mutate
  const updatedStats = { ...currentStats };
  const updatedAptitudes = { ...currentAptitudes };

  const inspirationResults = selectedInspirations
    .filter(insp => insp && insp.inspirations)
    .map(trainedPokemon => {
      const statInsp = trainedPokemon.inspirations.stat;
      const aptInsp = trainedPokemon.inspirations.aptitude;

      const result = {
        pokemonName: trainedPokemon.name,
        statBonus: null,
        aptitudeUpgrade: null
      };

      // Apply stat bonus
      if (statInsp && statInsp.name && statInsp.stars) {
        const statBonus = statInsp.stars === 1 ? 10 : statInsp.stars === 2 ? 25 : 50;
        updatedStats[statInsp.name] = (updatedStats[statInsp.name] || 0) + statBonus;
        result.statBonus = {
          stat: statInsp.name,
          amount: statBonus,
          stars: statInsp.stars
        };
      }

      // Check for aptitude upgrade
      if (aptInsp && aptInsp.color && aptInsp.stars) {
        const upgradeChance = aptInsp.stars === 1 ? 0.03 : aptInsp.stars === 2 ? 0.10 : 0.20;
        if (Math.random() < upgradeChance) {
          const currentGrade = updatedAptitudes[aptInsp.color];
          const currentIndex = aptitudeOrder.indexOf(currentGrade);
          if (currentIndex < aptitudeOrder.length - 1) { // Not already S
            const newGrade = aptitudeOrder[currentIndex + 1];
            updatedAptitudes[aptInsp.color] = newGrade;
            result.aptitudeUpgrade = {
              type: colorToType[aptInsp.color] || aptInsp.color,
              color: aptInsp.color,
              from: currentGrade,
              to: newGrade,
              stars: aptInsp.stars,
              chance: upgradeChance
            };
          }
        }
      }

      return result;
    });

  const finalResult = {
    turn,
    results: inspirationResults,
    updatedStats,
    updatedAptitudes
  };

  console.log('[checkAndApplyInspiration] Result:', finalResult);
  return finalResult;
};

// ============================================================================
// SPRITE COMPONENTS
// ============================================================================

const spriteCache = {};

export const PokemonSprite = ({ type, pokemonName, size = 120 }) => {
  const [spriteUrl, setSpriteUrl] = React.useState(spriteCache[pokemonName] || null);

  React.useEffect(() => {
    // Guard against undefined pokemonName
    if (!pokemonName) {
      console.error('[PokemonSprite] pokemonName is undefined');
      setSpriteUrl('error');
      return;
    }

    if (spriteCache[pokemonName]) {
      setSpriteUrl(spriteCache[pokemonName]);
      return;
    }

    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
      .then(res => res.json())
      .then(data => {
        const url = data.sprites.front_default;
        spriteCache[pokemonName] = url;
        setSpriteUrl(url);
      })
      .catch(err => {
        console.error('Failed to fetch Pokemon:', err);
        setSpriteUrl('error');
      });
  }, [pokemonName]);

  if (!spriteUrl) {
    return <div style={{width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  if (spriteUrl === 'error') {
    return <div style={{width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}>{pokemonName}</div>;
  }

  return <img src={spriteUrl} alt={pokemonName} width={size} height={size} />;
};

// Backwards compatibility wrapper
export const generatePokemonSprite = (type, pokemonName) => {
  return <PokemonSprite type={type} pokemonName={pokemonName} />;
};

export const generateTrainerSprite = (gymNum) => {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="20" r="12" fill="#ffcc99" stroke="#000" strokeWidth="2"/>
      <rect x="18" y="32" width="24" height="20" fill="#4488ff" stroke="#000" strokeWidth="2"/>
      <text x="30" y="25" fontSize="10" textAnchor="middle" fill="#000">G{gymNum}</text>
    </svg>
  );
};

export const StatIcon = ({ stat, size = 16 }) => {
  const icons = {
    HP: <Heart size={size} className="text-red-500" />,
    Attack: <Swords size={size} className="text-orange-500" />,
    Defense: <Shield size={size} className="text-blue-500" />,
    Instinct: <Sparkles size={size} className="text-purple-500" />,
    Speed: <Wind size={size} className="text-green-500" />
  };
  return icons[stat] || null;
};

// ============================================================================
// SUPPORT CARD UTILITIES
// ============================================================================

export const getSupportCardAttributes = (supportKey, SUPPORT_CARDS) => {
  const card = SUPPORT_CARDS[supportKey];
  if (!card) return null;

  // New structure uses:
  // - baseStats: { HP, Attack, Defense, Instinct, Speed }
  // - trainingBonus: { typeMatch, otherStats, maxFriendshipTypeMatch }
  // - appearanceRate (0.25-0.65)
  // - typeMatchPreference (0.50-0.90)
  // - specialEffect: { statGainMultiplier, failRateReduction, maxEnergyBonus, restBonus, etc. } or null
  // - moveHints: []
  // - description

  // Return complete attributes with backwards-compatible field names
  return {
    ...card,
    // Base stat bonuses (direct stat additions when support is equipped)
    baseStatIncrease: card.baseStats || { HP: 0, Attack: 0, Defense: 0, Instinct: 0, Speed: 0 },
    // Training bonuses
    typeBonusTraining: card.trainingBonus?.typeMatch || 4,
    generalBonusTraining: card.trainingBonus?.otherStats || 2,
    friendshipBonusTraining: card.trainingBonus?.maxFriendshipTypeMatch || 8,
    // Friendship
    initialFriendship: card.initialFriendship ?? 30,
    // Appearance
    appearanceChance: card.appearanceRate || 0.40,
    typeAppearancePriority: card.typeMatchPreference || 0.65,
    // Move hints
    moveHints: card.moveHints || ['BodySlam', 'HyperBeam'],
    // Effect - convert new specialEffect to old effect format for compatibility
    effect: card.specialEffect ? {
      type: card.specialEffect.statGainMultiplier ? 'training_boost' :
            card.specialEffect.maxEnergyBonus ? 'energy_boost' :
            card.specialEffect.skillPointMultiplier ? 'experience_boost' : 'special',
      description: card.description || '',
      ...card.specialEffect
    } : { type: 'none', description: card.description || '' },
    // Type compatibility
    type: card.supportType || 'HP'
  };
};

// ============================================================================
// BATTLE UTILITIES
// ============================================================================

export const getBattleDisplayName = (combatant) => {
  return combatant.name || combatant.pokemon || 'Unknown';
};
