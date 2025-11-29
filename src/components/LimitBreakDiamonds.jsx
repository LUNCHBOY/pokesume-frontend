/**
 * LimitBreakDiamonds Component
 *
 * Displays limit break level as a row of diamonds.
 * - Grey diamonds = not achieved
 * - Rainbow gradient diamonds = achieved limit breaks
 * - Max level = 4 (all diamonds rainbow)
 */

import React from 'react';

const MAX_LIMIT_BREAK = 4;

// Diamond SVG component
const Diamond = ({ filled, size = 12 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      {filled ? (
        // Rainbow gradient diamond
        <>
          <defs>
            <linearGradient id={`rainbow-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="25%" stopColor="#ffd93d" />
              <stop offset="50%" stopColor="#6bcb77" />
              <stop offset="75%" stopColor="#4d96ff" />
              <stop offset="100%" stopColor="#9b59b6" />
            </linearGradient>
          </defs>
          <path
            d="M12 2L22 12L12 22L2 12L12 2Z"
            fill={`url(#rainbow-${size})`}
            stroke="#fff"
            strokeWidth="1"
          />
        </>
      ) : (
        // Grey diamond (unfilled)
        <path
          d="M12 2L22 12L12 22L2 12L12 2Z"
          fill="#d1d5db"
          stroke="#9ca3af"
          strokeWidth="1"
        />
      )}
    </svg>
  );
};

const LimitBreakDiamonds = ({ level = 0, size = 12, className = '' }) => {
  // Ensure level is within bounds
  const safeLevel = Math.max(0, Math.min(level, MAX_LIMIT_BREAK));

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: MAX_LIMIT_BREAK }).map((_, index) => (
        <Diamond key={index} filled={index < safeLevel} size={size} />
      ))}
    </div>
  );
};

export default LimitBreakDiamonds;
