/** @jest-environment node */
import { NextRequest } from 'next/server';

// Mock shared package
const mockValidateModerationQueueFilters = jest.fn();
const mockValidateModerationAction = jest.fn();
const mockIsValidContentType = jest.fn();

jest.mock('@desi-connect/shared', () => ({
  validateModerationQueueFilters: (...args: unknown[]) => mockValidateModerationQueueFilters(...args),
  validateModerationAction: (...args: unknown[]) => mockValidateModerationAction(...args),
  isValidContentType: (...args: unknown[]) => mockIsValidContentType(...args),
}));

import { GET as getQueue } from '@/app/api/admin/moderation/queue/route';
import { POST as postAction } from '@/app/api/admin/moderation/action/route';
import { GET as getStats } from '@/app/api/admin/moderation/stats/route';
import { GET as getHistory } from '@/app/api/admin/moderation/history/route';

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

describe('Admin Moderation API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateModerationQueueFilters.mockReturnValue({ valid: true, errors: [] });
    mockValidateModerationAction.mockReturnValue({ valid: true, errors: [] });
    mockIsValidContentType.mockReturnValue(true);
  });

  // ── Moderation Queue GET ──────────────────────────────────────
  describe('GET /api/admin/moderation/queue', () => {
    it('returns 200 with paginated data on valid request', async () => {
      const req = createRequest('/api/admin/moderation/queue?page=1&limit=20');
      const res = await getQueue(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.items).toEqual([]);
      expect(json.data.total).toBe(0);
    });

    it('passes filters to validator', async () => {
      const req = createRequest(
        '/api/admin/moderation/queue?content_type=business&status=pending&priority=high&page=2&limit=10',
      );
      await getQueue(req);

      expect(mockValidateModerationQueueFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          content_type: 'business',
          status: 'pending',
          priority: 'high',
        }),
      );
    });

    it('returns 400 when validation fails', async () => {
      mockValidateModerationQueueFilters.mockReturnValue({
        valid: false,
        errors: ['Invalid content_type'],
      });

      const req = createRequest('/api/admin/moderation/queue?content_type=invalid');
      const res = await getQueue(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
      expect(json.details).toContain('Invalid content_type');
    });

    it('handles date range filters', async () => {
      const req = createRequest(
        '/api/admin/moderation/queue?date_start=2025-01-01&date_end=2025-12-31',
      );
      const res = await getQueue(req);
      expect(res.status).toBe(200);
    });
  });

  // ── Moderation Action POST ────────────────────────────────────
  describe('POST /api/admin/moderation/action', () => {
    it('returns 200 with success on valid action', async () => {
      const req = createRequest('/api/admin/moderation/action', {
        method: 'POST',
        body: JSON.stringify({
          content_id: 'content-123',
          content_type: 'business',
          action: 'approve',
        }),
      });
      const res = await postAction(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
      expect(json.data.message).toBeDefined();
      expect(json.data.action_id).toBeDefined();
    });

    it('validates the request body', async () => {
      const body = {
        content_id: 'c1',
        content_type: 'business',
        action: 'reject',
        reason: 'spam',
      };
      const req = createRequest('/api/admin/moderation/action', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await postAction(req);

      expect(mockValidateModerationAction).toHaveBeenCalledWith(body);
    });

    it('returns 400 when validation fails', async () => {
      mockValidateModerationAction.mockReturnValue({
        valid: false,
        errors: ['action is required'],
      });

      const req = createRequest('/api/admin/moderation/action', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await postAction(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });
  });

  // ── Moderation Stats GET ──────────────────────────────────────
  describe('GET /api/admin/moderation/stats', () => {
    it('returns 200 with stats data', async () => {
      const req = createRequest('/api/admin/moderation/stats');
      const res = await getStats(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.pending_items).toBeDefined();
      expect(json.data.flagged_items).toBeDefined();
      expect(json.data.approved_today).toBeDefined();
      expect(json.data.rejected_today).toBeDefined();
      expect(json.data.avg_review_time_minutes).toBeDefined();
    });

    it('includes by_content_type breakdown', async () => {
      const req = createRequest('/api/admin/moderation/stats');
      const res = await getStats(req);
      const json = await res.json();

      expect(json.data.by_content_type).toBeDefined();
      expect(json.data.by_content_type.business).toBeDefined();
      expect(json.data.by_content_type.news).toBeDefined();
      expect(json.data.by_content_type.event).toBeDefined();
    });

    it('each content type has expected fields', async () => {
      const req = createRequest('/api/admin/moderation/stats');
      const res = await getStats(req);
      const json = await res.json();

      const businessStats = json.data.by_content_type.business;
      expect(businessStats).toHaveProperty('pending');
      expect(businessStats).toHaveProperty('flagged');
      expect(businessStats).toHaveProperty('approved');
      expect(businessStats).toHaveProperty('rejected');
    });
  });

  // ── Moderation History GET ────────────────────────────────────
  describe('GET /api/admin/moderation/history', () => {
    it('returns 200 with valid content_id and content_type', async () => {
      const req = createRequest(
        '/api/admin/moderation/history?content_id=c1&content_type=business',
      );
      const res = await getHistory(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it('returns 400 when content_id is missing', async () => {
      const req = createRequest('/api/admin/moderation/history?content_type=business');
      const res = await getHistory(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('content_id is required');
    });

    it('returns 400 when content_type is missing', async () => {
      const req = createRequest('/api/admin/moderation/history?content_id=c1');
      const res = await getHistory(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Valid content_type is required');
    });

    it('returns 400 when content_type is invalid', async () => {
      mockIsValidContentType.mockReturnValue(false);

      const req = createRequest(
        '/api/admin/moderation/history?content_id=c1&content_type=invalid_type',
      );
      const res = await getHistory(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Valid content_type is required');
    });
  });
});
