/**
 * Session Manager (Section 7.2 - Bot Architecture)
 *
 * Tracks conversation state for multi-step flows (business submission,
 * deal posting, consultancy rating). Uses in-memory store with TTL-based
 * expiry. Can be swapped to Redis for production.
 */

import type {
  ConversationSession,
  SessionStep,
  BotIntent,
} from '@desi-connect/shared';

export interface SessionManagerConfig {
  /** Session TTL in milliseconds (default: 30 minutes) */
  sessionTtlMs: number;
  /** Cleanup interval in milliseconds (default: 5 minutes) */
  cleanupIntervalMs: number;
}

const DEFAULT_CONFIG: SessionManagerConfig = {
  sessionTtlMs: 30 * 60 * 1000,       // 30 minutes
  cleanupIntervalMs: 5 * 60 * 1000,   // 5 minutes
};

export class SessionManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: SessionManagerConfig;

  constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start periodic cleanup of expired sessions.
   * Call this once during application bootstrap.
   */
  startCleanup(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.purgeExpired();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup timer. Call on shutdown.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get an active session for a phone number, or null if none/expired.
   */
  getSession(userPhone: string): ConversationSession | null {
    const session = this.sessions.get(userPhone);
    if (!session) return null;

    if (new Date(session.expires_at) <= new Date()) {
      this.sessions.delete(userPhone);
      return null;
    }

    return session;
  }

  /**
   * Create a new session for a user phone number.
   * Overwrites any existing session for this phone.
   */
  createSession(
    userPhone: string,
    intent: BotIntent,
    initialStep: SessionStep = 'idle',
  ): ConversationSession {
    const now = new Date();
    const session: ConversationSession = {
      session_id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_phone: userPhone,
      user_id: null,
      current_step: initialStep,
      intent,
      data: {},
      last_activity: now.toISOString(),
      expires_at: new Date(now.getTime() + this.config.sessionTtlMs).toISOString(),
    };

    this.sessions.set(userPhone, session);
    return session;
  }

  /**
   * Update session step, data, and refresh expiry.
   */
  updateSession(
    userPhone: string,
    updates: {
      step?: SessionStep;
      data?: Record<string, unknown>;
      userId?: string;
    },
  ): ConversationSession | null {
    const session = this.getSession(userPhone);
    if (!session) return null;

    const now = new Date();

    if (updates.step !== undefined) {
      session.current_step = updates.step;
    }
    if (updates.data !== undefined) {
      session.data = { ...session.data, ...updates.data };
    }
    if (updates.userId !== undefined) {
      session.user_id = updates.userId;
    }

    session.last_activity = now.toISOString();
    session.expires_at = new Date(
      now.getTime() + this.config.sessionTtlMs,
    ).toISOString();

    this.sessions.set(userPhone, session);
    return session;
  }

  /**
   * End a session (e.g., after a flow is completed or cancelled).
   */
  endSession(userPhone: string): void {
    this.sessions.delete(userPhone);
  }

  /**
   * Check if a user has an active session in a multi-step flow
   * (current_step is not 'idle').
   */
  isInFlow(userPhone: string): boolean {
    const session = this.getSession(userPhone);
    return session !== null && session.current_step !== 'idle';
  }

  /**
   * Get count of active sessions (for monitoring/metrics).
   */
  getActiveSessionCount(): number {
    this.purgeExpired();
    return this.sessions.size;
  }

  /**
   * Remove all expired sessions.
   */
  private purgeExpired(): void {
    const now = new Date();
    for (const [phone, session] of this.sessions) {
      if (new Date(session.expires_at) <= now) {
        this.sessions.delete(phone);
      }
    }
  }

  /**
   * Clear all sessions (for testing).
   */
  clearAll(): void {
    this.sessions.clear();
  }
}
