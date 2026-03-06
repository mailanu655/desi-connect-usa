/**
 * Tests for auth-client.ts
 * Tests the AuthClientImpl class that handles all authentication API calls
 */

import { AuthClientImpl } from '@/lib/auth-client';
import { UserProfile, AuthSession, AuthResult, IdentityLinkResult } from '@desi-connect/shared';

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthClientImpl', () => {
  let authClient: AuthClientImpl;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    authClient = new AuthClientImpl('/api/auth');
    jest.clearAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('should return the correct Google OAuth URL', () => {
      const url = authClient.getGoogleAuthUrl();
      expect(url).toBe('/api/auth/google');
    });

    it('should use custom API URL when provided', () => {
      const customClient = new AuthClientImpl('/custom/api');
      const url = customClient.getGoogleAuthUrl();
      expect(url).toBe('/custom/api/google');
    });
  });

  describe('handleGoogleCallback', () => {
    it('should exchange Google code for session and user profile', async () => {
      const mockUser: UserProfile = {
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

      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockResponse: AuthResult = {
        success: true,
        user: mockUser,
        session: mockSession,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authClient.handleGoogleCallback('auth_code_123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/google/callback?code=auth_code_123',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('should throw error when callback fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid code' }),
      } as Response);

      await expect(authClient.handleGoogleCallback('invalid_code')).rejects.toThrow(
        'Invalid code'
      );
    });

    it('should handle URL encoding of code parameter', async () => {
      const codeWithSpecialChars = 'code+with/special=chars';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await authClient.handleGoogleCallback(codeWithSpecialChars);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('code%2Bwith%2Fspecial%3Dchars'),
        expect.any(Object)
      );
    });
  });

  describe('sendMagicLink', () => {
    it('should send magic link to email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Magic link sent to user@example.com',
        }),
      } as Response);

      const result = await authClient.sendMagicLink('user@example.com');

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/magic-link/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('user@example.com');
    });

    it('should throw error when magic link send fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email not found' }),
      } as Response);

      await expect(authClient.sendMagicLink('notfound@example.com')).rejects.toThrow(
        'Email not found'
      );
    });

    it('should use default error message when error is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(authClient.sendMagicLink('user@example.com')).rejects.toThrow(
        'Failed to send magic link'
      );
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify magic link token and return auth result', async () => {
      const mockUser: UserProfile = {
        user_id: 'user123',
        phone_number: null,
        email: 'user@example.com',
        display_name: 'John Doe',
        avatar_url: undefined,
        identity_linked: false,
        preferred_channel: 'web',
        created_via: 'website',
        auth_provider: 'email_magic_link',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockResponse: AuthResult = {
        success: true,
        user: mockUser,
        session: {
          session_id: 'sess123',
          user_id: 'user123',
          access_token: 'token123',
          expires_at: '2025-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authClient.verifyMagicLink('token123');

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/magic-link/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'token123' }),
      });
      expect(result.success).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Token expired' }),
      } as Response);

      await expect(authClient.verifyMagicLink('expired_token')).rejects.toThrow(
        'Token expired'
      );
    });
  });

  describe('sendPhoneOtp', () => {
    it('should send OTP to phone number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          verificationId: 'verif123',
        }),
      } as Response);

      const result = await authClient.sendPhoneOtp('+1234567890');

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/phone-otp/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: '+1234567890' }),
      });
      expect(result.success).toBe(true);
      expect(result.verificationId).toBe('verif123');
    });

    it('should throw error when OTP send fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid phone number' }),
      } as Response);

      await expect(authClient.sendPhoneOtp('invalid')).rejects.toThrow(
        'Invalid phone number'
      );
    });
  });

  describe('verifyPhoneOtp', () => {
    it('should verify phone OTP and authenticate user', async () => {
      const mockUser: UserProfile = {
        user_id: 'user456',
        phone_number: '+1234567890',
        email: null,
        display_name: 'Jane Smith',
        avatar_url: undefined,
        identity_linked: false,
        preferred_channel: 'whatsapp',
        created_via: 'whatsapp',
        auth_provider: 'phone_otp',
        is_verified: true,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockResponse: AuthResult = {
        success: true,
        user: mockUser,
        session: {
          session_id: 'sess456',
          user_id: 'user456',
          access_token: 'token456',
          expires_at: '2025-01-02T00:00:00Z',
          created_at: '2024-01-02T00:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authClient.verifyPhoneOtp(
        '+1234567890',
        '123456',
        'verif123'
      );

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/phone-otp/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: '+1234567890',
          otpCode: '123456',
          verificationId: 'verif123',
        }),
      });
      expect(result.success).toBe(true);
      expect(result.user?.phone_number).toBe('+1234567890');
    });

    it('should throw error for invalid OTP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid OTP code' }),
      } as Response);

      await expect(
        authClient.verifyPhoneOtp('+1234567890', 'wrong', 'verif123')
      ).rejects.toThrow('Invalid OTP code');
    });
  });

  describe('initiateIdentityLink', () => {
    it('should initiate identity linking by sending OTP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          verificationId: 'link_verif123',
        }),
      } as Response);

      const result = await authClient.initiateIdentityLink('+1234567890');

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/identity-link', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: '+1234567890' }),
      });
      expect(result.success).toBe(true);
      expect(result.verificationId).toBe('link_verif123');
    });

    it('should throw error when identity link initiation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User not authenticated' }),
      } as Response);

      await expect(authClient.initiateIdentityLink('+1234567890')).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('completeIdentityLink', () => {
    it('should complete identity linking with OTP verification', async () => {
      const mockUser: UserProfile = {
        user_id: 'user123',
        phone_number: '+1234567890',
        email: 'user@example.com',
        display_name: 'John Doe',
        avatar_url: undefined,
        identity_linked: true,
        preferred_channel: 'both',
        created_via: 'website',
        auth_provider: 'google',
        is_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockResponse: IdentityLinkResult = {
        success: true,
        message: 'Identity linked successfully',
        user: mockUser,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authClient.completeIdentityLink(
        '+1234567890',
        '123456',
        'link_verif123'
      );

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/identity-link', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: '+1234567890',
          otpCode: '123456',
          verificationId: 'link_verif123',
        }),
      });
      expect(result.success).toBe(true);
      expect(result.user?.identity_linked).toBe(true);
    });

    it('should throw error when identity link completion fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'OTP verification failed' }),
      } as Response);

      await expect(
        authClient.completeIdentityLink('+1234567890', 'wrong', 'link_verif123')
      ).rejects.toThrow('OTP verification failed');
    });
  });

  describe('getSession', () => {
    it('should return current session when authenticated', async () => {
      const mockSession: AuthSession = {
        session_id: 'sess123',
        user_id: 'user123',
        access_token: 'token123',
        expires_at: '2025-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession }),
      } as Response);

      const result = await authClient.getSession();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const result = await authClient.getSession();

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authClient.getSession();

      expect(result).toBeNull();
    });

    it('should return null when session is not in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'something' }),
      } as Response);

      const result = await authClient.getSession();

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authClient.logout();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw error when logout fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(authClient.logout()).rejects.toThrow('Failed to logout');
    });
  });

  describe('refreshSession', () => {
    it('should refresh current session', async () => {
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

      const mockResponse: AuthResult = {
        success: true,
        user: mockUser,
        session: {
          session_id: 'sess123_refreshed',
          user_id: 'user123',
          access_token: 'token123_new',
          expires_at: '2025-01-02T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authClient.refreshSession();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result.success).toBe(true);
      expect(result.session?.access_token).toBe('token123_new');
    });

    it('should throw error when refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Session expired' }),
      } as Response);

      await expect(authClient.refreshSession()).rejects.toThrow(
        'Session expired'
      );
    });
  });

  describe('custom API URL', () => {
    it('should use custom API URL for all endpoints', () => {
      const customClient = new AuthClientImpl('/custom/auth');

      customClient.getGoogleAuthUrl();
      expect(customClient.getGoogleAuthUrl()).toBe('/custom/auth/google');
    });
  });
});
