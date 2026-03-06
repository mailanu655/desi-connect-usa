/**
 * Client-side authentication helper for Desi Connect USA
 * Handles Google OAuth, Magic Link, Phone OTP, and Identity Linking flows
 */

import { AuthResult, AuthSession, UserProfile, IdentityLinkResult } from '@desi-connect/shared';

export interface AuthClient {
  // Google OAuth
  getGoogleAuthUrl(): string;
  handleGoogleCallback(code: string): Promise<AuthResult>;

  // Email Magic Link
  sendMagicLink(email: string): Promise<{ success: boolean; message: string }>;
  verifyMagicLink(token: string): Promise<AuthResult>;

  // Phone OTP
  sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; verificationId: string }>;
  verifyPhoneOtp(phoneNumber: string, otpCode: string, verificationId: string): Promise<AuthResult>;

  // Identity Linking
  initiateIdentityLink(phoneNumber: string): Promise<{ success: boolean; verificationId: string }>;
  completeIdentityLink(phoneNumber: string, otpCode: string, verificationId: string): Promise<IdentityLinkResult>;

  // Session
  getSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  refreshSession(): Promise<AuthResult>;
}

class AuthClientImpl implements AuthClient {
  private apiUrl: string;

  constructor(apiUrl: string = '/api/auth') {
    this.apiUrl = apiUrl;
  }

  /**
   * Get the Google OAuth URL for redirecting to Google's consent screen
   */
  getGoogleAuthUrl(): string {
    return `${this.apiUrl}/google`;
  }

  /**
   * Exchange Google OAuth code for session and user profile
   */
  async handleGoogleCallback(code: string): Promise<AuthResult> {
    const response = await fetch(`${this.apiUrl}/google/callback?code=${encodeURIComponent(code)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to authenticate with Google');
    }

    return response.json();
  }

  /**
   * Send a magic link to the provided email address
   */
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.apiUrl}/magic-link/send`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send magic link');
    }

    return response.json();
  }

  /**
   * Verify the magic link token
   */
  async verifyMagicLink(token: string): Promise<AuthResult> {
    const response = await fetch(`${this.apiUrl}/magic-link/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify magic link');
    }

    return response.json();
  }

  /**
   * Send OTP to the provided phone number
   */
  async sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; verificationId: string }> {
    const response = await fetch(`${this.apiUrl}/phone-otp/send`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send OTP');
    }

    return response.json();
  }

  /**
   * Verify phone OTP and authenticate user
   */
  async verifyPhoneOtp(phoneNumber: string, otpCode: string, verificationId: string): Promise<AuthResult> {
    const response = await fetch(`${this.apiUrl}/phone-otp/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otpCode, verificationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify OTP');
    }

    return response.json();
  }

  /**
   * Initiate identity linking by sending OTP to phone number
   */
  async initiateIdentityLink(phoneNumber: string): Promise<{ success: boolean; verificationId: string }> {
    const response = await fetch(`${this.apiUrl}/identity-link`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initiate identity link');
    }

    return response.json();
  }

  /**
   * Complete identity linking with OTP verification
   */
  async completeIdentityLink(
    phoneNumber: string,
    otpCode: string,
    verificationId: string,
  ): Promise<IdentityLinkResult> {
    const response = await fetch(`${this.apiUrl}/identity-link`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otpCode, verificationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete identity link');
    }

    return response.json();
  }

  /**
   * Get the current user session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const response = await fetch(`${this.apiUrl}/session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.session || null;
    } catch {
      return null;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/session`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthResult> {
    const response = await fetch(`${this.apiUrl}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refresh session');
    }

    return response.json();
  }
}

// Export singleton instance
export const authClient = new AuthClientImpl();
export default authClient;

// Export class for testing
export { AuthClientImpl };
