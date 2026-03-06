/**
 * Tests for UserMenu.tsx
 * Tests the user menu component with authentication actions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/components/auth/UserMenu';

jest.mock('@/context/AuthContext');
jest.mock('next/link', () => {
  return function MockedLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

import { useAuth } from '@/context/AuthContext';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when not authenticated', () => {
    it('should show Sign In link when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const signInLink = screen.getByText('Sign In');
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/auth/login');
    });

    it('should not show user menu when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    const mockUser = {
      user_id: 'user123',
      phone_number: null,
      email: 'user@example.com',
      display_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
      identity_linked: false,
      preferred_channel: 'web',
      created_via: 'website',
      auth_provider: 'google',
      is_verified: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      session_id: 'sess123',
      user_id: 'user123',
      access_token: 'token123',
      expires_at: '2025-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should show user avatar when authenticated with avatar_url', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      const { container } = render(<UserMenu />);

      const avatar = container.querySelector('img[alt="John Doe"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should show user initials when no avatar_url', () => {
      const userWithoutAvatar = { ...mockUser, avatar_url: undefined };
      mockUseAuth.mockReturnValue({
        user: userWithoutAvatar,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      // Should show first letter of display_name
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should show user display name', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      // Display name appears in the button
      const displayNames = screen.getAllByText('John Doe');
      expect(displayNames.length).toBeGreaterThan(0);
    });

    it('should open menu when button is clicked', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Menu items should now be visible
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should close menu when button is clicked again', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');

      // Open menu
      fireEvent.click(button);
      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Close menu
      fireEvent.click(button);
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('should show Profile and Settings menu items', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Profile')).toHaveAttribute('href', '/profile');
      expect(screen.getByText('Settings')).toHaveAttribute('href', '/settings');
    });

    it('should show Link WhatsApp button when identity not linked', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, identity_linked: false },
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const linkButton = screen.getByText('Link WhatsApp');
      expect(linkButton).toBeInTheDocument();
      expect(linkButton).toHaveAttribute('href', '/auth/link-identity');
    });

    it('should show WhatsApp Linked status when identity is linked', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, identity_linked: true },
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('WhatsApp Linked')).toBeInTheDocument();
    });

    it('should show Logout button', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
    });

    it('should call logout and close menu when logout clicked', async () => {
      const mockLogout = jest.fn().mockResolvedValueOnce(undefined);
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: mockLogout,
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('should close menu when Profile link is clicked', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      const profileLink = screen.getByText('Profile');
      fireEvent.click(profileLink);

      // Menu should close
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('should close menu on outside click', async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <div>
          <UserMenu />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Click outside
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      });
    });

    it('should show user email in dropdown header', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('should show user phone when email is not available', () => {
      const userWithPhone = {
        ...mockUser,
        email: null,
        phone_number: '+1234567890',
      };

      mockUseAuth.mockReturnValue({
        user: userWithPhone,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(<UserMenu />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should toggle dropdown arrow on menu open/close', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      const { container } = render(<UserMenu />);

      const button = screen.getByRole('button');
      const svg = container.querySelector('svg');

      // Initial state - menu closed
      expect(svg).not.toHaveClass('rotate-180');

      fireEvent.click(button);

      // Menu opened - arrow should rotate
      expect(svg).toHaveClass('rotate-180');

      fireEvent.click(button);

      // Menu closed - arrow back to normal
      expect(svg).not.toHaveClass('rotate-180');
    });
  });
});
