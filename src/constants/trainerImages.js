/**
 * Trainer Image Mappings
 * Maps trainer names to their sprite images
 */

// Gym Leader Images
export const GYM_LEADER_IMAGES = {
  'Blaine': '/images/trainers/gym-leaders/blaine.png',
  'Misty': '/images/trainers/gym-leaders/misty.png',
  'Erika': '/images/trainers/gym-leaders/erika.png',
  'Lt. Surge': '/images/trainers/gym-leaders/ltsurge.png',
  'Sabrina': '/images/trainers/gym-leaders/sabrina.png',
  'Giovanni': '/images/trainers/gym-leaders/giovanni.png',
  'Wallace': '/images/trainers/gym-leaders/wallace.png',
  'Flannery': '/images/trainers/gym-leaders/flannery.png',
  'Winona': '/images/trainers/gym-leaders/winona.png',
  'Wattson': '/images/trainers/gym-leaders/wattson.png',
  'Juan': '/images/trainers/gym-leaders/juan.png',
  'Bruno': '/images/trainers/gym-leaders/bruno.png',
  'Agatha': '/images/trainers/gym-leaders/agatha.png',
  'Will': '/images/trainers/gym-leaders/will.png',
  'Lorelei': '/images/trainers/gym-leaders/lorelei.png',
  'Lance': '/images/trainers/gym-leaders/lance.png',
};

// Support Card Trainer Images (maps trainer names from support cards)
export const SUPPORT_TRAINER_IMAGES = {
  // Legendary tier
  'Cynthia': '/images/trainers/supports/cynthia.png',
  'Red': '/images/trainers/supports/red.png',
  'Steven': '/images/trainers/supports/steven.png',
  'N': '/images/trainers/supports/n.png',
  'Professor Oak': '/images/trainers/supports/professor_oak.png',
  'Diantha': '/images/trainers/supports/diantha.png',
  // Rare tier
  'Lance': '/images/trainers/supports/lance.png',
  'Sabrina': '/images/trainers/supports/sabrina.png',
  'Morty': '/images/trainers/supports/morty.png',
  'Wallace': '/images/trainers/supports/wallace.png',
  'Iris': '/images/trainers/supports/iris.png',
  'Blue': '/images/trainers/supports/blue.png',
  'Giovanni': '/images/trainers/supports/giovanni.png',
  'Maxie': '/images/trainers/supports/maxie.png',
  'Archie': '/images/trainers/supports/archie.png',
  // Uncommon tier
  'Misty': '/images/trainers/supports/misty.png',
  'Brock': '/images/trainers/supports/brock.png',
  'Erika': '/images/trainers/supports/erika.png',
  'Blaine': '/images/trainers/supports/blaine.png',
  'Koga': '/images/trainers/supports/koga.png',
  'Jasmine': '/images/trainers/supports/jasmine.png',
  'Winona': '/images/trainers/supports/winona.png',
  'Karen': '/images/trainers/supports/karen.png',
  'Agatha': '/images/trainers/supports/agatha.png',
  // Common tier
  'Whitney': '/images/trainers/supports/whitney.png',
  'Chuck': '/images/trainers/supports/chuck.png',
  'Pryce': '/images/trainers/supports/pryce.png',
  'Wattson': '/images/trainers/supports/wattson.png',
  'Flannery': '/images/trainers/supports/flannery.png',
};

// Helper function to get gym leader image with fallback
export const getGymLeaderImage = (name) => {
  return GYM_LEADER_IMAGES[name] || '/images/trainers/gym-leaders/default.png';
};

// Helper function to get support trainer image with fallback to gym leader images
export const getSupportTrainerImage = (trainerName) => {
  // First check support images, then fallback to gym leader images
  return SUPPORT_TRAINER_IMAGES[trainerName] || GYM_LEADER_IMAGES[trainerName] || '/images/trainers/supports/default.png';
};

// Helper function to extract trainer name from support card name or key
// Handles both formats:
// - Display name: "Cynthia & Garchomp"
// - Key format: "CynthiaGarchomp"
export const getSupportImageFromCardName = (cardName) => {
  if (!cardName) return null;

  // If it contains &, it's a display name format
  if (cardName.includes('&')) {
    const trainerName = cardName.split('&')[0]?.trim();
    return getSupportTrainerImage(trainerName);
  }

  // Otherwise it's a key format like "CynthiaGarchomp" or "ProfessorOakMew"
  // Extract trainer name by finding where the Pokemon name starts (capital letter after trainer)
  // Handle special cases first
  const specialCases = {
    'ProfessorOakMew': 'Professor Oak',
    'ElitesFourKaren': 'Karen',
    'LtSurgeRaichu': 'Lt. Surge'
  };

  if (specialCases[cardName]) {
    return getSupportTrainerImage(specialCases[cardName]);
  }

  // For standard names like "CynthiaGarchomp", split at the boundary
  // where a Pokemon name likely starts (common Pokemon names)
  const pokemonNames = [
    'Garchomp', 'Charizard', 'Metagross', 'Dragonite', 'Starmie', 'Onix',
    'Tangela', 'Alakazam', 'Magmar', 'Weezing', 'Miltank', 'Gengar',
    'Poliwrath', 'Steelix', 'Delibird', 'Milotic', 'Skarmory', 'Magneton',
    'Camerupt', 'Lucario', 'Reshiram', 'Haxorus', 'Umbreon', 'Pidgeot',
    'Persian', 'Mew', 'Diancie', 'Groudon', 'Kyogre'
  ];

  for (const pokemon of pokemonNames) {
    if (cardName.endsWith(pokemon)) {
      const trainerName = cardName.slice(0, -pokemon.length);
      return getSupportTrainerImage(trainerName);
    }
  }

  // Fallback: just return the whole name as trainer (won't match, will use default)
  return getSupportTrainerImage(cardName);
};
