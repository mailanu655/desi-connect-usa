'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatUserDisplayName, formatJoinDate } from '@/lib/user-profile';
import type { UserProfileData, UserSubmission, SavedItem } from '@/lib/api-client';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [userData, submissionsData, savedData] = await Promise.all([
          apiClient.getUserProfile(),
          apiClient.getUserSubmissions({ limit: 5 }),
          apiClient.getSavedItems({ limit: 10 }),
        ]);

        setUser(userData);
        setSubmissions(submissionsData.data || []);
        setSavedItems(savedData.data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" />
        <p className="mt-2 text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const displayName = formatUserDisplayName(user);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
        <p className="mt-2 text-orange-100">
          {user?.created_at
            ? `Member since ${formatJoinDate(user.created_at)}`
            : 'We\'re excited to have you here'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{submissions.length}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Saved Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{savedItems.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Notifications Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">6</p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
          <Link href="/dashboard/submissions" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            View all
          </Link>
        </div>

        {submissions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div key={submission.submission_id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium text-gray-900">{submission.title}</p>
                  <p className="text-sm text-gray-500">
                    {submission.content_type} • {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : submission.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : submission.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/businesses"
          className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition-shadow"
        >
          <div className="bg-orange-100 rounded-full p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Submit Business</h3>
        </Link>

        <Link
          href="/deals"
          className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition-shadow"
        >
          <div className="bg-blue-100 rounded-full p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Find Deals</h3>
          </Link>

        <Link
          href="/events"
          className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition-shadow"
        >
          <div className="bg-green-100 rounded-full p-4 w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Browse Events</h3>
        </Link>
      </div>
    </div>
  );
}
