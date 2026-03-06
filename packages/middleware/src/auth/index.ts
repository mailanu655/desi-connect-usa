/**
 * Authentication Module Exports
 *
 * Central entry point for all authentication services:
 * - AuthService: Main orchestrator for auth flows
 * - TokenService: JWT token management
 * - OtpService: Phone OTP via Twilio
 * - EmailService: Email sending for magic links
 */

export { AuthService } from './auth-service';
export type { AuthServiceDeps } from './auth-service';

export { TokenService } from './token-service';
export type { TokenServiceConfig, JwtProvider } from './token-service';

export { OtpService } from './otp-service';
export type { OtpServiceConfig, TwilioVerifyClient } from './otp-service';

export { EmailService } from './email-service';
export type { EmailServiceConfig, HttpClient } from './email-service';

// ── WhatsApp Auth Linking ────────────────────────────────
export { WhatsAppAuthLinker, InMemoryLinkStore } from './whatsapp-auth-linker';
export type {
  AuthLinkerConfig,
  PendingLink,
  LinkResult,
  LinkStore,
  UserLookup,
} from './whatsapp-auth-linker';
