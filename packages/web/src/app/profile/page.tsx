/**
 * User Profile Dashboard
 * Displays user info with tabs for submissions, saved items, and notifications
 */

'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

type ProfileTab = 'overview' | 'submissions' | 'saved' | 'notifications';

interface Submission {
  submission_id: string;
  content_type: string;
  content_id: string;
  title: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  rejection_reason?: string;
}

interface SavedItem {
  saved_id: string;
  item_type: string;
  item_id: string;
  item_title: string;
  item_subtitle?: string;
  item_image_url?: string;
  saved_at: string;
}

interface NotificationPref {
  type: string;
  label: string;
  description: string;
  enabled: boolean;
  frequency: string;
  channels: string[];
}

const TABS: { key: ProfileTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '👤' },
  { key: 'submissions', label: 'My Submissions', icon: '📝' },
  { key: 'saved', label: 'Saved Items', icon: '❤️' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  business: 'Business',
  event: 'Event',
  deal: 'Deal',
  job: 'Job',
  news: 'News',
  review: 'Review',
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPref[] = [
  { type: 'immigration_updates', label: 'Immigration Updates', description: 'Get alerts on visa bulletins, USCIS updates, and policy changes', enabled: true, frequency: 'daily', channels: ['email'] },
  { type: 'job_alerts', label: 'Job Alerts', description: 'New job postings matching your preferences', enabled: true, frequency: 'immediate', channels: ['email'] },
  { type: 'deal_alerts', label: 'Deal Alerts', description: 'New deals and discounts from Indian businesses in your area', enabled: false, frequency: 'weekly', channels: ['email'] },
  { type: 'event_reminders', label: 'Event Reminders', description: 'Reminders for events you have RSVPed to', enabled: true, frequency: 'immediate', channels: ['email'] },
  { type: 'community_digest', label: 'Community Digest', description: 'Weekly roundup of community news and activities', enabled: true, frequency: 'weekly', channels: ['email'] },
  { type: 'marketing', label: 'Marketing & Promotions', description: 'Special offers and announcements from Desi Connect USA', enabled: false, frequency: 'weekly', channels: ['email'] },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPref[]>(DEFAULT_NOTIFICATION_PREFS);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState<string>('all');
  const [savedFilter, setSavedFilter] = useState<string>('all');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Fetch data when tab changes
  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'submissions') {
          const params: Record<string, string> = {};
          if (submissionFilter !== 'all') params.content_type = submissionFilter;
          const res = await fetch(`/api/users/submissions?${new URLSearchParams(params)}`);
          if (res.ok) {
            const data = await res.json();
            setSubmissions(data.data || []);
          }
        } else if (activeTab === 'saved') {
          const params: Record<string, string> = {};
          if (savedFilter !== 'all') params.item_type = savedFilter;
          const res = await fetch(`/api/users/saved?${new URLSearchParams(params)}`);
          if (res.ok) {
            const data = await res.json();
            setSavedItems(data.data || []);
          }
        } else if (activeTab === 'notifications') {
          const res = await fetch('/api/users/notifications');
          if (res.ok) {
            const data = await res.json();
            if (data.preferences?.length > 0) {
              setNotificationPrefs(data.preferences);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tab data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab !== 'overview') {
      fetchTabData();
    }
  }, [activeTab, submissionFilter, savedFilter]);

  const handleRemoveSaved = async (savedId: string) => {
    try {
      const res = await fetch(`/api/users/saved/${savedId}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedItems((prev) => prev.filter((item) => item.saved_id !== savedId));
      }
    } catch (error) {
      console.error('Failed to remove saved item:', error);
    }
  };

  const handleToggleNotification = async (type: string) => {
    const updated = notificationPrefs.map((pref) =>
      pref.type === type ? { ...pref, enabled: !pref.enabled } : pref
    );
    setNotificationPrefs(updated);

    try {
      const res = await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updated }),
      });
      if (res.ok) {
        setSaveMessage('Preferences saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  const handleFrequencyChange = async (type: string, frequency: string) => {
    const updated = notificationPrefs.map((pref) =>
      pref.type === type ? { ...pref, frequency } : pref
    );
    setNotificationPrefs(updated);

    try {
      await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updated }),
      });
    } catch (error) {
      console.error('Failed to update frequency:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMemberSince = () => {
    if (!user?.created_at) return 'N/A';
    return new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.display_name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                    {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {user?.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user?.display_name || 'User'}</h1>
                <p className="text-orange-100 mt-1">
                  {user?.email || user?.phone_number || 'No contact info'}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-orange-100">
                  {user?.city && (
                    <span className="flex items-center gap-1">
                      {user.city}{user.state ? `, ${user.state}` : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    Member since {getMemberSince()}
                  </span>
                  {user?.identity_linked && (
                    <span className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded-full text-xs font-medium">
                      WhatsApp Linked
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors text-sm"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-0 overflow-x-auto" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Display Name</dt>
                    <dd className="text-sm font-medium text-gray-900">{user?.display_name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="text-sm font-medium text-gray-900">{user?.email || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Phone</dt>
                    <dd className="text-sm font-medium text-gray-900">{user?.phone_number || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Location</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {user?.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Preferred Channel</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize">{user?.preferred_channel || 'web'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Auth Provider</dt>
                    <dd className="text-sm font-medium text-gray-900 capitalize">{user?.auth_provider?.replace('_', ' ') || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
                <div className="space-y-4">
                  <button onClick={() => setActiveTab('submissions')} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors w-full text-left">
                    <span className="text-sm font-medium text-gray-900">My Submissions</span>
                    <span className="text-orange-600 text-sm font-semibold">View</span>
                  </button>
                  <button onClick={() => setActiveTab('saved')} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors w-full text-left">
                    <span className="text-sm font-medium text-gray-900">Saved Items</span>
                    <span className="text-orange-600 text-sm font-semibold">View</span>
                  </button>
                  <button onClick={() => setActiveTab('notifications')} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors w-full text-left">
                    <span className="text-sm font-medium text-gray-900">Notification Settings</span>
                    <span className="text-orange-600 text-sm font-semibold">View</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/businesses/submit" className="block w-full text-left p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">Submit a Business</p>
                    <p className="text-xs text-gray-500 mt-1">List your business in our directory</p>
                  </Link>
                  <Link href="/events/submit" className="block w-full text-left p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">Submit an Event</p>
                    <p className="text-xs text-gray-500 mt-1">Share upcoming community events</p>
                  </Link>
                  <Link href="/deals/submit" className="block w-full text-left p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">Submit a Deal</p>
                    <p className="text-xs text-gray-500 mt-1">Share special offers and discounts</p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div>
              {/* Filter Bar */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">My Submissions</h2>
                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Filter submissions by type"
                >
                  <option value="all">All Types</option>
                  <option value="business">Businesses</option>
                  <option value="event">Events</option>
                  <option value="deal">Deals</option>
                  <option value="job">Jobs</option>
                  <option value="review">Reviews</option>
                </select>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-500 mt-3 text-sm">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500 text-lg">No submissions yet</p>
                  <p className="text-gray-400 mt-2 text-sm">Start by submitting a business, event, or deal</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div key={sub.submission_id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-800'}`}>
                            {sub.status}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {CONTENT_TYPE_LABELS[sub.content_type] || sub.content_type}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mt-2">{sub.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted {formatDate(sub.submitted_at)}
                          {sub.rejection_reason && (
                            <span className="text-red-600 ml-2">— {sub.rejection_reason}</span>
                          )}
                        </p>
                      </div>
                      <Link
                        href={`/${sub.content_type}s/${sub.content_id}`}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium ml-4"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Items Tab */}
          {activeTab === 'saved' && (
            <div>
              {/* Filter Bar */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Saved Items</h2>
                <select
                  value={savedFilter}
                  onChange={(e) => setSavedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Filter saved items by type"
                >
                  <option value="all">All Types</option>
                  <option value="business">Businesses</option>
                  <option value="event">Events</option>
                  <option value="deal">Deals</option>
                  <option value="job">Jobs</option>
                </select>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-500 mt-3 text-sm">Loading saved items...</p>
                </div>
              ) : savedItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500 text-lg">No saved items</p>
                  <p className="text-gray-400 mt-2 text-sm">Browse businesses, events, and deals to save your favorites</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedItems.map((item) => (
                    <div key={item.saved_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {item.item_image_url && (
                        <div className="relative h-32">
                          <Image src={item.item_image_url} alt={item.item_title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {CONTENT_TYPE_LABELS[item.item_type] || item.item_type}
                        </span>
                        <h3 className="font-medium text-gray-900 mt-2">{item.item_title}</h3>
                        {item.item_subtitle && (
                          <p className="text-sm text-gray-500 mt-1">{item.item_subtitle}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-gray-400">Saved {formatDate(item.saved_at)}</p>
                          <button
                            onClick={() => handleRemoveSaved(item.saved_id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                            aria-label={`Remove ${item.item_title} from saved`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                {saveMessage && (
                  <span className="text-sm text-green-600 font-medium">{saveMessage}</span>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-500 mt-3 text-sm">Loading preferences...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notificationPrefs.map((pref) => (
                    <div key={pref.type} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{pref.label}</h3>
                          <p className="text-sm text-gray-500 mt-1">{pref.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4" aria-label={`Toggle ${pref.label}`}>
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={pref.enabled}
                            onChange={() => handleToggleNotification(pref.type)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                      {pref.enabled && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <label className="text-xs text-gray-500 block mb-1">Frequency</label>
                          <select
                            value={pref.frequency}
                            onChange={(e) => handleFrequencyChange(pref.type, e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-sm"
                            aria-label={`${pref.label} frequency`}
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
