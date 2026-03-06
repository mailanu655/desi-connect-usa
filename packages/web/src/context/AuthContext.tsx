'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, AuthSession, AuthResult } from '@desi-connect/shared';
import authClient from '@/lib/auth-client';

export interface AuthContextValue {
  user: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider: 'google' | 'magic_link' | 'phone_otp') => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session) {
          setSession(session);
          // In a real app, you'd fetch the full user profile from the session
          // For now, we'll assume the session data includes user info
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback((provider: 'google' | 'magic_link' | 'phone_otp') => {
    if (provider === 'google') {
      // Redirect to Google OAuth
      const authUrl = authClient.getGoogleAuthUrl();
      window.location.href = authUrl;
    } else if (provider === 'magic_link') {
      // Redirect to magic link form
      window.location.href = '/auth/login?method=magic_link';
    } else if (provider === 'phone_otp') {
      // Redirect to phone OTP form
      window.location.href = '/auth/login?method=phone_otp';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authClient.logout();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      // Handle error gracefully without rethrowing
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const result = await authClient.refreshSession();
      if (result.success && result.session && result.user) {
        setSession(result.session);
        setUser(result.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Handle error gracefully without rethrowing
    }
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Default value returned when useAuth is called outside AuthProvider
// (e.g. during Next.js static page generation / SSR)
const defaultAuthValue: AuthContextValue = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing during SSR / static generation
    return defaultAuthValue;
  }
  return context;
}
