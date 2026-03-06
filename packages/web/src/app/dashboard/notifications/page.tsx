'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  getDefaultNotificationPreferences,
  toggleChannel,
  formatFrequencyLabel,
} from '@/lib/user-profile';
import type { NotificationPreference } from '@desi-connect/shared';

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const data = await apiClient.getNotificationPreferences();
        setPreferences(data.preferences || getDefaultNotificationPreferences());
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setPreferences(getDefaultNotificationPreferences());
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const handleToggleEnabled = (index: number) => {
    setPreferences((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        enabled: !updated[index].enabled,
      };
      return updated;
    });
  };

  const handleToggleChannel = (index: number, channel: 'email' | 'whatsapp' | 'push' | 'in_app') => {
    setPreferences((prev) => {
      const updated = [...prev];
      updated[index] = toggleChannel(updated[index], channel);
      return updated;
    });
  };

  const handleFrequencyChange = (index: number, frequency: string) => {
    setPreferences((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        frequency: frequency as 'immediate' | 'daily' | 'weekly' | 'never',
      };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.updateNotificationPreferences(preferences);
      setSuccess('Notification preferences updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" />
        <p className="mt-2 text-gray-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-2 text-gray-600">
          Choose what updates you want to receive and how you want to receive them
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700">
          {success}
        </div>
      )}

      {/* Preferences List */}
      <div className="space-y-6">
        {preferences.map((pref, index) => (
          <div key={pref.type} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{pref.label}</h3>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={() => handleToggleEnabled(index)}
                        className="sr-only"
                      />
                      <div
                        className={`block w-10 h-6 rounded-full transition-colors ${
                          pref.enabled ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      />
                      <div
                        className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          pref.enabled ? 'translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-1">{pref.description}</p>
              </div>
            </div>

            {pref.enabled && (
              <div className="space-y-4 border-t pt-4">
                {/* Frequency */}
                <div>
                  <label htmlFor={`freq-${pref.type}`} className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    id={`freq-${pref.type}`}
                    value={pref.frequency}
                    onChange={(e) => handleFrequencyChange(index, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  >
                    <option value="immediate">Immediately</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                {/* Channels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How to notify me
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['email', 'whatsapp', 'push', 'in_app'] as const).map((channel) => (
                      <label key={channel} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.channels.includes(channel)}
                          onChange={() => handleToggleChannel(index, channel)}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {channel === 'in_app' ? 'In-App' : channel.charAt(0).toUpperCase() + channel.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
