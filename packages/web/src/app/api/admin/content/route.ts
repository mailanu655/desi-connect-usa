/**
 * Admin Content Management API Route (Week 14)
 * GET: List content with management filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidContentType } from '@desi-connect/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const contentType = searchParams.get('content_type');
    const status = searchParams.get('status');
    const query = searchParams.get('query');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');

    if (contentType && !isValidContentType(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content_type' },
        { status: 400 },
      );
    }

    const filters: Record<string, string | number> = {};
    if (contentType) filters.content_type = contentType;
    if (status) filters.status = status;
    if (query) filters.query = query;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    if (sortBy) filters.sort_by = sortBy;
    if (sortOrder) filters.sort_order = sortOrder;

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
    const message = error instanceof Error ? error.message : 'Failed to fetch content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
