/** @jest-environment node */
import { NextRequest } from 'next/server';

// Mock shared package
const mockIsValidContentType = jest.fn();
const mockValidateAnalyticsTimeRange = jest.fn();
const mockValidateBulkOperation = jest.fn();
const mockValidateCreateAdminUser = jest.fn();
const mockValidateUpdateAdminUser = jest.fn();

jest.mock('@desi-connect-usa/shared', () => ({
  isValidContentType: (...args: unknown[]) => mockIsValidContentType(...args),
  validateAnalyticsTimeRange: (...args: unknown[]) => mockValidateAnalyticsTimeRange(...args),
  validateBulkOperation: (...args: unknown[]) => mockValidateBulkOperation(...args),
  validateCreateAdminUser: (...args: unknown[]) => mockValidateCreateAdminUser(...args),
  validateUpdateAdminUser: (...args: unknown[]) => mockValidateUpdateAdminUser(...args),
}));

import { GET as getDashboardStats } from '@/app/api/admin/dashboard/stats/route';
import { GET as getContent } from '@/app/api/admin/content/route';
import { GET as getAnalytics } from '@/app/api/admin/analytics/report/route';
import { GET as getAuditLog } from '@/app/api/admin/audit-log/route';
import { POST as postBulkOperate } from '@/app/api/admin/bulk/operate/route';
import { GET as getAdminUsers, POST as postAdminUser } from '@/app/api/admin/admin-users/route';
import {
  GET as getAdminUserById,
  PUT as putAdminUser,
  DELETE as deleteAdminUser,
} from '@/app/api/admin/admin-users/[userId]/route';

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

function createRouteParams(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

describe('Admin Other API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidContentType.mockReturnValue(true);
    mockValidateAnalyticsTimeRange.mockReturnValue({ valid: true, errors: [] });
    mockValidateBulkOperation.mockReturnValue({ valid: true, errors: [] });
    mockValidateCreateAdminUser.mockReturnValue({ valid: true, errors: [] });
    mockValidateUpdateAdminUser.mockReturnValue({ valid: true, errors: [] });
  });

  // ── Dashboard Stats GET ───────────────────────────────────────
  describe('GET /api/admin/dashboard/stats', () => {
    it('returns 200 with stats object', async () => {
      const req = createRequest('/api/admin/dashboard/stats');
      const res = await getDashboardStats(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it('includes all expected stat fields', async () => {
      const req = createRequest('/api/admin/dashboard/stats');
      const res = await getDashboardStats(req);
      const json = await res.json();

      const expectedFields = [
        'total_users', 'active_users_today', 'new_users_this_week',
        'total_businesses', 'pending_approvals', 'flagged_content',
      ];
      for (const field of expectedFields) {
        expect(json.data).toHaveProperty(field);
      }
    });
  });

  // ── Content GET ───────────────────────────────────────────────
  describe('GET /api/admin/content', () => {
    it('returns 200 with paginated data', async () => {
      const req = createRequest('/api/admin/content');
      const res = await getContent(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toEqual([]);
      expect(json.data.total).toBe(0);
    });

    it('accepts filter parameters', async () => {
      const req = createRequest(
        '/api/admin/content?content_type=business&status=published&query=test&sort_by=created_at&sort_order=desc&page=2&limit=10',
      );
      const res = await getContent(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.page).toBe(2);
      expect(json.data.limit).toBe(10);
    });

    it('returns 400 for invalid content_type', async () => {
      mockIsValidContentType.mockReturnValue(false);

      const req = createRequest('/api/admin/content?content_type=invalid');
      const res = await getContent(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid content_type');
    });

    it('allows request without content_type filter', async () => {
      const req = createRequest('/api/admin/content?status=published');
      const res = await getContent(req);

      expect(res.status).toBe(200);
    });
  });

  // ── Analytics Report GET ──────────────────────────────────────
  describe('GET /api/admin/analytics/report', () => {
    it('returns 200 with report data', async () => {
      const req = createRequest(
        '/api/admin/analytics/report?metric=user_signups&start_date=2025-01-01&end_date=2025-12-31',
      );
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.metric).toBe('user_signups');
      expect(json.data.data_points).toEqual([]);
      expect(json.data.summary).toBeDefined();
      expect(json.data.generated_at).toBeDefined();
    });

    it('returns 400 when metric is missing', async () => {
      const req = createRequest('/api/admin/analytics/report?start_date=2025-01-01');
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('metric query parameter is required');
    });

    it('returns 400 when time range validation fails', async () => {
      mockValidateAnalyticsTimeRange.mockReturnValue({
        valid: false,
        errors: ['start_date must be before end_date'],
      });

      const req = createRequest(
        '/api/admin/analytics/report?metric=signups&start_date=2025-12-31&end_date=2025-01-01',
      );
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });

    it('includes time_range in response', async () => {
      const req = createRequest(
        '/api/admin/analytics/report?metric=signups&start_date=2025-01-01&end_date=2025-12-31&granularity=week',
      );
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(json.data.time_range.start_date).toBe('2025-01-01');
      expect(json.data.time_range.end_date).toBe('2025-12-31');
      expect(json.data.time_range.granularity).toBe('week');
    });

    it('defaults granularity to day', async () => {
      const req = createRequest(
        '/api/admin/analytics/report?metric=signups&start_date=2025-01-01&end_date=2025-12-31',
      );
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(json.data.time_range.granularity).toBe('day');
    });

    it('includes summary with expected fields', async () => {
      const req = createRequest('/api/admin/analytics/report?metric=signups');
      const res = await getAnalytics(req);
      const json = await res.json();

      expect(json.data.summary).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          average: expect.any(Number),
          min: expect.any(Number),
          max: expect.any(Number),
          trend: expect.any(String),
        }),
      );
    });
  });

  // ── Audit Log GET ─────────────────────────────────────────────
  describe('GET /api/admin/audit-log', () => {
    it('returns 200 with paginated data', async () => {
      const req = createRequest('/api/admin/audit-log');
      const res = await getAuditLog(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.items).toEqual([]);
      expect(json.data.total).toBe(0);
    });

    it('accepts all filter parameters', async () => {
      const req = createRequest(
        '/api/admin/audit-log?admin_id=a1&action=approve&resource=business&start_date=2025-01-01&end_date=2025-12-31&page=2&limit=25',
      );
      const res = await getAuditLog(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.page).toBe(2);
      expect(json.data.limit).toBe(25);
    });

    it('returns default pagination when not specified', async () => {
      const req = createRequest('/api/admin/audit-log');
      const res = await getAuditLog(req);
      const json = await res.json();

      expect(json.data.page).toBe(1);
      expect(json.data.limit).toBe(50);
    });
  });

  // ── Bulk Operate POST ─────────────────────────────────────────
  describe('POST /api/admin/bulk/operate', () => {
    it('returns 200 with operation result', async () => {
      const body = {
        operation: 'bulk_approve',
        content_type: 'business',
        content_ids: ['c1', 'c2', 'c3'],
      };
      const req = createRequest('/api/admin/bulk/operate', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const res = await postBulkOperate(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.operation_id).toBeDefined();
      expect(json.data.operation).toBe('bulk_approve');
      expect(json.data.content_type).toBe('business');
      expect(json.data.total_items).toBe(3);
    });

    it('validates the request body', async () => {
      const body = { operation: 'bulk_delete', content_type: 'news', content_ids: ['c1'] };
      const req = createRequest('/api/admin/bulk/operate', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await postBulkOperate(req);

      expect(mockValidateBulkOperation).toHaveBeenCalledWith(body);
    });

    it('returns 400 when validation fails', async () => {
      mockValidateBulkOperation.mockReturnValue({
        valid: false,
        errors: ['content_ids must not be empty'],
      });

      const req = createRequest('/api/admin/bulk/operate', {
        method: 'POST',
        body: JSON.stringify({ operation: 'bulk_approve', content_ids: [] }),
      });
      const res = await postBulkOperate(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });
  });

  // ── Admin Users List GET + Create POST ────────────────────────
  describe('GET /api/admin/admin-users', () => {
    it('returns 200 with empty data array', async () => {
      const req = createRequest('/api/admin/admin-users');
      const res = await getAdminUsers(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual([]);
    });
  });

  describe('POST /api/admin/admin-users', () => {
    it('returns 201 with success on valid create', async () => {
      const body = {
        user_id: 'u1',
        role: 'content_moderator',
        permissions: [],
      };
      const req = createRequest('/api/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const res = await postAdminUser(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.success).toBe(true);
      expect(json.data.admin_id).toBeDefined();
    });

    it('validates the request body', async () => {
      const body = { user_id: 'u2', role: 'analyst' };
      const req = createRequest('/api/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await postAdminUser(req);

      expect(mockValidateCreateAdminUser).toHaveBeenCalledWith(body);
    });

    it('returns 400 when validation fails', async () => {
      mockValidateCreateAdminUser.mockReturnValue({
        valid: false,
        errors: ['role is required'],
      });

      const req = createRequest('/api/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await postAdminUser(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });
  });

  // ── Admin User Detail GET/PUT/DELETE ──────────────────────────
  describe('GET /api/admin/admin-users/[userId]', () => {
    it('returns admin user data (or null)', async () => {
      const req = createRequest('/api/admin/admin-users/admin-1');
      const context = createRouteParams({ userId: 'admin-1' });
      const res = await getAdminUserById(req, context);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeNull();
      expect(json.message).toContain('admin-1');
    });
  });

  describe('PUT /api/admin/admin-users/[userId]', () => {
    it('returns 200 with success on valid update', async () => {
      const body = { role: 'analyst', is_active: true };
      const req = createRequest('/api/admin/admin-users/admin-1', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const context = createRouteParams({ userId: 'admin-1' });
      const res = await putAdminUser(req, context);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
      expect(json.data.message).toContain('admin-1');
    });

    it('validates the update body', async () => {
      const body = { role: 'super_admin' };
      const req = createRequest('/api/admin/admin-users/admin-1', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const context = createRouteParams({ userId: 'admin-1' });
      await putAdminUser(req, context);

      expect(mockValidateUpdateAdminUser).toHaveBeenCalledWith(body);
    });

    it('returns 400 when validation fails', async () => {
      mockValidateUpdateAdminUser.mockReturnValue({
        valid: false,
        errors: ['Invalid role'],
      });

      const req = createRequest('/api/admin/admin-users/admin-1', {
        method: 'PUT',
        body: JSON.stringify({ role: 'invalid' }),
      });
      const context = createRouteParams({ userId: 'admin-1' });
      const res = await putAdminUser(req, context);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/admin/admin-users/[userId]', () => {
    it('returns 200 with success', async () => {
      const req = createRequest('/api/admin/admin-users/admin-1', {
        method: 'DELETE',
      });
      const context = createRouteParams({ userId: 'admin-1' });
      const res = await deleteAdminUser(req, context);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
      expect(json.data.message).toContain('admin-1');
    });
  });
});
