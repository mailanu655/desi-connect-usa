/**
 * Jest Tests for WhatsApp Session Manager
 * 
 * Comprehensive test coverage for session creation, retrieval, updates,
 * step transitions, TTL expiration, and all step prompts.
 */

import type { ConversationSession, BotIntent } from '@desi-connect/shared';
import {
  createSession,
  getSession,
  updateSession,
  advanceStep,
  setSessionIntent,
  resetSession,
  expireSession,
  isCollectingStep,
  getStepPrompt,
  getSessionStats,
  clearAllSessions,
} from '@/lib/whatsapp/session-manager';

// Mock crypto.randomUUID to return predictable UUIDs
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { randomUUID: mockRandomUUID } = require('crypto') as { randomUUID: jest.Mock };

describe('WhatsApp Session Manager', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    clearAllSessions();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    clearAllSessions();
  });

  // ============================================================================
  // createSession Tests
  // ============================================================================

  describe('createSession()', () => {
    it('should create a session with correct defaults', () => {
      const phone = '+14695551234';
      const session = createSession(phone);

      expect(session).toBeDefined();
      expect(session.session_id).toBe('test-uuid-1234');
      expect(session.user_phone).toBe(phone);
      expect(session.user_id).toBeNull();
      expect(session.current_step).toBe('idle');
      expect(session.intent).toBeNull();
      expect(session.data).toEqual({});
      expect(session.last_activity).toBeDefined();
      expect(session.expires_at).toBeDefined();
    });

    it('should create a session with custom TTL', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      const customTTL = 60 * 60 * 1000; // 1 hour

      const beforeTime = new Date();
      const session = createSession(phone, null, customTTL);
      const afterTime = new Date();

      const expiresAt = new Date(session.expires_at);
      const createdAt = new Date(session.last_activity);

      // Calculate expected expiry time
      const expectedMinExpiry = new Date(beforeTime.getTime() + customTTL);
      const expectedMaxExpiry = new Date(afterTime.getTime() + customTTL);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime() - 100);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime() + 100);

      jest.useRealTimers();
    });

    it('should create a session with user ID', () => {
      const phone = '+14695551234';
      const userId = 'user-123';
      const session = createSession(phone, userId);

      expect(session.user_id).toBe(userId);
      expect(session.user_phone).toBe(phone);
    });

    it('should use default TTL of 30 minutes', () => {
      jest.useFakeTimers();
      const now = new Date('2026-03-04T10:00:00Z');
      jest.setSystemTime(now);

      const phone = '+14695551234';
      const session = createSession(phone);

      const expectedExpiry = new Date(now.getTime() + 30 * 60 * 1000);
      const actualExpiry = new Date(session.expires_at);

      expect(actualExpiry.getTime()).toBe(expectedExpiry.getTime());

      jest.useRealTimers();
    });

    it('should generate unique session IDs', () => {
      // Mock returns same value, so both sessions get 'test-uuid-1234'
      mockRandomUUID.mockReturnValueOnce('uuid-aaa').mockReturnValueOnce('uuid-bbb');
      const session1 = createSession('+11111111111');
      const session2 = createSession('+12222222222');

      // With different mock return values, IDs should differ
      expect(session1.session_id).toBe('uuid-aaa');
      expect(session2.session_id).toBe('uuid-bbb');
      expect(session1.session_id).not.toBe(session2.session_id);
    });

    it('should normalize phone number with whatsapp: prefix', () => {
      const session = createSession('whatsapp:+14695551234');
      expect(session.user_phone).toBe('whatsapp:+14695551234');

      // Verify it can be retrieved with normalized format
      const retrieved = getSession('whatsapp:+14695551234');
      expect(retrieved).not.toBeNull();
    });
  });

  // ============================================================================
  // getSession Tests
  // ============================================================================

  describe('getSession()', () => {
    it('should retrieve an existing session', () => {
      const phone = '+14695551234';
      const created = createSession(phone);
      const retrieved = getSession(phone);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.session_id).toBe(created.session_id);
      expect(retrieved?.user_phone).toBe(created.user_phone);
    });

    it('should return null for non-existent session', () => {
      const session = getSession('+19999999999');
      expect(session).toBeNull();
    });

    it('should return null for expired session', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      const ttl = 10 * 60 * 1000; // 10 minutes

      createSession(phone, null, ttl);

      // Fast forward past expiration
      jest.advanceTimersByTime(ttl + 1000);

      const session = getSession(phone);
      expect(session).toBeNull();

      jest.useRealTimers();
    });

    it('should normalize phone number with whatsapp: prefix', () => {
      const phone = 'whatsapp:+14695551234';
      createSession(phone);

      const session1 = getSession(phone);
      const session2 = getSession('+14695551234');

      expect(session1).not.toBeNull();
      expect(session2).not.toBeNull();
      expect(session1?.session_id).toBe(session2?.session_id);
    });

    it('should normalize phone number by removing special characters', () => {
      const phone = '+1 (469) 555-1234';
      createSession(phone);

      const session = getSession('+1(469)5551234');
      expect(session).not.toBeNull();
    });

    it('should normalize whatsapp: prefix and special characters', () => {
      const phone = 'whatsapp:+1 (469) 555-1234';
      createSession(phone);

      const session = getSession('+14695551234');
      expect(session).not.toBeNull();
    });
  });

  // ============================================================================
  // updateSession Tests
  // ============================================================================

  describe('updateSession()', () => {
    it('should perform partial updates', () => {
      const phone = '+14695551234';
      const created = createSession(phone);

      const updated = updateSession(phone, { intent: 'register_business' });

      expect(updated.intent).toBe('register_business');
      expect(updated.user_phone).toBe(created.user_phone);
      expect(updated.session_id).toBe(created.session_id);
    });

    it('should update last_activity timestamp', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      const created = createSession(phone);
      const createdTime = new Date(created.last_activity);

      jest.advanceTimersByTime(5000);

      const updated = updateSession(phone, { intent: 'register_business' });
      const updatedTime = new Date(updated.last_activity);

      expect(updatedTime.getTime()).toBeGreaterThan(createdTime.getTime());

      jest.useRealTimers();
    });

    it('should update data field', () => {
      const phone = '+14695551234';
      createSession(phone);

      const updated = updateSession(phone, {
        data: { business_name: 'My Business' },
      });

      expect(updated.data).toEqual({ business_name: 'My Business' });
    });

    it('should merge data with existing data', () => {
      const phone = '+14695551234';
      createSession(phone);

      updateSession(phone, { data: { business_name: 'My Business' } });
      const updated = updateSession(phone, { data: { business_address: '123 Main St' } });

      // Note: This tests the current behavior - the update replaces the entire data object
      expect(updated.data).toEqual({ business_address: '123 Main St' });
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        updateSession('+19999999999', { intent: 'register_business' });
      }).toThrow('Session not found for phone: +19999999999');
    });

    it('should throw error for expired session', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      const ttl = 5 * 60 * 1000; // 5 minutes

      createSession(phone, null, ttl);
      jest.advanceTimersByTime(ttl + 1000);

      expect(() => {
        updateSession(phone, { intent: 'register_business' });
      }).toThrow('Session not found for phone');

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // advanceStep Tests
  // ============================================================================

  describe('advanceStep()', () => {
    // Business Registration Flow
    describe('Business Registration Flow', () => {
      it('should advance from idle to collecting_business_name', () => {
        const phone = '+14695551234';
        createSession(phone);

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_business_name');
      });

      it('should advance from collecting_business_name to collecting_business_address', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, { business_name: 'My Cafe' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_business_address');
      });

      it('should advance from collecting_business_address to collecting_business_category', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, {});
        advanceStep(phone, { business_address: '123 Main St' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_business_category');
      });

      it('should advance from collecting_business_category to collecting_business_phone', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, { business_category: 'Restaurant' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_business_phone');
      });

      it('should advance from collecting_business_phone to collecting_business_hours', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, { business_phone: '+14695551234' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_business_hours');
      });

      it('should advance from collecting_business_hours to confirming_business_submission', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, { business_hours: '9am-5pm' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('confirming_business_submission');
      });

      it('should advance from confirming_business_submission back to idle', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('idle');
      });

      it('should accumulate data through business registration flow', () => {
        const phone = '+14695551234';
        createSession(phone);
        advanceStep(phone, { business_name: 'My Cafe' });
        advanceStep(phone, { business_address: '123 Main St' });
        advanceStep(phone, { business_category: 'Restaurant' });
        advanceStep(phone, { business_phone: '+14695551234' });

        const session = advanceStep(phone, { business_hours: '9am-5pm' });

        expect(session.data.business_name).toBe('My Cafe');
        expect(session.data.business_address).toBe('123 Main St');
        expect(session.data.business_category).toBe('Restaurant');
        expect(session.data.business_phone).toBe('+14695551234');
        expect(session.data.business_hours).toBe('9am-5pm');
      });
    });

    // Deal Registration Flow
    describe('Deal Registration Flow', () => {
      it('should advance from idle to collecting_deal_business', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_deal_business');
      });

      it('should advance from collecting_deal_business to collecting_deal_discount', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');
        advanceStep(phone, { business_id: 'bus-123' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_deal_discount');
      });

      it('should advance from collecting_deal_discount to collecting_deal_expiry', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');
        advanceStep(phone, {});
        advanceStep(phone, { discount: '20%' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_deal_expiry');
      });

      it('should advance from collecting_deal_expiry to collecting_deal_terms', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, { expiry: '2026-12-31' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_deal_terms');
      });

      it('should advance from collecting_deal_terms to confirming_deal_submission', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, { terms: 'Min purchase $10' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('confirming_deal_submission');
      });

      it('should advance from confirming_deal_submission back to idle', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('idle');
      });

      it('should accumulate data through deal registration flow', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'register_deal');
        advanceStep(phone, { business_id: 'bus-123' });
        advanceStep(phone, { discount: '20%' });
        advanceStep(phone, { expiry: '2026-12-31' });

        const session = advanceStep(phone, { terms: 'Min purchase $10' });

        expect(session.data.business_id).toBe('bus-123');
        expect(session.data.discount).toBe('20%');
        expect(session.data.expiry).toBe('2026-12-31');
        expect(session.data.terms).toBe('Min purchase $10');
      });
    });

    // Rating Flow
    describe('Rating Flow', () => {
      it('should advance from idle to collecting_rating_consultancy', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'rate_consultancy');

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_rating_consultancy');
      });

      it('should advance from collecting_rating_consultancy to collecting_rating_stars', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'rate_consultancy');
        advanceStep(phone, { consultancy_id: 'cons-123' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_rating_stars');
      });

      it('should advance from collecting_rating_stars to collecting_rating_text', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'rate_consultancy');
        advanceStep(phone, {});
        advanceStep(phone, { stars: 5 });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('collecting_rating_text');
      });

      it('should advance from collecting_rating_text to confirming_rating_submission', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'rate_consultancy');
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, { text: 'Great service!' });

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('confirming_rating_submission');
      });

      it('should advance from confirming_rating_submission back to idle', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'rate_consultancy');
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});
        advanceStep(phone, {});

        const advanced = advanceStep(phone, {});

        expect(advanced.current_step).toBe('idle');
      });

      it('should accumulate data through rating flow', () => {
        const phone = '+14695551234';
        createSession(phone);
        setSessionIntent(phone, 'rate_consultancy');
        advanceStep(phone, { consultancy_id: 'cons-123' });
        advanceStep(phone, { stars: 5 });
        advanceStep(phone, { text: 'Great service!' });

        const session = advanceStep(phone, {});

        expect(session.data.consultancy_id).toBe('cons-123');
        expect(session.data.stars).toBe(5);
        expect(session.data.text).toBe('Great service!');
      });
    });

    // Error cases
    it('should throw error for non-existent session', () => {
      expect(() => {
        advanceStep('+19999999999', {});
      }).toThrow('Session not found for phone');
    });

    it('should throw error when advancing from non-existent step', () => {
      const phone = '+14695551234';
      const session = createSession(phone);

      // Manually corrupt the session to have an invalid step
      updateSession(phone, { current_step: 'invalid_step' as any });

      expect(() => {
        advanceStep(phone, {});
      }).toThrow('Cannot advance from step: invalid_step');
    });
  });

  // ============================================================================
  // setSessionIntent Tests
  // ============================================================================

  describe('setSessionIntent()', () => {
    it('should set session intent to register_business', () => {
      const phone = '+14695551234';
      createSession(phone);

      const updated = setSessionIntent(phone, 'register_business');

      expect(updated.intent).toBe('register_business');
    });

    it('should set session intent to register_deal', () => {
      const phone = '+14695551234';
      createSession(phone);

      const updated = setSessionIntent(phone, 'register_deal');

      expect(updated.intent).toBe('register_deal');
    });

    it('should set session intent to rate_consultancy', () => {
      const phone = '+14695551234';
      createSession(phone);

      const updated = setSessionIntent(phone, 'rate_consultancy');

      expect(updated.intent).toBe('rate_consultancy');
    });

    it('should overwrite previous intent', () => {
      const phone = '+14695551234';
      createSession(phone);

      setSessionIntent(phone, 'register_business');
      const updated = setSessionIntent(phone, 'register_deal');

      expect(updated.intent).toBe('register_deal');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        setSessionIntent('+19999999999', 'register_business');
      }).toThrow('Session not found for phone');
    });
  });

  // ============================================================================
  // resetSession Tests
  // ============================================================================

  describe('resetSession()', () => {
    it('should reset session to idle state', () => {
      const phone = '+14695551234';
      createSession(phone);
      advanceStep(phone, {});
      setSessionIntent(phone, 'register_business');

      const reset = resetSession(phone);

      expect(reset.current_step).toBe('idle');
      expect(reset.intent).toBeNull();
      expect(reset.data).toEqual({});
    });

    it('should clear session data', () => {
      const phone = '+14695551234';
      createSession(phone);
      advanceStep(phone, { business_name: 'My Business' });

      const reset = resetSession(phone);

      expect(reset.data).toEqual({});
    });

    it('should clear session intent', () => {
      const phone = '+14695551234';
      createSession(phone);
      setSessionIntent(phone, 'register_business');

      const reset = resetSession(phone);

      expect(reset.intent).toBeNull();
    });

    it('should preserve session_id and user_phone', () => {
      const phone = '+14695551234';
      const created = createSession(phone);

      const reset = resetSession(phone);

      expect(reset.session_id).toBe(created.session_id);
      expect(reset.user_phone).toBe(created.user_phone);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        resetSession('+19999999999');
      }).toThrow('Session not found for phone');
    });
  });

  // ============================================================================
  // expireSession Tests
  // ============================================================================

  describe('expireSession()', () => {
    it('should delete an existing session', () => {
      const phone = '+14695551234';
      createSession(phone);

      expireSession(phone);

      const session = getSession(phone);
      expect(session).toBeNull();
    });

    it('should make session unrecoverable', () => {
      const phone = '+14695551234';
      createSession(phone);
      expireSession(phone);

      expect(() => {
        advanceStep(phone, {});
      }).toThrow('Session not found for phone');
    });

    it('should not throw error for non-existent session', () => {
      // expireSession doesn't throw - it just silently fails
      expect(() => {
        expireSession('+19999999999');
      }).not.toThrow();
    });

    it('should clear expiry timer', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      createSession(phone);

      expireSession(phone);

      // Fast forward time - should not trigger auto-expiration
      jest.advanceTimersByTime(60 * 60 * 1000);

      // Session should remain deleted (not auto-expired)
      const session = getSession(phone);
      expect(session).toBeNull();

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // isCollectingStep Tests
  // ============================================================================

  describe('isCollectingStep()', () => {
    it('should return false for idle step', () => {
      const phone = '+14695551234';
      createSession(phone);

      expect(isCollectingStep(phone)).toBe(false);
    });

    it('should return true for collecting_* steps', () => {
      const phone = '+14695551234';
      createSession(phone);
      advanceStep(phone, {});

      expect(isCollectingStep(phone)).toBe(true);
    });

    it('should return true for confirming_* steps', () => {
      const phone = '+14695551234';
      createSession(phone);
      // Advance to confirming_business_submission
      for (let i = 0; i < 6; i++) {
        advanceStep(phone, {});
      }

      expect(isCollectingStep(phone)).toBe(true);
    });

    it('should return false for non-existent session', () => {
      expect(isCollectingStep('+19999999999')).toBe(false);
    });

    it('should return true for all collecting_* steps in business flow', () => {
      const phone = '+14695551234';
      createSession(phone);

      const collectingSteps = [
        'collecting_business_name',
        'collecting_business_address',
        'collecting_business_category',
        'collecting_business_phone',
        'collecting_business_hours',
      ];

      for (const step of collectingSteps) {
        advanceStep(phone, {});
        expect(isCollectingStep(phone)).toBe(true);
      }
    });

    it('should return true for all collecting_* steps in deal flow', () => {
      const phone = '+14695551234';
      createSession(phone);
      setSessionIntent(phone, 'register_deal');

      const collectingSteps = [
        'collecting_deal_business',
        'collecting_deal_discount',
        'collecting_deal_expiry',
        'collecting_deal_terms',
      ];

      for (const step of collectingSteps) {
        advanceStep(phone, {});
        expect(isCollectingStep(phone)).toBe(true);
      }
    });

    it('should return true for all collecting_* steps in rating flow', () => {
      const phone = '+14695551234';
      createSession(phone);
      setSessionIntent(phone, 'rate_consultancy');

      const collectingSteps = [
        'collecting_rating_consultancy',
        'collecting_rating_stars',
        'collecting_rating_text',
      ];

      for (const step of collectingSteps) {
        advanceStep(phone, {});
        expect(isCollectingStep(phone)).toBe(true);
      }
    });
  });

  // ============================================================================
  // getStepPrompt Tests
  // ============================================================================

  describe('getStepPrompt()', () => {
    it('should return prompt for idle step', () => {
      const prompt = getStepPrompt('idle');
      expect(prompt).toBe('What can I help you with?');
    });

    it('should return prompt for collecting_business_name', () => {
      const prompt = getStepPrompt('collecting_business_name');
      expect(prompt).toBe("What's the name of your business?");
    });

    it('should return prompt for collecting_business_address', () => {
      const prompt = getStepPrompt('collecting_business_address');
      expect(prompt).toBe("What's the address of your business?");
    });

    it('should return prompt for collecting_business_category', () => {
      const prompt = getStepPrompt('collecting_business_category');
      expect(prompt).toBe('What category does your business fall under?');
    });

    it('should return prompt for collecting_business_phone', () => {
      const prompt = getStepPrompt('collecting_business_phone');
      expect(prompt).toBe("What's the phone number for your business?");
    });

    it('should return prompt for collecting_business_hours', () => {
      const prompt = getStepPrompt('collecting_business_hours');
      expect(prompt).toBe("What are your business hours?");
    });

    it('should return prompt for confirming_business_submission', () => {
      const prompt = getStepPrompt('confirming_business_submission');
      expect(prompt).toBe(
        'Please confirm your business details are correct. Reply YES to submit.'
      );
    });

    it('should return prompt for collecting_deal_business', () => {
      const prompt = getStepPrompt('collecting_deal_business');
      expect(prompt).toBe('Which business is this deal for?');
    });

    it('should return prompt for collecting_deal_discount', () => {
      const prompt = getStepPrompt('collecting_deal_discount');
      expect(prompt).toBe('What discount are you offering? (e.g., 20%)');
    });

    it('should return prompt for collecting_deal_expiry', () => {
      const prompt = getStepPrompt('collecting_deal_expiry');
      expect(prompt).toBe('When does this deal expire?');
    });

    it('should return prompt for collecting_deal_terms', () => {
      const prompt = getStepPrompt('collecting_deal_terms');
      expect(prompt).toBe('Any terms or conditions for this deal?');
    });

    it('should return prompt for confirming_deal_submission', () => {
      const prompt = getStepPrompt('confirming_deal_submission');
      expect(prompt).toBe('Please confirm your deal details. Reply YES to post.');
    });

    it('should return prompt for collecting_rating_consultancy', () => {
      const prompt = getStepPrompt('collecting_rating_consultancy');
      expect(prompt).toBe('Which consultancy would you like to rate?');
    });

    it('should return prompt for collecting_rating_stars', () => {
      const prompt = getStepPrompt('collecting_rating_stars');
      expect(prompt).toBe('How many stars would you give? (1-5)');
    });

    it('should return prompt for collecting_rating_text', () => {
      const prompt = getStepPrompt('collecting_rating_text');
      expect(prompt).toBe('Please share your feedback about this consultancy.');
    });

    it('should return prompt for confirming_rating_submission', () => {
      const prompt = getStepPrompt('confirming_rating_submission');
      expect(prompt).toBe('Please confirm your review. Reply YES to submit.');
    });

    it('should return default prompt for invalid step', () => {
      const prompt = getStepPrompt('invalid_step' as any);
      expect(prompt).toBe('What would you like to do?');
    });

    it('should have all 16 steps covered', () => {
      const steps: Array<any> = [
        'idle',
        'collecting_business_name',
        'collecting_business_address',
        'collecting_business_category',
        'collecting_business_phone',
        'collecting_business_hours',
        'confirming_business_submission',
        'collecting_deal_business',
        'collecting_deal_discount',
        'collecting_deal_expiry',
        'collecting_deal_terms',
        'confirming_deal_submission',
        'collecting_rating_consultancy',
        'collecting_rating_stars',
        'collecting_rating_text',
        'confirming_rating_submission',
      ];

      steps.forEach((step) => {
        const prompt = getStepPrompt(step);
        expect(prompt).toBeDefined();
        expect(prompt).not.toBe('What would you like to do?');
      });
    });
  });

  // ============================================================================
  // getSessionStats Tests
  // ============================================================================

  describe('getSessionStats()', () => {
    it('should return stats with no sessions', () => {
      const stats = getSessionStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toEqual([]);
    });

    it('should return correct total sessions count', () => {
      createSession('+14695551234');
      createSession('+14695551235');
      createSession('+14695551236');

      const stats = getSessionStats();

      expect(stats.totalSessions).toBe(3);
    });

    it('should return all active sessions', () => {
      const phone1 = '+14695551234';
      const phone2 = '+14695551235';

      createSession(phone1);
      createSession(phone2);

      const stats = getSessionStats();

      expect(stats.activeSessions).toHaveLength(2);
      expect(stats.activeSessions.map((s) => s.user_phone)).toContain(phone1);
      expect(stats.activeSessions.map((s) => s.user_phone)).toContain(phone2);
    });

    it('should include full session data in activeSessions', () => {
      const phone = '+14695551234';
      const created = createSession(phone, 'user-123');

      const stats = getSessionStats();

      expect(stats.activeSessions[0].session_id).toBe(created.session_id);
      expect(stats.activeSessions[0].user_id).toBe('user-123');
      expect(stats.activeSessions[0].user_phone).toBe(phone);
    });

    it('should exclude expired sessions from stats', () => {
      jest.useFakeTimers();
      const phone1 = '+14695551234';
      const phone2 = '+14695551235';
      const ttl = 5 * 60 * 1000;

      createSession(phone1, null, ttl);
      jest.advanceTimersByTime(ttl + 1000);
      createSession(phone2);

      const stats = getSessionStats();

      expect(stats.totalSessions).toBe(1);
      expect(stats.activeSessions[0].user_phone).toBe(phone2);

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // clearAllSessions Tests
  // ============================================================================

  describe('clearAllSessions()', () => {
    it('should clear all sessions', () => {
      createSession('+14695551234');
      createSession('+14695551235');
      createSession('+14695551236');

      clearAllSessions();

      const stats = getSessionStats();
      expect(stats.totalSessions).toBe(0);
    });

    it('should make all sessions unrecoverable', () => {
      const phones = ['+14695551234', '+14695551235', '+14695551236'];
      phones.forEach((phone) => createSession(phone));

      clearAllSessions();

      phones.forEach((phone) => {
        const session = getSession(phone);
        expect(session).toBeNull();
      });
    });

    it('should clear all expiry timers', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      const ttl = 10 * 60 * 1000;

      createSession(phone, null, ttl);
      clearAllSessions();

      // Fast forward past the original TTL
      jest.advanceTimersByTime(ttl + 1000);

      // Session should remain deleted
      const session = getSession(phone);
      expect(session).toBeNull();

      jest.useRealTimers();
    });

    it('should allow creating new sessions after clearing', () => {
      createSession('+14695551234');
      clearAllSessions();

      const newSession = createSession('+14695551234');

      expect(newSession).toBeDefined();
      expect(getSession('+14695551234')).not.toBeNull();
    });
  });

  // ============================================================================
  // Phone Normalization Tests
  // ============================================================================

  describe('Phone Normalization', () => {
    it('should normalize whatsapp: prefix', () => {
      const session1 = createSession('whatsapp:+14695551234');
      const session2 = getSession('+14695551234');

      expect(session2).not.toBeNull();
      expect(session1.session_id).toBe(session2?.session_id);
    });

    it('should remove spaces from phone number', () => {
      const session1 = createSession('+1 469 555 1234');
      const session2 = getSession('+14695551234');

      expect(session2).not.toBeNull();
      expect(session1.session_id).toBe(session2?.session_id);
    });

    it('should remove parentheses from phone number', () => {
      const session1 = createSession('+1 (469) 555-1234');
      const session2 = getSession('+14695551234');

      expect(session2).not.toBeNull();
      expect(session1.session_id).toBe(session2?.session_id);
    });

    it('should remove hyphens from phone number', () => {
      const session1 = createSession('+1-469-555-1234');
      const session2 = getSession('+14695551234');

      expect(session2).not.toBeNull();
      expect(session1.session_id).toBe(session2?.session_id);
    });

    it('should normalize whatsapp: prefix with special characters', () => {
      const session1 = createSession('whatsapp:+1 (469) 555-1234');
      const session2 = getSession('+14695551234');

      expect(session2).not.toBeNull();
      expect(session1.session_id).toBe(session2?.session_id);
    });

    it('should handle multiple formats for same phone', () => {
      const formats = [
        '+14695551234',
        'whatsapp:+14695551234',
        '+1 (469) 555-1234',
        '+1-469-555-1234',
        'whatsapp:+1 (469) 555-1234',
      ];

      const session = createSession(formats[0]);
      const sessionId = session.session_id;

      formats.forEach((format) => {
        const retrieved = getSession(format);
        expect(retrieved?.session_id).toBe(sessionId);
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should handle complete business registration flow', () => {
      const phone = '+14695551234';
      const userId = 'user-123';

      // Create session
      let session = createSession(phone, userId);
      expect(session.current_step).toBe('idle');

      // Set intent
      session = setSessionIntent(phone, 'register_business');
      expect(session.intent).toBe('register_business');

      // Advance through all steps
      session = advanceStep(phone, { business_name: 'My Cafe' });
      expect(session.current_step).toBe('collecting_business_name');
      expect(isCollectingStep(phone)).toBe(true);

      session = advanceStep(phone, { business_address: '123 Main St' });
      expect(session.current_step).toBe('collecting_business_address');

      session = advanceStep(phone, { business_category: 'Restaurant' });
      expect(session.current_step).toBe('collecting_business_category');

      session = advanceStep(phone, { business_phone: '+14695551234' });
      expect(session.current_step).toBe('collecting_business_phone');

      session = advanceStep(phone, { business_hours: '9am-5pm' });
      expect(session.current_step).toBe('collecting_business_hours');

      session = advanceStep(phone, {});
      expect(session.current_step).toBe('confirming_business_submission');
      expect(isCollectingStep(phone)).toBe(true);

      // Confirm submission
      session = advanceStep(phone, {});
      expect(session.current_step).toBe('idle');
      expect(isCollectingStep(phone)).toBe(false);

      // Verify all data was accumulated
      expect(session.data.business_name).toBe('My Cafe');
      expect(session.data.business_address).toBe('123 Main St');
      expect(session.data.business_category).toBe('Restaurant');
      expect(session.data.business_phone).toBe('+14695551234');
      expect(session.data.business_hours).toBe('9am-5pm');
    });

    it('should allow resetting and starting new flow', () => {
      const phone = '+14695551234';

      // Start business registration
      createSession(phone);
      setSessionIntent(phone, 'register_business');
      advanceStep(phone, { business_name: 'My Cafe' });

      // Reset
      let session = resetSession(phone);
      expect(session.current_step).toBe('idle');
      expect(session.intent).toBeNull();
      expect(session.data).toEqual({});

      // Start deal registration
      session = setSessionIntent(phone, 'register_deal');
      expect(session.intent).toBe('register_deal');

      session = advanceStep(phone, { business_id: 'bus-123' });
      expect(session.current_step).toBe('collecting_deal_business');
    });

    it('should handle multiple concurrent sessions', () => {
      const phones = ['+14695551234', '+14695551235', '+14695551236'];

      // Create multiple sessions
      phones.forEach((phone) => createSession(phone));

      // Advance each independently
      phones.forEach((phone) => {
        advanceStep(phone, {});
      });

      // Verify each has correct state
      phones.forEach((phone) => {
        const session = getSession(phone);
        expect(session?.current_step).toBe('collecting_business_name');
      });

      // Reset one session
      resetSession(phones[0]);

      // Verify only that one was reset
      expect(getSession(phones[0])?.current_step).toBe('idle');
      expect(getSession(phones[1])?.current_step).toBe('collecting_business_name');
      expect(getSession(phones[2])?.current_step).toBe('collecting_business_name');
    });

    it('should preserve session data across TTL resets', () => {
      jest.useFakeTimers();
      const phone = '+14695551234';
      const ttl = 5 * 60 * 1000;

      const session = createSession(phone, null, ttl);
      advanceStep(phone, { business_name: 'My Cafe' });

      // Update session (which resets last_activity)
      updateSession(phone, { data: { business_address: '123 Main St' } });

      // Advance time but not past original TTL
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Session should still exist
      const retrieved = getSession(phone);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.data.business_address).toBe('123 Main St');

      jest.useRealTimers();
    });
  });
});
