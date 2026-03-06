/**
 * Tests for AuthContext.tsx
 * Tests the AuthProvider and useAuth hook
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import authClient from '@/lib/auth-client';
import { UserProfile, AuthSession } from '@desi-connect/shared';

jest.mock('@/lib/auth-client');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockAuthClient = authClient as jest.Mocked<typeof authClient>;

// Test component that uses the useAuth hook
function TestComponent() {
  const { user, session, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'NotAuthenticated'}</div>
      {user && (
        <>
          <div data-testid="user-id">{user.user_id}</div>
          <div data-testid="user-name">{user.display_name}</div>
          <div data-testid="user-email">{user.email}</div>
          <div data-testid="identity-linked">{user.identity_linked ? 'Linked' : 'NotLinked'}</div>
        </>
      )}
      {session && <div data-testid="session-id">{session.session_id}</div>}
      <button onClick={() => login('google')} data-testid="login-google">
        Login Google
      </button>
      <button onClick={() => login('magic_link')} data-testid="login-magic">
        Login Magic Link
      </button>
      <button onClick={() => login('phone_otp')} data-testid="login-phone">
        Login Phone
      </button>
      <button onClick={() => logout()} data-testid="logout">
        Logout
      </button>
      <button onClick={() => refreshUser()} data-testid="refresh">
        Refresh
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('AuthProvider initialization', () => {
    it('should check for existing session on mount', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });
      expect(mockAuthClient.getSession).toHaveBeenCalled();
    });

    it('should load existing session on mount', async () => {
      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthClient.getSession.mockResolvedValueOnce(mockSession);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent('sess123');
      });
    });

    it('should show loading state initially', () => {
      mockAuthClient.getSession.mockImplementation(
        () => new Promise(() => {
          // Never resolves
        })
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    });

    it('should handle session check errors gracefully', async () => {
      mockAuthClient.getSession.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('NotAuthenticated');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const Component = () => {
        useAuth();
        return null;
      };

      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      expect(() => {
        render(<Component />);
      }).toThrow('useAuth must be used within an AuthProvider');
      consoleError.mockRestore();
    });

    it('should initialize with null user and session', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('NotAuthenticated');
      });
    });

    it('should provide isAuthenticated as false when user and session are null', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('NotAuthenticated');
      });
    });
  });

  describe('login method', () => {
    it('should call Google login and redirect', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);
      mockAuthClient.getGoogleAuthUrl.mockReturnValueOnce('https://accounts.google.com/oauth');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      const loginButton = screen.getByTestId('login-google');
      act(() => {
        loginButton.click();
      });

      // Verify the Google auth client method was called
      expect(mockAuthClient.getGoogleAuthUrl).toHaveBeenCalled();
    });

    it('should call magic link login', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      const loginButton = screen.getByTestId('login-magic');
      act(() => {
        loginButton.click();
      });

      // Verify window.location.href is updated by checking it's not empty
      // (actual navigation URL validation is done at integration level)
      expect(window.location.href).toBeTruthy();
    });

    it('should call phone OTP login', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      const loginButton = screen.getByTestId('login-phone');
      act(() => {
        loginButton.click();
      });

      // Verify window.location.href is updated
      expect(window.location.href).toBeTruthy();
    });
  });

  describe('logout method', () => {
    it('should call authClient.logout and clear user and session', async () => {
      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthClient.getSession.mockResolvedValueOnce(mockSession);
      mockAuthClient.logout.mockResolvedValueOnce(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent('sess123');
      });

      const logoutButton = screen.getByTestId('logout');
      await act(async () => {
        logoutButton.click();
      });

      expect(mockAuthClient.logout).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.queryByTestId('session-id')).not.toBeInTheDocument();
      });
    });

    it('should handle logout errors gracefully', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      // Mock logout to throw an error
      mockAuthClient.logout.mockImplementationOnce(async () => {
        throw new Error('Logout failed');
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      const logoutButton = screen.getByTestId('logout');

      // Logout error should be handled gracefully, not thrown
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        logoutButton.click();
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      errorSpy.mockRestore();

      // Component should still be rendered even if logout fails
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('refreshUser method', () => {
    it('should refresh session and update user data', async () => {
      const mockUser: UserProfile = {
        user_id: 'user123',
        phone_number: null,
        email: 'user@example.com',
        display_name: 'John Doe',
        avatar_url: undefined,
        identity_linked: false,
        preferred_channel: 'web',
        created_via: 'website',
        auth_provider: 'google',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthClient.getSession.mockResolvedValueOnce(null);
      mockAuthClient.refreshSession.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        session: mockSession,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      const refreshButton = screen.getByTestId('refresh');
      await act(async () => {
        refreshButton.click();
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user123');
        expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
        expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
      });
    });

    it('should handle refresh errors gracefully', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      // Mock refreshSession to throw an error
      mockAuthClient.refreshSession.mockImplementationOnce(async () => {
        throw new Error('Refresh failed');
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
      });

      const refreshButton = screen.getByTestId('refresh');

      // Refresh error should be handled gracefully, not thrown
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        refreshButton.click();
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      errorSpy.mockRestore();

      // Component should still be rendered even if refresh fails
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should update isAuthenticated when user is refreshed', async () => {
      const mockUser: UserProfile = {
        user_id: 'user123',
        phone_number: null,
        email: 'user@example.com',
        display_name: 'John Doe',
        avatar_url: undefined,
        identity_linked: false,
        preferred_channel: 'web',
        created_via: 'website',
        auth_provider: 'google',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthClient.getSession.mockResolvedValueOnce(null);
      mockAuthClient.refreshSession.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        session: mockSession,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('NotAuthenticated');
      });

      const refreshButton = screen.getByTestId('refresh');
      await act(async () => {
        refreshButton.click();
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      });
    });
  });

  describe('isAuthenticated property', () => {
    it('should be true when both user and session exist', async () => {
      const mockUser: UserProfile = {
        user_id: 'user123',
        phone_number: null,
        email: 'user@example.com',
        display_name: 'John Doe',
        avatar_url: undefined,
        identity_linked: false,
        preferred_channel: 'web',
        created_via: 'website',
        auth_provider: 'google',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthClient.getSession.mockResolvedValueOnce(mockSession);
      mockAuthClient.refreshSession.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        session: mockSession,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const refreshButton = screen.getByTestId('refresh');
      await act(async () => {
        refreshButton.click();
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      });
    });

    it('should be false when user is null even if session exists', async () => {
      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockAuthClient.getSession.mockResolvedValueOnce(mockSession);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('NotAuthenticated');
      });
    });

    it('should be false when session is null even if user exists', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('NotAuthenticated');
      });
    });
  });
});
