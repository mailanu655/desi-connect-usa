/**
 * ContentDeduplicator Tests
 *
 * Tests duplicate detection and filtering including:
 *   - URL-based exact dedup (normalized)
 *   - Title similarity (Jaccard on word sets)
 *   - Intra-batch dedup (within same batch)
 *   - URL normalization (www, trailing slash, query params)
 *   - Config: threshold & lookback limit
 *   - Integration with mock repositories
 */

import { ContentDeduplicator } from '@desi-connect/middleware';
import type { DeduplicationResult, ParsedContent } from '@desi-connect/middleware';
import type { CreateNewsInput, CreateEventInput } from '@desi-connect/shared';

// ── Helpers ───────────────────────────────────────────────

function makeNewsParsed(overrides: Partial<CreateNewsInput> = {}): ParsedContent {
  return {
    type: 'news',
    news: {
      title: 'Test News Article',
      summary: 'A summary',
      source_url: 'https://example.com/article',
      source_name: 'example',
      image_url: null,
      category: 'other',
      tags: [],
      city: null,
      state: null,
      source: 'tavily',
      published_at: '2026-01-15',
      ...overrides,
    } as CreateNewsInput,
  };
}

function makeEventParsed(overrides: Partial<CreateEventInput> = {}): ParsedContent {
  return {
    type: 'event',
    event: {
      title: 'Test Event',
      description: 'An event description',
      category: 'other',
      city: 'Dallas',
      state: 'TX',
      is_virtual: false,
      image_url: null,
      starts_at: '2026-03-15',
      is_free: true,
      submission_source: 'tavily',
      ...overrides,
    } as CreateEventInput,
  };
}

function createMockRepos(
  newsData: Record<string, unknown>[] = [],
  eventsData: Record<string, unknown>[] = [],
) {
  return {
    news: {
      list: jest.fn().mockResolvedValue({ data: newsData, total: newsData.length }),
      create: jest.fn().mockResolvedValue({}),
    },
    events: {
      list: jest.fn().mockResolvedValue({ data: eventsData, total: eventsData.length }),
      create: jest.fn().mockResolvedValue({}),
    },
  } as any;
}

describe('ContentDeduplicator', () => {
  // ── Title similarity ──────────────────────────────────────

  describe('titleSimilarity', () => {
    let dedup: ContentDeduplicator;

    beforeEach(() => {
      dedup = new ContentDeduplicator();
    });

    it('should return 1.0 for identical titles', () => {
      expect(dedup.titleSimilarity('H-1B Visa Update News', 'H-1B Visa Update News')).toBe(1);
    });

    it('should return 1.0 for two empty strings', () => {
      expect(dedup.titleSimilarity('', '')).toBe(1);
    });

    it('should return 0 when one string is empty', () => {
      expect(dedup.titleSimilarity('some words here', '')).toBe(0);
      expect(dedup.titleSimilarity('', 'some words here')).toBe(0);
    });

    it('should return 0 for completely different titles', () => {
      const similarity = dedup.titleSimilarity(
        'Indian restaurant opening Dallas',
        'Cricket tournament scores results',
      );
      expect(similarity).toBe(0);
    });

    it('should return high similarity for near-duplicate titles', () => {
      const similarity = dedup.titleSimilarity(
        'USCIS announces new H-1B visa rules',
        'USCIS announces updated H-1B visa rules',
      );
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should be case-insensitive', () => {
      expect(
        dedup.titleSimilarity('Diwali Festival Celebration', 'diwali festival celebration'),
      ).toBe(1);
    });

    it('should ignore short words (≤2 chars)', () => {
      // "a", "to", "is" are stripped; only significant words compared
      const sim = dedup.titleSimilarity(
        'a guide to visa filing',
        'the guide for visa filing',
      );
      expect(sim).toBeGreaterThan(0.5);
    });

    it('should ignore punctuation', () => {
      expect(
        dedup.titleSimilarity('H-1B: New Rules!', 'H1B New Rules'),
      ).toBeGreaterThan(0.5);
    });

    it('should compute Jaccard correctly', () => {
      // Words: {visa, update, news} vs {visa, update, alert}
      // Intersection: {visa, update} = 2
      // Union: {visa, update, news, alert} = 4
      // Jaccard = 2/4 = 0.5
      const sim = dedup.titleSimilarity('visa update news', 'visa update alert');
      expect(sim).toBeCloseTo(0.5, 2);
    });
  });

  // ── URL-based deduplication ────────────────────────────────

  describe('URL-based dedup', () => {
    it('should detect exact URL duplicates against existing news', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos([
        { source_url: 'https://example.com/existing-article', title: 'Existing' },
      ]);

      const items: ParsedContent[] = [
        makeNewsParsed({ source_url: 'https://example.com/existing-article', title: 'New Title' }),
        makeNewsParsed({ source_url: 'https://example.com/unique-article', title: 'Unique' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.unique).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique[0].news!.source_url).toBe('https://example.com/unique-article');
    });

    it('should normalize URLs (strip www and trailing slash)', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos([
        { source_url: 'https://www.example.com/article/', title: 'Existing' },
      ]);

      const items: ParsedContent[] = [
        makeNewsParsed({ source_url: 'https://example.com/article', title: 'Same URL Different Format' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique).toHaveLength(0);
    });

    it('should handle intra-batch URL duplicates', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos();

      const items: ParsedContent[] = [
        makeNewsParsed({ source_url: 'https://example.com/same-url', title: 'First Copy' }),
        makeNewsParsed({ source_url: 'https://example.com/same-url', title: 'Second Copy' }),
        makeNewsParsed({ source_url: 'https://example.com/different-url', title: 'Unique' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.unique).toHaveLength(2);
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique[0].news!.title).toBe('First Copy');
      expect(result.unique[1].news!.title).toBe('Unique');
    });
  });

  // ── Title-based deduplication ──────────────────────────────

  describe('title-based dedup', () => {
    it('should detect duplicate news by similar title', async () => {
      const dedup = new ContentDeduplicator({ titleSimilarityThreshold: 0.8 });
      const repos = createMockRepos([
        { source_url: 'https://other-site.com/article', title: 'USCIS Announces New H1B Visa Rules for 2026' },
      ]);

      const items: ParsedContent[] = [
        makeNewsParsed({
          source_url: 'https://different-site.com/news',
          title: 'USCIS Announces New H1B Visa Rules for Year 2026',
        }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should detect duplicate events by similar title', async () => {
      const dedup = new ContentDeduplicator({ titleSimilarityThreshold: 0.7 });
      const repos = createMockRepos([], [
        { title: 'Diwali Festival Celebration 2026 Dallas' },
      ]);

      const items: ParsedContent[] = [
        makeEventParsed({ title: 'Diwali Festival Celebration Dallas 2026' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should allow different titles below threshold', async () => {
      const dedup = new ContentDeduplicator({ titleSimilarityThreshold: 0.8 });
      const repos = createMockRepos([
        { source_url: 'https://site-a.com/article', title: 'Indian Restaurant Opens in Dallas' },
      ]);

      const items: ParsedContent[] = [
        makeNewsParsed({
          source_url: 'https://site-b.com/different',
          title: 'Houston Cricket Tournament Results',
        }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.unique).toHaveLength(1);
      expect(result.duplicates).toHaveLength(0);
    });
  });

  // ── Configuration ─────────────────────────────────────────

  describe('configuration', () => {
    it('should use default threshold of 0.8', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos([
        { source_url: 'https://a.com/x', title: 'visa bulletin update march priority dates' },
      ]);

      // Similarity ~0.6 → below 0.8 threshold → unique
      const items: ParsedContent[] = [
        makeNewsParsed({
          source_url: 'https://b.com/y',
          title: 'visa bulletin march new movement predictions',
        }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.unique).toHaveLength(1);
    });

    it('should respect custom threshold', async () => {
      const dedup = new ContentDeduplicator({ titleSimilarityThreshold: 0.3 });
      const repos = createMockRepos([
        { source_url: 'https://a.com/x', title: 'visa bulletin update march' },
      ]);

      // Even low similarity triggers dedup with low threshold
      const items: ParsedContent[] = [
        makeNewsParsed({
          source_url: 'https://b.com/y',
          title: 'visa news bulletin latest',
        }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should handle lookback limit in repo queries', async () => {
      const dedup = new ContentDeduplicator({ lookbackLimit: 50 });
      const repos = createMockRepos();

      await dedup.deduplicate([], repos);

      expect(repos.news.list).toHaveBeenCalledWith({ limit: 50 });
      expect(repos.events.list).toHaveBeenCalledWith({ limit: 50 });
    });

    it('should use default lookback limit of 200', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos();

      await dedup.deduplicate([], repos);

      expect(repos.news.list).toHaveBeenCalledWith({ limit: 200 });
    });
  });

  // ── Edge cases ────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty items array', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos();

      const result = await dedup.deduplicate([], repos);
      expect(result.unique).toEqual([]);
      expect(result.duplicates).toEqual([]);
      expect(result.totalChecked).toBe(0);
    });

    it('should handle repo list failures gracefully', async () => {
      const dedup = new ContentDeduplicator();
      const repos = {
        news: { list: jest.fn().mockRejectedValue(new Error('DB error')) },
        events: { list: jest.fn().mockRejectedValue(new Error('DB error')) },
      } as any;

      const items: ParsedContent[] = [makeNewsParsed()];
      const result = await dedup.deduplicate(items, repos);

      // Should still work — empty existing data means everything is unique
      expect(result.unique).toHaveLength(1);
    });

    it('should return correct totalChecked count', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos();

      const items: ParsedContent[] = [
        makeNewsParsed({ title: 'Article 1', source_url: 'https://a.com/1' }),
        makeNewsParsed({ title: 'Article 2', source_url: 'https://a.com/2' }),
        makeEventParsed({ title: 'Event 1' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.totalChecked).toBe(3);
    });

    it('should handle events without source_url (only title-based dedup)', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos([], [
        { title: 'Community Diwali Celebration Dallas' },
      ]);

      const items: ParsedContent[] = [
        makeEventParsed({ title: 'Community Diwali Celebration Dallas' }),
        makeEventParsed({ title: 'Completely Different Yoga Workshop' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique).toHaveLength(1);
      expect(result.unique[0].event!.title).toBe('Completely Different Yoga Workshop');
    });

    it('should handle mixed news and events in same batch', async () => {
      const dedup = new ContentDeduplicator();
      const repos = createMockRepos();

      const items: ParsedContent[] = [
        makeNewsParsed({ title: 'News Article', source_url: 'https://a.com/1' }),
        makeEventParsed({ title: 'Cultural Event' }),
        makeNewsParsed({ title: 'Another Article', source_url: 'https://b.com/2' }),
        makeEventParsed({ title: 'Sports Tournament' }),
      ];

      const result = await dedup.deduplicate(items, repos);
      expect(result.unique).toHaveLength(4);
      expect(result.duplicates).toHaveLength(0);
    });
  });
});
