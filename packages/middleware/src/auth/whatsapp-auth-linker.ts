/**
 * WhatsApp Auth Linker
 *
 * Links WhatsApp phone numbers to platform user accounts.
 * Sends a 6-digit OTP via WhatsApp, user replies with the code,
 * and the system verifies and binds the phone to the user_id.
 *
 * Features:
 *  - OTP generation and expiry
 *  - Rate limiting (max 3 attempts per phone per 15 minutes)
 *  - Configurable TTL and code length
 *  - Pluggable storage via LinkStore interface
 */

// ── Types ───────────────────────────────────────────────────

export interface AuthLinkerConfig {
  /** OTP code length (default: 6) */
  codeLength?: number;
  /** OTP TTL in seconds (default: 300 = 5 minutes) */
  otpTtlSec?: number;
  /** Max verification attempts before lockout (default: 3) */
  maxAttempts?: number;
  /** Lockout duration in seconds (default: 900 = 15 minutes) */
  lockoutSec?: number;
}

export interface PendingLink {
  phone: string;
  userId: string;
  code: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
}

export interface LinkResult {
  success: boolean;
  error?: 'expired' | 'invalid_code' | 'max_attempts' | 'not_found';
  userId?: string;
}

/**
 * Storage interface for pending links.
 * Can be backed by in-memory Map, Redis, or a database.
 */
export interface LinkStore {
  get(phone: string): Promise<PendingLink | null>;
  set(phone: string, link: PendingLink, ttlSec: number): Promise<void>;
  delete(phone: string): Promise<void>;
}

/**
 * User lookup interface — resolve userId from email or platform identifier.
 */
export interface UserLookup {
  findByEmail(email: string): Promise<{ id: string; name?: string } | null>;
  findByPhone(phone: string): Promise<{ id: string; name?: string } | null>;
  linkPhone(userId: string, phone: string): Promise<void>;
}

// ── Constants ───────────────────────────────────────────────

const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_OTP_TTL_SEC = 300;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_LOCKOUT_SEC = 900;

// ── In-Memory Store ─────────────────────────────────────────

export class InMemoryLinkStore implements LinkStore {
  private store = new Map<string, PendingLink>();

  async get(phone: string): Promise<PendingLink | null> {
    const link = this.store.get(phone);
    if (!link) return null;
    if (new Date(link.expiresAt) <= new Date()) {
      this.store.delete(phone);
      return null;
    }
    return link;
  }

  async set(phone: string, link: PendingLink): Promise<void> {
    this.store.set(phone, link);
  }

  async delete(phone: string): Promise<void> {
    this.store.delete(phone);
  }

  clear(): void {
    this.store.clear();
  }
}

// ── Auth Linker ─────────────────────────────────────────────

export class WhatsAppAuthLinker {
  private readonly store: LinkStore;
  private readonly config: Required<AuthLinkerConfig>;

  constructor(store: LinkStore, config: AuthLinkerConfig = {}) {
    this.store = store;
    this.config = {
      codeLength: config.codeLength ?? DEFAULT_CODE_LENGTH,
      otpTtlSec: config.otpTtlSec ?? DEFAULT_OTP_TTL_SEC,
      maxAttempts: config.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      lockoutSec: config.lockoutSec ?? DEFAULT_LOCKOUT_SEC,
    };
  }

  /**
   * Initiate a phone-to-account linking flow.
   * Generates a 6-digit OTP and stores it.
   * Returns the code to be sent to the user via WhatsApp.
   */
  async initiateLinking(phone: string, userId: string): Promise<{ code: string }> {
    // Check for existing pending link (rate limiting)
    const existing = await this.store.get(phone);
    if (existing && existing.attempts >= this.config.maxAttempts) {
      const lockoutExpiry = new Date(
        new Date(existing.createdAt).getTime() + this.config.lockoutSec * 1000,
      );
      if (lockoutExpiry > new Date()) {
        throw new Error('Too many verification attempts. Please try again later.');
      }
    }

    const code = this.generateCode();
    const now = new Date();

    const pending: PendingLink = {
      phone,
      userId,
      code,
      attempts: 0,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.config.otpTtlSec * 1000).toISOString(),
    };

    await this.store.set(phone, pending, this.config.otpTtlSec);

    return { code };
  }

  /**
   * Verify an OTP code submitted by the user.
   */
  async verifyCode(phone: string, submittedCode: string): Promise<LinkResult> {
    const pending = await this.store.get(phone);

    if (!pending) {
      return { success: false, error: 'not_found' };
    }

    // Check expiry
    if (new Date(pending.expiresAt) <= new Date()) {
      await this.store.delete(phone);
      return { success: false, error: 'expired' };
    }

    // Check max attempts
    if (pending.attempts >= this.config.maxAttempts) {
      return { success: false, error: 'max_attempts' };
    }

    // Increment attempts
    pending.attempts += 1;
    await this.store.set(phone, pending, this.config.otpTtlSec);

    // Verify code (constant-time comparison for security)
    if (!this.constantTimeCompare(submittedCode.trim(), pending.code)) {
      if (pending.attempts >= this.config.maxAttempts) {
        return { success: false, error: 'max_attempts' };
      }
      return { success: false, error: 'invalid_code' };
    }

    // Success — clean up
    await this.store.delete(phone);

    return {
      success: true,
      userId: pending.userId,
    };
  }

  /**
   * Cancel a pending linking flow.
   */
  async cancelLinking(phone: string): Promise<void> {
    await this.store.delete(phone);
  }

  /**
   * Check if a phone has a pending link.
   */
  async hasPendingLink(phone: string): Promise<boolean> {
    const link = await this.store.get(phone);
    return link !== null;
  }

  // ── Private ───────────────────────────────────────────────

  private generateCode(): string {
    const digits = this.config.codeLength;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const code = Math.floor(min + Math.random() * (max - min + 1));
    return code.toString();
  }

  /**
   * Constant-time string comparison to prevent timing attacks.
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
