export const dynamic = 'force-dynamic';
/**
 * Admin Moderation Queue API Route (Week 14)
 * GET: List moderation queue items with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateModerationQueueFilters } from '@desi-connect/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: Record<string, unknown> = {};
    const contentType = searchParams.get('content_type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const dateStart = searchParams.get('date_start');
    const dateEnd = searchParams.get('date_end');

    if (contentType) filters.content_type = contentType;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    if (dateStart && dateEnd) {
      filters.date_range = { start: dateStart, end: dateEnd };
    }

    const validation = validateModerationQueueFilters(filters);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 },
      );
    }

    // TODO: Wire to real database queries
    return NextResponse.json({
      data: {
        items: [],
        total: 0,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
        total_pages: 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch moderation queue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
