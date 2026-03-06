/**
 * SessionManager Tests
 *
 * Tests for in-memory session management with TTL-based expiry.
 * Covers: createSession, updateSession, endSession, getSession,
 * isInFlow, clearAll, getActiveSessionCount, cleanup behavior.
 */

import { SessionManager } from '@desi-connect/middleware';
import type { ConversationSession, SessionStep } from '@desi-connect/shared';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager({ sessionTtlMs: 30_000, cleanupIntervalMs: 60_000 });
  });

  afterEach(() => {
    manager.stopCleanup();
    manager.clearAll();
  });

  // ── createSession ─────────────────────────────────────────

  describe('createSession', () => {
    it('should create a new session for a phone number', () => {
      const session = manager.createSession('+1234567890', 'submit_business');
      expect(session).toBeDefined();
      expect(session.user_phone).toBe('+1234567890');
      expect(session.intent).toBe('submit_business');
      // Default initialStep is 'idle'
      expect(session.current_step).toBe('idle');
      expect(session.data).toEqual({});
    });

    it('should generate a unique session_id', () => {
      const s1 = manager.createSession('+1111111111', 'submit_business');
      const s2 = manager.createSession('+2222222222', 'submit_deal');
      expect(s1.session_id).not.toBe(s2.session_id);
    });

    it('should set expires_at in the future', () => {
      const session = manager.createSession('+1234567890', 'submit_business');
      const expiresAt = new Date(session.expires_at).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now());
    });

    it('should set last_activity to a recent timestamp', () => {
      const before = new Date().toISOString();
      const session = manager.createSession('+1234567890', 'submit_business');
      const after = new Date().toISOString();
      expect(session.last_activity >= before).toBe(true);
      expect(session.last_activity <= after).toBe(true);
    });

    it('should replace an existing session for the same phone', () => {
      const s1 = manager.createSession('+1234567890', 'submit_business');
      const s2 = manager.createSession('+1234567890', 'submit_deal');
      expect(s2.intent).toBe('submit_deal');
      expect(s2.session_id).not.toBe(s1.session_id);
      expect(manager.getActiveSessionCount()).toBe(1);
    });

    it('should increment active session count', () => {
      expect(manager.getActiveSessionCount()).toBe(0);
      manager.createSession('+1111111111', 'submit_business');
      expect(manager.getActiveSessionCount()).toBe(1);
      manager.createSession('+2222222222', 'submit_deal');
      expect(manager.getActiveSessionCount()).toBe(2);
    });
  });

  // ── getSession ────────────────────────────────────────────

  describe('getSession', () => {
    it('should return an existing session', () => {
      manager.createSession('+1234567890', 'submit_business');
      const session = manager.getSession('+1234567890');
      expect(session).toBeDefined();
      expect(session?.user_phone).toBe('+1234567890');
    });

    it('should return null for non-existent session', () => {
      expect(manager.getSession('+9999999999')).toBeNull();
    });

    it('should return null for expired session', () => {
      // Create manager with very short TTL
      const shortManager = new SessionManager({ sessionTtlMs: 1 });
      shortManager.createSession('+1234567890', 'submit_business');

      // Wait a tiny bit for expiry
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(shortManager.getSession('+1234567890')).toBeNull();
          shortManager.stopCleanup();
          resolve();
        }, 10);
      });
    });
  });

  // ── updateSession ─────────────────────────────────────────

  describe('updateSession', () => {
    it('should update session step', () => {
      manager.createSession('+1234567890', 'submit_business');
      manager.updateSession('+1234567890', {
        step: 'collecting_business_address' as SessionStep,
      });
      const session = manager.getSession('+1234567890');
      expect(session?.current_step).toBe('collecting_business_address');
    });

    it('should merge data without overwriting existing data', () => {
      manager.createSession('+1234567890', 'submit_business');
      manager.updateSession('+1234567890', {
        data: { business_name: 'Test Restaurant' },
      });
      manager.updateSession('+1234567890', {
        data: { business_address: '123 Main St' },
      });
      const session = manager.getSession('+1234567890');
      expect(session?.data).toEqual({
        business_name: 'Test Restaurant',
        business_address: '123 Main St',
      });
    });

    it('should refresh last_activity on update', () => {
      const session = manager.createSession('+1234567890', 'submit_business');
      const originalActivity = session.last_activity;

      // Small delay to ensure timestamp difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          manager.updateSession('+1234567890', {
            data: { business_name: 'Test' },
          });
          const updated = manager.getSession('+1234567890');
          expect(updated?.last_activity).not.toBe(originalActivity);
          resolve();
        }, 5);
      });
    });

    it('should return false for non-existent session', () => {
      const result = manager.updateSession('+9999999999', {
        step: 'idle' as SessionStep,
      });
      expect(result).toBeNull();
    });
  });

  // ── endSession ────────────────────────────────────────────

  describe('endSession', () => {
    it('should remove the session', () => {
      manager.createSession('+1234567890', 'submit_business');
      manager.endSession('+1234567890');
      expect(manager.getSession('+1234567890')).toBeNull();
    });

    it('should decrement active session count', () => {
      manager.createSession('+1234567890', 'submit_business');
      manager.createSession('+2222222222', 'submit_deal');
      expect(manager.getActiveSessionCount()).toBe(2);
      manager.endSession('+1234567890');
      expect(manager.getActiveSessionCount()).toBe(1);
    });

    it('should be safe to call for non-existent session', () => {
      expect(() => manager.endSession('+9999999999')).not.toThrow();
    });
  });

  // ── isInFlow ──────────────────────────────────────────────

  describe('isInFlow', () => {
    it('should return true when user has an active non-idle session', () => {
      manager.createSession('+1234567890', 'submit_business', 'collecting_business_name' as SessionStep);
      expect(manager.isInFlow('+1234567890')).toBe(true);
    });

    it('should return false when no session exists', () => {
      expect(manager.isInFlow('+9999999999')).toBe(false);
    });

    it('should return false after session is ended', () => {
      manager.createSession('+1234567890', 'submit_business');
      manager.endSession('+1234567890');
      expect(manager.isInFlow('+1234567890')).toBe(false);
    });
  });

  // ── clearAll ──────────────────────────────────────────────

  describe('clearAll', () => {
    it('should remove all sessions', () => {
      manager.createSession('+1111111111', 'submit_business');
      manager.createSession('+2222222222', 'submit_deal');
      manager.createSession('+3333333333', 'consultancy_rating');
      expect(manager.getActiveSessionCount()).toBe(3);
      manager.clearAll();
      expect(manager.getActiveSessionCount()).toBe(0);
    });
  });

  // ── Cleanup ───────────────────────────────────────────────

  describe('cleanup', () => {
    it('should start and stop cleanup without errors', () => {
      expect(() => manager.startCleanup()).not.toThrow();
      expect(() => manager.stopCleanup()).not.toThrow();
    });
  });

  // ── Custom TTL Configuration ──────────────────────────────

  describe('configuration', () => {
    it('should respect custom sessionTtlMs', () => {
      const customManager = new SessionManager({ sessionTtlMs: 60_000 });
      const session = customManager.createSession('+1234567890', 'submit_business');
      const expiresAt = new Date(session.expires_at).getTime();
      const now = Date.now();
      // Should expire roughly 60 seconds from now (within 5 second tolerance)
      expect(expiresAt - now).toBeGreaterThan(55_000);
      expect(expiresAt - now).toBeLessThan(65_000);
      customManager.stopCleanup();
    });

    it('should use default config when no config provided', () => {
      const defaultManager = new SessionManager();
      const session = defaultManager.createSession('+1234567890', 'submit_business');
      expect(session).toBeDefined();
      defaultManager.stopCleanup();
    });
  });
});
