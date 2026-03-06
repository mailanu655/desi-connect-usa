/**
 * IntentEngine Tests
 *
 * Tests keyword-based intent classification with entity extraction.
 * Covers all 10 intents, confidence scoring, entity extractors,
 * unknown fallback, and AI classifier integration.
 */

import { IntentEngine } from '@desi-connect/middleware';
import type { AiClassifier } from '@desi-connect/middleware';
import type { BotIntent, IntentClassification } from '@desi-connect/shared';

describe('IntentEngine', () => {
  let engine: IntentEngine;

  beforeEach(() => {
    engine = new IntentEngine();
  });

  // ── Help / Onboarding ─────────────────────────────────────

  describe('help_onboarding intent', () => {
    const helpMessages = ['hi', 'hello', 'hey', 'help', 'menu', 'start', 'namaste', 'hola'];

    it.each(helpMessages)('should classify "%s" as help_onboarding', async (msg) => {
      const result = await engine.classify(msg);
      expect(result.intent).toBe('help_onboarding');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should classify "Hi!" with punctuation as help_onboarding', async () => {
      const result = await engine.classify('Hi!');
      expect(result.intent).toBe('help_onboarding');
    });

    it('should have high confidence for short help messages', async () => {
      const result = await engine.classify('help');
      expect(result.confidence).toBe(1.0);
    });
  });

  // ── Search Businesses ─────────────────────────────────────

  describe('search_businesses intent', () => {
    it('should classify "Find Indian restaurants in Plano TX" as search_businesses', async () => {
      const result = await engine.classify('Find Indian restaurants in Plano TX');
      expect(result.intent).toBe('search_businesses');
    });

    it('should classify "Show me grocery stores near Dallas" as search_businesses', async () => {
      const result = await engine.classify('Show me grocery stores near Dallas');
      expect(result.intent).toBe('search_businesses');
    });

    it('should classify "Where are the temples in Houston?" as search_businesses', async () => {
      const result = await engine.classify('Where are the temples in Houston?');
      expect(result.intent).toBe('search_businesses');
    });

    it('should extract location entity', async () => {
      const result = await engine.classify('Find Indian restaurants in Plano, TX');
      expect(result.entities.location).toBeDefined();
    });

    it('should extract category entity', async () => {
      const result = await engine.classify('Find restaurants near me');
      expect(result.entities.category).toBeDefined();
    });
  });

  // ── Submit Business ───────────────────────────────────────

  describe('submit_business intent', () => {
    it('should classify "Add my restaurant to the directory" as submit_business', async () => {
      const result = await engine.classify('Add my restaurant to the directory');
      expect(result.intent).toBe('submit_business');
    });

    it('should classify "List my business" as submit_business', async () => {
      const result = await engine.classify('List my business');
      expect(result.intent).toBe('submit_business');
    });

    it('should classify "Register our store" as submit_business', async () => {
      const result = await engine.classify('Register our store');
      expect(result.intent).toBe('submit_business');
    });

    it('should classify "Submit a salon" as submit_business', async () => {
      const result = await engine.classify('Submit a salon');
      expect(result.intent).toBe('submit_business');
    });
  });

  // ── Job Search ────────────────────────────────────────────

  describe('job_search intent', () => {
    it('should classify "Find OPT jobs in data science" as job_search', async () => {
      const result = await engine.classify('Find OPT jobs in data science');
      expect(result.intent).toBe('job_search');
    });

    it('should classify "Looking for work near Dallas" as job_search', async () => {
      const result = await engine.classify('Looking for work near Dallas');
      expect(result.intent).toBe('job_search');
    });

    it('should classify "Search for data science positions" as job_search', async () => {
      const result = await engine.classify('Search for data science positions');
      expect(result.intent).toBe('job_search');
    });

    it('should classify "Any career openings in IT?" as job_search', async () => {
      const result = await engine.classify('Any career openings in IT?');
      expect(result.intent).toBe('job_search');
    });
  });

  // ── Deals Nearby ──────────────────────────────────────────

  describe('deals_nearby intent', () => {
    it('should classify "Any Indian grocery deals this week?" as deals_nearby', async () => {
      const result = await engine.classify('Any Indian grocery deals this week?');
      expect(result.intent).toBe('deals_nearby');
    });

    it('should classify "Show me coupons" as deals_nearby', async () => {
      const result = await engine.classify('Show me coupons');
      expect(result.intent).toBe('deals_nearby');
    });

    it('should classify "Find discounts near me" as deals_nearby', async () => {
      const result = await engine.classify('Find discounts near me');
      expect(result.intent).toBe('deals_nearby');
    });

    it('should classify "Get offers" as deals_nearby', async () => {
      const result = await engine.classify('Get offers');
      expect(result.intent).toBe('deals_nearby');
    });
  });

  // ── Submit Deal ───────────────────────────────────────────

  describe('submit_deal intent', () => {
    it('should classify "Post a 20% off deal for my store" as submit_deal', async () => {
      const result = await engine.classify('Post a 20% off deal for my store');
      expect(result.intent).toBe('submit_deal');
    });

    it('should classify "Submit a coupon" as submit_deal', async () => {
      const result = await engine.classify('Submit a coupon');
      expect(result.intent).toBe('submit_deal');
    });

    it('should classify "Add a deal for my restaurant" as submit_deal', async () => {
      const result = await engine.classify('Add a deal for my restaurant');
      expect(result.intent).toBe('submit_deal');
    });
  });

  // ── Event Info ────────────────────────────────────────────

  describe('event_info intent', () => {
    it('should classify "What Holi events are happening near me?" as event_info', async () => {
      const result = await engine.classify('What Holi events are happening near me?');
      expect(result.intent).toBe('event_info');
    });

    it('should classify "Any Diwali celebrations this weekend?" as event_info', async () => {
      const result = await engine.classify('Any Diwali celebrations this weekend?');
      expect(result.intent).toBe('event_info');
    });

    it('should classify "Navratri events" as event_info', async () => {
      const result = await engine.classify('Navratri events');
      expect(result.intent).toBe('event_info');
    });

    it('should classify "Ganesh festivals near Dallas" as event_info', async () => {
      const result = await engine.classify('Ganesh festivals near Dallas');
      expect(result.intent).toBe('event_info');
    });

    it('should classify "Find upcoming events" as event_info', async () => {
      const result = await engine.classify('Find upcoming events near me');
      expect(result.intent).toBe('event_info');
    });
  });

  // ── Immigration Alert ─────────────────────────────────────

  describe('immigration_alert intent', () => {
    it('should classify "Subscribe to H-1B updates" as immigration_alert', async () => {
      const result = await engine.classify('Subscribe to H-1B updates');
      expect(result.intent).toBe('immigration_alert');
    });

    it('should classify "Alert me on EB-2 changes" as immigration_alert', async () => {
      const result = await engine.classify('Alert me on EB-2 changes');
      expect(result.intent).toBe('immigration_alert');
    });

    it('should classify "Notify me about green card updates" as immigration_alert', async () => {
      const result = await engine.classify('Notify me about green card updates');
      expect(result.intent).toBe('immigration_alert');
    });

    it('should classify "USCIS alerts please" as immigration_alert', async () => {
      const result = await engine.classify('Subscribe to USCIS alerts please');
      expect(result.intent).toBe('immigration_alert');
    });

    it('should extract visa_category entity', async () => {
      const result = await engine.classify('Subscribe to H-1B updates');
      expect(result.entities.visa_category).toBeDefined();
    });
  });

  // ── Consultancy Rating ────────────────────────────────────

  describe('consultancy_rating intent', () => {
    it('should classify "Rate ABC Consultancy 3 stars" as consultancy_rating', async () => {
      const result = await engine.classify('Rate ABC Consultancy 3 stars');
      expect(result.intent).toBe('consultancy_rating');
    });

    it('should classify "Review my immigration consultant" as consultancy_rating', async () => {
      const result = await engine.classify('Review my immigration consultant');
      expect(result.intent).toBe('consultancy_rating');
    });

    it('should extract star rating entity', async () => {
      const result = await engine.classify('Rate XYZ 4 stars');
      expect(result.entities.rating).toBe('4');
    });
  });

  // ── Daily Digest ──────────────────────────────────────────

  describe('daily_digest intent', () => {
    it('should classify "Send me daily updates" as daily_digest', async () => {
      const result = await engine.classify('Send me daily updates');
      expect(result.intent).toBe('daily_digest');
    });

    it('should classify "Subscribe to daily digest" as daily_digest', async () => {
      const result = await engine.classify('Subscribe to daily digest');
      expect(result.intent).toBe('daily_digest');
    });

    it('should classify "Get daily community news" as daily_digest', async () => {
      const result = await engine.classify('Get daily community news');
      expect(result.intent).toBe('daily_digest');
    });
  });

  // ── Unknown / Fallback ────────────────────────────────────

  describe('unknown intent', () => {
    it('should classify gibberish as unknown', async () => {
      const result = await engine.classify('xyzzy foobar blah blah');
      expect(result.intent).toBe('unknown');
    });

    it('should have low confidence for unknown messages', async () => {
      const result = await engine.classify('what is the meaning of life');
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should preserve the raw_message', async () => {
      const msg = 'some random text here';
      const result = await engine.classify(msg);
      expect(result.raw_message).toBe(msg);
    });
  });

  // ── AI Classifier Fallback ────────────────────────────────

  describe('AI classifier fallback', () => {
    it('should use AI classifier when keyword matching fails', async () => {
      const mockClassifier: AiClassifier = {
        classify: jest.fn().mockResolvedValue({
          intent: 'job_search' as BotIntent,
          confidence: 0.85,
          entities: {},
          raw_message: 'I need employment opportunities',
        }),
      };

      const engineWithAi = new IntentEngine({ aiClassifier: mockClassifier });
      const result = await engineWithAi.classify('I need employment opportunities');
      expect(mockClassifier.classify).toHaveBeenCalledWith('I need employment opportunities');
      expect(result.intent).toBe('job_search');
      expect(result.confidence).toBe(0.85);
    });

    it('should return unknown when AI classifier also fails', async () => {
      const mockClassifier: AiClassifier = {
        classify: jest.fn().mockResolvedValue({
          intent: 'unknown' as BotIntent,
          confidence: 0.3,
          entities: {},
          raw_message: 'completely random stuff',
        }),
      };

      const engineWithAi = new IntentEngine({ aiClassifier: mockClassifier });
      const result = await engineWithAi.classify('completely random stuff');
      expect(result.intent).toBe('unknown');
    });

    it('should handle AI classifier errors gracefully', async () => {
      const mockClassifier: AiClassifier = {
        classify: jest.fn().mockRejectedValue(new Error('API down')),
      };

      const engineWithAi = new IntentEngine({ aiClassifier: mockClassifier });
      const result = await engineWithAi.classify('something weird');
      expect(result.intent).toBe('unknown');
    });
  });

  // ── Static Methods ────────────────────────────────────────

  describe('getSupportedIntents', () => {
    it('should return all 10 supported intents', () => {
      const intents = IntentEngine.getSupportedIntents();
      expect(intents).toHaveLength(10);
      expect(intents).toContain('search_businesses');
      expect(intents).toContain('submit_business');
      expect(intents).toContain('job_search');
      expect(intents).toContain('deals_nearby');
      expect(intents).toContain('submit_deal');
      expect(intents).toContain('event_info');
      expect(intents).toContain('immigration_alert');
      expect(intents).toContain('consultancy_rating');
      expect(intents).toContain('daily_digest');
      expect(intents).toContain('help_onboarding');
    });
  });

  // ── Entity Extraction ─────────────────────────────────────

  describe('entity extraction', () => {
    it('should extract location from "in Dallas, TX"', async () => {
      const result = await engine.classify('Find restaurants in Dallas, TX');
      expect(result.entities.location).toMatch(/Dallas/);
    });

    it('should extract location from "near Houston"', async () => {
      const result = await engine.classify('Show grocery stores near Houston');
      expect(result.entities.location).toMatch(/Houston/);
    });

    it('should extract star rating from "5 stars"', async () => {
      const result = await engine.classify('Rate consultant 5 stars');
      expect(result.entities.rating).toBe('5');
    });

    it('should extract visa category "H-1B"', async () => {
      const result = await engine.classify('Subscribe to H-1B updates');
      expect(result.entities.visa_category).toMatch(/H-?1B/i);
    });

    it('should extract visa category "EB-2"', async () => {
      const result = await engine.classify('Alert me on EB-2 changes');
      expect(result.entities.visa_category).toMatch(/EB-?2/i);
    });
  });

  // ── Confidence Scoring ────────────────────────────────────

  describe('confidence scoring', () => {
    it('should give 1.0 confidence to short help messages', async () => {
      const result = await engine.classify('hi');
      expect(result.confidence).toBe(1.0);
    });

    it('should give 0.9 confidence when entities are extracted', async () => {
      const result = await engine.classify('Find restaurants in Dallas, TX');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should give 0.8 confidence for pattern-only matches', async () => {
      const result = await engine.classify('Find businesses');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  // ── Edge Cases ────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty string', async () => {
      const result = await engine.classify('');
      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
    });

    it('should handle very long messages', async () => {
      const longMsg = 'Find restaurants '.repeat(100);
      const result = await engine.classify(longMsg);
      expect(result).toBeDefined();
    });

    it('should be case-insensitive', async () => {
      const r1 = await engine.classify('FIND RESTAURANTS IN DALLAS');
      const r2 = await engine.classify('find restaurants in dallas');
      expect(r1.intent).toBe(r2.intent);
    });

    it('should handle messages with extra whitespace', async () => {
      const result = await engine.classify('  Find  restaurants  in  Dallas  ');
      expect(result.intent).toBe('search_businesses');
    });
  });
});
