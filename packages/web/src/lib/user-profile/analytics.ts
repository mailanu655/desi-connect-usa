/**
 * Analytics Helper Utilities
 * Provides functions for analytics calculations and formatting
 */

export interface AnalyticsOverview {
  total_users: number;
  total_businesses: number;
  total_events: number;
  total_deals: number;
  total_jobs: number;
  total_consultancies: number;
  active_users_30d: number;
  new_users_30d: number;
}

export interface GrowthMetric {
  label: string;
  current: number;
  previous: number;
  change_percent: number;
  trend: 'up' | 'down' | 'flat';
}

/**
 * Calculates growth metrics between two periods
 */
export function calculateGrowthMetrics(
  label: string,
  current: number,
  previous: number
): GrowthMetric {
  let change_percent = 0;
  if (previous !== 0) {
    change_percent = Math.round(((current - previous) / previous) * 100);
  }

  const trend = getGrowthTrend(change_percent);

  return {
    label,
    current,
    previous,
    change_percent,
    trend,
  };
}

/**
 * Formats large numbers with K/M suffixes
 */
export function formatMetricValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}

/**
 * Determines growth trend based on percentage change
 */
export function getGrowthTrend(changePercent: number): 'up' | 'down' | 'flat' {
  if (changePercent > 0) return 'up';
  if (changePercent < 0) return 'down';
  return 'flat';
}
