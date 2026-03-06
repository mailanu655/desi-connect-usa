/**
 * Tests for Search Utility Library
 * Week 13: Search & Discovery
 */
import type { SearchResult, SearchContentType, SearchParams, RecentSearch } from '@desi-connect/shared/src/types';
import {
  SEARCH_CONTENT_TYPES,
  ALL_CONTENT_TYPES,
  MAX_RECENT_SEARCHES,
  MAX_SUGGESTIONS,
  DEFAULT_SEARCH_LIMIT,
  MIN_QUERY_LENGTH,
  DEBOUNCE_MS,
  getContentTypeConfig,
  getContentTypeLabel,
  getContentTypePluralLabel,
  getContentTypeIcon,
  getContentTypeColor,
  sanitizeQuery,
  isValidQuery,
  extractSearchTerms,
  buildSearchQueryString,
  parseSearchQueryString,
  normalizeBusinessResult,
  normalizeJobResult,
  normalizeNewsResult,
  normalizeEventResult,
  normalizeDealResult,
  normalizeConsultancyResult,
  textMatch,
  calculateRelevanceScore,
  generateHighlights,
  enhanceResults,
  sortByRelevance,
  computeFacets,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  generateSuggestions,
  buildSearchUrl,
  getResultUrl,
  formatResultCount,
  formatSearchTime,
  paginateResults,
} from '@/lib/search';

// ─── Constants ──────────────────────────────────────────────────────

describe('Search Constants', () => {
  test('SEARCH_CONTENT_TYPES has correct structure', () => {
    expect(SEARCH_CONTENT_TYPES.length).toBeGreaterThanOrEqual(6);
    for (const config of SEARCH_CONTENT_TYPES) {
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('plural');
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('color');
    }
  });

  test('ALL_CONTENT_TYPES matches SEARCH_CONTENT_TYPES', () => {
    expect(ALL_CONTENT_TYPES).toEqual(SEARCH_CONTENT_TYPES.map((c) => c.type));
  });

  test('constants have expected values', () => {
    expect(MAX_RECENT_SEARCHES).toBe(10);
    expect(MAX_SUGGESTIONS).toBe(8);
    expect(DEFAULT_SEARCH_LIMIT).toBe(20);
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(DEBOUNCE_MS).toBe(300);
  });

  test('includes all expected content types', () => {
    const types = ALL_CONTENT_TYPES;
    expect(types).toContain('business');
    expect(types).toContain('job');
    expect(types).toContain('event');
    expect(types).toContain('deal');
    expect(types).toContain('news');
    expect(types).toContain('consultancy');
    expect(types).toContain('forum');
  });
});

// ─── Content Type Helpers ───────────────────────────────────────────

describe('Content Type Helpers', () => {
  test('getContentTypeConfig returns config for valid type', () => {
    const config = getContentTypeConfig('business');
    expect(config).toBeDefined();
    expect(config!.label).toBe('Business');
    expect(config!.plural).toBe('Businesses');
  });

  test('getContentTypeConfig returns undefined for invalid type', () => {
    expect(getContentTypeConfig('invalid' as SearchContentType)).toBeUndefined();
  });

  test('getContentTypeLabel returns label for valid type', () => {
    expect(getContentTypeLabel('job')).toBe('Job');
    expect(getContentTypeLabel('news')).toBe('News');
  });

  test('getContentTypeLabel returns type string for invalid type', () => {
    expect(getContentTypeLabel('unknown' as SearchContentType)).toBe('unknown');
  });

  test('getContentTypePluralLabel returns plural for valid type', () => {
    expect(getContentTypePluralLabel('business')).toBe('Businesses');
    expect(getContentTypePluralLabel('event')).toBe('Events');
  });

  test('getContentTypeIcon returns icon for valid type', () => {
    expect(getContentTypeIcon('business')).toBe('🏪');
    expect(getContentTypeIcon('job')).toBe('💼');
  });

  test('getContentTypeIcon returns default for invalid type', () => {
    expect(getContentTypeIcon('unknown' as SearchContentType)).toBe('🔍');
  });

  test('getContentTypeColor returns color for valid type', () => {
    expect(getContentTypeColor('business')).toBe('orange');
    expect(getContentTypeColor('job')).toBe('blue');
  });

  test('getContentTypeColor returns gray for invalid type', () => {
    expect(getContentTypeColor('unknown' as SearchContentType)).toBe('gray');
  });
});

// ─── Query Utilities ────────────────────────────────────────────────

describe('Query Utilities', () => {
  describe('sanitizeQuery', () => {
    test('trims whitespace', () => {
      expect(sanitizeQuery('  hello  ')).toBe('hello');
    });

    test('collapses multiple spaces', () => {
      expect(sanitizeQuery('hello   world')).toBe('hello world');
    });

    test('handles empty string', () => {
      expect(sanitizeQuery('')).toBe('');
    });

    test('handles whitespace-only string', () => {
      expect(sanitizeQuery('   ')).toBe('');
    });

    test('handles tabs and newlines', () => {
      expect(sanitizeQuery('hello\tworld\n')).toBe('hello world');
    });
  });

  describe('isValidQuery', () => {
    test('returns true for queries >= 2 characters', () => {
      expect(isValidQuery('ab')).toBe(true);
      expect(isValidQuery('hello')).toBe(true);
    });

    test('returns false for queries < 2 characters', () => {
      expect(isValidQuery('a')).toBe(false);
      expect(isValidQuery('')).toBe(false);
    });

    test('sanitizes before checking length', () => {
      expect(isValidQuery('  a  ')).toBe(false);
      expect(isValidQuery('  ab  ')).toBe(true);
    });
  });

  describe('extractSearchTerms', () => {
    test('splits and lowercases terms', () => {
      expect(extractSearchTerms('Hello World')).toEqual(['hello', 'world']);
    });

    test('returns empty array for empty string', () => {
      expect(extractSearchTerms('')).toEqual([]);
    });

    test('filters empty strings from result', () => {
      expect(extractSearchTerms('  hello   world  ')).toEqual(['hello', 'world']);
    });

    test('lowercases all terms', () => {
      expect(extractSearchTerms('UPPER MiXeD')).toEqual(['upper', 'mixed']);
    });
  });
});

// ─── URL Building & Parsing ─────────────────────────────────────────

describe('URL Building & Parsing', () => {
  describe('buildSearchQueryString', () => {
    test('builds query string with all params', () => {
      const params: SearchParams = {
        query: 'test',
        content_types: ['business', 'job'],
        city: 'Dallas',
        state: 'TX',
        category: 'restaurant',
        sort_by: 'relevance',
        sort_order: 'desc',
        page: 2,
        limit: 10,
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      };
      const qs = buildSearchQueryString(params);
      expect(qs).toContain('q=test');
      expect(qs).toContain('types=business%2Cjob');
      expect(qs).toContain('city=Dallas');
      expect(qs).toContain('state=TX');
      expect(qs).toContain('category=restaurant');
      expect(qs).toContain('sort=relevance');
      expect(qs).toContain('order=desc');
      expect(qs).toContain('page=2');
      expect(qs).toContain('limit=10');
      expect(qs).toContain('from=2024-01-01');
      expect(qs).toContain('to=2024-12-31');
    });

    test('omits empty/default params', () => {
      const params: SearchParams = { query: 'test' };
      const qs = buildSearchQueryString(params);
      expect(qs).toBe('q=test');
    });

    test('omits page=1', () => {
      const params: SearchParams = { query: 'test', page: 1 };
      const qs = buildSearchQueryString(params);
      expect(qs).not.toContain('page');
    });
  });

  describe('parseSearchQueryString', () => {
    test('parses all params from URLSearchParams', () => {
      const sp = new URLSearchParams('q=test&types=business,job&city=Dallas&state=TX&category=restaurant&sort=relevance&order=desc&page=2&limit=10&from=2024-01-01&to=2024-12-31');
      const params = parseSearchQueryString(sp);
      expect(params.query).toBe('test');
      expect(params.content_types).toEqual(['business', 'job']);
      expect(params.city).toBe('Dallas');
      expect(params.state).toBe('TX');
      expect(params.category).toBe('restaurant');
      expect(params.sort_by).toBe('relevance');
      expect(params.sort_order).toBe('desc');
      expect(params.page).toBe(2);
      expect(params.limit).toBe(10);
      expect(params.date_from).toBe('2024-01-01');
      expect(params.date_to).toBe('2024-12-31');
    });

    test('handles missing params', () => {
      const sp = new URLSearchParams('');
      const params = parseSearchQueryString(sp);
      expect(params.query).toBe('');
      expect(params.content_types).toBeUndefined();
      expect(params.city).toBeUndefined();
    });

    test('filters invalid content types', () => {
      const sp = new URLSearchParams('types=business,invalid,job');
      const params = parseSearchQueryString(sp);
      expect(params.content_types).toEqual(['business', 'job']);
    });

    test('handles invalid page number', () => {
      const sp = new URLSearchParams('page=abc');
      const params = parseSearchQueryString(sp);
      expect(params.page).toBe(1);
    });
  });

  describe('buildSearchUrl', () => {
    test('builds URL with params', () => {
      const url = buildSearchUrl({ query: 'test', page: 2 });
      expect(url).toBe('/search?q=test&page=2');
    });

    test('returns /search for empty params', () => {
      const url = buildSearchUrl({ query: '' });
      expect(url).toBe('/search');
    });
  });
});

// ─── Result Normalization ───────────────────────────────────────────

describe('Result Normalization', () => {
  test('normalizeBusinessResult', () => {
    const business = {
      business_id: 'b1',
      name: 'Test Restaurant',
      description: 'Great food',
      category: 'restaurant',
      city: 'Dallas',
      state: 'TX',
      rating: 4.5,
      review_count: 10,
      phone: '123-456-7890',
      status: 'active',
      image_url: 'http://example.com/img.jpg',
      created_at: '2024-01-01',
    };
    const result = normalizeBusinessResult(business as any);
    expect(result.id).toBe('b1');
    expect(result.type).toBe('business');
    expect(result.title).toBe('Test Restaurant');
    expect(result.description).toBe('Great food');
    expect(result.url).toBe('/businesses/b1');
    expect(result.city).toBe('Dallas');
    expect(result.state).toBe('TX');
    expect(result.rating).toBe(4.5);
    expect(result.category).toBe('restaurant');
    expect(result.metadata.phone).toBe('123-456-7890');
  });

  test('normalizeBusinessResult uses fallback description', () => {
    const business = {
      business_id: 'b2',
      name: 'Test',
      description: '',
      category: 'grocery',
      city: 'Houston',
      state: 'TX',
    };
    const result = normalizeBusinessResult(business as any);
    expect(result.description).toBe('grocery in Houston, TX');
  });

  test('normalizeJobResult', () => {
    const job = {
      job_id: 'j1',
      title: 'Software Engineer',
      company: 'TechCorp',
      description: 'Build stuff',
      city: 'Seattle',
      state: 'WA',
      job_type: 'full_time',
      posted_date: '2024-06-01',
      salary_min: 100000,
      salary_max: 150000,
      h1b_sponsor: true,
      opt_friendly: true,
      experience_level: 'mid',
    };
    const result = normalizeJobResult(job as any);
    expect(result.id).toBe('j1');
    expect(result.type).toBe('job');
    expect(result.title).toBe('Software Engineer at TechCorp');
    expect(result.url).toBe('/jobs?id=j1');
    expect(result.metadata.h1b_sponsor).toBe(true);
    expect(result.metadata.salary_min).toBe(100000);
  });

  test('normalizeNewsResult', () => {
    const article = {
      news_id: 'n1',
      title: 'Big News',
      summary: 'Summary here',
      image_url: 'http://img.com/a.jpg',
      city: 'NYC',
      state: 'NY',
      category: 'immigration',
      published_date: '2024-07-01',
      source_name: 'Times',
      view_count: 500,
      status: 'published',
    };
    const result = normalizeNewsResult(article as any);
    expect(result.id).toBe('n1');
    expect(result.type).toBe('news');
    expect(result.title).toBe('Big News');
    expect(result.url).toBe('/news/n1');
    expect(result.metadata.source_name).toBe('Times');
  });

  test('normalizeEventResult', () => {
    const event = {
      event_id: 'e1',
      title: 'Diwali Party',
      description: 'Celebrate together',
      image_url: 'http://img.com/e.jpg',
      city: 'Atlanta',
      state: 'GA',
      category: 'cultural',
      start_date: '2024-11-01',
      is_virtual: false,
      is_free: true,
      organizer: 'Community',
      venue_name: 'Hall A',
      rsvp_count: 200,
    };
    const result = normalizeEventResult(event as any);
    expect(result.id).toBe('e1');
    expect(result.type).toBe('event');
    expect(result.url).toBe('/events/e1');
    expect(result.metadata.is_free).toBe(true);
    expect(result.metadata.venue_name).toBe('Hall A');
  });

  test('normalizeDealResult', () => {
    const deal = {
      deal_id: 'd1',
      title: '20% off meals',
      description: 'Great discount',
      image_url: 'http://img.com/d.jpg',
      city: 'Chicago',
      state: 'IL',
      deal_type: 'restaurant',
      expiry_date: '2024-12-31',
      business_name: 'Spice House',
      discount_value: '20%',
      coupon_code: 'SAVE20',
      status: 'active',
    };
    const result = normalizeDealResult(deal as any);
    expect(result.id).toBe('d1');
    expect(result.type).toBe('deal');
    expect(result.url).toBe('/deals/d1');
    expect(result.metadata.coupon_code).toBe('SAVE20');
  });

  test('normalizeConsultancyResult', () => {
    const consultancy = {
      consultancy_id: 'c1',
      name: 'Visa Experts',
      description: 'Immigration help',
      city: 'San Jose',
      state: 'CA',
      specialization: 'immigration',
      rating: 4.8,
      phone: '555-1234',
      email: 'info@visa.com',
      website: 'https://visa.com',
    };
    const result = normalizeConsultancyResult(consultancy as any);
    expect(result.id).toBe('c1');
    expect(result.type).toBe('consultancy');
    expect(result.url).toBe('/consultancies/c1');
    expect(result.category).toBe('immigration');
    expect(result.metadata.email).toBe('info@visa.com');
  });

  test('normalizeConsultancyResult uses fallback description', () => {
    const consultancy = {
      consultancy_id: 'c2',
      name: 'Tax Pro',
      description: '',
      city: 'Dallas',
      state: 'TX',
      specialization: 'tax',
    };
    const result = normalizeConsultancyResult(consultancy as any);
    expect(result.description).toBe('tax consultancy in Dallas, TX');
  });
});

// ─── Text Matching & Scoring ────────────────────────────────────────

describe('Text Matching & Scoring', () => {
  describe('textMatch', () => {
    test('matches when term appears in target', () => {
      expect(textMatch('Indian Restaurant', 'indian')).toBe(true);
      expect(textMatch('Indian Restaurant', 'rest')).toBe(true);
    });

    test('returns false when no match', () => {
      expect(textMatch('Indian Restaurant', 'chinese')).toBe(false);
    });

    test('handles empty values', () => {
      expect(textMatch('', 'test')).toBe(false);
      expect(textMatch('test', '')).toBe(false);
    });

    test('is case insensitive', () => {
      expect(textMatch('HELLO', 'hello')).toBe(true);
    });

    test('matches any term (OR logic)', () => {
      expect(textMatch('Indian Restaurant', 'chinese restaurant')).toBe(true);
    });
  });

  describe('calculateRelevanceScore', () => {
    const baseResult: SearchResult = {
      id: '1',
      type: 'business',
      title: 'Indian Restaurant',
      description: 'Authentic Indian food in Dallas, TX',
      url: '/businesses/1',
      city: 'Dallas',
      state: 'TX',
      category: 'restaurant',
      metadata: {},
    };

    test('returns 0 for empty query', () => {
      expect(calculateRelevanceScore(baseResult, '')).toBe(0);
    });

    test('scores title matches higher than description', () => {
      const titleScore = calculateRelevanceScore(baseResult, 'indian');
      const descOnlyResult = { ...baseResult, title: 'Food Place' };
      const descScore = calculateRelevanceScore(descOnlyResult, 'authentic');
      expect(titleScore).toBeGreaterThan(descScore);
    });

    test('gives bonus for exact title match', () => {
      const result = { ...baseResult, title: 'indian' };
      const score = calculateRelevanceScore(result, 'indian');
      expect(score).toBeGreaterThanOrEqual(50); // title + exact match bonus
    });

    test('scores category matches', () => {
      const score = calculateRelevanceScore(baseResult, 'restaurant');
      expect(score).toBeGreaterThan(0);
    });

    test('scores city/state matches', () => {
      const score = calculateRelevanceScore(baseResult, 'dallas');
      expect(score).toBeGreaterThan(0);
    });

    test('caps score at 100', () => {
      // A query matching title, description, category, city, state
      const score = calculateRelevanceScore(baseResult, 'indian restaurant dallas tx');
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateHighlights', () => {
    const result: SearchResult = {
      id: '1',
      type: 'business',
      title: 'Indian Restaurant',
      description: 'Serving authentic Indian cuisine since 2010',
      url: '/businesses/1',
      category: 'restaurant',
      metadata: {},
    };

    test('generates highlights for matching fields', () => {
      const highlights = generateHighlights(result, 'indian');
      expect(highlights.length).toBeGreaterThan(0);
      expect(highlights.some((h) => h.field === 'title')).toBe(true);
    });

    test('returns empty for no query', () => {
      expect(generateHighlights(result, '')).toEqual([]);
    });

    test('includes snippets with surrounding context', () => {
      const highlights = generateHighlights(result, 'authentic');
      const descHighlight = highlights.find((h) => h.field === 'description');
      expect(descHighlight).toBeDefined();
      expect(descHighlight!.snippet).toContain('authentic');
    });

    test('highlights category field', () => {
      const highlights = generateHighlights(result, 'restaurant');
      expect(highlights.some((h) => h.field === 'category')).toBe(true);
    });
  });

  describe('enhanceResults & sortByRelevance', () => {
    const results: SearchResult[] = [
      {
        id: '1',
        type: 'business',
        title: 'Pizza Place',
        description: 'Great pizza',
        url: '/b/1',
        metadata: {},
      },
      {
        id: '2',
        type: 'business',
        title: 'Indian Pizza Restaurant',
        description: 'Best Indian pizza in town',
        url: '/b/2',
        category: 'restaurant',
        metadata: {},
      },
    ];

    test('enhanceResults adds highlights and scores', () => {
      const enhanced = enhanceResults(results, 'indian');
      expect(enhanced).toHaveLength(2);
      expect(enhanced[0]).toHaveProperty('highlights');
      expect(enhanced[0]).toHaveProperty('score');
      expect(enhanced[1].score).toBeGreaterThan(enhanced[0].score);
    });

    test('sortByRelevance sorts by score descending', () => {
      const enhanced = enhanceResults(results, 'indian');
      const sorted = sortByRelevance(enhanced);
      expect(sorted[0].id).toBe('2'); // Higher score
      expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[1].score);
    });
  });
});

// ─── Facets ─────────────────────────────────────────────────────────

describe('computeFacets', () => {
  const results: SearchResult[] = [
    { id: '1', type: 'business', title: 'A', description: 'd', url: '/a', city: 'Dallas', state: 'TX', category: 'restaurant', metadata: {} },
    { id: '2', type: 'business', title: 'B', description: 'd', url: '/b', city: 'Dallas', state: 'TX', category: 'grocery', metadata: {} },
    { id: '3', type: 'job', title: 'C', description: 'd', url: '/c', city: 'Seattle', state: 'WA', category: 'full_time', metadata: {} },
    { id: '4', type: 'news', title: 'D', description: 'd', url: '/d', category: 'immigration', metadata: {} },
  ];

  test('computes content_types facets', () => {
    const facets = computeFacets(results);
    expect(facets.content_types).toHaveLength(3);
    expect(facets.content_types[0].value).toBe('business');
    expect(facets.content_types[0].count).toBe(2);
  });

  test('computes city facets', () => {
    const facets = computeFacets(results);
    expect(facets.cities.length).toBeGreaterThan(0);
    const dallas = facets.cities.find((c) => c.value === 'Dallas');
    expect(dallas?.count).toBe(2);
  });

  test('computes state facets', () => {
    const facets = computeFacets(results);
    const tx = facets.states.find((s) => s.value === 'TX');
    expect(tx?.count).toBe(2);
  });

  test('computes category facets', () => {
    const facets = computeFacets(results);
    expect(facets.categories.length).toBeGreaterThanOrEqual(3);
  });

  test('sorts facets by count descending', () => {
    const facets = computeFacets(results);
    for (const facetList of [facets.content_types, facets.cities, facets.states]) {
      for (let i = 1; i < facetList.length; i++) {
        expect(facetList[i - 1].count).toBeGreaterThanOrEqual(facetList[i].count);
      }
    }
  });

  test('handles empty results', () => {
    const facets = computeFacets([]);
    expect(facets.content_types).toEqual([]);
    expect(facets.cities).toEqual([]);
    expect(facets.states).toEqual([]);
    expect(facets.categories).toEqual([]);
  });
});

// ─── Recent Searches ────────────────────────────────────────────────

describe('Recent Searches', () => {
  const makeRecent = (query: string): RecentSearch => ({
    query,
    timestamp: new Date().toISOString(),
  });

  describe('addRecentSearch', () => {
    test('adds search to front of list', () => {
      const recents = [makeRecent('old')];
      const result = addRecentSearch(recents, makeRecent('new'));
      expect(result[0].query).toBe('new');
      expect(result).toHaveLength(2);
    });

    test('deduplicates by query (case-insensitive)', () => {
      const recents = [makeRecent('hello'), makeRecent('world')];
      const result = addRecentSearch(recents, makeRecent('HELLO'));
      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('HELLO');
    });

    test('caps at MAX_RECENT_SEARCHES', () => {
      const recents = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => makeRecent(`q${i}`));
      const result = addRecentSearch(recents, makeRecent('new'));
      expect(result).toHaveLength(MAX_RECENT_SEARCHES);
      expect(result[0].query).toBe('new');
    });
  });

  describe('removeRecentSearch', () => {
    test('removes matching query', () => {
      const recents = [makeRecent('hello'), makeRecent('world')];
      const result = removeRecentSearch(recents, 'hello');
      expect(result).toHaveLength(1);
      expect(result[0].query).toBe('world');
    });

    test('is case-insensitive', () => {
      const recents = [makeRecent('Hello')];
      const result = removeRecentSearch(recents, 'hello');
      expect(result).toHaveLength(0);
    });

    test('returns original list if no match', () => {
      const recents = [makeRecent('hello')];
      const result = removeRecentSearch(recents, 'world');
      expect(result).toHaveLength(1);
    });
  });

  describe('clearRecentSearches', () => {
    test('returns empty array', () => {
      expect(clearRecentSearches()).toEqual([]);
    });
  });
});

// ─── Suggestions ────────────────────────────────────────────────────

describe('generateSuggestions', () => {
  const configs = SEARCH_CONTENT_TYPES;
  const categories = ['restaurant', 'immigration', 'technology'];

  test('suggests matching content types', () => {
    const suggestions = generateSuggestions('bus', configs, categories);
    expect(suggestions.some((s) => s.text.includes('Businesses'))).toBe(true);
  });

  test('suggests matching categories', () => {
    const suggestions = generateSuggestions('rest', configs, categories);
    expect(suggestions.some((s) => s.text === 'restaurant')).toBe(true);
  });

  test('returns empty for invalid query', () => {
    expect(generateSuggestions('a', configs, categories)).toEqual([]);
    expect(generateSuggestions('', configs, categories)).toEqual([]);
  });

  test('caps at MAX_SUGGESTIONS', () => {
    const manyCategories = Array.from({ length: 20 }, (_, i) => `cat${i}`);
    const suggestions = generateSuggestions('cat', configs, manyCategories);
    expect(suggestions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
  });
});

// ─── Formatting Helpers ─────────────────────────────────────────────

describe('Formatting Helpers', () => {
  describe('formatResultCount', () => {
    test('formats zero results', () => {
      expect(formatResultCount(0)).toBe('No results');
    });

    test('formats single result', () => {
      expect(formatResultCount(1)).toBe('1 result');
    });

    test('formats multiple results with comma separator', () => {
      expect(formatResultCount(1234)).toBe('1,234 results');
    });
  });

  describe('formatSearchTime', () => {
    test('formats milliseconds under 1 second', () => {
      expect(formatSearchTime(500)).toBe('500ms');
    });

    test('formats seconds for >= 1000ms', () => {
      expect(formatSearchTime(1500)).toBe('1.50s');
    });
  });

  describe('getResultUrl', () => {
    test('returns result url', () => {
      const result: SearchResult = {
        id: '1',
        type: 'business',
        title: 'T',
        description: 'D',
        url: '/businesses/1',
        metadata: {},
      };
      expect(getResultUrl(result)).toBe('/businesses/1');
    });
  });
});

// ─── Pagination ─────────────────────────────────────────────────────

describe('paginateResults', () => {
  const items = Array.from({ length: 55 }, (_, i) => ({ id: i }));

  test('returns correct page of results', () => {
    const result = paginateResults(items, 1, 20);
    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(55);
    expect(result.totalPages).toBe(3);
  });

  test('returns second page', () => {
    const result = paginateResults(items, 2, 20);
    expect(result.items).toHaveLength(20);
    expect(result.items[0]).toEqual({ id: 20 });
  });

  test('returns partial last page', () => {
    const result = paginateResults(items, 3, 20);
    expect(result.items).toHaveLength(15);
  });

  test('handles empty array', () => {
    const result = paginateResults([], 1, 20);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  test('handles page beyond range', () => {
    const result = paginateResults(items, 10, 20);
    expect(result.items).toEqual([]);
  });
});
