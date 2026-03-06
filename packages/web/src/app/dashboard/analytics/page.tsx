'use client';

import { useState, useEffect } from 'react';
import { calculateGrowthMetrics, formatMetricValue } from '@/lib/user-profile';
import type { AnalyticsOverview } from '@/lib/user-profile/analytics';

// Mock previous period data for comparison
const PREVIOUS_PERIOD: AnalyticsOverview = {
  total_users: 13250,
  total_businesses: 2650,
  total_events: 1100,
  total_deals: 780,
  total_jobs: 2900,
  total_consultancies: 420,
  active_users_30d: 8100,
  new_users_30d: 1050,
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics/overview');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" />
        <p className="mt-2 text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Failed to load analytics'}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Users',
      current: analytics.total_users,
      previous: PREVIOUS_PERIOD.total_users,
    },
    {
      label: 'Total Businesses',
      current: analytics.total_businesses,
      previous: PREVIOUS_PERIOD.total_businesses,
    },
    {
      label: 'Total Events',
      current: analytics.total_events,
      previous: PREVIOUS_PERIOD.total_events,
    },
    {
      label: 'Total Deals',
      current: analytics.total_deals,
      previous: PREVIOUS_PERIOD.total_deals,
    },
    {
      label: 'Total Jobs',
      current: analytics.total_jobs,
      previous: PREVIOUS_PERIOD.total_jobs,
    },
    {
      label: 'Total Consultancies',
      current: analytics.total_consultancies,
      previous: PREVIOUS_PERIOD.total_consultancies,
    },
    {
      label: 'Active Users (30d)',
      current: analytics.active_users_30d,
      previous: PREVIOUS_PERIOD.active_users_30d,
    },
    {
      label: 'New Users (30d)',
      current: analytics.new_users_30d,
      previous: PREVIOUS_PERIOD.new_users_30d,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="mt-2 text-gray-600">
          Overview of Desi Connect USA community metrics and growth
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const growth = calculateGrowthMetrics(
            metric.label,
            metric.current,
            metric.previous
          );

          const TrendIcon =
            growth.trend === 'up'
              ? () => (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 7H12z"
                      clipRule="evenodd"
                    />
                  </svg>
                )
              : growth.trend === 'down'
              ? () => (
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v3.586l4.293-4.293a1 1 0 011.414 1.414L9.414 13H12z"
                      clipRule="evenodd"
                    />
                  </svg>
                )
              : () => null;

          return (
            <div key={metric.label} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {formatMetricValue(growth.current)}
                </p>
                <div className="flex items-center gap-1">
                  <TrendIcon />
                  <span
                    className={`text-sm font-semibold ${
                      growth.trend === 'up'
                        ? 'text-green-600'
                        : growth.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {growth.trend === 'up' ? '+' : ''}{growth.change_percent}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Previously: {formatMetricValue(growth.previous)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Summary</h2>
        <div className="space-y-3 text-gray-700">
          <p>
            Desi Connect USA has grown to{' '}
            <strong className="text-gray-900">{formatMetricValue(analytics.total_users)}</strong> registered
            users, featuring <strong className="text-gray-900">{formatMetricValue(analytics.total_businesses)}</strong>{' '}
            businesses across the community.
          </p>
          <p>
            The platform hosts <strong className="text-gray-900">{formatMetricValue(analytics.total_events)}</strong> upcoming
            events and <strong className="text-gray-900">{formatMetricValue(analytics.total_deals)}</strong> active deals for
            the community to explore.
          </p>
          <p>
            Job opportunities number at{' '}
            <strong className="text-gray-900">{formatMetricValue(analytics.total_jobs)}</strong>, with{' '}
            <strong className="text-gray-900">{formatMetricValue(analytics.total_consultancies)}</strong> professional
            consultancies available for guidance and support.
          </p>
          <p>
            In the past 30 days, we've seen{' '}
            <strong className="text-gray-900">{formatMetricValue(analytics.active_users_30d)}</strong> active users and
            welcomed <strong className="text-gray-900">{formatMetricValue(analytics.new_users_30d)}</strong> new community
            members.
          </p>
        </div>
      </div>
    </div>
  );
}
