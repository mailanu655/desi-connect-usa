/** @jest-environment node */
import { NextRequest } from 'next/server';

// Mock shared package
const mockValidateUserSearchParams = jest.fn();
const mockValidateUserManagementAction = jest.fn();

jest.mock('@desi-connect/shared', () => ({
  validateUserSearchParams: (...args: unknown[]) => mockValidateUserSearchParams(...args),
  validateUserManagementAction: (...args: unknown[]) => mockValidateUserManagementAction(...args),
}));

import { GET as getUsers } from '@/app/api/admin/users/route';
import { GET as getUserById } from '@/app/api/admin/users/[userId]/route';
import { POST as postUserAction } from '@/app/api/admin/users/action/route';
import { GET as getUserHistory } from '@/app/api/admin/users/[userId]/history/route';

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

function createRouteParams(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

describe('Admin Users API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateUserSearchParams.mockReturnValue({ valid: true, errors: [] });
    mockValidateUserManagementAction.mockReturnValue({ valid: true, errors: [] });
  });

  // ── Users List GET ────────────────────────────────────────────
  describe('GET /api/admin/users', () => {
    it('returns 200 with paginated data', async () => {
      const req = createRequest('/api/admin/users?page=1&limit=20');
      const res = await getUsers(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.items).toEqual([]);
      expect(json.data.total).toBe(0);
    });

    it('passes search params to validator', async () => {
      const req = createRequest(
        '/api/admin/users?query=alice&account_status=active&role=user&sort_by=created_at&sort_order=desc',
      );
      await getUsers(req);

      expect(mockValidateUserSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'alice',
          account_status: 'active',
          role: 'user',
          sort_by: 'created_at',
          sort_order: 'desc',
        }),
      );
    });

    it('returns 400 when validation fails', async () => {
      mockValidateUserSearchParams.mockReturnValue({
        valid: false,
        errors: ['Invalid account_status'],
      });

      const req = createRequest('/api/admin/users?account_status=invalid');
      const res = await getUsers(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
      expect(json.details).toContain('Invalid account_status');
    });

    it('handles date range filters', async () => {
      const req = createRequest(
        '/api/admin/users?created_after=2025-01-01&created_before=2025-12-31',
      );
      const res = await getUsers(req);
      expect(res.status).toBe(200);
    });

    it('returns default pagination when not specified', async () => {
      const req = createRequest('/api/admin/users');
      const res = await getUsers(req);
      const json = await res.json();

      expect(json.data.page).toBe(1);
      expect(json.data.limit).toBe(20);
    });
  });

  // ── User Detail GET ───────────────────────────────────────────
  describe('GET /api/admin/users/[userId]', () => {
    it('returns 404 for non-existent user', async () => {
      const req = createRequest('/api/admin/users/user-123');
      const context = createRouteParams({ userId: 'user-123' });
      const res = await getUserById(req, context);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('User not found');
    });

    it('extracts userId from params', async () => {
      const req = createRequest('/api/admin/users/abc');
      const context = createRouteParams({ userId: 'abc' });
      const res = await getUserById(req, context);

      expect(res.status).toBe(404);
    });
  });

  // ── User Management Action POST ───────────────────────────────
  describe('POST /api/admin/users/action', () => {
    it('returns 200 with success on valid action', async () => {
      const body = { user_id: 'u1', action: 'suspend', reason: 'Policy violation' };
      const req = createRequest('/api/admin/users/action', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const res = await postUserAction(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
      expect(json.data.message).toContain('suspend');
      expect(json.data.message).toContain('u1');
      expect(json.data.action_id).toBeDefined();
    });

    it('validates the request body', async () => {
      const body = { user_id: 'u1', action: 'ban' };
      const req = createRequest('/api/admin/users/action', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await postUserAction(req);

      expect(mockValidateUserManagementAction).toHaveBeenCalledWith(body);
    });

    it('returns 400 when validation fails', async () => {
      mockValidateUserManagementAction.mockReturnValue({
        valid: false,
        errors: ['user_id is required'],
      });

      const req = createRequest('/api/admin/users/action', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await postUserAction(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
    });
  });

  // ── User History GET ──────────────────────────────────────────
  describe('GET /api/admin/users/[userId]/history', () => {
    it('returns 200 with empty array for valid userId', async () => {
      const req = createRequest('/api/admin/users/u1/history');
      const context = createRouteParams({ userId: 'u1' });
      const res = await getUserHistory(req, context);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it('extracts userId from dynamic params', async () => {
      const req = createRequest('/api/admin/users/xyz/history');
      const context = createRouteParams({ userId: 'xyz' });
      const res = await getUserHistory(req, context);

      expect(res.status).toBe(200);
    });
  });
});
