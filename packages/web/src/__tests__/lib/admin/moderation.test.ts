import {
  CONTENT_TYPE_LABELS,
  MODERATION_ACTION_LABELS,
  MODERATION_REASON_LABELS,
  BULK_OPERATION_LABELS,
  getStatusBadgeVariant,
  getAvailableActions,
  actionRequiresReason,
  isDestructiveAction,
  formatModerationSummary,
  getTotalPending,
  getTotalFlagged,
  sortByPriority,
  getPriorityBadgeVariant,
  formatRelativeTime,
} from '@/lib/admin/moderation';
import type { BadgeVariant, PriorityLevel } from '@/lib/admin/moderation';
import type { ModerationQueueItem, ModerationStats } from '@desi-connect-usa/shared';

describe('Moderation Utilities', () => {
  describe('label maps', () => {
    it('CONTENT_TYPE_LABELS contains all expected content types', () => {
      expect(CONTENT_TYPE_LABELS).toHaveProperty('business');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('news');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('event');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('deal');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('review');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('forum_thread');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('forum_reply');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('consultancy');
      expect(CONTENT_TYPE_LABELS).toHaveProperty('job');
    });

    it('MODERATION_ACTION_LABELS has human-readable labels', () => {
      expect(MODERATION_ACTION_LABELS).toHaveProperty('approve');
      expect(MODERATION_ACTION_LABELS).toHaveProperty('reject');
      expect(MODERATION_ACTION_LABELS).toHaveProperty('flag');
      expect(MODERATION_ACTION_LABELS).toHaveProperty('delete');
      expect(typeof MODERATION_ACTION_LABELS.approve).toBe('string');
    });

    it('MODERATION_REASON_LABELS has human-readable labels', () => {
      expect(MODERATION_REASON_LABELS).toHaveProperty('spam');
      expect(MODERATION_REASON_LABELS).toHaveProperty('inappropriate');
      expect(MODERATION_REASON_LABELS).toHaveProperty('misleading');
      expect(typeof MODERATION_REASON_LABELS.spam).toBe('string');
    });

    it('BULK_OPERATION_LABELS has human-readable labels', () => {
      expect(Object.keys(BULK_OPERATION_LABELS).length).toBeGreaterThan(0);
    });
  });

  describe('getStatusBadgeVariant', () => {
    it('returns green for approved/published/active statuses', () => {
      expect(getStatusBadgeVariant('approved')).toBe('green');
      expect(getStatusBadgeVariant('published')).toBe('green');
      expect(getStatusBadgeVariant('active')).toBe('green');
    });

    it('returns yellow for pending/draft statuses', () => {
      expect(getStatusBadgeVariant('pending')).toBe('yellow');
      expect(getStatusBadgeVariant('draft')).toBe('yellow');
    });

    it('returns red for rejected/flagged statuses', () => {
      expect(getStatusBadgeVariant('rejected')).toBe('red');
      expect(getStatusBadgeVariant('flagged')).toBe('red');
    });

    it('returns gray for archived/unknown statuses', () => {
      expect(getStatusBadgeVariant('archived')).toBe('gray');
      expect(getStatusBadgeVariant('unknown_status')).toBe('gray');
    });
  });

  describe('getAvailableActions', () => {
    it('returns approve and reject for pending items', () => {
      const item = { current_status: 'pending' } as ModerationQueueItem;
      const actions = getAvailableActions(item);
      expect(actions).toContain('approve');
      expect(actions).toContain('reject');
    });

    it('returns flag, archive, delete and edit for published items', () => {
      const item = { current_status: 'published' } as ModerationQueueItem;
      const actions = getAvailableActions(item);
      expect(actions).toContain('flag');
      expect(actions).toContain('archive');
      expect(actions).toContain('delete');
      expect(actions).toContain('edit');
    });

    it('returns restore and delete for archived items', () => {
      const item = { current_status: 'archived' } as ModerationQueueItem;
      const actions = getAvailableActions(item);
      expect(actions).toContain('restore');
      expect(actions).toContain('delete');
    });
  });

  describe('actionRequiresReason', () => {
    it('returns true for reject and flag', () => {
      expect(actionRequiresReason('reject')).toBe(true);
      expect(actionRequiresReason('flag')).toBe(true);
    });

    it('returns false for approve', () => {
      expect(actionRequiresReason('approve')).toBe(false);
    });
  });

  describe('isDestructiveAction', () => {
    it('returns true for delete and reject', () => {
      expect(isDestructiveAction('delete')).toBe(true);
      expect(isDestructiveAction('reject')).toBe(true);
    });

    it('returns false for approve and flag', () => {
      expect(isDestructiveAction('approve')).toBe(false);
      expect(isDestructiveAction('flag')).toBe(false);
    });
  });

  describe('moderation stats helpers', () => {
    const mockStats: ModerationStats = {
      pending_items: 15,
      flagged_items: 8,
      approved_today: 25,
      rejected_today: 5,
      avg_review_time_hours: 2.5,
      by_content_type: {
        business: { pending: 5, flagged: 3, total: 20 },
        news: { pending: 3, flagged: 2, total: 15 },
        event: { pending: 7, flagged: 3, total: 18 },
      } as ModerationStats['by_content_type'],
    };

    it('formatModerationSummary returns a non-empty string', () => {
      const summary = formatModerationSummary(mockStats);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('getTotalPending sums pending from all content types', () => {
      const total = getTotalPending(mockStats);
      expect(total).toBe(15); // 5 + 3 + 7
    });

    it('getTotalFlagged sums flagged from all content types', () => {
      const total = getTotalFlagged(mockStats);
      expect(total).toBe(8); // 3 + 2 + 3
    });
  });

  describe('priority helpers', () => {
    it('sortByPriority puts urgent first, then high, normal, low', () => {
      const items: Array<{ priority: PriorityLevel; name: string }> = [
        { priority: 'low', name: 'a' },
        { priority: 'urgent', name: 'b' },
        { priority: 'normal', name: 'c' },
        { priority: 'high', name: 'd' },
      ];
      const sorted = sortByPriority(items);
      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('high');
      expect(sorted[2].priority).toBe('normal');
      expect(sorted[3].priority).toBe('low');
    });

    it('getPriorityBadgeVariant returns correct variants', () => {
      expect(getPriorityBadgeVariant('urgent')).toBe('red');
      expect(getPriorityBadgeVariant('high')).toBe('orange');
      expect(getPriorityBadgeVariant('normal')).toBe('blue');
      expect(getPriorityBadgeVariant('low')).toBe('gray');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats recent dates as relative time', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('formats older dates', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const result = formatRelativeTime(threeDaysAgo);
      expect(typeof result).toBe('string');
    });
  });
});
