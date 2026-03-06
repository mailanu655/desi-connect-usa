export const dynamic = 'force-dynamic';
/**
 * Admin Users CRUD API Route (Week 14)
 * GET: List all admin users
 * POST: Create a new admin user
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCreateAdminUser } from '@desi-connect/shared';

export async function GET(_request: NextRequest) {
  try {
    // TODO: Wire to real database queries
    return NextResponse.json({
      data: [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateCreateAdminUser(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 },
      );
    }

    // TODO: Wire to real database + send invitation email
    return NextResponse.json(
      {
        data: {
          success: true,
          message: `Admin user created with role '${body.role}'`,
          admin_id: `admin_${Date.now()}`,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create admin user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
