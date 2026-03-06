/**
 * ResponseBuilder Tests
 *
 * Tests response formatting for all WhatsApp intents.
 * Repositories are fully mocked — we're testing the middleware layer in isolation.
 */

import { ResponseBuilder } from '@desi-connect/middleware';
import type { IntentClassification, BotIntent, Business, Job, Deal, Event } from '@desi-connect/shared';
import type { Repositories } from '@desi-connect/database';

// ── Mock Factories ──────────────────────────────────────────

function mockBusiness(overrides: Record<string, unknown> = {}): Business {
  return {
    business_id: 'biz-1',
    name: 'Taj Palace',
    category: 'restaurant',
    description: 'Authentic Indian cuisine',
    address: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zip_code: '75001',
    phone: '+19725551234',
    email: null,
    website_url: null,
    hours: null,
    photo_urls: [],
    latitude: null,
    longitude: null,
    average_rating: 4.5,
    review_count: 10,
    status: 'approved',
    submitted_by: null,
    submission_source: 'website',
    is_verified: true,
    is_premium: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Business;
}

function mockJob(overrides: Record<string, unknown> = {}): Job {
  return {
    job_id: 'job-1',
    title: 'Data Engineer',
    company_name: 'TechCorp',
    description: 'Looking for a data engineer',
    requirements: 'Python, SQL, Spark',
    city: 'Plano',
    state: 'TX',
    is_remote: false,
    job_type: 'full_time',
    experience_level: 'mid',
    salary_min: 90000,
    salary_max: 130000,
    salary_currency: 'USD',
    h1b_sponsor: true,
    opt_friendly: true,
    consultancy_id: null,
    apply_url: null,
    apply_email: null,
    status: 'active',
    posted_by: null,
    submission_source: 'website',
    expires_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Job;
}

function mockDeal(overrides: Record<string, unknown> = {}): Deal {
  return {
    deal_id: 'deal-1',
    business_id: 'biz-1',
    business_name: 'Spice Market',
    title: '20% off all groceries',
    description: 'Valid this weekend only',
    deal_type: 'percentage_off',
    discount_value: '20',
    coupon_code: 'SAVE20',
    terms: null,
    image_url: null,
    city: 'Dallas',
    state: 'TX',
    status: 'active',
    submitted_by: null,
    submission_source: 'website',
    starts_at: '2026-01-01T00:00:00Z',
    expires_at: '2026-04-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Deal;
}

function mockEvent(overrides: Record<string, unknown> = {}): Event {
  return {
    event_id: 'evt-1',
    title: 'Holi Festival',
    description: 'Celebrate Holi with us',
    category: 'cultural',
    venue_name: 'Community Park',
    address: '456 Park Ave',
    city: 'Dallas',
    state: 'TX',
    is_virtual: false,
    virtual_url: null,
    image_url: null,
    organizer_name: null,
    organizer_contact: null,
    ticket_url: null,
    is_free: true,
    price: null,
    starts_at: '2026-03-15T18:00:00Z',
    ends_at: '2026-03-15T22:00:00Z',
    rsvp_count: 0,
    status: 'upcoming',
    submitted_by: null,
    submission_source: 'website',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Event;
}

function makeClassification(
  intent: BotIntent,
  entities: Record<string, string> = {},
): IntentClassification {
  return {
    intent,
    confidence: 0.9,
    entities,
    raw_message: `test message for ${intent}`,
  };
}

function createMockRepos(): Repositories {
  const mockRepo = () => ({
    list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    create: jest.fn().mockResolvedValue({}),
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

describe('ResponseBuilder', () => {
  let builder: ResponseBuilder;
  let repos: Repositories;

  beforeEach(() => {
    repos = createMockRepos();
    builder = new ResponseBuilder(repos, { maxSearchResults: 5 });
  });

  // ── Help / Onboarding ─────────────────────────────────────

  describe('help_onboarding', () => {
    it('should return a welcome message with menu of capabilities', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('help_onboarding'));
      expect(result.to).toBe('+1234567890');
      expect(result.body).toContain('Namaste');
      expect(result.body).toContain('Find Businesses');
      expect(result.body).toContain('Search Jobs');
      expect(result.body).toContain('Browse Deals');
      expect(result.body).toContain('Events');
      expect(result.body).toContain('Immigration');
    });
  });

  // ── Search Businesses ─────────────────────────────────────

  describe('search_businesses', () => {
    it('should return business listings when found', async () => {
      (repos.businesses.list as jest.Mock).mockResolvedValue({
        data: [mockBusiness(), mockBusiness({ business_id: 'biz-2', name: 'Spice Garden' })],
        total: 2,
      });

      const result = await builder.buildResponse(
        '+1234567890',
        makeClassification('search_businesses', { location: 'Dallas', category: 'restaurant' }),
      );

      expect(result.body).toContain('Taj Palace');
      expect(result.body).toContain('Spice Garden');
      expect(result.body).toContain('Dallas');
    });

    it('should return no-results message when empty', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(result.body).toContain('No businesses found');
    });

    it('should format business with rating stars', async () => {
      (repos.businesses.list as jest.Mock).mockResolvedValue({
        data: [mockBusiness({ average_rating: 4.5 })],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(result.body).toContain('⭐');
      expect(result.body).toContain('4.5');
    });

    it('should show "No ratings yet" for unrated businesses', async () => {
      (repos.businesses.list as jest.Mock).mockResolvedValue({
        data: [mockBusiness({ average_rating: undefined as any })],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(result.body).toContain('No ratings yet');
    });

    it('should include website link in footer', async () => {
      (repos.businesses.list as jest.Mock).mockResolvedValue({
        data: [mockBusiness()],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(result.body).toContain('desiconnectusa.com/businesses');
    });

    it('should handle repository errors gracefully', async () => {
      (repos.businesses.list as jest.Mock).mockRejectedValue(new Error('DB error'));
      const result = await builder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(result.body).toContain('Sorry');
    });
  });

  // ── Job Search ────────────────────────────────────────────

  describe('job_search', () => {
    it('should return job listings when found', async () => {
      (repos.jobs.list as jest.Mock).mockResolvedValue({
        data: [mockJob()],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('job_search'));
      expect(result.body).toContain('Data Engineer');
      expect(result.body).toContain('TechCorp');
      expect(result.body).toContain('H-1B Sponsor');
      expect(result.body).toContain('OPT Friendly');
    });

    it('should format salary range correctly', async () => {
      (repos.jobs.list as jest.Mock).mockResolvedValue({
        data: [mockJob({ salary_min: 90000, salary_max: 130000 })],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('job_search'));
      expect(result.body).toContain('$90,000');
      expect(result.body).toContain('$130,000');
    });

    it('should return no-results message when empty', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('job_search'));
      expect(result.body).toContain('No jobs found');
    });

    it('should handle repository errors gracefully', async () => {
      (repos.jobs.list as jest.Mock).mockRejectedValue(new Error('DB error'));
      const result = await builder.buildResponse('+1234567890', makeClassification('job_search'));
      expect(result.body).toContain('Sorry');
    });
  });

  // ── Deals Nearby ──────────────────────────────────────────

  describe('deals_nearby', () => {
    it('should return deal listings when found', async () => {
      (repos.deals.list as jest.Mock).mockResolvedValue({
        data: [mockDeal()],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('deals_nearby'));
      expect(result.body).toContain('20% off');
      expect(result.body).toContain('SAVE20');
    });

    it('should format expiry date', async () => {
      (repos.deals.list as jest.Mock).mockResolvedValue({
        data: [mockDeal({ expires_at: '2026-04-01T00:00:00Z' })],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('deals_nearby'));
      expect(result.body).toContain('Expires');
    });

    it('should return no-results message when empty', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('deals_nearby'));
      expect(result.body).toContain('No active deals');
    });

    it('should handle repository errors gracefully', async () => {
      (repos.deals.list as jest.Mock).mockRejectedValue(new Error('DB error'));
      const result = await builder.buildResponse('+1234567890', makeClassification('deals_nearby'));
      expect(result.body).toContain('Sorry');
    });
  });

  // ── Event Info ────────────────────────────────────────────

  describe('event_info', () => {
    it('should return event listings when found', async () => {
      (repos.events.list as jest.Mock).mockResolvedValue({
        data: [mockEvent()],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('event_info'));
      expect(result.body).toContain('Holi Festival');
      expect(result.body).toContain('Community Park');
      expect(result.body).toContain('Dallas');
    });

    it('should show TBD when venue is missing', async () => {
      (repos.events.list as jest.Mock).mockResolvedValue({
        data: [mockEvent({ venue_name: undefined as any })],
        total: 1,
      });

      const result = await builder.buildResponse('+1234567890', makeClassification('event_info'));
      expect(result.body).toContain('TBD');
    });

    it('should return no-results message when empty', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('event_info'));
      expect(result.body).toContain('No upcoming events');
    });

    it('should handle repository errors gracefully', async () => {
      (repos.events.list as jest.Mock).mockRejectedValue(new Error('DB error'));
      const result = await builder.buildResponse('+1234567890', makeClassification('event_info'));
      expect(result.body).toContain('Sorry');
    });
  });

  // ── Immigration Alert ─────────────────────────────────────

  describe('immigration_alert', () => {
    it('should return subscription confirmation with visa category', async () => {
      const result = await builder.buildResponse(
        '+1234567890',
        makeClassification('immigration_alert', { visa_category: 'H-1B' }),
      );
      expect(result.body).toContain('H-1B');
      expect(result.body).toContain('Immigration Alert');
    });

    it('should use "general immigration" when no category specified', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('immigration_alert'));
      expect(result.body).toContain('general immigration');
    });
  });

  // ── Daily Digest ──────────────────────────────────────────

  describe('daily_digest', () => {
    it('should return subscription confirmation', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('daily_digest'));
      expect(result.body).toContain('Daily Digest');
      expect(result.body).toContain('signed up');
      expect(result.body).toContain('STOP DIGEST');
    });
  });

  // ── Consultancy Rating ────────────────────────────────────

  describe('consultancy_rating', () => {
    it('should return rating prompt with star count when provided', async () => {
      const result = await builder.buildResponse(
        '+1234567890',
        makeClassification('consultancy_rating', { rating: '4' }),
      );
      expect(result.body).toContain('4-star');
      expect(result.body).toContain('Consultancy Rating');
    });

    it('should return generic rating prompt when no rating provided', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('consultancy_rating'));
      expect(result.body).toContain('Consultancy Rating');
      expect(result.body).toContain('rate');
    });
  });

  // ── Submit Business ───────────────────────────────────────

  describe('submit_business', () => {
    it('should return business submission prompt', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('submit_business'));
      expect(result.body).toContain('Add Your Business');
      expect(result.body).toContain('name');
    });
  });

  // ── Submit Deal ───────────────────────────────────────────

  describe('submit_deal', () => {
    it('should return deal submission prompt', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('submit_deal'));
      expect(result.body).toContain('Post a Deal');
      expect(result.body).toContain('business');
    });
  });

  // ── Unknown ───────────────────────────────────────────────

  describe('unknown', () => {
    it('should return a friendly fallback', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('unknown'));
      expect(result.body).toContain('not sure');
      expect(result.body).toContain('help');
    });
  });

  // ── Response Format ───────────────────────────────────────

  describe('response format', () => {
    it('should always include "to" field', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('help_onboarding'));
      expect(result.to).toBe('+1234567890');
    });

    it('should always include "body" field', async () => {
      const result = await builder.buildResponse('+1234567890', makeClassification('help_onboarding'));
      expect(typeof result.body).toBe('string');
      expect(result.body.length).toBeGreaterThan(0);
    });
  });

  // ── Config ────────────────────────────────────────────────

  describe('configuration', () => {
    it('should respect maxSearchResults config', async () => {
      const customBuilder = new ResponseBuilder(repos, { maxSearchResults: 3 });
      (repos.businesses.list as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await customBuilder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(repos.businesses.list).toHaveBeenCalledWith({ limit: 3 });
    });

    it('should use custom websiteBaseUrl', async () => {
      const customBuilder = new ResponseBuilder(repos, {
        websiteBaseUrl: 'https://custom.example.com',
      });
      (repos.businesses.list as jest.Mock).mockResolvedValue({
        data: [mockBusiness()],
        total: 1,
      });

      const result = await customBuilder.buildResponse('+1234567890', makeClassification('search_businesses'));
      expect(result.body).toContain('custom.example.com');
    });
  });
});
