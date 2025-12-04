/**
 * StatRadarChart Component
 *
 * Renders a spider/radar chart for Pokemon stats.
 * Shows 5 stats (HP, Attack, Defense, Instinct, Speed) in a pentagonal layout.
 */

import React from 'react';

const StatRadarChart = ({ stats, size = 180, color = '#3B82F6' }) => {
  if (!stats) return null;

  const statOrder = ['HP', 'Attack', 'Defense', 'Speed', 'Instinct'];
  const statValues = statOrder.map(stat => stats[stat] || 0);

  // Find the max stat value for scaling (use Pokemon's own max for relative display)
  const maxStat = Math.max(...statValues, 1);

  // Chart dimensions
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size / 2) - 25; // Leave room for labels

  // Calculate points for each stat (5 stats = pentagon)
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2; // Start at top

  // Generate polygon points for the stat values
  const getPoint = (index, value, maxVal = maxStat) => {
    const angle = startAngle + index * angleStep;
    const radius = (value / maxVal) * maxRadius;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  // Generate points for background grid circles (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Generate stat polygon points
  const statPoints = statValues.map((val, i) => getPoint(i, val));
  const statPolygon = statPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Label positions (slightly outside the chart)
  const labelRadius = maxRadius + 18;
  const labelPoints = statOrder.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + labelRadius * Math.cos(angle),
      y: cy + labelRadius * Math.sin(angle)
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background grid - concentric pentagons */}
        {gridLevels.map((level, levelIdx) => {
          const gridPoints = statOrder.map((_, i) => {
            const point = getPoint(i, level * maxStat, maxStat);
            return `${point.x},${point.y}`;
          }).join(' ');
          return (
            <polygon
              key={levelIdx}
              points={gridPoints}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines from center to each vertex */}
        {statOrder.map((_, i) => {
          const endPoint = getPoint(i, maxStat, maxStat);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}

        {/* Stat polygon (filled area) */}
        <polygon
          points={statPolygon}
          fill={color}
          fillOpacity={0.3}
          stroke={color}
          strokeWidth={2}
        />

        {/* Stat points */}
        {statPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
          />
        ))}

        {/* Labels */}
        {statOrder.map((stat, i) => {
          const pos = labelPoints[i];
          // Adjust text anchor based on position
          let textAnchor = 'middle';
          if (pos.x < cx - 10) textAnchor = 'end';
          else if (pos.x > cx + 10) textAnchor = 'start';

          let dy = '0.35em';
          if (pos.y < cy - 20) dy = '0.8em';
          else if (pos.y > cy + 20) dy = '-0.2em';

          return (
            <text
              key={stat}
              x={pos.x}
              y={pos.y}
              textAnchor={textAnchor}
              dy={dy}
              className="text-[10px] fill-gray-600 font-medium"
            >
              {stat}
            </text>
          );
        })}
      </svg>

      {/* Stat values legend */}
      <div className="grid grid-cols-5 gap-1 mt-2 text-[10px] w-full max-w-[200px]">
        {statOrder.map((stat, i) => (
          <div key={stat} className="text-center">
            <span className="font-bold text-pocket-text">{statValues[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatRadarChart;
