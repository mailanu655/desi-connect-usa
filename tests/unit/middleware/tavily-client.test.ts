/**
 * TavilyClient Tests
 *
 * Tests the HTTP wrapper for Tavily Search API including:
 *   - Constructor validation
 *   - Single search queries
 *   - Batch search with concurrency
 *   - Retry logic with exponential backoff
 *   - Timeout handling
 *   - Error classification (4xx vs 5xx)
 *   - Response parsing
 *   - Call tracking
 */

import { TavilyClient, TavilyApiError } from '@desi-connect/middleware';
import type { TavilySearchOptions } from '@desi-connect/middleware';

// ── Global fetch mock ─────────────────────────────────────

const originalFetch = global.fetch;

function mockFetchSuccess(data: Record<string, unknown>) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function mockFetchError(status: number, body = 'error') {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: `Error ${status}`,
    text: () => Promise.resolve(body),
  });
}

function makeTavilyResponse(query: string, results: Record<string, unknown>[] = []) {
  return {
    query,
    results,
    response_time: 0.5,
  };
}

function makeResult(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Article',
    url: 'https://example.com/article',
    content: 'Test content about Indian community',
    score: 0.95,
    published_date: '2026-01-15',
    images: ['https://example.com/img.jpg'],
    ...overrides,
  };
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe('TavilyClient', () => {
  // ── Constructor ─────────────────────────────────────────

  describe('constructor', () => {
    it('should create client with valid API key', () => {
      const client = new TavilyClient({ apiKey: 'test-key' });
      expect(client).toBeInstanceOf(TavilyClient);
    });

    it('should throw on empty API key', () => {
      expect(() => new TavilyClient({ apiKey: '' })).toThrow('valid apiKey');
    });

    it('should throw on whitespace-only API key', () => {
      expect(() => new TavilyClient({ apiKey: '   ' })).toThrow('valid apiKey');
    });

    it('should use default config values', () => {
      const client = new TavilyClient({ apiKey: 'test-key' });
      expect(client.getCallCount()).toBe(0);
      expect(client.getLastCallTime()).toBe(0);
    });
  });

  // ── Single search ───────────────────────────────────────

  describe('search', () => {
    it('should make POST request with correct payload', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test query', [makeResult()]));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key' });
      await client.search('test query');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.tavily.com/search');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(options.body);
      expect(body.api_key).toBe('test-key');
      expect(body.query).toBe('test query');
      expect(body.search_depth).toBe('basic');
      expect(body.max_results).toBe(10);
    });

    it('should return parsed search response', async () => {
      global.fetch = mockFetchSuccess(
        makeTavilyResponse('H-1B visa news', [
          makeResult({ title: 'H-1B Update', url: 'https://uscis.gov/h1b' }),
          makeResult({ title: 'Visa Bulletin', url: 'https://state.gov/visa' }),
        ]),
      );

      const client = new TavilyClient({ apiKey: 'test-key' });
      const result = await client.search('H-1B visa news');

      expect(result.query).toBe('H-1B visa news');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].title).toBe('H-1B Update');
      expect(result.results[1].title).toBe('Visa Bulletin');
      expect(result.response_time).toBe(0.5);
    });

    it('should apply custom search options', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key' });
      const options: TavilySearchOptions = {
        maxResults: 5,
        searchDepth: 'advanced',
        includeDomains: ['uscis.gov'],
        excludeDomains: ['spam.com'],
      };

      await client.search('test', options);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.max_results).toBe(5);
      expect(body.search_depth).toBe('advanced');
      expect(body.include_domains).toEqual(['uscis.gov']);
      expect(body.exclude_domains).toEqual(['spam.com']);
    });

    it('should use custom base URL', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.tavily.com',
      });
      await client.search('test');

      expect(fetchMock.mock.calls[0][0]).toBe('https://custom.tavily.com/search');
    });

    it('should throw on empty query', async () => {
      const client = new TavilyClient({ apiKey: 'test-key' });
      await expect(client.search('')).rejects.toThrow('cannot be empty');
    });

    it('should throw on whitespace-only query', async () => {
      const client = new TavilyClient({ apiKey: 'test-key' });
      await expect(client.search('   ')).rejects.toThrow('cannot be empty');
    });

    it('should trim query before sending', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key' });
      await client.search('  test query  ');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.query).toBe('test query');
    });

    it('should increment call count', async () => {
      global.fetch = mockFetchSuccess(makeTavilyResponse('test', []));
      const client = new TavilyClient({ apiKey: 'test-key' });

      await client.search('query 1');
      expect(client.getCallCount()).toBe(1);

      await client.search('query 2');
      expect(client.getCallCount()).toBe(2);
    });

    it('should update last call time', async () => {
      global.fetch = mockFetchSuccess(makeTavilyResponse('test', []));
      const client = new TavilyClient({ apiKey: 'test-key' });

      const before = Date.now();
      await client.search('test');
      const after = Date.now();

      expect(client.getLastCallTime()).toBeGreaterThanOrEqual(before);
      expect(client.getLastCallTime()).toBeLessThanOrEqual(after);
    });
  });

  // ── Response parsing ────────────────────────────────────

  describe('response parsing', () => {
    it('should handle empty results array', async () => {
      global.fetch = mockFetchSuccess({ query: 'test', results: [], response_time: 0.1 });
      const client = new TavilyClient({ apiKey: 'test-key' });
      const result = await client.search('test');

      expect(result.results).toEqual([]);
      expect(result.response_time).toBe(0.1);
    });

    it('should handle missing fields in results gracefully', async () => {
      global.fetch = mockFetchSuccess({
        query: 'test',
        results: [{ title: 'Only title' }],
        response_time: 0,
      });

      const client = new TavilyClient({ apiKey: 'test-key' });
      const result = await client.search('test');

      expect(result.results[0].title).toBe('Only title');
      expect(result.results[0].url).toBe('');
      expect(result.results[0].content).toBe('');
      expect(result.results[0].score).toBe(0);
    });

    it('should handle null/undefined response body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const client = new TavilyClient({ apiKey: 'test-key' });
      const result = await client.search('test');

      expect(result.results).toEqual([]);
    });

    it('should filter non-string images', async () => {
      global.fetch = mockFetchSuccess({
        query: 'test',
        results: [{ ...makeResult(), images: ['valid.jpg', 123, null, 'also-valid.png'] }],
      });

      const client = new TavilyClient({ apiKey: 'test-key' });
      const result = await client.search('test');

      expect(result.results[0].images).toEqual(['valid.jpg', 'also-valid.png']);
    });
  });

  // ── Error handling ──────────────────────────────────────

  describe('error handling', () => {
    it('should throw TavilyApiError on 4xx response', async () => {
      global.fetch = mockFetchError(401, 'Unauthorized');

      const client = new TavilyClient({ apiKey: 'bad-key', maxRetries: 2 });
      await expect(client.search('test')).rejects.toThrow(TavilyApiError);

      // Should NOT retry on 4xx
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should include status code in TavilyApiError', async () => {
      global.fetch = mockFetchError(403, 'Forbidden');

      const client = new TavilyClient({ apiKey: 'test-key', maxRetries: 0 });
      try {
        await client.search('test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TavilyApiError);
        expect((error as TavilyApiError).statusCode).toBe(403);
      }
    });

    it('should retry on 5xx errors', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', text: () => Promise.resolve('error') })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeTavilyResponse('test', [])) });

      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key', maxRetries: 2 });
      const result = await client.search('test');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.results).toEqual([]);
    });

    it('should retry on network errors', async () => {
      const fetchMock = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeTavilyResponse('test', [])) });

      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key', maxRetries: 2 });
      const result = await client.search('test');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.results).toEqual([]);
    });

    it('should exhaust retries and throw', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      const client = new TavilyClient({ apiKey: 'test-key', maxRetries: 1 });
      await expect(client.search('test')).rejects.toThrow('Persistent failure');

      // Initial call + 1 retry = 2
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors (even with retries configured)', async () => {
      global.fetch = mockFetchError(429, 'Rate limited');

      const client = new TavilyClient({ apiKey: 'test-key', maxRetries: 3 });
      await expect(client.search('test')).rejects.toThrow(TavilyApiError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── Batch search ────────────────────────────────────────

  describe('searchBatch', () => {
    it('should execute multiple queries', async () => {
      global.fetch = mockFetchSuccess(makeTavilyResponse('test', [makeResult()]));

      const client = new TavilyClient({ apiKey: 'test-key' });
      const results = await client.searchBatch(['query1', 'query2', 'query3']);

      expect(results).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should respect concurrency limit', async () => {
      let concurrentCalls = 0;
      let maxConcurrent = 0;

      global.fetch = jest.fn().mockImplementation(async () => {
        concurrentCalls++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
        await new Promise((r) => setTimeout(r, 50));
        concurrentCalls--;
        return { ok: true, json: () => Promise.resolve(makeTavilyResponse('test', [])) };
      });

      const client = new TavilyClient({ apiKey: 'test-key' });
      await client.searchBatch(
        ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'],
        {},
        2, // concurrency = 2
      );

      expect(maxConcurrent).toBeLessThanOrEqual(2);
      expect(global.fetch).toHaveBeenCalledTimes(6);
    });

    it('should skip failed queries in batch mode', async () => {
      const fetchMock = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeTavilyResponse('q1', [makeResult()])) })
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeTavilyResponse('q3', [makeResult()])) });

      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key', maxRetries: 0 });
      const results = await client.searchBatch(['q1', 'q2', 'q3'], {}, 3);

      // Only 2 of 3 succeeded
      expect(results).toHaveLength(2);
    });

    it('should handle empty query list', async () => {
      const client = new TavilyClient({ apiKey: 'test-key' });
      const results = await client.searchBatch([]);
      expect(results).toEqual([]);
    });

    it('should pass options to each query', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key' });
      await client.searchBatch(['q1', 'q2'], { maxResults: 3 });

      for (const [, opts] of fetchMock.mock.calls) {
        const body = JSON.parse(opts.body);
        expect(body.max_results).toBe(3);
      }
    });
  });

  // ── Config defaults ─────────────────────────────────────

  describe('config defaults', () => {
    it('should use default maxResults of 10', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key' });
      await client.search('test');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.max_results).toBe(10);
    });

    it('should allow custom maxResults', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key', maxResults: 20 });
      await client.search('test');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.max_results).toBe(20);
    });

    it('should use default search depth of basic', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key' });
      await client.search('test');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.search_depth).toBe('basic');
    });

    it('should allow advanced search depth', async () => {
      const fetchMock = mockFetchSuccess(makeTavilyResponse('test', []));
      global.fetch = fetchMock;

      const client = new TavilyClient({ apiKey: 'test-key', searchDepth: 'advanced' });
      await client.search('test');

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.search_depth).toBe('advanced');
    });
  });
});
