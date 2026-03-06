/**
 * Social Media Posts API Route
 * GET: List posts with filtering
 * POST: Create a new social media post
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | number> = {};

    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (status) params.status = status;
    if (platform) params.platform = platform;
    if (category) params.category = category;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);

    const data = await apiClient.getSocialPosts(params as any);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social posts' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.caption || !body.platforms || !body.scheduled_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, caption, platforms, scheduled_date' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.platforms) || body.platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform must be selected' },
        { status: 400 }
      );
    }

    const data = await apiClient.createSocialPost(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create social post' },
      { status: error.statusCode || 500 }
    );
  }
}
