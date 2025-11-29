/**
 * Trainer Image Mappings
 * Maps trainer names to their sprite images
 */

import { normalizeSupportName, SUPPORT_CARDS } from '../shared/gameData';

// Face positioning config for support trainer icons
// scale: zoom level (1.0 = no zoom, 2.0 = 2x zoom for face focus)
// offsetY: vertical offset in % (negative = move up to show face, positive = move down)
// offsetX: horizontal offset in % (negative = move left, positive = move right)
export const TRAINER_FACE_CONFIG = {
  // Default config for trainers without specific settings
  default: { scale: 2.2, offsetY: -15, offsetX: 0 },
  // Legendary tier (original)
  'Cynthia': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Red': { scale: 2.2, offsetY: -12, offsetX: 0 },
  'Steven': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'N': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Professor Oak': { scale: 2.4, offsetY: -12, offsetX: 0 },
  'Diantha': { scale: 2.4, offsetY: -18, offsetX: 0 },
  // Legendary tier (new)
  'Leon': { scale: 2.2, offsetY: -12, offsetX: 0 },
  'Selene': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Gloria': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Nemona': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Mustard': { scale: 2.4, offsetY: -12, offsetX: 0 },
  'Victor': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Arven': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Penny': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Sonia': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Hop': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Geeta': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Kieran': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Carmine': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Drayton': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Lacey': { scale: 2.2, offsetY: -14, offsetX: 0 },
  // Rare tier (original)
  'Lance': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Sabrina': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Morty': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Wallace': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Iris': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Blue': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Giovanni': { scale: 2.4, offsetY: -12, offsetX: 0 },
  'Maxie': { scale: 2.4, offsetY: -12, offsetX: 0 },
  'Archie': { scale: 2.4, offsetY: -12, offsetX: 0 },
  // Rare tier (new)
  'Raihan': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Marnie': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Nessa': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Bea': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Opal': { scale: 2.4, offsetY: -12, offsetX: 0 },
  'Piers': { scale: 2.2, offsetY: -18, offsetX: 0 },
  'Rika': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Poppy': { scale: 2.2, offsetY: -14, offsetX: 0 },
  // Uncommon tier (original)
  'Misty': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Brock': { scale: 2.2, offsetY: -12, offsetX: 0 },
  'Erika': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Blaine': { scale: 2.4, offsetY: -10, offsetX: 0 },
  'Koga': { scale: 2.2, offsetY: -12, offsetX: 0 },
  'Jasmine': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Winona': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Karen': { scale: 2.4, offsetY: -18, offsetX: 0 },
  'Agatha': { scale: 2.4, offsetY: -10, offsetX: 0 },
  // Uncommon tier (new)
  'Milo': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Kabu': { scale: 2.4, offsetY: -10, offsetX: 0 },
  'Melony': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Gordie': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Klara': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Avery': { scale: 2.2, offsetY: -18, offsetX: 0 },
  'Iono': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Grusha': { scale: 2.2, offsetY: -14, offsetX: 0 },
  // Common tier
  'Whitney': { scale: 2.2, offsetY: -14, offsetX: 0 },
  'Chuck': { scale: 2.2, offsetY: -10, offsetX: 0 },
  'Pryce': { scale: 2.4, offsetY: -10, offsetX: 0 },
  'Wattson': { scale: 2.4, offsetY: -10, offsetX: 0 },
  'Flannery': { scale: 2.2, offsetY: -14, offsetX: 0 },
};

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
  // Legendary tier (original)
  'Cynthia': '/images/trainers/supports/cynthia.png',
  'Red': '/images/trainers/supports/red.png',
  'Steven': '/images/trainers/supports/steven.png',
  'N': '/images/trainers/supports/n.png',
  'Professor Oak': '/images/trainers/supports/professor_oak.png',
  'Diantha': '/images/trainers/supports/diantha.png',
  // Legendary tier (new)
  'Leon': '/images/trainers/supports/leon.png',
  'Selene': '/images/trainers/supports/selene.png',
  'Gloria': '/images/trainers/supports/gloria.png',
  'Nemona': '/images/trainers/supports/nemona.png',
  'Mustard': '/images/trainers/supports/mustard.png',
  'Victor': '/images/trainers/supports/victor.png',
  'Arven': '/images/trainers/supports/arven.png',
  'Penny': '/images/trainers/supports/penny.png',
  'Sonia': '/images/trainers/supports/sonia.png',
  'Hop': '/images/trainers/supports/hop.png',
  'Geeta': '/images/trainers/supports/geeta.png',
  'Kieran': '/images/trainers/supports/kieran.png',
  'Carmine': '/images/trainers/supports/carmine.png',
  'Drayton': '/images/trainers/supports/drayton.png',
  'Lacey': '/images/trainers/supports/lacey.png',
  // Rare tier (original)
  'Lance': '/images/trainers/supports/lance.png',
  'Sabrina': '/images/trainers/supports/sabrina.png',
  'Morty': '/images/trainers/supports/morty.png',
  'Wallace': '/images/trainers/supports/wallace.png',
  'Iris': '/images/trainers/supports/iris.png',
  'Blue': '/images/trainers/supports/blue.png',
  'Giovanni': '/images/trainers/supports/giovanni.png',
  'Maxie': '/images/trainers/supports/maxie.png',
  'Archie': '/images/trainers/supports/archie.png',
  // Rare tier (new)
  'Raihan': '/images/trainers/supports/raihan.png',
  'Marnie': '/images/trainers/supports/marnie.png',
  'Nessa': '/images/trainers/supports/nessa.png',
  'Bea': '/images/trainers/supports/bea.png',
  'Opal': '/images/trainers/supports/opal.png',
  'Piers': '/images/trainers/supports/piers.png',
  'Rika': '/images/trainers/supports/rika.png',
  'Poppy': '/images/trainers/supports/poppy.png',
  // Uncommon tier (original)
  'Misty': '/images/trainers/supports/misty.png',
  'Brock': '/images/trainers/supports/brock.png',
  'Erika': '/images/trainers/supports/erika.png',
  'Blaine': '/images/trainers/supports/blaine.png',
  'Koga': '/images/trainers/supports/koga.png',
  'Jasmine': '/images/trainers/supports/jasmine.png',
  'Winona': '/images/trainers/supports/winona.png',
  'Karen': '/images/trainers/supports/karen.png',
  'Agatha': '/images/trainers/supports/agatha.png',
  // Uncommon tier (new)
  'Milo': '/images/trainers/supports/milo.png',
  'Kabu': '/images/trainers/supports/kabu.png',
  'Melony': '/images/trainers/supports/melony.png',
  'Gordie': '/images/trainers/supports/gordie.png',
  'Klara': '/images/trainers/supports/klara.png',
  'Avery': '/images/trainers/supports/avery.png',
  'Iono': '/images/trainers/supports/iono.png',
  'Grusha': '/images/trainers/supports/grusha.png',
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

// Helper function to get face positioning config for a trainer
export const getTrainerFaceConfig = (trainerName) => {
  return TRAINER_FACE_CONFIG[trainerName] || TRAINER_FACE_CONFIG.default;
};

// Helper function to extract trainer name from support card name or key
// Handles both formats:
// - Display name: "Cynthia & Garchomp"
// - Key format: "CynthiaGarchomp" (legacy) or "Cynthia" (new)
export const getSupportImageFromCardName = (cardName) => {
  if (!cardName) return null;

  // First try normalizing the name to the new format
  const normalizedName = normalizeSupportName(cardName);
  const supportCard = SUPPORT_CARDS[normalizedName];
  if (supportCard) {
    // Use the trainer name from the support card
    return getSupportTrainerImage(supportCard.trainer || supportCard.name);
  }

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
    'LtSurgeRaichu': 'Lt. Surge',
    'PopPyTinkaton': 'Poppy',
    'PennyVaporeon': 'Penny',
    'AveryRapidashGalar': 'Avery'
  };

  if (specialCases[cardName]) {
    return getSupportTrainerImage(specialCases[cardName]);
  }

  // For standard names like "CynthiaGarchomp", split at the boundary
  // where a Pokemon name likely starts (common Pokemon names)
  const pokemonNames = [
    // Original
    'Garchomp', 'Charizard', 'Metagross', 'Dragonite', 'Starmie', 'Onix',
    'Tangela', 'Alakazam', 'Magmar', 'Weezing', 'Miltank', 'Gengar',
    'Poliwrath', 'Steelix', 'Delibird', 'Milotic', 'Skarmory', 'Magneton',
    'Camerupt', 'Lucario', 'Reshiram', 'Haxorus', 'Umbreon', 'Pidgeot',
    'Persian', 'Mew', 'Diancie', 'Groudon', 'Kyogre',
    // New Legendary
    'Lunala', 'Zacian', 'Koraidon', 'Urshifu', 'Eternatus', 'Mabosstiff',
    'Sylveon', 'Yamper', 'Zamazenta', 'Kingambit', 'Terapagos', 'Ogerpon',
    'Archaludon', 'Excadrill',
    // New Rare
    'Duraludon', 'Grimmsnarl', 'Drednaw', 'Machamp', 'Alcremie', 'Toxtricity',
    'Whiscash', 'Tinkaton',
    // New Uncommon
    'Eldegoss', 'Centiskorch', 'Lapras', 'Coalossal', 'Slowbro', 'Rapidash',
    'Luxray', 'Altaria'
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

// Helper to extract trainer name from card name
const extractTrainerName = (cardName) => {
  if (!cardName) return null;

  // If it contains &, it's a display name format
  if (cardName.includes('&')) {
    return cardName.split('&')[0]?.trim();
  }

  // Handle special cases
  const specialCases = {
    'ProfessorOakMew': 'Professor Oak',
    'ElitesFourKaren': 'Karen',
    'LtSurgeRaichu': 'Lt. Surge',
    'PopPyTinkaton': 'Poppy',
    'PennyVaporeon': 'Penny',
    'AveryRapidashGalar': 'Avery'
  };

  if (specialCases[cardName]) {
    return specialCases[cardName];
  }

  // Pokemon names to strip from the end
  const pokemonNames = [
    'Garchomp', 'Charizard', 'Metagross', 'Dragonite', 'Starmie', 'Onix',
    'Tangela', 'Alakazam', 'Magmar', 'Weezing', 'Miltank', 'Gengar',
    'Poliwrath', 'Steelix', 'Delibird', 'Milotic', 'Skarmory', 'Magneton',
    'Camerupt', 'Lucario', 'Reshiram', 'Haxorus', 'Umbreon', 'Pidgeot',
    'Persian', 'Mew', 'Diancie', 'Groudon', 'Kyogre',
    'Lunala', 'Zacian', 'Koraidon', 'Urshifu', 'Eternatus', 'Mabosstiff',
    'Sylveon', 'Yamper', 'Zamazenta', 'Kingambit', 'Terapagos', 'Ogerpon',
    'Archaludon', 'Excadrill',
    'Duraludon', 'Grimmsnarl', 'Drednaw', 'Machamp', 'Alcremie', 'Toxtricity',
    'Whiscash', 'Tinkaton',
    'Eldegoss', 'Centiskorch', 'Lapras', 'Coalossal', 'Slowbro', 'Rapidash',
    'Luxray', 'Altaria'
  ];

  for (const pokemon of pokemonNames) {
    if (cardName.endsWith(pokemon)) {
      return cardName.slice(0, -pokemon.length);
    }
  }

  return cardName;
};

// Get support image with face positioning config
// Returns { image, config } where config has scale, offsetX, offsetY
export const getSupportImageWithConfig = (cardName) => {
  // First try normalizing the name to the new format
  const normalizedName = normalizeSupportName(cardName);
  const supportCard = SUPPORT_CARDS[normalizedName];

  let trainerName;
  if (supportCard) {
    // Use the trainer name from the support card
    trainerName = supportCard.trainer || supportCard.name;
  } else {
    // Fall back to extracting from legacy format
    trainerName = extractTrainerName(cardName);
  }

  const image = getSupportTrainerImage(trainerName);
  const config = getTrainerFaceConfig(trainerName);
  return { image, config, trainerName };
};
