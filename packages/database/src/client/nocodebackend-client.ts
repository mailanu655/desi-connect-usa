/**
 * NoCodeBackend API Cache Client (Section 4.1)
 *
 * Read-optimized API cache layer in the 3-hop sync model.
 * NoCodeBackend mirrors Teable data and provides fast public-facing reads
 * for the website and WhatsApp bot.
 *
 * Write path:  Teable (source) → webhook → sync → NoCodeBackend (cache)
 * Read path:   Website/Bot → NoCodeBackend (fast cached reads)
 */

import type { NoCodeBackendResponse } from '@desi-connect/shared';

export interface NoCodeBackendConfig {
  baseUrl: string;
  apiKey: string;
  projectId: string;
  /** Optional request timeout in ms (default: 8000) */
  timeoutMs?: number;
}

export interface NoCodeBackendQueryParams {
  /** Page number (1-based) */
  page?: number;
  /** Records per page */
  limit?: number;
  /** Sort field and direction (e.g., "created_at:desc") */
  sort?: string;
  /** Filter object — key-value pairs for exact match */
  filter?: Record<string, string | number | boolean>;
  /** Full-text search query */
  search?: string;
}

/**
 * Read-only client for NoCodeBackend API cache.
 * Used for public-facing reads (website pages, bot responses).
 */
export class NoCodeBackendClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly projectId: string;
  private readonly timeoutMs: number;

  constructor(config: NoCodeBackendConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.timeoutMs = config.timeoutMs ?? 8_000;
  }

  /**
   * List records from a collection with optional filtering.
   */
  async listRecords<T>(
    collection: string,
    params: NoCodeBackendQueryParams = {},
  ): Promise<NoCodeBackendResponse<T>> {
    const url = new URL(
      `${this.baseUrl}/projects/${this.projectId}/collections/${collection}/records`,
    );

    if (params.page) url.searchParams.set('page', String(params.page));
    if (params.limit) url.searchParams.set('limit', String(params.limit));
    if (params.sort) url.searchParams.set('sort', params.sort);
    if (params.search) url.searchParams.set('search', params.search);

    if (params.filter) {
      for (const [key, value] of Object.entries(params.filter)) {
        url.searchParams.set(`filter[${key}]`, String(value));
      }
    }

    return this.request<NoCodeBackendResponse<T>>('GET', url.toString());
  }

  /**
   * Get a single record by ID from a collection.
   */
  async getRecord<T>(collection: string, recordId: string): Promise<T> {
    const url =
      `${this.baseUrl}/projects/${this.projectId}/collections/${collection}/records/${recordId}`;
    return this.request<T>('GET', url);
  }

  /**
   * Upsert a record into the cache (used by sync pipeline).
   * This is the only write operation — called by the sync worker, not by end users.
   */
  async upsertRecord<T>(
    collection: string,
    recordId: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    const url =
      `${this.baseUrl}/projects/${this.projectId}/collections/${collection}/records/${recordId}`;
    return this.request<T>('PUT', url, data);
  }

  /**
   * Delete a record from the cache (used by sync pipeline).
   */
  async deleteRecord(collection: string, recordId: string): Promise<void> {
    const url =
      `${this.baseUrl}/projects/${this.projectId}/collections/${collection}/records/${recordId}`;
    await this.request<void>('DELETE', url);
  }

  /**
   * Internal HTTP request helper.
   */
  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      const options: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new NoCodeBackendApiError(
          `NoCodeBackend API error: ${response.status} ${response.statusText}`,
          response.status,
          errorBody,
        );
      }

      if (method === 'DELETE') {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Custom error class for NoCodeBackend API errors.
 */
export class NoCodeBackendApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string,
  ) {
    super(message);
    this.name = 'NoCodeBackendApiError';
  }
}
