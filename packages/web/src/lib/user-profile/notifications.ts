/**
 * Notification Preferences Utilities
 * Handles notification settings and frequency management
 */

import type { NotificationPreference, NotificationChannel, NotificationFrequency } from '@desi-connect/shared';

/**
 * Returns default notification preferences for a new user
 */
export function getDefaultNotificationPreferences(): NotificationPreference[] {
  return [
    {
      type: 'new_deals',
      label: 'New Deals',
      description: 'Get notified about new deals and discounts',
      enabled: true,
      frequency: 'daily',
      channels: ['email', 'in_app'],
    },
    {
      type: 'new_events',
      label: 'New Events',
      description: 'Get notified about upcoming community events',
      enabled: true,
      frequency: 'daily',
      channels: ['email', 'in_app'],
    },
    {
      type: 'immigration_alerts',
      label: 'Immigration Alerts',
      description: 'Get important immigration news and policy updates',
      enabled: true,
      frequency: 'weekly',
      channels: ['email', 'whatsapp'],
    },
    {
      type: 'daily_digest',
      label: 'Daily Digest',
      description: 'Receive a daily summary of community activity',
      enabled: false,
      frequency: 'daily',
      channels: ['email'],
    },
    {
      type: 'community_updates',
      label: 'Community Updates',
      description: 'Get updates from community forums and discussions',
      enabled: true,
      frequency: 'weekly',
      channels: ['email', 'in_app'],
    },
    {
      type: 'job_alerts',
      label: 'Job Alerts',
      description: 'Get notified about new job postings',
      enabled: true,
      frequency: 'daily',
      channels: ['email', 'in_app'],
    },
  ];
}

/**
 * Checks if a notification channel is enabled for a preference
 */
export function isChannelEnabled(
  pref: NotificationPreference,
  channel: NotificationChannel
): boolean {
  return pref.channels.includes(channel);
}

/**
 * Toggles a notification channel for a preference (add or remove)
 */
export function toggleChannel(
  pref: NotificationPreference,
  channel: NotificationChannel
): NotificationPreference {
  const channels = pref.channels.includes(channel)
    ? pref.channels.filter((c) => c !== channel)
    : [...pref.channels, channel];

  return {
    ...pref,
    channels,
  };
}

/**
 * Counts how many notification preferences are enabled
 */
export function getEnabledPreferencesCount(prefs: NotificationPreference[]): number {
  return prefs.filter((pref) => pref.enabled).length;
}

/**
 * Formats frequency label to human-readable text
 */
export function formatFrequencyLabel(freq: NotificationFrequency): string {
  const labels: Record<NotificationFrequency, string> = {
    immediate: 'Immediately',
    daily: 'Daily',
    weekly: 'Weekly',
    never: 'Never',
  };

  return labels[freq] || freq;
}
