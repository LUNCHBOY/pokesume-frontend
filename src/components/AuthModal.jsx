/**
 * AuthModal Component
 *
 * Login/Register modal for user authentication.
 * Can be used as optional modal or mandatory login screen.
 */

import React from 'react';

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
  ICONS,
  isMandatory = false  // New prop for mandatory login mode
}) => {
  if (!showAuth && !isMandatory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-600">
            {authMode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-2xl">{ICONS.CLOSE || '✕'}</span>
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3 mb-4">
            <p className="text-blue-700 text-sm font-bold">
              Please log in or create an account to continue
            </p>
          </div>
        )}

        {authError && (
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm font-bold">{authError}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={authForm.username}
              onChange={(e) => onFormChange('username', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              placeholder="Enter username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Enter email (optional)"
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) => onFormChange('password', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              placeholder="Enter password"
              autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onModeChange}
            className="text-purple-600 hover:text-purple-700 font-bold text-sm"
          >
            {authMode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
