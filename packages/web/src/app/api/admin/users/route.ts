/**
 * Admin Users API Route (Week 14)
 * GET: List/search users with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserSearchParams } from '@desi-connect/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: Record<string, unknown> = {};
    const query = searchParams.get('query');
    const accountStatus = searchParams.get('account_status');
    const role = searchParams.get('role');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');

    if (query) params.query = query;
    if (accountStatus) params.account_status = accountStatus;
    if (role) params.role = role;
    if (page) params.page = parseInt(page, 10);
    if (limit) params.limit = parseInt(limit, 10);
    if (sortBy) params.sort_by = sortBy;
    if (sortOrder) params.sort_order = sortOrder;
    if (createdAfter) params.created_after = createdAfter;
    if (createdBefore) params.created_before = createdBefore;

    const validation = validateUserSearchParams(params);
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
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        total_pages: 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
