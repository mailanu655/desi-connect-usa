/**
 * Saved Items Management Utilities
 * Handles grouping, filtering, and sorting of saved items
 */

import type { SavedItem, ContentType } from '@desi-connect-usa/shared';

/**
 * Groups saved items by their type
 */
export function groupSavedItemsByType(
  items: SavedItem[]
): Record<ContentType, SavedItem[]> {
  const grouped: Record<string, SavedItem[]> = {};

  items.forEach((item) => {
    if (!grouped[item.item_type]) {
      grouped[item.item_type] = [];
    }
    grouped[item.item_type].push(item);
  });

  return grouped as Record<ContentType, SavedItem[]>;
}

/**
 * Gets count of saved items, optionally filtered by type
 */
export function getSavedItemCount(items: SavedItem[], type?: ContentType): number {
  if (!type) return items.length;
  return items.filter((item) => item.item_type === type).length;
}

/**
 * Checks if a specific item is saved
 */
export function isSaved(items: SavedItem[], itemId: string): boolean {
  return items.some((item) => item.item_id === itemId);
}

/**
 * Sorts saved items by date, type, or title
 */
export function sortSavedItems(
  items: SavedItem[],
  sortBy: 'date' | 'type' | 'title' = 'date'
): SavedItem[] {
  const sorted = [...items];

  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => {
        return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
      });

    case 'type':
      return sorted.sort((a, b) => {
        return a.item_type.localeCompare(b.item_type);
      });

    case 'title':
      return sorted.sort((a, b) => {
        return a.item_title.localeCompare(b.item_title);
      });

    default:
      return sorted;
  }
}

/**
 * Formats saved date to relative time (e.g., "2 hours ago")
 */
export function formatSavedDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Unknown';
  }
}
