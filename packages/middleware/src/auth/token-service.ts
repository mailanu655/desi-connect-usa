/**
 * Token Service (Section 5.1 - Authentication)
 *
 * Manages JWT token generation and verification for authentication flows.
 * Handles access tokens, refresh tokens, and magic link tokens.
 * Uses injected JWT library interface for testability.
 */

import type { AuthSession } from '@desi-connect/shared';
import { randomUUID } from 'crypto';

/**
 * Configuration for token generation and verification
 */
export interface TokenServiceConfig {
  jwtSecret: string;
  accessTokenExpiry: string;   // e.g., '1h'
  refreshTokenExpiry: string;  // e.g., '7d'
  magicLinkExpiry: string;     // e.g., '15m'
}

/**
 * JWT library interface - to be injected for testability
 */
export interface JwtProvider {
  sign(payload: Record<string, unknown>, options: { expiresIn: string }): string;
  verify(token: string): Record<string, unknown>;
}

/**
 * Manages JWT token lifecycle for authentication
 */
export class TokenService {
  private readonly config: TokenServiceConfig;
  private readonly jwtProvider: JwtProvider;

  constructor(config: TokenServiceConfig, jwtProvider: JwtProvider) {
    this.config = config;
    this.jwtProvider = jwtProvider;
  }

  /**
   * Generate an access token (short-lived, ~1 hour)
   * Used for authenticated API requests
   */
  generateAccessToken(userId: string): string {
    const payload: Record<string, unknown> = {
      userId,
      type: 'access',
    };

    return this.jwtProvider.sign(payload, {
      expiresIn: this.config.accessTokenExpiry,
    });
  }

  /**
   * Generate a refresh token (long-lived, ~7 days)
   * Used to obtain new access tokens without re-authentication
   */
  generateRefreshToken(userId: string): string {
    const payload: Record<string, unknown> = {
      userId,
      type: 'refresh',
    };

    return this.jwtProvider.sign(payload, {
      expiresIn: this.config.refreshTokenExpiry,
    });
  }

  /**
   * Generate a magic link token (short-lived, ~15 minutes)
   * Used for email verification
   */
  generateMagicLinkToken(email: string): string {
    const payload: Record<string, unknown> = {
      email,
      type: 'magic_link',
    };

    return this.jwtProvider.sign(payload, {
      expiresIn: this.config.magicLinkExpiry,
    });
  }

  /**
   * Verify an access token and extract userId
   * Returns null if token is invalid or expired
   */
  verifyAccessToken(token: string): { userId: string } | null {
    try {
      const decoded = this.jwtProvider.verify(token);
      if (decoded.type !== 'access') {
        return null;
      }
      const userId = decoded.userId as string;
      return userId ? { userId } : null;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }

  /**
   * Verify a refresh token and extract userId
   * Returns null if token is invalid or expired
   */
  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = this.jwtProvider.verify(token);
      if (decoded.type !== 'refresh') {
        return null;
      }
      const userId = decoded.userId as string;
      return userId ? { userId } : null;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }

  /**
   * Verify a magic link token and extract email
   * Returns null if token is invalid or expired
   */
  verifyMagicLinkToken(token: string): { email: string } | null {
    try {
      const decoded = this.jwtProvider.verify(token);
      if (decoded.type !== 'magic_link') {
        return null;
      }
      const email = decoded.email as string;
      return email ? { email } : null;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }

  /**
   * Create a new authenticated session with tokens
   * Generates both access and refresh tokens
   */
  createSession(userId: string): AuthSession {
    const now = new Date();
    const accessTokenExpiry = this.parseExpiry(this.config.accessTokenExpiry);

    return {
      session_id: randomUUID(),
      user_id: userId,
      access_token: this.generateAccessToken(userId),
      refresh_token: this.generateRefreshToken(userId),
      expires_at: new Date(now.getTime() + accessTokenExpiry).toISOString(),
      created_at: now.toISOString(),
    };
  }

  /**
   * Parse expiry string (e.g., '1h', '7d') and return milliseconds
   * Used to calculate session expiry time
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}
