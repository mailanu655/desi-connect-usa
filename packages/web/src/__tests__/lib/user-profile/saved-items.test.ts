/**
 * Tests for Saved Items Management Utilities
 */

import {
  groupSavedItemsByType,
  getSavedItemCount,
  isSaved,
  sortSavedItems,
  formatSavedDate,
} from '@/lib/user-profile';
import type { SavedItem } from '@desi-connect-usa/shared';

describe('Saved Items Utilities', () => {
  // groupSavedItemsByType tests
  describe('groupSavedItemsByType', () => {
    it('should return empty object for empty array', () => {
      expect(groupSavedItemsByType([])).toEqual({});
    });

    it('should group items by single type', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'business',
          item_title: 'Business 2',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      const grouped = groupSavedItemsByType(items);
      expect(grouped.business).toHaveLength(2);
      expect(grouped.business[0].item_id).toBe('item1');
      expect(grouped.business[1].item_id).toBe('item2');
    });

    it('should group items by multiple types', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '3',
          item_id: 'item3',
          item_type: 'event',
          item_title: 'Event 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      const grouped = groupSavedItemsByType(items);
      expect(Object.keys(grouped)).toHaveLength(3);
      expect(grouped.business).toHaveLength(1);
      expect(grouped.deal).toHaveLength(1);
      expect(grouped.event).toHaveLength(1);
    });

    it('should handle duplicate types in order', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '3',
          item_id: 'item3',
          item_type: 'business',
          item_title: 'Business 2',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      const grouped = groupSavedItemsByType(items);
      expect(grouped.business).toHaveLength(2);
      expect(grouped.business[0].item_id).toBe('item1');
      expect(grouped.business[1].item_id).toBe('item3');
    });
  });

  // getSavedItemCount tests
  describe('getSavedItemCount', () => {
    it('should return 0 for empty array', () => {
      expect(getSavedItemCount([])).toBe(0);
    });

    it('should return total count when no type filter', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      expect(getSavedItemCount(items)).toBe(2);
    });

    it('should return count filtered by type', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'business',
          item_title: 'Business 2',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '3',
          item_id: 'item3',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      expect(getSavedItemCount(items, 'business')).toBe(2);
      expect(getSavedItemCount(items, 'deal')).toBe(1);
    });

    it('should return 0 for non-existent type', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      expect(getSavedItemCount(items, 'event')).toBe(0);
    });
  });

  // isSaved tests
  describe('isSaved', () => {
    it('should return false for empty array', () => {
      expect(isSaved([], 'item1')).toBe(false);
    });

    it('should return true when item is in list', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      expect(isSaved(items, 'item1')).toBe(true);
    });

    it('should return false when item is not in list', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      expect(isSaved(items, 'item2')).toBe(false);
    });

    it('should handle multiple items correctly', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: new Date().toISOString(),
        },
      ];

      expect(isSaved(items, 'item1')).toBe(true);
      expect(isSaved(items, 'item2')).toBe(true);
      expect(isSaved(items, 'item3')).toBe(false);
    });
  });

  // sortSavedItems tests
  describe('sortSavedItems', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    it('should sort by date in descending order (newest first)', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: oneHourAgo.toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
        {
          saved_id: '3',
          item_id: 'item3',
          item_type: 'event',
          item_title: 'Event 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: oneDayAgo.toISOString(),
        },
      ];

      const sorted = sortSavedItems(items, 'date');
      expect(sorted[0].item_id).toBe('item2');
      expect(sorted[1].item_id).toBe('item1');
      expect(sorted[2].item_id).toBe('item3');
    });

    it('should sort by type alphabetically', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'event',
          item_title: 'Event 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
        {
          saved_id: '3',
          item_id: 'item3',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
      ];

      const sorted = sortSavedItems(items, 'type');
      expect(sorted[0].item_type).toBe('business');
      expect(sorted[1].item_type).toBe('deal');
      expect(sorted[2].item_type).toBe('event');
    });

    it('should sort by title alphabetically', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Zebra Business',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'business',
          item_title: 'Apple Business',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
      ];

      const sorted = sortSavedItems(items, 'title');
      expect(sorted[0].item_title).toBe('Apple Business');
      expect(sorted[1].item_title).toBe('Zebra Business');
    });

    it('should default to date sorting without sortBy parameter', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: oneHourAgo.toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
      ];

      const sorted = sortSavedItems(items);
      expect(sorted[0].item_id).toBe('item2');
      expect(sorted[1].item_id).toBe('item1');
    });

    it('should not modify original array', () => {
      const items: SavedItem[] = [
        {
          saved_id: '1',
          item_id: 'item1',
          item_type: 'business',
          item_title: 'Business 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: now.toISOString(),
        },
        {
          saved_id: '2',
          item_id: 'item2',
          item_type: 'deal',
          item_title: 'Deal 1',
          item_subtitle: null,
          item_image_url: null,
          saved_at: oneHourAgo.toISOString(),
        },
      ];

      const originalFirstId = items[0].item_id;
      sortSavedItems(items, 'type');
      expect(items[0].item_id).toBe(originalFirstId);
    });
  });

  // formatSavedDate tests
  describe('formatSavedDate', () => {
    it('should return "Unknown" for empty string', () => {
      expect(formatSavedDate('')).toBe('Unknown');
    });

    it('should return "Just now" for dates within 60 seconds', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(formatSavedDate(recentDate.toISOString())).toBe('Just now');
    });

    it('should return minutes ago for dates within an hour', () => {
      const now = new Date();
      const minutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const result = formatSavedDate(minutesAgo.toISOString());
      expect(result).toMatch(/30 minutes ago/);
    });

    it('should return hours ago for dates within a day', () => {
      const now = new Date();
      const hoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
      const result = formatSavedDate(hoursAgo.toISOString());
      expect(result).toMatch(/5 hours ago/);
    });

    it('should return days ago for dates within a week', () => {
      const now = new Date();
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const result = formatSavedDate(daysAgo.toISOString());
      expect(result).toMatch(/3 days ago/);
    });

    it('should return weeks ago for dates within a month', () => {
      const now = new Date();
      const weeksAgo = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000); // 2 weeks ago
      const result = formatSavedDate(weeksAgo.toISOString());
      expect(result).toMatch(/2 weeks ago/);
    });

    it('should return formatted date for older dates', () => {
      const dateStr = '2024-01-15T10:30:00Z';
      const result = formatSavedDate(dateStr);
      expect(result).toMatch(/Jan 15/);
    });

    it('should return "Unknown" for invalid date string', () => {
      expect(formatSavedDate('invalid-date')).toBe('Unknown');
    });

    it('should include year in date format when it differs from current year', () => {
      const dateStr = '2023-01-15T10:30:00Z';
      const result = formatSavedDate(dateStr);
      expect(result).toMatch(/2023/);
    });
  });
});
