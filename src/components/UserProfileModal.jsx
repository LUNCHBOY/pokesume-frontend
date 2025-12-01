/**
 * UserProfileModal Component
 *
 * Read-only modal displaying a user's public profile.
 * Shows profile icon, username, rating, badges, stats, and top Pokemon.
 * Used for viewing other players' profiles (e.g., tournament winners).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Medal, Calendar, Swords, Shield } from 'lucide-react';
import { apiGetPublicProfile } from '../services/apiService';
import { PokemonSprite, getPokemonGrade, getGradeColor } from '../utils/gameUtils';
import ProfileIcon from './ProfileIcon';

// Badge image paths
const BADGE_IMAGES = {
  boulder: '/images/badges/boulder-badge.png',
  cascade: '/images/badges/cascade-badge.png',
  thunder: '/images/badges/thunder-badge.png',
  rainbow: '/images/badges/rainbow-badge.png',
  soul: '/images/badges/soul-badge.png',
  marsh: '/images/badges/marsh-badge.png',
  volcano: '/images/badges/volcano-badge.png',
  earth: '/images/badges/earth-badge.png',
  zephyr: '/images/badges/zephyr-badge.png',
  hive: '/images/badges/hive-badge.png',
  plain: '/images/badges/plain-badge.png',
  fog: '/images/badges/fog-badge.png',
  storm: '/images/badges/storm-badge.png',
  mineral: '/images/badges/mineral-badge.png',
  glacier: '/images/badges/glacier-badge.png',
  rising: '/images/badges/rising-badge.png'
};

// Badge metadata
const BADGE_META = {
  boulder: { name: 'Boulder Badge', type: 'Rock' },
  cascade: { name: 'Cascade Badge', type: 'Water' },
  thunder: { name: 'Thunder Badge', type: 'Electric' },
  rainbow: { name: 'Rainbow Badge', type: 'Grass' },
  soul: { name: 'Soul Badge', type: 'Poison' },
  marsh: { name: 'Marsh Badge', type: 'Psychic' },
  volcano: { name: 'Volcano Badge', type: 'Fire' },
  earth: { name: 'Earth Badge', type: 'Ground' },
  zephyr: { name: 'Zephyr Badge', type: 'Flying' },
  hive: { name: 'Hive Badge', type: 'Bug' },
  plain: { name: 'Plain Badge', type: 'Normal' },
  fog: { name: 'Fog Badge', type: 'Ghost' },
  storm: { name: 'Storm Badge', type: 'Fighting' },
  mineral: { name: 'Mineral Badge', type: 'Steel' },
  glacier: { name: 'Glacier Badge', type: 'Ice' },
  rising: { name: 'Rising Badge', type: 'Dragon' }
};

// Rating tier helper
const getRatingTier = (rating) => {
  if (rating >= 1800) return { name: 'Master', color: '#9333ea' };
  if (rating >= 1600) return { name: 'Diamond', color: '#06b6d4' };
  if (rating >= 1400) return { name: 'Platinum', color: '#6b7280' };
  if (rating >= 1200) return { name: 'Gold', color: '#eab308' };
  if (rating >= 1000) return { name: 'Silver', color: '#94a3b8' };
  return { name: 'Bronze', color: '#b45309' };
};

// Top Pokemon mini card
const TopPokemonMini = ({ pokemon }) => {
  if (!pokemon) return null;
  const pokemonData = typeof pokemon === 'string' ? JSON.parse(pokemon) : pokemon;
  const rawStats = pokemonData.stats || pokemonData;
  const stats = {
    HP: parseInt(rawStats.HP) || 0,
    Attack: parseInt(rawStats.Attack) || 0,
    Defense: parseInt(rawStats.Defense) || 0,
    Instinct: parseInt(rawStats.Instinct) || 0,
    Speed: parseInt(rawStats.Speed) || 0
  };
  const grade = getPokemonGrade(stats);

  return (
    <div className="bg-pocket-bg rounded-xl p-2 flex flex-col items-center">
      <div className="w-10 h-10">
        <PokemonSprite pokemonName={pokemonData.name} size={40} />
      </div>
      <p className="text-[10px] font-bold text-pocket-text truncate max-w-[60px]">{pokemonData.name}</p>
      <span
        className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white mt-0.5"
        style={{ backgroundColor: getGradeColor(grade) }}
      >
        {grade}
      </span>
    </div>
  );
};

const UserProfileModal = ({ userId, username, profileIcon, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadProfile = async () => {
      setLoading(true);
      const data = await apiGetPublicProfile(userId);
      setProfile(data);
      setLoading(false);
    };

    loadProfile();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const tier = profile?.user?.rating ? getRatingTier(profile.user.rating) : null;

  // Create owned badges lookup
  const ownedBadges = {};
  if (profile?.badges) {
    profile.badges.forEach(b => {
      ownedBadges[b.badge_key] = b;
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-card-lg w-full max-w-sm max-h-[85vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-type-psychic to-purple-600 p-6 pb-12">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <ProfileIcon
                icon={profile?.user?.profileIcon || profileIcon || 'pikachu'}
                size={64}
                showBorder={true}
                className="ring-4 ring-white/30"
              />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile?.user?.username || username || 'Loading...'}
                </h2>
                {tier && (
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.name}
                    </span>
                    <span className="text-white/80 text-sm">{profile.user.rating} Rating</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 -mt-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-card p-8 text-center">
                <div className="animate-pulse text-pocket-text-light">Loading profile...</div>
              </div>
            ) : profile ? (
              <div className="space-y-4">
                {/* Stats Card */}
                <div className="bg-white rounded-2xl shadow-card p-4">
                  <h3 className="font-bold text-pocket-text text-sm mb-3 flex items-center gap-2">
                    <Medal size={16} className="text-amber-500" />
                    Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-pocket-bg rounded-xl p-3 text-center">
                      <Trophy size={20} className="mx-auto text-amber-500 mb-1" />
                      <p className="text-lg font-bold text-pocket-text">{profile.stats?.tournamentWins || 0}</p>
                      <p className="text-[10px] text-pocket-text-light">Tournament Wins</p>
                    </div>
                    <div className="bg-pocket-bg rounded-xl p-3 text-center">
                      <Swords size={20} className="mx-auto text-type-fighting mb-1" />
                      <p className="text-lg font-bold text-pocket-text">{profile.stats?.matchesWon || 0}</p>
                      <p className="text-[10px] text-pocket-text-light">Matches Won</p>
                    </div>
                    <div className="bg-pocket-bg rounded-xl p-3 text-center">
                      <Shield size={20} className="mx-auto text-type-psychic mb-1" />
                      <p className="text-lg font-bold text-pocket-text">{profile.stats?.badgesCollected || 0}</p>
                      <p className="text-[10px] text-pocket-text-light">Badges</p>
                    </div>
                    <div className="bg-pocket-bg rounded-xl p-3 text-center">
                      <Calendar size={20} className="mx-auto text-pocket-blue mb-1" />
                      <p className="text-lg font-bold text-pocket-text">{profile.stats?.tournamentsEntered || 0}</p>
                      <p className="text-[10px] text-pocket-text-light">Tournaments</p>
                    </div>
                  </div>
                </div>

                {/* Badges Section */}
                {profile.badges && profile.badges.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-card p-4">
                    <h3 className="font-bold text-pocket-text text-sm mb-3 flex items-center gap-2">
                      <Shield size={16} className="text-type-psychic" />
                      Gym Badges ({profile.badges.length})
                    </h3>
                    <div className="grid grid-cols-8 gap-1">
                      {Object.keys(BADGE_META).map(badgeKey => {
                        const owned = ownedBadges[badgeKey];
                        const meta = BADGE_META[badgeKey];

                        return (
                          <div
                            key={badgeKey}
                            className={`relative p-1 rounded-lg ${
                              owned ? 'bg-amber-50' : 'bg-gray-100'
                            }`}
                            title={meta.name + (owned?.level > 1 ? ` (Level ${owned.level})` : '')}
                          >
                            <img
                              src={BADGE_IMAGES[badgeKey]}
                              alt={meta.name}
                              className="w-6 h-6 mx-auto object-contain"
                              style={{
                                filter: owned
                                  ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                                  : 'brightness(0) opacity(0.2)'
                              }}
                            />
                            {owned?.level > 1 && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                                <span className="text-[6px] font-bold text-white">{owned.level}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Top Pokemon Section */}
                {profile.topPokemon && profile.topPokemon.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-card p-4">
                    <h3 className="font-bold text-pocket-text text-sm mb-3 flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" />
                      Top Pokemon
                    </h3>
                    <div className="flex justify-center gap-2">
                      {profile.topPokemon.slice(0, 3).map((pokemon, idx) => (
                        <TopPokemonMini key={idx} pokemon={pokemon} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Member Since */}
                {profile.user?.memberSince && (
                  <div className="text-center text-xs text-pocket-text-light">
                    Member since {new Date(profile.user.memberSince).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-8 text-center">
                <p className="text-pocket-text-light">Failed to load profile</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
