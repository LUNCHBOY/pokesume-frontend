const fs = require('fs');
const path = require('path');

const gameDataPath = path.join(__dirname, 'src', 'shared', 'gameData.js');
let gameDataContent = fs.readFileSync(gameDataPath, 'utf8');

// Cards that need adjustment (>10% from tier average)
const rebalanceChanges = {
  // LEGENDARY TIER (target: 149, tolerance 10% = 134-164)
  Fire: {
    // Currently 169.4 -> Target ~160 (reduce by ~9)
    // He's rare with high type pref, so reduce base stats by 7
    baseStats: { from: { HP: 0, Attack: 70, Defense: 0, Instinct: 10, Speed: 15 }, to: { HP: 0, Attack: 65, Defense: 0, Instinct: 10, Speed: 13 } }
  },
  Mustard: {
    // Currently 168.0 -> Target ~160 (reduce by ~8)
    // Reduce base stats by 5, training by 2
    baseStats: { from: { HP: 0, Attack: 65, Defense: 10, Instinct: 5, Speed: 12 }, to: { HP: 0, Attack: 62, Defense: 10, Instinct: 5, Speed: 10 } },
    training: { from: { typeMatch: 11, otherStats: 1, maxFriendshipTypeMatch: 29 }, to: { typeMatch: 10, otherStats: 1, maxFriendshipTypeMatch: 28 } }
  },
  Penny: {
    // Currently 167.6 -> Target ~160 (reduce by ~8)
    // Reduce base stats by 5, training by 2
    baseStats: { from: { HP: 25, Attack: 10, Defense: 20, Instinct: 25, Speed: 20 }, to: { HP: 22, Attack: 10, Defense: 18, Instinct: 25, Speed: 18 } },
    training: { from: { typeMatch: 7, otherStats: 3, maxFriendshipTypeMatch: 21 }, to: { typeMatch: 7, otherStats: 3, maxFriendshipTypeMatch: 20 } }
  },
  Cynthia: {
    // Currently 130.6 -> Target ~140 (increase by ~9)
    // Increase base stats by 7, training by 2
    baseStats: { from: { HP: 0, Attack: 20, Defense: 0, Instinct: 45, Speed: 10 }, to: { HP: 0, Attack: 22, Defense: 0, Instinct: 50, Speed: 11 } },
    training: { from: { typeMatch: 14, otherStats: 2, maxFriendshipTypeMatch: 36 }, to: { typeMatch: 15, otherStats: 2, maxFriendshipTypeMatch: 37 } }
  },

  // RARE TIER (target: 106, tolerance 10% = 95-117)
  Bea: {
    // Currently 121.2 -> Target ~112 (reduce by ~9)
    // Reduce base stats by 5, training by 3
    baseStats: { from: { HP: 0, Attack: 48, Defense: 0, Instinct: 0, Speed: 27 }, to: { HP: 0, Attack: 45, Defense: 0, Instinct: 0, Speed: 24 } },
    training: { from: { typeMatch: 9, otherStats: 1, maxFriendshipTypeMatch: 31 }, to: { typeMatch: 8, otherStats: 1, maxFriendshipTypeMatch: 29 } }
  },
  Marnie: {
    // Currently 117.0 -> Target ~112 (reduce by ~5)
    // Reduce base stats by 3, training by 1
    baseStats: { from: { HP: 0, Attack: 0, Defense: 0, Instinct: 60, Speed: 20 }, to: { HP: 0, Attack: 0, Defense: 0, Instinct: 58, Speed: 18 } },
    training: { from: { typeMatch: 6, otherStats: 3, maxFriendshipTypeMatch: 15 }, to: { typeMatch: 6, otherStats: 3, maxFriendshipTypeMatch: 14 } }
  },
  Water: {
    // Currently 93.8 -> Target ~100 (increase by ~6)
    // Increase base stats by 4, training by 2
    baseStats: { from: { HP: 15, Attack: 17, Defense: 17, Instinct: 15, Speed: 6 }, to: { HP: 18, Attack: 18, Defense: 18, Instinct: 15, Speed: 7 } },
    training: { from: { typeMatch: 5, otherStats: 4, maxFriendshipTypeMatch: 10 }, to: { typeMatch: 5, otherStats: 4, maxFriendshipTypeMatch: 12 } }
  },
  Maxie: {
    // Currently 91.1 -> Target ~100 (increase by ~9)
    // Increase base stats by 6, training by 3
    baseStats: { from: { HP: 0, Attack: 50, Defense: 0, Instinct: 10, Speed: 10 }, to: { HP: 0, Attack: 54, Defense: 0, Instinct: 12, Speed: 10 } },
    training: { from: { typeMatch: 6, otherStats: 3, maxFriendshipTypeMatch: 16 }, to: { typeMatch: 7, otherStats: 3, maxFriendshipTypeMatch: 18 } }
  },

  // UNCOMMON TIER (target: 77, tolerance 10% = 69-85)
  Koga: {
    // Currently 86.2 -> Target ~82 (reduce by ~4)
    // Reduce base stats by 2, training by 2
    baseStats: { from: { HP: 0, Attack: 3, Defense: 8, Instinct: 5, Speed: 18 }, to: { HP: 0, Attack: 2, Defense: 7, Instinct: 5, Speed: 16 } },
    training: { from: { typeMatch: 6, otherStats: 2, maxFriendshipTypeMatch: 19 }, to: { typeMatch: 6, otherStats: 2, maxFriendshipTypeMatch: 18 } }
  },
  Winona: {
    // Currently 68.8 -> Target ~73 (increase by ~4)
    // Increase base stats by 3, training by 1
    baseStats: { from: { HP: 5, Attack: 0, Defense: 5, Instinct: 5, Speed: 35 }, to: { HP: 6, Attack: 0, Defense: 6, Instinct: 6, Speed: 37 } },
    training: { from: { typeMatch: 4, otherStats: 2, maxFriendshipTypeMatch: 11 }, to: { typeMatch: 4, otherStats: 2, maxFriendshipTypeMatch: 12 } }
  },

  // COMMON TIER (target: 52, tolerance 10% = 46-57)
  Chuck: {
    // Currently 56.7 -> Target ~54 (reduce by ~3)
    // Reduce base stats by 2, training by 1
    baseStats: { from: { HP: 0, Attack: 26, Defense: 0, Instinct: 0, Speed: 5 }, to: { HP: 0, Attack: 24, Defense: 0, Instinct: 0, Speed: 5 } },
    training: { from: { typeMatch: 7, otherStats: 1, maxFriendshipTypeMatch: 15 }, to: { typeMatch: 7, otherStats: 1, maxFriendshipTypeMatch: 14 } }
  }
};

console.log('Applying 10% tolerance balance adjustments...\n');

let changesApplied = 0;

Object.entries(rebalanceChanges).forEach(([cardName, changes]) => {
  // Update base stats
  if (changes.baseStats) {
    const { from, to } = changes.baseStats;
    const fromStr = `baseStats: { HP: ${from.HP}, Attack: ${from.Attack}, Defense: ${from.Defense}, Instinct: ${from.Instinct}, Speed: ${from.Speed} }`;
    const toStr = `baseStats: { HP: ${to.HP}, Attack: ${to.Attack}, Defense: ${to.Defense}, Instinct: ${to.Instinct}, Speed: ${to.Speed} }`;

    if (gameDataContent.includes(fromStr)) {
      gameDataContent = gameDataContent.replace(fromStr, toStr);
      console.log(`âœ“ Updated ${cardName} base stats`);
      changesApplied++;
    } else {
      console.log(`âœ— Could not find ${cardName} base stats pattern`);
    }
  }

  // Update training bonuses
  if (changes.training) {
    const { from, to } = changes.training;
    const fromStr = `trainingBonus: { typeMatch: ${from.typeMatch}, otherStats: ${from.otherStats}, maxFriendshipTypeMatch: ${from.maxFriendshipTypeMatch} }`;
    const toStr = `trainingBonus: { typeMatch: ${to.typeMatch}, otherStats: ${to.otherStats}, maxFriendshipTypeMatch: ${to.maxFriendshipTypeMatch} }`;

    if (gameDataContent.includes(fromStr)) {
      gameDataContent = gameDataContent.replace(fromStr, toStr);
      console.log(`âœ“ Updated ${cardName} training bonuses`);
      changesApplied++;
    } else {
      console.log(`âœ— Could not find ${cardName} training pattern`);
    }
  }
});

// Write updated content
fs.writeFileSync(gameDataPath, gameDataContent, 'utf8');

console.log(`\nâœ“ Applied ${changesApplied} changes to gameData.js`);
console.log('\nRun analyze-support-comprehensive.js again to verify the new balance.');
