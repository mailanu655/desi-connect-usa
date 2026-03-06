export const dynamic = 'force-dynamic';
/**
 * Admin User Detail API Route (Week 14)
 * GET: Retrieve a specific admin user
 * PUT: Update an admin user
 * DELETE: Remove an admin user
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUpdateAdminUser } from '@desi-connect/shared';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(_request: NextRequest, context: RouteParams) {
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
      message: `Admin user ${userId} not found`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await context.params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    const validation = validateUpdateAdminUser(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 },
      );
    }

    // TODO: Wire to real database update
    return NextResponse.json({
      data: {
        success: true,
        message: `Admin user ${userId} updated`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update admin user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // TODO: Wire to real database deletion + audit log
    return NextResponse.json({
      data: {
        success: true,
        message: `Admin user ${userId} removed`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete admin user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
