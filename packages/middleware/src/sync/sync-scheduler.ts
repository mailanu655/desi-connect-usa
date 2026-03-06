/**
 * Sync Scheduler (Section 8 - Sync Pipeline)
 *
 * Manages periodic full syncs and health checks.
 * Ensures data consistency between Teable and cache via scheduled tasks.
 */

import type { TableName } from './webhook-handler';

/**
 * Configuration for sync scheduler
 */
export interface SyncSchedulerConfig {
  fullSyncIntervalMs: number; // Default: 15 minutes
  healthCheckIntervalMs: number; // Default: 5 minutes
  tables: TableName[];
}

/**
 * Result of a full sync run
 */
export interface FullSyncResult {
  success: boolean;
  tables_synced: TableName[];
  total_records: number;
  duration_ms: number;
  errors?: string[];
}

/**
 * Result of a health check run
 */
export interface HealthCheckResult {
  healthy: boolean;
  teable_reachable: boolean;
  nocodeback_reachable: boolean;
  last_sync_age_ms: number;
  warnings?: string[];
}

/**
 * Current status of the scheduler
 */
export interface SchedulerStatus {
  running: boolean;
  last_full_sync: string | null;
  last_health_check: string | null;
  next_full_sync: string | null;
  sync_count: number;
  error_count: number;
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
 * Cache sync service interface
 */
export interface CacheSyncService {
  fullTableSync(table: TableName, records: any[]): Promise<any>;
}

/**
 * Teable client interface
 */
export interface TeableClient {
  getRecords: (table: string) => Promise<any[]>;
}

/**
 * Dependencies for SyncScheduler
 */
export interface SyncSchedulerDeps {
  cacheSyncService: CacheSyncService;
  teableClient: TeableClient;
  logger?: Logger;
}

/**
 * Manages periodic full syncs and health checks
 */
export class SyncScheduler {
  private readonly config: SyncSchedulerConfig;
  private readonly cacheSyncService: CacheSyncService;
  private readonly teableClient: TeableClient;
  private readonly logger: Logger;

  private running: boolean = false;
  private fullSyncInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private lastFullSync: Date | null = null;
  private lastHealthCheck: Date | null = null;
  private syncCount: number = 0;
  private errorCount: number = 0;

  constructor(config: SyncSchedulerConfig, deps: SyncSchedulerDeps) {
    this.config = config;
    this.cacheSyncService = deps.cacheSyncService;
    this.teableClient = deps.teableClient;
    this.logger = deps.logger || {
      info: (msg: string) => console.log('[SyncScheduler]', msg),
      warn: (msg: string) => console.warn('[SyncScheduler]', msg),
      error: (msg: string) => console.error('[SyncScheduler]', msg),
      debug: (msg: string) => console.debug('[SyncScheduler]', msg),
    };
  }

  /**
   * Start the scheduler
   * - Begins periodic full sync interval
   * - Begins periodic health check interval
   * - Runs initial sync immediately
   */
  start(): void {
    if (this.running) {
      this.logger.warn('Scheduler is already running');
      return;
    }

    this.running = true;
    this.logger.info('Scheduler starting', {
      fullSyncInterval: this.config.fullSyncIntervalMs,
      healthCheckInterval: this.config.healthCheckIntervalMs,
      tables: this.config.tables,
    });

    // Run initial full sync immediately
    this.runFullSync()
      .then((result) => {
        this.logger.info('Initial full sync completed', {
          success: result.success,
          records: result.total_records,
          duration: result.duration_ms,
        });
      })
      .catch((err) => {
        this.logger.error(`Initial full sync failed: ${err?.message}`);
        this.errorCount++;
      });

    // Schedule periodic full syncs
    this.fullSyncInterval = setInterval(
      () => {
        this.runFullSync()
          .then((result) => {
            this.logger.info('Scheduled full sync completed', {
              success: result.success,
              records: result.total_records,
            });
          })
          .catch((err) => {
            this.logger.error(`Scheduled full sync failed: ${err?.message}`);
            this.errorCount++;
          });
      },
      this.config.fullSyncIntervalMs,
    );

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(
      () => {
        this.runHealthCheck()
          .then((result) => {
            if (result.healthy) {
              this.logger.debug('Health check passed');
            } else {
              this.logger.warn('Health check failed', {
                teable: result.teable_reachable,
                nocodeback: result.nocodeback_reachable,
                warnings: result.warnings,
              });
            }
          })
          .catch((err) => {
            this.logger.error(`Health check failed: ${err?.message}`);
          });
      },
      this.config.healthCheckIntervalMs,
    );
  }

  /**
   * Stop the scheduler
   * - Clears all intervals
   * - Sets running flag to false
   */
  stop(): void {
    if (!this.running) {
      this.logger.warn('Scheduler is not running');
      return;
    }

    this.running = false;

    if (this.fullSyncInterval) {
      clearInterval(this.fullSyncInterval);
      this.fullSyncInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.logger.info('Scheduler stopped');
  }

  /**
   * Run a full table sync across all configured tables
   * - Fetches all records from Teable
   * - Syncs to NoCodeBackend cache
   * - Records metrics and errors
   *
   * @returns FullSyncResult with success status and metrics
   */
  async runFullSync(): Promise<FullSyncResult> {
    const startTime = Date.now();
    const syncedTables: TableName[] = [];
    const errors: string[] = [];
    let totalRecords = 0;

    this.logger.info('Starting full sync cycle');

    for (const table of this.config.tables) {
      try {
        this.logger.debug(`Fetching records from Teable: ${table}`);

        // Fetch records from Teable
        const records = await this.teableClient.getRecords(table);
        totalRecords += records.length;

        this.logger.debug(`Syncing ${records.length} records from ${table} to cache`);

        // Sync to cache
        const result = await this.cacheSyncService.fullTableSync(table, records);

        if (result.success) {
          syncedTables.push(table);
          this.logger.info(`Full sync completed for ${table}: ${result.records_synced} records`);
        } else {
          errors.push(
            `Failed to fully sync ${table}: ${(result.errors || []).join(', ')}`,
          );
          this.logger.error(`Full sync failed for ${table}`, result.errors);
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        errors.push(`Error syncing ${table}: ${errorMsg}`);
        this.logger.error(`Error during full sync for ${table}: ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    this.lastFullSync = new Date();
    this.syncCount++;

    const result: FullSyncResult = {
      success: errors.length === 0,
      tables_synced: syncedTables,
      total_records: totalRecords,
      duration_ms: duration,
      errors: errors.length > 0 ? errors : undefined,
    };

    if (!result.success) {
      this.errorCount++;
    }

    return result;
  }

  /**
   * Run a health check
   * - Verifies Teable is reachable
   * - Verifies NoCodeBackend cache is reachable
   * - Checks age of last sync
   * - Returns overall health status
   *
   * @returns HealthCheckResult with health status
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    const warnings: string[] = [];
    let teableReachable = false;
    let nocodebackReachable = false;

    // Check Teable connectivity
    try {
      await this.teableClient.getRecords('users');
      teableReachable = true;
    } catch (err: any) {
      warnings.push(`Teable unreachable: ${err?.message || 'Unknown error'}`);
    }

    // Check NoCodeBackend connectivity
    // In real implementation, would make a test request to the cache API
    try {
      // Placeholder for actual health check
      nocodebackReachable = true;
    } catch (err: any) {
      warnings.push(`NoCodeBackend unreachable: ${err?.message || 'Unknown error'}`);
      nocodebackReachable = false;
    }

    // Calculate last sync age
    const lastSyncAgeMs = this.lastFullSync
      ? Date.now() - this.lastFullSync.getTime()
      : -1;

    // Warn if sync is stale (older than 2x sync interval)
    if (
      lastSyncAgeMs > 0 &&
      lastSyncAgeMs > this.config.fullSyncIntervalMs * 2
    ) {
      warnings.push(
        `Last sync is ${Math.round(lastSyncAgeMs / 1000 / 60)} minutes old`,
      );
    }

    const healthy = teableReachable && nocodebackReachable;

    return {
      healthy,
      teable_reachable: teableReachable,
      nocodeback_reachable: nocodebackReachable,
      last_sync_age_ms: lastSyncAgeMs,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get current scheduler status
   */
  getStatus(): SchedulerStatus {
    return {
      running: this.running,
      last_full_sync: this.lastFullSync?.toISOString() ?? null,
      last_health_check: this.lastHealthCheck?.toISOString() ?? null,
      next_full_sync: this.running && this.lastFullSync
        ? new Date(this.lastFullSync.getTime() + this.config.fullSyncIntervalMs).toISOString()
        : null,
      sync_count: this.syncCount,
      error_count: this.errorCount,
    };
  }
}
