/**
 * AppProviders
 *
 * Combined context providers wrapper for the entire application.
 * Wraps all contexts in the correct order for proper dependency injection.
 */

import React from 'react';
import { AuthProvider } from './AuthContext';
import { GameProvider } from './GameContext';
import { InventoryProvider } from './InventoryContext';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <InventoryProvider>
        <GameProvider>
          {children}
        </GameProvider>
      </InventoryProvider>
    </AuthProvider>
  );
};
