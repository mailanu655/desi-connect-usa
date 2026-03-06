import { AdminApiClient, adminApi } from '@/lib/admin/admin-api';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdminApiClient', () => {
  let client: AdminApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AdminApiClient();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  describe('constructor and configuration', () => {
    it('creates a client with default config', () => {
      expect(client).toBeInstanceOf(AdminApiClient);
    });

    it('creates a client with custom config', () => {
      const custom = new AdminApiClient({ baseUrl: 'https://api.example.com' });
      expect(custom).toBeInstanceOf(AdminApiClient);
    });

    it('sets auth token', () => {
      client.setAuthToken('test-token-123');
      // Token is set internally, verify by making a request
      client.getDashboardStats();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });
  });

  describe('dashboard', () => {
    it('getDashboardStats fetches from correct endpoint', async () => {
      const mockStats = {
        users: { total: 100, new_today: 5, new_this_week: 20, new_this_month: 50, active_today: 80, by_status: {}, by_city: [], by_auth_provider: {} },
        content: {},
        moderation: {},
        approvals: {},
        activity: {},
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockStats,
      });

      const stats = await client.getDashboardStats();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dashboard/stats'),
        expect.any(Object)
      );
      expect(stats).toHaveProperty('users');
      expect(stats.users).toHaveProperty('total', 100);
    });
  });

  describe('moderation', () => {
    it('getModerationQueue fetches with filters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, total_pages: 0 }),
      });

      await client.getModerationQueue({ status: 'pending', content_type: 'business' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/moderation\/queue.*status=pending/),
        expect.any(Object)
      );
    });

    it('getModerationStats fetches stats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          pending_items: 5,
          flagged_items: 3,
          approved_today: 10,
          rejected_today: 2,
          avg_review_time_hours: 1.5,
          by_content_type: {},
        }),
      });

      const stats = await client.getModerationStats();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/moderation/stats'),
        expect.any(Object)
      );
      expect(stats).toHaveProperty('pending_items', 5);
    });

    it('performModerationAction sends POST with body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Action performed' }),
      });

      await client.performModerationAction({
        content_id: 'content-1',
        content_type: 'business',
        action: 'approve',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/moderation/action'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('content-1'),
        })
      );
    });

    it('getModerationHistory fetches for specific content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([]),
      });

      await client.getModerationHistory('content-1', 'business');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/moderation\/history.*content_id=content-1/),
        expect.any(Object)
      );
    });
  });

  describe('bulk operations', () => {
    it('performBulkOperation sends POST', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          operation_id: 'op-1',
          total_items: 5,
          successful: 5,
          failed: 0,
          errors: [],
          completed_at: '2026-01-01T00:00:00Z',
        }),
      });

      const result = await client.performBulkOperation({
        content_type: 'business',
        content_ids: ['1', '2', '3', '4', '5'],
        operation: 'approve',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/bulk/operate'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toHaveProperty('successful', 5);
    });
  });

  describe('user management', () => {
    it('getUsers fetches with search params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, total_pages: 0 }),
      });

      await client.getUsers({ query: 'test', account_status: 'active' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/users.*query=test/),
        expect.any(Object)
      );
    });

    it('getUserById fetches specific user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          user_id: 'user-1',
          display_name: 'Test User',
          email: 'test@test.com',
          account_status: 'active',
        }),
      });

      const user = await client.getUserById('user-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1'),
        expect.any(Object)
      );
      expect(user).toHaveProperty('display_name', 'Test User');
    });

    it('performUserAction sends POST', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'User suspended' }),
      });

      await client.performUserAction({
        user_id: 'user-1',
        action: 'suspend',
        reason: 'Policy violation',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/action'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('approvals', () => {
    it('getApprovalQueue fetches with filters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, total_pages: 0 }),
      });

      await client.getApprovalQueue({ status: 'pending' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/approvals.*status=pending/),
        expect.any(Object)
      );
    });

    it('submitApprovalDecision sends POST', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Approved' }),
      });

      await client.submitApprovalDecision({
        request_id: 'req-1',
        decision: 'approve',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/approvals/decide'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getApprovalStats fetches stats', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_pending: 10,
          total_approved: 50,
          total_rejected: 5,
          total_needs_revision: 3,
          avg_approval_time_hours: 4.2,
          by_content_type: {},
          by_priority: {},
        }),
      });

      const stats = await client.getApprovalStats();
      expect(stats).toHaveProperty('total_pending', 10);
    });
  });

  describe('content management', () => {
    it('getContentList fetches with filters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, total_pages: 0 }),
      });

      await client.getContentList({ content_type: 'business', status: 'published' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/content/),
        expect.any(Object)
      );
    });
  });

  describe('analytics', () => {
    it('getAnalyticsReport fetches with time range and metric', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'User Registrations',
          time_range: { start_date: '2026-01-01', end_date: '2026-01-31', granularity: 'day' },
          data_points: [{ date: '2026-01-01', value: 100 }],
          summary: { total: 100, average: 100, min: 100, max: 100, trend: 'stable', percent_change: 0 },
        }),
      });

      await client.getAnalyticsReport(
        { start_date: '2026-01-01', end_date: '2026-01-31', granularity: 'day' },
        'user_registrations'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/analytics\/report/),
        expect.any(Object)
      );
    });
  });

  describe('audit log', () => {
    it('getAuditLog fetches with params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], total: 0, page: 1, total_pages: 0 }),
      });

      await client.getAuditLog({ action: 'create', resource: 'users' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/audit-log/),
        expect.any(Object)
      );
    });
  });

  describe('admin user management', () => {
    it('getAdminUsers fetches admin users list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ([
          { user_id: 'admin-1', email: 'admin@test.com', role: 'super_admin' },
        ]),
      });

      const users = await client.getAdminUsers();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin-users'),
        expect.any(Object)
      );
      expect(users).toHaveLength(1);
    });

    it('createAdminUser sends POST', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Admin user created' }),
      });

      await client.createAdminUser({
        email: 'new@test.com',
        role: 'content_moderator',
        display_name: 'New Admin',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin-users'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateAdminUser sends PUT', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Admin user updated' }),
      });

      await client.updateAdminUser('admin-1', { role: 'super_admin' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin-users/admin-1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteAdminUser sends DELETE', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Admin user deleted' }),
      });

      await client.deleteAdminUser('admin-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin-users/admin-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('error handling', () => {
    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(client.getDashboardStats()).rejects.toMatchObject({
        status: 500,
        message: 'Server error',
      });
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      await expect(client.getDashboardStats()).rejects.toThrow('Network error');
    });
  });

  describe('singleton export', () => {
    it('exports a default AdminApiClient instance', () => {
      expect(adminApi).toBeInstanceOf(AdminApiClient);
    });
  });
});
