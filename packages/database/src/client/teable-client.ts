/**
 * Teable REST API Client (Section 4.1)
 *
 * Generic HTTP client for Teable's REST API.
 * Teable is the PostgreSQL-based source of truth in the 3-hop sync model.
 *
 * All writes go through Teable. Reads can go through either Teable (admin)
 * or NoCodeBackend (cached, public-facing).
 *
 * API reference: https://app.teable.io/docs/developer/api
 */

import type {
  TeableRecord,
  TeableListResponse,
} from '@desi-connect/shared';

export interface TeableClientConfig {
  baseUrl: string;
  apiKey: string;
  /** Optional request timeout in ms (default: 10000) */
  timeoutMs?: number;
}

export interface TeableQueryParams {
  /** Filter formula (Teable filter syntax) */
  filter?: string;
  /** Sort specification */
  sort?: string;
  /** Maximum records to return (default: 100) */
  maxRecords?: number;
  /** Pagination offset token */
  offset?: string;
  /** Field names to include (default: all) */
  fields?: string[];
  /** Search query */
  search?: string;
}

export interface TeableCreatePayload {
  fields: Record<string, unknown>;
}

export interface TeableUpdatePayload {
  fields: Record<string, unknown>;
}

export interface TeableBatchCreatePayload {
  records: Array<{ fields: Record<string, unknown> }>;
}

/**
 * Low-level Teable REST API client.
 * Provides CRUD operations against a single Teable table.
 */
export class TeableClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(config: TeableClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  /**
   * List records from a table with optional filtering/sorting.
   */
  async listRecords(
    tableId: string,
    params: TeableQueryParams = {},
  ): Promise<TeableListResponse> {
    const url = new URL(`${this.baseUrl}/api/table/${tableId}/record`);

    if (params.filter) url.searchParams.set('filter', params.filter);
    if (params.sort) url.searchParams.set('sort', params.sort);
    if (params.maxRecords) url.searchParams.set('maxRecords', String(params.maxRecords));
    if (params.offset) url.searchParams.set('offset', params.offset);
    if (params.fields) url.searchParams.set('fields', params.fields.join(','));
    if (params.search) url.searchParams.set('search', params.search);

    const response = await this.request<TeableListResponse>('GET', url.toString());
    return response;
  }

  /**
   * Get a single record by ID.
   */
  async getRecord(tableId: string, recordId: string): Promise<TeableRecord> {
    const url = `${this.baseUrl}/api/table/${tableId}/record/${recordId}`;
    return this.request<TeableRecord>('GET', url);
  }

  /**
   * Create a new record.
   */
  async createRecord(
    tableId: string,
    payload: TeableCreatePayload,
  ): Promise<TeableRecord> {
    const url = `${this.baseUrl}/api/table/${tableId}/record`;
    return this.request<TeableRecord>('POST', url, payload);
  }

  /**
   * Create multiple records in a single request.
   */
  async batchCreateRecords(
    tableId: string,
    payload: TeableBatchCreatePayload,
  ): Promise<{ records: TeableRecord[] }> {
    const url = `${this.baseUrl}/api/table/${tableId}/record`;
    return this.request<{ records: TeableRecord[] }>('POST', url, payload);
  }

  /**
   * Update an existing record.
   */
  async updateRecord(
    tableId: string,
    recordId: string,
    payload: TeableUpdatePayload,
  ): Promise<TeableRecord> {
    const url = `${this.baseUrl}/api/table/${tableId}/record/${recordId}`;
    return this.request<TeableRecord>('PATCH', url, payload);
  }

  /**
   * Delete a record.
   */
  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    const url = `${this.baseUrl}/api/table/${tableId}/record/${recordId}`;
    await this.request<void>('DELETE', url);
  }

  /**
   * Internal HTTP request helper with auth, timeout, and error handling.
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
        throw new TeableApiError(
          `Teable API error: ${response.status} ${response.statusText}`,
          response.status,
          errorBody,
        );
      }

      // DELETE returns no body
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
 * Custom error class for Teable API errors.
 * Includes HTTP status code and response body for debugging.
 */
export class TeableApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string,
  ) {
    super(message);
    this.name = 'TeableApiError';
  }
}
