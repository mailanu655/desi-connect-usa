/**
 * FlowHandler Tests
 *
 * Tests all 3 multi-step conversation flows:
 *   1. Business submission (6 steps)
 *   2. Deal submission (5 steps)
 *   3. Consultancy rating (4 steps)
 *
 * SessionManager and Repositories are mocked.
 */

import { FlowHandler, SessionManager } from '@desi-connect/middleware';
import type { IntentClassification, BotIntent, ConversationSession, SessionStep } from '@desi-connect/shared';
import type { Repositories } from '@desi-connect/database';

// ── Helpers ─────────────────────────────────────────────────

function makeClassification(
  intent: BotIntent,
  entities: Record<string, string> = {},
): IntentClassification {
  return { intent, confidence: 0.9, entities, raw_message: `test ${intent}` };
}

function createMockRepos(): Repositories {
  const mockRepo = () => ({
    list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    create: jest.fn().mockResolvedValue({ id: 'new-id' }),
  });

  return {
    businesses: mockRepo(),
    jobs: mockRepo(),
    deals: mockRepo(),
    events: mockRepo(),
    reviews: mockRepo(),
    consultancies: mockRepo(),
    users: mockRepo(),
    news: mockRepo(),
  } as unknown as Repositories;
}

describe('FlowHandler', () => {
  let handler: FlowHandler;
  let sessionManager: SessionManager;
  let repos: Repositories;

  beforeEach(() => {
    sessionManager = new SessionManager({ sessionTtlMs: 300_000 });
    repos = createMockRepos();
    handler = new FlowHandler(sessionManager, repos);
  });

  afterEach(() => {
    sessionManager.stopCleanup();
    sessionManager.clearAll();
  });

  // ═══════════════════════════════════════════════════════════
  // BUSINESS SUBMISSION FLOW
  // ═══════════════════════════════════════════════════════════

  describe('Business Submission Flow', () => {
    const phone = '+1234567890';

    it('should start the flow and ask for business name', async () => {
      const result = await handler.startFlow(phone, makeClassification('submit_business'));
      expect(result.to).toBe(phone);
      expect(result.body).toContain('name');
      expect(sessionManager.isInFlow(phone)).toBe(true);
    });

    it('should collect business name and ask for address', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      const result = await handler.handleFlowStep(phone, 'Taj Palace Restaurant');
      expect(result.body.toLowerCase()).toContain('address');
    });

    it('should collect address and ask for category', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace Restaurant');
      const result = await handler.handleFlowStep(phone, '123 Main St, Dallas, TX 75001');
      expect(result.body.toLowerCase()).toContain('categor');
    });

    it('should collect valid category and ask for phone', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St, Dallas, TX 75001');
      const result = await handler.handleFlowStep(phone, 'restaurant');
      expect(result.body.toLowerCase()).toContain('phone');
    });

    it('should reject invalid category and re-prompt', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St');
      const result = await handler.handleFlowStep(phone, 'invalid_category_xyz');
      // Should still be asking for category
      expect(result.body.toLowerCase()).toContain('categor');
    });

    it('should collect phone and ask for hours', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St, Dallas, TX 75001');
      await handler.handleFlowStep(phone, 'restaurant');
      const result = await handler.handleFlowStep(phone, '+19725551234');
      expect(result.body.toLowerCase()).toContain('hours');
    });

    it('should collect hours and ask for confirmation', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St, Dallas, TX 75001');
      await handler.handleFlowStep(phone, 'restaurant');
      await handler.handleFlowStep(phone, '+19725551234');
      const result = await handler.handleFlowStep(phone, '9AM-9PM');
      expect(result.body.toLowerCase()).toContain('review');
    });

    it('should submit business on confirmation', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St, Dallas, TX 75001');
      await handler.handleFlowStep(phone, 'restaurant');
      await handler.handleFlowStep(phone, '+19725551234');
      await handler.handleFlowStep(phone, '9AM-9PM');
      const result = await handler.handleFlowStep(phone, 'yes');

      expect(repos.businesses.create).toHaveBeenCalled();
      expect(result.body).toContain('submitted');
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });

    it('should cancel on non-confirmation', async () => {
      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St');
      await handler.handleFlowStep(phone, 'restaurant');
      await handler.handleFlowStep(phone, '+19725551234');
      await handler.handleFlowStep(phone, '9AM-9PM');
      const result = await handler.handleFlowStep(phone, 'no');

      expect(repos.businesses.create).not.toHaveBeenCalled();
      expect(result.body.toLowerCase()).toContain('cancel');
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });

    it('should handle create errors gracefully', async () => {
      (repos.businesses.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await handler.startFlow(phone, makeClassification('submit_business'));
      await handler.handleFlowStep(phone, 'Taj Palace');
      await handler.handleFlowStep(phone, '123 Main St');
      await handler.handleFlowStep(phone, 'restaurant');
      await handler.handleFlowStep(phone, '+19725551234');
      await handler.handleFlowStep(phone, '9AM-9PM');
      const result = await handler.handleFlowStep(phone, 'yes');

      expect(result.body.toLowerCase()).toMatch(/sorry|error|couldn't/);
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DEAL SUBMISSION FLOW
  // ═══════════════════════════════════════════════════════════

  describe('Deal Submission Flow', () => {
    const phone = '+2222222222';

    it('should start the flow and ask for business name', async () => {
      const result = await handler.startFlow(phone, makeClassification('submit_deal'));
      expect(result.to).toBe(phone);
      expect(result.body.toLowerCase()).toContain('business');
      expect(sessionManager.isInFlow(phone)).toBe(true);
    });

    it('should collect business name and ask for discount', async () => {
      await handler.startFlow(phone, makeClassification('submit_deal'));
      const result = await handler.handleFlowStep(phone, 'Spice Garden');
      expect(result.body.toLowerCase()).toMatch(/discount|deal|offer/);
    });

    it('should collect discount and ask for expiry', async () => {
      await handler.startFlow(phone, makeClassification('submit_deal'));
      await handler.handleFlowStep(phone, 'Spice Garden');
      const result = await handler.handleFlowStep(phone, '20% off all items');
      expect(result.body.toLowerCase()).toMatch(/expir|date|when/);
    });

    it('should collect expiry and ask for terms', async () => {
      await handler.startFlow(phone, makeClassification('submit_deal'));
      await handler.handleFlowStep(phone, 'Spice Garden');
      await handler.handleFlowStep(phone, '20% off all items');
      const result = await handler.handleFlowStep(phone, '2026-04-01');
      expect(result.body.toLowerCase()).toMatch(/terms|condition|detail/);
    });

    it('should collect terms and ask for confirmation', async () => {
      await handler.startFlow(phone, makeClassification('submit_deal'));
      await handler.handleFlowStep(phone, 'Spice Garden');
      await handler.handleFlowStep(phone, '20% off all items');
      await handler.handleFlowStep(phone, '2026-04-01');
      const result = await handler.handleFlowStep(phone, 'Min purchase $50');
      expect(result.body.toLowerCase()).toContain('review');
    });

    it('should submit deal on confirmation', async () => {
      await handler.startFlow(phone, makeClassification('submit_deal'));
      await handler.handleFlowStep(phone, 'Spice Garden');
      await handler.handleFlowStep(phone, '20% off all items');
      await handler.handleFlowStep(phone, '2026-04-01');
      await handler.handleFlowStep(phone, 'Min purchase $50');
      const result = await handler.handleFlowStep(phone, 'yes');

      expect(repos.deals.create).toHaveBeenCalled();
      expect(result.body).toContain('submitted');
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });

    it('should cancel on non-confirmation', async () => {
      await handler.startFlow(phone, makeClassification('submit_deal'));
      await handler.handleFlowStep(phone, 'Spice Garden');
      await handler.handleFlowStep(phone, '20% off');
      await handler.handleFlowStep(phone, '2026-04-01');
      await handler.handleFlowStep(phone, 'No conditions');
      const result = await handler.handleFlowStep(phone, 'no');

      expect(repos.deals.create).not.toHaveBeenCalled();
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });

    it('should handle create errors gracefully', async () => {
      (repos.deals.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await handler.startFlow(phone, makeClassification('submit_deal'));
      await handler.handleFlowStep(phone, 'Spice Garden');
      await handler.handleFlowStep(phone, '20% off');
      await handler.handleFlowStep(phone, '2026-04-01');
      await handler.handleFlowStep(phone, 'Terms');
      const result = await handler.handleFlowStep(phone, 'yes');

      expect(result.body.toLowerCase()).toMatch(/sorry|error|couldn't/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CONSULTANCY RATING FLOW
  // ═══════════════════════════════════════════════════════════

  describe('Consultancy Rating Flow', () => {
    const phone = '+3333333333';

    it('should start the flow and ask for consultancy name', async () => {
      const result = await handler.startFlow(phone, makeClassification('consultancy_rating'));
      expect(result.to).toBe(phone);
      expect(result.body.toLowerCase()).toMatch(/name|consultancy|which/);
      expect(sessionManager.isInFlow(phone)).toBe(true);
    });

    it('should collect name and ask for star rating', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      const result = await handler.handleFlowStep(phone, 'ABC Immigration');
      expect(result.body.toLowerCase()).toMatch(/star|rating|rate/);
    });

    it('should collect stars and ask for review text', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      const result = await handler.handleFlowStep(phone, '4');
      expect(result.body.toLowerCase()).toMatch(/review|comment|experience|text/);
    });

    it('should reject invalid star rating (0)', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      const result = await handler.handleFlowStep(phone, '0');
      expect(result.body.toLowerCase()).toMatch(/1.*5|valid|between/);
    });

    it('should reject invalid star rating (6)', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      const result = await handler.handleFlowStep(phone, '6');
      expect(result.body.toLowerCase()).toMatch(/1.*5|valid|between/);
    });

    it('should collect review text and ask for confirmation', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      await handler.handleFlowStep(phone, '4');
      const result = await handler.handleFlowStep(phone, 'Great experience, very helpful');
      expect(result.body.toLowerCase()).toContain('review');
    });

    it('should submit review on confirmation', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      await handler.handleFlowStep(phone, '4');
      await handler.handleFlowStep(phone, 'Great experience');
      const result = await handler.handleFlowStep(phone, 'yes');

      expect(repos.reviews.create).toHaveBeenCalled();
      expect(result.body).toContain('submitted');
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });

    it('should cancel on non-confirmation', async () => {
      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      await handler.handleFlowStep(phone, '3');
      await handler.handleFlowStep(phone, 'Decent service');
      const result = await handler.handleFlowStep(phone, 'nope');

      expect(repos.reviews.create).not.toHaveBeenCalled();
      expect(sessionManager.isInFlow(phone)).toBe(false);
    });

    it('should pre-populate rating when entity provided', async () => {
      await handler.startFlow(
        phone,
        makeClassification('consultancy_rating', { rating: '5' }),
      );
      await handler.handleFlowStep(phone, 'XYZ Consulting');
      // Should skip star collection and go straight to review text
      const session = sessionManager.getSession(phone);
      // The data should contain the pre-populated rating
      expect(session?.data.rating_stars || session?.data.rating).toBeDefined();
    });

    it('should handle create errors gracefully', async () => {
      (repos.reviews.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await handler.startFlow(phone, makeClassification('consultancy_rating'));
      await handler.handleFlowStep(phone, 'ABC Immigration');
      await handler.handleFlowStep(phone, '4');
      await handler.handleFlowStep(phone, 'Great');
      const result = await handler.handleFlowStep(phone, 'yes');

      expect(result.body.toLowerCase()).toMatch(/sorry|error|couldn't/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // EXPIRED / MISSING SESSIONS
  // ═══════════════════════════════════════════════════════════

  describe('Expired/Missing Sessions', () => {
    it('should return expired message when session does not exist', async () => {
      const result = await handler.handleFlowStep('+9999999999', 'some input');
      expect(result.body.toLowerCase()).toContain('expired');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CONFIRMATION MATCHING
  // ═══════════════════════════════════════════════════════════

  describe('Confirmation matching', () => {
    const phone = '+4444444444';

    const confirmWords = ['yes', 'y', 'confirm', 'ok', 'sure', 'yep', 'yeah', 'submit', 'go ahead'];

    // Only test a few representative ones to avoid excessive flow setup
    it.each(['yes', 'confirm', 'sure', 'go ahead'])(
      'should accept "%s" as confirmation',
      async (word) => {
        await handler.startFlow(phone, makeClassification('submit_business'));
        await handler.handleFlowStep(phone, 'Test Biz');
        await handler.handleFlowStep(phone, '123 Main St');
        await handler.handleFlowStep(phone, 'restaurant');
        await handler.handleFlowStep(phone, '+1234567890');
        await handler.handleFlowStep(phone, '9-5');
        const result = await handler.handleFlowStep(phone, word);
        expect(repos.businesses.create).toHaveBeenCalled();

        // Reset for next iteration
        (repos.businesses.create as jest.Mock).mockClear();
        sessionManager.clearAll();
      },
    );
  });
});
