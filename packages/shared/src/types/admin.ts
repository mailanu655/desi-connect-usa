/**
 * Admin Dashboard Types (Week 14)
 *
 * Content moderation, user management, analytics,
 * bulk operations, and approval workflows.
 */

import type { BusinessStatus, BusinessCategory } from './business';
import type { NewsStatus, NewsCategory } from './news';
import type { EventStatus, EventCategory } from './event';
import type { DealStatus } from './deal';
import type { ReviewStatus } from './review';

// ── Admin Roles & Permissions ───────────────────────────────────

export type AdminRole =
  | 'super_admin'
  | 'content_moderator'
  | 'user_manager'
  | 'analyst';

export interface AdminPermission {
  resource: AdminResource;
  actions: AdminAction[];
}

export type AdminResource =
  | 'users'
  | 'businesses'
  | 'news'
  | 'events'
  | 'deals'
  | 'reviews'
  | 'forum'
  | 'consultancies'
  | 'jobs'
  | 'analytics'
  | 'settings';

export type AdminAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'flag'
  | 'bulk_update'
  | 'export';

/** Admin role → allowed permissions mapping */
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    { resource: 'users', actions: ['view', 'create', 'update', 'delete', 'bulk_update', 'export'] },
    { resource: 'businesses', actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'flag', 'bulk_update', 'export'] },
    { resource: 'news', actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'flag', 'bulk_update', 'export'] },
    { resource: 'events', actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'flag', 'bulk_update', 'export'] },
    { resource: 'deals', actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'bulk_update', 'export'] },
    { resource: 'reviews', actions: ['view', 'update', 'delete', 'approve', 'reject', 'flag', 'bulk_update', 'export'] },
    { resource: 'forum', actions: ['view', 'update', 'delete', 'flag', 'bulk_update'] },
    { resource: 'consultancies', actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'flag', 'bulk_update', 'export'] },
    { resource: 'jobs', actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'bulk_update', 'export'] },
    { resource: 'analytics', actions: ['view', 'export'] },
    { resource: 'settings', actions: ['view', 'update'] },
  ],
  content_moderator: [
    { resource: 'businesses', actions: ['view', 'update', 'approve', 'reject', 'flag', 'bulk_update'] },
    { resource: 'news', actions: ['view', 'update', 'approve', 'reject', 'flag', 'bulk_update'] },
    { resource: 'events', actions: ['view', 'update', 'approve', 'reject', 'flag', 'bulk_update'] },
    { resource: 'deals', actions: ['view', 'update', 'approve', 'reject', 'bulk_update'] },
    { resource: 'reviews', actions: ['view', 'update', 'approve', 'reject', 'flag', 'bulk_update'] },
    { resource: 'forum', actions: ['view', 'update', 'delete', 'flag', 'bulk_update'] },
    { resource: 'consultancies', actions: ['view', 'update', 'approve', 'reject', 'flag'] },
    { resource: 'jobs', actions: ['view', 'update', 'approve', 'reject'] },
    { resource: 'analytics', actions: ['view'] },
  ],
  user_manager: [
    { resource: 'users', actions: ['view', 'update', 'bulk_update', 'export'] },
    { resource: 'analytics', actions: ['view'] },
  ],
  analyst: [
    { resource: 'users', actions: ['view'] },
    { resource: 'businesses', actions: ['view'] },
    { resource: 'news', actions: ['view'] },
    { resource: 'events', actions: ['view'] },
    { resource: 'deals', actions: ['view'] },
    { resource: 'reviews', actions: ['view'] },
    { resource: 'analytics', actions: ['view', 'export'] },
  ],
};

// ── Admin User ──────────────────────────────────────────────────

export interface AdminUser {
  user_id: string;
  email: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminUserInput {
  email: string;
  display_name: string;
  role: AdminRole;
}

export interface UpdateAdminUserInput {
  display_name?: string;
  role?: AdminRole;
  is_active?: boolean;
}

// ── Content Moderation ──────────────────────────────────────────

export type AdminContentType =
  | 'business'
  | 'news'
  | 'event'
  | 'deal'
  | 'review'
  | 'forum_thread'
  | 'forum_reply'
  | 'consultancy'
  | 'job';

export type ModerationAction =
  | 'approve'
  | 'reject'
  | 'flag'
  | 'unflag'
  | 'archive'
  | 'restore'
  | 'delete'
  | 'edit';

export type ModerationReason =
  | 'spam'
  | 'inappropriate'
  | 'duplicate'
  | 'misleading'
  | 'offensive'
  | 'policy_violation'
  | 'fraud'
  | 'other';

/** Unified content item for the moderation queue */
export interface ModerationQueueItem {
  content_id: string;
  content_type: AdminContentType;
  title: string;
  summary: string;
  submitted_by: string | null;
  submitted_by_name: string | null;
  submission_source: string;
  current_status: string;
  city: string | null;
  state: string | null;
  flag_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
}

export interface ModerationActionInput {
  content_id: string;
  content_type: AdminContentType;
  action: ModerationAction;
  reason?: ModerationReason;
  notes?: string;
}

export interface ModerationLog {
  log_id: string;
  admin_id: string;
  admin_name: string;
  content_id: string;
  content_type: AdminContentType;
  action: ModerationAction;
  reason: ModerationReason | null;
  notes: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
}

export interface ModerationStats {
  pending_items: number;
  flagged_items: number;
  approved_today: number;
  rejected_today: number;
  avg_review_time_hours: number;
  by_content_type: Record<AdminContentType, {
    pending: number;
    flagged: number;
    total: number;
  }>;
}

// ── Bulk Operations ─────────────────────────────────────────────

export type BulkOperationType =
  | 'approve'
  | 'reject'
  | 'flag'
  | 'delete'
  | 'archive'
  | 'change_status'
  | 'assign_category';

export interface BulkOperationInput {
  content_type: AdminContentType;
  content_ids: string[];
  operation: BulkOperationType;
  /** For change_status operation */
  new_status?: string;
  /** For assign_category operation */
  new_category?: string;
  reason?: ModerationReason;
  notes?: string;
}

export interface BulkOperationResult {
  operation_id: string;
  total_items: number;
  successful: number;
  failed: number;
  errors: Array<{
    content_id: string;
    error: string;
  }>;
  completed_at: string;
}

// ── User Management ─────────────────────────────────────────────

export type UserAccountStatus = 'active' | 'suspended' | 'banned' | 'deactivated';

export interface AdminUserView {
  user_id: string;
  display_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  identity_linked: boolean;
  created_via: string;
  auth_provider: string;
  account_status: UserAccountStatus;
  submission_count: number;
  review_count: number;
  report_count: number;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserManagementAction {
  user_id: string;
  action: 'suspend' | 'ban' | 'activate' | 'deactivate' | 'reset_password' | 'merge_accounts';
  reason?: string;
  notes?: string;
  /** For merge_accounts: the target user_id to merge into */
  merge_target_id?: string;
}

export interface UserManagementLog {
  log_id: string;
  admin_id: string;
  admin_name: string;
  user_id: string;
  user_name: string;
  action: string;
  reason: string | null;
  notes: string | null;
  previous_status: UserAccountStatus | null;
  new_status: UserAccountStatus | null;
  created_at: string;
}

export interface UserSearchParams {
  query?: string;
  account_status?: UserAccountStatus;
  created_via?: string;
  city?: string;
  has_reports?: boolean;
  created_after?: string;
  created_before?: string;
  page?: number;
  limit?: number;
  sort_by?: 'newest' | 'oldest' | 'name' | 'most_submissions' | 'most_reports';
}

// ── Approval Workflows ──────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface ApprovalRequest {
  request_id: string;
  content_id: string;
  content_type: AdminContentType;
  title: string;
  summary: string;
  submitted_by: string | null;
  submitted_by_name: string | null;
  submission_source: string;
  status: ApprovalStatus;
  assigned_to: string | null;
  assigned_to_name: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  revision_notes: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalDecisionInput {
  request_id: string;
  decision: 'approve' | 'reject' | 'needs_revision';
  notes?: string;
}

export interface ApprovalWorkflowStats {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  total_needs_revision: number;
  avg_approval_time_hours: number;
  by_content_type: Record<AdminContentType, {
    pending: number;
    approved: number;
    rejected: number;
  }>;
  by_priority: Record<string, number>;
}

// ── Analytics / Dashboard Stats ─────────────────────────────────

export interface AdminDashboardStats {
  users: {
    total: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    active_today: number;
    by_status: Record<UserAccountStatus, number>;
    by_city: Array<{ city: string; count: number }>;
    by_auth_provider: Record<string, number>;
  };
  content: {
    businesses: { total: number; pending: number; approved: number; flagged: number };
    news: { total: number; pending: number; published: number; archived: number };
    events: { total: number; pending: number; upcoming: number; completed: number };
    deals: { total: number; pending: number; active: number; expired: number };
    reviews: { total: number; pending: number; published: number; flagged: number };
    jobs: { total: number; active: number; expired: number };
    forum_threads: { total: number; open: number; closed: number; archived: number };
  };
  moderation: ModerationStats;
  approvals: ApprovalWorkflowStats;
  activity: {
    submissions_today: number;
    submissions_this_week: number;
    reviews_today: number;
    page_views_today: number;
    trending_cities: Array<{ city: string; count: number }>;
    trending_categories: Array<{ category: string; count: number }>;
  };
}

export interface AdminAnalyticsTimeRange {
  start_date: string;
  end_date: string;
  granularity: 'day' | 'week' | 'month';
}

export interface AdminAnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AdminAnalyticsReport {
  title: string;
  time_range: AdminAnalyticsTimeRange;
  data_points: AdminAnalyticsDataPoint[];
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    trend: 'up' | 'down' | 'stable';
    percent_change: number;
  };
}

// ── Audit Log ───────────────────────────────────────────────────

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'flag'
  | 'bulk_operation'
  | 'user_suspend'
  | 'user_ban'
  | 'user_activate'
  | 'settings_change'
  | 'export_data';

export interface AuditLogEntry {
  audit_id: string;
  admin_id: string;
  admin_name: string;
  admin_role: AdminRole;
  action: AuditAction;
  resource: AdminResource;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogSearchParams {
  admin_id?: string;
  action?: AuditAction;
  resource?: AdminResource;
  resource_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// ── Admin API Response Wrappers ─────────────────────────────────

export interface AdminListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  action: string;
  affected_id: string;
  timestamp: string;
}

// ── Filter Types for Admin Pages ────────────────────────────────

export interface ModerationQueueFilters {
  content_type?: AdminContentType;
  status?: string;
  submission_source?: string;
  city?: string;
  date_range?: { start: string; end: string };
  sort_by?: 'newest' | 'oldest' | 'most_flagged' | 'most_reported';
  page?: number;
  limit?: number;
}

export interface ContentManagementFilters {
  content_type: AdminContentType;
  status?: string;
  category?: string;
  city?: string;
  query?: string;
  date_range?: { start: string; end: string };
  sort_by?: 'newest' | 'oldest' | 'name' | 'most_views' | 'most_reports';
  page?: number;
  limit?: number;
}
