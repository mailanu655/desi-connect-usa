/**
 * Admin User Detail API Route (Week 14)
 * GET: Get a single user by ID
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

    // TODO: Wire to real database query
    return NextResponse.json({
      data: null,
      error: 'User not found',
    }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
