/**
 * BadgeBook Component
 *
 * Full-screen modal showing all gym badges in an elegant book format.
 * Collected badges are colorful, uncollected are shown as black outlines.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Star, MapPin } from 'lucide-react';
import { TYPE_COLORS } from './TypeIcon';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 }
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

// Individual badge card with full details
const BadgeCard = ({ badge, owned, level, delay }) => {
  const typeColor = TYPE_COLORS[badge.type] || '#6b7280';

  return (
    <motion.div
      variants={badgeVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: delay * 0.05 }}
      className={`relative rounded-2xl p-4 transition-all ${
        owned
          ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50 border-2 border-amber-300 shadow-lg'
          : 'bg-gray-50 border-2 border-gray-200'
      }`}
    >
      {/* Badge visual */}
      <div className="flex justify-center mb-3">
        <div
          className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
            owned ? '' : 'opacity-25'
          }`}
          style={{
            background: owned
              ? `linear-gradient(135deg, ${typeColor}60, ${typeColor})`
              : 'linear-gradient(135deg, #374151, #1f2937)',
            boxShadow: owned
              ? `0 4px 12px ${typeColor}40, inset 0 2px 4px rgba(255,255,255,0.3)`
              : '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Shield
            size={28}
            className="text-white"
            style={{
              filter: owned ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
            }}
          />

          {/* Level indicator */}
          {owned && level > 1 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-white">{level}</span>
            </div>
          )}

          {/* Stars for collected badge */}
          {owned && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex">
              {[...Array(Math.min(level, 3))].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className="text-amber-400 fill-amber-400"
                  style={{ marginLeft: i > 0 ? -2 : 0 }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badge name */}
      <h4 className={`text-sm font-bold text-center mb-1 ${owned ? 'text-pocket-text' : 'text-gray-400'}`}>
        {badge.name}
      </h4>

      {/* Gym info */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <MapPin size={10} className={owned ? 'text-pocket-text-light' : 'text-gray-300'} />
        <span className={`text-[10px] ${owned ? 'text-pocket-text-light' : 'text-gray-400'}`}>
          {badge.gym}
        </span>
      </div>

      {/* Leader and type */}
      <div className="flex justify-between items-center">
        <span className={`text-[10px] ${owned ? 'text-pocket-text-light' : 'text-gray-400'}`}>
          {badge.leader}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{
            backgroundColor: owned ? `${typeColor}20` : '#e5e7eb',
            color: owned ? typeColor : '#9ca3af'
          }}
        >
          {badge.type}
        </span>
      </div>

      {/* Collection status */}
      {!owned && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-gray-900/5">
          <span className="text-xs text-gray-400 font-semibold bg-white/80 px-2 py-1 rounded-lg">
            Not Collected
          </span>
        </div>
      )}
    </motion.div>
  );
};

const BadgeBook = ({ allBadges = [], ownedBadges = {}, onClose }) => {
  const totalBadges = allBadges.length;
  const collectedCount = Object.keys(ownedBadges).length;

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Badge Book</h2>
                <p className="text-amber-100 text-sm">
                  {collectedCount} / {totalBadges} Collected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(collectedCount / totalBadges) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Badge grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Kanto badges */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Kanto Region
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allBadges.slice(0, 8).map((badge, idx) => (
                <BadgeCard
                  key={badge.key}
                  badge={badge}
                  owned={!!ownedBadges[badge.key]}
                  level={ownedBadges[badge.key]?.level || 0}
                  delay={idx}
                />
              ))}
            </div>
          </div>

          {/* Johto badges */}
          {allBadges.length > 8 && (
            <div>
              <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Johto Region
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allBadges.slice(8).map((badge, idx) => (
                  <BadgeCard
                    key={badge.key}
                    badge={badge}
                    owned={!!ownedBadges[badge.key]}
                    level={ownedBadges[badge.key]?.level || 0}
                    delay={idx + 8}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {collectedCount === 0 && (
            <div className="text-center py-8">
              <Shield size={48} className="mx-auto mb-3 text-amber-300" />
              <p className="text-pocket-text-light text-sm">
                Win tournaments to collect gym badges!
              </p>
              <p className="text-pocket-text-light text-xs mt-1">
                Each tournament is themed after a gym leader.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-100 to-orange-100 border-t border-amber-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-amber-700">
              <Star size={14} className="fill-amber-500 text-amber-500" />
              <span>Win the same badge multiple times to level it up!</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BadgeBook;
