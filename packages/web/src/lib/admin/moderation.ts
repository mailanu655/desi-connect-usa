/**
 * Admin Moderation Helpers (Week 14)
 *
 * Content-type-aware status mapping, moderation queue utilities,
 * and display helpers for the admin dashboard.
 */

import type {
  AdminContentType,
  ModerationAction,
  ModerationReason,
  ModerationQueueItem,
  ModerationStats,
  BulkOperationType,
} from '@desi-connect-usa/shared';

// ── Status Labels ──────────────────────────────────────────────

/** Human-readable labels for each content type */
export const CONTENT_TYPE_LABELS: Record<AdminContentType, string> = {
  business: 'Business',
  news: 'News Article',
  event: 'Event',
  deal: 'Deal',
  review: 'Review',
  forum_thread: 'Forum Thread',
  forum_reply: 'Forum Reply',
  consultancy: 'Consultancy',
  job: 'Job Listing',
};

/** Human-readable labels for moderation actions */
export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  flag: 'Flag',
  unflag: 'Unflag',
  archive: 'Archive',
  restore: 'Restore',
  delete: 'Delete',
  edit: 'Edit',
};

/** Human-readable labels for moderation reasons */
export const MODERATION_REASON_LABELS: Record<ModerationReason, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate Content',
  duplicate: 'Duplicate',
  misleading: 'Misleading Information',
  offensive: 'Offensive Content',
  policy_violation: 'Policy Violation',
  fraud: 'Fraud / Scam',
  other: 'Other',
};

/** Human-readable labels for bulk operation types */
export const BULK_OPERATION_LABELS: Record<BulkOperationType, string> = {
  approve: 'Bulk Approve',
  reject: 'Bulk Reject',
  flag: 'Bulk Flag',
  delete: 'Bulk Delete',
  archive: 'Bulk Archive',
  change_status: 'Change Status',
  assign_category: 'Assign Category',
};

// ── Status Badge Colors ────────────────────────────────────────

export type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange';

const STATUS_BADGE_MAP: Record<string, BadgeVariant> = {
  // Common statuses
  approved: 'green',
  published: 'green',
  active: 'green',
  open: 'blue',
  // Pending / review
  pending: 'yellow',
  pending_review: 'yellow',
  draft: 'yellow',
  needs_revision: 'orange',
  upcoming: 'blue',
  ongoing: 'blue',
  // Negative
  rejected: 'red',
  banned: 'red',
  flagged: 'red',
  suspended: 'orange',
  // Inactive
  archived: 'gray',
  expired: 'gray',
  completed: 'gray',
  closed: 'gray',
  cancelled: 'gray',
  deactivated: 'gray',
};

/**
 * Get a badge color for a content status string.
 */
export function getStatusBadgeVariant(status: string): BadgeVariant {
  return STATUS_BADGE_MAP[status.toLowerCase()] ?? 'gray';
}

// ── Action Availability ────────────────────────────────────────

/**
 * Determine which moderation actions are available
 * based on the current status of the content item.
 */
export function getAvailableActions(item: ModerationQueueItem): ModerationAction[] {
  const status = item.current_status.toLowerCase();
  const actions: ModerationAction[] = [];

  if (status === 'pending' || status === 'pending_review' || status === 'draft') {
    actions.push('approve', 'reject', 'flag', 'edit');
  } else if (status === 'approved' || status === 'published' || status === 'active') {
    actions.push('flag', 'archive', 'delete', 'edit');
  } else if (status === 'flagged') {
    actions.push('approve', 'reject', 'unflag', 'archive', 'delete');
  } else if (status === 'rejected') {
    actions.push('approve', 'restore', 'delete');
  } else if (status === 'archived') {
    actions.push('restore', 'delete');
  }

  return actions;
}

/**
 * Check whether a moderation action requires a reason.
 */
export function actionRequiresReason(action: ModerationAction): boolean {
  return action === 'reject' || action === 'flag';
}

/**
 * Check whether a moderation action is destructive (should show confirmation).
 */
export function isDestructiveAction(action: ModerationAction): boolean {
  return action === 'delete' || action === 'reject';
}

// ── Queue Summary ──────────────────────────────────────────────

/**
 * Format moderation stats into a summary string.
 */
export function formatModerationSummary(stats: ModerationStats): string {
  const parts: string[] = [];
  if (stats.pending_items > 0) parts.push(`${stats.pending_items} pending`);
  if (stats.flagged_items > 0) parts.push(`${stats.flagged_items} flagged`);
  if (stats.approved_today > 0) parts.push(`${stats.approved_today} approved today`);
  if (stats.rejected_today > 0) parts.push(`${stats.rejected_today} rejected today`);
  return parts.length > 0 ? parts.join(' · ') : 'No pending items';
}

/**
 * Get total pending count across all content types.
 */
export function getTotalPending(stats: ModerationStats): number {
  return Object.values(stats.by_content_type).reduce(
    (sum: number, ct: { pending: number; flagged: number; approved: number; rejected: number }) => sum + ct.pending,
    0,
  );
}

/**
 * Get total flagged count across all content types.
 */
export function getTotalFlagged(stats: ModerationStats): number {
  return Object.values(stats.by_content_type).reduce(
    (sum: number, ct: { pending: number; flagged: number; approved: number; rejected: number }) => sum + ct.flagged,
    0,
  );
}

// ── Priority Helpers ───────────────────────────────────────────

export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Sort items by priority (urgent first).
 */
export function sortByPriority<T extends { priority: PriorityLevel }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
}

/**
 * Get badge variant for priority level.
 */
export function getPriorityBadgeVariant(priority: PriorityLevel): BadgeVariant {
  switch (priority) {
    case 'urgent': return 'red';
    case 'high': return 'orange';
    case 'normal': return 'blue';
    case 'low': return 'gray';
  }
}

// ── Time Formatting ────────────────────────────────────────────

/**
 * Format a date string as a relative time (e.g. "2h ago", "3d ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;

  if (diffMs < 0) return 'just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
