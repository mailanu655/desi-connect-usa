/**
 * Admin Validators (Week 14)
 *
 * Validation functions for admin dashboard inputs:
 * moderation actions, bulk operations, user management,
 * approval decisions, and admin user creation.
 */

import type {
  AdminRole,
  AdminContentType,
  ModerationAction,
  ModerationReason,
  ModerationActionInput,
  BulkOperationInput,
  BulkOperationType,
  UserManagementAction,
  UserAccountStatus,
  ApprovalDecisionInput,
  CreateAdminUserInput,
  UpdateAdminUserInput,
  AuditLogSearchParams,
  ModerationQueueFilters,
  UserSearchParams,
  AdminAnalyticsTimeRange,
} from '../types/admin';

import type { ValidationResult } from './index';

// ── Constants ───────────────────────────────────────────────────

const VALID_ADMIN_ROLES: AdminRole[] = [
  'super_admin', 'content_moderator', 'user_manager', 'analyst'
];

const VALID_CONTENT_TYPES: AdminContentType[] = [
  'business', 'news', 'event', 'deal', 'review',
  'forum_thread', 'forum_reply', 'consultancy', 'job'
];

const VALID_MODERATION_ACTIONS: ModerationAction[] = [
  'approve', 'reject', 'flag', 'unflag', 'archive', 'restore', 'delete', 'edit'
];

const VALID_MODERATION_REASONS: ModerationReason[] = [
  'spam', 'inappropriate', 'duplicate', 'misleading',
  'offensive', 'policy_violation', 'fraud', 'other'
];

const VALID_BULK_OPERATIONS: BulkOperationType[] = [
  'approve', 'reject', 'flag', 'delete', 'archive',
  'change_status', 'assign_category'
];

const VALID_USER_ACTIONS = [
  'suspend', 'ban', 'activate', 'deactivate', 'reset_password', 'merge_accounts'
] as const;

const VALID_USER_ACCOUNT_STATUSES: UserAccountStatus[] = [
  'active', 'suspended', 'banned', 'deactivated'
];

const VALID_APPROVAL_DECISIONS = ['approve', 'reject', 'needs_revision'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

// ── Helpers ─────────────────────────────────────────────────────

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isValidEnum<T extends string>(val: unknown, values: readonly T[]): val is T {
  return typeof val === 'string' && (values as readonly string[]).includes(val);
}

// ── Admin User Validators ───────────────────────────────────────

export function validateCreateAdminUser(input: Partial<CreateAdminUserInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.email)) {
    errors.push('email is required');
  } else if (!EMAIL_REGEX.test(input.email)) {
    errors.push('email must be a valid email address');
  }

  if (!isNonEmptyString(input.display_name)) {
    errors.push('display_name is required');
  } else if (input.display_name.trim().length < 2) {
    errors.push('display_name must be at least 2 characters');
  } else if (input.display_name.trim().length > 100) {
    errors.push('display_name must be at most 100 characters');
  }

  if (!isValidEnum(input.role, VALID_ADMIN_ROLES)) {
    errors.push(`role must be one of: ${VALID_ADMIN_ROLES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpdateAdminUser(input: Partial<UpdateAdminUserInput>): ValidationResult {
  const errors: string[] = [];

  if (input.display_name !== undefined) {
    if (!isNonEmptyString(input.display_name)) {
      errors.push('display_name cannot be empty');
    } else if (input.display_name.trim().length < 2) {
      errors.push('display_name must be at least 2 characters');
    }
  }

  if (input.role !== undefined && !isValidEnum(input.role, VALID_ADMIN_ROLES)) {
    errors.push(`role must be one of: ${VALID_ADMIN_ROLES.join(', ')}`);
  }

  if (input.is_active !== undefined && typeof input.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return { valid: errors.length === 0, errors };
}

// ── Moderation Validators ───────────────────────────────────────

export function validateModerationAction(input: Partial<ModerationActionInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.content_id)) {
    errors.push('content_id is required');
  }

  if (!isValidEnum(input.content_type, VALID_CONTENT_TYPES)) {
    errors.push(`content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }

  if (!isValidEnum(input.action, VALID_MODERATION_ACTIONS)) {
    errors.push(`action must be one of: ${VALID_MODERATION_ACTIONS.join(', ')}`);
  }

  // Reason required for reject, flag actions
  if (input.action === 'reject' || input.action === 'flag') {
    if (input.reason !== undefined && !isValidEnum(input.reason, VALID_MODERATION_REASONS)) {
      errors.push(`reason must be one of: ${VALID_MODERATION_REASONS.join(', ')}`);
    }
  }

  if (input.reason !== undefined && !isValidEnum(input.reason, VALID_MODERATION_REASONS)) {
    errors.push(`reason must be one of: ${VALID_MODERATION_REASONS.join(', ')}`);
  }

  if (input.notes !== undefined && typeof input.notes === 'string' && input.notes.length > 1000) {
    errors.push('notes must be at most 1000 characters');
  }

  return { valid: errors.length === 0, errors };
}

// ── Bulk Operation Validators ───────────────────────────────────

export function validateBulkOperation(input: Partial<BulkOperationInput>): ValidationResult {
  const errors: string[] = [];

  if (!isValidEnum(input.content_type, VALID_CONTENT_TYPES)) {
    errors.push(`content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }

  if (!Array.isArray(input.content_ids) || input.content_ids.length === 0) {
    errors.push('content_ids must be a non-empty array');
  } else if (input.content_ids.length > 100) {
    errors.push('content_ids cannot exceed 100 items per operation');
  } else {
    const invalidIds = input.content_ids.filter(id => !isNonEmptyString(id));
    if (invalidIds.length > 0) {
      errors.push('All content_ids must be non-empty strings');
    }
  }

  if (!isValidEnum(input.operation, VALID_BULK_OPERATIONS)) {
    errors.push(`operation must be one of: ${VALID_BULK_OPERATIONS.join(', ')}`);
  }

  if (input.operation === 'change_status' && !isNonEmptyString(input.new_status)) {
    errors.push('new_status is required for change_status operation');
  }

  if (input.operation === 'assign_category' && !isNonEmptyString(input.new_category)) {
    errors.push('new_category is required for assign_category operation');
  }

  if (input.reason !== undefined && !isValidEnum(input.reason, VALID_MODERATION_REASONS)) {
    errors.push(`reason must be one of: ${VALID_MODERATION_REASONS.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

// ── User Management Validators ──────────────────────────────────

export function validateUserManagementAction(input: Partial<UserManagementAction>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.user_id)) {
    errors.push('user_id is required');
  }

  if (!isValidEnum(input.action, VALID_USER_ACTIONS)) {
    errors.push(`action must be one of: ${VALID_USER_ACTIONS.join(', ')}`);
  }

  if (input.action === 'suspend' || input.action === 'ban') {
    if (!isNonEmptyString(input.reason)) {
      errors.push('reason is required for suspend/ban actions');
    }
  }

  if (input.action === 'merge_accounts') {
    if (!isNonEmptyString(input.merge_target_id)) {
      errors.push('merge_target_id is required for merge_accounts action');
    }
    if (input.merge_target_id === input.user_id) {
      errors.push('merge_target_id cannot be the same as user_id');
    }
  }

  if (input.notes !== undefined && typeof input.notes === 'string' && input.notes.length > 1000) {
    errors.push('notes must be at most 1000 characters');
  }

  return { valid: errors.length === 0, errors };
}

// ── Approval Workflow Validators ────────────────────────────────

export function validateApprovalDecision(input: Partial<ApprovalDecisionInput>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.request_id)) {
    errors.push('request_id is required');
  }

  if (!isValidEnum(input.decision, VALID_APPROVAL_DECISIONS)) {
    errors.push(`decision must be one of: ${VALID_APPROVAL_DECISIONS.join(', ')}`);
  }

  if (input.decision === 'reject' || input.decision === 'needs_revision') {
    if (!isNonEmptyString(input.notes)) {
      errors.push('notes are required when rejecting or requesting revision');
    }
  }

  if (input.notes !== undefined && typeof input.notes === 'string' && input.notes.length > 2000) {
    errors.push('notes must be at most 2000 characters');
  }

  return { valid: errors.length === 0, errors };
}

// ── Search/Filter Validators ────────────────────────────────────

export function validateModerationQueueFilters(input: Partial<ModerationQueueFilters>): ValidationResult {
  const errors: string[] = [];

  if (input.content_type !== undefined && !isValidEnum(input.content_type, VALID_CONTENT_TYPES)) {
    errors.push(`content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
  }

  if (input.page !== undefined && (typeof input.page !== 'number' || input.page < 1)) {
    errors.push('page must be a positive number');
  }

  if (input.limit !== undefined && (typeof input.limit !== 'number' || input.limit < 1 || input.limit > 100)) {
    errors.push('limit must be between 1 and 100');
  }

  if (input.date_range) {
    if (!ISO_DATE_REGEX.test(input.date_range.start)) {
      errors.push('date_range.start must be a valid ISO date');
    }
    if (!ISO_DATE_REGEX.test(input.date_range.end)) {
      errors.push('date_range.end must be a valid ISO date');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateUserSearchParams(input: Partial<UserSearchParams>): ValidationResult {
  const errors: string[] = [];

  if (input.account_status !== undefined && !isValidEnum(input.account_status, VALID_USER_ACCOUNT_STATUSES)) {
    errors.push(`account_status must be one of: ${VALID_USER_ACCOUNT_STATUSES.join(', ')}`);
  }

  if (input.page !== undefined && (typeof input.page !== 'number' || input.page < 1)) {
    errors.push('page must be a positive number');
  }

  if (input.limit !== undefined && (typeof input.limit !== 'number' || input.limit < 1 || input.limit > 100)) {
    errors.push('limit must be between 1 and 100');
  }

  if (input.created_after !== undefined && !ISO_DATE_REGEX.test(input.created_after)) {
    errors.push('created_after must be a valid ISO date');
  }

  if (input.created_before !== undefined && !ISO_DATE_REGEX.test(input.created_before)) {
    errors.push('created_before must be a valid ISO date');
  }

  return { valid: errors.length === 0, errors };
}

export function validateAnalyticsTimeRange(input: Partial<AdminAnalyticsTimeRange>): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.start_date) || !ISO_DATE_REGEX.test(input.start_date ?? '')) {
    errors.push('start_date must be a valid ISO date');
  }

  if (!isNonEmptyString(input.end_date) || !ISO_DATE_REGEX.test(input.end_date ?? '')) {
    errors.push('end_date must be a valid ISO date');
  }

  if (input.start_date && input.end_date && input.start_date > input.end_date) {
    errors.push('start_date must be before end_date');
  }

  const validGranularities = ['day', 'week', 'month'] as const;
  if (!isValidEnum(input.granularity, validGranularities)) {
    errors.push(`granularity must be one of: ${validGranularities.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

// ── Permission Check ────────────────────────────────────────────

export function validateAdminRole(role: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isValidEnum(role, VALID_ADMIN_ROLES)) {
    errors.push(`Invalid admin role. Must be one of: ${VALID_ADMIN_ROLES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

export function isValidContentType(val: unknown): val is AdminContentType {
  return isValidEnum(val, VALID_CONTENT_TYPES);
}

export function isValidModerationAction(val: unknown): val is ModerationAction {
  return isValidEnum(val, VALID_MODERATION_ACTIONS);
}

export function isValidAdminRole(val: unknown): val is AdminRole {
  return isValidEnum(val, VALID_ADMIN_ROLES);
}

// ── Export Constants for testing ─────────────────────────────────

export {
  VALID_ADMIN_ROLES,
  VALID_CONTENT_TYPES,
  VALID_MODERATION_ACTIONS,
  VALID_MODERATION_REASONS,
  VALID_BULK_OPERATIONS,
  VALID_USER_ACTIONS,
  VALID_USER_ACCOUNT_STATUSES,
  VALID_APPROVAL_DECISIONS,
};
