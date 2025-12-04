/**
 * Sync gameData from backend to frontend
 *
 * Copies the split gamedata files from backend to frontend, converting
 * CommonJS to ES modules.
 *
 * Run this before building the frontend to ensure game data is in sync.
 * Usage: node scripts/sync-gamedata.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKEND_DIR = path.resolve(__dirname, '../../../pokesume backend/pokesume-backend/shared/gamedata');
const FRONTEND_DIR = path.resolve(__dirname, '../src/shared/gamedata');

// Check if backend is accessible (won't exist during Vercel builds)
const backendExists = fs.existsSync(BACKEND_DIR);
if (!backendExists) {
  console.log('Backend gamedata not found (expected during Vercel builds).');
  console.log('Using existing frontend gamedata files.');
  // Ensure gameData.js re-export file exists
  const mainFilePath = path.resolve(__dirname, '../src/shared/gameData.js');
  if (!fs.existsSync(mainFilePath)) {
    const mainFileContent = `/**
 * GAME DATA
 *
 * This file re-exports all game data from the split modules in ./gamedata/
 * Synced from backend by scripts/sync-gamedata.js
 */

export * from './gamedata/index';
`;
    fs.writeFileSync(mainFilePath, mainFileContent, 'utf8');
    console.log('Created: src/shared/gameData.js');
  }
  console.log('Done!');
  process.exit(0);
}

// Files to sync and their exports
const FILES = {
  'config.js': ['ICONS', 'EVOLUTION_CONFIG', 'EVOLUTION_CHAINS', 'GAME_CONFIG', 'calculateBaseStats'],
  'moves.js': ['MOVES'],
  'pokemon.js': ['POKEMON', 'LEGENDARY_POKEMON'],
  'gym.js': ['GYM_LEADER_POKEMON', 'ELITE_FOUR'],
  'supports.js': ['SUPPORT_CARDS', 'LEGACY_SUPPORT_NAME_MAP', 'SUPPORT_LIMIT_BREAK_PROGRESSIONS', 'normalizeSupportName', 'getSupportAtLimitBreak', 'SUPPORT_GACHA_RARITY'],
  'events.js': ['RANDOM_EVENTS', 'HANGOUT_EVENTS'],
  'gacha.js': ['GACHA_RARITY'],
  'index.js': null // Special handling - this becomes the main re-export file
};

// Create frontend directory if it doesn't exist
if (!fs.existsSync(FRONTEND_DIR)) {
  fs.mkdirSync(FRONTEND_DIR, { recursive: true });
}

console.log('Syncing gamedata from backend to frontend...');
console.log(`Source: ${BACKEND_DIR}`);
console.log(`Dest:   ${FRONTEND_DIR}`);

function convertToESModule(content, fileName, exports) {
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Convert require() statements to import
  // const { X, Y } = require('./file'); => import { X, Y } from './file';
  content = content.replace(
    /const\s*\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    'import { $1 } from \'$2\';'
  );

  // Convert single require to import
  // const X = require('./file'); => import X from './file';
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    'import $1 from \'$2\';'
  );

  // Convert const declarations to export const (for data files)
  if (exports) {
    for (const name of exports) {
      const regex = new RegExp(`^const ${name}(\\s*=)`, 'gm');
      content = content.replace(regex, `export const ${name}$1`);
    }
  }

  // Remove module.exports block
  content = content.replace(/\n?module\.exports\s*=\s*\{[\s\S]*?\};?\s*$/, '\n');
  content = content.replace(/\n?module\.exports\s*=\s*require\([^)]+\);?\s*$/, '\n');

  return content;
}

function createFrontendIndex() {
  return `/**
 * GAME DATA INDEX
 * Re-exports all game data from split modules
 */

export { ICONS, EVOLUTION_CONFIG, EVOLUTION_CHAINS, GAME_CONFIG, calculateBaseStats } from './config';
export { MOVES } from './moves';
export { POKEMON, LEGENDARY_POKEMON } from './pokemon';
export { GYM_LEADER_POKEMON, ELITE_FOUR } from './gym';
export { SUPPORT_CARDS, LEGACY_SUPPORT_NAME_MAP, SUPPORT_LIMIT_BREAK_PROGRESSIONS, normalizeSupportName, getSupportAtLimitBreak, SUPPORT_GACHA_RARITY } from './supports';
export { RANDOM_EVENTS, HANGOUT_EVENTS } from './events';
export { GACHA_RARITY } from './gacha';
`;
}

// Sync each file
for (const [fileName, exports] of Object.entries(FILES)) {
  const sourcePath = path.join(BACKEND_DIR, fileName);
  const destPath = path.join(FRONTEND_DIR, fileName);

  if (fileName === 'index.js') {
    // Create the frontend-specific index that uses ES module exports
    fs.writeFileSync(destPath, createFrontendIndex(), 'utf8');
    console.log(`Created: ${fileName} (ES module re-exports)`);
  } else if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    content = convertToESModule(content, fileName, exports);
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`Synced: ${fileName}`);
  } else {
    console.warn(`Warning: ${fileName} not found in backend`);
  }
}

// Also create/update the main gameData.js in src/shared that re-exports from gamedata/
const mainFilePath = path.resolve(__dirname, '../src/shared/gameData.js');
const mainFileContent = `/**
 * GAME DATA
 *
 * This file re-exports all game data from the split modules in ./gamedata/
 * Synced from backend by scripts/sync-gamedata.js
 */

export * from './gamedata/index';
`;

fs.writeFileSync(mainFilePath, mainFileContent, 'utf8');
console.log('Updated: src/shared/gameData.js');

console.log('Done! Game data synced successfully.');
