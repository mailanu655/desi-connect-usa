/**
 * Redis-backed Session Manager
 *
 * Production-ready session persistence using Redis.
 * Drop-in replacement for the in-memory SessionManager.
 * Uses the same ConversationSession type but stores in Redis with TTL.
 *
 * Features:
 *  - Automatic TTL-based expiry (handled by Redis, no polling needed)
 *  - JSON serialization/deserialization
 *  - Key prefix namespacing to avoid collisions
 *  - Graceful fallback on Redis connection errors
 *  - Connection health checks
 */

import type {
  ConversationSession,
  SessionStep,
  BotIntent,
} from '@desi-connect/shared';

// ── Types ───────────────────────────────────────────────────

export interface RedisSessionManagerConfig {
  /** Session TTL in seconds (default: 1800 = 30 minutes) */
  sessionTtlSec: number;
  /** Redis key prefix (default: 'desi:session:') */
  keyPrefix: string;
}

/**
 * Minimal Redis client interface — compatible with ioredis and node-redis.
 * Inject your Redis client via the constructor.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string | string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  ping(): Promise<string>;
}

const DEFAULT_CONFIG: RedisSessionManagerConfig = {
  sessionTtlSec: 30 * 60, // 30 minutes
  keyPrefix: 'desi:session:',
};

// ── Implementation ──────────────────────────────────────────

export class RedisSessionManager {
  private readonly redis: RedisClient;
  private readonly config: RedisSessionManagerConfig;

  constructor(redis: RedisClient, config: Partial<RedisSessionManagerConfig> = {}) {
    this.redis = redis;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private key(userPhone: string): string {
    return `${this.config.keyPrefix}${userPhone}`;
  }

  /**
   * No-op for Redis — TTL is handled natively.
   * Kept for API compatibility with in-memory SessionManager.
   */
  startCleanup(): void {
    // Redis handles expiry via TTL — no polling needed
  }

  /**
   * No-op for Redis — no timer to stop.
   */
  stopCleanup(): void {
    // Nothing to stop
  }

  /**
   * Get an active session for a phone number, or null if none/expired.
   */
  async getSession(userPhone: string): Promise<ConversationSession | null> {
    try {
      const raw = await this.redis.get(this.key(userPhone));
      if (!raw) return null;

      const session: ConversationSession = JSON.parse(raw);

      // Double-check expiry (Redis TTL should handle this, but be safe)
      if (new Date(session.expires_at) <= new Date()) {
        await this.redis.del(this.key(userPhone));
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  /**
   * Create a new session for a user phone number.
   */
  async createSession(
    userPhone: string,
    intent: BotIntent,
    initialStep: SessionStep = 'idle',
  ): Promise<ConversationSession> {
    const now = new Date();
    const session: ConversationSession = {
      session_id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_phone: userPhone,
      user_id: null,
      current_step: initialStep,
      intent,
      data: {},
      last_activity: now.toISOString(),
      expires_at: new Date(now.getTime() + this.config.sessionTtlSec * 1000).toISOString(),
    };

    await this.redis.set(
      this.key(userPhone),
      JSON.stringify(session),
      'EX',
      this.config.sessionTtlSec,
    );

    return session;
  }

  /**
   * Update session step, data, and refresh expiry.
   */
  async updateSession(
    userPhone: string,
    updates: {
      step?: SessionStep;
      data?: Record<string, unknown>;
      userId?: string;
    },
  ): Promise<ConversationSession | null> {
    const session = await this.getSession(userPhone);
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
      now.getTime() + this.config.sessionTtlSec * 1000,
    ).toISOString();

    await this.redis.set(
      this.key(userPhone),
      JSON.stringify(session),
      'EX',
      this.config.sessionTtlSec,
    );

    return session;
  }

  /**
   * End a session.
   */
  async endSession(userPhone: string): Promise<void> {
    await this.redis.del(this.key(userPhone));
  }

  /**
   * Check if a user has an active session in a multi-step flow.
   */
  async isInFlow(userPhone: string): Promise<boolean> {
    const session = await this.getSession(userPhone);
    return session !== null && session.current_step !== 'idle';
  }

  /**
   * Get count of active sessions (approximate — uses KEYS scan).
   */
  async getActiveSessionCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
      return keys.length;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all sessions under this prefix (for testing).
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch {
      // Swallow errors on clear
    }
  }

  /**
   * Health check — ping Redis.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
