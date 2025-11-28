/**
 * ProfileScreen Component
 *
 * Displays user profile with badges, stats, and top Pokemon.
 * Features an elegant badge book for viewing all gym badges.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Trophy,
  Medal,
  Star,
  Sparkles,
  Calendar,
  Swords,
  BookOpen,
  Crown,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { apiGetProfile, apiGetUserBadges } from '../services/apiService';
import { PokemonSprite, getPokemonGrade, getGradeColor } from '../utils/gameUtils';
import { TYPE_COLORS } from '../components/TypeIcon';
import BadgeBook from '../components/BadgeBook';

// Badge image paths - maps badge key to image filename
const BADGE_IMAGES = {
  boulder: null,
  cascade: '/images/badges/cascade-badge.png',
  thunder: '/images/badges/thunder-badge.png',
  rainbow: '/images/badges/rainbow-badge.png',
  soul: null,
  marsh: '/images/badges/marsh-badge.png',
  volcano: '/images/badges/volcano-badge.png',
  earth: '/images/badges/earth-badge.png',
  zephyr: null,
  hive: null,
  plain: null,
  fog: null,
  storm: '/images/badges/storm-badge.png',
  mineral: null,
  glacier: '/images/badges/glacier-badge.png',
  rising: null
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// Badge display component
const BadgeDisplay = ({ badge, badgeData, onClick }) => {
  const owned = !!badgeData;
  const level = badgeData?.level || 0;
  const typeColor = TYPE_COLORS[badge.type] || '#6b7280';
  const badgeImage = BADGE_IMAGES[badge.key];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative p-2 rounded-xl transition-all ${
        owned
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-md'
          : 'bg-gray-100 border-2 border-gray-200'
      }`}
    >
      {/* Badge icon */}
      <div className="w-10 h-10 mx-auto flex items-center justify-center">
        {badgeImage ? (
          <img
            src={badgeImage}
            alt={badge.name}
            className="w-9 h-9 object-contain"
            style={{
              filter: owned
                ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                : 'brightness(0) drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              opacity: owned ? 1 : 0.6
            }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: owned
                ? `linear-gradient(135deg, ${typeColor}40, ${typeColor}80)`
                : 'linear-gradient(135deg, #1f2937, #111827)',
              border: owned ? `2px solid ${typeColor}` : '2px solid #374151'
            }}
          >
            <Shield
              size={18}
              className={owned ? 'text-white' : 'text-gray-500'}
              style={{ filter: owned ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none' }}
            />
          </div>
        )}
      </div>

      {/* Level indicator */}
      {owned && level > 1 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{level}</span>
        </div>
      )}

      {/* Badge name */}
      <p className={`text-[9px] font-semibold mt-1 truncate ${owned ? 'text-pocket-text' : 'text-gray-400'}`}>
        {badge.key.charAt(0).toUpperCase() + badge.key.slice(1)}
      </p>
    </motion.button>
  );
};

// Top Pokemon card component
const TopPokemonCard = ({ pokemon, rank }) => {
  if (!pokemon) return null;

  const stats = {
    HP: pokemon.HP,
    Attack: pokemon.Attack,
    Defense: pokemon.Defense,
    Instinct: pokemon.Instinct,
    Speed: pokemon.Speed
  };
  const grade = getPokemonGrade(stats);
  const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0);

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-xl p-3 shadow-card flex items-center gap-3"
    >
      {/* Rank */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
          rank === 1 ? 'bg-amber-400' : rank === 2 ? 'bg-gray-400' : 'bg-amber-700'
        }`}
      >
        {rank}
      </div>

      {/* Pokemon sprite */}
      <div className="w-12 h-12 flex-shrink-0">
        <PokemonSprite pokemonName={pokemon.name} size={48} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-pocket-text text-sm truncate">{pokemon.name}</p>
        <p className="text-pocket-text-light text-xs">{totalStats} Total Stats</p>
      </div>

      {/* Grade */}
      <div
        className="px-2 py-1 rounded-lg font-bold text-white text-sm"
        style={{ backgroundColor: getGradeColor(grade) }}
      >
        {grade}
      </div>
    </motion.div>
  );
};

const ProfileScreen = () => {
  const { token } = useAuth();
  const { setGameState } = useGame();
  const [profile, setProfile] = useState(null);
  const [badgeData, setBadgeData] = useState({ badges: [], allBadges: [] });
  const [loading, setLoading] = useState(true);
  const [showBadgeBook, setShowBadgeBook] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileData, badgesData] = await Promise.all([
          apiGetProfile(token),
          apiGetUserBadges(token)
        ]);

        if (profileData) setProfile(profileData);
        if (badgesData) setBadgeData(badgesData);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
      setLoading(false);
    };

    loadProfile();
  }, [token]);

  // Create badge lookup map
  const ownedBadges = {};
  badgeData.badges.forEach(b => {
    ownedBadges[b.badge_key] = b;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-pocket-bg flex items-center justify-center">
        <div className="text-pocket-text-light">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pocket-bg">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setGameState('menu')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <User size={20} className="text-pocket-blue" />
            <span className="font-bold text-pocket-text">Profile</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </motion.header>

      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="p-4 pb-8 max-w-lg mx-auto"
      >
        {/* User Info Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-5 mb-4 shadow-card"
        >
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pocket-blue to-pocket-red flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>

            {/* User details */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-pocket-text">{profile?.user?.username}</h2>
              <div className="flex items-center gap-2 text-pocket-text-light text-sm">
                <Trophy size={14} className="text-amber-500" />
                <span>Rating: {profile?.user?.rating || 1000}</span>
              </div>
            </div>

            {/* Primos */}
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-pocket-text font-bold text-sm">
                {(profile?.user?.primos || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-pocket-bg rounded-xl p-3 text-center">
              <Medal size={20} className="text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-pocket-text">{profile?.stats?.badgesCollected || 0}</p>
              <p className="text-[10px] text-pocket-text-light">Badges</p>
            </div>
            <div className="bg-pocket-bg rounded-xl p-3 text-center">
              <Trophy size={20} className="text-pocket-green mx-auto mb-1" />
              <p className="text-lg font-bold text-pocket-text">{profile?.stats?.tournamentsEntered || 0}</p>
              <p className="text-[10px] text-pocket-text-light">Tournaments</p>
            </div>
            <div className="bg-pocket-bg rounded-xl p-3 text-center">
              <Swords size={20} className="text-pocket-red mx-auto mb-1" />
              <p className="text-lg font-bold text-pocket-text">{profile?.stats?.matchesWon || 0}</p>
              <p className="text-[10px] text-pocket-text-light">Wins</p>
            </div>
          </div>

          {/* Member since */}
          <div className="flex items-center justify-center gap-2 mt-4 text-pocket-text-light text-xs">
            <Calendar size={12} />
            <span>Member since {new Date(profile?.user?.memberSince).toLocaleDateString()}</span>
          </div>
        </motion.div>

        {/* Badges Preview */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-4 mb-4 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-amber-500" />
              <h3 className="font-bold text-pocket-text">Gym Badges</h3>
            </div>
            <button
              onClick={() => setShowBadgeBook(true)}
              className="flex items-center gap-1 text-pocket-blue text-sm font-semibold hover:underline"
            >
              <BookOpen size={14} />
              <span>Badge Book</span>
            </button>
          </div>

          {/* Badge grid preview (first 8) */}
          <div className="grid grid-cols-4 gap-2">
            {(badgeData.allBadges || []).slice(0, 8).map((badge) => (
              <BadgeDisplay
                key={badge.key}
                badge={badge}
                badgeData={ownedBadges[badge.key]}
                onClick={() => setShowBadgeBook(true)}
              />
            ))}
          </div>

          {badgeData.allBadges.length > 8 && (
            <button
              onClick={() => setShowBadgeBook(true)}
              className="w-full mt-3 py-2 text-sm text-pocket-blue font-semibold hover:bg-pocket-bg rounded-lg transition-colors"
            >
              View all {badgeData.allBadges.length} badges
            </button>
          )}
        </motion.div>

        {/* Top Pokemon */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown size={18} className="text-amber-500" />
            <h3 className="font-bold text-pocket-text">Top Pokemon</h3>
          </div>

          {profile?.topPokemon && profile.topPokemon.length > 0 ? (
            <div className="space-y-2">
              {profile.topPokemon.map((pokemon, idx) => (
                <TopPokemonCard key={idx} pokemon={pokemon} rank={idx + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-pocket-text-light">
              <Star size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No Pokemon in roster yet</p>
              <p className="text-xs">Complete careers to build your collection!</p>
            </div>
          )}
        </motion.div>
      </motion.main>

      {/* Badge Book Modal */}
      <AnimatePresence>
        {showBadgeBook && (
          <BadgeBook
            allBadges={badgeData.allBadges}
            ownedBadges={ownedBadges}
            onClose={() => setShowBadgeBook(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileScreen;
