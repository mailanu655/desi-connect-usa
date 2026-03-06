/**
 * ContentDeduplicator — Prevents duplicate content from being stored
 *
 * Uses URL-based matching (primary) and title similarity (secondary)
 * to detect duplicates against existing repository data.
 */

import type { Repositories } from '@desi-connect/database';
import type { ParsedContent } from './content-parser';

export interface DeduplicatorConfig {
  /** Title similarity threshold (0-1, default: 0.8) */
  titleSimilarityThreshold?: number;
  /** Max existing records to check against (default: 200) */
  lookbackLimit?: number;
}

export interface DeduplicationResult {
  /** Items that passed dedup and are ready to store */
  unique: ParsedContent[];
  /** Items that were detected as duplicates */
  duplicates: ParsedContent[];
  /** Total items checked */
  totalChecked: number;
}

export class ContentDeduplicator {
  private readonly titleSimilarityThreshold: number;
  private readonly lookbackLimit: number;

  constructor(config: DeduplicatorConfig = {}) {
    this.titleSimilarityThreshold = config.titleSimilarityThreshold ?? 0.8;
    this.lookbackLimit = config.lookbackLimit ?? 200;
  }

  /**
   * Filter out duplicate content by comparing against existing records.
   * Uses URL matching (exact) and title similarity (fuzzy).
   */
  async deduplicate(
    items: ParsedContent[],
    repos: Repositories,
  ): Promise<DeduplicationResult> {
    // Fetch existing URLs for comparison
    const [existingNews, existingEvents] = await Promise.all([
      repos.news.list({ limit: this.lookbackLimit }).catch(() => ({ data: [], total: 0 })),
      repos.events.list({ limit: this.lookbackLimit }).catch(() => ({ data: [], total: 0 })),
    ]);

    const existingNewsUrls = new Set(
      existingNews.data
        .map((n: any) => n.source_url)
        .filter(Boolean)
        .map((url: string) => this.normalizeUrl(url)),
    );

    const existingEventTitles = existingEvents.data.map(
      (e: any) => String(e.title ?? '').toLowerCase(),
    );

    const existingNewsTitles = existingNews.data.map(
      (n: any) => String(n.title ?? '').toLowerCase(),
    );

    const unique: ParsedContent[] = [];
    const duplicates: ParsedContent[] = [];

    // Also track URLs within the current batch to avoid intra-batch dupes
    const batchUrls = new Set<string>();

    for (const item of items) {
      const isDupe = this.isDuplicate(
        item,
        existingNewsUrls,
        existingNewsTitles,
        existingEventTitles,
        batchUrls,
      );

      if (isDupe) {
        duplicates.push(item);
      } else {
        unique.push(item);
        // Track URL for intra-batch dedup
        const url = this.getUrl(item);
        if (url) batchUrls.add(this.normalizeUrl(url));
      }
    }

    return {
      unique,
      duplicates,
      totalChecked: items.length,
    };
  }

  /**
   * Check if a single parsed content item is a duplicate.
   */
  private isDuplicate(
    item: ParsedContent,
    existingNewsUrls: Set<string>,
    existingNewsTitles: string[],
    existingEventTitles: string[],
    batchUrls: Set<string>,
  ): boolean {
    // 1. URL-based dedup (exact match)
    const url = this.getUrl(item);
    if (url) {
      const normalizedUrl = this.normalizeUrl(url);
      if (existingNewsUrls.has(normalizedUrl) || batchUrls.has(normalizedUrl)) {
        return true;
      }
    }

    // 2. Title-based dedup (fuzzy match)
    const title = this.getTitle(item).toLowerCase();
    if (!title) return false;

    const titlesToCheck = item.type === 'event' ? existingEventTitles : existingNewsTitles;

    for (const existing of titlesToCheck) {
      if (this.titleSimilarity(title, existing) >= this.titleSimilarityThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compute similarity between two title strings (0-1).
   * Uses Jaccard similarity on word sets.
   */
  titleSimilarity(a: string, b: string): number {
    const wordsA = this.tokenize(a);
    const wordsB = this.tokenize(b);

    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = wordsA.size + wordsB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  // ── Private helpers ────────────────────────────────────────

  private getUrl(item: ParsedContent): string | null {
    if (item.type === 'news' && item.news) {
      return item.news.source_url ?? null;
    }
    return null; // Events don't have source_url
  }

  private getTitle(item: ParsedContent): string {
    if (item.type === 'news' && item.news) return item.news.title;
    if (item.type === 'event' && item.event) return item.event.title;
    return '';
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, www prefix, and query params for comparison
      return (parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '')).toLowerCase();
    } catch {
      return url.toLowerCase().trim();
    }
  }

  private tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2); // Skip short words
    return new Set(words);
  }
}
