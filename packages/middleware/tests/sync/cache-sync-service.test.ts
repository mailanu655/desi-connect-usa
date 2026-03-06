/**
 * Tests for CacheSyncService
 *
 * Tests cover:
 * - Record syncing with HTTP client
 * - Retry logic with exponential backoff
 * - Cache deletion
 * - Full table synchronization
 * - Endpoint URL construction
 */

import {
  CacheSyncService,
  CacheSyncConfig,
  HttpClient,
  Logger,
} from '../../src/sync/cache-sync-service';

describe('CacheSyncService', () => {
  let service: CacheSyncService;
  let httpClientMock: jest.Mocked<HttpClient>;
  let loggerMock: jest.Mocked<Logger>;

  const config: CacheSyncConfig = {
    noCodeBackendUrl: 'https://api.example.com',
    noCodeBackendApiKey: 'test-api-key',
    retryAttempts: 3,
    retryDelayMs: 100,
  };

  beforeEach(() => {
    httpClientMock = {
      post: jest.fn().mockResolvedValue({ success: true }),
      put: jest.fn().mockResolvedValue({ success: true }),
      delete: jest.fn().mockResolvedValue({ success: true }),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new CacheSyncService(config, {
      httpClient: httpClientMock,
      logger: loggerMock,
    });
  });

  describe('syncRecord', () => {
    it('should call httpClient PUT for existing records', async () => {
      httpClientMock.put.mockResolvedValueOnce({ success: true });

      const result = await service.syncRecord('jobs', 'rec123', {
        title: 'Test Job',
        city: 'San Francisco',
      });

      expect(result.success).toBe(true);
      expect(httpClientMock.put).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/tables/jobs/rec123',
        { title: 'Test Job', city: 'San Francisco' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        }),
      );
    });

    it('should retry on failure with backoff', async () => {
      const error = new Error('Network error');
      httpClientMock.put
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ success: true });

      const startTime = Date.now();
      const result = await service.syncRecord('jobs', 'rec123', { title: 'Test' });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(httpClientMock.put).toHaveBeenCalledTimes(3);
      expect(duration).toBeGreaterThanOrEqual(250);
    });

    it('should return success after retry', async () => {
      httpClientMock.put
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true });

      const result = await service.syncRecord('jobs', 'rec123', { title: 'Test' });

      expect(result.success).toBe(true);
      expect(result.records_synced).toBe(1);
    });

    it('should give up after max retries', async () => {
      const error = new Error('Persistent failure');
      httpClientMock.put.mockRejectedValue(error);

      const result = await service.syncRecord('jobs', 'rec123', { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('Persistent failure');
      expect(httpClientMock.put).toHaveBeenCalledTimes(3);
    });

    it('should try POST after PUT 404', async () => {
      const notFoundError = new Error('Not found');
      (notFoundError as any).status = 404;

      httpClientMock.put.mockRejectedValueOnce(notFoundError);
      httpClientMock.post.mockResolvedValueOnce({ success: true });

      const result = await service.syncRecord('jobs', 'rec123', { title: 'New Job' });

      expect(result.success).toBe(true);
      expect(httpClientMock.put).toHaveBeenCalled();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/tables/jobs/rec123',
        { title: 'New Job' },
        expect.any(Object),
      );
    });

    it('should include API key in authorization header', async () => {
      await service.syncRecord('jobs', 'rec123', { title: 'Test' });

      const call = httpClientMock.put.mock.calls[0];
      expect(call[2]?.headers?.['Authorization']).toBe('Bearer test-api-key');
    });

    it('should track duration in result', async () => {
      httpClientMock.put.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50)),
      );

      const result = await service.syncRecord('jobs', 'rec123', { title: 'Test' });

      expect(result.duration_ms).toBeGreaterThanOrEqual(50);
    });

    it('should work with all supported tables', async () => {
      const tables = ['businesses', 'jobs', 'news', 'deals', 'events', 'consultancies', 'users'];

      for (const table of tables) {
        httpClientMock.put.mockResolvedValueOnce({ success: true });
        const result = await service.syncRecord(table as any, 'rec123', { data: 'test' });

        expect(result.success).toBe(true);
        expect(result.table).toBe(table);
      }
    });
  });

  describe('deleteFromCache', () => {
    it('should call httpClient DELETE', async () => {
      const result = await service.deleteFromCache('jobs', 'rec123');

      expect(result.success).toBe(true);
      expect(httpClientMock.delete).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/tables/jobs/rec123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        }),
      );
    });

    it('should retry deletion on failure', async () => {
      httpClientMock.delete
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true });

      const result = await service.deleteFromCache('jobs', 'rec123');

      expect(result.success).toBe(true);
      expect(httpClientMock.delete).toHaveBeenCalledTimes(2);
    });

    it('should include API key in deletion request', async () => {
      await service.deleteFromCache('jobs', 'rec123');

      const call = httpClientMock.delete.mock.calls[0];
      expect(call[1]?.headers?.['Authorization']).toBe('Bearer test-api-key');
    });

    it('should handle persistent failures', async () => {
      httpClientMock.delete.mockRejectedValue(new Error('Persistent error'));

      const result = await service.deleteFromCache('jobs', 'rec123');

      expect(result.success).toBe(false);
      expect(httpClientMock.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('fullTableSync', () => {
    it('should sync all records via multiple calls', async () => {
      httpClientMock.put.mockResolvedValue({ success: true });

      const records = [
        { id: 'rec1', title: 'Job 1' },
        { id: 'rec2', title: 'Job 2' },
        { id: 'rec3', title: 'Job 3' },
      ];

      const result = await service.fullTableSync('jobs', records);

      expect(result.success).toBe(true);
      expect(result.records_synced).toBe(3);
      expect(httpClientMock.put).toHaveBeenCalledTimes(3);
    });

    it('should return correct record count', async () => {
      httpClientMock.put.mockResolvedValue({ success: true });

      const records = Array.from({ length: 10 }, (_, i) => ({
        id: `rec${i}`,
        title: `Item ${i}`,
      }));

      const result = await service.fullTableSync('jobs', records);

      expect(result.records_synced).toBe(10);
    });

    it('should handle partial failures', async () => {
      httpClientMock.put
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Sync error'))
        .mockResolvedValueOnce({ success: true });

      const records = [
        { id: 'rec1', title: 'Job 1' },
        { id: 'rec2', title: 'Job 2' },
        { id: 'rec3', title: 'Job 3' },
      ];

      const result = await service.fullTableSync('jobs', records);

      expect(result.records_synced).toBeGreaterThanOrEqual(2);
    });

    it('should skip records without ID', async () => {
      httpClientMock.put.mockResolvedValue({ success: true });

      const records = [
        { id: 'rec1', title: 'Job 1' },
        { title: 'Job 2' },
        { id: 'rec3', title: 'Job 3' },
      ];

      const result = await service.fullTableSync('jobs', records);

      expect(result.records_synced).toBe(2);
      expect(httpClientMock.put).toHaveBeenCalledTimes(2);
    });

    it('should track duration for full sync', async () => {
      httpClientMock.put.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 10)),
      );

      const records = [
        { id: 'rec1', title: 'Job 1' },
        { id: 'rec2', title: 'Job 2' },
      ];

      const result = await service.fullTableSync('jobs', records);

      expect(result.duration_ms).toBeGreaterThanOrEqual(20);
    });

    it('should handle empty record array', async () => {
      const result = await service.fullTableSync('jobs', []);

      expect(result.success).toBe(true);
      expect(result.records_synced).toBe(0);
    });
  });

  describe('buildEndpointUrl', () => {
    it('should construct correct URLs for each table', async () => {
      const tables = ['businesses', 'jobs', 'news', 'deals', 'events', 'consultancies', 'users'];

      for (const table of tables) {
        httpClientMock.put.mockResolvedValueOnce({ success: true });
        await service.syncRecord(table as any, 'rec123', {});

        const call = httpClientMock.put.mock.calls.pop();
        const url = call?.[0];
        expect(url).toContain(`/api/v1/tables/${table}/rec123`);
      }
    });

    it('should handle URL without trailing slash', async () => {
      const configNoSlash = { ...config, noCodeBackendUrl: 'https://api.example.com/' };
      const serviceNoSlash = new CacheSyncService(configNoSlash, {
        httpClient: httpClientMock,
        logger: loggerMock,
      });

      httpClientMock.put.mockResolvedValueOnce({ success: true });
      await serviceNoSlash.syncRecord('jobs', 'rec123', {});

      const call = httpClientMock.put.mock.calls[0];
      const url = call[0];
      expect(url).toBe('https://api.example.com/api/v1/tables/jobs/rec123');
    });
  });

  describe('retryWithBackoff', () => {
    it('should respect retry count', async () => {
      let callCount = 0;
      httpClientMock.put.mockImplementation(() => {
        callCount++;
        throw new Error('Always fails');
      });

      const result = await service.syncRecord('jobs', 'rec123', {});

      expect(result.success).toBe(false);
      expect(httpClientMock.put).toHaveBeenCalledTimes(3);
    });

    it('should succeed on final attempt', async () => {
      let attempts = 0;
      httpClientMock.put.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Retry me');
        return { success: true };
      });

      const result = await service.syncRecord('jobs', 'rec123', {});

      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should log all errors appropriately', async () => {
      const error = new Error('Test error');
      httpClientMock.put.mockRejectedValue(error);

      await service.syncRecord('jobs', 'rec123', {});

      expect(loggerMock.error).toHaveBeenCalled();
    });

    it('should include error messages in result', async () => {
      const errorMsg = 'Custom error message';
      httpClientMock.put.mockRejectedValue(new Error(errorMsg));

      const result = await service.syncRecord('jobs', 'rec123', {});

      expect(result.errors).toContain(errorMsg);
    });
  });
});
