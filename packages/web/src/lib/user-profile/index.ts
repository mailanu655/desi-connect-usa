/**
 * User Profile Utility Library
 * Provides helpers for managing user profiles, display names, and completion tracking
 */

import type { User } from '@desi-connect/shared';

/**
 * Formats the user's display name, falling back to "Anonymous User" if not provided
 */
export function formatUserDisplayName(user: User | null | undefined): string {
  if (!user || !user.display_name) {
    return 'Anonymous User';
  }
  return user.display_name;
}

/**
 * Calculates profile completion percentage based on filled fields
 * Checks: display_name, email, phone_number, city, state, preferred_channel, identity_linked
 */
export function getProfileCompletionPercentage(user: User | null | undefined): number {
  if (!user) return 0;

  const fields = [
    user.display_name,
    user.email,
    user.phone_number,
    user.city,
    user.preferred_channel,
  ];

  const filledFields = fields.filter((field) => field != null && field !== '').length;
  const totalFields = fields.length;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Gets user initials from their display name for avatar
 */
export function getUserInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Checks if user profile is complete (all major fields filled)
 */
export function isProfileComplete(user: User | null | undefined): boolean {
  if (!user) return false;

  return !!(
    user.display_name &&
    user.email &&
    user.phone_number &&
    user.city &&
    user.preferred_channel &&
    user.identity_linked
  );
}

/**
 * Formats ISO date string to human-readable format
 */
export function formatJoinDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

// Re-export sub-module functions
export * from './saved-items';
export * from './notifications';
export * from './analytics';
