/**
 * Tests for SyncScheduler
 *
 * Tests cover:
 * - Scheduler start/stop lifecycle
 * - Interval setup and clearing
 * - Full sync execution
 * - Health check execution
 * - Status tracking
 */

import {
  SyncScheduler,
  SyncSchedulerConfig,
  CacheSyncService,
  TeableClient,
  Logger,
} from '../../src/sync/sync-scheduler';

describe('SyncScheduler', () => {
  let scheduler: SyncScheduler;
  let cacheSyncServiceMock: jest.Mocked<CacheSyncService>;
  let teableClientMock: jest.Mocked<TeableClient>;
  let loggerMock: jest.Mocked<Logger>;

  const config: SyncSchedulerConfig = {
    fullSyncIntervalMs: 900000, // 15 minutes
    healthCheckIntervalMs: 300000, // 5 minutes
    tables: ['jobs', 'deals', 'events'],
  };

  beforeEach(() => {
    cacheSyncServiceMock = {
      fullTableSync: jest.fn().mockResolvedValue({
        success: true,
        records_synced: 10,
        duration_ms: 1000,
      }),
    };

    teableClientMock = {
      getRecords: jest.fn().mockResolvedValue([
        { id: 'rec1', title: 'Record 1' },
        { id: 'rec2', title: 'Record 2' },
      ]),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    scheduler = new SyncScheduler(config, {
      cacheSyncService: cacheSyncServiceMock,
      teableClient: teableClientMock,
      logger: loggerMock,
    });
  });

  afterEach(() => {
    scheduler.stop();
  });

  describe('start/stop', () => {
    it('should not start if already running', async () => {
      scheduler.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const warnSpy = loggerMock.warn;
      warnSpy.mockClear();

      scheduler.start();

      expect(warnSpy).toHaveBeenCalledWith('Scheduler is already running');
      
      scheduler.stop();
    });

    it('should clear all intervals on stop', async () => {
      scheduler.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      scheduler.stop();

      expect(loggerMock.info).toHaveBeenCalledWith('Scheduler stopped');
      expect(scheduler.getStatus().running).toBe(false);
    });

    it('should not stop if not running', async () => {
      const warnSpy = loggerMock.warn;
      scheduler.stop();

      expect(warnSpy).toHaveBeenCalledWith('Scheduler is not running');
    });
  });

  describe('runFullSync', () => {
    it('should sync all configured tables', async () => {
      const result = await scheduler.runFullSync();

      expect(teableClientMock.getRecords).toHaveBeenCalledWith('jobs');
      expect(teableClientMock.getRecords).toHaveBeenCalledWith('deals');
      expect(teableClientMock.getRecords).toHaveBeenCalledWith('events');

      expect(cacheSyncServiceMock.fullTableSync).toHaveBeenCalledTimes(3);
    });

    it('should return correct total_records count', async () => {
      teableClientMock.getRecords
        .mockResolvedValueOnce([{ id: 'rec1' }, { id: 'rec2' }])
        .mockResolvedValueOnce([{ id: 'rec3' }])
        .mockResolvedValueOnce([{ id: 'rec4' }, { id: 'rec5' }, { id: 'rec6' }]);

      const result = await scheduler.runFullSync();

      expect(result.total_records).toBe(6);
    });

    it('should handle individual table failures', async () => {
      cacheSyncServiceMock.fullTableSync
        .mockResolvedValueOnce({ success: true, records_synced: 2, duration_ms: 100 })
        .mockRejectedValueOnce(new Error('Sync failed for deals'))
        .mockResolvedValueOnce({ success: true, records_synced: 1, duration_ms: 100 });

      const result = await scheduler.runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.tables_synced.length).toBe(2); // jobs and events succeeded
    });

    it('should record success status', async () => {
      const result = await scheduler.runFullSync();

      expect(result.success).toBe(true);
      expect(result.tables_synced).toContain('jobs');
      expect(result.tables_synced).toContain('deals');
      expect(result.tables_synced).toContain('events');
    });

    it('should increment sync count on success', async () => {
      let status = scheduler.getStatus();
      const initialCount = status.sync_count;

      await scheduler.runFullSync();

      status = scheduler.getStatus();
      expect(status.sync_count).toBe(initialCount + 1);
    });

    it('should increment error count on failure', async () => {
      cacheSyncServiceMock.fullTableSync.mockRejectedValue(new Error('Sync error'));

      let status = scheduler.getStatus();
      const initialErrorCount = status.error_count;

      await scheduler.runFullSync();

      status = scheduler.getStatus();
      expect(status.error_count).toBeGreaterThan(initialErrorCount);
    });
  });

  describe('runHealthCheck', () => {
    it('should report healthy when both services reachable', async () => {
      const result = await scheduler.runHealthCheck();

      expect(result.healthy).toBe(true);
      expect(result.teable_reachable).toBe(true);
    });

    it('should report unhealthy when Teable unreachable', async () => {
      teableClientMock.getRecords.mockRejectedValue(new Error('Teable unavailable'));

      const result = await scheduler.runHealthCheck();

      expect(result.healthy).toBe(false);
      expect(result.teable_reachable).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Teable');
    });

    it('should have both reachability flags', async () => {
      const result = await scheduler.runHealthCheck();

      expect('teable_reachable' in result).toBe(true);
      expect('nocodeback_reachable' in result).toBe(true);
    });

    it('should track last_sync_age_ms', async () => {
      await scheduler.runFullSync();

      // Advance time
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await scheduler.runHealthCheck();

      expect(result.last_sync_age_ms).toBeGreaterThanOrEqual(50);
    });
  });

  describe('getStatus', () => {
    it('should return running=false when not started', async () => {
      const status = scheduler.getStatus();
      expect(status.running).toBe(false);
    });

    it('should track sync and error counts', async () => {
      await scheduler.runFullSync();
      await scheduler.runFullSync();

      cacheSyncServiceMock.fullTableSync.mockRejectedValue(new Error('Error'));
      await scheduler.runFullSync();

      const status = scheduler.getStatus();

      expect(status.sync_count).toBe(3);
      expect(status.error_count).toBeGreaterThan(0);
    });

    it('should track last_full_sync timestamp', async () => {
      const beforeSync = new Date();
      await scheduler.runFullSync();
      const afterSync = new Date();

      const status = scheduler.getStatus();

      expect(status.last_full_sync).toBeDefined();
      if (status.last_full_sync) {
        const syncTime = new Date(status.last_full_sync);
        expect(syncTime.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
        expect(syncTime.getTime()).toBeLessThanOrEqual(afterSync.getTime() + 1000);
      }
    });

    it('should have null next_full_sync when not running', async () => {
      scheduler.stop();

      const status = scheduler.getStatus();

      expect(status.next_full_sync).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle Teable fetch errors', async () => {
      teableClientMock.getRecords.mockRejectedValue(new Error('Teable error'));

      const result = await scheduler.runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle cache sync errors', async () => {
      cacheSyncServiceMock.fullTableSync.mockRejectedValue(new Error('Cache error'));

      const result = await scheduler.runFullSync();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should continue syncing other tables if one fails', async () => {
      cacheSyncServiceMock.fullTableSync
        .mockResolvedValueOnce({ success: true, records_synced: 1, duration_ms: 100 })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true, records_synced: 1, duration_ms: 100 });

      const result = await scheduler.runFullSync();

      // Should have synced jobs and events despite deals failure
      expect(result.tables_synced).toContain('jobs');
      expect(result.tables_synced).toContain('events');
      expect(result.tables_synced).not.toContain('deals');
    });
  });

  describe('integration scenarios', () => {
    it('should run initial sync on direct call', async () => {
      teableClientMock.getRecords.mockClear();

      await scheduler.runFullSync();

      expect(teableClientMock.getRecords).toHaveBeenCalled();
    });

    it('should continue syncing after sync failure', async () => {
      let callCount = 0;
      cacheSyncServiceMock.fullTableSync.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw new Error('First attempt fails');
        return { success: true, records_synced: 1, duration_ms: 100 };
      });

      const result1 = await scheduler.runFullSync();
      expect(result1.success).toBe(false);

      const result2 = await scheduler.runFullSync();
      expect(result2.success).toBe(true);
    });

    it('should maintain state across multiple syncs', async () => {
      await scheduler.runFullSync();
      const status1 = scheduler.getStatus();

      await new Promise(resolve => setTimeout(resolve, 10));

      await scheduler.runFullSync();
      const status2 = scheduler.getStatus();

      expect(status2.sync_count).toBeGreaterThan(status1.sync_count);
    });
  });
});
