/**
 * Admin API Client (Week 14)
 *
 * Typed methods for all admin dashboard API endpoints:
 * moderation queue, user management, bulk operations,
 * approval workflows, analytics, audit log.
 */

import type {
  AdminContentType,
  ModerationQueueItem,
  ModerationActionInput,
  ModerationLog,
  ModerationStats,
  BulkOperationInput,
  BulkOperationResult,
  AdminUserView,
  UserManagementAction,
  UserManagementLog,
  UserSearchParams,
  ApprovalRequest,
  ApprovalDecisionInput,
  ApprovalWorkflowStats,
  AdminDashboardStats,
  AdminAnalyticsTimeRange,
  AdminAnalyticsReport,
  AuditLogEntry,
  AuditLogSearchParams,
  AdminUser,
  CreateAdminUserInput,
  UpdateAdminUserInput,
  AdminListResponse,
  AdminActionResponse,
  ModerationQueueFilters,
  ContentManagementFilters,
} from '@desi-connect-usa/shared';

// ── Types ──────────────────────────────────────────────────────

export interface AdminApiConfig {
  baseUrl: string;
  authToken?: string;
}

export interface AdminApiError {
  status: number;
  message: string;
  code?: string;
}

// ── Admin API Client ───────────────────────────────────────────

export class AdminApiClient {
  private baseUrl: string;
  private authToken: string;

  constructor(config?: Partial<AdminApiConfig>) {
    this.baseUrl = config?.baseUrl ?? '/api/admin';
    this.authToken = config?.authToken ?? '';
  }

  /**
   * Update the auth token (e.g. after login).
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`, window?.location?.origin ?? 'http://localhost:3000');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ message: res.statusText }));
      const error: AdminApiError = {
        status: res.status,
        message: errorBody.message ?? `Request failed: ${res.status}`,
        code: errorBody.code,
      };
      throw error;
    }

    return res.json();
  }

  private get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  private post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  private put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  private delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // ── Dashboard ──────────────────────────────────────────────

  async getDashboardStats(): Promise<AdminDashboardStats> {
    return this.get<AdminDashboardStats>('/dashboard/stats');
  }

  // ── Moderation Queue ───────────────────────────────────────

  async getModerationQueue(
    filters?: ModerationQueueFilters,
  ): Promise<AdminListResponse<ModerationQueueItem>> {
    return this.get<AdminListResponse<ModerationQueueItem>>(
      '/moderation/queue',
      filters as Record<string, string | number | boolean | undefined>,
    );
  }

  async getModerationStats(): Promise<ModerationStats> {
    return this.get<ModerationStats>('/moderation/stats');
  }

  async performModerationAction(
    input: ModerationActionInput,
  ): Promise<AdminActionResponse> {
    return this.post<AdminActionResponse>('/moderation/action', input);
  }

  async getModerationHistory(
    contentId: string,
    contentType: AdminContentType,
  ): Promise<ModerationLog[]> {
    return this.get<ModerationLog[]>('/moderation/history', {
      content_id: contentId,
      content_type: contentType,
    });
  }

  // ── Bulk Operations ────────────────────────────────────────

  async performBulkOperation(
    input: BulkOperationInput,
  ): Promise<BulkOperationResult> {
    return this.post<BulkOperationResult>('/bulk/operate', input);
  }

  // ── User Management ────────────────────────────────────────

  async getUsers(
    params?: UserSearchParams,
  ): Promise<AdminListResponse<AdminUserView>> {
    return this.get<AdminListResponse<AdminUserView>>(
      '/users',
      params as Record<string, string | number | boolean | undefined>,
    );
  }

  async getUserById(userId: string): Promise<AdminUserView> {
    return this.get<AdminUserView>(`/users/${userId}`);
  }

  async performUserAction(
    input: UserManagementAction,
  ): Promise<AdminActionResponse> {
    return this.post<AdminActionResponse>('/users/action', input);
  }

  async getUserActionHistory(
    userId: string,
  ): Promise<UserManagementLog[]> {
    return this.get<UserManagementLog[]>(`/users/${userId}/history`);
  }

  // ── Approval Workflows ─────────────────────────────────────

  async getApprovalQueue(
    filters?: { status?: string; content_type?: string; priority?: string; page?: number; limit?: number },
  ): Promise<AdminListResponse<ApprovalRequest>> {
    return this.get<AdminListResponse<ApprovalRequest>>(
      '/approvals',
      filters as Record<string, string | number | boolean | undefined>,
    );
  }

  async getApprovalById(requestId: string): Promise<ApprovalRequest> {
    return this.get<ApprovalRequest>(`/approvals/${requestId}`);
  }

  async submitApprovalDecision(
    input: ApprovalDecisionInput,
  ): Promise<AdminActionResponse> {
    return this.post<AdminActionResponse>('/approvals/decide', input);
  }

  async getApprovalStats(): Promise<ApprovalWorkflowStats> {
    return this.get<ApprovalWorkflowStats>('/approvals/stats');
  }

  // ── Content Management ─────────────────────────────────────

  async getContentList(
    filters: ContentManagementFilters,
  ): Promise<AdminListResponse<ModerationQueueItem>> {
    return this.get<AdminListResponse<ModerationQueueItem>>(
      '/content',
      filters as Record<string, string | number | boolean | undefined>,
    );
  }

  // ── Analytics ──────────────────────────────────────────────

  async getAnalyticsReport(
    timeRange: AdminAnalyticsTimeRange,
    metric: string,
  ): Promise<AdminAnalyticsReport> {
    return this.get<AdminAnalyticsReport>('/analytics/report', {
      start_date: timeRange.start_date,
      end_date: timeRange.end_date,
      granularity: timeRange.granularity,
      metric,
    });
  }

  // ── Audit Log ──────────────────────────────────────────────

  async getAuditLog(
    params?: AuditLogSearchParams,
  ): Promise<AdminListResponse<AuditLogEntry>> {
    return this.get<AdminListResponse<AuditLogEntry>>(
      '/audit-log',
      params as Record<string, string | number | boolean | undefined>,
    );
  }

  // ── Admin Users ────────────────────────────────────────────

  async getAdminUsers(): Promise<AdminUser[]> {
    return this.get<AdminUser[]>('/admin-users');
  }

  async createAdminUser(
    input: CreateAdminUserInput,
  ): Promise<AdminActionResponse> {
    return this.post<AdminActionResponse>('/admin-users', input);
  }

  async updateAdminUser(
    userId: string,
    input: UpdateAdminUserInput,
  ): Promise<AdminActionResponse> {
    return this.put<AdminActionResponse>(`/admin-users/${userId}`, input);
  }

  async deleteAdminUser(userId: string): Promise<AdminActionResponse> {
    return this.delete<AdminActionResponse>(`/admin-users/${userId}`);
  }
}

// ── Singleton ──────────────────────────────────────────────────

export const adminApi = new AdminApiClient();
