/**
 * AuthWrapper Component
 *
 * This component gates all application access behind mandatory authentication.
 * Users must successfully log in or register before accessing any game features.
 * Uses AuthContext for state management.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function AuthWrapper({ children }) {
  const { user, authToken, authError, authLoading, login, register, setAuthError } = useAuth();

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });

  // Handle form submission
  const handleAuthSubmit = async (e) => {
    console.log('[Auth] handleAuthSubmit called', { authMode, username: authForm.username });
    e.preventDefault();
    e.stopPropagation();

    try {
      console.log('Auth submit:', authMode, authForm.username);

      if (authMode === 'register') {
        // Use email if provided, otherwise use username@pokesume.local
        const email = authForm.email || `${authForm.username}@pokesume.local`;
        console.log('Calling register...');
        const result = await register(authForm.username, email, authForm.password);
        console.log('Registration successful!', result);
        if (result) {
          setAuthForm({ username: '', email: '', password: '' });
        }
      } else {
        console.log('Calling login...');
        const result = await login(authForm.username, authForm.password);
        console.log('Login successful!', result);
        if (result) {
          setAuthForm({ username: '', email: '', password: '' });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Error is already set by context
    }
  };

  const handleAuthFormChange = (field, value) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAuthModeChange = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setAuthError(null);
  };

  // If user is not authenticated, show login screen (non-closable)
  if (!user || !authToken) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-purple-400 to-blue-500">
        <AuthModal
          showAuth={true}
          authMode={authMode}
          authForm={authForm}
          authError={authError}
          authLoading={authLoading}
          onClose={null} // Cannot close - mandatory login
          onSubmit={handleAuthSubmit}
          onFormChange={handleAuthFormChange}
          onModeChange={handleAuthModeChange}
          ICONS={{ POKEBALL: '🎯', CLOSE: '✕' }}
          isMandatory={true}
        />
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
