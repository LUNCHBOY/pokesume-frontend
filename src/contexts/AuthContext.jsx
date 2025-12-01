/**
 * AuthContext
 *
 * Manages authentication state across the application.
 * Provides user, token, login, logout, and registration functionality.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiLogout, apiGoogleLogin, apiSetUsername, apiGetProfile } from '../services/apiService';

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

  // Fetch profile on initial load to get profileIcon and other profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authToken || !user) return;

      try {
        const profileData = await apiGetProfile(authToken);
        if (profileData?.user?.profileIcon && profileData.user.profileIcon !== user.profileIcon) {
          // Update user with profileIcon from server
          const updatedUser = { ...user, profileIcon: profileData.user.profileIcon };
          setUser(updatedUser);
          localStorage.setItem('pokesume_user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Failed to fetch profile on load:', error);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]); // Only run when authToken changes (login/logout) - intentionally excluding user to prevent infinite loop

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

  // Google login handler
  const googleLogin = async (credential) => {
    try {
      setAuthError(null);
      setAuthLoading(true);

      const data = await apiGoogleLogin(credential);

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

  // Update user (e.g., after rating change)
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('pokesume_user', JSON.stringify(updatedUser));
  };

  // Set username for new Google users
  const setUsername = async (username) => {
    try {
      setAuthError(null);
      setAuthLoading(true);

      const data = await apiSetUsername(username, authToken);

      // Update token and user with new username
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

  const value = {
    user,
    authToken,
    token: authToken, // Alias for backward compatibility
    authError,
    authLoading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    setUsername,
    setAuthError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
