import { RedisSessionManager } from '../../../src/session/redis-session-manager';
import type { RedisClient } from '../../../src/session/redis-session-manager';

// ── Mock Redis Client ────────────────────────────────────────

function createMockRedis(): jest.Mocked<RedisClient> {
  const store = new Map<string, string>();

  return {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key: string | string[]) => {
      const keys = Array.isArray(key) ? key : [key];
      let count = 0;
      keys.forEach((k) => { if (store.delete(k)) count++; });
      return count;
    }),
    keys: jest.fn(async (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return Array.from(store.keys()).filter((k) => k.startsWith(prefix));
    }),
    ping: jest.fn(async () => 'PONG'),
  };
}

// ── Tests ────────────────────────────────────────────────────

describe('RedisSessionManager', () => {
  let redis: jest.Mocked<RedisClient>;
  let manager: RedisSessionManager;

  beforeEach(() => {
    redis = createMockRedis();
    manager = new RedisSessionManager(redis, {
      sessionTtlSec: 1800,
      keyPrefix: 'test:session:',
    });
  });

  describe('createSession', () => {
    it('should create a session and store in Redis', async () => {
      const session = await manager.createSession('+14155551234', 'search_businesses');

      expect(session.user_phone).toBe('+14155551234');
      expect(session.intent).toBe('search_businesses');
      expect(session.current_step).toBe('idle');
      expect(session.session_id).toMatch(/^sess_\d+_[a-z0-9]+$/);
      expect(session.data).toEqual({});
      expect(session.user_id).toBeNull();
    });

    it('should call redis.set with EX flag and correct TTL', async () => {
      await manager.createSession('+14155551234', 'job_search');

      expect(redis.set).toHaveBeenCalledWith(
        'test:session:+14155551234',
        expect.any(String),
        'EX',
        1800,
      );
    });

    it('should accept initial step parameter', async () => {
      const session = await manager.createSession('+14155551234', 'submit_business', 'collecting_business_name');

      expect(session.current_step).toBe('collecting_business_name');
    });
  });

  describe('getSession', () => {
    it('should return null for non-existent session', async () => {
      const session = await manager.getSession('+14155559999');
      expect(session).toBeNull();
    });

    it('should return the session after creation', async () => {
      await manager.createSession('+14155551234', 'help_onboarding');
      const session = await manager.getSession('+14155551234');

      expect(session).not.toBeNull();
      expect(session!.intent).toBe('help_onboarding');
    });

    it('should return null for expired session', async () => {
      // Create a session, then manually set it as expired in Redis
      const expiredSession = {
        session_id: 'sess_old',
        user_phone: '+14155551234',
        user_id: null,
        current_step: 'idle',
        intent: 'unknown',
        data: {},
        last_activity: new Date(Date.now() - 60_000).toISOString(),
        expires_at: new Date(Date.now() - 1000).toISOString(), // already expired
      };
      redis.get.mockResolvedValueOnce(JSON.stringify(expiredSession));

      const session = await manager.getSession('+14155551234');
      expect(session).toBeNull();
    });

    it('should return null on Redis error', async () => {
      redis.get.mockRejectedValueOnce(new Error('Connection refused'));
      const session = await manager.getSession('+14155551234');
      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session step', async () => {
      await manager.createSession('+14155551234', 'submit_business');
      const updated = await manager.updateSession('+14155551234', {
        step: 'collecting_business_name',
      });

      expect(updated).not.toBeNull();
      expect(updated!.current_step).toBe('collecting_business_name');
    });

    it('should merge data into existing session data', async () => {
      await manager.createSession('+14155551234', 'search_businesses');
      await manager.updateSession('+14155551234', {
        data: { location: 'Edison' },
      });
      const updated = await manager.updateSession('+14155551234', {
        data: { category: 'restaurant' },
      });

      expect(updated!.data).toEqual({ location: 'Edison', category: 'restaurant' });
    });

    it('should update user ID', async () => {
      await manager.createSession('+14155551234', 'help_onboarding');
      const updated = await manager.updateSession('+14155551234', {
        userId: 'user_42',
      });

      expect(updated!.user_id).toBe('user_42');
    });

    it('should refresh session expiry on update', async () => {
      await manager.createSession('+14155551234', 'unknown');
      const first = await manager.getSession('+14155551234');

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));

      const updated = await manager.updateSession('+14155551234', { step: 'idle' });

      expect(new Date(updated!.last_activity).getTime()).toBeGreaterThanOrEqual(
        new Date(first!.last_activity).getTime(),
      );
    });

    it('should return null when session does not exist', async () => {
      const result = await manager.updateSession('+14155559999', { step: 'idle' });
      expect(result).toBeNull();
    });
  });

  describe('endSession', () => {
    it('should delete the session from Redis', async () => {
      await manager.createSession('+14155551234', 'unknown');
      await manager.endSession('+14155551234');

      expect(redis.del).toHaveBeenCalledWith('test:session:+14155551234');
    });
  });

  describe('isInFlow', () => {
    it('should return false when no session exists', async () => {
      expect(await manager.isInFlow('+14155551234')).toBe(false);
    });

    it('should return false when session is at idle step', async () => {
      await manager.createSession('+14155551234', 'unknown', 'idle');
      expect(await manager.isInFlow('+14155551234')).toBe(false);
    });

    it('should return true when session is in a flow step', async () => {
      await manager.createSession('+14155551234', 'submit_business', 'collecting_business_name');
      expect(await manager.isInFlow('+14155551234')).toBe(true);
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return 0 when no sessions exist', async () => {
      expect(await manager.getActiveSessionCount()).toBe(0);
    });

    it('should return count of active sessions', async () => {
      await manager.createSession('+14155551111', 'unknown');
      await manager.createSession('+14155552222', 'job_search');
      await manager.createSession('+14155553333', 'help_onboarding');

      expect(await manager.getActiveSessionCount()).toBe(3);
    });

    it('should return 0 on Redis error', async () => {
      redis.keys.mockRejectedValueOnce(new Error('Connection lost'));
      expect(await manager.getActiveSessionCount()).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should delete all sessions under the prefix', async () => {
      await manager.createSession('+14155551111', 'unknown');
      await manager.createSession('+14155552222', 'unknown');

      await manager.clearAll();

      expect(redis.del).toHaveBeenCalled();
    });

    it('should not throw on Redis error', async () => {
      redis.keys.mockRejectedValueOnce(new Error('Connection lost'));
      await expect(manager.clearAll()).resolves.not.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return true when Redis responds PONG', async () => {
      expect(await manager.healthCheck()).toBe(true);
    });

    it('should return false when Redis is down', async () => {
      redis.ping.mockRejectedValueOnce(new Error('Connection refused'));
      expect(await manager.healthCheck()).toBe(false);
    });

    it('should return false when Redis returns unexpected value', async () => {
      redis.ping.mockResolvedValueOnce('NOT_PONG');
      expect(await manager.healthCheck()).toBe(false);
    });
  });

  describe('startCleanup / stopCleanup', () => {
    it('should be no-ops for Redis (TTL-based expiry)', () => {
      // These should not throw
      manager.startCleanup();
      manager.stopCleanup();
    });
  });

  describe('default config', () => {
    it('should use default prefix and TTL when not specified', async () => {
      const defaultManager = new RedisSessionManager(redis);
      await defaultManager.createSession('+14155551234', 'unknown');

      expect(redis.set).toHaveBeenCalledWith(
        'desi:session:+14155551234',
        expect.any(String),
        'EX',
        1800,
      );
    });
  });
});
