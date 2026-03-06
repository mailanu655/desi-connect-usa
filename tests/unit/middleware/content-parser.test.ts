/**
 * ContentParser Tests
 *
 * Tests content transformation from Tavily results into domain objects:
 *   - News vs Event classification
 *   - Category assignment (news + event categories)
 *   - Tag extraction
 *   - Location hint handling
 *   - Source name extraction
 *   - Edge cases (empty content, missing fields)
 */

import { ContentParser } from '@desi-connect/middleware';
import type { ParsedContent } from '@desi-connect/middleware';
import type { TavilySearchResult, NewsCategory, EventCategory } from '@desi-connect/shared';

// ── Helpers ───────────────────────────────────────────────

function makeSearchResult(overrides: Partial<TavilySearchResult> = {}): TavilySearchResult {
  return {
    title: 'Test Article Title',
    url: 'https://example.com/article',
    content: 'Some general content about the test topic.',
    score: 0.9,
    ...overrides,
  };
}

describe('ContentParser', () => {
  let parser: ContentParser;

  beforeEach(() => {
    parser = new ContentParser();
  });

  // ── Content type detection ──────────────────────────────

  describe('news vs event classification', () => {
    it('should classify as news by default', () => {
      const result = parser.parse(
        makeSearchResult({ title: 'New H-1B visa rules announced', content: 'USCIS has updated guidelines.' }),
        'immigration news',
      );
      expect(result.type).toBe('news');
      expect(result.news).toBeDefined();
      expect(result.event).toBeUndefined();
    });

    it('should classify as event when 2+ event signals present', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Diwali Festival Celebration',
          content: 'Join us for a grand celebration event with tickets available now. Register now!',
        }),
        'Indian community events',
      );
      expect(result.type).toBe('event');
      expect(result.event).toBeDefined();
      expect(result.news).toBeUndefined();
    });

    it('should not classify as event with only 1 signal', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'New Restaurant Opening Event',
          content: 'A new Indian restaurant opens its doors next week.',
        }),
        'restaurant openings',
      );
      // "event" appears once in title, but only 1 signal from content
      // The title + query combined text gets checked
      expect(result.type).toBe('news');
    });

    it('should detect event from RSVP and meetup signals', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'South Asian Tech Meetup',
          content: 'Networking meetup for desi professionals. RSVP at the link below.',
        }),
        'networking events',
      );
      expect(result.type).toBe('event');
    });

    it('should detect event from workshop and conference signals', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Immigration Workshop',
          content: 'Join this workshop and seminar on H-1B filing strategies.',
        }),
        'immigration help',
      );
      expect(result.type).toBe('event');
    });
  });

  // ── News category classification ────────────────────────

  describe('classifyNewsCategory', () => {
    const testCases: [string, NewsCategory][] = [
      ['USCIS announces new H-1B lottery rules for visa holders', 'immigration'],
      ['New green card priority date bulletin released by USCIS', 'immigration'],
      ['Indian American community celebrates Diwali at temple', 'community'],
      ['South Asian diaspora gathering at local gurudwara', 'community'],
      ['New Indian restaurant franchise opening in Dallas', 'business'],
      ['Desi entrepreneur launches startup in Silicon Valley', 'technology'],
      ['AI startup from Indian engineer gets funding', 'technology'],
      ['Bollywood star shares new recipe for diwali preparation', 'lifestyle'],
      ['Cricket World Cup results and yoga wellness trends', 'lifestyle'],
      ['Holi festival celebration concert performance upcoming', 'events'],
      ['Great deal: 50% off discount at Indian grocery store', 'deals'],
      ['Indian American elected to Congress in historic election', 'politics'],
      ['Random article about weather forecast tomorrow', 'other'],
    ];

    test.each(testCases)('should classify "%s" as %s', (text, expectedCategory) => {
      expect(parser.classifyNewsCategory(text)).toBe(expectedCategory);
    });

    it('should return "other" for empty text', () => {
      expect(parser.classifyNewsCategory('')).toBe('other');
    });

    it('should pick category with most keyword matches', () => {
      // This text has more immigration keywords than business keywords
      const text = 'visa h-1b green card uscis immigration petition startup';
      expect(parser.classifyNewsCategory(text)).toBe('immigration');
    });
  });

  // ── Event category classification ───────────────────────

  describe('classifyEventCategory', () => {
    const testCases: [string, EventCategory][] = [
      ['Cultural Diwali celebration with rangoli and holi colors', 'cultural'],
      ['Temple puja and kirtan religious ceremony', 'religious'],
      ['Networking meetup for desi professionals at mixer', 'networking'],
      ['Workshop and seminar on immigration training', 'educational'],
      ['Food festival featuring taste of India culinary show', 'food_festival'],
      ['Cricket tournament and badminton league match', 'sports'],
      ['Charity gala and fundraiser for nonprofit cause', 'charity'],
      ['Business expo trade show for desi entrepreneurs', 'business'],
      ['Just a random gathering with no category signals', 'other'],
    ];

    test.each(testCases)('should classify "%s" as %s', (text, expectedCategory) => {
      expect(parser.classifyEventCategory(text)).toBe(expectedCategory);
    });
  });

  // ── Tag extraction ──────────────────────────────────────

  describe('extractTags', () => {
    it('should extract matching keywords as tags', () => {
      const tags = parser.extractTags('H-1B visa immigration USCIS green card news');
      expect(tags).toContain('visa');
      expect(tags).toContain('h-1b');
      expect(tags).toContain('immigration');
      expect(tags).toContain('uscis');
      expect(tags).toContain('green card');
    });

    it('should limit to maxTags', () => {
      const tags = parser.extractTags(
        'visa h-1b green card uscis immigration i-140 eb-2 eb-3 opt cpt',
        3,
      );
      expect(tags).toHaveLength(3);
    });

    it('should default to 5 max tags', () => {
      const tags = parser.extractTags(
        'visa h-1b green card uscis immigration i-140 eb-2 eb-3 opt cpt ead perm bulletin',
      );
      expect(tags.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for no matches', () => {
      const tags = parser.extractTags('completely unrelated content about weather');
      expect(tags).toEqual([]);
    });

    it('should deduplicate tags', () => {
      const tags = parser.extractTags('visa visa visa immigration immigration');
      const unique = new Set(tags);
      expect(tags.length).toBe(unique.size);
    });
  });

  // ── Source name extraction ──────────────────────────────

  describe('extractSourceName', () => {
    it('should extract clean source name from URL', () => {
      expect(parser.extractSourceName('https://www.nytimes.com/article')).toBe('nytimes');
    });

    it('should remove www prefix', () => {
      expect(parser.extractSourceName('https://www.example.com/page')).toBe('example');
    });

    it('should remove common TLD suffixes', () => {
      expect(parser.extractSourceName('https://uscis.gov/news')).toBe('uscis');
      expect(parser.extractSourceName('https://news.org/article')).toBe('news');
      expect(parser.extractSourceName('https://techblog.io/post')).toBe('techblog');
    });

    it('should return "unknown" for invalid URLs', () => {
      expect(parser.extractSourceName('not-a-url')).toBe('unknown');
    });

    it('should handle subdomain URLs', () => {
      expect(parser.extractSourceName('https://blog.example.com/post')).toBe('blog.example');
    });
  });

  // ── Parse → News output ─────────────────────────────────

  describe('parse → news', () => {
    it('should populate all news fields', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'USCIS Updates H-1B Rules',
          url: 'https://www.uscis.gov/h1b-update',
          content: 'New H-1B visa rules for immigration applicants.',
          published_date: '2026-02-15',
          images: ['https://uscis.gov/img.jpg'],
        }),
        'immigration news',
        { city: 'Dallas', state: 'TX' },
      );

      expect(result.type).toBe('news');
      const news = result.news!;
      expect(news.title).toBe('USCIS Updates H-1B Rules');
      expect(news.source_url).toBe('https://www.uscis.gov/h1b-update');
      expect(news.source_name).toBe('uscis');
      expect(news.image_url).toBe('https://uscis.gov/img.jpg');
      expect(news.category).toBe('immigration');
      expect(news.city).toBe('Dallas');
      expect(news.state).toBe('TX');
      expect(news.source).toBe('tavily');
      expect(news.published_at).toBe('2026-02-15');
      expect(news.tags!.length).toBeGreaterThan(0);
    });

    it('should truncate summary to 300 chars', () => {
      const longContent = 'A'.repeat(500);
      const result = parser.parse(
        makeSearchResult({ content: longContent }),
        'test',
      );
      expect(result.news!.summary.length).toBeLessThanOrEqual(300);
      expect(result.news!.summary.endsWith('...')).toBe(true);
    });

    it('should not truncate short summaries', () => {
      const result = parser.parse(
        makeSearchResult({ content: 'Short content' }),
        'test',
      );
      expect(result.news!.summary).toBe('Short content');
    });

    it('should use location hint when provided', () => {
      const result = parser.parse(
        makeSearchResult(),
        'test',
        { city: 'Houston', state: 'TX' },
      );
      expect(result.news!.city).toBe('Houston');
      expect(result.news!.state).toBe('TX');
    });

    it('should use null for city/state when no location hint and no default', () => {
      const result = parser.parse(makeSearchResult(), 'test');
      expect(result.news!.city).toBeNull();
      expect(result.news!.state).toBeNull();
    });

    it('should use config defaults when no location hint', () => {
      const parserWithDefaults = new ContentParser({
        defaultCity: 'New York',
        defaultState: 'NY',
      });
      const result = parserWithDefaults.parse(makeSearchResult(), 'test');
      expect(result.news!.city).toBe('New York');
      expect(result.news!.state).toBe('NY');
    });

    it('should use first image from result', () => {
      const result = parser.parse(
        makeSearchResult({ images: ['img1.jpg', 'img2.jpg'] }),
        'test',
      );
      expect(result.news!.image_url).toBe('img1.jpg');
    });

    it('should handle missing images', () => {
      const result = parser.parse(
        makeSearchResult({ images: undefined }),
        'test',
      );
      expect(result.news!.image_url).toBeNull();
    });

    it('should use current date when published_date missing', () => {
      const result = parser.parse(
        makeSearchResult({ published_date: undefined }),
        'test',
      );
      expect(result.news!.published_at).toBeDefined();
      // Should be an ISO date string
      expect(() => new Date(result.news!.published_at!)).not.toThrow();
    });
  });

  // ── Parse → Event output ────────────────────────────────

  describe('parse → event', () => {
    it('should populate all event fields', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Holi Festival Celebration',
          content: 'Join us for a grand festival event celebration with tickets available.',
          published_date: '2026-03-15',
          images: ['https://example.com/holi.jpg'],
        }),
        'Indian community events',
        { city: 'Dallas', state: 'TX' },
      );

      expect(result.type).toBe('event');
      const event = result.event!;
      expect(event.title).toBe('Holi Festival Celebration');
      expect(event.category).toBe('cultural');
      expect(event.city).toBe('Dallas');
      expect(event.state).toBe('TX');
      expect(event.image_url).toBe('https://example.com/holi.jpg');
      expect(event.submission_source).toBe('tavily');
      expect(event.starts_at).toBe('2026-03-15');
    });

    it('should detect virtual events', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Virtual Networking Event',
          content: 'Join us on zoom for this online meetup gathering.',
        }),
        'events',
      );
      expect(result.event!.is_virtual).toBe(true);
    });

    it('should detect non-virtual events', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Community Festival Celebration',
          content: 'Come to the park for our annual celebration event. Register now.',
        }),
        'events',
      );
      expect(result.event!.is_virtual).toBe(false);
    });

    it('should detect paid events (has ticket mention)', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Bollywood Concert Event',
          content: 'Get your ticket for this grand performance. Festival celebration.',
        }),
        'events',
      );
      expect(result.event!.is_free).toBe(false);
    });

    it('should detect free events (no ticket/admission mention)', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Community Festival Celebration',
          content: 'Free cultural event for everyone. Join us for this gathering.',
        }),
        'events',
      );
      expect(result.event!.is_free).toBe(true);
    });

    it('should use "Unknown" for city/state when no hint and no default', () => {
      const result = parser.parse(
        makeSearchResult({
          title: 'Online Event',
          content: 'Virtual meetup gathering event. Register now.',
        }),
        'events',
      );
      expect(result.event!.city).toBe('Unknown');
      expect(result.event!.state).toBe('Unknown');
    });
  });
});
