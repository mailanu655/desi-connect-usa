/**
 * ContentAggregator Tests
 *
 * Tests the full content aggregation orchestration pipeline:
 *   - Query building (topic × metro area combos)
 *   - Full run pipeline (fetch → parse → dedup → store)
 *   - Metro-scoped and topic-scoped runs
 *   - Sync event tracking
 *   - Storage error handling
 *   - Run ID generation
 *   - Configuration options
 */

import { ContentAggregator } from '@desi-connect/middleware';
import type { AggregationRun, ContentAggregatorConfig } from '@desi-connect/middleware';

// ── Mock setup ───────────────────────────────────────────

const originalFetch = global.fetch;

function mockFetchForTavily(resultsByQuery: Record<string, Record<string, unknown>[]> = {}) {
  return jest.fn().mockImplementation(async (_url: string, options: RequestInit) => {
    const body = JSON.parse(options.body as string);
    const query = body.query as string;
    const results = resultsByQuery[query] ?? [];

    return {
      ok: true,
      json: () =>
        Promise.resolve({
          query,
          results,
          response_time: 0.3,
        }),
      text: () => Promise.resolve(JSON.stringify({ query, results })),
    };
  });
}

function makeResult(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Article',
    url: 'https://example.com/article',
    content: 'Content about Indian community news.',
    score: 0.9,
    published_date: '2026-02-15',
    images: ['https://example.com/img.jpg'],
    ...overrides,
  };
}

function createMockRepos() {
  return {
    news: {
      list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'news-1' }),
    },
    events: {
      list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'event-1' }),
    },
    users: { list: jest.fn(), create: jest.fn() },
    businesses: { list: jest.fn(), create: jest.fn() },
    jobs: { list: jest.fn(), create: jest.fn() },
    deals: { list: jest.fn(), create: jest.fn() },
    consultancies: { list: jest.fn(), create: jest.fn() },
    reviews: { list: jest.fn(), create: jest.fn() },
  } as any;
}

function makeConfig(overrides: Partial<ContentAggregatorConfig> = {}): ContentAggregatorConfig {
  return {
    tavily: { apiKey: 'test-api-key' },
    metroAreas: [
      { city: 'Dallas', state: 'TX', slug: 'dallas' },
      { city: 'Houston', state: 'TX', slug: 'houston' },
    ],
    searchTopics: ['Indian community news'],
    concurrency: 2,
    trackSyncEvents: true,
    ...overrides,
  };
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe('ContentAggregator', () => {
  // ── Constructor ─────────────────────────────────────────

  describe('constructor', () => {
    it('should create aggregator with valid config', () => {
      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig());
      expect(aggregator).toBeInstanceOf(ContentAggregator);
    });

    it('should expose the underlying TavilyClient', () => {
      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig());
      expect(aggregator.getClient()).toBeDefined();
    });
  });

  // ── Query building ────────────────────────────────────────

  describe('query building', () => {
    it('should build queries for each topic × metro combo plus global', async () => {
      const fetchMock = mockFetchForTavily();
      global.fetch = fetchMock;

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['topic A', 'topic B'],
        metroAreas: [
          { city: 'Dallas', state: 'TX', slug: 'dallas' },
          { city: 'Houston', state: 'TX', slug: 'houston' },
        ],
      }));

      await aggregator.run();

      // 2 topics × (1 global + 2 metros) = 6 queries
      expect(fetchMock).toHaveBeenCalledTimes(6);

      const queries = fetchMock.mock.calls.map(
        ([, opts]: any) => JSON.parse(opts.body).query,
      );
      expect(queries).toContain('topic A');
      expect(queries).toContain('topic A Dallas TX');
      expect(queries).toContain('topic A Houston TX');
      expect(queries).toContain('topic B');
      expect(queries).toContain('topic B Dallas TX');
      expect(queries).toContain('topic B Houston TX');
    });
  });

  // ── Full run pipeline ─────────────────────────────────────

  describe('run', () => {
    it('should return complete AggregationRun report', async () => {
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({ title: 'News 1', url: 'https://a.com/1', content: 'Immigration visa update from USCIS.' }),
        ],
        'Indian community news Dallas TX': [
          makeResult({ title: 'Dallas News', url: 'https://b.com/2', content: 'Local Dallas community gathering.' }),
        ],
        'Indian community news Houston TX': [
          makeResult({ title: 'Houston News', url: 'https://c.com/3', content: 'Houston Indian festival event.' }),
        ],
      });

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig());
      const run = await aggregator.run();

      expect(run.runId).toMatch(/^agg-/);
      expect(run.startedAt).toBeDefined();
      expect(run.completedAt).toBeDefined();
      expect(run.queriesExecuted).toBe(3); // 1 topic × (1 global + 2 metros)
      expect(run.rawResultsCount).toBe(3);
      expect(run.storageErrors).toEqual([]);
    });

    it('should store parsed news articles', async () => {
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({
            title: 'USCIS H-1B Update',
            url: 'https://uscis.gov/h1b',
            content: 'New visa rules for H-1B immigration applicants.',
          }),
        ],
      });

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['Indian community news'],
        metroAreas: [],
      }));

      const run = await aggregator.run();

      expect(repos.news.create).toHaveBeenCalled();
      expect(run.newsStored).toBeGreaterThanOrEqual(1);
    });

    it('should store parsed events', async () => {
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({
            title: 'Diwali Festival Celebration',
            url: 'https://events.com/diwali',
            content: 'Join us for a grand festival event celebration with tickets available. Register now!',
          }),
        ],
      });

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['Indian community news'],
        metroAreas: [],
      }));

      const run = await aggregator.run();

      expect(repos.events.create).toHaveBeenCalled();
      expect(run.eventsStored).toBeGreaterThanOrEqual(1);
    });

    it('should track deduplication counts', async () => {
      // Two results with the same URL → one should be deduped
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({ title: 'Article A', url: 'https://a.com/same' }),
          makeResult({ title: 'Article B', url: 'https://a.com/same' }),
        ],
      });

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['Indian community news'],
        metroAreas: [],
      }));

      const run = await aggregator.run();

      expect(run.rawResultsCount).toBe(2);
      expect(run.duplicateCount).toBe(1);
      expect(run.uniqueItemsCount).toBe(1);
    });

    it('should generate sync events when enabled', async () => {
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({ title: 'News Item', url: 'https://a.com/1', content: 'Immigration visa policy update.' }),
        ],
      });

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['Indian community news'],
        metroAreas: [],
        trackSyncEvents: true,
      }));

      const run = await aggregator.run();
      expect(run.syncEvents.length).toBeGreaterThan(0);
      expect(run.syncEvents[0].direction).toBe('external_to_both');
      expect(run.syncEvents[0].event_type).toBe('create');
      expect(run.syncEvents[0].status).toBe('completed');
    });

    it('should not generate sync events when disabled', async () => {
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({ title: 'News Item', url: 'https://a.com/1', content: 'Immigration visa update.' }),
        ],
      });

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['Indian community news'],
        metroAreas: [],
        trackSyncEvents: false,
      }));

      const run = await aggregator.run();
      expect(run.syncEvents).toEqual([]);
    });
  });

  // ── Storage error handling ────────────────────────────────

  describe('storage errors', () => {
    it('should capture storage errors without crashing', async () => {
      global.fetch = mockFetchForTavily({
        'Indian community news': [
          makeResult({ title: 'News 1', url: 'https://a.com/1', content: 'Visa immigration update news.' }),
          makeResult({ title: 'News 2', url: 'https://b.com/2', content: 'Another visa immigration story.' }),
        ],
      });

      const repos = createMockRepos();
      repos.news.create = jest.fn()
        .mockRejectedValueOnce(new Error('DB constraint violation'))
        .mockResolvedValueOnce({ id: 'news-2' });

      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['Indian community news'],
        metroAreas: [],
      }));

      const run = await aggregator.run();

      expect(run.storageErrors.length).toBeGreaterThanOrEqual(1);
      expect(run.storageErrors[0]).toContain('DB constraint violation');
      // Second item should still have been stored
      expect(run.newsStored).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Metro-scoped runs ─────────────────────────────────────

  describe('runForMetro', () => {
    it('should run only for specified metro area', async () => {
      const fetchMock = mockFetchForTavily();
      global.fetch = fetchMock;

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['topic A'],
        metroAreas: [
          { city: 'Dallas', state: 'TX', slug: 'dallas' },
          { city: 'Houston', state: 'TX', slug: 'houston' },
        ],
      }));

      await aggregator.runForMetro('dallas');

      // 1 topic × (1 global + 1 dallas metro) = 2 queries
      const queries = fetchMock.mock.calls.map(
        ([, opts]: any) => JSON.parse(opts.body).query,
      );
      expect(queries).toContain('topic A');
      expect(queries).toContain('topic A Dallas TX');
      expect(queries).not.toContain('topic A Houston TX');
    });

    it('should throw for unknown metro slug', async () => {
      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig());

      await expect(aggregator.runForMetro('nonexistent')).rejects.toThrow('Unknown metro area slug');
    });
  });

  // ── Topic-scoped runs ─────────────────────────────────────

  describe('runForTopic', () => {
    it('should run only for specified topic', async () => {
      const fetchMock = mockFetchForTavily();
      global.fetch = fetchMock;

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['topic A', 'topic B'],
        metroAreas: [{ city: 'Dallas', state: 'TX', slug: 'dallas' }],
      }));

      await aggregator.runForTopic('topic B');

      const queries = fetchMock.mock.calls.map(
        ([, opts]: any) => JSON.parse(opts.body).query,
      );
      // Should only have topic B queries
      expect(queries).toContain('topic B');
      expect(queries).toContain('topic B Dallas TX');
      expect(queries).not.toContain('topic A');
      expect(queries).not.toContain('topic A Dallas TX');
    });
  });

  // ── Run ID ────────────────────────────────────────────────

  describe('run ID generation', () => {
    it('should generate unique run IDs', async () => {
      global.fetch = mockFetchForTavily();
      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['test'],
        metroAreas: [],
      }));

      const run1 = await aggregator.run();
      const run2 = await aggregator.run();

      expect(run1.runId).toMatch(/^agg-/);
      expect(run2.runId).toMatch(/^agg-/);
      expect(run1.runId).not.toBe(run2.runId);
    });
  });

  // ── Empty / no results ────────────────────────────────────

  describe('empty results handling', () => {
    it('should handle zero results gracefully', async () => {
      global.fetch = mockFetchForTavily(); // returns empty by default
      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['test'],
        metroAreas: [],
      }));

      const run = await aggregator.run();

      expect(run.rawResultsCount).toBe(0);
      expect(run.uniqueItemsCount).toBe(0);
      expect(run.duplicateCount).toBe(0);
      expect(run.newsStored).toBe(0);
      expect(run.eventsStored).toBe(0);
      expect(repos.news.create).not.toHaveBeenCalled();
      expect(repos.events.create).not.toHaveBeenCalled();
    });
  });

  // ── Search options passthrough ────────────────────────────

  describe('search options', () => {
    it('should pass custom search options to TavilyClient', async () => {
      const fetchMock = mockFetchForTavily();
      global.fetch = fetchMock;

      const repos = createMockRepos();
      const aggregator = new ContentAggregator(repos, makeConfig({
        searchTopics: ['test'],
        metroAreas: [],
      }));

      await aggregator.run({ maxResults: 5, searchDepth: 'advanced' });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.max_results).toBe(5);
      expect(body.search_depth).toBe('advanced');
    });
  });
});
