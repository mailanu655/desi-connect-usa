/**
 * Application Constants
 *
 * Metro areas from Section 6.1 (City/State Pages) and
 * content seeding targets from Section 10.
 */

/** Top Indian diaspora metro areas for city/state pages */
export const METRO_AREAS = [
  { city: 'New York', state: 'NY', slug: 'nyc' },
  { city: 'San Francisco Bay Area', state: 'CA', slug: 'bay-area' },
  { city: 'Dallas-Fort Worth', state: 'TX', slug: 'dallas' },
  { city: 'Chicago', state: 'IL', slug: 'chicago' },
  { city: 'Atlanta', state: 'GA', slug: 'atlanta' },
  { city: 'Houston', state: 'TX', slug: 'houston' },
  { city: 'Seattle', state: 'WA', slug: 'seattle' },
  { city: 'Los Angeles', state: 'CA', slug: 'la' },
  { city: 'New Jersey', state: 'NJ', slug: 'nj' },
  { city: 'Washington DC', state: 'DC', slug: 'dc' },
] as const;

/**
 * Content Seeding Targets (Section 10)
 */
export const SEED_TARGETS = {
  businesses: 100,
  jobs: 50,
  articles: 30,
  events: 20,
  deals: 15,
  discussions: 25,
} as const;

/** Default pagination limits */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  WHATSAPP_RESULTS_LIMIT: 5,
} as const;

/** Tavily fetch intervals (Section 4.3) */
export const TAVILY = {
  FETCH_INTERVAL_HOURS: 4,
  MAX_RESULTS_PER_QUERY: 10,
  SEARCH_TOPICS: [
    'USCIS visa bulletin updates',
    'H-1B lottery news',
    'Indian community events',
    'Indian restaurant openings',
    'desi business deals',
    'immigration policy changes',
  ],
} as const;

/** WhatsApp session config (Section 7.2) */
export const WHATSAPP = {
  SESSION_TIMEOUT_MINUTES: 30,
  META_SESSION_WINDOW_HOURS: 24,
  DAILY_DIGEST_HOUR: 8, // 8 AM local time
  MAX_MESSAGE_LENGTH: 4096,
  MAX_LIST_ITEMS: 10,
  MAX_BUTTON_OPTIONS: 3,
} as const;

/** Teable table names - mapped from env vars */
export const TEABLE_TABLES = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  JOBS: 'jobs',
  NEWS: 'news',
  DEALS: 'deals',
  CONSULTANCIES: 'consultancies',
  EVENTS: 'events',
  REVIEWS: 'reviews',
} as const;

/** HTTP status codes */
export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
