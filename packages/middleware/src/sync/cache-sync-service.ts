/**
 * Cache Sync Service (Section 8 - Sync Pipeline)
 *
 * Synchronizes data from Teable (source of truth) to NoCodeBackend (read cache).
 * Handles retries, backoff, and error reporting.
 */

import type { TableName } from './webhook-handler';

/**
 * Configuration for cache sync
 */
export interface CacheSyncConfig {
  noCodeBackendUrl: string;
  noCodeBackendApiKey: string;
  retryAttempts: number;
  retryDelayMs: number;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  table: TableName;
  records_synced: number;
  errors?: string[];
  duration_ms: number;
}

/**
 * HTTP client interface
 */
export interface HttpClient {
  post: (url: string, data: any, opts?: any) => Promise<any>;
  put: (url: string, data: any, opts?: any) => Promise<any>;
  delete: (url: string, opts?: any) => Promise<any>;
}

/**
 * Logger interface
 */
export interface Logger {
  info: (msg: string, ...args: any[]) => void;
  warn: (msg: string, ...args: any[]) => void;
  error: (msg: string, ...args: any[]) => void;
  debug: (msg: string, ...args: any[]) => void;
}

/**
 * Dependencies for CacheSyncService
 */
export interface CacheSyncDeps {
  httpClient: HttpClient;
  logger?: Logger;
}

/**
 * Syncs data from Teable to NoCodeBackend cache with retry logic
 */
export class CacheSyncService {
  private readonly config: CacheSyncConfig;
  private readonly httpClient: HttpClient;
  private readonly logger: Logger;

  constructor(config: CacheSyncConfig, deps: CacheSyncDeps) {
    this.config = config;
    this.httpClient = deps.httpClient;
    this.logger = deps.logger || {
      info: (msg: string) => console.log('[CacheSyncService]', msg),
      warn: (msg: string) => console.warn('[CacheSyncService]', msg),
      error: (msg: string) => console.error('[CacheSyncService]', msg),
      debug: (msg: string) => console.debug('[CacheSyncService]', msg),
    };
  }

  /**
   * Sync a single record to NoCodeBackend cache
   * - Creates or updates record depending on existence
   * - Includes authentication via API key
   * - Retries on failure with exponential backoff
   *
   * @param table - Table name
   * @param recordId - Record ID from Teable
   * @param data - Record data to sync
   * @returns SyncResult with success status
   */
  async syncRecord(
    table: TableName,
    recordId: string,
    data: Record<string, unknown>,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const url = this.buildEndpointUrl(table, recordId);

      this.logger.debug(`Syncing record to cache: ${table}/${recordId}`);

      // Attempt to sync with retry logic
      await this.retryWithBackoff(
        async () => {
          const headers = {
            'Authorization': `Bearer ${this.config.noCodeBackendApiKey}`,
            'Content-Type': 'application/json',
          };

          // First try PUT (update), fall back to POST (create)
          try {
            await this.httpClient.put(url, data, { headers });
            this.logger.info(`Updated record in cache: ${table}/${recordId}`);
          } catch (putErr: any) {
            // If 404, try POST instead
            if (putErr?.status === 404) {
              await this.httpClient.post(url, data, { headers });
              this.logger.info(`Created new record in cache: ${table}/${recordId}`);
            } else {
              throw putErr;
            }
          }
        },
        this.config.retryAttempts,
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        table,
        records_synced: 1,
        duration_ms: duration,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      errors.push(errorMsg);

      this.logger.error(`Failed to sync record to cache: ${table}/${recordId} - ${errorMsg}`);

      const duration = Date.now() - startTime;

      return {
        success: false,
        table,
        records_synced: 0,
        errors,
        duration_ms: duration,
      };
    }
  }

  /**
   * Delete a record from NoCodeBackend cache
   * - Sends DELETE request to cache API
   * - Retries on failure with exponential backoff
   *
   * @param table - Table name
   * @param recordId - Record ID to delete
   * @returns SyncResult with success status
   */
  async deleteFromCache(table: TableName, recordId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const url = this.buildEndpointUrl(table, recordId);

      this.logger.debug(`Deleting record from cache: ${table}/${recordId}`);

      await this.retryWithBackoff(
        async () => {
          const headers = {
            'Authorization': `Bearer ${this.config.noCodeBackendApiKey}`,
          };

          await this.httpClient.delete(url, { headers });
          this.logger.info(`Deleted record from cache: ${table}/${recordId}`);
        },
        this.config.retryAttempts,
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        table,
        records_synced: 1,
        duration_ms: duration,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      errors.push(errorMsg);

      this.logger.error(`Failed to delete record from cache: ${table}/${recordId} - ${errorMsg}`);

      const duration = Date.now() - startTime;

      return {
        success: false,
        table,
        records_synced: 0,
        errors,
        duration_ms: duration,
      };
    }
  }

  /**
   * Perform a full table resync
   * Syncs all records for a table (used for recovery/reconciliation)
   *
   * @param table - Table name
   * @param records - Array of records to sync
   * @returns SyncResult with total records synced
   */
  async fullTableSync(
    table: TableName,
    records: Record<string, unknown>[],
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsSynced = 0;

    this.logger.info(`Starting full table sync for ${table}: ${records.length} records`);

    for (const record of records) {
      try {
        const recordId = record.id as string;
        if (!recordId) {
          this.logger.warn(`Skipping record with missing ID in ${table}`);
          continue;
        }

        const result = await this.syncRecord(table, recordId, record);
        if (result.success) {
          recordsSynced++;
        } else {
          errors.push(
            `Failed to sync ${table}/${recordId}: ${(result.errors || []).join(', ')}`,
          );
        }
      } catch (err: any) {
        errors.push(`Error syncing record in ${table}: ${err?.message}`);
      }
    }

    const duration = Date.now() - startTime;

    this.logger.info(`Full table sync for ${table} completed: ${recordsSynced}/${records.length} records`, {
      duration_ms: duration,
      errors: errors.length > 0 ? errors : undefined,
    });

    return {
      success: errors.length === 0,
      table,
      records_synced: recordsSynced,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
    };
  }

  /**
   * Build NoCodeBackend endpoint URL
   * Format: /api/v1/tables/{table}/{recordId?}
   */
  private buildEndpointUrl(table: TableName, recordId?: string): string {
    const baseUrl = this.config.noCodeBackendUrl.replace(/\/$/, '');
    const path = `/api/v1/tables/${table}`;

    if (recordId) {
      return `${baseUrl}${path}/${recordId}`;
    }

    return `${baseUrl}${path}`;
  }

  /**
   * Retry a function with exponential backoff
   * - Attempts the function up to `attempts` times
   * - Waits with increasing delay between attempts
   * - Throws on final failure
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempts: number,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;

        if (attempt < attempts) {
          // Exponential backoff: delay = retryDelayMs * 2^(attempt-1)
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
          this.logger.debug(`Retry attempt ${attempt}/${attempts} - waiting ${delay}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
