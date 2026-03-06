/**
 * Tests for Notification Preferences Utilities
 */

import {
  getDefaultNotificationPreferences,
  isChannelEnabled,
  toggleChannel,
  getEnabledPreferencesCount,
  formatFrequencyLabel,
} from '@/lib/user-profile';
import type { NotificationPreference } from '@desi-connect/shared';

describe('Notification Preferences Utilities', () => {
  // getDefaultNotificationPreferences tests
  describe('getDefaultNotificationPreferences', () => {
    it('should return array of 6 preferences', () => {
      const prefs = getDefaultNotificationPreferences();
      expect(prefs).toHaveLength(6);
    });

    it('should return preferences with correct structure', () => {
      const prefs = getDefaultNotificationPreferences();
      prefs.forEach((pref) => {
        expect(pref).toHaveProperty('type');
        expect(pref).toHaveProperty('label');
        expect(pref).toHaveProperty('description');
        expect(pref).toHaveProperty('enabled');
        expect(pref).toHaveProperty('frequency');
        expect(pref).toHaveProperty('channels');
      });
    });

    it('should include new_deals preference', () => {
      const prefs = getDefaultNotificationPreferences();
      const newDeals = prefs.find((p) => p.type === 'new_deals');
      expect(newDeals).toBeDefined();
      expect(newDeals?.label).toBe('New Deals');
      expect(newDeals?.enabled).toBe(true);
    });

    it('should include new_events preference', () => {
      const prefs = getDefaultNotificationPreferences();
      const newEvents = prefs.find((p) => p.type === 'new_events');
      expect(newEvents).toBeDefined();
      expect(newEvents?.label).toBe('New Events');
      expect(newEvents?.enabled).toBe(true);
    });

    it('should include immigration_alerts preference', () => {
      const prefs = getDefaultNotificationPreferences();
      const immigrationAlerts = prefs.find((p) => p.type === 'immigration_alerts');
      expect(immigrationAlerts).toBeDefined();
      expect(immigrationAlerts?.label).toBe('Immigration Alerts');
      expect(immigrationAlerts?.enabled).toBe(true);
      expect(immigrationAlerts?.frequency).toBe('weekly');
    });

    it('should include daily_digest preference with enabled false', () => {
      const prefs = getDefaultNotificationPreferences();
      const dailyDigest = prefs.find((p) => p.type === 'daily_digest');
      expect(dailyDigest).toBeDefined();
      expect(dailyDigest?.label).toBe('Daily Digest');
      expect(dailyDigest?.enabled).toBe(false);
    });

    it('should include community_updates preference', () => {
      const prefs = getDefaultNotificationPreferences();
      const communityUpdates = prefs.find((p) => p.type === 'community_updates');
      expect(communityUpdates).toBeDefined();
      expect(communityUpdates?.enabled).toBe(true);
    });

    it('should include job_alerts preference', () => {
      const prefs = getDefaultNotificationPreferences();
      const jobAlerts = prefs.find((p) => p.type === 'job_alerts');
      expect(jobAlerts).toBeDefined();
      expect(jobAlerts?.label).toBe('Job Alerts');
      expect(jobAlerts?.enabled).toBe(true);
    });

    it('should have email channel in all preferences', () => {
      const prefs = getDefaultNotificationPreferences();
      prefs.forEach((pref) => {
        expect(pref.channels).toContain('email');
      });
    });
  });

  // isChannelEnabled tests
  describe('isChannelEnabled', () => {
    const pref: NotificationPreference = {
      type: 'new_deals',
      label: 'New Deals',
      description: 'Get notified about deals',
      enabled: true,
      frequency: 'daily',
      channels: ['email', 'in_app'],
    };

    it('should return true for enabled channel', () => {
      expect(isChannelEnabled(pref, 'email')).toBe(true);
      expect(isChannelEnabled(pref, 'in_app')).toBe(true);
    });

    it('should return false for disabled channel', () => {
      expect(isChannelEnabled(pref, 'whatsapp')).toBe(false);
    });

    it('should handle preference with single channel', () => {
      const singleChannelPref: NotificationPreference = {
        type: 'new_deals',
        label: 'New Deals',
        description: 'Get notified about deals',
        enabled: true,
        frequency: 'daily',
        channels: ['email'],
      };

      expect(isChannelEnabled(singleChannelPref, 'email')).toBe(true);
      expect(isChannelEnabled(singleChannelPref, 'whatsapp')).toBe(false);
    });

    it('should handle empty channels array', () => {
      const emptyChannelsPref: NotificationPreference = {
        type: 'new_deals',
        label: 'New Deals',
        description: 'Get notified about deals',
        enabled: true,
        frequency: 'daily',
        channels: [],
      };

      expect(isChannelEnabled(emptyChannelsPref, 'email')).toBe(false);
    });
  });

  // toggleChannel tests
  describe('toggleChannel', () => {
    const pref: NotificationPreference = {
      type: 'new_deals',
      label: 'New Deals',
      description: 'Get notified about deals',
      enabled: true,
      frequency: 'daily',
      channels: ['email'],
    };

    it('should add channel when not present', () => {
      const updated = toggleChannel(pref, 'whatsapp');
      expect(updated.channels).toContain('email');
      expect(updated.channels).toContain('whatsapp');
      expect(updated.channels).toHaveLength(2);
    });

    it('should remove channel when present', () => {
      const updated = toggleChannel(pref, 'email');
      expect(updated.channels).not.toContain('email');
      expect(updated.channels).toHaveLength(0);
    });

    it('should preserve other properties', () => {
      const updated = toggleChannel(pref, 'whatsapp');
      expect(updated.type).toBe(pref.type);
      expect(updated.label).toBe(pref.label);
      expect(updated.enabled).toBe(pref.enabled);
      expect(updated.frequency).toBe(pref.frequency);
    });

    it('should not modify original preference', () => {
      const original = { ...pref };
      toggleChannel(pref, 'whatsapp');
      expect(pref).toEqual(original);
    });

    it('should handle toggling multiple times', () => {
      let updated = { ...pref };
      updated = toggleChannel(updated, 'whatsapp');
      expect(updated.channels).toContain('whatsapp');

      updated = toggleChannel(updated, 'whatsapp');
      expect(updated.channels).not.toContain('whatsapp');
    });

    it('should handle preference with multiple channels', () => {
      const multiChannelPref: NotificationPreference = {
        type: 'new_deals',
        label: 'New Deals',
        description: 'Get notified about deals',
        enabled: true,
        frequency: 'daily',
        channels: ['email', 'whatsapp', 'in_app'],
      };

      const updated = toggleChannel(multiChannelPref, 'whatsapp');
      expect(updated.channels).toContain('email');
      expect(updated.channels).toContain('in_app');
      expect(updated.channels).not.toContain('whatsapp');
    });
  });

  // getEnabledPreferencesCount tests
  describe('getEnabledPreferencesCount', () => {
    it('should return 0 for empty array', () => {
      expect(getEnabledPreferencesCount([])).toBe(0);
    });

    it('should return 0 when all preferences are disabled', () => {
      const prefs: NotificationPreference[] = [
        {
          type: 'new_deals',
          label: 'New Deals',
          description: 'Get notified about deals',
          enabled: false,
          frequency: 'daily',
          channels: ['email'],
        },
        {
          type: 'new_events',
          label: 'New Events',
          description: 'Get notified about events',
          enabled: false,
          frequency: 'daily',
          channels: ['email'],
        },
      ];

      expect(getEnabledPreferencesCount(prefs)).toBe(0);
    });

    it('should return count of enabled preferences', () => {
      const prefs: NotificationPreference[] = [
        {
          type: 'new_deals',
          label: 'New Deals',
          description: 'Get notified about deals',
          enabled: true,
          frequency: 'daily',
          channels: ['email'],
        },
        {
          type: 'new_events',
          label: 'New Events',
          description: 'Get notified about events',
          enabled: false,
          frequency: 'daily',
          channels: ['email'],
        },
        {
          type: 'job_alerts',
          label: 'Job Alerts',
          description: 'Get notified about jobs',
          enabled: true,
          frequency: 'daily',
          channels: ['email'],
        },
      ];

      expect(getEnabledPreferencesCount(prefs)).toBe(2);
    });

    it('should return total count when all are enabled', () => {
      const prefs: NotificationPreference[] = [
        {
          type: 'new_deals',
          label: 'New Deals',
          description: 'Get notified about deals',
          enabled: true,
          frequency: 'daily',
          channels: ['email'],
        },
        {
          type: 'new_events',
          label: 'New Events',
          description: 'Get notified about events',
          enabled: true,
          frequency: 'daily',
          channels: ['email'],
        },
      ];

      expect(getEnabledPreferencesCount(prefs)).toBe(2);
    });
  });

  // formatFrequencyLabel tests
  describe('formatFrequencyLabel', () => {
    it('should format immediate frequency', () => {
      expect(formatFrequencyLabel('immediate')).toBe('Immediately');
    });

    it('should format daily frequency', () => {
      expect(formatFrequencyLabel('daily')).toBe('Daily');
    });

    it('should format weekly frequency', () => {
      expect(formatFrequencyLabel('weekly')).toBe('Weekly');
    });

    it('should format never frequency', () => {
      expect(formatFrequencyLabel('never')).toBe('Never');
    });

    it('should return frequency as-is if not found in labels', () => {
      expect(formatFrequencyLabel('monthly' as any)).toBe('monthly');
    });

    it('should have correct label capitalization', () => {
      const labels = {
        immediate: 'Immediately',
        daily: 'Daily',
        weekly: 'Weekly',
        never: 'Never',
      };

      Object.entries(labels).forEach(([freq, label]) => {
        expect(formatFrequencyLabel(freq as any)).toBe(label);
      });
    });
  });
});
