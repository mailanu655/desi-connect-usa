/**
 * TavilyClient — HTTP wrapper for the Tavily Search API
 *
 * Handles authentication, rate limiting, retry logic, and
 * type-safe response parsing. Used by ContentAggregator to
 * fetch news/events for the Indian diaspora community.
 */

import type { TavilySearchResult, TavilySearchResponse } from '@desi-connect/shared';

export interface TavilyClientConfig {
  apiKey: string;
  baseUrl?: string;
  /** Max results per query (default: 10) */
  maxResults?: number;
  /** Request timeout in ms (default: 15000) */
  timeoutMs?: number;
  /** Max retries on transient failures (default: 2) */
  maxRetries?: number;
  /** Search depth: 'basic' or 'advanced' (default: 'basic') */
  searchDepth?: 'basic' | 'advanced';
}

export interface TavilySearchOptions {
  /** Override max results for this query */
  maxResults?: number;
  /** Include specific domains */
  includeDomains?: string[];
  /** Exclude specific domains */
  excludeDomains?: string[];
  /** Override search depth for this query */
  searchDepth?: 'basic' | 'advanced';
}

export class TavilyApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
  ) {
    super(message);
    this.name = 'TavilyApiError';
  }
}

export class TavilyClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxResults: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly searchDepth: 'basic' | 'advanced';

  /** Track total API calls for rate limit awareness */
  private callCount = 0;
  private lastCallTime = 0;

  constructor(config: TavilyClientConfig) {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('TavilyClient requires a valid apiKey');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.tavily.com';
    this.maxResults = config.maxResults ?? 10;
    this.timeoutMs = config.timeoutMs ?? 15_000;
    this.maxRetries = config.maxRetries ?? 2;
    this.searchDepth = config.searchDepth ?? 'basic';
  }

  /**
   * Execute a search query against Tavily API
   */
  async search(
    query: string,
    options: TavilySearchOptions = {},
  ): Promise<TavilySearchResponse> {
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty');
    }

    const body = {
      api_key: this.apiKey,
      query: query.trim(),
      search_depth: options.searchDepth ?? this.searchDepth,
      max_results: options.maxResults ?? this.maxResults,
      include_domains: options.includeDomains ?? [],
      exclude_domains: options.excludeDomains ?? [],
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/search`, body);
    return this.parseSearchResponse(response, query);
  }

  /**
   * Execute multiple search queries in parallel with concurrency limit
   */
  async searchBatch(
    queries: string[],
    options: TavilySearchOptions = {},
    concurrency = 3,
  ): Promise<TavilySearchResponse[]> {
    const results: TavilySearchResponse[] = [];
    const chunks = this.chunk(queries, concurrency);

    for (const batch of chunks) {
      const batchResults = await Promise.allSettled(
        batch.map((q) => this.search(q, options)),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
        // Silently skip failed queries in batch mode
      }
    }

    return results;
  }

  /** Get total API calls made since instantiation */
  getCallCount(): number {
    return this.callCount;
  }

  /** Get timestamp of last API call */
  getLastCallTime(): number {
    return this.lastCallTime;
  }

  // ── Private helpers ────────────────────────────────────────

  private async fetchWithRetry(
    url: string,
    body: Record<string, unknown>,
    attempt = 0,
  ): Promise<unknown> {
    try {
      this.callCount++;
      this.lastCallTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseBody = await response.text().catch(() => 'unknown');
        throw new TavilyApiError(
          `Tavily API error: ${response.status} ${response.statusText}`,
          response.status,
          responseBody,
        );
      }

      return await response.json();
    } catch (error) {
      // Don't retry on client errors (4xx)
      if (error instanceof TavilyApiError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      if (attempt < this.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
        return this.fetchWithRetry(url, body, attempt + 1);
      }

      throw error;
    }
  }

  private parseSearchResponse(raw: unknown, query: string): TavilySearchResponse {
    if (!raw || typeof raw !== 'object') {
      return { query, results: [], response_time: 0 };
    }

    const data = raw as Record<string, unknown>;
    const results: TavilySearchResult[] = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results) {
        if (item && typeof item === 'object') {
          const r = item as Record<string, unknown>;
          results.push({
            title: String(r.title ?? ''),
            url: String(r.url ?? ''),
            content: String(r.content ?? ''),
            score: typeof r.score === 'number' ? r.score : 0,
            published_date: typeof r.published_date === 'string' ? r.published_date : undefined,
            images: Array.isArray(r.images) ? r.images.filter((i): i is string => typeof i === 'string') : undefined,
          });
        }
      }
    }

    return {
      query: String(data.query ?? query),
      results,
      response_time: typeof data.response_time === 'number' ? data.response_time : 0,
    };
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
