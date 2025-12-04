/**
 * StatBarChart Component
 *
 * Renders horizontal bar charts for Pokemon stats.
 * Bar lengths are relative to the highest stat value.
 */

import React from 'react';

// Stat colors matching the game's theme
const STAT_COLORS = {
  HP: '#EF4444',      // Red
  Attack: '#F97316',  // Orange
  Defense: '#3B82F6', // Blue
  Speed: '#22C55E',   // Green
  Instinct: '#A855F7' // Purple
};

const StatRadarChart = ({ stats, size = 180, color = '#3B82F6' }) => {
  if (!stats) return null;

  const statOrder = ['HP', 'Attack', 'Defense', 'Speed', 'Instinct'];
  const statValues = statOrder.map(stat => stats[stat] || 0);

  // Find the max stat value for scaling bars relative to highest
  const maxStat = Math.max(...statValues, 1);

  return (
    <div className="w-full space-y-1.5">
      {statOrder.map((stat, i) => {
        const value = statValues[i];
        const percentage = (value / maxStat) * 100;
        const statColor = STAT_COLORS[stat] || color;

        return (
          <div key={stat} className="flex items-center gap-2">
            {/* Stat label */}
            <span className="text-[10px] font-medium text-pocket-text-light w-14 text-right">
              {stat}
            </span>

            {/* Bar container */}
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: statColor
                }}
              />
            </div>

            {/* Stat value */}
            <span className="text-[10px] font-bold text-pocket-text w-8 text-right">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StatRadarChart;
