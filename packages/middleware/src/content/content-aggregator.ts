/**
 * ContentAggregator — Orchestrates automated content fetching
 *
 * Coordinates the full pipeline:
 *   1. Build search queries from TAVILY topics + METRO_AREAS
 *   2. Fetch results via TavilyClient
 *   3. Parse results via ContentParser
 *   4. Deduplicate via ContentDeduplicator
 *   5. Store unique content via Repositories
 *   6. Track sync events
 *
 * Designed to be called by a cron job every 4-6 hours.
 */

import type { Repositories } from '@desi-connect/database';
import type { SyncEvent } from '@desi-connect/shared';
import { TAVILY, METRO_AREAS } from '@desi-connect/shared';
import { TavilyClient } from './tavily-client';
import type { TavilyClientConfig, TavilySearchOptions } from './tavily-client';
import { ContentParser } from './content-parser';
import type { ParsedContent, ContentParserConfig } from './content-parser';
import { ContentDeduplicator } from './deduplicator';
import type { DeduplicatorConfig } from './deduplicator';

export interface ContentAggregatorConfig {
  tavily: TavilyClientConfig;
  parser?: ContentParserConfig;
  deduplicator?: DeduplicatorConfig;
  /** Metro areas to search (defaults to all METRO_AREAS) */
  metroAreas?: ReadonlyArray<{ city: string; state: string; slug: string }>;
  /** Search topics (defaults to TAVILY.SEARCH_TOPICS) */
  searchTopics?: readonly string[];
  /** Max concurrent Tavily API calls (default: 3) */
  concurrency?: number;
  /** Whether to persist sync events (default: true) */
  trackSyncEvents?: boolean;
}

export interface AggregationRun {
  /** Unique ID for this run */
  runId: string;
  /** When the run started */
  startedAt: string;
  /** When the run completed */
  completedAt: string;
  /** Total search queries executed */
  queriesExecuted: number;
  /** Total raw results from Tavily */
  rawResultsCount: number;
  /** Items after dedup */
  uniqueItemsCount: number;
  /** Items that were duplicates */
  duplicateCount: number;
  /** Successfully stored news articles */
  newsStored: number;
  /** Successfully stored events */
  eventsStored: number;
  /** Errors encountered during storage */
  storageErrors: string[];
  /** Sync events generated */
  syncEvents: SyncEvent[];
}

export class ContentAggregator {
  private readonly client: TavilyClient;
  private readonly parser: ContentParser;
  private readonly deduplicator: ContentDeduplicator;
  private readonly repos: Repositories;
  private readonly metroAreas: ReadonlyArray<{ city: string; state: string; slug: string }>;
  private readonly searchTopics: readonly string[];
  private readonly concurrency: number;
  private readonly trackSyncEvents: boolean;

  constructor(repos: Repositories, config: ContentAggregatorConfig) {
    this.repos = repos;
    this.client = new TavilyClient(config.tavily);
    this.parser = new ContentParser(config.parser);
    this.deduplicator = new ContentDeduplicator(config.deduplicator);
    this.metroAreas = config.metroAreas ?? METRO_AREAS;
    this.searchTopics = config.searchTopics ?? TAVILY.SEARCH_TOPICS;
    this.concurrency = config.concurrency ?? 3;
    this.trackSyncEvents = config.trackSyncEvents ?? true;
  }

  /**
   * Run a full aggregation cycle:
   *   - Build queries for each topic × metro area combo
   *   - Fetch, parse, deduplicate, store
   */
  async run(options?: TavilySearchOptions): Promise<AggregationRun> {
    const runId = this.generateRunId();
    const startedAt = new Date().toISOString();
    const storageErrors: string[] = [];
    const syncEvents: SyncEvent[] = [];

    // 1. Build search queries
    const queries = this.buildQueries();

    // 2. Fetch results from Tavily
    const searchResponses = await this.client.searchBatch(
      queries.map((q) => q.query),
      options,
      this.concurrency,
    );

    // 3. Parse all results into domain objects
    const allParsed: ParsedContent[] = [];
    let rawResultsCount = 0;

    for (const response of searchResponses) {
      rawResultsCount += response.results.length;

      // Find the matching query config for location hints
      const queryConfig = queries.find((q) => q.query === response.query);

      for (const result of response.results) {
        const parsed = this.parser.parse(
          result,
          response.query,
          queryConfig?.location,
        );
        allParsed.push(parsed);
      }
    }

    // 4. Deduplicate
    const dedupResult = await this.deduplicator.deduplicate(allParsed, this.repos);

    // 5. Store unique items
    let newsStored = 0;
    let eventsStored = 0;

    for (const item of dedupResult.unique) {
      try {
        if (item.type === 'news' && item.news) {
          await this.repos.news.create(item.news);
          newsStored++;

          if (this.trackSyncEvents) {
            syncEvents.push(this.createSyncEvent('news', runId));
          }
        } else if (item.type === 'event' && item.event) {
          await this.repos.events.create(item.event);
          eventsStored++;

          if (this.trackSyncEvents) {
            syncEvents.push(this.createSyncEvent('events', runId));
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        storageErrors.push(`Failed to store ${item.type}: ${msg}`);
      }
    }

    return {
      runId,
      startedAt,
      completedAt: new Date().toISOString(),
      queriesExecuted: queries.length,
      rawResultsCount,
      uniqueItemsCount: dedupResult.unique.length,
      duplicateCount: dedupResult.duplicates.length,
      newsStored,
      eventsStored,
      storageErrors,
      syncEvents,
    };
  }

  /**
   * Run aggregation for a single metro area only.
   * Useful for targeted refreshes.
   */
  async runForMetro(
    metroSlug: string,
    options?: TavilySearchOptions,
  ): Promise<AggregationRun> {
    const metro = this.metroAreas.find((m) => m.slug === metroSlug);
    if (!metro) {
      throw new Error(`Unknown metro area slug: ${metroSlug}`);
    }

    // Create a temporary aggregator scoped to one metro
    const scopedAggregator = new ContentAggregator(this.repos, {
      tavily: { apiKey: '(reuse)', baseUrl: '(reuse)' } as any, // Won't be used
      metroAreas: [metro],
      searchTopics: this.searchTopics,
      concurrency: this.concurrency,
      trackSyncEvents: this.trackSyncEvents,
    });

    // Override the client with our existing one
    (scopedAggregator as any).client = this.client;

    return scopedAggregator.run(options);
  }

  /**
   * Run aggregation for a single topic only.
   * Useful for priority content like immigration alerts.
   */
  async runForTopic(
    topic: string,
    options?: TavilySearchOptions,
  ): Promise<AggregationRun> {
    const scopedAggregator = new ContentAggregator(this.repos, {
      tavily: { apiKey: '(reuse)' } as any,
      metroAreas: this.metroAreas,
      searchTopics: [topic],
      concurrency: this.concurrency,
      trackSyncEvents: this.trackSyncEvents,
    });

    (scopedAggregator as any).client = this.client;

    return scopedAggregator.run(options);
  }

  /**
   * Get the TavilyClient for direct API access if needed.
   */
  getClient(): TavilyClient {
    return this.client;
  }

  // ── Private helpers ────────────────────────────────────────

  private buildQueries(): Array<{ query: string; location?: { city: string; state: string } }> {
    const queries: Array<{ query: string; location?: { city: string; state: string } }> = [];

    for (const topic of this.searchTopics) {
      // Global query (no metro-specific)
      queries.push({ query: topic });

      // Metro-specific queries
      for (const metro of this.metroAreas) {
        queries.push({
          query: `${topic} ${metro.city} ${metro.state}`,
          location: { city: metro.city, state: metro.state },
        });
      }
    }

    return queries;
  }

  private createSyncEvent(sourceTable: string, runId: string): SyncEvent {
    return {
      sync_id: `${runId}-${sourceTable}-${Date.now()}`,
      direction: 'external_to_both',
      source_table: sourceTable,
      record_id: '', // Filled after storage
      event_type: 'create',
      payload: {},
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };
  }

  private generateRunId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `agg-${timestamp}-${random}`;
  }
}
