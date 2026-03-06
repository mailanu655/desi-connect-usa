'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/admin/StatsCard';

interface DashboardStats {
  total_users: number;
  active_users_today: number;
  new_users_this_week: number;
  total_businesses: number;
  pending_approvals: number;
  flagged_content: number;
  total_events: number;
  total_deals: number;
  total_news: number;
  total_forum_threads: number;
  total_reviews: number;
  moderation_queue_size: number;
  avg_response_time_hours: number;
  content_published_today: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of platform activity and key metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Total Users" value={stats?.total_users ?? 0} />
        <StatsCard label="Active Today" value={stats?.active_users_today ?? 0} />
        <StatsCard
          label="Pending Approvals"
          value={stats?.pending_approvals ?? 0}
          variant={stats?.pending_approvals ? 'warning' : 'default'}
        />
        <StatsCard
          label="Flagged Content"
          value={stats?.flagged_content ?? 0}
          variant={stats?.flagged_content ? 'danger' : 'default'}
        />
      </div>

      {/* Content Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Businesses" value={stats?.total_businesses ?? 0} />
        <StatsCard label="Events" value={stats?.total_events ?? 0} />
        <StatsCard label="Deals" value={stats?.total_deals ?? 0} />
        <StatsCard label="Forum Threads" value={stats?.total_forum_threads ?? 0} />
      </div>

      {/* Moderation & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Moderation Queue" value={stats?.moderation_queue_size ?? 0} />
        <StatsCard label="Published Today" value={stats?.content_published_today ?? 0} variant="success" />
        <StatsCard label="Avg Response Time" value={`${stats?.avg_response_time_hours ?? 0}h`} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/moderation"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-medium text-gray-900">Review Moderation Queue</p>
              <p className="text-sm text-gray-500">{stats?.moderation_queue_size ?? 0} items pending</p>
            </div>
          </Link>
          <Link
            href="/admin/approvals"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium text-gray-900">Approval Requests</p>
              <p className="text-sm text-gray-500">{stats?.pending_approvals ?? 0} awaiting review</p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-500">{stats?.new_users_this_week ?? 0} new this week</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
