/**
 * Tests for WebhookHandler
 *
 * Tests cover:
 * - Payload validation with comprehensive checks
 * - Event routing for created, updated, deleted records
 * - Cache sync triggering
 * - Notification dispatcher triggering
 * - Error handling and recovery
 */

import {
  WebhookHandler,
  TeableWebhookPayload,
  CacheSyncService,
  NotificationDispatcher,
  Logger,
} from '../../src/sync/webhook-handler';

describe('WebhookHandler', () => {
  let handler: WebhookHandler;
  let cacheSyncMock: jest.Mocked<CacheSyncService>;
  let notificationDispatcherMock: jest.Mocked<NotificationDispatcher>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    cacheSyncMock = {
      syncRecord: jest.fn().mockResolvedValue({ success: true }),
      deleteFromCache: jest.fn().mockResolvedValue({ success: true }),
    };

    notificationDispatcherMock = {
      dispatch: jest.fn().mockResolvedValue({
        success: true,
        notifications_sent: 1,
        notifications_failed: 0,
      }),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    handler = new WebhookHandler({
      cacheSync: cacheSyncMock,
      notificationDispatcher: notificationDispatcherMock,
      logger: loggerMock,
    });
  });

  describe('validatePayload', () => {
    it('should accept valid Teable webhook payload', () => {
      const validPayload = {
        event: 'record.created',
        table: 'jobs',
        record_id: 'rec123',
        data: { title: 'Test Job', city: 'San Francisco' },
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      const result = handler.validatePayload(validPayload);
      expect(result).toBe(true);
    });

    it('should reject missing event field', () => {
      const payload = {
        table: 'jobs',
        record_id: 'rec123',
        data: {},
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(false);
    });

    it('should reject invalid event type', () => {
      const payload = {
        event: 'record.invalid',
        table: 'jobs',
        record_id: 'rec123',
        data: {},
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(false);
    });

    it('should reject missing table field', () => {
      const payload = {
        event: 'record.created',
        record_id: 'rec123',
        data: {},
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(false);
    });

    it('should reject invalid table name', () => {
      const payload = {
        event: 'record.created',
        table: 'invalid_table',
        record_id: 'rec123',
        data: {},
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(false);
    });

    it('should reject missing record_id', () => {
      const payload = {
        event: 'record.created',
        table: 'jobs',
        data: {},
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(false);
    });

    it('should accept all valid table names', () => {
      const validTables = ['businesses', 'jobs', 'news', 'deals', 'events', 'consultancies', 'users'];

      for (const table of validTables) {
        const payload = {
          event: 'record.created',
          table,
          record_id: 'rec123',
          data: {},
          timestamp: new Date().toISOString(),
          webhook_id: 'wh123',
        };

        expect(handler.validatePayload(payload)).toBe(true);
      }
    });

    it('should accept all valid event types', () => {
      const validEvents = ['record.created', 'record.updated', 'record.deleted'];

      for (const event of validEvents) {
        const payload = {
          event,
          table: 'jobs',
          record_id: 'rec123',
          data: {},
          timestamp: new Date().toISOString(),
          webhook_id: 'wh123',
        };

        expect(handler.validatePayload(payload)).toBe(true);
      }
    });

    it('should accept payload with previous_data for update events', () => {
      const payload = {
        event: 'record.updated',
        table: 'jobs',
        record_id: 'rec123',
        data: { title: 'Updated Title' },
        previous_data: { title: 'Old Title' },
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(true);
    });

    it('should reject invalid previous_data type', () => {
      const payload = {
        event: 'record.updated',
        table: 'jobs',
        record_id: 'rec123',
        data: { title: 'Updated Title' },
        previous_data: 'not an object',
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      expect(handler.validatePayload(payload)).toBe(false);
    });

    it('should reject non-object payload', () => {
      expect(handler.validatePayload('not an object')).toBe(false);
      expect(handler.validatePayload(null)).toBe(false);
      expect(handler.validatePayload(undefined)).toBe(false);
      expect(handler.validatePayload(123)).toBe(false);
    });
  });

  describe('handleWebhook', () => {
    const basePayload: TeableWebhookPayload = {
      event: 'record.created',
      table: 'jobs',
      record_id: 'rec123',
      data: { title: 'Test Job', city: 'San Francisco' },
      timestamp: new Date().toISOString(),
      webhook_id: 'wh123',
    };

    it('should process record.created events correctly', async () => {
      const result = await handler.handleWebhook(basePayload);

      expect(result.success).toBe(true);
      expect(result.event).toBe('record.created');
      expect(result.table).toBe('jobs');
      expect(result.record_id).toBe('rec123');
      expect(result.actions_taken).toContain('record_created_handled_for_jobs');
    });

    it('should process record.updated events correctly', async () => {
      const payload: TeableWebhookPayload = {
        ...basePayload,
        event: 'record.updated',
        previous_data: { title: 'Old Title' },
      };

      const result = await handler.handleWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.event).toBe('record.updated');
      expect(result.actions_taken).toContain('record_updated_handled_for_jobs');
    });

    it('should process record.deleted events correctly', async () => {
      const payload: TeableWebhookPayload = {
        ...basePayload,
        event: 'record.deleted',
      };

      const result = await handler.handleWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.event).toBe('record.deleted');
      expect(result.actions_taken).toContain('record_deleted_handled_for_jobs');
    });

    it('should trigger cache sync for created events', async () => {
      await handler.handleWebhook(basePayload);

      expect(cacheSyncMock.syncRecord).toHaveBeenCalledWith(
        'jobs',
        'rec123',
        basePayload.data,
      );
    });

    it('should trigger cache sync for updated events', async () => {
      const payload: TeableWebhookPayload = {
        ...basePayload,
        event: 'record.updated',
      };

      await handler.handleWebhook(payload);

      expect(cacheSyncMock.syncRecord).toHaveBeenCalledWith(
        'jobs',
        'rec123',
        payload.data,
      );
    });

    it('should trigger cache deletion for deleted events', async () => {
      const payload: TeableWebhookPayload = {
        ...basePayload,
        event: 'record.deleted',
      };

      await handler.handleWebhook(payload);

      expect(cacheSyncMock.deleteFromCache).toHaveBeenCalledWith('jobs', 'rec123');
    });

    it('should trigger notification dispatcher for created events', async () => {
      await handler.handleWebhook(basePayload);

      expect(notificationDispatcherMock.dispatch).toHaveBeenCalledWith(
        'record.created',
        'jobs',
        basePayload.data,
      );
    });

    it('should trigger notification dispatcher for updated events', async () => {
      const payload: TeableWebhookPayload = {
        ...basePayload,
        event: 'record.updated',
      };

      await handler.handleWebhook(payload);

      expect(notificationDispatcherMock.dispatch).toHaveBeenCalledWith(
        'record.updated',
        'jobs',
        payload.data,
      );
    });

    it('should trigger notification dispatcher for deleted events', async () => {
      const payload: TeableWebhookPayload = {
        ...basePayload,
        event: 'record.deleted',
      };

      await handler.handleWebhook(payload);

      expect(notificationDispatcherMock.dispatch).toHaveBeenCalledWith(
        'record.deleted',
        'jobs',
        {},
      );
    });

    it('should return success result with actions_taken', async () => {
      const result = await handler.handleWebhook(basePayload);

      expect(result.success).toBe(true);
      expect(result.actions_taken).toBeDefined();
      expect(Array.isArray(result.actions_taken)).toBe(true);
      expect(result.actions_taken.length).toBeGreaterThan(0);
    });

    it('should handle cache sync errors gracefully', async () => {
      const syncError = new Error('Sync failed');
      cacheSyncMock.syncRecord.mockRejectedValueOnce(syncError);

      const result = await handler.handleWebhook(basePayload);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('Sync failed');
    });

    it('should handle notification errors gracefully', async () => {
      const notificationError = new Error('Notification failed');
      notificationDispatcherMock.dispatch.mockRejectedValueOnce(notificationError);

      const result = await handler.handleWebhook(basePayload);

      // Should still succeed because notification failure doesn't block webhook processing
      expect(result.success).toBe(true);
      expect(loggerMock.warn).toHaveBeenCalled();
    });

    it('should reject invalid payloads', async () => {
      const invalidPayload = {
        event: 'invalid',
        table: 'jobs',
      };

      const result = await handler.handleWebhook(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid webhook payload structure');
      expect(cacheSyncMock.syncRecord).not.toHaveBeenCalled();
    });

    it('should work with all supported tables', async () => {
      const tables = ['businesses', 'jobs', 'news', 'deals', 'events', 'consultancies', 'users'];

      for (const table of tables) {
        const payload: TeableWebhookPayload = {
          ...basePayload,
          table: table as any,
        };

        const result = await handler.handleWebhook(payload);

        expect(result.success).toBe(true);
        expect(result.table).toBe(table);
      }
    });

    it('should track multiple actions in successful webhook', async () => {
      const result = await handler.handleWebhook(basePayload);

      expect(result.actions_taken.length).toBeGreaterThanOrEqual(1);
    });

    it('should include webhook metadata in logs', async () => {
      await handler.handleWebhook(basePayload);

      expect(loggerMock.info).toHaveBeenCalled();
      const infoCall = loggerMock.info.mock.calls.find(
        (call: any) => call[0].includes('Processing webhook'),
      );
      expect(infoCall).toBeDefined();
    });
  });

  describe('Error scenarios', () => {
    it('should handle missing data field gracefully', async () => {
      const invalidPayload = {
        event: 'record.created',
        table: 'jobs',
        record_id: 'rec123',
        timestamp: new Date().toISOString(),
        webhook_id: 'wh123',
      };

      const result = await handler.handleWebhook(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should handle concurrent webhook calls', async () => {
      const payload1: TeableWebhookPayload = {
        event: 'record.created',
        table: 'jobs',
        record_id: 'rec1',
        data: { title: 'Job 1' },
        timestamp: new Date().toISOString(),
        webhook_id: 'wh1',
      };

      const payload2: TeableWebhookPayload = {
        event: 'record.created',
        table: 'deals',
        record_id: 'rec2',
        data: { title: 'Deal 1' },
        timestamp: new Date().toISOString(),
        webhook_id: 'wh2',
      };

      const results = await Promise.all([
        handler.handleWebhook(payload1),
        handler.handleWebhook(payload2),
      ]);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].table).toBe('jobs');
      expect(results[1].table).toBe('deals');
    });
  });
});
