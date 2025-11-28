/**
 * MenuScreen Component
 *
 * Main menu with clean Pokedex-style UI.
 * Features polished cards, smooth animations, and clean iconography.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  LogOut,
  AlertTriangle,
  Swords,
  Box,
  Users,
  Trophy,
  Medal,
  CircleDot,
  Gift,
  Star,
  HelpCircle,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useInventory } from '../contexts/InventoryContext';
import { generatePokemonSprite } from '../utils/gameUtils';
import { TypeBadge, TYPE_COLORS } from '../components/TypeIcon';
import { POKEMON } from '../shared/gameData';
import { MenuTile } from '../components/ui/menu-tile';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

// Menu configuration
const MENU_ITEMS = [
  {
    key: 'career',
    label: 'New Career',
    icon: Swords,
    color: '#E3350D',
    screen: 'pokemonSelect'
  },
  {
    key: 'pokemon',
    label: 'My Pokemon',
    icon: Box,
    color: '#78C850',
    screen: 'pokemonInventory',
    badgeKey: 'pokemonInventory'
  },
  {
    key: 'supports',
    label: 'Supports',
    icon: Users,
    color: '#6890F0',
    screen: 'supportInventory',
    badgeKey: 'supportInventory'
  },
  {
    key: 'hallOfFame',
    label: 'Hall of Fame',
    icon: Trophy,
    color: '#F8D030',
    screen: 'trainedPokemon',
    badgeKey: 'trainedPokemon'
  },
  {
    key: 'pokemonGacha',
    label: 'Pokemon Gacha',
    icon: CircleDot,
    color: '#A040A0',
    screen: 'gacha'
  },
  {
    key: 'supportGacha',
    label: 'Support Gacha',
    icon: Gift,
    color: '#F85888',
    screen: 'supportGacha'
  },
  {
    key: 'tournaments',
    label: 'Tournaments',
    icon: Medal,
    color: '#7038F8',
    screen: 'tournaments'
  },
  {
    key: 'pvp',
    label: 'PvP Battle',
    icon: Swords,
    color: '#C03028',
    screen: 'pvp'
  },
  {
    key: 'guide',
    label: 'Game Guide',
    icon: HelpCircle,
    color: '#3B82F6',
    screen: 'guide'
  }
];

// Starter selection card component
const StarterCard = ({ pokemon, name, onSelect }) => {
  const typeColor = TYPE_COLORS[pokemon.primaryType] || '#A8A878';

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="pokemon-card"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-3"
      >
        {generatePokemonSprite(pokemon.primaryType, name)}
      </motion.div>
      <h3 className="text-pocket-text font-bold text-base mb-2">{name}</h3>
      <span
        className="type-pill"
        style={{ backgroundColor: typeColor }}
      >
        {pokemon.primaryType}
      </span>
    </motion.button>
  );
};

const MenuScreen = () => {
  const { user, logout } = useAuth();
  const { setGameState, setShowResetConfirm } = useGame();
  const {
    pokemonInventory,
    supportInventory,
    trainedPokemon,
    primos,
    loadPokemonInventory,
    addPokemon
  } = useInventory();

  // Badge counts for menu items
  const badgeCounts = {
    pokemonInventory: pokemonInventory.length,
    supportInventory: supportInventory.length,
    trainedPokemon: trainedPokemon.length
  };

  // Starter selection (if user has no pokemon)
  if (pokemonInventory.length === 0) {
    return (
      <div className="min-h-screen bg-pocket-bg p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-md mx-auto pt-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pocket-red/10 mb-4">
              <Star size={32} className="text-pocket-red" />
            </div>
            <h1 className="text-2xl font-bold text-pocket-text mb-2">
              Choose Your Starter!
            </h1>
            <p className="text-pocket-text-light">
              Select your first Pokemon partner to begin your journey
            </p>
          </motion.div>

          {/* Starter Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-3 gap-3"
          >
            {['Charmander', 'Squirtle', 'Bulbasaur'].map((starter) => {
              const pokemon = POKEMON[starter];
              return (
                <motion.div key={starter} variants={itemVariants}>
                  <StarterCard
                    pokemon={pokemon}
                    name={starter}
                    onSelect={async () => {
                      const result = await addPokemon(starter, pokemon);
                      if (result) {
                        await loadPokemonInventory();
                      } else {
                        alert('Failed to add starter Pokemon. Please try again.');
                      }
                    }}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Version */}
          <motion.p
            variants={itemVariants}
            className="text-center text-pocket-text-light text-xs mt-8"
          >
            v4.0.0
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="min-h-screen bg-pocket-bg">
      {/* Header Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          {/* Profile Button (upper left) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGameState('profile')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200 hover:border-amber-300 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-pocket-text font-semibold text-sm">Profile</span>
          </motion.button>

          {/* Currency */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="text-pocket-text font-bold text-sm">
              {primos.toLocaleString()}
            </span>
          </motion.div>

          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-pocket-text font-semibold text-sm">{user.username}</p>
              <p className="text-pocket-text-light text-xs">
                {user.rating || 1000}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-pocket-red hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-4 pb-8 max-w-lg mx-auto"
      >
        {/* Welcome Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-5 mb-5 shadow-card"
        >
          <h1 className="text-lg font-bold text-pocket-text mb-1">
            Welcome back, {user.username}!
          </h1>
          <p className="text-pocket-text-light text-sm">
            Pick a buddy and prove you're the very best!
          </p>
        </motion.div>

        {/* Main Menu Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-3 gap-3 mb-5"
        >
          {MENU_ITEMS.map((item) => (
            <motion.div key={item.key} variants={itemVariants}>
              <MenuTile
                icon={item.icon}
                iconColor={item.color}
                label={item.label}
                badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
                onClick={() => setGameState(item.screen)}
                disabled={item.key === 'career' && pokemonInventory.length === 0}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowResetConfirm(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-3 text-gray-400 hover:text-pocket-red text-xs transition-colors"
          >
            <AlertTriangle size={12} />
            <span>Reset All Data</span>
          </button>
        </motion.div>

        {/* Version */}
        <motion.p
          variants={itemVariants}
          className="text-center text-pocket-text-light text-[10px] mt-2"
        >
          v4.0.0
        </motion.p>
      </motion.main>
    </div>
  );
};

export default MenuScreen;
