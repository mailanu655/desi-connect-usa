'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import StatsCard from '@/components/admin/StatsCard';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import SparklineChart from '@/components/admin/SparklineChart';
import ExportButton from '@/components/admin/ExportButton';

interface AnalyticsData {
  metric: string;
  period: string;
  data_points: Array<{ date: string; value: number }>;
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
    trend_direction: 'up' | 'down' | 'flat';
    trend_percentage: number;
  };
}

const METRICS = [
  { value: 'user_registrations', label: 'User Registrations' },
  { value: 'active_users', label: 'Active Users' },
  { value: 'content_submissions', label: 'Content Submissions' },
  { value: 'page_views', label: 'Page Views' },
  { value: 'search_queries', label: 'Search Queries' },
  { value: 'business_listings', label: 'Business Listings' },
];

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
];

type ViewMode = 'chart' | 'table';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('user_registrations');
  const [timeRange, setTimeRange] = useState('30d');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate: Date;
      if (timeRange === '7d') startDate = new Date(now.getTime() - 7 * 86400000);
      else if (timeRange === '30d') startDate = new Date(now.getTime() - 30 * 86400000);
      else if (timeRange === '90d') startDate = new Date(now.getTime() - 90 * 86400000);
      else startDate = new Date(now.getTime() - 365 * 86400000);

      const params = new URLSearchParams({
        metric,
        start_date: startDate.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        granularity: timeRange === '1y' ? 'monthly' : timeRange === '90d' ? 'weekly' : 'daily',
      });

      const res = await fetch(`/api/admin/analytics/report?${params}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [metric, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Chart data derived from API data
  const chartData = useMemo(() => {
    if (!data?.data_points) return [];
    return data.data_points.map((dp) => ({
      date: dp.date,
      value: dp.value,
    }));
  }, [data]);

  // Sparkline values for the summary cards
  const sparklineValues = useMemo(() => {
    if (!data?.data_points) return [];
    return data.data_points.map((dp) => dp.value);
  }, [data]);

  // CSV export handler
  const getExportData = useCallback(async (): Promise<string[][]> => {
    if (!data?.data_points) return [];
    return data.data_points.map((dp) => [dp.date, String(dp.value)]);
  }, [data]);

  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? metric;
  const rangeLabel = TIME_RANGES.find((t) => t.value === timeRange)?.label ?? timeRange;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Platform metrics and performance analytics</p>
        </div>
        <ExportButton
          getData={getExportData}
          headers={['Date', metricLabel]}
          filename={`analytics-${metric}`}
          label="Export CSV"
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Select metric"
        >
          {METRICS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          aria-label="Select time range"
        >
          {TIME_RANGES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="ml-auto flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === 'chart'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Chart view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === 'table'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label="Table view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Stats with Sparklines */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            label="Total"
            value={data.summary.total.toLocaleString()}
            trend={data.summary.trend_percentage ? {
              value: data.summary.trend_percentage,
              direction: data.summary.trend_direction,
            } : undefined}
            icon={
              sparklineValues.length >= 2 ? (
                <SparklineChart
                  data={sparklineValues}
                  color={data.summary.trend_direction === 'down' ? '#dc2626' : '#ea580c'}
                />
              ) : undefined
            }
          />
          <StatsCard label="Average" value={data.summary.average.toLocaleString()} />
          <StatsCard label="Min" value={data.summary.min.toLocaleString()} />
          <StatsCard label="Max" value={data.summary.max.toLocaleString()} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {metricLabel} — {rangeLabel}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-r-transparent" />
          </div>
        ) : !data?.data_points || data.data_points.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No data available for this selection.</div>
        ) : viewMode === 'chart' ? (
          /* Chart View */
          <div className="p-6">
            <AnalyticsChart data={chartData} height={320} />
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data_points.map((dp) => (
                  <tr key={dp.date}>
                    <td className="px-6 py-3 text-sm text-gray-700">{dp.date}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {dp.value.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
