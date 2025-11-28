/**
 * AuthModal Component
 *
 * Login/Register modal for user authentication.
 * Can be used as optional modal or mandatory login screen.
 * Supports Google SSO authentication.
 */

import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, X } from 'lucide-react';

// Google Client ID - should match the one in backend .env
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Google Sign-In Button Component
const GoogleSignInButton = ({ onSuccess, onError, disabled }) => {
  const handleGoogleSignIn = useCallback(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      onError('Google Sign-In not available');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else {
          onError('Google Sign-In failed');
        }
      }
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to button click if One Tap is not available
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with'
          }
        );
      }
    });
  }, [onSuccess, onError]);

  useEffect(() => {
    // Load Google Identity Services script
    if (!window.google && GOOGLE_CLIENT_ID) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Initialize after script loads
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response.credential) {
                onSuccess(response.credential);
              }
            }
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [onSuccess]);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Don't show Google button if not configured
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-pocket-text-light">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-semibold text-pocket-text">Continue with Google</span>
      </button>

      {/* Hidden container for Google's rendered button (fallback) */}
      <div id="google-signin-button" className="hidden" />
    </div>
  );
};

const AuthModal = ({
  showAuth,
  authMode,
  authForm,
  authError,
  authLoading,
  onClose,
  onSubmit,
  onFormChange,
  onModeChange,
  onGoogleLogin,
  ICONS,
  isMandatory = false
}) => {
  if (!showAuth && !isMandatory) return null;

  const handleGoogleSuccess = async (credential) => {
    if (onGoogleLogin) {
      try {
        await onGoogleLogin(credential);
      } catch (error) {
        console.error('Google login error:', error);
      }
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google Sign-In error:', error);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-card-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-pocket-red/10 flex items-center justify-center">
              <User size={20} className="text-pocket-red" />
            </div>
            <h2 className="text-xl font-bold text-pocket-text">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </h2>
          </div>
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-pocket-text-light hover:text-pocket-text hover:bg-pocket-bg rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="bg-pocket-blue/10 border border-pocket-blue/30 rounded-xl p-3 mb-4">
            <p className="text-pocket-blue text-sm font-semibold">
              Please log in or create an account to continue
            </p>
          </div>
        )}

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-600 text-sm font-semibold">{authError}</p>
          </div>
        )}

        {/* Google Sign-In Button */}
        {onGoogleLogin && (
          <div className="mb-4">
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={authLoading}
            />
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-pocket-text mb-2">
              Username
            </label>
            <input
              type="text"
              value={authForm.username}
              onChange={(e) => onFormChange('username', e.target.value)}
              className="w-full px-4 py-3 bg-pocket-bg border-2 border-transparent rounded-xl focus:border-pocket-red focus:bg-white focus:outline-none transition-colors"
              placeholder="Enter username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-bold text-pocket-text mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-pocket-bg border-2 border-transparent rounded-xl focus:border-pocket-red focus:bg-white focus:outline-none transition-colors"
                placeholder="Enter email (optional)"
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-pocket-text mb-2">
              Password
            </label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => onFormChange('password', e.target.value)}
              className="w-full px-4 py-3 bg-pocket-bg border-2 border-transparent rounded-xl focus:border-pocket-red focus:bg-white focus:outline-none transition-colors"
              placeholder="Enter password"
              autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="pocket-btn-primary w-full py-3 text-lg"
          >
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onModeChange}
            className="text-pocket-blue hover:text-pocket-blue/80 font-semibold text-sm transition-colors"
          >
            {authMode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
