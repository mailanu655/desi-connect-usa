export const dynamic = 'force-dynamic';
/**
 * Forum Threads API Route
 * GET: List threads with filters (category, status, city, tags, sort, page, limit)
 * POST: Create new thread (validates using validateThreadInput from '@/lib/forum')
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { validateThreadInput } from '@/lib/forum';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | number> = {};

    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const tags = searchParams.get('tags');
    const sort = searchParams.get('sort');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    if (category) params.category = category;
    if (status) params.status = status;
    if (city) params.city = city;
    if (tags) params.tags = tags;
    if (sort) params.sort = sort;
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (search) params.search = search;

    const data = await apiClient.getForumThreads(params as any);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch forum threads' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate thread input
    const validation = validateThreadInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const data = await apiClient.createForumThread(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create forum thread' },
      { status: error.statusCode || 500 }
    );
  }
}
