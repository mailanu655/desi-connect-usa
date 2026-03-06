/**
 * Webhook Handler (Section 8 - Sync Pipeline)
 *
 * Processes incoming Teable webhooks and orchestrates:
 * - Cache synchronization (Teable → NoCodeBackend)
 * - User notifications (WhatsApp for subscribed users)
 * - Validation and error handling
 */

import type { TeableWebhookPayload as SharedTeableWebhookPayload } from '@desi-connect/shared';

/**
 * Extended webhook event types specific to sync pipeline
 */
export type WebhookEventType = 'record.created' | 'record.updated' | 'record.deleted';

/**
 * Supported table names for sync pipeline
 */
export type TableName = 'businesses' | 'jobs' | 'news' | 'deals' | 'events' | 'consultancies' | 'users';

/**
 * Teable webhook payload structure
 */
export interface TeableWebhookPayload {
  event: WebhookEventType;
  table: TableName;
  record_id: string;
  data: Record<string, unknown>;
  previous_data?: Record<string, unknown>;
  timestamp: string;
  webhook_id: string;
}

/**
 * Result of webhook processing
 */
export interface WebhookResult {
  success: boolean;
  event: WebhookEventType;
  table: TableName;
  record_id: string;
  actions_taken: string[];
  errors?: string[];
}

/**
 * Logger interface for webhook handler
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
  syncRecord(table: TableName, recordId: string, data: Record<string, unknown>): Promise<any>;
  deleteFromCache(table: TableName, recordId: string): Promise<any>;
}

/**
 * Notification dispatcher interface
 */
export interface NotificationDispatcher {
  dispatch(event: WebhookEventType, table: TableName, data: Record<string, unknown>): Promise<any>;
}

/**
 * Dependencies for WebhookHandler
 */
export interface WebhookHandlerDeps {
  cacheSync: CacheSyncService;
  notificationDispatcher: NotificationDispatcher;
  logger?: Logger;
}

/**
 * Processes Teable webhooks and orchestrates sync + notifications
 */
export class WebhookHandler {
  private readonly cacheSync: CacheSyncService;
  private readonly notificationDispatcher: NotificationDispatcher;
  private readonly logger: Logger;

  constructor(deps: WebhookHandlerDeps) {
    this.cacheSync = deps.cacheSync;
    this.notificationDispatcher = deps.notificationDispatcher;
    this.logger = deps.logger || {
      info: (msg: string) => console.log('[WebhookHandler]', msg),
      warn: (msg: string) => console.warn('[WebhookHandler]', msg),
      error: (msg: string) => console.error('[WebhookHandler]', msg),
      debug: (msg: string) => console.debug('[WebhookHandler]', msg),
    };
  }

  /**
   * Main entry point for processing webhooks
   * - Validates payload structure
   * - Routes to appropriate handler by event type
   * - Triggers cache sync (Teable → NoCodeBackend)
   * - Triggers notifications for relevant events
   * - Returns result with processing status
   *
   * @param payload - Incoming Teable webhook payload
   * @returns WebhookResult with processing status and actions taken
   */
  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    // Validate payload structure
    if (!this.validatePayload(payload)) {
      this.logger.error('Invalid webhook payload structure', payload);
      return {
        success: false,
        event: 'record.created',
        table: 'businesses',
        record_id: '',
        actions_taken: [],
        errors: ['Invalid webhook payload structure'],
      };
    }

    const { event, table, record_id, data, previous_data, timestamp, webhook_id } = payload;

    this.logger.info(`Processing webhook: ${event} on ${table}/${record_id}`, {
      webhook_id,
      timestamp,
    });

    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Route to appropriate handler based on event type
      switch (event) {
        case 'record.created':
          await this.handleRecordCreated(table, record_id, data);
          actions.push(`record_created_handled_for_${table}`);
          break;

        case 'record.updated':
          await this.handleRecordUpdated(table, record_id, data, previous_data);
          actions.push(`record_updated_handled_for_${table}`);
          break;

        case 'record.deleted':
          await this.handleRecordDeleted(table, record_id);
          actions.push(`record_deleted_handled_for_${table}`);
          break;

        default:
          errors.push(`Unknown event type: ${event}`);
          this.logger.warn(`Unknown event type: ${event}`);
      }

      this.logger.info(`Webhook processing completed: ${event} on ${table}/${record_id}`, {
        actions,
        errors: errors.length > 0 ? errors : undefined,
      });

      return {
        success: errors.length === 0,
        event,
        table,
        record_id,
        actions_taken: actions,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      this.logger.error(`Error processing webhook: ${errorMsg}`, err);

      return {
        success: false,
        event,
        table,
        record_id,
        actions_taken: actions,
        errors: [...errors, errorMsg],
      };
    }
  }

  /**
   * Handle record creation event
   * - Sync to cache (Teable → NoCodeBackend)
   * - Dispatch notifications based on table and data
   */
  private async handleRecordCreated(
    table: TableName,
    recordId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    this.logger.debug(`Handling record.created for ${table}/${recordId}`);

    // Sync to cache
    try {
      await this.cacheSync.syncRecord(table, recordId, data);
      this.logger.info(`Synced new ${table} record to cache: ${recordId}`);
    } catch (err: any) {
      this.logger.error(`Failed to sync new ${table} record to cache: ${err?.message}`);
      throw err;
    }

    // Dispatch notifications
    try {
      await this.notificationDispatcher.dispatch('record.created', table, data);
      this.logger.info(`Dispatched notifications for new ${table} record`);
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch notifications for new ${table}: ${err?.message}`);
      // Don't throw - notification failure should not block webhook processing
    }
  }

  /**
   * Handle record update event
   * - Sync to cache (Teable → NoCodeBackend)
   * - Dispatch notifications for relevant field changes
   */
  private async handleRecordUpdated(
    table: TableName,
    recordId: string,
    data: Record<string, unknown>,
    previousData?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.debug(`Handling record.updated for ${table}/${recordId}`);

    // Sync to cache
    try {
      await this.cacheSync.syncRecord(table, recordId, data);
      this.logger.info(`Synced updated ${table} record to cache: ${recordId}`);
    } catch (err: any) {
      this.logger.error(`Failed to sync updated ${table} record to cache: ${err?.message}`);
      throw err;
    }

    // Dispatch notifications
    try {
      await this.notificationDispatcher.dispatch('record.updated', table, data);
      this.logger.info(`Dispatched notifications for updated ${table} record`);
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch notifications for updated ${table}: ${err?.message}`);
      // Don't throw - notification failure should not block webhook processing
    }
  }

  /**
   * Handle record deletion event
   * - Remove from cache (Teable → NoCodeBackend)
   * - Dispatch deletion notifications if necessary
   */
  private async handleRecordDeleted(table: TableName, recordId: string): Promise<void> {
    this.logger.debug(`Handling record.deleted for ${table}/${recordId}`);

    // Delete from cache
    try {
      await this.cacheSync.deleteFromCache(table, recordId);
      this.logger.info(`Deleted ${table} record from cache: ${recordId}`);
    } catch (err: any) {
      this.logger.error(`Failed to delete ${table} record from cache: ${err?.message}`);
      throw err;
    }

    // Dispatch deletion notifications
    try {
      await this.notificationDispatcher.dispatch('record.deleted', table, {});
      this.logger.info(`Dispatched notifications for deleted ${table} record`);
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch notifications for deleted ${table}: ${err?.message}`);
      // Don't throw - notification failure should not block webhook processing
    }
  }

  /**
   * Validate webhook payload structure
   * Type guard to ensure payload has required fields
   */
  validatePayload(payload: unknown): payload is TeableWebhookPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const p = payload as Record<string, unknown>;

    // Check required fields
    if (
      typeof p.event !== 'string' ||
      typeof p.table !== 'string' ||
      typeof p.record_id !== 'string' ||
      typeof p.data !== 'object' ||
      typeof p.timestamp !== 'string' ||
      typeof p.webhook_id !== 'string'
    ) {
      return false;
    }

    // Validate event type
    const validEvents: WebhookEventType[] = ['record.created', 'record.updated', 'record.deleted'];
    if (!validEvents.includes(p.event as WebhookEventType)) {
      return false;
    }

    // Validate table name
    const validTables: TableName[] = [
      'businesses',
      'jobs',
      'news',
      'deals',
      'events',
      'consultancies',
      'users',
    ];
    if (!validTables.includes(p.table as TableName)) {
      return false;
    }

    // Validate previous_data if present
    if (p.previous_data !== undefined && typeof p.previous_data !== 'object') {
      return false;
    }

    return true;
  }
}
