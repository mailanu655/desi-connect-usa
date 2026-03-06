export const dynamic = 'force-dynamic';
/**
 * Admin User Action History API Route (Week 14)
 * GET: Retrieve action history for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteParams,
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // TODO: Wire to real database queries
    return NextResponse.json({ data: [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
