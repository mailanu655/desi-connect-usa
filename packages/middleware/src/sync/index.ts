/**
 * @desi-connect/middleware - Sync Pipeline
 *
 * Data synchronization between Teable (source of truth),
 * NoCodeBackend (read cache), and WhatsApp notifications.
 */

// ── Webhook Handling ───────────────────────────────────
export { WebhookHandler } from './webhook-handler';
export type {
  WebhookHandlerDeps,
  TeableWebhookPayload,
  WebhookEventType,
  TableName,
  WebhookResult,
} from './webhook-handler';

// ── Cache Synchronization ─────────────────────────────
export { CacheSyncService } from './cache-sync-service';
export type {
  CacheSyncConfig,
  CacheSyncDeps,
  SyncResult,
  HttpClient,
} from './cache-sync-service';

// ── Notification Dispatching ──────────────────────────
export { NotificationDispatcher } from './notification-dispatcher';
export type {
  NotificationDispatcherDeps,
  NotificationRule,
  NotificationResult,
  UserRepository as NotificationUserRepository,
  WhatsAppClient,
} from './notification-dispatcher';

// ── Sync Scheduling ────────────────────────────────────
export { SyncScheduler } from './sync-scheduler';
export type {
  SyncSchedulerConfig,
  SyncSchedulerDeps,
  FullSyncResult,
  HealthCheckResult,
  SchedulerStatus,
} from './sync-scheduler';
