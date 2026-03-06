/**
 * Tests for AuthGuard.tsx
 * Tests the protected route component that ensures authentication
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '@/components/auth/AuthGuard';

jest.mock('@/context/AuthContext');

import { useAuth } from '@/context/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // When not authenticated, protected content should not be rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
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
      },
      session: {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render loading spinner with specific UI elements', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { container } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // Check for loading spinner element
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show full-height loading screen', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { container } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    const fullHeightContainer = container.querySelector('.min-h-screen');
    expect(fullHeightContainer).toBeInTheDocument();
  });

  it('should not render children when loading is false but not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when loading is done and authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
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
      },
      session: {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not call router.push when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
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
      },
      session: {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

  });

  it('should handle multiple children correctly', () => {
    mockUseAuth.mockReturnValue({
      user: {
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
      },
      session: {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <AuthGuard>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </AuthGuard>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
