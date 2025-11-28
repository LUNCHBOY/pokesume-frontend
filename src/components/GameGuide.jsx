/**
 * GameGuide Component
 *
 * Comprehensive game guide covering all mechanics and features.
 * Can be displayed as a modal or embedded in a page.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, X, ChevronDown, ChevronUp,
  Swords, Target, Zap, Heart, Shield, Brain, Wind,
  Users, Gift, Trophy, Medal, Sparkles, Clock,
  Flame, Droplet, Leaf, Star
} from 'lucide-react';

// Collapsible section component
const GuideSection = ({ title, icon: Icon, iconColor, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-pocket-bg rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white hover:bg-pocket-bg/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className={iconColor || 'text-pocket-red'} />}
          <span className="font-bold text-pocket-text">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-pocket-text-light" /> : <ChevronDown size={18} className="text-pocket-text-light" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3 text-sm">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-section with title
const SubSection = ({ title, children }) => (
  <div>
    <h4 className="font-bold text-pocket-text mb-1">{title}</h4>
    <div className="text-pocket-text-light ml-2 space-y-1">{children}</div>
  </div>
);

// Stat row for displaying game values
const StatRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-0.5">
    <span className={color ? '' : 'text-pocket-text-light'}>{label}</span>
    <span className={`font-bold ${color || 'text-pocket-text'}`}>{value}</span>
  </div>
);

const GameGuide = ({ isModal = false, onClose, showHeader = true }) => {
  const content = (
    <div className="space-y-3">
      {/* Game Overview */}
      <GuideSection title="Game Overview" icon={Star} iconColor="text-amber-500" defaultOpen={true}>
        <div className="bg-pocket-bg rounded-lg p-3">
          <p className="text-pocket-text mb-2">
            <strong>Pokesume</strong> is a Pokemon training simulation where you raise Pokemon through a 60-turn career,
            battling gym leaders and ultimately the Elite Four.
          </p>
          <div className="space-y-1 text-pocket-text-light">
            <p>• Collect Pokemon and Support Cards through the Gacha system</p>
            <p>• Train your Pokemon's stats over 60 turns</p>
            <p>• Battle Gym Leaders at turns 12, 24, 36, and 48</p>
            <p>• Face the Elite Four gauntlet at turns 60-63</p>
            <p>• Previously trained Pokemon provide Inspiration bonuses</p>
          </div>
        </div>
      </GuideSection>

      {/* Pokemon Stats */}
      <GuideSection title="Pokemon Stats" icon={Target} iconColor="text-pocket-red">
        <SubSection title="Core Stats">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2">
              <Heart size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div><strong className="text-pocket-text">HP:</strong> Health points. When reduced to 0, you lose the battle.</div>
            </div>
            <div className="flex items-start gap-2">
              <Swords size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div><strong className="text-pocket-text">Attack:</strong> Increases damage dealt. Compared against opponent's Defense.</div>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div><strong className="text-pocket-text">Defense:</strong> Reduces damage taken. Higher Defense = less damage received.</div>
            </div>
            <div className="flex items-start gap-2">
              <Brain size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <div><strong className="text-pocket-text">Instinct:</strong> Increases critical hit chance and dodge chance while resting.</div>
            </div>
            <div className="flex items-start gap-2">
              <Wind size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
              <div><strong className="text-pocket-text">Speed:</strong> Increases stamina regeneration rate during battle.</div>
            </div>
          </div>
        </SubSection>

        <SubSection title="Stat Formulas">
          <div className="bg-pocket-bg rounded p-2 space-y-1 text-xs">
            <p><strong>Damage:</strong> Base × (ATK/DEF) × Aptitude × Type × Crit</p>
            <p><strong>Crit Chance:</strong> 5% + (Instinct / 800)</p>
            <p><strong>Dodge Chance:</strong> 1% + (Instinct / 2400) [while resting]</p>
            <p><strong>Stamina Regen:</strong> 1 + (Speed / 15) per tick</p>
          </div>
        </SubSection>
      </GuideSection>

      {/* Type System */}
      <GuideSection title="Type System" icon={Flame} iconColor="text-orange-500">
        <SubSection title="Type Matchups">
          <p className="mb-2">Super effective attacks deal <strong className="text-pocket-green">+25% damage</strong>. Resisted attacks deal <strong className="text-pocket-red">-25% damage</strong>.</p>
          <div className="bg-pocket-bg rounded p-2 space-y-1 text-xs">
            <p><strong className="text-orange-500">Fire (Red)</strong> → strong vs Grass, weak vs Water</p>
            <p><strong className="text-blue-500">Water (Blue)</strong> → strong vs Fire, weak vs Grass</p>
            <p><strong className="text-green-500">Grass (Green)</strong> → strong vs Water, weak vs Fire</p>
            <p><strong className="text-yellow-500">Electric (Yellow)</strong> → strong vs Water, weak vs Grass</p>
            <p><strong className="text-purple-500">Psychic (Purple)</strong> → strong vs Fighting, weak vs Psychic</p>
            <p><strong className="text-orange-600">Fighting (Orange)</strong> → strong vs Electric, weak vs Psychic</p>
          </div>
        </SubSection>

        <SubSection title="Type Aptitudes">
          <p className="mb-2">Each Pokemon has aptitude grades for each type color. Aptitude affects both damage dealt AND stamina cost.</p>
          <div className="bg-pocket-bg rounded p-2">
            <p className="text-xs font-bold mb-1">Damage Multipliers:</p>
            <div className="grid grid-cols-4 gap-1 text-xs mb-2">
              <div><span className="font-bold" style={{color: '#6b7280'}}>F:</span> 60%</div>
              <div><span className="font-bold" style={{color: '#9ca3af'}}>E:</span> 70%</div>
              <div><span className="font-bold" style={{color: '#3b82f6'}}>D:</span> 80%</div>
              <div><span className="font-bold" style={{color: '#22c55e'}}>C:</span> 90%</div>
              <div><span className="font-bold" style={{color: '#ec4899'}}>B:</span> 100%</div>
              <div><span className="font-bold" style={{color: '#f97316'}}>A:</span> 110%</div>
              <div><span className="font-bold" style={{color: '#eab308'}}>S:</span> 120%</div>
              <div><span className="font-bold" style={{color: '#a855f7'}}>UU:</span> 125%</div>
            </div>
            <p className="text-xs font-bold mb-1">Stamina Cost (Strategy Grade):</p>
            <div className="text-xs text-pocket-text-light">
              Higher strategy grade = lower stamina costs (F: +30%, S: -20%, UU: -25%)
            </div>
          </div>
        </SubSection>
      </GuideSection>

      {/* Battle System */}
      <GuideSection title="Battle System" icon={Swords} iconColor="text-red-500">
        <SubSection title="Real-Time Combat">
          <p>Battles are automatic, tick-based combat. Pokemon use abilities when they have enough stamina and the ability is off cooldown.</p>
        </SubSection>

        <SubSection title="Stamina System">
          <div className="space-y-1">
            <p>• Max stamina: <strong className="text-pocket-text">100</strong></p>
            <p>• Abilities cost stamina to use</p>
            <p>• Stamina regenerates when <strong className="text-pocket-text">resting</strong> (not attacking)</p>
            <p>• Low stamina increases miss chance</p>
            <p>• Resting grants dodge chance based on Instinct</p>
          </div>
        </SubSection>

        <SubSection title="Ability Mechanics">
          <div className="space-y-1">
            <p><strong className="text-pocket-text">Warmup:</strong> Ticks before ability is first available</p>
            <p><strong className="text-pocket-text">Cooldown:</strong> Ticks between uses</p>
            <p><strong className="text-pocket-text">Stamina Cost:</strong> Reduced by better strategy grade</p>
          </div>
        </SubSection>

        <SubSection title="Strategy Types">
          <div className="bg-pocket-bg rounded p-2 space-y-1">
            <p><strong className="text-red-500">Nuker:</strong> -30% warmup, +30% cooldown (burst damage, front-loaded)</p>
            <p><strong className="text-blue-500">Balanced:</strong> -10% both warmup and cooldown (consistent)</p>
            <p><strong className="text-green-500">Scaler:</strong> +20% warmup, -20% cooldown (sustained DPS)</p>
            <p><strong className="text-purple-500">Chipper:</strong> -50% warmup, -30% cooldown (rapid attacks)</p>
            <p><strong className="text-yellow-500">Debuffer:</strong> Standard timing, prioritizes status effects</p>
            <p><strong className="text-gray-500">MadLad:</strong> Completely random move selection</p>
          </div>
          <p className="mt-1 text-xs"><strong>Strategy Grade</strong> (F-UU) affects stamina costs - better grade = lower ability costs.</p>
        </SubSection>

        <SubSection title="Status Effects">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><strong className="text-red-500">Burn:</strong> DoT damage over time</div>
            <div><strong className="text-purple-500">Poison:</strong> DoT damage over time</div>
            <div><strong className="text-yellow-500">Paralyze:</strong> Reduced accuracy</div>
            <div><strong className="text-gray-500">Stun:</strong> Cannot act for duration</div>
            <div><strong className="text-blue-500">Soak:</strong> Becomes Water type (weak to Grass)</div>
            <div><strong className="text-pink-500">Confuse:</strong> May hit self</div>
            <div><strong className="text-orange-500">Exhaust:</strong> Cannot attack, drains stamina</div>
            <div><strong className="text-green-500">Energize:</strong> Bonus stamina regen</div>
          </div>
        </SubSection>
      </GuideSection>

      {/* Career Mode */}
      <GuideSection title="Career Mode" icon={Trophy} iconColor="text-amber-500">
        <SubSection title="Overview">
          <p>Train your Pokemon over <strong className="text-pocket-text">60 turns</strong> to defeat Gym Leaders and the Elite Four.</p>
        </SubSection>

        <SubSection title="Key Milestones">
          <div className="bg-pocket-bg rounded p-2">
            <StatRow label="Gym 1" value="Turn 12" />
            <StatRow label="Gym 2" value="Turn 24" />
            <StatRow label="Gym 3" value="Turn 36" />
            <StatRow label="Gym 4" value="Turn 48" />
            <StatRow label="Elite Four" value="Turns 60-63" />
            <StatRow label="Inspiration" value="Turns 11, 23, 35, 47, 59" />
          </div>
        </SubSection>

        <SubSection title="Energy System">
          <div className="space-y-1">
            <p>• Start with <strong className="text-pocket-text">100 energy</strong></p>
            <p>• Training costs energy based on difficulty</p>
            <p>• At 0 energy: <strong className="text-red-500">99% training fail rate</strong></p>
            <p>• <strong className="text-green-500">Rest:</strong> Restores 30-70 energy, skip turn</p>
          </div>
        </SubSection>

        <SubSection title="Training">
          <div className="space-y-1">
            <p><strong className="text-green-500">Success:</strong> +Stats, +3 Skill Points, +10 Support Friendship</p>
            <p><strong className="text-red-500">Failure:</strong> -2 to trained stat</p>
          </div>
          <div className="bg-pocket-bg rounded p-2 mt-2 space-y-1">
            <p className="text-xs"><strong>Training Levels:</strong> Each stat has levels 0-7 (shown by color). Higher levels = more stats but higher fail chance. Every 4 successful trainings levels up that stat.</p>
            <p className="text-xs"><strong>Level Bonus:</strong> +10% stat gain per training level</p>
          </div>
        </SubSection>

        <SubSection title="Support Training Bonuses">
          <div className="bg-pocket-bg rounded p-2 space-y-1 text-xs">
            <p className="font-bold mb-1">When support appears on matching stat training:</p>
            <p>• <strong className="text-gray-500">Common:</strong> +5 stats (normal), +8 at max friendship</p>
            <p>• <strong className="text-green-500">Uncommon:</strong> +6 stats (normal), +10 at max friendship</p>
            <p>• <strong className="text-blue-500">Rare:</strong> +8 stats (normal), +12 at max friendship</p>
            <p>• <strong className="text-amber-500">Legendary:</strong> +10 stats (normal), +15 at max friendship</p>
            <p className="mt-1">Non-matching stats: +1-2 bonus regardless of friendship</p>
          </div>
        </SubSection>

        <SubSection title="Wild Battles">
          <div className="space-y-1">
            <p><strong className="text-green-500">Victory:</strong> +5 all stats, +10 Skill Points</p>
            <p><strong className="text-orange-500">Cost:</strong> -25 energy</p>
            <p><strong className="text-red-500">At 0 energy:</strong> 50% chance to lose 10 all stats on loss</p>
          </div>
        </SubSection>

        <SubSection title="Learning Abilities">
          <div className="space-y-1">
            <p>• Spend Skill Points to learn new moves</p>
            <p>• Base cost × 3.0 modifier</p>
            <p>• Move hints from Supports reduce cost up to 60%</p>
            <p>• Can forget abilities to make room (max 4-6)</p>
          </div>
        </SubSection>
      </GuideSection>

      {/* Support Cards */}
      <GuideSection title="Support Cards" icon={Users} iconColor="text-blue-500">
        <SubSection title="Overview">
          <p>Support cards provide trainers who help during your career run. Each support has unique bonuses and move hints.</p>
        </SubSection>

        <SubSection title="Friendship System">
          <div className="space-y-1">
            <p>• Gain <strong className="text-pocket-text">+10 friendship</strong> per training with that support</p>
            <p>• At <strong className="text-amber-500">80+ friendship:</strong> Hangout events become available</p>
            <p>• At <strong className="text-green-500">100 friendship:</strong> Major stat bonus when training their specialty stat</p>
            <p>• Max friendship training shows a <strong className="text-amber-400">rainbow sheen</strong> effect</p>
          </div>
        </SubSection>

        <SubSection title="Support Benefits">
          <div className="space-y-1">
            <p>• <strong className="text-purple-500">Move Hints:</strong> Reduce learning cost for specific moves</p>
            <p>• <strong className="text-blue-500">Stat Focus:</strong> Bonuses to specific stats</p>
            <p>• <strong className="text-amber-500">Hangout Events:</strong> Special story events with rewards</p>
          </div>
        </SubSection>

        <SubSection title="Support Specialties">
          <div className="bg-pocket-bg rounded p-2 text-xs space-y-1">
            <p>Each support specializes in one stat type (HP, Attack, Defense, Instinct, or Speed).</p>
            <p>• More likely to appear on trainings matching their specialty</p>
            <p>• Give larger bonuses when training their specialty stat</p>
            <p>• Provide move hints for abilities related to their specialty</p>
          </div>
        </SubSection>

        <SubSection title="Rarity Tiers">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div><span className="font-bold" style={{color: '#6b7280'}}>Common:</span> 50% (start 10 friendship)</div>
            <div><span className="font-bold" style={{color: '#22c55e'}}>Uncommon:</span> 35% (start 20 friendship)</div>
            <div><span className="font-bold" style={{color: '#3b82f6'}}>Rare:</span> 13% (start 30 friendship)</div>
            <div><span className="font-bold" style={{color: '#f59e0b'}}>Legendary:</span> 2% (start 40 friendship)</div>
          </div>
        </SubSection>
      </GuideSection>

      {/* Inspiration System */}
      <GuideSection title="Inspiration System" icon={Sparkles} iconColor="text-purple-500">
        <SubSection title="How It Works">
          <p>Pokemon you've previously trained in the Hall of Fame can inspire your current Pokemon at specific turns.</p>
        </SubSection>

        <SubSection title="Inspiration Turns">
          <p>Turns <strong className="text-pocket-text">11, 23, 35, 47, 59</strong> - just before each gym battle.</p>
        </SubSection>

        <SubSection title="Possible Bonuses">
          <div className="space-y-1">
            <p>• <strong className="text-green-500">Stat Boost:</strong> Bonus stats based on trained Pokemon's strength</p>
            <p>• <strong className="text-purple-500">Aptitude Upgrade:</strong> Chance to improve type aptitude grade</p>
            <p>• Stars indicate bonus strength (more stars = bigger bonus)</p>
          </div>
        </SubSection>
      </GuideSection>

      {/* Gacha System */}
      <GuideSection title="Gacha System" icon={Gift} iconColor="text-pink-500">
        <SubSection title="Pokemon Gacha">
          <div className="space-y-1">
            <p>• Cost: <strong className="text-amber-500">100 Primos</strong> per roll</p>
            <p>• Pokemon are graded by total base stats (D to S+)</p>
            <p>• Each Pokemon has unique types, aptitudes, and strategies</p>
            <p>• Duplicates are automatically refunded</p>
          </div>
        </SubSection>

        <SubSection title="Support Gacha">
          <div className="space-y-1">
            <p>• Cost: <strong className="text-amber-500">100 Primos</strong> per roll</p>
            <p>• Support cards help during career runs</p>
            <p>• Higher rarity = better bonuses and move hints</p>
            <p>• Duplicates refund your Primos</p>
          </div>
        </SubSection>

        <SubSection title="Earning Primos">
          <div className="space-y-1">
            <p>• Completing career runs</p>
            <p>• Defeating gym leaders</p>
            <p>• Tournament victories</p>
            <p>• Daily rewards</p>
          </div>
        </SubSection>
      </GuideSection>

      {/* Tournaments */}
      <GuideSection title="Tournaments" icon={Medal} iconColor="text-indigo-500">
        <SubSection title="Overview">
          <p>Compete with your trained Pokemon against other players' teams in bracket-style tournaments.</p>
        </SubSection>

        <SubSection title="Entry Requirements">
          <div className="space-y-1">
            <p>• Must have Pokemon in Hall of Fame</p>
            <p>• Select one trained Pokemon per tournament</p>
            <p>• Battles use trained stats and abilities</p>
          </div>
        </SubSection>

        <SubSection title="Gym-Themed Tournaments">
          <div className="bg-pocket-bg rounded p-2 text-xs space-y-1">
            <p>Some tournaments feature gym leader themes that provide bonuses:</p>
            <p>• Pokemon matching the gym's type get <strong className="text-green-500">stat bonuses</strong></p>
            <p>• Themed tournaments encourage type-diverse rosters</p>
            <p>• Check tournament details for active bonuses</p>
          </div>
        </SubSection>

        <SubSection title="Rewards">
          <div className="space-y-1">
            <p>• Primos based on placement</p>
            <p>• Tournament trophies</p>
            <p>• Leaderboard ranking</p>
          </div>
        </SubSection>
      </GuideSection>

      {/* Evolution */}
      <GuideSection title="Evolution" icon={Star} iconColor="text-yellow-500">
        <SubSection title="How Evolution Works">
          <div className="space-y-1">
            <p>• Some Pokemon can evolve during career runs</p>
            <p>• Evolution triggers when stat thresholds are met</p>
            <p>• <strong className="text-green-500">+10% to all stats</strong> upon evolving</p>
            <p>• May unlock new learnable abilities</p>
          </div>
        </SubSection>

        <SubSection title="Evolution Stages">
          <div className="space-y-1">
            <p>• Stage 1 → Stage 2: Early-mid career</p>
            <p>• Stage 2 → Stage 3: Mid-late career</p>
            <p>• Not all Pokemon have evolutions</p>
          </div>
        </SubSection>
      </GuideSection>

      {/* Tips & Strategies */}
      <GuideSection title="Tips & Strategies" icon={Brain} iconColor="text-teal-500">
        <SubSection title="Early Game (Turns 1-12)">
          <div className="space-y-1">
            <p>• Focus on 2-3 key stats initially (Attack + HP/Defense)</p>
            <p>• Don't let energy drop below 20 - rest proactively</p>
            <p>• Prioritize supports matching your main training stats</p>
            <p>• Win wild battles for +5 all stats and skill points</p>
          </div>
        </SubSection>

        <SubSection title="Mid Game (Turns 13-48)">
          <div className="space-y-1">
            <p>• Learn abilities that match your best type aptitudes</p>
            <p>• Use move hints to save Skill Points (up to 60% discount)</p>
            <p>• Get supports to 100 friendship for major stat bonuses</p>
            <p>• Collect Pokeclocks for emergency turn extensions</p>
          </div>
        </SubSection>

        <SubSection title="Late Game (Turns 49-63)">
          <div className="space-y-1">
            <p>• Prepare for Elite Four gauntlet (4 consecutive battles)</p>
            <p>• Ensure type coverage in abilities for different matchups</p>
            <p>• HP and Defense help survive the longer Elite Four fights</p>
            <p>• Use remaining Pokeclocks before Elite Four if needed</p>
          </div>
        </SubSection>

        <SubSection title="Strategy Tips">
          <div className="bg-pocket-bg rounded p-2 space-y-1 text-xs">
            <p><strong>Nuker Pokemon:</strong> Front-load damage, great for quick wins</p>
            <p><strong>Scaler Pokemon:</strong> Better sustained DPS, good for longer fights</p>
            <p><strong>Chipper Pokemon:</strong> Rapid attacks, excellent stamina efficiency</p>
            <p><strong>High Instinct:</strong> More crits (5% + Inst/800) and dodges while resting</p>
            <p><strong>High Speed:</strong> Faster stamina regen = more ability usage</p>
            <p><strong>Type Advantage:</strong> +25% damage when super effective</p>
          </div>
        </SubSection>

        <SubSection title="Hall of Fame Tips">
          <div className="bg-pocket-bg rounded p-2 space-y-1 text-xs">
            <p>• Train diverse Pokemon types for better Inspiration coverage</p>
            <p>• Gym defeats (0-7) are tracked for each Pokemon</p>
            <p>• Stronger Hall of Fame Pokemon = better Inspiration bonuses</p>
            <p>• Tournament eligibility requires Hall of Fame entries</p>
          </div>
        </SubSection>
      </GuideSection>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl w-full max-w-2xl shadow-card-lg my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {showHeader && (
            <div className="sticky top-0 bg-white border-b border-pocket-bg p-4 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center gap-2">
                <HelpCircle size={20} className="text-pocket-blue" />
                <h2 className="text-lg font-bold text-pocket-text">Game Guide</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className="p-4 max-h-[80vh] overflow-y-auto">
            {content}
          </div>
        </motion.div>
      </div>
    );
  }

  // Embedded version (for home screen)
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {showHeader && (
        <div className="border-b border-pocket-bg p-4 flex items-center gap-2">
          <HelpCircle size={20} className="text-pocket-blue" />
          <h2 className="text-lg font-bold text-pocket-text">Game Guide</h2>
        </div>
      )}
      <div className="p-4">
        {content}
      </div>
    </div>
  );
};

export default GameGuide;
