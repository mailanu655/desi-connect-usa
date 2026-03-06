/**
 * Authentication Service (Section 5.1 - Authentication)
 *
 * Central orchestrator for all authentication flows:
 * - Google OAuth
 * - Email Magic Link
 * - Phone OTP
 * - Identity Linking (merge WhatsApp + Website accounts)
 * - Session Management
 *
 * Coordinates with UserRepository, TokenService, OtpService, and EmailService.
 */

import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserProfile,
  AuthSession,
  GoogleOAuthPayload,
  AuthResult,
  IdentityLinkResult,
} from '@desi-connect/shared';
import type { UserRepository } from '@desi-connect/database';
import { TokenService } from './token-service';
import { OtpService } from './otp-service';
import { EmailService } from './email-service';

/**
 * Dependencies required by AuthService
 */
export interface AuthServiceDeps {
  userRepository: UserRepository;
  tokenService: TokenService;
  otpService: OtpService;
  emailService: EmailService;
}

/**
 * Central authentication service orchestrating all auth flows
 */
export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly tokenService: TokenService;
  private readonly otpService: OtpService;
  private readonly emailService: EmailService;

  constructor(deps: AuthServiceDeps) {
    this.userRepository = deps.userRepository;
    this.tokenService = deps.tokenService;
    this.otpService = deps.otpService;
    this.emailService = deps.emailService;
  }

  // ─────────────────────────────────────────────────────────────
  // Google OAuth Flow
  // ─────────────────────────────────────────────────────────────

  /**
   * Authenticate user via Google OAuth
   * - Look up user by email
   * - If exists, update auth_provider and create session
   * - If new, create user with auth_provider: 'google' and create session
   *
   * @param payload - Google OAuth payload with email, name, and picture
   * @returns AuthResult with user profile and session
   */
  async authenticateWithGoogle(payload: GoogleOAuthPayload): Promise<AuthResult> {
    try {
      // Look up user by email
      const existingUser = await this.userRepository.list({
        filter: { email: payload.email },
      });

      let user: User;

      if (existingUser.data.length > 0) {
        // User exists - update auth provider
        user = existingUser.data[0];
        if (user.auth_provider !== 'google') {
          await this.userRepository.update(user.user_id, {
            auth_provider: 'google',
          } as Record<string, unknown>);
          user.auth_provider = 'google';
        }
      } else {
        // Create new user
        const createInput: CreateUserInput = {
          email: payload.email,
          display_name: payload.name,
          created_via: 'website',
          auth_provider: 'google',
        };

        user = await this.userRepository.create(createInput);
      }

      // Generate session tokens
      const session = this.tokenService.createSession(user.user_id);

      return {
        success: true,
        user: this.userToProfile(user),
        session,
        is_new_user: existingUser.data.length === 0,
      };
    } catch (error: any) {
      console.error('Google OAuth authentication error:', error);
      return {
        success: false,
        error: 'Failed to authenticate with Google',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Email Magic Link Flow
  // ─────────────────────────────────────────────────────────────

  /**
   * Send magic link email for passwordless authentication
   * - Generate secure token with 15-minute expiry
   * - Store token via tokenService
   * - Send email via emailService
   *
   * @param email - User's email address
   * @returns Success status and message
   */
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate magic link token (15 min expiry)
      const token = this.tokenService.generateMagicLinkToken(email);

      // Send email with magic link
      const emailResult = await this.emailService.sendMagicLink(email, token);

      if (emailResult.success) {
        return {
          success: true,
          message: 'Magic link sent to your email. Check your inbox!',
        };
      } else {
        return {
          success: false,
          message: 'Failed to send magic link. Please try again.',
        };
      }
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      return {
        success: false,
        message: 'An error occurred while sending the magic link.',
      };
    }
  }

  /**
   * Verify magic link token and authenticate user
   * - Validate token via tokenService
   * - Find or create user
   * - Generate session tokens
   *
   * @param email - User's email address
   * @param token - Magic link token
   * @returns AuthResult with user profile and session
   */
  async verifyMagicLink(email: string, token: string): Promise<AuthResult> {
    try {
      // Verify token
      const verified = this.tokenService.verifyMagicLinkToken(token);
      if (!verified || verified.email !== email) {
        return {
          success: false,
          error: 'Invalid or expired magic link',
        };
      }

      // Find user by email
      const existingUsers = await this.userRepository.list({
        filter: { email },
      });

      let user: User;
      let isNewUser = false;

      if (existingUsers.data.length > 0) {
        user = existingUsers.data[0];
      } else {
        // Create new user
        const createInput: CreateUserInput = {
          email,
          display_name: email.split('@')[0],
          created_via: 'website',
          auth_provider: 'email_magic_link',
        };

        user = await this.userRepository.create(createInput);
        isNewUser = true;

        // Send welcome email
        await this.emailService.sendWelcomeEmail(email, user.display_name);
      }

      // Generate session tokens
      const session = this.tokenService.createSession(user.user_id);

      return {
        success: true,
        user: this.userToProfile(user),
        session,
        is_new_user: isNewUser,
      };
    } catch (error: any) {
      console.error('Error verifying magic link:', error);
      return {
        success: false,
        error: 'Failed to verify magic link',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Phone OTP Flow
  // ─────────────────────────────────────────────────────────────

  /**
   * Send OTP to phone number via Twilio Verify
   * Phone number should be in E.164 format (e.g., +14155552671)
   *
   * @param phoneNumber - Phone number in E.164 format
   * @returns Object with verification ID and success status
   */
  async sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; verificationId: string }> {
    try {
      // Validate phone format
      if (!this.otpService.validatePhoneFormat(phoneNumber)) {
        return {
          success: false,
          verificationId: '',
        };
      }

      // Send OTP
      const result = await this.otpService.sendOtp(phoneNumber);
      return result;
    } catch (error: any) {
      console.error('Error sending phone OTP:', error);
      return {
        success: false,
        verificationId: '',
      };
    }
  }

  /**
   * Verify phone OTP and authenticate user
   * - Verify OTP via otpService
   * - Find or create user
   * - Generate session tokens
   *
   * @param phoneNumber - Phone number in E.164 format
   * @param otpCode - 6-digit OTP code
   * @param verificationId - Verification SID from sendPhoneOtp
   * @returns AuthResult with user profile and session
   */
  async verifyPhoneOtp(
    phoneNumber: string,
    otpCode: string,
    verificationId: string,
  ): Promise<AuthResult> {
    try {
      // Verify OTP
      const otpResult = await this.otpService.verifyOtp(phoneNumber, otpCode, verificationId);

      if (!otpResult.valid) {
        return {
          success: false,
          error: 'Invalid OTP code',
        };
      }

      // Find user by phone
      const existingUsers = await this.userRepository.list({
        filter: { phone_number: phoneNumber },
      });

      let user: User;
      let isNewUser = false;

      if (existingUsers.data.length > 0) {
        user = existingUsers.data[0];
      } else {
        // Create new user (WhatsApp user)
        const createInput: CreateUserInput = {
          phone_number: phoneNumber,
          display_name: phoneNumber,
          preferred_channel: 'whatsapp',
          created_via: 'whatsapp',
          auth_provider: 'phone_otp',
        };

        user = await this.userRepository.create(createInput);
        isNewUser = true;
      }

      // Generate session tokens
      const session = this.tokenService.createSession(user.user_id);

      return {
        success: true,
        user: this.userToProfile(user),
        session,
        is_new_user: isNewUser,
      };
    } catch (error: any) {
      console.error('Error verifying phone OTP:', error);
      return {
        success: false,
        error: 'Failed to verify phone OTP',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Identity Linking Flow (WhatsApp + Website Account Merge)
  // ─────────────────────────────────────────────────────────────

  /**
   * Initiate identity linking by sending OTP to phone
   * Used when user wants to merge WhatsApp and website accounts
   *
   * @param userId - User ID of website account
   * @param phoneNumber - Phone number to link (WhatsApp account)
   * @returns Object with verification ID and success status
   */
  async initiateIdentityLink(
    userId: string,
    phoneNumber: string,
  ): Promise<{ success: boolean; verificationId: string }> {
    try {
      // Verify user exists
      const user = await this.userRepository.getById(userId);
      if (!user) {
        return {
          success: false,
          verificationId: '',
        };
      }

      // Validate phone format
      if (!this.otpService.validatePhoneFormat(phoneNumber)) {
        return {
          success: false,
          verificationId: '',
        };
      }

      // Send OTP to phone
      const result = await this.otpService.sendOtp(phoneNumber);
      return result;
    } catch (error: any) {
      console.error('Error initiating identity link:', error);
      return {
        success: false,
        verificationId: '',
      };
    }
  }

  /**
   * Complete identity linking after OTP verification
   * - Verify OTP
   * - Find WhatsApp user by phone
   * - Merge accounts: add email to WhatsApp record, set identity_linked = true
   * - If no WhatsApp user found, just add phone to website user
   *
   * @param userId - User ID of website account
   * @param phoneNumber - Phone number (WhatsApp account)
   * @param otpCode - 6-digit OTP code
   * @param verificationId - Verification SID from initiateIdentityLink
   * @returns IdentityLinkResult with merge status
   */
  async completeIdentityLink(
    userId: string,
    phoneNumber: string,
    otpCode: string,
    verificationId: string,
  ): Promise<IdentityLinkResult> {
    try {
      // Verify website user exists
      const websiteUser = await this.userRepository.getById(userId);
      if (!websiteUser) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify OTP
      const otpResult = await this.otpService.verifyOtp(phoneNumber, otpCode, verificationId);
      if (!otpResult.valid) {
        return {
          success: false,
          message: 'Invalid OTP code',
        };
      }

      // Find WhatsApp user by phone
      const existingPhoneUsers = await this.userRepository.list({
        filter: { phone_number: phoneNumber },
      });

      if (existingPhoneUsers.data.length > 0) {
        // WhatsApp user exists - merge accounts
        const whatsappUser = existingPhoneUsers.data[0];

        // Update WhatsApp user with website email and set identity_linked
        const updateInput: UpdateUserInput = {
          email: websiteUser.email ?? undefined,
          identity_linked: true,
        };

        const mergedUser = await this.userRepository.update(whatsappUser.user_id, updateInput as Record<string, unknown>);

        // Also update website user to mark identity_linked
        await this.userRepository.update(userId, {
          identity_linked: true,
          phone_number: phoneNumber,
        } as Record<string, unknown>);

        // Send confirmation email
        if (websiteUser.email) {
          await this.emailService.sendIdentityLinkConfirmation(websiteUser.email, phoneNumber);
        }

        return {
          success: true,
          message: 'Accounts successfully merged',
          user: this.userToProfile(mergedUser),
        };
      } else {
        // No WhatsApp user found - just add phone to website user
        const updatedUser = await this.userRepository.update(userId, {
          phone_number: phoneNumber,
          identity_linked: true,
        } as Record<string, unknown>);

        // Send confirmation email
        if (websiteUser.email) {
          await this.emailService.sendIdentityLinkConfirmation(websiteUser.email, phoneNumber);
        }

        return {
          success: true,
          message: 'Phone number linked to your account',
          user: this.userToProfile(updatedUser),
        };
      }
    } catch (error: any) {
      console.error('Error completing identity link:', error);
      return {
        success: false,
        message: 'Failed to link identity',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────────

  /**
   * Refresh an access token using a refresh token
   * Used when access token expires
   *
   * @param refreshToken - Valid refresh token
   * @returns AuthResult with new session
   */
  async refreshSession(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const verified = this.tokenService.verifyRefreshToken(refreshToken);
      if (!verified) {
        return {
          success: false,
          error: 'Invalid or expired refresh token',
        };
      }

      const userId = verified.userId;

      // Verify user still exists
      const user = await this.userRepository.getById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Create new session with fresh tokens
      const session = this.tokenService.createSession(userId);

      return {
        success: true,
        user: this.userToProfile(user),
        session,
      };
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      return {
        success: false,
        error: 'Failed to refresh session',
      };
    }
  }

  /**
   * Logout user by invalidating session
   * In production, could also blacklist the token
   *
   * @param sessionId - Session ID to invalidate
   * @returns void
   */
  async logout(sessionId: string): Promise<void> {
    try {
      // In a simple implementation, sessions are stored in JWT which
      // are stateless. In production, you might want to:
      // 1. Store a blacklist of invalidated tokens in Redis
      // 2. Track logout events for audit logs
      console.log(`User logged out: session ${sessionId}`);
    } catch (error: any) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Get current session information
   * Used to validate and retrieve active session data
   *
   * @param accessToken - Access token to validate
   * @returns AuthSession or null if invalid
   */
  async getSession(accessToken: string): Promise<AuthSession | null> {
    try {
      const verified = this.tokenService.verifyAccessToken(accessToken);
      if (!verified) {
        return null;
      }

      // In a production system, you would fetch session details from a store
      // For now, we can only verify the token is valid
      const user = await this.userRepository.getById(verified.userId);
      if (!user) {
        return null;
      }

      // Return minimal session info (full session would need to be stored)
      return {
        session_id: 'unknown', // Would need session store to retrieve this
        user_id: verified.userId,
        access_token: accessToken,
        expires_at: 'unknown', // Would need session store to retrieve this
        created_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Convert User to UserProfile
   */
  private userToProfile(user: User): UserProfile {
    return {
      user_id: user.user_id,
      phone_number: user.phone_number,
      email: user.email,
      display_name: user.display_name,
      identity_linked: user.identity_linked,
      preferred_channel: user.preferred_channel,
      city: user.city ?? undefined,
      created_via: user.created_via,
      auth_provider: user.auth_provider,
      is_verified: !!user.email || !!user.phone_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
