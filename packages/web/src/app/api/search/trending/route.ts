/**
 * GET /api/search/trending - Trending search terms
 * Week 13: Search & Discovery
 */
import { NextRequest, NextResponse } from 'next/server';
import type { TrendingSearchesResponse } from '@desi-connect-usa/shared/src/types';

// In production, these would come from an analytics backend
const TRENDING_SEARCHES: TrendingSearchesResponse = {
  trending: [
    { query: 'H-1B visa 2026', search_count: 1250, trend: 'up' },
    { query: 'Indian restaurants', search_count: 980, trend: 'stable' },
    { query: 'Diwali events', search_count: 870, trend: 'down' },
    { query: 'IT jobs', search_count: 760, trend: 'up' },
    { query: 'Tax consultants', search_count: 650, trend: 'up' },
    { query: 'Grocery deals', search_count: 540, trend: 'stable' },
    { query: 'Community meetup', search_count: 430, trend: 'up' },
    { query: 'Immigration lawyer', search_count: 390, trend: 'stable' },
  ],
  period: 'weekly',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') === 'daily' ? 'daily' : 'weekly';
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) || 8 : 8;

  const response: TrendingSearchesResponse = {
    trending: TRENDING_SEARCHES.trending.slice(0, limit),
    period,
  };

  return NextResponse.json(response);
}
