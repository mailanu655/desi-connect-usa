export const dynamic = 'force-dynamic';
/**
 * Social Media Analytics API Route
 * GET: Retrieve analytics data with optional period/platform filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    const period = searchParams.get('period');
    const platform = searchParams.get('platform');

    if (period) params.period = period;
    if (platform) params.platform = platform;

    const data = await apiClient.getSocialAnalytics(params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social analytics' },
      { status: error.statusCode || 500 }
    );
  }
}
