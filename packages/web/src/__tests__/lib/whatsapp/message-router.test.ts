/**
 * Comprehensive Jest Tests for WhatsApp Message Router
 *
 * Tests cover:
 * - routeMessage() for all 11 intents
 * - routeMessage() with unknown/fallback intent
 * - getRouteConfig() for valid and invalid intents
 * - getAllRouteConfigs() returns all 11 configs
 * - hasRequiredData() with various field name formats
 * - getMissingRequiredData() returns correct missing fields
 * - Edge cases: invalid intents, empty entities
 */

import type { BotIntent, IntentClassification } from '@desi-connect/shared';
import {
  routeMessage,
  getRouteConfig,
  getAllRouteConfigs,
  hasRequiredData,
  getMissingRequiredData,
  type RouteConfig,
  type MessageRouteResult,
} from '@/lib/whatsapp/message-router';

describe('Message Router', () => {
  // ============================================================================
  // routeMessage() Tests - All 11 Intents
  // ============================================================================

  describe('routeMessage()', () => {
    describe('search_businesses intent', () => {
      it('should route search_businesses with all required fields', () => {
        const classification: IntentClassification = {
          intent: 'search_businesses',
          confidence: 0.95,
          entities: {
            city: 'New York',
            state: 'NY',
            category: 'restaurants',
          },
        };

        const result = routeMessage(classification);

        expect(result).toEqual<MessageRouteResult>({
          intent: 'search_businesses',
          handler: 'businessSearchHandler',
          dataSource: '/api/businesses/search',
          requiredDataFields: ['city', 'state', 'category'],
          responseTemplate: 'business_listing',
          confidence: 0.95,
          entities: {
            city: 'New York',
            state: 'NY',
            category: 'restaurants',
          },
        });
      });

      it('should verify search_businesses handler and endpoints', () => {
        const classification: IntentClassification = {
          intent: 'search_businesses',
          confidence: 0.87,
          entities: { city: 'LA', state: 'CA', category: 'stores' },
        };

        const result = routeMessage(classification);

        expect(result.handler).toBe('businessSearchHandler');
        expect(result.dataSource).toBe('/api/businesses/search');
        expect(result.responseTemplate).toBe('business_listing');
        expect(result.requiredDataFields).toHaveLength(3);
        expect(result.requiredDataFields).toContain('city');
        expect(result.requiredDataFields).toContain('state');
        expect(result.requiredDataFields).toContain('category');
      });
    });

    describe('submit_business intent', () => {
      it('should route submit_business with all required fields', () => {
        const classification: IntentClassification = {
          intent: 'submit_business',
          confidence: 0.92,
          entities: {
            name: 'ABC Restaurant',
            category: 'food',
            address: '123 Main St',
            phone: '555-1234',
            hours: '9-5',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('submit_business');
        expect(result.handler).toBe('businessSubmissionHandler');
        expect(result.dataSource).toBe('/api/businesses/submit');
        expect(result.responseTemplate).toBe('business_confirmation');
        expect(result.requiredDataFields).toEqual(['name', 'category', 'address', 'phone', 'hours']);
        expect(result.confidence).toBe(0.92);
      });

      it('should preserve all entities in submit_business routing', () => {
        const entities = {
          name: 'XYZ Store',
          category: 'retail',
          address: '456 Oak Ave',
          phone: '555-5678',
          hours: '10-6',
          extra: 'additional_data',
        };

        const classification: IntentClassification = {
          intent: 'submit_business',
          confidence: 0.85,
          entities,
        };

        const result = routeMessage(classification);

        expect(result.entities).toEqual(entities);
      });
    });

    describe('job_search intent', () => {
      it('should route job_search with required fields', () => {
        const classification: IntentClassification = {
          intent: 'job_search',
          confidence: 0.88,
          entities: {
            title: 'Software Engineer',
            location: 'San Francisco',
            type: 'full-time',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('job_search');
        expect(result.handler).toBe('jobSearchHandler');
        expect(result.dataSource).toBe('/api/jobs/search');
        expect(result.responseTemplate).toBe('job_listing');
        expect(result.requiredDataFields).toEqual(['title', 'location', 'type']);
        expect(result.confidence).toBe(0.88);
      });
    });

    describe('immigration_alert intent', () => {
      it('should route immigration_alert with visa_type and email', () => {
        const classification: IntentClassification = {
          intent: 'immigration_alert',
          confidence: 0.91,
          entities: {
            visa_type: 'H1B',
            email: 'user@example.com',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('immigration_alert');
        expect(result.handler).toBe('immigrationAlertHandler');
        expect(result.dataSource).toBe('/api/immigration/alerts');
        expect(result.responseTemplate).toBe('immigration_alert');
        expect(result.requiredDataFields).toEqual(['visa_type', 'email']);
      });
    });

    describe('deals_nearby intent', () => {
      it('should route deals_nearby with location and category', () => {
        const classification: IntentClassification = {
          intent: 'deals_nearby',
          confidence: 0.84,
          entities: {
            location: 'Boston',
            category: 'electronics',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('deals_nearby');
        expect(result.handler).toBe('dealsSearchHandler');
        expect(result.dataSource).toBe('/api/deals/search');
        expect(result.responseTemplate).toBe('deal_listing');
        expect(result.requiredDataFields).toEqual(['location', 'category']);
      });
    });

    describe('submit_deal intent', () => {
      it('should route submit_deal with all required fields', () => {
        const classification: IntentClassification = {
          intent: 'submit_deal',
          confidence: 0.89,
          entities: {
            business: 'Tech Store',
            discount: '20%',
            description: 'Spring sale',
            expiry: '2026-03-31',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('submit_deal');
        expect(result.handler).toBe('dealSubmissionHandler');
        expect(result.dataSource).toBe('/api/deals/submit');
        expect(result.responseTemplate).toBe('deal_confirmation');
        expect(result.requiredDataFields).toEqual(['business', 'discount', 'description', 'expiry']);
      });
    });

    describe('consultancy_rating intent', () => {
      it('should route consultancy_rating with rating details', () => {
        const classification: IntentClassification = {
          intent: 'consultancy_rating',
          confidence: 0.86,
          entities: {
            consultancy_name: 'ABC Consultancy',
            rating: '5',
            review: 'Great service',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('consultancy_rating');
        expect(result.handler).toBe('consultancyRatingHandler');
        expect(result.dataSource).toBe('/api/consultancies/rate');
        expect(result.responseTemplate).toBe('rating_confirmation');
        expect(result.requiredDataFields).toEqual(['consultancy_name', 'rating', 'review']);
      });
    });

    describe('event_info intent', () => {
      it('should route event_info with location and category', () => {
        const classification: IntentClassification = {
          intent: 'event_info',
          confidence: 0.83,
          entities: {
            location: 'Chicago',
            category: 'cultural',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('event_info');
        expect(result.handler).toBe('eventSearchHandler');
        expect(result.dataSource).toBe('/api/events/search');
        expect(result.responseTemplate).toBe('event_listing');
        expect(result.requiredDataFields).toEqual(['location', 'category']);
      });
    });

    describe('daily_digest intent', () => {
      it('should route daily_digest with user_phone and location', () => {
        const classification: IntentClassification = {
          intent: 'daily_digest',
          confidence: 0.90,
          entities: {
            user_phone: '+1-555-0123',
            location: 'Austin',
          },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('daily_digest');
        expect(result.handler).toBe('dailyDigestHandler');
        expect(result.dataSource).toBe('/api/news/digest');
        expect(result.responseTemplate).toBe('daily_digest');
        expect(result.requiredDataFields).toEqual(['user_phone', 'location']);
      });
    });

    describe('help_onboarding intent', () => {
      it('should route help_onboarding with no required fields', () => {
        const classification: IntentClassification = {
          intent: 'help_onboarding',
          confidence: 0.94,
          entities: {},
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('help_onboarding');
        expect(result.handler).toBe('helpHandler');
        expect(result.dataSource).toBe('/api/help/menu');
        expect(result.responseTemplate).toBe('help_menu');
        expect(result.requiredDataFields).toHaveLength(0);
        expect(result.requiredDataFields).toEqual([]);
      });

      it('should route help_onboarding even with extra entities', () => {
        const classification: IntentClassification = {
          intent: 'help_onboarding',
          confidence: 0.88,
          entities: { extra: 'data', another: 'field' },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('help_onboarding');
        expect(result.entities).toEqual({ extra: 'data', another: 'field' });
      });
    });

    // ============================================================================
    // routeMessage() - Unknown/Invalid Intent Tests
    // ============================================================================

    describe('unknown/invalid intent', () => {
      it('should fallback to unknown handler for unrecognized intent', () => {
        const classification: IntentClassification = {
          intent: 'nonexistent_intent' as BotIntent,
          confidence: 0.5,
          entities: { some: 'data' },
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('unknown');
        expect(result.handler).toBe('unknownHandler');
        expect(result.dataSource).toBe('/api/fallback');
        expect(result.responseTemplate).toBe('unknown_intent');
        expect(result.confidence).toBe(0);
        expect(result.entities).toEqual({ some: 'data' });
      });

      it('should preserve entities when falling back to unknown', () => {
        const entities = {
          user_input: 'some random text',
          timestamp: '2026-03-04',
        };

        const classification: IntentClassification = {
          intent: 'invalid_intent' as BotIntent,
          confidence: 0.3,
          entities,
        };

        const result = routeMessage(classification);

        expect(result.intent).toBe('unknown');
        expect(result.entities).toEqual(entities);
      });

      it('should have zero confidence for unknown intent', () => {
        const classification: IntentClassification = {
          intent: 'not_a_real_intent' as BotIntent,
          confidence: 0.99,
          entities: {},
        };

        const result = routeMessage(classification);

        expect(result.confidence).toBe(0);
      });

      it('should not have required fields for unknown intent', () => {
        const classification: IntentClassification = {
          intent: 'unhandled' as BotIntent,
          confidence: 0.5,
          entities: {},
        };

        const result = routeMessage(classification);

        expect(result.requiredDataFields).toEqual([]);
      });
    });

    describe('routeMessage() with low confidence', () => {
      it('should still route with low confidence score', () => {
        const classification: IntentClassification = {
          intent: 'search_businesses',
          confidence: 0.01,
          entities: {
            city: 'NYC',
            state: 'NY',
            category: 'restaurants',
          },
        };

        const result = routeMessage(classification);

        expect(result.confidence).toBe(0.01);
        expect(result.intent).toBe('search_businesses');
      });

      it('should route with zero confidence', () => {
        const classification: IntentClassification = {
          intent: 'job_search',
          confidence: 0,
          entities: { title: 'Manager', location: 'Remote', type: 'contract' },
        };

        const result = routeMessage(classification);

        expect(result.confidence).toBe(0);
        expect(result.intent).toBe('job_search');
      });

      it('should route with high confidence score', () => {
        const classification: IntentClassification = {
          intent: 'daily_digest',
          confidence: 1.0,
          entities: { user_phone: '+1-555-9999', location: 'Seattle' },
        };

        const result = routeMessage(classification);

        expect(result.confidence).toBe(1.0);
      });
    });
  });

  // ============================================================================
  // getRouteConfig() Tests
  // ============================================================================

  describe('getRouteConfig()', () => {
    it('should return config for valid search_businesses intent', () => {
      const config = getRouteConfig('search_businesses');

      expect(config).not.toBeNull();
      expect(config?.intent).toBe('search_businesses');
      expect(config?.handler).toBe('businessSearchHandler');
      expect(config?.dataSource).toBe('/api/businesses/search');
      expect(config?.responseTemplate).toBe('business_listing');
    });

    it('should return config for valid submit_business intent', () => {
      const config = getRouteConfig('submit_business');

      expect(config).not.toBeNull();
      expect(config?.intent).toBe('submit_business');
      expect(config?.requiredDataFields).toEqual(['name', 'category', 'address', 'phone', 'hours']);
    });

    it('should return config for valid job_search intent', () => {
      const config = getRouteConfig('job_search');

      expect(config).not.toBeNull();
      expect(config?.intent).toBe('job_search');
    });

    it('should return config for valid immigration_alert intent', () => {
      const config = getRouteConfig('immigration_alert');

      expect(config).not.toBeNull();
      expect(config?.handler).toBe('immigrationAlertHandler');
    });

    it('should return config for valid deals_nearby intent', () => {
      const config = getRouteConfig('deals_nearby');

      expect(config).not.toBeNull();
      expect(config?.intent).toBe('deals_nearby');
    });

    it('should return config for valid submit_deal intent', () => {
      const config = getRouteConfig('submit_deal');

      expect(config).not.toBeNull();
      expect(config?.requiredDataFields).toHaveLength(4);
    });

    it('should return config for valid consultancy_rating intent', () => {
      const config = getRouteConfig('consultancy_rating');

      expect(config).not.toBeNull();
      expect(config?.handler).toBe('consultancyRatingHandler');
    });

    it('should return config for valid event_info intent', () => {
      const config = getRouteConfig('event_info');

      expect(config).not.toBeNull();
      expect(config?.intent).toBe('event_info');
    });

    it('should return config for valid daily_digest intent', () => {
      const config = getRouteConfig('daily_digest');

      expect(config).not.toBeNull();
      expect(config?.dataSource).toBe('/api/news/digest');
    });

    it('should return config for valid help_onboarding intent', () => {
      const config = getRouteConfig('help_onboarding');

      expect(config).not.toBeNull();
      expect(config?.requiredDataFields).toEqual([]);
    });

    it('should return config for unknown intent', () => {
      const config = getRouteConfig('unknown');

      expect(config).not.toBeNull();
      expect(config?.intent).toBe('unknown');
      expect(config?.handler).toBe('unknownHandler');
    });

    it('should return null for invalid intent', () => {
      const config = getRouteConfig('invalid_intent' as BotIntent);

      expect(config).toBeNull();
    });

    it('should return null for non-existent intent', () => {
      const config = getRouteConfig('made_up_intent' as BotIntent);

      expect(config).toBeNull();
    });

    it('should return config with all required properties', () => {
      const config = getRouteConfig('search_businesses');

      expect(config).toHaveProperty('intent');
      expect(config).toHaveProperty('handler');
      expect(config).toHaveProperty('dataSource');
      expect(config).toHaveProperty('requiredDataFields');
      expect(config).toHaveProperty('responseTemplate');
      expect(config).toHaveProperty('description');
    });
  });

  // ============================================================================
  // getAllRouteConfigs() Tests
  // ============================================================================

  describe('getAllRouteConfigs()', () => {
    it('should return all 11 route configurations', () => {
      const configs = getAllRouteConfigs();

      expect(configs).toHaveLength(11);
    });

    it('should return array of RouteConfig objects', () => {
      const configs = getAllRouteConfigs();

      configs.forEach((config) => {
        expect(config).toHaveProperty('intent');
        expect(config).toHaveProperty('handler');
        expect(config).toHaveProperty('dataSource');
        expect(config).toHaveProperty('requiredDataFields');
        expect(config).toHaveProperty('responseTemplate');
        expect(config).toHaveProperty('description');
      });
    });

    it('should contain search_businesses configuration', () => {
      const configs = getAllRouteConfigs();
      const searchBusinessesConfig = configs.find((c) => c.intent === 'search_businesses');

      expect(searchBusinessesConfig).toBeDefined();
      expect(searchBusinessesConfig?.handler).toBe('businessSearchHandler');
    });

    it('should contain submit_business configuration', () => {
      const configs = getAllRouteConfigs();
      const submitConfig = configs.find((c) => c.intent === 'submit_business');

      expect(submitConfig).toBeDefined();
      expect(submitConfig?.requiredDataFields).toHaveLength(5);
    });

    it('should contain job_search configuration', () => {
      const configs = getAllRouteConfigs();
      const jobConfig = configs.find((c) => c.intent === 'job_search');

      expect(jobConfig).toBeDefined();
    });

    it('should contain immigration_alert configuration', () => {
      const configs = getAllRouteConfigs();
      const immigrationConfig = configs.find((c) => c.intent === 'immigration_alert');

      expect(immigrationConfig).toBeDefined();
    });

    it('should contain deals_nearby configuration', () => {
      const configs = getAllRouteConfigs();
      const dealsConfig = configs.find((c) => c.intent === 'deals_nearby');

      expect(dealsConfig).toBeDefined();
    });

    it('should contain submit_deal configuration', () => {
      const configs = getAllRouteConfigs();
      const submitDealConfig = configs.find((c) => c.intent === 'submit_deal');

      expect(submitDealConfig).toBeDefined();
    });

    it('should contain consultancy_rating configuration', () => {
      const configs = getAllRouteConfigs();
      const consultancyConfig = configs.find((c) => c.intent === 'consultancy_rating');

      expect(consultancyConfig).toBeDefined();
    });

    it('should contain event_info configuration', () => {
      const configs = getAllRouteConfigs();
      const eventConfig = configs.find((c) => c.intent === 'event_info');

      expect(eventConfig).toBeDefined();
    });

    it('should contain daily_digest configuration', () => {
      const configs = getAllRouteConfigs();
      const digestConfig = configs.find((c) => c.intent === 'daily_digest');

      expect(digestConfig).toBeDefined();
    });

    it('should contain help_onboarding configuration', () => {
      const configs = getAllRouteConfigs();
      const helpConfig = configs.find((c) => c.intent === 'help_onboarding');

      expect(helpConfig).toBeDefined();
      expect(helpConfig?.requiredDataFields).toEqual([]);
    });

    it('should contain unknown configuration', () => {
      const configs = getAllRouteConfigs();
      const unknownConfig = configs.find((c) => c.intent === 'unknown');

      expect(unknownConfig).toBeDefined();
      expect(unknownConfig?.handler).toBe('unknownHandler');
    });

    it('should not contain duplicate intents', () => {
      const configs = getAllRouteConfigs();
      const intents = configs.map((c) => c.intent);
      const uniqueIntents = new Set(intents);

      expect(intents).toHaveLength(uniqueIntents.size);
    });

    it('should have all handlers properly defined', () => {
      const configs = getAllRouteConfigs();

      configs.forEach((config) => {
        expect(config.handler).toBeTruthy();
        expect(typeof config.handler).toBe('string');
        expect(config.handler.length).toBeGreaterThan(0);
      });
    });

    it('should have all dataSources properly defined', () => {
      const configs = getAllRouteConfigs();

      configs.forEach((config) => {
        expect(config.dataSource).toBeTruthy();
        expect(typeof config.dataSource).toBe('string');
        expect(config.dataSource.startsWith('/api')).toBe(true);
      });
    });

    it('should have all responseTemplates properly defined', () => {
      const configs = getAllRouteConfigs();

      configs.forEach((config) => {
        expect(config.responseTemplate).toBeTruthy();
        expect(typeof config.responseTemplate).toBe('string');
      });
    });
  });

  // ============================================================================
  // hasRequiredData() Tests
  // ============================================================================

  describe('hasRequiredData()', () => {
    describe('with all required fields present', () => {
      it('should return true for search_businesses with all fields', () => {
        const entities = {
          city: 'New York',
          state: 'NY',
          category: 'restaurants',
        };

        const result = hasRequiredData('search_businesses', entities);

        expect(result).toBe(true);
      });

      it('should return true for submit_business with all required fields', () => {
        const entities = {
          name: 'My Business',
          category: 'retail',
          address: '123 Main St',
          phone: '555-1234',
          hours: '9-5',
        };

        const result = hasRequiredData('submit_business', entities);

        expect(result).toBe(true);
      });

      it('should return true for job_search with all required fields', () => {
        const entities = {
          title: 'Software Engineer',
          location: 'San Francisco',
          type: 'full-time',
        };

        const result = hasRequiredData('job_search', entities);

        expect(result).toBe(true);
      });

      it('should return true for immigration_alert with all required fields', () => {
        const entities = {
          visa_type: 'H1B',
          email: 'user@example.com',
        };

        const result = hasRequiredData('immigration_alert', entities);

        expect(result).toBe(true);
      });

      it('should return true for consultancy_rating with all required fields', () => {
        const entities = {
          consultancy_name: 'ABC Consultancy',
          rating: '5',
          review: 'Excellent service',
        };

        const result = hasRequiredData('consultancy_rating', entities);

        expect(result).toBe(true);
      });

      it('should return true for daily_digest with all required fields', () => {
        const entities = {
          user_phone: '+1-555-0123',
          location: 'Austin',
        };

        const result = hasRequiredData('daily_digest', entities);

        expect(result).toBe(true);
      });

      it('should return true for help_onboarding with no required fields', () => {
        const entities = {};

        const result = hasRequiredData('help_onboarding', entities);

        expect(result).toBe(true);
      });
    });

    describe('with field name variations (underscore, space, concatenated)', () => {
      it('should match fields with underscores (original format)', () => {
        const entities = {
          visa_type: 'H1B',
          email: 'test@example.com',
        };

        const result = hasRequiredData('immigration_alert', entities);

        expect(result).toBe(true);
      });

      it('should match fields with spaces (space-separated format)', () => {
        const entities = {
          'visa type': 'H1B',
          email: 'test@example.com',
        };

        const result = hasRequiredData('immigration_alert', entities);

        expect(result).toBe(true);
      });

      it('should match fields without separators (concatenated format)', () => {
        const entities = {
          visatype: 'H1B',
          email: 'test@example.com',
        };

        const result = hasRequiredData('immigration_alert', entities);

        expect(result).toBe(true);
      });

      it('should handle mixed field name variations', () => {
        const entities = {
          'user phone': '+1-555-0123',
          location: 'Boston',
        };

        const result = hasRequiredData('daily_digest', entities);

        expect(result).toBe(true);
      });

      it('should handle concatenated field names for consultancy_name', () => {
        const entities = {
          consultancyname: 'XYZ Consultancy',
          rating: '4',
          review: 'Good service',
        };

        const result = hasRequiredData('consultancy_rating', entities);

        expect(result).toBe(true);
      });

      it('should accept space-separated business name', () => {
        const entities = {
          'consultancy name': 'ABC Consultancy',
          rating: '5',
          review: 'Excellent',
        };

        const result = hasRequiredData('consultancy_rating', entities);

        expect(result).toBe(true);
      });
    });

    describe('with missing required fields', () => {
      it('should return false for search_businesses with missing city', () => {
        const entities = {
          state: 'NY',
          category: 'restaurants',
        };

        const result = hasRequiredData('search_businesses', entities);

        expect(result).toBe(false);
      });

      it('should return false for search_businesses with missing state', () => {
        const entities = {
          city: 'New York',
          category: 'restaurants',
        };

        const result = hasRequiredData('search_businesses', entities);

        expect(result).toBe(false);
      });

      it('should return false for search_businesses with missing category', () => {
        const entities = {
          city: 'New York',
          state: 'NY',
        };

        const result = hasRequiredData('search_businesses', entities);

        expect(result).toBe(false);
      });

      it('should return false for submit_business missing name', () => {
        const entities = {
          category: 'retail',
          address: '123 Main St',
          phone: '555-1234',
          hours: '9-5',
        };

        const result = hasRequiredData('submit_business', entities);

        expect(result).toBe(false);
      });

      it('should return false for submit_business missing address', () => {
        const entities = {
          name: 'My Business',
          category: 'retail',
          phone: '555-1234',
          hours: '9-5',
        };

        const result = hasRequiredData('submit_business', entities);

        expect(result).toBe(false);
      });

      it('should return false for submit_business missing multiple fields', () => {
        const entities = {
          name: 'My Business',
          category: 'retail',
        };

        const result = hasRequiredData('submit_business', entities);

        expect(result).toBe(false);
      });

      it('should return false for job_search with only title', () => {
        const entities = {
          title: 'Manager',
        };

        const result = hasRequiredData('job_search', entities);

        expect(result).toBe(false);
      });

      it('should return false for immigration_alert with only visa_type', () => {
        const entities = {
          visa_type: 'H1B',
        };

        const result = hasRequiredData('immigration_alert', entities);

        expect(result).toBe(false);
      });

      it('should return false for daily_digest with only user_phone', () => {
        const entities = {
          user_phone: '+1-555-0123',
        };

        const result = hasRequiredData('daily_digest', entities);

        expect(result).toBe(false);
      });
    });

    describe('with invalid intent', () => {
      it('should return false for non-existent intent', () => {
        const entities = {
          some: 'field',
        };

        const result = hasRequiredData('invalid_intent' as BotIntent, entities);

        expect(result).toBe(false);
      });

      it('should return true for unknown intent', () => {
        const entities = {};

        const result = hasRequiredData('unknown', entities);

        expect(result).toBe(true);
      });
    });

    describe('with extra fields present', () => {
      it('should return true if all required fields are present with extras', () => {
        const entities = {
          city: 'Boston',
          state: 'MA',
          category: 'stores',
          extra_field: 'extra_value',
          another_extra: 'value',
        };

        const result = hasRequiredData('search_businesses', entities);

        expect(result).toBe(true);
      });

      it('should return true for submit_deal with extra fields', () => {
        const entities = {
          business: 'Tech Store',
          discount: '30%',
          description: 'Black Friday',
          expiry: '2026-11-30',
          source: 'facebook',
          promo_code: 'SAVE30',
        };

        const result = hasRequiredData('submit_deal', entities);

        expect(result).toBe(true);
      });
    });

    describe('with empty entities', () => {
      it('should return false for intent with required fields and empty entities', () => {
        const entities = {};

        const result = hasRequiredData('search_businesses', entities);

        expect(result).toBe(false);
      });

      it('should return true for help_onboarding with empty entities', () => {
        const entities = {};

        const result = hasRequiredData('help_onboarding', entities);

        expect(result).toBe(true);
      });
    });

    describe('with null/undefined values', () => {
      it('should treat empty string as missing field', () => {
        const entities = {
          city: '',
          state: 'NY',
          category: 'restaurants',
        };

        const result = hasRequiredData('search_businesses', entities);

        // Empty string is falsy, so it should be treated as missing
        expect(result).toBe(false);
      });

      it('should handle fields with false-y values', () => {
        const entities = {
          city: '0',
          state: 'NY',
          category: 'restaurants',
        };

        const result = hasRequiredData('search_businesses', entities);

        // '0' is a string, so it's truthy
        expect(result).toBe(true);
      });
    });
  });

  // ============================================================================
  // getMissingRequiredData() Tests
  // ============================================================================

  describe('getMissingRequiredData()', () => {
    describe('with all required fields present', () => {
      it('should return empty array for search_businesses with all fields', () => {
        const entities = {
          city: 'New York',
          state: 'NY',
          category: 'restaurants',
        };

        const missing = getMissingRequiredData('search_businesses', entities);

        expect(missing).toEqual([]);
      });

      it('should return empty array for submit_business with all fields', () => {
        const entities = {
          name: 'My Business',
          category: 'retail',
          address: '123 Main St',
          phone: '555-1234',
          hours: '9-5',
        };

        const missing = getMissingRequiredData('submit_business', entities);

        expect(missing).toEqual([]);
      });
    });

    describe('with single missing field', () => {
      it('should return city for search_businesses missing city', () => {
        const entities = {
          state: 'CA',
          category: 'restaurants',
        };

        const missing = getMissingRequiredData('search_businesses', entities);

        expect(missing).toEqual(['city']);
      });

      it('should return state for search_businesses missing state', () => {
        const entities = {
          city: 'Los Angeles',
          category: 'restaurants',
        };

        const missing = getMissingRequiredData('search_businesses', entities);

        expect(missing).toEqual(['state']);
      });

      it('should return category for search_businesses missing category', () => {
        const entities = {
          city: 'Chicago',
          state: 'IL',
        };

        const missing = getMissingRequiredData('search_businesses', entities);

        expect(missing).toEqual(['category']);
      });

      it('should return visa_type for immigration_alert missing visa_type', () => {
        const entities = {
          email: 'user@example.com',
        };

        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(missing).toEqual(['visa_type']);
      });

      it('should return email for immigration_alert missing email', () => {
        const entities = {
          visa_type: 'L1',
        };

        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(missing).toEqual(['email']);
      });
    });

    describe('with multiple missing fields', () => {
      it('should return all missing fields for search_businesses', () => {
        const entities = {
          city: 'Seattle',
        };

        const missing = getMissingRequiredData('search_businesses', entities);

        expect(missing).toHaveLength(2);
        expect(missing).toContain('state');
        expect(missing).toContain('category');
      });

      it('should return all missing fields for submit_business', () => {
        const entities = {
          name: 'Store',
        };

        const missing = getMissingRequiredData('submit_business', entities);

        expect(missing).toHaveLength(4);
        expect(missing).toContain('category');
        expect(missing).toContain('address');
        expect(missing).toContain('phone');
        expect(missing).toContain('hours');
      });

      it('should return missing fields for job_search', () => {
        const entities = {
          location: 'Remote',
        };

        const missing = getMissingRequiredData('job_search', entities);

        expect(missing).toEqual(['title', 'type']);
      });

      it('should return missing fields for submit_deal', () => {
        const entities = {
          discount: '25%',
        };

        const missing = getMissingRequiredData('submit_deal', entities);

        expect(missing).toHaveLength(3);
        expect(missing).toContain('business');
        expect(missing).toContain('description');
        expect(missing).toContain('expiry');
      });
    });

    describe('with all fields missing', () => {
      it('should return all required fields for search_businesses', () => {
        const entities = {};

        const missing = getMissingRequiredData('search_businesses', entities);

        expect(missing).toEqual(['city', 'state', 'category']);
      });

      it('should return all required fields for submit_business', () => {
        const entities = {};

        const missing = getMissingRequiredData('submit_business', entities);

        expect(missing).toEqual(['name', 'category', 'address', 'phone', 'hours']);
      });

      it('should return all required fields for immigration_alert', () => {
        const entities = {};

        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(missing).toEqual(['visa_type', 'email']);
      });

      it('should return all required fields for consultancy_rating', () => {
        const entities = {};

        const missing = getMissingRequiredData('consultancy_rating', entities);

        expect(missing).toEqual(['consultancy_name', 'rating', 'review']);
      });
    });

    describe('with field name variations', () => {
      it('should not return field as missing if space-separated variation exists', () => {
        const entities = {
          'visa type': 'H1B',
          email: 'test@example.com',
        };

        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(missing).toEqual([]);
      });

      it('should not return field as missing if concatenated variation exists', () => {
        const entities = {
          visatype: 'H1B',
          email: 'test@example.com',
        };

        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(missing).toEqual([]);
      });

      it('should return field as missing if no variation exists', () => {
        const entities = {
          'other field': 'value',
        };

        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(missing).toContain('visa_type');
        expect(missing).toContain('email');
      });

      it('should not return user_phone if user phone exists', () => {
        const entities = {
          'user phone': '+1-555-1234',
          location: 'Denver',
        };

        const missing = getMissingRequiredData('daily_digest', entities);

        expect(missing).toEqual([]);
      });
    });

    describe('with invalid intent', () => {
      it('should return empty array for invalid intent', () => {
        const entities = { some: 'field' };

        const missing = getMissingRequiredData('nonexistent_intent' as BotIntent, entities);

        expect(missing).toEqual([]);
      });

      it('should return empty array for unknown intent', () => {
        const entities = {};

        const missing = getMissingRequiredData('unknown', entities);

        expect(missing).toEqual([]);
      });
    });

    describe('with help_onboarding (no required fields)', () => {
      it('should return empty array for help_onboarding', () => {
        const entities = {};

        const missing = getMissingRequiredData('help_onboarding', entities);

        expect(missing).toEqual([]);
      });

      it('should return empty array even with entities present', () => {
        const entities = {
          some: 'data',
          extra: 'field',
        };

        const missing = getMissingRequiredData('help_onboarding', entities);

        expect(missing).toEqual([]);
      });
    });

    describe('field order preservation', () => {
      it('should return missing fields in defined order', () => {
        const entities = {};

        const missing = getMissingRequiredData('submit_business', entities);

        expect(missing).toEqual(['name', 'category', 'address', 'phone', 'hours']);
      });

      it('should return missing fields in order for submit_deal', () => {
        const entities = {};

        const missing = getMissingRequiredData('submit_deal', entities);

        expect(missing).toEqual(['business', 'discount', 'description', 'expiry']);
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration: routeMessage + hasRequiredData + getMissingRequiredData', () => {
    it('should handle complete workflow for valid request', () => {
      const classification: IntentClassification = {
        intent: 'search_businesses',
        confidence: 0.92,
        entities: {
          city: 'Portland',
          state: 'OR',
          category: 'shops',
        },
      };

      const route = routeMessage(classification);
      const hasAllData = hasRequiredData(route.intent, route.entities);
      const missing = getMissingRequiredData(route.intent, route.entities);

      expect(route.intent).toBe('search_businesses');
      expect(hasAllData).toBe(true);
      expect(missing).toEqual([]);
    });

    it('should handle workflow for incomplete request', () => {
      const classification: IntentClassification = {
        intent: 'submit_business',
        confidence: 0.85,
        entities: {
          name: 'New Shop',
          category: 'retail',
        },
      };

      const route = routeMessage(classification);
      const hasAllData = hasRequiredData(route.intent, route.entities);
      const missing = getMissingRequiredData(route.intent, route.entities);

      expect(route.intent).toBe('submit_business');
      expect(hasAllData).toBe(false);
      expect(missing).toEqual(['address', 'phone', 'hours']);
    });

    it('should handle workflow for unknown intent', () => {
      const classification: IntentClassification = {
        intent: 'unknown_action' as BotIntent,
        confidence: 0.3,
        entities: { user_input: 'random text' },
      };

      const route = routeMessage(classification);
      const hasAllData = hasRequiredData(route.intent, route.entities);

      expect(route.intent).toBe('unknown');
      expect(hasAllData).toBe(true); // unknown has no required fields
    });
  });

  // ============================================================================
  // Edge Cases and Special Scenarios
  // ============================================================================

  describe('Edge Cases', () => {
    describe('entities with special characters and values', () => {
      it('should handle entities with special characters', () => {
        const entities = {
          city: "New York's City",
          state: 'NY/New York',
          category: 'food & beverages',
        };

        const result = routeMessage({
          intent: 'search_businesses',
          confidence: 0.8,
          entities,
        });

        expect(result.entities).toEqual(entities);
      });

      it('should handle entities with numbers and symbols', () => {
        const entities = {
          name: 'ABC 123 Store',
          category: '@retail',
          address: '456-Oak-Ave #100',
          phone: '+1-555-1234',
          hours: '9:00-17:00',
        };

        const hasData = hasRequiredData('submit_business', entities);

        expect(hasData).toBe(true);
      });
    });

    describe('case sensitivity', () => {
      it('should be case-sensitive for entity keys', () => {
        const entities = {
          City: 'Boston', // capital C
          state: 'MA',
          category: 'restaurants',
        };

        const hasData = hasRequiredData('search_businesses', entities);

        // Should fail because 'City' !== 'city'
        expect(hasData).toBe(false);
      });

      it('should not match different casing for required field names', () => {
        const missing = getMissingRequiredData('search_businesses', {
          CITY: 'Boston',
          STATE: 'MA',
          CATEGORY: 'restaurants',
        });

        expect(missing).toHaveLength(3);
      });
    });

    describe('whitespace handling', () => {
      it('should accept entities with extra whitespace in values', () => {
        const entities = {
          city: '  New York  ',
          state: 'NY',
          category: 'restaurants',
        };

        const hasData = hasRequiredData('search_businesses', entities);

        expect(hasData).toBe(true);
      });
    });

    describe('duplicate field variations in entities', () => {
      it('should handle when both underscore and space variations exist', () => {
        const entities = {
          visa_type: 'H1B',
          'visa type': 'H1B',
          visatype: 'H1B',
          email: 'user@example.com',
        };

        const hasData = hasRequiredData('immigration_alert', entities);
        const missing = getMissingRequiredData('immigration_alert', entities);

        expect(hasData).toBe(true);
        expect(missing).toEqual([]);
      });
    });

    describe('confidence boundary values', () => {
      it('should handle very small confidence values', () => {
        const result = routeMessage({
          intent: 'job_search',
          confidence: 0.000001,
          entities: { title: 'Job', location: 'NYC', type: 'full-time' },
        });

        expect(result.confidence).toBe(0.000001);
      });

      it('should handle confidence of exactly 1', () => {
        const result = routeMessage({
          intent: 'daily_digest',
          confidence: 1,
          entities: { user_phone: '555-1234', location: 'LA' },
        });

        expect(result.confidence).toBe(1);
      });
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety', () => {
    it('should return MessageRouteResult with correct shape', () => {
      const result = routeMessage({
        intent: 'search_businesses',
        confidence: 0.9,
        entities: { city: 'NYC', state: 'NY', category: 'food' },
      });

      const typeCheck: MessageRouteResult = result;

      expect(typeCheck.intent).toBeDefined();
      expect(typeCheck.handler).toBeDefined();
      expect(typeCheck.dataSource).toBeDefined();
      expect(typeCheck.requiredDataFields).toBeDefined();
      expect(typeCheck.responseTemplate).toBeDefined();
      expect(typeCheck.confidence).toBeDefined();
      expect(typeCheck.entities).toBeDefined();
    });

    it('should return RouteConfig with correct shape', () => {
      const config = getRouteConfig('job_search');

      if (config) {
        const typeCheck: RouteConfig = config;

        expect(typeCheck.intent).toBeDefined();
        expect(typeCheck.handler).toBeDefined();
        expect(typeCheck.dataSource).toBeDefined();
        expect(typeCheck.requiredDataFields).toBeDefined();
        expect(typeCheck.responseTemplate).toBeDefined();
        expect(typeCheck.description).toBeDefined();
      }
    });
  });
});
