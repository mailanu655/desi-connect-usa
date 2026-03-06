/** @jest-environment node */
import { NextRequest } from 'next/server';

// Mock shared package
const mockValidateApprovalDecision = jest.fn();

jest.mock('@desi-connect-usa/shared', () => ({
  validateApprovalDecision: (...args: unknown[]) => mockValidateApprovalDecision(...args),
}));

import { GET as getApprovals } from '@/app/api/admin/approvals/route';
import { GET as getApprovalById } from '@/app/api/admin/approvals/[requestId]/route';
import { POST as postDecision } from '@/app/api/admin/approvals/decide/route';
import { GET as getApprovalStats } from '@/app/api/admin/approvals/stats/route';

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

function createRouteParams(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

describe('Admin Approvals API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateApprovalDecision.mockReturnValue({ valid: true, errors: [] });
  });

  // ── Approvals List GET ────────────────────────────────────────
  describe('GET /api/admin/approvals', () => {
    it('returns 200 with paginated data', async () => {
      const req = createRequest('/api/admin/approvals');
      const res = await getApprovals(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.items).toEqual([]);
      expect(json.data.total).toBe(0);
    });

    it('accepts filter parameters', async () => {
      const req = createRequest(
        '/api/admin/approvals?status=pending&content_type=business&priority=high&page=2&limit=10',
      );
      const res = await getApprovals(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.page).toBe(2);
      expect(json.data.limit).toBe(10);
    });

    it('returns default pagination when not specified', async () => {
      const req = createRequest('/api/admin/approvals');
      const res = await getApprovals(req);
      const json = await res.json();

      expect(json.data.page).toBe(1);
      expect(json.data.limit).toBe(20);
    });
  });

  // ── Approval Detail GET ───────────────────────────────────────
  describe('GET /api/admin/approvals/[requestId]', () => {
    it('returns 404 for non-existent request', async () => {
      const req = createRequest('/api/admin/approvals/req-123');
      const context = createRouteParams({ requestId: 'req-123' });
      const res = await getApprovalById(req, context);
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe('Approval request not found');
    });

    it('extracts requestId from params', async () => {
      const req = createRequest('/api/admin/approvals/abc');
      const context = createRouteParams({ requestId: 'abc' });
      const res = await getApprovalById(req, context);

      expect(res.status).toBe(404);
    });
  });

  // ── Approval Decision POST ────────────────────────────────────
  describe('POST /api/admin/approvals/decide', () => {
    it('returns 200 with success on valid decision', async () => {
      const body = {
        request_id: 'req-1',
        decision: 'approve',
        notes: 'Looks good',
      };
      const req = createRequest('/api/admin/approvals/decide', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const res = await postDecision(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
      expect(json.data.message).toBeDefined();
      expect(json.data.action_id).toBeDefined();
    });

    it('validates the request body', async () => {
      const body = { request_id: 'r1', decision: 'reject', reason: 'Incomplete' };
      const req = createRequest('/api/admin/approvals/decide', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await postDecision(req);

      expect(mockValidateApprovalDecision).toHaveBeenCalledWith(body);
    });

    it('returns 400 when validation fails', async () => {
      mockValidateApprovalDecision.mockReturnValue({
        valid: false,
        errors: ['decision is required'],
      });

      const req = createRequest('/api/admin/approvals/decide', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await postDecision(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Validation failed');
      expect(json.details).toContain('decision is required');
    });
  });

  // ── Approval Stats GET ────────────────────────────────────────
  describe('GET /api/admin/approvals/stats', () => {
    it('returns 200 with stats data', async () => {
      const req = createRequest('/api/admin/approvals/stats');
      const res = await getApprovalStats(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.total_pending).toBeDefined();
      expect(json.data.total_approved).toBeDefined();
      expect(json.data.total_rejected).toBeDefined();
      expect(json.data.total_needs_revision).toBeDefined();
      expect(json.data.avg_approval_time_hours).toBeDefined();
    });

    it('includes by_priority breakdown', async () => {
      const req = createRequest('/api/admin/approvals/stats');
      const res = await getApprovalStats(req);
      const json = await res.json();

      expect(json.data.by_priority).toBeDefined();
      expect(json.data.by_priority).toHaveProperty('urgent');
      expect(json.data.by_priority).toHaveProperty('high');
      expect(json.data.by_priority).toHaveProperty('normal');
      expect(json.data.by_priority).toHaveProperty('low');
    });

    it('includes by_content_type object', async () => {
      const req = createRequest('/api/admin/approvals/stats');
      const res = await getApprovalStats(req);
      const json = await res.json();

      expect(json.data.by_content_type).toBeDefined();
    });
  });
});
