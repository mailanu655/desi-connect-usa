/**
 * Constants Test Suite
 *
 * Validates application-wide constants defined in Section 6.1, 7.2, 10
 * of the implementation plan: metro areas, seed targets, pagination,
 * Tavily config, WhatsApp config, Teable table names, and HTTP codes.
 */

import {
  METRO_AREAS,
  SEED_TARGETS,
  PAGINATION,
  TAVILY,
  WHATSAPP,
  TEABLE_TABLES,
  HTTP,
} from '../../../packages/shared/src/constants';

describe('METRO_AREAS (Section 6.1 - City/State Pages)', () => {
  it('contains exactly 10 metro areas', () => {
    expect(METRO_AREAS).toHaveLength(10);
  });

  it('each entry has city, state, and slug', () => {
    for (const metro of METRO_AREAS) {
      expect(metro).toHaveProperty('city');
      expect(metro).toHaveProperty('state');
      expect(metro).toHaveProperty('slug');
      expect(typeof metro.city).toBe('string');
      expect(typeof metro.state).toBe('string');
      expect(typeof metro.slug).toBe('string');
    }
  });

  it('all slugs are unique', () => {
    const slugs = METRO_AREAS.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all slugs are URL-safe (lowercase, no spaces)', () => {
    for (const metro of METRO_AREAS) {
      expect(metro.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('includes key diaspora hubs', () => {
    const cities = METRO_AREAS.map((m) => m.city);
    expect(cities).toContain('New York');
    expect(cities).toContain('San Francisco Bay Area');
    expect(cities).toContain('Dallas-Fort Worth');
    expect(cities).toContain('Chicago');
  });
});

describe('SEED_TARGETS (Section 10 - Content Seeding)', () => {
  it('has all required content type targets', () => {
    expect(SEED_TARGETS).toHaveProperty('businesses');
    expect(SEED_TARGETS).toHaveProperty('jobs');
    expect(SEED_TARGETS).toHaveProperty('articles');
    expect(SEED_TARGETS).toHaveProperty('events');
    expect(SEED_TARGETS).toHaveProperty('deals');
    expect(SEED_TARGETS).toHaveProperty('discussions');
  });

  it('all targets are positive integers', () => {
    for (const [, value] of Object.entries(SEED_TARGETS)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });

  it('businesses have highest seed target', () => {
    expect(SEED_TARGETS.businesses).toBeGreaterThanOrEqual(SEED_TARGETS.jobs);
    expect(SEED_TARGETS.businesses).toBeGreaterThanOrEqual(SEED_TARGETS.articles);
  });
});

describe('PAGINATION', () => {
  it('DEFAULT_PAGE starts at 1', () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
  });

  it('DEFAULT_LIMIT is reasonable', () => {
    expect(PAGINATION.DEFAULT_LIMIT).toBeGreaterThan(0);
    expect(PAGINATION.DEFAULT_LIMIT).toBeLessThanOrEqual(PAGINATION.MAX_LIMIT);
  });

  it('WHATSAPP_RESULTS_LIMIT is smaller than DEFAULT_LIMIT (screen constraints)', () => {
    expect(PAGINATION.WHATSAPP_RESULTS_LIMIT).toBeLessThan(PAGINATION.DEFAULT_LIMIT);
  });

  it('MAX_LIMIT is 100', () => {
    expect(PAGINATION.MAX_LIMIT).toBe(100);
  });
});

describe('TAVILY (Section 4.3 - Content Aggregation)', () => {
  it('fetch interval is 4-6 hours', () => {
    expect(TAVILY.FETCH_INTERVAL_HOURS).toBeGreaterThanOrEqual(4);
    expect(TAVILY.FETCH_INTERVAL_HOURS).toBeLessThanOrEqual(6);
  });

  it('has search topics covering key community areas', () => {
    expect(TAVILY.SEARCH_TOPICS.length).toBeGreaterThanOrEqual(3);
    const topics = TAVILY.SEARCH_TOPICS.join(' ').toLowerCase();
    expect(topics).toContain('h-1b');
    expect(topics).toContain('immigration');
    expect(topics).toContain('indian community');
  });

  it('MAX_RESULTS_PER_QUERY is reasonable', () => {
    expect(TAVILY.MAX_RESULTS_PER_QUERY).toBeGreaterThan(0);
    expect(TAVILY.MAX_RESULTS_PER_QUERY).toBeLessThanOrEqual(20);
  });
});

describe('WHATSAPP (Section 7.2 - Bot Config)', () => {
  it('session timeout is 30 minutes', () => {
    expect(WHATSAPP.SESSION_TIMEOUT_MINUTES).toBe(30);
  });

  it('Meta session window is 24 hours', () => {
    expect(WHATSAPP.META_SESSION_WINDOW_HOURS).toBe(24);
  });

  it('daily digest at 8 AM', () => {
    expect(WHATSAPP.DAILY_DIGEST_HOUR).toBe(8);
  });

  it('max message length within WhatsApp limits (4096)', () => {
    expect(WHATSAPP.MAX_MESSAGE_LENGTH).toBeLessThanOrEqual(4096);
  });

  it('max list items within WhatsApp interactive message limit', () => {
    expect(WHATSAPP.MAX_LIST_ITEMS).toBeLessThanOrEqual(10);
  });

  it('max button options within WhatsApp button limit', () => {
    expect(WHATSAPP.MAX_BUTTON_OPTIONS).toBeLessThanOrEqual(3);
  });
});

describe('TEABLE_TABLES', () => {
  it('has all 8 core data model tables', () => {
    expect(Object.keys(TEABLE_TABLES)).toHaveLength(8);
    expect(TEABLE_TABLES.USERS).toBe('users');
    expect(TEABLE_TABLES.BUSINESSES).toBe('businesses');
    expect(TEABLE_TABLES.JOBS).toBe('jobs');
    expect(TEABLE_TABLES.NEWS).toBe('news');
    expect(TEABLE_TABLES.DEALS).toBe('deals');
    expect(TEABLE_TABLES.CONSULTANCIES).toBe('consultancies');
    expect(TEABLE_TABLES.EVENTS).toBe('events');
    expect(TEABLE_TABLES.REVIEWS).toBe('reviews');
  });
});

describe('HTTP Status Codes', () => {
  it('has standard success codes', () => {
    expect(HTTP.OK).toBe(200);
    expect(HTTP.CREATED).toBe(201);
  });

  it('has standard client error codes', () => {
    expect(HTTP.BAD_REQUEST).toBe(400);
    expect(HTTP.UNAUTHORIZED).toBe(401);
    expect(HTTP.FORBIDDEN).toBe(403);
    expect(HTTP.NOT_FOUND).toBe(404);
    expect(HTTP.CONFLICT).toBe(409);
  });

  it('has server error code', () => {
    expect(HTTP.INTERNAL_ERROR).toBe(500);
  });
});
