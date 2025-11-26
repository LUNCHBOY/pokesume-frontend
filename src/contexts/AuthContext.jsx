/**
 * AuthContext
 *
 * Manages authentication state across the application.
 * Provides user, token, login, logout, and registration functionality.
 */

import React, { createContext, useContext, useState } from 'react';
import { apiLogin, apiRegister, apiLogout } from '../services/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pokesume_user');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load user:', error);
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('pokesume_token') || null;
  });

  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Login handler
  const login = async (username, password) => {
    try {
      setAuthError(null);
      setAuthLoading(true);

      const data = await apiLogin(username, password);

      // Save token and user
      setAuthToken(data.token);
      setUser(data.user);
      localStorage.setItem('pokesume_token', data.token);
      localStorage.setItem('pokesume_user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    try {
      setAuthError(null);
      setAuthLoading(true);

      const data = await apiRegister(username, email, password);

      // Save token and user
      setAuthToken(data.token);
      setUser(data.user);
      localStorage.setItem('pokesume_token', data.token);
      localStorage.setItem('pokesume_user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    apiLogout();
    setAuthToken(null);
    setUser(null);
  };

  // Update user (e.g., after rating change)
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('pokesume_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    authToken,
    authError,
    authLoading,
    login,
    register,
    logout,
    updateUser,
    setAuthError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
