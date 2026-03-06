export const dynamic = 'force-dynamic';
/**
 * Analytics Overview API Route
 * GET: Retrieve mock analytics overview data
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsOverview } from '@/lib/user-profile/analytics';

export async function GET(request: NextRequest) {
  try {
    // Mock analytics data for dashboard review feature
    const analyticsData: AnalyticsOverview = {
      total_users: 15420,
      total_businesses: 2841,
      total_events: 1256,
      total_deals: 892,
      total_jobs: 3204,
      total_consultancies: 467,
      active_users_30d: 8932,
      new_users_30d: 1245,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
