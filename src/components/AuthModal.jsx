/**
 * AuthModal Component
 *
 * Login/Register modal for user authentication.
 * Can be used as optional modal or mandatory login screen.
 * Supports Google SSO authentication.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, AlertTriangle } from 'lucide-react';

// Google Client ID - should match the one in backend .env
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log('[AuthModal] GOOGLE_CLIENT_ID configured:', !!GOOGLE_CLIENT_ID);

// Google Sign-In Button Component
const GoogleSignInButton = ({ onSuccess, onError, disabled }) => {
  const buttonRef = React.useRef(null);

  useEffect(() => {
    // Load Google Identity Services script
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGoogle = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError('Google Sign-In failed');
          }
        },
        use_fedcm_for_prompt: true // Opt-in to FedCM for future compatibility
      });

      // Render the Google button directly (more reliable than One Tap)
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: 'outline',
            size: 'large',
            width: 350, // Fixed pixel width (required by Google API)
            text: 'continue_with'
          }
        );
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, [onSuccess, onError]);

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

      {/* Google's rendered button container */}
      <div className="flex justify-center">
        <div ref={buttonRef} className={disabled ? 'opacity-50 pointer-events-none' : ''} />
      </div>
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
  const [showBetaWarning, setShowBetaWarning] = useState(true);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-start overflow-y-auto p-4 py-8 z-50">
      {/* Game Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex-shrink-0"
      >
        <img
          src="/images/logo.png"
          alt="Pokesume Pretty Duel!"
          className="w-72 md:w-96 h-auto drop-shadow-lg"
        />
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-card-lg flex-shrink-0 mb-8"
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

      {/* Beta Warning Modal */}
      <AnimatePresence>
        {showBetaWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-pocket-text text-center mb-3">
                Beta Experience
              </h3>
              <p className="text-pocket-text-light text-center mb-6">
                This is a beta experience. We're wiping account progress regularly.
              </p>
              <button
                onClick={() => setShowBetaWarning(false)}
                className="pocket-btn-primary w-full py-3"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthModal;
