const { SUPPORT_CARDS } = require('./src/shared/gameData.js');

// Calculate comprehensive power budget for a support card
function calculateComprehensivePower(card) {
  // 1. BASE STATS
  const baseStatsTotal = Object.values(card.baseStats).reduce((sum, val) => sum + val, 0);

  // 2. TRAINING BONUSES
  const typeMatchBonus = card.trainingBonus?.typeMatch || 0;
  const maxFriendshipBonus = card.trainingBonus?.maxFriendshipTypeMatch || 0;
  const otherStatsBonus = card.trainingBonus?.otherStats || 0;

  // 3. SPECIAL EFFECTS (power equivalents)
  let specialEffectPower = 0;
  if (card.specialEffect) {
    const effect = card.specialEffect;
    if (effect.statGainMultiplier) {
      // 15-25% bonus to stat gains
      const multiplier = effect.statGainMultiplier - 1; // Get the bonus percentage
      specialEffectPower += baseStatsTotal * multiplier * 0.5; // Half weight since it's multiplicative
    }
    if (effect.failRateReduction) {
      // Fail rate reduction worth ~133 points per 0.01
      specialEffectPower += effect.failRateReduction * 133;
    }
    if (effect.bonusMatchChance) {
      specialEffectPower += effect.bonusMatchChance * 100;
    }
    if (effect.friendshipGainBonus) {
      // Faster friendship = faster access to max bonuses
      specialEffectPower += effect.friendshipGainBonus * 2;
    }
    if (effect.skillPointMultiplier) {
      specialEffectPower += (effect.skillPointMultiplier - 1) * 40;
    }
    if (effect.maxEnergyBonus) {
      specialEffectPower += effect.maxEnergyBonus * 0.5;
    }
    if (effect.energyRegenBonus) {
      specialEffectPower += effect.energyRegenBonus * 3;
    }
    if (effect.energyCostReduction) {
      specialEffectPower += effect.energyCostReduction * 5;
    }
    if (effect.restBonus) {
      specialEffectPower += effect.restBonus * 2;
    }
  }

  // 4. APPEARANCE RATE MODIFIER (inverse relationship - rarer = more power allowed)
  // appearanceRate ranges from ~0.25 to ~0.60
  // Lower appearance = rarer = should be stronger
  // Scale: 0.25 = +15% power, 0.60 = -10% power
  const appearanceModifier = 1 + (0.425 - card.appearanceRate) * 0.6; // ~0.90 to 1.15

  // 5. TYPE MATCH PREFERENCE MODIFIER (higher preference = more restrictive = more power allowed)
  // typeMatchPreference ranges from ~0.05 to ~0.55
  // Higher preference = more restrictive = should be stronger
  // Scale: 0.05 = -5% power, 0.55 = +10% power
  const typePreferenceModifier = 1 + (card.typeMatchPreference - 0.30) * 0.3; // ~0.925 to 1.075

  // 6. INITIAL FRIENDSHIP MODIFIER (higher = faster access to bonuses = slight advantage)
  // initialFriendship ranges from 0 to 60
  // This is a minor factor: 0 = neutral, 60 = +5% power
  const friendshipModifier = 1 + (card.initialFriendship / 60) * 0.05; // 1.00 to 1.05

  // BASE POWER (stats + training + special effects)
  const basePower = baseStatsTotal + typeMatchBonus + maxFriendshipBonus + otherStatsBonus + specialEffectPower;

  // ADJUSTED POWER (applying modifiers)
  const adjustedPower = basePower * appearanceModifier * typePreferenceModifier * friendshipModifier;

  return {
    baseStatsTotal,
    typeMatchBonus,
    maxFriendshipBonus,
    otherStatsBonus,
    specialEffectPower,
    basePower,
    appearanceRate: card.appearanceRate,
    appearanceModifier,
    typeMatchPreference: card.typeMatchPreference,
    typePreferenceModifier,
    initialFriendship: card.initialFriendship,
    friendshipModifier,
    adjustedPower,
    rawPower: basePower // For comparison
  };
}

// Group cards by rarity
const cardsByRarity = {
  Legendary: [],
  Rare: [],
  Uncommon: [],
  Common: []
};

Object.entries(SUPPORT_CARDS).forEach(([name, card]) => {
  const power = calculateComprehensivePower(card);
  cardsByRarity[card.rarity].push({
    name,
    rarity: card.rarity,
    ...power,
    card
  });
});

// Analyze each tier
console.log('=== COMPREHENSIVE SUPPORT CARD ANALYSIS ===\n');

['Legendary', 'Rare', 'Uncommon', 'Common'].forEach(rarity => {
  const cards = cardsByRarity[rarity];
  if (cards.length === 0) return;

  const adjustedPowers = cards.map(c => c.adjustedPower);
  const rawPowers = cards.map(c => c.rawPower);

  const avgAdjusted = adjustedPowers.reduce((a, b) => a + b, 0) / adjustedPowers.length;
  const minAdjusted = Math.min(...adjustedPowers);
  const maxAdjusted = Math.max(...adjustedPowers);
  const varianceAdjusted = adjustedPowers.reduce((sum, p) => sum + Math.pow(p - avgAdjusted, 2), 0) / adjustedPowers.length;
  const stdDevAdjusted = Math.sqrt(varianceAdjusted);

  const avgRaw = rawPowers.reduce((a, b) => a + b, 0) / rawPowers.length;

  console.log(`\n${rarity.toUpperCase()} TIER`);
  console.log('─'.repeat(120));
  console.log(`Adjusted Power: Avg ${avgAdjusted.toFixed(1)}, Range ${minAdjusted.toFixed(1)}-${maxAdjusted.toFixed(1)}, StdDev ${stdDevAdjusted.toFixed(1)}, CV ${((stdDevAdjusted / avgAdjusted) * 100).toFixed(1)}%`);
  console.log(`Raw Power (no modifiers): Avg ${avgRaw.toFixed(1)}\n`);

  // Sort by adjusted power
  cards.sort((a, b) => b.adjustedPower - a.adjustedPower);

  console.log('Name                 Base   Train  Special  RawPwr  Appear  TypePref  InitFrnd  AdjPwr');
  console.log('─'.repeat(120));
  cards.forEach(c => {
    console.log(
      `${c.name.padEnd(19)} ${c.baseStatsTotal.toString().padStart(5)} ` +
      `${(c.typeMatchBonus + c.maxFriendshipBonus + c.otherStatsBonus).toString().padStart(6)} ` +
      `${c.specialEffectPower.toFixed(0).padStart(7)} ` +
      `${c.rawPower.toFixed(0).padStart(7)} ` +
      `${c.appearanceRate.toFixed(2).padStart(7)} ` +
      `${c.typeMatchPreference.toFixed(2).padStart(9)} ` +
      `${c.initialFriendship.toString().padStart(9)} ` +
      `${c.adjustedPower.toFixed(1).padStart(7)}`
    );
  });
});

// Show balance issues (10% tolerance)
console.log('\n\n=== BALANCE ISSUES (cards >10% from tier average) ===\n');

['Legendary', 'Rare', 'Uncommon', 'Common'].forEach(rarity => {
  const cards = cardsByRarity[rarity];
  if (cards.length === 0) return;

  const avgAdjusted = cards.reduce((sum, c) => sum + c.adjustedPower, 0) / cards.length;
  const issues = cards.filter(c => {
    const deviation = Math.abs(c.adjustedPower - avgAdjusted) / avgAdjusted;
    return deviation > 0.10;
  });

  if (issues.length > 0) {
    console.log(`${rarity.toUpperCase()} (target: ${avgAdjusted.toFixed(1)}):`);
    issues.forEach(c => {
      const deviation = ((c.adjustedPower - avgAdjusted) / avgAdjusted * 100).toFixed(1);
      const sign = deviation > 0 ? '+' : '';
      console.log(`  ${c.name.padEnd(20)} ${c.adjustedPower.toFixed(1).padStart(6)} (${sign}${deviation}%)`);
    });
    console.log('');
  }
});
