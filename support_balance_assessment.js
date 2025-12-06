/**
 * COMPREHENSIVE WEIGHTED SUPPORT CARD BALANCE ASSESSMENT
 *
 * This analysis uses a sophisticated model to calculate the expected value
 * of each support card attribute throughout a full 60-turn career.
 *
 * KEY GAME MECHANICS FACTORED IN:
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. TRAINING FREQUENCY (~42 trainings per 60-turn career)
 *    - Not every turn is a training (battles, rest, events)
 *    - Average ~70% of turns are trainings
 *
 * 2. SUPPORT APPEARANCE MECHANICS
 *    - Each support has an appearanceRate (0.32-0.60)
 *    - Supports compete for slots - higher rate = more appearances
 *    - typeMatchPreference affects which stat trainings they appear in
 *
 * 3. FRIENDSHIP PROGRESSION
 *    - Starts at initialFriendship (10-60)
 *    - Gains 10 per training (+ friendshipGainBonus if applicable)
 *    - Max friendship (100) unlocks massive maxFriendshipTypeMatch bonus
 *    - Early max friendship = more turns benefiting from bonus
 *
 * 4. TRAINING BONUS MECHANICS
 *    - typeMatch: Applied when training matches support's type (20% base chance)
 *    - otherStats: Applied when training doesn't match (80% base chance)
 *    - maxFriendshipTypeMatch: Replaces typeMatch when at max friendship
 *    - typeMatchPreference increases chance of appearing for your type
 *
 * 5. SPECIAL EFFECTS (situational but powerful)
 *    - statGainMultiplier: Multiplies ALL stat gains (very powerful)
 *    - skillPointMultiplier: More skill points for moves
 *    - failRateReduction: Prevents costly training failures
 *    - maxEnergyBonus/restBonus/energyRegenBonus: More trainings possible
 *    - friendshipGainBonus: Faster to max friendship
 *    - energyCostReduction: Cheaper trainings
 */

// Import support data
const fs = require('fs');
const path = require('path');

// Read the supports.js file and extract SUPPORT_CARDS
const supportsFile = fs.readFileSync(path.join(__dirname, 'src/shared/gamedata/supports.js'), 'utf8');
const match = supportsFile.match(/const SUPPORT_CARDS = ({[\s\S]*?});[\s\n]*const LEGACY/);
if (!match) {
  console.error('Could not parse SUPPORT_CARDS from supports.js');
  process.exit(1);
}
const SUPPORT_CARDS = eval('(' + match[1] + ')');

// ============================================================================
// GAME MECHANICS CONSTANTS (Based on actual game config)
// ============================================================================
const GAME_CONFIG = {
  TOTAL_TURNS: 60,
  ESTIMATED_TRAININGS: 42,           // ~70% of turns are training actions
  ESTIMATED_RESTS: 10,               // ~17% rest actions
  ESTIMATED_BATTLES: 8,              // 4 gyms + 4 Elite Four
  FRIENDSHIP_GAIN_PER_TRAINING: 10,
  MAX_FRIENDSHIP: 100,
  BASE_STAT_GAINS: { HP: 16, Attack: 10, Defense: 10, Instinct: 8, Speed: 6 },
  AVG_BASE_STAT_GAIN: 10,            // Average across all types
  SKILL_POINTS_ON_SUCCESS: 3,
  TRAINING_ENERGY_COSTS: { HP: 20, Attack: 25, Defense: 15, Instinct: 20, Speed: -5 },
  AVG_TRAINING_ENERGY_COST: 15,      // Weighted average
  BASE_ENERGY: 100,
  REST_ENERGY_AVG: 50,               // Weighted average (30×0.2 + 50×0.6 + 70×0.2)
  BASE_FAILURE_RATE: 0.08,           // Average failure rate
  STAT_LOSS_ON_FAILURE: 2,

  // Training distribution by stat type (how often each stat is trained)
  STAT_TRAINING_FREQ: { HP: 0.20, Attack: 0.25, Defense: 0.15, Instinct: 0.20, Speed: 0.20 },

  // Support type to stat mapping (for typeMatch calculations)
  TYPE_MATCH_BASE_RATE: 0.20         // Each of 5 types matches 20% of trainings
};

// ============================================================================
// INTELLIGENT WEIGHTED CALCULATIONS
// ============================================================================

/**
 * Calculate expected number of training appearances for a support card.
 *
 * MODEL:
 * - Base appearances = total trainings × appearance rate
 * - typeMatchPreference increases appearances when training that stat type
 * - Effective rate = base + (typeMatchPref × type frequency)
 */
function calculateExpectedAppearances(card) {
  const appearanceRate = card.appearanceRate || 0.45;
  const typeMatchPref = card.typeMatchPreference || 0.20;

  // Base appearances across all trainings
  const baseAppearances = GAME_CONFIG.ESTIMATED_TRAININGS * appearanceRate;

  // Type match preference bonus:
  // If you have high typeMatchPref, you appear MORE when your type is trained
  // This is worth extra because your typeMatch bonus applies more often
  const typeMatchBoost = 1 + (typeMatchPref * 0.15);

  return baseAppearances * typeMatchBoost;
}

/**
 * Calculate how many trainings occur AFTER reaching max friendship.
 *
 * This is critical because maxFriendshipTypeMatch is only active after
 * reaching 100 friendship - earlier max = more value from this bonus.
 *
 * MODEL:
 * - Each appearance gains friendship (10 base + friendshipGainBonus)
 * - Calculate appearances needed to reach 100
 * - Remaining appearances benefit from maxFriendshipTypeMatch
 */
function calculateMaxFriendshipMetrics(card) {
  const initialFriendship = card.initialFriendship || 30;
  const friendshipBonus = card.specialEffect?.friendshipGainBonus || 0;
  const friendshipPerAppearance = GAME_CONFIG.FRIENDSHIP_GAIN_PER_TRAINING + friendshipBonus;

  const expectedAppearances = calculateExpectedAppearances(card);

  // Appearances needed to reach max friendship
  const friendshipNeeded = GAME_CONFIG.MAX_FRIENDSHIP - initialFriendship;
  const appearancesToMax = Math.ceil(friendshipNeeded / friendshipPerAppearance);

  // Appearances remaining after reaching max
  const appearancesAtMax = Math.max(0, expectedAppearances - appearancesToMax);

  // What percentage of the career are we at max?
  const turnsToMax = Math.min(
    GAME_CONFIG.ESTIMATED_TRAININGS,
    (appearancesToMax / expectedAppearances) * GAME_CONFIG.ESTIMATED_TRAININGS
  );
  const maxFriendshipPct = Math.max(0, 1 - (turnsToMax / GAME_CONFIG.ESTIMATED_TRAININGS));

  return {
    turnsToMax: Math.round(turnsToMax),
    appearancesAtMax,
    maxFriendshipPct,
    totalAppearances: expectedAppearances
  };
}

/**
 * Calculate training bonus value with proper weighting.
 *
 * MODEL:
 * - typeMatch applies when support type = training type (20% base + typeMatchPref boost)
 * - otherStats applies when types don't match (remaining %)
 * - maxFriendshipTypeMatch replaces typeMatch when at max friendship
 *
 * Key insight: typeMatch bonus is worth MORE than otherStats because it
 * applies to the stat you're actively training (direct benefit).
 */
function calculateTrainingValue(card) {
  const appearances = calculateExpectedAppearances(card);
  const friendshipMetrics = calculateMaxFriendshipMetrics(card);
  const typeMatchPref = card.typeMatchPreference || 0.20;

  // Effective type match rate (base 20% + preference bonus)
  // typeMatchPreference increases how often you appear for your matched stat
  const effectiveTypeMatchRate = GAME_CONFIG.TYPE_MATCH_BASE_RATE + (typeMatchPref * 0.25);
  const otherStatsRate = 1 - effectiveTypeMatchRate;

  const typeMatch = card.trainingBonus?.typeMatch || 0;
  const otherStats = card.trainingBonus?.otherStats || 0;
  const maxFriendTypeMatch = card.trainingBonus?.maxFriendshipTypeMatch || 0;

  // Split appearances between pre-max and post-max friendship
  const preMaxAppearances = appearances - friendshipMetrics.appearancesAtMax;
  const postMaxAppearances = friendshipMetrics.appearancesAtMax;

  // Value from pre-max friendship appearances
  // typeMatch is worth 2x because it boosts the stat you're training
  const preMaxValue =
    (preMaxAppearances * effectiveTypeMatchRate * typeMatch * 2.0) +
    (preMaxAppearances * otherStatsRate * otherStats * 1.0);

  // Value from max friendship appearances (huge bonus when type-matched)
  // maxFriendshipTypeMatch is very valuable but situational
  const postMaxValue =
    (postMaxAppearances * effectiveTypeMatchRate * maxFriendTypeMatch * 2.5) +
    (postMaxAppearances * otherStatsRate * otherStats * 1.0);

  return {
    preMaxValue,
    postMaxValue,
    total: preMaxValue + postMaxValue
  };
}

/**
 * Calculate special effect value with intelligent weighting.
 *
 * Each effect type has different value based on:
 * - How often it triggers (appearance-based vs passive)
 * - The magnitude of the effect
 * - How it compounds with other mechanics
 */
function calculateSpecialEffectValue(card) {
  if (!card.specialEffect) return { total: 0, breakdown: {} };

  const appearances = calculateExpectedAppearances(card);
  const breakdown = {};
  let total = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // STAT GAIN MULTIPLIER (Most Powerful)
  // Multiplies ALL stat gains when support appears - compounds massively
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.statGainMultiplier) {
    const multiplier = card.specialEffect.statGainMultiplier;
    // Average training gives ~15 stats (base 10 + support bonus ~5)
    const avgStatGain = GAME_CONFIG.AVG_BASE_STAT_GAIN + 5;
    // Extra stats = (multiplier - 1) × base gain × appearances
    const extraStats = (multiplier - 1) * avgStatGain * appearances;
    breakdown.statGainMultiplier = extraStats * 1.5; // Premium for multiplicative effect
    total += breakdown.statGainMultiplier;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SKILL POINT MULTIPLIER (Very Valuable)
  // More skill points = faster move acquisition
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.skillPointMultiplier) {
    const multiplier = card.specialEffect.skillPointMultiplier;
    const baseSkill = GAME_CONFIG.SKILL_POINTS_ON_SUCCESS;
    // Extra SP per appearance
    const extraSP = (multiplier - 1) * baseSkill * appearances;
    // SP worth ~0.6 stat points (moves are valuable but capped)
    breakdown.skillPointMultiplier = extraSP * 0.6;
    total += breakdown.skillPointMultiplier;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FAIL RATE REDUCTION (High Value)
  // Prevents stat LOSS (-2) and missed GAINS (~12 total swing)
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.failRateReduction) {
    const reduction = card.specialEffect.failRateReduction;
    // Expected failures prevented = total trainings × base fail rate × reduction
    const failuresPrevented = GAME_CONFIG.ESTIMATED_TRAININGS * GAME_CONFIG.BASE_FAILURE_RATE * (reduction / GAME_CONFIG.BASE_FAILURE_RATE);
    // Each prevented failure saves: 2 stat loss + ~10 missed gains = 12 effective stats
    breakdown.failRateReduction = failuresPrevented * 12 * 1.5;
    total += breakdown.failRateReduction;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FRIENDSHIP GAIN BONUS (Indirect Value)
  // Faster max friendship = more maxFriendshipTypeMatch applications
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.friendshipGainBonus) {
    const bonus = card.specialEffect.friendshipGainBonus;
    // Already factored into training calculations, but add utility value
    // Faster bonding also improves hangout event timing
    breakdown.friendshipGainBonus = bonus * appearances * 0.3;
    total += breakdown.friendshipGainBonus;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAX ENERGY BONUS (Moderate Value)
  // More max energy = fewer rests needed = more trainings
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.maxEnergyBonus) {
    const bonus = card.specialEffect.maxEnergyBonus;
    // Every ~20 extra max energy ≈ 0.5 extra training per career
    const extraTrainings = (bonus / GAME_CONFIG.AVG_TRAINING_ENERGY_COST) * 0.4;
    // Each training worth ~15 stats
    breakdown.maxEnergyBonus = extraTrainings * 15;
    total += breakdown.maxEnergyBonus;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REST BONUS (Moderate Value)
  // More energy per rest = fewer total rests = more trainings
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.restBonus) {
    const bonus = card.specialEffect.restBonus;
    // ~10 rests per career, each extra energy point saves ~0.02 trainings
    const extraEnergy = bonus * GAME_CONFIG.ESTIMATED_RESTS;
    const extraTrainings = extraEnergy / GAME_CONFIG.AVG_TRAINING_ENERGY_COST * 0.3;
    breakdown.restBonus = extraTrainings * 15;
    total += breakdown.restBonus;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ENERGY REGEN BONUS (Moderate Value)
  // Extra energy during speed training
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.energyRegenBonus) {
    const bonus = card.specialEffect.energyRegenBonus;
    // Speed trained ~20% of trainings = ~8.4 times
    const speedTrainings = GAME_CONFIG.ESTIMATED_TRAININGS * GAME_CONFIG.STAT_TRAINING_FREQ.Speed;
    const extraEnergy = bonus * speedTrainings;
    const extraTrainings = extraEnergy / GAME_CONFIG.AVG_TRAINING_ENERGY_COST * 0.25;
    breakdown.energyRegenBonus = extraTrainings * 15;
    total += breakdown.energyRegenBonus;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ENERGY COST REDUCTION (Moderate Value)
  // Cheaper trainings = more trainings possible
  // ═══════════════════════════════════════════════════════════════════════
  if (card.specialEffect.energyCostReduction) {
    const reduction = card.specialEffect.energyCostReduction;
    // Energy saved per career = reduction × trainings
    const energySaved = reduction * GAME_CONFIG.ESTIMATED_TRAININGS;
    const extraTrainings = energySaved / GAME_CONFIG.AVG_TRAINING_ENERGY_COST * 0.3;
    breakdown.energyCostReduction = extraTrainings * 15;
    total += breakdown.energyCostReduction;
  }

  return { total, breakdown };
}

/**
 * Calculate base stats contribution.
 *
 * Base stats are a one-time bonus that applies to your Pokemon.
 * Less impactful than repeated training bonuses but still valuable.
 */
function calculateBaseStatsValue(card) {
  const stats = card.baseStats || {};
  const total = (stats.HP || 0) + (stats.Attack || 0) + (stats.Defense || 0) +
               (stats.Instinct || 0) + (stats.Speed || 0);

  // Weight base stats at 0.4x compared to training bonuses
  // (they apply once vs. training bonuses applying many times)
  return total * 0.4;
}

/**
 * Calculate appearance rate value (how often you see this support).
 *
 * Higher appearance = more training bonus applications.
 * This is factored into other calculations but we add bonus for consistency.
 */
function calculateAppearanceValue(card) {
  const rate = card.appearanceRate || 0.45;
  // Bonus for being above baseline (0.45)
  // Penalty for being below
  return (rate - 0.40) * 80;
}

/**
 * Calculate overall weighted score for a support card.
 */
function calculateWeightedScore(card) {
  const trainingValue = calculateTrainingValue(card);
  const specialEffects = calculateSpecialEffectValue(card);
  const friendshipMetrics = calculateMaxFriendshipMetrics(card);

  const components = {
    baseStats: calculateBaseStatsValue(card),
    trainingPreMax: trainingValue.preMaxValue,
    trainingPostMax: trainingValue.postMaxValue,
    trainingTotal: trainingValue.total,
    specialEffect: specialEffects.total,
    specialBreakdown: specialEffects.breakdown,
    appearanceBonus: calculateAppearanceValue(card),
    appearances: calculateExpectedAppearances(card),
    turnsToMaxFriendship: friendshipMetrics.turnsToMax,
    maxFriendshipPct: friendshipMetrics.maxFriendshipPct,
    appearancesAtMax: friendshipMetrics.appearancesAtMax
  };

  // Total weighted score
  components.total =
    components.baseStats +
    components.trainingTotal +
    components.specialEffect +
    components.appearanceBonus;

  return components;
}

// ============================================================================
// RUN ANALYSIS
// ============================================================================

console.log('\n' + '═'.repeat(120));
console.log('  COMPREHENSIVE WEIGHTED SUPPORT CARD BALANCE ASSESSMENT');
console.log('═'.repeat(120));
console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
console.log('│ METHODOLOGY                                                                                                         │');
console.log('├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤');
console.log('│ • Expected Appearances = 42 trainings × appearanceRate × (1 + typeMatchPref × 0.15)                                │');
console.log('│ • Friendship Model: Tracks turns to reach 100 friendship, calculates appearances at max                            │');
console.log('│ • Training Value: Pre-max (typeMatch×2, otherStats×1) + Post-max (maxFriendTypeMatch×2.5, otherStats×1)           │');
console.log('│ • Special Effects: Weighted by actual game impact (statGainMult > skillPtMult > failReduction > energy effects)   │');
console.log('│ • Base Stats: Weighted at 0.4x (one-time bonus vs repeated training bonuses)                                       │');
console.log('│ • Appearance Bonus: Additional value for high appearance rates (more opportunities to benefit)                     │');
console.log('└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');
console.log('');

// Calculate scores for all cards
const results = [];
for (const [name, card] of Object.entries(SUPPORT_CARDS)) {
  const score = calculateWeightedScore(card);
  results.push({
    name,
    rarity: card.rarity,
    supportType: card.supportType,
    initialFriendship: card.initialFriendship || 0,
    appearanceRate: card.appearanceRate || 0.45,
    typeMatchPreference: card.typeMatchPreference || 0.20,
    trainingBonus: card.trainingBonus || {},
    ...score,
    card
  });
}

// Sort by total score
results.sort((a, b) => b.total - a.total);

// ============================================================================
// OVERALL RANKINGS
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  OVERALL POWER RANKINGS (All Rarities Combined)');
console.log('═'.repeat(130));
console.log('');
console.log('  Rank  Name                 Rarity      Type       TOTAL   Base  Train  Effect  AppBns │ Apps  TurnsMF  MaxF%   Assessment');
console.log('  ' + '─'.repeat(126));

results.forEach((r, idx) => {
  const rank = (idx + 1).toString().padStart(3);
  const name = r.name.padEnd(20);
  const rarity = r.rarity.padEnd(10);
  const type = r.supportType.padEnd(8);
  const total = r.total.toFixed(1).padStart(7);
  const base = r.baseStats.toFixed(0).padStart(5);
  const train = r.trainingTotal.toFixed(0).padStart(6);
  const effect = r.specialEffect.toFixed(0).padStart(7);
  const appBns = r.appearanceBonus.toFixed(0).padStart(6);
  const apps = r.appearances.toFixed(1).padStart(5);
  const turnsMF = r.turnsToMaxFriendship.toString().padStart(7);
  const maxPct = (r.maxFriendshipPct * 100).toFixed(0).padStart(4) + '%';

  // Assessment based on deviation from rarity average
  const rarityCards = results.filter(x => x.rarity === r.rarity);
  const rarityAvg = rarityCards.reduce((a, b) => a + b.total, 0) / rarityCards.length;
  const deviation = ((r.total - rarityAvg) / rarityAvg * 100);

  let assessment = '';
  let marker = '  ';
  if (deviation > 20) { assessment = 'OVERPOWERED'; marker = '▲▲'; }
  else if (deviation > 12) { assessment = 'Strong'; marker = '▲ '; }
  else if (deviation > -12) { assessment = 'Balanced'; marker = '  '; }
  else if (deviation > -20) { assessment = 'Weak'; marker = '▼ '; }
  else { assessment = 'UNDERPOWERED'; marker = '▼▼'; }

  const devStr = (deviation > 0 ? '+' : '') + deviation.toFixed(1) + '%';

  console.log(`${marker}${rank}. ${name} ${rarity} ${type} ${total} ${base} ${train} ${effect} ${appBns} │${apps} ${turnsMF} ${maxPct}   ${assessment.padEnd(12)} (${devStr})`);
});

// ============================================================================
// RARITY BREAKDOWN WITH DETAILED ANALYSIS
// ============================================================================

const rarities = ['Legendary', 'Rare', 'Uncommon', 'Common'];

for (const rarity of rarities) {
  const rarityCards = results.filter(r => r.rarity === rarity);
  if (rarityCards.length === 0) continue;

  const rarityScores = rarityCards.map(r => r.total);
  const rarityAvg = rarityScores.reduce((a, b) => a + b, 0) / rarityScores.length;
  const rarityMax = Math.max(...rarityScores);
  const rarityMin = Math.min(...rarityScores);
  const stdDev = Math.sqrt(rarityScores.reduce((sum, s) => sum + Math.pow(s - rarityAvg, 2), 0) / rarityScores.length);

  console.log('\n' + '═'.repeat(130));
  console.log(`  ${rarity.toUpperCase()} TIER ANALYSIS (${rarityCards.length} cards)`);
  console.log('═'.repeat(130));
  console.log(`  Average: ${rarityAvg.toFixed(1)} │ Range: ${rarityMin.toFixed(1)} - ${rarityMax.toFixed(1)} │ Std Dev: ${stdDev.toFixed(1)} │ Coefficient of Variation: ${(stdDev/rarityAvg*100).toFixed(1)}%`);
  console.log('');
  console.log('  Name                 TOTAL   Base  Train Effect AppBns │ TM/OS/MF   AppRate  InitF  TurnsMF │ Deviation   Balance Issue');
  console.log('  ' + '─'.repeat(126));

  rarityCards.sort((a, b) => b.total - a.total);

  rarityCards.forEach(r => {
    const name = r.name.padEnd(20);
    const total = r.total.toFixed(1).padStart(6);
    const base = r.baseStats.toFixed(0).padStart(5);
    const train = r.trainingTotal.toFixed(0).padStart(6);
    const effect = r.specialEffect.toFixed(0).padStart(6);
    const appBns = r.appearanceBonus.toFixed(0).padStart(6);

    // Training bonus breakdown
    const tm = r.trainingBonus.typeMatch || 0;
    const os = r.trainingBonus.otherStats || 0;
    const mf = r.trainingBonus.maxFriendshipTypeMatch || 0;
    const tmOsMf = `${tm}/${os}/${mf}`.padStart(9);

    const appRate = r.appearanceRate.toFixed(2).padStart(8);
    const initF = r.initialFriendship.toString().padStart(5);
    const turnsMF = r.turnsToMaxFriendship.toString().padStart(7);

    const deviation = ((r.total - rarityAvg) / rarityAvg * 100);
    const devStr = (deviation > 0 ? '+' : '') + deviation.toFixed(1) + '%';

    // Identify specific balance issues
    let issue = '';
    let marker = '  ';
    if (deviation > 20) { issue = 'OVERTUNED - needs nerf'; marker = '▲▲'; }
    else if (deviation < -20) { issue = 'UNDERTUNED - needs buff'; marker = '▼▼'; }
    else if (r.appearances < 15) { issue = 'Very low appearance'; marker = '! '; }
    else if (r.turnsToMaxFriendship > 35 && mf > 20) { issue = 'Slow friendship, high MF bonus'; marker = '? '; }
    else if (r.specialEffect === 0 && rarity === 'Legendary') { issue = 'Missing special effect'; marker = '! '; }
    else if (r.trainingTotal < rarityAvg * 0.3) { issue = 'Weak training contribution'; marker = '? '; }
    else if (deviation > 12) { issue = 'Slightly strong'; marker = '▲ '; }
    else if (deviation < -12) { issue = 'Slightly weak'; marker = '▼ '; }

    console.log(`${marker}${name} ${total} ${base} ${train} ${effect} ${appBns} │${tmOsMf} ${appRate} ${initF} ${turnsMF} │ ${devStr.padStart(9)}   ${issue}`);
  });
}

// ============================================================================
// TIER POWER RATIOS
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  TIER POWER RATIOS (How Much Stronger Each Tier Is)');
console.log('═'.repeat(130));

const tierAverages = {};
for (const rarity of rarities) {
  const rarityCards = results.filter(r => r.rarity === rarity);
  if (rarityCards.length > 0) {
    tierAverages[rarity] = rarityCards.reduce((a, b) => a + b.total, 0) / rarityCards.length;
  }
}

console.log(`\n  Legendary:  ${tierAverages.Legendary?.toFixed(1) || 'N/A'} average power`);
if (tierAverages.Legendary && tierAverages.Rare) {
  const ratio = (tierAverages.Legendary / tierAverages.Rare).toFixed(2);
  console.log(`  Rare:       ${tierAverages.Rare.toFixed(1)} average (Legendary is ${ratio}x stronger) [Target: 1.25-1.35x]`);
}
if (tierAverages.Rare && tierAverages.Uncommon) {
  const ratio = (tierAverages.Rare / tierAverages.Uncommon).toFixed(2);
  console.log(`  Uncommon:   ${tierAverages.Uncommon.toFixed(1)} average (Rare is ${ratio}x stronger) [Target: 1.25-1.35x]`);
}
if (tierAverages.Uncommon && tierAverages.Common) {
  const ratio = (tierAverages.Uncommon / tierAverages.Common).toFixed(2);
  console.log(`  Common:     ${tierAverages.Common.toFixed(1)} average (Uncommon is ${ratio}x stronger) [Target: 1.25-1.35x]`);
}

// ============================================================================
// BALANCE RECOMMENDATIONS
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  BALANCE RECOMMENDATIONS');
console.log('═'.repeat(130));

// Find outliers (more than 15% from rarity average)
console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
console.log('│ CARDS NEEDING NERFS (>15% above rarity average)                                                                            │');
console.log('└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');

let hasNerfs = false;
for (const rarity of rarities) {
  const rarityCards = results.filter(r => r.rarity === rarity);
  const rarityAvg = rarityCards.reduce((a, b) => a + b.total, 0) / rarityCards.length;

  const overpowered = rarityCards.filter(r => (r.total - rarityAvg) / rarityAvg > 0.15).sort((a, b) => b.total - a.total);
  overpowered.forEach(r => {
    hasNerfs = true;
    const deviation = ((r.total - rarityAvg) / rarityAvg * 100).toFixed(1);
    console.log(`\n  ▲ ${r.name} (${rarity}): +${deviation}% above average [Score: ${r.total.toFixed(1)} vs avg ${rarityAvg.toFixed(1)}]`);

    // Recommend specific nerfs based on what's contributing most
    const contributions = [
      { name: 'Training bonuses', value: r.trainingTotal, threshold: rarityAvg * 0.6 },
      { name: 'Special effects', value: r.specialEffect, threshold: 25 },
      { name: 'Appearance bonus', value: r.appearanceBonus, threshold: 10 }
    ].filter(c => c.value > c.threshold).sort((a, b) => b.value - a.value);

    if (contributions.length > 0) {
      console.log(`    Primary strength: ${contributions[0].name} (${contributions[0].value.toFixed(0)} points)`);
    }

    if (r.appearances > 22) {
      console.log(`    → Consider: Reduce appearanceRate from ${r.card.appearanceRate.toFixed(2)} to ${(r.card.appearanceRate * 0.90).toFixed(2)}`);
    }
    if (r.specialEffect > 35) {
      console.log(`    → Consider: Reduce special effect magnitude by ~15-20%`);
    }
    if (r.trainingTotal > rarityAvg * 0.7) {
      const suggestedTypeMatch = Math.floor(r.card.trainingBonus.typeMatch * 0.90);
      console.log(`    → Consider: Reduce typeMatch from ${r.card.trainingBonus.typeMatch} to ${suggestedTypeMatch}`);
    }
  });
}
if (!hasNerfs) console.log('\n  (No cards significantly overpowered)');

console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐');
console.log('│ CARDS NEEDING BUFFS (>15% below rarity average)                                                                            │');
console.log('└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘');

let hasBuffs = false;
for (const rarity of rarities) {
  const rarityCards = results.filter(r => r.rarity === rarity);
  const rarityAvg = rarityCards.reduce((a, b) => a + b.total, 0) / rarityCards.length;

  const underpowered = rarityCards.filter(r => (r.total - rarityAvg) / rarityAvg < -0.15).sort((a, b) => a.total - b.total);
  underpowered.forEach(r => {
    hasBuffs = true;
    const deviation = ((r.total - rarityAvg) / rarityAvg * 100).toFixed(1);
    console.log(`\n  ▼ ${r.name} (${rarity}): ${deviation}% below average [Score: ${r.total.toFixed(1)} vs avg ${rarityAvg.toFixed(1)}]`);

    // Identify weaknesses
    const weaknesses = [];
    if (r.appearances < 17) weaknesses.push(`Low appearances (${r.appearances.toFixed(1)})`);
    if (r.turnsToMaxFriendship > 30) weaknesses.push(`Slow to max friendship (${r.turnsToMaxFriendship} turns)`);
    if (r.specialEffect === 0 && (rarity === 'Legendary' || rarity === 'Rare')) weaknesses.push('No special effect');
    if (r.trainingTotal < rarityAvg * 0.4) weaknesses.push(`Weak training bonuses (${r.trainingTotal.toFixed(0)} pts)`);

    if (weaknesses.length > 0) {
      console.log(`    Weaknesses: ${weaknesses.join(', ')}`);
    }

    // Recommend specific buffs
    if (r.appearances < 18) {
      const suggestedRate = Math.min(0.58, r.card.appearanceRate * 1.15);
      console.log(`    → Consider: Increase appearanceRate from ${r.card.appearanceRate.toFixed(2)} to ${suggestedRate.toFixed(2)}`);
    }
    if (r.turnsToMaxFriendship > 28 && !r.card.specialEffect?.friendshipGainBonus) {
      const suggestedFriendship = Math.min(55, r.card.initialFriendship + 10);
      console.log(`    → Consider: Increase initialFriendship from ${r.card.initialFriendship} to ${suggestedFriendship}`);
    }
    if (r.specialEffect === 0 && (rarity === 'Legendary' || rarity === 'Rare')) {
      console.log(`    → Consider: Add special effect (e.g., failRateReduction: 0.08 or skillPointMultiplier: 1.15)`);
    }
    if (r.trainingTotal < rarityAvg * 0.45) {
      const suggestedTypeMatch = Math.ceil(r.card.trainingBonus.typeMatch * 1.12);
      const suggestedMF = Math.ceil(r.card.trainingBonus.maxFriendshipTypeMatch * 1.12);
      console.log(`    → Consider: Increase typeMatch ${r.card.trainingBonus.typeMatch}→${suggestedTypeMatch}, maxFriendshipTypeMatch ${r.card.trainingBonus.maxFriendshipTypeMatch}→${suggestedMF}`);
    }
  });
}
if (!hasBuffs) console.log('\n  (No cards significantly underpowered)');

// ============================================================================
// SPECIAL EFFECT ANALYSIS
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  SPECIAL EFFECT VALUE ANALYSIS');
console.log('═'.repeat(130));

const effectTypes = {};
results.forEach(r => {
  if (r.card.specialEffect) {
    for (const [effect, value] of Object.entries(r.card.specialEffect)) {
      if (!effectTypes[effect]) effectTypes[effect] = [];
      effectTypes[effect].push({
        name: r.name,
        rarity: r.rarity,
        value,
        totalEffectValue: r.specialEffect,
        effectBreakdown: r.specialBreakdown,
        appearances: r.appearances
      });
    }
  }
});

// Effect tier list (most to least impactful)
const effectOrder = [
  'statGainMultiplier',
  'skillPointMultiplier',
  'failRateReduction',
  'maxEnergyBonus',
  'restBonus',
  'energyRegenBonus',
  'friendshipGainBonus',
  'energyCostReduction'
];

for (const effect of effectOrder) {
  const cards = effectTypes[effect];
  if (!cards || cards.length === 0) continue;

  cards.sort((a, b) => (b.effectBreakdown[effect] || 0) - (a.effectBreakdown[effect] || 0));

  const avgValue = cards.reduce((sum, c) => sum + c.value, 0) / cards.length;
  const avgContribution = cards.reduce((sum, c) => sum + (c.effectBreakdown[effect] || 0), 0) / cards.length;

  console.log(`\n  ┌─ ${effect} (${cards.length} cards) ─────────────────────────────────────────────────────────────────────────────────────────────┐`);
  console.log(`  │  Average value: ${avgValue.toFixed(2)} │ Average contribution to score: ${avgContribution.toFixed(1)} points`);
  console.log(`  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`);
  console.log('    Name                 Rarity       Value   Effect Pts   Total Score   Appearances');
  console.log('    ' + '─'.repeat(88));

  cards.forEach(c => {
    const effectPts = c.effectBreakdown[effect] || 0;
    console.log(`    ${c.name.padEnd(20)} ${c.rarity.padEnd(12)} ${c.value.toString().padStart(6)}   ${effectPts.toFixed(1).padStart(10)}   ${c.totalEffectValue.toFixed(1).padStart(11)}   ${c.appearances.toFixed(1).padStart(11)}`);
  });
}

// ============================================================================
// SUPPORT TYPE DISTRIBUTION
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  SUPPORT TYPE BALANCE');
console.log('═'.repeat(130));

const byType = {};
results.forEach(r => {
  if (!byType[r.supportType]) byType[r.supportType] = [];
  byType[r.supportType].push(r);
});

console.log('\n  Type        Count   Avg Score   Legendaries   Rares   Uncommons   Commons');
console.log('  ' + '─'.repeat(80));

for (const [type, cards] of Object.entries(byType)) {
  const avgScore = cards.reduce((sum, c) => sum + c.total, 0) / cards.length;
  const legendary = cards.filter(c => c.rarity === 'Legendary').length;
  const rare = cards.filter(c => c.rarity === 'Rare').length;
  const uncommon = cards.filter(c => c.rarity === 'Uncommon').length;
  const common = cards.filter(c => c.rarity === 'Common').length;

  console.log(`  ${type.padEnd(10)} ${cards.length.toString().padStart(5)}   ${avgScore.toFixed(1).padStart(9)}   ${legendary.toString().padStart(11)}   ${rare.toString().padStart(5)}   ${uncommon.toString().padStart(9)}   ${common.toString().padStart(7)}`);
}

// ============================================================================
// FRIENDSHIP EFFICIENCY ANALYSIS
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  FRIENDSHIP EFFICIENCY ANALYSIS');
console.log('═'.repeat(130));
console.log('\n  Cards that benefit most from max friendship mechanics:\n');

const friendshipRanking = results
  .map(r => ({
    name: r.name,
    rarity: r.rarity,
    initialFriendship: r.initialFriendship,
    turnsToMax: r.turnsToMaxFriendship,
    maxFriendshipPct: r.maxFriendshipPct,
    appearancesAtMax: r.appearancesAtMax,
    maxFBonus: r.trainingBonus.maxFriendshipTypeMatch || 0,
    friendshipGainBonus: r.card.specialEffect?.friendshipGainBonus || 0,
    postMaxValue: r.trainingPostMax
  }))
  .sort((a, b) => b.postMaxValue - a.postMaxValue)
  .slice(0, 20);

console.log('  Name                 Rarity       InitF  +Bonus  TurnsMax  MaxF%  AppsMax   MFBonus   PostMaxValue');
console.log('  ' + '─'.repeat(105));

friendshipRanking.forEach(r => {
  const bonusStr = r.friendshipGainBonus > 0 ? `+${r.friendshipGainBonus}` : '-';
  console.log(`  ${r.name.padEnd(20)} ${r.rarity.padEnd(12)} ${r.initialFriendship.toString().padStart(5)}  ${bonusStr.padStart(6)}  ${r.turnsToMax.toString().padStart(8)}  ${(r.maxFriendshipPct * 100).toFixed(0).padStart(4)}%  ${r.appearancesAtMax.toFixed(1).padStart(7)}   ${r.maxFBonus.toString().padStart(7)}   ${r.postMaxValue.toFixed(1).padStart(12)}`);
});

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================

console.log('\n' + '═'.repeat(130));
console.log('  SUMMARY STATISTICS');
console.log('═'.repeat(130));

console.log('\n  Score Distribution by Rarity:');
console.log('  ' + '─'.repeat(80));
for (const rarity of rarities) {
  const rarityCards = results.filter(r => r.rarity === rarity);
  if (rarityCards.length === 0) continue;

  const scores = rarityCards.map(r => r.total).sort((a, b) => a - b);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const median = scores[Math.floor(scores.length / 2)];
  const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length);
  const cv = (stdDev / avg * 100).toFixed(1);

  console.log(`    ${rarity.padEnd(12)} Avg: ${avg.toFixed(1).padStart(7)} │ Median: ${median.toFixed(1).padStart(7)} │ StdDev: ${stdDev.toFixed(1).padStart(6)} │ CV: ${cv.padStart(5)}% │ Count: ${rarityCards.length}`);
}

console.log('\n  Component Contribution (Average across all cards):');
console.log('  ' + '─'.repeat(60));
const avgBase = results.reduce((a, r) => a + r.baseStats, 0) / results.length;
const avgTrain = results.reduce((a, r) => a + r.trainingTotal, 0) / results.length;
const avgEffect = results.reduce((a, r) => a + r.specialEffect, 0) / results.length;
const avgAppBns = results.reduce((a, r) => a + r.appearanceBonus, 0) / results.length;
const avgTotal = avgBase + avgTrain + avgEffect + avgAppBns;

console.log(`    Base Stats:       ${avgBase.toFixed(1).padStart(7)} points (${(avgBase / avgTotal * 100).toFixed(1).padStart(5)}%)`);
console.log(`    Training Bonuses: ${avgTrain.toFixed(1).padStart(7)} points (${(avgTrain / avgTotal * 100).toFixed(1).padStart(5)}%)`);
console.log(`    Special Effects:  ${avgEffect.toFixed(1).padStart(7)} points (${(avgEffect / avgTotal * 100).toFixed(1).padStart(5)}%)`);
console.log(`    Appearance Bonus: ${avgAppBns.toFixed(1).padStart(7)} points (${(avgAppBns / avgTotal * 100).toFixed(1).padStart(5)}%)`);

console.log('\n  Appearance Rate Impact:');
console.log('  ' + '─'.repeat(60));
const highAppCards = results.filter(r => r.appearances > 21);
const midAppCards = results.filter(r => r.appearances >= 16 && r.appearances <= 21);
const lowAppCards = results.filter(r => r.appearances < 16);
if (highAppCards.length > 0)
  console.log(`    High appearance (>21): ${highAppCards.length.toString().padStart(2)} cards, avg score: ${(highAppCards.reduce((a, r) => a + r.total, 0) / highAppCards.length).toFixed(1)}`);
if (midAppCards.length > 0)
  console.log(`    Mid appearance (16-21): ${midAppCards.length.toString().padStart(2)} cards, avg score: ${(midAppCards.reduce((a, r) => a + r.total, 0) / midAppCards.length).toFixed(1)}`);
if (lowAppCards.length > 0)
  console.log(`    Low appearance (<16): ${lowAppCards.length.toString().padStart(2)} cards, avg score: ${(lowAppCards.reduce((a, r) => a + r.total, 0) / lowAppCards.length).toFixed(1)}`);

console.log('\n  Friendship Speed Impact:');
console.log('  ' + '─'.repeat(60));
const fastMaxCards = results.filter(r => r.turnsToMaxFriendship <= 20);
const midMaxCards = results.filter(r => r.turnsToMaxFriendship > 20 && r.turnsToMaxFriendship <= 35);
const slowMaxCards = results.filter(r => r.turnsToMaxFriendship > 35);
if (fastMaxCards.length > 0)
  console.log(`    Fast (≤20 turns to max): ${fastMaxCards.length.toString().padStart(2)} cards, avg score: ${(fastMaxCards.reduce((a, r) => a + r.total, 0) / fastMaxCards.length).toFixed(1)}`);
if (midMaxCards.length > 0)
  console.log(`    Medium (21-35 turns):    ${midMaxCards.length.toString().padStart(2)} cards, avg score: ${(midMaxCards.reduce((a, r) => a + r.total, 0) / midMaxCards.length).toFixed(1)}`);
if (slowMaxCards.length > 0)
  console.log(`    Slow (>35 turns):        ${slowMaxCards.length.toString().padStart(2)} cards, avg score: ${(slowMaxCards.reduce((a, r) => a + r.total, 0) / slowMaxCards.length).toFixed(1)}`);

console.log('\n' + '═'.repeat(130));
console.log('  END OF COMPREHENSIVE BALANCE ASSESSMENT');
console.log('═'.repeat(130) + '\n');
