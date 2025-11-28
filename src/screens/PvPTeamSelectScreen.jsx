/**
 * PvPTeamSelectScreen Component
 *
 * Team selection screen for PvP matchmaking.
 * Player selects 3 trained Pokemon from their inventory.
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { TypeBadge } from '../components/TypeIcon';
import { generatePokemonSprite, getPokemonGrade, getGradeColor } from '../utils/gameUtils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const PvPTeamSelectScreen = () => {
  const { setGameState, setPvPSelectedTeam } = useGame();
  const { authToken } = useAuth();
  const { trainedPokemon, loadTrainedPokemon, trainedLoading } = useInventory();

  const [selectedPokemon, setSelectedPokemon] = useState([null, null, null]);

  useEffect(() => {
    if (authToken) {
      loadTrainedPokemon(100, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const handleSelectPokemon = (pokemon) => {
    // Check if already selected
    const existingIndex = selectedPokemon.findIndex(p => p?.id === pokemon.id);

    if (existingIndex >= 0) {
      // Deselect
      const newSelected = [...selectedPokemon];
      newSelected[existingIndex] = null;
      setSelectedPokemon(newSelected);
    } else {
      // Select in first empty slot
      const emptyIndex = selectedPokemon.findIndex(p => p === null);
      if (emptyIndex >= 0) {
        const newSelected = [...selectedPokemon];
        newSelected[emptyIndex] = pokemon;
        setSelectedPokemon(newSelected);
      }
    }
  };

  const isSelected = (pokemon) => {
    return selectedPokemon.some(p => p?.id === pokemon.id);
  };

  const getSelectionIndex = (pokemon) => {
    return selectedPokemon.findIndex(p => p?.id === pokemon.id);
  };

  const canProceed = selectedPokemon.filter(p => p !== null).length === 3;

  const handleEnterQueue = () => {
    if (canProceed) {
      setPvPSelectedTeam(selectedPokemon);
      setGameState('pvpQueue');
    }
  };

  const getStatTotal = (stats) => {
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
  };

  return (
    <div className="min-h-screen bg-pocket-bg p-4">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-10 bg-white shadow-card rounded-2xl mb-4 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setGameState('pvp')}
            className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Swords size={20} className="text-type-fighting" />
            <span className="font-bold text-pocket-text">Select Your Team</span>
          </div>
          <div className="w-10" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto">
        {/* Selected Team Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card p-4 mb-4"
        >
          <h3 className="font-bold text-pocket-text mb-3">Your Team (Select 3)</h3>
          <div className="grid grid-cols-3 gap-3">
            {selectedPokemon.map((pokemon, index) => (
              <div
                key={index}
                className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center ${
                  pokemon ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {pokemon ? (
                  <div className="text-center p-2">
                    <div className="w-12 h-12 mx-auto mb-1">
                      {generatePokemonSprite(pokemon.primaryType, pokemon.name)}
                    </div>
                    <div className="text-xs font-bold truncate">{pokemon.name}</div>
                    <div className="flex items-center justify-center gap-1">
                      {pokemon.stats && (
                        <span
                          className="px-1 py-0.5 rounded text-[8px] font-bold text-white"
                          style={{ backgroundColor: getGradeColor(getPokemonGrade(pokemon.stats)) }}
                        >
                          {getPokemonGrade(pokemon.stats)}
                        </span>
                      )}
                      <TypeBadge type={pokemon.primaryType} size={10} className="text-[8px]" />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Slot {index + 1}</div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleEnterQueue}
            disabled={!canProceed}
            className={`w-full mt-4 py-3 rounded-xl font-bold transition-all ${
              canProceed
                ? 'bg-type-fighting text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canProceed ? 'Enter Queue' : `Select ${3 - selectedPokemon.filter(p => p !== null).length} more Pokemon`}
          </button>
        </motion.div>

        {/* Pokemon List */}
        {trainedLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <p className="text-pocket-text-light">Loading your trained Pokemon...</p>
          </motion.div>
        ) : trainedPokemon.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-8 text-center"
          >
            <p className="text-pocket-text mb-2">No trained Pokemon found</p>
            <p className="text-sm text-pocket-text-light mb-4">
              Complete careers to add Pokemon to your roster!
            </p>
            <button
              onClick={() => setGameState('menu')}
              className="pocket-btn-primary px-6 py-2"
            >
              Back to Menu
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-card p-4"
          >
            <h3 className="font-bold text-pocket-text mb-3">
              Trained Pokemon ({trainedPokemon.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {trainedPokemon.map((pokemon) => {
                const selected = isSelected(pokemon);
                const selectionNum = getSelectionIndex(pokemon) + 1;
                const grade = pokemon.grade || getPokemonGrade(pokemon.stats);
                const statTotal = getStatTotal(pokemon.stats);

                return (
                  <motion.div
                    key={pokemon.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPokemon(pokemon)}
                    className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    {/* Selection Badge */}
                    {selected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{selectionNum}</span>
                      </div>
                    )}

                    {/* Pokemon Info */}
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-2">
                        {generatePokemonSprite(pokemon.primaryType || pokemon.type, pokemon.name)}
                      </div>
                      <div className="font-bold text-sm truncate mb-1">{pokemon.name}</div>
                      <TypeBadge type={pokemon.primaryType || pokemon.type} size={12} className="text-[10px] mb-1" />

                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: getGradeColor(grade),
                            color: grade === 'UU' || grade === 'S' ? '#fff' : '#333'
                          }}
                        >
                          {grade}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {statTotal}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PvPTeamSelectScreen;
