/**
 * @desi-connect/middleware
 *
 * WhatsApp Bot middleware package — intent classification,
 * session management, multi-step flows, and response building.
 */

// ── Bot core ──────────────────────────────────────────────
export { MessageRouter } from './bot/message-router';
export type { MessageRouterDeps } from './bot/message-router';

// ── Intent engine ─────────────────────────────────────────
export { IntentEngine } from './intents/intent-engine';
export type { AiClassifier, IntentEngineConfig } from './intents/intent-engine';

// ── AI Intent Classifier ─────────────────────────────────
export { ClaudeIntentClassifier, createAiClassifierFromEnv } from './intents/ai-classifier';
export type { AiClassifierConfig, AiProvider } from './intents/ai-classifier';

// ── Session management ────────────────────────────────────
export { SessionManager } from './session/session-manager';
export type { SessionManagerConfig } from './session/session-manager';

export { RedisSessionManager } from './session/redis-session-manager';
export type { RedisSessionManagerConfig, RedisClient } from './session/redis-session-manager';

// ── Flow handling ─────────────────────────────────────────
export { FlowHandler } from './handlers/flow-handler';
export type { FlowHandlerConfig } from './handlers/flow-handler';

// ── Services ──────────────────────────────────────────────
export { ResponseBuilder } from './services/response-builder';
export type { ResponseBuilderConfig } from './services/response-builder';

export { TemplateManager } from './services/template-manager';
export type { TemplateManagerConfig } from './services/template-manager';

// ── Content aggregation ──────────────────────────────────
export { TavilyClient, TavilyApiError } from './content/tavily-client';
export type { TavilyClientConfig, TavilySearchOptions } from './content/tavily-client';

export { ContentParser } from './content/content-parser';
export type { ParsedContent, ContentParserConfig } from './content/content-parser';

export { ContentDeduplicator } from './content/deduplicator';
export type { DeduplicatorConfig, DeduplicationResult } from './content/deduplicator';

export { ContentAggregator } from './content/content-aggregator';
export type { ContentAggregatorConfig, AggregationRun } from './content/content-aggregator';

// ── Channels (WhatsApp / Twilio) ─────────────────────────
export { TwilioWhatsAppClient, createTwilioClientFromEnv } from './channels/twilio-whatsapp-client';
export type {
  TwilioWhatsAppConfig,
  TwilioSendResult,
  MediaAttachment,
} from './channels/twilio-whatsapp-client';

// ── Auth linking ─────────────────────────────────────────
export { WhatsAppAuthLinker, InMemoryLinkStore } from './auth/whatsapp-auth-linker';
export type {
  AuthLinkerConfig,
  PendingLink,
  LinkResult,
  LinkStore,
  UserLookup,
} from './auth/whatsapp-auth-linker';

// ── Sync pipeline ─────────────────────────────────────────
export { WebhookHandler } from './sync/webhook-handler';
export type {
  WebhookHandlerDeps,
  TeableWebhookPayload,
  WebhookEventType,
  TableName,
  WebhookResult,
} from './sync/webhook-handler';

export { CacheSyncService } from './sync/cache-sync-service';
export type {
  CacheSyncConfig,
  CacheSyncDeps,
  SyncResult,
  HttpClient,
} from './sync/cache-sync-service';

export { NotificationDispatcher } from './sync/notification-dispatcher';
export type {
  NotificationDispatcherDeps,
  NotificationRule,
  NotificationResult,
  UserRepository as NotificationUserRepository,
  WhatsAppClient,
} from './sync/notification-dispatcher';

export { SyncScheduler } from './sync/sync-scheduler';
export type {
  SyncSchedulerConfig,
  SyncSchedulerDeps,
  FullSyncResult,
  HealthCheckResult,
  SchedulerStatus,
} from './sync/sync-scheduler';
