/**
 * Giveaway Campaigns API Route
 * GET: List campaigns with filtering
 * POST: Create a new giveaway campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | number> = {};

    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    if (status) params.status = status;
    if (city) params.city = city;
    if (state) params.state = state;
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);

    const data = await apiClient.getGiveaways(params as any);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch giveaways' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ['title', 'description', 'prize_description', 'sponsor_name', 'start_date', 'end_date'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(body.end_date) <= new Date(body.start_date)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const data = await apiClient.createGiveaway(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create giveaway' },
      { status: error.statusCode || 500 }
    );
  }
}
