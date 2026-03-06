export const dynamic = 'force-dynamic';
/**
 * Admin Approval Detail API Route (Week 14)
 * GET: Get a single approval request by ID
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteParams,
) {
  try {
    const { requestId } = await context.params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 },
      );
    }

    // TODO: Wire to real database query
    return NextResponse.json({
      data: null,
      error: 'Approval request not found',
    }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch approval request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
